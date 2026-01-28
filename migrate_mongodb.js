#!/usr/bin/env node

/**
 * MongoDB数据库迁移脚本 - 完整复制数据库到另一台服务器
 * 
 * 功能特性：
 * - 从源服务器完整导出数据库
 * - **完全保留原始数据时间戳**（创建时间、更新时间等）
 * - 支持压缩以节省传输时间
 * - 直接传输到目标服务器并导入
 * - 详细的进度显示和日志记录
 * - 错误处理和重试机制
 * - 支持指定数据库或所有数据库
 * 
 * 时间戳保留说明：
 * - mongodump 导出的是 BSON 原始数据，包含所有字段的精确值
 * - mongorestore 直接插入 BSON 数据，不会触发 Mongoose 默认值
 * - 因此所有时间字段（createTime、updateTime、ObjectId 时间戳等）都会完全保留
 * 
 * 使用方法：
 * 1. 直接运行（使用配置文件）：
 *    node migrate_mongodb.js
 * 
 * 2. 命令行参数：
 *    node migrate_mongodb.js --source "mongodb://user:pass@source-host:27017/db" --target "mongodb://user:pass@target-host:27017/db"
 * 
 * 3. 环境变量配置：
 *    SOURCE_MONGODB_URI - 源数据库连接字符串
 *    TARGET_MONGODB_URI - 目标数据库连接字符串
 *    COMPRESS=true - 是否压缩（默认：true）
 *    DROP_TARGET=true - 是否删除目标数据库现有数据（默认：false）
 * 
 * @Author: 系统管理员
 * @Date: 2026-01-27
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const readline = require('readline');

const execAsync = util.promisify(exec);

// ============================================================================
// 数据库连接配置区域 - 请在此处填写您的数据库连接信息
// ============================================================================
const DB_CONFIG = {
  // 源数据库配置
  source: {
    host: '127.0.0.1',           // 源数据库主机地址
    port: 27017,                  // 源数据库端口
    username: 'dcMes',            // 源数据库用户名
    password: 'dcMes123.',        // 源数据库密码（如果包含特殊字符，脚本会自动编码）
    database: 'dcMes',            // 源数据库名称
    authSource: '',               // 认证数据库（如果用户创建在admin数据库，填写 'admin'，否则留空）
  },
  
  // 目标数据库配置
  target: {
    host: '172.18.100.10',        // 目标数据库主机地址
    port: 27017,                  // 目标数据库端口
    username: 'dcMes',            // 目标数据库用户名
    password: 'dcMes123.', // 目标数据库密码（如果包含特殊字符，脚本会自动编码）
    
    database: 'dcMes',            // 目标数据库名称
    authSource: '',               // 认证数据库（如果用户创建在admin数据库，填写 'admin'，否则留空）
  },
  
  // 迁移选项
  options: {
    compress: true,               // 是否压缩（默认：true）
    dropTarget: false,            // 是否删除目标数据库现有数据（默认：false）
    excludeCollections: ['api_logs','inspection_data','inspection_last_data','k3_prd_instocks','k3_prd_mos',"k3_prd_pickmtrls","material_process_flows"],       // 要跳过的集合列表，例如: ['logs', 'audit', 'temp']
    includeCollections: ['production_lines'],       // 只导出指定的集合列表（如果指定，则只导出这些集合，忽略 excludeCollections），例如: ['users', 'orders']
    keepTemp: true,              // 是否保留临时文件（默认：false）
    testConnection: true,         // 是否在迁移前测试连接（默认：true）
    useExistingDump: true,       // 是否使用已存在的导出文件（跳过导出步骤，默认：false）
    dumpPath: '',                 // 指定导出文件路径（如果 useExistingDump 为 true，可指定具体路径，否则使用最新的）
  }
};
// ============================================================================

class MongoDBMigrator {
  constructor() {
    // 解析命令行参数
    this.args = this.parseArgs();
    
    // 构建数据库连接URI（优先级：命令行参数 > 环境变量 > 文件配置）
    const sourceUri = this.buildMongoUri(
      this.args.source || process.env.SOURCE_MONGODB_URI,
      DB_CONFIG.source,
      'source'
    );
    
    const targetUri = this.buildMongoUri(
      this.args.target || process.env.TARGET_MONGODB_URI,
      DB_CONFIG.target,
      'target'
    );
    
    // 解析包含的集合（优先级：命令行参数 > 环境变量 > 文件配置）
    let includeCollections = this.args.includeCollections || [];
    if (process.env.INCLUDE_COLLECTIONS) {
      const envCollections = process.env.INCLUDE_COLLECTIONS.split(',').map(c => c.trim()).filter(c => c);
      includeCollections.push(...envCollections);
    }
    if (includeCollections.length === 0 && DB_CONFIG.options.includeCollections) {
      includeCollections = DB_CONFIG.options.includeCollections;
    }
    includeCollections = [...new Set(includeCollections)]; // 去重

    // 解析排除的集合（优先级：命令行参数 > 环境变量 > 文件配置）
    // 注意：如果指定了 includeCollections，则忽略 excludeCollections
    let excludeCollections = [];
    if (includeCollections.length === 0) {
      // 只有在没有指定包含集合时，才使用排除集合
      excludeCollections = this.args.excludeCollections || [];
      if (process.env.EXCLUDE_COLLECTIONS) {
        const envCollections = process.env.EXCLUDE_COLLECTIONS.split(',').map(c => c.trim()).filter(c => c);
        excludeCollections.push(...envCollections);
      }
      if (excludeCollections.length === 0 && DB_CONFIG.options.excludeCollections) {
        excludeCollections = DB_CONFIG.options.excludeCollections;
      }
      excludeCollections = [...new Set(excludeCollections)]; // 去重
    }

    // 配置信息
    this.config = {
      // 源数据库配置
      sourceUri: sourceUri,
      // 目标数据库配置
      targetUri: targetUri,
      // 数据库名称（如果URI中没有指定）
      database: this.args.database || process.env.DATABASE_NAME || DB_CONFIG.source.database || '',
      // 是否压缩
      compress: this.args.compress !== false && 
                process.env.COMPRESS !== 'false' && 
                DB_CONFIG.options.compress !== false,
      // 是否删除目标数据库现有数据
      dropTarget: this.args.drop === true || 
                 process.env.DROP_TARGET === 'true' || 
                 DB_CONFIG.options.dropTarget === true,
      // 要包含的集合列表（如果指定，则只导出这些集合）
      includeCollections: includeCollections,
      // 要排除的集合列表（如果 includeCollections 为空才生效）
      excludeCollections: excludeCollections,
      // 临时文件目录
      tempDir: this.args.tempDir || process.env.TEMP_DIR || './mongodb_migration_temp',
      // 日志目录
      logDir: './migration_logs',
      // 是否保留临时文件
      keepTemp: this.args.keepTemp === true || 
                process.env.KEEP_TEMP === 'true' || 
                DB_CONFIG.options.keepTemp === true,
      // 是否测试连接
      testConnection: this.args.testConnection !== false && 
                      DB_CONFIG.options.testConnection !== false,
      // 是否使用已存在的导出文件
      useExistingDump: this.args.useExistingDump === true || 
                       process.env.USE_EXISTING_DUMP === 'true' || 
                       DB_CONFIG.options.useExistingDump === true,
      // 指定的导出文件路径
      dumpPath: this.args.dumpPath || 
                process.env.DUMP_PATH || 
                DB_CONFIG.options.dumpPath || '',
      // 重试次数
      maxRetries: 3,
      // 重试延迟（毫秒）
      retryDelay: 5000
    };

    // 如果指定了包含集合，记录日志（此时 this.config 已初始化）
    if (includeCollections.length > 0) {
      this.log('ℹ️  已指定包含集合，将忽略排除集合配置');
    }

    // 验证配置
    this.validateConfig();

    // 确保目录存在
    this.ensureDirectories();

    // 创建readline接口
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * 构建MongoDB连接URI
   */
  buildMongoUri(providedUri, config, type) {
    // 如果提供了完整的URI，直接使用
    if (providedUri) {
      return providedUri;
    }
    
    // 否则使用配置文件中的信息构建URI
    if (!config.host || !config.username || !config.password || !config.database) {
      return '';
    }
    
    // 编码密码中的特殊字符
    const encodedPassword = encodeURIComponent(config.password);
    
    // 构建URI
    let uri = `mongodb://${config.username}:${encodedPassword}@${config.host}:${config.port}/${config.database}`;
    
    // 添加认证数据库（如果指定）
    if (config.authSource) {
      uri += `?authSource=${config.authSource}`;
    }
    
    return uri;
  }

  /**
   * 解析命令行参数
   */
  parseArgs() {
    const args = {
      source: null,
      target: null,
      database: null,
      compress: true,
      drop: false,
      tempDir: null,
      keepTemp: false,
      excludeCollections: [],
      includeCollections: [],
      testConnection: true
    };

    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === '--source' && argv[i + 1]) {
        args.source = argv[++i];
      } else if (arg === '--target' && argv[i + 1]) {
        args.target = argv[++i];
      } else if (arg === '--database' && argv[i + 1]) {
        args.database = argv[++i];
      } else if (arg === '--no-compress') {
        args.compress = false;
      } else if (arg === '--drop') {
        args.drop = true;
      } else if (arg === '--temp-dir' && argv[i + 1]) {
        args.tempDir = argv[++i];
      } else if (arg === '--keep-temp') {
        args.keepTemp = true;
      } else if (arg === '--exclude-collection' && argv[i + 1]) {
        // 支持多个集合，用逗号分隔或多次指定
        const collections = argv[++i].split(',').map(c => c.trim()).filter(c => c);
        args.excludeCollections.push(...collections);
      } else if (arg === '--include-collection' && argv[i + 1]) {
        // 支持多个集合，用逗号分隔或多次指定
        const collections = argv[++i].split(',').map(c => c.trim()).filter(c => c);
        args.includeCollections.push(...collections);
      } else if (arg === '--no-test-connection') {
        args.testConnection = false;
      } else if (arg === '--use-existing-dump') {
        args.useExistingDump = true;
      } else if (arg === '--dump-path' && argv[i + 1]) {
        args.dumpPath = argv[++i];
        args.useExistingDump = true; // 如果指定了路径，自动启用
      } else if (arg === '--help' || arg === '-h') {
        this.printHelp();
        process.exit(0);
      }
    }

    // 去重
    args.excludeCollections = [...new Set(args.excludeCollections)];

    return args;
  }

  /**
   * 打印帮助信息
   */
  printHelp() {
    console.log(`
MongoDB数据库迁移脚本

使用方法:
  node migrate_mongodb.js [选项]

选项:
  --source <uri>          源数据库连接字符串
                          例如: mongodb://user:pass@host:27017/dbname
  --target <uri>          目标数据库连接字符串
  --database <name>       数据库名称（如果URI中未指定）
  --exclude-collection <name>  要跳过的集合名称（可多次指定或逗号分隔）
                          例如: --exclude-collection "logs,audit" 或
                                --exclude-collection "logs" --exclude-collection "audit"
  --include-collection <name> 只导出指定的集合名称（可多次指定或逗号分隔）
                          例如: --include-collection "users,orders" 或
                                --include-collection "users" --include-collection "orders"
                          注意: 如果指定了 --include-collection，将忽略 --exclude-collection
  --no-compress           禁用压缩（默认启用）
  --drop                  删除目标数据库现有数据
  --temp-dir <path>       临时文件目录（默认: ./mongodb_migration_temp）
  --keep-temp             保留临时文件
  --no-test-connection    跳过连接测试（默认会测试连接）
  --use-existing-dump     使用已存在的导出文件（跳过导出步骤）
  --dump-path <path>      指定导出文件路径（自动启用 --use-existing-dump）
  --help, -h              显示此帮助信息

环境变量:
  SOURCE_MONGODB_URI      源数据库连接字符串
  TARGET_MONGODB_URI      目标数据库连接字符串
  DATABASE_NAME           数据库名称
  EXCLUDE_COLLECTIONS     要跳过的集合名称（逗号分隔）
                          例如: EXCLUDE_COLLECTIONS="logs,audit,temp"
  INCLUDE_COLLECTIONS     只导出指定的集合名称（逗号分隔）
                          例如: INCLUDE_COLLECTIONS="users,orders"
                          注意: 如果指定了 INCLUDE_COLLECTIONS，将忽略 EXCLUDE_COLLECTIONS
  COMPRESS                是否压缩 (true/false, 默认: true)
  DROP_TARGET             是否删除目标数据 (true/false, 默认: false)
  TEMP_DIR                临时文件目录
  KEEP_TEMP               保留临时文件 (true/false, 默认: false)

示例:
  # 使用命令行参数
  node migrate_mongodb.js --source "mongodb://user:pass@source:27017/db" --target "mongodb://user:pass@target:27017/db"

  # 跳过某些集合
  node migrate_mongodb.js \\
    --source "mongodb://user:pass@source:27017/db" \\
    --target "mongodb://user:pass@target:27017/db" \\
    --exclude-collection "logs" \\
    --exclude-collection "audit,temp"

  # 只导出指定的集合
  node migrate_mongodb.js \\
    --source "mongodb://user:pass@source:27017/db" \\
    --target "mongodb://user:pass@target:27017/db" \\
    --include-collection "users" \\
    --include-collection "orders,products"

  # 使用环境变量
  SOURCE_MONGODB_URI="mongodb://user:pass@source:27017/db" \\
  TARGET_MONGODB_URI="mongodb://user:pass@target:27017/db" \\
  EXCLUDE_COLLECTIONS="logs,audit,temp" \\
  node migrate_mongodb.js
    `);
  }

  /**
   * 验证配置
   */
  validateConfig() {
    if (!this.config.sourceUri && !this.config.targetUri) {
      console.error('❌ 错误: 必须提供源数据库和目标数据库连接字符串');
      console.error('   使用 --source 和 --target 参数，或设置环境变量');
      console.error('   运行 node migrate_mongodb.js --help 查看帮助');
      process.exit(1);
    }

    if (!this.config.sourceUri) {
      console.error('❌ 错误: 必须提供源数据库连接字符串');
      process.exit(1);
    }

    if (!this.config.targetUri) {
      console.error('❌ 错误: 必须提供目标数据库连接字符串');
      process.exit(1);
    }
  }

  /**
   * 确保目录存在
   */
  ensureDirectories() {
    [this.config.tempDir, this.config.logDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 日志记录
   */
  log(message, data = '') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    if (data) {
      console.log(logMessage, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    } else {
      console.log(logMessage);
    }

    // 写入日志文件（如果 config 已初始化）
    try {
      const logDir = this.config?.logDir || './migration_logs';
      const logFile = path.join(logDir, `migration_${new Date().toISOString().split('T')[0]}.log`);
      
      // 确保日志目录存在
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logLine = `${logMessage} ${data ? (typeof data === 'object' ? JSON.stringify(data) : data) : ''}\n`;
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      // 如果写入日志失败，只输出到控制台（避免影响主流程）
      // 静默失败，不抛出错误
    }
  }

  /**
   * 错误日志
   */
  errorLog(message, error) {
    const errorMsg = error ? `${message}: ${error.message || error}` : message;
    console.error(`❌ ${errorMsg}`);
    this.log(`[ERROR] ${errorMsg}`, error ? error.stack : '');
  }

  /**
   * 检查命令是否存在
   */
  async checkCommand(command) {
    try {
      await execAsync(`which ${command} || where ${command}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 编码MongoDB URI中的密码（处理特殊字符）
   * 注意：如果URI已经包含编码后的密码，不会重复编码
   */
  encodeMongoUri(uri) {
    try {
      // 解析URI
      const url = new URL(uri);
      
      // 如果密码已经编码过（包含%），直接返回
      if (url.password && url.password.includes('%')) {
        return uri;
      }
      
      // 如果密码包含特殊字符，需要编码
      if (url.password) {
        // 检查密码是否包含需要编码的字符
        const needsEncoding = /[ :@\/?#\[\]%]/.test(url.password);
        if (needsEncoding) {
          // 编码密码
          const encodedPassword = encodeURIComponent(url.password);
          // 重新构建URI
          return uri.replace(`:${url.password}@`, `:${encodedPassword}@`);
        }
      }
      return uri;
    } catch (error) {
      // 如果URL解析失败，尝试手动处理
      // 匹配 mongodb://user:password@host:port/db 格式
      const uriMatch = uri.match(/^(mongodb:\/\/[^:]+):([^@]+)@(.+)$/);
      if (uriMatch) {
        const [, prefix, password, suffix] = uriMatch;
        // 如果已经编码过，直接返回
        if (password.includes('%')) {
          return uri;
        }
        const needsEncoding = /[ :@\/?#\[\]%]/.test(password);
        if (needsEncoding) {
          const encodedPassword = encodeURIComponent(password);
          return `${prefix}:${encodedPassword}@${suffix}`;
        }
      }
      return uri;
    }
  }

  /**
   * 使用 Node.js MongoDB 驱动测试连接
   */
  async testConnectionWithDriver(uri, label) {
    return new Promise(async (resolve, reject) => {
      let mongoose = null;
      try {
        // 动态加载 mongoose（如果可用）
        mongoose = require('mongoose');
      } catch (error) {
        // mongoose 未安装，返回 false 让调用者尝试其他方法
        resolve(false);
        return;
      }

      try {
        // 确保 URI 中的密码已正确编码（如果还未编码）
        const encodedUri = this.encodeMongoUri(uri);
        
        // 设置较短的超时时间
        const connectionOptions = {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 10000,
        };

        // 尝试连接
        await mongoose.connect(encodedUri, connectionOptions);
        
        // 测试连接
        await mongoose.connection.db.admin().ping();
        
        // 关闭连接
        await mongoose.disconnect();
        
        this.log(`✅ ${label}连接测试成功（使用 Node.js 驱动）`);
        resolve(true);
      } catch (error) {
        // 确保关闭连接
        if (mongoose && mongoose.connection.readyState === 1) {
          try {
            await mongoose.disconnect();
          } catch (e) {
            // 忽略关闭错误
          }
        }

        // 检查是否是认证错误
        if (error.message && (
          error.message.includes('Authentication') || 
          error.message.includes('auth') ||
          error.message.includes('authentication failed') ||
          error.message.includes('AuthenticationFailed')
        )) {
          reject(new Error(`认证失败: ${error.message}`));
          return;
        }

        // 其他错误
        reject(error);
      }
    });
  }

  /**
   * 使用 mongosh 测试连接（备用方法）
   */
  async testConnectionWithMongosh(uri, label) {
    try {
      const encodedUri = this.encodeMongoUri(uri);
      const testCommand = `mongosh "${encodedUri}" --eval "db.adminCommand('ping')" --quiet`;
      
      const { stdout, stderr } = await execAsync(testCommand, { timeout: 15000 });
      
      // 检查输出中是否包含错误
      if (stderr && (stderr.includes('error') || stderr.includes('Error') || stderr.includes('Authentication'))) {
        throw new Error(stderr);
      }
      
      // 检查是否返回了 ping 结果
      if (stdout.includes('ok') || stdout.includes('1')) {
        this.log(`✅ ${label}连接测试成功（使用 mongosh）`);
        return true;
      } else {
        throw new Error('连接测试未返回预期结果');
      }
    } catch (error) {
      // 检查是否是命令未找到
      if (error.message && (
        error.message.includes('不是内部或外部命令') ||
        error.message.includes('command not found') ||
        error.message.includes('mongosh') && error.message.includes('not found')
      )) {
        return false; // mongosh 未安装，返回 false
      }
      
      throw error; // 其他错误向上抛出
    }
  }

  /**
   * 测试数据库连接
   */
  async testConnection(uri, label) {
    this.log(`🔍 测试${label}连接...`);
    this.log(`   连接字符串: ${uri.replace(/:[^:@]+@/g, ':****@')}`);
    
    try {
      // 方法1: 优先使用 Node.js MongoDB 驱动（如果项目中有 mongoose）
      try {
        const result = await this.testConnectionWithDriver(uri, label);
        if (result === true) {
          return true;
        }
        // result === false 表示 mongoose 未安装，继续尝试其他方法
      } catch (error) {
        // 如果是认证错误，直接抛出
        if (error.message && error.message.includes('认证失败')) {
          throw error;
        }
        // 其他错误，继续尝试 mongosh
      }

      // 方法2: 使用 mongosh（如果可用）
      try {
        const result = await this.testConnectionWithMongosh(uri, label);
        if (result === true) {
          return true;
        }
        // mongosh 未安装，继续
      } catch (error) {
        // 检查是否是认证错误
        if (error.message && (error.message.includes('Authentication') || error.message.includes('auth'))) {
          throw error;
        }
        // 其他错误，继续
      }

      // 如果两种方法都不可用，给出提示
      this.log(`⚠️  无法测试${label}连接（mongosh 和 mongoose 都不可用）`);
      this.log(`   将跳过连接测试，继续尝试迁移`);
      this.log(`   如果迁移失败，请检查连接信息或安装 mongosh/mongoose`);
      return true; // 允许继续，让实际的迁移命令来验证

    } catch (error) {
      // 处理认证错误
      if (error.message && (
        error.message.includes('认证失败') ||
        error.message.includes('Authentication') || 
        error.message.includes('auth') ||
        error.message.includes('authentication failed')
      )) {
        this.errorLog(`${label}连接测试失败：认证失败`, error);
        console.error('\n💡 认证失败可能的原因：');
        console.error('   1. 用户名或密码错误');
        console.error('   2. 密码包含特殊字符，需要URL编码（脚本已自动处理）');
        console.error('   3. 认证数据库（authSource）不正确');
        console.error('   4. 用户权限不足');
        console.error('\n   请检查配置文件中的数据库连接信息，或查看 README_MongoDB认证问题排查.md');
        throw error; // 认证失败时抛出错误，阻止迁移
      }
      
      // 其他错误
      this.log(`⚠️  ${label}连接测试失败: ${error.message}`);
      this.log(`   将跳过连接测试，继续尝试迁移（如果迁移失败，请检查连接信息）`);
      return true; // 允许继续
    }
  }

  /**
   * 询问用户确认
   */
  async askConfirmation(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  /**
   * 执行命令并显示进度
   */
  async executeCommand(command, description) {
    this.log(`🔄 ${description}...`);
    this.log(`   执行命令: ${command.replace(/:[^:@]+@/g, ':****@')}`); // 隐藏密码
    console.log(''); // 空行，便于查看进度

    const startTime = Date.now();
    let lastOutputTime = startTime;
    let outputLines = 0;
    const maxOutputLines = 1000; // 限制输出行数，避免过多日志

    return new Promise((resolve, reject) => {
      // 使用 shell: true 让系统自动处理命令解析和引号（跨平台兼容）
      // 在 Windows 上会自动使用 cmd，在 Unix 上使用 sh
      const process = spawn(command, [], {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let lastCollection = '';
      let collectionCount = 0;
      let documentCount = 0;

      // 实时输出处理函数
      const processOutput = (data, isStderr = false) => {
        const output = data.toString();
        if (isStderr) {
          stderr += output;
        } else {
          stdout += output;
        }

        // 按行处理输出
        const lines = output.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return;

          // 检测集合名称（mongodump/mongorestore 的输出格式）
          const collectionMatch = trimmedLine.match(/writing\s+(\S+)\s+to\s+/i) || 
                                  trimmedLine.match(/restoring\s+(\S+)\s+to\s+/i) ||
                                  trimmedLine.match(/collection:\s+(\S+)/i) ||
                                  trimmedLine.match(/\.(\w+)\s+to\s+/i);
          
          if (collectionMatch) {
            const collection = collectionMatch[1];
            if (collection !== lastCollection) {
              lastCollection = collection;
              collectionCount++;
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
              console.log(`   📦 [${elapsed}s] 处理集合: ${collection}`);
            }
          }

          // 检测文档数量
          const docMatch = trimmedLine.match(/(\d+)\s+document/i) || 
                          trimmedLine.match(/(\d+)\s+documents/i);
          if (docMatch) {
            const count = parseInt(docMatch[1]);
            if (count > documentCount) {
              documentCount = count;
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
              console.log(`   📄 [${elapsed}s] 已处理文档: ${count}`);
            }
          }

          // 显示重要信息（集合、文档、进度等）
          const isImportant = trimmedLine.includes('collection') || 
                              trimmedLine.includes('document') || 
                              trimmedLine.includes('writing') || 
                              trimmedLine.includes('restoring') ||
                              trimmedLine.includes('done') ||
                              trimmedLine.includes('finished') ||
                              trimmedLine.includes('complete') ||
                              trimmedLine.includes('error') ||
                              trimmedLine.includes('warning') ||
                              trimmedLine.match(/\d+\s+(bytes|KB|MB|GB)/i) ||
                              trimmedLine.match(/progress|进度/i);
          
          if (isImportant) {
            // 限制输出频率（每500ms最多输出一次，但前50行总是显示）
            const now = Date.now();
            if (now - lastOutputTime > 500 || outputLines < 50) {
              const elapsed = ((now - startTime) / 1000).toFixed(1);
              
              // 格式化输出，移除多余的空格
              const cleanLine = trimmedLine.replace(/\s+/g, ' ').trim();
              console.log(`   ⏱️  [${elapsed}s] ${cleanLine}`);
              lastOutputTime = now;
              outputLines++;
              
              // 如果输出太多，减少频率
              if (outputLines > maxOutputLines) {
                // 只显示关键信息
                if (!trimmedLine.match(/collection|document|done|finished|error|complete/i)) {
                  return;
                }
              }
            }
          }

          // 显示错误和警告（总是显示）
          if (trimmedLine.toLowerCase().includes('error') || 
              trimmedLine.toLowerCase().includes('warning')) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const prefix = trimmedLine.toLowerCase().includes('error') ? '❌' : '⚠️';
            console.log(`   ${prefix} [${elapsed}s] ${trimmedLine}`);
          }
        });
      };

      process.stdout.on('data', (data) => {
        stdout += data.toString();
        processOutput(data, false);
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
        processOutput(data, true);
      });

      // 定期输出心跳信息（如果长时间没有输出）
      const heartbeatInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = ((now - startTime) / 1000).toFixed(1);
        const silentTime = now - lastOutputTime;
        
        // 如果超过5秒没有输出，显示心跳
        if (silentTime > 5000) {
          const stats = [];
          if (collectionCount > 0) stats.push(`${collectionCount} 个集合`);
          if (documentCount > 0) stats.push(`${documentCount} 个文档`);
          const statsStr = stats.length > 0 ? ` (${stats.join(', ')})` : '';
          console.log(`   💓 [${elapsed}s] 正在处理中...${statsStr}`);
          lastOutputTime = now;
        }
      }, 5000); // 每5秒检查一次

      process.on('close', (code) => {
        clearInterval(heartbeatInterval);
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(''); // 换行
        
        if (code === 0) {
          this.log(`✅ ${description}完成 (耗时: ${elapsed}秒)`);
          if (collectionCount > 0) {
            this.log(`   处理了 ${collectionCount} 个集合`);
          }
          if (documentCount > 0) {
            this.log(`   处理了 ${documentCount} 个文档`);
          }
          resolve({ stdout, stderr });
        } else {
          this.errorLog(`${description}失败 (耗时: ${elapsed}秒)`, new Error(`退出码: ${code}`));
          
          // 分析错误类型，提供更友好的错误信息
          const errorMsg = stderr || '';
          let helpfulMsg = '';
          
          if (errorMsg.includes('Authentication failed') || errorMsg.includes('auth error')) {
            helpfulMsg = '\n💡 认证失败解决方案：\n';
            helpfulMsg += '   1. 检查用户名和密码是否正确\n';
            helpfulMsg += '   2. 如果密码包含特殊字符（空格、@、:等），需要进行URL编码\n';
            helpfulMsg += '   3. 使用 encodeURIComponent() 编码密码，例如：\n';
            helpfulMsg += '      const encodedPassword = encodeURIComponent("your password");\n';
            helpfulMsg += '      mongodb://user:${encodedPassword}@host:27017/db\n';
            helpfulMsg += '   4. 检查认证数据库（authSource）是否正确\n';
            helpfulMsg += '   5. 确保用户有足够的权限\n';
            helpfulMsg += '   6. 如果使用命名空间映射，确保 URI 中包含数据库名称或使用 authSource\n';
          } else if (errorMsg.includes('connection') || errorMsg.includes('connect')) {
            helpfulMsg = '\n💡 连接失败解决方案：\n';
            helpfulMsg += '   1. 检查网络连接和防火墙设置\n';
            helpfulMsg += '   2. 确认MongoDB服务正在运行\n';
            helpfulMsg += '   3. 检查主机地址和端口是否正确\n';
            helpfulMsg += '   4. 确认可以从当前机器访问目标服务器\n';
          }
          
          // 显示错误信息（最后500字符）
          const errorPreview = stderr.substring(Math.max(0, stderr.length - 500));
          console.error('   错误输出:', errorPreview);
          if (helpfulMsg) {
            console.error(helpfulMsg);
          }
          
          reject(new Error(`命令执行失败，退出码: ${code}\n${stderr}${helpfulMsg}`));
        }
      });

      process.on('error', (error) => {
        clearInterval(heartbeatInterval);
        reject(error);
      });
    });
  }

  /**
   * 查找最新的导出文件
   */
  findLatestDump() {
    const tempDir = this.config.tempDir;
    
    if (!fs.existsSync(tempDir)) {
      throw new Error(`临时文件目录不存在: ${tempDir}`);
    }

    // 查找所有 dump 目录
    const files = fs.readdirSync(tempDir);
    const dumpDirs = files
      .filter(file => {
        const filePath = path.join(tempDir, file);
        return fs.statSync(filePath).isDirectory() && file.startsWith('dump_');
      })
      .map(file => ({
        name: file,
        path: path.join(tempDir, file),
        time: fs.statSync(path.join(tempDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // 按时间降序排序

    if (dumpDirs.length === 0) {
      throw new Error(`在 ${tempDir} 中未找到导出文件。请先运行导出，或使用 --dump-path 指定导出文件路径。`);
    }

    const latestDump = dumpDirs[0];
    this.log(`找到 ${dumpDirs.length} 个导出文件，使用最新的: ${latestDump.name}`);
    return latestDump.path;
  }

  /**
   * 从源服务器导出数据库
   */
  async exportDatabase() {
    this.log('📤 开始从源服务器导出数据库...');
    this.log('   提示: mongodump 会显示每个集合的导出进度');
    this.log('   如果长时间没有输出，这是正常的，数据正在被导出...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpPath = path.join(this.config.tempDir, `dump_${timestamp}`);
    
    // 构建mongodump命令（自动编码URI中的特殊字符）
    const encodedSourceUri = this.encodeMongoUri(this.config.sourceUri);
    let command = `mongodump --uri "${encodedSourceUri}"`;
    
    if (this.config.database) {
      command += ` --db ${this.config.database}`;
    }

    // 添加集合过滤参数
    // 优先级：includeCollections > excludeCollections
    if (this.config.includeCollections && this.config.includeCollections.length > 0) {
      // 只导出指定的集合
      this.config.includeCollections.forEach(collection => {
        command += ` --collection ${collection}`;
      });
      this.log(`   只导出集合: ${this.config.includeCollections.join(', ')}`);
      this.log(`   (已忽略排除集合配置)`);
    } else if (this.config.excludeCollections && this.config.excludeCollections.length > 0) {
      // 排除指定的集合
      this.config.excludeCollections.forEach(collection => {
        command += ` --excludeCollection ${collection}`;
      });
      this.log(`   跳过集合: ${this.config.excludeCollections.join(', ')}`);
    }

    command += ` --out "${dumpPath}"`;

    if (this.config.compress) {
      command += ' --gzip';
      this.log('   压缩: 已启用 (使用 --gzip)');
    }

    try {
      await this.executeCommand(command, '导出数据库');
      this.log('✅ 数据库导出成功');
      return dumpPath;
    } catch (error) {
      this.errorLog('数据库导出失败', error);
      throw error;
    }
  }

  /**
   * 压缩导出文件（如果未使用gzip）
   */
  async compressDump(dumpPath) {
    if (this.config.compress) {
      // 如果已经使用gzip，不需要再次压缩
      return dumpPath;
    }

    this.log('📦 压缩导出文件...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = path.join(this.config.tempDir, `dump_${timestamp}.tar.gz`);

    try {
      // 使用tar压缩（跨平台）
      const command = process.platform === 'win32' 
        ? `tar -czf "${archivePath}" -C "${path.dirname(dumpPath)}" "${path.basename(dumpPath)}"`
        : `tar -czf "${archivePath}" -C "${path.dirname(dumpPath)}" "${path.basename(dumpPath)}"`;
      
      await this.executeCommand(command, '压缩文件');
      this.log('✅ 文件压缩成功');
      
      // 删除原始目录
      if (fs.existsSync(dumpPath)) {
        fs.rmSync(dumpPath, { recursive: true, force: true });
      }
      
      return archivePath;
    } catch (error) {
      this.errorLog('文件压缩失败', error);
      // 压缩失败不影响后续步骤
      return dumpPath;
    }
  }

  /**
   * 导入数据库到目标服务器
   */
  async importDatabase(dumpPath) {
    this.log('📥 开始导入数据库到目标服务器...');
    this.log('   提示: mongorestore 会显示每个集合的导入进度');
    this.log('   如果长时间没有输出，这是正常的，数据正在被导入...');

    // 检查是压缩文件还是目录
    const isArchive = dumpPath.endsWith('.tar.gz') || dumpPath.endsWith('.gz');
    let restorePath = dumpPath;
    let useGzip = false;

    // 如果是压缩文件，需要先解压
    if (isArchive && !dumpPath.includes('/dump_') && !dumpPath.includes('\\dump_')) {
      this.log('📦 解压文件...');
      const extractPath = path.join(this.config.tempDir, 'extracted_dump');
      if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
      }

      try {
        const command = process.platform === 'win32'
          ? `tar -xzf "${dumpPath}" -C "${extractPath}"`
          : `tar -xzf "${dumpPath}" -C "${extractPath}"`;
        
        await this.executeCommand(command, '解压文件');
        
        // 查找解压后的目录
        const extractedDirs = fs.readdirSync(extractPath);
        if (extractedDirs.length > 0) {
          restorePath = path.join(extractPath, extractedDirs[0]);
        } else {
          restorePath = extractPath;
        }
      } catch (error) {
        this.errorLog('解压失败，尝试直接使用mongorestore的gzip支持', error);
        restorePath = dumpPath;
      }
    }

    // 检查目录中是否有 .gz 文件（说明导出时使用了 --gzip）
    // 如果导出时使用了压缩，默认使用 gzip（即使检测不到文件）
    if (this.config.compress) {
      useGzip = true;
      this.log(`   导出时使用了 --gzip 压缩，将使用 --gzip 参数导入`);
    }
    
    // 进一步验证：检查目录中是否有 .gz 文件，并确定正确的恢复路径
    if (fs.existsSync(restorePath) && fs.statSync(restorePath).isDirectory()) {
      try {
        const files = fs.readdirSync(restorePath);
        this.log(`   检查目录内容... (找到 ${files.length} 个文件/目录)`);
        
        // 检查是否有 .bson.gz 或 .metadata.json.gz 文件（直接在根目录）
        const gzipFiles = files.filter(file => file.endsWith('.bson.gz') || file.endsWith('.metadata.json.gz'));
        const bsonFiles = files.filter(file => file.endsWith('.bson') && !file.endsWith('.bson.gz'));
        
        if (gzipFiles.length > 0) {
          this.log(`   ✅ 确认：检测到 ${gzipFiles.length} 个 gzip 压缩文件（在根目录）`);
          this.log(`   示例文件: ${gzipFiles.slice(0, 3).join(', ')}${gzipFiles.length > 3 ? '...' : ''}`);
          useGzip = true;
        } else if (bsonFiles.length > 0) {
          this.log(`   ⚠️  检测到 ${bsonFiles.length} 个未压缩的 .bson 文件`);
          this.log(`   如果导出时使用了 --gzip，这可能是异常情况`);
          // 如果配置了压缩但检测到未压缩文件，保持 useGzip = true（因为配置说使用了压缩）
        } else {
          // 检查是否有子目录（mongodump 可能创建了数据库名称的子目录）
          const subDirs = files.filter(file => {
            try {
              const filePath = path.join(restorePath, file);
              return fs.statSync(filePath).isDirectory();
            } catch {
              return false;
            }
          });
          
          if (subDirs.length > 0) {
            this.log(`   发现 ${subDirs.length} 个子目录，检查其中的文件...`);
            // 检查子目录中的文件
            for (const subDir of subDirs) {
              try {
                const subDirPath = path.join(restorePath, subDir);
                const subFiles = fs.readdirSync(subDirPath);
                const subGzipFiles = subFiles.filter(file => file.endsWith('.bson.gz') || file.endsWith('.metadata.json.gz'));
                const subBsonFiles = subFiles.filter(file => file.endsWith('.bson') && !file.endsWith('.bson.gz'));
                
                if (subGzipFiles.length > 0) {
                  this.log(`   ✅ 在子目录 "${subDir}" 中检测到 ${subGzipFiles.length} 个 gzip 压缩文件`);
                  useGzip = true;
                  // 重要：当文件在子目录中时，mongorestore 需要指向父目录（当前 restorePath 已经是正确的）
                  // mongorestore 会自动识别数据库名称
                  break;
                } else if (subBsonFiles.length > 0) {
                  this.log(`   ⚠️  在子目录 "${subDir}" 中检测到 ${subBsonFiles.length} 个未压缩的 .bson 文件`);
                }
              } catch (error) {
                // 忽略子目录读取错误
              }
            }
          } else {
            this.log(`   ⚠️  目录中既没有 .bson.gz 文件，也没有子目录`);
          }
        }
      } catch (error) {
        this.log(`   ⚠️  无法检查目录内容: ${error.message}`);
        // 如果导出时使用了压缩，保持 useGzip = true
      }
    }

    // 构建mongorestore命令（自动编码URI中的特殊字符）
    // 注意：如果使用命名空间映射，需要移除 URI 中的数据库名称
    let targetUri = this.config.targetUri;
    let useNamespaceMapping = false;
    
    // 如果使用了 gzip 压缩，添加 --gzip 参数
    if (useGzip) {
      this.log(`   ✅ 已添加 --gzip 参数到 mongorestore 命令`);
    } else {
      this.log(`   ℹ️  未使用 --gzip 参数（未检测到压缩文件）`);
    }

    // 添加排除集合参数
    // 注意：如果使用已存在的导出文件，导出时已经排除了这些集合，不需要再次排除
    const excludeCollections = [];
    if (!this.config.useExistingDump && this.config.excludeCollections && this.config.excludeCollections.length > 0) {
      excludeCollections.push(...this.config.excludeCollections);
      this.log(`   跳过集合: ${this.config.excludeCollections.join(', ')}`);
    } else if (this.config.useExistingDump && this.config.excludeCollections && this.config.excludeCollections.length > 0) {
      this.log(`   ℹ️  使用已存在的导出文件，导出时已排除集合: ${this.config.excludeCollections.join(', ')}`);
    }

    // 添加路径（使用 path.normalize 确保路径格式正确）
    // 重要：mongorestore 的行为：
    // 1. 如果指向包含数据库子目录的目录，会自动识别数据库名称
    // 2. 如果 URI 中指定了数据库，会尝试将数据导入到该数据库
    // 3. 如果数据库名称不匹配（大小写不同），需要使用 --nsFrom 和 --nsTo
    const normalizedPath = path.normalize(restorePath);
    
    // 验证路径是否存在
    if (!fs.existsSync(normalizedPath)) {
      throw new Error(`恢复路径不存在: ${normalizedPath}`);
    }
    
    // 检查目录结构，确定正确的恢复路径
    let finalRestorePath = normalizedPath;
    let dbNameFromDump = null;
    let targetDbName = null; // 在外层作用域定义，确保后续可以使用
    
    // 从 URI 中提取目标数据库名称（提前提取，避免作用域问题）
    try {
      // 匹配格式: mongodb://user:pass@host:port/dbname 或 mongodb://user:pass@host:port/dbname?options
      const uriMatch = this.config.targetUri.match(/mongodb:\/\/[^\/]+\/([^?]+)/);
      if (uriMatch && uriMatch[1]) {
        targetDbName = uriMatch[1];
      } else {
        // 如果 URI 中没有数据库名称，使用配置中的数据库名称
        targetDbName = this.config.database || null;
      }
    } catch (e) {
      // 如果 URI 解析失败，使用配置中的数据库名称
      targetDbName = this.config.database || null;
    }
    
    if (fs.statSync(normalizedPath).isDirectory()) {
      const files = fs.readdirSync(normalizedPath);
      const subDirs = files.filter(file => {
        try {
          return fs.statSync(path.join(normalizedPath, file)).isDirectory();
        } catch {
          return false;
        }
      });
      
      // 如果只有一个子目录，且子目录中有 .bson.gz 文件
      // 这个子目录名就是导出时的数据库名称
      if (subDirs.length === 1) {
        const subDirPath = path.join(normalizedPath, subDirs[0]);
        const subFiles = fs.readdirSync(subDirPath);
        const hasGzipFiles = subFiles.some(file => file.endsWith('.bson.gz') || file.endsWith('.metadata.json.gz'));
        
        if (hasGzipFiles) {
          dbNameFromDump = subDirs[0];
          this.log(`   检测到数据库子目录: "${dbNameFromDump}"`);
          
          if (targetDbName) {
            this.log(`   从 URI 提取目标数据库名称: "${targetDbName}"`);
          }
          
          // 如果数据库名称不同（大小写或名称），需要添加命名空间映射
          if (targetDbName && dbNameFromDump !== targetDbName) {
            this.log(`   数据库名称不匹配: 导出时="${dbNameFromDump}", 目标="${targetDbName}"`);
            this.log(`   将使用命名空间映射: ${dbNameFromDump}.* -> ${targetDbName}.*`);
            useNamespaceMapping = true;
            
            // 注意：保留 URI 中的数据库名称（用于认证）
            // mongorestore 会使用 URI 中的数据库进行认证，然后通过 --nsFrom/--nsTo 映射数据到目标数据库
            // 不要移除数据库名称，因为认证需要它
            this.log(`   保留 URI 中的数据库名称用于认证: ${targetUri.replace(/:[^:@]+@/g, ':****@')}`);
          }
          
          // 验证路径中确实有文件
          const dbSubDirPath = path.join(normalizedPath, dbNameFromDump);
          if (fs.existsSync(dbSubDirPath)) {
            const dbFiles = fs.readdirSync(dbSubDirPath);
            const gzipCount = dbFiles.filter(f => f.endsWith('.bson.gz')).length;
            const metadataCount = dbFiles.filter(f => f.endsWith('.metadata.json.gz')).length;
            this.log(`   验证: 数据库子目录 "${dbNameFromDump}" 中包含 ${gzipCount} 个 .bson.gz 文件和 ${metadataCount} 个 .metadata.json.gz 文件`);
            
            if (gzipCount === 0) {
              throw new Error(`数据库子目录 "${dbNameFromDump}" 中没有找到 .bson.gz 文件`);
            }
          }
          
          // 确定恢复路径
          // 如果数据库名称匹配，直接指向数据库子目录
          // 如果数据库名称不匹配，指向父目录并使用命名空间映射
          if (targetDbName && dbNameFromDump === targetDbName) {
            // 数据库名称匹配，直接指向数据库子目录
            finalRestorePath = path.join(normalizedPath, dbNameFromDump);
            this.log(`   数据库名称匹配，直接指向数据库子目录: ${finalRestorePath}`);
          } else {
            // 数据库名称不匹配，指向父目录，使用命名空间映射
            finalRestorePath = normalizedPath;
            this.log(`   恢复路径: ${finalRestorePath} (包含数据库子目录 "${dbNameFromDump}")`);
          }
        }
      } else if (subDirs.length > 1) {
        this.log(`   发现多个数据库子目录: ${subDirs.join(', ')}`);
        // 多个数据库，指向父目录，mongorestore 会处理所有数据库
        finalRestorePath = normalizedPath;
      } else {
        // 没有子目录，文件直接在根目录
        finalRestorePath = normalizedPath;
      }
    }
    
    // 构建完整的 mongorestore 命令
    const encodedTargetUri = this.encodeMongoUri(targetUri);
    let command = `mongorestore --uri "${encodedTargetUri}"`;

    if (this.config.dropTarget) {
      command += ' --drop';
    }

    if (useGzip) {
      command += ' --gzip';
    }

    // 添加命名空间映射（如果数据库名称不匹配）
    // 注意：命名空间映射必须在排除集合之前
    if (useNamespaceMapping && dbNameFromDump && targetDbName) {
      command += ` --nsFrom "${dbNameFromDump}.*" --nsTo "${targetDbName}.*"`;
      this.log(`   添加命名空间映射: ${dbNameFromDump}.* -> ${targetDbName}.*`);
    }

    // 添加排除集合参数
    // 注意：如果使用命名空间映射，排除集合名称需要使用映射后的名称（目标数据库的集合名）
    if (excludeCollections.length > 0) {
      if (useNamespaceMapping) {
        // 使用命名空间映射时，排除集合名称应该使用目标数据库的集合名
        // 但由于导出时已经排除了这些集合，它们不会出现在导出文件中
        // 所以这里不需要再次排除
        this.log(`   ℹ️  使用命名空间映射，导出时已排除的集合不会出现在导出文件中，无需再次排除`);
      } else {
        excludeCollections.forEach(collection => {
          command += ` --excludeCollection ${collection}`;
        });
        this.log(`   跳过集合: ${excludeCollections.join(', ')}`);
      }
    }

    // 使用绝对路径，避免路径问题
    const absolutePath = path.resolve(finalRestorePath);
    command += ` "${absolutePath}"`;
    
    // 记录使用的参数
    if (useGzip) {
      this.log(`   使用参数: --gzip（检测到压缩文件）`);
    }
    if (useNamespaceMapping) {
      this.log(`   使用命名空间映射: ${dbNameFromDump}.* -> ${targetDbName}.*`);
    }
    
    // 显示完整的命令（隐藏密码）
    this.log(`   完整命令: ${command.replace(/:[^:@]+@/g, ':****@')}`);
    this.log(`   绝对路径: ${absolutePath}`);

    try {
      await this.executeCommand(command, '导入数据库');
      this.log('✅ 数据库导入成功');
    } catch (error) {
      this.errorLog('数据库导入失败', error);
      throw error;
    }
  }

  /**
   * 清理临时文件
   */
  async cleanup() {
    if (this.config.keepTemp) {
      this.log('ℹ️  保留临时文件（根据配置）');
      return;
    }

    this.log('🧹 清理临时文件...');
    try {
      if (fs.existsSync(this.config.tempDir)) {
        fs.rmSync(this.config.tempDir, { recursive: true, force: true });
        this.log('✅ 临时文件清理完成');
      }
    } catch (error) {
      this.errorLog('清理临时文件失败', error);
    }
  }

  /**
   * 显示迁移摘要
   */
  displaySummary(startTime, success) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ 数据库迁移完成！');
    } else {
      console.log('❌ 数据库迁移失败！');
    }
    console.log('='.repeat(60));
    console.log(`⏱️  总耗时: ${duration} 秒`);
    console.log(`📁 临时文件目录: ${this.config.tempDir}`);
    console.log(`📝 日志目录: ${this.config.logDir}`);
    if (this.config.keepTemp) {
      console.log(`ℹ️  临时文件已保留（可使用 --keep-temp 控制）`);
    }
    console.log('='.repeat(60) + '\n');
  }

  /**
   * 执行迁移
   */
  async migrate() {
    const startTime = Date.now();
    let dumpPath = null;
    let success = false;

    try {
      // 显示配置信息
      console.log('\n' + '='.repeat(60));
      console.log('🚀 MongoDB数据库迁移工具');
      console.log('='.repeat(60));
      console.log(`📤 源数据库: ${this.config.sourceUri.replace(/:[^:@]+@/g, ':****@')}`);
      console.log(`📥 目标数据库: ${this.config.targetUri.replace(/:[^:@]+@/g, ':****@')}`);
      if (this.config.database) {
        console.log(`📦 数据库名称: ${this.config.database}`);
      }
      console.log(`🗜️  压缩: ${this.config.compress ? '是' : '否'}`);
      console.log(`🗑️  删除目标数据: ${this.config.dropTarget ? '是' : '否'}`);
      if (this.config.includeCollections && this.config.includeCollections.length > 0) {
        console.log(`✅ 只导出集合: ${this.config.includeCollections.join(', ')}`);
      } else if (this.config.excludeCollections && this.config.excludeCollections.length > 0) {
        console.log(`⏭️  跳过集合: ${this.config.excludeCollections.join(', ')}`);
      }
      if (this.config.useExistingDump) {
        console.log(`📂 使用已存在的导出文件: ${this.config.dumpPath || '自动查找最新的'}`);
      }
      console.log('='.repeat(60) + '\n');

      // 确认操作
      if (this.config.dropTarget) {
        const confirmed = await this.askConfirmation('⚠️  警告: 将删除目标数据库的现有数据！是否继续？(y/N): ');
        if (!confirmed) {
          this.log('❌ 用户取消操作');
          return;
        }
      }

      // 检查必要工具
      this.log('🔍 检查必要工具...');
      const hasMongorestore = await this.checkCommand('mongorestore');
      
      if (!hasMongorestore) {
        throw new Error('mongorestore 命令未找到，请安装 MongoDB Database Tools');
      }
      
      // 如果使用已存在的导出文件，不需要 mongodump
      if (!this.config.useExistingDump) {
        const hasMongodump = await this.checkCommand('mongodump');
        if (!hasMongodump) {
          throw new Error('mongodump 命令未找到，请安装 MongoDB Database Tools');
        }
      } else {
        this.log('ℹ️  跳过 mongodump 检查（使用已存在的导出文件）');
      }
      
      this.log('✅ 工具检查通过');

      // 测试连接（如果启用）
      if (this.config.testConnection) {
        console.log('\n' + '='.repeat(60));
        console.log('🔍 连接测试阶段');
        console.log('='.repeat(60) + '\n');
        
        try {
          // 如果使用已存在的导出文件，不需要测试源数据库连接
          if (!this.config.useExistingDump) {
            await this.testConnection(this.config.sourceUri, '源数据库');
          } else {
            this.log('ℹ️  跳过源数据库连接测试（使用已存在的导出文件）');
          }
          
          // 始终测试目标数据库连接
          await this.testConnection(this.config.targetUri, '目标数据库');
          console.log('\n✅ 所有连接测试通过，开始迁移...\n');
        } catch (error) {
          this.errorLog('连接测试失败，迁移已中止', error);
          this.log('请修复连接问题后重试');
          throw error;
        }
      } else {
        this.log('ℹ️  连接测试已跳过（使用 --no-test-connection 或配置中禁用）');
      }

      // 步骤1: 导出数据库（如果未使用已存在的导出文件）
      if (this.config.useExistingDump) {
        this.log('📂 使用已存在的导出文件（跳过导出步骤）...');
        
        if (this.config.dumpPath) {
          // 使用指定的路径
          dumpPath = path.resolve(this.config.dumpPath);
          if (!fs.existsSync(dumpPath)) {
            throw new Error(`指定的导出文件路径不存在: ${dumpPath}`);
          }
          this.log(`   使用指定的导出文件: ${dumpPath}`);
        } else {
          // 查找最新的导出文件
          dumpPath = this.findLatestDump();
        }
        
        // 验证导出文件
        if (!fs.existsSync(dumpPath)) {
          throw new Error(`导出文件不存在: ${dumpPath}`);
        }
        
        const stats = fs.statSync(dumpPath);
        if (stats.isDirectory()) {
          this.log(`   ✅ 找到导出目录: ${dumpPath}`);
          const files = fs.readdirSync(dumpPath);
          this.log(`   目录中包含 ${files.length} 个文件/目录`);
        } else {
          this.log(`   ✅ 找到导出文件: ${dumpPath}`);
        }
        
        // 使用已存在的导出文件时，跳过压缩步骤
        this.log('ℹ️  跳过压缩步骤（使用已存在的导出文件）');
      } else {
        // 正常导出流程
        dumpPath = await this.exportDatabase();

        // 步骤2: 压缩（如果需要）
        if (!this.config.compress || !dumpPath.includes('.gz')) {
          dumpPath = await this.compressDump(dumpPath);
        }
      }

      // 步骤3: 导入数据库
      await this.importDatabase(dumpPath);

      success = true;
      this.log('🎉 数据库迁移成功完成！');

    } catch (error) {
      this.errorLog('迁移过程中发生错误', error);
      success = false;
    } finally {
      // 清理临时文件
      await this.cleanup();
      
      // 关闭readline接口
      this.rl.close();
      
      // 显示摘要
      this.displaySummary(startTime, success);
    }

    process.exit(success ? 0 : 1);
  }
}

// 主程序
if (require.main === module) {
  const migrator = new MongoDBMigrator();
  migrator.migrate().catch(error => {
    console.error('❌ 致命错误:', error);
    process.exit(1);
  });
}

module.exports = MongoDBMigrator;
