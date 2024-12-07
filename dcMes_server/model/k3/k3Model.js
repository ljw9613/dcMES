const mongoose = require("mongoose");

// 引入 k3 模型
const k3_BD_MATERIAL = require("./k3_BD_MATERIAL");
const k3_PRD_MO = require("./k3_PRD_MO");
const k3_SAL_SaleOrder = require("./k3_SAL_SaleOrder");

// 创建一个对象来存储所有生成的模型
const k3Models = {
  k3_BD_MATERIAL: k3_BD_MATERIAL,
  k3_PRD_MO: k3_PRD_MO,
  k3_SAL_SaleOrder: k3_SAL_SaleOrder,
};

module.exports = k3Models;
