const mongoose = require("mongoose");

const productionPlanWorkOrderSchema = new mongoose.Schema({
    // 工单基础信息
    workOrderNo: { type: String, required: true, unique: true }, // 任务工单号
    saleOrderId: { type: mongoose.Schema.ObjectId, ref: "k3_SAL_SaleOrder" }, // 关联销售订单
    saleOrderNo: { type: String }, // 销售单号
    productionOrderId: { type: mongoose.Schema.ObjectId, ref: "k3_PRD_MO" }, // 关联生产订单
    productionOrderNo: { type: String }, // 生产单号
    
    // 产品信息
    materialId: { type: mongoose.Schema.ObjectId, ref: "k3_BD_MATERIAL" }, // 关联物料表
    productModel: { type: String, required: true }, // 产品型号
    productName: { type: String, required: true }, // 产品名称
    // 金蝶云物料信息
    FMaterialId: { type: String }, // 物料编码

    
    // 生产信息
    productionLineId: { type: mongoose.Schema.ObjectId, ref: "production_line" }, // 关联产线
    lineName: { type: String, required: true }, // 产线名称
    status: { 
        type: String, 
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    }, // 工单状态
    businessType: { 
        type: String,
        enum: ['NORMAL', 'REWORK', 'SAMPLE', 'OTHER'],
        default: 'NORMAL'
    }, // 业务类型
    
    // 数量信息
    planQuantity: { type: Number, required: true }, // 计划数量
    inputQuantity: { type: Number, default: 0 }, // 投入数量
    outputQuantity: { type: Number, default: 0 }, // 产出数量
    
    // 时间信息
    planStartTime: { type: Date, required: true }, // 计划开始生产时间
    planEndTime: { type: Date, required: true }, // 计划结束生产时间
    actualStartTime: { type: Date }, // 实际开始生产时间
    actualEndTime: { type: Date }, // 实际结束生产时间
    
    // 基础字段
    remark: { type: String }, // 备注
    createBy: { type: String },
    updateBy: { type: String },
    createAt: { type: Date, default: Date.now },
    updateAt: { type: Date, default: Date.now }
});

// 添加索引
productionPlanWorkOrderSchema.index({ workOrderNo: 1 }, { unique: true });
productionPlanWorkOrderSchema.index({ saleOrderNo: 1 });
productionPlanWorkOrderSchema.index({ productionOrderNo: 1 });
productionPlanWorkOrderSchema.index({ status: 1 });
productionPlanWorkOrderSchema.index({ createAt: -1 });

module.exports = mongoose.model("production_plan_work_order", productionPlanWorkOrderSchema); 