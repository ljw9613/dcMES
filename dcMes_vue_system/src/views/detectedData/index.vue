<template>
    <div class="app-container">
        <el-card class="filter-container">
            <div slot="header" class="clearfix">
                <span>筛选搜索</span>
            </div>

            <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="扫描码">
                            <el-input v-model="searchForm.scanCode" placeholder="请输入扫描码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="设备">
                            <zr-select v-model="searchForm.machineId" collection="machine"
                                :search-fields="['machineName']" label-key="machineName" sub-key="_id" :multiple="false"
                                placeholder="请输入设备名称搜索" clearable style="width: 100%">
                                <template #option="{ item }">
                                    <div class="select-option">
                                        <div class="option-main">
                                            <span class="option-label">{{ item.machineName }}</span>
                                            <el-tag size="mini" type="info" class="option-tag">
                                                {{ item._id }}
                                            </el-tag>
                                        </div>
                                    </div>
                                </template>
                            </zr-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="工序ID">
                            <zr-select v-model="searchForm.processId" collection="processStep"
                                :search-fields="['processCode', 'processName']" label-key="processName" sub-key="_id"
                                :multiple="false" placeholder="请输入工序名称/编码搜索" clearable style="width: 100%">
                                <template #option="{ item }">
                                    <div class="select-option">
                                        <div class="option-main">
                                            <span class="option-label">{{ item.processName }}</span>
                                            <el-tag size="mini" type="info" class="option-tag">
                                                {{ item.processCode }}
                                            </el-tag>
                                        </div>
                                    </div>
                                </template>
                            </zr-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="检测时间">
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
                </el-form-item>
            </el-form>
        </el-card>

        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">检测数据列表</i>
                    <el-button type="primary" @click="handleExport" :loading="exportLoading">
                        <i class="el-icon-download"></i>
                        {{ exportLoading ? `正在导出(${exportProgress}%)` : '导出数据' }}
                    </el-button>
                </div>
            </div>
        </div>

        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @selection-change="handleSelectionChange" @handleCurrentChange="baseTableHandleCurrentChange"
            @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">
                <el-table-column type="expand">
                    <template slot-scope="scope">
                        <el-form label-position="left" inline class="table-expand">
                            <div v-if="inspectionDataHandle(scope.row).length">
                                <el-tag style="margin: 3px" v-for="tag in inspectionDataHandle(scope.row)" :key="tag">
                                    {{ tag }}
                                </el-tag>
                            </div>
                        </el-form>
                    </template>
                </el-table-column>

                <el-table-column type="selection" width="55" />

                <el-table-column label="扫描码" align="center" prop="scanCode">
                    <template slot-scope="scope">
                        <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.scanCode }}</el-link>
                        <el-link type="primary" style="margin-left: 10px" @click="showHistory(scope.row)">历史记录</el-link>
                    </template>
                </el-table-column>
                <el-table-column label="设备名称" align="center" width="220">
                    <template slot-scope="scope">
                        {{ scope.row.machineId ? scope.row.machineId.machineName : '--' }}
                    </template>
                </el-table-column>
                <el-table-column label="工序名称" align="center" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.processId ? scope.row.processId.processName : '--' }}
                    </template>
                </el-table-column>
                <el-table-column label="检测结果" align="center" width="400">
                    <template slot-scope="scope">
                        <el-tag :type="!scope.row.error ? 'success' : 'danger'">
                            {{ !scope.row.error ? '合格' : '不合格' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="检测时间" align="center" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.createTime) }}
                    </template>
                </el-table-column>

            </template>
        </base-table>

        <edit-dialog :visible.sync="dialogFormVisible" :dialog-status="dialogStatus" :row-data="dataForm"
            @submit="handleSubmit" />

        <!-- 添加历史数据弹窗 -->
        <el-dialog title="历史检测数据" :visible.sync="historyDialogVisible" width="80%">
            <base-table ref="historyTable" :currentPage="historyCurrentPage" :highlight-current-row="true"
                :pageSize="historyPageSize" :tableData="historyTableList" :tableDataloading="historyListLoading"
                :total="historyTotal" @handleCurrentChange="historyTableHandleCurrentChange"
                @handleSizeChange="historyTableHandleSizeChange">
                <template slot="law">
                    <el-table-column type="expand">
                        <template slot-scope="scope">
                            <el-form label-position="left" inline class="table-expand">
                                <div v-if="inspectionDataHandle(scope.row).length">
                                    <el-tag style="margin: 3px" v-for="tag in inspectionDataHandle(scope.row)"
                                        :key="tag">
                                        {{ tag }}
                                    </el-tag>
                                </div>
                            </el-form>
                        </template>
                    </el-table-column>

                    <el-table-column label="设备名称" align="center">
                        <template slot-scope="scope">
                            {{ scope.row.machineId ? scope.row.machineId.machineName : '--' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="工序名称" align="center">
                        <template slot-scope="scope">
                            {{ scope.row.processId ? scope.row.processId.processName : '--' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="检测结果" align="center">
                        <template slot-scope="scope">
                            <el-tag :type="!scope.row.error ? 'success' : 'danger'">
                                {{ !scope.row.error ? '合格' : '不合格' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="检测时间" align="center">
                        <template slot-scope="scope">
                            {{ formatDate(scope.row.createTime) }}
                        </template>
                    </el-table-column>
                </template>
            </base-table>
        </el-dialog>

        <!-- 添加导出进度条对话框 -->
        <el-dialog title="导出进度" :visible.sync="exportDialogVisible" :close-on-click-modal="false"
            :close-on-press-escape="false" :show-close="false" width="30%">
            <el-progress :percentage="exportProgress" :status="exportProgress === 100 ? 'success' : ''"
                :stroke-width="18">
            </el-progress>
            <div style="text-align: center; margin-top: 10px">
                {{ exportProgress === 100 ? '导出完成' : '正在导出数据，请稍候...' }}
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import EditDialog from './components/EditDialog'
import inspectionFieldEnum from './map.json'
import { query } from "quill";
import Export2Excel from '@/vendor/Export2Excel'

export default {
    name: 'InspectionLastData',
    components: {
        EditDialog
    },
    data() {
        return {
            searchForm: {
                scanCode: '',
                machineId: '',
                processId: '',
                dateRange: []
            },
            tableList: [],
            total: 0,
            currentPage: 1,
            pageSize: 10,
            listLoading: true,
            dialogFormVisible: false,
            dialogStatus: '',
            selection: [],
            dataForm: {},
            historyDialogVisible: false,
            historyCurrentPage: 1,
            historyPageSize: 10,
            historyTableList: [],
            historyListLoading: true,
            historyTotal: 0,
            exportLoading: false,
            exportProgress: 0,
            exportDialogVisible: false,
        }
    },
    methods: {
        inspectionDataHandle(row) {
            let data = []
            for (let inspectionFieldEnumKey in inspectionFieldEnum) {
                inspectionFieldEnumKey !== "error" && !this.isBlank(row[inspectionFieldEnumKey]) && (data.push(`${inspectionFieldEnum[inspectionFieldEnumKey]}：${row[inspectionFieldEnumKey]}`))
            }
            return data
        },
        isBlank(value) {
            return (
                value === null ||
                value === undefined ||
                value === '' ||
                (Array.isArray(value) && value.length === 0) ||
                (typeof value === 'object' && Object.keys(value).length === 0)
            )
        },
        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };

            // 转义特殊字符的辅助函数
            const escapeRegex = (string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };

            // 处理扫描码
            if (this.searchForm.scanCode && this.searchForm.scanCode.trim()) {
                req.query.$and.push({
                    scanCode: {
                        $regex: escapeRegex(this.searchForm.scanCode.trim()),
                        $options: 'i'
                    }
                });
            }

            // 处理设备ID
            if (this.searchForm.machineId) {
                req.query.$and.push({
                    machineId: this.searchForm.machineId  // 直接使用ID匹配，不需要模糊查询
                });
            }

            // 处理工序ID
            if (this.searchForm.processId) {
                req.query.$and.push({
                    processId: this.searchForm.processId
                });
            }

            // 处理日期范围
            if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
                const [startDate, endDate] = this.searchForm.dateRange;
                req.query.$and.push({
                    createTime: {
                        $gte: new Date(startDate).toISOString(),
                        $lte: new Date(endDate + ' 23:59:59.999').toISOString()
                    }
                });
            }

            // 如果没有查询条件，则移除 $and 操作符
            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
        },

        resetForm() {
            this.$refs.searchForm.resetFields();
            this.searchForm = {
                scanCode: '',
                machineId: '',
                processId: '',
                dateRange: []
            };
            this.currentPage = 1;
            this.fetchData();
        },

        async fetchData() {
            this.listLoading = true;
            try {
                let req = this.searchData();
                req.page = this.currentPage;
                req.skip = (this.currentPage - 1) * this.pageSize;
                req.limit = this.pageSize;
                req.count = true;
                req.populate = JSON.stringify([{ path: 'machineId' }, { path: 'processId' }]);
                const result = await getData("InspectionLastData", req);
                this.tableList = result.data;
                this.total = result.countnum;
            } catch (error) {
                console.error('获取数据失败:', error);
                this.$message.error('获取数据失败');
            } finally {
                this.listLoading = false;
            }
        },

        baseTableHandleCurrentChange(currentPage) {
            this.currentPage = currentPage;
            this.fetchData();
        },

        baseTableHandleSizeChange(pageSize) {
            this.pageSize = pageSize;
            this.fetchData();
        },

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

        search() {
            this.currentPage = 1;
            this.fetchData();
        },

        handleSelectionChange(selection) {
            this.selection = selection;
        },

        handleView(row) {
            this.dataForm = JSON.parse(JSON.stringify(row));
            this.dialogStatus = 'view';
            this.dialogFormVisible = true;
        },

        handleEdit(row) {
            this.dialogStatus = 'edit';
            this.dataForm = JSON.parse(JSON.stringify(row));
            this.dialogFormVisible = true;
        },

        handleDelete(row) {
            this.$confirm('确认要删除该检测数据吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData('InspectionLastData', row._id);
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

        handleAdd() {
            this.dialogStatus = 'create';
            this.dataForm = {};
            this.dialogFormVisible = true;
        },

        handleBatchDelete() {
            if (!this.selection.length) {
                this.$message.warning('请选择要删除的记录');
                return;
            }

            this.$confirm(`确认删除选中的 ${this.selection.length} 条记录吗？`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    const ids = this.selection.map(item => item._id);
                    await removeData('InspectionLastData', { query: { _id: { $in: ids } } });
                    this.$message.success('批量删除成功');
                    this.fetchData();
                } catch (error) {
                    console.error('批量删除失败:', error);
                    this.$message.error('批量删除失败');
                }
            }).catch(() => { });
        },

        async handleSubmit(formData) {
            try {
                if (this.dialogStatus === 'create') {
                    await addData('InspectionLastData', formData);
                    this.$message.success('新增成功');
                } else {
                    await updateData('InspectionLastData', { query: { _id: formData._id }, update: formData });
                    this.$message.success('更新成功');
                }
                this.dialogFormVisible = false;
                this.fetchData();
            } catch (error) {
                console.error('操作失败:', error);
                this.$message.error('操作失败');
            }
        },

        showHistory(row) {
            this.historyCurrentPage = 1;
            this.dataForm = row;
            this.fetchHistoryData(row.scanCode);
            this.historyDialogVisible = true;
        },

        async fetchHistoryData(scanCode) {
            this.historyListLoading = true;
            try {
                const result = await getData("InspectionData", {
                    query: {
                        scanCode: scanCode
                    },
                    populate: JSON.stringify([{ path: 'machineId' }, { path: 'processId' }]),
                    skip: (this.historyCurrentPage - 1) * this.historyPageSize,
                    limit: this.historyPageSize,
                    count: true
                });
                this.historyTableList = result.data;
                this.historyTotal = result.countnum;
            } catch (error) {
                console.error('获取历史数据失败:', error);
                this.$message.error('获取历史数据失败');
            } finally {
                this.historyListLoading = false;
            }
        },

        historyTableHandleCurrentChange(currentPage) {
            this.historyCurrentPage = currentPage;
            this.fetchHistoryData(this.dataForm.scanCode);
        },

        historyTableHandleSizeChange(pageSize) {
            this.historyPageSize = pageSize;
            this.fetchHistoryData(this.dataForm.scanCode);
        },

        async handleExport() {
            this.exportLoading = true;
            this.exportProgress = 0;
            this.exportDialogVisible = true;

            try {
                // 构建查询条件
                let req = this.searchData();
                req.populate = JSON.stringify([{ path: 'machineId' }, { path: 'processId' }]);

                // 获取所有数据（不分页）
                const result = await getData("InspectionLastData", req);
                const totalItems = result.data.length;

                // 准备 Excel 数据
                const exportData = [];
                const batchSize = 100; // 每批处理的数据量
                const header = ['扫描码', '设备名称', '工序名称', '检测结果', '检测时间', '检测详情'];

                for (let i = 0; i < totalItems; i += batchSize) {
                    const batch = result.data.slice(i, i + batchSize).map(item => [
                        item.scanCode,
                        item.machineId ? item.machineId.machineName : '--',
                        item.processId ? item.processId.processName : '--',
                        !item.error ? '合格' : '不合格',
                        this.formatDate(item.createTime),
                        this.inspectionDataHandle(item).join('; ')
                    ]);

                    exportData.push(...batch);

                    // 更新进度
                    this.exportProgress = Math.round((i + batch.length) / totalItems * 100);

                    // 给UI一个更新的机会
                    await new Promise(resolve => setTimeout(resolve, 10));
                }

                console.log(exportData);
                // 导出Excel
                import('@/vendor/Export2Excel').then(excel => {
                    excel.export_json_to_excel({
                        header: header,
                        data: exportData,
                        filename: '检测数据' + new Date().getTime(),
                        autoWidth: true,
                        bookType: 'xlsx'
                    });
                    this.exportProgress = 100;
                    this.$message.success('导出成功');
                });

                // 延迟关闭对话框
                setTimeout(() => {
                    this.exportDialogVisible = false;
                    this.exportProgress = 0;
                }, 1000);

            } catch (error) {
                console.error('导出失败:', error);
                this.$message.error('导出失败');
                this.exportDialogVisible = false;
            } finally {
                this.exportLoading = false;
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

.table-expand {
    padding: 20px;
}
</style>