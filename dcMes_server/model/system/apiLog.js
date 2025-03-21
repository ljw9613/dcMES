const mongoose = require("mongoose");

const apiLogSchema = new mongoose.Schema({
  // 请求信息
  endpoint: { type: String, required: true }, // API端点路径
  method: { type: String, required: true }, // HTTP方法(GET, POST等)
  serviceName: { type: String }, // 服务名称（如materialProcessFlowService）
  
  // 请求数据
  requestParams: { type: Object }, // 请求参数(req.params)
  requestQuery: { type: Object }, // 查询参数(req.query)
  requestBody: { type: Object }, // 请求体(req.body)
  
  // 响应信息
  responseStatus: { type: Number }, // HTTP响应状态码
  responseBody: { type: Object }, // 响应数据
  success: { type: Boolean }, // 请求是否成功
  
  // 性能信息
  executionTime: { type: Number }, // 执行时间(毫秒)
  
  // 错误信息
  errorMessage: { type: String }, // 错误消息
  errorStack: { type: String }, // 错误堆栈
  
  // 用户信息
  userId: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 用户ID
  userIp: { type: String }, // 用户IP地址
  
  // 时间戳
  timestamp: { type: Date, default: Date.now },
});

// 添加索引以提高查询性能
apiLogSchema.index({ endpoint: 1 });
apiLogSchema.index({ serviceName: 1 });
apiLogSchema.index({ timestamp: -1 });
apiLogSchema.index({ success: 1 });
apiLogSchema.index({ userId: 1 });

module.exports = mongoose.model("api_log", apiLogSchema); 