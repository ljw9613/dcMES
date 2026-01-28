#!/usr/bin/env node

/**
 * MongoDB增量备份管理器
 * 
 * 功能特性：
 * - 专门针对当天数据的增量备份
 * - 支持不同集合的备份策略配置
 * - 多种定时任务调度（小时、每日、自定义）
 * - 备份文件智能分类管理
 * - 支持热点集合优先备份
 * - 备份健康监控和告警
 * - 自动清理和归档策略
 * 
 * 使用方法：
 * node incremental_backup_manager.js --start     # 启动管理器
 * node incremental_backup_manager.js --once      # 立即执行一次备份
 * node incremental_backup_manager.js --status    # 查看备份状态
 * node incremental_backup_manager.js --config    # 显示当前配置
 * 
 * 环境变量配置：
 * INCREMENTAL_BACKUP_PATH - 增量备份存储路径
 * BACKUP_SCHEDULE_MODE - 调度模式（hourly/daily/custom）
 * MONGO_HOST - MongoDB主机地址
 * MONGO_PORT - MongoDB端口
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
const zlib = require('zlib');
const schedule = require('node-schedule');

// 导入配置文件
const config = require('./config');

const execAsync = util.promisify(exec);

class IncrementalBackupManager {
  constructor() {
    // 从配置文件加载数据库连接配置
    this.config = config.database;

    // 从配置文件加载备份配置
    this.backupConfig = {
      // 基础路径配置
      backupPath: config.paths.backupPath,
      
      // 从配置文件加载备份策略
      strategies: config.strategies,

      // 从配置文件加载全局配置
      maxRetries: config.backup.maxRetries,
      retryDelay: config.backup.retryDelay,
      useArchiveMode: config.backup.useArchiveMode,
      globalCompress: config.backup.globalCompress,
      parallelLimit: config.backup.parallelLimit,
      
      // 从配置文件加载监控配置
      healthCheck: config.monitoring.healthCheck
    };

    // 运行状态
    this.state = {
      isRunning: false,
      activeJobs: new Map(),
      lastBackupTimes: new Map(),
      failureCount: new Map(),
      statistics: {
        totalBackups: 0,
        successCount: 0,
        failureCount: 0,
        totalSize: 0,
        startTime: new Date()
      }
    };

    this.isWindows = os.platform() === 'win32';
    this.mongodumpPath = null;
    
    // 初始化
    this.init();
  }

  /**
   * 初始化管理器
   */
  init() {
    this.ensureBackupDirectories();
    this.loadState();
    this.setupSignalHandlers();
  }

  /**
   * 确保备份目录存在
   */
  ensureBackupDirectories() {
    const basePath = this.backupConfig.backupPath;
    
    // 创建基础目录
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    // 创建日志目录
    const logsDir = path.join(basePath, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // 创建当天的日期目录和分类子目录
    this.ensureDateDirectories();

    this.log('备份目录初始化完成:', basePath);
  }

  /**
   * 确保当天的日期目录和分类目录存在
   */
  ensureDateDirectories(date = new Date()) {
    const basePath = this.backupConfig.backupPath;
    const dateStr = this.formatDateForDirectory(date);
    const datePath = path.join(basePath, dateStr);
    
    // 创建日期目录
    if (!fs.existsSync(datePath)) {
      fs.mkdirSync(datePath, { recursive: true });
    }

    // 在日期目录下创建分类子目录
    const subdirs = ['hot', 'daily', 'full', 'history', 'custom', 'other'];
    subdirs.forEach(subdir => {
      const dirPath = path.join(datePath, subdir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    return datePath;
  }

  /**
   * 格式化日期为目录名
   */
  formatDateForDirectory(date = new Date()) {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
  }

  /**
   * 加载状态信息
   */
  loadState() {
    const stateFile = path.join(this.backupConfig.backupPath, 'manager_state.json');
    
    if (fs.existsSync(stateFile)) {
      try {
        const savedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        // 合并保存的状态（仅合并统计信息）
        this.state.statistics = { ...this.state.statistics, ...savedState.statistics };
        this.state.lastBackupTimes = new Map(savedState.lastBackupTimes || []);
        this.state.failureCount = new Map(savedState.failureCount || []);
        
        this.log('状态信息加载成功');
      } catch (error) {
        this.logError('加载状态信息失败', error);
      }
    }
  }

  /**
   * 保存状态信息
   */
  saveState() {
    const stateFile = path.join(this.backupConfig.backupPath, 'manager_state.json');
    
    const stateToSave = {
      statistics: this.state.statistics,
      lastBackupTimes: Array.from(this.state.lastBackupTimes),
      failureCount: Array.from(this.state.failureCount),
      lastSaveTime: new Date().toISOString()
    };

    try {
      fs.writeFileSync(stateFile, JSON.stringify(stateToSave, null, 2));
    } catch (error) {
      this.logError('保存状态信息失败', error);
    }
  }

  /**
   * 设置信号处理器
   */
  setupSignalHandlers() {
    process.on('SIGINT', () => this.gracefulShutdown());
    process.on('SIGTERM', () => this.gracefulShutdown());
    
    // 自动保存状态
    setInterval(() => {
      if (this.state.isRunning) {
        this.saveState();
      }
    }, 60000); // 每分钟保存一次
  }

  /**
   * 优雅关闭
   */
  async gracefulShutdown() {
    this.log('正在关闭增量备份管理器...');
    this.state.isRunning = false;
    
    // 等待活动任务完成
    if (this.state.activeJobs.size > 0) {
      this.log(`等待 ${this.state.activeJobs.size} 个活动任务完成...`);
      await this.waitForActiveJobs(30000); // 最多等待30秒
    }
    
    this.saveState();
    this.log('增量备份管理器已关闭');
    process.exit(0);
  }

  /**
   * 等待活动任务完成
   */
  waitForActiveJobs(timeout = 30000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (this.state.activeJobs.size === 0 || Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
  }

  /**
   * 日志记录
   */
  log(message, data = '') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [IncrementalBackup] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }

    // 写入日志文件
    const logFile = path.join(this.backupConfig.backupPath, 'logs', 'incremental_backup.log');
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
    const errorMessage = `[${timestamp}] [IncrementalBackup] ERROR: ${message}`;
    
    console.error(errorMessage, error.message);
    
    const logFile = path.join(this.backupConfig.backupPath, 'logs', 'incremental_backup.log');
    const logLine = `${errorMessage} ${error.message}\n${error.stack}\n`;
    
    try {
      fs.appendFileSync(logFile, logLine);
    } catch (e) {
      // 忽略日志写入错误
    }
  }

  /**
   * 检查mongodump是否可用
   */
  async checkMongodumpAvailable() {
    try {
      // 优先使用配置的Tools目录
      const localMongodump = path.join(__dirname, config.paths.toolsPath, '100', 'bin', this.isWindows ? 'mongodump.exe' : 'mongodump');
      if (fs.existsSync(localMongodump)) {
        const quoted = localMongodump.includes(' ') ? `"${localMongodump}"` : localMongodump;
        await execAsync(`${quoted} --version`);
        this.mongodumpPath = localMongodump;
        this.log('使用本地MongoDB工具:', localMongodump);
        return true;
      }

      // 尝试系统路径
      await execAsync('mongodump --version');
      this.mongodumpPath = 'mongodump';
      this.log('使用系统MongoDB工具');
      return true;
      
    } catch (error) {
      this.log('MongoDB工具不可用:', error.message);
      return false;
    }
  }

  /**
   * 构建时间范围查询条件
   * @param {string} timeField - 时间字段名
   * @param {Object} timeRange - 时间范围配置
   * @returns {string|null} - 查询条件JSON字符串，null表示无时间限制
   */
  buildTimeRangeQuery(timeField = 'createdAt', timeRange = { type: 'today' }) {
    if (!timeRange || timeRange.type === 'full') {
      // 全表备份，不添加时间限制
      return null;
    }

    let startTime, endTime;
    const now = new Date();

    switch (timeRange.type) {
      case 'today':
        // 当天数据
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startTime = new Date(today);
        endTime = new Date(today);
        endTime.setHours(23, 59, 59, 999);
        break;

      case 'hours':
        // 最近N小时
        const hours = timeRange.hours || 24;
        startTime = new Date(now - hours * 60 * 60 * 1000);
        endTime = new Date(now);
        break;

      case 'days':
        // 最近N天
        const days = timeRange.days || 7;
        startTime = new Date(now - days * 24 * 60 * 60 * 1000);
        endTime = new Date(now);
        break;

      case 'custom':
        // 自定义时间范围
        if (!timeRange.startDate || !timeRange.endDate) {
          this.log('自定义时间范围配置错误，缺少startDate或endDate，使用当天备份');
          return this.buildTimeRangeQuery(timeField, { type: 'today' });
        }
        startTime = new Date(timeRange.startDate);
        endTime = new Date(timeRange.endDate);
        // 设置结束时间为当天的最后一秒
        if (endTime.getHours() === 0 && endTime.getMinutes() === 0 && endTime.getSeconds() === 0) {
          endTime.setHours(23, 59, 59, 999);
        }
        break;

      default:
        this.log(`未知的时间范围类型: ${timeRange.type}，使用当天备份`);
        return this.buildTimeRangeQuery(timeField, { type: 'today' });
    }

    // 验证时间范围
    if (startTime >= endTime) {
      this.log('时间范围配置错误，开始时间不能大于等于结束时间，使用当天备份');
      return this.buildTimeRangeQuery(timeField, { type: 'today' });
    }

    // 转换为MongoDB Extended JSON格式
    const query = {
      [timeField]: {
        "$gte": { "$date": startTime.toISOString() },
        "$lte": { "$date": endTime.toISOString() }
      }
    };
    
    this.log(`时间范围查询 [${timeRange.type}]: ${startTime.toISOString()} 到 ${endTime.toISOString()}`);
    return JSON.stringify(query);
  }

  /**
   * 构建时间范围查询条件（向前兼容）
   * @deprecated 使用 buildTimeRangeQuery 替代
   */
  buildTodayTimeRange(timeField = 'createdAt') {
    return this.buildTimeRangeQuery(timeField, { type: 'today' });
  }

  /**
   * 构建mongodump命令
   * @param {string} collection - 集合名
   * @param {string} outputPath - 输出路径
   * @param {string} timeField - 时间字段名
   * @param {Object} timeRange - 时间范围配置
   */
  buildMongodumpCommand(collection, outputPath, timeField, timeRange = { type: 'today' }) {
    const { host, port, database, username, password, authDatabase } = this.config;
    const mongodumpCmd = this.mongodumpPath || 'mongodump';
    const commandBinary = mongodumpCmd.includes(' ') ? `"${mongodumpCmd}"` : mongodumpCmd;
    
    let command = commandBinary;
    command += ` --host ${host}:${port}`;
    command += ` --db ${database}`;
    command += ` --username ${username}`;
    command += ` --password "${password}"`;
    command += ` --authenticationDatabase ${authDatabase}`;
    command += ` --collection ${collection}`;
    
    // 根据时间范围配置添加查询条件
    const timeRangeQuery = this.buildTimeRangeQuery(timeField, timeRange);
    
    if (timeRangeQuery) {
      // Windows和Linux下的查询参数处理
      if (this.isWindows) {
        // Windows下使用双引号包围查询，内部的双引号需要转义
        const escapedQuery = timeRangeQuery.replace(/"/g, '\\"');
        command += ` --query "${escapedQuery}"`;
      } else {
        // Linux/Unix下使用单引号包围查询
        command += ` --query '${timeRangeQuery}'`;
      }
      this.log(`添加时间范围查询 [${collection}]: ${timeRange.type}`);
    } else {
      this.log(`全表备份 [${collection}]: 无时间限制`);
    }
    
    // 输出配置 - 使用标准模式确保文件名控制
    // 创建临时输出目录
    const tempOutputDir = path.join(path.dirname(outputPath), 'temp_' + Date.now());
    command += ` --out "${tempOutputDir}"`;
    
    return command;
  }

  /**
   * 生成备份文件名
   * @param {string} strategyName - 策略名称
   * @param {string} collection - 集合名
   * @param {Object} timeRange - 时间范围配置
   */
  generateBackupFileName(strategyName, collection, timeRange = { type: 'today' }) {
    const now = new Date();
    // 生成 YYYY-MM-DDTHH-mm-SS 格式的时间戳
    const timestamp = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + 'T' +
      String(now.getHours()).padStart(2, '0') + '-' +
      String(now.getMinutes()).padStart(2, '0') + '-' +
      String(now.getSeconds()).padStart(2, '0');
    
    // 确保集合名符合文件名规范
    const safeName = collection.replace(/[^a-zA-Z0-9._$-]/g, '_');
    
    // 使用新的命名格式：表名_backup_时间戳.gz
    const fileName = `${safeName}_backup_${timestamp}.gz`;
    
    return fileName;
  }

  /**
   * 执行单个集合备份（带重试机制）
   */
  async backupCollection(strategyName, collection, strategy) {
    const jobId = `${strategyName}_${collection}_${Date.now()}`;
    
    try {
      this.state.activeJobs.set(jobId, {
        strategyName,
        collection,
        startTime: new Date(),
        status: 'running'
      });

      const timeRange = strategy.timeRange || { type: 'today' };
      const fileName = this.generateBackupFileName(strategyName, collection, timeRange);
      const categoryDir = this.getCategoryDir(strategyName);
      const outputPath = path.join(this.backupConfig.backupPath, categoryDir, fileName);
      
      this.log(`开始备份集合 [${strategyName}]: ${collection}`);
      
      // 检查mongodump
      if (!this.mongodumpPath && !(await this.checkMongodumpAvailable())) {
        throw new Error('MongoDB备份工具不可用');
      }

      // 执行备份（带重试机制）
      const result = await this.executeBackupWithRetry(collection, outputPath, strategy.timeField, timeRange, strategyName);
      
      // 更新统计
      this.state.statistics.totalBackups++;
      this.state.statistics.successCount++;
      this.state.statistics.totalSize += result.size;
      this.state.lastBackupTimes.set(`${strategyName}_${collection}`, new Date());
      
      // 重置失败计数
      this.state.failureCount.delete(`${strategyName}_${collection}`);
      
      return { success: true, filePath: result.filePath, size: result.size };
      
    } catch (error) {
      this.logError(`集合备份最终失败 [${strategyName}] ${collection}`, error);
      
      // 更新失败统计
      this.state.statistics.failureCount++;
      const failureKey = `${strategyName}_${collection}`;
      const currentFailures = this.state.failureCount.get(failureKey) || 0;
      this.state.failureCount.set(failureKey, currentFailures + 1);
      
      return { success: false, error: error.message };
      
    } finally {
      this.state.activeJobs.delete(jobId);
    }
  }

  /**
   * 处理标准模式下的输出文件（压缩和重命名）
   */
  async processStandardModeOutput(command, collection, finalOutputPath) {
    
    // 从命令中提取临时输出目录
    const tempDirMatch = command.match(/--out "([^"]+)"/);
    if (!tempDirMatch) {
      throw new Error('无法从命令中提取临时输出目录');
    }
    
    const tempOutputDir = tempDirMatch[1];
    const databaseDir = path.join(tempOutputDir, this.config.database);
    const bsonFile = path.join(databaseDir, `${collection}.bson`);
    
    try {
      // 检查生成的bson文件是否存在
      if (!fs.existsSync(bsonFile)) {
        throw new Error(`未找到备份文件: ${bsonFile}`);
      }
      
      // 确保目标目录存在
      const targetDir = path.dirname(finalOutputPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // 压缩bson文件到最终位置
      if (this.backupConfig.globalCompress) {
        await this.compressFile(bsonFile, finalOutputPath);
      } else {
        // 如果不压缩，直接复制并重命名（但保持.gz扩展名用于一致性）
        const targetPathWithoutGz = finalOutputPath.replace('.gz', '');
        fs.copyFileSync(bsonFile, targetPathWithoutGz);
        // 然后压缩以保持.gz格式
        await this.compressFile(targetPathWithoutGz, finalOutputPath);
        fs.unlinkSync(targetPathWithoutGz);
      }
      
      this.log(`文件处理完成: ${finalOutputPath}`);
      
      return finalOutputPath;
      
    } finally {
      // 清理临时目录
      this.cleanupTempDirectory(tempOutputDir);
    }
  }

  /**
   * 压缩文件
   */
  async compressFile(sourcePath, targetPath) {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(sourcePath);
      const writeStream = fs.createWriteStream(targetPath);
      const gzipStream = zlib.createGzip();
      
      readStream
        .pipe(gzipStream)
        .pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
      
      readStream.on('error', reject);
      writeStream.on('error', reject);
    });
  }

  /**
   * 清理临时目录
   */
  cleanupTempDirectory(tempDir) {
    try {
      if (fs.existsSync(tempDir)) {
        this.deleteFolderRecursive(tempDir);
        this.log(`清理临时目录: ${tempDir}`);
      }
    } catch (error) {
      this.logError('清理临时目录失败', error);
    }
  }

  /**
   * 递归删除目录
   */
  deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
      fs.readdirSync(folderPath).forEach((file) => {
        const curPath = path.join(folderPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          this.deleteFolderRecursive(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(folderPath);
    }
  }

  /**
   * 执行备份命令（带重试机制）
   */
  async executeBackupWithRetry(collection, outputPath, timeField, timeRange, strategyName) {
    const maxRetries = 3; // 最多重试3次
    const retryDelay = 5000; // 重试间隔5秒
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        // 如果不是第一次尝试，删除可能存在的不完整备份文件
        if (attempt > 1 && fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
          this.log(`删除不完整的备份文件: ${outputPath}`);
        }
        
        this.log(`尝试备份 [${collection}] - 第 ${attempt} 次${attempt > 1 ? '重试' : ''}...`);
        
        // 执行备份命令
        const command = this.buildMongodumpCommand(collection, outputPath, timeField, timeRange);
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr && !stderr.includes('done dumping')) {
          this.log(`备份警告 [${collection}]:`, stderr);
        }

        // 处理标准模式下的文件生成和压缩
        const finalFilePath = await this.processStandardModeOutput(command, collection, outputPath);
        
        // 验证最终备份文件
        if (fs.existsSync(finalFilePath)) {
          const stats = fs.statSync(finalFilePath);
          
          // 检查文件大小是否合理（至少要有一些内容）
          if (stats.size === 0) {
            throw new Error('备份文件为空');
          }
          
          this.log(`集合备份成功 [${collection}]: ${(stats.size / 1024).toFixed(2)} KB (第 ${attempt} 次${attempt > 1 ? '重试' : ''})`);
          
          return { filePath: finalFilePath, size: stats.size };
        } else {
          throw new Error('备份文件未生成');
        }
        
      } catch (error) {
        lastError = error;
        
        if (attempt <= maxRetries) {
          this.log(`备份失败 [${collection}] 第 ${attempt} 次尝试: ${error.message}`);
          this.log(`将在 ${retryDelay / 1000} 秒后进行第 ${attempt + 1} 次重试...`);
          
          // 等待重试间隔
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          this.log(`备份失败 [${collection}] 已达到最大重试次数 (${maxRetries})`);
          throw error;
        }
      }
    }
    
    // 如果所有重试都失败了，抛出最后一个错误
    throw lastError;
  }

  /**
   * 获取分类目录名（日期+类型的二级目录）
   */
  getCategoryDir(strategyName, backupDate = new Date()) {
    // 确保目标日期的目录存在
    this.ensureDateDirectories(backupDate);
    
    // 获取日期目录名
    const dateStr = this.formatDateForDirectory(backupDate);
    
    // 根据策略名称获取类型目录
    const typeMap = {
      hotCollections: 'hot',
      dailyCollections: 'daily',
      fullBackup: 'full',
      historyBackup: 'history',
      customBackup: 'custom',
      coreCollections: 'other',
      configCollections: 'other',
      analyticsCollections: 'other'
    };
    
    const typeDir = typeMap[strategyName] || 'other';
    
    // 返回 日期/类型 的组合路径
    return path.join(dateStr, typeDir);
  }

  /**
   * 执行策略备份
   */
  async executeStrategy(strategyName, strategy) {
    if (!strategy.collections || strategy.collections.length === 0) {
      this.log(`策略 [${strategyName}] 没有配置集合`);
      return;
    }

    this.log(`开始执行备份策略: ${strategyName}, 集合数量: ${strategy.collections.length}`);
    
    const results = [];

    // 顺序备份（一个一个执行，避免数据库压力过大）
    for (let i = 0; i < strategy.collections.length; i++) {
      const collection = strategy.collections[i];
      
      this.log(`正在备份 [${strategyName}] 集合 ${i + 1}/${strategy.collections.length}: ${collection}`);
      
      try {
        const result = await this.backupCollection(strategyName, collection, strategy);
        
        results.push({
          collection,
          ...result
        });
        
        // 备份完成后短暂等待，给数据库缓解压力的时间
        if (i < strategy.collections.length - 1) {
          this.log(`集合 ${collection} 备份完成，等待1秒后继续下一个...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        this.logError(`集合备份异常 [${strategyName}] ${collection}`, error);
        results.push({
          collection,
          success: false,
          error: error.message
        });
      }
    }
    
    // 统计结果
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    this.log(`策略 [${strategyName}] 执行完成: 成功 ${successful.length}, 失败 ${failed.length}`);
    
    // 清理旧备份
    await this.cleanupOldBackups(strategyName, strategy);
    
    return results;
  }

  /**
   * 清理旧备份文件（适配日期+类型的目录结构）
   */
  async cleanupOldBackups(strategyName, strategy) {
    try {
      const basePath = this.backupConfig.backupPath;
      const now = new Date();
      let deletedCount = 0;
      let deletedDirectories = 0;

      // 获取策略对应的类型目录名
      const typeMap = {
        hotCollections: 'hot',
        dailyCollections: 'daily',
        fullBackup: 'full',
        historyBackup: 'history',
        customBackup: 'custom'
      };
      const typeDir = typeMap[strategyName] || 'other';
      
      // 遍历所有日期目录
      const items = fs.readdirSync(basePath);
      
      for (const item of items) {
        // 跳过非日期目录（如 logs）
        if (!item.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
        
        const dateDir = path.join(basePath, item);
        const typeBackupDir = path.join(dateDir, typeDir);
        
        if (!fs.existsSync(typeBackupDir)) continue;
        
        // 检查这个日期目录是否应该被清理
        const dirDate = new Date(item + 'T00:00:00');
        let shouldDeleteDir = false;
        
        if (strategy.retentionHours) {
          const ageInHours = (now - dirDate) / (1000 * 60 * 60);
          shouldDeleteDir = ageInHours > strategy.retentionHours;
        } else if (strategy.retentionDays) {
          const ageInDays = (now - dirDate) / (1000 * 60 * 60 * 24);
          shouldDeleteDir = ageInDays > strategy.retentionDays;
        }
        
        if (shouldDeleteDir) {
          // 删除该日期下该类型的所有备份文件
          const files = fs.readdirSync(typeBackupDir);
          
                     for (const file of files) {
             // 跳过非备份文件
             if (!file.match(/\.(archive|gz)$/)) continue;
             
             const filePath = path.join(typeBackupDir, file);
             fs.unlinkSync(filePath);
             deletedCount++;
             this.log(`清理旧备份文件 [${strategyName}] ${item}/${typeDir}/${file}`);
           }
          
          // 如果类型目录为空，删除类型目录
          const remainingFiles = fs.readdirSync(typeBackupDir);
          if (remainingFiles.length === 0) {
            fs.rmdirSync(typeBackupDir);
            
            // 检查日期目录是否为空（除了可能存在的其他类型目录）
            const dateItems = fs.readdirSync(dateDir);
            const hasOtherFiles = dateItems.some(item => {
              const itemPath = path.join(dateDir, item);
              return fs.statSync(itemPath).isFile() || 
                     (fs.readdirSync(itemPath).length > 0);
            });
            
            // 如果日期目录下所有类型目录都为空，删除整个日期目录
            if (!hasOtherFiles) {
              // 删除所有空的子目录
              for (const subItem of dateItems) {
                const subPath = path.join(dateDir, subItem);
                if (fs.statSync(subPath).isDirectory()) {
                  try {
                    fs.rmdirSync(subPath);
                  } catch (e) {
                    // 忽略非空目录的删除错误
                  }
                }
              }
              
              // 尝试删除日期目录
              try {
                fs.rmdirSync(dateDir);
                deletedDirectories++;
                this.log(`清理空日期目录: ${item}`);
              } catch (e) {
                // 目录不为空，跳过
              }
            }
          }
        }
      }
      
      if (deletedCount > 0 || deletedDirectories > 0) {
        this.log(`策略 [${strategyName}] 清理完成: 删除了 ${deletedCount} 个文件，${deletedDirectories} 个目录`);
      }
      
    } catch (error) {
      this.logError(`清理旧备份失败 [${strategyName}]`, error);
    }
  }

  /**
   * 立即执行所有策略备份
   */
  async executeAllStrategies() {
    this.log('开始执行所有备份策略...');
    const startTime = Date.now();
    
    const results = {};
    
    for (const [strategyName, strategy] of Object.entries(this.backupConfig.strategies)) {
      try {
        results[strategyName] = await this.executeStrategy(strategyName, strategy);
      } catch (error) {
        this.logError(`执行策略失败 [${strategyName}]`, error);
        results[strategyName] = { success: false, error: error.message };
      }
    }
    
    const duration = Date.now() - startTime;
    this.log(`所有备份策略执行完成，耗时: ${(duration / 1000).toFixed(2)}秒`);
    
    return results;
  }

  /**
   * 启动定时任务
   */
  startScheduledBackups() {
    if (this.state.isRunning) {
      this.log('定时备份已经在运行中');
      return;
    }

    this.state.isRunning = true;
    this.log('启动增量备份定时任务...');
    
    // 为每个策略创建定时任务
    for (const [strategyName, strategy] of Object.entries(this.backupConfig.strategies)) {
      const job = schedule.scheduleJob(strategy.schedule, async () => {
        this.log(`触发定时备份策略: ${strategyName}`);
        try {
          await this.executeStrategy(strategyName, strategy);
        } catch (error) {
          this.logError(`定时备份策略执行失败 [${strategyName}]`, error);
        }
      });
      
      if (job && job.nextInvocation) {
        this.log(`策略 [${strategyName}] 下次执行时间: ${job.nextInvocation().toISOString()}`);
      }
    }
    
    // 健康检查定时任务
    if (this.backupConfig.healthCheck.enabled) {
      schedule.scheduleJob('*/5 * * * *', () => {
        this.performHealthCheck();
      });
    }
    
    this.log('所有定时任务已启动');
  }

  /**
   * 执行健康检查
   */
  performHealthCheck() {
    const { maxFailureCount } = this.backupConfig.healthCheck;
    const alerts = [];
    
    // 检查失败次数
    for (const [key, failureCount] of this.state.failureCount) {
      if (failureCount >= maxFailureCount) {
        alerts.push(`集合 ${key} 连续失败 ${failureCount} 次`);
      }
    }
    
    // 检查最后备份时间
    const now = new Date();
    for (const [strategyName, strategy] of Object.entries(this.backupConfig.strategies)) {
      for (const collection of strategy.collections) {
        const key = `${strategyName}_${collection}`;
        const lastBackup = this.state.lastBackupTimes.get(key);
        
        if (!lastBackup) {
          alerts.push(`集合 ${key} 从未备份过`);
          continue;
        }
        
        // 检查备份是否过期
        const expectedInterval = this.getExpectedInterval(strategy.schedule);
        const timeSinceLastBackup = now - lastBackup;
        
        if (timeSinceLastBackup > expectedInterval * 2) {
          alerts.push(`集合 ${key} 备份已过期 ${Math.floor(timeSinceLastBackup / (1000 * 60 * 60))} 小时`);
        }
      }
    }
    
    if (alerts.length > 0) {
      this.log('健康检查发现问题:', alerts);
      
      if (this.backupConfig.healthCheck.alertOnFailure) {
        this.sendAlert(alerts);
      }
    }
  }

  /**
   * 获取预期备份间隔（毫秒）
   */
  getExpectedInterval(schedule) {
    // 简单的调度解析，实际应该更复杂
    if (schedule.includes('*/1 * * *')) return 60 * 60 * 1000; // 1小时
    if (schedule.includes('*/6 * * *')) return 6 * 60 * 60 * 1000; // 6小时
    return 24 * 60 * 60 * 1000; // 默认24小时
  }

  /**
   * 发送告警
   */
  sendAlert(alerts) {
    // 这里可以集成邮件、钉钉、微信等告警方式
    this.log('发送告警:', alerts);
    
    const alertFile = path.join(this.backupConfig.backupPath, 'logs', 'alerts.log');
    const alertLine = `[${new Date().toISOString()}] 备份告警: ${alerts.join(', ')}\n`;
    
    try {
      fs.appendFileSync(alertFile, alertLine);
    } catch (e) {
      // 忽略错误
    }
  }

  /**
   * 获取管理器状态
   */
  getStatus() {
    const uptime = Date.now() - this.state.statistics.startTime.getTime();
    
    return {
      isRunning: this.state.isRunning,
      uptime: Math.floor(uptime / 1000),
      activeJobs: this.state.activeJobs.size,
      statistics: {
        ...this.state.statistics,
        successRate: this.state.statistics.totalBackups > 0 
          ? (this.state.statistics.successCount / this.state.statistics.totalBackups * 100).toFixed(2) + '%'
          : '0%',
        totalSizeMB: (this.state.statistics.totalSize / (1024 * 1024)).toFixed(2)
      },
      lastBackupTimes: Object.fromEntries(this.state.lastBackupTimes),
      failureCounts: Object.fromEntries(this.state.failureCount),
      scheduledJobs: Object.keys(this.backupConfig.strategies),
      backupPath: this.backupConfig.backupPath
    };
  }

  /**
   * 显示配置信息
   */
  showConfig() {
    console.log('\n=== 增量备份管理器配置 ===');
    console.log('数据库配置:');
    console.log(`  地址: ${this.config.host}:${this.config.port}`);
    console.log(`  数据库: ${this.config.database}`);
    console.log(`  用户名: ${this.config.username}`);
    
    console.log('\n备份配置:');
    console.log(`  备份路径: ${this.backupConfig.backupPath}`);
    console.log(`  目录结构: 日期/类型 二级目录 (如: 2024-09-20/hot/)`);
    console.log(`  使用归档模式: ${this.backupConfig.useArchiveMode}`);
    console.log(`  全局压缩: ${this.backupConfig.globalCompress}`);
    console.log(`  执行模式: 顺序执行（避免数据库压力过大）`);
    console.log(`  备份间隔: 每个集合间隔1秒`);
    
    console.log('\n备份策略:');
    // 添加调试信息
    if (!this.backupConfig.strategies) {
      console.log('  ❌ 策略配置未加载');
      return;
    }
    
    if (typeof this.backupConfig.strategies !== 'object') {
      console.log('  ❌ 策略配置类型错误:', typeof this.backupConfig.strategies);
      return;
    }
    
    const strategies = this.backupConfig.strategies;
    const strategyEntries = Object.entries(strategies);
    
    if (strategyEntries.length === 0) {
      console.log('  ❌ 没有找到任何备份策略');
      return;
    }
    
    for (const [name, strategy] of strategyEntries) {
      console.log(`  ${name} (${strategy.name || '未命名策略'}):`);
      console.log(`    调度: ${strategy.schedule || '未设置'}`);
      console.log(`    集合数量: ${strategy.collections ? strategy.collections.length : 0}`);
      console.log(`    时间字段: ${strategy.timeField || '未设置'}`);
      
      // 显示时间范围配置
      if (strategy.timeRange) {
        const timeRange = strategy.timeRange;
        let rangeDescription = '';
        switch (timeRange.type) {
          case 'today':
            rangeDescription = '当天数据';
            break;
          case 'full':
            rangeDescription = '全表数据（无时间限制）';
            break;
          case 'hours':
            rangeDescription = `最近${timeRange.hours || 24}小时`;
            break;
          case 'days':
            rangeDescription = `最近${timeRange.days || 7}天`;
            break;
          case 'custom':
            rangeDescription = `自定义范围: ${timeRange.startDate || '未设置'} 到 ${timeRange.endDate || '未设置'}`;
            break;
          default:
            rangeDescription = `未知类型: ${timeRange.type}`;
        }
        console.log(`    时间范围: ${rangeDescription}`);
      } else {
        console.log(`    时间范围: 当天数据（默认）`);
      }
      
      const retention = strategy.retentionHours 
        ? `${strategy.retentionHours}小时` 
        : strategy.retentionDays
          ? `${strategy.retentionDays}天`
          : '未设置';
      console.log(`    保留期: ${retention}`);
      console.log(`    优先级: ${strategy.priority || '未设置'}`);
    }
    
    console.log('========================\n');
  }

  /**
   * 主运行函数
   */
  async run(mode = 'start') {
    try {
      switch (mode) {
        case 'start':
          this.showConfig();
          this.startScheduledBackups();
          this.log('增量备份管理器已启动，按 Ctrl+C 停止');
          
          // 保持进程运行
          process.stdin.resume();
          break;
          
        case 'once':
          this.log('执行一次性备份...');
          await this.executeAllStrategies();
          this.log('一次性备份完成');
          break;
          
        case 'status':
          const status = this.getStatus();
          console.log('\n=== 增量备份管理器状态 ===');
          console.log(JSON.stringify(status, null, 2));
          console.log('========================\n');
          break;
          
        case 'config':
          this.showConfig();
          break;
          
        default:
          console.log('未知模式:', mode);
          break;
      }
      
    } catch (error) {
      this.logError('管理器运行失败', error);
      throw error;
    }
  }
}

// 命令行启动
if (require.main === module) {
  const manager = new IncrementalBackupManager();
  
  const argv = process.argv.slice(2);
  const mode = argv.find(arg => ['--start', '--once', '--status', '--config'].includes(arg))?.slice(2) || 'start';
  
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('\n增量备份管理器 - 使用方法:');
    console.log('  node incremental_backup_manager.js --start    # 启动定时备份服务');
    console.log('  node incremental_backup_manager.js --once     # 立即执行一次备份');
    console.log('  node incremental_backup_manager.js --status   # 查看当前状态');
    console.log('  node incremental_backup_manager.js --config   # 显示配置信息');
    console.log('  node incremental_backup_manager.js --help     # 显示帮助信息\n');
    process.exit(0);
  }
  
  manager.run(mode).catch(error => {
    console.error('管理器启动失败:', error.message);
    process.exit(1);
  });
}

module.exports = IncrementalBackupManager; 