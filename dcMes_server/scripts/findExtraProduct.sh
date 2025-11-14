#!/bin/bash
# 查找多余的产品条码
# 使用 MongoDB 命令直接查询

echo "========================================="
echo "查找多余的产品条码"
echo "========================================="
echo ""

# 1. 查询托盘 YDC-SN-1761614440131 在出库单中的条码
echo "第1步：查询出库单中托盘 YDC-SN-1761614440131 的条码..."
echo ""

mongo dcmes --quiet --eval '
var entry = db.warehouseontries.findOne(
  { entryNo: "SCCK-MES-20251102-0001" }
);

if (!entry) {
  print("❌ 未找到出库单");
  quit(1);
}

// 找到托盘项
var palletItem = null;
for (var i = 0; i < entry.entryItems.length; i++) {
  if (entry.entryItems[i].palletCode === "YDC-SN-1761614440131") {
    palletItem = entry.entryItems[i];
    break;
  }
}

if (!palletItem) {
  print("❌ 未找到托盘 YDC-SN-1761614440131 在出库单中");
  quit(1);
}

print("✅ 出库单中的条码数量: " + (palletItem.palletBarcodes ? palletItem.palletBarcodes.length : 0));
print("");

if (palletItem.palletBarcodes && palletItem.palletBarcodes.length > 0) {
  print("出库单中记录的条码（共" + palletItem.palletBarcodes.length + "个）:");
  var entryBarcodes = [];
  palletItem.palletBarcodes.forEach(function(b) {
    entryBarcodes.push(b.barcode);
    print("  - " + b.barcode);
  });
  
  // 将条码数组保存到临时集合
  db.temp_entry_barcodes.drop();
  db.temp_entry_barcodes.insertOne({
    palletCode: "YDC-SN-1761614440131",
    barcodes: entryBarcodes
  });
}
'

if [ $? -ne 0 ]; then
    echo "查询出库单失败"
    exit 1
fi

echo ""
echo "----------------------------------------"
echo ""

# 2. 查询托盘数据库中的所有条码
echo "第2步：查询托盘数据库中的所有条码..."
echo ""

mongo dcmes --quiet --eval '
var pallet = db.materialpalletizings.findOne(
  { palletCode: "YDC-SN-1761614440131" }
);

if (!pallet) {
  print("❌ 未找到托盘 YDC-SN-1761614440131");
  quit(1);
}

print("✅ 托盘中的条码总数: " + pallet.palletBarcodes.length);
print("");

// 统计已出库的条码
var outWarehouseBarcodes = [];
pallet.palletBarcodes.forEach(function(b) {
  if (b.outWarehouseStatus === "COMPLETED") {
    outWarehouseBarcodes.push(b);
  }
});

print("✅ 托盘中已出库的条码数: " + outWarehouseBarcodes.length);
print("✅ 托盘状态: " + pallet.inWarehouseStatus);
print("");

// 保存托盘条码到临时集合
db.temp_pallet_barcodes.drop();
db.temp_pallet_barcodes.insertOne({
  palletCode: "YDC-SN-1761614440131",
  allBarcodes: pallet.palletBarcodes.map(function(b) { return b.barcode; }),
  outWarehouseBarcodes: outWarehouseBarcodes.map(function(b) { 
    return {
      barcode: b.barcode,
      barcodeType: b.barcodeType,
      outWarehouseStatus: b.outWarehouseStatus,
      outWarehouseTime: b.outWarehouseTime,
      outWarehouseBy: b.outWarehouseBy
    };
  })
});
'

if [ $? -ne 0 ]; then
    echo "查询托盘失败"
    exit 1
fi

echo ""
echo "----------------------------------------"
echo ""

# 3. 对比找出多余的条码
echo "第3步：对比分析，找出多余的条码..."
echo ""

mongo dcmes --quiet --eval '
var entryData = db.temp_entry_barcodes.findOne({ palletCode: "YDC-SN-1761614440131" });
var palletData = db.temp_pallet_barcodes.findOne({ palletCode: "YDC-SN-1761614440131" });

if (!entryData || !palletData) {
  print("❌ 缺少临时数据");
  quit(1);
}

