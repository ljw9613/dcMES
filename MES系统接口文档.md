# MES系统接口文档



## 通用CRUD接口说明

通过 `CRADROUTER.js` 提供的通用CRUD接口，为系统中的各种数据模型提供统一的增删改查操作。

### 接口格式
所有通用CRUD接口都遵循 RESTful 风格：`/api/v1/{tableName}`

### CRADROUTER创建的接口列表

#### 系统管理模块 (6个接口)
| 表名 | 接口路径 | 功能描述 |
|------|----------|----------|
| user_login | `/api/v1/user_login` | 用户登录信息管理 |
| apiLog | `/api/v1/apiLog` | API调用日志管理 |
| menu | `/api/v1/menu` | 系统菜单管理 |
| role | `/api/v1/role` | 角色权限管理 |
| dictType | `/api/v1/dictType` | 字典类型管理 |
| dictData | `/api/v1/dictData` | 字典数据管理 |

#### MES核心业务模块 (8个接口)
| 表名 | 接口路径 | 功能描述 |
|------|----------|----------|
| craft | `/api/v1/craft` | 工艺管理 |
| barcode | `/api/v1/barcode` | 条码管理 |
| processStep | `/api/v1/processStep` | 工序步骤管理 |
| scanRecord | `/api/v1/scanRecord` | 扫码记录管理 |
| processMaterials | `/api/v1/processMaterials` | 工序物料管理 |
| material_process_flow | `/api/v1/material_process_flow` | 物料工艺流程管理 |
| sampling_inspection_flow | `/api/v1/sampling_inspection_flow` | 抽检流程管理 |
| udi_sampling_inspection_flow | `/api/v1/udi_sampling_inspection_flow` | UDI抽检流程管理 |

#### 生产管理模块 (5个接口)
| 表名 | 接口路径 | 功能描述 |
|------|----------|----------|
| production_plan_work_order | `/api/v1/production_plan_work_order` | 生产计划工单管理 |
| production_line | `/api/v1/production_line` | 生产线管理 |
| equipmentInformation | `/api/v1/equipmentInformation` | 设备信息管理 |
| machine | `/api/v1/machine` | 机器设备管理 |
| printTemplate | `/api/v1/printTemplate` | 打印模板管理 |

#### 托盘和条码管理模块 (9个接口)
| 表名 | 接口路径 | 功能描述 |
|------|----------|----------|
| material_palletizing | `/api/v1/material_palletizing` | 物料托盘化管理 |
| material_palletizing_unbind_log | `/api/v1/material_palletizing_unbind_log` | 托盘解绑日志管理 |
| materialBarcodeBatch | `/api/v1/materialBarcodeBatch` | 物料条码批次管理 |
| barcodeSegmentRuleMaterial | `/api/v1/barcodeSegmentRuleMaterial` | 条码段规则物料管理 |
| preProductionBarcode | `/api/v1/preProductionBarcode` | 预生产条码管理 |
| packBarcode | `/api/v1/packBarcode` | 装箱条码管理 |
| barcodeRule | `/api/v1/barcodeRule` | 条码规则管理 |
| barcodeSegmentRule | `/api/v1/barcodeSegmentRule` | 条码段规则管理 |
| productBarcodeRule | `/api/v1/productBarcodeRule` | 产品条码规则管理 |

#### K3集成模块 (10个接口)
| 表名 | 接口路径 | 功能描述 |
|------|----------|----------|
| k3_BD_MATERIAL | `/api/v1/k3_BD_MATERIAL` | K3物料基础数据管理 |
| k3_PRD_MO | `/api/v1/k3_PRD_MO` | K3生产订单管理 |
| k3_SAL_SaleOrder | `/api/v1/k3_SAL_SaleOrder` | K3销售订单管理 |
| k3_BD_STOCK | `/api/v1/k3_BD_STOCK` | K3库存管理 |
| k3_PUR_PurchaseOrder | `/api/v1/k3_PUR_PurchaseOrder` | K3采购订单管理 |
| k3_PRD_PickMtrl | `/api/v1/k3_PRD_PickMtrl` | K3生产领料管理 |
| k3_SAL_DeliveryNotice | `/api/v1/k3_SAL_DeliveryNotice` | K3销售发货通知管理 |
| k3_PRD_InStock | `/api/v1/k3_PRD_InStock` | K3生产入库管理 |
| k3_PUR_RequisitionBill | `/api/v1/k3_PUR_RequisitionBill` | K3采购申请管理 |
| k3_SAL_OutStock | `/api/v1/k3_SAL_OutStock` | K3销售出库管理 |

