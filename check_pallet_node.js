#!/usr/bin/env node
/**
 * 检查托盘工序节点的条码设置脚本
 */

const path = require("path");
const serverPath = path.join(__dirname, "dcMes_server");
module.paths.unshift(path.join(serverPath, "node_modules"));

const mongoose = require("mongoose");

// 数据库连接配置
const mongodbUrl = "mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes";
const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 120000,
  connectTimeoutMS: 30000,
  maxPoolSize: 50,
  minPoolSize: 10,
  maxConnecting: 20,
  retryWrites: true,
  family: 4,
  maxIdleTimeMS: 60000,
  heartbeatFrequencyMS: 10000,
  waitQueueTimeoutMS: 10000,
  writeConcern: { w: 1 },
  readPreference: 'primaryPreferred'
};

// 导入数据模型
const MaterialProcessFlow = require("./dcMes_server/model/project/materialProcessFlow");
const MaterialPalletizing = require("./dcMes_server/model/project/materialPalletizing");

/**
 * 连接数据库
 */
async function connectDatabase() {
  try {
    await mongoose.connect(mongodbUrl, connectOptions);
    console.log("✅ 数据库连接成功");
  } catch (error) {
    console.error("❌ 数据库连接失败:", error.message);
    process.exit(1);
  }
}

/**
 * 关闭数据库连接
 */
async function closeDatabase() {
  try {
    await mongoose.connection.close();
    console.log("✅ 数据库连接已关闭");
  } catch (error) {
    console.error("❌ 关闭数据库连接失败:", error.message);
  }
}

/**
 * 检查托盘工序节点
 */
async function checkPalletNodes(barcode) {
  try {
    console.log(`🔍 检查条码 ${barcode} 的托盘工序节点...`);
    
    const flowRecord = await MaterialProcessFlow.findOne({ barcode: barcode });
    
    if (!flowRecord) {
      console.log(`❌ 未找到条码 ${barcode} 的工艺流程记录`);
      return false;
    }
    
    // 查找所有有batchDocNumber的工艺节点
    const palletNodes = flowRecord.processNodes.filter(node => 
      node.batchDocNumber && node.batchDocNumber.trim() !== ""
    );
    
    if (palletNodes.length === 0) {
      console.log(`ℹ️  未找到托盘工序节点`);
      return true;
    }
    
    console.log(`\n📦 找到 ${palletNodes.length} 个托盘工序节点:`);
    
    for (let i = 0; i < palletNodes.length; i++) {
      const node = palletNodes[i];
      console.log(`\n${i + 1}. 托盘工序节点:`);
      console.log(`   工序名称: ${node.processName || '未知工序'}`);
      console.log(`   节点类型: ${node.nodeType}`);
      console.log(`   层级: ${node.level}`);
      console.log(`   托盘编号: ${node.batchDocNumber}`);
      console.log(`   节点条码: ${node.barcode || '空'}`);
      console.log(`   扫描时间: ${node.scanTime || '无'}`);
      
      // 检查是否错误设置了主产品条码
      if (node.barcode === barcode) {
        if (node.nodeType === "PROCESS_STEP") {
          console.log(`   ❌ 错误：PROCESS_STEP节点不应该设置主产品条码！`);
        } else {
          console.log(`   ⚠️  注意：${node.nodeType}节点设置了主产品条码`);
        }
      } else if (node.barcode && node.barcode !== "") {
        console.log(`   ℹ️  节点设置了其他条码: ${node.barcode}`);
      } else {
        console.log(`   ✅ 节点条码为空（正确）`);
      }
      
      // 检查对应的托盘记录
      const pallet = await MaterialPalletizing.findOne({ 
        palletCode: node.batchDocNumber 
      });
      
      if (pallet) {
        console.log(`   📊 托盘记录:`);
        console.log(`      状态: ${pallet.status}`);
        console.log(`      条码数量: ${pallet.barcodeCount}/${pallet.totalQuantity}`);
        
        // 检查产品条码是否在托盘中
        const existingBarcode = pallet.palletBarcodes.find(item => 
          item.barcode === barcode
        );
        
        if (existingBarcode) {
          console.log(`      ✅ 产品条码 ${barcode} 已正确存在于托盘中`);
          console.log(`      扫描时间: ${existingBarcode.scanTime}`);
        } else {
          console.log(`      ❌ 产品条码 ${barcode} 不在托盘中`);
        }
      } else {
        console.log(`   ❌ 未找到对应的托盘记录`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ 检查托盘工序节点时发生错误:`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🗂️  托盘工序节点检查脚本");
  console.log("=".repeat(50));
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("❌ 请提供产品条码");
    console.log("使用方法: node check_pallet_node.js [产品条码]");
    process.exit(1);
  }
  
  const barcode = args[0];
  
  try {
    await connectDatabase();
    await checkPalletNodes(barcode);
  } catch (error) {
    console.error("❌ 脚本执行过程中发生错误:", error.message);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = { checkPalletNodes }; 