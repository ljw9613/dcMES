#!/usr/bin/env node
/**
 * 解绑指定销售订单号托盘的脚本
 * 
 * 功能说明：
 * 1. 根据输入的销售订单号，查询该订单下所有已入库但未出库的托盘
 * 2. 从入库单中删除对应的托盘数据
 * 3. 调用托盘解绑服务，解绑托盘中的所有产品条码
 * 4. 记录详细的操作日志和结果
 * 
 * 使用方法：
 * node unbind_sale_order_pallets.js [销售订单号] [操作人ID] [解绑原因]
 * 
 * 示例：
 * node unbind_sale_order_pallets.js "SO202401001" "507f1f77bcf86cd799439011" "订单取消需要解绑"
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

// 导入数据模型和服务
const MaterialPalletizing = require("./dcMes_server/model/project/materialPalletizing");
const WarehouseEntry = require("./dcMes_server/model/warehouse/warehouseEntry");
const MaterialPalletizingService = require("./dcMes_server/services/materialPalletizing");

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
 * 查询指定销售订单的已入库未出库托盘
 * @param {string} saleOrderNo - 销售订单号
 */
async function findInWarehousePallets(saleOrderNo) {
  try {
    console.log(`\n🔍 开始查询销售订单: ${saleOrderNo} 的已入库未出库托盘...`);
    
    // 查询条件：已入库但未出库的托盘
    const pallets = await MaterialPalletizing.find({
      saleOrderNo: saleOrderNo,
      inWarehouseStatus: "IN_WAREHOUSE", // 已入库状态
      status: { $in: ["STACKING", "STACKED"] } // 活跃状态的托盘
    }).select('palletCode materialCode materialName barcodeCount boxCount totalQuantity status inWarehouseStatus createAt');
    
    if (pallets.length === 0) {
      console.log(`ℹ️  销售订单 ${saleOrderNo} 下未找到符合条件的托盘（已入库但未出库）`);
      return [];
    }
    
    console.log(`📦 找到 ${pallets.length} 个符合条件的托盘:`);
    console.log(`${'序号'.padEnd(4)} ${'托盘编号'.padEnd(25)} ${'物料编码'.padEnd(15)} ${'物料名称'.padEnd(25)} ${'条码数'.padEnd(8)} ${'箱数'.padEnd(6)} ${'容量'.padEnd(8)} ${'状态'.padEnd(10)}`);
    console.log(`${'-'.repeat(120)}`);
    
    pallets.forEach((pallet, index) => {
      const materialName = (pallet.materialName || '').substring(0, 20);
      console.log(`${String(index + 1).padEnd(4)} ${pallet.palletCode.padEnd(25)} ${pallet.materialCode.padEnd(15)} ${materialName.padEnd(25)} ${String(pallet.barcodeCount).padEnd(8)} ${String(pallet.boxCount).padEnd(6)} ${String(pallet.totalQuantity).padEnd(8)} ${pallet.status.padEnd(10)}`);
    });
    
    return pallets;
    
  } catch (error) {
    console.error(`❌ 查询销售订单 ${saleOrderNo} 的托盘时发生错误:`, error.message);
    throw error;
  }
}

/**
 * 从入库单中删除托盘数据
 * @param {Array} palletCodes - 托盘编号数组
 */
