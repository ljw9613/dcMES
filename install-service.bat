@echo off
rem 设置命令行代码页为UTF-8
chcp 65001 >nul

echo 正在将PM2服务注册为Windows系统服务...
echo 这将确保系统启动时自动启动PM2服务。
echo.

rem 检查是否有管理员权限
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 此脚本需要管理员权限来安装服务！
    echo 请右键点击此批处理文件并选择"以管理员身份运行"。
    pause
    exit /b 1
)

rem 检查PM2是否已安装
where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未安装PM2！
    echo 请先运行: npm install pm2 -g
    pause
    exit /b 1
)

echo [步骤1] 启动所有服务...
call .\start_pm2.bat

echo [步骤2] 将当前PM2配置保存为启动配置...
call pm2 save

echo [步骤3] 安装PM2启动服务...
call pm2 startup
echo.
echo 请复制并执行上面生成的命令来完成服务安装。
echo 安装完成后，每次系统启动都会自动运行PM2服务。
echo.

echo 按任意键退出...
pause >nul 