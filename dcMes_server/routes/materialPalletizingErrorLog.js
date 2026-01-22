const express = require("express");
const router = express.Router();
const MaterialPalletizingErrorLog = require("../model/project/materialPalletizingErrorLog");
const MaterialPalletizingService = require("../services/materialPalletizing");

/**
 * @api {get} /api/material-palletizing-error-log 查询托盘错误日志
 * @apiGroup 托盘错误日志
 * @apiParam {String} [errorType] 错误类型
 * @apiParam {String} [operation] 操作类型
 * @apiParam {String} [barcode] 产品条码
 * @apiParam {String} [palletCode] 托盘编号
 * @apiParam {String} [productLineId] 产线ID
 * @apiParam {String} [resolved] 是否已解决 (true/false)
 * @apiParam {String} [impactLevel] 影响级别
 * @apiParam {String} [startDate] 开始日期 (YYYY-MM-DD)
 * @apiParam {String} [endDate] 结束日期 (YYYY-MM-DD)
 * @apiParam {Number} [page=1] 页码
 * @apiParam {Number} [limit=20] 每页数量
 */
router.get("/", async (req, res) => {
  try {
    const {
      errorType,
      operation,
      barcode,
      palletCode,
      productLineId,
      resolved,
      impactLevel,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (errorType) query.errorType = errorType;
    if (operation) query.operation = operation;
    if (barcode) query.barcode = new RegExp(barcode, 'i');
    if (palletCode) query.palletCode = new RegExp(palletCode, 'i');
    if (productLineId) query.productLineId = productLineId;
    if (resolved !== undefined) query.resolved = resolved === 'true';
    if (impactLevel) query.impactLevel = impactLevel;

    // 时间范围查询
    if (startDate || endDate) {
      query.createAt = {};
      if (startDate) query.createAt.$gte = new Date(startDate);
      if (endDate) query.createAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // 分页参数
    const skip = (page - 1) * limit;
    const pageLimit = Math.min(parseInt(limit), 100); // 最大限制100条

    // 查询数据
    const [logs, total] = await Promise.all([
      MaterialPalletizingErrorLog.find(query)
        .populate('palletId', 'palletCode status')
        .populate('productLineId', 'lineName')
        .populate('processStepId', 'processName processCode')
        .populate('materialId', 'FName FNumber')
        .populate('createBy', 'username realName')
        .populate('resolvedBy', 'username realName')
        .sort({ createAt: -1 })
        .skip(skip)
        .limit(pageLimit),
      MaterialPalletizingErrorLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: pageLimit,
          total,
          pages: Math.ceil(total / pageLimit)
        }
      }
    });
  } catch (error) {
    console.error("查询托盘错误日志失败:", error);
    res.status(500).json({
      success: false,
      message: "查询托盘错误日志失败",
      error: error.message
    });
  }
});

/**
 * @api {get} /api/material-palletizing-error-log/statistics 错误日志统计
 * @apiGroup 托盘错误日志
 */
