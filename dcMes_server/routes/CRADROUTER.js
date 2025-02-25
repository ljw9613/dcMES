/*
 * @name: **列表
 * @content:
 * @Author: joyce
 * @Date: 2020-05-20 11:11:55
 */

const express = require(`express`);
const router = express.Router();

const user_login = require("../model/system/user_login");
const menu = require("../model/system/menu");
const role = require("../model/system/role");
const dictData = require("../model/system/dictData");
const dictType = require("../model/system/dictType");

//mes 模型
const craft = require("../model/project/craft");
const barcode = require("../model/project/barcode");
const processStep = require("../model/project/processStep");
const scanRecord = require("../model/project/scanRecord");
const processMaterials = require("../model/project/processMaterials");
const materialProcessFlow = require("../model/project/materialProcessFlow");
const SamplingInspectionFlow = require("../model/project/SamplingInspectionFlow");

const productionPlanWorkOrder = require("../model/project/productionPlanWorkOrder");
const productionLine = require("../model/project/productionLine");
const equipmentInformation = require("../model/project/equipmentInformation");
const machine = require("../model/project/machine");
const printTemplate = require("../model/project/printTemplate");
const materialPalletizing = require("../model/project/materialPalletizing");
const materialPalletizingUnbindLog = require("../model/project/materialPalletizingUnbindLog");
const barcodeRule = require("../model/project/barcodeRule");
const barcodeSegmentRule = require("../model/project/barcodeSegmentRule");
const productBarcodeRule = require("../model/project/productBarcodeRule");
const materialBarcodeBatch = require("../model/project/materialBarcodeBatch");
const barcodeSegmentRuleMaterial = require("../model/project/barcodeSegmentRuleMaterial");
const preProductionBarcode = require("../model/project/preProductionBarcode");
const udiSamplingInspectionFlow = require("../model/project/udiSamplingInspectionFlow");


//wms模型
const warehouseEntry = require("../model/warehouse/warehouseEntry");
const warehouseOntry = require("../model/warehouse/warehouseOntry");

// 引入 k3 模型
const k3_BD_MATERIAL = require("../model/k3/k3_BD_MATERIAL");
const k3_PRD_MO = require("../model/k3/k3_PRD_MO");
const k3_SAL_SaleOrder = require("../model/k3/k3_SAL_SaleOrder");
const k3_BD_STOCK = require("../model/k3/k3_BD_STOCK");
const k3_PUR_PurchaseOrder = require("../model/k3/k3_PUR_PurchaseOrder");
const k3_PRD_PickMtrl = require("../model/k3/K3_PRD_PickMtrl");
const k3_SAL_DeliveryNotice = require("../model/k3/K3_SAL_DeliveryNotice");
const k3_PRD_InStock = require("../model/k3/K3_PRD_InStock");
const k3_PUR_RequisitionBill = require("../model/k3/K3_PUR_RequisitionBill");
const K3_SAL_OutStock = require("../model/k3/K3_SAL_OutStock");


//k3 拓展模型
const k3_SAL_SaleOrderExt = require("../model/k3Ext/k3_SAL_SaleOrderExt");
const k3_PRD_PickMtrlExt = require("../model/k3Ext/k3_PRD_PickMtrlExt");
const k3_PUR_RequisitionBillExt = require("../model/k3Ext/K3_PUR_RequisitionBillExt");
const k3_SAL_OutStockExt = require("../model/k3Ext/k3_SAL_OutStockExt");
const k3_SAL_DeliveryNoticeExt = require("../model/k3Ext/k3_SAL_DeliveryNoticeExt");
const k3_SAL_SaleOrder_CustInfo = require("../model/k3Ext/k3_SAL_SaleOrder_CustInfo");

//检测模块
const InspectionLastData = require("../model/project/InspectionLastData");
const InspectionData = require("../model/project/InspectionData");
const unbindRecord = require("../model/project/unbindRecord");
const sale_order_barcode_mapping = require("../model/project/saleOrderBarcodeMapping");

//产品维修模块
const productRepair = require("../model/project/productRepair");

// 引入 udi 模型
const productDiNum = require("../model/project/ProductDiNum");

