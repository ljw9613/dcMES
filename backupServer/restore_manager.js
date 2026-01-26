#!/usr/bin/env node

/**
 * MongoDB备份还原管理器
 * 
 * 功能特性：
 * - 支持从增量备份文件还原数据
 * - 支持选择性还原（特定集合、时间范围）
 * - 支持归档文件和目录还原
 * - 提供还原进度监控
 * - 支持还原前数据验证和备份
 * - 灵活的还原策略配置
 * - 详细的操作日志记录
 * 
 * 使用方法：
 * node restore_manager.js --list                           # 列出可用的备份文件
 * node restore_manager.js --restore --file=backup.archive  # 还原指定备份文件
 * node restore_manager.js --restore --collection=users     # 还原指定集合
 * node restore_manager.js --restore --date=2024-01-01      # 还原指定日期的备份
 * node restore_manager.js --interactive                    # 交互式还原
 * node restore_manager.js --verify --file=backup.archive   # 验证备份文件
 * 
 * 环境变量配置：
 * RESTORE_TARGET_DB - 目标数据库名称（默认使用原数据库）
 * RESTORE_DRY_RUN - 是否为试运行模式
 * 
 * @Author: 系统管理员
 * @Date: 2024
 * @Version: 1.0.0
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const os = require('os');
const readline = require('readline');

// 导入配置文件
const config = require('./config');

const execAsync = util.promisify(exec);

class RestoreManager {
  constructor() {
    // 从配置文件加载数据库连接配置
    this.config = config.database;

    // 从配置文件加载备份配置
    this.backupConfig = {
      backupPath: config.paths.backupPath,
      strategies: config.strategies,
      toolsPath: config.paths.toolsPath
    };

    // 还原配置
    this.restoreConfig = {
      // 还原前是否创建安全备份
      createSafetyBackup: process.env.RESTORE_SAFETY_BACKUP !== 'false',
      
      // 是否为试运行模式
      dryRun: process.env.RESTORE_DRY_RUN === 'true',
      
      // 目标数据库（如果不同于源数据库）
      targetDatabase: process.env.RESTORE_TARGET_DB || this.config.database,
      
      // 还原模式：replace（替换）、merge-skip（合并-跳过重复）、merge-upsert（合并-更新重复）
      restoreMode: process.env.RESTORE_MODE || 'merge-skip',  // 改为更安全的合并模式
      
      // 并发还原限制
      parallelLimit: parseInt(process.env.RESTORE_PARALLEL || '2'),
      
      // 还原验证
      verifyAfterRestore: true
    };

    this.isWindows = os.platform() === 'win32';
    this.mongorestorePath = null;
    this.mongodumpPath = null;

    // 初始化
    this.init();
  }

  /**
   * 初始化管理器
   */
  init() {
    this.ensureLogDirectory();
    this.checkTools();
  }

  /**
   * 确保日志目录存在
   */
  ensureLogDirectory() {
    const logDir = path.join(this.backupConfig.backupPath, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * 检查MongoDB工具是否可用
   */
  async checkTools() {
    try {
      // 检查本地工具路径
      const toolsDir = path.join(__dirname, this.backupConfig.toolsPath, '100', 'bin');
      const mongorestore = path.join(toolsDir, this.isWindows ? 'mongorestore.exe' : 'mongorestore');
      const mongodump = path.join(toolsDir, this.isWindows ? 'mongodump.exe' : 'mongodump');

      if (fs.existsSync(mongorestore)) {
        this.mongorestorePath = mongorestore;
        this.log('找到本地mongorestore工具:', mongorestore);
      } else {
        // 尝试系统路径
        await execAsync('mongorestore --version');
        this.mongorestorePath = 'mongorestore';
        this.log('使用系统mongorestore工具');
      }

      if (fs.existsSync(mongodump)) {
        this.mongodumpPath = mongodump;
      } else {
        this.mongodumpPath = 'mongodump';
      }

    } catch (error) {
      this.logError('MongoDB工具检查失败', error);
      throw new Error('无法找到MongoDB还原工具，请确保已安装MongoDB数据库工具');
    }
  }

  /**
   * 日志记录
   */
  log(message, data = '') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [RestoreManager] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }

    // 写入日志文件
    const logFile = path.join(this.backupConfig.backupPath, 'logs', 'restore.log');
    const logLine = `${logMessage} ${data ? JSON.stringify(data) : ''}\n`;
    
    try {
      fs.appendFileSync(logFile, logLine);
    } catch (e) {
      // 忽略日志写入错误
    }
  }

  /**
   * 错误日志记录
   */
  logError(message, error) {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] [RestoreManager] ERROR: ${message}`;
    
    console.error(errorMessage, error.message);
    
    const logFile = path.join(this.backupConfig.backupPath, 'logs', 'restore.log');
    const logLine = `${errorMessage} ${error.message}\n${error.stack}\n`;
    
    try {
      fs.appendFileSync(logFile, logLine);
    } catch (e) {
      // 忽略日志写入错误
    }
  }

  /**
   * 扫描可用的备份文件（适配日期+类型的二级目录结构）
   */
  scanBackupFiles() {
    const backupFiles = [];
    const basePath = this.backupConfig.backupPath;
    
    try {
      // 获取所有项目（日期目录和其他）
      const items = fs.readdirSync(basePath);
      
      for (const item of items) {
        // 跳过日志目录和其他非日期目录
        if (item === 'logs' || item === 'safety_backups' || !item.match(/^\d{4}-\d{2}-\d{2}$/)) {
          continue;
        }
        
        const dateDir = path.join(basePath, item);
        
        // 检查是否为目录
        if (!fs.statSync(dateDir).isDirectory()) {
          continue;
        }
        
        // 扫描日期目录下的类型子目录
        const typeItems = fs.readdirSync(dateDir);
        
        for (const typeItem of typeItems) {
          const typeDir = path.join(dateDir, typeItem);
          
          // 检查是否为目录
          if (!fs.statSync(typeDir).isDirectory()) {
            continue;
          }
          
          // 扫描类型目录中的备份文件
          const files = fs.readdirSync(typeDir);
          
          for (const file of files) {
            // 匹配备份文件格式（支持新的文件名前缀）
            if (this.isBackupFile(file)) {
              const filePath = path.join(typeDir, file);
              const stats = fs.statSync(filePath);
              
              // 解析文件名获取信息
              const fileInfo = this.parseBackupFileName(file);
              
              backupFiles.push({
                dateDir: item,        // 日期目录名 (如: 2024-09-20)
                category: typeItem,   // 类型目录名 (如: hot, daily, full)
                fileName: file,
                filePath,
                size: stats.size,
                modifiedTime: stats.mtime,
                createdTime: stats.birthtime,
                ...fileInfo
              });
            }
          }
        }
      }
    } catch (error) {
      this.logError('扫描备份文件失败', error);
    }

    // 按时间倒序排列
    return backupFiles.sort((a, b) => b.modifiedTime - a.modifiedTime);
  }

  /**
   * 检查是否为备份文件
   */
  isBackupFile(fileName) {
    // 支持新的文件名格式：full_, daily_, 30d_, custom_ 等
    const backupPrefixes = ['full_', 'daily_', 'incremental_', /^\d+[hd]_/, 'custom_'];
    const backupExtensions = ['.archive', '.archive.gz'];
    
    const hasValidPrefix = backupPrefixes.some(prefix => {
      if (typeof prefix === 'string') {
        return fileName.startsWith(prefix);
      } else {
        // 正则表达式匹配
        return prefix.test(fileName);
      }
    });
    
    const hasValidExtension = backupExtensions.some(ext => fileName.endsWith(ext));
    
    return hasValidPrefix && hasValidExtension;
  }

  /**
   * 解析备份文件名（支持新的文件名格式）
   */
  parseBackupFileName(fileName) {
    // 支持多种格式：
    // full_2024-09-20_14-30-00_collection.archive(.gz)
    // daily_2024-09-20_14-30-00_collection.archive(.gz) 
    // 30d_2024-09-20_14-30-00_collection.archive(.gz)
    // incremental_2024-09-20_14-30-00_collection.archive(.gz)
    // custom_2024-09-20_14-30-00_collection.archive(.gz)
    
    const patterns = [
      // 新格式：prefix_timestamp_collection.extension
      /^(full|daily|custom|\d+[hd])_(.+?)_(.+?)\.(archive(?:\.gz)?)$/,
      // 旧格式：incremental_timestamp_collection.extension  
      /^(incremental)_(.+?)_(.+?)\.(archive(?:\.gz)?)$/
    ];
    
    for (const pattern of patterns) {
      const match = fileName.match(pattern);
      if (match) {
        const [, prefix, timestamp, collection, extension] = match;
        
        // 解析时间戳 - 处理不同的时间格式
        let backupTime;
        try {
          // 尝试ISO格式：2024-09-20T14-30-00 -> 2024-09-20 14:30:00
          let timeStr = timestamp;
          if (timeStr.includes('T')) {
            timeStr = timeStr.replace('T', ' ').replace(/-/g, ':');
          } else {
            // 如果没有T分隔符，假设是日期格式
            timeStr = timestamp;
          }
          
          backupTime = new Date(timeStr);
          if (isNaN(backupTime)) {
            // 如果解析失败，使用当前时间
            backupTime = new Date();
          }
        } catch (e) {
          backupTime = new Date();
        }

        // 确定备份类型
        let backupType = 'unknown';
        switch (prefix) {
          case 'full':
            backupType = '全表备份';
            break;
          case 'daily':
            backupType = '当天备份';
            break;
          case 'incremental':
            backupType = '增量备份';
            break;
          case 'custom':
            backupType = '自定义范围';
            break;
          default:
            if (prefix.match(/^\d+h$/)) {
              backupType = `${prefix}备份`;
            } else if (prefix.match(/^\d+d$/)) {
              backupType = `${prefix}备份`;
            } else {
              backupType = prefix;
            }
        }

        return {
          prefix,
          timestamp,
          collection,
          backupType,
          isCompressed: extension.includes('.gz'),
          backupTime,
          parsedSuccessfully: true
        };
      }
    }

    return {
      prefix: 'unknown',
      timestamp: 'unknown',
      collection: 'unknown',
      backupType: '未知类型',
      isCompressed: false,
      backupTime: new Date(),
      parsedSuccessfully: false
    };
  }

  /**
   * 列出可用的备份文件
   */
  listBackupFiles() {
    this.log('扫描备份文件...');
    const backupFiles = this.scanBackupFiles();

    if (backupFiles.length === 0) {
      console.log('\n❌ 未找到任何备份文件');
      return;
    }

    console.log(`\n📁 找到 ${backupFiles.length} 个备份文件:\n`);
    console.log('序号 | 日期       | 类型   | 备份类型   | 集合名称            | 备份时间            | 文件大小   ');
    console.log('-----|------------|--------|------------|---------------------|---------------------|------------|');

    backupFiles.forEach((file, index) => {
      const sizeStr = this.formatFileSize(file.size);
      const timeStr = file.backupTime.toLocaleString('zh-CN');
      const dateDirStr = file.dateDir.padEnd(10);
      const categoryStr = file.category.padEnd(6);
      const backupTypeStr = (file.backupType || '未知').padEnd(10);
      const collectionStr = file.collection.padEnd(19);
      
      console.log(`${(index + 1).toString().padStart(4)} | ${dateDirStr} | ${categoryStr} | ${backupTypeStr} | ${collectionStr} | ${timeStr} | ${sizeStr.padEnd(10)} `);
    });

    console.log('\n');
    return backupFiles;
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 验证备份文件
   */
  async verifyBackupFile(filePath) {
    this.log('验证备份文件:', filePath);
    
    try {
      // 检查文件是否存在和可读
      if (!fs.existsSync(filePath)) {
        throw new Error('备份文件不存在');
      }

      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('备份文件为空');
      }

      // 如果是归档文件，尝试列出内容
      const command = this.buildMongorestoreCommand(filePath, { dryRun: true });
      const { stdout, stderr } = await execAsync(command);

      this.log('备份文件验证成功:', {
        size: this.formatFileSize(stats.size),
        modifiedTime: stats.mtime
      });

      return { valid: true, size: stats.size, modifiedTime: stats.mtime };

    } catch (error) {
      this.logError('备份文件验证失败', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * 创建安全备份
   */
  async createSafetyBackup(collections) {
    if (!this.restoreConfig.createSafetyBackup) {
      return null;
    }

    this.log('创建安全备份，防止还原失败...');
    
    try {
      const timestamp = new Date().toISOString()
        .replace(/:/g, '-')
        .replace(/\./g, '-')
        .split('.')[0];
      
      const safetyBackupDir = path.join(this.backupConfig.backupPath, 'safety_backups', timestamp);
      fs.mkdirSync(safetyBackupDir, { recursive: true });

      const backupPromises = collections.map(async (collection) => {
        const outputPath = path.join(safetyBackupDir, `${collection}.archive`);
        const command = this.buildMongodumpCommand(collection, outputPath);
        
        await execAsync(command);
        this.log(`安全备份完成: ${collection}`);
        
        return { collection, outputPath };
      });

      const results = await Promise.all(backupPromises);
      this.log('所有安全备份创建完成:', safetyBackupDir);
      
      return { backupDir: safetyBackupDir, results };

    } catch (error) {
      this.logError('创建安全备份失败', error);
      throw error;
    }
  }

  /**
   * 构建mongodump命令（用于安全备份）
   */
  buildMongodumpCommand(collection, outputPath) {
    const { host, port, database, username, password, authDatabase } = this.config;
    const mongodumpCmd = this.mongodumpPath.includes(' ') ? `"${this.mongodumpPath}"` : this.mongodumpPath;
    
    let command = mongodumpCmd;
    command += ` --host ${host}:${port}`;
    command += ` --db ${database}`;
    command += ` --username ${username}`;
    command += ` --password "${password}"`;
    command += ` --authenticationDatabase ${authDatabase}`;
    command += ` --collection ${collection}`;
    command += ` --archive="${outputPath}"`;
    command += ` --gzip`;
    
    return command;
  }

  /**
   * 构建mongorestore命令
   */
  buildMongorestoreCommand(filePath, options = {}) {
    const { host, port, username, password, authDatabase } = this.config;
    const targetDb = this.restoreConfig.targetDatabase;
    const mongorestoreCmd = this.mongorestorePath.includes(' ') ? `"${this.mongorestorePath}"` : this.mongorestorePath;
    
    let command = mongorestoreCmd;
    command += ` --host ${host}:${port}`;
    command += ` --username ${username}`;
    command += ` --password "${password}"`;
    command += ` --authenticationDatabase ${authDatabase}`;
    
    // 目标数据库
    if (targetDb !== this.config.database) {
      command += ` --db ${targetDb}`;
    }
    
    // 还原模式处理
    if (this.restoreConfig.restoreMode === 'replace') {
      command += ` --drop`;  // 替换模式，先删除再导入
    } else if (this.restoreConfig.restoreMode === 'merge-skip') {
      // 合并-跳过模式：不添加特殊参数，MongoDB默认跳过重复的_id
      // 行为：相同_id的文档会被跳过，只添加新的_id文档
    } else if (this.restoreConfig.restoreMode === 'merge-upsert') {
      // 合并-更新模式：使用--upsert参数
      command += ` --upsert`;  // 更新存在的文档，插入不存在的文档
    }
    
    // 归档文件
    if (filePath.endsWith('.archive') || filePath.endsWith('.archive.gz')) {
      command += ` --archive="${filePath}"`;
      
      if (filePath.endsWith('.gz')) {
        command += ` --gzip`;
      }
    } else {
      // 目录还原
      command += ` "${filePath}"`;
    }
    
    // 试运行模式
    if (options.dryRun || this.restoreConfig.dryRun) {
      command += ` --dryRun`;
    }
    
    // 特定集合
    if (options.collection) {
      command += ` --collection ${options.collection}`;
    }
    
    // 详细输出
    command += ` --verbose`;
    
    return command;
  }

  /**
   * 还原单个备份文件
   */
  async restoreBackupFile(filePath, options = {}) {
    this.log('开始还原备份文件:', filePath);
    
    try {
      // 验证备份文件
      const verification = await this.verifyBackupFile(filePath);
      if (!verification.valid) {
        throw new Error(`备份文件验证失败: ${verification.error}`);
      }

      // 解析文件信息
      const fileName = path.basename(filePath);
      const fileInfo = this.parseBackupFileName(fileName);
      
      if (!fileInfo.parsedSuccessfully) {
        this.log('警告: 无法解析文件名格式，将尝试还原整个文件');
      }

      // 创建安全备份（如果需要）
      let safetyBackup = null;
      if (this.restoreConfig.createSafetyBackup && !options.skipSafetyBackup) {
        const collections = fileInfo.collection !== 'unknown' ? [fileInfo.collection] : [];
        if (collections.length > 0) {
          safetyBackup = await this.createSafetyBackup(collections);
        }
      }

      // 执行还原
      const command = this.buildMongorestoreCommand(filePath, options);
      
      this.log('执行还原命令:', command);
      
      if (this.restoreConfig.dryRun) {
        this.log('试运行模式，不会实际执行还原操作');
        return { success: true, dryRun: true };
      }

      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(command);
      const duration = Date.now() - startTime;

      // 检查输出
      if (stderr && !stderr.includes('done')) {
        this.log('还原过程中的警告:', stderr);
      }

      // 验证还原结果
      if (this.restoreConfig.verifyAfterRestore) {
        await this.verifyRestoreResult(fileInfo.collection);
      }

      this.log(`备份文件还原成功: ${fileName}, 耗时: ${(duration / 1000).toFixed(2)}秒`);
      
      return { 
        success: true, 
        filePath, 
        collection: fileInfo.collection,
        duration,
        safetyBackup 
      };

    } catch (error) {
      this.logError('备份文件还原失败', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 验证还原结果
   */
  async verifyRestoreResult(collection) {
    // 这里可以添加还原后的验证逻辑
    // 例如检查文档数量、数据完整性等
    this.log('还原结果验证 - 功能待实现');
  }

  /**
   * 交互式还原 - 层级选择（日期 -> 类型 -> 文件）
   */
  async interactiveRestore() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => {
      return new Promise((resolve) => {
        rl.question(prompt, resolve);
      });
    };

    try {
      console.log('\n🔧 欢迎使用MongoDB备份还原管理器 - 交互模式\n');

      // 步骤1: 选择日期目录
      const availableDates = this.getAvailableDates();
      if (availableDates.length === 0) {
        console.log('❌ 未找到任何备份文件');
        return;
      }

      console.log('📅 可用的备份日期:');
      console.log('序号 | 日期       | 文件总数 | 最后备份时间');
      console.log('-----|------------|----------|------------------');
      
      availableDates.forEach((dateInfo, index) => {
        const timeStr = dateInfo.lastBackupTime ? dateInfo.lastBackupTime.toLocaleString('zh-CN') : '未知';
        console.log(`${(index + 1).toString().padStart(4)} | ${dateInfo.date.padEnd(10)} | ${dateInfo.totalFiles.toString().padStart(8)} | ${timeStr}`);
      });

      const dateIndex = await question('\n请选择要还原的备份日期（输入序号）: ');
      const selectedDate = availableDates[parseInt(dateIndex) - 1];

      if (!selectedDate) {
        console.log('❌ 无效的日期序号');
        return;
      }

      console.log(`\n✅ 已选择日期: ${selectedDate.date}`);

      // 步骤2: 选择备份类型
      const availableTypes = this.getAvailableTypes(selectedDate.date);
      if (availableTypes.length === 0) {
        console.log('❌ 该日期下没有找到备份文件');
        return;
      }

      console.log('\n🗂️ 可用的备份类型:');
      console.log('序号 | 类型     | 说明           | 文件数量 | 总大小');
      console.log('-----|----------|----------------|----------|----------');

      availableTypes.forEach((typeInfo, index) => {
        const sizeStr = this.formatFileSize(typeInfo.totalSize);
        console.log(`${(index + 1).toString().padStart(4)} | ${typeInfo.type.padEnd(8)} | ${typeInfo.description.padEnd(14)} | ${typeInfo.fileCount.toString().padStart(8)} | ${sizeStr.padEnd(8)}`);
      });

      const typeIndex = await question('\n请选择要还原的备份类型（输入序号）: ');
      const selectedType = availableTypes[parseInt(typeIndex) - 1];

      if (!selectedType) {
        console.log('❌ 无效的类型序号');
        return;
      }

      console.log(`\n✅ 已选择类型: ${selectedType.type} (${selectedType.description})`);

      // 步骤3: 选择具体备份文件
      const backupFiles = this.getBackupFiles(selectedDate.date, selectedType.type);
      if (backupFiles.length === 0) {
        console.log('❌ 该类型下没有找到备份文件');
        return;
      }

      console.log('\n📄 可用的备份文件:');
      console.log('序号 | 备份类型   | 集合名称            | 备份时间            | 文件大小   ');
      console.log('-----|------------|---------------------|---------------------|------------|');

      backupFiles.forEach((file, index) => {
        const sizeStr = this.formatFileSize(file.size);
        const timeStr = file.backupTime.toLocaleString('zh-CN');
        const backupTypeStr = (file.backupType || '未知').padEnd(10);
        const collectionStr = file.collection.padEnd(19);
        
        console.log(`${(index + 1).toString().padStart(4)} | ${backupTypeStr} | ${collectionStr} | ${timeStr} | ${sizeStr.padEnd(10)} `);
      });

      const fileIndex = await question('\n请选择要还原的备份文件（输入序号）: ');
      const selectedFile = backupFiles[parseInt(fileIndex) - 1];

      if (!selectedFile) {
        console.log('❌ 无效的文件序号');
        return;
      }

      // 步骤4: 显示选择的文件信息
      console.log('\n📋 已选择的备份文件:');
      console.log(`   📅 日期目录: ${selectedFile.dateDir}`);
      console.log(`   🗂️ 类型目录: ${selectedFile.category}`);
      console.log(`   📄 文件名: ${selectedFile.fileName}`);
      console.log(`   🏷️ 备份类型: ${selectedFile.backupType}`);
      console.log(`   📊 集合: ${selectedFile.collection}`);
      console.log(`   🕒 备份时间: ${selectedFile.backupTime.toLocaleString('zh-CN')}`);
      console.log(`   💾 文件大小: ${this.formatFileSize(selectedFile.size)}`);
      console.log(`   📁 文件路径: ${selectedFile.filePath}`);

      // 步骤5: 选择还原模式
      console.log('\n⚙️ 还原模式选择:');
      console.log('   1. merge-skip:   跳过相同数据，只添加新数据（最安全，推荐）');
      console.log('   2. merge-upsert: 更新相同数据，添加新数据（用于数据同步）');
      console.log('   3. replace:      完全替换（清除所有现有数据）⚠️');

      const modeChoice = await question('\n请选择还原模式（输入序号，默认为1）: ') || '1';
      const modes = ['merge-skip', 'merge-upsert', 'replace'];
      const selectedMode = modes[parseInt(modeChoice) - 1] || 'merge-skip';
      
      // 临时设置还原模式
      const originalMode = this.restoreConfig.restoreMode;
      this.restoreConfig.restoreMode = selectedMode;

      console.log(`\n✅ 已选择还原模式: ${selectedMode}`);

      // 步骤6: 确认还原选项
      const confirm = await question('\n🔍 确认还原此备份文件吗？(y/N): ');
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        console.log('❌ 还原已取消');
        // 恢复原始模式
        this.restoreConfig.restoreMode = originalMode;
        return;
      }

      // 还原选项
      const createSafety = await question('🛡️ 是否创建安全备份？(Y/n): ');
      const skipSafetyBackup = createSafety.toLowerCase() === 'n';

      const dryRunOption = await question('🧪 是否执行试运行（仅验证不实际还原）？(y/N): ');
      const isDryRun = dryRunOption.toLowerCase() === 'y';

      // 步骤7: 执行还原
      console.log('\n🚀 开始还原操作...');
      console.log(`   还原模式: ${selectedMode}`);
      console.log(`   目标文件: ${selectedDate.date}/${selectedType.type}/${selectedFile.fileName}`);
      console.log(`   ${isDryRun ? '试运行模式' : '正式还原模式'}`);

      const result = await this.restoreBackupFile(selectedFile.filePath, {
        skipSafetyBackup,
        dryRun: isDryRun
      });

      // 恢复原始模式
      this.restoreConfig.restoreMode = originalMode;

      if (result.success) {
        console.log('\n✅ 还原操作成功完成！');
        if (result.dryRun) {
          console.log('   📝 模式: 试运行（未实际执行还原）');
          console.log('   💡 如需正式还原，请重新执行并选择"否"试运行选项');
        } else {
          console.log(`   📊 还原模式: ${selectedMode}`);
          console.log(`   📦 目标集合: ${selectedFile.collection}`);
        }
        if (result.safetyBackup) {
          console.log(`   🛡️ 安全备份位置: ${result.safetyBackup.backupDir}`);
        }
      } else {
        console.log('\n❌ 还原操作失败:', result.error);
        console.log('   💡 请检查日志文件获取详细错误信息');
      }

    } catch (error) {
      console.error('❌ 交互式还原过程中出错:', error.message);
    } finally {
      rl.close();
    }
  }

  /**
   * 按日期还原备份
   */
  async restoreByDate(dateStr) {
    this.log('按日期搜索备份文件:', dateStr);
    
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate)) {
      throw new Error('无效的日期格式，请使用 YYYY-MM-DD 格式');
    }

    const backupFiles = this.scanBackupFiles();
    
    // 筛选指定日期的备份文件
    const dateFiles = backupFiles.filter(file => {
      const fileDate = new Date(file.backupTime.toDateString());
      return fileDate.getTime() === new Date(targetDate.toDateString()).getTime();
    });

    if (dateFiles.length === 0) {
      this.log(`未找到 ${dateStr} 的备份文件`);
      return { success: false, message: '未找到指定日期的备份文件' };
    }

    this.log(`找到 ${dateFiles.length} 个 ${dateStr} 的备份文件`);
    
    // 还原所有找到的文件
    const results = [];
    for (const file of dateFiles) {
      const result = await this.restoreBackupFile(file.filePath);
      results.push({ file: file.fileName, ...result });
    }

    const successCount = results.filter(r => r.success).length;
    this.log(`日期还原完成: 成功 ${successCount}/${results.length}`);
    
    return { success: successCount > 0, results };
  }

  /**
   * 获取可用的备份日期目录
   */
  getAvailableDates() {
    const basePath = this.backupConfig.backupPath;
    const availableDates = [];

    try {
      const items = fs.readdirSync(basePath);
      
      for (const item of items) {
        // 匹配日期格式：YYYY-MM-DD
        if (item.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const dateDir = path.join(basePath, item);
          
          if (fs.statSync(dateDir).isDirectory()) {
            // 统计该日期下的文件信息
            let totalFiles = 0;
            let lastBackupTime = null;
            
            try {
              const typeItems = fs.readdirSync(dateDir);
              for (const typeItem of typeItems) {
                const typeDir = path.join(dateDir, typeItem);
                if (fs.statSync(typeDir).isDirectory()) {
                  const files = fs.readdirSync(typeDir);
                  const backupFiles = files.filter(file => this.isBackupFile(file));
                  totalFiles += backupFiles.length;
                  
                  // 找最后修改时间
                  for (const file of backupFiles) {
                    const filePath = path.join(typeDir, file);
                    const stats = fs.statSync(filePath);
                    if (!lastBackupTime || stats.mtime > lastBackupTime) {
                      lastBackupTime = stats.mtime;
                    }
                  }
                }
              }
            } catch (e) {
              // 忽略读取错误
            }
            
            if (totalFiles > 0) {
              availableDates.push({
                date: item,
                totalFiles,
                lastBackupTime
              });
            }
          }
        }
      }
    } catch (error) {
      this.logError('获取可用日期失败', error);
    }

    // 按日期倒序排列（最新的在前）
    return availableDates.sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * 获取指定日期下的备份类型
   */
  getAvailableTypes(dateStr) {
    const basePath = this.backupConfig.backupPath;
    const dateDir = path.join(basePath, dateStr);
    const availableTypes = [];

    // 备份类型说明映射
    const typeDescriptions = {
      'hot': '高频数据备份',
      'daily': '日常数据备份',
      'full': '全表备份',
      'history': '历史数据备份',
      'custom': '自定义范围备份',
      'other': '其他备份'
    };

    try {
      if (fs.existsSync(dateDir)) {
        const typeItems = fs.readdirSync(dateDir);
        
        for (const typeItem of typeItems) {
          const typeDir = path.join(dateDir, typeItem);
          
          if (fs.statSync(typeDir).isDirectory()) {
            const files = fs.readdirSync(typeDir);
            const backupFiles = files.filter(file => this.isBackupFile(file));
            
            if (backupFiles.length > 0) {
              // 计算总大小
              let totalSize = 0;
              for (const file of backupFiles) {
                try {
                  const filePath = path.join(typeDir, file);
                  const stats = fs.statSync(filePath);
                  totalSize += stats.size;
                } catch (e) {
                  // 忽略单个文件错误
                }
              }

              availableTypes.push({
                type: typeItem,
                description: typeDescriptions[typeItem] || '未知类型',
                fileCount: backupFiles.length,
                totalSize
              });
            }
          }
        }
      }
    } catch (error) {
      this.logError('获取可用类型失败', error);
    }

    // 按文件数量倒序排列
    return availableTypes.sort((a, b) => b.fileCount - a.fileCount);
  }

  /**
   * 获取指定日期和类型下的备份文件
   */
  getBackupFiles(dateStr, typeStr) {
    const basePath = this.backupConfig.backupPath;
    const typeDir = path.join(basePath, dateStr, typeStr);
    const backupFiles = [];

    try {
      if (fs.existsSync(typeDir)) {
        const files = fs.readdirSync(typeDir);
        
        for (const file of files) {
          if (this.isBackupFile(file)) {
            const filePath = path.join(typeDir, file);
            const stats = fs.statSync(filePath);
            
            // 解析文件名获取信息
            const fileInfo = this.parseBackupFileName(file);
            
            backupFiles.push({
              dateDir: dateStr,
              category: typeStr,
              fileName: file,
              filePath,
              size: stats.size,
              modifiedTime: stats.mtime,
              createdTime: stats.birthtime,
              ...fileInfo
            });
          }
        }
      }
    } catch (error) {
      this.logError('获取备份文件失败', error);
    }

    // 按修改时间倒序排列
    return backupFiles.sort((a, b) => b.modifiedTime - a.modifiedTime);
  }

  /**
   * 按集合名还原备份
   */
  async restoreByCollection(collectionName) {
    this.log('按集合搜索备份文件:', collectionName);
    
    const backupFiles = this.scanBackupFiles();
    
    // 筛选指定集合的备份文件
    const collectionFiles = backupFiles.filter(file => 
      file.collection === collectionName || 
      file.collection.includes(collectionName)
    );

    if (collectionFiles.length === 0) {
      this.log(`未找到集合 ${collectionName} 的备份文件`);
      return { success: false, message: '未找到指定集合的备份文件' };
    }

    // 选择最新的备份文件
    const latestFile = collectionFiles[0]; // 已按时间排序
    this.log(`选择最新的备份文件: ${latestFile.fileName}`);

    const result = await this.restoreBackupFile(latestFile.filePath, {
      collection: collectionName
    });

    return result;
  }

  /**
   * 主运行函数
   */
  async run(args = []) {
    try {
      const options = this.parseCommandLineArgs(args);

      switch (options.command) {
        case 'list':
          this.listBackupFiles();
          break;

        case 'restore':
          if (options.file) {
            // 还原指定文件
            const result = await this.restoreBackupFile(options.file, options);
            console.log(result.success ? '✅ 还原成功' : '❌ 还原失败', result.error || '');
          } else if (options.date) {
            // 按日期还原
            const result = await this.restoreByDate(options.date);
            console.log(result.success ? '✅ 日期还原成功' : '❌ 日期还原失败');
          } else if (options.collection) {
            // 按集合还原
            const result = await this.restoreByCollection(options.collection);
            console.log(result.success ? '✅ 集合还原成功' : '❌ 集合还原失败');
          } else {
            console.log('❌ 请指定要还原的文件、日期或集合');
          }
          break;

        case 'verify':
          if (options.file) {
            const result = await this.verifyBackupFile(options.file);
            console.log(result.valid ? '✅ 备份文件验证成功' : '❌ 备份文件验证失败', result.error || '');
          } else {
            console.log('❌ 请指定要验证的备份文件');
          }
          break;

        case 'interactive':
          await this.interactiveRestore();
          break;

        default:
          this.showHelp();
          break;
      }

    } catch (error) {
      this.logError('还原管理器运行失败', error);
      console.error('❌ 操作失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 解析命令行参数
   */
  parseCommandLineArgs(args) {
    const options = {
      command: 'help'
    };

    for (const arg of args) {
      if (arg === '--list') {
        options.command = 'list';
      } else if (arg === '--restore') {
        options.command = 'restore';
      } else if (arg === '--verify') {
        options.command = 'verify';
      } else if (arg === '--interactive' || arg === '-i') {
        options.command = 'interactive';
      } else if (arg.startsWith('--file=')) {
        options.file = arg.split('=')[1];
      } else if (arg.startsWith('--date=')) {
        options.date = arg.split('=')[1];
      } else if (arg.startsWith('--collection=')) {
        options.collection = arg.split('=')[1];
      } else if (arg === '--dry-run') {
        this.restoreConfig.dryRun = true;
      } else if (arg === '--skip-safety') {
        options.skipSafetyBackup = true;
      }
    }

    return options;
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log('\n🔧 MongoDB备份还原管理器 - 帮助信息\n');
    console.log('使用方法:');
    console.log('  node restore_manager.js [选项]\n');
    
    console.log('命令选项:');
    console.log('  --list                           列出所有可用的备份文件');
    console.log('  --restore --file=<文件路径>       还原指定的备份文件');
    console.log('  --restore --date=<YYYY-MM-DD>     还原指定日期的所有备份');
    console.log('  --restore --collection=<集合名>   还原指定集合的最新备份');
    console.log('  --verify --file=<文件路径>        验证备份文件的完整性');
    console.log('  --interactive, -i                启动交互式还原模式（层级选择）');
    console.log('  --help, -h                       显示此帮助信息\n');
    
    console.log('还原选项:');
    console.log('  --dry-run                        试运行模式（不实际执行还原）');
    console.log('  --skip-safety                    跳过安全备份创建\n');
    
    console.log('环境变量:');
    console.log('  RESTORE_TARGET_DB               目标数据库名称');
    console.log('  RESTORE_DRY_RUN=true            启用试运行模式');
    console.log('  RESTORE_SAFETY_BACKUP=false     禁用安全备份');
    console.log('  RESTORE_MODE=<模式>             还原模式:');
    console.log('    - merge-skip:   合并-跳过模式（跳过相同_id，添加新数据）✅');
    console.log('    - merge-upsert: 合并-更新模式（更新相同_id，添加新数据）🔄');
    console.log('    - replace:      替换模式（清除原数据后导入）⚠️\n');
    
    console.log('使用示例:');
    console.log('  node restore_manager.js --list');
    console.log('  node restore_manager.js --restore --file=backup.archive');
    console.log('  node restore_manager.js --restore --date=2024-01-15');
    console.log('  node restore_manager.js --restore --collection=users');
    console.log('  node restore_manager.js --interactive');
    console.log('  node restore_manager.js -i                 # 简写形式\n');
  }
}

// 命令行启动
if (require.main === module) {
  const manager = new RestoreManager();
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    manager.showHelp();
    process.exit(0);
  }
  
  manager.run(args).catch(error => {
    console.error('还原管理器启动失败:', error.message);
    process.exit(1);
  });
}

module.exports = RestoreManager; 