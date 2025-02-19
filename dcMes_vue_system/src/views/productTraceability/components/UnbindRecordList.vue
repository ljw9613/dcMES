<template>
    <div class="unbind-record-container">
        <el-table :data="unbindRecords" border 
            :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: 'bold',
                textAlign: 'center'
            }" 
            :cell-style="{ textAlign: 'center' }">
            <el-table-column label="解绑时间" width="160">
                <template slot-scope="scope">
                    {{ formatDate(scope.row.operateTime) }}
                </template>
            </el-table-column>
            <el-table-column label="工序信息" min-width="150">
                <template slot-scope="scope">
                    <el-tag size="medium" type="info">
                        {{ scope.row.processName }}
                        <el-tag size="mini" type="info" v-if="scope.row.processCode">
                            {{ scope.row.processCode }}
                        </el-tag>
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="解绑物料" min-width="200">
                <template slot-scope="scope">
                    <el-table v-if="scope.row.unbindMaterials && scope.row.unbindMaterials.length"
                        :data="scope.row.unbindMaterials" border size="mini" class="inner-table">
                        <el-table-column label="物料编码" prop="materialCode" min-width="120">
                        </el-table-column>
                        <el-table-column label="物料名称" prop="materialName" min-width="150">
                        </el-table-column>
                        <el-table-column label="原条码" prop="originalBarcode" min-width="150">
                        </el-table-column>
                    </el-table>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column label="解绑原因" min-width="150">
                <template slot-scope="scope">
                    <el-tooltip v-if="scope.row.reason" :content="scope.row.reason" placement="top">
                        <span>{{ scope.row.reason }}</span>
                    </el-tooltip>
                    <span v-else>-</span>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
export default {
    name: 'UnbindRecordList',
    props: {
        unbindRecords: {
            type: Array,
            default: () => []
        }
    },
    methods: {
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
.unbind-record-container {
    padding: 20px;

    .inner-table {
        margin: 0;
        background: transparent;

        &::before {
            display: none;
        }

        td {
            padding: 4px 8px;
            height: 32px;
            line-height: 24px;
            font-size: 12px;
        }
    }
}
</style> 