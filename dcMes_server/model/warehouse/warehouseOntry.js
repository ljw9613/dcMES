/**
 * 仓库出库单模型
 * @author ljw
 * @email 1798245303@qq.com
 * @description 优化后的仓库出库单模型，支持添可销售订单类型的特殊限制规则
 */
const mongoose = require("mongoose");

// 托盘内装箱/产品明细结构
const palletItemSchema = new mongoose.Schema(
  {
    // 箱子条码信息
    boxBarcode: { type: String }, // 箱子条码
    boxBarcodes: [
      {
        materialProcessFlowId: {
          type: mongoose.Schema.ObjectId,
          ref: "material_process_flow",
        }, // 关联工艺流程
        barcode: { type: String }, // 托盘条码
        barcodeType: { type: String }, // 托盘条码类型
        scanTime: { type: Date }, // 扫码时间
        outWarehouseStatus: { type: String, default: "PENDING" }, // 出库状态
        outWarehouseTime: { type: Date }, // 出库时间
        outWarehouseBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 出库人
      },
    ],
    productionPlanWorkOrderId: {
      type: mongoose.Schema.ObjectId,
      ref: "production_plan_work_order",
      description: "工单ID",
    },
    quantity: { type: Number, default: 1 }, // 数量（箱子时为箱内数量）
    scanTime: { type: Date, default: Date.now }, // 扫描时间
    scanBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 扫描人
  },
  { _id: false }
);

// 出库明细行项目
const entryItemSchema = new mongoose.Schema(
  {
    palletId: { type: mongoose.Schema.ObjectId, ref: "material_palletizing" }, // 关联托盘ID
    palletCode: { type: String }, // 托盘编号
    saleOrderNo: { type: String }, // 新增：销售订单
    materialCode: { type: String }, //新增： 物料编码
    lineCode: { type: String }, // 新增：产线
    palletType: { type: String }, // 新增：托盘类型
    quantity: { type: Number, default: 0 }, // 托盘出库数量
    boxCount: { type: Number, default: 0 }, // 新增：箱数
    scanTime: { type: Date }, // 扫描时间
    scanBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 扫描人
    scanByName: { type: String }, // 新增：扫描人姓名
    // 箱子信息
    boxItems: [palletItemSchema], // 托盘内物料明细

    // 托盘条码信息
    palletBarcodes: [
      {
        barcode: { type: String }, // 托盘条码
        barcodeType: { type: String }, // 托盘条码类型
        materialProcessFlowId: {
          type: mongoose.Schema.ObjectId,
          ref: "material_process_flow",
        }, // 关联工艺流程
        productionPlanWorkOrderId: {
          type: mongoose.Schema.ObjectId,
          ref: "production_plan_work_order",
          description: "工单ID",
        },
        scanTime: { type: Date }, // 扫码时间
        scanBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 扫描人
        outWarehouseStatus: { type: String, default: "PENDING" }, // 出库状态
        outWarehouseTime: { type: Date }, // 出库时间
        outWarehouseBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 出库人
      },
    ], // 托盘条码
  },
  { _id: false }
);

