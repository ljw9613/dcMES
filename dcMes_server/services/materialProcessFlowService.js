const MaterialProcessFlow = require('../model/project/materialProcessFlow');
const Craft = require('../model/project/craft');
const ProcessStep = require('../model/project/processStep');
const ProcessMaterials = require('../model/project/processMaterials');
const mongoose = require("mongoose");
const Material = mongoose.model("k3_BD_MATERIAL");

const { v4: uuidv4 } = require('uuid');

class MaterialProcessFlowService {
    /**
     * 根据物料编码创建工艺流程记录
     * @param {string} materialCode - 物料编码
     * @param {string} barcode - 物料条码
     * @returns {Promise<Object>} 创建的流程记录
     */
    async createFlowByMaterialCode(materialCode, barcode) {
        try {
            console.log("🚀 ~ createFlowByMaterialCode ~ materialCode:", materialCode)
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
                status: 'PENDING'
            });

            // 5. 保存记录
            await flowRecord.save();

            return flowRecord;
        } catch (error) {
            console.error('创建工艺流程记录失败:', error);
            throw error;
        }
    }

    /**
     * 构建工艺流程节点树
     * @param {string} materialId - 物料ID
     * @param {Object} craft - 工艺信息
     * @returns {Promise<Array>} 节点树数组
     */
    async buildProcessNodes(materialId, craft) {
        try {
            const nodes = [];
            const processedMaterials = new Set(); // 用于防止循环引用

            // 创建根节点（主物料节点）
            const material = await Material.findById(materialId);
            const rootNode = {
                nodeId: uuidv4(),
                nodeType: 'MATERIAL',
                materialId: material._id,
                materialCode: material.FNumber,
                materialName: material.FName,
                materialSpec: material.FSpecification,
                level: 0,
                craftId: craft._id,
                craftName: craft.craftName,
                status: 'PENDING'
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
                        nodeType: 'PROCESS_STEP',
                        processStepId: processStep._id,
                        processName: processStep.processName,
                        processCode: processStep.processCode,
                        processSort: processStep.sort,
                        level: 1,
                        parentNodeId: rootNode.nodeId,
                        craftId: craft._id,
                        craftName: craft.craftName,
                        requireScan: true,
                        status: 'PENDING'
                    };
                    nodes.push(processNode);

                    // 获取工序关联的物料
                    const processMaterials = await ProcessMaterials.find({
                        processStepId: stepId
                    });

                    // 处理工序物料节点
                    for (const processMaterial of processMaterials) {
                        // 防止循环引用
                        if (processedMaterials.has(processMaterial.materialId.toString())) {
                            continue;
                        }
                        processedMaterials.add(processMaterial.materialId.toString());

                        const material = await Material.findById(processMaterial.materialId);
                        if (!material) continue;

                        // 创建物料节点
                        const materialNode = {
                            nodeId: uuidv4(),
                            nodeType: 'MATERIAL',
                            materialId: material._id,
                            materialCode: material.FNumber,
                            materialName: material.FName,
                            materialSpec: material.FSpecification,
                            materialQuantity: processMaterial.quantity,
                            materialUnit: processMaterial.unit,
                            level: 2,
                            barcode: '',
                            parentNodeId: processNode.nodeId,
                            craftId: craft._id,
                            craftName: craft.craftName,
                            isComponent: processMaterial.isComponent,
                            isKeyMaterial: processMaterial.isKey,
                            scanOperation: processMaterial.scanOperation,
                            requireScan: processMaterial.scanOperation,
                            status: 'PENDING'
                        };
                        nodes.push(materialNode);

                        // 递归处理子物料的工艺
                        const subCraft = await Craft.findOne({ materialId: material._id });
                        if (subCraft) {
                            const subNodes = await this.buildProcessNodes(material._id, subCraft);
                            // 调整子节点的层级和父节点
                            subNodes.forEach(node => {
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
            console.error('构建工艺流程节点失败:', error);
            throw error;
        }
    }
}

module.exports = new MaterialProcessFlowService();