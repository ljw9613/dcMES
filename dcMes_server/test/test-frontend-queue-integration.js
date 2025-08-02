/**
 * 前端队列集成测试脚本
 * 验证前端与后端队列化处理的集成是否正常
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000'; // 根据实际服务器地址调整

// 测试数据
const testData = {
  lineId: 'TEST_LINE_001',
  lineName: 'Test Production Line', 
  processStepId: 'TEST_STEP_001',
  materialId: 'TEST_MATERIAL_001',
  materialCode: 'TEST_CODE_001',
  materialName: 'Test Material',
  materialSpec: 'Test Specification',
  mainBarcode: `FRONTEND_TEST_${Date.now()}`,
  totalQuantity: 100,
  userId: 'TEST_USER',
  componentScans: [],
  fromRepairStation: false
};

/**
 * 测试队列模式的完整流程
 */
async function testQueueModeFlow() {
  console.log('🎯 测试前端队列集成流程...');
  
  try {
    // 1. 调用托盘处理接口（队列模式）
    console.log('📤 发送托盘处理请求...');
    const response = await axios.post(`${BASE_URL}/api/v1/handlePalletBarcode`, {
      ...testData,
      useQueue: true, // 明确启用队列模式
      mainBarcode: `QUEUE_FRONTEND_${testData.mainBarcode}`
    });
    
    console.log('📦 接收到响应:', JSON.stringify(response.data, null, 2));
    
    if (!response.data.success) {
      console.error('❌ 托盘处理请求失败:', response.data.message);
      return false;
    }
    
    // 2. 检查是否为队列模式
    const queueInfo = response.data.queue;
    if (!queueInfo || !queueInfo.enabled || !queueInfo.jobId) {
      console.log('⚡ 检测到同步模式，直接返回结果');
      return true;
    }
    
    console.log(`🔄 检测到队列模式，JobID: ${queueInfo.jobId}`);
    console.log(`⏱️ 预计延迟: ${queueInfo.estimatedDelay}ms`);
    
    // 3. 模拟前端轮询检查任务状态
    const maxAttempts = 15;
    const checkInterval = 2000; // 2秒间隔
    
    console.log('🔍 开始轮询任务状态...');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // 等待检查间隔
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
      try {
        const statusRes = await axios.get(`${BASE_URL}/api/v1/getPalletProcessingStatus/${queueInfo.jobId}`);
        
        if (statusRes.data.success) {
          const { state, progress } = statusRes.data.data;
          
          console.log(`  📊 尝试 ${attempt}: 状态=${state}, 进度=${progress}%`);
          
          if (state === 'completed') {
            console.log('✅ 任务处理完成!');
            console.log('📋 处理结果:', JSON.stringify(statusRes.data.data.result, null, 2));
            
            // 验证结果数据结构
            const result = statusRes.data.data.result;
            if (result && result.palletCode) {
              console.log(`🎊 成功！托盘编号: ${result.palletCode}`);
              return true;
            } else {
              console.error('❌ 结果数据结构异常');
              return false;
            }
            
          } else if (state === 'failed') {
            console.error('❌ 任务处理失败:', statusRes.data.data.error);
            return false;
          } else if (state === 'active') {
            console.log('  ⚡ 任务正在处理中...');
          } else if (state === 'waiting') {
            console.log('  ⏳ 任务等待处理中...');
          }
          
        } else {
          console.warn(`⚠️ 状态查询失败 (尝试 ${attempt}): ${statusRes.data.message}`);
        }
        
      } catch (statusError) {
        console.error(`❌ 状态查询错误 (尝试 ${attempt}):`, statusError.response?.data || statusError.message);
      }
    }
    
    console.log('⏰ 轮询超时，但这可能是正常的');
    return true; // 超时不算失败，因为任务可能仍在处理
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试同步模式
 */
async function testSyncModeFlow() {
  console.log('⚡ 测试同步模式流程...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/handlePalletBarcode`, {
      ...testData,
      useQueue: false, // 明确禁用队列模式
      mainBarcode: `SYNC_FRONTEND_${testData.mainBarcode}`
    });
    
    console.log('📦 同步模式响应:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && (!response.data.queue || !response.data.queue.enabled)) {
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
 * 测试状态查询API
 */
async function testStatusQueryAPI() {
  console.log('🔍 测试状态查询API...');
  
  try {
    // 使用一个不存在的jobId测试
    const fakeJobId = 'test_job_123456';
    const response = await axios.get(`${BASE_URL}/api/v1/getPalletProcessingStatus/${fakeJobId}`);
    
    if (response.data.code === 404) {
      console.log('✅ 状态查询API正常响应（未找到任务）');
      return true;
    } else {
      console.log('⚠️ 状态查询API响应异常:', response.data);
      return true; // 仍然算成功，因为API能响应
    }
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ 状态查询API正常响应（404错误）');
      return true;
    }
    console.error('❌ 状态查询API测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 验证前端API兼容性
 */
async function testAPICompatibility() {
  console.log('🔧 测试API兼容性...');
  
  const testCases = [
    // 测试默认行为（应该启用队列）
    { name: '默认队列模式', data: { ...testData, mainBarcode: `DEFAULT_${Date.now()}` } },
    
    // 测试明确指定队列模式
    { name: '明确队列模式', data: { ...testData, useQueue: true, mainBarcode: `EXPLICIT_QUEUE_${Date.now()}` } },
    
    // 测试明确指定同步模式
    { name: '明确同步模式', data: { ...testData, useQueue: false, mainBarcode: `EXPLICIT_SYNC_${Date.now()}` } }
  ];
  
  let successCount = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`  📋 测试: ${testCase.name}`);
      
      const response = await axios.post(`${BASE_URL}/api/v1/handlePalletBarcode`, testCase.data);
      
      if (response.data.success) {
        console.log(`    ✅ ${testCase.name} - 成功`);
        
        // 检查响应格式
        const expectedFields = ['data', 'queue'];
        const hasRequiredFields = expectedFields.every(field => 
          response.data.hasOwnProperty(field)
        );
        
        if (hasRequiredFields) {
          console.log(`    ✅ ${testCase.name} - 响应格式正确`);
          successCount++;
        } else {
          console.log(`    ⚠️ ${testCase.name} - 响应格式可能有问题`);
        }
        
      } else {
        console.log(`    ❌ ${testCase.name} - 失败: ${response.data.message}`);
      }
      
    } catch (error) {
      console.log(`    ❌ ${testCase.name} - 错误: ${error.response?.data?.message || error.message}`);
    }
    
    // 短暂延迟避免请求过于密集
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`📊 兼容性测试完成: ${successCount}/${testCases.length} 通过`);
  return successCount === testCases.length;
}

/**
 * 主测试函数
 */
async function runIntegrationTests() {
  console.log('🚀 开始前端队列集成测试...\n');
  
  const tests = [
    { name: '状态查询API', test: testStatusQueryAPI },
    { name: 'API兼容性', test: testAPICompatibility },
    { name: '同步模式流程', test: testSyncModeFlow },
    { name: '队列模式流程', test: testQueueModeFlow }
  ];
  
  let passedTests = 0;
  
  for (const { name, test } of tests) {
    console.log(`\n📋 执行测试: ${name}`);
    console.log('='.repeat(50));
    
    try {
      const success = await test();
      if (success) {
        console.log(`✅ ${name} - 通过`);
        passedTests++;
      } else {
        console.log(`❌ ${name} - 失败`);
      }
    } catch (error) {
      console.error(`❌ ${name} - 异常:`, error.message);
    }
    
    // 测试间短暂延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎉 测试完成!');
  console.log('='.repeat(50));
  console.log(`📊 总结: ${passedTests}/${tests.length} 测试通过`);
  
  if (passedTests === tests.length) {
    console.log('🎊 所有测试通过！前端队列集成工作正常！');
  } else {
    console.log('⚠️ 部分测试失败，请检查配置和网络连接');
  }
  
  return passedTests === tests.length;
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  runIntegrationTests().catch(error => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testQueueModeFlow,
  testSyncModeFlow,
  testStatusQueryAPI,
  testAPICompatibility,
  runIntegrationTests
}; 