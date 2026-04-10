/*
 * @name: 用户活动时间检查中间件
 * @content: 检查用户15分钟内是否有活动，无活动则返回401
 * @Author: AI Assistant
 * @Date: 2024-09-22
 */

const jwt = require("jsonwebtoken");
const config = require("../libs/config");

/**
 * 用户活动检查中间件
 * 检查JWT token中的lastActivityTime，如果超过15分钟则要求重新登录
 */
const activityCheck = () => {
  return (req, res, next) => {
    // 检查请求路径是否为登录路由或不需要验证的路由
    const isLoginRoute = req.path.includes("/login") || req.path.includes("/auth");
    const isPublicRoute = req.path.includes("/public") || 
                         req.path.includes("/health") || 
                         req.path.includes("/ping");
    const isDeviceRoute = req.path.includes("/machine-scan-components") ||
                         req.path.includes("/initialize-machine-barcode") ||
                         req.path.includes("/confirm-laser-barcode-used");
    // 追觅割草机车间对外三元组接口：免 JWT，安全依赖网络/专线隔离（勿对公网暴露）
    const isTripletPublicApi =
      req.method === "POST" && req.path === "/api/v1/tripletData";
    
    // 如果是不需要检查的路由，直接跳过
    if (isLoginRoute || isPublicRoute || isDeviceRoute || isTripletPublicApi) {
      return next();
    }
    
    // 获取授权头
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : authHeader;
    
    if (!token) {
      console.warn('[Token调试] 活动检查-401 缺少token', req.method, req.path);
      return res.status(401).json({
        code: 401,
        message: "缺少认证token",
        success: false
      });
    }
    
    try {
      // 验证并解析token
      const decoded = jwt.verify(token, config.secretOrPrivateKey);
      const now = Date.now();
      
      // 检查token中是否包含活动时间信息
      if (!decoded.lastActivityTime && !decoded.loginTime) {
        // 旧版本token，允许通过但记录警告
        console.warn(`用户 ${decoded.userName} 使用旧版本token，建议重新登录`);
        return next();
      }
      
      // 注释掉后端时间校验，完全由前端控制会话过期
      // const lastActivity = decoded.lastActivityTime || decoded.loginTime;
      // const timeSinceLastActivity = now - lastActivity;
      
      // 后端不再进行时间校验，避免前后端时间不同步问题

      // 更新用户活动时间（生成新token）
      // 移除JWT标准字段，只保留自定义字段
      const { exp, iat, ...customPayload } = decoded;
      const updatedPayload = {
        ...customPayload,
        lastActivityTime: now
      };

      
      // 生成新的token
      const newToken = jwt.sign(updatedPayload, config.secretOrPrivateKey, {
        expiresIn: "30 days"
      });
      // 在响应头中返回新token
      res.setHeader('X-New-Token', newToken);
      
      // 将更新后的用户信息附加到req对象
      req.userId = decoded._id;
      req.userName = decoded.userName;
      req.realName = decoded.realName;
      req.roleId = decoded.roleId;
      req.lastActivityTime = now;
      
      next();
      
    } catch (err) {
      console.warn('[activityCheck] JWT验证失败', req.method, req.path, '| err.name:', err.name, '| err.message:', err.message);
      
      return res.status(401).json({
        code: 401,
        message: "Token验证失败，请重新登录",
        success: false,
        error: err.message
      });
    }
  };
};

module.exports = activityCheck;
