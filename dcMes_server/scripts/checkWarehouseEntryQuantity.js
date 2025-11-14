/**
 * 出库单数量检查脚本
 * @description 检查出库单数量是否超出设置，并验证托盘数据完整性
 */

const mongoose = require("mongoose");
const wareHouseOntry = require("../model/warehouse/warehouseOntry");
const MaterialPallet = require("../model/project/materialPalletizing");
const MaterialProcessFlow = require("../model/project/materialProcessFlow");

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
 * 检查单个出库单的数量完整性
 * @param {Object} entry - 出库单对象
 * @returns {Object} 检查结果
 */
async function checkSingleEntry(entry) {
  const result = {
    entryNo: entry.entryNo,
    entryId: entry._id,
    status: entry.status,
    outboundQuantity: entry.outboundQuantity,
    outNumber: entry.outNumber,
    actualQuantity: entry.actualQuantity,
    palletCount: entry.palletCount,
    issues: [],
    palletDetails: [],
    barcodeIssues: [],
    summary: {},
  };

  // 1. 检查是否超出应出库数量
  if (entry.outNumber > entry.outboundQuantity) {
    result.issues.push({
      type: "EXCEED_QUANTITY",
      message: `出库数量(${entry.outNumber})超出应出库数量(${entry.outboundQuantity})，超出${entry.outNumber - entry.outboundQuantity}个`,
      severity: "HIGH",
    });
  }

  // 2. 检查outNumber和actualQuantity是否一致
  if (entry.outNumber !== entry.actualQuantity) {
    result.issues.push({
      type: "QUANTITY_MISMATCH",
      message: `出库数量(${entry.outNumber})与实际数量(${entry.actualQuantity})不一致`,
      severity: "MEDIUM",
    });
  }

  // 3. 检查托盘数量是否正确
  if (entry.palletCount !== entry.entryItems.length) {
    result.issues.push({
      type: "PALLET_COUNT_MISMATCH",
      message: `托盘计数(${entry.palletCount})与实际托盘数(${entry.entryItems.length})不一致`,
      severity: "LOW",
    });
  }

  // 4. 重新计算实际出库数量
  let calculatedQuantity = 0;
  let totalBarcodesCount = 0;
  const palletCodeSet = new Set();
  const duplicatePallets = [];
  const missingPallets = [];
  const palletQuantityMismatches = [];

  for (const item of entry.entryItems) {
    // 检查是否有重复托盘
    if (palletCodeSet.has(item.palletCode)) {
      duplicatePallets.push(item.palletCode);
    }
    palletCodeSet.add(item.palletCode);

    // 计算实际数量
    let itemQuantity = 0;
    if (item.palletBarcodes && item.palletBarcodes.length > 0) {
      itemQuantity = item.palletBarcodes.length;
      totalBarcodesCount += item.palletBarcodes.length;
    } else if (item.quantity) {
      itemQuantity = item.quantity;
    }
    calculatedQuantity += itemQuantity;

    // 检查托盘数据库中的状态
    try {
      const pallet = await MaterialPallet.findById(item.palletId);
      
      const palletDetail = {
        palletCode: item.palletCode,
        palletId: item.palletId,
        entryItemQuantity: itemQuantity,
        itemRecordedQuantity: item.quantity,
        itemBarcodesCount: item.palletBarcodes ? item.palletBarcodes.length : 0,
      };

      if (!pallet) {
        missingPallets.push(item.palletCode);
        palletDetail.status = "NOT_FOUND";
        palletDetail.issues = ["托盘在数据库中不存在"];
      } else {
        palletDetail.status = "FOUND";
        palletDetail.palletStatus = pallet.status;
        palletDetail.inWarehouseStatus = pallet.inWarehouseStatus;
        palletDetail.totalBarcodesInPallet = pallet.palletBarcodes.length;
        
        // 检查托盘中条码的出库状态
        const outWarehouseBarcodes = pallet.palletBarcodes.filter(
          b => b.outWarehouseStatus === "COMPLETED"
        );
        palletDetail.outWarehouseBarcodesCount = outWarehouseBarcodes.length;

        // 检查出库单中的条码是否在托盘中存在
        if (item.palletBarcodes && item.palletBarcodes.length > 0) {
          const missingBarcodes = [];
          const statusMismatches = [];
          
          for (const entryBarcode of item.palletBarcodes) {
            const palletBarcode = pallet.palletBarcodes.find(
              b => b.barcode === entryBarcode.barcode
            );
            
            if (!palletBarcode) {
              missingBarcodes.push(entryBarcode.barcode);
            } else if (palletBarcode.outWarehouseStatus !== "COMPLETED") {
              statusMismatches.push({
                barcode: entryBarcode.barcode,
                expectedStatus: "COMPLETED",
                actualStatus: palletBarcode.outWarehouseStatus || "PENDING",
              });
            }
          }
          
          if (missingBarcodes.length > 0) {
            palletDetail.missingBarcodes = missingBarcodes;
          }
          
          if (statusMismatches.length > 0) {
            palletDetail.statusMismatches = statusMismatches;
          }
        }

        // 检查托盘数量是否匹配
        if (item.quantity !== itemQuantity) {
          palletQuantityMismatches.push({
            palletCode: item.palletCode,
            recordedQuantity: item.quantity,
            actualQuantity: itemQuantity,
          });
        }
      }

      result.palletDetails.push(palletDetail);
    } catch (error) {
      result.palletDetails.push({
        palletCode: item.palletCode,
        palletId: item.palletId,
        status: "ERROR",
        error: error.message,
      });
    }
  }

  // 5. 检查计算数量是否与记录数量一致
  if (calculatedQuantity !== entry.outNumber) {
    result.issues.push({
      type: "CALCULATED_QUANTITY_MISMATCH",
      message: `重新计算的数量(${calculatedQuantity})与记录的出库数量(${entry.outNumber})不一致，差异${calculatedQuantity - entry.outNumber}个`,
      severity: "HIGH",
    });
  }

  // 6. 报告重复托盘
  if (duplicatePallets.length > 0) {
    result.issues.push({
      type: "DUPLICATE_PALLETS",
      message: `发现${duplicatePallets.length}个重复托盘`,
      details: duplicatePallets,
      severity: "HIGH",
    });
  }

  // 7. 报告缺失托盘
  if (missingPallets.length > 0) {
    result.issues.push({
      type: "MISSING_PALLETS",
      message: `发现${missingPallets.length}个托盘在数据库中不存在`,
      details: missingPallets,
      severity: "HIGH",
    });
  }

  // 8. 报告托盘数量不匹配
  if (palletQuantityMismatches.length > 0) {
    result.issues.push({
      type: "PALLET_QUANTITY_MISMATCHES",
      message: `发现${palletQuantityMismatches.length}个托盘的记录数量与实际数量不一致`,
      details: palletQuantityMismatches,
      severity: "MEDIUM",
    });
  }

  // 9. 汇总信息
  result.summary = {
    calculatedQuantity,
    totalBarcodesCount,
    uniquePalletCount: palletCodeSet.size,
    duplicatePalletCount: duplicatePallets.length,
    missingPalletCount: missingPallets.length,
    quantityDifference: calculatedQuantity - entry.outboundQuantity,
    hasIssues: result.issues.length > 0,
  };

  return result;
}

