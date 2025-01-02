<template>
    <el-dialog :title="dialogTitle" :visible.sync="visible" width="60%" @close="handleClose">
        <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small">
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="工单号" prop="workOrderNo">
                        <el-input v-model="form.workOrderNo" placeholder="请输入工单号"
                            :disabled="dialogStatus === 'edit'"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="工单状态" prop="status">
                        <el-select v-model="form.status" disabled placeholder="请选择工单状态" style="width: 100%">
                            <el-option v-for="dict in dict.type.work_order_status" :key="dict.value" :label="dict.label"
                                :value="dict.value" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="销售单号" prop="saleOrderId">
                        <zr-select v-model="form.saleOrderId" collection="k3_SAL_SaleOrder" :search-fields="['FBillNo']"
                            label-key="FBillNo" sub-key="FCustId" :multiple="false" placeholder="请输入销售单号搜索"
                            @select="handleSaleOrderSelect">
                            <template #option="{ item }">
                                <div class="item-option">
                                    <div class="item-info">
                                        <span class="name">{{ item.FBillNo }}</span>
                                        <el-tag size="mini" type="info">{{ item.FCustId }}</el-tag>
                                    </div>
                                    <div class="sub-info">
                                        <small>{{ item.FDate }}</small>
                                    </div>
                                </div>
                            </template>
                        </zr-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="生产单号" prop="productionOrderId">
                        <zr-select v-if="form.saleOrderId" v-model="form.productionOrderId" collection="k3_PRD_MO"
                            :search-fields="['FBillNo']" label-key="FBillNo" sub-key="FMaterialName" :multiple="false"
                            :additional-query="productionOrderQuery" placeholder="请输入生产单号搜索"
                            @select="handleProductionOrderSelect">
                            <template #option="{ item }">
                                <div class="item-option">
                                    <div class="item-info">
                                        <span class="name">{{ item.FBillNo }}</span>
                                        <el-tag size="mini" type="info">{{ item.FMaterialName }}</el-tag>
                                    </div>
                                    <div class="sub-info">
                                        <small>计划数量: {{ item.FQty }}</small>
                                    </div>
                                </div>
                            </template>
                        </zr-select>
                        <el-input v-else v-model="form.productionOrderNo" :disabled="true" placeholder="请先选择销售单号" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="产品" prop="materialId">
                        <zr-select v-if="form.productionOrderId" v-model="form.materialId" collection="k3_BD_MATERIAL"
                            :search-fields="['FNumber', 'FName', 'FSpecification']" label-key="FName"
                            sub-key="FMATERIALID" :multiple="false" @select="handleMaterialSelect"
                            :additional-query="materialQuery" placeholder="请输入物料编码/名称搜索">
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
                        <el-input v-else v-model="form.materialName" :disabled="true" placeholder="请先选择生产单号" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="产线" prop="productionLineId">
                        <zr-select v-model="form.productionLineId" collection="production_line"
                            :search-fields="['lineCode', 'lineName']" label-key="lineName" tag-key="lineCode"
                            sub-key="workshop" :multiple="false" placeholder="请输入产线信息搜索"
                            @select="handleProductionLineSelect" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="生产数量" prop="planQuantity">
                        <el-input-number v-model="form.planQuantity" :min="0" controls-position="right"
                            style="width: 100%"></el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="工单数量" prop="planProductionQuantity">
                        <el-input-number 
                            v-model="form.planProductionQuantity" 
                            :min="0" 
                            controls-position="right"
                            style="width: 100%"
                            :disabled="form.status !== 'PENDING'"
                        ></el-input-number>
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="投入数量" prop="inputQuantity">
                        <el-input-number disabled v-model="form.inputQuantity" :min="0" controls-position="right"
                            style="width: 100%"></el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="产出数量" prop="outputQuantity">
                        <el-input-number disabled v-model="form.outputQuantity" :min="0" controls-position="right"
                            style="width: 100%"></el-input-number>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="计划开始时间" prop="planStartTime">
                        <el-date-picker v-model="form.planStartTime" type="datetime" placeholder="选择计划开始时间"
                            style="width: 100%">
                        </el-date-picker>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="计划结束时间" prop="planEndTime">
                        <el-date-picker v-model="form.planEndTime" type="datetime" placeholder="选择计划结束时间"
                            style="width: 100%">
                        </el-date-picker>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="备注" prop="remark">
                <el-input type="textarea" v-model="form.remark" placeholder="请输入备注信息"></el-input>
            </el-form-item>
        </el-form>

        <div slot="footer" class="dialog-footer">
            <template v-if="dialogStatus === 'edit'">
                <el-button type="info" @click="handleOneKeyProduction">
                    一键生产
                </el-button>
                <el-button type="success" @click="handleStartProduction" :disabled="!canStart"
                    v-if="form.status === 'PENDING' || form.status === 'PAUSED'">
                    开始生产
                </el-button>
                <el-button type="warning" @click="handlePauseProduction" :disabled="form.status !== 'IN_PROGRESS'"
                    v-if="form.status === 'IN_PROGRESS'">
                    暂停生产
                </el-button>
                <el-button type="danger" @click="handleCancelProduction" :disabled="form.status !== 'IN_PROGRESS'"
                    v-if="form.status === 'IN_PROGRESS'">
                    取消生产
                </el-button>
            </template>
            <el-button @click="handleClose">取 消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确 定</el-button>
        </div>
        <work-dialog v-if="workDialogVisible && dialogStatus === 'edit'" :line-id="form.productionLineId"
            :visible.sync="workDialogVisible" :material-id="form.materialId" :productionPlanWorkOrderId="form._id"
            :work-table-data="workTableData" />
    </el-dialog>
