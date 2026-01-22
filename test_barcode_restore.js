#!/usr/bin/env node
/**
 * 测试脚本：验证解绑条码恢复的精确匹配逻辑
 * 
 * 使用方法：
 * node test_barcode_restore.js [产品条码]
 * 
 * @author: AI Assistant
 * @date: 2024
 */

const path = require("path");

// 添加dcMes_server的node_modules到模块搜索路径
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
const UnbindRecord = require("./dcMes_server/model/project/unbindRecord");

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
 * 分析解绑条码恢复逻辑
 * @param {string} barcode - 产品条码
 */
async function analyzeRestoreLogic(barcode) {
  try {
    console.log(`\n🔍 分析产品条码: ${barcode}`);
    
    // 1. 查找产品的工艺流程记录
    const flowRecord = await MaterialProcessFlow.findOne({ barcode: barcode });
    
    if (!flowRecord) {
      console.log(`❌ 未找到条码 ${barcode} 的工艺流程记录`);
      return false;
    }
    
    console.log(`📋 找到工艺流程记录: ${flowRecord._id}`);
    console.log(`   物料编码: ${flowRecord.materialCode}`);
    console.log(`   物料名称: ${flowRecord.materialName}`);
    
    // 2. 查询解绑记录
    console.log(`\n🔍 查询解绑记录...`);
    const unbindRecords = await UnbindRecord.find({
      flowRecordId: flowRecord._id,
      mainBarcode: barcode
    }).sort({ operateTime: -1 });
    
    if (unbindRecords.length === 0) {
      console.log(`ℹ️  未找到解绑记录`);
      return true;
    }
    
    console.log(`📝 找到 ${unbindRecords.length} 条解绑记录`);
    
    // 3. 分析工艺节点
    console.log(`\n📊 工艺节点分析:`);
    const materialNodes = flowRecord.processNodes.filter(node => node.nodeType === "MATERIAL");
    const processNodes = flowRecord.processNodes.filter(node => node.nodeType === "PROCESS_STEP");
    
    console.log(`   物料节点数量: ${materialNodes.length}`);
    console.log(`   工序节点数量: ${processNodes.length}`);
    
    // 4. 分析解绑记录与工艺节点的匹配关系
    console.log(`\n🔧 解绑条码匹配分析:`);
    
    for (let i = 0; i < unbindRecords.length; i++) {
      const record = unbindRecords[i];
      console.log(`\n   解绑记录 ${i + 1}:`);
      console.log(`     工序: ${record.processName}`);
      console.log(`     工序ID: ${record.processStepId}`);
      console.log(`     解绑时间: ${record.operateTime}`);
      console.log(`     解绑原因: ${record.reason}`);
      
      if (record.unbindMaterials && record.unbindMaterials.length > 0) {
        console.log(`     解绑物料 (${record.unbindMaterials.length}个):`);
        
        for (const material of record.unbindMaterials) {
          console.log(`       - 物料编码: ${material.materialCode}`);
          console.log(`         物料名称: ${material.materialName}`);
          console.log(`         原始条码: ${material.originalBarcode}`);
          
          // 查找匹配的工艺节点
          console.log(`         节点匹配分析:`);
          
          // 方式1：materialCode + processStepId 精确匹配
          const exactMatch = flowRecord.processNodes.find(node => 
            node.materialCode === material.materialCode &&
            node.processStepId && 
            node.processStepId.toString() === record.processStepId.toString()
          );
          
          if (exactMatch) {
            console.log(`           ✅ 精确匹配: ${exactMatch.nodeId}`);
            console.log(`              当前条码: ${exactMatch.barcode || '空'}`);
          } else {
            console.log(`           ❌ 无精确匹配`);
            
            // 方式2：只根据materialCode匹配
            const materialMatch = flowRecord.processNodes.find(node => 
              node.materialCode === material.materialCode
            );
            
            if (materialMatch) {
              console.log(`           ⚠️  物料匹配: ${materialMatch.nodeId}`);
              console.log(`              当前条码: ${materialMatch.barcode || '空'}`);
              console.log(`              工序ID: ${materialMatch.processStepId || '无'}`);
            } else {
              console.log(`           ❌ 无物料匹配`);
              
              // 方式3：根据processStepId查找空的物料节点
              const emptyNodes = flowRecord.processNodes.filter(node => 
                node.processStepId && 
                node.processStepId.toString() === record.processStepId.toString() &&
                node.nodeType === "MATERIAL" &&
                (!node.barcode || node.barcode === "")
              );
              
              if (emptyNodes.length > 0) {
                console.log(`           🔍 工序下空节点: ${emptyNodes.length}个`);
                emptyNodes.forEach((node, idx) => {
                  console.log(`              ${idx + 1}. ${node.materialCode || '无编码'} (${node.nodeId})`);
                });
              } else {
                console.log(`           ❌ 无可用空节点`);
              }
            }
          }
        }
      } else {
        console.log(`     ℹ️  该解绑记录无物料条码`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ 分析过程中发生错误:`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🔍 解绑条码恢复逻辑分析器");
  console.log("=".repeat(50));
  
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("❌ 请提供产品条码");
    console.log("使用方法: node test_barcode_restore.js [产品条码]");
    console.log("示例: node test_barcode_restore.js WA2002DNJ0017");
    process.exit(1);
  }
  
  const barcode = args[0];
  
  try {
    // 连接数据库
    await connectDatabase();
    
    // 分析恢复逻辑
    await analyzeRestoreLogic(barcode);
    
  } catch (error) {
    console.error("❌ 分析过程中发生错误:", error.message);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await closeDatabase();
  }
}

// 执行主函数
if (require.main === module) {
  main();
} 