/**
 * 主函数：检查出库单数量
 */
async function main() {
  try {
    console.log("========================================");
    console.log("出库单数量检查脚本");
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
    let query = {};
    
    if (args.length > 0) {
      // 如果提供了出库单号，只检查该出库单
      if (args[0] === "--entryNo") {
        query.entryNo = args[1];
        console.log(`检查指定出库单: ${args[1]}\n`);
      } else if (args[0] === "--entryId") {
        query._id = args[1];
        console.log(`检查指定出库单ID: ${args[1]}\n`);
      } else if (args[0] === "--all") {
        console.log("检查所有出库单\n");
      } else if (args[0] === "--exceeded") {
        // 只检查超出数量的出库单
        console.log("检查所有超出应出库数量的出库单\n");
      } else {
        // 默认作为出库单号处理
        query.entryNo = args[0];
        console.log(`检查出库单: ${args[0]}\n`);
      }
    } else {
      // 默认只检查进行中的出库单
      query.status = { $in: ["IN_PROGRESS", "COMPLETED"] };
      console.log("检查所有进行中和已完成的出库单\n");
    }

    // 查询出库单
    const entries = await wareHouseOntry.find(query).sort({ createAt: -1 });
    
    if (entries.length === 0) {
      console.log("未找到符合条件的出库单");
      return;
    }

    console.log(`找到 ${entries.length} 个出库单，开始检查...\n`);
    console.log("========================================\n");

    const allResults = [];
    const problematicEntries = [];

    // 逐个检查出库单
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      console.log(`[${i + 1}/${entries.length}] 检查出库单: ${entry.entryNo}`);
      
      const result = await checkSingleEntry(entry);
      allResults.push(result);

      // 如果只检查超出数量的，过滤结果
      if (args[0] === "--exceeded") {
        const hasExceedIssue = result.issues.some(
          issue => issue.type === "EXCEED_QUANTITY"
        );
        if (hasExceedIssue) {
          problematicEntries.push(result);
        }
      } else if (result.issues.length > 0) {
        problematicEntries.push(result);
      }

      // 显示检查进度
      if (result.issues.length > 0) {
        console.log(`  ⚠️  发现 ${result.issues.length} 个问题`);
        result.issues.forEach(issue => {
          console.log(`     - [${issue.severity}] ${issue.message}`);
        });
      } else {
        console.log(`  ✓ 未发现问题`);
      }
      
      console.log("");
    }

    // 输出汇总报告
    console.log("========================================");
    console.log("检查汇总");
    console.log("========================================\n");
    console.log(`总检查数量: ${allResults.length}`);
    console.log(`有问题的出库单: ${problematicEntries.length}`);
    console.log(`正常的出库单: ${allResults.length - problematicEntries.length}\n`);

    if (problematicEntries.length > 0) {
      console.log("问题详情:\n");
      
      problematicEntries.forEach((result, index) => {
        console.log(`${index + 1}. 出库单号: ${result.entryNo}`);
        console.log(`   状态: ${result.status}`);
        console.log(`   应出库数量: ${result.outboundQuantity}`);
        console.log(`   实际出库数量: ${result.outNumber}`);
        console.log(`   计算数量: ${result.summary.calculatedQuantity}`);
        console.log(`   托盘数量: ${result.summary.uniquePalletCount}`);
        
        if (result.summary.quantityDifference !== 0) {
          console.log(`   ⚠️  数量差异: ${result.summary.quantityDifference > 0 ? '+' : ''}${result.summary.quantityDifference}`);
        }
        
        console.log(`   问题列表:`);
        result.issues.forEach(issue => {
          console.log(`     - [${issue.severity}] ${issue.message}`);
          if (issue.details && Array.isArray(issue.details)) {
            issue.details.forEach(detail => {
              if (typeof detail === 'string') {
                console.log(`       * ${detail}`);
              } else {
                console.log(`       * ${JSON.stringify(detail)}`);
              }
            });
          }
        });
        
        console.log("");
      });

      // 生成修复建议
      console.log("========================================");
      console.log("修复建议");
      console.log("========================================\n");
      
      problematicEntries.forEach((result, index) => {
        console.log(`${index + 1}. 出库单 ${result.entryNo}:`);
        
        const hasExceedIssue = result.issues.some(
          issue => issue.type === "EXCEED_QUANTITY"
        );
        const hasDuplicates = result.issues.some(
          issue => issue.type === "DUPLICATE_PALLETS"
        );
        const hasQuantityMismatch = result.issues.some(
          issue => issue.type === "CALCULATED_QUANTITY_MISMATCH"
        );
        
        if (hasDuplicates) {
          console.log(`   - 执行清理重复托盘操作:`);
          console.log(`     POST /api/v1/warehouse_entry/clean_duplicate_pallets`);
          console.log(`     Body: { "entryId": "${result.entryId}" }`);
        }
        
        if (hasQuantityMismatch || hasExceedIssue) {
          console.log(`   - 执行数量修复操作:`);
          console.log(`     POST /api/v1/warehouse_entry/fix_quantities`);
          console.log(`     Body: { "entryId": "${result.entryId}" }`);
        }
        
        console.log("");
      });
    }

    // 保存详细报告到文件
    const fs = require("fs");
    const reportPath = `./warehouse_entry_check_report_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify({
      checkTime: new Date(),
      totalChecked: allResults.length,
      problematicCount: problematicEntries.length,
      results: problematicEntries,
    }, null, 2));
    
    console.log(`\n详细报告已保存到: ${reportPath}`);

  } catch (error) {
    console.error("检查过程中发生错误:", error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log("\n数据库连接已关闭");
  }
}

// 运行主函数
main().catch(console.error);

