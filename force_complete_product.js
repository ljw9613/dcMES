#!/usr/bin/env node
/**
 * 产品条码强制完成和解绑条码恢复脚本
 * 
 * 功能说明：
 * 1. 根据输入的产品条码，强制完成产品的工艺流程进度
 * 2. 查询该条码的解绑记录，恢复解绑的条码到对应的工艺节点
 * 3. 如果涉及托盘工序，将条码恢复到托盘的palletBarcodes中并增加barcodeCount
 * 
 * 使用方法：
 * node force_complete_product.js [产品条码]
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
const UnbindRecord = require("./dcMes_server/model/project/unbindRecord");
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
 * 清理错误的条码数据
 * @param {Object} flowRecord - 工艺流程记录
 * @param {Array} unbindRecords - 解绑记录数组
 */
async function cleanupMismatchedBarcodes(flowRecord, unbindRecords) {
  try {
    console.log(`\n🧹 检查并清理错误的条码数据...`);
    
    let updated = false;
    
    // 收集所有解绑记录中的条码信息
    const unbindBarcodeMap = new Map(); // 条码 -> 正确的materialCode
    
    for (const record of unbindRecords) {
      if (record.unbindMaterials && record.unbindMaterials.length > 0) {
        for (const material of record.unbindMaterials) {
          if (material.originalBarcode && material.materialCode) {
            unbindBarcodeMap.set(material.originalBarcode, material.materialCode);
          }
        }
      }
    }
    
    if (unbindBarcodeMap.size === 0) {
      console.log(`ℹ️  无需清理的条码数据`);
      return;
    }
    
    console.log(`📋 需要检查的条码: ${unbindBarcodeMap.size}个`);
    
    // 检查所有工艺节点
    for (const node of flowRecord.processNodes) {
      if (node.barcode && unbindBarcodeMap.has(node.barcode)) {
        const correctMaterialCode = unbindBarcodeMap.get(node.barcode);
        
        // 检查条码是否在错误的节点上
        if (!node.materialCode || node.materialCode !== correctMaterialCode) {
          console.log(`🔍 发现错误条码: ${node.barcode}`);
          console.log(`   当前节点: ${node.materialCode || '无materialCode'} (${node.nodeId})`);
          console.log(`   应该在节点: ${correctMaterialCode}`);
          
          // 查找正确的目标节点
          const correctNode = flowRecord.processNodes.find(n => 
            n.materialCode === correctMaterialCode &&
            (!n.barcode || n.barcode === "" || n.barcode === node.barcode)
          );
          
          if (correctNode && correctNode.nodeId !== node.nodeId) {
            // 移动条码到正确的节点
            correctNode.barcode = node.barcode;
            correctNode.scanTime = node.scanTime || new Date();
            
            // 清空错误节点的条码
            node.barcode = "";
            node.scanTime = null;
            
            updated = true;
            console.log(`   ✅ 已移动条码到正确节点: ${correctMaterialCode}`);
          } else if (!correctNode) {
            console.log(`   ⚠️  未找到正确的目标节点: ${correctMaterialCode}`);
          } else {
            console.log(`   ℹ️  条码已在正确位置`);
          }
        }
      }
    }
    
    // 保存更新
    if (updated) {
      flowRecord.updateAt = new Date();
      await flowRecord.save();
      console.log(`✅ 错误条码清理完成，已保存更新`);
    } else {
      console.log(`ℹ️  未发现需要清理的错误条码`);
    }
    
  } catch (error) {
    console.error(`❌ 清理错误条码时发生错误:`, error.message);
  }
}

/**
 * 强制完成产品条码的工艺流程进度
 * @param {string} barcode - 产品条码
 */
