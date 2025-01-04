var mongoose = require("mongoose");

var salesOrderSchema = new mongoose.Schema({
  FID: { type: Number, required: true, unique: true }, // 实体主键
  FBillNo: { type: String }, // 单据编号
  FDocumentStatus: { type: String }, // 单据状态
  FSaleOrgId: { type: String, required: true }, // 销售组织
  FSaleOrgId_FNumber: { type: String, required: true }, // 销售组织编码
  FSaleOrgId_FName: { type: String, required: true }, // 销售组织名称
  FDate: { type: Date, required: true }, // 业务日期

  // 客户相关
  FCustId: { type: String, required: true }, // 客户
  FCustId_FNumber: { type: String, required: true }, // 客户编码
  FCustId_FName: { type: String, required: true }, // 客户名称
  FReceiveId: { type: String }, // 收货方（作废）
  FReceiveId_FNumber: { type: String }, // 收货方编码
  FReceiveId_FName: { type: String }, // 收货方名称
  FSettleId: { type: String }, // 结算方
  FSettleId_FNumber: { type: String }, // 结算方编码
  FSettleId_FName: { type: String }, // 结算方名称
  FSettleAddress: { type: String }, // 结算方地址
  FChargeId: { type: String }, // 付款方（作废）
  FChargeId_FNumber: { type: String }, // 付款方编码
  FChargeId_FName: { type: String }, // 付款方名称
  // 客户PO：F_TFQJ_khpo
  F_TFQJ_khpo: { type: String }, // 客户PO
  F_TFQJ_Text1: { type: String }, // 客户PO行号

  F_TFQJ_cgdh: { type: String }, // 采购订单号

  // 销售部门信息
  FSaleDeptId: { type: String }, // 销售部门
  FSaleDeptId_FNumber: { type: String }, // 销售部门编码
  FSaleDeptId_FName: { type: String }, // 销售部门名称
  FSaleGroupId: { type: String }, // 销售组
  FSaleGroupId_FNumber: { type: String }, // 销售组编码
  FSaleGroupId_FName: { type: String }, // 销售组名称
  FSalerId: { type: String }, // 销售员
  FSalerId_FNumber: { type: String }, // 销售员编码
  FSalerId_FName: { type: String }, // 销售员名称

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

  //物料信息
  FMaterialId: { type: String }, // 物料ID  (必填项)
  FMaterialName: { type: String }, // 物料名称
  FMaterialModel: { type: String }, // 规格型号
  FMaterialType: { type: String }, // 存货类别
  FUnitID: { type: String }, // 单位ID
  FUnitID_FNumber: { type: String }, // 单位编码
  FUnitID_FName: { type: String }, // 单位名称
  //销售数量
  FQty: { type: Number }, // 销售数量

  F_TFQJ_khpo: { type: String }, // 客户PO
  F_TFQJ_Text1: { type: String }, // 客户PO行号
  F_WAZL_Text: { type: String }, // 客户PO行号

  // 关联组织
  FCorrespondOrgId: { type: String }, // 关联组织
  FCorrespondOrgId_FNumber: { type: String }, // 关联组织编码
  FCorrespondOrgId_FName: { type: String }, // 关联组织名称
  // 单据类型
  FBillTypeID: { type: String, required: true }, // 单据类型
  FBillTypeID_FNumber: { type: String }, // 单据类型编码
  FBillTypeID_FName: { type: String }, // 单据类型名称
  // 仓库
  FStockId: { type: String }, // 仓库
  FStockId_FNumber: { type: String }, // 仓库编码
  FStockId_FName: { type: String }, // 仓库名称

  //交货明细
  FPlanUnitId: { type: String }, // 销售单位
  FPlanQty: { type: Number }, // 数量
  FDeliCommitQty: { type: Number }, // 已出库数量
  FDeliRemainQty: { type: Number }, // 剩余未出数量
  FDetailLocId: { type: String }, // 交货地点
  FDetailLocAddress: { type: String }, // 交货地址
  FPlanDate: { type: Date }, // 要货日期
  FPlanDeliveryDate: { type: Date }, // 计划发货日期
});

module.exports = mongoose.model("k3_SAL_SaleOrder", salesOrderSchema);
