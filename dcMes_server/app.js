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

//JWT令牌来验证HTTP请求
// app.use(expressJwt({
//   secret: config.secretOrPrivateKey//加密密钥，可换
// }).unless({
//   path: [ /sendMessage*/,/wxuser*/, /\/*/]//添加不需要token的接口
// }));
// //
// //校验token失败时的处理
// app.use(function (err, req, res, next) {
// 	console.log("headers:", req.url);
// 	if (req.url.indexOf("enclosure") > -1) {
// 		res.json({
// 			message: "找不到文件",
// 			code: 404,
// 			errer: err
// 		});
// 	}
// 	// console.log("err:", err);
// 	if (err.name === "UnauthorizedError") {
// 		//  这个需要根据自己的业务逻辑来处理（ 具体的err值 请看下面）
// 		console.error(req.path + ",无效token");
// 		res.json({
// 			message: "token过期，请重新登录",
// 			code: 400,
// 			errer: err
// 		});
// 	}
// });

// 添加静态文件服务
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

//挂载路由
// 设置 抽离出去的 路由文件的访问路径的前缀
// url 已 / 开头的，都会走到 indexRouter 中去。
// app.use("/", indexRouter);
// url 已  /users 开头的，都会走到 usersRouter 中去
app.use("/", require("./routes/upload"));
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

module.exports = app;
