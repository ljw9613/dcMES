# 2026-03-23 优化问题清单

## 背景

基于近期 MongoDB `system.profile`、备份配置、`materialProcessFlowService` 代码和相关模型索引检查，当前系统存在明显的查询放大、时间字段不一致、备份扫描过重等问题。以下清单按优先级整理，便于逐项落地。

## 已确认现象

- `material_process_flows` 多条慢查询耗时约 `4s ~ 7s`，常见特征是：
  - 条件包含 `productionPlanWorkOrderId`
  - 可能附带 `status` / `productStatus` / `progress`
  - 排序字段为 `createAt: -1`
  - 使用深分页 `skip: 4050/4060/4070`
  - `keysExamined` / `docsExamined` 达到 `111万+`
- 备份任务 `mongodump` 对多个集合触发 `COLLSCAN`：
  - `material_process_flows`
  - `collect_data`
  - `inspection_data`
  - `inspection_last_data`
- `k3_prd_mos` 按 `FSaleOrderNo` 查询时出现全表扫描，`docsExamined` 达到 `249万+`

## P0：必须优先处理

### 1. `material_process_flows` 缺少关键复合索引

影响：

- 工单维度列表、状态筛选、排序分页查询扫描量极大
- 高并发下会持续占用连接池和磁盘 IO

当前已有索引：

- `productionPlanWorkOrderId_1`
- `createAt_-1`
- `status_1`

问题：

- 这些单列索引无法覆盖实际查询组合
- Mongo 虽然走了 `IXSCAN`，但仍然扫描 `111万+` 记录

建议新增索引：

```javascript
db.material_process_flows.createIndex(
  { productionPlanWorkOrderId: 1, createAt: -1 },
  { name: "idx_workOrder_createAt" }
)

db.material_process_flows.createIndex(
  { productionPlanWorkOrderId: 1, status: 1, createAt: -1 },
  { name: "idx_workOrder_status_createAt" }
)

db.material_process_flows.createIndex(
  { productionPlanWorkOrderId: 1, status: 1, productStatus: 1, createAt: -1 },
  { name: "idx_workOrder_status_productStatus_createAt" }
)

db.material_process_flows.createIndex(
  { productionPlanWorkOrderId: 1, progress: 1, createAt: -1 },
  { name: "idx_workOrder_progress_createAt" }
)
```

### 2. `collect_data` 缺少时间索引

影响：

- 备份按时间范围查询时只能全表扫描
- 当前集合仅有 `_id` 索引

已确认：

- 实际时间字段是 `createTime`

建议新增索引：

```javascript
db.collect_data.createIndex(
  { createTime: 1 },
  { name: "idx_createTime" }
)
```

### 3. 备份时间字段映射仍未完全统一

已完成：

- `backupServer/incremental_backup_manager.js` 已补充：
  - `material_process_flows -> createAt`
  - `inspection_last_data -> createTime`
  - `inspection_data -> createTime`
  - `collect_data -> createTime`

仍需继续核对的集合：

- `warehouse_entries`：模型字段是 `createAt`
- `material_palletizings`：模型字段是 `createAt`
- `api_logs`：模型字段是 `timestamp`
- `system_log`：时间字段尚未核实

建议：

- 继续完善 `getTimeFieldForCollection()` 的映射，避免策略默认使用 `createdAt`
- 不建议仅靠 `config.js` 里整组 `timeField` 解决，因为同一策略下集合字段并不统一

### 4. `k3_prd_mos` 缺少 `FSaleOrderNo` 索引

影响：

- 按销售单号查询时全表扫描

建议新增索引：

```javascript
db.k3_prd_mos.createIndex(
  { FSaleOrderNo: 1 },
  { name: "idx_FSaleOrderNo" }
)
```

## P1：高优先级优化

### 5. `materialProcessFlowService` 中存在深分页查询

问题特征：

- 使用 `skip + limit`
- 高页码时性能持续恶化
- 当前慢查询已出现 `skip: 4050+`

涉及位置：

- `dcMes_server/routes/materialProcessFlowService.js`
- 销售订单成品流程导出接口 `/api/v1/export-by-sale-order`

建议：

- 改为基于游标的翻页方案
- 至少增加稳定排序字段，避免无序分页

### 6. 时间字段命名在模型、服务、备份配置之间不统一

现状：

- 有的集合用 `createAt`
- 有的集合用 `createTime`
- 有的代码却按 `createdAt` 查询

已发现问题代码：

- `materialProcessFlowService.validateRecentFlows()` 使用 `createdAt`
- `findAffectedBarcodesByCraftChange()` 使用 `createdAt`
- 备份配置默认大量使用 `createdAt`

风险：

- 查询条件命中错误字段
- 已有索引无法生效
- 慢查询和空结果同时出现

建议：

- 中长期统一为一套时间字段命名
- 短期通过时间字段映射兜底
- 逐步替换服务代码中的错误字段名

### 7. `scanProcessComponents()` 仍有高并发热点

问题：

- 对批次条码逐条 `countDocuments()`
- 对关键物料再做一次 `aggregate()`
- 大批量扫码时数据库往返次数偏多

建议：

- 批次条码使用聚合或批量查询合并统计
- 评估是否需要补充与 `processNodes.barcode` 相关的更贴近查询条件的索引
- 持续观察该方法的耗时日志

### 8. `validateRecentFlows()` 存在全量拉取 + N+1 查询

问题：

- 先查最近 10 天所有流程
- 再逐条、逐节点执行额外查询
- 适合离线修复，不适合线上高频调用

建议：

- 明确限制为脚本/管理任务使用
- 执行时增加批次处理和字段裁剪

## P2：中期治理

### 9. 统一备份策略的时间字段治理方式

建议目标：

- 所有备份集合都通过 `getTimeFieldForCollection()` 明确时间字段
- `config.js` 中的 `timeField` 仅作为兜底默认值
- 对不支持时间增量的集合单独标记

### 10. 建立慢查询回归验证流程

建议：

- 每次新增索引后执行对应 `explain("executionStats")`
- 对关键接口记录：
  - `planSummary`
  - `keysExamined`
  - `docsExamined`
  - `executionTimeMillis`

## 建议执行顺序

1. 为 `collect_data`、`k3_prd_mos` 创建缺失索引。
2. 为 `material_process_flows` 创建 4 个核心复合索引。
3. 继续补齐备份管理器中的时间字段映射。
4. 修复 `materialProcessFlowService` 中错误使用 `createdAt` 的代码。
5. 将 `skip` 深分页改为游标分页。

## 验证命令

### 查看索引

```javascript
db.material_process_flows.getIndexes()
db.collect_data.getIndexes()
db.k3_prd_mos.getIndexes()
```

### 验证查询是否命中新索引

```javascript
db.material_process_flows.find(
  { productionPlanWorkOrderId: ObjectId("替换为实际ID"), status: "IN_PROCESS" }
).sort({ createAt: -1 }).limit(10).explain("executionStats")
```

```javascript
db.collect_data.find(
  { createTime: { $gte: ISODate("2026-03-22T16:00:00Z"), $lte: ISODate("2026-03-23T15:59:59.999Z") } }
).limit(1).explain("executionStats")
```

### 查看最近慢查询

```javascript
db.system.profile.find({ millis: { $gte: 3000 } }).sort({ ts: -1 }).limit(20).pretty()
```

## 备注

- 这份清单基于当前代码、索引和慢查询样本整理。
- 如果后续继续核对 `system_log`、`warehouse_entries`、`material_palletizings` 的时间字段，可以在本清单上继续补充。