router.get("/statistics", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 构建时间查询条件
    const timeQuery = {};
    if (startDate || endDate) {
      timeQuery.createAt = {};
      if (startDate) timeQuery.createAt.$gte = new Date(startDate);
      if (endDate) timeQuery.createAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // 并行执行多个聚合查询
    const [
      totalCount,
      resolvedCount,
      errorTypeStats,
      operationStats,
      impactLevelStats,
      dailyStats
    ] = await Promise.all([
      // 总错误数
      MaterialPalletizingErrorLog.countDocuments(timeQuery),
      
      // 已解决错误数
      MaterialPalletizingErrorLog.countDocuments({
        ...timeQuery,
        resolved: true
      }),
      
      // 按错误类型统计
      MaterialPalletizingErrorLog.aggregate([
        { $match: timeQuery },
        { $group: { _id: "$errorType", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // 按操作类型统计
      MaterialPalletizingErrorLog.aggregate([
        { $match: timeQuery },
        { $group: { _id: "$operation", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // 按影响级别统计
      MaterialPalletizingErrorLog.aggregate([
        { $match: timeQuery },
        { $group: { _id: "$impactLevel", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // 按日期统计（最近30天）
      MaterialPalletizingErrorLog.aggregate([
        { 
          $match: {
            createAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createAt" },
              month: { $month: "$createAt" },
              day: { $dayOfMonth: "$createAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalCount,
          resolved: resolvedCount,
          unresolved: totalCount - resolvedCount,
          resolutionRate: totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(2) : "0.00"
        },
        errorTypeStats,
        operationStats,
        impactLevelStats,
        dailyStats
      }
    });
  } catch (error) {
    console.error("获取错误日志统计失败:", error);
    res.status(500).json({
      success: false,
      message: "获取错误日志统计失败",
      error: error.message
    });
  }
});

/**
 * @api {get} /api/material-palletizing-error-log/:errorId 查询单个错误日志详情
 * @apiGroup 托盘错误日志
 */
router.get("/:errorId", async (req, res) => {
  try {
    const { errorId } = req.params;
    
    const errorLog = await MaterialPalletizingErrorLog.findOne({ errorId })
      .populate('palletId', 'palletCode status materialName')
      .populate('productLineId', 'lineName')
      .populate('processStepId', 'processName processCode')
      .populate('materialId', 'FName FNumber FSpecification')
      .populate('productionPlanWorkOrderId', 'workOrderNo')
      .populate('createBy', 'username realName')
      .populate('resolvedBy', 'username realName');

    if (!errorLog) {
      return res.status(404).json({
        success: false,
        message: "未找到对应的错误日志"
      });
    }

    res.json({
      success: true,
      data: errorLog
    });
  } catch (error) {
    console.error("查询错误日志详情失败:", error);
    res.status(500).json({
      success: false,
      message: "查询错误日志详情失败",
      error: error.message
    });
  }
});

/**
 * @api {put} /api/material-palletizing-error-log/:errorId/resolve 标记错误为已解决
 * @apiGroup 托盘错误日志
 * @apiParam {String} resolutionNote 解决说明
 */
router.put("/:errorId/resolve", async (req, res) => {
  try {
    const { errorId } = req.params;
    const { resolutionNote } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!resolutionNote) {
      return res.status(400).json({
        success: false,
        message: "请提供解决说明"
      });
    }

    await MaterialPalletizingService.resolveError(errorId, resolutionNote, userId);

    res.json({
      success: true,
      message: "错误已标记为已解决"
    });
  } catch (error) {
    console.error("标记错误为已解决失败:", error);
    res.status(500).json({
      success: false,
      message: "标记错误为已解决失败",
      error: error.message
    });
  }
});

/**
 * @api {get} /api/material-palletizing-error-log/barcode/:barcode 根据条码查询相关错误
 * @apiGroup 托盘错误日志
 */
router.get("/barcode/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;
    const { limit = 10 } = req.query;

    const errors = await MaterialPalletizingErrorLog.find({ barcode })
      .populate('palletId', 'palletCode')
      .populate('productLineId', 'lineName')
      .sort({ createAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: errors
    });
  } catch (error) {
    console.error("根据条码查询错误日志失败:", error);
    res.status(500).json({
      success: false,
      message: "根据条码查询错误日志失败",
      error: error.message
    });
  }
});

/**
 * @api {get} /api/material-palletizing-error-log/pallet/:palletCode 根据托盘编号查询相关错误
 * @apiGroup 托盘错误日志
 */
router.get("/pallet/:palletCode", async (req, res) => {
  try {
    const { palletCode } = req.params;
    const { limit = 10 } = req.query;

    const errors = await MaterialPalletizingErrorLog.find({ palletCode })
      .populate('productLineId', 'lineName')
      .populate('processStepId', 'processName')
      .sort({ createAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: errors
    });
  } catch (error) {
    console.error("根据托盘编号查询错误日志失败:", error);
    res.status(500).json({
      success: false,
      message: "根据托盘编号查询错误日志失败",
      error: error.message
    });
  }
});

module.exports = router; 