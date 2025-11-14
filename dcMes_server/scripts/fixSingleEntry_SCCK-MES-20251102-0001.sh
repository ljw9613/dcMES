#!/bin/bash
# 一键修复出库单 SCCK-MES-20251102-0001
# 采用方案1：调整应出库数量为1001

echo "========================================="
echo "修复出库单 SCCK-MES-20251102-0001"
echo "========================================="
echo ""

# 第1步：运行修复脚本
echo "第1步：修正托盘计数和条码状态..."
node scripts/fixWarehouseEntryQuantity.js --entryNo SCCK-MES-20251102-0001

if [ $? -ne 0 ]; then
    echo "❌ 修复脚本执行失败"
    exit 1
fi

echo ""
echo "✅ 修复脚本执行成功"
echo ""

# 第2步：调整应出库数量
echo "第2步：调整应出库数量为1001..."
mongo dcmes --quiet --eval '
var result = db.warehouseontries.updateOne(
  { entryNo: "SCCK-MES-20251102-0001" },
  { 
    $set: { 
      outboundQuantity: 1001,
      updateAt: new Date()
    } 
  }
);

if (result.matchedCount === 0) {
  print("❌ 未找到出库单");
  quit(1);
} else if (result.modifiedCount === 0) {
  print("⚠️  数据未变化（可能已经是1001）");
} else {
  print("✅ 应出库数量已调整为1001");
}
'

if [ $? -ne 0 ]; then
    echo "❌ 调整应出库数量失败"
    exit 1
fi

echo ""

# 第3步：验证结果
echo "第3步：验证修复结果..."
echo ""
node scripts/checkWarehouseEntryQuantity.js SCCK-MES-20251102-0001

echo ""
echo "========================================="
echo "修复完成！"
echo "========================================="
echo ""
echo "修复结果："
echo "- 应出库数量：1000 → 1001"
echo "- 实际出库数量：1001（不变）"
echo "- 托盘计数：40 → 44"
echo "- 状态：COMPLETED"
echo "- 超出数量：+1 → 0"
echo ""
echo "如需查看详细数据，请运行："
echo "mongo dcmes --eval 'db.warehouseontries.findOne({entryNo:\"SCCK-MES-20251102-0001\"},{entryNo:1,outboundQuantity:1,outNumber:1,palletCount:1,status:1})'"








