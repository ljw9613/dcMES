# MongoDB数据库备份与恢复系统

## 项目概述

本系统为dcMes数据库提供完整的备份和恢复解决方案，支持自动化备份、数据恢复、监控和管理等功能。

## 系统组件

### 1. 核心脚本文件
- `backup_mongodb.js` - 主备份脚本（Node.js）
- `restore_mongodb.js` - 数据恢复脚本（Node.js）
- `backup_mongodb.bat` - Windows批处理脚本
- `backup_mongodb.sh` - Linux/Mac Shell脚本

### 2. 配置文件
- `backup_schedule.md` - 定时任务配置指南
- `README_MongoDB备份系统.md` - 本使用说明文档

## 功能特性

### 备份功能
- ✅ 自动连接dcMes数据库进行备份
- ✅ 生成带时间戳的备份文件名
- ✅ 支持gzip压缩，节省存储空间
- ✅ 详细的日志记录和错误处理
- ✅ 自动重试机制（最多3次）
- ✅ 自动清理旧备份文件
- ✅ 备份文件验证功能
- ✅ 连接池状态监控

### 恢复功能
- ✅ 交互式选择备份文件
- ✅ 支持压缩文件直接恢复
- ✅ 恢复前自动备份现有数据
- ✅ 恢复结果验证
- ✅ 安全确认机制
- ✅ 详细的操作日志

### 系统功能
- ✅ 跨平台支持（Windows、Linux、Mac）
- ✅ 环境检查和依赖验证
- ✅ 定时任务支持
- ✅ 邮件通知（可选）
- ✅ 备份状态统计

## 安装要求

### 必需软件
1. **Node.js** (v12.0+)
   - Windows: 从 https://nodejs.org/ 下载安装
   - Ubuntu/Debian: `sudo apt-get install nodejs npm`
   - CentOS/RHEL: `sudo yum install nodejs npm`
   - macOS: `brew install node`

2. **MongoDB数据库工具** (MongoDB Database Tools)
   - Windows: 从官网下载并添加到PATH
   - Ubuntu/Debian: `sudo apt-get install mongodb-database-tools`
   - CentOS/RHEL: `sudo yum install mongodb-database-tools`
   - macOS: `brew install mongodb/brew/mongodb-database-tools`

### 验证安装
```bash
# 检查Node.js
node --version
npm --version

# 检查MongoDB工具
mongodump --version
mongorestore --version
```

## 使用方法

### 1. 手动备份

#### Windows系统
```batch
# 双击运行批处理文件
backup_mongodb.bat

# 或在命令行中运行
node backup_mongodb.js
```

#### Linux/Mac系统
```bash
# 给脚本执行权限
chmod +x backup_mongodb.sh

# 运行脚本
./backup_mongodb.sh

# 或直接运行Node.js脚本
node backup_mongodb.js
```

### 2. 数据恢复

#### 交互式恢复
```bash
# 启动恢复程序
node restore_mongodb.js

# 脚本会自动显示可用的备份文件供选择
```

#### 指定备份文件恢复
```bash
# 直接指定备份文件路径
node restore_mongodb.js ./backups/dcMes_backup_2024-01-01T02-00-00.gz
```

### 3. 自动化备份

#### Windows任务计划程序
1. 打开任务计划程序（`taskschd.msc`）
2. 创建基本任务
3. 设置触发器（如每日凌晨2:00）
4. 设置操作：运行 `backup_mongodb.bat`

#### Linux/Mac Crontab
```bash
# 编辑crontab
crontab -e

# 添加定时任务（每日凌晨2点）
0 2 * * * cd /path/to/project && ./backup_mongodb.sh >> /var/log/mongodb_backup.log 2>&1
```

## 配置选项

### 环境变量配置

#### 备份配置
```bash
export BACKUP_PATH="/opt/mongodb_backups"    # 备份文件存储路径
export KEEP_DAYS=30                          # 保留备份天数
export COMPRESS=true                         # 是否启用压缩
```

#### 恢复配置
```bash
export TARGET_DB="dcMes_restore"             # 目标数据库名
export DROP_EXISTING=false                   # 是否删除现有数据
export BACKUP_BEFORE_RESTORE=true           # 恢复前是否备份
```

### 数据库连接配置
配置位于脚本中的 `config` 对象：
```javascript
this.config = {
  host: '47.115.19.76',        // 数据库服务器地址
  port: '27017',               // 数据库端口
  database: 'dcMes',           // 数据库名称
  username: 'dcMes',           // 用户名
  password: 'dcMes123.',       // 密码
  authDatabase: 'dcMes'        // 认证数据库
};
```

## 备份策略建议

### 1. 分层备份
- **每日备份**: 保留7天，用于快速恢复
- **每周备份**: 保留4周，用于周期性恢复
- **每月备份**: 保留12个月，用于长期归档

