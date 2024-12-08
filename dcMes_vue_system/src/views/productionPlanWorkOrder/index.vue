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
                        <el-form-item label="工单号">
                            <el-input v-model="searchForm.workOrderNo" placeholder="请输入工单号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="工单状态">
                            <el-select v-model="searchForm.status" placeholder="请选择工单状态" clearable style="width: 100%">
                                <el-option label="待生产" value="PENDING" />
                                <el-option label="生产中" value="IN_PROGRESS" />
                                <el-option label="已完成" value="COMPLETED" />
                                <el-option label="已取消" value="CANCELLED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="销售单号">
                            <el-input v-model="searchForm.saleOrderNo" placeholder="请输入销售单号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="生产单号">
                            <el-input v-model="searchForm.productionOrderNo" placeholder="请输入生产单号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="产品型号">
                            <el-input v-model="searchForm.productModel" placeholder="请输入产品型号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="产线名称">
                            <el-input v-model="searchForm.lineName" placeholder="请输入产线名称" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="业务类型">
                            <el-select v-model="searchForm.businessType" placeholder="请选择业务类型" clearable
                                style="width: 100%">
                                <el-option label="正常生产" value="NORMAL" />
                                <el-option label="返工" value="REWORK" />
                                <el-option label="样品" value="SAMPLE" />
                                <el-option label="其他" value="OTHER" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="计划时间">
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
                    <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增工单</el-button>
                    <el-button type="danger" icon="el-icon-delete" :disabled="!selection.length"
                        @click="handleBatchDelete">
                        批量删除
                    </el-button>
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
                <el-table-column type="selection" width="55" />

                <el-table-column label="工单号" width="150">
                    <template slot-scope="scope">
                        <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.workOrderNo }}</el-link>
                    </template>
                </el-table-column>

                <el-table-column label="工单状态" width="100">
                    <template slot-scope="scope">
                        <el-tag :type="getStatusType(scope.row.status)">
                            {{ getStatusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="销售单号" width="150">
                    <template slot-scope="scope">
                        {{ scope.row.saleOrderNo }}
                    </template>
                </el-table-column>

                <el-table-column label="生产单号" width="150">
                    <template slot-scope="scope">
                        {{ scope.row.productionOrderNo }}
                    </template>
                </el-table-column>

                <el-table-column label="产品型号" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.productModel }}
                    </template>
                </el-table-column>

                <el-table-column label="产品名称" width="200">
                    <template slot-scope="scope">
                        {{ scope.row.productName }}
                    </template>
                </el-table-column>

                <el-table-column label="产线名称" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.lineName }}
                    </template>
                </el-table-column>

                <el-table-column label="业务类型" width="100">
                    <template slot-scope="scope">
                        {{ getBusinessTypeText(scope.row.businessType) }}
                    </template>
                </el-table-column>

                <el-table-column label="计划数量" width="100">
                    <template slot-scope="scope">
                        {{ scope.row.planQuantity }}
                    </template>
                </el-table-column>

                <el-table-column label="投入数量" width="100">
                    <template slot-scope="scope">
                        {{ scope.row.inputQuantity }}
                    </template>
                </el-table-column>

                <el-table-column label="产出数量" width="100">
                    <template slot-scope="scope">
                        {{ scope.row.outputQuantity }}
                    </template>
                </el-table-column>

                <el-table-column label="计划开始时间" width="150">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.planStartTime) }}
                    </template>
                </el-table-column>

                <el-table-column label="计划结束时间" width="150">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.planEndTime) }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="180" fixed="right">
                    <template slot-scope="scope">
                        <el-button type="text" size="small" @click="handleEdit(scope.row)">
                            <i class="el-icon-edit"></i> 编辑
                        </el-button>
                        <el-button type="text" size="small" class="delete-btn" @click="handleDelete(scope.row)">
                            <i class="el-icon-delete"></i> 删除
                        </el-button>
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <edit-dialog :visible.sync="dialogFormVisible" :dialog-status="dialogStatus" :row-data="dataForm"
            @submit="handleSubmit" />

    </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import EditDialog from './components/EditDialog'

