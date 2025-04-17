const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const Craft = require("../model/project/craft");
const ProcessStep = require("../model/project/processStep");
const ProcessMaterials = require("../model/project/processMaterials");
const UnbindRecord = require("../model/project/unbindRecord");
const ProductionPlanWorkOrder = require("../model/project/productionPlanWorkOrder");
const productBarcodeRule = require("../model/project/productBarcodeRule");
const barcodeRule = require("../model/project/barcodeRule");
const mongoose = require("mongoose");
const productDiNum = mongoose.model("productDiNum");
const Material = mongoose.model("k3_BD_MATERIAL");
const Machine = mongoose.model("machine");
// const SystemLog = require("../model/project/systemLog");

const { v4: uuidv4 } = require("uuid");

class MaterialProcessFlowService {
  /**
   * 根据物料编码创建工艺流程记录
   * @param {string} mainMaterialId - 物料编码
   * @param {string} materialCode - 物料编码
   * @param {string} barcode - 物料条码
   * @param {string} productLineId - 产线ID
   * @param {string} productLineName - 产线名称
   * @returns {Promise<Object>} 创建的流程记录
   */
  static async createFlowByMaterialCode(
    mainMaterialId,
    materialCode,
    barcode,
    productLineId,
    productLineName
  ) {
    try {
      // 1. 获取物料信息
      const material = await Material.findOne({ _id: mainMaterialId });
      if (!material) {
        throw new Error(`未找到物料编码为 ${materialCode} 的物料信息`);
      }

      console.log(
        "🚀 ~ MaterialProcessFlowService ~ mainMaterialId:",
        mainMaterialId
      );

      // 2. 获取物料对应的工艺信息
      const craft = await Craft.findOne({ materialId: mainMaterialId });
      if (!craft) {
        throw new Error(`未找到物料 ${materialCode} 对应的工艺信息`);
      }

      // 3. 构建流程节点树，传入新的 Set 用于防止循环依赖
      const processNodes = await this.buildProcessNodes(
        material._id,
        craft,
        new Set()
      );

      console.log(
        "🚀 ~ MaterialProcessFlowService ~ processNodes:",
        processNodes
      );

      // 4. 创建流程记录，只在存在工单ID时添加相关字段
      const flowRecordData = {
        barcode,
        materialId: material._id,
        materialCode: material.FNumber,
        materialName: material.FName,
        materialSpec: material.FSpecification,
        isProduct: craft.isProduct,
        craftId: craft._id,
        craftVersion: craft.craftVersion,
        businessType: craft.businessType,
        processNodes,
        startTime: new Date(),
        status: "PENDING",
        productLineId,
        productLineName,
      };

      // 根据产线ID获取对应的工单
      const planWorkOrder = await ProductionPlanWorkOrder.findOne({
        productionLineId: productLineId,
        // materialId: material._id,
        status: "IN_PROGRESS",
      });

      console.log(
        "🚀 ~ MaterialProcessFlowService ~ planWorkOrder:",
        planWorkOrder
      );

      //成品工艺必须有产线计划才可以初始化
      if (craft.isProduct && !planWorkOrder) {
        throw new Error("成品工艺未查询到产线计划");
      }

      // 只有在工单ID存在时才添加到记录中
      if (planWorkOrder) {
        flowRecordData.productionPlanWorkOrderId = planWorkOrder._id;
      }

      const flowRecord = new MaterialProcessFlow(flowRecordData);

      // 5. 保存记录
      await flowRecord.save();

      return flowRecord;
    } catch (error) {
      console.error("创建工艺流程记录失败:", error);
      throw error;
    }
  }

  /**
   * 构建工艺流程节点树
   * @param {string} materialId - 物料ID
   * @param {Object} craft - 工艺信息
   * @param {Set} processedMaterials - 已处理的物料集合（用于防止循环引用）
   * @returns {Promise<Array>} 节点树数组
   */
  static async buildProcessNodes(
    materialId,
    craft,
    processedMaterials = new Set()
  ) {
    try {
      // 检查材料是否已处理过（检测循环依赖）
      if (processedMaterials.has(materialId.toString())) {
        console.warn(`检测到循环依赖, 材料ID: ${materialId}`);
        return [];
      }

      const nodes = [];
      // 添加当前材料到已处理集合
      processedMaterials.add(materialId.toString());

      // 创建根节点（主物料节点）
      const material = await Material.findById(materialId);
      const rootNode = {
        nodeId: uuidv4(),
        nodeType: "MATERIAL",
        materialId: material._id,
        materialCode: material.FNumber,
        materialName: material.FName,
        materialSpec: material.FSpecification,
        level: 0,
        craftId: craft._id,
        craftName: craft.craftName,
        status: "PENDING",
      };
      nodes.push(rootNode);

      // 修改工序节点查询方式
      // 原来的代码:
      // if (craft.processSteps && craft.processSteps.length > 0) {
      //   for (const stepId of craft.processSteps) {
      //     const processStep = await ProcessStep.findById(stepId);

      // 新的查询方式:
      const processSteps = await ProcessStep.find({
        craftId: craft._id,
        isMES: true,
      }).sort({
        sort: 1,
      });
      if (processSteps && processSteps.length > 0) {
        // 初始化实际生产顺序计数器
        let actualProcessSort = 1;

        for (const processStep of processSteps) {
          // 创建工序节点
          const processNode = {
            nodeId: uuidv4(),
            nodeType: "PROCESS_STEP",
            processStepId: processStep._id,
            processName: processStep.processName,
            processCode: processStep.processCode,
            processSort: actualProcessSort, // 使用实际生产顺序
            originalSort: processStep.sort || 0, // 保留原始sort值
            processType: processStep.processType,
            level: 1,
            parentNodeId: rootNode.nodeId,
            craftId: craft._id,
            craftName: craft.craftName,
            batchDocRequired: processStep.batchDocRequired || false,
            batchDocType: processStep.batchDocType,
            requireScan: processStep.batchDocRequired || true,
            status: "PENDING",
          };
          nodes.push(processNode);

          // 获取工序关联的物料
          const processMaterials = await ProcessMaterials.find({
            processStepId: processStep._id,
          });

          // 处理工序物料节点
          for (const processMaterial of processMaterials) {
            const material = await Material.findById(
              processMaterial.materialId
            );
            if (!material) continue;

            // 创建物料节点
            const materialNode = {
              nodeId: uuidv4(),
              nodeType: "MATERIAL",
              materialId: material._id,
              materialCode: material.FNumber,
              materialName: material.FName,
              materialSpec: material.FSpecification,
              materialQuantity: processMaterial.quantity,
              materialUnit: processMaterial.unit,
              isPackingBox: processMaterial.isPackingBox,
              level: 2,
              barcode: "",
              parentNodeId: processNode.nodeId,
              craftId: craft._id,
              craftName: craft.craftName,
              isComponent: processMaterial.isComponent,
              isKeyMaterial: processMaterial.isKey,
              scanOperation: processMaterial.scanOperation,
              requireScan: processMaterial.scanOperation,
              isBatch: processMaterial.isBatch,
              batchQuantity: processMaterial.batchQuantity,
              isRfid: processMaterial.isRfid,
              status: "PENDING",
            };
            nodes.push(materialNode);

            // 递归处理子物料的工艺，传入已处理的物料集合
            const subCraft = await Craft.findOne({
              materialId: material._id,
            });
            if (subCraft) {
              const subNodes = await this.buildProcessNodes(
                material._id,
                subCraft,
                processedMaterials // 传入已处理的物料集合
              );
              // 调整子节点的层级和父节点
              subNodes.forEach((node) => {
                node.level += materialNode.level;
                if (node.level === materialNode.level + 1) {
                  node.parentNodeId = materialNode.nodeId;
                }
              });
              nodes.push(...subNodes);
            }
          }

          // 增加实际生产顺序计数
          actualProcessSort++;
        }
      }

      return nodes;
    } catch (error) {
      console.error("构建工艺流程节点失败:", error);
      throw error;
    }
  }

  /**
   * 检查前置工序完成状态
   * @param {Array} processNodes - 所有工序节点
   * @param {Object} currentNode - 当前工序节点
   * @returns {Object} 包含检查结果和未完成工序信息
   */
  static checkPreviousProcessSteps(processNodes, currentNode) {
    const unfinishedSteps = [];

    // 获取当前节点的父物料节点
    const parentMaterialNode = processNodes.find(
      (node) => node.nodeId === currentNode.parentNodeId
    );
    if (!parentMaterialNode) return { isValid: true, unfinishedSteps: [] };

    // 获取同级的所有工序节点并按顺序排序
    const levelProcessSteps = processNodes
      .filter(
        (node) =>
          node.nodeType === "PROCESS_STEP" &&
          node.parentNodeId === parentMaterialNode.nodeId
      )
      .sort((a, b) => a.processSort - b.processSort);

    // 找到当前工序的索引
    const currentIndex = levelProcessSteps.findIndex(
      (step) => step.nodeId === currentNode.nodeId
    );

    // 检查当前工序之前的所有工序完成状态
    for (let i = 0; i < currentIndex; i++) {
      const step = levelProcessSteps[i];
      if (step.status !== "COMPLETED") {
        unfinishedSteps.push({
          processName: step.processName,
          processCode: step.processCode,
          status: step.status,
          level: step.level,
        });
      }
    }

    return {
      isValid: unfinishedSteps.length === 0,
      unfinishedSteps,
    };
  }

  /**
   * 获取节点的父物料节点链
   * @param {Array} processNodes - 所有节点
   * @param {Object} currentNode - 当前节点
   * @returns {Array} 父物料节点链（从当前层级到顶层）
   */
  static getParentMaterialChain(processNodes, currentNode) {
    const chain = [];
    let currentParentId = currentNode.parentNodeId;

    while (currentParentId) {
      const parentNode = processNodes.find(
        (node) => node.nodeId === currentParentId
      );
      if (!parentNode) break;

      if (parentNode.nodeType === "MATERIAL") {
        chain.push(parentNode);
      }
      currentParentId = parentNode.parentNodeId;
    }

    return chain;
  }

