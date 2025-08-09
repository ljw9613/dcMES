const mongoose = require("mongoose");

// 主条码工艺流程记录表
const SamplingInspectionFlowSchema = new mongoose.Schema({
    barcode: { type: String, required: true, unique: true }, // 主物料条码
    // 条码信息
    materialProcessFlowId: { type: mongoose.Schema.ObjectId, ref: "material_process_flow" }, // 条码ID
    // 抽检信息
    samplingStatus: { type: String }, // 抽检状态 已完成,待处理
    samplingTime: { type: Date }, // 抽检时间
    samplinger: { type: String }, // 抽检人员
    isQualified: { type: Boolean }, // 是否合格
    batchNo: { type: String }, // 批次号
  
    // 基础字段
    remark: { type: String }, // 备注
    createBy: { type: mongoose.Schema.ObjectId, ref: "user_login" },
    updateBy: { type: String },
    createAt: { type: Date, default: Date.now },
    updateAt: { type: Date, default: Date.now },
  });
  
  // 添加索引
  SamplingInspectionFlowSchema.index({ barcode: 1 }, { unique: true });
  SamplingInspectionFlowSchema.index({ samplingStatus: 1 });
  SamplingInspectionFlowSchema.index({ createAt: -1 });
  
  module.exports = mongoose.model(
    "sampling_nspection_flow",
    SamplingInspectionFlowSchema
  );
  