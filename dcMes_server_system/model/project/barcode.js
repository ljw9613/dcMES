/*
 * @name: 条码记录表
 * @content: 条码信息管理
 * @Author: AI Assistant
 * @Date: 2024-03-21
 */
var mongoose = require("mongoose");

var barcodeSchema = new mongoose.Schema({
    barcodeId: { type: String, required: true, unique: true }, // 条码ID，唯一标识
    barcodeType: { type: String, required: true }, // 条码类型(如：一维码、二维码、QR码等)
    barcodeContent: { type: String, required: true }, // 条码内容
    
    // 关联信息
    productCode: { type: String }, // 关联产品编码
    materialCode: { type: String }, // 关联物料编码
    // 批次信息
    batchNo: { type: String }, // 批次号
    serialNo: { type: String }, // 序列号
    //供应商信息
    supplierId: { type: String }, // 关联供应商ID
    // 仓库信息
    warehouseId: { type: String }, // 关联仓库ID
    // 生产信息
    productionDate: { type: Date }, // 生产日期
    productionLine: { type: String }, // 生产线
    workstation: { type: String }, // 工位

    
    // 使用状态
    useCount: { type: Number, default: 0 }, // 使用次数
    lastUsedAt: { type: Date }, // 最后使用时间
    
    remark: { type: String }, // 备注
    
    createBy: { type: String }, // 创建人
    updateBy: { type: String }, // 更新人
    createAt: { type: Date, default: Date.now }, // 创建时间
    updateAt: { type: Date, default: Date.now } // 更新时间
});

module.exports = mongoose.model("barcode", barcodeSchema);