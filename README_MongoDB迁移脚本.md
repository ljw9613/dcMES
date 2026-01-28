# MongoDB数据库迁移脚本使用指南

## 概述

本工具提供了两种方式将一台服务器的 MongoDB 数据库完整复制到另一台服务器：

1. **Node.js 脚本** (`migrate_mongodb.js`) - 跨平台，功能完整
2. **PowerShell 脚本** (`migrate_mongodb.ps1`) - Windows 专用，简单快速

## 功能特性

- ✅ 完整数据库迁移（支持所有数据库或指定数据库）
- ✅ **完全保留原始数据时间戳**（创建时间、更新时间等）
- ✅ 自动压缩以节省传输时间
- ✅ **实时进度显示** - 显示集合名称、文档数量、处理时间等详细信息
- ✅ **心跳监控** - 长时间无输出时自动显示处理状态，确保脚本正常运行
- ✅ 详细的进度显示和日志记录
- ✅ 错误处理和重试机制
- ✅ 安全确认（删除目标数据前提示）
- ✅ 自动清理临时文件

## 前置要求

### 1. 安装 MongoDB Database Tools

迁移脚本需要使用 `mongodump` 和 `mongorestore` 工具。

#### Windows:
1. 下载 MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools
2. 解压并添加到系统 PATH 环境变量

#### Linux:
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
sudo apt-get install mongodb-database-tools

# CentOS/RHEL
sudo yum install mongodb-database-tools
```

#### macOS:
```bash
brew install mongodb/brew/mongodb-database-tools
```

### 2. 验证安装

```bash
mongodump --version
mongorestore --version
```

### 3. Node.js（仅 Node.js 脚本需要）

确保已安装 Node.js（推荐 v14+）

```bash
node --version
```

## 使用方法

### 方法一：Node.js 脚本（推荐）

#### 方式1：使用配置文件（最简单，推荐）

1. **打开 `migrate_mongodb.js` 文件**
2. **找到文件开头的配置区域**（约第 45-77 行）
3. **填写数据库连接信息**：

```javascript
const DB_CONFIG = {
  // 源数据库配置
  source: {
    host: '127.0.0.1',           // 源数据库主机地址
    port: 27017,                 // 源数据库端口
    username: 'dcMes',           // 源数据库用户名
    password: 'dcMes123.',        // 源数据库密码（包含特殊字符会自动编码）
    database: 'dcMes',           // 源数据库名称
    authSource: '',               // 认证数据库（如 'admin'，否则留空）
  },
  
  // 目标数据库配置
  target: {
    host: '172.18.100.10',        // 目标数据库主机地址
    port: 27017,                 // 目标数据库端口
    username: 'dcmes',           // 目标数据库用户名
    password: 'mLdNC eXeZSEejH7X', // 目标数据库密码
    database: 'dcmes',           // 目标数据库名称
    authSource: '',               // 认证数据库（如 'admin'，否则留空）
  },
  
  // 迁移选项
  options: {
    compress: true,               // 是否压缩
    dropTarget: false,           // 是否删除目标数据库现有数据
    excludeCollections: [],       // 要跳过的集合，例如: ['logs', 'audit']
    includeCollections: [],        // 只导出指定的集合（如果指定，则只导出这些集合，忽略 excludeCollections），例如: ['users', 'orders']
    keepTemp: false,             // 是否保留临时文件
    testConnection: true,         // 是否在迁移前测试连接（推荐启用）
    useExistingDump: false,       // 是否使用已存在的导出文件（跳过导出步骤）
    dumpPath: '',                 // 指定导出文件路径（如果 useExistingDump 为 true）
  }
};
```

4. **直接运行脚本**：

```bash
node migrate_mongodb.js
```

**优点**：
- ✅ 配置一次，重复使用
- ✅ 自动进行连接测试，提前发现连接问题
- ✅ 密码自动编码，无需手动处理特殊字符
- ✅ 配置清晰，易于管理
- ✅ 支持使用已存在的导出文件，避免重复导出

#### 方式2：使用命令行参数

```bash
# 使用命令行参数
node migrate_mongodb.js --source "mongodb://user:pass@source-host:27017/dbname" --target "mongodb://user:pass@target-host:27017/dbname"
```

#### 方式3：使用环境变量

```bash
# 使用环境变量
$env:SOURCE_MONGODB_URI="mongodb://user:pass@source-host:27017/dbname"
$env:TARGET_MONGODB_URI="mongodb://user:pass@target-host:27017/dbname"
node migrate_mongodb.js
```

**优先级**：命令行参数 > 环境变量 > 文件配置

#### 完整参数示例

```bash
# 基本迁移
node migrate_mongodb.js \
  --source "mongodb://dcmes:password@106.52.179.92:27017/dcmes" \
  --target "mongodb://dcmes:password@47.115.19.76:27017/dcmes" \
  --database "dcmes" \
  --drop \
  --keep-temp

