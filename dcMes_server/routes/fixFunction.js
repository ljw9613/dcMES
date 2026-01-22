// 导入模型
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const ProductionPlanWorkOrder = require("../model/project/productionPlanWorkOrder");
const MaterialPalletizing = require("../model/project/materialPalletizing"); // 假设托盘模型在此路径
const Excel = require("exceljs"); // 需要先安装: npm install exceljs
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// 确保输出目录存在
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// 新增的按工单分析函数
async function analyzeByWorkOrder(workOrderNo) {
  try {
    // 创建工作簿和工作表
    const workbook = new Excel.Workbook();
    const summarySheet = workbook.addWorksheet("汇总");
    const palletNotInWorkOrderSheet =
      workbook.addWorksheet("托盘中存在但工单中不存在的条码");
    const workOrderNotInPalletSheet =
      workbook.addWorksheet("工单中存在但托盘中不存在的条码");

    // 设置汇总表格式
    summarySheet.columns = [
      { header: "项目", key: "item", width: 30 },
      { header: "数量", key: "count", width: 15 },
      { header: "备注", key: "remark", width: 30 },
    ];

    // 设置托盘中存在但工单中不存在的条码表格式
    palletNotInWorkOrderSheet.columns = [
      { header: "条码", key: "barcode", width: 20 },
      { header: "实际关联工单", key: "actualWorkOrder", width: 20 },
    ];

    // 设置工单中存在但托盘中不存在的条码表格式
    workOrderNotInPalletSheet.columns = [
      { header: "条码", key: "barcode", width: 20 },
      { header: "所在托盘", key: "palletCode", width: 20 },
      { header: "托盘关联工单", key: "palletWorkOrder", width: 20 },
    ];

    // 1. 通过工单号查找工单信息
    const workOrder = await ProductionPlanWorkOrder.findOne({
      workOrderNo,
    }).lean();
    if (!workOrder) {
      console.log(`未找到工单: ${workOrderNo}`);
      return;
    }

    const workOrderId = workOrder._id.toString();
    console.log(`工单信息: ${workOrderNo} (ID: ${workOrderId})`);

    // 添加工单信息到汇总表
    summarySheet.addRow({ item: "工单号", count: workOrderNo });
    summarySheet.addRow({ item: "工单ID", count: workOrderId });

    // 2. 查找该工单对应的所有托盘
    const pallets = await MaterialPalletizing.find({
      productionPlanWorkOrderId: workOrderId,
    }).exec();

    console.log(`工单 ${workOrderNo} 对应的托盘数量: ${pallets.length}`);
    summarySheet.addRow({ item: "关联托盘数量", count: pallets.length });

    if (pallets.length === 0) {
      console.log("该工单没有关联托盘!");

      // 保存工作簿
      const outputDir = path.join(__dirname, "../output/barcode_analysis");
      ensureDirectoryExists(outputDir);
      const outputFile = path.join(
        outputDir,
        `工单${workOrderNo}条码分析_${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.xlsx`
      );
      await workbook.xlsx.writeFile(outputFile);
      console.log(`分析结果已保存至: ${outputFile}`);
      return;
    }

    // 3. 提取托盘包含的所有条码
    const palletBarcodes = new Set();
    const palletMap = {}; // 用于记录条码所属托盘
    let totalBarcodeCount = 0;

    for (const pallet of pallets) {
      console.log(`托盘: ${pallet.palletCode}`);
      const barcodes = pallet.palletBarcodes || [];
      totalBarcodeCount += barcodes.length;

      // 修复：正确处理托盘条码对象
      for (const barcodeObj of barcodes) {
        if (barcodeObj && barcodeObj.barcode) {
          palletBarcodes.add(barcodeObj.barcode);
          // 记录条码所在托盘
          if (!palletMap[barcodeObj.barcode]) {
            palletMap[barcodeObj.barcode] = pallet.palletCode;
          }
        }
      }
    }

    console.log(`托盘中包含的条码总数: ${totalBarcodeCount}`);
    console.log(`托盘中不重复条码数: ${palletBarcodes.size}`);

    // 添加托盘条码信息到汇总表
    summarySheet.addRow({ item: "托盘中条码总数", count: totalBarcodeCount });
    summarySheet.addRow({
      item: "托盘中不重复条码数",
      count: palletBarcodes.size,
    });

    // 4. 使用工单ID直接查询条码数据
    const workOrderBarcodes = await MaterialProcessFlow.find({
      productionPlanWorkOrderId: workOrderId,
      status: "COMPLETED",
    }).lean();

    const workOrderBarcodeSet = new Set();
    for (const record of workOrderBarcodes) {
      workOrderBarcodeSet.add(record.barcode);
    }

    console.log(`工单直接关联的条码数量: ${workOrderBarcodes.length}`);
    summarySheet.addRow({
      item: "工单直接关联的条码数量",
      count: workOrderBarcodes.length,
    });

    // 5. 比对差异
    console.log("\n===== 条码差异分析 =====");

    // 5.1 在托盘中但不在工单中的条码
    const inPalletNotInWorkOrder = [...palletBarcodes].filter(
      (barcode) => !workOrderBarcodeSet.has(barcode)
    );

    console.log(
      `在托盘中但不在工单关联中的条码数量: ${inPalletNotInWorkOrder.length}`
    );
    summarySheet.addRow({
      item: "托盘中存在但工单中不存在的条码数量",
      count: inPalletNotInWorkOrder.length,
    });

    if (inPalletNotInWorkOrder.length > 0) {
      console.log("\n这些条码在托盘中，但未直接关联到工单:");

      // 查找这些条码实际关联的工单
      const missingBarcodeRecords = await MaterialProcessFlow.find({
        barcode: { $in: inPalletNotInWorkOrder },
      }).lean();

      // 创建条码到工单的映射
      const barcodeToWorkOrderMap = {};
      for (const record of missingBarcodeRecords) {
        let workOrderNo = "无工单";
        if (record.productionPlanWorkOrderId) {
          const actualWorkOrder = await ProductionPlanWorkOrder.findById(
            record.productionPlanWorkOrderId
          ).lean();
          if (actualWorkOrder) workOrderNo = actualWorkOrder.workOrderNo;
        }
        barcodeToWorkOrderMap[record.barcode] = workOrderNo;
      }

      // 添加到专门的工作表
      for (const barcode of inPalletNotInWorkOrder) {
        palletNotInWorkOrderSheet.addRow({
          barcode: barcode,
          actualWorkOrder: barcodeToWorkOrderMap[barcode] || "未找到工单",
        });
      }
    }

    // 5.2 在工单中但不在托盘中的条码
    const inWorkOrderNotInPallet = [...workOrderBarcodeSet].filter(
      (barcode) => !palletBarcodes.has(barcode)
    );

    console.log(
      `\n在工单关联中但不在托盘中的条码数量: ${inWorkOrderNotInPallet.length}`
    );
    summarySheet.addRow({
      item: "工单中存在但托盘中不存在的条码数量",
      count: inWorkOrderNotInPallet.length,
    });

    if (inWorkOrderNotInPallet.length > 0) {
      console.log("这些条码直接关联到工单，但不在工单的托盘中:");
      console.log(`条码列表: ${inWorkOrderNotInPallet.join(", ")}`);

      // 查找这些条码是否存在于其他托盘中
      const otherPallets = await MaterialPalletizing.find({
        "palletBarcodes.barcode": { $in: inWorkOrderNotInPallet },
        productionPlanWorkOrderId: { $ne: workOrderId },
      }).lean();

      if (otherPallets.length > 0) {
        console.log("\n这些条码存在于其他工单的托盘中:");

        // 创建条码到托盘和工单的映射
        const barcodeLocations = {};

        for (const pallet of otherPallets) {
          const otherWorkOrder = await ProductionPlanWorkOrder.findById(
            pallet.productionPlanWorkOrderId
          ).lean();
          const otherWorkOrderNo = otherWorkOrder
            ? otherWorkOrder.workOrderNo
            : "未知工单";

          const matchedBarcodes = pallet.palletBarcodes
            ? pallet.palletBarcodes
                .filter(
                  (b) => b.barcode && inWorkOrderNotInPallet.includes(b.barcode)
                )
                .map((b) => b.barcode)
            : [];

          for (const barcode of matchedBarcodes) {
            barcodeLocations[barcode] = {
              palletCode: pallet.palletCode,
              workOrderNo: otherWorkOrderNo,
            };
          }
        }

        // 添加到专门的工作表
        for (const barcode of inWorkOrderNotInPallet) {
          const location = barcodeLocations[barcode] || {
            palletCode: "未找到",
            workOrderNo: "未找到",
          };
          workOrderNotInPalletSheet.addRow({
            barcode: barcode,
            palletCode: location.palletCode,
            palletWorkOrder: location.workOrderNo,
          });
        }
      }
    }

    console.log("\n===== 分析完成 =====");

    // 应用样式
    [
      summarySheet,
      palletNotInWorkOrderSheet,
      workOrderNotInPalletSheet,
    ].forEach((sheet) => {
      // 设置表头样式
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      };
    });

    // 保存工作簿
    const outputDir = path.join(__dirname, "../output/barcode_analysis");
    ensureDirectoryExists(outputDir);
    const outputFile = path.join(
      outputDir,
      `工单${workOrderNo}条码分析_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.xlsx`
    );
    await workbook.xlsx.writeFile(outputFile);
    console.log(`分析结果已保存至: ${outputFile}`);
  } catch (error) {
    console.error("分析过程中出错:", error);
  }
}

