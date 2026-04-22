# 第三方接口管理 — 接口请求逻辑说明

> 适用人员：开发 / 对接联调人员
> 后端框架：Node.js + Express + MongoDB（Mongoose）

---

## 一、整体架构

```
前端（Vue 2）
    │  axios + JWT Bearer Token
    ▼
MES 后端（Express）
    │  activityCheck() 登录校验（Mock 接口除外）
    ▼
代理层 / 业务逻辑
    │  axios 代理转发
    ▼
第三方目标服务器
```

所有请求通过 MES 后端代理发出，前端**不直接调用**第三方地址，好处：
- 统一做 JWT 鉴权
- 完整记录请求/响应日志
- 文件统一由服务端管理

---

## 二、接口 URL 总览

| 模块 | Method | 路径 | 说明 |
|------|--------|------|------|
| 接口配置 | GET | `/api/v1/tp-api-config/list` | 列表查询（分页+筛选） |
| 接口配置 | GET | `/api/v1/tp-api-config/:id` | 详情（含关联模板） |
| 接口配置 | POST | `/api/v1/tp-api-config/add` | 新增 |
| 接口配置 | PUT | `/api/v1/tp-api-config/:id` | 编辑 |
| 接口配置 | PUT | `/api/v1/tp-api-config/:id/status` | 切换状态 |
| 接口配置 | DELETE | `/api/v1/tp-api-config/:id` | 软删除（级联） |
| 接口配置 | GET | `/api/v1/tp-api-config/:id/file-records` | 最近上传文件记录 |
| **接口调用** | **POST** | **`/api/v1/tp-api-config/:id/call`** | **代理调用第三方** |
| 参数模板 | GET | `/api/v1/tp-param-template/list` | 列表（按接口ID） |
| 参数模板 | GET | `/api/v1/tp-param-template/:id` | 详情 |
| 参数模板 | POST | `/api/v1/tp-param-template/add` | 新增 |
| 参数模板 | PUT | `/api/v1/tp-param-template/:id` | 编辑 |
| 参数模板 | DELETE | `/api/v1/tp-param-template/:id` | 软删除 |
| 参数模板 | POST | `/api/v1/tp-param-template/batch-delete` | 批量删除 |
| 参数模板 | POST | `/api/v1/tp-param-template/sort` | 批量更新排序 |
| 参数模板 | GET | `/api/v1/tp-param-template/:id/op-logs` | 操作记录 |
| 请求日志 | GET | `/api/v1/tp-call-log/list` | 列表查询（分页+筛选） |
| 请求日志 | GET | `/api/v1/tp-call-log/:id` | 详情（含文件/模板快照） |
| 请求日志 | POST | `/api/v1/tp-call-log/:id/retry` | 重试（参数/文件沿用原始） |
| 请求日志 | GET | `/api/v1/tp-call-log/:id/file/download` | 下载关联文件（Blob） |
| Mock 测试 | GET/POST | `/api/v1/mock/*` | 测试用模拟接口（无需登录） |

---

## 三、核心流程：接口代理调用

### 3.1 请求入口

```
POST /api/v1/tp-api-config/:id/call
Content-Type: multipart/form-data  （文件模式）
            或 application/json    （参数模式）
```

Multer 中间件 `upload.single("file")` 挂载在路由上：
- 若请求携带 `file` 字段（multipart）→ 进入**文件调用**模式
- 若为 JSON 请求 → 进入**自定义参数**模式

### 3.2 流程图

```
收到调用请求
    │
    ├── 校验接口配置是否存在且状态=启用
    │
    ├── [文件模式] req.file 存在？
    │       ├── 将文件保存至 public/uploads/tp-api/
    │       ├── 写入 api_file_records（含 apiConfigId / fileName / filePath / fileSize）
    │       ├── 清理超出 3 条的旧文件记录（同步删磁盘文件）
    │       └── 构造 FormData 向第三方发送
    │
    └── [参数模式] 读取 req.body
            ├── paramType = 1 (Query)    → 参数拼接到 URL ?key=value
            ├── paramType = 2 (form-data) → 构造 multipart/form-data body
            └── paramType = 3 (urlencoded) → 构造 application/x-www-form-urlencoded body
    │
    ├── 使用 axios 向第三方服务器发起实际请求（timeout=30s）
    │       ├── 成功 → responseStatus = "success"，记录响应体/响应头
    │       └── 失败 → responseStatus = "fail"，记录错误信息
    │
    └── 写入 api_call_logs（无论成功失败均记录）
            返回给前端：{ responseStatus, responseBody, responseHeaders, duration, logId }
```

