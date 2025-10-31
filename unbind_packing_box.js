/**
 * 根据包装箱条码解绑装箱工序
 * 功能说明：
 * 1. 根据提供的包装箱条码列表
 * 2. 查找使用了这些包装箱条码的主条码（通过 processNodes.barcode 和 isPackingBox=true）
 * 3. 解绑这些主条码的装箱工序
 */

const mongoose = require("mongoose");
const MaterialProcessFlow = require("./dcMes_server/model/project/materialProcessFlow");
const MaterialProcessFlowService = require("./dcMes_server/services/materialProcessFlowService");

// 配置参数
const CONFIG = {
  // 包装箱条码列表（可以添加多个）
  packingBoxBarcodes: [
    "1001998510001141",
    "1001998510001139",
    "1001998510001132",
    "1001998510001128",
    "1001998510001124",
    "1001998510001140",
    "1001998510001133",
    "1001998510001127",
    "1001998510001123",
    "1001998510001134",
    "1001998510001126",
    "1001998510001016",
    "1001998510001142",
    "1001998510001135",
    "1001998510001129",
    "1001998510001015",
    "1001998510001143",
    "1001998510001130",
    "1001998510001122",
    "1001998510001138",
    "1001998510001137",
    "1001998510001131",
    "1001998510001125",
    "1001998510001144",
    "1001998510001141",
    "1001998510001146",
    "1001998510001149",
    "1001998510001145",
    "1001998510001147",
    "1001998510001148",
    // "添加更多包装箱条码...",
  ],
  // 解绑原因
  unbindReason: "手动解绑包装箱工序",
  // 操作用户ID
  userId: "SYSTEM",
  // 预览模式：true=只查看不执行，false=真实执行
  dryRun: true,
};

// 数据库连接配置
const DB_CONFIG = {
  host: "localhost",
  port: 27017,
  database: "dcMes",
  // 如果有用户名密码，请取消下面的注释并填写
  // username: "your_username",
  // password: "your_password",
};

/**
 * 连接数据库
 */
async function connectDB() {
  try {
    let connectionString;
    if (DB_CONFIG.username && DB_CONFIG.password) {
      connectionString = `mongodb://${DB_CONFIG.username}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;
    } else {
      connectionString = `mongodb://${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;
    }

    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ 数据库连接成功");
  } catch (error) {
    console.error("❌ 数据库连接失败:", error.message);
    throw error;
  }
}

/**
 * 根据包装箱条码查找主条码及其装箱工序
 * @param {string} packingBoxBarcode - 包装箱条码
 */
