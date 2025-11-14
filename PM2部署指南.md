# PM2 负载均衡部署快速指南

## 📦 前置要求

- ✅ Node.js >= 14.x
- ✅ npm 或 yarn
- ✅ MongoDB 已运行
- ✅ PM2 已安装

---

## 🚀 快速开始（5分钟部署）

### 1. 安装 PM2（如未安装）

```bash
npm install -g pm2
```

### 2. 验证优化后的代码

```bash
# 进入项目目录
cd /Users/laijiwei/Documents/项目/德昌项目/dcmes/dechang-mes

# 检查优化后的文件
ls -lh dcMes_server/services/materialProcessFlowService.js
```

### 3. 配置数据库连接

确保 MongoDB 连接配置正确（在 `dcMes_server/config/database.js` 或类似文件中）：

```javascript
mongoose.connect(mongoUri, {
  maxPoolSize: 50,        // 重要：集群模式需要更大的连接池
  minPoolSize: 10,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 2000,
  useNewUrlParser: true,
  useUnifiedTopology: true
});
```

### 4. 创建日志目录

```bash
mkdir -p logs
```

### 5. 启动服务（开发环境）

```bash
pm2 start ecosystem.config.js
```

### 6. 启动服务（生产环境）

```bash
pm2 start ecosystem.config.js --env production
```

### 7. 查看运行状态

```bash
pm2 status
```

预期输出:
```
┌─────┬─────────────────┬─────────┬─────────┬─────────┬───────────┐
│ id  │ name            │ mode    │ status  │ cpu     │ memory    │
├─────┼─────────────────┼─────────┼─────────┼─────────┼───────────┤
│ 0   │ dcmes-server    │ cluster │ online  │ 2%      │ 150.0mb   │
│ 1   │ dcmes-server    │ cluster │ online  │ 2%      │ 145.0mb   │
│ 2   │ dcmes-server    │ cluster │ online  │ 1%      │ 148.0mb   │
│ 3   │ dcmes-server    │ cluster │ online  │ 2%      │ 152.0mb   │
└─────┴─────────────────┴─────────┴─────────┴─────────┴───────────┘
```

---

## 📊 监控和管理

### 实时监控

```bash
pm2 monit
```

### 查看日志

```bash
# 查看所有日志
pm2 logs

# 查看特定应用日志
pm2 logs dcmes-server

# 查看错误日志
pm2 logs dcmes-server --err

# 清空日志
pm2 flush
```

### 重启服务（0秒停机）

```bash
# 推荐：优雅重启（0秒停机）
pm2 reload dcmes-server

# 普通重启
pm2 restart dcmes-server
```

### 停止和删除

```bash
# 停止
pm2 stop dcmes-server

# 删除
pm2 delete dcmes-server
```

---

## 🔧 常见问题排查

### 1. 服务启动失败

**检查端口占用：**
```bash
lsof -i :3000
```

**查看错误日志：**
```bash
pm2 logs dcmes-server --err --lines 100
```

### 2. 内存占用过高

**查看内存使用：**
```bash
pm2 list
```

**调整配置：**
```javascript
// ecosystem.config.js
max_memory_restart: '800M',  // 降低重启阈值
instances: 2,                 // 减少实例数
```

### 3. 数据库连接数过多

**症状：** MongoDB 报 "too many connections"

**解决方案：**
```javascript
// 调整连接池大小
maxPoolSize: 30,  // 降低单个实例的连接数
// 或减少 PM2 实例数
instances: 2,     // 在 ecosystem.config.js 中
```

**计算公式：**
```
总连接数 = PM2实例数 × maxPoolSize
建议：总连接数 < MongoDB最大连接数 × 0.7
```

### 4. 性能未达预期

**检查数据库索引：**
```javascript
// 在 MongoDB 中执行
db.material_process_flows.getIndexes()
```

**查看慢查询日志：**
```bash
tail -f logs/pm2-error.log | grep "took"
```

**验证缓存是否工作：**
```bash
# 查看日志中缓存命中情况
pm2 logs | grep "cache"
```

---

## 🎯 性能测试

### 测试脚本

创建 `test/performance-test.js`:

```javascript
const axios = require('axios');

async function testPerformance() {
  const startTime = Date.now();
  const requests = 10;
  
  console.log(`开始性能测试: ${requests} 个并发请求`);
  
  const promises = [];
  for (let i = 0; i < requests; i++) {
    promises.push(
      axios.post('http://localhost:3000/api/flow/scan', {
        mainBarcode: `TEST${i}`,
        processStepId: 'test-process-id',
        componentScans: [
          { materialId: 'mat1', barcode: `COMP${i}` }
        ],
        userId: 'test-user',
        lineId: 'test-line'
      }).catch(err => ({ error: err.message }))
    );
  }
  
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  console.log(`完成时间: ${duration}ms`);
  console.log(`平均响应时间: ${duration / requests}ms`);
  console.log(`成功: ${results.filter(r => !r.error).length}`);
  console.log(`失败: ${results.filter(r => r.error).length}`);
}

testPerformance().catch(console.error);
```

