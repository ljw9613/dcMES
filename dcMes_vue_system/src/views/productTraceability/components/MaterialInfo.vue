<template>
    <div class="material-info-container">
        <!-- 表格标题区 -->
        <div class="table-header">
            <i class="el-icon-box"></i>
            <span>工艺物料清单</span>
        </div>

        <!-- 表格区域 -->
        <el-table :data="processStepData" border class="material-table" :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: 'bold',
            fontSize: '14px',
            textAlign: 'center',
            height: '50px'
        }" :cell-style="{ textAlign: 'center' }">
            <el-table-column label="工序" width="300">
                <template slot-scope="scope">
                    <div class="process-info">
                        <el-tag size="medium" :type="getProcessStatusType(scope.row.status)">
                            {{ scope.row.processName }}
                            <el-tag size="mini" type="info">{{ scope.row.processCode }}</el-tag>
                        </el-tag>
                    </div>
                </template>
            </el-table-column>

            <el-table-column label="关联物料">
                <template slot-scope="scope">
                    <el-table v-if="scope.row.children && scope.row.children.length"
                        :data="scope.row.children.filter(item => item.nodeType === 'MATERIAL')" border
                        class="inner-table">
                        <el-table-column label="物料编码" prop="materialCode" min-width="120">
                        </el-table-column>
                        <el-table-column label="物料名称" prop="materialName" min-width="150">
                        </el-table-column>
                        <el-table-column label="规格型号" prop="materialSpec" min-width="120">
                        </el-table-column>
                        <el-table-column label="数量" width="80">
                            <template slot-scope="innerScope">
                                {{ innerScope.row.materialQuantity }} {{ innerScope.row.materialUnit }}
                            </template>
                        </el-table-column>
                        <el-table-column label="状态" width="100">
                            <template slot-scope="innerScope">
                                <el-tag :type="getProcessStatusType(innerScope.row.status)" size="small">
                                    {{ getProcessStatusText(innerScope.row.status) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="条码" min-width="150">
                            <template slot-scope="innerScope">
                                <span v-if="innerScope.row.barcode">{{ innerScope.row.barcode }}</span>
                                <span v-else class="no-barcode">-</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="类型" width="100">
                            <template slot-scope="innerScope">
                                <el-tag v-if="innerScope.row.isComponent" type="warning" size="mini">组件</el-tag>
                                <el-tag v-if="innerScope.row.isKeyMaterial" type="danger" size="mini">关键</el-tag>
                                <span v-if="!innerScope.row.isComponent && !innerScope.row.isKeyMaterial">-</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="120" fixed="right">
                            <template slot-scope="scope">
                                <el-button type="text" size="small" @click="handleUnbind(scope.row)">解绑</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <div v-else class="no-material">暂无关联物料</div>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
import { unbindComponents } from '@/api/materialProcessFlowService';

export default {
    name: 'MaterialInfo',
    props: {
        flowChartData: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            unbindDialogVisible: false,
            unbindForm: {
                processNodeId: '',
                reason: '',
                materialIds: []
            }
        }
    },
    computed: {
        processStepData() {
            return this.flowChartData[0] && this.flowChartData[0].children
                ? this.flowChartData[0].children.filter(item => item.nodeType === 'PROCESS_STEP')
                : [];
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
        async handleUnbind(row) {
            try {
                // TODO 国内查询维修记录
                // let barcodeRepair = await getData('product_repair', {
                //     query: {
                //         barcode: this.dataForm.barcode,
                //         status: 'PENDING_REVIEW'
                //     }
                // });

                // if (barcodeRepair.data.length === 0) {
                //     this.$message.warning('请先创建维修记录，再进行解绑操作');
                //     return;
                // }

                await this.$confirm('确认要解绑该工序下的物料吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });

                const { value: reason } = await this.$prompt('请输入解绑原因', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    inputValidator: (value) => {
                        if (!value) {
                            return '解绑原因不能为空';
                        }
                        return true;
                    }
                });

                const unbindData = {
                    processNodeId: row.nodeId,
                    reason: reason,
                    materialIds: row.children
                        .filter(item => item.nodeType === 'MATERIAL' && item.barcode)
                        .map(item => item.nodeId)
                };

                const result = await unbindComponents(unbindData);

                if (result.code === 200) {
                    this.$message.success('解绑成功');
                    this.$emit('unbind-success');
                } else {
                    this.$message.error(result.message || '解绑失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('解绑失败:', error);
                    this.$message.error('解绑失败: ' + (error.message || error));
                }
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.material-info-container {
    padding: 20px;
    background: #fff;
    border-radius: 8px;

    .table-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding: 0 10px;

        i {
            font-size: 20px;
            color: #409EFF;
            margin-right: 10px;
        }

        span {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
        }
    }

    .material-table {
        margin-bottom: 20px;

        .process-info {
            display: flex;
            align-items: center;
            justify-content: center;

            .el-tag {
                margin: 0 4px;
            }
        }

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

        .no-material {
            color: #909399;
            padding: 20px;
            text-align: center;
            font-size: 14px;
        }
    }

    .no-barcode {
        color: #909399;
    }
}
</style>