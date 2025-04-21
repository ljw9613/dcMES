const express = require("express");
const router = express.Router();
const materialProcessFlow = require("../model/project/materialProcessFlow");
const productRepair = require("../model/project/productRepair");
const productionPlanWorkOrder = require("../model/project/productionPlanWorkOrder");
// 扫条码获取产品信息
router.post("/api/v1/product_repair/scanProductRepair", async (req, res) => {
  try {
    const { barcode, form } = req.body;

    let materialProcessFlowData = await materialProcessFlow
      .findOne({ barcode: barcode })
      .populate("productionPlanWorkOrderId");

    if (!materialProcessFlowData) {
      return res.status(200).json({
        code: 404,
        message: "查询不到该条码",
      });
    }
    console.log(form, "materialId");
    console.log(materialProcessFlowData, "materialProcessFlowData");

    if (
      form.materialId &&
      String(form.materialId) !== String(materialProcessFlowData.materialId)
    ) {
      return res.status(200).json({
        code: 404,
        message: `当前条码的产品是${materialProcessFlowData.materialName}(${materialProcessFlowData.materialCode}),与维修单产品不一致,无法一起创建维修单`,
      });
    }

    let productRepairData = await productRepair.findOne({
      barcode: materialProcessFlowData.barcode,
      status: "PENDING_REVIEW",
    });
    if (!!productRepairData) {
      return res.status(200).json({
        code: 404,
        message: `该条码的产品已创建,且状态为待审核,无法再次创建`,
      });
    }

    res.json({
      code: 200,
      message: "查询条码成功",
      data: materialProcessFlowData,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 根据上传的数据进行创建维修数据
router.post("/api/v1/product_repair/submitProductRepair", async (req, res) => {
  try {
    const { form, userId } = req.body;

    if (form._id) {
      // 编辑
      let formData = Object.fromEntries(
        Object.entries(form).filter(([key]) => key !== "barcodes")
      );
      delete formData.newBarcode;
      delete formData.oldBarcode;
      delete formData.barcode;

      let errors = [];
      let successRecords = [];

      // 循环处理每个条码
      for (const barcodeData of form.barcodes) {
        try {
          const updatedRepair = await productRepair.findByIdAndUpdate(
            form._id,
            {
              barcode: barcodeData.barcode,
              oldBarcode: barcodeData.oldBarcode || null,
              newBarcode: barcodeData.newBarcode || null,
              ...formData,
              updateBy: userId,
              updateTime: new Date(),
            },
            { new: true }
          );

          if (!updatedRepair) {
            errors.push(
              `条码 ${barcodeData.barcode} 更新失败：未找到要更新的维修单`
            );
            continue;
          }

          // 更新materialProcessFlow中的productStatus
          if (form.productStatus) {
            await materialProcessFlow.findOneAndUpdate(
              { barcode: barcodeData.barcode },
              {
                productStatus: form.productStatus,
                updateBy: userId,
                updateAt: new Date(),
              }
            );
          }

          successRecords.push(updatedRepair);
        } catch (error) {
          errors.push(`条码 ${barcodeData.barcode} 更新失败：${error.message}`);
        }
      }

      res.json({
        code: 200,
        message:
          successRecords.length > 0 ? "维修单更新成功" : "维修单更新失败",
        data: {
          successCount: successRecords.length,
          totalCount: form.barcodes.length,
          errors: errors,
          updatedRecords: successRecords,
        },
      });
    } else {
      //新增
      let errors = [];
      let successRecords = [];

      // 批量创建维修记录
      for (const barcode of form.barcodes) {
        try {
          const materialProcessFlowData = await materialProcessFlow
            .findOne({ barcode: barcode.barcode })
            .populate("productionPlanWorkOrderId");

          if (!materialProcessFlowData) {
            errors.push(`条码 ${barcode.barcode} 未找到相关信息`);
            continue;
          }

          let formData = Object.fromEntries(
            Object.entries(form).filter(([key]) => key !== "barcodes")
          );

          let productRepairData = await productRepair.findOne({
            barcode: materialProcessFlowData.barcode,
            status: "PENDING_REVIEW",
          });

          if (!!productRepairData) {
            errors.push(
              `条码 ${barcode.barcode} 已创建,且状态为待审核,无法再次创建`
            );
            continue;
          }

          const newRepair = new productRepair({
            barcode: barcode.barcode,
            newBarcode: barcode.newBarcode || undefined,
            oldBarcode: barcode.oldBarcode || undefined,
            productionPlanWorkOrderId:
              materialProcessFlowData.productionPlanWorkOrderId?._id,
            workOrderNo:
              materialProcessFlowData.productionPlanWorkOrderId?.workOrderNo, // 任务工单号
            saleOrderId:
              materialProcessFlowData.productionPlanWorkOrderId?.saleOrderId, // 关联销售订单
            saleOrderNo:
              materialProcessFlowData.productionPlanWorkOrderId?.saleOrderNo, // 销售单号
            productionOrderId:
              materialProcessFlowData.productionPlanWorkOrderId
                ?.productionOrderId, // 关联生产订单
            productionOrderNo:
              materialProcessFlowData.productionPlanWorkOrderId
                ?.productionOrderNo, // 生产单号
            businessType: materialProcessFlowData.businessType, // 业务类型
            repairPerson: userId, // 维修人
            repairTime: new Date(), // 维修时间
            createBy: userId,
            updateBy: userId,
            productStatus: form.productStatus || "REPAIRING", // 默认为维修中
            ...formData,
          });

          // 更新materialProcessFlow中的productStatus
          await materialProcessFlow.findOneAndUpdate(
            { barcode: barcode.barcode },
            {
              productStatus:
                form.solution == "报废" ? "SCRAP" : "REPAIRING", // 默认为维修中
              updateBy: userId,
              updateAt: new Date(),
            }
          );

          successRecords.push(newRepair);
        } catch (error) {
          errors.push(`条码 ${barcode.barcode} 创建失败: ${error.message}`);
        }
      }

      // 保存成功的记录
      if (successRecords.length > 0) {
        for (const record of successRecords) {
          try {
            await record.save();
          } catch (error) {
            errors.push(`条码 ${record.barcode} 保存失败: ${error.message}`);
            // 从成功记录中移除保存失败的记录
            successRecords = successRecords.filter(
              (r) => r.barcode !== record.barcode
            );
          }
        }
      }
      console.log(successRecords, "successRecords");
      console.log(errors, "errors");
      console.log(form, "form");
      console.log(userId, "userId");

      res.json({
        code: 200,
        message:
          successRecords.length > 0 ? "维修单创建成功" : "维修单创建失败",
        data: {
          successCount: successRecords.length,
          totalCount: form.barcodes.length,
          errors: errors,
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 审核维修记录API
router.post("/api/v1/product_repair/reviewRepair", async (req, res) => {
  try {
    const { repairId, repairResult, adverseEffect, userId } = req.body;
    
    // 查找维修记录
    const repairRecord = await productRepair.findOne({ _id: repairId });
    
    if (!repairRecord) {
      return res.status(200).json({
        code: 404,
        message: "未找到维修记录",
      });
    }
    
    if (repairRecord.status === "REVIEWED") {
      return res.status(200).json({
        code: 400,
        message: "该维修记录已审核",
      });
    }
    
    if (repairRecord.status === "VOIDED") {
      return res.status(200).json({
        code: 400,
        message: "该维修记录已作废",
      });
    }
    
    // 更新维修记录
    const updateData = {
      repairResult,
      adverseEffect,
      status: "REVIEWED",
      reviewTime: new Date(),
      reviewer: userId,
      updateBy: userId,
      updateAt: new Date(),
    };
    
    await productRepair.findByIdAndUpdate(repairId, updateData);
    
    // 检查是否是报废处理方案
    if (repairRecord.solution === "报废") {
      // 更新物料流程状态为报废
      await materialProcessFlow.findOneAndUpdate(
        { barcode: repairRecord.barcode },
        {
          productStatus: "SCRAP",
          updateBy: userId,
          updateAt: new Date(),
        }
      );
      
      // 如果有工单信息，更新工单报废数量
      if (repairRecord.productionPlanWorkOrderId) {
        const workOrder = await productionPlanWorkOrder.findById(repairRecord.productionPlanWorkOrderId);
        
        if (workOrder) {
          // 检查条码是否已经在报废列表中
          const existingScrapItem = workOrder.scrapProductBarcodeList.find(
            item => item.barcode === repairRecord.barcode
          );
          
          if (!existingScrapItem) {
            // 更新工单报废数量和报废条码列表
            await productionPlanWorkOrder.findByIdAndUpdate(
              repairRecord.productionPlanWorkOrderId,
              {
                $inc: { scrapQuantity: 1 },
                $push: {
                  scrapProductBarcodeList: {
                    barcode: repairRecord.barcode,
                    scrapTime: new Date(),
                  },
                },
              }
            );
          }
        }
      }
    }
    
    res.json({
      code: 200,
      message: "审核成功",
    });
  } catch (error) {
    console.error("审核失败:", error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

// 批量审核维修记录API
router.post("/api/v1/product_repair/batchReviewRepair", async (req, res) => {
  try {
    const { repairIds, repairResult, adverseEffect, userId } = req.body;
    
    if (!repairIds || !Array.isArray(repairIds) || repairIds.length === 0) {
      return res.status(200).json({
        code: 400,
        message: "请选择要审核的记录",
      });
    }
    
    // 更新数据
    const updateData = {
      repairResult,
      adverseEffect,
      status: "REVIEWED",
      reviewTime: new Date(),
      reviewer: userId,
      updateBy: userId,
      updateAt: new Date(),
    };
    
    // 查找所有需要审核的记录
    const repairRecords = await productRepair.find({
      _id: { $in: repairIds },
      status: "PENDING_REVIEW",
    });
    
    // 更新所有记录
    await productRepair.updateMany(
      { _id: { $in: repairIds }, status: "PENDING_REVIEW" },
      updateData
    );
    
    // 处理报废的记录
    const scrapRepairs = repairRecords.filter(record => record.solution === "报废");
    
    for (const record of scrapRepairs) {
      // 更新物料流程状态为报废
      await materialProcessFlow.findOneAndUpdate(
        { barcode: record.barcode },
        {
          productStatus: "SCRAP",
          updateBy: userId,
          updateAt: new Date(),
        }
      );
      
      // 如果有工单信息，更新工单报废数量
      if (record.productionPlanWorkOrderId) {
        const workOrder = await productionPlanWorkOrder.findById(record.productionPlanWorkOrderId);
        
        if (workOrder) {
          // 检查条码是否已经在报废列表中
          const existingScrapItem = workOrder.scrapProductBarcodeList.find(
            item => item.barcode === record.barcode
          );
          
          if (!existingScrapItem) {
            // 更新工单报废数量和报废条码列表
            await productionPlanWorkOrder.findByIdAndUpdate(
              record.productionPlanWorkOrderId,
              {
                $inc: { scrapQuantity: 1 },
                $push: {
                  scrapProductBarcodeList: {
                    barcode: record.barcode,
                    scrapTime: new Date(),
                  },
                },
              }
            );
          }
        }
      }
    }
    
    res.json({
      code: 200,
      message: "批量审核成功",
      data: {
        updatedCount: repairRecords.length,
        scrapCount: scrapRepairs.length,
      },
    });
  } catch (error) {
    console.error("批量审核失败:", error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;
