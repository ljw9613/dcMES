#!/usr/bin/env node
/**
 * 检查条码修复结果脚本
 * 验证主产品条码是否正确设置在level为0的MATERIAL节点上
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
 * 检查条码设置情况
 */
async function checkBarcodeSettings(barcode) {
  try {
    console.log(`🔍 检查条码 ${barcode} 的设置情况...`);
    
    const flowRecord = await MaterialProcessFlow.findOne({ barcode: barcode });
    
    if (!flowRecord) {
      console.log(`❌ 未找到条码 ${barcode} 的工艺流程记录`);
      return false;
    }
    
    console.log(`\n📋 工艺流程信息:`);
    console.log(`   ID: ${flowRecord._id}`);
    console.log(`   状态: ${flowRecord.status} (${flowRecord.progress}%)`);
    console.log(`   总节点数: ${flowRecord.processNodes.length}`);
    
    // 检查根节点（level=0, nodeType=MATERIAL）
    const rootMaterialNode = flowRecord.processNodes.find(node => 
      node.level === 0 && node.nodeType === "MATERIAL"
    );
    
    if (rootMaterialNode) {
      console.log(`\n✅ 根物料节点 (level=0, MATERIAL):`);
      console.log(`   节点ID: ${rootMaterialNode.nodeId}`);
      console.log(`   物料名称: ${rootMaterialNode.materialName}`);
      console.log(`   物料编码: ${rootMaterialNode.materialCode}`);
      console.log(`   条码: ${rootMaterialNode.barcode || '空'}`);
      console.log(`   扫描时间: ${rootMaterialNode.scanTime || '无'}`);
      
      if (rootMaterialNode.barcode === barcode) {
        console.log(`   🎉 主产品条码设置正确！`);
      } else {
        console.log(`   ⚠️  主产品条码未正确设置`);
      }
    } else {
      console.log(`\n❌ 未找到根物料节点`);
    }
    
    // 检查是否有PROCESS_STEP节点错误地设置了主产品条码
    console.log(`\n🔍 检查PROCESS_STEP节点的条码设置:`);
    let wrongNodes = 0;
    
    flowRecord.processNodes.forEach((node, index) => {
      if (node.nodeType === "PROCESS_STEP" && node.barcode === barcode) {
        console.log(`   ❌ 节点 ${index + 1}: ${node.processName || '未知工序'} 错误地设置了主产品条码`);
        wrongNodes++;
      }
    });
    
    if (wrongNodes === 0) {
      console.log(`   ✅ 没有PROCESS_STEP节点错误设置主产品条码`);
    } else {
      console.log(`   ⚠️  发现 ${wrongNodes} 个PROCESS_STEP节点错误设置了主产品条码`);
    }
    
    // 显示所有有条码的节点
    console.log(`\n📋 所有有条码的节点:`);
    let barcodeNodeCount = 0;
    
    flowRecord.processNodes.forEach((node, index) => {
      if (node.barcode && node.barcode.trim() !== "") {
        barcodeNodeCount++;
        console.log(`   ${barcodeNodeCount}. [${node.nodeType}] ${node.processName || node.materialName}`);
        console.log(`      Level: ${node.level}`);
        console.log(`      条码: ${node.barcode}`);
        console.log(`      物料编码: ${node.materialCode || '无'}`);
        console.log(``);
      }
    });
    
    console.log(`📊 统计: 共有 ${barcodeNodeCount} 个节点设置了条码`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ 检查条码设置时发生错误:`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🔍 条码设置检查脚本");
  console.log("=".repeat(50));
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("❌ 请提供产品条码");
    console.log("使用方法: node check_barcode_fix.js [产品条码]");
    process.exit(1);
  }
  
  const barcode = args[0];
  
  try {
    await connectDatabase();
    await checkBarcodeSettings(barcode);
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

module.exports = { checkBarcodeSettings }; 