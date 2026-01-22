const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 明细表 schema
const requisitionEntrySchema = new Schema({
  FEntryID: Number,
  
  // 物料信息
  FMaterialId: {
    FNumber: String,
    Name: String,
    Specification: String
  },
  FMaterialDesc: String,
  FAuxpropId: Schema.Types.Mixed,
  
  // 数量信息
  FReqQty: Number,          // 申请数量
  FApproveQty: Number,      // 批准数量
  FBaseReqQty: Number,      // 申请数量(基本单位)
  FPriceUnitQty: Number,    // 计价数量
  FREQSTOCKQTY: Number,     // 库存单位数量
  
  // 单位信息
  FUnitId: {               // 申请单位
    FNumber: String,
    Name: String
  },
  FPriceUnitId: {         // 计价单位
    FNumber: String,
    Name: String
  },
  FREQSTOCKUNITID: {      // 库存单位
    FNumber: String,
    Name: String
  },
  
  // 组织信息
  FRequireOrgId: {        // 需求组织
    FNumber: String,
    Name: String
  },
  FPurchaseOrgId: {       // 采购组织
    FNumber: String,
    Name: String
  },
  FReceiveOrgId: {        // 收料组织
    FNumber: String,
    Name: String
  },
  
  // 部门信息
  FPurchaseDeptId: {      // 采购部门
    FNumber: String,
    Name: String
  },
  FReceiveDeptId: {       // 收料部门
    FNUMBER: String,
    Name: String
  },
  FRequireDeptId: {       // 需求部门
    FNUMBER: String,
    Name: String
  },
  
  // 供应商信息
  FSuggestSupplierId: {   // 建议供应商
    FNumber: String,
    Name: String
  },
  FSupplierId: {          // 供应商
    FNumber: String,
    Name: String
  },
  
  // 价格信息
  FEvaluatePrice: Number, // 单价
  FTAXPRICE: Number,      // 含税单价
  FTAXRATE: Number,       // 税率
  
  // 其他信息
  FLeadTime: Number,      // 提前期
  FReceiveAddress: String,// 交货地址
  FEntryNote: String,     // 备注
  FIsVmiBusiness: Boolean,// VMI业务
  
  // 自定义字段
  F_TFQJ_XSDD: String,    // 手工销售订单号
  F_TFQJ_cpsl: Number,    // 产品数量
  F_TFQJ_lowPrice: Number,// 价目表最低价格
  F_TFQJ_CheckBox: Boolean// 是否赠品
});

// 主表 schema
const requisitionSchema = new Schema(
  {
    // 基础信息
    FID: { type: Number, required: true, unique: true },
    FBillNo: { type: String, required: true },
    FDocumentStatus: String,
    
    // 单据信息
    FBillTypeID: {        // 单据类型
      FNUMBER: String,
      Name: String
    },
    FApplicationDate: Date,// 申请日期
    FRequestType: String,  // 申请类型
    
    // 组织信息
    FApplicationOrgId: {  // 申请组织
      FNumber: String,
      Name: String
    },
    FApplicationDeptId: { // 申请部门
      FNumber: String,
      Name: String
    },
    
    // 人员信息
    FApplicantId: Schema.Types.Mixed, // 申请人
    FCreatorId: {         // 创建人
      Id: Number,
      Name: String
    },
    FModifierId: {        // 修改人
      Id: Number,
      Name: String
    },
    
    // 其他基础信息
    FCurrencyId: {        // 币别
      FNumber: String,
      Name: String
    },
    FNote: String,        // 备注
    FSrcType: String,     // 来源类型
    FISPRICEEXCLUDETAX: Boolean, // 价外税
    
    // 日期信息
    FCreateDate: Date,    // 创建日期
    FModifyDate: Date,    // 修改日期
    FApproveDate: Date,   // 审核日期
    
    // 明细信息
    FEntity: [requisitionEntrySchema],
    
    // 自定义字段
    F_TFQJ_zkjg1: Boolean, // 折扣价格
    
    // 同步时间字段
    lastSyncTime: { type: Date, default: Date.now },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("K3_PUR_RequisitionBill", requisitionSchema); 