  /**
   * 批量扫描工序子物料条码
   * @param {string} mainBarcode - 主条码
   * @param {string} processStepId - 工序ID
   * @param {Array<{materialId: string, barcode: string}>} componentScans - 子物料扫描信息数组
   * @param {string} userId - 用户ID
   * @param {string} lineId - 产线ID
   */
  static async scanProcessComponents(
    mainBarcode,
    processStepId,
    componentScans,
    userId,
    lineId
  ) {
    try {
      // 1. 验证输入参数
      if (!mainBarcode) {
        throw new Error("主条码不能为空");
      }
      if (!processStepId) {
        throw new Error("工序ID不能为空");
      }
      if (!Array.isArray(componentScans)) {
        throw new Error("componentScans必须是数组");
      }
      if (!lineId) {
        throw new Error("产线ID不能为空");
      }

      // 2. 验证componentScans数组的每个元素
      componentScans.forEach((scan, index) => {
        if (!scan) {
          throw new Error(`componentScans中第${index + 1}个元素为空`);
        }
        if (!scan.materialId) {
          throw new Error(`componentScans中第${index + 1}个元素缺少materialId`);
        }
        if (!scan.barcode) {
          throw new Error(`componentScans中第${index + 1}个元素缺少barcode`);
        }
      });

      // 查找主条码对应的流程记录
      const flowRecord = await MaterialProcessFlow.findOne({
        barcode: mainBarcode,
      });

      if (!flowRecord) {
        throw new Error("未找到对应的主条码流程记录");
      }

      // 查找工序节点
      const processNode = flowRecord.processNodes.find(
        (node) =>
          node.processStepId &&
          node.processStepId.toString() === processStepId.toString() &&
          node.nodeType === "PROCESS_STEP"
      );

      // console.log("🚀 ~ MaterialProcessFlowService ~ processNode:", processNode);
      if (!processNode) {
        throw new Error("未找到对应的工序节点");
      }

      // 验证工序节点状态
      if (processNode.status !== "PENDING") {
        throw new Error("该主物料条码对应工序节点已完成或处于异常状态");
      }

      //TODO
      // 检查前置工序完成状态
      const checkResult = this.checkPreviousProcessSteps(
        flowRecord.processNodes,
        processNode
      );

      console.log(
        "🚀 ~ MaterialProcessFlowService ~ checkResult:",
        checkResult
      );

      if (!checkResult.isValid) {
        const unfinishedList = checkResult.unfinishedSteps
          .map((step) => `${step.processName}(${step.processCode})`)
          .join("、");
        throw new Error(
          `存在未完成的前置工序: ${unfinishedList}，请先完成前置工序`
        );
      }

      // 获取该工序下所有需要扫码的物料节点
      const materialNodes = flowRecord.processNodes.filter(
        (node) =>
          node.parentNodeId === processNode.nodeId &&
          node.nodeType === "MATERIAL" &&
          node.requireScan
      );

      // 验证扫码数量是否匹配
      if (componentScans.length !== materialNodes.length) {
        throw new Error(
          `扫码数量与要求不符，需要扫描 ${materialNodes.length} 个物料，实际扫描 ${componentScans.length} 个`
        );
      }

      // 检查条码是否有重复
      const uniqueBarcodes = new Set(
        componentScans.map((scan) => scan.barcode)
      );
      if (uniqueBarcodes.size !== componentScans.length) {
        throw new Error("存在重复扫描的条码");
      }

      // 添加关键物料条码重复使用和批次用量检查
      for (const scan of componentScans) {
        const matchingNode = materialNodes.find(
          (node) => node.materialId.toString() === scan.materialId.toString()
        );

        if (matchingNode) {
          // 检查批次用量限制
          if (matchingNode.isBatch && matchingNode.batchQuantity > 0) {
            // 查找所有使用该批次条码的记录
            const batchUsageFlows = await MaterialProcessFlow.find({
              processNodes: {
                $elemMatch: {
                  barcode: scan.barcode,
                  status: "COMPLETED",
                },
              },
            });

            // 计算当前批次已使用的次数
            const usageCount = batchUsageFlows.length;

            // 如果使用次数已达到或超过批次用量限制，抛出错误
            if (usageCount >= matchingNode.batchQuantity) {
              throw new Error(
                `批次物料条码 ${scan.barcode} 已达到使用次数限制(${matchingNode.batchQuantity}次)`
              );
            }
          }

          // 原有的关键物料检查逻辑
          if (matchingNode.isKeyMaterial) {
            // 检查该条码是否已被其他流程使用
            const existingFlows = await MaterialProcessFlow.find({
              processNodes: {
                $elemMatch: {
                  barcode: scan.barcode,
                  isKeyMaterial: true,
                  status: "COMPLETED",
                },
              },
            });

            if (existingFlows.length > 0) {
              // 排除当前流程记录
              const otherFlows = existingFlows.filter(
                (flow) => flow.barcode !== mainBarcode
              );

              if (otherFlows.length > 0) {
                // 获取使用该条码的流程信息
                const usageDetails = otherFlows.map((flow) => ({
                  mainBarcode: flow.barcode,
                  materialCode: flow.materialCode,
                  materialName: flow.materialName,
                  scanTime: flow.processNodes.find(
                    (n) => n.barcode === scan.barcode
                  )?.scanTime,
                }));

                throw new Error(
                  `关键物料条码 ${
                    scan.barcode
                  } 已被其他流程使用:\n${usageDetails
                    .map(
                      (detail) =>
                        `- 主条码: ${detail.mainBarcode}\n  物料: ${
                          detail.materialName
                        }(${
                          detail.materialCode
                        })\n  使用时间: ${detail.scanTime?.toLocaleString()}`
                    )
                    .join("\n")}`
                );
              }
            }
          }
        }
      }

      //检查该工序下的物料下是否对应绑定parentNodeId的工序、该工序下是否有需要扫码的物料,且该工序下的物料扫码是否完成
      for (const node of materialNodes) {
        const processNode = flowRecord.processNodes.find(
          (n) => n.parentNodeId === node.nodeId && n.nodeType === "PROCESS_STEP"
        );
        //该物料下有子绑定工序
        if (processNode) {
          //找出当前物料对应的物料条码
          const materialBarcode = componentScans.find(
            (scan) => scan.materialId.toString() === node.materialId.toString()
          );

          console.log(
            "🚀 ~ MaterialProcessFlowService ~ materialBarcode:",
            materialBarcode
          );

          // 添加空值检查
          if (!materialBarcode) {
            throw new Error(`未找到与物料ID ${node.materialId} 匹配的扫描记录`);
          }

          const subFlowRecord = await MaterialProcessFlow.findOne({
            barcode: materialBarcode.barcode,
          });

          // 添加空值检查
          if (!subFlowRecord) {
            throw new Error(
              `未找到条码为 ${materialBarcode.barcode} 的子物料流程记录`
            );
          }

          if (subFlowRecord.status !== "COMPLETED") {
            throw new Error(
              `该${materialBarcode.barcode}物料条码的子物料工序未完成`
            );
          }

          // 修改：使用递归函数处理多层级节点匹配
          await this.matchAndUpdateNodesRecursively(
            flowRecord.processNodes,
            subFlowRecord.processNodes,
            userId
          );
        }
      }

      // 验证每个扫描的物料ID是否匹配
      for (const scan of componentScans) {
        const matchingNode = materialNodes.find(
          (node) => node.materialId.toString() === scan.materialId.toString()
        );
        if (!matchingNode) {
          const invalidMaterial = await Material.findById(scan.materialId);
          const materialName = invalidMaterial
            ? invalidMaterial.FName
            : scan.materialId;
          throw new Error(`物料 ${materialName} 不属于当前工序要求扫描的物料`);
        }
      }

      // 在验证每个扫描的物料ID后，添加更新materialBarcodeBatch的逻辑
      for (const scan of componentScans) {
        // 尝试更新materialBarcodeBatch表中的使用状态
        try {
          await mongoose.model("materialBarcodeBatch").updateOne(
            {
              batchId: scan.barcode,
              isUsed: false, // 只更新未使用的记录
            },
            {
              $set: {
                isUsed: true,
                updateBy: userId,
                updateAt: new Date(),
              },
            }
          );
        } catch (error) {
          console.warn(`更新条码批次使用状态失败: ${scan.barcode}`, error);
          // 这里不抛出错误，因为不是所有条码都需要更新
        }
      }

      // 在更新节点状态之前，检查是否为首道或末道工序
      const processPosition = this.checkProcessPosition(
        flowRecord.processNodes,
        processNode
      );

      console.log("🚀 ~ MaterialProcessFlowService ~ processPosition:", lineId);
      console.log(
        "🚀 ~ MaterialProcessFlowService ~ processPosimaterialIdtion:",
        flowRecord.materialId
      );

      //根据产线获取对应的工单
      const planWorkOrder = await ProductionPlanWorkOrder.findOne({
        productionLineId: lineId,
        materialId: flowRecord.materialId,
        status: "IN_PROGRESS",
      });

      //成品条码必须有生产计划
      if (flowRecord.isProduct && !planWorkOrder) {
        throw new Error("未查询到生产工单");
      }

      //对比当前产线工单和条码的工单
      if (flowRecord.isProduct) {
        // 先检查planWorkOrder是否存在
        if (!planWorkOrder) {
          throw new Error("未找到有效的产线工单");
        }

        if (processPosition.isFirst) {
          //首道工序绑定可更新工单计划
          flowRecord.productionPlanWorkOrderId = planWorkOrder._id;
        } else {
          // 非首道工序才检查工单绑定
          if (!flowRecord.productionPlanWorkOrderId) {
            throw new Error("产品条码未绑定工单");
          }

          if (
            planWorkOrder._id.toString() !==
            flowRecord.productionPlanWorkOrderId.toString()
          ) {
            throw new Error("当前产线工单与产品条码工单不一致");
          }
        }
      }

      //检测当前工单是否可以继续投入 - 仅在首道工序时检查
      if (planWorkOrder && processPosition.isFirst) {
        if (
          planWorkOrder.inputQuantity >= planWorkOrder.planProductionQuantity
        ) {
          throw new Error("工单已达到计划数量，无法继续投入");
        }
      }

      // 如果是首道工序，且物料ID匹配，更新工单投入量
      if (planWorkOrder) {
        if (processPosition.isFirst) {
          try {
            await this.updateWorkOrderQuantity(planWorkOrder._id, "input");
          } catch (error) {
            // 这里可以选择继续执行或者其他处理方式
            throw new Error("更新工单投入量失败");
          }
        }
      }

      // 更新 processNodes 中的物料节点信息
      flowRecord.processNodes = await Promise.all(
        flowRecord.processNodes.map(async (node) => {
          // 保持现有的必需字段
          const baseNode = {
            level: node.level,
            nodeType: node.nodeType,
            nodeId: node.nodeId,
            ...node,
          };

          // 如果是当前工序的物料节点
          if (
            node.parentNodeId === processNode.nodeId &&
            node.nodeType === "MATERIAL"
          ) {
            if (node.requireScan) {
              const matchingScan = componentScans.find(
                (scan) =>
                  scan.materialId.toString() === node.materialId.toString()
              );
              if (matchingScan) {
                // 获取物料信息
                const material = await Material.findById(node.materialId);

                // 使用validateBarcodeWithMaterial方法验证条码并获取relatedBill
                const validationResult = await this.validateBarcodeWithMaterial(
                  matchingScan.barcode,
                  material
                );

                return {
                  ...baseNode,
                  barcode: matchingScan.barcode,
                  relatedBill: validationResult.relatedBill || "",
                  status: "COMPLETED",
                  scanTime: new Date(),
                  endTime: new Date(),
                  updateBy: userId,
                };
              }
            } else {
              return {
                ...baseNode,
                status: "COMPLETED",
                scanTime: new Date(),
                endTime: new Date(),
                updateBy: userId,
              };
            }
          }
          // 如果是当前工序节点
          else if (node.nodeId === processNode.nodeId) {
            return {
              ...baseNode,
              status: "COMPLETED",
              endTime: new Date(),
              updateBy: userId,
            };
          }
          return baseNode;
        })
      );

      // 如果是首个操作，更新整体流程的开始时间和状态
      if (!flowRecord.startTime) {
        flowRecord.startTime = new Date();
        flowRecord.status = "IN_PROCESS";
      }

      // 修改进度计算逻辑
      const calculateProgress = (nodes) => {
        // 只计算需要扫描的节点（requireScan为true的物料节点和所有工序节点）
        const requiredNodes = nodes.filter(
          (node) =>
            node.level !== 0 && // 排除根节点
            (node.nodeType === "PROCESS_STEP" ||
              (node.nodeType === "MATERIAL" && node.requireScan === true)) // 只计算requireScan为true的物料节点
        );

        const completedNodes = requiredNodes.filter(
          (node) => node.status === "COMPLETED"
        );

        return requiredNodes.length > 0
          ? Math.floor((completedNodes.length / requiredNodes.length) * 100)
          : 0;
      };

      // 在更新流程记录时使用
      flowRecord.progress = calculateProgress(flowRecord.processNodes);

      // 检查是否所有必要节点都已完成
      if (flowRecord.progress === 100) {
        const allRequiredCompleted = this.checkAllRequiredNodesCompleted(
          flowRecord.processNodes
        );
        if (allRequiredCompleted) {
          flowRecord.status = "COMPLETED";
          flowRecord.endTime = new Date();
          // 更新根节点状态
          const rootNode = flowRecord.processNodes.find(
            (node) => node.level === 0 && node.nodeType === "MATERIAL"
          );
          if (rootNode) {
            rootNode.status = "COMPLETED";
            rootNode.endTime = new Date();
          }
        }
      }
      if (planWorkOrder) {
        // 如果是末道工序且所有节点完成，更新工单产出量  && flowRecord.progress === 100
        if (processPosition.isLast) {
          try {
            await this.updateWorkOrderQuantity(planWorkOrder._id, "output");
          } catch (error) {
            console.warn("更新工单产出量失败:", error.message);
            // 这里可以选择继续执行或者其他处理方式
          }
        }
      }

      // 保存更新
      await flowRecord.save();

      // 检查主物料条码是否已使用
      try {
        await mongoose.model("preProductionBarcode").updateOne(
          {
            printBarcode: mainBarcode,
            status: "PENDING", // 只更新未使用的记录
          },
          {
            $set: {
              status: "USED",
              usedBy: userId,
              usedAt: new Date(),
            },
          }
        );
      } catch (error) {
        console.warn(`更新条码批次使用状态失败: ${mainBarcode}`, error);
        // 这里不抛出错误，因为不是所有条码都需要更新
      }
      // 修复一下异常节点
      await this.autoFixInconsistentProcessNodes(mainBarcode);

      // 在完成扫描组件后，添加以下代码来更新流程状态
      await this.fixFlowProgress(mainBarcode);

      return flowRecord;
    } catch (error) {
      console.error("扫描批次单据失败:", error);
      throw error;
    }
  }