// 修改主函数，增加命令行参数支持
async function runAnalysis() {
  // 获取命令行参数
  // 如果提供了工单号参数，则按工单分析
  // const workOrderNo = "P202502241740363143817";
  // const workOrderNo = "P202502241740363797824";
  //   const workOrderNo = "P202502241740363948378";
  //   const workOrderNo = "P202502241740363867363";
  //   const workOrderNo = "P202502221740221473287";

  console.log(`开始分析工单: ${workOrderNo}`);
  await analyzeByWorkOrder(workOrderNo);
}

// 延迟执行，确保数据库连接已建立
// setTimeout(() => {
// runAnalysis();
// }, 5000);

// 分析工单托盘中条码状态的函数
async function analyzeWorkOrderBarcodeStatus(workOrderNo) {
  try {
    // 创建工作簿和工作表
    const workbook = new Excel.Workbook();
    const summarySheet = workbook.addWorksheet("汇总");
    const incompleteBarcodesSheet = workbook.addWorksheet("未完成条码详情");

    // 设置汇总表格式
    summarySheet.columns = [
      { header: "项目", key: "item", width: 30 },
      { header: "数量", key: "count", width: 15 },
      { header: "备注", key: "remark", width: 30 },
    ];

    // 设置未完成条码详情表格式
    incompleteBarcodesSheet.columns = [
      { header: "条码", key: "barcode", width: 20 },
      { header: "当前状态", key: "status", width: 15 },
      { header: "所在托盘", key: "palletCode", width: 20 },
      { header: "物料编码", key: "materialCode", width: 20 },
      { header: "物料名称", key: "materialName", width: 30 },
      { header: "开始时间", key: "startTime", width: 20 },
      { header: "进度", key: "progress", width: 10 },
    ];

    // 1. 通过工单号查找工单信息
    const workOrder = await ProductionPlanWorkOrder.findOne({
      workOrderNo,
    }).lean();
    if (!workOrder) {
      console.log(`未找到工单: ${workOrderNo}`);
      return;
    }

    const workOrderId = workOrder._id.toString();
    console.log(`工单信息: ${workOrderNo} (ID: ${workOrderId})`);

    // 添加工单信息到汇总表
    summarySheet.addRow({ item: "工单号", count: workOrderNo });
    summarySheet.addRow({ item: "工单ID", count: workOrderId });

    // 2. 查找该工单对应的所有托盘
    const pallets = await MaterialPalletizing.find({
      productionPlanWorkOrderId: workOrderId,
    }).exec();

    console.log(`工单 ${workOrderNo} 对应的托盘数量: ${pallets.length}`);
    summarySheet.addRow({ item: "关联托盘数量", count: pallets.length });

    if (pallets.length === 0) {
      console.log("该工单没有关联托盘!");
      summarySheet.addRow({
        item: "状态",
        count: "无关联托盘",
        remark: "无法分析条码状态",
      });

      // 保存工作簿
      const outputDir = path.join(__dirname, "../output/barcode_status");
      ensureDirectoryExists(outputDir);
      const outputFile = path.join(
        outputDir,
        `工单${workOrderNo}条码状态分析_${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.xlsx`
      );
      await workbook.xlsx.writeFile(outputFile);
      console.log(`分析结果已保存至: ${outputFile}`);
      return;
    }

    // 3. 提取托盘包含的所有条码
    const palletBarcodes = new Set();
    const barcodeTopalletMap = {}; // 记录条码所属托盘
    let totalBarcodeCount = 0;

    for (const pallet of pallets) {
      console.log(`托盘: ${pallet.palletCode}`);
      const barcodes = pallet.palletBarcodes || [];
      totalBarcodeCount += barcodes.length;

      for (const barcodeObj of barcodes) {
        if (barcodeObj && barcodeObj.barcode) {
          palletBarcodes.add(barcodeObj.barcode);
          // 记录条码所在托盘
          barcodeTopalletMap[barcodeObj.barcode] = pallet.palletCode;
        }
      }
    }

    console.log(`托盘中包含的条码总数: ${totalBarcodeCount}`);
    console.log(`托盘中不重复条码数: ${palletBarcodes.size}`);

    // 添加托盘条码信息到汇总表
    summarySheet.addRow({ item: "托盘中条码总数", count: totalBarcodeCount });
    summarySheet.addRow({
      item: "托盘中不重复条码数",
      count: palletBarcodes.size,
    });

    // 4. 查询所有条码的工艺流程状态
    const barcodeArray = [...palletBarcodes];
    const barcodeRecords = await MaterialProcessFlow.find({
      barcode: { $in: barcodeArray },
    }).lean();

    // 创建条码到记录的映射
    const barcodeToRecordMap = {};
    for (const record of barcodeRecords) {
      barcodeToRecordMap[record.barcode] = record;
    }

    // 5. 筛选出状态不是"COMPLETED"的条码
    const incompleteBarcodes = [];
    const notFoundBarcodes = [];

    for (const barcode of barcodeArray) {
      const record = barcodeToRecordMap[barcode];
      if (!record) {
        notFoundBarcodes.push(barcode);
        continue;
      }

      if (record.status !== "COMPLETED") {
        incompleteBarcodes.push({
          barcode: barcode,
          status: record.status,
          palletCode: barcodeTopalletMap[barcode],
          materialCode: record.materialCode,
          materialName: record.materialName,
          startTime: record.startTime,
          progress: record.progress,
        });
      }
    }

    console.log(`未找到工艺记录的条码数量: ${notFoundBarcodes.length}`);
    console.log(`状态不是"COMPLETED"的条码数量: ${incompleteBarcodes.length}`);

    // 添加统计信息到汇总表
    summarySheet.addRow({
      item: "未找到工艺记录的条码数量",
      count: notFoundBarcodes.length,
    });
    summarySheet.addRow({
      item: "状态不是'COMPLETED'的条码数量",
      count: incompleteBarcodes.length,
    });

    // 将未完成的条码信息添加到详情表
    for (const item of incompleteBarcodes) {
      incompleteBarcodesSheet.addRow({
        barcode: item.barcode,
        status: item.status,
        palletCode: item.palletCode,
        materialCode: item.materialCode,
        materialName: item.materialName,
        startTime: item.startTime
          ? new Date(item.startTime).toLocaleString()
          : "未开始",
        progress: item.progress ? `${item.progress}%` : "0%",
      });
    }

    // 如果有未找到记录的条码，增加专门的工作表
    if (notFoundBarcodes.length > 0) {
      const notFoundSheet = workbook.addWorksheet("未找到工艺记录的条码");
      notFoundSheet.columns = [
        { header: "条码", key: "barcode", width: 20 },
        { header: "所在托盘", key: "palletCode", width: 20 },
      ];

      for (const barcode of notFoundBarcodes) {
        notFoundSheet.addRow({
          barcode: barcode,
          palletCode: barcodeTopalletMap[barcode],
        });
      }

      // 设置表头样式
      notFoundSheet.getRow(1).font = { bold: true };
      notFoundSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      };
    }

    // 应用样式
    [summarySheet, incompleteBarcodesSheet].forEach((sheet) => {
      // 设置表头样式
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      };
    });

    // 保存工作簿
    const outputDir = path.join(__dirname, "../output/barcode_status");
    ensureDirectoryExists(outputDir);
    const outputFile = path.join(
      outputDir,
      `工单${workOrderNo}条码状态分析_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.xlsx`
    );
    await workbook.xlsx.writeFile(outputFile);
    console.log(`分析结果已保存至: ${outputFile}`);

    // 返回统计数据
    return {
      totalBarcodes: palletBarcodes.size,
      incompleteBarcodes: incompleteBarcodes.length,
      notFoundBarcodes: notFoundBarcodes.length,
    };
  } catch (error) {
    console.error("分析过程中出错:", error);
  }
}