export default {
    name: 'ProductionOrder',
    dicts: ['product_type'],
    components: {
        EditDialog
    },
    data() {
        return {
            searchForm: {
                workOrderNo: '',
                status: '',
                saleOrderNo: '',
                productionOrderNo: '',
                productModel: '',
                lineName: '',
                businessType: '',
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
            selection: [], // 存储选中的记录
            dataForm: {}
        }
    },
    methods: {
        // 获取状态标签类型
        getStatusType(status) {
            const statusMap = {
                'PENDING': 'info',
                'IN_PROGRESS': 'warning',
                'COMPLETED': 'success',
                'CANCELLED': 'danger'
            }
            return statusMap[status] || 'info'
        },

        // 获取状态显示文本
        getStatusText(status) {
            const statusMap = {
                'PENDING': '待生产',
                'IN_PROGRESS': '生产中',
                'COMPLETED': '已完成',
                'CANCELLED': '已取消'
            }
            return statusMap[status] || status
        },

        // 获取业务类型显示文本
        getBusinessTypeText(type) {
            const typeMap = {
                'NORMAL': '正常生产',
                'REWORK': '返工',
                'SAMPLE': '样品',
                'OTHER': '其他'
            }
            return typeMap[type] || type
        },

        // 构建查询条件
        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };

            // 基础字段查询
            if (this.searchForm.workOrderNo) {
                req.query.$and.push({ workOrderNo: { $regex: this.searchForm.workOrderNo, $options: 'i' } });
            }
            if (this.searchForm.status) {
                req.query.$and.push({ status: this.searchForm.status });
            }
            if (this.searchForm.saleOrderNo) {
                req.query.$and.push({ saleOrderNo: { $regex: this.searchForm.saleOrderNo, $options: 'i' } });
            }
            if (this.searchForm.productionOrderNo) {
                req.query.$and.push({ productionOrderNo: { $regex: this.searchForm.productionOrderNo, $options: 'i' } });
            }
            if (this.searchForm.productModel) {
                req.query.$and.push({ productModel: { $regex: this.searchForm.productModel, $options: 'i' } });
            }
            if (this.searchForm.lineName) {
                req.query.$and.push({ lineName: { $regex: this.searchForm.lineName, $options: 'i' } });
            }
            if (this.searchForm.businessType) {
                req.query.$and.push({ businessType: this.searchForm.businessType });
            }

            // 处理日期范围查询
            if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
                req.query.$and.push({
                    planStartTime: {
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
                workOrderNo: '',
                status: '',
                saleOrderNo: '',
                productionOrderNo: '',
                productModel: '',
                lineName: '',
                businessType: '',
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
                req.limit = this.pageSize;
                const result = await getData("production_plan_work_order", req);
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
            this.dialogStatus = 'edit'
            this.dataForm = JSON.parse(JSON.stringify(row))
            this.dialogFormVisible = true
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
                if (this.dialogStatus === 'create') {
                    await addData('production_plan_work_order', formData)
                    this.$message.success('添加成功')
                } else {
                    await updateData('production_plan_work_order', { query: { _id: formData._id }, update: formData })
                    this.$message.success('更新成功')
                }
                this.fetchData()
            } catch (error) {
                console.error('操作失败:', error)
                this.$message.error('操作失败')
            }
        },

        // 新增按钮点击事件
        handleAdd() {
            this.dialogStatus = 'create'
            this.dataForm = {}
            this.dialogFormVisible = true
        },

        // 编辑按钮点击事件
        handleEdit(row) {
            this.dialogStatus = 'edit'
            this.dataForm = JSON.parse(JSON.stringify(row))
            this.dialogFormVisible = true
        },

        // 查看按钮点击事件
        handleView(row) {
            // 可以根据需要实现查看详情的逻辑
            this.$message.info('查看详情功能待实现')
        },

        // 删除按钮点击事件
        handleDelete(row) {
            this.$confirm('确认删除该工单吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData('production_plan_work_order', row._id)
                    this.$message.success('删除成功')
                    this.fetchData()
                } catch (error) {
                    console.error('删除失败:', error)
                    this.$message.error('删除失败')
                }
            }).catch(() => { })
        },

        // 批量删除按钮点击事件
        handleBatchDelete() {
            if (!this.selection.length) {
                this.$message.warning('请选择要删除的记录')
                return
            }

            this.$confirm(`确认删除选中的 ${this.selection.length} 条记录吗？`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    const ids = this.selection.map(item => item._id)
                    await removeData('production_plan_work_order', ids)
                    this.$message.success('批量删除成功')
                    this.fetchData()
                } catch (error) {
                    console.error('批量删除失败:', error)
                    this.$message.error('批量删除失败')
                }
            }).catch(() => { })
        },

        // 表格多选事件
        handleSelectionChange(selection) {
            this.selection = selection
        },

        // 提交表单事件
        async handleSubmit(formData) {
            try {
                if (this.dialogStatus === 'create') {
                    await addData('production_plan_work_order', formData)
                    this.$message.success('新增成功')
                } else {
                    await updateData('production_plan_work_order', formData._id, formData)
                    this.$message.success('更新成功')
                }
                this.fetchData()
            } catch (error) {
                console.error('操作失败:', error)
                this.$message.error('操作失败')
            }
        }
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

.table-operations {
    margin: 15px 0;
    display: flex;
    gap: 10px;
}

.delete-btn {
    color: #F56C6C;

    &:hover {
        color: #f78989;
    }
}

.app-container {
    padding: 20px;

    .filter-container {
        margin-bottom: 20px;
    }
}
</style>