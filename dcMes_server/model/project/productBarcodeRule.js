const mongoose = require("mongoose");

const productBarcodeRule = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" },
    barcodeRule: { type: mongoose.Schema.ObjectId, ref: "barcodeRule" },
    createBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 创建人
    updateBy: { type: String }, // 更新人
    createAt: { type: Date, default: Date.now }, // 创建时间
    updateAt: { type: Date, default: Date.now }, // 更新时间
  },
  {
    timestamps: { createdAt: "createTime", updatedAt: "updateTime" }, // 自动维护时间字段
    collection: "product_barcode_rule", // 指定集合名称
  }
);

// 按条码规则查询时用于关联匹配，避免 COLLSCAN
productBarcodeRule.index({ barcodeRule: 1 });
// 按产品物料查询
productBarcodeRule.index({ productId: 1 });

module.exports = mongoose.model("productBarcodeRule", productBarcodeRule);
