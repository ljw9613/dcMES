const mongoose = require("mongoose");

// 托盘错误日志表
const materialPalletizingErrorLogSchema = new mongoose.Schema({
  // 基本信息
  errorId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
  }, // 错误ID，自动生成
  
  // 托盘相关信息
  palletCode: { type: String }, // 托盘编号
  palletId: { 
    type: mongoose.Schema.ObjectId, 
    ref: "material_palletizing" 
  }, // 托盘ID
  
  // 条码相关信息
  barcode: { type: String }, // 产品条码
  boxBarcode: { type: String }, // 箱条码
  
  // 产线和工序信息
  productLineId: { 
    type: mongoose.Schema.ObjectId, 
    ref: "production_line" 
  }, // 产线ID
  productLineName: { type: String }, // 产线名称
  processStepId: { 
    type: mongoose.Schema.ObjectId, 
    ref: "processStep" 
  }, // 工序ID
  processStepName: { type: String }, // 工序名称
  
  // 物料信息
  materialId: { 
    type: mongoose.Schema.ObjectId, 
    ref: "k3_BD_MATERIAL" 
  }, // 物料ID
  materialCode: { type: String }, // 物料编码
  materialName: { type: String }, // 物料名称
  
  // 工单信息
  productionPlanWorkOrderId: {
    type: mongoose.Schema.ObjectId,
    ref: "production_plan_work_order"
  }, // 工单ID
  workOrderNo: { type: String }, // 工单号
  
  // 错误信息
  errorType: {
    type: String,
    enum: [
      "PROCESS_FAILED", // 工序处理失败
      "PALLET_SAVE_FAILED", // 托盘保存失败
      "DUPLICATE_BARCODE", // 重复条码
      "VALIDATION_FAILED", // 验证失败
      "CONCURRENT_CONFLICT", // 并发冲突
      "ROLLBACK_FAILED", // 回滚失败
      "BOX_VALIDATION_FAILED", // 箱条码验证失败
      "WORK_ORDER_ERROR", // 工单错误
      "MATERIAL_FLOW_ERROR", // 物料流程错误
      "ATOMIC_OPERATION_FAILED", // 原子操作失败
      "UNKNOWN_ERROR" // 未知错误
    ],
    required: true
  }, // 错误类型
  
  errorMessage: { type: String, required: true }, // 错误消息
  errorStack: { type: String }, // 错误堆栈
  
  // 操作信息
  operation: {
    type: String,
    enum: [
      "ADD_TO_PALLET", // 添加到托盘
      "CREATE_PALLET", // 创建托盘
      "BIND_PROCESS", // 绑定工序
      "VALIDATE_BARCODE", // 验证条码
      "SAVE_PALLET", // 保存托盘
      "ROLLBACK_PROCESS", // 回滚工序
      "UPDATE_PALLET_STATUS", // 更新托盘状态
      "UNBIND_BARCODE", // 解绑条码
      "SPLIT_PALLET", // 拆分托盘
      "OTHER" // 其他操作
    ],
    required: true
  }, // 操作类型
  
  // 状态信息
  processCompleted: { type: Boolean, default: false }, // 工序是否已完成
  palletStatus: { type: String }, // 托盘状态
  rollbackAttempted: { type: Boolean, default: false }, // 是否尝试回滚
  rollbackSuccess: { type: Boolean }, // 回滚是否成功
  
  // 重试信息
  retryCount: { type: Number, default: 0 }, // 重试次数
  maxRetries: { type: Number, default: 3 }, // 最大重试次数
  isRetryable: { type: Boolean, default: false }, // 是否可重试
  
  // 上下文信息
  context: {
    fromRepairStation: { type: Boolean, default: false }, // 是否来自维修台
    componentScans: [{ // 子物料扫描信息
      materialId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" },
      barcode: { type: String }
    }],
    palletData: { type: mongoose.Schema.Types.Mixed }, // 托盘数据快照
    requestData: { type: mongoose.Schema.Types.Mixed }, // 请求数据
    userAgent: { type: String }, // 用户代理
    ipAddress: { type: String }, // IP地址
  },
  
  // 解决信息
  resolved: { type: Boolean, default: false }, // 是否已解决
  resolutionNote: { type: String }, // 解决说明
  resolvedAt: { type: Date }, // 解决时间
  resolvedBy: { 
    type: mongoose.Schema.ObjectId, 
    ref: "user_login" 
  }, // 解决人
  
  // 影响评估
  impactLevel: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    default: "MEDIUM"
  }, // 影响级别
  
  affectedOperations: [{ type: String }], // 受影响的操作
  
  // 基础字段
  createBy: { 
    type: mongoose.Schema.ObjectId, 
    ref: "user_login" 
  }, // 创建人
  createAt: { type: Date, default: Date.now }, // 创建时间
  updateAt: { type: Date, default: Date.now }, // 更新时间
});

// 添加索引
materialPalletizingErrorLogSchema.index({ errorId: 1 }, { unique: true });
materialPalletizingErrorLogSchema.index({ createAt: -1 }); // 按时间倒序
materialPalletizingErrorLogSchema.index({ errorType: 1, createAt: -1 }); // 按错误类型和时间
materialPalletizingErrorLogSchema.index({ palletCode: 1, createAt: -1 }); // 按托盘编号和时间
materialPalletizingErrorLogSchema.index({ barcode: 1, createAt: -1 }); // 按条码和时间
materialPalletizingErrorLogSchema.index({ productLineId: 1, createAt: -1 }); // 按产线和时间
materialPalletizingErrorLogSchema.index({ resolved: 1, impactLevel: 1 }); // 按解决状态和影响级别
materialPalletizingErrorLogSchema.index({ operation: 1, errorType: 1 }); // 按操作和错误类型

// 复合索引
materialPalletizingErrorLogSchema.index({
  createAt: -1,
  resolved: 1,
  impactLevel: 1
}); // 综合查询索引

module.exports = mongoose.model(
  "material_palletizing_error_log",
  materialPalletizingErrorLogSchema
); 