async function removeFromWarehouseEntry(palletCodes) {
  try {
    console.log(`\n🗑️  开始从入库单中删除托盘数据...`);
    
    const results = [];
    
    for (const palletCode of palletCodes) {
      // 查找包含该托盘的入库单
      const warehouseEntries = await WarehouseEntry.find({
        "entryItems.palletCode": palletCode
      });
      
      if (warehouseEntries.length === 0) {
        console.log(`⚠️  托盘 ${palletCode} 未在任何入库单中找到`);
        results.push({
          palletCode,
          success: false,
          reason: "未在入库单中找到",
          affectedEntries: 0
        });
        continue;
      }
      
      let affectedEntries = 0;
      
      // 处理每个包含该托盘的入库单
      for (const entry of warehouseEntries) {
        // 记录删除前的状态
        const originalItemsCount = entry.entryItems.length;
        const originalActualQuantity = entry.actualQuantity;
        const originalPalletCount = entry.palletCount;
        
        // 找到要删除的托盘项
        const palletItem = entry.entryItems.find(item => item.palletCode === palletCode);
        if (!palletItem) {
          continue;
        }
        
        const removedQuantity = palletItem.quantity || 0;
        const removedBoxCount = palletItem.boxCount || 0;
        
        // 从入库单中移除托盘项
        entry.entryItems = entry.entryItems.filter(item => item.palletCode !== palletCode);
        
        // 重新计算入库单统计信息
        entry.actualQuantity = entry.entryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        entry.palletCount = entry.entryItems.length;
        entry.totalBoxCount = entry.entryItems.reduce((sum, item) => sum + (item.boxCount || 0), 0);
        
        // 重新计算入库进度
        if (entry.plannedQuantity && entry.plannedQuantity > 0) {
          entry.progress = Math.min(100, (entry.actualQuantity / entry.plannedQuantity) * 100);
        } else {
          entry.progress = 0;
        }
        
        // 更新入库单状态
        if (entry.actualQuantity === 0) {
          entry.status = "PENDING";
          entry.startTime = null;
          entry.endTime = null;
        } else if (entry.progress >= 100) {
          entry.status = "COMPLETED";
        } else if (entry.progress > 0) {
          entry.status = "IN_PROGRESS";
        }
        
        // 保存更新
        await entry.save();
        affectedEntries++;
        
        console.log(`   📝 入库单 ${entry.entryNo}: 删除托盘 ${palletCode}`);
        console.log(`      - 数量变化: ${originalActualQuantity} → ${entry.actualQuantity} (减少 ${removedQuantity})`);
        console.log(`      - 托盘数: ${originalPalletCount} → ${entry.palletCount} (减少 1)`);
        console.log(`      - 箱数变化: ${removedBoxCount} → 0 (减少 ${removedBoxCount})`);
        console.log(`      - 进度变化: ${((originalActualQuantity / (entry.plannedQuantity || 1)) * 100).toFixed(1)}% → ${entry.progress.toFixed(1)}%`);
        console.log(`      - 状态: ${entry.status}`);
      }
      
      results.push({
        palletCode,
        success: true,
        affectedEntries,
        reason: `成功从 ${affectedEntries} 个入库单中删除`
      });
      
      console.log(`✅ 托盘 ${palletCode} 已从 ${affectedEntries} 个入库单中删除`);
    }
    
    return results;
    
  } catch (error) {
    console.error(`❌ 从入库单中删除托盘数据时发生错误:`, error.message);
    throw error;
  }
}

/**
 * 解绑托盘条码
 * @param {Array} palletCodes - 托盘编号数组
 * @param {string} userId - 操作人ID
 * @param {string} reason - 解绑原因
 */
async function unbindPalletBarcodes(palletCodes, userId, reason) {
  try {
    console.log(`\n🔓 开始解绑托盘条码...`);
    
    const results = [];
    
    for (const palletCode of palletCodes) {
      try {
        console.log(`   🔄 正在解绑托盘: ${palletCode}`);
        
        // 调用托盘解绑服务
        const result = await MaterialPalletizingService.unbindPalletBarcode(
          palletCode,
          userId,
          reason
        );
        
        results.push({
          palletCode,
          success: true,
          message: "托盘解绑成功",
          unbindedBarcodeCount: result.barcodeCount || 0,
          unbindedBoxCount: result.boxCount || 0
        });
        
        console.log(`   ✅ 托盘 ${palletCode} 解绑成功`);
        
      } catch (error) {
        console.error(`   ❌ 托盘 ${palletCode} 解绑失败:`, error.message);
        
        results.push({
          palletCode,
          success: false,
          message: `托盘解绑失败: ${error.message}`,
          error: error.message
        });
      }
    }
    
    return results;
    
  } catch (error) {
    console.error(`❌ 解绑托盘条码时发生错误:`, error.message);
    throw error;
  }
}

/**
 * 解绑指定销售订单的托盘
 * @param {string} saleOrderNo - 销售订单号
 * @param {string} userId - 操作人ID
 * @param {string} reason - 解绑原因
 */
