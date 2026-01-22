#!/usr/bin/env node
/**
 * 查询工单已完成产品条码流程记录中未在托盘信息中的条码脚本
 * 
 * 功能说明：
 * 1. 根据输入的工单ID，查询该工单下所有已完成的产品条码流程记录
 * 2. 检查这些条码是否存在于托盘信息(MaterialPalletizing)的palletBarcodes中
 * 3. 输出未在托盘中的条码清单，便于后续处理
 * 
 * 使用方法：
 * node check_missing_barcodes_in_pallet.js [工单ID]
 * 
 * @author: AI Assistant
 * @date: 2024
 */

const path = require("path");

// 添加dcMes_server的node_modules到模块搜索路径
const serverPath = path.join(__dirname, "dcMes_server");
module.paths.unshift(path.join(serverPath, "node_modules"));

const mongoose = require("mongoose");

// 数据库连接配置 - 从dcMes_server/db.js复制
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
 * 查询工单已完成产品条码中未在托盘信息中的条码
 * @param {string} workOrderId - 工单ID
 */
async function checkMissingBarcodesInPallet(workOrderId) {
  try {
    console.log(`\n🔍 开始查询工单: ${workOrderId}`);
    
    // 1. 查询该工单下所有已完成的产品条码流程记录
    console.log(`📋 查询工单下已完成的产品条码流程记录...`);
    
    const completedFlows = await MaterialProcessFlow.find({
      productionPlanWorkOrderId: workOrderId,
      status: "COMPLETED"
    }).select('barcode materialCode materialName createAt endTime');
    
    if (completedFlows.length === 0) {
      console.log(`ℹ️  工单 ${workOrderId} 下未找到已完成的产品条码流程记录`);
      return [];
    }
    
    console.log(`📊 找到 ${completedFlows.length} 条已完成的产品条码流程记录:`);
    
    // 提取所有已完成的条码
    const completedBarcodes = completedFlows.map(flow => flow.barcode).filter(barcode => barcode);
    console.log(`🏷️  有效条码数量: ${completedBarcodes.length}`);
    
    if (completedBarcodes.length === 0) {
      console.log(`⚠️  未找到有效的产品条码`);
      return [];
    }
    
    // 2. 查询所有托盘信息中包含的条码
    console.log(`\n🗂️  查询托盘信息中的条码...`);
    
    const pallets = await MaterialPalletizing.find({
      "palletBarcodes.barcode": { $in: completedBarcodes }
    }).select('palletCode palletBarcodes.barcode palletBarcodes.scanTime status');
    
    // 提取托盘中存在的条码
    const palletBarcodes = new Set();
    const barcodeTopalletMap = new Map(); // 条码 -> 托盘编号的映射
    
    pallets.forEach(pallet => {
      pallet.palletBarcodes.forEach(item => {
        if (completedBarcodes.includes(item.barcode)) {
          palletBarcodes.add(item.barcode);
          barcodeTopalletMap.set(item.barcode, {
            palletCode: pallet.palletCode,
            scanTime: item.scanTime,
            palletStatus: pallet.status
          });
        }
      });
    });
    
    console.log(`📦 托盘中找到 ${palletBarcodes.size} 个条码`);
    
    // 3. 找出未在托盘中的条码
    const missingBarcodes = [];
    const existingBarcodes = [];
    
    completedFlows.forEach(flow => {
      if (!flow.barcode) {
        return; // 跳过无条码的记录
      }
      
      if (palletBarcodes.has(flow.barcode)) {
        const palletInfo = barcodeTopalletMap.get(flow.barcode);
        existingBarcodes.push({
          barcode: flow.barcode,
          materialCode: flow.materialCode,
          materialName: flow.materialName,
          completedTime: flow.endTime,
          palletCode: palletInfo.palletCode,
          palletScanTime: palletInfo.scanTime,
          palletStatus: palletInfo.palletStatus
        });
      } else {
        missingBarcodes.push({
          barcode: flow.barcode,
          materialCode: flow.materialCode,
          materialName: flow.materialName,
          completedTime: flow.endTime,
          createTime: flow.createAt
        });
      }
    });
    
    // 4. 输出结果
    console.log(`\n📈 查询结果统计:`);
    console.log(`   已完成产品条码总数: ${completedBarcodes.length}`);
    console.log(`   已在托盘中的条码: ${existingBarcodes.length}`);
    console.log(`   未在托盘中的条码: ${missingBarcodes.length}`);
    
    if (existingBarcodes.length > 0) {
      console.log(`\n✅ 已在托盘中的条码列表 (${existingBarcodes.length}条):`);
      console.log(`${'序号'.padEnd(4)} ${'条码'.padEnd(20)} ${'物料编码'.padEnd(15)} ${'物料名称'.padEnd(25)} ${'完成时间'.padEnd(20)} ${'托盘编号'.padEnd(15)} ${'托盘状态'.padEnd(10)}`);
      console.log(`${'-'.repeat(110)}`);
      
      existingBarcodes.forEach((item, index) => {
        const completedTime = item.completedTime ? new Date(item.completedTime).toLocaleString('zh-CN') : '未知';
        const materialName = (item.materialName || '').substring(0, 20);
        console.log(`${String(index + 1).padEnd(4)} ${item.barcode.padEnd(20)} ${item.materialCode.padEnd(15)} ${materialName.padEnd(25)} ${completedTime.padEnd(20)} ${item.palletCode.padEnd(15)} ${item.palletStatus.padEnd(10)}`);
      });
    }
    
    if (missingBarcodes.length > 0) {
      console.log(`\n❌ 未在托盘中的条码列表 (${missingBarcodes.length}条):`);
      console.log(`${'序号'.padEnd(4)} ${'条码'.padEnd(20)} ${'物料编码'.padEnd(15)} ${'物料名称'.padEnd(25)} ${'完成时间'.padEnd(20)} ${'创建时间'.padEnd(20)}`);
      console.log(`${'-'.repeat(105)}`);
      
      missingBarcodes.forEach((item, index) => {
        const completedTime = item.completedTime ? new Date(item.completedTime).toLocaleString('zh-CN') : '未知';
        const createTime = item.createTime ? new Date(item.createTime).toLocaleString('zh-CN') : '未知';
        const materialName = (item.materialName || '').substring(0, 20);
        console.log(`${String(index + 1).padEnd(4)} ${item.barcode.padEnd(20)} ${item.materialCode.padEnd(15)} ${materialName.padEnd(25)} ${completedTime.padEnd(20)} ${createTime.padEnd(20)}`);
      });
      
      console.log(`\n⚠️  建议检查以上 ${missingBarcodes.length} 个条码的托盘组托情况`);
    } else {
      console.log(`\n🎉 所有已完成的产品条码都已在托盘中！`);
    }
    
    return {
      totalCompleted: completedBarcodes.length,
      inPallet: existingBarcodes,
      missing: missingBarcodes
    };
    
  } catch (error) {
    console.error(`❌ 查询工单 ${workOrderId} 时发生错误:`, error.message);
    return null;
  }
}

