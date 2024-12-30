<template>
    <div class="app-container">
        <el-card class="filter-container">
            <div slot="header" class="clearfix">
                <span>筛选搜索</span>
            </div>

            <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="托盘编号">
                            <el-input v-model="searchForm.palletCode" placeholder="请输入托盘编号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="销售订单号">
                            <el-input v-model="searchForm.saleOrderNo" placeholder="请输入销售订单号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="生产订单号">
                            <el-input v-model="searchForm.productionOrderNo" placeholder="请输入生产订单号"
                                clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="工单号">
                            <el-input v-model="searchForm.workOrderNo" placeholder="请输入工单号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="产线">
                            <zr-select style="width: 100%" v-model="searchForm.productLineId"
                                collection="production_line" :search-fields="['lineCode', 'lineName']"
                                label-key="lineName" tag-key="lineCode" sub-key="workshop" :multiple="false"
                                placeholder="请输入产线信息搜索" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="组托状态">
                            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 100%">
                                <el-option label="组托中" value="STACKING"></el-option>
                                <el-option label="组托完成" value="STACKED"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="创建时间">
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
                    <el-button type="primary" @click="handleExport" :loading="exportLoading">
                        <i class="el-icon-download"></i>
                        {{ exportLoading ? `正在导出(${exportProgress}%)` : '导出数据' }}
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">托盘组托列表</i>
                    <hir-input ref="hirInput"  :printData="printData" />
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
                            <!-- 订单信息 -->
                            <el-card class="box-card" style="width: 100%; margin-bottom: 10px">
                                <div slot="header" class="clearfix">
                                    <span>订单信息</span>
                                </div>
                                <div class="order-info-grid">
                                    <div class="info-item">
                                        <span class="label">销售订单号：</span>
                                        <span class="value">{{ scope.row.saleOrderNo || '--' }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">生产订单号：</span>
                                        <span class="value">{{ scope.row.productionOrderNo || '--' }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">工单号：</span>
                                        <span class="value">{{ scope.row.workOrderNo || '--' }}</span>
                                    </div>
                                </div>
                            </el-card>

                            <!-- 箱子明细 -->
                            <el-card class="box-card" style="width: 100%">
                                <div slot="header" class="clearfix">
                                    <span>箱子明细</span>
                                </div>
                                <el-table v-if="scope.row.boxItems.length" :data="scope.row.boxItems" border
                                    style="width: 100%">
                                    <el-table-column label="箱子条码" prop="boxBarcode" align="center"></el-table-column>
                                    <el-table-column label="数量" prop="quantity" align="center"></el-table-column>
                                    <el-table-column label="扫描时间" align="center">
                                        <template slot-scope="boxScope">
                                            {{ formatDate(boxScope.row.scanTime) }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="操作" align="center">
                                        <template slot-scope="boxScope">
                                            <el-button type="text" style="color: red"
                                                @click="handleDelete(scope.row.palletCode, boxScope.row.boxBarcode)">解绑箱条码</el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                                <!-- 分割线 -->
                                <el-divider content-position="left">托盘条码明细</el-divider>
                                <!-- 条码明细 -->
                                <el-table :data="scope.row.palletBarcodes" border style="width: 100%">
                                    <el-table-column label="条码" prop="barcode" align="center"></el-table-column>
                                    <el-table-column label="扫描时间" align="center">
                                        <template slot-scope="barcodeScope">
                                            {{ formatDate(barcodeScope.row.scanTime) }}
                                        </template>
                                    </el-table-column>
                                    <!-- 操作 -->
                                    <el-table-column label="操作" align="center">
                                        <template slot-scope="barcodeScope">
                                            <el-button type="text" style="color: red"
                                                @click="handleDelete(scope.row.palletCode, barcodeScope.row.barcode)">解绑条码</el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </el-card>
                        </el-form>
                    </template>
                </el-table-column>
                <el-table-column label="托盘编号" align="center" prop="palletCode">
                    <template slot-scope="scope">
                        <el-link type="primary">{{ scope.row.palletCode }}</el-link>
                    </template>
                </el-table-column>
                <el-table-column label="订单信息" align="center">
                    <template slot-scope="scope">
                        <div>销售单号: {{ scope.row.saleOrderNo || '--' }}</div>
                        <div>生产单号: {{ scope.row.productionOrderNo || '--' }}</div>
                        <div>工单号: {{ scope.row.workOrderNo || '--' }}</div>
                    </template>
                </el-table-column>
                <el-table-column label="产线名称" prop="productLineName" align="center">
                    <template slot-scope="scope">
                        {{ scope.row.productLineName }}
                        <el-tag size="mini" v-if="scope.row.productLineId && scope.row.productLineId.workshop">{{
                            scope.row.productLineId.workshop
                            }}</el-tag>
                        <el-tag v-else>未记录生产车间</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="物料信息" align="center">
                    <template slot-scope="scope">
                        {{ scope.row.materialName }}
                        <el-tag size="mini" v-if="scope.row.materialSpec">{{ scope.row.materialSpec }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="组托状态" align="center">
                    <template slot-scope="scope">
                        <el-tag :type="scope.row.status === 'STACKED' ? 'success' : 'warning'">
                            {{ scope.row.status === 'STACKED' ? '组托完成' : '组托中' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="数量信息" align="center">
                    <template slot-scope="scope">
                        <div>总数量: {{ scope.row.totalQuantity }}</div>
                        <div v-if="scope.row.boxCount">箱数: {{ scope.row.boxCount }}</div>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" align="center">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.createAt) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center">
                    <template slot-scope="scope">
                        <el-button type="text" style="color: red" @click="handleAllDelete(scope.row)">初始化单据</el-button>
                        <el-button type="text" @click="handlePrint(scope.row)">打印单据</el-button>
                        <el-button type="text" style="color: orange" @click="showHistory(scope.row)">解绑记录</el-button>
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <edit-dialog :visible.sync="dialogFormVisible" :dialog-status="dialogStatus" :row-data="dataForm"
            @submit="handleSubmit" />

        <!-- 添加历史数据弹窗 -->
        <el-dialog title="解绑记录" :visible.sync="historyDialogVisible" width="80%">
            <base-table ref="historyTable" :currentPage="historyCurrentPage" :highlight-current-row="true"
                :pageSize="historyPageSize" :tableData="historyTableList" :tableDataloading="historyListLoading"
                :total="historyTotal" @handleCurrentChange="historyTableHandleCurrentChange"
                @handleSizeChange="historyTableHandleSizeChange">
                <template slot="law">
                    <el-table-column type="expand">
                        <template slot-scope="scope">
                            <el-form label-position="left" inline class="table-expand">
                                <el-card class="box-card" style="width: 100%">
                                    <div slot="header" class="clearfix">
                                        <span>影响的条码</span>
                                    </div>
                                    <el-table :data="scope.row.affectedBarcodes" border style="width: 100%">
                                        <el-table-column label="条码" prop="barcode" align="center"></el-table-column>
                                        <el-table-column label="条码类型" align="center">
                                            <template slot-scope="barcodeScope">
                                                <el-tag
                                                    :type="barcodeScope.row.barcodeType === 'MAIN' ? 'primary' : 'success'">
                                                    {{ barcodeScope.row.barcodeType === 'MAIN' ? '主条码' : '箱条码' }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="所属箱码" prop="boxBarcode"
                                            align="center"></el-table-column>
                                    </el-table>
                                </el-card>
                            </el-form>
                        </template>
                    </el-table-column>

                    <el-table-column label="托盘编号" prop="palletCode" align="center"></el-table-column>
                    <el-table-column label="解绑类型" align="center">
                        <template slot-scope="scope">
                            <el-tag :type="getUnbindTypeTag(scope.row.unbindType)">
                                {{ getUnbindTypeText(scope.row.unbindType) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="解绑条码" prop="unbindBarcode" align="center"></el-table-column>
                    <el-table-column label="解绑原因" prop="reason" align="center"></el-table-column>
                    <el-table-column label="操作人" prop="createBy" align="center"></el-table-column>
                    <el-table-column label="操作时间" align="center">
                        <template slot-scope="scope">
                            {{ formatDate(scope.row.createAt) }}
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
import { unbindPalletBarcode, unbindPalletAllBarcode } from "@/api/materialPalletizing";
import EditDialog from './components/EditDialog'
import HirInput from '@/components/hirInput'
export default {
    name: 'MaterialPalletizing',
    components: {
        EditDialog,
        HirInput
    },
    data() {
        return {
            searchForm: {
                palletCode: '',
                saleOrderNo: '',
                productionOrderNo: '',
                workOrderNo: '',
                productLineId: '',
                status: '',
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
            printDialogVisible: false,
            printData: {},
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

            if (this.searchForm.palletCode) {
                req.query.$and.push({
                    palletCode: {
                        $regex: this.escapeRegex(this.searchForm.palletCode),
                        $options: 'i'
                    }
                });
            }

            if (this.searchForm.saleOrderNo) {
                req.query.$and.push({
                    saleOrderNo: {
                        $regex: this.escapeRegex(this.searchForm.saleOrderNo),
                        $options: 'i'
                    }
                });
            }

            if (this.searchForm.productionOrderNo) {
                req.query.$and.push({
                    productionOrderNo: {
                        $regex: this.escapeRegex(this.searchForm.productionOrderNo),
                        $options: 'i'
                    }
                });
            }

            if (this.searchForm.workOrderNo) {
                req.query.$and.push({
                    workOrderNo: {
                        $regex: this.escapeRegex(this.searchForm.workOrderNo),
                        $options: 'i'
                    }
                });
            }

            if (this.searchForm.productLineId) {
                req.query.$and.push({
                    productLineId: this.searchForm.productLineId
                });
            }

            if (this.searchForm.status) {
                req.query.$and.push({
                    status: this.searchForm.status
                });
            }

            if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
                const [startDate, endDate] = this.searchForm.dateRange;
                req.query.$and.push({
                    createAt: {
                        $gte: new Date(startDate).toISOString(),
                        $lte: new Date(endDate + ' 23:59:59.999').toISOString()
                    }
                });
            }

            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
        },

        resetForm() {
            this.$refs.searchForm.resetFields();
            this.searchForm = {
                palletCode: '',
                saleOrderNo: '',
                productionOrderNo: '',
                workOrderNo: '',
                productLineId: '',
                status: '',
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
                req.sort = { _id: -1 };
                req.populate = JSON.stringify([{ path: 'productLineId' }]);
                req.count = true;
                const result = await getData("material_palletizing", req);
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
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const seconds = String(dateObj.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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

        handleAllDelete(row) {
            this.$confirm('确认要初始化该单据吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    const response = await unbindPalletAllBarcode({
                        palletCode: row.palletCode,
                        userId: this.$store.state.user.id
                    });
                    if (response.success) {
                        this.$message.success('初始化成功');
                        this.fetchData();
                    } else {
                        this.$message.error(response.message);
                    }
                } catch (error) {
                    console.error('初始化失败:', error);
                    this.$message.error('初始化失败');
                }
            })
        },

        handleDelete(palletCode, barcode) {
            this.$confirm('确认要解绑该条码吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    const response = await unbindPalletBarcode({
                        palletCode: palletCode,
                        barcode: barcode,
                        userId: this.$store.state.user.id
                    });

                    if (response.success) {
                        this.$message.success('解绑成功');
                        this.fetchData();
                    } else {
                        this.$message.error(response.message);
                    }
                } catch (error) {
                    console.error('解绑失败:', error);
                    this.$message.error('解绑失败');
                }
            }).catch(() => {
                this.$message.info('已取消解绑');
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
        handlePrint(row) {
            let printData = row;
            printData.createAt = this.formatDate(row.createAt);
            printData.workshop = row.productLineId.workshop || '未记录生产车间';
            printData.qrcode = `${row.palletCode}#${row.saleOrderNo}#${row.materialCode}#${row.totalQuantity}#${row.productLineId.lineCode}`;
            printData.palletBarcodes = row.palletBarcodes.map(item => {
                item.scanTime = this.formatDate(item.scanTime);
                return item;
            });
            this.printData = printData;
            this.$nextTick(() => {
                this.$refs.hirInput.handlePrints();
            });
        },
        showHistory(row) {
            this.historyCurrentPage = 1;
            this.dataForm = row;
            this.fetchHistoryData(row.scanCode);
            this.historyDialogVisible = true;
        },

        getUnbindTypeTag(type) {
            const tags = {
                'SINGLE': 'info',
                'BOX': 'warning',
                'PALLET': 'danger'
            };
            return tags[type] || 'info';
        },

        getUnbindTypeText(type) {
            const texts = {
                'SINGLE': '单个解绑',
                'BOX': '整箱解绑',
                'PALLET': '整托解绑'
            };
            return texts[type] || type;
        },

        async fetchHistoryData(palletCode) {
            this.historyListLoading = true;
            try {
                const req = {
                    query: {
                        palletCode: palletCode
                    },
                    page: this.historyCurrentPage,
                    skip: (this.historyCurrentPage - 1) * this.historyPageSize,
                    limit: this.historyPageSize,
                    sort: { createAt: -1 },
                    count: true
                };

                const result = await getData("material_palletizing_unbind_log", req);
                this.historyTableList = result.data;
                this.historyTotal = result.countnum;
            } catch (error) {
                console.error('获取解绑记录失败:', error);
                this.$message.error('获取解绑记录失败');
            } finally {
                this.historyListLoading = false;
            }
        },

        historyTableHandleCurrentChange(currentPage) {
            this.historyCurrentPage = currentPage;
            this.fetchHistoryData(this.dataForm.palletCode);
        },

        historyTableHandleSizeChange(pageSize) {
            this.historyPageSize = pageSize;
            this.historyCurrentPage = 1;
            this.fetchHistoryData(this.dataForm.palletCode);
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

    .box-card {
        margin-bottom: 15px;
    }

    .el-descriptions {
        margin: 10px 0;
    }
}

.order-info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 10px;

    .info-item {
        .label {
            color: #606266;
            font-weight: 500;
            margin-right: 8px;
        }

        .value {
            color: #333;
        }
    }
}

@media screen and (max-width: 768px) {
    .order-info-grid {
        grid-template-columns: 1fr;
    }
}
</style>