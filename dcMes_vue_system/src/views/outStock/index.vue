<template>
    <div class="app-container">
        <!-- 搜索表单 -->
        <div class="screen1">
            <el-form :model="searchForm" ref="searchForm" :inline="true" label-width="80px" class="search-form">
                <el-row :gutter="20" class="search-row">
                    <el-col :xs="24" :sm="12" :md="8" :lg="6">
                        <el-form-item label="单据编号">
                            <el-input v-model="searchForm.FBillNo" placeholder="请输入单据编号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="8" :lg="6">
                        <el-form-item label="销售组织">
                            <el-input v-model="searchForm.FSaleOrgId.Number" placeholder="请输入销售组织编号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="8" :lg="6">
                        <el-form-item label="单据状态">
                            <el-select v-model="searchForm.FDocumentStatus" placeholder="请选择单据状态" clearable>
                                <el-option v-for="dict in dict.type.document_Status" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="8" :lg="6">
                        <div class="search-buttons">
                            <el-button type="primary" icon="el-icon-search" @click="fetchData" >查询</el-button>
                            <el-button icon="el-icon-refresh" @click="resetForm" >重置</el-button>
                            <el-button type="warning" icon="el-icon-refresh-right" @click="handleSync" v-if="$checkPermission('销售出库单同步订单')">同步</el-button>
                            <el-button type="text" @click="showAdvanced = !showAdvanced" >
                                {{ showAdvanced ? '收起' : '展开' }}
                                <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
                            </el-button>
                        </div>
                    </el-col>
                </el-row>

                <!-- 高级搜索部分 -->
                <el-row :gutter="20" v-if="showAdvanced" class="search-row advanced-search">
                    <el-col :xs="24" :sm="12" :md="8" :lg="6">
                        <el-form-item label="发货组织">
                            <el-input v-model="searchForm.FStockOrgId.Number" placeholder="请输入发货组织编号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="8" :lg="6">
                        <el-form-item label="客户">
                            <el-input v-model="searchForm.FCustomerID.Number" placeholder="请输入客户编号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="8" :lg="6">
                        <el-form-item label="销售员">
                            <el-input v-model="searchForm.FSalesManID.Number" placeholder="请输入销售员编号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="8" :lg="8">
                        <el-form-item label="创建日期">
                            <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd"
                                style="width: 100%">
                            </el-date-picker>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </div>

        <!-- 列表标题区 -->
        <div class="screen1">
            <div class="title-section">
                <div class="title-left">
                    <i class="el-icon-tickets"></i>
                    <span class="title-text">销售出库单列表</span>
                </div>
                <div class="title-right">
                    <hir-input ref="hirInput" :printData="printData" :default-template="localPrintTemplate"
                        :template-params="{
                            // templateType: { $in: ['OS'] },
                            status: true
                        }" placeholder="请选择销售出库打印模板" @template-change="handleTemplateChange" />
                </div>
            </div>
        </div>

        <!-- 表格部分 -->
        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @handleCurrentChange="baseTableHandleCurrentChange" :cell-style="{ textAlign: 'center' }"
            @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">
                <!-- 展开行 -->
                <el-table-column type="expand">
                    <template slot-scope="props">
                        <el-table :data="props.row.FEntity || []" border style="width: 100%">
                            <!-- 基础信息 -->
                            <el-table-column label="序号" type="index" width="50" align="center" />
                            <el-table-column label="客户物料" min-width="120">
                                <template slot-scope="scope">
                                    <el-tooltip :content="getCustMatInfo(scope.row.FCustMatID)" placement="top">
                                        <span>{{ scope.row.FCustMatID && scope.row.FCustMatID.Number || '-' }}</span>
                                    </el-tooltip>
                                </template>
                            </el-table-column>

                            <!-- 物料信息 -->
                            <el-table-column label="物料编码" min-width="120">
                                <template slot-scope="scope">
                                    <el-tooltip :content="getMaterialInfo(scope.row.FMaterialID)" placement="top">
                                        <span>{{ scope.row.FMaterialID && scope.row.FMaterialID.Number || '-' }}</span>
                                    </el-tooltip>
                                </template>
                            </el-table-column>
                            <el-table-column label="物料名称" min-width="150">
                                <template slot-scope="scope">
                                    {{ scope.row.FMaterialID && scope.row.FMaterialID.Name || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column label="规格型号" min-width="120">
                                <template slot-scope="scope">
                                    {{ scope.row.FMaterialID && scope.row.FMaterialID.Specification || '-' }}
                                </template>
                            </el-table-column>

                            <!-- 数量与单位 -->
                            <el-table-column label="单位" width="80">
                                <template slot-scope="scope">
                                    {{ scope.row.FUnitID && scope.row.FUnitID.Name || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column label="应发数量" width="100">
                                <template slot-scope="scope">
                                    {{ formatNumber(scope.row.FMustQty) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="实发数量" width="100">
                                <template slot-scope="scope">
                                    {{ formatNumber(scope.row.FRealQty) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="库存数量" width="100">
                                <template slot-scope="scope">
                                    {{ formatNumber(scope.row.FInventoryQty) }}
                                </template>
                            </el-table-column>

                            <!-- 仓储信息 -->
                            <el-table-column label="仓库" min-width="120">
                                <template slot-scope="scope">
                                    <el-tooltip :content="getStockInfo(scope.row.FStockID)" placement="top">
                                        <span>{{ scope.row.FStockID && scope.row.FStockID.Name || '-' }}</span>
                                    </el-tooltip>
                                </template>
                            </el-table-column>
                            <el-table-column label="库存状态" width="100">
                                <template slot-scope="scope">
                                    {{ scope.row.FStockStatusID && scope.row.FStockStatusID.Name || '-' }}
                                </template>
                            </el-table-column>

                            <!-- 价格信息 -->
                            <el-table-column label="单价" width="100">
                                <template slot-scope="scope">
                                    {{ formatPrice(scope.row.FPrice) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="含税单价" width="100">
                                <template slot-scope="scope">
                                    {{ formatPrice(scope.row.FTaxPrice) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="金额" width="120">
                                <template slot-scope="scope">
                                    {{ formatPrice(scope.row.FAmount) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="税额" width="100">
                                <template slot-scope="scope">
                                    {{ formatPrice(scope.row.FTaxAmount) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="价税合计" width="120">
                                <template slot-scope="scope">
                                    {{ formatPrice(scope.row.FAllAmount) }}
                                </template>
                            </el-table-column>

                            <!-- 来源信息 -->
                            <el-table-column label="来源类型" prop="FSrcType" width="120" />
                            <el-table-column label="来源单号" min-width="120">
                                <template slot-scope="scope">
                                    {{ scope.row.FSrcBillNo || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column label="订单号" min-width="120">
                                <template slot-scope="scope">
                                    {{ scope.row.FSoorDerno || '-' }}
                                </template>
                            </el-table-column>

                            <!-- 日期信息 -->
                            <el-table-column label="生产日期" width="160">
                                <template slot-scope="scope">
                                    {{ formatDate(scope.row.FProduceDate) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="有效期至" width="160">
                                <template slot-scope="scope">
                                    {{ formatDate(scope.row.FExpiryDate) }}
                                </template>
                            </el-table-column>

                            <!-- 其他信息 -->
                            <el-table-column label="备注" prop="FEntrynote" min-width="150" />
                        </el-table>
                    </template>
                </el-table-column>

                <!-- 主表列 -->
                <el-table-column label="出库单号" prop="FBillNo" min-width="120" />
                <el-table-column label="销售组织" min-width="180">
                    <template slot-scope="scope">
                        <el-tooltip :content="getOrgInfo(scope.row.FSaleOrgId)" placement="top">
                            <span>{{ scope.row.FSaleOrgId && scope.row.FSaleOrgId.Name || '-' }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>

                <el-table-column label="发货组织" min-width="180">
                    <template slot-scope="scope">
                        <el-tooltip :content="getOrgInfo(scope.row.FStockOrgId)" placement="top">
                            <span>{{ scope.row.FStockOrgId && scope.row.FStockOrgId.Name || '-' }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>

                <el-table-column label="客户" min-width="180">
                    <template slot-scope="scope">
                        <el-tooltip :content="getCustomerInfo(scope.row.FCustomerID)" placement="top">
                            <span>{{ scope.row.FCustomerID && scope.row.FCustomerID.Name || '-' }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>

                <el-table-column label="单据状态" width="100">
                    <template slot-scope="scope">
                        <dict-tag :options="dict.type.document_Status" :value="scope.row.FDocumentStatus" />
                    </template>
                </el-table-column>

                <el-table-column label="销售员" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FSalesManID && scope.row.FSalesManID.Name || '-' }}
                    </template>
                </el-table-column>

                <el-table-column label="创建人" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FCreatorId && scope.row.FCreatorId.Name || '-' }}
                    </template>
                </el-table-column>

                <el-table-column label="创建日期" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.FCreateDate) }}
                    </template>
                </el-table-column>

                <el-table-column label="修改日期" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.FModifyDate) }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" fixed="right" width="280">
                    <template slot-scope="scope">
                        <el-button type="text" size="small" v-if="$checkPermission('销售出库单同步')" @click="handleOneSync(scope.row)">同步</el-button>
                        <el-button type="text" size="small" v-if="$checkPermission('销售出库单拓展数据')" @click="handleExt(scope.row)">拓展数据</el-button>
                        <!-- <el-button type="text" size="small" @click="handleLogistics(scope.row)">物流信息</el-button> -->
                        <el-button type="text" size="small" v-if="$checkPermission('销售出库单打印')" @click="handlePrint(scope.row)">打印</el-button>
                        </template>
                </el-table-column>
            </template>
        </base-table>

        <!-- 物流信息对话框 -->
        <el-dialog title="物流跟踪信息" :visible.sync="logisticsVisible" width="80%">
            <logistics-detail v-if="logisticsVisible" :delivery-data="currentDeliveryData"
                @close="handleLogisticsClose" />
        </el-dialog>

        <!-- 添加同步对话框 -->
        <el-dialog title="同步销售出库单" :visible.sync="syncDialogVisible" width="500px">
            <el-form :model="syncForm" ref="syncForm" label-width="100px">
                <el-form-item label="同步方式">
                    <el-radio-group v-model="syncForm.syncType">
                        <el-radio label="date">按日期同步</el-radio>
                        <el-radio label="billNo">按单号同步</el-radio>
                        <el-radio label="all">同步全部</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="审核日期" required v-if="syncForm.syncType === 'date'">
                    <el-date-picker v-model="syncForm.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" style="width: 100%">
                    </el-date-picker>
                </el-form-item>
                <el-form-item label="出库单号" required v-if="syncForm.syncType === 'billNo'">
                    <el-input v-model="syncForm.billNo" placeholder="请输入出库单号"></el-input>
                </el-form-item>
                <el-form-item label="单据状态">
                    <el-select :disabled="syncForm.syncType === 'all'" v-model="syncForm.documentStatus"
                        placeholder="请选择单据状态" style="width: 100%">
                        <el-option label="已审核" value="C" />
                        <el-option label="审核中" value="B" />
                        <el-option label="草稿" value="A" />
                    </el-select>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="syncDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="confirmSync">确 定</el-button>
            </div>
        </el-dialog>

        <!-- 拓展数据对话框 -->
        <el-dialog title="拓展数据" :visible.sync="extDialogVisible">
            <outStockExt v-if="extDialogVisible" :order-data="currentOrderData" @close="extDialogVisible = false"
                @refresh="fetchData" />
        </el-dialog>
    </div>
</template>

<script>
import { getData } from "@/api/data";
import { syncSAL_OutStock, getSyncStatus } from "@/api/K3Data";
import HirInput from '@/components/hirInput/index.vue'
import LogisticsDetail from './components/LogisticsDetail.vue'
import outStockExt from './components/outStockExt.vue'

export default {
    name: 'OutStock',
    dicts: ['document_Status'],
    components: {
        HirInput,
        LogisticsDetail,
        outStockExt
    },
    computed: {
        localPrintTemplate: {
            get() {
                try {
                    const savedTemplate = localStorage.getItem('printTemplate_outStock');
                    return savedTemplate ? JSON.parse(savedTemplate) : null;
                } catch (error) {
                    console.error('解析缓存模板失败:', error);
                    return null;
                }
            },
            set(value) {
                try {
                    localStorage.setItem('printTemplate_outStock', JSON.stringify(value));
                } catch (error) {
                    console.error('保存模板到缓存失败:', error);
                }
            }
        }
    },
    data() {
        return {
            searchForm: {
                FBillNo: '',
                FSaleOrgId: {
                    Number: ''
                },
                FStockOrgId: {
                    Number: ''
                },
                FCustomerID: {
                    Number: ''
                },
                FSalesManID: {
                    Number: ''
                },
                FDocumentStatus: '',
                dateRange: [],
            },
            tableList: [],
            total: 0,
            currentPage: 1,
            pageSize: 10,
            listLoading: true,
            showAdvanced: false,
            logisticsVisible: false,
            currentDeliveryData: {},
            printData: {},
            syncDialogVisible: false,
            syncProgressTimer: null,
            syncForm: {
                syncType: 'date',
                dateRange: [],
                documentStatus: 'C',
                billNo: ''
            },
            extDialogVisible: false,

        }
    },
    methods: {
        // 获取数据
        async fetchData() {
            this.listLoading = true;
            try {
                let req = this.searchData();
                req.page = this.currentPage;
                req.skip = (this.currentPage - 1) * this.pageSize;
                req.limit = this.pageSize;
                req.sort = { FBillNo: 1 };
                req.count = true;

                const result = await getData("K3_SAL_OutStock", req);

                if (result.code === 200) {
                    this.tableList = result.data;
                    this.total = result.countnum || result.data.length;
                } else {
                    this.$message.error(result.msg || '获取数据失败');
                }
            } catch (error) {
                console.error('获取数据失败:', error);
                this.$message.error('获取数据失败: ' + error.message);
            } finally {
                this.listLoading = false;
            }
        },

        // 构建查询条件
        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };

            if (this.searchForm.FBillNo) {
                req.query.$and.push({ FBillNo: { $regex: this.searchForm.FBillNo.trim(), $options: 'i' } });
            }

            if (this.searchForm.FSaleOrgId.Number) {
                req.query.$and.push({ 'FSaleOrgId.Number': { $regex: this.searchForm.FSaleOrgId.Number.trim(), $options: 'i' } });
            }

            if (this.searchForm.FStockOrgId.Number) {
                req.query.$and.push({ 'FStockOrgId.Number': { $regex: this.searchForm.FStockOrgId.Number.trim(), $options: 'i' } });
            }

            if (this.searchForm.FCustomerID.Number) {
                req.query.$and.push({ 'FCustomerID.Number': { $regex: this.searchForm.FCustomerID.Number.trim(), $options: 'i' } });
            }

            if (this.searchForm.FSalesManID && this.searchForm.FSalesManID.Number) {
                req.query.$and.push({ 'FSalesManID.Number': { $regex: this.searchForm.FSalesManID.Number.trim(), $options: 'i' } });
            }

            if (this.searchForm.FDocumentStatus) {
                req.query.$and.push({ FDocumentStatus: this.searchForm.FDocumentStatus });
            }

            if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
                req.query.$and.push({
                    FCreateDate: {
                        $gte: this.searchForm.dateRange[0] + ' 00:00:00',
                        $lte: this.searchForm.dateRange[1] + ' 23:59:59'
                    }
                });
            }

            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
        },

        // 处理打印
        async handlePrint(row) {
            //
            console.log("this.localPrintTemplate", this.localPrintTemplate)
            if (!this.localPrintTemplate) {
                this.$message.warning('请先选择打印模板');
                return;
            }

            //获取拓展数据
            const result = await getData('k3_SAL_OutStockExt', {
                query: { FSaleOrderId: row._id },
                populate: JSON.stringify([{ path: 'productionOrderId' }])
            })
            let printData = { ...row };
            if (result.code === 200 && result.data.length > 0) {
                console.log(result.data[0], 'result.data[0]')
                printData = { ...printData, ...result.data[0] }
                printData.FSaleOrderNo = result.data[0].productionOrderId && result.data[0].productionOrderId.FSaleOrderNo
                printData.FDeliveryDate = this.formatDate(printData.FDeliveryDate);
            }

            // 销售出库单打印数据处理
            // if (this.localPrintTemplate.templateType === 'DN') {
            printData.FApproveDate = this.formatDate(printData.FApproveDate);
            printData.FCreateDate = this.formatDate(printData.FCreateDate);
            printData.FCustomerID_Name = printData.FCustomerID && printData.FCustomerID.Name;
            // 处理明细数据
            printData.FEntity = printData.FEntity.map((item, index) => ({
                ...item,
                FNum: index + 1,
                FMaterialID_Name: item.FMaterialID && item.FMaterialID.Name,
                FMaterialID_Number: item.FMaterialID && item.FMaterialID.Number,
                FMaterialID_Specification: item.FMaterialID && item.FMaterialID.Specification,
                FUnitID_Name: item.FUnitID && item.FUnitID.Name
            }));
            // }
            console.log(printData, 'printData')
            this.printData = printData;
            this.$nextTick(() => {
                this.$refs.hirInput.handlePrints();
            });
        },

        // 辅助方法
        getMaterialNumber(material) {
            return material && material.Number || '-'
        },
        getMaterialName(material) {
            return material && material.Name || '-'
        },
        getMaterialSpec(material) {
            return material && material.Specification || '-'
        },
        getOrgInfo(org) {
            if (!org) return '-'
            return `${org.Number} - ${org.Name || '-'}`
        },
        getCustomerInfo(customer) {
            if (!customer) return '-'
            return `${customer.Number} - ${customer.Name || '-'}`
        },

        handleTemplateChange(template) {
            if (!template) return;
            try {
                this.printTemplate = template;
                this.localPrintTemplate = template;
                this.$message.success('打印模板已保存到本地');
            } catch (error) {
                console.error('保存打印模板失败:', error);
                this.$message.error('保存打印模板失败');
            }
        },

        getStatusType(status) {
            const statusMap = {
                'A': 'info',
                'B': 'warning',
                'C': 'success',
                'D': 'danger'
            }
            return statusMap[status] || 'info'
        },

        getStatusText(status) {
            const statusMap = {
                'A': '草稿',
                'B': '审核中',
                'C': '已审核',
                'D': '重新审核'
            }
            return statusMap[status] || status
        },

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

        handleLogistics(row) {
            this.currentDeliveryData = row;
            this.logisticsVisible = true;
        },

        handleLogisticsClose() {
            this.logisticsVisible = false;
            this.currentDeliveryData = {};
        },

        baseTableHandleCurrentChange(currentPage) {
            this.currentPage = currentPage;
            this.fetchData();
        },

        baseTableHandleSizeChange(pageSize) {
            this.pageSize = pageSize;
            this.fetchData();
        },

        resetForm() {
            // 重置表单
            this.$refs.searchForm.resetFields();

            // 创建空的初始化表单
            const initialForm = {
                FBillNo: '',
                FSaleOrgId: {
                    Number: ''
                },
                FStockOrgId: {
                    Number: ''
                },
                FCustomerID: {
                    Number: ''
                },
                FSalesManID: {
                    Number: ''
                },
                FDocumentStatus: '',
                dateRange: [],
            };

            // 使用Object.assign完全替换对象
            Object.assign(this.searchForm, initialForm);

            // 重新加载数据
            this.fetchData();
        },

        async handleOneSync(row) {
            try {
                await this.$confirm(`确认更新${row.FBillNo}的数据吗？`, '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });

                const req = {
                    FilterString: [{
                        FieldName: "FBillNo",
                        Compare: "=",
                        Value: row.FBillNo,
                        Left: "",
                        Right: "",
                        Logic: 0
                    }]
                };

                const response = await syncSAL_OutStock(req);
                if (response.code === 200) {
                    this.startSyncProgressCheck();
                    this.$message.success('同步任务已启动');
                } else {
                    this.$message.error(response.message || '同步失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('同步失败:', error);
                    this.$message.error('同步失败: ' + error.message);
                }
            }
        },

        handleSync() {
            this.syncDialogVisible = true;
            this.syncForm = {
                syncType: 'date',
                dateRange: [],
                documentStatus: 'C',
                billNo: ''
            };
        },

        async confirmSync() {
            if (this.syncForm.syncType === 'date' && (!this.syncForm.dateRange || this.syncForm.dateRange.length !== 2)) {
                this.$message.warning('请选择审核日期范围');
                return;
            }
            if (this.syncForm.syncType === 'billNo' && !this.syncForm.billNo) {
                this.$message.warning('请输入出库单号');
                return;
            }

            try {
                const req = this.buildSyncRequest();
                const loading = this.$loading({
                    lock: true,
                    text: '正在启动同步任务...',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                try {
                    const response = await syncSAL_OutStock(req);
                    if (response.code === 200) {
                        this.syncDialogVisible = false;
                        this.startSyncProgressCheck();
                        this.$message.success('同步任务已启动');
                    } else {
                        this.$message.error(response.message || '同步失败');
                    }
                } finally {
                    loading.close();
                }
            } catch (error) {
                console.error('同步失败:', error);
                this.$message.error('同步失败: ' + error.message);
            }
        },

        buildSyncRequest() {
            let req = {
                FilterString: []
            };

            switch (this.syncForm.syncType) {
                case 'date':
                    const [startDate, endDate] = this.syncForm.dateRange;
                    req.FilterString = [
                        {
                            FieldName: "FDocumentStatus",
                            Compare: "=",
                            Value: this.syncForm.documentStatus,
                            Left: "",
                            Right: "",
                            Logic: 0
                        },
                        {
                            FieldName: "FDate",
                            Compare: ">=",
                            Value: startDate,
                            Left: "",
                            Right: "",
                            Logic: 0
                        },
                        {
                            FieldName: "FDate",
                            Compare: "<=",
                            Value: endDate,
                            Left: "",
                            Right: "",
                            Logic: 0
                        }
                    ];
                    break;
                case 'billNo':
                    req.FilterString = [{
                        FieldName: "FBillNo",
                        Compare: "=",
                        Value: this.syncForm.billNo,
                        Left: "",
                        Right: "",
                        Logic: 0
                    }];
                    break;
                case 'all':
                    req.FilterString = [{
                        FieldName: "FDocumentStatus",
                        Compare: "=",
                        Value: "C",
                        Left: "",
                        Right: "",
                        Logic: 0
                    }];
                    break;
            }
            return req;
        },

        startSyncProgressCheck() {
            if (this.syncProgressTimer) {
                clearInterval(this.syncProgressTimer);
            }

            this.syncProgressTimer = setInterval(async () => {
                try {
                    const response = await getSyncStatus('K3_SAL_OutStock');
                    if (response.code === 200) {
                        const task = response.taskStatus;
                        if (task) {
                            switch (task.status) {
                                case 'running':
                                    this.$notify({
                                        type: 'info',
                                        message: `同步中：当前${task.processedRecords}条数据同步完成，耗时${task.elapsedTime}秒`,
                                        duration: 5000
                                    });
                                    break;
                                case 'completed':
                                case 'no_task':
                                    this.$message.success('同步完成！');
                                    this.stopSyncProgressCheck();
                                    this.fetchData();
                                    break;
                                default:
                                    this.$message.warning('未知的同步状态');
                                    this.stopSyncProgressCheck();
                            }
                        } else {
                            this.$message.warning('未找到同步任务');
                            this.stopSyncProgressCheck();
                        }
                    }
                } catch (error) {
                    console.error('查询同步进度失败:', error);
                    this.$message.error('查询同步进度失败');
                    this.stopSyncProgressCheck();
                }
            }, 5000);
        },

        stopSyncProgressCheck() {
            if (this.syncProgressTimer) {
                clearInterval(this.syncProgressTimer);
                this.syncProgressTimer = null;
            }
        },

        // 格式化数字
        formatNumber(value) {
            if (!value && value !== 0) return '-'
            return Number(value).toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
        },

        // 格式化价格
        formatPrice(value) {
            if (!value && value !== 0) return '-'
            return Number(value).toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                style: 'currency',
                currency: 'USD'
            })
        },

        // 获取客户物料信息
        getCustMatInfo(custMat) {
            if (!custMat) return '-'
            return `${custMat.Number} - ${custMat.Name}
物料编码: ${custMat.MaterialId && custMat.MaterialId.Number || '-'}`
        },

        // 获取物料完整信息
        getMaterialInfo(material) {
            if (!material) return '-'
            return `${material.Number} - ${material.Name}
规格: ${material.Specification || '-'}
物料组: ${material.MaterialGroup && material.MaterialGroup.Name || '-'}`
        },

        // 获取仓库完整信息
        getStockInfo(stock) {
            if (!stock) return '-'
            return `${stock.Number} - ${stock.Name}
属性: ${this.getStockProperty(stock.StockProperty)}`
        },

        // 获取仓库属性描述
        getStockProperty(property) {
            const propertyMap = {
                '1': '普通仓库',
                '2': '质检仓库',
                '3': '在途仓库',
                '4': '虚拟仓库',
                '5': '委外仓库'
            }
            return propertyMap[property] || '未知'
        },
        handleExt(row) {
            this.currentOrderData = row
            this.extDialogVisible = true
        },
    },
    created() {
        this.fetchData();

        // 加载本地缓存的打印模板
        const savedTemplate = this.localPrintTemplate;
        if (savedTemplate) {
            this.$nextTick(() => {
                if (this.$refs.hirInput) {
                    this.$refs.hirInput.handleTemplateChange(savedTemplate);
                }
            });
        }
    },
    beforeDestroy() {
        this.stopSyncProgressCheck();
    }
}
</script>

<style lang="scss" scoped>
.app-container {
    padding: 10px;

    .screen1 {
        background: #fff;
        padding: 16px;
        margin-bottom: 10px;
        border-radius: 4px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    }

    /* 优化搜索表单样式 */
    .search-form {
        width: 100%;

        .search-row {
            width: 100%;
            margin: 0;
            padding-bottom: 10px;

            &.advanced-search {
                border-top: 1px dashed #dcdfe6;
                padding-top: 15px;
                margin-top: 5px;
                animation: fadeIn 0.3s ease-in-out;
            }
        }

        .el-form-item {
            margin-bottom: 15px;
            width: 100%;
        }

        .search-buttons {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            justify-content: flex-end;

            .el-button {
                margin-left: 8px;
                margin-bottom: 5px;

                &:first-child {
                    margin-left: 0;
                }
            }
        }

        .el-select,
        .el-input,
        .el-date-editor {
            width: 100%;
        }
    }

    /* 标题区域样式 */
    .title-section {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .title-left {
            display: flex;
            align-items: center;

            i {
                font-size: 18px;
                margin-right: 8px;
                color: #409EFF;
            }

            .title-text {
                font-size: 16px;
                font-weight: 600;
                color: #303133;
            }
        }

        .title-right {
            display: flex;
            align-items: center;
        }
    }

    :deep(.el-table) {
        .el-table__expanded-cell {
            padding: 10px;
        }
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
