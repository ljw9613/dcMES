const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 序列号子表 schema
const serialSubSchema = new Schema({
  FDetailID: Number,
  FSerialNo: String,
  FSerialId: String,
  FSerialNote: String,
  FSN: String,
  FIMEI1: String,
  FIMEI2: String,
  FMEID: String,
  FPushReturnNotice: Boolean,
});

// 税务明细 schema
const taxDetailSchema = new Schema({
  FDetailID: Number,
  FTaxRateId: {
    Id: Number,
    Number: String,
    Name: String,
  },
  FTaxRate: Number,
  FTaxAmount: Number,
  FCostPercent: Number,
  FCostAmount: Number,
  FVAT: Boolean,
  FSellerWithholding: Boolean,
  FBuyerWithholding: Boolean,
});

// 物流跟踪明细 schema
const outStockTraceDetailSchema = new Schema({
  FDetailID: Number,
  FTraceTime: String,
  FTraceDetail: String,
});

// 物流跟踪 schema
const outStockTraceSchema = new Schema({
  FEntryID: Number,
  FLogComId: {
    FCODE: String,
    Name: String,
  },
  FCarryBillNo: { type: String, required: true },
  FPhoneNumber: String,
  FFrom: String,
  FTo: String,
  FDelTime: Date,
  FTraceStatus: String,
  FReceiptTime: Date,
  FOutStockTraceDetail: [outStockTraceDetailSchema],
});

// 明细表 schema
const outStockEntrySchema = new Schema({
  FENTRYID: Number,
  FSeq: Number,
  FRowType: String,

  // 客户物料信息
  FCustMatID: {
    Id: String,
    Number: String,
    Name: String,
    MaterialId: {
      Id: Number,
      Number: String,
      Name: String,
    },
  },

  // 物料信息
  FMaterialID: {
    Id: Number,
    Number: { type: String },
    Name: String,
    Specification: String,
    UseOrgId: {
      Id: Number,
      Number: String,
      Name: String,
    },
    MaterialGroup: {
      Id: Number,
      Number: String,
      Name: String,
    },
    MaterialBase: [
      {
        Id: Number,
        ErpClsID: String,
        IsInventory: Boolean,
        IsSale: Boolean,
        BaseUnitId: {
          Id: Number,
          Number: String,
          Name: String,
        },
      },
    ],
  },

  // 数量相关
  FMustQty: Number,
  FRealQty: Number,
  FInventoryQty: Number,
  FBaseUnitQty: Number,
  FAuxUnitQty: Number,
  FActQty: Number,
  FSALUNITQTY: Number,
  FSALBASEQTY: Number,
  FPRICEBASEQTY: Number,

  // 单位信息
  FUnitID: {
    Id: Number,
    Number: { type: String, required: true },
    Name: String,
    Precision: Number,
    RoundType: String,
  },
  FSalUnitID: {
    Id: Number,
    Number: String,
    Name: String,
  },

  // 仓储信息
  FStockID: {
    Id: Number,
    Number: String,
    Name: String,
    IsOpenLocation: Boolean,
    StockProperty: String,
  },
  FStockLocID: {
    FF100001: String, // 原材料仓仓位
    FF100002: String, // 引驰外购库
    FF100003: String, // 引驰原材料库
  },
  FStockStatusID: {
    Id: Number,
    Number: String,
    Name: String,
    Type: String,
  },

  // 价格相关
  FPrice: Number,
  FTaxPrice: Number,
  FAmount: Number,
  FTaxAmount: Number,
  FAllAmount: Number,
  FTaxRate: Number,

  // 来源信息
  FSrcType: String,
  FSrcBillNo: String,
  FSoorDerno: String,

  // 其他信息
  FIsFree: Boolean,
  FLot: String,
  FProduceDate: Date,
  FExpiryDate: Date,
  FMtoNo: String,
  FEntrynote: String,
  FProjectNo: String,
  FOUTCONTROL: Boolean,

  // 自定义字段
  F_dcdj_Text: String,
  F_dcdj_Text1: String,
  F_TFQJ_ofislineid: String,
  F_TFQJ_EndbuyerPO: String,
  F_TFQJ_CRD: Date,
  F_TFQJ_ETD: Date,
  F_TFQJ_jhdd: {
    Id: String,
    Number: String,
    Value: String,
  },

  // 关联信息
  FEntity_Link: [
    {
      FLinkId: Number,
      FFlowId: String,
      FFlowLineId: Number,
      FRuleId: String,
      FSTableName: String,
      FSBillId: String,
      FSId: String,
      FBaseUnitQty: Number,
    },
  ],

  // 子表
  FSerialSubEntity: [serialSubSchema],
  FTaxDetailSubEntity: [taxDetailSchema],
});

