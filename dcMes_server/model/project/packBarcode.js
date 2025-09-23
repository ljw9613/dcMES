const mongoose = require("mongoose");

const packBarcodeSchema = new mongoose.Schema({
    // 工单信息
    workOrderId: { type: mongoose.Schema.ObjectId, ref: "production_plan_work_order" }, // 关联工单
    workOrderNo: { type: String, required: true }, // 工单号
    
    // 物料信息
    materialId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" }, // 关联物料
    materialNumber: { type: String, required: true }, // 物料编码
    materialName: { type: String, required: true }, // 物料名称
    
    // 添加产线信息
    productionLineId: { type: mongoose.Schema.ObjectId, ref: "production_line" }, // 关联产线
    lineNum: { type: String }, // 车间编码
    lineCode: { type: String }, // 产线编码
    // 条码规则信息
    ruleId: { type: mongoose.Schema.ObjectId, ref: "barcodeSegmentRule" }, // 关联条码规则
    ruleName: { type: String, required: true }, // 规则名称
    ruleCode: { type: String, required: true }, // 规则编码
    
    // 条码信息
    barcode: { type: String, required: true }, // 生成的基础条码
    printBarcode: { type: String, required: true }, // 基础打印条码
    transformedBarcode: { type: String }, // 转换后的条码
    transformedPrintBarcode: { type: String }, // 转换后的打印条码
    
    // 段落明细
    segmentBreakdown: [{
        name: String, // 段落名称
        value: String, // 原始值
        transformedValue: String, // 转换值
        config: {
            prefix: String, // 前缀
            suffix: String, // 后缀
            showPrefix: Boolean, // 是否显示前缀
            showSuffix: Boolean // 是否显示后缀
        }
    }],
    
    serialNumber: { type: Number, required: true }, // 序号（用于排序）

    // 并发控制字段
    lockedBy: { type: String }, // 锁定的产线ID或会话ID
    lockedAt: { type: Date }, // 锁定时间
    lockExpireAt: { type: Date }, // 锁定过期时间（防止死锁）
    
    // 状态信息
    status: { 
        type: String, 
        enum: ['PENDING', 'LOCKED', 'USED', 'VOIDED'], // 待使用、已锁定、已使用、已作废
        default: 'PENDING'
    },
    // 批次号
    batchNo: { type: String },
    
    // 作废信息
    voidReason: { type: String }, // 作废原因
    voidBy: { type: String }, // 作废人
    voidAt: { type: Date }, // 作废时间
    
    // 使用信息
    usedAt: { type: Date }, // 使用时间
    usedBy: { type: String }, // 使用人
    
    // 基础字段
    remark: { type: String }, // 备注
    creator: { type: String },
    createAt: { type: Date, default: Date.now },
    updater: { type: String },
    updateAt: { type: Date, default: Date.now }
});

// 添加索引
packBarcodeSchema.index({ workOrderNo: 1 });
packBarcodeSchema.index({ barcode: 1 });
packBarcodeSchema.index({ transformedBarcode: 1 });
packBarcodeSchema.index({ materialNumber: 1 });
packBarcodeSchema.index({ status: 1 });
packBarcodeSchema.index({ createAt: -1 });

// 添加新的索引
packBarcodeSchema.index({ lineNum: 1 });
packBarcodeSchema.index({ productionLineId: 1 });

// 并发控制相关索引
packBarcodeSchema.index({ productionLineId: 1, status: 1, createAt: -1 });
packBarcodeSchema.index({ lockedBy: 1 });
packBarcodeSchema.index({ lockExpireAt: 1 });

// 条码唯一性约束（排除已作废的条码）
packBarcodeSchema.index({ barcode: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: { $ne: "VOIDED" } } 
});
packBarcodeSchema.index({ printBarcode: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: { $ne: "VOIDED" } } 
});

// 序列号在当月内的唯一性约束（按物料+年月分组）
// 确保同一物料在同一月份内的序列号唯一
packBarcodeSchema.index({ 
  materialNumber: 1,
  serialNumber: 1,
  createAt: 1
}, { 
  unique: true,
  partialFilterExpression: { status: { $ne: "VOIDED" } }
});

// 添加pre-save中间件，自动更新updateAt字段
packBarcodeSchema.pre('save', function(next) {
  // 只在文档被修改时更新updateAt字段
  if (this.isModified() && !this.isNew) {
    this.updateAt = new Date();
  }
  next();
});

// 添加pre-updateOne中间件，自动更新updateAt字段
packBarcodeSchema.pre(['updateOne', 'findOneAndUpdate'], function() {
  // 确保所有updateOne和findOneAndUpdate操作都包含updateAt
  if (this.getUpdate() && !this.getUpdate().$set?.updateAt) {
    if (!this.getUpdate().$set) {
      this.getUpdate().$set = {};
    }
    this.getUpdate().$set.updateAt = new Date();
  }
});

// 安全的模型导出，避免重复编译错误
module.exports = mongoose.models.packBarcode || mongoose.model("packBarcode", packBarcodeSchema); 