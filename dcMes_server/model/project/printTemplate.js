/*
 * @name: 打印模板表
 * @content: 打印模板管理
 * @Author: AI Assistant
 * @Date: 2024-03-21
 */
var mongoose = require("mongoose");

var printTemplateSchema = new mongoose.Schema({
    templateCode: { type: String, required: true }, // 模板编号
    templateName: { type: String, required: true }, // 模板名称
    templateType: { type: String, required: true }, // 模板类型(标签/报表等)
    businessType: { type: String }, // 业务类型
    
    // 模板配置
    config: {
        width: { type: Number }, // 宽度(mm)
        height: { type: Number }, // 高度(mm)
        orientation: { type: String }, // 打印方向(横向/纵向)
        paperSize: { type: String }, // 纸张大小(A4/A5等)
    },
    
    // 模板内容
    content: { type: String }, // 模板内容(HTML/JSON格式)
    previewImage: { type: String }, // 预览图片路径
    
    // 打印参数
    printParams: [{
        paramKey: { type: String }, // 参数键名
        paramName: { type: String }, // 参数显示名称
        paramType: { type: String }, // 参数类型
        defaultValue: { type: String }, // 默认值
        required: { type: Boolean }, // 是否必填
    }],
    
    version: { type: String }, // 版本号
    isDefault: { type: Boolean, default: false }, // 是否默认模板
    status: { type: Boolean, default: true }, // 状态(启用/禁用)
    remark: { type: String }, // 备注说明

    createBy: { type: String }, // 创建人
    updateBy: { type: String }, // 更新人
    createAt: { type: Date, default: Date.now }, // 创建时间
    updateAt: { type: Date, default: Date.now }, // 更新时间
});

// 添加pre-save中间件，自动更新updateAt字段
printTemplateSchema.pre('save', function(next) {
  // 只在文档被修改时更新updateAt字段
  if (this.isModified() && !this.isNew) {
    this.updateAt = new Date();
  }
  next();
});

// 添加pre-updateOne中间件，自动更新updateAt字段
printTemplateSchema.pre(['updateOne', 'findOneAndUpdate'], function() {
  // 确保所有updateOne和findOneAndUpdate操作都包含updateAt
  if (this.getUpdate() && !this.getUpdate().$set?.updateAt) {
    if (!this.getUpdate().$set) {
      this.getUpdate().$set = {};
    }
    this.getUpdate().$set.updateAt = new Date();
  }
});

module.exports = mongoose.model("print_template", printTemplateSchema); 