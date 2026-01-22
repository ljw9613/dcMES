# 产品初始化日志系统

## 概述

产品初始化日志系统是德昌MES系统的重要组成部分，用于记录和追踪产品条码初始化操作的详细信息。该系统提供完整的操作审计功能，包括操作前状态记录、工单数量调整追踪、操作结果记录等。

## 功能特性

### 1. 详细日志记录
- **产品信息记录**：条码、物料编码、物料名称、规格等
- **工艺信息记录**：工艺ID、工艺名称、工艺版本等
- **工单信息记录**：工单ID、工单号等
- **产线信息记录**：产线ID、产线名称等

### 2. 操作前状态快照
- 流程状态（PENDING/IN_PROCESS/COMPLETED/EXCEPTION）
- 完成进度百分比
- 开始时间和结束时间
- 总节点数和已完成节点数

### 3. 工单数量调整追踪
- 投入量调整标记和调整数量
- 产出量调整标记和调整数量
- 自动记录调整原因

### 4. 操作信息记录
- 操作员信息
- 操作时间
- 操作原因和备注
- IP地址和用户代理信息

### 5. 结果状态追踪
- 操作成功/失败状态
- 详细错误信息记录
- 操作类型标识

## 数据库模型

### ProductInitializeLog 模型字段说明

```javascript
{
  // 基本信息
  barcode: String,              // 产品条码
  materialId: ObjectId,         // 物料ID
  materialCode: String,         // 物料编码
  materialName: String,         // 物料名称
  materialSpec: String,         // 物料规格
  
  // 工艺信息
  craftId: ObjectId,            // 工艺ID
  craftName: String,            // 工艺名称
  craftVersion: String,         // 工艺版本
  
  // 工单信息
  productionPlanWorkOrderId: ObjectId,  // 工单ID
  workOrderNo: String,          // 工单号
  
  // 产线信息
  productLineId: String,        // 产线ID
  productLineName: String,      // 产线名称
  
  // 初始化前状态
  beforeInitialize: {
    status: String,             // 状态
    progress: Number,           // 进度
    startTime: Date,            // 开始时间
    endTime: Date,              // 结束时间
    totalNodes: Number,         // 总节点数
    completedNodes: Number      // 已完成节点数
  },
  
  // 工单调整信息
  workOrderAdjustment: {
    inputQuantityAdjusted: Boolean,     // 投入量是否调整
    outputQuantityAdjusted: Boolean,    // 产出量是否调整
    inputAdjustmentAmount: Number,      // 投入量调整数量
    outputAdjustmentAmount: Number      // 产出量调整数量
  },
  
  // 操作信息
  operatorId: ObjectId,         // 操作员ID
  operatorName: String,         // 操作员姓名
  operateTime: Date,            // 操作时间
  reason: String,               // 操作原因
  remark: String,               // 备注
  result: String,               // 操作结果 (SUCCESS/FAILED)
  errorMessage: String,         // 错误信息
  operationType: String,        // 操作类型
  ipAddress: String,            // IP地址
  userAgent: String             // 用户代理
}
```

## 使用方法

### 1. 在MaterialProcessFlowService中使用

```javascript
// 调用初始化产品方法，自动记录日志
const result = await MaterialProcessFlowService.initializeProduct(
  barcode,           // 产品条码
  userId,            // 操作用户ID
  reason,            // 初始化原因（可选）
  remark,            // 备注信息（可选）
  ipAddress,         // IP地址（可选）
  userAgent          // 用户代理（可选）
);

// 返回结果包含日志ID
console.log(result.logId); // 新创建的日志记录ID
```

### 2. 使用ProductInitializeLogService查询日志

```javascript
const ProductInitializeLogService = require('./services/productInitializeLogService');

// 分页查询日志
const logs = await ProductInitializeLogService.getLogsByPage({
  page: 1,
  pageSize: 20,
  barcode: 'ABC123',
  materialCode: 'MAT001',
  operatorId: '507f1f77bcf86cd799439011',
  result: 'SUCCESS',
  startTime: '2024-01-01',
  endTime: '2024-12-31',
  workOrderNo: 'WO001'
});

// 根据条码查询历史
const history = await ProductInitializeLogService.getLogsByBarcode('ABC123');

// 获取统计信息
const stats = await ProductInitializeLogService.getStatistics({
  startTime: '2024-01-01',
  endTime: '2024-12-31',
  operatorId: '507f1f77bcf86cd799439011'
});

// 导出日志数据
const exportData = await ProductInitializeLogService.exportLogs({
  startTime: '2024-01-01',
  endTime: '2024-12-31'
});
```

## API接口示例

### 1. 查询日志列表

```http
GET /api/product-initialize-logs?page=1&pageSize=20&barcode=ABC123
```

### 2. 获取日志详情

```http
GET /api/product-initialize-logs/:logId
```

### 3. 获取统计信息

```http
GET /api/product-initialize-logs/statistics?startTime=2024-01-01&endTime=2024-12-31
```

### 4. 导出日志数据

```http
GET /api/product-initialize-logs/export?startTime=2024-01-01&endTime=2024-12-31
```

### 5. 清理历史日志

```http
DELETE /api/product-initialize-logs/cleanup?beforeDate=2024-01-01
```

## 数据库索引

系统自动创建以下索引以提高查询性能：

```javascript
// 复合索引
{ barcode: 1, operateTime: -1 }
{ operatorId: 1, operateTime: -1 }
{ materialCode: 1, operateTime: -1 }
{ productionPlanWorkOrderId: 1, operateTime: -1 }
{ operateTime: -1 }
```

## 统计功能

### 1. 总体统计
- 总操作次数
- 成功次数和失败次数
- 成功率计算
- 工单投入量和产出量调整总计

### 2. 操作员统计
- 各操作员的操作次数
- 各操作员的成功率
- 操作员排名

### 3. 日期统计
- 最近30天的每日操作统计
- 每日成功率趋势

## 数据维护

### 1. 日志清理
系统提供日志清理功能，可以删除指定日期之前的历史记录：

```javascript
// 删除30天前的日志
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const result = await ProductInitializeLogService.cleanupLogs(thirtyDaysAgo);
console.log(`删除了 ${result.deletedCount} 条记录`);
```

### 2. 数据导出
支持将日志数据导出为Excel格式，包含所有关键字段的中文标题。

## 注意事项

1. **性能考虑**：日志记录是异步操作，不会影响主业务流程的性能
2. **数据完整性**：即使主操作失败，也会记录失败日志
3. **存储空间**：建议定期清理历史日志以节省存储空间
4. **权限控制**：日志查询和管理功能需要相应的权限控制
5. **数据备份**：重要的日志数据建议定期备份

## 扩展功能

### 1. 告警功能
可以基于日志数据实现以下告警：
- 失败率过高告警
- 异常操作频率告警
- 特定操作员异常行为告警

### 2. 报表功能
可以基于日志数据生成：
- 日/周/月操作报表
- 操作员绩效报表
- 产线效率分析报表

### 3. 审计功能
- 操作轨迹追踪
- 合规性检查
- 数据变更审计

## 技术支持

如有问题或建议，请联系开发团队。 