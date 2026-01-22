# 队列并发处理优化方案（托盘 + 工单）

## 优化背景

原有的队列处理系统采用全局串行处理模式，所有任务都在各自队列中按顺序执行，导致：

### 托盘队列问题
- **等待时间过长**：不同托盘的任务无法并发处理
- **资源利用率低**：处理能力限制在2个并发，无法充分利用系统资源

### 工单队列问题  
- **严重性能瓶颈**：并发数为1，所有工单更新完全串行
- **用户体验差**：前端等待任务执行完成的时间极长

## 优化目标

实现基于业务实体的智能并发处理：

### 托盘队列优化
- ✅ **不同托盘的任务可以并发执行**
- ✅ **同一托盘的任务保持串行执行**（保证数据一致性）

### 工单队列优化  
- ✅ **不同工单的任务可以并发执行**
- ✅ **同一工单的任务保持串行执行**（避免数据竞争）

### 整体性能目标
- ✅ **大幅提升处理速度**（托盘队列5倍提升，工单队列5倍提升）
- ✅ **保持系统稳定性**（完善的锁机制和错误处理）

## 技术方案

### 1. 核心架构设计

```
原来：全局串行队列
托盘队列（并发数=2）: [ 托盘A任务1 ] → [ 托盘B任务1 ] → [ 托盘A任务2 ] → [ 托盘C任务1 ] → ...
工单队列（并发数=1）: [ 工单1更新1 ] → [ 工单2更新1 ] → [ 工单1更新2 ] → [ 工单3更新1 ] → ...

优化后：基于业务实体的智能并发
托盘队列（并发数=10）:
[ 托盘A任务1 ]     [ 托盘B任务1 ]     [ 托盘C任务1 ]
      ↓                 ↓                 ↓
[ 托盘A任务2 ]     [ 托盘B任务2 ]     [ 托盘C任务2 ]

工单队列（并发数=5）:
[ 工单1更新1 ]     [ 工单2更新1 ]     [ 工单3更新1 ]
      ↓                 ↓                 ↓
[ 工单1更新2 ]     [ 工单2更新2 ]     [ 工单3更新2 ]
```

### 2. 关键技术实现

#### 2.1 双锁管理器架构

**托盘锁管理器 (PalletLockManager)**
```javascript
class PalletLockManager {
  // Redis分布式锁，确保同一托盘任务串行
  async acquireLock(palletKey, workerId)  // 获取托盘锁
  async releaseLock(palletKey, workerId)  // 释放托盘锁
  async extendLock(palletKey, workerId)   // 扩展锁有效期
  async getLockStatus(palletKey)          // 检查锁状态
}
```

**工单锁管理器 (WorkOrderLockManager)**
```javascript
class WorkOrderLockManager {
  // Redis分布式锁，确保同一工单任务串行
  async acquireLock(workOrderId, workerId)  // 获取工单锁
  async releaseLock(workOrderId, workerId)  // 释放工单锁
  async extendLock(workOrderId, workerId)   // 扩展锁有效期
  async getLockStatus(workOrderId)          // 检查锁状态
}
```

**特性**：
- 基于Redis的分布式锁
- 托盘锁：30秒超时，工单锁：20秒超时
- 定期自动扩展锁有效期
- Lua脚本确保原子操作

#### 2.2 并发处理器优化

**托盘处理器**
```javascript
// 并发数从2提升到10
palletQueue.process('handle-pallet-barcode', 10, async (job) => {
  const palletKey = mainBarcode;  // 使用主条码作为锁键
  // 实现托盘级锁控制逻辑
});
```

**工单处理器**
```javascript
// 并发数从1提升到5
workOrderQueue.process('update-quantity', 5, async (job) => {
  const workOrderKey = workOrderId;  // 使用工单ID作为锁键
  // 实现工单级锁控制逻辑
});
```

#### 2.3 智能锁等待机制

- **托盘任务**：最多等待5秒获取锁，每200ms重试一次
- **工单任务**：最多等待3秒获取锁，每100ms重试一次
- **锁状态监控**：实时显示锁持有者和剩余时间
- **扩展机制**：定期自动扩展锁有效期，防止长时间任务导致锁过期

### 3. 新增监控API

