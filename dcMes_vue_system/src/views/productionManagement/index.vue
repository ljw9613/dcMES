<template>
    <div class="app-container">
        <el-card class="filter-container">
            <div slot="header" class="clearfix">
                <span>筛选搜索</span>
                <el-button style="float: right; padding: 3px 0" type="text" @click="toggleAdvanced">
                    {{ showAdvanced ? '收起' : '展开' }}高级搜索
                </el-button>
            </div>

            <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="单据编号">
                            <el-input v-model="searchForm.FBillNo" placeholder="请输入单据编号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="单据状态">
                            <el-select v-model="searchForm.FDocumentStatus" placeholder="请选择单据状态" clearable
                                style="width: 100%">
                                <el-option label="草稿" value="DRAFT" />
                                <el-option label="已审核" value="APPROVED" />
                                <el-option label="审核中" value="PROCESSING" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="物料编码">
                            <el-input v-model="searchForm.FMaterialId" placeholder="请输入物料编码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="物料名称">
                            <el-input v-model="searchForm.FMaterialName" placeholder="请输入物料名称" clearable></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="生产车间">
                            <el-input v-model="searchForm.FWorkShopID_FName" placeholder="请输入生产车间" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="产品类型">
                            <el-select v-model="searchForm.FProductType" placeholder="请选择产品类型" clearable
                                style="width: 100%">
                                <el-option v-for="dict in dict.type.product_type" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="计划日期">
                            <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd"
                                style="width: 100%">
                            </el-date-picker>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <el-button type="success" @click="exportData">导出数据</el-button>
                    <el-button type="warning" @click="handleSync">同步订单</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">生产管理列表</i>
                </div>
            </div>
        </div>

        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @selection-change="handleSelectionChange" @handleCurrentChange="baseTableHandleCurrentChange"
            @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">
                <el-table-column label="单据编号" width="150">
                    <template slot-scope="scope">
                        <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.FBillNo }}</el-link>
                    </template>
                </el-table-column>

                <el-table-column label="单据状态" width="100">
                    <template slot-scope="scope">
                        <el-tag :type="getStatusType(scope.row.FDocumentStatus)">
                            {{ getStatusText(scope.row.FDocumentStatus) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="单据日期" width="120">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.FDate) }}
                    </template>
                </el-table-column>

                <el-table-column label="生产车间" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FWorkShopID_FName }}
                    </template>
                </el-table-column>

                <el-table-column label="物料编码" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FMaterialId }}
                    </template>
                </el-table-column>

                <el-table-column label="物料名称" width="200">
                    <template slot-scope="scope">
                        {{ scope.row.FMaterialName }}
                    </template>
                </el-table-column>

                <el-table-column label="规格型号" width="150">
                    <template slot-scope="scope">
                        {{ scope.row.FSpecification }}
                    </template>
                </el-table-column>

                <el-table-column label="产品类型" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FProductType }}
                    </template>
                </el-table-column>

                <el-table-column label="单位" width="80">
                    <template slot-scope="scope">
                        {{ scope.row.FUnitId }}
                    </template>
                </el-table-column>

                <el-table-column label="数量" width="100">
                    <template slot-scope="scope">
                        {{ scope.row.FQty }}
                    </template>
                </el-table-column>

                <el-table-column label="计划开工时间" width="150">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.FPlanStartDate) }}
                    </template>
                </el-table-column>

                <el-table-column label="计划完工时间" width="150">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.FPlanFinishDate) }}
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <!-- 添加同步订单弹窗 -->
        <el-dialog title="同步生产订单" :visible.sync="syncDialogVisible" width="500px">
            <el-form :model="syncForm" ref="syncForm" label-width="100px">
                <el-form-item label="同步方式">
                    <el-radio-group v-model="syncForm.syncType">
                        <el-radio label="date">按日期同步</el-radio>
                        <el-radio label="all">同步全部</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="审核日期" required v-if="syncForm.syncType === 'date'">
                    <el-date-picker
                        v-model="syncForm.dateRange"
                        type="daterange"
                        range-separator="至"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        value-format="yyyy-MM-dd"
                        style="width: 100%">
                    </el-date-picker>
                </el-form-item>
                <el-form-item label="单据状态">
                    <el-select :disabled="syncForm.syncType === 'all'" v-model="syncForm.documentStatus" placeholder="请选择单据状态" style="width: 100%">
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
import { syncPRD_MO, getSyncStatus } from "@/api/K3Data";

