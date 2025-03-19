/*
 * @name: 物料条码批次表
 * @content: 记录物料对应的条码批次生成信息
 * @Author: AI Assistant
 * @Date: 2024-03-21
 */
var mongoose = require("mongoose");

var materialBarcodeSchema = new mongoose.Schema({
    // 批次基本信息
    batchId: { type: String, required: true, unique: true }, // 批次ID，唯一标识
    ipAddress: { type: String, required: true }, // 打印机IP地址
    materialCode: { type: String, required: true }, // 物料编码
    sequenceLength: { type: Number }, // 序列号长度，默认8位
    createBy: { type: String }, // 创建人
    updateBy: { type: String }, // 更新人
    //是否使用
    isUsed: { type: Boolean, default: false },
    //备注
    remark: { type: String },
    createAt: { type: Date, default: Date.now }, // 创建时间
    updateAt: { type: Date, default: Date.now } // 更新时间
});

// 创建索引
materialBarcodeSchema.index({ materialCode: 1, currentSequence: 1 });
materialBarcodeSchema.index({ batchId: 1 }, { unique: true });

module.exports = mongoose.model("materialBarcodeBatch", materialBarcodeSchema);