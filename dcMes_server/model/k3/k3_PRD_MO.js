var mongoose = require("mongoose");

var productionOrderSchema = new mongoose.Schema({
    FID: { type: Number, required: true, unique: true }, // 实体主键
    FBillNo: { type: String }, // 单据编号
    FDocumentStatus: { type: String }, // 单据状态
    FSaleOrderId: { type: String }, // 销售订单ID
    FSaleOrderEntryId: { type: String }, // 销售订单分录内码
    FSaleOrderNo: { type: String }, // 销售订单号
    
    // 审核信息
    FApproverId: { type: String }, // 审核人
    FApproveDate: { type: Date }, // 审核日期
    
    // 日期信息
    FDate: { type: Date, required: true }, // 单据日期
    FPlanStartDate: { type: Date, required: true }, // 计划开工时间
    FPlanFinishDate: { type: Date, required: true }, // 计划完工时间
    
    // 生产信息
    FWorkShopID_FName: { type: String }, // 生产车间
    FMaterialId: { type: String, required: true }, // 物料编码
    FMaterialName: { type: String }, // 物料名称
    FSpecification: { type: String }, // 规格型号
    FProductType: { type: String, required: true }, // 产品类型
    
    // 数量和单位
    FUnitId: { type: String, required: true }, // 单位
    FQty: { type: Number, required: true } // 数量
});

module.exports = mongoose.model("k3_PRD_MO", productionOrderSchema);