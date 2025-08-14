@echo off
REM MongoDB数据库备份脚本 - Windows + PM2 启动器
REM 
REM 用法：
REM   backup_mongodb.bat start           使用 PM2 以定时模式启动（默认每天2点）
REM   backup_mongodb.bat start --cron "0 30 1 * * *"  指定自定义 Cron
REM   backup_mongodb.bat once            立即执行一次并退出（不常驻）
REM   backup_mongodb.bat stop            停止 PM2 中的备份进程
REM   backup_mongodb.bat logs            查看备份进程日志
REM   backup_mongodb.bat status          查看 PM2 进程状态

SETLOCAL ENABLEDELAYEDEXPANSION

SET APP_NAME=dcMes-backup-scheduler
SET SCRIPT_PATH=%~dp0backup_mongodb.js
SET BACKUP_ECOSYSTEM=%~dp0ecosystem.backup.config.js

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 检查 Node.js
node --version >nul 2>&1
IF %errorlevel% NEQ 0 (
  echo 错误: 未找到Node.js，请先安装 Node.js https://nodejs.org/
  exit /b 1
)

REM 检查 pm2
pm2 -v >nul 2>&1
IF %errorlevel% NEQ 0 (
  echo 未检测到 PM2，正在全局安装...
  call npm i -g pm2
  IF %errorlevel% NEQ 0 (
    echo 错误: 安装 PM2 失败，请手动执行: npm i -g pm2
    exit /b 1
  )
)

REM 解析子命令
SET CMD=%1
IF "%CMD%"=="" SET CMD=start

IF /I "%CMD%"=="start" GOTO :START
IF /I "%CMD%"=="once" GOTO :ONCE
IF /I "%CMD%"=="stop" GOTO :STOP
IF /I "%CMD%"=="logs" GOTO :LOGS
IF /I "%CMD%"=="status" GOTO :STATUS
GOTO :HELP

:START
REM 组装附加参数（支持 --cron 等）
SET EXTRA_ARGS=
SHIFT
:ARGS_LOOP
IF "%1"=="" GOTO :DO_START
SET EXTRA_ARGS=!EXTRA_ARGS! %1
SHIFT
GOTO :ARGS_LOOP

:DO_START
REM 默认以 --schedule 启动，优先使用独立 PM2 配置文件
IF EXIST "%BACKUP_ECOSYSTEM%" (
  pm2 start "%BACKUP_ECOSYSTEM%"
) ELSE (
  pm2 start "%SCRIPT_PATH%" --name %APP_NAME% -- %EXTRA_ARGS% --schedule
)
IF %errorlevel% NEQ 0 (
  echo 启动失败
  exit /b 1
)
pm2 save
pm2 status %APP_NAME%
GOTO :EOF

:ONCE
node "%SCRIPT_PATH%" --once
GOTO :EOF

:STOP
pm2 stop %APP_NAME%
pm2 delete %APP_NAME%
GOTO :EOF

:LOGS
pm2 logs %APP_NAME%
GOTO :EOF

:STATUS
pm2 status %APP_NAME%
GOTO :EOF

:HELP
ECHO 用法:
ECHO   %~n0 start [--cron "0 0 2 * * *"]  以 PM2 定时模式启动(默认每天2点)
ECHO   %~n0 once                           立即执行一次
ECHO   %~n0 stop                           停止并删除 PM2 进程
ECHO   %~n0 logs                           查看日志
ECHO   %~n0 status                         查看状态

ENDLOCAL
exit /b 0 