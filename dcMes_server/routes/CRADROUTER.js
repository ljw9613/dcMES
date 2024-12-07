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

// 引入 k3 模型
const k3_BD_MATERIAL = require("../model/k3/k3_BD_MATERIAL");
const k3_PRD_MO = require("../model/k3/k3_PRD_MO");
const k3_SAL_SaleOrder = require("../model/k3/k3_SAL_SaleOrder");

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
// 为每个 k3 模型添加路由
ADDROUTER(router, "k3_BD_MATERIAL", k3_BD_MATERIAL);
ADDROUTER(router, "k3_PRD_MO", k3_PRD_MO);
ADDROUTER(router, "k3_SAL_SaleOrder", k3_SAL_SaleOrder);
ADDROUTER(router, "productDiNum", productDiNum);
module.exports = router;
