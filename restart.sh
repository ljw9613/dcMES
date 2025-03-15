#!/bin/bash

# 确保日志目录存在
mkdir -p ./logs/pm2

# 停止现有应用（如果存在）
pm2 stop dcMes-server 2>/dev/null || true

# 删除现有应用（如果存在）
pm2 delete dcMes-server 2>/dev/null || true

# 使用配置文件启动应用
pm2 start ecosystem.config.js --env production

# 保存PM2配置，以便在系统重启时自动恢复
pm2 save

# 显示应用状态
pm2 status

echo "dcMes服务已重启" 