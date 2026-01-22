/**
 * 诊断Bull队列核心问题
 */

const Queue = require('bull');
const { redis: redisConfig } = require('../config/redis');

async function diagnoseBullIssue() {
  console.log('🔬 诊断Bull队列核心问题...\n');

  let testQueue = null;
  
  try {
    // 1. 创建一个全新的测试队列
    console.log('1️⃣ 创建全新的测试队列:');
    testQueue = new Queue('diagnose-test-queue', {
      redis: redisConfig,
      settings: {
        stalledInterval: 30 * 1000,
        maxStalledCount: 3,
      },
      defaultJobOptions: {
        removeOnComplete: 5,
        removeOnFail: 5,
        attempts: 1,
        delay: 0,
      },
    });
    
    console.log('   ✅ 测试队列创建成功:', testQueue.name);

    // 2. 注册处理器
    console.log('\n2️⃣ 注册处理器:');
    const processorResult = testQueue.process('test-job', 1, async (job) => {
      console.log(`   🏃‍♂️ 处理器开始执行: ${job.id}`);
      console.log(`   📦 任务数据:`, job.data);
      
      await new Promise(resolve => setTimeout(resolve, 100)); // 模拟处理时间
      
      console.log(`   ✅ 处理器执行完成: ${job.id}`);
      return { success: true, processedAt: new Date().toISOString() };
    });
    
    console.log('   处理器注册结果:', processorResult ? '✅ 成功' : '❌ 失败');

    // 3. 设置事件监听
    console.log('\n3️⃣ 设置事件监听:');
    testQueue.on('waiting', (jobId) => {
      console.log(`   📋 任务进入等待队列: ${jobId}`);
    });
    
    testQueue.on('active', (job, jobPromise) => {
      console.log(`   🏃 任务开始处理: ${job.id}`);
    });
    
    testQueue.on('completed', (job, result) => {
      console.log(`   ✅ 任务完成: ${job.id}`, result);
    });
    
    testQueue.on('failed', (job, err) => {
      console.log(`   ❌ 任务失败: ${job.id}`, err.message);
    });
    
    testQueue.on('error', (error) => {
      console.log(`   🚨 队列错误:`, error.message);
    });

    console.log('   ✅ 事件监听设置完成');

    // 4. 检查Redis连接
    console.log('\n4️⃣ 检查Redis连接:');
    console.log('   队列Redis客户端状态:', testQueue.client.status);
    
    // 测试Redis操作
    await testQueue.client.ping();
    console.log('   ✅ Redis连接正常');

    // 5. 添加测试任务
    console.log('\n5️⃣ 添加测试任务:');
    const job = await testQueue.add('test-job', {
      message: '这是一个测试任务',
      timestamp: Date.now(),
      testData: { a: 1, b: 2 }
    });
    
    console.log('   测试任务ID:', job.id);

    // 6. 实时监控
    console.log('\n6️⃣ 实时监控（15秒）:');
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const [waiting, active, completed, failed] = await Promise.all([
        testQueue.getWaiting(),
        testQueue.getActive(),
        testQueue.getCompleted(),
        testQueue.getFailed()
      ]);
      
      console.log(`   ${i + 1}s: waiting=${waiting.length}, active=${active.length}, completed=${completed.length}, failed=${failed.length}`);
      
      // 检查任务状态
      try {
        const jobStatus = await job.getState();
        console.log(`        任务${job.id}状态: ${jobStatus}`);
        
        if (jobStatus === 'completed' || jobStatus === 'failed') {
          console.log('   🎯 任务已处理，提前结束监控');
          break;
        }
      } catch (statusError) {
        console.log(`        状态检查失败: ${statusError.message}`);
      }
    }

    // 7. 强制处理任务（如果还在等待）
    console.log('\n7️⃣ 检查是否需要强制处理:');
    const finalJobStatus = await job.getState();
    console.log('   最终任务状态:', finalJobStatus);
    
    if (finalJobStatus === 'waiting') {
      console.log('   任务仍在等待，可能存在配置问题');
      
      // 检查队列是否暂停
      const isPaused = await testQueue.isPaused();
      console.log('   队列是否暂停:', isPaused);
      
      if (isPaused) {
        console.log('   恢复队列...');
        await testQueue.resume();
      }
    }

  } catch (error) {
    console.error('\n❌ 诊断过程中出现错误:', error);
    console.error('   错误详情:', error.stack);
  } finally {
    // 清理
    if (testQueue) {
      console.log('\n🧹 清理测试队列...');
      try {
        await testQueue.close();
        console.log('   ✅ 测试队列已关闭');
      } catch (closeError) {
        console.error('   ❌ 关闭队列失败:', closeError.message);
      }
    }
  }
}

// 运行诊断
if (require.main === module) {
  diagnoseBullIssue()
    .then(() => {
      console.log('\n📋 诊断完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 诊断失败:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseBullIssue }; 