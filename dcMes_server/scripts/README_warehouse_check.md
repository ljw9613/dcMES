# 出库单数量检查工具

## 问题分析

根据代码分析，出库数量超出的可能原因：

### 1. 并发操作问题（概率较高）
**位置**: `wareHouseOntry.js` 第948-971行

虽然使用了MongoDB原子操作，但在以下情况仍可能出现问题：
- 多个用户同时扫描不同托盘到同一出库单
- 预检查（第883行）和实际添加（第948行）之间存在时间差
- 在这个时间差内，其他操作可能已经添加了托盘

**解决方案**：
- 使用更严格的事务控制
- 在原子操作中加入数量验证条件

### 2. 部分出库逻辑问题（概率中等）
**位置**: `wareHouseOntry.js` 第682-816行

当托盘处于 `PART_OUT_WAREHOUSE` 状态时：
- 如果重复扫描同一托盘，可能会重复添加剩余条码
- 条码状态检查不够严格，可能导致已出库条码再次被添加

**表现**：
- 同一托盘的条码被多次计入出库数量
- 托盘中的条码 `outWarehouseStatus` 可能显示 `PENDING` 而不是 `COMPLETED`

### 3. 单一产品出库接口缺少预检查（概率较低）
**位置**: `wareHouseOntry.js` 第1252-1806行

`submit_product` 接口的问题：
- 没有预先检查添加产品后是否会超出应出库数量
- 只在最后更新时才计算总数量
- 在高并发场景下可能导致超出

### 4. 回滚机制的时序问题（概率较低）
**位置**: `wareHouseOntry.js` 第997-1008行

虽然有回滚机制，但：
- 回滚发生在托盘已添加之后
- 如果在回滚前系统崩溃或网络中断，可能导致数据不一致

### 5. 托盘中条码状态不一致
**表现**：
- order.json 中的条码状态为 `PENDING`，但实际已被计入出库数量
- 这可能是因为状态更新失败或不完整

## 使用方法

### 1. 检查特定出库单

```bash
# 按出库单号检查
node scripts/checkWarehouseEntryQuantity.js --entryNo SCCK-MES-20251102-0001

# 或者直接使用出库单号（默认行为）
node scripts/checkWarehouseEntryQuantity.js SCCK-MES-20251102-0001

# 按出库单ID检查
node scripts/checkWarehouseEntryQuantity.js --entryId 6906baeb95cbf563ec914213
```

### 2. 检查所有有问题的出库单

```bash
# 检查所有进行中和已完成的出库单（默认）
node scripts/checkWarehouseEntryQuantity.js

# 只检查超出应出库数量的出库单
node scripts/checkWarehouseEntryQuantity.js --exceeded

# 检查所有出库单
node scripts/checkWarehouseEntryQuantity.js --all
```

### 3. 环境变量配置

如果数据库需要认证，可以设置环境变量：

```bash
export DB_HOST=localhost
export DB_PORT=27017
export DB_NAME=dcmes
export DB_USER=your_username
export DB_PASS=your_password

node scripts/checkWarehouseEntryQuantity.js
```

## 检查项目

脚本会检查以下内容：

1. ✅ **数量超出检查**: 出库数量是否超过应出库数量
2. ✅ **数量一致性**: outNumber 和 actualQuantity 是否一致
3. ✅ **托盘计数**: 托盘计数是否与实际托盘数一致
4. ✅ **重复托盘**: 是否存在重复的托盘编号
5. ✅ **托盘存在性**: 托盘是否在数据库中存在
6. ✅ **条码完整性**: 出库单中的条码是否在托盘中存在
7. ✅ **条码状态**: 托盘中条码的出库状态是否正确
8. ✅ **数量计算**: 重新计算的数量是否与记录一致

## 输出报告

脚本会生成两种输出：

### 1. 控制台输出
- 实时显示检查进度
- 显示发现的问题
- 提供修复建议

### 2. JSON报告文件
文件名格式: `warehouse_entry_check_report_[时间戳].json`

包含内容：
- 检查时间
- 检查的出库单总数
- 有问题的出库单数量
- 详细的问题列表
- 每个托盘的详细信息

## 修复方法

### 方法1: 使用API接口修复

根据检查结果，使用对应的API接口：

#### 清理重复托盘
```bash
curl -X POST http://localhost:3000/api/v1/warehouse_entry/clean_duplicate_pallets \
  -H "Content-Type: application/json" \
  -d '{"entryId": "6906baeb95cbf563ec914213"}'
```

#### 修复数量计算
```bash
curl -X POST http://localhost:3000/api/v1/warehouse_entry/fix_quantities \
  -H "Content-Type: application/json" \
  -d '{"entryId": "6906baeb95cbf563ec914213"}'
```

