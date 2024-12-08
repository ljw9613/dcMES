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
                        <el-select v-model="form.status" placeholder="请选择工单状态" style="width: 100%">
                            <el-option label="待生产" value="PENDING" />
                            <el-option label="生产中" value="IN_PROGRESS" />
                            <el-option label="已完成" value="COMPLETED" />
                            <el-option label="已取消" value="CANCELLED" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="销售单号" prop="saleOrderId">
                        <zr-select
                            v-model="form.saleOrderId"
                            collection="k3_SAL_SaleOrder"
                            :search-fields="['FBillNo']"
                            label-key="FBillNo"
                            sub-key="FCustId"
                            :multiple="false"
                            placeholder="请输入销售单号搜索"
                            @select="handleSaleOrderSelect"
                        >
                            <template #option="{ item }">
                                <div class="item-option">
                                    <div class="item-info">
                                        <span class="name">{{ item.FBillNo }}</span>
                                        <el-tag size="mini" type="info">{{ item.FCustId }}</el-tag>
                                    </div>
                                    <div class="sub-info">
                                        <small>{{ item.FDate | formatDate }}</small>
                                    </div>
                                </div>
                            </template>
                        </zr-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="生产单号" prop="productionOrderId">
                        <zr-select
                            v-model="form.productionOrderId"
                            collection="k3_PRD_MO"
                            :search-fields="['FBillNo']"
                            label-key="FBillNo"
                            sub-key="FMaterialName"
                            :multiple="false"
                            :additional-query="productionOrderQuery"
                            placeholder="请输入生产单号搜索"
                            @select="handleProductionOrderSelect"
                        >
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
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="产品" prop="materialId">
                        <zr-select
                            v-model="form.materialId"
                            collection="k3_BD_MATERIAL"
                            :search-fields="['FNumber', 'FName', 'FSpecification']"
                            label-key="FName"
                            tag-key="FNumber"
                            sub-key="FSpecification"
                            :multiple="false"
                            placeholder="请输入产品信息搜索"
                            @select="handleMaterialSelect"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="产线" prop="productionLineId">
                        <zr-select
                            v-model="form.productionLineId"
                            collection="production_line"
                            :search-fields="['lineCode', 'lineName']"
                            label-key="lineName"
                            tag-key="lineCode"
                            sub-key="workshop"
                            :multiple="false"
                            placeholder="请输入产线信息搜索"
                            @select="handleProductionLineSelect"
                        />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="计划数量" prop="planQuantity">
                        <el-input-number v-model="form.planQuantity" :min="0" controls-position="right"
                            style="width: 100%"></el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="投入数量" prop="inputQuantity">
                        <el-input-number v-model="form.inputQuantity" :min="0" controls-position="right"
                            style="width: 100%"></el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="产出数量" prop="outputQuantity">
                        <el-input-number v-model="form.outputQuantity" :min="0" controls-position="right"
                            style="width: 100%"></el-input-number>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="计划开始时间" prop="planStartTime">
                        <el-date-picker v-model="form.planStartTime" type="datetime" 
                            placeholder="选择计划开始时间" style="width: 100%">
                        </el-date-picker>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="计划结束时间" prop="planEndTime">
                        <el-date-picker v-model="form.planEndTime" type="datetime" 
                            placeholder="选择计划结束时间" style="width: 100%">
                        </el-date-picker>
                    </el-form-item>
                </el-col>
            </el-row>

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
import ZrSelect from '@/components/ZrSelect'

export default {
    name: 'EditDialog',
    components: {
        ZrSelect
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
                planStartTime: [{ required: true, message: '请选择计划开始时间', trigger: 'change' }],
                planEndTime: [{ required: true, message: '请选择计划结束时间', trigger: 'change' }]
            },
            submitLoading: false
        }
    },
    computed: {
        dialogTitle() {
            return this.dialogStatus === 'create' ? '新增生产计划工单' : '编辑生产计划工单'
        },
        productionOrderQuery() {
            return this.form.saleOrderNo ? {
                FSaleOrderNo: this.form.saleOrderNo
            } : {}
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
                    inputQuantity: 0,
                    outputQuantity: 0,
                    planStartTime: '',
                    planEndTime: '',
                    remark: ''
                }
            }
        },
        handleSaleOrderSelect(item) {
            if (item) {
                this.form.saleOrderNo = item.FBillNo
                // 清空相关联的生产订单信息
                this.form.productionOrderId = ''
                this.form.productionOrderNo = ''
            }
        },
        handleProductionOrderSelect(item) {
            if (item) {
                this.form.productionOrderNo = item.FBillNo
                this.form.productModel = item.FSpecification || ''
                this.form.productName = item.FMaterialName || ''
                this.form.planQuantity = item.FQty || 0
                // this.form.materialId = item.FMaterialId
            }
        },
        handleMaterialSelect(item) {
            if (item) {
                this.form.productModel = item.FSpecification
                this.form.productName = item.FName
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