@echo off
REM MongoDB数据库备份脚本 - Windows版本
REM 
REM 使用说明：
REM 1. 确保已安装Node.js
REM 2. 确保已安装MongoDB数据库工具(MongoDB Database Tools)
REM 3. 双击运行此脚本或在命令行中执行
REM 
REM 环境变量配置（可选）：
REM set BACKUP_PATH=D:\mongodb_backups
REM set KEEP_DAYS=7
REM set COMPRESS=true

echo ============================================================
echo MongoDB数据库备份脚本启动中...
echo ============================================================

REM 设置脚本所在目录为当前目录
cd /d "%~dp0"

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查mongodump是否可用
mongodump --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到mongodump命令，请安装MongoDB数据库工具
    echo 下载地址: https://www.mongodb.com/try/download/database-tools
    echo.
    echo 安装步骤：
    echo 1. 下载MongoDB Database Tools
    echo 2. 解压到任意目录（如：C:\mongodb-tools）
    echo 3. 将bin目录添加到系统PATH环境变量中
    echo    例如：C:\mongodb-tools\bin
    echo 4. 重新打开命令提示符测试：mongodump --version
    pause
    exit /b 1
)

REM 设置备份相关环境变量（如果未设置）
if not defined BACKUP_PATH (
    set BACKUP_PATH=.\backups
)

if not defined KEEP_DAYS (
    set KEEP_DAYS=7
)

if not defined COMPRESS (
    set COMPRESS=true
)

echo 配置信息:
echo - 备份路径: %BACKUP_PATH%
echo - 保留天数: %KEEP_DAYS%
echo - 启用压缩: %COMPRESS%
echo.

REM 执行备份脚本
echo 开始执行数据库备份...
node backup_mongodb.js

REM 检查执行结果
if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo ✅ 备份任务执行完成
    echo ============================================================
    echo.
    echo 备份文件位置: %BACKUP_PATH%
    echo.
    echo 您可以查看以下文件：
    echo - 备份文件: %BACKUP_PATH%\dcMes_backup_*.gz
    echo - 日志文件: %BACKUP_PATH%\backup.log
    echo.
) else (
    echo.
    echo ============================================================
    echo ❌ 备份任务执行失败
    echo ============================================================
    echo.
    echo 请检查错误信息并重试
    echo 详细错误日志请查看: %BACKUP_PATH%\backup.log
    echo.
)

REM 询问是否打开备份目录
set /p choice="是否打开备份目录查看结果？(Y/N): "
if /i "%choice%"=="Y" (
    if exist "%BACKUP_PATH%" (
        explorer "%BACKUP_PATH%"
    ) else (
        echo 备份目录不存在: %BACKUP_PATH%
    )
)

REM 询问是否暂停
set /p choice2="按任意键退出，或输入P暂停查看详细信息: "
if /i "%choice2%"=="P" (
    pause
)

exit /b %errorlevel% 