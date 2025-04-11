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
                    <el-button type="text" size="small" @click="handleReplaceComponent(scope.row)">替换</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 添加物料替换弹窗 -->
        <el-dialog
            title="物料替换"
            :visible.sync="replaceDialogVisible"
            width="600px"
            :close-on-click-modal="false"
        >
            <div v-if="replaceSelectedNode">
                <div class="replace-info">
                    <el-alert
                        title="请注意：替换物料前必须创建部件替换的维修记录"
                        type="warning"
                        :closable="false"
                        show-icon
                    >
                    </el-alert>

                    <div class="material-info-box">
                        <h4>当前工序：{{ replaceSelectedNode.processName }}</h4>
                        <div class="material-list">
                            <el-radio-group v-model="replaceSelectedMaterial">
                                <div
                                    v-for="(material, index) in replaceMaterials"
                                    :key="index"
                                    class="material-item"
                                >
                                    <el-radio :label="material.nodeId">
                                        <div class="material-detail">
                                            <span>{{ material.materialCode }} - {{ material.materialName }}</span>
                                            <span>规格：{{ material.materialSpec }}</span>
                                            <span>条码：{{ material.barcode || "未绑定" }}</span>
                                        </div>
                                    </el-radio>
                                </div>
                            </el-radio-group>
                        </div>
                    </div>

                    <el-form :model="replaceForm" label-width="100px" class="replace-form">
                        <el-form-item label="新物料条码">
                            <el-input
                                v-model="replaceForm.newBarcode"
                                placeholder="请扫描或输入新的物料条码"
                                @keyup.enter.native="validateReplaceBarcode"
                            ></el-input>
                        </el-form-item>
                        <el-form-item v-if="replaceForm.validationMessage">
                            <el-tag :type="replaceForm.validationStatus ? 'success' : 'danger'">
                                {{ replaceForm.validationMessage }}
                            </el-tag>
                        </el-form-item>
                    </el-form>
                </div>
            </div>
            <div slot="footer" class="dialog-footer">
                <el-button @click="replaceDialogVisible = false">取 消</el-button>
                <el-button
                    type="primary"
                    @click="confirmReplaceComponent"
                    :disabled="!replaceForm.validationStatus || replaceLoading"
                    :loading="replaceLoading"
                >
                    确认替换
                </el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { unbindComponents } from '@/api/materialProcessFlowService';
import { getData, addData, updateData, removeData } from "@/api/data";
import { replaceComponent } from '@/api/materialProcessFlowService';

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
                newBarcode: "",
                validationStatus: false,
                validationMessage: "",
            },
            replaceSelectedNode: null,
            replaceSelectedMaterial: null,
            replaceMaterials: [],
            replaceLoading: false
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
        handleReplaceComponent(row) {
            this.replaceSelectedNode = row;
            this.replaceMaterials = row.children.filter(
                (item) => item.nodeType === "MATERIAL"
            );

            if (this.replaceMaterials.length > 0) {
                this.replaceSelectedMaterial = this.replaceMaterials[0].nodeId;
            } else {
                this.$message.warning('该工序下没有可替换的物料');
                return;
            }

            this.replaceForm = {
                newBarcode: "",
                validationStatus: false,
                validationMessage: "",
            };

            this.replaceDialogVisible = true;
        },
        async validateReplaceBarcode() {
            if (!this.replaceForm.newBarcode) {
                this.replaceForm.validationStatus = false;
                this.replaceForm.validationMessage = "请输入新物料条码";
                return;
            }

            try {
                // 找到当前选中的物料节点
                const materialNode = this.replaceMaterials.find(
                    (item) => item.nodeId === this.replaceSelectedMaterial
                );

                if (!materialNode) {
                    this.replaceForm.validationStatus = false;
                    this.replaceForm.validationMessage = "未选择要替换的物料";
                    return;
                }

                // 检查旧条码与新条码是否相同
                if (materialNode.barcode === this.replaceForm.newBarcode) {
                    this.replaceForm.validationStatus = false;
                    this.replaceForm.validationMessage = "新条码与原条码相同";
                    return;
                }

                // 查询是否存在对应的维修记录
                const repairRecords = await getData("product_repair", {
                    query: {
                        barcode: this.mainBarcode,
                        status: "PENDING_REVIEW",
                    },
                });

                if (repairRecords.data.length === 0) {
                    this.replaceForm.validationStatus = false;
                    this.replaceForm.validationMessage = "请先创建部件替换的维修记录";
                    return;
                }

                // 验证通过
                this.replaceForm.validationStatus = true;
                this.replaceForm.validationMessage = "条码验证通过";
            } catch (error) {
                console.error("条码验证失败:", error);
                this.replaceForm.validationStatus = false;
                this.replaceForm.validationMessage = "条码验证失败: " + error.message;
            }
        },
        async confirmReplaceComponent() {
            if (!this.replaceForm.validationStatus) {
                return;
            }

            try {
                this.replaceLoading = true;

                // 找到当前选中的物料节点
                const materialNode = this.replaceMaterials.find(
                    (item) => item.nodeId === this.replaceSelectedMaterial
                );

                if (!materialNode) {
                    this.$message.error("未选择要替换的物料");
                    return;
                }

                // 调用API执行替换操作
                const result = await replaceComponent({
                    mainBarcode: this.mainBarcode,
                    processNodeId: this.replaceSelectedNode.nodeId,
                    materialNodeId: materialNode.nodeId,
                    originalBarcode: materialNode.barcode,
                    newBarcode: this.replaceForm.newBarcode,
                    userId: this.$store.state.user.id || "system",
                });

                if (result.success) {
                    this.$message.success("物料替换成功");
                    this.replaceDialogVisible = false;
                    this.$emit('replace-success');
                } else {
                    this.$message.error(result.message || "替换失败");
                }
            } catch (error) {
                console.error("物料替换失败:", error);
                this.$message.error("物料替换失败: " + error.message);
            } finally {
                this.replaceLoading = false;
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

/* 添加物料替换对话框的样式 */
.material-info-box {
    margin-top: 20px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 15px;
    background-color: #f8f9fa;

    h4 {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 16px;
        color: #303133;
    }

    .material-list {
        margin-top: 15px;
    }

    .material-item {
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px dashed #ebeef5;

        &:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }

        .material-detail {
            display: flex;
            flex-direction: column;
            padding-left: 5px;
            line-height: 1.6;
            font-size: 14px;
        }
    }
}

.replace-info {
    .el-alert {
        margin-bottom: 20px;
    }
}
</style>