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
// 单字段索引
inspectionLastDataSchema.index({ scanCode: 1 });
inspectionLastDataSchema.index({ machineId: 1 });
inspectionLastDataSchema.index({ createTime: -1 });
inspectionLastDataSchema.index({ processId: 1 });
inspectionLastDataSchema.index({ updateTime: -1 }); // 用于时间范围查询

// 复合索引：优化常见查询组合
// 扫描码 + 更新时间（用于扫描码查询时按时间排序）
inspectionLastDataSchema.index({ scanCode: 1, updateTime: -1 });
// 设备 + 更新时间（用于设备筛选时按时间排序）
inspectionLastDataSchema.index({ machineId: 1, updateTime: -1 });
// 工序 + 更新时间（用于工序筛选时按时间排序）
inspectionLastDataSchema.index({ processId: 1, updateTime: -1 });
// 更新时间（用于时间范围查询和排序）
inspectionLastDataSchema.index({ updateTime: -1, _id: -1 });

module.exports = mongoose.model('InspectionLastData', inspectionLastDataSchema);
