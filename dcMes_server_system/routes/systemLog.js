const express = require("express");
const router = express.Router();
const ApiLog = require("../model/system/apiLog");
const apiLogger = require("../middleware/apiLogger");

// 使用API日志中间件
router.use(apiLogger("systemLog"));

// 获取API日志列表
router.get("/api/v1/system/logs", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      endpoint,
      method,
      serviceName,
      startDate,
      endDate,
      success,
      userId
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (endpoint) query.endpoint = { $regex: endpoint, $options: 'i' };
    if (method) query.method = method;
    if (serviceName) query.serviceName = serviceName;
    if (success !== undefined) query.success = success === 'true';
    if (userId) query.userId = userId;
    
    // 日期范围查询
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 执行查询
    const logs = await ApiLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await ApiLog.countDocuments(query);

    res.json({
      code: 200,
      success: true,
      data: {
        list: logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message
    });
  }
});

// 获取日志详情
router.get("/api/v1/system/logs/:id", async (req, res) => {
  try {
    const log = await ApiLog.findById(req.params.id).lean();
    
    if (!log) {
      return res.status(200).json({
        code: 404,
        success: false,
        message: "日志记录不存在"
      });
    }
    
    res.json({
      code: 200,
      success: true,
      data: log
    });
  } catch (error) {
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message
    });
  }
});

// 清除过期日志（例如30天前的日志）
router.delete("/api/v1/system/logs/clear-expired", async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const date = new Date();
    date.setDate(date.getDate() - parseInt(days));
    
    const result = await ApiLog.deleteMany({ timestamp: { $lt: date } });
    
    res.json({
      code: 200,
      success: true,
      message: `成功清除${days}天前的${result.deletedCount}条日志记录`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 