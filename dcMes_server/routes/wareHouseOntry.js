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
        HuoGuiCode: entryInfo.HuoGuiCode,      // 货柜号
        FaQIaoNo: entryInfo.FaQIaoNo,      // 发票号
        outboundQuantity: entryInfo.outboundQuantity,//应收数量
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

    // 2. 转换为金蝶云格式
    const k3Data = {
      // FID: 0,
      FBillType: {
        FNUMBER: "SCRKD02_SYS",
      },
      FBillNo: entry.entryNo,
      FDate: new Date().toISOString().split("T")[0],

      // 使用生产订单的组织信息
      FPrdOrgId: {
        FNumber: productionOrder.FPrdOrgId,
      },
      FStockOrgId: {
        FNumber: productionOrder.FPrdOrgId,
      },

      FStockId0: {
        FNumber: "CK001",
      },

      // 使用生产订单的车间信息
      FWorkShopId: {
        FNumber:
          productionOrder.FWorkShopID_FNumber ||
          productionOrder.FWorkShopID_FName,
      },

      // 使用生产订单的货主信息
      FOwnerTypeId0: productionOrder.FOwnerTypeId,
      FOwnerId0: {
        FNumber: productionOrder.FOwnerId,
      },

      FDescription: entry.remark || "",

      FEntity: [
        {
          FEntryID: 0,
          // 使用生产订单的物料信息
          FMaterialId: {
            FNumber: productionOrder.FMaterialId,
          },
          FUnitID: {
            FNumber: productionOrder.FUnitId,
          },
          FBaseUnitId: {
            FNumber: productionOrder.FUnitId,
          },
          FRealQty: entry.actualQuantity,
          FBaseRealQty: entry.actualQuantity,

          // 使用生产订单的货主信息
          FOwnerTypeId: productionOrder.FOwnerTypeId,
          FOwnerId: {
            FNumber: productionOrder.FOwnerId,
          },

          FStockId: {
            FNumber: "CK001",
          },

          FKeeperTypeId: "BD_KeeperOrg",
          FKeeperId_Id: productionOrder.FPrdOrgId,

          FMoBillNo: productionOrder.FBillNo,

          FStockStatusId: {
            FNumber: "KCZT01_SYS",
          },
          // FStockStatusId: {
          //   Id: 10000,
          //   msterID: 10000,
          //   MultiLanguageText: [{ PkId: 1, LocaleId: 2052, Name: "可用" }],
          //   Name: [{ Key: 2052, Value: "可用" }],
          //   Number: "KCZT01_SYS",
          //   Type: "0",
          // },

          FInStockType: "1",

          FProduceDate: new Date().toISOString().split("T")[0],
          FExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        },
      ],
    };

    let k3Response = await k3cMethod("Save", "PRD_INSTOCK", {
      NeedUpDateFields: [],
      NeedReturnFields: [],
      IsDeleteEntry: "false",
      SubSystemId: "",
      IsVerifyBaseDataField: "false",
      IsEntryBatchFill: "true",
      ValidateFlag: "true",
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
      throw new Error(
        JSON.stringify(k3Response.Result.ResponseStatus.Errors) || "同步失败"
      );
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;
