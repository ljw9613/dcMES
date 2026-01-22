#!/bin/bash

###############################################################################
# dcMes工单处理服务启动脚本
# 用于快速启动独立的工单处理服务
###############################################################################

echo "════════════════════════════════════════════════════════════"
echo "  dcMes工单处理服务启动脚本"
echo "════════════════════════════════════════════════════════════"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2未安装，请先安装PM2${NC}"
    echo "   npm install -g pm2"
    exit 1
fi

# 检查Redis是否运行
echo -e "${YELLOW}📌 步骤 1/5: 检查Redis服务${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis服务正常${NC}"
    else
        echo -e "${RED}❌ Redis服务未运行，请先启动Redis${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  无法检测Redis状态，跳过检查${NC}"
fi

# 检查端口占用
echo -e "${YELLOW}📌 步骤 2/5: 检查端口占用${NC}"
if lsof -i :3001 &> /dev/null; then
    echo -e "${YELLOW}⚠️  端口3001已被占用${NC}"
    lsof -i :3001
    read -p "是否停止占用端口的进程? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 stop dcmes-plan-server 2>/dev/null
        sleep 2
    else
        exit 1
    fi
else
    echo -e "${GREEN}✅ 端口3001可用${NC}"
fi

# 安装依赖
echo -e "${YELLOW}📌 步骤 3/5: 检查依赖${NC}"
if [ ! -d "dcMes_plan_server/node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖包...${NC}"
    cd dcMes_plan_server
    npm install
    cd ..
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
else
    echo -e "${GREEN}✅ 依赖已安装${NC}"
fi

# 启动服务
echo -e "${YELLOW}📌 步骤 4/5: 启动工单处理服务${NC}"
pm2 start ecosystem.config.js --only dcmes-plan-server --env production

# 等待服务启动
sleep 3

# 验证服务
echo -e "${YELLOW}📌 步骤 5/5: 验证服务状态${NC}"
if pm2 list | grep -q "dcmes-plan-server.*online"; then
    echo -e "${GREEN}✅ 工单处理服务启动成功${NC}"
    echo ""
    
    # 健康检查
    echo -e "${YELLOW}🔍 健康检查...${NC}"
    sleep 2
    HEALTH_CHECK=$(curl -s http://localhost:3001/health)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 健康检查通过${NC}"
        echo "$HEALTH_CHECK" | jq '.' 2>/dev/null || echo "$HEALTH_CHECK"
    else
        echo -e "${RED}❌ 健康检查失败${NC}"
    fi
    
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo -e "${GREEN}🎉 服务启动完成！${NC}"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "📡 服务地址: http://localhost:3001"
    echo "📊 查看状态: pm2 status dcmes-plan-server"
    echo "📝 查看日志: pm2 logs dcmes-plan-server"
    echo "📈 实时监控: pm2 monit"
    echo "🔄 重启服务: pm2 restart dcmes-plan-server"
    echo "🛑 停止服务: pm2 stop dcmes-plan-server"
    echo ""
    echo "🔍 API接口："
    echo "  - 健康检查: curl http://localhost:3001/health"
    echo "  - 队列统计: curl http://localhost:3001/api/workorder/queue/stats"
    echo ""
    
else
    echo -e "${RED}❌ 工单处理服务启动失败${NC}"
    echo ""
    echo "请查看错误日志："
    echo "  pm2 logs dcmes-plan-server --err --lines 50"
    exit 1
fi

echo "════════════════════════════════════════════════════════════"













