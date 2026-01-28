#!/usr/bin/env node

/**
 * MongoDB Incremental Backup Manager
 * 
 * Features:
 * - Specialized incremental backup for daily data
 * - Support for different collection backup strategy configurations
 * - Multiple scheduled task scheduling (hourly, daily, custom)
 * - Intelligent categorization of backup files
 * - Support for hot collection priority backup
 * - Backup health monitoring and alerting
 * - Automatic cleanup and archiving strategies
 * 
 * Usage:
 * node incremental_backup_manager_en.js --start     # Start the manager
 * node incremental_backup_manager_en.js --once      # Execute backup once immediately
 * node incremental_backup_manager_en.js --status    # Check backup status
 * node incremental_backup_manager_en.js --config    # Show current configuration
 * 
 * Environment Variables:
 * INCREMENTAL_BACKUP_PATH - Incremental backup storage path
 * BACKUP_SCHEDULE_MODE - Schedule mode (hourly/daily/custom)
 * MONGO_HOST - MongoDB host address
 * MONGO_PORT - MongoDB port
 * 
 * @Author: System Administrator
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

// Import configuration file
const config = require('./config');

const execAsync = util.promisify(exec);

class IncrementalBackupManagerEN {
  constructor() {
    // Load database connection configuration from config file
    this.config = config.database;

    // Load backup configuration from config file
    this.backupConfig = {
      // Basic path configuration
      backupPath: config.paths.backupPath,
      
      // Load backup strategies from config file
      strategies: config.strategies,

      // Load global configuration from config file
      maxRetries: config.backup.maxRetries,
      retryDelay: config.backup.retryDelay,
      useArchiveMode: config.backup.useArchiveMode,
      globalCompress: config.backup.globalCompress,
      parallelLimit: config.backup.parallelLimit,
      
      // Load monitoring configuration from config file
      healthCheck: config.monitoring.healthCheck
    };

    // Runtime state
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
    
    // Initialize
    this.init();
  }

  /**
   * Initialize manager
   */
  init() {
    this.ensureBackupDirectories();
    this.loadState();
    this.setupSignalHandlers();
  }

  /**
   * Ensure backup directories exist
   */
  ensureBackupDirectories() {
    const basePath = this.backupConfig.backupPath;
    
    // Create base directory
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    // Create logs directory
    const logsDir = path.join(basePath, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create date directories and category subdirectories for today
    this.ensureDateDirectories();

    this.log('Backup directories initialized:', basePath);
  }

  /**
   * Ensure date directories and category directories exist for today
   */
  ensureDateDirectories(date = new Date()) {
    const basePath = this.backupConfig.backupPath;
    const dateStr = this.formatDateForDirectory(date);
    const datePath = path.join(basePath, dateStr);
    
    // Create date directory
    if (!fs.existsSync(datePath)) {
      fs.mkdirSync(datePath, { recursive: true });
    }

    // Create category subdirectories under date directory
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
   * Format date for directory name
   */
  formatDateForDirectory(date = new Date()) {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
  }

  /**
   * Load state information
   */
  loadState() {
    const stateFile = path.join(this.backupConfig.backupPath, 'manager_state.json');
    
    if (fs.existsSync(stateFile)) {
      try {
        const savedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        // Merge saved state (only merge statistics)
        this.state.statistics = { ...this.state.statistics, ...savedState.statistics };
        this.state.lastBackupTimes = new Map(savedState.lastBackupTimes || []);
        this.state.failureCount = new Map(savedState.failureCount || []);
        
        this.log('State information loaded successfully');
      } catch (error) {
        this.logError('Failed to load state information', error);
      }
    }
  }

  /**
   * Save state information
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
      this.logError('Failed to save state information', error);
    }
  }

  /**
   * Setup signal handlers
   */
  setupSignalHandlers() {
    process.on('SIGINT', () => this.gracefulShutdown());
    process.on('SIGTERM', () => this.gracefulShutdown());
    
    // Auto save state
    setInterval(() => {
      if (this.state.isRunning) {
        this.saveState();
      }
    }, 60000); // Save every minute
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown() {
    this.log('Shutting down incremental backup manager...');
    this.state.isRunning = false;
    
    // Wait for active jobs to complete
    if (this.state.activeJobs.size > 0) {
      this.log(`Waiting for ${this.state.activeJobs.size} active jobs to complete...`);
      await this.waitForActiveJobs(30000); // Wait up to 30 seconds
    }
    
    this.saveState();
    this.log('Incremental backup manager has been shut down');
    process.exit(0);
  }

  /**
   * Wait for active jobs to complete
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
   * Log recording
   */
  log(message, data = '') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [IncrementalBackup] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }

    // Write to log file
    const logFile = path.join(this.backupConfig.backupPath, 'logs', 'incremental_backup.log');
    const logLine = `${logMessage} ${data ? JSON.stringify(data) : ''}\n`;
    
    try {
      fs.appendFileSync(logFile, logLine);
    } catch (e) {
      // Ignore log write errors
    }
  }

  /**
   * Error log recording
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
      // Ignore log write errors
    }
  }

  /**
   * Check if mongodump is available
   */
  async checkMongodumpAvailable() {
    try {
      // Prefer local Tools directory
      const localMongodump = path.join(__dirname, config.paths.toolsPath, '100', 'bin', this.isWindows ? 'mongodump.exe' : 'mongodump');
      if (fs.existsSync(localMongodump)) {
        const quoted = localMongodump.includes(' ') ? `"${localMongodump}"` : localMongodump;
        await execAsync(`${quoted} --version`);
        this.mongodumpPath = localMongodump;
        this.log('Using local MongoDB tools:', localMongodump);
        return true;
      }

      // Try system path
      await execAsync('mongodump --version');
      this.mongodumpPath = 'mongodump';
      this.log('Using system MongoDB tools');
      return true;
      
    } catch (error) {
      this.log('MongoDB tools unavailable:', error.message);
      return false;
    }
  }

  /**
   * Build time range query conditions
   * @param {string} timeField - Time field name
   * @param {Object} timeRange - Time range configuration
   * @returns {string|null} - Query condition JSON string, null means no time restriction
   */
  buildTimeRangeQuery(timeField = 'createdAt', timeRange = { type: 'today' }) {
    if (!timeRange || timeRange.type === 'full') {
      // Full table backup, no time restriction
      return null;
    }

    let startTime, endTime;
    const now = new Date();

    switch (timeRange.type) {
      case 'today':
        // Today's data
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startTime = new Date(today);
        endTime = new Date(today);
        endTime.setHours(23, 59, 59, 999);
        break;

      case 'yesterday':
        // Yesterday's data
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        startTime = new Date(yesterday);
        endTime = new Date(yesterday);
        endTime.setHours(23, 59, 59, 999);
        break;

      case 'hours':
        // Last N hours
        const hours = timeRange.hours || 24;
        startTime = new Date(now - hours * 60 * 60 * 1000);
        endTime = new Date(now);
        break;

      case 'days':
        // Last N days
        const days = timeRange.days || 7;
        startTime = new Date(now - days * 24 * 60 * 60 * 1000);
        endTime = new Date(now);
        break;

      case 'custom':
        // Custom time range
        if (!timeRange.startDate || !timeRange.endDate) {
          this.log('Custom time range configuration error, missing startDate or endDate, using today backup');
          return this.buildTimeRangeQuery(timeField, { type: 'today' });
        }
        startTime = new Date(timeRange.startDate);
        endTime = new Date(timeRange.endDate);
        // Set end time to last second of the day
        if (endTime.getHours() === 0 && endTime.getMinutes() === 0 && endTime.getSeconds() === 0) {
          endTime.setHours(23, 59, 59, 999);
        }
        break;

      default:
        this.log(`Unknown time range type: ${timeRange.type}, using today backup`);
        return this.buildTimeRangeQuery(timeField, { type: 'today' });
    }

    // Validate time range
    if (startTime >= endTime) {
      this.log('Time range configuration error, start time cannot be greater than or equal to end time, using today backup');
      return this.buildTimeRangeQuery(timeField, { type: 'today' });
    }

    // Convert to MongoDB Extended JSON format
    const query = {
      [timeField]: {
        "$gte": { "$date": startTime.toISOString() },
        "$lte": { "$date": endTime.toISOString() }
      }
    };
    
    this.log(`Time range query [${timeRange.type}]: ${startTime.toISOString()} to ${endTime.toISOString()}`);
    return JSON.stringify(query);
  }

  /**
   * Build time range query conditions (backward compatibility)
   * @deprecated Use buildTimeRangeQuery instead
   */
  buildTodayTimeRange(timeField = 'createdAt') {
    return this.buildTimeRangeQuery(timeField, { type: 'today' });
  }

  /**
   * Build mongodump command
   * @param {string} collection - Collection name
   * @param {string} outputPath - Output path
   * @param {string} timeField - Time field name
   * @param {Object} timeRange - Time range configuration
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
    
    // Add query conditions based on time range configuration
    const timeRangeQuery = this.buildTimeRangeQuery(timeField, timeRange);
    
    if (timeRangeQuery) {
      // Query parameter handling for Windows and Linux
      if (this.isWindows) {
        // Use double quotes for query on Windows, escape internal double quotes
        const escapedQuery = timeRangeQuery.replace(/"/g, '\\"');
        command += ` --query "${escapedQuery}"`;
      } else {
        // Use single quotes for query on Linux/Unix
        command += ` --query '${timeRangeQuery}'`;
      }
      this.log(`Added time range query [${collection}]: ${timeRange.type}`);
    } else {
      this.log(`Full table backup [${collection}]: no time restriction`);
    }
    
    // Output configuration - use standard mode to ensure filename control
    // Create temporary output directory
    const tempOutputDir = path.join(path.dirname(outputPath), 'temp_' + Date.now());
    command += ` --out "${tempOutputDir}"`;
    
    return command;
  }

  /**
   * Generate backup filename
   * @param {string} strategyName - Strategy name
   * @param {string} collection - Collection name
   * @param {Object} timeRange - Time range configuration
   */
  generateBackupFileName(strategyName, collection, timeRange = { type: 'today' }) {
    const now = new Date();
    // Generate YYYY-MM-DDTHH-mm-SS format timestamp
    const timestamp = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + 'T' +
      String(now.getHours()).padStart(2, '0') + '-' +
      String(now.getMinutes()).padStart(2, '0') + '-' +
      String(now.getSeconds()).padStart(2, '0');
    
    // Ensure collection name conforms to filename standards
    const safeName = collection.replace(/[^a-zA-Z0-9._$-]/g, '_');
    
    // Use new naming format: tablename_backup_timestamp.gz
    const fileName = `${safeName}_backup_${timestamp}.gz`;
    
    return fileName;
  }

  /**
   * Execute single collection backup (with retry mechanism)
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
      
      this.log(`Starting backup collection [${strategyName}]: ${collection}`);
      
      // Check mongodump
      if (!this.mongodumpPath && !(await this.checkMongodumpAvailable())) {
        throw new Error('MongoDB backup tools unavailable');
      }

      // Execute backup (with retry mechanism)
      const result = await this.executeBackupWithRetry(collection, outputPath, strategy.timeField, timeRange, strategyName);
      
      // Update statistics
      this.state.statistics.totalBackups++;
      this.state.statistics.successCount++;
      this.state.statistics.totalSize += result.size;
      this.state.lastBackupTimes.set(`${strategyName}_${collection}`, new Date());
      
      // Reset failure count
      this.state.failureCount.delete(`${strategyName}_${collection}`);
      
      return { success: true, filePath: result.filePath, size: result.size };
      
    } catch (error) {
      this.logError(`Collection backup final failure [${strategyName}] ${collection}`, error);
      
      // Update failure statistics
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
   * Process standard mode output files (compression and renaming)
   */
  async processStandardModeOutput(command, collection, finalOutputPath) {
    
    // Extract temporary output directory from command
    const tempDirMatch = command.match(/--out "([^"]+)"/);
    if (!tempDirMatch) {
      throw new Error('Unable to extract temporary output directory from command');
    }
    
    const tempOutputDir = tempDirMatch[1];
    const databaseDir = path.join(tempOutputDir, this.config.database);
    const bsonFile = path.join(databaseDir, `${collection}.bson`);
    
    try {
      // Check if generated bson file exists
      if (!fs.existsSync(bsonFile)) {
        throw new Error(`Backup file not found: ${bsonFile}`);
      }
      
      // Ensure target directory exists
      const targetDir = path.dirname(finalOutputPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Compress bson file to final location
      if (this.backupConfig.globalCompress) {
        await this.compressFile(bsonFile, finalOutputPath);
      } else {
        // If not compressing, copy and rename directly (but keep .gz extension for consistency)
        const targetPathWithoutGz = finalOutputPath.replace('.gz', '');
        fs.copyFileSync(bsonFile, targetPathWithoutGz);
        // Then compress to maintain .gz format
        await this.compressFile(targetPathWithoutGz, finalOutputPath);
        fs.unlinkSync(targetPathWithoutGz);
      }
      
      this.log(`File processing completed: ${finalOutputPath}`);
      
      return finalOutputPath;
      
    } finally {
      // Clean up temporary directory
      this.cleanupTempDirectory(tempOutputDir);
    }
  }

  /**
   * Compress file
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
   * Clean up temporary directory
   */
  cleanupTempDirectory(tempDir) {
    try {
      if (fs.existsSync(tempDir)) {
        this.deleteFolderRecursive(tempDir);
        this.log(`Cleaned up temporary directory: ${tempDir}`);
      }
    } catch (error) {
      this.logError('Failed to clean up temporary directory', error);
    }
  }

  /**
   * Recursively delete directory
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
   * Execute backup command (with retry mechanism)
   */
  async executeBackupWithRetry(collection, outputPath, timeField, timeRange, strategyName) {
    const maxRetries = 3; // Maximum 3 retries
    const retryDelay = 5000; // 5 second retry interval
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        // If not the first attempt, delete any incomplete backup file
        if (attempt > 1 && fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
          this.log(`Deleted incomplete backup file: ${outputPath}`);
        }
        
        this.log(`Attempting backup [${collection}] - ${attempt}${attempt > 1 ? ' retry' : ''} attempt...`);
        
        // Execute backup command
        const command = this.buildMongodumpCommand(collection, outputPath, timeField, timeRange);
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr && !stderr.includes('done dumping')) {
          this.log(`Backup warning [${collection}]:`, stderr);
        }

        // Process file generation and compression in standard mode
        const finalFilePath = await this.processStandardModeOutput(command, collection, outputPath);
        
        // Verify final backup file
        if (fs.existsSync(finalFilePath)) {
          const stats = fs.statSync(finalFilePath);
          
          // Check if file size is reasonable (should have some content)
          if (stats.size === 0) {
            throw new Error('Backup file is empty');
          }
          
          this.log(`Collection backup successful [${collection}]: ${(stats.size / 1024).toFixed(2)} KB (${attempt}${attempt > 1 ? ' retry' : ''} attempt)`);
          
          return { filePath: finalFilePath, size: stats.size };
        } else {
          throw new Error('Backup file not generated');
        }
        
      } catch (error) {
        lastError = error;
        
        if (attempt <= maxRetries) {
          this.log(`Backup failed [${collection}] attempt ${attempt}: ${error.message}`);
          this.log(`Will retry attempt ${attempt + 1} in ${retryDelay / 1000} seconds...`);
          
          // Wait for retry interval
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          this.log(`Backup failed [${collection}] reached maximum retry attempts (${maxRetries})`);
          throw error;
        }
      }
    }
    
    // If all retries failed, throw last error
    throw lastError;
  }

  /**
   * Get category directory name (date+type two-level directory)
   */
  getCategoryDir(strategyName, backupDate = new Date()) {
    // Ensure target date directory exists
    this.ensureDateDirectories(backupDate);
    
    // Get date directory name
    const dateStr = this.formatDateForDirectory(backupDate);
    
    // Get type directory based on strategy name
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
    
    // Return date/type combined path
    return path.join(dateStr, typeDir);
  }

  /**
   * Execute strategy backup
   */
  async executeStrategy(strategyName, strategy) {
    if (!strategy.collections || strategy.collections.length === 0) {
      this.log(`Strategy [${strategyName}] has no collections configured`);
      return;
    }

    this.log(`Starting backup strategy execution: ${strategyName}, number of collections: ${strategy.collections.length}`);
    
    const results = [];

    // Sequential backup (execute one by one to avoid excessive database pressure)
    for (let i = 0; i < strategy.collections.length; i++) {
      const collection = strategy.collections[i];
      
      this.log(`Backing up [${strategyName}] collection ${i + 1}/${strategy.collections.length}: ${collection}`);
      
      try {
        const result = await this.backupCollection(strategyName, collection, strategy);
        
        results.push({
          collection,
          ...result
        });
        
        // Brief wait after backup completion to give database time to relieve pressure
        if (i < strategy.collections.length - 1) {
          this.log(`Collection ${collection} backup completed, waiting 1 second before continuing...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        this.logError(`Collection backup exception [${strategyName}] ${collection}`, error);
        results.push({
          collection,
          success: false,
          error: error.message
        });
      }
    }
    
    // Statistics results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    this.log(`Strategy [${strategyName}] execution completed: successful ${successful.length}, failed ${failed.length}`);
    
    // Clean up old backups
    await this.cleanupOldBackups(strategyName, strategy);
    
    return results;
  }

  /**
   * Clean up old backup files (adapted to date+type directory structure)
   */
  async cleanupOldBackups(strategyName, strategy) {
    try {
      const basePath = this.backupConfig.backupPath;
      const now = new Date();
      let deletedCount = 0;
      let deletedDirectories = 0;

      // Get type directory name corresponding to strategy
      const typeMap = {
        hotCollections: 'hot',
        dailyCollections: 'daily',
        fullBackup: 'full',
        historyBackup: 'history',
        customBackup: 'custom'
      };
      const typeDir = typeMap[strategyName] || 'other';
      
      // Traverse all date directories
      const items = fs.readdirSync(basePath);
      
      for (const item of items) {
        // Skip non-date directories (like logs)
        if (!item.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
        
        const dateDir = path.join(basePath, item);
        const typeBackupDir = path.join(dateDir, typeDir);
        
        if (!fs.existsSync(typeBackupDir)) continue;
        
        // Check if this date directory should be cleaned up
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
          // Delete all backup files of this type under this date
          const files = fs.readdirSync(typeBackupDir);
          
          for (const file of files) {
            // Skip non-backup files
            if (!file.match(/\.(archive|gz)$/)) continue;
            
            const filePath = path.join(typeBackupDir, file);
            fs.unlinkSync(filePath);
            deletedCount++;
            this.log(`Cleaned up old backup file [${strategyName}] ${item}/${typeDir}/${file}`);
          }
          
          // If type directory is empty, delete type directory
          const remainingFiles = fs.readdirSync(typeBackupDir);
          if (remainingFiles.length === 0) {
            fs.rmdirSync(typeBackupDir);
            
            // Check if date directory is empty (except possibly other type directories)
            const dateItems = fs.readdirSync(dateDir);
            const hasOtherFiles = dateItems.some(item => {
              const itemPath = path.join(dateDir, item);
              return fs.statSync(itemPath).isFile() || 
                     (fs.readdirSync(itemPath).length > 0);
            });
            
            // If all type directories under date directory are empty, delete entire date directory
            if (!hasOtherFiles) {
              // Delete all empty subdirectories
              for (const subItem of dateItems) {
                const subPath = path.join(dateDir, subItem);
                if (fs.statSync(subPath).isDirectory()) {
                  try {
                    fs.rmdirSync(subPath);
                  } catch (e) {
                    // Ignore deletion errors for non-empty directories
                  }
                }
              }
              
              // Try to delete date directory
              try {
                fs.rmdirSync(dateDir);
                deletedDirectories++;
                this.log(`Cleaned up empty date directory: ${item}`);
              } catch (e) {
                // Directory not empty, skip
              }
            }
          }
        }
      }
      
      if (deletedCount > 0 || deletedDirectories > 0) {
        this.log(`Strategy [${strategyName}] cleanup completed: deleted ${deletedCount} files, ${deletedDirectories} directories`);
      }
      
    } catch (error) {
      this.logError(`Failed to clean up old backups [${strategyName}]`, error);
    }
  }

  /**
   * Execute all strategy backups immediately
   */
  async executeAllStrategies() {
    this.log('Starting execution of all backup strategies...');
    const startTime = Date.now();
    
    const results = {};
    
    for (const [strategyName, strategy] of Object.entries(this.backupConfig.strategies)) {
      try {
        results[strategyName] = await this.executeStrategy(strategyName, strategy);
      } catch (error) {
        this.logError(`Strategy execution failed [${strategyName}]`, error);
        results[strategyName] = { success: false, error: error.message };
      }
    }
    
    const duration = Date.now() - startTime;
    this.log(`All backup strategies execution completed, duration: ${(duration / 1000).toFixed(2)} seconds`);
    
    return results;
  }

  /**
   * Start scheduled backups
   */
  startScheduledBackups() {
    if (this.state.isRunning) {
      this.log('Scheduled backup is already running');
      return;
    }

    this.state.isRunning = true;
    this.log('Starting incremental backup scheduled tasks...');
    
    // Create scheduled tasks for each strategy
    for (const [strategyName, strategy] of Object.entries(this.backupConfig.strategies)) {
      const job = schedule.scheduleJob(strategy.schedule, async () => {
        this.log(`Triggered scheduled backup strategy: ${strategyName}`);
        try {
          await this.executeStrategy(strategyName, strategy);
        } catch (error) {
          this.logError(`Scheduled backup strategy execution failed [${strategyName}]`, error);
        }
      });
      
      if (job && job.nextInvocation) {
        this.log(`Strategy [${strategyName}] next execution time: ${job.nextInvocation().toISOString()}`);
      }
    }
    
    // Health check scheduled task
    if (this.backupConfig.healthCheck.enabled) {
      schedule.scheduleJob('*/5 * * * *', () => {
        this.performHealthCheck();
      });
    }
    
    this.log('All scheduled tasks have been started');
  }

  /**
   * Perform health check
   */
  performHealthCheck() {
    const { maxFailureCount } = this.backupConfig.healthCheck;
    const alerts = [];
    
    // Check failure counts
    for (const [key, failureCount] of this.state.failureCount) {
      if (failureCount >= maxFailureCount) {
        alerts.push(`Collection ${key} failed consecutively ${failureCount} times`);
      }
    }
    
    // Check last backup times
    const now = new Date();
    for (const [strategyName, strategy] of Object.entries(this.backupConfig.strategies)) {
      for (const collection of strategy.collections) {
        const key = `${strategyName}_${collection}`;
        const lastBackup = this.state.lastBackupTimes.get(key);
        
        if (!lastBackup) {
          alerts.push(`Collection ${key} has never been backed up`);
          continue;
        }
        
        // Check if backup is overdue
        const expectedInterval = this.getExpectedInterval(strategy.schedule);
        const timeSinceLastBackup = now - lastBackup;
        
        if (timeSinceLastBackup > expectedInterval * 2) {
          alerts.push(`Collection ${key} backup is overdue by ${Math.floor(timeSinceLastBackup / (1000 * 60 * 60))} hours`);
        }
      }
    }
    
    if (alerts.length > 0) {
      this.log('Health check found issues:', alerts);
      
      if (this.backupConfig.healthCheck.alertOnFailure) {
        this.sendAlert(alerts);
      }
    }
  }

  /**
   * Get expected backup interval (milliseconds)
   */
  getExpectedInterval(schedule) {
    // Simple schedule parsing, should be more complex in practice
    if (schedule.includes('*/1 * * *')) return 60 * 60 * 1000; // 1 hour
    if (schedule.includes('*/6 * * *')) return 6 * 60 * 60 * 1000; // 6 hours
    return 24 * 60 * 60 * 1000; // Default 24 hours
  }

  /**
   * Send alerts
   */
  sendAlert(alerts) {
    // This can integrate email, DingTalk, WeChat and other alert methods
    this.log('Sending alerts:', alerts);
    
    const alertFile = path.join(this.backupConfig.backupPath, 'logs', 'alerts.log');
    const alertLine = `[${new Date().toISOString()}] Backup Alert: ${alerts.join(', ')}\n`;
    
    try {
      fs.appendFileSync(alertFile, alertLine);
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Get manager status
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
   * Show configuration information
   */
  showConfig() {
    console.log('\n=== Incremental Backup Manager Configuration ===');
    console.log('Database Configuration:');
    console.log(`  Address: ${this.config.host}:${this.config.port}`);
    console.log(`  Database: ${this.config.database}`);
    console.log(`  Username: ${this.config.username}`);
    
    console.log('\nBackup Configuration:');
    console.log(`  Backup Path: ${this.backupConfig.backupPath}`);
    console.log(`  Directory Structure: date/type two-level directory (e.g.: 2024-09-20/hot/)`);
    console.log(`  Use Archive Mode: ${this.backupConfig.useArchiveMode}`);
    console.log(`  Global Compression: ${this.backupConfig.globalCompress}`);
    console.log(`  Execution Mode: Sequential execution (avoid excessive database pressure)`);
    console.log(`  Backup Interval: 1 second interval between each collection`);
    
    console.log('\nBackup Strategies:');
    // Add debug information
    if (!this.backupConfig.strategies) {
      console.log('  ❌ Strategy configuration not loaded');
      return;
    }
    
    if (typeof this.backupConfig.strategies !== 'object') {
      console.log('  ❌ Strategy configuration type error:', typeof this.backupConfig.strategies);
      return;
    }
    
    const strategies = this.backupConfig.strategies;
    const strategyEntries = Object.entries(strategies);
    
    if (strategyEntries.length === 0) {
      console.log('  ❌ No backup strategies found');
      return;
    }
    
    for (const [name, strategy] of strategyEntries) {
      console.log(`  ${name} (${strategy.name || 'Unnamed Strategy'}):`);
      console.log(`    Schedule: ${strategy.schedule || 'Not set'}`);
      console.log(`    Collection Count: ${strategy.collections ? strategy.collections.length : 0}`);
      console.log(`    Time Field: ${strategy.timeField || 'Not set'}`);
      
      // Show time range configuration
      if (strategy.timeRange) {
        const timeRange = strategy.timeRange;
        let rangeDescription = '';
        switch (timeRange.type) {
          case 'today':
            rangeDescription = 'Today\'s data';
            break;
          case 'yesterday':
            rangeDescription = 'Yesterday\'s data';
            break;
          case 'full':
            rangeDescription = 'Full table data (no time restriction)';
            break;
          case 'hours':
            rangeDescription = `Last ${timeRange.hours || 24} hours`;
            break;
          case 'days':
            rangeDescription = `Last ${timeRange.days || 7} days`;
            break;
          case 'custom':
            rangeDescription = `Custom range: ${timeRange.startDate || 'Not set'} to ${timeRange.endDate || 'Not set'}`;
            break;
          default:
            rangeDescription = `Unknown type: ${timeRange.type}`;
        }
        console.log(`    Time Range: ${rangeDescription}`);
      } else {
        console.log(`    Time Range: Today's data (default)`);
      }
      
      const retention = strategy.retentionHours 
        ? `${strategy.retentionHours} hours` 
        : strategy.retentionDays
          ? `${strategy.retentionDays} days`
          : 'Not set';
      console.log(`    Retention Period: ${retention}`);
      console.log(`    Priority: ${strategy.priority || 'Not set'}`);
    }
    
    console.log('=================================================\n');
  }

  /**
   * Main run function
   */
  async run(mode = 'start') {
    try {
      switch (mode) {
        case 'start':
          this.showConfig();
          this.startScheduledBackups();
          this.log('Incremental backup manager started, press Ctrl+C to stop');
          
          // Keep process running
          process.stdin.resume();
          break;
          
        case 'once':
          this.log('Executing one-time backup...');
          await this.executeAllStrategies();
          this.log('One-time backup completed');
          break;
          
        case 'status':
          const status = this.getStatus();
          console.log('\n=== Incremental Backup Manager Status ===');
          console.log(JSON.stringify(status, null, 2));
          console.log('=========================================\n');
          break;
          
        case 'config':
          this.showConfig();
          break;
          
        default:
          console.log('Unknown mode:', mode);
          break;
      }
      
    } catch (error) {
      this.logError('Manager execution failed', error);
      throw error;
    }
  }
}

// Command line startup
if (require.main === module) {
  const manager = new IncrementalBackupManagerEN();
  
  const argv = process.argv.slice(2);
  const mode = argv.find(arg => ['--start', '--once', '--status', '--config'].includes(arg))?.slice(2) || 'start';
  
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('\nIncremental Backup Manager - Usage:');
    console.log('  node incremental_backup_manager_en.js --start    # Start scheduled backup service');
    console.log('  node incremental_backup_manager_en.js --once     # Execute backup once immediately');
    console.log('  node incremental_backup_manager_en.js --status   # Check current status');
    console.log('  node incremental_backup_manager_en.js --config   # Show configuration information');
    console.log('  node incremental_backup_manager_en.js --help     # Show help information\n');
    process.exit(0);
  }
  
  manager.run(mode).catch(error => {
    console.error('Manager startup failed:', error.message);
    process.exit(1);
  });
}

module.exports = IncrementalBackupManagerEN; 