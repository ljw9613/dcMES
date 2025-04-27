/**
 * 此脚本用于修复warehouse_ontry表中的actualQuantity字段
 * 将所有actualQuantity为0但outNumber不为0的记录更新
 * 执行方法：
 * 1. 使用mongo shell: mongo dcMes update_warehouse_ontry.js
 * 2. 或在Node.js环境中执行此文件
 */

// MongoDB连接信息
const dbName = 'dcMes';
const collectionName = 'warehouse_ontries';

// 更新记录
db = db.getSiblingDB(dbName);

// 方法1：将所有actualQuantity为0的记录更新为其对应的outNumber值
const result1 = db[collectionName].updateMany(
  { actualQuantity: 0, outNumber: { $gt: 0 } },
  [{ $set: { actualQuantity: "$outNumber" } }]
);

print("更新结果 (方法1):");
print(`匹配的记录数: ${result1.matchedCount}`);
print(`修改的记录数: ${result1.modifiedCount}`);

// 方法2：确保所有记录的actualQuantity与outNumber一致
const result2 = db[collectionName].updateMany(
  { $expr: { $ne: ["$actualQuantity", "$outNumber"] } },
  [{ $set: { actualQuantity: "$outNumber" } }]
);

print("更新结果 (方法2):");
print(`匹配的记录数: ${result2.matchedCount}`);
print(`修改的记录数: ${result2.modifiedCount}`); 