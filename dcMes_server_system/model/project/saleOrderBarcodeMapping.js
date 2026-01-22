const mongoose = require("mongoose");

const saleOrderBarcodeMappingSchema = new mongoose.Schema({
  // 销售订单相关信息
  saleOrderId: { type: mongoose.Schema.ObjectId, ref: "k3_SAL_SaleOrder" }, // 销售订单ID
  saleOrderNo: { type: String, required: true }, // 销售订单编号
  
  // 条码信息
  barcode: { type: String, required: true }, // 关联的主条码
  processFlowId: { type: mongoose.Schema.ObjectId, ref: "material_process_flow" }, // 关联的工艺流程记录
  
  // 产品信息
  materialId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" }, // 物料ID
  materialCode: { type: String }, // 物料编码
  materialName: { type: String }, // 物料名称
  materialSpec: { type: String }, // 规格型号
  
  // 基础字段
  remark: { type: String }, // 备注
  createBy: { type: mongoose.Schema.ObjectId, ref: "user_login" },
  updateBy: { type: String },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now }
});

// 添加索引
saleOrderBarcodeMappingSchema.index({ saleOrderNo: 1, saleOrderLineNo: 1 }); // 销售订单复合索引
saleOrderBarcodeMappingSchema.index({ barcode: 1 }); // 条码索引
saleOrderBarcodeMappingSchema.index({ status: 1 }); // 状态索引
saleOrderBarcodeMappingSchema.index({ createAt: -1 }); // 创建时间降序索引

module.exports = mongoose.model("sale_order_barcode_mapping", saleOrderBarcodeMappingSchema);