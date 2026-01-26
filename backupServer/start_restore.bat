@echo off
chcp 65001 >nul
title 德昌MES备份还原管理器

:menu
cls
echo.
echo ========================================
echo   德昌MES MongoDB备份还原管理器
echo ========================================
echo.
echo 请选择操作:
echo.
echo [1] 📋 列出所有备份文件
echo [2] 🔄 交互式还原
echo [3] 📁 还原指定文件
echo [4] 📅 按日期还原
echo [5] 📦 按集合名还原
echo [6] ✅ 验证备份文件
echo [7] 🧪 运行示例演示
echo [8] ❓ 显示帮助信息
echo [9] 🚀 启动备份服务
echo [0] ❌ 退出
echo.
set /p choice=请输入选项 [0-9]: 

if "%choice%"=="1" goto list_backups
if "%choice%"=="2" goto interactive_restore
if "%choice%"=="3" goto restore_file
if "%choice%"=="4" goto restore_by_date
if "%choice%"=="5" goto restore_by_collection
if "%choice%"=="6" goto verify_backup
if "%choice%"=="7" goto run_example
if "%choice%"=="8" goto show_help
if "%choice%"=="9" goto start_backup
if "%choice%"=="0" goto exit
echo 无效选项，请重新选择...
timeout /t 2 >nul
goto menu

:list_backups
cls
echo 📋 列出所有备份文件...
echo ========================================
node restore_manager.js --list
echo.
pause
goto menu

:interactive_restore
cls
echo 🔄 启动交互式还原模式...
echo ========================================
node restore_manager.js --interactive
echo.
pause
goto menu

:restore_file
cls
echo 📁 还原指定备份文件
echo ========================================
echo.
set /p filepath=请输入备份文件路径: 
if "%filepath%"=="" (
    echo 错误: 请提供有效的文件路径
    pause
    goto menu
)
echo.
echo 正在还原文件: %filepath%
node restore_manager.js --restore --file="%filepath%"
echo.
pause
goto menu

:restore_by_date
cls
echo 📅 按日期还原备份
echo ========================================
echo.
echo 日期格式示例: 2024-01-15
set /p restore_date=请输入要还原的日期 (YYYY-MM-DD): 
if "%restore_date%"=="" (
    echo 错误: 请提供有效的日期
    pause
    goto menu
)
echo.
echo 正在还原日期: %restore_date%
node restore_manager.js --restore --date=%restore_date%
echo.
pause
goto menu

:restore_by_collection
cls
echo 📦 按集合名还原备份
echo ========================================
echo.
echo 常用集合名:
echo - warehouse_entries (仓库条目)
echo - material_palletizings (物料托盘化)
echo - material_process_flows (物料工艺流程)
echo - inspection_last_data (检测最新数据)
echo.
set /p collection_name=请输入集合名称: 
if "%collection_name%"=="" (
    echo 错误: 请提供有效的集合名称
    pause
    goto menu
)
echo.
echo 正在还原集合: %collection_name%
node restore_manager.js --restore --collection=%collection_name%
echo.
pause
goto menu

:verify_backup
cls
echo ✅ 验证备份文件
echo ========================================
echo.
set /p verify_file=请输入要验证的备份文件路径: 
if "%verify_file%"=="" (
    echo 错误: 请提供有效的文件路径
    pause
    goto menu
)
echo.
echo 正在验证文件: %verify_file%
node restore_manager.js --verify --file="%verify_file%"
echo.
pause
goto menu

:run_example
cls
echo 🧪 运行示例演示
echo ========================================
node restore_example.js
echo.
pause
goto menu

:show_help
cls
echo ❓ 帮助信息
echo ========================================
node restore_manager.js --help
echo.
echo ========================================
echo 其他有用命令:
echo.
echo npm run restore          - 交互式还原
echo npm run list-backups     - 列出备份文件
echo npm run example          - 运行示例
echo npm run backup           - 执行一次备份
echo npm run status           - 查看备份状态
echo npm run config           - 显示配置信息
echo.
pause
goto menu

:start_backup
cls
echo 🚀 启动备份服务
echo ========================================
echo.
echo 选择备份操作:
echo [1] 启动定时备份服务
echo [2] 执行一次性备份
echo [3] 查看备份状态
echo [4] 显示配置信息
echo [5] 返回主菜单
echo.
set /p backup_choice=请选择 [1-5]: 

if "%backup_choice%"=="1" (
    echo 启动定时备份服务...
    node incremental_backup_manager.js --start
) else if "%backup_choice%"=="2" (
    echo 执行一次性备份...
    node incremental_backup_manager.js --once
) else if "%backup_choice%"=="3" (
    echo 查看备份状态...
    node incremental_backup_manager.js --status
) else if "%backup_choice%"=="4" (
    echo 显示配置信息...
    node incremental_backup_manager.js --config
) else if "%backup_choice%"=="5" (
    goto menu
) else (
    echo 无效选项
)
echo.
pause
goto menu

:exit
cls
echo.
echo 感谢使用德昌MES备份还原管理器！
echo.
timeout /t 2 >nul
exit

:error
echo.
echo ❌ 发生错误，请检查:
echo 1. Node.js 是否已安装
echo 2. 依赖包是否已安装 (运行 npm install)
echo 3. MongoDB工具是否可用
echo 4. 配置文件是否正确
echo.
pause
goto menu 