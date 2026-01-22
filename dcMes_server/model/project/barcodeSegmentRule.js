/*
 * @name: 条码段落规则表
 * @content: 条码规则管理
 * @Author: AI Assistant
 * @Date: 2024-03-21
 */
const mongoose = require("mongoose");

const barcodeSegmentRuleSchema = new mongoose.Schema({
  // 规则基本信息
  name: { type: String, required: true }, // 规则名称
  code: { type: String, required: true }, // 规则编码
  description: { type: String }, // 规则描述
  enabled: { type: Boolean, default: true }, // 是否启用
  
  // 条码段落定义
  segments: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // 添加 _id 字段
    name: { type: String, required: true }, // 段落名称
    type: { 
      type: String, 
      enum: ['constant', 'fieldMapping', 'date', 'sequence'],
      required: true 
    }, // 段落类型
    
    config: {
      // 通用配置
      prefix: { type: String }, // 前缀
      suffix: { type: String }, // 后缀
      showPrefix: { type: Boolean, default: true }, // 是否显示前缀
      showSuffix: { type: Boolean, default: true }, // 是否显示后缀
      
      // 固定值配置
      constantValue: { type: String },
      enableTransform: { type: Boolean, default: false }, // 新增：是否启用转换
      transformValue: { type: String }, // 新增：转换后的值
      
      // 字段映射配置
      mappingField: { type: String },
      fieldMappings: [{
        value: { type: String },
        code: { type: String }
      }],
      
      // 日期配置
      dateFormat: { type: String }, // 日期格式，如 YYYY
      yearMappings: [{
        value: { type: String }, // 实际年份，如 "2024"
        code: { type: String }   // 映射代码，如 "X"
      }],
      monthMappings: [{
        value: { type: String }, // 实际月份，如 "1"
        code: { type: String }   // 映射代码，如 "A"
      }],
      dayMappings: [{
        value: { type: String }, // 实际日期，如 "1"
        code: { type: String }   // 映射代码，如 "A"
      }],
      
      // 流水号配置
      startValue: { type: Number, default: 1 }, // 起始值
      length: { type: Number, default: 1 }, // 长度
      padChar: { type: String, default: '0' }, // 填充字符
      numberMappings: [{
        position: { type: Number, required: true }, // 添加位置字段
        value: { type: String, required: true },    // 实际数字
        code: { type: String, required: true }      // 映射代码
      }],
      oldPadChar: { type: String }  // 添加oldPadChar字段用于跟踪填充字符变化
    }
  }],

  // 添加总长度字段
  totalLength: { type: Number },

  // 系统字段
  creator: { type: String }, // 创建人
  updater: { type: String }, // 修改人
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now }
});

// 更新时间中间件
barcodeSegmentRuleSchema.pre("save", function (next) {
  this.updateAt = Date.now();
  next();
});

// 安全的模型导出，避免重复编译错误
module.exports = mongoose.models.BarcodeSegmentRule || mongoose.model("BarcodeSegmentRule", barcodeSegmentRuleSchema);