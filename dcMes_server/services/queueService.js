/**
 * 队列服务 - 处理工单数量更新和托盘处理的队列操作
 * 解决多频调用时的并发问题
 */

const Queue = require('bull');
const { redis: redisConfig, createRedisConnection, testRedisConnection } = require('../config/redis');

// 创建Redis连接（使用统一的连接管理）
const redis = createRedisConnection();

// 创建工单数量更新队列
const workOrderQueue = new Queue('workorder-quantity-updates', {
  redis: {
    port: redisConfig.port,
    host: redisConfig.host,
    password: redisConfig.password,
    db: redisConfig.db,
    // 移除可能导致问题的配置
    maxRetriesPerRequest: null,  // Bull推荐设置
    enableReadyCheck: false,     // Bull推荐设置  
    lazyConnect: false,          // 改为立即连接
  },
  settings: {
    stalledInterval: 30 * 1000,    // 30秒检查停滞任务
    maxStalledCount: 3,            // 最大停滞次数
  },
  defaultJobOptions: {
    removeOnComplete: 100,         // 保留最近100个成功任务
    removeOnFail: 50,             // 保留最近50个失败任务
    attempts: 3,                  // 重试次数
    backoff: {
      type: 'exponential',
      delay: 2000,                // 初始延迟2秒
    },
    delay: 0,                     // 立即执行
    timeout: 30000,               // 任务超时30秒
  },
});

// 创建托盘处理队列
const palletQueue = new Queue('pallet-processing', {
  redis: {
    port: redisConfig.port,
    host: redisConfig.host,
    password: redisConfig.password,
    db: redisConfig.db,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
  },
  settings: {
    stalledInterval: 60 * 1000,    // 60秒检查停滞任务（托盘处理可能耗时更长）
    maxStalledCount: 3,
  },
  defaultJobOptions: {
    removeOnComplete: 50,          // 保留最近50个成功任务
    removeOnFail: 100,             // 保留最近100个失败任务（托盘处理失败需要更多记录）
    attempts: 2,                   // 托盘处理重试次数较少，避免重复处理
    backoff: {
      type: 'exponential',
      delay: 3000,                 // 托盘处理失败后延迟更长时间重试
    },
    delay: 0,
    timeout: 30000,                // 🔧 优化：托盘处理超时30秒，匹配前端等待时间
  },
});

// 创建托盘锁管理器
class PalletLockManager {
  constructor() {
    this.lockPrefix = 'pallet_lock:';
    this.lockTimeout = 15000; // 🔧 优化：减少到15秒锁超时，避免长时间占用
  }

  /**
   * 获取托盘锁键名
   * @param {string} palletKey - 托盘关键字（可以是主条码或托盘码）
   * @returns {string} Redis锁键名
   */
  getLockKey(palletKey) {
    return `${this.lockPrefix}${palletKey}`;
  }

  /**
   * 尝试获取托盘锁
   * @param {string} palletKey - 托盘关键字
   * @param {string} workerId - 工作者ID
   * @returns {Promise<boolean>} 是否成功获取锁
   */
  async acquireLock(palletKey, workerId) {
    try {
      const lockKey = this.getLockKey(palletKey);
      const result = await redis.set(
        lockKey, 
        workerId, 
        'PX', 
        this.lockTimeout, 
        'NX'
      );
      
      const acquired = result === 'OK';
      if (acquired) {
        console.log(`🔒 托盘锁已获取: ${palletKey} by ${workerId}`);
      } else {
        console.log(`⏳ 托盘锁获取失败，已被占用: ${palletKey}`);
      }
      
      return acquired;
    } catch (error) {
      console.error(`托盘锁获取异常: ${palletKey}`, error);
      return false;
    }
  }

  /**
   * 释放托盘锁
   * @param {string} palletKey - 托盘关键字
   * @param {string} workerId - 工作者ID
   * @returns {Promise<boolean>} 是否成功释放锁
   */
  async releaseLock(palletKey, workerId) {
    try {
      const lockKey = this.getLockKey(palletKey);
      
      // 使用Lua脚本确保只能释放自己的锁
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await redis.eval(luaScript, 1, lockKey, workerId);
      const released = result === 1;
      
      if (released) {
        console.log(`🔓 托盘锁已释放: ${palletKey} by ${workerId}`);
      } else {
        console.log(`⚠️ 托盘锁释放失败（可能已过期或被其他工作者持有）: ${palletKey}`);
      }
      
      return released;
    } catch (error) {
      console.error(`托盘锁释放异常: ${palletKey}`, error);
      return false;
    }
  }