// 主表 schema
const outStockSchema = new Schema(
  {
    // 基础信息
    FID: { type: Number, required: true, unique: true },
    FBillNo: { type: String, required: true },
    FDate: { type: Date, required: true },
    FDocumentStatus: String,
    FCancelStatus: String,

    // 组织信息
    FSaleOrgId: {
      Id: Number,
      Number: String,
      Name: String,
      ParentOrg: {
        Id: Number,
        Number: String,
        Name: String,
      },
    },
    FStockOrgId: {
      Id: Number,
      Number: { type: String, required: true },
      Name: String,
    },

    // 业务伙伴信息
    FCustomerID: {
      Id: Number,
      Number: String,
      Name: String,
      TradingCurrId: {
        Id: Number,
        Number: String,
        Name: String,
      },
    },
    FCarrierID: {
      Id: Number,
      Number: String,
      Name: String,
    },

    // 部门人员信息
    FDeliveryDeptID: {
      Id: Number,
      Number: String,
      Name: String,
    },
    FSaleDeptID: {
      Id: Number,
      Number: String,
      Name: String,
    },
    FStockerGroupID: {
      Id: Number,
      Number: String,
      Name: String,
    },
    FStockerID: {
      Id: Number,
      Number: String,
      Name: String,
    },
    FSalesGroupID: {
      Id: Number,
      Number: String,
      Name: String,
    },
    FSalesManID: {
      Id: Number,
      Number: String,
      Name: String,
    },

    // 单据类型
    FBillTypeID: {
      Id: String,
      Number: { type: String, required: true },
      Name: String,
    },

    // 其他信息
    FNote: String,
    FCarriageNO: String,

    // 操作记录
    FCreatorId: {
      Id: Number,
      Name: String,
    },
    FCreateDate: Date,
    FModifierId: {
      Id: Number,
      Name: String,
    },
    FModifyDate: Date,
    FApproverID: {
      Id: Number,
      Name: String,
    },
    FApproveDate: Date,

    // 明细信息
    FEntity: [outStockEntrySchema],

    // 物流跟踪
    FOutStockTrace: [outStockTraceSchema],

    // 自定义字段
    F_TFQJ_cgdh: String, // 采购单号
    F_TFQJ_ppspo: String, // 品牌商PO
    F_TFQJ_khpo: String, // 客户PO
    F_TFQJ_ddzt1: String, // 订单状态
    F_TFQJ_kdrq: Date, // 开单日期
    F_TFQJ_zhpoh: String, // 置换PO号
    F_TFQJ_zhpoyy: String, // 置换PO原因

    // 添加 FSALOutStockFin 定义
    FSALOutStockFin: [
      {
        FEntryID: Number,
        FSettleOrgID: {
          Id: Number,
          Number: String,
          Name: String,
        },
        FLocalCurrID: {
          Id: Number,
          Number: String,
          Name: String,
          Symbol: String,
          PriceDigits: Number,
          AmountDigits: Number,
        },
        FExchangeRate: Number,
        FBillAmount: Number,
        FBillAmount_LC: Number,
        FBillTaxAmount: Number,
        FBillAllAmount: Number,
        FIsIncludedTax: Boolean,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("K3_SAL_OutStock", outStockSchema);
