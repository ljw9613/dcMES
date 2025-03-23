const mongoose = require("mongoose");

//菜单(menu)

const MenuSchema = new mongoose.Schema({
    menuName: {type: String},//名称（目录名称、菜单名称、权限名称）
    parentId: {type: mongoose.Schema.ObjectId, ref: "menu"}, //父级id
    sortNum: {type: Number, default: 0},//顺序
    path: {type: String},//路由路径
    component: {type: String},//文件路径
    componentName: {type: String},//组件名称，用于keep-alive缓存匹配
    query: {type: String},//访问路由的默认传递参数
    type: {type: String},//类型 目录 菜单 权限
    visible: {type: Boolean, default: true},//是否可见 0显示 1隐藏
    isCache: {type: Boolean, default: true},//是否缓存 true缓存 false不缓存
    perms: {type: String},//权限标签
    icon: {type: String},//图标
    status: {type: Boolean, default: true},//状态 1正常 0禁用
    createBy: {type: String}, // 创建人
    updateBy: {type: String}, // 更新人
    createAt: {type: Date, default: Date.now}, // 创建时间
    updateAt: {type: Date, default: Date.now}, // 更新时间
    remark: {type: String},//备注
});

module.exports = mongoose.model("menu", MenuSchema);
