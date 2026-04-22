const mongoose = require("mongoose");

const apiCallLogSchema = new mongoose.Schema(
  {
    // 弱关联接口配置（接口删除后置 null）
    apiConfigId: { type: mongoose.Schema.Types.ObjectId, ref: "third_party_api_config", default: null },
    // 调用时接口快照信息，确保日志可追溯
    apiConfigSnapshot: {
      name: { type: String, default: "" },
      url: { type: String, default: "" },
      method: { type: String, default: "" },
    },
    bizNo: { type: String, default: "" },
    saleNo: { type: String, default: "" },
    requestUrl: { type: String, default: "" },
    // 1=自定义参数 2=文件调用
    callMode: { type: Number, enum: [1, 2], required: true },
    // 弱关联参数模板
    paramTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: "api_param_template", default: null },
    paramTemplateSnapshot: { type: String, default: "" }, // 调用时模板名快照
    // 请求参数原始数据（自定义参数模式）
    requestParams: {
      paramType: { type: Number, default: null },
      items: {
        type: [{ key: String, value: String }],
        default: [],
      },
    },
    // 关联文件记录（文件调用模式）
    fileRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "api_file_record", default: null },
    responseStatus: { type: String, enum: ["success", "fail"], required: true },
    responseBody: { type: String, default: "" },
    responseHeaders: { type: String, default: "" },
    errorMessage: { type: String, default: "" },
    duration: { type: Number, default: 0 }, // 毫秒
    // 成功判定方式快照（http=仅HTTP状态码，body=响应体字段条件）
    successCheckMode: { type: String, enum: ["http", "body"], default: "http" },
    successConditionSnapshot: {
      field: { type: String, default: "" },
      operator: { type: String, default: "eq" },
      value: { type: String, default: "" },
    },
    requestTime: { type: Date, default: Date.now },
    retryCount: { type: Number, default: 0 },
    // 若该记录由重试产生，记录原始日志ID（弱关联，原日志删除后不影响本记录）
    retryFromLogId: { type: mongoose.Schema.Types.ObjectId, ref: "api_call_log", default: null },
    calledBy: { type: String, default: "" },
    calledName: { type: String, default: "" },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

apiCallLogSchema.index({ apiConfigId: 1 });
apiCallLogSchema.index({ requestTime: -1 });
apiCallLogSchema.index({ responseStatus: 1 });
apiCallLogSchema.index({ callMode: 1 });
apiCallLogSchema.index({ bizNo: 1 });
apiCallLogSchema.index({ saleNo: 1 });
apiCallLogSchema.index({ paramTemplateId: 1 });

module.exports = mongoose.model("api_call_log", apiCallLogSchema);
