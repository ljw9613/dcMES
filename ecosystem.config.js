/**
 * PM2 配置文件 - dcMes 服务器
 * 用于负载均衡和进程管理
 * 
 * 使用方法:
 * - 启动: pm2 start ecosystem.config.js
 * - 重启: pm2 reload dcmes-server
 * - 停止: pm2 stop dcmes-server
 * - 监控: pm2 monit
 * - 日志: pm2 logs dcmes-server
 */

module.exports = {
  apps: [
    {
      // 应用名称
      name: 'dcmes-server',
      
      // 启动脚本（根据实际情况修改）
      script: './dcMes_server/server.js',
      
      // 集群模式 - 充分利用多核CPU
      instances: 'max', // 'max' 表示使用所有CPU核心，也可以指定数字如 4
      exec_mode: 'cluster',
      
      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        PLAN_SERVER_HOST: 'localhost',
        PLAN_SERVER_PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        PLAN_SERVER_HOST: 'localhost',
        PLAN_SERVER_PORT: 3001
      },
      
      // 性能优化配置
      max_memory_restart: '1G',        // 内存达到1G时自动重启
      node_args: '--max-old-space-size=2048', // Node.js 最大堆内存2GB
      
      // 日志配置
      error_file: './logs/pm2-dcmes-server-error.log',
      out_file: './logs/pm2-dcmes-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,              // 合并集群日志
      log_type: 'json',              // JSON 格式日志（便于分析）
      
      // 进程管理配置
      autorestart: true,             // 自动重启
      watch: false,                  // 生产环境不建议开启文件监控
      max_restarts: 10,              // 10次重启后停止
      min_uptime: '10s',             // 最小运行时间10秒
      restart_delay: 4000,           // 重启延迟4秒
      
      // 监控和健康检查
      listen_timeout: 10000,         // 应用启动超时时间
      kill_timeout: 5000,            // 强制关闭前的超时时间
      
      // 优雅关闭
      shutdown_with_message: true,
      
      // 实例间的负载均衡策略
      instance_var: 'INSTANCE_ID',
      
      // Cron 重启（可选，凌晨重启）
      // cron_restart: '0 0 * * *',
      
      // 忽略的监控目录
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        '*.log'
      ],
      
      // 时间显示
      time: true
    },
    
    {
      // 工单处理服务 - 单实例运行避免并发问题
      name: 'dcmes-plan-server',
      
      // 启动脚本
      script: './dcMes_plan_server/server.js',
      
      // 单实例模式 - 避免PM2负载均衡导致的并发问题
      instances: 1,
      exec_mode: 'fork', // 使用fork模式，不使用cluster
      
      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        MONGODB_URI: 'mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_DB: 2
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        MONGODB_URI: 'mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_DB: 2
      },
      
      // 性能优化配置
      max_memory_restart: '512M',      // 单实例服务，内存设置小一些
      node_args: '--max-old-space-size=1024',
      
      // 日志配置
      error_file: './logs/pm2-plan-server-error.log',
      out_file: './logs/pm2-plan-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 进程管理配置
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // 监控和健康检查
      listen_timeout: 15000,           // 工单服务需要初始化队列，超时时间长一点
      kill_timeout: 10000,             // 优雅关闭需要处理完队列任务
      
      // 优雅关闭
      shutdown_with_message: true,
      
      // 忽略的监控目录
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        '*.log'
      ],
      
      // 时间显示
      time: true
    }
  ]
};

/**
 * 部署建议:
 * 
 * 1. 开发环境:
 *    pm2 start ecosystem.config.js
 * 
 * 2. 生产环境:
 *    pm2 start ecosystem.config.js --env production
 * 
 * 3. 监控命令:
 *    pm2 monit          # 实时监控
 *    pm2 status         # 查看状态
 *    pm2 logs           # 查看日志
 *    pm2 describe dcmes-server  # 详细信息
 * 
 * 4. 维护命令:
 *    pm2 reload dcmes-server    # 0秒停机重启
 *    pm2 restart dcmes-server   # 重启
 *    pm2 stop dcmes-server      # 停止
 *    pm2 delete dcmes-server    # 删除
 * 
 * 5. 开机自启动:
 *    pm2 startup
 *    pm2 save
 * 
 * 6. 性能调优建议:
 *    - instances: 建议设置为 CPU 核心数
 *    - max_memory_restart: 根据服务器内存调整（建议 1G-2G）
 *    - 数据库连接池: maxPoolSize 建议设置为 实例数 * 10
 * 
 * 7. 负载均衡:
 *    PM2 自动实现轮询（round-robin）负载均衡
 *    如需更高级的负载均衡，建议在前端加 Nginx
 */
