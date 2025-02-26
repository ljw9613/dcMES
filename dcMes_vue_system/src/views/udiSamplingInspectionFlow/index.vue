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
                        <el-form-item label="产品编码">
                            <el-input v-model="searchForm.materialCode" placeholder="请输入产品编码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="检验结果">
                            <el-select v-model="searchForm.isQualified" placeholder="请选择检验结果" clearable
                                style="width: 100%">
                                <el-option label="合格" :value="true" />
                                <el-option label="不合格" :value="false" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="销售单号">
                            <el-input v-model="searchForm.saleOrderNo" placeholder="请输入销售单号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <div v-show="showAdvanced">
                    <el-row :gutter="20">
                        <el-col :span="6">
                            <el-form-item label="批次号">
                                <el-input v-model="searchForm.batchNo" placeholder="请输入批次号" clearable></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="抽检时间">
                                <el-date-picker v-model="searchForm.samplingTimeRange" type="daterange"
                                    range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"
                                    value-format="yyyy-MM-dd" style="width: 100%">
                                </el-date-picker>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </div>

                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <el-button type="primary" @click="handleScan">扫码二维码</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 列表标题区 -->
        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">抽检记录表</i>
                    <div>
                        <el-button type="primary" @click="handleAllExcel">导出数据表</el-button>
                        <el-button type="primary" @click="handleAllExport">批量导出数据</el-button>

                    </div>
                </div>
            </div>
        </div>

        <!-- 表格区域 -->
        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @selection-change="handleSelectionChange" @handleCurrentChange="baseTableHandleCurrentChange"
            :cell-style="{ textAlign: 'center' }" @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">
                <!-- 基本信息列 -->
                <el-table-column label="主条码" prop="barcode" min-width="180">
                    <template slot-scope="scope">
                        {{ scope.row.barcode }}
                    </template>
                </el-table-column>

                <el-table-column label="检验结果" prop="isQualified" width="100">
                    <template slot-scope="scope">
                        <el-tag :type="scope.row.isQualified ? 'success' : 'danger'">
                            {{ scope.row.isQualified ? '合格' : '不合格' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="抽检状态" prop="samplingStatus" width="100">
                    <template slot-scope="scope">
                        <el-tag :type="getSamplingStatusType(scope.row.samplingStatus)">
                            {{ getSamplingStatusText(scope.row.samplingStatus) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <!-- 物料信息列 -->
                <el-table-column label="物料编码" prop="materialCode" min-width="120">
                    <template slot-scope="scope">
                        {{ scope.row.materialCode }}
                    </template>
                </el-table-column>

                <el-table-column label="物料名称" prop="materialName" min-width="150">
                    <template slot-scope="scope">
                        {{ scope.row.materialName }}
                    </template>
                </el-table-column>

                <!-- 条码验证信息列 -->
                <el-table-column label="条码验证" min-width="200">
                    <template slot-scope="scope">
                        <div class="validation-tags">
                            <el-tooltip effect="dark" :content="getValidationTooltip(scope.row, 'print')"
                                placement="top">
                                <el-tag size="mini"
                                    :type="getValidationTagType(scope.row.barcodeValidation.isPrintBarcodeValid)">
                                    彩箱条码
                                </el-tag>
                            </el-tooltip>
                            <el-tooltip effect="dark" :content="getValidationTooltip(scope.row, 'transformed')"
                                placement="top">
                                <el-tag size="mini"
                                    :type="getValidationTagType(scope.row.barcodeValidation.isTransformedBarcodeValid)">
                                    黄板箱条码
                                </el-tag>
                            </el-tooltip>
                        </div>
                    </template>
                </el-table-column>

                <!-- 操作信息列 -->
                <el-table-column label="抽检人员" prop="samplingOperator" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.samplingOperator }}
                    </template>
                </el-table-column>

                <el-table-column label="抽检时间" prop="samplingTime" min-width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.samplingTime) }}
                    </template>
                </el-table-column>

                <el-table-column label="备注" prop="remark" min-width="150">
                    <template slot-scope="scope">
                        <el-tooltip v-if="scope.row.remark" effect="dark" :content="scope.row.remark" placement="top">
                            <span class="remark-text">{{ scope.row.remark }}</span>
                        </el-tooltip>
                        <span v-else>-</span>
                    </template>
                </el-table-column>

                <!-- 操作列 -->
                <el-table-column label="操作" width="120" fixed="right">
                    <template slot-scope="scope">
                        <el-button v-if="scope.row.samplingStatus !== 'VOIDED'" type="text" size="mini"
                            @click="handleVoid(scope.row)">
                            作废
                        </el-button>
                        <el-button type="text" size="mini" @click="handleDetail(scope.row)">
                            详情
                        </el-button>
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <!-- 导出选项弹窗 -->
        <el-dialog title="导出选项" :visible.sync="exportDialogVisible" width="400px" :close-on-click-modal="false">
            <el-form :model="exportForm" label-width="0px">
                <el-form-item>
                    <el-radio-group v-model="exportForm.exportOption"
                        style="width: 100%; height: 100%;align-items: center;display: flex;flex-wrap: wrap; justify-content: space-around;">
                        <el-radio-button border label="search" value="search"></el-radio-button>
                        <el-radio-button border label="all" value="all"></el-radio-button>
                    </el-radio-group>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="exportDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="confirmExport" :loading="exportLoading">
                    确 定
                </el-button>
            </div>
        </el-dialog>

        <!-- 添加扫码弹窗 -->
        <el-dialog title="扫码抽检" :visible.sync="scanDialogVisible" width="500px" :close-on-click-modal="false">
            <el-form :model="scanForm" ref="scanForm" :rules="scanRules" label-width="120px">
                <el-form-item label="主产品条码" prop="barcode">
                    <el-input v-model="scanForm.barcode" placeholder="请扫描主产品条码" ref="barcodeInput"
                        @keyup.enter.native="handleBarcodeEnter"></el-input>
                </el-form-item>

                <div v-if="showBarcodeValidation">
                    <!-- 基础信息显示 -->
                    <el-form-item label="物料编码">
                        <el-input v-model="currentBarcodeData.materialNumber" readonly></el-input>
                    </el-form-item>
                    <el-form-item label="物料名称">
                        <el-input v-model="currentBarcodeData.materialName" readonly></el-input>
                    </el-form-item>

                    <!-- 条码验证部分 -->
                    <el-form-item label="彩箱条码" prop="printBarcode">
                        <el-input v-model="scanForm.printBarcode" placeholder="请扫描彩箱条码"
                            @keyup.enter.native="handlePrintBarcodeEnter"></el-input>
                    </el-form-item>
                    <el-form-item label="黄板箱条码" prop="transformedPrintBarcode">
                        <el-input v-model="scanForm.transformedPrintBarcode" placeholder="请扫描黄板箱条码"
                            @keyup.enter.native="handletransformedPrintBarcodeEnter"></el-input>
                    </el-form-item>

                    <!-- 验证结果显示 -->
                    <el-form-item label="验证结果">
                        <div class="validation-results">
                            <el-tag :type="getValidationTagType('barcode')" size="medium">
                                主条码: {{ getValidationText('barcode') }}
                            </el-tag>
                            <el-tag :type="getValidationTagType('printBarcode')" size="medium">
                                彩箱条码: {{ getValidationText('printBarcode') }}
                            </el-tag>
                            <el-tag :type="getValidationTagType('transformedPrintBarcode')" size="medium">
                                黄板箱条码: {{ getValidationText('transformedPrintBarcode') }}
                            </el-tag>
                        </div>
                    </el-form-item>

                    <el-form-item label="备注说明">
                        <el-input type="textarea" v-model="scanForm.remark" placeholder="请输入备注说明"></el-input>
                    </el-form-item>
                </div>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="scanDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="handleScanConfirm" :loading="scanLoading"
                    :disabled="!isAllBarcodeValid" v-if="showBarcodeValidation">
                    确 定
                </el-button>
            </div>
        </el-dialog>

        <!-- 添加详情弹窗 -->
        <el-dialog title="抽检记录详情" :visible.sync="detailDialogVisible" width="700px">
            <div class="detail-container" v-if="currentDetail">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="主条码">{{ currentDetail.barcode }}</el-descriptions-item>
                    <el-descriptions-item label="检验结果">
                        <el-tag :type="currentDetail.isQualified ? 'success' : 'danger'">
                            {{ currentDetail.isQualified ? '合格' : '不合格' }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="物料编码">{{ currentDetail.materialCode }}</el-descriptions-item>
                    <el-descriptions-item label="物料名称">{{ currentDetail.materialName }}</el-descriptions-item>
                </el-descriptions>

                <div class="detail-section">
                    <h4>条码验证信息</h4>
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="彩箱条码">{{ currentDetail.barcodeValidation.printBarcode
                        }}</el-descriptions-item>
                        <el-descriptions-item label="彩箱条码验证">
                            <el-tag :type="getValidationTagType(currentDetail.barcodeValidation.isPrintBarcodeValid)">
                                {{ currentDetail.barcodeValidation.isPrintBarcodeValid ? '验证通过' : '验证失败' }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="黄板箱条码">{{ currentDetail.barcodeValidation.transformedBarcode
                        }}</el-descriptions-item>
                        <el-descriptions-item label="黄板箱条码验证">
                            <el-tag
                                :type="getValidationTagType(currentDetail.barcodeValidation.isTransformedBarcodeValid)">
                                {{ currentDetail.barcodeValidation.isTransformedBarcodeValid ? '验证通过' : '验证失败' }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="验证时间" :span="2">
                            {{ formatDate(currentDetail.barcodeValidation.validationTime) }}
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </div>
        </el-dialog>

    </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import ProcessStepList from '@/components/ProcessStepList/index.vue';
import InspectionList from '@/components/InspectionList/index.vue';
import { unbindComponents, updateFlowNodes } from '@/api/materialProcessFlowService';
import XLSX from 'xlsx';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { query } from "quill";

export default {
    name: 'SaleOrder',
    components: {
        ProcessStepList,
        InspectionList
    },
    data() {
        return {
            searchForm: {
                materialCode: '',
                isQualified: '',
                saleOrderNo: '',
                batchNo: '',
                samplingTimeRange: []
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
                barcode: '',
                materialCode: '',
                materialName: '',
                materialSpec: '',
                craftVersion: '',
                startTime: null,
                planCompletionTime: null,
                endTime: null,
                status: 'PENDING',
                progress: 0,
                processNodes: [],
                remark: ''
            },
            rules: {
                FCustomerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
                FDate: [{ required: true, message: '请选择订单日期', trigger: 'change' }],
                FSaleDeptName: [{ required: true, message: '请输入销售部门', trigger: 'blur' }]
            },
            processedFlowChartData: [], // 处理后的流程图数据
            activeTab: 'process',
            barcodeSearchVisible: false,
            searchBarcode: '',
            searchResults: [],
            searchLoading: false,
            unbindRecord: [], // 解绑记录
            exportDialogVisible: false, // 导出选项弹窗显示状态
            exportForm: {
                exportOption: 'current' // 默认选择当前页
            },
            exportLoading: false, // 导出按钮loading状态
            scanDialogVisible: false,
            scanLoading: false,
            showQualityCheck: false,
            scanForm: {
                barcode: '',
                printBarcode: '',
                transformedPrintBarcode: '',
                remark: ''
            },
            scanRules: {
                barcode: [
                    { required: true, message: '请输入主产品条码', trigger: 'blur' }
                ],
                printBarcode: [
                    { required: true, message: '请输入彩箱条码', trigger: 'blur' }
                ],
                transformedPrintBarcode: [
                    { required: true, message: '请输入黄板箱条码', trigger: 'blur' }
                ]
            },
            currentBarcodeData: null,
            showBarcodeValidation: false,
            barcodeValidation: {
                barcode: false,
                printBarcode: false,
                transformedPrintBarcode: false
            },
            detailDialogVisible: false,
            currentDetail: null
        }
    },
    computed: {
        processedMaterialBarcodeData() {
            if (!this.dataForm.processNodes) return [];

            // 创建工序映射
            const processMap = new Map();
            this.dataForm.processNodes.forEach(node => {
                if (node.nodeType === 'PROCESS_STEP') {
                    processMap.set(node.nodeId, {
                        processName: node.processName,
                        processCode: node.processCode
                    });
                }
            });

            // 过滤并处理物料数据
            return this.dataForm.processNodes
                .filter(node => node.nodeType === 'MATERIAL' && node.barcode) // 只显示有条码的物料
                .map(node => {
                    // 获取工序信息
                    const processInfo = node.parentNodeId ? processMap.get(node.parentNodeId) : null;
                    return {
                        ...node,
                        processName: processInfo ? processInfo.processName : '-',
                        processCode: processInfo ? processInfo.processCode : ''
                    };
                })
                .sort((a, b) => {
                    // 按扫码时间降序排序
                    return new Date(b.scanTime || 0) - new Date(a.scanTime || 0);
                });
        },
        // 格式化后的解绑记录
        formattedUnbindRecord() {
            return this.unbindRecord.map(record => ({
                ...record,
                formattedTime: this.formatDate(record.operateTime),
                materialList: record.unbindMaterials ? record.unbindMaterials.map(m => ({
                    ...m,
                    displayText: `${m.materialCode} - ${m.materialName}`
                })) : []
            }));
        },
        isAllBarcodeValid() {
            return this.barcodeValidation.barcode &&
                this.barcodeValidation.printBarcode &&
                this.barcodeValidation.transformedPrintBarcode;
        }
    },
    methods: {
        // 解绑
        // 修改 handleUnbind 方法
        async handleUnbind(row) {
            try {
                // 查询维修记录
                let barcodeRepair = await getData('product_repair', {
                    query: {
                        barcode: this.dataForm.barcode,
                        status: 'PENDING_REVIEW'
                    }
                });

                if (barcodeRepair.data.length === 0) {
                    this.$message.warning('请先创建维修记录，再进行解绑操作');
                    return;
                }

                const { value: reason } = await this.$confirm(
                    '此操作将解绑当前工序及其后续所有工序的物料，是否继续？',
                    '解绑确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                    showInput: true,
                    inputPlaceholder: '请输入解绑原因(非必填)',
                    inputValidator: (value) => true
                }
                );

                const loading = this.$loading({
                    lock: true,
                    text: '正在解绑...',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                try {
                    if (row.nodeType === 'PROCESS_STEP') {
                        const response = await unbindComponents({
                            mainBarcode: this.dataForm.barcode,
                            processStepId: row.processStepId,
                            userId: this.$store.state.user.id,
                            reason: reason || '未填写解绑原因',
                            unbindSubsequent: true
                        });

                        if (response.code === 200 && response.success) {
                            this.$message.success('解绑成功');

                            // 1. 更新主数据
                            if (response.data) {
                                this.dataForm = JSON.parse(JSON.stringify(response.data));

                                // 2. 重新处理流程图数据
                                if (this.dataForm.processNodes) {
                                    this.processedFlowChartData = this.processNodes(this.dataForm.processNodes);
                                }
                            }

                            // 3. 刷新解绑记录
                            await this.getUnbindRecords();

                            // 4. 自动切换到解绑信息标签页
                            this.activeTab = 'unbind';

                            // 5. 更新表格数据
                            const index = this.tableList.findIndex(item => item._id === this.dataForm._id);
                            if (index !== -1) {
                                this.$set(this.tableList, index, JSON.parse(JSON.stringify(response.data)));
                            }

                            // 6. 触发视图更新
                            this.$nextTick(() => {
                                this.$forceUpdate();
                            });
                        } else {
                            throw new Error(response.message || '解绑失败');
                        }
                    } else {
                        throw new Error('只能对工序节点进行解绑操作');
                    }
                } catch (error) {
                    this.$message.error(error.message || '解绑失败');
                } finally {
                    loading.close();
                }
            } catch (error) {
                if (error !== 'cancel') {
                    this.$message.error(error.message || '解绑失败');
                }
            }
        },
        // 添加获取解绑记录的方法
        async getUnbindRecords() {
            try {
                const unbindRecordResponse = await getData('unbindRecord', {
                    query: { flowRecordId: this.dataForm._id },
                    populate: JSON.stringify([{ path: 'operatorId' }]),
                    sort: { createTime: -1 }  // 按创建时间倒序排序
                });

                if (unbindRecordResponse.code === 200) {
                    this.unbindRecord = unbindRecordResponse.data;
                }
            } catch (error) {
                console.error('获取解绑记录失败:', error);
            }
        },
        // ... 其他方法保持与 material 页面类似,修改相应的字段名和业务逻辑
        // 这里只列出一些需要特别修改的方法
        // 获取流程状态样式
        getProcessStatusType(status) {
            const statusMap = {
                'PENDING': 'info',
                'IN_PROCESS': 'warning',
                'COMPLETED': 'success',
                'ABNORMAL': 'danger'
            }
            return statusMap[status] || 'info'
        },

        // 获取流程状态文本
        getProcessStatusText(status) {
            const statusMap = {
                'PENDING': '待处理',
                'IN_PROCESS': '进行中',
                'COMPLETED': '已完成',
                'ABNORMAL': '异常'
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
                req.sort = { createAt: -1 };
                req.count = true;
                req.populate = JSON.stringify([{ path: 'materialProcessFlowId' }]);

                const result = await getData("udi_sampling_inspection_flow", req);

                if (result.code === 200) {
                    this.tableList = result.data;
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
                minute: '2-digit',
                second: '2-digit'
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

        //成品初始化
        async handleInit(row) {
            try {
                console.log(row, 'row')
                // 显示确认对话框
                await this.$confirm('确认要成品初始化吗?该操作无法撤回！请谨慎操作！', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });

                if (!row._id) {
                    this.$message.error('请选择要初始化的记录');
                    return;
                }
                // 调用成品初始化 API   
                const result = await removeData('udi_sampling_inspection_flow', {
                    query: { _id: row._id }
                });

                if (result.code === 200) {
                    this.$message.success('初始化成功');
                    // 重新加载数据
                    this.fetchData();
                } else {
                    throw new Error(result.msg || '初始化失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('删除失败:', error);
                    this.$message.error(error.message || '删除失败');
                }
            }
        },
        //handleUpdateFlowNodes
        async handleUpdateFlowNodes(row) {
            try {
                // 显示确认对话框
                await this.$confirm('确认要更新流程节点吗?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                const result = await updateFlowNodes({ barcode: row.barcode });
                console.log(result, 'result');
                if (result.code === 200 && result.success) {
                    this.$message.success('更新成功');
                    this.fetchData();
                } else {
                    this.$message.error('更新失败');
                }
            } catch (error) {
                console.error('更新失败:', error);
                this.$message.error('更新失败: ' + error.message);
            }
        },
        // 查看详情
        async handleView(row) {
            try {
                console.log(row, 'row');
                this.listLoading = true;
                const result = await getData('udi_sampling_inspection_flow', {
                    query: { _id: row._id }
                });
                console.log(result, 'result');
                if (result.code === 200 && result.data.length > 0) {
                    this.dataForm = result.data[0];
                    // 处理流程图数据

                    this.processedFlowChartData = this.processNodes(this.dataForm.processNodes);
                    this.dialogFormVisible = true;

                    // 获取解绑记录
                    const unbindRecord = await getData('unbindRecord', {
                        query: { flowRecordId: row._id },
                        populate: JSON.stringify([{ path: 'operatorId' }])
                    });
                    console.log(unbindRecord, 'unbindRecord');
                    this.unbindRecord = unbindRecord.data;
                } else {
                    this.$message.error('获取详情失败');
                }
            } catch (error) {
                console.error('获取详情失败:', error);
                this.$message.error('获取详情失败: ' + error.message);
            } finally {
                this.listLoading = false;
            }
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

                await removeData('k3_SAL_SaleOrder', { query: { _id: row._id } });
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

        // 构建查询条件
        searchData() {
            let req = {
                query: {
                    $and: []
                },
            };

            Object.entries(this.searchForm).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {  // 修改这里的判断条件
                    switch (key) {
                        case 'materialCode':
                        case 'saleOrderNo':
                        case 'batchNo':
                            if (value.trim()) {
                                req.query.$and.push({ [key]: { $regex: value.trim(), $options: 'i' } });
                            }
                            break;
                        case 'isQualified':
                            // 修改这里的处理逻辑
                            req.query.$and.push({ [key]: value });
                            break;
                        case 'samplingTimeRange':
                            if (Array.isArray(value) && value.length === 2) {
                                req.query.$and.push({
                                    samplingTime: {
                                        $gte: value[0] + ' 00:00:00',
                                        $lte: value[1] + ' 23:59:59'
                                    }
                                });
                            }
                            break;
                    }
                }
            });

            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
        },


        // 重置表单
        resetForm() {
            this.$refs.searchForm.resetFields();
            this.searchForm = {
                materialCode: '',
                isQualified: '',
                saleOrderNo: '',
                batchNo: '',
                samplingTimeRange: []
            };
            this.currentPage = 1;
            this.fetchData();
        },

        // 导出数据
        // exportData() {
        //     // 取当前的查询条件
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

        // 获取节点类型图标和颜色
        getNodeIcon(node) {
            const iconMap = {
                'PROCESS_STEP': {
                    icon: 'el-icon-s-operation',
                    color: '#409EFF'
                },
                'MATERIAL': {
                    icon: 'el-icon-box',
                    color: '#67c23a'
                }
            };
            return iconMap[node.nodeType] || { icon: 'el-icon-more', color: '#909399' };
        },

        // 获取时间轴节点类型
        getTimelineItemType(status) {
            const typeMap = {
                'COMPLETED': 'success',
                'IN_PROCESS': 'primary',
                'ABNORMAL': 'danger',
                'PENDING': 'info'
            };
            return typeMap[status] || 'info';
        },

        // 获取扫码图标
        getScanIcon(node) {
            if (!node.requireScan) return 'el-icon-minus info';
            const statusMap = {
                'COMPLETED': 'el-icon-check success',
                'IN_PROCESS': 'el-icon-loading warning',
                'ABNORMAL': 'el-icon-close danger',
                'PENDING': 'el-icon-time info'
            };
            return statusMap[node.status] || 'el-icon-time info';
        },

        // 获取扫码状态文本
        getScanStatus(node) {
            if (!node.requireScan) return '无需扫码';
            const statusMap = {
                'COMPLETED': '已完成扫码',
                'IN_PROCESS': '等待扫码',
                'ABNORMAL': '扫码异常',
                'PENDING': '未开始'
            };
            return statusMap[node.status] || '未开始';
        },

        // 获取当前激活的步骤
        getActiveStep(nodes) {
            const inProcessIndex = nodes.findIndex(node => node.status === 'IN_PROCESS');
            if (inProcessIndex === -1) {
                return nodes.filter(node => node.status === 'COMPLETED').length;
            }
            return inProcessIndex + 1;
        },

        // 获取步骤状态
        getStepStatus(status) {
            const statusMap = {
                'COMPLETED': 'success',
                'IN_PROCESS': 'process',
                'ABNORMAL': 'error',
                'PENDING': 'wait'
            };
            return statusMap[status] || 'wait';
        },

        // 获取步骤图标
        getStepIcon(node) {
            if (node.nodeType === 'PROCESS_STEP') {
                return 'el-icon-s-operation';
            }
            return 'el-icon-box';
        },

        // 获取整体流程状态
        getProcessOverallStatus(nodes) {
            if (nodes.some(node => node.status === 'ABNORMAL')) {
                return 'error';
            }
            if (nodes.some(node => node.status === 'IN_PROCESS')) {
                return 'process';
            }
            if (nodes.every(node => node.status === 'COMPLETED')) {
                return 'success';
            }
            return 'wait';
        },

        // 获取顶层工序节点
        getProcessSteps() {
            return this.dataForm.processNodes.filter(node =>
                node.nodeType === 'PROCESS_STEP' && node.level === 1
            ).sort((a, b) => a.processSort - b.processSort);
        },

        // 获取关联的物料节点
        getRelatedMaterials(processNodeId) {
            return this.dataForm.processNodes.filter(node =>
                node.nodeType === 'MATERIAL' &&
                node.parentNodeId === processNodeId &&
                node.level === 2  // 只获取直接关联的物料
            );
        },

        // 检查工序下是否有需要扫码的物料
        hasRequireScanMaterials(processNodeId) {
            return this.getRelatedMaterials(processNodeId).some(material => material.requireScan);
        },

        // 添加的处理方法
        processNodes(nodes) {
            if (!nodes || !nodes.length) return [];

            // 构建节点映射
            const nodeMap = new Map();
            nodes.forEach(node => {
                nodeMap.set(node.nodeId, {
                    ...node,
                    children: []
                });
            });

            // 构建树形结构
            const result = [];
            nodes.forEach(node => {
                const processedNode = nodeMap.get(node.nodeId);

                if (node.parentNodeId && nodeMap.has(node.parentNodeId)) {
                    // 直接根据 parentNodeId 添加到父节点的 children 中
                    const parentNode = nodeMap.get(node.parentNodeId);
                    parentNode.children.push(processedNode);
                } else {
                    // 没有 parentNodeId 的作为根节点
                    result.push(processedNode);
                }
            });

            // 对每个节点的子节点进行排序
            const sortChildren = (node) => {
                if (node.children && node.children.length) {
                    // 工序节点下的物料按照 materialCode 排序
                    if (node.nodeType === 'PROCESS_STEP') {
                        node.children.sort((a, b) => (a.materialCode || '').localeCompare(b.materialCode || ''));
                    }
                    // 物料节点下的工序按照 processSort 排序
                    else if (node.nodeType === 'MATERIAL') {
                        node.children.sort((a, b) => (a.processSort || 0) - (b.processSort || 0));
                    }

                    // 递归排序子节点
                    node.children.forEach(child => sortChildren(child));
                }
            };

            result.forEach(node => sortChildren(node));
            return result;
        },

        // 打开条码搜索弹窗
        openBarcodeSearch() {
            this.barcodeSearchVisible = true;
            this.searchBarcode = '';
            this.searchResults = [];
        },

        // 处理条码搜索
        async handleBarcodeSearch() {
            if (!this.searchBarcode.trim()) {
                this.$message.warning('请输入要搜索的条码');
                return;
            }

            this.searchLoading = true;
            try {
                // 查询主条码
                const searchQuery = {
                    query: {
                        'processNodes.barcode': this.searchBarcode
                    }
                };

                const mainBarcodeResult = await getData('udi_sampling_inspection_flow', searchQuery);
                if (mainBarcodeResult.code === 200 && mainBarcodeResult.data && mainBarcodeResult.data.length > 0) {
                    this.searchResults = [];
                    mainBarcodeResult.data.forEach(record => {
                        this.searchResults.push({
                            isMainBarcode: true,
                            barcode: record.barcode,
                            materialCode: record.materialCode,
                            materialName: record.materialName,
                            materialSpec: record.materialSpec,
                            status: record.status,
                            ...record
                        });
                    });
                    return;
                }
                // 查询当前条码
                let currentSearchQuery = {
                    query: {
                        barcode: this.searchBarcode
                    }
                }
                const currentBarcodeResult = await getData('udi_sampling_inspection_flow', currentSearchQuery);

                if (currentBarcodeResult.code === 200 && currentBarcodeResult.data && currentBarcodeResult.data.length > 0) {
                    this.searchResults = [];
                    currentBarcodeResult.data.forEach(record => {
                        this.searchResults.push({
                            isMainBarcode: false,
                            barcode: record.barcode,
                            materialCode: record.materialCode,
                            materialName: record.materialName,
                            materialSpec: record.materialSpec,
                            status: record.status,
                            ...record
                        });
                    });
                    return;
                }

                this.$message.warning('未找到相关数据');

            } catch (error) {
                console.error('搜索失败:', error);
                this.$message.error('搜索失败: ' + error.message);
            } finally {
                this.searchBarcode = ""
                this.searchLoading = false;
            }
        },

        handleProcessedMaterialBarcodeData(dataForm) {
            if (!dataForm.processNodes) return [];

            // 创建工序映射
            const processMap = new Map();
            dataForm.processNodes.forEach(node => {
                if (node.nodeType === 'PROCESS_STEP') {
                    processMap.set(node.nodeId, {
                        processName: node.processName,
                        processCode: node.processCode
                    });
                }
            });

            // 过滤并处理物料数据
            return dataForm.processNodes
                .filter(node => node.nodeType === 'MATERIAL' && node.barcode) // 只显示有条码的物料
                .map(node => {
                    // 获取工序信息
                    const processInfo = node.parentNodeId ? processMap.get(node.parentNodeId) : null;
                    return {
                        ...node,
                        processName: processInfo ? processInfo.processName : '-',
                        processCode: processInfo ? processInfo.processCode : ''
                    };
                })
                .sort((a, b) => {
                    // 按扫码时间降序排序
                    return new Date(b.scanTime || 0) - new Date(a.scanTime || 0);
                });
        },

        // 打开导出选项弹窗
        handleAllExport() {
            this.exportDialogVisible = true;
            this.exportForm.exportOption = 'current'; // 重置选项
        },
        async handleAllExcel() {
            try {
                // 显示加载提示
                const loading = this.$loading({
                    lock: true,
                    text: '正在导出数据，请稍候...',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                // 获取表格数据
                let req = this.searchData();
                req.page = this.currentPage;
                req.skip = (this.currentPage - 1) * this.pageSize;
                req.limit = this.pageSize;
                req.sort = { createAt: -1 };

                const result = await getData("sale_order_barcode_mapping", req);

                if (result.code !== 200) {
                    throw new Error(result.msg || '获取数据失败');
                }

                // 转换数据为Excel格式
                const excelData = result.data.map(item => ({
                    '型号': item.materialCode || '-',
                    '客户订单': item.saleOrderNo ? item.saleOrderNo : '-',
                    'UDI序列号': item.barcode || '-',//
                    '生产批号': item.productionPlanWorkOrderId ? item.productionPlanWorkOrderId.productionOrderNo : '-',
                    '外箱UDI': item.barcode || '-',//
                    '彩盒UDI': item.barcode || '-',//
                    '产品UDI': item.barcode || '-',//
                    '生产日期': item.createAt ? this.formatDate(item.createAt) : '-'
                }));

                // 创建工作簿
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(excelData);

                // 设置列宽
                const colWidths = [
                    { wch: 15 }, // 型号
                    { wch: 15 }, // 客户订单
                    { wch: 20 }, // UDI序列号
                    { wch: 15 }, // 生产批号
                    { wch: 20 }, // 外箱UDI
                    { wch: 20 }, // 彩盒UDI
                    { wch: 20 }, // 产品UDI
                    { wch: 20 }  // 生产日期
                ];
                ws['!cols'] = colWidths;

                // 设置表头样式
                const range = XLSX.utils.decode_range(ws['!ref']);
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const address = XLSX.utils.encode_cell({ r: 0, c: C });
                    if (!ws[address]) continue;
                    ws[address].s = {
                        font: { bold: true },
                        alignment: { horizontal: 'center' },
                        fill: { fgColor: { rgb: "f5f7fa" } }
                    };
                }

                // 将工作表添加到工作簿
                XLSX.utils.book_append_sheet(wb, ws, '数据列表');

                // 生成Excel文件并下载
                const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });

                // 生成文件名（使用当前时间戳）
                const fileName = `数据导出_${new Date().toLocaleDateString()}.xlsx`;

                // 下载文件
                FileSaver.saveAs(blob, fileName);

                this.$message.success('导出成功');
            } catch (error) {
                console.error('导出失败:', error);
                this.$message.error('导出失败: ' + error.message);
            } finally {
                // 关闭加载提示
                this.$loading().close();
            }
        },
        // 确认导出
        async confirmExport() {
            const exportOption = this.exportForm.exportOption;

            // 如果选择导出全部数据，进行二次确认
            if (exportOption === 'all') {
                try {
                    await this.$confirm('确认导出全部数据吗?数据量较大可能需要较长时间', '二次确认', {
                        type: 'warning'
                    });
                } catch (error) {
                    if (error === 'cancel') {
                        this.$message.info('已取消导出');
                        return;
                    }
                }
            }

            this.exportLoading = true;

            try {
                let exportData = [];

                // 根据选择获取要导出的数据
                switch (exportOption) {
                    case 'all':
                        const allResult = await getData('udi_sampling_inspection_flow', {
                            query: {},
                        });
                        if (allResult.code === 200) {
                            exportData = allResult.data;
                        } else {
                            throw new Error(allResult.msg || '获取数据失败');
                        }
                        break;
                    case 'search':
                        let req = this.searchData();
                        req.page = this.currentPage;
                        req.skip = (this.currentPage - 1) * this.pageSize;
                        req.limit = this.pageSize;
                        req.sort = { createAt: -1 };
                        req.count = true;
                        const searchResult = await getData("udi_sampling_inspection_flow", req);
                        if (searchResult.code === 200) {
                            exportData = searchResult.data;
                        } else {
                            throw new Error(searchResult.msg || '获取数据失败');
                        }
                        break;
                }

                console.log(exportData);

                if (exportData.length === 0) {
                    this.$message.warning('没有可导出的数据');
                    return;
                }

                // 显示进度提示
                const progressLoading = this.$loading({
                    lock: true,
                    text: `正在处理第 0/${exportData.length} 条数据...`,
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                // 创建zip实例
                const zip = new JSZip();

                // 处理每条数据
                for (let i = 0; i < exportData.length; i++) {
                    progressLoading.text = `正在处理第 ${i + 1}/${exportData.length} 条数据...`;
                    const item = exportData[i];

                    try {
                        const result = await getData('udi_sampling_inspection_flow', {
                            query: { _id: item._id }
                        });

                        if (result.code === 200 && result.data.length > 0) {
                            const detailData = result.data[0];
                            const materialBarcodeData = this.handleProcessedMaterialBarcodeData(detailData);

                            if (materialBarcodeData.length === 0) {
                                continue;
                            }

                            // 创建Excel数据
                            const excelData = materialBarcodeData.map(item => ({
                                '条码': item.barcode || '-',
                                '物料编码': item.materialCode || '-',
                                '物料名称': item.materialName || '-',
                                '规格型号': item.materialSpec || '-',
                                '状态': this.getProcessStatusText(item.status) || '-',
                                '所属工序': `${item.processName || ''} ${item.processCode ? `(${item.processCode})` : ''}`,
                                '扫码时间': item.scanTime ? this.formatDate(item.scanTime) : '-'
                            }));

                            // 创建工作簿和设置样式
                            const wb = XLSX.utils.book_new();
                            const ws = XLSX.utils.json_to_sheet(excelData);

                            // 设置列宽
                            ws['!cols'] = [
                                { wch: 20 }, // 条码
                                { wch: 15 }, // 物料编码
                                { wch: 20 }, // 物料名称
                                { wch: 15 }, // 规格型号
                                { wch: 10 }, // 状态
                                { wch: 20 }, // 所属工序
                                { wch: 20 }  // 扫码时间
                            ];

                            // 设置表头样式
                            const range = XLSX.utils.decode_range(ws['!ref']);
                            for (let C = range.s.c; C <= range.e.c; ++C) {
                                const address = XLSX.utils.encode_cell({ r: 0, c: C });
                                if (!ws[address]) continue;
                                ws[address].s = {
                                    font: { bold: true },
                                    alignment: { horizontal: 'center' },
                                    fill: { fgColor: { rgb: "f5f7fa" } }
                                };
                            }

                            XLSX.utils.book_append_sheet(wb, ws, '物料条码信息');
                            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

                            // 添加到zip
                            const fileName = `${item.materialCode}_${item.materialName}_${item.barcode}.xlsx`;
                            zip.file(fileName, excelBuffer);
                        }
                    } catch (error) {
                        console.error('处理数据失败:', error);
                        continue;
                    }
                }

                // 生成并下载zip
                const zipContent = await zip.generateAsync({ type: 'blob' });
                FileSaver.saveAs(zipContent, `物料条码信息_${new Date().toLocaleDateString()}.zip`);

                this.$message.success('导出成功');
                this.exportDialogVisible = false;
                progressLoading.close();
            } catch (error) {
                console.error('导出失败:', error);
                this.$message.error('导出失败: ' + error.message);
            } finally {
                this.exportLoading = false;
            }
        },

        // 处理物料条码数据的辅助方法
        processMaterialBarcodeData(processNodes) {
            if (!processNodes) return [];

            return processNodes
                .filter(node => node.nodeType === 'MATERIAL' && node.barcode)
                .map(node => ({
                    barcode: node.barcode,
                    materialCode: node.materialCode,
                    materialName: node.materialName,
                    materialSpec: node.materialSpec,
                    status: node.status,
                    processName: node.processName,
                    processCode: node.processCode,
                    scanTime: node.scanTime
                }))
                .sort((a, b) => new Date(b.scanTime || 0) - new Date(a.scanTime || 0));
        },

        async handleSingleMainExport(row) {
            try {
                // 显示加载提示
                const loading = this.$loading({
                    lock: true,
                    text: '正在获取数据，请稍候...',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                try {
                    // 获取详细数据
                    const result = await getData('udi_sampling_inspection_flow', {
                        query: { _id: row._id }
                    });

                    if (result.code === 200 && result.data.length > 0) {
                        const detailData = result.data[0];

                        // 使用相同的处理方法获取物料条码信息数据
                        const materialBarcodeData = this.handleProcessedMaterialBarcodeData(detailData);

                        if (materialBarcodeData.length === 0) {
                            this.$message.warning('该记录没有可导出的条码数据');
                            loading.close();
                            return;
                        }

                        // 转换数据为Excel格式
                        const excelData = materialBarcodeData.map(item => ({
                            '条码': item.barcode || '-',
                            '物料编码': item.materialCode || '-',
                            '物料名称': item.materialName || '-',
                            '规格型号': item.materialSpec || '-',
                            '状态': this.getProcessStatusText(item.status) || '-',
                            '所属工序': `${item.processName || ''} ${item.processCode ? `(${item.processCode})` : ''}`,
                            '扫码时间': item.scanTime ? this.formatDate(item.scanTime) : '-'
                        }));

                        // 创建工作簿
                        const wb = XLSX.utils.book_new();
                        const ws = XLSX.utils.json_to_sheet(excelData);

                        // 设置列宽
                        const colWidths = [
                            { wch: 20 }, // 条码
                            { wch: 15 }, // 物料编码
                            { wch: 20 }, // 物料名称
                            { wch: 15 }, // 规格型号
                            { wch: 10 }, // 状态
                            { wch: 20 }, // 所属工序
                            { wch: 20 }  // 扫码时间
                        ];
                        ws['!cols'] = colWidths;

                        // 设置表头样式
                        const headerStyle = {
                            font: { bold: true },
                            alignment: { horizontal: 'center' },
                            fill: {
                                fgColor: { rgb: "f5f7fa" }
                            }
                        };

                        // 应用表头样式
                        const range = XLSX.utils.decode_range(ws['!ref']);
                        for (let C = range.s.c; C <= range.e.c; ++C) {
                            const address = XLSX.utils.encode_cell({ r: 0, c: C });
                            if (!ws[address]) continue;
                            ws[address].s = headerStyle;
                        }

                        // 将工作表添加到工作簿
                        XLSX.utils.book_append_sheet(wb, ws, '物料条码信息');

                        // 生成Excel文件的二进制数据
                        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                        const blob = new Blob([excelBuffer], {
                            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        });

                        // 文件名格式：物料编码_物料名称_主条码.xlsx
                        const fileName = `${row.materialCode}_${row.materialName}_${row.barcode}.xlsx`;

                        // 下载文件
                        FileSaver.saveAs(blob, fileName);

                        this.$message.success('导出成功');
                    } else {
                        throw new Error('获取数据失败');
                    }
                } catch (error) {
                    console.error('导出失败:', error);
                    this.$message.error('导出失败: ' + error.message);
                } finally {
                    loading.close();
                }
            } catch (error) {
                console.error('导出失败:', error);
                this.$message.error('导出失败: ' + error.message);
            }
        },
        // 处理扫码
        handleScan() {
            this.scanDialogVisible = true;
            this.showQualityCheck = false;
            this.scanForm = {
                barcode: '',
                printBarcode: '',
                transformedPrintBarcode: '',
                remark: ''
            };
            this.currentBarcodeData = null;
            this.showBarcodeValidation = false;
            this.barcodeValidation = {
                barcode: false,
                printBarcode: false,
                transformedPrintBarcode: false
            };
            this.$nextTick(() => {
                this.$refs.barcodeInput.focus();
            });
        },
        // 处理主条码输入
        async handleBarcodeEnter() {
            if (!this.scanForm.barcode) {
                this.$message.warning('请输入主产品条码');
                return;
            }

            try {
                // 先检查是否已经存在抽检记录
                const existingRecord = await getData('udi_sampling_inspection_flow', {
                    query: {
                        barcode: this.scanForm.barcode,
                        samplingStatus: { $ne: 'VOIDED' } // 排除已作废的记录
                    }
                });

                if (existingRecord.code === 200 && existingRecord.data.length > 0) {
                    // 显示确认对话框
                    try {
                        await this.$confirm(
                            '该条码已存在抽检记录，是否作废原记录并重新抽检？',
                            '提示',
                            {
                                confirmButtonText: '作废并重新抽检',
                                cancelButtonText: '取消',
                                type: 'warning'
                            }
                        );

                        // 作废原记录
                        const voidResult = await updateData('udi_sampling_inspection_flow',
                            {
                                query: { _id: existingRecord.data[0]._id },
                                update: {
                                    samplingStatus: 'VOIDED',
                                    voidReason: '重新抽检',
                                    voidTime: new Date(),
                                    voidOperator: this.$store.state.user.name,
                                    updateBy: this.$store.state.user.id
                                }
                            });

                        if (voidResult.code !== 200) {
                            throw new Error('作废原记录失败');
                        }
                    } catch (error) {
                        if (error === 'cancel') {
                            this.scanForm.barcode = '';
                            this.$refs.barcodeInput.focus();
                            return;
                        }
                        throw error;
                    }
                }

                // 查询预生产条码记录
                const result = await getData('preProductionBarcode', {
                    query: { printBarcode: this.scanForm.barcode }
                });

                if (result.code !== 200 || result.data.length === 0) {
                    this.$message.error('未找到该UDI产品条码打印记录');
                    this.scanForm.barcode = '';
                    this.$refs.barcodeInput.focus();
                    return;
                }

                //查询对应的条码记录
                const result2 = await getData('material_process_flow', {
                    query: { barcode: this.scanForm.barcode }
                });

                if (result2.code !== 200 || result2.data.length === 0) {
                    this.$message.error('未找到该产品条码生产记录');
                    this.scanForm.barcode = '';
                    this.$refs.barcodeInput.focus();
                    return;
                }

                console.log(result2, 'result2');

                if (result.code === 200 && result.data.length > 0) {
                    this.currentBarcodeData = result.data[0];
                    this.currentBarcodeData.materialProcessFlowId = result2.data[0]._id;
                    this.showBarcodeValidation = true;
                    this.barcodeValidation.barcode = true;

                    // 重置其他条码验证状态
                    this.barcodeValidation.printBarcode = false;
                    this.barcodeValidation.transformedPrintBarcode = false;
                    this.scanForm.printBarcode = '';
                    this.scanForm.transformedPrintBarcode = '';

                    // 自动聚焦到彩箱条码输入框
                    this.$nextTick(() => {
                        const printBarcodeInput = this.$refs.scanForm.querySelector('input[placeholder="请扫描彩箱条码"]');
                        if (printBarcodeInput) {
                            printBarcodeInput.focus();
                        }
                    });
                } else {
                    this.$message.error('未找到该产品条码记录');
                    this.scanForm.barcode = '';
                    this.$refs.barcodeInput.focus();
                }
            } catch (error) {
                console.error('查询失败:', error);
                this.$message.error('查询失败: ' + error.message);
                this.scanForm.barcode = '';
                this.$refs.barcodeInput.focus();
            }
        },
        // 处理彩箱条码输入
        handlePrintBarcodeEnter() {
            if (!this.scanForm.printBarcode) {
                this.$message.warning('请输入彩箱条码');
                return;
            }

            // 验证彩箱条码
            this.barcodeValidation.printBarcode = 
                this.scanForm.printBarcode === this.currentBarcodeData.printBarcode;

            if (!this.barcodeValidation.printBarcode) {
                this.$message.error('彩箱条码不匹配');
                this.scanForm.printBarcode = '';
                // 重新聚焦到彩箱条码输入框
                this.$nextTick(() => {
                    const printBarcodeInput = this.$refs.scanForm.querySelector('input[placeholder="请扫描彩箱条码"]');
                    if (printBarcodeInput) {
                        printBarcodeInput.focus();
                    }
                });
                return;
            }

            // 自动聚焦到黄板箱条码输入框
            this.$nextTick(() => {
                const transformedPrintBarcodeInput = this.$refs.scanForm.querySelector('input[placeholder="请扫描黄板箱条码"]');
                if (transformedPrintBarcodeInput) {
                    transformedPrintBarcodeInput.focus();
                }
            });
        },
        // 处理黄板箱条码输入
        handletransformedPrintBarcodeEnter() {
            if (!this.scanForm.transformedPrintBarcode) {
                this.$message.warning('请输入黄板箱条码');
                return;
            }

            // 验证黄板箱条码
            this.barcodeValidation.transformedPrintBarcode = 
                this.scanForm.transformedPrintBarcode === this.currentBarcodeData.transformedPrintBarcode;

            if (!this.barcodeValidation.transformedPrintBarcode) {
                this.$message.error('黄板箱条码不匹配');
                this.scanForm.transformedPrintBarcode = '';
                // 重新聚焦到黄板箱条码输入框
                this.$nextTick(() => {
                    const transformedPrintBarcodeInput = this.$refs.scanForm.querySelector('input[placeholder="请扫描黄板箱条码"]');
                    if (transformedPrintBarcodeInput) {
                        transformedPrintBarcodeInput.focus();
                    }
                });
                return;
            }

            // 如果所有验证都通过，可以自动触发提交
            if (this.isAllBarcodeValid) {
                this.handleScanConfirm();
            }
        },
        // 获取验证标签类型
        getValidationTagType(value) {
            // 如果传入的是布尔值(用于表格显示)
            if (typeof value === 'boolean') {
                return value ? 'success' : 'danger';
            }
            // 如果传入的是验证类型字符串(用于扫码验证)
            else if (typeof value === 'string') {
                return this.barcodeValidation[value] ? 'success' : 'info';
            }
            return 'info'; // 默认返回
        },
        // 获取验证文本
        getValidationText(type) {
            if (!this.scanForm[type]) return '待验证';
            return this.barcodeValidation[type] ? '验证通过' : '验证失败';
        },
        // 修改确认提交方法
        async handleScanConfirm() {
            try {
                this.$refs.scanForm.validate(async (valid) => {
                    if (valid && this.isAllBarcodeValid) {
                        this.scanLoading = true;

                        // 构建抽检记录数据
                        const inspectionData = {
                            barcode: this.scanForm.barcode,
                            materialProcessFlowId: this.currentBarcodeData.materialProcessFlowId,
                            materialCode: this.currentBarcodeData.materialNumber,
                            materialName: this.currentBarcodeData.materialName,
                            isQualified: true, // 所有条码都匹配则为合格
                            samplingStatus: 'COMPLETED',
                            samplingTime: new Date(),
                            samplingOperator: this.$store.state.user.name,
                            remark: this.scanForm.remark,
                            barcodeValidation: {
                                printBarcode: this.scanForm.printBarcode,
                                transformedBarcode: this.scanForm.transformedPrintBarcode,
                                isPrintBarcodeValid: this.barcodeValidation.printBarcode,
                                isTransformedBarcodeValid: this.barcodeValidation.transformedPrintBarcode,
                                validationTime: new Date()
                            },
                            createBy: this.$store.state.user.id,
                            updateBy: this.$store.state.user.id
                        };

                        // 保存抽检记录
                        const result = await addData('udi_sampling_inspection_flow', inspectionData);

                        if (result.code === 200) {
                            this.$message.success('抽检记录已保存');
                            this.scanDialogVisible = false;
                            this.fetchData(); // 刷新列表
                        } else {
                            throw new Error(result.msg || '保存失败');
                        }
                    }
                });
            } catch (error) {
                console.error('保存失败:', error);
                this.$message.error('保存失败: ' + error.message);
            } finally {
                this.scanLoading = false;
            }
        },
        // 重置扫码表单
        resetScanForm() {
            this.scanForm = {
                barcode: '',
                printBarcode: '',
                transformedPrintBarcode: '',
                remark: ''
            };
            this.currentBarcodeData = null;
            this.showBarcodeValidation = false;
            this.barcodeValidation = {
                barcode: false,
                printBarcode: false,
                transformedPrintBarcode: false
            };
        },
        handleVoid(row, callback) {
            // 处理作废逻辑
            console.log('作废:', row);
            this.handleVoid(row, callback);
        },
        handleDetail(row) {
            // 处理详情逻辑
            console.log('详情:', row);
            this.currentDetail = row;
            this.detailDialogVisible = true;
        },
        // 获取抽检状态类型
        getSamplingStatusType(status) {
            const statusMap = {
                'PENDING': 'info',
                'COMPLETED': 'success',
                'VOIDED': 'danger'
            };
            return statusMap[status] || 'info';
        },

        // 获取抽检状态文本
        getSamplingStatusText(status) {
            const statusMap = {
                'PENDING': '待完成',
                'COMPLETED': '已完成',
                'VOIDED': '已作废'
            };
            return statusMap[status] || status;
        },

        // 获取验证提示信息
        getValidationTooltip(row, type) {
            if (type === 'print') {
                return `彩箱条码: ${row.barcodeValidation.printBarcode}\n验证结果: ${row.barcodeValidation.isPrintBarcodeValid ? '通过' : '失败'}`;
            } else {
                return `黄板箱条码: ${row.barcodeValidation.transformedBarcode}\n验证结果: ${row.barcodeValidation.isTransformedBarcodeValid ? '通过' : '失败'}`;
            }
        },

        // 处理作废操作
        async handleVoid(row, callback) {
            try {
                const { value: reason } = await this.$prompt('请输入作废原因', '作废确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    inputType: 'textarea',
                    inputValidator: (value) => {
                        if (!value) {
                            return '作废原因不能为空';
                        }
                        return true;
                    }
                });

                const updateData = {
                    samplingStatus: 'VOIDED',
                    voidReason: reason,
                    voidTime: new Date(),
                    voidOperator: this.$store.state.user.name,
                    updateBy: this.$store.state.user.id
                };

                const result = await updateData('udi_sampling_inspection_flow',
                    { query: { _id: row._id }, update: updateData });

                if (result.code === 200) {
                    this.$message.success('作废成功');
                    this.fetchData();
                    // 如果有回调函数，执行回调
                    if (typeof callback === 'function') {
                        callback();
                    }
                } else {
                    throw new Error(result.msg || '作废失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('作废失败:', error);
                    this.$message.error('作废失败: ' + error.message);
                }
                throw error;
            }
        },

        // 查看详情
        handleDetail(row) {
            this.currentDetail = row;
            this.detailDialogVisible = true;
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

.process-card {
    padding: 20px;

    .el-steps {
        margin: 20px 0;
    }

    .step-detail-card {
        margin-top: 10px;
        width: 200px;

        .step-info {
            font-size: 12px;
            color: #606266;
            line-height: 1.5;
            margin-bottom: 8px;
        }

        .scan-info {
            font-size: 12px;
            color: #909399;

            .scan-status {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 4px;

                i {
                    font-size: 14px;

                    &.success {
                        color: #67C23A;
                    }

                    &.warning {
                        color: #E6A23C;
                    }

                    &.danger {
                        color: #F56C6C;
                    }

                    &.info {
                        color: #909399;
                    }
                }
            }
        }

        .step-remark {
            margin-top: 8px;
            color: #E6A23C;
        }
    }
}

.materials-list {
    margin-top: 10px;
    border-top: 1px solid #EBEEF5;
    padding-top: 10px;

    .materials-title {
        font-size: 12px;
        color: #909399;
        margin-bottom: 5px;
    }

    .material-info {
        padding: 5px;
        font-size: 12px;
        color: #606266;

        >div {
            margin-bottom: 3px;
        }
    }
}

.process-flow {
    padding: 20px;

    .process-step {
        margin-bottom: 20px;
        border: 1px solid #EBEEF5;
        border-radius: 4px;

        &:last-child {
            margin-bottom: 0;
        }

        .step-header {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            background: #f5f7fa;
            border-bottom: 1px solid #EBEEF5;

            &.success {
                background: #f0f9eb;
            }

            &.process {
                background: #ecf5ff;
            }

            &.error {
                background: #fef0f0;
            }

            .step-number {
                width: 24px;
                height: 24px;
                line-height: 24px;
                text-align: center;
                background: #409EFF;
                color: white;
                border-radius: 50%;
                margin-right: 12px;
            }

            .step-title {
                flex: 1;

                .process-name {
                    font-size: 14px;
                    font-weight: bold;
                    margin-right: 8px;
                }

                .process-code {
                    color: #909399;
                    font-size: 12px;
                }
            }
        }

        .step-content {
            padding: 16px;

            .step-info {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin-bottom: 16px;

                .info-item {
                    font-size: 13px;

                    label {
                        color: #909399;
                        margin-right: 8px;
                    }
                }
            }

            .materials-section {
                .materials-header {
                    font-size: 13px;
                    color: #606266;
                    font-weight: bold;
                    margin-bottom: 12px;
                    padding-left: 8px;
                    border-left: 3px solid #409EFF;
                }
            }
        }
    }
}

.scan-status {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    i {
        &.success {
            color: #67C23A;
        }

        &.warning {
            color: #E6A23C;
        }

        &.danger {
            color: #F56C6C;
        }

        &.info {
            color: #909399;
        }
    }
}

.main-material {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 24px;

    .main-material-header {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #ebeef5;
        background: linear-gradient(to right, #f5f7fa, #ffffff);

        i {
            font-size: 20px;
            color: #409EFF;
            margin-right: 12px;
        }

        .title {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            margin-right: 12px;
        }

        .el-tag {
            margin-left: auto;
        }
    }

    .main-material-content {
        padding: 20px;

        .info-row {
            display: flex;
            margin-bottom: 16px;

            &:last-child {
                margin-bottom: 0;
            }

            .info-item {
                flex: 1;
                display: flex;
                align-items: center;

                label {
                    color: #909399;
                    font-size: 14px;
                    margin-right: 8px;
                    min-width: 80px;
                }

                span {
                    color: #303133;
                    font-size: 14px;
                }

                .el-progress {
                    width: 100%;
                    margin-right: 20px;
                }

                .el-tag {
                    padding: 0 12px;
                    height: 28px;
                    line-height: 26px;
                }
            }
        }
    }

    &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
        transition: all 0.3s ease;
    }
}

.material-info-container {
    padding: 20px;
    background: #fff;
    border-radius: 8px;

    .table-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding: 0 10px;

        i {
            font-size: 20px;
            color: #409EFF;
            margin-right: 10px;
        }

        span {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
        }
    }

    .material-table {
        margin-bottom: 20px;

        .process-info {
            display: flex;
            align-items: center;
            justify-content: center;

            .el-tag {
                margin: 0 4px;
            }
        }

        .inner-table {
            margin: 0;
            background: transparent;

            &.el-table {
                &::before {
                    display: none;
                }

                .el-table__header-wrapper {
                    display: none;
                }

                .el-table__body-wrapper {
                    background: transparent;
                }

                td {
                    padding: 4px 8px;
                    height: 32px;
                    line-height: 24px;
                    font-size: 12px;

                    &.el-table__cell {
                        border-bottom: 1px solid #EBEEF5;

                        &:last-child {
                            border-bottom: none;
                        }
                    }
                }
            }
        }

        .no-material {
            color: #909399;
            padding: 20px;
            text-align: center;
            font-size: 14px;
        }
    }

    :deep(.el-table) {
        .el-table__header-wrapper {
            th {
                background: #f5f7fa;
            }
        }

        .el-table__row {
            transition: all 0.3s;

            &:hover {
                background-color: #f5f7fa;
            }
        }
    }

    .process-info {
        .process-code {
            margin-left: 5px;
        }
    }

    .no-barcode {
        color: #909399;
    }

    .inner-table {
        .el-tag+.el-tag {
            margin-left: 5px;
        }
    }
}

.barcode-search-container {
    .search-area {
        margin-bottom: 20px;

        .el-input {
            width: 400px;
        }
    }

    .search-result {
        min-height: 200px;

        .no-result {
            text-align: center;
            padding: 40px 0;
            color: #909399;

            i {
                font-size: 24px;
                margin-right: 8px;
            }

            span {
                font-size: 14px;
            }
        }

        .el-table {
            margin-top: 10px;

            .el-button--text {
                padding: 0;
            }

            .el-tag+.el-tag {
                margin-left: 4px;
            }
        }
    }
}

.inner-table {
    margin: 0;
    background: transparent;

    &.el-table {
        &::before {
            display: none;
        }

        .el-table__header-wrapper {
            display: none;
        }

        .el-table__body-wrapper {
            background: transparent;
        }

        td {
            padding: 4px 8px;
            height: 32px;
            line-height: 24px;
            font-size: 12px;

            &.el-table__cell {
                border-bottom: 1px solid #EBEEF5;

                &:last-child {
                    border-bottom: none;
                }
            }
        }
    }
}

.el-tooltip__popper {
    max-width: 300px;
    line-height: 1.5;
}

.validation-results {
    display: flex;
    gap: 10px;
    margin-top: 5px;

    .el-tag {
        padding: 5px 10px;
    }
}

.validation-tags {
    display: flex;
    gap: 8px;
    justify-content: center;

    .el-tag {
        cursor: pointer;
    }
}

.remark-text {
    display: inline-block;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
}

.detail-container {
    .detail-section {
        margin-top: 20px;

        h4 {
            margin-bottom: 10px;
            padding-left: 8px;
            border-left: 3px solid #409EFF;
            font-size: 14px;
        }
    }

    :deep(.el-descriptions) {
        .el-descriptions-item__label {
            background-color: #f5f7fa;
            width: 120px;
        }
    }
}
</style>