async function forceCompleteProduct(barcode) {
  try {
    console.log(`\n🔄 开始处理产品条码: ${barcode}`);
    
    // 1. 查找产品的工艺流程记录
    const flowRecord = await MaterialProcessFlow.findOne({ barcode: barcode });
    
    if (!flowRecord) {
      console.log(`❌ 未找到条码 ${barcode} 的工艺流程记录`);
      return false;
    }
    
    console.log(`📋 找到工艺流程记录: ${flowRecord._id}`);
    console.log(`   物料编码: ${flowRecord.materialCode}`);
    console.log(`   物料名称: ${flowRecord.materialName}`);
    console.log(`   当前状态: ${flowRecord.status}`);
    console.log(`   当前进度: ${flowRecord.progress}%`);
    
    // 2. 设置主产品条码到正确位置（level为0且nodeType为MATERIAL的节点）
    await setMainProductBarcode(flowRecord, barcode);
    
    // 3. 查询解绑记录
    console.log(`\n🔍 查询解绑记录...`);
    const unbindRecords = await UnbindRecord.find({
      flowRecordId: flowRecord._id,
      mainBarcode: barcode
    }).sort({ operateTime: -1 });
    
    if (unbindRecords.length > 0) {
      console.log(`📝 找到 ${unbindRecords.length} 条解绑记录:`);
      
      for (let i = 0; i < unbindRecords.length; i++) {
        const record = unbindRecords[i];
        console.log(`   ${i + 1}. 工序: ${record.processName}`);
        console.log(`      解绑时间: ${record.operateTime}`);
        console.log(`      解绑原因: ${record.reason}`);
        console.log(`      解绑物料数量: ${record.unbindMaterials?.length || 0}`);
        
        if (record.unbindMaterials && record.unbindMaterials.length > 0) {
          record.unbindMaterials.forEach((material, idx) => {
            console.log(`         - ${material.materialCode}: ${material.originalBarcode}`);
          });
        }
      }
      
      // 4. 先清理错误的条码数据
      await cleanupMismatchedBarcodes(flowRecord, unbindRecords);
      
      // 5. 恢复解绑的条码
      await restoreUnbindBarcodes(flowRecord, unbindRecords);
    } else {
      console.log(`ℹ️  未找到解绑记录`);
    }
    
    // 6. 强制完成工艺流程
    await forceCompleteFlow(flowRecord);
    
    // 7. 独立处理托盘工序（不依赖解绑记录）
    await checkAndProcessPalletNodes(flowRecord, barcode);
    
    // 8. 最终保存更新
    flowRecord.updateAt = new Date();
    await flowRecord.save();
    
    console.log(`\n🎉 产品条码 ${barcode} 处理完成！`);
    return true;
    
  } catch (error) {
    console.error(`❌ 处理产品条码 ${barcode} 时发生错误:`, error.message);
    return false;
  }
}

/**
 * 设置主产品条码到正确位置
 * @param {Object} flowRecord - 工艺流程记录
 * @param {string} barcode - 产品条码
 */
async function setMainProductBarcode(flowRecord, barcode) {
  try {
    console.log(`\n🎯 设置主产品条码到正确位置...`);
    
    // 查找level为0且nodeType为MATERIAL的根节点
    const rootMaterialNode = flowRecord.processNodes.find(node => 
      node.level === 0 && 
      node.nodeType === "MATERIAL"
    );
    
    if (!rootMaterialNode) {
      console.log(`⚠️  未找到level为0的MATERIAL节点`);
      return;
    }
    
    // 检查根节点是否已设置主产品条码
    if (rootMaterialNode.barcode && rootMaterialNode.barcode === barcode) {
      console.log(`✅ 主产品条码已正确设置在根物料节点`);
      return;
    }
    
    // 清理其他节点上错误设置的主产品条码（特别是PROCESS_STEP节点）
    let clearedNodes = 0;
    flowRecord.processNodes.forEach(node => {
      if (node.barcode === barcode && 
          (node.nodeType !== "MATERIAL" || node.level !== 0)) {
        console.log(`🧹 清理节点上的错误主产品条码: ${node.processName || node.materialName} (${node.nodeType})`);
        node.barcode = "";
        node.scanTime = null;
        clearedNodes++;
      }
    });
    
    if (clearedNodes > 0) {
      console.log(`✅ 已清理 ${clearedNodes} 个节点上的错误主产品条码`);
    }
    
    // 设置主产品条码到根物料节点
    rootMaterialNode.barcode = barcode;
    rootMaterialNode.scanTime = new Date();
    rootMaterialNode.status = "COMPLETED";
    rootMaterialNode.endTime = new Date();
    
    console.log(`✅ 主产品条码 ${barcode} 已设置到根物料节点`);
    console.log(`   节点名称: ${rootMaterialNode.materialName}`);
    console.log(`   物料编码: ${rootMaterialNode.materialCode}`);
    
  } catch (error) {
    console.error(`❌ 设置主产品条码时发生错误:`, error.message);
  }
}