// 出库单主表
const warehouseOntrySchema = new mongoose.Schema({
  entryNo: { type: String, required: true, unique: true }, // 出库单号
  entryType: { type: String, default: "PRODUCTION" }, // 新增：出库类型（生产出库/其他）

  //出库信息
  HuoGuiCode: { type: String }, // 货柜号
  FaQIaoNo: { type: String }, // 发票号
  outboundQuantity: { type: Number }, // 应出库数量
  outNumber: { type: Number, default: 0 }, // 已出库数量
  saleNumber: { type: Number, default: 0 }, // 销售数量

  // 生产订单相关信息
  productionOrderId: { type: mongoose.Schema.ObjectId, ref: "k3_PRD_MO" }, // 关联生产订单
  productionOrderNo: { type: String }, // 生产订单号

  // 销售订单相关信息
  saleOrderId: { type: mongoose.Schema.ObjectId, ref: "k3_SAL_SaleOrder" }, // 销售订单ID
  saleOrderNo: { type: String }, // 销售订单号
  saleOrderEntryId: { type: String }, // 销售订单分录内码

  // 物料信息
  materialId: { type: mongoose.Schema.ObjectId, ref: "k3_material" }, // 物料ID
  materialCode: { type: String }, // 物料编码
  materialName: { type: String }, // 物料名称
  materialSpec: { type: String }, // 规格型号

  // 数量信息
  // plannedQuantity: { type: Number, required: true }, // 应收数量（来自生产订单）
  actualQuantity: { type: Number, default: 0 }, // 实际出库数量
  palletCount: { type: Number, default: 0 }, // 托盘数量
  totalBoxCount: { type: Number, default: 0 }, // 新增：总箱数

  // 出库进度
  progress: { type: Number, default: 0 }, // 出库进度
  unit: { type: String }, // 单位
  workShop: { type: String }, // 生产车间
  productType: { type: String }, // 产品类型

  // 工单白名单（允许出库的工单列表）
  workOrderWhitelist: [
    {
      workOrderNo: { type: String }, // 工单号
      workOrderId: {
        type: mongoose.Schema.ObjectId,
        ref: "production_plan_work_order",
      }, // 工单ID
      productionOrderNo: { type: String }, // 生产订单号
      addedAt: { type: Date, default: Date.now }, // 添加时间
    },
  ],

  // 白名单锁定状态（针对添可销售订单类型）
  whitelistLocked: {
    type: Boolean,
    default: false,
    description: "白名单是否已锁定，一旦锁定不可修改"
  },

  // 白名单锁定时间
  whitelistLockedAt: {
    type: Date,
    description: "白名单锁定时间"
  },

  // 当前出库单关联的工单号（用于托盘工单一致性验证）
  currentWorkOrderNo: {
    type: String,
    description: "当前出库单中托盘所属的工单号，确保同一出库单中托盘来自同一工单"
  },

  // 出库模式
  outboundMode: {
    type: String,
    enum: ["SINGLE", "PALLET"], // 单一产品出库/整托盘出库
    default: "PALLET",
  },

  // 出库状态
  status: {
    type: String,
    enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"], // 新增：CANCELLED状态
    default: "PENDING",
  },

  // 出库明细
  entryItems: [entryItemSchema],

  // 时间信息
  startTime: { type: Date }, // 开始出库时间
  endTime: { type: Date }, // 完成出库时间

  // 关联组织
  correspondOrgId: { type: String }, // 关联组织

  // 基础字段
  remark: { type: String }, // 备注
  createBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 创建人ID
  createByName: { type: String }, // 新增：创建人姓名
  updateBy: { type: String }, // 更新人ID
  updateByName: { type: String }, // 新增：更新人姓名
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

// 添加实例方法
warehouseOntrySchema.methods = {
  /**
   * 检查是否为添可销售订单类型
   * @param {Object} saleOrder - 销售订单对象
   * @returns {Boolean} 是否为添可销售订单
   */
  isTiankeOrder: function(saleOrder) {
    return saleOrder && saleOrder.FSettleId_FNumber === "CUST0199";
  },

  /**
   * 验证白名单工单数量限制（添可订单限制为1个）
   * @param {Object} saleOrder - 销售订单对象
   * @returns {Boolean} 是否符合数量限制
   */
  validateWhitelistCount: function(saleOrder) {
    if (this.isTiankeOrder(saleOrder)) {
      return this.workOrderWhitelist.length <= 1;
    }
    return true; // 非添可订单不限制
  },

  /**
   * 验证托盘工单一致性
   * @param {String} workOrderNo - 新托盘的工单号
   * @returns {Boolean} 是否符合工单一致性要求
   */
  validatePalletWorkOrderConsistency: function(workOrderNo) {
    if (!this.currentWorkOrderNo) {
      return true; // 第一个托盘，允许
    }
    return this.currentWorkOrderNo === workOrderNo;
  },

  /**
   * 锁定白名单
   */
  lockWhitelist: function() {
    this.whitelistLocked = true;
    this.whitelistLockedAt = new Date();
  },

  /**
   * 检查白名单是否可以修改
   * @returns {Boolean} 是否可以修改
   */
  canModifyWhitelist: function() {
    return !this.whitelistLocked;
  }
};

// 添加索引
warehouseOntrySchema.index({ entryNo: 1 }, { unique: true });
warehouseOntrySchema.index({ productionOrderNo: 1 });
warehouseOntrySchema.index({ status: 1 });
warehouseOntrySchema.index({ createAt: -1 });
warehouseOntrySchema.index({ "entryItems.palletCode": 1 }); // 新增：托盘编号索引
warehouseOntrySchema.index({ whitelistLocked: 1 }); // 新增：白名单锁定状态索引
warehouseOntrySchema.index({ currentWorkOrderNo: 1 }); // 新增：当前工单号索引

module.exports = mongoose.model("warehouse_ontry", warehouseOntrySchema);
