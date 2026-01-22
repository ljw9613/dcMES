const axios = require('axios');

// 测试 export-by-sale-order 接口
async function testExportBySaleOrder() {
  try {
    console.log('测试 /api/v1/export-by-sale-order 接口...');
    
    const response = await axios.get('http://localhost:3000/api/v1/export-by-sale-order', {
      params: {
        saleOrderNo: 'TEST_ORDER_123', // 使用测试订单号
        page: 1,
        pageSize: 10
      }
    });
    
    console.log('接口响应状态:', response.status);
    console.log('接口响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.code === 200) {
      console.log('✅ 接口修复成功！');
    } else {
      console.log('❌ 接口仍然存在问题:', response.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP错误:', error.response.status);
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ 请求错误:', error.message);
    }
  }
}

// 等待服务器启动后再测试
setTimeout(testExportBySaleOrder, 3000); 