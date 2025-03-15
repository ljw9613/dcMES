<template>
    <el-dialog title="生产工序设备确认" append-to-body :visible.sync="dialogVisible" width="70%" @close="handleClose">
        <div class="filter-container">
            <el-checkbox v-model="filterHasMachine">已绑定设备</el-checkbox>
            <el-checkbox v-model="filterCurrentLine">当前产线设备</el-checkbox>
        </div>
        <el-table :data="filteredTableData" style="width: 100%">
            <el-table-column v-for="item in workColumns" :key="item.prop" :prop="item.prop" :label="item.label">
                <template slot-scope="scope">
                    <span>
                        {{ scope.row[item.prop] }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column prop="machineId" label="主检验设备" width="200">
                <template slot-scope="scope">
                    <span :class="{ 'error-row': !scope.row.machineId }">
                        <template v-if="scope.row.machineId">
                            <div class="machine-item">
                                {{ scope.row.machineId.machineName }}
                                <el-tag size="mini"> ({{ scope.row.machineId.machineCode }})</el-tag>
                                <el-tag size="mini" :type="scope.row.machineId.status ? 'success' : 'danger'">
                                    {{ scope.row.machineId.status ? '在线' : '离线' }}
                                </el-tag>
                                <el-tag size="mini" type="info">
                                    {{ scope.row.machineId.lineName }}
                                </el-tag>
                            </div>
                        </template>
                        <template v-else>
                            未绑定主设备
                        </template>
                    </span>
                </template>
            </el-table-column>
            <el-table-column prop="machineIds" label="关联设备" width="300">
                <template slot-scope="scope">
                    <span :class="{ 'warning-row': !scope.row.machineIds || scope.row.machineIds.length === 0 }">
                        <template v-if="scope.row.machineIds && scope.row.machineIds.length > 0">
                            <div v-for="(machine, index) in scope.row.machineIds" :key="index" class="machine-item">
                                {{ machine.machineName }}
                                <el-tag size="mini"> ({{ machine.machineCode }})</el-tag>
                                <el-tag size="mini" :type="machine.status ? 'success' : 'danger'">
                                    {{ machine.status ? '在线' : '离线' }}
                                </el-tag>
                                <el-tag size="mini" type="info" v-if="machine.lineName">
                                    {{ machine.lineName }}
                                </el-tag>
                            </div>
                        </template>
                        <template v-else>
                            未绑定关联设备
                        </template>
                    </span>
                </template>
            </el-table-column>
        </el-table>
        <span slot="footer" class="dialog-footer">
            <el-button @click="handleClose">取 消</el-button>
            <el-button type="primary" @click="showConfirmDialog('replace')">一键替换</el-button>
            <el-button type="warning" @click="showConfirmDialog('refresh')">设备在线刷新</el-button>
        </span>

        <!-- 确认对话框 -->
        <el-dialog
            :title="confirmDialogTitle"
            :visible.sync="confirmDialogVisible"
            width="50%"
            append-to-body
            custom-class="confirm-dialog"
        >
            <div class="confirm-content">
                <template v-if="confirmType === 'replace'">
                    <div v-for="(item, index) in filteredTableData" :key="index" class="confirm-item">
                        <div class="process-info">
                            <el-tag size="small" type="primary">{{ item.processName }}</el-tag>
                            <span class="process-code">{{ item.processCode }}</span>
                        </div>
                        <div class="machine-info" v-if="item.machineId">
                            <div class="machine-card">
                                <div class="machine-header">
                                    <i class="el-icon-cpu"></i>
                                    <span>主检验设备</span>
                                </div>
                                <div class="machine-content">
                                    <div class="machine-name">{{ item.machineId.machineName }}</div>
                                    <div class="machine-detail">
                                        <el-tag size="mini" type="info">{{ item.machineId.machineCode }}</el-tag>
                                        <el-tag size="mini" :type="item.machineId.status ? 'success' : 'danger'">
                                            {{ item.machineId.status ? '在线' : '离线' }}
                                        </el-tag>
                                        <el-tag size="mini" type="warning" v-if="item.machineId.lineName">
                                            {{ item.machineId.lineName }}
                                        </el-tag>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="machine-info" v-if="item.machineIds && item.machineIds.length">
                            <div class="machine-card">
                                <div class="machine-header">
                                    <i class="el-icon-connection"></i>
                                    <span>关联设备</span>
                                </div>
                                <div class="machine-list">
                                    <div v-for="(machine, mIndex) in item.machineIds" :key="mIndex" class="machine-item">
                                        <div class="machine-name">{{ machine.machineName }}</div>
                                        <div class="machine-detail">
                                            <el-tag size="mini" type="info">{{ machine.machineCode }}</el-tag>
                                            <el-tag size="mini" :type="machine.status ? 'success' : 'danger'">
                                                {{ machine.status ? '在线' : '离线' }}
                                            </el-tag>
                                            <el-tag size="mini" type="warning" v-if="machine.lineName">
                                                {{ machine.lineName }}
                                            </el-tag>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="refresh-info">
                        <div class="refresh-header">
                            <i class="el-icon-refresh"></i>
                            <span>将刷新以下设备的在线状态</span>
                        </div>
                        <div class="machine-list">
                            <div v-for="(machine, index) in refreshMachineList" :key="index" class="machine-item">
                                <div class="machine-name">{{ machine.machineName }}</div>
                                <div class="machine-detail">
                                    <el-tag size="mini" type="info">{{ machine.machineCode }}</el-tag>
                                    <el-tag size="mini" :type="machine.status ? 'success' : 'danger'">
                                        {{ machine.status ? '在线' : '离线' }}
                                    </el-tag>
                                    <el-tag size="mini" type="warning" v-if="machine.lineName">
                                        {{ machine.lineName }}
                                    </el-tag>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="confirmDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="handleConfirm">确 定</el-button>
            </span>
        </el-dialog>
    </el-dialog>
</template>

<script>
import { refreshMachine } from "@/api/machine";
import { getData, addData, updateData, removeData } from "@/api/data";
import { query } from "quill";
export default {
    name: 'WorkDialog',
    props: {
        materialId: {
            type: String,
            default: ''
        },
        lineId: {
            type: String,
            default: ''
        },
        visible: {
            type: Boolean,
            default: false
        },
        workTableData: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            filterCurrentLine: true,
            filterHasMachine: true,
            confirmDialogVisible: false,
            confirmType: '', // 'replace' 或 'refresh'
            refreshMachineList: [],
            workColumns: [
                { prop: 'processName', label: '工序名称' },
                { prop: 'processCode', label: '工序编号' },
                { prop: 'sort', label: '工序顺序' },
            ]
        }
    },
    computed: {
        dialogVisible: {
            get() {
                return this.visible
            },
            set(value) {
                this.$emit('update:visible', value)
            }
        },
        filteredTableData() {
            let data = [...this.workTableData];

            if (this.filterCurrentLine && this.lineId) {
                data = data.filter(item => {
                    // 检查主设备是否在当前产线上
                    if (item.machineId && item.machineId.lineId === this.lineId) {
                        return true;
                    }

                    // 检查关联设备是否有在当前产线上的
                    if (item.machineIds && item.machineIds.length > 0) {
                        return item.machineIds.some(machine => machine.lineId === this.lineId);
                    }

                    return false;
                }).map(item => {
                    // 如果启用了产线筛选，则只显示当前产线的关联设备
                    if (this.filterCurrentLine && this.lineId) {
                        return {
                            ...item,
                            machineIds: item.machineIds ? item.machineIds.filter(machine => machine.lineId === this.lineId) : []
                        };
                    }
                    return item;
                });
            }

            if (this.filterHasMachine) {
                data = data.filter(item =>
                    (item.machineId) || (item.machineIds && item.machineIds.length > 0)
                );
            }

            return data;
        },
        confirmDialogTitle() {
            return this.confirmType === 'replace' ? '确认替换设备' : '确认刷新设备状态'
        }
    },
    watch: {
        visible(newVal) {
            if (newVal) {
            }
        }
    },
    methods: {
        handleClose() {
            this.dialogVisible = false
        },
        refreshMachineStatus() {
            if (!this.filteredTableData.length) {
                this.$message.warning('请先选择工序')
                return
            }

            // 收集所有设备ID
            let allMachineIds = [];
            this.filteredTableData.forEach(item => {
                // 添加主设备
                if (item.machineId) {
                    allMachineIds.push(item.machineId._id);
                }

                // 添加关联设备
                if (item.machineIds && item.machineIds.length > 0) {
                    item.machineIds.forEach(machine => {
                        allMachineIds.push(machine._id);
                    });
                }
            });

            if (!allMachineIds.length) {
                this.$message.warning('当前无可刷新设备')
                return
            }

            refreshMachine({ machineIds: allMachineIds }).then(res => {
                console.log(res)
                this.$message.success('设备在线状态刷新成功')
            })
        },
        async confirmWork() {
            try {
                // 当工序有重复设备时，提醒报错让他重新编辑工艺
                let allMachineIds = [];

                // 收集所有设备ID
                this.filteredTableData.forEach(item => {
                    if (item.machineId) {
                        allMachineIds.push(item.machineId._id);
                    }

                    if (item.machineIds && item.machineIds.length > 0) {
                        item.machineIds.forEach(machine => {
                            allMachineIds.push(machine._id);
                        });
                    }
                });

                // if (allMachineIds.length !== new Set(allMachineIds).size) {
                //     this.$message.error('工序有重复设备，请重新编辑工艺')
                //     return
                // }

                for (let index = 0; index < this.filteredTableData.length; index++) {
                    const element = this.filteredTableData[index];

                    // 更新主设备
                    if (element.machineId && element.machineId._id) {
                        await updateData('machine', {
                            query: {
                                _id: element.machineId._id
                            },
                            update: {
                                processStepId: element._id,
                                materialId: this.materialId,
                            }
                        })
                    }

                    // 更新关联设备
                    if (element.machineIds && element.machineIds.length > 0) {
                        for (const machine of element.machineIds) {
                            await updateData('machine', {
                                query: {
                                    _id: machine._id
                                },
                                update: {
                                    processStepId: element._id,
                                    materialId: this.materialId,
                                }
                            })
                        }
                    }
                }

                this.$message.success('生产设备对应当前生产工序已替换')
            } catch (error) {
                this.$message.error('启动生产任务失败')
            }
        },
        showConfirmDialog(type) {
            this.confirmType = type;
            
            if (type === 'refresh') {
                // 收集所有需要刷新的设备
                this.refreshMachineList = [];
                this.filteredTableData.forEach(item => {
                    if (item.machineId) {
                        this.refreshMachineList.push(item.machineId);
                    }
                    if (item.machineIds && item.machineIds.length > 0) {
                        this.refreshMachineList.push(...item.machineIds);
                    }
                });

                if (!this.refreshMachineList.length) {
                    this.$message.warning('当前无可刷新设备');
                    return;
                }
            }
            
            this.confirmDialogVisible = true;
        },
        handleConfirm() {
            if (this.confirmType === 'replace') {
                this.confirmWork();
            } else {
                this.refreshMachineStatus();
            }
            this.confirmDialogVisible = false;
        }
    }
}
</script>

