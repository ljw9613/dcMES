/*
 * @name: 产品初始化日志服务
 * @content: 提供产品初始化日志的查询、统计等功能
 * @Author: AI Assistant
 * @Date: 2024-12-19
 */

const ProductInitializeLog = require("../model/project/productInitializeLog");
const mongoose = require("mongoose");

class ProductInitializeLogService {
  /**
   * 分页查询初始化日志
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.barcode - 产品条码
   * @param {string} params.materialCode - 物料编码
   * @param {string} params.operatorId - 操作员ID
   * @param {string} params.result - 操作结果
   * @param {Date} params.startTime - 开始时间
   * @param {Date} params.endTime - 结束时间
   * @param {string} params.workOrderNo - 工单号
   * @returns {Promise<Object>} 分页查询结果
   */
  static async getLogsByPage(params) {
    try {
      const {
        page = 1,
        pageSize = 20,
        barcode,
        materialCode,
        operatorId,
        result,
        startTime,
        endTime,
        workOrderNo,
      } = params;

      // 构建查询条件
      const query = {};

      if (barcode) {
        query.barcode = { $regex: barcode, $options: "i" };
      }

      if (materialCode) {
        query.materialCode = { $regex: materialCode, $options: "i" };
      }

      if (operatorId) {
        query.operatorId = operatorId;
      }

      if (result) {
        query.result = result;
      }

      if (workOrderNo) {
        query.workOrderNo = { $regex: workOrderNo, $options: "i" };
      }

      if (startTime || endTime) {
        query.operateTime = {};
        if (startTime) {
          query.operateTime.$gte = new Date(startTime);
        }
        if (endTime) {
          query.operateTime.$lte = new Date(endTime);
        }
      }

      // 计算跳过的记录数
      const skip = (page - 1) * pageSize;

      // 执行查询
      const [logs, total] = await Promise.all([
        ProductInitializeLog.find(query)
          .populate("operatorId", "username realName")
          .populate("materialId", "FName FNumber FSpecification")
          .populate("craftId", "craftName craftVersion")
          .populate("productionPlanWorkOrderId", "workOrderNo planProductionQuantity")
          .sort({ operateTime: -1 })
          .skip(skip)
          .limit(parseInt(pageSize)),
        ProductInitializeLog.countDocuments(query),
      ]);

      return {
        success: true,
        data: {
          logs,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    } catch (error) {
      console.error("查询初始化日志失败:", error);
      throw error;
    }
  }

  /**
   * 根据条码查询初始化历史
   * @param {string} barcode - 产品条码
   * @returns {Promise<Array>} 初始化历史记录
   */
  static async getLogsByBarcode(barcode) {
    try {
      const logs = await ProductInitializeLog.find({ barcode })
        .populate("operatorId", "username realName")
        .populate("materialId", "FName FNumber FSpecification")
        .populate("craftId", "craftName craftVersion")
        .populate("productionPlanWorkOrderId", "workOrderNo planProductionQuantity")
        .sort({ operateTime: -1 });

      return {
        success: true,
        data: logs,
      };
    } catch (error) {
      console.error("查询条码初始化历史失败:", error);
      throw error;
    }
  }

  /**
   * 获取初始化统计信息
   * @param {Object} params - 统计参数
   * @param {Date} params.startTime - 开始时间
   * @param {Date} params.endTime - 结束时间
   * @param {string} params.operatorId - 操作员ID
   * @returns {Promise<Object>} 统计结果
   */
  static async getStatistics(params) {
    try {
      const { startTime, endTime, operatorId } = params;

      // 构建查询条件
      const matchCondition = {};

      if (startTime || endTime) {
        matchCondition.operateTime = {};
        if (startTime) {
          matchCondition.operateTime.$gte = new Date(startTime);
        }
        if (endTime) {
          matchCondition.operateTime.$lte = new Date(endTime);
        }
      }

      if (operatorId) {
        matchCondition.operatorId = new mongoose.Types.ObjectId(operatorId);
      }

      // 执行聚合查询
      const statistics = await ProductInitializeLog.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ["$result", "SUCCESS"] }, 1, 0] },
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ["$result", "FAILED"] }, 1, 0] },
            },
            inputAdjustmentTotal: {
              $sum: "$workOrderAdjustment.inputAdjustmentAmount",
            },
            outputAdjustmentTotal: {
              $sum: "$workOrderAdjustment.outputAdjustmentAmount",
            },
          },
        },
      ]);

      // 按操作员统计
      const operatorStats = await ProductInitializeLog.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: "$operatorId",
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ["$result", "SUCCESS"] }, 1, 0] },
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ["$result", "FAILED"] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: "user_logins",
            localField: "_id",
            foreignField: "_id",
            as: "operator",
          },
        },
        {
          $unwind: "$operator",
        },
        {
          $project: {
            operatorId: "$_id",
            operatorName: "$operator.realName",
            username: "$operator.username",
            count: 1,
            successCount: 1,
            failedCount: 1,
            successRate: {
              $multiply: [{ $divide: ["$successCount", "$count"] }, 100],
            },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // 按日期统计
      const dailyStats = await ProductInitializeLog.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$operateTime" },
            },
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ["$result", "SUCCESS"] }, 1, 0] },
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ["$result", "FAILED"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 }, // 最近30天
      ]);

      const result = statistics[0] || {
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        inputAdjustmentTotal: 0,
        outputAdjustmentTotal: 0,
      };

      return {
        success: true,
        data: {
          overview: {
            ...result,
            successRate: result.totalCount > 0 
              ? Math.round((result.successCount / result.totalCount) * 100) 
              : 0,
          },
          operatorStats,
          dailyStats,
        },
      };
    } catch (error) {
      console.error("获取初始化统计信息失败:", error);
      throw error;
    }
  }

  /**
   * 根据ID获取日志详情
   * @param {string} logId - 日志ID
   * @returns {Promise<Object>} 日志详情
   */
  static async getLogById(logId) {
    try {
      const log = await ProductInitializeLog.findById(logId)
        .populate("operatorId", "username realName")
        .populate("materialId", "FName FNumber FSpecification")
        .populate("craftId", "craftName craftVersion")
        .populate("productionPlanWorkOrderId", "workOrderNo planProductionQuantity");

      if (!log) {
        throw new Error("未找到指定的日志记录");
      }

      return {
        success: true,
        data: log,
      };
    } catch (error) {
      console.error("获取日志详情失败:", error);
      throw error;
    }
  }

  /**
   * 删除指定时间范围内的日志记录
   * @param {Date} beforeDate - 删除此日期之前的记录
   * @returns {Promise<Object>} 删除结果
   */
  static async cleanupLogs(beforeDate) {
    try {
      const result = await ProductInitializeLog.deleteMany({
        operateTime: { $lt: new Date(beforeDate) },
      });

      return {
        success: true,
        message: `成功删除 ${result.deletedCount} 条日志记录`,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      console.error("清理日志记录失败:", error);
      throw error;
    }
  }

  /**
   * 导出日志数据
   * @param {Object} params - 导出参数
   * @returns {Promise<Array>} 导出数据
   */
  static async exportLogs(params) {
    try {
      const {
        barcode,
        materialCode,
        operatorId,
        result,
        startTime,
        endTime,
        workOrderNo,
      } = params;

      // 构建查询条件
      const query = {};

      if (barcode) {
        query.barcode = { $regex: barcode, $options: "i" };
      }

      if (materialCode) {
        query.materialCode = { $regex: materialCode, $options: "i" };
      }

      if (operatorId) {
        query.operatorId = operatorId;
      }

      if (result) {
        query.result = result;
      }

      if (workOrderNo) {
        query.workOrderNo = { $regex: workOrderNo, $options: "i" };
      }

      if (startTime || endTime) {
        query.operateTime = {};
        if (startTime) {
          query.operateTime.$gte = new Date(startTime);
        }
        if (endTime) {
          query.operateTime.$lte = new Date(endTime);
        }
      }

      const logs = await ProductInitializeLog.find(query)
        .populate("operatorId", "username realName")
        .populate("materialId", "FName FNumber FSpecification")
        .populate("craftId", "craftName craftVersion")
        .populate("productionPlanWorkOrderId", "workOrderNo planProductionQuantity")
        .sort({ operateTime: -1 })
        .lean();

      // 转换为导出格式
      const exportData = logs.map((log) => ({
        条码: log.barcode,
        物料编码: log.materialCode,
        物料名称: log.materialName,
        物料规格: log.materialSpec,
        工艺名称: log.craftName,
        工艺版本: log.craftVersion,
        工单号: log.workOrderNo,
        产线ID: log.productLineId,
        产线名称: log.productLineName,
        初始化前状态: log.beforeInitialize.status,
        初始化前进度: `${log.beforeInitialize.progress}%`,
        总节点数: log.beforeInitialize.totalNodes,
        已完成节点数: log.beforeInitialize.completedNodes,
        投入量调整: log.workOrderAdjustment.inputQuantityAdjusted ? "是" : "否",
        投入量调整数量: log.workOrderAdjustment.inputAdjustmentAmount,
        产出量调整: log.workOrderAdjustment.outputQuantityAdjusted ? "是" : "否",
        产出量调整数量: log.workOrderAdjustment.outputAdjustmentAmount,
        操作员: log.operatorId?.realName || log.operatorId?.username || "",
        操作时间: log.operateTime,
        操作原因: log.reason,
        备注: log.remark,
        操作结果: log.result === "SUCCESS" ? "成功" : "失败",
        错误信息: log.errorMessage || "",
        IP地址: log.ipAddress,
      }));

      return {
        success: true,
        data: exportData,
      };
    } catch (error) {
      console.error("导出日志数据失败:", error);
      throw error;
    }
  }
}

module.exports = ProductInitializeLogService; 