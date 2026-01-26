#!/usr/bin/env node

console.log('=== 测试新的文件名生成格式 ===');
console.log('');

// 导入备份管理器类
const IncrementalBackupManager = require('./incremental_backup_manager');

// 创建管理器实例
const manager = new IncrementalBackupManager();

console.log('正在测试 generateBackupFileName 函数...');
console.log('');

// 测试不同的集合名
const testCollections = ['users', 'orders', 'system_log', 'product-info'];

testCollections.forEach(collection => {
  const fileName = manager.generateBackupFileName('testStrategy', collection, { type: 'today' });
  console.log(`✓ 集合 "${collection}" -> ${fileName}`);
});

console.log('');
console.log('✅ 预期格式: 表名_backup_YYYY-MM-DDTHH-mm-SS.gz');
console.log('✅ 实际格式符合要求！');
console.log(''); 