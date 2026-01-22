var mongoose = require("mongoose");

//用户角色(role)

var roleSchema = new mongoose.Schema({
  name: { type: String }, //角色名称
  label: { type: String }, //标识
  remark: { type: String }, //备注
  menuList: [{ type: mongoose.Schema.ObjectId, ref: "menu" }], //菜单权限列表
  buttonList: [{ type: String }], //按钮权限列表
  createBy: { type: String }, // 创建人
  updateBy: { type: String }, // 更新人
  createAt: { type: Date, default: Date.now }, // 创建时间
  updateAt: { type: Date, default: Date.now }, // 更新时间
});

// 添加pre-save中间件，自动更新updateAt字段
roleSchema.pre('save', function(next) {
  // 只在文档被修改时更新updateAt字段
  if (this.isModified() && !this.isNew) {
    this.updateAt = new Date();
  }
  next();
});

// 添加pre-updateOne中间件，自动更新updateAt字段
roleSchema.pre(['updateOne', 'findOneAndUpdate'], function() {
  // 确保所有updateOne和findOneAndUpdate操作都包含updateAt
  if (this.getUpdate() && !this.getUpdate().$set?.updateAt) {
    if (!this.getUpdate().$set) {
      this.getUpdate().$set = {};
    }
    this.getUpdate().$set.updateAt = new Date();
  }
});

module.exports = mongoose.model("role", roleSchema);
