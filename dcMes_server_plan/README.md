# dcMes工单处理服务 (dcMes Plan Server)

## 📋 概述

`dcMes_plan_server` 是德昌MES系统的独立工单处理服务，专门负责处理工单的投入产出等任务。

### 为什么需要独立服务？

在原有架构中，主服务(`dcMes_server`)使用PM2进行负载均衡，多个实例同时处理工单更新请求时会出现：
- ⚠️ **并发竞态问题**：多个实例可能同时修改同一工单数据
- ⚠️ **数据不一致**：投入产出数量可能出现重复增加或遗漏
- ⚠️ **队列重复处理**：每个实例都有自己的队列，任务可能被重复处理

### 解决方案

创建单实例的独立工单处理服务：
- ✅ **单实例运行**：使用PM2 fork模式，只运行一个实例
- ✅ **集中处理**：所有工单更新请求都通过HTTP API转发到此服务
- ✅ **串行队列**：使用Bull队列和Redis锁，确保同一工单的更新串行处理
- ✅ **降级机制**：服务不可用时自动降级到原有的本地队列

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                     dcMes_server (主服务)                     │
│                  PM2 Cluster Mode (多实例)                    │
│                                                               │
│  Instance 1    Instance 2    Instance 3    ...    Instance N │
│     │              │              │                    │      │
│     └──────────────┴──────────────┴────────────────────┘      │
│                          │                                    │
│                          ▼                                    │
│              ┌──────────────────────┐                        │
│              │  PlanServerClient    │                        │
│              │   (HTTP调用)          │                        │
│              └──────────────────────┘                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Request
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              dcMes_plan_server (工单处理服务)                 │
│                  PM2 Fork Mode (单实例)                       │
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Express API  │───▶│ QueueService │───▶│WorkOrderService│ │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                            │                                 │
│                            ▼                                 │
│                   ┌─────────────────┐                       │
│                   │  Bull Queue     │                       │
│                   │  + Redis Lock   │                       │
│                   └─────────────────┘                       │
│                            │                                 │
│                            ▼                                 │
│                   ┌─────────────────┐                       │
│                   │   MongoDB       │                       │
│                   └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## 📦 项目结构

```
dcMes_plan_server/
├── config/                  # 配置文件
│   ├── database.js         # 数据库连接配置
│   └── redis.js           # Redis和队列配置
├── model/                  # 数据模型
│   └── project/
│       ├── productionPlanWorkOrder.js  # 工单模型
│       └── workOrderQuantityLog.js     # 工单数量变更日志
├── services/               # 服务层
│   ├── queueService.js    # 队列服务（含Redis锁管理）
│   └── workOrderService.js # 工单业务逻辑
├── routes/                 # 路由层
│   └── workOrder.js       # 工单API路由
├── middleware/             # 中间件
├── logs/                   # 日志目录
├── public/                 # 静态文件
├── app.js                 # Express应用
├── server.js              # 启动文件
├── package.json           # 依赖配置
└── README.md             # 说明文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd dcMes_plan_server
npm install
```

### 2. 环境配置

确保以下环境变量已配置（或在PM2配置文件中设置）：

```bash
# 服务端口
PORT=3001

# MongoDB连接
MONGODB_URI=mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=2

# 环境
NODE_ENV=production
```

### 3. 启动服务

#### 开发环境（直接运行）

```bash
npm run dev
```

#### 生产环境（使用PM2）

```bash
# 在项目根目录启动所有服务
pm2 start ecosystem.config.js --env production

# 或单独启动工单处理服务
pm2 start ecosystem.config.js --only dcmes-plan-server --env production
```

### 4. 验证服务

```bash
# 健康检查
curl http://localhost:3001/health

# 查看服务信息
curl http://localhost:3001/

# 查看队列状态
curl http://localhost:3001/api/workorder/queue/stats
```

## 📡 API接口文档

### 1. 更新工单数量

**接口：** `POST /api/workorder/update-quantity`

**请求参数：**

```json
{
  "workOrderId": "工单ID",
  "type": "input|output",
  "quantity": 1,
  "logContext": {
    "relatedBarcode": "相关条码",
    "barcodeOperation": "SCAN_PROCESS",
    "processStepId": "工序ID",
    "processName": "工序名称",
    "processCode": "工序编码",
    "operatorId": "操作人ID",
    "operatorName": "操作人姓名",
    "reason": "变更原因",
    "remark": "备注",
    "ipAddress": "IP地址",
    "userAgent": "用户代理",
    "isAutomatic": true,
    "source": "SYSTEM"
  }
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "工单更新任务已加入队列",
  "data": {
    "success": true,
    "jobId": "65f3a1b2c3d4e5f6g7h8i9j0_output_1698765432000",
    "workOrderId": "65f3a1b2c3d4e5f6g7h8i9j0",
    "type": "output",
    "quantity": 1,
    "queueLength": 5,
    "activeJobs": 1,
    "estimatedDelay": 3000
  },
  "code": "QUEUED"
}
```

### 2. 批量更新工单数量

**接口：** `POST /api/workorder/batch-update-quantity`

**请求参数：**

```json
{
  "updates": [
    {
      "workOrderId": "工单ID1",
      "type": "input",
      "quantity": 1,
      "logContext": {}
    },
    {
      "workOrderId": "工单ID2",
      "type": "output",
      "quantity": 1,
      "logContext": {}
    }
  ]
}
```

### 3. 获取工单详情

**接口：** `GET /api/workorder/detail/:id`

### 4. 查询工单数量变更日志

