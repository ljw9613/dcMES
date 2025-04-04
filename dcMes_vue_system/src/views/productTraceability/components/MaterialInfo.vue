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
                    </el-table>
                    <div v-else class="no-material">暂无关联物料</div>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
                <template slot-scope="scope">
                    <el-button type="text" size="small" @click="handleUnbind(scope.row)">解绑</el-button>
                    <el-button type="text" size="small" @click="handleReplace(scope.row)">替换</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
import { unbindComponents } from '@/api/materialProcessFlowService';
import { getData, addData, updateData, removeData } from "@/api/data";
import { replaceComponents } from '@/api/materialProcessFlowService';

export default {
    name: 'MaterialInfo',
    props: {
        flowChartData: {
            type: Array,
            default: () => []
        },
        mainBarcode: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            unbindDialogVisible: false,
            unbindForm: {
                processNodeId: '',
                reason: '',
                materialIds: []
            },
            replaceDialogVisible: false,
            replaceForm: {
                processStepId: '',
                oldBarcode: '',
                newBarcode: '',
                reason: ''
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
                let barcodeRepair = await getData('product_repair', {
                    query: {
                        barcode: this.mainBarcode,
                        status: 'PENDING_REVIEW'
                    }
                });

                if (barcodeRepair.data.length === 0) {
                    this.$message.warning('请先创建维修记录，再进行解绑操作');
                    return;
                }

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

                const loading = this.$loading({
                    lock: true,
                    text: '正在解绑...',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                try {
                    const unbindData = {
                        mainBarcode: this.mainBarcode,
                        processStepId: row.processStepId,  // 修改为使用 nodeId
                        userId: this.$store.state.user.id,
                        reason: reason || '未填写解绑原因',
                        unbindSubsequent: true
                    };

                    const response = await unbindComponents(unbindData);

                    if (response.code === 200 && response.success) {
                        this.$message.success('解绑成功');
                        this.$emit('unbind-success');
                    } else {
                        throw new Error(response.message || '解绑失败');
                    }
                } finally {
                    loading.close();
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('解绑失败:', error);
                    this.$message.error('解绑失败: ' + (error.message || error));
                }
            }
        },
        async handleReplace(row) {
            try {
                // 检查是否有维修记录
                let barcodeRepair = await getData('product_repair', {
                    query: {
                        barcode: this.mainBarcode,
                        status: 'PENDING_REVIEW'
                    }
                });

                if (barcodeRepair.data.length === 0) {
                    this.$message.warning('请先创建维修记录，再进行替换操作');
                    return;
                }

                // 获取要替换的组件信息
                const components = row.children ? row.children.filter(item => item.nodeType === 'MATERIAL') : [];
                if (components.length === 0) {
                    this.$message.warning('该工序下没有可替换的物料');
                    return;
                }

                // 让用户选择要替换的组件
                const { value: selectedComponent } = await this.$confirm(
                    '请选择要替换的物料',
                    '替换物料',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        customClass: 'replace-component-dialog',
                        showInput: true,
                        inputType: 'select',
                        inputPlaceholder: '请选择物料',
                        inputValue: components[0].materialId,
                        inputOptions: components.reduce((acc, curr) => {
                            acc[curr.materialId] = `${curr.materialName} (${curr.materialCode})`;
                            return acc;
                        }, {})
                    }
                );

                if (!selectedComponent) return;

                // 提示用户输入新的条码和替换原因
                const { value: formValues } = await this.$prompt(
                    '<div class="replace-form">' +
                    '<div class="form-item"><label>新条码:</label><input id="newBarcode" class="el-input__inner" /></div>' +
                    '<div class="form-item"><label>替换原因:</label><input id="reason" class="el-input__inner" /></div>' +
                    '</div>',
                    '替换信息',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        dangerouslyUseHTMLString: true,
                        inputValidator: () => {
                            const newBarcode = document.getElementById('newBarcode').value;
                            const reason = document.getElementById('reason').value;
                            if (!newBarcode) return '新条码不能为空';
                            if (!reason) return '替换原因不能为空';
                            return true;
                        },
                        beforeClose: (action, instance, done) => {
                            if (action === 'confirm') {
                                const newBarcode = document.getElementById('newBarcode').value;
                                const reason = document.getElementById('reason').value;
                                instance.inputValue = { newBarcode, reason };
                            }
                            done();
                        }
                    }
                );

                if (!formValues) return;

                const { newBarcode, reason } = formValues;
                const selectedMaterial = components.find(item => item.materialId === selectedComponent);

                const loading = this.$loading({
                    lock: true,
                    text: '正在替换...',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                try {
                    const replaceData = {
                        mainBarcode: this.mainBarcode,
                        processStepId: row.processStepId,
                        oldBarcode: selectedMaterial.barcode,
                        newBarcode: newBarcode,
                        userId: this.$store.state.user.id,
                        reason: reason
                    };

                    const response = await replaceComponents(replaceData);

                    if (response.code === 200 && response.success) {
                        this.$message.success('替换成功');
                        this.$emit('replace-success');
                    } else {
                        throw new Error(response.message || '替换失败');
                    }
                } finally {
                    loading.close();
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('替换失败:', error);
                    this.$message.error('替换失败: ' + (error.message || error));
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

.replace-form {
    .form-item {
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        
        label {
            width: 80px;
            text-align: right;
            margin-right: 10px;
        }
        
        .el-input__inner {
            width: 100%;
        }
    }
}

.replace-component-dialog {
    .el-select {
        width: 100%;
    }
}
</style>