<template>
    <div class="app-container">
        <!-- 搜索表单 -->
        <div class="screen1">
            <el-form :model="searchForm" ref="searchForm" class="screen_content_first">
                <el-form-item label="订单编号">
                    <el-input v-model="searchForm.FBillNo" placeholder="请输入订单编号" clearable></el-input>
                </el-form-item>

                <el-form-item label="销售订单号">
                    <el-input v-model="searchForm.DEMANDBILLNO" placeholder="请输入销售订单号" clearable></el-input>
                </el-form-item>

                <el-form-item label="供应商编号">
                    <el-input v-model="searchForm.FSupplierId.Number" placeholder="请输入供应商编号" clearable></el-input>
                </el-form-item>

                <el-form-item label="单据状态">
                    <el-select v-model="searchForm.FDocumentStatus" placeholder="请选择单据状态" clearable>
                        <el-option label="草稿" value="A" />
                        <el-option label="审核中" value="B" />
                        <el-option label="已审核" value="C" />
                        <el-option label="重新审核" value="D" />
                    </el-select>
                </el-form-item>

                <el-form-item label="业务状态">
                    <el-select v-model="searchForm.FCloseStatus" placeholder="请选择业务状态" clearable>
                        <el-option label="未关闭" value="A" />
                        <el-option label="已关闭" value="B" />
                    </el-select>
                </el-form-item>

                <!-- 高级搜索部分 -->
                <div v-if="showAdvanced" class="screen_content_second">
                    <el-form-item label="采购组织">
                        <el-input v-model="searchForm.FPurchaseOrgId.Number" placeholder="请输入采购组织编号"
                            clearable></el-input>
                    </el-form-item>

                    <el-form-item label="采购员">
                        <el-input v-model="searchForm.FPurchaserId" placeholder="请输入采购员" clearable></el-input>
                    </el-form-item>

                    <el-form-item label="创建日期">
                        <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
                            start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd">
                        </el-date-picker>
                    </el-form-item>
                </div>

                <div class="screen_content_second_one">
                    <el-button
                        type="primary"
                        @click="fetchData"
                        >
                        查询
                    </el-button>
                    <el-button
                        @click="resetForm"
                        >
                        重置
                    </el-button>
                    <el-button
                        type="warning"
                        @click="handleSync"
                        v-if="$checkPermission('采购订单同步数据')">
                        同步数据
                    </el-button>
                    <el-button
                        type="text"
                        @click="showAdvanced = !showAdvanced"
                        >
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
                    <i class="el-icon-tickets">采购订单列表</i>
                    <hir-input ref="hirInput" :printData="printData" :default-template="localPrintTemplate"
                        :template-params="{
                            // templateType: { $in: ['WM', 'AP'] },
                            status: true
                        }" placeholder="请选择采购订单打印模板" @template-change="handleTemplateChange" />
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
                        <el-table :data="props.row.FPOOrderEntry || []" border style="width: 100%">
                            <!-- 添加销售订单号列 -->
                            <el-table-column label="销售订单号" prop="DEMANDBILLNO" min-width="120" />

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
                            <el-table-column label="采购单位" prop="FUnitId" width="100" />
                            <el-table-column label="采购数量" prop="FQty" width="100" />
                            <el-table-column label="已收数量" prop="FReceiveQty" width="100" />
                            <el-table-column label="剩余数量" prop="FRemainReceiveQty" width="100" />

                            <!-- 价格信息 -->
                            <el-table-column label="单价" width="100">
                                <template slot-scope="scope">
                                    {{ formatNumber(scope.row.FPrice) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="含税单价" width="100">
                                <template slot-scope="scope">
                                    {{ formatNumber(scope.row.FTaxPrice) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="金额" width="120">
                                <template slot-scope="scope">
                                    {{ formatNumber(scope.row.FAmount) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="税率" width="80">
                                <template slot-scope="scope">
                                    {{ scope.row.FTaxRate }}%
                                </template>
                            </el-table-column>

                            <!-- 交货信息 -->
                            <el-table-column label="交货日期" width="160">
                                <template slot-scope="scope">
                                    {{ formatDate(scope.row.FDeliveryDate) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="备注" prop="FNote" min-width="150" />
                        </el-table>
                    </template>
                </el-table-column>

                <!-- 主表列 -->
                <el-table-column label="采购单号" prop="FBillNo" min-width="120" />
                <el-table-column label="供应商" min-width="180">
                    <template slot-scope="scope">
                        <el-tooltip :content="getSupplierInfo(scope.row.FSupplierId)" placement="top">
                            <span>{{ getSupplierInfo(scope.row.FSupplierId) }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>

                <el-table-column label="采购组织" min-width="180">
                    <template slot-scope="scope">
                        <el-tooltip :content="getOrgInfo(scope.row.FPurchaseOrgId)" placement="top">
                            <span>{{ getOrgInfo(scope.row.FPurchaseOrgId) }}</span>
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

                <el-table-column label="业务状态" width="100">
                    <template slot-scope="scope">
                        <el-tag :type="scope.row.FCloseStatus === 'A' ? 'success' : 'danger'">
                            {{ scope.row.FCloseStatus === 'A' ? '未关闭' : '已关闭' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="单据金额" width="120">
                    <template slot-scope="scope">
                        {{ formatNumber(getBillAmount(scope.row.FPOOrderFinance)) }}
                    </template>
                </el-table-column>

                <el-table-column label="版本号" width="80" prop="FVersionNo" />
                <el-table-column label="创建人" width="120" prop="FCreatorId" />

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
                        <el-button type="text" size="small" v-if="$checkPermission('采购订单同步')" @click="handleOneSync(scope.row)">同步</el-button>
                        <!-- <el-button type="text" size="small" @click="handleExt(scope.row)">拓展数据</el-button> -->
                        <el-button type="text" size="small" v-if="$checkPermission('采购订单物料明细')" @click="showMaterialDetail(scope.row)">物料明细</el-button>
                        <el-button type="text" size="small" v-if="$checkPermission('采购订单打印')" @click="handlePrint(scope.row)">打印</el-button>

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
        <el-dialog title="同步采购订单" :visible.sync="syncDialogVisible" width="500px">
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
                <el-form-item label="采购单号" required v-if="syncForm.syncType === 'billNo'">
                    <el-input v-model="syncForm.billNo" placeholder="请输入采购单号"></el-input>
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
import { syncPUR_PurchaseOrder, getSyncStatus } from "@/api/K3Data";
import HirInput from '@/components/hirInput/index.vue'
import MaterialDetail from './components/MaterialDetail.vue'
export default {
    name: 'purchaseOrder',
    components: {
        HirInput,
        MaterialDetail
    },
    computed: {
        localPrintTemplate: {
            get() {
                try {
                    const savedTemplate = localStorage.getItem('printTemplate_saleOrder');
                    return savedTemplate ? JSON.parse(savedTemplate) : null;
                } catch (error) {
                    console.error('解析缓存模板失败:', error);
                    return null;
                }
            },
            set(value) {
                try {
                    localStorage.setItem('printTemplate_saleOrder', JSON.stringify(value));
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
                DEMANDBILLNO: '',
                FSupplierId: {
                    Number: ''
                },
                FPurchaseOrgId: {
                    Number: ''
                },
                FDocumentStatus: '',
                FCloseStatus: '',
                FPurchaserId: '',
                dateRange: [],
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
            },
            extDialogVisible: false,
            currentOrderId: '',
            currentOrderData: {},
            printDialogVisible: false,
            printData: {},
            printTemplate: {},
            materialDetailVisible: false,
        }
    },
    methods: {
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
        // ... 其他方法保持与 material 页面类似,修改相应的字段名和业务逻辑
        // 这里只列出一些需要特别修改的方法
        // 获取状态标签类型
        getStatusType(status) {
            const statusMap = {
                'A': 'info',
                'B': 'warning',
                'C': 'success',
                'D': 'danger'
            }
            return statusMap[status] || 'info'
        },

        // 获取状态显示文本
        getStatusText(status) {
            const statusMap = {
                'A': '草稿',
                'B': '审核中',
                'C': '已审核',
                'D': '重新审核'
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

                const result = await getData("K3_PUR_PurchaseOrder", req);

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
        handleExt(row) {
            this.currentOrderId = row._id
            this.currentOrderData = row
            this.extDialogVisible = true
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

                await removeData('K3_PUR_PurchaseOrder', row._id);
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
                    await updateData('K3_PUR_PurchaseOrder', formData._id, formData);
                    this.$message.success('更新成功');
                } else {
                    await addData('K3_PUR_PurchaseOrder', formData);
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

            if (this.searchForm.FBillNo) {
                req.query.$and.push({ FBillNo: { $regex: this.searchForm.FBillNo.trim(), $options: 'i' } });
            }

            if (this.searchForm.DEMANDBILLNO) {
                req.query.$and.push({
                    'FPOOrderEntry.DEMANDBILLNO': {
                        $regex: this.searchForm.DEMANDBILLNO.trim(),
                        $options: 'i'
                    }
                });
            }

            if (this.searchForm.FSupplierId.Number) {
                req.query.$and.push({ 'FSupplierId.Number': { $regex: this.searchForm.FSupplierId.Number.trim(), $options: 'i' } });
            }

            if (this.searchForm.FPurchaseOrgId.Number) {
                req.query.$and.push({ 'FPurchaseOrgId.Number': { $regex: this.searchForm.FPurchaseOrgId.Number.trim(), $options: 'i' } });
            }

            if (this.searchForm.FDocumentStatus) {
                req.query.$and.push({ FDocumentStatus: this.searchForm.FDocumentStatus });
            }

            if (this.searchForm.FCloseStatus) {
                req.query.$and.push({ FCloseStatus: this.searchForm.FCloseStatus });
            }

            if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
                req.query.$and.push({
                    FCreateDate: {
                        $gte: this.searchForm.dateRange[0] + ' 00:00:00',
                        $lte: this.searchForm.dateRange[1] + ' 23:59:59'
                    }
                });
            }

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

                await updateData('K3_PUR_PurchaseOrder', row._id, updatedData);
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
                DEMANDBILLNO: '',
                FSupplierId: {
                    Number: ''
                },
                FPurchaseOrgId: {
                    Number: ''
                },
                FDocumentStatus: '',
                FCloseStatus: '',
                FPurchaserId: '',
                dateRange: [],
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

                await removeData('K3_PUR_PurchaseOrder', { query: { _id: row._id } });
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

                await updateData('K3_PUR_PurchaseOrder', row._id, updatedData);
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
                            await addData('K3_PUR_PurchaseOrder', this.dataForm);
                            this.$message.success('创建成功');
                        } else {
                            await updateData('K3_PUR_PurchaseOrder', this.dataForm._id, this.dataForm);
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

                const response = await syncPUR_PurchaseOrder(req);
                if (response.code === 200) {
                    this.startSyncProgressCheck();
                    if (response.taskStatus) {
                        this.$message.success(`同步中：当前${response.taskStatus.processedRecords}条数据同步完成，耗时${response.taskStatus.elapsedTime}秒`);
                    } else {
                        this.$message.success('同步任务已启动');
                    }
                } else {
                    this.$message.error(response.message || '采购订单同步失败');
                }
            } catch (error) {
                console.error('采购订单同步失败:', error);
                this.$message.error('采购订单同步失败');
            }
        },
        // 批量同步
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
                this.$message.warning('请输入采购单号');
                return;
            }

            try {
                let confirmMessage = '';
                switch (this.syncForm.syncType) {
                    case 'all':
                        confirmMessage = '确认要同步所有采购订单数据吗？此操作可能需要较长时间';
                        break;
                    case 'date':
                        confirmMessage = '确认要同步规则筛选的采购订单数据吗？';
                        break;
                    case 'billNo':
                        confirmMessage = `确认要同步单号为 ${this.syncForm.billNo} 的采购订单数据吗？`;
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
                    let req = this.buildSyncRequest();
                    const response = await syncPUR_PurchaseOrder(req);

                    if (response.code === 200) {
                        this.syncDialogVisible = false;
                        loading.close();
                        this.startSyncProgressCheck();
                        if (response.taskStatus) {
                            this.$message.success(`采购订单同步中：当前${response.taskStatus.processedRecords}条数据同步完成，耗时${response.taskStatus.elapsedTime}秒`);
                        } else {
                            this.$message.success('采购订单同步任务已启动');
                        }
                    } else {
                        loading.close();
                        this.$message.error(response.message || '采购订单同步失败');
                    }
                } catch (error) {
                    loading.close();
                    console.error('采购订单同步失败:', error);
                    this.$message.error('采购订单同步失败: ' + error.message);
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('采购订单同步失败:', error);
                    this.$message.error('采购订单同步失败');
                }
            }
        },

        // 构建同步请求
        buildSyncRequest() {
            let req = {
                FilterString: []
            };

            switch (this.syncForm.syncType) {
                case 'date':
                    const [startDate, endDate] = this.syncForm.dateRange;
                    req.FilterString = [
                        {
                            FieldName: "FDocumentStatus",
                            Compare: "StatusEqualto",
                            Value: this.syncForm.documentStatus,
                            Left: "",
                            Right: "",
                            Logic: 0
                        },
                        {
                            FieldName: "FCreateDate",
                            Compare: ">=",
                            Value: `${startDate} 00:00:00`,
                            Left: "",
                            Right: "",
                            Logic: 0
                        },
                        {
                            FieldName: "FCreateDate",
                            Compare: "<=",
                            Value: `${endDate} 23:59:59`,
                            Left: "",
                            Right: "",
                            Logic: 0
                        }
                    ];
                    break;
                case 'billNo':
                    req.FilterString = [
                        {
                            FieldName: "FBillNo",
                            Compare: "IN",
                            Value: this.syncForm.billNo,
                            Left: "",
                            Right: "",
                            Logic: 0
                        }
                    ];
                    break;
                case 'all':
                    req.FilterString = [
                        {
                            FieldName: "FDocumentStatus",
                            Compare: "StatusEqualto",
                            Value: "C",
                            Left: "",
                            Right: "",
                            Logic: 0
                        }
                    ];
                    break;
            }
            return req;
        },

        // 开始同步进度检查
        startSyncProgressCheck() {
            if (this.syncProgressTimer) {
                clearInterval(this.syncProgressTimer);
            }

            this.syncProgressTimer = setInterval(async () => {
                try {
                    const response = await getSyncStatus('K3_PUR_PurchaseOrder');
                    if (response.code === 200) {
                        const task = response.taskStatus;
                        if (task) {
                            switch (task.status) {
                                case 'running':
                                    this.$notify({
                                        type: 'info',
                                        message: `采购订单同步中：当前${task.processedRecords}条数据同步完成，耗时${task.elapsedTime}秒`,
                                        duration: 5000
                                    });
                                    break;
                                case 'no_task':
                                case 'completed':
                                    this.$message.success('采购订单同步完成！');
                                    this.stopSyncProgressCheck();
                                    this.fetchData();
                                    break;
                                default:
                                    this.$message.warning('未知的同步状态');
                                    this.stopSyncProgressCheck();
                            }
                        } else {
                            this.$message.warning('未找到采购订单同步任务');
                            this.stopSyncProgressCheck();
                        }
                    }
                } catch (error) {
                    console.error('查询采购订单同步进度失败:', error);
                    this.$message.error('查询采购订单同步进度失败');
                    this.stopSyncProgressCheck();
                }
            }, 5000);
        },

        // 停止同步进度检查
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

        // 拓展信息保存成功的回调
        handleExtSaved() {
            this.fetchData() // 刷新列表数据
        },

        async handlePrint(row) {
            console.log("🚀 ~ handlePrint ~ row:", row)
            console.log("🚀 ~ handlePrint ~ row:", this.localPrintTemplate)
            // FNum
            let printData = { ...row };
            //材料入库单
            if (this.localPrintTemplate.templateType === 'WM') {
                printData.FApproveDate = this.formatDate(printData.FApproveDate);
                printData.FCreateDate = this.formatDate(printData.FCreateDate);
                printData.totalFQty = printData.FPOOrderEntry.reduce((sum, item) => sum + item.FQty, 0);
                printData.FSupplierId_Name = printData.FSupplierId && printData.FSupplierId.Name;
                printData.FSupplierId_Number = printData.FSupplierId && printData.FSupplierId.Number;
                printData.FPOOrderEntry.map((item, index) => {
                    console.log(item)
                    item.FNum = index + 1;
                    item.FMaterialId_Name = item.FMaterialId && item.FMaterialId.Name;
                    item.FMaterialId_Number = item.FMaterialId && item.FMaterialId.Number;
                    item.FMaterialId_Specification = item.FMaterialId && item.FMaterialId.Specification;
                    item.FDeliveryDate = this.formatDate(item.FDeliveryDate);
                })
                //格式化时间
                printData.FDate = this.formatDate(printData.FDate);
            }
            // 采购订单
            if (this.localPrintTemplate.templateType === 'AP') {
                printData.FApproveDate = this.formatDate(printData.FApproveDate);
                printData.FCreateDate = this.formatDate(printData.FCreateDate);
                printData.totalFQty = printData.FPOOrderEntry.reduce((sum, item) => sum + item.FQty, 0);
                printData.FSupplierId_Name = printData.FSupplierId && printData.FSupplierId.Name;
                printData.FSupplierId_Number = printData.FSupplierId && printData.FSupplierId.Number;
                printData.FPOOrderEntry.map((item, index) => {
                    item.FNum = index + 1;
                    item.FMaterialId_Name = item.FMaterialId && item.FMaterialId.Name;
                    item.FMaterialId_Number = item.FMaterialId && item.FMaterialId.Number;
                    item.FMaterialId_Specification = item.FMaterialId && item.FMaterialId.Specification;
                    item.FDeliveryDate = this.formatDate(item.FDeliveryDate);
                })
            }
            this.printData = printData;
            console.log("🚀 ~ handlePrint ~ printData:", printData)
            this.$nextTick(() => {
                this.$refs.hirInput.handlePrints();
            });
        },

        handlePrintDialogClose() {
            this.printDialogVisible = false
            this.currentOrderId = ''
            this.currentOrderData = {}
        },

        handleMaterialDetailClose() {
            this.materialDetailVisible = false
            this.currentOrderData = {}
        },

        showMaterialDetail(row) {
            this.currentOrderData = row
            this.materialDetailVisible = true
        },

        // 新增的辅助方法
        getMaterialNumber(material) {
            return material ? material.Number : '-'
        },
        getMaterialName(material) {
            return material ? material.Name : '-'
        },
        getMaterialSpec(material) {
            return material ? material.Specification : '-'
        },
        getSupplierInfo(supplier) {
            if (!supplier) return '-'
            return `${supplier.Number} - ${supplier.Name || '-'}`
        },
        getSupplierName(supplier) {
            return supplier ? supplier.Name : '-'
        },
        getOrgInfo(org) {
            if (!org) return '-'
            return `${org.Number} - ${org.Name || '-'}`
        },
        getOrgName(org) {
            return org ? org.Name : '-'
        },
        getBillAmount(finance) {
            return finance ? finance.FBillAllAmount : 0
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
