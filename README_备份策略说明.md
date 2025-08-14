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

## 十、备份文件的使用方法（恢复/验证/迁移）

备份输出为按时间命名的压缩包（tar.gz），包含 `mongodump` 导出的库内容。常见使用场景如下：

### 1) 恢复到数据库（覆盖/新库）
- 使用项目内的恢复脚本 `restore_mongodb.js`（推荐）：
```powershell
cd C:\Users\Administrator\Desktop\DCMES\dechang-mes
node .\restore_mongodb.js <备份文件路径>
```
- 高级参数（环境变量）：
  - `TARGET_DB`：目标库名（默认 `dcMes_restore`）
  - `DROP_EXISTING`：是否先删除目标库现有数据（`true|false`，默认 `false`）
  - `BACKUP_BEFORE_RESTORE`：恢复前是否自动备份目标库（默认 `true`）
示例（恢复到生产库，谨慎操作）：
```powershell
set TARGET_DB=dcMes
set DROP_EXISTING=true
set BACKUP_BEFORE_RESTORE=true
node .\restore_mongodb.js D:\mongobackups\dcMes_backup_2024-12-20T02-00-00.gz
```

### 2) 解包查看备份内容（仅检查不恢复）
- Windows（使用 7-Zip 或 tar）：
```powershell
# 若已安装 tar（Windows 10+ 自带）
mkdir D:\temp\dcmes_dump
 tar -xzf D:\mongobackups\dcMes_backup_2024-12-20T02-00-00.gz -C D:\temp\dcmes_dump
```
- Linux/macOS：
```bash
mkdir -p /tmp/dcmes_dump
 tar -xzf /path/to/dcMes_backup_2024-12-20T02-00-00.gz -C /tmp/dcmes_dump
ls -la /tmp/dcmes_dump
```
解包目录内一般包含数据库名子目录以及各集合的 .bson/.metadata.json 文件，可用于快速审查集合数量与体量。

### 3) 使用 mongorestore 直接恢复（绕过脚本）
当你熟悉 MongoDB 工具链时，可直接使用 `mongorestore`：
- 压缩包：
```powershell
# 解包后恢复（示例）
 tar -xzf D:\mongobackups\dcMes_backup_2024-12-20T02-00-00.gz -C D:\temp\dcmes_dump
mongorestore --host 127.0.0.1:27017 ^
  --username <user> --password <pass> ^
  --authenticationDatabase <authDb> ^
  --db <目标库> D:\temp\dcmes_dump\<源库目录>
```
- 若是目录（未压缩备份时）：
```powershell
mongorestore --host 127.0.0.1:27017 ^
  --username <user> --password <pass> ^
  --authenticationDatabase <authDb> ^
  --db <目标库> <备份目录路径>
```
注意：覆盖生产库前务必做好当前库的临时备份，并在非高峰时段操作。

### 4) 数据迁移/异地恢复
将 `.gz` 备份文件复制至目标环境（建议通过安全通道），在目标环境上按照 1) 或 3) 步骤执行恢复。不同版本的 MongoDB 工具通常兼容同一大版本下的导入导出，但跨大版本迁移请先在测试环境验证。

### 5) 文件完整性与可用性验证
- 检查文件大小是否明显异常（例如仅几 KB）；
- 尝试解包并查看是否存在集合 .bson 文件；
- 在沙箱库（如 `dcMes_restore`）中进行一次试恢复，核对关键集合的文档数量。

### 6) 常见问题
- 解包报错：可能是下载/传输过程中损坏，重新获取备份文件；
- mongorestore 权限错误：确认目标库凭据与 `--authenticationDatabase` 正确；
- 版本不兼容：尽量使用与备份时相同或更高的 MongoDB Database Tools 版本。 