</template>

<script>
import { getData } from '@/api/data';
import ZrSelect from '@/components/ZrSelect'
import workDialog from '@/components/workDialog'
import { getAllProcessSteps } from '@/api/materialProcessFlowService'
export default {
    name: 'EditDialog',
    dicts: ['work_order_status'],
    components: {
        ZrSelect,
        workDialog
    },
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
                workOrderNo: '',
                status: 'PENDING',
                saleOrderId: '',
                saleOrderNo: '',
                productionOrderId: '',
                productionOrderNo: '',
                materialId: '',
                productModel: '',
                productName: '',
                productionLineId: '',
                lineName: '',
                businessType: 'NORMAL',
                planQuantity: 0,
                planProductionQuantity: 0,
                inputQuantity: 0,
                outputQuantity: 0,
                planStartTime: '',
                planEndTime: '',
                remark: ''
            },
            rules: {
                workOrderNo: [{ required: true, message: '请输入工单号', trigger: 'blur' }],
                status: [{ required: true, message: '请选择工单状态', trigger: 'change' }],
                saleOrderId: [{ required: true, message: '请选择销售单号', trigger: 'change' }],
                productionOrderId: [{ required: true, message: '请选择生产单号', trigger: 'change' }],
                materialId: [{ required: true, message: '请选择产品', trigger: 'change' }],
                productionLineId: [{ required: true, message: '请选择产线', trigger: 'change' }],
                businessType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
                planQuantity: [{ required: true, message: '请输入计划数量', trigger: 'blur' }],
                planProductionQuantity: [{ required: true, message: '请输入计划生产数量', trigger: 'blur' }],
                planStartTime: [{ required: true, message: '请选择计划开始时间', trigger: 'change' }],
                planEndTime: [{ required: true, message: '请选择计划结束时间', trigger: 'change' }]
            },
            submitLoading: false,
            workDialogVisible: false,
            workTableData: []
        }
    },
    computed: {
        dialogTitle() {
            return this.dialogStatus === 'create' ? '新增生产计划工单' : '编辑生产计划工单'
        },
        productionOrderQuery() {
            //    return {}
            return this.form.saleOrderNo ? {
                FSaleOrderNo: this.form.saleOrderNo
            } : {}
        },
        materialQuery() {
            return this.form.materialId ? {
                FMaterialId: this.form.materialId
            } : {}
        },
        canStart() {
            return this.form.status === 'PENDING' || this.form.status === 'PAUSED'
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
        async handleOneKeyProduction() {
            try {
                if (!this.form.productionLineId) {
                    this.$message.error('请先选择产线')
                    return
                }

                const { data: processSteps } = await getAllProcessSteps(this.form.materialId);
                console.log("获取到的工序:", processSteps);

                if (processSteps.length === 0) {
                    this.$message.error('该物料没有对应的工艺')
                    return
                }

                //过滤有绑定设备的工序 当前产线工序
                // let machineProcessSteps = processSteps.filter(item => item.machineId && item.machineId.lineId == this.form._id)
                // let machineProcessSteps = processSteps.filter(item => item.machineId && item.machineId.lineId == this.form.productionLineId)

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
                    workOrderNo: 'P' + new Date().getFullYear().toString() + (new Date().getMonth() + 1).toString().padStart(2, '0') + new Date().getDate().toString().padStart(2, '0') + Date.now().toString(),
                    status: 'PENDING',
                    saleOrderId: '',
                    saleOrderNo: '',
                    productionOrderId: '',
                    productionOrderNo: '',
                    materialId: '',
                    materialNumber: '',
                    materialName: '',
                    fSpecification: '',
                    FMATERIALID: '',
                    productionLineId: '',
                    lineName: '',
                    businessType: 'NORMAL',
                    planQuantity: 0,
                    planProductionQuantity: 0,
                    inputQuantity: 0,
                    outputQuantity: 0,
                    planStartTime: '',
                    planEndTime: '',
                    remark: ''
                }
            }
        },
        handleSaleOrderSelect(item) {
            this.form.saleOrderId = null
            this.form.productionOrderId = null
            if (item) {
                console.log(item)
                this.$nextTick(() => {
                    this.form.saleOrderId = item._id
                    this.form.saleOrderNo = item.FBillNo
                    // 清空相关联的生产订单信息
                    this.form.productionOrderId = ''
                    this.form.productionOrderNo = ''
                })
            }
        },

        async handleProductionOrderSelect(item) {
            this.form.productionOrderId = null
            this.form.materialId = null
            if (item) {
                console.log(item)
                this.$nextTick(async () => {
                    //获取产品料号
                    const { data: material } = await getData('k3_BD_MATERIAL', {
                        query: {
                            FMATERIALID: item.FMaterialId
                        }
                    })

                    console.log(material)

                    if (material.length) {
                        this.form.materialId = material[0]._id
                        this.form.materialNumber = material[0].FNumber
                        this.form.materialName = material[0].FName
                        this.form.fSpecification = material[0].FSpecification
                        this.form.FMATERIALID = material[0].FMATERIALID
                    }
                    this.$nextTick(() => {
                        this.form.productionOrderId = item._id
                        this.form.productionOrderNo = item.FBillNo
                        this.form.fSpecification = item.FSpecification || ''
                        this.form.materialName = item.FMaterialName || ''
                        this.form.planQuantity = item.FQty || 0
                    })
                })
            }
        },
        handleMaterialSelect(item) {
            if (item) {
                this.form.materialId = item._id
                this.form.materialNumber = item.FNumber
                this.form.materialName = item.FName
                this.form.fSpecification = item.FSpecification
                this.form.FMATERIALID = item.FMATERIALID
            }
        },
        handleProductionLineSelect(item) {
            if (item) {
                this.form.lineName = item.lineName
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
        },
        async handleStartProduction() {

            // 工单数量 大于 0 小于等于 计划生产数量
            if (this.form.planProductionQuantity <= 0 || this.form.planProductionQuantity > this.form.planQuantity) {
                this.$message.error('工单数量必须大于0且不能超过计划生产数量')
                return
            }

            const { data: inProgressWorkOrders } = await getData('production_plan_work_order', {
                query: {
                    productionLineId: this.form.productionLineId,
                    status: 'IN_PROGRESS'
                }
            })

            // 工单数量 大于 0 小于等于 计划生产数量
            if (this.form.planProductionQuantity <= 0 || this.form.planProductionQuantity > this.form.planQuantity) {
                this.$message.error('计划生产数量不正确')
                return
            }

            if (inProgressWorkOrders.length) {
                this.$message.error('当前产线存在进行中的工单，无法开始新的工单')
                return
            }

            this.$confirm('确认开始生产该工单?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.form.status = 'IN_PROGRESS'
                this.handleSubmit()
            }).catch(() => { })
        },
        handlePauseProduction() {
            this.$confirm('确认暂停生产该工单?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.form.status = 'PAUSED'
                this.handleSubmit()
            }).catch(() => { })
        },
        handleCancelProduction() {
            this.$confirm('确认取消生产该工单?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.form.status = 'CANCELLED'
                this.handleSubmit()
            }).catch(() => { })
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

.item-option {
    padding: 5px 0;

    .item-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .name {
            font-weight: 500;
        }
    }

    .sub-info {
        margin-top: 4px;
        color: #909399;
        font-size: 12px;
    }
}
</style>