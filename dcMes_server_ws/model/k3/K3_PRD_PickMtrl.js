const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 序列号子表 schema
const serialSubSchema = new Schema({
  FDetailID: Number,
  FSerialNo: String,
  FSerialId: String,
  FSerialNote: String,
  FIsAppInspect: Boolean
});

// 关联信息 schema
const entityLinkSchema = new Schema({
  Id: Number,
  FlowId: String,
  FlowLineId: Number,
  RuleId: String,
  STableId: Number,
  STableName: String,
  SBillId: String,
  SId: String,
  BaseActualQtyOld: Number,
  BaseActualQty: Number
});

// 明细表 schema
const pickMtrlEntrySchema = new Schema({
  FEntryID: Number,
  // 物料信息
  FMaterialId: {
    Id: Number,
    Number: String,
    Name: String,
    Specification: String
  },
  FParentMaterialId: {
    Id: Number,
    Number: String,
    Name: String,
    Specification: String
  },
  
  // 数量相关
  FAppQty: Number,
  FActualQty: Number,
  FAllowOverQty: Number,
  FBaseAppQty: Number,
  FBaseActualQty: Number,
  FStockAppQty: Number,
  FStockActualQty: Number,
  FSecActualQty: { type: Number, default: 0 },
  
  // 单位信息
  FUnitID: {
    Id: Number,
    Number: String,
    Name: String
  },
  FBaseUnitId: {
    Id: Number,
    Number: String,
    Name: String
  },
  FStockUnitId: {
    Id: Number,
    Number: String,
    Name: String
  },
  
  // 仓储信息
  FStockId: {
    Id: Number,
    Number: String,
    Name: String
  },
  FStockLocId: {
    FF100001: String,
    FF100002: String,
    FF100003: String
  },
  FStockStatusId: {
    Id: Number,
    Number: String,
    Name: String
  },
  
  // 生产信息
  FMoBillNo: String,
  FMoId: Number,
  FMoEntryId: Number,
  FProcessId: {
    Id: Number,
    Number: String,
    Name: String
  },
  FWorkShopId: {
    Id: Number,
    Number: String,
    Name: String
  },
  
  // 货主信息
  FOwnerTypeId: String,
  FOwnerId: {
    Id: Number,
    Number: String,
    Name: String
  },
  FParentOwnerTypeId: String,
  FParentOwnerId: {
    Id: Number,
    Number: String,
    Name: String
  },
  
  // 其他信息
  FPrice: { type: Number, default: 0 },
  FAmount: { type: Number, default: 0 },
  FLot: String,
  FEntrtyMemo: String,
  
  // 序列号信息
  FSerialSubEntity: [serialSubSchema],
  
  // 关联信息
  FEntity_Link: [entityLinkSchema]
});

// 主表 schema
const pickMtrlSchema = new Schema(
  {
    // 基础信息
    FID: { type: Number, required: true, unique: true },
    FBillNo: { type: String, required: true },
    FDate: Date,
    FDocumentStatus: String,
    FCancelStatus: String,
    
    // 组织信息
    FPrdOrgId: {
      Id: Number,
      Number: String,
      Name: String
    },
    FStockOrgId: {
      Id: Number,
      Number: String,
      Name: String
    },
    FWorkShopId: {
      Id: Number,
      Number: String,
      Name: String
    },
    
    // 人员信息
    FPickerId: Schema.Types.Mixed,
    FSTOCKERID: Schema.Types.Mixed,
    
    // 操作记录
    FCreatorId: {
      Id: Number,
      Name: String
    },
    FCreateDate: Date,
    FModifierId: {
      Id: Number,
      Name: String
    },
    FModifyDate: Date,
    FApproverId: {
      Id: Number,
      Name: String
    },
    FApproveDate: Date,
    
    // 其他信息
    FDescription: { type: Array, default: [] },
    FBillType: {
      Id: String,
      Number: String,
      Name: String
    },
    FCurrId: {
      Id: Number,
      Number: String,
      Name: String
    },
    FIsCrossTrade: Boolean,
    FVmiBusiness: Boolean,
    
    // 明细信息
    FEntity: [pickMtrlEntrySchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("K3_PRD_PickMtrl", pickMtrlSchema); 