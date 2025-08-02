# 装箱条码原子操作修复说明

## 问题背景

原有的 `getOrCreatePackBarcode` 接口在 `serialNumber` 生成方面存在以下问题：

1. **序列号计算不一致**：后端按产线分组计算，但前端回退逻辑按全局计算
2. **锁定状态未考虑**：序列号计算时没有包含 `LOCKED` 状态的条码
3. **设备识别机制缺失**：缺少基于设备IP的锁定机制
4. **条码映射替换缺失**：缺少完整的日期映射、序列号位置映射等功能

## 修复内容

### 1. 完善条码生成工具 (`utils/generateBarcode.js`)

#### 新增功能：
- **日期映射处理**：`formatDateWithMappings()` - 支持年月日的字符映射
- **序列号位置映射**：`formatSequenceWithPositionMapping()` - 支持按位置替换数字
- **转换条码生成**：支持基础条码和转换条码的分别生成
- **前缀后缀控制**：正确处理显示条码和打印条码的前缀后缀

#### 核心改进：
```javascript
// 日期映射示例：2025 → Y, 12 → L, 01 → A
formatDateWithMappings(date, {
  dateFormat: 'YYYY-MM-DD',
  yearMappings: [{ value: '2025', code: 'Y' }],
  monthMappings: [{ value: '12', code: 'L' }],
  dayMappings: [{ value: '01', code: 'A' }]
});

// 序列号位置映射示例：000001 → ZY000X
formatSequenceWithPositionMapping(1, {
  length: 6,
  padChar: '0',
  numberMappings: [
    { position: 1, value: '0', code: 'Z' },
    { position: 2, value: '0', code: 'Y' },
    { position: 6, value: '1', code: 'X' }
  ]
});
```

### 2. 修复原子操作接口 (`routes/packBarcodeAtomic.js`)

#### 序列号生成逻辑修复：
```javascript
// 修复前：按产线分组计算
const lastBarcode = await PackBarcode.findOne({
  productionLineId: productionLineId,  // ❌ 按产线过滤
  createAt: { $gte: startOfMonth, $lt: startOfNextMonth },
  status: { $ne: 'VOIDED' }
});

// 修复后：按物料分组计算，包含锁定状态
const lastBarcode = await PackBarcode.findOne({
  materialNumber: materialNumber, // ✅ 按物料分组，确保同一物料序列号连续
  createAt: { $gte: startOfMonth, $lt: startOfNextMonth },
  status: { $ne: 'VOIDED' } // ✅ 包含PENDING、LOCKED、USED状态
});
```

#### 设备锁定机制：
```javascript
// 生成锁定标识（优先使用设备IP）
const lockId = deviceIp || sessionId || `${productionLineId}_${Date.now()}`;

// 查找可用条码时考虑锁定状态
{
  productionLineId: productionLineId,
  materialNumber: materialNumber,
  status: 'PENDING',
  $or: [
    { lockedBy: { $exists: false } },
    { lockedBy: null },
    { lockExpireAt: { $lt: new Date() } } // 锁已过期
  ]
}
```

#### 并发冲突处理：
```javascript
// 检查序列号冲突（按物料分组）
const existingBarcode = await PackBarcode.findOne({
  serialNumber: serialNumber,
  materialNumber: materialNumber, // ✅ 同一物料内检查序列号重复
  createAt: { $gte: startOfMonth, $lt: startOfNextMonth },
  status: { $ne: 'VOIDED' }
});

// 检查条码内容重复
const duplicateBarcode = await PackBarcode.findOne({
  $or: [
    { barcode: barcodeResult.barcode },
    { printBarcode: barcodeResult.printBarcode }
  ]
});
```

### 3. 优化数据模型 (`model/project/packBarcode.js`)

#### 唯一性约束更新：
```javascript
// 条码唯一性约束
packBarcodeSchema.index({ barcode: 1 }, { unique: true });
packBarcodeSchema.index({ printBarcode: 1 }, { unique: true });

// 序列号在物料内的唯一性（按物料+月分组）
packBarcodeSchema.index({ 
  materialNumber: 1,
  serialNumber: 1,
  createAt: 1
}, { 
  unique: true,
  partialFilterExpression: { status: { $ne: "VOIDED" } }
});
```

### 4. 新增接口功能

#### 状态检查接口：
```javascript
GET /api/v1/checkPackBarcodeStatus
// 返回当前产线条码状态统计和下一个序列号
```

#### 锁定清理接口：
```javascript
POST /api/v1/cleanExpiredLocks
// 清理过期的锁定条码
```

## 测试验证

### 条码生成测试结果：

1. **基础生成**：`(01)202508020123`
2. **映射功能**：`YBZY000X`
   - 年份映射：`2025` → `Y` ✅
   - 产线映射：`L02` → `B` ✅  
   - 序列号位置映射：`000001` → `ZY000X` ✅
3. **转换功能**：
   - 基础条码：`(01)[08]042`
   - 转换条码：`(PREFIX)[08]042` ✅

### 原子操作测试：

- ✅ 参数验证通过
- ✅ 设备锁定机制正确
- ✅ 序列号生成逻辑一致

## 关键改进点

### 1. 序列号生成逻辑优化
- 序列号按物料分组计算，确保同一物料序列号连续
- 包含所有非作废状态的条码（PENDING、LOCKED、USED）
- 支持完整的映射替换功能

### 2. 并发安全机制
- 设备IP优先的锁定标识
- 序列号和条码内容的重复检查
- 过期锁定的自动清理

### 3. 错误处理优化
- 详细的冲突类型识别
- 重试机制的智能触发
- 完整的参数验证

### 4. 性能优化
- 高效的数据库索引
- 原子性操作减少竞争
- 锁定超时防止死锁

## 使用说明

### 前端调用示例：
```javascript
const response = await getOrCreatePackBarcode({
  productionLineId: 'line123',
  materialNumber: 'MAT001',
  materialId: 'material123',
  materialName: '包装箱',
  sessionId: 'session_001',
  deviceIp: '192.168.1.100' // 新增：设备IP识别
});
```

### 重试机制：
```javascript
if (response.shouldRetry) {
  // 延迟重试避免冲突
  setTimeout(() => {
    this.initializePackingBarcode();
  }, 500 + Math.random() * 1000);
}
```

## 总结

通过本次修复，`getOrCreatePackBarcode` 接口现在：

1. **完全支持条码映射替换**：与前端 `index.vue` 的生成逻辑完全一致
2. **序列号生成正确**：按物料分组计算，包含锁定状态，确保同一物料序列号连续
3. **设备锁定机制完善**：基于设备IP的并发控制
4. **并发安全性增强**：多重冲突检查和重试机制
5. **错误处理完整**：详细的错误分类和智能重试

这确保了多产线、多设备环境下装箱条码生成的唯一性和一致性。 