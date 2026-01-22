/**
 * 测试正确的处理器名称
 */

const { QueueService, workOrderQueue } = require('../services/queueService');

async function testCorrectProcessor() {
  console.log('🧪 测试正确的处理器名称匹配...\n');

  try {
    // 1. 重新初始化处理器
    console.log('1️⃣ 重新初始化处理器...');
    await QueueService.initializeProcessor();
    console.log('   ✅ 处理器初始化完成');

    // 2. 检查handlers
    console.log('\n2️⃣ 检查队列handlers:');
    if (workOrderQueue.handlers) {
      console.log('   handlers:', Object.keys(workOrderQueue.handlers));
      console.log('   handlers详情:', workOrderQueue.handlers);
    } else {
      console.log('   ❌ 没有handlers');
    }

    // 3. 使用正确的任务名称添加任务
    console.log('\n3️⃣ 添加update-quantity任务:');
    const job = await workOrderQueue.add('update-quantity', {
      workOrderId: 'test-correct-' + Date.now(),
      type: 'output',
      quantity: 1,
      logContext: {
        operatorId: 'CORRECT_TEST_USER',
        relatedBarcode: 'CORRECT_TEST_BARCODE',
        reason: '正确处理器名称测试',
        source: 'CORRECT_TEST'
      },
      timestamp: Date.now(),
      requestId: 'correct-test-' + Math.random().toString(36).substr(2, 9)
    });
    
    console.log('   任务ID:', job.id);
    console.log('   任务数据:', job.data);

    // 4. 实时监控任务处理
    console.log('\n4️⃣ 实时监控任务处理（10秒）:');
    
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stats = await QueueService.getQueueStats();
      console.log(`   ${i + 1}s: waiting=${stats.waiting}, active=${stats.active}, completed=${stats.completed}, failed=${stats.failed}`);
      
      // 检查具体任务状态
      try {
        const jobStatus = await job.getState();
        console.log(`        任务${job.id}状态: ${jobStatus}`);
        
        if (jobStatus === 'completed') {
          const result = await job.returnvalue;
          console.log('        任务结果:', result);
          console.log('   🎉 任务处理成功！');
          break;
        } else if (jobStatus === 'failed') {
          const error = await job.failedReason;
          console.log('        任务失败原因:', error);
          console.log('   ❌ 任务处理失败！');
          break;
        }
      } catch (statusError) {
        console.log(`        获取任务状态失败: ${statusError.message}`);
      }
    }

    // 5. 最终检查
    console.log('\n5️⃣ 最终状态检查:');
    const finalStats = await QueueService.getQueueStats();
    console.log('   最终队列状态:', finalStats);

  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error);
    console.error('   错误详情:', error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testCorrectProcessor()
    .then(() => {
      console.log('\n📋 测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testCorrectProcessor }; 