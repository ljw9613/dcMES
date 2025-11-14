#!/bin/bash

###############################################################################
# dcMes工单处理服务测试脚本
# 用于测试工单处理服务的各项功能
###############################################################################

echo "════════════════════════════════════════════════════════════"
echo "  dcMes工单处理服务测试脚本"
echo "════════════════════════════════════════════════════════════"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 服务地址
BASE_URL="http://localhost:3001"

# 测试计数
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
run_test() {
    local test_name=$1
    local url=$2
    local method=${3:-GET}
    local data=${4:-}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}测试 $TOTAL_TESTS: $test_name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ 通过 (HTTP $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ 失败 (HTTP $http_code)${NC}"
        echo "$body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
}

# 开始测试
echo -e "${YELLOW}开始测试工单处理服务...${NC}"
echo ""

# 1. 健康检查
run_test "健康检查" "$BASE_URL/health"

# 2. 服务信息
run_test "获取服务信息" "$BASE_URL/"

# 3. 队列统计
run_test "获取队列统计" "$BASE_URL/api/workorder/queue/stats"

# 4. 锁统计
run_test "获取锁统计" "$BASE_URL/api/workorder/queue/locks"

# 测试结果汇总
echo "════════════════════════════════════════════════════════════"
echo -e "${BLUE}测试结果汇总${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    echo "════════════════════════════════════════════════════════════"
    exit 0
else
    echo -e "${RED}❌ 部分测试失败，请检查服务状态${NC}"
    echo ""
    echo "建议检查："
    echo "  1. 服务是否正常运行: pm2 status dcmes-plan-server"
    echo "  2. 查看错误日志: pm2 logs dcmes-plan-server --err"
    echo "  3. 检查端口: lsof -i :3001"
    echo "════════════════════════════════════════════════════════════"
    exit 1
fi











