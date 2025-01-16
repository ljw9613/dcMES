<template>
    <div class="material-barcode-container">
        <el-table :data="materialBarcodeData" border 
            :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: 'bold',
                textAlign: 'center'
            }" 
            :cell-style="{ textAlign: 'center' }">
            <el-table-column label="条码" prop="barcode" min-width="150"></el-table-column>
            <el-table-column label="物料编码" prop="materialCode" min-width="120"></el-table-column>
            <el-table-column label="物料名称" prop="materialName" min-width="150"></el-table-column>
            <el-table-column label="规格型号" prop="materialSpec" min-width="120"></el-table-column>
            <el-table-column label="状态" width="100">
                <template slot-scope="scope">
                    <el-tag :type="getProcessStatusType(scope.row.status)">
                        {{ getProcessStatusText(scope.row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="所属工序" min-width="120">
                <template slot-scope="scope">
                    <el-tag size="medium" type="info">
                        {{ scope.row.processName }}
                        <el-tag size="mini" type="info" v-if="scope.row.processCode">
                            {{ scope.row.processCode }}
                        </el-tag>
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="扫码时间" width="160">
                <template slot-scope="scope">
                    {{ formatDate(scope.row.scanTime) }}
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
export default {
    name: 'MaterialBarcodeInfo',
    props: {
        materialBarcodeData: {
            type: Array,
            default: () => []
        }
    },
    methods: {
        getProcessStatusType(status) {
            const statusMap = {
                'PENDING': 'info',
                'IN_PROCESS': 'warning',
                'COMPLETED': 'success',
                'ABNORMAL': 'danger'
            }
            return statusMap[status] || 'info'
        },
        getProcessStatusText(status) {
            const statusMap = {
                'PENDING': '待处理',
                'IN_PROCESS': '进行中',
                'COMPLETED': '已完成',
                'ABNORMAL': '异常'
            }
            return statusMap[status] || status
        },
        formatDate(date) {
            if (!date) return '暂无数据';
            return new Date(date).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }
}
</script>

<style lang="scss" scoped>
.material-barcode-container {
    padding: 20px;

    .el-table {
        margin-bottom: 20px;
    }
}
</style> 