/**
 * 托盘队列功能测试脚本
 * 用于验证队列化的handlePalletBarcode功能是否正常工作
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000'; // 根据实际服务器地址调整
const TEST_DELAY = 2000; // 测试间隔时间

// 测试数据
const testData = {
  lineId: 'TEST_LINE_001',
  lineName: 'Test Production Line',
  processStepId: 'TEST_STEP_001',
  materialId: 'TEST_MATERIAL_001',
  materialCode: 'TEST_CODE_001',
  materialName: 'Test Material',
  materialSpec: 'Test Specification',
  mainBarcode: `TEST_BARCODE_${Date.now()}`,
  totalQuantity: 100,
  userId: 'TEST_USER',
  componentScans: [],
  fromRepairStation: false
};

/**
 * 测试Redis连接状态
 */
async function testRedisConnection() {
  try {
    console.log('🔍 检查Redis连接状态...');
    const response = await axios.get(`${BASE_URL}/api/queue/redis-status`);
    
    if (response.data.connected) {
      console.log('✅ Redis连接正常');
      return true;
    } else {
      console.log('❌ Redis连接失败');
      return false;
    }
  } catch (error) {
    console.error('❌ Redis连接检查失败:', error.message);
    return false;
  }
}

/**
 * 测试队列状态
 */
async function testQueueStatus() {
  try {
    console.log('📊 获取队列状态...');
    const response = await axios.get(`${BASE_URL}/api/queue/status`);
    
    console.log('队列状态:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ 获取队列状态失败:', error.message);
    return null;
  }
}

/**
 * 测试托盘处理 - 队列模式
 */
async function testPalletProcessingQueue() {
  try {
    console.log('🎯 测试托盘处理 - 队列模式...');
    
    const response = await axios.post(`${BASE_URL}/api/v1/handlePalletBarcode`, {
      ...testData,
      useQueue: true,
      mainBarcode: `QUEUE_${testData.mainBarcode}`
    });
    
    console.log('队列模式响应:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.queue?.enabled) {
      console.log('✅ 队列模式测试成功');
      return response.data.queue.jobId;
    } else {
      console.log('❌ 队列模式测试失败');
      return null;
    }
  } catch (error) {
    console.error('❌ 队列模式测试失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 测试托盘处理 - 同步模式
 */
async function testPalletProcessingSync() {
  try {
    console.log('⚡ 测试托盘处理 - 同步模式...');
    
    const response = await axios.post(`${BASE_URL}/api/v1/handlePalletBarcode`, {
      ...testData,
      useQueue: false,
      mainBarcode: `SYNC_${testData.mainBarcode}`
    });
    
    console.log('同步模式响应:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && !response.data.queue?.enabled) {
      console.log('✅ 同步模式测试成功');
      return true;
    } else {
      console.log('❌ 同步模式测试失败');
      return false;
    }
  } catch (error) {
    console.error('❌ 同步模式测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 查询任务处理状态
 */
async function checkJobStatus(jobId, maxAttempts = 10) {
  if (!jobId) {
    console.log('❌ 没有提供任务ID');
    return;
  }

  console.log(`🔍 查询任务状态: ${jobId}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/getPalletProcessingStatus/${jobId}`);
      
      if (response.data.success) {
        const { state, progress, error } = response.data.data;
        
        console.log(`  尝试 ${attempt}: 状态=${state}, 进度=${progress}%`);
        
        if (state === 'completed') {
          console.log('✅ 任务处理完成!');
          console.log('  结果:', JSON.stringify(response.data.data.result, null, 2));
          return true;
        } else if (state === 'failed') {
          console.log('❌ 任务处理失败:', error);
          return false;
        }
        
        // 等待后继续检查
        await new Promise(resolve => setTimeout(resolve, TEST_DELAY));
      } else {
        console.log(`❌ 查询失败: ${response.data.message}`);
        break;
      }
    } catch (error) {
      console.error(`❌ 查询任务状态失败 (尝试 ${attempt}):`, error.response?.data || error.message);
      if (attempt === maxAttempts) break;
      await new Promise(resolve => setTimeout(resolve, TEST_DELAY));
    }
  }
  
  console.log('⏰ 查询超时或失败');
  return false;
}

/**
 * 测试队列监控API
 */
async function testQueueMonitoring() {
  console.log('📈 测试队列监控功能...');
  
  try {
    // 测试健康检查
    const healthResponse = await axios.get(`${BASE_URL}/api/queue/health`);
    console.log('健康检查:', healthResponse.data.health);
    
    // 测试性能指标
    const metricsResponse = await axios.get(`${BASE_URL}/api/queue/metrics`);
    console.log('性能指标:', JSON.stringify(metricsResponse.data.metrics, null, 2));
    
    console.log('✅ 队列监控功能正常');
  } catch (error) {
    console.error('❌ 队列监控测试失败:', error.message);
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始托盘队列功能测试...\n');
  
  // 1. 检查Redis连接
  const redisConnected = await testRedisConnection();
  if (!redisConnected) {
    console.log('❌ Redis未连接，跳过队列测试');
    return;
  }
  
  console.log(''); // 空行分隔
  
  // 2. 获取初始队列状态
  await testQueueStatus();
  
  console.log(''); // 空行分隔
  
  // 3. 测试同步模式（作为基准）
  const syncSuccess = await testPalletProcessingSync();
  
  console.log(''); // 空行分隔
  
  // 4. 测试队列模式
  const jobId = await testPalletProcessingQueue();
  
  if (jobId) {
    console.log(''); // 空行分隔
    
    // 5. 查询队列任务状态
    await checkJobStatus(jobId);
  }
  
  console.log(''); // 空行分隔
  
  // 6. 测试队列监控
  await testQueueMonitoring();
  
  console.log(''); // 空行分隔
  
  // 7. 最终队列状态
  console.log('📊 最终队列状态:');
  await testQueueStatus();
  
  console.log('\n🎉 测试完成!');
}

/**
 * 错误处理
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testRedisConnection,
  testQueueStatus,
  testPalletProcessingQueue,
  testPalletProcessingSync,
  checkJobStatus,
  testQueueMonitoring,
  runTests
}; 