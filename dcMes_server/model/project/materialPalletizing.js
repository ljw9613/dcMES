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

// 托盘主表
const materialPalletizingSchema = new mongoose.Schema({
  palletCode: { type: String, required: true, unique: true }, // 托盘编号
  palletType: { type: String }, // 托盘类型

  saleOrderId: { type: mongoose.Schema.ObjectId, ref: "k3_SAL_SaleOrder" }, // 关联销售订单
  saleOrderNo: { type: String }, // 销售订单号

  productionOrderId: { type: mongoose.Schema.ObjectId, ref: "k3_PRD_MO" }, // 关联生产订单
  productionOrderNo: { type: String }, // 生产单号

  // 工序相关信息
  processStepId: { type: mongoose.Schema.ObjectId, ref: "processStep" }, // 工序ID

  // 新增字段：工单数组
  workOrders: [
    {
      productionOrderId: {
        type: mongoose.Schema.ObjectId,
        ref: "k3_PRD_MO",
      },
      productionOrderNo: String,
      workOrderNo: String,
      productionPlanWorkOrderId: {
        type: mongoose.Schema.ObjectId,
        ref: "production_plan_work_order",
      },
      quantity: { type: Number, default: 0 }, // 该工单在托盘中的数量
    },
  ],

  //工单信息
  workOrderNo: { type: String }, // 工单号
  productionPlanWorkOrderId: {
    type: mongoose.Schema.ObjectId,
    ref: "production_plan_work_order",
    description: "工单ID",
  },

  productLineId: { type: mongoose.Schema.ObjectId, ref: "production_line" }, // 产线ID
  productLineName: { type: String }, // 产线名称

  // 托盘物料基本信息
  materialId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" }, // 主要物料ID
  materialCode: { type: String }, // 主要物料编码
  materialName: { type: String }, // 主要物料名称
  materialSpec: { type: String }, // 规格型号

  isLastPallet: { type: Boolean, default: false }, // 是否尾数托盘

  // 组托托盘状态
  status: {
    type: String,
    enum: ["STACKING", "STACKED"], // 组托状态 组托中 组托完成
    default: "STACKING",
  },

  // 出入库状态
  inWarehouseStatus: {
    type: String,
    enum: ["PENDING", "IN_WAREHOUSE", "PART_OUT_WAREHOUSE", "OUT_WAREHOUSE"], //待入库 已入库 部分出库 已出库
    default: "PENDING",
  },

  //维修状态
  repairStatus: {
    type: String,
    enum: ["PENDING", "REPAIRING", "REPAIRED"], //待维修 维修中 维修完成
    default: "PENDING",
  },

  // 数量信息
  totalQuantity: { type: Number, default: 0 }, // 托盘总数量
  boxCount: { type: Number, default: 0 }, // 箱子数量
  barcodeCount: { type: Number, default: 0 }, // 单个产品数量

  // 箱子信息
  boxItems: [palletItemSchema], // 托盘内物料明细

  // 托盘条码信息
  palletBarcodes: [
    {
      materialProcessFlowId: {
        type: mongoose.Schema.ObjectId,
        ref: "material_process_flow",
      }, // 关联工艺流程
      barcode: { type: String }, // 托盘条码
      barcodeType: { type: String }, // 托盘条码类型
      scanTime: { type: Date }, // 扫码时间
      // 入库状态
      inWarehouseStatus: {
        type: String,
        enum: ["PENDING", "COMPLETED"],
        default: "PENDING",
      },
      // 出库状态
      outWarehouseStatus: {
        type: String,
        enum: ["PENDING", "COMPLETED"],
        default: "PENDING",
      },
      inWarehouseTime: { type: Date }, // 入库时间
      outWarehouseTime: { type: Date }, // 出库时间
      inWarehouseBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 入库人
      outWarehouseBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 出库人

      inspectionStatus: {
        type: String,
        enum: ["PENDING", "INSPECTING", "INSPECTED"], // 抽检状态 待抽检 抽检中 抽检完成
        default: "PENDING",
      },
      // 巡检时间
      inspectionTime: { type: Date }, // 巡检时间
      inspectionBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 巡检人
      inspectionRemarks: { type: String }, // 巡检备注
      //巡检结果
      inspectionResult: {
        type: String,
        enum: ["PENDING", "PASS", "FAIL"], // 巡检结果 待巡检 合格 不合格
        default: "PENDING",
      },
      productionPlanWorkOrderId: {
        type: mongoose.Schema.ObjectId,
        ref: "production_plan_work_order",
        description: "工单ID",
      },
    },
  ], // 托盘条码

  // 工单信息
  productionPlanWorkOrderId: {
    type: mongoose.Schema.ObjectId,
    ref: "production_plan_work_order",
    description: "工单ID",
  },

  // 时间信息
  startStackTime: { type: Date }, // 开始组托时间
  endStackTime: { type: Date }, // 完成组托时间

  // 入库状态
  inWarehouseState: {
    type: String,
    enum: ["PENDING", "IN_PROCESS", "COMPLETED"],
    default: "PENDING",
  },

  // 出库状态
  outWarehouseState: {
    type: String,
    enum: ["PENDING", "IN_PROCESS", "COMPLETED"],
    default: "PENDING",
  },

  inWarehouseTime: { type: Date }, // 入库时间
  outWarehouseTime: { type: Date }, // 出库时间

  // 拆分托盘信息
  splitFrom: { type: String }, // 拆分托盘编号

  //抽检状态
  inspectionStatus: {
    type: String,
    enum: ["PENDING", "INSPECTING", "INSPECTED"], // 抽检状态 待抽检 抽检中 抽检完成
    default: "PENDING",
  },
  // 抽检时间
  inspectionTime: { type: Date }, // 抽检时间
  inspectionBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 抽检人
  inspectionRemarks: { type: String }, // 抽检备注
  // 基础字段
  remark: { type: String }, // 备注
  createBy: { type: mongoose.Schema.ObjectId, ref: "user_login" },
  updateBy: { type: String }, // 更新人
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

// 添加索引
materialPalletizingSchema.index({ palletCode: 1 }, { unique: true });

// 修正字段名：从 palletItems.barcode 改为 palletBarcodes.barcode
materialPalletizingSchema.index({ "palletBarcodes.barcode": 1 });
materialPalletizingSchema.index({ status: 1 });
materialPalletizingSchema.index({ createAt: -1 });

// 新增：防重复唯一索引 - 确保在活跃托盘中条码不重复
materialPalletizingSchema.index(
  { 
    "palletBarcodes.barcode": 1,
    "status": 1 
  }, 
  { 
    unique: true,
    partialFilterExpression: { 
      "status": { $in: ["STACKING", "STACKED"] },
      "palletBarcodes.barcode": { $exists: true, $ne: null }
    },
    name: "unique_barcode_in_active_pallets"
  }
);

// 新增：防重复唯一索引 - 确保在活跃托盘中包装箱条码不重复
materialPalletizingSchema.index(
  { 
    "boxItems.boxBarcode": 1,
    "status": 1 
  }, 
  { 
    unique: true,
    partialFilterExpression: { 
      "status": { $in: ["STACKING", "STACKED"] },
      "boxItems.boxBarcode": { $exists: true, $ne: null }
    },
    name: "unique_box_barcode_in_active_pallets"
  }
);

// 新增：性能优化索引
materialPalletizingSchema.index({ "boxItems.boxBarcode": 1, "status": 1 });
materialPalletizingSchema.index({ "productLineId": 1, "status": 1, "materialId": 1 });
materialPalletizingSchema.index({ "saleOrderId": 1, "materialId": 1 });
materialPalletizingSchema.index({ "productionPlanWorkOrderId": 1, "status": 1 });

// 添加pre-save中间件，自动更新updateAt字段
materialPalletizingSchema.pre('save', function(next) {
  // 只在文档被修改时更新updateAt字段
  if (this.isModified() && !this.isNew) {
    this.updateAt = new Date();
  }
  next();
});

// 添加pre-updateOne中间件，自动更新updateAt字段
materialPalletizingSchema.pre(['updateOne', 'findOneAndUpdate'], function() {
  // 确保所有updateOne和findOneAndUpdate操作都包含updateAt
  if (this.getUpdate() && !this.getUpdate().$set?.updateAt) {
    if (!this.getUpdate().$set) {
      this.getUpdate().$set = {};
    }
    this.getUpdate().$set.updateAt = new Date();
  }
});

module.exports = mongoose.model(
  "material_palletizing",
  materialPalletizingSchema
);
