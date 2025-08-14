## 系统 MongoDB 备份策略与使用说明

本说明针对当前系统已改造的备份实现（`dcMes_server/backup_mongodb.js` + 专用 PM2 配置 `dcMes_server/ecosystem.backup.config.js` + 启动脚本 `dcMes_server/backup_mongodb.bat`），提供策略与操作指南。

### 一、目标与范围
- **目标**：保证 `dcmesvncs` 库数据每日定时备份、可快速恢复、具备可观测性与自清理能力。
- **范围**：仅覆盖 MongoDB 数据库备份与其运行/监控流程，不含业务应用备份。

### 二、备份策略（默认）
- **执行时间**：每日凌晨 02:00（Cron：`0 0 2 * * *`）。
- **保留周期**：最近 7 天（可通过 `KEEP_DAYS` 调整）。
- **存储路径**：`D:/mongobackups`（可通过 `BACKUP_PATH` 调整）。
- **文件命名**：`dcMes_backup_YYYY-MM-DDTHH-mm-SS.gz`（tar+gzip）。
- **压缩策略**：默认启用压缩（`COMPRESS=true`），Windows 下使用 `archiver` 生成 tar.gz；Linux/macOS 优先 `tar`，失败回退 `archiver`。
- **重试机制**：失败自动重试最多 3 次，间隔 5 秒。
- **完整性检查**：备份完成后进行文件尺寸校验与日志记录。
- **旧文件清理**：超出保留周期的备份将自动删除。

### 三、依赖与路径
- **Node.js**：用于运行备份脚本与 PM2。
- **PM2**：作为备份进程守护与日志管理器；批处理会自动全局安装（如缺失）。
- **MongoDB Database Tools**：实际备份由 `mongodump` 执行。
  - 优先路径：`dcMes_server/Tools/100/bin/mongodump.exe`（无需配置 PATH）。
  - 其次回退：系统 PATH 或常见安装目录（例如 `C:/Program Files/MongoDB/Tools/100/bin`）。
- **调度依赖**：`node-schedule`（已在 `dcMes_server/package.json` 中）。
- **压缩依赖**：`archiver`（启用压缩时自动安装）。

### 四、运行方式
- **推荐（PM2 守护 + 定时）**
  1) 启动定时任务（默认每天 02:00）
  ```powershell
  cd C:\Users\Administrator\Desktop\DCMES\dechang-mes\dcMes_server
  backup_mongodb.bat start
  ```
  2) 自定义 Cron（示例：每天 01:30）
  ```powershell
  backup_mongodb.bat start --cron "0 30 1 * * *"
  ```
  3) 查看/停止
  ```powershell
  backup_mongodb.bat status
  backup_mongodb.bat logs
  backup_mongodb.bat stop
  ```
  4) 使用独立 PM2 配置文件（等效方式）
  ```powershell
  pm2 start dcMes_server/ecosystem.backup.config.js
  pm2 save
  ```

- **一次性执行（不常驻）**
```powershell
cd C:\Users\Administrator\Desktop\DCMES\dechang-mes\dcMes_server
backup_mongodb.bat once
```

### 五、可配置项
- **命令行参数**（批处理透传至脚本）：
  - `--once|--now|run`：立即执行一次并退出。
  - `--schedule`：以定时模式常驻运行（默认行为）。
  - `--cron "<表达式>"`：自定义 Cron 表达式（默认 `0 0 2 * * *`）。
- **环境变量**（可在 PM2 配置或系统级设置）：
  - `SCHEDULE_CRON`：覆盖默认 Cron。
  - `BACKUP_PATH`：备份目录（默认 `D:/mongobackups`）。
  - `KEEP_DAYS`：保留天数（默认 `7`）。
  - `COMPRESS`：是否压缩（默认 `true`）。

### 六、日志与结果核验
- **备份日志**：`<BACKUP_PATH>/backup.log`（默认 `D:/mongobackups/backup.log`）。
- **PM2 日志**（按配置）：`logs/pm2/out/backup-out-YYYY-MM-DD.log`、`logs/pm2/error/backup-err-YYYY-MM-DD.log`。
- **核验步骤**：
  1) 查看 PM2 状态和最近日志：
  ```powershell
  backup_mongodb.bat status
  backup_mongodb.bat logs
  ```
  2) 检查备份目录有无最新 `.gz` 文件，大小是否合理；查看 `backup.log` 是否记录成功。

### 七、恢复指引（摘要）
- 使用 `restore_mongodb.js` 进行数据恢复。
```powershell
node .\restore_mongodb.js <备份文件路径>
```
- 建议在恢复前对现有库做一次临时备份，验证恢复结果后再切换流量。

### 八、常见问题与建议
- **mongodump 未找到**：确认 `dcMes_server/Tools/100/bin/mongodump.exe` 是否存在；或在系统上安装 MongoDB Database Tools。
- **压缩依赖失败**：设置 `COMPRESS=false` 先行备份，或手动执行 `npm i archiver`。
- **空间不足**：增大磁盘空间或缩短 `KEEP_DAYS`；定期归档至异地存储。
- **安全建议**：优先通过环境变量注入敏感信息；限制备份目录权限；定期更换数据库凭据。

### 九、变更记录（本次改造）
- 新增独立 PM2 配置：`dcMes_server/ecosystem.backup.config.js`（仅包含备份守护进程）。
- `dcMes_server/backup_mongodb.bat` 改为使用专用 PM2 配置启动，保留一次性执行入口。
- `dcMes_server/backup_mongodb.js`：
  - 新增 CLI 参数（`--once/--schedule/--cron`），默认定时 02:00。
  - 优先使用本地 `Tools/100/bin/mongodump(.exe)`。
  - 自动依赖安装与重试、清理、验证机制。 