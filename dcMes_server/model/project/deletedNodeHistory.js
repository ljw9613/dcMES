const mongoose = require("mongoose");

/**
 * 节点删除历史记录模型
 * 用于记录工艺流程更新过程中被删除的节点信息
 */
const deletedNodeHistorySchema = new mongoose.Schema(
  {
    // 关联的流程记录ID
    flowRecordId: {
      type: mongoose.Schema.ObjectId,
      ref: "material_process_flow",
      required: true,
    },
    
    // 被删除节点的ID
    nodeId: {
      type: String,
      required: true,
    },
    
    // 节点类型
    nodeType: {
      type: String,
      enum: ["MATERIAL", "PROCESS_STEP"],
      required: true,
    },
    
    // 节点完整数据（JSON字符串）
    nodeData: {
      type: String,
      required: true,
    },
    
    // 删除时间
    deleteTime: {
      type: Date,
      default: Date.now,
    },
    
    // 恢复状态
    isRestored: {
      type: Boolean,
      default: false,
    },
    
    // 恢复时间
    restoreTime: {
      type: Date,
    },
    
    // 恢复操作人
    restoreBy: {
      type: mongoose.Schema.ObjectId,
      ref: "user_login",
    },
    
    // 备注
    remark: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: "createAt",
      updatedAt: "updateAt",
    },
  }
);

// 创建索引
deletedNodeHistorySchema.index({ flowRecordId: 1 });
deletedNodeHistorySchema.index({ nodeId: 1 });
deletedNodeHistorySchema.index({ deleteTime: -1 });

// 导出模型
const DeletedNodeHistory = mongoose.model(
  "deleted_node_history",
  deletedNodeHistorySchema
);

module.exports = DeletedNodeHistory; 