  /**
   * 检查托盘锁状态
   * @param {string} palletKey - 托盘关键字
   * @returns {Promise<Object>} 锁状态信息
   */
  async getLockStatus(palletKey) {
    try {
      const lockKey = this.getLockKey(palletKey);
      const owner = await redis.get(lockKey);
      const ttl = await redis.pttl(lockKey);
      
      return {
        locked: !!owner,
        owner: owner || null,
        remainingTime: ttl > 0 ? ttl : 0
      };
    } catch (error) {
      console.error(`检查托盘锁状态异常: ${palletKey}`, error);
      return { locked: false, owner: null, remainingTime: 0 };
    }
  }

  /**
   * 扩展锁的有效期
   * @param {string} palletKey - 托盘关键字
   * @param {string} workerId - 工作者ID
   * @returns {Promise<boolean>} 是否成功扩展
   */
  async extendLock(palletKey, workerId) {
    try {
      const lockKey = this.getLockKey(palletKey);
      
      // 使用Lua脚本确保只能扩展自己的锁
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;
      
      const result = await redis.eval(luaScript, 1, lockKey, workerId, this.lockTimeout);
      return result === 1;
    } catch (error) {
      console.error(`扩展托盘锁异常: ${palletKey}`, error);
      return false;
    }
  }
}

// 创建工单锁管理器
class WorkOrderLockManager {
  constructor() {
    this.lockPrefix = 'workorder_lock:';
    this.lockTimeout = 20000; // 20秒锁超时（工单处理通常比托盘快）
  }

  /**
   * 获取工单锁键名
   * @param {string} workOrderId - 工单ID
   * @returns {string} Redis锁键名
   */
  getLockKey(workOrderId) {
    return `${this.lockPrefix}${workOrderId}`;
  }

  /**
   * 尝试获取工单锁
   * @param {string} workOrderId - 工单ID
   * @param {string} workerId - 工作者ID
   * @returns {Promise<boolean>} 是否成功获取锁
   */
  async acquireLock(workOrderId, workerId) {
    try {
      const lockKey = this.getLockKey(workOrderId);
      const result = await redis.set(
        lockKey, 
        workerId, 
        'PX', 
        this.lockTimeout, 
        'NX'
      );
      
      const acquired = result === 'OK';
      if (acquired) {
        console.log(`🔒 工单锁已获取: ${workOrderId} by ${workerId}`);
      } else {
        console.log(`⏳ 工单锁获取失败，已被占用: ${workOrderId}`);
      }
      
      return acquired;
    } catch (error) {
      console.error(`工单锁获取异常: ${workOrderId}`, error);
      return false;
    }
  }

  /**
   * 释放工单锁
   * @param {string} workOrderId - 工单ID
   * @param {string} workerId - 工作者ID
   * @returns {Promise<boolean>} 是否成功释放锁
   */
  async releaseLock(workOrderId, workerId) {
    try {
      const lockKey = this.getLockKey(workOrderId);
      
      // 使用Lua脚本确保只能释放自己的锁
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await redis.eval(luaScript, 1, lockKey, workerId);
      const released = result === 1;
      
      if (released) {
        console.log(`🔓 工单锁已释放: ${workOrderId} by ${workerId}`);
      } else {
        console.log(`⚠️ 工单锁释放失败（可能已过期或被其他工作者持有）: ${workOrderId}`);
      }
      
      return released;
    } catch (error) {
      console.error(`工单锁释放异常: ${workOrderId}`, error);
      return false;
    }
  }

  /**
   * 检查工单锁状态
   * @param {string} workOrderId - 工单ID
   * @returns {Promise<Object>} 锁状态信息
   */
  async getLockStatus(workOrderId) {
    try {
      const lockKey = this.getLockKey(workOrderId);
      const owner = await redis.get(lockKey);
      const ttl = await redis.pttl(lockKey);
      
      return {
        locked: !!owner,
        owner: owner || null,
        remainingTime: ttl > 0 ? ttl : 0
      };
    } catch (error) {
      console.error(`检查工单锁状态异常: ${workOrderId}`, error);
      return { locked: false, owner: null, remainingTime: 0 };
    }
  }

  /**
   * 扩展锁的有效期
   * @param {string} workOrderId - 工单ID
   * @param {string} workerId - 工作者ID
   * @returns {Promise<boolean>} 是否成功扩展
   */
  async extendLock(workOrderId, workerId) {
    try {
      const lockKey = this.getLockKey(workOrderId);
      
      // 使用Lua脚本确保只能扩展自己的锁
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;
      
      const result = await redis.eval(luaScript, 1, lockKey, workerId, this.lockTimeout);
      return result === 1;
    } catch (error) {
      console.error(`扩展工单锁异常: ${workOrderId}`, error);
      return false;
    }
  }
}

