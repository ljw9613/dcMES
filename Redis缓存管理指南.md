# Redis 缓存管理指南

## 🎯 核心变更

系统已从 **内存缓存** 升级为 **Redis 缓存**，以支持 PM2 负载均衡环境。

## ✨ 主要优势

| 特性 | 内存缓存（旧） | Redis 缓存（新） |
|------|---------------|-----------------|
| 多进程共享 | ❌ 各进程独立 | ✅ 全局共享 |
| 数据一致性 | ❌ 可能不一致 | ✅ 完全一致 |
| 缓存清除 | ❌ 需逐个进程 | ✅ 一次清除全部 |
| PM2 兼容性 | ⚠️ 部分支持 | ✅ 完全支持 |

## 📋 快速开始

### 1. 环境配置

在 `.env` 文件中配置 Redis 连接：

```bash
REDIS_HOST=localhost        # Redis 服务器地址
REDIS_PORT=6379             # Redis 端口
REDIS_PASSWORD=             # Redis 密码（可选）
```

### 2. 缓存清除 API

#### 清除单个物料缓存

```javascript
// 当更新物料条码规则时
const result = await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
console.log(result);
// {
//   success: true,
//   message: "已清除物料 xxx 的条码规则缓存",
//   type: "single",
//   count: 1
// }
```

#### 批量清除多个物料缓存

```javascript
// 批量更新时
const materialIds = ['id1', 'id2', 'id3'];
const result = await MaterialProcessFlowService.clearBarcodeRuleCache(materialIds);
console.log(result);
// {
//   success: true,
//   message: "已清除 3 个物料的条码规则缓存",
//   type: "batch",
//   count: 3
// }
```

#### 清除所有缓存

```javascript
// 更新全局规则时
const result = await MaterialProcessFlowService.clearBarcodeRuleCache();
console.log(result);
// {
//   success: true,
//   message: "已清除所有条码规则缓存",
//   type: "all",
//   count: 25
// }
```

### 3. 查看缓存统计

```javascript
const stats = await MaterialProcessFlowService.getBarcodeRuleCacheStats();
console.log(stats);
// {
//   connected: true,
//   total: 25,
//   active: 20,
//   expired: 5,
//   cacheTimeout: "300秒",
//   db: 3,
//   keyPrefix: "barcode_rule:"
// }
```

## 🔧 使用场景

### 场景 1：创建/更新条码规则

