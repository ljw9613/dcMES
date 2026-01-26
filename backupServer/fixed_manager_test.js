#!/usr/bin/env node

/**
 * 简化的增量备份管理器测试
 */

console.log('='.repeat(60));
console.log('增量备份系统修复版本测试');
console.log('='.repeat(60));

async function testManager() {
  let hasErrors = false;

  try {
    console.log('\n1. 测试配置加载...');
    const config = require('./config');
    console.log('✅ 配置文件加载成功');
    
    if (config.strategies) {
      const strategyCount = Object.keys(config.strategies).length;
      console.log(`✅ 策略配置加载成功，共 ${strategyCount} 个策略`);
    } else {
      console.log('❌ 策略配置缺失');
      hasErrors = true;
    }

  } catch (error) {
    console.log('❌ 配置加载失败:', error.message);
    hasErrors = true;
  }

  try {
    console.log('\n2. 测试管理器实例化...');
    const IncrementalBackupManager = require('./incremental_backup_manager');
    const manager = new IncrementalBackupManager();
    console.log('✅ 管理器实例化成功');

    console.log('\n3. 测试配置显示...');
    manager.showConfig();
    console.log('✅ 配置显示功能正常');

  } catch (error) {
    console.log('❌ 管理器测试失败:', error.message);
    console.error('详细错误:', error.stack);
    hasErrors = true;
  }

  try {
    console.log('\n4. 测试必需模块...');
    require('node-schedule');
    console.log('✅ node-schedule 模块可用');
    
    require('fs');
    require('path');
    require('child_process');
    console.log('✅ Node.js 核心模块可用');

  } catch (error) {
    console.log('❌ 模块检查失败:', error.message);
    hasErrors = true;
  }

  console.log('\n' + '='.repeat(60));
  if (hasErrors) {
    console.log('❌ 测试完成，发现错误！请检查上面的错误信息。');
    console.log('='.repeat(60));
    return false;
  } else {
    console.log('✅ 所有测试通过！系统配置正确。');
    console.log('\n可以安全运行以下命令:');
    console.log('  node incremental_backup_manager.js --config   # 查看配置');
    console.log('  node incremental_backup_manager.js --start    # 启动服务');
    console.log('  node incremental_backup_manager.js --once     # 执行一次备份');
    console.log('='.repeat(60));
    return true;
  }
}

// 运行测试
testManager().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试过程中发生未预期的错误:', error);
  process.exit(1);
}); 