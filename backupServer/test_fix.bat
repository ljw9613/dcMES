@echo off
echo 测试修复后的配置显示功能...
echo.

echo 1. 运行快速测试...
node quick_test.js
echo.

echo 2. 运行配置命令...
node incremental_backup_manager.js --config
echo.

echo 3. 重新运行测试脚本...
node test_incremental_backup.js
echo.

pause 