# Redis 命令超时问题修复指南

## 问题描述

在工单处理队列服务（dcMes_server_plan）中出现 Redis 命令超时错误：

```
❌ 队列错误: Error: Command timed out
    at Timeout._onTimeout (/path/to/ioredis/built/Command.js:192:33)
```

## 问题原因

### 1. commandTimeout 配置过短
- **原配置**: `commandTimeout: 5000` (5秒)
- **问题**: Bull 队列的某些操作（如统计、清理等）可能需要较长时间
- **影响**: 导致 Redis 命令在执行过程中被强制中断

### 2. 缺少重连策略
- **原配置**: 没有配置 `retryStrategy`
- **问题**: Redis 连接失败时不会自动重连
- **影响**: 临时网络问题可能导致服务中断

### 3. 缺少超时保护
- **原实现**: 锁的获取和释放直接调用 Redis 命令
- **问题**: 没有应用层的超时控制
- **影响**: 单个操作卡住可能影响整个队列

## 解决方案

### 1. 增加 commandTimeout 时间

**修改文件**: `dcMes_server_plan/config/redis.js`

```javascript
// 修改前
commandTimeout: 5000

// 修改后
commandTimeout: 30000  // 增加到30秒，与任务超时时间一致
```

**原因**: 
- Bull 队列的某些批量操作需要较长时间
- 与任务超时时间（30秒）保持一致
- 避免正常操作被误判为超时

### 2. 添加重连策略

**修改文件**: `dcMes_server_plan/config/redis.js`

```javascript
// 重连策略
retryStrategy: (times) => {
  if (times > 10) {
    console.error('❌ Redis 重连失败次数过多，停止重连');
    return null; // 停止重连
  }
  const delay = Math.min(times * 200, 2000); // 最大延迟2秒
  console.log(`🔄 Redis 第 ${times} 次重连，延迟 ${delay}ms`);
  return delay;
},

// 自动重连配置
autoResubscribe: true,
autoResendUnfulfilledCommands: true
```

**特点**:
- 指数退避策略，最多重试10次
- 自动重新订阅和重发未完成命令
- 网络恢复后自动恢复服务

### 3. 添加应用层超时保护

**修改文件**: `dcMes_server_plan/services/queueService.js`

#### 3.1 获取锁超时保护

```javascript
async acquireLock(workOrderId, workerId) {
  try {
    // 使用Promise.race实现超时控制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('获取锁超时')), 10000); // 10秒超时
    });
    
    const lockPromise = this.redis.set(...);
    const result = await Promise.race([lockPromise, timeoutPromise]);
    
    // ... 处理结果
  } catch (error) {
    // 超时后返回失败，不会阻塞队列
    return { success: false, error: error.message };
  }
}
```

#### 3.2 释放锁超时保护

```javascript
async releaseLock(workOrderId, workerId) {
  try {
    // 使用Promise.race实现超时控制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('释放锁超时')), 5000); // 5秒超时
    });
    
    const evalPromise = this.redis.eval(script, ...);
    const result = await Promise.race([evalPromise, timeoutPromise]);
    
    // ... 处理结果
  } catch (error) {
    // 即使释放锁失败，锁也会自动过期
    return { success: false, error: error.message };
  }
}
```

### 4. 增强错误日志

**修改文件**: `dcMes_server_plan/services/queueService.js`

```javascript
// 队列错误事件 - 增强错误处理
workOrderQueue.on('error', (error) => {
  console.error('❌ 队列错误:', {
    message: error.message,
    code: error.code,
    command: error.command,
    timestamp: new Date().toISOString()
  });
  
  // 如果是 Redis 超时错误，提供诊断建议
  if (error.message && error.message.includes('timeout')) {
    console.error('⚠️ Redis 命令超时，建议检查：');
    console.error('   1. Redis 服务器是否正常运行');
    console.error('   2. 网络连接是否稳定');
    console.error('   3. Redis 服务器负载是否过高');
    console.error('   4. commandTimeout 配置是否合适');
  }
});
```

## 配置对比

### 修改前（问题配置）

```javascript
// redis.js
{
  commandTimeout: 5000,                  // ❌ 太短
  maxRetriesPerRequest: null,            // ✅ Bull要求
  enableReadyCheck: false,               // ✅ Bull要求
  // 缺少 retryStrategy                  // ❌ 无重连策略
}
```

### 修改后（优化配置）

```javascript
// redis.js
{
  commandTimeout: 30000,                 // ✅ 足够长
  maxRetriesPerRequest: null,            // ✅ Bull要求
  enableReadyCheck: false,               // ✅ Bull要求
  retryStrategy: (times) => {...},       // ✅ 有重连策略
  autoResubscribe: true,                 // ✅ 自动重订阅
  autoResendUnfulfilledCommands: true,   // ✅ 自动重发
}
```

