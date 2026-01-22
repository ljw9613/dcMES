# MongoDB 授权错误修复指南

## 错误信息

```
MongoServerError: not authorized on dcMes to execute command { find: "packbarcodes", ... }
code: 13
codeName: 'Unauthorized'
```

## 错误原因

当前 MongoDB 用户 `dcMes` 没有足够的权限在 `dcMes` 数据库上执行查询操作。这通常发生在：

1. **用户权限被修改**：MongoDB 服务器上的用户权限被撤销或限制
2. **密码变更**：用户密码已更改但应用配置未更新
3. **认证配置变更**：MongoDB 服务器端认证机制发生变化
4. **用户角色缺失**：用户缺少必要的数据库角色

## 解决方案

### 方案 1：在 MongoDB 服务器上修复用户权限（推荐）

连接到 MongoDB 服务器（47.115.19.76:27017），使用管理员账户执行以下命令：

```javascript
// 1. 切换到 admin 数据库
use admin

// 2. 使用管理员账户登录（需要替换为实际的管理员账户）
db.auth("admin", "admin_password")

// 3. 切换到 dcMes 数据库
use dcMes

// 4. 授予 dcMes 用户读写权限
db.grantRolesToUser("dcMes", [
  { role: "readWrite", db: "dcMes" }
])

// 或者授予完整权限（如果用户需要管理权限）
db.grantRolesToUser("dcMes", [
  { role: "dbOwner", db: "dcMes" }
])

// 5. 验证用户权限
db.getUser("dcMes")
```

### 方案 2：重新创建用户（如果用户不存在或需要重置）

```javascript
// 1. 切换到 dcMes 数据库
use dcMes

// 2. 删除旧用户（如果存在）
db.dropUser("dcMes")

// 3. 创建新用户并授予权限
db.createUser({
  user: "dcMes",
  pwd: "dcMes123.",
  roles: [
    { role: "readWrite", db: "dcMes" }
  ]
})

// 4. 验证用户创建成功
db.getUser("dcMes")
```

### 方案 3：使用管理员角色（最高权限，谨慎使用）

```javascript
use dcMes
db.grantRolesToUser("dcMes", [
  { role: "dbAdmin", db: "dcMes" },
  { role: "readWrite", db: "dcMes" },
  { role: "userAdmin", db: "dcMes" }
])
```

## 验证步骤

### 1. 测试连接

在 MongoDB shell 中测试连接：

```bash
mongo mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes
```

### 2. 测试查询权限

```javascript
use dcMes
db.packbarcodes.find().limit(1)
```

如果能够成功查询，说明权限已修复。

### 3. 检查用户权限

```javascript
use dcMes
db.getUser("dcMes")
```

应该看到类似以下的输出：

```json
{
  "_id": "dcMes.dcMes",
  "userId": UUID("..."),
  "user": "dcMes",
  "db": "dcMes",
  "roles": [
    {
      "role": "readWrite",
      "db": "dcMes"
    }
  ]
}
```

## 常见角色说明

| 角色 | 权限说明 |
|------|---------|
| `read` | 只读权限，可以查询数据 |
| `readWrite` | 读写权限，可以查询、插入、更新、删除数据 |
| `dbAdmin` | 数据库管理权限，可以管理索引、集合等 |
| `dbOwner` | 数据库所有者，拥有所有权限 |
| `userAdmin` | 用户管理权限，可以管理用户和角色 |

## 注意事项

1. **安全性**：确保使用强密码，不要在生产环境使用弱密码
2. **最小权限原则**：只授予必要的权限，避免授予过多权限
3. **备份**：修改用户权限前，建议备份数据库
4. **网络访问**：确保应用服务器能够访问 MongoDB 服务器（47.115.19.76:27017）

## 如果问题仍然存在

1. **检查 MongoDB 服务器日志**：查看是否有其他错误信息
2. **检查网络连接**：确保应用服务器能够连接到 MongoDB 服务器
3. **检查防火墙**：确保 27017 端口未被阻止
4. **联系数据库管理员**：如果无法直接访问 MongoDB 服务器，联系管理员协助修复

## 相关文件

- 数据库连接配置：`dcMes_server/db.js`
- 数据库索引配置：`dcMes_server/config/database-indexes.js`