  // 新增递归匹配方法
  static async matchAndUpdateNodesRecursively(
    targetNodes,
    sourceNodes,
    userId
  ) {
    // 1. 首先匹配相同materialId的物料节点
    for (const sourceNode of sourceNodes) {
      if (sourceNode.nodeType === "MATERIAL") {
        const matchingNodes = targetNodes.filter(
          (node) =>
            node.materialId &&
            node.materialCode === sourceNode.materialCode &&
            node.materialId.toString() === sourceNode.materialId.toString()
        );

        // 对找到的每个匹配节点进行更新
        for (const targetNode of matchingNodes) {
          // 仅当目标节点状态为PENDING且源节点已完成时更新
          if (
            targetNode.status === "PENDING" &&
            sourceNode.status === "COMPLETED"
          ) {
            targetNode.barcode = sourceNode.barcode;
            if (
              sourceNode.barcode.includes("-") &&
              sourceNode.barcode.length < 30
            ) {
              targetNode.relatedBill = sourceNode.barcode.split("-")[1];
            }
            targetNode.scanTime = sourceNode.scanTime;
            targetNode.endTime = sourceNode.endTime;
            targetNode.status = sourceNode.status;
            targetNode.updateBy = userId;
          }
        }
      }

      // 2. 匹配相同processStepId的工序节点
      if (sourceNode.nodeType === "PROCESS_STEP") {
        const matchingNodes = targetNodes.filter(
          (node) =>
            node.processStepId &&
            node.processCode === sourceNode.processCode &&
            node.processStepId.toString() ===
              sourceNode.processStepId.toString()
        );

        for (const targetNode of matchingNodes) {
          if (
            targetNode.status === "PENDING" &&
            sourceNode.status === "COMPLETED"
          ) {
            targetNode.barcode = sourceNode.barcode;
            if (
              sourceNode.barcode.includes("-") &&
              sourceNode.barcode.length < 30
            ) {
              targetNode.relatedBill = sourceNode.barcode.split("-")[1];
            }
            targetNode.scanTime = sourceNode.scanTime;
            targetNode.endTime = sourceNode.endTime;
            targetNode.status = sourceNode.status;
            targetNode.updateBy = userId;
          }
        }
      }
    }
  }

