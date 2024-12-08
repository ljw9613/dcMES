<template>
    <el-dialog :title="dialogTitle" :visible.sync="visible" width="60%" @close="handleClose">
        <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small">
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="产线编码" prop="lineCode">
                        <el-input v-model="form.lineCode" placeholder="请输入产线编码" 
                            :disabled="dialogStatus === 'edit'"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="产线名称" prop="lineName">
                        <el-input v-model="form.lineName" placeholder="请输入产线名称"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="产线类型" prop="lineType">
                        <el-select v-model="form.lineType" placeholder="请选择产线类型" style="width: 100%">
                            <el-option label="组装线" value="ASSEMBLY" />
                            <el-option label="SMT线" value="SMT" />
                            <el-option label="测试线" value="TESTING" />
                            <el-option label="包装线" value="PACKAGING" />
                            <el-option label="其他" value="OTHER" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="产线状态" prop="status">
                        <el-select v-model="form.status" placeholder="请选择产线状态" style="width: 100%">
                            <el-option label="运行中" value="RUNNING" />
                            <el-option label="已停止" value="STOPPED" />
                            <el-option label="维护中" value="MAINTENANCE" />
                            <el-option label="未启用" value="INACTIVE" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="标准产能" prop="capacity">
                        <el-input-number v-model="form.capacity" :min="0" controls-position="right"
                            style="width: 100%" placeholder="件/小时"></el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="节拍时间" prop="cycleTime">
                        <el-input-number v-model="form.cycleTime" :min="0" controls-position="right"
                            style="width: 100%" placeholder="秒"></el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="标准人数" prop="workers">
                        <el-input-number v-model="form.workers" :min="0" controls-position="right"
                            style="width: 100%" placeholder="人"></el-input-number>
                    </el-form-item>
                </el-col>
            </el-row> -->

            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="所属车间" prop="workshop">
                        <el-input v-model="form.workshop" placeholder="请输入所属车间"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="区域" prop="area">
                        <el-input v-model="form.area" placeholder="请输入区域"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="具体位置" prop="location">
                        <el-input v-model="form.location" placeholder="请输入具体位置"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="上次维护时间" prop="lastMaintenance">
                        <el-date-picker v-model="form.lastMaintenance" type="datetime" 
                            placeholder="选择上次维护时间" style="width: 100%">
                        </el-date-picker>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="下次维护时间" prop="nextMaintenance">
                        <el-date-picker v-model="form.nextMaintenance" type="datetime" 
                            placeholder="选择下次维护时间" style="width: 100%">
                        </el-date-picker>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="维护周期(天)" prop="maintenanceCycle">
                <el-input-number v-model="form.maintenanceCycle" :min="0" controls-position="right"
                    style="width: 200px"></el-input-number>
            </el-form-item> -->

            <el-form-item label="备注" prop="remark">
                <el-input type="textarea" v-model="form.remark" placeholder="请输入备注信息"></el-input>
            </el-form-item>
        </el-form>

        <div slot="footer" class="dialog-footer">
            <el-button @click="handleClose">取 消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确 定</el-button>
        </div>
    </el-dialog>
</template>

<script>
export default {
    name: 'EditDialog',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        dialogStatus: {
            type: String,
            default: 'create'
        },
        rowData: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            form: {
                lineCode: '',
                lineName: '',
                lineType: 'ASSEMBLY',
                status: 'INACTIVE',
                capacity: 0,
                cycleTime: 0,
                workers: 0,
                workshop: '',
                area: '',
                location: '',
                lastMaintenance: '',
                nextMaintenance: '',
                maintenanceCycle: 30,
                remark: ''
            },
            rules: {
                lineCode: [{ required: true, message: '请输入产线编码', trigger: 'blur' }],
                lineName: [{ required: true, message: '请输入产线名称', trigger: 'blur' }],
                lineType: [{ required: true, message: '请选择产线类型', trigger: 'change' }],
                status: [{ required: true, message: '请选择产线状态', trigger: 'change' }],
                    // capacity: [{  message: '请输入标准产能', trigger: 'blur' }],
                    // cycleTime: [{  message: '请输入节拍时间', trigger: 'blur' }],
                    // workers: [{  message: '请输入标准人数', trigger: 'blur' }],
                workshop: [{ required: true, message: '请输入所属车间', trigger: 'blur' }],
                area: [{  message: '请输入区域', trigger: 'blur' }]
            },
            submitLoading: false
        }
    },
    computed: {
        dialogTitle() {
            return this.dialogStatus === 'create' ? '新增生产产线' : '编辑生产产线'
        }
    },
    watch: {
        visible(val) {
            if (val) {
                this.initFormData()
            }
        },
        rowData: {
            handler(val) {
                if (val && this.visible) {
                    this.initFormData()
                }
            },
            deep: true
        }
    },
    methods: {
        initFormData() {
            if (this.dialogStatus === 'edit') {
                this.form = { ...this.rowData }
            } else {
                this.form = {
                    lineCode: '',
                    lineName: '',
                    lineType: 'ASSEMBLY',
                    status: 'INACTIVE',
                    capacity: 0,
                    cycleTime: 0,
                    workers: 0,
                    workshop: '',
                    area: '',
                    location: '',
                    lastMaintenance: '',
                    nextMaintenance: '',
                    maintenanceCycle: 30,
                    remark: ''
                }
            }
        },
        handleClose() {
            this.$emit('update:visible', false)
            this.$refs.form && this.$refs.form.resetFields()
        },
        handleSubmit() {
            this.$refs.form.validate(async valid => {
                if (valid) {
                    this.submitLoading = true
                    try {
                        const formData = { ...this.form }
                        this.$emit('submit', formData)
                        this.handleClose()
                    } catch (error) {
                        console.error('提交失败:', error)
                        this.$message.error('提交失败')
                    } finally {
                        this.submitLoading = false
                    }
                }
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.el-select {
    width: 100%;
}
.el-date-picker {
    width: 100%;
}
</style> 