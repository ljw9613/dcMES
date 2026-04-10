const ApiLog = require("../model/system/apiLog");
const jwt = require("jsonwebtoken");
const config = require("../libs/config");

// 查询型请求（通常噪声大）：默认不记录“成功”的请求日志
// 仍保留异常/失败状态码的日志，便于排查问题
const QUERY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SLOW_REQUEST_MS = 1000;
const API_LOG_CONTEXT = Symbol("apiLoggerContext");
const HIGH_FREQUENCY_SUCCESS_SKIP_PATHS = [
  "/initialize-machine-barcode",
  "/machine-scan-components",
  "/get-laser-print-barcode",
  "/confirm-laser-barcode-used",
  "/check-barcode-prerequisites",
];

function shouldSkipLogPath(path = "") {
  return (
    path.includes("/health") ||
    path.includes("/ping") ||
    path.includes("/InspectionLastData") ||
    path.includes("/InspectionData")
  );
}

function shouldSkipSuccessfulPath(path = "") {
  return HIGH_FREQUENCY_SUCCESS_SKIP_PATHS.some((item) => path.includes(item));
}

function buildEndpoint(req) {
  const fullUrl = req.originalUrl || req.url || "";
  return fullUrl.length > 500
    ? fullUrl.substring(0, 500) + "...[截断]"
    : fullUrl;
}

function buildResponseSnippet(responseBody) {
  if (responseBody === null || responseBody === undefined) {
    return null;
  }

  try {
    const raw =
      typeof responseBody === "string"
        ? responseBody
        : JSON.stringify(responseBody);
    return raw.length > 500 ? raw.substring(0, 500) + "...[截断]" : raw;
  } catch (_) {
    return "[序列化失败]";
  }
}

function shouldPersistApiLog({
  path,
  method,
  statusCode,
  success,
  executionTime,
}) {
  if (statusCode >= 400 || success === false) {
    return true;
  }

  // 成功的写操作请求全部保留，便于追踪关键数据变更
  if (["POST", "PUT", "DELETE"].includes((method || "").toUpperCase())) {
    return true;
  }

  // 成功的高频设备接口直接跳过，继续降低主库日志写入压力
  if (shouldSkipSuccessfulPath(path)) {
    return false;
  }

  // 成功的查询型请求默认不记录
  if (QUERY_METHODS.has((method || "").toUpperCase())) {
    return false;
  }

  // 其他成功请求仅记录慢请求
  return executionTime >= SLOW_REQUEST_MS;
}

/**
 * API日志中间件
 * 记录所有API请求和响应
 */
const apiLogger = (serviceName) => {
  return async (req, res, next) => {
    const logContext = req[API_LOG_CONTEXT] || {
      startTime: Date.now(),
      responseBody: null,
      serviceNames: new Set(),
      finishHookAttached: false,
      responseWrapped: false,
    };
    req[API_LOG_CONTEXT] = logContext;
    logContext.serviceNames.add(serviceName);

    if (!logContext.responseWrapped) {
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        logContext.responseBody = data;
        return originalJson(data);
      };
      logContext.responseWrapped = true;
    }

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
        // 如果前置中间件已经解析过用户信息（例如同一路由上重复挂载了 apiLogger），避免重复验签
        if (req.userId || req.userName || req.realName || req.roleId) {
          userId = req.userId ?? null;
          userName = req.userName ?? null;
          realName = req.realName ?? null;
          roleId = req.roleId ?? null;
        } else {
          // 验证token并解析用户信息
          const decoded = jwt.verify(token, config.secretOrPrivateKey);
          userId = decoded._id;
          userName = decoded.userName;
          realName = decoded.realName;
          roleId = decoded.roleId;
        }

        // 将用户信息附加到req对象，以便后续中间件或路由处理器使用
        req.userId = userId;
        req.userName = userName;
        req.realName = realName;
        req.roleId = roleId;
      } catch (err) {
        // 如果不是登录或公开路由，则返回401错误
        if (!isLoginRoute && !isPublicRoute && !isDeviceRoute) {
          // 记录验证失败日志
          try {
            const logEntry = new ApiLog({
              endpoint: buildEndpoint(req),
              method: req.method,
              serviceName: serviceName,
              requestParams: req.params,
              requestQuery: req.query,
              responseStatus: 401,
              responseSnippet: '{"success":false,"message":"Token验证失败，请重新登录","code":401}',
              success: false,
              executionTime: Date.now() - logContext.startTime,
              errorMessage: err.message && err.message.length > 1000 ? err.message.substring(0, 1000) : err.message,
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
      // 记录未提供Token的日志
      try {
        const logEntry = new ApiLog({
          endpoint: buildEndpoint(req),
          method: req.method,
          serviceName: serviceName,
          requestParams: req.params,
          requestQuery: req.query,
          responseStatus: 401,
          responseSnippet: '{"success":false,"message":"未提供授权Token，请登录","code":401}',
          success: false,
          executionTime: Date.now() - logContext.startTime,
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
    if (!logContext.finishHookAttached) {
      logContext.finishHookAttached = true;
      res.on("finish", async () => {
        try {
          const executionTime = Date.now() - logContext.startTime;
          const responseBody = logContext.responseBody;
          const success = res.statusCode < 400 && responseBody?.success !== false;

          if (shouldSkipLogPath(req.path)) {
            return;
          }

          if (
            !shouldPersistApiLog({
              path: req.path,
              method: req.method,
              statusCode: res.statusCode,
              success,
              executionTime,
            })
          ) {
            return;
          }

          // 特殊处理登录接口 - 从响应体中获取用户信息
          let logUserId = userId;
          let logUserName = userName;
          let logRealName = realName;
          let logRoleId = roleId;

          if (
            req.path.includes("/user/login") &&
            responseBody?.code === 200 &&
            responseBody?.user
          ) {
            logUserId = responseBody.user._id;
            logUserName = responseBody.user.userName;
            logRealName = responseBody.user.realName || responseBody.user.userName;
            logRoleId = responseBody.user.role ? responseBody.user.role._id : null;
          } else if (req.path.includes("/user/info") && !userId && req.body?.id) {
            try {
              const user_login = require("../model/system/user_login");
              const user = await user_login.findOne({ _id: req.body.id }).populate("role");
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

          const rawErrorMsg =
            responseBody?.message && !success ? responseBody.message : null;
          const errorMessage =
            rawErrorMsg && rawErrorMsg.length > 1000
              ? rawErrorMsg.substring(0, 1000) + "...[截断]"
              : rawErrorMsg;

          const logEntry = new ApiLog({
            endpoint: buildEndpoint(req),
            method: req.method,
            serviceName: Array.from(logContext.serviceNames).join("|"),
            requestParams: req.params,
            requestQuery: req.query,
            responseStatus: res.statusCode,
            responseSnippet: buildResponseSnippet(responseBody),
            success: success,
            executionTime: executionTime,
            errorMessage: errorMessage,
            userId: logUserId,
            userName: logUserName,
            realName: logRealName,
            roleId: logRoleId,
            userIp: req.ip || req.connection.remoteAddress,
            timestamp: new Date(),
          });

          logEntry.save().catch((error) => {
            console.error(`[${serviceName}] 记录API日志时出错:`, error);
          });
        } catch (error) {
          console.error(`[${serviceName}] 记录API日志时出错:`, error);
        }
      });
    }

    next();
  };
};

module.exports = apiLogger;