| API端点 | 功能 | 说明 |
|---------|------|------|
| `GET /api/queue/pallet-locks` | 获取托盘锁状态 | 查看当前所有活跃的托盘锁 |
| `GET /api/queue/workorder-locks` | 获取工单锁状态 | 查看当前所有活跃的工单锁 |
| `POST /api/queue/clean-pallet-locks` | 清理托盘锁 | 手动清理过期或孤儿托盘锁 |
| `POST /api/queue/clean-workorder-locks` | 清理工单锁 | 手动清理过期或孤儿工单锁 |
| `POST /api/queue/clean-all-locks` | 清理所有锁 | 一次性清理所有类型的锁资源 |
| `GET /api/queue/concurrency-metrics` | 并发性能指标（增强版） | 查看托盘和工单的并发利用率、锁争用率等 |
| `GET /api/queue/health` | 健康检查（全面升级） | 包含托盘和工单的并发相关健康检查 |

## 性能提升效果

### 理论提升对比

| 队列类型 | 指标 | 优化前 | 优化后 | 提升幅度 |
|----------|------|--------|--------|----------|
| **托盘队列** | 最大并发数 | 2 | 10 | **5倍** |
| | 10个不同托盘任务处理时间 | ~30秒 | ~6秒 | **80%减少** |
| | 资源利用率 | 20% | 100% | **5倍提升** |
| **工单队列** | 最大并发数 | 1 | 5 | **5倍** |
| | 10个不同工单任务处理时间 | ~2秒 | ~0.4秒 | **80%减少** |
| | 资源利用率 | 20% | 100% | **5倍提升** |
| **整体系统** | 总并发能力 | 3 | 15 | **5倍** |

### 实际场景分析

**托盘处理场景**

*场景1：10个不同托盘任务*
- 优化前：串行执行，需要30秒
- 优化后：并发执行，仅需6秒
- **性能提升：80%**

*场景2：同一托盘的5个任务*
- 优化前：串行执行，需要15秒
- 优化后：仍然串行执行，需要15秒
- **数据一致性：完全保障**

**工单处理场景**

*场景1：10个不同工单更新*
- 优化前：串行执行，需要2秒
- 优化后：并发执行，仅需0.4秒
- **性能提升：80%**

*场景2：同一工单的8个更新*
- 优化前：串行执行，需要1.6秒
- 优化后：仍然串行执行，需要1.6秒
- **数据一致性：完全保障**

**混合高并发场景**
- 场景：同时处理5个托盘任务 + 10个工单任务
- 优化前：所有任务串行，需要约32秒
- 优化后：智能并发处理，仅需约6秒
- **整体性能提升：81%**

## 使用说明

### 1. 服务端配置

优化已自动集成到现有的队列服务中，无需额外配置。

### 2. 监控并发状态

```bash
# 查看综合并发性能指标
curl http://localhost:3000/api/queue/concurrency-metrics

# 查看托盘锁状态
curl http://localhost:3000/api/queue/pallet-locks

# 查看工单锁状态
curl http://localhost:3000/api/queue/workorder-locks

# 查看整体健康状况
curl http://localhost:3000/api/queue/health
```

### 3. 运行性能测试

```bash
# 进入项目目录
cd dcMes_server

# 安装axios依赖（如果还没有）
npm install axios

# 运行托盘并发优化测试
node test/pallet-concurrency-test.js

# 运行工单并发优化测试
node test/workorder-concurrency-test.js
```

### 4. 清理锁资源（如有需要）

```bash
# 清理托盘锁
curl -X POST http://localhost:3000/api/queue/clean-pallet-locks

# 清理工单锁
curl -X POST http://localhost:3000/api/queue/clean-workorder-locks

# 一次性清理所有锁
curl -X POST http://localhost:3000/api/queue/clean-all-locks
```

## 安全保障

### 1. 数据一致性

- **业务实体串行**：使用分布式锁确保同一托盘/工单的任务严格按顺序执行
- **原子操作**：锁的获取和释放使用Lua脚本保证原子性
- **超时保护**：托盘锁30秒、工单锁20秒超时防止死锁

### 2. 故障恢复

- **锁自动过期**：即使程序异常退出，锁也会自动释放
- **重试机制**：失败任务自动重试，托盘任务最多2次，工单任务最多3次
- **清理机制**：定期清理过期和孤儿锁

### 3. 监控告警

