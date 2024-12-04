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

// 引入 k3 模型
const k3Models = require("../model/k3/k3Model");
const craft = require("../model/project/craft");
const barcode = require("../model/project/barcode");
const processStep = require("../model/project/processStep");
const scanRecord = require("../model/project/scanRecord");
const processMaterials = require("../model/project/processMaterials");

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

// 为每个 k3 模型添加路由
Object.entries(k3Models).forEach(([modelName, model]) => {
  ADDROUTER(router, modelName, model);
});

module.exports = router;
