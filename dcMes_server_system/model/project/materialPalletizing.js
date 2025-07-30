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
  materialId: { type: mongoose.Schema.ObjectId, ref: "k3_material" }, // 主要物料ID
  materialCode: { type: String }, // 主要物料编码
  materialName: { type: String }, // 主要物料名称
  materialSpec: { type: String }, // 规格型号

  // 组托托盘状态
  status: {
    type: String,
    enum: ["STACKING", "STACKED"], // 组托状态 组托中 组托完成
    default: "STACKING",
  },

  // 出入库状态
  inWarehouseStatus: {
    type: String,
    enum: ["PENDING", "IN_WAREHOUSE", "OUT_WAREHOUSE"],
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
  inWarehouseTime: { type: Date }, // 入库时间
  outWarehouseTime: { type: Date }, // 出库时间

  // 拆分托盘信息
  splitFrom: { type: String }, // 拆分托盘编号

  // 基础字段
  remark: { type: String }, // 备注
  createBy: { type: mongoose.Schema.ObjectId, ref: "user_login" },
  updateBy: { type: mongoose.Schema.ObjectId, ref: "user_login" },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

// 添加索引
materialPalletizingSchema.index({ palletCode: 1 }, { unique: true });
materialPalletizingSchema.index({ "palletItems.barcode": 1 });
materialPalletizingSchema.index({ status: 1 });
materialPalletizingSchema.index({ createAt: -1 });

module.exports = mongoose.model(
  "material_palletizing",
  materialPalletizingSchema
);
