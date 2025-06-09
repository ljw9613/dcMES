#!/usr/bin/env node
/**
 * 批量产品条码强制完成和解绑条码恢复脚本
 * 
 * 功能说明：
 * 批量处理多个产品条码的强制完成和解绑条码恢复
 * 
 * 使用方法：
 * node batch_force_complete_product.js [条码1] [条码2] [条码3] ...
 * 或者从文件读取：
 * node batch_force_complete_product.js --file barcodes.txt
 * 
 * @author: AI Assistant
 * @date: 2024
 */

const path = require("path");
const fs = require("fs");

// 添加dcMes_server的node_modules到模块搜索路径
const serverPath = path.join(__dirname, "dcMes_server");
module.paths.unshift(path.join(serverPath, "node_modules"));

const mongoose = require("mongoose");

// 导入单个处理函数
const { forceCompleteProduct } = require("./force_complete_product");

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
 * 从文件读取条码列表
 * @param {string} filePath - 文件路径
 */
function readBarcodesFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const barcodes = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    return barcodes;
  } catch (error) {
    console.error(`❌ 读取文件失败: ${error.message}`);
    return [];
  }
}

/**
 * 批量处理产品条码
 * @param {Array} barcodes - 条码数组
 */
async function batchProcessBarcodes(barcodes) {
  console.log(`\n📦 开始批量处理 ${barcodes.length} 个产品条码...`);
  
  const results = {
    success: [],
    failed: [],
    total: barcodes.length
  };
  
  for (let i = 0; i < barcodes.length; i++) {
    const barcode = barcodes[i];
    console.log(`\n[${i + 1}/${barcodes.length}] 处理条码: ${barcode}`);
    
    try {
      const success = await forceCompleteProduct(barcode);
      if (success) {
        results.success.push(barcode);
        console.log(`✅ [${i + 1}/${barcodes.length}] 处理成功: ${barcode}`);
      } else {
        results.failed.push({ barcode, error: "处理失败" });
        console.log(`❌ [${i + 1}/${barcodes.length}] 处理失败: ${barcode}`);
      }
    } catch (error) {
      results.failed.push({ barcode, error: error.message });
      console.log(`❌ [${i + 1}/${barcodes.length}] 处理异常: ${barcode} - ${error.message}`);
    }
    
    // 每处理10个条码后暂停1秒，避免数据库压力过大
    if ((i + 1) % 10 === 0 && i + 1 < barcodes.length) {
      console.log("⏸️  暂停1秒，避免数据库压力...");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * 打印处理结果统计
 * @param {Object} results - 处理结果
 */
function printResults(results) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 批量处理结果统计");
  console.log("=".repeat(60));
  console.log(`总计处理: ${results.total} 个条码`);
  console.log(`成功处理: ${results.success.length} 个`);
  console.log(`失败处理: ${results.failed.length} 个`);
  console.log(`成功率: ${((results.success.length / results.total) * 100).toFixed(2)}%`);
  
  if (results.success.length > 0) {
    console.log("\n✅ 成功处理的条码:");
    results.success.forEach((barcode, index) => {
      console.log(`   ${index + 1}. ${barcode}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log("\n❌ 失败处理的条码:");
    results.failed.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.barcode} - ${item.error}`);
    });
  }
  
  console.log("=".repeat(60));
}

/**
 * 主函数
 */
async function main() {
  console.log("🚀 批量产品条码强制完成和解绑条码恢复脚本");
  console.log("=".repeat(60));
  
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("❌ 请提供产品条码或文件路径");
    console.log("使用方法:");
    console.log("  node batch_force_complete_product.js [条码1] [条码2] [条码3] ...");
    console.log("  node batch_force_complete_product.js --file barcodes.txt");
    console.log("");
    console.log("示例:");
    console.log("  node batch_force_complete_product.js ABC123 DEF456 GHI789");
    console.log("  node batch_force_complete_product.js --file ./barcodes.txt");
    console.log("");
    console.log("文件格式: 每行一个条码");
    process.exit(1);
  }
  
  let barcodes = [];
  
  // 检查是否从文件读取
  if (args[0] === '--file' && args[1]) {
    const filePath = args[1];
    console.log(`📂 从文件读取条码: ${filePath}`);
    barcodes = readBarcodesFromFile(filePath);
    
    if (barcodes.length === 0) {
      console.log("❌ 文件中没有有效的条码");
      process.exit(1);
    }
    
    console.log(`📋 从文件读取到 ${barcodes.length} 个条码`);
    
  } else {
    // 从命令行参数获取条码
    barcodes = args.filter(arg => arg.trim().length > 0);
    console.log(`📋 从命令行参数获取到 ${barcodes.length} 个条码`);
  }
  
  // 显示将要处理的条码
  console.log("\n📝 待处理的条码列表:");
  barcodes.forEach((barcode, index) => {
    console.log(`   ${index + 1}. ${barcode}`);
  });
  
  // 确认提示
  console.log("\n⚠️  即将开始批量处理，请确认:");
  console.log(`   - 共 ${barcodes.length} 个条码将被强制完成`);
  console.log(`   - 解绑记录将被恢复到对应工艺节点`);
  console.log(`   - 托盘条码数量将被更新`);
  
  try {
    // 连接数据库
    await connectDatabase();
    
    // 批量处理条码
    const results = await batchProcessBarcodes(barcodes);
    
    // 打印结果统计
    printResults(results);
    
    if (results.failed.length === 0) {
      console.log("🎉 所有条码处理成功！");
    } else {
      console.log("⚠️  部分条码处理失败，请检查上述错误信息");
      process.exit(1);
    }
    
  } catch (error) {
    console.error("❌ 批量处理过程中发生错误:", error.message);
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