// 创建托盘锁管理器实例
const palletLockManager = new PalletLockManager();

// 创建工单锁管理器实例
const workOrderLockManager = new WorkOrderLockManager();

class QueueService {
  /**
   * 添加工单数量更新任务到队列
   * @param {string} workOrderId - 工单ID
   * @param {string} type - 更新类型 ('input' | 'output')
   * @param {number} quantity - 更新数量
   * @param {Object} logContext - 日志上下文信息
   * @returns {Promise<Object>} 队列任务信息
   */
  static async addWorkOrderQuantityUpdate(workOrderId, type, quantity = 1, logContext = {}) {
    try {
      console.log(`添加工单更新任务到队列: ${workOrderId}, type: ${type}, quantity: ${quantity}`);

      const job = await workOrderQueue.add(
        'update-quantity',
        {
          workOrderId,
          type,
          quantity,
          logContext,
          timestamp: Date.now(),
          requestId: `${workOrderId}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        {
          // 使用工单ID和类型确保同一工单的同类型操作按顺序处理
          jobId: `${workOrderId}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          priority: this.getTaskPriority(type),
          // 立即执行，不延迟
          delay: 0,
        }
      );

      console.log(`工单更新任务已添加到队列: JobId=${job.id}, WorkOrderId=${workOrderId}`);

      return {
        success: true,
        jobId: job.id,
        workOrderId: workOrderId,
        type: type,
        quantity: quantity,
        message: '更新任务已加入队列',
        estimatedDelay: await this.getEstimatedDelay(),
        queueLength: (workOrderQueue.getWaiting ? 
          await workOrderQueue.getWaiting() : 
          await workOrderQueue.waiting()).length
      };

    } catch (error) {
      console.error('添加工单更新任务到队列失败:', error);
      return {
        success: false,
        error: error.message,
        workOrderId: workOrderId,
        type: type,
        quantity: quantity
      };
    }
  }

  /**
   * 添加托盘处理任务到队列
   * @param {Object} palletData - 托盘处理数据
   * @returns {Promise<Object>} 队列任务信息
   */
  static async addPalletProcessingTask(palletData) {
    try {
      const {
        lineId,
        lineName,
        processStepId,
        materialId,
        materialCode,
        materialName,
        materialSpec,
        mainBarcode,
        boxBarcode,
        totalQuantity,
        userId,
        componentScans,
        fromRepairStation = false
      } = palletData;

      console.log(`添加托盘处理任务到队列: 条码=${mainBarcode}, 产线=${lineName}`);

      const job = await palletQueue.add(
        'handle-pallet-barcode',
        {
          lineId,
          lineName,
          processStepId,
          materialId,
          materialCode,
          materialName,
          materialSpec,
          mainBarcode,
          boxBarcode,
          totalQuantity,
          userId,
          componentScans,
          fromRepairStation,
          timestamp: Date.now(),
          requestId: `pallet_${mainBarcode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        {
          jobId: `pallet_${mainBarcode}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          priority: this.getPalletTaskPriority(fromRepairStation),
          delay: 0, // 立即执行
        }
      );

      console.log(`托盘处理任务已添加到队列: JobId=${job.id}, 条码=${mainBarcode}`);

      return {
        success: true,
        jobId: job.id,
        mainBarcode: mainBarcode,
        message: '托盘处理任务已加入队列',
        estimatedDelay: await this.getPalletEstimatedDelay(),
        queueLength: (palletQueue.getWaiting ? 
          await palletQueue.getWaiting() : 
          await palletQueue.waiting()).length
      };

    } catch (error) {
      console.error('添加托盘处理任务到队列失败:', error);
      return {
        success: false,
        error: error.message,
        mainBarcode: palletData.mainBarcode
      };
    }
  }

  /**
   * 获取任务优先级
   * @param {string} type - 更新类型
   * @returns {number} 优先级（数值越高优先级越高）
   */
  static getTaskPriority(type) {
    const priorities = {
      'output': 10,    // 产出更新优先级最高
      'input': 5,      // 投入更新优先级中等
      'scrap': 3,      // 报废更新优先级较低
    };
    return priorities[type] || 1;
  }

  /**
   * 获取托盘任务优先级
   * @param {boolean} fromRepairStation - 是否来自维修台
   * @returns {number} 优先级（数值越高优先级越高）
   */
  static getPalletTaskPriority(fromRepairStation) {
    return fromRepairStation ? 15 : 10; // 维修台的任务优先级更高
  }

