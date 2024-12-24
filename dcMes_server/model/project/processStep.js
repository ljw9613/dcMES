/*
 * @name: 工序步骤表
 * @content: 生产工序管理
 * @Author: AI Assistant
 * @Date: 2024-03-21
 */
var mongoose = require("mongoose");

var processStepSchema = new mongoose.Schema({
    craftId: { type: mongoose.Schema.ObjectId, ref: "craft" }, // 关联工艺ID
    processCode: { type: String }, // 工序编码
    processName: { type: String }, // 工序名称
    processDesc: { type: String }, // 工序描述
    processStage: { type: String }, // 生产阶级(SMT/DIP/ASSEMPLY/PACK)
    processType: { type: String }, // 工序类型
    businessType: { type: String }, // 业务类型
    status: { type: String, default: 'CREATE' }, // 状态(CREATE/ENABLE/VOID)
    sort: { type: Number, default: 0 }, // 排序
    // 关联工序物料
    materials: [{ type: mongoose.Schema.ObjectId, ref: "processMaterials" }], // 关联工序物料ID数组
    machineId: {type: mongoose.Schema.ObjectId, ref: "machine", description: '检验设备'},

    // 批次单相关
    batchDocRequired: { type: Boolean, default: false }, // 是否需要批次单据

    remark: { type: String }, // 备注
    createBy: { type: String }, // 创建人pp
    updateBy: { type: String }, // 更新人
    createAt: { type: Date, default: Date.now }, // 创建时间
    updateAt: { type: Date, default: Date.now } // 更新时间
});

module.exports = mongoose.model("processStep", processStepSchema);