### 运行测试

```bash
node test/performance-test.js
```

### 预期结果（优化后）

```
开始性能测试: 10 个并发请求
完成时间: 3200ms
平均响应时间: 320ms
成功: 10
失败: 0
```

---

## 📈 优化效果验证

### 1. 对比优化前后的响应时间

**优化前：**
- 初始化产品：~2000ms
- 扫描组件：~3000ms

**优化后（预期）：**
- 初始化产品：~400ms ✅
- 扫描组件：~800ms ✅

### 2. 检查数据库查询次数

在关键方法中添加计数器：

```javascript
let queryCount = 0;
const originalFind = Model.find;
Model.find = function(...args) {
  queryCount++;
  return originalFind.apply(this, args);
};

// 执行操作后
console.log(`总查询次数: ${queryCount}`);
```

**优化前：** 60-80 次查询  
**优化后（预期）：** 8-12 次查询 ✅

---

## 🔒 安全建议

### 1. 环境变量管理

创建 `.env` 文件（不要提交到 Git）：

```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dcmes
JWT_SECRET=your-secret-key
```

### 2. PM2 密钥管理

```bash
# 设置 PM2 密钥（用于 PM2 Plus）
pm2 set pm2:secret-key your-secret-key
```

### 3. 日志安全

```bash
# 定期轮转日志
pm2 install pm2-logrotate

# 配置日志保留策略
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

---

## 🚀 高级配置

### 1. 开机自启动

```bash
# 生成启动脚本
pm2 startup

# 保存当前配置
pm2 save

# 验证
sudo reboot
pm2 list  # 重启后检查
```

### 2. 自动更新部署

创建 `deploy.sh`:

```bash
#!/bin/bash
echo "开始部署..."

# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
npm install --production

# 3. 运行测试（可选）
# npm test

# 4. 重启服务（0秒停机）
pm2 reload dcmes-server

# 5. 验证
sleep 5
pm2 status

echo "部署完成！"
```

### 3. 监控告警

安装 PM2 Plus（可选）:

```bash
pm2 plus
```

或使用 Webhook 告警:

```javascript
// ecosystem.config.js 中添加
post_update: ['npm install', 'echo 部署完成'],
error_file: './logs/error.log',
combine_logs: true,

// 配置告警
pm2 install pm2-server-monit
```

---

## 📋 检查清单

部署前检查：

- [ ] PM2 已安装并测试
- [ ] 数据库连接配置正确
- [ ] 日志目录已创建
- [ ] 数据库索引已创建
- [ ] 环境变量已配置
- [ ] 防火墙规则已设置
- [ ] 备份策略已制定

部署后验证：

- [ ] 所有实例状态为 online
- [ ] 内存使用正常（< 1G）
- [ ] CPU 使用正常（< 30%）
- [ ] 日志无错误
- [ ] API 响应正常
- [ ] 数据库连接数正常
- [ ] 性能测试通过

---

## 📞 获取帮助

**常用命令速查：**

```bash
# 启动
pm2 start ecosystem.config.js

# 重启（0秒停机）
pm2 reload dcmes-server

# 查看状态
pm2 status

# 查看日志
pm2 logs dcmes-server

# 实时监控
pm2 monit

# 查看详情
pm2 describe dcmes-server

# 停止
pm2 stop dcmes-server

# 删除
pm2 delete dcmes-server

# 保存配置
pm2 save

# 开机自启
pm2 startup
```

**遇到问题？**

1. 检查日志：`pm2 logs dcmes-server --err`
2. 查看状态：`pm2 describe dcmes-server`
3. 监控资源：`pm2 monit`
4. 查看文档：[PM2 官方文档](https://pm2.keymetrics.io/)

---

## ✨ 恭喜！

如果您看到所有服务都是 `online` 状态，恭喜您已经成功部署了优化后的 dcMes 服务器！

**预期性能提升：**
- ⚡ 响应速度提升 60-80%
- 📉 数据库查询减少 85%
- 💾 内存使用更加稳定
- 🔄 支持 PM2 负载均衡

**下一步：**
1. 运行性能测试验证效果
2. 配置监控和告警
3. 设置自动备份
4. 制定运维手册

🎉 祝您使用愉快！

