const mongoose = require("mongoose");

const materialPalletizingUnbindLogSchema = new mongoose.Schema({
  palletCode: { type: String, required: true, description: "托盘编号" },
  unbindType: {
    type: String,
    required: true,
    enum: ["SINGLE", "BOX", "PALLET"],
    description: "解绑类型：单个/整箱/整托",
  },
  unbindBarcode: { type: String, required: true, description: "解绑的条码" },
  originalData: {
    type: Object,
    required: true,
    description: "解绑前的托盘数据快照",
  },
  affectedBarcodes: [
    {
      barcode: String,
      barcodeType: { type: String, enum: ["MAIN", "BOX"] },
      boxBarcode: String,
    },
  ],
  reason: { type: String, description: "解绑原因" },
  createBy: { type: mongoose.Schema.ObjectId, ref: "user_login", required: true, description: "操作人ID" },
  createAt: { type: Date, default: Date.now, description: "创建时间" },
});

module.exports = mongoose.model(
  "MaterialPalletizingUnbindLog",
  materialPalletizingUnbindLogSchema
);
