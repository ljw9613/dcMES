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
    const {
      mainBarcode, // 主条码
      processStepId, // 工序ID
      componentScans, // 子物料条码数组
      userId, // 用户ID
      lineId // 产线ID
    } = req.body;

    // 参数验证
    if (!mainBarcode || !processStepId || !lineId || !Array.isArray(componentScans)) {
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
    const { barcode } = req.body;
    const result = await MaterialProcessFlowService.updateFlowNodes(barcode);
    res.json({
      code: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 获取物料相关的所有工序
router.get("/api/v1/all-process-steps/:materialId", async (req, res) => {
  try {
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
router.get('/api/v1/exportBOM', async (req, res) => {
    try {
        const { materialId } = req.query;
        if (!materialId) {
            return res.status(400).json({ error: '缺少必要参数: materialId' });
        }

        const bomData = await MaterialProcessFlowService.exportFlattenedBOMStructure(materialId);
        res.json({ data: bomData });
    } catch (error) {
        console.error('导出BOM失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 修复流程进度和状态
router.post("/api/v1/fix-flow-progress", async (req, res) => {
  try {
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
      message: "流程进度修复成功"
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
        const result = await MaterialProcessFlowService.fixFlowProgress(barcode);
        results.push({
          barcode,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          barcode,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      code: 200,
      success: true,
      data: results,
      message: "批量修复完成"
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
    const {
      mainBarcode, // 主条码
      processStepId, // 工序ID
      barcodes, // 子物料条码数组 [barcode1, barcode2, ...]
      userId, // 用户ID
      lineId // 产线ID
    } = req.body;
    console.log(req.body);

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
      scanOperation: true // 只获取需要扫码的物料
    }).populate('materialId');

    if (!processMaterials || processMaterials.length === 0) {
      return res.status(200).json({
        success: false,
        message: "未找到工序关联的物料信息",
      });
    }

    // 验证扫码数量是否匹配
    if (barcodes.length !== processMaterials.length) {
      return res.status(200).json({
        success: false,
        message: `扫码数量与要求不符，需要扫描 ${processMaterials.length} 个物料，实际扫描 ${barcodes.length} 个`,
      });
    }

    // 检查条码是否有重复
    const uniqueBarcodes = new Set(barcodes);
    if (uniqueBarcodes.size !== barcodes.length) {
      return res.status(200).json({
        success: false,
        message: "存在重复扫描的条码",
      });
    }

    // 获取所有条码对应的物料信息
    const barcodeResults = await Promise.all(barcodes.map(async (barcode) => {
      // 获取所有可能的条码规则
      const materialIds = processMaterials.map(pm => pm.materialId._id);
      
      // 1. 获取产品关联的条码规则
      const productRules = await productBarcodeRule.find({
        productId: { $in: materialIds }
      }).populate({
        path: 'barcodeRule',
        match: { enabled: true }
      });

      // 2. 获取全局条码规则
      const globalRules = await barcodeRule.find({
        enabled: true,
        isGlobal: true
      });

      // 处理和合并规则
      let rules = [];

      // 处理产品关联的规则
      rules = productRules
        .filter(item => item.barcodeRule) // 过滤掉无效的规则
        .map(item => ({
          ...item.barcodeRule.toObject(),
          priority: item.barcodeRule.priority || 0,
          isProductSpecific: true // 标记为产品特定规则
        }));

      // 添加全局规则（确保优先级最低）
      const globalRulesFormatted = globalRules.map(rule => ({
        ...rule.toObject(),
        priority: -1, // 设置最低优先级
        isProductSpecific: false // 标记为全局规则
      }));
      rules = rules.concat(globalRulesFormatted);

      // 按优先级排序（从高到低）
      rules.sort((a, b) => b.priority - a.priority);

      console.log('条码规则列表:', {
        productRules: rules.filter(r => r.isProductSpecific),
        globalRules: rules.filter(r => !r.isProductSpecific)
      });
      console.log(rules);

      let validationResult = null;
      
      // 对每个物料尝试所有规则
      for (const material of processMaterials) {
        // 跳过验证结果已找到的情况
        if (validationResult && validationResult.isValid) break;

        for (const rule of rules) {
          let isValid = true;

          // 验证规则
          for (const validation of rule.validationRules) {
            if (!validation.enabled) continue;

            switch (validation.type) {
              case "length":
                isValid = barcode.length === validation.params.length;
                break;
              case "prefix":
                isValid = barcode.startsWith(validation.params.value);
                break;
              case "regex":
                try {
                  const regex = new RegExp(validation.params.pattern);
                  isValid = regex.test(barcode);
                } catch (e) {
                  console.error("正则表达式错误:", e);
                  isValid = false;
                }
                break;
            }

            if (!isValid) break;
          }

          // 如果验证规则通过，执行提取规则
          if (isValid) {
            let materialCode = null;
            let relatedBill = null;

            for (const config of rule.extractionConfigs) {
              let extractValue = barcode;

              for (const step of config.steps) {
                if (!step.enabled) continue;

                switch (step.type) {
                  case "split":
                    const parts = extractValue.split(step.params.separator);
                    extractValue = parts[step.params.index] || "";
                    break;
                  case "substring":
                    extractValue = extractValue.substring(
                      step.params.start,
                      step.params.end
                    );
                    break;
                  case "regex":
                    try {
                      const regex = new RegExp(step.params.pattern);
                      const matches = extractValue.match(regex);
                      if (matches && matches[step.params.group]) {
                        extractValue = matches[step.params.group];
                      } else {
                        extractValue = "";
                      }
                    } catch (e) {
                      console.error("正则提取错误:", e);
                      extractValue = "";
                    }
                    break;
                }
              }

              // 存储提取结果
              switch (config.target) {
                case "materialCode":
                  materialCode = extractValue;
                  break;
                case "DI":
                  // 如果提取到DI，需要验证并获取对应的物料编码
                  const diResult = await MaterialProcessFlowService.validateDICode(
                    extractValue,
                    material.materialId
                  );
                  if (diResult.isValid) {
                    materialCode = diResult.materialCode;
                  } else {
                    isValid = false;
                  }
                  break;
                case "relatedBill":
                  relatedBill = extractValue;
                  break;
              }
            }

            // 验证提取的物料编码是否匹配
            if (materialCode === material.materialId.FNumber) {
              validationResult = {
                isValid: true,
                materialCode,
                relatedBill,
                ruleName: rule.name,
                ruleType: rule.isProductSpecific ? "product" : "global",
              };
              break;
            }
          }
        }
      }

      if (!validationResult || !validationResult.isValid) {
        throw new Error(`条码 ${barcode} 验证失败：不符合任何已配置的规则或物料不匹配`);
      }

      return {
        barcode,
        materialCode: validationResult.materialCode
      };
    }));

    // 匹配条码和物料ID
    const componentScans = [];
    for (const barcodeResult of barcodeResults) {
      const matchingMaterial = processMaterials.find(material => 
        material.materialId.FNumber === barcodeResult.materialCode
      );

      if (!matchingMaterial) {
        throw new Error(`条码 ${barcodeResult.barcode} 对应的物料编码 ${barcodeResult.materialCode} 不属于当前工序要求扫描的物料`);
      }

      componentScans.push({
        materialId: matchingMaterial.materialId._id,
        barcode: barcodeResult.barcode
      });
    }

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
    });
  } catch (error) {
    res.status(200).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
