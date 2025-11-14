#!/usr/bin/env node

/**
 * dcMes工单处理服务 - 启动文件
 * 专门处理工单投入产出等任务，避免PM2负载均衡导致的并发问题
 */

const http = require('http');
const app = require('./app');
const { connectDatabase, closeDatabase } = require('./config/database');
const { QueueService } = require('./services/queueService');
const { testRedisConnection } = require('./config/redis');

// 获取端口配置
const PORT = process.env.PORT || 3001;

// 服务器实例
let server = null;

/**
 * 启动服务
 */
async function startServer() {
  try {
    console.log('🚀 正在启动dcMes工单处理服务...');
    console.log('═'.repeat(60));

    // 1. 测试Redis连接
    console.log('\n📌 步骤 1/3: 测试Redis连接...');
    const redisOk = await testRedisConnection();
    if (!redisOk) {
      throw new Error('Redis连接测试失败');
    }

    // 2. 连接数据库
    console.log('\n📌 步骤 2/3: 连接数据库...');
    await connectDatabase();

    // 3. 初始化队列服务
    console.log('\n📌 步骤 3/3: 初始化队列服务...');
    await QueueService.initialize();

    console.log('\n═'.repeat(60));
    console.log('✅ 所有初始化步骤完成');

    // 创建HTTP服务器
    server = http.createServer(app);

    // 监听端口
    server.listen(PORT, () => {
      console.log('\n🎉 dcMes工单处理服务启动成功!');
      console.log('═'.repeat(60));
      console.log(`📡 服务地址: http://localhost:${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📅 启动时间: ${new Date().toISOString()}`);
      console.log(`🆔 进程ID: ${process.pid}`);
      console.log('═'.repeat(60));
      console.log('\n🔍 可用接口:');
      console.log(`  - 健康检查: GET http://localhost:${PORT}/health`);
      console.log(`  - 首页: GET http://localhost:${PORT}/`);
      console.log(`  - 更新工单数量: POST http://localhost:${PORT}/api/workorder/update-quantity`);
      console.log(`  - 队列统计: GET http://localhost:${PORT}/api/workorder/queue/stats`);
      console.log('═'.repeat(60));
    });

    // 服务器错误处理
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      // 处理特定监听错误
      switch (error.code) {
        case 'EACCES':
          console.error(`❌ ${bind} 需要提升权限`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ ${bind} 已被占用`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    console.error('\n❌ 启动服务失败:', error);
    console.error('═'.repeat(60));
    process.exit(1);
  }
}

/**
 * 优雅关闭服务
 */
async function gracefulShutdown(signal) {
  console.log(`\n\n🛑 收到${signal}信号，开始优雅关闭服务...`);
  console.log('═'.repeat(60));

  try {
    // 1. 停止接收新请求
    if (server) {
      console.log('📌 步骤 1/3: 停止接收新请求...');
      await new Promise((resolve) => {
        server.close(resolve);
      });
      console.log('✅ HTTP服务器已关闭');
    }

    // 2. 关闭队列服务
    console.log('📌 步骤 2/3: 关闭队列服务...');
    await QueueService.shutdown();
    console.log('✅ 队列服务已关闭');

    // 3. 关闭数据库连接
    console.log('📌 步骤 3/3: 关闭数据库连接...');
    await closeDatabase();
    console.log('✅ 数据库连接已关闭');

    console.log('═'.repeat(60));
    console.log('✅ 服务已安全关闭');
    process.exit(0);

  } catch (error) {
    console.error('❌ 关闭服务时发生错误:', error);
    console.error('═'.repeat(60));
    process.exit(1);
  }
}

// 监听进程信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 监听未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('\n❌ 未捕获的异常:', error);
  console.error('═'.repeat(60));
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ 未处理的Promise拒绝:', reason);
  console.error('Promise:', promise);
  console.error('═'.repeat(60));
  gracefulShutdown('unhandledRejection');
});

// 启动服务
startServer();

