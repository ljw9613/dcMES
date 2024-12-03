/*
 * @name: 工艺表
 * @content: 生产工艺管理
 * @Author: AI Assistant
 * @Date: 2024-03-21
 */
var mongoose = require("mongoose");

var craftSchema = new mongoose.Schema({

    craftCode: { type: String, required: true }, // 工艺编号
    craftName: { type: String, required: true }, // 工艺名称
    craftVersion: { type: String }, // 工艺版本号
    productId: { type: mongoose.Schema.ObjectId, ref: "product" }, // 关联产品ID
    craftType: { type: String }, // 工艺类型
    craftDesc: { type: String }, // 工艺描述
    materialId: { type: mongoose.Schema.ObjectId, ref: "material" }, // 物料ID

    // 工艺参数
    craftParams: [{
        paramName: { type: String }, // 参数名称
        paramValue: { type: String }, // 参数值
        paramUnit: { type: String }, // 参数单位
        upperLimit: { type: Number }, // 上限值
        lowerLimit: { type: Number }, // 下限值
    }],
    
    // 工序步骤关联
    processSteps: [{ type: mongoose.Schema.ObjectId, ref: "process_step" }], // 关联工序步骤
    
    attachments: [{ type: String }], // 附件文档路径
    remark: { type: String }, // 备注
    
    status: { type: Boolean, default: true }, // 状态(启用/禁用)
    isStandard: { type: Boolean, default: false }, // 是否标准工艺
    
    createBy: { type: String }, // 创建人
    updateBy: { type: String }, // 更新人
    createAt: { type: Date, default: Date.now }, // 创建时间
    updateAt: { type: Date, default: Date.now }, // 更新时间
});

module.exports = mongoose.model("craft", craftSchema);
