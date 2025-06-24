#!/bin/bash

# MongoDB数据库备份脚本 - Linux/Mac版本
#
# 使用说明：
# 1. 确保已安装Node.js
# 2. 确保已安装MongoDB数据库工具(MongoDB Database Tools)
# 3. 给脚本执行权限：chmod +x backup_mongodb.sh
# 4. 运行脚本：./backup_mongodb.sh
#
# 环境变量配置（可选）：
# export BACKUP_PATH="/opt/mongodb_backups"
# export KEEP_DAYS=7
# export COMPRESS=true

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_separator() {
    echo "============================================================"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 命令未找到"
        return 1
    fi
    return 0
}

# 主函数
main() {
    print_separator
    print_info "MongoDB数据库备份脚本启动中..."
    print_separator
    echo

    # 切换到脚本所在目录
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR"

    # 检查Node.js是否安装
    print_info "检查Node.js环境..."
    if ! check_command node; then
        print_error "请先安装Node.js"
        print_info "Ubuntu/Debian: sudo apt-get install nodejs npm"
        print_info "CentOS/RHEL: sudo yum install nodejs npm"
        print_info "macOS: brew install node"
        print_info "或访问官网下载: https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node --version)
    print_success "Node.js版本: $NODE_VERSION"

    # 检查mongodump是否可用
    print_info "检查MongoDB工具..."
    if ! check_command mongodump; then
        print_error "请先安装MongoDB数据库工具"
        echo
        print_info "安装方法："
        print_info "Ubuntu/Debian:"
        print_info "  wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -"
        print_info "  sudo apt-get install mongodb-database-tools"
        echo
        print_info "CentOS/RHEL:"
        print_info "  sudo yum install mongodb-database-tools"
        echo
        print_info "macOS:"
        print_info "  brew install mongodb/brew/mongodb-database-tools"
        echo
        print_info "或访问官网下载: https://www.mongodb.com/try/download/database-tools"
        exit 1
    fi

    MONGODUMP_VERSION=$(mongodump --version | head -n 1)
    print_success "MongoDB工具版本: $MONGODUMP_VERSION"

    # 设置默认环境变量
    if [ -z "$BACKUP_PATH" ]; then
        BACKUP_PATH="./backups"
    fi

    if [ -z "$KEEP_DAYS" ]; then
        KEEP_DAYS=7
    fi

    if [ -z "$COMPRESS" ]; then
        COMPRESS=true
    fi

    echo
    print_info "配置信息:"
    print_info "- 备份路径: $BACKUP_PATH"
    print_info "- 保留天数: $KEEP_DAYS"
    print_info "- 启用压缩: $COMPRESS"
    echo

    # 导出环境变量
    export BACKUP_PATH
    export KEEP_DAYS
    export COMPRESS

    # 检查备份脚本是否存在
    if [ ! -f "backup_mongodb.js" ]; then
        print_error "备份脚本文件 backup_mongodb.js 不存在"
        exit 1
    fi

    # 执行备份脚本
    print_info "开始执行数据库备份..."
    node backup_mongodb.js
    EXIT_CODE=$?

    echo
    if [ $EXIT_CODE -eq 0 ]; then
        print_separator
        print_success "✅ 备份任务执行完成"
        print_separator
        echo
        print_info "备份文件位置: $BACKUP_PATH"
        echo
        print_info "您可以查看以下文件："
        print_info "- 备份文件: $BACKUP_PATH/dcMes_backup_*.gz"
        print_info "- 日志文件: $BACKUP_PATH/backup.log"
        echo

        # 显示最新的备份文件
        if [ -d "$BACKUP_PATH" ]; then
            LATEST_BACKUP=$(ls -t "$BACKUP_PATH"/dcMes_backup_*.gz 2>/dev/null | head -n 1)
            if [ -n "$LATEST_BACKUP" ]; then
                BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
                print_success "最新备份文件: $(basename "$LATEST_BACKUP") (大小: $BACKUP_SIZE)"
            fi
        fi

    else
        print_separator
        print_error "❌ 备份任务执行失败"
        print_separator
        echo
        print_error "请检查错误信息并重试"
        print_info "详细错误日志请查看: $BACKUP_PATH/backup.log"
        echo
    fi

    # 询问是否查看日志
    echo
    read -p "是否查看备份日志？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "$BACKUP_PATH/backup.log" ]; then
            echo
            print_info "显示最后50行日志："
            print_separator
            tail -n 50 "$BACKUP_PATH/backup.log"
        else
            print_warning "日志文件不存在: $BACKUP_PATH/backup.log"
        fi
    fi

    exit $EXIT_CODE
}

# 信号处理
cleanup() {
    echo
    print_warning "收到中断信号，正在清理..."
    exit 130
}

trap cleanup SIGINT SIGTERM

# 执行主函数
main "$@" 