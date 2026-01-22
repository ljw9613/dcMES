@echo off
REM ===== Setting UTF-8 encoding =====
chcp 65001 >nul

echo Starting DCMES Service System...

REM ===== Ensure log directory exists =====
if not exist ".\logs\pm2" mkdir ".\logs\pm2"

REM ===== Check if PM2 is installed =====
where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: PM2 not installed!
    echo Please run: npm install pm2 -g
    pause
    exit /b 1
)

REM ===== Stop existing applications =====
echo Stopping existing service instances...
call pm2 stop dcMes-server-sc >nul 2>&1
call pm2 stop dcMes-server-ws >nul 2>&1
call pm2 stop dcMes-server-system >nul 2>&1

REM ===== Delete existing applications =====
echo Deleting existing service instances...
call pm2 delete dcMes-server-sc >nul 2>&1
call pm2 delete dcMes-server-ws >nul 2>&1
call pm2 delete dcMes-server-system >nul 2>&1

REM ===== Start all applications using JSON config =====
echo Starting all services using config file...
call pm2 start ecosystem.json --env production

REM ===== Save PM2 configuration for auto-recovery =====
call pm2 save

REM ===== Display application status =====
call pm2 status

echo.
echo DCMES Service System successfully started!
echo ================================================
echo Main Service:       dcMes-server-sc (Load balanced mode, 10 processes)
echo WebSocket Service:  dcMes-server-ws
echo System Service:     dcMes-server-system
echo ================================================
echo You can use these commands to view service logs:
echo - pm2 logs dcMes-server-sc
echo - pm2 logs dcMes-server-ws
echo - pm2 logs dcMes-server-system
echo ================================================
echo Use 'pm2 monit' to check cluster status and performance monitoring
echo ================================================
echo.

pause 