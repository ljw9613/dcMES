const mongoose = require("mongoose");

const productionLineSchema = new mongoose.Schema({
    // 基础信息
    lineCode: { type: String, required: true, unique: true }, // 产线编码
    lineName: { type: String, required: true }, // 产线名称
    lineType: { 
        type: String, 
        // enum: ['ASSEMBLY', 'SMT', 'TESTING', 'PACKAGING', 'OTHER'],
        default: 'ASSEMBLY'
    }, // 产线类型：组装线/SMT线/测试线/包装线/其他
    
    // 产线配置
    processStepIds: [{ type: mongoose.Schema.ObjectId, ref: "process_step" }], // 关联工序列表
    scanStations: [{ // 扫码工位配置
        stationCode: { type: String, required: true }, // 工位编码
        stationName: { type: String, required: true }, // 工位名称
        processStepId: { type: mongoose.Schema.ObjectId, ref: "process_step" }, // 关联工序
        ipAddress: { type: String }, // 工位IP地址
        deviceInfo: { // 设备信息
            deviceId: String,
            deviceType: String,
            manufacturer: String
        },
        status: { 
            type: String, 
            enum: ['ACTIVE', 'INACTIVE'],
            default: 'ACTIVE'
        }, // 工位状态
        remark: String // 工位备注
    }],
    
    // 产线参数
    capacity: { type: Number }, // 产线产能（件/小时）
    cycleTime: { type: Number }, // 节拍时间（秒）
    workers: { type: Number }, // 标准人数
    
    // 产线状态
    status: { 
        type: String, 
        enum: ['RUNNING', 'STOPPED', 'MAINTENANCE', 'INACTIVE'],
        default: 'RUNNING'
    }, // 产线状态
    
    // 位置信息
    workshop: { type: String }, // 所属车间
    area: { type: String }, // 区域
    location: { type: String }, // 具体位置
    
    // 维护信息
    lastMaintenance: { type: Date }, // 上次维护时间
    nextMaintenance: { type: Date }, // 下次维护时间
    maintenanceCycle: { type: Number }, // 维护周期(天)
    
    // 基础字段
    remark: { type: String }, // 备注
    createBy: { type: String },
    updateBy: { type: String },
    createAt: { type: Date, default: Date.now },
    updateAt: { type: Date, default: Date.now }
});

// 添加索引
productionLineSchema.index({ lineCode: 1 }, { unique: true });
productionLineSchema.index({ workshop: 1, area: 1 });
productionLineSchema.index({ status: 1 });
productionLineSchema.index({ createAt: -1 });

module.exports = mongoose.model("production_line", productionLineSchema); 