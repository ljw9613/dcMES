<template>
    <div class="material-detail">
        <!-- 物料明细表格 -->
        <el-table
            :data="orderData.FPOOrderEntry || []"
            border
            style="width: 100%"
        >
            <el-table-column type="expand">
                <template slot-scope="props">
                    <el-form label-position="left" inline class="delivery-plan">
                        <el-divider content-position="left">交货计划</el-divider>
                        <el-table
                            :data="props.row.FEntryDeliveryPlan || []"
                            border
                            style="width: 100%"
                        >
                            <el-table-column label="计划交货日期" prop="FDeliveryDate_Plan">
                                <template slot-scope="scope">
                                    {{ formatDate(scope.row.FDeliveryDate_Plan) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="计划数量" prop="FPlanQty" />
                            <el-table-column label="交货地点" prop="FELocation" />
                            <el-table-column label="交货地址" prop="FELocationAddress" />
                            <el-table-column label="确认交货数量" prop="FConfirmDeliQty" />
                            <el-table-column label="确认交货日期" prop="FConfirmDeliDate">
                                <template slot-scope="scope">
                                    {{ formatDate(scope.row.FConfirmDeliDate) }}
                                </template>
                            </el-table-column>
                        </el-table>

                        <el-divider content-position="left">税务明细</el-divider>
                        <el-table
                            :data="props.row.FTaxDetailSubEntity || []"
                            border
                            style="width: 100%"
                        >
                            <el-table-column label="税率名称" prop="FTaxRateId" />
                            <el-table-column label="税率%" prop="FTaxRate">
                                <template slot-scope="scope">
                                    {{ scope.row.FTaxRate }}%
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-form>
                </template>
            </el-table-column>

            <el-table-column label="物料编码" prop="FMaterialId" width="120" />
            <el-table-column label="采购单位" prop="FUnitId" width="100" />
            <el-table-column label="采购数量" prop="FQty" width="100" />
            <el-table-column label="计价单位" prop="FPriceUnitId" width="100" />
            <el-table-column label="单价" prop="FPrice" width="100">
                <template slot-scope="scope">
                    {{ formatNumber(scope.row.FPrice) }}
                </template>
            </el-table-column>
            <el-table-column label="含税单价" prop="FTaxPrice" width="100">
                <template slot-scope="scope">
                    {{ formatNumber(scope.row.FTaxPrice) }}
                </template>
            </el-table-column>
            <el-table-column label="折扣率" prop="FEntryDiscountRate" width="100">
                <template slot-scope="scope">
                    {{ scope.row.FEntryDiscountRate }}%
                </template>
            </el-table-column>
            <el-table-column label="需求组织" prop="FRequireOrgId" width="120" />
            <el-table-column label="需求部门" prop="FRequireDeptId" width="120" />
            <el-table-column label="收料组织" prop="FReceiveOrgId" width="120" />
            <el-table-column label="结算组织" prop="FEntrySettleOrgId" width="120" />
            <el-table-column label="是否赠品" prop="FGiveAway" width="80">
                <template slot-scope="scope">
                    <el-tag :type="scope.row.FGiveAway ? 'success' : 'info'">
                        {{ scope.row.FGiveAway ? '是' : '否' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="备注" prop="FEntryNote" />
        </el-table>
    </div>
</template>

<script>
export default {
    name: 'MaterialDetail',
    props: {
        orderData: {
            type: Object,
            required: true
        }
    },
    methods: {
        formatDate(date) {
            if (!date) return '暂无数据';
            return new Date(date).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        formatNumber(num) {
            if (!num && num !== 0) return '¥0.00';
            return '¥' + Number(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
    }
}
</script>

<style lang="scss" scoped>
.material-detail {
    .delivery-plan {
        padding: 20px;
        
        .el-divider {
            margin: 20px 0;
        }
    }
}
</style> 