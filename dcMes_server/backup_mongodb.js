#!/usr/bin/env node

/**
 * MongoDB数据库备份脚本
 * 
 * 功能特性：
 * - 自动备份dcMes数据库
 * - 生成带时间戳的备份文件名
 * - 支持跨平台压缩（Windows/Linux/macOS）
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
const zlib = require('zlib');
const os = require('os');
const schedule = require('node-schedule');

const execAsync = util.promisify(exec);

class MongoDBBackup {
  constructor() {
    // 数据库连接配置（从db.js文件获取）
    //  "mongodb://dcmesvncs:NHpmsLSARLWKky4A@127.0.0.1:27017/dcmesvncs";

    this.config = {
      host: '127.0.0.1',
      port: '27017',
      database: 'dcmesvncs',
      username: 'dcmesvncs',
      password: 'NHpmsLSARLWKky4A',
      authDatabase: 'dcmesvncs' // 认证数据库
    };

    // 备份配置
    this.backupConfig = {
      backupPath: 'D:/mongobackups',
      keepDays: 30,
      compress: true, // 是否对最终备份文件进行压缩
      useArchiveMode: true, // 使用mongodump --archive 直接生成单文件（推荐处理大数据）
      sequentialPerCollection: true, // 顺序逐集合备份（每个集合单独压缩文件，打印进度）
      numParallelCollections: Math.max(2, (os.cpus ? os.cpus().length : 4) - 1), // 并行集合数（非顺序模式才会用到）
      useOplog: false, // 副本集环境下开启一致性快照
      readPreference: null, // 例如: 'secondaryPreferred'，减轻主节点压力
      forceTableScan: false, // 大库建议关闭，避免全表扫描
      excludeCollections: [], // 需要排除的集合名
      nsInclude: ['api_logs'], // 仅备份的命名空间（如: 'db.coll' 或 'db.*'）
      timeRangeField: 'createdAt', // 时间字段名称，用于时间范围过滤
      timeRange: {
        enabled: false, // 是否启用时间范围过滤
        startTime: null, // 开始时间，格式：YYYY-MM-DD HH:mm:ss 或 Date 对象
        endTime: null, // 结束时间，格式同上
        today: false, // 是否只备份今天的数据
        todayStartHour: 0, // 今天开始小时（0-23）
        todayEndHour: 23, // 今天结束小时（0-23）
        todayStartMinute: 0, // 开始分钟（0-59）
        todayEndMinute: 59 // 结束分钟（0-59）
      },
      maxRetries: 3,
      retryDelay: 5000 // 重试延迟5秒
    };

    // 检测操作系统
    this.isWindows = os.platform() === 'win32';

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
   * 生成备份文件名（整库模式）
   * @returns {string} 备份文件名
   */
  generateBackupFileName() {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .split('.')[0]; // 移除毫秒部分
    
    const fileName = `dcMes_backup_${timestamp}`;
    if (this.backupConfig.compress) {
      if (this.backupConfig.useArchiveMode) {
        return `${fileName}.archive.gz`;
      }
      return `${fileName}.tar.gz`;
    }
    return fileName;
  }

  /**
   * 生成每集合备份文件名
   * @param {string} collectionName 集合名
   */
  generatePerCollectionFileName(collectionName) {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .split('.')[0];
    const safeName = collectionName.replace(/[^a-zA-Z0-9._$-]/g, '_');
    
    // 添加时间范围到文件名
    let timeRangeSuffix = '';
    if (this.backupConfig.timeRange && this.backupConfig.timeRange.enabled) {
      if (this.backupConfig.timeRange.today) {
        const { todayStartHour, todayEndHour, todayStartMinute, todayEndMinute } = this.backupConfig.timeRange;
        timeRangeSuffix = `_${todayStartHour}-${todayStartMinute}_to_${todayEndHour}-${todayEndMinute}`;
      } else if (this.backupConfig.timeRange.startTime && this.backupConfig.timeRange.endTime) {
        const startStr = typeof this.backupConfig.timeRange.startTime === 'string' 
          ? this.backupConfig.timeRange.startTime.replace(/[: -]/g, '_')
          : this.backupConfig.timeRange.startTime.toISOString().replace(/[:.]/g, '_');
        const endStr = typeof this.backupConfig.timeRange.endTime === 'string'
          ? this.backupConfig.timeRange.endTime.replace(/[: -]/g, '_') 
          : this.backupConfig.timeRange.endTime.toISOString().replace(/[:.]/g, '_');
        timeRangeSuffix = `_${startStr}_to_${endStr}`;
      }
    }
    
    if (this.backupConfig.useArchiveMode) {
      return `dcMes_backup_${timestamp}${timeRangeSuffix}_${safeName}.archive${this.backupConfig.compress ? '.gz' : ''}`;
    }
    return `dcMes_backup_${timestamp}${timeRangeSuffix}_${safeName}${this.backupConfig.compress ? '.tar.gz' : ''}`;
  }

  /**
   * 检查mongodump是否可用
   * @returns {Promise<boolean>} 是否可用
   */
  async checkMongodumpAvailable() {
    try {
      // 优先使用当前脚本目录下的 Tools/100/bin/mongodump(.exe)
      const localMongodump = path.join(__dirname, 'Tools', '100', 'bin', this.isWindows ? 'mongodump.exe' : 'mongodump');
      if (fs.existsSync(localMongodump)) {
        const quoted = localMongodump.includes(' ') ? `"${localMongodump}"` : localMongodump;
        const { stdout } = await execAsync(`${quoted} --version`);
        this.mongodumpPath = localMongodump;
        this.log('使用本地Tools目录中的MongoDB数据库工具:', localMongodump);
        
        // 解析版本号
        const versionMatch = stdout.match(/version: (\d+)\.(\d+)\.(\d+)/);
        if (versionMatch) {
          const major = parseInt(versionMatch[1], 10);
          const minor = parseInt(versionMatch[2], 10);
          this.mongodumpVersion = { major, minor, full: stdout.trim() };
          this.log('MongoDB工具版本:', this.mongodumpVersion.full);
        }
        
        return true;
      }

      // Windows 常见安装路径（如果用户把工具装在系统目录）
      if (this.isWindows) {
        const windowsDefaultPath = 'C:/Program Files/MongoDB/Tools/100/bin/mongodump.exe';
        if (fs.existsSync(windowsDefaultPath)) {
          const { stdout } = await execAsync(`"${windowsDefaultPath}" --version`);
          this.mongodumpPath = windowsDefaultPath;
          this.log('使用系统MongoDB数据库工具:', windowsDefaultPath);
          
          // 解析版本号
          const versionMatch = stdout.match(/version: (\d+)\.(\d+)\.(\d+)/);
          if (versionMatch) {
            const major = parseInt(versionMatch[1], 10);
            const minor = parseInt(versionMatch[2], 10);
            this.mongodumpVersion = { major, minor, full: stdout.trim() };
            this.log('MongoDB工具版本:', this.mongodumpVersion.full);
          }
          
          return true;
        }
      }

      // 尝试系统 PATH 中的 mongodump
      const { stdout } = await execAsync('mongodump --version');
      this.mongodumpPath = 'mongodump';
      
      // 解析版本号
      const versionMatch = stdout.match(/version: (\d+)\.(\d+)\.(\d+)/);
      if (versionMatch) {
        const major = parseInt(versionMatch[1], 10);
        const minor = parseInt(versionMatch[2], 10);
        this.mongodumpVersion = { major, minor, full: stdout.trim() };
        this.log('MongoDB工具版本:', this.mongodumpVersion.full);
      }
      
      return true;
    } catch (error) {
      // 如果系统路径中没有，尝试本地及常见路径
      const possiblePaths = this.isWindows
        ? [
            path.join(process.cwd(), 'Tools', '100', 'bin', 'mongodump.exe'),
            'C:/Program Files/MongoDB/Tools/100/bin/mongodump.exe',
            'C:/Program Files/MongoDB/Tools/bin/mongodump.exe',
            'C:/mongodb/bin/mongodump.exe'
          ]
        : [
            path.join(__dirname, 'Tools', '100', 'bin', 'mongodump'),
            './mongodb-database-tools/bin/mongodump',
            './bin/mongodump',
            '~/mongodb/bin/mongodump'
          ];

      for (const testPath of possiblePaths) {
        try {
          if (fs.existsSync(testPath)) {
            const quoted = testPath.includes(' ') ? `"${testPath}"` : testPath;
            const { stdout } = await execAsync(`${quoted} --version`);
            this.mongodumpPath = testPath;
            this.log('使用本地/常见路径中的MongoDB数据库工具:', testPath);
            
            // 解析版本号
            const versionMatch = stdout.match(/version: (\d+)\.(\d+)\.(\d+)/);
            if (versionMatch) {
              const major = parseInt(versionMatch[1], 10);
              const minor = parseInt(versionMatch[2], 10);
              this.mongodumpVersion = { major, minor, full: stdout.trim() };
              this.log('MongoDB工具版本:', this.mongodumpVersion.full);
            }
            
            return true;
          }
        } catch (pathError) {
          continue;
        }
      }
      
      return false;
    }
  }

  /**
   * 构建mongodump命令（整库）
   * @param {string} outputPath - 输出目录（非archive模式）
   * @param {string} archiveFilePath - 输出文件（archive模式）
   * @returns {string} mongodump命令
   */
  buildMongodumpCommand(outputPath, archiveFilePath) {
    const { host, port, database, username, password, authDatabase } = this.config;
    const {
      useArchiveMode,
      compress,
      numParallelCollections,
      useOplog,
      readPreference,
      forceTableScan
    } = this.backupConfig;
    
    // 使用检测到的 mongodump 路径，并在包含空格时自动加引号
    const mongodumpCmd = this.mongodumpPath || 'mongodump';
    const commandBinary = mongodumpCmd.includes(' ') ? `"${mongodumpCmd}"` : mongodumpCmd;
    
    let command = commandBinary;
    command += ` --host ${host}:${port}`;
    command += ` --db ${database}`;
    command += ` --username ${username}`;
    command += ` --password "${password}"`;
    command += ` --authenticationDatabase ${authDatabase}`;

    // 并行度（提升大库导出速度） - 顺序模式下不使用
    if (!this.backupConfig.sequentialPerCollection && numParallelCollections && Number.isFinite(numParallelCollections)) {
      command += ` --numParallelCollections ${numParallelCollections}`;
    }

    // 读取偏好（副本集可从secondary导出减压主节点）
    if (readPreference) {
      command += ` --readPreference ${readPreference}`;
    }

    // 副本集一致性快照
    if (useOplog) {
      command += ` --oplog`;
    }

    // 注意：不再使用 --nsInclude 参数，改为在 getCollectionNames 方法中过滤集合

    // 输出方式
    if (useArchiveMode) {
      if (archiveFilePath) {
        command += ` --archive="${archiveFilePath}"`;
      } else {
        command += ` --archive`;
      }
      if (compress) {
        command += ` --gzip`;
      }
    } else {
      command += ` --out "${outputPath}"`;
      // 非archive模式下，为避免双重压缩，这里默认不加 --gzip
    }

    // 是否强制表扫描（大库建议关闭）
    if (forceTableScan) {
      command += ` --forceTableScan`;
    }
    
    return command;
  }

  /**
   * 构建时间范围查询条件
   * @returns {string} JSON 查询条件字符串
   */
  buildTimeRangeQuery() {
    const { timeRange, timeRangeField } = this.backupConfig;
    
    if (!timeRange || !timeRange.enabled || !timeRangeField) {
      return null;
    }
    
    let startTime, endTime;
    
    // 处理"今天"的时间范围
    if (timeRange.today) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      startTime = new Date(today);
      startTime.setHours(
        timeRange.todayStartHour || 0,
        timeRange.todayStartMinute || 0,
        0, 0
      );
      
      endTime = new Date(today);
      endTime.setHours(
        timeRange.todayEndHour !== undefined ? timeRange.todayEndHour : 23,
        timeRange.todayEndMinute !== undefined ? timeRange.todayEndMinute : 59,
        59, 999
      );
    } else {
      // 处理明确的时间范围
      if (timeRange.startTime) {
        startTime = typeof timeRange.startTime === 'string' 
          ? new Date(timeRange.startTime) 
          : timeRange.startTime;
      }
      
      if (timeRange.endTime) {
        endTime = typeof timeRange.endTime === 'string'
          ? new Date(timeRange.endTime)
          : timeRange.endTime;
      }
    }
    
    // 构建查询
    const query = {};
    
    if (startTime && endTime) {
      query[timeRangeField] = { 
        "$gte": startTime,
        "$lte": endTime
      };
    } else if (startTime) {
      query[timeRangeField] = { "$gte": startTime };
    } else if (endTime) {
      query[timeRangeField] = { "$lte": endTime };
    } else {
      return null;
    }
    
    return JSON.stringify(query);
  }

  /**
   * 获取时间范围的可读描述
   */
  getTimeRangeDescription() {
    const { timeRange } = this.backupConfig;
    
    if (!timeRange || !timeRange.enabled) {
      return '全部数据';
    }
    
    if (timeRange.today) {
      const { todayStartHour, todayEndHour, todayStartMinute, todayEndMinute } = timeRange;
      return `今天 ${todayStartHour}:${todayStartMinute.toString().padStart(2, '0')} 至 ${todayEndHour}:${todayEndMinute.toString().padStart(2, '0')}`;
    }
    
    let startStr = '无限制';
    let endStr = '无限制';
    
    if (timeRange.startTime) {
      startStr = typeof timeRange.startTime === 'string'
        ? timeRange.startTime
        : timeRange.startTime.toISOString().replace('T', ' ').split('.')[0];
    }
    
    if (timeRange.endTime) {
      endStr = typeof timeRange.endTime === 'string'
        ? timeRange.endTime
        : timeRange.endTime.toISOString().replace('T', ' ').split('.')[0];
    }
    
    return `${startStr} 至 ${endStr}`;
  }

  /**
   * 构建mongodump命令（单集合）
   */
  buildMongodumpCommandForCollection(collectionName, outputPath, archiveFilePath) {
    const base = this.buildMongodumpCommand(outputPath, archiveFilePath);
    let command = `${base} --collection ${collectionName}`;
    
    // 添加时间范围查询条件
    const timeRangeQuery = this.buildTimeRangeQuery();
    if (timeRangeQuery) {
      // 在Windows上，需要对JSON字符串中的引号进行转义
      const escapedQuery = this.isWindows 
        ? timeRangeQuery.replace(/"/g, '\\"')
        : timeRangeQuery;
      command += ` --query '${escapedQuery}'`;
    }
    
    return command;
  }

  /**
   * 尝试安装mongodump工具
   */
  async installMongodump() {
    this.log('正在尝试安装MongoDB数据库工具...');
    
    const platform = os.platform();
    
    try {
      if (platform === 'darwin') {
        // macOS系统尝试使用Homebrew安装
        this.log('检查Homebrew是否可用...');
        try {
          await execAsync('brew --version');
          this.log('使用Homebrew安装MongoDB数据库工具...');
          
          try {
            // 先尝试添加MongoDB tap
            await execAsync('brew tap mongodb/brew', { timeout: 30000 });
          } catch (tapError) {
            this.log('MongoDB tap可能已存在，继续安装...');
          }
          
          // 安装数据库工具
          await execAsync('brew install mongodb-database-tools', { timeout: 120000 });
          this.log('MongoDB数据库工具安装成功！');
          return true;
          
        } catch (brewError) {
          this.log('Homebrew不可用或安装失败，请手动安装');
          this.showManualInstallInstructions();
          return false;
        }
      } else if (platform === 'linux') {
        // Linux系统的安装指导
        this.log('Linux系统检测到，请手动安装MongoDB数据库工具');
        this.showLinuxInstallInstructions();
        return false;
      } else if (platform === 'win32') {
        // Windows系统的安装指导
        this.log('Windows系统检测到，请手动安装MongoDB数据库工具');
        this.showWindowsInstallInstructions();
        return false;
      } else {
        this.log('未识别的操作系统，请手动安装MongoDB数据库工具');
        this.showManualInstallInstructions();
        return false;
      }
    } catch (error) {
      this.logError('自动安装MongoDB数据库工具失败', error);
      this.showManualInstallInstructions();
      return false;
    }
  }

  /**
   * 显示手动安装指导（macOS）
   */
  showManualInstallInstructions() {
    console.log('\n=== MongoDB数据库工具安装指导 ===');
    console.log('请选择以下任一方式安装MongoDB数据库工具：');
    console.log('\n方式1: 使用Homebrew（推荐）');
    console.log('1. 如果没有Homebrew，先安装：');
    console.log('   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    console.log('2. 安装MongoDB数据库工具：');
    console.log('   brew tap mongodb/brew');
    console.log('   brew install mongodb-database-tools');
    
    console.log('\n方式2: 手动下载安装');
    console.log('1. 访问：https://www.mongodb.com/try/download/database-tools');
    console.log('2. 下载适合您系统的版本');
    console.log('3. 解压到系统PATH路径中');
    
    console.log('\n方式3: 使用Docker（适用于任何系统）');
    console.log('如果您有Docker，可以使用以下命令进行备份：');
    console.log('docker run --rm -v $(pwd)/backups:/backup mongo:latest mongodump \\n');
    console.log('  --host 47.115.19.76:27017 \\\n');
    console.log('  --db dcMes \\\n');
    console.log('  --username dcMes \\\n');
    console.log('  --password dcMes123. \\\n');
    console.log('  --authenticationDatabase dcMes \\\n');
    console.log('  --out /backup');
    console.log('\n=================================\n');
  }

  /**
   * 显示Linux安装指导
   */
  showLinuxInstallInstructions() {
    console.log('\n=== Linux系统MongoDB数据库工具安装指导 ===');
    console.log('Ubuntu/Debian系统：');
    console.log('1. 添加MongoDB仓库密钥：');
    console.log('   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -');
    console.log('2. 添加仓库：');
    console.log('   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list');
    console.log('3. 安装工具：');
    console.log('   sudo apt-get update');
    console.log('   sudo apt-get install mongodb-database-tools');
    
    console.log('\nCentOS/RHEL/Fedora系统：');
    console.log('1. 创建仓库文件：');
    console.log('   sudo vi /etc/yum.repos.d/mongodb-org-7.0.repo');
    console.log('2. 安装工具：');
    console.log('   sudo yum install mongodb-database-tools');
    console.log('==========================================\n');
  }

  /**
   * 显示Windows安装指导
   */
  showWindowsInstallInstructions() {
    console.log('\n=== Windows系统MongoDB数据库工具安装指导 ===');
    console.log('方式1: 使用Chocolatey（推荐）');
    console.log('1. 如果没有Chocolatey，先安装：');
    console.log('   以管理员身份运行PowerShell，执行：');
    console.log('   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString("https://chocolatey.org/install.ps1"))');
    console.log('2. 安装MongoDB数据库工具：');
    console.log('   choco install mongodb-database-tools');
    
    console.log('\n方式2: 手动下载安装');
    console.log('1. 访问：https://www.mongodb.com/try/download/database-tools');
    console.log('2. 下载Windows版本');
    console.log('3. 解压到C:\\mongodb\\bin');
    console.log('4. 将C:\\mongodb\\bin添加到系统PATH环境变量');
    console.log('=============================================\n');
  }

  /**
   * 安装所需依赖
   */
  async installDependencies() {
    // archiver 仅在目录模式压缩时需要
    try {
      if (this.backupConfig.compress && !this.backupConfig.useArchiveMode) {
        require.resolve('archiver');
      }
    } catch (error) {
      this.log('检测到缺少archiver库，正在安装...');
      try {
        await execAsync('npm install archiver --save');
        this.log('archiver库安装成功');
      } catch (installError) {
        this.logError('无法自动安装archiver库', installError);
        throw new Error('请手动安装archiver库: npm install archiver');
      }
    }

    // mongodb 驱动在顺序逐集合模式需要
    if (this.backupConfig.sequentialPerCollection) {
      try {
        require.resolve('mongodb');
      } catch (e) {
        this.log('检测到缺少mongodb驱动，正在安装...');
        try {
          await execAsync('npm install mongodb --save');
          this.log('mongodb驱动安装成功');
        } catch (installError) {
          this.logError('无法自动安装mongodb驱动', installError);
          throw new Error('请手动安装mongodb驱动: npm install mongodb');
        }
      }
    }
  }

  /**
   * 从数据库获取集合列表
   */
  async getCollectionNames() {
    const { host, port, database, username, password, authDatabase } = this.config;
    const { excludeCollections, nsInclude } = this.backupConfig;

    try {
      // 方法1：使用MongoDB驱动获取集合列表（优先）
      try {
        const uri = `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}?authSource=${authDatabase}`;
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
        
        await client.connect();
        const db = client.db(database);
        const cursor = db.listCollections({}, { nameOnly: true });
        const collections = await cursor.toArray();
        let names = collections.map(c => c.name);
        
        // 应用集合过滤
        if (Array.isArray(nsInclude) && nsInclude.length > 0) {
          const includeSet = new Set();
          for (const item of nsInclude) {
            if (item === `${database}.*`) {
              names.forEach(n => includeSet.add(n));
            } else if (item.startsWith(`${database}.`)) {
              includeSet.add(item.slice(database.length + 1));
            } else {
              includeSet.add(item);
            }
          }
          names = names.filter(n => includeSet.has(n));
        }

        if (Array.isArray(excludeCollections) && excludeCollections.length > 0) {
          const excludeSet = new Set(excludeCollections);
          names = names.filter(n => !excludeSet.has(n));
        }
        
        await client.close().catch(() => {});
        this.log(`通过MongoDB驱动获取到 ${names.length} 个集合`);
        return names;
      } catch (driverError) {
        this.log('MongoDB驱动获取集合列表失败，尝试使用命令行方式', driverError.message);
      }
      
      // 方法2：使用mongodump --listCollections命令获取集合列表（备用）
      const mongodumpCmd = this.mongodumpPath || 'mongodump';
      const commandBinary = mongodumpCmd.includes(' ') ? `"${mongodumpCmd}"` : mongodumpCmd;
      
      let command = `${commandBinary} --host ${host}:${port} --db ${database} --username ${username} --password "${password}" --authenticationDatabase ${authDatabase}`;
      
      // 检查是否支持 --listCollections 参数
      if (this.mongodumpVersion && this.mongodumpVersion.major >= 100) {
        command += ' --listCollections';
        
        const { stdout } = await execAsync(command);
        const collectionLines = stdout.split('\n').filter(line => line.trim());
        let names = collectionLines.map(line => {
          const match = line.match(/collection: (.+)/);
          return match ? match[1] : null;
        }).filter(Boolean);
        
        // 应用集合过滤
        if (Array.isArray(nsInclude) && nsInclude.length > 0) {
          const includeSet = new Set();
          for (const item of nsInclude) {
            if (item === `${database}.*`) {
              names.forEach(n => includeSet.add(n));
            } else if (item.startsWith(`${database}.`)) {
              includeSet.add(item.slice(database.length + 1));
            } else {
              includeSet.add(item);
            }
          }
          names = names.filter(n => includeSet.has(n));
        }

        if (Array.isArray(excludeCollections) && excludeCollections.length > 0) {
          const excludeSet = new Set(excludeCollections);
          names = names.filter(n => !excludeSet.has(n));
        }
        
        this.log(`通过mongodump --listCollections获取到 ${names.length} 个集合`);
        return names;
      } else {
        // 如果都失败了，直接使用nsInclude中指定的集合
        if (Array.isArray(nsInclude) && nsInclude.length > 0) {
          const names = nsInclude.map(item => {
            if (item.startsWith(`${database}.`)) {
              return item.slice(database.length + 1);
            }
            return item;
          }).filter(name => !excludeCollections.includes(name));
          
          this.log(`使用配置中指定的集合列表: ${names.join(', ')}`);
          return names;
        }
        
        // 最后的备选方案：尝试获取一个常见的系统集合，确认连接可用
        this.log('无法获取集合列表，将尝试备份指定的集合');
        return ['api_logs']; // 默认备份api_logs集合
      }
    } catch (error) {
      this.logError('获取集合列表失败', error);
      // 如果指定了集合，则使用指定的集合
      if (Array.isArray(nsInclude) && nsInclude.length > 0) {
        const names = nsInclude.map(item => {
          if (item.startsWith(`${database}.`)) {
            return item.slice(database.length + 1);
          }
          return item;
        });
        this.log(`使用配置中指定的集合列表（出错后）: ${names.join(', ')}`);
        return names;
      }
      return ['api_logs']; // 默认备份api_logs集合
    }
  }

  /**
   * 进度打印
   */
  printProgress(current, total, collection) {
    const percent = total > 0 ? Math.floor((current / total) * 100) : 0;
    const line = `进度: ${current}/${total} (${percent}%) - 当前集合: ${collection}`;
    if (process.stdout && process.stdout.write) {
      process.stdout.write(`\r${line}`);
    } else {
      this.log(line);
    }
  }

  /**
   * 顺序逐集合备份
   */
  async performBackupSequentialPerCollection() {
    this.log('启动顺序逐集合备份模式...');

    // 检查mongodump
    if (!(await this.checkMongodumpAvailable())) {
      const installSuccess = await this.installMongodump();
      if (!installSuccess || !(await this.checkMongodumpAvailable())) {
        throw new Error('mongodump命令不可用，无法执行逐集合备份');
      }
    }

    // 依赖
    await this.installDependencies();

    // 获取集合列表
    const collections = await this.getCollectionNames();
    if (!collections || collections.length === 0) {
      this.log('未找到可备份的集合');
      return null;
    }

    const total = collections.length;
    const outputFiles = [];
    const startAll = Date.now();

    for (let i = 0; i < total; i++) {
      const coll = collections[i];
      this.printProgress(i + 1, total, coll);
      this.log(`开始备份集合: ${coll}`);

      const fileName = this.generatePerCollectionFileName(coll);
      const finalBackupPath = path.join(this.backupConfig.backupPath, fileName);
      const tempBackupPath = path.join(this.backupConfig.backupPath, `temp_${coll}`);

      try {
        // 清理临时目录
        if (fs.existsSync(tempBackupPath)) {
          fs.rmSync(tempBackupPath, { recursive: true, force: true });
        }

        const startOne = Date.now();

        if (this.backupConfig.useArchiveMode) {
          const command = this.buildMongodumpCommandForCollection(coll, null, finalBackupPath);
          const { stdout, stderr } = await execAsync(command);
          if (stderr && !stderr.includes('done dumping')) {
            this.log('备份警告:', stderr);
          }
        } else {
          const command = this.buildMongodumpCommandForCollection(coll, tempBackupPath, null);
          const { stdout, stderr } = await execAsync(command);
          if (stderr && !stderr.includes('done dumping')) {
            this.log('备份警告:', stderr);
          }

          // 目录压缩或移动
          if (this.backupConfig.compress) {
            await this.compressBackup(tempBackupPath, finalBackupPath);
          } else {
            const src = path.join(tempBackupPath, this.config.database);
            // 针对单集合dump，mongodump会在 db 目录下生成多个文件（.bson/.json/.metadata）
            // 这里将整个目录重命名为带集合名的目录
            const targetDir = finalBackupPath;
            fs.renameSync(src, targetDir);
          }
        }

        // 清理临时目录
        if (fs.existsSync(tempBackupPath)) {
          fs.rmSync(tempBackupPath, { recursive: true, force: true });
        }

        // 验证单文件
        if (this.backupConfig.useArchiveMode || this.backupConfig.compress) {
          await this.verifyBackup(finalBackupPath);
        }

        const oneDuration = Date.now() - startOne;
        this.log(`集合备份完成: ${coll}, 输出: ${finalBackupPath}, 耗时: ${oneDuration}ms`);
        outputFiles.push(finalBackupPath);

      } catch (error) {
        this.logError(`集合备份失败: ${coll}`, error);
        throw error;
      }
    }

    const duration = Date.now() - startAll;
    // 结束时换行，避免最后一条进度行覆盖
    if (process.stdout && process.stdout.write) process.stdout.write('\n');
    this.log(`逐集合备份完成，共 ${outputFiles.length} 个文件，耗时: ${(duration/1000).toFixed(2)}s`);

    return outputFiles;
  }

  /**
   * 执行数据库备份（整库）
   * @param {number} retryCount - 重试次数
   * @returns {Promise<string>} 备份文件路径
   */
  async performBackup(retryCount = 0) {
    this.log('开始数据库备份...');
    
    // 检查mongodump是否可用
    if (!(await this.checkMongodumpAvailable())) {
      this.log('mongodump命令不可用，尝试自动安装...');
      
      const installSuccess = await this.installMongodump();
      
      if (!installSuccess) {
        throw new Error('mongodump命令不可用，请按照上述指导手动安装MongoDB数据库工具后重新运行备份脚本');
      }
      
      // 重新检查是否安装成功
      if (!(await this.checkMongodumpAvailable())) {
        throw new Error('MongoDB数据库工具安装后仍不可用，请检查PATH环境变量或重新启动终端');
      }
      
      this.log('MongoDB数据库工具安装成功，继续备份...');
    }

    const backupFileName = this.generateBackupFileName();
    const tempBackupPath = path.join(this.backupConfig.backupPath, 'temp');
    const finalBackupPath = path.join(this.backupConfig.backupPath, backupFileName);

    try {
      // 清理临时目录
      if (fs.existsSync(tempBackupPath)) {
        fs.rmSync(tempBackupPath, { recursive: true, force: true });
      }

      const startTime = Date.now();

      if (this.backupConfig.useArchiveMode) {
        // 直接使用 --archive 将数据导出为单文件（可选gzip），避免二次压缩与大量小文件IO
        const command = this.buildMongodumpCommand(null, finalBackupPath);
        this.log('执行备份命令 (archive 模式)...');
        const { stdout, stderr } = await execAsync(command);
        if (stderr && !stderr.includes('done dumping')) {
          this.log('备份警告:', stderr);
        }
      } else {
        // 目录导出模式
        const command = this.buildMongodumpCommand(tempBackupPath, null);
        this.log('执行备份命令 (目录模式)...');
        const { stdout, stderr } = await execAsync(command);
        if (stderr && !stderr.includes('done dumping')) {
          this.log('备份警告:', stderr);
        }

        // 压缩为tar.gz或移动目录
        if (this.backupConfig.compress) {
          await this.compressBackup(tempBackupPath, finalBackupPath);
        } else {
          fs.renameSync(path.join(tempBackupPath, this.config.database), finalBackupPath);
        }
      }

      const duration = Date.now() - startTime;
      this.log(`数据库备份完成，耗时: ${duration}ms`);

      // 清理临时文件（仅目录模式会产生）
      if (fs.existsSync(tempBackupPath)) {
        fs.rmSync(tempBackupPath, { recursive: true, force: true });
      }

      // 验证备份文件/目录
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
        try {
          const stats = fs.statSync(finalBackupPath);
          if (stats.isDirectory()) {
            fs.rmSync(finalBackupPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(finalBackupPath);
          }
        } catch (e) {
          // ignore
        }
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
   * 压缩备份文件 - 跨平台实现
   * @param {string} sourcePath - 源路径
   * @param {string} targetPath - 目标路径
   */
  async compressBackup(sourcePath, targetPath) {
    this.log('正在压缩备份文件...');
    
    const startTime = Date.now();
    
    try {
      if (this.isWindows) {
        // Windows系统使用Node.js archiver库进行压缩
        await this.compressWithArchiver(sourcePath, targetPath);
      } else {
        // Linux/macOS系统可以使用tar命令或archiver库
        try {
          await this.compressWithTar(sourcePath, targetPath);
        } catch (error) {
          this.log('tar命令失败，改用archiver库...');
          await this.compressWithArchiver(sourcePath, targetPath);
        }
      }
      
      const duration = Date.now() - startTime;
      this.log(`备份文件压缩完成，耗时: ${duration}ms`);
    } catch (error) {
      this.logError('压缩备份文件失败', error);
      throw error;
    }
  }

  /**
   * 使用tar命令压缩（Linux/macOS）
   * @param {string} sourcePath - 源路径
   * @param {string} targetPath - 目标路径
   */
  async compressWithTar(sourcePath, targetPath) {
    const command = `tar -czf "${targetPath}" -C "${sourcePath}" .`;
    await execAsync(command);
  }

  /**
   * 使用archiver库压缩（跨平台）
   * @param {string} sourcePath - 源路径
   * @param {string} targetPath - 目标路径
   */
  async compressWithArchiver(sourcePath, targetPath) {
    const archiver = require('archiver');
    return new Promise((resolve, reject) => {
      try {
        // 创建输出流
        const output = fs.createWriteStream(targetPath);
        const archive = archiver('tar', {
          gzip: true,
          gzipOptions: {
            level: 9,
            memLevel: 9
          }
        });

        // 监听事件
        output.on('close', () => {
          this.log(`压缩完成，文件大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
          resolve();
        });

        archive.on('error', (err) => {
          this.logError('archiver压缩错误', err);
          reject(err);
        });

        output.on('error', (err) => {
          this.logError('输出流错误', err);
          reject(err);
        });

        // 连接输出流
        archive.pipe(output);

        // 添加目录到压缩包
        archive.directory(sourcePath, false);

        // 完成压缩
        archive.finalize();

      } catch (error) {
        reject(error);
      }
    });
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
      this.log('操作系统:', os.platform());
      this.log('数据库:', `${this.config.host}:${this.config.port}/${this.config.database}`);
      this.log('备份路径:', this.backupConfig.backupPath);
      this.log('模式:', this.backupConfig.sequentialPerCollection ? '逐集合顺序备份' : '整库备份');
      
      // 添加时间范围信息到日志
      if (this.backupConfig.timeRange && this.backupConfig.timeRange.enabled) {
        this.log('时间范围:', this.getTimeRangeDescription());
        this.log('时间字段:', this.backupConfig.timeRangeField);
      }
      
      this.log('='.repeat(60));

      // 检查并安装依赖
      await this.installDependencies();

      // 显示当前备份状态
      const status = this.getBackupStatus();
      this.log('当前备份状态:', status);

      // 执行备份
      let backupOutput = null;
      if (this.backupConfig.sequentialPerCollection) {
        backupOutput = await this.performBackupSequentialPerCollection();
      } else {
        backupOutput = await this.performBackup();
      }
      
      // 清理旧备份
      await this.cleanupOldBackups();
      
      const duration = Date.now() - startTime;
      
      this.log('='.repeat(60));
      this.log('备份任务完成');
      this.log('备份输出:', Array.isArray(backupOutput) ? `${backupOutput.length} 个文件` : backupOutput);
      this.log('总耗时:', `${(duration / 1000).toFixed(2)}秒`);
      this.log('='.repeat(60));

      // 显示最新备份状态
      const newStatus = this.getBackupStatus();
      this.log('更新后备份状态:', newStatus);

      return { success: true, backupFile: backupOutput, duration };
      
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
  
  // 命令行参数解析
  const argv = process.argv.slice(2);
  const help = argv.includes('-h') || argv.includes('--help');
  const runOnce = argv.includes('--once') || argv.includes('--now') || argv.includes('run');
  const scheduleMode = argv.includes('--schedule') || (!runOnce);
  const cronIndex = Math.max(argv.indexOf('--cron'), argv.indexOf('-c'));
  const cronFromArg = cronIndex > -1 && argv[cronIndex + 1] ? argv[cronIndex + 1] : null;
  const cronExpr = cronFromArg || process.env.SCHEDULE_CRON || '0 0 2 * * *'; // 每天 02:00:00
  
  // 解析时间范围参数
  const todayIndex = argv.indexOf('--today');
  if (todayIndex > -1) {
    backup.backupConfig.timeRange.enabled = true;
    backup.backupConfig.timeRange.today = true;
    
    // 检查是否有时间范围参数
    if (todayIndex + 1 < argv.length && argv[todayIndex + 1].includes('-')) {
      const timeRange = argv[todayIndex + 1].split('-');
      if (timeRange.length === 2) {
        const startParts = timeRange[0].split(':');
        const endParts = timeRange[1].split(':');
        
        if (startParts.length >= 1) {
          backup.backupConfig.timeRange.todayStartHour = parseInt(startParts[0], 10);
          if (startParts.length >= 2) {
            backup.backupConfig.timeRange.todayStartMinute = parseInt(startParts[1], 10);
          }
        }
        
        if (endParts.length >= 1) {
          backup.backupConfig.timeRange.todayEndHour = parseInt(endParts[0], 10);
          if (endParts.length >= 2) {
            backup.backupConfig.timeRange.todayEndMinute = parseInt(endParts[1], 10);
          }
        }
      }
    }
  }
  
  // 解析时间字段参数
  const fieldIndex = argv.indexOf('--field');
  if (fieldIndex > -1 && fieldIndex + 1 < argv.length) {
    backup.backupConfig.timeRangeField = argv[fieldIndex + 1];
  }
  
  // 解析开始和结束时间参数
  const startTimeIndex = argv.indexOf('--start');
  const endTimeIndex = argv.indexOf('--end');
  
  if (startTimeIndex > -1 && startTimeIndex + 1 < argv.length) {
    backup.backupConfig.timeRange.enabled = true;
    backup.backupConfig.timeRange.startTime = argv[startTimeIndex + 1];
  }
  
  if (endTimeIndex > -1 && endTimeIndex + 1 < argv.length) {
    backup.backupConfig.timeRange.enabled = true;
    backup.backupConfig.timeRange.endTime = argv[endTimeIndex + 1];
  }

  if (help) {
    console.log('\n用法:');
    console.log('  node backup_mongodb.js [--once|--now|run]            立即执行一次后退出');
    console.log('  node backup_mongodb.js [--schedule] [--cron <表达式>] 以守护模式定时执行(默认每天2点)');
    console.log('\n时间范围选项:');
    console.log('  --today [开始小时:分钟-结束小时:分钟]  备份今天指定时间段的数据 (例如: 9:30-17:45)');
    console.log('  --start "YYYY-MM-DD HH:mm:ss"       指定开始时间');
    console.log('  --end "YYYY-MM-DD HH:mm:ss"         指定结束时间');
    console.log('  --field fieldName                   指定时间字段名称 (默认: createdAt)');
    console.log('\n示例:');
    console.log('  node backup_mongodb.js --once');
    console.log('  node backup_mongodb.js --schedule --cron "0 30 1 * * *"  # 每天01:30');
    console.log('  node backup_mongodb.js --once --today                   # 今天全天');
    console.log('  node backup_mongodb.js --once --today 9-17              # 今天9点到17点');
    console.log('  node backup_mongodb.js --once --today 9:30-17:45        # 今天9:30到17:45');
    console.log('  node backup_mongodb.js --once --start "2023-05-01 00:00:00" --end "2023-05-31 23:59:59"');
    console.log('  node backup_mongodb.js --once --field updatedAt --today # 使用updatedAt字段筛选今天的数据');
  }

  if (runOnce && !scheduleMode) {
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
  } else {
    backup.log('以定时任务模式启动备份服务');
    backup.log('Cron 表达式:', cronExpr);
    const job = schedule.scheduleJob(cronExpr, async () => {
      backup.log('触发定时任务: 开始执行备份');
      try {
        await backup.run();
        backup.log('定时任务执行完成');
      } catch (err) {
        backup.logError('定时任务执行失败', err);
      }
    });

    if (job && job.nextInvocation) {
      backup.log('下一次执行时间:', job.nextInvocation().toISOString());
    }

    // 保持进程常驻供 PM2 管理
    process.stdin.resume();
  }
}

module.exports = MongoDBBackup; 