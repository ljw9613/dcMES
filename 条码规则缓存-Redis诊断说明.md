# 条码规则缓存 - Redis 诊断说明

## 📋 当前实现

**条码规则缓存已经使用 Redis 存储**，不是内存存储。具体配置如下：

- **存储位置**: Redis DB 3
- **缓存键前缀**: `barcode_rule:`
- **缓存过期时间**: 5 分钟（300 秒）
- **连接方式**: ioredis 独立连接

## 🔍 诊断步骤

### 1. 检查 Redis 连接健康状态

```bash
# 访问健康检查接口
curl http://localhost:3000/api/barcode-rule-cache/health
```

**返回示例（连接正常）**:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "redisExists": true,
    "config": {
      "host": "localhost",
      "port": 6379,
      "db": 3,
      "cacheTimeout": "300秒",
      "keyPrefix": "barcode_rule:"
    },
    "test": {
      "success": true,
      "message": "Redis 读写测试成功",
      "writeSuccess": true,
      "readSuccess": true,
      "deleteSuccess": true
    },
    "serverInfo": {
      "redis_version": "7.0.12",
      "redis_mode": "standalone",
      "uptime_in_seconds": "12345"
    }
  }
}
```

**返回示例（连接失败）**:
```json
{
  "success": true,
  "data": {
    "connected": false,
    "redisExists": true,
    "config": {
      "host": "localhost",
      "port": 6379,
      "db": 3,
      "cacheTimeout": "300秒",
      "keyPrefix": "barcode_rule:"
    },
    "test": {
      "success": false,
      "message": "Redis 未连接，无法进行测试",
      "reason": "Redis 连接状态为 false"
    }
  }
}
```

### 2. 查看缓存统计信息

```bash
# 访问统计接口
curl http://localhost:3000/api/barcode-rule-cache/stats
```

**返回示例**:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "total": 25,
    "active": 25,
    "expired": 0,
    "cacheTimeout": "300秒",
    "db": 3,
    "keyPrefix": "barcode_rule:"
  }
}
```

### 3. 清除缓存测试

```bash
# 清除指定物料的缓存
curl "http://localhost:3000/api/v1/clearBarcodeRuleCache?materialId=123456"

# 清除所有缓存
curl "http://localhost:3000/api/v1/clearBarcodeRuleCache"
```

## 🔧 常见问题排查

### 问题 1: Redis 未连接 (connected: false)

**可能原因**:
1. Redis 服务未启动
2. Redis 连接配置不正确
3. 网络问题

**解决方法**:

#### 检查 Redis 服务状态
```bash
# 检查 Redis 是否运行
redis-cli ping
# 应该返回: PONG

# 查看 Redis 进程
ps aux | grep redis

# 启动 Redis（如果未运行）
redis-server
```

#### 检查 Redis 连接配置
```bash
# 检查环境变量
echo $REDIS_HOST
echo $REDIS_PORT
echo $REDIS_PASSWORD
```

#### 测试 Redis 连接
```bash
# 使用 redis-cli 测试连接
redis-cli -h localhost -p 6379

# 进入 redis-cli 后，切换到 DB 3
SELECT 3

# 查看所有条码规则缓存键
KEYS barcode_rule:*
```

### 问题 2: 看不到缓存数据

**可能原因**:
1. 缓存尚未生成（首次查询会创建缓存）
2. 缓存已过期（5分钟后自动过期）
3. Redis 连接失败，退化到无缓存模式

**验证方法**:

#### 1. 触发缓存生成
```bash
# 执行一次条码扫描或创建流程操作，会自动触发缓存生成
# 然后查看 Redis 中的数据

redis-cli
SELECT 3
KEYS barcode_rule:*
```

#### 2. 查看缓存内容
```bash
# 在 redis-cli 中查看某个物料的缓存
GET barcode_rule:123456

# 查看缓存 TTL（剩余过期时间）
TTL barcode_rule:123456
# 返回剩余秒数，-1 表示永不过期，-2 表示不存在
```

#### 3. 监控 Redis 操作
```bash
# 在 redis-cli 中监控所有操作
MONITOR
# 然后在应用中操作，观察 Redis 命令执行情况
```

### 问题 3: 环境变量配置

如果 Redis 不在本地或使用非默认配置，需要设置环境变量：

```bash
# 在 .env 文件中添加
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # 如果有密码
```

或者在启动脚本中设置：

```bash
# 使用 PM2
pm2 start app.js --update-env -e REDIS_HOST=localhost -e REDIS_PORT=6379

# 直接运行
REDIS_HOST=localhost REDIS_PORT=6379 node app.js
```

## 📊 查看日志输出

启动应用后，观察控制台日志：

**正常连接**:
```
🔗 条码规则缓存 Redis 连接已建立 (DB 3)
✅ 条码规则缓存 Redis 连接就绪 (DB 3)
```

**连接错误**:
```
⚠️ 条码规则缓存 Redis 连接错误，将使用内存缓存: [错误信息]
```

**缓存操作**:
```
🗑️ 已清除物料 123456 的条码规则缓存
🗑️ 已清除所有条码规则缓存 (共 25 项)
```

## 🎯 完整测试流程

1. **检查 Redis 服务**
   ```bash
   redis-cli ping
   ```

2. **查看健康状态**
   ```bash
   curl http://localhost:3000/api/barcode-rule-cache/health
   ```

3. **执行业务操作**（触发缓存生成）
   - 创建流程
   - 扫描条码
   - 查询物料工艺

4. **验证缓存数据**
   ```bash
   redis-cli
   SELECT 3
   KEYS barcode_rule:*
   GET barcode_rule:[物料ID]
   ```

5. **查看缓存统计**
   ```bash
   curl http://localhost:3000/api/barcode-rule-cache/stats
   ```

6. **清除缓存测试**
   ```bash
   curl "http://localhost:3000/api/v1/clearBarcodeRuleCache"
   ```

## 📝 代码实现位置

- **缓存类**: `dcMes_server/services/materialProcessFlowService.js` (第 29-284 行)
- **API 路由**: `dcMes_server/routes/barcodeRule.js`
- **服务方法**: `MaterialProcessFlowService.clearBarcodeRuleCache()`

## 🔄 缓存工作流程

1. **首次查询**: 查询数据库 → 存入 Redis（5分钟过期）→ 返回数据
2. **再次查询**: 从 Redis 读取 → 直接返回（无需查数据库）
3. **缓存过期**: Redis 自动删除 → 下次查询重新生成
4. **手动清除**: 调用清除接口 → Redis 删除 → 下次查询重新生成

## ⚠️ 注意事项

1. **多进程环境**: 使用 Redis 确保多个 PM2 进程共享同一缓存
2. **缓存时效**: 5 分钟自动过期，规则更新后需手动清除
3. **降级策略**: Redis 连接失败时，自动降级为无缓存模式（每次查询数据库）
4. **独立 DB**: 使用 DB 3，不影响其他 Redis 服务（如队列服务的 DB 2）

---

如有问题，请查看应用日志或联系技术支持。