# 跳过某些集合（日志表、临时表等）
node migrate_mongodb.js \
  --source "mongodb://dcmes:password@106.52.179.92:27017/dcmes" \
  --target "mongodb://dcmes:password@47.115.19.76:27017/dcmes" \
  --exclude-collection "logs" \
  --exclude-collection "audit,temp" \
  --drop

# 只导出指定的集合（例如：只导出用户表和订单表）
node migrate_mongodb.js \
  --source "mongodb://dcmes:password@106.52.179.92:27017/dcmes" \
  --target "mongodb://dcmes:password@47.115.19.76:27017/dcmes" \
  --include-collection "users" \
  --include-collection "orders,products" \
  --drop
```

#### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--source` | 源数据库连接字符串 | 必需 |
| `--target` | 目标数据库连接字符串 | 必需 |
| `--database` | 数据库名称（如果URI中未指定） | 空 |
| `--exclude-collection` | 要跳过的集合名称（可多次指定或逗号分隔） | 空 |
| `--include-collection` | 只导出指定的集合名称（可多次指定或逗号分隔）<br>注意：如果指定了此参数，将忽略 `--exclude-collection` | 空 |
| `--no-compress` | 禁用压缩 | 默认启用压缩 |
| `--drop` | 删除目标数据库现有数据 | false |
| `--temp-dir` | 临时文件目录 | ./mongodb_migration_temp |
| `--keep-temp` | 保留临时文件 | false |
| `--use-existing-dump` | 使用已存在的导出文件（跳过导出步骤） | false |
| `--dump-path` | 指定导出文件路径（自动启用 --use-existing-dump） | 空 |

#### 环境变量

```bash
SOURCE_MONGODB_URI      # 源数据库连接字符串
TARGET_MONGODB_URI      # 目标数据库连接字符串
DATABASE_NAME           # 数据库名称
EXCLUDE_COLLECTIONS     # 要跳过的集合名称（逗号分隔）
                        例如: EXCLUDE_COLLECTIONS="logs,audit,temp"
COMPRESS                # 是否压缩 (true/false)
DROP_TARGET             # 是否删除目标数据 (true/false)
TEMP_DIR                # 临时文件目录
KEEP_TEMP               # 保留临时文件 (true/false)
```

### 方法二：PowerShell 脚本（Windows）

#### 基本用法

```powershell
.\migrate_mongodb.ps1 `
  -SourceUri "mongodb://user:pass@source-host:27017/dbname" `
  -TargetUri "mongodb://user:pass@target-host:27017/dbname"
```

#### 完整参数示例

```powershell
# 基本迁移
.\migrate_mongodb.ps1 `
  -SourceUri "mongodb://dcmes:password@106.52.179.92:27017/dcmes" `
  -TargetUri "mongodb://dcmes:password@47.115.19.76:27017/dcmes" `
  -Database "dcmes" `
  -Compress $true `
  -DropTarget $false

# 跳过某些集合
.\migrate_mongodb.ps1 `
  -SourceUri "mongodb://dcmes:password@106.52.179.92:27017/dcmes" `
  -TargetUri "mongodb://dcmes:password@47.115.19.76:27017/dcmes" `
  -ExcludeCollections @("logs", "audit", "temp") `
  -DropTarget $true
