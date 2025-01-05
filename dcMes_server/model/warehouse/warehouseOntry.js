const mongoose = require("mongoose");

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
  
  // 出库状态
  status: {
    type: String,
    enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"], // 新增：CANCELLED状态
    default: "PENDING"
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
  updateBy: { type: mongoose.Schema.ObjectId, ref: "user_login" }, // 更新人ID
  updateByName: { type: String }, // 新增：更新人姓名
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now }
});

// 添加索引
warehouseOntrySchema.index({ entryNo: 1 }, { unique: true });
warehouseOntrySchema.index({ productionOrderNo: 1 });
warehouseOntrySchema.index({ status: 1 });
warehouseOntrySchema.index({ createAt: -1 });
warehouseOntrySchema.index({ "entryItems.palletCode": 1 }); // 新增：托盘编号索引

module.exports = mongoose.model("warehouse_ontry", warehouseOntrySchema); 