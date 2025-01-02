<template>
    <el-dialog :title="dialogTitle" :visible.sync="visible" width="60%" @close="handleClose">
        <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small">
            <!-- 基础信息 -->
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
                    <el-form-item label="车间线路编号" prop="lineNum">
                        <el-input v-model="form.lineNum" placeholder="请输入车间线路编号"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="状态" prop="state">
                        <el-select v-model="form.state" placeholder="请选择状态" style="width: 100%">
                            <el-option label="正常" :value="1" />
                            <el-option label="作废" :value="0" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- 设备信息 -->
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="接收器卡号" prop="cardNum">
                        <el-input v-model="form.cardNum" placeholder="请输入接收器卡号"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="接收器机号" prop="machineNum">
                        <el-input v-model="form.machineNum" placeholder="请输入接收器机号"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="IP地址" prop="ipAddress">
                        <el-input v-model="form.ipAddress" placeholder="请输入IP地址"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- 产线参数 -->
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="标准产能" prop="capacity">
                        <el-input-number v-model="form.capacity" :min="0" controls-position="right" style="width: 100%"
                            placeholder="件/小时"></el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="节拍时间" prop="cycleTime">
                        <el-input-number v-model="form.cycleTime" :min="0" controls-position="right" style="width: 100%"
                            placeholder="秒"></el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="标准人数" prop="workers">
                        <el-input-number v-model="form.workers" :min="0" controls-position="right" style="width: 100%"
                            placeholder="人"></el-input-number>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- 位置信息 -->
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

            <el-form-item label="备注" prop="remark">
                <el-input type="textarea" v-model="form.remark" placeholder="请输入备注信息"></el-input>
            </el-form-item>
            <!-- 当前生产工序 -->
            <el-row :gutter="20" v-if="dialogStatus == 'edit' && hasOneKeyProductionPermission">
                <el-col :span="24">
                    <div class="tip-box">
                        <p>请勿随意修改当前产线的生产主物料</p>
                    </div>
                </el-col>
            </el-row>
            <!-- 一键生产 -->
            <el-form-item label="一键生产" v-if="dialogStatus == 'edit' && hasOneKeyProductionPermission">
                <zr-select v-model="form.currentMaterial" collection="k3_BD_MATERIAL"
                    :search-fields="['FNumber', 'FName']" label-key="FName" sub-key="FMATERIALID" :multiple="false"
                    placeholder="请输入物料编码/名称搜索">
                    <template #option="{ item }">
                        <div class="select-option">
                            <div class="option-main">
                                <span class="option-label">{{ item.FNumber }} - {{ item.FName }}</span>
                                <el-tag size="mini" type="info" class="option-tag">
                                    {{ item.FMATERIALID }} - {{ item.FUseOrgId_FName }}
                                </el-tag>
                            </div>
                            <div class="option-sub" v-if="item.FSpecification">
                                <small>规格: {{ item.FSpecification }}</small>
                            </div>
                        </div>
                    </template>
                </zr-select>
                <el-button type="primary" @click="handleOneKeyProduction()"
                    :disabled="!form.currentMaterial">一键生产</el-button>
            </el-form-item>
        </el-form>


        <div slot="footer" class="dialog-footer">
            <el-button @click="handleClose">取 消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确 定</el-button>
        </div>
        <work-dialog v-if="workDialogVisible" :line-id="form._id" :visible.sync="workDialogVisible"
            :material-id="form.currentMaterial" :work-table-data="workTableData" />
    </el-dialog>
</template>

<script>
import workDialog from '@/components/workDialog'
import { getData } from '@/api/data'
import { getAllProcessSteps } from '@/api/materialProcessFlowService'
export default {
    name: 'EditDialog',
    components: { workDialog },
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
                lineNum: '',
                state: 1,
                cardNum: '',
                machineNum: '',
                ipAddress: '',
                capacity: 0,
                cycleTime: 0,
                workers: 0,
                workshop: '',
                area: '',
                location: '',
                remark: '',
                currentMaterial: null,
            },
            rules: {
                lineCode: [{ required: true, message: '请输入产线编码', trigger: 'blur' }],
                lineName: [{ required: true, message: '请输入产线名称', trigger: 'blur' }],
                state: [{ required: true, message: '请选择状态', trigger: 'change' }],
                // workshop: [{ required: true, message: '请输入所属车间', trigger: 'blur' }],
                cardNum: [{ required: true, message: '请输入接收器卡号', trigger: 'blur' }]
            },
            submitLoading: false,

            workTableData: [],
            workDialogVisible: false,
            hasOneKeyProductionPermission: false
        }
    },
    computed: {
        dialogTitle() {
            return this.dialogStatus === 'create' ? '新增生产产线' : '编辑生产产线'
        }
    },
    mounted() {
        const roles = this.$store.getters.roles;
        if (!roles || !roles.buttonList) {
            return false;
        }
        if (roles.buttonList.includes("one_click_production")) {
            this.hasOneKeyProductionPermission = true;
        }
    },
    watch: {
        visible(val) {
            if (val) {
                this.initFormData()
            }
        }
    },
    methods: {
        async handleOneKeyProduction() {
            try {
                if (!this.form.currentMaterial) {
                    this.$message.error('请先选择生产物料')
                    return
                }

                const { data: processSteps } = await getAllProcessSteps(this.form.currentMaterial);
                console.log("获取到的工序:", processSteps);

                if (processSteps.length === 0) {
                    this.$message.error('该物料没有对应的工艺')
                    return
                }

                //过滤有绑定设备的工序 当前产线工序
                // let machineProcessSteps = processSteps.filter(item => item.machineId && item.machineId.lineId == this.form._id)
                // let machineProcessSteps = processSteps.filter(item => item.machineId )

                this.workTableData = processSteps
                console.log(this.workTableData, 'this.workTableData')
                this.workDialogVisible = true
            } catch (error) {
                this.$message.error('获取工序数据失败')
            }
        },
        initFormData() {
            if (this.dialogStatus === 'edit') {
                this.form = { ...this.rowData }
            } else {
                this.form = {
                    lineCode: '',
                    lineName: '',
                    lineNum: '',
                    state: 1,
                    cardNum: '',
                    machineNum: '',
                    ipAddress: '',
                    capacity: 0,
                    cycleTime: 0,
                    workers: 0,
                    workshop: '',
                    area: '',
                    location: '',
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