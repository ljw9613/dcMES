/**
 * PM2 生产环境配置（Windows 服务器）
 * 
 * 关键说明：
 * - instances 建议设置为服务器 CPU 逻辑核心数（Windows查询：wmic cpu get NumberOfLogicalProcessors）
 * - PM2_INSTANCES 必须与 instances 保持一致，用于 db.js 计算每实例的连接池大小
 * - 所有实例都注册队列消费者，Bull 通过 Redis 任务锁保证任务不重复处理
 * 
 * 部署命令（Windows PowerShell）：
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production   （零停机重启）
 *   pm2 save                                          （保存进程列表）
 * 
 * 开机自启（需先安装）：
 *   npm install -g pm2-windows-startup
 *   pm2-startup install
 */
module.exports = {
  apps: [
    {
      name: 'dcMes-server',
      script: './bin/www',
      // 建议设置为服务器 CPU 逻辑核心数，Windows 查询命令：
      // wmic cpu get NumberOfLogicalProcessors
      instances: 10,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      // kill_timeout 必须 > db.js gracefulShutdown 的兜底超时(5000ms)，留出余量设 8000ms
      // PM2 流程：发 SIGTERM → 等 kill_timeout → 若还活着则 SIGKILL
      // db.js 收到 SIGTERM 后会主动 mongoose.connection.close() 再 process.exit(0)
      kill_timeout: 8000,

      env_production: {
        NODE_ENV: 'production',
        // 必须与上面的 instances 保持一致，用于连接池大小计算
        PM2_INSTANCES: '10',

        // Redis 配置（如有修改请同步更新）
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        REDIS_DB: '2',
      },

      // 日志配置（Windows 路径，使用相对路径兼容性更好）
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      time: true,
    }
  ]
};