//封装
const ADDROUTER = require("../libs/request");
//三个参数 挂载路由 ， 表名 ， 表Model

ADDROUTER(router, "user_login", user_login);
ADDROUTER(router, "menu", menu);
ADDROUTER(router, "role", role);
ADDROUTER(router, "dictType", dictType);
ADDROUTER(router, "dictData", dictData);
ADDROUTER(router, "craft", craft);
ADDROUTER(router, "barcode", barcode);
ADDROUTER(router, "processStep", processStep);
ADDROUTER(router, "scanRecord", scanRecord);
ADDROUTER(router, "processMaterials", processMaterials);
ADDROUTER(router, "material_process_flow", materialProcessFlow);
ADDROUTER(router, "sampling_nspection_flow", SamplingInspectionFlow);
ADDROUTER(router, "udi_sampling_inspection_flow", udiSamplingInspectionFlow);
ADDROUTER(router, "production_plan_work_order", productionPlanWorkOrder);
ADDROUTER(router, "production_line", productionLine);
ADDROUTER(router, "equipmentInformation", equipmentInformation);
ADDROUTER(router, "machine", machine);
ADDROUTER(router, "printTemplate", printTemplate);
ADDROUTER(router, "material_palletizing", materialPalletizing);
ADDROUTER(
  router,
  "material_palletizing_unbind_log",
  materialPalletizingUnbindLog
);
// 为每个 k3 模型添加路由
ADDROUTER(router, "k3_BD_MATERIAL", k3_BD_MATERIAL);
ADDROUTER(router, "k3_PRD_MO", k3_PRD_MO);
ADDROUTER(router, "k3_SAL_SaleOrder", k3_SAL_SaleOrder);
ADDROUTER(router, "k3_BD_STOCK", k3_BD_STOCK);
ADDROUTER(router, "k3_PUR_PurchaseOrder", k3_PUR_PurchaseOrder);
ADDROUTER(router, "k3_PRD_PickMtrl", k3_PRD_PickMtrl);
ADDROUTER(router, "k3_SAL_DeliveryNotice", k3_SAL_DeliveryNotice);
ADDROUTER(router, "k3_PRD_InStock", k3_PRD_InStock);
ADDROUTER(router, "k3_PUR_RequisitionBill", k3_PUR_RequisitionBill);
ADDROUTER(router, "k3_SAL_OutStock", K3_SAL_OutStock);
ADDROUTER(router, "materialBarcodeBatch", materialBarcodeBatch);
ADDROUTER(router, "barcodeSegmentRuleMaterial", barcodeSegmentRuleMaterial);
ADDROUTER(router, "preProductionBarcode", preProductionBarcode);



ADDROUTER(router, "productDiNum", productDiNum);
ADDROUTER(router, "barcodeRule", barcodeRule);
ADDROUTER(router, "barcodeSegmentRule", barcodeSegmentRule);
ADDROUTER(router, "productBarcodeRule", productBarcodeRule);

//k3 拓展模型
ADDROUTER(router, "k3_SAL_SaleOrderExt", k3_SAL_SaleOrderExt);
ADDROUTER(router, "k3_PRD_PickMtrlExt", k3_PRD_PickMtrlExt);
ADDROUTER(router, "k3_PUR_RequisitionBillExt", k3_PUR_RequisitionBillExt);
ADDROUTER(router, "k3_SAL_OutStockExt", k3_SAL_OutStockExt);
ADDROUTER(router, "k3_SAL_DeliveryNoticeExt", k3_SAL_DeliveryNoticeExt);
ADDROUTER(router, "k3_SAL_SaleOrder_CustInfo", k3_SAL_SaleOrder_CustInfo);

//检测模块
ADDROUTER(router, "InspectionLastData", InspectionLastData);
ADDROUTER(router, "InspectionData", InspectionData);
ADDROUTER(router, "unbindRecord", unbindRecord);
ADDROUTER(router, "sale_order_barcode_mapping", sale_order_barcode_mapping);

//wms模型
ADDROUTER(router, "warehouse_entry", warehouseEntry);
ADDROUTER(router, "warehouse_ontry", warehouseOntry);

//产品维修模块
ADDROUTER(router, "product_repair", productRepair);

module.exports = router;
