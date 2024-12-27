<template>
    <el-dialog :title="dialogTitle" :visible="dialogVisible" width="60%" @close="handleClose"
        @update:visible="$emit('update:visible', $event)">
        <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small">
            <!-- 基本信息 -->
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="模板名称" prop="templateName">
                        <el-input v-model="form.templateName" placeholder="请输入模板名称"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="模板编号" prop="templateCode">
                        <el-input v-model="form.templateCode" placeholder="请输入模板编号"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="模板类型" prop="templateType">
                        <el-select v-model="form.templateType" placeholder="请选择模板类型" style="width: 100%">
                            <el-option v-for="dict in dict.type.templateType" :key="dict.value" :label="dict.label"
                                :value="dict.value" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="业务类型" prop="businessType">
                        <el-select v-model="form.businessType" placeholder="请选择业务类型" style="width: 100%">
                            <el-option v-for="dict in dict.type.businessType" :key="dict.value" :label="dict.label"
                                :value="dict.value" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- 模板配置 -->
            <el-divider content-position="left">模板配置</el-divider>
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="纸张大小" prop="config.paperSize">
                        <el-select v-model="form.config.paperSize" placeholder="请选择纸张大小" style="width: 100%">
                            <el-option label="A4" value="A4" />
                            <el-option label="A5" value="A5" />
                            <el-option label="自定义" value="custom" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="打印方向" prop="config.orientation">
                        <el-select v-model="form.config.orientation" placeholder="请选择打印方向" style="width: 100%">
                            <el-option label="纵向" value="portrait" />
                            <el-option label="横向" value="landscape" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20" v-if="form.config.paperSize === 'custom'">
                <el-col :span="12">
                    <el-form-item label="宽度(mm)" prop="config.width">
                        <el-input-number v-model="form.config.width" :min="1" :max="1000" style="width: 100%">
                        </el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="高度(mm)" prop="config.height">
                        <el-input-number v-model="form.config.height" :min="1" :max="1000" style="width: 100%">
                        </el-input-number>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- 模板内容 -->
            <el-divider content-position="left">模板内容</el-divider>
            <el-form-item label="模板内容" prop="content">
                <el-input type="textarea" v-model="form.content" :rows="6" placeholder="请输入模板内容（HTML/JSON格式）">
                </el-input>
            </el-form-item>

            <!-- 其他设置 -->
            <el-divider content-position="left">其他设置</el-divider>
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="版本号" prop="version">
                        <el-input v-model="form.version" placeholder="请输入版本号"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="是否默认" prop="isDefault">
                        <el-switch v-model="form.isDefault"></el-switch>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="状态" prop="status">
                        <el-switch v-model="form.status"></el-switch>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="备注说明" prop="remark">
                <el-input type="textarea" v-model="form.remark" :rows="3" placeholder="请输入备注说明"></el-input>
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
    dicts: ['templateType', 'businessType'],
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
                templateName: '',
                templateCode: '',
                templateType: '',
                businessType: '',
                config: {
                    paperSize: 'A4',
                    orientation: 'portrait',
                    width: 210,
                    height: 297
                },
                content: '',
                version: '1.0.0',
                isDefault: false,
                status: true,
                remark: ''
            },
            rules: {
                templateName: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
                templateCode: [{ required: true, message: '请输入模板编号', trigger: 'blur' }],
                businessType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
                'config.paperSize': [{ required: true, message: '请选择纸张大小', trigger: 'change' }],
                'config.orientation': [{ required: true, message: '请选择打印方向', trigger: 'change' }],
                version: [{ required: true, message: '请输入版本号', trigger: 'blur' }]
            },
            submitLoading: false
        }
    },
    computed: {
        dialogTitle() {
            return this.dialogStatus === 'create' ? '新增打印模板' : '编辑打印模板'
        }
    },
    watch: {
        visible(val) {
            this.dialogVisible = val
            if (val) {
                this.initFormData()
            }
        }
    },
    methods: {
        initFormData() {
            if (this.dialogStatus === 'edit') {
                this.form = { ...this.rowData }
                // 确保config对象存在
                this.form.config = this.form.config || {
                    paperSize: 'A4',
                    orientation: 'portrait',
                    width: 210,
                    height: 297
                }
            } else {
                this.form = {
                    templateName: '',
                    templateCode: '',
                    templateType: '',
                    businessType: '',
                    config: {
                        paperSize: 'A4',
                        orientation: 'portrait',
                        width: 210,
                        height: 297
                    },
                    content: '',
                    version: '1.0.0',
                    isDefault: false,
                    status: true,
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
.el-divider {
    margin: 24px 0;
}

.el-divider__text {
    font-size: 16px;
    font-weight: bold;
    color: #606266;
}
</style>
