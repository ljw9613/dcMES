const mongoose = require("mongoose");

const apiTemplateOpLogSchema = new mongoose.Schema(
  {
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "api_param_template", required: true },
    apiConfigId: { type: mongoose.Schema.Types.ObjectId, ref: "third_party_api_config", required: true },
    opType: { type: String, enum: ["create", "edit", "delete"], required: true },
    opBy: { type: String, default: "" },
    opName: { type: String, default: "" },
    opTime: { type: Date, default: Date.now },
    beforeData: { type: mongoose.Schema.Types.Mixed, default: null },
    afterData: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

apiTemplateOpLogSchema.index({ templateId: 1 });
apiTemplateOpLogSchema.index({ apiConfigId: 1 });
apiTemplateOpLogSchema.index({ opTime: -1 });

module.exports = mongoose.model("api_template_op_log", apiTemplateOpLogSchema);
