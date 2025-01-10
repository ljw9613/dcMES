const express = require("express");
const router = express.Router();
const materialProcessFlow = require("../model/project/materialProcessFlow");
const productRepair = require("../model/project/productRepair");
// 扫条码获取产品信息
router.post("/api/v1/product_repair/scanProductRepair", async (req, res) => {
  try {
    const {
      barcode,
      form
    } = req.body;

   let materialProcessFlowData =  await materialProcessFlow.findOne({barcode:barcode}).populate('productionPlanWorkOrderId')
    
    if (!materialProcessFlowData) {
      return res.status(200).json({
        code: 404,
        message: "查询不到该条码",
      });
    }
console.log(form,'materialId');
console.log(materialProcessFlowData,'materialProcessFlowData');

    if(form.materialId&&form.materialId!==materialProcessFlowData.materialId){
      return res.status(200).json({
        code: 404,
        message: `该条码的产品是${materialProcessFlowData.materialName}(${materialProcessFlowData.materialCode}),无法一起创建维修单`,
      });
    }

    let productRepairData = await productRepair.findOne({
      materialId:materialProcessFlowData.materialId,
      status:'PENDING_REVIEW'
    })
    if(!!productRepairData){
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
    
    if(form._id){
      // 编辑
      let formData = Object.fromEntries(
        Object.entries(form).filter(([key]) => key !== 'barcodes')
      );
      const updatedRepair = await productRepair.findByIdAndUpdate(
        form._id,
        {
          barcode:form.barcodes[form.barcodes.length-1],
          ...formData,
          updateBy: userId,
          updateTime: new Date()
        },
        { new: true }
      );

      if (!updatedRepair) {
        return res.status(404).json({
          code: 404,
          message: "未找到要更新的维修单"
        });
      }

      res.json({
        code: 200,
        message: "维修单更新成功",
        data: updatedRepair
      });
    } else {
      //新增
    // 批量创建维修记录
    const createPromises = form.barcodes.map(async (barcode) => {
      const materialProcessFlowData = await materialProcessFlow
        .findOne({ barcode })
        .populate('productionPlanWorkOrderId');
      
      if (!materialProcessFlowData) {
        throw new Error(`条码 ${barcode} 未找到相关信息`);
      }
      let formData = Object.fromEntries(
        Object.entries(form).filter(([key]) => key !== 'barcodes')
      );
      console.log('formData',formData)
      console.log('barcode',barcode)
      return new productRepair({
        barcode,
        ...formData,
        createBy: userId,
        updateBy: userId
      });
    });

    const createdRepairs = await Promise.all(createPromises);
    await productRepair.insertMany(createdRepairs);

    res.json({
      code: 200,
      message: "维修单创建成功",
      data: createdRepairs
    });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
});



module.exports = router;