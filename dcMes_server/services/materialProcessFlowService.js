const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const Craft = require("../model/project/craft");
const ProcessStep = require("../model/project/processStep");
const ProcessMaterials = require("../model/project/processMaterials");
const UnbindRecord = require("../model/project/unbindRecord");
const ProductionPlanWorkOrder = require("../model/project/productionPlanWorkOrder");
const productBarcodeRule = require("../model/project/productBarcodeRule");
const barcodeRule = require("../model/project/barcodeRule");
const ProductInitializeLog = require("../model/project/productInitializeLog");
const WorkOrderQuantityLog = require("../model/project/workOrderQuantityLog");
const ProductDiNum = require("../model/project/productDiNum");
const K3Material = require("../model/k3/k3_BD_MATERIAL");
const MachineModel = require("../model/project/machine");
const { QueueService } = require("./queueService");
const mongoose = require("mongoose");
const productDiNum = ProductDiNum;
const Material = K3Material;
const Machine = MachineModel;
// const SystemLog = require("../model/project/systemLog");

const { v4: uuidv4 } = require("uuid");
const Redis = require("ioredis");

/**
 * 【性能优化】基于 Redis 的条码规则缓存
 * 适用于 PM2 负载均衡环境，多个进程共享缓存
 * 使用独立的 Redis DB（DB 3），不影响其他 Redis 服务
 */
class BarcodeRuleCache {
  constructor() {
    this.cacheTimeout = 5 * 60; // 5分钟（Redis使用秒为单位）
    this.keyPrefix = "barcode_rule:"; // 缓存键前缀
    this.redis = null;
    this.connected = false;

    // 初始化 Redis 连接
    this.initRedis();
  }

  /**
   * 初始化 Redis 连接（使用独立的 DB 3）
   */
  initRedis() {
    try {
      // 创建独立的 Redis 连接，使用 DB 3 避免冲突
      this.redis = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: 2, // 使用 DB 3 存储条码规则缓存（独立于队列服务的 DB 2）

        // 连接选项
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        lazyConnect: false, // 立即连接
        keepAlive: 30000,

        // 连接池配置
        family: 4,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      // 连接成功事件
      this.redis.on("connect", () => {
        console.log("🔗 条码规则缓存 Redis 连接已建立 (DB 3)");
      });

      // 连接就绪事件
      this.redis.on("ready", () => {
        this.connected = true;
        console.log("✅ 条码规则缓存 Redis 连接就绪 (DB 3)");
      });

      // 连接错误事件（降级为内存缓存）
      this.redis.on("error", (error) => {
        this.connected = false;
        console.warn(
          "⚠️ 条码规则缓存 Redis 连接错误，将使用内存缓存:",
          error.message
        );
      });

      // 连接关闭事件
      this.redis.on("close", () => {
        this.connected = false;
        console.log("🔌 条码规则缓存 Redis 连接已关闭");
      });

      // 重连事件
      this.redis.on("reconnecting", (delay) => {
        console.log(`🔄 条码规则缓存 Redis 正在重连... (${delay}ms)`);
      });
    } catch (error) {
      console.error("❌ 初始化条码规则缓存 Redis 失败:", error.message);
      console.warn("⚠️ 将使用内存缓存作为降级方案");
      this.redis = null;
      this.connected = false;
    }
  }

  /**
   * 获取缓存的条码规则
   * @param {string} materialId - 物料ID
   * @returns {Promise<Array|null>} 规则数组或 null
   */
  async get(materialId) {
    if (!this.connected || !this.redis) {
      return null;
    }

    try {
      const key = this.keyPrefix + materialId.toString();
      const cached = await this.redis.get(key);

      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.warn("⚠️ Redis 获取缓存失败，跳过缓存:", error.message);
      return null;
    }
  }

  /**
   * 设置缓存的条码规则
   * @param {string} materialId - 物料ID
   * @param {Array} rules - 规则数组
   */
  async set(materialId, rules) {
    if (!this.connected || !this.redis) {
      return;
    }

    try {
      const key = this.keyPrefix + materialId.toString();
      await this.redis.setex(key, this.cacheTimeout, JSON.stringify(rules));
    } catch (error) {
      console.warn("⚠️ Redis 设置缓存失败:", error.message);
    }
  }

  /**
   * 清除缓存
   * @param {string} materialId - 物料ID（可选，不传则清除所有）
   */
  async clear(materialId) {
    if (!this.connected || !this.redis) {
      console.log("⚠️ Redis 未连接，无法清除缓存");
      return 0;
    }

    try {
      if (materialId) {
        const key = this.keyPrefix + materialId.toString();
        const result = await this.redis.del(key);
        console.log(`🗑️ 已清除物料 ${materialId} 的条码规则缓存`);
        return result;
      } else {
        // 清除所有以 keyPrefix 开头的键
        const keys = await this.redis.keys(this.keyPrefix + "*");
        if (keys.length > 0) {
          const result = await this.redis.del(...keys);
          console.log(`🗑️ 已清除所有条码规则缓存 (共 ${keys.length} 项)`);
          return result;
        }
        console.log("🗑️ 没有缓存需要清除");
        return 0;
      }
    } catch (error) {
      console.error("❌ Redis 清除缓存失败:", error.message);
      return 0;
    }
  }

  /**
   * 批量清除多个物料的缓存
   * @param {Array<string>} materialIds - 物料ID数组
   */
  async clearBatch(materialIds) {
    if (!this.connected || !this.redis) {
      console.log("⚠️ Redis 未连接，无法清除缓存");
      return 0;
    }

    if (!Array.isArray(materialIds)) {
      materialIds = [materialIds];
    }

    try {
      const keys = materialIds.map((id) => this.keyPrefix + id.toString());
      if (keys.length > 0) {
        const result = await this.redis.del(...keys);
        console.log(`🗑️ 已清除 ${result} 个物料的条码规则缓存`);
        return result;
      }
      return 0;
    } catch (error) {
      console.error("❌ Redis 批量清除缓存失败:", error.message);
      return 0;
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats() {
    if (!this.connected || !this.redis) {
      return {
        connected: false,
        message: "Redis 未连接",
        total: 0,
        active: 0,
        cacheTimeout: this.cacheTimeout + "秒",
      };
    }

    try {
      const keys = await this.redis.keys(this.keyPrefix + "*");
      const total = keys.length;

      // 检查每个键的 TTL
      let active = 0;
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl > 0) {
          active++;
        }
      }

      return {
        connected: true,
        total,
        active,
        expired: total - active,
        cacheTimeout: this.cacheTimeout + "秒",
        db: 3,
        keyPrefix: this.keyPrefix,
      };
    } catch (error) {
      console.error("❌ 获取缓存统计失败:", error.message);
      return {
        connected: false,
        error: error.message,
        total: 0,
        active: 0,
        cacheTimeout: this.cacheTimeout + "秒",
      };
    }
  }

  /**
   * 定期清理过期缓存（Redis 自动过期，此方法用于日志）
   */
  startAutoCleanup() {
    // Redis 会自动清理过期键，这里只是定期记录统计信息
    setInterval(async () => {
      if (this.connected) {
        try {
          const stats = await this.getStats();
          if (stats.expired > 0) {
            console.log(
              `🧹 Redis 自动过期清理: ${stats.expired} 项 (总计: ${stats.total})`
            );
          }
        } catch (error) {
          // 忽略错误
        }
      }
    }, 10 * 60 * 1000); // 每10分钟记录一次
  }

  /**
   * 关闭 Redis 连接
   */
  async disconnect() {
    if (this.redis) {
      try {
        await this.redis.disconnect();
        console.log("👋 条码规则缓存 Redis 连接已关闭");
      } catch (error) {
        console.error("❌ 关闭 Redis 连接失败:", error.message);
      }
    }
  }
}

class MaterialProcessFlowService {
  // 初始化条码规则缓存（每个进程独立）
  static barcodeRuleCache = new BarcodeRuleCache();

  /**
   * 【缓存管理】清除条码规则缓存
   * 用途：当条码规则或产品条码规则更新时，调用此方法清除缓存
   * @param {string|Array<string>} materialId - 物料ID（可选，不传则清除所有）
   * @returns {Promise<Object>} 清除结果
   */
  static async clearBarcodeRuleCache(materialId = null) {
    try {
      if (materialId === null) {
        // 清除所有缓存
        const count = await this.barcodeRuleCache.clear();
        return {
          success: true,
          message: "已清除所有条码规则缓存",
          type: "all",
          count,
        };
      } else if (Array.isArray(materialId)) {
        // 批量清除
        const count = await this.barcodeRuleCache.clearBatch(materialId);
        return {
          success: true,
          message: `已清除 ${count} 个物料的条码规则缓存`,
          type: "batch",
          count,
        };
      } else {
        // 单个清除
        const count = await this.barcodeRuleCache.clear(materialId);
        return {
          success: true,
          message: `已清除物料 ${materialId} 的条码规则缓存`,
          type: "single",
          materialId,
          count,
        };
      }
    } catch (error) {
      console.error("清除缓存失败:", error);
      return {
        success: false,
        message: error.message,
        error,
      };
    }
  }

  /**
   * 【缓存管理】获取缓存统计信息
   * @returns {Promise<Object>} 缓存统计
   */
  static async getBarcodeRuleCacheStats() {
    return await this.barcodeRuleCache.getStats();
  }

  /**
   * 【缓存管理】Redis 健康检查
   * 用于诊断 Redis 连接状态和读写功能
   * @returns {Promise<Object>} 健康检查结果
   */
  static async checkBarcodeRuleCacheHealth() {
    const cache = this.barcodeRuleCache;
    const result = {
      connected: cache.connected,
      redisExists: cache.redis !== null,
      config: {
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        db: 3,
        cacheTimeout: cache.cacheTimeout + "秒",
        keyPrefix: cache.keyPrefix,
      },
      test: null,
    };

    // 如果 Redis 连接存在，进行读写测试
    if (cache.redis && cache.connected) {
      try {
        const testKey = cache.keyPrefix + "health_check_test";
        const testValue = { timestamp: new Date().toISOString(), test: true };

        // 写入测试
        await cache.redis.setex(testKey, 10, JSON.stringify(testValue));

        // 读取测试
        const retrieved = await cache.redis.get(testKey);
        const parsed = JSON.parse(retrieved);

        // 删除测试数据
        await cache.redis.del(testKey);

        result.test = {
          success: true,
          message: "Redis 读写测试成功",
          writeSuccess: true,
          readSuccess: parsed.test === true,
          deleteSuccess: true,
        };
      } catch (error) {
        result.test = {
          success: false,
          message: "Redis 读写测试失败",
          error: error.message,
        };
      }
    } else {
      result.test = {
        success: false,
        message: "Redis 未连接，无法进行测试",
        reason: !cache.redis ? "Redis 实例不存在" : "Redis 连接状态为 false",
      };
    }

    // 获取 Redis 服务器信息
    if (cache.redis && cache.connected) {
      try {
        const info = await cache.redis.info("server");
        const lines = info.split("\r\n");
        const serverInfo = {};
        lines.forEach((line) => {
          if (line && !line.startsWith("#")) {
            const [key, value] = line.split(":");
            if (key && value) {
              serverInfo[key.trim()] = value.trim();
            }
          }
        });
        result.serverInfo = {
          redis_version: serverInfo.redis_version,
          redis_mode: serverInfo.redis_mode,
          uptime_in_seconds: serverInfo.uptime_in_seconds,
        };
      } catch (error) {
        result.serverInfo = { error: "无法获取服务器信息: " + error.message };
      }
    }

    return result;
  }

  /**
   * 【性能优化】统一的进度计算方法
   * 避免在多处重复实现相同的计算逻辑
   * @param {Array} processNodes - 流程节点数组
   * @returns {number} 进度百分比 (0-100)
   */
  static calculateFlowProgress(processNodes) {
    let totalRequired = 0;
    let totalCompleted = 0;

    // 单次遍历统计 - O(n)
    for (const node of processNodes) {
      // 排除根节点
      if (node.level === 0) continue;

      // 只计算必要的节点
      const isRequired =
        node.nodeType === "PROCESS_STEP" ||
        (node.nodeType === "MATERIAL" && node.requireScan === true);

      if (isRequired) {
        totalRequired++;
        if (node.status === "COMPLETED") {
          totalCompleted++;
        }
      }
    }

    return totalRequired > 0
      ? Math.floor((totalCompleted / totalRequired) * 100)
      : 0;
  }

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
    productLineName,
    isFromDevice = false,
    productionPlanWorkOrderId = null
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

      let planWorkOrder = null;
      if (isFromDevice) {
        planWorkOrder = await ProductionPlanWorkOrder.findOne({
          _id: productionPlanWorkOrderId,
        });
      } else {
        // 根据产线ID获取对应的工单
        planWorkOrder = await ProductionPlanWorkOrder.findOne({
          productionLineId: productLineId,
          // materialId: material._id,
          status: "IN_PROGRESS",
        });
      }

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
   * 构建工艺流程节点树（性能优化版 - 批量查询）
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

      // 查询所有工序步骤
      const processSteps = await ProcessStep.find({
        craftId: craft._id,
        isMES: true,
      }).sort({
        sort: 1,
      });

