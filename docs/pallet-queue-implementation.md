# 托盘处理队列化改造实现文档

## 概述

本次改造将原本同步的 `handlePalletBarcode` 方法改为消息队列的方式，以提高系统性能和并发处理能力，同时保证前端正常运行且无需修改。

## 改造内容

### 1. 扩展队列服务 (QueueService)

**文件**: `dcMes_server/services/queueService.js`

**新增功能**:
- 创建托盘处理队列 (`palletQueue`)
- 添加托盘处理任务到队列的方法 (`addPalletProcessingTask`)
- 托盘任务优先级管理 (`getPalletTaskPriority`)
- 托盘队列处理器初始化 (`initializePalletProcessor`)
- 双队列状态监控和指标计算

**关键特性**:
- 支持最多2个并发托盘处理任务
- 维修台任务具有更高优先级
- 托盘处理超时时间为2分钟
- 自动重试机制（最多2次）

### 2. 新增异步托盘处理方法

**文件**: `dcMes_server/services/materialPalletizing.js`

**新增方法**:
- `handlePalletBarcodeAsync`: 异步托盘处理主方法
- `_quickValidation`: 快速验证方法（在入队列前验证）
- `_getPalletInfoForQuickResponse`: 获取托盘信息用于快速响应

**处理流程**:
1. 快速基础验证（重复条码、生产计划、箱条码等）
2. 获取或预创建托盘信息
3. 提交任务到队列
4. 立即返回前端兼容的响应

### 3. 更新路由接口

**文件**: `dcMes_server/routes/materialPalletizing.js`

**主要改动**:
- 修改 `/api/v1/handlePalletBarcode` 接口支持队列化处理
- 新增 `useQueue` 参数控制是否使用队列（默认启用）
- 新增 `/api/v1/getPalletProcessingStatus/:jobId` 队列状态查询接口
- 保持响应格式与原接口兼容

### 4. 扩展队列监控

**文件**: `dcMes_server/routes/queueMonitor.js`

**新增功能**:
- 双队列（工单+托盘）状态监控
- 分别计算工单队列和托盘队列的性能指标
- 新增托盘处理任务测试接口
- 更细粒度的健康检查和告警

## 前端兼容性

### 响应格式保持一致

原始响应格式:
```json
{
  "code": 200,
  "success": true,
  "data": {
    "palletCode": "YDC-SN-123456",
    "productionOrderId": "...",
    "workOrderNo": "...",
    // ... 其他字段
  },
  "message": "添加成功"
}
```

队列化响应格式:
```json
{
  "code": 200,
  "success": true,
  "data": {
    "palletCode": "YDC-SN-123456",
    "productionOrderId": "...",
    "workOrderNo": "...",
    "status": "PROCESSING",
    "queueInfo": {
      "jobId": "pallet_ABC123_1234567890_xyz789",
      "estimatedDelay": 3000,
      "message": "托盘处理任务已加入队列，正在后台处理"
    },
    // ... 其他字段保持一致
  },
  "message": "条码已提交处理队列，正在后台处理",
  "queue": {
    "enabled": true,
    "jobId": "...",
    "estimatedDelay": 3000
  }
}
```

### 前端无需修改

- API调用方式完全不变
- 响应数据结构保持兼容
- 新增的队列相关字段为可选字段，前端可以忽略

## 使用方法

### 1. 启用/禁用队列模式

**默认启用队列模式**:
```javascript
// 前端API调用 - 自动使用队列
const result = await handlePalletBarcode({
  lineId: "LINE001",
  mainBarcode: "ABC123",
  // ... 其他参数
});
```

**禁用队列模式（兼容模式）**:
```javascript
// 前端API调用 - 强制同步处理
const result = await handlePalletBarcode({
  lineId: "LINE001", 
  mainBarcode: "ABC123",
  useQueue: false,  // 显式禁用队列
  // ... 其他参数
});
```

### 2. 查询处理状态

```javascript
// 如果需要查询队列处理状态
const jobId = result.data.queueInfo.jobId;
const status = await fetch(`/api/v1/getPalletProcessingStatus/${jobId}`);
```

### 3. 队列监控

访问队列监控接口：
- 队列状态: `GET /api/queue/status`
- 健康检查: `GET /api/queue/health`
- 性能指标: `GET /api/queue/metrics`

## 配置参数

### 队列配置

**托盘队列配置** (`dcMes_server/services/queueService.js`):
```javascript
const palletQueue = new Queue('pallet-processing', {
  defaultJobOptions: {
    removeOnComplete: 50,     // 保留50个完成任务
    removeOnFail: 100,        // 保留100个失败任务
    attempts: 2,              // 最多重试2次
    timeout: 120000,          // 超时2分钟
  }
});
```

**并发设置**:
- 托盘处理器并发数: 2
- 工单更新处理器并发数: 1

### 优先级设置

- 维修台托盘任务: 优先级 15
- 普通托盘任务: 优先级 10
- 工单产出更新: 优先级 10
- 工单投入更新: 优先级 5

## 监控告警

### 健康检查阈值

- 工单队列积压: > 50个等待任务
- 托盘队列积压: > 20个等待任务
- 工单队列卡住: > 5个活跃任务
- 托盘队列卡住: > 3个活跃任务

### 性能指标

- 完成率计算
- 失败率统计
- 队列利用率监控
- 处理时长统计

## 测试接口

### 手动测试托盘处理

```bash
POST /api/queue/test/handle-pallet-barcode
Content-Type: application/json

{
  "lineId": "TEST_LINE",
  "mainBarcode": "TEST_BARCODE_001",
  "lineName": "Test Line",
  "materialId": "TEST_MATERIAL"
}
```

### 查看队列状态

```bash
GET /api/queue/status
```

## 错误处理

### 队列处理失败

如果队列处理失败，任务会自动重试。重试失败后：
1. 错误日志记录到 MaterialPalletizingErrorLog
2. 任务状态标记为失败
3. 可通过监控接口查看失败详情

### 降级机制

如果队列服务不可用，可以通过设置 `useQueue: false` 使用同步处理模式作为降级方案。

## 优势

1. **性能提升**: 异步处理，快速响应前端
2. **并发控制**: 避免大量并发请求导致的数据库压力
3. **错误恢复**: 自动重试机制和错误日志
4. **监控能力**: 完整的队列状态和性能监控
5. **向后兼容**: 前端代码完全无需修改
6. **灵活配置**: 支持队列和同步两种模式

## 注意事项

1. **Redis依赖**: 队列服务依赖Redis，确保Redis服务正常运行
2. **数据一致性**: 队列处理过程中如果系统重启，正在处理的任务可能需要重新处理
3. **监控重要性**: 建议定期检查队列状态，及时发现和处理积压问题
4. **资源限制**: 根据服务器资源调整并发数量和超时时间

## 未来扩展

1. 可以考虑增加更多队列类型（如出库处理队列）
2. 支持队列任务优先级动态调整
3. 增加更详细的性能分析和统计
4. 支持分布式队列部署 