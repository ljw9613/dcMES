<template>
    <el-dialog title="生产工序设备确认" append-to-body :visible.sync="dialogVisible" width="50%" @close="handleClose">
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
            <el-table-column prop="machineId" label="设备信息" width="200">
                <template slot-scope="scope">
                    <span :class="{ 'error-row': !scope.row.machineId }">
                        <template v-if="scope.row.machineId">
                            {{ scope.row.machineId.machineName }}
                            <el-tag> ({{ scope.row.machineId.machineIp }}, {{ scope.row.machineId.machineCode
                                }})</el-tag>
                        </template>
                        <template v-else>
                            未绑定设备
                        </template>
                    </span>
                </template>
            </el-table-column>
            <el-table-column prop="machineId.status" label="在线状态">
                <template slot-scope="scope">
                    <span :class="{ 'error-row': !scope.row.machineId }">
                        <template v-if="scope.row.machineId">
                            <el-tag :type="scope.row.machineId.status ? 'success' : 'danger'">
                                {{ scope.row.machineId.status ? '在线' : '离线' }}
                            </el-tag>
                        </template>
                        <template v-else>
                            未绑定设备
                        </template>
                    </span>
                </template>
            </el-table-column>
        </el-table>
        <span slot="footer" class="dialog-footer">
            <el-button @click="handleClose">取 消</el-button>
            <el-button type="primary" @click="confirmWork">一键替换</el-button>
            <el-button type="warning" @click="refreshMachineStatus">设备在线刷新</el-button>
        </span>
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
                data = data.filter(item => (item.machineId && item.machineId.lineId) === this.lineId);
            }
            
            if (this.filterHasMachine) {
                data = data.filter(item => item.machineId);
            }
            
            return data;
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
            let machineIds = this.filteredTableData.map(item => item.machineId && item.machineId._id)

            if (!machineIds.length) {
                this.$message.warning('当前无可刷新设备')
                return
            }

            refreshMachine({ machineIds: machineIds }).then(res => {
                console.log(res)
                this.$message.success('设备在线状态刷新成功')
            })
        },
        async confirmWork() {
            try {
                //当工序有重复设备时，提醒报错让他重新编辑工艺
                let machineIds = this.filteredTableData.map(item => item.machineId && item.machineId._id)
                if (machineIds.length !== new Set(machineIds).size) {
                    this.$message.error('工序有重复设备，请重新编辑工艺')
                    return
                }

                for (let index = 0; index < this.filteredTableData.length; index++) {
                    const element = this.filteredTableData[index];
                    console.log(element)
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

                }

                this.$message.success('生产设备对应当前生产工序已替换')
            } catch (error) {
                this.$message.error('启动生产任务失败')
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.error-row {
    color: #F56C6C;
}
.filter-container {
    margin-bottom: 15px;
    .el-checkbox {
        margin-right: 20px;
    }
}
</style>