### 方法2: 使用修复脚本（批量）

使用配套的修复脚本进行批量修复：

```bash
node scripts/fixWarehouseEntryQuantity.js --report warehouse_entry_check_report_xxxxx.json
```

### 方法3: 手动修复（谨慎使用）

如果API修复无效，可以使用MongoDB命令手动修复：

```javascript
// 1. 连接到MongoDB
use dcmes

// 2. 查看出库单详情
db.warehouseontries.findOne({ entryNo: "SCCK-MES-20251102-0001" })

// 3. 手动调整应出库数量（如果超出1个且实际需求确实如此）
db.warehouseontries.updateOne(
  { entryNo: "SCCK-MES-20251102-0001" },
  { 
    $set: { 
      outboundQuantity: 1001,  // 调整为实际数量
      updateAt: new Date() 
    } 
  }
)

// 或者删除多余的托盘项（如果是重复或错误扫描）
// 注意：需要同时恢复托盘中条码的出库状态
```

## 针对当前问题的分析

根据 order.json 文件：
- 出库单号: `SCCK-MES-20251102-0001`
- 应出库数量: `1000`
- 实际出库数量: `1001`
- 超出: `1` 个

可能的原因：
1. 托盘中的某些条码被重复计数
2. 存在重复的托盘项（虽然 palletCount 显示40个）
3. 某个托盘的条码数量计算错误

**注意**: order.json 中的条码状态显示为 `PENDING`，这不正常！
如果这些条码已经在出库单中，状态应该是 `COMPLETED`。
这说明可能存在：
- 条码状态更新失败
- 数据不一致问题

## 预防措施

为了防止将来再次出现此问题，建议：

### 1. 代码层面改进

在 `wareHouseOntry.js` 的 `scan_on` 接口中：

```javascript
// 在原子操作中加入数量验证（第948行附近）
const updateResult = await wareHouseOntry.updateOne(
  {
    _id: entry._id,
    "entryItems.palletCode": { $ne: palletCode },
    // 新增：确保不会超出数量
    $expr: {
      $lte: [
        { $add: [
          "$outNumber",
          unOutBarcodes.length  // 即将添加的数量
        ]},
        "$outboundQuantity"  // 不能超过应出库数量
      ]
    }
  },
  {
    $push: { entryItems: palletItem },
    $set: updateFields
  }
);

// 检查更新结果
if (updateResult.matchedCount === 0) {
  return res.status(200).json({
    code: 404,
    message: "无法添加托盘：托盘已存在、出库单不存在或会导致数量超出",
  });
}
```

### 2. 添加后验证

在每次添加托盘后，立即验证数量：

```javascript
// 重新获取并验证
const verifyEntry = await wareHouseOntry.findById(entry._id);
const actualQuantity = calculateActualQuantity(verifyEntry.entryItems);

if (actualQuantity > verifyEntry.outboundQuantity) {
  // 立即回滚
  await wareHouseOntry.updateOne(
    { _id: verifyEntry._id },
    { $pull: { entryItems: { palletCode: palletCode } } }
  );
  
  // 记录错误日志
  console.error(`数量超出警告: 出库单${verifyEntry.entryNo}，尝试添加托盘${palletCode}导致超出`);
  
  return res.status(200).json({
    code: 404,
    message: "添加失败：会导致出库数量超出限制",
  });
}
```

### 3. 定期检查任务

设置定时任务，每天自动检查：

```javascript
// 在 server.js 中添加
const schedule = require('node-schedule');

// 每天凌晨2点检查
schedule.scheduleJob('0 2 * * *', async () => {
  console.log('开始定期检查出库单数量...');
  // 调用检查逻辑
});
```

## 常见问题

### Q1: 检查脚本运行很慢？
**A**: 如果出库单数量很多，可以：
- 使用 `--entryNo` 只检查特定出库单
- 使用 `--exceeded` 只检查有问题的
- 在数据库空闲时运行

### Q2: 修复后还是有问题？
**A**: 可能需要：
- 检查托盘数据库中的原始数据
- 查看是否有并发操作
- 联系数据库管理员进行深入分析

### Q3: 能直接删除多余的托盘吗？
**A**: 不建议直接删除，因为：
- 需要同时恢复托盘中条码的状态
- 可能影响其他关联数据
- 建议使用 `delete_entry` 接口删除整个出库单后重新扫描

## 联系支持

如果遇到无法解决的问题，请联系：
- 开发者邮箱: 1798245303@qq.com
- 提供检查报告JSON文件以便分析