<style lang="scss" scoped>
.error-row {
    color: #F56C6C;
}

.warning-row {
    color: #E6A23C;
}

.filter-container {
    margin-bottom: 15px;

    .el-checkbox {
        margin-right: 20px;
    }
}

.machine-item {
    margin-bottom: 5px;
}

.machine-item:not(:last-child) {
    border-bottom: 1px dashed #e8e8e8;
    padding-bottom: 5px;
}

.confirm-dialog {
    .el-dialog__header {
        padding: 20px 24px;
        border-bottom: 1px solid #EBEEF5;
    }
    
    .el-dialog__body {
        padding: 24px;
    }
    
    .el-dialog__footer {
        padding: 16px 24px;
        border-top: 1px solid #EBEEF5;
    }
}

.confirm-content {
    max-height: 500px;
    overflow-y: auto;
    padding-right: 10px;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-thumb {
        background: #E4E7ED;
        border-radius: 3px;
    }
}

.confirm-item {
    margin-bottom: 24px;
    background: #F8F9FA;
    border-radius: 8px;
    padding: 16px;

    &:last-child {
        margin-bottom: 0;
    }

    .process-info {
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;

        .process-code {
            color: #909399;
            font-size: 13px;
        }
    }
}

.machine-card {
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 12px;

    &:last-child {
        margin-bottom: 0;
    }

    .machine-header {
        padding: 12px 16px;
        border-bottom: 1px solid #EBEEF5;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #303133;
        font-weight: 500;

        i {
            font-size: 16px;
            color: #409EFF;
        }
    }

    .machine-content {
        padding: 12px 16px;
    }
}

.machine-list {
    padding: 12px 16px;
}

.machine-item {
    padding: 8px 0;
    border-bottom: 1px dashed #EBEEF5;

    &:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }

    .machine-name {
        font-size: 14px;
        color: #303133;
        margin-bottom: 4px;
    }

    .machine-detail {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
}

.refresh-info {
    .refresh-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        color: #303133;
        font-size: 14px;

        i {
            font-size: 16px;
            color: #E6A23C;
        }
    }
}
</style>