#### K3扩展模块 (6个接口)
| 表名 | 接口路径 | 功能描述 |
|------|----------|----------|
| k3_SAL_SaleOrderExt | `/api/v1/k3_SAL_SaleOrderExt` | K3销售订单扩展管理 |
| k3_PRD_PickMtrlExt | `/api/v1/k3_PRD_PickMtrlExt` | K3生产领料扩展管理 |
| k3_PUR_RequisitionBillExt | `/api/v1/k3_PUR_RequisitionBillExt` | K3采购申请扩展管理 |
| k3_SAL_OutStockExt | `/api/v1/k3_SAL_OutStockExt` | K3销售出库扩展管理 |
| k3_SAL_DeliveryNoticeExt | `/api/v1/k3_SAL_DeliveryNoticeExt` | K3发货通知扩展管理 |
| k3_SAL_SaleOrder_CustInfo | `/api/v1/k3_SAL_SaleOrder_CustInfo` | K3销售订单客户信息管理 |

#### 检测模块 (4个接口)
| 表名 | 接口路径 | 功能描述 |
|------|----------|----------|
| InspectionLastData | `/api/v1/InspectionLastData` | 最新检测数据管理 |
| InspectionData | `/api/v1/InspectionData` | 检测数据管理 |
| unbindRecord | `/api/v1/unbindRecord` | 解绑记录管理 |
| sale_order_barcode_mapping | `/api/v1/sale_order_barcode_mapping` | 销售订单条码映射管理 |

#### 仓库管理模块 (2个接口)
| 表名 | 接口路径 | 功能描述 |
|------|----------|----------|
| warehouse_entry | `/api/v1/warehouse_entry` | 仓库入库管理 |
| warehouse_ontry | `/api/v1/warehouse_ontry` | 仓库出库管理 |

#### 维修管理模块 (1个接口)
| 表名 | 接口路径 | 功能描述 |
|------|----------|----------|
| product_repair | `/api/v1/product_repair` | 产品维修管理 |

#### UDI管理模块 (3个接口)
| 表名 | 接口路径 | 功能描述 |
|------|----------|----------|
| productDiNum | `/api/v1/productDiNum` | 产品DI编号管理 |
| productEanNum | `/api/v1/productEanNum` | 产品EAN编号管理 |
| workOrderQuantityLog | `/api/v1/workOrderQuantityLog` | 工单数量变更日志管理 |

**总计：54个通用CRUD接口**

> 注意：以上每个接口都支持完整的CRUD操作（GET查询、POST创建、PUT更新、DELETE删除）


## 专用业务接口

### 1. 用户认证管理 (managerlogin.js)
**作用**: 处理用户登录、认证和权限管理

| 接口 | 方法 | 路径 | 作用 | 主要数据表 |
|------|------|------|------|------------|
| 用户登录 | POST | `/api/v1/user/login` | 用户登录认证，返回JWT token | user_login |
| 获取用户信息 | POST | `/api/v1/user/info` | 根据用户ID获取详细信息 | user_login |
| 用户登出 | POST | `/api/v1/user/logout` | 用户登出操作 | - |

### 2. 物料条码批次管理 (materialBarcodeBatch.js)
**作用**: 管理物料条码的批次创建和分配

| 接口 | 方法 | 路径 | 作用 | 主要数据表 |
|------|------|------|------|------------|
| 创建条码批次 | POST | `/api/v1/material-barcode/create` | 根据物料编码创建条码批次 | materialBarcodeBatch |

### 3. 物料托盘化管理 (materialPalletizing.js)
**作用**: 处理产品条码的托盘组装和管理，支持队列化处理

