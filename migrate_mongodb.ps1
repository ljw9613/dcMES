# MongoDB数据库迁移脚本 - PowerShell版本 (Windows)
#
# 功能特性：
# - 从源服务器完整导出数据库
# - 支持压缩以节省传输时间
# - 直接传输到目标服务器并导入
# - 详细的进度显示和日志记录
#
# 使用方法：
# .\migrate_mongodb.ps1 -SourceUri "mongodb://user:pass@source-host:27017/db" -TargetUri "mongodb://user:pass@target-host:27017/db"
#
# 参数说明：
# -SourceUri: 源数据库连接字符串
# -TargetUri: 目标数据库连接字符串
# -Database: 数据库名称（可选）
# -Compress: 是否压缩（默认：$true）
# -DropTarget: 是否删除目标数据库现有数据（默认：$false）
# -TempDir: 临时文件目录（默认：./mongodb_migration_temp）
# -KeepTemp: 是否保留临时文件（默认：$false）

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceUri,
    
    [Parameter(Mandatory=$true)]
    [string]$TargetUri,
    
    [string]$Database = "",
    [string[]]$ExcludeCollections = @(),
    [bool]$Compress = $true,
    [bool]$DropTarget = $false,
    [string]$TempDir = "./mongodb_migration_temp",
    [bool]$KeepTemp = $false
)

# 错误处理
$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

# 日志记录
function Write-Log {
    param(
        [string]$Message,
        [string]$LogDir = "./migration_logs"
    )
    
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logFile = Join-Path $LogDir "migration_$(Get-Date -Format 'yyyy-MM-dd').log"
    $logMessage = "[$timestamp] $Message"
    
    Add-Content -Path $LogFile -Value $logMessage
    Write-Info $Message
}

# 检查命令是否存在
function Test-Command {
    param([string]$Command)
    
    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# 执行命令
function Invoke-CommandWithProgress {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Log "🔄 $Description..."
    Write-Log "   执行命令: $($Command -replace ':[^:@]+@', ':****@')"
    
    try {
        $process = Start-Process -FilePath "powershell" -ArgumentList "-Command", $Command -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$TempDir\stdout.log" -RedirectStandardError "$TempDir\stderr.log"
        
        if ($process.ExitCode -eq 0) {
            Write-Success "$Description 完成"
            return $true
        } else {
            $errorContent = Get-Content "$TempDir\stderr.log" -ErrorAction SilentlyContinue
            throw "命令执行失败，退出码: $($process.ExitCode). 错误: $errorContent"
        }
    } catch {
        Write-Error "$Description 失败: $_"
        throw
    }
}

# 主函数
function Start-Migration {
    $startTime = Get-Date
    
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "🚀 MongoDB数据库迁移工具 (PowerShell版本)" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
      Write-Host "📤 源数据库: $($SourceUri -replace ':[^:@]+@', ':****@')"
      Write-Host "📥 目标数据库: $($TargetUri -replace ':[^:@]+@', ':****@')"
      if ($Database) {
        Write-Host "📦 数据库名称: $Database"
      }
      Write-Host "🗜️  压缩: $(if ($Compress) { '是' } else { '否' })"
      Write-Host "🗑️  删除目标数据: $(if ($DropTarget) { '是' } else { '否' })"
      if ($ExcludeCollections -and $ExcludeCollections.Count -gt 0) {
        Write-Host "⏭️  跳过集合: $($ExcludeCollections -join ', ')"
      }
      Write-Host ("=" * 60) -ForegroundColor Cyan
      Write-Host ""
    
    # 确认操作
    if ($DropTarget) {
        $confirm = Read-Host "⚠️  警告: 将删除目标数据库的现有数据！是否继续？(y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Log "❌ 用户取消操作"
            return
        }
    }
    
    # 检查必要工具
    Write-Log "🔍 检查必要工具..."
    if (-not (Test-Command "mongodump")) {
        Write-Error "mongodump 命令未找到，请安装 MongoDB Database Tools"
        Write-Info "下载地址: https://www.mongodb.com/try/download/database-tools"
        exit 1
    }
    if (-not (Test-Command "mongorestore")) {
        Write-Error "mongorestore 命令未找到，请安装 MongoDB Database Tools"
        Write-Info "下载地址: https://www.mongodb.com/try/download/database-tools"
        exit 1
    }
    Write-Success "工具检查通过"
    
    # 创建临时目录
    if (-not (Test-Path $TempDir)) {
        New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    }
    
    try {
        # 步骤1: 导出数据库
        Write-Log "📤 开始从源服务器导出数据库..."
        $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $dumpPath = Join-Path $TempDir "dump_$timestamp"
        
        $dumpCommand = "mongodump --uri `"$SourceUri`""
        if ($Database) {
          $dumpCommand += " --db $Database"
        }
        if ($ExcludeCollections -and $ExcludeCollections.Count -gt 0) {
          foreach ($collection in $ExcludeCollections) {
            $dumpCommand += " --excludeCollection $collection"
          }
          Write-Log "   跳过集合: $($ExcludeCollections -join ', ')"
        }
        $dumpCommand += " --out `"$dumpPath`""
        if ($Compress) {
          $dumpCommand += " --gzip"
        }
        
        Invoke-CommandWithProgress $dumpCommand "导出数据库"
        Write-Success "数据库导出成功"
        
        # 步骤2: 导入数据库
        Write-Log "📥 开始导入数据库到目标服务器..."
        
        $restoreCommand = "mongorestore --uri `"$TargetUri`""
        if ($DropTarget) {
          $restoreCommand += " --drop"
        }
        if ($ExcludeCollections -and $ExcludeCollections.Count -gt 0) {
          foreach ($collection in $ExcludeCollections) {
            $restoreCommand += " --excludeCollection $collection"
          }
          Write-Log "   跳过集合: $($ExcludeCollections -join ', ')"
        }
        $restoreCommand += " `"$dumpPath`""
        
        Invoke-CommandWithProgress $restoreCommand "导入数据库"
        Write-Success "数据库导入成功"
        
        Write-Success "🎉 数据库迁移成功完成！"
        
    } catch {
        Write-Error "迁移过程中发生错误: $_"
        exit 1
    } finally {
        # 清理临时文件
        if (-not $KeepTemp) {
            Write-Log "🧹 清理临时文件..."
            if (Test-Path $TempDir) {
                Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
                Write-Success "临时文件清理完成"
            }
        } else {
            Write-Log "ℹ️  保留临时文件（根据配置）"
        }
        
        # 显示摘要
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        Write-Host ""
        Write-Host ("=" * 60) -ForegroundColor Cyan
        Write-Success "数据库迁移完成！"
        Write-Host ("=" * 60) -ForegroundColor Cyan
        Write-Host "⏱️  总耗时: $([math]::Round($duration, 2)) 秒"
        Write-Host "📁 临时文件目录: $TempDir"
        Write-Host "📝 日志目录: ./migration_logs"
        if ($KeepTemp) {
            Write-Host "ℹ️  临时文件已保留"
        }
        Write-Host ("=" * 60) -ForegroundColor Cyan
        Write-Host ""
    }
}

# 执行迁移
Start-Migration
