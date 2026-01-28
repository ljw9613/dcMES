#!/usr/bin/env node

/**
 * 还原模式行为示例和说明
 * 
 * 此文件演示不同还原模式如何处理相同数据的情况
 * 
 * @Author: 系统管理员
 * @Date: 2024
 */

console.log('🔍 MongoDB还原模式详解\n');

// 模拟现有数据库中的数据
const existingData = [
  { _id: "user001", name: "张三", age: 25, department: "开发部" },
  { _id: "user002", name: "李四", age: 30, department: "测试部" },
  { _id: "user003", name: "王五", age: 35, department: "产品部" }
];

// 模拟备份文件中的数据
const backupData = [
  { _id: "user001", name: "张三", age: 26, department: "架构部" },  // 相同_id，数据有变化
  { _id: "user002", name: "李四", age: 30, department: "测试部" },  // 相同_id，数据完全相同
  { _id: "user004", name: "赵六", age: 28, department: "运维部" }   // 新的_id
];

console.log('📊 原始数据库数据:');
existingData.forEach(user => {
  console.log(`  ${user._id}: ${user.name}, ${user.age}岁, ${user.department}`);
});

console.log('\n📦 备份文件中的数据:');
backupData.forEach(user => {
  console.log(`  ${user._id}: ${user.name}, ${user.age}岁, ${user.department}`);
});

console.log('\n' + '='.repeat(80));
console.log('🔄 不同还原模式的处理结果:');
console.log('='.repeat(80));

// 模式1: merge-skip (跳过重复)
console.log('\n1️⃣ merge-skip 模式 (默认推荐)');
console.log('   特点: 跳过相同_id的文档，只添加新的_id文档');
console.log('   MongoDB命令: mongorestore [无特殊参数]');
console.log('\n   还原后的结果:');
const mergeSkipResult = [
  { _id: "user001", name: "张三", age: 25, department: "开发部" },  // 保持原有数据，跳过备份数据
  { _id: "user002", name: "李四", age: 30, department: "测试部" },  // 保持原有数据，跳过备份数据
  { _id: "user003", name: "王五", age: 35, department: "产品部" },  // 保持原有数据
  { _id: "user004", name: "赵六", age: 28, department: "运维部" }   // 新增备份中的数据
];
mergeSkipResult.forEach(user => {
  const isNew = !existingData.find(u => u._id === user._id);
  const status = isNew ? '🆕 新增' : '🔒 保持原有';
  console.log(`     ${user._id}: ${user.name}, ${user.age}岁, ${user.department} ${status}`);
});

// 模式2: merge-upsert (更新重复)
console.log('\n2️⃣ merge-upsert 模式');
console.log('   特点: 更新相同_id的文档，添加新的_id文档');
console.log('   MongoDB命令: mongorestore --upsert');
console.log('\n   还原后的结果:');
const mergeUpsertResult = [
  { _id: "user001", name: "张三", age: 26, department: "架构部" },  // 更新为备份数据
  { _id: "user002", name: "李四", age: 30, department: "测试部" },  // 更新为备份数据
  { _id: "user003", name: "王五", age: 35, department: "产品部" },  // 保持原有数据（备份中无此ID）
  { _id: "user004", name: "赵六", age: 28, department: "运维部" }   // 新增备份中的数据
];
mergeUpsertResult.forEach(user => {
  const originalUser = existingData.find(u => u._id === user._id);
  let status;
  if (!originalUser) {
    status = '🆕 新增';
  } else if (JSON.stringify(originalUser) !== JSON.stringify(user)) {
    status = '🔄 已更新';
  } else {
    status = '✅ 无变化';
  }
  console.log(`     ${user._id}: ${user.name}, ${user.age}岁, ${user.department} ${status}`);
});

// 模式3: replace (完全替换)
console.log('\n3️⃣ replace 模式');
console.log('   特点: 清除所有原有数据，完全使用备份数据');
console.log('   MongoDB命令: mongorestore --drop');
console.log('\n   还原后的结果:');
backupData.forEach(user => {
  console.log(`     ${user._id}: ${user.name}, ${user.age}岁, ${user.department} 🔥 完全替换`);
});
console.log('   ⚠️  注意: user003 (王五) 的数据会丢失，因为备份中没有');

console.log('\n' + '='.repeat(80));
console.log('📋 使用建议:');
console.log('='.repeat(80));

console.log(`
🟢 merge-skip (推荐) - 适用场景:
   • 日常数据恢复
   • 添加缺失的数据
   • 保护现有数据不被覆盖
   • 安全性要求高的场景

🔵 merge-upsert - 适用场景:
   • 数据同步和更新
   • 修复数据不一致问题  
   • 需要用备份数据更新现有记录
   • 数据迁移和合并

🔴 replace - 适用场景:
   • 完全重建集合
   • 测试环境数据重置
   • 确定需要用备份数据完全替换现有数据
   • ⚠️ 生产环境慎用！
`);

console.log('\n🔧 使用示例:');
console.log('='.repeat(50));

console.log(`
# 1. 安全合并（跳过重复，推荐）
export RESTORE_MODE=merge-skip
node restore_manager.js --restore --file=backup.archive

# 2. 更新合并（更新重复数据）  
export RESTORE_MODE=merge-upsert
node restore_manager.js --restore --file=backup.archive

# 3. 完全替换（危险，需谨慎）
export RESTORE_MODE=replace
node restore_manager.js --restore --file=backup.archive

# 4. 试运行验证（强烈推荐先执行）
node restore_manager.js --restore --file=backup.archive --dry-run
`);

console.log('\n💡 重要提醒:');
console.log('='.repeat(50));
console.log(`
• 所有模式都会自动创建安全备份（除非禁用）
• 使用 --dry-run 可以预览操作结果
• merge-skip 是最安全的默认选择
• 生产环境操作前务必进行完整测试
• 监控日志确认操作结果
`);

console.log('\n' + '='.repeat(80));
console.log('🔍 如需了解更多，请查看 RESTORE_GUIDE.md');
console.log('='.repeat(80)); 