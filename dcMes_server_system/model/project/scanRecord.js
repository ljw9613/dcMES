/*
 * @name: 条码工序扫描记录表
 * @content: 记录产品条码在各工序的扫描情况
 * @Author: AI Assistant
 * @Date: 2024-03-21
 */
var mongoose = require("mongoose");

var scanRecordSchema = new mongoose.Schema({
  //主物料条码
  mainBarcode: { type: String, required: true }, // 主物料条码
  mainMaterialId: { type: mongoose.Schema.ObjectId, ref: "k3_material" }, // 主物料ID
  craftId: { type: mongoose.Schema.ObjectId, ref: "craft" }, // 关联工艺ID
  processStepId: { type: mongoose.Schema.ObjectId, ref: "process_step" }, // 关联工序ID
  processStepName: { type: String }, // 工序名称  
  sort: { type: Number }, // 工序顺序
  mainMaterialName: { type: String }, // 主物料名称
  // 产品条码列表
  productBarcodes: [{
    barcode: { type: String, required: true }, // 产品条码
    materialId: { type: mongoose.Schema.ObjectId, ref: "k3_material" }, // 物料ID
    materialCode: { type: String }, // 物料编码
    materialName: { type: String }, // 物料名称
    quantity: { type: Number }, // 用量
  }], // 产品条码列表




  // 扫描信息
  scanTime: { type: Date, default: Date.now }, // 扫描时间
  scanType: { type: String, enum: ["IN", "OUT"] }, // 扫描类型：进站/出站
  // workstationId: { type: mongoose.Schema.ObjectId, ref: "workstation" }, // 工作站ID
  // operatorId: { type: String }, // 操作员ID

  // 生产信息
  batchNo: { type: String }, // 生产批次号
  workOrderNo: { type: String }, // 工单号
  // lineId: { type: mongoose.Schema.ObjectId, ref: "line" }, // 产线ID

  status: { type: Boolean, default: true }, // 工序完成记录状态
  remark: { type: String }, // 备注

  createBy: { type: String }, // 创建人
  updateBy: { type: String }, // 更新人
  createAt: { type: Date, default: Date.now }, // 创建时间
  updateAt: { type: Date, default: Date.now }, // 更新时间
});

// 创建复合索引
scanRecordSchema.index({ barcode: 1, processStepId: 1, scanTime: -1 });

module.exports = mongoose.model("scanRecord", scanRecordSchema);
