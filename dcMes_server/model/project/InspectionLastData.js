const mongoose = require('mongoose');
const InspectionData = require('./InspectionData');

// 最新检测数据 Schema
const inspectionLastDataSchema = new mongoose.Schema({
    ...InspectionData.schema.obj  // 继承 InspectionData 的所有字段
}, {
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' },
    collection: 'inspection_last_data'
});

// 添加索引
inspectionLastDataSchema.index({ scanCode: 1 });
inspectionLastDataSchema.index({ machineId: 1 });
inspectionLastDataSchema.index({ createTime: -1 });
inspectionLastDataSchema.index({ processId: 1 });

module.exports = mongoose.model('InspectionLastData', inspectionLastDataSchema);
