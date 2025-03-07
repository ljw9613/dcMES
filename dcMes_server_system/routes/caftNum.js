const mongoose = require("mongoose");
const ProcessStep = require("../model/project/processStep");
const craft = require("../model/project/craft");

/**
 * 重构工艺编码
 * @param {string} businessType - 业务类型 (0:电池包,1:小家电,2:SHARK,3:TTI,4:追觅,5:添可)
 * @param {string} craftType - 工艺类型 (标准工艺:A,制具工艺:B,辅材工序:C)
 * @returns {string} - 重构后的工艺编码
 */
function generateCraftCode(businessType, craftType) {
  // 业务类型映射
  const businessTypeMap = {
    电池包: "0",
    小家电: "1",
    SHARK: "2",
    TTI: "3",
    追觅: "4",
    添可: "5",
    // 如果已经是数字编码，直接使用
    0: "0",
    1: "1",
    2: "2",
    3: "3",
    4: "4",
    5: "5",
  };

  // 工艺类型映射
  const craftTypeMap = {
    标准工艺: "A",
    制具工艺: "B",
    辅材工序: "C",
    // 如果已经是字母编码，直接使用
    A: "A",
    B: "B",
    C: "C",
  };

  // 获取工艺类型编码
  const craftCode = "0" + craftType || "A";

  // 处理序号（补零）
  const sequenceCode =
    parseInt(businessType) < 10
      ? `0${parseInt(businessType)}`
      : `${parseInt(businessType)}`;

  // 组合编码
  return `${craftCode}${sequenceCode !== "NaN" ? sequenceCode : ""}`;
}

// 批量更新数据库中的工艺编码
async function updateCraftCodes() {
  const cursor = await craft.find({});
  console.log(cursor.length, "craft");
  for (const row of cursor) {
    const newCode = generateCraftCode(row.businessType, row.craftType);
    console.log(newCode, row._id, "craft");
    await craft.findByIdAndUpdate(
      { _id: row._id },
      { $set: { craftCode: newCode } }
    );
  }
}

/**
 * 重构工序编码
 * @param {string} craftType - 工艺类型 (标准工艺:A,制具工艺:B,辅材工序:C)
 * @param {string} processType - 工序类型
 * @param {string} sequence - 序号
 * @param {string} businessType - 业务类型
 * @returns {string} - 重构后的工序编码
 */
function generateUnifiedCode(craftType, processType, sequence, businessType) {
  // 工序类型映射
  const processTypeMap = {
    STANDARD_PROCESS: "A", // 标准工序
    REPAIR_PROCESS: "B", // 维修工序
    TEST_PROCESS: "C", // 测试工序
    BINDING_PROCESS: "D", // 绑定工序
    // 如果已经是字母编码，直接使用
    A: "A",
    B: "B",
    C: "C",
    D: "D",
  };

  // 获取工序类型编码
  const processTypeCode = processTypeMap[processType] || "A";

  let code = craftType || '';

  // 添加工序类型
  if (processTypeCode) {
    code += `_${processTypeCode}`;
  }

  // 添加序列号
  code += `_${sequence}`;

  // // 添加业务类型
  // if (businessType) {
  //   code += `_${businessType}`;
  // }

  return code;
}

// 批量更新数据库中的工序编码
async function updateProcessCodes() {
  try {
    // 1. 获取所有工艺
    const crafts = await craft.find({});
    console.log(`找到 ${crafts.length} 个工艺需要处理`);

    let totalUpdatedProcesses = 0;

    // 2. 遍历每个工艺
    for (const craftItem of crafts) {
      try {
        // 3. 获取当前工艺下的所有工序，按sort字段排序
        const processes = await ProcessStep.find({ 
          craftId: craftItem._id 
        }).sort({ sort: 1 });

        console.log(`工艺 ${craftItem.craftCode} 下有 ${processes.length} 个工序需要更新`);

        // 4. 更新当前工艺下的所有工序编码
        for (const process of processes) {
          // 使用原有的sort值作为序号
          const sequence = process.sort.toString().padStart(4, '0'); // 4位序号，补零

          // 从工艺编码中提取工艺类型（第一个字母）
          const craftType = craftItem.craftType;

          // 生成新的工序编码
          const newCode = generateUnifiedCode(
            craftType,
            process.processType,
            sequence,
            process.businessType
          );

          // 更新工序编码，但保持原有的sort值
          await ProcessStep.updateOne(
            { _id: process._id },
            {
              $set: {
                processCode: newCode,
                updateAt: new Date()
              }
            }
          );

          console.log(`已更新工序 ${process._id}: ${newCode}`);
          totalUpdatedProcesses++;
        }

        console.log(`工艺 ${craftItem.craftCode} 的工序更新完成`);
      } catch (error) {
        console.error(`处理工艺 ${craftItem.craftCode} 时出错:`, error);
        continue; // 继续处理下一个工艺
      }
    }

    return { 
      success: true, 
      message: `更新完成，共处理 ${crafts.length} 个工艺，更新 ${totalUpdatedProcesses} 个工序` 
    };
  } catch (error) {
    console.error("更新工序编码失败:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// 更新工艺编码
// updateCraftCodes();
// 更新工序编码
updateProcessCodes();