### 2. 存储建议
- 本地存储：快速访问，但需要考虑磁盘空间
- 网络存储：安全可靠，但恢复速度较慢
- 云存储：异地备份，灾难恢复

### 3. 监控建议
- 监控备份任务执行状态
- 定期验证备份文件完整性
- 设置备份失败告警
- 监控磁盘空间使用情况

## 文件目录结构

```
项目根目录/
├── backup_mongodb.js          # 主备份脚本
├── restore_mongodb.js         # 恢复脚本
├── backup_mongodb.bat         # Windows批处理脚本
├── backup_mongodb.sh          # Linux/Mac Shell脚本
├── backup_schedule.md         # 定时任务配置指南
├── README_MongoDB备份系统.md  # 使用说明文档
├── backups/                   # 备份文件目录
│   ├── dcMes_backup_*.gz     # 压缩备份文件
│   └── backup.log            # 备份日志
└── restore_logs/              # 恢复日志目录
    ├── restore.log           # 恢复日志
    └── pre_restore_backup/   # 恢复前备份
```

## 日志管理

### 日志文件位置
- 备份日志：`./backups/backup.log`
- 恢复日志：`./restore_logs/restore.log`
- 系统日志：`/var/log/mongodb_backup.log`（Linux）

### 日志内容
- 操作开始和结束时间
- 执行的命令和参数
- 文件大小和路径信息
- 错误信息和堆栈跟踪
- 性能统计信息

### 日志轮转
```bash
# Linux logrotate配置
/var/log/mongodb_backup.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
}
```

## 故障排除

### 常见问题

#### 1. 权限问题
**问题**: 脚本执行失败，提示权限不足
**解决方案**:
```bash
# Linux/Mac
chmod +x backup_mongodb.sh
chmod +x restore_mongodb.js

# Windows: 以管理员身份运行
```

#### 2. 连接问题
**问题**: 无法连接到MongoDB数据库
**解决方案**:
- 检查网络连接
- 验证数据库服务器地址和端口
- 确认用户名密码正确
- 检查防火墙设置

#### 3. 磁盘空间不足
**问题**: 备份失败，磁盘空间不足
**解决方案**:
- 清理旧备份文件
- 调整 `KEEP_DAYS` 参数
- 使用更高压缩率
- 移至其他存储位置

#### 4. 备份文件损坏
**问题**: 恢复时提示备份文件损坏
**解决方案**:
- 重新创建备份
- 检查存储设备健康状态
- 使用备份验证功能
- 从其他备份恢复

### 调试模式
启用详细日志输出：
```bash
# 设置调试环境变量
export DEBUG=true
node backup_mongodb.js
```

## 安全注意事项

### 1. 密码安全
- 不要在脚本中硬编码密码
- 使用环境变量存储敏感信息
- 定期更换数据库密码

### 2. 文件权限
```bash
# 设置安全的文件权限
chmod 700 backup_mongodb.sh
chmod 600 backup_mongodb.js
chmod 600 restore_mongodb.js
```

### 3. 网络安全
- 使用TLS/SSL连接数据库
- 限制数据库访问IP范围
- 启用MongoDB身份验证

### 4. 备份加密
```bash
# 可选：加密备份文件
gpg --symmetric --cipher-algo AES256 backup_file.gz
```

## 性能优化

### 1. 备份优化
- 调整连接池大小
- 使用并行备份选项
- 选择合适的压缩级别
- 在低峰期执行备份

### 2. 网络优化
- 使用本地网络备份
- 启用网络压缩
- 调整传输缓冲区大小

### 3. 存储优化
- 使用SSD存储备份文件
- 定期整理备份目录
- 监控I/O性能

## 监控和告警

### 1. 备份状态监控
```bash
# 检查最近的备份状态
tail -f ./backups/backup.log

# 统计备份文件信息
ls -la ./backups/dcMes_backup_*
```

### 2. 空间监控
```bash
# 监控备份目录大小
du -sh ./backups/

# 监控磁盘使用率
df -h
```

### 3. 邮件通知
配置SMTP服务器，在备份成功或失败时发送通知邮件。

## 版本更新

### 当前版本特性
- v1.0: 基础备份和恢复功能
- v1.1: 添加压缩和验证功能
- v1.2: 增加自动清理和监控功能
- v1.3: 跨平台支持和定时任务

### 升级建议
1. 备份现有配置文件
2. 停止正在运行的定时任务
3. 更新脚本文件
4. 测试新功能
5. 重新启动定时任务

## 技术支持

如遇到问题，请按以下步骤操作：

1. **查看日志文件**，了解具体错误信息
2. **检查环境配置**，确保所有依赖正确安装
3. **验证网络连接**，确保可以访问数据库
4. **测试手动执行**，排除定时任务问题
5. **查阅故障排除**章节，寻找解决方案

---

**重要提醒**: 在生产环境中使用前，请务必在测试环境中充分验证所有功能的正确性和稳定性。

最后更新：2024年12月
版本：v1.3 