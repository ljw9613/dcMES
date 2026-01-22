/**
 * 此脚本用于修复warehouse_ontry表中的actualQuantity字段
 * 将所有actualQuantity为0但outNumber不为0的记录更新
 * 执行方法：
 * node update_warehouse_ontry_node.js
 */

const mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/dcMes', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB连接成功');
  updateRecords();
}).catch(err => {
  console.error('MongoDB连接失败:', err);
});

async function updateRecords() {
  try {
    // 获取warehouse_ontry集合
    const db = mongoose.connection.db;
    const collection = db.collection('warehouse_ontries');
    
    // 更新方法1：将所有actualQuantity为0但outNumber不为0的记录更新
    const result1 = await collection.updateMany(
      { actualQuantity: 0, outNumber: { $gt: 0 } },
      [{ $set: { actualQuantity: "$outNumber" } }]
    );
    
    console.log('更新结果 (方法1):');
    console.log(`匹配的记录数: ${result1.matchedCount}`);
    console.log(`修改的记录数: ${result1.modifiedCount}`);
    
    // 更新方法2：确保所有记录的actualQuantity与outNumber一致
    const result2 = await collection.updateMany(
      { $expr: { $ne: ["$actualQuantity", "$outNumber"] } },
      [{ $set: { actualQuantity: "$outNumber" } }]
    );
    
    console.log('更新结果 (方法2):');
    console.log(`匹配的记录数: ${result2.matchedCount}`);
    console.log(`修改的记录数: ${result2.modifiedCount}`);
    
    console.log('更新完成');
    mongoose.connection.close();
  } catch (error) {
    console.error('更新失败:', error);
    mongoose.connection.close();
  }
} 