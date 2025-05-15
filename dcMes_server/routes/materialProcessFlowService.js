// 在路由或控制器中使用
const express = require("express");
const router = express.Router();
const MaterialProcessFlowService = require("../services/materialProcessFlowService");
const ProcessMaterial = require("../model/project/processMaterials");
const processStep = require("../model/project/processStep");
const barcodeRule = require("../model/project/barcodeRule");
const productBarcodeRule = require("../model/project/productBarcodeRule");
const apiLogger = require("../middleware/apiLogger");
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const Machine = require("../model/project/machine");
const InspectionLastData = require("../model/project/InspectionLastData");
const productRepair = require("../model/project/productRepair");
// 使用API日志中间件，指定服务名称
router.use(apiLogger("materialProcessFlowService"));

/**
 * 根据错误消息匹配错误编码
 * @param {string} errorMessage - 错误消息
 * @returns {string} 匹配的错误编码，如果没有匹配则返回null
 */
function matchErrorCode(errorMessage) {
  if (!errorMessage) return null;

  const errorCodeMap = {
    该DI编码不存在本系统: "LINE-A-001",
    该DI编码未关联有效物料: "LINE-A-002",
    该DI编码对应的物料与当前工序不匹配: "LINE-A-003",
    该条码不符合任何已配置的规则或物料不匹配: "LINE-A-004",
    未找到对应的主条码流程记录: "LINE-B-001",
    未找到对应的工序节点: "LINE-B-002",
    该主物料条码对应工序节点已完成或处于异常状态: "LINE-B-003",
    存在未完成的前置工序: "LINE-C-001",
    扫码数量与要求不符: "LINE-C-002",
    存在重复扫描的条码: "LINE-C-003",
    物料不属于当前工序要求扫描的物料: "LINE-C-004",
    批次物料条码已达到使用次数限制: "LINE-D-001",
    // 未找到条码为的子物料流程记录: "LINE-D-002",
    的子物料流程记录: "LINE-D-002",
    该物料条码的子物料工序未完成: "LINE-D-003",
    关键物料重复使用错误: "LINE-E-001",
    已被其他流程使用: "LINE-E-002",
    未查询到生产工单: "LINE-F-001",
    工单已达到计划数量: "LINE-F-002",
    缺少必要参数: "LINE-G-001",
    // 新增错误码映射
    未找到物料编码为: "LINE-G-002",
    未找到物料对应的工艺信息: "LINE-G-003",
    条码参数不能为空: "LINE-G-004",
    成品工艺未查询到产线计划: "LINE-F-003",
    未找到有效的产线工单: "LINE-F-004",
    产品条码未绑定工单: "LINE-F-005",
    当前产线工单与产品条码工单不一致: "LINE-F-006",
    更新工单投入量失败: "LINE-F-007",
    条码与物料不匹配: "LINE-H-001",
    未找到对应的设备信息: "LINE-H-002",
    未找到对应的工序信息: "LINE-H-003",
    未找到对应的工艺信息: "LINE-H-004",
    未找到对应的物料信息: "LINE-H-005",
    未找到指定的物料节点或物料节点不属于指定工序: "LINE-I-001",
    原物料条码不匹配: "LINE-I-002",
    未找到对应的部件替换维修记录: "LINE-I-003",
    新条码物料类型: "LINE-I-004",
    新条码的流程未完成: "LINE-I-005",
    新条码验证失败: "LINE-I-006",
    验证流程数据失败: "LINE-J-001",
    创建工艺流程记录失败: "LINE-J-002",
    处理扫码请求失败: "LINE-J-003",
    修复条码物料异常数据失败: "LINE-J-004",
  };

  // 遍历错误映射对象，查找匹配项
  for (const [message, code] of Object.entries(errorCodeMap)) {
    if (errorMessage.includes(message)) {
      return code;
    }
  }

  return null;
}

