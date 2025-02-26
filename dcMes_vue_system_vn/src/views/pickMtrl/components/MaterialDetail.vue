<template>
    <div class="material-detail">
        <el-table
            :data="orderData.FEntity || []"
            border
            style="width: 100%"
        >
            <el-table-column type="expand">
                <template slot-scope="props">
                    <el-form label-position="left" inline class="serial-info">
                        <el-divider content-position="left">序列号信息</el-divider>
                        <el-table
                            :data="props.row.FSerialSubEntity || []"
                            border
                            style="width: 100%"
                        >
                            <el-table-column label="序列号" prop="FSerialNo" />
                            <el-table-column label="序列号Id" prop="FSerialId" />
                            <el-table-column label="备注" prop="FSerialNote" />
                            <el-table-column label="是否需要检验" prop="FIsAppInspect">
                                <template slot-scope="scope">
                                    <el-tag :type="scope.row.FIsAppInspect ? 'warning' : 'info'">
                                        {{ scope.row.FIsAppInspect ? '是' : '否' }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-form>
                </template>
            </el-table-column>

            <el-table-column label="物料编码" prop="FMaterialId.Number" width="120" />
            <el-table-column label="物料名称" prop="FMaterialId.Name" width="150" />
            <el-table-column label="规格型号" prop="FMaterialId.Specification" width="120" />
            
            <el-table-column label="申请数量" prop="FAppQty" width="100" />
            <el-table-column label="实际数量" prop="FActualQty" width="100" />
            <el-table-column label="库存单位" prop="FStockUnitId.Name" width="100" />
            
            <el-table-column label="仓库" prop="FStockId.Name" width="120" />
            <el-table-column label="仓位" prop="FStockLocId.FF100001" width="120" />
            <el-table-column label="批号" prop="FLot" width="120" />
            
            <el-table-column label="生产订单号" prop="FMoBillNo" width="120" />
            <el-table-column label="工序" prop="FProcessId.Name" width="120" />
            
            <el-table-column label="单价" prop="FPrice" width="100">
                <template slot-scope="scope">
                    {{ formatNumber(scope.row.FPrice) }}
                </template>
            </el-table-column>
            <el-table-column label="金额" prop="FAmount" width="120">
                <template slot-scope="scope">
                    {{ formatNumber(scope.row.FAmount) }}
                </template>
            </el-table-column>
            <el-table-column label="备注" prop="FEntrtyMemo" />
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