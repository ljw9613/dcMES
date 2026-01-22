/**
 * 完整的队列服务测试 - 包含数据库初始化
 */

const mongoose = require('mongoose');

async function completeQueueTest() {
  console.log('🧪 开始完整的队列服务测试（包含数据库初始化）...\n');

  try {
    // 1. 初始化数据库连接
    console.log('1️⃣ 初始化数据库连接...');
    
    const mongodbUrl = "mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes";
    const connectOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 120000,
      connectTimeoutMS: 30000,
      maxPoolSize: 50,
      minPoolSize: 10,
      maxConnecting: 20,
      retryWrites: true,
      family: 4,
      maxIdleTimeMS: 60000,
      heartbeatFrequencyMS: 10000,
      waitQueueTimeoutMS: 10000,
      writeConcern: { w: 1 },
      readPreference: 'primaryPreferred'
    };

    await mongoose.connect(mongodbUrl, connectOptions);
    console.log('   ✅ 数据库连接成功，状态:', mongoose.connection.readyState);

    // 2. 等待一段时间确保所有模型加载
    console.log('\n2️⃣ 等待模型加载...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. 验证关键模型是否可用
    console.log('\n3️⃣ 验证模型可用性...');
    try {
      const WorkOrderModel = mongoose.model('production_plan_work_order');
      const WorkOrderQuantityLogModel = mongoose.model('workOrderQuantityLog');
      console.log('   ✅ 关键模型已加载');
    } catch (modelError) {
      console.log('   ⚠️ 某些模型可能未加载:', modelError.message);
      // 尝试加载必要的模型
      require('../model/project/productionPlanWorkOrder');
      require('../model/project/workOrderQuantityLog');
      console.log('   ✅ 手动加载模型完成');
    }

    // 4. 初始化队列服务
    console.log('\n4️⃣ 初始化队列服务...');
    const { QueueService } = require('../services/queueService');
    
    await QueueService.initializeProcessor();
    console.log('   ✅ 队列服务初始化完成');

    // 5. 添加测试任务
    console.log('\n5️⃣ 添加测试任务...');
    const testWorkOrderId = 'complete-test-' + Date.now();
    
    const result = await QueueService.addWorkOrderQuantityUpdate(
      testWorkOrderId,
      'output',
      1,
      {
        operatorId: 'COMPLETE_TEST_USER',
        relatedBarcode: 'COMPLETE_TEST_BARCODE',
        reason: '完整测试',
        source: 'COMPLETE_TEST'
      }
    );

    if (result.success) {
      console.log('   ✅ 测试任务添加成功:', result.jobId);

      // 6. 监控任务处理
      console.log('\n6️⃣ 监控任务处理（15秒）...');
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const stats = await QueueService.getQueueStats();
        console.log(`   ${i + 1}s: waiting=${stats.waiting}, active=${stats.active}, completed=${stats.completed}, failed=${stats.failed}`);
        
        if (stats.completed > 0) {
          console.log('   🎉 任务处理成功！');
          break;
        } else if (stats.failed > 0) {
          console.log('   ❌ 任务处理失败！');
          break;
        }
      }

      // 7. 最终状态
      console.log('\n7️⃣ 最终状态:');
      const finalStats = await QueueService.getQueueStats();
      console.log('   队列状态:', finalStats);
      
    } else {
      console.log('   ❌ 测试任务添加失败:', result.error);
    }

  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error);
    console.error('   错误详情:', error.stack);
  } finally {
    // 8. 清理
    console.log('\n8️⃣ 清理资源...');
    try {
      await mongoose.connection.close();
      console.log('   ✅ 数据库连接已关闭');
    } catch (closeError) {
      console.error('   ❌ 关闭数据库连接失败:', closeError.message);
    }
  }
}

// 运行完整测试
if (require.main === module) {
  completeQueueTest()
    .then(() => {
      console.log('\n📋 完整测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 完整测试失败:', error);
      process.exit(1);
    });
}

module.exports = { completeQueueTest }; 