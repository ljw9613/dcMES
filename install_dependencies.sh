#!/bin/bash

# 检验失败数据导出脚本依赖安装脚本
# 使用方法: chmod +x install_dependencies.sh && ./install_dependencies.sh

echo "🚀 开始安装检验失败数据导出脚本依赖..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 未找到Node.js，请先安装Node.js (建议版本14.0+)"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 未找到npm，请先安装npm"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"
echo "✅ npm版本: $(npm --version)"

# 创建输出目录
echo "📁 创建输出目录..."
mkdir -p output

# 安装依赖
echo "📦 安装依赖包..."
npm install mongoose xlsx archiver

# 检查安装结果
if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功！"
    echo ""
    echo "📋 使用说明:"
    echo "1. 测试脚本: node test_export_script.js <工单ID>"
    echo "2. 导出数据: node export_failed_inspection_data.js <工单ID>"
    echo "3. 查看详细说明: cat README_检验失败数据导出脚本.md"
    echo ""
    echo "⚠️  注意: 使用前请确认数据库连接配置是否正确"
else
    echo "❌ 依赖安装失败，请检查网络连接和权限"
    exit 1
fi
