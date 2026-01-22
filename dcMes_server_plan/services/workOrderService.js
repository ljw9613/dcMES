/**
 * 工单服务
 * 处理工单数量更新的核心业务逻辑
 */

const mongoose = require('mongoose');
const ProductionPlanWorkOrder = require('../model/project/productionPlanWorkOrder');
const WorkOrderQuantityLog = require('../model/project/workOrderQuantityLog');
const K3Material = require('../model/k3/k3_BD_MATERIAL'); // 引入物料模型

class WorkOrderService {
  /**
   * 更新工单数量
   * @param {string} workOrderId - 工单ID
   * @param {string} type - 更新类型 ('input' | 'output')
   * @param {number} quantity - 更新数量
   * @param {Object} logContext - 日志上下文信息
   */
  static async updateWorkOrderQuantity(workOrderId, type, quantity = 1, logContext = {}) {
    try {
      if (!workOrderId) {
        throw new Error('未提供工单ID');
      }

      const updateField = type === 'input' ? 'inputQuantity' : 'outputQuantity';

      // 防重复检查：针对条码扫描的首道工序投入操作
      // 检查同一条码是否已经在同一工单、同一工序中增加过投入量
      if (
        type === 'input' && 
        quantity > 0 && 
        logContext.relatedBarcode && 
        logContext.barcodeOperation === 'SCAN_PROCESS' &&
        logContext.processStepId
      ) {
        const { relatedBarcode, processStepId } = logContext;
        
        // 查找该条码在该工单、该工序中是否已经有过投入量增加的记录
        const existingInputLog = await WorkOrderQuantityLog.findOne({
          workOrderId: workOrderId,
          relatedBarcode: relatedBarcode,
          processStepId: processStepId,
          changeType: 'input',
          changeQuantity: { $gt: 0 }, // 只查找增加投入量的记录
          barcodeOperation: 'SCAN_PROCESS'
        }).sort({ operateTime: -1 });

        if (existingInputLog) {
          // 查找是否有后续的扣减操作（比如解绑）
          const subsequentDecreaseLog = await WorkOrderQuantityLog.findOne({
            workOrderId: workOrderId,
            relatedBarcode: relatedBarcode,
            changeType: 'input',
            changeQuantity: { $lt: 0 }, // 查找扣减投入量的记录
            operateTime: { $gt: existingInputLog.operateTime } // 在增加记录之后
          }).sort({ operateTime: -1 });

          // 如果存在增加记录且没有后续的扣减记录，说明已经增加过，跳过重复操作
          if (!subsequentDecreaseLog) {
            const errorMsg = `条码 ${relatedBarcode} 已在工单 ${workOrderId} 的工序中增加过投入量，操作时间: ${existingInputLog.operateTime.toISOString()}`;
            console.warn(`⚠️ ${errorMsg}`);
            throw new Error(`重复操作：${errorMsg}`);
          }
        }
      }

      // 先获取更新前的工单信息
      const beforeWorkOrder = await ProductionPlanWorkOrder
        .findById(workOrderId)
        .populate('materialId');

      if (!beforeWorkOrder) {
        throw new Error(`未找到工单(ID: ${workOrderId})`);
      }

      // 获取更新前的状态
      const beforeQuantity = beforeWorkOrder[updateField] || 0;
      const beforeStatus = beforeWorkOrder.status;
      const beforeProgress = beforeWorkOrder.progress || 0;

      // 扣减情况下，确保不会小于0
      if (quantity < 0) {
        if (beforeQuantity + quantity < 0) {
          const requestedDecrease = -quantity;
          quantity = -beforeQuantity;
          console.log(
            `工单(ID: ${workOrderId})${type === 'input' ? '投入' : '产出'}量不足，` +
            `最多扣减到0（当前量：${beforeQuantity}，请求扣减：${requestedDecrease}，实际扣减：${-quantity}）`
          );
        }
      }

      // 准备更新数据
      const updateData = {
        $inc: { [updateField]: quantity },
        $set: {
          updateTime: new Date(),
        },
      };

      // 如果需要设置createBy
      if (!beforeWorkOrder.createBy) {
        updateData.$set.createBy = beforeWorkOrder.updateBy;
      }

      // 如果是产出类型，计算新的进度
      if (type === 'output') {
        const newOutputQuantity = (beforeWorkOrder.outputQuantity || 0) + quantity;
        const planProductionQuantity = beforeWorkOrder.planProductionQuantity || 0;
        const scrapQuantity = beforeWorkOrder.scrapQuantity || 0;
        
        // 防止除零错误
        const totalTargetQuantity = planProductionQuantity + scrapQuantity;
        if (totalTargetQuantity > 0) {
          const newProgress = Math.min(100, Math.floor(
            (newOutputQuantity / totalTargetQuantity) * 100
          ));
          updateData.$set.progress = newProgress;
        }

        // 检查量为负数且原状态为已完成的情况
        if (quantity < 0 && beforeWorkOrder.status === 'COMPLETED') {
          updateData.$set.status = 'PAUSED';
          console.log(
            `工单(ID: ${workOrderId})因quantity为负数(${quantity})且原状态为已完成，被设置为暂停状态`
          );
        }
        // 检查是否应该完成工单
        else if (newOutputQuantity >= planProductionQuantity) {
          updateData.$set.status = 'COMPLETED';
          updateData.$set.endTime = new Date();
          updateData.$set.progress = 100;
          
          console.log(`工单(ID: ${workOrderId}) 完成判断:`, {
            newOutputQuantity,
            planProductionQuantity,
            scrapQuantity,
            shouldComplete: newOutputQuantity >= planProductionQuantity
          });
        }
      }

      // 执行原子更新操作
      const workOrder = await ProductionPlanWorkOrder.findOneAndUpdate(
        { _id: workOrderId },
        updateData,
        { 
          new: true,
          populate: 'materialId'
        }
      );

      if (!workOrder) {
        throw new Error(`更新工单失败(ID: ${workOrderId})`);
      }

      // 创建工单数量变更日志记录
      try {
        const logData = {
          // 工单信息
          workOrderId: workOrder._id,
          workOrderNo: workOrder.workOrderNo || workOrder.workOrderNumber || '',

          // 物料信息
          materialId: workOrder.materialId._id,
          materialCode: workOrder.materialId.FNumber || '',
          materialName: workOrder.materialId.FName || '',

          // 产线信息
          productionLineId: workOrder.productionLineId || '',
          productionLineName: workOrder.productionLineName || workOrder.lineName || '',

          // 变更信息
          changeType: type,
          changeQuantity: quantity,
          beforeQuantity: beforeQuantity,
          afterQuantity: workOrder[updateField],

          // 关联的主条码信息
          relatedBarcode: logContext.relatedBarcode || '',
          barcodeOperation: logContext.barcodeOperation || 'OTHER',

          // 工序信息
          processStepId: logContext.processStepId || null,
          processName: logContext.processName || '',
          processCode: logContext.processCode || '',

          // 工单状态变更
          beforeStatus: beforeStatus,
          afterStatus: workOrder.status,

          // 进度变更
          beforeProgress: beforeProgress,
          afterProgress: workOrder.progress || 0,

          // 操作信息
          operatorId: logContext.operatorId || 'SYSTEM',
          operatorName: logContext.operatorName || '',
          operateTime: new Date(),

          // 操作原因和备注
          reason: logContext.reason || 
            `${type === 'input' ? '投入' : '产出'}数量${quantity > 0 ? '增加' : '减少'}`,
          remark: logContext.remark || '',

          // 系统信息
          ipAddress: logContext.ipAddress || '',
          userAgent: logContext.userAgent || '',

          // 是否为自动操作
          isAutomatic: logContext.isAutomatic !== undefined ? logContext.isAutomatic : true,

          // 数据来源
          source: logContext.source || 'SYSTEM',
        };

        const quantityLog = new WorkOrderQuantityLog(logData);
        await quantityLog.save();

        console.log(`✅ 工单数量变更日志记录创建成功: ${quantityLog._id}`);
      } catch (logError) {
        console.error('❌ 创建工单数量变更日志失败:', logError);
        // 日志记录失败不影响主流程
      }

      // 如果工单完成，处理关联工单
      if (type === 'output' && workOrder.status === 'COMPLETED' && beforeStatus !== 'COMPLETED') {
        console.log(`✅ 工单(ID: ${workOrderId})已完成 - 产出量: ${workOrder.outputQuantity}, 计划数量: ${workOrder.planProductionQuantity}`);
        
        // 这里可以添加完成关联工单的逻辑
        // await this.completeRelatedWorkOrders(workOrder._id);
      }

      return {
        success: true,
        workOrderId: workOrder._id,
        workOrderNo: workOrder.workOrderNo,
        type: type,
        quantity: quantity,
        beforeQuantity: beforeQuantity,
        afterQuantity: workOrder[updateField],
        beforeStatus: beforeStatus,
        afterStatus: workOrder.status,
        beforeProgress: beforeProgress,
        afterProgress: workOrder.progress || 0,
        materialCode: workOrder.materialId?.FNumber || '',
        materialName: workOrder.materialId?.FName || ''
      };

    } catch (error) {
      console.error(
        `❌ 更新工单${type === 'input' ? '投入' : '产出'}数量失败:`,
        error
      );
      throw error;
    }
  }

