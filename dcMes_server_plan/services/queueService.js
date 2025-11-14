/**
 * 工单队列服务
 * 专门处理工单数量更新任务，避免并发问题
 * 
 * 特点：
 * 1. 单实例运行，不会因PM2负载均衡导致重复处理
 * 2. 串行处理工单更新，避免竞态条件
 * 3. Redis持久化队列，任务不丢失
 * 4. 支持任务重试和失败处理
 */

const Queue = require('bull');
const Redis = require('ioredis');
const { redis: redisConfig, queue: queueConfig } = require('../config/redis');

// 队列实例
let workOrderQueue = null;

// Redis锁管理器
class WorkOrderLockManager {
  constructor() {
    this.redis = new Redis(redisConfig);
    this.lockTimeout = 30000; // 锁超时30秒
    this.lockPrefix = 'workorder:lock:';
  }

  /**
   * 获取锁键名
   */
  getLockKey(workOrderId) {
    return `${this.lockPrefix}${workOrderId}`;
  }

  /**
   * 获取锁（带超时保护）
   */
  async acquireLock(workOrderId, workerId) {
    const lockKey = this.getLockKey(workOrderId);
    const lockValue = `${workerId}:${Date.now()}`;
    
    try {
      // 使用Promise.race实现超时控制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('获取锁超时')), 10000); // 10秒超时
      });
      
      const lockPromise = this.redis.set(
        lockKey,
        lockValue,
        'PX',
        this.lockTimeout,
        'NX'
      );
      
      // 使用SET NX EX命令原子性地设置锁（带超时保护）
      const result = await Promise.race([lockPromise, timeoutPromise]);
      
      if (result === 'OK') {
        console.log(`🔒 获取工单锁成功: ${workOrderId}, 工作者: ${workerId}`);
        return { success: true, lockValue };
      }
      
