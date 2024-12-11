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
                            <el-select v-model="searchForm.FDocumentStatus" placeholder="请选择数据状态" clearable
                                style="width: 100%">
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
                            <el-select v-model="searchForm.FBaseUnitId_FNumber" placeholder="请选择基本单位" clearable
                                style="width: 100%">
                                <!-- 这里需要从后端获取单位列表 -->
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="仓库">
                            <el-select v-model="searchForm.FStockId_FNumber" placeholder="请选择仓库" clearable
                                style="width: 100%">
                                <!-- 这里需要从后端获取仓库列表 -->
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="是否长新物料">
                            <el-select v-model="searchForm.F_TFQJ_CheckBox" placeholder="请选择" clearable
                                style="width: 100%">
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
                                <el-select v-model="searchForm.FBOMCATEGORY" placeholder="请选择BOM分类" clearable
                                    style="width: 100%">
                                    <el-option label="标准BOM" value="STANDARD" />
                                    <el-option label="工程BOM" value="ENGINEERING" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="BOM用途">
                                <el-select v-model="searchForm.FBOMUSE" placeholder="请选择BOM用途" clearable
                                    style="width: 100%">
                                    <el-option label="生产用" value="PRODUCTION" />
                                    <el-option label="设计用" value="DESIGN" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="物料属性">
                                <el-select v-model="searchForm.FITEMPPROPERTY" placeholder="请选择物料属性" clearable
                                    style="width: 100%">
                                    <el-option label="外购" value="PURCHASE" />
                                    <el-option label="自制" value="SELF_MADE" />
                                    <el-option label="委外" value="OUTSOURCE" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="禁用状态">
                                <el-select v-model="searchForm.FForbidStatus" placeholder="请选择禁用状态" clearable
                                    style="width: 100%">
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
                    <el-button type="warning" @click="handleSync">同步物料</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">物料管理列表</i>
                    <!-- TODO:后续需要添加物料再打开 -->
                    <!-- <el-button type="primary" @click="handleAdd">新增物料</el-button> -->
                </div>
            </div>
        </div>

        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @selection-change="handleSelectionChange" @handleCurrentChange="baseTableHandleCurrentChange"
            :cell-style="{ textAlign: 'center' }" @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">
                <!-- FUseOrgId 使用组织 -->
                <el-table-column label="使用组织" prop="FUseOrgId" width="150" />
                <!-- FMATERIALID 物料ID -->
                <el-table-column label="物料ID" prop="FMATERIALID" width="150" />
                <el-table-column label="物料编码" prop="FNumber" width="120">
                    <template slot-scope="scope">
                        <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.FNumber }}</el-link>
                    </template>
                </el-table-column>
                <el-table-column label="物料名称" prop="FName" />
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
                        <el-button type="text" size="small" @click="handleViewFlowChart(scope.row)">查看流程图</el-button>
                        <el-button type="text" size="small" @click="handleEdit(scope.row)">DI码管理</el-button>
                        <el-button type="text" size="small" @click="handleOneSync(scope.row)">同步</el-button>
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <!-- 新增/编辑对话框 -->
        <el-dialog :title="dialogStatus === 'create' ? '新增物料' : '编辑物料'" :visible.sync="dialogFormVisible" width="60%">
            <el-form ref="dataForm" :model="dataForm" :rules="rules" label-width="100px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="物料编码" prop="FNumber">
                            <el-input v-model="dataForm.FNumber" readonly :disabled="dialogStatus === 'view'"
                                placeholder="请输入物料编码"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="物料名称" prop="FName">
                            <el-input v-model="dataForm.FName" readonly :disabled="dialogStatus === 'view'"
                                placeholder="请输入物料名称"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <!-- 添加DI码管理 -->
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="DI码" prop="diNum">
                            <el-input v-model="DINum" placeholder="请输入DI码" clearable>
                            </el-input>
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

        <!-- 使用新的流程图组件 -->
        <material-flow-chart :visible.sync="flowChartDialogVisible" :loading="flowChartLoading"
            :flow-data="processedFlowChartData" />

        <!-- 添加同步物料弹窗 -->
        <el-dialog title="同步物料数据" :visible.sync="syncDialogVisible" width="500px">
            <el-form :model="syncForm" ref="syncForm" label-width="100px">
                <el-form-item label="同步方式">
                    <el-radio-group v-model="syncForm.syncType">
                        <el-radio label="number">按物料编号同步</el-radio>
                        <el-radio label="date">按日期同步</el-radio>
                        <el-radio label="all">同步全部</el-radio>
                    </el-radio-group>
                </el-form-item>

                <!-- 物料编号输入框 -->
                <el-form-item label="物料编号" v-if="syncForm.syncType === 'number'">
                    <el-input type="textarea" :rows="3" v-model="syncForm.materialNumbers"
                        placeholder="请输入物料编号，多个编号用英文逗号分隔"></el-input>
                </el-form-item>

                <!-- 日期选择 -->
                <el-form-item label="审核日期" v-if="syncForm.syncType === 'date'">
                    <el-date-picker v-model="syncForm.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" style="width: 100%">
                    </el-date-picker>
                </el-form-item>

                <!-- 单据状态选择 -->
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
import { syncBD_MATERIAL, getSyncStatusAll, getSyncStatus } from "@/api/K3Data";
import MaterialFlowChart from './MaterialFlowChart.vue'

