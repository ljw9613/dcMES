const mongoose = require("mongoose");

const apiLogSchema = new mongoose.Schema({
  // 请求信息
  endpoint: { type: String, required: true }, // API端点路径（最多500字符）
  method: { type: String, required: true }, // HTTP方法(GET, POST等)
  serviceName: { type: String }, // 服务名称（如materialProcessFlowService）

  // 请求数据（仅保留轻量信息，body 不存储完整内容）
  requestParams: { type: Object }, // 请求参数(req.params)
  requestQuery: { type: Object }, // 查询参数(req.query)
  // requestBody 不再存储，避免大报文写入（单条可达数十KB）

  // 响应摘要（不存储完整 responseBody，防止 70kB+ 大字段撑大集合）
  responseStatus: { type: Number }, // HTTP响应状态码
  responseSnippet: { type: String }, // 响应摘要（截断到最多 500 字符）
  success: { type: Boolean }, // 请求是否成功

  // 性能信息
  executionTime: { type: Number }, // 执行时间(毫秒)

  // 错误信息
  errorMessage: { type: String }, // 错误消息（最多 1000 字符）
  errorStack: { type: String }, // 错误堆栈（最多 2000 字符）

  // 用户信息
  userId: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 用户ID
  userName: { type: String }, // 用户名
  realName: { type: String }, // 真实姓名
  roleId: { type: mongoose.Schema.ObjectId, ref: "role" }, // 角色ID
  userIp: { type: String }, // 用户IP地址

  // 时间戳：默认仅保留 7 天，降低日志集合和索引持续膨胀风险
  timestamp: { type: Date, default: Date.now, expires: "7d" },
});

// 添加索引以提高查询性能
apiLogSchema.index({ endpoint: 1 });
apiLogSchema.index({ serviceName: 1 });
apiLogSchema.index({ success: 1 });
apiLogSchema.index({ userId: 1 });
apiLogSchema.index({ userName: 1 });
apiLogSchema.index({ roleId: 1 });

module.exports = mongoose.model("api_log", apiLogSchema); 