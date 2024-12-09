/*
 * @name: **列表
 * @content:
 * @Author: joyce
 * @Date: 2020-09-09 10:44:39
 */
var mongoose = require("mongoose");
//用户登陆表(user_login)

var user_loginSchema = new mongoose.Schema({
    openId: { type: String },//微信openId
    encryptedId: { type: String }, // 加密ID用于扫码登录
    qrCode: { type: String }, // 存储二维码的 base64 字符串
    userName: { type: String },//用户账号
    password: { type: String },//用户密码
    nickName: { type: String },//用户名称
    phone: { type: String },//联系方式
    department: { type: String },//用户部门
    position: { type: String },//用户职位
    serveId: { type: mongoose.Schema.ObjectId, ref: "serve" },//服务方Id
    avatar: { type: String },//用户头像
    role: { type: mongoose.Schema.ObjectId, ref: "role" },//角色Id
    status: { type: Boolean, default: true },//账号状态
    createBy: { type: String }, // 创建人
    updateBy: { type: String }, // 更新人
    createAt: { type: Date, default: Date.now }, // 创建时间
    updateAt: { type: Date, default: Date.now }, // 更新时间
});
module.exports = mongoose.model("user_login", user_loginSchema);
