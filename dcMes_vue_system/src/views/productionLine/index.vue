<template>
    <div class="app-container">
        <el-card class="filter-container">
            <div slot="header" class="clearfix">
                <span>筛选搜索</span>
            </div>

            <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="产线编码">
                            <el-input v-model="searchForm.lineCode" placeholder="请输入产线编码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="产线名称">
                            <el-input v-model="searchForm.lineName" placeholder="请输入产线名称" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="车间线路编号">
                            <el-input v-model="searchForm.lineNum" placeholder="请输入车间线路编号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="状态">
                            <el-select v-model="searchForm.state" placeholder="请选择状态" clearable style="width: 100%">
                                <el-option label="正常" :value="1" />
                                <el-option label="作废" :value="0" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增产线</el-button>
                    <el-button type="danger" icon="el-icon-delete" :disabled="!selection.length"
                        @click="handleBatchDelete">批量删除</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">生产产线列表</i>
                </div>
            </div>
        </div>

        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @selection-change="handleSelectionChange" @handleCurrentChange="baseTableHandleCurrentChange"
            @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">

                <el-table-column label="产线编码" align="center" prop="lineCode">
                    <template slot-scope="scope">
                        <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.lineCode }}</el-link>
                    </template>
                </el-table-column>

                <el-table-column label="产线名称" align="center" prop="lineName" width="120" />

                <el-table-column label="车间线路编号" align="center" prop="lineNum" width="120" />

                <el-table-column label="接收器卡号" align="center" prop="cardNum" width="120" />

                <el-table-column label="IP地址" align="center" prop="ipAddress" width="120" />

                <el-table-column label="状态" align="center" width="80">
                    <template slot-scope="scope">
                        <el-tag :type="scope.row.state === 1 ? 'success' : 'danger'">
                            {{ scope.row.state === 1 ? '正常' : '作废' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="标准产能" width="100">
                    <template slot-scope="scope">
                        {{ scope.row.capacity || '-' }} 件/时
                    </template>
                </el-table-column>


                <el-table-column label="所属车间" align="center" prop="workshop" width="120" />

                <el-table-column label="区域" align="center" prop="area" width="120" />

                <el-table-column label="创建时间" align="center" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.createAt) }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="250" fixed="right">
                    <template slot-scope="scope">
                        <el-button type="text" size="small" @click="handleRefresh(scope.row)">
                            <i class="el-icon-refresh"></i> 设备刷新
                        </el-button>
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
import { query } from "quill";
import { refreshMachine } from "@/api/machine";


export default {
    name: 'ProductionLine',
    components: {
        EditDialog
    },
    data() {
        return {
            searchForm: {
                lineCode: '',
                lineName: '',
                lineNum: '',
                state: ''
            },
            tableList: [],
            total: 0,
            currentPage: 1,
            pageSize: 10,
            listLoading: true,
            dialogFormVisible: false,
            dialogStatus: '',
            selection: [],
            dataForm: {}
        }
    },
    methods: {
        getLineTypeText(type) {
            const typeMap = {
                'ASSEMBLY': '组装线',
                'SMT': 'SMT线',
                'TESTING': '测试线',
                'PACKAGING': '包装线',
                'OTHER': '其他'
            }
            return typeMap[type] || type
        },

        getStatusText(status) {
            const statusMap = {
                'RUNNING': '运行中',
                'STOPPED': '已停止',
                'MAINTENANCE': '维护中',
                'INACTIVE': '未启用'
            }
            return statusMap[status] || status
        },

        getStatusType(status) {
            const statusMap = {
                'RUNNING': 'success',
                'STOPPED': 'info',
                'MAINTENANCE': 'warning',
                'INACTIVE': 'danger'
            }
            return statusMap[status] || 'info'
        },

        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };

            if (this.searchForm.lineCode) {
                req.query.$and.push({ lineCode: { $regex: this.searchForm.lineCode, $options: 'i' } });
            }
            if (this.searchForm.lineName) {
                req.query.$and.push({ lineName: { $regex: this.searchForm.lineName, $options: 'i' } });
            }
            if (this.searchForm.lineNum) {
                req.query.$and.push({ lineNum: { $regex: this.searchForm.lineNum, $options: 'i' } });
            }
            if (this.searchForm.state !== '') {
                req.query.$and.push({ state: this.searchForm.state });
            }

            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
        },

        resetForm() {
            this.$refs.searchForm.resetFields();
            this.searchForm = {
                lineCode: '',
                lineName: '',
                lineNum: '',
                state: ''
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
                req.sort = { createAt: -1 };
                req.count = true;
                const result = await getData("production_line", req);
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
        async handleRefresh(row) {
            this.$confirm('确认要刷新设备吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                console.log(row);
                let machineData = await getData("machine", { query: { lineId: row._id } });
                let machineIds = machineData.data.map(item => item._id)
                if (!machineIds.length) {
                    this.$message.warning('当前产线无可刷新设备');
                    return;
                }
                await refreshMachine({ machineIds: machineIds })
                this.$message.success('设备在线状态刷新成功');
            }).catch(() => {
                this.$message.info('已取消刷新');
            });
        },

        handleEdit(row) {
            this.dialogStatus = 'edit';
            this.dataForm = JSON.parse(JSON.stringify(row));
            this.dialogFormVisible = true;
        },

        handleDelete(row) {
            this.$confirm('确认要删除该产线吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData('production_line', { query: { _id: row._id } });
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
                    await removeData('production_line', { query: { _id: { $in: ids } } });
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
                    await addData('production_line', formData);
                    this.$message.success('新增成功');
                } else {
                    await updateData('production_line', { query: { _id: formData._id }, update: formData });
                    this.$message.success('更新成功');
                }
                this.dialogFormVisible = false;
                this.fetchData();
            } catch (error) {
                console.error('操作失败:', error);
                this.$message.error('操作失败');
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