| 接口 | 方法 | 路径 | 作用 | 主要数据表 |
|------|------|------|------|------------|
| 处理托盘条码 | POST | `/api/v1/handlePalletBarcode` | 队列化处理托盘条码绑定 | materialPalletizing |
| 查询处理状态 | GET | `/api/v1/getPalletProcessingStatus/:jobId` | 查询队列任务处理状态 | - |
| 解绑托盘所有条码 | POST | `/api/v1/unbindPalletAllBarcode` | 解绑托盘中的所有条码 | materialPalletizing |
| 解绑单个条码 | POST | `/api/v1/unbindPalletBarcode` | 解绑托盘中的单个条码 | materialPalletizing |
| 拆分托盘 | POST | `/api/v1/splitPallet` | 将托盘拆分为多个托盘 | materialPalletizing |
| 添加条码到托盘 | POST | `/api/v1/addBarcodeToPallet` | 将条码添加到指定托盘 | materialPalletizing |
| 更新检测状态 | POST | `/api/v1/updatePalletInspectionStatus` | 更新托盘检测状态 | materialPalletizing |

### 4. 物料工艺流程管理 (materialProcessFlowService.js)
**作用**: 完整的物料工艺流程管理，包括条码验证、工序扫码、解绑等

| 接口 | 方法 | 路径 | 作用 | 主要数据表 |
|------|------|------|------|------------|
| 创建流程记录 | POST | `/api/v1/create-flow` | 根据物料编码创建工艺流程 | materialProcessFlow |
| 工序扫码 | POST | `/api/v1/scan-components` | 工序子物料批量扫码提交 | materialProcessFlow |
| 工序解绑 | POST | `/api/v1/unbind-components` | 解绑工序中的物料 | materialProcessFlow |
| 更新流程节点 | POST | `/api/v1/update-flow-nodes` | 更新流程节点状态 | materialProcessFlow |
| 初始化产品 | POST | `/api/v1/initializeProduct` | 初始化产品条码流程 | materialProcessFlow |
| 修复异常数据 | POST | `/api/v1/auto-fix-inconsistent-process-nodes` | 自动修复流程异常数据 | materialProcessFlow |
| 获取物料工序 | GET | `/api/v1/all-process-steps/:materialId` | 获取物料相关的所有工序 | processStep |
| 设备条码初始化 | POST | `/api/v1/initialize-machine-barcode` | 设备条码初始化 | materialProcessFlow |
| 导出BOM结构 | GET | `/api/v1/exportBOM` | 导出物料BOM结构 | materialProcessFlow |
| 修复流程进度 | POST | `/api/v1/fix-flow-progress` | 修复单个流程进度状态 | materialProcessFlow |
| 批量修复进度 | POST | `/api/v1/batch-fix-flow-progress` | 批量修复流程进度状态 | materialProcessFlow |
| 设备扫码 | POST | `/api/v1/machine-scan-components` | 设备自动扫码提交 | materialProcessFlow |
| 更新关联单据 | POST | `/api/v1/batch-update-related-bills` | 批量更新关联单据 | materialProcessFlow |
| 验证流程数据 | GET | `/api/v1/validate-recent-flows` | 验证最近10天流程数据 | materialProcessFlow |
| 检查条码完成 | GET | `/api/v1/check-barcode-completion/:barcode` | 检查条码节点完成情况 | materialProcessFlow |
| 前置校验 | POST | `/api/v1/check-barcode-prerequisites` | 设备产品扫码前置校验 | materialProcessFlow |
| 替换组件 | POST | `/api/v1/replace-component` | 替换物料组件 | materialProcessFlow |
| 导出销售订单 | GET | `/api/v1/export-by-sale-order` | 销售订单成品流程导出 | materialProcessFlow |
| 获取镭雕条码 | POST | `/api/v1/get-laser-print-barcode` | 镭雕设备获取打印条码 | preProductionBarcode |
| 确认条码使用 | POST | `/api/v1/confirm-laser-barcode-used` | 镭雕设备确认使用条码 | preProductionBarcode |

### 5. 装箱条码原子化管理 (packBarcodeAtomic.js)
**作用**: 原子性管理装箱条码的创建和锁定，解决并发问题

