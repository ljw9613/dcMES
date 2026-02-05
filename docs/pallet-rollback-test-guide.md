# 托盘入托回滚机制测试指南

## 目的

验证「条码工序已绑定、但托盘写入失败」时，系统能正确回滚工序状态（解绑工序、不生成解绑记录），避免条码进度 100% 而托盘无该条码的数据不一致。

## 测试原理

流程中先执行**工序完成**（条码绑定、产出量+1、进度 100%），再执行**托盘写入**。通过环境变量在工序成功后、托盘写入前**模拟失败**，触发 catch 中的回滚逻辑。

## 测试步骤

### 1. 开启测试钩子

启动服务前设置环境变量：

```bash
# Windows (cmd)
set TEST_PALLET_ROLLBACK=1
node bin/www

# Windows (PowerShell)
$env:TEST_PALLET_ROLLBACK="1"
node bin/www

# Linux / macOS
TEST_PALLET_ROLLBACK=1 node bin/www
# 或
export TEST_PALLET_ROLLBACK=1
node bin/www
```

使用 pm2 时可在 `ecosystem.config.js` 中为该进程设置 `env: { TEST_PALLET_ROLLBACK: '1' }`，测试完改回或删除。

### 2. 执行一次入托请求

用**一条真实、可入托的条码**调用托盘提交条码接口（例如当前产线、当前工单下的条码）：

```http
POST /api/v1/handlePalletBarcode
Content-Type: application/json

{
  "lineId": "产线ID",
  "lineName": "产线名称",
  "processStepId": "工序ID",
  "materialId": "物料ID",
  "materialCode": "物料编码",
  "materialName": "物料名称",
  "mainBarcode": "要测试的条码",
  "totalQuantity": 84,
  "userId": "用户ID",
  "fromRepairStation": false
}
```

此时会：

- 工序完成（`scanBatchDocument`）**成功** → 条码进度 100%、产出量+1
- 紧接着因测试钩子**抛出** `TEST_ROLLBACK: 模拟托盘写入失败`
- 进入 catch，因 `processCompleted === true`，执行回滚：调用 `unbindProcessComponents(..., true)`（不生成解绑记录）

### 3. 验证回滚是否生效

| 检查项 | 预期 |
|--------|------|
| 接口/日志 | 返回或打印错误信息，包含「模拟托盘写入失败」或「工序状态回滚」相关日志 |
| 条码工序进度 | 该条码对应工序**不再**是 100%，已回滚为未完成状态 |
| 工单产出量 | 该工单产出量**没有**因这次请求而净增加（先+1 再回滚 -1） |
| 托盘 | 该托盘的 `palletBarcodes` 中**没有**这条码 |
| 解绑记录 | 本次回滚**不会**产生新的解绑工序记录（因传入了 `skipUnbindRecord: true`） |

可按业务需要查：

- 物料工序流程表：该条码在该工序的完成状态、进度
- 工单/产出量统计
- 托盘表：`palletBarcodes`
- 解绑记录表：本次请求时间附近不应多出一条对应此条码的解绑记录

### 4. 关闭测试钩子

**重要：测试结束后务必关闭，否则之后每次入托都会在写入托盘前失败。**

- 若用命令行：新开终端，不设置 `TEST_PALLET_ROLLBACK` 再启动服务
- 若用 pm2：从配置中移除 `TEST_PALLET_ROLLBACK` 或设为 `0`，然后重启进程

## 代码位置说明

- 测试钩子：`dcMes_server/services/materialPalletizing.js` 中 `_handlePalletBarcodeInternalSimple`，在步骤 5（工序完成）之后、步骤 6（托盘写入）之前，判断 `process.env.TEST_PALLET_ROLLBACK === '1'` 时抛出错误。
- 回滚逻辑：同一方法内 catch 中 `if (processCompleted)` 分支，调用 `materialProcessFlowService.unbindProcessComponents(..., true)`，最后一个参数为「不生成解绑工序记录」。

## 注意事项

- 仅用于测试环境或本地验证，生产环境**不要**设置 `TEST_PALLET_ROLLBACK=1`。
- 测试用条码建议使用可重复入托/解绑的条码，或使用专门测试数据，避免影响正式生产数据。
