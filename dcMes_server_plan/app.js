/**
 * dcMes工单处理服务 - Express应用
 * 专门处理工单投入产出等任务，避免PM2负载均衡导致的并发问题
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const createError = require('http-errors');

// 创建Express应用
const app = express();

// 信任代理
app.set('trust proxy', true);

// 安全中间件
app.use(helmet());

// CORS跨域
app.use(cors());

// 请求体解析
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 压缩响应
app.use(compression());

// 日志中间件
app.use(morgan('combined'));

// 请求日志
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`, {
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

// 挂载工单路由
const workOrderRouter = require('./routes/workOrder');
app.use('/', workOrderRouter);

// 首页
app.get('/', (req, res) => {
  res.json({
    service: 'dcMes工单处理服务',
    version: '1.0.0',
    status: 'running',
    description: '专门处理工单投入产出等任务，避免PM2负载均衡导致的并发问题',
    endpoints: {
      health: 'GET /health',
      updateQuantity: 'POST /api/workorder/update-quantity',
      batchUpdate: 'POST /api/workorder/batch-update-quantity',
      workOrderDetail: 'GET /api/workorder/detail/:id',
      quantityLogs: 'GET /api/workorder/quantity-logs/:id',
      queueStats: 'GET /api/workorder/queue/stats',
      lockStats: 'GET /api/workorder/queue/locks',
      cleanQueue: 'POST /api/workorder/queue/clean',
      pauseQueue: 'POST /api/workorder/queue/pause',
      resumeQueue: 'POST /api/workorder/queue/resume',
      cleanLocks: 'POST /api/workorder/queue/clean-locks'
    },
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use(function(req, res, next) {
  next(createError(404));
});

// 错误处理
app.use(function(err, req, res, next) {
  // 设置locals，仅在开发环境提供错误详情
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

  // 返回错误响应
  res.status(err.status || 500);
  res.json({
    success: false,
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;

