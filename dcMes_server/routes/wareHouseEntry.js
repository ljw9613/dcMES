const express = require("express");
const router = express.Router();
const WarehouseEntry = require("../model/warehouse/warehouseEntry");
const K3ProductionOrder = require("../model/k3/k3_PRD_MO");
const MaterialPallet = require("../model/project/materialPalletizing");
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const { k3cMethod } = require("./k3cMethod");
const K3Stock = require("../model/k3/k3_BD_STOCK");
// 扫码入库（包含自动创建入库单的逻辑）
router.post("/api/v1/warehouse_entry/scan", async (req, res) => {
  try {
    const { palletCode, userId, stockId } = req.body;

    // 1. 获取托盘信息
    const pallet = await MaterialPallet.findOne({ palletCode });
    if (!pallet) {
      return res.status(200).json({
        code: 404,
        message: "托盘单据不存在",
      });
    }

    // 判断托盘单据是否组托完成
    if (pallet.status !== "STACKED") {
      return res.status(200).json({
        code: 404,
        message: "托盘单据未组托完成",
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
    const inspectionResult = pallet.palletBarcodes.some(
      (item) => item.inspectionResult === "FAIL"
    );
    if (inspectionResult) {
      return res.status(200).json({
        code: 404,
        message: "托盘单据存在巡检不合格的数据",
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
    const isAllCompleted = barcodeRecords.every(
      (item) => item.status === "COMPLETED"
    );
    if (!isAllCompleted) {
      return res.status(200).json({
        code: 404,
        message: "托盘单据存在未完成状态的条码",
      });
    }

    // 2. 获取或创建入库单
    let entry = await WarehouseEntry.findOne({
      productionOrderNo: pallet.productionOrderNo,
      status: { $ne: "COMPLETED" },
    });

    // 如果入库单不存在，则创建新的入库单
    if (!entry) {
      const order = await K3ProductionOrder.findOne({
        FBillNo: pallet.productionOrderNo,
      });

      if (!order) {
        return res.status(200).json({
          code: 404,
          message: "生产订单不存在",
        });
      }

      const stock = await K3Stock.findOne({ FStockId: stockId });
      console.log(stock, "仓库");
      if (!stock) {
        return res.status(200).json({
          code: 404,
          message: "仓库不存在",
        });
      }

      entry = await WarehouseEntry.create({
        entryNo: "SCRK-" + order.FBillNo,
        productionOrderNo: order.FBillNo,
        saleOrderId: order.FSaleOrderId,
        saleOrderNo: order.FSaleOrderNo,
        saleOrderEntryId: order.FSaleOrderEntryId,
        stockId: stock._id,
        FStockId: stock.FStockId,
        stockCode: stock.FNumber,
        stockName: stock.FName,
        materialId: pallet.materialId,
        materialCode: pallet.materialCode,
        materialName: pallet.materialName,
        materialSpec: pallet.materialSpec,
        plannedQuantity: order.FQty ? order.FQty : 0,
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
      });
    }

    // 3. 校验物料信息是否一致
    if (pallet.materialId.toString() !== entry.materialId.toString()) {
      return res.status(200).json({
        message: "托盘物料与入库单物料不一致",
      });
    }

    // 4. 检查托盘是否已经入库
    const existingPallet = entry.entryItems.find(
      (item) => item.palletCode === palletCode
    );
    if (existingPallet) {
      return res.status(200).json({
        message: "该托盘已入库",
      });
    }

    // 5. 添加托盘到入库单
    entry.entryItems.push({
      palletId: pallet._id,
      palletCode: pallet.palletCode,
      quantity: pallet.totalQuantity,
      scanTime: new Date(),
      scanBy: userId,
    });

    // 6. 更新入库单数量信息和完成进度
    entry.actualQuantity = entry.entryItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    entry.palletCount = entry.entryItems.length;
    entry.progress = Math.round(
      (entry.actualQuantity / entry.plannedQuantity) * 100
    );

    // 7. 更新入库单状态
    if (entry.actualQuantity >= entry.plannedQuantity) {
      entry.status = "COMPLETED";
      entry.completedTime = new Date();
    } else {
      entry.status = "IN_PROGRESS";
    }

    // 8. 更新托盘的入库状态
    await MaterialPallet.findByIdAndUpdate(pallet._id, {
      inWarehouseStatus: "IN_WAREHOUSE",
      inWarehouseTime: new Date(),
      updateAt: new Date(),
    });

    await entry.save();

    // 重新查询以获取最新数据
    // const latestEntry = await WarehouseEntry.findById(entry._id);

    res.json({
      code: 200,
      message: "扫码入库成功",
      data: entry,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// MES入库单同步至金蝶云
router.post("/api/v1/k3/sync_warehouse_entry", async (req, res) => {
  try {
    const { entryId } = req.body;

    // 1. 获取入库单信息和生产订单信息
    const entry = await WarehouseEntry.findById(entryId);
    if (!entry) {
      return res.status(200).json({
        code: 404,
        message: "入库单不存在",
      });
    }

    // 获取入库单相关的生产订单
    const productionOrder = await K3ProductionOrder.findOne({
      FBillNo: entry.productionOrderNo,
    });

    // 获取入库单相关的仓库信息
    const stockData = await K3Stock.findOne({
      FStockId: entry.FStockId,
    });

    console.log(JSON.stringify(entry), "entry");
    console.log(JSON.stringify(productionOrder), "productionOrder");
    console.log(JSON.stringify(stockData), "stockData");

    if (!productionOrder) {
      return res.status(200).json({
        code: 404,
        message: "生产订单不存在",
      });
    }

    //查询金蝶云的生产订单信息
    const k3_PRD_MO = await k3cMethod("View", "PRD_MO", {
      Number: entry.productionOrderNo,
      Id: "",
      IsSortBySeq: "false",
    });

    if (k3_PRD_MO.Result.ResponseStatus.IsSuccess != true) {
      throw new Error(
        k3_PRD_MO.Result.ResponseStatus.Errors[0].Message || "同步失败"
      );
    }
    let k3_PRD_MO_INFO = k3_PRD_MO.Result.Result;
    let k3_PRD_MO_INFO_TreeEntity = k3_PRD_MO.Result.Result.TreeEntity;

    // entry.materialCode 找到对应k3_PRD_MO_INFO_TreeEntity中MaterialId.Number比对找到对应的TreeEntity的Id
    let k3_PRD_MO_INFO_TreeEntity_Id = k3_PRD_MO_INFO_TreeEntity.find(
      (item) => item.MaterialId.Number === entry.materialCode
    ).Id;

    if (!k3_PRD_MO_INFO_TreeEntity_Id) {
      throw new Error("物料不存在于生产订单明细中");
    }

    //查询金蝶云是否已经拥有订单
    let k3Stock = await k3cMethod("BillQuery", "PRD_INSTOCK", {
      FormId: "PRD_INSTOCK",
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
        FNUMBER: "SCRKD02_SYS",
      },
      FBillNo: entry.entryNo,
      FStockOrgId: {
        FNumber: productionOrder.FPrdOrgId_FNumber,
      },
      FOwnerId0: {
        FNumber: productionOrder.FOwnerId_FNumber,
      },
      FOwnerTypeId0: productionOrder.FOwnerTypeId || "BD_OwnerOrg",

      FWorkShopId: {
        FNumber: productionOrder.FWorkShopID_FNumber,
      },
      FDescription: entry.remark || "",
      FStockId0: {
        FNumber: stockData.FNumber,
      },
      FEntity: [
        {
          FInStockType: "1",
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
          FOwnerId: {
            FNumber: productionOrder.FOwnerId_FNumber,
          },
          FStockId: {
            FNumber: stockData.FNumber,
          },
          FMoBillNo: productionOrder.FBillNo,
          FStockStatusId: {
            FNumber: stockData.FDefStockStatusId,
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

          FEntity_Link: [
            {
              FEntity_Link_FRuleId: "PRD_MO2INSTOCK",
              FEntity_Link_FSTableName: "T_PRD_MOENTRY",
              FEntity_Link_FSBillId: productionOrder.FID,
              FEntity_Link_FSId: k3_PRD_MO_INFO_TreeEntity_Id,
              FEntity_Link_FFlowId: "f11b462a-8733-40bd-8f29-0906afc6a201",
              FEntity_Link_FFlowLineId: "5",
              FEntity_Link_FBasePrdRealQtyOld: productionOrder.FQty,
              FEntity_Link_FBasePrdRealQty: entry.actualQuantity,
            },
          ],

          FBFLowId: {
            FID: "f11b462a-8733-40bd-8f29-0906afc6a201",
          },
        },
      ],
    };

    console.log(JSON.stringify(k3Data), "k3Data");
    let k3Response = await k3cMethod("Save", "PRD_INSTOCK", {
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
    console.log(k3Response);
    // 4. 处理响应
    if (k3Response.Result.ResponseStatus.IsSuccess === true) {
      res.json({
        code: 200,
        message: "同步成功",
        data: k3Response.data,
      });
    } else {
      console.log(
        k3Response.Result.ResponseStatus.Errors[0].Message,
        "k3Response.Result.ResponseStatus.Errors"
      );
      throw new Error(
        k3Response.Result.ResponseStatus.Errors[0].Message || "同步失败"
      );
    }
  } catch (error) {
    res.status(200).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;
