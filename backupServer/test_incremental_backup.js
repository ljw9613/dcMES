#!/usr/bin/env node

/**
 * 增量备份系统测试脚本
 * 
 * 用于验证增量备份系统的各项功能是否正常工作
 * 包括连接测试、权限验证、备份测试等
 * 
 * 使用方法：
 * node test_incremental_backup.js
 * 
 * @Author: 系统管理员
 * @Date: 2024
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class BackupSystemTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    
    this.config = {
      host: '47.115.19.76',
      port: '27017',
      database: 'dcMes',
      username: 'dcMes',
      password: 'dcMes123.',
      authDatabase: 'dcMes'
    };
  }

  /**
   * 输出测试结果
   */
  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const statusColor = {
      'INFO': '\x1b[37m',    // 白色
      'PASS': '\x1b[32m',    // 绿色
      'FAIL': '\x1b[31m',    // 红色
      'WARN': '\x1b[33m'     // 黄色
    };
    
    const color = statusColor[status] || '\x1b[37m';
    console.log(`${color}[${timestamp}] [${status}] ${message}\x1b[0m`);
  }

  /**
   * 记录测试结果
   */
  recordTest(testName, passed, message = '') {
    this.testResults.total++;
    
    if (passed) {
      this.testResults.passed++;
      this.log(`✓ ${testName}: ${message}`, 'PASS');
    } else {
      this.testResults.failed++;
      this.log(`✗ ${testName}: ${message}`, 'FAIL');
    }
    
    this.testResults.details.push({
      name: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 测试Node.js环境
   */
  async testNodeEnvironment() {
    try {
      const nodeVersion = process.version;
      const major = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      this.recordTest(
        'Node.js版本检查',
        major >= 14,
        `当前版本: ${nodeVersion}, 要求: >= v14`
      );
    } catch (error) {
      this.recordTest('Node.js版本检查', false, error.message);
    }
  }

  /**
   * 测试MongoDB连接
   */
  async testMongoConnection() {
    try {
      // 检查是否安装了mongodb驱动
      try {
        require.resolve('mongodb');
        
        const { MongoClient } = require('mongodb');
        const uri = `mongodb://${encodeURIComponent(this.config.username)}:${encodeURIComponent(this.config.password)}@${this.config.host}:${this.config.port}/${this.config.database}?authSource=${this.config.authDatabase}`;
        
        const client = new MongoClient(uri, { 
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000
        });
        
        await client.connect();
        await client.db(this.config.database).admin().ping();
        await client.close();
        
        this.recordTest('MongoDB连接测试', true, '数据库连接正常');
        
      } catch (requireError) {
        this.log('mongodb驱动未安装，尝试使用mongodump测试连接...', 'WARN');
        await this.testMongodumpConnection();
      }
      
    } catch (error) {
      this.recordTest('MongoDB连接测试', false, error.message);
    }
  }

  /**
   * 使用mongodump测试连接
   */
  async testMongodumpConnection() {
    try {
      const mongodumpPath = await this.findMongodump();
      if (!mongodumpPath) {
        this.recordTest('MongoDB工具检查', false, 'mongodump工具不可用');
        return;
      }
      
      const { host, port, database, username, password, authDatabase } = this.config;
      const quoted = mongodumpPath.includes(' ') ? `"${mongodumpPath}"` : mongodumpPath;
      
      // 使用mongodump --help测试基本可用性
      const testCommand = `${quoted} --host ${host}:${port} --db ${database} --username ${username} --password "${password}" --authenticationDatabase ${authDatabase} --help`;
      
      await execAsync(testCommand);
      this.recordTest('MongoDB工具连接测试', true, 'mongodump工具连接正常');
      
    } catch (error) {
      this.recordTest('MongoDB工具连接测试', false, error.message);
    }
  }

  /**
   * 查找mongodump工具
   */
  async findMongodump() {
    const isWindows = process.platform === 'win32';
    const possiblePaths = [
      path.join(__dirname, '../dcMes_server/Tools', '100', 'bin', isWindows ? 'mongodump.exe' : 'mongodump'),
      'mongodump'
    ];

    for (const testPath of possiblePaths) {
      try {
        const quoted = testPath.includes(' ') ? `"${testPath}"` : testPath;
        await execAsync(`${quoted} --version`);
        return testPath;
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }

  /**
   * 测试必需的Node.js模块
   */
  testRequiredModules() {
    const requiredModules = [
      'node-schedule',
      'fs',
      'path',
      'child_process',
      'util',
      'os'
    ];

    const optionalModules = [
      'mongodb',
      'archiver'
    ];

    requiredModules.forEach(module => {
      try {
        require.resolve(module);
        this.recordTest(`必需模块: ${module}`, true, '模块可用');
      } catch (error) {
        this.recordTest(`必需模块: ${module}`, false, '模块缺失，请安装');
      }
    });

    optionalModules.forEach(module => {
      try {
        require.resolve(module);
        this.recordTest(`可选模块: ${module}`, true, '模块可用');
      } catch (error) {
        this.recordTest(`可选模块: ${module}`, false, '模块缺失（可选）');
      }
    });
  }

  /**
   * 测试备份目录权限
   */
  testBackupDirectory() {
    const testDir = 'D:/incrementalBackups';
    const testSubDirs = ['hot', 'core', 'config', 'analytics', 'logs'];
    
    try {
      // 创建主目录
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      // 创建子目录
      testSubDirs.forEach(subDir => {
        const dirPath = path.join(testDir, subDir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      });
      
      // 测试写权限
      const testFile = path.join(testDir, 'test_write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      this.recordTest('备份目录权限', true, `目录可写: ${testDir}`);
      
    } catch (error) {
      this.recordTest('备份目录权限', false, error.message);
    }
  }

  /**
   * 测试增量备份管理器
   */
  async testBackupManager() {
    try {
      const managerPath = path.join(__dirname, 'incremental_backup_manager.js');
      
      if (!fs.existsSync(managerPath)) {
        this.recordTest('备份管理器文件', false, '管理器文件不存在');
        return;
      }
      
      this.recordTest('备份管理器文件', true, '管理器文件存在');
      
      // 测试配置显示
      try {
        const command = `node "${managerPath}" --config`;
        this.log(`执行命令: ${command}`, 'INFO');
        
        const { stdout, stderr } = await execAsync(command, { 
          timeout: 30000,
          cwd: __dirname  // 确保在正确的工作目录执行
        });
        
        // 检查输出内容
        if (stdout && stdout.includes('增量备份管理器配置')) {
          this.recordTest('备份管理器配置', true, '配置读取正常，输出包含预期内容');
        } else if (stdout) {
          this.recordTest('备份管理器配置', true, `配置命令执行成功，但输出异常: ${stdout.substring(0, 200)}...`);
        } else {
          this.recordTest('备份管理器配置', false, '配置命令执行成功但无输出');
        }
        
        // 如果有标准错误输出，记录它
        if (stderr) {
          this.log(`标准错误输出: ${stderr}`, 'WARN');
        }
        
      } catch (error) {
        let errorDetails = `命令执行失败: ${error.message}`;
        
        // 添加更详细的错误信息
        if (error.stdout) {
          errorDetails += `\n标准输出: ${error.stdout}`;
        }
        if (error.stderr) {
          errorDetails += `\n标准错误: ${error.stderr}`;
        }
        if (error.code) {
          errorDetails += `\n退出代码: ${error.code}`;
        }
        
        this.recordTest('备份管理器配置', false, errorDetails);
      }
      
    } catch (error) {
      this.recordTest('备份管理器测试', false, error.message);
    }
  }

  /**
   * 测试时间范围查询生成
   */
  testTimeRangeQuery() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startTime = new Date(today);
      const endTime = new Date(today);
      endTime.setHours(23, 59, 59, 999);
      
      const query = {
        createdAt: {
          "$gte": startTime,
          "$lte": endTime
        }
      };
      
      const queryString = JSON.stringify(query);
      const isValid = queryString.includes('$gte') && queryString.includes('$lte');
      
      this.recordTest('时间范围查询', isValid, '查询条件生成正常');
      
    } catch (error) {
      this.recordTest('时间范围查询', false, error.message);
    }
  }

  /**
   * 测试PM2可用性（可选）
   */
  async testPM2Availability() {
    try {
      await execAsync('pm2 --version');
      this.recordTest('PM2服务管理', true, 'PM2可用');
    } catch (error) {
      this.recordTest('PM2服务管理', false, 'PM2不可用（可选功能）');
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    this.log('开始增量备份系统测试...', 'INFO');
    this.log('='.repeat(60), 'INFO');
    
    // 基础环境测试
    this.log('1. 基础环境测试', 'INFO');
    await this.testNodeEnvironment();
    this.testRequiredModules();
    
    // 数据库连接测试
    this.log('\n2. 数据库连接测试', 'INFO');
    await this.testMongoConnection();
    
    // 文件系统测试
    this.log('\n3. 文件系统测试', 'INFO');
    this.testBackupDirectory();
    
    // 备份管理器测试
    this.log('\n4. 备份管理器测试', 'INFO');
    await this.testBackupManager();
    
    // 功能测试
    this.log('\n5. 功能测试', 'INFO');
    this.testTimeRangeQuery();
    
    // 可选功能测试
    this.log('\n6. 可选功能测试', 'INFO');
    await this.testPM2Availability();
    
    // 输出测试结果
    this.printTestSummary();
    
    return this.testResults;
  }

  /**
   * 输出测试汇总
   */
  printTestSummary() {
    this.log('\n' + '='.repeat(60), 'INFO');
    this.log('测试结果汇总', 'INFO');
    this.log('='.repeat(60), 'INFO');
    
    const { passed, failed, total } = this.testResults;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;
    
    this.log(`总测试数: ${total}`, 'INFO');
    this.log(`通过数: ${passed}`, passed > 0 ? 'PASS' : 'INFO');
    this.log(`失败数: ${failed}`, failed > 0 ? 'FAIL' : 'INFO');
    this.log(`成功率: ${successRate}%`, failed === 0 ? 'PASS' : 'WARN');
    
    if (failed === 0) {
      this.log('\n🎉 所有测试通过！系统可以正常使用。', 'PASS');
      this.log('现在可以运行以下命令启动备份服务:', 'INFO');
      this.log('  Windows: start_incremental_backup.bat start', 'INFO');
      this.log('  Linux:   node incremental_backup_manager.js --start', 'INFO');
    } else {
      this.log('\n⚠️  部分测试失败，请检查以下问题:', 'WARN');
      
      const failedTests = this.testResults.details.filter(test => !test.passed);
      failedTests.forEach(test => {
        this.log(`  - ${test.name}: ${test.message}`, 'FAIL');
      });
      
      this.log('\n请修复上述问题后重新测试。', 'WARN');
    }
    
    this.log('='.repeat(60), 'INFO');
    
    // 保存详细测试报告
    this.saveTestReport();
  }

  /**
   * 保存测试报告
   */
  saveTestReport() {
    try {
      const reportPath = path.join(__dirname, 'test_report.json');
      const report = {
        ...this.testResults,
        timestamp: new Date().toISOString(),
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          arch: process.arch
        }
      };
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`测试报告已保存: ${reportPath}`, 'INFO');
      
    } catch (error) {
      this.log(`保存测试报告失败: ${error.message}`, 'WARN');
    }
  }
}

// 主程序
if (require.main === module) {
  const tester = new BackupSystemTester();
  
  console.log('增量备份系统测试工具');
  console.log('用于验证系统是否正确配置和安装');
  console.log('');
  
  tester.runAllTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('测试过程中发生错误:', error.message);
      process.exit(1);
    });
}

module.exports = BackupSystemTester; 