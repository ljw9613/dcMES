const mongoose = require("mongoose");

const productionLineSchema = new mongoose.Schema({
    // 基础信息
    lineCode: { type: String, required: true }, // 产线编码 (对应 line_no)
    lineName: { type: String, required: true }, // 产线名称 (对应 line_name)
    lineNum: { type: String }, // 车间线路编号 (对应 line_num)
    
    // 设备信息
    cardNum: { type: String }, // 接收器卡号/ip唯一标识 (对应 card_num)
    machineNum: { type: String }, // 接收器机号 (对应 machine_num)
    ipAddress: { type: String }, // IP地址 (对应 ip)
    
    // 状态信息
    state: { 
        type: Number, 
        enum: [0, 1],
        default: 1 
    }, // 状态 1:正常，0:作废 (对应 state)
    
    // 产线配置
    processStepIds: [{ type: mongoose.Schema.ObjectId, ref: "process_step" }], // 关联工序列表
    scanStations: [{ // 扫码工位配置
        stationCode: { type: String, }, // 工位编码
        stationName: { type: String,}, // 工位名称
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
    createBy: { type: String }, // 创建人 (对应 create_name)
    updateBy: { type: String },
    createAt: { type: Date, default: Date.now }, // 创建时间 (对应 create_time)
    updateAt: { type: Date, default: Date.now }
});

// 添加索引
productionLineSchema.index({ lineCode: 1 }, { unique: true });
productionLineSchema.index({ workshop: 1, area: 1 });
productionLineSchema.index({ status: 1 });
productionLineSchema.index({ createAt: -1 });

// 添加新的索引
productionLineSchema.index({ cardNum: 1 }, { unique: true }); // 为接收器卡号添加唯一索引

module.exports = mongoose.model("production_line", productionLineSchema); 