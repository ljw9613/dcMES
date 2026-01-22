@echo off
echo 正在重启dcMes服务...

REM 确保日志目录存在
if not exist ".\logs\pm2" mkdir ".\logs\pm2"

REM 停止现有应用（如果存在）
call pm2 stop dcMes-server >nul 2>&1
if %ERRORLEVEL% neq 0 echo 没有找到运行中的服务，将创建新实例

REM 删除现有应用（如果存在）
call pm2 delete dcMes-server >nul 2>&1

REM 使用配置文件启动应用
call pm2 start ecosystem.config.js --env production

REM 保存PM2配置，以便在系统重启时自动恢复
call pm2 save

REM 显示应用状态
call pm2 status

echo dcMes服务已重启
pause 