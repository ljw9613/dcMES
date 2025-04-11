@echo off
rem 设置命令行代码页为UTF-8
chcp 65001 >nul

echo 正在重启系统服务(dcMes-server-system)...
echo.

rem 重启系统服务
call pm2 restart dcMes-server-system

echo.
echo 系统服务已重启完成！
echo 可以使用以下命令查看服务状态:
echo - ver-system.bat (查看系统服务状态)
echo - ver-all.bat (查看所有服务状态)
echo.

echo 按任意键退出...
pause >nul 