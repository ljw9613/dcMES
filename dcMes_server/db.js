/*
 * @name: **列表
 * @content: 
 * @Author: joyce
 * @Date: 2020-09-09 10:44:39
a'da'w'd */
let mongoose = require("mongoose");

module.exports = (app) => {
  let mongodbUrl =
    // "mongodb://dcMes:dcMes123.@127.0.0.1:27017/dcMes";
    "mongodb://dcmes:bA6GNfZGy7rF4TRp@106.52.179.92:27017/dcmes";
  // "mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes";
  // "mongodb://seafoodStreet:seafoodStreet888@47.115.19.76:27017/seafoodStreet";//本地测试
  // 'mongodb://dcMesCs:ZxbM3zijfmDCjHZY@127.0.0.1:27017/dcMesCs';//线上测试

  // 连接池固定配置（服务器 64核）
  // WiredTiger 并发瓶颈是 ticket（默认128读+128写），64核 ≠ 需要640个连接
  // 每个 PM2 实例固定 50 个连接，4实例合计 200，不会压垮数据库
  const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000, // 服务端选择超时：15秒，更快暴露问题
    socketTimeoutMS: 60000,          // socket超时：60秒，配合查询层 maxTimeMS 兜底
    connectTimeoutMS: 15000,         // 连接超时：15秒
    maxPoolSize: 50,                 // 每实例最大50个连接，上限清晰可控
    minPoolSize: 10,                 // 保持10个热连接，减少冷启动开销
    maxConnecting: 10,               // 同时建立连接数，避免瞬间冲击
    retryWrites: true,
    family: 4,
    maxIdleTimeMS: 60000,            // 空闲连接60秒后回收
    heartbeatFrequencyMS: 10000,
    waitQueueTimeoutMS: 10000,       // 等待可用连接超时10秒，尽快失败避免请求堆积
    writeConcern: { w: 1 },
    readPreference: "primaryPreferred",
  };

  console.log("MongoDB连接池配置: maxPoolSize=50, minPoolSize=10");

  // 创建连接
  mongoose.connect(mongodbUrl, connectOptions, (err) => {
    if (err) {
      console.log("数据库链接失败:", err);
    }
  });

  // 成功连接事件
  mongoose.connection.once("open", () => {
    console.log("数据库链接成功");
  });

  // 连接计数器，用于监控连接状态
  let disconnectCount = 0;
  let lastDisconnectTime = Date.now();

  // 监听连接断开事件
  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB连接断开，时间:", new Date().toISOString());

    const now = Date.now();
    // 如果距离上次断开超过1分钟，重置计数
    if (now - lastDisconnectTime > 60000) {
      disconnectCount = 0;
    }

    disconnectCount++;
    lastDisconnectTime = now;

    // 记录短时间内频繁断开的情况
    if (disconnectCount > 5) {
      console.log(
        `警告: MongoDB短时间内断开连接${disconnectCount}次，可能存在网络或服务器问题`,
      );
    }
  });

  // 监听连接错误
  mongoose.connection.on("error", (err) => {
    console.log("MongoDB连接错误:", err);
  });

  // 监控连接池大小变化
  mongoose.connection.on("poolSize", (size) => {
    console.log(`MongoDB连接池大小变化: ${size}`);
  });

  // 定期报告连接池状态
  if (process.env.NODE_ENV === "production") {
    setInterval(() => {
      try {
        const poolStatus = mongoose.connection.client.topology.s.pool;
        if (poolStatus) {
          console.log(
            `MongoDB连接池状态 - 可用: ${poolStatus.availableConnections}, 总数: ${poolStatus.totalConnections}, 创建中: ${poolStatus.connectingConnections}`,
          );
        }
      } catch (e) {
        // 忽略，此功能仅用于监控
      }
    }, 300000); // 每5分钟报告一次
  }

  // PM2 重启/停止时发送 SIGINT（Windows）或 SIGTERM（Linux），必须主动关闭连接
  // 否则旧进程的连接在 MongoDB 服务端变成僵尸连接，积累后耗尽连接槽导致后续连接失败
  // kill_timeout 在 ecosystem.config.js 中设为 8000ms，给这里留足关闭时间
  const gracefulShutdown = (signal) => {
    console.log(`[MongoDB] 收到 ${signal} 信号，开始优雅关闭数据库连接...`);
    mongoose.connection.close(false, () => {
      console.log(`[MongoDB] 数据库连接已关闭 (${signal})`);
      process.exit(0);
    });

    // 兜底超时：如果 5 秒内没关完，强制退出，避免 PM2 等待超时后 SIGKILL 
    setTimeout(() => {
      console.error("[MongoDB] 数据库连接关闭超时，强制退出");
      process.exit(1);
    }, 5000);
  };

  process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.once("SIGINT",  () => gracefulShutdown("SIGINT"));
};
