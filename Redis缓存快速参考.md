# Redis 缓存快速参考卡

## 🔧 环境配置

```bash
# .env 文件
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 📝 API 使用

### 清除缓存

```javascript
// 清除单个物料
await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);

// 批量清除
await MaterialProcessFlowService.clearBarcodeRuleCache([id1, id2, id3]);

// 清除所有
await MaterialProcessFlowService.clearBarcodeRuleCache();
```

### 查看统计

```javascript
const stats = await MaterialProcessFlowService.getBarcodeRuleCacheStats();
// {
//   connected: true,
//   total: 25,
//   active: 20,
//   db: 3,
//   keyPrefix: "barcode_rule:"
// }
```

## 📋 使用场景

| 操作 | 是否需要清除缓存 | 清除范围 |
|------|-----------------|---------|
| 创建/更新条码规则 | ✅ 是 | 相关物料 |
| 删除条码规则 | ✅ 是 | 相关物料 |
| 启用/禁用规则 | ✅ 是 | 相关物料 |
| 创建产品规则关联 | ✅ 是 | 该产品 |
| 更新全局规则 | ✅ 是 | 所有缓存 |
| 扫描条码 | ❌ 否 | - |
| 查询流程 | ❌ 否 | - |

## 🔍 Redis CLI 命令

```bash
# 连接 Redis
redis-cli -h localhost -p 6379

# 切换到 DB 3
SELECT 3

# 查看所有缓存
KEYS barcode_rule:*

# 查看某个缓存
GET barcode_rule:your_material_id

# 查看剩余时间
TTL barcode_rule:your_material_id

# 删除缓存
DEL barcode_rule:your_material_id

# 清空所有（慎用！）
FLUSHDB
```

## ⚠️ 注意事项

1. **必须使用 await**：所有缓存操作都是异步的
2. **必须在 async 函数中**：调用点需要是异步函数
3. **规则更新后必须清除**：否则会使用旧规则
4. **批量操作优化**：收集 ID 后批量清除

## 🚨 常见错误

### 错误 1：忘记 await

```javascript
// ❌ 错误
MaterialProcessFlowService.clearBarcodeRuleCache(materialId);

// ✅ 正确
await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
```

### 错误 2：不在 async 函数中

```javascript
// ❌ 错误
function myFunction() {
  await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
}

// ✅ 正确
async function myFunction() {
  await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
}
```

### 错误 3：更新规则后忘记清除缓存

```javascript
// ❌ 错误
await BarcodeRule.findByIdAndUpdate(ruleId, data);
res.json({ success: true });

// ✅ 正确
await BarcodeRule.findByIdAndUpdate(ruleId, data);
await MaterialProcessFlowService.clearBarcodeRuleCache(materialIds);
res.json({ success: true });
```

## 📊 性能指标

| 操作 | 无缓存 | Redis 缓存 | 提升 |
|------|--------|-----------|------|
| 查询规则 | 50-100ms | 1-2ms | 98% |
| 缓存时长 | - | 5 分钟 | - |
| 多进程共享 | ❌ | ✅ | - |

## 🔗 相关文档

- [Redis 缓存配置说明](./Redis缓存配置说明.md) - 详细配置
- [Redis 缓存管理指南](./Redis缓存管理指南.md) - 完整指南
- [从内存缓存升级到 Redis](./从内存缓存升级到Redis缓存.md) - 迁移指南

