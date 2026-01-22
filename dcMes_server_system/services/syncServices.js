// 同步任务相关服务
const express = require("express");
const router = express.Router();
const k3Models = require("../model/k3/k3Model");
const { k3cMethod } = require("../routes/k3cMethod");
const K3Material = require("../model/k3/k3_BD_MATERIAL");

const modelConfig = require("../model/k3/model.json");
const Craft = require("../model/project/craft");
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const ProductDiNum = require("../model/project/productDiNum");
const processMaterials = require("../model/project/processMaterials");

// 添加在文件顶部
const syncTasks = new Map(); // 存储同步任务的状态

// 任务状态管理类
class SyncTask {
  constructor(modelName) {
    this.modelName = modelName;
    this.status = "running";
    this.progress = 0;
    this.totalRecords = 0;
    this.processedRecords = 0;
    this.startTime = Date.now();
    this.error = null;
    this.currentProgressMessage = null;
  }

  updateProgress(processed, total) {
    this.processedRecords = processed;
    this.totalRecords = total;
    this.progress = total ? ((processed / total) * 100).toFixed(2) : 0;
  }

  complete() {
    this.status = "completed";
    this.progress = 100;
  }

  fail(error) {
    this.status = "failed";
    this.error = error.message;
  }

  getStatus() {
    return {
      modelName: this.modelName,
      status: this.status,
      progress: this.progress,
      processedRecords: this.processedRecords,
      totalRecords: this.totalRecords,
      elapsedTime: ((Date.now() - this.startTime) / 1000).toFixed(1),
      error: this.error,
    };
  }
}

