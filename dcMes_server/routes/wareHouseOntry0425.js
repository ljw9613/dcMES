const express = require("express");
const router = express.Router();
const wareHouseOntry = require("../model/warehouse/warehouseOntry");
const K3ProductionOrder = require("../model/k3/k3_PRD_MO");
const MaterialPallet = require("../model/project/materialPalletizing");
const { k3cMethod } = require("./k3cMethod");
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const K3SaleOrder = require("../model/k3/k3_SAL_SaleOrder");
// 创建一个生成出库单号的辅助函数（按日期生成流水号）
async function generateEntryNoByProductionOrder(productionOrderNo) {
  // 获取当前日期并格式化为YYYYMMDD
  const today = new Date();
  const dateStr =
    today.getFullYear() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const baseEntryNo = "SCCK-MES-" + dateStr;

  // 获取今天的开始时间（00:00:00）
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));

  // 查询当天创建的所有出库单，按entryNo降序排列
  const existingEntries = await wareHouseOntry
    .find({
      createAt: { $gte: startOfDay },
      entryNo: { $regex: `^${baseEntryNo}-\\d+$` },
    })
    .sort({ entryNo: -1 })
    .limit(1);

  let sequenceNo = 1;
  if (existingEntries.length > 0) {
    // 从最后一个单号中提取序号并加1
    const lastEntryNo = existingEntries[0].entryNo;
    const matches = lastEntryNo.match(/-(\d+)$/);
    if (matches && matches[1]) {
      sequenceNo = parseInt(matches[1]) + 1;
    }
  }

  // 序号格式化为3位数字（例如：001, 012, 123）
  const formattedSequenceNo = String(sequenceNo).padStart(4, "0");

  return `${baseEntryNo}-${formattedSequenceNo}`;
}

