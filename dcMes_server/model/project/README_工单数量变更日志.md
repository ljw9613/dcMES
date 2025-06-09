# 工单数量变更日志记录功能

## 概述

该功能为工单投入产出数量的修改操作提供完整的审计日志记录，确保所有数量变更都有详细的跟踪记录。

## 数据库表结构

### work_order_quantity_logs 集合

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| workOrderId | ObjectId | 是 | 工单ID |
| workOrderNo | String | 是 | 工单编号 |
| materialId | ObjectId | 是 | 物料ID |
| materialCode | String | 是 | 物料编码 |
| materialName | String | 是 | 物料名称 |
| productionLineId | String | 否 | 产线ID |
| productionLineName | String | 否 | 产线名称 |
| changeType | String | 是 | 变更类型(input/output) |
| changeQuantity | Number | 是 | 变更数量(正数增加，负数减少) |
| beforeQuantity | Number | 是 | 变更前数量 |
| afterQuantity | Number | 是 | 变更后数量 |
| relatedBarcode | String | 否 | 相关主条码 |
| barcodeOperation | String | 否 | 条码操作类型 |
| processStepId | ObjectId | 否 | 工序步骤ID |
| processName | String | 否 | 工序名称 |
| processCode | String | 否 | 工序编码 |
| beforeStatus | String | 否 | 变更前工单状态 |
| afterStatus | String | 否 | 变更后工单状态 |
| beforeProgress | Number | 否 | 变更前进度百分比 |
| afterProgress | Number | 否 | 变更后进度百分比 |
| operatorId | String | 是 | 操作人员ID |
| operatorName | String | 否 | 操作人员姓名 |
| operateTime | Date | 是 | 操作时间 |
| reason | String | 否 | 变更原因 |
| remark | String | 否 | 备注信息 |
| ipAddress | String | 否 | 操作IP地址 |
| userAgent | String | 否 | 用户代理信息 |
| isAutomatic | Boolean | 否 | 是否为自动操作 |
| source | String | 否 | 数据来源(DEVICE/WEB/API/SYSTEM) |

## 条码操作类型说明

| 类型 | 说明 |
|------|------|
| SCAN_PROCESS | 扫描工序组件 |
| SCAN_BATCH_DOC | 扫描批次单据 |
| UNBIND_PROCESS | 解绑工序 |
| INITIALIZE_PRODUCT | 初始化产品 |
| MANUAL_ADJUST | 手动调整 |
| OTHER | 其他操作 |

## 使用方式

### 调用示例

```javascript
// 基本调用（仅更新数量，使用默认日志记录）
await MaterialProcessFlowService.updateWorkOrderQuantity(workOrderId, "input", 1);

// 完整日志记录调用
await MaterialProcessFlowService.updateWorkOrderQuantity(
  workOrderId, 
  "input", 
  1, 
  {
    relatedBarcode: "主条码",
    barcodeOperation: "SCAN_PROCESS",
    operatorId: "用户ID",
    processStepId: "工序ID",
    processName: "工序名称",
    processCode: "工序编码",
    reason: "扫描工序组件首道工序投入",
    remark: "备注信息",
    source: "WEB",
    isAutomatic: true,
  }
);
```

### 日志查询示例

```javascript
const WorkOrderQuantityLog = require("../model/project/workOrderQuantityLog");

// 查询特定工单的所有数量变更记录
const logs = await WorkOrderQuantityLog.find({ workOrderId: "工单ID" })
  .populate('workOrderId')
  .populate('materialId')
  .sort({ operateTime: -1 });

// 查询特定条码相关的数量变更记录
const barcodeLogs = await WorkOrderQuantityLog.find({ relatedBarcode: "条码" })
  .sort({ operateTime: -1 });

// 查询特定时间范围内的数量变更记录
const timeLogs = await WorkOrderQuantityLog.find({
  operateTime: {
    $gte: new Date("2024-01-01"),
    $lte: new Date("2024-01-31")
  }
}).sort({ operateTime: -1 });
```

## 索引

为了提高查询性能，已创建以下索引：

- `{ workOrderId: 1, operateTime: -1 }` - 按工单和时间查询
- `{ relatedBarcode: 1, operateTime: -1 }` - 按条码和时间查询
- `{ materialId: 1, operateTime: -1 }` - 按物料和时间查询
- `{ operateTime: -1 }` - 按时间查询
- `{ changeType: 1, operateTime: -1 }` - 按变更类型和时间查询

## 注意事项

1. 日志记录失败不会影响主业务流程的执行
2. 所有的工单数量变更操作都会自动记录日志
3. 建议定期清理历史日志数据以保持系统性能
4. 日志数据可用于审计、统计分析和问题排查 