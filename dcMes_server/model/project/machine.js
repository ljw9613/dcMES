var mongoose = require("mongoose");

var machineSchema = new mongoose.Schema(
  {
    lineId: { type: mongoose.Schema.ObjectId, ref: "productionLine", description: "产线ID" },
    machineName: {
      type: String,
      maxlength: 50,
      default: null,
      description: "设备名称",
    },
    machineCode: {
      type: String,
      maxlength: 50,
      default: null,
      description: "设备编号",
    },
    machineOrder: { type: Number, default: null, description: "设备排序" },
    machineIp: {
      type: String,
      maxlength: 20,
      default: null,
      description: "设备IP",
    },
    principal: {
      type: String,
      maxlength: 20,
      default: null,
      description: "负责人",
    },
    comment: {
      type: String,
      maxlength: 255,
      default: null,
      description: "备注",
    },
    createTime: { type: Date, default: Date.now, description: "创建时间" },
    updateTime: { type: Date, default: null, description: "更新时间" },
    machineClassId: { type: Number, default: null, description: "设备类型" },
    createBy: { type: Number, default: null, description: "创建人" },
    updateBy: { type: Number, default: null, description: "更新人" },
  },
  {
    timestamps: { createdAt: "createTime", updatedAt: "updateTime" }, // 自动维护时间字段
    collection: "machine", // 指定集合名称
  }
);

module.exports = mongoose.model("machine", machineSchema);
