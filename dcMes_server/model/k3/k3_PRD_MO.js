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
    FQty: { type: Number, required: true }, // 数量

    // 新增必填字段
    FBillType: { type: String, required: true }, // 单据类型
    FPrdOrgId: { type: String, required: true }, // 生产组织
    FOwnerTypeId: { type: String, required: true }, // 货主类型
    FPPBOMType: { type: String, required: true }, // 用料清单展开

    // 新增人员相关字段
    FModifierId: { type: String }, // 修改人
    FCreatorId: { type: String }, // 创建人
    FCanceler: { type: String }, // 作废人
    FPlannerID: { type: String }, // 计划员

    // 新增日期相关字段
    FCreateDate: { type: Date }, // 创建日期
    FModifyDate: { type: Date }, // 修改日期
    FCancelDate: { type: Date }, // 作废日期

    // 新增状态相关字段
    FCancelStatus: { type: String }, // 作废状态
    FDescription: { type: String }, // 备注
    FTrustteed: { type: String }, // 受托
    FWorkShopID0: { type: String }, // 生产车间
    FWorkGroupId: { type: String }, // 计划组
    
    // 新增业务相关字段
    FBusinessType: { type: String }, // 销售业务类型
    FIsRework: { type: Boolean }, // 是否返工
    FIsEntrust: { type: Boolean }, // 组织受托加工
    FEnTrustOrgId: { type: String }, // 委托组织
    FIssueMtrl: { type: String }, // 生产发料
    FIsQCMO: { type: Boolean }, // 期初生产订单
    FOwnerId: { type: String }, // 货主
    
    // 新增自定义字段
    F_TFQJ_rjh: { type: String }, // 日计划
    F_TFQJ_sfwwzzz: { type: Boolean }, // 是否委外转自制
});

module.exports = mongoose.model("k3_PRD_MO", productionOrderSchema);