```

#### 参数说明

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `-SourceUri` | string | 源数据库连接字符串 | 必需 |
| `-TargetUri` | string | 目标数据库连接字符串 | 必需 |
| `-Database` | string | 数据库名称 | 空 |
| `-ExcludeCollections` | string[] | 要跳过的集合名称数组 | @() |
| `-Compress` | bool | 是否压缩 | $true |
| `-DropTarget` | bool | 是否删除目标数据 | $false |
| `-TempDir` | string | 临时文件目录 | ./mongodb_migration_temp |
| `-KeepTemp` | bool | 保留临时文件 | $false |

## 连接字符串格式

MongoDB 连接字符串格式：

```
mongodb://[username:password@]host[:port][/database][?options]
```

### 示例

```bash
# 带认证
mongodb://dcmes:password@106.52.179.92:27017/dcmes

# 无认证（本地）
mongodb://localhost:27017/dcmes

# 带认证数据库
mongodb://dcmes:password@106.52.179.92:27017/dcmes?authSource=admin
```

## 使用场景

### 场景1：完整迁移生产数据库到新服务器

```bash
node migrate_mongodb.js \
  --source "mongodb://prod_user:prod_pass@old-server:27017/production" \
  --target "mongodb://prod_user:prod_pass@new-server:27017/production" \
  --drop
```

### 场景2：迁移特定数据库

```bash
node migrate_mongodb.js \
  --source "mongodb://user:pass@source:27017" \
  --target "mongodb://user:pass@target:27017" \
  --database "dcmes"
```

### 场景3：跳过日志表和临时表

```bash
# 跳过 logs、audit、temp 等集合
node migrate_mongodb.js \
  --source "mongodb://user:pass@source:27017/db" \
  --target "mongodb://user:pass@target:27017/db" \
  --exclude-collection "logs,audit,temp" \
  --drop
```

### 场景3.1：只导出指定的集合

```bash
# 只导出 users、orders、products 集合
node migrate_mongodb.js \
  --source "mongodb://user:pass@source:27017/db" \
  --target "mongodb://user:pass@target:27017/db" \
  --include-collection "users" \
  --include-collection "orders,products" \
  --drop

# 或在配置文件中设置
# includeCollections: ['users', 'orders', 'products']
```

### 场景4：使用已存在的导出文件进行导入

```bash
# 方式1: 自动查找最新的导出文件
node migrate_mongodb.js --use-existing-dump

# 方式2: 指定导出文件路径
node migrate_mongodb.js --dump-path "./mongodb_migration_temp/dump_2026-01-27T01-51-36-629Z"

# 方式3: 在配置文件中设置
# 在 DB_CONFIG.options 中设置:
#   useExistingDump: true,
#   dumpPath: './mongodb_migration_temp/dump_2026-01-27T01-51-36-629Z'
```

**使用场景**：
- 导出已完成，但导入失败，想重新导入
- 想将同一个导出文件导入到多个不同的目标数据库
- 导出和导入分开执行（先导出，稍后导入）

### 场景5：备份到本地（先导出，稍后导入）

```bash
# 只导出（使用 mongodump），跳过某些集合
mongodump --uri "mongodb://user:pass@source:27017/dcmes" \
  --excludeCollection logs \
  --excludeCollection audit \
  --out ./backup --gzip

# 稍后使用脚本导入
node migrate_mongodb.js --use-existing-dump --dump-path "./backup"
```

## 重要说明：时间戳保留

### ✅ 数据时间戳完全保留

使用 `mongodump` 和 `mongorestore` 进行迁移时，**所有时间相关的数据都会完全保留**：

1. **ObjectId 时间戳** - MongoDB 的 `_id` 字段（ObjectId）包含创建时间戳，会完全保留
2. **自定义时间字段** - 所有文档中的时间字段（如 `createTime`、`updateTime`、`createdAt`、`updatedAt` 等）的值会**原样保留**
3. **Date 类型字段** - 所有 Date 类型的字段值都会保持原始值不变

### 工作原理

- `mongodump` 导出的是 **BSON 格式的原始数据**，包含所有字段的精确值
- `mongorestore` 直接将 BSON 数据插入数据库，**不会触发 Mongoose 的默认值逻辑**
- 因此，即使模型定义了 `default: Date.now`，迁移时也会使用原始的时间值

### 验证时间戳

迁移后可以验证时间戳是否保留：

```javascript
// 在源服务器查询
db.collection.findOne({}, { createTime: 1, updateTime: 1, _id: 1 })

