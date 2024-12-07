// 在路由或控制器中使用
const express = require("express");
const router = express.Router();
const MaterialProcessFlowService = require('../services/materialProcessFlowService');

// 创建流程记录
router.post('/api/v1/create-flow', async (req, res) => {
    try {
        const { materialCode, barcode } = req.body;
        const flowRecord = await MaterialProcessFlowService.createFlowByMaterialCode(
            materialCode,
            barcode
        );
        res.json({
            success: true,
            data: flowRecord
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
