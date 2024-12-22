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
                        <el-input v-model="form.machineCode" placeholder="请输入设备编号"></el-input>
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

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="产线名称" prop="lineName">
                        <zr-select v-model="form.lineId" collection="production_line"
                            :search-fields="['lineName', 'lineCode']" label-key="lineName" sub-key="lineCode"
                            :multiple="false" placeholder="请输入产线名称搜索" @select="handleSearchLineChange" clearable
                            style="width: 100%">
                            <template #option="{ item }">
                                <div class="select-option">
                                    <div class="option-main">
                                        <span class="option-label">{{ item.lineName }} - {{ item.lineCode }}</span>
                                        <el-tag size="mini" type="info" class="option-tag">
                                            线路编号: {{ item.lineNum }}
                                        </el-tag>
                                    </div>
                                </div>
                            </template>
                        </zr-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="设备类型" prop="machineType">
                        <el-select v-model="form.machineType" placeholder="请选择设备类型" clearable style="width: 100%"
                            :popper-append-to-body="true">
                            <el-option v-for="dict in dict.type.machine_type" :key="dict.value" :label="dict.label"
                                :value="dict.value" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="备注" prop="comment">
                <el-input type="textarea" v-model="form.comment" placeholder="请输入备注信息"></el-input>
            </el-form-item>

            <!-- 分割线 -->
            <el-row :gutter="20">
                <el-col :span="24">
                    <hr style="border-top: 1px solid #dcdfe6; width: 100%; margin: 20px 0;" />
                </el-col>
            </el-row>

            <!-- 当前生产工序 -->
            <el-row :gutter="20">
                <el-col :span="24">
                    <div class="tip-box">
                        <p>请勿随意修改当前设备的当前生产工序</p>
                    </div>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">

                    <el-form-item label="产品型号">
                        <zr-select v-model="form.materialId" collection="k3_BD_MATERIAL"
                            :search-fields="['FNumber', 'FName']" label-key="FName" sub-key="FMATERIALID"
                            :multiple="false" placeholder="请输入物料编码/名称搜索" @select="handleProductChange">
                            <template #option="{ item }">
                                <div class="item-option">
                                    <div class="item-info">
                                        <span>{{ item.FNumber }} - {{ item.FName }}</span>
                                        <el-tag size="mini" type="info">{{ item.FMATERIALID }} -{{ item.FUseOrgId
                                            }}</el-tag>
                                    </div>
                                </div>
                            </template>
                        </zr-select>
                    </el-form-item>

                    <el-form-item label="当前生产工序">
                        <el-select v-model="form.processStepId" placeholder="当前生产工序" @change="handleProcessChange"
                            class="custom-select">
                            <el-option v-for="item in processStepOptions" :key="item._id" :label="item.processName"
                                :value="item._id">
                                <div class="option-content">
                                    <span class="option-main">{{ `${item.levelPrefix ||
                                        ''}${item.sort}.${item.processName}` }}</span>
                                    <span class="option-sub">{{ item.processCode }}</span>
                                </div>
                            </el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>



        </el-form>

        <div slot="footer" class="dialog-footer">
            <el-button @click="handleClose">取 消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确 定</el-button>
        </div>

    </el-dialog>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
export default {
    name: 'EditDialog',
    dicts: ['machine_type'],
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
            processStepOptions: [],
            submitLoading: false,
            processLoading: false
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
        // 工序选择变化处理
        handleProcessChange(processId) {
            if (!processId) {
                this.form.processStepId = '';
                return;
            }
            this.form.processStepId = processId;
        },
        // 产品型号变化处理
        async handleProductChange(material) {
            const materialId = material._id;
            this.processStepOptions = [];
            this.form.processStepId = '';
            this.form.materialId = '';

            if (!materialId) return;
            const loading = this.$loading({
                lock: true,
                text: '正在获取数据，请稍候...',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.7)'
            });
            try {
                const processSteps = await this.getAllProcessSteps(materialId, new Set(), new Set());
                console.log("获取到的工序:", processSteps);
                this.processStepOptions = Array.from(processSteps);
                this.form.materialId = materialId;
            } catch (error) {
                console.error('获取工序列表失败:', error);
                this.$message.error('获取工序列表失败');
            } finally {
                loading.close();
            }
        },


        // 递归获取所有相关工序
        async getAllProcessSteps(materialId, processSteps = new Set(), processedMaterials = new Set(), level = 0) {
            try {
                if (processedMaterials.has(materialId)) {
                    return processSteps;
                }

                processedMaterials.add(materialId);

                const craftResponse = await getData('craft', {
                    query: { materialId },
                    page: 1,
                    limit: 1
                });

                if (!craftResponse.data || craftResponse.data.length === 0) {
                    return processSteps;
                }

                const craft = craftResponse.data[0];

                const processStepResponse = await getData('processStep', {
                    query: { craftId: craft._id },
                    sort: { sort: 1 }
                });

                if (processStepResponse.data) {
                    for (const step of processStepResponse.data) {
                        // 添加层级前缀
                        step.levelPrefix = '┗'.repeat(level);
                        processSteps.add(step);

                        const processMaterialsResponse = await getData('processMaterials', {
                            query: { processStepId: step._id }
                        });

                        if (processMaterialsResponse.data) {
                            for (const material of processMaterialsResponse.data) {
                                await this.getAllProcessSteps(
                                    material.materialId,
                                    processSteps,
                                    processedMaterials,
                                    level + 1  // 增加层级
                                );
                            }
                        }
                    }
                }

                return processSteps;
            } catch (error) {
                console.error('获取工序失败:', error);
                return processSteps;
            }
        },
        handleSearchLineChange(val) {
            console.log(val)
            this.form.lineCode = val.lineCode
            this.form.lineName = val.lineName
        },
        async initFormData() {
            if (this.dialogStatus === 'edit') {
                this.form = { ...this.rowData }
                // 如果存在materialId，加载对应的工序选项
                if (this.form.materialId) {
                    try {
                        const processSteps = await this.getAllProcessSteps(this.form.materialId, new Set(), new Set());
                        this.processStepOptions = Array.from(processSteps);
                    } catch (error) {
                        console.error('初始化工序列表失败:', error);
                        this.$message.error('初始化工序列表失败');
                    }
                }
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

<style lang="scss" scoped>
.tip-box {
    background-color: #fdf6ec;
    border: 1px solid #faecd8;
    border-radius: 4px;
    padding: 8px 16px;
    margin: 0 0 20px 0;

    p {
        color: #e6a23c;
        font-size: 13px;
        margin: 0;
        line-height: 1.5;
        display: flex;
        align-items: center;

        &::before {
            content: "⚠️";
            margin-right: 8px;
        }
    }
}
</style>
