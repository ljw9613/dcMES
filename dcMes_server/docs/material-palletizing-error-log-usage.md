# 托盘错误日志系统使用说明

## 概述

托盘错误日志系统是为了解决"产品条码进度100%但没有正常录入托盘"等问题而建立的完整错误跟踪和调试系统。

## 功能特性

### 1. 自动错误记录
- 工序处理失败
- 托盘保存失败
- 重复条码检测
- 验证失败
- 并发冲突
- 回滚失败
- 原子操作失败

### 2. 详细错误信息
- 错误类型和操作类型
- 完整的错误堆栈
- 相关的条码、托盘、产线信息
- 上下文数据（子物料扫描、托盘数据快照等）
- 回滚状态记录

### 3. 查询和统计
- 多维度查询（时间、产线、错误类型等）
- 统计报表（解决率、错误趋势等）
- 快速定位问题条码/托盘

## API 接口使用

### 1. 查询错误日志

```bash
# 查询所有错误日志
GET /api/material-palletizing-error-log

# 按条件查询
GET /api/material-palletizing-error-log?errorType=PROCESS_FAILED&resolved=false&page=1&limit=20

# 查询特定条码的错误
GET /api/material-palletizing-error-log/barcode/YOUR_BARCODE

# 查询特定托盘的错误
GET /api/material-palletizing-error-log/pallet/YOUR_PALLET_CODE
```

### 2. 错误统计

```bash
# 获取错误统计信息
GET /api/material-palletizing-error-log/statistics

# 按时间范围统计
GET /api/material-palletizing-error-log/statistics?startDate=2024-01-01&endDate=2024-01-31
```

### 3. 查询错误详情

```bash
# 查询单个错误详情
GET /api/material-palletizing-error-log/ERR_1234567890_abc123
```

### 4. 标记错误为已解决

```bash
# 标记错误为已解决
PUT /api/material-palletizing-error-log/ERR_1234567890_abc123/resolve
Content-Type: application/json

{
  "resolutionNote": "已修复数据库连接问题",
  "userId": "USER_ID"
}
```

## 错误类型说明

| 错误类型 | 描述 | 影响级别 |
|---------|------|---------|
| PROCESS_FAILED | 工序处理失败 | HIGH |
| PALLET_SAVE_FAILED | 托盘保存失败 | HIGH |
| DUPLICATE_BARCODE | 重复条码 | MEDIUM |
| VALIDATION_FAILED | 验证失败 | MEDIUM |
| CONCURRENT_CONFLICT | 并发冲突 | MEDIUM |
| ROLLBACK_FAILED | 回滚失败 | CRITICAL |
| ATOMIC_OPERATION_FAILED | 原子操作失败 | HIGH |
| BOX_VALIDATION_FAILED | 箱条码验证失败 | MEDIUM |
| WORK_ORDER_ERROR | 工单错误 | MEDIUM |
| MATERIAL_FLOW_ERROR | 物料流程错误 | HIGH |
| UNKNOWN_ERROR | 未知错误 | MEDIUM |

## 操作类型说明

| 操作类型 | 描述 |
|---------|------|
| ADD_TO_PALLET | 添加到托盘 |
| CREATE_PALLET | 创建托盘 |
| BIND_PROCESS | 绑定工序 |
| VALIDATE_BARCODE | 验证条码 |
| SAVE_PALLET | 保存托盘 |
| ROLLBACK_PROCESS | 回滚工序 |
| UPDATE_PALLET_STATUS | 更新托盘状态 |
| UNBIND_BARCODE | 解绑条码 |
| SPLIT_PALLET | 拆分托盘 |

## 查询示例

### 1. 查询今天的所有错误

```javascript
const today = new Date().toISOString().split('T')[0];
const response = await fetch(`/api/material-palletizing-error-log?startDate=${today}&endDate=${today}`);
const data = await response.json();
```

### 2. 查询未解决的高影响错误

```javascript
const response = await fetch('/api/material-palletizing-error-log?resolved=false&impactLevel=HIGH');
const data = await response.json();
```

### 3. 查询特定产线的错误趋势

```javascript
const response = await fetch(`/api/material-palletizing-error-log?productLineId=${lineId}&startDate=2024-01-01`);
const data = await response.json();
```

## 数据库查询示例

### 1. 直接查询数据库

```javascript
// 查询最近的错误
const MaterialPalletizingErrorLog = require('../model/project/materialPalletizingErrorLog');

const recentErrors = await MaterialPalletizingErrorLog.find({
  createAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
})
.populate('productLineId', 'lineName')
.sort({ createAt: -1 })
.limit(10);
```

### 2. 聚合查询

```javascript
// 按产线统计错误数量
const errorsByLine = await MaterialPalletizingErrorLog.aggregate([
  {
    $group: {
      _id: '$productLineId',
      count: { $sum: 1 },
      unresolved: { $sum: { $cond: ['$resolved', 0, 1] } }
    }
  },
  {
    $lookup: {
      from: 'production_lines',
      localField: '_id',
      foreignField: '_id',
      as: 'lineInfo'
    }
  }
]);
```

## 故障排查指南

### 1. 产品条码进度100%但未入托盘

1. 查询该条码的错误日志：
   ```bash
   GET /api/material-palletizing-error-log/barcode/YOUR_BARCODE
   ```

2. 检查错误类型：
   - `PROCESS_FAILED`: 工序绑定失败
   - `ATOMIC_OPERATION_FAILED`: 托盘保存失败
   - `ROLLBACK_FAILED`: 回滚失败（严重）

3. 查看上下文信息，了解失败原因

### 2. 高频错误排查

1. 查看错误统计：
   ```bash
   GET /api/material-palletizing-error-log/statistics
   ```

2. 分析错误类型分布和时间趋势

3. 针对性优化高频错误点

## 维护建议

### 1. 定期清理
- 建议定期清理30天以上的已解决错误日志
- 保留未解决的错误日志用于分析

### 2. 监控告警
- 可基于错误日志建立监控告警
- 关注CRITICAL级别的错误
- 监控错误解决率

### 3. 性能优化
- 利用已建立的索引进行查询
- 大量数据查询时使用分页
- 定期分析慢查询

## 集成到现有项目

1. 在主路由文件中添加错误日志路由：

```javascript
const materialPalletizingErrorLogRoutes = require('./routes/materialPalletizingErrorLog');
app.use('/api/material-palletizing-error-log', materialPalletizingErrorLogRoutes);
```

2. 确保数据库连接正常，模型会自动创建集合和索引

3. 错误日志会在托盘处理过程中自动记录，无需额外调用

## 注意事项

1. 错误日志记录是异步进行的，不会影响主业务流程
2. 记录错误日志失败不会抛出异常，只会在控制台输出警告
3. 敏感信息（如密码）不会记录到错误日志中
4. 建议定期备份错误日志数据用于历史分析 