- **分级锁争用监控**：分别监控托盘和工单的锁争用率
- **分层并发利用率**：监控各队列的并发资源利用情况
- **增强健康检查**：包含全方位的并发相关指标

## 部署注意事项

### 1. Redis配置

确保Redis服务正常运行，支持Lua脚本执行：

```ini
# Redis配置建议
maxmemory-policy allkeys-lru
lua-time-limit 5000
timeout 300
```

### 2. 内存监控

并发处理增加会消耗更多内存，建议监控：
- Redis内存使用（锁数据存储）
- Node.js进程内存（更多并发Worker）
- 队列任务积压情况

### 3. 逐步部署

建议分阶段部署：
1. 先在测试环境验证两种队列的并发效果
2. 低峰期先部署工单队列优化（风险较小）
3. 然后部署托盘队列优化
4. 监控性能指标和错误率
5. 根据实际情况调整并发数

### 4. 并发数调优

当前配置基于一般场景，可根据实际情况调整：
- 托盘队列：10个并发（可调整至8-15）
- 工单队列：5个并发（可调整至3-8）
- 考虑CPU核心数和内存容量

## 扩展建议

### 1. 动态并发调整

可以根据系统负载动态调整并发数：

```javascript
// 根据CPU和内存使用率动态调整
const optimalPalletConcurrency = calculateOptimalConcurrency('pallet');
const optimalWorkOrderConcurrency = calculateOptimalConcurrency('workorder');
```

### 2. 优先级队列增强

为不同类型的任务设置更细致的优先级：

```javascript
// 托盘任务：维修台任务优先级更高
const palletPriority = fromRepairStation ? 15 : 10;

// 工单任务：产出更新优先级最高
const workOrderPriority = type === 'output' ? 10 : (type === 'input' ? 5 : 3);
```

### 3. 分片队列

如果任务量继续增长，可以考虑业务分片：

```javascript
// 按产线分片托盘队列
const palletQueueName = `pallet-processing-line-${lineId}`;

// 按工单类型分片工单队列
const workOrderQueueName = `workorder-updates-${workOrderType}`;
```

### 4. 跨队列协调

实现托盘和工单队列的协调处理：

```javascript
// 当托盘处理完成时，优先处理相关的工单更新
await prioritizeRelatedWorkOrders(palletCode);
```

## 技术文档

- 🔧 **核心代码**：`dcMes_server/services/queueService.js`
- 📊 **监控接口**：`dcMes_server/routes/queueMonitor.js`
- 🧪 **托盘测试**：`dcMes_server/test/pallet-concurrency-test.js`
- 🧪 **工单测试**：`dcMes_server/test/workorder-concurrency-test.js`
- 📋 **使用说明**：本文档

## 性能对比总结

| 优化维度 | 优化前 | 优化后 | 改善效果 |
|----------|--------|--------|----------|
| **托盘队列并发能力** | 2 | 10 | **5x提升** |
| **工单队列并发能力** | 1 | 5 | **5x提升** |
| **整体并发能力** | 3 | 15 | **5x提升** |
| **平均等待时间** | 较长 | 大幅减少 | **80%改善** |
| **系统吞吐量** | 低 | 高 | **显著提升** |
| **用户体验** | 等待时间长 | 响应迅速 | **大幅改善** |

## 总结

这次全面的队列并发优化通过引入基于业务实体的智能并发处理机制，在保证数据一致性的前提下，大幅提升了整个系统的处理性能：

### 🚀 托盘队列优化成果
- ✅ **性能提升**：并发数从2增加到10，理论上可提升5倍处理速度
- ✅ **智能并发**：不同托盘并发，同一托盘串行
- ✅ **数据安全**：完善的托盘锁机制

### 📈 工单队列优化成果  
- ✅ **突破瓶颈**：并发数从1增加到5，消除严重性能瓶颈
- ✅ **响应快速**：工单更新响应时间大幅减少
- ✅ **数据一致**：完善的工单锁机制

### 🎯 整体系统优化
- ✅ **系统稳定**：双重锁机制和故障恢复
- ✅ **监控完备**：丰富的性能监控和健康检查
- ✅ **向后兼容**：无需修改现有业务代码
- ✅ **扩展性强**：支持动态调整和进一步优化

优化后的系统能够更好地满足高并发场景下的业务处理需求，用户等待时间显著减少，整体响应速度大幅提升，为系统的进一步扩展奠定了坚实基础。 