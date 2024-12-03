<template>
    <div class="app-container">
        <!-- 搜索表单 -->
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
                        <el-form-item label="工艺名称">
                            <el-input v-model="searchForm.FName" placeholder="请输入工艺名称" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="工艺编码">
                            <el-input v-model="searchForm.FNumber" placeholder="请输入工艺编码" clearable></el-input>
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

                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="工艺类型">
                            <el-select v-model="searchForm.craftType" placeholder="请选择工艺类型" clearable
                                style="width: 100%">
                                <el-option label="标准工艺" value="STANDARD_PROCESS" />
                                <el-option label="制具工艺" value="TOOL_MAKING_TECHNOLOGY" />
                                <el-option label="辅材工艺" value="AUXILIARY_MATERIAL_TECHNOLOGY" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="工艺状态">
                            <el-select v-model="searchForm.FDocumentStatus" placeholder="请选择工艺状态" clearable
                                style="width: 100%">
                                <el-option label="创建" value="CREATE" />
                                <el-option label="启用" value="ENABLE" />
                                <el-option label="作废" value="VOID" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="产品型号">
                            <el-select v-model="searchForm.FProductType" placeholder="请选择产品类型" clearable
                                style="width: 100%">
                                <el-option v-for="dict in dict.type.product_type" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 工艺列表 -->
        <div class="screen1">
            <div class="screen_content_first">
                <i class="el-icon-tickets">工艺管理列表</i>
                <el-button type="primary" @click="handleAdd">新增工艺</el-button>
            </div>
        </div>

        <base-table ref="craftTable" :currentPage="craftTableData.currentPage" :pageSize="craftTableData.pageSize"
            :tableData="craftTableData.tableList" :tableDataloading="craftTableData.listLoading"
            :total="craftTableData.total" @handleCurrentChange="handleCraftTableCurrentChange"
            @handleSizeChange="handleCraftTableSizeChange">
            <template slot="law">
                <el-table-column label="工艺名称" prop="FName" />
                <el-table-column label="工艺编码" prop="FNumber" />
                <el-table-column label="工艺描述" prop="craftDesc" />
                <el-table-column label="工艺类型" prop="craftType" />
                <el-table-column label="产品型号" prop="FProductType" />
                <el-table-column label="创建人" prop="createBy" />
                <el-table-column label="创建时间" prop="createAt" />
                <el-table-column label="状态">
                    <template slot-scope="scope">
                        <el-tag :type="getStatusType(scope.row.status)">
                            {{ getStatusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" width="150">
                    <template slot-scope="scope">
                        <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button type="text" size="small" @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <!-- 新增/编辑工艺弹窗 -->
        <el-dialog :title="dialogStatus === 'create' ? '新增工艺' : '编辑工艺'" :visible.sync="dialogFormVisible" width="60%">
            <el-form ref="craftForm" :model="craftForm" :rules="rules" label-width="100px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="生产阶段" prop="productStage">
                            <el-select v-model="craftForm.productStage" placeholder="请选择生产阶段" style="width: 100%">
                                <el-option label="SMT" value="SMT" />
                                <el-option label="DIP" value="DIP" />
                                <el-option label="ASSEMPLY" value="ASSEMPLY" />
                                <el-option label="PACK" value="PACK" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="工艺类型" prop="craftType">
                            <el-select v-model="craftForm.craftType" placeholder="请选择工艺类型" style="width: 100%">
                                <el-option label="标准工艺" value="STANDARD_PROCESS" />
                                <el-option label="制具工艺" value="TOOL_MAKING_TECHNOLOGY" />
                                <el-option label="辅材工艺" value="AUXILIARY_MATERIAL_TECHNOLOGY" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="工艺名称" prop="FName">
                            <el-input v-model="craftForm.FName" placeholder="请输入工艺名称"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="工艺编码" prop="FNumber">
                            <el-input v-model="craftForm.FNumber" placeholder="请输入工艺编码"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="工艺描述" prop="craftDesc">
                            <el-input v-model="craftForm.craftDesc" placeholder="请输入工艺描述"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="产品名称" prop="productName">
                            <el-select v-model="craftForm.productName" placeholder="请选择产品名称" style="width: 100%">
                                <el-option label="W2210P" value="W2210P" />
                                <el-option label="HD300" value="HD300" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="组件名称" prop="componentName">
                            <el-select v-model="craftForm.componentName" placeholder="请选择组件名称" style="width: 100%">
                                <el-option label="右制冷片" value="右制冷片" />
                                <el-option label="检测版组件" value="检测版组件" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="业务类型" prop="businessType">
                            <el-input v-model="craftForm.businessType" placeholder="请输入业务类型"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <!-- 工序列表 -->
            <div class="screen1">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">工序管理列表</i>
                    <el-button type="primary" @click="handleAddProcess">新增工序</el-button>
                </div>
            </div>

            <base-table ref="processTable" :currentPage="processTableData.currentPage"
                :pageSize="processTableData.pageSize" :tableData="processTableData.tableList"
                :tableDataloading="processTableData.listLoading" :total="processTableData.total"
                @handleCurrentChange="handleProcessTableCurrentChange" @handleSizeChange="handleProcessTableSizeChange">
                <template slot="law">
                    <el-table-column label="工序编码" prop="processCode" />
                    <el-table-column label="工序描述" prop="processDesc" />
                    <el-table-column label="工序类型" prop="processType" />
                    <el-table-column label="状态">
                        <template slot-scope="scope">
                            <el-tag :type="getStatusType(scope.row.status)">
                                {{ getStatusText(scope.row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" fixed="right" width="150">
                        <template slot-scope="scope">
                            <el-button type="text" size="small" @click="handleEditProcess(scope.row)">编辑</el-button>
                            <el-button type="text" size="small" @click="handleDeleteProcess(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </template>
            </base-table>

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
    name: 'CraftManagement',
    dicts: ['product_type'],
    data() {
        return {
            // 搜索表单数据
            searchForm: {
                FName: '',           // 工艺名称
                FNumber: '',         // 工艺编码
                dateRange: [],       // 计划日期
                FDocumentStatus: '', // 工艺状态
                FProductType: '',    // 产品型号
                craftType: ''        // 工艺类型
            },

            // 主工艺列表数据
            craftTableData: {
                tableList: [],
                total: 0,
                currentPage: 1,
                pageSize: 10,
                listLoading: true
            },

            // 新增/编辑工艺表单数据
            craftForm: {
                FNumber: '',         // 工艺编码
                FName: '',           // 工艺名称
                craftDesc: '',       // 工艺描述
                craftType: '',       // 工艺类型
                productStage: '',    // 生产阶段
                productName: '',     // 产品名称
                componentName: '',   // 组件名称
                businessType: '',    // 业务类型
                status: 'CREATE'     // 工艺状态
            },

            // 工序列表数据
            processTableData: {
                tableList: [],
                total: 0,
                currentPage: 1,
                pageSize: 10,
                listLoading: false
            },

            // 其他通用数据
            showAdvanced: false,
            dialogFormVisible: false,
            dialogStatus: '',
            selection: [],

            // 表单验证规则
            rules: {
                FNumber: [
                    { required: true, message: '请输入工艺编码', trigger: 'blur' }
                ],
                FName: [
                    { required: true, message: '请输入工艺名称', trigger: 'blur' }
                ],
                craftDesc: [
                    { required: true, message: '请输入工艺描述', trigger: 'blur' }
                ],
                craftType: [
                    { required: true, message: '请选择工艺类型', trigger: 'change' }
                ],
                productStage: [
                    { required: true, message: '请选择生产阶段', trigger: 'change' }
                ],
                productName: [
                    { required: true, message: '请选择产品名称', trigger: 'change' }
                ],
                componentName: [
                    { required: true, message: '请选择组件名称', trigger: 'change' }
                ],
                businessType: [
                    { required: true, message: '请输入业务类型', trigger: 'blur' }
                ]
            }
        }
    },
    methods: {
        // 工艺列表相关方法
        async fetchCraftData() {
            this.craftTableData.listLoading = true;
            try {
                let req = this.searchData();
                req.page = this.craftTableData.currentPage;
                req.limit = this.craftTableData.pageSize;
                const result = await getData("craft", req);
                this.craftTableData.tableList = result.data;
                this.craftTableData.total = result.countnum;
            } catch (error) {
                console.error('获取数据失败:', error);
                this.$message.error('获取数据失败');
            } finally {
                this.craftTableData.listLoading = false;
            }
        },

        handleCraftTableCurrentChange(currentPage) {
            this.craftTableData.currentPage = currentPage;
            this.fetchCraftData();
        },

        handleCraftTableSizeChange(pageSize) {
            this.craftTableData.pageSize = pageSize;
            this.fetchCraftData();
        },

        // 工序列表相关方法
        async fetchProcessData() {
            this.processTableData.listLoading = true;
            try {
                const craftId = this.craftForm._id;
                if (!craftId) return;

                let req = {
                    query: {
                        craftId: craftId
                    },
                    page: this.processTableData.currentPage,
                    limit: this.processTableData.pageSize
                };
                const result = await getData("process", req);
                this.processTableData.tableList = result.data;
                this.processTableData.total = result.countnum;
            } catch (error) {
                console.error('获取工序数据失败:', error);
                this.$message.error('获取工序数据失败');
            } finally {
                this.processTableData.listLoading = false;
            }
        },

        handleProcessTableCurrentChange(currentPage) {
            this.processTableData.currentPage = currentPage;
            this.fetchProcessData();
        },

        handleProcessTableSizeChange(pageSize) {
            this.processTableData.pageSize = pageSize;
            this.fetchProcessData();
        },

        // 工序操作相关方法
        handleAddProcess() {
            // TODO: 实现新增工序的逻辑
        },

        handleEditProcess(row) {
            // TODO: 实现编辑工序的逻辑
        },

        handleDeleteProcess(row) {
            // TODO: 实现删除工序的逻辑
        },

        // 状态相关方法
        getStatusType(status) {
            const statusMap = {
                'CREATE': 'info',
                'ENABLE': 'success',
                'VOID': 'danger'
            }
            return statusMap[status] || 'info'
        },

        getStatusText(status) {
            const statusMap = {
                'CREATE': '创建',
                'ENABLE': '启用',
                'VOID': '作废'
            }
            return statusMap[status] || status
        },

        // 搜索相关方法
        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };

            if (this.searchForm.FNumber) {
                req.query.$and.push({ FNumber: { $regex: this.searchForm.FNumber, $options: 'i' } });
            }
            if (this.searchForm.FName) {
                req.query.$and.push({ FName: { $regex: this.searchForm.FName, $options: 'i' } });
            }
            if (this.searchForm.FDocumentStatus) {
                req.query.$and.push({ FDocumentStatus: this.searchForm.FDocumentStatus });
            }
            if (this.searchForm.craftType) {
                req.query.$and.push({ craftType: this.searchForm.craftType });
            }
            if (this.searchForm.FProductType) {
                req.query.$and.push({ FProductType: this.searchForm.FProductType });
            }
            if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
                req.query.$and.push({
                    createTime: {
                        $gte: this.searchForm.dateRange[0],
                        $lte: this.searchForm.dateRange[1]
                    }
                });
            }

            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
        },

        search() {
            this.craftTableData.currentPage = 1;
            this.fetchCraftData();
        },

        resetForm() {
            this.$refs.searchForm.resetFields();
            this.searchForm = {
                FName: '',
                FNumber: '',
                dateRange: [],
                FDocumentStatus: '',
                FProductType: '',
                craftType: ''
            };
            this.craftTableData.currentPage = 1;
            this.fetchCraftData();
        },

        // 工艺表单相关方法
        handleAdd() {
            this.dialogStatus = 'create';
            this.dialogFormVisible = true;
            this.craftForm = {
                FNumber: '',
                FName: '',
                craftDesc: '',
                craftType: '',
                productStage: '',
                productName: '',
                componentName: '',
                businessType: '',
                status: 'CREATE'
            };
            // 重置工序列表
            this.processTableData.tableList = [];
            this.processTableData.total = 0;
        },

        handleEdit(row) {
            this.dialogStatus = 'edit';
            this.dialogFormVisible = true;
            this.craftForm = JSON.parse(JSON.stringify(row));
            // 加载对应的工序数据
            this.fetchProcessData();
        },

        handleDelete(row) {
            this.$confirm('确认要删除该工艺吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData('craft', row._id);
                    this.$message.success('删除成功');
                    this.fetchCraftData();
                } catch (error) {
                    console.error('删除失败:', error);
                    this.$message.error('删除失败');
                }
            }).catch(() => {
                this.$message.info('已取消删除');
            });
        },

        submitForm() {
            this.$refs.craftForm.validate(async (valid) => {
                if (valid) {
                    try {
                        if (this.dialogStatus === 'edit') {
                            await updateData('craft', this.craftForm._id, this.craftForm);
                            this.$message.success('更新成功');
                        } else {
                            await addData('craft', this.craftForm);
                            this.$message.success('添加成功');
                        }
                        this.dialogFormVisible = false;
                        this.fetchCraftData();
                    } catch (error) {
                        console.error('操作失败:', error);
                        this.$message.error('操作失败');
                    }
                } else {
                    return false;
                }
            });
        },

        toggleAdvanced() {
            this.showAdvanced = !this.showAdvanced;
        }
    },
    created() {
        this.fetchCraftData();
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
    align-items: center;
    justify-content: space-between;
}

.el-icon-tickets {
    line-height: 30px;
}
</style>