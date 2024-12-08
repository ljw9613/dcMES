const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const Craft = require("../model/project/craft");
const ProcessStep = require("../model/project/processStep");
const ProcessMaterials = require("../model/project/processMaterials");
const mongoose = require("mongoose");
const Material = mongoose.model("k3_BD_MATERIAL");

const { v4: uuidv4 } = require("uuid");

class MaterialProcessFlowService {
  /**
   * 根据物料编码创建工艺流程记录
   * @param {string} materialCode - 物料编码
   * @param {string} barcode - 物料条码
   * @returns {Promise<Object>} 创建的流程记录
   */
  static async createFlowByMaterialCode(materialCode, barcode) {
    try {
      console.log(
        "🚀 ~ createFlowByMaterialCode ~ materialCode:",
        materialCode
      );
      // 1. 获取物料信息
      const material = await Material.findOne({ FNumber: materialCode });
      if (!material) {
        throw new Error(`未找到物料编码为 ${materialCode} 的物料信息`);
      }

      // 2. 获取物料对应的工艺信息
      const craft = await Craft.findOne({ materialId: material._id });
      if (!craft) {
        throw new Error(`未找到物料 ${materialCode} 对应的工艺信息`);
      }

      // 3. 构建流程节点树
      const processNodes = await this.buildProcessNodes(material._id, craft);

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
   * @returns {Promise<Array>} 节点树数组
   */
  static async buildProcessNodes(materialId, craft) {
    try {
      const nodes = [];
      const processedMaterials = new Set(); // 用于防止循环引用

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

      // 处理工序节点
      if (craft.processSteps && craft.processSteps.length > 0) {
        for (const stepId of craft.processSteps) {
          const processStep = await ProcessStep.findById(stepId);
          if (!processStep) continue;

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
            requireScan: true,
            status: "PENDING",
          };
          nodes.push(processNode);

          // 获取工序关联的物料
          const processMaterials = await ProcessMaterials.find({
            processStepId: stepId,
          });

          // 处理工序物料节点
          for (const processMaterial of processMaterials) {
            // 防止循环引用
            if (processedMaterials.has(processMaterial.materialId.toString())) {
              continue;
            }
            processedMaterials.add(processMaterial.materialId.toString());

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

            // 递归处理子物料的工艺
            const subCraft = await Craft.findOne({ materialId: material._id });
            if (subCraft) {
              const subNodes = await this.buildProcessNodes(
                material._id,
                subCraft
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

    // 获取所有工序节点并按顺序排序
    const processSteps = processNodes
      .filter((node) => node.nodeType === "PROCESS_STEP")
      .sort((a, b) => a.processSort - b.processSort);

    // 找到当前工序的索引
    const currentIndex = processSteps.findIndex(
      (step) => step.nodeId === currentNode.nodeId
    );

    // 检查当前工序之前的所有工序
    for (let i = 0; i < currentIndex; i++) {
      const step = processSteps[i];
      if (step.status !== "COMPLETED") {
        unfinishedSteps.push({
          processName: step.processName,
          processCode: step.processCode,
          status: step.status,
        });
      }
    }

    return {
      isValid: unfinishedSteps.length === 0,
      unfinishedSteps,
    };
  }

  /**
   * 批量扫描工序子物料条码
   * @param {string} mainBarcode - 主条码
   * @param {string} processStepId - 工序ID
   * @param {Array<{materialId: string, barcode: string}>} componentScans - 子物料扫描信息数组
   */
  static async scanProcessComponents(
    mainBarcode,
    processStepId,
    componentScans
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

        if (subFlowRecord && subFlowRecord.status !== "COMPLETED") {
          throw new Error(`该${materialBarcode}物料条码的子物料工序未完成`);
        }
        console.log(
          "🚀 ~ MaterialProcessFlowService ~ subFlowRecord:",
          subFlowRecord.processNodes
        );
        console.log(
          "🚀 ~ MaterialProcessFlowService ~ flowRecord:",
          flowRecord.processNodes
        );
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
              flowRecord.processNodes[matchingNodeIndex].scanTime =
                subNode.scanTime;
              flowRecord.processNodes[matchingNodeIndex].endTime =
                subNode.endTime;
              flowRecord.processNodes[matchingNodeIndex].status =
                subNode.status;
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
              flowRecord.processNodes[matchingNodeIndex].scanTime =
                subNode.scanTime;
              flowRecord.processNodes[matchingNodeIndex].endTime =
                subNode.endTime;
              flowRecord.processNodes[matchingNodeIndex].status =
                subNode.status;
            }
          }
        }
      }
    }


    // 验证每个扫描的物料ID是否匹配
    for (const scan of componentScans) {
      console.log("🚀 ~ MaterialProcessFlowService ~ scan:", scan);
      console.log("🚀 ~ MaterialProcessFlowService ~ scan:", materialNodes);
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
          if (matchingScan) {
            return {
              ...node,
              barcode: matchingScan.barcode,
              status: "COMPLETED",
              scanTime: new Date(),
              endTime: new Date(),
            };
          }
        } else {
          console.log("🚀 ~ MaterialProcessFlowService ~ node:", node);
          return {
            ...node,
            status: "COMPLETED",
            scanTime: new Date(),
            endTime: new Date(),
          };
        }
      }
      // 如果是当前工序节点
      else if (node.nodeId === processNode.nodeId) {
        return {
          ...node,
          status: "COMPLETED",
          endTime: new Date(),
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

    // 保存更新
    await flowRecord.save();

    return flowRecord;
  }
}

module.exports = MaterialProcessFlowService;