```javascript
// routes/barcodeRule.js
router.put('/api/barcode-rules/:ruleId', async (req, res) => {
  try {
    // 1. 更新规则
    await BarcodeRule.findByIdAndUpdate(req.params.ruleId, req.body);
    
    // 2. 获取受影响的物料
    const materials = await getAffectedMaterials(req.params.ruleId);
    const materialIds = materials.map(m => m._id);
    
    // 3. 清除缓存（重要！）
    await MaterialProcessFlowService.clearBarcodeRuleCache(materialIds);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 场景 2：创建/更新产品条码规则关联

```javascript
// routes/productBarcodeRule.js
router.post('/api/product-barcode-rules', async (req, res) => {
  try {
    // 1. 创建关联
    await ProductBarcodeRule.create(req.body);
    
    // 2. 清除该产品的缓存（重要！）
    await MaterialProcessFlowService.clearBarcodeRuleCache(req.body.productId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 场景 3：删除条码规则

```javascript
// routes/barcodeRule.js
router.delete('/api/barcode-rules/:ruleId', async (req, res) => {
  try {
    // 1. 删除规则
    await BarcodeRule.findByIdAndDelete(req.params.ruleId);
    
    // 2. 如果是全局规则，清除所有缓存
    const rule = await BarcodeRule.findById(req.params.ruleId);
    if (rule.isGlobal) {
      await MaterialProcessFlowService.clearBarcodeRuleCache();
    } else {
      // 否则只清除相关物料的缓存
      const materials = await getAffectedMaterials(req.params.ruleId);
      const materialIds = materials.map(m => m._id);
      await MaterialProcessFlowService.clearBarcodeRuleCache(materialIds);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 场景 4：启用/禁用条码规则

```javascript
// routes/barcodeRule.js
router.patch('/api/barcode-rules/:ruleId/toggle', async (req, res) => {
  try {
    // 1. 切换启用状态
    const rule = await BarcodeRule.findById(req.params.ruleId);
    rule.enabled = !rule.enabled;
    await rule.save();
    
    // 2. 清除相关缓存（重要！）
    if (rule.isGlobal) {
      await MaterialProcessFlowService.clearBarcodeRuleCache();
    } else {
      const materials = await getAffectedMaterials(req.params.ruleId);
      const materialIds = materials.map(m => m._id);
      await MaterialProcessFlowService.clearBarcodeRuleCache(materialIds);
    }
    
    res.json({ success: true, enabled: rule.enabled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📊 监控与维护

### Redis CLI 操作

```bash
# 连接 Redis
redis-cli -h localhost -p 6379

# 切换到 DB 3
SELECT 3

# 查看所有条码规则缓存
KEYS barcode_rule:*

# 查看特定物料的缓存
GET barcode_rule:64a1b2c3d4e5f6789012345

# 查看缓存剩余时间
TTL barcode_rule:64a1b2c3d4e5f6789012345

# 手动删除缓存
DEL barcode_rule:64a1b2c3d4e5f6789012345

# 查看 DB 3 的键数量
DBSIZE

# 清空 DB 3（慎用！）
FLUSHDB
```

### 健康检查

```javascript
// routes/health.js
router.get('/api/health/cache', async (req, res) => {
  try {
    const stats = await MaterialProcessFlowService.getBarcodeRuleCacheStats();
    
    res.json({
      status: stats.connected ? 'healthy' : 'degraded',
      cache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});
```

### 定期统计

```javascript
// 每小时记录一次缓存统计
setInterval(async () => {
  try {
    const stats = await MaterialProcessFlowService.getBarcodeRuleCacheStats();
    console.log('📊 缓存统计:', {
      时间: new Date().toISOString(),
      连接状态: stats.connected ? '正常' : '异常',
      总键数: stats.total,
      活跃键数: stats.active,
      已过期键数: stats.expired
    });
    
    // 告警检查
    if (!stats.connected) {
      console.error('⚠️ Redis 缓存未连接！');
      // 发送告警通知
    }
    if (stats.total > 10000) {
      console.warn('⚠️ 缓存键数量过多:', stats.total);
      // 发送告警通知
    }
  } catch (error) {
    console.error('❌ 获取缓存统计失败:', error.message);
  }
}, 60 * 60 * 1000); // 每小时
```

## ⚠️ 重要注意事项

### 1. 务必清除缓存

在以下操作后，**必须**清除相关缓存：

- ✅ 创建条码规则
- ✅ 更新条码规则
- ✅ 删除条码规则
- ✅ 启用/禁用条码规则
- ✅ 创建产品条码规则关联
- ✅ 更新产品条码规则关联
- ✅ 删除产品条码规则关联
- ✅ 修改物料的条码配置

### 2. 异步操作

所有缓存操作都是异步的，必须使用 `await`：

```javascript
// ❌ 错误：忘记 await
MaterialProcessFlowService.clearBarcodeRuleCache(materialId);

// ✅ 正确：使用 await
await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
```

### 3. 异常处理

缓存操作失败不应影响主流程：

```javascript
try {
  // 主业务逻辑
  await BarcodeRule.findByIdAndUpdate(ruleId, data);
  
  // 清除缓存（失败不影响主流程）
  try {
    await MaterialProcessFlowService.clearBarcodeRuleCache(materialIds);
  } catch (cacheError) {
    console.error('清除缓存失败:', cacheError.message);
    // 不抛出异常，允许主流程继续
  }
  
  res.json({ success: true });
} catch (error) {
  res.status(500).json({ error: error.message });
}
```

### 4. 批量操作优化

批量更新时，收集所有 ID 后一次性清除：

```javascript
// ❌ 不推荐：逐个清除（N 次 Redis 操作）
for (const materialId of materialIds) {
  await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
}

// ✅ 推荐：批量清除（1 次 Redis 操作）
await MaterialProcessFlowService.clearBarcodeRuleCache(materialIds);
```

## 🔍 故障排查

### 问题 1：Redis 连接失败

**症状**：
```
❌ 初始化条码规则缓存 Redis 失败: connect ECONNREFUSED
⚠️ 将使用内存缓存作为降级方案
```

**解决方法**：

1. 检查 Redis 服务：
```bash
redis-cli ping
# 应返回: PONG
```

2. 检查环境变量：
```bash
echo $REDIS_HOST
echo $REDIS_PORT
echo $REDIS_PASSWORD
```

3. 重启 Redis 服务：
```bash
# macOS
brew services restart redis

# Linux
sudo systemctl restart redis

# Docker
docker restart redis-container
```

### 问题 2：缓存未生效

**症状**：更新规则后，系统仍使用旧规则

**解决方法**：

1. 检查是否调用了清除缓存：
```javascript
// 确保在更新规则后调用
await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
```

2. 手动清除所有缓存：
```javascript
await MaterialProcessFlowService.clearBarcodeRuleCache();
```

3. 使用 Redis CLI 检查：
```bash
redis-cli -h localhost -p 6379
SELECT 3
KEYS barcode_rule:*
DEL barcode_rule:your_material_id
```

### 问题 3：缓存数量过多

**症状**：Redis 内存持续增长

**解决方法**：

1. 检查缓存键数量：
```bash
redis-cli -h localhost -p 6379
SELECT 3
DBSIZE
```

2. 查找没有过期时间的键：
```bash
redis-cli --scan --pattern "barcode_rule:*" | while read key; do
  ttl=$(redis-cli -n 3 ttl "$key")
  if [ "$ttl" -eq "-1" ]; then
    echo "$key 没有过期时间"
  fi
done
```

3. 如果必要，手动清理：
```bash
redis-cli -h localhost -p 6379
SELECT 3
FLUSHDB  # 慎用：清空整个 DB 3
```

## 📈 性能对比

### 响应时间对比

| 操作 | 无缓存 | 内存缓存 | Redis 缓存 |
|------|--------|----------|-----------|
| 首次查询 | 50-100ms | 50-100ms | 50-100ms |
| 缓存命中 | - | ~0.01ms | ~1-2ms |
| 性能提升 | - | 99.99% ⬆️ | 98% ⬆️ |

### PM2 集群环境

| 特性 | 内存缓存 | Redis 缓存 |
|------|----------|-----------|
| 进程 1 清除缓存 | ❌ 仅进程 1 生效 | ✅ 所有进程生效 |
| 进程 2 读取数据 | ⚠️ 可能读到旧数据 | ✅ 立即读到新数据 |
| 缓存命中率 | 低（各进程独立） | 高（全局共享） |
| 数据一致性 | ❌ 可能不一致 | ✅ 完全一致 |

## 🎓 最佳实践总结

1. **✅ 及时清除缓存**：规则更新后立即清除
2. **✅ 批量操作优化**：收集 ID 后批量清除
3. **✅ 异常处理**：缓存错误不影响主流程
4. **✅ 监控告警**：定期检查缓存健康
5. **✅ 测试验证**：更新后测试缓存是否生效

## 📚 相关文档

- [Redis 缓存配置说明](./Redis缓存配置说明.md)
- [性能优化实施总结](./性能优化实施总结.md)
- [PM2 部署指南](./PM2部署指南.md)

