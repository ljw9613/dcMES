const express = require("express");
const router = express.Router();
const wareHouseOntry = require("../model/warehouse/warehouseOntry");
const K3ProductionOrder = require("../model/k3/k3_PRD_MO");
const MaterialPallet = require("../model/project/materialPalletizing");
const { k3cMethod } = require("./k3cMethod");
// 扫码出库（包含自动创建出库单的逻辑）
router.post("/api/v1/warehouse_entry/scan_on", async (req, res) => {
  try {
    const { palletCode, userId, entryInfo } = req.body;

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

    // 判断托盘是否已经入库
    if (pallet.inWarehouseStatus !== "IN_WAREHOUSE") {
      return res.status(200).json({
        code: 404,
        message: "此托盘未入库",
      });
    }

    // 2. 获取或创建出库单
    let entry = await wareHouseOntry.findOne({
      productionOrderNo: pallet.productionOrderNo,
      status: { $ne: "COMPLETED" },
    });

    // 如果出库单不存在，则创建新的出库单
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

      entry = await wareHouseOntry.create({
        HuoGuiCode: entryInfo.HuoGuiCode, // 货柜号
        FaQIaoNo: entryInfo.FaQIaoNo, // 发票号
        outboundQuantity: entryInfo.outboundQuantity, //应收数量
        entryNo: "SCCK-" + order.FBillNo,
        productionOrderNo: order.FBillNo,
        saleOrderId: order.FSaleOrderId,
        saleOrderNo: order.FSaleOrderNo,
        saleOrderEntryId: order.FSaleOrderEntryId,
        materialId: pallet.materialId,
        materialCode: pallet.materialCode,
        materialName: pallet.materialName,
        materialSpec: pallet.materialSpec,
        plannedQuantity: order.FQty,
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
        message: "托盘物料与出库单物料不一致",
      });
    }

    // 4. 检查托盘是否已经出库
    const existingPallet = entry.entryItems.find(
      (item) => item.palletCode === palletCode
    );
    if (existingPallet) {
      return res.status(200).json({
        message: "该托盘已出库",
      });
    }

    // 5. 添加托盘到出库单
    entry.entryItems.push({
      palletId: pallet._id,
      palletCode: pallet.palletCode,
      quantity: pallet.totalQuantity,
      scanTime: new Date(),
      scanBy: userId,
    });

    // 6. 更新出库单数量信息和完成进度
    entry.actualQuantity = entry.entryItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    entry.palletCount = entry.entryItems.length;
    entry.progress = Math.round(
      (entry.actualQuantity / entry.plannedQuantity) * 100
    );

    // 7. 更新出库单状态
    if (entry.actualQuantity >= entry.plannedQuantity) {
      entry.status = "COMPLETED";
      entry.completedTime = new Date();
    } else {
      entry.status = "IN_PROGRESS";
    }

    // 8. 更新托盘的出库状态
    await MaterialPallet.findByIdAndUpdate(pallet._id, {
      inWarehouseStatus: "OUT_WAREHOUSE",
      outWarehouseTime: new Date(),
      updateAt: new Date(),
    });

    await entry.save();

    // 重新查询以获取最新数据
    // const latestEntry = await wareHouseOntry.findById(entry._id);

    res.json({
      code: 200,
      message: "扫码出库成功",
      data: entry,
    });
  } catch (error) {
    res.status(500).json({
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
      res.json({
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
    res.status(200).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;
