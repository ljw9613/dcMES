# MongoDB自动备份定时任务配置指南

## Windows系统 - 使用任务计划程序

### 1. 打开任务计划程序
- 按 `Win + R`，输入 `taskschd.msc`
- 或在开始菜单搜索"任务计划程序"

### 2. 创建基本任务
1. 点击右侧的"创建基本任务"
2. 输入任务名称：`MongoDB数据库备份`
3. 输入描述：`自动备份dcMes数据库`

### 3. 设置触发器
选择触发频率：
- **每日备份**：选择"每天"，设置时间为凌晨2:00
- **每周备份**：选择"每周"，选择周日凌晨2:00
- **每月备份**：选择"每月"，选择每月1号凌晨2:00

### 4. 设置操作
1. 选择"启动程序"
2. 程序或脚本：浏览选择 `backup_mongodb.bat`
3. 起始于：设置为脚本所在目录

### 5. 高级设置
- 勾选"如果任务失败，重新启动"，设置间隔为15分钟，最多3次
- 勾选"如果请求后任务还在运行，强行将其停止"，设置为4小时

### 6. 完成创建
点击"完成"，任务创建成功

---

## Linux/Mac系统 - 使用Crontab

### 1. 编辑Crontab
```bash
crontab -e
```

### 2. 添加定时任务

#### 每日凌晨2点备份
```bash
# 每日凌晨2点执行MongoDB备份
0 2 * * * cd /path/to/your/project && ./backup_mongodb.sh >> /var/log/mongodb_backup.log 2>&1
```

#### 每周日凌晨2点备份
```bash
# 每周日凌晨2点执行MongoDB备份
0 2 * * 0 cd /path/to/your/project && ./backup_mongodb.sh >> /var/log/mongodb_backup.log 2>&1
```

#### 每月1号凌晨2点备份
```bash
# 每月1号凌晨2点执行MongoDB备份
0 2 1 * * cd /path/to/your/project && ./backup_mongodb.sh >> /var/log/mongodb_backup.log 2>&1
```

#### 工作日每天凌晨2点备份
```bash
# 周一到周五凌晨2点执行MongoDB备份
0 2 * * 1-5 cd /path/to/your/project && ./backup_mongodb.sh >> /var/log/mongodb_backup.log 2>&1
```

### 3. 设置执行权限
```bash
chmod +x backup_mongodb.sh
```

### 4. 查看定时任务
```bash
crontab -l
```

---

## 环境变量配置

### Windows环境变量设置
在任务计划程序的操作设置中，可以添加以下环境变量：

```batch
REM 在backup_mongodb.bat开头添加
set BACKUP_PATH=D:\mongodb_backups
set KEEP_DAYS=30
set COMPRESS=true
```

### Linux/Mac环境变量设置
在Crontab中或创建专门的环境配置文件：

```bash
# 方法1：在crontab中直接设置
0 2 * * * BACKUP_PATH=/opt/mongodb_backups KEEP_DAYS=30 cd /path/to/project && ./backup_mongodb.sh

# 方法2：创建环境配置文件
# 创建 /etc/default/mongodb-backup
BACKUP_PATH=/opt/mongodb_backups
KEEP_DAYS=30
COMPRESS=true

# 在crontab中引用
0 2 * * * . /etc/default/mongodb-backup && cd /path/to/project && ./backup_mongodb.sh
```

---

## 监控和通知

### 1. 邮件通知脚本
创建 `send_notification.js` 文件：

```javascript
// 邮件通知功能（需要nodemailer包）
const nodemailer = require('nodemailer');

async function sendBackupNotification(success, details) {
  const transporter = nodemailer.createTransporter({
    host: 'your-smtp-server.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-email@company.com',
      pass: 'your-password'
    }
  });

  const subject = success ? '✅ MongoDB备份成功' : '❌ MongoDB备份失败';
  const html = `
    <h2>${subject}</h2>
    <p><strong>时间：</strong>${new Date().toLocaleString()}</p>
    <p><strong>数据库：</strong>dcMes</p>
    <p><strong>详情：</strong></p>
    <pre>${JSON.stringify(details, null, 2)}</pre>
  `;

  await transporter.sendMail({
    from: 'system@company.com',
    to: 'admin@company.com',
    subject,
    html
  });
}

module.exports = { sendBackupNotification };
```

### 2. 集成到备份脚本
修改 `backup_mongodb.js`，在备份完成后调用通知功能。

### 3. 日志轮转
创建 `logrotate` 配置（Linux）：

```bash
# /etc/logrotate.d/mongodb-backup
/var/log/mongodb_backup.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
```

---

## 备份策略建议

### 1. 分层备份策略
- **每日备份**：保留7天
- **每周备份**：保留4周
- **每月备份**：保留12个月

### 2. 异地备份
```bash
# 自动上传到云存储（示例：阿里云OSS）
ossutil cp backups/dcMes_backup_*.gz oss://your-bucket/mongodb-backups/
```

### 3. 备份验证
定期验证备份文件的完整性：

```bash
# 验证脚本
#!/bin/bash
BACKUP_FILE="/path/to/backup/dcMes_backup_latest.gz"
mongorestore --dryRun --archive="$BACKUP_FILE" --gzip
```

---

## 故障排除

### 常见问题

1. **权限不足**
   - Windows: 以管理员身份运行任务计划程序
   - Linux: 确保crontab用户有足够权限

2. **路径问题**
   - 使用绝对路径
   - 确保工作目录正确

3. **环境变量**
   - 定时任务中的环境变量可能与交互式shell不同
   - 显式设置PATH和其他必要变量

4. **网络连接**
   - 确保定时任务执行时网络连接正常
   - 考虑添加网络检查逻辑

### 调试方法

1. **查看任务历史**
   ```bash
   # Linux查看cron日志
   tail -f /var/log/cron
   
   # 查看备份日志
   tail -f /var/log/mongodb_backup.log
   ```

2. **手动测试**
   ```bash
   # 在cron环境中测试
   env -i bash -c 'cd /path/to/project && ./backup_mongodb.sh'
   ```

3. **添加详细日志**
   在脚本中添加更多调试信息，记录执行的每个步骤。

---

## 安全注意事项

1. **密码保护**
   - 不要在脚本中直接写明文密码
   - 使用环境变量或密钥文件

2. **文件权限**
   ```bash
   # 设置安全的文件权限
   chmod 700 backup_mongodb.sh
   chmod 600 backup_mongodb.js
   ```

3. **备份加密**
   ```bash
   # 加密备份文件
   gpg --symmetric --cipher-algo AES256 backup_file.gz
   ```

4. **网络安全**
   - 使用TLS/SSL连接数据库
   - 限制数据库访问IP

---

通过以上配置，您可以实现MongoDB数据库的自动化备份，确保数据安全和业务连续性。 