/**
 * 检查特定条码是否在任何托盘中
 * @param {string} barcode - 要检查的条码
 */
async function checkBarcodeInPallet(barcode) {
  try {
    console.log(`\n🔍 检查条码 ${barcode} 在托盘中的情况...`);
    
    const pallets = await MaterialPalletizing.find({
      "palletBarcodes.barcode": barcode
    }).select('palletCode palletBarcodes status totalQuantity barcodeCount');
    
    if (pallets.length === 0) {
      console.log(`❌ 条码 ${barcode} 未在任何托盘中找到`);
      return [];
    }
    
    console.log(`📦 条码 ${barcode} 在以下托盘中找到:`);
    
    const results = [];
    pallets.forEach((pallet, index) => {
      const barcodeItems = pallet.palletBarcodes.filter(item => item.barcode === barcode);
      
      barcodeItems.forEach(item => {
        const result = {
          palletCode: pallet.palletCode,
          palletStatus: pallet.status,
          scanTime: item.scanTime,
          totalQuantity: pallet.totalQuantity,
          barcodeCount: pallet.barcodeCount
        };
        
        results.push(result);
        
        console.log(`   ${index + 1}. 托盘: ${pallet.palletCode}`);
        console.log(`      状态: ${pallet.status}`);
        console.log(`      扫码时间: ${item.scanTime ? new Date(item.scanTime).toLocaleString('zh-CN') : '未知'}`);
        console.log(`      容量: ${pallet.barcodeCount}/${pallet.totalQuantity}`);
      });
    });
    
    return results;
    
  } catch (error) {
    console.error(`❌ 检查条码 ${barcode} 时发生错误:`, error.message);
    return [];
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🔍 工单已完成产品条码托盘信息查询脚本");
  console.log("=".repeat(50));
  
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("❌ 请提供工单ID或产品条码");
    console.log("使用方法: ");
    console.log("  查询工单: node check_missing_barcodes_in_pallet.js [工单ID]");
    console.log("  查询条码: node check_missing_barcodes_in_pallet.js --barcode [产品条码]");
    console.log("示例: ");
    console.log("  node check_missing_barcodes_in_pallet.js 507f1f77bcf86cd799439011");
    console.log("  node check_missing_barcodes_in_pallet.js --barcode ABC123456789");
    process.exit(1);
  }
  
  const isCheckBarcode = args[0] === '--barcode';
  const input = isCheckBarcode ? args[1] : args[0];
  
  if (!input) {
    console.log("❌ 请提供有效的工单ID或产品条码");
    process.exit(1);
  }
  
  try {
    // 连接数据库
    await connectDatabase();
    
    let success = false;
    
    if (isCheckBarcode) {
      // 检查特定条码
      const results = await checkBarcodeInPallet(input);
      success = results !== null;
    } else {
      // 查询工单
      const results = await checkMissingBarcodesInPallet(input);
      success = results !== null;
    }
    
    if (success) {
      console.log("\n🎉 查询完成！");
    } else {
      console.log("\n❌ 查询失败！");
      process.exit(1);
    }
    
  } catch (error) {
    console.error("❌ 脚本执行过程中发生错误:", error.message);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await closeDatabase();
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  checkMissingBarcodesInPallet,
  checkBarcodeInPallet
}; 