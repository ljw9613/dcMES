# MongoDB迁移认证问题排查指南

## 问题：Authentication failed（认证失败）

### 错误信息示例

```
error connecting to host: failed to connect to mongodb://user:pass@host:27017/db: 
connection() error occurred during connection handshake: auth error: 
sasl conversation error: unable to authenticate using mechanism "SCRAM-SHA-256": 
(AuthenticationFailed) Authentication failed.
```

## 常见原因和解决方案

### 1. 密码包含特殊字符（最常见）

**问题**：如果密码包含空格、`@`、`:`、`/`、`#`、`?`、`[`、`]` 等特殊字符，在 MongoDB URI 中需要进行 URL 编码。

**解决方案**：

#### 方法一：使用脚本自动编码（推荐）

脚本已自动处理密码编码，但如果仍有问题，可以手动编码：

```javascript
// 在 Node.js 中
const password = "mLdNC eXeZSEejH7X"; // 包含空格
const encodedPassword = encodeURIComponent(password);
// 结果: "mLdNC%20eXeZSEejH7X"

// 构建URI
const uri = `mongodb://dcmes:${encodedPassword}@172.18.100.10:27017/dcmes`;
```

#### 方法二：使用命令行工具

```bash
# 在 Node.js 中快速编码
node -e "console.log(encodeURIComponent('mLdNC eXeZSEejH7X'))"
# 输出: mLdNC%20eXeZSEejH7X

# 然后使用编码后的密码
node migrate_mongodb.js \
  --source "mongodb://dcmes:mLdNC%20eXeZSEejH7X@source:27017/dcmes" \
  --target "mongodb://dcmes:mLdNC%20eXeZSEejH7X@target:27017/dcmes"
```

#### 方法三：使用环境变量

```bash
# 设置环境变量（脚本会自动编码）
export SOURCE_MONGODB_URI="mongodb://dcmes:mLdNC eXeZSEejH7X@source:27017/dcmes"
export TARGET_MONGODB_URI="mongodb://dcmes:mLdNC eXeZSEejH7X@target:27017/dcmes"
node migrate_mongodb.js
```

### 2. 用户名或密码错误

**检查步骤**：

1. 验证用户名是否正确
2. 验证密码是否正确（注意大小写）
3. 确认没有多余的空格或换行符

**测试连接**：

```bash
# 使用 mongosh 测试连接
mongosh "mongodb://user:password@host:27017/dbname"

# 或使用 mongo 命令（旧版本）
mongo "mongodb://user:password@host:27017/dbname"
```

### 3. 认证数据库（authSource）不正确

**问题**：用户可能创建在不同的认证数据库中。

**解决方案**：

```bash
# 指定认证数据库
mongodb://user:password@host:27017/dbname?authSource=admin

# 在脚本中使用
node migrate_mongodb.js \
  --source "mongodb://user:pass@source:27017/db?authSource=admin" \
  --target "mongodb://user:pass@target:27017/db?authSource=admin"
```

### 4. 用户权限不足

**检查用户权限**：

```javascript
// 在 mongosh 中
use admin
db.getUser("dcmes")

// 检查角色
db.getUser("dcmes").roles
```

**需要的权限**：
- 源数据库：`read` 权限
- 目标数据库：`readWrite` 权限

**授予权限**：

```javascript
// 授予读取权限（源数据库）
use dcmes
db.grantRolesToUser("dcmes", [{ role: "read", db: "dcmes" }])

// 授予读写权限（目标数据库）
use dcmes
db.grantRolesToUser("dcmes", [{ role: "readWrite", db: "dcmes" }])
```

### 5. 网络连接问题

**检查步骤**：

1. 确认可以从当前机器访问目标服务器
2. 检查防火墙设置
3. 确认 MongoDB 服务正在运行
4. 检查端口是否正确（默认 27017）

**测试网络连接**：

```bash
# 测试端口是否开放
telnet 172.18.100.10 27017

# 或使用 nc (netcat)
nc -zv 172.18.100.10 27017
```

## 快速诊断步骤

### 步骤1：验证连接字符串格式

```bash
# 正确的格式
mongodb://[username:password@]host[:port][/database][?options]