// 在目标服务器查询（应该得到相同的时间值）
db.collection.findOne({}, { createTime: 1, updateTime: 1, _id: 1 })
```

### 注意事项

⚠️ **唯一可能变化的情况**：
- 如果目标数据库已有相同 `_id` 的文档，使用 `--drop` 选项会先删除再插入，时间戳仍然保留
- 如果不使用 `--drop` 且目标数据库已有数据，可能会因为 `_id` 冲突而跳过某些文档

## 进度显示说明

脚本会实时显示详细的进度信息：

### 导出阶段（mongodump）
- 📦 显示正在处理的集合名称
- 📄 显示已处理的文档数量
- ⏱️ 显示每个操作的时间戳和耗时
- 💓 如果超过5秒没有输出，会显示心跳信息，确保脚本正常运行

### 导入阶段（mongorestore）
- 📦 显示正在恢复的集合名称
- 📄 显示已恢复的文档数量
- ⏱️ 显示每个操作的时间戳和耗时
- ✅ 完成后显示统计信息（集合数、文档数、总耗时）

### 示例输出
```
🔄 导出数据库...
   执行命令: mongodump --uri "mongodb://dcMes:****@127.0.0.1:27017/dcMes" --out "..." --gzip

   📦 [2.3s] 处理集合: materialProcessFlow
   📄 [2.5s] 已处理文档: 1000
   ⏱️  [3.1s] writing materialProcessFlow.bson.gz
   💓 [8.2s] 正在处理中... (已处理 1 个集合, 1000 个文档)
   📦 [10.5s] 处理集合: inspectionData
   ...
✅ 导出数据库完成 (耗时: 45.2秒)
   处理了 15 个集合
   处理了 50000 个文档
```

**注意**：如果看到长时间没有输出，这是正常的。mongodump/mongorestore 在处理大量数据时可能不会频繁输出。脚本会每5秒显示一次心跳信息，确保程序正在运行。

## 迁移流程

脚本执行以下步骤：

1. **验证配置** - 检查源和目标连接字符串
2. **工具检查** - 验证 mongodump 和 mongorestore 是否可用
3. **连接测试** - 测试源和目标数据库连接（如果启用，默认启用）
   - 使用 `mongosh` 测试连接
   - 如果认证失败，会显示详细的错误信息和解决建议
   - 只有连接测试通过后才会开始迁移
4. **导出数据库** - 从源服务器导出数据（可选压缩），实时显示进度
5. **导入数据库** - 导入数据到目标服务器（**保留所有原始时间戳**），实时显示进度
6. **清理临时文件** - 删除临时文件（除非指定保留）

### 连接测试说明

如果使用配置文件方式，脚本会在迁移前自动测试连接：

```
🔍 连接测试阶段
============================================================

🔍 测试源数据库连接...
   连接字符串: mongodb://dcMes:****@127.0.0.1:27017/dcMes
✅ 源数据库连接测试成功

🔍 测试目标数据库连接...
   连接字符串: mongodb://dcmes:****@172.18.100.10:27017/dcmes
✅ 目标数据库连接测试成功

✅ 所有连接测试通过，开始迁移...
```

如果连接测试失败，脚本会：
- 显示详细的错误信息
- 提供解决建议
- 阻止迁移继续进行，避免浪费时间

## 日志和错误处理

### 日志位置

- **Node.js 脚本**: `./migration_logs/migration_YYYY-MM-DD.log`
- **PowerShell 脚本**: `./migration_logs/migration_YYYY-MM-DD.log`

### 常见错误

#### 1. 连接失败

```
错误: 无法连接到源/目标服务器
解决: 检查网络连接、防火墙设置、MongoDB 服务状态
```

#### 2. 认证失败（Authentication failed）

**最常见原因：密码包含特殊字符（如空格）**

```
错误: Authentication failed
      unable to authenticate using mechanism "SCRAM-SHA-256"
