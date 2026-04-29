const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const apiParamTemplateSchema = new mongoose.Schema(
  {
    apiConfigId: { type: mongoose.Schema.Types.ObjectId, ref: "third_party_api_config", required: true },
    name: { type: String, required: true, maxlength: 50 },
    // 1=Query 2=Body-form-data 3=Body-x-www-form-urlencoded 4=Body-JSON
    paramType: { type: Number, enum: [1, 2, 3, 4], required: true },
    params: {
      type: [
        {
          key: { type: String, default: "" },
          value: { type: String, default: "" },
        },
      ],
      default: [],
    },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: String, default: "" },
    createdName: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
    updatedName: { type: String, default: "" },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

apiParamTemplateSchema.index({ apiConfigId: 1 });
apiParamTemplateSchema.index({ apiConfigId: 1, name: 1 });
apiParamTemplateSchema.index({ sortOrder: 1 });

apiParamTemplateSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: true,
});

module.exports = mongoose.model("api_param_template", apiParamTemplateSchema);