// 同步K3数据到本地数据库的通用函数
async function syncK3Data(modelName, formId, primaryKey, filterString = "") {
  // 检查是否已有同步任务在进行
  if (syncTasks.has(modelName)) {
    const existingTask = syncTasks.get(modelName);
    if (existingTask.status === "running") {
      return { status: "in_progress", taskStatus: existingTask.getStatus() };
    }
  }

  // 创建新的同步任务
  const syncTask = new SyncTask(modelName);
  syncTasks.set(modelName, syncTask);

  try {
    // 获取对应的mongoose模型
    const Model = k3Models[modelName];
    if (!Model) {
      throw new Error(`未找到模型: ${modelName}`);
    }
    // 获取字段
    const k3Model = modelConfig.find((item) => item.modelName === formId);
    if (!k3Model) {
      throw new Error(`未找到模型配置: ${formId}`);
    }
    let fieldKeys = k3Model.header
      .map((item) =>
        item.entityNameconvert
          ? item.name.includes("_")
            ? item.name.replace(/_/g, ".")
            : item.name
          : item.name
      )
      .join(",");

    let allResults = [];
    let startRow = 0;
    const pageSize = 10000;
    let hasMoreData = true;

    // 添加进度统计变量
    let totalProcessed = 0;
    const startTime = Date.now();
    // 使用循环进行分页查询
    while (hasMoreData) {
      let k3Data = await k3cMethod("BillQuery", modelName, {
        FormId: formId,
        FieldKeys: fieldKeys,
        FilterString: filterString,
        OrderString: "",
        TopRowCount: 0,
        StartRow: startRow,
        Limit: pageSize,
      });
      // 修改K3错误响应检查部分
      let responseData = k3Data;
      // 处理嵌套数组的情况
      if (Array.isArray(k3Data) && k3Data.length > 0) {
        responseData = k3Data[0][0];
      }

      if (responseData.Result && responseData.Result.ResponseStatus) {
        const responseStatus = responseData.Result.ResponseStatus;
        if (!responseStatus.IsSuccess) {
          const errorMessages = responseStatus.Errors.map(
            (error) =>
              `${error.Message}${
                error.FieldName ? ` (字段: ${error.FieldName})` : ""
              }`
          ).join("; ");
          throw new Error(`K3同步失败 - ${errorMessages}`);
        }
        // 如果是错误响应，直接返回空数组继续处理
        k3Data = [];
      }

      // 打印当前批次信息
      console.log(
        `\n[${modelName}] 获取第 ${startRow / pageSize + 1} 批数据: ${
          k3Data.length
        } 条`
      );

      if (!k3Data || k3Data.length === 0) {
        hasMoreData = false;
        break;
      }

      // 修改这里：将数组数据转换为对象格式
      let transformedData = k3Data.map((item) => {
        const transformedItem = {};
        k3Model.header.forEach((field, index) => {
          transformedItem[field.name] = item[index];
        });
        return transformedItem;
      });

      // 截取transformedData前10条数据
      // transformedData = transformedData.slice(0, 10);
      // console.log(transformedData[0])
      // 批量更新逻辑
      const batchSize = 100;
      const totalBatches = Math.ceil(transformedData.length / batchSize);

      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;
        let retries = 3;
        while (retries > 0) {
          try {
            const updatePromises = batch.map((item) => {
              const query = { [primaryKey]: parseInt(item[primaryKey]) };
              return Model.findOneAndUpdate(query, item, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
              }).exec(); // 使用exec()确保返回完整的Promise
            });

            await Promise.all(updatePromises);
            totalProcessed += batch.length;

            // 计算进度和耗时
            const progress = (
              (totalProcessed / transformedData.length) *
              100
            ).toFixed(2);
            const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            // 更新任务状态
            syncTask.updateProgress(totalProcessed, transformedData.length);

            // 打印当前进度
            const progressMessage = `[${modelName}] 进度: ${progress}% (${totalProcessed}/${transformedData.length}) | 当前批次: ${currentBatch}/${totalBatches} | 已用时: ${timeElapsed}秒`;
            console.log(progressMessage);

            // 更新任务的状态信息
            syncTask.currentProgressMessage = progressMessage;

            break;
          } catch (err) {
            retries--;
            if (retries === 0) throw err;
            console.log(
              `[${modelName}] 批次${currentBatch}更新失败，剩余重试次数: ${retries}`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      allResults.push(...transformedData);
      startRow += pageSize;

      if (k3Data.length < pageSize) {
        hasMoreData = false;
      }
    }

    // 打印最终完成信息
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n[${modelName}] 同步完成!`);
    console.log(`总数据量: ${allResults.length} 条`);
    console.log(`总耗时: ${totalTime} 秒`);
    console.log(
      `平均速度: ${(allResults.length / totalTime).toFixed(1)} 条/秒\n`
    );

    // 更新同步任务状态为完成
    syncTask.complete();

    return {
      code: 200,
      success: true,
      message:
        syncTask.currentProgressMessage || `成功同步${allResults.length}条数据`,
      modelName: modelName,
      totalTime: `${totalTime}秒`,
      taskStatus: syncTask.getStatus(),
    };
  } catch (error) {
    syncTask.fail(error);
    throw error;
  }
}

// 仓库数据同步的具体实现
async function syncStockData(modelName, filterString, syncTask) {
  try {
    const K3Stock = require("../model/k3/k3_BD_STOCK");
    let startRow = 0;
    const pageSize = 100;
    let hasMoreData = true;
    let allStockNumbers = [];

    // 第一步：获取所有仓库的基本信息（主要是编号）
    console.log("\n开始获取仓库列表...");
    while (hasMoreData) {
      const response = await k3cMethod("BillQuery", "BD_STOCK", {
        FormId: "BD_STOCK",
        FieldKeys: "FStockId,FNumber,FUseOrgId",
        FilterString: filterString,
        OrderString: "",
        TopRowCount: 0,
        StartRow: startRow,
        Limit: pageSize,
      });

      if (!response || !Array.isArray(response) || response.length === 0) {
        hasMoreData = false;
        break;
      }

      // 提取仓库ID
      const numbers = response.map((item) => item[0]);
      allStockNumbers.push(...numbers);

      

      startRow += pageSize;
      console.log(`已获取 ${allStockNumbers.length} 个仓库编号`);
    }

    console.log(`\n共找到 ${allStockNumbers.length} 个仓库`);
    syncTask.updateProgress(0, allStockNumbers.length);

    // 第二步：逐个获取详细数据
    let processedCount = 0;
    const startTime = Date.now();

    for (const stockNumber of allStockNumbers) {
      try {
        // 获取详细数据
        const viewResponse = await k3cMethod("View", "BD_STOCK", {
          CreateOrgId: 0,
          Number: "",
          Id: stockNumber,
          IsSortBySeq: "false",
        });

        if (!viewResponse?.Result?.Result) {
          console.log(`警告: 仓库 ${stockNumber} 未返回有效数据`);
          continue;
        }

        const stockData = viewResponse.Result.Result;
        console.log(stockData.StockFlexItem.length);
        console.log(stockData.Name, "Name");

        // 转换数据格式
        const transformedData = {
          FStockId: stockData.Id.toString(),
          FDocumentStatus: stockData.DocumentStatus,
          FForbidStatus: stockData.ForbidStatus,
          FName: stockData.Name.find((n) => n.Key === 2052)?.Value || "",
          FNumber: stockData.Number,
          FDescription:
            stockData.Description.find((d) => d.Key === 2052)?.Value || "",
          FCreateOrgId: stockData.CreateOrgId?.Number || "",
          FUseOrgId: stockData.UseOrgId?.Number || "",
          FCreatorId: stockData.CreatorId?.UserAccount || "",
          FModifierId: stockData.ModifierId?.UserAccount || "",
          FCreateDate: stockData.CreateDate,
          FModifyDate: stockData.FModifyDate,
          FPrincipal: stockData.Principal,
          FTel: stockData.Tel,
          FAllowATPCheck: stockData.AllowATPCheck,
          FAllowMRPPlan: stockData.AllowMRPPlan,
          FIsOpenLocation: stockData.IsOpenLocation,
          FAllowLock: stockData.AllowLock,
          FAllowMinusQty: stockData.AllowMinusQty,
          FAddress: stockData.Address,
          FForbiderId: stockData.FForbiderId?.UserAccount || "",
          FForbidDate: stockData.FForbidDate,
          FSysDefault: stockData.FSysDefault,
          FAuditorId: stockData.AuditorId?.UserAccount || "",
          FAuditDate: stockData.FAuditDate,
          FGroup: stockData.FGroup,
          FStockProperty: stockData.StockProperty,
          FSupplierId: stockData.SupplierId?.Number || "",
          FCustomerId: stockData.CustomerId?.Number || "",
          FStockStatusType: stockData.StockStatusType,
          FDefStockStatusId: stockData.DefStockStatusId?.Number || "",
          FDefReceiveStatusId: stockData.DefReceiveStatusId?.Number || "",
          FTHIRDSTOCKNO: stockData.THIRDSTOCKNO,
          FAvailableAlert: stockData.AvailableAlert,
          FThirdStockType: stockData.ThirdStockType,
          FAvailablePicking: stockData.AvailablePicking,
          FSortingPriority: stockData.SortingPriority,
          FIsGYStock: stockData.IsGYStock,
          FGYStockNumber: stockData.GYStockNumber,
          FGYSynStatus: stockData.GYSynStatus,
          FNotExpQty: stockData.NotExpQty,
          FLocListFormatter: stockData.LocListFormatter,
          FDeptId: stockData.DeptId?.Number || "",
          FIsZYStock: stockData.FIsZYStock,

          // 处理仓位值集
          FStockFlexItem: stockData.StockFlexItem,
        };

        // 更新或插入数据
        await K3Stock.findOneAndUpdate(
          { FStockId: transformedData.FStockId },
          transformedData,
          { upsert: true, new: true }
        );

        processedCount++;
        syncTask.updateProgress(processedCount, allStockNumbers.length);

        // 打印进度
        const progress = (
          (processedCount / allStockNumbers.length) *
          100
        ).toFixed(2);
        const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `处理进度: ${progress}% (${processedCount}/${allStockNumbers.length}) | 已用时: ${timeElapsed}秒`
        );
      } catch (error) {
        console.error(`处理仓库 ${stockNumber} 时出错:`, error);
        continue; // 继续处理下一个仓库
      }
    }

    syncTask.complete();
    console.log("\n同步完成!");
  } catch (error) {
    console.error("同步仓库数据失败:", error);
    syncTask.fail(error);
    throw error;
  }
}

// 采购订单数据同步的具体实现
async function syncPurchaseOrderData(modelName, filterString, syncTask) {
  try {
    const K3PurchaseOrder = require("../model/k3/k3_PUR_PurchaseOrder");
    let startRow = 0;
    const pageSize = 100;
    let hasMoreData = true;
    let allOrderNumbers = [];

    // 第一步：获取所有采购订单的基本信息
    console.log("\n开始获取采购订单列表...");
    while (hasMoreData) {
      const response = await k3cMethod("BillQuery", "PUR_PurchaseOrder", {
        FormId: "PUR_PurchaseOrder",
        FieldKeys: "FBillNo",
        FilterString: filterString,
        OrderString: "",
        TopRowCount: 0,
        StartRow: startRow,
        Limit: pageSize,
      });

      if (!response || !Array.isArray(response) || response.length === 0) {
        hasMoreData = false;
        break;
      }

      // 提取订单编号
      const numbers = response.map((item) => item[0]);
      allOrderNumbers.push(...numbers);

      startRow += pageSize;
      console.log(`已获取 ${allOrderNumbers.length} 个采购订单编号`);
    }

    console.log(`\n共找到 ${allOrderNumbers.length} 个采购订单`);
    syncTask.updateProgress(0, allOrderNumbers.length);

    // 第二步：逐个获取详细数据
    let processedCount = 0;
    const startTime = Date.now();

    for (const orderNumber of allOrderNumbers) {
      try {
        // 获取详细数据
        const viewResponse = await k3cMethod("View", "PUR_PurchaseOrder", {
          CreateOrgId: 0,
          Number: orderNumber,
          Id: "",
          IsSortBySeq: "false",
        });

        if (!viewResponse?.Result?.Result) {
          console.log(`警告: 采购订单 ${orderNumber} 未返回有效数据`);
          continue;
        }

        const orderData = viewResponse.Result.Result;

        // 转换数据格式
        const transformedData = {
          // 基础信息
          FID: orderData.Id,
          FFormId: orderData.FFormId,
          FBillNo: orderData.BillNo,
          FBillTypeID: orderData.BillTypeId?.Number || "",
          FDate: orderData.Date,
          FDocumentStatus: orderData.DocumentStatus,
          FCancelStatus: orderData.CancelStatus,
          FCloseStatus: orderData.CloseStatus,
          FBusinessType: orderData.BusinessType,
          FVersionNo: orderData.VersionNo,

          // 采购组织信息
          FPurchaseOrgId: {
            Id: orderData.PurchaseOrgId?.Id,
            Number: orderData.PurchaseOrgId?.Number,
            Name: orderData.PurchaseOrgId?.Name?.[0]?.Value,
          },

          // 供应商信息
          FSupplierId: {
            Id: orderData.SupplierId?.Id,
            Number: orderData.SupplierId?.Number,
            Name: orderData.SupplierId?.Name?.[0]?.Value,
            Address: orderData.SupplierId?.SupplierLocation?.[0]?.Address,
            Contact: orderData.SupplierId?.SupplierContact?.[0]?.Mobile,
          },

          // 部门与人员信息
          FPurchaseDeptId: orderData.PurchaseDeptId?.Number,
          FPurchaserGroupId: orderData.PurchaserGroupId?.Number,
          FPurchaserId: orderData.PurchaserId?.Number,

          // 操作记录
          FCreatorId: orderData.CreatorId?.UserAccount,
          FCreateDate: orderData.CreateDate,
          FModifierId: orderData.ModifierId?.UserAccount,
          FModifyDate: orderData.ModifyDate,
          FApproverId: orderData.ApproverId?.UserAccount,
          FApproveDate: orderData.ApproveDate,
          FCancellerId: orderData.CancellerId?.UserAccount,
          FCancelDate: orderData.CancelDate,
          FCloserId: orderData.CloserId?.UserAccount,
          FCloseDate: orderData.CloseDate,

          // 财务信息
          FPOOrderFinance: {
            FSettleCurrId: orderData.POOrderFinance?.[0]?.SettleCurrId?.Number,
            FBillAmount: orderData.POOrderFinance?.[0]?.BillAmount,
            FBillTaxAmount: orderData.POOrderFinance?.[0]?.BillTaxAmount,
            FBillAllAmount: orderData.POOrderFinance?.[0]?.BillAllAmount,
            FExchangeRate: orderData.POOrderFinance?.[0]?.ExchangeRate,
            FIsIncludedTax: orderData.POOrderFinance?.[0]?.IsIncludedTax,
          },

          // 订单明细
          FPOOrderEntry: orderData.POOrderEntry?.map((entry) => ({
            FEntryID: entry.Id,
            // 物料信息
            FMaterialId: {
              Id: entry.MaterialId?.Id,
              Number: entry.MaterialId?.Number,
              Name: entry.MaterialId?.Name?.[0]?.Value,
              Specification: entry.MaterialId?.Specification?.[0]?.Value,
            },
            // 数量与单位
            FUnitId: entry.UnitId?.Number,
            FQty: entry.Qty,
            FPriceUnitId: entry.PriceUnitId?.Number,
            // 价格相关
            FPrice: entry.Price,
            FTaxPrice: entry.TaxPrice,
            FAmount: entry.Amount,
            FTaxAmount: entry.TaxAmount,
            FAllAmount: entry.AllAmount,
            FTaxRate: entry.TaxRate,
            // 收货相关
            FReceiveQty: entry.ReceiveQty,
            FStockInQty: entry.StockInQty,
            FRemainReceiveQty: entry.RemainReceiveQty,
            // 交货信息
            FDeliveryDate: entry.DeliveryDate,
            FRequireOrgId: entry.RequireOrgId?.Number,
            FReceiveOrgId: entry.ReceiveOrgId?.Number,
            // 备注
            FNote: entry.Note,

            DEMANDBILLNO: entry.DEMANDBILLNO,
            DEMANDTYPE: entry.DEMANDTYPE,
          })),
        };

        // 更新或插入数据
        await K3PurchaseOrder.findOneAndUpdate(
          { FID: transformedData.FID },
          transformedData,
          { upsert: true, new: true }
        );

        processedCount++;
        syncTask.updateProgress(processedCount, allOrderNumbers.length);

        // 打印进度
        const progress = (
          (processedCount / allOrderNumbers.length) *
          100
        ).toFixed(2);
        const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `处理进度: ${progress}% (${processedCount}/${allOrderNumbers.length}) | 已用时: ${timeElapsed}秒`
        );
      } catch (error) {
        console.error(`处理采购订单 ${orderNumber} 时出错:`, error);
        continue; // 继续处理下一个订单
      }
    }

    syncTask.complete();
    console.log("\n同步完成!");
  } catch (error) {
    console.error("同步采购订单数据失败:", error);
    syncTask.fail(error);
    throw error;
  }
}

// 生产领料单数据同步的具体实现
async function syncPickMtrlData(modelName, filterString, syncTask) {
  try {
    const K3PickMtrl = require("../model/k3/K3_PRD_PickMtrl");
    let startRow = 0;
    const pageSize = 100;
    let hasMoreData = true;
    let allPickMtrlNumbers = [];

    // 第一步：获取所有生产领料单的基本信息
    console.log("\n开始获取生产领料单列表...");
    while (hasMoreData) {
      const response = await k3cMethod("BillQuery", "PRD_PickMtrl", {
        FormId: "PRD_PickMtrl",
        FieldKeys: "FBillNo",
        FilterString: filterString,
        OrderString: "",
        TopRowCount: 0,
        StartRow: startRow,
        Limit: pageSize,
      });

      if (!response || !Array.isArray(response) || response.length === 0) {
        hasMoreData = false;
        break;
      }

      // 提取单据编号
      const numbers = response.map((item) => item[0]);
      allPickMtrlNumbers.push(...numbers);

      startRow += pageSize;
      console.log(`已获取 ${allPickMtrlNumbers.length} 个生产领料单编号`);

      if (response.length < pageSize) {
        hasMoreData = false;
      }
    }

    console.log(`\n共找到 ${allPickMtrlNumbers.length} 个生产领料单`);
    syncTask.updateProgress(0, allPickMtrlNumbers.length);

    // 第二步：逐个获取详细数据
    let processedCount = 0;
    const startTime = Date.now();

    for (const billNo of allPickMtrlNumbers) {
      try {
        // 获取详细数据
        const viewResponse = await k3cMethod("View", "PRD_PickMtrl", {
          CreateOrgId: 0,
          Number: billNo,
          Id: "",
          IsSortBySeq: "false",
        });

        if (!viewResponse?.Result?.Result) {
          console.log(`警告: 生产领料单 ${billNo} 未返回有效数据`);
          continue;
        }

        const pickMtrlData = viewResponse.Result.Result;

        // 转换数据格式
        const transformedData = {
          // 基础信息
          FID: pickMtrlData.Id,
          FBillNo: pickMtrlData.BillNo,
          FDate: pickMtrlData.Date,
          FDocumentStatus: pickMtrlData.DocumentStatus,

          // 审批人信息
          FApproverId: {
            Id: pickMtrlData.ApproverId?.Id,
            Name: pickMtrlData.ApproverId?.Name,
          },
          FApproveDate: pickMtrlData.ApproveDate,

          // 创建人信息
          FCreatorId: {
            Id: pickMtrlData.CreatorId?.Id,
            Name: pickMtrlData.CreatorId?.Name,
          },
          FCreateDate: pickMtrlData.CreateDate,

          // 修改人信息
          FModifierId: {
            Id: pickMtrlData.FModifierId?.Id,
            Name: pickMtrlData.FModifierId?.Name,
          },
          FModifyDate: pickMtrlData.ModifyDate,

          // 组织信息
          FPrdOrgId: {
            Id: pickMtrlData.PrdOrgId?.Id,
            Number: pickMtrlData.PrdOrgId?.Number,
            Name: pickMtrlData.PrdOrgId?.Name?.[0]?.Value,
          },
          FStockOrgId: {
            Id: pickMtrlData.StockOrgId?.Id,
            Number: pickMtrlData.StockOrgId?.Number,
            Name: pickMtrlData.StockOrgId?.Name?.[0]?.Value,
          },

          // 单据类型
          FBillType: {
            Id: pickMtrlData.BillType?.Id,
            Number: pickMtrlData.BillType?.Number,
            Name: pickMtrlData.BillType?.Name?.[0]?.Value,
          },

          // 明细信息
          FEntity: pickMtrlData.Entity?.map((entry) => ({
            FEntryID: entry.Id,
            FSeq: entry.Seq,

            // 物料信息
            FMaterialId: {
              Id: entry.MaterialId?.Id,
              Number: entry.MaterialId?.Number,
              Name: entry.MaterialId?.Name?.[0]?.Value,
              Specification: entry.MaterialId?.Specification?.[0]?.Value,
            },

            // 仓库信息
            FStockId: {
              Id: entry.StockId?.Id,
              Number: entry.StockId?.Number,
              Name: entry.StockId?.Name?.[0]?.Value,
            },

            // 车间信息
            FWorkShopId: {
              Id: entry.WorkShopId?.Id,
              Number: entry.WorkShopId?.Number,
              Name: entry.WorkShopId?.Name?.[0]?.Value,
            },

            // 数量信息
            FAppQty: entry.AppQty,
            FActualQty: entry.ActualQty,
            FBaseActualQty: entry.BaseActualQty,

            // 单位信息
            FUnitId: {
              Id: entry.UnitId?.Id,
              Number: entry.UnitId?.Number,
              Name: entry.UnitId?.Name?.[0]?.Value,
            },

            // 基础单位信息
            FBaseUnitId: {
              Id: entry.BaseUnitId?.Id,
              Number: entry.BaseUnitId?.Number,
              Name: entry.BaseUnitId?.Name?.[0]?.Value,
            },

            // 库存单位信息
            FStockUnitId: {
              Id: entry.StockUnitId?.Id,
              Number: entry.StockUnitId?.Number,
              Name: entry.StockUnitId?.Name?.[0]?.Value,
            },

            // 来源信息
            FSrcBillNo: entry.SrcBillNo,
            FMoBillNo: entry.MoBillNo,
            FPPBomBillNo: entry.PPBomBillNo,

            // 状态
            FPickingStatus: entry.PickingStatus,
          })),
        };

        // 更新或插入数据
        await K3PickMtrl.findOneAndUpdate(
          { FID: transformedData.FID },
          transformedData,
          { upsert: true, new: true }
        );

        processedCount++;
        syncTask.updateProgress(processedCount, allPickMtrlNumbers.length);

        // 打印进度
        const progress = (
          (processedCount / allPickMtrlNumbers.length) *
          100
        ).toFixed(2);
        const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `处理进度: ${progress}% (${processedCount}/${allPickMtrlNumbers.length}) | 已用时: ${timeElapsed}秒`
        );
      } catch (error) {
        console.error(`处理生产领料单 ${billNo} 时出错:`, error);
        continue; // 继续处理下一个单据
      }
    }

    syncTask.complete();
    console.log("\n同步完成!");
  } catch (error) {
    console.error("同步生产领料单数据失败:", error);
    syncTask.fail(error);
    throw error;
  }
}

// 发货通知单数据同步的具体实现
async function syncDeliveryNoticeData(modelName, filterString, syncTask) {
  try {
    const K3DeliveryNotice = require("../model/k3/K3_SAL_DeliveryNotice");
    let startRow = 0;
    const pageSize = 100;
    let hasMoreData = true;
    let allDeliveryNumbers = [];

    // 第一步：获取所有发货通知单的基本信息
    console.log("\n开始获取发货通知单列表...");
    while (hasMoreData) {
      const response = await k3cMethod("BillQuery", "SAL_DELIVERYNOTICE", {
        FormId: "SAL_DELIVERYNOTICE",
        FieldKeys: "FBillNo",
        FilterString: filterString,
        OrderString: "",
        TopRowCount: 0,
        StartRow: startRow,
        Limit: pageSize,
      });

      if (!response || !Array.isArray(response) || response.length === 0) {
        hasMoreData = false;
        break;
      }

      // 提取单据编号
      const numbers = response.map((item) => item[0]);
      allDeliveryNumbers.push(...numbers);

      startRow += pageSize;
      console.log(`已获取 ${allDeliveryNumbers.length} 个发货通知单编号`);

      if (response.length < pageSize) {
        hasMoreData = false;
      }
    }

    console.log(`\n共找到 ${allDeliveryNumbers.length} 个发货通知单`);
    syncTask.updateProgress(0, allDeliveryNumbers.length);

    // 第二步：逐个获取详细数据
    let processedCount = 0;
    const startTime = Date.now();

    for (const billNo of allDeliveryNumbers) {
      try {
        // 获取详细数据
        const viewResponse = await k3cMethod("View", "SAL_DELIVERYNOTICE", {
          CreateOrgId: 0,
          Number: billNo,
          Id: "",
          IsSortBySeq: "false",
        });

        if (!viewResponse?.Result?.Result) {
          console.log(`警告: 发货通知单 ${billNo} 未返回有效数据`);
          continue;
        }

        const noticeData = viewResponse.Result.Result;
        console.log(JSON.stringify(noticeData));

        // 转换数据格式
        const transformedData = {
          // 基础信息
          FID: noticeData.Id,
          FBillNo: noticeData.BillNo,
          FDate: noticeData.Date,
          FDocumentStatus: noticeData.DocumentStatus,
          FCancelStatus: noticeData.CancelStatus,

          // 组织信息
          FSaleOrgId: {
            Id: noticeData.SaleOrgId?.Id,
            Number: noticeData.SaleOrgId?.Number,
            Name: noticeData.SaleOrgId?.Name?.[0]?.Value,
          },
          FDeliveryOrgID: {
            Id: noticeData.DeliveryOrgID?.Id,
            Number: noticeData.DeliveryOrgID?.Number,
            Name: noticeData.DeliveryOrgID?.Name?.[0]?.Value,
          },

          // 客户信息
          FCustomerID: {
            Id: noticeData.CustomerID?.Id,
            Number: noticeData.CustomerID?.Number,
            Name: noticeData.CustomerID?.Name?.[0]?.Value,
          },

          // 部门人员信息
          FSaleDeptID: {
            Id: noticeData.SaleDeptID?.Id,
            Number: noticeData.SaleDeptID?.Number,
            Name: noticeData.SaleDeptID?.Name?.[0]?.Value,
          },
          FSalesManID: {
            Id: noticeData.SalesManID?.Id,
            Number: noticeData.SalesManID?.Number,
            Name: noticeData.SalesManID?.Name?.[0]?.Value,
          },

          // 收货信息
          FReceiverID: {
            Id: noticeData.ReceiverID?.Id,
            Number: noticeData.ReceiverID?.Number,
            Name: noticeData.ReceiverID?.Name?.[0]?.Value,
          },
          FReceiveAddress: noticeData.ReceiveAddress,

          // 明细信息
          FEntity: noticeData.SAL_DELIVERYNOTICEENTRY?.map((entry) => ({
            FEntryID: entry.Id,

            // 完善物料信息
            FMaterialID: {
              Id: entry.MaterialID?.Id,
              Number: entry.MaterialID?.Number,
              Name: entry.MaterialID?.Name?.[0]?.Value,
              Specification: entry.MaterialID?.Specification?.[0]?.Value,
              // 新增物料分组信息
              MaterialGroup: {
                Id: entry.MaterialID?.MaterialGroup_Id,
                Number: entry.MaterialID?.MaterialGroup?.Number,
                Name: entry.MaterialID?.MaterialGroup?.Name?.[0]?.Value,
              },
              // 新增基本信息
              MaterialBase: entry.MaterialID?.MaterialBase?.map((base) => ({
                Id: base.Id,
                ErpClsID: base.ErpClsID,
                IsInventory: base.IsInventory,
                IsSale: base.IsSale,
                BaseUnitId: {
                  Id: base.BaseUnitId?.Id,
                  Number: base.BaseUnitId?.Number,
                  Name: base.BaseUnitId?.Name?.[0]?.Value,
                },
              })),
            },

            // 完善客户物料信息
            FCustMatID: entry.CustMatID && {
              Id: entry.CustMatID?.Id,
              Number: entry.CustMatID?.Number,
              Name: entry.CustMatID?.Name?.[0]?.Value,
              MaterialId: {
                Id: entry.CustMatID?.MaterialId?.Id,
                Number: entry.CustMatID?.MaterialId?.Number,
                Name: entry.CustMatID?.MaterialId?.Name?.[0]?.Value,
              },
            },

            // 数量相关信息
            FQty: entry.Qty,
            FBaseUnitQty: entry.BaseUnitQty,
            FStockBaseQty: entry.StockBaseQty,
            FAwaitQty: entry.AwaitQty,
            FAvailableQty: entry.AvailableQty,

            // 单位信息
            FUnitID: {
              Id: entry.UnitID?.Id,
              Number: entry.UnitID?.Number,
              Name: entry.UnitID?.Name?.[0]?.Value,
            },

            // 仓库信息
            FStockID: {
              Id: entry.StockID?.Id,
              Number: entry.StockID?.Number,
              Name: entry.StockID?.Name?.[0]?.Value,
              IsOpenLocation: entry.StockID?.IsOpenLocation,
              StockProperty: entry.StockID?.StockProperty,
            },

            // 价格信息
            FPrice: entry.Price,
            FTaxPrice: entry.TaxPrice,
            FAmount: entry.Amount,
            FTaxAmount: entry.TaxAmount,
            FAllAmount: entry.AllAmount,

            // 来源信息
            FSrcType: entry.SrcType,
            FSrcBillNo: entry.SrcBillNo,
            FOrderNo: entry.OrderNo,
            FOrderSeq: entry.OrderSeq,

            // 日期信息
            FDeliveryDate: entry.DeliveryDate,
            FPlanDeliveryDate: entry.PlanDeliveryDate,

            // 税率信息
            FSALDeliveryNoticeEntryTax: entry.SAL_DELIVERYNOTICEENTRYTAX?.map(
              (tax) => ({
                FDetailID: tax.Id,
                FTaxRate: tax.TaxRate,
                FTaxAmount: tax.TaxAmount,
                FCostAmount: tax.CostAmount,
                FVAT: tax.VAT,
              })
            ),

            // 自定义字段
            FF_dcdj_khdd: entry.F_dcdj_khdd,
            FF_dcdj_Text: entry.F_dcdj_Text,
            FF_dcdj_Text1: entry.F_dcdj_Text1,
            FF_dcdj_Text2: entry.F_dcdj_Text2,
            FF_dcdj_gt: entry.F_dcdj_gt,
            FF_dcdj_bgdj: entry.F_dcdj_bgdj,
            FF_dcdj_ofislineid: entry.F_dcdj_ofislineid,
            FF_dcdj_EndbuyerPO: entry.F_dcdj_EndbuyerPO,
            FF_dcdj_CRD: entry.F_dcdj_CRD,
            FF_dcdj_ETD: entry.F_dcdj_ETD,
            FF_dcdj_shsl: entry.F_dcdj_shsl,
          })),
        };

        // 更新或插入数据
        await K3DeliveryNotice.findOneAndUpdate(
          { FID: transformedData.FID },
          transformedData,
          { upsert: true, new: true }
        );

        processedCount++;
        syncTask.updateProgress(processedCount, allDeliveryNumbers.length);

        // 打印进度
        const progress = (
          (processedCount / allDeliveryNumbers.length) *
          100
        ).toFixed(2);
        const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `处理进度: ${progress}% (${processedCount}/${allDeliveryNumbers.length}) | 已用时: ${timeElapsed}秒`
        );
      } catch (error) {
        console.error(`处理发货通知单 ${billNo} 时出错:`, error);
        continue; // 继续处理下一个单据
      }
    }

    syncTask.complete();
    console.log("\n同步完成!");
  } catch (error) {
    console.error("同步发货通知单数据失败:", error);
    syncTask.fail(error);
    throw error;
  }
}

// 生产入库单数据同步的具体实现
async function syncInStockData(modelName, filterString, syncTask) {
  try {
    const K3InStock = require("../model/k3/K3_PRD_InStock");
    let startRow = 0;
    const pageSize = 100;
    let hasMoreData = true;
    let allInStockNumbers = [];

    // 第一步：获取所有生产入库单的基本信息
    console.log("\n开始获取生产入库单列表...");
    while (hasMoreData) {
      const response = await k3cMethod("BillQuery", "PRD_INSTOCK", {
        FormId: "PRD_INSTOCK",
        FieldKeys: "FBillNo",
        FilterString: filterString,
        OrderString: "",
        TopRowCount: 0,
        StartRow: startRow,
        Limit: pageSize,
      });

      if (!response || !Array.isArray(response) || response.length === 0) {
        hasMoreData = false;
        break;
      }

      // 提取单据编号
      const numbers = response.map((item) => item[0]);
      allInStockNumbers.push(...numbers);

      startRow += pageSize;
    }

    console.log(`共获取到 ${allInStockNumbers.length} 张生产入库单`);

    // 第二步：同步每张生产入库单的详细数据
    console.log("\n开始同步生产入库单详细数据...");
    const startTime = Date.now();
    let processedCount = 0;

    for (const billNo of allInStockNumbers) {
      try {
        // 获取单据详细数据
        const response = await k3cMethod("View", "PRD_INSTOCK", {
          Number: billNo,
          FormId: "PRD_INSTOCK",
        });

        if (!response?.Result?.Result) {
          console.error(`获取生产入库单 ${billNo} 详细数据失败`);
          continue;
        }

        const data = response.Result.Result;

        // 转换数据结构
        const transformedData = {
          FID: data.Id,
          FBillNo: data.BillNo,
          FDocumentStatus: data.DocumentStatus,
          FCancelStatus: data.CancelStatus,
          FDate: data.Date,

          // 组织信息
          FPrdOrgId: {
            Id: data.PrdOrgId_Id,
            Number: data.PrdOrgId?.Number,
            MultiLanguageText: data.PrdOrgId?.MultiLanguageText,
            Name: data.PrdOrgId?.Name?.[0]?.Value,
          },
          FStockOrgId: {
            Id: data.StockOrgId_Id,
            Number: data.StockOrgId?.Number,
            Name: data.StockOrgId?.Name?.[0]?.Value,
          },

          // 类型信息
          FBillType: {
            Id: data.BillType_Id,
            Number: data.BillType?.Number,
            MultiLanguageText: data.BillType?.MultiLanguageText,
            Name: data.BillType?.Name,
          },

          // 其他基础信息
          FCurrId: {
            Id: data.CurrId_Id,
            Number: data.CurrId?.Number,
            Name: data.CurrId?.Name,
            Sysmbol: data.CurrId?.Sysmbol,
            PriceDigits: data.CurrId?.PriceDigits,
            AmountDigits: data.CurrId?.AmountDigits,
            IsShowCSymbol: data.CurrId?.IsShowCSymbol,
            FormatOrder: data.CurrId?.FormatOrder,
            RoundType: data.CurrId?.RoundType,
          },

          // 明细信息
          FEntity: data.Entity?.map((entry) => ({
            FEntryID: entry.Id,
            FMaterialId: {
              Id: entry.MaterialId?.Id,
              Number: entry.MaterialId?.Number,
              Name: entry.MaterialId?.Name,
              Specification: entry.MaterialId?.Specification,
              UseOrgId: entry.MaterialId?.UseOrgId,
              MaterialBase: entry.MaterialId?.MaterialBase,
            },
            FUnitID: {
              Id: entry.FUnitID?.Id,
              Number: entry.FUnitID?.Number,
              Name: entry.FUnitID?.Name,
              UnitGroupId: entry.FUnitID?.UnitGroupId,
              Precision: entry.FUnitID?.Precision,
              RoundType: entry.FUnitID?.RoundType,
              UNITCONVERTRATE: entry.FUnitID?.UNITCONVERTRATE,
            },
            FMustQty: entry.MustQty,
            FRealQty: entry.RealQty,
            FBaseRealQty: entry.BaseRealQty,

            // 仓储信息
            FStockId: {
              Id: entry.StockId?.Id,
              Number: entry.StockId?.Number,
              Name: entry.StockId?.Name?.[0].Value,
              IsOpenLocation: entry.StockId?.IsOpenLocation,
              StockStatusType: entry.StockId?.StockStatusType,
              DefStockStatusId: entry.StockId?.DefStockStatusId,
              LocListFormatter: entry.StockId?.LocListFormatter,
            },

            // 生产信息
            FMoBillNo: entry.MoBillNo,
            FMoId: entry.MoId,
            FMoEntryId: entry.MoEntryId,

            // 序列号信息
            FSerialSubEntity: entry.PRD_INSTOCKMTRLSERIAL,

            // 关联信息
            FEntity_Link: entry.FEntity_Link?.map((link) => ({
              FLinkId: link.Id,
              FEntity_Link_FFlowId: link.FlowId,
              FEntity_Link_FFlowLineId: link.FlowLineId,
              FEntity_Link_FRuleId: link.RuleId,
              FEntity_Link_FSTableId: link.STableId,
              FEntity_Link_FSTableName: link.STableName,
              FEntity_Link_FSBillId: link.SBillId,
              FEntity_Link_FSId: link.SId,
              FEntity_Link_FBasePrdRealQtyOld: link.BasePrdRealQtyOld,
              FEntity_Link_FBasePrdRealQty: link.BasePrdRealQty,
            })),
          })),
        };

        // 更新或插入数据
        await K3InStock.findOneAndUpdate(
          { FID: transformedData.FID },
          transformedData,
          { upsert: true, new: true }
        );

        processedCount++;
        syncTask.updateProgress(processedCount, allInStockNumbers.length);

        // 打印进度
        const progress = (
          (processedCount / allInStockNumbers.length) *
          100
        ).toFixed(2);
        const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `处理进度: ${progress}% (${processedCount}/${allInStockNumbers.length}) | 已用时: ${timeElapsed}秒`
        );
      } catch (error) {
        console.error(`处理生产入库单 ${billNo} 时出错:`, error);
        continue; // 继续处理下一个单据
      }
    }

    syncTask.complete();
    console.log("\n同步完成!");
  } catch (error) {
    console.error("同步生产入库单数据失败:", error);
    syncTask.fail(error);
    throw error;
  }
}

// 采购申请单数据同步的具体实现
async function syncRequisitionBillData(modelName, filterString, syncTask) {
  try {
    const K3RequisitionBill = require("../model/k3/K3_PUR_RequisitionBill");
    let startRow = 0;
    const pageSize = 100;
    let hasMoreData = true;
    let allBillNumbers = [];

    // 第一步：获取所有采购申请单的基本信息
    console.log("\n开始获取采购申请单列表...");
    while (hasMoreData) {
      const response = await k3cMethod("BillQuery", "PUR_Requisition", {
        FormId: "PUR_Requisition",
        FieldKeys: "FBillNo",
        FilterString: filterString,
        OrderString: "",
        TopRowCount: 0,
        StartRow: startRow,
        Limit: pageSize,
      });

      if (!response || !Array.isArray(response) || response.length === 0) {
        hasMoreData = false;
        break;
      }
      hasMoreData = false;

      // 提取单据编号
      const numbers = response.map((item) => item[0]);
      allBillNumbers.push(...numbers);

      startRow += pageSize;
      console.log(`已获取 ${allBillNumbers.length} 个采购申请单编号`);

      if (response.length < pageSize) {
        hasMoreData = false;
      }
    }

    console.log(`\n共找到 ${allBillNumbers.length} 个采购申请单`);
    syncTask.updateProgress(0, allBillNumbers.length);

    // 第二步：逐个获取详细数据
    let processedCount = 0;
    const startTime = Date.now();

    for (const billNo of allBillNumbers) {
      try {
        // 获取详细数据
        const viewResponse = await k3cMethod("View", "PUR_Requisition", {
          CreateOrgId: 0,
          Number: billNo,
          Id: "",
          IsSortBySeq: "false",
        });

        if (!viewResponse?.Result?.Result) {
          console.log(`警告: 采购申请单 ${billNo} 未返回有效数据`);
          continue;
        }

        const billData = viewResponse.Result.Result;
        console.log(JSON.stringify(billData));

        // 转换数据格式
        const transformedData = {
          // 基础信息
          FID: billData.Id,
          FBillNo: billData.BillNo,
          FDocumentStatus: billData.DocumentStatus,

          // 单据信息
          FBillTypeID: {
            FNUMBER: billData.BillTypeID?.Number,
            Name: billData.BillTypeID?.Name?.[0]?.Value,
          },
          FApplicationDate: billData.ApplicationDate,
          FRequestType: billData.RequestType,

          // 组织信息
          FApplicationOrgId: {
            FNumber: billData.ApplicationOrgId?.Number,
            Name: billData.ApplicationOrgId?.Name?.[0]?.Value,
          },
          FApplicationDeptId: {
            FNumber: billData.ApplicationDeptId?.Number,
            Name: billData.ApplicationDeptId?.Name?.[0]?.Value,
          },

          // 人员信息
          FApplicantId: billData.ApplicantId,
          FCreatorId: {
            Id: billData.CreatorId?.Id,
            Name: billData.CreatorId?.Name,
          },
          FModifierId: {
            Id: billData.ModifierId?.Id,
            Name: billData.ModifierId?.Name,
          },

          // 其他基础信息
          FCurrencyId: {
            FNumber: billData.CurrencyId?.Number,
            Name: billData.CurrencyId?.Name?.[0]?.Value,
          },
          FNote: billData.Note,
          FSrcType: billData.SrcType,
          FISPRICEEXCLUDETAX: billData.ISPRICEEXCLUDETAX,

          // 日期信息
          FCreateDate: billData.CreateDate,
          FModifyDate: billData.ModifyDate,
          FApproveDate: billData.ApproveDate,

          // 明细信息
          FEntity: billData.Entity?.map((entry) => ({
            FEntryID: entry.Id,

            // 物料信息
            FMaterialId: {
              FNumber: entry.MaterialId?.Number,
              Name: entry.MaterialId?.Name?.[0]?.Value,
              Specification: entry.MaterialId?.Specification?.[0]?.Value,
            },
            FMaterialDesc: entry.MaterialDesc,
            FAuxpropId: entry.AuxpropId,

            // 数量信息
            FReqQty: entry.ReqQty,
            FApproveQty: entry.ApproveQty,
            FBaseReqQty: entry.BaseReqQty,
            FPriceUnitQty: entry.PriceUnitQty,
            FREQSTOCKQTY: entry.REQSTOCKQTY,

            // 单位信息
            FUnitId: {
              FNumber: entry.UnitId?.Number,
              Name: entry.UnitId?.Name?.[0]?.Value,
            },
            FPriceUnitId: {
              FNumber: entry.PriceUnitId?.Number,
              Name: entry.PriceUnitId?.Name?.[0]?.Value,
            },
            FREQSTOCKUNITID: {
              FNumber: entry.REQSTOCKUNITID?.Number,
              Name: entry.REQSTOCKUNITID?.Name?.[0]?.Value,
            },

            // 组织信息
            FRequireOrgId: {
              FNumber: entry.RequireOrgId?.Number,
              Name: entry.RequireOrgId?.Name?.[0]?.Value,
            },
            FPurchaseOrgId: {
              FNumber: entry.PurchaseOrgId?.Number,
              Name: entry.PurchaseOrgId?.Name?.[0]?.Value,
            },
            FReceiveOrgId: {
              FNumber: entry.ReceiveOrgId?.Number,
              Name: entry.ReceiveOrgId?.Name?.[0]?.Value,
            },

            // 部门信息
            FPurchaseDeptId: {
              FNumber: entry.PurchaseDeptId?.Number,
              Name: entry.PurchaseDeptId?.Name?.[0]?.Value,
            },
            FReceiveDeptId: {
              FNUMBER: entry.ReceiveDeptId?.Number,
              Name: entry.ReceiveDeptId?.Name?.[0]?.Value,
            },
            FRequireDeptId: {
              FNUMBER: entry.RequireDeptId?.Number,
              Name: entry.RequireDeptId?.Name?.[0]?.Value,
            },

            // 供应商信息
            FSuggestSupplierId: {
              FNumber: entry.SuggestSupplierId?.Number,
              Name: entry.SuggestSupplierId?.Name?.[0]?.Value,
            },
            FSupplierId: {
              FNumber: entry.SupplierId?.Number,
              Name: entry.SupplierId?.Name?.[0]?.Value,
            },

            // 价格信息
            FEvaluatePrice: entry.EvaluatePrice,
            FTAXPRICE: entry.TAXPRICE,
            FTAXRATE: entry.TAXRATE,

            // 其他信息
            FLeadTime: entry.LeadTime,
            FReceiveAddress: entry.ReceiveAddress,
            FEntryNote: entry.EntryNote,
            FIsVmiBusiness: entry.IsVmiBusiness,

            // 自定义字段
            F_TFQJ_XSDD: entry.F_TFQJ_XSDD,
            F_TFQJ_cpsl: entry.F_TFQJ_cpsl,
            F_TFQJ_lowPrice: entry.F_TFQJ_lowPrice,
            F_TFQJ_CheckBox: entry.F_TFQJ_CheckBox,
          })),
        };

        // 更新或插入数据
        await K3RequisitionBill.findOneAndUpdate(
          { FID: transformedData.FID },
          transformedData,
          { upsert: true, new: true }
        );

        processedCount++;
        syncTask.updateProgress(processedCount, allBillNumbers.length);

        // 打印进度
        const progress = (
          (processedCount / allBillNumbers.length) *
          100
        ).toFixed(2);
        const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `处理进度: ${progress}% (${processedCount}/${allBillNumbers.length}) | 已用时: ${timeElapsed}秒`
        );
      } catch (error) {
        console.error(`处理采购申请单 ${billNo} 时出错:`, error);
        continue; // 继续处理下一个单据
      }
    }

    syncTask.complete();
    console.log("\n同步完成!");
  } catch (error) {
    console.error("同步采购申请单数据失败:", error);
    syncTask.fail(error);
    throw error;
  }
}

// 销售出库单数据同步的具体实现
async function syncOutStockData(modelName, filterString, syncTask) {
  try {
    const K3OutStock = require("../model/k3/K3_SAL_OutStock");
    let startRow = 0;
    const pageSize = 100;
    let hasMoreData = true;
    let allOutStockNumbers = [];

    // 第一步：获取所有销售出库单的基本信息
    console.log("\n开始获取销售出库单列表...");
    while (hasMoreData) {
      const response = await k3cMethod("BillQuery", "SAL_OUTSTOCK", {
        FormId: "SAL_OUTSTOCK",
        FieldKeys: "FBillNo",
        FilterString: filterString,
        OrderString: "",
        TopRowCount: 0,
        StartRow: startRow,
        Limit: pageSize,
      });

      if (!response || !Array.isArray(response) || response.length === 0) {
        hasMoreData = false;
        break;
      }

      // 提取单据编号
      const numbers = response.map((item) => item[0]);
      allOutStockNumbers.push(...numbers);

      startRow += pageSize;
      console.log(`已获取 ${allOutStockNumbers.length} 个销售出库单编号`);

      if (response.length < pageSize) {
        hasMoreData = false;
      }
    }

    console.log(`\n共找到 ${allOutStockNumbers.length} 个销售出库单`);
    syncTask.updateProgress(0, allOutStockNumbers.length);

    // 第二步：逐个获取详细数据
    let processedCount = 0;
    const startTime = Date.now();

    for (const billNo of allOutStockNumbers) {
      try {
        // 获取详细数据
        const viewResponse = await k3cMethod("View", "SAL_OUTSTOCK", {
          CreateOrgId: 0,
          Number: billNo,
          Id: "",
          IsSortBySeq: "false",
        });

        if (!viewResponse?.Result?.Result) {
          console.log(`警告: 销售出库单 ${billNo} 未返回有效数据`);
          continue;
        }

        const outStockData = viewResponse.Result.Result;
        // console.log(JSON.stringify(outStockData));

        // 转换数据格式
        const transformedData = {
          // 基础信息
          FID: outStockData.Id,
          FBillNo: outStockData.BillNo,
          FDate: outStockData.Date,
          FDocumentStatus: outStockData.DocumentStatus,
          FCancelStatus: outStockData.CancelStatus,

          // 组织信息
          FSaleOrgId: {
            Id: outStockData.SaleOrgId_Id,
            Number: outStockData.SaleOrgId?.Number,
            Name: outStockData.SaleOrgId?.MultiLanguageText?.[0]?.Name,
            ParentOrg: outStockData.SaleOrgId?.ParentOrg && {
              Id: outStockData.SaleOrgId.ParentOrg.Id,
              Number: outStockData.SaleOrgId.ParentOrg.Number,
              Name: outStockData.SaleOrgId.ParentOrg.MultiLanguageText?.[0]
                ?.Name,
            },
          },
          FStockOrgId: {
            Id: outStockData.StockOrgId_Id,
            Number: outStockData.StockOrgId?.Number,
            Name: outStockData.StockOrgId?.MultiLanguageText?.[0]?.Name,
          },

          // 业务伙伴信息
          FCustomerID: {
            Id: outStockData.CustomerID_Id,
            Number: outStockData.CustomerID?.Number,
            Name: outStockData.CustomerID?.MultiLanguageText?.[0]?.Name,
            TradingCurrId: outStockData.CustomerID?.TRADINGCURRID && {
              Id: outStockData.CustomerID.TRADINGCURRID.Id,
              Number: outStockData.CustomerID.TRADINGCURRID.Number,
              Name: outStockData.CustomerID.TRADINGCURRID.Name?.[0]?.Value,
            },
          },
          FCarrierID: {
            Id: outStockData.CarrierID_Id,
            Number: outStockData.CarrierID?.Number,
            Name: outStockData.CarrierID?.MultiLanguageText?.[0]?.Name,
          },

          // 部门与人员信息
          FDeliveryDeptID: {
            Id: outStockData.DeliveryDeptID_Id,
            Number: outStockData.DeliveryDeptID?.Number,
            Name: outStockData.DeliveryDeptID?.MultiLanguageText?.[0]?.Name,
          },
          FSaleDeptID: {
            Id: outStockData.SaleDeptID_Id,
            Number: outStockData.SaleDeptID?.Number,
            Name: outStockData.SaleDeptID?.MultiLanguageText?.[0]?.Name,
          },
          FStockerGroupID: {
            Id: outStockData.StockerGroupID_Id,
            Number: outStockData.StockerGroupID?.Number,
            Name: outStockData.StockerGroupID?.MultiLanguageText?.[0]?.Name,
          },
          FStockerID: {
            Id: outStockData.StockerID_Id,
            Number: outStockData.StockerID?.Number,
            Name: outStockData.StockerID?.MultiLanguageText?.[0]?.Name,
          },
          FSalesGroupID: {
            Id: outStockData.SalesGroupID_Id,
            Number: outStockData.SalesGroupID?.Number,
            Name: outStockData.SalesGroupID?.MultiLanguageText?.[0]?.Name,
          },
          FSalesManID: {
            Id: outStockData.SalesManID_Id,
            Number: outStockData.SalesManID?.Number,
            Name: outStockData.SalesManID?.MultiLanguageText?.[0]?.Name,
          },

          // 单据类型
          FBillTypeID: {
            Id: outStockData.BillTypeID_Id,
            Number: outStockData.BillTypeID?.Number,
            Name: outStockData.BillTypeID?.MultiLanguageText?.[0]?.Name,
          },

          // 其他信息
          FNote: outStockData.Note,
          FCarriageNO: outStockData.CarriageNO,

          // 操作记录
          FCreatorId: {
            Id: outStockData.CreatorId_Id,
            Name: outStockData.CreatorId?.Name,
          },
          FCreateDate: outStockData.CreateDate,
          FModifierId: {
            Id: outStockData.ModifierId_Id,
            Name: outStockData.ModifierId?.Name,
          },
          FModifyDate: outStockData.ModifyDate,
          FApproverID: {
            Id: outStockData.ApproverID_Id,
            Name: outStockData.ApproverID?.Name,
          },
          FApproveDate: outStockData.ApproveDate,

          // 自定义字段
          F_TFQJ_cgdh: outStockData.F_TFQJ_cgdh,
          F_TFQJ_ppspo: outStockData.F_TFQJ_ppspo,
          F_TFQJ_khpo: outStockData.F_TFQJ_khpo,
          F_TFQJ_ddzt1: outStockData.F_TFQJ_ddzt1,
          F_TFQJ_kdrq: outStockData.F_TFQJ_kdrq,
          F_TFQJ_zhpoh: outStockData.F_TFQJ_zhpoh,
          F_TFQJ_zhpoyy: outStockData.F_TFQJ_zhpoyy,

          // 财务信息
          FSALOutStockFin: outStockData.SAL_OUTSTOCKFIN?.map((fin) => ({
            FEntryID: fin.Id,
            FSettleOrgID: {
              Id: fin.SettleOrgID_Id,
              Number: fin.SettleOrgID?.Number,
              Name: fin.SettleOrgID?.Name?.[0]?.Value,
            },
            FLocalCurrID: {
              Id: fin.LocalCurrID_Id,
              Number: fin.LocalCurrID?.Number,
              Name: fin.LocalCurrID?.Name?.[0]?.Value,
              Symbol: fin.LocalCurrID?.Symbol,
              PriceDigits: fin.LocalCurrID?.PriceDigits,
              AmountDigits: fin.LocalCurrID?.AmountDigits,
            },
            FExchangeRate: fin.ExchangeRate,
            FBillAmount: fin.BillAmount,
            FBillAmount_LC: fin.BillAmount_LC,
            FBillTaxAmount: fin.BillTaxAmount,
            FBillAllAmount: fin.BillAllAmount,
            FIsIncludedTax: fin.IsIncludedTax,
          })),

          // 明细信息
          FEntity: outStockData.SAL_OUTSTOCKENTRY?.map((entry) => ({
            FENTRYID: entry.Id,
            FSeq: entry.Seq,
            FRowType: entry.RowType,

            // 物料信息
            FMaterialID: {
              Id: entry.MaterialID_Id,
              Number: entry.MaterialID?.Number,
              Name: entry.MaterialID?.Name?.[0]?.Value,
              Specification: entry.MaterialID?.Specification?.[0]?.Value,
              UseOrgId: {
                Id: entry.MaterialID?.UseOrgId?.Id,
                Number: entry.MaterialID?.UseOrgId?.Number,
                Name: entry.MaterialID?.UseOrgId?.Name?.[0]?.Value,
              },
              MaterialGroup: entry.MaterialID?.MaterialGroup && {
                Id: entry.MaterialID.MaterialGroup.Id,
                Number: entry.MaterialID.MaterialGroup.Number,
                Name: entry.MaterialID.MaterialGroup.Name?.[0]?.Value,
              },
              MaterialBase: entry.MaterialID?.MaterialBase?.map((base) => ({
                Id: base.Id,
                ErpClsID: base.ErpClsID,
                IsInventory: base.IsInventory,
                IsSale: base.IsSale,
                BaseUnitId: base.BaseUnitId && {
                  Id: base.BaseUnitId.Id,
                  Number: base.BaseUnitId.Number,
                  Name: base.BaseUnitId.Name?.[0]?.Value,
                },
              })),
            },

            // 客户物料信息
            FCustMatID: entry.CustMatID && {
              Id: entry.CustMatID_Id,
              Number: entry.CustMatID?.Number,
              Name: entry.CustMatID?.Name?.[0]?.Value,
              MaterialId: {
                Id: entry.CustMatID?.MaterialId?.Id,
                Number: entry.CustMatID?.MaterialId?.Number,
                Name: entry.CustMatID?.MaterialId?.Name?.[0]?.Value,
              },
            },

            // 数量信息
            FMustQty: entry.MustQty,
            FRealQty: entry.RealQty,
            FInventoryQty: entry.InventoryQty,
            FBaseUnitQty: entry.BaseUnitQty,
            FAuxUnitQty: entry.AuxUnitQty,
            FActQty: entry.ActQty,
            FSALUNITQTY: entry.SALUNITQTY,
            FSALBASEQTY: entry.SALBASEQTY,
            FPRICEBASEQTY: entry.PRICEBASEQTY,

            // 单位信息
            FUnitID: {
              Id: entry.UnitID_Id,
              Number: entry.UnitID?.Number,
              Name: entry.UnitID?.Name?.[0]?.Value,
              Precision: entry.UnitID?.Precision,
              RoundType: entry.UnitID?.RoundType,
            },

            // 仓储信息
            FStockID: {
              Id: entry.StockID_Id,
              Number: entry.StockID?.Number,
              Name: entry.StockID?.Name?.[0]?.Value,
              IsOpenLocation: entry.StockID?.IsOpenLocation,
              StockProperty: entry.StockID?.StockProperty,
            },
            FStockLocID: {
              FF100001: entry.StockLocID?.FF100001,
              FF100002: entry.StockLocID?.FF100002,
              FF100003: entry.StockLocID?.FF100003,
            },

            // 价格相关
            FPrice: entry.Price,
            FTaxPrice: entry.TaxPrice,
            FAmount: entry.Amount,
            FTaxAmount: entry.TaxAmount,
            FAllAmount: entry.AllAmount,
            FTaxRate: entry.TaxRate,

            // 来源信息
            FSrcType: entry.SrcType,
            FSrcBillNo: entry.SrcBillNo,
            FSoorDerno: entry.SoorDerno,

            // 其他信息
            FIsFree: entry.IsFree,
            FLot: entry.Lot,
            FProduceDate: entry.ProduceDate,
            FExpiryDate: entry.ExpiryDate,
            FMtoNo: entry.MtoNo,
            FEntrynote: entry.Entrynote,
            FProjectNo: entry.ProjectNo,
            FOUTCONTROL: entry.OUTCONTROL,

            // 自定义字段
            F_dcdj_Text: entry.F_dcdj_Text,
            F_dcdj_Text1: entry.F_dcdj_Text1,
            F_TFQJ_ofislineid: entry.F_TFQJ_ofislineid,
            F_TFQJ_EndbuyerPO: entry.F_TFQJ_EndbuyerPO,
            F_TFQJ_CRD: entry.F_TFQJ_CRD,
            F_TFQJ_ETD: entry.F_TFQJ_ETD,
            F_TFQJ_jhdd: entry.F_TFQJ_jhdd && {
              Id: entry.F_TFQJ_jhdd.Id,
              Number: entry.F_TFQJ_jhdd.Number,
              Value: entry.F_TFQJ_jhdd.Value,
            },

            // 关联信息
            FEntity_Link: entry.FEntity_Link?.map((link) => ({
              FLinkId: link.Id,
              FFlowId: link.FlowId,
              FFlowLineId: link.FlowLineId,
              FRuleId: link.RuleId,
              FSTableName: link.STableName,
              FSBillId: link.SBillId,
              FSId: link.SId,
              FBaseUnitQty: link.BaseUnitQty,
            })),

            // 序列号子表
            FSerialSubEntity: entry.SerialSubEntity?.map((serial) => ({
              FDetailID: serial.Id,
              FSerialNo: serial.SerialNo,
              FSerialId: serial.SerialId,
              FSerialNote: serial.SerialNote,
              FSN: serial.SN,
              FIMEI1: serial.IMEI1,
              FIMEI2: serial.IMEI2,
              FMEID: serial.MEID,
              FPushReturnNotice: serial.PushReturnNotice,
            })),
          })),
        };
        console.log(JSON.stringify(transformedData));

        // 更新或插入数据
        await K3OutStock.findOneAndUpdate(
          { FID: transformedData.FID },
          transformedData,
          { upsert: true, new: true }
        );

        processedCount++;
        syncTask.updateProgress(processedCount, allOutStockNumbers.length);

        // 打印进度
        const progress = (
          (processedCount / allOutStockNumbers.length) *
          100
        ).toFixed(2);
        const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `处理进度: ${progress}% (${processedCount}/${allOutStockNumbers.length}) | 已用时: ${timeElapsed}秒`
        );
      } catch (error) {
        console.error(`处理销售出库单 ${billNo} 时出错:`, error);
        continue; // 继续处理下一个单据
      }
    }

    syncTask.complete();
    console.log("\n同步完成!");
  } catch (error) {
    console.error("同步销售出库单数据失败:", error);
    syncTask.fail(error);
    throw error;
  }
}

// 导出所有函数和类
module.exports = {
  SyncTask,
  syncTasks,
  syncK3Data,
  syncStockData,
  syncPurchaseOrderData,
  syncPickMtrlData,
  syncDeliveryNoticeData,
  syncInStockData,
  syncRequisitionBillData,
  syncOutStockData,
};
