/**
 * 出库单数量自动修复脚本
 * @description 根据检查报告自动修复出库单数量问题
 */

const mongoose = require("mongoose");
const wareHouseOntry = require("../model/warehouse/warehouseOntry");
const MaterialPallet = require("../model/project/materialPalletizing");

// 数据库连接配置
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 27017,
  database: process.env.DB_NAME || "dcmes",
  username: process.env.DB_USER || "",
  password: process.env.DB_PASS || "",
};

// 构建数据库连接字符串
function getConnectionString() {
  if (DB_CONFIG.username && DB_CONFIG.password) {
    return `mongodb://${DB_CONFIG.username}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;
  }
  return `mongodb://${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;
}

/**
 * 清理出库单中的重复托盘项
 */
async function cleanDuplicatePallets(entry) {
  const palletCodeMap = new Map();
  const duplicateItems = [];
  const mergedItems = [];
  const processedPallets = new Set();

  // 检测重复
  entry.entryItems.forEach((item, index) => {
    if (palletCodeMap.has(item.palletCode)) {
      duplicateItems.push({
        index,
        palletCode: item.palletCode,
        quantity: item.quantity,
        scanTime: item.scanTime,
      });
    } else {
      palletCodeMap.set(item.palletCode, index);
    }
  });

  if (duplicateItems.length === 0) {
    return {
      success: true,
      action: "NO_DUPLICATES",
      message: "未发现重复托盘项",
      duplicatesRemoved: 0,
    };
  }

  console.log(`  发现 ${duplicateItems.length} 个重复托盘项，开始合并...`);

  // 合并重复项
  for (const item of entry.entryItems) {
    if (processedPallets.has(item.palletCode)) {
      continue;
    }

    const sameCodeItems = entry.entryItems.filter(
      (i) => i.palletCode === item.palletCode
    );

    if (sameCodeItems.length === 1) {
      mergedItems.push(item);
    } else {
      const mergedItem = { ...sameCodeItems[0] };
      const allBarcodes = [];

      // 收集所有条码并去重
      sameCodeItems.forEach((sameItem) => {
        if (sameItem.palletBarcodes && sameItem.palletBarcodes.length > 0) {
          sameItem.palletBarcodes.forEach((barcode) => {
            const exists = allBarcodes.some((b) => b.barcode === barcode.barcode);
            if (!exists) {
              allBarcodes.push(barcode);
            }
          });
        }
      });

      mergedItem.palletBarcodes = allBarcodes;
      mergedItem.quantity = allBarcodes.length;
      mergedItems.push(mergedItem);

      console.log(
        `    合并托盘 ${item.palletCode}: ${sameCodeItems.length} 项 -> 1 项，条码数: ${allBarcodes.length}`
      );
    }

    processedPallets.add(item.palletCode);
  }

  // 更新出库单
  entry.entryItems = mergedItems;

  return {
    success: true,
    action: "DUPLICATES_CLEANED",
    message: `清理了 ${duplicateItems.length} 个重复托盘项`,
    duplicatesRemoved: duplicateItems.length,
    details: duplicateItems,
  };
}

/**
 * 修复出库单数量计算
 */
async function fixQuantityCalculation(entry) {
  const originalOutNumber = entry.outNumber;
  const originalActualQuantity = entry.actualQuantity;
  const originalPalletCount = entry.palletCount;

  // 重新计算正确的数量
  const correctOutNumber = entry.entryItems.reduce((sum, item) => {
    if (item.palletBarcodes && item.palletBarcodes.length > 0) {
      return sum + item.palletBarcodes.length;
    } else if (item.quantity) {
      return sum + item.quantity;
    } else {
      console.warn(
        `    警告: 托盘项缺少数量信息: palletCode=${item.palletCode}`
      );
      return sum;
    }
  }, 0);

  // 更新数量信息
  entry.outNumber = correctOutNumber;
  entry.actualQuantity = correctOutNumber;
  entry.palletCount = entry.entryItems.length;
  entry.progress = Math.round(
    (correctOutNumber / entry.outboundQuantity) * 100
  );

  // 更新状态
  let statusChanged = false;
  const originalStatus = entry.status;

  if (correctOutNumber >= entry.outboundQuantity && entry.status !== "COMPLETED") {
    entry.status = "COMPLETED";
    entry.completedTime = new Date();
    statusChanged = true;
  } else if (correctOutNumber < entry.outboundQuantity && entry.status === "COMPLETED") {
    entry.status = "IN_PROGRESS";
    entry.completedTime = null;
    statusChanged = true;
  }

  const changes = {
    outNumber: {
      before: originalOutNumber,
      after: correctOutNumber,
      difference: correctOutNumber - originalOutNumber,
    },
    actualQuantity: {
      before: originalActualQuantity,
      after: correctOutNumber,
      difference: correctOutNumber - originalActualQuantity,
    },
    palletCount: {
      before: originalPalletCount,
      after: entry.entryItems.length,
      difference: entry.entryItems.length - originalPalletCount,
    },
    progress: {
      before: Math.round((originalOutNumber / entry.outboundQuantity) * 100),
      after: entry.progress,
    },
  };

  if (statusChanged) {
    changes.status = {
      before: originalStatus,
      after: entry.status,
    };
  }

  return {
    success: true,
    action: "QUANTITY_FIXED",
    message: "数量计算已修复",
    changes,
  };
}

/**
 * 修复托盘中条码的出库状态
 */
async function fixBarcodeOutWarehouseStatus(entry) {
  const fixedBarcodes = [];
  const errors = [];

  console.log(`  检查并修复托盘中条码的出库状态...`);

  for (const item of entry.entryItems) {
    try {
      if (!item.palletBarcodes || item.palletBarcodes.length === 0) {
        continue;
      }

      // 获取托盘
      const pallet = await MaterialPallet.findById(item.palletId);
      if (!pallet) {
        errors.push({
          palletCode: item.palletCode,
          error: "托盘不存在",
        });
        continue;
      }

      // 检查每个条码的状态
      const barcodesToUpdate = [];
      for (const entryBarcode of item.palletBarcodes) {
        const palletBarcode = pallet.palletBarcodes.find(
          (b) => b.barcode === entryBarcode.barcode
        );

        if (palletBarcode && palletBarcode.outWarehouseStatus !== "COMPLETED") {
          barcodesToUpdate.push(entryBarcode.barcode);
        }
      }

      // 批量更新条码状态
      if (barcodesToUpdate.length > 0) {
        await MaterialPallet.updateOne(
          { _id: pallet._id },
          {
            $set: {
              "palletBarcodes.$[elem].outWarehouseStatus": "COMPLETED",
              "palletBarcodes.$[elem].outWarehouseTime": new Date(),
            },
          },
          {
            arrayFilters: [{ "elem.barcode": { $in: barcodesToUpdate } }],
          }
        );

        fixedBarcodes.push({
          palletCode: item.palletCode,
          barcodesFixed: barcodesToUpdate.length,
          barcodes: barcodesToUpdate,
        });

        console.log(
          `    修复托盘 ${item.palletCode}: ${barcodesToUpdate.length} 个条码状态`
        );
      }

      // 更新托盘的整体出库状态
      const updatedPallet = await MaterialPallet.findById(item.palletId);
      const allOutWarehouse = updatedPallet.palletBarcodes.every(
        (b) => b.outWarehouseStatus === "COMPLETED"
      );
      const someOutWarehouse = updatedPallet.palletBarcodes.some(
        (b) => b.outWarehouseStatus === "COMPLETED"
      );

      let newStatus = updatedPallet.inWarehouseStatus;
      if (allOutWarehouse) {
        newStatus = "OUT_WAREHOUSE";
      } else if (someOutWarehouse) {
        newStatus = "PART_OUT_WAREHOUSE";
      }

      if (newStatus !== updatedPallet.inWarehouseStatus) {
        await MaterialPallet.updateOne(
          { _id: updatedPallet._id },
          {
            $set: {
              inWarehouseStatus: newStatus,
              outWarehouseTime: new Date(),
            },
          }
        );

        console.log(`    更新托盘 ${item.palletCode} 状态: ${newStatus}`);
      }
    } catch (error) {
      errors.push({
        palletCode: item.palletCode,
        error: error.message,
      });
    }
  }

  return {
    success: errors.length === 0,
    action: "BARCODE_STATUS_FIXED",
    message: `修复了 ${fixedBarcodes.length} 个托盘的条码状态`,
    fixedBarcodes,
    errors,
  };
}

/**
 * 修复单个出库单
 */
async function fixSingleEntry(entryId, options = {}) {
  try {
    console.log(`\n正在修复出库单: ${entryId}`);

    // 获取出库单
    const entry = await wareHouseOntry.findById(entryId);
    if (!entry) {
      return {
        success: false,
        entryId,
        error: "出库单不存在",
      };
    }

    console.log(`  出库单号: ${entry.entryNo}`);
    console.log(`  当前状态: ${entry.status}`);
    console.log(`  应出库数量: ${entry.outboundQuantity}`);
    console.log(`  当前出库数量: ${entry.outNumber}`);

    const fixResults = {
      entryNo: entry.entryNo,
      entryId: entry._id,
      actions: [],
    };

    // 1. 清理重复托盘
    if (options.cleanDuplicates !== false) {
      const cleanResult = await cleanDuplicatePallets(entry);
      fixResults.actions.push(cleanResult);
      if (cleanResult.duplicatesRemoved > 0) {
        console.log(`  ✓ ${cleanResult.message}`);
      }
    }

    // 2. 修复数量计算
    if (options.fixQuantities !== false) {
      const quantityResult = await fixQuantityCalculation(entry);
      fixResults.actions.push(quantityResult);
      console.log(`  ✓ ${quantityResult.message}`);
      
      if (quantityResult.changes.outNumber.difference !== 0) {
        console.log(
          `    数量变化: ${quantityResult.changes.outNumber.before} -> ${quantityResult.changes.outNumber.after} (${quantityResult.changes.outNumber.difference > 0 ? '+' : ''}${quantityResult.changes.outNumber.difference})`
        );
      }
    }

    // 3. 修复条码出库状态
    if (options.fixBarcodeStatus !== false) {
      const barcodeResult = await fixBarcodeOutWarehouseStatus(entry);
      fixResults.actions.push(barcodeResult);
      if (barcodeResult.fixedBarcodes.length > 0) {
        console.log(`  ✓ ${barcodeResult.message}`);
      }
    }

    // 4. 保存更新
    entry.updateAt = new Date();
    await entry.save();

    console.log(`  ✓ 出库单修复完成`);
    console.log(`  最终出库数量: ${entry.outNumber}`);
    console.log(`  最终状态: ${entry.status}`);

    return {
      success: true,
      ...fixResults,
    };
  } catch (error) {
    console.error(`  ✗ 修复失败: ${error.message}`);
    return {
      success: false,
      entryId,
      error: error.message,
    };
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log("========================================");
    console.log("出库单数量自动修复脚本");
    console.log("========================================\n");

    // 连接数据库
    console.log("正在连接数据库...");
    await mongoose.connect(getConnectionString(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("数据库连接成功\n");

    // 获取命令行参数
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log("使用方法:");
      console.log("  node fixWarehouseEntryQuantity.js --entryNo <出库单号>");
      console.log("  node fixWarehouseEntryQuantity.js --entryId <出库单ID>");
      console.log("  node fixWarehouseEntryQuantity.js --report <检查报告文件>");
      console.log("  node fixWarehouseEntryQuantity.js --exceeded  (修复所有超出数量的出库单)");
      console.log("\n选项:");
      console.log("  --no-duplicates       不清理重复托盘");
      console.log("  --no-quantities       不修复数量计算");
      console.log("  --no-barcode-status   不修复条码状态");
      console.log("  --dry-run            仅模拟运行，不实际修改");
      return;
    }

    const options = {
      cleanDuplicates: !args.includes("--no-duplicates"),
      fixQuantities: !args.includes("--no-quantities"),
      fixBarcodeStatus: !args.includes("--no-barcode-status"),
      dryRun: args.includes("--dry-run"),
    };

    if (options.dryRun) {
      console.log("⚠️  运行模式: 模拟运行（不会实际修改数据）\n");
    }

    let entriesToFix = [];

    // 解析参数
    if (args.includes("--entryNo")) {
      const index = args.indexOf("--entryNo");
      const entryNo = args[index + 1];
      const entry = await wareHouseOntry.findOne({ entryNo });
      if (entry) {
        entriesToFix.push(entry._id);
      } else {
        console.error(`未找到出库单: ${entryNo}`);
        return;
      }
    } else if (args.includes("--entryId")) {
      const index = args.indexOf("--entryId");
      const entryId = args[index + 1];
      entriesToFix.push(entryId);
    } else if (args.includes("--report")) {
      const index = args.indexOf("--report");
      const reportFile = args[index + 1];
      const fs = require("fs");
      
      console.log(`读取检查报告: ${reportFile}`);
      const report = JSON.parse(fs.readFileSync(reportFile, "utf-8"));
      
      if (report.results && Array.isArray(report.results)) {
        entriesToFix = report.results.map((r) => r.entryId);
        console.log(`从报告中找到 ${entriesToFix.length} 个需要修复的出库单\n`);
      }
    } else if (args.includes("--exceeded")) {
      console.log("查找所有超出应出库数量的出库单...");
      const entries = await wareHouseOntry.find({
        $expr: { $gt: ["$outNumber", "$outboundQuantity"] },
      });
      entriesToFix = entries.map((e) => e._id);
      console.log(`找到 ${entriesToFix.length} 个超出数量的出库单\n`);
    }

    if (entriesToFix.length === 0) {
      console.log("没有需要修复的出库单");
      return;
    }

    // 执行修复
    const results = [];
    for (let i = 0; i < entriesToFix.length; i++) {
      console.log(`\n[${i + 1}/${entriesToFix.length}]`);
      
      if (options.dryRun) {
        console.log("⚠️  模拟运行模式，跳过实际修复");
        continue;
      }
      
      const result = await fixSingleEntry(entriesToFix[i], options);
      results.push(result);
    }

    // 生成修复报告
    console.log("\n========================================");
    console.log("修复汇总");
    console.log("========================================\n");

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`总处理数量: ${results.length}`);
    console.log(`成功: ${successCount}`);
    console.log(`失败: ${failCount}\n`);

    if (failCount > 0) {
      console.log("失败的出库单:");
      results
        .filter((r) => !r.success)
        .forEach((r, index) => {
          console.log(`  ${index + 1}. ID: ${r.entryId}`);
          console.log(`     错误: ${r.error}\n`);
        });
    }

    // 保存修复报告
    const fs = require("fs");
    const reportPath = `./warehouse_entry_fix_report_${Date.now()}.json`;
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          fixTime: new Date(),
          totalProcessed: results.length,
          successCount,
          failCount,
          options,
          results,
        },
        null,
        2
      )
    );

    console.log(`修复报告已保存到: ${reportPath}`);
  } catch (error) {
    console.error("修复过程中发生错误:", error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log("\n数据库连接已关闭");
  }
}

// 运行主函数
main().catch(console.error);

