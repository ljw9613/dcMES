const express = require('express');
const router = express.Router();
const PackBarcode = require('../model/project/packBarcode');
const BarcodeSegmentRule = require('../model/project/barcodeSegmentRule');
const BarcodeSegmentRuleMaterial = require('../model/project/barcodeSegmentRuleMaterial');
const ProductionLine = require('../model/project/productionLine');
const ProductionPlanWorkOrder = require('../model/project/productionPlanWorkOrder');
const { generateBarcodeFromRule } = require('../utils/generateBarcode');

/**
 * 原子性获取或创建装箱条码
 * 解决多产线并发问题，支持设备锁定机制
 */
router.post('/api/v1/getOrCreatePackBarcode', async (req, res) => {
  try {
    const { 
      productionLineId, 
      materialNumber, 
      materialId, 
      materialName,
      sessionId, // 前端传入的会话ID，用于标识不同的请求
      deviceIp // 设备IP，用于设备识别
    } = req.body;

    if (!productionLineId || !materialNumber || !materialId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：productionLineId, materialNumber, materialId'
      });
    }

    // 计算当月时间范围
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 生成锁定标识（优先使用设备IP，否则使用会话ID）
    const lockId = deviceIp || sessionId || `${productionLineId}_${Date.now()}`;
    const lockExpireTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2小时后过期，防止异常情况下的死锁

    // 第一步：原子性查找并锁定可用的装箱条码
    // 查找同产线、同物料、PENDING状态且未锁定的条码
    let availableBarcode = await PackBarcode.findOneAndUpdate(
      {
        productionLineId: productionLineId,
        materialNumber: materialNumber,
        status: 'PENDING',
        createAt: { $gte: startOfMonth, $lt: startOfNextMonth },
        $or: [
          { lockedBy: { $exists: false } },
          { lockedBy: null },
          { lockExpireAt: { $lt: new Date() } } // 锁已过期
        ]
      },
      {
        $set: {
          status: 'LOCKED',
          lockedBy: lockId,
          lockedAt: new Date(),
          lockExpireAt: lockExpireTime,
          updater: '系统',
          updateAt: new Date()
        }
      },
      {
        new: true,
        sort: { serialNumber: 1 } // 按序列号升序获取最早的条码
      }
    );

    if (availableBarcode) {
      // 找到可用条码，保持锁定状态直到前端主动解锁
      // 更新锁定信息但不解锁
      const lockedBarcode = await PackBarcode.findByIdAndUpdate(availableBarcode._id, {
        $set: {
          status: 'LOCKED',
          lockedBy: lockId,
          lockedAt: new Date(),
          lockExpireAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟后过期，防止页面异常关闭造成死锁
          updater: '系统锁定',
          updateAt: new Date()
        }
      }, { new: true });

      return res.json({
        success: true,
        data: lockedBarcode,
        message: '获取到可用的装箱条码，已锁定'
      });
    }

    // 第二步：没有可用条码，需要创建新条码
    // 获取条码规则
    const ruleBinding = await BarcodeSegmentRuleMaterial.findOne({
      materialId: materialId,
      enabled: true
    });

    if (!ruleBinding) {
      return res.json({
        success: false,
        message: '物料未绑定条码规则'
      });
    }

    const rule = await BarcodeSegmentRule.findOne({
      _id: ruleBinding.ruleId,
      enabled: true
    });

    if (!rule) {
      return res.json({
        success: false,
        message: '条码规则不存在或已禁用'
      });
    }

    // 获取产线信息
    const productionLine = await ProductionLine.findById(productionLineId);
    if (!productionLine) {
      return res.json({
        success: false,
        message: '产线不存在'
      });
    }

    // 获取当前工单
    const workOrder = await ProductionPlanWorkOrder.findOne({
      productionLineId: productionLineId,
      status: 'IN_PROGRESS'
    });

    if (!workOrder) {
      return res.json({
        success: false,
        message: '产线上没有进行中的工单'
      });
    }

    // 修复：序列号应该按物料分组计算，确保同一物料的序列号连续且不重复
    // 查询当月同一物料的最新序列号，包括LOCKED状态
    const lastBarcode = await PackBarcode.findOne({
      materialNumber: materialNumber, // 按物料分组
      createAt: { $gte: startOfMonth, $lt: startOfNextMonth },
      status: { $ne: 'VOIDED' } // 包含PENDING、LOCKED、USED状态
    }).sort({ serialNumber: -1 });

    let serialNumber = 1;
    if (lastBarcode) {
      serialNumber = lastBarcode.serialNumber + 1;
    }

    // 检查序列号是否已存在（防止并发冲突）
    // 注意：序列号冲突检查应该按当月同一个物料进行
    const existingBarcode = await PackBarcode.findOne({
      serialNumber: serialNumber,
      materialNumber: materialNumber, // 同一物料
      createAt: { $gte: startOfMonth, $lt: startOfNextMonth },
      status: { $ne: 'VOIDED' }
    });

    if (existingBarcode) {
      // 序列号冲突，建议重试
      return res.json({
        success: false,
        message: `物料 ${materialNumber} 的条码序列号 ${serialNumber} 已存在，请重试`,
        shouldRetry: true
      });
    }

    // 生成条码
    const barcodeData = {
      ...workOrder.toObject(),
      lineNum: productionLine.lineNum,
      serialNumber: serialNumber
    };

    // 调用条码生成逻辑
    const barcodeResult = await generateBarcodeFromRuleLocal(rule, barcodeData);

    if (!barcodeResult.barcode) {
      return res.json({
        success: false,
        message: '条码生成失败'
      });
    }

    // 检查生成的条码是否已存在（防止重复条码）
    // 注意：排除已作废的条码，作废的条码可以重新使用
    const duplicateBarcode = await PackBarcode.findOne({
      $or: [
        { barcode: barcodeResult.barcode },
        { printBarcode: barcodeResult.printBarcode }
      ],
      status: { $ne: 'VOIDED' } // 排除已作废的条码
    });

    if (duplicateBarcode) {
      return res.json({
        success: false,
        message: '生成的条码已存在，请重试',
        shouldRetry: true
      });
    }

    // 原子性创建新条码
    const newPackBarcode = new PackBarcode({
      ...barcodeResult,
      productionLineId: productionLineId,
      materialId: materialId,
      materialNumber: materialNumber,
      materialName: materialName,
      workOrderId: workOrder._id,
      workOrderNo: workOrder.productionOrderNo,
      ruleId: rule._id,
      ruleName: rule.name,
      ruleCode: rule.code,
      serialNumber: serialNumber,
      status: 'LOCKED', // 新创建的条码直接设置为锁定状态
      lockedBy: lockId, // 锁定给当前设备/会话
      lockedAt: new Date(),
      lockExpireAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟后过期
      creator: '系统',
      createAt: new Date(),
      updater: '系统锁定',
      updateAt: new Date()
    });

    try {
      const savedBarcode = await newPackBarcode.save();

      return res.json({
        success: true,
        data: savedBarcode,
        message: '创建新的装箱条码成功，已锁定'
      });
    } catch (error) {
      // 处理唯一索引冲突（并发创建同一序列号）
      if (error.code === 11000) {
        // 检查是序列号冲突还是条码冲突
        if (error.message.includes('serialNumber')) {
          return res.json({
            success: false,
            message: '条码序列号冲突，请重试',
            shouldRetry: true
          });
        } else if (error.message.includes('barcode')) {
          return res.json({
            success: false,
            message: '条码内容重复，请重试',
            shouldRetry: true
          });
        }
      }
      throw error;
    }

  } catch (error) {
    console.error('获取装箱条码失败:', error);
    return res.json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 解锁装箱条码
 * 前端页面关闭时调用，释放条码锁定
 */
router.post('/api/v1/unlockPackBarcode', async (req, res) => {
  try {
    const { 
      barcodeId,        // 条码ID
      sessionId,        // 会话ID
      deviceIp,         // 设备IP
      barcode           // 条码值（备用标识）
    } = req.body;

    // 生成锁定标识（与获取时保持一致）
    const lockId = deviceIp || sessionId;

    if (!lockId) {
      return res.status(400).json({
        success: false,
        message: '缺少设备标识参数：deviceIp 或 sessionId'
      });
    }

    // 构建查询条件
    let query = {
      lockedBy: lockId,
      status: 'LOCKED'
    };

    // 优先使用条码ID，其次使用条码值
    if (barcodeId) {
      query._id = barcodeId;
    } else if (barcode) {
      query.$or = [
        { barcode: barcode },
        { printBarcode: barcode }
      ];
    } else {
      return res.status(400).json({
        success: false,
        message: '缺少条码标识：barcodeId 或 barcode'
      });
    }

    // 解锁条码
    const result = await PackBarcode.findOneAndUpdate(
      query,
      {
        $set: {
          status: 'PENDING',
          lockedBy: null,
          lockedAt: null,
          lockExpireAt: null,
          updater: '用户解锁',
          updateAt: new Date()
        }
      },
      { new: true }
    );

    if (!result) {
      return res.json({
        success: false,
        message: '未找到可解锁的条码，可能已被其他用户操作'
      });
    }

    return res.json({
      success: true,
      data: result,
      message: '条码解锁成功'
    });

  } catch (error) {
    console.error('解锁装箱条码失败:', error);
    return res.json({
      success: false,
      message: '解锁装箱条码失败',
      error: error.message
    });
  }
});

/**
 * 批量解锁装箱条码
 * 用于清理指定设备的所有锁定条码
 */
router.post('/api/v1/unlockAllPackBarcodes', async (req, res) => {
  try {
    const { sessionId, deviceIp } = req.body;

    const lockId = deviceIp || sessionId;
    if (!lockId) {
      return res.status(400).json({
        success: false,
        message: '缺少设备标识参数：deviceIp 或 sessionId'
      });
    }

    // 批量解锁该设备的所有锁定条码
    const result = await PackBarcode.updateMany(
      {
        lockedBy: lockId,
        status: 'LOCKED'
      },
      {
        $set: {
          status: 'PENDING',
          lockedBy: null,
          lockedAt: null,
          lockExpireAt: null,
          updater: '批量解锁',
          updateAt: new Date()
        }
      }
    );

    return res.json({
      success: true,
      message: `成功解锁 ${result.modifiedCount} 个条码`,
      count: result.modifiedCount
    });

  } catch (error) {
    console.error('批量解锁装箱条码失败:', error);
    return res.json({
      success: false,
      message: '批量解锁装箱条码失败',
      error: error.message
    });
  }
});

/**
 * 清理过期锁定的条码
 */
router.post('/api/v1/cleanExpiredLocks', async (req, res) => {
  try {
    const result = await PackBarcode.updateMany(
      {
        status: 'LOCKED',
        lockExpireAt: { $lt: new Date() }
      },
      {
        $set: {
          status: 'PENDING',
          lockedBy: null,
          lockedAt: null,
          lockExpireAt: null,
          updater: '系统清理',
          updateAt: new Date()
        }
      }
    );
    console.log(result, "result");

    return res.json({
      success: true,
      message: `清理了 ${result.modifiedCount} 个过期锁定的条码`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('清理过期锁定失败:', error);
    return res.json({
      success: false,
      message: '清理过期锁定失败',
      error: error.message
    });
  }
});

/**
 * 检查装箱条码状态
 */
router.get('/api/v1/checkPackBarcodeStatus', async (req, res) => {
  try {
    const { productionLineId, materialNumber } = req.query;
    
    // 计算当月时间范围
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 统计各种状态的条码数量
    const statusCounts = await PackBarcode.aggregate([
      {
        $match: {
          productionLineId: productionLineId,
          materialNumber: materialNumber,
          createAt: { $gte: startOfMonth, $lt: startOfNextMonth }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // 获取最新的序列号（按物料分组）
    const lastBarcode = await PackBarcode.findOne({
      materialNumber: materialNumber, // 按物料分组
      createAt: { $gte: startOfMonth, $lt: startOfNextMonth },
      status: { $ne: 'VOIDED' }
    }).sort({ serialNumber: -1 });

    return res.json({
      success: true,
      data: {
        statusCounts: statusCounts,
        nextSerialNumber: lastBarcode ? lastBarcode.serialNumber + 1 : 1,
        monthRange: {
          start: startOfMonth,
          end: startOfNextMonth
        }
      }
    });
  } catch (error) {
    console.error('检查装箱条码状态失败:', error);
    return res.json({
      success: false,
      message: '检查装箱条码状态失败',
      error: error.message
    });
  }
});

/**
 * 条码生成函数（使用实际的条码生成逻辑）
 */
async function generateBarcodeFromRuleLocal(rule, data) {
  return await generateBarcodeFromRule(rule, data);
}

module.exports = router; 