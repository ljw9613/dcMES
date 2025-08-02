/**
 * 队列监控API接口
 * 提供队列状态查询、管理等功能
 */

const express = require('express');
const router = express.Router();
const { QueueService, testRedisConnection } = require('../services/queueService');

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
 * 获取队列健康检查
 * GET /api/queue/health
 */
router.get('/api/queue/health', async (req, res) => {
  try {
    const stats = await QueueService.getQueueStats();
    
    // 健康检查逻辑
    const isHealthy = stats.health === 'OK';
    const hasWorkOrderBacklog = stats.workOrderQueue?.waiting > 50; // 工单队列超过50个等待任务算积压
    const hasPalletBacklog = stats.palletQueue?.waiting > 20; // 托盘队列超过20个等待任务算积压
    const hasStuckWorkOrderJobs = stats.workOrderQueue?.active > 5; // 超过5个活跃工单任务可能有问题
    const hasStuckPalletJobs = stats.palletQueue?.active > 3; // 超过3个活跃托盘任务可能有问题
    
    let healthStatus = 'HEALTHY';
    const warnings = [];
    
    if (!isHealthy) {
      healthStatus = 'UNHEALTHY';
      warnings.push('队列服务异常');
    }
    
    if (hasWorkOrderBacklog) {
      healthStatus = healthStatus === 'HEALTHY' ? 'WARNING' : healthStatus;
      warnings.push(`工单队列积压严重: ${stats.workOrderQueue.waiting}个等待任务`);
    }
    
    if (hasPalletBacklog) {
      healthStatus = healthStatus === 'HEALTHY' ? 'WARNING' : healthStatus;
      warnings.push(`托盘队列积压严重: ${stats.palletQueue.waiting}个等待任务`);
    }
    
    if (hasStuckWorkOrderJobs) {
      healthStatus = healthStatus === 'HEALTHY' ? 'WARNING' : healthStatus;
      warnings.push(`可能存在卡住的工单任务: ${stats.workOrderQueue.active}个活跃任务`);
    }
    
    if (hasStuckPalletJobs) {
      healthStatus = healthStatus === 'HEALTHY' ? 'WARNING' : healthStatus;
      warnings.push(`可能存在卡住的托盘任务: ${stats.palletQueue.active}个活跃任务`);
    }

    res.json({
      success: true,
      health: healthStatus,
      stats,
      warnings,
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