/**
 * 工单管理路由
 * 提供工单数量更新的API接口
 */

const express = require('express');
const router = express.Router();
const { QueueService } = require('../services/queueService');
const WorkOrderService = require('../services/workOrderService');

/**
 * @api {post} /api/workorder/update-quantity 更新工单数量
 * @apiName UpdateWorkOrderQuantity
 * @apiGroup WorkOrder
 * @apiDescription 更新工单的投入量或产出量
 *
 * @apiParam {String} workOrderId 工单ID
 * @apiParam {String="input","output"} type 更新类型：input-投入量，output-产出量
 * @apiParam {Number} quantity 更新数量（正数为增加，负数为减少）
 * @apiParam {Object} [logContext] 日志上下文信息
 * @apiParam {String} [logContext.relatedBarcode] 相关条码
 * @apiParam {String} [logContext.barcodeOperation] 条码操作类型
 * @apiParam {String} [logContext.processStepId] 工序步骤ID
 * @apiParam {String} [logContext.processName] 工序名称
 * @apiParam {String} [logContext.processCode] 工序编码
 * @apiParam {String} [logContext.operatorId] 操作人员ID
 * @apiParam {String} [logContext.operatorName] 操作人员姓名
 * @apiParam {String} [logContext.reason] 变更原因
 * @apiParam {String} [logContext.remark] 备注信息
 * @apiParam {String} [logContext.ipAddress] 操作IP地址
 * @apiParam {String} [logContext.userAgent] 用户代理信息
 * @apiParam {Boolean} [logContext.isAutomatic] 是否为自动操作
 * @apiParam {String} [logContext.source] 数据来源
 *
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {String} jobId 队列任务ID
 * @apiSuccess {String} workOrderId 工单ID
 * @apiSuccess {String} type 更新类型
 * @apiSuccess {Number} quantity 更新数量
 * @apiSuccess {Number} queueLength 队列长度
 * @apiSuccess {Number} estimatedDelay 预估延迟（毫秒）
 */
router.post('/api/workorder/update-quantity', async (req, res) => {
  try {
    const { workOrderId, type, quantity = 1, logContext = {} } = req.body;

    // 参数验证
    if (!workOrderId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：workOrderId',
        code: 'MISSING_WORK_ORDER_ID'
      });
    }

    if (!type || !['input', 'output'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '参数错误：type必须为input或output',
        code: 'INVALID_TYPE'
      });
    }

    if (typeof quantity !== 'number' || isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        message: '参数错误：quantity必须为数字',
        code: 'INVALID_QUANTITY'
      });
    }

    // 添加到队列
    const result = await QueueService.addWorkOrderQuantityUpdate(
      workOrderId,
      type,
      quantity,
      logContext
    );

    if (result.success) {
      return res.json({
        success: true,
        message: '工单更新任务已加入队列',
        data: result,
        code: 'QUEUED'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: '添加任务到队列失败',
        error: result.error,
        code: 'QUEUE_ERROR'
      });
    }

  } catch (error) {
    console.error('❌ 更新工单数量接口异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message,
      code: 'SYSTEM_ERROR'
    });
  }
});

/**
 * @api {post} /api/workorder/batch-update-quantity 批量更新工单数量
 * @apiName BatchUpdateWorkOrderQuantity
 * @apiGroup WorkOrder
 * @apiDescription 批量更新多个工单的投入量或产出量
 *
 * @apiParam {Array} updates 更新数组
 * @apiParam {String} updates.workOrderId 工单ID
 * @apiParam {String="input","output"} updates.type 更新类型
 * @apiParam {Number} updates.quantity 更新数量
 * @apiParam {Object} [updates.logContext] 日志上下文信息
 *
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Array} results 结果数组
 */
router.post('/api/workorder/batch-update-quantity', async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '参数错误：updates必须为非空数组',
        code: 'INVALID_UPDATES'
      });
    }

    const results = [];

    // 批量添加到队列
    for (const update of updates) {
      const { workOrderId, type, quantity = 1, logContext = {} } = update;

      if (!workOrderId || !type) {
        results.push({
          success: false,
          workOrderId,
          error: '缺少必要参数',
          code: 'MISSING_PARAMS'
        });
        continue;
      }

      const result = await QueueService.addWorkOrderQuantityUpdate(
        workOrderId,
        type,
        quantity,
        logContext
      );

      results.push(result);
    }

    return res.json({
      success: true,
      message: `已添加${results.filter(r => r.success).length}/${updates.length}个任务到队列`,
      data: {
        total: updates.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });

  } catch (error) {
    console.error('❌ 批量更新工单数量接口异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message,
      code: 'SYSTEM_ERROR'
    });
  }
});

