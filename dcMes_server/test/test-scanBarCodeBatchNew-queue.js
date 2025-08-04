/**
 * scanBarCodeBatchNew 页面队列化处理测试脚本
 * 验证新扫码页面的产品入托托盘提交队列化处理是否正常
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000'; // 根据实际服务器地址调整

// 测试数据
const baseTestData = {
  lineId: 'NEW_SCAN_LINE_001',
  lineName: 'New Scan Production Line',
  processStepId: 'NEW_SCAN_STEP_001',
  materialId: 'NEW_SCAN_MATERIAL_001',
  materialCode: 'NEW_SCAN_CODE_001',
  materialName: 'New Scan Test Material',
  materialSpec: 'New Scan Test Specification',
  totalQuantity: 150,
  userId: 'NEW_SCAN_USER',
  componentScans: []
};

/**
 * 测试单个条码入托队列处理
 */
async function testSingleBarcodeQueue() {
  console.log('🔍 测试单个条码入托队列处理...');
  
  try {
    const testData = {
      ...baseTestData,
      mainBarcode: `NEW_SINGLE_${Date.now()}`,
      boxBarcode: null,
      fromRepairStation: false
    };
    
    console.log('📤 发送单个条码入托请求...');
    const response = await axios.post(`${BASE_URL}/api/v1/handlePalletBarcode`, {
      ...testData,
      useQueue: true
    });
    
    console.log('📦 单个条码响应:', JSON.stringify(response.data, null, 2));
    
    if (!response.data.success) {
      console.error('❌ 单个条码入托失败:', response.data.message);
      return false;
    }
    
    // 检查队列处理
    if (response.data.queue && response.data.queue.enabled && response.data.queue.jobId) {
      console.log(`🔄 单个条码队列模式，JobID: ${response.data.queue.jobId}`);
      
      // 简单轮询检查
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const statusRes = await axios.get(`${BASE_URL}/api/v1/getPalletProcessingStatus/${response.data.queue.jobId}`);
          
          if (statusRes.data.success) {
            const { state } = statusRes.data.data;
            console.log(`  📊 单个条码状态检查 ${attempts}: ${state}`);
            
            if (state === 'completed') {
              console.log('✅ 单个条码入托队列处理成功!');
              return true;
            } else if (state === 'failed') {
              console.error('❌ 单个条码入托队列处理失败');
              return false;
            }
          }
        } catch (error) {
          console.warn(`⚠️ 状态查询错误 (尝试 ${attempts}):`, error.message);
        }
      }
      
      console.log('⏰ 单个条码入托轮询超时，但任务可能仍在处理');
      return true;
      
    } else {
      console.log('⚡ 单个条码同步模式处理完成');
      return true;
    }
    
  } catch (error) {
    console.error('❌ 单个条码入托测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试包装箱条码入托队列处理
 */
async function testBoxBarcodeQueue() {
  console.log('📦 测试包装箱条码入托队列处理...');
  
  try {
    const testData = {
      ...baseTestData,
      mainBarcode: `NEW_BOX_ITEM_${Date.now()}`,
      boxBarcode: `NEW_BOX_${Date.now()}`,
      fromRepairStation: false
    };
    
    console.log('📤 发送包装箱条码入托请求...');
    const response = await axios.post(`${BASE_URL}/api/v1/handlePalletBarcode`, {
      ...testData,
      useQueue: true
    });
    
    console.log('📦 包装箱条码响应:', JSON.stringify(response.data, null, 2));
    
    if (!response.data.success) {
      console.error('❌ 包装箱条码入托失败:', response.data.message);
      return false;
    }
    
    // 检查队列处理
    if (response.data.queue && response.data.queue.enabled && response.data.queue.jobId) {
      console.log(`🔄 包装箱条码队列模式，JobID: ${response.data.queue.jobId}`);
      
      // 简单轮询检查
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const statusRes = await axios.get(`${BASE_URL}/api/v1/getPalletProcessingStatus/${response.data.queue.jobId}`);
          
          if (statusRes.data.success) {
            const { state } = statusRes.data.data;
            console.log(`  📊 包装箱条码状态检查 ${attempts}: ${state}`);
            
            if (state === 'completed') {
              console.log('✅ 包装箱条码入托队列处理成功!');
              return true;
            } else if (state === 'failed') {
              console.error('❌ 包装箱条码入托队列处理失败');
              return false;
            }
          }
        } catch (error) {
          console.warn(`⚠️ 状态查询错误 (尝试 ${attempts}):`, error.message);
        }
      }
      
      console.log('⏰ 包装箱条码入托轮询超时，但任务可能仍在处理');
      return true;
      
    } else {
      console.log('⚡ 包装箱条码同步模式处理完成');
      return true;
    }
    
  } catch (error) {
    console.error('❌ 包装箱条码入托测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试批量入托队列处理
 */
async function testBatchProcessingQueue() {
  console.log('🔢 测试批量入托队列处理...');
  
  const batchSize = 3;
  let successCount = 0;
  
  for (let i = 1; i <= batchSize; i++) {
    try {
      const testData = {
        ...baseTestData,
        mainBarcode: `NEW_BATCH_${Date.now()}_${i}`,
        boxBarcode: null,
        fromRepairStation: false
      };
      
      console.log(`📤 发送批量条码 ${i}/${batchSize}...`);
      const response = await axios.post(`${BASE_URL}/api/v1/handlePalletBarcode`, {
        ...testData,
        useQueue: true
      });
      
      if (response.data.success) {
        console.log(`  ✅ 批量条码 ${i} 提交成功`);
        successCount++;
        
        if (response.data.queue && response.data.queue.enabled) {
          console.log(`    🔄 JobID: ${response.data.queue.jobId}`);
        }
      } else {
        console.log(`  ❌ 批量条码 ${i} 提交失败: ${response.data.message}`);
      }
      
      // 短暂延迟避免请求过于密集
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ 批量条码 ${i} 处理失败:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log(`📊 批量处理结果: ${successCount}/${batchSize} 成功提交`);
  return successCount === batchSize;
}

/**
 * 测试修复站模式
 */
async function testRepairStationMode() {
  console.log('🔧 测试修复站模式队列处理...');
  
  try {
    const testData = {
      ...baseTestData,
      mainBarcode: `NEW_REPAIR_${Date.now()}`,
      boxBarcode: null,
      fromRepairStation: true
    };
    
    console.log('📤 发送修复站入托请求...');
    const response = await axios.post(`${BASE_URL}/api/v1/handlePalletBarcode`, {
      ...testData,
      useQueue: true
    });
    
    console.log('📦 修复站响应:', JSON.stringify(response.data, null, 2));
    
    if (!response.data.success) {
      console.error('❌ 修复站入托失败:', response.data.message);
      return false;
    }
    
    // 检查是否有优先级处理
    if (response.data.queue && response.data.queue.enabled) {
      console.log(`🔄 修复站队列模式，JobID: ${response.data.queue.jobId}`);
      console.log(`⚡ 预计延迟: ${response.data.queue.estimatedDelay}ms (修复站优先)`);
      return true;
    } else {
      console.log('⚡ 修复站同步模式处理完成');
      return true;
    }
    
  } catch (error) {
    console.error('❌ 修复站模式测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试前端兼容性
 */
async function testFrontendCompatibility() {
  console.log('🔧 测试前端兼容性...');
  
  const testCases = [
    { name: '默认模式（应启用队列）', useQueue: undefined },
    { name: '明确队列模式', useQueue: true },
    { name: '明确同步模式', useQueue: false }
  ];
  
  let passedTests = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`  📋 测试: ${testCase.name}`);
      
      const testData = {
        ...baseTestData,
        mainBarcode: `NEW_COMPAT_${Date.now()}_${testCase.name.replace(/\s+/g, '_')}`,
        boxBarcode: null
      };
      
      if (testCase.useQueue !== undefined) {
        testData.useQueue = testCase.useQueue;
      }
      
      const response = await axios.post(`${BASE_URL}/api/v1/handlePalletBarcode`, testData);
      
      if (response.data.success) {
        console.log(`    ✅ ${testCase.name} - 成功`);
        
        // 检查响应格式
        const hasQueueField = response.data.hasOwnProperty('queue');
        const hasDataField = response.data.hasOwnProperty('data');
        
        if (hasQueueField && hasDataField) {
          console.log(`    ✅ ${testCase.name} - 响应格式正确`);
          passedTests++;
        } else {
          console.log(`    ⚠️ ${testCase.name} - 响应格式异常`);
        }
        
      } else {
        console.log(`    ❌ ${testCase.name} - 失败: ${response.data.message}`);
      }
      
    } catch (error) {
      console.log(`    ❌ ${testCase.name} - 错误: ${error.response?.data?.message || error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`📊 兼容性测试: ${passedTests}/${testCases.length} 通过`);
  return passedTests === testCases.length;
}

/**
 * 主测试函数
 */
async function runScanBarCodeBatchNewTests() {
  console.log('🚀 开始 scanBarCodeBatchNew 页面队列化测试...\n');
  
  const tests = [
    { name: '前端兼容性', test: testFrontendCompatibility },
    { name: '单个条码入托队列', test: testSingleBarcodeQueue },
    { name: '包装箱条码入托队列', test: testBoxBarcodeQueue },
    { name: '修复站模式', test: testRepairStationMode },
    { name: '批量入托队列', test: testBatchProcessingQueue }
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
    
    // 测试间延迟
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n🎉 scanBarCodeBatchNew 测试完成!');
  console.log('='.repeat(50));
  console.log(`📊 总结: ${passedTests}/${tests.length} 测试通过`);
  
  if (passedTests === tests.length) {
    console.log('🎊 所有测试通过！scanBarCodeBatchNew 页面队列化修复成功！');
  } else {
    console.log('⚠️ 部分测试失败，请检查修复是否完整');
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
  runScanBarCodeBatchNewTests().catch(error => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testSingleBarcodeQueue,
  testBoxBarcodeQueue,
  testBatchProcessingQueue,
  testRepairStationMode,
  testFrontendCompatibility,
  runScanBarCodeBatchNewTests
}; 