const productionPlanWorkOrder = require("../model/project/productionPlanWorkOrder");
const MaterialPalletizing = require("../model/project/materialPalletizing");
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const ProductLine = require("../model/project/productionLine");
const materialProcessFlowService = require("./materialProcessFlowService");
const MaterialPalletizingUnbindLog = require("../model/project/materialPalletizingUnbindLog");

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
    userId
  ) {
    try {
      // 查找托盘记录
      let pallet = await MaterialPalletizing.findOne({
        productLineId: lineId,
        status: "STACKING",
      });

      // 如果托盘不存在，创建新的托盘记录
      if (!pallet) {
        //查询产线生产计划
        const productionPlan = await productionPlanWorkOrder.findOne({
          productionLineId: lineId,
          status: "IN_PROGRESS",
        });

        console.log("productionPlan", productionPlan);

        if (!productionPlan) {
          throw new Error("未找到对应的产线计划");
        }

        let palletCode = "YDC-SN-" + new Date().getTime();

        //获取产线计划对应的销售订单和生产订单
        let saleOrderId = productionPlan.saleOrderId;
        let saleOrderNo = productionPlan.saleOrderNo;
        let productionOrderId = productionPlan.productionOrderId;
        let productionOrderNo = productionPlan.productionOrderNo;
        let productionPlanWorkOrderId = productionPlan._id;
        let workOrderNo = productionPlan.workOrderNo;

        pallet = new MaterialPalletizing({
          palletCode,
          saleOrderId,
          saleOrderNo,
          productionOrderId,
          productionOrderNo,
          workOrderNo,
          productionPlanWorkOrderId,
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
          createAt: new Date(),
          updateAt: new Date(),
        });
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
      };

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
      }

      //对应主条码的工序完成触发
      await materialProcessFlowService.scanBatchDocument(
        mainBarcode,
        processStepId,
        pallet.palletCode,
        userId,
        lineId
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
   * 解绑条码
   * @param {String} palletCode - 托盘编号
   * @param {String} barcode - 需要解绑的条码
   * @param {String} userId - 操作用户ID
   */
  static async unbindBarcode(palletCode, barcode, userId, reason = "托盘解绑") {
    try {
      const pallet = await MaterialPalletizing.findOne({ palletCode });
      if (!pallet) {
        throw new Error("未找到对应的托盘记录");
      }

      // 保存解绑前的托盘数据快照
      const originalData = pallet.toObject();
      const affectedBarcodes = [];

      // 检查是否为箱条码
      const boxItem = pallet.boxItems.find(item => item.boxBarcode === barcode);
      if (boxItem) {
        // 记录所有受影响的条码
        boxItem.boxBarcodes.forEach(bb => {
          affectedBarcodes.push({
            barcode: bb.barcode,
            barcodeType: "MAIN",
            boxBarcode: boxItem.boxBarcode
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
          createBy: userId
        });

        // 解绑整个箱子
        // 1. 解绑箱内所有条码的工序状态
        for (const boxBarcode of boxItem.boxBarcodes) {
          await materialProcessFlowService.unbindProcessComponents(
            boxBarcode.barcode,
            pallet.processStepId, // processStepId 设为 null，因为不需要指定具体工序
            userId,
            "托盘解绑", // 添加解绑原因
            true // 不解绑后续工序
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
          barcodeType: "MAIN"
        });

        // 创建解绑日志
        await MaterialPalletizingUnbindLog.create({
          palletCode,
          unbindType: "SINGLE",
          unbindBarcode: barcode,
          originalData,
          affectedBarcodes,
          reason,
          createBy: userId
        });

        // 解绑单个条码
        // 1. 重置工序状态
        await materialProcessFlowService.unbindProcessComponents(
          barcode,
          pallet.processStepId, // processStepId 设为 null，因为不需要指定具体工序
          userId,
          "托盘解绑", // 添加解绑原因
          true // 不解绑后续工序
        );

        // 2. 从托盘条码列表中移除
        pallet.palletBarcodes = pallet.palletBarcodes.filter(
          (pb) => pb.barcode !== barcode
        );
      }

      // 更新托盘状态和计数
      pallet.barcodeCount = pallet.palletBarcodes.length;
      pallet.boxCount = pallet.boxItems.length;
      pallet.status = "STACKING"; // 解绑后重置为组托中状态
      pallet.updateAt = new Date();
      pallet.updateBy = userId;

      await pallet.save();
      return pallet;
    } catch (error) {
      console.error("解绑条码失败:", error);
      throw error;
    }
  }

  static async unbindPalletBarcode(palletCode, userId, reason = "托盘整体解绑") {
    try {
      const pallet = await MaterialPalletizing.findOne({ palletCode });
      if (!pallet) {
        throw new Error("未找到对应的托盘记录");
      }

      // 保存解绑前的托盘数据快照
      const originalData = pallet.toObject();
      const affectedBarcodes = [];

      // 收集所有受影响的条码
      pallet.boxItems.forEach(boxItem => {
        boxItem.boxBarcodes.forEach(bb => {
          affectedBarcodes.push({
            barcode: bb.barcode,
            barcodeType: "MAIN",
            boxBarcode: boxItem.boxBarcode
          });
        });
      });

      pallet.palletBarcodes.forEach(pb => {
        const isInBox = pallet.boxItems.some(item =>
          item.boxBarcodes.some(bb => bb.barcode === pb.barcode)
        );
        if (!isInBox) {
          affectedBarcodes.push({
            barcode: pb.barcode,
            barcodeType: "MAIN"
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
        createBy: userId
      });

      // 解绑整个托盘
      // 1. 解绑所有条码的工序状态
      for (const palletBarcode of pallet.palletBarcodes) {
        await materialProcessFlowService.unbindProcessComponents(
          palletBarcode.barcode,
          pallet.processStepId, // processStepId 设为 null，因为不需要指定具体工序
          userId,
          "托盘解绑", // 添加解绑原因
          true // 不解绑后续工序
        );
      }

      // 2. 清空托盘条码列表和箱记录
      pallet.palletBarcodes = [];
      pallet.boxItems = [];

      // 更新托盘状态和计数
      pallet.barcodeCount = 0;
      pallet.boxCount = 0;
      pallet.status = "STACKING"; // 解绑后重置为组托中状态
      pallet.updateAt = new Date();
      pallet.updateBy = userId;

      await pallet.save();
      return pallet;
    } catch (error) {
      console.error("解绑托盘所有条码失败:", error);
      throw error;
    }
  }
}

module.exports = MaterialPalletizingService;
