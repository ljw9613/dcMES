var mongoose = require("mongoose");

var saleOrderCustInfoSchema = new mongoose.Schema({
  // 关联销售订单信息
  FSaleOrderId: { type: String, required: true }, // 关联销售订单ID
  FBillNo: { type: String, required: true }, // 销售订单编号
  
  // 客户订单基础信息
  FCustPO: { type: String }, // 客户PO号
  FCustPOLineNo: { type: String }, // 客户PO行号
  FSapId: { type: String }, // SAP ID
  FPurchaseOrderNo: { type: String }, // 采购订单号
  
  // 客户信息
  FCustId: { type: String, required: true }, // 客户ID
  FCustCode: { type: String, required: true }, // 客户编码
  FCustName: { type: String, required: true }, // 客户名称
  
  // 基础信息
  FCreateTime: { type: Date, default: Date.now }, // 创建时间
  FModifyTime: { type: Date }, // 修改时间
  FRemark: { type: String }, // 备注

  // 客户物料名称、客户物料名称（英文）
  FCustMaterialName: { type: String }, // 客户物料名称
  FCustMaterialNameEn: { type: String }, // 客户物料名称（英文）
  
  // 状态信息
  FStatus: { type: String, default: 'ENABLE' }, // 状态：ENABLE-启用，DISABLE-禁用
}, {
  timestamps: true // 自动管理创建时间和更新时间
});

// ... existing code ...
// 修改索引定义
saleOrderCustInfoSchema.index({ FSaleOrderId: 1 }); // 移除 unique 选项
saleOrderCustInfoSchema.index({ FBillNo: 1 }); // 销售订单编号索引
saleOrderCustInfoSchema.index({ FCustPO: 1 }); // 客户PO号索引

module.exports = mongoose.model("k3_SAL_SaleOrder_CustInfo", saleOrderCustInfoSchema); 