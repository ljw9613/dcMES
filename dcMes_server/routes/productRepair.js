const express = require("express");
const router = express.Router();
const materialProcessFlow = require("../model/project/materialProcessFlow");
const productRepair = require("../model/project/productRepair");
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
            errors.push(`条码 ${barcodeData.barcode} 更新失败：未找到要更新的维修单`);
            continue;
          }

          successRecords.push(updatedRepair);
        } catch (error) {
          errors.push(`条码 ${barcodeData.barcode} 更新失败：${error.message}`);
        }
      }

      res.json({
        code: 200,
        message: successRecords.length > 0 ? "维修单更新成功" : "维修单更新失败",
        data: {
          successCount: successRecords.length,
          totalCount: form.barcodes.length,
          errors: errors,
          updatedRecords: successRecords
        }
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
            errors.push(`条码 ${barcode.barcode} 已创建,且状态为待审核,无法再次创建`);
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
            ...formData,
          });

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

module.exports = router;
