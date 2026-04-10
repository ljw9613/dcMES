const mongoose = require("mongoose");

/**
 * 三元组绑定 SN 与条码匹配规则（barcodeRule）关联配置，单例文档。
 */
const tripletBindRuleConfigSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: "triplet_bind",
      unique: true,
    },
    /** 引用的条码匹配规则 _id；未设置时不校验（或配合 snValidationEnabled） */
    barcodeRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "barcodeRule",
      default: null,
    },
    /** 是否在绑定时校验 SN（需同时配置 barcodeRuleId 且规则 enabled） */
    snValidationEnabled: { type: Boolean, default: false },
  },
  {
    collection: "triplet_bind_rule_config",
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "triplet_bind_rule_config",
  tripletBindRuleConfigSchema
);
