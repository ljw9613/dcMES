const mongoose = require("mongoose");

const productionPlanWorkOrderSchema = new mongoose.Schema({
  // 工单基础信息
  workOrderNo: { type: String, required: true, unique: true }, // 任务工单号
  saleOrderId: { type: mongoose.Schema.ObjectId, ref: "k3_SAL_SaleOrder" }, // 关联销售订单
  saleOrderNo: { type: String }, // 销售单号
  productionOrderId: { type: mongoose.Schema.ObjectId, ref: "k3_PRD_MO" }, // 关联生产订单
  productionOrderNo: { type: String }, // 生产单号

  custInfoId: {
    type: mongoose.Schema.ObjectId,
    ref: "k3_SAL_SaleOrder_CustInfo",
  }, // 关联客户信息
  custPO: { type: String }, // 客户PO号（客户物料编码）
  custPOLineNo: { type: String }, // 客户PO行号（69码）
  sapId: { type: String }, // sapID （DUN码）
  custMaterialName: { type: String }, // 客户物料名称
  custMaterialNameEn: { type: String }, // 客户物料名称（英文）

  // 产品信息
  materialId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" }, // 关联物料表
  materialNumber: { type: String }, // 物料编码
  materialName: { type: String }, // 物料名称
  fSpecification: { type: String, required: true }, // 产品型号
  // 金蝶云物料信息
  FMATERIALID: { type: String }, // 物料编码

  // 生产信息
  productionLineId: { type: mongoose.Schema.ObjectId, ref: "production_line" }, // 关联产线
  lineName: { type: String, required: true }, // 产线名称
  status: {
    type: String,
    enum: ["PENDING", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"],
    default: "PENDING",
  }, // 工单状态
  businessType: {
    type: String,
    enum: ["NORMAL", "REWORK", "SAMPLE", "OTHER", "SUPPLEMENT"],
    default: "NORMAL",
  }, // 业务类型

  // 生产数量信息
  planQuantity: { type: Number, required: true, default: 0 }, // 计划数量
  //计划生产数量
  planProductionQuantity: { type: Number, default: 0 },
  inputQuantity: { type: Number, default: 0 }, // 投入数量
  outputQuantity: { type: Number, default: 0 }, // 产出数量
  //报废数量
  scrapQuantity: { type: Number, default: 0 },
  scrapProductBarcodeList: [
    {
      barcode: { type: String }, // 产品条码
      status: {
        type: String,
        enum: ["PENDING", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"],
        default: "PENDING",
      }, // 报废状态
      scrapTime: { type: Date, default: Date.now }, // 报废时间
    },
  ], // 报废产品条码列表

  // 时间信息
  planStartTime: { type: Date, required: true }, // 计划开始生产时间
  planEndTime: { type: Date, required: true }, // 计划结束生产时间
  actualStartTime: { type: Date }, // 实际开始生产时间
  actualEndTime: { type: Date }, // 实际结束生产时间

  //补单信息
  originalWorkOrderNo: { type: String }, //原计划工单号
  originalWorkOrderId: {
    type: mongoose.Schema.ObjectId,
    ref: "production_plan_work_order",
  }, //原计划工单id
  supplementQuantity: { type: Number }, // 补单数量

  // 基础字段
  remark: { type: String }, // 备注
  createBy: { type: String, required: true }, // 创建人，添加required约束
  updateBy: { type: String, required: true }, // 更新人，添加required约束
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

// 添加索引
productionPlanWorkOrderSchema.index({ workOrderNo: 1 }, { unique: true });
productionPlanWorkOrderSchema.index({ saleOrderNo: 1 });
productionPlanWorkOrderSchema.index({ productionOrderNo: 1 });
productionPlanWorkOrderSchema.index({ status: 1 });
productionPlanWorkOrderSchema.index({ createAt: -1 });
productionPlanWorkOrderSchema.index({ createBy: 1 }); // 添加创建人索引
productionPlanWorkOrderSchema.index({ updateBy: 1 }); // 添加更新人索引

// 安全的模型导出，避免重复编译错误
module.exports = mongoose.models.production_plan_work_order || mongoose.model(
  "production_plan_work_order",
  productionPlanWorkOrderSchema
);