export default {
    name: 'ProductionOrder',
    dicts: ['product_type'],
    data() {
        return {
            searchForm: {
                FBillNo: '',
                FDocumentStatus: '',
                FMaterialId: '',
                FMaterialName: '',
                FWorkShopID_FName: '',
                FProductType: '',
                dateRange: []
            },
            tableList: [],
            total: 0,
            currentPage: 1,
            pageSize: 10,
            listLoading: true,
            showAdvanced: false,
            dialogFormVisible: false,
            dialogStatus: '',
            detailDialogVisible: false,
            selection: [], // 存储选中的订单
            dataForm: {
                FBillNo: '',
                FDocumentStatus: '',
                FDate: '',
                FWorkShopID_FName: '',
                FMaterialId: '',
                FMaterialName: '',
                FSpecification: '',
                FProductType: '',
                FUnitId: '',
                FQty: 0,
                FPlanStartDate: '',
                FPlanFinishDate: ''
            },
            syncProgressTimer: null,
            syncDialogVisible: false,
            syncForm: {
                syncType: 'date',
                dateRange: [],
                documentStatus: 'C'
            }
        }
    },
    methods: {
        // 获取状态标签类型
        getStatusType(status) {
            const statusMap = {
                'DRAFT': 'info',
                'APPROVED': 'success',
                'PROCESSING': 'warning'
            }
            return statusMap[status] || 'info'
        },

        // 获取状态显示文本
        getStatusText(status) {
            const statusMap = {
                'DRAFT': '草稿',
                'APPROVED': '已审核',
                'PROCESSING': '审核中'
            }
            return statusMap[status] || status
        },

        // 构建查询条件
        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };

            // 基础字段查询
            if (this.searchForm.FBillNo) {
                req.query.$and.push({ FBillNo: { $regex: this.searchForm.FBillNo, $options: 'i' } });
            }
            if (this.searchForm.FDocumentStatus) {
                req.query.$and.push({ FDocumentStatus: this.searchForm.FDocumentStatus });
            }
            if (this.searchForm.FMaterialId) {
                req.query.$and.push({ FMaterialId: { $regex: this.searchForm.FMaterialId, $options: 'i' } });
            }
            if (this.searchForm.FMaterialName) {
                req.query.$and.push({ FMaterialName: { $regex: this.searchForm.FMaterialName, $options: 'i' } });
            }
            if (this.searchForm.FWorkShopID_FName) {
                req.query.$and.push({ FWorkShopID_FName: { $regex: this.searchForm.FWorkShopID_FName, $options: 'i' } });
            }
            if (this.searchForm.FProductType) {
                req.query.$and.push({ FProductType: this.searchForm.FProductType });
            }

            // 处理日期范围查询
            if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
                req.query.$and.push({
                    FPlanStartDate: {
                        $gte: new Date(this.searchForm.dateRange[0]),
                        $lte: new Date(this.searchForm.dateRange[1])
                    }
                });
            }

            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
        },

        // 重置表单
        resetForm() {
            this.$refs.searchForm.resetFields();
            this.searchForm = {
                FBillNo: '',
                FDocumentStatus: '',
                FMaterialId: '',
                FMaterialName: '',
                FWorkShopID_FName: '',
                FProductType: '',
                dateRange: []
            };
            this.currentPage = 1;
            this.fetchData();
        },

        // 获取数据
        async fetchData() {
            this.listLoading = true;
            try {
                let req = this.searchData();
                req.page = this.currentPage;
                req.skip = (this.currentPage - 1) * this.pageSize;
                req.limit = this.pageSize;
                req.count = true;
                const result = await getData("k3_PRD_MO", req);
                this.tableList = result.data;
                this.total = result.countnum;
            } catch (error) {
                console.error('获取数据失败:', error);
                this.$message.error('获取数据失败');
            } finally {
                this.listLoading = false;
            }
        },

        // 导出数据
        async exportData() {
            try {
                this.$message({
                    message: '正在导出数据,请稍候...',
                    type: 'info'
                });

                const loading = this.$loading({
                    lock: true,
                    text: '导出中...',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                let req = this.searchData();
                req.limit = 1000000;
                const response = await getData("k3_PRD_MO", req);

                if (!response.data || response.data.length === 0) {
                    this.$message.warning('没有数据可供导出');
                    loading.close();
                    return;
                }

                // 导出配置
                const exportConfig = {
                    FBillNo: '单据编号',
                    FDocumentStatus: '单据状态',
                    FDate: '单据日期',
                    FWorkShopID_FName: '生产车间',
                    FMaterialId: '物料编码',
                    FMaterialName: '物料名称',
                    FSpecification: '规格型号',
                    FProductType: '产品类型',
                    FUnitId: '单位',
                    FQty: '数量',
                    FPlanStartDate: '计划开工时间',
                    FPlanFinishDate: '计划完工时间'
                };

                // 处理数据
                const processedData = response.data.map(item => {
                    const row = {};
                    Object.keys(exportConfig).forEach(key => {
                        if (key.includes('Date')) {
                            row[exportConfig[key]] = this.formatDate(item[key]);
                        } else {
                            row[exportConfig[key]] = item[key];
                        }
                    });
                    return row;
                });

                // 创建工作簿
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(processedData);

                // 设置列宽
                const colWidths = Object.values(exportConfig).map(header => ({
                    wch: Math.max(header.length * 2, 15)
                }));
                ws['!cols'] = colWidths;

                // 添加工作表到工作簿
                XLSX.utils.book_append_sheet(wb, ws, '生产订单数据');

                // 下载文件
                XLSX.writeFile(wb, '生产订单数据.xlsx');
                loading.close();
                this.$message.success('导出成功');
            } catch (error) {
                console.error('导出失败:', error);
                this.$message.error('导出失败');
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

        // 切换高级搜索
        toggleAdvanced() {
            this.showAdvanced = !this.showAdvanced;
        },

        // 格式化日期
        formatDate(date) {
            if (!date) return '暂无数据';
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                return '无效日期';
            }
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        // 格式化数字
        formatNumber(num) {
            if (!num && num !== 0) return '0';
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },

        // 搜索方法
        search() {
            this.currentPage = 1; // 重置页码到第一页
            this.fetchData(); // 获取数据
        },

        // 选择项改变
        handleSelectionChange(selection) {
            this.selection = selection;
        },

        // 查看详情
        handleView(row) {
            this.dataForm = JSON.parse(JSON.stringify(row));
            this.dialogStatus = 'view';
            this.dialogFormVisible = true;
        },

        // 编辑
        handleEdit(row) {
            this.dataForm = JSON.parse(JSON.stringify(row));
            this.dialogStatus = 'edit';
            this.dialogFormVisible = true;
        },

        // 删除
        handleDelete(row) {
            this.$confirm('确认要删除该生产订单吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData('k3_PRD_MO', row._id);
                    this.$message.success('删除成功');
                    this.fetchData();
                } catch (error) {
                    console.error('删除失败:', error);
                    this.$message.error('删除失败');
                }
            }).catch(() => {
                this.$message.info('已取消删除');
            });
        },

        // 提交表单
        async handleSubmit(formData) {
            try {
                if (this.dialogStatus === 'edit') {
                    await updateData('k3_PRD_MO', formData._id, formData);
                    this.$message.success('更新成功');
                } else {
                    await addData('k3_PRD_MO', formData);
                    this.$message.success('添加成功');
                }
                this.dialogFormVisible = false;
                this.fetchData();
            } catch (error) {
                console.error('操作失败:', error);
                this.$message.error('操作失败');
            }
        },

        // 修改现有的 handleSync 方法
        handleSync() {
            this.syncDialogVisible = true;
            this.syncForm = {
                syncType: 'date',
                dateRange: [],
                documentStatus: 'C'
            };
        },

        // 添加确认同步方法
        async confirmSync() {
            if (this.syncForm.syncType === 'date' && (!this.syncForm.dateRange || this.syncForm.dateRange.length !== 2)) {
                this.$message.warning('请选择审核日期范围');
                return;
            }

            try {
                const confirmMessage = this.syncForm.syncType === 'all' 
                    ? '确认要同步所有生产订单数据吗？此操作可能需要较长时间' 
                    : '确认要同步选定日期范围的生产订单数据吗？此操作可能需要一些时间';

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

                    if (this.syncForm.syncType === 'date') {
                        const [startDate, endDate] = this.syncForm.dateRange;
                        req.FilterString = [
                            {
                                "FieldName": "FDocumentStatus",
                                "Compare": "105",
                                "Value": this.syncForm.documentStatus,
                                "Left": "",
                                "Right": "",
                                "Logic": 0
                            },
                            {
                                "FieldName": "FApproveDate",
                                "Compare": "88",
                                "Value": `${startDate} 00:00:00`,
                                "Left": "",
                                "Right": "",
                                "Logic": 0
                            },
                            {
                                "FieldName": "FApproveDate",
                                "Compare": "32",
                                "Value": `${endDate} 23:59:59`,
                                "Left": "",
                                "Right": "",
                                "Logic": "0"
                            }
                        ];
                    } else {
                        // 同步全部数据时，只需要单据状态条件
                        // req.FilterString = [
                        //     {
                        //         "FieldName": "FDocumentStatus",
                        //         "Compare": "105",
                        //         "Value": "C", // 全量同步时默认只同步已审核的数据
                        //         "Left": "",
                        //         "Right": "",
                        //         "Logic": 0
                        //     }
                        // ];
                    }

                    const response = await syncPRD_MO(req);
                    if (response.code === 200) {
                        this.syncDialogVisible = false;
                        loading.close();
                        if (response.taskStatus) {
                            this.startSyncProgressCheck();
                            this.$message.success(`同步中：当前${response.taskStatus.processedRecords}条数据同步完成，耗时${response.taskStatus.elapsedTime}秒`);
                        } else {
                            this.$message.success('同步任务已启动');
                        }
                    } else {
                        loading.close();
                        this.$message.error(response.message || '生产订单同步失败');
                    }
                } catch (error) {
                    loading.close();
                    console.error('生产订单同步失败:', error);
                    this.$message.error('生产订单同步失败: ' + error.message);
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('操作失败:', error);
                    this.$message.error('操作失败');
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
                    const response = await getSyncStatus('k3_PRD_MO');
                    if (response.code === 200) {
                        const productionTask = response.taskStatus;
                        if (productionTask) {
                            switch (productionTask.status) {
                                case 'running':
                                    this.$notify({
                                        type: 'info',
                                        message: `同步中：当前${productionTask.processedRecords}条数据同步完成，耗时${productionTask.elapsedTime}秒`,
                                        duration: 5000
                                    });
                                    break;

                                case 'no_task':
                                    this.$message.success(`同步完成！`);
                                    this.stopSyncProgressCheck();
                                    this.fetchData();
                                    break;

                                default:
                                    this.$message.warning('未知的同步状态');
                                    this.stopSyncProgressCheck();
                            }
                        } else {
                            this.$message.warning('未找到生产订单同步任务');
                            this.stopSyncProgressCheck();
                        }
                    }
                } catch (error) {
                    console.error('查询同步进度失败:', error);
                    this.$message.error('查询同步进度失败');
                    this.stopSyncProgressCheck();
                }
            }, 10000);
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
    },
    created() {
        this.fetchData();
    }
}
</script>

<style lang="scss" scoped>
.screen1 {
    height: auto;
    margin: 2vw 0;
    width: 100%;
    border: 1px solid #ebeef5;
    border-radius: 5px;
}

.screen_content_first {
    width: 100%;
    padding: 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
}

.el-icon-search {
    padding: 8px;
}

.el-icon-tickets {
    line-height: 30px;
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
</style>