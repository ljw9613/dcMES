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

    // 获取条码规则（需要提前获取以确定规则ID）
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

    // 第一步：优先查找并原子性锁定可用的装箱条码
    // 使用智能查找函数寻找未锁定的现有条码（按条码规则）
    const existingAvailableBarcode = await findAvailableExistingBarcode(
      productionLineId, 
      rule._id,
      startOfMonth, 
      startOfNextMonth
    );

    if (existingAvailableBarcode) {
      // 原子性锁定找到的可用条码
      const lockedBarcode = await PackBarcode.findOneAndUpdate(
        {
          _id: existingAvailableBarcode._id,
          status: 'PENDING',
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
            lockExpireAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟后过期
            updater: '系统锁定',
            updateAt: new Date()
          }
        },
        { new: true }
      );

      if (lockedBarcode) {
        console.log(`成功锁定现有条码，序列号: ${lockedBarcode.serialNumber}`);
        return res.json({
          success: true,
          data: lockedBarcode,
          message: `获取到可用的装箱条码（序列号: ${lockedBarcode.serialNumber}），已锁定`
        });
      }
    }

    // 第二步：没有可用条码，需要创建新条码

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

    // 智能序列号查找策略：按条码规则寻找下一个可用的序列号
    const nextAvailableSerialNumber = await findNextAvailableSerialNumber(
      rule._id, 
      startOfMonth, 
      startOfNextMonth
    );

    // 检查是否达到最大重试次数（防止无限循环）
    const maxSerialNumber = 99999; // 设置最大序列号限制
    if (nextAvailableSerialNumber > maxSerialNumber) {
      return res.json({
        success: false,
        message: `物料 ${materialNumber} 当月序列号已达到上限，请联系管理员`,
        shouldRetry: false
      });
    }

    // 生成条码
    const barcodeData = {
      ...workOrder.toObject(),
      lineNum: productionLine.lineNum,
      serialNumber: nextAvailableSerialNumber,
      lineCode: productionLine.lineCode
    };

    // 调用条码生成逻辑
    let barcodeResult = await generateBarcodeFromRuleLocal(rule, barcodeData);

    if (!barcodeResult.barcode) {
      return res.json({
        success: false,
        message: '条码生成失败'
      });
    }

    // 双重检查：确保生成的条码确实不存在（原子性保证）
    // 这里进行最终的唯一性验证
    const duplicateBarcode = await PackBarcode.findOne({
      $or: [
        { barcode: barcodeResult.barcode },
        { printBarcode: barcodeResult.printBarcode },
        { 
          serialNumber: nextAvailableSerialNumber,
          ruleId: rule._id, // 按条码规则检查序列号冲突
          createAt: { $gte: startOfMonth, $lt: startOfNextMonth },
          status: { $ne: 'VOIDED' }
        }
      ]
    });

    if (duplicateBarcode) {
      // 如果仍然存在冲突，递归查找下一个可用序列号
      console.log(`序列号 ${nextAvailableSerialNumber} 仍存在冲突，查找下一个可用序列号`);
      
      const nextNextSerialNumber = await findNextAvailableSerialNumber(
        rule._id, 
        startOfMonth, 
        startOfNextMonth,
        nextAvailableSerialNumber + 1 // 从下一个序列号开始查找
      );

      if (nextNextSerialNumber > maxSerialNumber) {
        return res.json({
          success: false,
          message: `物料 ${materialNumber} 当月序列号已达到上限，请联系管理员`,
          shouldRetry: false
        });
      }

      // 重新生成条码
      const newBarcodeData = {
        ...workOrder.toObject(),
        lineNum: productionLine.lineNum,
        serialNumber: nextNextSerialNumber,
        lineCode: productionLine.lineCode
      };

      let newBarcodeResult = await generateBarcodeFromRuleLocal(rule, newBarcodeData);
      newBarcodeResult.lineNum = productionLine.lineCode;
      console.log("newBarcodeResult", newBarcodeResult.lineNum);
      // 创建条码记录（使用新的序列号）
      const newPackBarcode = new PackBarcode({
        ...newBarcodeResult,
        productionLineId: productionLineId,
        materialId: materialId,
        materialNumber: materialNumber,
        materialName: materialName,
        workOrderId: workOrder._id,
        workOrderNo: workOrder.productionOrderNo,
        ruleId: rule._id,
        ruleName: rule.name,
        ruleCode: rule.code,
        serialNumber: nextNextSerialNumber,
        status: 'LOCKED',
        lockedBy: lockId,
        lockedAt: new Date(),
        lockExpireAt: new Date(Date.now() + 30 * 60 * 1000),
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
          message: `创建新的装箱条码成功（序列号: ${nextNextSerialNumber}），已锁定`
        });
      } catch (error) {
        if (error.code === 11000) {
          return res.json({
            success: false,
            message: '并发冲突，请重试',
            shouldRetry: true
          });
        }
        throw error;
      }
    }
    barcodeResult.lineNum = productionLine.lineCode;
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
      serialNumber: nextAvailableSerialNumber,
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
    const { productionLineId, materialNumber, materialId } = req.query;
    
    // 计算当月时间范围
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 统计各种状态的条码数量（仍按物料统计，便于查看特定物料的状态）
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

    // 获取该物料对应的条码规则，以便查询按规则分配的序列号
    let ruleId = null;
    let nextSerialNumber = 1;
    
    if (materialId) {
      try {
        const ruleBinding = await BarcodeSegmentRuleMaterial.findOne({
          materialId: materialId,
          enabled: true
        });
        
        if (ruleBinding) {
          ruleId = ruleBinding.ruleId;
          
          // 获取该条码规则下的最新序列号（全局查询）
          const lastBarcode = await PackBarcode.findOne({
            ruleId: ruleId,
            createAt: { $gte: startOfMonth, $lt: startOfNextMonth },
            status: { $ne: 'VOIDED' }
          }).sort({ serialNumber: -1 });
          
          nextSerialNumber = lastBarcode ? lastBarcode.serialNumber + 1 : 1;
        }
      } catch (error) {
        console.warn('获取条码规则失败，使用默认序列号:', error);
      }
    }
    
    // 如果没有找到规则，仍使用按物料的序列号（向后兼容）
    if (!ruleId) {
      const lastBarcode = await PackBarcode.findOne({
        materialNumber: materialNumber,
        createAt: { $gte: startOfMonth, $lt: startOfNextMonth },
        status: { $ne: 'VOIDED' }
      }).sort({ serialNumber: -1 });
      
      nextSerialNumber = lastBarcode ? lastBarcode.serialNumber + 1 : 1;
    }

    return res.json({
      success: true,
      data: {
        statusCounts: statusCounts,
        nextSerialNumber: nextSerialNumber,
        ruleId: ruleId, // 返回使用的条码规则ID
        isGlobalSequence: !!ruleId, // 标识是否使用全局序列号
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
 * 智能查找下一个可用的序列号（按条码规则全局唯一）
 * @param {string} ruleId - 条码规则ID
 * @param {Date} startOfMonth - 当月开始时间
 * @param {Date} startOfNextMonth - 下月开始时间
 * @param {number} startFrom - 开始查找的序列号（可选，默认为1）
 * @returns {Promise<number>} 下一个可用的序列号
 */
async function findNextAvailableSerialNumber(ruleId, startOfMonth, startOfNextMonth, startFrom = 1) {
  try {
    // 查询当月同一条码规则的所有已存在序列号，按序列号排序
    // 这样确保同一规则的序列号全局唯一，避免不同物料生成相同条码
    const existingBarcodes = await PackBarcode.find({
      ruleId: ruleId,
      createAt: { $gte: startOfMonth, $lt: startOfNextMonth },
      status: { $ne: 'VOIDED' } // 排除已作废的条码
    }, 'serialNumber').sort({ serialNumber: 1 }).lean();

    // 如果没有现有条码，返回起始序列号
    if (!existingBarcodes || existingBarcodes.length === 0) {
      return startFrom;
    }

    // 将现有序列号转换为Set以便快速查找
    const usedSerialNumbers = new Set(existingBarcodes.map(item => item.serialNumber));

    // 从指定起始点开始查找第一个未使用的序列号
    let nextSerial = startFrom;
    while (usedSerialNumbers.has(nextSerial)) {
      nextSerial++;
      
      // 防止无限循环，设置上限
      if (nextSerial > 99999) {
        throw new Error('序列号已达到上限');
      }
    }

    console.log(`条码规则 ${ruleId} 找到可用序列号: ${nextSerial}`);
    return nextSerial;
    
  } catch (error) {
    console.error('查找可用序列号失败:', error);
    // 发生错误时，返回一个基于时间戳的序列号作为兜底
    const fallbackSerial = parseInt(String(Date.now()).slice(-5)) % 10000 + 1;
    console.log(`使用兜底序列号: ${fallbackSerial}`);
    return fallbackSerial;
  }
}

/**
 * 优先查找未锁定的现有条码（按条码规则查找）
 * @param {string} productionLineId - 产线ID
 * @param {string} ruleId - 条码规则ID
 * @param {Date} startOfMonth - 当月开始时间
 * @param {Date} startOfNextMonth - 下月开始时间
 * @returns {Promise<Object|null>} 可用的条码或null
 */
async function findAvailableExistingBarcode(productionLineId, ruleId, startOfMonth, startOfNextMonth) {
  try {
    // 优先查找同产线、同条码规则、PENDING状态且未锁定的条码
    // 注意：这里仍需要按产线查找，因为不同产线的条码不能混用
    const availableBarcode = await PackBarcode.findOne({
      productionLineId: productionLineId,
      ruleId: ruleId,
      status: 'PENDING',
      createAt: { $gte: startOfMonth, $lt: startOfNextMonth },
      $or: [
        { lockedBy: { $exists: false } },
        { lockedBy: null },
        { lockExpireAt: { $lt: new Date() } } // 锁已过期
      ]
    }).sort({ serialNumber: 1 }); // 按序列号升序获取最早的条码

    return availableBarcode;
  } catch (error) {
    console.error('查找可用现有条码失败:', error);
    return null;
  }
}

/**
 * 条码生成函数（使用实际的条码生成逻辑）
 */
async function generateBarcodeFromRuleLocal(rule, data) {
  return await generateBarcodeFromRule(rule, data);
}

module.exports = router; 