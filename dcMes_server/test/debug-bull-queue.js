/**
 * 调试Bull队列内部状态
 */

const { workOrderQueue } = require('../services/queueService');

async function debugBullQueue() {
  console.log('🔍 调试Bull队列内部状态...\n');

  try {
    // 1. 检查队列基本信息
    console.log('1️⃣ 队列基本信息:');
    console.log('   队列名称:', workOrderQueue.name);
    console.log('   队列类型:', workOrderQueue.constructor.name);
    console.log('   Redis客户端:', workOrderQueue.client ? '✅ 存在' : '❌ 不存在');

    // 2. 检查队列的所有属性
    console.log('\n2️⃣ 队列对象属性:');
    const queueKeys = Object.keys(workOrderQueue);
    console.log('   队列对象的所有属性:', queueKeys);
    
    // 检查是否有处理器相关属性
    const processorRelatedKeys = queueKeys.filter(key => 
      key.toLowerCase().includes('process') || 
      key.toLowerCase().includes('handler') ||
      key.toLowerCase().includes('worker')
    );
    console.log('   处理器相关属性:', processorRelatedKeys);

    // 3. 直接测试处理器注册
    console.log('\n3️⃣ 直接测试处理器注册:');
    
    // 尝试注册一个简单的处理器
    console.log('   注册测试处理器...');
    const testProcessor = workOrderQueue.process('test-processor', 1, async (job) => {
      console.log('   🧪 测试处理器被调用:', job.data);
      return { success: true, processed: true };
    });
    
    console.log('   测试处理器注册结果:', testProcessor ? '✅ 成功' : '❌ 失败');

    // 4. 重新检查处理器
    console.log('\n4️⃣ 重新检查处理器状态:');
    console.log('   processors属性:', workOrderQueue.processors || '不存在');
    
    // 检查其他可能的处理器属性
    if (workOrderQueue._events) {
      console.log('   _events属性keys:', Object.keys(workOrderQueue._events));
    }

    // 5. 添加测试任务
    console.log('\n5️⃣ 添加测试任务到测试处理器:');
    const testJob = await workOrderQueue.add('test-processor', {
      test: true,
      message: '这是一个测试任务',
      timestamp: Date.now()
    });
    
    console.log('   测试任务ID:', testJob.id);

    // 6. 等待处理
    console.log('\n6️⃣ 等待5秒观察测试任务处理...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const stats = await workOrderQueue.getWaiting ? 
      {
        waiting: (await workOrderQueue.getWaiting()).length,
        active: (await workOrderQueue.getActive()).length,
        completed: (await workOrderQueue.getCompleted()).length,
        failed: (await workOrderQueue.getFailed()).length
      } : 
      {
        waiting: (await workOrderQueue.waiting()).length,
        active: (await workOrderQueue.active()).length,
        completed: (await workOrderQueue.completed()).length,
        failed: (await workOrderQueue.failed()).length
      };
      
    console.log('   最终队列状态:', stats);

  } catch (error) {
    console.error('\n❌ 调试过程中出现错误:', error);
    console.error('   错误详情:', error.stack);
  }
}

// 运行调试
if (require.main === module) {
  debugBullQueue()
    .then(() => {
      console.log('\n📋 调试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 调试失败:', error);
      process.exit(1);
    });
}

module.exports = { debugBullQueue }; 