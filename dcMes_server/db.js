/*
 * @name: **列表
 * @content: 
 * @Author: joyce
 * @Date: 2020-09-09 10:44:39
a'da'w'd */
let mongoose = require("mongoose");

module.exports = app => {
  let mongodbUrl =
    "mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes";
  // "mongodb://seafoodStreet:seafoodStreet888@47.115.19.76:27017/seafoodStreet";//本地测试
  // 'mongodb://dcMesCs:ZxbM3zijfmDCjHZY@127.0.0.1:27017/dcMesCs';//线上测试
  
  // 连接选项配置 - 针对物联网高频数据采集和读写优化
  const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 服务器选择超时：30秒
    socketTimeoutMS: 120000, // socket超时增加到120秒，适应长时间运行的查询
    connectTimeoutMS: 30000, // 连接超时：30秒
    maxPoolSize: 50, // 增加连接池最大连接数，支持高并发
    minPoolSize: 10, // 增加最小连接数，减少连接建立开销
    maxConnecting: 20, // 增加同时连接数，提高并发连接能力
    retryWrites: true,
    family: 4, // 强制使用IPv4
    maxIdleTimeMS: 60000, // 空闲连接60秒后关闭，避免资源浪费
    heartbeatFrequencyMS: 10000, // 心跳检测频率增加，更快检测连接问题
    waitQueueTimeoutMS: 10000, // 等待队列超时设置
    writeConcern: { w: 1 }, // 写入确认级别，确保数据写入到至少一个节点
    readPreference: 'primaryPreferred' // 优先从主节点读取，保证数据一致性
  };
  
  // 创建连接
  mongoose.connect(
    mongodbUrl,
    connectOptions,
    err => {
      if (err) {
        console.log("数据库链接失败:", err);
      }
    }
  );

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
      console.log(`警告: MongoDB短时间内断开连接${disconnectCount}次，可能存在网络或服务器问题`);
    }
  });
  
  // 监听连接错误
  mongoose.connection.on("error", (err) => {
    console.log("MongoDB连接错误:", err);
  });
  
  // 监控连接池大小变化
  mongoose.connection.on('poolSize', (size) => {
    console.log(`MongoDB连接池大小变化: ${size}`);
  });
  
  // 定期报告连接池状态
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      try {
        // 注意：这是一个非标准API，可能需要根据实际mongoose版本调整
        const poolStatus = mongoose.connection.client.topology.s.pool;
        if (poolStatus) {
          console.log(`MongoDB连接池状态 - 可用: ${poolStatus.availableConnections}, 总数: ${poolStatus.totalConnections}, 创建中: ${poolStatus.connectingConnections}`);
        }
      } catch (e) {
        // 忽略错误，此功能仅用于监控
      }
    }, 300000); // 每5分钟报告一次
  }
};
