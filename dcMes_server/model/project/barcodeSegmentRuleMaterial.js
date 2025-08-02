const mongoose = require("mongoose");

const materialBarcodeRuleSchema = new mongoose.Schema({
  // 物料信息
  materialId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" },
  materialNumber: { type: String, required: true }, // 物料编码
  materialName: { type: String, required: true }, // 物料名称

  // 规则信息
  ruleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "BarcodeSegmentRule",
  },
  ruleName: { type: String, required: true }, // 规则名称
  ruleCode: { type: String, required: true }, // 规则编码

  //组织
  orgId: { type: String },
  orgName: { type: String }, // 组织名称

  // 系统字段
  enabled: { type: Boolean, default: true }, // 是否启用
  creator: { type: String }, // 创建人
  updater: { type: String }, // 修改人
  createAt: { type: Date, default: Date.now }, // 创建时间
  updateAt: { type: Date, default: Date.now }, // 修改时间
});

// 更新时间中间件
materialBarcodeRuleSchema.pre("save", function (next) {
  this.updateAt = Date.now();
  next();
});

// 安全的模型导出，避免重复编译错误
module.exports = mongoose.models.barcodeSegmentRuleMaterial || mongoose.model(
  "barcodeSegmentRuleMaterial",
  materialBarcodeRuleSchema
);
