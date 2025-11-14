# Redis 缓存配置说明

## 概述

条码规则缓存已从内存缓存升级为 **Redis 缓存**，以支持 PM2 负载均衡环境下的多进程缓存共享。

## 架构设计

### Redis 数据库划分

为避免不同服务之间的缓存冲突，系统使用了不同的 Redis 数据库：

| 服务 | Redis DB | 用途 | 配置文件 |
|------|----------|------|----------|
| 队列服务 | DB 2 | 工单数量更新队列 | `dcMes_server/config/redis.js` |
| **条码规则缓存** | **DB 3** | **条码规则缓存存储** | `materialProcessFlowService.js` |

### 缓存键命名规范

- **键前缀**: `barcode_rule:`
- **键格式**: `barcode_rule:{materialId}`
- **示例**: `barcode_rule:64a1b2c3d4e5f6789012345`

### 缓存过期时间

- **默认**: 5 分钟（300 秒）
- **自动清理**: Redis 自动清理过期键
- **手动清理**: 提供 API 接口手动清除缓存

## 环境配置

### 环境变量

在 `.env` 文件或环境变量中配置：

```bash
# Redis 连接配置
REDIS_HOST=localhost        # Redis 服务器地址
REDIS_PORT=6379             # Redis 端口
REDIS_PASSWORD=             # Redis 密码（可选）
```

