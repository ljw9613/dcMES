/**
 * 并发测试脚本
 * 用于测试修复后的updateWorkOrderQuantity方法是否能正确处理并发请求
 */

const MaterialProcessFlowService = require('../services/materialProcessFlowService');
const mongoose = require('mongoose');
const WorkOrderQuantityLog = require('../model/project/workOrderQuantityLog');

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

/**
 * 模拟并发更新产出数量
 */
async function testConcurrentOutputUpdate() {
  console.log('开始并发测试...');
  
  const testWorkOrderId = '507f1f77bcf86cd799439011'; // 替换为实际的工单ID
  const testBarcode = 'TEST_BARCODE_' + Date.now();
  const concurrentRequests = 5; // 同时发起5个请求
  
  console.log(`测试场景：${concurrentRequests}个并发请求同时更新同一个条码的产出数量`);
  console.log(`测试工单ID: ${testWorkOrderId}`);
  console.log(`测试条码: ${testBarcode}`);
  
  // 记录开始时间
  const startTime = Date.now();
  
  // 创建并发请求数组
  const promises = [];
  for (let i = 0; i < concurrentRequests; i++) {
    const promise = MaterialProcessFlowService.updateWorkOrderQuantity(
      testWorkOrderId,
      'output',
      1,
      {
        relatedBarcode: testBarcode,
        barcodeOperation: 'SCAN_PROCESS',
        operatorId: `TEST_USER_${i}`,
        processStepId: 'test_process_step',
        processName: '测试工序',
        processCode: 'TEST_001',
        reason: '并发测试产出',
        source: 'TEST',
        isAutomatic: true,
      }
    );
    promises.push(promise);
  }
  
  try {
    // 等待所有请求完成
    const results = await Promise.allSettled(promises);
    
    const endTime = Date.now();
    console.log(`测试完成，耗时: ${endTime - startTime}ms`);
    
    // 分析结果
    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null);
    const failed = results.filter(r => r.status === 'rejected');
    const skipped = results.filter(r => r.status === 'fulfilled' && r.value === null);
    
    console.log('\n=== 测试结果分析 ===');
    console.log(`成功更新: ${successful.length}次`);
    console.log(`跳过重复: ${skipped.length}次`);
    console.log(`执行失败: ${failed.length}次`);
    
    if (successful.length === 1 && skipped.length === concurrentRequests - 1) {
      console.log('✅ 测试通过：成功防止了重复更新！');
    } else if (successful.length > 1) {
      console.log('❌ 测试失败：存在重复更新问题！');
    } else {
      console.log('⚠️  测试异常：所有请求都失败了');
    }
    
    // 打印详细结果
    console.log('\n=== 详细结果 ===');
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value) {
          console.log(`请求${index + 1}: 成功更新，新产出量: ${result.value.outputQuantity}`);
        } else {
          console.log(`请求${index + 1}: 跳过重复操作`);
        }
      } else {
        console.log(`请求${index + 1}: 失败 - ${result.reason}`);
      }
    });
    
    // 查询最终的日志记录
    await checkLogRecords(testWorkOrderId, testBarcode);
    
  } catch (error) {
    console.error('并发测试执行失败:', error);
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
    
    console.log('\n=== 日志记录检查 ===');
    console.log(`找到${logs.length}条相关日志记录:`);
    
    logs.forEach((log, index) => {
      console.log(`${index + 1}. 操作时间: ${log.operateTime}, 操作人: ${log.operatorId}, 数量变更: ${log.changeQuantity}`);
    });
    
    if (logs.length > 1) {
      console.log('⚠️  发现多条日志记录，请检查是否存在重复统计');
    } else if (logs.length === 1) {
      console.log('✅ 日志记录正常，无重复统计');
    }
    
  } catch (error) {
    console.error('检查日志记录失败:', error);
  }
}

/**
 * 测试应用层锁机制
 */
async function testApplicationLock() {
  console.log('\n=== 测试应用层锁机制 ===');
  
  const testWorkOrderId = '507f1f77bcf86cd799439012';
  const testBarcode = 'LOCK_TEST_' + Date.now();
  
  // 快速连续发起请求（间隔50ms）
  const promises = [];
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const promise = MaterialProcessFlowService.updateWorkOrderQuantity(
        testWorkOrderId,
        'output',
        1,
        {
          relatedBarcode: testBarcode,
          barcodeOperation: 'SCAN_PROCESS',
          operatorId: `LOCK_USER_${i}`,
          reason: '锁机制测试',
          source: 'TEST',
        }
      );
      promises.push(promise);
    }, i * 50);
  }
  
  try {
    await new Promise(resolve => setTimeout(resolve, 500)); // 等待所有请求启动
    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    const skipped = results.filter(r => r.status === 'fulfilled' && r.value === null).length;
    
    console.log(`锁机制测试结果: 成功${successful}次, 跳过${skipped}次`);
    
  } catch (error) {
    console.error('锁机制测试失败:', error);
  }
}

/**
 * 压力测试
 */
async function stressTest() {
  console.log('\n=== 压力测试 ===');
  
  const concurrentBatches = 10; // 10个批次
  const requestsPerBatch = 3;   // 每批次3个请求
  
  console.log(`压力测试: ${concurrentBatches}个批次，每批次${requestsPerBatch}个并发请求`);
  
  const startTime = Date.now();
  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  
  for (let batch = 0; batch < concurrentBatches; batch++) {
    const testBarcode = `STRESS_${batch}_${Date.now()}`;
    const promises = [];
    
    for (let i = 0; i < requestsPerBatch; i++) {
      const promise = MaterialProcessFlowService.updateWorkOrderQuantity(
        '507f1f77bcf86cd799439013',
        'output',
        1,
        {
          relatedBarcode: testBarcode,
          barcodeOperation: 'SCAN_PROCESS',
          operatorId: `STRESS_USER_${batch}_${i}`,
          reason: '压力测试',
          source: 'TEST',
        }
      );
      promises.push(promise);
    }
    
    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    const skipped = results.filter(r => r.status === 'fulfilled' && r.value === null).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    totalSuccess += successful;
    totalSkipped += skipped;
    totalFailed += failed;
    
    console.log(`批次${batch + 1}: 成功${successful}, 跳过${skipped}, 失败${failed}`);
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const endTime = Date.now();
  
  console.log('\n=== 压力测试总结 ===');
  console.log(`总耗时: ${endTime - startTime}ms`);
  console.log(`总成功: ${totalSuccess}次`);
  console.log(`总跳过: ${totalSkipped}次`);
  console.log(`总失败: ${totalFailed}次`);
  console.log(`预期成功率: ${(totalSuccess / concurrentBatches * 100).toFixed(1)}%`);
}

/**
 * 主测试函数
 */
async function runTests() {
  try {
    console.log('🚀 开始并发安全性测试\n');
    
    // 连接数据库
    await connectDatabase();
    
    await testConcurrentOutputUpdate();
    await testApplicationLock();
    await stressTest();
    
    console.log('\n✅ 所有测试完成');
    
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
  testConcurrentOutputUpdate,
  testApplicationLock,
  stressTest,
  runTests
}; 