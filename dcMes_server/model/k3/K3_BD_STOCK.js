const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 仓位值集明细 schema
const flexEntryIdSchema = new Schema({
  Id: Number,
  Number: String,
  MultiLanguageText: [
    {
      PkId: Number,
      LocaleId: Number,
      Name: String,
      Description: String,
    },
  ],
  Name: [
    {
      Key: Number,
      Value: String,
    },
  ],
  Description: [
    {
      Key: Number,
      Value: String,
    },
  ],
  Forbid: Boolean,
});

const stockFlexDetailSchema = new Schema({
  Id: Number,
  Seq: Number,
  FlexEntryId_Id: Number,
  FlexEntryId: flexEntryIdSchema,
  IsRepeat: mongoose.Schema.Types.Mixed,
});

// 仓位值集 schema
const stockFlexItemSchema = new Schema({
  Id: Number,
  Seq: Number,
  FlexId_Id: Number,
  FlexId: {
    Id: Number,
    Number: String,
    MultiLanguageText: [
      {
        PkId: Number,
        LocaleId: Number,
        Name: String,
        Description: String,
      },
    ],
    Name: [
      {
        Key: Number,
        Value: String,
      },
    ],
    Description: [
      {
        Key: Number,
        Value: String,
      },
    ],
    ForbidStatus: String,
    FlexNumber: String,
  },
  IsMustInput: Boolean,
  StockFlexDetail: [stockFlexDetailSchema],
});

// 主表 schema
const stockSchema = new Schema(
  {
    FStockId: { type: String },
    FDocumentStatus: { type: String },
    FForbidStatus: { type: String },
    FName: { type: String },
    FNumber: { type: String },
    FDescription: { type: String },
    FCreateOrgId: { type: String },
    FUseOrgId: { type: String },
    FCreatorId: { type: String },
    FModifierId: { type: String },
    FCreateDate: { type: Date },
    FModifyDate: { type: Date },
    FPrincipal: {
      type: Array,
    },
    FTel: { type: String },
    FAllowATPCheck: { type: Boolean, default: false },
    FAllowMRPPlan: { type: Boolean, default: false },
    FIsOpenLocation: { type: Boolean, default: false },
    FAllowLock: { type: Boolean, default: false },
    FAllowMinusQty: { type: Boolean, default: false },
    FAddress: { type: String },
    FForbiderId: { type: String },
    FForbidDate: { type: Date },
    FSysDefault: { type: Boolean, default: false },
    FAuditorId: { type: String },
    FAuditDate: { type: Date },
    FGroup: {
      type: Array,
    },
    FStockProperty: { type: String },
    FSupplierId: { type: String },
    FCustomerId: { type: String },
    FStockStatusType: { type: String },
    FDefStockStatusId: { type: String },
    FDefReceiveStatusId: { type: String },
    FTHIRDSTOCKNO: { type: String },
    FAvailableAlert: { type: Boolean, default: false },
    FThirdStockType: { type: String },
    FAvailablePicking: { type: Boolean, default: false },
    FSortingPriority: { type: Number },
    FIsGYStock: { type: Boolean, default: false },
    FGYStockNumber: { type: String },
    FGYSynStatus: { type: String },
    FNotExpQty: { type: Boolean, default: false },
    FLocListFormatter: { type: String },
    FDeptId: { type: String },
    FIsZYStock: { type: Boolean, default: false },
    FStockFlexItem: { type: Array },
    
    // 同步时间字段
    lastSyncTime: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    strict: true,
  }
);

module.exports = mongoose.model("K3_BD_STOCK", stockSchema);