export default {
    name: 'MaterialManagement',
    dicts: ['product_type'],
    components: {
        MaterialFlowChart
    },
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
                FModifyDate: null,
                diNum: '', // 添加DI码字段
            },
            DINum: '',
            rules: {
                FName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
                FBaseUnitId_FNumber: [{ required: true, message: '请选择基本单位', trigger: 'change' }],
                FStockId_FNumber: [{ required: true, message: '请选择仓库', trigger: 'change' }],
                FCreateOrgId: [{ required: true, message: '请选择创建组织', trigger: 'change' }],
                FUseOrgId: [{ required: true, message: '请选择使用组织', trigger: 'change' }],
                diNum: [
                    { max: 100, message: 'DI码长度不能超过100个字符', trigger: 'blur' }
                ],
            },
            flowChartDialogVisible: false,
            flowChartLoading: false,
            flowChartData: [],
            defaultProps: {
                children: 'children',
                label: 'label'
            },
            processedFlowChartData: [], // 处理后的流程图数据
            productDiNumId: null, // 存储DI记录的ID
            syncProgressTimer: null, // 用于存储定时器ID
            syncDialogVisible: false,
            syncForm: {
                syncType: 'date',
                materialNumbers: '',
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

            // 遍历 searchForm 中的所有字段
            Object.entries(this.searchForm).forEach(([key, value]) => {
                if (value) { // 只处理有值的字段
                    switch (key) {
                        // 使用模糊查询的字段
                        case 'FNumber':
                        case 'FName':
                        case 'FSpecification':
                        case 'FOldNumber':
                        case 'FNameEn':
                            req.query.$and.push({ [key]: { $regex: value, $options: 'i' } });
                            break;

                        // 精确匹配的字段
                        case 'FDocumentStatus':
                        case 'FForbidStatus':
                        case 'FBaseUnitId_FNumber':
                        case 'FStockId_FNumber':
                        case 'F_TFQJ_CheckBox':
                        case 'FBOMCATEGORY':
                        case 'FBOMUSE':
                        case 'FITEMPPROPERTY':
                            req.query.$and.push({ [key]: value });
                            break;
                    }
                }
            });

            // 如果没有查询条件,删除 $and
            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
        },

        // 重置表单
        resetForm() {
            // 重置表单字段
            this.$refs.searchForm.resetFields();

            // 手动清空所有搜索字段
            this.searchForm = {
                FNumber: '',           // 物料编码
                FName: '',            // 物料名称
                FSpecification: '',    // 规格型号
                FDocumentStatus: '',   // 数据状态
                FForbidStatus: '',     // 禁用状态
                FOldNumber: '',        // 旧物料编码
                FBaseUnitId_FNumber: '', // 基本单位
                FStockId_FNumber: '',    // 仓库
                F_TFQJ_CheckBox: '',     // 是否长新物料
                FNameEn: '',             // 英文名称
                FCreateOrgId: '',        // 创建组织
                FUseOrgId: '',          // 使用组织
                // 高级搜索字段
                FBOMCATEGORY: '',        // BOM分类
                FBOMUSE: '',            // BOM用途
                FITEMPPROPERTY: ''      // 物料属性
            };

            // 重置高级搜索的显示状态
            this.showAdvanced = false;

            // 重置分页
            this.currentPage = 1;
            this.pageSize = 10;

            // 重新获取数据
            this.fetchData();

            // 提示用户
            this.$message.success('重置成功');
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
                // 添加排序
                req.sort = { FNumber: 1 }; // 按物料编码升序排序

                const result = await getData("k3_BD_MATERIAL", req);

                if (result.code === 200) {
                    this.tableList = result.data;
                    this.total = result.countnum;
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
            // 验证必填项
            this.$refs.searchForm.validate((valid) => {
                if (valid) {
                    this.currentPage = 1; // 重置到第一页
                    this.fetchData();
                } else {
                    this.$message.warning('请检查输入项是否正确');
                    return false;
                }
            });
        },

        // 选择项改变
        handleSelectionChange(selection) {
            this.selection = selection;
        },

        // 查看详情
        async handleView(row) {
            this.dataForm = JSON.parse(JSON.stringify(row));
            // 获取关联的DI码信息
            await this.fetchDiNum(row._id);
            this.dialogStatus = 'view';
            this.dialogFormVisible = true;
        },

        // 编辑
        async handleEdit(row) {
            this.dataForm = JSON.parse(JSON.stringify(row));
            // 获取关联的DI码信息
            await this.fetchDiNum(row._id);
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
                    await removeData('k3_PRD_MO', { query: { _id: row._id } });
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
        async submitForm() {
            this.$refs.dataForm.validate(async (valid) => {
                if (valid) {
                    try {
                        // 1. 更新物料信息
                        // if (this.dialogStatus === 'edit') {
                        //     await updateData('k3_BD_MATERIAL', this.dataForm._id, this.dataForm);
                        // } else {
                        //     await addData('k3_BD_MATERIAL', this.dataForm);
                        // }

                        // 2. 处理DI码信息
                        const diNumData = {
                            productId: this.dataForm._id,
                            diNum: this.DINum,
                            updateBy: this.$store.state.user.id
                        };

                        if (this.productDiNumId) {
                            // 更新已存在的DI码记录
                            await updateData('productDiNum', { query: { _id: this.productDiNumId }, update: diNumData });
                        } else if (this.DINum) {
                            // 创建新的DI码记录
                            await addData('productDiNum', {
                                ...diNumData,
                                createBy: this.$store.state.user.id
                            });
                        }

                        this.$message.success(this.dialogStatus === 'edit' ? '更新成功' : '添加成功');
                        this.dialogFormVisible = false;
                        this.fetchData();
                    } catch (error) {
                        console.error('保存失败:', error);
                        this.$message.error('保存失败');
                    }
                }
            });
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
        },

        // 查看流程图
        async handleViewFlowChart(row) {
            this.flowChartLoading = true;
            try {
                // 添加调试���志
                console.log('当前物料:', row);

                // 1. 先查询该物料是否有关联的工艺
                const craft = await this.getCraftByMaterialId(row._id);
                console.log('关联工艺:', craft);

                if (!craft) {
                    this.$message.info('该物料未关联工艺，无流程图');
                    return;
                }

                // 2. 检查工艺下是否有工序
                if (!craft.processSteps || craft.processSteps.length === 0) {
                    this.$message.info('该物料工艺下无工序，无流程图');
                    return;
                }

                // 3. 构建流程��数据
                this.flowChartDialogVisible = true;
                const flowData = await this.buildFlowChartData(row._id, new Set());
                console.log('构建的流程图数据:', flowData);

                this.processedFlowChartData = [flowData]; // 修改这里，直接传入数组形式
                console.log('处理后的流程图数据:', this.processedFlowChartData);
            } catch (error) {
                console.error('获取流程图数据失败:', error);
                this.$message.error('获取流程图数据失败');
            } finally {
                this.flowChartLoading = false;
            }
        },

        // 构建流程图数据
        async buildFlowChartData(materialId, visited = new Set()) {
            if (visited.has(materialId)) {
                return null;
            }
            visited.add(materialId);

            try {
                // 获取物料信息
                const material = await this.getMaterialById(materialId);
                if (!material) return null;

                // 基础节点数据
                const nodeData = {
                    _id: materialId,
                    label: material.FName,
                    materialName: material.FName,
                    materialCode: material.FNumber,
                    children: []
                };

                // 获取工艺信息
                const craft = await this.getCraftByMaterialId(materialId);
                if (!craft) {
                    return nodeData;
                }

                // 添加工艺信息
                nodeData.craftName = craft.craftName;

                // 处理工序信息
                if (craft.processSteps && craft.processSteps.length > 0) {
                    const processStepsData = await Promise.all(
                        craft.processSteps.map(async stepId => {
                            const step = await this.getProcessStepById(stepId);
                            if (!step) return null;

                            const stepNode = {
                                _id: stepId,
                                label: step.processName,
                                sort: step.sort,
                                processName: step.processName,
                                children: []
                            };

                            if (step.materials && step.materials.length > 0) {
                                const materialsData = await Promise.all(
                                    step.materials.map(async materialRelationId => {
                                        const relation = await this.getProcessMaterialById(materialRelationId);
                                        if (!relation) return null;

                                        const childFlow = await this.buildFlowChartData(relation.materialId, visited);
                                        if (childFlow) {
                                            childFlow.materialRelationType = relation.relationType;
                                            childFlow.isComponent = relation.isComponent;
                                            childFlow.scanOperation = relation.scanOperation;
                                            childFlow.materialQuantity = relation.quantity;
                                        }
                                        return childFlow;
                                    })
                                );

                                stepNode.children = materialsData.filter(Boolean);
                            }

                            return stepNode;
                        })
                    );

                    nodeData.children = processStepsData.filter(Boolean);
                }

                return nodeData;

            } catch (error) {
                console.error('构建流程图数据失败:', error);
                this.$message.error('构建流程图数据失败');
                return null;
            }
        },

        // API 调用方法
        async getMaterialById(id) {
            const response = await getData('k3_BD_MATERIAL', { query: { _id: id } });
            return response.data[0];
        },

        async getCraftByMaterialId(materialId) {
            const response = await getData('craft', { query: { materialId } });
            return response.data[0];
        },

        async getProcessStepById(id) {
            const response = await getData('processStep', { query: { _id: id }, sort: { sort: 1 } });
            return response.data[0];
        },

        async getProcessMaterialById(id) {
            const response = await getData('processMaterials', { query: { _id: id } });
            return response.data[0];
        },

        // 处理流程图数据为层级结构
        processFlowChartData(data) {
            const levels = [];

            const processLevel = (nodes, level = 0) => {
                if (!nodes || nodes.length === 0) return;

                if (!levels[level]) {
                    levels[level] = [];
                }

                nodes.forEach(node => {
                    // 确保节点包含所有必要的字段
                    const processedNode = {
                        _id: node._id,
                        label: node.label,
                        craftName: node.craftName || '',
                        processName: node.processName || '',
                        materialName: node.materialName || '',
                        materialRelationType: node.materialRelationType || '',
                        materialQuantity: node.materialQuantity || '',
                        children: node.children || []
                    };

                    levels[level].push(processedNode);

                    if (processedNode.children && processedNode.children.length > 0) {
                        processLevel(processedNode.children, level + 1);
                    }
                });
            };

            processLevel(data);
            return levels;
        },

        // 新增方法：通过materialId查询物料关系表
        async getProcessMaterialByMaterialId(materialId) {
            const response = await getData('processMaterials', {
                query: { materialId: materialId }
            });
            return response.data[0];
        },

        // 新增获取DI码信息的方法
        async fetchDiNum(productId) {
            try {
                const result = await getData('productDiNum', {
                    query: { productId }
                });
                if (result.data && result.data.length > 0) {
                    this.DINum = result.data[0].diNum;
                    this.productDiNumId = result.data[0]._id;
                } else {
                    this.DINum = '';
                    this.productDiNumId = null;
                }
            } catch (error) {
                console.error('获取DI码信息失败:', error);
                this.$message.error('获取DI码信息失败');
            }
        },

        // 同步物料数据
        async handleSync() {
            this.syncDialogVisible = true;
            this.syncForm = {
                syncType: 'date',
                materialNumbers: '',
                dateRange: [],
                documentStatus: 'C'
            };
        },

        // 单个同步
        async handleOneSync(row) {
            console.log("🚀 ~ handleOneSync ~ row:", row)
            try {
                let req = {
                    "FilterString": []
                };

                await this.$confirm(`确认更新${row.FNumber}的数据吗？`, '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });

                req.FilterString = [
                    {
                        "FieldName": "FMATERIALID",
                        "Compare": "=",
                        "Value": row.FMATERIALID,
                        "Left": "",
                        "Right": "",
                        "Logic": 0
                    }
                ];

                const response = await syncBD_MATERIAL(req);
                if (response.code === 200) {
                    this.startSyncProgressCheck();
                    if (response.taskStatus) {
                        this.$message.success(`同步中：当前${response.taskStatus.processedRecords}条数据同步完成，耗时${response.taskStatus.elapsedTime}秒`);
                    } else {
                        this.$message.success('同步任务已启动');
                    }
                } else {
                    this.$message.error(response.message || '物料同步失败');
                }
            } catch (error) {
                console.error('物料同步失败:', error);
                this.$message.error('物料同步失败');
            }

        },

        // 确认同步方法
        async confirmSync() {
            // 验证表单
            if (this.syncForm.syncType === 'number' && !this.syncForm.materialNumbers.trim()) {
                this.$message.warning('请输入物料编号');
                return;
            }
            if (this.syncForm.syncType === 'date' && (!this.syncForm.dateRange || this.syncForm.dateRange.length !== 2)) {
                this.$message.warning('请选择审核日期范围');
                return;
            }

            try {
                const confirmMessage = {
                    'number': '确认要同步选定物料编号的数据吗？',
                    'date': '确认要同步选定日期范围的数据吗？',
                    'all': '确认要同步所有物料数据吗？此操作可能需要较长时间'
                }[this.syncForm.syncType];

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

                    // 根据不同同步方式构建请求参数
                    switch (this.syncForm.syncType) {
                        case 'number':
                            req.FilterString = [
                                {
                                    "FieldName": "FNumber",
                                    "Compare": "IN",
                                    // 清理物料编码：去除换行符、空格，并按逗号分隔
                                    "Value": this.syncForm.materialNumbers
                                        .replace(/[\n\r\s]+/g, ',') // 将换行符和多余空格替换为逗号
                                        .split(',')                 // 按逗号分割
                                        .filter(code => code)       // 过滤空值
                                        .map(code => code.trim())   // 去除每个编码首尾空格
                                        .join(','),                 // 重新用逗号连接
                                    "Left": "",
                                    "Right": "",
                                    "Logic": 0
                                },
                                {
                                    "FieldName": "FDocumentStatus",
                                    "Compare": "StatusEqualto",
                                    "Value": this.syncForm.documentStatus,
                                    "Left": "",
                                    "Right": "",
                                    "Logic": 0
                                }
                            ];
                            break;

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
                                    "FieldName": "FApproveDate",
                                    "Compare": ">",
                                    "Value": `${startDate} 00:00:00`,
                                    "Left": "",
                                    "Right": "",
                                    "Logic": 0
                                },
                                {
                                    "FieldName": "FApproveDate",
                                    "Compare": "<",
                                    "Value": `${endDate} 23:59:59`,
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

                    const response = await syncBD_MATERIAL(req);
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
                        this.$message.error(response.message || '物料同步失败');
                    }
                } catch (error) {
                    loading.close();
                    console.error('物料同步失败:', error);
                    this.$message.error('物料同步失败: ' + error.message);
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
            // 清除可能存在的旧定时器
            if (this.syncProgressTimer) {
                clearInterval(this.syncProgressTimer);
            }

            // 创建新的定时器，每10秒查询一次进度
            this.syncProgressTimer = setInterval(async () => {
                try {
                    const response = await getSyncStatus('k3_BD_MATERIAL');
                    console.log("🚀 ~ this.syncProgressTimer=setInterval ~ response:", response)
                    if (response.code === 200) {
                        // 查找物料同步任务的状态
                        const materialTask = response.taskStatus;
                        if (materialTask) {
                            // 根据任务状态处理
                            switch (materialTask.status) {
                                case 'running':
                                    // 更新进度提示
                                    this.$notify({
                                        type: 'info',
                                        message: `同步中：当前${materialTask.processedRecords}条数据同步完成，耗时${materialTask.elapsedTime}秒`,
                                        duration: 5000
                                    });
                                    break;

                                case 'no_task':
                                    // 同步完成
                                    this.$message.success(`同步完成！`);
                                    this.stopSyncProgressCheck();
                                    // 刷新数据列表
                                    this.fetchData();
                                    break;
                                case 'completed':
                                    // 同步完成
                                    this.$message.success(`同步完成！`);
                                    this.stopSyncProgressCheck();
                                    // 刷新数据列表
                                    this.fetchData();
                                    break;
                                default:
                                    // 未知状态
                                    this.$message.warning('未知的同步状态');
                                    this.stopSyncProgressCheck();
                            }
                        } else {
                            // 没有找到物料同步任务
                            this.$message.warning('未找到物料同步任务');
                            this.stopSyncProgressCheck();
                        }
                    }
                } catch (error) {
                    console.error('查询同步进度失败:', error);
                    this.$message.error('查询同步进度失败');
                    this.stopSyncProgressCheck();
                }
            }, 5000); // 每10秒执行一次
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