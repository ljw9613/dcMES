const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const equipmentInformationSchema = new Schema({
    // 设备名称
    equipmentName: {
        type: String,
        required: true
    },
    // 设备IP地址
    equipmentIp: {
        type: String,
        required: true
    },
    // 设备编码
    equipmentCode: {
        type: String,
        unique: true
    },
    // 设备类型
    equipmentType: {
        type: String,
        required: true
    },
    // 采集方式
    collectionMethod: {
        type: String,
        enum: ['OPC', 'ModbusTCP', 'TCP/IP', '其他'],
        default: 'OPC'
    },
    // 厂区名称
    factoryName: {
        type: String,
        required: true
    },
    // 产线名称
    productionLineName: {
        type: String,
        required: true
    },
    // 设备状态
    status: {
        type: String,
        enum: ['运行中', '停机', '故障', '离线'],
        default: '离线'
    },
    // 备注
    remarks: {
        type: String
    }
}, {
    // 自动添加创建时间和更新时间字段
    timestamps: {
        createdAt: 'createTime',
        updatedAt: 'updateTime'
    }
});

module.exports = mongoose.model('equipmentInformation', equipmentInformationSchema);
