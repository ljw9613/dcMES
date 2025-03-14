@echo off
echo 正在启动德昌MES服务系统...

REM 设置编码为UTF-8
chcp 65001 >nul

REM 确保日志目录存在
if not exist ".\logs\pm2" mkdir ".\logs\pm2"

REM 检查PM2是否已安装
where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 错误: 未安装PM2！
    echo 请先运行: npm install pm2 -g
    pause
    exit /b 1
)

REM 停止所有现有应用（如果存在）
echo 停止现有服务实例...
call pm2 stop dcMes-server-sc >nul 2>&1
call pm2 stop dcMes-server-ws >nul 2>&1
call pm2 stop dcMes-server-system >nul 2>&1

REM 删除所有现有应用（如果存在）
echo 删除现有服务实例...
call pm2 delete dcMes-server-sc >nul 2>&1
call pm2 delete dcMes-server-ws >nul 2>&1
call pm2 delete dcMes-server-system >nul 2>&1

REM 使用JSON配置文件启动所有应用
echo 正在使用配置文件启动所有服务...
call pm2 start ecosystem.json --env production

REM 保存PM2配置，以便在系统重启时自动恢复
call pm2 save

REM 显示应用状态
call pm2 status

echo.
echo 德昌MES服务系统已成功启动！
echo ================================================
echo 主服务：       dcMes-server-sc （负载均衡模式，10个进程）
echo WebSocket服务：dcMes-server-ws
echo 系统服务：     dcMes-server-system
echo ================================================
echo 可以使用以下命令查看各服务日志：
echo - pm2 logs dcMes-server-sc
echo - pm2 logs dcMes-server-ws
echo - pm2 logs dcMes-server-system
echo ================================================
echo 使用 pm2 monit 命令可以查看集群状态和性能监控
echo ================================================
echo.

pause 