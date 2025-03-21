const ApiLog = require("../model/system/apiLog");

/**
 * API日志中间件
 * 记录所有API请求和响应
 */
const apiLogger = (serviceName) => {
  return async (req, res, next) => {
    // 保存原始的res.json方法
    const originalJson = res.json;
    const startTime = Date.now();
    let responseBody = null;

    // 覆盖res.json方法以捕获响应内容
    res.json = function(data) {
      responseBody = data;
      return originalJson.call(this, data);
    };

    // 请求处理完成后记录日志
    res.on("finish", async () => {
      try {
        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // 如果路径包含健康检查或其他不需要记录的路径，可以在这里过滤
        if (req.path.includes("/health") || req.path.includes("/ping")) {
          return;
        }

        // 创建日志记录
        const logEntry = new ApiLog({
          endpoint: req.originalUrl || req.url,
          method: req.method,
          serviceName: serviceName,
          requestParams: req.params,
          requestQuery: req.query,
          requestBody: req.body,
          responseStatus: res.statusCode,
          responseBody: responseBody,
          success: res.statusCode < 400 && (responseBody?.success !== false),
          executionTime: executionTime,
          errorMessage: responseBody?.message && !responseBody?.success ? responseBody.message : null,
          userId: req.user?._id,
          userIp: req.ip || req.connection.remoteAddress,
          timestamp: new Date()
        });

        // 异步保存日志，不阻塞响应
        await logEntry.save();
      } catch (error) {
        console.error("记录API日志时出错:", error);
      }
    });

    next();
  };
};

module.exports = apiLogger; 