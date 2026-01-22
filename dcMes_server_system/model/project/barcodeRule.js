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
  priority: { type: Number }, // 规则优先级
  enabled: { type: Boolean, default: true }, // 是否启用
  isGlobal: { type: Boolean, default: false }, // 是否全局使用

  // 校验规则列表 - 按顺序执行，全部通过才算校验成功
  validationRules: [{
    order: { type: Number, required: true }, // 执行顺序
    name: { type: String }, // 规则名称
    description: { type: String }, // 规则描述
    enabled: { type: Boolean, default: true }, // 是否启用
    
    type: { 
      type: String, 
      enum: ['length', 'substring', 'regex'], 
      required: true 
    }, // 校验类型
    
    params: {
      // 长度校验参数
      length: { type: Number }, // 指定长度
      
      // 截取校验参数
      start: { type: Number }, // 起始位置
      end: { type: Number }, // 结束位置
      expectedValue: { type: String }, // 截取后期望的值
      
      // 正则校验参数
      pattern: { type: String }, // 正则表达式
    }
  }],

  // 提取配置 - 按目标字段分组
  extractionConfigs: [{
    target: { 
      type: String, 
      enum: ['materialCode', 'DI', 'relatedBill', 'snCode', 'modelCode'], 
      required: true 
    }, // 提取目标字段
    
    // 提取步骤 - 按顺序执行，前一个步骤的结果作为后一个步骤的输入
    steps: [{
      order: { type: Number, required: true }, // 执行顺序
      name: { type: String }, // 步骤名称
      description: { type: String }, // 步骤描述
      enabled: { type: Boolean, default: true }, // 是否启用
      
      type: { 
        type: String, 
        enum: ['split', 'substring', 'regex'], 
        required: true 
      }, // 提取类型
      
      params: {
        // split 参数
        separator: { type: String }, // 分隔符
        index: { type: Number }, // 分割后取第几个元素
        
        // substring 参数
        start: { type: Number }, // 起始位置
        end: { type: Number }, // 结束位置
        
        // regex 参数
        pattern: { type: String }, // 正则表达式
        group: { type: Number }, // 捕获组索引
      }
    }]
  }],

  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("barcodeRule", barcodeRuleSchema);
