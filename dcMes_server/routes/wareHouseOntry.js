/**
 * 仓库出库单路由
 * @author ljw
 * @email 1798245303@qq.com
 * @description 优化后的仓库出库单路由，支持添可销售订单类型的特殊限制规则
 */
const express = require("express");
const router = express.Router();
const wareHouseOntry = require("../model/warehouse/warehouseOntry");
const K3ProductionOrder = require("../model/k3/k3_PRD_MO");
const MaterialPallet = require("../model/project/materialPalletizing");
const { k3cMethod } = require("./k3cMethod");
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const K3SaleOrder = require("../model/k3/k3_SAL_SaleOrder");
const apiLogger = require("../middleware/apiLogger");
const warehouseService = require("../services/warehouseService"); // 导入仓库服务

// 使用API日志中间件，指定服务名称
router.use(apiLogger("wareHouseOntry"));

// 更新出库单白名单接口
router.post("/api/v1/warehouse_entry/update_whitelist", async (req, res) => {
  try {
    const { entryId, workOrderWhitelist, userId } = req.body;

    if (!entryId) {
      return res.status(200).json({
        code: 400,
        message: "出库单ID不能为空",
      });
    }

    // 查找出库单
    const entry = await wareHouseOntry.findById(entryId);
    if (!entry) {
      return res.status(200).json({
        code: 404,
        message: "出库单不存在",
      });
    }

    // 检查白名单是否已锁定
    if (entry.whitelistLocked) {
      return res.status(200).json({
        code: 403,
        message: "白名单已锁定，无法修改",
      });
    }

    // 获取销售订单信息用于验证
    const saleOrder = await K3SaleOrder.findOne({
      FBillNo: entry.saleOrderNo,
    });

    // 验证白名单数量限制
    const whitelistValidation = TiankeOrderValidator.validateWhitelist(
      saleOrder,
      workOrderWhitelist
    );
    if (!whitelistValidation.isValid) {
      return res.status(200).json({
        code: 400,
        message: whitelistValidation.message,
      });
    }

    // 更新白名单
    entry.workOrderWhitelist = workOrderWhitelist || [];
    entry.updateBy = userId;
    entry.updateAt = new Date();

    // 如果是添可订单，立即锁定白名单
    if (TiankeOrderValidator.isTiankeOrder(saleOrder)) {
      entry.whitelistLocked = true;
      entry.whitelistLockedAt = new Date();
    }

    await entry.save();

    return res.status(200).json({
      code: 200,
      message: "白名单更新成功",
      data: entry,
    });
  } catch (error) {
    console.error("更新白名单失败:", error);
    return res.status(200).json({
      code: 500,
      message: "更新白名单失败: " + error.message,
    });
  }
});

/**
 * 添可销售订单验证工具函数
 */
