const productionPlanWorkOrder = require("../model/project/productionPlanWorkOrder");
const MaterialPalletizing = require("../model/project/materialPalletizing");
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const ProductLine = require("../model/project/productionLine");
const materialProcessFlowService = require("./materialProcessFlowService");
const MaterialPalletizingUnbindLog = require("../model/project/materialPalletizingUnbindLog");
const WarehouseEntry = require("../model/warehouse/warehouseEntry");
const MaterialPalletizingErrorLog = require("../model/project/materialPalletizingErrorLog");
const mongoose = require("mongoose");

/**
 * 托盘组装服务 - 已在模型中定义防重复索引
 * 
 * 关键索引（已在 materialPalletizing.js 模型中定义）：
 * - unique_barcode_in_active_pallets: 防止活跃托盘中条码重复
 * - unique_box_barcode_in_active_pallets: 防止活跃托盘中包装箱条码重复
 * 
 * 性能优化索引：
 * - palletBarcodes.barcode + status: 快速查找条码状态
 * - boxItems.boxBarcode + status: 快速查找包装箱状态
 * - productLineId + status + materialId: 产线物料组合查询
 * - saleOrderId + materialId: 销售订单物料查询
 * 
 * 注意：本服务使用重试机制和数据库层面的唯一约束来确保数据一致性，
 * 特别适用于PM2负载均衡环境下的并发控制。
 */

