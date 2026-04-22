/**
 * 初始化第三方接口管理模块菜单数据
 * 运行方式：node scripts/seedThirdPartyApiMenus.js
 *
 * 注意：运行前请确保 dcMes_server 目录下的数据库配置正确
 */

const mongoose = require("mongoose");
const db = require("../db");

async function seed() {
  await new Promise((resolve) => {
    const conn = db();
    // 等待连接就绪
    if (mongoose.connection.readyState === 1) {
      resolve();
    } else {
      mongoose.connection.once("open", resolve);
    }
  });

  const Menu = require("../model/system/menu");

  // 检查是否已存在，避免重复插入
  const exists = await Menu.findOne({ path: "/thirdPartyApi", type: "目录" });
  if (exists) {
    console.log("✅ 第三方接口管理菜单已存在，无需重复插入。parentId:", exists._id.toString());
    const children = await Menu.find({ parentId: exists._id });
    console.log("已有子菜单:", children.map((c) => `${c.menuName} (${c.path})`).join(", "));
    mongoose.connection.close();
    return;
  }

  // 1. 插入父目录（必须显式设置 parentId: null，formatMenu2Tree 用 === null 严格匹配根节点）
  const parent = await Menu.create({
    menuName: "第三方接口管理",
    path: "/thirdPartyApi",
    type: "目录",
    visible: true,
    icon: "el-icon-connection",
    status: true,
    sortNum: 100,
    isCache: false,
    createBy: "system",
    parentId: null,
  });

  console.log("✅ 父目录已创建:", parent._id.toString());

  // 2. 插入子菜单
  const children = [
    {
      menuName: "接口配置",
      path: "/thirdPartyApi",
      component: "/thirdPartyApi/index",
      componentName: "ThirdPartyApiConfig",
      type: "菜单",
      visible: true,
      icon: "el-icon-document",
      sortNum: 1,
      isCache: true,
    },
    {
      menuName: "参数模板管理",
      path: "/thirdPartyApi/paramTemplate",
      component: "/thirdPartyApi/paramTemplate/index",
      componentName: "ParamTemplateManage",
      type: "菜单",
      visible: false, // 隐藏菜单（从接口列表跳转）
      icon: "el-icon-setting",
      sortNum: 2,
      isCache: false,
    },
    {
      menuName: "请求日志",
      path: "/thirdPartyApi/callLog",
      component: "/thirdPartyApi/callLog/index",
      componentName: "CallLogList",
      type: "菜单",
      visible: true,
      icon: "el-icon-tickets",
      sortNum: 3,
      isCache: true,
    },
    {
      menuName: "日志详情",
      path: "/thirdPartyApi/callLog/detail",
      component: "/thirdPartyApi/callLog/detail",
      componentName: "CallLogDetail",
      type: "菜单",
      visible: false, // 隐藏菜单（从日志列表跳转）
      icon: "el-icon-view",
      sortNum: 4,
      isCache: false,
    },
  ];

  for (const child of children) {
    const inserted = await Menu.create({
      ...child,
      parentId: parent._id,
      status: true,
      createBy: "system",
    });
    console.log(`✅ 子菜单已创建: ${inserted.menuName} (${inserted.path})`);
  }

  console.log("\n🎉 第三方接口管理模块菜单初始化完成！");
  console.log("请刷新浏览器，在菜单管理中为相关角色分配权限后即可访问。");
  mongoose.connection.close();
}

seed().catch((err) => {
  console.error("❌ 初始化失败:", err);
  mongoose.connection.close();
  process.exit(1);
});
