# 获取正在运行的 Node 进程列表
$nodeProcesses = tasklist /FI "IMAGENAME eq node.exe" | Select-String -Pattern "node.exe"

# 获取 PM2 管理的进程列表
$pm2Processes = pm2 list --json | ConvertFrom-Json
$pm2Pids = $pm2Processes | ForEach-Object { $_.pid }

# 对比进程，找到不在 PM2 管理的 Node 进程
foreach ($process in $nodeProcesses) {
    # 获取进程 PID
    $pid = ($process -split "\s+")[1]
    
    # 如果 PID 不在 PM2 管理的进程列表中，标出
    if ($pm2Pids -notcontains $pid) {
        Write-Host "未在 PM2 管理的进程: PID = $pid"
    }
}

# 如果需要结束这些进程，可以取消下行的注释来杀掉它们
# foreach ($process in $nodeProcesses) {
#     $pid = ($process -split "\s+")[1]
#     taskkill /PID $pid /F
#     Write-Host "已结束进程: PID = $pid"
# }