async function unbindSaleOrderPallets(saleOrderNo, userId, reason) {
  try {
    console.log(`\n🎯 开始处理销售订单: ${saleOrderNo} 的托盘解绑任务`);
    console.log(`📋 操作人ID: ${userId}`);
    console.log(`📝 解绑原因: ${reason}`);
    console.log(`⏰ 开始时间: ${new Date().toLocaleString('zh-CN')}`);
    
    // 步骤1：查询符合条件的托盘
    const pallets = await findInWarehousePallets(saleOrderNo);
    
    if (pallets.length === 0) {
      console.log(`\n🎉 销售订单 ${saleOrderNo} 没有需要解绑的托盘`);
      return {
        success: true,
        message: "没有需要解绑的托盘",
        processedPallets: 0,
        warehouseEntryResults: [],
        unbindResults: []
      };
    }
    
    const palletCodes = pallets.map(p => p.palletCode);
    
    // 用户确认
    console.log(`\n⚠️  即将解绑 ${pallets.length} 个托盘，此操作不可逆！`);
    console.log(`📦 托盘列表: ${palletCodes.join(', ')}`);
    
    // 在生产环境中，这里应该有用户确认步骤
    // 为了脚本自动化，我们跳过用户确认，但记录警告
    console.log(`\n🚀 开始执行解绑操作...`);
    
    // 步骤2：从入库单中删除托盘数据
    const warehouseEntryResults = await removeFromWarehouseEntry(palletCodes);
    
    // 步骤3：解绑托盘条码
    const unbindResults = await unbindPalletBarcodes(palletCodes, userId, reason);
    
    // 汇总结果
    const successfulUnbinds = unbindResults.filter(r => r.success);
    const failedUnbinds = unbindResults.filter(r => !r.success);
    const successfulWarehouseUpdates = warehouseEntryResults.filter(r => r.success);
    const failedWarehouseUpdates = warehouseEntryResults.filter(r => !r.success);
    
    console.log(`\n📊 操作结果汇总:`);
    console.log(`   销售订单号: ${saleOrderNo}`);
    console.log(`   发现托盘总数: ${pallets.length}`);
    console.log(`   入库单更新成功: ${successfulWarehouseUpdates.length}`);
    console.log(`   入库单更新失败: ${failedWarehouseUpdates.length}`);
    console.log(`   托盘解绑成功: ${successfulUnbinds.length}`);
    console.log(`   托盘解绑失败: ${failedUnbinds.length}`);
    
    if (failedUnbinds.length > 0) {
      console.log(`\n❌ 解绑失败的托盘:`);
      failedUnbinds.forEach(result => {
        console.log(`   - ${result.palletCode}: ${result.message}`);
      });
    }
    
    if (failedWarehouseUpdates.length > 0) {
      console.log(`\n❌ 入库单更新失败的托盘:`);
      failedWarehouseUpdates.forEach(result => {
        console.log(`   - ${result.palletCode}: ${result.reason}`);
      });
    }
    
    if (successfulUnbinds.length > 0) {
      console.log(`\n✅ 解绑成功的托盘:`);
      successfulUnbinds.forEach(result => {
        console.log(`   - ${result.palletCode}: 解绑条码 ${result.unbindedBarcodeCount} 个，箱数 ${result.unbindedBoxCount} 个`);
      });
    }
    
    const isFullySuccessful = failedUnbinds.length === 0 && failedWarehouseUpdates.length === 0;
    
    return {
      success: isFullySuccessful,
      message: isFullySuccessful ? "所有托盘解绑成功" : "部分托盘解绑失败",
      processedPallets: pallets.length,
      successfulUnbinds: successfulUnbinds.length,
      failedUnbinds: failedUnbinds.length,
      warehouseEntryResults,
      unbindResults
    };
    
  } catch (error) {
    console.error(`❌ 处理销售订单 ${saleOrderNo} 的托盘解绑时发生错误:`, error.message);
    throw error;
  }
}

/**
 * 验证用户输入
 * @param {string} saleOrderNo - 销售订单号
 * @param {string} userId - 操作人ID
 * @param {string} reason - 解绑原因
 */
function validateInput(saleOrderNo, userId, reason) {
  if (!saleOrderNo || saleOrderNo.trim().length === 0) {
    throw new Error("销售订单号不能为空");
  }
  
  if (!userId || userId.trim().length === 0) {
    throw new Error("操作人ID不能为空");
  }
  
  // 简单验证ObjectId格式
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    throw new Error("操作人ID格式不正确，应该是24位十六进制字符串");
  }
  
  if (!reason || reason.trim().length === 0) {
    throw new Error("解绑原因不能为空");
  }
  
  if (reason.trim().length > 200) {
    throw new Error("解绑原因不能超过200个字符");
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🔓 销售订单托盘解绑脚本");
  console.log("=".repeat(60));
  
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log("❌ 参数不足，请提供完整参数");
    console.log("使用方法: ");
    console.log("  node unbind_sale_order_pallets.js [销售订单号] [操作人ID] [解绑原因]");
    console.log("示例: ");
    console.log('  node unbind_sale_order_pallets.js "SO202401001" "507f1f77bcf86cd799439011" "订单取消需要解绑"');
    console.log("参数说明:");
    console.log("  销售订单号: 需要解绑托盘的销售订单号");
    console.log("  操作人ID: 执行解绑操作的用户ID（24位十六进制字符串）");
    console.log("  解绑原因: 解绑操作的原因说明（用于审计日志）");
    process.exit(1);
  }
  
  const saleOrderNo = args[0].trim();
  const userId = args[1].trim();
  const reason = args[2].trim();
  
  try {
    // 验证输入参数
    validateInput(saleOrderNo, userId, reason);
    
    // 连接数据库
    await connectDatabase();
    
    // 执行解绑操作
    const result = await unbindSaleOrderPallets(saleOrderNo, userId, reason);
    
    if (result.success) {
      console.log("\n🎉 销售订单托盘解绑操作完成！");
      process.exit(0);
    } else {
      console.log("\n⚠️  销售订单托盘解绑操作部分失败！");
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
  findInWarehousePallets,
  removeFromWarehouseEntry,
  unbindPalletBarcodes,
  unbindSaleOrderPallets
}; 