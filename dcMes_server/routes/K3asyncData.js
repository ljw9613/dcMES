const express = require("express");
const router = express.Router();
const k3Models = require("../model/k3/k3Model");
const modelConfig = require("../model/k3/model.json");
const { k3cMethod } = require("./k3cMethod");

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
      throw new Error(`未找到模型: ${formId}`);
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

    console.log("🚀 ~ syncK3Data ~ fieldKeys:", fieldKeys);

    let allResults = [];
    let startRow = 0;
    const pageSize = 10000;
    let hasMoreData = true;

    // 添加进度统计变量
    let totalProcessed = 0;
    const startTime = Date.now();
    console.log("🚀 ~ syncK3Data ~ filterString:", filterString);
    // 使用循环进行分页查询
    while (hasMoreData) {
      console.log("🚀 ~ syncK3Data ~ hasMoreData:", hasMoreData);
      console.log("🚀 ~ syncK3Data ~ startRow:", startRow);
      console.log("🚀 ~ syncK3Data ~ pageSize:", pageSize);
      console.log("🚀 ~ syncK3Data ~ filterString:", filterString);
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
        // console.log("🚀 ~ syncK3Data ~ responseData:", responseData);
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
      //   transformedData = transformedData.slice(0, 1000);

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
              const query = { [primaryKey]: item[primaryKey] };
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

// 同步生产订单数据
router.post("/sync/PRD_MO", async (req, res) => {
  try {
    const FilterString = req.body.FilterString;
    const modelName = "k3_PRD_MO";

    // 检查是否有正在进行的任务
    if (syncTasks.has(modelName)) {
      const existingTask = syncTasks.get(modelName);
      if (existingTask.status === "running") {
        return res.json({
          code: 200,
          success: true,
          message: "同步任务正在进行中",
          taskStatus: existingTask.getStatus(),
        });
      }
    }

    syncK3Data(modelName, "PRD_MO", "FID", FilterString);
    res.json({
      code: 200,
      success: true,
      message: "同步任务已启动",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 同步物料数据
router.post("/sync/BD_MATERIAL", async (req, res) => {
  try {
    const FilterString = req.body.FilterString;
    const modelName = "k3_BD_MATERIAL";

    // 检查是否有正在进行的任务
    if (syncTasks.has(modelName)) {
      const existingTask = syncTasks.get(modelName);
      if (existingTask.status === "running") {
        return res.json({
          code: 200,
          success: true,
          message: "同步任务正在进行中",
          taskStatus: existingTask.getStatus(),
        });
      }
    }

    syncK3Data(modelName, "BD_MATERIAL", "FMATERIALID", FilterString);
    res.json({
      code: 200,
      success: true,
      message: "同步任务已启动",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 同步销售订单数据
router.post("/sync/SAL_SaleOrder", async (req, res) => {
  try {
    const FilterString = req.body.FilterString;
    const modelName = "k3_SAL_SaleOrder";

    // 检查是否有正在进行的任务
    if (syncTasks.has(modelName)) {
      const existingTask = syncTasks.get(modelName);
      if (existingTask.status === "running") {
        return res.json({
          code: 200,
          success: true,
          message: "同步任务正在进行中",
          taskStatus: existingTask.getStatus(),
        });
      }
    }

    syncK3Data(modelName, "SAL_SaleOrder", "FID", FilterString);
    res.json({
      code: 200,
      success: true,
      message: "同步任务已启动",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 同步所有数据的路由
router.post("/sync/all", async (req, res) => {
  try {
    const modelConfigs = [
      { modelName: "k3_PRD_MO", formId: "PRD_MO", primaryKey: "FID" },
      {
        modelName: "k3_SAL_SaleOrder",
        formId: "SAL_SaleOrder",
        primaryKey: "FID",
      },
      {
        modelName: "k3_BD_MATERIAL",
        formId: "BD_MATERIAL",
        primaryKey: "FMATERIALID",
      },
    ];

    for (const config of modelConfigs) {
      syncK3Data(config.modelName, config.formId, config.primaryKey);
    }

    res.json({
      code: 200,
      success: true,
      message: "同步任务已启动",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 添加新的路由用于查询同步状态
router.get("/sync/status/:modelName", (req, res) => {
  const { modelName } = req.params;
  const task = syncTasks.get(modelName);



  if (!task) {
    return res.json({
      code: 200,
      success: true,
      status: "no_task",
      message: "没有正在进行的同步任务",
    });
  }

  res.json({
    code: 200,
    status: "running",
    success: true,
    taskStatus: task.getStatus(),
  });
});

// 获取所有同步任务的状态
router.get("/sync/status/all", (req, res) => {
  try {
    const allTasksStatus = Array.from(syncTasks.entries()).map(
      ([modelName, task]) => ({
        modelName,
        ...task.getStatus(),
      })
    );

    res.json({
      code: 200,
      success: true,
      data: allTasksStatus,
      totalTasks: allTasksStatus.length,
      message:
        allTasksStatus.length > 0 ? "获取同步状态成功" : "当前没有同步任务",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      success: false,
      message: `获取同步状态失败: ${error.message}`,
    });
  }
});

module.exports = router;
