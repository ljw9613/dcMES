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
            code: 200,
            message: '创建流程记录成功',
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

// 工序子物料批量扫码提交
router.post('/api/v1/scan-components', async (req, res) => {
    try {
        const { 
            mainBarcode,        // 主条码
            processStepId,      // 工序ID
            componentScans      // 子物料条码数组
        } = req.body;

        // 参数验证
        if (!mainBarcode || !processStepId || !Array.isArray(componentScans)) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数或参数格式错误'
            });
        }

 
        const result = await MaterialProcessFlowService.scanProcessComponents(
            mainBarcode,
            processStepId,
            componentScans
        );

        res.json({
            code: 200,
            success: true,
            data: result
        });
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
