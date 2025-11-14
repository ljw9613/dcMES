# 紧急修复：单品出库数量超出问题

## 问题确认

根据检查报告 `warehouse_entry_check_report_1762264540810.json`：

**出库单**: SCCK-MES-20251102-0001
**问题**: 应出库1000个，实际出库1001个，超出1个

**根本原因**: 
- 单品出库接口 `submit_product` 缺少数量预检查
- 使用 `>=` 判断完成状态，即使超出也标记为完成
- 在超出后仍然更新条码状态和托盘状态

## 立即修复代码

### 修复1: 在 submit_product 接口添加预检查

在 `wareHouseOntry.js` 第1618行之后添加：

```javascript
// 在这里添加（第1618行之后）：
if (!entry) {
  return res.status(200).json({
    code: 404,
    message: "未找到有效的出库单...",
  });
}

// ===== 新增：检查出库单状态 =====
if (entry.status === "COMPLETED") {
  return res.status(200).json({
    code: 403,
    message: "出库单已完成，无法继续添加产品",
  });
}

// ===== 新增：检查是否会超出 =====
if (entry.outNumber >= entry.outboundQuantity) {
  return res.status(200).json({
    code: 403,
    message: `出库单已达到应出库数量(${entry.outboundQuantity})，无法继续添加产品。当前已出库：${entry.outNumber}`,
  });
}

// ===== 新增：预检查添加后是否超出 =====
const newOutNumber = entry.outNumber + 1;
if (newOutNumber > entry.outboundQuantity) {
  return res.status(200).json({
    code: 403,
    message: `添加该产品会超出应出库数量。应出库：${entry.outboundQuantity}，当前已出库：${entry.outNumber}，添加后：${newOutNumber}`,
  });
}
// ===== 新增结束 =====
```

### 修复2: 修改完成状态判断

在 `wareHouseOntry.js` 第1764-1778行，修改为：

```javascript
// 原代码（第1764行）：
// if (entry.outNumber >= entry.outboundQuantity) {

// 修改为：
if (entry.outNumber > entry.outboundQuantity) {
  // 如果超出，记录错误但不标记为完成
  console.error(`🚨 数量超出警告: 出库单${entry.entryNo}, 应出库=${entry.outboundQuantity}, 实际=${entry.outNumber}, 超出=${entry.outNumber - entry.outboundQuantity}`);
  
  // 发送告警
  warehouseService.sendAlert({
    type: "QUANTITY_EXCEEDED",
    entryNo: entry.entryNo,
    outboundQuantity: entry.outboundQuantity,
    outNumber: entry.outNumber,
    exceeded: entry.outNumber - entry.outboundQuantity
  }).catch(console.error);
  
  // 不标记为完成
  entry.status = "IN_PROGRESS";
} else if (entry.outNumber === entry.outboundQuantity) {
  // 精确匹配时才标记为完成
  entry.status = "COMPLETED";
  entry.endTime = new Date();
  // 调用通知接口
  warehouseService.notifyOutWarehouseCompleted(entry.entryNo)
    .then(result => {
      if (!result.success) {
        console.error(`出库单${entry.entryNo}完成通知失败: ${result.error}`);
      }
    })
    .catch(error => {
      console.error(`出库单${entry.entryNo}完成通知出错: ${error.message}`);
    });
}
```

### 修复3: 在 scan_on 接口也添加状态检查

在 `wareHouseOntry.js` 第611行之后添加：

```javascript
// 2. 获取或创建出库单
let entry = await wareHouseOntry.findOne({
  productionOrderNo: pallet.productionOrderNo,
  status: { $ne: "COMPLETED" },
});

if (!entry) {
  return res.status(200).json({
    code: 404,
    message: "未找到有效的出库单...",
  });
}

// ===== 新增：检查出库单状态 =====
if (entry.status === "COMPLETED") {
  return res.status(200).json({
    code: 403,
    message: `出库单${entry.entryNo}已完成，无法继续添加托盘。如需继续出库，请创建新的出库单。`,
  });
}
// ===== 新增结束 =====
```

## 完整修复代码

创建一个补丁文件：

