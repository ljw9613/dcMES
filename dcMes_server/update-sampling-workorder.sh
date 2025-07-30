#!/bin/bash

# UDI抽检记录工单计划ID批量更新工具
# 使用方法：./update-sampling-workorder.sh

# 设置脚本在出错时退出
set -e

# 颜色输出定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 打印带颜色的文本
print_colored() {
    local color=$1
    local text=$2
    echo -e "${color}${text}${NC}"
}

# 打印标题
print_title() {
    echo "==============================================="
    print_colored $BLUE "    UDI抽检记录工单计划ID批量更新工具"
    echo "==============================================="
    echo
}

# 检查Node.js是否安装
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_colored $RED "错误：未安装Node.js或Node.js不在PATH中"
        print_colored $YELLOW "请先安装Node.js：https://nodejs.org/"
        exit 1
    fi
    
    local node_version=$(node --version)
    print_colored $GREEN "Node.js版本：$node_version"
    echo
}

# 检查脚本文件是否存在
check_script_file() {
    if [ ! -f "scripts/updateSamplingInspectionWorkOrder.js" ]; then
        print_colored $RED "错误：未找到脚本文件 scripts/updateSamplingInspectionWorkOrder.js"
        print_colored $YELLOW "请确保在dcMes_server目录下运行此脚本"
        exit 1
    fi
}

# 显示菜单
show_menu() {
    print_colored $PURPLE "请选择操作："
    echo "1. 批量更新（默认批次大小100）"
    echo "2. 批量更新（自定义批次大小）"
    echo "3. 验证更新结果"
    echo "4. 显示帮助信息"
    echo "5. 退出"
    echo
}

# 读取用户输入
read_user_choice() {
    read -p "请输入选择（1-5）：" choice
    echo
}

# 读取批次大小
read_batch_size() {
    read -p "请输入批次大小（建议50-200）：" batchsize
    
    # 验证输入是否为数字
    if ! [[ "$batchsize" =~ ^[0-9]+$ ]]; then
        print_colored $YELLOW "批次大小必须是数字，使用默认值100"
        batchsize=100
    elif [ "$batchsize" -le 0 ] || [ "$batchsize" -gt 1000 ]; then
        print_colored $YELLOW "批次大小不合理，使用默认值100"
        batchsize=100
    fi
    
    echo
}

# 执行更新操作
execute_update() {
    local batch_arg=$1
    print_colored $GREEN "开始批量更新..."
    echo "==============================================="
    
    if [ -n "$batch_arg" ]; then
        node scripts/updateSamplingInspectionWorkOrder.js --batch-size=$batch_arg
    else
        node scripts/updateSamplingInspectionWorkOrder.js
    fi
}

# 执行验证操作
execute_validate() {
    print_colored $GREEN "验证更新结果..."
    echo "==============================================="
    node scripts/updateSamplingInspectionWorkOrder.js --validate
}

# 显示帮助信息
show_help() {
    print_colored $GREEN "显示帮助信息..."
    echo "==============================================="
    node scripts/updateSamplingInspectionWorkOrder.js --help
}

# 主函数
main() {
    print_title
    check_nodejs
    check_script_file
    
    show_menu
    read_user_choice
    
    case $choice in
        1)
            execute_update
            ;;
        2)
            read_batch_size
            print_colored $GREEN "开始批量更新（批次大小$batchsize）..."
            echo "==============================================="
            execute_update $batchsize
            ;;
        3)
            execute_validate
            ;;
        4)
            show_help
            ;;
        5)
            print_colored $GREEN "退出"
            exit 0
            ;;
        *)
            print_colored $RED "无效选择，请重新运行脚本"
            exit 1
            ;;
    esac
    
    echo
    echo "==============================================="
    print_colored $GREEN "操作完成！"
}

# 运行主函数
main "$@" 