// 修改主函数，增加命令行参数支持
async function runStatusAnalysis() {
  // 这里可以设置要分析的工单号，或者从命令行参数获取
  //   P202502241740363143817
  // P202502241740363797824
  // P202502241740363867363
  // P202502241740363914995
  // P202502241740363948378
  const workOrderNo = "P202502241740363143817" || "请在此处设置工单号";
  console.log(`开始分析工单条码状态: ${workOrderNo}`);
  const result = await analyzeWorkOrderBarcodeStatus(workOrderNo);
  if (result) {
    console.log("\n===== 分析结果摘要 =====");
    console.log(`总条码数: ${result.totalBarcodes}`);
    console.log(`未完成状态条码: ${result.incompleteBarcodes}`);
    console.log(`未找到工艺记录条码: ${result.notFoundBarcodes}`);
  }
}

// // 延迟执行，确保数据库连接已建立
// setTimeout(() => {
//   runStatusAnalysis();
// }, 5000);

// 分析托盘条码与工单一致性的函数
async function analyzeBarcodeWorkOrderConsistency(workOrderNo) {
  try {
    // 创建工作簿和工作表
    const workbook = new Excel.Workbook();
    const summarySheet = workbook.addWorksheet("汇总");
    const inconsistentBarcodesSheet = workbook.addWorksheet("工单不一致条码");

    // 设置汇总表格式
    summarySheet.columns = [
      { header: "项目", key: "item", width: 30 },
      { header: "数量", key: "count", width: 15 },
      { header: "备注", key: "remark", width: 30 },
    ];

    // 设置工单不一致条码表格式
    inconsistentBarcodesSheet.columns = [
      { header: "条码", key: "barcode", width: 20 },
      { header: "所在托盘", key: "palletCode", width: 20 },
      { header: "托盘工单号", key: "palletWorkOrderNo", width: 20 },
      { header: "实际工单号", key: "actualWorkOrderNo", width: 20 },
      { header: "实际客户PO号", key: "actualCustPO", width: 20 },
      { header: "差异说明", key: "diffDescription", width: 30 },
    ];

    // 1. 通过工单号查找工单信息
    const workOrder = await ProductionPlanWorkOrder.findOne({
      workOrderNo,
    }).lean();
    if (!workOrder) {
      console.log(`未找到工单: ${workOrderNo}`);
      return;
    }

    const workOrderId = workOrder._id.toString();
    console.log(`工单信息: ${workOrderNo} (ID: ${workOrderId})`);

    // 添加工单信息到汇总表
    summarySheet.addRow({ item: "工单号", count: workOrderNo });
    summarySheet.addRow({ item: "工单ID", count: workOrderId });
    summarySheet.addRow({ item: "客户PO号", count: workOrder.custPO || "无" });

    // 2. 查找该工单对应的所有托盘
    const pallets = await MaterialPalletizing.find({
      productionPlanWorkOrderId: workOrderId,
    }).lean();

    console.log(`工单 ${workOrderNo} 对应的托盘数量: ${pallets.length}`);
    summarySheet.addRow({ item: "关联托盘数量", count: pallets.length });

    if (pallets.length === 0) {
      console.log("该工单没有关联托盘!");

      // 保存工作簿
      const outputDir = path.join(__dirname, "../output/workorder_consistency");
      ensureDirectoryExists(outputDir);
      const outputFile = path.join(
        outputDir,
        `工单${workOrderNo}条码一致性分析_${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.xlsx`
      );
      await workbook.xlsx.writeFile(outputFile);
      console.log(`分析结果已保存至: ${outputFile}`);
      return;
    }

    // 3. 提取托盘包含的所有条码
    const allBarcodes = [];
    let totalBarcodeCount = 0;

    for (const pallet of pallets) {
      const barcodes = pallet.palletBarcodes || [];
      totalBarcodeCount += barcodes.length;

      for (const barcodeObj of barcodes) {
        if (barcodeObj && barcodeObj.barcode) {
          allBarcodes.push({
            barcode: barcodeObj.barcode,
            palletCode: pallet.palletCode,
            palletWorkOrderNo: workOrderNo,
            palletWorkOrderId: workOrderId,
          });
        }
      }
    }

    console.log(`托盘中包含的条码总数: ${totalBarcodeCount}`);
    summarySheet.addRow({ item: "托盘中条码总数", count: totalBarcodeCount });

    // 4. 查询每个条码实际关联的工单
    const inconsistentBarcodes = [];

    for (const barcodeInfo of allBarcodes) {
      // 查询条码关联的工艺流程记录
      const processFlow = await MaterialProcessFlow.findOne({
        barcode: barcodeInfo.barcode,
        status: "COMPLETED",
      }).lean();

      if (!processFlow) {
        console.log(`未找到条码 ${barcodeInfo.barcode} 的工艺流程记录或未完成`);
        continue;
      }

      // 检查条码关联的工单ID是否与托盘工单ID一致
      if (
        processFlow.productionPlanWorkOrderId &&
        processFlow.productionPlanWorkOrderId.toString() !==
          barcodeInfo.palletWorkOrderId
      ) {
        // 查询条码实际关联的工单信息
        const actualWorkOrder = await ProductionPlanWorkOrder.findById(
          processFlow.productionPlanWorkOrderId
        ).lean();

        if (actualWorkOrder) {
          inconsistentBarcodes.push({
            barcode: barcodeInfo.barcode,
            palletCode: barcodeInfo.palletCode,
            palletWorkOrderNo: barcodeInfo.palletWorkOrderNo,
            actualWorkOrderNo: actualWorkOrder.workOrderNo,
            actualWorkOrderId: actualWorkOrder._id.toString(),
            actualCustPO: actualWorkOrder.custPO || "无",
            diffDescription: "条码工单与托盘工单不一致",
          });
        }
      }
    }

    console.log(`工单不一致的条码数量: ${inconsistentBarcodes.length}`);
    summarySheet.addRow({
      item: "工单一致的条码数量",
      count: totalBarcodeCount - inconsistentBarcodes.length,
    });
    summarySheet.addRow({
      item: "工单不一致的条码数量",
      count: inconsistentBarcodes.length,
    });

    // 将不一致的条码信息添加到详情表
    for (const item of inconsistentBarcodes) {
      inconsistentBarcodesSheet.addRow({
        barcode: item.barcode,
        palletCode: item.palletCode,
        palletWorkOrderNo: item.palletWorkOrderNo,
        actualWorkOrderNo: item.actualWorkOrderNo,
        actualCustPO: item.actualCustPO,
        diffDescription: item.diffDescription,
      });
    }

    // 应用样式
    [summarySheet, inconsistentBarcodesSheet].forEach((sheet) => {
      // 设置表头样式
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      };
    });

    // 保存工作簿
    const outputDir = path.join(__dirname, "../output/workorder_consistency");
    ensureDirectoryExists(outputDir);
    const outputFile = path.join(
      outputDir,
      `工单${workOrderNo}条码一致性分析_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.xlsx`
    );
    await workbook.xlsx.writeFile(outputFile);
    console.log(`分析结果已保存至: ${outputFile}`);

    return {
      totalBarcodes: totalBarcodeCount,
      inconsistentBarcodes: inconsistentBarcodes.length,
    };
  } catch (error) {
    console.error("分析过程中出错:", error);
  }
}

