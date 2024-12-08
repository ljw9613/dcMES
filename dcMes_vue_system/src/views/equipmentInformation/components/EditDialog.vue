<template>
    <el-dialog :title="dialogTitle" :visible="dialogVisible" width="60%" @close="handleClose"
        @update:visible="$emit('update:visible', $event)">
        <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small">
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="设备名称" prop="equipmentName">
                        <el-input v-model="form.equipmentName" placeholder="请输入设备名称"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="设备编码" prop="equipmentCode">
                        <el-input v-model="form.equipmentCode" placeholder="请输入设备编码"
                            :disabled="dialogStatus === 'edit'"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="设备IP" prop="equipmentIp">
                        <el-input v-model="form.equipmentIp" placeholder="请输入设备IP"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="设备类型" prop="equipmentType">
                        <el-select v-model="form.equipmentType" placeholder="请选择设备类型" style="width: 100%">
                            <el-option label="检测设备" value="检测设备" />
                            <el-option label="打印设备" value="打印设备" />
                            <el-option label="一体机" value="一体机" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="采集方式" prop="collectionMethod">
                        <el-select v-model="form.collectionMethod" placeholder="请选择采集方式" style="width: 100%">
                            <el-option label="OPC" value="OPC" />
                            <el-option label="ModbusTCP" value="ModbusTCP" />
                            <el-option label="TCP/IP" value="TCP/IP" />
                            <el-option label="其他" value="其他" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="设备状态" prop="status">
                        <el-select v-model="form.status" placeholder="请选择设备状态" style="width: 100%">
                            <el-option label="运行中" value="运行中" />
                            <el-option label="停机" value="停机" />
                            <el-option label="故障" value="故障" />
                            <el-option label="离线" value="离线" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="厂区名称" prop="factoryName">
                        <el-input v-model="form.factoryName" placeholder="请输入厂区名称"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="产线名称" prop="productionLineName">
                        <el-input v-model="form.productionLineName" placeholder="请输入产线名称"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="备注" prop="remarks">
                <el-input type="textarea" v-model="form.remarks" placeholder="请输入备注信息"></el-input>
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
                equipmentName: '',
                equipmentCode: '',
                equipmentIp: '',
                equipmentType: '检测设备',
                collectionMethod: 'OPC',
                status: '离线',
                factoryName: '',
                productionLineName: '',
                remarks: ''
            },
            rules: {
                equipmentName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
                equipmentCode: [{ required: true, message: '请输入设备编码', trigger: 'blur' }],
                equipmentIp: [{ required: true, message: '请输入设备IP', trigger: 'blur' }],
                equipmentType: [{ required: true, message: '请输入设备类型', trigger: 'blur' }],
                collectionMethod: [{ required: true, message: '请选择采集方式', trigger: 'change' }],
                status: [{ required: true, message: '请选择设备状态', trigger: 'change' }],
                factoryName: [{ required: true, message: '请输入厂区名称', trigger: 'blur' }],
                productionLineName: [{ required: true, message: '请输入产线名称', trigger: 'blur' }]
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
                    equipmentName: '',
                    equipmentCode: '',
                    equipmentIp: '',
                    equipmentType: '检测设备',
                    collectionMethod: 'OPC',
                    status: '离线',
                    factoryName: '',
                    productionLineName: '',
                    remarks: ''
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