      if (processSteps && processSteps.length > 0) {
        // 【性能优化】批量查询所有工序的物料关系
        const processStepIds = processSteps.map((ps) => ps._id);
        const allProcessMaterials = await ProcessMaterials.find({
          processStepId: { $in: processStepIds },
        });

        // 按 processStepId 分组物料
        const materialsByStep = new Map();
        allProcessMaterials.forEach((pm) => {
          const key = pm.processStepId.toString();
          if (!materialsByStep.has(key)) {
            materialsByStep.set(key, []);
          }
          materialsByStep.get(key).push(pm);
        });

        // 【性能优化】批量查询所有物料信息
        const allMaterialIds = allProcessMaterials.map((pm) => pm.materialId);
        const allMaterials = await Material.find({
          _id: { $in: allMaterialIds },
        });
        const materialMap = new Map(
          allMaterials.map((m) => [m._id.toString(), m])
        );

        // 【性能优化】批量查询所有子物料的工艺信息
        const allCrafts = await Craft.find({
          materialId: { $in: allMaterialIds },
        });
        const craftMap = new Map(
          allCrafts.map((c) => [c.materialId.toString(), c])
        );

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

          // 获取该工序的物料（从缓存的 Map 中获取）
          const processMaterials =
            materialsByStep.get(processStep._id.toString()) || [];

          // 处理工序物料节点
          for (const processMaterial of processMaterials) {
            const material = materialMap.get(
              processMaterial.materialId.toString()
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

            // 递归处理子物料的工艺（从缓存的 Map 中获取）
            const subCraft = craftMap.get(material._id.toString());
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
   * @param {boolean} isFromDevice - 是否来自设备
   * @param {string} productionPlanWorkOrderId - 指定工单ID
   */
  static async scanProcessComponents(
    mainBarcode,
    processStepId,
    componentScans,
    userId,
    lineId,
    isFromDevice = false,
    productionPlanWorkOrderId = null
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
      let flowRecord;
      if (mainBarcode.includes("DCZZ-")) {
        flowRecord = await MaterialProcessFlow.findOne({
          diyCode: mainBarcode,
        });
      } else {
        flowRecord = await MaterialProcessFlow.findOne({
          barcode: mainBarcode,
        });
      }

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

      // 【性能优化】批量检查关键物料和批次用量
      // 只收集需要检查的条码（有数量限制的批次条码 + 关键物料条码）
      // 注意：关键物料和批次物料互斥，不会同时存在
      // 限制数量为0的批次物料不查询，避免查询大量记录导致超时
      const batchBarcodes = [];
      const keyMaterialBarcodes = [];

      // 分类收集需要检查的条码
      for (const scan of componentScans) {
        const matchingNode = materialNodes.find(
          (node) => node.materialId.toString() === scan.materialId.toString()
        );

        if (matchingNode) {
          // 关键物料和批次物料互斥，优先判断批次物料（因为有数量限制需要检查）
          // 只收集有数量限制的批次条码（batchQuantity > 0），限制为0的不查询避免超时
          if (matchingNode.isBatch && matchingNode.batchQuantity > 0) {
            batchBarcodes.push({
              barcode: scan.barcode,
              limit: matchingNode.batchQuantity,
            });
          } else if (matchingNode.isKeyMaterial) {
            // 关键物料条码（不会与批次物料同时存在）
            keyMaterialBarcodes.push(scan.barcode);
          }
        }
      }

      // 只查询需要检查的条码（有数量限制的批次条码 + 关键物料条码）
      const barcodesToCheck = [
        ...batchBarcodes.map((b) => b.barcode),
        ...keyMaterialBarcodes,
      ];

      console.log(
        "🚀 ~ MaterialProcessFlowService ~ barcodesToCheck:",
        barcodesToCheck
      );

      // 构建使用情况映射
      const usageMap = new Map();

      // 统一查询有数量限制的批次条码和关键物料条码的使用情况
      if (barcodesToCheck.length > 0) {
        const batchBarcodesList = batchBarcodes.map((b) => b.barcode);

        // 【性能优化】批量查询所有条码的使用情况（一次查询）
        // 使用点号语法和 $ 投影，避免 $elemMatch 导致的性能问题
        // 注意：这种方式会匹配任何满足条件的数组元素，但性能更好
        const allUsageFlows = await MaterialProcessFlow.find({
          "processNodes.barcode": { $in: barcodesToCheck },
          "processNodes.status": "COMPLETED",
        }).select("barcode processNodes.$");

        console.log(
          "🚀 ~ MaterialProcessFlowService ~ allUsageFlows:",
          allUsageFlows.length
        );

        // 构建条码使用情况映射
        for (const flow of allUsageFlows) {
          for (const node of flow.processNodes) {
            // 只处理匹配的条码（虽然用了 $ 投影，但为安全起见仍需要检查）
            if (
              barcodesToCheck.includes(node.barcode) &&
              node.status === "COMPLETED"
            ) {
              // 批次条码：记录所有使用情况（不管是否关键物料）
              // 关键物料条码：只记录 isKeyMaterial 为 true 的使用情况
              const isBatchBarcode = batchBarcodesList.includes(node.barcode);
              const isKeyMaterialBarcode = keyMaterialBarcodes.includes(
                node.barcode
              );

              // 对于批次条码，记录所有使用情况
              // 对于关键物料条码，只记录 isKeyMaterial 为 true 的
              if (
                isBatchBarcode ||
                (isKeyMaterialBarcode && node.isKeyMaterial === true)
              ) {
                if (!usageMap.has(node.barcode)) {
                  usageMap.set(node.barcode, []);
                }
                usageMap.get(node.barcode).push({
                  mainBarcode: flow.barcode,
                  isKeyMaterial: node.isKeyMaterial,
                  scanTime: node.scanTime,
                });
              }
            }
          }
        }
      }

      // 检查批次用量限制
      for (const batchInfo of batchBarcodes) {
        const usage = usageMap.get(batchInfo.barcode) || [];
        if (usage.length >= batchInfo.limit) {
          throw new Error(
            `批次物料条码 ${batchInfo.barcode} 已达到使用次数限制(${batchInfo.limit}次)`
          );
        }
      }

      console.log(
        "🚀 ~ MaterialProcessFlowService ~ keyMaterialBarcodes:",
        keyMaterialBarcodes
      );
      // 检查关键物料重复使用
      for (const keyBarcode of keyMaterialBarcodes) {
        const usage = usageMap.get(keyBarcode) || [];
        const otherFlows = usage.filter(
          (u) => u.mainBarcode !== mainBarcode && u.isKeyMaterial
        );
        console.log(
          "🚀 ~ MaterialProcessFlowService ~ otherFlows:",
          otherFlows
        );
        if (otherFlows.length > 0) {
          // 获取完整的流程信息用于错误提示
          const flowIds = otherFlows.map((u) => u.mainBarcode);
          console.log("🚀 ~ MaterialProcessFlowService ~ flowIds:", flowIds);
          const detailedFlows = await MaterialProcessFlow.find({
            barcode: { $in: flowIds },
          }).select("barcode materialCode materialName");

          const usageDetails = detailedFlows.map((flow, idx) => ({
            mainBarcode: flow.barcode,
            materialCode: flow.materialCode,
            materialName: flow.materialName,
            scanTime: otherFlows[idx]?.scanTime,
          }));

          throw new Error(
            `关键物料条码 ${keyBarcode} 已被其他流程使用:\n${usageDetails
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

          // 验证主物料工序节点和子物料工序节点是否完全匹配
          const compatibilityResult = this.validateProcessNodesCompatibility(
            flowRecord.processNodes,
            subFlowRecord.processNodes,
            node
          );

          if (!compatibilityResult.isValid) {
            // 构建详细的错误信息
            let errorMessage = `工序异常：条码 ${materialBarcode.barcode} 的工序节点与主物料要求不匹配。\n${compatibilityResult.message}`;

            if (compatibilityResult.unmatchedProcesses) {
              errorMessage += `\n\n不匹配的工序详情：`;
              compatibilityResult.unmatchedProcesses.forEach((process) => {
                errorMessage += `\n第${process.position}个工序：主物料需要 ${process.mainProcess}，子物料是 ${process.subProcess}`;
              });
            }

            if (
              compatibilityResult.mainProcesses &&
              compatibilityResult.subProcesses
            ) {
              errorMessage += `\n\n主物料要求的工序：${compatibilityResult.mainProcesses.join(
                "、"
              )}`;
              errorMessage += `\n子物料当前的工序：${compatibilityResult.subProcesses.join(
                "、"
              )}`;
            }

            errorMessage += `\n\n请确保子物料条码 ${materialBarcode.barcode} 使用的工艺与主物料当前绑定的工艺完全一致。`;

            throw new Error(errorMessage);
          }

          console.log(`工序节点匹配验证通过：${compatibilityResult.message}`);

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
      let planWorkOrder = null;
      //根据产线获取对应的工单
      if (flowRecord.isProduct) {
        if (!isFromDevice) {
          planWorkOrder = await ProductionPlanWorkOrder.findOne({
            productionLineId: lineId,
            materialId: flowRecord.materialId,
            status: "IN_PROGRESS",
          });
        } else {
          if (
            !flowRecord.productionPlanWorkOrderId &&
            !productionPlanWorkOrderId
          ) {
            throw new Error("当前产品条码未绑定工单,请选择工单后投入");
          }
          planWorkOrder = await ProductionPlanWorkOrder.findOne({
            _id:
              flowRecord.productionPlanWorkOrderId || productionPlanWorkOrderId,
          });
        }
      }

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
          planWorkOrder.inputQuantity - planWorkOrder.scrapQuantity >=
          planWorkOrder.planProductionQuantity
        ) {
          throw new Error("工单已达到计划数量，无法继续投入");
        }
      }

      // 如果是首道工序，且物料ID匹配，更新工单投入量
      if (planWorkOrder) {
        if (processPosition.isFirst) {
          try {
            const inputUpdateResult = await this.updateWorkOrderQuantity(
              planWorkOrder._id,
              "input",
              1,
              {
              relatedBarcode: mainBarcode,
              barcodeOperation: "SCAN_PROCESS",
              operatorId: userId,
              processStepId: processStepId,
              processName: processNode.processName,
              processCode: processNode.processCode,
              reason: "扫描工序组件首道工序投入",
              source: isFromDevice ? "DEVICE" : "WEB",
              isAutomatic: true,
              }
            );

            // 关键：工单服务返回失败时不要静默继续，避免“流程完成但工单数量未更新”
            if (!inputUpdateResult || inputUpdateResult.success !== true) {
              throw new Error(
                inputUpdateResult?.error ||
                  inputUpdateResult?.message ||
                  "更新工单投入量失败"
              );
            }
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

                // 【关键修复】检查条码验证结果
                if (!validationResult.isValid) {
                  throw new Error(
                    validationResult.error ||
                      `条码 ${matchingScan.barcode} 验证失败，不符合物料 ${material.FNumber}(${material.FName}) 的条码规则`
                  );
                }

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

      //如果正常进行，条码产品状态改为正常
      flowRecord.productStatus = "NORMAL";

      // 【性能优化】使用统一的进度计算方法
      flowRecord.progress = this.calculateFlowProgress(flowRecord.processNodes);

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
        if (flowRecord.progress === 100 && processPosition.isLast) {
          // 检查该条码是否已经完成过产出统计，防止重复统计
          // 条码报废后不可再生产，只需处理解绑后重新生产的情况

          // 1. 查找该条码的最后一次产出增加记录
          const lastOutputRecord = await mongoose
            .model("workOrderQuantityLog")
            .findOne({
              workOrderId: planWorkOrder._id,
              relatedBarcode: mainBarcode,
              changeType: "output",
              changeQuantity: { $gt: 0 }, // 只查找增加产出量的记录
            })
            .sort({ operateTime: -1 });

          // 2. 查找该条码的最后一次解绑减少记录
          const lastUnbindRecord = await mongoose
            .model("workOrderQuantityLog")
            .findOne({
              workOrderId: planWorkOrder._id,
              relatedBarcode: mainBarcode,
              changeType: "output",
              changeQuantity: { $lt: 0 }, // 查找减少产出量的记录
              barcodeOperation: "UNBIND_PROCESS", // 只查找解绑操作
            })
            .sort({ operateTime: -1 });

          // 3. 判断是否需要更新产出量
          let shouldUpdateOutput = false;
          if (!lastOutputRecord) {
            // 从未有过产出记录，需要统计
            shouldUpdateOutput = true;
          } else if (
            lastUnbindRecord &&
            lastUnbindRecord.operateTime > lastOutputRecord.operateTime
          ) {
            // 最后一次是解绑记录，说明被解绑过，需要重新统计
            shouldUpdateOutput = true;
          } else {
            // 最后一次是增加记录，且没有后续的解绑记录，跳过重复统计
            console.log(
              `条码 ${mainBarcode} 已完成产出统计且未被解绑，跳过重复统计`
            );
            shouldUpdateOutput = false;
          }

          if (shouldUpdateOutput) {
            try {
              const outputUpdateResult = await this.updateWorkOrderQuantity(
                planWorkOrder._id,
                "output",
                1,
                {
                  relatedBarcode: mainBarcode,
                  barcodeOperation: "SCAN_PROCESS",
                  operatorId: userId,
                  processStepId: processStepId,
                  processName: processNode.processName,
                  processCode: processNode.processCode,
                  reason: "扫描工序组件末道工序产出",
                  source: "WEB",
                  isAutomatic: true,
                }
              );

              // 关键：工单服务返回失败时给出明确告警，避免静默漏记
              if (!outputUpdateResult || outputUpdateResult.success !== true) {
                throw new Error(
                  outputUpdateResult?.error ||
                    outputUpdateResult?.message ||
                    "更新工单产出量失败"
                );
              }

              if (lastUnbindRecord) {
                console.log(`条码 ${mainBarcode} 解绑后重新生产完成，产出量+1`);
              } else {
                console.log(`条码 ${mainBarcode} 首次完成生产，产出量+1`);
              }
            } catch (error) {
              console.warn(
                "更新工单产出量失败:",
                error && error.message ? error.message : error
              );
              // 这里可以选择继续执行或者其他处理方式
            }
          }
        }
      }

      // 验证主条码并更新 snCode 和 modelCode（如果还没有）
      if (
        flowRecord.barcode &&
        flowRecord.materialId &&
        !flowRecord.snCode &&
        !flowRecord.modelCode
      ) {
        try {
          const material = await Material.findById(flowRecord.materialId);
          if (material) {
            const mainValidation = await this.validateBarcodeWithMaterial(
              flowRecord.barcode,
              material
            );
            if (mainValidation.isValid) {
              if (mainValidation.snCode) {
                flowRecord.snCode = mainValidation.snCode;
              }
              if (mainValidation.modelCode) {
                flowRecord.modelCode = mainValidation.modelCode;
              }
              if (mainValidation.snCode && mainValidation.modelCode) {
                flowRecord.diyCode =
                  "DCZZ-" +
                  mainValidation.modelCode +
                  "-" +
                  mainValidation.snCode;
              }
              if (mainValidation.relatedBill && !flowRecord.relatedBill) {
                flowRecord.relatedBill = mainValidation.relatedBill;
              }
            }
          }
        } catch (error) {
          console.warn(`验证主条码失败: ${flowRecord.barcode}`, error);
          // 不抛出错误，继续执行
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
                console.error(
                  `解绑托盘记录失败 ${error.message}，但继续执行工序解绑流程`
                );
              }
            }
          }
        }
        console.log("hasFirstProcess");
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
          flowRecord.isProduct &&
          flowRecord.productStatus !== "SCRAP"
        ) {
          try {
            // 传入-1表示减少一个单位的投入量
            await this.updateWorkOrderQuantity(
              flowRecord.productionPlanWorkOrderId,
              "input",
              -1,
              {
                relatedBarcode: mainBarcode,
                barcodeOperation: "UNBIND_PROCESS",
                operatorId: userId,
                processStepId: processStepId,
                reason: `解绑工序减少投入量: ${reason}`,
                remark: unbindSubsequent ? "解绑后续工序" : "解绑单个工序",
                isAutomatic: true,
              }
            );
            console.log(`工单${flowRecord.productionPlanWorkOrderId}投入量-1`);
          } catch (error) {
            console.error("更新工单投入量失败:", error);
            // 这里选择继续执行而不抛出错误，以免影响解绑流程
          }
        }
        //如果产品是出于完成状态需要减少工单产出量
        if (
          flowRecord.isProduct &&
          flowRecord.productionPlanWorkOrderId &&
          flowRecord.status === "COMPLETED" &&
          flowRecord.productStatus !== "SCRAP"
        ) {
          try {
            await this.updateWorkOrderQuantity(
              flowRecord.productionPlanWorkOrderId,
              "output",
              -1,
              {
                relatedBarcode: mainBarcode,
                barcodeOperation: "UNBIND_PROCESS",
                operatorId: userId,
                processStepId: processStepId,
                reason: `解绑完成产品减少产出量: ${reason}`,
                remark: unbindSubsequent ? "解绑后续工序" : "解绑单个工序",
                isAutomatic: true,
              }
            );
            console.log(`工单${flowRecord.productionPlanWorkOrderId}产出量-1`);
          } catch (error) {
            console.error("更新工单产出量失败:", error);
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
              // batchDocNumber: null, // 🔧 关键修复：清除托盘编号，确保数据一致性
              endTime: null,
              // scanTime: null, // 🔧 同时清除扫描时间
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

        // 清理孤立的已完成节点
        const cleanOrphanNodesResult = this.cleanOrphanCompletedNodes(
          flowRecord.processNodes
        );
        if (cleanOrphanNodesResult.cleanedCount > 0) {
          flowRecord.processNodes = cleanOrphanNodesResult.processNodes;
          console.log(
            `删除了 ${
              cleanOrphanNodesResult.cleanedCount
            } 个孤立的已完成节点: ${cleanOrphanNodesResult.cleanedNodeIds.join(
              ", "
            )}`
          );

          // 记录删除的节点详细信息
          if (
            cleanOrphanNodesResult.deletedNodes &&
            cleanOrphanNodesResult.deletedNodes.length > 0
          ) {
            console.log(
              "删除的孤立节点详情:",
              cleanOrphanNodesResult.deletedNodes
                .map(
                  (node) =>
                    `${node.nodeType}节点[${node.nodeId}] ${
                      node.materialCode || node.processName || "Unknown"
                    } (Level:${node.level})${
                      node.isChildOfOrphan ? " [子节点]" : ""
                    }`
                )
                .join(", ")
            );
          }
        }

        // 更新整体进度（与fixFlowProgress口径保持一致：仅统计必要节点）
        const requiredNodesForProgress = flowRecord.processNodes.filter(
          (node) =>
            node.level !== 0 &&
            (node.nodeType === "PROCESS_STEP" ||
              (node.nodeType === "MATERIAL" && node.requireScan === true))
        );
        const completedRequiredNodes = requiredNodesForProgress.filter(
          (node) => node.status === "COMPLETED"
        ).length;
        flowRecord.progress =
          requiredNodesForProgress.length > 0
            ? Math.floor(
                (completedRequiredNodes / requiredNodesForProgress.length) * 100
              )
            : 0;

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

        // 若本次未检测到包含首道工序，但解绑后已无任一一级工序处于完成，则补扣一次投入量
        try {
          const hasAnyCompletedLevel1 = flowRecord.processNodes.some(
            (n) =>
              n.nodeType === "PROCESS_STEP" &&
              n.level === 1 &&
              n.status === "COMPLETED"
          );
          if (
            !hasFirstProcess &&
            !hasAnyCompletedLevel1 &&
            flowRecord.productionPlanWorkOrderId &&
            flowRecord.isProduct &&
            flowRecord.productStatus !== "SCRAP"
          ) {
            await this.updateWorkOrderQuantity(
              flowRecord.productionPlanWorkOrderId,
              "input",
              -1,
              {
                relatedBarcode: mainBarcode,
                barcodeOperation: "UNBIND_PROCESS",
                operatorId: userId,
                processStepId: processStepId,
                reason: `解绑后首工序投入回退: ${reason || "解绑"}`,
                remark: unbindSubsequent ? "解绑后续工序" : "解绑单个工序",
                isAutomatic: true,
              }
            );
            console.log(
              `检测到首工序已全部回退，工单${flowRecord.productionPlanWorkOrderId}投入量-1`
            );
          }
        } catch (errAdjust) {
          console.warn(
            "解绑后投入量补扣失败:",
            errAdjust?.message || errAdjust
          );
        }

        // 保存更新
        try {
          await flowRecord.save();
          console.log(
            `完成解绑工序组件: ${mainBarcode}, 工序ID: ${processStepId}`
          );
          // 统一修复解绑后的进度与状态，确保必扫节点为0时进度回到0
          try {
            await this.fixFlowProgress(mainBarcode);
          } catch (fixErr) {
            console.warn("解绑后修复流程进度失败:", fixErr?.message || fixErr);
          }
          return flowRecord;
        } catch (saveError) {
          // 如果是版本冲突异常且未超过最大重试次数，则重试
          if (
            saveError.name === "VersionError" &&
            retryCount < maxRetries - 1
          ) {
            console.log(`发生版本冲突，正在进行第${retryCount + 1}次重试...`);
            retryCount++;
            continue;
          }
          throw saveError;
        }
      } catch (error) {
        // 如果是版本冲突异常且未超过最大重试次数，则重试
        if (error.name === "VersionError" && retryCount < maxRetries - 1) {
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
   * 清理孤立的已完成节点（性能优化版 - O(n)算法）
   * 在解绑操作后，有些已完成的节点可能变成孤立状态，影响进度计算
   * 这些孤立节点会被直接删除而不是重置状态
   * @param {Array} processNodes - 流程节点数组
   * @returns {Object} 包含清理后的节点数组和清理统计信息
   */
  static cleanOrphanCompletedNodes(processNodes) {
    const deletedNodeIds = [];
    const deletedNodes = [];

    // 【性能优化】构建快速查找的数据结构 - O(n)
    const nodeMap = new Map(processNodes.map((n) => [n.nodeId, n]));
    const childrenMap = new Map();
    const parentMap = new Map();

    // 构建父子关系映射 - O(n)
    processNodes.forEach((node) => {
      if (node.parentNodeId) {
        // 子节点列表
        if (!childrenMap.has(node.parentNodeId)) {
          childrenMap.set(node.parentNodeId, []);
        }
        childrenMap.get(node.parentNodeId).push(node.nodeId);

        // 父节点引用
        parentMap.set(node.nodeId, node.parentNodeId);
      }
    });

    // 【性能优化】使用 BFS 找可达节点 - O(n)
    const reachableNodeIds = new Set();
    const queue = [];

    // 找到所有根节点
    processNodes.forEach((n) => {
      if (n.nodeType === "MATERIAL" && n.level === 0) {
        queue.push(n.nodeId);
        reachableNodeIds.add(n.nodeId);
      }
    });

    // BFS 遍历
    while (queue.length > 0) {
      const nodeId = queue.shift();
      const children = childrenMap.get(nodeId) || [];

      for (const childId of children) {
        if (!reachableNodeIds.has(childId)) {
          reachableNodeIds.add(childId);
          queue.push(childId);
        }
      }
    }

    // 【性能优化】识别孤立节点 - O(n)
    const nodesToDelete = new Set();

    processNodes.forEach((node) => {
      // 跳过根节点
      if (node.level === 0) return;

      // 只检查已完成的节点
      if (node.status !== "COMPLETED") return;

      let isOrphan = false;

      // 检查1: 不可达即孤立
      if (!reachableNodeIds.has(node.nodeId)) {
        isOrphan = true;
      }
      // 检查2: 父节点不存在
      else if (node.parentNodeId && !nodeMap.has(node.parentNodeId)) {
        isOrphan = true;
      }
      // 检查3: 父节点状态异常
      else if (node.parentNodeId) {
        const parentNode = nodeMap.get(node.parentNodeId);
        if (
          parentNode &&
          (parentNode.status === "PENDING" || parentNode.status === "SCRAP")
        ) {
          // 检查兄弟节点和子节点
          const siblings = childrenMap.get(node.parentNodeId) || [];
          const children = childrenMap.get(node.nodeId) || [];

          const hasCompletedSiblings = siblings.some((sibId) => {
            const sib = nodeMap.get(sibId);
            return (
              sib && sib.nodeId !== node.nodeId && sib.status === "COMPLETED"
            );
          });

          const hasCompletedChildren = children.some((childId) => {
            const child = nodeMap.get(childId);
            return child && child.status === "COMPLETED";
          });

          if (!hasCompletedSiblings && !hasCompletedChildren) {
            isOrphan = true;
          }
        }

        // 检查4: 物料节点的父工序未完成
        if (
          node.nodeType === "MATERIAL" &&
          parentNode &&
          parentNode.nodeType === "PROCESS_STEP" &&
          parentNode.status !== "COMPLETED"
        ) {
          isOrphan = true;
        }
      }

      // 标记孤立节点
      if (isOrphan) {
        nodesToDelete.add(node.nodeId);
        deletedNodeIds.push(node.nodeId);
        deletedNodes.push({
          nodeId: node.nodeId,
          nodeType: node.nodeType,
          materialCode: node.materialCode || "",
          processName: node.processName || "",
          status: node.status,
          level: node.level,
        });
      }
    });

    // 【性能优化】标记所有子节点 - O(n)
    const markChildrenForDeletion = (nodeId) => {
      const children = childrenMap.get(nodeId) || [];
      for (const childId of children) {
        if (!nodesToDelete.has(childId)) {
          nodesToDelete.add(childId);
          const childNode = nodeMap.get(childId);
          if (childNode) {
            deletedNodeIds.push(childId);
            deletedNodes.push({
              nodeId: childId,
              nodeType: childNode.nodeType,
              materialCode: childNode.materialCode || "",
              processName: childNode.processName || "",
              status: childNode.status,
              level: childNode.level,
              isChildOfOrphan: true,
            });
          }
          // 递归标记
          markChildrenForDeletion(childId);
        }
      }
    };

    // 为每个孤立节点标记其子节点
    const orphanIds = Array.from(nodesToDelete);
    orphanIds.forEach((nodeId) => {
      markChildrenForDeletion(nodeId);
    });

    // 【性能优化】过滤节点 - O(n)
    const updatedNodes = processNodes.filter(
      (node) => !nodesToDelete.has(node.nodeId)
    );

    return {
      processNodes: updatedNodes,
      cleanedCount: deletedNodeIds.length,
      cleanedNodeIds: deletedNodeIds,
      deletedNodes: deletedNodes,
    };
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
   * @param {boolean} fromRepairStation - 是否来自维修台，默认为false
   */
  static async scanBatchDocument(
    mainBarcode,
    processStepId,
    batchDocNumber,
    componentScans,
    userId,
    lineId,
    fromRepairStation = false
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

      // 如果有需要扫码的物料，必须提供componentScans
      if (
        materialNodes.length > 0 &&
        (!componentScans || componentScans.length === 0)
      ) {
        throw new Error(
          `该工序需要扫描${materialNodes.length}个物料，但未提供扫码信息`
        );
      }

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

        // **严格验证物料匹配性 - 修复BUG**
        // 1. 验证所有提供的materialId都在当前工序的扫描要求中
        for (const scan of componentScans) {
          const matchingNode = materialNodes.find(
            (node) => node.materialId.toString() === scan.materialId.toString()
          );
          if (!matchingNode) {
            // 获取当前工序要求的物料信息用于错误提示
            const requiredMaterials = materialNodes
              .map((node) => `${node.materialCode}(${node.materialName})`)
              .join("、");
            throw new Error(
              `提供的物料ID ${scan.materialId} 不在当前工序"${processNode.processName}"的扫描要求中。\n` +
                `当前工序要求扫描的物料：${requiredMaterials}`
            );
          }
        }

        // 2. 验证所有要求扫描的物料都有对应的扫描记录
        for (const node of materialNodes) {
          const matchingScan = componentScans.find(
            (scan) => scan.materialId.toString() === node.materialId.toString()
          );
          if (!matchingScan) {
            throw new Error(
              `缺少物料 ${node.materialCode}(${node.materialName}) 的扫描信息，该物料在工序"${processNode.processName}"中是必须扫描的`
            );
          }
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

                  // 【关键修复】检查条码验证结果
                  if (!validationResult.isValid) {
                    throw new Error(
                      validationResult.error ||
                        `条码 ${matchingScan.barcode} 验证失败，不符合物料 ${material.FNumber}(${material.FName}) 的条码规则`
                    );
                  }

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

      //根据条件获取对应的工单
      let planWorkOrder;

      if (fromRepairStation && flowRecord.productionPlanWorkOrderId) {
        // 来自维修台时，直接使用条码关联的工单ID
        planWorkOrder = await ProductionPlanWorkOrder.findOne({
          _id: flowRecord.productionPlanWorkOrderId,
        });
      } else {
        // 正常场景，根据产线获取对应的工单
        planWorkOrder = await ProductionPlanWorkOrder.findOne({
          productionLineId: lineId,
          materialId: flowRecord.materialId,
          status: "IN_PROGRESS",
        });
      }

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
          planWorkOrder.inputQuantity - planWorkOrder.scrapQuantity >=
          planWorkOrder.planProductionQuantity
        ) {
          throw new Error("工单已达到计划数量，无法继续投入");
        }
      }

      // 如果是首道工序，且物料ID匹配，更新工单投入量
      if (planWorkOrder) {
        if (processPosition.isFirst) {
          //检测当前工单是否可以继续投入
          if (
            planWorkOrder.inputQuantity - planWorkOrder.scrapQuantity >=
            planWorkOrder.planQuantity
          ) {
            throw new Error("工单已达到计划数量，无法继续投入");
          }

          try {
            const inputUpdateResult = await this.updateWorkOrderQuantity(
              planWorkOrder._id,
              "input",
              1,
              {
              relatedBarcode: mainBarcode,
              barcodeOperation: "SCAN_PROCESS",
              operatorId: userId,
              processStepId: processStepId,
              processName: processNode.processName,
              processCode: processNode.processCode,
              reason: "扫描工序组件首道工序投入",
              source: "WEB",
              isAutomatic: true,
              }
            );

            // 关键：工单服务返回失败时不要静默继续，避免“流程完成但工单数量未更新”
            if (!inputUpdateResult || inputUpdateResult.success !== true) {
              throw new Error(
                inputUpdateResult?.error ||
                  inputUpdateResult?.message ||
                  "更新工单投入量失败"
              );
            }
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
        console.log("flowRecord.progress", flowRecord.progress);
        console.log("processPosition.isLast", processPosition.isLast);
        // TODO
        if (processPosition.isLast && flowRecord.progress === 100) {
          // 检查该条码是否已经完成过产出统计，防止重复统计
          // 条码报废后不可再生产，只需处理解绑后重新生产的情况

          // 1. 查找该条码的最后一次产出增加记录
          const lastOutputRecord = await mongoose
            .model("workOrderQuantityLog")
            .findOne({
              workOrderId: planWorkOrder._id,
              relatedBarcode: mainBarcode,
              changeType: "output",
              changeQuantity: { $gt: 0 }, // 只查找增加产出量的记录
            })
            .sort({ operateTime: -1 });

          // 2. 查找该条码的最后一次解绑减少记录
          const lastUnbindRecord = await mongoose
            .model("workOrderQuantityLog")
            .findOne({
              workOrderId: planWorkOrder._id,
              relatedBarcode: mainBarcode,
              changeType: "output",
              changeQuantity: { $lt: 0 }, // 查找减少产出量的记录
              barcodeOperation: "UNBIND_PROCESS", // 只查找解绑操作
            })
            .sort({ operateTime: -1 });

          // 3. 判断是否需要更新产出量
          let shouldUpdateOutput = false;
          if (!lastOutputRecord) {
            // 从未有过产出记录，需要统计
            shouldUpdateOutput = true;
          } else if (
            lastUnbindRecord &&
            lastUnbindRecord.operateTime > lastOutputRecord.operateTime
          ) {
            // 最后一次是解绑记录，说明被解绑过，需要重新统计
            shouldUpdateOutput = true;
          } else {
            // 最后一次是增加记录，且没有后续的解绑记录，跳过重复统计
            console.log(
              `条码 ${mainBarcode} 已完成产出统计且未被解绑，跳过重复统计`
            );
            shouldUpdateOutput = false;
          }

          if (shouldUpdateOutput) {
            try {
              const outputUpdateResult = await this.updateWorkOrderQuantity(
                planWorkOrder._id,
                "output",
                1,
                {
                  relatedBarcode: mainBarcode,
                  barcodeOperation: "SCAN_PROCESS",
                  operatorId: userId,
                  processStepId: processStepId,
                  processName: processNode.processName,
                  processCode: processNode.processCode,
                  reason: "扫描工序组件末道工序产出",
                  source: "WEB",
                  isAutomatic: true,
                }
              );

              // 关键：工单服务返回失败时给出明确告警，避免静默漏记
              if (!outputUpdateResult || outputUpdateResult.success !== true) {
                throw new Error(
                  outputUpdateResult?.error ||
                    outputUpdateResult?.message ||
                    "更新工单产出量失败"
                );
              }

              if (lastUnbindRecord) {
                console.log(`条码 ${mainBarcode} 解绑后重新生产完成，产出量+1`);
              } else {
                console.log(`条码 ${mainBarcode} 首次完成生产，产出量+1`);
              }
            } catch (error) {
              console.warn(
                "更新工单产出量失败:",
                error && error.message ? error.message : error
              );
              // 这里可以选择继续执行或者其他处理方式
            }
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
   * 更新工单数量（通过队列处理，避免并发问题）
   * @param {string} workOrderId - 工单ID
   * @param {string} type - 更新类型 ('input' | 'output')
   * @param {number} quantity - 更新数量
   * @param {Object} logContext - 日志上下文信息
   * @param {string} logContext.relatedBarcode - 相关主条码
   * @param {string} logContext.barcodeOperation - 条码操作类型
   * @param {string} logContext.operatorId - 操作人员ID
   * @param {string} logContext.processStepId - 工序步骤ID（可选）
   * @param {string} logContext.processName - 工序名称（可选）
   * @param {string} logContext.processCode - 工序编码（可选）
   * @param {string} logContext.reason - 变更原因（可选）
   * @param {string} logContext.remark - 备注信息（可选）
   * @param {string} logContext.ipAddress - 操作IP地址（可选）
   * @param {string} logContext.userAgent - 用户代理信息（可选）
   * @param {string} logContext.source - 数据来源（可选）
   * @param {boolean} logContext.isAutomatic - 是否为自动操作（可选）
   */
  static async updateWorkOrderQuantity(
    workOrderId,
    type,
    quantity = 1,
    logContext = {}
  ) {
    try {
      if (!workOrderId) {
        console.log("未提供工单ID，跳过更新工单数量");
        return {
          success: false,
          error: "未提供工单ID",
          code: "MISSING_WORK_ORDER_ID",
        };
      }

      // 调用独立的工单处理服务，避免PM2负载均衡导致的并发问题
      const PlanServerClient = require("./planServerClient");

      console.log(`🔗 调用独立工单处理服务更新工单: ${workOrderId}`);
      const result = await PlanServerClient.updateWorkOrderQuantity(
        workOrderId,
        type,
        quantity,
        logContext
      );

      if (result.success) {
        console.log(`✅ 工单${workOrderId}更新任务已加入队列: ${result.jobId}`);
        return {
          success: true,
          jobId: result.jobId,
          workOrderId: workOrderId,
          type: type,
          quantity: quantity,
          message: "更新任务已加入队列，将按顺序处理",
          estimatedDelay: result.estimatedDelay,
          queueLength: result.queueLength,
          code: "QUEUED",
        };
      } else {
        console.error(
          `❌ 工单${workOrderId}更新任务加入队列失败:`,
          result.error
        );

        // 如果是服务不可用，尝试降级到本地队列处理
        if (result.fallback && result.code === "SERVICE_UNAVAILABLE") {
          console.warn(`⚠️ 工单处理服务不可用，降级到本地队列处理`);

          // 降级到本地队列服务
          const QueueService = require("./queueService").QueueService;
          const queueResult = await QueueService.addWorkOrderQuantityUpdate(
            workOrderId,
            type,
            quantity,
            logContext
          );

          if (queueResult.success) {
            console.log(
              `✅ 工单${workOrderId}更新任务已加入本地队列: ${queueResult.jobId}`
            );
            return {
              success: true,
              jobId: queueResult.jobId,
              workOrderId: workOrderId,
              type: type,
              quantity: quantity,
              message: "更新任务已加入本地队列（降级处理）",
              estimatedDelay: queueResult.estimatedDelay,
              queueLength: queueResult.queueLength,
              code: "QUEUED_FALLBACK",
              fallback: true,
            };
          }
        }

        return {
          success: false,
          error: result.error,
          workOrderId: workOrderId,
          type: type,
          quantity: quantity,
          code: result.code || "QUEUE_ERROR",
        };
      }
    } catch (error) {
      console.error(
        `更新工单${type === "input" ? "投入" : "产出"}数量失败:`,
        error
      );
      return {
        success: false,
        error: error.message,
        workOrderId: workOrderId,
        type: type,
        quantity: quantity,
        code: "SYSTEM_ERROR",
      };
    }
  }

  /**
   * 执行工单数量更新（内部方法，由队列调用）
   * @param {string} workOrderId - 工单ID
   * @param {string} type - 更新类型 ('input' | 'output')
   * @param {number} quantity - 更新数量
   * @param {Object} logContext - 日志上下文信息
   */
  static async _executeWorkOrderQuantityUpdate(
    workOrderId,
    type,
    quantity = 1,
    logContext = {}
  ) {
    try {
      if (!workOrderId) {
        console.log("未提供工单ID，跳过更新工单数量");
        throw new Error("未提供工单ID");
      }

      const updateField = type === "input" ? "inputQuantity" : "outputQuantity";

      // 先获取更新前的工单信息（用于日志记录和扣减量检查）
      const beforeWorkOrder = await mongoose
        .model("production_plan_work_order")
        .findById(workOrderId)
        .populate("materialId");

      if (!beforeWorkOrder) {
        console.log(`未找到工单(ID: ${workOrderId})`);
        return null;
      }

      // 获取更新前的状态
      const beforeQuantity = beforeWorkOrder[updateField] || 0;
      const beforeStatus = beforeWorkOrder.status;
      const beforeProgress = beforeWorkOrder.progress || 0;

      // 扣减情况下，确保不会小于0（在这里检查，避免额外查询）
      if (quantity < 0) {
        // 确保扣减后不小于0
        if (beforeQuantity + quantity < 0) {
          const requestedDecrease = -quantity; // 原始请求的扣减量（正数）
          quantity = -beforeQuantity; // 最多扣减到0
          console.log(
            `工单(ID: ${workOrderId})${
              type === "input" ? "投入" : "产出"
            }量不足，最多扣减到0（当前量：${beforeQuantity}，请求扣减：${requestedDecrease}，实际扣减：${-quantity}）`
          );
        }
      }

      // 准备更新数据
      const updateData = {
        $inc: { [updateField]: quantity },
        $set: {
          updateTime: new Date(),
        },
      };

      // 如果需要设置createBy
      if (!beforeWorkOrder.createBy) {
        updateData.$set.createBy = beforeWorkOrder.updateBy;
      }

      // 如果是产出类型，计算新的进度
      if (type === "output") {
        const newOutputQuantity =
          (beforeWorkOrder.outputQuantity || 0) + quantity;
        const planProductionQuantity =
          beforeWorkOrder.planProductionQuantity || 0;
        const scrapQuantity = beforeWorkOrder.scrapQuantity || 0;

        // 防止除零错误
        const totalTargetQuantity = planProductionQuantity + scrapQuantity;
        if (totalTargetQuantity > 0) {
          const newProgress = Math.min(
            100,
            Math.floor((newOutputQuantity / totalTargetQuantity) * 100)
          );
          updateData.$set.progress = newProgress;
        }

        // 检查量为负数且原状态为已完成的情况 - 优先处理
        if (quantity < 0 && beforeWorkOrder.status === "COMPLETED") {
          updateData.$set.status = "PAUSED";
          console.log(
            `工单(ID: ${workOrderId})因quantity为负数(${quantity})且原状态为已完成，被设置为暂停状态`
          );
        }
        // 检查是否应该完成工单（使用else if避免状态冲突）
        else if (newOutputQuantity >= planProductionQuantity) {
          updateData.$set.status = "COMPLETED";
          updateData.$set.endTime = new Date();
          updateData.$set.progress = 100;

          console.log(`工单(ID: ${workOrderId}) 完成判断:`, {
            newOutputQuantity,
            planProductionQuantity,
            scrapQuantity,
            shouldComplete: newOutputQuantity >= planProductionQuantity,
          });
        }
      }

      // 执行原子更新操作
      const workOrder = await mongoose
        .model("production_plan_work_order")
        .findOneAndUpdate({ _id: workOrderId }, updateData, {
          new: true, // 返回更新后的文档
          populate: "materialId",
        });

      if (!workOrder) {
        console.log(`更新工单失败(ID: ${workOrderId})`);
        return null;
      }

      // 如果工单完成，处理关联工单
      if (
        type === "output" &&
        workOrder.status === "COMPLETED" &&
        beforeStatus !== "COMPLETED"
      ) {
        console.log(
          `工单(ID: ${workOrderId})已完成 - 产出量: ${workOrder.outputQuantity}, 计划数量: ${workOrder.planProductionQuantity}`
        );
        await this.completeAllRelatedWorkOrders(workOrder._id);
      }

      // 创建工单数量变更日志记录
      try {
        const logData = {
          // 工单信息
          workOrderId: workOrder._id,
          workOrderNo: workOrder.workOrderNo || workOrder.workOrderNumber || "",

          // 物料信息
          materialId: workOrder.materialId._id,
          materialCode: workOrder.materialId.FNumber || "",
          materialName: workOrder.materialId.FName || "",

          // 产线信息
          productionLineId: workOrder.productionLineId || "",
          productionLineName: workOrder.productionLineName || "",

          // 变更信息
          changeType: type,
          changeQuantity: quantity,
          beforeQuantity: beforeQuantity,
          afterQuantity: workOrder[updateField],

          // 关联的主条码信息
          relatedBarcode: logContext.relatedBarcode || "",
          barcodeOperation: logContext.barcodeOperation || "OTHER",

          // 工序信息（如果是工序相关操作）
          processStepId: logContext.processStepId || null,
          processName: logContext.processName || "",
          processCode: logContext.processCode || "",

          // 工单状态变更
          beforeStatus: beforeStatus,
          afterStatus: workOrder.status,

          // 进度变更
          beforeProgress: beforeProgress,
          afterProgress: workOrder.progress || 0,

          // 操作信息
          operatorId: logContext.operatorId || "SYSTEM",
          operatorName: logContext.operatorName || "",
          operateTime: new Date(),

          // 操作原因和备注
          reason:
            logContext.reason ||
            `${type === "input" ? "投入" : "产出"}数量${
              quantity > 0 ? "增加" : "减少"
            }`,
          remark: logContext.remark || "",

          // 系统信息
          ipAddress: logContext.ipAddress || "",
          userAgent: logContext.userAgent || "",

          // 是否为自动操作
          isAutomatic:
            logContext.isAutomatic !== undefined
              ? logContext.isAutomatic
              : true,

          // 数据来源
          source: logContext.source || "SYSTEM",
        };

        const quantityLog = new WorkOrderQuantityLog(logData);
        await quantityLog.save();

        console.log(`工单数量变更日志记录创建成功: ${quantityLog._id}`);
      } catch (logError) {
        console.error("创建工单数量变更日志失败:", logError);
        // 日志记录失败不影响主流程
      }

      return workOrder;
    } catch (error) {
      console.error(
        `更新工单${type === "input" ? "投入" : "产出"}数量失败:`,
        error
      );
      throw error; // 抛出错误让队列处理重试逻辑
    }
  }

  /**
   * 检查是否为首道或末道工序
   * @param {Array} processNodes - 所有工序节点
   * @param {Object} currentNode - 当前工序节点
   * @returns {Object} { isFirst: boolean, isLast: boolean }
   */
  static checkProcessPosition(processNodes, currentNode) {
    // 只检查level 1的工序（主工艺工序）
    const level1ProcessSteps = processNodes
      .filter((node) => node.nodeType === "PROCESS_STEP" && node.level === 1)
      .sort((a, b) => a.processSort - b.processSort);

    // 找到当前工序在level 1工序中的位置
    const currentIndex = level1ProcessSteps.findIndex(
      (step) => step.nodeId === currentNode.nodeId
    );

    // 如果当前工序不是level 1工序，返回false
    if (currentIndex === -1) {
      return { isFirst: false, isLast: false };
    }

    return {
      isFirst: currentIndex === 0,
      isLast: currentIndex === level1ProcessSteps.length - 1,
    };
  }

  /**
   * 验证条码与物料的匹配关系（性能优化版 - 使用缓存）
   * @param {string} barcode - 条码
   * @param {Object} material - 物料信息
   * @returns {Promise<Object>} 验证结果，包含 isValid, materialCode, relatedBill 等信息
   */
  static async validateBarcodeWithMaterial(barcode, material) {
    try {
      console.log("validateBarcodeWithMaterial", material._id);

      // 【性能优化】尝试从 Redis 缓存获取规则
      let rules = await this.barcodeRuleCache.get(material._id);

      if (!rules) {
        // 缓存未命中，查询数据库
        // 1. 获取物料对应的条码规则（包括产品特定规则和全局规则）
        const [productRules, globalRules] = await Promise.all([
          // 获取产品特定规则
          productBarcodeRule
            .find({
              productId: material._id,
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

        console.log("productRules===", productRules.length);

        // 2. 处理和合并规则
        rules = [];

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

        // 【性能优化】将规则放入 Redis 缓存
        if (rules.length > 0) {
          await this.barcodeRuleCache.set(material._id, rules);
        }
      }

      if (!rules || rules.length === 0) {
        throw new Error("未找到可用的条码规则");
      }

      // 3. 验证条码
      for (const rule of rules) {
        console.log("rule===", rule.name);
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
              console.log("subValue===", subValue);
              console.log(
                "validationRule.params.expectedValue===",
                validationRule.params.expectedValue
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
          console.log("isValid===", isValid);
          if (!isValid) break;
        }

        // 如果验证规则通过，执行提取规则
        if (isValid) {
          let materialCode = null;
          let relatedBill = null;
          let snCode = null;
          let modelCode = null;

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
              case "snCode":
                snCode = extractValue;
                break;
              case "modelCode":
                modelCode = extractValue;
                break;
            }
          }

          // 【关键验证】验证提取的物料编码是否匹配当前物料
          if (materialCode === material.FNumber) {
            console.log(
              `✅ 条码验证通过: 规则=${rule.name} (${
                rule.isProductSpecific ? "产品特定" : "全局规则"
              }), 提取物料编码=${materialCode}`
            );
            return {
              isValid: true,
              materialCode,
              relatedBill,
              snCode,
              modelCode,
              ruleName: rule.name,
              ruleType: rule.isProductSpecific ? "product" : "global",
            };
          } else {
            // 提取的物料编码不匹配当前物料，继续尝试下一个规则
            console.log(
              `❌ 规则 ${rule.name} 提取的物料编码 ${materialCode} 不匹配目标物料 ${material.FNumber}，继续尝试下一个规则`
            );
          }
        }
      }

      // 所有规则都未匹配成功
      // 【性能优化】清除该物料的规则缓存，下次会重新从数据库获取最新规则
      await this.barcodeRuleCache.clear(material._id);

      return {
        isValid: false,
        materialCode: null,
        relatedBill: null,
        snCode: null,
        modelCode: null,
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

            // 更新主条码的 relatedBill、snCode 和 modelCode
            if (flowRecord.barcode && flowRecord.materialId) {
              const mainValidation = await this.validateBarcodeWithMaterial(
                flowRecord.barcode,
                flowRecord.materialId
              );

              if (mainValidation.relatedBill !== flowRecord.relatedBill) {
                flowRecord.relatedBill = mainValidation.relatedBill || "";
                hasUpdates = true;
              }

              if (mainValidation.snCode !== flowRecord.snCode) {
                flowRecord.snCode = mainValidation.snCode || "";
                hasUpdates = true;
              }

              if (mainValidation.modelCode !== flowRecord.modelCode) {
                flowRecord.modelCode = mainValidation.modelCode || "";
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

      // 【性能优化】使用统一的进度计算方法
      mainFlowRecord.progress = this.calculateFlowProgress(
        mainFlowRecord.processNodes
      );

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
      let hasSubProcesses = false;

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

        // 检查新条码是否有子物料工序节点
        hasSubProcesses = newBarcodeRecord.processNodes.some(
          (node) => node.level > 0 && node.nodeType === "PROCESS_STEP"
        );

        // 增加检查：检查新条码的子物料工序是否全部完成
        if (hasSubProcesses) {
          console.log("检查新条码子物料工序完成状态...");
          const subProcessNodes = newBarcodeRecord.processNodes.filter(
            (node) => node.nodeType === "PROCESS_STEP" && node.level > 0
          );

          const incompleteProcesses = subProcessNodes.filter(
            (node) => node.status !== "COMPLETED"
          );

          if (incompleteProcesses.length > 0) {
            const incompleteNames = incompleteProcesses
              .map((p) => p.processName)
              .join(", ");
            throw new Error(
              `新条码的子工序未全部完成，未完成工序: ${incompleteNames}`
            );
          }
          console.log("新条码所有子工序均已完成");
        }
      } else {
        console.log(`新条码 ${newBarcode} 无流程记录，将验证格式`);
        // 如果新条码不存在流程记录，需要验证条码格式
        const material = await Material.findOne({
          _id: materialNode.materialId,
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

      // 检查批次物料使用次数
      if (materialNode.isBatch && materialNode.batchQuantity > 0) {
        console.log(
          `检测到批次物料，批次用量限制: ${materialNode.batchQuantity}次`
        );
        // 查找所有使用该批次条码的记录
        const batchUsageFlows = await MaterialProcessFlow.find({
          processNodes: {
            $elemMatch: {
              barcode: newBarcode,
              status: "COMPLETED",
            },
          },
        });

        // 计算当前批次已使用的次数
        const usageCount = batchUsageFlows.length;
        console.log(`批次物料 ${newBarcode} 已使用 ${usageCount} 次`);

        // 如果使用次数已达到或超过批次用量限制，抛出错误
        if (usageCount >= materialNode.batchQuantity) {
          throw new Error(
            `批次物料条码 ${newBarcode} 已达到使用次数限制(${materialNode.batchQuantity}次)`
          );
        }
      }

      // 添加关键物料校验
      if (materialNode.isKeyMaterial) {
        console.log(
          `检测到关键物料，校验新条码 ${newBarcode} 是否已被其他流程使用...`
        );
        // 检查该条码是否已被其他流程使用
        const existingFlows = await MaterialProcessFlow.find({
          processNodes: {
            $elemMatch: {
              barcode: newBarcode,
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
              scanTime: flow.processNodes.find((n) => n.barcode === newBarcode)
                ?.scanTime,
            }));

            throw new Error(
              `关键物料条码 ${newBarcode} 已被其他流程使用:\n${usageDetails
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
        console.log(`关键物料校验通过`);
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

          // 更高级的替换逻辑：
          // 1. 使用matchAndUpdateNodesRecursively进行深度递归匹配
          console.log("执行递归节点匹配更新...");
          await this.matchAndUpdateNodesRecursively(
            mainFlowRecord.processNodes,
            newBarcodeRecord.processNodes,
            userId
          );

          // 2. 仍然使用现有的节点映射方法作为补充，确保节点状态完全更新
          // 为当前物料节点创建节点映射表，用于快速查找对应节点
          const nodeTypeMap = {};

          // 构建节点映射 - 按节点类型和物料/工序编码分类
          for (const childNode of allChildNodes) {
            const key =
              childNode.nodeType === "PROCESS_STEP"
                ? `PROCESS_${childNode.processCode}`
                : `MATERIAL_${childNode.materialCode}`;

            if (!nodeTypeMap[key]) {
              nodeTypeMap[key] = [];
            }
            nodeTypeMap[key].push(childNode);
          }

          // 遍历新条码的流程节点，进行替换或匹配
          for (const newNode of newBarcodeRecord.processNodes) {
            // 跳过根节点
            if (newNode.level === 0) continue;

            // 构建查找键
            const key =
              newNode.nodeType === "PROCESS_STEP"
                ? `PROCESS_${newNode.processCode}`
                : `MATERIAL_${newNode.materialCode}`;

            // 查找对应的原节点集合
            const matchingNodes = nodeTypeMap[key] || [];

            for (const matchNode of matchingNodes) {
              console.log(
                `找到匹配节点: ${newNode.nodeType} - ${
                  newNode.nodeType === "PROCESS_STEP"
                    ? newNode.processName
                    : newNode.materialName
                }`
              );

              // 更新节点状态和信息
              matchNode.status = newNode.status || "COMPLETED";

              // 如果是物料节点，更新条码等信息
              if (newNode.nodeType === "MATERIAL" && newNode.barcode) {
                matchNode.barcode = newNode.barcode;
                matchNode.scanTime = newNode.scanTime || new Date();
                matchNode.endTime = newNode.endTime || new Date();
                matchNode.updateBy = userId;

                // 如果有相关单据，也一并更新
                if (newNode.relatedBill) {
                  matchNode.relatedBill = newNode.relatedBill;
                }
              }

              // 如果是工序节点，更新完成时间信息
              if (newNode.nodeType === "PROCESS_STEP") {
                matchNode.endTime = newNode.endTime || new Date();
                matchNode.scanTime = newNode.scanTime;
                matchNode.updateBy = userId;
              }
            }
          }

          // 对于原子结构中在新结构没有匹配的节点，将其设为完成状态
          for (const childNode of allChildNodes) {
            if (childNode.status !== "COMPLETED") {
              console.log(
                `未找到匹配节点，设置为完成状态: ${childNode.nodeType} - ${
                  childNode.nodeType === "PROCESS_STEP"
                    ? childNode.processName
                    : childNode.materialName
                }`
              );
              childNode.status = "COMPLETED";
              childNode.endTime = new Date();
              childNode.updateBy = userId;
            }
          }
        } else {
          console.log(`未在新条码流程中找到根物料节点，将重置所有子节点状态`);
          // 将所有子节点设置为完成状态
          for (const childNode of allChildNodes) {
            childNode.status = "COMPLETED";
            childNode.endTime = new Date();
            childNode.updateBy = userId;
          }
        }
      } else {
        console.log(`新条码 ${newBarcode} 没有流程记录，将重置所有子节点状态`);
        // 将所有子节点设置为完成状态
        for (const childNode of allChildNodes) {
          childNode.status = "COMPLETED";
          childNode.endTime = new Date();
          childNode.updateBy = userId;
        }
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

      // 【性能优化】使用统一的进度计算方法
      mainFlowRecord.progress = this.calculateFlowProgress(
        mainFlowRecord.processNodes
      );

      // 检查是否所有必要节点都已完成
      if (mainFlowRecord.progress === 100) {
        const allRequiredCompleted = this.checkAllRequiredNodesCompleted(
          mainFlowRecord.processNodes
        );
        if (allRequiredCompleted) {
          mainFlowRecord.status = "COMPLETED";
          mainFlowRecord.endTime = new Date();
          // 更新根节点状态
          const rootNode = mainFlowRecord.processNodes.find(
            (node) => node.level === 0 && node.nodeType === "MATERIAL"
          );
          if (rootNode) {
            rootNode.status = "COMPLETED";
            rootNode.endTime = new Date();
          }
        }
      }

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
          progress: mainFlowRecord.progress,
          status: mainFlowRecord.status,
        },
      };
    } catch (error) {
      console.error("物料替换失败:", error);
      throw error;
    }
  }

  /**
   * 初始化产品条码 - 删除产品流程记录并更新工单数量
   * @param {String} barcode - 产品条码
   * @param {String} userId - 操作用户ID
   * @param {String} reason - 初始化原因
   * @param {String} remark - 备注信息
   * @param {String} ipAddress - 操作IP地址
   * @param {String} userAgent - 用户代理信息
   * @returns {Object} 处理结果
   */
  static async initializeProduct(
    barcode,
    userId,
    reason = "产品条码初始化",
    remark = "",
    ipAddress = "",
    userAgent = ""
  ) {
    let logData = null;

    try {
      // 1. 查找产品流程记录
      const flowRecord = await MaterialProcessFlow.findOne({
        barcode,
      }).populate("materialId");
      if (!flowRecord) {
        throw new Error(`未找到条码 ${barcode} 的流程记录`);
      }

      // 2. 保存相关信息，用于后续操作和日志记录
      const workOrderId = flowRecord.productionPlanWorkOrderId;
      const status = flowRecord.status;
      const progress = flowRecord.progress;
      const materialName = flowRecord.materialName;
      const materialCode = flowRecord.materialCode;
      const materialId = flowRecord.materialId;
      const craftId = flowRecord.craftId;
      const productLineId = flowRecord.productLineId;
      const productLineName = flowRecord.productLineName;

      // 计算节点统计信息
      const requiredNodes = flowRecord.processNodes.filter(
        (node) =>
          node.level !== 0 && // 排除根节点
          (node.nodeType === "PROCESS_STEP" ||
            (node.nodeType === "MATERIAL" && node.requireScan === true))
      );
      const completedNodes = requiredNodes.filter(
        (node) => node.status === "COMPLETED"
      );

      // 获取工单信息
      let workOrder = null;
      let workOrderNo = "";
      if (workOrderId) {
        workOrder = await ProductionPlanWorkOrder.findById(workOrderId);
        workOrderNo = workOrder ? workOrder.workOrderNo : "";
      }

      // 获取工艺信息
      let craft = null;
      let craftName = "";
      let craftVersion = "";
      if (craftId) {
        craft = await Craft.findById(craftId);
        craftName = craft ? craft.craftName : "";
        craftVersion = craft ? craft.craftVersion : "";
      }

      // 3. 准备日志数据
      logData = {
        barcode,
        materialId: materialId._id,
        materialCode,
        materialName,
        materialSpec: materialId.FSpecification || "",
        craftId,
        craftName,
        craftVersion,
        productionPlanWorkOrderId: workOrderId,
        workOrderNo,
        productLineId,
        productLineName,
        beforeInitialize: {
          status,
          progress,
          startTime: flowRecord.startTime,
          endTime: flowRecord.endTime,
          totalNodes: requiredNodes.length,
          completedNodes: completedNodes.length,
        },
        workOrderAdjustment: {
          inputQuantityAdjusted: false,
          outputQuantityAdjusted: false,
          inputAdjustmentAmount: 0,
          outputAdjustmentAmount: 0,
        },
        operatorId: userId,
        operateTime: new Date(),
        reason,
        remark,
        result: "SUCCESS",
        operationType: "INITIALIZE",
        ipAddress,
        userAgent,
      };

      // 4. 根据产品状态更新工单投入输出数量
      if (workOrderId) {
        // 如果产品状态为"已完成"，扣减1个产出量
        if (status === "COMPLETED") {
          await this.updateWorkOrderQuantity(
            workOrderId.toString(),
            "output",
            -1,
            {
              relatedBarcode: barcode,
              barcodeOperation: "INITIALIZE_PRODUCT",
              operatorId: userId,
              reason: `产品初始化减少产出量: ${reason}`,
              remark: remark,
              ipAddress: ipAddress,
              userAgent: userAgent,
              source: "WEB",
              isAutomatic: false,
            }
          );
          logData.workOrderAdjustment.outputQuantityAdjusted = true;
          logData.workOrderAdjustment.outputAdjustmentAmount = -1;
        }

        // 如果进度大于0，说明已经投入，扣减1个投入量
        if (progress > 0) {
          await this.updateWorkOrderQuantity(
            workOrderId.toString(),
            "input",
            -1,
            {
              relatedBarcode: barcode,
              barcodeOperation: "INITIALIZE_PRODUCT",
              operatorId: userId,
              reason: `产品初始化减少投入量: ${reason}`,
              remark: remark,
              ipAddress: ipAddress,
              userAgent: userAgent,
              source: "WEB",
              isAutomatic: false,
            }
          );
          logData.workOrderAdjustment.inputQuantityAdjusted = true;
          logData.workOrderAdjustment.inputAdjustmentAmount = -1;
        }
      }

      // 5. 删除流程记录
      await MaterialProcessFlow.deleteOne({ _id: flowRecord._id });

      // 6. 创建成功日志记录
      const initializeLog = new ProductInitializeLog(logData);
      await initializeLog.save();

      // 7. 记录操作日志到控制台
      console.log(
        `用户 ${userId} 初始化产品 ${barcode} (${materialCode} - ${materialName})`
      );

      return {
        success: true,
        message: `成功初始化产品条码 ${barcode}`,
        logId: initializeLog._id,
        detail: {
          barcode,
          materialCode,
          materialName,
          status: status,
          workOrderId: workOrderId,
          workOrderAdjustment: logData.workOrderAdjustment,
        },
      };
    } catch (error) {
      console.error("初始化产品条码失败:", error);

      // 创建失败日志记录
      if (logData) {
        logData.result = "FAILED";
        logData.errorMessage = error.message;

        try {
          const failedLog = new ProductInitializeLog(logData);
          await failedLog.save();
        } catch (logError) {
          console.error("保存失败日志记录时出错:", logError);
        }
      }

      throw error;
    }
  }

  /**
   * 验证主物料工序节点和子物料工序节点是否完全匹配（支持多层级递归比较）
   * @param {Array} mainProcessNodes - 主物料流程节点
   * @param {Array} subProcessNodes - 子物料流程节点
   * @param {Object} bindingMaterialNode - 绑定的物料节点
   * @returns {Object} 验证结果
   */
  static validateProcessNodesCompatibility(
    mainProcessNodes,
    subProcessNodes,
    bindingMaterialNode
  ) {
    console.log(
      `开始验证物料 ${bindingMaterialNode.materialCode} 的工序节点兼容性`
    );

    // 1. 首先检查物料节点是否匹配
    const subMaterialNode = subProcessNodes.find(
      (node) => node.nodeType === "MATERIAL" && node.level === 0
    );

    if (!subMaterialNode) {
      return {
        isValid: false,
        message: "子物料流程中未找到根物料节点",
      };
    }

    // 检查物料ID是否匹配
    if (
      bindingMaterialNode.materialId.toString() !==
      subMaterialNode.materialId.toString()
    ) {
      return {
        isValid: false,
        message: `物料不匹配：主物料ID ${bindingMaterialNode.materialId} 与子物料ID ${subMaterialNode.materialId} 不一致`,
        mainMaterial: {
          materialId: bindingMaterialNode.materialId,
          materialCode: bindingMaterialNode.materialCode,
          materialName: bindingMaterialNode.materialName,
        },
        subMaterial: {
          materialId: subMaterialNode.materialId,
          materialCode: subMaterialNode.materialCode,
          materialName: subMaterialNode.materialName,
        },
      };
    }

    // 2. 构建主物料中该绑定物料节点的完整子树结构
    const getChildNodesRecursively = (nodes, parentNodeId) => {
      const directChildren = nodes.filter(
        (node) => node.parentNodeId === parentNodeId
      );
      const result = [];

      for (const child of directChildren) {
        result.push(child);
        // 递归获取子节点
        const grandChildren = getChildNodesRecursively(nodes, child.nodeId);
        result.push(...grandChildren);
      }

      return result;
    };

    // 获取主物料中该绑定物料节点下的所有子节点（递归）
    const mainSubNodes = getChildNodesRecursively(
      mainProcessNodes,
      bindingMaterialNode.nodeId
    );

    // 获取子物料中的所有非根节点（level > 0）
    const subMaterialNodes = subProcessNodes.filter((node) => node.level > 0);

    console.log(`主物料中绑定节点的子节点数量: ${mainSubNodes.length}`);
    console.log(`子物料中非根节点数量: ${subMaterialNodes.length}`);

    // 如果主物料该节点下没有子节点，说明不需要匹配
    if (mainSubNodes.length === 0) {
      return {
        isValid: true,
        message: "该物料节点下无需匹配工序",
      };
    }

    // 3. 构建层级结构树进行比较
    const buildNodeTree = (nodes, rootNodeId, baseLevel = 0) => {
      const tree = [];
      const directChildren = nodes.filter(
        (node) => node.parentNodeId === rootNodeId
      );

      for (const child of directChildren) {
        const childTree = {
          ...child,
          adjustedLevel: child.level - baseLevel, // 调整层级为相对层级
          children: buildNodeTree(nodes, child.nodeId, baseLevel),
        };
        tree.push(childTree);
      }

      return tree.sort((a, b) => (a.processSort || 0) - (b.processSort || 0));
    };

    // 构建主物料子树（从绑定物料节点开始）
    const mainSubTree = buildNodeTree(
      mainProcessNodes,
      bindingMaterialNode.nodeId,
      bindingMaterialNode.level
    );

    // 构建子物料树（从根物料节点开始）
    const subMaterialTree = buildNodeTree(
      subProcessNodes,
      subMaterialNode.nodeId,
      0
    );

    console.log(`主物料子树根节点数量: ${mainSubTree.length}`);
    console.log(`子物料树根节点数量: ${subMaterialTree.length}`);

    // 4. 递归比较树结构
    const compareTreeNodes = (mainTree, subTree, path = "") => {
      const errors = [];

      // 首先比较节点数量
      if (mainTree.length !== subTree.length) {
        errors.push({
          path: path || "root",
          type: "count_mismatch",
          message: `节点数量不匹配：主物料有 ${mainTree.length} 个节点，子物料有 ${subTree.length} 个节点`,
          mainNodes: mainTree.map(
            (n) =>
              `${
                n.nodeType === "PROCESS_STEP" ? n.processName : n.materialName
              }(${
                n.nodeType === "PROCESS_STEP" ? n.processCode : n.materialCode
              })`
          ),
          subNodes: subTree.map(
            (n) =>
              `${
                n.nodeType === "PROCESS_STEP" ? n.processName : n.materialName
              }(${
                n.nodeType === "PROCESS_STEP" ? n.processCode : n.materialCode
              })`
          ),
        });
        return errors;
      }

      // 逐个比较节点
      for (let i = 0; i < mainTree.length; i++) {
        const mainNode = mainTree[i];
        const subNode = subTree[i];
        const currentPath = path ? `${path}.${i}` : `${i}`;

        // 比较节点类型
        if (mainNode.nodeType !== subNode.nodeType) {
          errors.push({
            path: currentPath,
            type: "type_mismatch",
            message: `节点类型不匹配：主物料为 ${mainNode.nodeType}，子物料为 ${subNode.nodeType}`,
          });
          continue;
        }

        // 比较具体内容
        if (mainNode.nodeType === "PROCESS_STEP") {
          // 比较工序节点
          if (
            mainNode.processStepId.toString() !==
            subNode.processStepId.toString()
          ) {
            errors.push({
              path: currentPath,
              type: "process_mismatch",
              message: `工序不匹配：主物料为 ${mainNode.processName}(${mainNode.processCode})[${mainNode.processStepId}]，子物料为 ${subNode.processName}(${subNode.processCode})[${subNode.processStepId}]`,
            });
          }
        } else if (mainNode.nodeType === "MATERIAL") {
          // 比较物料节点
          if (
            mainNode.materialId.toString() !== subNode.materialId.toString()
          ) {
            errors.push({
              path: currentPath,
              type: "material_mismatch",
              message: `物料不匹配：主物料为 ${mainNode.materialName}(${mainNode.materialCode})[${mainNode.materialId}]，子物料为 ${subNode.materialName}(${subNode.materialCode})[${subNode.materialId}]`,
            });
          }
        }

        // 递归比较子节点
        if (mainNode.children && subNode.children) {
          const childErrors = compareTreeNodes(
            mainNode.children,
            subNode.children,
            currentPath
          );
          errors.push(...childErrors);
        } else if (mainNode.children?.length !== subNode.children?.length) {
          errors.push({
            path: currentPath,
            type: "children_count_mismatch",
            message: `子节点数量不匹配：主物料有 ${
              mainNode.children?.length || 0
            } 个子节点，子物料有 ${subNode.children?.length || 0} 个子节点`,
          });
        }
      }

      return errors;
    };

    // 执行树结构比较
    const validationErrors = compareTreeNodes(mainSubTree, subMaterialTree);

    console.log(`验证完成，发现 ${validationErrors.length} 个错误`);

    if (validationErrors.length > 0) {
      return {
        isValid: false,
        message: `工序节点结构不匹配，共发现 ${validationErrors.length} 个问题`,
        errors: validationErrors,
        details: {
          mainTreeStructure: this.formatTreeStructure(mainSubTree),
          subTreeStructure: this.formatTreeStructure(subMaterialTree),
        },
      };
    }

    return {
      isValid: true,
      message: "物料和工序节点完全匹配",
      details: {
        totalNodes: mainSubNodes.length,
        treeStructure: this.formatTreeStructure(mainSubTree),
      },
    };
  }

  /**
   * 格式化树结构用于调试输出
   * @param {Array} tree - 树结构
   * @param {number} indent - 缩进级别
   * @returns {string} 格式化的树结构字符串
   */
  static formatTreeStructure(tree, indent = 0) {
    const spaces = "  ".repeat(indent);
    let result = "";

    for (const node of tree) {
      const nodeInfo =
        node.nodeType === "PROCESS_STEP"
          ? `${node.processName}(${node.processCode})`
          : `${node.materialName}(${node.materialCode})`;

      result += `${spaces}- [${node.nodeType}] ${nodeInfo}\n`;

      if (node.children && node.children.length > 0) {
        result += this.formatTreeStructure(node.children, indent + 1);
      }
    }

    return result;
  }

  /**
   * 改进版本：更新工艺流程记录节点（智能合并）
   * 基于createFlowByMaterialCode逻辑，重新生成完整流程然后进行智能合并
   * @param {string} barcode - 主条码
   * @param {string} userId - 操作用户ID
   * @returns {Promise<Object>} 更新后的流程记录
   */
  static async updateFlowNodesAdvanced(barcode, userId = "SYSTEM") {
    try {
      console.log(`开始高级更新流程节点: ${barcode}`);

      // 1. 获取现有流程记录
      const existingFlowRecord = await MaterialProcessFlow.findOne({ barcode });
      if (!existingFlowRecord) {
        throw new Error(`未找到条码为 ${barcode} 的流程记录`);
      }

      console.log(`找到现有流程记录: ${existingFlowRecord._id}`);
      console.log(`现有节点数量: ${existingFlowRecord.processNodes.length}`);

      // 2. 获取最新的工艺信息
      const craft = await Craft.findOne({
        materialId: existingFlowRecord.materialId,
      });
      if (!craft) {
        throw new Error(
          `未找到物料 ${existingFlowRecord.materialCode} 对应的工艺信息`
        );
      }

      console.log(
        `找到工艺信息: ${craft.craftName}, 版本: ${craft.craftVersion}`
      );

      // 3. 模拟生成一个新的完整流程结构（参考createFlowByMaterialCode）
      console.log("开始生成新的完整流程结构...");
      const newProcessNodes = await this.buildProcessNodes(
        existingFlowRecord.materialId,
        craft,
        new Set()
      );

      console.log(`生成新节点数量: ${newProcessNodes.length}`);

      // 4. 创建节点唯一标识映射（用于精确匹配）
      const createNodeSignature = (node) => {
        if (node.nodeType === "PROCESS_STEP") {
          return `PROCESS_${node.processStepId}_${node.level}`;
        } else if (node.nodeType === "MATERIAL") {
          return `MATERIAL_${node.materialId}_${node.level}`;
        }
        return `UNKNOWN_${node.nodeId}`;
      };

      // 5. 构建现有节点的映射表
      const existingNodeMap = new Map();
      existingFlowRecord.processNodes.forEach((node) => {
        const signature = createNodeSignature(node);
        if (!existingNodeMap.has(signature)) {
          existingNodeMap.set(signature, []);
        }
        existingNodeMap.get(signature).push(node);
      });

      console.log(
        `现有节点映射表构建完成，共 ${existingNodeMap.size} 种类型节点`
      );

      // 6. 智能合并节点（保留完成状态，更新结构）
      const mergedNodes = [];
      const processedSignatures = new Set();

      for (const newNode of newProcessNodes) {
        const signature = createNodeSignature(newNode);

        // 查找现有的匹配节点
        const existingNodes = existingNodeMap.get(signature) || [];

        if (existingNodes.length > 0) {
          // 找到匹配的现有节点，尝试使用最合适的一个
          let bestMatch = existingNodes[0];

          // 如果有多个匹配，优先选择已完成的节点
          for (const existingNode of existingNodes) {
            if (
              existingNode.status === "COMPLETED" &&
              bestMatch.status !== "COMPLETED"
            ) {
              bestMatch = existingNode;
              break;
            }
          }

          // 合并节点（保留重要的历史信息，更新结构信息）
          const mergedNode = {
            ...newNode, // 使用新的结构信息
            // 保留重要的历史状态
            status: bestMatch.status,
            barcode: bestMatch.barcode || "",
            scanTime: bestMatch.scanTime,
            endTime: bestMatch.endTime,
            updateBy: bestMatch.updateBy,
            relatedBill: bestMatch.relatedBill || "",
            // 特殊字段处理
            batchDocNumber: bestMatch.batchDocNumber,
            scanOperator: bestMatch.scanOperator,
          };

          mergedNodes.push(mergedNode);
          console.log(`合并节点: ${signature}, 状态: ${bestMatch.status}`);
        } else {
          // 新增的节点，设置为待处理状态
          const newMergedNode = {
            ...newNode,
            status: "PENDING",
            barcode: "",
            scanTime: null,
            endTime: null,
            updateBy: null,
            relatedBill: "",
          };

          mergedNodes.push(newMergedNode);
          console.log(`新增节点: ${signature}`);
        }

        processedSignatures.add(signature);
      }

      // 7. 检查被删除的节点（记录日志）
      const deletedNodes = [];
      existingFlowRecord.processNodes.forEach((existingNode) => {
        const signature = createNodeSignature(existingNode);
        if (!processedSignatures.has(signature)) {
          deletedNodes.push({
            signature,
            nodeType: existingNode.nodeType,
            name: existingNode.processName || existingNode.materialName,
            status: existingNode.status,
          });
        }
      });

      if (deletedNodes.length > 0) {
        console.log(`检测到被删除的节点 ${deletedNodes.length} 个:`);
        deletedNodes.forEach((node) => {
          console.log(`- ${node.signature}: ${node.name} (${node.status})`);
          // 记录节点删除历史
          this.recordNodeDeletion(existingFlowRecord._id, {
            nodeId: node.signature,
            nodeType: node.nodeType,
            name: node.name,
            status: node.status,
          });
        });
      }

      // 8. 处理子物料流程记录的更新
      console.log("开始处理子物料流程记录更新...");
      await this.updateSubMaterialFlowRecords(mergedNodes, userId);

      // 9. 按照节点层级和工序顺序排序
      mergedNodes.sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        if (a.nodeType === "PROCESS_STEP" && b.nodeType === "PROCESS_STEP") {
          return (a.processSort || 0) - (b.processSort || 0);
        }
        return 0;
      });

      // 10. 更新流程记录
      existingFlowRecord.processNodes = mergedNodes;
      existingFlowRecord.craftVersion = craft.craftVersion;
      existingFlowRecord.lastUpdateTime = new Date();
      existingFlowRecord.lastUpdateBy = userId;

      // 11. 保存更新
      await existingFlowRecord.save();
      console.log("流程记录保存成功");

      // 12. 重新计算进度和状态
      await this.fixFlowProgress(barcode);

      // 13. 重新获取更新后的记录
      const updatedFlowRecord = await MaterialProcessFlow.findOne({ barcode });

      console.log(
        `高级更新完成，最终节点数量: ${updatedFlowRecord.processNodes.length}`
      );
      console.log(`最终进度: ${updatedFlowRecord.progress}%`);
      console.log(`最终状态: ${updatedFlowRecord.status}`);

      return {
        success: true,
        message: "流程节点高级更新成功",
        data: updatedFlowRecord,
        statistics: {
          originalNodeCount: existingFlowRecord.processNodes.length,
          newNodeCount: newProcessNodes.length,
          finalNodeCount: mergedNodes.length,
          deletedNodeCount: deletedNodes.length,
          newAddedNodeCount:
            mergedNodes.length -
            (existingFlowRecord.processNodes.length - deletedNodes.length),
        },
      };
    } catch (error) {
      console.error("高级更新工艺流程记录失败:", error);
      throw error;
    }
  }

  /**
   * 更新子物料流程记录
   * 处理组件物料自身工艺变化的情况
   * @param {Array} mergedNodes - 合并后的节点数组
   * @param {string} userId - 操作用户ID
   */
  static async updateSubMaterialFlowRecords(mergedNodes, userId) {
    try {
      // 收集所有有条码的物料节点
      const materialNodesWithBarcode = mergedNodes.filter(
        (node) =>
          node.nodeType === "MATERIAL" &&
          node.barcode &&
          node.barcode.length > 0 &&
          node.level > 0 // 排除根节点
      );

      console.log(
        `发现 ${materialNodesWithBarcode.length} 个有条码的子物料节点`
      );

      // 并行更新所有子物料流程记录
      const updatePromises = materialNodesWithBarcode.map(
        async (materialNode) => {
          try {
            // 查找对应的子物料流程记录
            const subFlowRecord = await MaterialProcessFlow.findOne({
              barcode: materialNode.barcode,
            });

            if (subFlowRecord) {
              console.log(`更新子物料流程: ${materialNode.barcode}`);
              // 递归调用高级更新方法
              await this.updateFlowNodesAdvanced(materialNode.barcode, userId);
              console.log(`子物料流程更新完成: ${materialNode.barcode}`);
            } else {
              console.log(
                `子物料 ${materialNode.barcode} 没有对应的流程记录，跳过更新`
              );
            }
          } catch (error) {
            console.warn(
              `更新子物料流程失败 ${materialNode.barcode}:`,
              error.message
            );
            // 子物料更新失败不影响主流程
          }
        }
      );

      // 等待所有子物料更新完成
      await Promise.all(updatePromises);
      console.log("所有子物料流程记录更新完成");
    } catch (error) {
      console.error("更新子物料流程记录失败:", error);
      // 这里不抛出错误，因为子物料更新失败不应该影响主流程
    }
  }

  /**
   * 批量更新流程节点（用于工艺变更后的批量处理）
   * @param {Array<string>} barcodes - 需要更新的条码数组
   * @param {string} userId - 操作用户ID
   * @param {Object} options - 更新选项
   * @returns {Promise<Object>} 批量更新结果
   */
  static async batchUpdateFlowNodesAdvanced(
    barcodes,
    userId = "SYSTEM",
    options = {}
  ) {
    try {
      const {
        batchSize = 10, // 批次大小
        continueOnError = true, // 是否在遇到错误时继续
        logProgress = true, // 是否记录进度
      } = options;

      console.log(`开始批量更新流程节点，共 ${barcodes.length} 个条码`);

      const results = {
        success: [],
        failed: [],
        total: barcodes.length,
        startTime: new Date(),
      };

      // 分批处理
      for (let i = 0; i < barcodes.length; i += batchSize) {
        const batch = barcodes.slice(i, i + batchSize);

        if (logProgress) {
          console.log(
            `处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(
              barcodes.length / batchSize
            )}, 条码: ${batch.join(", ")}`
          );
        }

        // 并行处理当前批次
        const batchPromises = batch.map(async (barcode) => {
          try {
            const result = await this.updateFlowNodesAdvanced(barcode, userId);
            results.success.push({
              barcode,
              statistics: result.statistics,
              message: result.message,
            });
            return { barcode, success: true };
          } catch (error) {
            const errorInfo = {
              barcode,
              error: error.message,
              timestamp: new Date(),
            };
            results.failed.push(errorInfo);

            if (!continueOnError) {
              throw error;
            }

            console.error(`更新条码 ${barcode} 失败:`, error.message);
            return { barcode, success: false, error: error.message };
          }
        });

        // 等待当前批次完成
        await Promise.all(batchPromises);

        // 批次间短暂延迟，避免数据库压力过大
        if (i + batchSize < barcodes.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      results.endTime = new Date();
      results.duration = results.endTime - results.startTime;

      console.log(
        `批量更新完成，成功: ${results.success.length}, 失败: ${results.failed.length}, 耗时: ${results.duration}ms`
      );

      return results;
    } catch (error) {
      console.error("批量更新流程节点失败:", error);
      throw error;
    }
  }

  /**
   * 比较两个流程节点结构的差异
   * @param {Array} oldNodes - 旧节点数组
   * @param {Array} newNodes - 新节点数组
   * @returns {Object} 差异分析结果
   */
  static compareProcessNodes(oldNodes, newNodes) {
    try {
      const createNodeSignature = (node) => {
        if (node.nodeType === "PROCESS_STEP") {
          return `PROCESS_${node.processStepId}_${node.level}`;
        } else if (node.nodeType === "MATERIAL") {
          return `MATERIAL_${node.materialId}_${node.level}`;
        }
        return `UNKNOWN_${node.nodeId}`;
      };

      // 构建节点映射
      const oldNodeMap = new Map();
      const newNodeMap = new Map();

      oldNodes.forEach((node) => {
        const signature = createNodeSignature(node);
        oldNodeMap.set(signature, node);
      });

      newNodes.forEach((node) => {
        const signature = createNodeSignature(node);
        newNodeMap.set(signature, node);
      });

      // 分析差异
      const differences = {
        added: [], // 新增的节点
        removed: [], // 删除的节点
        modified: [], // 修改的节点
        unchanged: [], // 未变化的节点
      };

      // 检查新增的节点
      for (const [signature, newNode] of newNodeMap) {
        if (!oldNodeMap.has(signature)) {
          differences.added.push({
            signature,
            nodeType: newNode.nodeType,
            name: newNode.processName || newNode.materialName,
            level: newNode.level,
          });
        }
      }

      // 检查删除的节点
      for (const [signature, oldNode] of oldNodeMap) {
        if (!newNodeMap.has(signature)) {
          differences.removed.push({
            signature,
            nodeType: oldNode.nodeType,
            name: oldNode.processName || oldNode.materialName,
            level: oldNode.level,
            status: oldNode.status,
          });
        }
      }

      // 检查修改和未变化的节点
      for (const [signature, oldNode] of oldNodeMap) {
        if (newNodeMap.has(signature)) {
          const newNode = newNodeMap.get(signature);

          // 比较关键属性是否有变化
          const hasChanges =
            oldNode.requireScan !== newNode.requireScan ||
            oldNode.isKeyMaterial !== newNode.isKeyMaterial ||
            oldNode.isBatch !== newNode.isBatch ||
            oldNode.batchQuantity !== newNode.batchQuantity ||
            oldNode.processSort !== newNode.processSort;

          if (hasChanges) {
            differences.modified.push({
              signature,
              nodeType: oldNode.nodeType,
              name: oldNode.processName || oldNode.materialName,
              level: oldNode.level,
              changes: {
                requireScan: {
                  old: oldNode.requireScan,
                  new: newNode.requireScan,
                },
                isKeyMaterial: {
                  old: oldNode.isKeyMaterial,
                  new: newNode.isKeyMaterial,
                },
                isBatch: { old: oldNode.isBatch, new: newNode.isBatch },
                batchQuantity: {
                  old: oldNode.batchQuantity,
                  new: newNode.batchQuantity,
                },
                processSort: {
                  old: oldNode.processSort,
                  new: newNode.processSort,
                },
              },
            });
          } else {
            differences.unchanged.push({
              signature,
              nodeType: oldNode.nodeType,
              name: oldNode.processName || oldNode.materialName,
              level: oldNode.level,
            });
          }
        }
      }

      return {
        summary: {
          totalOld: oldNodes.length,
          totalNew: newNodes.length,
          added: differences.added.length,
          removed: differences.removed.length,
          modified: differences.modified.length,
          unchanged: differences.unchanged.length,
        },
        details: differences,
      };
    } catch (error) {
      console.error("比较流程节点差异失败:", error);
      throw error;
    }
  }

  /**
   * 检查工艺变更影响的条码
   * @param {string} materialId - 物料ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 受影响的条码列表
   */
  static async findAffectedBarcodesByCraftChange(materialId, options = {}) {
    try {
      const {
        status = null, // 流程状态过滤
        maxCount = 1000, // 最大返回数量
        includeDays = null, // 包含最近几天的记录
      } = options;

      // 构建查询条件
      const query = { materialId };

      if (status) {
        query.status = status;
      }

      if (includeDays) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - includeDays);
        query.createdAt = { $gte: startDate };
      }

      // 查询受影响的流程记录
      const affectedRecords = await MaterialProcessFlow.find(query)
        .select("barcode materialCode materialName status progress createdAt")
        .limit(maxCount)
        .sort({ createdAt: -1 });

      console.log(
        `找到 ${affectedRecords.length} 个受物料 ${materialId} 工艺变更影响的条码`
      );

      return affectedRecords.map((record) => ({
        barcode: record.barcode,
        materialCode: record.materialCode,
        materialName: record.materialName,
        status: record.status,
        progress: record.progress,
        createdAt: record.createdAt,
      }));
    } catch (error) {
      console.error("查找受工艺变更影响的条码失败:", error);
      throw error;
    }
  }

  /**
   * 预览流程节点更新（不实际执行更新）
   * @param {string} barcode - 主条码
   * @returns {Promise<Object>} 更新预览结果
   */
  static async previewFlowNodesUpdate(barcode) {
    try {
      // 1. 获取现有流程记录
      const existingFlowRecord = await MaterialProcessFlow.findOne({ barcode });
      if (!existingFlowRecord) {
        throw new Error(`未找到条码为 ${barcode} 的流程记录`);
      }

      // 2. 获取最新的工艺信息
      const craft = await Craft.findOne({
        materialId: existingFlowRecord.materialId,
      });
      if (!craft) {
        throw new Error(
          `未找到物料 ${existingFlowRecord.materialCode} 对应的工艺信息`
        );
      }

      // 3. 生成新的流程结构
      const newProcessNodes = await this.buildProcessNodes(
        existingFlowRecord.materialId,
        craft,
        new Set()
      );

      // 4. 比较差异
      const comparison = this.compareProcessNodes(
        existingFlowRecord.processNodes,
        newProcessNodes
      );

      // 5. 分析影响
      const analysis = {
        craftVersionChanged:
          existingFlowRecord.craftVersion !== craft.craftVersion,
        structureChanged:
          comparison.summary.added > 0 || comparison.summary.removed > 0,
        propertiesChanged: comparison.summary.modified > 0,
        riskLevel: this.assessUpdateRisk(existingFlowRecord, comparison),
      };

      return {
        barcode,
        currentStatus: {
          craftVersion: existingFlowRecord.craftVersion,
          status: existingFlowRecord.status,
          progress: existingFlowRecord.progress,
          nodeCount: existingFlowRecord.processNodes.length,
        },
        newStatus: {
          craftVersion: craft.craftVersion,
          nodeCount: newProcessNodes.length,
        },
        comparison,
        analysis,
        recommendations: this.generateUpdateRecommendations(
          existingFlowRecord,
          comparison,
          analysis
        ),
      };
    } catch (error) {
      console.error("预览流程节点更新失败:", error);
      throw error;
    }
  }

  /**
   * 评估更新风险等级
   * @param {Object} flowRecord - 流程记录
   * @param {Object} comparison - 比较结果
   * @returns {string} 风险等级
   */
  static assessUpdateRisk(flowRecord, comparison) {
    const completedNodes = flowRecord.processNodes.filter(
      (node) => node.status === "COMPLETED"
    );
    const hasCompletedNodes = completedNodes.length > 0;
    const hasRemovedNodes = comparison.summary.removed > 0;
    const hasAddedNodes = comparison.summary.added > 0;

    if (hasRemovedNodes && hasCompletedNodes) {
      return "HIGH"; // 有已完成的节点被删除
    } else if (
      (hasAddedNodes || comparison.summary.modified > 0) &&
      hasCompletedNodes
    ) {
      return "MEDIUM"; // 有结构变化且有已完成的节点
    } else if (hasAddedNodes || comparison.summary.modified > 0) {
      return "LOW"; // 有变化但无已完成节点
    } else {
      return "NONE"; // 无变化
    }
  }

  /**
   * 生成更新建议
   * @param {Object} flowRecord - 流程记录
   * @param {Object} comparison - 比较结果
   * @param {Object} analysis - 分析结果
   * @returns {Array} 建议列表
   */
  static generateUpdateRecommendations(flowRecord, comparison, analysis) {
    const recommendations = [];

    if (analysis.riskLevel === "HIGH") {
      recommendations.push({
        type: "WARNING",
        message:
          "检测到高风险更新：有已完成的节点将被删除，建议谨慎操作并备份数据",
      });
    }

    if (analysis.riskLevel === "MEDIUM") {
      recommendations.push({
        type: "INFO",
        message: "检测到中等风险更新：有结构变化，建议在非生产环境先测试",
      });
    }

    if (comparison.summary.added > 0) {
      recommendations.push({
        type: "INFO",
        message: `将新增 ${comparison.summary.added} 个节点，这些节点将设置为待处理状态`,
      });
    }

    if (comparison.summary.removed > 0) {
      recommendations.push({
        type: "WARNING",
        message: `将删除 ${comparison.summary.removed} 个节点，请确认这些节点不再需要`,
      });
    }

    if (flowRecord.status === "IN_PROCESS") {
      recommendations.push({
        type: "INFO",
        message: "流程正在进行中，更新后请重新检查进度和状态",
      });
    }

    return recommendations;
  }

  /**
   * 使用示例：演示如何使用改进的更新系统
   */
  static getUsageExamples() {
    return {
      // 1. 单个条码预览更新
      previewSingleUpdate: `
        // 预览单个条码的更新影响
        const preview = await MaterialProcessFlowService.previewFlowNodesUpdate('YOUR_BARCODE');
        console.log('风险等级:', preview.analysis.riskLevel);
        console.log('建议:', preview.recommendations);
        
        // 如果风险可接受，执行更新
        if (preview.analysis.riskLevel !== 'HIGH') {
          const result = await MaterialProcessFlowService.updateFlowNodesAdvanced('YOUR_BARCODE', 'USER_ID');
          console.log('更新结果:', result.statistics);
        }
      `,

      // 2. 批量更新工艺变更影响的条码
      batchUpdateByMaterial: `
        // 查找受工艺变更影响的条码
        const affectedBarcodes = await MaterialProcessFlowService.findAffectedBarcodesByCraftChange(
          'MATERIAL_ID',
          {
            status: 'IN_PROCESS', // 只更新进行中的流程
            includeDays: 30, // 只包含最近30天的记录
            maxCount: 100 // 最多100个条码
          }
        );
        
        console.log(\`找到 \${affectedBarcodes.length} 个受影响的条码\`);
        
        // 批量更新
        const batchResult = await MaterialProcessFlowService.batchUpdateFlowNodesAdvanced(
          affectedBarcodes.map(item => item.barcode),
          'USER_ID',
          {
            batchSize: 5, // 每批处理5个
            continueOnError: true, // 遇到错误继续处理
            logProgress: true // 记录进度
          }
        );
        
        console.log(\`批量更新完成，成功: \${batchResult.success.length}, 失败: \${batchResult.failed.length}\`);
      `,

      // 3. 工艺变更后的完整更新流程
      fullUpdateWorkflow: `
        // 完整的工艺变更更新流程
        async function handleCraftChange(materialId, userId) {
          try {
            // 1. 查找受影响的条码
            const affectedBarcodes = await MaterialProcessFlowService.findAffectedBarcodesByCraftChange(materialId);
            
            if (affectedBarcodes.length === 0) {
              console.log('没有受影响的条码');
              return;
            }
            
            console.log(\`找到 \${affectedBarcodes.length} 个受影响的条码\`);
            
            // 2. 预览几个典型条码的更新影响
            const sampleBarcodes = affectedBarcodes.slice(0, 3);
            for (const sample of sampleBarcodes) {
              const preview = await MaterialProcessFlowService.previewFlowNodesUpdate(sample.barcode);
              console.log(\`条码 \${sample.barcode} 风险等级: \${preview.analysis.riskLevel}\`);
            }
            
            // 3. 分类处理不同风险等级的条码
            const highRiskBarcodes = [];
            const safeUpdateBarcodes = [];
            
            for (const item of affectedBarcodes) {
              const preview = await MaterialProcessFlowService.previewFlowNodesUpdate(item.barcode);
              if (preview.analysis.riskLevel === 'HIGH') {
                highRiskBarcodes.push(item.barcode);
              } else {
                safeUpdateBarcodes.push(item.barcode);
              }
            }
            
            // 4. 先更新安全的条码
            if (safeUpdateBarcodes.length > 0) {
              console.log(\`开始更新 \${safeUpdateBarcodes.length} 个低风险条码\`);
              const safeResult = await MaterialProcessFlowService.batchUpdateFlowNodesAdvanced(
                safeUpdateBarcodes,
                userId
              );
              console.log('低风险条码更新完成:', safeResult.success.length);
            }
            
            // 5. 高风险条码需要人工确认
            if (highRiskBarcodes.length > 0) {
              console.log(\`发现 \${highRiskBarcodes.length} 个高风险条码，需要人工确认\`);
              // 这里可以发送通知或记录日志，等待人工处理
            }
            
            return {
              total: affectedBarcodes.length,
              safeUpdated: safeUpdateBarcodes.length,
              highRisk: highRiskBarcodes.length
            };
            
          } catch (error) {
            console.error('工艺变更更新流程失败:', error);
            throw error;
          }
        }
      `,

      // 4. 比较两个流程的差异
      compareFlows: `
        // 比较两个流程节点的差异
        const flowRecord1 = await MaterialProcessFlow.findOne({ barcode: 'BARCODE1' });
        const flowRecord2 = await MaterialProcessFlow.findOne({ barcode: 'BARCODE2' });
        
        const comparison = MaterialProcessFlowService.compareProcessNodes(
          flowRecord1.processNodes,
          flowRecord2.processNodes
        );
        
        console.log('差异摘要:', comparison.summary);
        console.log('新增节点:', comparison.details.added);
        console.log('删除节点:', comparison.details.removed);
        console.log('修改节点:', comparison.details.modified);
      `,
    };
  }

  /**
   * 查询工单中已完成产品的报废数量
   * @param {string} workOrderId - 工单ID
   * @returns {Promise<number>} 已完成产品的报废数量
   */
  static async getCompletedScrapQuantity(workOrderId) {
    try {
      const ProductRepair = mongoose.model("product_repair");

      // 查询该工单下所有已审核的报废记录中，报废时已完成的产品数量
      const completedScrapRecords = await ProductRepair.find({
        productionPlanWorkOrderId: workOrderId,
        solution: "报废",
        status: "REVIEWED",
        isCompletedWhenScrapped: true,
      });

      return completedScrapRecords.length;
    } catch (error) {
      console.error("查询已完成报废数量失败:", error);
      return 0; // 出错时返回0，不影响主流程
    }
  }
}

// 【性能优化】启动缓存自动清理
// 这将在每个 PM2 进程中独立运行
MaterialProcessFlowService.barcodeRuleCache.startAutoCleanup();

module.exports = MaterialProcessFlowService;
