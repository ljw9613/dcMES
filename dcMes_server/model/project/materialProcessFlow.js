const mongoose = require("mongoose");

// 定义工艺节点的结构
const processNodeSchema = new mongoose.Schema(
  {
    nodeId: { type: String, required: true }, // 节点唯一标识
    nodeType: {
      type: String,
      enum: ["MATERIAL", "PROCESS_STEP"],
      required: true,
    }, // 节点类型：物料/工序

    // 物料相关信息
    materialId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" }, // 物料ID
    materialCode: { type: String }, // 物料编码
    materialName: { type: String }, // 物料名称
    materialSpec: { type: String }, // 规格型号
    materialQuantity: { type: Number }, // 物料数量
    materialUnit: { type: String }, // 单位

    // 工序相关信息
    processStepId: { type: mongoose.Schema.ObjectId, ref: "process_step" }, // 工序ID
    processName: { type: String }, // 工序名称
    processCode: { type: String }, // 工序编码
    processSort: { type: Number }, // 工序顺序

    // 节点通用属性
    craftId: { type: mongoose.Schema.ObjectId }, // 关联的工艺ID
    craftName: { type: String }, // 工艺名称
    level: { type: Number, required: true }, // 节点层级
    parentNodeId: { type: String }, // 父节点ID

    // 扫码相关配置
    requireScan: { type: Boolean, default: false }, // 是否需要扫码
    scanOperation: { type: Boolean, default: false }, // 是否扫码操作
    isComponent: { type: Boolean, default: false }, // 是否组件
    isKeyMaterial: { type: Boolean, default: false }, // 是否关键物料

    // 条码状态
    barcode: { type: String, default: "" }, // 条码信息
    barcodeType: { type: String, default: "" }, // 条码类型 批次虚拟条码/物料上料条码
    scanTime: { type: Date }, // 扫码时间
    status: {
      type: String,
      enum: ["PENDING", "IN_PROCESS", "COMPLETED", "ABNORMAL"],
      default: "PENDING",
    },
    startTime: { type: Date }, // 节点开始时间
    endTime: { type: Date }, // 节点完成时间

    remark: { type: String }, // 备注
  },
  { _id: false }
);

// 主条码工艺流程记录表
const materialProcessFlowSchema = new mongoose.Schema({
  barcode: { type: String, required: true, unique: true }, // 主物料条码

  // 主物料信息
  materialId: { type: mongoose.Schema.ObjectId, ref: "k3_material" }, // 物料ID
  materialCode: { type: String }, // 物料编码
  materialName: { type: String }, // 物料名称
  materialSpec: { type: String }, // 规格型号

  // 工艺信息
  craftId: { type: mongoose.Schema.ObjectId, ref: "craft" }, // 关联工艺ID
  craftVersion: { type: String }, // 工艺版本号，记录创建时的工艺版本

  // 流程状态
  status: {
    type: String,
    enum: ["PENDING", "IN_PROCESS", "COMPLETED", "ABNORMAL"],
    default: "PENDING",
  },
  progress: { type: Number, default: 0 }, // 完成进度(0-100)

  // 时间信息
  startTime: { type: Date }, // 流程开始时间
  endTime: { type: Date }, // 流程结束时间
  planCompletionTime: { type: Date }, // 计划完成时间

  // 工艺流程图结构
  processNodes: [processNodeSchema], // 使用上面定义的节点结构

  // 异常信息
  abnormalReason: { type: String }, // 异常原因
  abnormalTime: { type: Date }, // 异常发生时间

  // 基础字段
  remark: { type: String }, // 备注
  createBy: { type: String },
  updateBy: { type: String },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

// 添加索引
materialProcessFlowSchema.index({ barcode: 1 }, { unique: true });
materialProcessFlowSchema.index({ materialCode: 1 });
materialProcessFlowSchema.index({ status: 1 });
materialProcessFlowSchema.index({ createAt: -1 });

module.exports = mongoose.model(
  "material_process_flow",
  materialProcessFlowSchema
);