### 3.3 请求体格式（参数模式）

```json
// Content-Type: application/json
{
  "paramType": 1,            // 1=Query, 2=form-data, 3=urlencoded
  "params": "[{\"key\":\"name\",\"value\":\"test\"}]",  // JSON字符串，后端做 JSON.parse
  "paramTemplateId": "6abc..."  // 可选，记录日志快照用
}
```

> `params` 字段以 **JSON 字符串**传递（前端 `JSON.stringify(validParams)`），后端兼容字符串和数组两种格式。

### 3.4 请求体格式（文件模式）

```
Content-Type: multipart/form-data
Body:
  file = <二进制文件>
```

文件存储路径：`dcMes_server/public/uploads/tp-api/{timestamp}_{random}.{ext}`

---

## 四、日志重试逻辑

### 4.1 请求

```
POST /api/v1/tp-call-log/:id/retry
```

### 4.2 重试规则

| 调用方式 | 允许重试的状态 | 文件来源 |
|---------|-------------|---------|
| 参数模式（callMode=1） | 仅 `fail` | — |
| 文件模式（callMode=2） | `fail` 或 `success` | 读取原 `filePath` 磁盘文件 |

### 4.3 流程

```
收到重试请求
    │
    ├── 读取日志记录，校验 callMode 和 responseStatus（见上表）
    │
    ├── 获取当前接口配置（优先使用最新URL/Method，若接口已删则使用日志快照）
    │       └── 若接口存在但状态非"启用" → 返回错误，拒绝重试
    │
    ├── [文件模式] 从 api_file_records 查找 filePath
    │       └── 文件不存在 → 返回 400（需重新上传）
    │
    ├── [参数模式] 使用原 requestParams，或前端传入新参数覆盖
    │
    ├── 使用 axios 发起实际请求
    │
    └── 更新原日志记录（responseStatus / responseBody / duration / retryCount +1）
        不会创建新日志条目
```

---

## 五、文件下载逻辑

### 5.1 请求

```
GET /api/v1/tp-call-log/:id/file/download
Authorization: Bearer <token>
```

### 5.2 流程

```
收到下载请求
    │
    ├── 读取日志记录，获取 fileRecordId
    ├── 读取 api_file_records，获取 filePath
    ├── 校验 fs.existsSync(filePath)
    │       └── 文件不存在 → 返回 404
    └── res.download(filePath, originalFileName)  → 触发浏览器下载
```

> 前端使用 `axios responseType: 'blob'` 下载，自动携带 Authorization 头，再通过 `URL.createObjectURL` 触发浏览器保存对话框。`window.open` 方式会因缺少 token 而返回 401，**不可用**。

---

## 六、数据模型说明

### 6.1 third_party_api_config（接口配置）

| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 接口名称（唯一索引） |
| url | String | 第三方接口完整 URL |
| method | String | GET/POST/PUT/DELETE |
| description | String | 描述 |
| status | Number | 1=启用, 2=禁用, 3=作废 |
| deleted | Boolean | 软删除标志（mongoose-delete） |

### 6.2 api_param_templates（参数模板）

| 字段 | 类型 | 说明 |
|------|------|------|
| apiConfigId | ObjectId | 关联接口配置 |
| name | String | 模板名称（同接口内唯一） |
| paramType | Number | 1=Query, 2=form-data, 3=urlencoded |
| params | Array | `[{key, value}]` |
| sortOrder | Number | 排序权重 |

### 6.3 api_call_logs（请求日志）

