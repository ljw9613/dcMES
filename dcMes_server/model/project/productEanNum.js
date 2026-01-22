const mongoose = require("mongoose");

const productEanNum = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" },
    eanNum: { type: String, maxlength: 100, default: null, description: "EAN码/69码" },
    createBy: { type: String }, // 创建人pp
    updateBy: { type: String }, // 更新人
    createAt: { type: Date, default: Date.now }, // 创建时间
    updateAt: { type: Date, default: Date.now } // 更新时间
  },
  {
    timestamps: { createdAt: "createTime", updatedAt: "updateTime" }, // 自动维护时间字段
    collection: "product_ean_number", // 修正集合名称
  }
);

module.exports = mongoose.model("productEanNum", productEanNum);