  /**
   * 工序解绑
   * @param {string} mainBarcode - 主条码
   * @param {string} processStepId - 工序ID
   * @param {string} userId - 用户ID
   * @param {string} reason - 解绑原因
   * @param {boolean} unbindSubsequent - 是否解绑后续工序
   * @param {boolean} fromPalletUnbind - 是否来自托盘解绑
   */
  static async unbindProcessComponents(
    mainBarcode,
    processStepId,
    userId,
    reason,
    unbindSubsequent = false,
    fromPalletUnbind = false
  ) {
    let maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log(
          `开始解绑工序组件: ${mainBarcode}, 工序ID: ${processStepId}, fromPalletUnbind: ${fromPalletUnbind}, 重试次数: ${retryCount}`
        );
        // 查找主条码对应的流程记录
        const flowRecord = await MaterialProcessFlow.findOne({
          barcode: mainBarcode,
        });
        if (!flowRecord) {
          throw new Error("未找到对应的主条码流程记录");
        }

        // 查找工序节点
        const processNode = flowRecord.processNodes.find(
          (node) =>
            node.processStepId &&
            node.processStepId.toString() === processStepId.toString() &&
            node.nodeType === "PROCESS_STEP"
        );
        if (!processNode) {
          throw new Error("未找到对应的工序节点");
        }

        // 验证工序节点状态
        if (processNode.status !== "COMPLETED") {
          throw new Error("该工序未完成，无需解绑");
        }

        // 获取需要解绑的工序节点列表
        const processNodesToUnbind = [];
        const parentMaterialNode = flowRecord.processNodes.find(
          (node) => node.nodeId === processNode.parentNodeId
        );

        if (parentMaterialNode) {
          // 获取同级的所有工序节点并按顺序排序
          const levelProcessSteps = flowRecord.processNodes
            .filter(
              (node) =>
                node.nodeType === "PROCESS_STEP" &&
                node.parentNodeId === parentMaterialNode.nodeId
            )
            .sort((a, b) => a.processSort - b.processSort);

          // 找到当前工序的索引
          const currentIndex = levelProcessSteps.findIndex(
            (step) => step.nodeId === processNode.nodeId
          );

          if (unbindSubsequent) {
            // 如果需要解绑后续工序，则获取当前工序及其后的所有工序
            processNodesToUnbind.push(
              ...levelProcessSteps
                .slice(currentIndex)
                .filter((node) => node.status === "COMPLETED")
            );
          } else {
            // 否则只解绑当前工序
            processNodesToUnbind.push(processNode);
          }
        }

        // 检查是否包含首道工序，以决定是否需要减少工单的投入量
        let hasFirstProcess = false;

        // 强化防止循环调用：处理托盘相关的解绑逻辑
        if (!fromPalletUnbind) {
          console.log("processNodesToUnbind", processNodesToUnbind);
          for (const processNodeToUnbind of processNodesToUnbind) {
            // 检查是否是托盘工序
            console.log("processNodeToUnbind", processNodeToUnbind.processType);
            if (processNodeToUnbind.processType === "F") {
              try {
                // 查找相关的托盘记录
                const palletRecord = await mongoose
                  .model("material_palletizing")
                  .findOne({
                    "palletBarcodes.barcode": mainBarcode,
                    processStepId: processNodeToUnbind.processStepId,
                  });

                if (palletRecord) {
                  // 对托盘进行解绑操作，显式传递fromProcessUnbind=true，防止循环调用
                  const MaterialPalletizingService = require("./materialPalletizing");
                  await MaterialPalletizingService.unbindBarcode(
                    palletRecord.palletCode,
                    mainBarcode,
                    userId,
                    reason || "工序解绑引起的托盘解绑",
                    true // 这里明确传递true，表示来自工序解绑
                  );
                  console.log(
                    `已从托盘 ${palletRecord.palletCode} 解绑条码 ${mainBarcode}`
                  );
                }
              } catch (error) {
                console.warn(`解绑托盘记录失败: ${error.message}`);
                // 发生托盘解绑错误，但继续流程，不抛出异常中断整个解绑过程
                console.error(`解绑托盘记录失败 ${error.message}，但继续执行工序解绑流程`);
              }
            }
          }
        }

        // 验证处理的节点中是否包含首道工序
        for (const processNodeToUnbind of processNodesToUnbind) {
          const processPosition = this.checkProcessPosition(
            flowRecord.processNodes,
            processNodeToUnbind
          );
          if (processPosition.isFirst) {
            hasFirstProcess = true;
            break;
          }
        }

        // 如果包含首道工序且存在工单ID，则减少工单投入量
        if (
          hasFirstProcess &&
          flowRecord.productionPlanWorkOrderId &&
          flowRecord.isProduct
        ) {
          try {
            // 传入-1表示减少一个单位的投入量
            await this.updateWorkOrderQuantity(
              flowRecord.productionPlanWorkOrderId,
              "input",
              -1
            );
            console.log(`工单${flowRecord.productionPlanWorkOrderId}投入量-1`);
          } catch (error) {
            console.error("更新工单投入量失败:", error);
            // 这里选择继续执行而不抛出错误，以免影响解绑流程
          }
        }

        // 获取所有需要解绑的物料节点
        const materialNodesToUnbind = [];
        for (const processNodeToUnbind of processNodesToUnbind) {
          const materialNodes = flowRecord.processNodes.filter(
            (node) =>
              node.parentNodeId === processNodeToUnbind.nodeId &&
              node.nodeType === "MATERIAL" &&
              node.status === "COMPLETED"
          );
          materialNodesToUnbind.push(...materialNodes);
        }

        // 修改解绑记录的创建部分
        for (const processNodeToUnbind of processNodesToUnbind) {
          // 获取当前工序相关的物料节点
          const relatedMaterialNodes = flowRecord.processNodes.filter(
            (node) =>
              node.parentNodeId === processNodeToUnbind.nodeId &&
              node.nodeType === "MATERIAL" &&
              node.status === "COMPLETED"
          );

          // 为每个工序创建独立的解绑记录
          const unbindRecord = new UnbindRecord({
            flowRecordId: flowRecord._id,
            mainBarcode,
            processStepId: processNodeToUnbind.processStepId,
            processName: processNodeToUnbind.processName,
            processCode: processNodeToUnbind.processCode,
            unbindMaterials: relatedMaterialNodes.map((node) => ({
              materialId: node.materialId,
              materialCode: node.materialCode,
              materialName: node.materialName,
              originalBarcode: node.barcode || "",
            })),
            operatorId: userId,
            reason,
            unbindSubsequent:
              unbindSubsequent &&
              processNodeToUnbind.nodeId === processNode.nodeId, // 只在触发解绑的工序记录上标记
            affectedProcesses: [
              {
                processStepId: processNodeToUnbind.processStepId,
                processName: processNodeToUnbind.processName,
                processCode: processNodeToUnbind.processCode,
              },
            ],
            fromPalletUnbind,
          });
          await unbindRecord.save();
        }

        // 更新流程节点状态
        flowRecord.processNodes = flowRecord.processNodes.map((node) => {
          // 处理需要解绑的工序节点
          if (processNodesToUnbind.some((p) => p.nodeId === node.nodeId)) {
            return {
              ...node,
              status: "PENDING",
              endTime: null,
              updateBy: userId,
            };
          }

          // 处理需要解绑的物料节点及其所有子节点
          for (const materialNode of materialNodesToUnbind) {
            // 如果是直接关联的物料节点
            if (node.nodeId === materialNode.nodeId) {
              return {
                ...node,
                status: "PENDING",
                barcode: "",
                relatedBill: "",
                scanTime: null,
                endTime: null,
                updateBy: userId,
              };
            }

            // 处理物料节点的子节点
            const childNodeIds = this.getAllChildNodes(
              flowRecord.processNodes,
              materialNode.nodeId
            );
            if (childNodeIds.includes(node.nodeId)) {
              return {
                ...node,
                status: "PENDING",
                barcode: "",
                relatedBill: "",
                scanTime: null,
                endTime: null,
                updateBy: userId,
              };
            }
          }

          return node;
        });

        // 更新整体进度
        const completedNodes = flowRecord.processNodes.filter(
          (node) => node.status === "COMPLETED" && node.level !== 0
        ).length;
        flowRecord.progress = Math.floor(
          (completedNodes / (flowRecord.processNodes.length - 1)) * 100
        );

        // 更新整体状态
        if (flowRecord.status === "COMPLETED") {
          flowRecord.status = "IN_PROCESS";
          flowRecord.endTime = null;
          // 重置根节点状态
          const materialNode = flowRecord.processNodes.find(
            (node) => node.nodeType === "MATERIAL" && node.level === 0
          );
          if (materialNode) {
            materialNode.status = "PENDING";
            materialNode.endTime = null;
          }
        }

        // 保存更新
        try {
          await flowRecord.save();
          console.log(`完成解绑工序组件: ${mainBarcode}, 工序ID: ${processStepId}`);
          return flowRecord;
        } catch (saveError) {
          // 如果是版本冲突异常且未超过最大重试次数，则重试
          if (saveError.name === 'VersionError' && retryCount < maxRetries - 1) {
            console.log(`发生版本冲突，正在进行第${retryCount + 1}次重试...`);
            retryCount++;
            continue;
          }
          throw saveError;
        }
      } catch (error) {
        // 如果是版本冲突异常且未超过最大重试次数，则重试
        if (error.name === 'VersionError' && retryCount < maxRetries - 1) {
          console.log(`发生版本冲突，正在进行第${retryCount + 1}次重试...`);
          retryCount++;
          continue;
        }
        
        console.error("物料解绑有误:", error);
        throw error;
      }
    }
    
    throw new Error(`解绑工序组件失败：已达到最大重试次数(${maxRetries}次)`);
  }

  /**
   * 获取指定节点的所有子节点ID
   * @param {Array} nodes - 所有节点
   * @param {string} parentId - 父节点ID
   * @returns {Array} 子节点ID数组
   */
  static getAllChildNodes(nodes, parentId) {
    const childNodes = [];

    const findChildren = (currentParentId) => {
      nodes.forEach((node) => {
        if (node.parentNodeId === currentParentId) {
          childNodes.push(node.nodeId);
          findChildren(node.nodeId);
        }
      });
    };

    findChildren(parentId);
    return childNodes;
  }

  /**
   * 判断一个节点是否是另一个节点的子节点
   * @param {Array} nodes - 所有节点
   * @param {string} parentId - 可能的父节点ID
   * @param {string} nodeId - 待检查的节点ID
   * @returns {boolean} 是否为子节点
   */
  static isChildNode(nodes, parentId, nodeId) {
    const childNodes = this.getAllChildNodes(nodes, parentId);
    return childNodes.includes(nodeId);
  }

  /**
   * 更新工艺流程记录节点
   * @param {string} barcode - 主条码
   * @returns {Promise<Object>} 更新后的流程记录
   */
  static async updateFlowNodes(barcode) {
    try {
      // 1. 获取现有流程记录
      const flowRecord = await MaterialProcessFlow.findOne({ barcode });
      if (!flowRecord) {
        throw new Error(`未找到条码为 ${barcode} 的流程记录`);
      }

      // 2. 获取最新的工艺信息
      const craft = await Craft.findOne({ materialId: flowRecord.materialId });
      if (!craft) {
        throw new Error(`未找到物料 ${flowRecord.materialCode} 对应的工艺信息`);
      }

      // 3. 构建新的流程节点树
      const newProcessNodes = await this.buildProcessNodes(
        flowRecord.materialId,
        craft,
        new Set()
      );

      // 4. 合并新旧节点时，需要特别处理未完成节点的情况
      const updatedNodes = [];
      const processedNodeIds = new Set();
      let hasUnfinishedNodesDeleted = false; // 新增标记，用于跟踪是否有未完成的节点被删除

      // 处理所有旧节点（不仅是已完成的）
      for (const oldNode of flowRecord.processNodes) {
        const newNode = newProcessNodes.find((node) => {
          if (
            oldNode.nodeType === "PROCESS_STEP" &&
            node.nodeType === "PROCESS_STEP"
          ) {
            return (
              node.processCode === oldNode.processCode &&
              node.level === oldNode.level &&
              this.findParentMaterialMatch(
                flowRecord.processNodes,
                newProcessNodes,
                oldNode,
                node
              )
            );
          }
          if (oldNode.nodeType === "MATERIAL" && node.nodeType === "MATERIAL") {
            return (
              node.materialId.toString() === oldNode.materialId.toString() &&
              node.level === oldNode.level &&
              this.findParentProcessMatch(
                flowRecord.processNodes,
                newProcessNodes,
                oldNode,
                node
              )
            );
          }
          return false;
        });

        if (newNode) {
          // 保留节点的原有状态
          updatedNodes.push({
            ...newNode,
            status: oldNode.status,
            barcode: oldNode.barcode || "",
            scanTime: oldNode.scanTime,
            endTime: oldNode.endTime,
            updateBy: oldNode.updateBy,
          });
          processedNodeIds.add(newNode.nodeId);
        } else {
          // 如果节点被删除且未完成，标记hasUnfinishedNodesDeleted
          if (oldNode.status !== "COMPLETED") {
            hasUnfinishedNodesDeleted = true;
          }
          // 记录节点删除
          await this.recordNodeDeletion(flowRecord._id, oldNode);
        }
      }

      // 添加新增的节点
      newProcessNodes.forEach((newNode) => {
        if (!processedNodeIds.has(newNode.nodeId)) {
          updatedNodes.push({
            ...newNode,
            status: "PENDING",
            barcode: "",
            scanTime: null,
            endTime: null,
            updateBy: null,
          });
        }
      });

      // 按照节点层级和工序顺序排序
      updatedNodes.sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        if (a.nodeType === "PROCESS_STEP" && b.nodeType === "PROCESS_STEP") {
          return (a.processSort || 0) - (b.processSort || 0);
        }
        return 0;
      });

      // 5. 更新流程记录
      flowRecord.processNodes = updatedNodes;
      flowRecord.craftVersion = craft.craftVersion;

      // 6. 保存更新
      await flowRecord.save();

      // 7. 使用fixFlowProgress方法统一处理进度和状态更新
      await this.fixFlowProgress(barcode);

      // 8. 重新获取更新后的记录
      const updatedFlowRecord = await MaterialProcessFlow.findOne({ barcode });

      return updatedFlowRecord;
    } catch (error) {
      console.error("更新工艺流程记录失败:", error);
      throw error;
    }
  }

  // 新增辅助方法：检查父物料节点匹配
  static findParentMaterialMatch(oldNodes, newNodes, oldNode, newNode) {
    const oldParent = oldNodes.find((n) => n.nodeId === oldNode.parentNodeId);
    const newParent = newNodes.find((n) => n.nodeId === newNode.parentNodeId);

    if (!oldParent || !newParent) return false;

    return (
      oldParent.materialId?.toString() === newParent.materialId?.toString()
    );
  }

  // 新增辅助方法：检查父工序节点匹配
  static findParentProcessMatch(oldNodes, newNodes, oldNode, newNode) {
    const oldParent = oldNodes.find((n) => n.nodeId === oldNode.parentNodeId);
    const newParent = newNodes.find((n) => n.nodeId === newNode.parentNodeId);

    if (!oldParent || !newParent) return false;

    return oldParent.processCode === newParent.processCode;
  }

  // 新增辅助方法：检查所有必要节点是否完成
  static checkAllRequiredNodesCompleted(nodes) {
    const requiredNodes = nodes.filter(
      (node) =>
        node.level !== 0 &&
        (node.nodeType === "PROCESS_STEP" ||
          (node.nodeType === "MATERIAL" && node.requireScan))
    );

    return (
      requiredNodes.length > 0 &&
      requiredNodes.every((node) => node.status === "COMPLETED")
    );
  }

  // 新增辅助方法：记录节点删除历史
  static async recordNodeDeletion(flowRecordId, deletedNode) {
    // 这里可以实现记录节点删除的逻辑
    // 例如：创建一个新的集合来跟踪删除的节点历史
    console.log(`节点被删除: ${deletedNode.nodeId} 从流程 ${flowRecordId}`);
  }

  static async getAllProcessSteps(
    materialId,
    level = 0,
    processedMaterials = new Set()
  ) {
    try {
      // 防止循环引用
      if (processedMaterials.has(materialId)) {
        return [];
      }

      processedMaterials.add(materialId);

      // 查询工艺路线
      const craft = await Craft.findOne({ materialId });
      if (!craft) {
        return [];
      }

      // 查询工序步骤
      const processSteps = await ProcessStep.find({
        craftId: craft._id,
      })
        .populate("machineId")
        .populate("machineIds")
        .sort({ sort: 1 });

      const result = [];

      // 处理每个工序
      for (const step of processSteps) {
        const stepData = {
          ...step.toObject(),
          levelPrefix: "┗".repeat(level),
        };
        result.push(stepData);

        // 查询工序关联的物料
        const processMaterials = await ProcessMaterials.find({
          processStepId: step._id,
        });

        // 递归处理子物料的工序
        for (const material of processMaterials) {
          const childSteps = await this.getAllProcessSteps(
            material.materialId,
            level + 1,
            processedMaterials
          );
          result.push(...childSteps);
        }
      }

      return result;
    } catch (error) {
      console.error("获取工序失败:", error);
      throw new Error("获取工序失败: " + error.message);
    }
  }

  /**
   * 扫描批次单据
   * @param {string} mainBarcode - 主条码
   * @param {string} processStepId - 工序ID
   * @param {string} batchDocNumber - 批次单据号
   * @param {Array} componentScans - 子物料信息
   * @param {string} userId - 用户ID
   * @param {string} lineId - 产线ID
   */
  static async scanBatchDocument(
    mainBarcode,
    processStepId,
    batchDocNumber,
    componentScans,
    userId,
    lineId
  ) {
    try {
      // 查找主条码对应的流程记录
      const flowRecord = await MaterialProcessFlow.findOne({
        barcode: mainBarcode,
      });
      if (!flowRecord) {
        throw new Error("未找到对应的主条码流程记录");
      }

      // 查找特殊工序节点
      const processNode = flowRecord.processNodes.find(
        (node) =>
          node.processStepId &&
          node.processStepId.toString() === processStepId.toString() &&
          node.nodeType === "PROCESS_STEP"
      );

      if (!processNode) {
        throw new Error("未找到对应的工序节点");
      }

      // 验证工序节点状态
      if (processNode.status !== "PENDING") {
        throw new Error("该工序节点已完成或处于异常状态");
      }

      //TODO 检查前置工序完成状态
      const checkResult = this.checkPreviousProcessSteps(
        flowRecord.processNodes,
        processNode
      );

      if (!checkResult.isValid) {
        const unfinishedList = checkResult.unfinishedSteps
          .map((step) => `${step.processName}(${step.processCode})`)
          .join("、");
        throw new Error(
          `存在未完成的前置工序: ${unfinishedList}，请先完成前置工序`
        );
      }

      // 获取该工序下所有需要扫码的物料节点
      const materialNodes = flowRecord.processNodes.filter(
        (node) =>
          node.parentNodeId === processNode.nodeId &&
          node.nodeType === "MATERIAL" &&
          node.requireScan
      );

      // 如果提供了 componentScans，验证扫码数量是否匹配
      if (componentScans && componentScans.length > 0) {
        if (componentScans.length !== materialNodes.length) {
          throw new Error(
            `扫码数量与要求不符，需要扫描 ${materialNodes.length} 个物料，实际扫描 ${componentScans.length} 个`
          );
        }

        // 检查条码是否有重复
        const uniqueBarcodes = new Set(
          componentScans.map((scan) => scan.barcode)
        );
        if (uniqueBarcodes.size !== componentScans.length) {
          throw new Error("存在重复扫描的条码");
        }

        // 添加关键物料条码重复使用和批次用量检查
        for (const scan of componentScans) {
          const matchingNode = materialNodes.find(
            (node) => node.materialId.toString() === scan.materialId.toString()
          );

          if (matchingNode) {
            // 检查批次用量限制
            if (matchingNode.isBatch && matchingNode.batchQuantity > 0) {
              const batchUsageFlows = await MaterialProcessFlow.find({
                processNodes: {
                  $elemMatch: {
                    barcode: scan.barcode,
                    status: "COMPLETED",
                  },
                },
              });

              const usageCount = batchUsageFlows.length;
              if (usageCount >= matchingNode.batchQuantity) {
                throw new Error(
                  `批次物料条码 ${scan.barcode} 已达到使用次数限制(${matchingNode.batchQuantity}次)`
                );
              }
            }

            // 关键物料检查
            if (matchingNode.isKeyMaterial) {
              const existingFlows = await MaterialProcessFlow.find({
                processNodes: {
                  $elemMatch: {
                    barcode: scan.barcode,
                    isKeyMaterial: true,
                    status: "COMPLETED",
                  },
                },
              });

              if (existingFlows.length > 0) {
                const otherFlows = existingFlows.filter(
                  (flow) => flow.barcode !== mainBarcode
                );

                if (otherFlows.length > 0) {
                  const usageDetails = otherFlows.map((flow) => ({
                    mainBarcode: flow.barcode,
                    materialCode: flow.materialCode,
                    materialName: flow.materialName,
                    scanTime: flow.processNodes.find(
                      (n) => n.barcode === scan.barcode
                    )?.scanTime,
                  }));

                  throw new Error(
                    `关键物料条码 ${
                      scan.barcode
                    } 已被其他流程使用:\n${usageDetails
                      .map(
                        (detail) =>
                          `- 主条码: ${detail.mainBarcode}\n  物料: ${
                            detail.materialName
                          }(${
                            detail.materialCode
                          })\n  使用时间: ${detail.scanTime?.toLocaleString()}`
                      )
                      .join("\n")}`
                  );
                }
              }
            }
          }
        }

        // 更新物料节点信息
        flowRecord.processNodes = await Promise.all(
          flowRecord.processNodes.map(async (node) => {
            // 保持现有的必需字段
            const baseNode = {
              level: node.level,
              nodeType: node.nodeType,
              nodeId: node.nodeId,
              ...node,
            };

            // 如果是当前工序的物料节点
            if (
              node.parentNodeId === processNode.nodeId &&
              node.nodeType === "MATERIAL"
            ) {
              if (node.requireScan) {
                const matchingScan = componentScans.find(
                  (scan) =>
                    scan.materialId.toString() === node.materialId.toString()
                );
                if (matchingScan) {
                  // 获取物料信息
                  const material = await Material.findById(node.materialId);

                  // 使用validateBarcodeWithMaterial方法验证条码并获取relatedBill
                  const validationResult =
                    await this.validateBarcodeWithMaterial(
                      matchingScan.barcode,
                      material
                    );

                  return {
                    ...baseNode,
                    barcode: matchingScan.barcode,
                    relatedBill: validationResult.relatedBill || "",
                    status: "COMPLETED",
                    scanTime: new Date(),
                    endTime: new Date(),
                    updateBy: userId,
                  };
                }
              } else {
                return {
                  ...baseNode,
                  status: "COMPLETED",
                  scanTime: new Date(),
                  endTime: new Date(),
                  updateBy: userId,
                };
              }
            }
            // 如果是当前工序节点
            else if (node.nodeId === processNode.nodeId) {
              return {
                ...baseNode,
                status: "COMPLETED",
                endTime: new Date(),
                updateBy: userId,
              };
            }
            return baseNode;
          })
        );

        // 更新 materialBarcodeBatch 表
        for (const scan of componentScans) {
          try {
            await mongoose.model("materialBarcodeBatch").updateOne(
              {
                batchId: scan.barcode,
                isUsed: false,
              },
              {
                $set: {
                  isUsed: true,
                  updateBy: userId,
                  updateAt: new Date(),
                },
              }
            );
          } catch (error) {
            console.warn(`更新条码批次使用状态失败: ${scan.barcode}`, error);
          }
        }
      }

      // 在更新节点状态之前，检查是否为首道或末道工序
      const processPosition = this.checkProcessPosition(
        flowRecord.processNodes,
        processNode
      );

      //根据产线获取对应的工单
      const planWorkOrder = await ProductionPlanWorkOrder.findOne({
        productionLineId: lineId,
        materialId: flowRecord.materialId,
        status: "IN_PROGRESS",
      });

      //成品条码必须有生产计划
      if (flowRecord.isProduct && !planWorkOrder) {
        throw new Error("未查询到生产工单");
      }

      if (processPosition.isFirst) {
        //首道工序绑定可更新工单计划
        flowRecord.productionPlanWorkOrderId = planWorkOrder._id;
      } else {
        // 非首道工序才检查工单绑定
        if (!flowRecord.productionPlanWorkOrderId) {
          throw new Error("产品条码未绑定工单");
        }

        if (
          planWorkOrder._id.toString() !==
          flowRecord.productionPlanWorkOrderId.toString()
        ) {
          throw new Error("当前产线工单与产品条码工单不一致");
        }
      }

      //检测当前工单是否可以继续投入 - 仅在首道工序时检查
      if (planWorkOrder && processPosition.isFirst) {
        if (
          planWorkOrder.inputQuantity >= planWorkOrder.planProductionQuantity
        ) {
          throw new Error("工单已达到计划数量，无法继续投入");
        }
      }

      // 如果是首道工序，且物料ID匹配，更新工单投入量
      if (planWorkOrder) {
        if (processPosition.isFirst) {
          //检测当前工单是否可以继续投入
          if (planWorkOrder.inputQuantity >= planWorkOrder.planQuantity) {
            throw new Error("工单已达到计划数量，无法继续投入");
          }

          try {
            await this.updateWorkOrderQuantity(planWorkOrder._id, "input");
          } catch (error) {
            // 这里可以选择继续执行或者其他处理方式
            throw new Error("更新工单投入量失败");
          }
        }
      }

      // 更新工序节点信息
      processNode.batchDocNumber = batchDocNumber;
      processNode.status = "COMPLETED";
      processNode.scanTime = new Date();
      processNode.endTime = new Date();
      processNode.updateBy = userId;

      // 如果是首个操作，更新整体流程的开始时间和状态
      if (!flowRecord.startTime) {
        flowRecord.startTime = new Date();
        flowRecord.status = "IN_PROCESS";
      }

      // 修改进度计算逻辑，只计算必要节点
      const requiredNodes = flowRecord.processNodes.filter(
        (node) =>
          node.level !== 0 &&
          (node.nodeType === "PROCESS_STEP" ||
            (node.nodeType === "MATERIAL" && node.requireScan))
      );

      const completedNodes = requiredNodes.filter(
        (node) => node.status === "COMPLETED"
      );

      flowRecord.progress =
        requiredNodes.length > 0
          ? Math.floor((completedNodes.length / requiredNodes.length) * 100)
          : 0;

      // 检查是否所有节点都已完成
      if (flowRecord.progress === 100) {
        const allRequiredCompleted = this.checkAllRequiredNodesCompleted(
          flowRecord.processNodes
        );
        if (allRequiredCompleted) {
          flowRecord.status = "COMPLETED";
          flowRecord.endTime = new Date();
          const materialNode = flowRecord.processNodes.find(
            (node) => node.nodeType === "MATERIAL" && node.level === 0
          );
          if (materialNode) {
            materialNode.status = "COMPLETED";
            materialNode.endTime = new Date();
          }
        } else {
          flowRecord.status = "IN_PROCESS";
          flowRecord.progress = 99; // 防止显示100%但实际未完全完成
        }
      }

      //TODO && flowRecord.progress === 100
      if (planWorkOrder) {
        // 如果是末道工序且所有节点完成，更新工单产出量
        // TODO
        if (processPosition.isLast) {
          try {
            await this.updateWorkOrderQuantity(planWorkOrder._id, "output");
          } catch (error) {
            console.warn("更新工单产出量失败:", error.message);
            // 这里可以选择继续执行或者其他处理方式
          }
        }
      }

      // 保存更新
      await flowRecord.save();

      // 在完成扫描组件后，添加以下代码来更新流程状态
      await this.fixFlowProgress(mainBarcode);

      return flowRecord;
    } catch (error) {
      console.error("扫描批次单据失败:", error);
      throw error;
    }
  }

  /**
   * 更新工单数量
   * @param {string} workOrderId - 工单ID
   * @param {string} type - 更新类型 ('input' | 'output')
   * @param {number} quantity - 更新数量
   */
  static async updateWorkOrderQuantity(workOrderId, type, quantity = 1) {
    try {
      if (!workOrderId) {
        console.log("未提供工单ID，跳过更新工单数量");
        return null;
      }

      const updateField = type === "input" ? "inputQuantity" : "outputQuantity";

      const workOrder = await mongoose
        .model("production_plan_work_order")
        .findOneAndUpdate(
          { _id: workOrderId },
          {
            $inc: { [updateField]: quantity },
            $set: {
              updateTime: new Date(),
            },
          },
          { new: true }
        );

      if (!workOrder) {
        console.log(`未找到工单(ID: ${workOrderId})或物料不匹配`);
        return null;
      }

      // 计算进度百分比
      workOrder.progress =
        type === "output"
          ? Math.floor(
              ((quantity + (workOrder?.outputQuantity || 0)) /
                workOrder?.planProductionQuantity) *
                100
            )
          : undefined; // 投入量不影响进度

      // 检查quantity是否为负数且工单状态为已完成，如果是则将工单状态更新为暂停
      if (quantity < 0 && workOrder.status === "COMPLETED") {
        workOrder.status = "PAUSED";
        console.log(
          `工单(ID: ${workOrderId})因quantity为负数(${quantity})且原状态为已完成，被设置为暂停状态`
        );
      }
      // 检查工单状态
      else if (workOrder.outputQuantity >= workOrder.planProductionQuantity) {
        // 更新工单完成状态和时间
        workOrder.status = "COMPLETED";
        workOrder.endTime = new Date();
        workOrder.progress = 100;

        // 使用新方法处理所有关联工单的完成状态
        await this.completeAllRelatedWorkOrders(workOrder._id);

        //自动开启下一个工单计划
        const nextWorkOrders = await ProductionPlanWorkOrder.find({
          productionLineId: workOrder.productionLineId,
          materialId: workOrder.materialId,
          status: "PENDING",
        }).sort({ planStartTime: 1 });
        if (nextWorkOrders.length > 0) {
          nextWorkOrders[0].status = "IN_PROGRESS";
          await nextWorkOrders[0].save();
        }
      }

      await workOrder.save();

      return workOrder;
    } catch (error) {
      console.error(
        `更新工单${type === "input" ? "投入" : "产出"}数量失败:`,
        error
      );
      return null;
    }
  }

  /**
   * 检查是否为首道或末道工序
   * @param {Array} processNodes - 所有工序节点
   * @param {Object} currentNode - 当前工序节点
   * @returns {Object} { isFirst: boolean, isLast: boolean }
   */
  static checkProcessPosition(processNodes, currentNode) {
    // 获取当前节点的父物料节点
    const parentMaterialNode = processNodes.find(
      (node) => node.nodeId === currentNode.parentNodeId
    );
    if (!parentMaterialNode) return { isFirst: false, isLast: false };

    // 获取同级的所有工序节点并按顺序排序
    const levelProcessSteps = processNodes
      .filter(
        (node) =>
          node.nodeType === "PROCESS_STEP" &&
          node.parentNodeId === parentMaterialNode.nodeId
      )
      .sort((a, b) => a.processSort - b.processSort);

    const currentIndex = levelProcessSteps.findIndex(
      (step) => step.nodeId === currentNode.nodeId
    );

    return {
      isFirst: currentIndex === 0,
      isLast: currentIndex === levelProcessSteps.length - 1,
    };
  }

  /**
   * 验证条码与物料的匹配关系
   * @param {string} barcode - 条码
   * @param {Object} material - 物料信息
   * @returns {Promise<Object>} 验证结果，包含 isValid, materialCode, relatedBill 等信息
   */
  static async validateBarcodeWithMaterial(barcode, material) {
    try {
      // 1. 获取物料对应的条码规则（包括产品特定规则和全局规则）
      const [productRules, globalRules] = await Promise.all([
        // 获取产品特定规则
        productBarcodeRule
          .find({
            materialId: material._id,
          })
          .populate({
            path: "barcodeRule",
            match: { enabled: true },
          }),

        // 获取全局规则
        barcodeRule.find({
          isGlobal: true,
          enabled: true,
        }),
      ]);

      // 2. 处理和合并规则
      let rules = [];

      // 处理产品特定规则
      if (productRules?.length) {
        rules.push(
          ...productRules
            .filter((item) => item.barcodeRule) // 过滤掉无效的规则
            .map((item) => ({
              ...item.barcodeRule.toObject(),
              priority: item.barcodeRule.priority || 0,
              isProductSpecific: true,
            }))
        );
      }

      // 添加全局规则
      if (globalRules?.length) {
        rules.push(
          ...globalRules.map((rule) => ({
            ...rule.toObject(),
            priority: -1, // 设置最低优先级
            isProductSpecific: false,
          }))
        );
      }

      // 按优先级排序（从高到低）
      rules.sort((a, b) => b.priority - a.priority);

      if (!rules || rules.length === 0) {
        throw new Error("未找到可用的条码规则");
      }

      // 3. 验证条码
      for (const rule of rules) {
        let isValid = true;
        let currentValue = barcode;

        // 验证规则校验
        for (const validationRule of rule.validationRules) {
          if (!validationRule.enabled) continue;

          switch (validationRule.type) {
            case "length":
              if (currentValue.length !== validationRule.params.length) {
                isValid = false;
              }
              break;

            case "substring":
              const subValue = currentValue.substring(
                validationRule.params.start,
                validationRule.params.end
              );
              if (subValue !== validationRule.params.expectedValue) {
                isValid = false;
              }
              break;

            case "regex":
              try {
                const regex = new RegExp(validationRule.params.pattern);
                if (!regex.test(currentValue)) {
                  isValid = false;
                }
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
                const diResult = await this.validateDICode(
                  extractValue,
                  material
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
          if (materialCode === material.FNumber) {
            return {
              isValid: true,
              materialCode,
              relatedBill,
              ruleName: rule.name,
              ruleType: rule.isProductSpecific ? "product" : "global",
            };
          }
        }
      }

      // 所有规则都未匹配成功
      return {
        isValid: false,
        materialCode: null,
        relatedBill: null,
        error: "条码不符合任何已配置的规则或物料不匹配",
      };
    } catch (error) {
      console.error("条码验证失败:", error);
      throw error;
    }
  }

  static async validateDICode(diCode, material) {
    try {
      // 取DI码对应的所有物料信息
      const response = await productDiNum.find({ diNum: diCode }).populate({
        path: "productId",
        model: "k3_BD_MATERIAL",
      });

      if (response.length === 0) {
        return { isValid: false };
      }

      // 添加空值检查,过滤掉productId为空的记录
      const possibleMaterialCodes = response
        .filter((item) => item.productId && item.productId.FNumber)
        .map((item) => item.productId.FNumber);

      if (possibleMaterialCodes.length === 0) {
        return { isValid: false };
      }

      // 获取当前页面的主物料和子物料编码
      const allMaterialCodes = [material.FNumber];

      // 查找匹配的物料编码
      const matchedMaterialCode = possibleMaterialCodes.find((code) =>
        allMaterialCodes.includes(code)
      );

      if (!matchedMaterialCode) {
        return { isValid: false };
      }

      // 返回验证结果和匹配到的物料编码
      return {
        isValid: true,
        materialCode: matchedMaterialCode,
      };
    } catch (error) {
      console.error("DI码验证失败:", error);
      return { isValid: false };
    }
  }

  static async initializeMachineBarcode(barcode, machineIp) {
    try {
      // 1. 先查找是否存在条码记录
      const existingFlow = await MaterialProcessFlow.findOne({ barcode });
      if (existingFlow) {
        return existingFlow;
      }

      // 2. 通过IP查询设备信息
      const machine = await Machine.findOne({ machineIp });
      if (!machine) {
        throw new Error("未找到对应的设备信息");
      }

      // 3. 查询工序信息
      const processStep = await ProcessStep.findById(machine.processStepId);
      if (!processStep) {
        throw new Error("未找到对应的工序信息");
      }

      const craft = await Craft.findById(processStep.craftId).populate(
        "materialId"
      );
      if (!craft) {
        throw new Error("未找到对应的工艺信息");
      }

      // 4. 获取物料信息
      const material = craft.materialId;
      if (!material) {
        throw new Error("未找到对应的物料信息");
      }

      // 5. 验证条码与物料的匹配关系
      const validationResult = await this.validateBarcodeWithMaterial(
        barcode,
        material
      );
      if (!validationResult.isValid) {
        throw new Error(validationResult.error || "条码与物料不匹配");
      }

      // 6. 创建新的流程记录
      const flowRecord = await this.createFlowByMaterialCode(
        material._id,
        material.FNumber,
        barcode,
        machine.lineId,
        machine.lineName
      );

      return flowRecord;
    } catch (error) {
      console.error("初始化设备条码失败:", error);
      throw error;
    }
  }

  /**
   * 构建完整的BOM结构数据
   * @param {string} materialId - 顶层物料ID
   * @param {Object} craft - 工艺信息
   * @param {Set} processedMaterials - 已处理的物料集合（防止循环引用）
   * @param {number} level - 当前层级
   * @returns {Promise<Array>} BOM结构数组
   */
  static async buildFullBOMStructure(
    materialId,
    craft,
    processedMaterials = new Set(),
    level = 0
  ) {
    try {
      // 检查材料是否已处理过（防止循环依赖）
      if (processedMaterials.has(materialId.toString())) {
        console.warn(`检测到循环依赖, 材料ID: ${materialId}`);
        return [];
      }

      const bomStructure = [];
      // 添加当前材料到已处理集合
      processedMaterials.add(materialId.toString());

      // 获取主物料信息
      const material = await Material.findById(materialId);
      if (!material) {
        throw new Error(`未找到物料信息: ${materialId}`);
      }

      // 创建主物料节点
      const rootNode = {
        level,
        materialId: material._id,
        materialCode: material.FNumber,
        materialName: material.FName,
        specification: material.FSpecification,
        unit: material.FBaseUnitId_FName,
        craftId: craft?._id,
        craftName: craft?.craftName,
        children: [],
        processSteps: [],
      };

      // 如果存在工艺，获取所有工序
      if (craft) {
        const processSteps = await ProcessStep.find({
          craftId: craft._id,
        }).sort({ sort: 1 });

        // 处理每个工序
        for (const processStep of processSteps) {
          const processNode = {
            processId: processStep._id,
            processCode: processStep.processCode,
            processName: processStep.processName,
            processType: processStep.processType,
            sort: processStep.sort,
            materials: [],
          };

          // 获取工序关联的物料
          const processMaterials = await ProcessMaterials.find({
            processStepId: processStep._id,
          });

          // 如果没有关联物料，也添加一个空的物料记录
          if (processMaterials.length === 0) {
            processNode.materials.push({
              materialId: null,
              materialCode: "",
              materialName: "",
              specification: "",
              quantity: null,
              unit: "",
              isComponent: false,
              isKeyMaterial: false,
              isBatch: false,
              batchQuantity: null,
              isPackingBox: false,
              isRfid: false,
              children: [],
            });
          } else {
            // 处理工序物料
            for (const processMaterial of processMaterials) {
              const subMaterial = await Material.findById(
                processMaterial.materialId
              );
              if (!subMaterial) continue;

              // 查找子物料的工艺
              const subCraft = await Craft.findOne({
                materialId: subMaterial._id,
              });

              // 递归处理子物料的BOM结构
              const subStructure = await this.buildFullBOMStructure(
                subMaterial._id,
                subCraft,
                processedMaterials,
                level + 1
              );

              const materialNode = {
                materialId: subMaterial._id,
                materialCode: subMaterial.FNumber,
                materialName: subMaterial.FName,
                specification: subMaterial.FSpecification,
                quantity: processMaterial.quantity,
                unit: processMaterial.unit,
                isComponent: processMaterial.isComponent,
                isKeyMaterial: processMaterial.isKey,
                isBatch: processMaterial.isBatch,
                batchQuantity: processMaterial.batchQuantity,
                isPackingBox: processMaterial.isPackingBox,
                isRfid: processMaterial.isRfid,
                children: subStructure,
              };

              processNode.materials.push(materialNode);
            }
          }

          rootNode.processSteps.push(processNode);
        }
      }

      bomStructure.push(rootNode);
      return bomStructure;
    } catch (error) {
      console.error("构建BOM结构失败:", error);
      throw error;
    }
  }

  /**
   * 导出完整BOM结构为扁平数组（用于Excel导出等）
   * @param {string} materialId - 顶层物料ID
   * @returns {Promise<Array>} 扁平化的BOM数据数组
   */
  static async exportFlattenedBOMStructure(materialId) {
    try {
      const craft = await Craft.findOne({ materialId });
      const bomStructure = await this.buildFullBOMStructure(materialId, craft);
      const flattenedData = [];

      const flattenBOM = (
        node,
        parentProcess = null,
        parentMaterial = null
      ) => {
        // 添加工序信息
        node.processSteps.forEach((process) => {
          // 如果工序没有物料，添加一条只有工序信息的记录
          if (
            process.materials.length === 0 ||
            (process.materials.length === 1 && !process.materials[0].materialId)
          ) {
            flattenedData.push({
              level: node.level,
              parentMaterialCode: node.materialCode,
              parentMaterialName: node.materialName,
              processCode: process.processCode,
              processName: process.processName,
              processType: process.processType,
              materialCode: "",
              materialName: "",
              specification: "",
              quantity: null,
              unit: "",
              isComponent: "",
              isKeyMaterial: "",
              isBatch: "",
              batchQuantity: null,
              isPackingBox: "",
              isRfid: "",
            });
          } else {
            process.materials.forEach((material) => {
              flattenedData.push({
                level: node.level,
                parentMaterialCode: node.materialCode,
                parentMaterialName: node.materialName,
                processCode: process.processCode,
                processName: process.processName,
                processType: process.processType,
                materialCode: material.materialCode,
                materialName: material.materialName,
                specification: material.specification,
                quantity: material.quantity,
                unit: material.unit,
                isComponent: material.isComponent ? "是" : "否",
                isKeyMaterial: material.isKeyMaterial ? "是" : "否",
                isBatch: material.isBatch ? "是" : "否",
                batchQuantity: material.batchQuantity,
                isPackingBox: material.isPackingBox ? "是" : "否",
                isRfid: material.isRfid ? "是" : "否",
              });

              // 递归处理子物料
              if (material.children && material.children.length > 0) {
                material.children.forEach((child) => {
                  flattenBOM(child, process, material);
                });
              }
            });
          }
        });
      };

      bomStructure.forEach((root) => flattenBOM(root));
      return flattenedData;
    } catch (error) {
      console.error("导出BOM结构失败:", error);
      throw error;
    }
  }

  /**
   * 修复流程进度和状态
   * @param {string} barcode - 主条码
   */
  static async fixFlowProgress(barcode) {
    try {
      const startTime = new Date();
      console.log(`开始处理条码 ${barcode} 的流程进度修复...`);

      // 查找流程记录
      const flowRecord = await MaterialProcessFlow.findOne({ barcode });
      if (!flowRecord) {
        throw new Error("未找到对应的流程记录");
      }

      // 重新计算进度
      const requiredNodes = flowRecord.processNodes.filter(
        (node) =>
          node.level !== 0 && // 排除根节点
          (node.nodeType === "PROCESS_STEP" ||
            (node.nodeType === "MATERIAL" && node.requireScan === true))
      );

      const completedNodes = requiredNodes.filter(
        (node) => node.status === "COMPLETED"
      );

      // 检查是否所有必要节点都已完成
      const allNodesCompleted = requiredNodes.length === completedNodes.length;

      // 更新进度
      flowRecord.progress =
        requiredNodes.length > 0
          ? Math.floor((completedNodes.length / requiredNodes.length) * 100)
          : 0;

      // 如果所有节点都完成，更新整体状态
      if (allNodesCompleted) {
        flowRecord.status = "COMPLETED";
        flowRecord.endTime = new Date();

        // 更新根节点状态
        const rootNode = flowRecord.processNodes.find(
          (node) => node.level === 0 && node.nodeType === "MATERIAL"
        );
        if (rootNode) {
          rootNode.status = "COMPLETED";
          rootNode.endTime = new Date();
        }
      } else {
        flowRecord.status = "IN_PROCESS";
        flowRecord.endTime = null;

        // 重置根节点状态
        const rootNode = flowRecord.processNodes.find(
          (node) => node.level === 0 && node.nodeType === "MATERIAL"
        );
        if (rootNode) {
          rootNode.status = "PENDING";
          rootNode.endTime = null;
        }
      }

      // 保存更新
      await flowRecord.save();

      const endTime = new Date();
      const processingTime = endTime - startTime;
      console.log(
        `条码 ${barcode} 的流程进度修复完成，处理耗时: ${processingTime}ms`
      );
      console.log(`- 总节点数: ${requiredNodes.length}`);
      console.log(`- 已完成节点: ${completedNodes.length}`);
      console.log(`- 进度: ${flowRecord.progress}%`);
      console.log(`- 状态: ${flowRecord.status}`);

      return {
        barcode: flowRecord.barcode,
        previousProgress: flowRecord.progress,
        status: flowRecord.status,
        message: allNodesCompleted ? "所有节点已完成" : "流程进行中",
        processingTime,
      };
    } catch (error) {
      console.error("修复流程进度失败:", error);
      throw error;
    }
  }

  /**
   * 批量更新所有流程记录的 relatedBill
   * @param {number} batchSize - 每批处理的记录数量
   * @returns {Promise<{total: number, updated: number, failed: number, errors: Array}>} 更新统计结果
   */
  static async batchUpdateRelatedBills(batchSize = 100) {
    try {
      const stats = {
        total: 0,
        updated: 0,
        failed: 0,
        errors: [],
      };

      // 获取总记录数
      stats.total = await MaterialProcessFlow.countDocuments();
      console.log(`总记录数: ${stats.total}`);

      // 计算需要处理的批次数
      const totalBatches = Math.ceil(stats.total / batchSize);

      // 按批次处理记录
      for (let batch = 0; batch < totalBatches; batch++) {
        console.log(`开始处理第 ${batch + 1}/${totalBatches} 批...`);

        // 获取当前批次的记录
        const flowRecords = await MaterialProcessFlow.find({})
          .populate("materialId")
          .skip(batch * batchSize)
          .limit(batchSize)
          .sort({ _id: -1 });

        // 处理当前批次的记录
        for (const flowRecord of flowRecords) {
          try {
            let hasUpdates = false;

            // 更新主条码的 relatedBill
            if (flowRecord.barcode && flowRecord.materialId) {
              const mainValidation = await this.validateBarcodeWithMaterial(
                flowRecord.barcode,
                flowRecord.materialId
              );

              if (mainValidation.relatedBill !== flowRecord.relatedBill) {
                flowRecord.relatedBill = mainValidation.relatedBill || "";
                hasUpdates = true;
              }
            }

            // 更新所有节点的 relatedBill
            for (const node of flowRecord.processNodes) {
              if (node.barcode && node.materialId) {
                const material = await Material.findById(node.materialId);
                if (material) {
                  const validation = await this.validateBarcodeWithMaterial(
                    node.barcode,
                    material
                  );

                  if (validation.relatedBill !== node.relatedBill) {
                    node.relatedBill = validation.relatedBill || "";
                    hasUpdates = true;
                  }
                }
              }
            }

            // 如果有更新，保存记录
            if (hasUpdates) {
              await flowRecord.save();
              stats.updated++;
              console.log(`成功更新记录: ${flowRecord.barcode}`);
            }
          } catch (error) {
            stats.failed++;
            stats.errors.push({
              barcode: flowRecord.barcode,
              error: error.message,
            });
            console.error(`处理记录失败 ${flowRecord.barcode}:`, error.message);
          }
        }
      }

      console.log("更新完成!");
      console.log(`总记录数: ${stats.total}`);
      console.log(`更新成功: ${stats.updated}`);
      console.log(`更新失败: ${stats.failed}`);

      if (stats.errors.length > 0) {
        console.log("失败记录:");
        stats.errors.forEach((err) => {
          console.log(`- 条码 ${err.barcode}: ${err.error}`);
        });
      }

      return stats;
    } catch (error) {
      console.error("批量更新失败:", error);
      throw error;
    }
  }

  static async validateRecentFlows() {
    try {
      console.log("开始验证最近10天的流程数据...");

      // 获取最近10天的数据
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const flows = await MaterialProcessFlow.find({
        createdAt: { $gte: tenDaysAgo },
      }).populate("materialId");

      console.log(`共找到 ${flows.length} 条流程记录需要验证`);
      const invalidRecords = [];
      let processedCount = 0;

      // 遍历每个流程记录
      for (const flow of flows) {
        processedCount++;
        console.log(`\n正在处理第 ${processedCount}/${flows.length} 条记录`);
        console.log(
          `主条码: ${flow.barcode}, 物料: ${flow.materialId?.FName}(${flow.materialId?.FNumber})`
        );

        // 验证主条码
        console.log("验证主条码...");
        const mainBarcodeValidation = await this.validateBarcodeWithMaterial(
          flow.barcode,
          flow.materialId
        );

        if (!mainBarcodeValidation.isValid) {
          console.log(
            `❌ 主条码验证失败: ${mainBarcodeValidation.error || "未知错误"}`
          );
        } else {
          console.log("✅ 主条码验证通过");
        }

        const invalidComponents = [];

        // 检查每个工序节点的组件
        if (flow.processNodes && flow.processNodes.length > 0) {
          console.log(
            `\n开始验证工序节点组件, 共 ${flow.processNodes.length} 个节点`
          );

          for (const node of flow.processNodes) {
            if (node.nodeType === "MATERIAL" && node.barcode) {
              console.log(
                `\n验证物料节点: ${node.materialName}(${node.materialCode})`
              );
              console.log(`条码: ${node.barcode}`);

              // 获取组件物料信息
              const componentMaterial = await Material.findById(
                node.materialId
              );
              if (componentMaterial) {
                const componentValidation =
                  await this.validateBarcodeWithMaterial(
                    node.barcode,
                    componentMaterial
                  );

                if (!componentValidation.isValid) {
                  console.log(
                    `❌ 组件条码验证失败: ${
                      componentValidation.error || "未知错误"
                    }`
                  );
                  invalidComponents.push({
                    barcode: node.barcode,
                    materialCode: componentMaterial.FNumber,
                    materialName: componentMaterial.FName,
                    processStepId: node.processStepId,
                    processName: node.processName,
                    error: componentValidation.error || "条码验证失败",
                  });
                } else {
                  console.log("✅ 组件条码验证通过");
                }
              } else {
                console.log(`⚠️ 未找到物料信息: ${node.materialId}`);
              }
            }
          }
        }

        // 如果主条码或任何组件验证失败，添加到无效记录列表
        if (!mainBarcodeValidation.isValid || invalidComponents.length > 0) {
          invalidRecords.push({
            mainBarcode: flow.barcode,
            materialCode: flow.materialId.FNumber,
            materialName: flow.materialId.FName,
            createdAt: flow.createdAt,
            mainBarcodeValid: mainBarcodeValidation.isValid,
            mainBarcodeError: mainBarcodeValidation.error,
            invalidComponents: invalidComponents,
          });
        }
      }

      return {
        totalChecked: flows.length,
        invalidCount: invalidRecords.length,
        invalidRecords,
      };
    } catch (error) {
      console.error("验证流程数据失败:", error);
      throw new Error(`验证流程数据失败: ${error.message}`);
    }
  }

  /**
   * 修复条码物料异常数据
   * 处理子物料工序状态与主工序状态不一致的情况
   * @param {string} mainBarcode - 主条码 (需要更新的流程记录条码)
   * @param {string} componentBarcode - 子物料条码
   * @returns {Promise<Object>} 更新后的流程记录
   */
  static async fixInconsistentProcessNodes(mainBarcode, componentBarcode) {
    try {
      // 1. 获取主条码和子条码的流程记录
      const mainFlowRecord = await MaterialProcessFlow.findOne({
        barcode: mainBarcode,
      });
      const componentFlowRecord = await MaterialProcessFlow.findOne({
        barcode: componentBarcode,
      });

      if (!mainFlowRecord) {
        throw new Error(`未找到条码为 ${mainBarcode} 的流程记录`);
      }

      if (!componentFlowRecord) {
        throw new Error(`未找到条码为 ${componentBarcode} 的流程记录`);
      }

      // 2. 在主流程记录中找到对应该组件的节点
      const componentNodes = mainFlowRecord.processNodes.filter(
        (node) =>
          node.nodeType === "MATERIAL" && node.barcode === componentBarcode
      );

      if (componentNodes.length === 0) {
        throw new Error(
          `在主条码 ${mainBarcode} 中未找到子条码 ${componentBarcode} 对应的节点`
        );
      }

      const componentNode = componentNodes[0];

      // 3. 获取子条码流程记录中的工序节点
      const componentProcessNodes = componentFlowRecord.processNodes.filter(
        (node) => node.nodeType === "PROCESS_STEP"
      );

      // 4. 在主流程记录中找到所有关联到这个物料节点的工序节点
      const childProcessNodesInMain = mainFlowRecord.processNodes.filter(
        (node) =>
          node.nodeType === "PROCESS_STEP" &&
          node.parentNodeId === componentNode.nodeId
      );

      // 存储需要更新的节点ID
      const updatedNodeIds = new Set();

      // 5. 更新主流程记录中的子工序节点
      for (const childProcess of childProcessNodesInMain) {
        // 在子条码流程中查找匹配的工序
        const matchingProcess = componentProcessNodes.find(
          (p) =>
            p.processCode === childProcess.processCode ||
            p.processName === childProcess.processName
        );

        if (matchingProcess) {
          // 更新节点状态和其他相关信息
          childProcess.status = matchingProcess.status;
          if (matchingProcess.endTime)
            childProcess.endTime = matchingProcess.endTime;
          if (matchingProcess.scanTime)
            childProcess.scanTime = matchingProcess.scanTime;
          if (matchingProcess.updateBy)
            childProcess.updateBy = matchingProcess.updateBy;

          updatedNodeIds.add(childProcess.nodeId);
        }
      }

      // 6. 更新所有父节点的状态
      const allNodes = mainFlowRecord.processNodes;
      let updated = true;

      while (updated) {
        updated = false;

        for (const node of allNodes) {
          if (
            node.nodeType === "PROCESS_STEP" ||
            node.nodeType === "MATERIAL"
          ) {
            // 获取该节点的所有子节点
            const childNodes = allNodes.filter(
              (n) => n.parentNodeId === node.nodeId
            );

            if (childNodes.length > 0) {
              // 检查所有子节点是否都已完成
              const allChildrenCompleted = childNodes.every(
                (child) => child.status === "COMPLETED"
              );

              // 如果所有子节点都已完成，但当前节点不是完成状态，则更新它
              if (allChildrenCompleted && node.status !== "COMPLETED") {
                node.status = "COMPLETED";
                node.endTime = new Date();
                updatedNodeIds.add(node.nodeId);
                updated = true;
              }
            }
          }
        }
      }

      // 7. 计算整体进度
      const calculateProgress = (nodes) => {
        const totalNodes = nodes.filter(
          (n) => n.nodeType === "PROCESS_STEP"
        ).length;
        const completedNodes = nodes.filter(
          (n) => n.nodeType === "PROCESS_STEP" && n.status === "COMPLETED"
        ).length;
        return totalNodes > 0
          ? Math.floor((completedNodes / totalNodes) * 100)
          : 0;
      };

      mainFlowRecord.progress = calculateProgress(mainFlowRecord.processNodes);

      // 8. 如果所有工序都完成，则更新整体状态
      if (mainFlowRecord.progress === 100) {
        mainFlowRecord.status = "COMPLETED";
        mainFlowRecord.endTime = new Date();
      }

      // 9. 保存更新后的主流程记录
      await mainFlowRecord.save();

      // // 10. 记录操作日志
      // await SystemLog.create({
      //   module: 'PROCESS_FLOW',
      //   operation: 'FIX_INCONSISTENT_NODES',
      //   operator: 'SYSTEM',
      //   content: `修复主条码 ${mainBarcode} 与子条码 ${componentBarcode} 工序不一致问题，更新 ${updatedNodeIds.size} 个节点`
      // });

      return mainFlowRecord;
    } catch (error) {
      console.error(`修复条码物料异常数据失败:`, error);
      throw error;
    }
  }

  /**
   * 自动检测并修复主条码中的异常子条码数据
   * 只需输入主条码，自动识别所有状态不一致的子条码并进行修复
   * @param {string} mainBarcode - 主条码
   * @returns {Promise<Object>} 修复结果，包含修复的子条码列表和更新后的流程记录
   */
  static async autoFixInconsistentProcessNodes(mainBarcode) {
    try {
      // 1. 获取主条码流程记录
      const mainFlowRecord = await MaterialProcessFlow.findOne({
        barcode: mainBarcode,
      });
      if (!mainFlowRecord) {
        throw new Error(`未找到条码为 ${mainBarcode} 的流程记录`);
      }

      // 2. 查找所有已完成的物料节点
      const completedMaterialNodes = mainFlowRecord.processNodes.filter(
        (node) =>
          node.nodeType === "MATERIAL" &&
          node.status === "COMPLETED" &&
          node.barcode &&
          node.barcode.length > 0
      );

      if (completedMaterialNodes.length === 0) {
        return {
          message: `条码 ${mainBarcode} 无已完成的物料节点可检查`,
          fixedComponents: [],
          flowRecord: mainFlowRecord,
        };
      }

      // 3. 检查每个物料节点的子节点状态
      const inconsistentComponents = [];

      for (const materialNode of completedMaterialNodes) {
        // 获取该物料的所有子工序节点
        const childProcessNodes = mainFlowRecord.processNodes.filter(
          (node) =>
            node.parentNodeId === materialNode.nodeId &&
            node.nodeType === "PROCESS_STEP"
        );

        // 如果物料已完成但有子工序未完成，则标记为异常
        const hasInconsistentStatus = childProcessNodes.some(
          (node) => node.status !== "COMPLETED"
        );

        if (hasInconsistentStatus) {
          inconsistentComponents.push({
            materialNode,
            childProcessNodes: childProcessNodes.filter(
              (node) => node.status !== "COMPLETED"
            ),
          });
        }
      }

      if (inconsistentComponents.length === 0) {
        return {
          message: `条码 ${mainBarcode} 所有物料节点状态一致，无需修复`,
          fixedComponents: [],
          flowRecord: mainFlowRecord,
        };
      }

      // 4. 修复所有异常的子条码
      const fixedComponents = [];

      for (const item of inconsistentComponents) {
        const componentBarcode = item.materialNode.barcode;

        // 检查子条码是否有对应流程记录
        const componentFlowRecord = await MaterialProcessFlow.findOne({
          barcode: componentBarcode,
        });

        if (componentFlowRecord) {
          // 调用修复方法
          await this.fixInconsistentProcessNodes(mainBarcode, componentBarcode);

          fixedComponents.push({
            barcode: componentBarcode,
            materialName: item.materialNode.materialName,
            materialCode: item.materialNode.materialCode,
            pendingProcesses: item.childProcessNodes.map(
              (node) => node.processName
            ),
          });
        }
      }

      // 5. 获取更新后的流程记录
      const updatedFlowRecord = await MaterialProcessFlow.findOne({
        barcode: mainBarcode,
      });

      // 6. 记录操作日志
      // await SystemLog.create({
      //   module: 'PROCESS_FLOW',
      //   operation: 'AUTO_FIX_INCONSISTENT_NODES',
      //   operator: 'SYSTEM',
      //   content: `自动检测并修复条码 ${mainBarcode} 的异常子条码数据，共修复 ${fixedComponents.length} 个子条码`
      // });

      return {
        message: `成功修复 ${fixedComponents.length} 个异常子条码数据`,
        fixedComponents,
        flowRecord: updatedFlowRecord,
      };
    } catch (error) {
      console.error(`自动检测并修复异常子条码数据失败:`, error);
      throw error;
    }
  }

  /**
   * 递归完成所有关联的工单
   * 当一个补工单完成时，将所有关联的工单（包括原工单和其他补工单）设置为完成状态
   * @param {String} workOrderId 当前完成的工单ID
   * @param {Set} processedIds 已处理过的工单ID集合，用于防止循环引用
   */
  static async completeAllRelatedWorkOrders(
    workOrderId,
    processedIds = new Set()
  ) {
    // 防止重复处理和循环引用
    if (processedIds.has(workOrderId.toString())) {
      return;
    }
    processedIds.add(workOrderId.toString());

    const ProductionPlanWorkOrder = mongoose.model(
      "production_plan_work_order"
    );

    // 1. 查找当前工单的原工单(如果存在)
    const currentWorkOrder = await ProductionPlanWorkOrder.findById(
      workOrderId
    );
    if (currentWorkOrder && currentWorkOrder.originalWorkOrderId) {
      const originalWorkOrder = await ProductionPlanWorkOrder.findById(
        currentWorkOrder.originalWorkOrderId
      );

      if (originalWorkOrder && originalWorkOrder.status !== "COMPLETED") {
        originalWorkOrder.status = "COMPLETED";
        originalWorkOrder.endTime = new Date();
        originalWorkOrder.progress = 100;
        await originalWorkOrder.save();
        console.log(`已完成原工单: ${originalWorkOrder.workOrderNo}`);

        // 递归查找原工单的相关联工单
        await this.completeAllRelatedWorkOrders(
          originalWorkOrder._id,
          processedIds
        );
      }
    }

    // 2. 查找所有以当前工单为原工单的补工单
    const relatedWorkOrders = await ProductionPlanWorkOrder.find({
      originalWorkOrderId: workOrderId,
    });

    // 3. 递归处理所有找到的补工单
    for (const relatedOrder of relatedWorkOrders) {
      if (relatedOrder.status !== "COMPLETED") {
        relatedOrder.status = "COMPLETED";
        relatedOrder.endTime = new Date();
        relatedOrder.progress = 100;
        await relatedOrder.save();
        console.log(`已完成关联补工单: ${relatedOrder.workOrderNo}`);
      }

      // 继续查找此补工单的关联工单
      await this.completeAllRelatedWorkOrders(relatedOrder._id, processedIds);
    }
  }

  /**
   * 检查条码节点完成情况
   * @param {string} barcode - 需要检查的条码
   * @returns {Object} 返回条码完成状态信息
   */
  static async checkBarcodeCompletion(barcode) {
    try {
      // 查找流程记录
      const flowRecord = await MaterialProcessFlow.findOne({ barcode });
      if (!flowRecord) {
        throw new Error("未找到对应的流程记录");
      }

      // 获取所有必要节点
      const requiredNodes = flowRecord.processNodes.filter(
        (node) =>
          node.level !== 0 && // 排除根节点
          (node.nodeType === "PROCESS_STEP" ||
            (node.nodeType === "MATERIAL" && node.requireScan === true))
      );

      // 获取已完成节点
      const completedNodes = requiredNodes.filter(
        (node) => node.status === "COMPLETED"
      );

      // 获取未完成节点
      const pendingNodes = requiredNodes.filter(
        (node) => node.status !== "COMPLETED"
      );

      // 检查是否所有必要节点都已完成
      const allNodesCompleted = requiredNodes.length === completedNodes.length;

      // 计算完成进度
      const progress =
        requiredNodes.length > 0
          ? Math.floor((completedNodes.length / requiredNodes.length) * 100)
          : 0;

      return {
        barcode: flowRecord.barcode,
        materialCode: flowRecord.materialCode,
        materialName: flowRecord.materialName,
        isCompleted: allNodesCompleted,
        progress: progress,
        status: flowRecord.status,
        totalNodes: requiredNodes.length,
        completedNodes: completedNodes.length,
        pendingNodes: pendingNodes.length,
        pendingNodesList: pendingNodes.map((node) => ({
          nodeId: node._id,
          nodeName: node.processName || node.materialName,
          nodeType: node.nodeType,
          status: node.status,
        })),
      };
    } catch (error) {
      console.error("检查条码完成情况失败:", error);
      throw error;
    }
  }

  /**
   * 替换物料组件
   * @param {string} mainBarcode - 主条码
   * @param {string} processNodeId - 工序节点ID
   * @param {string} materialNodeId - 物料节点ID
   * @param {string} originalBarcode - 原物料条码
   * @param {string} newBarcode - 新物料条码
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 替换结果
   */
  static async replaceComponent(
    mainBarcode,
    processNodeId,
    materialNodeId,
    originalBarcode,
    newBarcode,
    userId
  ) {
    try {
      console.log("=== 开始物料替换 ===");
      console.log(`主条码: ${mainBarcode}`);
      console.log(`工序节点ID: ${processNodeId}`);
      console.log(`物料节点ID: ${materialNodeId}`);
      console.log(`原条码: ${originalBarcode}`);
      console.log(`新条码: ${newBarcode}`);
      console.log(`操作用户: ${userId}`);

      // 1. 参数验证
      if (
        !mainBarcode ||
        !processNodeId ||
        !materialNodeId ||
        !newBarcode ||
        !userId
      ) {
        throw new Error("缺少必要参数");
      }

      // 2. 查找主条码的流程记录
      const mainFlowRecord = await MaterialProcessFlow.findOne({
        barcode: mainBarcode,
      });
      if (!mainFlowRecord) {
        throw new Error(`未找到条码 ${mainBarcode} 的流程记录`);
      }
      console.log(`找到主条码流程记录: ${mainFlowRecord._id}`);

      // 3. 查找工序节点和物料节点
      const processNode = mainFlowRecord.processNodes.find(
        (node) => node.nodeId === processNodeId
      );
      if (!processNode || processNode.nodeType !== "PROCESS_STEP") {
        throw new Error("未找到指定的工序节点");
      }
      console.log(
        `工序节点信息: ID=${processNode.nodeId}, 名称=${processNode.processName}, ProcessStepId=${processNode.processStepId}`
      );

      const materialNode = mainFlowRecord.processNodes.find(
        (node) => node.nodeId === materialNodeId
      );
      if (
        !materialNode ||
        materialNode.nodeType !== "MATERIAL" ||
        materialNode.parentNodeId !== processNodeId
      ) {
        throw new Error("未找到指定的物料节点或物料节点不属于指定工序");
      }
      console.log(
        `物料节点信息: ID=${materialNode.nodeId}, 物料=${materialNode.materialName}, 条码=${materialNode.barcode}`
      );

      // 验证原条码是否匹配
      if (materialNode.barcode !== originalBarcode) {
        throw new Error("原物料条码不匹配");
      }

      // 4. 检查替换条件
      // 查询是否存在对应的维修记录
      const productRepair = require("../model/project/productRepair");
      const repairRecord = await productRepair.findOne({
        barcode: mainBarcode,
        status: "PENDING_REVIEW",
      });

      if (!repairRecord) {
        throw new Error("未找到对应的部件替换维修记录，请先创建维修记录");
      }
      console.log(`找到维修记录: ${repairRecord._id}`);

      // 5. 检查新条码是否合法
      // 查找新条码是否已存在流程记录
      const newBarcodeRecord = await MaterialProcessFlow.findOne({
        barcode: newBarcode,
      });

      console.log(`新条码流程记录: ${newBarcodeRecord}`);

      // 如果存在，验证物料类型是否匹配
      if (newBarcodeRecord) {
        console.log(`新条码 ${newBarcode} 有流程记录: ${newBarcodeRecord._id}`);
        console.log(
          `新条码物料类型: ${newBarcodeRecord.materialCode}, 需匹配类型: ${materialNode.materialCode}`
        );

        // 物料编码必须匹配
        if (newBarcodeRecord.materialCode !== materialNode.materialCode) {
          throw new Error(
            `新条码物料类型(${newBarcodeRecord.materialCode})与要替换的物料类型(${materialNode.materialCode})不匹配`
          );
        }

        // 新条码的流程必须已完成，才能作为替换部件
        if (newBarcodeRecord.status !== "COMPLETED") {
          throw new Error("新条码的流程未完成，不能用于替换");
        }
        console.log(`新条码流程状态: ${newBarcodeRecord.status}`);
      } else {
        console.log(`新条码 ${newBarcode} 无流程记录，将验证格式`);
        // 如果新条码不存在流程记录，需要验证条码格式
        const material = await Material.findOne({
          FNumber: materialNode.materialCode,
        });

        if (!material) {
          throw new Error(
            `未找到物料编码为 ${materialNode.materialCode} 的物料信息`
          );
        }
        console.log(`找到物料信息: ${material.FName}`);

        // 验证新条码是否符合物料规则
        const validationResult = await this.validateBarcodeWithMaterial(
          newBarcode,
          material
        );

        if (!validationResult.isValid) {
          throw new Error(
            `新条码验证失败: ${validationResult.error || "不符合条码规则"}`
          );
        }

        console.log(
          `条码验证通过，规则: ${validationResult.ruleName || "未知规则"}`
        );
      }

      // 6. 获取所有与原物料节点相关的子节点
      // 查找当前物料节点的所有子节点（包括子工序和子物料）
      const allChildNodes = [];
      const findChildNodes = (nodeId) => {
        const directChildren = mainFlowRecord.processNodes.filter(
          (node) => node.parentNodeId === nodeId
        );
        allChildNodes.push(...directChildren);
        // 递归查找孙子节点
        directChildren.forEach((child) => findChildNodes(child.nodeId));
      };

      findChildNodes(materialNode.nodeId);

      console.log(`找到 ${allChildNodes.length} 个与原物料节点相关的子节点`);
      console.log("子节点列表:");
      allChildNodes.forEach((node, index) => {
        console.log(
          `  ${index + 1}. 类型=${node.nodeType}, ID=${node.nodeId}, ${
            node.nodeType === "PROCESS_STEP"
              ? `工序=${node.processName}, ProcessStepId=${node.processStepId}`
              : `物料=${node.materialName}, 条码=${node.barcode || "无"}`
          }`
        );
      });

      // 7. 进行替换操作
      // 保存替换前的状态（用于记录）
      const oldBarcode = materialNode.barcode;

      // 7.1 更新物料节点的条码
      console.log(
        `更新物料节点条码: 从 ${materialNode.barcode} 到 ${newBarcode}`
      );
      materialNode.barcode = newBarcode;
      materialNode.scanTime = new Date();
      materialNode.scanOperator = userId;

      // 如果子工序已经完成，保持完成状态
      if (materialNode.status === "COMPLETED") {
        materialNode.status = "COMPLETED";
      } else {
        // 否则更新为进行中
        materialNode.status = "COMPLETED";
      }
      console.log(`物料节点状态: ${materialNode.status}`);

      // 7.2 如果新条码已有流程记录，使用其子结构信息
      if (newBarcodeRecord && newBarcodeRecord.processNodes.length > 0) {
        console.log(`新条码 ${newBarcode} 有流程记录，将使用其工序状态信息`);
        console.log(
          `新条码流程记录共有 ${newBarcodeRecord.processNodes.length} 个节点`
        );

        // 找到新条码流程中的根物料节点
        const newRootMaterial = newBarcodeRecord.processNodes.find(
          (node) => node.level === 0 && node.nodeType === "MATERIAL"
        );

        if (newRootMaterial) {
          console.log(
            `找到新条码的根物料节点: ${newRootMaterial.materialName}`
          );

          // 为每个子节点查找对应的新条码流程节点
          for (const childNode of allChildNodes) {
            console.log(
              `处理子节点: ${childNode.nodeType} - ${childNode.nodeId}`
            );

            if (childNode.nodeType === "PROCESS_STEP") {
              // 查找对应的工序节点
              const matchingProcess = newBarcodeRecord.processNodes.find(
                (node) =>
                  node.nodeType === "PROCESS_STEP" &&
                  node.processCode === childNode.processCode
              );

              if (matchingProcess) {
                console.log(`找到匹配工序: ${matchingProcess.processName}`);
                // 更新工序状态
                childNode.status = matchingProcess.status || "COMPLETED";
                childNode.endTime = matchingProcess.endTime || new Date();
                childNode.scanTime = matchingProcess.scanTime;
                childNode.updateBy = userId;
              } else {
                console.log(
                  `未找到匹配工序，保持原工序状态: ${childNode.processName}`
                );
              }
            } else if (childNode.nodeType === "MATERIAL") {
              // 查找对应的物料节点 - 通过物料编码匹配
              const matchingMaterial = newBarcodeRecord.processNodes.find(
                (node) =>
                  node.nodeType === "MATERIAL" &&
                  node.materialCode === childNode.materialCode
              );

              if (matchingMaterial && matchingMaterial.barcode) {
                console.log(
                  `找到匹配物料节点: ${matchingMaterial.materialName}, 条码: ${matchingMaterial.barcode}`
                );
                // 更新物料状态和条码
                childNode.barcode = matchingMaterial.barcode;
                childNode.status = matchingMaterial.status || "COMPLETED";
                childNode.scanTime = matchingMaterial.scanTime || new Date();
                childNode.endTime = matchingMaterial.endTime || new Date();
                childNode.updateBy = userId;
              } else {
                console.log(
                  `未找到匹配物料节点，保持原状态: ${childNode.materialName}`
                );
                // 清空条码但保留其他信息
                // if (childNode.requireScan) {
                //   childNode.barcode = "";
                //   childNode.status = "PENDING";
                // }
              }
            }
          }
        } else {
          console.log(`未在新条码流程中找到根物料节点，将重置所有子节点状态`);

          // 如果没有找到根物料节点，重置所有子节点
          // for (const childNode of allChildNodes) {
          //   if (childNode.nodeType === "PROCESS_STEP") {
          //     childNode.status = "PENDING";
          //     childNode.endTime = null;
          //   } else if (
          //     childNode.nodeType === "MATERIAL" &&
          //     childNode.requireScan
          //   ) {
          //     childNode.barcode = "";
          //     childNode.status = "PENDING";
          //   }
          // }
        }
      } else {
        console.log(`新条码 ${newBarcode} 没有流程记录，将重置所有子节点状态`);

        // 如果新条码没有流程记录，重置所有子节点状态
        // for (const childNode of allChildNodes) {
        //   if (childNode.nodeType === "PROCESS_STEP") {
        //     childNode.status = "PENDING";
        //     childNode.endTime = null;
        //   } else if (
        //     childNode.nodeType === "MATERIAL" &&
        //     childNode.requireScan
        //   ) {
        //     childNode.barcode = "";
        //     childNode.status = "PENDING";
        //   }
        // }
      }

      // 8. 创建替换记录
      // 使用UnbindRecord模型来记录替换操作
      const UnbindRecord = require("../model/project/unbindRecord");

      console.log("创建替换记录");
      const unbindRecord = await UnbindRecord.create({
        mainBarcode: mainBarcode,
        processNodeId: processNodeId,
        processName: processNode.processName,
        processCode: processNode.processCode,
        processStepId: processNode.processStepId,
        flowRecordId: mainFlowRecord._id,
        operateTime: new Date(),
        operatorId: userId,
        reason: "物料替换",
        operationType: "REPLACE",
        unbindMaterials: [
          {
            materialId: materialNode.materialId,
            materialCode: materialNode.materialCode,
            materialName: materialNode.materialName,
            originalBarcode: oldBarcode,
            newBarcode: newBarcode,
            childNodesCount: allChildNodes.length, // 记录相关子节点数量
          },
        ],
      });
      console.log(`替换记录创建成功: ${unbindRecord._id}`);

      // 9. 保存主流程记录
      console.log("保存主流程记录");
      await mainFlowRecord.save();
      console.log("主流程记录保存成功");

      // 10. 返回替换结果
      console.log("=== 物料替换完成 ===");
      return {
        success: true,
        message: "物料替换成功",
        data: {
          mainBarcode,
          processName: processNode.processName,
          materialCode: materialNode.materialCode,
          materialName: materialNode.materialName,
          oldBarcode,
          newBarcode,
          childNodesCount: allChildNodes.length,
        },
      };
    } catch (error) {
      console.error("物料替换失败:", error);
      throw error;
    }
  }
}

module.exports = MaterialProcessFlowService;
