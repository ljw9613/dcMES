@echo off
REM ===== Setting UTF-8 encoding =====
chcp 65001 >nul

REM ===== Ensure proper encoding =====
echo Setting system to UTF-8 mode...

REM ===== Call the main script =====
echo Executing main service script...
call start_pm2.bat 