# MongoDB 新建数据库与用户操作指南

本文档说明如何在 MongoDB 服务器上创建新数据库并创建对应的用户。

---

## 一、前置条件

1. **管理员账户**：需要有 `admin` 库的管理员账号，或具备 `userAdmin` / `userAdminAnyDatabase` 权限的用户。
2. **连接方式**（任选其一）：
   - **MongoDB Shell**：已安装 `mongosh`（新版）或 `mongo`（旧版），并能连接到目标 MongoDB 服务器；
   - **Node.js 脚本**：本仓库提供 `create_mongodb_user.js`，**无需安装 mongosh**，用 Node.js 即可创建数据库与用户（见下方「mongosh 未找到」说明）。

---

## 二、操作步骤概览

| 步骤 | 操作 |
|------|------|
| 1 | 用管理员账号连接 MongoDB |
| 2 | 切换到目标数据库（不存在则会隐式创建） |
| 3 | 在目标库中创建用户并赋予角色 |
| 4 | 验证连接与权限 |

---

## 三、详细步骤

### 步骤 1：用管理员连接 MongoDB

```bash
# 使用 mongosh（MongoDB 5.0+ 推荐）
mongosh "mongodb://admin:你的管理员密码@服务器IP:27017/admin"

# 或使用 mongo（旧版）
mongo "mongodb://admin:你的管理员密码@服务器IP:27017/admin"
```

- 将 `admin`、`你的管理员密码`、`服务器IP` 替换为实际值。
- 认证库使用 `admin`，即 `authSource=admin`（URI 里用 `/admin` 即可）。

---

### 步骤 2：切换到目标数据库

MongoDB **没有单独的建库命令**，执行 `use 数据库名` 时，若库不存在会自动创建（首次写入时真正落地）。

```javascript
// 切换到新数据库（例如：my_new_db）
use my_new_db
```

将 `my_new_db` 替换为你要创建的数据库名。

---

### 步骤 3：在目标库中创建用户

**方式 A：在目标库下创建用户（推荐，认证库 = 目标库）**

```javascript
use my_new_db

db.createUser({
  user: "my_new_user",           // 用户名
  pwd: "你的强密码",             // 密码，建议含大小写、数字、符号
  roles: [
    { role: "readWrite", db: "my_new_db" }   // 该库读写
    // 如需更多库，可追加：{ role: "readWrite", db: "other_db" }
  ]
})
```

- 用户会创建在 `my_new_db` 中，连接时使用 `authSource=my_new_db` 或直接连 `my_new_db` 即可。

**方式 B：在 admin 中创建用户，但授权访问目标库**

```javascript
use admin

db.createUser({
  user: "my_new_user",
  pwd: "你的强密码",
  roles: [
    { role: "readWrite", db: "my_new_db" }
  ]
})
```

- 用户创建在 `admin`，连接时需 `authSource=admin`。

**常用角色说明：**

| 角色 | 说明 |
|------|------|
| `read` | 只读 |
| `readWrite` | 读写 |
| `dbAdmin` | 库管理（索引、统计等） |
| `dbOwner` | 库内所有权限（慎用） |
| `userAdmin` | 本库用户管理 |

---

### 步骤 4：验证

**4.1 查看用户**

```javascript
use my_new_db
db.getUser("my_new_user")
```

**4.2 测试连接**

```bash
mongosh "mongodb://my_new_user:你的强密码@服务器IP:27017/my_new_db"
```

若在 **方式 B** 下创建的用户，需指定认证库：

```bash
mongosh "mongodb://my_new_user:你的强密码@服务器IP:27017/my_new_db?authSource=admin"
```

**4.3 简单读写测试**

```javascript
use my_new_db
db.test.insertOne({ hello: 1 })
db.test.find()
```

---

## 四、完整示例（复制可微调）

假设：

- 新数据库：`project_x`
- 新用户：`project_x_app`
- 密码：`YourStr0ng!Pass`
- 服务器：`172.18.100.10:27017`
- 管理员：`admin` / `admin_password`

在 **mongosh** 中依次执行：

```javascript
// 1. 管理员连接后，切换目标库
use project_x

// 2. 创建用户
db.createUser({
  user: "project_x_app",
  pwd: "YourStr0ng!Pass",
  roles: [
    { role: "readWrite", db: "project_x" }
  ]
})

// 3. 验证
db.getUser("project_x_app")
```

应用连接字符串示例：

```
mongodb://project_x_app:YourStr0ng!Pass@172.18.100.10:27017/project_x
```

密码若含 `@`、`:`、`#`、空格等，需 [URL 编码](https://www.w3schools.com/tags/ref_urlencode.asp)，或参考 [README_MongoDB认证问题排查.md](./README_MongoDB认证问题排查.md)。

---

## 五、常见问题

### 1. `Authentication failed`

- 检查用户名、密码、认证库（`authSource`）是否与创建时一致。
- 若密码含特殊字符，必须做 URL 编码后再写入连接串。

### 2. `not authorized on xxx to execute command`

- 用户在该库上缺少对应权限，在 `admin` 或该库下为用户追加角色，例如：

```javascript
use project_x
db.grantRolesToUser("project_x_app", [{ role: "readWrite", db: "project_x" }])
```

### 3. 修改用户密码

```javascript
use my_new_db
db.changeUserPassword("my_new_user", "新密码")
```

### 4. 删除用户

```javascript
use my_new_db
db.dropUser("my_new_user")
```

---

## 六、mongosh 未找到时的替代方案（推荐）

若提示 **`'mongosh' 不是内部或外部命令`**，说明未安装 MongoDB Shell 或未加入 PATH。可用本项目自带的 **Node.js 脚本** 创建数据库与用户，无需 mongosh。

### 1. 确保已安装依赖

在项目根目录执行：

```bash
npm install
```

### 2. 运行脚本

```bash
node create_mongodb_user.js --admin-uri "mongodb://admin:seVDewlqwExP@127.0.0.1:27017/admin" --db 新库名 --user 新用户名 --pwd 新用户密码
```

将 `admin`、`seVDewlqwExP`、`127.0.0.1`、`新库名`、`新用户名`、`新用户密码` 替换为实际值。

### 3. 可选参数

- `--role`：角色，默认 `readWrite`，也可选 `read`、`dbOwner` 等。

### 4. 使用环境变量

```bash
set ADMIN_URI=mongodb://admin:seVDewlqwExP@127.0.0.1:27017/admin
set NEW_DB=mydb
set NEW_USER=myuser
set NEW_PWD=mypass
node create_mongodb_user.js
```

---

## 七、相关文档

- [README_MongoDB认证问题排查.md](./README_MongoDB认证问题排查.md) — 认证失败、密码特殊字符等
- [README_MongoDB授权错误修复.md](./README_MongoDB授权错误修复.md) — 权限不足、角色配置
- [MongoDB 官方：createUser](https://www.mongodb.com/docs/manual/reference/method/db.createUser/)
- [MongoDB 官方：Built-in Roles](https://www.mongodb.com/docs/manual/reference/built-in-roles/)
