const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const Craft = require("../model/project/craft");
const ProcessStep = require("../model/project/processStep");
const ProcessMaterials = require("../model/project/processMaterials");
const UnbindRecord = require("../model/project/unbindRecord");
const mongoose = require("mongoose");
const Material = mongoose.model("k3_BD_MATERIAL");

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

      // 4. 创建流程记录
      const flowRecord = new MaterialProcessFlow({
        barcode,
        materialId: material._id,
        materialCode: material.FNumber,
        materialName: material.FName,
        materialSpec: material.FSpecification,
        craftId: craft._id,
        craftVersion: craft.craftVersion,
        processNodes,
        startTime: new Date(),
        status: "PENDING",
        productLineId,
        productLineName,
      });

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
      const processSteps = await ProcessStep.find({ craftId: craft._id }).sort({
        sort: 1,
      });
      if (processSteps && processSteps.length > 0) {
        for (const processStep of processSteps) {
          // 创建工序节点
          const processNode = {
            nodeId: uuidv4(),
            nodeType: "PROCESS_STEP",
            processStepId: processStep._id,
            processName: processStep.processName,
            processCode: processStep.processCode,
            processSort: processStep.sort,
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

          // 如果工序不需要批次单，则获取工序关联的物料
          if (!processStep.batchDocRequired) {
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
                level: 2,
                barcode: "",
                parentNodeId: processNode.nodeId,
                craftId: craft._id,
                craftName: craft.craftName,
                isComponent: processMaterial.isComponent,
                isKeyMaterial: processMaterial.isKey,
                scanOperation: processMaterial.scanOperation,
                requireScan: processMaterial.scanOperation,
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
          }
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
   * @param {string} productionPlanWorkOrderId - 工单ID
   */
  static async scanProcessComponents(
    mainBarcode,
    processStepId,
    componentScans,
    userId,
    productionPlanWorkOrderId
  ) {
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

    console.log("🚀 ~ MaterialProcessFlowService ~ processNode:", processNode);
    if (!processNode) {
      throw new Error("未找到对应的工序节点");
    }

    // 验证工序节点状态
    if (processNode.status !== "PENDING") {
      throw new Error("该主物料条码对应工序节点已完成或处于异常状态");
    }

    // 检查前置工序完成状态
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

    // 验证扫码数量是否匹配
    if (componentScans.length !== materialNodes.length) {
      throw new Error(
        `扫码数量与要求不符，需要扫描 ${materialNodes.length} 个物料，实际扫描 ${componentScans.length} 个`
      );
    }

    // 检查条码是否有重复
    const uniqueBarcodes = new Set(componentScans.map((scan) => scan.barcode));
    if (uniqueBarcodes.size !== componentScans.length) {
      throw new Error("存在重复扫描的条码");
    }

    // 添加关键物料条码重复使用检查
    for (const scan of componentScans) {
      const matchingNode = materialNodes.find(
        (node) => node.materialId.toString() === scan.materialId.toString()
      );

      if (matchingNode && matchingNode.isKeyMaterial) {
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
              `关键物料条码 ${scan.barcode} 已被其他流程使用:\n${usageDetails
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

        // 将subFlowRecord.processNodes对应物料扫码状态匹配给flowRecord.processNodes
        for await (const subNode of subFlowRecord.processNodes) {
          if (subNode.nodeType === "MATERIAL") {
            const matchingNodeIndex = flowRecord.processNodes.findIndex(
              (node) =>
                node.materialId &&
                node.materialId.toString() === subNode.materialId.toString()
            );

            if (matchingNodeIndex !== -1) {
              flowRecord.processNodes[matchingNodeIndex].barcode =
                subNode.barcode;
              if (
                subNode.barcode.includes("-") &&
                subNode.barcode.length < 30
              ) {
                flowRecord.processNodes[matchingNodeIndex].relatedBill =
                  subNode.barcode.split("-")[1];
              }
              flowRecord.processNodes[matchingNodeIndex].scanTime =
                subNode.scanTime;
              flowRecord.processNodes[matchingNodeIndex].endTime =
                subNode.endTime;
              flowRecord.processNodes[matchingNodeIndex].status =
                subNode.status;
              flowRecord.processNodes[matchingNodeIndex].updateBy = userId;
            }
          }
          if (subNode.nodeType === "PROCESS_STEP") {
            const matchingNodeIndex = flowRecord.processNodes.findIndex(
              (node) =>
                node.processStepId &&
                node.processStepId.toString() ===
                  subNode.processStepId.toString()
            );

            if (matchingNodeIndex !== -1) {
              flowRecord.processNodes[matchingNodeIndex].barcode =
                subNode.barcode;
              if (
                subNode.barcode.includes("-") &&
                subNode.barcode.length < 30
              ) {
                flowRecord.processNodes[matchingNodeIndex].relatedBill =
                  subNode.barcode.split("-")[1];
              }
              flowRecord.processNodes[matchingNodeIndex].scanTime =
                subNode.scanTime;
              flowRecord.processNodes[matchingNodeIndex].endTime =
                subNode.endTime;
              flowRecord.processNodes[matchingNodeIndex].status =
                subNode.status;
              flowRecord.processNodes[matchingNodeIndex].updateBy = userId;
            }
          }
        }
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

    // 在更新节点状态之前，检查是否为首道或末道工序
    const processPosition = this.checkProcessPosition(
      flowRecord.processNodes,
      processNode
    );

    console.log(productionPlanWorkOrderId, " productionPlanWorkOrderId");

    // 如果是首道工序，且物料ID匹配，更新工单投入量
    if (processPosition.isFirst) {
      console.log(flowRecord.materialId);
      await this.updateWorkOrderQuantity(
        productionPlanWorkOrderId,
        flowRecord.materialId,
        "input"
      );
    }

    // 更新 processNodes 中的物料节点信息
    flowRecord.processNodes = flowRecord.processNodes.map((node) => {
      // 如果是当前工序的物料节点
      if (
        node.parentNodeId === processNode.nodeId &&
        node.nodeType === "MATERIAL"
      ) {
        if (node.requireScan) {
          const matchingScan = componentScans.find(
            (scan) => scan.materialId.toString() === node.materialId.toString()
          );
          let relatedBill = "";
          if (
            matchingScan.barcode.includes("-") &&
            matchingScan.barcode.length < 30
          ) {
            relatedBill = matchingScan.barcode.split("-")[1];
          }
          if (matchingScan) {
            return {
              ...node,
              barcode: matchingScan.barcode,
              relatedBill: relatedBill,
              status: "COMPLETED",
              scanTime: new Date(),
              endTime: new Date(),
              updateBy: userId,
            };
          }
        } else {
          console.log("🚀 ~ MaterialProcessFlowService ~ node:", node);
          return {
            ...node,
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
          ...node,
          status: "COMPLETED",
          endTime: new Date(),
          updateBy: userId,
        };
      }
      return node;
    });

    // 如果是首个操作，更新整体流程的开始时间和状态
    if (!flowRecord.startTime) {
      flowRecord.startTime = new Date();
      flowRecord.status = "IN_PROCESS";
    }

    // 计算整体进度
    const completedNodes = flowRecord.processNodes.filter(
      (node) => node.status === "COMPLETED" && node.level !== 0
    ).length;
    flowRecord.progress = Math.floor(
      (completedNodes / (flowRecord.processNodes.length - 1)) * 100
    );

    // 检查是否所有节点都已完成
    if (flowRecord.progress === 100) {
      flowRecord.status = "COMPLETED";
      flowRecord.endTime = new Date();
      const materialNode = flowRecord.processNodes.find(
        (node) => node.nodeType === "MATERIAL" && node.level === 0
      );
      materialNode.status = "COMPLETED";
      materialNode.endTime = new Date();
    }

    // 如果是末道工序且所有节点完成，更新工单产出量
    if (processPosition.isLast && flowRecord.progress === 100) {
      await this.updateWorkOrderQuantity(
        productionPlanWorkOrderId,
        flowRecord.materialId,
        "output"
      );
    }

    // 保存更新
    await flowRecord.save();

    return flowRecord;
  }

  /**
   * 工序解绑
   * @param {string} mainBarcode - 主条码
   * @param {string} processStepId - 工序ID
   * @param {string} userId - 用户ID
   * @param {string} reason - 解绑原因
   * @param {boolean} unbindSubsequent - 是否解绑后续工序
   */
  static async unbindProcessComponents(
    mainBarcode,
    processStepId,
    userId,
    reason,
    unbindSubsequent = false
  ) {
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
          unbindSubsequent && processNodeToUnbind.nodeId === processNode.nodeId, // 只在触发解绑的工序记录上标记
        affectedProcesses: [
          {
            processStepId: processNodeToUnbind.processStepId,
            processName: processNodeToUnbind.processName,
            processCode: processNodeToUnbind.processCode,
          },
        ],
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
    await flowRecord.save();

    return flowRecord;
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

      // 4. 合并新旧节点
      const updatedNodes = [];
      const processedNodeIds = new Set();

      // 首先处理已完成的旧节点
      flowRecord.processNodes.forEach((oldNode) => {
        if (oldNode.status === "COMPLETED") {
          const newNode = newProcessNodes.find((node) => {
            if (
              oldNode.nodeType === "PROCESS_STEP" &&
              node.nodeType === "PROCESS_STEP"
            ) {
              return (
                node.processCode === oldNode.processCode &&
                node.level === oldNode.level
              );
            }
            if (
              oldNode.nodeType === "MATERIAL" &&
              node.nodeType === "MATERIAL"
            ) {
              return (
                node.materialId.toString() === oldNode.materialId.toString() &&
                node.level === oldNode.level
              );
            }
            return false;
          });

          if (newNode) {
            // 保留已完成节点的信息
            updatedNodes.push({
              ...newNode,
              status: oldNode.status,
              barcode: oldNode.barcode || "",
              scanTime: oldNode.scanTime,
              endTime: oldNode.endTime,
              updateBy: oldNode.updateBy,
            });
            processedNodeIds.add(newNode.nodeId);

            // 如果是工序节点，标记同级别的其他工序节点
            if (oldNode.nodeType === "PROCESS_STEP") {
              const sameLevelNodes = newProcessNodes.filter(
                (node) =>
                  node.nodeType === "PROCESS_STEP" &&
                  node.level === oldNode.level &&
                  node.parentNodeId === newNode.parentNodeId
              );
              sameLevelNodes.forEach((node) => {
                processedNodeIds.add(node.nodeId);
              });
            }
          }
        }
      });

      // 添加未处理的新节点
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

      // 6. 新计算进度
      const completedNodes = flowRecord.processNodes.filter(
        (node) => node.status === "COMPLETED" && node.level !== 0
      ).length;
      flowRecord.progress = Math.floor(
        (completedNodes / (flowRecord.processNodes.length - 1)) * 100
      );

      // 7. 保存更新
      await flowRecord.save();

      return flowRecord;
    } catch (error) {
      console.error("更新工艺流程记录失败:", error);
      throw error;
    }
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
   * @param {string} userId - 用户ID
   */
  static async scanBatchDocument(
    mainBarcode,
    processStepId,
    batchDocNumber,
    userId
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
          node.nodeType === "PROCESS_STEP" &&
          node.isSpecialProcess &&
          node.batchDocRequired
      );

      if (!processNode) {
        throw new Error("未找到对应的特殊工序节点");
      }

      // 验证工序节点状态
      if (processNode.status !== "PENDING") {
        throw new Error("该工序节点已完成或处于异常状态");
      }

      // 检查前置工序完成状态
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

      // 计算整体进度
      const completedNodes = flowRecord.processNodes.filter(
        (node) => node.status === "COMPLETED" && node.level !== 0
      ).length;
      flowRecord.progress = Math.floor(
        (completedNodes / (flowRecord.processNodes.length - 1)) * 100
      );

      // 检查是否所有节点都已完成
      if (flowRecord.progress === 100) {
        flowRecord.status = "COMPLETED";
        flowRecord.endTime = new Date();
        const materialNode = flowRecord.processNodes.find(
          (node) => node.nodeType === "MATERIAL" && node.level === 0
        );
        materialNode.status = "COMPLETED";
        materialNode.endTime = new Date();
      }

      // 保存更新
      await flowRecord.save();

      return flowRecord;
    } catch (error) {
      console.error("扫描批次单据失败:", error);
      throw error;
    }
  }

  /**
   * 更新工单数量
   * @param {string} workOrderId - 工单ID
   * @param {string} materialId - 物料ID
   * @param {string} type - 更新类型 ('input' | 'output')
   * @param {number} quantity - 更新数量
   */
  static async updateWorkOrderQuantity(
    workOrderId,
    materialId,
    type,
    quantity = 1
  ) {
    try {
      const updateField = type === "input" ? "inputQuantity" : "outputQuantity";

      console.log(workOrderId, " workOrderId");
      console.log(materialId, " materialId");
      const workOrder = await mongoose
        .model("production_plan_work_order")
        .findOneAndUpdate(
          { _id: workOrderId, materialId: materialId },
          { $inc: { [updateField]: quantity } },
          { new: true }
        );

      if (!workOrder) {
        // throw new Error("未找到对应的工单");
        console.log("未找到对应的工单");
      }

      return workOrder;
    } catch (error) {
      console.error(
        `更新工单${type === "input" ? "投入" : "产出"}数量失败:`,
        error
      );
      throw error;
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
}

module.exports = MaterialProcessFlowService;