  /**
   * 批量更新工单数量
   * @param {Array} updates - 更新数组 [{workOrderId, type, quantity, logContext}]
   */
  static async batchUpdateWorkOrderQuantity(updates) {
    const results = [];
    
    for (const update of updates) {
      try {
        const result = await this.updateWorkOrderQuantity(
          update.workOrderId,
          update.type,
          update.quantity,
          update.logContext || {}
        );
        results.push({ ...result, success: true });
      } catch (error) {
        results.push({
          success: false,
          workOrderId: update.workOrderId,
          type: update.type,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 获取工单详情
   */
  static async getWorkOrderDetail(workOrderId) {
    try {
      const workOrder = await ProductionPlanWorkOrder
        .findById(workOrderId)
        .populate('materialId')
        .populate('productionLineId');

      if (!workOrder) {
        return { success: false, error: '工单不存在' };
      }

      return {
        success: true,
        workOrder: {
          id: workOrder._id,
          workOrderNo: workOrder.workOrderNo,
          materialCode: workOrder.materialId?.FNumber || '',
          materialName: workOrder.materialId?.FName || '',
          status: workOrder.status,
          planQuantity: workOrder.planQuantity || 0,
          planProductionQuantity: workOrder.planProductionQuantity || 0,
          inputQuantity: workOrder.inputQuantity || 0,
          outputQuantity: workOrder.outputQuantity || 0,
          scrapQuantity: workOrder.scrapQuantity || 0,
          progress: workOrder.progress || 0,
          productionLineName: workOrder.lineName || '',
          createAt: workOrder.createAt,
          updateAt: workOrder.updateAt
        }
      };

    } catch (error) {
      console.error('❌ 获取工单详情失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 查询工单数量变更日志
   */
  static async getWorkOrderQuantityLogs(workOrderId, options = {}) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        changeType = null,
        startDate = null,
        endDate = null
      } = options;

      const query = { workOrderId };

      if (changeType) {
        query.changeType = changeType;
      }

      if (startDate || endDate) {
        query.operateTime = {};
        if (startDate) query.operateTime.$gte = new Date(startDate);
        if (endDate) query.operateTime.$lte = new Date(endDate);
      }

      const total = await WorkOrderQuantityLog.countDocuments(query);
      const logs = await WorkOrderQuantityLog
        .find(query)
        .sort({ operateTime: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      return {
        success: true,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        logs
      };

    } catch (error) {
      console.error('❌ 查询工单数量变更日志失败:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = WorkOrderService;

