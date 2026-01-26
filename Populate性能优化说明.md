# Populate 性能优化说明

## 问题分析

### Populate 对性能的影响

`populate` 确实会影响查询性能，主要原因：

1. **额外的数据库查询**：
   - 主查询：查询 `inspection_last_data` 集合
   - 关联查询1：查询 `machine` 集合（根据 `machineId`）
   - 关联查询2：查询 `processStep` 集合（根据 `processId`）

2. **查询次数计算**：
   - 如果返回 100 条记录，且每条记录都有 `machineId` 和 `processId`
   - 理论上需要：1（主查询）+ 100（machine查询）+ 100（processStep查询）= 201 次查询
   - 但实际上 MongoDB 会优化，相同 ID 的查询会合并

3. **数据传输量**：
   - 如果不使用 `select`，会返回关联文档的所有字段
   - 增加了网络传输和内存占用

## 优化方案

### 1. 使用 select 限制字段（已实现）

**优化前**：
```javascript
populate: JSON.stringify([
  { path: "machineId" },
  { path: "processId" },
])
```

**优化后**：
```javascript
populate: JSON.stringify([
  { path: "machineId", select: "machineName machineCode" },
  { path: "processId", select: "processName processCode" },
])
```

**效果**：
- 减少数据传输量：只传输需要的字段
- 降低内存占用：减少不必要的数据加载
- 提升查询速度：字段越少，查询越快

### 2. 确保关联表有索引

确保 `machine` 和 `processStep` 集合的 `_id` 字段有索引（MongoDB 默认有）。

### 3. 考虑是否真的需要 Populate

如果只需要显示名称，可以考虑：
- 在 `inspection_last_data` 中冗余存储 `machineName` 和 `processName`
- 但这会增加数据冗余和维护成本

## 性能对比

### 优化前
- 查询时间：主查询 + populate 查询
- 数据传输：完整文档（可能包含很多不需要的字段）
- 内存占用：较高

### 优化后
- 查询时间：主查询 + populate 查询（但字段更少，更快）
- 数据传输：只传输需要的字段（减少 50-80% 的数据量）
- 内存占用：降低

## 进一步优化建议

### 1. 批量查询优化

如果查询大量数据，可以考虑：
- 先查询主表数据
- 收集所有唯一的 `machineId` 和 `processId`
- 批量查询关联表
- 在应用层组装数据

但这需要修改后端 API，工作量较大。

### 2. 缓存关联数据

对于不经常变化的关联数据（如设备名称、工序名称），可以：
- 使用 Redis 缓存
- 减少数据库查询次数

### 3. 数据冗余

如果查询性能是瓶颈，可以考虑：
- 在 `inspection_last_data` 中冗余存储 `machineName` 和 `processName`
- 写入时同步更新
- 查询时不需要 populate

## 当前索引状态

根据您提供的索引信息，当前 `inspection_last_data` 集合有：
- `_id_` - 主键索引
- `scanCode_1` - 扫描码索引 ✅
- `machineId_1` - 设备ID索引 ✅
- `createTime_-1` - 创建时间索引
- `processId_1` - 工序ID索引 ✅

**注意**：之前添加的复合索引可能还没有创建，需要：
1. 重启应用服务（让模型定义生效）
2. 或者在 MongoDB 中手动创建索引

## 查询性能分析

### 主要性能瓶颈

1. **扫描码模糊查询**（已优化）
   - 使用精确查询或前缀查询可以大幅提升性能

2. **Populate 查询**（已优化）
   - 使用 `select` 限制字段可以减少数据传输

3. **分页查询**
   - 确保使用索引进行排序
   - 避免使用 `skip` 进行大偏移量分页

### 性能测试建议

1. **测试精确查询**：
   ```javascript
   // 使用精确查询模式
   scanCode: "完整扫描码"
   ```

2. **测试模糊查询**：
   ```javascript
   // 使用模糊查询模式
   scanCode: { $regex: "部分扫描码", $options: "i" }
   ```

3. **对比优化前后**：
   - 记录查询时间
   - 对比数据传输量
   - 监控数据库负载

## 总结

1. **Populate 确实会影响性能**，但通过优化可以降低影响
2. **使用 select 限制字段**是最简单有效的优化方式
3. **确保关联表有索引**也很重要
4. **如果性能仍不满足需求**，可以考虑数据冗余或缓存方案

## 下一步

1. ✅ 已优化所有 populate 查询，只选择需要的字段
2. ⏳ 需要创建复合索引（重启应用或手动创建）
3. ⏳ 测试优化后的查询性能
4. ⏳ 根据实际性能决定是否需要进一步优化
