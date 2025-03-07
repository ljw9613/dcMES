const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UnbindRecordSchema = new Schema(
  {
    // 关联的主流程记录ID
    flowRecordId: {
      type: Schema.Types.ObjectId,
      ref: "MaterialProcessFlow",
      required: true,
    },
    // 主条码
    mainBarcode: {
      type: String,
      required: true,
    },
    // 解绑的工序ID
    processStepId: {
      type: Schema.Types.ObjectId,
      ref: "ProcessStep",
      required: true,
    },
    // 工序名称
    processName: {
      type: String,
    },
    // 解绑的物料信息
    unbindMaterials: [
      {
        materialId: Schema.Types.ObjectId,
        materialCode: String,
        materialName: String,
        originalBarcode: String,
      },
    ],
    // 解绑原因
    reason: {
      type: String,
      required: true,
    },
    // 操作人ID
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: "user_login",
      required: true,
    },
    // 操作时间
    operateTime: {
      type: Date,
      default: Date.now,
    },
    unbindSubsequent: {
      type: Boolean,
      default: false
    },
    affectedProcesses: [{
      processStepId: {
        type: Schema.Types.ObjectId,
        ref: 'ProcessStep'
      },
      processName: String,
      processCode: String
    }]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UnbindRecord", UnbindRecordSchema);
