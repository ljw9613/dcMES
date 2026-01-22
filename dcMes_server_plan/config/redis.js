/**
 * Redis配置和连接管理
 * 用于工单数量更新队列服务
 */

const Redis = require('ioredis');

// Redis配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 4, // 生产环境使用 db 2
  
  // 连接选项
  maxRetriesPerRequest: null,  // Bull 要求设为 null
  retryDelayOnFailover: 100,
  enableReadyCheck: false,     // Bull 要求设为 false
  lazyConnect: false,          // 改为 false，让 Bull 队列能立即连接并处理任务
  keepAlive: 30000,
  
  // 重连策略
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('❌ Redis 重连失败次数过多，停止重连');
      return null; // 停止重连
    }
    const delay = Math.min(times * 200, 2000); // 最大延迟2秒
    console.log(`🔄 Redis 第 ${times} 次重连，延迟 ${delay}ms`);
    return delay;
  },
  
  // 连接池配置
  family: 4,
  connectTimeout: 10000,
  commandTimeout: 30000,  // 增加到30秒，与任务超时时间一致
  
  // 自动重连配置
  autoResubscribe: true,
  autoResendUnfulfilledCommands: true
};

// 创建Redis连接实例
const createRedisConnection = () => {
  const redis = new Redis(redisConfig);
  
  // 连接成功事件
  redis.on('connect', () => {
    console.log('🔗 Redis连接已建立', {
      host: redisConfig.host,
      port: redisConfig.port,
      db: redisConfig.db,
      timestamp: new Date().toISOString()
    });
  });

  // 连接就绪事件
  redis.on('ready', () => {
    console.log('✅ Redis连接就绪', {
      host: redisConfig.host,
      port: redisConfig.port,
      timestamp: new Date().toISOString()
    });
  });

  // 连接错误事件
  redis.on('error', (error) => {
    console.error('❌ Redis连接错误:', {
      host: redisConfig.host,
      port: redisConfig.port,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  });

  // 连接关闭事件
  redis.on('close', () => {
    console.log('🔌 Redis连接已关闭', {
      host: redisConfig.host,
      port: redisConfig.port,
      timestamp: new Date().toISOString()
    });
  });

  // 重连事件
  redis.on('reconnecting', (delay) => {
    console.log('🔄 Redis正在重连...', {
      host: redisConfig.host,
      port: redisConfig.port,
      delay: `${delay}ms`,
      timestamp: new Date().toISOString()
    });
  });

  return redis;
};

// 队列配置
const queueConfig = {
  // 队列名称
  name: 'workorder-quantity-updates',
  
  // 任务选项
  defaultJobOptions: {
    removeOnComplete: 100,     // 保留最近100个成功任务
    removeOnFail: 50,          // 保留最近50个失败任务
    attempts: 3,               // 重试次数
    backoff: {
      type: 'exponential',
      delay: 2000,             // 初始延迟2秒
    },
    delay: 0,                  // 立即执行
    timeout: 30000,            // 任务超时30秒
  },

  // 队列设置
  settings: {
    stalledInterval: 30 * 1000,    // 30秒检查停滞任务
    maxStalledCount: 3,            // 最大停滞次数
  },

  // 处理器配置 - 单实例服务可以设置高一点的并发
  processor: {
    concurrency: 1,            // 并发数设为1，确保串行处理避免竞态
    name: 'update-quantity'    // 处理器名称
  }
};

// 测试Redis连接
const testRedisConnection = async () => {
  const testRedis = createRedisConnection();
  
  try {
    console.log('🧪 开始测试Redis连接...');
    
    // 执行ping命令测试连接
    const result = await testRedis.ping();
    if (result === 'PONG') {
      console.log('✅ Redis连接测试成功');
      
      // 测试基本操作
      await testRedis.set('test:plan-server:connection', 'ok', 'EX', 60);
      const value = await testRedis.get('test:plan-server:connection');
      
      if (value === 'ok') {
        console.log('✅ Redis读写操作测试成功');
        await testRedis.del('test:plan-server:connection');
      }
      
      return true;
    }
  } catch (error) {
    console.error('❌ Redis连接测试失败:', error.message);
    return false;
  } finally {
    await testRedis.disconnect();
  }
};

module.exports = {
  // Redis连接配置
  redis: redisConfig,
  
  // 队列配置
  queue: queueConfig,
  
  // 创建Redis连接函数
  createRedisConnection,
  
  // 测试Redis连接函数
  testRedisConnection
};

