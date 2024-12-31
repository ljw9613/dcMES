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
const productionPlanWorkOrder = require("../model/project/productionPlanWorkOrder");
const productionLine = require("../model/project/productionLine");
const equipmentInformation = require("../model/project/equipmentInformation");
const machine = require("../model/project/machine");
const printTemplate = require("../model/project/printTemplate");
const materialPalletizing = require("../model/project/materialPalletizing");
const materialPalletizingUnbindLog = require("../model/project/materialPalletizingUnbindLog");
const barcodeRule = require("../model/project/barcodeRule");
const productBarcodeRule = require("../model/project/productBarcodeRule");
//wms模型
const warehouseEntry = require("../model/warehouse/warehouseEntry");
const warehouseOntry = require("../model/warehouse/warehouseOntry");

// 引入 k3 模型
const k3_BD_MATERIAL = require("../model/k3/k3_BD_MATERIAL");
const k3_PRD_MO = require("../model/k3/k3_PRD_MO");
const k3_SAL_SaleOrder = require("../model/k3/k3_SAL_SaleOrder");
const k3_BD_STOCK = require("../model/k3/K3_BD_STOCK");

//检测模块
const InspectionLastData = require("../model/project/InspectionLastData");
const InspectionData = require("../model/project/InspectionData");
const unbindRecord = require("../model/project/unbindRecord");



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
ADDROUTER(router, "production_plan_work_order", productionPlanWorkOrder);
ADDROUTER(router, "production_line", productionLine);
ADDROUTER(router, "equipmentInformation", equipmentInformation);
ADDROUTER(router, "machine", machine);
ADDROUTER(router, "printTemplate", printTemplate);
ADDROUTER(router, "material_palletizing", materialPalletizing);
ADDROUTER(router, "material_palletizing_unbind_log", materialPalletizingUnbindLog);
// 为每个 k3 模型添加路由
ADDROUTER(router, "k3_BD_MATERIAL", k3_BD_MATERIAL);
ADDROUTER(router, "k3_PRD_MO", k3_PRD_MO);
ADDROUTER(router, "k3_SAL_SaleOrder", k3_SAL_SaleOrder);
ADDROUTER(router, "k3_BD_STOCK", k3_BD_STOCK);
ADDROUTER(router, "productDiNum", productDiNum);
ADDROUTER(router, "barcodeRule", barcodeRule);
ADDROUTER(router, "productBarcodeRule", productBarcodeRule);
//检测模块
ADDROUTER(router, "InspectionLastData", InspectionLastData);
ADDROUTER(router, "InspectionData", InspectionData);
ADDROUTER(router, "unbindRecord", unbindRecord);

//wms模型
ADDROUTER(router, "warehouse_entry", warehouseEntry);
ADDROUTER(router, "warehouse_ontry", warehouseOntry);

module.exports = router;
