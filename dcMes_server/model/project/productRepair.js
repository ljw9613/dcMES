const mongoose = require("mongoose");

const productRepairSchema = new mongoose.Schema({
  // 产品基本信息
  barcode: { type: String, required: true }, // 产品条码
  newBarcode: { type: String }, // 更换后的产品条码
  oldBarcode:{ type: String }, // 更换前的产品条码
  //产品名称
  materialId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" }, // 关联物料表
  materialNumber: { type: String }, // 物料编码
  materialName: { type: String }, // 物料名称
  materialSpec: { type: String }, // 产品型号
  batchNumber: { type: String }, // 生产批号

  // 维修信息
  repairPerson: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 维修人
  repairTime: { type: Date, default: Date.now }, // 维修时间
  defectDescription: { type: String, required: true }, // 不良现象
  causeAnalysis: { type: String }, // 分析原因
  repairDescription: { type: String }, // 维修描述
  solution: { type: String }, // 处理方案
  repairResult: {
    type: String,
    enum: ["QUALIFIED", "UNQUALIFIED"], // 合格/不合格
  }, // 维修结果
  adverseEffect: { type: String }, //不利影响评价

  // 审核信息
  reviewer: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 审核人
  reviewTime: { type: Date }, // 审核时间

  //工单信息
  productionPlanWorkOrderId: {
    type: mongoose.Schema.ObjectId,
    ref: "production_plan_work_order",
    description: "工单ID",
  },
  workOrderNo: { type: String }, // 任务工单号
  saleOrderId: { type: mongoose.Schema.ObjectId, ref: "k3_SAL_SaleOrder" }, // 关联销售订单
  saleOrderNo: { type: String }, // 销售单号
  productionOrderId: { type: mongoose.Schema.ObjectId, ref: "k3_PRD_MO" }, // 关联生产订单
  productionOrderNo: { type: String }, // 生产单号

  // 业务信息
  businessType: { type: String }, // 业务类型
  status: {
    type: String,
    enum: ["PENDING_REVIEW", "REVIEWED", "VOIDED"], // 待审核、已审核、已作废
    default: "PENDING_REVIEW",
  }, // 状态

  //核验
  verify: {
    type: Boolean,
    default: false,
  }, // 核验
  verifyTime: { type: Date }, // 核验时间
  
  // 基础字段
  remark: { type: String }, // 备注
  createBy: { type: mongoose.Schema.ObjectId, ref: "user_login" },
  updateBy: { type: mongoose.Schema.ObjectId, ref: "user_login" },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

// 添加索引
productRepairSchema.index({ barcode: 1 });
productRepairSchema.index({ batchNumber: 1 });
productRepairSchema.index({ status: 1 });
productRepairSchema.index({ createAt: -1 });

module.exports = mongoose.model("product_repair", productRepairSchema);
