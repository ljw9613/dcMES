var mongoose = require("mongoose");

var salesOrderSchema = new mongoose.Schema({
    FID: { type: Number }, // 实体主键
    FBillNo: { type: String }, // 单据编号
    FDocumentStatus: { type: String }, // 单据状态
    FSaleOrgId: { type: String, required: true }, // 销售组织
    FDate: { type: Date, required: true }, // 业务日期
    
    // 客户相关
    FCustId: { type: String, required: true }, // 客户
    FReceiveId: { type: String }, // 收货方（作废）
    FSettleId: { type: String }, // 结算方
    FSettleAddress: { type: String }, // 结算方地址
    FChargeId: { type: String }, // 付款方（作废）
    
    // 销售部门信息
    FSaleDeptId: { type: String }, // 销售部门
    FSaleGroupId: { type: String }, // 销售组
    FSalerId: { type: String }, // 销售员
    
    // 创建和修改信息
    FCreatorId: { type: String }, // 创建人
    FCreateDate: { type: Date }, // 创建日期
    FModifierId: { type: String }, // 最后修改人
    FModifyDate: { type: Date }, // 最后修改日期
    
    // 审核信息
    FApproverId: { type: String }, // 审核人
    FApproveDate: { type: Date }, // 审核日期
    
    // 关闭信息
    FCloseStatus: { type: String }, // 关闭状态
    FCloserId: { type: String }, // 关闭人
    FCloseDate: { type: Date }, // 关闭日期
    
    // 作废信息
    FCancelStatus: { type: String }, // 作废状态
    FCancellerId: { type: String }, // 作废人
    FCancelDate: { type: Date }, // 作废日期
    
    // 版本信息
    FVersionNo: { type: String }, // 版本号
    FChangerId: { type: String }, // 变更人
    FChangeDate: { type: Date }, // 变更日期
    FChangeReason: { type: String }, // 变更原因
    
    // 单据类型
    FBillTypeID: { type: String, required: true } // 单据类型
});

module.exports = mongoose.model("k3_SAL_SaleOrder", salesOrderSchema);