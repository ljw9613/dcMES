const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 工单数量变更日志记录表
const workOrderQuantityLogSchema = new Schema(
  {
    // 工单信息
    workOrderId: {
      type: Schema.Types.ObjectId,
      ref: "production_plan_work_order",
      required: true,
      comment: "工单ID",
    },
    workOrderNo: {
      type: String,
      required: true,
      comment: "工单编号",
    },
    
    // 物料信息
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "k3_BD_MATERIAL",
      required: true,
      comment: "物料ID",
    },
    materialCode: {
      type: String,
      required: true,
      comment: "物料编码",
    },
    materialName: {
      type: String,
      required: true,
      comment: "物料名称",
    },
    
    // 产线信息
    productionLineId: {
      type: String,
      comment: "产线ID",
    },
    productionLineName: {
      type: String,
      comment: "产线名称",
    },
    
    // 变更信息
    changeType: {
      type: String,
      required: true,
      enum: ["input", "output"],
      comment: "变更类型：input-投入量，output-产出量",
    },
    changeQuantity: {
      type: Number,
      required: true,
      comment: "变更数量（正数为增加，负数为减少）",
    },
    
    // 变更前后数量
    beforeQuantity: {
      type: Number,
      required: true,
      comment: "变更前数量",
    },
    afterQuantity: {
      type: Number,
      required: true,
      comment: "变更后数量",
    },
    
    // 关联的主条码信息
    relatedBarcode: {
      type: String,
      comment: "相关主条码",
    },
    barcodeOperation: {
      type: String,
      enum: [
        "SCAN_PROCESS", 
        "SCAN_BATCH_DOC", 
        "UNBIND_PROCESS", 
        "INITIALIZE_PRODUCT", 
        "MANUAL_ADJUST",
        "OTHER"
      ],
      comment: "条码操作类型",
    },
    
    // 工序信息（如果是工序相关操作）
    processStepId: {
      type: Schema.Types.ObjectId,
      ref: "processStep",
      comment: "工序步骤ID",
    },
    processName: {
      type: String,
      comment: "工序名称",
    },
    processCode: {
      type: String,
      comment: "工序编码",
    },
    
    // 工单状态变更
    beforeStatus: {
      type: String,
      comment: "变更前工单状态",
    },
    afterStatus: {
      type: String,
      comment: "变更后工单状态",
    },
    
    // 进度变更
    beforeProgress: {
      type: Number,
      comment: "变更前进度百分比",
    },
    afterProgress: {
      type: Number,
      comment: "变更后进度百分比",
    },
    
    // 操作信息
    operatorId: {
      type: String,
      required: true,
      comment: "操作人员ID",
    },
    operatorName: {
      type: String,
      comment: "操作人员姓名",
    },
    operateTime: {
      type: Date,
      default: Date.now,
      required: true,
      comment: "操作时间",
    },
    
    // 操作原因和备注
    reason: {
      type: String,
      comment: "变更原因",
    },
    remark: {
      type: String,
      comment: "备注信息",
    },
    
    // 系统信息
    ipAddress: {
      type: String,
      comment: "操作IP地址",
    },
    userAgent: {
      type: String,
      comment: "用户代理信息",
    },
    
    // 是否为自动操作
    isAutomatic: {
      type: Boolean,
      default: true,
      comment: "是否为自动操作",
    },
    
    // 数据来源
    source: {
      type: String,
      enum: ["DEVICE", "WEB", "API", "SYSTEM"],
      default: "SYSTEM",
      comment: "数据来源",
    },
  },
  {
    timestamps: true,
    collection: "work_order_quantity_logs",
    versionKey: false,
  }
);

// 创建索引
workOrderQuantityLogSchema.index({ workOrderId: 1, operateTime: -1 });
workOrderQuantityLogSchema.index({ relatedBarcode: 1, operateTime: -1 });
workOrderQuantityLogSchema.index({ materialId: 1, operateTime: -1 });
workOrderQuantityLogSchema.index({ operateTime: -1 });
workOrderQuantityLogSchema.index({ changeType: 1, operateTime: -1 });

// 复合索引：用于防重复检查 - 查询同一条码在同一工单、同一工序中的投入量增加记录
workOrderQuantityLogSchema.index({ 
  workOrderId: 1, 
  relatedBarcode: 1, 
  processStepId: 1, 
  changeType: 1, 
  operateTime: -1 
}, { 
  name: 'idx_workorder_barcode_process_duplicate_check',
  background: true 
});

module.exports = mongoose.model("workOrderQuantityLog", workOrderQuantityLogSchema); 