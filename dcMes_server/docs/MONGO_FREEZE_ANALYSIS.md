# MongoDB 查询变慢 / 假死原因分析报告

基于 `mongo-freeze-analysis.txt` 完整日志的分析结论。

---

## 一、根本原因概览

| 原因类型 | 影响 | 状态 |
|----------|------|------|
| **1. 定时备份 mongodump 全表扫大表** | 锁竞争、IO 打满，业务请求排队 | 需改备份策略 + 索引 |
| **2. k3_bd_materials 物料搜索 COLLSCAN** | 单条 5–7 分钟，十余条并发导致假死 | 已做前缀正则 + 索引 |
| **3. 无索引导致 COLLSCAN** | machine、processsteps、dictdatas 等 | 已加索引 |
| **4. 锁排队传导** | 简单 insert/find 也需 10–80 秒 | 随 1、2 解决而缓解 |

---

## 二、原因 1：mongodump 定时备份扫大表（最重）

### 现象

- **02:01** 一次备份：
  - `material_process_flows`：**COLLSCAN，docsExamined: 1,081,790，耗时 71,026ms（约 71 秒）**
  - `inspection_last_data`：**COLLSCAN，docsExamined: 2,536,292，耗时 16,269ms**
- **03:00、04:00、05:00、06:00、07:00、08:00** 每小时重复一次，每次都对这两张表做时间范围查询并 **COLLSCAN**。

### 备份使用的查询

```javascript
// 备份脚本用的过滤条件
filter: { createdAt: { $gte: new Date(1773590400000), $lte: new Date(1773676799999) } }
```

### 问题点

- 库表实际时间字段与备份脚本不一致：
  - **material_process_flows**：模型里是 **createAt**（无 d），不是 `createdAt`
  - **inspection_last_data**：模型里是 **createTime**（timestamps 映射），不是 `createdAt`
- 若备份一直用 `createdAt`，则无法命中 **createAt / createTime** 上的索引，只能 **COLLSCAN**，锁和 IO 压力大，业务请求被拖慢。

### 建议

1. **改备份脚本**：按库表实际字段查，并用索引：
   - `material_process_flows`：用 **createAt** 做范围查询
   - `inspection_last_data`：用 **createTime** 做范围查询
2. **确认索引**：
   - `material_process_flows` 已有 `createAt: -1` 索引（model 里已建）
   - `inspection_last_data` 已有 `createTime: -1` 索引
3. **备份时间**：把 mongodump 放到业务低峰（如凌晨 2–4 点），或改为从从库备份，减少对主库影响。

---

## 三、原因 2：k3_bd_materials 物料搜索 COLLSCAN（假死直接诱因）

### 现象（关库前 10:28:54–55）

- 十余条 **find/count** 同时执行，条件为 `$or: [ { FNumber: { $regex: "…" } }, { FName: { $regex: "…" } } ]`
- 全部 **planSummary: COLLSCAN**，单条耗时约 **300–450 秒**（如 445609ms、444372ms、370831ms、451924ms）
- 关库时这些请求被 `InterruptedAtShutdown`（errCode:11600）

### 典型慢查询示例

```javascript
// find
filter: { $and: [ { $or: [
  { FNumber: { $regex: "1313102", $options: "i" } },
  { FName:  { $regex: "1313102", $options: "i" } }
] } ] }
// 445609ms, COLLSCAN

// count（更重）
query: { $and: [ { $or: [
  { FNumber: { $regex: "1", $options: "i" } },   // 几乎全表
  { FName:  { $regex: "1", $options: "i" } }
] } ] }
// 451924ms
```

### 已做优化

- 在 **libs/request.js** 对 k3_BD_MATERIAL 列表查询做了**前缀正则**转换，使能走索引
- 在 **k3_BD_MATERIAL** 上增加了 **FNumber、FName** 索引

部署后，同类查询应从“几分钟”降到毫秒级；若仍有非前缀的模糊搜索，需要在前端或接口层限制/改为前缀或全文索引方案。

---

## 四、原因 3：其他 COLLSCAN 与无索引（已处理）

日志中还有大量 COLLSCAN（约 2897 条），主要集合与处理如下：

| 集合 | 查询条件 | 已做处理 |
|------|-----------|----------|
| **machine** | machineIp | 已加 idx_machineIp |
| **processsteps** | machineId / machineIds | 已加 idx_machineId、idx_machineIds |
| **user_logins** | userName | 已加 idx_userName |
| **dictdatas** | dictType | 已加 idx_dictType |
| **product_di_number** | diNum + productId | 已加 idx_diNum_productId |

这些索引已在对应 model 中声明，重启应用后会自动创建（或可手动执行脚本建索引）。

---

## 五、原因 4：锁排队导致“简单操作也很慢”

日志里很多**本应很快**的操作耗时 10–80 秒，例如：

- **connection_info** insert：13s、14s、16s、67s、69s、71s…
- **material_process_flows** find( barcode )：虽走 IXSCAN，仍 14s、47s、56s、82s
- **machine** find( machineIp )：COLLSCAN 88 条却 **35s**
- **user_logins** find( _id )：IDHACK 仍 **10.8s**
- **k3_bd_materials** find( _id )：IXSCAN 仍 **21s**

说明当时**全局锁/库锁被长时间占用**，其他请求在排队。占用锁的主要是：

1. mongodump 对 material_process_flows、inspection_last_data 的长时间 COLLSCAN  
2. k3_bd_materials 多条 5–7 分钟的 COLLSCAN 并发

因此：**解决 1 和 2 后，这些“简单操作变慢”会明显缓解。**

---

## 六、其他日志中的问题

### 1. k3_prd_mos 唯一索引创建失败

- **errMsg**: `E11000 duplicate key error ... FID_1 dup key: { : 483880 }`
- 已在 **k3_PRD_MO** 中去掉 FID 的 unique，避免启动时报错；若业务要求 FID 唯一，需先清理重复再建唯一索引。

### 2. api_logs 单行过长

- `warning: log line attempted (18kB) over max size (10kB)`
- 建议对写入 api_logs 的 **responseBody** 做长度限制或截断，避免单条过大。

### 3. materialpalletizingunbindlogs 按 unbindBarcode 查询

- 查询：`filter: { unbindBarcode: "…" }, sort: { _id: -1 }, limit: 1`，耗时约 13s
- 若该查询频繁，可考虑加 **unbindBarcode + _id** 复合索引。

---

## 七、建议执行顺序

1. **立即**：确认已部署 k3_bd_materials 前缀正则 + FNumber/FName 索引，以及 machine、processsteps、user_logins、dictdatas、product_di_number 的索引。
2. **短期**：检查并修改 **mongodump/备份脚本**，使用 **createAt**（material_process_flows）和 **createTime**（inspection_last_data）做时间范围过滤，并尽量在低峰或从库执行。
3. **中期**：为 api_logs 的 responseBody 做截断或大小限制；如需可再为 materialpalletizingunbindlogs 增加 unbindBarcode 相关索引。

按上述顺序处理后，查询变慢和假死现象应会明显减轻或消除。
