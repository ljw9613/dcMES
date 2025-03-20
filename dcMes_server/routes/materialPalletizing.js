const express = require("express");
const router = express.Router();
const materialPalletizingService = require("../services/materialPalletizing");
// 添加托盘条码接口
router.post("/api/v1/handlePalletBarcode", async (req, res) => {
  try {
    const {
      lineId,
      lineName,
      processStepId,
      materialId,
      materialCode,
      materialName,
      materialSpec,
      mainBarcode,
      boxBarcode = null,
      totalQuantity,
      userId,
      componentScans
    } = req.body;

    // 参数验证
    if (!lineId || !mainBarcode) {
      return res.status(200).json({
        success: false,
        message: "缺少必要参数或参数格式错误",
      });
    }

    const result = await materialPalletizingService.handlePalletBarcode(
      lineId,
      lineName,
      processStepId,
      materialId,
      materialCode,
      materialName,
      materialSpec,
      mainBarcode,
      boxBarcode,
      totalQuantity,
      userId,
      componentScans
    );
    return res.status(200).json({
      code: 200,
      success: true,
      data: result,
      message: "添加成功",
    });
  } catch (error) {
    return res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});

// 解绑条码接口
router.post("/api/v1/unbindPalletAllBarcode", async (req, res) => {
  try {
    const { palletCode, userId } = req.body;

    // 参数验证
    if (!palletCode || !userId) {
      return res.status(200).json({
        success: false,
        message: "缺少必要参数",
      });
    }

    const result = await materialPalletizingService.unbindPalletBarcode(
      palletCode,
      userId
    );

    return res.status(200).json({
      code: 200,
      success: true,
      data: result,
      message: "解绑成功",
    });
  } catch (error) {
    return res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});


// 解绑条码接口
router.post("/api/v1/unbindPalletBarcode", async (req, res) => {
  try {
    const { palletCode, barcode, userId } = req.body;

    // 参数验证
    if (!palletCode || !barcode || !userId) {
      return res.status(200).json({
        success: false,
        message: "缺少必要参数",
      });
    }

    const result = await materialPalletizingService.unbindBarcode(
      palletCode,
      barcode,
      userId
    );

    return res.status(200).json({
      code: 200,
      success: true,
      data: result,
      message: "解绑成功",
    });
  } catch (error) {
    return res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});

// 添加拆分托盘接口
router.post("/api/v1/splitPallet", async (req, res) => {
  try {
    const { originalPalletCode, barcodes, userId } = req.body;

    // 参数验证
    if (!originalPalletCode || !barcodes || !barcodes.length || !userId) {
      return res.status(200).json({
        success: false,
        message: "缺少必要参数",
      });
    }

    const result = await materialPalletizingService.splitPallet(
      originalPalletCode,
      barcodes,
      userId
    );

    return res.status(200).json({
      code: 200,
      success: true,
      data: result,
      message: "拆分托盘成功",
    });
  } catch (error) {
    return res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});

// 更新托盘检测状态接口
router.post("/api/v1/updatePalletInspectionStatus", async (req, res) => {
  try {
    const { barcode, userId, remarks } = req.body;

    // 参数验证
    if (!barcode) {
      return res.status(200).json({
        success: false,
        message: "缺少必要参数：条码信息",
      });
    }

    const result = await materialPalletizingService.updatePalletInspectionStatus(
      barcode,
      userId,
      remarks
    );

    return res.status(200).json({
      code: 200,
      success: true,
      data: result,
      message: "托盘检测状态更新成功",
    });
  } catch (error) {
    return res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
