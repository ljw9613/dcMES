const mongoose = require("mongoose");

const fileResourceSchema = new mongoose.Schema({
  // 文件基本信息
  fileName: { type: String, required: true }, // 文件名称
  fileSize: { type: Number, required: true }, // 文件大小(字节)
  fileType: { type: String, required: true }, // 文件类型(扩展名)
  mimeType: { type: String }, // MIME类型
  
  // 存储信息
  storageType: { 
    type: String, 
    enum: ["LOCAL", "OSS", "COS"], // 本地存储、阿里云OSS、腾讯云COS
    required: true 
  }, // 存储类型
  storagePath: { type: String, required: true }, // 存储路径
  url: { type: String }, // 访问地址

  // 分类信息
  category: { type: String }, // 文件分类
  businessType: { type: String }, // 业务类型
  businessId: { type: mongoose.Schema.ObjectId }, // 关联业务ID
  
  // 文件状态
  status: {
    type: String,
    enum: ["ACTIVE", "DELETED"], // 正常、已删除
    default: "ACTIVE"
  },

  // 基础字段
  remark: { type: String }, // 备注
  createBy: { type: mongoose.Schema.ObjectId, ref: "user_login" },
  updateBy: { type: mongoose.Schema.ObjectId, ref: "user_login" },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now }
});

// 添加索引
fileResourceSchema.index({ fileName: 1 });
fileResourceSchema.index({ category: 1 });
fileResourceSchema.index({ businessType: 1, businessId: 1 });
fileResourceSchema.index({ createAt: -1 });
fileResourceSchema.index({ status: 1 });

module.exports = mongoose.model("file_resource", fileResourceSchema);