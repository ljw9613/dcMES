/**
 * MongoDB脚本：检查和清理PM2负载均衡环境下的重复条码数据
 * 
 * 注意：防重复索引已在 materialPalletizing.js 模型中定义，
 * 重启应用后会自动创建。本脚本主要用于：
 * 1. 检查现有重复数据
 * 2. 清理历史重复数据（可选）
 * 3. 验证索引状态
 * 
 * 执行前请备份数据库！
 */

// 1. 首先检查现有的重复数据
print("=== 检查现有重复条码 ===");
const duplicateBarcodes = db.materialPalletizings.aggregate([
  { $unwind: "$palletBarcodes" },
  { 
    $group: {
      _id: "$palletBarcodes.barcode",
      count: { $sum: 1 },
      pallets: { 
        $push: {
          palletCode: "$palletCode",
          scanTime: "$palletBarcodes.scanTime",
          status: "$status"
        }
      }
    }
  },
  { $match: { count: { $gt: 1 } } },
  { $sort: { count: -1 } }
]);

duplicateBarcodes.forEach(dup => {
  print(`重复条码: ${dup._id}, 出现次数: ${dup.count}`);
  dup.pallets.forEach(pallet => {
    print(`  托盘: ${pallet.palletCode}, 状态: ${pallet.status}, 扫描时间: ${pallet.scanTime}`);
  });
});

// 2. 检查重复的包装箱条码
print("\n=== 检查重复包装箱条码 ===");
const duplicateBoxBarcodes = db.materialPalletizings.aggregate([
  { $unwind: "$boxItems" },
  { 
    $group: {
      _id: "$boxItems.boxBarcode",
      count: { $sum: 1 },
      pallets: { 
        $push: {
          palletCode: "$palletCode",
          scanTime: "$boxItems.scanTime",
          status: "$status"
        }
      }
    }
  },
  { $match: { count: { $gt: 1 } } },
  { $sort: { count: -1 } }
]);

duplicateBoxBarcodes.forEach(dup => {
  print(`重复包装箱条码: ${dup._id}, 出现次数: ${dup.count}`);
  dup.pallets.forEach(pallet => {
    print(`  托盘: ${pallet.palletCode}, 状态: ${pallet.status}, 扫描时间: ${pallet.scanTime}`);
  });
});

// 3. 清理重复数据的函数（请根据实际情况决定是否执行）
function cleanupDuplicates() {
  print("\n=== 开始清理重复数据 ===");
  print("警告：此操作将删除重复的条码记录，请确保已备份数据！");
  
  // 获取所有重复的条码
  const duplicates = db.materialPalletizings.aggregate([
    { $unwind: "$palletBarcodes" },
    { 
      $group: {
        _id: "$palletBarcodes.barcode",
        docs: { 
          $push: {
            palletId: "$_id",
            palletCode: "$palletCode",
            scanTime: "$palletBarcodes.scanTime",
            status: "$status"
          }
        },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);
  
  duplicates.forEach(dup => {
    const docs = dup.docs.sort((a, b) => new Date(a.scanTime) - new Date(b.scanTime));
    const keepDoc = docs[0]; // 保留最早的记录
    const removeList = docs.slice(1); // 删除其余记录
    
    print(`处理条码 ${dup._id}:`);
    print(`  保留: 托盘 ${keepDoc.palletCode} (${keepDoc.scanTime})`);
    
    removeList.forEach(doc => {
      print(`  删除: 托盘 ${doc.palletCode} (${doc.scanTime})`);
      
      // 从托盘中移除重复的条码记录
      db.materialPalletizings.updateOne(
        { _id: doc.palletId },
        { 
          $pull: { 
            palletBarcodes: { barcode: dup._id }
          }
        }
      );
      
      // 重新计算条码数量
      const pallet = db.materialPalletizings.findOne({ _id: doc.palletId });
      if (pallet) {
        db.materialPalletizings.updateOne(
          { _id: doc.palletId },
          { 
            $set: { 
              barcodeCount: pallet.palletBarcodes.length - 1
            }
          }
        );
      }
    });
  });
}

// 4. 检查索引状态
print("\n=== 检查索引状态 ===");
print("注意：防重复索引已在模型中定义，重启应用后会自动创建");

// 检查现有索引
const indexes = db.materialPalletizings.getIndexes();
print("\n当前集合索引:");
indexes.forEach(index => {
  print(`- ${index.name}: ${JSON.stringify(index.key)}`);
  if (index.unique) {
    print(`  (唯一索引)`);
  }
  if (index.partialFilterExpression) {
    print(`  过滤条件: ${JSON.stringify(index.partialFilterExpression)}`);
  }
});

// 检查关键的防重复索引是否存在
const hasUniqueBarcode = indexes.some(idx => idx.name === "unique_barcode_in_active_pallets");
const hasUniqueBoxBarcode = indexes.some(idx => idx.name === "unique_box_barcode_in_active_pallets");

print("\n防重复索引状态:");
print(`✓ 产品条码唯一索引: ${hasUniqueBarcode ? "已存在" : "未创建（重启应用后自动创建）"}`);
print(`✓ 包装箱条码唯一索引: ${hasUniqueBoxBarcode ? "已存在" : "未创建（重启应用后自动创建）"}`);

if (!hasUniqueBarcode || !hasUniqueBoxBarcode) {
  print("\n建议：重启应用以创建模型中定义的索引");
}

// 5. 检查其他推荐索引的状态
print("\n=== 检查其他索引状态 ===");

const recommendedIndexes = [
  { name: "palletCode_1", keys: { "palletCode": 1 } },
  { name: "palletBarcodes.barcode_1", keys: { "palletBarcodes.barcode": 1 } },
  { name: "status_1", keys: { "status": 1 } },
  { name: "createAt_-1", keys: { "createAt": -1 } }
];

recommendedIndexes.forEach(recommended => {
  const exists = indexes.some(idx => idx.name === recommended.name);
  print(`${exists ? "✓" : "✗"} ${recommended.name}: ${exists ? "已存在" : "缺失"}`);
});

print("\n=== 脚本执行完成 ===");
print("注意事项：");
print("1. 如需清理重复数据，请手动调用 cleanupDuplicates() 函数");
print("2. 建议在业务低峰期执行清理操作");
print("3. 执行前务必备份数据库");
print("4. 防重复索引已在模型中定义，重启应用后自动创建");
print("5. 监控应用日志，确保索引创建成功且不影响现有业务");

// 取消注释下面这行来执行清理（请谨慎操作）
// cleanupDuplicates(); 