## 测试验证

### 1. 检查服务是否正常启动

```bash
# 重启工单处理服务
cd dcMes_server_plan
npm start
```

**期望输出**:
```
🔗 Redis连接已建立
✅ Redis连接就绪
📦 正在初始化工单更新队列...
✅ 队列 Redis 连接已就绪
✅ 任务处理器已注册（默认处理器）
✅ 事件监听器已设置
✅ 工单更新队列初始化成功
```

### 2. 检查是否还有超时错误

```bash
# 查看日志
tail -f logs/combined.log

# 查找超时错误
grep "Command timed out" logs/combined.log
```

### 3. 测试 Redis 连接

```bash
# 进入 dcMes_server_plan 目录
cd dcMes_server_plan

# 运行 Node.js 测试
node -e "
const { testRedisConnection } = require('./config/redis');
testRedisConnection().then(result => {
  console.log('测试结果:', result ? '✅ 成功' : '❌ 失败');
  process.exit(result ? 0 : 1);
});
"
```

### 4. 压力测试

可以通过批量创建工单更新任务来测试队列在高负载下的表现：

```bash
# 使用 routes/workOrder.js 中的测试接口
curl -X POST http://localhost:3002/api/workorder/test/batch-update \
  -H "Content-Type: application/json" \
  -d '{"count": 100}'
```

## 监控和诊断

### 1. 查看队列状态

```bash
# 通过 API 查看队列统计
curl http://localhost:3002/api/workorder/queue/stats
```

**返回示例**:
```json
{
  "waiting": 5,
  "active": 1,
  "completed": 123,
  "failed": 2,
  "delayed": 0,
  "total": 6
}
```

### 2. 查看锁状态

```bash
# 通过 API 查看锁统计
curl http://localhost:3002/api/workorder/locks/stats
```

### 3. Redis 连接状态

连接到 Redis 查看队列键：

```bash
redis-cli -h localhost -p 6379
> SELECT 4
> KEYS bull:workorder-quantity-updates:*
> INFO clients
> INFO stats
```

## 性能优化建议

### 1. Redis 服务器优化

```bash
# /etc/redis/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
timeout 300
tcp-keepalive 60
```

### 2. 队列配置优化

根据实际情况调整并发数：

```javascript
// config/redis.js
processor: {
  concurrency: 1,  // 串行处理，避免竞态
  name: 'update-quantity'
}
```

### 3. 监控告警

建议添加监控告警：
- Redis 连接失败次数
- 队列积压数量
- 任务失败率
- 平均处理时间

## 常见问题

### Q1: 修改后仍然偶尔超时怎么办？

**A**: 检查以下几点：
1. Redis 服务器是否资源不足（CPU、内存）
2. 网络延迟是否过高
3. 是否有其他服务在争用 Redis
4. 考虑进一步增加 `commandTimeout`

### Q2: 如何确认 Redis 连接稳定？

**A**: 查看日志中的连接事件：
```bash
# 查找重连日志
grep "Redis正在重连" logs/combined.log

# 如果频繁重连，说明网络或 Redis 服务器有问题
```

### Q3: 锁超时是否会导致数据不一致？

**A**: 不会，因为：
1. 锁有自动过期时间（30秒）
2. 使用 Lua 脚本确保原子性操作
3. 即使释放锁失败，锁也会自动过期
4. 队列会自动重试失败的任务

### Q4: 如何调整超时时间？

**A**: 根据实际情况调整：

```javascript
// redis.js - Redis 命令超时
commandTimeout: 30000  // 30秒，可根据需要调整

// queueService.js - 获取锁超时
setTimeout(() => reject(new Error('获取锁超时')), 10000)  // 10秒

// queueService.js - 释放锁超时
setTimeout(() => reject(new Error('释放锁超时')), 5000)   // 5秒

// queueService.js - 任务超时
timeout: 30000  // 30秒
```

## 相关文档

- [Bull 队列配置文档](https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md)
- [ioredis 配置文档](https://github.com/redis/ioredis#connect-to-redis)
- [Redis 性能优化指南](https://redis.io/topics/optimization)

## 更新日志

- **2024-11-03**: 
  - 增加 commandTimeout 从 5秒 到 30秒
  - 添加 retryStrategy 重连策略
  - 为锁操作添加应用层超时保护
  - 增强错误日志和诊断信息

---

**维护者**: 德昌 MES 系统开发团队  
**最后更新**: 2024-11-03