      // 检查现有锁的持有者
      const existingLock = await this.redis.get(lockKey).catch(err => {
        console.error(`⚠️ 检查锁持有者失败: ${err.message}`);
        return null;
      });
      console.log(`⏳ 工单锁被占用: ${workOrderId}, 持有者: ${existingLock}`);
      return { success: false, holder: existingLock };
      
    } catch (error) {
      console.error(`❌ 获取工单锁失败: ${workOrderId}`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 释放锁（带超时保护）
   */
  async releaseLock(workOrderId, workerId) {
    const lockKey = this.getLockKey(workOrderId);
    
    try {
      // 使用Lua脚本确保只有锁的持有者才能释放锁
      const script = `
        local lockKey = KEYS[1]
        local workerId = ARGV[1]
        local currentValue = redis.call('get', lockKey)
        
        if currentValue then
          local currentWorkerId = string.match(currentValue, "^([^:]+):")
          if currentWorkerId == workerId then
            return redis.call('del', lockKey)
          end
        end
        return 0
      `;
      
      // 使用Promise.race实现超时控制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('释放锁超时')), 5000); // 5秒超时
      });
      
      const evalPromise = this.redis.eval(script, 1, lockKey, workerId);
      const result = await Promise.race([evalPromise, timeoutPromise]);
      
      if (result === 1) {
        console.log(`🔓 释放工单锁成功: ${workOrderId}, 工作者: ${workerId}`);
        return { success: true };
      } else {
        console.log(`⚠️ 释放工单锁失败(非持有者): ${workOrderId}, 工作者: ${workerId}`);
        return { success: false, reason: '非锁持有者' };
      }
      
    } catch (error) {
      console.error(`❌ 释放工单锁异常: ${workOrderId}`, error.message);
      // 即使释放锁失败，锁也会自动过期，所以只记录错误不抛出
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取锁状态
   */
  async getLockStatus(workOrderId) {
    const lockKey = this.getLockKey(workOrderId);
    
    try {
      const value = await this.redis.get(lockKey);
      const ttl = await this.redis.pttl(lockKey);
      
      if (value) {
        const [workerId, timestamp] = value.split(':');
        return {
          locked: true,
          workerId,
          timestamp: parseInt(timestamp),
          ttl: ttl > 0 ? ttl : 0
        };
      }
      
      return { locked: false };
      
    } catch (error) {
      console.error(`❌ 获取工单锁状态失败: ${workOrderId}`, error);
      return { locked: false, error: error.message };
    }
  }

  /**
   * 清理过期锁
   */
  async cleanExpiredLocks() {
    try {
      const pattern = `${this.lockPrefix}*`;
      const keys = await this.redis.keys(pattern);
      
      let cleaned = 0;
      for (const key of keys) {
        const ttl = await this.redis.pttl(key);
        if (ttl === -1) {
          // 没有过期时间的锁，清理掉
          await this.redis.del(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`🧹 清理了 ${cleaned} 个异常工单锁`);
      }
      
      return { success: true, cleaned };
      
    } catch (error) {
      console.error('❌ 清理工单锁失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 断开Redis连接
   */
  async disconnect() {
    await this.redis.disconnect();
  }
}

// 全局锁管理器实例
const lockManager = new WorkOrderLockManager();

/**
 * 队列服务类
 */
class QueueService {
  /**
   * 初始化队列
   */
  static async initialize() {
    try {
      console.log('📦 正在初始化工单更新队列...');
      
      // 创建队列实例
      workOrderQueue = new Queue(
        queueConfig.name,
        {
          redis: redisConfig,
          defaultJobOptions: queueConfig.defaultJobOptions,
          settings: queueConfig.settings
        }
      );

      // 等待队列就绪
      await workOrderQueue.isReady();
      console.log('✅ 队列 Redis 连接已就绪');

      // 设置任务处理器（使用命名处理器）
      workOrderQueue.process(
        queueConfig.processor.name,  // 使用配置中的处理器名称
        queueConfig.processor.concurrency,
        async (job) => {
          console.log(`📥 处理器接收到任务: ${job.id}, 名称: ${job.name}`);
          return await QueueService.processWorkOrderUpdate(job);
        }
      );
      console.log(`✅ 任务处理器已注册（处理器名称: ${queueConfig.processor.name}）`);

      // 设置事件监听器
      QueueService.setupEventListeners();
      console.log('✅ 事件监听器已设置');

      // 获取当前队列统计
      const [waiting, active, completed, failed] = await Promise.all([
        workOrderQueue.getWaitingCount(),
        workOrderQueue.getActiveCount(),
        workOrderQueue.getCompletedCount(),
        workOrderQueue.getFailedCount()
      ]);

      console.log('✅ 工单更新队列初始化成功');
      console.log(`   - 队列名称: ${queueConfig.name}`);
      console.log(`   - 处理器名称: ${queueConfig.processor.name}`);
      console.log(`   - 并发数: ${queueConfig.processor.concurrency}`);
      console.log(`   - Redis: ${redisConfig.host}:${redisConfig.port}/${redisConfig.db}`);
      console.log(`   - 队列统计: 等待=${waiting}, 活动=${active}, 完成=${completed}, 失败=${failed}`);
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ 初始化工单更新队列失败:', error);
      throw error;
    }
  }

  /**
   * 添加工单数量更新任务
   */
  static async addWorkOrderQuantityUpdate(workOrderId, type, quantity = 1, logContext = {}) {
    try {
      if (!workOrderQueue) {
        throw new Error('队列未初始化');
      }

      // 创建任务数据
      const jobData = {
        workOrderId,
        type, // 'input' | 'output'
        quantity,
        logContext,
        createdAt: new Date().toISOString()
      };

      // 添加任务到队列（使用命名任务类型）
      const job = await workOrderQueue.add(
        queueConfig.processor.name,  // 指定任务类型名称
        jobData,
        {
          // 同一工单的任务使用工单ID作为jobId前缀，便于追踪
          jobId: `${workOrderId}_${type}_${Date.now()}`,
          priority: QueueService.getTaskPriority(type),
          removeOnComplete: queueConfig.defaultJobOptions.removeOnComplete,
          removeOnFail: queueConfig.defaultJobOptions.removeOnFail,
          attempts: queueConfig.defaultJobOptions.attempts,
          backoff: queueConfig.defaultJobOptions.backoff,
          timeout: queueConfig.defaultJobOptions.timeout
        }
      );

      // 获取队列统计
      const waiting = await workOrderQueue.getWaitingCount();
      const active = await workOrderQueue.getActiveCount();
      const estimatedDelay = QueueService.calculateEstimatedDelay(waiting, active);

      console.log(`✅ 工单更新任务已加入队列:`, {
        jobId: job.id,
        workOrderId,
        type,
        quantity,
        queueLength: waiting,
        activeJobs: active,
        estimatedDelay: `${estimatedDelay}ms`
      });

      return {
        success: true,
        jobId: job.id,
        workOrderId,
        type,
        quantity,
        queueLength: waiting,
        activeJobs: active,
        estimatedDelay
      };

    } catch (error) {
      console.error('❌ 添加工单更新任务失败:', error);
      return {
        success: false,
        error: error.message,
        workOrderId,
        type,
        quantity
      };
    }
  }

  /**
   * 处理工单更新任务
   */
  static async processWorkOrderUpdate(job) {
    const { workOrderId, type, quantity, logContext } = job.data;
    const workerId = `job_${job.id}`;
    
    console.log(`🔄 开始处理工单更新任务:`, {
      jobId: job.id,
      workOrderId,
      type,
      quantity,
      attempt: job.attemptsMade + 1
    });

    let lockAcquired = false;

    try {
      // 获取工单锁
      const lockResult = await lockManager.acquireLock(workOrderId, workerId);
      
      if (!lockResult.success) {
        // 等待一小段时间后重试
        await new Promise(resolve => setTimeout(resolve, 100));
        throw new Error(`无法获取工单锁: ${lockResult.holder || lockResult.error}`);
      }
      
      lockAcquired = true;

      // 执行工单更新
      const WorkOrderService = require('./workOrderService');
      const result = await WorkOrderService.updateWorkOrderQuantity(
        workOrderId,
        type,
        quantity,
        logContext
      );

      if (!result || !result.success) {
        throw new Error(result?.error || '更新工单失败');
      }

      console.log(`✅ 工单更新任务完成:`, {
        jobId: job.id,
        workOrderId,
        type,
        quantity,
        beforeQuantity: result.beforeQuantity,
        afterQuantity: result.afterQuantity
      });

      return result;

    } catch (error) {
      console.error(`❌ 处理工单更新任务失败:`, {
        jobId: job.id,
        workOrderId,
        type,
        quantity,
        error: error.message,
        attempt: job.attemptsMade + 1
      });
      
      throw error;
      
    } finally {
      // 确保释放锁
      if (lockAcquired) {
        await lockManager.releaseLock(workOrderId, workerId);
      }
    }
  }

  /**
   * 获取任务优先级
   */
  static getTaskPriority(type) {
    // output(产出)优先级高于input(投入)
    return type === 'output' ? 1 : 2;
  }

  /**
   * 计算预估延迟时间
   */
  static calculateEstimatedDelay(waiting, active) {
    // 假设每个任务平均处理时间为500ms
    const avgProcessTime = 500;
    const totalPendingJobs = waiting + active;
    return totalPendingJobs * avgProcessTime;
  }

  /**
   * 设置事件监听器
   */
  static setupEventListeners() {
    // 任务完成事件
    workOrderQueue.on('completed', (job, result) => {
      console.log(`✅ 任务完成: ${job.id}`, {
        workOrderId: result.workOrderId,
        type: result.type,
        duration: `${Date.now() - new Date(job.data.createdAt).getTime()}ms`
      });
    });

    // 任务失败事件
    workOrderQueue.on('failed', (job, err) => {
      console.error(`❌ 任务失败: ${job.id}`, {
        workOrderId: job.data.workOrderId,
        type: job.data.type,
        error: err.message,
        attempts: job.attemptsMade
      });
    });

    // 任务停滞事件
    workOrderQueue.on('stalled', (job) => {
      console.warn(`⚠️ 任务停滞: ${job.id}`, {
        workOrderId: job.data.workOrderId,
        type: job.data.type
      });
    });

    // 队列错误事件 - 增强错误处理
    workOrderQueue.on('error', (error) => {
      console.error('❌ 队列错误:', {
        message: error.message,
        code: error.code,
        command: error.command,
        timestamp: new Date().toISOString()
      });
      
      // 如果是 Redis 超时错误，记录更多信息
      if (error.message && error.message.includes('timeout')) {
        console.error('⚠️ Redis 命令超时，建议检查：');
        console.error('   1. Redis 服务器是否正常运行');
        console.error('   2. 网络连接是否稳定');
        console.error('   3. Redis 服务器负载是否过高');
        console.error('   4. commandTimeout 配置是否合适');
      }
    });
  }

  /**
   * 获取队列统计信息
   */
  static async getQueueStats() {
    try {
      if (!workOrderQueue) {
        return { error: '队列未初始化' };
      }

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        workOrderQueue.getWaitingCount(),
        workOrderQueue.getActiveCount(),
        workOrderQueue.getCompletedCount(),
        workOrderQueue.getFailedCount(),
        workOrderQueue.getDelayedCount()
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + delayed
      };

    } catch (error) {
      console.error('❌ 获取队列统计失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 清理队列
   */
  static async cleanQueue(options = {}) {
    try {
      if (!workOrderQueue) {
        return { success: false, error: '队列未初始化' };
      }

      const { grace = 5000 } = options;

      await workOrderQueue.clean(grace, 'completed');
      await workOrderQueue.clean(grace, 'failed');

      console.log('🧹 队列清理完成');
      return { success: true };

    } catch (error) {
      console.error('❌ 清理队列失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 暂停队列
   */
  static async pauseQueue() {
    try {
      if (!workOrderQueue) {
        return { success: false, error: '队列未初始化' };
      }

      await workOrderQueue.pause();
      console.log('⏸️ 队列已暂停');
      return { success: true };

    } catch (error) {
      console.error('❌ 暂停队列失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 恢复队列
   */
  static async resumeQueue() {
    try {
      if (!workOrderQueue) {
        return { success: false, error: '队列未初始化' };
      }

      await workOrderQueue.resume();
      console.log('▶️ 队列已恢复');
      return { success: true };

    } catch (error) {
      console.error('❌ 恢复队列失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 关闭队列服务
   */
  static async shutdown() {
    try {
      console.log('🛑 正在关闭队列服务...');

      if (workOrderQueue) {
        await workOrderQueue.close();
        console.log('✅ 队列已关闭');
      }

      await lockManager.disconnect();
      console.log('✅ 锁管理器已关闭');

      return { success: true };

    } catch (error) {
      console.error('❌ 关闭队列服务失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取锁统计信息
   */
  static async getLockStats() {
    try {
      const pattern = `${lockManager.lockPrefix}*`;
      const keys = await lockManager.redis.keys(pattern);
      
      const locks = [];
      for (const key of keys) {
        const value = await lockManager.redis.get(key);
        const ttl = await lockManager.redis.pttl(key);
        
        if (value) {
          const [workerId, timestamp] = value.split(':');
          const workOrderId = key.replace(lockManager.lockPrefix, '');
          
          locks.push({
            workOrderId,
            workerId,
            timestamp: parseInt(timestamp),
            ttl: ttl > 0 ? ttl : 0,
            age: Date.now() - parseInt(timestamp)
          });
        }
      }

      return {
        total: locks.length,
        locks: locks.sort((a, b) => b.age - a.age)
      };

    } catch (error) {
      console.error('❌ 获取锁统计失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 清理所有锁
   */
  static async cleanAllLocks() {
    return await lockManager.cleanExpiredLocks();
  }
}

module.exports = {
  QueueService,
  lockManager
};

