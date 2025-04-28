<template>
    <div class="app-container">
        <!-- 搜索表单 -->
        <div class="screen1">
            <el-form :model="searchForm" ref="searchForm" :inline="true" class="search-form">
                <div class="basic-search">
                    <el-form-item label="单据编号" prop="FBillNo">
                        <el-input v-model.trim="searchForm.FBillNo" placeholder="请输入单据编号" clearable></el-input>
                    </el-form-item>

                    <el-form-item label="生产订单号" prop="MoBillNo">
                        <el-input v-model.trim="searchForm.MoBillNo" placeholder="请输入生产订单号" clearable></el-input>
                    </el-form-item>

                    <el-form-item label="单据状态" prop="FDocumentStatus">
                        <el-select v-model="searchForm.FDocumentStatus" placeholder="请选择单据状态" clearable style="width: 160px">
                            <el-option label="草稿" value="A" />
                            <el-option label="审核中" value="B" />
                            <el-option label="已审核" value="C" />
                            <el-option label="重新审核" value="D" />
                        </el-select>
                    </el-form-item>

                    <el-form-item class="search-buttons">
                        <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
                        <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
                        <el-button type="warning" icon="el-icon-download" @click="handleSync">同步数据</el-button>
                        <el-button type="text" @click="showAdvanced = !showAdvanced">
                            {{ showAdvanced ? '收起' : '展开' }}高级搜索
                            <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
                        </el-button>
                    </el-form-item>
                </div>

                <!-- 高级搜索部分 -->
                <div v-if="showAdvanced" class="advanced-search">
                    <el-form-item label="生产组织" prop="FPrdOrgId">
                        <el-input
                            v-model.trim="searchForm.FPrdOrgId"
                            placeholder="请输入生产组织编号或名称"
                            clearable
                            style="width: 260px">
                        </el-input>
                    </el-form-item>

                    <el-form-item label="入库组织" prop="FStockOrgId">
                        <el-input
                            v-model.trim="searchForm.FStockOrgId"
                            placeholder="请输入入库组织编号或名称"
                            clearable
                            style="width: 260px">
                        </el-input>
                    </el-form-item>

                    <el-form-item label="创建日期" prop="dateRange">
                        <el-date-picker
                            v-model="searchForm.dateRange"
                            type="daterange"
                            range-separator="至"
                            start-placeholder="开始日期"
                            end-placeholder="结束日期"
                            value-format="yyyy-MM-dd"
                            style="width: 260px">
                        </el-date-picker>
                    </el-form-item>
                </div>
            </el-form>
        </div>

        <!-- 列表标题区 -->
        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">生产入库单列表</i>
                    <hir-input ref="hirInput" :printData="printData" :default-template="localPrintTemplate"
                        :template-params="{
                            status: true
                        }" placeholder="请选择生产入库单打印模板" @template-change="handleTemplateChange" />
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
                        <el-table :data="props.row.FEntity || []" border style="width: 100%"
                            v-loading="props.row.loading">
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
                            <el-table-column label="单位" prop="FUnitID.Name" width="100">
                                <template slot-scope="scope">
                                    {{ scope.row.FUnitID && scope.row.FUnitID.Number }}
                                </template>
                            </el-table-column>
                            <el-table-column label="应收数量" prop="FMustQty" width="100" />
                            <el-table-column label="实收数量" prop="FRealQty" width="100" />
                            <el-table-column label="基本单位实收数量" prop="FBaseRealQty" width="120" />

                            <!-- 仓储信息 -->
                            <el-table-column label="仓库" min-width="120">
                                <template slot-scope="scope">
                                    {{ scope.row.FStockId && scope.row.FStockId.Name }}
                                </template>
                            </el-table-column>
                            <el-table-column label="生产订单号" prop="FMoBillNo" min-width="120" />
                        </el-table>
                    </template>
                </el-table-column>

                <!-- 主表信息 -->
                <el-table-column prop="FBillNo" label="单据编号" min-width="120" />
                <el-table-column prop="FDate" label="单据日期" width="100">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.FDate) }}
                    </template>
                </el-table-column>
                <el-table-column label="生产组织" min-width="150">
                    <template slot-scope="scope">
                        {{ scope.row.FPrdOrgId && scope.row.FPrdOrgId.Name }}
                    </template>
                </el-table-column>
                <el-table-column label="入库组织" min-width="150">
                    <template slot-scope="scope">
                        {{ scope.row.FStockOrgId && scope.row.FStockOrgId.Name }}
                    </template>
                </el-table-column>
                <el-table-column prop="FDocumentStatus" label="单据状态" width="100">
                    <template slot-scope="scope">
                        {{ getDocumentStatus(scope.row.FDocumentStatus) }}
                    </template>
                </el-table-column>
                <!-- <el-table-column label="创建人" width="100">
                    <template slot-scope="scope">
                        {{ scope.row.FCreatorId && scope.row.FCreatorId.Name }}
                    </template>
                </el-table-column>
                <el-table-column prop="FCreateDate" label="创建日期" width="180">
                    <template slot-scope="scope">
                        {{ formatDateTime(scope.row.FCreateDate) }}
                    </template>
                </el-table-column> -->
                <el-table-column label="操作" fixed="right" width="220">
                    <template slot-scope="scope">
                        <el-button type="text" size="small" v-if="$checkPermission('生产入库单同步')" @click="handleOneSync(scope.row)">同步</el-button>
                        <el-button type="text" size="small" v-if="$checkPermission('生产入库单打印')" @click="handlePrint(scope.row)">打印</el-button>
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <!-- 添加同步数据弹窗 -->
        <el-dialog title="同步生产入库单" :visible.sync="syncDialogVisible" width="500px">
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
                <el-form-item label="入库单号" required v-if="syncForm.syncType === 'billNo'">
                    <el-input v-model="syncForm.billNo" placeholder="请输入入库单号"></el-input>
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
    </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import { syncPRD_InStock, getSyncStatus } from "@/api/K3Data";
