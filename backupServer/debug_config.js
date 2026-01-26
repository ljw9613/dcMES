#!/usr/bin/env node

/**
 * 配置诊断脚本
 * 用于测试 incremental_backup_manager.js 的配置加载功能
 */

console.log('开始配置诊断...');

try {
  // 测试 config.js 加载
  console.log('1. 测试配置文件加载...');
  const config = require('./config');
  console.log('✓ config.js 加载成功');
  
  // 测试必需模块
  console.log('2. 测试必需模块...');
  const schedule = require('node-schedule');
  console.log('✓ node-schedule 模块可用');
  
  const fs = require('fs');
  const path = require('path');
  const { exec } = require('child_process');
  console.log('✓ 基础 Node.js 模块可用');
  
  // 测试配置结构
  console.log('3. 测试配置结构...');
  if (config.database) {
    console.log('✓ 数据库配置存在');
    console.log(`  - 主机: ${config.database.host}`);
    console.log(`  - 端口: ${config.database.port}`);
    console.log(`  - 数据库: ${config.database.database}`);
  } else {
    console.log('✗ 数据库配置缺失');
  }
  
  if (config.paths) {
    console.log('✓ 路径配置存在');
    console.log(`  - 备份路径: ${config.paths.backupPath}`);
  } else {
    console.log('✗ 路径配置缺失');
  }
  
  if (config.strategies) {
    console.log('✓ 备份策略配置存在');
    console.log(`  - 策略数量: ${Object.keys(config.strategies).length}`);
  } else {
    console.log('✗ 备份策略配置缺失');
  }
  
  // 测试备份管理器类的实例化
  console.log('4. 测试备份管理器实例化...');
  const IncrementalBackupManager = require('./incremental_backup_manager');
  const manager = new IncrementalBackupManager();
  console.log('✓ 备份管理器实例化成功');
  
  // 测试 showConfig 方法
  console.log('5. 测试 showConfig 方法...');
  manager.showConfig();
  console.log('✓ showConfig 方法执行成功');
  
  console.log('\n诊断完成！所有测试通过。');
  
} catch (error) {
  console.error('诊断过程中发生错误:');
  console.error('错误类型:', error.name);
  console.error('错误消息:', error.message);
  console.error('错误堆栈:', error.stack);
  
  process.exit(1);
} 