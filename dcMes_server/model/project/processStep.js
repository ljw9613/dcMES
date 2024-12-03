/*
 * @name: 工序步骤表
 * @content: 生产工序管理
 * @Author: AI Assistant
 * @Date: 2024-03-21
 */
var mongoose = require("mongoose");

var processStepSchema = new mongoose.Schema({
    craftId: { type: mongoose.Schema.ObjectId, ref: "craft" }, // 关联工艺ID
    stepNo: { type: Number }, // 步骤序号
    stepName: { type: String }, // 步骤名称
    stepDesc: { type: String }, // 步骤描述
    standardTime: { type: Number }, // 标准工时(分钟)
    equipment: { type: mongoose.Schema.ObjectId, ref: "equipment" }, // 关联设备
    
    // 工序物料清单
    materials: [{
        materialId: { type: mongoose.Schema.ObjectId, ref: "material" }, // 物料ID
        materialCode: { type: String }, // 物料编码
        materialName: { type: String }, // 物料名称
        quantity: { type: Number }, // 用量
        unit: { type: String }, // 单位
        isKey: { type: Boolean, default: false }, // 是否关键物料
        remark: { type: String } // 物料使用备注
    }],

    status: { type: Boolean, default: true }, // 状态(启用/禁用)
    remark: { type: String }, // 备注
    
    createBy: { type: String }, // 创建人
    updateBy: { type: String }, // 更新人
    createAt: { type: Date, default: Date.now }, // 创建时间
    updateAt: { type: Date, default: Date.now } // 更新时间
});

module.exports = mongoose.model("processStep", processStepSchema);