const TiankeOrderValidator = {
  /**
   * 检查是否为添可销售订单
   * @param {Object} saleOrder - 销售订单对象
   * @returns {Boolean} 是否为添可销售订单
   */
  isTiankeOrder(saleOrder) {
    return saleOrder && saleOrder.FSettleId_FNumber === "CUST0199";
  },

  /**
   * 验证添可订单的白名单要求
   * @param {Object} saleOrder - 销售订单对象
   * @param {Array} workOrderWhitelist - 工单白名单
   * @returns {Object} 验证结果 {isValid: boolean, message: string}
   */
  validateWhitelist(saleOrder, workOrderWhitelist) {
    if (!this.isTiankeOrder(saleOrder)) {
      return { isValid: true, message: "" };
    }

    // 添可订单必须有白名单
    if (!workOrderWhitelist || workOrderWhitelist.length === 0) {
      return {
        isValid: false,
        message: "添可的销售订单必须添加工单白名单"
      };
    }

    // 添可订单白名单只能有1个工单
    if (workOrderWhitelist.length > 1) {
      return {
        isValid: false,
        message: "添可销售订单的白名单只能设置1个工单"
      };
    }

    return { isValid: true, message: "" };
  },

  /**
   * 验证托盘工单一致性（仅对添可订单）
   * @param {Object} saleOrder - 销售订单对象
   * @param {String} currentWorkOrderNo - 当前出库单的工单号
   * @param {String} palletWorkOrderNo - 新托盘的工单号
   * @returns {Object} 验证结果 {isValid: boolean, message: string}
   */
  validatePalletWorkOrderConsistency(saleOrder, currentWorkOrderNo, palletWorkOrderNo) {
    if (!this.isTiankeOrder(saleOrder)) {
      return { isValid: true, message: "" };
    }

    // 如果是第一个托盘，允许
    if (!currentWorkOrderNo) {
      return { isValid: true, message: "" };
    }

    // 检查工单一致性
    if (currentWorkOrderNo !== palletWorkOrderNo) {
      return {
        isValid: false,
        message: `【添可订单工单限制】出库单中的托盘必须来自同一工单。当前出库单工单：${currentWorkOrderNo}，扫描托盘工单：${palletWorkOrderNo}。请扫描工单号为 ${currentWorkOrderNo} 的托盘。`
      };
    }

    return { isValid: true, message: "" };
  },

  /**
   * 获取友好的错误提示信息
   * @param {String} errorType - 错误类型
   * @param {Object} params - 错误参数
   * @returns {String} 友好的错误信息
   */
  getErrorMessage(errorType, params = {}) {
    const messages = {
      WHITELIST_REQUIRED: "【添可订单限制】添可销售订单必须设置工单白名单才能进行出库操作。",
      WHITELIST_COUNT_EXCEEDED: `【添可订单限制】添可销售订单的白名单只能设置1个工单，当前设置了${params.count}个工单。`,
      WHITELIST_LOCKED: "【白名单已锁定】白名单已锁定，无法修改。如需修改请联系系统管理员。",
      WORK_ORDER_INCONSISTENT: `【工单一致性限制】出库单中的托盘必须来自同一工单。当前工单：${params.currentWorkOrder}，托盘工单：${params.palletWorkOrder}。`,
      PALLET_NOT_IN_WHITELIST: `【白名单限制】托盘所属工单 ${params.palletWorkOrder} 不在白名单中。请检查白名单设置或扫描正确的托盘。`
    };

    return messages[errorType] || "操作失败，请联系系统管理员。";
  }
};

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

    // 获取销售订单信息用于验证
    let k3_SAL_SaleOrder = await K3SaleOrder.findOne({
      FBillNo: pallet.saleOrderNo,
    });

    // 使用新的添可订单验证逻辑
    const whitelistValidation = TiankeOrderValidator.validateWhitelist(
      k3_SAL_SaleOrder,
      entryInfo.workOrderWhitelist
    );
    if (!whitelistValidation.isValid) {
      return res.status(200).json({
        code: 201,
        message: whitelistValidation.message,
      });
    }

    // 检查白名单（通用逻辑）
    let checkwhite = false;
    if (entryInfo.workOrderWhitelist && entryInfo.workOrderWhitelist.length > 0) {
      for (const element of entryInfo.workOrderWhitelist) {
        if (element.workOrderNo === pallet.workOrderNo) {
          checkwhite = true;
          break;
        }
      }
    } else {
      checkwhite = true; // 没有白名单限制时允许
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
            status: "IN_PROGRESS",
            progress: 0,
            startTime: new Date(),
            createBy: userId,
            createAt: new Date(),
            updateAt: new Date(),
            workOrderWhitelist: entryInfo.workOrderWhitelist || [], // 添加工单白名单
            currentWorkOrderNo: pallet.workOrderNo, // 设置当前工单号
            whitelistLocked: TiankeOrderValidator.isTiankeOrder(k3_SAL_SaleOrder), // 添可订单立即锁定白名单
            whitelistLockedAt: TiankeOrderValidator.isTiankeOrder(k3_SAL_SaleOrder) ? new Date() : null,
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
            currentWorkOrderNo: pallet.workOrderNo, // 设置当前工单号
            whitelistLocked: TiankeOrderValidator.isTiankeOrder(k3_SAL_SaleOrder), // 添可订单立即锁定白名单
            whitelistLockedAt: TiankeOrderValidator.isTiankeOrder(k3_SAL_SaleOrder) ? new Date() : null,
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
            currentWorkOrderNo: pallet.workOrderNo, // 设置当前工单号
            whitelistLocked: TiankeOrderValidator.isTiankeOrder(k3_SAL_SaleOrder), // 添可订单立即锁定白名单
            whitelistLockedAt: TiankeOrderValidator.isTiankeOrder(k3_SAL_SaleOrder) ? new Date() : null,
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
            currentWorkOrderNo: pallet.workOrderNo, // 设置当前工单号
            whitelistLocked: TiankeOrderValidator.isTiankeOrder(k3_SAL_SaleOrder), // 添可订单立即锁定白名单
            whitelistLockedAt: TiankeOrderValidator.isTiankeOrder(k3_SAL_SaleOrder) ? new Date() : null,
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

    // 4. 检查托盘是否已经出库 - 增强重复检查
    const existingPallet = entry.entryItems.find(
      (item) => item.palletCode === palletCode
    );

    // 强化防重复机制：检查是否存在同一托盘的重复出库单项
    const duplicatePalletItems = entry.entryItems.filter(
      (item) => item.palletCode === palletCode
    );
    
    if (duplicatePalletItems.length > 1) {
      // 如果发现重复项，记录错误并拒绝操作
      console.error(`发现重复托盘项，托盘编号: ${palletCode}, 出库单号: ${entry.entryNo}, 重复项数量: ${duplicatePalletItems.length}`);
      return res.status(200).json({
        code: 404,
        message: `数据异常：托盘 ${palletCode} 在出库单中存在重复项，请联系管理员处理`,
      });
    }

    // 额外检查：防止并发操作导致的重复添加
    if (existingPallet) {
      // 重新获取最新的出库单数据，防止并发修改
      const latestEntry = await wareHouseOntry.findById(entry._id);
      const latestExistingPallet = latestEntry.entryItems.find(
        (item) => item.palletCode === palletCode
      );
      
      if (latestExistingPallet) {
        // 托盘已存在于出库单中，进行相应处理
        if (pallet.inWarehouseStatus === "OUT_WAREHOUSE") {
          return res.status(200).json({
            code: 404,
            message: "该托盘已出库",
          });
        }
        
        // 处理部分出库的情况
        if (
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
              data: latestEntry,
            });
          }

          // 检查是否已经添加过这些条码
          const currentBarcodes = latestExistingPallet.palletBarcodes ? 
            latestExistingPallet.palletBarcodes.map(b => b.barcode) : [];
          
          const newBarcodes = remainingBarcodes.filter(
            barcode => !currentBarcodes.includes(barcode.barcode)
          );

          if (newBarcodes.length === 0) {
            return res.status(200).json({
              code: 200,
              message: "该托盘剩余产品已在当前出库单中",
              data: latestEntry,
            });
          }

          // 将新的条码添加到出库单中
          if (!latestExistingPallet.palletBarcodes) {
            latestExistingPallet.palletBarcodes = [];
          }

          for (const barcode of newBarcodes) {
            latestExistingPallet.palletBarcodes.push({
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
          latestExistingPallet.quantity = latestExistingPallet.palletBarcodes.length;

          // 更新出库单数量和进度
          latestEntry.outNumber = latestEntry.entryItems.reduce(
            (sum, item) => {
              if (item.palletBarcodes && item.palletBarcodes.length > 0) {
                return sum + item.palletBarcodes.length;
              } else if (item.quantity) {
                return sum + item.quantity;
              } else {
                console.warn(`托盘项缺少数量信息: palletCode=${item.palletCode}, palletId=${item.palletId}`);
                return sum;
              }
            },
            0
          );
          latestEntry.actualQuantity = latestEntry.outNumber;
          latestEntry.palletCount = latestEntry.entryItems.length;
          latestEntry.progress = Math.round(
            (latestEntry.outNumber / latestEntry.outboundQuantity) * 100
          );

          // 更新出库单状态
          if (latestEntry.outNumber >= latestEntry.outboundQuantity) {
            latestEntry.status = "COMPLETED";
            latestEntry.completedTime = new Date();
            // 调用通知接口
            warehouseService.notifyOutWarehouseCompleted(latestEntry.entryNo)
              .then(result => {
                if (!result.success) {
                  console.error(`出库单${latestEntry.entryNo}完成通知失败: ${result.error}`);
                }
              })
              .catch(error => {
                console.error(`出库单${latestEntry.entryNo}完成通知出错: ${error.message}`);
              });
          } else {
            latestEntry.status = "IN_PROGRESS";
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

          await latestEntry.save();

          return res.status(200).json({
            code: 200,
            message: "托盘剩余产品成功出库",
            data: latestEntry,
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
        } else {
          // 托盘已在出库单中，不允许重复添加
          return res.status(200).json({
            code: 404,
            message: "该托盘已在当前出库单中，不允许重复出库",
          });
        }
      }
      
      // 更新entry为最新数据
      entry = latestEntry;
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

    // 验证托盘工单一致性（针对添可订单）
    const workOrderConsistencyValidation = TiankeOrderValidator.validatePalletWorkOrderConsistency(
      k3_SAL_SaleOrder,
      entry.currentWorkOrderNo,
      pallet.workOrderNo
    );
    if (!workOrderConsistencyValidation.isValid) {
      return res.status(200).json({
        code: 404,
        message: workOrderConsistencyValidation.message,
      });
    }

    // 5. 添加托盘到出库单 - 增强重复检查
    // 获取未出库的条码
    const unOutBarcodes = pallet.palletBarcodes.filter(
      (item) => item.outWarehouseStatus !== "COMPLETED"
    );

    // 如果没有未出库的条码，说明托盘已全部出库
    if (unOutBarcodes.length === 0) {
      return res.status(200).json({
        code: 404,
        message: "该托盘所有产品已出库",
      });
    }
    
    // 预先计算添加该托盘后的总出库数量
    const currentTotalQuantity = entry.entryItems.reduce(
      (sum, item) => {
        if (item.palletBarcodes && item.palletBarcodes.length > 0) {
          return sum + item.palletBarcodes.length;
        } else if (item.quantity) {
          return sum + item.quantity;
        } else {
          console.warn(`托盘项缺少数量信息: palletCode=${item.palletCode}, palletId=${item.palletId}`);
          return sum;
        }
      },
      0
    );
    const newTotalQuantity = currentTotalQuantity + unOutBarcodes.length;
    
    // 预先检查添加该托盘后是否会超过应出库数量
    if (newTotalQuantity > entryInfo.outboundQuantity) {
      return res.status(200).json({
        code: 404,
        message: "添加该托盘后会超过应出库数量,无法进行出库,需修改应出库数量",
      });
    }

    // 检查托盘中的条码是否已在其他出库单中出库
    for (const barcode of unOutBarcodes) {
      const existingInOtherEntry = await wareHouseOntry.findOne({
        "entryItems.palletBarcodes.barcode": barcode.barcode
      });
      
      if (existingInOtherEntry && existingInOtherEntry._id.toString() !== entry._id.toString()) {
        return res.status(200).json({
          code: 404,
          message: `条码 ${barcode.barcode} 已在出库单 ${existingInOtherEntry.entryNo} 中出库`,
        });
      }
    }

    // 再次检查当前出库单中是否已存在该托盘（防止并发添加）
    const currentEntry = await wareHouseOntry.findById(entry._id);
    const finalExistingPallet = currentEntry.entryItems.find(
      (item) => item.palletCode === palletCode
    );
    
    if (finalExistingPallet) {
      return res.status(200).json({
        code: 404,
        message: "该托盘已在当前出库单中，请勿重复扫码",
      });
    }

    // 使用原子操作添加托盘项，防止并发重复添加
    const palletItem = {
      palletId: pallet._id,
      palletCode: pallet.palletCode,
      quantity: unOutBarcodes.length, // 使用未出库条码的数量
      scanTime: new Date(),
      scanBy: userId,
      saleOrderNo: pallet.saleOrderNo, // 新增：销售订单
      materialCode: pallet.materialCode, //新增： 物料编码
      lineCode: pallet.productLineName, // 新增：产线
      palletType: pallet.palletType, // 新增：托盘类型
      palletBarcodes: unOutBarcodes.map((item) => ({
        barcode: item.barcode,
        barcodeType: item.barcodeType,
        materialProcessFlowId: item.materialProcessFlowId,
        productionPlanWorkOrderId: item.productionPlanWorkOrderId,
        scanTime: new Date(),
        scanBy: userId,
      })),
    };

    // 使用 MongoDB 的原子操作确保不会重复添加
    const updateFields = {
      updateAt: new Date()
    };

    // 如果是第一个托盘，设置当前工单号
    if (!entry.currentWorkOrderNo) {
      updateFields.currentWorkOrderNo = pallet.workOrderNo;
    }

    const updateResult = await wareHouseOntry.updateOne(
      {
        _id: entry._id,
        "entryItems.palletCode": { $ne: palletCode } // 确保托盘不存在
      },
      {
        $push: { entryItems: palletItem },
        $set: updateFields
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(200).json({
        code: 404,
        message: "该托盘已在当前出库单中，或出库单不存在",
      });
    }

    if (updateResult.modifiedCount === 0) {
      return res.status(200).json({
        code: 404,
        message: "托盘添加失败，可能已存在重复项",
      });
    }

    // 重新获取更新后的出库单
    const updatedEntry = await wareHouseOntry.findById(entry._id);

    // 6. 更新出库单数量信息和完成进度
    updatedEntry.outNumber = updatedEntry.entryItems.reduce(
      (sum, item) => {
        if (item.palletBarcodes && item.palletBarcodes.length > 0) {
          return sum + item.palletBarcodes.length;
        } else if (item.quantity) {
          return sum + item.quantity;
        } else {
          console.warn(`托盘项缺少数量信息: palletCode=${item.palletCode}, palletId=${item.palletId}`);
          return sum;
        }
      },
      0
    );
    updatedEntry.actualQuantity = updatedEntry.outNumber;
    updatedEntry.palletCount = updatedEntry.entryItems.length;
    updatedEntry.progress = Math.round(
      (updatedEntry.outNumber / updatedEntry.outboundQuantity) * 100
    );

    //计算已出库数量是否超过应出库数量
    if (updatedEntry.outNumber > entryInfo.outboundQuantity) {
      // 如果超过，需要回滚操作
      await wareHouseOntry.updateOne(
        { _id: updatedEntry._id },
        { $pull: { entryItems: { palletCode: palletCode } } }
      );
      
      return res.status(200).json({
        code: 404,
        message: "该托盘数量已经超过应出库数量,无法进行出库,需修改应出库数量",
      });
    }

    // 7. 更新出库单状态
    if (updatedEntry.outNumber >= updatedEntry.outboundQuantity) {
      updatedEntry.status = "COMPLETED";
      updatedEntry.completedTime = new Date();
      // 调用通知接口
      warehouseService.notifyOutWarehouseCompleted(updatedEntry.entryNo)
        .then(result => {
          if (!result.success) {
            console.error(`出库单${updatedEntry.entryNo}完成通知失败: ${result.error}`);
          }
        })
        .catch(error => {
          console.error(`出库单${updatedEntry.entryNo}完成通知出错: ${error.message}`);
        });
    } else {
      updatedEntry.status = "IN_PROGRESS";
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

    await updatedEntry.save();

    // 重新查询以获取最新数据
    // const latestEntry = await wareHouseOntry.findById(entry._id);

    return res.status(200).json({
      code: 200,
      message: "扫码出库成功",
      data: updatedEntry,
    });
  } catch (error) {
    console.error("扫码出库失败:", error);
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

    // 检查产品条码在托盘中的出库状态
    const palletBarcode = pallet.palletBarcodes.find(
      (item) => item.barcode === productBarcode
    );
    
    if (!palletBarcode) {
      return res.status(200).json({
        code: 404,
        message: "托盘中未找到该产品条码",
      });
    }
    
    if (palletBarcode.outWarehouseStatus === "COMPLETED") {
      const existingEntryWithBarcode = await wareHouseOntry.findOne({
        "entryItems.palletBarcodes.barcode": productBarcode
      });
      
      let errorMessage = "该产品条码已出库";
      if (existingEntryWithBarcode) {
        errorMessage += `，出库单号：${existingEntryWithBarcode.entryNo}`;
      }
      
      return res.status(200).json({
        code: 404,
        message: errorMessage,
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

        // 获取销售订单信息用于验证
        let k3_SAL_SaleOrder = await K3SaleOrder.findOne({
          FBillNo: pallet.saleOrderNo,
        });

        // 使用新的添可订单验证逻辑
        const whitelistValidation = TiankeOrderValidator.validateWhitelist(
          k3_SAL_SaleOrder,
          entryInfo.workOrderWhitelist
        );
        if (!whitelistValidation.isValid) {
          return res.status(200).json({
            code: 201,
            message: whitelistValidation.message,
          });
        }

        // 检查白名单（通用逻辑）
        let checkwhite = false;
        if (entryInfo.workOrderWhitelist && entryInfo.workOrderWhitelist.length > 0) {
          for (const element of entryInfo.workOrderWhitelist) {
            if (element.workOrderNo === pallet.workOrderNo) {
              checkwhite = true;
              break;
            }
          }
        } else {
          checkwhite = true; // 没有白名单限制时允许
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
          outNumber: 0, //已出库数量，初始为0
          actualQuantity: 0, //实际出库数量，初始为0
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
          currentWorkOrderNo: pallet.workOrderNo, // 设置当前工单号
          whitelistLocked: TiankeOrderValidator.isTiankeOrder(k3_SAL_SaleOrder), // 添可订单立即锁定白名单
          whitelistLockedAt: TiankeOrderValidator.isTiankeOrder(k3_SAL_SaleOrder) ? new Date() : null,
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
          // 调用通知接口
          warehouseService.notifyOutWarehouseCompleted(entry.entryNo)
            .then(result => {
              if (!result.success) {
                console.error(`出库单${entry.entryNo}完成通知失败: ${result.error}`);
              }
            })
            .catch(error => {
              console.error(`出库单${entry.entryNo}完成通知出错: ${error.message}`);
            });
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

    // 获取销售订单信息用于验证
    const saleOrderForValidation = await K3SaleOrder.findOne({
      FBillNo: pallet.saleOrderNo,
    });

    // 验证托盘工单一致性（针对添可订单）
    const workOrderConsistencyValidation = TiankeOrderValidator.validatePalletWorkOrderConsistency(
      saleOrderForValidation,
      entry.currentWorkOrderNo,
      pallet.workOrderNo
    );
    if (!workOrderConsistencyValidation.isValid) {
      return res.status(200).json({
        code: 404,
        message: workOrderConsistencyValidation.message,
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

      // 更新出库单的当前工单号（如果是第一个托盘）
      if (!entry.currentWorkOrderNo) {
        entry.currentWorkOrderNo = pallet.workOrderNo;
      }
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
      (sum, item) => {
        if (item.palletBarcodes && item.palletBarcodes.length > 0) {
          return sum + item.palletBarcodes.length;
        } else if (item.quantity) {
          return sum + item.quantity;
        } else {
          console.warn(`托盘项缺少数量信息: palletCode=${item.palletCode}, palletId=${item.palletId}`);
          return sum;
        }
      },
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
      // 调用通知接口
      warehouseService.notifyOutWarehouseCompleted(entry.entryNo)
        .then(result => {
          if (!result.success) {
            console.error(`出库单${entry.entryNo}完成通知失败: ${result.error}`);
          }
        })
        .catch(error => {
          console.error(`出库单${entry.entryNo}完成通知出错: ${error.message}`);
        });
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

// 删除出库单并恢复相关条码状态
router.post("/api/v1/warehouse_entry/delete_entry", async (req, res) => {
  try {
    const { entryId } = req.body;

    // 1. 获取出库单详情
    const entry = await wareHouseOntry.findById(entryId);
    if (!entry) {
      return res.status(200).json({
        code: 404,
        message: "出库单不存在",
      });
    }

    // 2. 收集所有需要恢复状态的条码信息
    const palletBarcodeMap = new Map(); // Map<palletCode, Array<barcode>>

    if (entry.entryItems && entry.entryItems.length > 0) {
      entry.entryItems.forEach(item => {
        if (item.palletCode && item.palletBarcodes && item.palletBarcodes.length > 0) {
          // 获取当前托盘中已出库的条码
          const barcodes = item.palletBarcodes.map(b => b.barcode);
          
          // 添加到托盘条码映射
          if (!palletBarcodeMap.has(item.palletCode)) {
            palletBarcodeMap.set(item.palletCode, []);
          }
          palletBarcodeMap.get(item.palletCode).push(...barcodes);
        }
      });
    }

    // 3. 对每个托盘进行处理
    const processResults = [];
    
    for (const [palletCode, barcodes] of palletBarcodeMap.entries()) {
      try {
        // 只更新特定条码的出库状态
        const updateResult = await MaterialPallet.updateOne(
          { palletCode: palletCode },
          {
            $set: {
              "palletBarcodes.$[elem].outWarehouseStatus": "PENDING",
              "palletBarcodes.$[elem].outWarehouseTime": null,
              "palletBarcodes.$[elem].outWarehouseBy": null
            }
          },
          {
            arrayFilters: [{ "elem.barcode": { $in: barcodes } }]
          }
        );
        
        // 获取更新后的托盘信息，检查是否所有条码都已恢复
        const updatedPallet = await MaterialPallet.findOne({ palletCode });
        
        if (updatedPallet) {
          // 检查剩余的出库状态条码数量
          const outWarehouseBarcodes = updatedPallet.palletBarcodes.filter(
            b => b.outWarehouseStatus === "COMPLETED"
          );
          
          // 根据剩余已出库条码数量决定托盘状态
          let newStatus;
          if (outWarehouseBarcodes.length === 0) {
            // 如果没有已出库的条码，则恢复为"已入库"状态
            newStatus = "IN_WAREHOUSE";
          } else if (outWarehouseBarcodes.length < updatedPallet.palletBarcodes.length) {
            // 如果有部分条码已出库，则设为"部分出库"状态
            newStatus = "PART_OUT_WAREHOUSE";
          } else {
            // 所有条码都已出库，则状态为"已出库"
            newStatus = "OUT_WAREHOUSE";
          }
          
          // 更新托盘状态
          await MaterialPallet.updateOne(
            { palletCode },
            { inWarehouseStatus: newStatus }
          );
          
          processResults.push({
            palletCode,
            barcodesRestored: barcodes.length,
            newStatus
          });
        }
      } catch (error) {
        console.error(`处理托盘 ${palletCode} 时出错:`, error);
        processResults.push({
          palletCode,
          error: error.message
        });
      }
    }

    // 4. 删除出库单
    await wareHouseOntry.deleteOne({ _id: entryId });

    return res.status(200).json({
      code: 200,
      message: "出库单删除成功，已恢复相关条码状态",
      data: {
        entryNo: entry.entryNo,
        processResults
      }
    });
  } catch (error) {
    console.error("删除出库单错误:", error);
    return res.status(200).json({
      code: 500,
      message: error.message
    });
  }
});

// 清理出库单中的重复托盘项
router.post("/api/v1/warehouse_entry/clean_duplicate_pallets", async (req, res) => {
  try {
    const { entryId } = req.body;

    if (!entryId) {
      return res.status(200).json({
        code: 400,
        message: "出库单ID不能为空",
      });
    }

    // 获取出库单信息
    const entry = await wareHouseOntry.findById(entryId);
    if (!entry) {
      return res.status(200).json({
        code: 404,
        message: "出库单不存在",
      });
    }

    // 检查是否存在重复托盘项
    const palletCodeMap = new Map();
    const duplicateItems = [];
    const uniqueItems = [];

    entry.entryItems.forEach((item, index) => {
      if (palletCodeMap.has(item.palletCode)) {
        // 发现重复项
        duplicateItems.push({
          index,
          palletCode: item.palletCode,
          quantity: item.quantity,
          scanTime: item.scanTime
        });
      } else {
        // 第一次出现的托盘
        palletCodeMap.set(item.palletCode, index);
        uniqueItems.push(item);
      }
    });

    if (duplicateItems.length === 0) {
      return res.status(200).json({
        code: 200,
        message: "未发现重复托盘项",
        data: {
          totalItems: entry.entryItems.length,
          duplicateCount: 0
        }
      });
    }

    console.log(`出库单 ${entry.entryNo} 发现 ${duplicateItems.length} 个重复托盘项:`, duplicateItems);

    // 对于重复项，保留最早扫描的那一项，合并后续重复项的条码信息
    const mergedItems = [];
    const processedPallets = new Set();

    for (const item of entry.entryItems) {
      if (processedPallets.has(item.palletCode)) {
        // 已处理过该托盘，跳过
        continue;
      }

      // 找到所有相同托盘编号的项
      const sameCodeItems = entry.entryItems.filter(i => i.palletCode === item.palletCode);
      
      if (sameCodeItems.length === 1) {
        // 没有重复，直接添加
        mergedItems.push(item);
      } else {
        // 有重复，需要合并
        const mergedItem = { ...sameCodeItems[0] }; // 保留第一项的基本信息
        const allBarcodes = [];

        // 收集所有重复项的条码，去重
        sameCodeItems.forEach(sameItem => {
          if (sameItem.palletBarcodes && sameItem.palletBarcodes.length > 0) {
            sameItem.palletBarcodes.forEach(barcode => {
              const exists = allBarcodes.some(b => b.barcode === barcode.barcode);
              if (!exists) {
                allBarcodes.push(barcode);
              }
            });
          }
        });

        // 更新合并后的项
        mergedItem.palletBarcodes = allBarcodes;
        mergedItem.quantity = allBarcodes.length;
        
        mergedItems.push(mergedItem);
        
        console.log(`合并托盘 ${item.palletCode}: ${sameCodeItems.length} 个重复项 -> 1 个项，条码数量: ${allBarcodes.length}`);
      }

      processedPallets.add(item.palletCode);
    }

    // 更新出库单
    entry.entryItems = mergedItems;
    
    // 重新计算数量和进度
    entry.outNumber = entry.entryItems.reduce(
      (sum, item) => {
        if (item.palletBarcodes && item.palletBarcodes.length > 0) {
          return sum + item.palletBarcodes.length;
        } else if (item.quantity) {
          return sum + item.quantity;
        } else {
          console.warn(`托盘项缺少数量信息: palletCode=${item.palletCode}, palletId=${item.palletId}`);
          return sum;
        }
      },
      0
    );
    entry.actualQuantity = entry.outNumber;
    entry.palletCount = entry.entryItems.length;
    entry.progress = Math.round(
      (entry.outNumber / entry.outboundQuantity) * 100
    );

    // 更新状态
    if (entry.outNumber >= entry.outboundQuantity) {
      entry.status = "COMPLETED";
      if (!entry.completedTime) {
        entry.completedTime = new Date();
      }
    } else {
      entry.status = "IN_PROGRESS";
    }

    entry.updateAt = new Date();

    await entry.save();

    return res.status(200).json({
      code: 200,
      message: "重复托盘项清理成功",
      data: {
        entryNo: entry.entryNo,
        originalItemCount: entry.entryItems.length + duplicateItems.length,
        cleanedItemCount: entry.entryItems.length,
        duplicatesRemoved: duplicateItems.length,
        duplicateDetails: duplicateItems,
        newOutNumber: entry.outNumber,
        newProgress: entry.progress
      }
    });
  } catch (error) {
    console.error("清理重复托盘项失败:", error);
    return res.status(200).json({
      code: 500,
      message: error.message
    });
  }
});

// 批量清理所有出库单的重复托盘项
router.post("/api/v1/warehouse_entry/batch_clean_duplicates", async (req, res) => {
  try {
    const { status = "all" } = req.body; // all, IN_PROGRESS, COMPLETED

    // 构建查询条件
    let query = {};
    if (status !== "all") {
      query.status = status;
    }

    // 查找所有符合条件的出库单
    const entries = await wareHouseOntry.find(query);
    
    const results = [];
    let totalCleaned = 0;

    for (const entry of entries) {
      // 检查是否存在重复托盘项
      const palletCodeMap = new Map();
      let hasDuplicates = false;

      entry.entryItems.forEach((item) => {
        if (palletCodeMap.has(item.palletCode)) {
          hasDuplicates = true;
        } else {
          palletCodeMap.set(item.palletCode, true);
        }
      });

      if (!hasDuplicates) {
        continue;
      }

      try {
        // 对有重复项的出库单进行清理
        const cleanResult = await fetch(`${req.protocol}://${req.get('host')}/api/v1/warehouse_entry/clean_duplicate_pallets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ entryId: entry._id.toString() })
        }).then(response => response.json());

        if (cleanResult.code === 200) {
          results.push({
            entryNo: entry.entryNo,
            entryId: entry._id,
            duplicatesRemoved: cleanResult.data.duplicatesRemoved,
            status: "success"
          });
          totalCleaned += cleanResult.data.duplicatesRemoved;
        } else {
          results.push({
            entryNo: entry.entryNo,
            entryId: entry._id,
            error: cleanResult.message,
            status: "failed"
          });
        }
      } catch (error) {
        results.push({
          entryNo: entry.entryNo,
          entryId: entry._id,
          error: error.message,
          status: "failed"
        });
      }
    }

    return res.status(200).json({
      code: 200,
      message: "批量清理完成",
      data: {
        totalProcessed: entries.length,
        totalWithDuplicates: results.length,
        totalDuplicatesRemoved: totalCleaned,
        results
      }
    });
  } catch (error) {
    console.error("批量清理重复托盘项失败:", error);
    return res.status(200).json({
      code: 500,
      message: error.message
    });
  }
});

// 修复出库单数量计算错误
router.post("/api/v1/warehouse_entry/fix_quantities", async (req, res) => {
  try {
    const { entryId, entryNo } = req.body;

    let query = {};
    if (entryId) {
      query._id = entryId;
    } else if (entryNo) {
      query.entryNo = entryNo;
    } else {
      // 如果没有指定，修复所有状态为 IN_PROGRESS 的出库单
      query.status = "IN_PROGRESS";
    }

    const entries = await wareHouseOntry.find(query);
    
    if (entries.length === 0) {
      return res.status(200).json({
        code: 404,
        message: "未找到符合条件的出库单",
      });
    }

    const fixResults = [];

    for (const entry of entries) {
      const originalOutNumber = entry.outNumber;
      const originalActualQuantity = entry.actualQuantity;

      // 重新计算正确的出库数量
      const correctOutNumber = entry.entryItems.reduce((sum, item) => {
        if (item.palletBarcodes && item.palletBarcodes.length > 0) {
          return sum + item.palletBarcodes.length;
        } else if (item.quantity) {
          return sum + item.quantity;
        } else {
          console.warn(`托盘项缺少数量信息: palletCode=${item.palletCode}, palletId=${item.palletId}`);
          return sum;
        }
      }, 0);

      // 更新出库单数量信息
      entry.outNumber = correctOutNumber;
      entry.actualQuantity = correctOutNumber;
      entry.palletCount = entry.entryItems.length;
      entry.progress = Math.round((correctOutNumber / entry.outboundQuantity) * 100);

      // 检查是否需要更新状态
      if (correctOutNumber >= entry.outboundQuantity && entry.status !== "COMPLETED") {
        entry.status = "COMPLETED";
        entry.completedTime = new Date();
      } else if (correctOutNumber < entry.outboundQuantity && entry.status === "COMPLETED") {
        entry.status = "IN_PROGRESS";
        entry.completedTime = null;
      }

      entry.updateAt = new Date();
      await entry.save();

      fixResults.push({
        entryNo: entry.entryNo,
        entryId: entry._id,
        originalOutNumber,
        correctOutNumber,
        originalActualQuantity,
        difference: correctOutNumber - originalOutNumber,
        status: entry.status,
        progress: entry.progress
      });
    }

    return res.status(200).json({
      code: 200,
      message: "出库单数量修复完成",
      data: {
        fixedCount: fixResults.length,
        results: fixResults
      }
    });
  } catch (error) {
    console.error("修复出库单数量失败:", error);
    return res.status(200).json({
      code: 500,
      message: error.message
    });
  }
});

module.exports = router;
