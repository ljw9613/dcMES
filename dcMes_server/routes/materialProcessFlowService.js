// 在路由或控制器中使用
const express = require("express");
const router = express.Router();
const MaterialProcessFlowService = require("../services/materialProcessFlowService");

// 创建流程记录
router.post("/api/v1/create-flow", async (req, res) => {
  try {
    const {
      mainMaterialId,
      materialCode,
      barcode,
      productLineId,
      productLineName,
    } = req.body;
    const flowRecord =
      await MaterialProcessFlowService.createFlowByMaterialCode(
        mainMaterialId,
        materialCode,
        barcode,
        productLineId,
        productLineName
      );
    res.json({
      code: 200,
      message: "创建流程记录成功",
      success: true,
      data: flowRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 工序子物料批量扫码提交
router.post("/api/v1/scan-components", async (req, res) => {
  try {
    const {
      mainBarcode, // 主条码
      processStepId, // 工序ID
      componentScans, // 子物料条码数组
      userId, // 用户ID
      lineId // 产线ID
    } = req.body;

    // 参数验证
    if (!mainBarcode || !processStepId || !lineId || !Array.isArray(componentScans)) {
      return res.status(200).json({
        success: false,
        message: "缺少必要参数或参数格式错误",
      });
    }

    const result = await MaterialProcessFlowService.scanProcessComponents(
      mainBarcode,
      processStepId,
      componentScans,
      userId,
      lineId
    );

    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});

// 工序解绑
router.post("/api/v1/unbind-components", async (req, res) => {
  try {
    const {
      mainBarcode, // 主条码
      processStepId, // 工序ID
      userId, // 用户ID
      reason, // 解绑原因
      unbindSubsequent, // 是否解绑后续工序
    } = req.body;

    // 参数验证
    if (!mainBarcode || !processStepId || !userId || !reason) {
      return res.status(200).json({
        success: false,
        message: "缺少必要参数",
      });
    }

    const result = await MaterialProcessFlowService.unbindProcessComponents(
      mainBarcode,
      processStepId,
      userId,
      reason,
      unbindSubsequent
    );

    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});

// 更新流程节点
router.post("/api/v1/update-flow-nodes", async (req, res) => {
  try {
    const { barcode } = req.body;
    const result = await MaterialProcessFlowService.updateFlowNodes(barcode);
    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 获取物料相关的所有工序
router.get("/api/v1/all-process-steps/:materialId", async (req, res) => {
  try {
    const { materialId } = req.params;

    if (!materialId) {
      return res.status(200).json({
        success: false,
        message: "缺少物料ID参数",
      });
    }

    const result = await MaterialProcessFlowService.getAllProcessSteps(
      materialId
    );

    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
