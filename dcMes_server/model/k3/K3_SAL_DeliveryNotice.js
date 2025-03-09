const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 序列号子表 schema
const serialSubSchema = new Schema({
  FDetailID: Number,
  FSerialNo: String,
  FSerialId: String,
  FSerialNote: String
});

// 物流跟踪明细 schema
const deliveryTraceSchema = new Schema({
  FEntryID: Number,
  FLogComId: {
    FCODE: String,
    Name: String
  },
  FCarryBillNo: String,
  FPhoneNumber: String,
  FFrom: String,
  FTo: String,
  FDelTime: Date,
  FTraceStatus: String,
  FReceiptTime: Date,
  FDeliNoticeTraceDetail: [{
    FDetailID: Number,
    FTraceTime: String,
    FTraceDetail: String
  }]
});

// 关联信息 schema
const entityLinkSchema = new Schema({
  FLinkId: Number,
  FFlowId: String,
  FFlowLineId: Number,
  FRuleId: String,
  FSTableId: Number,
  FSTableName: String,
  FSBillId: String,
  FSId: String,
  FBaseUnitQtyOld: Number,
  FBaseUnitQty: Number,
  FStockBaseQtyOld: Number,
  FStockBaseQty: Number
});

// 明细表 schema
const deliveryNoticeEntrySchema = new Schema({
  FEntryID: Number,
  
  // 物料信息
  FMaterialID: {
    Id: Number,
    Number: String,
    Name: String,
    Specification: String,
    MaterialGroup: {
      Id: Number,
      Number: String,
      Name: String
    },
    MaterialBase: [{
      Id: Number,
      ErpClsID: String,
      IsInventory: Boolean,
      IsSale: Boolean,
      BaseUnitId: {
        Id: Number,
        Number: String,
        Name: String
      }
    }]
  },
  FCustMatID: {
    Id: String,
    Number: String,
    Name: String,
    MaterialId: {
      Id: Number,
      Number: String,
      Name: String
    }
  },
  
  // 数量相关
  FQty: Number,
  FBaseUnitQty: Number,
  FAwaitQty: Number,
  FAvailableQty: Number,
  FCurrentInventory: Number,
  
  // 单位信息
  FUnitID: {
    Id: Number,
    Number: String,
    Name: String
  },
  FBaseUnitID: {
    Id: Number,
    Number: String,
    Name: String
  },
  
  // 仓储信息
  FStockID: {
    Id: Number,
    Number: String,
    Name: String
  },
  FStockLocID: {
    FF100001: String,
    FF100002: String,
    FF100003: String
  },
  FStockStatusId: {
    Id: Number,
    Number: String,
    Name: String
  },
  
  // 发货信息
  FDeliveryLoc: {
    Id: Number,
    Number: String,
    Name: String
  },
  FDeliveryDate: Date,
  FPlanDeliveryDate: Date,
  
  // 其他信息
  FPrice: { type: Number, default: 0 },
  FTaxPrice: { type: Number, default: 0 },
  FAmount: { type: Number, default: 0 },
  FLot: String,
  FNoteEntry: String,
  
  // 序列号信息
  FSerialSubEntity: [serialSubSchema],
  
  // 关联信息
  FEntity_Link: [entityLinkSchema],
  
  // 新增字段
  FOrderNo: String,  // 订单编号
  FOrderSeq: String, // 订单行号
  FSrcType: String,  // 来源类型
  
  // 税率信息
  FSALDeliveryNoticeEntryTax: [{
    FDetailID: Number,
    FTaxRateId: {
      Id: Number,
      Number: String,
      Name: String
    },
    FTaxRate: Number,
    FTaxAmount: Number,
    FCostPercent: Number,
    FCostAmount: Number,
    FVAT: Boolean,
    FSellerWithholding: Boolean,
    FBuyerWithholding: Boolean
  }],
  
  // 销售订单行ID
  FSOEntryId: Number,
  
  // 自定义字段
  FF_dcdj_khdd: String,     // 客户订单号
  FF_dcdj_Text: String,     // 自定义文本1
  FF_dcdj_Text1: String,    // 自定义文本2 
  FF_dcdj_Text2: String,    // 自定义文本3
  FF_dcdj_gt: String,       // 柜台
  FF_dcdj_bgdj: Number,     // 变更单价
  FF_dcdj_ofislineid: String, // OFIS行ID
  FF_dcdj_EndbuyerPO: String, // 最终买家PO
  FF_dcdj_CRD: Date,        // CRD日期
  FF_dcdj_ETD: Date,        // ETD日期
  FF_dcdj_shsl: Number,     // 收货数量
  FF_dcdj_Text12: String    // 自定义文本12
});

// 主表 schema
const deliveryNoticeSchema = new Schema(
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
    },
    FDeliveryOrgID: {
      Id: Number,
      Number: String,
      Name: String,
    },

    // 业务伙伴信息
    FCustomerID: {
      Id: Number,
      Number: String,
      Name: String,
    },
    FCarrierID: {
      Id: Number,
      Number: String,
      Name: String
    },
    
    // 部门人员信息
    FSaleDeptID: {
      Id: Number,
      Number: String,
      Name: String
    },
    FSalesManID: {
      Id: Number,
      Number: String,
      Name: String
    },
    FStockerGroupID: {
      Id: Number,
      Number: String,
      Name: String
    },
    FStockerID: {
      Id: Number,
      Number: String,
      Name: String
    },
    
    // 收货信息
    FReceiverID: {
      Id: Number,
      Number: String,
      Name: String
    },
    FReceiveAddress: String,
    FReceiverContactID: {
      Id: Number,
      Name: String
    },
    
    // 单据类型
    FBillTypeID: {
      Id: String,
      Number: String,
      Name: String,
    },
    
    // 其他信息
    FNote: String,
    FCarriageNO: String,
    
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
    
    // 明细信息
    FEntity: [deliveryNoticeEntrySchema],
    
    // 物流跟踪
    FDeliNoticeTrace: [deliveryTraceSchema],
    
    // 新增自定义字段
    FF_dcdj_sjcq: String,      // 上架仓区
    FF_dcdj_so: String,        // SO号
    FF_dcdj_zwzgr: String,     // 装卸责任人
    FF_dcdj_gl: Number,        // 工量
    FF_dcdj_ppspo: String,     // PPS PO号
    FF_dcdj_kppo: String,      // 开票PO号
    FF_dcdj_jgsj: Date,        // 加工时间
    FF_dcdj_gx: String,        // 工序
    FF_dcdj_jsisj: Date,      // JSI时间
    FF_dcdj_BOOKING: String,   // BOOKING号
    FF_dcdj_xfh: String,      // 箱封号
    
    // 其他自定义字段
    FF_TFQJ_cgdh: String,     // 采购单号
    FF_TFQJ_ddzt: String,     // 订单状态
    FF_TFQJ_kdrq: Date,       // 开单日期
    FF_TFQJ_zgyn: String,     // 是否最高优先级
    FF_TFQJ_fpdh: String,     // 分批单号
    FF_TFQJ_zhpoh: String,    // 综合PO号
    FF_TFQJ_zhpoyy: String,   // 综合PO原因
    FF_TFQJ_DDDH: String      // 订单单号
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("K3_SAL_DeliveryNotice", deliveryNoticeSchema); 