```

**解决方案**：

1. **脚本已自动处理密码编码**，但如果仍有问题，请手动编码密码：
   ```bash
   # 如果密码包含空格等特殊字符，需要URL编码
   node -e "console.log(encodeURIComponent('your password'))"
   
   # 使用编码后的密码
   node migrate_mongodb.js \
     --source "mongodb://user:encoded_password@host:27017/db" \
     --target "mongodb://user:encoded_password@host:27017/db"
   ```

2. **检查用户名和密码**是否正确

3. **检查认证数据库**（authSource）：
   ```bash
   # 如果用户创建在 admin 数据库
   mongodb://user:pass@host:27017/db?authSource=admin
   ```

4. **检查用户权限**：
   - 源数据库需要 `read` 权限
   - 目标数据库需要 `readWrite` 权限

**详细排查指南**：请查看 [README_MongoDB认证问题排查.md](./README_MongoDB认证问题排查.md)

#### 3. 权限不足

```
错误: not authorized
解决: 确保用户有 read 权限（源）和 readWrite 权限（目标）
```

#### 4. 磁盘空间不足

```
错误: No space left on device
解决: 清理磁盘空间或使用 --temp-dir 指定其他位置
```

## 性能优化建议

1. **使用压缩** - 默认启用，可显著减少传输时间
2. **网络优化** - 如果两台服务器在同一网络，传输会更快
3. **分步迁移** - 对于超大数据库，可以分数据库迁移
4. **低峰期执行** - 在业务低峰期执行迁移，减少对生产影响

## 安全注意事项

1. ⚠️ **密码安全** - 不要在命令行中直接输入密码，使用环境变量
2. ⚠️ **备份目标数据** - 如果目标数据库有重要数据，迁移前先备份
3. ⚠️ **网络传输** - 确保使用安全网络或 VPN 连接
4. ⚠️ **权限控制** - 使用最小权限原则，只授予必要的数据库权限

## 示例：完整迁移流程

```bash
# 1. 检查工具
mongodump --version
mongorestore --version

# 2. 测试连接
mongosh "mongodb://user:pass@source:27017/dcmes" --eval "db.stats()"
mongosh "mongodb://user:pass@target:27017/dcmes" --eval "db.stats()"

# 3. 执行迁移
node migrate_mongodb.js \
  --source "mongodb://user:pass@source:27017/dcmes" \
  --target "mongodb://user:pass@target:27017/dcmes" \
  --drop \
  --keep-temp

# 4. 验证数据
mongosh "mongodb://user:pass@target:27017/dcmes" --eval "db.getCollectionNames()"
```

## 故障排查

### 查看详细日志

```bash
# Node.js 脚本
cat ./migration_logs/migration_2026-01-27.log

# PowerShell 脚本
Get-Content ./migration_logs/migration_2026-01-27.log
```

### 手动执行步骤

如果脚本失败，可以手动执行：

```bash
# 1. 导出
mongodump --uri "mongodb://user:pass@source:27017/dcmes" --out ./dump --gzip

# 2. 导入
mongorestore --uri "mongodb://user:pass@target:27017/dcmes" ./dump --drop
```

## 验证时间戳

迁移完成后，可以使用验证脚本检查时间戳是否正确保留：

```bash
# 验证所有集合
node verify_migration_timestamps.js \
  --source "mongodb://user:pass@source:27017/db" \
  --target "mongodb://user:pass@target:27017/db"

# 验证特定集合
node verify_migration_timestamps.js \
  --source "mongodb://user:pass@source:27017/db" \
  --target "mongodb://user:pass@target:27017/db" \
  --collection "materialProcessFlow" \
  --sample-size 20
```

验证脚本会：
- 从源和目标数据库采样文档
- 比较时间戳字段（createTime、updateTime、ObjectId 时间戳等）
- 显示详细的验证结果和差异

## 相关文档

- [MongoDB Database Tools 文档](https://docs.mongodb.com/database-tools/)
- [mongodump 文档](https://docs.mongodb.com/database-tools/mongodump/)
- [mongorestore 文档](https://docs.mongodb.com/database-tools/mongorestore/)

## 支持

如有问题，请查看：
1. 日志文件：`./migration_logs/`
2. 临时文件：`./mongodb_migration_temp/`（如果使用 --keep-temp）
3. MongoDB 官方文档
