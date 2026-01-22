var mongoose = require("mongoose");

var saleOrderExtSchema = new mongoose.Schema({
  // 关联主表ID
  FSaleOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "k3_SAL_SaleOrder",
    required: true,
  },
  FBillNo: { type: String }, // 销售订单号

  // 基本信息
  FCustNo: { type: String }, // 客户型号
  FCustCode: { type: String }, // 客户代码
  FColor: { type: String }, // 颜色
  FQty: { type: Number }, // 数量
  FCustOrderNo: { type: String }, // 客户订单号
  FProductName: { type: String }, // 产品名称
  FProductModel: { type: String }, // 产品型号
  FProductTypeName: { type: String }, // 产品类型名称

  // 产品详细信息
  FSaleCountry: { type: String, required: true }, // 销售国家地区
  FMinSpec: { type: String, required: true }, // 铭牌
  FMinSpecImage: { type: String }, // 铭牌图片路径
  FVoltageRatio: { type: String, required: true }, // 电压功率
  FBatterySpec: { type: String, required: true }, // 锂电池规格
  FProductUrl: { type: String }, // 产品网址

  // 印刷和包装信息
  FPrintPosition: { type: String, required: true }, // 印刷位置
  FPrintColor: { type: String, required: true }, // 印刷颜色
  FAccessories: { type: String }, // 备损件
  FManual: { type: String, required: true }, // 说明书
  FSelfSeal: { type: String, required: true }, // 自封袋

  // 认证和标识信息
  FCertification: { type: String, required: true }, // 认证要求
  FProductColor: { type: String, required: true }, // 产品颜色
  FColorLabel: { type: String, required: true }, // 彩盒标贴
  FColorLabelImage: { type: String }, // 彩盒标贴图片路径
  FTrademark: { type: String, required: true }, // 商标

  // UDI信息
  FUDI: { type: String, required: true }, // UDI
  FUDISerialNoRule: { type: String, required: true }, // 序列号规则
  FUDIType: { type: String, required: true }, // 形制

  // 包装要求
  FPEBagReq: { type: String, required: true }, // PE袋要求
  FBoxLabel: { type: String, required: true }, // 托盘标贴
  FBoxLabelImage: { type: String }, // 托盘标贴图片路径
  FBoxLabelPackage: { type: String, required: true }, // 托盘标贴及包装方式
  FOtherReq: { type: String }, // 其他要求
  // 装箱数量
  FBoxNum: { type: String }, // 装箱数量
  // 托盘箱数量
  FPalletBoxNum: { type: String }, // 托盘箱数量
  // 毛重(箱)
  FGrossWeight: { type: String }, // 毛重(箱)
  // 净重(箱)
  FNetWeight: { type: String }, // 净重(箱)
  // 中箱尺寸
  FBoxSize: { type: String }, // 中箱尺寸

  // 系统字段
  FCreateTime: { type: Date, default: Date.now }, // 创建时间
  FUpdateTime: { type: Date, default: Date.now }, // 更新时间
});

// 更新时间中间件
saleOrderExtSchema.pre("save", function (next) {
  this.FUpdateTime = Date.now();
  next();
});

module.exports = mongoose.model("k3_SAL_SaleOrderExt", saleOrderExtSchema);
