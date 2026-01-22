@echo off
rem 设置命令行代码页为UTF-8
chcp 65001 >nul

echo 正在查看所有服务状态...
echo.

call pm2 status

echo.
echo 查看服务性能监控命令:
echo pm2 monit
echo.
echo 日志文件位置:
echo - 错误日志: .\logs\pm2\error\
echo - 输出日志: .\logs\pm2\out\
echo.

echo 按任意键退出...
pause >nul 