/**
 * 恢复解绑的条码到工艺节点
 * @param {Object} flowRecord - 工艺流程记录
 * @param {Array} unbindRecords - 解绑记录数组
 */
async function restoreUnbindBarcodes(flowRecord, unbindRecords) {
  try {
    console.log(`\n🔄 开始恢复解绑条码...`);
    
    let updated = false;
    
    // 遍历解绑记录
    for (const unbindRecord of unbindRecords) {
      const processStepId = unbindRecord.processStepId;
      
      console.log(`\n🔧 处理工序: ${unbindRecord.processName}`);
      
      // 恢复解绑的物料条码
      if (unbindRecord.unbindMaterials && unbindRecord.unbindMaterials.length > 0) {
        
        for (const unbindMaterial of unbindRecord.unbindMaterials) {
          if (unbindMaterial.originalBarcode && unbindMaterial.materialCode) {
            console.log(`   🔍 查找物料: ${unbindMaterial.materialCode} -> ${unbindMaterial.originalBarcode}`);
            
            // 优先根据 materialCode + processStepId 精确匹配
            let targetNode = flowRecord.processNodes.find(node => 
              node.materialCode === unbindMaterial.materialCode &&
              node.processStepId && 
              node.processStepId.toString() === processStepId.toString()
            );
            
            // 如果没找到，则根据 materialCode 匹配（可能在不同工序下的同一物料）
            if (!targetNode) {
              targetNode = flowRecord.processNodes.find(node => 
                node.materialCode === unbindMaterial.materialCode &&
                (!node.barcode || node.barcode === "")
              );
            }
            
            // 如果还没找到，则根据 processStepId 查找空的物料节点
            if (!targetNode) {
              const processNodes = flowRecord.processNodes.filter(node => 
                node.processStepId && 
                node.processStepId.toString() === processStepId.toString() &&
                node.nodeType === "MATERIAL" &&
                (!node.barcode || node.barcode === "")
              );
              
              // 从多个候选节点中选择一个（优先选择相同物料ID的）
              targetNode = processNodes.find(node => 
                node.materialId && 
                node.materialId.toString() === unbindMaterial.materialId?.toString()
              ) || processNodes[0];
            }
            
            if (!targetNode) {
              console.log(`   ⚠️  未找到物料 ${unbindMaterial.materialCode} 对应的工艺节点`);
              continue;
            }
            
            // 检查节点是否已有条码
            if (!targetNode.barcode || targetNode.barcode === "") {
              targetNode.barcode = unbindMaterial.originalBarcode;
              targetNode.scanTime = new Date();
              updated = true;
              console.log(`   ✅ 恢复条码: ${unbindMaterial.originalBarcode} -> ${targetNode.materialCode || targetNode.processName}`);
              
              // 检查是否是托盘工序
              if (targetNode.batchDocNumber) {
                await restoreToPallet(targetNode.batchDocNumber, unbindMaterial.originalBarcode);
              }
              
            } else {
              console.log(`   ℹ️  节点已有条码: ${targetNode.barcode}，跳过恢复 ${unbindMaterial.originalBarcode}`);
            }
            
          } else if (unbindMaterial.originalBarcode) {
            // 如果没有materialCode，按原逻辑处理
            console.log(`   🔍 查找工序节点: ${unbindRecord.processName} -> ${unbindMaterial.originalBarcode}`);
            
            const processNode = flowRecord.processNodes.find(node => 
              node.processStepId && node.processStepId.toString() === processStepId.toString()
            );
            
            if (!processNode) {
              console.log(`   ⚠️  未找到工序 ${unbindRecord.processName} 对应的工艺节点`);
              continue;
            }
            
            if (!processNode.barcode || processNode.barcode === "") {
              processNode.barcode = unbindMaterial.originalBarcode;
              processNode.scanTime = new Date();
              updated = true;
              console.log(`   ✅ 恢复条码: ${unbindMaterial.originalBarcode} -> ${processNode.processName}`);
              
              // 检查是否是托盘工序
              if (processNode.batchDocNumber) {
                await restoreToPallet(processNode.batchDocNumber, unbindMaterial.originalBarcode);
              }
              
            } else {
              console.log(`   ℹ️  节点已有条码: ${processNode.barcode}，跳过恢复 ${unbindMaterial.originalBarcode}`);
            }
          }
        }
      } else {
        console.log(`   ℹ️  该解绑记录无物料条码可恢复`);
      }
    }
    
    // 保存更新
    if (updated) {
      flowRecord.updateAt = new Date();
      await flowRecord.save();
      console.log(`✅ 条码恢复完成，已保存更新`);
    } else {
      console.log(`ℹ️  无需恢复条码`);
    }
    
  } catch (error) {
    console.error(`❌ 恢复解绑条码时发生错误:`, error.message);
  }
}

