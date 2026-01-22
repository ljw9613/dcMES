const mongoose = require("mongoose");

const dictTypeSchema = new mongoose.Schema({
    dictName: {type: String, default: ''}, // 字典名称
    dictType: {type: String, default: '', unique: true}, // 字典类型
    status: {type: String, default: '0'}, // 状态（0正常 1停用）
    createBy: {type: String, default: ''}, // 创建者
    createTime: {type: Date, default: Date.now}, // 创建时间
    updateBy: {type: String, default: ''}, // 更新者
    updateTime: {type: Date, default: Date.now}, // 更新时间
    remark: {type: String, default: ''}, // 备注
});

module.exports = mongoose.model("dictType", dictTypeSchema);
