const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const thirdPartyApiConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    url: { type: String, required: true },
    method: { type: String, enum: ["GET", "POST", "PUT", "DELETE"], required: true },
    description: { type: String, default: "" },
    status: { type: Number, enum: [1, 2, 3], default: 1 }, // 1=启用 2=禁用 3=作废
    // 接口请求超时时间（秒），默认 30 秒，范围 5~1200（最长 20 分钟）
    timeout: { type: Number, default: 30, min: 5, max: 1200 },
    // 响应成功判定条件：可通过检查响应体中特定字段来判断业务层面的成功/失败
    successCondition: {
      enabled: { type: Boolean, default: false },
      field: { type: String, default: "" },      // 响应体字段路径，支持点分写法，如 code / data.status
      operator: { type: String, default: "eq", enum: ["eq", "neq", "contains", "startsWith", "notEmpty"] },
      value: { type: String, default: "" },       // 期望值（notEmpty 时忽略）
    },
    createdBy: { type: String, default: "" },
    createdName: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
    updatedName: { type: String, default: "" },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

thirdPartyApiConfigSchema.index({ name: 1 });
thirdPartyApiConfigSchema.index({ status: 1 });
thirdPartyApiConfigSchema.index({ createdAt: -1 });

thirdPartyApiConfigSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: true,
});

module.exports = mongoose.model("third_party_api_config", thirdPartyApiConfigSchema);
