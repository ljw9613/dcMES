const mongoose = require("mongoose");

const processScanRecordSchema = new mongoose.Schema({
    flowId: { type: mongoose.Schema.ObjectId, ref: "material_process_flow" }, // 关联主流程ID
    processStepId: { type: mongoose.Schema.ObjectId, ref: "process_step" }, // 工序ID
    lineId: { type: mongoose.Schema.ObjectId, ref: "production_line" }, // 产线ID
    lineName: { type: String }, // 产线名称
    materialBarcode: { type: String }, // 扫描的物料条码
    materialId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" }, // 扫描的物料ID
    materialCode: { type: String }, // 扫描的物料编码
    materialName: { type: String }, // 扫描的物料名称
    quantity: { type: Number }, // 扫描数量
    status: { 
        type: String, 
        enum: ['PENDING', 'COMPLETED', 'ABNORMAL'],
        default: 'PENDING'
    }, // 扫码状态
    scanTime: { type: Date }, // 扫码时间
    operator: { type: String }, // 操作人
    isRework: { type: Boolean, default: false }, // 是否返工
    abnormalReason: { type: String }, // 异常原因
    remark: { type: String }, // 备注
    createBy: { type: String },
    updateBy: { type: String },
    createAt: { type: Date, default: Date.now },
    updateAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("process_scan_record", processScanRecordSchema); 