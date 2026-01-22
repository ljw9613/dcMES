# 工单处理服务部署指南

## 📋 部署清单

在部署新的工单处理服务之前，请确保完成以下检查项：

- [ ] Redis服务正常运行
- [ ] MongoDB服务正常运行
- [ ] 3001端口未被占用
- [ ] 已安装依赖包
- [ ] PM2已安装并配置

## 🚀 部署步骤

### 第一步：安装依赖

```bash
# 进入工单处理服务目录
cd dcMes_plan_server

# 安装依赖
npm install
```

### 第二步：验证配置

检查 `ecosystem.config.js` 文件，确认配置正确：

```javascript
{
  name: 'dcmes-plan-server',
  script: './dcMes_plan_server/server.js',
  instances: 1,              // ✅ 必须为1
  exec_mode: 'fork',         // ✅ 必须为fork模式
  env_production: {
    NODE_ENV: 'production',
    PORT: 3001,
    MONGODB_URI: 'mongodb://...',  // ✅ 检查数据库地址
    REDIS_HOST: 'localhost',       // ✅ 检查Redis地址
    REDIS_PORT: 6379,
    REDIS_DB: 2
  }
}
```

### 第三步：测试独立运行

在使用PM2之前，先测试服务能否正常启动：

```bash
# 设置环境变量
export PORT=3001
export NODE_ENV=development
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_DB=2

# 直接运行
node dcMes_plan_server/server.js
```

如果看到以下输出，说明服务启动成功：

```
🚀 正在启动dcMes工单处理服务...
════════════════════════════════════════════════════════════
📌 步骤 1/3: 测试Redis连接...
✅ Redis连接测试成功
📌 步骤 2/3: 连接数据库...
✅ 数据库连接成功
📌 步骤 3/3: 初始化队列服务...
✅ 工单更新队列初始化成功
════════════════════════════════════════════════════════════
✅ 所有初始化步骤完成
🎉 dcMes工单处理服务启动成功!
```

### 第四步：使用PM2启动服务

```bash
# 回到项目根目录
cd ..

# 启动所有服务（包括主服务和工单处理服务）
pm2 start ecosystem.config.js --env production

# 或者只启动工单处理服务
pm2 start ecosystem.config.js --only dcmes-plan-server --env production
```

### 第五步：验证服务状态

```bash
# 1. 查看PM2进程状态
pm2 status

# 应该看到：
# ┌─────┬────────────────────┬─────────┬─────────┬──────────┐
# │ id  │ name               │ mode    │ status  │ restart  │
# ├─────┼────────────────────┼─────────┼─────────┼──────────┤
# │ 0   │ dcmes-server       │ cluster │ online  │ 0        │
# │ 1   │ dcmes-plan-server  │ fork    │ online  │ 0        │ ✅
# └─────┴────────────────────┴─────────┴─────────┴──────────┘

# 2. 测试健康接口
curl http://localhost:3001/health

# 应该返回：
# {
#   "status": "ok",
#   "message": "dcMes工单处理服务运行正常",
#   "service": "dcMes-plan-server",
#   "version": "1.0.0"
# }

# 3. 查看队列状态
curl http://localhost:3001/api/workorder/queue/stats

# 4. 查看日志
pm2 logs dcmes-plan-server --lines 50
```

### 第六步：重启主服务

为了让主服务使用新的工单处理服务，需要重启主服务：

```bash
# 重启主服务
pm2 restart dcmes-server

# 或重启所有服务
pm2 restart all
```

### 第七步：验证集成

测试主服务是否正确调用工单处理服务：

```bash
# 查看主服务日志，应该能看到调用工单处理服务的日志
pm2 logs dcmes-server --lines 100 | grep "调用独立工单处理服务"

# 如果看到类似以下日志，说明集成成功：
# 🔗 调用独立工单处理服务更新工单: 65f3a1b2c3d4e5f6g7h8i9j0
# ✅ 工单65f3a1b2c3d4e5f6g7h8i9j0更新任务已加入队列: xxx
```

## 📊 监控检查

### 1. 实时监控

```bash
# 使用PM2实时监控
pm2 monit
```

### 2. 日志监控

```bash
# 查看工单处理服务日志
pm2 logs dcmes-plan-server

# 查看错误日志
pm2 logs dcmes-plan-server --err

# 查看最近100行日志
pm2 logs dcmes-plan-server --lines 100
```

### 3. 队列监控

定期检查队列状态，确保任务正常处理：

```bash
# 创建监控脚本
cat > check_queue.sh << 'EOF'
#!/bin/bash
echo "=== 队列状态检查 $(date) ==="
curl -s http://localhost:3001/api/workorder/queue/stats | jq '.'
echo ""
echo "=== 锁状态检查 ==="
curl -s http://localhost:3001/api/workorder/queue/locks | jq '.'
EOF

chmod +x check_queue.sh

# 运行监控脚本
./check_queue.sh
```

## 🔄 更新部署

如果需要更新工单处理服务：

```bash
# 1. 拉取最新代码
git pull

# 2. 进入服务目录更新依赖（如有必要）
cd dcMes_plan_server
npm install

# 3. 重启服务
cd ..
pm2 restart dcmes-plan-server

# 4. 验证更新
curl http://localhost:3001/health
pm2 logs dcmes-plan-server --lines 20
```

## 🛠️ 故障处理

### 问题1：服务启动失败

**症状：** PM2显示服务状态为error或errored

