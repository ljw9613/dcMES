/**
 * 数据库连接配置
 * 用于工单处理服务的MongoDB连接
 */

const mongoose = require("mongoose");

// 数据库连接URL
const mongodbUrl = process.env.MONGODB_URI || 
  "mongodb://dcmes:bA6GNfZGy7rF4TRp@106.52.179.92:27017/dcmes";

// 连接选项配置
const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 120000,
  connectTimeoutMS: 30000,
  maxPoolSize: 20, // 单实例服务，连接池设置小一些
  minPoolSize: 5,
  maxConnecting: 10,
  retryWrites: true,
  family: 4,
  maxIdleTimeMS: 60000,
  heartbeatFrequencyMS: 10000,
  waitQueueTimeoutMS: 10000,
  writeConcern: { w: 1 },
  readPreference: 'primaryPreferred'
};

// 连接数据库
const connectDatabase = () => {
  return new Promise((resolve, reject) => {
    mongoose.connect(mongodbUrl, connectOptions, (err) => {
      if (err) {
        console.error("❌ 数据库连接失败:", err);
        reject(err);
      }
    });

    // 成功连接事件
    mongoose.connection.once("open", () => {
      console.log("✅ 数据库连接成功");
      console.log("📦 MongoDB URL:", mongodbUrl.replace(/:[^:@]+@/, ':****@'));
      resolve();
    });

    // 监听连接断开事件
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB连接断开，时间:", new Date().toISOString());
    });

    // 监听连接错误
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB连接错误:", err);
    });
  });
};

// 优雅关闭数据库连接
const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log("✅ 数据库连接已关闭");
  } catch (error) {
    console.error("❌ 关闭数据库连接失败:", error);
  }
};

module.exports = {
  connectDatabase,
  closeDatabase,
  mongoose
};

