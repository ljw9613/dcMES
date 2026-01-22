/*
 * @name: 菜单国际化键值填充脚本
 * @content: 为现有菜单数据填充i18nKey字段，支持国际化功能
 * @Author: ljw
 * @Email: 1798245303@qq.com
 * @Date: 2025-01-23
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库 - 请根据实际情况修改连接字符串
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dcmes';
let MONGODB_URI =
"mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes";

// 菜单数据映射 - 基于现有的menudata.txt文件内容
const menuI18nMapping = {
  // 系统管理目录
  '系统管理': 'menu.systemManagement.title',
  
  // 系统管理子菜单
  '用户列表': 'menu.systemManagement.userList',
  '菜单管理': 'menu.systemManagement.menuManagement', 
  '角色管理': 'menu.systemManagement.roleManagement',
  '字典管理': 'menu.systemManagement.dictionaryManagement',
  '字典数据': 'menu.systemManagement.dictionaryData',
  '日志管理': 'menu.systemManagement.logManagement',

  // 生产管理目录
  '生产管理': 'menu.productionManagement.title',
  
  // 生产管理子菜单
  '生产订单': 'menu.productionManagement.productionOrder',
  '生产计划': 'menu.productionManagement.productionPlan',
  '生产产线': 'menu.productionManagement.productionLine',
  '生产工艺': 'menu.productionManagement.productionCraft',
  '生产条码': 'menu.productionManagement.productionBarcode',

  // 产线管理目录
  '产线管理': 'menu.lineManagement.title',
  
  // 产线管理子菜单
  '产线扫码': 'menu.lineManagement.scanBarCode',
  '打包托盘': 'menu.lineManagement.scanBarCodeBatch',
  '产品维修': 'menu.lineManagement.productRepair',
  '扫码转换': 'menu.lineManagement.scanBarCodeConver',
  '扫码维修': 'menu.lineManagement.scanBarCodeRepair',
  '产线校验': 'menu.lineManagement.scanBarCodeCheck',
  '自定义扫码': 'menu.lineManagement.customScanCheck',
  '产线大屏': 'menu.lineManagement.scBigView',
  '托盘校验': 'menu.lineManagement.palletBarcodeVerification',
  '简单扫码': 'menu.lineManagement.scanBarCodeSimple',
  '托盘组装': 'menu.lineManagement.palletAssembly',
  '打包装箱': 'menu.lineManagement.scanBarCodePack',
  '打包托盘（包含子物料）': 'menu.lineManagement.scanBarCodeBatchNew',

  // 金蝶云数据目录
  '金蝶云数据': 'menu.kingdeeData.title',
  
  // 金蝶云数据子菜单
  '物料信息': 'menu.kingdeeData.materialInfo',
  '销售订单': 'menu.kingdeeData.saleOrder',
  '仓库信息': 'menu.kingdeeData.stockInfo',
  '采购订单': 'menu.kingdeeData.purchaseOrder',
  '生产领料': 'menu.kingdeeData.pickMaterial',
  '发货通知单': 'menu.kingdeeData.deliveryNotice',
  '生产入库单': 'menu.kingdeeData.productionInStock',
  '采购申请单': 'menu.kingdeeData.requisitionBill',
  '销售出库单': 'menu.kingdeeData.outStock',

  // 设备管理目录
  '设备管理': 'menu.equipmentManagement.title',
  
  // 设备管理子菜单
  '设备信息': 'menu.equipmentManagement.equipmentInfo',
  '检测数据': 'menu.equipmentManagement.detectionData',

  // 仓库管理目录
  '仓库管理': 'menu.warehouseManagement.title',
  
  // 仓库管理子菜单
  '托盘单据': 'menu.warehouseManagement.materialPalletizing',
  '生产入库单': 'menu.warehouseManagement.warehouseEntry',
  '生产出库单': 'menu.warehouseManagement.warehouseOntry',

  // 产品追溯目录
  '产品追溯': 'menu.productTraceability.title',
  
  // 产品追溯子菜单
  '条码记录': 'menu.productTraceability.materialProcessFlow',
  '成品追溯': 'menu.productTraceability.productTrace',
  '装箱条码': 'menu.productTraceability.packBarcode',

  // 基础设置目录
  '基础设置': 'menu.basicSettings.title',
  
  // 基础设置子菜单
  '打印模板': 'menu.basicSettings.printTemplate',
  '条码匹配规则': 'menu.basicSettings.barcodeRule',
  '条码生成规则': 'menu.basicSettings.barcodeSegmentRule',

  // 品质成品抽检目录
  '品质成品抽检': 'menu.qualityInspection.title',
  
  // 品质成品抽检子菜单
  '条码抽检': 'menu.qualityInspection.samplingInspectionFlow',
  'UDI抽检': 'menu.qualityInspection.udiSamplingInspectionFlow',

  // 客户条码目录
  '客户条码': 'menu.customerBarcode.title',
  
  // 客户条码子菜单
  'SN-SFTP条码列表': 'menu.customerBarcode.udiDataManagement',

  // 其他通用菜单
  '通知列表': 'menu.common.noticeList',
  '招聘管理': 'menu.common.recruitmentManagement',
  '留言管理': 'menu.common.messageManagement',
  '荣誉管理': 'menu.common.honorManagement',
  '素材库管理': 'menu.common.materialLibraryManagement',
  '产品分类管理': 'menu.common.productCategoryManagement'
};

// 连接数据库
async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// 获取菜单模型
const Menu = mongoose.model('menu', new mongoose.Schema({
  menuName: String,
  i18nKey: String,
  parentId: mongoose.Schema.ObjectId,
  sortNum: Number,
  path: String,
  component: String,
  componentName: String,
  query: String,
  type: String,
  visible: Boolean,
  isCache: Boolean,
  perms: String,
  icon: String,
  status: Boolean,
  createBy: String,
  updateBy: String,
  createAt: Date,
  updateAt: Date,
  remark: String
}));

// 填充国际化键值
async function fillI18nKeys() {
  try {
    console.log('🚀 开始填充菜单国际化键值...');
    
    // 获取所有菜单
    const menus = await Menu.find({});
    console.log(`📊 找到 ${menus.length} 个菜单项`);
    
    let updateCount = 0;
    let skipCount = 0;
    
    for (const menu of menus) {
      // 如果已经有i18nKey，跳过
      if (menu.i18nKey) {
        skipCount++;
        continue;
      }
      
      // 根据菜单名称查找对应的国际化键值
      const i18nKey = menuI18nMapping[menu.menuName];
      
      if (i18nKey) {
        // 更新菜单的i18nKey字段
        await Menu.updateOne(
          { _id: menu._id },
          { 
            $set: { 
              i18nKey: i18nKey,
              updateAt: new Date()
            }
          }
        );
        
        console.log(`✅ 更新菜单: ${menu.menuName} -> ${i18nKey}`);
        updateCount++;
      } else {
        // 如果没有找到映射，生成一个默认的键值
        const defaultKey = `menu.${menu.type === '目录' ? 'directory' : 'page'}.${menu.menuName.replace(/\s+/g, '')}`;
        
        await Menu.updateOne(
          { _id: menu._id },
          { 
            $set: { 
              i18nKey: defaultKey,
              updateAt: new Date()
            }
          }
        );
        
        console.log(`⚠️  生成默认键值: ${menu.menuName} -> ${defaultKey}`);
        updateCount++;
      }
    }
    
    console.log('\n📈 填充结果统计:');
    console.log(`✅ 更新数量: ${updateCount}`);
    console.log(`⏭️  跳过数量: ${skipCount}`);
    console.log(`📊 总计数量: ${menus.length}`);
    
  } catch (error) {
    console.error('❌ 填充过程中发生错误:', error);
  }
}

// 验证填充结果
async function verifyResults() {
  try {
    console.log('\n🔍 验证填充结果...');
    
    const totalMenus = await Menu.countDocuments({});
    const menusWithI18n = await Menu.countDocuments({ i18nKey: { $exists: true, $ne: null } });
    const menusWithoutI18n = await Menu.countDocuments({ $or: [{ i18nKey: { $exists: false } }, { i18nKey: null }] });
    
    console.log(`📊 总菜单数: ${totalMenus}`);
    console.log(`✅ 已有i18nKey: ${menusWithI18n}`);
    console.log(`❌ 缺少i18nKey: ${menusWithoutI18n}`);
    
    if (menusWithoutI18n > 0) {
      console.log('\n⚠️  以下菜单缺少i18nKey:');
      const missingMenus = await Menu.find({ $or: [{ i18nKey: { $exists: false } }, { i18nKey: null }] }, 'menuName type');
      missingMenus.forEach(menu => {
        console.log(`   - ${menu.menuName} (${menu.type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
  }
}

// 主函数
async function main() {
  console.log('🌟 菜单国际化键值填充脚本');
  console.log('=====================================\n');
  
  await connectDatabase();
  
  await fillI18nKeys();
  await verifyResults();
  
  console.log('\n🎉 脚本执行完成!');
  process.exit(0);
}

// 执行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  fillI18nKeys,
  verifyResults,
  menuI18nMapping
}; 