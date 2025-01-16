const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 财务信息 schema
const financeSchema = new Schema({
  FEntryId: Number,
  FSettleModeId: { type: String },  // 结算方式
  FPayConditionId: { type: String }, // 付款条件
  FSettleCurrId: { type: String, required: true }, // 结算币别
  FExchangeTypeId: { type: String }, // 汇率类型
  FExchangeRate: Number, // 汇率
  FPriceListId: { type: String }, // 价目表
  FDiscountListId: { type: String }, // 折扣表
  FPriceTimePoint: { type: String, required: true }, // 定价时点
  FFOCUSSETTLEORGID: { type: String }, // 集中结算组织
  FIsIncludedTax: { type: Boolean, default: false }, // 含税
  FISPRICEEXCLUDETAX: { type: Boolean, default: false }, // 价外税
  FLocalCurrId: { type: String }, // 本位币
  FPayAdvanceBillId: { type: Schema.Types.Mixed }, // 预付单号
  FPAYADVANCEAMOUNT: Number, // 单次预付额度
  FSupToOderExchangeBusRate: Number, // 单次预付额度汇率
  FSEPSETTLE: { type: Boolean, default: false }, // 集中结算
  FDepositRatio: Number, // 保证金比例
  FAllDisCount: Number // 整单折扣额
});

// 订单条款 schema
const clauseSchema = new Schema({
  FEntryID: Number,
  FClauseId: { type: String }, // 条款编码
  FClauseDesc: String // 描述
});

// 交货计划 schema
const deliveryPlanSchema = new Schema({
  FDetailId: Number,
  FDeliveryDate_Plan: Date, // 交货日期
  FPlanQty: Number, // 数量
  FELocation: String, // 交货地点
  FELocationAddress: String, // 交货地址
  FSUPPLIERDELIVERYDATE: Date, // 供应商发货日期
  FPREARRIVALDATE: Date, // 预计到货日期
  FTRLT: Number, // 运输提前期
  FConfirmDeliQty: Number, // 确认交货数量
  FConfirmDeliDate: Date, // 确认交货日期
  FConfirmInfo: String, // 确认意见
  FELocationId: { type: String } // 交货地点ID
});

// 税务明细 schema
const taxDetailSchema = new Schema({
  FDetailID: Number,
  FTaxRateId: { type: String }, // 税率名称
  FTaxRate: Number // 税率%
});

// 订单明细 schema
const orderEntrySchema = new Schema({
  FEntryID: Number,
  FMaterialId: { type: String, required: true }, // 物料编码
  FUnitId: { type: String, required: true }, // 采购单位
  FQty: Number, // 采购数量
  FPriceUnitId: { type: String, required: true }, // 计价单位
  FPrice: Number, // 单价
  FTaxPrice: Number, // 含税单价
  FEntryDiscountRate: Number, // 折扣率%
  FTaxCombination: { type: String }, // 税组合
  FEntryTaxRate: Number, // 税率%
  FRequireOrgId: { type: String }, // 需求组织
  FRequireDeptId: { type: String }, // 需求部门
  FReceiveOrgId: { type: String }, // 收料组织
  FEntrySettleOrgId: { type: String, required: true }, // 结算组织
  FGiveAway: { type: Boolean, default: false }, // 是否赠品
  FEntryNote: String, // 备注
  FDeliveryDate: Date, // 交货日期
  FEntryDeliveryPlan: [deliveryPlanSchema], // 交货计划
  FTaxDetailSubEntity: [taxDetailSchema] // 税务明细
});

// 主表 schema
const purchaseOrderSchema = new Schema(
  {
    FID: Number,
    FFormId: { type: String, required: true },
    FBillTypeID: { type: String, required: true },
    FBillNo: { type: String, required: true },
    FDate: { type: Date, required: true },
    FDocumentStatus: { type: String, default: 'A' },
    FCancelStatus: { type: String, default: 'A' },
    FCloseStatus: { type: String, default: 'A' },
    FBusinessType: { type: String, default: 'CG' },
    FVersionNo: { type: String, default: '000' },

    // 采购组织信息
    FPurchaseOrgId: {
      Id: Number,
      Number: String,
      Name: String
    },

    // 供应商信息
    FSupplierId: {
      Id: Number,
      Number: String,
      Name: String,
      Address: String,
      Contact: String
    },

    // 部门与人员信息
    FPurchaseDeptId: String,
    FPurchaserGroupId: String, 
    FPurchaserId: String,

    // 操作记录
    FCreatorId: String,
    FCreateDate: Date,
    FModifierId: String,
    FModifyDate: Date,
    FApproverId: String,
    FApproveDate: Date,
    FCancellerId: String,
    FCancelDate: Date,
    FCloserId: String,
    FCloseDate: Date,

    // 财务信息
    FPOOrderFinance: {
      FSettleCurrId: String,
      FBillAmount: Number,
      FBillTaxAmount: Number,
      FBillAllAmount: Number,
      FExchangeRate: Number,
      FIsIncludedTax: Boolean
    },

    // 订单明细
    FPOOrderEntry: [{
      FEntryID: Number,
      // 物料信息
      FMaterialId: {
        Id: Number,
        Number: String,
        Name: String,
        Specification: String
      },
      // 数量与单位
      FUnitId: String,
      FQty: Number,
      FPriceUnitId: String,
      // 价格相关
      FPrice: Number,
      FTaxPrice: Number,
      FAmount: Number,
      FTaxAmount: Number,
      FAllAmount: Number,
      FTaxRate: Number,
      // 收货相关
      FReceiveQty: Number,
      FStockInQty: Number,
      FRemainReceiveQty: Number,
      // 交货信息
      FDeliveryDate: Date,
      FRequireOrgId: String,
      FReceiveOrgId: String,
      // 备注
      FNote: String
    }]
  },
  {
    timestamps: true,
    strict: true
  }
);

module.exports = mongoose.model("K3_PUR_PurchaseOrder", purchaseOrderSchema); 