/**
 * 将条码恢复到托盘中
 * @param {string} palletCode - 托盘编码
 * @param {string} barcode - 要恢复的条码
 */
async function restoreToPallet(palletCode, barcode) {
  try {
    console.log(`   🗂️  检查托盘: ${palletCode}`);
    
    // 查找托盘记录
    const pallet = await MaterialPalletizing.findOne({ palletCode: palletCode });
    
    if (!pallet) {
      console.log(`   ⚠️  未找到托盘: ${palletCode}`);
      return;
    }
    
    // 检查条码是否已存在于托盘中
    const existingBarcode = pallet.palletBarcodes.find(item => item.barcode === barcode);
    
    if (existingBarcode) {
      console.log(`   ℹ️  条码 ${barcode} 已存在于托盘中`);
      return;
    }
    
    // 添加条码到托盘
    pallet.palletBarcodes.push({
      barcode: barcode,
      barcodeType: "恢复条码",
      scanTime: new Date()
    });
    
    // 增加条码数量
    pallet.barcodeCount += 1;
    pallet.updateAt = new Date();
    
    await pallet.save();
    
    console.log(`   ✅ 条码 ${barcode} 已恢复到托盘 ${palletCode}`);
    console.log(`   📊 托盘条码数量: ${pallet.barcodeCount}`);
    
  } catch (error) {
    console.error(`   ❌ 恢复条码到托盘时发生错误:`, error.message);
  }
}

/**
 * 强制完成工艺流程
 * @param {Object} flowRecord - 工艺流程记录
 */
async function forceCompleteFlow(flowRecord) {
  try {
    console.log(`\n🚀 强制完成工艺流程...`);
    
    const now = new Date();
    let updated = false;
    flowRecord.remark = "MES技术修复";
    
    // 设置主流程状态
    if (flowRecord.status !== "COMPLETED") {
      flowRecord.status = "COMPLETED";
      flowRecord.progress = 100;
      flowRecord.endTime = now;
      updated = true;
      console.log(`   ✅ 主流程状态更新为: COMPLETED (100%)`);
    }
    
    // 设置所有工艺节点状态为完成
    flowRecord.processNodes.forEach((node, index) => {
      if (node.status !== "COMPLETED") {
        node.status = "COMPLETED";
        node.endTime = now;
        updated = true;
        console.log(`   ✅ 节点 ${index + 1} (${node.processName || node.materialName}) 状态更新为: COMPLETED`);
      }
    });
    
    // 保存更新
    if (updated) {
      flowRecord.updateAt = now;
      await flowRecord.save();
      console.log(`✅ 工艺流程强制完成成功`);
    } else {
      console.log(`ℹ️  工艺流程已经是完成状态`);
    }
    
  } catch (error) {
    console.error(`❌ 强制完成工艺流程时发生错误:`, error.message);
  }
}

/**
 * 检查并处理托盘工序节点
 * @param {Object} flowRecord - 工艺流程记录
 * @param {string} barcode - 产品条码
 */
