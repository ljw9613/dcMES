const mongoose = require("mongoose");

// 主条码抽检记录表
const SamplingInspectionFlowSchema = new mongoose.Schema({
    // 条码基本信息
    barcode: { type: String, required: true }, // 主物料条码
    materialProcessFlowId: { type: mongoose.Schema.ObjectId, ref: "material_process_flow" }, // 关联工艺流程
    preProductionBarcodeId: { type: mongoose.Schema.ObjectId, ref: "preProductionBarcode" }, // 关联预生产条码记录
    
    // 物料信息
    materialCode: { type: String, required: true }, // 物料编码
    materialName: { type: String, required: true }, // 物料名称
    
    // 条码校验信息
    barcodeValidation: {
        printBarcode: { type: String, required: true }, // 打印条码
        transformedBarcode: { type: String, required: true }, // 转换条码
        isPrintBarcodeValid: { type: Boolean, required: true }, // 打印条码是否匹配
        isTransformedBarcodeValid: { type: Boolean, required: true }, // 转换条码是否匹配
        validationTime: { type: Date, default: Date.now } // 校验时间
    },

    // 抽检结果
    isQualified: { type: Boolean, required: true }, // 是否合格
    samplingStatus: { 
        type: String,
        enum: ['PENDING', 'COMPLETED', 'VOIDED'],
        default: 'PENDING'
    }, // 抽检状态
    samplingTime: { type: Date }, // 抽检时间
    samplingOperator: { type: String }, // 抽检人员
    batchNo: { type: String }, // 批次号

    // 作废信息
    voidReason: { type: String }, // 作废原因
    voidTime: { type: Date }, // 作废时间
    voidOperator: { type: String }, // 作废人员

    // 基础字段
    remark: { type: String }, // 备注说明
    createBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 创建人
    updateBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 更新人
    createAt: { type: Date, default: Date.now }, // 创建时间
    updateAt: { type: Date, default: Date.now } // 更新时间
}, {
    timestamps: { createdAt: 'createAt', updatedAt: 'updateAt' } // 自动维护时间戳
});

// 添加索引
SamplingInspectionFlowSchema.index({ barcode: 1 }); // 主条码索引
SamplingInspectionFlowSchema.index({ materialCode: 1 }); // 物料编码索引
SamplingInspectionFlowSchema.index({ samplingStatus: 1 }); // 状态索引
SamplingInspectionFlowSchema.index({ createAt: -1 }); // 创建时间降序索引
SamplingInspectionFlowSchema.index({ 'barcodeValidation.validationTime': -1 }); // 校验时间索引
SamplingInspectionFlowSchema.index({ isQualified: 1 }); // 合格状态索引
SamplingInspectionFlowSchema.index({ samplingTime: -1 }); // 抽检时间索引

// 更新时间中间件
SamplingInspectionFlowSchema.pre('save', function(next) {
    this.updateAt = Date.now();
    next();
});

// 添加虚拟字段
SamplingInspectionFlowSchema.virtual('isAllValid').get(function() {
    return this.barcodeValidation.isPrintBarcodeValid && 
           this.barcodeValidation.isTransformedBarcodeValid;
});

module.exports = mongoose.model("udi_sampling_inspection_flow", SamplingInspectionFlowSchema);