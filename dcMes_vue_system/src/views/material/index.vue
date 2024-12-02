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
                        <el-form-item label="物料编码">
                            <el-input v-model="searchForm.FNumber" placeholder="请输入物料编码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="物料名称">
                            <el-input v-model="searchForm.FName" placeholder="请输入物料名称" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="规格型号">
                            <el-input v-model="searchForm.FSpecification" placeholder="请输入规格型号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="数据状态">
                            <el-select v-model="searchForm.FDocumentStatus" placeholder="请选择数据状态" clearable style="width: 100%">
                                <el-option label="草稿" value="DRAFT" />
                                <el-option label="已审核" value="APPROVED" />
                                <el-option label="审核中" value="PROCESSING" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="旧物料编码">
                            <el-input v-model="searchForm.FOldNumber" placeholder="请输入旧物料编码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="基本单位">
                            <el-select v-model="searchForm.FBaseUnitId_FNumber" placeholder="请选择基本单位" clearable style="width: 100%">
                                <!-- 这里需要从后端获取单位列表 -->
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="仓库">
                            <el-select v-model="searchForm.FStockId_FNumber" placeholder="请选择仓库" clearable style="width: 100%">
                                <!-- 这里需要从后端获取仓库列表 -->
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="是否长新物料">
                            <el-select v-model="searchForm.F_TFQJ_CheckBox" placeholder="请选择" clearable style="width: 100%">
                                <el-option label="是" value="1" />
                                <el-option label="否" value="0" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <div v-show="showAdvanced">
                    <el-row :gutter="20">
                        <el-col :span="6">
                            <el-form-item label="BOM分类">
                                <el-select v-model="searchForm.FBOMCATEGORY" placeholder="请选择BOM分类" clearable style="width: 100%">
                                    <el-option label="标准BOM" value="STANDARD" />
                                    <el-option label="工程BOM" value="ENGINEERING" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="BOM用途">
                                <el-select v-model="searchForm.FBOMUSE" placeholder="请选择BOM用途" clearable style="width: 100%">
                                    <el-option label="生产用" value="PRODUCTION" />
                                    <el-option label="设计用" value="DESIGN" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="物料属性">
                                <el-select v-model="searchForm.FITEMPPROPERTY" placeholder="请选择物料属性" clearable style="width: 100%">
                                    <el-option label="外购" value="PURCHASE" />
                                    <el-option label="自制" value="SELF_MADE" />
                                    <el-option label="委外" value="OUTSOURCE" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="禁用状态">
                                <el-select v-model="searchForm.FForbidStatus" placeholder="请选择禁用状态" clearable style="width: 100%">
                                    <el-option label="启用" value="ENABLE" />
                                    <el-option label="禁用" value="DISABLE" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </div>

                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <el-button type="success" @click="exportData">导出数据</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">物料管理列表</i>
                    <el-button type="primary" @click="handleAdd">新增物料</el-button>
                </div>
            </div>
        </div>

        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @selection-change="handleSelectionChange" @handleCurrentChange="baseTableHandleCurrentChange"
            @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">
                <!-- FUseOrgId 使用组织 -->
                <el-table-column label="使用组织" prop="FUseOrgId" width="150" />
                <el-table-column label="物料编码" prop="FNumber" width="120">
                    <template slot-scope="scope">
                        <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.FNumber }}</el-link>
                    </template>
                </el-table-column>

                <el-table-column label="物料名称" prop="FName" width="150" />
                <el-table-column label="规格型号" prop="FSpecification" width="120" />
                <el-table-column label="基本单位" prop="FBaseUnitId_FName" width="100" />
                <el-table-column label="仓库" prop="FStockId_FName" width="120" />
                <el-table-column label="英文名称" prop="FNameEn" width="150" />
                
                <el-table-column label="数据状态" width="100">
                    <template slot-scope="scope">
                        <el-tag :type="getStatusType(scope.row.FDocumentStatus)">
                            {{ getStatusText(scope.row.FDocumentStatus) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="禁用状态" width="100">
                    <template slot-scope="scope">
                        <el-tag :type="scope.row.FForbidStatus === 'DISABLE' ? 'danger' : 'success'">
                            {{ scope.row.FForbidStatus === 'DISABLE' ? '禁用' : '启用' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="操作" fixed="right" width="150">
                    <template slot-scope="scope">
                        <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button type="text" size="small" @click="handleDelete(scope.row)">删除</el-button>
                        <el-button type="text" size="small" 
                            @click="handleToggleStatus(scope.row)"
                            :disabled="scope.row.FDocumentStatus !== 'APPROVED'">
                            {{ scope.row.FForbidStatus === 'DISABLE' ? '启用' : '禁用' }}
                        </el-button>
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <!-- 新增/编辑对话框 -->
        <el-dialog :title="dialogStatus === 'create' ? '新增物料' : '编辑物料'" 
            :visible.sync="dialogFormVisible" 
            width="60%">
            <el-form ref="dataForm" :model="dataForm" :rules="rules" label-width="100px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="物料编码" prop="FNumber">
                            <el-input v-model="dataForm.FNumber" placeholder="请输入物料编码"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="物料名称" prop="FName">
                            <el-input v-model="dataForm.FName" placeholder="请输入物料名称"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <!-- 更多表单项... -->
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialogFormVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitForm">确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";

export default {
    name: 'MaterialManagement',
    dicts: ['product_type'],
    data() {
        return {
            searchForm: {
                FNumber: '',
                FName: '',
                FSpecification: '',
                FDocumentStatus: '',
                FForbidStatus: '',
                FOldNumber: '',
                FBaseUnitId_FNumber: '',
                FStockId_FNumber: '',
                F_TFQJ_CheckBox: '',
                FNameEn: '',
                FCreateOrgId: '',
                FUseOrgId: ''
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
                FNumber: '',
                FName: '',
                FSpecification: '',
                FDocumentStatus: '',
                FForbidStatus: '',
                FOldNumber: '',
                FBaseUnitId_FNumber: '',
                FBaseUnitId_FName: '',
                FStockId_FNumber: '',
                FStockId_FName: '',
                F_TFQJ_CheckBox: '',
                FNameEn: '',
                FCreateOrgId: '',
                FUseOrgId: '',
                FDescription: '',
                FMnemonicCode: '',
                FMaterialGroup: '',
                FCreatorId: '',
                FCreateDate: null,
                FModifierId: '',
                FModifyDate: null
            },
            rules: {
                FName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
                FBaseUnitId_FNumber: [{ required: true, message: '请选择基本单位', trigger: 'change' }],
                FStockId_FNumber: [{ required: true, message: '请选择仓库', trigger: 'change' }],
                FCreateOrgId: [{ required: true, message: '请选择创建组织', trigger: 'change' }],
                FUseOrgId: [{ required: true, message: '请选择使用组织', trigger: 'change' }]
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
            if (this.searchForm.FNumber) {
                req.query.$and.push({ FNumber: { $regex: this.searchForm.FNumber, $options: 'i' } });
            }
            if (this.searchForm.FName) {
                req.query.$and.push({ FName: { $regex: this.searchForm.FName, $options: 'i' } });
            }
            if (this.searchForm.FSpecification) {
                req.query.$and.push({ FSpecification: { $regex: this.searchForm.FSpecification, $options: 'i' } });
            }
            if (this.searchForm.FDocumentStatus) {
                req.query.$and.push({ FDocumentStatus: this.searchForm.FDocumentStatus });
            }
            if (this.searchForm.FBOMCATEGORY) {
                req.query.$and.push({ FBOMCATEGORY: this.searchForm.FBOMCATEGORY });
            }
            if (this.searchForm.FBOMUSE) {
                req.query.$and.push({ FBOMUSE: this.searchForm.FBOMUSE });
            }
            if (this.searchForm.FITEMPPROPERTY) {
                req.query.$and.push({ FITEMPPROPERTY: this.searchForm.FITEMPPROPERTY });
            }
            if (this.searchForm.FForbidStatus) {
                req.query.$and.push({ FForbidStatus: this.searchForm.FForbidStatus });
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
                FNumber: '',
                FName: '',
                FSpecification: '',
                FDocumentStatus: '',
                FForbidStatus: '',
                FOldNumber: '',
                FBaseUnitId_FNumber: '',
                FStockId_FNumber: '',
                F_TFQJ_CheckBox: '',
                FNameEn: '',
                FCreateOrgId: '',
                FUseOrgId: ''
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
                const result = await getData("k3_BD_MATERIAL", req);
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
                    FNumber: '物料编码',
                    FName: '物料名称',
                    FSpecification: '规格型号',
                    FDocumentStatus: '数据状态',
                    FBOMCATEGORY: 'BOM分类',
                    FBOMUSE: 'BOM用途',
                    FITEMPPROPERTY: '物料属性',
                    FForbidStatus: '禁用状态'
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
                XLSX.utils.book_append_sheet(wb, ws, '物料管理数据');

                // 下载文件
                XLSX.writeFile(wb, '物料管理数据.xlsx');
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
            this.$confirm('确认要删除该物料吗?', '提示', {
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

        // 切换物料状态
        async handleToggleStatus(row) {
            try {
                await this.$confirm(`确认要${row.FForbidStatus === 'DISABLE' ? '启用' : '禁用'}该物料吗？`, '提示', {
                    type: 'warning'
                });
                
                const newStatus = row.FForbidStatus === 'DISABLE' ? 'ENABLE' : 'DISABLE';
                await updateData('BD_MATERIAL', row._id, {
                    ...row,
                    FForbidStatus: newStatus,
                    FForbidderId: this.$store.state.user.name,
                    FForbidDate: new Date()
                });
                
                this.$message.success(`${newStatus === 'DISABLE' ? '禁用' : '启用'}成功`);
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
</style>