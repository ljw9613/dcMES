/*
 * @name: 条码规则表
 * @content: 条码规则管理
 * @Author: AI Assistant
 * @Date: 2024-03-21
 */
var mongoose = require("mongoose");

var barcodeRuleSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 规则名称
  description: { type: String }, // 规则描述
  priority: { type: Number }, // 规则优先级，数字越小优先级越高
  enabled: { type: Boolean, default: true }, // 是否启用
  conditions: {
    type: { type: String }, // 匹配类型: "separator", "length", "regex"
    separator: { type: String }, // 分隔符(当type为separator时使用)
    length: { type: Number }, // 条码长度(当type为length时使用)
    regex: { type: String }, // 正则表达式(当type为regex时使用)
    enableRegex: { type: Boolean, default: false }, // 新增：是否启用附加正则校验
    additionalRegex: { type: String }, // 新增：附加正则表达式
  },
  extraction: {
    materialCode: {
      // 物料编码提取规则
      type: { type: String }, // 提取方式: "split", "substring", "di"
      index: { type: Number }, // split时使用的索引
      start: { type: Number }, // substring时使用的起始位置
      end: { type: Number }, // substring时使用的结束位置
      diPosition: {
        // DI码位置(当type为di时使用)
        start: { type: Number },
        end: { type: Number },
      },
    },
    relatedBill: {
      // 关联单据提取规则(可选)
      type: { type: String },
      index: { type: Number },
      start: { type: Number },
      end: { type: Number },
    },
  },
  createAt: { type: Date, default: Date.now }, // 创建时间
  updateAt: { type: Date, default: Date.now }, // 更新时间
});

module.exports = mongoose.model("barcodeRule", barcodeRuleSchema);
