#!/usr/bin/env node

/**
 * MongoDB数据库备份脚本
 * 
 * 功能特性：
 * - 自动备份dcMes数据库
 * - 生成带时间戳的备份文件名
 * - 支持gzip压缩
 * - 详细的日志记录
 * - 错误处理和重试机制
 * - 自动清理旧备份文件
 * - 备份验证功能
 * 
 * 使用方法：
 * node backup_mongodb.js
 * 
 * 环境变量配置：
 * BACKUP_PATH - 备份文件存储路径（默认：./backups）
 * KEEP_DAYS - 保留备份天数（默认：7天）
 * COMPRESS - 是否压缩备份（默认：true）
 * 
 * @Author: 系统管理员
 * @Date: 2024
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class MongoDBBackup {
  constructor() {
    // 数据库连接配置（从db.js文件获取）
    this.config = {
      host: '47.115.19.76',
      port: '27017',
      database: 'dcMes',
      username: 'dcMes',
      password: 'dcMes123.',
      authDatabase: 'dcMes' // 认证数据库
    };

    // 备份配置
    this.backupConfig = {
      backupPath: process.env.BACKUP_PATH || './backups',
      keepDays: parseInt(process.env.KEEP_DAYS) || 7,
      compress: process.env.COMPRESS !== 'false',
      maxRetries: 3,
      retryDelay: 5000 // 重试延迟5秒
    };

    // 确保备份目录存在
    this.ensureBackupDirectory();
  }

  /**
   * 确保备份目录存在
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupConfig.backupPath)) {
      fs.mkdirSync(this.backupConfig.backupPath, { recursive: true });
      this.log('创建备份目录:', this.backupConfig.backupPath);
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
    const logFile = path.join(this.backupConfig.backupPath, 'backup.log');
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
    const logFile = path.join(this.backupConfig.backupPath, 'backup.log');
    const logLine = `${errorMessage} ${error.message}\n${error.stack}\n`;
    fs.appendFileSync(logFile, logLine);
  }

  /**
   * 生成备份文件名
   * @returns {string} 备份文件名
   */
  generateBackupFileName() {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .split('.')[0]; // 移除毫秒部分
    
    const fileName = `dcMes_backup_${timestamp}`;
    return this.backupConfig.compress ? `${fileName}.gz` : fileName;
  }

  /**
   * 构建mongodump命令
   * @param {string} outputPath - 输出路径
   * @returns {string} mongodump命令
   */
  buildMongodumpCommand(outputPath) {
    const { host, port, database, username, password, authDatabase } = this.config;
    
    let command = `mongodump`;
    command += ` --host ${host}:${port}`;
    command += ` --db ${database}`;
    command += ` --username ${username}`;
    command += ` --password "${password}"`;
    command += ` --authenticationDatabase ${authDatabase}`;
    command += ` --out "${outputPath}"`;
    
    // 添加其他有用选项
    command += ` --gzip`; // 启用gzip压缩传输
    command += ` --forceTableScan`; // 强制表扫描，避免索引问题
    
    return command;
  }

  /**
   * 检查mongodump是否可用
   * @returns {Promise<boolean>} 是否可用
   */
  async checkMongodumpAvailable() {
    try {
      await execAsync('mongodump --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 执行数据库备份
   * @param {number} retryCount - 重试次数
   * @returns {Promise<string>} 备份文件路径
   */
  async performBackup(retryCount = 0) {
    this.log('开始数据库备份...');
    
    // 检查mongodump是否可用
    if (!(await this.checkMongodumpAvailable())) {
      throw new Error('mongodump命令不可用，请确保已安装MongoDB数据库工具');
    }

    const backupFileName = this.generateBackupFileName();
    const tempBackupPath = path.join(this.backupConfig.backupPath, 'temp');
    const finalBackupPath = path.join(this.backupConfig.backupPath, backupFileName);

    try {
      // 清理临时目录
      if (fs.existsSync(tempBackupPath)) {
        fs.rmSync(tempBackupPath, { recursive: true, force: true });
      }

      // 执行mongodump
      const command = this.buildMongodumpCommand(tempBackupPath);
      this.log('执行备份命令...');
      
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(command);
      const duration = Date.now() - startTime;
      
      if (stderr && !stderr.includes('done dumping')) {
        this.log('备份警告:', stderr);
      }

      this.log(`数据库备份完成，耗时: ${duration}ms`);

      // 压缩备份文件
      if (this.backupConfig.compress) {
        await this.compressBackup(tempBackupPath, finalBackupPath);
      } else {
        // 移动备份文件
        fs.renameSync(path.join(tempBackupPath, this.config.database), finalBackupPath);
      }

      // 清理临时文件
      if (fs.existsSync(tempBackupPath)) {
        fs.rmSync(tempBackupPath, { recursive: true, force: true });
      }

      // 验证备份文件
      await this.verifyBackup(finalBackupPath);

      this.log('备份成功完成:', finalBackupPath);
      return finalBackupPath;

    } catch (error) {
      this.logError('备份过程中发生错误', error);
      
      // 清理失败的备份文件
      if (fs.existsSync(tempBackupPath)) {
        fs.rmSync(tempBackupPath, { recursive: true, force: true });
      }
      if (fs.existsSync(finalBackupPath)) {
        fs.unlinkSync(finalBackupPath);
      }

      // 重试机制
      if (retryCount < this.backupConfig.maxRetries) {
        this.log(`${this.backupConfig.retryDelay/1000}秒后进行第${retryCount + 1}次重试...`);
        await this.sleep(this.backupConfig.retryDelay);
        return await this.performBackup(retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * 压缩备份文件
   * @param {string} sourcePath - 源路径
   * @param {string} targetPath - 目标路径
   */
  async compressBackup(sourcePath, targetPath) {
    this.log('正在压缩备份文件...');
    
    const command = `tar -czf "${targetPath}" -C "${sourcePath}" .`;
    const startTime = Date.now();
    
    await execAsync(command);
    
    const duration = Date.now() - startTime;
    this.log(`备份文件压缩完成，耗时: ${duration}ms`);
  }

  /**
   * 验证备份文件
   * @param {string} backupPath - 备份文件路径
   */
  async verifyBackup(backupPath) {
    this.log('验证备份文件...');
    
    const stats = fs.statSync(backupPath);
    
    if (stats.size === 0) {
      throw new Error('备份文件为空');
    }
    
    if (stats.size < 1024) { // 小于1KB可能有问题
      this.log('警告: 备份文件大小异常小:', stats.size);
    }
    
    this.log('备份文件验证通过:', {
      size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      path: backupPath
    });
  }

  /**
   * 清理旧备份文件
   */
  async cleanupOldBackups() {
    this.log('清理旧备份文件...');
    
    try {
      const files = fs.readdirSync(this.backupConfig.backupPath);
      const backupFiles = files.filter(file => 
        file.startsWith('dcMes_backup_') && 
        (file.endsWith('.gz') || !file.includes('.'))
      );

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.backupConfig.keepDays);

      let deletedCount = 0;
      
      for (const file of backupFiles) {
        const filePath = path.join(this.backupConfig.backupPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          this.log('删除旧备份文件:', file);
        }
      }

      this.log(`清理完成，删除了 ${deletedCount} 个旧备份文件`);
      
    } catch (error) {
      this.logError('清理旧备份文件时发生错误', error);
    }
  }

  /**
   * 获取备份状态信息
   */
  getBackupStatus() {
    const backupPath = this.backupConfig.backupPath;
    
    if (!fs.existsSync(backupPath)) {
      return { totalBackups: 0, totalSize: 0, oldestBackup: null, newestBackup: null };
    }

    const files = fs.readdirSync(backupPath);
    const backupFiles = files.filter(file => 
      file.startsWith('dcMes_backup_') && 
      (file.endsWith('.gz') || !file.includes('.'))
    );

    let totalSize = 0;
    let oldestBackup = null;
    let newestBackup = null;

    for (const file of backupFiles) {
      const filePath = path.join(backupPath, file);
      const stats = fs.statSync(filePath);
      
      totalSize += stats.size;
      
      if (!oldestBackup || stats.mtime < oldestBackup.mtime) {
        oldestBackup = { name: file, mtime: stats.mtime, size: stats.size };
      }
      
      if (!newestBackup || stats.mtime > newestBackup.mtime) {
        newestBackup = { name: file, mtime: stats.mtime, size: stats.size };
      }
    }

    return {
      totalBackups: backupFiles.length,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      oldestBackup,
      newestBackup
    };
  }

  /**
   * 睡眠函数
   * @param {number} ms - 毫秒数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 主备份函数
   */
  async run() {
    const startTime = Date.now();
    
    try {
      this.log('='.repeat(60));
      this.log('MongoDB数据库备份任务开始');
      this.log('数据库:', `${this.config.host}:${this.config.port}/${this.config.database}`);
      this.log('备份路径:', this.backupConfig.backupPath);
      this.log('='.repeat(60));

      // 显示当前备份状态
      const status = this.getBackupStatus();
      this.log('当前备份状态:', status);

      // 执行备份
      const backupFile = await this.performBackup();
      
      // 清理旧备份
      await this.cleanupOldBackups();
      
      const duration = Date.now() - startTime;
      
      this.log('='.repeat(60));
      this.log('备份任务完成');
      this.log('备份文件:', backupFile);
      this.log('总耗时:', `${(duration / 1000).toFixed(2)}秒`);
      this.log('='.repeat(60));

      // 显示最新备份状态
      const newStatus = this.getBackupStatus();
      this.log('更新后备份状态:', newStatus);

      return { success: true, backupFile, duration };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logError('备份任务失败', error);
      this.log('='.repeat(60));
      this.log('备份任务失败');
      this.log('失败原因:', error.message);
      this.log('总耗时:', `${(duration / 1000).toFixed(2)}秒`);
      this.log('='.repeat(60));

      return { success: false, error: error.message, duration };
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const backup = new MongoDBBackup();
  
  backup.run().then(result => {
    if (result.success) {
      console.log('\n✅ 备份任务成功完成');
      process.exit(0);
    } else {
      console.error('\n❌ 备份任务失败:', result.error);
      process.exit(1);
    }
  }).catch(error => {
    console.error('\n💥 备份任务异常:', error.message);
    process.exit(1);
  });
}

module.exports = MongoDBBackup; 