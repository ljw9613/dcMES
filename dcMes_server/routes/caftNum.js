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
 * @param {string} craftCode - 工艺编码 (例如: 0A01)
 * @param {string} processType - 工序类型
 * @returns {string} - 重构后的工序编码
 */
function generateProcessCode(craftCode, processType,sequence) {
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
  const processCode = processTypeMap[processType] || "A";

  // 生成日期编码
  const now = new Date();
  const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(now.getDate()).padStart(2, "0")}`;

  // 处理序号（4位，补零）
  const sequenceCode = String(sequence).padStart(4, "0");

  // 组合编码
  return `${craftCode}-${processCode}-${dateCode}${sequenceCode}`;
}

// 批量更新数据库中的工序编码
async function updateProcessCodes() {
  try {
    // 按日期分组获取当前最大序号
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 获取所有需要更新的工序
    const cursor = await ProcessStep.find({}).populate("craftId"); // 关联工艺信息
    let currentSequence = 1;
    console.log(cursor.length, "process");
    for (const process of cursor) {
      if (!process.craftId) continue; // 跳过没有关联工艺的记录

      const newCode = generateProcessCode(
        process.craftId.craftCode,
        process.processType,
        currentSequence
      );
      console.log(newCode, "process");
      await ProcessStep.updateOne(
        { _id: process._id },
        {
          $set: {
            processCode: newCode,
            updateAt: new Date(),
          },
        }
      );
      currentSequence++;
    }

    return { success: true, message: `更新了 ${currentSequence - 1} 条记录` };
  } catch (error) {
    console.error("更新工序编码失败:", error);
    return { success: false, error: error.message };
  }
}

// 更新工艺编码
// updateCraftCodes();
// 更新工序编码
// updateProcessCodes();
