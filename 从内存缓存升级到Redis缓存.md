# 从内存缓存升级到 Redis 缓存 - 迁移指南

## 📋 升级概述

系统已成功从**内存缓存**升级为 **Redis 缓存**，以更好地支持 PM2 负载均衡环境。

### 升级优势

| 特性 | 升级前（内存缓存） | 升级后（Redis 缓存） |
|------|-------------------|---------------------|
| 多进程支持 | ❌ 各进程独立缓存 | ✅ 全局共享缓存 |
| 数据一致性 | ⚠️ 可能不一致 | ✅ 完全一致 |
| 缓存清除 | ⚠️ 需要等待各进程自动过期 | ✅ 一次清除，立即生效 |
| PM2 兼容性 | ⚠️ 部分支持 | ✅ 完全支持 |
| 性能 | 🚀 最快（0.01ms） | 🔥 很快（1-2ms） |

### 主要变更

1. **缓存存储**：从进程内存 → Redis DB 3
2. **API 调用**：同步方法 → 异步方法（需要 `await`）
3. **缓存键**：内存 Map → Redis 字符串（`barcode_rule:{materialId}`）
4. **过期机制**：定时清理 → Redis 自动过期

## 🔧 环境准备

### 1. 确保 Redis 已安装并运行

#### macOS

```bash
# 安装 Redis
brew install redis

# 启动 Redis 服务
brew services start redis

# 验证 Redis 是否运行
redis-cli ping
# 应返回: PONG
```

#### Linux (Ubuntu/Debian)

```bash
# 安装 Redis
sudo apt update
sudo apt install redis-server

# 启动 Redis 服务
sudo systemctl start redis

# 设置开机自启
sudo systemctl enable redis

# 验证 Redis 是否运行
redis-cli ping
# 应返回: PONG
```

#### Docker

```bash
# 拉取 Redis 镜像
docker pull redis:latest

# 运行 Redis 容器
docker run -d \
  --name redis-cache \
  -p 6379:6379 \
  redis:latest

# 验证 Redis 是否运行
docker exec -it redis-cache redis-cli ping
# 应返回: PONG
```

### 2. 配置环境变量

在项目根目录的 `.env` 文件中添加或确认以下配置：

```bash
# Redis 连接配置
REDIS_HOST=localhost        # Redis 服务器地址
REDIS_PORT=6379             # Redis 端口
REDIS_PASSWORD=             # Redis 密码（如果设置了密码）
```

**开发环境示例**：
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
# 无密码
```

**生产环境示例**：
```bash
REDIS_HOST=192.168.1.100
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password_here
```

### 3. 安装依赖（如果尚未安装）

```bash
# 进入服务端目录
cd dcMes_server

# 安装 ioredis（Redis 客户端）
npm install ioredis

