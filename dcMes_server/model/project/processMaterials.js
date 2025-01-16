/*
 * @name: 工序步骤表
 * @content: 生产工序管理
 * @Author: AI Assistant
 * @Date: 2024-03-21
 */
var mongoose = require("mongoose");

var processMaterialsSchema = new mongoose.Schema({
  craftId: { type: mongoose.Schema.ObjectId, ref: "craft" }, // 关联工艺ID
  processStepId: { type: mongoose.Schema.ObjectId, ref: "processStep" }, // 工序步骤编号
  materialId: { type: mongoose.Schema.ObjectId, ref: "k3_material" }, // 物料ID
  materialCode: { type: String }, // 物料编码
  materialName: { type: String }, // 物料名称
  specification: { type: String }, // 规格型号
  quantity: { type: Number }, // 用量
  unit: { type: String }, // 单位
  isKey: { type: Boolean, default: false }, // 是否关键物料
  remark: { type: String }, // 物料使用备注
  scanOperation: { type: Boolean, default: false }, // 扫码操作
  isComponent: { type: Boolean, default: false }, // 是否组件
  isBatch: { type: Boolean, default: false }, // 是否批次物料
  batchQuantity: { type: Number, default: 0 }, // 批次用量
  //是否为RFID物料
  isRfid: { type: Boolean, default: false }, // 是否RFID物料
  // 是否包装箱
  isPackingBox: { type: Boolean, default: false }, // 是否包装箱
  createBy: { type: String }, // 创建人
  updateBy: { type: String }, // 更新人
  createAt: { type: Date, default: Date.now }, // 创建时间
  updateAt: { type: Date, default: Date.now }, // 更新时间
});

module.exports = mongoose.model("processMaterials", processMaterialsSchema);
