import {filed} from "./InspectionData";

const mongoose = require('mongoose');

export const inspectionLastData = new mongoose.Schema(filed, {
    timestamps: {createdAt: 'createTime', updatedAt: 'updateTime'},
    collection: 'inspection_last_data', // 指定集合名称
});

export const InspectionLastData = mongoose.model('InspectionLastData', inspectionLastData);