# 或使用 yarn
yarn add ioredis
```

## 🚀 代码迁移

### 变更 1：API 调用变为异步

**升级前（同步调用）**：
```javascript
// ❌ 旧代码
MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
```

**升级后（异步调用）**：
```javascript
// ✅ 新代码
await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
```

### 变更 2：需要在异步函数中调用

**升级前**：
```javascript
// ❌ 旧代码
router.put('/api/barcode-rules/:id', (req, res) => {
  // 更新规则
  BarcodeRule.findByIdAndUpdate(req.params.id, req.body);
  
  // 清除缓存（同步）
  MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
  
  res.json({ success: true });
});
```

**升级后**：
```javascript
// ✅ 新代码
router.put('/api/barcode-rules/:id', async (req, res) => {  // 添加 async
  try {
    // 更新规则
    await BarcodeRule.findByIdAndUpdate(req.params.id, req.body);
    
    // 清除缓存（异步）
    await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 变更 3：获取统计信息也变为异步

**升级前**：
```javascript
// ❌ 旧代码
const stats = MaterialProcessFlowService.getBarcodeRuleCacheStats();
console.log(stats);
```

**升级后**：
```javascript
// ✅ 新代码
const stats = await MaterialProcessFlowService.getBarcodeRuleCacheStats();
console.log(stats);
```

## 🔍 查找需要修改的代码

### 步骤 1：搜索所有调用点

在项目中搜索以下字符串：

```bash
# 在项目根目录执行
grep -r "clearBarcodeRuleCache" dcMes_server/
grep -r "getBarcodeRuleCacheStats" dcMes_server/
```

### 步骤 2：检查每个调用点

找到的每个调用点都需要：

1. 确保在 `async` 函数中
2. 在调用前添加 `await`
3. 添加适当的错误处理

### 示例：需要修改的地方

假设在 `routes/barcodeRule.js` 中有以下代码：

```javascript
// routes/barcodeRule.js

// ❌ 需要修改
router.post('/api/barcode-rules', (req, res) => {
  BarcodeRule.create(req.body);
  MaterialProcessFlowService.clearBarcodeRuleCache();
  res.json({ success: true });
});

// ✅ 修改后
router.post('/api/barcode-rules', async (req, res) => {
  try {
    await BarcodeRule.create(req.body);
    await MaterialProcessFlowService.clearBarcodeRuleCache();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## ✅ 验证升级

### 1. 启动服务

```bash
cd dcMes_server
npm start
# 或
pm2 start ecosystem.config.js
```

### 2. 检查启动日志

应该看到以下日志：

```
🔗 条码规则缓存 Redis 连接已建立 (DB 3)
✅ 条码规则缓存 Redis 连接就绪 (DB 3)
```

如果看到错误日志：

```
❌ 初始化条码规则缓存 Redis 失败: connect ECONNREFUSED
⚠️ 将使用内存缓存作为降级方案
```

说明 Redis 连接失败，请检查：
1. Redis 服务是否运行
2. 环境变量配置是否正确
3. 网络连接是否正常

### 3. 测试缓存功能

#### 测试 1：查看缓存统计

```javascript
// 在任何控制器中
const stats = await MaterialProcessFlowService.getBarcodeRuleCacheStats();
console.log('缓存统计:', stats);
```

预期输出：
```json
{
  "connected": true,
  "total": 0,
  "active": 0,
  "expired": 0,
  "cacheTimeout": "300秒",
  "db": 3,
  "keyPrefix": "barcode_rule:"
}
```

#### 测试 2：触发缓存创建

```bash
# 扫描一个条码（会触发条码规则查询和缓存）
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode": "TEST001", "materialId": "xxx"}'
```

#### 测试 3：查看 Redis 中的缓存

```bash
# 连接 Redis
redis-cli -h localhost -p 6379

# 切换到 DB 3
SELECT 3

# 查看所有缓存键
KEYS barcode_rule:*

# 查看某个缓存的内容
GET barcode_rule:your_material_id

# 查看缓存剩余时间
TTL barcode_rule:your_material_id
```

预期输出：
```
redis> KEYS barcode_rule:*
1) "barcode_rule:64a1b2c3d4e5f6789012345"
2) "barcode_rule:64a1b2c3d4e5f6789012346"

redis> TTL barcode_rule:64a1b2c3d4e5f6789012345
(integer) 287  # 剩余时间（秒）
```

#### 测试 4：测试缓存清除

```javascript
// 清除单个物料缓存
const result = await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
console.log(result);
// { success: true, message: "已清除物料 xxx 的条码规则缓存", type: "single", count: 1 }

// 清除所有缓存
const result = await MaterialProcessFlowService.clearBarcodeRuleCache();
console.log(result);
// { success: true, message: "已清除所有条码规则缓存", type: "all", count: 2 }
```

### 4. 测试 PM2 集群环境

如果使用 PM2 集群模式：

```bash
# 启动 4 个进程
pm2 start ecosystem.config.js

# 在进程 1 中清除缓存
# 然后立即在进程 2 中查询
# 应该能看到缓存已被清除
```

**测试脚本**：

```javascript
// test-cluster-cache.js
const MaterialProcessFlowService = require('./dcMes_server/services/materialProcessFlowService');

(async () => {
  console.log('进程 ID:', process.pid);
  
  // 1. 查看初始统计
  const stats1 = await MaterialProcessFlowService.getBarcodeRuleCacheStats();
  console.log('初始统计:', stats1);
  
  // 2. 清除所有缓存
  console.log('清除所有缓存...');
  await MaterialProcessFlowService.clearBarcodeRuleCache();
  
  // 3. 再次查看统计
  const stats2 = await MaterialProcessFlowService.getBarcodeRuleCacheStats();
  console.log('清除后统计:', stats2);
  
  // 应该看到 total: 0
})();
```

## 📊 性能对比测试

### 测试脚本

```javascript
// performance-test.js
const MaterialProcessFlowService = require('./dcMes_server/services/materialProcessFlowService');
const Material = require('./dcMes_server/model/k3/material');

(async () => {
  const materialId = 'your_test_material_id';
  const material = await Material.findById(materialId);
  const barcode = 'TEST001';
  
  // 清除缓存
  await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
  
  // 测试 1：首次查询（无缓存）
  console.time('无缓存查询');
  await MaterialProcessFlowService.validateBarcodeWithMaterial(barcode, material);
  console.timeEnd('无缓存查询');
  // 预期: 50-100ms
  
  // 测试 2：第二次查询（有缓存）
  console.time('Redis缓存查询');
  await MaterialProcessFlowService.validateBarcodeWithMaterial(barcode, material);
  console.timeEnd('Redis缓存查询');
  // 预期: 1-2ms
  
  // 性能提升计算
  // 预期提升: 98%
})();
```

### 预期结果

```
无缓存查询: 85.234ms
Redis缓存查询: 1.456ms
性能提升: 98.3%
```

## ⚠️ 常见问题

### 问题 1：Redis 连接失败

**症状**：
```
❌ 初始化条码规则缓存 Redis 失败: connect ECONNREFUSED
```

**解决方法**：

1. 检查 Redis 是否运行：
```bash
redis-cli ping
```

2. 检查端口是否被占用：
```bash
lsof -i :6379
```

3. 重启 Redis：
```bash
# macOS
brew services restart redis

# Linux
sudo systemctl restart redis
```

### 问题 2：忘记添加 await

**症状**：缓存清除不生效

**原因**：
```javascript
// ❌ 错误：忘记 await
MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
// 函数立即返回 Promise，但没有等待执行完成
```

**解决方法**：
```javascript
// ✅ 正确：使用 await
await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
```

### 问题 3：在非异步函数中调用

**症状**：编译错误或运行时错误

**原因**：
```javascript
// ❌ 错误：不在 async 函数中
function myFunction() {
  await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
  // SyntaxError: await is only valid in async functions
}
```

**解决方法**：
```javascript
// ✅ 正确：添加 async
async function myFunction() {
  await MaterialProcessFlowService.clearBarcodeRuleCache(materialId);
}
```

### 问题 4：缓存数据格式错误

**症状**：
```
⚠️ Redis 获取缓存失败: Unexpected token in JSON
```

**原因**：Redis 中存储了格式错误的数据

**解决方法**：
```bash
# 清除所有缓存，重新生成
redis-cli -h localhost -p 6379
SELECT 3
FLUSHDB
```

## 🎯 检查清单

升级完成后，请确认以下项目：

- [ ] Redis 服务已安装并运行
- [ ] 环境变量已正确配置
- [ ] `ioredis` 依赖已安装
- [ ] 所有 `clearBarcodeRuleCache` 调用已添加 `await`
- [ ] 所有 `getBarcodeRuleCacheStats` 调用已添加 `await`
- [ ] 所有调用点都在 `async` 函数中
- [ ] 启动日志显示 Redis 连接成功
- [ ] 可以在 Redis CLI 中看到缓存键
- [ ] 缓存清除功能正常工作
- [ ] PM2 集群模式下缓存共享正常

## 📚 后续步骤

1. **监控告警**：设置 Redis 连接状态监控
2. **性能测试**：在生产环境验证性能提升
3. **文档更新**：更新团队开发文档
4. **培训团队**：确保所有开发人员了解新的缓存机制

## 🎓 参考文档

- [Redis 缓存配置说明](./Redis缓存配置说明.md)
- [Redis 缓存管理指南](./Redis缓存管理指南.md)
- [性能优化实施总结](./性能优化实施总结.md)
- [PM2 部署指南](./PM2部署指南.md)

---

如有任何问题，请参考上述文档或联系技术支持。

