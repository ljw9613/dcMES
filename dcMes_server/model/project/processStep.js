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
    //工序关联的打印模版
    printTemplateId: { type: mongoose.Schema.ObjectId, ref: "print_template" }, // 关联打印模版ID

    // 关联工序物料
    materials: [{ type: mongoose.Schema.ObjectId, ref: "processMaterials" }], // 关联工序物料ID数组
    machineId: {type: mongoose.Schema.ObjectId, ref: "machine", description: '检验设备'},
    machineIds: [{type: mongoose.Schema.ObjectId, ref: "machine", description: '检验设备'}], // 关联检验设备ID数组

    // 批次单相关
    batchDocRequired: { type: Boolean, default: false }, // 是否需要批次单据
    batchDocType: { type: String }, // 批次单据类型

    // 是否录入MES
    isMES: { type: Boolean, default: true }, // 是否录入MES
    
    remark: { type: String }, // 备注
    createBy: { type: String }, // 创建人pp
    updateBy: { type: String }, // 更新人
    createAt: { type: Date, default: Date.now }, // 创建时间
    updateAt: { type: Date, default: Date.now } // 更新时间
});

// 添加pre-save中间件，自动更新updateAt字段
processStepSchema.pre('save', function(next) {
  // 只在文档被修改时更新updateAt字段
  if (this.isModified() && !this.isNew) {
    this.updateAt = new Date();
  }
  next();
});

// 添加pre-updateOne中间件，自动更新updateAt字段
processStepSchema.pre(['updateOne', 'findOneAndUpdate'], function() {
  // 确保所有updateOne和findOneAndUpdate操作都包含updateAt
  if (this.getUpdate() && !this.getUpdate().$set?.updateAt) {
    if (!this.getUpdate().$set) {
      this.getUpdate().$set = {};
    }
    this.getUpdate().$set.updateAt = new Date();
  }
});

module.exports = mongoose.model("processStep", processStepSchema);