import BaseTable from '@/components/BaseTable'
import HirInput from '@/components/hirInput'
import { formatDate, formatDateTime } from '@/utils/date'

export default {
    name: 'ProductionInStock',
    components: {
        BaseTable,
        HirInput
    },
    data() {
        return {
            searchForm: {
                FBillNo: '',
                MoBillNo: '',
                FDocumentStatus: '',
                FPrdOrgId: '',
                FStockOrgId: '',
                dateRange: []
            },
            showAdvanced: false,
            currentPage: 1,
            pageSize: 20,
            total: 0,
            tableList: [],
            listLoading: false,
            multipleSelection: [],
            printData: {},
            localPrintTemplate: '',
            syncDialogVisible: false,
            syncForm: {
                syncType: 'date',
                dateRange: [],
                documentStatus: 'C',
                billNo: ''
            },
            syncProgressTimer: null,
            orgOptions: [],
            orgLoading: false,
        }
    },
    computed: {
        localPrintTemplate: {
            get() {
                try {
                    const savedTemplate = localStorage.getItem('printTemplate_inStock');
                    return savedTemplate ? JSON.parse(savedTemplate) : null;
                } catch (error) {
                    console.error('解析缓存模板失败:', error);
                    return null;
                }
            },
            set(value) {
                try {
                    localStorage.setItem('printTemplate_inStock', JSON.stringify(value));
                } catch (error) {
                    console.error('保存模板到缓存失败:', error);
                }
            }
        }
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

                const result = await getData("K3_PRD_InStock", req);

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

        // 获取组织列表
        async getOrgList() {
            this.orgLoading = true;
            try {
                const result = await getData("K3_Organization", {
                    query: {},
                    sort: { Number: 1 }
                });
                if (result.code === 200) {
                    this.orgOptions = result.data.map(org => ({
                        value: org.Number,
                        label: org.Name,
                        ...org
                    }));
                } else {
                    this.$message.error(result.msg || '获取组织列表失败');
                }
            } catch (error) {
                console.error('获取组织列表失败:', error);
                this.$message.error('获取组织列表失败');
            } finally {
                this.orgLoading = false;
            }
        },

        // 处理组织选择
        handleOrgSelect(type, value) {
            if (!value) {
                if (type === 'prd') {
                    this.searchForm.FPrdOrgId = '';
                } else {
                    this.searchForm.FStockOrgId = '';
                }
                return;
            }

            const selectedOrg = this.orgOptions.find(org => org.value === value);
            if (selectedOrg) {
                if (type === 'prd') {
                    this.searchForm.FPrdOrgId = selectedOrg.Number;
                } else {
                    this.searchForm.FStockOrgId = selectedOrg.Number;
                }
            }
        },

        // 构建查询参数
        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };

            // 单据编号查询
            if (this.searchForm.FBillNo) {
                req.query.$and.push({ FBillNo: { $regex: this.searchForm.FBillNo.trim(), $options: 'i' } });
            }

            // 生产订单号查询
            if (this.searchForm.MoBillNo) {
                req.query.$and.push({ 'FEntity.FMoBillNo': { $regex: this.searchForm.MoBillNo.trim(), $options: 'i' } });
            }

            // 单据状态查询
            if (this.searchForm.FDocumentStatus) {
                req.query.$and.push({ FDocumentStatus: this.searchForm.FDocumentStatus });
            }

            // 生产组织查询
            if (this.searchForm.FPrdOrgId) {
                req.query.$and.push({
                    $or: [
                        { 'FPrdOrgId.Number': { $regex: this.searchForm.FPrdOrgId.trim(), $options: 'i' } },
                        { 'FPrdOrgId.Name': { $regex: this.searchForm.FPrdOrgId.trim(), $options: 'i' } }
                    ]
                });
            }

            // 入库组织查询
            if (this.searchForm.FStockOrgId) {
                req.query.$and.push({
                    $or: [
                        { 'FStockOrgId.Number': { $regex: this.searchForm.FStockOrgId.trim(), $options: 'i' } },
                        { 'FStockOrgId.Name': { $regex: this.searchForm.FStockOrgId.trim(), $options: 'i' } }
                    ]
                });
            }

            // 创建日期范围查询
            if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
                const [startDate, endDate] = this.searchForm.dateRange;
                req.query.$and.push({
                    FCreateDate: {
                        $gte: `${startDate} 00:00:00`,
                        $lte: `${endDate} 23:59:59`
                    }
                });
            }

            // 如果没有查询条件，删除 $and 数组
            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
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

                const response = await syncSAL_DeliveryNotice(req);
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
        // 触发同步弹窗
        handleSync() {
            this.syncDialogVisible = true;
            this.syncForm = {
                syncType: 'date',
                dateRange: [],
                documentStatus: 'C',
                billNo: ''
            };
        },

        // 确认同步
        async confirmSync() {
            if (this.syncForm.syncType === 'date' && (!this.syncForm.dateRange || this.syncForm.dateRange.length !== 2)) {
                this.$message.warning('请选择审核日期范围');
                return;
            }
            if (this.syncForm.syncType === 'billNo' && !this.syncForm.billNo) {
                this.$message.warning('请输入入库单号');
                return;
            }

            try {
                let confirmMessage = '';
                switch (this.syncForm.syncType) {
                    case 'all':
                        confirmMessage = '确认要同步所有生产入库单数据吗？此操作可能需要较长时间';
                        break;
                    case 'date':
                        confirmMessage = '确认要同步规则筛选的生产入库单数据吗？';
                        break;
                    case 'billNo':
                        confirmMessage = `确认要同步单号为 ${this.syncForm.billNo} 的生产入库单数据吗？`;
                        break;
                }

                await this.$confirm(confirmMessage, '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });

                const loading = this.$loading({
                    lock: true,
                    text: '正在启动同步任务...',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                try {
                    let req = {
                        "FilterString": []
                    };

                    switch (this.syncForm.syncType) {
                        case 'date':
                            const [startDate, endDate] = this.syncForm.dateRange;
                            req.FilterString = [
                                {
                                    "FieldName": "FDocumentStatus",
                                    "Compare": "StatusEqualto",
                                    "Value": this.syncForm.documentStatus,
                                    "Left": "",
                                    "Right": "",
                                    "Logic": 0
                                },
                                {
                                    "FieldName": "FCreateDate",
                                    "Compare": ">",
                                    "Value": `${startDate} 00:00:00`,
                                    "Left": "",
                                    "Right": "",
                                    "Logic": 0
                                },
                                {
                                    "FieldName": "FCreateDate",
                                    "Compare": "<",
                                    "Value": `${endDate} 23:59:59`,
                                    "Left": "",
                                    "Right": "",
                                    "Logic": "0"
                                }
                            ];
                            break;
                        case 'billNo':
                            req.FilterString = [
                                {
                                    "FieldName": "FBillNo",
                                    "Compare": "=",
                                    "Value": this.syncForm.billNo,
                                    "Left": "",
                                    "Right": "",
                                    "Logic": 0
                                }
                            ];
                            break;
                        case 'all':
                            req.FilterString = [
                                {
                                    "FieldName": "FDocumentStatus",
                                    "Compare": "StatusEqualto",
                                    "Value": "C",
                                    "Left": "",
                                    "Right": "",
                                    "Logic": 0
                                }
                            ];
                            break;
                    }

                    const response = await syncPRD_InStock(req);
                    if (response.code === 200) {
                        this.syncDialogVisible = false;
                        loading.close();
                        this.startSyncProgressCheck();
                        if (response.taskStatus) {
                            this.$message.success(`同步中：当前${response.taskStatus.processedRecords}条数据同步完成，耗时${response.taskStatus.elapsedTime}秒`);
                        } else {
                            this.$message.success('同步任务已启动');
                        }
                    } else {
                        loading.close();
                        this.$message.error(response.message || '同步失败');
                    }
                } catch (error) {
                    loading.close();
                    console.error('同步失败:', error);
                    this.$message.error('同步失败: ' + error.message);
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('同步失败:', error);
                    this.$message.error('同步失败');
                }
            }
        },

        // 开始定时查询同步进度
        startSyncProgressCheck() {
            if (this.syncProgressTimer) {
                clearInterval(this.syncProgressTimer);
            }

            this.syncProgressTimer = setInterval(async () => {
                try {
                    const response = await getSyncStatus('PRD_InStock');
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
                                case 'no_task':
                                case 'completed':
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

        // 停止定时查询
        stopSyncProgressCheck() {
            if (this.syncProgressTimer) {
                clearInterval(this.syncProgressTimer);
                this.syncProgressTimer = null;
            }
        },

        // 组件销毁时清理定时器
        beforeDestroy() {
            this.stopSyncProgressCheck();
        },

        // 处理搜索
        handleSearch() {
            this.currentPage = 1; // 重置页码到第一页
            this.fetchData();
        },

        // 处理重置
        handleReset() {
            this.$refs.searchForm.resetFields();
            this.searchForm = {
                FBillNo: '',
                MoBillNo: '',
                FDocumentStatus: '',
                FPrdOrgId: '',
                FStockOrgId: '',
                dateRange: []
            };
            this.currentPage = 1;
            this.fetchData();
        },

        // 表格相关方法
        handleSelectionChange(val) {
            this.multipleSelection = val
            this.printData = val
        },

        baseTableHandleCurrentChange(val) {
            this.currentPage = val
            this.fetchData()
        },

        baseTableHandleSizeChange(val) {
            this.pageSize = val
            this.fetchData()
        },

        // 打印模板相关
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

        // 工具方法
        formatDate,
        formatDateTime,

        getMaterialNumber(material) {
            return material && material.Number || ''
        },

        getMaterialName(material) {
            return material && material.Name[0].Value || ''
        },

        getMaterialSpec(material) {
            return material && material.Specification[0].Value || ''
        },

        getDocumentStatus(status) {
            const statusMap = {
                'A': '草稿',
                'B': '审核中',
                'C': '已审核',
                'D': '重新审核'
            }
            return statusMap[status] || status
        },

        async handlePrint(row) {
            let printData = { ...row };

            //入库组织
            printData.FStockOrgId_Name = printData.FStockOrgId && printData.FStockOrgId.Name;
            // 生产入库单打印数据处理
            printData.FApproveDate = this.formatDate(printData.FApproveDate);
            printData.FCreateDate = this.formatDate(printData.FCreateDate);
            // 处理明细数据
            printData.FEntity = printData.FEntity.map((item, index) => ({
                ...item,
                FNum: index + 1,
                FMaterialID_Name: item.FMaterialId && item.FMaterialId.Name[0].Value,
                FMaterialID_Number: item.FMaterialId && item.FMaterialId.Number,
                FMaterialID_Specification: item.FMaterialId && item.FMaterialId.Specification[0].Value,
                FUnitID_Name: item.FUnitID && item.FUnitID.Name[0].Value
            }));
            console.log(printData, 'printData')
            this.printData = JSON.parse(JSON.stringify(printData));
            this.$nextTick(() => {
                this.$refs.hirInput.handlePrints();
            });
        },
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
        box-shadow: 0 2px 12px 0 rgba(0,0,0,.05);

        .search-form {
            .basic-search {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                align-items: center;

                .el-form-item {
                    margin-bottom: 0;
                    margin-right: 0;
                }

                .search-buttons {
                    margin-left: auto;
                    white-space: nowrap;
                }
            }

            .advanced-search {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px dashed #dcdfe6;
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                align-items: center;

                .el-form-item {
                    margin-bottom: 0;
                    margin-right: 0;
                }
            }
        }

        .screen_content {
            display: flex;
            justify-content: space-between;
            align-items: center;

            &_first {
                display: flex;
                align-items: center;
                gap: 10px;

                i {
                    font-size: 16px;
                    margin-right: 5px;
                }
            }
        }
    }

    :deep(.el-table) {
        .el-table__expanded-cell {
            padding: 10px;
        }
    }
}
</style>
