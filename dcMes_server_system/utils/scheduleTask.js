// cronTasks.js

const PreProductionBarcode = require("../model/project/preProductionBarcode"); // 根据实际路径调整
const MaterialBarcodeBatch = require("../model/project/materialBarcodeBatch"); // 添加物料条码批次模型
const schedule = require("node-schedule");
const BackupService = require("../services/backupService"); // 请根据实际路径调整

// 导入K3同步相关依赖
const { 
  syncK3Data, 
  syncStockData, 
  syncPurchaseOrderData, 
  syncPickMtrlData, 
  syncDeliveryNoticeData, 
  syncInStockData, 
  syncRequisitionBillData, 
  syncOutStockData,
  SyncTask,
  syncTasks
} = require("../routes/K3asyncData"); // 请根据实际路径调整

// 定时任务: 每天凌晨3点执行生产条码过期处理
const productionBarcodeExpirationTask = async () => {
  console.log("生产条码过期定时任务开始执行"); // 添加日志记录
  schedule.scheduleJob("0 3 * * *", async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0); // 设置为昨天的开始时间

      const today = new Date();
      today.setHours(0, 0, 0, 0); // 设置为今天的开始时间

      // 查找前一天未使用的条码
      const result = await PreProductionBarcode.updateMany(
        {
          status: { $ne: "USED" }, // 状态不是已使用
          createAt: { $gte: yesterday, $lt: today }, // 创建时间在昨天
        },
        {
          status: "VOIDED", // 更新状态为已作废
          voidReason: "超时作废", // 作废原因
          voidBy: "系统", // 操作人
          voidAt: new Date(), // 作废时间
          updater: "系统", // 更新人
          updateAt: new Date(), // 更新时间
        }
      );

      console.log(`作废条码数量: ${result.nModified}`);
      
      // 查找前一天未使用的物料条码批次并作废
      const materialBatchResult = await MaterialBarcodeBatch.updateMany(
        {
          isUsed: false, // 未使用状态
          createAt: { $gte: yesterday, $lt: today }, // 创建时间在昨天
        },
        {
          isUsed: true, // 更新为已使用状态
          remark: "系统自动作废：超时未使用", // 添加备注信息
          updateBy: "系统", // 更新人
          updateAt: new Date(), // 更新时间
        }
      );
      
      console.log(`作废物料条码批次数量: ${materialBatchResult.nModified}`);
    } catch (error) {
      console.error("定时任务失败:", error);
    } finally {
      console.log("定时任务执行结束"); // 添加日志记录
    }
  });
};

// 定时任务: 每天凌晨1点执行金蝶云数据同步
const k3DataSyncTask = async () => {
  console.log("定时同步金蝶云数据开启");

  // 每天凌晨1点执行同步
  schedule.scheduleJob("0 1 * * *", async () => {
    try {
      // 计算昨天的日期范围
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);

      const filterString = [
        {
          FieldName: "FDocumentStatus",
          Compare: "StatusEqualto", 
          Value: "C",
          Left: "",
          Right: "",
          Logic: 0,
        },
        {
          FieldName: "FCreateDate",
          Compare: ">",
          Value: `${startDate.toISOString().split("T")[0]} 00:00:00`,
          Left: "",
          Right: "",
          Logic: 0,
        },
        {
          FieldName: "FCreateDate",
          Compare: "<",
          Value: `${endDate.toISOString().split("T")[0]} 23:59:59`,
          Left: "",
          Right: "",
          Logic: "0",
        },
      ];

      // 使用通用方法的表同步
      await syncK3Data("k3_BD_MATERIAL", "BD_MATERIAL", "FMATERIALID", filterString);
      await syncK3Data("k3_SAL_SaleOrder", "SAL_SaleOrder", "FID", filterString);
      await syncK3Data("k3_PRD_MO", "PRD_MO", "FID", filterString);
      
      // 使用特定方法的表同步
      const stockTask = new SyncTask("K3_BD_STOCK");
      syncTasks.set("K3_BD_STOCK", stockTask);
      await syncStockData("K3_BD_STOCK", filterString, stockTask);
      
      const purchaseOrderTask = new SyncTask("K3_PUR_PurchaseOrder");
      syncTasks.set("K3_PUR_PurchaseOrder", purchaseOrderTask);
      await syncPurchaseOrderData("K3_PUR_PurchaseOrder", filterString, purchaseOrderTask);
      
      const pickMtrlTask = new SyncTask("K3_PRD_PickMtrl");
      syncTasks.set("K3_PRD_PickMtrl", pickMtrlTask);
      await syncPickMtrlData("K3_PRD_PickMtrl", filterString, pickMtrlTask);
      
      const deliveryNoticeTask = new SyncTask("K3_SAL_DeliveryNotice");
      syncTasks.set("K3_SAL_DeliveryNotice", deliveryNoticeTask);
      await syncDeliveryNoticeData("K3_SAL_DeliveryNotice", filterString, deliveryNoticeTask);
      
      const inStockTask = new SyncTask("K3_PRD_InStock");
      syncTasks.set("K3_PRD_InStock", inStockTask);
      await syncInStockData("K3_PRD_InStock", filterString, inStockTask);
      
      const requisitionBillTask = new SyncTask("K3_PUR_RequisitionBill");
      syncTasks.set("K3_PUR_RequisitionBill", requisitionBillTask);
      await syncRequisitionBillData("K3_PUR_RequisitionBill", filterString, requisitionBillTask);
      
      const outStockTask = new SyncTask("K3_SAL_OutStock");
      syncTasks.set("K3_SAL_OutStock", outStockTask);
      await syncOutStockData("K3_SAL_OutStock", filterString, outStockTask);

      console.log("同步金蝶云数据完成");
    } catch (error) {
      console.error("执行金蝶云数据同步任务失败:", error);
    }
  });
};

// 定时任务: 每天凌晨2点执行工艺流程备份
const materialProcessFlowBackupTask = async () => {
  console.log("工艺流程备份定时任务开始执行");
  
  // 每天凌晨2点执行备份
  schedule.scheduleJob("0 2 * * *", async () => {
    try {
      await BackupService.backupMaterialProcessFlow();
      console.log("工艺流程备份完成");
    } catch (error) {
      console.error("执行 MaterialProcessFlow 备份任务失败:", error);
    }
  });
};

// 初始化所有定时任务
const initScheduleTasks = () => {
  // 延迟10秒启动定时任务，确保系统完全初始化
  setTimeout(() => {
    productionBarcodeExpirationTask(); // 启动生产条码过期处理任务
    k3DataSyncTask(); // 启动金蝶云数据同步任务
    materialProcessFlowBackupTask(); // 启动工艺流程备份任务
    console.log("所有定时任务已初始化");
  }, 10000);
};

// 执行定时任务初始化
initScheduleTasks();

module.exports = {
  productionBarcodeExpirationTask,
  k3DataSyncTask,
  materialProcessFlowBackupTask,
  initScheduleTasks
};