// 扫码出库（包含自动创建出库单的逻辑）
router.post("/api/v1/warehouse_entry/scan_on", async (req, res) => {
  try {
    const { palletCode, userId, entryInfo, palletFinished = false } = req.body;

    if (!entryInfo.outboundQuantity) {
      return res.status(200).json({
        code: 404,
        message: "请先输入应出库数量",
      });
    }
    // 1. 获取托盘信息
    let pallet = {};
    if (palletCode) {
      pallet = await MaterialPallet.findOne({
        palletCode,
      });
    } else {
      pallet = await MaterialPallet.findOne({
        saleOrderNo: entryInfo.saleOrderNo,
      });
    }

    if (!pallet) {
      return res.status(200).json({
        code: 404,
        message: "托盘单据不存在",
      });
    }

    //特殊逻辑 添可的销售订单必须添加白名单
    let k3_SAL_SaleOrder = await K3SaleOrder.findOne({
      FBillNo: pallet.saleOrderNo,
    });
    if (k3_SAL_SaleOrder && k3_SAL_SaleOrder.FSettleId_FNumber === "CUST0199") {
      if (entryInfo.workOrderWhitelist.length === 0) {
        return res.status(200).json({
          code: 201,
          message: "添可的销售订单必须添加工单白名单",
        });
      }
    }

    //检查白名单
    let checkwhite = false;
    for await (const element of entryInfo.workOrderWhitelist) {
      if (element.workOrderNo === pallet.workOrderNo) {
        checkwhite = true;
        break;
      }
    }

    if (entryInfo.workOrderWhitelist.length === 0) {
      checkwhite = true;
    }

    if (!checkwhite) {
      return res.status(200).json({
        code: 404,
        message: "托盘单据所在工单不在白名单中",
      });
    }

    // 判断托盘单据是否组托完成
    if (pallet.status !== "STACKED") {
      return res.status(200).json({
        code: 404,
        message: "托盘单据未组托完成",
      });
    }

    // 判断托盘是否已经入库 需要!!!
    if (pallet.inWarehouseStatus == "PENDING") {
      return res.status(200).json({
        code: 404,
        message: "此托盘未入库",
      });
    }

    // 判断托盘是否已经入库 需要!!!
    if (pallet.inWarehouseStatus == "OUT_WAREHOUSE") {
      return res.status(200).json({
        code: 404,
        message: "此托盘已出库",
      });
    }

    //判断托盘单据是否处于抽检状态
    if (pallet.inspectionStatus === "INSPECTING") {
      return res.status(200).json({
        code: 404,
        message: "托盘单据处于抽检状态",
      });
    }

    //判断托盘单据里面的条码是否有存在巡检不合格的数据
    const failedBarcodes = pallet.palletBarcodes
      .filter((item) => item.inspectionResult === "FAIL")
      .map((item) => item.barcode);
    if (failedBarcodes.length > 0) {
      return res.status(200).json({
        code: 404,
        message: `托盘单据存在巡检不合格的数据, 不合格条码: ${failedBarcodes.join(
          ", "
        )}`,
      });
    }

    //判断托盘单据里面的条码是否全部完成状态
    let barcodeArray = [];
    pallet.palletBarcodes.forEach((item) => {
      barcodeArray.push(item.barcode);
    });
    const barcodeRecords = await MaterialProcessFlow.find({
      barcode: { $in: barcodeArray },
    })
      .select("barcode status")
      .lean();

    //判断barcodeRecords是否全部完成状态
    const uncompletedBarcodes = barcodeRecords
      .filter((item) => item.status !== "COMPLETED")
      .map((item) => item.barcode);

    if (uncompletedBarcodes.length > 0) {
      return res.status(200).json({
        code: 404,
        message: `托盘单据存在未完成的条码,未完成状态的条码: ${uncompletedBarcodes.join(
          ", "
        )}`,
        uncompletedBarcodes: uncompletedBarcodes,
      });
    }

    //判断托盘单据的销售单号和出库单销售单号是否一致
    if (entryInfo.saleOrderNo && pallet.saleOrderNo !== entryInfo.saleOrderNo) {
      return res.status(200).json({
        code: 404,
        message: "托盘单据销售单号和出库单销售单号不一致",
      });
    }

    // start 根据pallet.saleOrderNo(销售单号)去wareHouseOntry表查询是否有值
    console.log("pallet.saleOrderNo", pallet.saleOrderNo, pallet.saleOrderId);
    //判断当前托盘和

    //先判断是否应出库数量和已出库数量相等;
    //不相等则显示已存在未完成出库单号:xxxxxx
    let entry1 = await wareHouseOntry.findOne({
      saleOrderNo: pallet.saleOrderNo,
      status: { $ne: "COMPLETED" },
    });
    if (entry1 && entry1.entryNo !== entryInfo.entryNo) {
      //判断是新建单据还是继续入库
      return res.status(200).json({
        code: 404,
        message: "已存在未完成出库单号:" + entry1.entryNo,
      });
    }
    if (!entryInfo.entryNo) {
      //无出库单号则表示存在,无需创建初始化
      console.log("pallet", pallet.saleOrderNo);

      let saleOrder = await K3SaleOrder.findOne({
        FBillNo: pallet.saleOrderNo,
      });

      console.log("saleOrder", saleOrder);
      if (!saleOrder) {
        return res.status(200).json({
          code: 404,
          message: "销售订单不存在:" + pallet.saleOrderNo,
        });
      }
      let entryData = await wareHouseOntry.find({
        saleOrderNo: pallet.saleOrderNo,
      });

      // 在创建新出库单之前，先获取生产订单信息
      const order = await K3ProductionOrder.findOne({
        FBillNo: pallet.productionOrderNo,
      });

      console.log("entryData", entryData);
      if (entryData.length > 0) {
        //有值则判断销售数量-已出库数量汇总是否大于应出库数量;
        let sum = entryData.reduce((sum, item) => sum + item.outNumber, 0);
        //汇总已出库数量
        console.log("sum", saleOrder.FQty);
        console.log("sum", sum);
        console.log("entryInfo.outboundQuantity", entryInfo.outboundQuantity);
        if (saleOrder.FQty - sum >= entryInfo.outboundQuantity) {
          // 大于等于应出库数量则显示可以进行初始化新的出库单;
          console.log("可以进行初始化新的出库单");

          console.log("order", order);

          if (!order) {
            return res.status(200).json({
              code: 404,
              message: "生产订单不存在",
            });
          }

          // 使用辅助函数生成单据编号
          const newEntryNo = await generateEntryNoByProductionOrder(
            order.FBillNo
          );

          let entry = await wareHouseOntry.create({
            HuoGuiCode: entryInfo.HuoGuiCode, // 货柜号
            FaQIaoNo: entryInfo.FaQIaoNo, // 发票号
            outboundQuantity: entryInfo.outboundQuantity, //应出库数量
            outNumber: sum, //已出库数量
            actualQuantity: sum, //实际出库数量
            saleNumber: saleOrder.FQty, //销售数量
            entryNo: newEntryNo,
            productionOrderNo: order.FBillNo,
            saleOrderId: saleOrder._id,
            saleOrderNo: order.FSaleOrderNo,
            saleOrderEntryId: order.FSaleOrderEntryId,
            materialId: pallet.materialId,
            materialCode: pallet.materialCode,
            materialName: pallet.materialName,
            materialSpec: pallet.materialSpec,
            unit: order.FUnitId,
            workShop: order.FWorkShopID_FName,
            productType: order.FProductType,
            correspondOrgId: order.FCorrespondOrgId,
            status: "IN_PROGRESS",
            progress: 0,
            startTime: new Date(),
            createBy: userId,
            createAt: new Date(),
            updateAt: new Date(),
            workOrderWhitelist: entryInfo.workOrderWhitelist || [], // 添加工单白名单
            outboundMode: entryInfo.outboundMode, // 添加出库模式
          });
        } else {
          //小于应出库数量则返回,该销售单号销售数量为x,已完成出库数量为x,剩余出库数量为x;  saleOrder.FQty - sum = 剩余出库数量
          console.log("小于应出库数量");
          // 使用辅助函数生成单据编号
          const newEntryNo = await generateEntryNoByProductionOrder(
            order.FBillNo
          );

          let entry = await wareHouseOntry.create({
            HuoGuiCode: entryInfo.HuoGuiCode, // 货柜号
            FaQIaoNo: entryInfo.FaQIaoNo, // 发票号
            outboundQuantity: saleOrder.FQty - sum, //应出库数量
            outNumber: sum, //已出库数量
            actualQuantity: sum, //实际出库数量
            saleNumber: saleOrder.FQty, //销售数量
            entryNo: newEntryNo,
            productionOrderNo: order.FBillNo,
            saleOrderId: saleOrder._id,
            saleOrderNo: order.FSaleOrderNo,
            saleOrderEntryId: order.FSaleOrderEntryId,
            materialId: pallet.materialId,
            materialCode: pallet.materialCode,
            materialName: pallet.materialName,
            materialSpec: pallet.materialSpec,
            unit: order.FUnitId,
            workShop: order.FWorkShopID_FName,
            productType: order.FProductType,
            correspondOrgId: order.FCorrespondOrgId,
            outboundMode: entryInfo.outboundMode,
            status: "IN_PROGRESS",
            progress: 0,
            startTime: new Date(),
            createBy: userId,
            createAt: new Date(),
            updateAt: new Date(),
            workOrderWhitelist: entryInfo.workOrderWhitelist || [], // 添加工单白名单
          });
        }
      } else {
        //无值则判断销售数量-应出库数量是否大于0;
        if (saleOrder.FQty - entryInfo.outboundQuantity >= 0) {
          // 大于0;则显示可以进行初始化新的出库单;
          console.log("大于0;则显示可以进行初始化新的出库单");
          // 获取生产订单信息
          const order = await K3ProductionOrder.findOne({
            FBillNo: pallet.productionOrderNo,
          });
          console.log(order, "order");
          if (!order) {
            return res.status(200).json({
              code: 404,
              message: "生产订单不存在",
            });
          }
          // 使用辅助函数生成单据编号
          const newEntryNo = await generateEntryNoByProductionOrder(
            order.FBillNo
          );

          let entry = await wareHouseOntry.create({
            HuoGuiCode: entryInfo.HuoGuiCode, // 货柜号
            FaQIaoNo: entryInfo.FaQIaoNo, // 发票号
            outboundQuantity: entryInfo.outboundQuantity, //应出库数量
            outNumber: 0, //已出库数量
            actualQuantity: 0, //实际出库数量
            saleNumber: saleOrder.FQty, //销售数量
            entryNo: newEntryNo,
            productionOrderNo: order.FBillNo,
            saleOrderId: saleOrder._id,
            saleOrderNo: order.FSaleOrderNo,
            saleOrderEntryId: order.FSaleOrderEntryId,
            materialId: pallet.materialId,
            materialCode: pallet.materialCode,
            materialName: pallet.materialName,
            materialSpec: pallet.materialSpec,
            // plannedQuantity: order.FQty,
            unit: order.FUnitId,
            workShop: order.FWorkShopID_FName,
            productType: order.FProductType,
            correspondOrgId: order.FCorrespondOrgId,
            outboundMode: entryInfo.outboundMode,
            status: "IN_PROGRESS",
            progress: 0,
            startTime: new Date(),
            createBy: userId,
            createAt: new Date(),
            updateAt: new Date(),
            workOrderWhitelist: entryInfo.workOrderWhitelist || [], // 添加工单白名单
          });
        } else {
          //等于0则返回,该销售单号销售数量为x,剩余出库数量为x;
          console.log("等于0则返回,该销售单号销售数量为x,剩余出库数量为x");
          // 使用辅助函数生成单据编号
          const newEntryNo = await generateEntryNoByProductionOrder(
            order.FBillNo
          );

          let entry = await wareHouseOntry.create({
            HuoGuiCode: entryInfo.HuoGuiCode, // 货柜号
            FaQIaoNo: entryInfo.FaQIaoNo, // 发票号
            outboundQuantity: saleOrder.FQty, //应出库数量 == 销售数量
            outNumber: 0, //已出库数量
            actualQuantity: 0, //实际出库数量
            saleNumber: saleOrder.FQty, //销售数量
            entryNo: newEntryNo,
            productionOrderNo: order.FBillNo,
            saleOrderId: saleOrder._id,
            saleOrderNo: order.FSaleOrderNo,
            saleOrderEntryId: order.FSaleOrderEntryId,
            materialId: pallet.materialId,
            materialCode: pallet.materialCode,
            materialName: pallet.materialName,
            materialSpec: pallet.materialSpec,
            unit: order.FUnitId,
            workShop: order.FWorkShopID_FName,
            productType: order.FProductType,
            correspondOrgId: order.FCorrespondOrgId,
            outboundMode: entryInfo.outboundMode,
            status: "IN_PROGRESS",
            progress: 0,
            startTime: new Date(),
            createBy: userId,
            createAt: new Date(),
            updateAt: new Date(),
            workOrderWhitelist: entryInfo.workOrderWhitelist || [], // 添加工单白名单
          });
        }
      }
    }

    // 2. 获取或创建出库单
    let entry = await wareHouseOntry.findOne({
      productionOrderNo: pallet.productionOrderNo,
      status: { $ne: "COMPLETED" },
    });
    console.log(entry, "entry");
    console.log("entry.materialId");

    if (!entry) {
      return res.status(200).json({
        code: 404,
        message:
          "未找到有效的出库单，请确认：1. 出库单号是否正确 2. 该出库单是否已完成出库 3. 该出库单是否已被删除",
      });
    }
    // 3. 校验物料信息是否一致
    if (pallet.materialId.toString() !== entry.materialId.toString()) {
      return res.status(200).json({
        code: 404,
        message: "托盘物料与出库单物料不一致",
      });
    }
    // 检查托盘的销售订单与出库单的销售订单是否一致
    if (pallet.saleOrderNo !== entry.saleOrderNo) {
      return res.status(200).json({
        code: 404,
        message: "托盘单据销售单号和出库单销售单号不一致",
      });
    }
    if (entryInfo.FaQIaoNo) {
      entry.FaQIaoNo = entryInfo.FaQIaoNo;
    }
    if (entryInfo.HuoGuiCode) {
      entry.HuoGuiCode = entryInfo.HuoGuiCode;
    }

    // 4. 检查托盘是否已经出库
    const existingPallet = entry.entryItems.find(
      (item) => item.palletCode === palletCode
    );

    // 处理部分出库的情况
    if (
      existingPallet &&
      pallet.inWarehouseStatus === "PART_OUT_WAREHOUSE" &&
      palletFinished
    ) {
      // 如果托盘已经部分出库，且用户选择了整托出库，则更新现有记录，增加剩余的产品
      // 获取托盘中所有未出库的条码
      const remainingBarcodes = pallet.palletBarcodes.filter(
        (item) => item.outWarehouseStatus !== "COMPLETED"
      );

      // 如果没有剩余未出库的条码，直接返回已出库信息
      if (remainingBarcodes.length === 0) {
        return res.status(200).json({
          code: 200,
          message: "该托盘所有产品已出库",
          data: entry,
        });
      }

      // 将这些条码添加到出库单中
      for (const barcode of remainingBarcodes) {
        if (!existingPallet.palletBarcodes) {
          existingPallet.palletBarcodes = [];
        }

        existingPallet.palletBarcodes.push({
          barcode: barcode.barcode,
          barcodeType: barcode.barcodeType,
          materialProcessFlowId: barcode.materialProcessFlowId,
          productionPlanWorkOrderId: barcode.productionPlanWorkOrderId,
          scanTime: new Date(),
          scanBy: userId,
        });

        // 更新托盘中条码的出库状态
        barcode.outWarehouseStatus = "COMPLETED";
        barcode.outWarehouseTime = new Date();
        barcode.outWarehouseBy = userId;
      }

      // 更新托盘条目的数量
      existingPallet.quantity = pallet.totalQuantity;

      // 更新出库单数量和进度
      entry.outNumber = entry.entryItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      entry.actualQuantity = entry.outNumber;
      entry.palletCount = entry.entryItems.length;
      entry.progress = Math.round(
        (entry.outNumber / entry.outboundQuantity) * 100
      );

      // 更新出库单状态
      if (entry.outNumber >= entry.outboundQuantity) {
        entry.status = "COMPLETED";
        entry.completedTime = new Date();
      }

      // 更新托盘状态为完全出库
      pallet.inWarehouseStatus = "OUT_WAREHOUSE";
      pallet.outWarehouseTime = new Date();
      pallet.outWarehouseBy = userId;

      // 保存更新
      await MaterialPallet.findByIdAndUpdate(pallet._id, {
        inWarehouseStatus: pallet.inWarehouseStatus,
        outWarehouseTime: new Date(),
        updateAt: new Date(),
        palletBarcodes: pallet.palletBarcodes,
      });

      await entry.save();

      return res.status(200).json({
        code: 200,
        message: "托盘剩余产品成功出库",
        data: entry,
      });
    } else if (existingPallet) {
      // 对于已经在出库单中的托盘，需要判断其出入库状态
      if (pallet.inWarehouseStatus === "OUT_WAREHOUSE") {
        // 如果托盘状态为"已出库"，才提示不能出库
        return res.status(200).json({
          code: 404,
          message: "该托盘已出库",
        });
      } else if (
        pallet.inWarehouseStatus === "PART_OUT_WAREHOUSE" &&
        !palletFinished
      ) {
        // 如果托盘状态为"部分出库"且不是整托出库模式，提示用户可以使用整托出库功能
        return res.status(200).json({
          code: 404,
          message: "该托盘已部分出库，请使用整托出库功能完成剩余产品出库",
        });
      }
    }

    //判断是托盘出库还是单一产品出库
    if (entryInfo.outboundMode === "SINGLE") {
      if (!palletFinished) {
        await entry.save();
        // 重新查询以获取最新数据
        // const latestEntry = await wareHouseOntry.findById(entry._id);
        return res.status(200).json({
          code: 200,
          message: "出库单初始化成功",
          mode: "init",
          data: entry,
        });
      }
    }
    //托盘出库

    // 5. 添加托盘到出库单
    entry.entryItems.push({
      palletId: pallet._id,
      palletCode: pallet.palletCode,
      quantity: pallet.totalQuantity,
      scanTime: new Date(),
      scanBy: userId,
      saleOrderNo: pallet.saleOrderNo, // 新增：销售订单
      materialCode: pallet.materialCode, //新增： 物料编码
      lineCode: pallet.productLineName, // 新增：产线
      palletType: pallet.palletType, // 新增：托盘类型
      palletBarcodes: pallet.palletBarcodes.map((item) => ({
        barcode: item.barcode,
        barcodeType: item.barcodeType,
        materialProcessFlowId: item.materialProcessFlowId,
        productionPlanWorkOrderId: item.productionPlanWorkOrderId,
        scanTime: new Date(),
        scanBy: userId,
      })),
    });

    // 6. 更新出库单数量信息和完成进度
    entry.outNumber = entry.entryItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    entry.actualQuantity = entry.outNumber;
    entry.palletCount = entry.entryItems.length;
    entry.progress = Math.round(
      (entry.outNumber / entry.outboundQuantity) * 100
    );

    //计算已出库数量是否超过应出库数量
    if (entry.outNumber > entryInfo.outboundQuantity) {
      return res.status(200).json({
        message: "该托盘数量已经超过应出库数量,无法进行出库,需修改应出库数量",
      });
    }

    // 7. 更新出库单状态
    if (entry.outNumber >= entry.outboundQuantity) {
      entry.status = "COMPLETED";
      entry.completedTime = new Date();
    } else {
      entry.status = "IN_PROGRESS";
    }

    // 8. 更新托盘中所有条码的出库状态
    pallet.palletBarcodes.forEach((barcode) => {
      barcode.outWarehouseStatus = "COMPLETED";
      barcode.outWarehouseTime = new Date();
      barcode.outWarehouseBy = userId;
    });

    // 9. 更新托盘的出库状态
    const materialPalletizingService = require("../services/materialPalletizing");
    materialPalletizingService.updatePalletOutWarehouseStatus(pallet);

    // 更新托盘信息
    await MaterialPallet.findByIdAndUpdate(pallet._id, {
      inWarehouseStatus: pallet.inWarehouseStatus,
      outWarehouseTime: new Date(),
      updateAt: new Date(),
      palletBarcodes: pallet.palletBarcodes,
    });

    await entry.save();

    // 重新查询以获取最新数据
    // const latestEntry = await wareHouseOntry.findById(entry._id);

    return res.status(200).json({
      code: 200,
      message: "扫码出库成功",
      data: entry,
    });
  } catch (error) {
    return res.status(200).json({
      code: 500,
      message: error.message,
    });
  }
});

