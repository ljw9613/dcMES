const express = require("express");
const router = express.Router();
const materialPalletizingService = require("../services/materialPalletizing");
const apiLogger = require("../middleware/apiLogger");

// 使用API日志中间件，指定服务名称
router.use(apiLogger("materialPalletizing"));

// 添加托盘条码接口（强制使用队列化处理）
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
      componentScans,
      fromRepairStation = false // 是否来自维修台
    } = req.body;

    // 参数验证
    if (!lineId || !mainBarcode) {
      return res.status(200).json({
        success: false,
        message: "缺少必要参数或参数格式错误",
      });
    }

    // 强制使用队列化处理，确保并发安全
    console.log(`🚀 托盘条码处理 - 队列模式: ${mainBarcode}`);
    
    const result = await materialPalletizingService.handlePalletBarcodeAsync(
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
      componentScans,
      fromRepairStation
    );
    
    // 队列化处理成功，返回前端兼容的响应
    return res.status(200).json({
      code: 200,
      success: true,
      data: result,
      message: "条码已提交处理队列，正在后台处理",
      // 添加队列相关信息供前端参考
      queue: {
        enabled: true,
        jobId: result.queueInfo?.jobId,
        estimatedDelay: result.queueInfo?.estimatedDelay,
        message: result.queueInfo?.message || "已加入队列处理"
      }
    });
    
  } catch (error) {
    console.error(`❌ 托盘条码处理失败: ${req.body.mainBarcode}`, error);
    
    return res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      queue: {
        enabled: true,
        error: true,
        message: "队列处理失败"
      }
    });
  }
});

// 添加队列状态查询接口
router.get("/api/v1/getPalletProcessingStatus/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(200).json({
        success: false,
        message: "缺少任务ID参数",
      });
    }

    // 导入队列服务来查询任务状态
    const { palletQueue } = require('../services/queueService');
    
    const job = await palletQueue.getJob(jobId);
    
    if (!job) {
      return res.status(200).json({
        code: 404,
        success: false,
        message: "未找到对应的处理任务",
      });
    }

    const jobState = await job.getState();
    const progress = job.progress;
    
    let result = {
      jobId: job.id,
      state: jobState,
      progress: progress,
      data: job.data,
      createdAt: new Date(job.timestamp).toISOString()
    };

    // 如果任务已完成，返回处理结果
    if (jobState === 'completed') {
      result.result = job.returnvalue;
      result.completedAt = job.finishedOn ? new Date(job.finishedOn).toISOString() : null;
    }

    // 如果任务失败，返回错误信息
    if (jobState === 'failed') {
      result.error = job.failedReason;
      result.failedAt = job.finishedOn ? new Date(job.finishedOn).toISOString() : null;
    }

    return res.status(200).json({
      code: 200,
      success: true,
      data: result,
      message: "任务状态查询成功",
    });
    
  } catch (error) {
    console.error(`查询托盘处理状态失败: ${req.params.jobId}`, error);
    
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

// 指定托盘添加条码接口
router.post("/api/v1/addBarcodeToPallet", async (req, res) => {
  try {
    const { 
      palletCode, 
      mainBarcode, 
      boxBarcode = null, 
      userId, 
      componentScans = [] 
    } = req.body;

    // 参数验证
    if (!palletCode || !mainBarcode || !userId) {
      return res.status(200).json({
        success: false,
        message: "缺少必要参数：托盘编号、条码、用户ID不能为空",
      });
    }

    const result = await materialPalletizingService.addBarcodeToPallet(
      palletCode,
      mainBarcode,
      boxBarcode,
      userId,
      componentScans,
      true // 添加参数，表示来自维修台
    );

    return res.status(200).json({
      code: 200,
      success: true,
      data: result,
      message: "条码已成功添加到指定托盘",
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
    const { barcode, userId, remarks, status } = req.body;

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
      remarks,
      status
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

// 更新托盘数量接口
router.post("/api/v1/updatePalletQuantity", async (req, res) => {
  try {
    const { palletCode, totalQuantity, userId } = req.body;

    // 参数验证
    if (!palletCode || !totalQuantity || !userId) {
      return res.status(200).json({
        code: 400,
        success: false,
        message: "缺少必要参数：托盘编号、数量、用户ID不能为空",
      });
    }

    // 验证数量是否为正整数
    if (!Number.isInteger(totalQuantity) || totalQuantity <= 0) {
      return res.status(200).json({
        code: 400,
        success: false,
        message: "托盘数量必须是大于0的整数",
      });
    }

    const result = await materialPalletizingService.updatePalletQuantity(
      palletCode,
      totalQuantity,
      userId
    );

    return res.status(200).json({
      code: 200,
      success: true,
      data: result,
      message: "托盘数量更新成功",
    });
  } catch (error) {
    console.error("更新托盘数量失败:", error);
    return res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
