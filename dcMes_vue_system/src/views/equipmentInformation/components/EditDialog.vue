<template>
    <el-dialog :title="dialogTitle" :visible="dialogVisible" width="60%" @close="handleClose"
        @update:visible="$emit('update:visible', $event)">
        <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small">
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="设备名称" prop="machineName">
                        <el-input v-model="form.machineName" placeholder="请输入设备名称"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="设备编号" prop="machineCode">
                        <el-input v-model="form.machineCode" placeholder="请输入设备编号"
                            :disabled="dialogStatus === 'edit'"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="设备IP" prop="machineIp">
                        <el-input v-model="form.machineIp" placeholder="请输入设备IP"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="负责人" prop="principal">
                        <el-input v-model="form.principal" placeholder="请输入负责人"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="备注" prop="comment">
                <el-input type="textarea" v-model="form.comment" placeholder="请输入备注信息"></el-input>
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
            dialogVisible: this.visible,
            form: {
                machineName: '',
                machineCode: '',
                machineIp: '',
                principal: '',
                comment: ''
            },
            rules: {
                machineName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
                machineCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
                machineIp: [{ required: true, message: '请输入设备IP', trigger: 'blur' }],
                principal: [{ required: true, message: '请输入负责人', trigger: 'blur' }]
            },
            submitLoading: false
        }
    },
    computed: {
        dialogTitle() {
            return this.dialogStatus === 'create' ? '新增设备信息' : '编辑设备信息'
        }
    },
    watch: {
        visible(val) {
            this.dialogVisible = val
            if (val) {
                this.initFormData()
            }
        },
        rowData: {
            handler(val) {
                if (val && this.dialogVisible) {
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
                    machineName: '',
                    machineCode: '',
                    machineIp: '',
                    principal: '',
                    comment: ''
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
