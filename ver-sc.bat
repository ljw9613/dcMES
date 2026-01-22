@echo off
rem 设置命令行代码页为UTF-8
chcp 65001 >nul

echo 正在查看主服务状态...
echo.

call pm2 describe dcMes-server-sc

echo.
echo 查看主服务日志:
echo pm2 logs dcMes-server-sc
echo.
echo 日志文件位置:
echo - 错误日志: .\logs\pm2\error\dcMes-server-err-YYYY-MM-DD.log
echo - 输出日志: .\logs\pm2\out\dcMes-server-out-YYYY-MM-DD.log
echo.

echo 按任意键退出...
pause >nul 