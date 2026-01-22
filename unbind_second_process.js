/**
 * 解绑指定工单中做到第二道工序的条码
 * 功能说明：
 * 1. 根据工单号查询工单
 * 2. 查找该工单下所有已完成第二道工序的条码
 * 3. 解绑第二道工序，保留第一道工序
 */

const mongoose = require("mongoose");
const MaterialProcessFlow = require("./dcMes_server/model/project/materialProcessFlow");
const ProductionPlanWorkOrder = require("./dcMes_server/model/project/productionPlanWorkOrder");
const MaterialProcessFlowService = require("./dcMes_server/services/materialProcessFlowService");

// 配置参数
const CONFIG = {
  // 工单号
  workOrderNo: "P202508231755932375363",
  // 目标工序序号（需要解绑的工序）
  targetProcessSort: 2,
  // 解绑原因
  unbindReason: "手动解绑第二道工序",
  // 操作用户ID（可以根据实际情况修改）
  userId: "SYSTEM",
 // 不会执行，只查看
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
 * 查找工单
 */
async function findWorkOrder(workOrderNo) {
  try {
    console.log(`\n🔍 正在查询工单: ${workOrderNo}`);
    const workOrder = await ProductionPlanWorkOrder.findOne({ workOrderNo });

    if (!workOrder) {
      throw new Error(`未找到工单号为 ${workOrderNo} 的工单`);
    }

    console.log(`✅ 找到工单:`);
    console.log(`   - 工单号: ${workOrder.workOrderNo}`);
    console.log(`   - 物料编码: ${workOrder.materialNumber}`);
    console.log(`   - 物料名称: ${workOrder.materialName}`);
    console.log(`   - 产线: ${workOrder.lineName}`);
    console.log(`   - 状态: ${workOrder.status}`);
    console.log(`   - 计划数量: ${workOrder.planQuantity}`);
    console.log(`   - 投入数量: ${workOrder.inputQuantity}`);
    console.log(`   - 产出数量: ${workOrder.outputQuantity}`);

    return workOrder;
  } catch (error) {
    console.error("❌ 查询工单失败:", error.message);
    throw error;
  }
}

/**
 * 查找需要解绑的条码
 * @param {string} workOrderId - 工单ID
 * @param {number} targetProcessSort - 目标工序序号
 */
async function findBarcodesToUnbind(workOrderId, targetProcessSort) {
  try {
    console.log(`\n🔍 正在查找刚好做到第 ${targetProcessSort} 道工序的条码...`);
    console.log(`   ⚠️  注意: 只有刚好做到第 ${targetProcessSort} 道工序的条码才会被处理`);
    console.log(`   ⚠️  如果后续工序已完成，将不允许解绑`);

    // 查询该工单下的所有条码流程记录
    const flowRecords = await MaterialProcessFlow.find({
      productionPlanWorkOrderId: workOrderId,
    });

    console.log(`   - 该工单下共有 ${flowRecords.length} 条流程记录`);

    // 筛选出刚好做到目标工序的条码
    const targetBarcodes = [];
    let filteredCount = 0; // 被过滤掉的条码数量

    for (const record of flowRecords) {
      // 查找目标工序节点
      const targetProcessNode = record.processNodes.find(
        (node) =>
          node.nodeType === "PROCESS_STEP" &&
          node.processSort === targetProcessSort &&
          node.status === "COMPLETED"
      );

      // 如果找到已完成的目标工序
      if (targetProcessNode) {
        // 检查是否有后续工序已完成
        const hasCompletedNextProcess = record.processNodes.some(
          (node) =>
            node.nodeType === "PROCESS_STEP" &&
            node.processSort > targetProcessSort &&
            node.status === "COMPLETED"
        );

        // 【重要】只有刚好做到目标工序，且后续工序都未完成的条码才允许解绑
        if (!hasCompletedNextProcess) {
          targetBarcodes.push({
            barcode: record.barcode,
            materialCode: record.materialCode,
            materialName: record.materialName,
            status: record.status,
            progress: record.progress,
            processStepId: targetProcessNode.processStepId,
            processName: targetProcessNode.processName,
            processCode: targetProcessNode.processCode,
            endTime: targetProcessNode.endTime,
          });
        } else {
          filteredCount++;
        }
      }
    }

    console.log(
      `✅ 找到 ${targetBarcodes.length} 个刚好做到第 ${targetProcessSort} 道工序的条码（符合解绑条件）`
    );
    if (filteredCount > 0) {
      console.log(
        `   ⚠️  过滤掉 ${filteredCount} 个条码（已做到第 ${targetProcessSort + 1} 道或更后的工序，不允许解绑）`
      );
    }

    return targetBarcodes;
  } catch (error) {
    console.error("❌ 查找条码失败:", error.message);
    throw error;
  }
}

/**
 * 执行解绑操作
 */
async function executeUnbind(barcodes, userId, reason, dryRun) {
  console.log(`\n${dryRun ? "🔍 预览模式" : "⚙️  执行模式"} - 开始解绑操作...`);

  const results = {
    success: [],
    failed: [],
  };

  for (let i = 0; i < barcodes.length; i++) {
    const item = barcodes[i];
    const progress = `[${i + 1}/${barcodes.length}]`;

    try {
      console.log(`\n${progress} 处理条码: ${item.barcode}`);
      console.log(`   - 物料: ${item.materialCode} ${item.materialName}`);
      console.log(`   - 工序: ${item.processName} (${item.processCode})`);
      console.log(
        `   - 完成时间: ${
          item.endTime ? new Date(item.endTime).toLocaleString("zh-CN") : "未知"
        }`
      );
      console.log(`   - 当前进度: ${item.progress}%`);

      if (dryRun) {
        console.log(`   ✅ [预览] 该条码符合解绑条件，将被解绑`);
        results.success.push(item.barcode);
      } else {
        // 真实执行解绑
        await MaterialProcessFlowService.unbindProcessComponents(
          item.barcode,
          item.processStepId.toString(),
          userId,
          reason,
          false, // unbindSubsequent: 不解绑后续工序
          false // fromPalletUnbind: 不是来自托盘解绑
        );
        console.log(`   ✅ 解绑成功`);
        results.success.push(item.barcode);
      }
    } catch (error) {
      console.error(`   ❌ 解绑失败: ${error.message}`);
      results.failed.push({
        barcode: item.barcode,
        error: error.message,
      });
    }
  }

  return results;
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
    console.log(`\n✅ ${dryRun ? "符合解绑条件的" : "成功解绑的"}条码:`);
    results.success.forEach((barcode, index) => {
      console.log(`   ${index + 1}. ${barcode}`);
    });
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ 解绑失败的条码:`);
    results.failed.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.barcode} - ${item.error}`);
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
    console.log("   工序解绑脚本");
    console.log("========================================");
    console.log(`配置信息:`);
    console.log(`  - 工单号: ${CONFIG.workOrderNo}`);
    console.log(`  - 目标工序: 第 ${CONFIG.targetProcessSort} 道`);
    console.log(`  - 解绑原因: ${CONFIG.unbindReason}`);
    console.log(
      `  - 执行模式: ${
        CONFIG.dryRun ? "预览模式（不会实际执行）" : "真实执行模式"
      }`
    );
    console.log("========================================");

    // 连接数据库
    await connectDB();

    // 查找工单
    const workOrder = await findWorkOrder(CONFIG.workOrderNo);

    // 查找需要解绑的条码
    const barcodes = await findBarcodesToUnbind(
      workOrder._id,
      CONFIG.targetProcessSort
    );

    if (barcodes.length === 0) {
      console.log(`\n⚠️  未找到需要解绑的条码，脚本结束`);
      return;
    }

    // 执行解绑操作
    const results = await executeUnbind(
      barcodes,
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
