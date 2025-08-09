/**
 * 队列监控API接口
 * 提供队列状态查询、管理等功能
 */

const express = require('express');
const router = express.Router();
const { QueueService, testRedisConnection, palletLockManager, workOrderLockManager } = require('../services/queueService');

/**
 * 获取队列状态
 * GET /api/queue/status
 */
router.get('/api/queue/status', async (req, res) => {
  try {
    const stats = await QueueService.getQueueStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取队列状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 清理队列
 * POST /api/queue/clean
 */
router.post('/api/queue/clean', async (req, res) => {
  try {
    const options = req.body || {};
    const result = await QueueService.cleanQueue(options);
    res.json({
      success: result.success,
      message: result.message,
      error: result.error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('清理队列失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 暂停队列
 * POST /api/queue/pause
 */
router.post('/api/queue/pause', async (req, res) => {
  try {
    const result = await QueueService.pauseQueue();
    res.json({
      success: result.success,
      message: result.message,
      error: result.error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('暂停队列失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 恢复队列
 * POST /api/queue/resume
 */
router.post('/api/queue/resume', async (req, res) => {
  try {
    const result = await QueueService.resumeQueue();
    res.json({
      success: result.success,
      message: result.message,
      error: result.error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('恢复队列失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 检查Redis连接状态
 * GET /api/queue/redis-status
 */
router.get('/api/queue/redis-status', async (req, res) => {
  try {
    console.log('🔍 开始检查Redis连接状态...');
    const isConnected = await testRedisConnection();
    
    res.json({
      success: true,
      connected: isConnected,
      message: isConnected ? 'Redis连接正常' : 'Redis连接失败',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Redis连接状态检查失败:', error);
    res.status(500).json({
      success: false,
      connected: false,
      error: error.message,
      message: 'Redis连接状态检查异常',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取托盘锁状态
 * GET /api/queue/pallet-locks
 */
router.get('/api/queue/pallet-locks', async (req, res) => {
  try {
    console.log('🔍 获取托盘锁状态...');
    const lockStats = await QueueService.getPalletLockStats();
    
    res.json({
      success: true,
      data: lockStats,
      message: `当前托盘锁数量: ${lockStats.totalLocks}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取托盘锁状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 清理托盘锁
 * POST /api/queue/clean-pallet-locks
 */
router.post('/api/queue/clean-pallet-locks', async (req, res) => {
  try {
    console.log('🧹 手动清理托盘锁...');
    const result = await QueueService.cleanPalletLocks();
    
    res.json({
      success: result.success,
      message: result.message,
      data: {
        cleanedCount: result.cleanedCount,
        errorCount: result.errorCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('清理托盘锁失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取工单锁状态
 * GET /api/queue/workorder-locks
 */
router.get('/api/queue/workorder-locks', async (req, res) => {
  try {
    console.log('🔍 获取工单锁状态...');
    const lockStats = await QueueService.getWorkOrderLockStats();
    
    res.json({
      success: true,
      data: lockStats,
      message: `当前工单锁数量: ${lockStats.totalLocks}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取工单锁状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 清理工单锁
 * POST /api/queue/clean-workorder-locks
 */
router.post('/api/queue/clean-workorder-locks', async (req, res) => {
  try {
    console.log('🧹 手动清理工单锁...');
    const result = await QueueService.cleanWorkOrderLocks();
    
    res.json({
      success: result.success,
      message: result.message,
      data: {
        cleanedCount: result.cleanedCount,
        errorCount: result.errorCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('清理工单锁失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 清理所有锁资源
 * POST /api/queue/clean-all-locks
 */
router.post('/api/queue/clean-all-locks', async (req, res) => {
  try {
    console.log('🧹 手动清理所有锁资源...');
    const result = await QueueService.cleanAllLocks();
    
    res.json({
      success: result.success,
      message: result.message,
      data: {
        totalCleaned: result.totalCleaned,
        totalErrors: result.totalErrors,
        palletLocks: result.palletLocks,
        workOrderLocks: result.workOrderLocks
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('清理所有锁失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取队列并发性能指标
 * GET /api/queue/concurrency-metrics
 */
router.get('/api/queue/concurrency-metrics', async (req, res) => {
  try {
    const stats = await QueueService.getQueueStats();
    const palletLockStats = await QueueService.getPalletLockStats();
    const workOrderLockStats = await QueueService.getWorkOrderLockStats();
    
    // 计算托盘队列并发效率指标
    const palletActiveJobs = stats.palletQueue?.active || 0;
    const palletWaitingJobs = stats.palletQueue?.waiting || 0;
    const palletTotalLocks = palletLockStats.totalLocks || 0;
    
    // 计算工单队列并发效率指标
    const workOrderActiveJobs = stats.workOrderQueue?.active || 0;
    const workOrderWaitingJobs = stats.workOrderQueue?.waiting || 0;
    const workOrderTotalLocks = workOrderLockStats.totalLocks || 0;
    
    // 托盘队列并发利用率 = 活跃任务数 / 最大并发数(10)
    const palletConcurrencyUtilization = (palletActiveJobs / 10 * 100).toFixed(2);
    
    // 工单队列并发利用率 = 活跃任务数 / 最大并发数(5)
    const workOrderConcurrencyUtilization = (workOrderActiveJobs / 5 * 100).toFixed(2);
    
    // 托盘锁争用率 = 等待任务数 / (活跃任务数 + 等待任务数)
    const palletLockContentionRate = palletActiveJobs + palletWaitingJobs > 0 ? 
      (palletWaitingJobs / (palletActiveJobs + palletWaitingJobs) * 100).toFixed(2) : 0;
    
    // 工单锁争用率
    const workOrderLockContentionRate = workOrderActiveJobs + workOrderWaitingJobs > 0 ? 
      (workOrderWaitingJobs / (workOrderActiveJobs + workOrderWaitingJobs) * 100).toFixed(2) : 0;
    
    // 预估并发提升效果
    const oldPalletConcurrency = 2; // 原来的托盘并发数
    const newPalletConcurrency = 10; // 现在的托盘并发数
    const oldWorkOrderConcurrency = 1; // 原来的工单并发数
    const newWorkOrderConcurrency = 5; // 现在的工单并发数
    
    const palletSpeedupRatio = (newPalletConcurrency / oldPalletConcurrency).toFixed(1);
    const workOrderSpeedupRatio = (newWorkOrderConcurrency / oldWorkOrderConcurrency).toFixed(1);
    
    res.json({
      success: true,
      metrics: {
        palletQueue: {
          maxWorkers: 10,
          activeWorkers: palletActiveJobs,
          utilizationRate: parseFloat(palletConcurrencyUtilization),
          theoreticalSpeedup: `${palletSpeedupRatio}x`,
          improvement: `相比原来2个并发，理论上可提升${((newPalletConcurrency/oldPalletConcurrency - 1) * 100).toFixed(0)}%的处理速度`,
          lockStats: {
            totalActiveLocks: palletTotalLocks,
            lockContentionRate: parseFloat(palletLockContentionRate),
            lockContentionStatus: palletLockContentionRate > 30 ? 'HIGH' : palletLockContentionRate > 10 ? 'MEDIUM' : 'LOW'
          }
        },
        workOrderQueue: {
          maxWorkers: 5,
          activeWorkers: workOrderActiveJobs,
          utilizationRate: parseFloat(workOrderConcurrencyUtilization),
          theoreticalSpeedup: `${workOrderSpeedupRatio}x`,
          improvement: `相比原来1个并发，理论上可提升${((newWorkOrderConcurrency/oldWorkOrderConcurrency - 1) * 100).toFixed(0)}%的处理速度`,
          lockStats: {
            totalActiveLocks: workOrderTotalLocks,
            lockContentionRate: parseFloat(workOrderLockContentionRate),
            lockContentionStatus: workOrderLockContentionRate > 30 ? 'HIGH' : workOrderLockContentionRate > 10 ? 'MEDIUM' : 'LOW'
          }
        },
        overall: {
          totalConcurrentCapacity: 15, // 托盘10 + 工单5
          totalActiveWorkers: palletActiveJobs + workOrderActiveJobs,
          overallUtilization: ((palletActiveJobs + workOrderActiveJobs) / 15 * 100).toFixed(2) + '%',
          combinedImprovement: '大幅提升整体处理能力，减少用户等待时间'
        },
        performance: {
          palletEstimatedTime: palletWaitingJobs > 0 ? 
            `${Math.ceil(palletWaitingJobs / 10 * 3)}秒` : '立即处理',
          workOrderEstimatedTime: workOrderWaitingJobs > 0 ? 
            `${Math.ceil(workOrderWaitingJobs / 5 * 0.2)}秒` : '立即处理',
          oldPalletTime: palletWaitingJobs > 0 ? 
            `${Math.ceil(palletWaitingJobs / 2 * 3)}秒` : '立即处理',
          oldWorkOrderTime: workOrderWaitingJobs > 0 ? 
            `${Math.ceil(workOrderWaitingJobs / 1 * 0.2)}秒` : '立即处理'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取并发性能指标失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取托盘任务处理详情
 * GET /api/queue/pallet-task-details
 */
router.get('/api/queue/pallet-task-details', async (req, res) => {
  try {
    const stats = await QueueService.getQueueStats();
    const lockStats = await QueueService.getPalletLockStats();
    
    // 分析托盘任务分布
    const palletQueue = stats.palletQueue || {};
    const locks = lockStats.locks || [];
    
    // 统计不同状态的托盘
    const lockedPallets = locks.filter(lock => lock.locked);
    const processingPallets = lockedPallets.length;
    const waitingTasks = palletQueue.waiting || 0;
    const activeTasks = palletQueue.active || 0;
    
    // 计算平均等待时间（基于新的并发模式）
    const avgWaitTime = waitingTasks > 0 ? Math.ceil(waitingTasks / 10 * 3) : 0;
    const oldAvgWaitTime = waitingTasks > 0 ? Math.ceil(waitingTasks / 2 * 3) : 0;
    const timeImprovement = oldAvgWaitTime > 0 ? 
      `减少${oldAvgWaitTime - avgWaitTime}秒（${((oldAvgWaitTime - avgWaitTime) / oldAvgWaitTime * 100).toFixed(0)}%提升）` : 
      '无等待时间';
    
    res.json({
      success: true,
      data: {
        summary: {
          totalActivePallets: processingPallets,
          totalWaitingTasks: waitingTasks,
          totalActiveTasks: activeTasks,
          concurrentCapacity: 10,
          capacityUsage: `${activeTasks}/10`,
          capacityUtilization: `${(activeTasks / 10 * 100).toFixed(1)}%`
        },
        performance: {
          currentAvgWaitTime: `${avgWaitTime}秒`,
          previousAvgWaitTime: `${oldAvgWaitTime}秒`,
          improvement: timeImprovement,
          processingCapacity: '支持10个不同托盘并发处理',
          serialityGuarantee: '同一托盘任务仍保持串行执行'
        },
        activePallets: lockedPallets.map(lock => ({
          palletKey: lock.palletKey,
          owner: lock.owner,
          remainingLockTime: `${Math.ceil(lock.remainingTime / 1000)}秒`,
          status: 'PROCESSING'
        })),
        queueStatus: palletQueue
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取托盘任务详情失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取队列健康检查
 * GET /api/queue/health
 */
router.get('/api/queue/health', async (req, res) => {
  try {
    const stats = await QueueService.getQueueStats();
    const palletLockStats = await QueueService.getPalletLockStats();
    const workOrderLockStats = await QueueService.getWorkOrderLockStats();
    
    // 健康检查逻辑（更新并发相关的检查）
    const isHealthy = stats.health === 'OK';
    
    // 工单队列健康检查（新增）
    const hasWorkOrderBacklog = stats.workOrderQueue?.waiting > 100; // 工单队列阈值提高到100（因为并发能力增强）
    const hasStuckWorkOrderJobs = stats.workOrderQueue?.active > 4; // 工单并发能力提升，阈值调整到4
    const hasTooManyWorkOrderLocks = workOrderLockStats.totalLocks > 10; // 工单锁过多可能存在问题
    
    // 托盘队列健康检查（更新）
    const hasPalletBacklog = stats.palletQueue?.waiting > 100; // 托盘队列阈值提高到100（因为并发能力增强）
    const hasStuckPalletJobs = stats.palletQueue?.active > 8; // 托盘并发能力提升，阈值调整到8
    const hasTooManyPalletLocks = palletLockStats.totalLocks > 15; // 托盘锁过多可能存在问题
    
    let healthStatus = 'HEALTHY';
    const warnings = [];
    
    if (!isHealthy) {
      healthStatus = 'UNHEALTHY';
      warnings.push('队列服务异常');
    }
    
    // 工单队列相关警告
    if (hasWorkOrderBacklog) {
      healthStatus = healthStatus === 'HEALTHY' ? 'WARNING' : healthStatus;
      warnings.push(`工单队列积压严重: ${stats.workOrderQueue.waiting}个等待任务（已优化并发处理）`);
    }
    
    if (hasStuckWorkOrderJobs) {
      healthStatus = healthStatus === 'HEALTHY' ? 'WARNING' : healthStatus;
      warnings.push(`可能存在卡住的工单任务: ${stats.workOrderQueue.active}个活跃任务（并发模式）`);
    }

    if (hasTooManyWorkOrderLocks) {
      healthStatus = healthStatus === 'HEALTHY' ? 'WARNING' : healthStatus;
      warnings.push(`工单锁数量过多: ${workOrderLockStats.totalLocks}个活跃锁，可能存在锁泄漏`);
    }
    
    // 托盘队列相关警告
    if (hasPalletBacklog) {
      healthStatus = healthStatus === 'HEALTHY' ? 'WARNING' : healthStatus;
      warnings.push(`托盘队列积压严重: ${stats.palletQueue.waiting}个等待任务（已优化并发处理）`);
    }
    
    if (hasStuckPalletJobs) {
      healthStatus = healthStatus === 'HEALTHY' ? 'WARNING' : healthStatus;
      warnings.push(`可能存在卡住的托盘任务: ${stats.palletQueue.active}个活跃任务（并发模式）`);
    }

    if (hasTooManyPalletLocks) {
      healthStatus = healthStatus === 'HEALTHY' ? 'WARNING' : healthStatus;
      warnings.push(`托盘锁数量过多: ${palletLockStats.totalLocks}个活跃锁，可能存在锁泄漏`);
    }

    res.json({
      success: true,
      health: healthStatus,
      stats,
      lockStats: {
        palletLocks: palletLockStats,
        workOrderLocks: workOrderLockStats,
        totalLocks: palletLockStats.totalLocks + workOrderLockStats.totalLocks
      },
      warnings,
      concurrencyInfo: {
        palletConcurrency: 10,
        workOrderConcurrency: 5,
        totalConcurrency: 15,
        palletActiveWorkers: stats.palletQueue?.active || 0,
        workOrderActiveWorkers: stats.workOrderQueue?.active || 0,
        overallEfficiency: `${(((stats.palletQueue?.active || 0) + (stats.workOrderQueue?.active || 0)) / 15 * 100).toFixed(1)}%`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('队列健康检查失败:', error);
    res.status(500).json({
      success: false,
      health: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取队列性能指标
 * GET /api/queue/metrics
 */
router.get('/api/queue/metrics', async (req, res) => {
  try {
    const stats = await QueueService.getQueueStats();
    
    // 计算工单队列指标
    const workOrderTotal = stats.workOrderQueue?.total || 0;
    const workOrderCompletionRate = workOrderTotal > 0 ? 
      ((stats.workOrderQueue.completed / workOrderTotal) * 100).toFixed(2) : 0;
    const workOrderFailureRate = workOrderTotal > 0 ? 
      ((stats.workOrderQueue.failed / workOrderTotal) * 100).toFixed(2) : 0;
    
    // 计算托盘队列指标
    const palletTotal = stats.palletQueue?.total || 0;
    const palletCompletionRate = palletTotal > 0 ? 
      ((stats.palletQueue.completed / palletTotal) * 100).toFixed(2) : 0;
    const palletFailureRate = palletTotal > 0 ? 
      ((stats.palletQueue.failed / palletTotal) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      metrics: {
        workOrderQueue: {
          totalJobs: workOrderTotal,
          completionRate: parseFloat(workOrderCompletionRate),
          failureRate: parseFloat(workOrderFailureRate),
          utilization: stats.workOrderQueue?.active > 0 ? 'HIGH' : 
                      stats.workOrderQueue?.waiting > 0 ? 'MEDIUM' : 'LOW',
          ...stats.workOrderQueue
        },
        palletQueue: {
          totalJobs: palletTotal,
          completionRate: parseFloat(palletCompletionRate),
          failureRate: parseFloat(palletFailureRate),
          utilization: stats.palletQueue?.active > 0 ? 'HIGH' : 
                      stats.palletQueue?.waiting > 0 ? 'MEDIUM' : 'LOW',
          ...stats.palletQueue
        },
        overall: {
          health: stats.health
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取队列指标失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 手动触发工单数量更新（用于测试）
 * POST /api/queue/test/update-work-order
 */
router.post('/api/queue/test/update-work-order', async (req, res) => {
  try {
    const { workOrderId, type = 'output', quantity = 1, logContext = {} } = req.body;
    
    if (!workOrderId) {
      return res.status(400).json({
        success: false,
        error: '缺少工单ID',
        timestamp: new Date().toISOString()
      });
    }

    const result = await QueueService.addWorkOrderQuantityUpdate(
      workOrderId,
      type,
      quantity,
      {
        ...logContext,
        source: 'API_TEST',
        operatorId: 'TEST_USER',
        reason: '手动测试触发'
      }
    );

    res.json({
      success: result.success,
      jobId: result.jobId,
      message: result.message,
      error: result.error,
      estimatedDelay: result.estimatedDelay,
      queueLength: result.queueLength,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('手动触发工单更新失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 手动触发托盘处理任务（用于测试）
 * POST /api/queue/test/handle-pallet-barcode
 */
router.post('/api/queue/test/handle-pallet-barcode', async (req, res) => {
  try {
    const { 
      lineId, 
      lineName = 'Test Line', 
      mainBarcode, 
      materialId = 'TEST_MATERIAL',
      materialCode = 'TEST_CODE',
      materialName = 'Test Material',
      processStepId = 'TEST_STEP',
      userId = 'TEST_USER',
      totalQuantity = 100,
      fromRepairStation = false 
    } = req.body;
    
    if (!lineId || !mainBarcode) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数：产线ID和条码',
        timestamp: new Date().toISOString()
      });
    }

    const result = await QueueService.addPalletProcessingTask({
      lineId,
      lineName,
      processStepId,
      materialId,
      materialCode,
      materialName,
      materialSpec: '测试规格',
      mainBarcode,
      boxBarcode: req.body.boxBarcode || null,
      totalQuantity,
      userId,
      componentScans: req.body.componentScans || [],
      fromRepairStation
    });

    res.json({
      success: result.success,
      jobId: result.jobId,
      message: result.message,
      error: result.error,
      estimatedDelay: result.estimatedDelay,
      queueLength: result.queueLength,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('手动触发托盘处理失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 