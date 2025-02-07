<template>
    <div class="logistics-detail">
        <!-- 基本物流信息 -->
        <el-form label-position="right" label-width="120px" class="logistics-info">
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="物流公司">{{ getLogisticsInfo('company') }}</el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="物流单号">{{ getLogisticsInfo('billNo') }}</el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="联系电话">{{ getLogisticsInfo('phone') }}</el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="发货地点">{{ getLogisticsInfo('from') }}</el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="收货地点">{{ getLogisticsInfo('to') }}</el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="物流状态">
                        <el-tag :type="getStatusType(getLogisticsInfo('status'))">
                            {{ getStatusText(getLogisticsInfo('status')) }}
                        </el-tag>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="发货时间">{{ formatDateTime(getLogisticsInfo('delTime')) }}</el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="签收时间">{{ formatDateTime(getLogisticsInfo('receiptTime')) }}</el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="预计到达">{{ formatDate(getLogisticsInfo('expectedTime')) }}</el-form-item>
                </el-col>
            </el-row>
        </el-form>

        <!-- 物流跟踪时间线 -->
        <div class="logistics-timeline">
            <el-divider content-position="left">物流跟踪记录</el-divider>
            <el-timeline>
                <el-timeline-item
                    v-for="(trace, index) in getTraceDetails()"
                    :key="index"
                    :type="getTimelineItemType(trace)"
                    :timestamp="formatDateTime(trace.FTraceTime)"
                >
                    {{ trace.FTraceDetail }}
                </el-timeline-item>
            </el-timeline>
        </div>

        <!-- 物料明细 -->
        <div class="material-detail">
            <el-divider content-position="left">物料明细</el-divider>
            <el-table :data="deliveryData.FEntity || []" border style="width: 100%">
                <el-table-column label="序号" type="index" width="50" align="center"></el-table-column>
                <el-table-column label="客户物料" min-width="120">
                    <template slot-scope="scope">
                        <el-tooltip :content="getCustMatInfo(scope.row.FCustMatID)" placement="top">
                            <span>{{ scope.row.FCustMatID && scope.row.FCustMatID.Number || '-' }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column label="物料编码" min-width="120">
                    <template slot-scope="scope">
                        <el-tooltip :content="getMaterialInfo(scope.row.FMaterialID)" placement="top">
                            <span>{{ scope.row.FMaterialID && scope.row.FMaterialID.Number || '-' }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column label="物料名称" min-width="150">
                    <template slot-scope="scope">
                        {{ scope.row.FMaterialID && scope.row.FMaterialID.Name || '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="规格型号" min-width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FMaterialID && scope.row.FMaterialID.Specification || '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="单位" width="80">
                    <template slot-scope="scope">
                        {{ scope.row.FUnitID && scope.row.FUnitID.Name || '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="应发数量" width="100">
                    <template slot-scope="scope">
                        {{ formatNumber(scope.row.FMustQty) }}
                    </template>
                </el-table-column>
                <el-table-column label="实发数量" width="100">
                    <template slot-scope="scope">
                        {{ formatNumber(scope.row.FRealQty) }}
                    </template>
                </el-table-column>
                <el-table-column label="仓库" min-width="120">
                    <template slot-scope="scope">
                        <el-tooltip :content="getStockInfo(scope.row.FStockID)" placement="top">
                            <span>{{ scope.row.FStockID && scope.row.FStockID.Name || '-' }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column label="来源单号" min-width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FSrcBillNo || '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="订单号" min-width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FSoorDerno || '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="备注" prop="FEntrynote" min-width="150"></el-table-column>
            </el-table>
        </div>

        <!-- 底部按钮 -->
        <div class="dialog-footer">
            <el-button @click="$emit('close')">关闭</el-button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LogisticsDetail',
    props: {
        deliveryData: {
            type: Object,
            required: true
        }
    },
    methods: {
        getLogisticsInfo(type) {
            const trace = this.deliveryData.FDeliNoticeTrace && this.deliveryData.FDeliNoticeTrace[0] || {}
            const infoMap = {
                company: trace.FLogComId && trace.FLogComId.Name,
                billNo: trace.FCarryBillNo,
                phone: trace.FPhoneNumber,
                from: trace.FFrom,
                to: trace.FTo,
                status: trace.FTraceStatus,
                delTime: trace.FDelTime,
                receiptTime: trace.FReceiptTime,
                expectedTime: trace.FExpectedTime
            }
            return infoMap[type] || '暂无数据'
        },

        getCustMatInfo(custMat) {
            if (!custMat) return '-'
            return `${custMat.Number} - ${custMat.Name}
物料编码: ${custMat.MaterialId && custMat.MaterialId.Number || '-'}`
        },

        getMaterialInfo(material) {
            if (!material) return '-'
            return `${material.Number} - ${material.Name}
规格: ${material.Specification || '-'}
物料组: ${material.MaterialGroup && material.MaterialGroup.Name || '-'}`
        },

        getStockInfo(stock) {
            if (!stock) return '-'
            return `${stock.Number} - ${stock.Name}
属性: ${this.getStockProperty(stock.StockProperty)}`
        },

        getStockProperty(property) {
            const propertyMap = {
                '1': '普通仓库',
                '2': '质检仓库',
                '3': '在途仓库',
                '4': '虚拟仓库',
                '5': '委外仓库'
            }
            return propertyMap[property] || '未知'
        },

        formatNumber(value) {
            if (!value && value !== 0) return '-'
            return Number(value).toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
        },

        getStatusType(status) {
            const statusMap = {
                'DELIVERING': 'warning',
                'DELIVERED': 'success',
                'RECEIVED': 'success',
                'EXCEPTION': 'danger',
                'RETURNING': 'info',
                'RETURNED': 'info'
            }
            return statusMap[status] || 'info'
        },

        getStatusText(status) {
            const statusMap = {
                'DELIVERING': '运输中',
                'DELIVERED': '已送达',
                'RECEIVED': '已签收',
                'EXCEPTION': '异常',
                'RETURNING': '退回中',
                'RETURNED': '已退回'
            }
            return statusMap[status] || '未知状态'
        },

        getTimelineItemType(trace) {
            if (!trace.FTraceDetail) return 'primary'
            if (trace.FTraceDetail.includes('签收')) return 'success'
            if (trace.FTraceDetail.includes('异常')) return 'danger'
            if (trace.FTraceDetail.includes('退回')) return 'warning'
            return 'primary'
        },

        getTraceDetails() {
            const trace = this.deliveryData.FDeliNoticeTrace && this.deliveryData.FDeliNoticeTrace[0]
            if (!trace || !trace.FDeliNoticeTraceDetail) return []

            return trace.FDeliNoticeTraceDetail.sort((a, b) => {
                return new Date(b.FTraceTime) - new Date(a.FTraceTime)
            })
        },

        formatDateTime(date) {
            if (!date) return '暂无数据'
            return new Date(date).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        },

        formatDate(date) {
            if (!date) return '暂无数据'
            return new Date(date).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.logistics-detail {
    padding: 20px;

    .logistics-info {
        margin-bottom: 30px;

        .el-form-item {
            margin-bottom: 18px;
        }
    }

    .logistics-timeline {
        margin: 20px 0;
        padding: 20px;
        background-color: #f9f9f9;
        border-radius: 4px;

        .el-timeline {
            margin-top: 20px;
            padding: 20px;
        }
    }

    .material-detail {
        margin-top: 30px;

        .el-divider {
            margin: 20px 0;
        }
    }

    .dialog-footer {
        margin-top: 20px;
        text-align: right;
        border-top: 1px solid #EBEEF5;
        padding-top: 20px;
    }
}

.el-table>>>.cell {
    white-space: nowrap;
}
</style>