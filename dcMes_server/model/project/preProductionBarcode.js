const mongoose = require("mongoose");

const preProductionBarcodeSchema = new mongoose.Schema({
    // 工单信息
    workOrderId: { type: mongoose.Schema.ObjectId, ref: "production_plan_work_order" }, // 关联工单
    workOrderNo: { type: String, required: true }, // 工单号
    
    // 物料信息
    materialId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" }, // 关联物料
    materialNumber: { type: String, required: true }, // 物料编码
    materialName: { type: String, required: true }, // 物料名称
    
    // 条码规则信息
    ruleId: { type: mongoose.Schema.ObjectId, ref: "barcodeSegmentRule" }, // 关联条码规则
    ruleName: { type: String, required: true }, // 规则名称
    ruleCode: { type: String, required: true }, // 规则编码
    
    // 条码信息
    barcode: { type: String, required: true, unique: true }, // 生成的条码
    serialNumber: { type: Number, required: true }, // 序号（用于排序）
    
    // 状态信息
    status: { 
        type: String, 
        enum: ['PENDING', 'USED', 'VOIDED'], // 待使用、已使用、已作废
        default: 'PENDING'
    },
    
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
preProductionBarcodeSchema.index({ workOrderNo: 1 });
preProductionBarcodeSchema.index({ barcode: 1 });
preProductionBarcodeSchema.index({ materialNumber: 1 });
preProductionBarcodeSchema.index({ status: 1 });
preProductionBarcodeSchema.index({ createAt: -1 });

module.exports = mongoose.model("preProductionBarcode", preProductionBarcodeSchema); 