// 执行工单条码一致性分析的函数
async function runConsistencyAnalysis() {
  const workOrderNo = "P202502241740363143817"; // 在此设置要分析的工单号
  console.log(`开始分析工单条码一致性: ${workOrderNo}`);
  const result = await analyzeBarcodeWorkOrderConsistency(workOrderNo);
  if (result) {
    console.log("\n===== 分析结果摘要 =====");
    console.log(`总条码数: ${result.totalBarcodes}`);
    console.log(`工单不一致条码数: ${result.inconsistentBarcodes}`);
  }
}

// // 延迟执行，确保数据库连接已建立
// setTimeout(() => {
//   runConsistencyAnalysis();
// }, 5000);

// setTimeout(() => {
  // const workOrderNo1 = "P202502241740363143817";
  // const workOrderNo2 = "P202502241740363797824";
  //   const workOrderNo3 = "P202502241740363867363";
  //   const workOrderNo4 = "P202502241740363914995";
    // const workOrderNo5 = "P202502241740363948378";
  // analyzeBarcodeWorkOrderConsistency("P202502241740363948378");
// }, 5000);

// 导出工单物料节点数据的函数
async function exportWorkOrderMaterialNodesData(workOrderIds) {
  try {
    if (!Array.isArray(workOrderIds)) {
      workOrderIds = [workOrderIds]; // 确保是数组格式
    }

    // 创建工作簿和工作表
    const workbook = new Excel.Workbook();
    const mainSheet = workbook.addWorksheet("主条码及物料信息");

    // 设置工作表格式 - 一行显示所有信息
    mainSheet.columns = [
      { header: "主条码", key: "barcode", width: 20 },
      { header: "物料编码", key: "materialCode", width: 20 },
      { header: "物料名称", key: "materialName", width: 30 },
      { header: "流程状态", key: "status", width: 15 },
      { header: "产品状态", key: "productStatus", width: 15 },
      { header: "工单号", key: "workOrderNo", width: 25 },
      // 特定工序节点信息
      { header: "批次单据号", key: "batchDocNumber", width: 30 },
      { header: "工序名称", key: "processName", width: 20 },
      { header: "工序状态", key: "processStatus", width: 15 },
      // 风扇物料信息
      { header: "风扇物料节点ID", key: "fan_materialId", width: 30 },
      { header: "风扇物料编码", key: "fan_materialCode", width: 20 },
      { header: "风扇物料名称", key: "fan_materialName", width: 30 },
      { header: "风扇条码", key: "fan_barcode", width: 20 },
      { header: "风扇扫码时间", key: "fan_scanTime", width: 25 },
      { header: "风扇节点状态", key: "fan_status", width: 15 },
      // 风扇组件物料信息
      { header: "风扇组件物料节点ID", key: "fanAssembly_materialId", width: 30 },
      { header: "风扇组件物料编码", key: "fanAssembly_materialCode", width: 20 },
      { header: "风扇组件物料名称", key: "fanAssembly_materialName", width: 30 },
      { header: "风扇组件条码", key: "fanAssembly_barcode", width: 20 },
      { header: "风扇组件扫码时间", key: "fanAssembly_scanTime", width: 25 },
      { header: "风扇组件节点状态", key: "fanAssembly_status", width: 15 },
    ];

    // 3. 指定要查找的特定物料ID
    const targetMaterialIds = {
      "fan": "6757a56f354604091e7be8ac",          // 风扇
      "fanAssembly": "675e2e1f354604091e8459ba"   // 风扇组件
    };

    // 指定要查找的特定工序ID
    const targetProcessStepId = "67809626c022a0886b51eeae";

    // 物料ID名称映射
    const materialIdNames = {
      "6757a56f354604091e7be8ac": "FW312右眼部风扇（鸿盈）",  
      "675e2e1f354604091e8459ba": "FW312右眼部风扇组件(鸿盈)"   
    };

    // 状态映射为中文
    const statusMap = {
      "PENDING": "待处理",
      "IN_PROCESS": "进行中",
      "COMPLETED": "已完成",
      "ABNORMAL": "异常"
    };

    // 2. 获取工单信息，用于显示工单号
    const workOrderMap = {};
    for (const workOrderId of workOrderIds) {
      const workOrder = await ProductionPlanWorkOrder.findById(workOrderId).lean();
      if (workOrder) {
        workOrderMap[workOrderId] = workOrder.workOrderNo;
      }
    }

    // 分批次处理参数
    const batchSize = 100; // 每批处理的数据量
    let skip = 0;
    let totalProcessed = 0;
    let rowCount = 0;
    let hasMoreData = true;

    console.log(`开始分批查询工单ID为 ${workOrderIds.join(', ')} 的数据，每批 ${batchSize} 条`);

    // 分批查询和处理数据
    while (hasMoreData) {
      // 1. 查询指定工单ID下的主条码数据（分批）
      const mainBarcodesData = await MaterialProcessFlow.find({
        productionPlanWorkOrderId: { $in: workOrderIds.map(id => mongoose.Types.ObjectId(id)) }
      })
      .sort({ _id: 1 }) // 确保分页一致性
      .skip(skip)
      .limit(batchSize)
      .lean();

      const batchCount = mainBarcodesData.length;
      console.log(`当前批次: 跳过 ${skip} 条，获取到 ${batchCount} 条数据`);
      
      if (batchCount === 0) {
        hasMoreData = false;
        continue;
      }

      totalProcessed += batchCount;
      skip += batchSize;
      
      // 4. 处理每条主条码数据，提取需要的信息
      for (const mainData of mainBarcodesData) {
        const workOrderNo = workOrderMap[mainData.productionPlanWorkOrderId] || "未知工单";
        const mainStatus = statusMap[mainData.status] || mainData.status || "未知";
        
        // 创建行数据对象
        const rowData = {
          barcode: mainData.barcode,
          materialCode: mainData.materialCode,
          materialName: mainData.materialName,
          status: mainStatus,
          productStatus: mainData.productStatus || "正常",
          workOrderNo: workOrderNo,
        };
        
        // 查找指定工序节点的批次单据号
        const processNode = mainData.processNodes.find(node => 
          node.nodeType === "PROCESS_STEP" && 
          node.processStepId && node.processStepId.toString() === targetProcessStepId
        );
        
        if (processNode) {
          const nodeStatus = statusMap[processNode.status] || processNode.status || "未知";
          rowData.batchDocNumber = processNode.batchDocNumber || "无批次单据号";
          rowData.processName = processNode.processName || "未知工序";
          rowData.processStatus = nodeStatus;
        } else {
          // 未找到指定工序节点
          rowData.batchDocNumber = "未找到该工序";
          rowData.processName = "未找到该工序";
          rowData.processStatus = "未找到";
        }
        
        // 查找processNodes中符合条件的物料节点
        // 处理风扇物料节点
        const fanNode = mainData.processNodes.find(node => 
          node.nodeType === "MATERIAL" && 
          node.materialId && node.materialId.toString() === targetMaterialIds.fan
        );
        
        if (fanNode) {
          const nodeStatus = statusMap[fanNode.status] || fanNode.status || "未知";
          rowData.fan_materialId = fanNode.materialId.toString();
          rowData.fan_materialCode = fanNode.materialCode || "";
          rowData.fan_materialName = fanNode.materialName || materialIdNames[targetMaterialIds.fan];
          rowData.fan_barcode = fanNode.barcode || "未扫码";
          rowData.fan_scanTime = fanNode.scanTime ? new Date(fanNode.scanTime).toLocaleString() : "未扫码";
          rowData.fan_status = nodeStatus;
        } else {
          // 风扇节点未找到
          rowData.fan_materialId = targetMaterialIds.fan;
          rowData.fan_materialCode = "";
          rowData.fan_materialName = materialIdNames[targetMaterialIds.fan];
          rowData.fan_barcode = "未找到";
          rowData.fan_scanTime = "";
          rowData.fan_status = "未找到";
        }
        
        // 处理风扇组件物料节点
        const fanAssemblyNode = mainData.processNodes.find(node => 
          node.nodeType === "MATERIAL" && 
          node.materialId && node.materialId.toString() === targetMaterialIds.fanAssembly
        );
        
        if (fanAssemblyNode) {
          const nodeStatus = statusMap[fanAssemblyNode.status] || fanAssemblyNode.status || "未知";
          rowData.fanAssembly_materialId = fanAssemblyNode.materialId.toString();
          rowData.fanAssembly_materialCode = fanAssemblyNode.materialCode || "";
          rowData.fanAssembly_materialName = fanAssemblyNode.materialName || materialIdNames[targetMaterialIds.fanAssembly];
          rowData.fanAssembly_barcode = fanAssemblyNode.barcode || "未扫码";
          rowData.fanAssembly_scanTime = fanAssemblyNode.scanTime ? new Date(fanAssemblyNode.scanTime).toLocaleString() : "未扫码";
          rowData.fanAssembly_status = nodeStatus;
        } else {
          // 风扇组件节点未找到
          rowData.fanAssembly_materialId = targetMaterialIds.fanAssembly;
          rowData.fanAssembly_materialCode = "";
          rowData.fanAssembly_materialName = materialIdNames[targetMaterialIds.fanAssembly];
          rowData.fanAssembly_barcode = "未找到";
          rowData.fanAssembly_scanTime = "";
          rowData.fanAssembly_status = "未找到";
        }

        // 添加行数据
        mainSheet.addRow(rowData);
        rowCount++;

        // 每处理500行保存一次工作簿（内存优化）
        if (rowCount % 500 === 0) {
          console.log(`已处理 ${rowCount} 行数据，正在进行中间保存...`);
          const tempOutputDir = path.join(__dirname, "../output/material_nodes/temp");
          ensureDirectoryExists(tempOutputDir);
          await workbook.xlsx.writeFile(path.join(
            tempOutputDir,
            `工单物料节点数据_临时_${rowCount}行.xlsx`
          ));
        }
      }

      // 避免内存溢出，提前释放批次数据
      mainBarcodesData.length = 0;
      
      // 如果当前批次数据量小于batchSize，说明已经没有更多数据了
      if (batchCount < batchSize) {
        hasMoreData = false;
      }
    }

    console.log(`总共处理了 ${totalProcessed} 条主条码数据，导出 ${rowCount} 行数据`);

    if (totalProcessed === 0) {
      console.log("未找到符合条件的主条码数据!");
    }
    
    // 应用样式
    mainSheet.getRow(1).font = { bold: true };
    mainSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    // 保存工作簿
    const outputDir = path.join(__dirname, "../output/material_nodes");
    ensureDirectoryExists(outputDir);
    const outputFile = path.join(
      outputDir,
      `工单物料节点数据_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`
    );
    await workbook.xlsx.writeFile(outputFile);
    console.log(`分析结果已保存至: ${outputFile}`);

    return {
      totalMainBarcodes: totalProcessed,
      exportedRows: rowCount
    };
  } catch (error) {
    console.error("导出过程中出错:", error);
  }
}

// 执行工单物料节点数据导出的函数
async function runMaterialNodesExport() {
  const workOrderIds = ["67f3e4b64b1ff6e388591af8"]; // 在此设置要导出的工单ID
  console.log(`开始导出工单物料节点数据: ${workOrderIds.join(', ')}`);
  const result = await exportWorkOrderMaterialNodesData(workOrderIds);
  if (result) {
    console.log("\n===== 导出结果摘要 =====");
    console.log(`总主条码数: ${result.totalMainBarcodes}`);
    console.log(`导出行数: ${result.exportedRows}`);
  }
}

// 可以在这里取消注释来直接运行导出功能
setTimeout(() => {
  runMaterialNodesExport();
}, 5000);

module.exports = {
  analyzeWorkOrderBarcodeStatus,
  analyzeBarcodeWorkOrderConsistency,
  exportWorkOrderMaterialNodesData,
};