**接口：** `GET /api/workorder/quantity-logs/:id`

**查询参数：**
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认20）
- `changeType`: 变更类型（input/output）
- `startDate`: 开始日期
- `endDate`: 结束日期

### 5. 队列管理接口

```bash
# 获取队列统计
GET /api/workorder/queue/stats

# 获取锁统计
GET /api/workorder/queue/locks

# 清理队列
POST /api/workorder/queue/clean

# 暂停队列
POST /api/workorder/queue/pause

# 恢复队列
POST /api/workorder/queue/resume

# 清理所有锁
POST /api/workorder/queue/clean-locks
```

## 🔧 主服务集成

主服务(`dcMes_server`)通过`PlanServerClient`调用工单处理服务：

```javascript
const PlanServerClient = require('./services/planServerClient');

// 更新工单数量
const result = await PlanServerClient.updateWorkOrderQuantity(
  workOrderId,
  'output',
  1,
  logContext
);

// 健康检查
const health = await PlanServerClient.healthCheck();

// 获取队列统计
const stats = await PlanServerClient.getQueueStats();
```

### 降级机制

当工单处理服务不可用时，主服务会自动降级到本地队列处理：

```javascript
if (result.fallback && result.code === 'SERVICE_UNAVAILABLE') {
  // 自动降级到本地队列
  const QueueService = require('./queueService').QueueService;
  const queueResult = await QueueService.addWorkOrderQuantityUpdate(...);
}
```

## 🔒 并发控制机制

### 1. Redis分布式锁

每个工单更新任务执行前会获取该工单的分布式锁：

```javascript
// 获取锁
const lockResult = await lockManager.acquireLock(workOrderId, workerId);

if (lockResult.success) {
  // 执行工单更新
  await WorkOrderService.updateWorkOrderQuantity(...);
  
  // 释放锁
  await lockManager.releaseLock(workOrderId, workerId);
}
```

### 2. Bull队列串行处理

队列配置为串行处理（concurrency: 1），确保同一时刻只有一个任务在执行：

```javascript
queueConfig.processor = {
  concurrency: 1,  // 串行处理
  name: 'update-quantity'
};
```

### 3. 任务重试机制

任务失败时自动重试，使用指数退避策略：

```javascript
defaultJobOptions: {
  attempts: 3,              // 重试3次
  backoff: {
    type: 'exponential',
    delay: 2000             // 初始延迟2秒
  }
}
```

## 📊 监控与日志

### PM2监控

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs dcmes-plan-server

# 查看详细信息
pm2 describe dcmes-plan-server

# 实时监控
pm2 monit
```

### 日志文件

- 错误日志：`logs/pm2-plan-server-error.log`
- 输出日志：`logs/pm2-plan-server-out.log`

### 队列统计

```bash
# 获取队列统计信息
curl http://localhost:3001/api/workorder/queue/stats

# 获取锁统计信息
curl http://localhost:3001/api/workorder/queue/locks
```

## 🛠️ 维护操作

### 清理队列

```bash
curl -X POST http://localhost:3001/api/workorder/queue/clean \
  -H "Content-Type: application/json" \
  -d '{"grace": 5000}'
```

### 暂停/恢复队列

```bash
# 暂停队列
curl -X POST http://localhost:3001/api/workorder/queue/pause

# 恢复队列
curl -X POST http://localhost:3001/api/workorder/queue/resume
```

### 清理异常锁

```bash
curl -X POST http://localhost:3001/api/workorder/queue/clean-locks
```

### 重启服务

```bash
# 重启工单处理服务
pm2 restart dcmes-plan-server

# 重启所有服务
pm2 restart all
```

## ⚠️ 注意事项

### 1. 单实例运行

工单处理服务必须以**单实例**运行（PM2 fork模式），不要设置为cluster模式或多实例，否则会失去并发控制的意义。

### 2. Redis依赖

服务依赖Redis进行队列管理和分布式锁，确保Redis服务正常运行：

```bash
# 测试Redis连接
redis-cli -h localhost -p 6379 ping
```

### 3. 端口占用

默认端口为3001，确保该端口未被占用：

```bash
# 检查端口占用
lsof -i :3001

# 或使用
netstat -an | grep 3001
```

### 4. 主服务配置

主服务需要配置工单处理服务的地址：

```javascript
// 环境变量
PLAN_SERVER_HOST=localhost
PLAN_SERVER_PORT=3001
```

## 🔍 故障排查

### 服务无法启动

1. 检查端口是否被占用
2. 检查MongoDB连接是否正常
3. 检查Redis连接是否正常
4. 查看错误日志：`pm2 logs dcmes-plan-server --err`

### 队列任务堆积

1. 查看队列统计：`GET /api/workorder/queue/stats`
2. 检查是否有任务停滞
3. 检查Redis锁是否异常
4. 必要时清理队列和锁

### 主服务调用失败

1. 检查工单处理服务是否运行：`pm2 status dcmes-plan-server`
2. 检查健康接口：`curl http://localhost:3001/health`
3. 查看主服务日志，确认降级机制是否生效

## 📝 更新日志

### Version 1.0.0 (2024-10-31)

- ✨ 初始版本发布
- ✅ 实现单实例工单处理服务
- ✅ 实现Redis分布式锁机制
- ✅ 实现Bull队列串行处理
- ✅ 集成主服务API调用
- ✅ 实现降级机制
- ✅ 完整的监控和日志功能

## 📧 联系方式

如有问题，请联系开发团队。

---

**最后更新：** 2024-10-31  
**版本：** 1.0.0

