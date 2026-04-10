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

const execAsync = util.promisify(exec);

class MongoDBBackup {
  constructor() {
    // 数据库连接配置（从db.js文件获取）
    //  "mongodb://dcmesvncs:NHpmsLSARLWKky4A@127.0.0.1:27017/dcmesvncs";
    // "mongodb://dcMesVn:8AS82jsx7LbjsaTB@127.0.0.1:27017/dcmesvn";

    this.config = {
      host: '127.0.0.1',
      port: '27017',
      database: 'dcmesvn',
      username: 'dcMesVn',
      password: '8AS82jsx7LbjsaTB',
      authDatabase: 'dcmesvn' // 认证数据库
    };

    // 备份配置
    this.backupConfig = {
      backupPath: 'D:/mongobackups/dcmesvn',
      keepDays: 365,
      compress: process.env.COMPRESS !== 'false',
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
   * 检查mongodump是否可用
   * @returns {Promise<boolean>} 是否可用
   */
  async checkMongodumpAvailable() {
    try {
      // 优先使用当前脚本目录下的 Tools/100/bin/mongodump(.exe)
      const localMongodump = path.join(__dirname, 'Tools', '100', 'bin', this.isWindows ? 'mongodump.exe' : 'mongodump');
      if (fs.existsSync(localMongodump)) {
        const quoted = localMongodump.includes(' ') ? `"${localMongodump}"` : localMongodump;
        await execAsync(`${quoted} --version`);
        this.mongodumpPath = localMongodump;
        this.log('使用本地Tools目录中的MongoDB数据库工具:', localMongodump);
        return true;
      }

      // Windows 常见安装路径（如果用户把工具装在系统目录）
      if (this.isWindows) {
        const windowsDefaultPath = 'C:/Program Files/MongoDB/Tools/100/bin/mongodump.exe';
        if (fs.existsSync(windowsDefaultPath)) {
          await execAsync(`"${windowsDefaultPath}" --version`);
          this.mongodumpPath = windowsDefaultPath;
          this.log('使用系统MongoDB数据库工具:', windowsDefaultPath);
          return true;
        }
      }

      // 尝试系统 PATH 中的 mongodump
      await execAsync('mongodump --version');
      this.mongodumpPath = 'mongodump';
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
            await execAsync(`${quoted} --version`);
            this.mongodumpPath = testPath;
            this.log('使用本地/常见路径中的MongoDB数据库工具:', testPath);
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
   * 构建mongodump命令
   * @param {string} outputPath - 输出路径
   * @returns {string} mongodump命令
   */
  buildMongodumpCommand(outputPath) {
    const { host, port, database, username, password, authDatabase } = this.config;
    
    // 使用检测到的 mongodump 路径，并在包含空格时自动加引号
    const mongodumpCmd = this.mongodumpPath || 'mongodump';
    const commandBinary = mongodumpCmd.includes(' ') ? `"${mongodumpCmd}"` : mongodumpCmd;
    
    let command = commandBinary;
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
    console.log('docker run --rm -v $(pwd)/backups:/backup mongo:latest mongodump \\');
    console.log('  --host 47.115.19.76:27017 \\');
    console.log('  --db dcMes \\');
    console.log('  --username dcMes \\');
    console.log('  --password dcMes123. \\');
    console.log('  --authenticationDatabase dcMes \\');
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
   * 执行数据库备份
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
   * 安装所需依赖
   */
  async installDependencies() {
    try {
      // 检查是否已安装archiver
      require.resolve('archiver');
      return true;
    } catch (error) {
      this.log('检测到缺少archiver库，正在安装...');
      
      try {
        await execAsync('npm install archiver --save');
        this.log('archiver库安装成功');
        return true;
      } catch (installError) {
        this.logError('无法自动安装archiver库', installError);
        throw new Error('请手动安装archiver库: npm install archiver');
      }
    }
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
      this.log('='.repeat(60));

      // 检查并安装依赖
      if (this.backupConfig.compress) {
        await this.installDependencies();
      }

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