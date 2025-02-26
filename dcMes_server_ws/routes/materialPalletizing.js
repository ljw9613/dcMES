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

module.exports = router;