// MES出库单同步至金蝶云
router.post("/api/v1/k3/sync_warehouse_ontry", async (req, res) => {
  try {
    const { entryId } = req.body;

    // 1. 获取出库单信息和生产订单信息
    const entry = await wareHouseOntry.findById(entryId);
    if (!entry) {
      return res.status(200).json({
        code: 404,
        message: "出库单不存在",
      });
    }

    // 获取出库单相关的生产订单
    const productionOrder = await K3ProductionOrder.findOne({
      FBillNo: entry.productionOrderNo,
    });

    console.log(productionOrder, "productionOrder");

    if (!productionOrder) {
      return res.status(200).json({
        code: 404,
        message: "生产订单不存在",
      });
    }

    //查询金蝶云是否已经拥有订单
    let k3Stock = await k3cMethod("BillQuery", "SAL_OUTSTOCK", {
      FormId: "SAL_OUTSTOCK",
      FieldKeys: "FID",
      FilterString: [
        {
          FieldName: "FBillNo",
          Compare: "=",
          Value: entry.entryNo,
          Left: "",
          Right: "",
          Logic: 0,
        },
      ],
      OrderString: "",
      TopRowCount: 0,
      StartRow: 0,
      Limit: 2000,
      SubSystemId: "",
    });

    // 2. 转换为金蝶云格式
    const k3Data = {
      FID: k3Stock.length > 0 ? k3Stock[0][0] : 0,
      FDate: new Date().toISOString().split("T")[0],
      FPrdOrgId: {
        FNumber: productionOrder.FPrdOrgId_FNumber,
      },
      FBillType: {
        FNUMBER: "XSCKD01_SYS",
      },
      FBillNo: entry.entryNo,
      FStockOrgId: {
        FNumber: productionOrder.FPrdOrgId_FNumber,
      },
      // FOwnerTypeID: productionOrder.FOwnerTypeId || "BD_OwnerOrg",
      // FOwnerID: {
      //   FNumber: productionOrder.FOwnerId_FNumber,
      // },
      FWorkShopId: {
        FNumber: productionOrder.FWorkShopID_FNumber,
      },
      FDescription: entry.remark || "",
      FEntity: [
        {
          FOutStockType: "1",
          FIsNew: false,
          FProductType: entry.productType,
          FMoId: productionOrder.FID,
          FMoEntryId: productionOrder.FID,
          FMOMAINENTRYID: productionOrder.FID,
          FMoEntrySeq: "1",
          FSrcEntryId: productionOrder.FID,
          FSrcBillType: "PRD_MO",
          FSrcInterId: productionOrder.FID,
          FSrcBillNo: productionOrder.FBillNo,
          FSrcEntrySeq: "1",
          FMaterialId: {
            FNumber: entry.materialCode,
          },
          FUnitID: {
            FNumber: productionOrder.FUnitId_FName,
          },
          FBaseUnitId: {
            FNumber: productionOrder.FUnitId_FName,
          },
          FMustQty: entry.actualQuantity,
          FRealQty: entry.actualQuantity,
          FCostRate: entry.actualQuantity,
          FOwnerID: {
            FNumber: productionOrder.FOwnerId_FNumber,
          },
          FOwnerTypeID: productionOrder.FOwnerTypeId || "BD_OwnerOrg",
          OwnerTypeIdHead: productionOrder.FOwnerId_FNumber,
          OwnerIdHead_Id: productionOrder.FPrdOrgId_FNumber,
          FMoBillNo: productionOrder.FBillNo,
          FStockStatusId: {
            FNumber: "KCZT01_SYS",
          },
          FKeeperTypeId: "BD_KeeperOrg",
          FKeeperId: {
            FNumber: productionOrder.FPrdOrgId_FNumber,
          },
          FOwnerTypeId: productionOrder.FOwnerTypeId,
          FStockUnitId: {
            FNumber: productionOrder.FUnitId_FName,
          },
          FStockRealQty: entry.actualQuantity,
          FBasePrdRealQty: entry.actualQuantity,
          FBaseMustQty: entry.actualQuantity,
          FBaseRealQty: entry.actualQuantity,

          // 需求来源
          FReqSrc: "1",
          FReqBillNo: productionOrder.FSaleOrderNo,
          FReqBillId: productionOrder.FSaleOrderEntryId,
          FReqEntrySeq: "1",
          FReqEntryId: productionOrder.FSaleOrderEntryId,

          // FEntity_Link: [
          //   {
          //     FEntity_Link_FRuleId: "DeliveryNotice-OutStock",
          //     FEntity_Link_FSTableName: "T_SAL_DELIVERYNOTICEENTRY",
          //     FEntity_Link_FSBillId: productionOrder.FID,
          //     FEntity_Link_FSId: productionOrder.FID,
          //     FEntity_Link_FFlowId: "f11b462a-8733-40bd-8f29-0906afc6a201",
          //     FEntity_Link_FFlowLineId: "5",
          //     FEntity_Link_FBasePrdRealQtyOld: productionOrder.FBaseRealQty,
          //     FEntity_Link_FBasePrdRealQty: entry.actualQuantity,
          //   },
          // ],
        },
      ],
    };

    console.log(k3Data, "k3Data");

    // 3. 调用金蝶云API
    let k3Response = await k3cMethod("Save", "SAL_OUTSTOCK", {
      NeedUpDateFields: [],
      NeedReturnFields: [],
      IsDeleteEntry: "true",
      SubSystemId: "",
      IsVerifyBaseDataField: "false",
      IsEntryBatchFill: "true",
      ValidateFlag: "false",
      NumberSearch: "true",
      IsAutoAdjustField: "false",
      InterationFlags: "",
      IgnoreInterationFlag: "",
      IsControlPrecision: "false",
      Model: k3Data,
    });

    // 4. 处理响应
    if (k3Response.Result.ResponseStatus.IsSuccess === true) {
      return res.status(200).json({
        code: 200,
        message: "同步成功",
        data: k3Response.data,
      });
    } else {
      throw new Error(
        k3Response.Result.ResponseStatus.Errors[0].Message || "同步失败"
      );
    }
  } catch (error) {
    return res.status(200).json({
      code: 500,
      message: error.message,
    });
  }
});

