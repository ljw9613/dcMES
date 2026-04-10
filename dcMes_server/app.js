let createError = require("http-errors");
let express = require("express");
let path = require("path");
let cors = require("cors");
let bodyParser = require("body-parser");
let cookieParser = require("cookie-parser");
let helmet = require("helmet");
let compression = require("compression");
let config = require("./libs/config");
//解析token
var expressJwt = require("express-jwt");
const systemLogRoutes = require("./routes/systemLog");
const queueMonitorRoutes = require("./routes/queueMonitor");
const activityCheck = require("./middleware/activityCheck");

let app = express();
app.set('trust proxy', true);
app.use(
  bodyParser.json({
    limit: "100mb",
  })
);
app.use(
  bodyParser.urlencoded({
    limit: "100mb",
    extended: true,
  })
);
// 自定义token

//链接数据库
let dbConnect = require("./db")();

// 初始化队列服务
const { QueueService } = require("./services/queueService");
const mongoose = require("mongoose");

// PM2 负载均衡下，所有实例都注册队列消费者（Bull 通过 Redis 任务锁保证不重复处理）
// 但根据实例总数动态降低每实例的并发数，避免连接池被打满
// 例如总期望并发=6，2个实例时每实例并发=3，4个实例时每实例并发=1
const pm2InstanceId = process.env.NODE_APP_INSTANCE ?? 'standalone';
const totalInstances = parseInt(process.env.PM2_INSTANCES || '1', 10);

console.log(`📦 当前实例 (PM2 instance: ${pm2InstanceId})，总实例数: ${totalInstances}，开始初始化队列消费者...`);

// 监听数据库连接完成事件，然后启动队列服务
mongoose.connection.once("open", async () => {
  console.log("📦 数据库连接完成，开始初始化工单更新队列服务...");
  
  setTimeout(async () => {
    try {
      await QueueService.initializeProcessor(totalInstances);
      console.log("✅ 队列服务初始化成功");
    } catch (error) {
      console.error("❌ 队列服务初始化失败:", error);
      console.error("⚠️ 应用将继续运行，但工单更新功能可能受影响");
    }
  }, 2000);
});

// 如果数据库已经连接（比如重新加载），也要初始化队列
if (mongoose.connection.readyState === 1) {
  console.log("📦 数据库已连接，初始化工单更新队列服务...");
  setTimeout(async () => {
    try {
      await QueueService.initializeProcessor(totalInstances);
      console.log("✅ 队列服务初始化成功");
    } catch (error) {
      console.error("❌ 队列服务初始化失败:", error);
      console.error("⚠️ 应用将继续运行，但工单更新功能可能受影响");
    }
  }, 2000);
}

// view engine setup 设置 模板引擎的存放目录与用的什么模板引擎
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

//Helmet是一系列帮助增强Node.JS之Express/Connect等Javascript Web应用安全的中间件。
app.use(helmet());
//跨域
app.use(cors());
// app.use(
//   cors({
//     origin: ["http://localhost:3001"],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"]
//   })
// );
//压缩请求 gzip是用于压缩，js、css等文件的压缩
app.use(compression());
// 为了支持 req.body 的使用
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
// 为了获取 cookie
app.use(cookieParser());


// 设置静态文件托管
app.use(express.static(path.join(__dirname, "public")));

// 用户活动检查中间件 - 替代原来的JWT验证，包含活动时间检查
app.use(activityCheck());

// JWT验证失败时的处理
app.use(function (err, req, res, next) {
  console.log("JWT验证错误，请求URL:", req.url);
  
  if (req.url.indexOf("enclosure") > -1) {
    res.json({
      message: "找不到文件",
      code: 404,
      error: err
    });
    return;
  }
  
  if (err.name === "UnauthorizedError") {
    console.error(req.path + ",无效token:", err.message);
    res.status(401).json({
      message: "Token验证失败，请重新登录",
      code: 401,
      success: false,
      error: err.message
    });
    return;
  }
  
  next(err);
});

// 添加静态文件服务
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

//挂载路由
// 设置 抽离出去的 路由文件的访问路径的前缀
// url 已 / 开头的，都会走到 indexRouter 中去。
// app.use("/", indexRouter);
// url 已  /users 开头的，都会走到 usersRouter 中去
app.use("/", require("./routes/upload"));
app.use("/", require("./routes/tripletDataApi"));
app.use("/", require("./routes/CRADROUTER.js"));
app.use("/", require("./routes/managerlogin.js"));
app.use("/", require("./routes/data"));
app.use("/", require("./routes/getRouter"));
app.use("/", require("./routes/k3requestData.js"));
app.use("/api/v1/k3", require("./routes/K3asyncData"));
app.use("/", require("./routes/materialProcessFlowService"));
app.use("/", require("./routes/materialBarcodeBatch"));
const uploadAvatarRouter = require("./routes/uploadAvatar");
app.use("/", uploadAvatarRouter);
app.use("/", require("./routes/wsManage"));
app.use("/", require("./routes/machineProgress"));
app.use('/', require('./routes/materialPalletizing'));
app.use('/', require('./routes/wareHouseEntry.js'));
app.use('/', require('./routes/wareHouseOntry.js'));
app.use('/', require('./routes/productRepair.js'));
app.use('/', require('./routes/uploadMesFile.js'));
app.use('/', require('./routes/dashboard.js'));
app.use('/', require('./routes/inspectionImageUpload.js'));
app.use('/', require('./routes/barcodeRule.js'));
// 装箱条码原子操作路由
app.use('/', require('./routes/packBarcodeAtomic'));

// require("./routes/upload")
// require("./routes/fixFunction")
// require("./utils/scheduleTask")

// 更新工艺编码
// require("./routes/caftNum")
// 初始化定时任务
// const initSchedule = require("./config/schedule");
// 初始化定时任务
// initSchedule();

// require("./services/createMappings");
//方法
// require("./routes/productLog")

//微信登陆

// catch 404 and forward to error handler  404 文件的处理
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler 错误的处理
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// 注册路由
app.use(systemLogRoutes);
app.use(queueMonitorRoutes);

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('🛑 收到SIGTERM信号，开始优雅关闭...');
  try {
    await QueueService.shutdown();
    console.log('✅ 队列服务已关闭');
  } catch (error) {
    console.error('❌ 关闭队列服务失败:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 收到SIGINT信号，开始优雅关闭...');
  try {
    await QueueService.shutdown();
    console.log('✅ 队列服务已关闭');
  } catch (error) {
    console.error('❌ 关闭队列服务失败:', error);
  }
  process.exit(0);
});

module.exports = app;