# 示例
mongodb://dcmes:password@172.18.100.10:27017/dcmes
```

### 步骤2：测试源数据库连接

```bash
# 使用 mongosh
mongosh "mongodb://dcmes:password@source:27017/dcmes" --eval "db.adminCommand('ping')"

# 如果成功，会返回: { ok: 1 }
```

### 步骤3：测试目标数据库连接

```bash
# 使用 mongosh
mongosh "mongodb://dcmes:password@target:27017/dcmes" --eval "db.adminCommand('ping')"
```

### 步骤4：检查密码编码

```bash
# 如果密码包含特殊字符，先编码
node -e "console.log('原始密码:', 'mLdNC eXeZSEejH7X'); console.log('编码后:', encodeURIComponent('mLdNC eXeZSEejH7X'));"
```

### 步骤5：使用编码后的密码

```bash
# 使用编码后的密码构建URI
node migrate_mongodb.js \
  --source "mongodb://dcmes:mLdNC%20eXeZSEejH7X@source:27017/dcmes" \
  --target "mongodb://dcmes:mLdNC%20eXeZSEejH7X@target:27017/dcmes"
```

## 特殊字符编码对照表

| 字符 | 编码后 | 说明 |
|------|--------|------|
| 空格 | `%20` | 最常见的问题 |
| `@` | `%40` | |
| `:` | `%3A` | |
| `/` | `%2F` | |
| `#` | `%23` | |
| `?` | `%3F` | |
| `[` | `%5B` | |
| `]` | `%5D` | |
| `%` | `%25` | 如果密码本身包含 % |

## 脚本自动处理

**好消息**：脚本已自动处理密码编码！

脚本会自动检测密码中的特殊字符并进行编码，你只需要：

1. 直接使用原始密码（包含特殊字符）
2. 脚本会自动编码并构建正确的 URI

```bash
# 直接使用包含空格的密码，脚本会自动处理
node migrate_mongodb.js \
  --source "mongodb://dcmes:mLdNC eXeZSEejH7X@source:27017/dcmes" \
  --target "mongodb://dcmes:mLdNC eXeZSEejH7X@target:27017/dcmes"
```

## 如果仍然失败

1. **查看详细错误日志**：
   ```bash
   cat ./migration_logs/migration_*.log | grep -i "error\|auth\|fail"
   ```

2. **手动测试连接**：
   ```bash
   mongosh "mongodb://dcmes:password@172.18.100.10:27017/dcmes"
   ```

3. **检查 MongoDB 日志**：
   - Linux: `/var/log/mongodb/mongod.log`
   - Windows: MongoDB 安装目录下的日志文件

4. **联系数据库管理员**：
   - 确认用户名和密码
   - 确认用户权限
   - 确认认证数据库

## 示例：解决密码包含空格的问题

### 问题密码
```
密码: "mLdNC eXeZSEejH7X"  (包含空格)
```

### 解决方案

```bash
# 方法1: 使用脚本（自动编码）
node migrate_mongodb.js \
  --source "mongodb://dcmes:mLdNC eXeZSEejH7X@172.18.100.10:27017/dcmes" \
  --target "mongodb://dcmes:mLdNC eXeZSEejH7X@47.115.19.76:27017/dcmes"

# 方法2: 手动编码后使用
# 编码: mLdNC eXeZSEejH7X -> mLdNC%20eXeZSEejH7X
node migrate_mongodb.js \
  --source "mongodb://dcmes:mLdNC%20eXeZSEejH7X@172.18.100.10:27017/dcmes" \
  --target "mongodb://dcmes:mLdNC%20eXeZSEejH7X@47.115.19.76:27017/dcmes"
```

## 相关文档

- [MongoDB Connection String URI Format](https://docs.mongodb.com/manual/reference/connection-string/)
- [MongoDB Authentication](https://docs.mongodb.com/manual/core/authentication/)
- [URL Encoding Reference](https://www.w3schools.com/tags/ref_urlencode.asp)
