#!/bin/bash

# 确保日志目录存在
mkdir -p ./logs/pm2/error
mkdir -p ./logs/pm2/out

# 停止现有应用（如果存在）
pm2 stop dcMes-server-sc 2>/dev/null || true
pm2 stop dcMes-server-ws 2>/dev/null || true
pm2 stop dcMes-server-system 2>/dev/null || true

# 删除现有应用（如果存在）
pm2 delete dcMes-server-sc 2>/dev/null || true
pm2 delete dcMes-server-ws 2>/dev/null || true
pm2 delete dcMes-server-system 2>/dev/null || true

# 使用配置文件启动所有应用
pm2 start ecosystem.json --env production

# 保存PM2配置，以便在系统重启时自动恢复
pm2 save

# 显示应用状态
pm2 status

echo "德昌MES服务系统已成功启动！"
echo "================================================"
echo "主服务：       dcMes-server-sc （负载均衡模式，10个进程）"
echo "WebSocket服务：dcMes-server-ws"
echo "系统服务：     dcMes-server-system"
echo "================================================"
echo "可以使用以下命令查看各服务日志："
echo "- pm2 logs dcMes-server-sc"
echo "- pm2 logs dcMes-server-ws"
echo "- pm2 logs dcMes-server-system"
echo "================================================"
echo "使用 pm2 monit 命令可以查看集群状态和性能监控"
echo "================================================" 