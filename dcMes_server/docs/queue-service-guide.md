# 工单数量更新队列服务使用指南

## 📋 概述

该队列服务旨在解决 `updateWorkOrderQuantity` 方法在 pm2 负载均衡多进程环境下的并发问题，通过 Redis + Bull 队列实现工单数量更新的顺序处理，避免数据丢失和重复统计。

## 🚀 功能特性

- ✅ **避免并发冲突**: 通过队列排队处理，确保同一工单的更新操作按顺序执行
- ✅ **数据一致性**: 防止多频调用导致的工单投入量和增减日志丢失
- ✅ **高可靠性**: 支持任务重试、超时处理、错误恢复
- ✅ **跨进程支持**: 在 pm2 多进程环境下有效工作
- ✅ **实时监控**: 提供丰富的 API 接口监控队列状态
- ✅ **优雅关闭**: 支持应用停止时的队列优雅关闭

## 📦 安装依赖

更新后的 `package.json` 已包含所需依赖：

```json
{
  "dependencies": {
    "bull": "^4.11.5",
    "ioredis": "^5.3.2"
  }
}
```

安装命令：
```bash
npm install
```

## ⚙️ 环境配置

### Redis 配置

通过环境变量配置 Redis 连接：

```bash
# 开发环境
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_DB=0

# 生产环境
export REDIS_HOST=your-redis-host
export REDIS_PORT=6379
export REDIS_PASSWORD=your-redis-password
export REDIS_DB=1
```

### Docker 环境快速启动 Redis

```bash
docker run -d \
  --name redis-dcmes \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine redis-server --appendonly yes
```

## 🔧 使用方法

### 1. 代码调用方式

原有的 `updateWorkOrderQuantity` 方法调用方式保持不变，但返回结果结构有所变化：

```javascript
const MaterialProcessFlowService = require('./services/materialProcessFlowService');

// 原有调用方式
const result = await MaterialProcessFlowService.updateWorkOrderQuantity(
  workOrderId,
  'output',  // 或 'input'
  1,         // 数量
  {
    relatedBarcode: 'BARCODE123',
    barcodeOperation: 'SCAN_PROCESS',
    operatorId: 'USER001',
    processStepId: 'STEP001',
    processName: '包装工序',
    reason: '产品完成包装',
    source: 'DEVICE'
  }
);

// 新的返回结果结构
if (result.success) {
  console.log('任务已加入队列:', {
    jobId: result.jobId,
    estimatedDelay: result.estimatedDelay,
    queueLength: result.queueLength
  });
} else {
  console.error('任务加入队列失败:', result.error);
}
```

### 2. 返回结果说明

**成功情况 (success: true)**:
```javascript
{
  success: true,
  jobId: "workorder123_output_1699123456789_abc123",
  workOrderId: "workorder123",
  type: "output",
  quantity: 1,
  message: "更新任务已加入队列，将按顺序处理",
  estimatedDelay: 150,     // 预估延迟时间(ms)
  queueLength: 3,          // 当前队列长度
  code: "QUEUED"
}
```

**失败情况 (success: false)**:
```javascript
{
  success: false,
  error: "错误描述",
  workOrderId: "workorder123",
  type: "output",
  quantity: 1,
  code: "QUEUE_ERROR" | "MISSING_WORK_ORDER_ID" | "SYSTEM_ERROR"
}
```

## 📊 监控 API

提供了丰富的监控 API 接口：

### 1. 队列状态查询

```bash
GET /api/queue/status
```

