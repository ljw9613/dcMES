const express = require("express");
const router = express.Router();
const materialProcessFlow = require("../model/project/materialProcessFlow");
const productRepair = require("../model/project/productRepair");
const productionPlanWorkOrder = require("../model/project/productionPlanWorkOrder");
const materialPalletizing = require("../model/project/materialPalletizing");
// 添加预生产条码模型引用
const preProductionBarcode = require("../model/project/preProductionBarcode");
// 添加解绑记录模型引用
const UnbindRecord = require("../model/project/unbindRecord");
const apiLogger = require("../middleware/apiLogger");

// 使用API日志中间件，指定服务名称
router.use(apiLogger("productRepair"));

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

    // 查询条码所在托盘信息
    // 先在托盘条码列表中查找
    const palletData = await materialPalletizing.findOne({
      "palletBarcodes.barcode": barcode,
    });

    // 如果在palletBarcodes中找不到，查找boxItems中的boxBarcodes
    let boxPalletData = null;
    if (!palletData) {
      boxPalletData = await materialPalletizing.findOne({
        "boxItems.boxBarcodes.barcode": barcode,
      });
    }

    // 合并查询结果，优先使用palletData
    const targetPallet = palletData || boxPalletData;

    // 如果找到托盘，检查托盘的出入库状态
    if (targetPallet) {
      // 如果托盘已入库，禁止维修
      if (targetPallet.inWarehouseStatus === "IN_WAREHOUSE") {
        return res.status(200).json({
          code: 404,
          message: `该产品条码所在托盘(${targetPallet.palletCode})已入库，禁止维修`,
        });
      }

      // 如果托盘已出库，禁止维修
      if (targetPallet.inWarehouseStatus === "OUT_WAREHOUSE") {
        return res.status(200).json({
          code: 404,
          message: `该产品条码所在托盘(${targetPallet.palletCode})已出库，禁止维修`,
        });
      }

      // 如果托盘部分出库，需要检查该条码是否已出库
      if (targetPallet.inWarehouseStatus === "PART_OUT_WAREHOUSE") {
        let isOutWarehouse = false;

        // 检查palletBarcodes中是否有该条码且已出库
        const barcodeItem = targetPallet.palletBarcodes.find(
          (item) => item.barcode === barcode
        );
        if (barcodeItem && barcodeItem.outWarehouseStatus === "COMPLETED") {
          isOutWarehouse = true;
        }

        // 如果在palletBarcodes中未确认出库，检查boxItems中的boxBarcodes
        if (!isOutWarehouse) {
          for (const boxItem of targetPallet.boxItems) {
            const boxBarcodeItem = boxItem.boxBarcodes.find(
              (item) => item.barcode === barcode
            );
            if (boxBarcodeItem) {
              // 对于部分出库的托盘，需要更精确地判断该条码是否已出库
              // 由于我们没有boxBarcodes中单个条码的出库状态，这里需要根据实际业务逻辑判断

              // 方案：记录该条码在托盘中，告知用户需谨慎处理部分出库托盘中的产品
              return res.status(200).json({
                code: 200,
                message:
                  "查询条码成功（注意：该产品在部分出库托盘中，请确认产品实际状态）",
                data: {
                  ...materialProcessFlowData._doc,
                  inPalletWithCode: targetPallet.palletCode,
                  palletStatus: "PART_OUT_WAREHOUSE",
                  warningMessage:
                    "该产品所在托盘为部分出库状态，请确认产品是否已出库",
                },
              });
            }
          }
        }

        // 如果确认已出库，禁止维修
        if (isOutWarehouse) {
          return res.status(200).json({
            code: 404,
            message: `该产品条码已出库，禁止维修`,
          });
        }
      }
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
              productStatus: form.solution == "报废" ? "SCRAP" : "REPAIRING", // 默认为维修中
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
        code: 401,
        message: "该维修记录已审核",
      });
    }

    if (repairRecord.status === "VOIDED") {
      return res.status(200).json({
        code: 401,
        message: "该维修记录已作废",
      });
    }

    // 检查是否是报废处理方案
    if (repairRecord.solution === "报废") {
      // 检查是否存在完成的关键物料节点
      const materialFlowRecord = await materialProcessFlow.findOne({
        barcode: repairRecord.barcode,
      });

      if (materialFlowRecord) {
        // 检查流程中是否有已完成且为关键物料的节点
        const keyMaterialNodes = materialFlowRecord.processNodes.filter(
          (node) =>
            node.isKeyMaterial && node.status === "COMPLETED" && node.barcode
        );

        if (keyMaterialNodes.length > 0) {
          // 返回提示信息，包含关键物料信息
          const keyMaterialList = keyMaterialNodes.map((node) => ({
            materialName: node.materialName || "未知物料",
            materialCode: node.materialCode || "",
            barcode: node.barcode,
          }));

          return res.status(200).json({
            code: 401,
            message: "该产品存在已绑定的关键物料，请先解绑关键物料后再进行报废",
            data: {
              keyMaterials: keyMaterialList,
            },
          });
        }
      }

      // 检查产品条码是否在活跃托盘中
      const palletData = await materialPalletizing.findOne({
        "palletBarcodes.barcode": repairRecord.barcode,
        status: { $in: ["STACKING", "STACKED"] }
      });

      // 如果在palletBarcodes中找不到，查找boxItems中的boxBarcodes
      let boxPalletData = null;
      if (!palletData) {
        boxPalletData = await materialPalletizing.findOne({
          "boxItems.boxBarcodes.barcode": repairRecord.barcode,
          status: { $in: ["STACKING", "STACKED"] }
        });
      }

      // 合并查询结果，优先使用palletData
      const targetPallet = palletData || boxPalletData;

      if (targetPallet) {
        return res.status(200).json({
          code: 401,
          message: `该产品条码在活跃托盘(${targetPallet.palletCode})中，请先从托盘中解绑该产品后再进行报废审核`,
          data: {
            palletCode: targetPallet.palletCode,
            palletStatus: targetPallet.status,
            barcode: repairRecord.barcode,
            requirePalletUnbind: true,
          },
        });
      }
    }

    // 检查是否是部件更换处理方案
    if (repairRecord.solution === "COMPONENT_REPLACEMENT" || repairRecord.solution === "部件更换") {
      // 查找对应的物料流程记录
      const materialFlowRecord = await materialProcessFlow.findOne({
        barcode: repairRecord.barcode,
      });

      if (materialFlowRecord) {
        // 查找该产品的解绑记录
        const unbindRecords = await UnbindRecord.find({
          flowRecordId: materialFlowRecord._id,
          mainBarcode: repairRecord.barcode,
        }).populate('operatorId');

        if (!unbindRecords || unbindRecords.length === 0) {
          return res.status(200).json({
            code: 401,
            message: "部件更换维修单需要先进行部件解绑操作才能审核，请先解绑相关部件后再进行审核",
            data: {
              requireUnbind: true,
              barcode: repairRecord.barcode,
            },
          });
        }

        // 检查解绑记录的有效性（可选：检查解绑时间是否在维修记录创建时间之后）
        const validUnbindRecords = unbindRecords.filter(record => 
          new Date(record.operateTime) >= new Date(repairRecord.repairTime)
        );

        if (validUnbindRecords.length === 0) {
          return res.status(200).json({
            code: 401,
            message: "未找到有效的部件更换记录，请确保在创建维修单后进行了部件解绑操作",
            data: {
              requireUnbind: true,
              barcode: repairRecord.barcode,
              unbindRecordsCount: unbindRecords.length,
            },
          });
        }
      }
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

    // 处理报废逻辑
    if (repairRecord.solution === "报废") {
      // 更新物料流程状态为报废
      let materialFlowRecord = await materialProcessFlow.findOneAndUpdate(
        { barcode: repairRecord.barcode },
        {
          productStatus: "SCRAP",
          updateBy: userId,
          updateAt: new Date(),
        }
      );

      // 查找对应的预生产条码并作废 - 直接通过printBarcode查找
      try {
        // 先通过printBarcode字段查找
        let preBarcodeRecord = await preProductionBarcode.findOne({
          printBarcode: repairRecord.barcode.toString(),
        });

        console.log(preBarcodeRecord?.printBarcode, "preBarcodeRecord");

        // 如果仍未找到，尝试通过transformedBarcode字段查找
        if (!preBarcodeRecord) {
          preBarcodeRecord = await preProductionBarcode.findOne({
            transformedBarcode: repairRecord.barcode.toString(),
          });
        }

        // 如果找到对应记录，则进行作废
        if (preBarcodeRecord) {
          await preProductionBarcode.findByIdAndUpdate(preBarcodeRecord._id, {
            status: "VOIDED",
            voidReason: "产品报废维修作废",
            voidBy: userId,
            voidAt: new Date(),
            updater: userId,
            updateAt: new Date(),
          });
        }
      } catch (error) {
        console.error("作废预生产条码失败:", error);
        // 但这不影响整体流程，所以不抛出异常
      }

      // 如果有工单信息，更新工单报废数量
      if (repairRecord.productionPlanWorkOrderId) {
        const workOrder = await productionPlanWorkOrder.findById(
          repairRecord.productionPlanWorkOrderId
        );

        if (workOrder) {
          // 检查条码是否已经在报废列表中
          const existingScrapItem = workOrder.scrapProductBarcodeList.find(
            (item) => item.barcode.toString() === repairRecord.barcode.toString()
          );

          if (!existingScrapItem) {
            // 准备更新数据
            const updateWorkOrderData = {
              $inc: { scrapQuantity: 1 },
              $push: {
                scrapProductBarcodeList: {
                  barcode: repairRecord.barcode,
                  status: materialFlowRecord.status,
                  scrapTime: new Date(),
                },
              },
              updateBy: userId,
              updateAt: new Date(),
            };

            // 如果工单状态是已完成，则改为已暂停
            if (workOrder.status === "COMPLETED") {
              updateWorkOrderData.status = "PAUSED";
            }

            // 更新工单报废数量、报废条码列表和可能的状态
            await productionPlanWorkOrder.findByIdAndUpdate(
              repairRecord.productionPlanWorkOrderId,
              updateWorkOrderData
            );
          }
        }
      }
    } else if (repairResult === "QUALIFIED") {
      // 当维修结果为合格时，将产品状态更新为正常
      await materialProcessFlow.findOneAndUpdate(
        { barcode: repairRecord.barcode },
        {
          productStatus: "NORMAL",
          updateBy: userId,
          updateAt: new Date(),
        }
      );
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
        code: 401,
        message: "请选择要审核的记录",
      });
    }

    // 查找所有需要审核的记录
    const repairRecords = await productRepair.find({
      _id: { $in: repairIds },
      status: "PENDING_REVIEW",
    });

    // 筛选出报废的记录
    const scrapRepairs = repairRecords.filter(
      (record) => record.solution === "报废"
    );
    
    // 筛选出非报废的记录
    const nonScrapRepairs = repairRecords.filter(
      (record) => record.solution !== "报废"
    );

    // 检查所有报废记录的关键物料情况
    const barcodeWithKeyMaterials = [];

    for (const record of scrapRepairs) {
      // 检查是否存在完成的关键物料节点
      const materialFlowRecord = await materialProcessFlow.findOne({
        barcode: record.barcode,
      });

      if (materialFlowRecord) {
        // 检查流程中是否有已完成且为关键物料的节点
        const keyMaterialNodes = materialFlowRecord.processNodes.filter(
          (node) =>
            node.isKeyMaterial && node.status === "COMPLETED" && node.barcode
        );

        if (keyMaterialNodes.length > 0) {
          // 记录带有关键物料的条码信息
          barcodeWithKeyMaterials.push({
            barcode: record.barcode,
            keyMaterials: keyMaterialNodes.map((node) => ({
              materialName: node.materialName || "未知物料",
              materialCode: node.materialCode || "",
              barcode: node.barcode,
            })),
          });
        }
      }
    }

    // 如果存在带有关键物料的条码，返回提示信息
    if (barcodeWithKeyMaterials.length > 0) {
      return res.status(200).json({
        code: 401,
        message: "部分产品存在已绑定的关键物料，请先解绑关键物料后再进行报废",
        data: {
          barcodeWithKeyMaterials,
        },
      });
    }

    // 检查所有报废记录的托盘情况
    const barcodeInPallets = [];

    for (const record of scrapRepairs) {
      // 检查产品条码是否在活跃托盘中
      const palletData = await materialPalletizing.findOne({
        "palletBarcodes.barcode": record.barcode,
        status: { $in: ["STACKING", "STACKED"] }
      });

      // 如果在palletBarcodes中找不到，查找boxItems中的boxBarcodes
      let boxPalletData = null;
      if (!palletData) {
        boxPalletData = await materialPalletizing.findOne({
          "boxItems.boxBarcodes.barcode": record.barcode,
          status: { $in: ["STACKING", "STACKED"] }
        });
      }

      // 合并查询结果，优先使用palletData
      const targetPallet = palletData || boxPalletData;

      if (targetPallet) {
        barcodeInPallets.push({
          barcode: record.barcode,
          palletCode: targetPallet.palletCode,
          palletStatus: targetPallet.status,
        });
      }
    }

    // 如果存在在活跃托盘中的条码，返回提示信息
    if (barcodeInPallets.length > 0) {
      return res.status(200).json({
        code: 401,
        message: "部分产品条码在活跃托盘中，请先从托盘中解绑这些产品后再进行报废审核",
        data: {
          barcodeInPallets,
        },
      });
    }

    // 筛选出部件更换的记录并检查解绑记录
    const componentReplacementRepairs = repairRecords.filter(
      (record) => record.solution === "COMPONENT_REPLACEMENT" || record.solution === "部件更换"
    );

    const barcodeWithoutUnbindRecords = [];

    for (const record of componentReplacementRepairs) {
      // 查找对应的物料流程记录
      const materialFlowRecord = await materialProcessFlow.findOne({
        barcode: record.barcode,
      });

      if (materialFlowRecord) {
        // 查找该产品的解绑记录
        const unbindRecords = await UnbindRecord.find({
          flowRecordId: materialFlowRecord._id,
          mainBarcode: record.barcode,
        });

        // 检查是否存在有效的解绑记录
        const validUnbindRecords = unbindRecords.filter(unbindRecord => 
          new Date(unbindRecord.operateTime) >= new Date(record.repairTime)
        );

        if (!unbindRecords || unbindRecords.length === 0) {
          barcodeWithoutUnbindRecords.push({
            barcode: record.barcode,
            repairId: record._id,
            message: "未找到任何解绑记录"
          });
        } else if (validUnbindRecords.length === 0) {
          barcodeWithoutUnbindRecords.push({
            barcode: record.barcode,
            repairId: record._id,
            message: "未找到有效的解绑记录（解绑时间早于维修时间）",
            unbindRecordsCount: unbindRecords.length
          });
        }
      } else {
        barcodeWithoutUnbindRecords.push({
          barcode: record.barcode,
          repairId: record._id,
          message: "未找到物料流程记录"
        });
      }
    }

    // 如果存在没有解绑记录的部件更换维修单，返回提示信息
    if (barcodeWithoutUnbindRecords.length > 0) {
      return res.status(200).json({
        code: 401,
        message: "部分部件更换维修单缺少有效的解绑记录，请先进行部件解绑操作后再审核",
        data: {
          barcodeWithoutUnbindRecords,
        },
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

    // 更新所有记录
    await productRepair.updateMany(
      { _id: { $in: repairIds }, status: "PENDING_REVIEW" },
      updateData
    );

    // 处理报废的记录
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

      // 查找对应的预生产条码并作废 - 直接通过printBarcode查找
      try {
        // 先通过printBarcode字段查找
        let preBarcodeRecord = await preProductionBarcode.findOne({
          printBarcode: record.barcode.toString(),
        });

        // 如果仍未找到，尝试通过transformedBarcode字段查找
        if (!preBarcodeRecord) {
          preBarcodeRecord = await preProductionBarcode.findOne({
            transformedBarcode: record.barcode.toString(),
          });
        }

        // 如果找到对应记录，则进行作废
        if (preBarcodeRecord) {
          await preProductionBarcode.findByIdAndUpdate(preBarcodeRecord._id, {
            status: "VOIDED",
            voidReason: "产品报废维修作废",
            voidBy: userId,
            voidAt: new Date(),
            updater: userId,
            updateAt: new Date(),
          });
        }
      } catch (error) {
        console.error("作废预生产条码失败:", error);
        // 但这不影响整体流程，所以不抛出异常
      }

      // 如果有工单信息，更新工单报废数量
      if (record.productionPlanWorkOrderId) {
        const workOrder = await productionPlanWorkOrder.findById(
          record.productionPlanWorkOrderId
        );

        if (workOrder) {
          // 检查条码是否已经在报废列表中
          const existingScrapItem = workOrder.scrapProductBarcodeList.find(
            (item) => item.barcode.toString() === record.barcode.toString()
          );

          if (!existingScrapItem) {
            // 准备更新数据
            const updateWorkOrderData = {
              $inc: { scrapQuantity: 1 },
              $push: {
                scrapProductBarcodeList: {
                  barcode: record.barcode,
                  scrapTime: new Date(),
                },
              },
              updateBy: userId,
              updateAt: new Date(),
            };

            // 如果工单状态是已完成，则改为已暂停
            if (workOrder.status === "COMPLETED") {
              updateWorkOrderData.status = "PAUSED";
            }

            // 更新工单报废数量、报废条码列表和可能的状态
            await productionPlanWorkOrder.findByIdAndUpdate(
              record.productionPlanWorkOrderId,
              updateWorkOrderData
            );
          }
        }
      }
    }

    // 处理非报废且维修结果为合格的记录
    if (repairResult === "QUALIFIED" && nonScrapRepairs.length > 0) {
      // 获取所有非报废维修记录的条码
      const barcodes = nonScrapRepairs.map(record => record.barcode);
      
      // 批量更新这些条码的产品状态为正常
      await materialProcessFlow.updateMany(
        { barcode: { $in: barcodes } },
        {
          productStatus: "NORMAL",
          updateBy: userId,
          updateAt: new Date(),
        }
      );
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
