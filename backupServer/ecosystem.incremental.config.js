/**
 * PM2 增量备份管理器配置文件
 * 
 * 使用方法:
 * pm2 start ecosystem.incremental.config.js
 * pm2 stop incremental-backup
 * pm2 restart incremental-backup
 * pm2 logs incremental-backup
 * 
 * @Author: 系统管理员
 * @Date: 2024
 */

module.exports = {
  apps: [
    {
      // 主增量备份服务
      name: 'incremental-backup',
      script: './incremental_backup_manager.js',
      args: '--start',
      cwd: './backupServer',
      instances: 1,
      exec_mode: 'fork',
      
      // 自动重启配置
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        INCREMENTAL_BACKUP_PATH: 'D:/incrementalBackups',
        BACKUP_SCHEDULE_MODE: 'auto',
        TZ: 'Asia/Shanghai'
      },
      
      // 日志配置
      log_file: './logs/incremental-backup-combined.log',
      out_file: './logs/incremental-backup-out.log',
      error_file: './logs/incremental-backup-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 进程控制
      min_uptime: '10s',
      max_restarts: 10,
      
      // 资源限制
      kill_timeout: 30000,
      listen_timeout: 8000,
      
      // cron重启（每天凌晨4点重启一次，确保服务稳定）
      cron_restart: '0 4 * * *'
    },
    
    // 备份监控服务（可选）
    {
      name: 'backup-monitor',
      script: './incremental_backup_manager.js',
      args: '--monitor',
      cwd: './backupServer',
      instances: 1,
      exec_mode: 'fork',
      
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      
      env: {
        NODE_ENV: 'production',
        MONITOR_MODE: 'true',
        CHECK_INTERVAL: '300000' // 5分钟检查一次
      },
      
      log_file: './logs/backup-monitor-combined.log',
      out_file: './logs/backup-monitor-out.log', 
      error_file: './logs/backup-monitor-error.log',
      
      // 监控服务不需要太频繁重启
      min_uptime: '30s',
      max_restarts: 5
    }
  ]
}; 