  /**
   * 计算任务延迟时间
   * @param {string} workOrderId - 工单ID
   * @param {string} type - 更新类型
   * @returns {number} 延迟毫秒数
   */
  static calculateDelay(workOrderId, type) {
    // 为避免同一工单的大量并发操作，添加少量随机延迟
    const baseDelay = 50; // 基础延迟50ms
    const randomDelay = Math.floor(Math.random() * 100); // 随机0-100ms
    return baseDelay + randomDelay;
  }

  /**
   * 获取预估处理延迟
   * @returns {Promise<number>} 预估延迟毫秒数
   */
  static async getEstimatedDelay() {
    try {
      // 兼容不同版本的Bull队列方法
      const waitingJobs = workOrderQueue.getWaiting ? 
        await workOrderQueue.getWaiting() : 
        await workOrderQueue.waiting();
      const activeJobs = workOrderQueue.getActive ? 
        await workOrderQueue.getActive() : 
        await workOrderQueue.active();
      
      // 假设每个任务平均处理时间200ms
      const avgProcessTime = 200;
      const totalJobs = waitingJobs.length + activeJobs.length;
      
      return totalJobs * avgProcessTime;
    } catch (error) {
      console.error('获取预估延迟失败:', error);
      return 0;
    }
  }

  /**
   * 获取托盘处理预估延迟
   * @returns {Promise<number>} 预估延迟毫秒数
   */
  static async getPalletEstimatedDelay() {
    try {
      const waitingJobs = palletQueue.getWaiting ? 
        await palletQueue.getWaiting() : 
        await palletQueue.waiting();
      const activeJobs = palletQueue.getActive ? 
        await palletQueue.getActive() : 
        await palletQueue.active();
      
      // 托盘处理平均时间更长，估计3秒
      const avgProcessTime = 3000;
      const totalJobs = waitingJobs.length + activeJobs.length;
      
      return totalJobs * avgProcessTime;
    } catch (error) {
      console.error('获取托盘处理预估延迟失败:', error);
      return 0;
    }
  }

  /**
   * 初始化队列处理器
   */
  static async initializeProcessor(totalInstances = 1) {
    console.log('🚀 初始化队列处理器...');
    
    // 首先测试Redis连接
    console.log('📋 检查Redis连接状态...');
    const isRedisConnected = await testRedisConnection();
    
    if (!isRedisConnected) {
      console.error('❌ Redis连接失败，队列服务无法启动');
      throw new Error('Redis连接失败，队列服务无法启动');
    }
    
    console.log('✅ Redis连接正常，继续初始化队列处理器...');

    // 初始化工单数量更新处理器
    this.initializeWorkOrderProcessor(totalInstances);
    
    // 初始化托盘处理器
    this.initializePalletProcessor(totalInstances);

    // 设置事件监听器
    this.setupEventListeners();
  }

