@echo off
rem 设置命令行代码页为UTF-8
chcp 65001 >nul

echo 正在重启WebSocket服务(dcMes-server-ws)...
echo.

rem 重启WebSocket服务
call pm2 restart dcMes-server-ws

echo.
echo WebSocket服务已重启完成！
echo 可以使用以下命令查看服务状态:
echo - ver-ws.bat (查看WebSocket服务状态)
echo - ver-all.bat (查看所有服务状态)
echo.

echo 按任意键退出...
pause >nul 