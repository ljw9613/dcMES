const productionPlanWorkOrder = require("../model/project/productionPlanWorkOrder");
const MaterialPalletizing = require("../model/project/materialPalletizing");
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const ProductLine = require("../model/project/productionLine");
const materialProcessFlowService = require("./materialProcessFlowService");
const MaterialPalletizingUnbindLog = require("../model/project/materialPalletizingUnbindLog");
const WarehouseEntry = require("../model/warehouse/warehouseEntry");
const mongoose = require("mongoose");

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
    try {
      // 首先查找进行中的产线计划
      const productionPlan = await productionPlanWorkOrder.findOne({
        productionLineId: lineId,
        status: "IN_PROGRESS",
      });

      //校验托盘数量
      if (totalQuantity <= 0) {
        throw new Error("托盘数量不能小于等于0");
      }

      if (!productionPlan) {
        throw new Error("未找到对应的产线计划");
      }

      // 查找当前未完成的托盘（STACKING状态）
      let pallet = await MaterialPalletizing.findOne({
        productLineId: lineId,
        materialId: materialId,
        saleOrderId: productionPlan.saleOrderId, // 按销售订单ID查询
        status: "STACKING",
        repairStatus: { $ne: "REPAIRING" },
      });

      // 计算当前销售订单下所有托盘的条码总数
      const existingPallets = await MaterialPalletizing.find({
        saleOrderId: productionPlan.saleOrderId,
        materialId: materialId,
      });

      const totalExistingBarcodes = existingPallets.reduce(
        (sum, p) => sum + p.totalQuantity,
        0
      );

      // 如果不存在托盘，则创建新的托盘
      if (!pallet) {
        let palletCode = "YDC-SN-" + new Date().getTime();

        if (
          typeof totalQuantity === "number" &&
          typeof productionPlan.planQuantity === "number"
        ) {
          // 使用销售订单数量减去已有的所有托盘中的条码总数
          if (
            totalQuantity >
            productionPlan.planQuantity - totalExistingBarcodes
          ) {
            totalQuantity = productionPlan.planQuantity - totalExistingBarcodes;

            if (totalQuantity <= 0) {
              throw new Error("销售订单数量已达到上限，无法创建新托盘");
            }
          }
        }

        // 检查是否是尾数托盘（创建的托盘数量加上已有数量是否达到销售订单数量）
        const isLastPallet =
          totalQuantity + totalExistingBarcodes >= productionPlan.planQuantity;

        // 创建托盘时记录工单信息数组，以支持多工单
        pallet = new MaterialPalletizing({
          palletCode,
          saleOrderId: productionPlan.saleOrderId,
          saleOrderNo: productionPlan.saleOrderNo,
          // 保存多个工单信息的数组
          workOrders: [
            {
              productionOrderId: productionPlan.productionOrderId,
              productionOrderNo: productionPlan.productionOrderNo,
              workOrderNo: productionPlan.workOrderNo,
              productionPlanWorkOrderId: productionPlan._id,
              quantity: 0, // 初始数量为0，后续会累加
            },
          ],
          // 仍然保留原字段，保持向后兼容
          productionOrderId: productionPlan.productionOrderId,
          productionOrderNo: productionPlan.productionOrderNo,
          workOrderNo: productionPlan.workOrderNo,
          productionPlanWorkOrderId: productionPlan._id,
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
          totalQuantity,
          isLastPallet, // 添加尾数托盘标识
          createAt: new Date(),
          updateAt: new Date(),
        });
      } else {
        // 检查该工单是否已在托盘的工单列表中
        if (!pallet.workOrders) {
          // 如果之前的托盘没有workOrders字段，初始化它
          pallet.workOrders = [
            {
              productionOrderId: productionPlan.productionOrderId,
              productionOrderNo: productionPlan.productionOrderNo,
              workOrderNo: productionPlan.workOrderNo,
              productionPlanWorkOrderId: productionPlan._id,
              quantity: 0,
            },
          ];
        } else {
          // 检查当前工单是否已存在于工单列表中
          const existingWorkOrder = pallet.workOrders.find(
            (wo) =>
              wo.productionPlanWorkOrderId &&
              wo.productionPlanWorkOrderId.toString() ===
                productionPlan._id.toString()
          );

          if (!existingWorkOrder) {
            // 如果不存在，添加新工单信息
            pallet.workOrders.push({
              productionOrderId: productionPlan.productionOrderId,
              productionOrderNo: productionPlan.productionOrderNo,
              workOrderNo: productionPlan.workOrderNo,
              productionPlanWorkOrderId: productionPlan._id,
              quantity: 0,
            });
          }
        }

        // 验证当前托盘中添加新条码是否会超出销售订单数量
        if (pallet.barcodeCount + 1 > pallet.totalQuantity) {
          // 根据销售订单剩余数量调整托盘总数量
          const remainingQuantity =
            productionPlan.planQuantity -
            (totalExistingBarcodes - pallet.barcodeCount);
          if (remainingQuantity > pallet.totalQuantity) {
            pallet.totalQuantity = remainingQuantity;

            // 更新是否为尾数托盘的标识
            pallet.isLastPallet =
              pallet.barcodeCount +
                1 +
                (totalExistingBarcodes - pallet.barcodeCount) >=
              productionPlan.planQuantity;
          } else {
            throw new Error("托盘条码数量已达到上限，请创建新托盘");
          }
        }
      }

      // 检查主条码是否重复
      const existingBarcode = pallet.palletBarcodes.find(
        (item) => item.barcode === mainBarcode
      );

      if (existingBarcode) {
        throw new Error("重复扫码");
      }

      let materialProcessFlow = await MaterialProcessFlow.findOne({
        barcode: mainBarcode,
      });

      if (!materialProcessFlow) {
        throw new Error("对应的主条码在系统中不存在");
      }

      // 准备新的托盘条码记录
      const newPalletBarcode = {
        materialProcessFlowId: materialProcessFlow._id,
        barcode: mainBarcode,
        barcodeType: "MAIN",
        scanTime: new Date(),
        // 记录该条码属于哪个工单
        productionPlanWorkOrderId: productionPlan._id,
        workOrderNo: productionPlan.workOrderNo,
      };

      // 更新对应工单的数量
      const workOrderIndex = pallet.workOrders.findIndex(
        (wo) =>
          wo.productionPlanWorkOrderId &&
          wo.productionPlanWorkOrderId.toString() ===
            productionPlan._id.toString()
      );

      if (workOrderIndex !== -1) {
        pallet.workOrders[workOrderIndex].quantity += 1;
      }

      if (boxBarcode) {
        // 如果有箱条码，查找并更新boxItems
        const boxItem = pallet.boxItems.find(
          (item) => item.boxBarcode === boxBarcode
        );

        // 计算当前托盘已有的条码总数（不包括即将添加的新条码）
        const currentTotalBarcodes = MaterialProcessFlow.find({
          processNodes: {
            $elemMatch: {
              barcode: boxBarcode,
              status: "COMPLETED",
              isPackingBox: true,
            },
          },
        }).countDocuments();

        if (boxItem) {
          // 如果找到对应的箱条码，检查添加新条码是否会超出总数量
          if (pallet.boxCount + currentTotalBarcodes > pallet.totalQuantity) {
            throw new Error(
              `此箱条码数量将超出单据总数量限制 ${pallet.totalQuantity}`
            );
          }

          // 如果没超出，将主条码关联到该箱
          if (!boxItem.boxBarcodes) {
            boxItem.boxBarcodes = [];
          }
          // 准备新的托盘条码记录
          const boxPalletBarcode = {
            materialProcessFlowId: materialProcessFlow._id,
            barcode: mainBarcode,
            barcodeType: "MAIN",
            scanTime: new Date(),
            productionPlanWorkOrderId: productionPlan._id,
            workOrderNo: productionPlan.workOrderNo,
          };

          boxItem.boxBarcodes.push(boxPalletBarcode);
          boxItem.quantity = boxItem.boxBarcodes.length; // 更新箱内数量
        } else {
          // 如果是新箱，同样检查是否会超出总数量
          if (currentTotalBarcodes > pallet.totalQuantity) {
            throw new Error(
              `此箱条码数量将超出单据总数量限制 ${pallet.totalQuantity}`
            );
          }

          // 准备新的托盘条码记录
          const boxPalletBarcode = {
            materialProcessFlowId: materialProcessFlow._id,
            barcode: mainBarcode,
            barcodeType: "MAIN",
            scanTime: new Date(),
            productionPlanWorkOrderId: productionPlan._id,
            workOrderNo: productionPlan.workOrderNo,
          };

          // 如果没超出，创建新的boxItem
          pallet.boxItems.push({
            boxBarcode: boxBarcode,
            boxBarcodes: [boxPalletBarcode],
            quantity: 1, // 初始化箱内数量为1
            scanTime: new Date(),
          });
        }
      }

      // 添加到palletBarcodes
      pallet.palletBarcodes.push(newPalletBarcode);

      // 更新计数和状态
      pallet.barcodeCount = pallet.palletBarcodes.length;
      pallet.boxCount = pallet.boxItems.length;
      pallet.updateAt = new Date();

      // 检查是否达到总数量要求
      if (pallet.barcodeCount === pallet.totalQuantity) {
        pallet.status = "STACKED";

        // 检查托盘是否处于维修中状态，如果是则更新为维修完成状态
        if (pallet.repairStatus === "REPAIRING") {
          pallet.repairStatus = "REPAIRED";
          console.log(
            `托盘 ${pallet.palletCode} 组托完成，从维修中状态更新为维修完成状态`
          );
        }
      }

      // 检查添加条码后是否成为尾数托盘
      if (!pallet.isLastPallet) {
        const totalWithCurrent =
          totalExistingBarcodes -
          pallet.barcodeCount +
          pallet.palletBarcodes.length;
        pallet.isLastPallet = totalWithCurrent >= productionPlan.planQuantity;
      }

      //对应主条码的工序完成触发
      await materialProcessFlowService.scanBatchDocument(
        mainBarcode,
        processStepId,
        pallet.palletCode,
        componentScans,
        userId,
        lineId,
        fromRepairStation // 传递是否来自维修台
      );

      // 保存更新
      await pallet.save();

      return pallet;
    } catch (error) {
      console.error("处理托盘条码失败:", error);
      throw error;
    }
  }

  /**
   * 将产品条码添加到指定托盘
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
    try {
      // 查找指定托盘
      const pallet = await MaterialPalletizing.findOne({ palletCode });
      if (!pallet) {
        throw new Error("未找到指定的托盘");
      }

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

      // 准备新的托盘条码记录
      const newPalletBarcode = {
        materialProcessFlowId: materialProcessFlow._id,
        barcode: mainBarcode,
        barcodeType: "MAIN",
        scanTime: new Date(),
        productionPlanWorkOrderId: productionPlan._id,
        workOrderNo: productionPlan.workOrderNo,
      };

      // 更新对应工单的数量
      if (pallet.workOrders && pallet.workOrders.length > 0) {
        const workOrderIndex = pallet.workOrders.findIndex(
          (wo) =>
            wo.productionPlanWorkOrderId &&
            wo.productionPlanWorkOrderId.toString() ===
              productionPlan._id.toString()
        );

        if (workOrderIndex !== -1) {
          pallet.workOrders[workOrderIndex].quantity += 1;
        } else {
          // 如果当前工单不在工单列表中，添加新工单信息
          pallet.workOrders.push({
            productionOrderId: productionPlan.productionOrderId,
            productionOrderNo: productionPlan.productionOrderNo,
            workOrderNo: productionPlan.workOrderNo,
            productionPlanWorkOrderId: productionPlan._id,
            quantity: 1,
          });
        }
      } else {
        // 如果工单列表不存在，初始化它
        pallet.workOrders = [
          {
            productionOrderId: productionPlan.productionOrderId,
            productionOrderNo: productionPlan.productionOrderNo,
            workOrderNo: productionPlan.workOrderNo,
            productionPlanWorkOrderId: productionPlan._id,
            quantity: 1,
          },
        ];
      }

      // 处理箱条码
      if (boxBarcode) {
        // 如果有箱条码，查找并更新boxItems
        const boxItem = pallet.boxItems.find(
          (item) => item.boxBarcode === boxBarcode
        );

        if (boxItem) {
          // 如果找到对应的箱条码
          if (!boxItem.boxBarcodes) {
            boxItem.boxBarcodes = [];
          }

          // 准备新的箱内条码记录
          const boxPalletBarcode = {
            materialProcessFlowId: materialProcessFlow._id,
            barcode: mainBarcode,
            barcodeType: "MAIN",
            scanTime: new Date(),
            productionPlanWorkOrderId: productionPlan._id,
            workOrderNo: productionPlan.workOrderNo,
          };

          boxItem.boxBarcodes.push(boxPalletBarcode);
          boxItem.quantity = boxItem.boxBarcodes.length; // 更新箱内数量
        } else {
          // 如果是新箱
          // 准备新的箱内条码记录
          const boxPalletBarcode = {
            materialProcessFlowId: materialProcessFlow._id,
            barcode: mainBarcode,
            barcodeType: "MAIN",
            scanTime: new Date(),
            productionPlanWorkOrderId: productionPlan._id,
            workOrderNo: productionPlan.workOrderNo,
          };

          // 创建新的boxItem
          pallet.boxItems.push({
            boxBarcode: boxBarcode,
            boxBarcodes: [boxPalletBarcode],
            quantity: 1, // 初始化箱内数量为1
            scanTime: new Date(),
          });
        }
      }

      // 添加到palletBarcodes
      pallet.palletBarcodes.push(newPalletBarcode);

      // 更新计数和状态
      pallet.barcodeCount = pallet.palletBarcodes.length;
      pallet.boxCount = pallet.boxItems.length;
      pallet.updateAt = new Date();
      pallet.updateBy = userId;

      // 检查是否达到总数量要求
      if (pallet.barcodeCount === pallet.totalQuantity) {
        pallet.status = "STACKED";

        // 检查托盘是否处于维修中状态，如果是则更新为维修完成状态
        if (pallet.repairStatus === "REPAIRING") {
          pallet.repairStatus = "REPAIRED";
          console.log(
            `托盘 ${pallet.palletCode} 组托完成，从维修中状态更新为维修完成状态`
          );
        }
      }

      // 更新是否为尾数托盘
      // 计算当前销售订单下所有托盘的条码总数
      const existingPallets = await MaterialPalletizing.find({
        saleOrderId: pallet.saleOrderId,
        materialId: pallet.materialId,
        _id: { $ne: pallet._id }, // 排除当前托盘
      });

      const totalExistingBarcodes =
        existingPallets.reduce((sum, p) => sum + p.barcodeCount, 0) +
        pallet.barcodeCount;

      if (!pallet.isLastPallet && productionPlan.planQuantity) {
        pallet.isLastPallet =
          totalExistingBarcodes >= productionPlan.planQuantity;
      }

      // 对应主条码的工序完成触发
      await materialProcessFlowService.scanBatchDocument(
        mainBarcode,
        pallet.processStepId,
        pallet.palletCode,
        componentScans,
        userId,
        pallet.productLineId,
        fromRepairStation // 传递是否来自维修台
      );

      // 保存更新
      await pallet.save();

      return pallet;
    } catch (error) {
      console.error("添加条码到指定托盘失败:", error);
      throw error;
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
        `开始解绑托盘条码: ${palletCode}, 条码: ${barcode}, fromProcessUnbind: ${fromProcessUnbind}`
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

        // 减少工单产出量 - 解绑箱中每个条码减少一个产出量
        // if (pallet.productionPlanWorkOrderId) {
        //   await materialProcessFlowService.updateWorkOrderQuantity(
        //     pallet.productionPlanWorkOrderId.toString(),
        //     "output",
        //     -boxItem.boxBarcodes.length // 负数表示减少产出量
        //   );
        // }

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

        // 减少工单产出量 - 解绑单个条码减少一个产出量
        // if (pallet.productionPlanWorkOrderId) {
        //   await materialProcessFlowService.updateWorkOrderQuantity(
        //     pallet.productionPlanWorkOrderId.toString(),
        //     "output",
        //     -1 // 负数表示减少产出量
        //   );
        // }

        // 找到条码对应的工单记录并减少计数
        const palletBarcode = pallet.palletBarcodes.find(
          (pb) => pb.barcode === barcode
        );
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

      pallet.updateAt = new Date();
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
          "托盘解绑", // 添加解绑原因
          true, // 解绑后续工序
          true // 标记为来自托盘解绑调用
        );
      }

      // 减少工单产出量 - 解绑托盘中所有条码减少相应产出量
      if (pallet.productionPlanWorkOrderId && pallet.barcodeCount > 0) {
        await materialProcessFlowService.updateWorkOrderQuantity(
          pallet.productionPlanWorkOrderId.toString(),
          "output",
          -pallet.barcodeCount // 负数表示减少产出量
        );
      }

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
        pallet.repairStatus = "REPAIRING"; // 设置为维修中状态
        console.log(
          `托盘 ${palletCode} 整体解绑，从组托完成状态更新为维修中状态`
        );
      }

      // 无论维修状态如何，都将组托状态重置为组托中
      pallet.status = "STACKING"; // 解绑后重置为组托中状态

      // 清理所有工单信息(全部解绑后所有工单数量都为0)
      pallet.workOrders = [];

      pallet.updateAt = new Date();
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
      const allPalletBarcodes = originalPallet.palletBarcodes.map(
        (pb) => pb.barcode
      );
      const invalidBarcodes = barcodes.filter(
        (barcode) => !allPalletBarcodes.includes(barcode)
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
        // 新托盘的出入库状态暂时设置为待入库，后续会根据拆分的条码状态进行更新
        inWarehouseStatus: "IN_WAREHOUSE",
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

          // 将部分条码加入到新托盘的箱中
          newPallet.boxItems.push({
            ...updatedBox,
            quantity: updatedBox.boxBarcodes.length,
          });

          // 更新原托盘中的箱
          await MaterialPalletizing.updateOne(
            {
              palletCode: originalPalletCode,
              "boxItems.boxBarcode": boxBarcode,
            },
            { $set: { "boxItems.$": updatedOriginalBox } }
          );
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

      // 9. 从原托盘中移除条码
      const remainingBarcodesCount =
        originalPallet.palletBarcodes.length - barcodes.length;
      await MaterialPalletizing.updateOne(
        { palletCode: originalPalletCode },
        {
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
        }
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
            // 如果所有剩余条码都是待出库状态，则设置为已入库
            updatedOriginalPallet.inWarehouseStatus = "IN_WAREHOUSE";
          }
        } else {
          // 如果原托盘没有任何条码了，则设置为已入库
          updatedOriginalPallet.inWarehouseStatus = "IN_WAREHOUSE";
        }

        // 保存更新后的原托盘
        await updatedOriginalPallet.save();
      }

      // 检查拆分到新托盘的条码出库状态，确定新托盘的出入库状态
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
          // 如果所有拆分条码都是待出库状态
          if (
            originalPallet.inWarehouseStatus === "PENDING" ||
            originalPallet.inWarehouseStatus === "IN_WAREHOUSE"
          ) {
            // 如果原托盘状态是待入库或已入库，则新托盘状态与原托盘一致
            newPallet.inWarehouseStatus = originalPallet.inWarehouseStatus;
          } else if (
            originalPallet.inWarehouseStatus === "PART_OUT_WAREHOUSE"
          ) {
            // 如果原托盘状态是部分出库，则新托盘状态为已入库
            newPallet.inWarehouseStatus = "IN_WAREHOUSE";
          }
        }
      }

      // 8. 创建新托盘记录
      // 清理数量为0的工单
      this.cleanZeroQuantityWorkOrders(newPallet);
      const createdPallet = await MaterialPalletizing.create(newPallet);

      // 12. 处理入库单中的关联关系
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
        // 如果没有剩余条码，则设置为已入库
        finalOriginalPallet.inWarehouseStatus = "IN_WAREHOUSE";
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
          // 如果所有剩余条码都是待出库状态，则设置为已入库
          finalOriginalPallet.inWarehouseStatus = "IN_WAREHOUSE";
        }
      }

      // 保存更新的出入库状态
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
}

module.exports = MaterialPalletizingService;
