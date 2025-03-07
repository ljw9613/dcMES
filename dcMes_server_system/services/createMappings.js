const mongoose = require("mongoose");
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const SaleOrderBarcodeMapping = require("../model/project/saleOrderBarcodeMapping");

async function createMappings(materialCode, saleOrderNo) {
  try {
    console.log("开始处理映射关系...");
    
    // 1. 先查询销售订单信息
    const saleOrder = await mongoose.model('k3_SAL_SaleOrder').findOne({
      FBillNo: saleOrderNo
    });
    
    if (!saleOrder) {
      console.log(`未找到销售订单号 ${saleOrderNo} 的记录`);
      return;
    }
    
    // 2. 查找所有符合条件的 material_process_flow 记录
    const processFlows = await MaterialProcessFlow.find({
      materialCode: materialCode,
      status: { $ne: "ABNORMAL" } // 排除异常的记录
    });
    
    if (!processFlows || processFlows.length === 0) {
      console.log(`未找到物料编码 ${materialCode} 的工艺流程记录`);
      return;
    }
    
    console.log(`找到 ${processFlows.length} 条工艺流程记录`);
    
    // 3. 创建映射记录
    const mappings = [];
    for (const flow of processFlows) {
      // 检查是否已存在映射
      const existingMapping = await SaleOrderBarcodeMapping.findOne({
        barcode: flow.barcode
      });
      
      if (existingMapping) {
        console.log(`条码 ${flow.barcode} 已存在映射关系，跳过`);
        continue;
      }
      
      // 创建新的映射记录
      const mapping = new SaleOrderBarcodeMapping({
        saleOrderId: saleOrder._id, // 使用查询到的销售订单ID
        saleOrderNo: saleOrderNo,
        barcode: flow.barcode,
        processFlowId: flow._id,
        materialId: flow.materialId,
        materialCode: flow.materialCode,
        materialName: flow.materialName,
        materialSpec: flow.materialSpec,
        remark:'adminMes',
        // createBy: "SYSTEM", // 根据实际情况修改
        // updateBy: "SYSTEM"
      });
      
      await mapping.save();
      mappings.push(mapping);
      
      console.log(`已创建条码 ${flow.barcode} 的映射关系`);
    }
    
    console.log(`处理完成，共创建 ${mappings.length} 条映射记录`);
    
  } catch (error) {
    console.error("处理过程中出错:", error);
  } finally {
    // 关闭数据库连接
  }
}

// 使用示例
const materialCode = "1313102190";

const saleOrderNo = "2024-NO.SN样0064";

createMappings(materialCode, saleOrderNo).then(() => {
  console.log("脚本执行完成");
});