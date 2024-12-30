<template>
    <div class="app-container">
        <!-- 搜索卡片 -->
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
                        <el-form-item label="订单编号">
                            <el-input v-model="searchForm.FBillNo" placeholder="请输入订单编号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="客户编号">
                            <el-input v-model="searchForm.FCustId" placeholder="请输入客户编号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="单据状态">
                            <el-select v-model="searchForm.FDocumentStatus" placeholder="请选择单据状态" clearable
                                style="width: 100%">
                                <el-option label="草稿" value="A" />
                                <el-option label="审核中" value="B" />
                                <el-option label="已审核" value="C" />
                                <el-option label="重新审核" value="D" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="业务状态">
                            <el-select v-model="searchForm.FCloseStatus" placeholder="请选择业务状态" clearable
                                style="width: 100%">
                                <el-option label="未关闭" value="A" />
                                <el-option label="已关闭" value="B" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <div v-show="showAdvanced">
                    <el-row :gutter="20">
                        <el-col :span="6">
                            <el-form-item label="销售部门">
                                <el-input v-model="searchForm.FSaleDeptId" placeholder="请输入销售部门编号" clearable></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="销售员">
                                <el-input v-model="searchForm.FSalerId" placeholder="请输入销售员编号" clearable></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="创建日期">
                                <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
                                    start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd"
                                    style="width: 100%">
                                </el-date-picker>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </div>

                <el-row :gutter="20" v-show="showAdvanced">
                    <el-col :span="6">
                        <el-form-item label="物料编码">
                            <el-input v-model="searchForm.FMaterialId" placeholder="请输入物料编码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="客户PO">
                            <el-input v-model="searchForm.F_TFQJ_khpo" placeholder="请输入客户PO" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="客户PO行号">
                            <el-input v-model="searchForm.F_TFQJ_Text1" placeholder="请输入客户PO行号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <!-- <el-button type="success" @click="exportData">导出数据</el-button> -->
                    <el-button type="warning" @click="handleSync">同步订单</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 列表标题区 -->
        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">销售订单列表</i>
                    <!-- <el-button type="primary" @click="handleAdd">新增订单</el-button> -->
                </div>
            </div>
        </div>

        <!-- 表格区域 -->
        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @selection-change="handleSelectionChange" @handleCurrentChange="baseTableHandleCurrentChange"
            :cell-style="{ textAlign: 'center' }" @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">
                <el-table-column label="销售单号" prop="FBillNo">
                    <template slot-scope="scope">
                        <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.FBillNo }}</el-link>
                    </template>
                </el-table-column>

                <el-table-column label="单据类型" prop="FBillTypeID" width="100">
                    <template slot-scope="scope">
                        {{ getDocumentTypeText(scope.row.FBillTypeID) }}
                    </template>
                </el-table-column>

                <el-table-column label="客户" prop="FCustId" width="200">
                    <template slot-scope="scope">
                        <el-tooltip :content="scope.row.FSettleAddress" placement="top">
                            <span>{{ scope.row.FSettleId || '-' }}</span>
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

                <el-table-column label="修改日期" prop="FModifyDate" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.FModifyDate) }}
                    </template>
                </el-table-column>

                <el-table-column label="销售部门" prop="FSaleDeptId" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FSaleDeptId || '-' }}
                    </template>
                </el-table-column>

                <el-table-column label="销售员" prop="FSalerId" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FSalerId || '-' }}
                    </template>
                </el-table-column>

                <el-table-column label="创建日期" prop="FCreateDate" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.FCreateDate) }}
                    </template>
                </el-table-column>

                <el-table-column label="业务关闭" width="100">
                    <template slot-scope="scope">
                        <el-tag :type="scope.row.FCloseStatus === 'A' ? 'success' : 'danger'">
                            {{ scope.row.FCloseStatus === 'A' ? '未关闭' : '已关闭' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="物料属性" width="100">
                    <template slot-scope="scope">
                        <el-tag size="mini" :type="getMaterialPropertyTagType(scope.row.FDocumentStatus)">
                            {{ getMaterialPropertyText(scope.row.FDocumentStatus) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="越南不调拨" width="100">
                    <template slot-scope="scope">
                        <el-tag size="mini" :type="scope.row.FCancelStatus === 'B' ? 'danger' : 'success'">
                            {{ scope.row.FCancelStatus === 'B' ? '是' : '否' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="物料编码" prop="FMaterialId" width="120">
                    <template slot-scope="scope">
                        <el-tooltip :content="scope.row.FMaterialName" placement="top">
                            <span>{{ scope.row.FMaterialId || '-' }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>

                <el-table-column label="物料名称" prop="FMaterialName" width="180">
                    <template slot-scope="scope">
                        <el-tooltip :content="scope.row.FMaterialModel" placement="top">
                            <span>{{ scope.row.FMaterialName || '-' }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>

                <el-table-column label="规格型号" prop="FMaterialModel" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FMaterialModel || '-' }}
                    </template>
                </el-table-column>

                <el-table-column label="销售数量" prop="FQty" width="100">
                    <template slot-scope="scope">
                        <span>{{ scope.row.FQty || '0' }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="单位" prop="FUnitID" width="80">
                    <template slot-scope="scope">
                        {{ scope.row.FUnitID || '-' }}
                    </template>
                </el-table-column>

                <el-table-column label="客户PO" prop="F_TFQJ_khpo" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.F_TFQJ_khpo || '-' }}
                    </template>
                </el-table-column>

                <el-table-column label="客户PO行号" prop="F_TFQJ_Text1" width="100">
                    <template slot-scope="scope">
                        {{ scope.row.F_TFQJ_Text1 || '-' }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" fixed="right" width="100">
                    <template slot-scope="scope">
                        <el-button type="text" size="small" @click="handleOneSync(scope.row)">同步</el-button>
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <!-- 新增/编辑对话框 -->
        <!-- <el-dialog :title="dialogStatus === 'create' ? '新增订单' : '编辑订单'" :visible.sync="dialogFormVisible" width="60%">
            <el-form ref="dataForm" :model="dataForm" :rules="rules" label-width="100px">
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialogFormVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitForm">确 定</el-button>
            </div>
        </el-dialog> -->

        <!-- 添加同步订单弹窗 -->
        <el-dialog title="同步销售订单" :visible.sync="syncDialogVisible" width="500px">
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
                <el-form-item label="销售单号" required v-if="syncForm.syncType === 'billNo'">
                    <el-input v-model="syncForm.billNo" placeholder="请输入销售单号"></el-input>
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
import { syncSAL_SaleOrder, getSyncStatus } from "@/api/K3Data";

export default {
    name: 'SaleOrder',
    data() {
        return {
            searchForm: {
                FBillNo: '',
                FCustId: '',
                FDocumentStatus: '',
                FCloseStatus: '',
                FSaleDeptId: '',
                FSalerId: '',
                dateRange: [],
                FMaterialId: '',
                F_TFQJ_khpo: '',
                F_TFQJ_Text1: '',
            },
            tableList: [],
            total: 0,
            currentPage: 1,
            pageSize: 10,
            listLoading: true,
            showAdvanced: false,
            dialogFormVisible: false,
            dialogStatus: '',
            selection: [],
            dataForm: {
                FBillNo: '',
                FCustomerName: '',
                FDate: '',
                FTotalAmount: 0,
                FSaleDeptName: '',
                FSalerName: '',
                FDocumentStatus: 'DRAFT',
                FDeliveryMethod: ''
            },
            rules: {
                FCustomerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
                FDate: [{ required: true, message: '请选择订单日期', trigger: 'change' }],
                FSaleDeptName: [{ required: true, message: '请输入销售部门', trigger: 'blur' }]
            },
            syncProgressTimer: null,
            syncDialogVisible: false,
            syncForm: {
                syncType: 'date',
                dateRange: [],
                documentStatus: 'C',
                billNo: ''
            }
        }
    },
    methods: {
        // ... 其他方法保持与 material 页面类似,修改相应的字段名和业务逻辑
        // 这里只列出一些需要特别修改的方法
        // 获取状态标签类型
        getStatusType(status) {
            const statusMap = {
                'DRAFT': 'info',
                'APPROVED': 'success',
                'PROCESSING': 'warning',
                'REJECTED': 'danger'
            }
            return statusMap[status] || 'info'
        },

        // 获取状态显示文本
        getStatusText(status) {
            const statusMap = {
                'DRAFT': '草稿',
                'APPROVED': '已审核',
                'PROCESSING': '审核中',
                'REJECTED': '已拒绝'
            }
            return statusMap[status] || status
        },
        // 获取数据
        async fetchData() {
            this.listLoading = true;
            try {
                let req = this.searchData();
                req.page = this.currentPage;
                req.skip = (this.currentPage - 1) * this.pageSize;
                req.limit = this.pageSize;
                req.sort = { FNumber: 1 };
                req.count = true;

                const result = await getData("k3_SAL_SaleOrder", req);

                if (result.code === 200) {
                    // 直接使用原始数据,不需要映射转换
                    this.tableList = result.data;
                    console.log("111111111", result);
                    console.log("222222222", this.tableList);
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
        },// 分页方法
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
            return new Date(date).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        // 格式化金额
        formatNumber(num) {
            if (!num && num !== 0) return '¥0.00';
            return '¥' + Number(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },

        // 搜索方法
        search() {
            this.currentPage = 1;
            this.fetchData();
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
        // handleEdit(row) {
        //     this.dataForm = JSON.parse(JSON.stringify(row));
        //     this.dialogStatus = 'edit';
        //     this.dialogFormVisible = true;
        // },

        // 删除
        async handleDelete(row) {
            try {
                await this.$confirm('确认要删除该订单吗？删除后不可恢复！', '警告', {
                    type: 'warning',
                    confirmButtonText: '确定删除',
                    confirmButtonClass: 'el-button--danger'
                });

                await removeData('k3_SAL_SaleOrder', row._id);
                this.$message.success('删除成功');
                this.fetchData();
            } catch (error) {
                if (error === 'cancel') {
                    this.$message.info('已取消删除');
                } else {
                    console.error('删除失败:', error);
                    this.$message.error('删除失败');
                }
            }
        },

        // 提交表单
        async handleSubmit(formData) {
            try {
                if (this.dialogStatus === 'edit') {
                    await updateData('k3_SAL_SaleOrder', formData._id, formData);
                    this.$message.success('更新成功');
                } else {
                    await addData('k3_SAL_SaleOrder', formData);
                    this.$message.success('添加成功');
                }
                this.dialogFormVisible = false;
                this.fetchData();
            } catch (error) {
                console.error('操作失败:', error);
                this.$message.error('操作失败');
            }
        },
        // 构建查询条件
        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };

            // 遍历searchForm中的值,构建查询条件
            Object.entries(this.searchForm).forEach(([key, value]) => {
                if (value) {
                    switch (key) {
                        case 'FBillNo':
                        case 'FCustId':
                        case 'FSaleDeptId':
                        case 'FSalerId':
                            if (value.trim()) {
                                req.query.$and.push({ [key]: { $regex: value.trim(), $options: 'i' } });
                            }
                            break;
                        case 'FDocumentStatus':
                        case 'FCloseStatus':
                            req.query.$and.push({ [key]: value });
                            break;
                        case 'dateRange':
                            if (Array.isArray(value) && value.length === 2) {
                                req.query.$and.push({
                                    FCreateDate: {
                                        $gte: value[0] + ' 00:00:00',
                                        $lte: value[1] + ' 23:59:59'
                                    }
                                });
                            }
                            break;
                        case 'FMaterialId':
                        case 'F_TFQJ_khpo':
                        case 'F_TFQJ_Text1':
                            if (value.trim()) {
                                req.query.$and.push({ [key]: { $regex: value.trim(), $options: 'i' } });
                            }
                            break;
                    }
                }
            });

            // 如果没有查询条件,删除$and数组
            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
        },

        // 提交审核
        async handleSubmitAudit(row) {
            try {
                await this.$confirm('确认提交此订单进行审核？', '提示', {
                    type: 'warning'
                });

                const updatedData = {
                    ...row,
                    FDocumentStatus: 'PROCESSING',
                    FModifyDate: new Date(),
                    FModifierId: this.$store.state.user.name
                };

                await updateData('k3_SAL_SaleOrder', row._id, updatedData);
                this.$message.success('提交审核成功');
                this.fetchData();
            } catch (error) {
                console.error('提交审核失败:', error);
                this.$message.error('提交审核失败');
            }
        },

        // 转换单据状态
        convertDocumentStatus(status) {
            const statusMap = {
                'A': 'DRAFT',      // 创建
                'B': 'PROCESSING', // 审核中
                'C': 'APPROVED',   // 已审核
                'D': 'REJECTED'    // 已拒绝
            };
            return statusMap[status] || 'DRAFT';
        },

        // 获取单据类型文本
        getDocumentTypeText(typeId) {
            const typeMap = {
                'eacb50844fc84a10b03d7b841f3a6278': '标准销售订单'
                // ... 其他类型映射
            };
            return typeMap[typeId] || typeId;
        },

        // 获取物料属性文本
        getMaterialPropertyText(status) {
            const propertyMap = {
                'C': '自制',      // 已审核 -> 自制
                'B': '外购',      // 审核中 -> 外购
                'A': '委外'       // 草稿 -> 委外
            };
            return propertyMap[status] || status;
        },

        // 重置表单
        resetForm() {
            this.$refs.searchForm.resetFields();
            this.searchForm = {
                FBillNo: '',
                FCustId: '',
                FDocumentStatus: '',
                FCloseStatus: '',
                FSaleDeptId: '',
                FSalerId: '',
                dateRange: [],
                FMaterialId: '',
                F_TFQJ_khpo: '',
                F_TFQJ_Text1: '',
            };
            this.currentPage = 1;
            this.fetchData();
        },

        // 导出数据
        // exportData() {
        //     // 获取当前的查询条件
        //     const queryParams = this.searchData();
        //     // TODO: 实现导出逻辑
        //     this.$message.info('导出功能开发中...');
        // },

        // 添加缺失的事件处理方法
        // handleAdd() {
        //     this.dialogStatus = 'create';
        //     this.dialogFormVisible = true;
        //     this.$nextTick(() => {
        //         this.$refs['dataForm'].resetFields();
        //         this.dataForm = {
        //             FBillNo: '',
        //             FCustId: '',
        //             FDate: new Date(),
        //             FSaleDeptId: '',
        //             FSalerId: '',
        //             FDocumentStatus: 'A',
        //             FCloseStatus: 'A'
        //         };
        //     });
        // },

        handleEdit(row) {
            this.dialogStatus = 'edit';
            this.dialogFormVisible = true;
            this.$nextTick(() => {
                this.$refs['dataForm'].resetFields();
                this.dataForm = Object.assign({}, row);
            });
        },

        handleView(row) {
            this.dialogStatus = 'view';
            this.dialogFormVisible = true;
            this.$nextTick(() => {
                this.dataForm = Object.assign({}, row);
            });
        },

        async handleDelete(row) {
            try {
                await this.$confirm('确认要删除该订单吗？', '警告', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });

                await removeData('k3_SAL_SaleOrder', { query: { _id: row._id } });
                this.$message.success('删除成功');
                this.fetchData();
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('删除失败:', error);
                    this.$message.error('删除失败: ' + error.message);
                }
            }
        },

        async handleSubmitAudit(row) {
            try {
                await this.$confirm('确认提交此订单进行审核？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });

                const updatedData = {
                    ...row,
                    FDocumentStatus: 'B', // 更改为审核中状态
                    FModifyDate: new Date(),
                    FModifierId: this.$store.state.user.name
                };

                await updateData('k3_SAL_SaleOrder', row._id, updatedData);
                this.$message.success('提交审核成功');
                this.fetchData();
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('提交审核失败:', error);
                    this.$message.error('提交审核失败: ' + error.message);
                }
            }
        },

        // 表单提交
        submitForm() {
            this.$refs['dataForm'].validate(async (valid) => {
                if (valid) {
                    try {
                        if (this.dialogStatus === 'create') {
                            await addData('k3_SAL_SaleOrder', this.dataForm);
                            this.$message.success('创建成功');
                        } else {
                            await updateData('k3_SAL_SaleOrder', this.dataForm._id, this.dataForm);
                            this.$message.success('更新成功');
                        }
                        this.dialogFormVisible = false;
                        this.fetchData();
                    } catch (error) {
                        console.error('操作失败:', error);
                        this.$message.error('操作失败: ' + error.message);
                    }
                }
            });
        },

        // 获取物料属性标签类型
        getMaterialPropertyTagType(status) {
            const typeMap = {
                'C': 'primary',    // 已审核 -> 自制
                'B': 'success',    // 审核中 -> 外购
                'A': 'warning'     // 草稿 -> 委外
            };
            return typeMap[status] || 'info';
        },
        // 单个同步
        async handleOneSync(row) {
            console.log("🚀 ~ handleOneSync ~ row:", row)
            try {
                let req = {
                    "FilterString": []
                };

                await this.$confirm(`确认更新${row.FBillNo}的数据吗？`, '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });

                req.FilterString = [
                    {
                        "FieldName": "FID",
                        "Compare": "=",
                        "Value": row.FID,
                        "Left": "",
                        "Right": "",
                        "Logic": 0
                    }
                ];

                const response = await syncSAL_SaleOrder(req);
                if (response.code === 200) {
                    this.startSyncProgressCheck();
                    if (response.taskStatus) {
                        this.$message.success(`同步中：当前${response.taskStatus.processedRecords}条数据同步完成，耗时${response.taskStatus.elapsedTime}秒`);
                    } else {
                        this.$message.success('同步任务已启动');
                    }
                } else {
                    this.$message.error(response.message || '销售订单同步失败');
                }
            } catch (error) {
                console.error('销售订单同步失败:', error);
                this.$message.error('销售订单同步失败');
            }

        },
        // 添加同步订单方法
        handleSync() {
            this.syncDialogVisible = true;
            this.syncForm = {
                syncType: 'date',
                dateRange: [],
                documentStatus: 'C',
                billNo: ''
            };
        },

        // 添加确认同步方法
        async confirmSync() {
            // 验证表单
            if (this.syncForm.syncType === 'date' && (!this.syncForm.dateRange || this.syncForm.dateRange.length !== 2)) {
                this.$message.warning('请选择审核日期范围');
                return;
            }
            if (this.syncForm.syncType === 'billNo' && !this.syncForm.billNo) {
                this.$message.warning('请输入销售单号');
                return;
            }

            try {
                let confirmMessage = '';
                switch(this.syncForm.syncType) {
                    case 'all':
                        confirmMessage = '确认要同步所有销售订单数据吗？此操作可能需要较长时间';
                        break;
                    case 'date':
                        confirmMessage = '确认要同步选定日期范围的销售订单数据吗？此操作可能需要一些时间';
                        break;
                    case 'billNo':
                        confirmMessage = `确认要同步单号为 ${this.syncForm.billNo} 的销售订单数据吗？`;
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

                    switch(this.syncForm.syncType) {
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

                    const response = await syncSAL_SaleOrder(req);
                    if (response.code === 200) {
                        this.syncDialogVisible = false;
                        loading.close();
                        this.startSyncProgressCheck();
                        if (response.taskStatus) {
                            this.$message.success(`销售订单同步中：当前${response.taskStatus.processedRecords}条数据同步完成，耗时${response.taskStatus.elapsedTime}秒`);
                        } else {
                            this.$message.success('销售订单同步任务已启动');
                        }
                    } else {
                        loading.close();
                        this.$message.error(response.message || '销售订单同步失败');
                    }
                } catch (error) {
                    loading.close();
                    console.error('销售订单同步失败:', error);
                    this.$message.error('销售订单同步失败: ' + error.message);
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('销售订单同步失败:', error);
                    this.$message.error('销售订单同步失败');
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
                    const response = await getSyncStatus('k3_SAL_SaleOrder');
                    if (response.code === 200) {
                        const saleOrderTask = response.taskStatus;
                        if (saleOrderTask) {
                            switch (saleOrderTask.status) {
                                case 'running':
                                    this.$notify({
                                        type: 'info',
                                        message: `销售订单同步中：当前${saleOrderTask.processedRecords}条数据同步完成，耗时${saleOrderTask.elapsedTime}秒`,
                                        duration: 5000
                                    });
                                    break;

                                case 'no_task':
                                    this.$message.success(`销售订单同步完成！`);
                                    this.stopSyncProgressCheck();
                                    this.fetchData();
                                    break;
                                case 'completed':
                                    this.$message.success(`销售订单同步完成！`);
                                    this.stopSyncProgressCheck();
                                    this.fetchData();
                                    break;
                                default:
                                    this.$message.warning('未知的同步状态');
                                    this.stopSyncProgressCheck();
                            }
                        } else {
                            this.$message.warning('未找到销售订单同步任务');
                            this.stopSyncProgressCheck();
                        }
                    }
                } catch (error) {
                    console.error('查询销售订单同步进度失败:', error);
                    this.$message.error('查询销售订单同步进度失败');
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
