const express = require("express");
const router = express.Router();
const wareHouseOntry = require("../model/warehouse/warehouseOntry");
const K3ProductionOrder = require("../model/k3/k3_PRD_MO");
const MaterialPallet = require("../model/project/materialPalletizing");
const {
  k3cMethod
} = require("./k3cMethod");
const K3SaleOrder = require("../model/k3/k3_SAL_SaleOrder");
// 扫码出库（包含自动创建出库单的逻辑）
router.post("/api/v1/warehouse_entry/scan_on", async (req, res) => {
  try {
    const {
      palletCode,
      userId,
      entryInfo
    } = req.body;

    if (!entryInfo.outboundQuantity) {
      return res.status(200).json({
        code: 404,
        message: "请先输入应出库数量",
      });
    }

    // 1. 获取托盘信息
    let pallet = {}
    if(palletCode){
      pallet = await MaterialPallet.findOne({
        palletCode
      });
    }else{
      pallet = await MaterialPallet.findOne({
        saleOrderNo: entryInfo.saleOrderNo
      });
    }
    console.log(pallet,'pallet');
    
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

    // 判断托盘是否已经入库 需要!!!
    if (pallet.inWarehouseStatus !== "IN_WAREHOUSE") {
      return res.status(200).json({
        code: 404,
        message: "此托盘未入库",
      });
    }

    // start 根据pallet.saleOrderNo(销售单号)去wareHouseOntry表查询是否有值
    //  先判断是否应出库数量和已出库数量相等;
    //不相等则显示已存在未完成出库单号:xxxxxx
    let entry1 = await wareHouseOntry.findOne({
      saleOrderId: pallet.saleOrderId,
      outNumber: {
        $ne: pallet.outboundQuantity
      }
    });
    if (entry1&&entry1.entryNo!=entryInfo.entryNo) {
      return res.status(200).json({
        code: 404,
        message: "已存在未完成出库单号:" + entry1.entryNo,
      });
    }

    if(!entryInfo.entryNo){
      //无出库单号则表示存在,无需创建初始化

    let saleOrder = await K3SaleOrder.findOne({
      _id: pallet.saleOrderId,
    });
    console.log('saleOrder', saleOrder);
    if(!saleOrder){
      return res.status(200).json({
        code: 404,
        message: "销售订单不存在:" + pallet.saleOrderNo,
      });
    }
    let entry = await wareHouseOntry.find({
      saleOrderNo: pallet.saleOrderNo,
    });
    console.log('entry', entry);
    if (entry.length > 0) {
      //有值则判断销售数量-已出库数量汇总是否大于应出库数量;
      let sum = entry.reduce((sum, item) => sum + item.outNumber, 0);
      console.log('sum', saleOrder.FQty);
      console.log('sum', sum);
      console.log('entryInfo.outboundQuantity', entryInfo.outboundQuantity);
      if (saleOrder.FQty - sum >= entryInfo.outboundQuantity) {
        // 大于等于应出库数量则显示可以进行初始化新的出库单;
        console.log('可以进行初始化新的出库单');

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
        entry = await wareHouseOntry.create({
          HuoGuiCode: entryInfo.HuoGuiCode, // 货柜号
          FaQIaoNo: entryInfo.FaQIaoNo, // 发票号
          outboundQuantity: entryInfo.outboundQuantity, //应出库数量
          outNumber: order.palletCount, //已出库数量
          saleNumber: saleOrder.FQty, //销售数量
          entryNo: "SCCK-" + order.FBillNo,
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
        });

      } else {
        //小于应出库数量则返回,该销售单号销售数量为x,已完成出库数量为x,剩余出库数量为x;  saleOrder.FQty - sum = 剩余出库数量
        console.log('小于应出库数量');
        entry = await wareHouseOntry.create({
          HuoGuiCode: entryInfo.HuoGuiCode, // 货柜号
          FaQIaoNo: entryInfo.FaQIaoNo, // 发票号
          outboundQuantity: saleOrder.FQty - sum, //应出库数量
          outNumber: order.palletCount, //已出库数量
          saleNumber: saleOrder.FQty, //销售数量
          entryNo: "SCCK-" + order.FBillNo,
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
        });
      }
    } else {
      //无值则判断销售数量-应出库数量是否大于0;
      if (saleOrder.FQty - entryInfo.outboundQuantity >= 0) {
        // 大于0;则显示可以进行初始化新的出库单;  
        console.log('大于0;则显示可以进行初始化新的出库单');
        // 获取生产订单信息
        const order = await K3ProductionOrder.findOne({
          FBillNo: pallet.productionOrderNo,
        });
        console.log(order,'order')
        if (!order) {
          return res.status(200).json({
            code: 404,
            message: "生产订单不存在",
          });
        }
        entry = await wareHouseOntry.create({
          HuoGuiCode: entryInfo.HuoGuiCode, // 货柜号
          FaQIaoNo: entryInfo.FaQIaoNo, // 发票号
          outboundQuantity: entryInfo.outboundQuantity, //应出库数量
          outNumber: order.palletCount, //已出库数量
          saleNumber: saleOrder.FQty, //销售数量
          entryNo: "SCCK-" + order.FBillNo,
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
          status: "IN_PROGRESS",
          progress: 0,
          startTime: new Date(),
          createBy: userId,
          createAt: new Date(),
          updateAt: new Date(),
        });
      } else {
        //等于0则返回,该销售单号销售数量为x,剩余出库数量为x;
        console.log('等于0则返回,该销售单号销售数量为x,剩余出库数量为x');
        entry = await wareHouseOntry.create({
          HuoGuiCode: entryInfo.HuoGuiCode, // 货柜号
          FaQIaoNo: entryInfo.FaQIaoNo, // 发票号
          outboundQuantity: saleOrder.FQty, //应出库数量 == 销售数量
          outNumber: order.palletCount, //已出库数量
          saleNumber: saleOrder.FQty, //销售数量
          entryNo: "SCCK-" + order.FBillNo,
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
        });
      }
    }

  }





    // 2. 获取或创建出库单
    let entry = await wareHouseOntry.findOne({
      productionOrderNo: pallet.productionOrderNo,
      status: { $ne: "COMPLETED" },
    });
    console.log(entry,'entry');
console.log('entry.materialId');

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
      saleOrderNo: pallet.saleOrderNo, // 新增：销售订单
    materialCode:pallet.materialCode, //新增： 物料编码
    lineCode: pallet.productLineName, // 新增：产线
    });
    // 6. 更新出库单数量信息和完成进度
    entry.outNumber = entry.entryItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    entry.palletCount = entry.entryItems.length;
    entry.progress = Math.round(
      (entry.outNumber / entry.outboundQuantity) * 100
    );



//计算已出库数量是否超过应出库数量
if(entry.outNumber>entryInfo.outboundQuantity){
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
    const {
      entryId
    } = req.body;

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
      FilterString: [{
        FieldName: "FBillNo",
        Compare: "=",
        Value: entry.entryNo,
        Left: "",
        Right: "",
        Logic: 0,
      }, ],
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
      FEntity: [{
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
      }, ],
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