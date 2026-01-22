const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 序列号子单据体 schema
const serialSubSchema = new Schema({
  FDetailID: Number,
  FSerialNo: String,
  FSerialId: String,
  FSerialNote: String,
  FQty: Number,
  FBaseSNQty: Number,
});

// 关联关系表 schema
const entityLinkSchema = new Schema({
  FLinkId: Number,
  FEntity_Link_FFlowId: String,
  FEntity_Link_FFlowLineId: Number,
  FEntity_Link_FRuleId: String,
  FEntity_Link_FSTableId: Number,
  FEntity_Link_FSTableName: String,
  FEntity_Link_FSBillId: String,
  FEntity_Link_FSId: String,
  FEntity_Link_FBasePrdRealQtyOld: Number,
  FEntity_Link_FBasePrdRealQty: Number,
});

// 入库单明细 schema
const inStockEntrySchema = new Schema({
  FEntryID: Number,
  // 物料信息
  FMaterialId: {
    Id: Number,
    msterID: Number,
    Number: String,
    Name: [
      {
        Key: Number,
        Value: String,
      },
    ],
    MultiLanguageText: [
      {
        PkId: Number,
        LocaleId: Number,
        Name: String,
        Specification: String,
      },
    ],
    UseOrgId: {
      Id: Number,
      Number: String,
      Name: [
        {
          Key: Number,
          Value: String,
        },
      ],
    },
    Specification: [
      {
        Key: Number,
        Value: String,
      },
    ],
    OldNumber: String,
    MaterialBase: [
      {
        Id: Number,
        ErpClsID: String,
        BaseUnitId: {
          Id: Number,
          Number: String,
          Name: [
            {
              Key: Number,
              Value: String,
            },
          ],
        },
      },
    ],
  },
  FMaterialName: String,
  FSpecification: String,
  FProductType: String,

  // 入库相关
  FInStockType: { type: String },
  FUnitID: {
    Id: Number,
    msterID: Number,
    Number: String,
    Name: [
      {
        Key: Number,
        Value: String,
      },
    ],
    UnitGroupId: {
      Id: Number,
      Number: String,
      Name: [
        {
          Key: Number,
          Value: String,
        },
      ],
    },
    Precision: Number,
    RoundType: String,
    UNITCONVERTRATE: [
      {
        Id: Number,
        ConvertType: String,
        DestUnitId: {
          Id: Number,
          Number: String,
          Name: [
            {
              Key: Number,
              Value: String,
            },
          ],
        },
        CurrentUnitId: {
          Id: Number,
          Number: String,
          Name: [
            {
              Key: Number,
              Value: String,
            },
          ],
        },
        ConvertDenominator: Number,
        ConvertNumerator: Number,
      },
    ],
  },
  FBaseUnitId: { type: String },
  FMustQty: Number,
  FBaseMustQty: Number,
  FRealQty: Number,
  FBaseRealQty: Number,

  // 仓储信息
  FOwnerTypeId: { type: String },
  FOwnerId: { type: String },
  FStockId: {
    Id: Number,
    msterID: Number,
    Number: String,
    Name: String,
    IsOpenLocation: Boolean,
    StockStatusType: String,
    DefStockStatusId: {
      Id: Number,
      Number: String,
      Name: [
        {
          Key: Number,
          Value: String,
        },
      ],
    },
    LocListFormatter: String,
  },
  FStockLocId: String,
  FF100001: String, // 原材料仓仓位
  FF100002: String, // 引驰外购库
  FF100003: String, // 引驰原材料库

  // 生产信息
  FBomId: String,
  FLot: String,
  FAuxpropId: String,
  FMtoNo: String,
  FProjectNo: String,
  FWorkShopId1: String,
  FMoBillNo: { type: String },
  FMoId: String,
  FMoEntryId: String,
  FMoEntrySeq: Number,

  // 其他信息
  FMemo: String,
  FStockUnitId: String,
  FStockRealQty: Number,
  FSecUnitId: String,
  FSecRealQty: Number,
  FPrice: Number,
  FAmount: Number,

  // 源单信息
  FSrcInterId: String,
  FSrcEntryId: String,
  FSrcEntrySeq: Number,
  FSrcBillType: String,
  FSrcBillNo: String,

  // 状态信息
  FStockStatusId: {
    Id: Number,
    msterID: Number,
    Number: String,
    Name: [
      {
        Key: Number,
        Value: String,
      },
    ],
    Type: String,
  },
  FKeeperTypeId: { type: String },
  FKeeperId: { type: String },

  // 日期信息
  FProduceDate: Date,
  FExpiryDate: Date,
  FExpperiodUnitId: String,
  FExpperiod: Number,

  // 标识
  FStockFlag: Boolean,
  FBFLowId: String,
  FShiftGroupId: String,
  FSNUnitID: String,
  FSNQty: Number,
  FCheckProduct: Boolean,
  FQAIP: String,
  FCostRate: Number,
  FIsNew: Boolean,
  FIsFinished: Boolean,
  FISBACKFLUSH: Boolean,

  // 子表
  FSerialSubEntity: [serialSubSchema],
  FEntity_Link: [entityLinkSchema],
});