| 字段 | 类型 | 说明 |
|------|------|------|
| apiConfigId | ObjectId | 关联接口（软删后置 null） |
| apiConfigSnapshot | Object | 调用时接口的快照 `{name, url, method}` |
| callMode | Number | 1=参数模式, 2=文件模式 |
| requestUrl | String | 实际发出的请求 URL（含 Query 参数） |
| requestParams | Object | `{paramType, items:[{key,value}]}` |
| paramTemplateId | ObjectId | 使用的模板 ID（弱引用） |
| paramTemplateSnapshot | String | 调用时模板名称快照 |
| fileRecordId | ObjectId | 关联文件记录 |
| responseStatus | String | "success" / "fail" |
| responseBody | String | 响应体（JSON 字符串） |
| responseHeaders | String | 响应头（JSON 字符串） |
| errorMessage | String | 失败时的错误信息 |
| duration | Number | 请求耗时（ms） |
| requestTime | Date | 请求发起时间 |
| retryCount | Number | 重试次数（每次 retry +1） |
| calledBy / calledName | String | 调用人 ID / 姓名 |

### 6.4 api_file_records（文件记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| apiConfigId | ObjectId | 关联接口 |
| fileName | String | 原始文件名 |
| filePath | String | 服务器磁盘绝对路径 |
| fileSize | Number | 文件大小（bytes） |
| callCount | Number | 该文件被调用次数 |

> 每个接口最多保留最近 3 条文件记录，超出后自动删除最旧的（磁盘文件同步清理）。

### 6.5 api_template_op_logs（模板操作日志）

| 字段 | 类型 | 说明 |
|------|------|------|
| templateId | ObjectId | 关联模板 |
| opType | String | "create" / "edit" / "delete" |
| opBy / opName | String | 操作人 |
| beforeData / afterData | Object | 操作前/后的快照数据 |

---

## 七、软删除与级联说明

删除接口配置时（`DELETE /api/v1/tp-api-config/:id`）执行以下级联：

```
接口配置 → deleted = true
    ├── 参数模板    → 全部软删除（deleted = true）
    ├── 文件记录    → 全部软删除（deleted = true）
    └── 调用日志    → apiConfigId 置为 null（日志本身保留，仅解除关联）
```

软删除使用 `mongoose-delete` 插件，所有查询自动加 `deleted: { $ne: true }` 过滤。

---

## 八、Mock 测试接口

测试接口挂载在 `activityCheck()` 中间件**之前**，无需登录 Token 即可访问。

| 路径 | Method | 用途 |
|------|--------|------|
| `/api/v1/mock/ping` | GET | 心跳检测 |
| `/api/v1/mock/echo` | GET | Query 参数回显 |
| `/api/v1/mock/echo-body` | POST | Body（JSON/form-data）回显 |
| `/api/v1/mock/echo-urlencoded` | POST | urlencoded 参数回显 |
| `/api/v1/mock/echo-file` | POST | 文件接收回显（不落盘） |
| `/api/v1/mock/delay/:ms` | GET | 模拟慢接口（最大 10s） |
| `/api/v1/mock/error/:code` | GET | 返回指定 HTTP 状态码 |
| `/api/v1/mock/validate` | POST | 参数必填校验（name/value 必填） |

---

## 九、前端关键实现备注

### 9.1 BaseURL 配置

```
VUE_APP_BASE_API = http://127.0.0.1:2222/api/v1
```

`src/api/thirdPartyApi.js` 中所有 URL **不含 `/api/v1` 前缀**（避免 baseURL 拼接后重复）：

```js
// ✅ 正确
request({ url: '/tp-api-config/list', ... })

// ❌ 错误（会产生 /api/v1/api/v1/...）
request({ url: '/api/v1/tp-api-config/list', ... })
```

### 9.2 文件上传（调用接口）

```js
// 前端发送 FormData，axios 不设 Content-Type（让浏览器自动生成 boundary）
const fd = new FormData();
fd.append('file', rawFile);
callApiConfig(id, fd, true);
// → request({ headers: { 'Content-Type': 'multipart/form-data' } })
```

### 9.3 文件下载

```js
// 使用 responseType: 'blob'，axios 自动携带 Authorization header
const blob = await downloadCallLogFile(logId);
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = filename; a.click();
URL.revokeObjectURL(url);
```

### 9.4 参数序列化

```js
// params 字段以 JSON 字符串传输，后端兼容解析
payload = {
  paramType: 1,
  params: JSON.stringify(validParams),   // "[{\"key\":\"...\",\"value\":\"...\"}]"
  paramTemplateId: selectedTemplateId,
}
```
