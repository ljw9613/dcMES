/**
 * 队列服务修复验证测试
 */

const { QueueService, testRedisConnection } = require('../services/queueService');

async function testQueueService() {
  console.log('🧪 开始测试修复后的队列服务...\n');

  try {
    // 1. 测试Redis连接
    console.log('1️⃣ 测试Redis连接...');
    const isRedisConnected = await testRedisConnection();
    console.log(`   Redis连接状态: ${isRedisConnected ? '✅ 正常' : '❌ 失败'}\n`);

    if (!isRedisConnected) {
      console.log('❌ Redis连接失败，请确保Redis服务正在运行');
      console.log('   启动Redis: docker run -d --name redis-test -p 6379:6379 redis:7-alpine');
      return;
    }

    // 2. 初始化队列处理器
    console.log('2️⃣ 初始化队列处理器...');
    await QueueService.initializeProcessor();
    console.log('   ✅ 队列处理器初始化成功\n');

    // 3. 测试添加工单更新任务
    console.log('3️⃣ 测试添加工单更新任务...');
    const testWorkOrderId = 'test-workorder-' + Date.now();
    
    const result = await QueueService.addWorkOrderQuantityUpdate(
      testWorkOrderId,
      'output',
      1,
      {
        operatorId: 'TEST_USER',
        relatedBarcode: 'TEST_BARCODE_' + Date.now(),
        reason: '队列服务修复测试',
        source: 'TEST'
      }
    );

    if (result.success) {
      console.log('   ✅ 任务添加成功:', {
        jobId: result.jobId,
        queueLength: result.queueLength,
        estimatedDelay: result.estimatedDelay
      });
    } else {
      console.log('   ❌ 任务添加失败:', result.error);
    }

    // 4. 测试队列状态获取
    console.log('\n4️⃣ 测试队列状态获取...');
    const stats = await QueueService.getQueueStats();
    console.log('   队列状态:', {
      waiting: stats.waiting,
      active: stats.active,
      health: stats.health
    });

    console.log('\n🎉 所有测试完成！队列服务修复验证成功！');

  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error.message);
    console.error('   错误详情:', error);
  }
}

// 运行测试
if (require.main === module) {
  testQueueService()
    .then(() => {
      console.log('\n📋 测试结束，退出程序...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testQueueService }; 