| 接口 | 方法 | 路径 | 作用 | 主要数据表 |
|------|------|------|------|------------|
| 获取装箱条码 | POST | `/api/v1/getOrCreatePackBarcode` | 原子性获取或创建装箱条码 | packBarcode |
| 解锁条码 | POST | `/api/v1/unlockPackBarcode` | 解锁单个装箱条码 | packBarcode |
| 批量解锁 | POST | `/api/v1/unlockAllPackBarcodes` | 批量解锁装箱条码 | packBarcode |
| 清理过期锁定 | POST | `/api/v1/cleanExpiredLocks` | 清理过期锁定的条码 | packBarcode |
| 检查条码状态 | GET | `/api/v1/checkPackBarcodeStatus` | 检查装箱条码状态 | packBarcode |

### 6. 产品维修管理 (productRepair.js)
**作用**: 管理产品维修流程，包括维修单创建、审核等

| 接口 | 方法 | 路径 | 作用 | 主要数据表 |
|------|------|------|------|------------|
| 扫码获取产品 | POST | `/api/v1/product_repair/scanProductRepair` | 扫码获取产品维修信息 | materialProcessFlow |
| 提交维修单 | POST | `/api/v1/product_repair/submitProductRepair` | 创建或更新产品维修单 | productRepair |
| 审核维修 | POST | `/api/v1/product_repair/reviewRepair` | 审核单个维修记录 | productRepair |
| 批量审核 | POST | `/api/v1/product_repair/batchReviewRepair` | 批量审核维修记录 | productRepair |

### 7. 系统日志管理 (systemLog.js)
**作用**: 管理系统API调用日志的查询和清理

| 接口 | 方法 | 路径 | 作用 | 主要数据表 |
|------|------|------|------|------------|
| 获取日志列表 | GET | `/api/v1/system/logs` | 分页查询API日志 | apiLog |
| 获取日志详情 | GET | `/api/v1/system/logs/:id` | 获取单个日志详情 | apiLog |
| 清除过期日志 | DELETE | `/api/v1/system/logs/clear-expired` | 清除指定天数前的日志 | apiLog |

### 8. 文件上传管理 (uploadMesFile.js)
**作用**: 处理MES系统中的文件上传功能

| 接口 | 方法 | 路径 | 作用 | 主要数据表 |
|------|------|------|------|------------|
| 上传文件 | POST | `/api/v1/uploadMesFile` | 上传MES系统文件 | fileResource |

### 9. 仓库入库管理 (wareHouseEntry.js)
**作用**: 管理产品入库流程和K3系统同步

| 接口 | 方法 | 路径 | 作用 | 主要数据表 |
|------|------|------|------|------------|
| 扫码入库 | POST | `/api/v1/warehouse_entry/scan` | 托盘扫码入库操作 | warehouseEntry |
| 同步K3入库 | POST | `/api/v1/k3/sync_warehouse_entry` | MES入库单同步至金蝶云 | warehouseEntry |

### 10. 仓库出库管理 (wareHouseOntry.js)
**作用**: 管理产品出库流程，支持托盘出库和单品出库，包含添可订单特殊限制

| 接口 | 方法 | 路径 | 作用 | 主要数据表 |
|------|------|------|------|------------|
| 更新白名单 | POST | `/api/v1/warehouse_entry/update_whitelist` | 更新出库单工单白名单 | warehouseOntry |
| 扫码出库 | POST | `/api/v1/warehouse_entry/scan_on` | 托盘扫码出库操作 | warehouseOntry |
| 同步K3出库 | POST | `/api/v1/k3/sync_warehouse_ontry` | MES出库单同步至金蝶云 | warehouseOntry |
| 单品出库 | POST | `/api/v1/warehouse_entry/submit_product` | 单一产品条码出库提交 | warehouseOntry |
| 删除出库单 | POST | `/api/v1/warehouse_entry/delete_entry` | 删除出库单并恢复状态 | warehouseOntry |
| 清理重复托盘 | POST | `/api/v1/warehouse_entry/clean_duplicate_pallets` | 清理出库单重复托盘项 | warehouseOntry |
| 批量清理重复 | POST | `/api/v1/warehouse_entry/batch_clean_duplicates` | 批量清理所有重复项 | warehouseOntry |
| 修复数量计算 | POST | `/api/v1/warehouse_entry/fix_quantities` | 修复出库单数量计算错误 | warehouseOntry |

