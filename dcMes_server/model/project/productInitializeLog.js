/*
 * @name: 产品初始化日志表
 * @content: 记录产品条码初始化操作的详细信息
 * @Author: AI Assistant
 * @Date: 2024-12-19
 */
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductInitializeLogSchema = new Schema(
  {
    // 产品条码
    barcode: {
      type: String,
      required: true,
      index: true,
    },
    
    // 物料信息
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "k3_BD_MATERIAL",
      required: true,
    },
    materialCode: {
      type: String,
      required: true,
    },
    materialName: {
      type: String,
      required: true,
    },
    materialSpec: {
      type: String,
    },
    
    // 工艺信息
    craftId: {
      type: Schema.Types.ObjectId,
      ref: "craft",
    },
    craftName: {
      type: String,
    },
    craftVersion: {
      type: String,
    },
    
    // 工单信息
    productionPlanWorkOrderId: {
      type: Schema.Types.ObjectId,
      ref: "production_plan_work_order",
    },
    workOrderNo: {
      type: String,
    },
    
    // 产线信息
    productLineId: {
      type: String,
    },
    productLineName: {
      type: String,
    },
    
    // 初始化前的状态信息
    beforeInitialize: {
      status: {
        type: String,
        enum: ["PENDING", "IN_PROCESS", "COMPLETED", "EXCEPTION"],
      },
      progress: {
        type: Number,
        default: 0,
      },
      startTime: {
        type: Date,
      },
      endTime: {
        type: Date,
      },
      totalNodes: {
        type: Number,
        default: 0,
      },
      completedNodes: {
        type: Number,
        default: 0,
      },
    },
    
    // 工单数量调整信息
    workOrderAdjustment: {
      inputQuantityAdjusted: {
        type: Boolean,
        default: false,
      },
      outputQuantityAdjusted: {
        type: Boolean,
        default: false,
      },
      inputAdjustmentAmount: {
        type: Number,
        default: 0,
      },
      outputAdjustmentAmount: {
        type: Number,
        default: 0,
      },
    },
    
    // 操作信息
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: "user_login",
      required: true,
    },
    operatorName: {
      type: String,
    },
    operateTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    
    // 操作原因
    reason: {
      type: String,
      default: "产品条码初始化",
    },
    
    // 备注信息
    remark: {
      type: String,
    },
    
    // 操作结果
    result: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
    
    // 错误信息（如果操作失败）
    errorMessage: {
      type: String,
    },
    
    // 操作类型
    operationType: {
      type: String,
      default: "INITIALIZE",
    },
    
    // IP地址
    ipAddress: {
      type: String,
    },
    
    // 用户代理
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
    collection: "product_initialize_logs", // 指定集合名称
  }
);

// 创建复合索引以提高查询性能
ProductInitializeLogSchema.index({ barcode: 1, operateTime: -1 });
ProductInitializeLogSchema.index({ operatorId: 1, operateTime: -1 });
ProductInitializeLogSchema.index({ materialCode: 1, operateTime: -1 });
ProductInitializeLogSchema.index({ productionPlanWorkOrderId: 1, operateTime: -1 });
ProductInitializeLogSchema.index({ operateTime: -1 });

// 添加虚拟字段用于关联查询
ProductInitializeLogSchema.virtual('operator', {
  ref: 'user_login',
  localField: 'operatorId',
  foreignField: '_id',
  justOne: true
});

ProductInitializeLogSchema.virtual('material', {
  ref: 'k3_BD_MATERIAL',
  localField: 'materialId',
  foreignField: '_id',
  justOne: true
});

ProductInitializeLogSchema.virtual('craft', {
  ref: 'craft',
  localField: 'craftId',
  foreignField: '_id',
  justOne: true
});

ProductInitializeLogSchema.virtual('workOrder', {
  ref: 'production_plan_work_order',
  localField: 'productionPlanWorkOrderId',
  foreignField: '_id',
  justOne: true
});

// 确保虚拟字段在JSON序列化时包含
ProductInitializeLogSchema.set('toJSON', { virtuals: true });
ProductInitializeLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("ProductInitializeLog", ProductInitializeLogSchema); 