响应示例：
```json
{
  "success": true,
  "data": {
    "waiting": 5,
    "active": 1,
    "completed": 98,
    "failed": 2,
    "delayed": 0,
    "total": 106,
    "health": "OK",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Redis连接状态检查

```bash
GET /api/queue/redis-status
```

响应示例：
```json
{
  "success": true,
  "connected": true,
  "message": "Redis连接正常",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. 队列健康检查

```bash
GET /api/queue/health
```

### 4. 性能指标

```bash
GET /api/queue/metrics
```

### 5. 队列管理操作

```bash
# 暂停队列
POST /api/queue/pause

# 恢复队列
POST /api/queue/resume

# 清理队列
POST /api/queue/clean
```

### 6. 测试接口

```bash
# 手动触发工单更新（用于测试）
POST /api/queue/test/update-work-order
Content-Type: application/json

{
  "workOrderId": "test-workorder-123",
  "type": "output",
  "quantity": 1,
  "logContext": {
    "operatorId": "TEST_USER",
    "reason": "测试更新"
  }
}
```

## 🛠️ 运维管理

### 1. 应用启动

队列服务会在应用启动时自动初始化，包含完整的Redis连接状态监听，日志输出：

```
📦 初始化工单更新队列服务...
🚀 初始化工单数量更新队列处理器...
📋 检查Redis连接状态...
🧪 开始测试Redis连接...
🔗 Redis连接已建立 { host: 'localhost', port: 6379, db: 0, timestamp: '2024-01-15T10:30:00.000Z' }
✅ Redis连接就绪，可以执行命令 { host: 'localhost', port: 6379, timestamp: '2024-01-15T10:30:00.000Z' }
✅ Redis连接测试成功 { host: 'localhost', port: 6379, response: 'PONG', timestamp: '2024-01-15T10:30:00.000Z' }
✅ Redis读写操作测试成功
✅ Redis连接正常，继续初始化队列处理器...
✅ 队列服务初始化成功
```

### 2. 监控指标

重要监控指标：

- **waiting**: 等待处理的任务数（超过100需关注）
- **active**: 正在处理的任务数（超过10可能有问题）
- **failed**: 失败任务数（失败率过高需排查）
- **completionRate**: 完成率
- **queueUtilization**: 队列利用率

### 3. 日志监控

关键日志标识：

```bash
# Redis连接相关日志
🔗 Redis连接已建立 { host: 'localhost', port: 6379, db: 0 }
✅ Redis连接就绪，可以执行命令
❌ Redis连接错误: { host: 'localhost', error: 'ECONNREFUSED' }
🔄 Redis正在重连... { delay: '2000ms' }
🔌 Redis连接已关闭

# 队列任务日志
✅ 队列任务完成: job123 WorkOrder: order123 耗时: 150ms
❌ 队列任务失败: job123 WorkOrder: order123 错误: 数据库连接超时
⚠️ 队列任务停滞: job123 WorkOrder: order123
```

### 4. 故障排除

**常见问题及解决方案**:

1. **Redis 连接失败**
   ```bash
   # 检查 Redis 服务状态
   redis-cli ping
   
   # 检查网络连接
   telnet redis-host 6379
   ```

2. **队列积压严重**
   ```bash
   # 检查队列状态
   curl http://localhost:3000/api/queue/status
   
   # 清理历史任务
   curl -X POST http://localhost:3000/api/queue/clean
   ```

3. **任务执行失败率高**
   - 检查数据库连接
   - 检查工单数据完整性
   - 查看详细错误日志

### 5. 性能优化

**推荐配置**:

- **开发环境**: 单Redis实例，DB 0
- **生产环境**: Redis集群，独立DB，配置密码
- **队列清理**: 定期清理完成和失败的任务
- **监控告警**: 设置队列积压和失败率告警

## 🔄 迁移指南

### 从旧版本迁移

1. **备份数据**: 迁移前备份工单相关数据
2. **安装依赖**: `npm install bull ioredis`
3. **配置Redis**: 设置环境变量
4. **测试验证**: 使用测试接口验证功能
5. **逐步部署**: 建议灰度部署，观察运行状态

### 兼容性说明

- ✅ 原有API调用方式保持兼容
- ⚠️ 返回结果结构有变化（异步处理）
- ✅ 数据库结构无变化
- ✅ 日志格式保持兼容

## 📈 最佳实践

1. **合理设置Redis配置**: 根据业务量调整连接池大小
2. **监控队列健康状态**: 设置告警阈值
3. **定期清理历史任务**: 避免内存占用过多
4. **错误处理**: 对队列操作失败要有降级策略
5. **性能测试**: 在生产环境部署前进行压力测试

## 🆘 技术支持

如遇到问题，请提供以下信息：

1. 错误日志和堆栈信息
2. 队列状态 (`/api/queue/status`)
3. Redis连接状态
4. 系统资源使用情况
5. 业务场景描述

---

**注意**: 该队列服务需要Redis支持，请确保生产环境Redis的高可用性和数据持久化配置。 