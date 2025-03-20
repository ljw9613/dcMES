var mongoose = require("mongoose");

var machineSchema = new mongoose.Schema(
  {
    lineId: {
      type: mongoose.Schema.ObjectId,
      ref: "production_line",
      description: "产线ID",
    },
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
    // 厂区名称
    factoryName: {
      type: String,
      required: true
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
    //新增字段
    lineCode: { type: String }, // 产线编码 (对应 line_no)
    lineName: { type: String }, // 产线名称 (对应 line_name)
    // 设备类型
    machineType: { type: String, description: "设备类型" },
    businessType: { type: String }, // 业务类型

    collectionMethod: { type: String, description: "采集方式" },
    //设备当前生产相关

    materialId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" }, // 物料ID

    processStepId: {
      type: mongoose.Schema.ObjectId,
      ref: "processStep",
      description: "当前工序ID",
    },
    productionPlanWorkOrderId: {
      type: mongoose.Schema.ObjectId,
      ref: "production_plan_work_order",
      description: "工单ID",
    },

    upperLimit: { type: Number, default: null, description: "检验值上限" },
    lowerLimit: { type: Number, default: null, description: "检验值下限" },

    status: { type: Boolean, default: false, description: "在线状态" },

    isNeedMaintain: { type: Boolean, default: 0, description: "是否需要维修检验" },

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
