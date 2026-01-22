#!/usr/bin/env node

/**
 * MongoDB数据库恢复脚本
 * 
 * 功能特性：
 * - 从备份文件恢复dcMes数据库
 * - 支持gzip压缩文件恢复
 * - 详细的日志记录
 * - 错误处理和验证
 * - 安全性检查和确认
 * - 恢复前数据库备份
 * 
 * 使用方法：
 * node restore_mongodb.js [backup_file_path]
 * 
 * 环境变量配置：
 * TARGET_DB - 目标数据库名（默认：dcMes_restore）
 * DROP_EXISTING - 是否删除现有数据（默认：false）
 * BACKUP_BEFORE_RESTORE - 恢复前是否备份（默认：true）
 * 
 * @Author: 系统管理员
 * @Date: 2024
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const readline = require('readline');

const execAsync = util.promisify(exec);

class MongoDBRestore {
  constructor() {
    // 数据库连接配置（从db.js文件获取）
    this.config = {
      host: '47.115.19.76',
      port: '27017',
      sourceDatabase: 'dcMes',
      username: 'dcMes',
      password: 'dcMes123.',
      authDatabase: 'dcMes'
    };

    // 恢复配置
    this.restoreConfig = {
      targetDatabase: process.env.TARGET_DB || 'dcMes_restore',
      dropExisting: process.env.DROP_EXISTING === 'true',
      backupBeforeRestore: process.env.BACKUP_BEFORE_RESTORE !== 'false',
      logPath: './restore_logs',
      maxRetries: 3,
      retryDelay: 5000
    };

    // 确保日志目录存在
    this.ensureLogDirectory();

    // 创建readline接口
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * 确保日志目录存在
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.restoreConfig.logPath)) {
      fs.mkdirSync(this.restoreConfig.logPath, { recursive: true });
    }
  }

  /**
   * 日志记录
   * @param {string} message - 日志消息
   * @param {*} data - 附加数据
   */
  log(message, data = '') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }

    // 写入日志文件
    const logFile = path.join(this.restoreConfig.logPath, 'restore.log');
    const logLine = `${logMessage} ${data ? JSON.stringify(data) : ''}\n`;
    fs.appendFileSync(logFile, logLine);
  }

  /**
   * 错误日志记录
   * @param {string} message - 错误消息
   * @param {Error} error - 错误对象
   */
  logError(message, error) {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ERROR: ${message}`;
    
    console.error(errorMessage, error.message);
    
    // 写入错误日志
    const logFile = path.join(this.restoreConfig.logPath, 'restore.log');
    const logLine = `${errorMessage} ${error.message}\n${error.stack}\n`;
    fs.appendFileSync(logFile, logLine);
  }

  /**
   * 检查mongorestore是否可用
   * @returns {Promise<boolean>} 是否可用
   */
  async checkMongorestoreAvailable() {
    try {
      await execAsync('mongorestore --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证备份文件
   * @param {string} backupPath - 备份文件路径
   * @returns {Promise<Object>} 验证结果
   */
  async validateBackupFile(backupPath) {
    this.log('验证备份文件:', backupPath);

    // 检查文件是否存在
    if (!fs.existsSync(backupPath)) {
      throw new Error(`备份文件不存在: ${backupPath}`);
    }

    const stats = fs.statSync(backupPath);
    
    if (stats.size === 0) {
      throw new Error('备份文件为空');
    }

    // 检查文件类型
    const isCompressed = backupPath.endsWith('.gz');
    const isDirectory = stats.isDirectory();

    this.log('备份文件信息:', {
      size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      isCompressed,
      isDirectory,
      lastModified: stats.mtime.toISOString()
    });

    return { isCompressed, isDirectory, size: stats.size };
  }

  /**
   * 列出可用的备份文件
   * @returns {Array} 备份文件列表
   */
  listAvailableBackups() {
    const backupDir = './backups';
    
    if (!fs.existsSync(backupDir)) {
      return [];
    }

    const files = fs.readdirSync(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('dcMes_backup_'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          mtime: stats.mtime,
          sizeText: `${(stats.size / 1024 / 1024).toFixed(2)} MB`
        };
      })
      .sort((a, b) => b.mtime - a.mtime); // 按时间降序排列

    return backupFiles;
  }

  /**
   * 交互式选择备份文件
   * @returns {Promise<string>} 选择的备份文件路径
   */
  async selectBackupFile() {
    const backups = this.listAvailableBackups();
    
    if (backups.length === 0) {
      throw new Error('没有找到可用的备份文件');
    }

    console.log('\n可用的备份文件:');
    console.log('='.repeat(80));
    
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.name}`);
      console.log(`   大小: ${backup.sizeText}`);
      console.log(`   时间: ${backup.mtime.toLocaleString()}`);
      console.log('');
    });

    return new Promise((resolve, reject) => {
      this.rl.question('请选择要恢复的备份文件 (输入编号): ', (answer) => {
        const choice = parseInt(answer);
        
        if (isNaN(choice) || choice < 1 || choice > backups.length) {
          reject(new Error('无效的选择'));
          return;
        }

        resolve(backups[choice - 1].path);
      });
    });
  }

  /**
   * 确认操作
   * @param {string} message - 确认消息
   * @returns {Promise<boolean>} 是否确认
   */
  async confirm(message) {
    return new Promise((resolve) => {
      this.rl.question(`${message} (y/N): `, (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  /**
   * 检查目标数据库是否存在
   * @param {string} database - 数据库名
   * @returns {Promise<boolean>} 是否存在
   */
  async checkDatabaseExists(database) {
    try {
      const { host, port, username, password, authDatabase } = this.config;
      
      const command = `mongo mongodb://${username}:${encodeURIComponent(password)}@${host}:${port}/${authDatabase} --eval "db.adminCommand('listDatabases').databases.forEach(function(db) { if(db.name === '${database}') print('EXISTS') })"`;
      
      const { stdout } = await execAsync(command);
      return stdout.includes('EXISTS');
    } catch (error) {
      this.logError('检查数据库是否存在时出错', error);
      return false;
    }
  }

  /**
   * 创建恢复前备份
   * @param {string} targetDatabase - 目标数据库
   * @returns {Promise<string>} 备份文件路径
   */
  async createPreRestoreBackup(targetDatabase) {
    this.log('创建恢复前备份...');

    const dbExists = await this.checkDatabaseExists(targetDatabase);
    if (!dbExists) {
      this.log('目标数据库不存在，跳过恢复前备份');
      return null;
    }

    const MongoDBBackup = require('./backup_mongodb.js');
    const backup = new MongoDBBackup();
    
    // 临时修改配置以备份目标数据库
    const originalDb = backup.config.database;
    backup.config.database = targetDatabase;
    backup.backupConfig.backupPath = path.join(this.restoreConfig.logPath, 'pre_restore_backup');
    
    try {
      const result = await backup.performBackup();
      backup.config.database = originalDb; // 恢复原配置
      
      this.log('恢复前备份完成:', result);
      return result;
    } catch (error) {
      backup.config.database = originalDb; // 恢复原配置
      throw error;
    }
  }

  /**
   * 构建mongorestore命令
   * @param {string} backupPath - 备份文件路径
   * @param {Object} fileInfo - 文件信息
   * @returns {string} mongorestore命令
   */
  buildMongorestoreCommand(backupPath, fileInfo) {
    const { host, port, username, password, authDatabase } = this.config;
    const { targetDatabase, dropExisting } = this.restoreConfig;
    
    let command = `mongorestore`;
    command += ` --host ${host}:${port}`;
    command += ` --username ${username}`;
    command += ` --password "${password}"`;
    command += ` --authenticationDatabase ${authDatabase}`;
    command += ` --db ${targetDatabase}`;
    
    if (dropExisting) {
      command += ` --drop`;
    }
    
    // 根据文件类型设置不同的选项
    if (fileInfo.isCompressed && !fileInfo.isDirectory) {
      command += ` --gzip --archive="${backupPath}"`;
    } else if (fileInfo.isDirectory) {
      command += ` "${path.join(backupPath, this.config.sourceDatabase)}"`;
    } else {
      command += ` --archive="${backupPath}"`;
    }
    
    // 添加其他选项
    command += ` --numParallelCollections=4`; // 并行恢复集合数量
    command += ` --numInsertionWorkersPerCollection=1`; // 每个集合的插入工作线程
    
    return command;
  }

  /**
   * 执行数据库恢复
   * @param {string} backupPath - 备份文件路径
   * @param {number} retryCount - 重试次数
   * @returns {Promise<Object>} 恢复结果
   */
  async performRestore(backupPath, retryCount = 0) {
    this.log('开始数据库恢复...');
    
    // 检查mongorestore是否可用
    if (!(await this.checkMongorestoreAvailable())) {
      throw new Error('mongorestore命令不可用，请确保已安装MongoDB数据库工具');
    }

    // 验证备份文件
    const fileInfo = await this.validateBackupFile(backupPath);

    try {
      // 执行mongorestore
      const command = this.buildMongorestoreCommand(backupPath, fileInfo);
      this.log('执行恢复命令...');
      
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(command, { 
        maxBuffer: 1024 * 1024 * 100 // 100MB缓冲区
      });
      const duration = Date.now() - startTime;
      
      if (stderr) {
        this.log('恢复警告:', stderr);
      }

      this.log(`数据库恢复完成，耗时: ${duration}ms`);
      this.log('恢复输出:', stdout);

      return {
        success: true,
        duration,
        targetDatabase: this.restoreConfig.targetDatabase
      };

    } catch (error) {
      this.logError('恢复过程中发生错误', error);
      
      // 重试机制
      if (retryCount < this.restoreConfig.maxRetries) {
        this.log(`${this.restoreConfig.retryDelay/1000}秒后进行第${retryCount + 1}次重试...`);
        await this.sleep(this.restoreConfig.retryDelay);
        return await this.performRestore(backupPath, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * 验证恢复结果
   * @param {string} targetDatabase - 目标数据库
   * @returns {Promise<Object>} 验证结果
   */
  async verifyRestore(targetDatabase) {
    this.log('验证恢复结果...');
    
    try {
      const { host, port, username, password, authDatabase } = this.config;
      
      // 获取集合列表和文档计数
      const command = `mongo mongodb://${username}:${encodeURIComponent(password)}@${host}:${port}/${authDatabase} --eval "
        use ${targetDatabase};
        var collections = db.getCollectionNames();
        var stats = {};
        collections.forEach(function(col) {
          stats[col] = db[col].count();
        });
        print('STATS:' + JSON.stringify(stats));
      "`;
      
      const { stdout } = await execAsync(command);
      const statsMatch = stdout.match(/STATS:(.+)/);
      
      if (statsMatch) {
        const stats = JSON.parse(statsMatch[1]);
        
        this.log('恢复验证结果:', {
          database: targetDatabase,
          collections: Object.keys(stats).length,
          totalDocuments: Object.values(stats).reduce((sum, count) => sum + count, 0),
          collectionStats: stats
        });

        return { success: true, stats };
      } else {
        throw new Error('无法获取恢复验证统计信息');
      }
      
    } catch (error) {
      this.logError('验证恢复结果时发生错误', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 睡眠函数
   * @param {number} ms - 毫秒数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.rl) {
      this.rl.close();
    }
  }

  /**
   * 主恢复函数
   * @param {string} backupFilePath - 备份文件路径（可选）
   */
  async run(backupFilePath) {
    const startTime = Date.now();
    
    try {
      this.log('='.repeat(60));
      this.log('MongoDB数据库恢复任务开始');
      this.log('目标数据库:', this.restoreConfig.targetDatabase);
      this.log('='.repeat(60));

      // 选择备份文件
      let selectedBackupFile;
      if (backupFilePath) {
        selectedBackupFile = backupFilePath;
      } else {
        selectedBackupFile = await this.selectBackupFile();
      }

      this.log('选择的备份文件:', selectedBackupFile);

      // 安全确认
      console.log('\n⚠️  警告：此操作将恢复数据库，可能会覆盖现有数据！');
      console.log(`目标数据库: ${this.restoreConfig.targetDatabase}`);
      console.log(`删除现有数据: ${this.restoreConfig.dropExisting ? '是' : '否'}`);
      console.log(`恢复前备份: ${this.restoreConfig.backupBeforeRestore ? '是' : '否'}`);

      const confirmed = await this.confirm('\n确定要继续恢复操作吗？');
      if (!confirmed) {
        this.log('用户取消了恢复操作');
        return { success: false, reason: '用户取消' };
      }

      // 恢复前备份
      let preRestoreBackup = null;
      if (this.restoreConfig.backupBeforeRestore) {
        try {
          preRestoreBackup = await this.createPreRestoreBackup(this.restoreConfig.targetDatabase);
        } catch (error) {
          this.logError('创建恢复前备份失败', error);
          
          const continueAnyway = await this.confirm('恢复前备份失败，是否继续恢复操作？');
          if (!continueAnyway) {
            return { success: false, reason: '恢复前备份失败' };
          }
        }
      }

      // 执行恢复
      const restoreResult = await this.performRestore(selectedBackupFile);
      
      // 验证恢复结果
      const verifyResult = await this.verifyRestore(this.restoreConfig.targetDatabase);
      
      const duration = Date.now() - startTime;
      
      this.log('='.repeat(60));
      this.log('恢复任务完成');
      this.log('备份文件:', selectedBackupFile);
      this.log('目标数据库:', this.restoreConfig.targetDatabase);
      this.log('总耗时:', `${(duration / 1000).toFixed(2)}秒`);
      if (preRestoreBackup) {
        this.log('恢复前备份:', preRestoreBackup);
      }
      this.log('='.repeat(60));

      return {
        success: true,
        backupFile: selectedBackupFile,
        targetDatabase: this.restoreConfig.targetDatabase,
        duration,
        preRestoreBackup,
        verifyResult
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logError('恢复任务失败', error);
      this.log('='.repeat(60));
      this.log('恢复任务失败');
      this.log('失败原因:', error.message);
      this.log('总耗时:', `${(duration / 1000).toFixed(2)}秒`);
      this.log('='.repeat(60));

      return { success: false, error: error.message, duration };
      
    } finally {
      this.cleanup();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const backupFilePath = process.argv[2]; // 从命令行参数获取备份文件路径
  const restore = new MongoDBRestore();
  
  restore.run(backupFilePath).then(result => {
    if (result.success) {
      console.log('\n✅ 恢复任务成功完成');
      process.exit(0);
    } else {
      console.error('\n❌ 恢复任务失败:', result.error || result.reason);
      process.exit(1);
    }
  }).catch(error => {
    console.error('\n💥 恢复任务异常:', error.message);
    process.exit(1);
  });
}

module.exports = MongoDBRestore; 