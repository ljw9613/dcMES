const express = require('express');
const router = express.Router();
const materialProcessFlowService = require('../services/materialProcessFlowService');

// 添加初始化产品条码的路由
router.post('/initializeProduct', async (req, res) => {
  try {
    const { barcode, userId } = req.body;
    if (!barcode) {
      return res.json({
        code: 400,
        success: false,
        message: '请提供产品条码'
      });
    }

    const result = await materialProcessFlowService.initializeProduct(barcode, userId);
    return res.json({
      code: 200,
      success: true,
      message: '初始化成功',
      data: result
    });
  } catch (error) {
    console.error('初始化产品条码失败:', error);
    return res.json({
      code: 500,
      success: false,
      message: error.message || '初始化产品条码失败'
    });
  }
});

module.exports = router; 