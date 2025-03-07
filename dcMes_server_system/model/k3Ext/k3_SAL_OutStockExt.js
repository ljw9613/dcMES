var mongoose = require("mongoose");

var pickMtrlExtSchema = new mongoose.Schema({
  // 关联主表ID
  FOutStockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "K3_SAL_OutStock",
    required: true,
  },
  FBillNo: { type: String }, // 领料单号

  productionOrderId: { type: mongoose.Schema.ObjectId, ref: "k3_PRD_MO" }, // 关联生产订单
  productionOrderNo: { type: String }, // 生产单号

  // 新增字段
  FMaterialId: { type: String }, // 物料ID
  FMaterialName: { type: String }, // 物料名称
  FPlanFinishDate: { type: String }, // 计划完成日期
  FPlanStartDate: { type: String }, // 计划开始日期
  FPrdOrgId_FName: { type: String }, // 生产组织名称
  FQty: { type: String }, // 数量
  FRequisitionBillId: { type: String }, // 申请单ID
  FSpecification: { type: String }, // 规格
  FUnitId_FName: { type: String }, // 单位名称
  FWorkShopID_FName: { type: String }, // 车间名称

  // 物流相关字段
  FCustomerAddress: { type: String }, // 客户地址
  FContactPerson: { type: String }, // 联系人
  FContactPhone: { type: String }, // 联系电话
  FDeliveryDate: { type: Date }, // 发货时间
  FLogisticsMethod: { type: String }, // 物流方式

  // 系统字段
  FCreateTime: { type: Date, default: Date.now }, // 创建时间
  FUpdateTime: { type: Date, default: Date.now }, // 更新时间
});

// 更新时间中间件
pickMtrlExtSchema.pre("save", function (next) {
  this.FUpdateTime = Date.now();
  next();
});

module.exports = mongoose.model("k3_SAL_OutStockExt", pickMtrlExtSchema);
