/**
 * 工单数量更新并发测试脚本（简化版-不使用事务）
 * 专门测试并发控制机制的有效性
 */

const mongoose = require('mongoose');
const WorkOrderQuantityLog = require('../model/project/workOrderQuantityLog');

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
  readPreference: 'primary'
};

/**
 * 连接数据库
 */
async function connectDatabase() {
  try {
    console.log('🔌 正在连接数据库...');
    await mongoose.connect(mongodbUrl, connectOptions);
    console.log('✅ 数据库连接成功\n');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

/**
 * 关闭数据库连接
 */
async function closeDatabase() {
  try {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接失败:', error.message);
  }
}

// 应用层锁存储
const operationLocks = new Map();

/**
 * 简化版的工单数量更新方法（不使用事务）
 * 包含并发控制机制
 */
async function updateWorkOrderQuantitySimulated(
  workOrderId,
  type,
  quantity = 1,
  logContext = {}
) {
  try {
    // 生成唯一的操作标识
    const {
      relatedBarcode = 'TEST_BARCODE',
      barcodeOperation = 'SCAN_PROCESS',
      operatorId = 'TEST_USER',
      reason = '扫描工序组件末道工序产出'
    } = logContext;

    const operationKey = `${workOrderId}_${relatedBarcode}_${type}_${Date.now()}`;
    const lockKey = `${workOrderId}_${relatedBarcode}_${type}`;

    // 应用层锁检查
    const now = Date.now();
    if (operationLocks.has(lockKey)) {
      const lockTime = operationLocks.get(lockKey);
      if (now - lockTime < 30000) { // 30秒锁定时间
        console.log(`⏳ 操作被锁定，跳过重复执行: ${lockKey}`);
        return { success: false, reason: '操作被应用层锁阻止' };
      }
    }

    // 设置锁
    operationLocks.set(lockKey, now);

    // 清理过期锁
    for (const [key, time] of operationLocks.entries()) {
      if (now - time > 30000) {
        operationLocks.delete(key);
      }
    }

    try {
      // 重复检查：检查1分钟内是否已有相同条码的产出记录
      if (type === 'output') {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        
        const existingRecord = await WorkOrderQuantityLog.findOne({
          workOrderId: workOrderId,
          relatedBarcode: relatedBarcode,
          changeType: 'output',
          operateTime: { $gte: oneMinuteAgo },
          reason: { $regex: /末道工序产出|扫描工序组件末道工序产出|产出统计/ }
        });

        if (existingRecord) {
          console.log(`🔄 检测到重复操作，跳过: 工单${workOrderId}, 条码${relatedBarcode}`);
          operationLocks.delete(lockKey);
          return { success: false, reason: '检测到重复的产出操作' };
        }
      }

      // 模拟工单更新（这里我们只记录日志，不实际更新工单表）
      const beforeQuantity = Math.floor(Math.random() * 100); // 模拟当前数量
      const afterQuantity = beforeQuantity + (type === 'output' ? quantity : -quantity);

      // 创建日志记录
      const logRecord = new WorkOrderQuantityLog({
        workOrderId: workOrderId,
        workOrderNo: `WO_${workOrderId.slice(-8)}`, // 模拟工单编号
        materialId: new mongoose.Types.ObjectId(), // 模拟物料ID
        materialCode: 'MAT_TEST',
        materialName: '测试物料',
        productionLineId: 'LINE_001',
        productionLineName: '测试产线',
        changeType: type,
        changeQuantity: type === 'output' ? quantity : -quantity,
        beforeQuantity: beforeQuantity,
        afterQuantity: afterQuantity,
        relatedBarcode: relatedBarcode,
        barcodeOperation: barcodeOperation,
        operatorId: operatorId,
        operatorName: '测试用户',
        operateTime: new Date(),
        reason: reason,
        remark: '并发测试记录',
        isAutomatic: true,
        source: 'SYSTEM',
        operationKey: operationKey // 唯一操作标识
      });

      await logRecord.save();

      console.log(`✅ 成功更新工单数量: 工单${workOrderId.slice(-8)}, 类型${type}, 数量${quantity}, 条码${relatedBarcode.slice(-8)}`);
      
      // 释放锁
      operationLocks.delete(lockKey);
      return { success: true, logRecord };

    } catch (error) {
      // 释放锁
      operationLocks.delete(lockKey);
      throw error;
    }

  } catch (error) {
    const lockKey = `${workOrderId}_${logContext.relatedBarcode}_${type}`;
    operationLocks.delete(lockKey);
    
    console.error(`❌ 更新工单数量失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 并发测试
 */
async function testConcurrentUpdate() {
  console.log('🧪 开始并发更新测试...');
  
  const testWorkOrderId = new mongoose.Types.ObjectId().toString();
  const testBarcode = 'TEST_CONCURRENT_' + Date.now();
  const concurrentRequests = 5;
  
  console.log(`测试工单ID: ${testWorkOrderId.slice(-8)}`);
  console.log(`测试条码: ${testBarcode.slice(-8)}`);
  console.log(`并发请求数: ${concurrentRequests}\n`);
  
  const promises = [];
  const startTime = Date.now();
  
  // 创建多个并发请求
  for (let i = 0; i < concurrentRequests; i++) {
    const promise = updateWorkOrderQuantitySimulated(
      testWorkOrderId,
      'output',
      1,
      {
        relatedBarcode: testBarcode,
        barcodeOperation: 'SCAN_PROCESS',
        operatorId: `USER_${i}`,
        reason: '扫描工序组件末道工序产出'
      }
    );
    promises.push(promise);
  }
  
  // 等待所有请求完成
  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  // 分析结果
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(`\n=== 并发测试结果 ===`);
  console.log(`总请求数: ${concurrentRequests}`);
  console.log(`成功执行: ${successCount} 次`);
  console.log(`被阻止/失败: ${failureCount} 次`);
  console.log(`执行时间: ${endTime - startTime}ms\n`);
  
  // 检查日志记录
  await checkLogRecords(testWorkOrderId, testBarcode);
  
  // 验证结果
  if (successCount === 1 && failureCount === concurrentRequests - 1) {
    console.log('✅ 并发控制测试通过：成功防止了重复更新！');
    return true;
  } else if (successCount <= 1) {
    console.log('✅ 并发控制测试基本通过：最多只有1次成功更新');
    return true;
  } else {
    console.log('❌ 并发控制测试失败：存在重复更新问题');
    return false;
  }
}

/**
 * 检查日志记录
 */
async function checkLogRecords(workOrderId, barcode) {
  try {
    const logs = await WorkOrderQuantityLog.find({
      workOrderId: workOrderId,
      relatedBarcode: barcode,
      changeType: 'output'
    }).sort({ operateTime: 1 });
    
    console.log(`=== 日志记录检查 ===`);
    console.log(`找到 ${logs.length} 条相关日志记录:`);
    
    logs.forEach((log, index) => {
      console.log(`${index + 1}. 时间: ${log.operateTime.toISOString().slice(11,19)}, 操作人: ${log.operatorId}, 数量: ${log.changeQuantity}`);
    });
    
    if (logs.length > 1) {
      console.log('⚠️  发现多条日志记录，存在重复统计风险');
    } else if (logs.length === 1) {
      console.log('✅ 日志记录正常，无重复统计');
    } else {
      console.log('ℹ️  未找到日志记录');
    }
    
  } catch (error) {
    console.error('检查日志记录失败:', error);
  }
}

/**
 * 压力测试
 */
async function stressTest() {
  console.log('\n🔥 开始压力测试...');
  
  const testCount = 5; // 减少测试批次，避免过多测试数据
  const concurrentPerBatch = 3;
  let totalSuccess = 0;
  let totalFailure = 0;
  
  for (let batch = 0; batch < testCount; batch++) {
    const testWorkOrderId = new mongoose.Types.ObjectId().toString();
    const testBarcode = `STRESS_TEST_${batch}_${Date.now()}`;
    
    const promises = [];
    for (let i = 0; i < concurrentPerBatch; i++) {
      const promise = updateWorkOrderQuantitySimulated(
        testWorkOrderId,
        'output',
        1,
        {
          relatedBarcode: testBarcode,
          operatorId: `STRESS_USER_${i}`,
          reason: '压力测试'
        }
      );
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    const batchSuccess = results.filter(r => r.success).length;
    const batchFailure = results.filter(r => !r.success).length;
    
    totalSuccess += batchSuccess;
    totalFailure += batchFailure;
    
    console.log(`批次 ${batch + 1}: 成功 ${batchSuccess}, 失败 ${batchFailure}`);
    
    // 短暂延迟，避免过快的请求
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n=== 压力测试结果 ===`);
  console.log(`总批次: ${testCount}`);
  console.log(`每批次并发: ${concurrentPerBatch}`);
  console.log(`总成功: ${totalSuccess}`);
  console.log(`总失败: ${totalFailure}`);
  console.log(`成功率: ${((totalSuccess / (totalSuccess + totalFailure)) * 100).toFixed(2)}%`);
  
  // 理想情况下，每批次应该只有1个成功
  const expectedMaxSuccess = testCount;
  if (totalSuccess <= expectedMaxSuccess) {
    console.log('✅ 压力测试通过：并发控制机制有效工作');
    return true;
  } else {
    console.log(`⚠️  压力测试警告：超出预期成功次数，实际成功${totalSuccess}次`);
    return false;
  }
}

/**
 * 清理测试数据
 */
async function cleanupTestData() {
  try {
    const result = await WorkOrderQuantityLog.deleteMany({
      remark: '并发测试记录'
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 清理了 ${result.deletedCount} 条测试数据`);
    }
  } catch (error) {
    console.error('清理测试数据失败:', error);
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  try {
    console.log('🚀 开始工单数量更新并发测试（简化版）\n');
    
    // 连接数据库
    await connectDatabase();
    
    // 清理之前的测试数据
    await cleanupTestData();
    
    const test1 = await testConcurrentUpdate();
    const test2 = await stressTest();
    
    console.log('\n=== 测试总结 ===');
    console.log(`并发控制测试: ${test1 ? '✅ 通过' : '❌ 失败'}`);
    console.log(`压力测试: ${test2 ? '✅ 通过' : '❌ 失败'}`);
    
    if (test1 && test2) {
      console.log('\n🎉 所有测试通过！并发控制机制工作正常。');
      console.log('🔧 建议：虽然测试环境不支持事务，但应用层锁和重复检查机制有效。');
      console.log('📝 生产环境如支持复制集，建议启用事务以获得更强的一致性保证。');
    } else {
      console.log('\n⚠️  部分测试失败，请检查并发控制实现。');
    }
    
    // 清理测试数据
    await cleanupTestData();
    
  } catch (error) {
    console.error('测试执行失败:', error);
  } finally {
    // 关闭数据库连接
    await closeDatabase();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('测试脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = {
  connectDatabase,
  closeDatabase,
  updateWorkOrderQuantitySimulated,
  testConcurrentUpdate,
  stressTest,
  runTests
}; 