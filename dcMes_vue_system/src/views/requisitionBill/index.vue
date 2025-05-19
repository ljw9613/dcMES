<template>
    <div class="app-container">
        <!-- 搜索表单 -->
        <div class="screen1">
            <el-form :model="searchForm" ref="searchForm" class="screen_content_first">
                <el-form-item label="申请单号">
                    <el-input v-model="searchForm.FBillNo" placeholder="请输入申请单号" clearable></el-input>
                </el-form-item>

                <el-form-item label="申请组织">
                    <el-input v-model="searchForm.FApplicationOrgId.Number" placeholder="请输入申请组织编号" clearable></el-input>
                </el-form-item>

                <el-form-item label="单据状态">
                    <el-select v-model="searchForm.FDocumentStatus" placeholder="请选择单据状态" clearable>
                        <el-option
                            v-for="item in dictMap.documentStatus"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>

                <!-- 高级搜索部分 -->
                <div v-if="showAdvanced" class="screen_content_second">
                    <el-form-item label="申请部门">
                        <el-input v-model="searchForm.FApplicationDeptId.Number" placeholder="请输入申请部门" clearable></el-input>
                    </el-form-item>

                    <el-form-item label="申请人">
                        <el-input v-model="searchForm.FApplicantId" placeholder="请输入申请人" clearable></el-input>
                    </el-form-item>

                    <el-form-item label="创建人">
                        <el-input v-model="searchForm.FCreatorId" placeholder="请输入创建人" clearable></el-input>
                    </el-form-item>

                    <el-form-item label="物料编码">
                        <el-input v-model="searchForm.FMaterialId" placeholder="请输入物料编码" clearable></el-input>
                    </el-form-item>

                    <el-form-item label="申请日期">
                        <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
                            start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd">
                        </el-date-picker>
                    </el-form-item>

                    <el-form-item label="创建日期">
                        <el-date-picker v-model="searchForm.createDateRange" type="daterange" range-separator="至"
                            start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd">
                        </el-date-picker>
                    </el-form-item>
                </div>

                <div class="screen_content_second_one">
                    <el-button 
                        type="primary" 
                        icon="el-icon-search" 
                        @click="handleSearch"
                        v-if="$checkPermission('采购申请单查询')">查询</el-button>
                    <el-button 
                        icon="el-icon-refresh" 
                        @click="handleReset"
                        v-if="$checkPermission('采购申请单重置')">重置</el-button>
                    <el-button 
                        type="warning" 
                        icon="el-icon-refresh" 
                        @click="handleSync"
                        v-if="$checkPermission('采购申请单同步订单')">同步数据</el-button>
                    <el-button 
                        type="text" 
                        @click="toggleAdvanced"
                        v-if="$checkPermission('采购申请单高级搜索')">
                            {{ showAdvanced ? '收起' : '展开' }}
                            <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
                        </el-button>
                </div>
            </el-form>
        </div>

        <!-- 列表标题区 -->
        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">采购申请单列表</i>
                    <hir-input ref="hirInput" :printData="printData" :default-template="localPrintTemplate"
                        :template-params="{
                            // templateType: { $in: ['PR'] },
                            status: true
                        }" placeholder="请选择采购申请单打印模板" @template-change="handleTemplateChange" />
                </div>
            </div>
        </div>

        <!-- 表格部分 -->
        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @selection-change="handleSelectionChange" @handleCurrentChange="baseTableHandleCurrentChange"
            :cell-style="{ textAlign: 'center' }" @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">
                <!-- 展开行 -->
                <el-table-column type="expand">
                    <template slot-scope="props">
                        <el-table :data="props.row.FEntity || []" border style="width: 100%">
                            <!-- 物料信息 -->
                            <el-table-column label="物料编码" min-width="120">
                                <template slot-scope="scope">
                                    <el-tooltip :content="getMaterialName(scope.row.FMaterialId)" placement="top">
                                        <span>{{ getMaterialNumber(scope.row.FMaterialId) }}</span>
                                    </el-tooltip>
                                </template>
                            </el-table-column>
                            <el-table-column label="物料名称" min-width="150">
                                <template slot-scope="scope">
                                    {{ getMaterialName(scope.row.FMaterialId) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="规格型号" min-width="120">
                                <template slot-scope="scope">
                                    {{ getMaterialSpec(scope.row.FMaterialId) }}
                                </template>
                            </el-table-column>

                            <!-- 数量与单位 -->
                            <el-table-column label="申请单位" prop="FUnitId.Name" width="100" />
                            <el-table-column label="申请数量" prop="FReqQty" width="100" />
                            <el-table-column label="批准数量" prop="FApproveQty" width="100" />

                            <!-- 价格信息 -->
                            <el-table-column label="单价" width="100">
                                <template slot-scope="scope">
                                    {{ formatNumber(scope.row.FEvaluatePrice) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="含税单价" width="100">
                                <template slot-scope="scope">
                                    {{ formatNumber(scope.row.FTAXPRICE) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="税率" width="80">
                                <template slot-scope="scope">
                                    {{ scope.row.FTAXRATE }}%
                                </template>
                            </el-table-column>

                            <!-- 组织信息 -->
                            <el-table-column label="需求组织" min-width="150">
                                <template slot-scope="scope">
                                    {{ getOrgInfo(scope.row.FRequireOrgId) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="采购组织" min-width="150">
                                <template slot-scope="scope">
                                    {{ getOrgInfo(scope.row.FPurchaseOrgId) }}
                                </template>
                            </el-table-column>

                            <!-- 其他信息 -->
                            <el-table-column label="提前期" prop="FLeadTime" width="80" />
                            <el-table-column label="备注" prop="FEntryNote" min-width="150" />
                        </el-table>
                    </template>
                </el-table-column>

                <!-- 主表列 -->
                <el-table-column label="申请单号" prop="FBillNo" min-width="120" />
                <el-table-column label="申请组织" min-width="180">
                    <template slot-scope="scope">
                        <el-tooltip :content="getOrgInfo(scope.row.FApplicationOrgId)" placement="top">
                            <span>{{ getOrgInfo(scope.row.FApplicationOrgId) }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>

                <el-table-column label="申请部门" min-width="150">
                    <template slot-scope="scope">
                        <el-tooltip :content="getOrgInfo(scope.row.FApplicationDeptId)" placement="top">
                            <span>{{ getOrgInfo(scope.row.FApplicationDeptId) }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>

                <el-table-column label="单据状态" width="100">
                    <template slot-scope="scope">
                        <el-tag :type="getStatusType(scope.row.FDocumentStatus)">
                            {{ getStatusText(scope.row.FDocumentStatus) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="申请日期" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.FApplicationDate) }}
                    </template>
                </el-table-column>
                <el-table-column label="创建人" width="120" prop="FCreatorId.Name" />

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
                        <el-button type="text" size="small" v-if="$checkPermission('采购申请单同步')" @click="handleOneSync(scope.row)">同步</el-button>
                        <el-button type="text" size="small" v-if="$checkPermission('采购申请单拓展数据')" @click="handleExt(scope.row)">拓展数据</el-button>
                        <el-button type="text" size="small" v-if="$checkPermission('采购申请单物料明细')" @click="showMaterialDetail(scope.row)">物料明细</el-button>
                        <el-button type="text" size="small" v-if="$checkPermission('采购申请单打印')" @click="handlePrint(scope.row)">打印</el-button>
                       </template>
                </el-table-column>
            </template>
        </base-table>

        <!-- 物料明细对话框 -->
        <el-dialog title="物料明细" :visible.sync="materialDetailVisible" width="80%"
            :before-close="handleMaterialDetailClose">
            <material-detail v-if="materialDetailVisible" :order-data="currentOrderData"
                @close="handleMaterialDetailClose" />
        </el-dialog>

        <!-- 添加同步对话框 -->
        <el-dialog title="同步采购申请单" :visible.sync="syncDialogVisible" width="500px">
            <el-form :model="syncForm" ref="syncForm" label-width="100px">
                <el-form-item label="同步方式">
                    <el-radio-group v-model="syncForm.syncType">
                        <el-radio label="date">按日期同步</el-radio>
                        <el-radio label="billNo">按单号同步</el-radio>
                        <el-radio label="all">同步全部</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="申请日期" required v-if="syncForm.syncType === 'date'">
                    <el-date-picker v-model="syncForm.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" style="width: 100%">
                    </el-date-picker>
                </el-form-item>
                <el-form-item label="申请单号" required v-if="syncForm.syncType === 'billNo'">
                    <el-input v-model="syncForm.billNo" placeholder="请输入申请单号"></el-input>
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
            <requisition-bill-ext
                v-if="extDialogVisible"
                :order-data="currentOrderData"
                @close="extDialogVisible = false"
                @refresh="fetchData"
            />
        </el-dialog>
    </div>
</template>

<script>
import { getData } from "@/api/data";
import { syncPUR_RequisitionBill, getSyncStatus } from "@/api/K3Data";
import HirInput from '@/components/hirInput/index.vue'
import MaterialDetail from './components/MaterialDetail.vue'
import RequisitionBillExt from './components/RequisitionBillExt.vue'

export default {
    name: 'RequisitionBill',
    components: {
        HirInput,
        MaterialDetail,
        RequisitionBillExt
    },
    computed: {
        localPrintTemplate: {
            get() {
                try {
                    const savedTemplate = localStorage.getItem('printTemplate_requisitionBill');
                    return savedTemplate ? JSON.parse(savedTemplate) : null;
                } catch (error) {
                    console.error('解析缓存模板失败:', error);
                    return null;
                }
            },
            set(value) {
                try {
                    localStorage.setItem('printTemplate_requisitionBill', JSON.stringify(value));
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
                FApplicationOrgId: {
                    Number: ''
                },
                FApplicationDeptId: {
                    Number: ''
                },
                FDocumentStatus: '',
                FApplicantId: '',
                dateRange: [],
                FCreatorId: '',
                FMaterialId: '',
                createDateRange: []
            },
            tableList: [],
            total: 0,
            currentPage: 1,
            pageSize: 10,
            listLoading: true,
            showAdvanced: false,
            selection: [],
            syncProgressTimer: null,
            syncDialogVisible: false,
            syncForm: {
                syncType: 'date',
                dateRange: [],
                documentStatus: 'C',
                billNo: ''
            },
            materialDetailVisible: false,
            currentOrderData: {},
            printData: {},
            printTemplate: {},
            extDialogVisible: false,
            dictMap: {
                documentStatus: [
                    { label: '草稿', value: 'A' },
                    { label: '审核中', value: 'B' },
                    { label: '已审核', value: 'C' },
                    { label: '重新审核', value: 'D' }
                ]
            },
        }
    },
    methods: {
        // 获取组织信息
        getOrgInfo(org) {
            if (!org) return '';
            return org.Name || `${org.Number || ''} ${org.Name || ''}`.trim();
        },

        // 获取物料编号
        getMaterialNumber(material) {
            if (!material) return '';
            return material.FNumber || '';
        },

        // 获取物料名称
        getMaterialName(material) {
            if (!material) return '';
            return material.Name || '';
        },

        // 获取物料规格
        getMaterialSpec(material) {
            if (!material) return '';
            return material.Specification || '';
        },

        // 格式化数字
        formatNumber(num) {
            if (num === undefined || num === null) return '';
            return Number(num).toFixed(2);
        },

        // 格式化日期
        formatDate(date) {
            if (!date) return '';
            return date.substring(0, 10);
        },

        // 获取状态类型
        getStatusType(status) {
            const statusMap = {
                'A': 'info',    // 草稿
                'B': 'warning', // 审核中
                'C': 'success', // 已审核
                'D': 'danger'   // 重新审核
            };
            return statusMap[status] || 'info';
        },

        // 获取状态文本
        getStatusText(status) {
            const item = this.dictMap.documentStatus.find(item => item.value === status);
            return item ? item.label : '未知';
        },

        // 重置表单
        handleReset() {
            this.$refs.searchForm.resetFields();
            // 手动重置一些特殊字段
            this.searchForm = {
                FBillNo: '',
                FApplicationOrgId: {
                    Number: ''
                },
                FApplicationDeptId: {
                    Number: ''
                },
                FDocumentStatus: '',
                FApplicantId: '',
                dateRange: [],
                FCreatorId: '',
                FMaterialId: '',
                createDateRange: []
            };
            // 重置后自动查询
            this.currentPage = 1;
            this.fetchData();
        },

        // 处理同步按钮点击
        handleSync() {
            this.syncDialogVisible = true;
        },

        // 构建查询条件
        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };

            // 申请单号查询
            if (this.searchForm.FBillNo) {
                req.query.$and.push({
                    FBillNo: {
                        $regex: this.searchForm.FBillNo.trim(),
                        $options: 'i'
                    }
                });
            }

            // 申请组织查询
            if (this.searchForm.FApplicationOrgId.Number) {
                req.query.$and.push({
                    'FApplicationOrgId.Number': {
                        $regex: this.searchForm.FApplicationOrgId.Number.trim(),
                        $options: 'i'
                    }
                });
            }

            // 申请部门查询
            if (this.searchForm.FApplicationDeptId.Number) {
                req.query.$and.push({
                    'FApplicationDeptId.Number': {
                        $regex: this.searchForm.FApplicationDeptId.Number.trim(),
                        $options: 'i'
                    }
                });
            }

            // 单据状态查询
            if (this.searchForm.FDocumentStatus) {
                req.query.$and.push({
                    FDocumentStatus: this.searchForm.FDocumentStatus
                });
            }

            // 申请人查询
            if (this.searchForm.FApplicantId) {
                req.query.$and.push({
                    'FApplicantId.Name': {
                        $regex: this.searchForm.FApplicantId.trim(),
                        $options: 'i'
                    }
                });
            }

            // 创建人查询
            if (this.searchForm.FCreatorId) {
                req.query.$and.push({
                    'FCreatorId.Name': {
                        $regex: this.searchForm.FCreatorId.trim(),
                        $options: 'i'
                    }
                });
            }

            // 物料编码查询
            if (this.searchForm.FMaterialId) {
                req.query.$and.push({
                    'FEntity.FMaterialId.FNumber': {
                        $regex: this.searchForm.FMaterialId.trim(),
                        $options: 'i'
                    }
                });
            }

            // 申请日期范围查询
            if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
                req.query.$and.push({
                    FApplicationDate: {
                        $gte: this.searchForm.dateRange[0],
                        $lte: this.searchForm.dateRange[1]
                    }
                });
            }

            // 创建日期范围查询
            if (this.searchForm.createDateRange && this.searchForm.createDateRange.length === 2) {
                req.query.$and.push({
                    FCreateDate: {
                        $gte: this.searchForm.createDateRange[0],
                        $lte: this.searchForm.createDateRange[1]
                    }
                });
            }

            // 如果没有查询条件，删除 $and 数组
            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
        },

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

                const result = await getData("K3_PUR_RequisitionBill", req);

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

        // 分页方法
        baseTableHandleCurrentChange(currentPage) {
            this.currentPage = currentPage;
            this.fetchData();
        },

        baseTableHandleSizeChange(pageSize) {
            this.pageSize = pageSize;
            this.fetchData();
        },

        // 确认同步
        async confirmSync() {
            try {
                let req = {
                    FilterString: []
                };

                // 根据同步方式构建过滤条件
                if (this.syncForm.syncType === 'date' && this.syncForm.dateRange.length === 2) {
                    req.FilterString.push({
                        FieldName: "FDate",
                        Compare: ">=",
                        Value: this.syncForm.dateRange[0],
                        Logic: 1
                    }, {
                        FieldName: "FDate",
                        Compare: "<=",
                        Value: this.syncForm.dateRange[1],
                        Logic: 0
                    });
                } else if (this.syncForm.syncType === 'billNo' && this.syncForm.billNo) {
                    req.FilterString.push({
                        FieldName: "FBillNo",
                        Compare: "=",
                        Value: this.syncForm.billNo,
                        Logic: 0
                    });
                }

                if (this.syncForm.documentStatus && this.syncForm.syncType !== 'all') {
                    req.FilterString.push({
                        FieldName: "FDocumentStatus",
                        Compare: "=",
                        Value: this.syncForm.documentStatus,
                        Logic: 0
                    });
                }

                const response = await syncPUR_RequisitionBill(req);
                if (response.code === 200) {
                    this.startSyncProgressCheck();
                    this.syncDialogVisible = false;
                    if (response.taskStatus) {
                        this.$message.success(`同步中：当前${response.taskStatus.processedRecords}条数据同步完成，耗时${response.taskStatus.elapsedTime}秒`);
                    } else {
                        this.$message.success('同步任务已启动');
                    }
                } else {
                    this.$message.error(response.message || '采购申请单同步失败');
                }
            } catch (error) {
                console.error('同步失败:', error);
                this.$message.error('同步失败: ' + error.message);
            }
        },

        // 开始检查同步进度
        startSyncProgressCheck() {
            if (this.syncProgressTimer) {
                clearInterval(this.syncProgressTimer);
            }

            this.syncProgressTimer = setInterval(async () => {
                try {
                    const response = await getSyncStatus("K3_PUR_RequisitionBill");
                    if (response.code === 200) {
                        if (response.data.status === 'completed') {
                            this.$message.success('同步完成');
                            clearInterval(this.syncProgressTimer);
                            this.fetchData();
                        } else if (response.data.status === 'failed') {
                            this.$message.error('同步失败: ' + response.data.error);
                            clearInterval(this.syncProgressTimer);
                        }
                    }
                } catch (error) {
                    console.error('检查同步状态失败:', error);
                    clearInterval(this.syncProgressTimer);
                }
            }, 2000);
        },

        // 处理打印模板变更
        handleTemplateChange(template) {
            try {
                this.printTemplate = template;
                this.localPrintTemplate = template;
                this.$message.success('打印模板已保存到本地');
            } catch (error) {
                console.error('保存打印模板失败:', error);
                this.$message.error('保存打印模板失败');
            }
            // this.printTemplate = template;
            // this.localPrintTemplate = template;
        },

        // 处理打印
        async handlePrint(row) {

            if (!this.printTemplate) {
                this.$message.warning('请先选择打印模板');
                return;
            }
            let printData = row;
            // 发货通知单打印数据处理
            if (this.localPrintTemplate.templateType === 'DN') {
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
            }
            this.printData = printData;
            this.$nextTick(() => {
                this.$refs.hirInput.handlePrints();
            });
        },

        // 显示物料明细
        showMaterialDetail(row) {
            this.currentOrderData = row;
            this.materialDetailVisible = true;
        },

        // 关闭物料明细对话框
        handleMaterialDetailClose() {
            this.materialDetailVisible = false;
            this.currentOrderData = {};
        },

        // 处理表格选择变更
        handleSelectionChange(selection) {
            this.selection = selection;
        },

        // 处理拓展数据
        handleExt(row) {
            this.currentOrderData = row
            this.extDialogVisible = true
        },

        // 切换高级搜索
        toggleAdvanced() {
            this.showAdvanced = !this.showAdvanced;
        },

        // 处理查询按钮点击
        handleSearch() {
            this.currentPage = 1;
            this.fetchData();
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
    }
}
</script>

<style lang="scss" scoped>
.screen1 {
    background: #fff;
    padding: 16px;
    margin-bottom: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .screen_content_first {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;

        .el-form-item {
            margin-bottom: 0;
            margin-right: 10px;
            min-width: 200px;
        }
    }

    .screen_content_second {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed #ebeef5;

        .el-form-item {
            margin-bottom: 0;
            margin-right: 10px;
            min-width: 200px;
        }
    }

    .screen_content_second_one {
        display: flex;
        align-items: center;
        margin-top: 15px;
        gap: 10px;
    }
}

.el-icon-search {
    padding: 8px;
}

.el-icon-tickets {
    line-height: 30px;
}

.screen_content_first {
    width: 100%;
    padding: 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
}

.screen_content_second {
    width: 100%;
    padding: 10px;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
}

.screen_content_second_one {
    padding: 10px;
    display: flex;
    flex-direction: row;
    align-items: center;
}

.expert-detail-dialog {
    .expert-detail-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        padding: 10px;
    }

    .detail-card {
        margin: 10px;
        padding: 10px;
        border: 1px solid #ebeef5;
        border-radius: 5px;

        .card-header {
            font-weight: bold;
            font-size: 16px;
            color: #409EFF;
            margin-bottom: 10px;
        }
    }
}

.modern-expert-dialog {
    .expert-detail-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
        padding: 20px;
        background: #f5f7fa;
    }

    .detail-card {
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
        }

        .card-header {
            display: flex;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #ebeef5;
            background: linear-gradient(to right, #f0f2f5, #ffffff);

            i {
                margin-right: 8px;
                font-size: 18px;
                color: #409EFF;
            }

            span {
                font-size: 16px;
                font-weight: 600;
                background: linear-gradient(120deg, #409EFF, #36cfc9);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
        }
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
    }

    .stat-card {
        background: #f8fafc;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
        transition: all 0.3s ease;

        &:hover {
            transform: translateY(-2px);
            background: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .stat-value {
            font-size: 20px;
            font-weight: 600;
            color: #409EFF;
            margin-bottom: 8px;
        }

        .stat-label {
            font-size: 13px;
            color: #909399;
        }
    }
}

.search-header {
    padding: 10px 15px;
    background-color: #f5f7fa;
    border: 1px solid #ebeef5;
    border-bottom: none;
    border-radius: 5px 5px 0 0;
    display: flex;
    align-items: center;
}

.search-title {
    font-size: 16px;
    font-weight: 500;
    margin-left: 8px;
    color: #303133;
}

.search-container {
    padding: 15px;
    background-color: #fff;
    border: 1px solid #ebeef5;
    border-radius: 0 0 5px 5px;
    margin-bottom: 15px;
}

.button-group {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
}

.button-group .el-button {
    margin-left: 10px;
    margin-bottom: 5px;
}

.form-item {
    margin-bottom: 10px;
    width: 100%;
}

@media screen and (max-width: 1200px) {
    .el-col-6 {
        width: 50%;
    }
}

@media screen and (max-width: 768px) {
    .el-col-6 {
        width: 100%;
    }
}
</style>
