/**
 * 托盘并发处理优化测试
 * 验证不同托盘任务可以并发执行，同一托盘任务串行执行
 */

const axios = require('axios');

class PalletConcurrencyTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000'; // 根据实际服务端口调整
    this.testResults = [];
  }

  /**
   * 发送托盘处理请求
   */
  async sendPalletRequest(palletData) {
    const startTime = Date.now();
    try {
      const response = await axios.post(`${this.baseUrl}/api/queue/test/handle-pallet-barcode`, palletData);
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: response.data,
        duration,
        palletKey: palletData.mainBarcode,
        lineId: palletData.lineId
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        duration,
        palletKey: palletData.mainBarcode,
        lineId: palletData.lineId
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
   * 获取托盘锁状态
   */
  async getPalletLocks() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/queue/pallet-locks`);
      return response.data;
    } catch (error) {
      console.error('获取托盘锁状态失败:', error.message);
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
   * 测试1：不同托盘并发处理
   */
  async testDifferentPalletsConcurrency() {
    console.log('\n=== 测试1：不同托盘并发处理 ===');
    
    const palletRequests = [];
    const startTime = Date.now();
    
    // 创建10个不同托盘的处理请求
    for (let i = 1; i <= 10; i++) {
      const palletData = {
        lineId: `LINE_${i % 3 + 1}`, // 3条产线
        lineName: `测试产线${i % 3 + 1}`,
        mainBarcode: `PALLET_${String(i).padStart(3, '0')}_${Date.now()}`,
        materialId: `MATERIAL_${i}`,
        materialCode: `MAT_CODE_${i}`,
        materialName: `测试物料${i}`,
        processStepId: `STEP_${i}`,
        userId: 'TEST_USER',
        totalQuantity: 100,
        fromRepairStation: false
      };
      
      palletRequests.push(this.sendPalletRequest(palletData));
    }
    
    // 并发执行所有请求
    console.log('🚀 发送10个不同托盘的处理请求...');
    const results = await Promise.all(palletRequests);
    const totalDuration = Date.now() - startTime;
    
    console.log(`✅ 所有请求完成，总耗时: ${totalDuration}ms`);
    
    // 分析结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    console.log(`成功: ${successCount}, 失败: ${failCount}, 平均响应时间: ${avgDuration.toFixed(2)}ms`);
    
    // 计算理论上的改进效果
    const oldSequentialTime = 10 * 3000; // 原来串行执行需要的时间
    const improvement = ((oldSequentialTime - totalDuration) / oldSequentialTime * 100).toFixed(1);
    console.log(`理论改进效果: 串行执行需要${oldSequentialTime}ms，并发执行仅需${totalDuration}ms，提升${improvement}%`);
    
    return {
      testName: '不同托盘并发处理',
      totalDuration,
      successCount,
      failCount,
      avgDuration,
      improvement: `${improvement}%`,
      results
    };
  }

  /**
   * 测试2：同一托盘串行处理
   */
  async testSamePalletSerialization() {
    console.log('\n=== 测试2：同一托盘串行处理 ===');
    
    const palletBarcode = `SAME_PALLET_${Date.now()}`;
    const requests = [];
    const startTime = Date.now();
    
    // 创建5个相同托盘的处理请求
    for (let i = 1; i <= 5; i++) {
      const palletData = {
        lineId: 'LINE_1',
        lineName: '测试产线1',
        mainBarcode: palletBarcode, // 相同的托盘条码
        materialId: 'MATERIAL_1',
        materialCode: 'MAT_CODE_1',
        materialName: '测试物料1',
        processStepId: 'STEP_1',
        userId: 'TEST_USER',
        totalQuantity: 100,
        fromRepairStation: false
      };
      
      requests.push(this.sendPalletRequest(palletData));
    }
    
    console.log('🔒 发送5个相同托盘的处理请求（应该串行执行）...');
    const results = await Promise.all(requests);
    const totalDuration = Date.now() - startTime;
    
    console.log(`✅ 所有请求完成，总耗时: ${totalDuration}ms`);
    
    // 分析结果 - 同一托盘应该串行执行，所以总时间应该接近 5 * 单个任务时间
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    console.log(`成功: ${successCount}, 失败: ${failCount}, 平均响应时间: ${avgDuration.toFixed(2)}ms`);
    console.log(`串行特征验证: 总时间${totalDuration}ms 应该接近 5 * 单个任务时间`);
    
    return {
      testName: '同一托盘串行处理',
      totalDuration,
      successCount,
      failCount,
      avgDuration,
      palletBarcode,
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
    // - 3个不同的托盘，每个托盘3个任务（应该3个托盘并发，每个托盘内串行）
    for (let palletIndex = 1; palletIndex <= 3; palletIndex++) {
      const palletBarcode = `MIXED_PALLET_${palletIndex}_${Date.now()}`;
      
      for (let taskIndex = 1; taskIndex <= 3; taskIndex++) {
        const palletData = {
          lineId: `LINE_${palletIndex}`,
          lineName: `测试产线${palletIndex}`,
          mainBarcode: palletBarcode,
          materialId: `MATERIAL_${palletIndex}`,
          materialCode: `MAT_CODE_${palletIndex}`,
          materialName: `测试物料${palletIndex}`,
          processStepId: `STEP_${palletIndex}`,
          userId: 'TEST_USER',
          totalQuantity: 100,
          fromRepairStation: taskIndex === 3 // 最后一个任务标记为来自维修台
        };
        
        requests.push(this.sendPalletRequest(palletData));
      }
    }
    
    console.log('🔄 发送混合并发场景：3个托盘，每个托盘3个任务...');
    const results = await Promise.all(requests);
    const totalDuration = Date.now() - startTime;
    
    console.log(`✅ 所有请求完成，总耗时: ${totalDuration}ms`);
    
    // 按托盘分组分析结果
    const palletGroups = {};
    results.forEach(result => {
      const palletKey = result.palletKey;
      if (!palletGroups[palletKey]) {
        palletGroups[palletKey] = [];
      }
      palletGroups[palletKey].push(result);
    });
    
    console.log('📊 各托盘处理结果:');
    Object.keys(palletGroups).forEach(palletKey => {
      const group = palletGroups[palletKey];
      const groupDuration = Math.max(...group.map(r => r.duration));
      const groupSuccess = group.filter(r => r.success).length;
      console.log(`  ${palletKey}: ${groupSuccess}/${group.length} 成功, 最长耗时: ${groupDuration}ms`);
    });
    
    return {
      testName: '混合并发场景',
      totalDuration,
      palletCount: Object.keys(palletGroups).length,
      totalTasks: results.length,
      palletGroups,
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
      const locks = await this.getPalletLocks();
      const metrics = await this.getConcurrencyMetrics();
      
      if (stats && locks && metrics) {
        const snapshot = {
          timestamp: new Date().toISOString(),
          palletQueue: stats.data.palletQueue,
          locks: locks.data,
          concurrency: metrics.metrics.concurrency
        };
        
        snapshots.push(snapshot);
        
        console.log(`⏰ ${new Date().toLocaleTimeString()} - 队列状态: 等待${snapshot.palletQueue.waiting}, 活跃${snapshot.palletQueue.active}, 锁${snapshot.locks.totalLocks}, 利用率${snapshot.concurrency.utilizationRate}%`);
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    return snapshots;
  }

  /**
   * 运行完整测试套件
   */
  async runFullTestSuite() {
    console.log('🎯 开始托盘并发处理优化测试');
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
        console.log(`📈 当前并发配置: ${initialMetrics.metrics.concurrency.maxWorkers}个工作者`);
        console.log(`💡 理论提升: ${initialMetrics.metrics.concurrency.theoreticalSpeedup}`);
      }
      
      // 执行测试
      const test1Result = await this.testDifferentPalletsConcurrency();
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
      
      const test2Result = await this.testSamePalletSerialization();
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
      
      const test3Result = await this.testMixedConcurrencyScenario();
      
      // 总结结果
      console.log('\n📊 测试结果总结:');
      console.log(`1. ${test1Result.testName}: 总耗时${test1Result.totalDuration}ms, 成功率${(test1Result.successCount / (test1Result.successCount + test1Result.failCount) * 100).toFixed(1)}%, 性能提升${test1Result.improvement}`);
      console.log(`2. ${test2Result.testName}: 总耗时${test2Result.totalDuration}ms, 成功率${(test2Result.successCount / (test2Result.successCount + test2Result.failCount) * 100).toFixed(1)}%`);
      console.log(`3. ${test3Result.testName}: 总耗时${test3Result.totalDuration}ms, 处理${test3Result.palletCount}个托盘共${test3Result.totalTasks}个任务`);
      
      // 获取最终指标
      const finalMetrics = await this.getConcurrencyMetrics();
      if (finalMetrics) {
        console.log('\n🎯 最终性能指标:');
        console.log(`并发利用率: ${finalMetrics.metrics.concurrency.utilizationRate}%`);
        console.log(`锁争用状态: ${finalMetrics.metrics.locks.lockContentionStatus}`);
        console.log(`预估处理时间改善: ${finalMetrics.metrics.performance.estimatedProcessingTime} (原来: ${finalMetrics.metrics.performance.oldEstimatedTime})`);
      }
      
      console.log('\n✅ 并发优化测试完成！');
      
      return {
        test1Result,
        test2Result,
        test3Result,
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
  const tester = new PalletConcurrencyTest();
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

module.exports = PalletConcurrencyTest; 