async function findMainBarcodesWithPackingBox(packingBoxBarcode) {
  try {
    console.log(
      `\n🔍 正在查找使用包装箱条码 [${packingBoxBarcode}] 的主条码...`
    );

    // 查询条件：processNodes 中有匹配的包装箱条码且 isPackingBox 为 true
    const flowRecords = await MaterialProcessFlow.find({
      processNodes: {
        $elemMatch: {
          barcode: packingBoxBarcode,
          isPackingBox: true,
        },
      },
    });

    console.log(`   - 找到 ${flowRecords.length} 条主条码记录`);

    const results = [];

    // 遍历每条记录，提取包装箱工序信息
    for (const record of flowRecords) {
      // 查找所有匹配的包装箱节点（可能有多个）
      const packingBoxNodes = record.processNodes.filter(
        (node) =>
          node.barcode === packingBoxBarcode &&
          node.isPackingBox === true &&
          node.status === "COMPLETED" // 只处理已完成的工序
      );

      if (packingBoxNodes.length > 0) {
        // 对于每个包装箱节点，查找其对应的装箱工序
        for (const boxNode of packingBoxNodes) {
          // 根据 parentNodeId 或同层级查找装箱工序节点
          const packingProcessNode = findPackingProcessNode(
            record.processNodes,
            boxNode
          );

          if (packingProcessNode) {
            results.push({
              mainBarcode: record.barcode,
              materialCode: record.materialCode,
              materialName: record.materialName,
              status: record.status,
              progress: record.progress,
              workOrderId: record.productionPlanWorkOrderId,
              packingBoxBarcode: packingBoxBarcode,
              packingBoxNode: {
                nodeId: boxNode.nodeId,
                materialCode: boxNode.materialCode,
                materialName: boxNode.materialName,
                scanTime: boxNode.scanTime,
              },
              packingProcessNode: {
                processStepId: packingProcessNode.processStepId,
                processName: packingProcessNode.processName,
                processCode: packingProcessNode.processCode,
                processSort: packingProcessNode.processSort,
                startTime: packingProcessNode.startTime,
                endTime: packingProcessNode.endTime,
                status: packingProcessNode.status,
              },
            });
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error(
      `❌ 查找包装箱条码 [${packingBoxBarcode}] 对应的主条码失败:`,
      error.message
    );
    throw error;
  }
}

/**
 * 查找包装箱节点对应的装箱工序节点
 * 逻辑：包装箱节点的 parentNodeId 通常指向装箱工序节点
 * @param {Array} processNodes - 所有工序节点
 * @param {Object} boxNode - 包装箱节点
 */
function findPackingProcessNode(processNodes, boxNode) {
  // 方法1：通过 parentNodeId 查找
  if (boxNode.parentNodeId) {
    const processNode = processNodes.find(
      (node) =>
        node.nodeId === boxNode.parentNodeId &&
        node.nodeType === "PROCESS_STEP" &&
        node.status === "COMPLETED"
    );
    if (processNode) {
      return processNode;
    }
  }

  // 方法2：查找同层级的工序节点（如果没有 parentNodeId）
  // 通常包装箱节点和装箱工序在同一层级
  const processNode = processNodes.find(
    (node) =>
      node.nodeType === "PROCESS_STEP" &&
      node.level === boxNode.level &&
      node.status === "COMPLETED" &&
      // 可以根据工序名称或类型进一步筛选
      (node.processName?.includes("装箱") ||
        node.processName?.includes("包装") ||
        node.processType === "PACKING")
  );

  return processNode || null;
}

/**
 * 批量查找所有包装箱条码对应的主条码
 */
async function findAllMainBarcodes(packingBoxBarcodes) {
  const allResults = [];
  const summary = {
    totalPackingBoxes: packingBoxBarcodes.length,
    processedPackingBoxes: 0,
    foundMainBarcodes: 0,
    notFoundPackingBoxes: [],
  };

  for (const barcode of packingBoxBarcodes) {
    const results = await findMainBarcodesWithPackingBox(barcode);

    if (results.length > 0) {
      allResults.push(...results);
      summary.foundMainBarcodes += results.length;
      summary.processedPackingBoxes++;
      console.log(`   ✅ 找到 ${results.length} 个主条码`);
    } else {
      summary.notFoundPackingBoxes.push(barcode);
      console.log(`   ⚠️  未找到使用该包装箱的主条码`);
    }
  }

  return { results: allResults, summary };
}

/**
 * 执行解绑操作
 */
async function executeUnbind(records, userId, reason, dryRun) {
  console.log(
    `\n${dryRun ? "🔍 预览模式" : "⚙️  执行模式"} - 开始解绑装箱工序...`
  );

  const results = {
    success: [],
    failed: [],
  };

  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    const progress = `[${i + 1}/${records.length}]`;

    try {
      console.log(`\n${progress} 处理主条码: ${item.mainBarcode}`);
      console.log(`   - 物料: ${item.materialCode} ${item.materialName}`);
      console.log(`   - 包装箱条码: ${item.packingBoxBarcode}`);
      console.log(
        `   - 装箱工序: ${item.packingProcessNode.processName} (${item.packingProcessNode.processCode})`
      );
      console.log(
        `   - 工序序号: 第 ${item.packingProcessNode.processSort} 道`
      );
      console.log(
        `   - 完成时间: ${
          item.packingProcessNode.endTime
            ? new Date(item.packingProcessNode.endTime).toLocaleString("zh-CN")
            : "未知"
        }`
      );
      console.log(`   - 当前进度: ${item.progress}%`);

      if (dryRun) {
        console.log(`   ✅ [预览] 该条码符合解绑条件，将解绑装箱工序`);
        results.success.push({
          mainBarcode: item.mainBarcode,
          packingBoxBarcode: item.packingBoxBarcode,
        });
      } else {
        // 真实执行解绑
        await MaterialProcessFlowService.unbindProcessComponents(
          item.mainBarcode,
          item.packingProcessNode.processStepId.toString(),
          userId,
          reason,
          false, // unbindSubsequent: 不解绑后续工序
          false // fromPalletUnbind: 不是来自托盘解绑
        );
        console.log(`   ✅ 解绑成功`);
        results.success.push({
          mainBarcode: item.mainBarcode,
          packingBoxBarcode: item.packingBoxBarcode,
        });
      }
    } catch (error) {
      console.error(`   ❌ 解绑失败: ${error.message}`);
      results.failed.push({
        mainBarcode: item.mainBarcode,
        packingBoxBarcode: item.packingBoxBarcode,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * 打印查询摘要
 */
function printQuerySummary(summary) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 查询摘要`);
  console.log(`${"=".repeat(60)}`);
  console.log(`📦 提供的包装箱条码数量: ${summary.totalPackingBoxes}`);
  console.log(`✅ 成功匹配的包装箱: ${summary.processedPackingBoxes}`);
  console.log(`🔍 找到的主条码数量: ${summary.foundMainBarcodes}`);
  console.log(`⚠️  未找到匹配的包装箱: ${summary.notFoundPackingBoxes.length}`);

  if (summary.notFoundPackingBoxes.length > 0) {
    console.log(`\n⚠️  以下包装箱条码未找到对应的主条码:`);
    summary.notFoundPackingBoxes.forEach((barcode, index) => {
      console.log(`   ${index + 1}. ${barcode}`);
    });
  }
  console.log(`${"=".repeat(60)}`);
}

/**
 * 打印执行结果
 */
function printResults(results, dryRun) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${dryRun ? "📊 预览结果" : "📊 执行结果"}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`✅ 成功: ${results.success.length} 个`);
  console.log(`❌ 失败: ${results.failed.length} 个`);
  console.log(`${"=".repeat(60)}`);

  if (results.success.length > 0) {
    console.log(`\n✅ ${dryRun ? "符合解绑条件的" : "成功解绑的"}装箱工序:`);
    results.success.forEach((item, index) => {
      console.log(
        `   ${index + 1}. 主条码: ${item.mainBarcode} | 包装箱: ${
          item.packingBoxBarcode
        }`
      );
    });
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ 解绑失败的记录:`);
    results.failed.forEach((item, index) => {
      console.log(
        `   ${index + 1}. 主条码: ${item.mainBarcode} | 包装箱: ${
          item.packingBoxBarcode
        }`
      );
      console.log(`      错误: ${item.error}`);
    });
  }

  if (dryRun) {
    console.log(`\n💡 提示: 当前为预览模式，未实际执行解绑操作`);
    console.log(`   如需真实执行，请将 CONFIG.dryRun 设置为 false`);
  } else {
    console.log(`\n✅ 解绑操作已完成！`);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log("========================================");
    console.log("   包装箱工序解绑脚本");
    console.log("========================================");
    console.log(`配置信息:`);
    console.log(`  - 包装箱条码数量: ${CONFIG.packingBoxBarcodes.length}`);
    console.log(`  - 解绑原因: ${CONFIG.unbindReason}`);
    console.log(
      `  - 执行模式: ${
        CONFIG.dryRun ? "预览模式（不会实际执行）" : "真实执行模式"
      }`
    );
    console.log("========================================");

    // 验证配置
    if (CONFIG.packingBoxBarcodes.length === 0) {
      throw new Error("请在 CONFIG.packingBoxBarcodes 中添加包装箱条码");
    }

    // 连接数据库
    await connectDB();

    // 查找所有包装箱条码对应的主条码
    const { results: records, summary } = await findAllMainBarcodes(
      CONFIG.packingBoxBarcodes
    );

    // 打印查询摘要
    printQuerySummary(summary);

    if (records.length === 0) {
      console.log(`\n⚠️  未找到需要解绑的记录，脚本结束`);
      return;
    }

    // 执行解绑操作
    const results = await executeUnbind(
      records,
      CONFIG.userId,
      CONFIG.unbindReason,
      CONFIG.dryRun
    );

    // 打印结果
    printResults(results, CONFIG.dryRun);
  } catch (error) {
    console.error("\n❌ 脚本执行失败:", error);
    console.error(error.stack);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log("\n👋 数据库连接已关闭");
  }
}

// 执行主函数
main().catch((error) => {
  console.error("❌ 未捕获的错误:", error);
  process.exit(1);
});
