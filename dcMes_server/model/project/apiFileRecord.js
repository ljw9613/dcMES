const mongoose = require("mongoose");

const apiFileRecordSchema = new mongoose.Schema(
  {
    apiConfigId: { type: mongoose.Schema.Types.ObjectId, ref: "third_party_api_config", required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true }, // 服务器存储路径
    fileSize: { type: Number, required: true }, // 字节
    uploadedBy: { type: String, default: "" },
    uploadedName: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
    callCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

apiFileRecordSchema.index({ apiConfigId: 1 });
apiFileRecordSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model("api_file_record", apiFileRecordSchema);
