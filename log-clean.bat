@echo off
rem 设置命令行代码页为UTF-8
chcp 65001 >nul

echo 正在清理超过30天的旧日志文件...
echo.

rem 设置保留天数
set RETENTION_DAYS=30

rem 设置日志路径
set ERROR_LOG_PATH=.\logs\pm2\error
set OUT_LOG_PATH=.\logs\pm2\out

echo 清理错误日志目录: %ERROR_LOG_PATH%
forfiles /P "%ERROR_LOG_PATH%" /M "*.log" /D -%RETENTION_DAYS% /C "cmd /c del @path && echo 已删除: @file" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 成功删除超过%RETENTION_DAYS%天的错误日志文件
) else (
    echo 没有找到超过%RETENTION_DAYS%天的错误日志文件
)

echo.
echo 清理输出日志目录: %OUT_LOG_PATH%
forfiles /P "%OUT_LOG_PATH%" /M "*.log" /D -%RETENTION_DAYS% /C "cmd /c del @path && echo 已删除: @file" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 成功删除超过%RETENTION_DAYS%天的输出日志文件
) else (
    echo 没有找到超过%RETENTION_DAYS%天的输出日志文件
)

echo.
echo 日志清理完成！

echo 按任意键退出...
pause >nul 