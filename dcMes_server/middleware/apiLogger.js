const ApiLog = require("../model/system/apiLog");
const jwt = require('jsonwebtoken');
const config = require("../libs/config");

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

    // 从请求头中获取用户token并解析用户ID
    let userId = null;
    let userName = null;
    let realName = null;
    let roleId = null;
    
    // 获取授权头
    const authHeader = req.headers.authorization || '';
    
    // 添加详细的调试信息
    console.log(`[${serviceName}] 完整请求头:`, req.headers);
    console.log(`[${serviceName}] Authorization头:`, authHeader);
    
    // 正确提取token，确保移除"Bearer "前缀
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    
    console.log(`[${serviceName}] 提取的token:`, token);
    console.log(`[${serviceName}] token长度:`, token.length);
    
    if (token && token.length > 0) {
      try {
        console.log(`[${serviceName}] 正在验证token...`);
        console.log(`[${serviceName}] 使用密钥:`, config.secretOrPrivateKey);
        
        // 验证token并解析用户信息
        const decoded = jwt.verify(token, config.secretOrPrivateKey);
        
        console.log(`[${serviceName}] Token解析成功:`, decoded);
        
        userId = decoded._id;
        userName = decoded.userName;
        realName = decoded.realName;
        roleId = decoded.roleId;
      } catch (err) {
        console.error(`[${serviceName}] Token验证失败:`, err.message);
        // 不阻止请求继续，只是记录错误
      }
    }

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
          userId: userId,
          userName: userName,
          realName: realName,
          roleId: roleId,
          userIp: req.ip || req.connection.remoteAddress,
          timestamp: new Date()
        });

        // 异步保存日志，不阻塞响应
        await logEntry.save();
      } catch (error) {
        console.error(`[${serviceName}] 记录API日志时出错:`, error);
      }
    });

    next();
  };
};

module.exports = apiLogger; 