var entryBarcodes = entryData.barcodes || [];
var palletOutBarcodes = palletData.outWarehouseBarcodes || [];

print("========================================");
print("分析结果");
print("========================================");
print("");
print("托盘编号: YDC-SN-1761614440131");
print("出库单中记录: " + entryBarcodes.length + " 个产品");
print("托盘中已出库: " + palletOutBarcodes.length + " 个产品");
print("差异: " + (palletOutBarcodes.length - entryBarcodes.length) + " 个产品");
print("");

// 找出在托盘中已出库但不在出库单中的条码
var extraBarcodes = [];
palletOutBarcodes.forEach(function(palletBarcode) {
  var found = false;
  for (var i = 0; i < entryBarcodes.length; i++) {
    if (entryBarcodes[i] === palletBarcode.barcode) {
      found = true;
      break;
    }
  }
  if (!found) {
    extraBarcodes.push(palletBarcode);
  }
});

if (extraBarcodes.length > 0) {
  print("🎯 找到多余的产品条码：");
  print("");
  extraBarcodes.forEach(function(barcode, index) {
    print((index + 1) + ". 条码: " + barcode.barcode);
    print("   类型: " + barcode.barcodeType);
    print("   出库状态: " + (barcode.outWarehouseStatus || "PENDING"));
    if (barcode.outWarehouseTime) {
      print("   出库时间: " + new Date(barcode.outWarehouseTime).toLocaleString("zh-CN"));
    }
    if (barcode.outWarehouseBy) {
      print("   操作人: " + barcode.outWarehouseBy);
    }
    print("");
  });
  
  // 保存结果
  db.extra_product_result.drop();
  db.extra_product_result.insertOne({
    findTime: new Date(),
    entryNo: "SCCK-MES-20251102-0001",
    palletCode: "YDC-SN-1761614440131",
    extraBarcodes: extraBarcodes
  });
  
  print("========================================");
  print("修复建议");
  print("========================================");
  print("");
  print("方案1: 调整应出库数量（推荐）");
  print("  将应出库数量从 1000 调整为 1001");
  print("  命令:");
  print("  mongo dcmes --eval '\''db.warehouseontries.updateOne({entryNo:\"SCCK-MES-20251102-0001\"},{$set:{outboundQuantity:1001,updateAt:new Date()}})'\''");
  print("");
  
  print("方案2: 删除多余的产品（如果确实不应该出库）");
  extraBarcodes.forEach(function(barcode) {
    print("  删除条码: " + barcode.barcode);
    print("");
    print("  步骤1: 从出库单中删除");
    print("  mongo dcmes --eval '\''db.warehouseontries.updateOne({entryNo:\"SCCK-MES-20251102-0001\",\"entryItems.palletCode\":\"YDC-SN-1761614440131\"},{$pull:{\"entryItems.$.palletBarcodes\":{barcode:\"" + barcode.barcode + "\"}}})'\''");
    print("");
    print("  步骤2: 恢复托盘中条码的状态");
    print("  mongo dcmes --eval '\''db.materialpalletizings.updateOne({palletCode:\"YDC-SN-1761614440131\"},{$set:{\"palletBarcodes.$[elem].outWarehouseStatus\":\"PENDING\",\"palletBarcodes.$[elem].outWarehouseTime\":null,\"palletBarcodes.$[elem].outWarehouseBy\":null}},{arrayFilters:[{\"elem.barcode\":\"" + barcode.barcode + "\"}]})'\''");
    print("");
    print("  步骤3: 更新托盘状态");
    print("  mongo dcmes --eval '\''db.materialpalletizings.updateOne({palletCode:\"YDC-SN-1761614440131\"},{$set:{inWarehouseStatus:\"PART_OUT_WAREHOUSE\",updateAt:new Date()}})'\''");
    print("");
  });
} else {
  print("✅ 未找到多余的条码（可能数据已一致）");
}

// 清理临时集合
db.temp_entry_barcodes.drop();
db.temp_pallet_barcodes.drop();
'

echo ""
echo "========================================="
echo "查询完成"
echo "========================================="