**排查步骤：**

```bash
# 1. 查看错误日志
pm2 logs dcmes-plan-server --err --lines 50

# 2. 检查端口占用
lsof -i :3001

# 3. 检查Redis连接
redis-cli -h localhost -p 6379 ping

# 4. 检查MongoDB连接
mongo mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes --eval "db.stats()"

# 5. 手动启动测试
cd dcMes_plan_server
node server.js
```

### 问题2：队列任务堆积

**症状：** 队列中waiting或active任务过多

**处理方法：**

```bash
# 1. 查看队列统计
curl http://localhost:3001/api/workorder/queue/stats

# 2. 查看锁状态（是否有异常锁）
curl http://localhost:3001/api/workorder/queue/locks

# 3. 清理异常锁
curl -X POST http://localhost:3001/api/workorder/queue/clean-locks

# 4. 如果任务失败过多，清理失败任务
curl -X POST http://localhost:3001/api/workorder/queue/clean \
  -H "Content-Type: application/json" \
  -d '{"grace": 5000}'

# 5. 重启服务
pm2 restart dcmes-plan-server
```

### 问题3：主服务调用失败

**症状：** 主服务日志显示"工单处理服务不可用"

**排查步骤：**

```bash
# 1. 检查工单处理服务状态
pm2 status dcmes-plan-server
curl http://localhost:3001/health

# 2. 检查主服务环境变量
pm2 describe dcmes-server | grep -A 10 "env:"
# 确认PLAN_SERVER_HOST和PLAN_SERVER_PORT正确

# 3. 测试网络连接
telnet localhost 3001

# 4. 查看主服务日志
pm2 logs dcmes-server | grep -A 5 "工单处理服务"

# 5. 检查是否触发降级机制
pm2 logs dcmes-server | grep "降级"
```

### 问题4：Redis连接问题

**症状：** 日志显示Redis连接错误

**处理方法：**

```bash
# 1. 检查Redis服务
systemctl status redis
# 或
redis-cli ping

# 2. 检查Redis配置
cat dcMes_plan_server/config/redis.js

# 3. 测试Redis连接
redis-cli -h localhost -p 6379 -n 2
> PING
> QUIT

# 4. 清理Redis中的队列数据（谨慎操作）
redis-cli -h localhost -p 6379 -n 2
> KEYS bull:workorder-quantity-updates:*
> DEL bull:workorder-quantity-updates:*
```

## 🔐 安全建议

### 1. 网络隔离

工单处理服务只需要主服务访问，建议配置防火墙规则：

```bash
# 只允许本地访问3001端口
sudo ufw allow from 127.0.0.1 to any port 3001
```

### 2. 环境变量保护

不要在代码中硬编码敏感信息，使用环境变量：

```bash
# 创建环境变量文件（不要提交到Git）
cat > dcMes_plan_server/.env << 'EOF'
MONGODB_URI=mongodb://user:password@host:port/database
REDIS_PASSWORD=your_redis_password
EOF

# 修改权限
chmod 600 dcMes_plan_server/.env
```

### 3. 日志轮转

配置日志轮转避免日志文件过大：

```bash
# 安装pm2-logrotate
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## 📈 性能优化

### 1. 队列并发调整

根据实际负载调整队列并发数（谨慎操作）：

```javascript
// dcMes_plan_server/config/redis.js
processor: {
  concurrency: 1,  // 默认为1，确保串行处理
}
```

### 2. Redis连接池

如果Redis连接频繁，可以调整连接池设置：

```javascript
// dcMes_plan_server/config/redis.js
redisConfig = {
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  // 根据需要调整
}
```

### 3. 任务超时设置

根据实际工单更新耗时调整超时设置：

```javascript
// dcMes_plan_server/config/redis.js
defaultJobOptions: {
  timeout: 30000,  // 默认30秒，可根据实际情况调整
}
```

## 📝 部署检查清单

部署完成后，使用此清单验证：

- [ ] PM2中dcmes-plan-server状态为online
- [ ] PM2模式为fork，instances为1
- [ ] 健康检查接口返回正常
- [ ] 队列统计接口返回正常
- [ ] Redis连接正常
- [ ] MongoDB连接正常
- [ ] 主服务能够正常调用工单处理服务
- [ ] 查看日志无明显错误
- [ ] 测试工单更新功能正常
- [ ] 配置PM2开机自启动（`pm2 startup && pm2 save`）

## 🔄 回滚方案

如果新服务出现问题，可以快速回滚：

### 方案1：停止工单处理服务，使用降级机制

```bash
# 停止工单处理服务
pm2 stop dcmes-plan-server

# 主服务会自动降级到本地队列处理
pm2 logs dcmes-server | grep "降级"
```

### 方案2：恢复原有代码

```bash
# 1. 停止所有服务
pm2 stop all

# 2. 恢复原有代码
git checkout <之前的commit>

# 3. 重启服务
pm2 restart all
```

## 📞 技术支持

如遇到部署问题，请收集以下信息：

1. PM2状态：`pm2 status`
2. 服务日志：`pm2 logs dcmes-plan-server --lines 100`
3. 错误日志：`pm2 logs dcmes-plan-server --err --lines 50`
4. 队列状态：`curl http://localhost:3001/api/workorder/queue/stats`
5. 系统信息：`uname -a`, `node --version`, `pm2 --version`

---

**最后更新：** 2024-10-31  
**文档版本：** 1.0.0













