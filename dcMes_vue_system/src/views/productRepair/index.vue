<template>
    <div class="app-container">
        <el-card class="filter-container">
            <div slot="header" class="clearfix">
                <span>筛选搜索</span>
            </div>

            <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
                <el-row :gutter="20">
                    <el-col :span="4">
                        <el-form-item label="产品条码">
                            <el-input v-model="searchForm.barcode" placeholder="请输入产品条码" clearable></el-input>
                        </el-form-item>
                    </el-col>

                    <el-col :span="4">
                        <el-form-item label="产品型号">
                            <el-input v-model="searchForm.materialSpec" placeholder="请输入产品型号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="处理方案">
                            <el-input v-model="searchForm.solution" placeholder="请输入处理方案" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="生产批号">
                            <el-input v-model="searchForm.batchNumber" placeholder="请输入生产批号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="状态">
                            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 100%">
                                <el-option label="待审核" value="PENDING_REVIEW" />
                                <el-option label="已审核" value="REVIEWED" />
                                <el-option label="已作废" value="VOIDED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增</el-button>
                    <el-button type="danger" icon="el-icon-delete" :disabled="!selection.length"
                        @click="handleBatchDelete">批量删除</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">维修记录列表</i>
                </div>
            </div>
        </div>

        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @selection-change="handleSelectionChange" @handleCurrentChange="baseTableHandleCurrentChange"
            @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">

                <el-table-column label="产品条码" align="center" prop="barcode">
                    <template slot-scope="scope">
                        <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.barcode }}</el-link>
                    </template>
                </el-table-column>

                <el-table-column label="产品型号" align="center" prop="materialSpec" />

                <el-table-column label="生产批号" align="center" prop="batchNumber" />

                <el-table-column label="维修人" align="center" prop="repairPerson.name" />

                <el-table-column label="维修时间" align="center" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.repairTime) }}
                    </template>
                </el-table-column>

                <el-table-column label="审核人" align="center" prop="reviewer.name" />

                <el-table-column label="审核时间" align="center" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.reviewTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="不良现象" align="center" prop="defectDescription" />
                <el-table-column label="分析原因" align="center" prop="causeAnalysis" />
                <el-table-column label="维修描述" align="center" prop="repairDescription" />
                <el-table-column label="处理方案" align="center" prop="solution" />
                <el-table-column label="业务类型" align="center" prop="businessType" />
               
                <el-table-column label="维修结果" align="center" width="100" fixed="right">
                    <template slot-scope="scope">
                        <el-tag :type="getRepairResultType(scope.row.repairResult)" v-if="scope.row.repairResult"> 
                            {{ getRepairResultText(scope.row.repairResult) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="状态" align="center" width="100" fixed="right">
                    <template slot-scope="scope">
                        <el-tag :type="getStatusType(scope.row.status)">
                            {{ getStatusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="250" fixed="right">
                    <template slot-scope="scope">
                        <el-button type="text" size="small" @click="handleView(scope.row)" style="color: #409EFF;">
                            <i class="el-icon-view"></i> 查看
                        </el-button>
                        <el-button type="text" size="small" @click="handleReview(scope.row)" style="color: green;" v-if="scope.row.status=='PENDING_REVIEW'">
                            <i class="el-icon-edit"></i> 审核
                        </el-button>
                        <el-button type="text" size="small" @click="handleEdit(scope.row)" v-if="scope.row.status=='PENDING_REVIEW'">
                            <i class="el-icon-edit"></i> 修改
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

        <el-dialog title="审核" :visible.sync="reviewDialogVisible" width="30%">
            <el-form :model="reviewForm" ref="reviewForm" label-width="100px">
                <el-form-item label="维修结果" prop="repairResult">
                    <el-select v-model="reviewForm.repairResult" placeholder="请选择维修结果" style="width: 100%">
                        <el-option label="合格" value="QUALIFIED" />
                        <el-option label="不合格" value="UNQUALIFIED" />
                    </el-select>
                </el-form-item>
                <el-form-item label="不利影响评价" prop="adverseEffect">
                    <el-input type="textarea" v-model="reviewForm.adverseEffect" :rows="3" placeholder="请输入不利影响评价"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="reviewDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitReview">确 定</el-button>
            </div>
        </el-dialog>
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
                    barcode:"",
                    materialSpec:"",
                    batchNumber:"",
                    status:"",
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
            reviewDialogVisible: false,
            reviewForm: {
                repairResult: '',
                adverseEffect: '',
                _id: ''
            }
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
                'PENDING_REVIEW': '待审核',
                'REVIEWED': '已审核',
                'VOIDED': '已作废'
            }
            return statusMap[status] || status
        },

        getStatusType(status) {
            const typeMap = {
                'PENDING_REVIEW': 'info',
                'REVIEWED': 'success',
                'VOIDED': 'danger'
            }
            return typeMap[status] || 'info'
        },

        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };

            if (this.searchForm.barcode) {
                req.query.$and.push({ barcode: { $regex: this.searchForm.barcode, $options: 'i' } });
            }
            if (this.searchForm.materialSpec) {
                req.query.$and.push({ materialSpec: { $regex: this.searchForm.materialSpec, $options: 'i' } });
            }
            if (this.searchForm.batchNumber) {
                req.query.$and.push({ batchNumber: { $regex: this.searchForm.batchNumber, $options: 'i' } });
            }
            if (this.searchForm.status) {
                req.query.$and.push({ status: this.searchForm.status });
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
                req.count = true;
                const result = await getData("product_repair", req);
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
            this.$confirm('确认要删除该产品维修记录吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData('product_repair', {query:{_id:row._id}});
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
                    await removeData('product_repair', { query: { _id: { $in: ids } } });
                    this.$message.success('批量删除成功');
                    this.fetchData();
                } catch (error) {
                    console.error('批量删除失败:', error);
                    this.$message.error('批量删除失败');
                }
            }).catch(() => { });
        },

        async handleSubmit() {
            try {
                this.dialogFormVisible = false;
                this.fetchData();
            } catch (error) {
                console.error('操作失败:', error);
                this.$message.error('操作失败');
            }
        },

        getRepairResultText(result) {
            const resultMap = {
                'QUALIFIED': '合格',
                'UNQUALIFIED': '不合格'
            }
            return resultMap[result] || result
        },

        getRepairResultType(result) {
            const typeMap = {
                'QUALIFIED': 'success',
                'UNQUALIFIED': 'danger'
            }
            return typeMap[result] || ''
        },

        handleReview(row) {
            if (row.status === 'REVIEWED') {
                this.$message.warning('该记录已审核');
                return;
            }
            this.reviewForm = {
                repairResult: '',
                adverseEffect: '',
                _id: row._id
            };
            this.reviewDialogVisible = true;
        },

        async submitReview() {
            try {
                if (!this.reviewForm.repairResult) {
                    this.$message.warning('请选择维修结果');
                    return;
                }
                
                const reqData = {
                    repairResult: this.reviewForm.repairResult,
                    adverseEffect: this.reviewForm.adverseEffect,
                    status: 'REVIEWED',
                    reviewTime: new Date(),
                    reviewer: this.$store.state.user.userInfo // 假设存储了当前用户信息
                };

                await updateData('product_repair', { 
                    query: { _id: this.reviewForm._id },
                    update: reqData
                });

                this.$message.success('审核成功');
                this.reviewDialogVisible = false;
                this.fetchData();
            } catch (error) {
                console.error('审核失败:', error);
                this.$message.error('审核失败');
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