  /**
   * 初始化工单处理器
   * @param {number} totalInstances - PM2 实例总数，用于计算每实例并发数
   */
  static initializeWorkOrderProcessor(totalInstances = 1) {
    // 工单队列全局期望并发数为 6，按实例数均分，每实例最少保留 1
    // 所有实例都注册消费者，Bull 通过 Redis 任务锁保证同一任务不会被多个实例重复处理
    const concurrency = Math.max(1, Math.floor(6 / totalInstances));
    console.log(`🔧 初始化工单数量更新处理器（并发数: ${concurrency}，总实例数: ${totalInstances}）...`);
    
    workOrderQueue.process('update-quantity', concurrency, async (job) => {
      const startTime = Date.now();
      const workerId = `worker_${process.pid}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const { workOrderId, type, quantity, logContext, requestId } = job.data;

      // 使用工单ID作为锁的关键字
      let lockAcquired = false;

      try {
        console.log(`📝 开始处理工单更新任务: ${job.id}, WorkOrder: ${workOrderId}, Type: ${type}, Quantity: ${quantity}, Worker: ${workerId}`);

        // 更新进度
        await job.progress(5);

        // 尝试获取工单锁，等待最多3秒
        console.log(`🔐 尝试获取工单锁: ${workOrderId}`);
        const lockStartTime = Date.now();
        const maxLockWaitTime = 3000; // 最多等待3秒（工单处理比托盘快）
        
        while (Date.now() - lockStartTime < maxLockWaitTime) {
          lockAcquired = await workOrderLockManager.acquireLock(workOrderId, workerId);
          if (lockAcquired) {
            break;
          }
          
          // 检查锁状态
          const lockStatus = await workOrderLockManager.getLockStatus(workOrderId);
          console.log(`⏳ 等待工单锁释放: ${workOrderId}, 当前持有者: ${lockStatus.owner}, 剩余时间: ${lockStatus.remainingTime}ms`);
          
          // 等待100ms后重试
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!lockAcquired) {
          throw new Error(`无法获取工单锁: ${workOrderId}，可能存在并发冲突或锁超时`);
        }

        await job.progress(10);

        // 确保数据库连接和模型初始化
        try {
          // 导入MaterialProcessFlowService来执行实际的更新操作
          const MaterialProcessFlowService = require('./materialProcessFlowService');
          
          await job.progress(30);
          
          // 定期扩展锁的有效期，防止长时间处理导致锁过期
          const extendLockInterval = setInterval(async () => {
            await workOrderLockManager.extendLock(workOrderId, workerId);
          }, 8000); // 每8秒扩展一次
          
          try {
            // 执行实际的数据库更新操作
            const result = await MaterialProcessFlowService._executeWorkOrderQuantityUpdate(
              workOrderId, 
              type, 
              quantity, 
              logContext
            );

            clearInterval(extendLockInterval);

            const duration = Date.now() - startTime;
            console.log(`✅ 工单更新任务完成: ${job.id}, WorkOrder: ${workOrderId}, 耗时: ${duration}ms, Worker: ${workerId}`);

            // 更新任务进度
            await job.progress(100);
            
            return {
              success: true,
              workOrderId,
              type,
              quantity,
              result,
              duration,
              workerId,
              processedAt: new Date().toISOString()
            };
          } finally {
            clearInterval(extendLockInterval);
          }
          
        } catch (dbError) {
          // 如果是数据库模型问题，提供更详细的错误信息
          if (dbError.message.includes('Schema hasn\'t been registered')) {
            console.error(`🚨 Mongoose模型未注册错误: ${dbError.message}`);
            console.error('   这通常是因为队列处理器中数据库连接未完全初始化');
            
            // 尝试重新连接数据库
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState !== 1) {
              console.log('   数据库连接状态:', mongoose.connection.readyState);
              throw new Error('数据库连接未就绪，请稍后重试');
            }
          }
          throw dbError;
        }

      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ 工单更新任务失败: ${job.id}, WorkOrder: ${workOrderId}, 耗时: ${duration}ms, Worker: ${workerId}`, error);

        // 记录错误详情
        await job.progress(100);
        
        throw new Error(`工单${workOrderId}更新失败: ${error.message}`);
      } finally {
        // 无论成功还是失败都要释放锁
        if (lockAcquired) {
          await workOrderLockManager.releaseLock(workOrderId, workerId);
        }
      }
    });
  }

  /**
   * 初始化托盘处理器
   * @param {number} totalInstances - PM2 实例总数，用于计算每实例并发数
   */
  static initializePalletProcessor(totalInstances = 1) {
    // 托盘队列全局期望并发数为 6，按实例数均分，每实例最少保留 1
    const concurrency = Math.max(1, Math.floor(6 / totalInstances));
    console.log(`🔧 初始化托盘处理器（并发数: ${concurrency}，总实例数: ${totalInstances}）...`);
    
    palletQueue.process('handle-pallet-barcode', concurrency, async (job) => {
      const startTime = Date.now();
      const workerId = `worker_${process.pid}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const {
        lineId,
        lineName,
        processStepId,
        materialId,
        materialCode,
        materialName,
        materialSpec,
        mainBarcode,
        boxBarcode,
        totalQuantity,
        userId,
        componentScans,
        fromRepairStation,
        requestId
      } = job.data;

      // 使用主条码作为托盘锁的关键字
      const palletKey = mainBarcode;
      let lockAcquired = false;

      try {
        console.log(`🎯 开始处理托盘任务: ${job.id}, 条码: ${mainBarcode}, 产线: ${lineName}, Worker: ${workerId}`);
        
        // 更新进度
        await job.progress(5);

        // 🔧 优化：调整锁等待时间，与锁超时时间匹配
        console.log(`🔐 尝试获取托盘锁: ${palletKey}`);
        const lockStartTime = Date.now();
        const maxLockWaitTime = 18000; // 🔧 增加到18秒等待时间（略大于锁超时的15秒）
        
        while (Date.now() - lockStartTime < maxLockWaitTime) {
          lockAcquired = await palletLockManager.acquireLock(palletKey, workerId);
          if (lockAcquired) {
            break;
          }
          
          // 检查锁状态
          const lockStatus = await palletLockManager.getLockStatus(palletKey);
          console.log(`⏳ 等待托盘锁释放: ${palletKey}, 当前持有者: ${lockStatus.owner}, 剩余时间: ${lockStatus.remainingTime}ms`);
          
          // 🔧 优化：根据剩余时间调整等待间隔
          const waitTime = lockStatus.remainingTime > 5000 ? 1000 : 300; // 剩余时间长则等待更久
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        if (!lockAcquired) {
          throw new Error(`无法获取托盘锁: ${palletKey}，可能存在并发冲突或锁超时`);
        }

        await job.progress(10);

        // 导入MaterialPalletizingService来执行实际的托盘处理
        const MaterialPalletizingService = require('./materialPalletizing');
        
        // 执行实际的托盘处理操作
        await job.progress(30);
        
        // 🔧 优化：定期扩展锁的有效期，防止长时间处理导致锁过期
        const extendLockInterval = setInterval(async () => {
          const extended = await palletLockManager.extendLock(palletKey, workerId);
          if (!extended) {
            console.warn(`⚠️ 锁续期失败，可能已被释放: ${palletKey}, Worker: ${workerId}`);
          }
        }, 8000); // 🔧 每8秒扩展一次（锁15秒超时，8秒续期保持安全边距）
        
        try {
          // 🔧 关键修复：使用内部方法避免双重锁机制
          // 队列处理器已经获取了锁，所以直接调用内部实现
          const result = await MaterialPalletizingService._handlePalletBarcodeWithRetry(
            lineId,
            lineName,
            processStepId,
            materialId,
            materialCode,
            materialName,
            materialSpec,
            mainBarcode,
            boxBarcode,
            totalQuantity,
            userId,
            componentScans,
            fromRepairStation
          );

          clearInterval(extendLockInterval);

          const duration = Date.now() - startTime;
          console.log(`✅ 托盘处理任务完成: ${job.id}, 条码: ${mainBarcode}, 耗时: ${duration}ms, Worker: ${workerId}`);

          // 更新任务进度为完成
          await job.progress(100);
          
          return {
            success: true,
            mainBarcode,
            palletCode: result.palletCode,
            result,
            duration,
            workerId,
            processedAt: new Date().toISOString()
          };
        } finally {
          clearInterval(extendLockInterval);
        }

      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ 托盘处理任务失败: ${job.id}, 条码: ${mainBarcode}, 耗时: ${duration}ms, Worker: ${workerId}`, error);

        // 记录错误详情
        await job.progress(100);
        
        throw new Error(`托盘条码${mainBarcode}处理失败: ${error.message}`);
      } finally {
        // 无论成功还是失败都要释放锁
        if (lockAcquired) {
          await palletLockManager.releaseLock(palletKey, workerId);
        }
      }
    });
  }

  /**
   * 设置队列事件监听器
   */
  static setupEventListeners() {
    // 工单队列事件
    workOrderQueue.on('completed', (job, result) => {
      console.log(`✅ 工单队列任务完成: ${job.id}`, {
        workOrderId: result.workOrderId,
        type: result.type,
        quantity: result.quantity,
        duration: result.duration
      });
    });

    workOrderQueue.on('failed', (job, err) => {
      console.error(`❌ 工单队列任务失败: ${job.id}`, {
        workOrderId: job.data.workOrderId,
        type: job.data.type,
        quantity: job.data.quantity,
        error: err.message,
        attempts: job.attemptsMade
      });
    });

    workOrderQueue.on('stalled', (job) => {
      console.warn(`⚠️ 工单队列任务停滞: ${job.id}`, {
        workOrderId: job.data.workOrderId,
        type: job.data.type,
        quantity: job.data.quantity
      });
    });

    // 托盘队列事件
    palletQueue.on('completed', (job, result) => {
      console.log(`✅ 托盘队列任务完成: ${job.id}`, {
        mainBarcode: result.mainBarcode,
        palletCode: result.palletCode,
        duration: result.duration
      });
    });

    palletQueue.on('failed', (job, err) => {
      console.error(`❌ 托盘队列任务失败: ${job.id}`, {
        mainBarcode: job.data.mainBarcode,
        lineId: job.data.lineId,
        error: err.message,
        attempts: job.attemptsMade
      });
    });

    palletQueue.on('stalled', (job) => {
      console.warn(`⚠️ 托盘队列任务停滞: ${job.id}`, {
        mainBarcode: job.data.mainBarcode,
        lineId: job.data.lineId
      });
    });

    palletQueue.on('progress', (job, progress) => {
      if (progress % 25 === 0) { // 只记录25%的进度节点
        console.log(`📈 托盘队列任务进度: ${job.id} - ${progress}%`);
      }
    });
  }

  /**
   * 获取队列状态
   * @returns {Promise<Object>} 队列状态信息
   */
  static async getQueueStats() {
    try {
      // 工单队列统计
      const [workOrderWaiting, workOrderActive, workOrderCompleted, workOrderFailed, workOrderDelayed] = await Promise.all([
        workOrderQueue.getWaiting ? workOrderQueue.getWaiting() : workOrderQueue.waiting(),
        workOrderQueue.getActive ? workOrderQueue.getActive() : workOrderQueue.active(),
        workOrderQueue.getCompleted ? workOrderQueue.getCompleted() : workOrderQueue.completed(),
        workOrderQueue.getFailed ? workOrderQueue.getFailed() : workOrderQueue.failed(),
        workOrderQueue.getDelayed ? workOrderQueue.getDelayed() : workOrderQueue.delayed()
      ]);

      // 托盘队列统计
      const [palletWaiting, palletActive, palletCompleted, palletFailed, palletDelayed] = await Promise.all([
        palletQueue.getWaiting ? palletQueue.getWaiting() : palletQueue.waiting(),
        palletQueue.getActive ? palletQueue.getActive() : palletQueue.active(),
        palletQueue.getCompleted ? palletQueue.getCompleted() : palletQueue.completed(),
        palletQueue.getFailed ? palletQueue.getFailed() : palletQueue.failed(),
        palletQueue.getDelayed ? palletQueue.getDelayed() : palletQueue.delayed()
      ]);

      return {
        workOrderQueue: {
          waiting: workOrderWaiting.length,
          active: workOrderActive.length,
          completed: workOrderCompleted.length,
          failed: workOrderFailed.length,
          delayed: workOrderDelayed.length,
          total: workOrderWaiting.length + workOrderActive.length + workOrderCompleted.length + workOrderFailed.length + workOrderDelayed.length
        },
        palletQueue: {
          waiting: palletWaiting.length,
          active: palletActive.length,
          completed: palletCompleted.length,
          failed: palletFailed.length,
          delayed: palletDelayed.length,
          total: palletWaiting.length + palletActive.length + palletCompleted.length + palletFailed.length + palletDelayed.length
        },
        health: 'OK',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取队列状态失败:', error);
      return {
        error: error.message,
        health: 'ERROR',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 清理队列
   * @param {Object} options - 清理选项
   */
  static async cleanQueue(options = {}) {
    try {
      const {
        completedAge = 24 * 60 * 60 * 1000, // 24小时
        failedAge = 7 * 24 * 60 * 60 * 1000, // 7天
        activeAge = 60 * 60 * 1000           // 1小时
      } = options;

      await Promise.all([
        // 清理工单队列
        workOrderQueue.clean(completedAge, 'completed'),
        workOrderQueue.clean(failedAge, 'failed'),
        workOrderQueue.clean(activeAge, 'active'),
        // 清理托盘队列
        palletQueue.clean(completedAge, 'completed'),
        palletQueue.clean(failedAge, 'failed'),
        palletQueue.clean(activeAge, 'active')
      ]);

      console.log('✅ 队列清理完成');
      return { success: true, message: '队列清理完成' };
    } catch (error) {
      console.error('队列清理失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 暂停队列
   */
  static async pauseQueue() {
    try {
      await Promise.all([
        workOrderQueue.pause(),
        palletQueue.pause()
      ]);
      console.log('⏸️ 所有队列已暂停');
      return { success: true, message: '所有队列已暂停' };
    } catch (error) {
      console.error('暂停队列失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 恢复队列
   */
  static async resumeQueue() {
    try {
      await Promise.all([
        workOrderQueue.resume(),
        palletQueue.resume()
      ]);
      console.log('▶️ 所有队列已恢复');
      return { success: true, message: '所有队列已恢复' };
    } catch (error) {
      console.error('恢复队列失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 关闭队列服务
   */
  static async shutdown() {
    try {
      console.log('🛑 关闭队列服务...');
      await Promise.all([
        workOrderQueue.close(),
        palletQueue.close()
      ]);
      await redis.disconnect();
      console.log('✅ 队列服务已关闭');
    } catch (error) {
      console.error('关闭队列服务失败:', error);
    }
  }

  /**
   * 获取托盘锁状态信息
   * @returns {Promise<Object>} 托盘锁状态
   */
  static async getPalletLockStats() {
    try {
      // 查找所有托盘锁
      const lockKeys = await redis.keys(`${palletLockManager.lockPrefix}*`);
      const lockStats = [];

      for (const lockKey of lockKeys) {
        const palletKey = lockKey.replace(palletLockManager.lockPrefix, '');
        const status = await palletLockManager.getLockStatus(palletKey);
        lockStats.push({
          palletKey,
          ...status
        });
      }

      return {
        totalLocks: lockStats.length,
        locks: lockStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取托盘锁统计失败:', error);
      return {
        error: error.message,
        totalLocks: 0,
        locks: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取工单锁状态信息
   * @returns {Promise<Object>} 工单锁状态
   */
  static async getWorkOrderLockStats() {
    try {
      // 查找所有工单锁
      const lockKeys = await redis.keys(`${workOrderLockManager.lockPrefix}*`);
      const lockStats = [];

      for (const lockKey of lockKeys) {
        const workOrderId = lockKey.replace(workOrderLockManager.lockPrefix, '');
        const status = await workOrderLockManager.getLockStatus(workOrderId);
        lockStats.push({
          workOrderId,
          ...status
        });
      }

      return {
        totalLocks: lockStats.length,
        locks: lockStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取工单锁统计失败:', error);
      return {
        error: error.message,
        totalLocks: 0,
        locks: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 清理过期或孤儿托盘锁
   * @returns {Promise<Object>} 清理结果
   */
  static async cleanPalletLocks() {
    try {
      console.log('🧹 开始清理托盘锁...');
      
      const lockKeys = await redis.keys(`${palletLockManager.lockPrefix}*`);
      let cleanedCount = 0;
      let errorCount = 0;

      for (const lockKey of lockKeys) {
        try {
          const ttl = await redis.pttl(lockKey);
          // 清理已过期的锁（TTL为-1表示没有过期时间，-2表示不存在）
          if (ttl === -2) {
            cleanedCount++;
          } else if (ttl === -1) {
            // 没有设置过期时间的锁，强制删除
            await redis.del(lockKey);
            cleanedCount++;
            console.log(`🗑️ 清理无过期时间的托盘锁: ${lockKey}`);
          }
        } catch (error) {
          console.error(`清理托盘锁失败: ${lockKey}`, error);
          errorCount++;
        }
      }

      console.log(`✅ 托盘锁清理完成，清理数量: ${cleanedCount}, 错误数量: ${errorCount}`);
      
      return {
        success: true,
        message: `托盘锁清理完成`,
        cleanedCount,
        errorCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('清理托盘锁失败:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 清理过期或孤儿工单锁
   * @returns {Promise<Object>} 清理结果
   */
  static async cleanWorkOrderLocks() {
    try {
      console.log('🧹 开始清理工单锁...');
      
      const lockKeys = await redis.keys(`${workOrderLockManager.lockPrefix}*`);
      let cleanedCount = 0;
      let errorCount = 0;

      for (const lockKey of lockKeys) {
        try {
          const ttl = await redis.pttl(lockKey);
          // 清理已过期的锁（TTL为-1表示没有过期时间，-2表示不存在）
          if (ttl === -2) {
            cleanedCount++;
          } else if (ttl === -1) {
            // 没有设置过期时间的锁，强制删除
            await redis.del(lockKey);
            cleanedCount++;
            console.log(`🗑️ 清理无过期时间的工单锁: ${lockKey}`);
          }
        } catch (error) {
          console.error(`清理工单锁失败: ${lockKey}`, error);
          errorCount++;
        }
      }

      console.log(`✅ 工单锁清理完成，清理数量: ${cleanedCount}, 错误数量: ${errorCount}`);
      
      return {
        success: true,
        message: `工单锁清理完成`,
        cleanedCount,
        errorCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('清理工单锁失败:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 清理所有锁资源
   * @returns {Promise<Object>} 清理结果
   */
  static async cleanAllLocks() {
    try {
      console.log('🧹 开始清理所有锁资源...');
      
      const [palletResult, workOrderResult] = await Promise.all([
        this.cleanPalletLocks(),
        this.cleanWorkOrderLocks()
      ]);

      return {
        success: palletResult.success && workOrderResult.success,
        message: '所有锁资源清理完成',
        palletLocks: palletResult,
        workOrderLocks: workOrderResult,
        totalCleaned: (palletResult.cleanedCount || 0) + (workOrderResult.cleanedCount || 0),
        totalErrors: (palletResult.errorCount || 0) + (workOrderResult.errorCount || 0),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('清理所有锁失败:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// 导出队列实例和服务类
module.exports = {
  QueueService,
  workOrderQueue,
  palletQueue,
  redis,
  testRedisConnection,  // 导出Redis连接测试函数
  palletLockManager,    // 导出托盘锁管理器
  workOrderLockManager  // 导出工单锁管理器
}; 