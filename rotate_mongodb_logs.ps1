# MongoDB 日志轮转脚本（支持 Windows、auth 模式）
# 保存为 rotate_mongodb_logs.ps1，设置定时任务即可每天自动执行

# === 用户配置项 ===
$mongoBin = "D:\BtSoft\mongodb\bin\mongo.exe"   # mongo.exe 路径（确保正确）
$mongoHost = "127.0.0.1"   # 修改为 mongoHost 以避免与系统保留变量冲突
$port = 27017
$username = "yourAdminUser"     # ✅ 请替换为你的管理员账号
$password = "yourPassword"      # ✅ 请替换为密码
$authDB = "admin"
$logDir = "D:\BtSoft\mongodb\logs"
$logBase = "mongodb"
$retentionDays = 15

# === 构建连接字符串，避免 $mongoHost:$port 报错 ===
$mongoTarget = "${mongoHost}:${port}/${authDB}"

# === Step 1: 执行 logRotate 命令 ===
Write-Host "`n[1] 发送 logRotate 命令..."
$rotateCommand = "`"db.runCommand({ logRotate: 1 })`""
$logRotateResult = & "$mongoBin" $mongoTarget -u $username -p $password --eval $rotateCommand

# 判断是否成功
if ($logRotateResult -match '"ok" : 1') {
    Write-Host "✅ 日志轮转命令成功。"
} else {
    Write-Host "❌ 日志轮转失败，请检查用户名、密码、数据库名或 mongo.exe 路径是否正确。"
    exit 1
}

# === Step 2: 检查是否生成新日志文件 ===
Write-Host "`n[2] 检查是否生成新日志文件..."
$rotatedFiles = Get-ChildItem -Path $logDir -Filter "$logBase.log.*" | Sort-Object LastWriteTime -Descending

if ($rotatedFiles.Count -eq 0) {
    Write-Host "⚠ 未发现任何新生成的日志文件，可能是 mongod.cfg 未启用 logappend=true"
} else {
    Write-Host "✅ 找到已拆分的日志文件："
    $rotatedFiles | Select-Object Name, LastWriteTime | Format-Table
}

# === Step 3: 删除超过指定天数的旧日志 ===
Write-Host "`n[3] 删除超过 $retentionDays 天的日志文件..."
$expiredLogs = Get-ChildItem -Path $logDir -Filter "$logBase.log.*" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$retentionDays) }

if ($expiredLogs.Count -eq 0) {
    Write-Host "✅ 没有需要删除的过期日志。"
} else {
    foreach ($log in $expiredLogs) {
        Write-Host "🗑 删除 $($log.Name)"
        Remove-Item $log.FullName -Force
    }
}

Write-Host "`n🎉 MongoDB 日志轮转完成！"
