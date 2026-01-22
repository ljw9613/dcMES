/**
 * 强制重新初始化队列处理器
 */

const { QueueService, workOrderQueue } = require('../services/queueService');

async function forceInitializeQueue() {
  console.log('🔧 强制重新初始化队列处理器...\n');

  try {
    // 1. 检查当前状态
    console.log('1️⃣ 检查当前队列状态:');
    console.log('   队列实例:', workOrderQueue ? '✅ 存在' : '❌ 不存在');
    
    if (workOrderQueue && workOrderQueue.processors) {
      console.log('   当前处理器数量:', Object.keys(workOrderQueue.processors).length);
    } else {
      console.log('   ❌ 没有处理器');
    }

    // 2. 强制重新初始化
    console.log('\n2️⃣ 重新初始化队列处理器...');
    await QueueService.initializeProcessor();
    console.log('   ✅ 队列处理器重新初始化完成');

    // 3. 再次检查
    console.log('\n3️⃣ 检查初始化后的状态:');
    if (workOrderQueue && workOrderQueue.processors) {
      console.log('   初始化后处理器数量:', Object.keys(workOrderQueue.processors).length);
      console.log('   处理器列表:', Object.keys(workOrderQueue.processors));
    } else {
      console.log('   ❌ 仍然没有处理器');
    }

    // 4. 添加测试任务
    console.log('\n4️⃣ 添加测试任务...');
    const testResult = await QueueService.addWorkOrderQuantityUpdate(
      'force-init-test-' + Date.now(),
      'output',
      1,
      {
        operatorId: 'FORCE_INIT_USER',
        relatedBarcode: 'FORCE_INIT_BARCODE',
        reason: '强制初始化测试',
        source: 'FORCE_INIT'
      }
    );
    
    console.log('   测试任务结果:', testResult);

    // 5. 等待并观察处理
    console.log('\n5️⃣ 等待10秒观察任务处理...');
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const stats = await QueueService.getQueueStats();
      console.log(`   ${i + 1}秒后状态:`, {
        waiting: stats.waiting,
        active: stats.active,
        completed: stats.completed,
        failed: stats.failed
      });
      
      // 如果任务被处理了，提前退出
      if (stats.completed > 0 || stats.failed > 0) {
        console.log('   🎉 任务已被处理！');
        break;
      }
    }

  } catch (error) {
    console.error('\n❌ 强制初始化过程中出现错误:', error);
    console.error('   错误详情:', error.stack);
  }
}

// 运行强制初始化
if (require.main === module) {
  forceInitializeQueue()
    .then(() => {
      console.log('\n📋 强制初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 强制初始化失败:', error);
      process.exit(1);
    });
}

module.exports = { forceInitializeQueue }; 