---

## 数据表映射关系

### 系统管理表
- **user_login** - 用户登录信息表
- **menu** - 系统菜单表
- **role** - 角色权限表
- **dictData** - 字典数据表
- **dictType** - 字典类型表
- **apiLog** - API调用日志表
- **fileResource** - 文件资源表

### MES核心业务表
- **craft** - 工艺表
- **barcode** - 条码表
- **processStep** - 工序步骤表
- **scanRecord** - 扫码记录表
- **processMaterials** - 工序物料表
- **materialProcessFlow** - 物料工艺流程表
- **SamplingInspectionFlow** - 抽检流程表
- **udiSamplingInspectionFlow** - UDI抽检流程表

### 生产管理表
- **productionPlanWorkOrder** - 生产计划工单表
- **productionLine** - 生产线表
- **equipmentInformation** - 设备信息表
- **machine** - 机器设备表
- **printTemplate** - 打印模板表

### 托盘和条码管理表
- **materialPalletizing** - 物料托盘化表
- **materialPalletizingUnbindLog** - 托盘解绑日志表
- **barcodeRule** - 条码规则表
- **barcodeSegmentRule** - 条码段规则表
- **productBarcodeRule** - 产品条码规则表
- **materialBarcodeBatch** - 物料条码批次表
- **barcodeSegmentRuleMaterial** - 条码段规则物料表
- **preProductionBarcode** - 预生产条码表
- **packBarcode** - 装箱条码表

### K3集成表
- **k3_BD_MATERIAL** - K3物料基础数据表
- **k3_PRD_MO** - K3生产订单表
- **k3_SAL_SaleOrder** - K3销售订单表
- **k3_BD_STOCK** - K3库存表
- **k3_PUR_PurchaseOrder** - K3采购订单表
- **k3_PRD_PickMtrl** - K3生产领料表
- **k3_SAL_DeliveryNotice** - K3销售发货通知表
- **k3_PRD_InStock** - K3生产入库表
- **k3_PUR_RequisitionBill** - K3采购申请表
- **K3_SAL_OutStock** - K3销售出库表

### K3扩展表
- **k3_SAL_SaleOrderExt** - K3销售订单扩展表
- **k3_PRD_PickMtrlExt** - K3生产领料扩展表
- **k3_PUR_RequisitionBillExt** - K3采购申请扩展表
- **k3_SAL_OutStockExt** - K3销售出库扩展表
- **k3_SAL_DeliveryNoticeExt** - K3发货通知扩展表
- **k3_SAL_SaleOrder_CustInfo** - K3销售订单客户信息表

### 检测和维修表
- **InspectionLastData** - 最新检测数据表
- **InspectionData** - 检测数据表
- **unbindRecord** - 解绑记录表
- **sale_order_barcode_mapping** - 销售订单条码映射表
- **productRepair** - 产品维修表

### 仓库管理表
- **warehouseEntry** - 仓库入库表
- **warehouseOntry** - 仓库出库表

### UDI管理表
- **productDiNum** - 产品DI编号表
- **productEanNum** - 产品EAN编号表

### 工单管理表
- **workOrderQuantityLog** - 工单数量变更日志表

---

## 接口使用说明

### 1. 认证方式
- 大部分接口需要JWT token认证
- 通过 `/api/v1/user/login` 获取token
- 在请求头中添加：`Authorization: Bearer {token}`

### 2. 响应格式
所有接口统一返回格式：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "success": true
}
```

### 3. 错误处理
- `code: 200` - 成功
- `code: 400` - 请求参数错误
- `code: 404` - 资源不存在
- `code: 500` - 服务器内部错误

### 4. 特殊功能
- **队列化处理**: 托盘条码处理支持队列化，避免并发冲突
- **原子操作**: 装箱条码支持原子性创建和锁定
- **K3集成**: 支持与金蝶云系统的数据同步
- **业务规则**: 出库管理包含复杂的添可订单业务限制
- **数据修复**: 提供多种数据修复和清理功能

---

*文档生成时间: 2025年09月16日
*版本: v1.0*
