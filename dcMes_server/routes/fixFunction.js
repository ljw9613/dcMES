// 导入模型
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const ProductionPlanWorkOrder = require("../model/project/productionPlanWorkOrder");
const MaterialPalletizing = require("../model/project/materialPalletizing"); // 假设托盘模型在此路径
const Excel = require("exceljs"); // 需要先安装: npm install exceljs
const path = require("path");
const fs = require("fs");

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

module.exports = {
  analyzeWorkOrderBarcodeStatus,
  analyzeBarcodeWorkOrderConsistency,
};
