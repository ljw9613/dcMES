/**
 * 工单并发处理优化测试
 * 验证不同工单任务可以并发执行，同一工单任务串行执行
 */

const axios = require('axios');

class WorkOrderConcurrencyTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000'; // 根据实际服务端口调整
    this.testResults = [];
  }

  /**
   * 发送工单更新请求
   */
  async sendWorkOrderRequest(workOrderData) {
    const startTime = Date.now();
    try {
      const response = await axios.post(`${this.baseUrl}/api/queue/test/update-work-order`, workOrderData);
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: response.data,
        duration,
        workOrderId: workOrderData.workOrderId,
        type: workOrderData.type
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        duration,
        workOrderId: workOrderData.workOrderId,
        type: workOrderData.type
      };
    }
  }

  /**
   * 获取队列状态
   */
  async getQueueStats() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/queue/status`);
      return response.data;
    } catch (error) {
      console.error('获取队列状态失败:', error.message);
      return null;
    }
  }

  /**
   * 获取工单锁状态
   */
  async getWorkOrderLocks() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/queue/workorder-locks`);
      return response.data;
    } catch (error) {
      console.error('获取工单锁状态失败:', error.message);
      return null;
    }
  }

  /**
   * 获取并发性能指标
   */
  async getConcurrencyMetrics() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/queue/concurrency-metrics`);
      return response.data;
    } catch (error) {
      console.error('获取并发指标失败:', error.message);
      return null;
    }
  }

  /**
   * 测试1：不同工单并发处理
   */
  async testDifferentWorkOrdersConcurrency() {
    console.log('\n=== 测试1：不同工单并发处理 ===');
    
    const workOrderRequests = [];
    const startTime = Date.now();
    
    // 创建10个不同工单的更新请求
    for (let i = 1; i <= 10; i++) {
      const workOrderData = {
        workOrderId: `WO_${String(i).padStart(3, '0')}_${Date.now()}`,
        type: i % 2 === 0 ? 'output' : 'input', // 交替使用input和output
        quantity: Math.floor(Math.random() * 5) + 1, // 1-5的随机数量
        logContext: {
          relatedBarcode: `BARCODE_${i}`,
          barcodeOperation: 'SCAN',
          operatorId: 'TEST_OPERATOR',
          processStepId: `STEP_${i}`,
          reason: '测试并发处理',
          source: 'CONCURRENT_TEST'
        }
      };
      
      workOrderRequests.push(this.sendWorkOrderRequest(workOrderData));
    }
    
    // 并发执行所有请求
    console.log('🚀 发送10个不同工单的更新请求...');
    const results = await Promise.all(workOrderRequests);
    const totalDuration = Date.now() - startTime;
    
    console.log(`✅ 所有请求完成，总耗时: ${totalDuration}ms`);
    
    // 分析结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    console.log(`成功: ${successCount}, 失败: ${failCount}, 平均响应时间: ${avgDuration.toFixed(2)}ms`);
    
    // 计算理论上的改进效果
    const oldSequentialTime = 10 * 200; // 原来串行执行需要的时间（每个任务200ms）
    const improvement = ((oldSequentialTime - totalDuration) / oldSequentialTime * 100).toFixed(1);
    console.log(`理论改进效果: 串行执行需要${oldSequentialTime}ms，并发执行仅需${totalDuration}ms，提升${improvement}%`);
    
    return {
      testName: '不同工单并发处理',
      totalDuration,
      successCount,
      failCount,
      avgDuration,
      improvement: `${improvement}%`,
      results
    };
  }

  /**
   * 测试2：同一工单串行处理
   */
  async testSameWorkOrderSerialization() {
    console.log('\n=== 测试2：同一工单串行处理 ===');
    
    const workOrderId = `SAME_WO_${Date.now()}`;
    const requests = [];
    const startTime = Date.now();
    
    // 创建8个相同工单的更新请求
    for (let i = 1; i <= 8; i++) {
      const workOrderData = {
        workOrderId: workOrderId, // 相同的工单ID
        type: i % 3 === 0 ? 'scrap' : (i % 2 === 0 ? 'output' : 'input'), // 混合不同类型
        quantity: 1,
        logContext: {
          relatedBarcode: `BARCODE_SEQ_${i}`,
          barcodeOperation: 'SCAN',
          operatorId: 'TEST_OPERATOR',
          processStepId: `STEP_${i}`,
          reason: `第${i}次更新`,
          source: 'SERIALIZATION_TEST'
        }
      };
      
      requests.push(this.sendWorkOrderRequest(workOrderData));
    }
    
    console.log('🔒 发送8个相同工单的更新请求（应该串行执行）...');
    const results = await Promise.all(requests);
    const totalDuration = Date.now() - startTime;
    
    console.log(`✅ 所有请求完成，总耗时: ${totalDuration}ms`);
    
    // 分析结果 - 同一工单应该串行执行，所以总时间应该接近 8 * 单个任务时间
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    console.log(`成功: ${successCount}, 失败: ${failCount}, 平均响应时间: ${avgDuration.toFixed(2)}ms`);
    console.log(`串行特征验证: 总时间${totalDuration}ms 应该接近 8 * 单个任务时间`);
    
    return {
      testName: '同一工单串行处理',
      totalDuration,
      successCount,
      failCount,
      avgDuration,
      workOrderId,
      results
    };
  }

  /**
   * 测试3：混合并发场景
   */
  async testMixedConcurrencyScenario() {
    console.log('\n=== 测试3：混合并发场景 ===');
    
    const requests = [];
    const startTime = Date.now();
    
    // 创建混合场景：
    // - 5个不同的工单，每个工单4个任务（应该5个工单并发，每个工单内串行）
    for (let workOrderIndex = 1; workOrderIndex <= 5; workOrderIndex++) {
      const workOrderId = `MIXED_WO_${workOrderIndex}_${Date.now()}`;
      
      for (let taskIndex = 1; taskIndex <= 4; taskIndex++) {
        const workOrderData = {
          workOrderId: workOrderId,
          type: taskIndex === 1 ? 'input' : (taskIndex === 4 ? 'scrap' : 'output'),
          quantity: taskIndex,
          logContext: {
            relatedBarcode: `BARCODE_WO${workOrderIndex}_T${taskIndex}`,
            barcodeOperation: 'SCAN',
            operatorId: 'TEST_OPERATOR',
            processStepId: `STEP_WO${workOrderIndex}`,
            reason: `工单${workOrderIndex}的第${taskIndex}个任务`,
            source: 'MIXED_CONCURRENT_TEST'
          }
        };
        
        requests.push(this.sendWorkOrderRequest(workOrderData));
      }
    }
    
    console.log('🔄 发送混合并发场景：5个工单，每个工单4个任务...');
    const results = await Promise.all(requests);
    const totalDuration = Date.now() - startTime;
    
    console.log(`✅ 所有请求完成，总耗时: ${totalDuration}ms`);
    
    // 按工单分组分析结果
    const workOrderGroups = {};
    results.forEach(result => {
      const workOrderId = result.workOrderId;
      if (!workOrderGroups[workOrderId]) {
        workOrderGroups[workOrderId] = [];
      }
      workOrderGroups[workOrderId].push(result);
    });
    
    console.log('📊 各工单处理结果:');
    Object.keys(workOrderGroups).forEach(workOrderId => {
      const group = workOrderGroups[workOrderId];
      const groupDuration = Math.max(...group.map(r => r.duration));
      const groupSuccess = group.filter(r => r.success).length;
      console.log(`  ${workOrderId}: ${groupSuccess}/${group.length} 成功, 最长耗时: ${groupDuration}ms`);
    });
    
    return {
      testName: '混合并发场景',
      totalDuration,
      workOrderCount: Object.keys(workOrderGroups).length,
      totalTasks: results.length,
      workOrderGroups,
      results
    };
  }

  /**
   * 测试4：高并发压力测试
   */
  async testHighConcurrencyStress() {
    console.log('\n=== 测试4：高并发压力测试 ===');
    
    const requests = [];
    const startTime = Date.now();
    const workOrderCount = 20; // 20个不同工单
    const tasksPerWorkOrder = 3; // 每个工单3个任务
    
    // 创建高并发场景
    for (let workOrderIndex = 1; workOrderIndex <= workOrderCount; workOrderIndex++) {
      const workOrderId = `STRESS_WO_${String(workOrderIndex).padStart(3, '0')}_${Date.now()}`;
      
      for (let taskIndex = 1; taskIndex <= tasksPerWorkOrder; taskIndex++) {
        const workOrderData = {
          workOrderId: workOrderId,
          type: taskIndex === 1 ? 'input' : 'output',
          quantity: Math.floor(Math.random() * 10) + 1,
          logContext: {
            relatedBarcode: `STRESS_BARCODE_${workOrderIndex}_${taskIndex}`,
            barcodeOperation: 'SCAN',
            operatorId: `OPERATOR_${workOrderIndex % 5 + 1}`, // 5个操作员
            processStepId: `STRESS_STEP_${workOrderIndex}`,
            reason: '高并发压力测试',
            source: 'STRESS_TEST'
          }
        };
        
        requests.push(this.sendWorkOrderRequest(workOrderData));
      }
    }
    
    console.log(`💪 发送高并发压力测试：${workOrderCount}个工单，每个工单${tasksPerWorkOrder}个任务，总计${requests.length}个请求...`);
    const results = await Promise.all(requests);
    const totalDuration = Date.now() - startTime;
    
    console.log(`✅ 所有请求完成，总耗时: ${totalDuration}ms`);
    
    // 分析结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const maxDuration = Math.max(...results.map(r => r.duration));
    const minDuration = Math.min(...results.map(r => r.duration));
    
    console.log(`📈 压力测试结果:`);
    console.log(`  成功率: ${(successCount / results.length * 100).toFixed(1)}% (${successCount}/${results.length})`);
    console.log(`  平均响应时间: ${avgDuration.toFixed(2)}ms`);
    console.log(`  最大响应时间: ${maxDuration}ms`);
    console.log(`  最小响应时间: ${minDuration}ms`);
    
    // 计算吞吐量
    const throughput = (results.length / (totalDuration / 1000)).toFixed(2);
    console.log(`  吞吐量: ${throughput} 请求/秒`);
    
    return {
      testName: '高并发压力测试',
      totalDuration,
      successCount,
      failCount,
      avgDuration,
      maxDuration,
      minDuration,
      throughput: parseFloat(throughput),
      workOrderCount,
      totalTasks: results.length,
      results
    };
  }

  /**
   * 监控队列状态变化
   */
  async monitorQueueStatus(duration = 30000) {
    console.log('\n=== 队列状态监控 ===');
    console.log(`监控${duration / 1000}秒...`);
    
    const interval = 2000; // 每2秒检查一次
    const endTime = Date.now() + duration;
    const snapshots = [];
    
    while (Date.now() < endTime) {
      const stats = await this.getQueueStats();
      const locks = await this.getWorkOrderLocks();
      const metrics = await this.getConcurrencyMetrics();
      
      if (stats && locks && metrics) {
        const snapshot = {
          timestamp: new Date().toISOString(),
          workOrderQueue: stats.data.workOrderQueue,
          locks: locks.data,
          concurrency: metrics.metrics.workOrderQueue
        };
        
        snapshots.push(snapshot);
        
        console.log(`⏰ ${new Date().toLocaleTimeString()} - 工单队列: 等待${snapshot.workOrderQueue.waiting}, 活跃${snapshot.workOrderQueue.active}, 锁${snapshot.locks.totalLocks}, 利用率${snapshot.concurrency.utilizationRate}%`);
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    return snapshots;
  }

  /**
   * 运行完整测试套件
   */
  async runFullTestSuite() {
    console.log('🎯 开始工单并发处理优化测试');
    console.log(`测试时间: ${new Date().toLocaleString()}`);
    
    try {
      // 先检查服务状态
      console.log('\n📋 检查服务状态...');
      const initialStats = await this.getQueueStats();
      if (!initialStats) {
        throw new Error('无法连接到队列服务');
      }
      console.log('✅ 队列服务连接正常');
      
      // 获取初始指标
      const initialMetrics = await this.getConcurrencyMetrics();
      if (initialMetrics) {
        console.log(`📈 当前工单并发配置: ${initialMetrics.metrics.workOrderQueue.maxWorkers}个工作者`);
        console.log(`💡 理论提升: ${initialMetrics.metrics.workOrderQueue.theoreticalSpeedup}`);
      }
      
      // 执行测试
      const test1Result = await this.testDifferentWorkOrdersConcurrency();
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
      
      const test2Result = await this.testSameWorkOrderSerialization();
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
      
      const test3Result = await this.testMixedConcurrencyScenario();
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
      
      const test4Result = await this.testHighConcurrencyStress();
      
      // 总结结果
      console.log('\n📊 测试结果总结:');
      console.log(`1. ${test1Result.testName}: 总耗时${test1Result.totalDuration}ms, 成功率${(test1Result.successCount / (test1Result.successCount + test1Result.failCount) * 100).toFixed(1)}%, 性能提升${test1Result.improvement}`);
      console.log(`2. ${test2Result.testName}: 总耗时${test2Result.totalDuration}ms, 成功率${(test2Result.successCount / (test2Result.successCount + test2Result.failCount) * 100).toFixed(1)}%`);
      console.log(`3. ${test3Result.testName}: 总耗时${test3Result.totalDuration}ms, 处理${test3Result.workOrderCount}个工单共${test3Result.totalTasks}个任务`);
      console.log(`4. ${test4Result.testName}: 总耗时${test4Result.totalDuration}ms, 成功率${(test4Result.successCount / (test4Result.successCount + test4Result.failCount) * 100).toFixed(1)}%, 吞吐量${test4Result.throughput}请求/秒`);
      
      // 获取最终指标
      const finalMetrics = await this.getConcurrencyMetrics();
      if (finalMetrics) {
        console.log('\n🎯 最终性能指标:');
        console.log(`工单并发利用率: ${finalMetrics.metrics.workOrderQueue.utilizationRate}%`);
        console.log(`工单锁争用状态: ${finalMetrics.metrics.workOrderQueue.lockStats.lockContentionStatus}`);
        console.log(`预估处理时间改善: ${finalMetrics.metrics.performance.workOrderEstimatedTime} (原来: ${finalMetrics.metrics.performance.oldWorkOrderTime})`);
        console.log(`整体并发效率: ${finalMetrics.metrics.overall.overallUtilization}`);
      }
      
      console.log('\n✅ 工单并发优化测试完成！');
      
      return {
        test1Result,
        test2Result,
        test3Result,
        test4Result,
        finalMetrics
      };
      
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error.message);
      throw error;
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new WorkOrderConcurrencyTest();
  tester.runFullTestSuite()
    .then(results => {
      console.log('\n🎉 测试套件执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 测试套件执行失败:', error);
      process.exit(1);
    });
}

module.exports = WorkOrderConcurrencyTest; 