async function checkAndProcessPalletNodes(flowRecord, barcode) {
  try {
    console.log(`\n🗂️  检查托盘工序节点...`);
    
    // 查找所有有batchDocNumber的工艺节点
    const palletNodes = flowRecord.processNodes.filter(node => 
      node.batchDocNumber && node.batchDocNumber.trim() !== ""
    );
    
    if (palletNodes.length === 0) {
      console.log(`ℹ️  未找到托盘工序节点`);
      return;
    }
    
    console.log(`📦 找到 ${palletNodes.length} 个托盘工序节点:`);
    
    for (const node of palletNodes) {
      console.log(`\n🔧 处理托盘工序: ${node.processName || '未知工序'}`);
      console.log(`   托盘编号: ${node.batchDocNumber}`);
      console.log(`   节点类型: ${node.nodeType}`);
      
      // 检查托盘是否存在
      const pallet = await MaterialPalletizing.findOne({ 
        palletCode: node.batchDocNumber 
      });
      
      if (!pallet) {
        console.log(`   ⚠️  未找到托盘: ${node.batchDocNumber}`);
        continue;
      }
      
      console.log(`   📊 托盘信息:`);
      console.log(`      状态: ${pallet.status}`);
      console.log(`      当前条码数量: ${pallet.barcodeCount}`);
      console.log(`      总容量: ${pallet.totalQuantity}`);
      
      // 检查产品条码是否已在托盘中
      const existingBarcode = pallet.palletBarcodes.find(item => 
        item.barcode === barcode
      );
      
      if (existingBarcode) {
        console.log(`   ✅ 产品条码 ${barcode} 已存在于托盘中`);
      } else {
        console.log(`   ➕ 产品条码 ${barcode} 不在托盘中，准备添加...`);
        
        // 添加产品条码到托盘
        const newBarcodeItem = {
          materialProcessFlowId: flowRecord._id,
          barcode: barcode,
          barcodeType: "强制恢复",
          scanTime: new Date(),
          productionPlanWorkOrderId: flowRecord.productionPlanWorkOrderId
        };
        
        pallet.palletBarcodes.push(newBarcodeItem);
        pallet.barcodeCount += 1;
        pallet.updateAt = new Date();
        
        // 更新托盘状态
        if (pallet.barcodeCount >= pallet.totalQuantity && pallet.status !== "STACKED") {
          pallet.status = "STACKED";
          console.log(`   📦 托盘已满，状态更新为: STACKED`);
        }
        
        await pallet.save();
        
        console.log(`   ✅ 产品条码 ${barcode} 已添加到托盘 ${node.batchDocNumber}`);
        console.log(`   📊 托盘条码数量: ${pallet.barcodeCount}/${pallet.totalQuantity}`);
      }
      
      // 注意：不要将主产品条码设置到PROCESS_STEP节点的barcode字段
      // 托盘工序节点通常是PROCESS_STEP类型，不应该包含条码信息
      // 条码信息应该存储在托盘记录(MaterialPalletizing)中
      if (node.nodeType === "PROCESS_STEP") {
        node.barcode = "";
        console.log(`   ℹ️  托盘工序为PROCESS_STEP类型，不设置条码到节点字段`);
      } else if (node.nodeType === "MATERIAL") {
        // 如果是MATERIAL类型的托盘节点，且条码为空，可以考虑设置
        if (!node.barcode || node.barcode === "") {
          node.barcode = barcode;
          node.scanTime = new Date();
          console.log(`   🔄 已将产品条码设置到物料节点`);
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ 处理托盘工序节点时发生错误:`, error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🚀 产品条码强制完成和解绑条码恢复脚本");
  console.log("=".repeat(50));
  
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("❌ 请提供产品条码");
    console.log("使用方法: node force_complete_product.js [产品条码]");
    console.log("示例: node force_complete_product.js ABC123456789");
    process.exit(1);
  }
  
  const barcode = args[0];
  
  try {
    // 连接数据库
    await connectDatabase();
    
    // 处理产品条码
    const success = await forceCompleteProduct(barcode);
    
    if (success) {
      console.log("🎉 脚本执行成功！");
    } else {
      console.log("❌ 脚本执行失败！");
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
  forceCompleteProduct,
  restoreUnbindBarcodes,
  restoreToPallet,
  forceCompleteFlow,
  checkAndProcessPalletNodes,
  cleanupMismatchedBarcodes
}; 