/**
 * @api {get} /api/workorder/detail/:id 获取工单详情
 * @apiName GetWorkOrderDetail
 * @apiGroup WorkOrder
 *
 * @apiParam {String} id 工单ID
 *
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} workOrder 工单详情
 */
router.get('/api/workorder/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await WorkOrderService.getWorkOrderDetail(id);

    if (result.success) {
      return res.json({
        success: true,
        data: result.workOrder
      });
    } else {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('❌ 获取工单详情接口异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * @api {get} /api/workorder/quantity-logs/:id 查询工单数量变更日志
 * @apiName GetWorkOrderQuantityLogs
 * @apiGroup WorkOrder
 *
 * @apiParam {String} id 工单ID
 * @apiParam {Number} [page=1] 页码
 * @apiParam {Number} [pageSize=20] 每页数量
 * @apiParam {String="input","output"} [changeType] 变更类型
 * @apiParam {String} [startDate] 开始日期
 * @apiParam {String} [endDate] 结束日期
 *
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Number} total 总数
 * @apiSuccess {Array} logs 日志列表
 */
router.get('/api/workorder/quantity-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { page, pageSize, changeType, startDate, endDate } = req.query;

    const result = await WorkOrderService.getWorkOrderQuantityLogs(id, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      changeType,
      startDate,
      endDate
    });

    if (result.success) {
      return res.json({
        success: true,
        data: result
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('❌ 查询工单数量变更日志接口异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * @api {get} /api/workorder/queue/stats 获取队列统计信息
 * @apiName GetQueueStats
 * @apiGroup WorkOrder
 *
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} stats 统计信息
 */
router.get('/api/workorder/queue/stats', async (req, res) => {
  try {
    const stats = await QueueService.getQueueStats();

    return res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ 获取队列统计接口异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * @api {get} /api/workorder/queue/locks 获取锁统计信息
 * @apiName GetLockStats
 * @apiGroup WorkOrder
 *
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} stats 锁统计信息
 */
router.get('/api/workorder/queue/locks', async (req, res) => {
  try {
    const stats = await QueueService.getLockStats();

    return res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ 获取锁统计接口异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * @api {post} /api/workorder/queue/clean 清理队列
 * @apiName CleanQueue
 * @apiGroup WorkOrder
 *
 * @apiParam {Number} [grace=5000] 清理时间范围（毫秒）
 *
 * @apiSuccess {Boolean} success 是否成功
 */
router.post('/api/workorder/queue/clean', async (req, res) => {
  try {
    const { grace = 5000 } = req.body;

    const result = await QueueService.cleanQueue({ grace });

    return res.json(result);

  } catch (error) {
    console.error('❌ 清理队列接口异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * @api {post} /api/workorder/queue/pause 暂停队列
 * @apiName PauseQueue
 * @apiGroup WorkOrder
 *
 * @apiSuccess {Boolean} success 是否成功
 */
router.post('/api/workorder/queue/pause', async (req, res) => {
  try {
    const result = await QueueService.pauseQueue();
    return res.json(result);
  } catch (error) {
    console.error('❌ 暂停队列接口异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * @api {post} /api/workorder/queue/resume 恢复队列
 * @apiName ResumeQueue
 * @apiGroup WorkOrder
 *
 * @apiSuccess {Boolean} success 是否成功
 */
router.post('/api/workorder/queue/resume', async (req, res) => {
  try {
    const result = await QueueService.resumeQueue();
    return res.json(result);
  } catch (error) {
    console.error('❌ 恢复队列接口异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * @api {post} /api/workorder/queue/clean-locks 清理所有锁
 * @apiName CleanAllLocks
 * @apiGroup WorkOrder
 *
 * @apiSuccess {Boolean} success 是否成功
 */
router.post('/api/workorder/queue/clean-locks', async (req, res) => {
  try {
    const result = await QueueService.cleanAllLocks();
    return res.json(result);
  } catch (error) {
    console.error('❌ 清理锁接口异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * @api {get} /health 健康检查
 * @apiName HealthCheck
 * @apiGroup System
 *
 * @apiSuccess {String} status 状态
 * @apiSuccess {String} message 消息
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'dcMes工单处理服务运行正常',
    timestamp: new Date().toISOString(),
    service: 'dcMes-plan-server',
    version: '1.0.0'
  });
});

module.exports = router;