### 开发环境配置示例

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
# 无密码
```

### 生产环境配置示例

```bash
REDIS_HOST=192.168.1.100
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password
```

## 功能特性

### 1. 自动连接管理

```javascript
// 服务启动时自动连接 Redis
class BarcodeRuleCache {
  constructor() {
    this.initRedis();  // 自动初始化连接
  }
}
```

### 2. 连接状态监控

系统会自动记录 Redis 连接状态：

```
🔗 条码规则缓存 Redis 连接已建立 (DB 3)
✅ 条码规则缓存 Redis 连接就绪 (DB 3)
```

### 3. 故障降级

当 Redis 连接失败时，系统会自动降级处理：

```
⚠️ 条码规则缓存 Redis 连接错误，将使用内存缓存
```

**注意**：降级模式下，每次请求都会查询数据库，性能会下降。

## 缓存管理 API

### 1. 清除单个物料的缓存

```javascript
// 当某个物料的条码规则更新时
await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
```

**返回结果**：
```json
{
  "success": true,
  "message": "已清除物料 64a1b2c3d4e5f6789012345 的条码规则缓存",
  "type": "single",
  "materialId": "64a1b2c3d4e5f6789012345",
  "count": 1
}
```

### 2. 批量清除多个物料的缓存

```javascript
// 批量更新多个物料的条码规则时
const materialIds = ['id1', 'id2', 'id3'];
await MaterialProcessFlowService.clearBarcodeRuleCache(materialIds);
```

**返回结果**：
```json
{
  "success": true,
  "message": "已清除 3 个物料的条码规则缓存",
  "type": "batch",
  "count": 3
}
```

### 3. 清除所有缓存

```javascript
// 全局条码规则更新时
await MaterialProcessFlowService.clearBarcodeRuleCache();
// 或
await MaterialProcessFlowService.clearBarcodeRuleCache(null);
```

**返回结果**：
```json
{
  "success": true,
  "message": "已清除所有条码规则缓存",
  "type": "all",
  "count": 25
}
```

### 4. 获取缓存统计信息

```javascript
const stats = await MaterialProcessFlowService.getBarcodeRuleCacheStats();
console.log(stats);
```

**返回结果**：
```json
{
  "connected": true,
  "total": 25,
  "active": 20,
  "expired": 5,
  "cacheTimeout": "300秒",
  "db": 3,
  "keyPrefix": "barcode_rule:"
}
```

## 使用场景

### 场景 1：条码规则更新

**触发时机**：管理员在后台更新了条码规则

**处理方式**：

```javascript
// 在条码规则更新的 API 中
router.put('/api/barcode-rules/:ruleId', async (req, res) => {
  try {
    // 更新规则
    await BarcodeRule.findByIdAndUpdate(req.params.ruleId, req.body);
    
    // 清除相关物料的缓存
    const affectedMaterialIds = await getAffectedMaterialIds(req.params.ruleId);
    await MaterialProcessFlowService.clearBarcodeRuleCache(affectedMaterialIds);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 场景 2：产品条码规则更新

**触发时机**：管理员为某个产品配置了新的条码规则

**处理方式**：

```javascript
// 在产品条码规则更新的 API 中
router.post('/api/product-barcode-rules', async (req, res) => {
  try {
    // 创建产品条码规则关联
    await ProductBarcodeRule.create(req.body);
    
    // 清除该产品的缓存
    await MaterialProcessFlowService.clearBarcodeRuleCache(req.body.productId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 场景 3：全局规则更新

**触发时机**：管理员更新了全局条码规则

**处理方式**：

```javascript
// 在全局规则更新的 API 中
router.put('/api/global-barcode-rules/:ruleId', async (req, res) => {
  try {
    // 更新全局规则
    await BarcodeRule.findByIdAndUpdate(req.params.ruleId, req.body);
    
    // 清除所有缓存（因为全局规则影响所有物料）
    await MaterialProcessFlowService.clearBarcodeRuleCache();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 场景 4：定期检查缓存状态

**触发时机**：系统监控或健康检查

**处理方式**：

```javascript
// 在健康检查 API 中
router.get('/api/health/cache', async (req, res) => {
  try {
    const stats = await MaterialProcessFlowService.getBarcodeRuleCacheStats();
    
    res.json({
      status: stats.connected ? 'healthy' : 'degraded',
      cache: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## PM2 集群模式优势

### 多进程缓存共享

在 PM2 集群模式下，所有进程共享同一个 Redis 缓存：

```
┌─────────────────────────────────────────┐
│           Nginx / Load Balancer          │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼───┐  ┌───▼────┐ ┌───▼────┐
   │ PM2-1  │  │ PM2-2  │ │ PM2-3  │
   └────┬───┘  └───┬────┘ └───┬────┘
        │          │          │
        └──────────┼──────────┘
                   │
            ┌──────▼──────┐
            │  Redis DB 3 │  ← 共享缓存
            │  (缓存中心)  │
            └─────────────┘
```

### 性能提升

1. **缓存命中率**：多个进程共享缓存，命中率更高
2. **数据一致性**：所有进程看到的缓存数据一致
3. **即时更新**：清除缓存后，所有进程立即生效

### 与内存缓存的对比

| 特性 | 内存缓存 | Redis 缓存 |
|------|----------|-----------|
| 多进程共享 | ❌ 不支持 | ✅ 支持 |
| 数据一致性 | ❌ 各进程独立 | ✅ 统一一致 |
| 缓存清除 | ❌ 需逐个进程 | ✅ 一次清除全部 |
| 性能 | 🚀 最快 | 🔥 很快 |
| 内存占用 | 📈 每进程占用 | 📉 共享占用 |
| 持久化 | ❌ 进程重启丢失 | ✅ 可配置持久化 |

## 监控与维护

### 查看 Redis 数据

使用 Redis CLI 连接到 DB 3：

```bash
# 连接 Redis
redis-cli -h localhost -p 6379

# 切换到 DB 3
SELECT 3

# 查看所有条码规则缓存键
KEYS barcode_rule:*

# 查看某个键的值
GET barcode_rule:64a1b2c3d4e5f6789012345

# 查看某个键的剩余过期时间（秒）
TTL barcode_rule:64a1b2c3d4e5f6789012345

# 手动删除某个键
DEL barcode_rule:64a1b2c3d4e5f6789012345

# 清空 DB 3 所有数据（慎用！）
FLUSHDB
```

### 日志监控

系统会自动记录以下日志：

```
🔗 条码规则缓存 Redis 连接已建立 (DB 3)
✅ 条码规则缓存 Redis 连接就绪 (DB 3)
🗑️ 已清除物料 64a1b2c3d4e5f6789012345 的条码规则缓存
🗑️ 已清除所有条码规则缓存 (共 25 项)
🧹 Redis 自动过期清理: 5 项 (总计: 25)
⚠️ Redis 获取缓存失败，跳过缓存: Connection refused
❌ Redis 连接错误: ECONNREFUSED
```

### 性能监控指标

使用 Redis INFO 命令监控性能：

```bash
redis-cli -h localhost -p 6379 INFO stats

# 关注以下指标：
# - total_commands_processed: 总命令数
# - instantaneous_ops_per_sec: 每秒操作数
# - keyspace_hits: 缓存命中次数
# - keyspace_misses: 缓存未命中次数
# - used_memory_human: 内存使用
```

## 故障排查

### 问题 1：Redis 连接失败

**症状**：
```
❌ 初始化条码规则缓存 Redis 失败: connect ECONNREFUSED 127.0.0.1:6379
⚠️ 将使用内存缓存作为降级方案
```

**排查步骤**：

1. 检查 Redis 服务是否运行：
```bash
redis-cli ping
# 应返回: PONG
```

2. 检查环境变量配置：
```bash
echo $REDIS_HOST
echo $REDIS_PORT
```

3. 检查网络连接：
```bash
telnet localhost 6379
```

### 问题 2：缓存未生效

**症状**：更新了条码规则，但系统仍使用旧规则

**排查步骤**：

1. 检查是否调用了清除缓存方法
2. 查看 Redis 中的缓存键：
```bash
redis-cli -h localhost -p 6379
SELECT 3
KEYS barcode_rule:*
```

3. 检查缓存过期时间：
```bash
TTL barcode_rule:your_material_id
```

4. 手动清除缓存测试：
```javascript
await MaterialProcessFlowService.clearBarcodeRuleCache();
```

### 问题 3：Redis 内存占用过高

**症状**：Redis 内存持续增长

**排查步骤**：

1. 检查缓存键数量：
```bash
redis-cli -h localhost -p 6379
SELECT 3
DBSIZE
```

2. 检查是否有键没有设置过期时间：
```bash
# 查找没有过期时间的键
redis-cli --scan --pattern "barcode_rule:*" | while read key; do
  ttl=$(redis-cli ttl "$key")
  if [ "$ttl" -eq "-1" ]; then
    echo "$key has no expiration"
  fi
done
```

3. 如果确实存在无过期时间的键，手动设置：
```bash
EXPIRE barcode_rule:your_material_id 300
```

## 最佳实践

### 1. 及时清除缓存

在以下操作后，务必清除相关缓存：
- ✅ 创建/更新/删除条码规则
- ✅ 创建/更新/删除产品条码规则关联
- ✅ 修改物料的条码配置

### 2. 批量操作优化

批量更新时，收集所有受影响的物料 ID 后一次性清除：

```javascript
// ❌ 不推荐：逐个清除
for (const materialId of materialIds) {
  await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
}

// ✅ 推荐：批量清除
await MaterialProcessFlowService.clearBarcodeRuleCache(materialIds);
```

### 3. 监控缓存健康

定期检查缓存统计：

```javascript
// 每小时检查一次
setInterval(async () => {
  const stats = await MaterialProcessFlowService.getBarcodeRuleCacheStats();
  if (!stats.connected) {
    console.error('⚠️ Redis 缓存未连接！');
    // 发送告警
  }
  if (stats.total > 10000) {
    console.warn('⚠️ 缓存数量过多，可能存在内存泄漏');
    // 发送告警
  }
}, 60 * 60 * 1000);
```

### 4. 合理设置缓存时间

当前缓存时间为 5 分钟，可根据实际情况调整：

```javascript
class BarcodeRuleCache {
  constructor() {
    // 根据业务需求调整
    this.cacheTimeout = 5 * 60;  // 5分钟
    // 或
    // this.cacheTimeout = 10 * 60;  // 10分钟
  }
}
```

**建议**：
- 条码规则变化频繁：设置 3-5 分钟
- 条码规则较稳定：设置 10-15 分钟
- 生产环境稳定运行：设置 15-30 分钟

### 5. 异常处理

所有缓存操作都应包含异常处理：

```javascript
try {
  await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
} catch (error) {
  console.error('清除缓存失败:', error);
  // 不要让缓存错误影响主流程
}
```

## 总结

### 主要优势

1. **✅ 支持 PM2 集群**：多进程共享缓存
2. **✅ 数据一致性**：所有进程看到相同的缓存
3. **✅ 即时更新**：清除缓存后立即生效
4. **✅ 故障降级**：Redis 失败时自动降级
5. **✅ 灵活管理**：提供完整的缓存管理 API

### 注意事项

1. **⚠️ Redis 依赖**：需要确保 Redis 服务稳定运行
2. **⚠️ 网络延迟**：Redis 操作有网络开销（约 1-2ms）
3. **⚠️ 及时清除**：规则更新后务必清除缓存
4. **⚠️ 监控告警**：建议配置 Redis 连接状态监控

### 性能对比

| 操作 | 内存缓存 | Redis 缓存 | 数据库查询 |
|------|----------|-----------|-----------|
| 读取规则 | ~0.01ms | ~1-2ms | ~50-100ms |
| 写入规则 | ~0.01ms | ~1-2ms | ~100-200ms |
| 多进程共享 | ❌ | ✅ | ✅ |
| 即时一致性 | ❌ | ✅ | ✅ |

**结论**：Redis 缓存在 PM2 集群环境下是最佳选择，兼顾了性能和一致性。