// 单一产品出库时的产品条码提交
router.post("/api/v1/warehouse_entry/submit_product", async (req, res) => {
  try {
    const { entryId, productBarcode, userId, entryInfo } = req.body;

    // 1. 根据产品条码查询工艺流程
    const processFlow = await MaterialProcessFlow.findOne({
      barcode: productBarcode,
    });
    if (!processFlow) {
      return res.status(200).json({
        code: 404,
        message: "未找到产品条码对应的工艺流程",
      });
    }

    if (processFlow.status !== "COMPLETED") {
      return res.status(200).json({
        code: 404,
        message: "产品必须是完成状态",
      });
    }

    // 2. 根据工艺流程ID查询托盘信息
    const pallet = await MaterialPallet.findOne({
      "palletBarcodes.materialProcessFlowId": processFlow._id,
    });
    if (!pallet) {
      return res.status(200).json({
        code: 404,
        message: "未找到产品条码对应的托盘",
      });
    }

    // 3. 验证托盘状态
    if (pallet.status !== "STACKED") {
      return res.status(200).json({
        code: 404,
        message: "托盘未组托完成",
      });
    }

    if (pallet.inWarehouseStatus === "PENDING") {
      return res.status(200).json({
        code: 404,
        message: "托盘未入库",
      });
    }

    if (pallet.inWarehouseStatus === "OUT_WAREHOUSE") {
      return res.status(200).json({
        code: 404,
        message: "托盘已出库",
      });
    }

    // 检查同一销售订单下是否存在未完成的出库单
    if (!entryId) {
      const existingEntry = await wareHouseOntry.findOne({
        saleOrderNo: pallet.saleOrderNo,
        status: { $ne: "COMPLETED" },
      });
      
      if (existingEntry && (entryInfo ? existingEntry.entryNo !== entryInfo.entryNo : true)) {
        return res.status(200).json({
          code: 404,
          message: "已存在未完成出库单号:" + existingEntry.entryNo,
        });
      }
    }

    // 4. 获取或创建出库单
    let entry;
    if (entryId) {
      // 如果提供了出库单ID，直接查询
      entry = await wareHouseOntry.findById(entryId);
    } else {
      // 如果没有提供出库单ID，先查找销售订单对应的未完成出库单
      entry = await wareHouseOntry.findOne({
        saleOrderNo: pallet.saleOrderNo,
        status: { $ne: "COMPLETED" },
      });

      // 如果没有找到未完成的出库单，且提供了entryInfo，则创建新的出库单
      if (!entry && entryInfo) {
        if (!entryInfo.outboundQuantity) {
          return res.status(200).json({
            code: 404,
            message: "请先输入应出库数量",
          });
        }

        //特殊逻辑 添可的销售订单必须添加白名单
        let k3_SAL_SaleOrder = await K3SaleOrder.findOne({
          FBillNo: pallet.saleOrderNo,
        });
        if (
          k3_SAL_SaleOrder &&
          k3_SAL_SaleOrder.FSettleId_FNumber === "CUST0199"
        ) {
          if (
            !entryInfo.workOrderWhitelist ||
            entryInfo.workOrderWhitelist.length === 0
          ) {
            return res.status(200).json({
              code: 201,
              message: "添可的销售订单必须添加工单白名单",
            });
          }
        }

        //检查白名单
        let checkwhite = false;
        if (
          entryInfo.workOrderWhitelist &&
          entryInfo.workOrderWhitelist.length > 0
        ) {
          for (const element of entryInfo.workOrderWhitelist) {
            if (element.workOrderNo === pallet.workOrderNo) {
              checkwhite = true;
              break;
            }
          }
        } else {
          checkwhite = true;
        }

        if (!checkwhite) {
          return res.status(200).json({
            code: 404,
            message: "托盘单据所在工单不在白名单中",
          });
        }

        // 获取销售订单信息
        let saleOrder = await K3SaleOrder.findOne({
          FBillNo: pallet.saleOrderNo,
        });

        if (!saleOrder) {
          return res.status(200).json({
            code: 404,
            message: "销售订单不存在:" + pallet.saleOrderNo,
          });
        }

        // 获取已有的出库单数据
        let entryData = await wareHouseOntry.find({
          saleOrderNo: pallet.saleOrderNo,
        });

        // 获取生产订单信息
        const order = await K3ProductionOrder.findOne({
          FBillNo: pallet.productionOrderNo,
        });

        if (!order) {
          return res.status(200).json({
            code: 404,
            message: "生产订单不存在",
          });
        }

        // 生成新的出库单号
        const newEntryNo = await generateEntryNoByProductionOrder(
          order.FBillNo
        );

        // 计算已出库数量
        let existingOutNumber = 0;
        if (entryData.length > 0) {
          existingOutNumber = entryData.reduce(
            (sum, item) => sum + item.outNumber,
            0
          );
        }

        // 判断应出库数量和销售数量的关系
        let outboundQuantity = entryInfo.outboundQuantity;
        if (saleOrder.FQty - existingOutNumber < entryInfo.outboundQuantity) {
          outboundQuantity = saleOrder.FQty - existingOutNumber;
          if (outboundQuantity <= 0) {
            return res.status(200).json({
              code: 404,
              message: `该销售单号销售数量为${saleOrder.FQty}，已完成出库数量为${existingOutNumber}，无剩余出库数量`,
            });
          }
        }

        // 如果是第一次提交产品条码，需要创建托盘条目并添加条码
        let currentPalletItem = {
          palletId: pallet._id,
          palletCode: pallet.palletCode,
          saleOrderNo: pallet.saleOrderNo,
          materialCode: pallet.materialCode,
          lineCode: pallet.productLineName,
          palletType: pallet.palletType,
          quantity: 1, // 设置初始数量为1
          scanTime: new Date(),
          scanBy: userId,
          palletBarcodes: [],
        };

        // 获取产品条码在托盘中的信息
        const productBarcodeInfo = pallet.palletBarcodes.find(
          (item) => item.barcode === productBarcode
        );
        if (productBarcodeInfo) {
          currentPalletItem.palletBarcodes.push({
            barcode: productBarcode,
            barcodeType: productBarcodeInfo.barcodeType,
            materialProcessFlowId: productBarcodeInfo.materialProcessFlowId,
            productionPlanWorkOrderId:
              productBarcodeInfo.productionPlanWorkOrderId,
            scanTime: new Date(),
            scanBy: userId,
          });
        }

        // 创建新的出库单
        entry = await wareHouseOntry.create({
          HuoGuiCode: entryInfo.HuoGuiCode, // 货柜号
          FaQIaoNo: entryInfo.FaQIaoNo, // 发票号
          outboundQuantity: outboundQuantity, //应出库数量
          outNumber: 1, //已出库数量，初始为1
          actualQuantity: 1, //实际出库数量，初始为1
          saleNumber: saleOrder.FQty, //销售数量
          entryNo: newEntryNo,
          productionOrderNo: order.FBillNo,
          saleOrderId: saleOrder._id,
          saleOrderNo: order.FSaleOrderNo,
          saleOrderEntryId: order.FSaleOrderEntryId,
          materialId: pallet.materialId,
          materialCode: pallet.materialCode,
          materialName: pallet.materialName,
          materialSpec: pallet.materialSpec,
          unit: order.FUnitId,
          workShop: order.FWorkShopID_FName,
          productType: order.FProductType,
          correspondOrgId: order.FCorrespondOrgId,
          outboundMode: entryInfo.outboundMode || "SINGLE", // 默认单一产品出库
          status: "IN_PROGRESS",
          progress: Math.round((1 / outboundQuantity) * 100), // 计算初始进度
          startTime: new Date(),
          createBy: userId,
          createAt: new Date(),
          updateAt: new Date(),
          workOrderWhitelist: entryInfo.workOrderWhitelist || [], // 添加工单白名单
          entryItems: [currentPalletItem], // 直接添加托盘条目到出库单
        });

        // 更新托盘中条码的出入库状态
        const barcodeIndex = pallet.palletBarcodes.findIndex(
          (item) => item.barcode === productBarcode
        );
        if (barcodeIndex !== -1) {
          pallet.palletBarcodes[barcodeIndex].outWarehouseStatus = "COMPLETED";
          pallet.palletBarcodes[barcodeIndex].outWarehouseTime = new Date();
          pallet.palletBarcodes[barcodeIndex].outWarehouseBy = userId;
        }

        // 检查托盘是否所有条码都已出库
        const allBarcodesOut = pallet.palletBarcodes.every(
          (item) => item.outWarehouseStatus === "COMPLETED"
        );

        // 检查是否有条码已出库
        const someBarcodesOut = pallet.palletBarcodes.some(
          (item) => item.outWarehouseStatus === "COMPLETED"
        );

        if (allBarcodesOut) {
          pallet.inWarehouseStatus = "OUT_WAREHOUSE";
          pallet.outWarehouseTime = new Date();
          pallet.outWarehouseBy = userId;
        } else if (someBarcodesOut) {
          // 部分条码出库时更新托盘状态为部分出库
          pallet.inWarehouseStatus = "PART_OUT_WAREHOUSE";
          pallet.outWarehouseTime = new Date();
          pallet.outWarehouseBy = userId;
        }

        // 检查是否完成出库
        if (entry.outNumber >= entry.outboundQuantity) {
          entry.status = "COMPLETED";
          entry.endTime = new Date();
        }

        // 保存更新
        await pallet.save();

        return res.status(200).json({
          code: 200,
          message: "产品条码提交成功",
          data: {
            entry,
            pallet,
          },
        });
      }
    }

    if (!entry) {
      return res.status(200).json({
        code: 404,
        message:
          "未找到有效的出库单，请确认：1. 出库单ID是否正确 2. 该出库单是否已完成出库 3. 该出库单是否已被删除",
      });
    }

    // 5. 校验物料信息是否一致
    if (pallet.materialId.toString() !== entry.materialId.toString()) {
      return res.status(200).json({
        code: 404,
        message: "托盘物料与出库单物料不一致",
      });
    }

    // 检查托盘的销售订单与出库单的销售订单是否一致
    if (pallet.saleOrderNo !== entry.saleOrderNo) {
      return res.status(200).json({
        code: 404,
        message: "托盘单据销售单号和出库单销售单号不一致",
      });
    }

    // 6. 检查托盘是否已经在当前出库单中
    let currentPalletItem = entry.entryItems.find(
      (item) =>
        item.palletId && item.palletId.toString() === pallet._id.toString()
    );

    if (!currentPalletItem) {
      // 如果托盘不在当前出库单中，创建新的托盘条目
      currentPalletItem = {
        palletId: pallet._id,
        palletCode: pallet.palletCode,
        saleOrderNo: pallet.saleOrderNo,
        materialCode: pallet.materialCode,
        lineCode: pallet.productLineName,
        palletType: pallet.palletType,
        quantity: 1, // 设置初始数量为1
        scanTime: new Date(),
        scanBy: userId,
        palletBarcodes: [],
      };

      // 获取产品条码在托盘中的信息
      const productBarcodeInfo = pallet.palletBarcodes.find(
        (item) => item.barcode === productBarcode
      );
      if (productBarcodeInfo) {
        currentPalletItem.palletBarcodes.push({
          barcode: productBarcode,
          barcodeType: productBarcodeInfo.barcodeType,
          materialProcessFlowId: productBarcodeInfo.materialProcessFlowId,
          productionPlanWorkOrderId:
            productBarcodeInfo.productionPlanWorkOrderId,
          scanTime: new Date(),
          scanBy: userId,
        });
      }

      entry.entryItems.push(currentPalletItem);
    } else {
      // 7. 检查产品条码是否已经提交过
      const existingBarcode = currentPalletItem.palletBarcodes.find(
        (item) => item.barcode === productBarcode
      );
      if (existingBarcode) {
        return res.status(200).json({
          code: 404,
          message: "该产品条码已提交",
        });
      }

      // 获取产品条码在托盘中的信息
      const productBarcodeInfo = pallet.palletBarcodes.find(
        (item) => item.barcode === productBarcode
      );
      if (productBarcodeInfo) {
        currentPalletItem.palletBarcodes.push({
          barcode: productBarcode,
          barcodeType: productBarcodeInfo.barcodeType,
          materialProcessFlowId: productBarcodeInfo.materialProcessFlowId,
          productionPlanWorkOrderId:
            productBarcodeInfo.productionPlanWorkOrderId,
          scanTime: new Date(),
          scanBy: userId,
        });
      }
    }

    // 更新托盘中条码的出入库状态
    const barcodeIndex = pallet.palletBarcodes.findIndex(
      (item) => item.barcode === productBarcode
    );
    if (barcodeIndex !== -1) {
      pallet.palletBarcodes[barcodeIndex].outWarehouseStatus = "COMPLETED";
      pallet.palletBarcodes[barcodeIndex].outWarehouseTime = new Date();
      pallet.palletBarcodes[barcodeIndex].outWarehouseBy = userId;
    }

    // 更新出库数量
    currentPalletItem.quantity = currentPalletItem.palletBarcodes.length;
    entry.outNumber = entry.entryItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    entry.actualQuantity = entry.outNumber;

    // 更新出库进度
    entry.progress = Math.round(
      (entry.outNumber / entry.outboundQuantity) * 100
    );

    // 检查是否完成出库
    if (entry.outNumber >= entry.outboundQuantity) {
      entry.status = "COMPLETED";
      entry.endTime = new Date();
    }

    // 调用服务方法更新托盘出入库状态
    const materialPalletizingService = require("../services/materialPalletizing");
    materialPalletizingService.updatePalletOutWarehouseStatus(pallet);

    // 记录出库时间和操作人
    pallet.outWarehouseTime = new Date();
    pallet.outWarehouseBy = userId;

    // 保存更新
    await Promise.all([entry.save(), pallet.save()]);

    return res.status(200).json({
      code: 200,
      message: "产品条码提交成功",
      data: {
        entry,
        pallet,
      },
    });
  } catch (error) {
    return res.status(200).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;
