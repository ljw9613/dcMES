const ApiLog = require("../model/system/apiLog");
const jwt = require("jsonwebtoken");
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
    res.json = function (data) {
      responseBody = data;
      return originalJson.call(this, data);
    };

    // 从请求头中获取用户token并解析用户ID
    let userId = null;
    let userName = null;
    let realName = null;
    let roleId = null;

    // 获取授权头
    const authHeader = req.headers.authorization || "";

    // 添加详细的调试信息
    // console.log(`[${serviceName}] 完整请求头:`, req.headers);
    // console.log(`[${serviceName}] Authorization头:`, authHeader);

    // 正确提取token，确保移除"Bearer "前缀
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    // console.log(`[${serviceName}] 提取的token:`, token);
    // console.log(`[${serviceName}] token长度:`, token.length);

    // 检查请求路径是否为登录路由或不需要验证的路由
    const isLoginRoute =
      req.path.includes("/login") || req.path.includes("/auth");
    const isPublicRoute =
      req.path.includes("/public") ||
      req.path.includes("/health") ||
      req.path.includes("/ping") ;
    // 设备对接的接口不需要验证路由
    const isDeviceRoute =
      req.path.includes("/machine-scan-components") ||
      req.path.includes("/initialize-machine-barcode")||
      req.path.includes("/get-laser-print-barcode")||
      req.path.includes("/confirm-laser-barcode-used");

    if (token && token.length > 0) {
      try {
        // console.log(`[${serviceName}] 正在验证token...`);
        // console.log(`[${serviceName}] 使用密钥:`, config.secretOrPrivateKey);

        // 验证token并解析用户信息
        const decoded = jwt.verify(token, config.secretOrPrivateKey);

        // console.log(`[${serviceName}] Token解析成功:`, decoded);

        userId = decoded._id;
        userName = decoded.userName;
        realName = decoded.realName;
        roleId = decoded.roleId;

        // 将用户信息附加到req对象，以便后续中间件或路由处理器使用
        req.userId = userId;
        req.userName = userName;
        req.realName = realName;
        req.roleId = roleId;
      } catch (err) {
        console.error(`[${serviceName}] Token验证失败:`, err.message);

        // 如果不是登录或公开路由，则返回401错误
        if (!isLoginRoute && !isPublicRoute && !isDeviceRoute) {
          // 记录验证失败日志
          try {
            const logEntry = new ApiLog({
              endpoint: req.originalUrl || req.url,
              method: req.method,
              serviceName: serviceName,
              requestParams: req.params,
              requestQuery: req.query,
              requestBody: req.body,
              responseStatus: 401,
              responseBody: {
                success: false,
                message: "Token验证失败，请重新登录",
                code: 401,
              },
              success: false,
              executionTime: Date.now() - startTime,
              errorMessage: err.message,
              userIp: req.ip || req.connection.remoteAddress,
              timestamp: new Date(),
            });

            await logEntry.save();
          } catch (logErr) {
            console.error(`[${serviceName}] 记录API日志时出错:`, logErr);
          }

          // 返回401错误，通知前端重新登录
          return res.status(401).json({
            success: false,
            message: "Token验证失败，请重新登录",
            code: 401,
          });
        }
      }
    } else if (!isLoginRoute && !isPublicRoute && !isDeviceRoute) {
      // 如果非公开路由且没有提供token，返回401错误
      console.error(`[${serviceName}] 未提供Token`);

      // 记录未提供Token的日志
      try {
        const logEntry = new ApiLog({
          endpoint: req.originalUrl || req.url,
          method: req.method,
          serviceName: serviceName,
          requestParams: req.params,
          requestQuery: req.query,
          requestBody: req.body,
          responseStatus: 401,
          responseBody: {
            success: false,
            message: "未提供授权Token，请登录",
            code: 401,
          },
          success: false,
          executionTime: Date.now() - startTime,
          errorMessage: "未提供授权Token",
          userIp: req.ip || req.connection.remoteAddress,
          timestamp: new Date(),
        });

        await logEntry.save();
      } catch (logErr) {
        console.error(`[${serviceName}] 记录API日志时出错:`, logErr);
      }

      // 返回401错误
      return res.status(401).json({
        success: false,
        message: "未提供授权Token，请登录",
        code: 401,
      });
    }

    // 请求处理完成后记录日志
    res.on("finish", async () => {
      try {
        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // 如果路径包含健康检查或其他不需要记录的路径，可以在这里过滤
        if (req.path.includes("/health") || req.path.includes("/ping") || 
            req.path.includes("/InspectionLastData") || req.path.includes("/InspectionData")) {
          return;
        }

        // 特殊处理登录接口 - 从响应体中获取用户信息
        let logUserId = userId;
        let logUserName = userName;
        let logRealName = realName;
        let logRoleId = roleId;

        if (req.path.includes("/user/login") && responseBody?.code === 200 && responseBody?.user) {
          // 登录成功时，从响应中获取用户信息
          logUserId = responseBody.user._id;
          logUserName = responseBody.user.userName;
          logRealName = responseBody.user.realName || responseBody.user.userName;
          logRoleId = responseBody.user.role ? responseBody.user.role._id : null;
        } else if (req.path.includes("/user/info") && !userId && req.body?.id) {
          // 用户信息接口，如果token解析失败但请求体中有用户ID，尝试从请求体获取
          try {
            const user_login = require("../model/system/user_login");
            const user = await user_login.findOne({ _id: req.body.id }).populate('role');
            if (user) {
              logUserId = user._id;
              logUserName = user.userName;
              logRealName = user.realName || user.userName;
              logRoleId = user.role ? user.role._id : null;
            }
          } catch (userLookupErr) {
            console.error(`[${serviceName}] 从请求体查找用户信息失败:`, userLookupErr);
          }
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
          success: res.statusCode < 400 && responseBody?.success !== false,
          executionTime: executionTime,
          errorMessage:
            responseBody?.message && !responseBody?.success
              ? responseBody.message
              : null,
          userId: logUserId,
          userName: logUserName,
          realName: logRealName,
          roleId: logRoleId,
          userIp: req.ip || req.connection.remoteAddress,
          timestamp: new Date(),
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
