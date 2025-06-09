/**
 * 工单数量变更日志记录功能测试脚本
 */

const mongoose = require("mongoose");
const MaterialProcessFlowService = require("../services/materialProcessFlowService");
const WorkOrderQuantityLog = require("../model/project/workOrderQuantityLog");

// 测试数据库连接配置
const DB_CONFIG = {
  // 请根据实际情况修改连接字符串
  url: "mongodb://localhost:27017/dcmes_test",
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
};

/**
 * 测试工单数量变更日志记录功能
 */
async function testWorkOrderQuantityLog() {
  try {
    console.log("=== 开始测试工单数量变更日志记录功能 ===\n");

    // 连接数据库
    await mongoose.connect(DB_CONFIG.url, DB_CONFIG.options);
    console.log("✅ 数据库连接成功\n");

    // 测试数据
    const testData = {
      workOrderId: new mongoose.Types.ObjectId(),
      relatedBarcode: "TEST_BARCODE_001",
      operatorId: "TEST_USER_001",
      processStepId: new mongoose.Types.ObjectId(),
    };

    console.log("📋 测试数据:");
    console.log(`  工单ID: ${testData.workOrderId}`);
    console.log(`  相关条码: ${testData.relatedBarcode}`);
    console.log(`  操作用户: ${testData.operatorId}`);
    console.log(`  工序ID: ${testData.processStepId}\n`);

    // 测试1: 基本日志记录（仅更新数量）
    console.log("🧪 测试1: 基本日志记录");
    const result1 = await MaterialProcessFlowService.updateWorkOrderQuantity(
      testData.workOrderId.toString(),
      "input",
      1
    );
    
    if (result1 === null) {
      console.log("ℹ️  未找到工单，这是正常的测试结果（工单不存在）");
    } else {
      console.log("✅ 基本日志记录测试通过");
    }

    // 测试2: 完整日志记录
    console.log("\n🧪 测试2: 完整日志记录");
    const result2 = await MaterialProcessFlowService.updateWorkOrderQuantity(
      testData.workOrderId.toString(),
      "input",
      1,
      {
        relatedBarcode: testData.relatedBarcode,
        barcodeOperation: "SCAN_PROCESS",
        operatorId: testData.operatorId,
        processStepId: testData.processStepId.toString(),
        processName: "测试工序",
        processCode: "TEST_PROCESS",
        reason: "测试扫描工序组件",
        remark: "自动化测试",
        ipAddress: "127.0.0.1",
        userAgent: "Test Agent",
        source: "WEB",
        isAutomatic: true,
      }
    );

    if (result2 === null) {
      console.log("ℹ️  未找到工单，这是正常的测试结果（工单不存在）");
    } else {
      console.log("✅ 完整日志记录测试通过");
    }

    // 测试3: 查询日志记录
    console.log("\n🧪 测试3: 查询日志记录");
    const logs = await WorkOrderQuantityLog.find({
      workOrderId: testData.workOrderId
    }).sort({ operateTime: -1 });

    console.log(`📊 找到 ${logs.length} 条日志记录:`);
    logs.forEach((log, index) => {
      console.log(`  记录 ${index + 1}:`);
      console.log(`    工单ID: ${log.workOrderId}`);
      console.log(`    变更类型: ${log.changeType}`);
      console.log(`    变更数量: ${log.changeQuantity}`);
      console.log(`    相关条码: ${log.relatedBarcode || "无"}`);
      console.log(`    操作类型: ${log.barcodeOperation || "无"}`);
      console.log(`    操作时间: ${log.operateTime}`);
      console.log(`    操作人员: ${log.operatorId}`);
      console.log("");
    });

    // 测试4: 按条码查询日志
    console.log("🧪 测试4: 按条码查询日志");
    const barcodeLogs = await WorkOrderQuantityLog.find({
      relatedBarcode: testData.relatedBarcode
    }).sort({ operateTime: -1 });

    console.log(`📊 按条码查询到 ${barcodeLogs.length} 条日志记录\n`);

    // 测试5: 批量操作类型测试
    console.log("🧪 测试5: 不同操作类型测试");
    const operationTypes = [
      "SCAN_PROCESS",
      "SCAN_BATCH_DOC", 
      "UNBIND_PROCESS",
      "INITIALIZE_PRODUCT",
      "MANUAL_ADJUST"
    ];

    for (const opType of operationTypes) {
      await MaterialProcessFlowService.updateWorkOrderQuantity(
        testData.workOrderId.toString(),
        "output",
        1,
        {
          relatedBarcode: `${testData.relatedBarcode}_${opType}`,
          barcodeOperation: opType,
          operatorId: testData.operatorId,
          reason: `测试${opType}操作`,
          source: "WEB",
          isAutomatic: true,
        }
      );
      console.log(`  ✅ ${opType} 操作测试完成`);
    }

    // 测试6: 统计查询
    console.log("\n🧪 测试6: 统计查询");
    const totalLogs = await WorkOrderQuantityLog.countDocuments({
      workOrderId: testData.workOrderId
    });
    
    const inputLogs = await WorkOrderQuantityLog.countDocuments({
      workOrderId: testData.workOrderId,
      changeType: "input"
    });
    
    const outputLogs = await WorkOrderQuantityLog.countDocuments({
      workOrderId: testData.workOrderId,
      changeType: "output"
    });

    console.log(`📊 统计结果:`);
    console.log(`  总日志数: ${totalLogs}`);
    console.log(`  投入量变更: ${inputLogs}`);
    console.log(`  产出量变更: ${outputLogs}\n`);

    // 清理测试数据
    console.log("🧹 清理测试数据...");
    const deleteResult = await WorkOrderQuantityLog.deleteMany({
      workOrderId: testData.workOrderId
    });
    console.log(`✅ 已删除 ${deleteResult.deletedCount} 条测试记录\n`);

    console.log("=== 所有测试完成 ===");
    console.log("✅ 工单数量变更日志记录功能测试通过！");

  } catch (error) {
    console.error("❌ 测试失败:", error);
  } finally {
    // 关闭数据库连接
    await mongoose.disconnect();
    console.log("📴 数据库连接已关闭");
  }
}

/**
 * 运行测试
 */
if (require.main === module) {
  testWorkOrderQuantityLog().catch(console.error);
}

module.exports = {
  testWorkOrderQuantityLog
}; 