const express = require("express");
const router = express.Router();
const k3Models = require("../model/k3/k3Model");
const modelConfig = require("../model/k3/model.json");
const { k3cMethod } = require("./k3cMethod");
const K3Material = require("../model/k3/k3_BD_MATERIAL");
const Craft = require("../model/project/craft");
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const ProductDiNum = require("../model/project/ProductDiNum");
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

// 查找重复的物料数据
router.get("/check-duplicate-materials", async (req, res) => {
  try {
    // 1. 查找所有重复的 FMATERIALID
    const duplicateMaterials = await K3Material.aggregate(
      [
        {
          $group: {
            _id: "$FMATERIALID",
            count: { $sum: 1 },
            records: {
              $push: {
                _id: "$_id",
                FMATERIALID: "$FMATERIALID",
                FName: "$FName",
                FNumber: "$FNumber",
                FCreateDate: "$FCreateDate",
                FModifyDate: "$FModifyDate",
                // 添加类型信息
                valueType: { $type: "$FMATERIALID" },
              },
            },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
        {
          $project: {
            FMATERIALID: "$_id",
            count: 1,
            records: 1,
            // 检查组内是否存在不同类型
            hasMultipleTypes: {
              $gt: [{ $size: { $setUnion: "$records.valueType" } }, 1],
            },
          },
        },
        {
          $sort: {
            hasMultipleTypes: -1, // 优先显示类型不一致的记录
            count: -1, // 其次按重复数量排序
          },
        },
      ],
      { allowDiskUse: true }
    );

    // 2. 对于每组重复的物料，检查其在其他表中的引用
    const result = [];
    for (const group of duplicateMaterials) {
      const materialIds = group.records.map((record) => record._id);

      // 检查在 craft 表中的引用
      const craftRefs = await Craft.find({
        materialId: { $in: materialIds },
      }).select("craftCode craftName");

      // 检查在 materialProcessFlow 表中的引用
      const processFlowRefs = await MaterialProcessFlow.find({
        materialId: { $in: materialIds },
      }).select("barcode status");

      //检查processMaterials表中是否引用
      const processMaterialsRefs = await processMaterials
        .find({
          materialId: { $in: materialIds },
        })
        .select("materialId");

      result.push({
        FMATERIALID: group.FMATERIALID,
        duplicateCount: group.count,
        hasMultipleTypes: group.hasMultipleTypes,
        typeInfo: {
          types: [...new Set(group.records.map((r) => r.valueType))],
          summary: group.records.reduce((acc, curr) => {
            acc[curr.valueType] = (acc[curr.valueType] || 0) + 1;
            return acc;
          }, {}),
        },
        materials: group.records,
        references: {
          craftCount: craftRefs.length,
          craftRefs: craftRefs,
          processFlowCount: processFlowRefs.length,
          processFlowRefs: processFlowRefs,
          processMaterialsCount: processMaterialsRefs.length,
          processMaterialsRefs: processMaterialsRefs,
        },
      });
    }

    res.json({
      code: 200,
      success: true,
      data: {
        totalDuplicateGroups: result.length,
        typeMismatchGroups: result.filter((r) => r.hasMultipleTypes).length,
        details: result,
      },
    });
  } catch (error) {
    console.error("查询重复物料失败:", error);
    res.status(500).json({
      code: 500,
      success: false,
      message: "查询重复物料失败",
      error: error.message,
    });
  }
});

// 转换FMATERIALID类型的接口
router.post("/convert-material-id-type", async (req, res) => {
  try {
    // 创建备份集合
    const backupCollectionName = `k3_BD_MATERIAL_backup_${Date.now()}`;
    console.log(`\n开始创建备份集合: ${backupCollectionName}`);
    await K3Material.collection
      .aggregate([{ $out: backupCollectionName }])
      .toArray();
    console.log(`备份创建完成: ${backupCollectionName}\n`);

    // 分页处理参数
    const batchSize = 1000;
    let skip = 0;
    let successCount = 0;
    let errorCount = 0;
    let errorRecords = [];
    const startTime = Date.now();

    // 获取总记录数
    const totalCount = await K3Material.countDocuments();
    console.log(`开始转换 ${totalCount} 条记录的FMATERIALID类型...`);

    // 分批处理
    while (true) {
      const materials = await K3Material.find({}).skip(skip).limit(batchSize);

      if (materials.length === 0) break;

      console.log(
        `\n正在处理第 ${skip + 1} 到 ${skip + materials.length} 条记录...`
      );

      for (const material of materials) {
        try {
          const numericValue = Number(material.FMATERIALID);

          if (!isNaN(numericValue)) {
            await K3Material.updateOne(
              { _id: material._id },
              { $set: { FMATERIALID: numericValue } }
            );
            successCount++;
          } else {
            errorCount++;
            errorRecords.push({
              _id: material._id,
              FMATERIALID: material.FMATERIALID,
              FNumber: material.FNumber,
              error: "无法转换为数字",
            });
          }
        } catch (error) {
          errorCount++;
          errorRecords.push({
            _id: material._id,
            FMATERIALID: material.FMATERIALID,
            FNumber: material.FNumber,
            error: error.message,
          });
        }
      }

      skip += batchSize;

      // 打印当前进度
      const progress = ((skip / totalCount) * 100).toFixed(2);
      console.log(`当前进度: ${progress}%`);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    res.json({
      code: 200,
      success: true,
      data: {
        backupCollection: backupCollectionName,
        totalProcessed: totalCount,
        successCount,
        errorCount,
        errorRecords,
        executionTime: `${totalTime}秒`,
      },
      message: `转换完成。成功: ${successCount}, 失败: ${errorCount}, 用时: ${totalTime}秒`,
    });
  } catch (error) {
    console.error("\n转换FMATERIALID类型失败:", error);
    res.status(500).json({
      code: 500,
      success: false,
      message: "转换FMATERIALID类型失败",
      error: error.message,
    });
  }
});

// 处理重复物料数据
router.post("/handle-duplicate-materials", async (req, res) => {
  try {
    // 1. 查找所有重复的 FMATERIALID
    const duplicateMaterials = await K3Material.aggregate(
      [
        {
          $group: {
            _id: "$FMATERIALID",
            count: { $sum: 1 },
            records: {
              $push: {
                _id: "$_id",
                FMATERIALID: "$FMATERIALID",
                FNumber: "$FNumber",
                FModifyDate: "$FModifyDate",
              },
            },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ],
      { allowDiskUse: true }
    );

    const processResults = {
      totalGroups: duplicateMaterials.length,
      processedGroups: 0,
      updatedReferences: {
        craft: 0,
        materialProcessFlow: 0,
        materialProcessFlowNodes: 0,
        processMaterials: 0,
      },
      deletedRecords: 0,
      errors: [],
    };

    // 2. 处理每组重复记录
    for (const group of duplicateMaterials) {
      try {
        // 按修改时间排序,保留最新的记录
        const sortedRecords = group.records.sort(
          (a, b) => new Date(b.FModifyDate) - new Date(a.FModifyDate)
        );
        //并且主键的类型是number
        const keepRecord = sortedRecords.find(
          (r) => typeof r.FMATERIALID === "number"
        );
        const deleteRecords = sortedRecords.slice(1); // 要删除的记录
        const deleteIds = deleteRecords.map((r) => r._id);

        // 3. 更新其他表中的引用
        // 更新 craft 表
        const craftResult = await Craft.updateMany(
          { materialId: { $in: deleteIds } },
          { $set: { materialId: keepRecord._id } }
        );
        processResults.updatedReferences.craft += craftResult.modifiedCount;

        // 更新 materialProcessFlow 表主字段
        const processFlowResult = await MaterialProcessFlow.updateMany(
          { materialId: { $in: deleteIds } },
          { $set: { materialId: keepRecord._id } }
        );
        processResults.updatedReferences.materialProcessFlow +=
          processFlowResult.modifiedCount;

        // 更新 materialProcessFlow 表中 processNodes 数组中的引用
        const processFlowNodesResult = await MaterialProcessFlow.updateMany(
          { "processNodes.materialId": { $in: deleteIds } },
          {
            $set: {
              "processNodes.$[node].materialId": keepRecord._id,
            },
          },
          {
            arrayFilters: [{ "node.materialId": { $in: deleteIds } }],
            multi: true,
          }
        );

        processResults.updatedReferences.materialProcessFlowNodes +=
          processFlowNodesResult.modifiedCount;

        // 更新 processMaterials 表
        const processMaterialsResult = await processMaterials.updateMany(
          { materialId: { $in: deleteIds } },
          { $set: { materialId: keepRecord._id } }
        );
        processResults.updatedReferences.processMaterials +=
          processMaterialsResult.modifiedCount;

        //更新ProductDiNum 表
        const productDiNumResult = await ProductDiNum.updateMany(
          { productId: { $in: deleteIds } },
          { $set: { productId: keepRecord._id } }
        );
        processResults.updatedReferences.productDiNum +=
          productDiNumResult.modifiedCount;

        // 4. 删除重复记录
        const deleteResult = await K3Material.deleteMany({
          _id: { $in: deleteIds },
        });
        processResults.deletedRecords += deleteResult.deletedCount;
        processResults.processedGroups++;

        console.log(
          `处理完成组 ${processResults.processedGroups}/${duplicateMaterials.length}:`,
          {
            FMATERIALID: group._id,
            保留记录: keepRecord.FNumber,
            删除记录数: deleteIds.length,
            更新引用: {
              craft: craftResult.modifiedCount,
              materialProcessFlow: processFlowResult.modifiedCount,
              materialProcessFlowNodes: processFlowNodesResult.modifiedCount,
              processMaterials: processMaterialsResult.modifiedCount,
              productDiNum: productDiNumResult.modifiedCount,
            },
          }
        );
      } catch (error) {
        console.error(`处理组 ${group._id} 失败:`, error);
        processResults.errors.push({
          FMATERIALID: group._id,
          error: error.message,
        });
      }
    }

    res.json({
      code: 200,
      success: true,
      data: {
        summary: {
          totalDuplicateGroups: processResults.totalGroups,
          processedGroups: processResults.processedGroups,
          totalDeletedRecords: processResults.deletedRecords,
          updatedReferences: processResults.updatedReferences,
        },
        errors: processResults.errors,
      },
      message: `处理完成。成功处理 ${processResults.processedGroups} 组重复记录，删除 ${processResults.deletedRecords} 条重复数据`,
    });
  } catch (error) {
    console.error("处理重复物料失败:", error);
    res.status(500).json({
      code: 500,
      success: false,
      message: "处理重复物料失败",
      error: error.message,
    });
  }
});

module.exports = router;