// 主表 schema
const inStockSchema = new Schema(
  {
    FID: Number,
    FBillNo: { type: String },
    FDocumentStatus: { type: String, default: "A" },
    FCancelStatus: { type: String, default: "A" },
    FDate: { type: Date },

    // 组织信息
    FPrdOrgId: {
      Id: Number,
      Number: String,
      Name: String,
      MultiLanguageText: [
        {
          PkId: Number,
          LocaleId: Number,
          Name: String,
        },
      ],
    },
    FStockOrgId: {
      Id: Number,
      Number: String,
      Name: String,
    },

    // 类型信息
    FBillType: {
      Id: String,
      Number: String,
      MultiLanguageText: [
        {
          PkId: String,
          LocaleId: Number,
          Name: String,
        },
      ],
      Name: [
        {
          Key: Number,
          Value: String,
        },
      ],
    },
    FWorkShopId: String,
    FStockId0: String,
    FOwnerTypeId0: String,
    FOwnerId0: { type: String },

    // 其他基础信息
    FCurrId: {
      Id: Number,
      msterID: Number,
      Number: String,
      Name: [
        {
          Key: Number,
          Value: String,
        },
      ],
      Sysmbol: String,
      PriceDigits: Number,
      AmountDigits: Number,
      IsShowCSymbol: Boolean,
      FormatOrder: String,
      RoundType: String,
    },
    FSTOCKERID: String,
    FIOSBizTypeId: {
      Id: Number,
      Number: String,
      MultiLanguageText: [
        {
          PkId: Number,
          LocaleId: Number,
          Name: String,
        },
      ],
      Name: [
        {
          Key: Number,
          Value: String,
        },
      ],
    },

    // 操作记录
    FCreatorId: String,
    FCreateDate: Date,
    FModifierId: String,
    FModifyDate: Date,
    FApproverId: String,
    FApproveDate: Date,
    FCanceler: String,
    FCancelDate: Date,

    // 标识
    FIsEntrust: Boolean,
    FEntrustInStockId: String,
    FIsIOSForFin: Boolean,
    FScanBox: String,
    FISGENFORIOS: Boolean,

    // 自定义字段
    F_VMKO_RWDH: String, // 任务单号
    F_VMKO_GHDW: String, // 购货单位
    F_TFQJ_TPH: String, // 托盘号
    F_TFQJ_ERWM: String, // 二维码
    F_TFQJ_HGH: String, // 货柜号
    F_TFQJ_CheckBox: Boolean, // 是否自动生成卓捷/越南调拨单

    // 明细
    FEntity: [inStockEntrySchema],
    
    // 同步时间字段
    lastSyncTime: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    strict: true,
  }
);

module.exports = mongoose.model("K3_PRD_InStock", inStockSchema);