// 创建流程记录
router.post("/api/v1/create-flow", async (req, res) => {
  try {
    console.log("[API] 创建流程记录 - 请求参数:", req.body);
    const {
      mainMaterialId,
      materialCode,
      barcode,
      productLineId,
      productLineName,
      isFromDevice = false,
      productionPlanWorkOrderId = null,
    } = req.body;
    const flowRecord =
      await MaterialProcessFlowService.createFlowByMaterialCode(
        mainMaterialId,
        materialCode,
        barcode,
        productLineId,
        productLineName,
        isFromDevice,
        productionPlanWorkOrderId
      );
    res.json({
      code: 200,
      message: "创建流程记录成功",
      success: true,
      data: flowRecord,
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

// 工序子物料批量扫码提交
router.post("/api/v1/scan-components", async (req, res) => {
  try {
    console.log("[API] 工序子物料批量扫码提交 - 请求参数:", req.body);
    const {
      mainBarcode, // 主条码
      processStepId, // 工序ID
      componentScans, // 子物料条码数组
      userId, // 用户ID
      lineId, // 产线ID
      isFromDevice = false, // 是否来自设备
    } = req.body;

    // 参数验证
    if (
      !mainBarcode ||
      !processStepId ||
      !lineId ||
      !Array.isArray(componentScans)
    ) {
      const errorCode = matchErrorCode("缺少必要参数或参数格式错误");
      return res.status(200).json({
        success: false,
        message: "缺少必要参数或参数格式错误",
        errorCode: errorCode,
      });
    }

    const result = await MaterialProcessFlowService.scanProcessComponents(
      mainBarcode,
      processStepId,
      componentScans,
      userId,
      lineId,
      isFromDevice
    );

    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

// 工序解绑
router.post("/api/v1/unbind-components", async (req, res) => {
  try {
    console.log("[API] 工序解绑 - 请求参数:", req.body);
    const {
      mainBarcode, // 主条码
      processStepId, // 工序ID
      userId, // 用户ID
      reason, // 解绑原因
      unbindSubsequent, // 是否解绑后续工序
    } = req.body;

    // 参数验证
    if (!mainBarcode || !processStepId || !userId || !reason) {
      const errorCode = matchErrorCode("缺少必要参数");
      return res.status(200).json({
        success: false,
        message: "缺少必要参数",
        errorCode: errorCode,
      });
    }

    const result = await MaterialProcessFlowService.unbindProcessComponents(
      mainBarcode,
      processStepId,
      userId,
      reason,
      unbindSubsequent
    );

    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

// 更新流程节点
router.post("/api/v1/update-flow-nodes", async (req, res) => {
  try {
    console.log("[API] 更新流程节点 - 请求参数:", req.body);
    const { barcode } = req.body;
    const result = await MaterialProcessFlowService.updateFlowNodes(barcode);
    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

// 添加初始化产品条码的路由
router.post('/api/v1/initializeProduct', async (req, res) => {
  try {
    const { barcode, userId } = req.body;
    if (!barcode) {
      return res.json({
        code: 400,
        success: false,
        message: '请提供产品条码'
      });
    }

    const result = await MaterialProcessFlowService.initializeProduct(barcode, userId);
    return res.json({
      code: 200,
      success: true,
      message: '初始化成功',
      data: result
    });
  } catch (error) {
    console.error('初始化产品条码失败:', error);
    return res.json({
      code: 500,
      success: false,
      message: error.message || '初始化产品条码失败'
    });
  }
});

// 自动修复主条码中的异常子条码数据
router.post("/api/v1/auto-fix-inconsistent-process-nodes", async (req, res) => {
  try {
    console.log("[API] 自动修复主条码中的异常子条码数据 - 请求参数:", req.body);
    const { barcode } = req.body;
    const result =
      await MaterialProcessFlowService.autoFixInconsistentProcessNodes(barcode);
    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

// 获取物料相关的所有工序
router.get("/api/v1/all-process-steps/:materialId", async (req, res) => {
  try {
    console.log("[API] 获取物料相关的所有工序 - 请求参数:", {
      params: req.params,
      query: req.query,
    });
    const { materialId } = req.params;

    if (!materialId) {
      const errorCode = matchErrorCode("缺少物料ID参数");
      return res.status(200).json({
        success: false,
        message: "缺少物料ID参数",
        errorCode: errorCode,
      });
    }

    const result = await MaterialProcessFlowService.getAllProcessSteps(
      materialId
    );

    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

// 设备条码初始化
router.post("/api/v1/initialize-machine-barcode", async (req, res) => {
  try {
    console.log("[API] 设备条码初始化 - 请求参数:", req.body);
    const { barcode, machineIp } = req.body;

    // 参数验证
    if (!barcode || !machineIp) {
      const errorCode = matchErrorCode("缺少必要参数");
      return res.status(200).json({
        success: false,
        message: "缺少必要参数",
        errorCode: errorCode,
      });
    }

    const result = await MaterialProcessFlowService.initializeMachineBarcode(
      barcode,
      machineIp
    );

    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

/**
 * 导出BOM结构
 */
router.get("/api/v1/exportBOM", async (req, res) => {
  try {
    console.log("[API] 导出BOM结构 - 请求参数:", req.query);
    const { materialId } = req.query;
    if (!materialId) {
      const errorCode = matchErrorCode("缺少必要参数: materialId");
      return res.status(400).json({
        error: "缺少必要参数: materialId",
        errorCode: errorCode,
      });
    }

    const bomData =
      await MaterialProcessFlowService.exportFlattenedBOMStructure(materialId);
    res.json({ data: bomData });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    console.error("导出BOM失败:", error);
    res.status(500).json({ error: error.message, errorCode: errorCode });
  }
});

// 修复流程进度和状态
router.post("/api/v1/fix-flow-progress", async (req, res) => {
  try {
    console.log("[API] 修复流程进度和状态 - 请求参数:", req.body);
    const { barcode } = req.body;

    if (!barcode) {
      const errorCode = matchErrorCode("缺少必要参数：barcode");
      return res.status(200).json({
        success: false,
        message: "缺少必要参数：barcode",
        errorCode: errorCode,
      });
    }

    const result = await MaterialProcessFlowService.fixFlowProgress(barcode);

    res.json({
      code: 200,
      success: true,
      data: result,
      message: "流程进度修复成功",
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

// 批量修复流程进度和状态
router.post("/api/v1/batch-fix-flow-progress", async (req, res) => {
  try {
    console.log("[API] 批量修复流程进度和状态 - 请求参数:", req.body);
    const { barcodes } = req.body;

    if (!Array.isArray(barcodes) || barcodes.length === 0) {
      const errorCode = matchErrorCode("请提供有效的条码数组");
      return res.status(200).json({
        success: false,
        message: "请提供有效的条码数组",
        errorCode: errorCode,
      });
    }

    const results = [];
    for (const barcode of barcodes) {
      try {
        const result = await MaterialProcessFlowService.fixFlowProgress(
          barcode
        );
        results.push({
          barcode,
          success: true,
          ...result,
        });
      } catch (error) {
        const errorCode = matchErrorCode(error.message);
        results.push({
          barcode,
          success: false,
          error: error.message,
          errorCode: errorCode,
        });
      }
    }

    res.json({
      code: 200,
      success: true,
      data: results,
      message: "批量修复完成",
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

// 设备扫码提交
router.post("/api/v1/machine-scan-components", async (req, res) => {
  try {
    console.log("[API] 设备扫码提交 - 请求参数:", req.body);
    const { mainBarcode, processStepId, barcodes, userId, lineId } = req.body;
    console.log("req.body===", req.body);
    // 参数验证
    if (!mainBarcode || !processStepId || !lineId || !Array.isArray(barcodes)) {
      const errorCode = matchErrorCode("缺少必要参数或参数格式错误");
      return res.status(200).json({
        success: false,
        message: "缺少必要参数或参数格式错误",
        errorCode: errorCode,
      });
    }

    // 获取工序关联的物料列表
    const processMaterials = await ProcessMaterial.find({
      processStepId,
      scanOperation: true,
    }).populate("materialId");

    console.log(
      "需要扫描的工序物料列表:",
      processMaterials.map((pm) => ({
        materialCode: pm.materialId.FNumber,
        materialName: pm.materialId.FName,
        quantity: pm.quantity,
        unit: pm.unit,
      }))
    );

    // 检查重复条码
    const uniqueBarcodes = new Set(barcodes);
    if (uniqueBarcodes.size !== barcodes.length) {
      const errorCode = matchErrorCode("存在重复扫描的条码");
      return res.status(200).json({
        success: false,
        message: "存在重复扫描的条码",
        errorCode: errorCode,
      });
    }

    // 1. 获取工序物料对应的条码规则
    const materialRules = [];
    for (const material of processMaterials) {
      console.log(`获取物料 ${material.materialId.FNumber} 的规则`);

      // 获取物料特定规则
      const productSpecificRules = await productBarcodeRule
        .find({
          productId: material.materialId._id,
        })
        .populate({
          path: "barcodeRule",
          match: { enabled: true },
        });

      // 获取全局规则
      const globalRules = await barcodeRule.find({
        enabled: true,
        isGlobal: true,
      });

      // 处理物料特定规则
      const specificRules = productSpecificRules
        .filter((item) => item.barcodeRule)
        .map((item) => ({
          rule: item.barcodeRule.toObject(),
          priority: item.barcodeRule.priority || 0,
          isProductSpecific: true,
          material: {
            _id: material.materialId._id,
            FNumber: material.materialId.FNumber,
            FName: material.materialId.FName,
          },
        }));

      // 处理全局规则
      const globalRulesForMaterial = globalRules.map((rule) => ({
        rule: rule.toObject(),
        priority: -1,
        isProductSpecific: false,
        material: {
          _id: material.materialId._id,
          FNumber: material.materialId.FNumber,
          FName: material.materialId.FName,
        },
      }));

      // 合并规则并保持物料关联
      materialRules.push(...specificRules, ...globalRulesForMaterial);
    }

    // 按优先级排序
    materialRules.sort((a, b) => b.priority - a.priority);

    console.log(
      "物料规则映射:",
      materialRules.map((mr) => ({
        materialCode: mr.material.FNumber,
        materialName: mr.material.FName,
        ruleName: mr.rule.name,
        isProductSpecific: mr.isProductSpecific,
        priority: mr.priority,
      }))
    );

    // 记录已匹配的物料编码
    const matchedMaterialCodes = new Set();
    const componentScans = [];
    const processedResults = [];
    const failedBarcodes = [];

    // 对每个条码进行验证和匹配
    for (const barcode of barcodes) {
      console.log(`\n开始处理条码: ${barcode}`);
      let matched = false;

      // 遍历所有规则进行匹配
      for (const materialRule of materialRules) {
        // 跳过已匹配物料的规则
        if (matchedMaterialCodes.has(materialRule.material.FNumber)) {
          console.log(`物料 ${materialRule.material.FNumber} 已经匹配过，跳过`);
          continue;
        }

        console.log(
          `尝试规则: ${materialRule.rule.name} 匹配物料: ${materialRule.material.FNumber}`
        );

        // 验证条码
        const validationResult = await validateBarcodeWithRule(
          barcode,
          materialRule.rule,
          materialRule.material
        );

        if (validationResult.isValid) {
          console.log(`条码验证成功!`);
          console.log(`- 匹配规则: ${materialRule.rule.name}`);
          console.log(`- 物料编码: ${materialRule.material.FNumber}`);
          console.log(`- 物料名称: ${materialRule.material.FName}`);

          matchedMaterialCodes.add(materialRule.material.FNumber);
          componentScans.push({
            materialId: materialRule.material._id,
            barcode: barcode,
          });
          processedResults.push({
            barcode,
            materialCode: materialRule.material.FNumber,
            materialName: materialRule.material.FName,
            ruleName: materialRule.rule.name,
            ruleType: materialRule.rule.type,
          });
          matched = true;
          break;
        }
      }

      if (!matched) {
        console.log(`条码 ${barcode} 未能匹配任何物料规则`);
        failedBarcodes.push(barcode);
      }
    }

    // 如果没有任何条码匹配成功
    // if (componentScans.length === 0) {
    //   const errorCode = matchErrorCode("没有条码匹配成功");
    //   return res.status(200).json({
    //     success: false,
    //     message: "没有条码匹配成功",
    //     errorCode: errorCode,
    //     failedBarcodes,
    //   });
    // }

    console.log("\n所有条码处理结果:", processedResults);
    console.log("componentScans:", componentScans);

    // 调用扫码处理方法
    const result = await MaterialProcessFlowService.scanProcessComponents(
      mainBarcode,
      processStepId,
      componentScans,
      userId,
      lineId,
      true
    );

    res.json({
      code: 200,
      success: true,
      data: result,
      processedResults,
      failedBarcodes,
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    console.error("处理扫码请求失败:", error);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

/**
 * 验证条码是否符合规则并提取物料编码
 * @param {string} barcode - 需要验证的条码
 * @param {Object} rule - 条码规则对象
 * @param {Object} material - 物料对象
 * @returns {Object} 验证结果，包含isValid和materialCode
 */
async function validateBarcodeWithRule(barcode, rule, material) {
  try {
    console.log(`\n验证条码: ${barcode}`);
    console.log(`规则名称: ${rule.name}`);
    console.log(`物料编码: ${material.FNumber}`);

    // 基础验证
    if (!barcode || !rule || !material) {
      console.log("基础验证失败: 缺少必要参数");
      return { isValid: false };
    }

    // 验证规则数组
    if (rule.validationRules && Array.isArray(rule.validationRules)) {
      for (const validationRule of rule.validationRules) {
        if (!validationRule.enabled) continue;

        console.log(`执行验证规则: ${validationRule.name}`);

        switch (validationRule.type) {
          case "length":
            if (
              validationRule.params.length &&
              barcode.length !== validationRule.params.length
            ) {
              console.log(
                `长度验证失败: 期望 ${validationRule.params.length}, 实际 ${barcode.length}`
              );
              return { isValid: false };
            }
            break;

          case "prefix":
            if (
              validationRule.params.expectedValue &&
              !barcode.startsWith(validationRule.params.expectedValue)
            ) {
              console.log(
                `前缀验证失败: 期望前缀 ${validationRule.params.expectedValue}`
              );
              return { isValid: false };
            }
            break;

          case "pattern":
            if (validationRule.params.pattern) {
              const regex = new RegExp(validationRule.params.pattern);
              if (!regex.test(barcode)) {
                console.log(
                  `正则验证失败: 不匹配模式 ${validationRule.params.pattern}`
                );
                return { isValid: false };
              }
            }
            break;

          case "substring":
            if (
              validationRule.params.start !== undefined &&
              validationRule.params.end !== undefined &&
              validationRule.params.expectedValue
            ) {
              const substring = barcode.substring(
                validationRule.params.start,
                validationRule.params.end || undefined
              );
              if (substring !== validationRule.params.expectedValue) {
                console.log(
                  `子串验证失败: 期望 ${validationRule.params.expectedValue}, 实际 ${substring}`
                );
                return { isValid: false };
              }
            }
            break;
        }
      }
    }

    // 提取物料编码（如果有配置）
    let extractedMaterialCode = null;
    if (rule.extractionConfigs && Array.isArray(rule.extractionConfigs)) {
      for (const config of rule.extractionConfigs) {
        if (config.target === "materialCode" && Array.isArray(config.steps)) {
          let value = barcode;
          for (const step of config.steps) {
            if (!step.enabled) continue;

            switch (step.type) {
              case "substring":
                value = value.substring(
                  step.params.start,
                  step.params.end || undefined
                );
                break;
              // 可以添加其他提取步骤类型
            }
          }
          extractedMaterialCode = value;
          break;
        }
      }
    }

    // 如果提取到物料编码，验证是否匹配
    if (
      extractedMaterialCode !== null &&
      extractedMaterialCode !== material.FNumber
    ) {
      console.log(
        `物料编码不匹配: 提取到 ${extractedMaterialCode}, 期望 ${material.FNumber}`
      );
      return { isValid: false };
    }

    console.log("验证通过!");
    return {
      isValid: true,
      materialCode: material.FNumber,
      extractedMaterialCode,
    };
  } catch (error) {
    console.error("条码验证失败:", error);
    return { isValid: false };
  }
}

// 批量更新关联单据
router.post("/api/v1/batch-update-related-bills", async (req, res) => {
  try {
    console.log("[API] 批量更新关联单据 - 开始执行");
    const result = await MaterialProcessFlowService.batchUpdateRelatedBills();
    res.json({
      code: 200,
      success: true,
      message: "批量更新关联单据成功",
      data: result,
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

// 验证最近10天的流程数据
router.get("/api/v1/validate-recent-flows", async (req, res) => {
  try {
    console.log("[API] 验证最近10天的流程数据 - 开始执行");
    const result = await MaterialProcessFlowService.validateRecentFlows();
    res.json({
      code: 200,
      success: true,
      data: result,
      message: "验证完成",
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

// 检查条码节点完成情况
router.get("/api/v1/check-barcode-completion/:barcode", async (req, res) => {
  try {
    console.log("[API] 检查条码节点完成情况 - 请求参数:", {
      params: req.params,
      query: req.query,
    });
    const { barcode } = req.params;

    if (!barcode) {
      const errorCode = matchErrorCode("条码参数不能为空");
      return res.status(200).json({
        code: 400,
        success: false,
        message: "条码参数不能为空",
        errorCode: errorCode,
      });
    }

    const result = await MaterialProcessFlowService.checkBarcodeCompletion(
      barcode
    );

    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

// 设备产品扫码前置校验
router.post("/api/v1/check-barcode-prerequisites", async (req, res) => {
  try {
    console.log("[API] 设备产品扫码前置校验 - 请求参数:", req.body);
    const { barcode, machineIp } = req.body;

    // 参数验证
    if (!barcode || !machineIp) {
      const errorCode = matchErrorCode("缺少必要参数");
      return res.status(200).json({
        code: 500,
        success: false,
        message: "缺少必要参数",
        errorCode: errorCode,
      });
    }

    // 获取流程记录
    const flowRecord = await MaterialProcessFlow.findOne({ barcode });

    if (!flowRecord) {
      const errorCode = matchErrorCode("未找到该条码对应的流程记录");
      return res.status(200).json({
        code: 203,
        success: false,
        message: "未找到该条码对应的流程记录",
        errorCode: errorCode,
      });
    }

    // 根据机器IP获取当前工序节点
    // 这里假设已有映射关系，实际应根据系统设计调整
    const machine = await Machine.findOne({ machineIp: machineIp });
    if (!machine) {
      const errorCode = matchErrorCode("未找到该机器IP对应的设备信息");
      return res.status(200).json({
        code: 203,
        success: false,
        message: "未找到该机器IP对应的设备信息",
        errorCode: errorCode,
      });
    }

    // 获取当前机器对应的工序节点
    const processStepId = machine.processStepId;
    if (!processStepId) {
      const errorCode = matchErrorCode("该设备未关联工序信息");
      return res.status(200).json({
        code: 203,
        success: false,
        message: "该设备未关联工序信息",
        errorCode: errorCode,
      });
    }

    let processStepInfo = await processStep.findOne({
      _id: machine.processStepId,
    });
    console.log("processStepId===", processStepId);

    // 在流程节点中查找当前工序对应的节点
    const processNode = flowRecord.processNodes.find(
      (node) =>
        node.processStepId &&
        node.processStepId.toString() === processStepId.toString() &&
        node.nodeType === "PROCESS_STEP"
    );

    console.log("processNode===", processNode);

    if (!processNode) {
      const errorCode = matchErrorCode("流程中不包含该工序节点");
      return res.status(200).json({
        code: 203,
        success: false,
        message: "流程中不包含该工序节点",
        errorCode: errorCode,
      });
    }

    if (machine.isNeedMaintain) {
      // 检查工序是否存在不合格的记录
      const inspectionRecord = await InspectionLastData.findOne({
        scanCode: barcode,
        machineIp: processStepId,
        error: true, // 假设"不合格"是表示检测失败的值
      }).sort({ createTime: -1 }); // 获取最新的记录

      if (inspectionRecord) {
        //查询条码是否存在维修记录
        const productRepairinfo = await productRepair.findOne({
          barcode: barcode,
          status: "PENDING_REVIEW",
        });

        if (!productRepairinfo) {
          const errorCode =
            matchErrorCode("该条码在当前工序有不合格的检测记录");
          return res.status(200).json({
            code: 201,
            success: false,
            message: `该条码在当前工序有不合格的检测记录，检测时间: ${new Date(
              inspectionRecord.createTime
            ).toLocaleString()}`,
            errorCode: errorCode,
          });
        }
      }
    }

    // 验证工序节点状态
    if (processNode.status == "COMPLETED") {
      const errorCode = matchErrorCode(
        "该主物料条码对应工序节点已完成或处于异常状态"
      );
      return res.status(200).json({
        code: 204,
        success: false,
        message: "该主物料条码对应工序节点已完成或处于异常状态",
        errorCode: errorCode,
      });
    }

    // 检查前置工序完成状态
    const checkResult = MaterialProcessFlowService.checkPreviousProcessSteps(
      flowRecord.processNodes,
      processNode
    );

    if (!checkResult.isValid) {
      const errorCode = matchErrorCode("前置工序未完成");
      return res.status(200).json({
        code: 203,
        success: false,
        message: "前置工序未完成",
        errorCode: errorCode,
        data: {
          matchProcess: processStepInfo,
          matchBindRecord: flowRecord,
        },
      });
    }

    res.json({
      code: 200,
      success: true,
      message: "前置工序校验通过",
      data: {
        matchProcess: processStepInfo,
        matchBindRecord: flowRecord,
      },
      // data: {
      //   flowRecord: {
      //     id: flowRecord._id,
      //     barcode: flowRecord.barcode,
      //     materialCode: flowRecord.materialCode,
      //   },
      //   processNode: {
      //     id: processNode._id,
      //     processStepName: processNode.processStepId?.name,
      //     processStepCode: processNode.processStepId?.code,
      //   },
      //   checkResult,
      // },
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    console.error("设备产品扫码前置校验失败:", error);
    res.status(200).json({
      code: 203,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

// 替换物料组件
router.post("/api/v1/replace-component", async (req, res) => {
  try {
    console.log("[API] 替换物料组件 - 请求参数:", req.body);
    const {
      mainBarcode,
      processNodeId,
      materialNodeId,
      originalBarcode,
      newBarcode,
      userId,
    } = req.body;

    // 参数验证
    if (
      !mainBarcode ||
      !processNodeId ||
      !materialNodeId ||
      !newBarcode ||
      !userId
    ) {
      const errorCode = matchErrorCode("缺少必要参数");
      return res.status(200).json({
        code: 500,
        success: false,
        message: "缺少必要参数",
        errorCode: errorCode,
      });
    }

    const result = await MaterialProcessFlowService.replaceComponent(
      mainBarcode,
      processNodeId,
      materialNodeId,
      originalBarcode,
      newBarcode,
      userId
    );

    res.json({
      code: 200,
      success: true,
      data: result,
      message: "物料替换成功",
    });
  } catch (error) {
    const errorCode = matchErrorCode(error.message);
    console.error("物料替换失败:", error);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
      errorCode: errorCode,
    });
  }
});

module.exports = router;
