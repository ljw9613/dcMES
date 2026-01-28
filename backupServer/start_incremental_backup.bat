@echo off
rem 增量备份管理器启动脚本
rem 
rem 使用方法:
rem   start_incremental_backup.bat start    - 启动定时备份服务
rem   start_incremental_backup.bat once     - 执行一次备份
rem   start_incremental_backup.bat status   - 查看状态
rem   start_incremental_backup.bat stop     - 停止服务
rem
rem @Author: 系统管理员
rem @Date: 2024

setlocal enabledelayedexpansion

cd /d %~dp0

set "ACTION=%1"
if "%ACTION%"=="" set "ACTION=start"

echo ==========================================
echo 增量备份管理器控制脚本
echo 当前操作: %ACTION%
echo 时间: %date% %time%
echo ==========================================

if "%ACTION%"=="start" goto :start_service
if "%ACTION%"=="once" goto :run_once
if "%ACTION%"=="status" goto :show_status  
if "%ACTION%"=="stop" goto :stop_service
if "%ACTION%"=="config" goto :show_config
if "%ACTION%"=="help" goto :show_help

:show_help
echo 用法: %0 [start^|once^|status^|stop^|config^|help]
echo.
echo   start  - 启动定时备份服务（使用PM2管理）
echo   once   - 立即执行一次性备份
echo   status - 查看服务运行状态
echo   stop   - 停止备份服务
echo   config - 显示配置信息
echo   help   - 显示此帮助信息
echo.
goto :end

:start_service
echo 正在启动增量备份服务...

rem 检查PM2是否已安装
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo 错误: PM2未安装，正在尝试安装...
    npm install -g pm2
    if errorlevel 1 (
        echo PM2安装失败，尝试直接运行备份管理器...
        node incremental_backup_manager.js --start
        goto :end
    )
)

rem 检查node-schedule依赖
npm list node-schedule >nul 2>&1
if errorlevel 1 (
    echo 正在安装依赖 node-schedule...
    npm install node-schedule
)

rem 停止可能已运行的服务
pm2 stop incremental-backup >nul 2>&1

rem 启动服务
echo 使用PM2启动增量备份服务...
pm2 start ecosystem.incremental.config.js

if errorlevel 1 (
    echo PM2启动失败，尝试直接运行...
    node incremental_backup_manager.js --start
) else (
    echo 服务启动成功！
    echo 使用以下命令管理服务:
    echo   pm2 logs incremental-backup  - 查看日志
    echo   pm2 stop incremental-backup  - 停止服务
    echo   pm2 restart incremental-backup - 重启服务
    echo   pm2 monit                    - 监控界面
)
goto :end

:run_once
echo 正在执行一次性备份...
node incremental_backup_manager.js --once
echo 一次性备份完成！
goto :end

:show_status
echo 正在查看服务状态...

rem 尝试使用PM2查看状态
pm2 list incremental-backup >nul 2>&1
if not errorlevel 1 (
    pm2 list incremental-backup
    echo.
    echo 最新日志:
    pm2 logs incremental-backup --lines 10
) else (
    echo PM2服务未运行，查看备份状态...
    node incremental_backup_manager.js --status
)
goto :end

:show_config
echo 正在显示配置信息...
node incremental_backup_manager.js --config
goto :end

:stop_service
echo 正在停止增量备份服务...

rem 停止PM2服务
pm2 stop incremental-backup >nul 2>&1
pm2 delete incremental-backup >nul 2>&1

echo 服务已停止！
goto :end

:end
echo ==========================================
echo 操作完成
echo ==========================================
pause 