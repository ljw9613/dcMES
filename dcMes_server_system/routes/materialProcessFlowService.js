// 在路由或控制器中使用
const express = require("express");
const router = express.Router();
const MaterialProcessFlowService = require("../services/materialProcessFlowService");
const ProcessMaterial = require("../model/project/processMaterials");
const barcodeRule = require("../model/project/barcodeRule");
const productBarcodeRule = require("../model/project/productBarcodeRule");

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
    } = req.body;
    const flowRecord =
      await MaterialProcessFlowService.createFlowByMaterialCode(
        mainMaterialId,
        materialCode,
        barcode,
        productLineId,
        productLineName
      );
    res.json({
      code: 200,
      message: "创建流程记录成功",
      success: true,
      data: flowRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
    } = req.body;

    // 参数验证
    if (
      !mainBarcode ||
      !processStepId ||
      !lineId ||
      !Array.isArray(componentScans)
    ) {
      return res.status(200).json({
        success: false,
        message: "缺少必要参数或参数格式错误",
      });
    }

    const result = await MaterialProcessFlowService.scanProcessComponents(
      mainBarcode,
      processStepId,
      componentScans,
      userId,
      lineId
    );

    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
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
      return res.status(200).json({
        success: false,
        message: "缺少必要参数",
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
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
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
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});

// 自动修复主条码中的异常子条码数据
router.post("/api/v1/auto-fix-inconsistent-process-nodes", async (req, res) => {
  try {
    console.log("[API] 自动修复主条码中的异常子条码数据 - 请求参数:", req.body);
    const { barcode } = req.body;
    const result = await MaterialProcessFlowService.autoFixInconsistentProcessNodes(barcode);
    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});

// 获取物料相关的所有工序
router.get("/api/v1/all-process-steps/:materialId", async (req, res) => {
  try {
    console.log("[API] 获取物料相关的所有工序 - 请求参数:", { params: req.params, query: req.query });
    const { materialId } = req.params;

    if (!materialId) {
      return res.status(200).json({
        success: false,
        message: "缺少物料ID参数",
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
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
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
      return res.status(200).json({
        success: false,
        message: "缺少必要参数",
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
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
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
      return res.status(400).json({ error: "缺少必要参数: materialId" });
    }

    const bomData =
      await MaterialProcessFlowService.exportFlattenedBOMStructure(materialId);
    res.json({ data: bomData });
  } catch (error) {
    console.error("导出BOM失败:", error);
    res.status(500).json({ error: error.message });
  }
});

// 修复流程进度和状态
router.post("/api/v1/fix-flow-progress", async (req, res) => {
  try {
    console.log("[API] 修复流程进度和状态 - 请求参数:", req.body);
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(200).json({
        success: false,
        message: "缺少必要参数：barcode",
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
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});

// 批量修复流程进度和状态
router.post("/api/v1/batch-fix-flow-progress", async (req, res) => {
  try {
    console.log("[API] 批量修复流程进度和状态 - 请求参数:", req.body);
    const { barcodes } = req.body;

    if (!Array.isArray(barcodes) || barcodes.length === 0) {
      return res.status(200).json({
        success: false,
        message: "请提供有效的条码数组",
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
        results.push({
          barcode,
          success: false,
          error: error.message,
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
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
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
      return res.status(200).json({
        success: false,
        message: "缺少必要参数或参数格式错误",
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
      return res.status(200).json({
        success: false,
        message: "存在重复扫描的条码",
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
    //   return res.status(200).json({
    //     success: false,
    //     message: "没有条码匹配成功",
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
      lineId
    );

    res.json({
      code: 200,
      success: true,
      data: result,
      processedResults,
      failedBarcodes,
    });
  } catch (error) {
    console.error("处理扫码请求失败:", error);
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
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
      data: result
    });
  } catch (error) {
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message
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
      message: "验证完成"
    });
  } catch (error) {
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message
    });
  }
});

// 检查条码节点完成情况
router.get("/api/v1/check-barcode-completion/:barcode", async (req, res) => {
  try {
    console.log("[API] 检查条码节点完成情况 - 请求参数:", { params: req.params, query: req.query });
    const { barcode } = req.params;
    
    if (!barcode) {
      return res.status(200).json({
        code: 400,
        success: false,
        message: "条码参数不能为空"
      });
    }

    const result = await MaterialProcessFlowService.checkBarcodeCompletion(barcode);
    
    res.json({
      code: 200,
      success: true,
      data: result
    });
  } catch (error) {
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
