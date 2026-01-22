/**
 * 队列状态检查脚本 - 直接检查队列问题
 */

const { QueueService, workOrderQueue } = require('../services/queueService');

async function checkQueueStatus() {
  console.log('🔍 检查队列状态和处理器问题...\n');

  try {
    // 1. 检查队列实例是否存在
    console.log('1️⃣ 检查队列实例:');
    console.log('   队列实例:', workOrderQueue ? '✅ 存在' : '❌ 不存在');
    
    if (workOrderQueue) {
      console.log('   队列名称:', workOrderQueue.name);
      console.log('   Redis配置:', {
        host: workOrderQueue.settings?.redis?.host || 'unknown',
        port: workOrderQueue.settings?.redis?.port || 'unknown'
      });
    }

    // 2. 检查队列统计
    console.log('\n2️⃣ 检查队列统计:');
    const stats = await QueueService.getQueueStats();
    console.log('   队列状态:', stats);

    // 3. 检查是否有处理器监听
    console.log('\n3️⃣ 检查队列处理器:');
    if (workOrderQueue && workOrderQueue.processors) {
      console.log('   处理器数量:', Object.keys(workOrderQueue.processors).length);
      console.log('   处理器列表:', Object.keys(workOrderQueue.processors));
    } else {
      console.log('   ❌ 没有发现处理器或处理器信息不可用');
    }

    // 4. 检查队列中的任务
    console.log('\n4️⃣ 检查队列中的任务:');
    try {
      const waiting = workOrderQueue.getWaiting ? 
        await workOrderQueue.getWaiting() : 
        await workOrderQueue.waiting();
      const active = workOrderQueue.getActive ? 
        await workOrderQueue.getActive() : 
        await workOrderQueue.active();
      
      console.log(`   等待任务: ${waiting.length}`);
      console.log(`   活跃任务: ${active.length}`);
      
      if (waiting.length > 0) {
        console.log('   最新等待任务:', {
          id: waiting[0].id,
          data: waiting[0].data,
          createdAt: waiting[0].timestamp
        });
      }
      
      if (active.length > 0) {
        console.log('   当前活跃任务:', {
          id: active[0].id,
          data: active[0].data,
          processedOn: active[0].processedOn
        });
      }
    } catch (error) {
      console.log('   ❌ 检查任务失败:', error.message);
    }

    // 5. 手动添加测试任务
    console.log('\n5️⃣ 手动添加测试任务:');
    const testResult = await QueueService.addWorkOrderQuantityUpdate(
      'debug-test-' + Date.now(),
      'output',
      1,
      {
        operatorId: 'DEBUG_USER',
        relatedBarcode: 'DEBUG_BARCODE',
        reason: '调试测试',
        source: 'DEBUG'
      }
    );
    
    console.log('   测试任务结果:', testResult);

    // 6. 等待一段时间后再次检查
    console.log('\n6️⃣ 等待5秒后再次检查任务状态...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const statsAfter = await QueueService.getQueueStats();
    console.log('   5秒后的队列状态:', statsAfter);

  } catch (error) {
    console.error('\n❌ 检查过程中出现错误:', error);
  }
}

// 运行检查
if (require.main === module) {
  checkQueueStatus()
    .then(() => {
      console.log('\n📋 检查完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 检查失败:', error);
      process.exit(1);
    });
}

module.exports = { checkQueueStatus }; 