class MaterialPalletizingService {
  /**
   * 添加托盘条码
   * @param {String} lineId - 产线ID
   * @param {String} processStepId - 工序ID
   * @param {String} mainBarcode - 主条码
   * @param {String} materialId - 物料ID
   * @param {String} materialCode - 物料编码
   * @param {String} materialName - 物料名称
   * @param {String} materialSpec - 物料规格
   * @param {String} boxBarcode - 箱条码(可选)
   * @param {Number} totalQuantity - 托盘条码批次数量
   * @param {Array} componentScans - 子物料信息
   * @param {Boolean} fromRepairStation - 是否来自维修台，默认为false
   */
  static async handlePalletBarcode(
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
    fromRepairStation = false
  ) {
    // ===== Redis 分布式锁保护 =====
    const { palletLockManager } = require('./queueService');
    const workerId = `direct_${process.pid}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const palletKey = mainBarcode;
    let lockAcquired = false;
    const lockStartTime = Date.now();

    try {
      console.log(`🔐 [直接调用] 尝试获取托盘锁: ${palletKey}, Worker: ${workerId}`);
      
      // 🔧 优化：调整锁等待时间与队列处理器保持一致
      const maxLockWaitTime = 18000; // 18秒等待时间
      while (Date.now() - lockStartTime < maxLockWaitTime) {
        lockAcquired = await palletLockManager.acquireLock(palletKey, workerId);
        if (lockAcquired) {
          break;
        }
        
        // 检查锁状态并记录日志
        const lockStatus = await palletLockManager.getLockStatus(palletKey);
        console.log(`⏳ [直接调用] 等待托盘锁释放: ${palletKey}, 当前持有者: ${lockStatus.owner}, 剩余时间: ${lockStatus.remainingTime}ms`);
        
        // 等待200ms后重试
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (!lockAcquired) {
        // 记录锁获取失败的详细信息
        const lockStatus = await palletLockManager.getLockStatus(palletKey);
        const errorMessage = `条码 ${mainBarcode} 正在被其他进程处理，无法获取分布式锁。当前锁持有者: ${lockStatus.owner || 'unknown'}, 剩余时间: ${lockStatus.remainingTime}ms`;
        
        console.error(`❌ [直接调用] ${errorMessage}`);
        
        // 记录锁冲突错误
        await this.logError({
          errorType: "LOCK_ACQUISITION_FAILED",
          operation: "ACQUIRE_PALLET_LOCK",
          error: new Error(errorMessage),
          barcode: mainBarcode,
          productLineId: lineId,
          productLineName: lineName,
          processStepId,
          materialId,
          materialCode,
          materialName,
          boxBarcode,
          context: {
            fromRepairStation,
            componentScans,
            lockStatus,
            workerId,
            waitTime: Date.now() - lockStartTime
          },
          userId,
          impactLevel: "HIGH"
        });
        
        throw new Error(errorMessage);
      }

      console.log(`✅ [直接调用] 成功获取托盘锁: ${palletKey}, Worker: ${workerId}`);

      // 定期扩展锁的有效期，防止长时间处理导致锁过期
      const extendLockInterval = setInterval(async () => {
        try {
          const extended = await palletLockManager.extendLock(palletKey, workerId);
          if (extended) {
            console.log(`🔄 [直接调用] 托盘锁续期成功: ${palletKey}`);
          } else {
            console.warn(`⚠️ [直接调用] 托盘锁续期失败: ${palletKey}`);
          }
        } catch (extendError) {
          console.error(`❌ [直接调用] 托盘锁续期异常: ${palletKey}`, extendError);
        }
      }, 10000); // 每10秒扩展一次

      try {
        // 直接调用处理方法，依赖Redis锁保护而非重试机制
        const result = await this._handlePalletBarcodeWithRetry(
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
        
        console.log(`✅ [直接调用] 托盘处理成功: ${mainBarcode}, Worker: ${workerId}`);
        return result;
        
      } catch (error) {
        // 记录处理失败错误（无重试，依赖Redis锁保护）
        console.error(`❌ [直接调用] 托盘处理失败: ${mainBarcode}, Worker: ${workerId}`, error);
        
        await this.logError({
          errorType: "PALLET_PROCESSING_FAILED",
          operation: "HANDLE_PALLET_BARCODE",
          error,
          barcode: mainBarcode,
          productLineId: lineId,
          productLineName: lineName,
          processStepId,
          materialId,
          materialCode,
          materialName,
          boxBarcode,
          context: {
            fromRepairStation,
            componentScans,
            workerId,
            totalProcessingTime: Date.now() - lockStartTime,
            noRetryMode: true
          },
          userId,
          impactLevel: "HIGH"
        });
        
        throw error;
      } finally {
        // 清理锁续期定时器
        if (extendLockInterval) {
          clearInterval(extendLockInterval);
        }
      }
      
    } catch (outerError) {
      console.error(`❌ [直接调用] 托盘处理外层错误: ${mainBarcode}, Worker: ${workerId}`, outerError);
      throw outerError;
    } finally {
      // 无论成功还是失败都要释放分布式锁
      if (lockAcquired) {
        try {
          const released = await palletLockManager.releaseLock(palletKey, workerId);
          if (released) {
            console.log(`🔓 [直接调用] 成功释放托盘锁: ${palletKey}, Worker: ${workerId}`);
          } else {
            console.warn(`⚠️ [直接调用] 托盘锁释放失败（可能已过期）: ${palletKey}, Worker: ${workerId}`);
          }
        } catch (releaseError) {
          console.error(`❌ [直接调用] 释放托盘锁异常: ${palletKey}, Worker: ${workerId}`, releaseError);
          
          // 记录锁释放失败，但不影响主流程
          try {
            await this.logError({
              errorType: "LOCK_RELEASE_FAILED",
              operation: "RELEASE_PALLET_LOCK",
              error: releaseError,
              barcode: mainBarcode,
              context: {
                workerId,
                palletKey,
                processingTime: Date.now() - lockStartTime
              },
              userId,
              impactLevel: "MEDIUM"
            });
          } catch (logError) {
            console.error(`❌ [直接调用] 记录锁释放失败日志异常: ${palletKey}`, logError);
          }
        }
      }
    }
  }

  static async _handlePalletBarcodeWithRetry(
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
    fromRepairStation = false
  ) {
    // 直接调用内部方法，依赖Redis分布式锁保护，不使用重试机制
    return await this._handlePalletBarcodeInternalSimple(
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
  }

  /**
   * 处理托盘条码的内部实现
   * 修改版本：确保工序绑定和托盘入托的强一致性
   */
  static async _handlePalletBarcodeInternal(
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
    fromRepairStation = false
  ) {
    let session = null;
    try {
      console.log(`开始处理托盘条码: ${mainBarcode}, 盒条码: ${boxBarcode}, 来自维修台: ${fromRepairStation}`);

      // 使用MongoDB事务确保数据一致性
      session = await MaterialPalletizing.startSession();
      session.startTransaction({
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
      });

      // 步骤1：并发检查 - 确保条码没有被其他进程处理
      const duplicateCheck = await MaterialPalletizing.findOne({
        "palletBarcodes.barcode": mainBarcode,
        status: { $in: ["STACKING", "STACKED"] }
      }).session(session).read('primary');
      
      if (duplicateCheck) {
        throw new Error(`条码 ${mainBarcode} 已被托盘 ${duplicateCheck.palletCode} 使用`);
      }

      // 步骤2：获取或创建托盘
      let pallet = await this._getOrCreatePallet(
        lineId,
        lineName,
        processStepId,
        materialId,
        materialCode,
        materialName,
        materialSpec,
        totalQuantity,
        userId,
        fromRepairStation,
        session
      );

      // 关键验证：确保托盘编号不为空
      if (!pallet || !pallet.palletCode) {
        throw new Error("托盘初始化失败，托盘编号为空");
      }

      console.log(`使用托盘: ${pallet.palletCode}`);

      // 步骤3：处理盒条码验证（如果存在）
      if (boxBarcode) {
        await this._validateBoxBarcode(boxBarcode, materialId, userId, pallet.productLineId, session, pallet._id);
      }

      // 步骤4：处理工单信息
      const productionPlanWorkOrderId = await this._handleWorkOrderInfo(
        mainBarcode,
        pallet,
        fromRepairStation,
        session
      );

      // 步骤5：添加条码到托盘
      this._addBarcodeToPllet(
        pallet,
        mainBarcode,
        boxBarcode,
        productionPlanWorkOrderId,
        userId,
        componentScans
      );

      // 步骤6：验证托盘完整性
      pallet = this.cleanZeroQuantityWorkOrders(pallet);
      if (pallet.workOrders.length === 0) {
        throw new Error("托盘中没有有效的工单信息，无法保存");
      }

      // 步骤7：**先触发工序完成**（在事务内进行，确保工序绑定成功）
      console.log(`开始触发工序完成: ${mainBarcode}, 托盘编号: ${pallet.palletCode}`);
      try {
        await materialProcessFlowService.scanBatchDocument(
          mainBarcode,
          pallet.processStepId,
          pallet.palletCode,
          componentScans,
          userId,
          pallet.productLineId,
          fromRepairStation // 传递是否来自维修台
        );
        console.log(`条码 ${mainBarcode} 工序完成触发成功`);
      } catch (processError) {
        console.error(`条码 ${mainBarcode} 工序完成触发失败:`, processError);
        // 工序失败，抛出错误，让事务回滚
        throw new Error(`工序绑定失败，产品不能入托: ${processError.message}`);
      }

      // 步骤8：**工序成功后再保存托盘**
      await pallet.save({ session });
      console.log(`托盘条码 ${mainBarcode} 已成功保存到托盘 ${pallet.palletCode}`);

      // 步骤9：提交事务，确保工序绑定和托盘保存都成功
      await session.commitTransaction();
      console.log(`工序绑定和托盘入托事务提交成功，条码 ${mainBarcode} 处理完成`);
      
      return pallet;
    } catch (error) {
      console.error("处理托盘条码失败:", error);
      
      // 如果存在事务，则回滚
      if (session && session.inTransaction()) {
        await session.abortTransaction();
        console.log("工序绑定和托盘入托事务已回滚");
      }
      
      throw error;
    } finally {
      // 结束会话
      if (session) {
        await session.endSession();
      }
    }
  }

  /**
   * 清理托盘中数量为0的工单信息
   * @param {Object} pallet - 托盘对象
   * @returns {Object} 清理后的托盘对象
   */
  static cleanZeroQuantityWorkOrders(pallet) {
    // 确保工单数组存在
    if (!pallet.workOrders || !Array.isArray(pallet.workOrders)) {
      return pallet;
    }
    // 过滤掉数量为0的工单
    pallet.workOrders = pallet.workOrders.filter((wo) => wo.quantity > 0);

    return pallet;
  }

  /**
   * 解绑条码
   * @param {String} palletCode - 托盘编号
   * @param {String} barcode - 需要解绑的条码
   * @param {String} userId - 操作用户ID
   * @param {String} reason - 解绑原因
   * @param {boolean} fromProcessUnbind - 是否来自工序解绑
   */
  static async unbindBarcode(
    palletCode,
    barcode,
    userId,
    reason = "托盘解绑",
    fromProcessUnbind = false
  ) {
    try {
      console.log(
        `开始解绑托盘条码: ${palletCode}, 条码: ${barcode}, fromProcessUnbind: ${fromProcessUnbind},userId: ${userId}`
      );

      const pallet = await MaterialPalletizing.findOne({ palletCode });
      if (!pallet) {
        throw new Error("未找到对应的托盘记录");
      }

      // 检查托盘是否已出库
      if (pallet.inWarehouseStatus === "OUT_WAREHOUSE") {
        throw new Error("已出库的托盘不可以进行解绑操作");
      }

      // 保存解绑前的托盘数据快照
      const originalData = pallet.toObject();
      const affectedBarcodes = [];

      // 检查是否为箱条码
      const boxItem = pallet.boxItems.find(
        (item) => item.boxBarcode === barcode
      );
      
      if (boxItem) {
        // 检查箱内所有条码的出库状态
        const outWarehouseBarcodes = boxItem.boxBarcodes.filter((bb) => {
          const palletBarcode = pallet.palletBarcodes.find(
            (pb) => pb.barcode === bb.barcode
          );
          return palletBarcode && palletBarcode.outWarehouseStatus === "COMPLETED";
        });

        if (outWarehouseBarcodes.length > 0) {
          const outBarcodeList = outWarehouseBarcodes.map(bb => bb.barcode).join(", ");
          throw new Error(
            `箱条码 ${barcode} 中包含已出库的产品，不能解绑。已出库的条码: ${outBarcodeList}`
          );
        }

        // 记录所有受影响的条码
        boxItem.boxBarcodes.forEach((bb) => {
          affectedBarcodes.push({
            barcode: bb.barcode,
            barcodeType: "MAIN",
            boxBarcode: boxItem.boxBarcode,
          });
        });

        // 创建解绑日志
        await MaterialPalletizingUnbindLog.create({
          palletCode,
          unbindType: "BOX",
          unbindBarcode: barcode,
          originalData,
          affectedBarcodes,
          reason,
          createBy: userId,
          fromProcessUnbind, // 记录是否来自工序解绑
        });

        // 当解绑箱条码时，扣减箱内每个产品条码对应工单的数量
        if (pallet.workOrders && pallet.workOrders.length > 0) {
          console.log('解绑前的工单数量:', JSON.stringify(pallet.workOrders, null, 2));
          
          // 创建一个 Map 来跟踪每个工单需要减少的数量
          const workOrderQuantityMap = new Map();
          
          boxItem.boxBarcodes.forEach((boxBarcode) => {
            // 在 palletBarcodes 中查找对应的条码记录
            const palletBarcode = pallet.palletBarcodes.find(
              pb => pb.barcode === boxBarcode.barcode
            );
            
            if (palletBarcode && palletBarcode.productionPlanWorkOrderId) {
              const workOrderId = palletBarcode.productionPlanWorkOrderId.toString();
              const currentCount = workOrderQuantityMap.get(workOrderId) || 0;
              workOrderQuantityMap.set(workOrderId, currentCount + 1);
              console.log(`工单 ${workOrderId} 需要减少的数量: ${currentCount + 1}`);
            }
          });

          console.log('需要减少的工单数量映射:', Object.fromEntries(workOrderQuantityMap));

          // 更新工单数量
          const updatedWorkOrders = pallet.workOrders.map(workOrder => {
            if (workOrder.productionPlanWorkOrderId) {
              const workOrderId = workOrder.productionPlanWorkOrderId.toString();
              const quantityToReduce = workOrderQuantityMap.get(workOrderId) || 0;
              console.log(`工单 ${workOrderId} 当前数量: ${workOrder.quantity}, 需要减少: ${quantityToReduce}`);
              
              if (quantityToReduce > 0) {
                const newQuantity = Math.max(0, workOrder.quantity - quantityToReduce);
                console.log(`工单 ${workOrderId} 更新后数量: ${newQuantity}`);
                return {
                  ...workOrder.toObject ? workOrder.toObject() : workOrder,
                  quantity: newQuantity
                };
              }
            }
            return workOrder.toObject ? workOrder.toObject() : workOrder;
          }).filter(wo => wo.quantity > 0);

          console.log('更新后的工单数量:', JSON.stringify(updatedWorkOrders, null, 2));

          // 使用 $set 操作符更新整个 workOrders 数组
          const updateResult = await MaterialPalletizing.updateOne(
            { _id: pallet._id },
            { 
              $set: { 
                workOrders: updatedWorkOrders,
                updateAt: new Date(),
                updateBy: userId
              }
            }
          );

          console.log('数据库更新结果:', updateResult);

          // 更新内存中的 pallet 对象
          pallet.workOrders = updatedWorkOrders;

          console.log(`解绑箱条码 ${barcode} 后，工单数量更新为:`, JSON.stringify(updatedWorkOrders, null, 2));
        }

        // 解绑整个箱子
        // 1. 解绑箱内所有条码的工序状态
        // 强化循环调用保护：只有在不是从工序解绑调用过来时，才需要调用工序解绑
        if (!fromProcessUnbind) {
          console.log(`托盘解绑：箱条码 ${barcode}，需要调用工序解绑`);
          for (const boxBarcode of boxItem.boxBarcodes) {
            try {
              await materialProcessFlowService.unbindProcessComponents(
                boxBarcode.barcode,
                pallet.processStepId,
                userId,
                "托盘解绑",
                true, // 解绑后续工序
                true // 明确标记为来自托盘解绑调用
              );
            } catch (error) {
              console.error(
                `解绑箱内条码 ${boxBarcode.barcode} 的工序状态失败:`,
                error.message
              );
              // 继续处理其他条码，不中断整个流程
            }
          }
        } else {
          console.log(
            `托盘解绑：箱条码 ${barcode}，来自工序解绑调用，跳过工序解绑`
          );
        }

        // 2. 从托盘条码列表中移除箱内所有条码
        pallet.palletBarcodes = pallet.palletBarcodes.filter(
          (pb) => !boxItem.boxBarcodes.some((bb) => bb.barcode === pb.barcode)
        );

        // 3. 移除箱记录
        pallet.boxItems = pallet.boxItems.filter(
          (item) => item.boxBarcode !== barcode
        );

        // 4. 更新入库单中的数据
        await this.updateWarehouseEntryAfterUnbind(
          palletCode,
          boxItem.boxBarcodes.map((bb) => bb.barcode)
        );
      } else {
        // 检查单个条码的出库状态
        const palletBarcode = pallet.palletBarcodes.find(
          (pb) => pb.barcode === barcode
        );
        
        if (!palletBarcode) {
          throw new Error(`条码 ${barcode} 不在托盘 ${palletCode} 中`);
        }
        
        if (palletBarcode.outWarehouseStatus === "COMPLETED") {
          throw new Error(`条码 ${barcode} 已出库，不能进行解绑操作`);
        }

        // 检查条码是否在箱内
        const isInBox = pallet.boxItems.some((item) =>
          item.boxBarcodes.some((bb) => bb.barcode === barcode)
        );

        if (isInBox) {
          throw new Error("该条码属于包装箱内，请先解绑对应的箱条码");
        }

        // 记录单个条码解绑
        affectedBarcodes.push({
          barcode: barcode,
          barcodeType: "MAIN",
        });

        // 创建解绑日志
        await MaterialPalletizingUnbindLog.create({
          palletCode,
          unbindType: "SINGLE",
          unbindBarcode: barcode,
          originalData,
          affectedBarcodes,
          reason,
          createBy: userId,
          fromProcessUnbind, // 记录是否来自工序解绑
        });

        // 查找主条码对应的流程记录
        const flowRecord = await MaterialProcessFlow.findOne({
          barcode: barcode,
        });

        // 强化循环调用保护：只在不是来自工序解绑的情况下才调用工序解绑
        if (flowRecord && !fromProcessUnbind) {
          console.log(`托盘解绑：单个条码 ${barcode}，需要调用工序解绑`);
          // 查找工序节点
          const processNode = flowRecord.processNodes.find(
            (node) =>
              node.processStepId &&
              node.processStepId.toString() ===
                pallet.processStepId.toString() &&
              node.nodeType === "PROCESS_STEP"
          );

          if (processNode) {
            try {
              // 解绑单个条码
              await materialProcessFlowService.unbindProcessComponents(
                barcode,
                pallet.processStepId,
                userId,
                "托盘解绑", // 添加解绑原因
                true, // 解绑后续工序
                true // 明确标记为来自托盘解绑调用
              );
            } catch (error) {
              console.error(
                `解绑条码 ${barcode} 的工序状态失败:`,
                error.message
              );
              // 不抛出异常，继续处理托盘解绑
            }
          }
        } else if (fromProcessUnbind) {
          console.log(
            `托盘解绑：单个条码 ${barcode}，来自工序解绑调用，跳过工序解绑`
          );
        }

        // 找到条码对应的工单记录并减少计数
        if (
          palletBarcode &&
          palletBarcode.productionPlanWorkOrderId &&
          pallet.workOrders
        ) {
          const workOrderIndex = pallet.workOrders.findIndex(
            (wo) =>
              wo.productionPlanWorkOrderId &&
              wo.productionPlanWorkOrderId.toString() ===
                palletBarcode.productionPlanWorkOrderId.toString()
          );

          if (
            workOrderIndex !== -1 &&
            pallet.workOrders[workOrderIndex].quantity > 0
          ) {
            pallet.workOrders[workOrderIndex].quantity -= 1;
          }
        }

        // 2. 从托盘条码列表中移除
        pallet.palletBarcodes = pallet.palletBarcodes.filter(
          (pb) => pb.barcode !== barcode
        );

        // 3. 更新入库单中的数据
        await this.updateWarehouseEntryAfterUnbind(palletCode, [barcode]);
      }

      // 更新托盘状态和计数
      pallet.barcodeCount = pallet.palletBarcodes.length;
      pallet.boxCount = pallet.boxItems.length;

      // 检查原托盘状态，如果是组托完成(STACKED)状态，则更新为维修中状态
      if (pallet.status === "STACKED") {
        pallet.repairStatus = "REPAIRING"; // 设置为维修中状态
        console.log(`托盘 ${palletCode} 从组托完成状态解绑，更新为维修中状态`);
      }

      // 无论维修状态如何，都将组托状态重置为组托中
      pallet.status = "STACKING"; // 解绑后重置为组托中状态

      // 检查托盘的出入库状态，对于部分出库的托盘，需要检查是否还有已出库的条码
      if (pallet.inWarehouseStatus === "PART_OUT_WAREHOUSE") {
        // 检查是否还有任何条码是已出库状态
        const anyBarcodeStillOut = pallet.palletBarcodes.some(
          (pb) => pb.outWarehouseStatus === "COMPLETED"
        );

        // 如果没有任何条码是已出库状态，将托盘状态恢复为"已入库"
        if (!anyBarcodeStillOut) {
          pallet.inWarehouseStatus = "IN_WAREHOUSE";
        }
      }

      // 清理数量为0的工单
      this.cleanZeroQuantityWorkOrders(pallet);

      // updateAt由pre-save中间件自动处理
      pallet.updateBy = userId;

      await pallet.save();
      console.log(`完成解绑托盘条码: ${palletCode}, 条码: ${barcode}`);
      return pallet;
    } catch (error) {
      console.error("解绑条码失败:", error);
      throw error;
    }
  }

  static async unbindPalletBarcode(
    palletCode,
    userId,
    reason = "托盘整体解绑"
  ) {
    try {
      const pallet = await MaterialPalletizing.findOne({ palletCode });
      if (!pallet) {
        throw new Error("未找到对应的托盘记录");
      }

      // 检查托盘是否已出库
      if (pallet.inWarehouseStatus === "OUT_WAREHOUSE") {
        throw new Error("已出库的托盘不可以进行解绑操作");
      }

      // 保存解绑前的托盘数据快照
      const originalData = pallet.toObject();
      const affectedBarcodes = [];

      // 收集所有受影响的条码
      pallet.boxItems.forEach((boxItem) => {
        boxItem.boxBarcodes.forEach((bb) => {
          affectedBarcodes.push({
            barcode: bb.barcode,
            barcodeType: "MAIN",
            boxBarcode: boxItem.boxBarcode,
          });
        });
      });

      pallet.palletBarcodes.forEach((pb) => {
        const isInBox = pallet.boxItems.some((item) =>
          item.boxBarcodes.some((bb) => bb.barcode === pb.barcode)
        );
        if (!isInBox) {
          affectedBarcodes.push({
            barcode: pb.barcode,
            barcodeType: "MAIN",
          });
        }
      });

      // 创建解绑日志
      await MaterialPalletizingUnbindLog.create({
        palletCode,
        unbindType: "PALLET",
        unbindBarcode: palletCode,
        originalData,
        affectedBarcodes,
        reason,
        createBy: userId,
      });

      // 收集所有条码，用于更新入库单
      const allBarcodes = pallet.palletBarcodes.map((pb) => pb.barcode);

      // 解绑整个托盘
      // 1. 解绑所有条码的工序状态
      for (const palletBarcode of pallet.palletBarcodes) {
        await materialProcessFlowService.unbindProcessComponents(
          palletBarcode.barcode,
          pallet.processStepId,
          userId,
          "托盘解绑",
          true,
          true
        );
      }

      // 移除工单产出量扣减代码，因为 unbindProcessComponents 已经处理了这个逻辑

      // 2. 清空托盘条码列表和箱记录
      pallet.palletBarcodes = [];
      pallet.boxItems = [];

      // 3. 更新入库单中的数据
      await this.updateWarehouseEntryAfterUnbind(palletCode, allBarcodes);

      // 更新托盘状态和计数
      pallet.barcodeCount = 0;
      pallet.boxCount = 0;

      // 检查原托盘状态，如果是组托完成(STACKED)状态，则更新为维修中状态
      if (pallet.status === "STACKED") {
        pallet.repairStatus = "REPAIRING";
        console.log(
          `托盘 ${palletCode} 整体解绑，从组托完成状态更新为维修中状态`
        );
      }

      // 无论维修状态如何，都将组托状态重置为组托中
      pallet.status = "STACKING";

      // 清理所有工单信息
      pallet.workOrders = [];

      // updateAt由pre-save中间件自动处理
      pallet.updateBy = userId;

      await pallet.save();
      return pallet;
    } catch (error) {
      console.error("解绑托盘所有条码失败:", error);
      throw error;
    }
  }

  /**
   * 拆分托盘
   * @param {String} originalPalletCode - 原托盘编号
   * @param {Array} barcodes - 要拆分的条码列表
   * @param {String} userId - 操作用户ID
   * @returns {Object} 拆分后的新托盘对象
   */
  static async splitPallet(originalPalletCode, barcodes, userId) {
    try {
      // 1. 查找原托盘
      const originalPallet = await MaterialPalletizing.findOne({
        palletCode: originalPalletCode,
      }).lean();

      if (!originalPallet) {
        throw new Error("未找到原托盘记录");
      }

      // 检查原托盘的出入库状态
      if (originalPallet.inWarehouseStatus === "OUT_WAREHOUSE") {
        throw new Error("已出库的托盘不可拆分");
      }

      // 2. 验证所有条码是否存在于原托盘
      // 收集所有有效的条码：包括托盘条码和箱条码
      const allPalletBarcodes = originalPallet.palletBarcodes.map(
        (pb) => pb.barcode
      );
      const allBoxBarcodes = originalPallet.boxItems.map(
        (boxItem) => boxItem.boxBarcode
      );
      const allValidBarcodes = [...allPalletBarcodes, ...allBoxBarcodes];
      
      const invalidBarcodes = barcodes.filter(
        (barcode) => !allValidBarcodes.includes(barcode)
      );

      if (invalidBarcodes.length > 0) {
        throw new Error(
          `以下条码不存在于原托盘中: ${invalidBarcodes.join(", ")}`
        );
      }

      // 检查要拆分的条码中是否有已出库的条码
      const outWarehouseBarcodes = barcodes.filter((barcode) => {
        const palletBarcode = originalPallet.palletBarcodes.find(
          (pb) => pb.barcode === barcode
        );
        return (
          palletBarcode && palletBarcode.outWarehouseStatus === "COMPLETED"
        );
      });

      if (outWarehouseBarcodes.length > 0) {
        throw new Error(
          `已出库的产品不能拆分，以下条码已出库: ${outWarehouseBarcodes.join(
            ", "
          )}`
        );
      }

      // 3. 计算新托盘的编号（序列号递增）
      const splitCount = await this.getSplitCount(originalPalletCode);
      const newPalletCode = `${originalPalletCode}-${splitCount + 1}`;

      // 4. 创建新托盘对象时包含工单信息
      const newPallet = {
        ...originalPallet,
        _id: undefined,
        palletCode: newPalletCode,
        palletBarcodes: [],
        boxItems: [],
        barcodeCount: 0,
        boxCount: 0,
        status: "STACKED", // 新托盘设置为组托完成状态
        // 新托盘的出入库状态先继承原托盘状态，后续会根据拆分的条码状态进行更新
        inWarehouseStatus: originalPallet.inWarehouseStatus,
        createAt: new Date(),
        updateAt: new Date(),
        createBy: userId,
        updateBy: userId,
        splitFrom: originalPalletCode,
        // 复制工单数组但重置数量
        workOrders: originalPallet.workOrders
          ? originalPallet.workOrders.map((wo) => ({ ...wo, quantity: 0 }))
          : [
              {
                productionOrderId: originalPallet.productionOrderId,
                productionOrderNo: originalPallet.productionOrderNo,
                workOrderNo: originalPallet.workOrderNo,
                productionPlanWorkOrderId:
                  originalPallet.productionPlanWorkOrderId,
                quantity: 0,
              },
            ],
      };

      // 5. 处理要移动的条码
      const barcodesToMove = [];
      const boxesToUpdate = new Map(); // 用于跟踪需要更新的箱

      // 处理主条码
      for (const barcode of barcodes) {
        // 找到原托盘中的条码记录
        const palletBarcode = originalPallet.palletBarcodes.find(
          (pb) => pb.barcode === barcode
        );
        if (palletBarcode) {
          // 创建条码副本，保留原始出库状态
          const newPalletBarcode = {
            ...palletBarcode,
          };
          barcodesToMove.push(newPalletBarcode);
        }

        // 检查条码是否属于某个箱
        for (const box of originalPallet.boxItems) {
          if (
            box.boxBarcodes &&
            box.boxBarcodes.some((bb) => bb.barcode === barcode)
          ) {
            // 将这个箱加入到需要更新的箱列表中
            if (!boxesToUpdate.has(box.boxBarcode)) {
              boxesToUpdate.set(box.boxBarcode, {
                ...box,
                boxBarcodes: [],
              });
            }

            // 将这个条码加入到对应箱的条码列表中
            const boxBarcode = box.boxBarcodes.find(
              (bb) => bb.barcode === barcode
            );
            if (boxBarcode) {
              // 创建条码副本，保留原始出库状态
              const newBoxBarcode = {
                ...boxBarcode,
              };
              boxesToUpdate.get(box.boxBarcode).boxBarcodes.push(newBoxBarcode);
            }
          }
        }
      }

      // 6. 如果有整箱移动，处理箱条码
      const boxesToRemoveFromOriginal = []; // 记录需要从原托盘移除的箱条码
      
      for (const [boxBarcode, updatedBox] of boxesToUpdate.entries()) {
        // 检查是否整箱移动（所有条码都在要拆分的列表中）
        const originalBox = originalPallet.boxItems.find(
          (b) => b.boxBarcode === boxBarcode
        );
        const allBarcodesInBox = originalBox.boxBarcodes.map(
          (bb) => bb.barcode
        );
        const allBoxBarcodesIncluded = allBarcodesInBox.every((barcode) =>
          barcodes.includes(barcode)
        );

        if (allBoxBarcodesIncluded) {
          // 整箱移动，将整个箱加入到新托盘
          newPallet.boxItems.push(originalBox);
          // 记录需要从原托盘移除的箱条码
          boxesToRemoveFromOriginal.push(boxBarcode);
        } else {
          // 部分移动，更新原箱中的条码数量
          const updatedOriginalBox = {
            ...originalBox,
            boxBarcodes: originalBox.boxBarcodes.filter(
              (bb) => !barcodes.includes(bb.barcode)
            ),
            quantity: originalBox.boxBarcodes.filter(
              (bb) => !barcodes.includes(bb.barcode)
            ).length,
          };

          // 如果箱子变空了，也需要从原托盘移除
          if (updatedOriginalBox.boxBarcodes.length === 0) {
            boxesToRemoveFromOriginal.push(boxBarcode);
          } else {
            // 更新原托盘中的箱
            await MaterialPalletizing.updateOne(
              {
                palletCode: originalPalletCode,
                "boxItems.boxBarcode": boxBarcode,
              },
              { 
                $set: { 
                  "boxItems.$": updatedOriginalBox,
                  updateAt: new Date(),
                  updateBy: userId
                }
              }
            );
          }

          // 将部分条码加入到新托盘的箱中
          newPallet.boxItems.push({
            ...updatedBox,
            quantity: updatedBox.boxBarcodes.length,
          });
        }
      }

      // 7. 将所有移动的条码加入到新托盘，并更新工单数量
      newPallet.palletBarcodes = barcodesToMove; // 将收集的条码添加到新托盘
      const newPalletBarcodesCount = barcodesToMove.length;

      for (const barcode of barcodes) {
        const originalBarcode = originalPallet.palletBarcodes.find(
          (pb) => pb.barcode === barcode
        );
        if (originalBarcode && originalBarcode.productionPlanWorkOrderId) {
          // 找到对应的工单并增加数量
          const workOrderIndex = newPallet.workOrders.findIndex(
            (wo) =>
              wo.productionPlanWorkOrderId &&
              wo.productionPlanWorkOrderId.toString() ===
                originalBarcode.productionPlanWorkOrderId.toString()
          );

          if (workOrderIndex !== -1) {
            newPallet.workOrders[workOrderIndex].quantity += 1;
          }
        }
      }

      // 更新新托盘的条码计数和箱子计数，确保barcodeCount和totalQuantity一致
      newPallet.barcodeCount = newPalletBarcodesCount;
      newPallet.totalQuantity = newPalletBarcodesCount; // 确保与条码数量一致
      newPallet.boxCount = newPallet.boxItems.length;

      // 9. 从原托盘中移除条码和整箱移动的箱子
      const remainingBarcodesCount =
        originalPallet.palletBarcodes.length - barcodes.length;
      
      const updateOperations = {
        $pull: {
          palletBarcodes: { barcode: { $in: barcodes } },
        },
        $set: {
          updateAt: new Date(),
          updateBy: userId,
          // 更新原托盘总数量为剩余条码数量，确保与托盘条码数量一致
          totalQuantity: remainingBarcodesCount,
          barcodeCount: remainingBarcodesCount, // 直接更新条码计数
          // 只有在原状态是组托完成时，才保持组托完成状态
          status:
            originalPallet.status === "STACKED" ? "STACKED" : "STACKING",
        },
      };

      // 如果有需要移除的箱子，添加到pull操作中
      if (boxesToRemoveFromOriginal.length > 0) {
        updateOperations.$pull.boxItems = { 
          boxBarcode: { $in: boxesToRemoveFromOriginal } 
        };
      }

      // 确保updateAt字段被包含在更新操作中
      if (!updateOperations.$set) {
        updateOperations.$set = {};
      }
      updateOperations.$set.updateAt = new Date();
      updateOperations.$set.updateBy = userId;
      
      await MaterialPalletizing.updateOne(
        { palletCode: originalPalletCode },
        updateOperations
      );

      // 10. 获取更新后的原托盘数据
      const updatedOriginalPallet = await MaterialPalletizing.findOne({
        palletCode: originalPalletCode,
      });

      // 11. 更新原托盘中各工单的数量
      if (
        updatedOriginalPallet &&
        updatedOriginalPallet.workOrders &&
        updatedOriginalPallet.workOrders.length > 0
      ) {
        // 重置所有工单数量
        updatedOriginalPallet.workOrders.forEach((wo) => {
          wo.quantity = 0;
        });

        // 根据剩余条码重新计算各工单数量
        updatedOriginalPallet.palletBarcodes.forEach((pb) => {
          if (pb.productionPlanWorkOrderId) {
            const workOrderIndex = updatedOriginalPallet.workOrders.findIndex(
              (wo) =>
                wo.productionPlanWorkOrderId &&
                wo.productionPlanWorkOrderId.toString() ===
                  pb.productionPlanWorkOrderId.toString()
            );

            if (workOrderIndex !== -1) {
              updatedOriginalPallet.workOrders[workOrderIndex].quantity += 1;
            }
          }
        });

        // 清理数量为0的工单
        this.cleanZeroQuantityWorkOrders(updatedOriginalPallet);

        // 确保barcodeCount和totalQuantity保持一致
        const palletBarcodesCount = updatedOriginalPallet.palletBarcodes.length;
        updatedOriginalPallet.barcodeCount = palletBarcodesCount;
        updatedOriginalPallet.totalQuantity = palletBarcodesCount;
        
        // 更新箱数
        updatedOriginalPallet.boxCount = updatedOriginalPallet.boxItems.length;

        // 检查原托盘中剩余的产品的出库状态并更新出入库状态
        if (updatedOriginalPallet.palletBarcodes.length > 0) {
          const allRemainingBarcodesOut =
            updatedOriginalPallet.palletBarcodes.every(
              (pb) => pb.outWarehouseStatus === "COMPLETED"
            );

          const anyRemainingBarcodesOut =
            updatedOriginalPallet.palletBarcodes.some(
              (pb) => pb.outWarehouseStatus === "COMPLETED"
            );

          // 更新原托盘的出入库状态
          if (allRemainingBarcodesOut) {
            // 如果所有剩余条码都是已出库状态，则设置为已出库
            updatedOriginalPallet.inWarehouseStatus = "OUT_WAREHOUSE";
          } else if (anyRemainingBarcodesOut) {
            // 如果部分剩余条码已出库，则设置为部分出库
            updatedOriginalPallet.inWarehouseStatus = "PART_OUT_WAREHOUSE";
          } else {
            // 如果所有剩余条码都是待出库状态，需要根据原托盘状态决定
            // 如果原托盘是待入库状态，保持待入库状态
            // 如果原托盘是已入库或部分出库状态，则设置为已入库
            if (originalPallet.inWarehouseStatus === "PENDING") {
              updatedOriginalPallet.inWarehouseStatus = "PENDING";
            } else {
              updatedOriginalPallet.inWarehouseStatus = "IN_WAREHOUSE";
            }
          }
        } else {
          // 如果原托盘没有任何条码了，保持原来的入库状态不变
          // 如果原来是待入库，应该保持待入库；如果是已入库，保持已入库
          if (originalPallet.inWarehouseStatus === "PENDING") {
            updatedOriginalPallet.inWarehouseStatus = "PENDING";
          } else {
            updatedOriginalPallet.inWarehouseStatus = "IN_WAREHOUSE";
          }
        }

        // 保存更新后的原托盘
        // updateAt由pre-save中间件自动处理
        updatedOriginalPallet.updateBy = userId;
        await updatedOriginalPallet.save();
      }

      // 12. 更新新托盘的顶层工单信息，使其与实际条码关联的工单保持一致
      if (newPallet.workOrders && newPallet.workOrders.length > 0) {
        // 找到数量最多的工单作为主工单
        const mainWorkOrder = newPallet.workOrders.reduce((max, current) => {
          return current.quantity > max.quantity ? current : max;
        });

        // 更新新托盘的顶层工单信息
        newPallet.workOrderNo = mainWorkOrder.workOrderNo;
        newPallet.productionPlanWorkOrderId = mainWorkOrder.productionPlanWorkOrderId;
        newPallet.productionOrderId = mainWorkOrder.productionOrderId;
        newPallet.productionOrderNo = mainWorkOrder.productionOrderNo;

        console.log(`新托盘 ${newPalletCode} 顶层工单信息更新为: workOrderNo=${mainWorkOrder.workOrderNo}, productionPlanWorkOrderId=${mainWorkOrder.productionPlanWorkOrderId}`);
      }

      // 13. 检查拆分到新托盘的条码出库状态，确定新托盘的出入库状态
      if (newPallet.palletBarcodes.length > 0) {
        // 检查是否所有拆分条码都已出库
        const allNewBarcodesOut = newPallet.palletBarcodes.every(
          (pb) => pb.outWarehouseStatus === "COMPLETED"
        );

        // 检查是否部分拆分条码已出库
        const anyNewBarcodesOut = newPallet.palletBarcodes.some(
          (pb) => pb.outWarehouseStatus === "COMPLETED"
        );

        if (allNewBarcodesOut) {
          // 如果所有拆分条码都是已出库状态，则新托盘设置为已出库
          newPallet.inWarehouseStatus = "OUT_WAREHOUSE";
        } else if (anyNewBarcodesOut) {
          // 如果部分拆分条码已出库，则新托盘设置为部分出库
          newPallet.inWarehouseStatus = "PART_OUT_WAREHOUSE";
        } else {
          // 如果所有拆分条码都是待出库状态，新托盘状态应该继承原托盘状态
          if (originalPallet.inWarehouseStatus === "PENDING") {
            // 如果原托盘是待入库状态，新托盘也应该是待入库
            newPallet.inWarehouseStatus = "PENDING";
          } else if (originalPallet.inWarehouseStatus === "IN_WAREHOUSE") {
            // 如果原托盘是已入库状态，新托盘也应该是已入库
            newPallet.inWarehouseStatus = "IN_WAREHOUSE";
          } else if (originalPallet.inWarehouseStatus === "PART_OUT_WAREHOUSE") {
            // 如果原托盘是部分出库状态，新托盘（没有出库条码）应该是已入库
            newPallet.inWarehouseStatus = "IN_WAREHOUSE";
          } else {
            // 默认情况，设置为已入库
            newPallet.inWarehouseStatus = "IN_WAREHOUSE";
          }
        }
      } else {
        // 如果新托盘没有条码（理论上不应该发生），继承原托盘状态
        newPallet.inWarehouseStatus = originalPallet.inWarehouseStatus;
      }

      // 14. 创建新托盘记录
      // 清理数量为0的工单
      this.cleanZeroQuantityWorkOrders(newPallet);
      const createdPallet = await MaterialPalletizing.create(newPallet);

      // 15. 处理入库单中的关联关系
      await this.updateWarehouseEntryAfterSplit(
        originalPalletCode,
        newPalletCode,
        barcodes
      );

      // 重新获取原托盘数据，以确保获取最新状态
      const finalOriginalPallet = await MaterialPalletizing.findOne({
        palletCode: originalPalletCode,
      });

      // 最终检查拆分后原托盘剩余条码的出库状态，更新原托盘的出入库状态
      if (finalOriginalPallet.palletBarcodes.length === 0) {
        // 如果没有剩余条码，保持原来的入库状态不变
        // 如果原来是待入库，应该保持待入库；如果是已入库，保持已入库
        if (originalPallet.inWarehouseStatus === "PENDING") {
          finalOriginalPallet.inWarehouseStatus = "PENDING";
        } else {
          finalOriginalPallet.inWarehouseStatus = "IN_WAREHOUSE";
        }
      } else {
        // 检查剩余条码中是否有已出库的条码
        const allRemainingOut = finalOriginalPallet.palletBarcodes.every(
          (item) => item.outWarehouseStatus === "COMPLETED"
        );

        const someRemainingOut = finalOriginalPallet.palletBarcodes.some(
          (item) => item.outWarehouseStatus === "COMPLETED"
        );

        if (allRemainingOut) {
          // 如果所有剩余条码都是已出库状态，则设置为已出库
          finalOriginalPallet.inWarehouseStatus = "OUT_WAREHOUSE";
        } else if (someRemainingOut) {
          // 如果部分剩余条码已出库，则设置为部分出库
          finalOriginalPallet.inWarehouseStatus = "PART_OUT_WAREHOUSE";
        } else {
          // 如果所有剩余条码都是待出库状态，需要根据原托盘状态决定
          // 如果原托盘是待入库状态，保持待入库状态
          // 如果原托盘是已入库或部分出库状态，则设置为已入库
          if (originalPallet.inWarehouseStatus === "PENDING") {
            finalOriginalPallet.inWarehouseStatus = "PENDING";
          } else {
            finalOriginalPallet.inWarehouseStatus = "IN_WAREHOUSE";
          }
        }
      }

      // 保存更新的出入库状态
      // updateAt由pre-save中间件自动处理
      finalOriginalPallet.updateBy = userId;
      await finalOriginalPallet.save();

      return createdPallet;
    } catch (error) {
      console.error("拆分托盘失败:", error);
      throw error;
    }
  }

  /**
   * 获取托盘的拆分次数
   * @param {String} originalPalletCode - 原托盘编号
   * @returns {Number} 拆分次数
   */
  static async getSplitCount(originalPalletCode) {
    try {
      // 查找所有以原托盘编号开头的拆分托盘
      const regex = new RegExp(`^${originalPalletCode}-\\d+$`);
      const splitPallets = await MaterialPalletizing.find({
        palletCode: { $regex: regex },
      });

      return splitPallets.length;
    } catch (error) {
      console.error("获取托盘拆分次数失败:", error);
      return 0;
    }
  }

  /**
   * 更新入库单中的关联关系
   * @param {String} originalPalletCode - 原托盘编号
   * @param {String} newPalletCode - 新托盘编号
   * @param {Array} barcodes - 要移动的条码列表
   */
  static async updateWarehouseEntryAfterSplit(
    originalPalletCode,
    newPalletCode,
    barcodes
  ) {
    try {
      // 查找包含原托盘的入库单
      const warehouseEntries = await WarehouseEntry.find({
        "entryItems.palletCode": originalPalletCode,
      });

      if (!warehouseEntries || warehouseEntries.length === 0) {
        // 没有关联的入库单，不需要处理
        return;
      }

      // 处理每个包含原托盘的入库单
      for (const entry of warehouseEntries) {
        // 找到原托盘在入库单中的记录索引
        const originalItemIndex = entry.entryItems.findIndex(
          (item) => item.palletCode === originalPalletCode
        );

        if (originalItemIndex === -1) {
          continue;
        }

        const originalItem = entry.entryItems[originalItemIndex];

        // 创建新托盘入库项
        const newEntryItem = {
          palletCode: newPalletCode,
          quantity: barcodes.length, // 新托盘的数量就是移动的条码数量
          boxCount: 0, // 初始化箱数为0，后续可以计算
          scanTime: new Date(),
          scanBy: originalItem.scanBy,
          scanByName: originalItem.scanByName,
        };

        // 更新原托盘在入库单中的数量
        const updatedQuantity = originalItem.quantity - barcodes.length;
        entry.entryItems[originalItemIndex].quantity =
          updatedQuantity > 0 ? updatedQuantity : 0;

        // 计算新托盘的箱数
        const originalPallet = await MaterialPalletizing.findOne({
          palletCode: originalPalletCode,
        });
        if (originalPallet) {
          // 查找被拆分的箱子
          const boxesInNewPallet = new Set();

          for (const barcode of barcodes) {
            for (const box of originalPallet.boxItems) {
              if (
                box.boxBarcodes &&
                box.boxBarcodes.some((bb) => bb.barcode === barcode)
              ) {
                boxesInNewPallet.add(box.boxBarcode);
              }
            }
          }

          newEntryItem.boxCount = boxesInNewPallet.size;

          // 更新原托盘的箱数
          const boxesInOriginalPallet = new Set();

          for (const box of originalPallet.boxItems) {
            if (
              box.boxBarcodes &&
              box.boxBarcodes.some((bb) => !barcodes.includes(bb.barcode))
            ) {
              boxesInOriginalPallet.add(box.boxBarcode);
            }
          }

          entry.entryItems[originalItemIndex].boxCount =
            boxesInOriginalPallet.size;
        }

        // 添加新托盘到入库单
        entry.entryItems.push(newEntryItem);

        // 更新入库单的总数量和托盘数量
        entry.actualQuantity = entry.entryItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        entry.palletCount = entry.entryItems.length;
        entry.totalBoxCount = entry.entryItems.reduce(
          (sum, item) => sum + (item.boxCount || 0),
          0
        );

        // 计算入库进度
        if (entry.plannedQuantity && entry.plannedQuantity > 0) {
          entry.progress = Math.min(
            100,
            (entry.actualQuantity / entry.plannedQuantity) * 100
          );
        }

        // 更新入库单状态
        if (entry.progress >= 100) {
          entry.status = "COMPLETED";
          entry.endTime = new Date();
        } else if (entry.progress > 0) {
          entry.status = "IN_PROGRESS";
          if (!entry.startTime) {
            entry.startTime = new Date();
          }
        }

        await entry.save();
      }
    } catch (error) {
      console.error("更新入库单关联关系失败:", error);
      throw error;
    }
  }

  /**
   * 更新入库单中的数据（解绑条码后）
   * @param {String} palletCode - 托盘编号
   * @param {Array} barcodes - 解绑的条码列表
   */
  static async updateWarehouseEntryAfterUnbind(palletCode, barcodes) {
    try {
      // 查找包含该托盘的入库单
      const warehouseEntries = await WarehouseEntry.find({
        "entryItems.palletCode": palletCode,
      });

      if (!warehouseEntries || warehouseEntries.length === 0) {
        // 没有关联的入库单，不需要处理
        return;
      }

      // 处理每个包含该托盘的入库单
      for (const entry of warehouseEntries) {
        // 找到托盘在入库单中的记录索引
        const itemIndex = entry.entryItems.findIndex(
          (item) => item.palletCode === palletCode
        );

        if (itemIndex === -1) {
          continue;
        }

        const entryItem = entry.entryItems[itemIndex];

        // 更新托盘在入库单中的数量（减去解绑的条码数量）
        const updatedQuantity = entryItem.quantity - barcodes.length;
        entry.entryItems[itemIndex].quantity =
          updatedQuantity > 0 ? updatedQuantity : 0;

        // 如果托盘数量为0，考虑是否需要从入库单中移除该托盘
        if (entry.entryItems[itemIndex].quantity === 0) {
          // 可以选择移除托盘记录或保留记录但标记数量为0
          // 这里选择保留记录但标记数量为0，以保持历史记录完整性
          // entry.entryItems.splice(itemIndex, 1);
        } else {
          // 更新托盘的箱数
          const pallet = await MaterialPalletizing.findOne({ palletCode });
          if (pallet) {
            entry.entryItems[itemIndex].boxCount = pallet.boxCount;
          }
        }

        // 更新入库单的总数量和托盘数量
        entry.actualQuantity = entry.entryItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        entry.palletCount = entry.entryItems.filter(
          (item) => item.quantity > 0
        ).length;
        entry.totalBoxCount = entry.entryItems.reduce(
          (sum, item) => sum + (item.boxCount || 0),
          0
        );

        // 计算入库进度
        if (entry.plannedQuantity && entry.plannedQuantity > 0) {
          entry.progress = Math.min(
            100,
            (entry.actualQuantity / entry.plannedQuantity) * 100
          );
        }

        // 更新入库单状态
        if (entry.progress === 0) {
          entry.status = "PENDING"; // 如果进度为0，重置为待处理状态
        } else if (entry.progress < 100) {
          entry.status = "IN_PROGRESS"; // 如果进度小于100%，设置为进行中
          if (!entry.startTime) {
            entry.startTime = new Date();
          }
        }
        // 注意：不会将状态从COMPLETED改回IN_PROGRESS，因为可能已经完成了其他操作

        await entry.save();
      }
    } catch (error) {
      console.error("更新入库单数据失败:", error);
      throw error;
    }
  }

  /**
   * 更新托盘检测状态
   * @param {String} barcode - 托盘条码/产品条码
   * @param {String} userId - 操作用户ID
   * @param {String} remarks - 备注信息
   * @returns {Object} 更新结果
   */
  static async updatePalletInspectionStatus(
    barcode,
    userId,
    remarks = "",
    status
  ) {
    try {
      // 查找包含该条码的托盘
      const pallet = await MaterialPalletizing.findOne({
        "palletBarcodes.barcode": barcode,
      });

      if (!pallet) {
        throw new Error("未找到对应的托盘记录");
      }

      // 更新整个托盘的检测状态
      pallet.inspectionStatus = "INSPECTING";
      pallet.inspectionTime = new Date();
      pallet.inspectionRemarks = remarks;
      pallet.inspectionBy = userId;

      // 更新对应条码的检测状态
      for (const pb of pallet.palletBarcodes) {
        if (pb.barcode === barcode) {
          pb.inspectionStatus = "INSPECTING";
          pb.inspectionTime = new Date();
        }
      }

      console.log(status, "status");
      // 使用arrayFilters更新对应的条码元素
      const updateResult = await MaterialPalletizing.updateOne(
        { "palletBarcodes.barcode": barcode },
        {
          $set: {
            inspectionStatus: "INSPECTING",
            inspectionTime: new Date(),
            inspectionRemarks: remarks,
            inspectionBy: userId,
            "palletBarcodes.$[elem].inspectionStatus": "INSPECTING",
            "palletBarcodes.$[elem].inspectionTime": new Date(),
            "palletBarcodes.$[elem].inspectionResult": status ? "PASS" : "FAIL",
            updateAt: new Date(),
            updateBy: userId,
          },
        },
        {
          arrayFilters: [{ "elem.barcode": barcode }],
        }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error("更新托盘检测状态失败");
      }

      return {
        palletCode: pallet.palletCode,
        barcode: barcode,
        inspectionStatus: "INSPECTING",
        inspectionTime: new Date(),
        updateResult,
      };
    } catch (error) {
      console.error("更新托盘检测状态失败:", error);
      throw error;
    }
  }

  /**
   * 更新托盘出入库状态
   * @param {Object} pallet - 托盘对象
   * @returns {String} 更新后的状态
   */
  static updatePalletOutWarehouseStatus(pallet) {
    // 如果没有条码，则设置为已入库
    if (!pallet.palletBarcodes || pallet.palletBarcodes.length === 0) {
      pallet.inWarehouseStatus = "IN_WAREHOUSE";
      return pallet.inWarehouseStatus;
    }

    // 检查是否所有条码都已出库
    const allBarcodesOut = pallet.palletBarcodes.every(
      (item) => item.outWarehouseStatus === "COMPLETED"
    );

    // 检查是否有条码已出库
    const anyBarcodesOut = pallet.palletBarcodes.some(
      (item) => item.outWarehouseStatus === "COMPLETED"
    );

    // 根据条码出库状态更新托盘状态
    if (allBarcodesOut) {
      // 如果所有条码都是已出库状态，则设置为已出库
      pallet.inWarehouseStatus = "OUT_WAREHOUSE";
    } else if (anyBarcodesOut) {
      // 如果部分条码已出库，则设置为部分出库
      pallet.inWarehouseStatus = "PART_OUT_WAREHOUSE";
    } else {
      // 如果所有条码都是待出库状态，则设置为已入库
      pallet.inWarehouseStatus = "IN_WAREHOUSE";
    }

    return pallet.inWarehouseStatus;
  }

  /**
   * 将产品条码添加到指定托盘
   * 修改版本：使用重试机制代替事务，适用于单实例MongoDB
   * @param {String} palletCode - 指定的托盘编号
   * @param {String} mainBarcode - 主条码
   * @param {String} boxBarcode - 箱条码(可选)
   * @param {String} userId - 操作用户ID
   * @param {Array} componentScans - 子物料信息
   * @param {Boolean} fromRepairStation - 是否来自维修台，默认为false
   * @returns {Object} 更新后的托盘信息
   */
  static async addBarcodeToPallet(
    palletCode,
    mainBarcode,
    boxBarcode = null,
    userId,
    componentScans = [],
    fromRepairStation = true
  ) {
    // ===== Redis 分布式锁保护 =====
    const { palletLockManager } = require('./queueService');
    const workerId = `repair_${process.pid}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const palletKey = mainBarcode; // 使用主条码作为锁键
    let lockAcquired = false;
    const lockStartTime = Date.now();

    try {
      console.log(`🔐 [维修台] 尝试获取托盘锁: ${palletKey}, Worker: ${workerId}, 托盘: ${palletCode}`);
      
      // 🔧 优化：调整锁等待时间与队列处理器保持一致
      const maxLockWaitTime = 18000; // 18秒等待时间
      while (Date.now() - lockStartTime < maxLockWaitTime) {
        lockAcquired = await palletLockManager.acquireLock(palletKey, workerId);
        if (lockAcquired) {
          break;
        }
        
        // 检查锁状态并记录日志
        const lockStatus = await palletLockManager.getLockStatus(palletKey);
        console.log(`⏳ [维修台] 等待托盘锁释放: ${palletKey}, 当前持有者: ${lockStatus.owner}, 剩余时间: ${lockStatus.remainingTime}ms`);
        
        // 等待200ms后重试
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (!lockAcquired) {
        const lockStatus = await palletLockManager.getLockStatus(palletKey);
        const errorMessage = `维修台添加条码 ${mainBarcode} 到托盘 ${palletCode} 失败：条码正在被其他进程处理。当前锁持有者: ${lockStatus.owner || 'unknown'}`;
        
        console.error(`❌ [维修台] ${errorMessage}`);
        
        await this.logError({
          errorType: "REPAIR_LOCK_ACQUISITION_FAILED",
          operation: "ADD_BARCODE_TO_PALLET",
          error: new Error(errorMessage),
          barcode: mainBarcode,
          palletCode,
          boxBarcode,
          context: {
            fromRepairStation,
            componentScans,
            lockStatus,
            workerId,
            waitTime: Date.now() - lockStartTime
          },
          userId,
          impactLevel: "HIGH"
        });
        
        throw new Error(errorMessage);
      }

      console.log(`✅ [维修台] 成功获取托盘锁: ${palletKey}, Worker: ${workerId}`);

      // 定期扩展锁的有效期
      const extendLockInterval = setInterval(async () => {
        try {
          const extended = await palletLockManager.extendLock(palletKey, workerId);
          if (extended) {
            console.log(`🔄 [维修台] 托盘锁续期成功: ${palletKey}`);
          } else {
            console.warn(`⚠️ [维修台] 托盘锁续期失败: ${palletKey}`);
          }
        } catch (extendError) {
          console.error(`❌ [维修台] 托盘锁续期异常: ${palletKey}`, extendError);
        }
      }, 10000); // 每10秒扩展一次

      try {
        // 直接调用处理方法，依赖Redis锁保护而非重试机制
        const result = await this._addBarcodeToPalletWithRetry(
          palletCode,
          mainBarcode,
          boxBarcode,
          userId,
          componentScans,
          fromRepairStation
        );
        
        console.log(`✅ [维修台] 条码添加到托盘成功: ${mainBarcode} -> ${palletCode}, Worker: ${workerId}`);
        return result;
        
      } catch (error) {
        // 记录处理失败错误（无重试，依赖Redis锁保护）
        console.error(`❌ [维修台] 条码添加到托盘失败: ${mainBarcode} -> ${palletCode}, Worker: ${workerId}`, error);
        
        await this.logError({
          errorType: "REPAIR_ADD_BARCODE_FAILED",
          operation: "ADD_BARCODE_TO_PALLET",
          error,
          barcode: mainBarcode,
          palletCode,
          boxBarcode,
          context: {
            fromRepairStation,
            componentScans,
            workerId,
            totalProcessingTime: Date.now() - lockStartTime,
            noRetryMode: true
          },
          userId,
          impactLevel: "HIGH"
        });
        
        throw error;
      } finally {
        // 清理锁续期定时器
        if (extendLockInterval) {
          clearInterval(extendLockInterval);
        }
      }
      
    } catch (outerError) {
      console.error(`❌ [维修台] 条码添加到托盘外层错误: ${mainBarcode} -> ${palletCode}, Worker: ${workerId}`, outerError);
      throw outerError;
    } finally {
      // 无论成功还是失败都要释放分布式锁
      if (lockAcquired) {
        try {
          const released = await palletLockManager.releaseLock(palletKey, workerId);
          if (released) {
            console.log(`🔓 [维修台] 成功释放托盘锁: ${palletKey}, Worker: ${workerId}`);
          } else {
            console.warn(`⚠️ [维修台] 托盘锁释放失败（可能已过期）: ${palletKey}, Worker: ${workerId}`);
          }
        } catch (releaseError) {
          console.error(`❌ [维修台] 释放托盘锁异常: ${palletKey}, Worker: ${workerId}`, releaseError);
          
          // 记录锁释放失败，但不影响主流程
          try {
            await this.logError({
              errorType: "REPAIR_LOCK_RELEASE_FAILED",
              operation: "RELEASE_PALLET_LOCK",
              error: releaseError,
              barcode: mainBarcode,
              palletCode,
              context: {
                workerId,
                palletKey,
                processingTime: Date.now() - lockStartTime
              },
              userId,
              impactLevel: "MEDIUM"
            });
          } catch (logError) {
            console.error(`❌ [维修台] 记录锁释放失败日志异常: ${palletKey}`, logError);
          }
        }
      }
    }
  }

  /**
   * 添加条码到托盘的内部实现（无事务版本）
   */
  static async _addBarcodeToPalletWithRetry(
    palletCode,
    mainBarcode,
    boxBarcode = null,
    userId,
    componentScans = [],
    fromRepairStation = true
  ) {
    let processCompleted = false; // 标记工序是否已完成
    let pallet = null; // 初始化托盘变量
    
    try {
      console.log(`开始添加条码到指定托盘: 托盘=${palletCode}, 条码=${mainBarcode}, 来自维修台=${fromRepairStation}`);

      // 查找指定托盘
      pallet = await MaterialPalletizing.findOne({ palletCode });
      if (!pallet) {
        throw new Error("未找到指定的托盘");
      }

      // 关键验证：确保托盘编号不为空
      if (!pallet.palletCode) {
        throw new Error("托盘编号为空，无法进行工序绑定");
      }

      console.log(`使用指定托盘: ${pallet.palletCode}`);

      // 检查托盘状态，只有组托中的托盘才能添加条码
      if (pallet.status !== "STACKING") {
        throw new Error("只有组托中状态的托盘才能添加条码");
      }

      // 检查主条码是否重复
      const existingBarcode = pallet.palletBarcodes.find(
        (item) => item.barcode === mainBarcode
      );

      if (existingBarcode) {
        throw new Error("重复扫码");
      }

      // 增加跨托盘重复检查
      const existingBarcodeInOtherPallet = await MaterialPalletizing.findOne({
        "palletBarcodes.barcode": mainBarcode,
        palletCode: { $ne: pallet.palletCode },
        status: { $in: ["STACKING", "STACKED"] }
      });
      if (existingBarcodeInOtherPallet) {
        throw new Error(
          `条码 ${mainBarcode} 已在其他托盘 ${existingBarcodeInOtherPallet.palletCode} 中使用`
        );
      }

      // 查找条码对应的物料流程记录
      let materialProcessFlow = await MaterialProcessFlow.findOne({
        barcode: mainBarcode,
      });

      if (!materialProcessFlow) {
        throw new Error("对应的主条码在系统中不存在");
      }

      // 查找产线计划
      const productionPlan = await productionPlanWorkOrder.findOne({
        _id: pallet.productionPlanWorkOrderId,
      });

      if (!productionPlan) {
        throw new Error("未找到对应的产线计划");
      }

      // 验证当前托盘中添加新条码是否会超出托盘总数量
      if (pallet.barcodeCount + 1 > pallet.totalQuantity) {
        throw new Error(`托盘条码数量已达到上限 ${pallet.totalQuantity}`);
      }

      // 处理箱条码验证（如果存在）
      if (boxBarcode) {
        await this._validateBoxBarcodeSimple(boxBarcode, pallet.materialId, userId, pallet.productLineId, pallet._id);
      }

      // **先触发工序完成**（确保工序绑定成功）
      console.log(`开始触发工序完成: ${mainBarcode}, 托盘编号: ${pallet.palletCode}`);
      try {
        await materialProcessFlowService.scanBatchDocument(
          mainBarcode,
          pallet.processStepId,
          pallet.palletCode,
          componentScans,
          userId,
          pallet.productLineId,
          fromRepairStation
        );
        console.log(`条码 ${mainBarcode} 工序完成触发成功`);
        processCompleted = true; // 标记工序已完成
      } catch (processError) {
        console.error(`条码 ${mainBarcode} 工序完成触发失败:`, processError);
        
        // 记录工序失败错误日志
        await this.logError({
          errorType: "PROCESS_FAILED",
          operation: "BIND_PROCESS",
          error: processError,
          barcode: mainBarcode,
          palletCode: pallet.palletCode,
          palletId: pallet._id,
          productLineId: pallet.productLineId,
          productLineName: pallet.productLineName,
          processStepId: pallet.processStepId,
          materialId: pallet.materialId,
          materialCode: pallet.materialCode,
          materialName: pallet.materialName,
          workOrderNo: pallet.workOrderNo,
          productionPlanWorkOrderId: pallet.productionPlanWorkOrderId,
          boxBarcode,
          context: {
            fromRepairStation,
            componentScans,
            palletData: pallet.toObject(),
            totalQuantity
          },
          userId,
          processCompleted: false,
          palletStatus: pallet.status,
          impactLevel: "HIGH"
        });
        
        // 工序失败，抛出错误，阻止入托
        throw new Error(`工序绑定失败，产品不能入托: ${processError.message}`);
      }

      // **工序成功后使用原子操作添加条码到托盘**
      let updateOperation;
      let arrayFilters = [{ 
        "elem.productionPlanWorkOrderId": productionPlan._id 
      }];

      if (boxBarcode) {
        // 处理包装箱条码的情况
        updateOperation = {
          $push: {
            palletBarcodes: {
              barcode: mainBarcode,
              barcodeType: "MAIN",
              scanTime: new Date(),
              productionPlanWorkOrderId: productionPlan._id,
            }
          },
          $inc: { 
            barcodeCount: 1,
            "workOrders.$[elem].quantity": 1
          },
          $set: {
            updateAt: new Date(),
            updateBy: userId
          }
        };

        // 首先尝试向现有箱子添加条码
        const existingBoxUpdateResult = await MaterialPalletizing.updateOne(
          { 
            _id: pallet._id,
            "palletBarcodes.barcode": { $ne: mainBarcode },
            status: "STACKING",
            "boxItems.boxBarcode": boxBarcode
          },
          {
            ...updateOperation,
            $push: {
              ...updateOperation.$push,
              "boxItems.$.boxBarcodes": {
                barcode: mainBarcode,
                barcodeType: "MAIN",
                scanTime: new Date(),
                productionPlanWorkOrderId: productionPlan._id,
              }
            },
            $inc: {
              ...updateOperation.$inc,
              "boxItems.$.quantity": 1
            }
          },
          {
            arrayFilters
          }
        );

        if (existingBoxUpdateResult.modifiedCount === 0) {
          // 如果没有更新成功（箱子不存在），则创建新箱子
          const newBoxUpdateResult = await MaterialPalletizing.updateOne(
            { 
              _id: pallet._id,
              "palletBarcodes.barcode": { $ne: mainBarcode },
              status: "STACKING",
              "boxItems.boxBarcode": { $ne: boxBarcode }
            },
            {
              ...updateOperation,
              $push: {
                ...updateOperation.$push,
                boxItems: {
                  boxBarcode: boxBarcode,
                  boxBarcodes: [{
                    barcode: mainBarcode,
                    barcodeType: "MAIN",
                    scanTime: new Date(),
                    productionPlanWorkOrderId: productionPlan._id,
                  }],
                  quantity: 1,
                  scanTime: new Date(),
                  productionPlanWorkOrderId: productionPlan._id,
                }
              },
              $inc: {
                ...updateOperation.$inc,
                boxCount: 1
              }
            },
            {
              arrayFilters
            }
          );

          if (newBoxUpdateResult.modifiedCount === 0) {
            // 记录原子操作失败错误日志
            await this.logError({
              errorType: "ATOMIC_OPERATION_FAILED",
              operation: "SAVE_PALLET",
              error: new Error("条码添加失败，可能已被其他进程处理或托盘状态不正确"),
              barcode: mainBarcode,
              palletCode: pallet.palletCode,
              palletId: pallet._id,
              productLineId: pallet.productLineId,
              productLineName: pallet.productLineName,
              processStepId: pallet.processStepId,
              materialId: pallet.materialId,
              materialCode: pallet.materialCode,
              materialName: pallet.materialName,
              workOrderNo: pallet.workOrderNo,
              productionPlanWorkOrderId: pallet.productionPlanWorkOrderId,
              boxBarcode,
              context: {
                fromRepairStation,
                componentScans,
                palletData: pallet.toObject(),
                updateOperation,
                arrayFilters,
                operationType: "CREATE_NEW_BOX"
              },
              userId,
              processCompleted: true,
              palletStatus: pallet.status,
              impactLevel: "HIGH"
            });
            
            throw new Error(`条码 ${mainBarcode} 添加失败，可能已被其他进程处理或托盘状态不正确`);
          }
        }
      } else {
        // 没有包装箱条码的情况
        updateOperation = {
          $push: {
            palletBarcodes: {
              barcode: mainBarcode,
              barcodeType: "MAIN",
              scanTime: new Date(),
              productionPlanWorkOrderId: productionPlan._id,
            }
          },
          $inc: { 
            barcodeCount: 1,
            "workOrders.$[elem].quantity": 1
          },
          $set: {
            updateAt: new Date(),
            updateBy: userId
          }
        };

        const updateResult = await MaterialPalletizing.updateOne(
          { 
            _id: pallet._id,
            "palletBarcodes.barcode": { $ne: mainBarcode },
            status: "STACKING"
          },
          updateOperation,
          {
            arrayFilters
          }
        );

        if (updateResult.modifiedCount === 0) {
          // 记录原子操作失败错误日志
          await this.logError({
            errorType: "ATOMIC_OPERATION_FAILED",
            operation: "SAVE_PALLET",
            error: new Error("条码添加失败，可能已被其他进程处理或托盘状态不正确"),
            barcode: mainBarcode,
            palletCode: pallet.palletCode,
            palletId: pallet._id,
            productLineId: pallet.productLineId,
            productLineName: pallet.productLineName,
            processStepId: pallet.processStepId,
            materialId: pallet.materialId,
            materialCode: pallet.materialCode,
            materialName: pallet.materialName,
            workOrderNo: pallet.workOrderNo,
            productionPlanWorkOrderId: pallet.productionPlanWorkOrderId,
            boxBarcode,
            context: {
              fromRepairStation,
              componentScans,
              palletData: pallet.toObject(),
              updateOperation,
              arrayFilters,
              operationType: "DIRECT_ADD"
            },
            userId,
            processCompleted: true,
            palletStatus: pallet.status,
            impactLevel: "HIGH"
          });
          
          throw new Error(`条码 ${mainBarcode} 添加失败，可能已被其他进程处理或托盘状态不正确`);
        }
      }

      // 获取更新后的托盘并检查状态
      const updatedPallet = await MaterialPalletizing.findById(pallet._id);
      
      // 检查是否达到总数量要求
      if (updatedPallet.barcodeCount >= updatedPallet.totalQuantity) {
        await MaterialPalletizing.updateOne(
          { _id: pallet._id },
          { 
            $set: { 
              status: "STACKED",
              repairStatus: updatedPallet.repairStatus === "REPAIRING" ? "REPAIRED" : updatedPallet.repairStatus,
              updateAt: new Date(),
              updateBy: userId
            }
          }
        );
        updatedPallet.status = "STACKED";
        console.log(`托盘 ${updatedPallet.palletCode} 已完成组托`);
      }

      console.log(`工序绑定和托盘入托完成，条码 ${mainBarcode} 已添加到托盘 ${palletCode}`);
      
      return updatedPallet;
    } catch (error) {
      console.error("添加条码到托盘失败:", error);
      
      // 关键修复：如果工序已完成但托盘保存失败，需要回滚工序状态
      if (processCompleted && error.message.includes("添加失败")) {
        console.log(`条码 ${mainBarcode} 工序已完成但托盘保存失败，开始回滚工序状态...`);
        let rollbackSuccess = false;
        
        try {
          // 调用工序解绑方法回滚工序状态
          await materialProcessFlowService.unbindProcessComponents(
            mainBarcode,
            processStepId,
            userId,
            "托盘入托失败自动回滚",
            false, // 不解绑后续工序
            false  // 不是来自托盘解绑调用
          );
          console.log(`条码 ${mainBarcode} 工序状态回滚成功`);
          rollbackSuccess = true;
        } catch (rollbackError) {
          console.error(`条码 ${mainBarcode} 工序状态回滚失败:`, rollbackError);
          
          // 记录回滚失败错误日志
          await this.logError({
            errorType: "ROLLBACK_FAILED",
            operation: "ROLLBACK_PROCESS",
            error: rollbackError,
            barcode: mainBarcode,
            palletCode: pallet?.palletCode,
            palletId: pallet?._id,
            productLineId: lineId,
            productLineName: lineName,
            processStepId,
            materialId,
            materialCode,
            materialName,
            boxBarcode,
            context: {
              fromRepairStation,
              componentScans,
              originalError: error.message,
              rollbackReason: "托盘入托失败自动回滚"
            },
            userId,
            processCompleted: true,
            rollbackAttempted: true,
            rollbackSuccess: false,
            impactLevel: "CRITICAL"
          });
          
          // 记录回滚失败但不影响主流程错误抛出
        }
        
        // 记录托盘保存失败但工序回滚的情况
        await this.logError({
          errorType: "PALLET_SAVE_FAILED",
          operation: "SAVE_PALLET",
          error,
          barcode: mainBarcode,
          palletCode: pallet?.palletCode,
          palletId: pallet?._id,
          productLineId: lineId,
          productLineName: lineName,
          processStepId,
          materialId,
          materialCode,
          materialName,
          boxBarcode,
          context: {
            fromRepairStation,
            componentScans,
            palletData: pallet?.toObject(),
            totalQuantity
          },
          userId,
          processCompleted: true,
          palletStatus: pallet?.status,
          rollbackAttempted: true,
          rollbackSuccess,
          impactLevel: rollbackSuccess ? "MEDIUM" : "HIGH"
        });
      } else {
        // 记录其他类型的错误
        let errorType = "UNKNOWN_ERROR";
        if (error.message.includes("重复")) {
          errorType = "DUPLICATE_BARCODE";
        } else if (error.message.includes("验证")) {
          errorType = "VALIDATION_FAILED";
        } else if (error.message.includes("工序")) {
          errorType = "PROCESS_FAILED";
        }
        
        await this.logError({
          errorType,
          operation: "ADD_TO_PALLET",
          error,
          barcode: mainBarcode,
          palletCode: pallet?.palletCode,
          palletId: pallet?._id,
          productLineId: lineId,
          productLineName: lineName,
          processStepId,
          materialId,
          materialCode,
          materialName,
          boxBarcode,
          context: {
            fromRepairStation,
            componentScans,
            palletData: pallet?.toObject(),
            totalQuantity
          },
          userId,
          processCompleted,
          palletStatus: pallet?.status,
          impactLevel: "MEDIUM"
        });
      }
      
      throw error;
    }
  }

  /**
   * 获取或创建托盘
   */
  static async _getOrCreatePallet(
    lineId,
    lineName,
    processStepId,
    materialId,
    materialCode,
    materialName,
    materialSpec,
    totalQuantity,
    userId,
    fromRepairStation = false,
    session = null
  ) {
    // 1. 获取产线当前进行的工单
    const currentProductionPlan = await productionPlanWorkOrder.findOne({
      productionLineId: lineId,
      status: "IN_PROGRESS",
    }).session(session).read('primary');

    if (!currentProductionPlan) {
      throw new Error("未找到对应的产线当前生产计划");
    }

    // 2. 查找现有的未完成托盘
    let pallet = await MaterialPalletizing.findOne({
      productLineId: lineId,
      materialId: materialId,
      status: "STACKING",
      repairStatus: { $ne: "REPAIRING" },
      productionPlanWorkOrderId: currentProductionPlan._id,
    }).session(session).read('primary');

    if (!pallet) {
      // 创建新托盘
      let palletCode = "YDC-SN-" + new Date().getTime();
      
      // 使用传入的totalQuantity，如果没有传入或者无效则使用默认值
      const palletTotalQuantity = (totalQuantity && totalQuantity > 0) ? totalQuantity : 1000;
      
      pallet = new MaterialPalletizing({
        palletCode,
        saleOrderId: currentProductionPlan.saleOrderId,
        saleOrderNo: currentProductionPlan.saleOrderNo,
        workOrders: [
          {
            productionOrderId: currentProductionPlan.productionOrderId,
            productionOrderNo: currentProductionPlan.productionOrderNo,
            workOrderNo: currentProductionPlan.workOrderNo,
            productionPlanWorkOrderId: currentProductionPlan._id,
            quantity: 0,
          },
        ],
        productionOrderId: currentProductionPlan.productionOrderId,
        productionOrderNo: currentProductionPlan.productionOrderNo,
        workOrderNo: currentProductionPlan.workOrderNo,
        productionPlanWorkOrderId: currentProductionPlan._id,
        productLineId: lineId,
        productLineName: lineName,
        materialId,
        materialCode,
        materialName,
        materialSpec,
        processStepId,
        status: "STACKING",
        palletBarcodes: [],
        boxItems: [],
        barcodeCount: 0,
        boxCount: 0,
        totalQuantity: palletTotalQuantity, // 使用传入的数量
        isLastPallet: false,
        createAt: new Date(),
        updateAt: new Date(),
        createBy: userId,
      });
      
      console.log(`创建新托盘: ${palletCode}, 容量: ${palletTotalQuantity}`);
    }

    return pallet;
  }

  /**
   * 验证盒条码
   */
  static async _validateBoxBarcode(boxBarcode, materialId, userId, productLineId, session = null, currentPalletId = null) {
    // 构建查询条件：排除当前托盘，只检查其他托盘中是否使用了相同的包装箱条码
    const queryCondition = {
      "boxItems.boxBarcode": boxBarcode,
      status: { $in: ["STACKING", "STACKED"] }
    };
    
    console.log("currentPalletId", currentPalletId);
    // 如果提供了当前托盘ID，则排除当前托盘
    if (currentPalletId) {
      queryCondition._id = { $ne: currentPalletId };
    }
    
    // 检查箱条码是否在其他托盘中已存在
    const existingBoxInOtherPallet = await MaterialPalletizing.findOne(queryCondition).session(session).read('primary');
    
    if (existingBoxInOtherPallet) {
      throw new Error(
        `箱条码 ${boxBarcode} 已在其他托盘 ${existingBoxInOtherPallet.palletCode} 中使用`
      );
    }
  }

  /**
   * 处理工单信息
   */
  static async _handleWorkOrderInfo(mainBarcode, pallet, fromRepairStation, session = null) {
    // 获取产品条码的流程记录
    let materialProcessFlow = await MaterialProcessFlow.findOne({
      barcode: mainBarcode,
    }).session(session).read('primary');

    if (!materialProcessFlow) {
      throw new Error(
        `条码 ${mainBarcode} 在系统中不存在 (物料流程记录未找到)`
      );
    }

    const productionPlanWorkOrderId = materialProcessFlow.productionPlanWorkOrderId;
    if (!productionPlanWorkOrderId) {
      throw new Error(`条码 ${mainBarcode} 在物料流程中未关联生产计划工单ID`);
    }

    return productionPlanWorkOrderId;
  }

  /**
   * 添加条码到托盘（修复方法名拼写）
   */
  static _addBarcodeToPllet(
    pallet,
    mainBarcode,
    boxBarcode,
    productionPlanWorkOrderId,
    userId,
    componentScans
  ) {
    // 检查条码是否重复
    const existingBarcode = pallet.palletBarcodes.find(
      (item) => item.barcode === mainBarcode
    );
    if (existingBarcode) {
      throw new Error("重复扫码");
    }

    // 准备新的托盘条码记录
    const newPalletBarcode = {
      barcode: mainBarcode,
      barcodeType: "MAIN",
      scanTime: new Date(),
      productionPlanWorkOrderId: productionPlanWorkOrderId,
    };

    // 处理箱条码
    if (boxBarcode) {
      const boxItem = pallet.boxItems.find(
        (item) => item.boxBarcode === boxBarcode
      );
      
      if (boxItem) {
        if (!boxItem.boxBarcodes) boxItem.boxBarcodes = [];
        boxItem.boxBarcodes.push({
          barcode: mainBarcode,
          barcodeType: "MAIN",
          scanTime: new Date(),
          productionPlanWorkOrderId: productionPlanWorkOrderId,
        });
        boxItem.quantity = boxItem.boxBarcodes.length;
      } else {
        pallet.boxItems.push({
          boxBarcode: boxBarcode,
          boxBarcodes: [{
            barcode: mainBarcode,
            barcodeType: "MAIN",
            scanTime: new Date(),
            productionPlanWorkOrderId: productionPlanWorkOrderId,
          }],
          quantity: 1,
          scanTime: new Date(),
          productionPlanWorkOrderId: productionPlanWorkOrderId,
        });
      }
    }

    // 添加条码到托盘
    pallet.palletBarcodes.push(newPalletBarcode);

    // 更新工单数量
    const workOrder = pallet.workOrders.find(wo => 
      wo.productionPlanWorkOrderId && 
      wo.productionPlanWorkOrderId.toString() === productionPlanWorkOrderId.toString()
    );
    if (workOrder) {
      workOrder.quantity = (workOrder.quantity || 0) + 1;
    }

    // 更新托盘统计信息
    pallet.barcodeCount = pallet.palletBarcodes.length;
    pallet.boxCount = pallet.boxItems.length;
    // updateAt由pre-save中间件自动处理
    pallet.updateBy = userId;

    // 检查是否达到总数量要求 
    if (pallet.barcodeCount >= pallet.totalQuantity) {
      pallet.status = "STACKED";
      if (pallet.repairStatus === "REPAIRING") {
        pallet.repairStatus = "REPAIRED";
      }
    }
  }

  /**
   * 处理托盘条码的内部实现（简化版本）
   * 使用原子操作确保一致性，避免事务读取偏好问题
   */
  static async _handlePalletBarcodeInternalSimple(
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
    fromRepairStation = false
  ) {
    let processCompleted = false; // 标记工序是否已完成
    let pallet = null; // 初始化托盘变量
    
    try {
      console.log(`开始处理托盘条码（简化版本）: ${mainBarcode}, 盒条码: ${boxBarcode}, 来自维修台: ${fromRepairStation}`);

      // 步骤1：并发检查 - 确保条码没有被其他进程处理
      const duplicateCheck = await MaterialPalletizing.findOne({
        "palletBarcodes.barcode": mainBarcode,
        status: { $in: ["STACKING", "STACKED"] }
      });
      
      if (duplicateCheck) {
        throw new Error(`条码 ${mainBarcode} 已被托盘 ${duplicateCheck.palletCode} 使用`);
      }

      // 步骤2：获取或创建托盘
      pallet = await this._getOrCreatePalletSimple(
        lineId,
        lineName,
        processStepId,
        materialId,
        materialCode,
        materialName,
        materialSpec,
        totalQuantity,
        userId,
        fromRepairStation
      );

      // 关键验证：确保托盘编号不为空
      if (!pallet || !pallet.palletCode) {
        throw new Error("托盘初始化失败，托盘编号为空");
      }

      console.log(`使用托盘: ${pallet.palletCode}`);

      // 步骤3：处理盒条码验证（如果存在）
      if (boxBarcode) {
        await this._validateBoxBarcodeSimple(boxBarcode, materialId, userId, pallet.productLineId, pallet._id);
      }

      // 步骤4：处理工单信息
      const productionPlanWorkOrderId = await this._handleWorkOrderInfoSimple(
        mainBarcode,
        pallet,
        fromRepairStation
      );

      // 步骤5：**先触发工序完成**（确保工序绑定成功）
      console.log(`开始触发工序完成: ${mainBarcode}, 托盘编号: ${pallet.palletCode}`);
      try {
        await materialProcessFlowService.scanBatchDocument(
          mainBarcode,
          pallet.processStepId,
          pallet.palletCode,
          componentScans,
          userId,
          pallet.productLineId,
          fromRepairStation
        );
        console.log(`条码 ${mainBarcode} 工序完成触发成功`);
        processCompleted = true; // 标记工序已完成
      } catch (processError) {
        console.error(`条码 ${mainBarcode} 工序完成触发失败:`, processError);
        // 工序失败，抛出错误，阻止入托
        throw new Error(`工序绑定失败，产品不能入托: ${processError.message}`);
      }

      // 步骤6：**工序成功后使用原子操作添加条码到托盘**
      let updateOperation;
      let arrayFilters = [{ 
        "elem.productionPlanWorkOrderId": productionPlanWorkOrderId 
      }];

      if (boxBarcode) {
        // 处理包装箱条码的情况
        updateOperation = {
          $push: {
            palletBarcodes: {
              barcode: mainBarcode,
              barcodeType: "MAIN",
              scanTime: new Date(),
              productionPlanWorkOrderId: productionPlanWorkOrderId,
            }
          },
          $inc: { 
            barcodeCount: 1,
            "workOrders.$[elem].quantity": 1
          },
          $set: {
            updateAt: new Date(),
            updateBy: userId
          }
        };

        // 首先尝试向现有箱子添加条码
        const existingBoxUpdateResult = await MaterialPalletizing.updateOne(
          { 
            _id: pallet._id,
            "palletBarcodes.barcode": { $ne: mainBarcode },
            status: "STACKING",
            "boxItems.boxBarcode": boxBarcode
          },
          {
            ...updateOperation,
            $push: {
              ...updateOperation.$push,
              "boxItems.$.boxBarcodes": {
                barcode: mainBarcode,
                barcodeType: "MAIN",
                scanTime: new Date(),
                productionPlanWorkOrderId: productionPlanWorkOrderId,
              }
            },
            $inc: {
              ...updateOperation.$inc,
              "boxItems.$.quantity": 1
            }
          },
          {
            arrayFilters
          }
        );

        if (existingBoxUpdateResult.modifiedCount === 0) {
          // 如果没有更新成功（箱子不存在），则创建新箱子
          const newBoxUpdateResult = await MaterialPalletizing.updateOne(
            { 
              _id: pallet._id,
              "palletBarcodes.barcode": { $ne: mainBarcode },
              status: "STACKING",
              "boxItems.boxBarcode": { $ne: boxBarcode }
            },
            {
              ...updateOperation,
              $push: {
                ...updateOperation.$push,
                boxItems: {
                  boxBarcode: boxBarcode,
                  boxBarcodes: [{
                    barcode: mainBarcode,
                    barcodeType: "MAIN",
                    scanTime: new Date(),
                    productionPlanWorkOrderId: productionPlanWorkOrderId,
                  }],
                  quantity: 1,
                  scanTime: new Date(),
                  productionPlanWorkOrderId: productionPlanWorkOrderId,
                }
              },
              $inc: {
                ...updateOperation.$inc,
                boxCount: 1
              }
            },
            {
              arrayFilters
            }
          );

          if (newBoxUpdateResult.modifiedCount === 0) {
            // 记录原子操作失败错误日志
            await this.logError({
              errorType: "ATOMIC_OPERATION_FAILED",
              operation: "SAVE_PALLET",
              error: new Error("条码添加失败，可能已被其他进程处理或托盘状态不正确"),
              barcode: mainBarcode,
              palletCode: pallet.palletCode,
              palletId: pallet._id,
              productLineId: pallet.productLineId,
              productLineName: pallet.productLineName,
              processStepId: pallet.processStepId,
              materialId: pallet.materialId,
              materialCode: pallet.materialCode,
              materialName: pallet.materialName,
              workOrderNo: pallet.workOrderNo,
              productionPlanWorkOrderId: pallet.productionPlanWorkOrderId,
              boxBarcode,
              context: {
                fromRepairStation,
                componentScans,
                palletData: pallet.toObject(),
                updateOperation,
                arrayFilters,
                operationType: "CREATE_NEW_BOX"
              },
              userId,
              processCompleted: true,
              palletStatus: pallet.status,
              impactLevel: "HIGH"
            });
            
            throw new Error(`条码 ${mainBarcode} 添加失败，可能已被其他进程处理或托盘状态不正确`);
          }
        }
      } else {
        // 没有包装箱条码的情况
        updateOperation = {
          $push: {
            palletBarcodes: {
              barcode: mainBarcode,
              barcodeType: "MAIN",
              scanTime: new Date(),
              productionPlanWorkOrderId: productionPlanWorkOrderId,
            }
          },
          $inc: { 
            barcodeCount: 1,
            "workOrders.$[elem].quantity": 1
          },
          $set: {
            updateAt: new Date(),
            updateBy: userId
          }
        };

        const updateResult = await MaterialPalletizing.updateOne(
          { 
            _id: pallet._id,
            "palletBarcodes.barcode": { $ne: mainBarcode },
            status: "STACKING"
          },
          updateOperation,
          {
            arrayFilters
          }
        );

        if (updateResult.modifiedCount === 0) {
          // 记录原子操作失败错误日志
          await this.logError({
            errorType: "ATOMIC_OPERATION_FAILED",
            operation: "SAVE_PALLET",
            error: new Error("条码添加失败，可能已被其他进程处理或托盘状态不正确"),
            barcode: mainBarcode,
            palletCode: pallet.palletCode,
            palletId: pallet._id,
            productLineId: pallet.productLineId,
            productLineName: pallet.productLineName,
            processStepId: pallet.processStepId,
            materialId: pallet.materialId,
            materialCode: pallet.materialCode,
            materialName: pallet.materialName,
            workOrderNo: pallet.workOrderNo,
            productionPlanWorkOrderId: pallet.productionPlanWorkOrderId,
            boxBarcode,
            context: {
              fromRepairStation,
              componentScans,
              palletData: pallet.toObject(),
              updateOperation,
              arrayFilters,
              operationType: "DIRECT_ADD"
            },
            userId,
            processCompleted: true,
            palletStatus: pallet.status,
            impactLevel: "HIGH"
          });
          
          throw new Error(`条码 ${mainBarcode} 添加失败，可能已被其他进程处理或托盘状态不正确`);
        }
      }

      // 步骤7：获取更新后的托盘并检查状态
      const updatedPallet = await MaterialPalletizing.findById(pallet._id);
      
      // 检查是否达到总数量要求
      if (updatedPallet.barcodeCount >= updatedPallet.totalQuantity) {
        await MaterialPalletizing.updateOne(
          { _id: pallet._id },
          { 
            $set: { 
              status: "STACKED",
              repairStatus: updatedPallet.repairStatus === "REPAIRING" ? "REPAIRED" : updatedPallet.repairStatus,
              updateAt: new Date(),
              updateBy: userId
            }
          }
        );
        updatedPallet.status = "STACKED";
        console.log(`托盘 ${updatedPallet.palletCode} 已完成组托`);
      }

      console.log(`工序绑定和托盘入托完成，条码 ${mainBarcode} 处理成功`);
      
      return updatedPallet;
    } catch (error) {
      console.error("处理托盘条码失败:", error);
      
      // 关键修复：如果工序已完成但托盘保存失败，需要回滚工序状态
      if (processCompleted && error.message.includes("添加失败")) {
        console.log(`条码 ${mainBarcode} 工序已完成但托盘保存失败，开始回滚工序状态...`);
        let rollbackSuccess = false;
        
        try {
          // 调用工序解绑方法回滚工序状态
          await materialProcessFlowService.unbindProcessComponents(
            mainBarcode,
            processStepId,
            userId,
            "托盘入托失败自动回滚",
            false, // 不解绑后续工序
            false  // 不是来自托盘解绑调用
          );
          console.log(`条码 ${mainBarcode} 工序状态回滚成功`);
          rollbackSuccess = true;
        } catch (rollbackError) {
          console.error(`条码 ${mainBarcode} 工序状态回滚失败:`, rollbackError);
          
          // 记录回滚失败错误日志
          await this.logError({
            errorType: "ROLLBACK_FAILED",
            operation: "ROLLBACK_PROCESS",
            error: rollbackError,
            barcode: mainBarcode,
            palletCode: pallet?.palletCode,
            palletId: pallet?._id,
            productLineId: lineId,
            productLineName: lineName,
            processStepId,
            materialId,
            materialCode,
            materialName,
            boxBarcode,
            context: {
              fromRepairStation,
              componentScans,
              originalError: error.message,
              rollbackReason: "托盘入托失败自动回滚"
            },
            userId,
            processCompleted: true,
            rollbackAttempted: true,
            rollbackSuccess: false,
            impactLevel: "CRITICAL"
          });
          
          // 记录回滚失败但不影响主流程错误抛出
        }
        
        // 记录托盘保存失败但工序回滚的情况
        await this.logError({
          errorType: "PALLET_SAVE_FAILED",
          operation: "SAVE_PALLET",
          error,
          barcode: mainBarcode,
          palletCode: pallet?.palletCode,
          palletId: pallet?._id,
          productLineId: lineId,
          productLineName: lineName,
          processStepId,
          materialId,
          materialCode,
          materialName,
          boxBarcode,
          context: {
            fromRepairStation,
            componentScans,
            palletData: pallet?.toObject(),
            totalQuantity
          },
          userId,
          processCompleted: true,
          palletStatus: pallet?.status,
          rollbackAttempted: true,
          rollbackSuccess,
          impactLevel: rollbackSuccess ? "MEDIUM" : "HIGH"
        });
      } else {
        // 记录其他类型的错误
        let errorType = "UNKNOWN_ERROR";
        if (error.message.includes("重复")) {
          errorType = "DUPLICATE_BARCODE";
        } else if (error.message.includes("验证")) {
          errorType = "VALIDATION_FAILED";
        } else if (error.message.includes("工序")) {
          errorType = "PROCESS_FAILED";
        }
        
        await this.logError({
          errorType,
          operation: "ADD_TO_PALLET",
          error,
          barcode: mainBarcode,
          palletCode: pallet?.palletCode,
          palletId: pallet?._id,
          productLineId: lineId,
          productLineName: lineName,
          processStepId,
          materialId,
          materialCode,
          materialName,
          boxBarcode,
          context: {
            fromRepairStation,
            componentScans,
            palletData: pallet?.toObject(),
            totalQuantity
          },
          userId,
          processCompleted,
          palletStatus: pallet?.status,
          impactLevel: "MEDIUM"
        });
      }
      
      throw error;
    }
  }

  /**
   * 获取或创建托盘（简化版本）
   */
  static async _getOrCreatePalletSimple(
    lineId,
    lineName,
    processStepId,
    materialId,
    materialCode,
    materialName,
    materialSpec,
    totalQuantity,
    userId,
    fromRepairStation = false
  ) {
    // 1. 获取产线当前进行的工单
    const currentProductionPlan = await productionPlanWorkOrder.findOne({
      productionLineId: lineId,
      status: "IN_PROGRESS",
    });

    if (!currentProductionPlan) {
      throw new Error("未找到对应的产线当前生产计划");
    }

    // 2. 查找现有的未完成托盘
    let pallet = await MaterialPalletizing.findOne({
      productLineId: lineId,
      materialId: materialId,
      status: "STACKING",
      repairStatus: { $ne: "REPAIRING" },
      productionPlanWorkOrderId: currentProductionPlan._id,
    });

    if (!pallet) {
      // 创建新托盘
      let palletCode = "YDC-SN-" + new Date().getTime();
      
      // 使用传入的totalQuantity，如果没有传入或者无效则使用默认值
      const palletTotalQuantity = (totalQuantity && totalQuantity > 0) ? totalQuantity : 1000;
      
      pallet = new MaterialPalletizing({
        palletCode,
        saleOrderId: currentProductionPlan.saleOrderId,
        saleOrderNo: currentProductionPlan.saleOrderNo,
        workOrders: [
          {
            productionOrderId: currentProductionPlan.productionOrderId,
            productionOrderNo: currentProductionPlan.productionOrderNo,
            workOrderNo: currentProductionPlan.workOrderNo,
            productionPlanWorkOrderId: currentProductionPlan._id,
            quantity: 0,
          },
        ],
        productionOrderId: currentProductionPlan.productionOrderId,
        productionOrderNo: currentProductionPlan.productionOrderNo,
        workOrderNo: currentProductionPlan.workOrderNo,
        productionPlanWorkOrderId: currentProductionPlan._id,
        productLineId: lineId,
        productLineName: lineName,
        materialId,
        materialCode,
        materialName,
        materialSpec,
        processStepId,
        status: "STACKING",
        palletBarcodes: [],
        boxItems: [],
        barcodeCount: 0,
        boxCount: 0,
        totalQuantity: palletTotalQuantity, // 使用传入的数量
        isLastPallet: false,
        createAt: new Date(),
        updateAt: new Date(),
        createBy: userId,
      });
      
      // 设置创建时间（updateAt由pre-save中间件自动处理）
      await pallet.save();
      console.log(`创建新托盘: ${palletCode}, 容量: ${palletTotalQuantity}`);
    }

    return pallet;
  }

  /**
   * 验证盒条码（简化版本）
   */
  static async _validateBoxBarcodeSimple(boxBarcode, materialId, userId, productLineId, currentPalletId = null) {
    // 构建查询条件：排除当前托盘，只检查其他托盘中是否使用了相同的包装箱条码
    const queryCondition = {
      "boxItems.boxBarcode": boxBarcode,
      status: { $in: ["STACKING", "STACKED"] }
    };
    
    // 如果提供了当前托盘ID，则排除当前托盘
    if (currentPalletId) {
      queryCondition._id = { $ne: currentPalletId };
    }
    
    const existingBoxInOtherPallet = await MaterialPalletizing.findOne(queryCondition);
    
    if (existingBoxInOtherPallet) {
      throw new Error(
        `箱条码 ${boxBarcode} 已在其他托盘 ${existingBoxInOtherPallet.palletCode} 中使用`
      );
    }
  }

  /**
   * 处理工单信息（简化版本）
   */
  static async _handleWorkOrderInfoSimple(mainBarcode, pallet, fromRepairStation) {
    let materialProcessFlow = await MaterialProcessFlow.findOne({
      barcode: mainBarcode,
    });

    if (!materialProcessFlow) {
      throw new Error(
        `条码 ${mainBarcode} 在系统中不存在 (物料流程记录未找到)`
      );
    }

    const productionPlanWorkOrderId = materialProcessFlow.productionPlanWorkOrderId;
    if (!productionPlanWorkOrderId) {
      throw new Error(`条码 ${mainBarcode} 在物料流程中未关联生产计划工单ID`);
    }

    return productionPlanWorkOrderId;
  }

  /**
   * 记录托盘错误日志
   * @param {Object} errorInfo - 错误信息对象
   * @param {String} errorInfo.errorType - 错误类型
   * @param {String} errorInfo.operation - 操作类型
   * @param {Error} errorInfo.error - 错误对象
   * @param {String} errorInfo.barcode - 条码
   * @param {String} errorInfo.palletCode - 托盘编号
   * @param {Object} errorInfo.context - 上下文信息
   * @param {String} errorInfo.userId - 用户ID
   */
  static async logError(errorInfo) {
    try {
      const {
        errorType = "UNKNOWN_ERROR",
        operation = "OTHER",
        error,
        barcode,
        palletCode,
        palletId,
        productLineId,
        productLineName,
        processStepId,
        processStepName,
        materialId,
        materialCode,
        materialName,
        workOrderNo,
        productionPlanWorkOrderId,
        boxBarcode,
        context = {},
        userId,
        processCompleted = false,
        palletStatus,
        rollbackAttempted = false,
        rollbackSuccess,
        retryCount = 0,
        isRetryable = false,
        impactLevel = "MEDIUM"
      } = errorInfo;

      const errorLog = new MaterialPalletizingErrorLog({
        palletCode,
        palletId,
        barcode,
        boxBarcode,
        productLineId,
        productLineName,
        processStepId,
        processStepName,
        materialId,
        materialCode,
        materialName,
        productionPlanWorkOrderId,
        workOrderNo,
        errorType,
        errorMessage: error?.message || "未知错误",
        errorStack: error?.stack,
        operation,
        processCompleted,
        palletStatus,
        rollbackAttempted,
        rollbackSuccess,
        retryCount,
        isRetryable,
        context: {
          ...context,
          fromRepairStation: context.fromRepairStation || false,
          componentScans: context.componentScans || [],
          palletData: context.palletData,
          requestData: context.requestData,
          userAgent: context.userAgent,
          ipAddress: context.ipAddress
        },
        impactLevel,
        affectedOperations: context.affectedOperations || [],
        createBy: userId
      });

      await errorLog.save();
      console.log(`错误日志已记录: ${errorLog.errorId}`);
      return errorLog;
    } catch (logError) {
      console.error("记录错误日志失败:", logError);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 更新错误日志为已解决状态
   * @param {String} errorId - 错误ID
   * @param {String} resolutionNote - 解决说明
   * @param {String} userId - 用户ID
   */
  static async resolveError(errorId, resolutionNote, userId) {
    try {
      await MaterialPalletizingErrorLog.updateOne(
        { errorId },
        {
          $set: {
            resolved: true,
            resolutionNote,
            resolvedAt: new Date(),
            resolvedBy: userId,
            updateAt: new Date()
          }
        }
      );
    } catch (error) {
      console.error("更新错误日志状态失败:", error);
    }
  }

  /**
   * 托盘条码异步处理（队列化版本）
   * 快速响应前端，实际处理放入队列
   * @param {String} lineId - 产线ID
   * @param {String} lineName - 产线名称
   * @param {String} processStepId - 工序ID
   * @param {String} materialId - 物料ID
   * @param {String} materialCode - 物料编码
   * @param {String} materialName - 物料名称
   * @param {String} materialSpec - 物料规格
   * @param {String} mainBarcode - 主条码
   * @param {String} boxBarcode - 箱条码(可选)
   * @param {Number} totalQuantity - 托盘条码批次数量
   * @param {String} userId - 用户ID
   * @param {Array} componentScans - 子物料信息
   * @param {Boolean} fromRepairStation - 是否来自维修台，默认为false
   * @returns {Object} 队列任务信息和基本托盘信息
   */
  static async handlePalletBarcodeAsync(
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
    fromRepairStation = false
  ) {
    try {
      console.log(`开始托盘条码异步处理: ${mainBarcode}, 产线: ${lineName}`);

      // 步骤1：获取或预创建托盘信息（用于快速响应）
      const palletInfo = await this._getPalletInfoForQuickResponse(
        lineId,
        lineName,
        processStepId,
        materialId,
        materialCode,
        materialName,
        materialSpec,
        totalQuantity,
        userId,
        fromRepairStation
      );

      // 步骤2：快速基础验证（包含当前托盘ID以正确处理箱条码验证）
      const validationResult = await this._quickValidation(
        lineId,
        materialId,
        mainBarcode,
        boxBarcode,
        fromRepairStation,
        palletInfo._id, // 传递托盘ID用于箱条码验证
        processStepId   // 🔧 添加工序ID用于前置工序验证
      );

      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }

      // 步骤3：将实际处理任务提交到队列
      const { QueueService } = require('./queueService');
      const queueResult = await QueueService.addPalletProcessingTask({
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
      });

      if (!queueResult.success) {
        throw new Error(`队列任务创建失败: ${queueResult.error}`);
      }

      console.log(`托盘条码异步处理任务已提交: ${mainBarcode}, JobId: ${queueResult.jobId}`);

      // 步骤4：返回前端兼容的响应（模拟同步处理的结果）
      return {
        palletCode: palletInfo.palletCode,
        productionOrderId: palletInfo.productionOrderId,
        workOrderNo: palletInfo.workOrderNo,
        saleOrderId: palletInfo.saleOrderId,
        saleOrderNo: palletInfo.saleOrderNo,
        totalQuantity: palletInfo.totalQuantity,
        barcodeCount: palletInfo.barcodeCount + 1, // 预计增加1个条码
        status: "PROCESSING", // 处理中状态
        // 队列相关信息
        queueInfo: {
          jobId: queueResult.jobId,
          estimatedDelay: queueResult.estimatedDelay,
          queueLength: queueResult.queueLength,
          message: "托盘处理任务已加入队列，正在后台处理"
        },
        // 为了前端兼容性，保留原有字段结构
        _id: palletInfo._id,
        materialId: palletInfo.materialId,
        materialCode: palletInfo.materialCode,
        materialName: palletInfo.materialName,
        processStepId: palletInfo.processStepId,
        productLineId: palletInfo.productLineId,
        productLineName: palletInfo.productLineName
      };

    } catch (error) {
      console.error("托盘条码异步处理失败:", error);
      throw error;
    }
  }

  /**
   * 快速验证（在提交队列前进行基础验证）
   * @param {String} lineId - 产线ID
   * @param {String} materialId - 物料ID
   * @param {String} mainBarcode - 主条码
   * @param {String} boxBarcode - 箱条码
   * @param {Boolean} fromRepairStation - 是否来自维修台
   * @returns {Object} 验证结果
   */
  static async _quickValidation(lineId, materialId, mainBarcode, boxBarcode, fromRepairStation, currentPalletId = null, processStepId = null) {
    try {
      // 1. 检查条码是否重复
      const duplicateCheck = await MaterialPalletizing.findOne({
        "palletBarcodes.barcode": mainBarcode,
        status: { $in: ["STACKING", "STACKED"] }
      }).select('palletCode');
      
      if (duplicateCheck) {
        return {
          valid: false,
          error: `条码 ${mainBarcode} 已被托盘 ${duplicateCheck.palletCode} 使用`
        };
      }

      // 2. 检查产线是否有正在进行的生产计划
      const currentProductionPlan = await productionPlanWorkOrder.findOne({
        productionLineId: lineId,
        status: "IN_PROGRESS",
      }).select('_id');

      if (!currentProductionPlan) {
        return {
          valid: false,
          error: "未找到对应的产线当前生产计划"
        };
      }

      // 3. 检查箱条码重复（如果存在）
      if (boxBarcode) {
        // 构建查询条件：排除当前托盘，只检查其他托盘中是否使用了相同的包装箱条码
        const queryCondition = {
          "boxItems.boxBarcode": boxBarcode,
          status: { $in: ["STACKING", "STACKED"] }
        };
        
        // 如果提供了当前托盘ID，则排除当前托盘
        if (currentPalletId) {
          queryCondition._id = { $ne: currentPalletId };
        }
        
        const existingBoxInOtherPallet = await MaterialPalletizing.findOne(queryCondition).select('palletCode');
        
        if (existingBoxInOtherPallet) {
          return {
            valid: false,
            error: `箱条码 ${boxBarcode} 已在其他托盘 ${existingBoxInOtherPallet.palletCode} 中使用`
          };
        }
      }

      // 4. 检查条码是否在流程系统中存在，并获取完整的流程数据用于前置工序验证
      const materialProcessFlow = await MaterialProcessFlow.findOne({
        barcode: mainBarcode,
      });

      if (!materialProcessFlow) {
        return {
          valid: false,
          error: `条码 ${mainBarcode} 在系统中不存在`
        };
      }

      // 🔧 关键修复：添加前置工序完成状态验证
      // 5. 检查前置工序完成状态（避免前端假成功）
      if (!fromRepairStation) { // 维修台可以跳过前置工序检查
        // 查找当前工序节点
        const processNode = materialProcessFlow.processNodes.find(
          (node) =>
            node.processStepId &&
            node.processStepId.toString() === processStepId.toString() &&
            node.nodeType === "PROCESS_STEP"
        );

        if (!processNode) {
          return {
            valid: false,
            error: `未找到条码 ${mainBarcode} 对应的工序节点`
          };
        }

        // 验证工序节点状态
        if (processNode.status !== "PENDING") {
          return {
            valid: false,
            error: "该工序节点已完成或处于异常状态"
          };
        }

        // 🔧 关键：调用前置工序检查方法
        const MaterialProcessFlowService = require('./materialProcessFlowService');
        const checkResult = MaterialProcessFlowService.checkPreviousProcessSteps(
          materialProcessFlow.processNodes,
          processNode
        );

        if (!checkResult.isValid) {
          const unfinishedList = checkResult.unfinishedSteps
            .map((step) => `${step.processName}(${step.processCode})`)
            .join("、");
          return {
            valid: false,
            error: `存在未完成的前置工序: ${unfinishedList}，请先完成前置工序`
          };
        }
      }

      return { valid: true };

    } catch (error) {
      console.error("快速验证失败:", error);
      return {
        valid: false,
        error: `验证失败: ${error.message}`
      };
    }
  }

  /**
   * 获取托盘信息用于快速响应
   * @param {String} lineId - 产线ID
   * @param {String} lineName - 产线名称
   * @param {String} processStepId - 工序ID
   * @param {String} materialId - 物料ID
   * @param {String} materialCode - 物料编码
   * @param {String} materialName - 物料名称
   * @param {String} materialSpec - 物料规格
   * @param {Number} totalQuantity - 托盘总数量
   * @param {String} userId - 用户ID
   * @param {Boolean} fromRepairStation - 是否来自维修台
   * @returns {Object} 托盘信息
   */
  static async _getPalletInfoForQuickResponse(
    lineId,
    lineName,
    processStepId,
    materialId,
    materialCode,
    materialName,
    materialSpec,
    totalQuantity,
    userId,
    fromRepairStation = false
  ) {
    try {
      // 获取当前生产计划
      const currentProductionPlan = await productionPlanWorkOrder.findOne({
        productionLineId: lineId,
        status: "IN_PROGRESS",
      });

      // 查找现有的未完成托盘
      let pallet = await MaterialPalletizing.findOne({
        productLineId: lineId,
        materialId: materialId,
        status: "STACKING",
        repairStatus: { $ne: "REPAIRING" },
        productionPlanWorkOrderId: currentProductionPlan._id,
      });

      if (!pallet) {
        // 预创建托盘信息（不保存到数据库，只用于响应）
        const palletCode = "YDC-SN-" + new Date().getTime();
        const palletTotalQuantity = (totalQuantity && totalQuantity > 0) ? totalQuantity : 1000;
        
        return {
          palletCode,
          saleOrderId: currentProductionPlan.saleOrderId,
          saleOrderNo: currentProductionPlan.saleOrderNo,
          productionOrderId: currentProductionPlan.productionOrderId,
          workOrderNo: currentProductionPlan.workOrderNo,
          totalQuantity: palletTotalQuantity,
          barcodeCount: 0, // 新托盘，条码数为0
          materialId,
          materialCode,
          materialName,
          processStepId,
          productLineId: lineId,
          productLineName: lineName,
          _id: new mongoose.Types.ObjectId() // 使用真正的ObjectId作为临时ID
        };
      } else {
        // 返回现有托盘信息
        return {
          palletCode: pallet.palletCode,
          saleOrderId: pallet.saleOrderId,
          saleOrderNo: pallet.saleOrderNo,
          productionOrderId: pallet.productionOrderId,
          workOrderNo: pallet.workOrderNo,
          totalQuantity: pallet.totalQuantity,
          barcodeCount: pallet.barcodeCount,
          materialId: pallet.materialId,
          materialCode: pallet.materialCode,
          materialName: pallet.materialName,
          processStepId: pallet.processStepId,
          productLineId: pallet.productLineId,
          productLineName: pallet.productLineName,
          _id: pallet._id
        };
      }

    } catch (error) {
      console.error("获取托盘信息失败:", error);
      throw new Error(`获取托盘信息失败: ${error.message}`);
    }
  }
}

module.exports = MaterialPalletizingService;
