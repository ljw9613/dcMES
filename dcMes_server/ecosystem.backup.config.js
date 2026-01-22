module.exports = {
	apps: [
		{
			name: 'dcMes-backup-scheduler',
			script: './backup_mongodb.js',
			args: '--schedule',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '512M',
			env: {
				NODE_ENV: 'production',
				SCHEDULE_CRON: '0 0 2 * * *',
				BACKUP_PATH: 'D:/mongobackups',
				KEEP_DAYS: '7',
				COMPRESS: 'true'
			},
			error_file: '../logs/pm2/error/backup-err-YYYY-MM-DD.log',
			out_file: '../logs/pm2/out/backup-out-YYYY-MM-DD.log',
			log_date_format: 'YYYY-MM-DD HH:mm:ss',
			merge_logs: true,
			time: true
		}
	]
}; 