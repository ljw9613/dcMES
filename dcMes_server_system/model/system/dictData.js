const mongoose = require("mongoose");

const dictDataSchema = new mongoose.Schema({
    dictSort: {type: Number, default: 0}, // 字典排序
    dictLabel: {type: String, default: ''}, // 字典标签
    dictValue: {type: String, default: ''}, // 字典键值
    dictType: {type: String, default: ''}, // 字典类型
    cssClass: {type: String, default: ''}, // 样式属性（其他样式扩展）
    listClass: {type: String, default: ''}, // 表格回显样式
    isDefault: {type: String, default: 'N   '}, // 是否默认（Y是 N否）
    status: {type: String, default: '0'}, // 状态（0正常 1停用）
    createBy: {type: String, default: ''}, // 创建者
    createTime: {type: Date, default: Date.now}, // 创建时间
    updateBy: {type: String, default: ''}, // 更新者
    updateTime: {type: Date, default: Date.now}, // 更新时间
    remark: {type: String, default: ''}, // 备注
});

module.exports = mongoose.model("dictData", dictDataSchema);
