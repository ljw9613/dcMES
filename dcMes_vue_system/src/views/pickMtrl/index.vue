<template>
    <div class="app-container">
        <!-- 搜索表单 -->
        <div class="screen1">
            <el-form :model="searchForm" ref="searchForm" class="screen_content_first">
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="单据编号">
                            <el-input v-model="searchForm.FBillNo" placeholder="请输入单据编号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <!-- <el-col :span="8">
                        <el-form-item label="生产组织">
                            <el-input v-model="searchForm.FPrdOrgId.Number" placeholder="请输入生产组织编号"
                                clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
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
                        <el-form-item label="发料组织">
                            <el-input v-model="searchForm.FStockOrgId.Number" placeholder="请输入发料组织编号"
                                clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="生产车间">
                            <el-input v-model="searchForm.FWorkShopId" placeholder="请输入生产车间" clearable></el-input>
                        </el-form-item>
                    </el-col> -->
                    <el-col :span="12">
                        <el-form-item label="创建日期">
                            <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd"
                                style="width: 100%">
                            </el-date-picker>
                        </el-form-item>
                    </el-col>
                </el-row>
                <div class="operation-buttons">
                    <el-button type="primary" @click="fetchData">查询</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <el-button type="warning" @click="handleSync">同步数据</el-button>
                </div>
            </el-form>
        </div>

        <!-- 列表标题区 -->
        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">生产领料单列表</i>
                    <hir-input ref="hirInput" :printData="printData" :default-template="localPrintTemplate"
                        :template-params="{
                            // templateType: { $in: ['MR'] },
                            status: true
                        }" placeholder="请选择生产领料打印模板" @template-change="handleTemplateChange" />
                </div>
            </div>
        </div>

        <!-- 表格部分 -->
        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @handleCurrentChange="baseTableHandleCurrentChange" :cell-style="{ textAlign: 'center' }"
            @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">
                <!-- 展开行 -->
                <el-table-column type="expand">
                    <template slot-scope="props">
                        <el-table :data="props.row.FEntity || []" border style="width: 100%">
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
                            <el-table-column label="单位" prop="FBaseUnitId" width="100">
                                <template slot-scope="scope">
                                    {{ scope.row.FBaseUnitId && scope.row.FBaseUnitId.Name || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column label="申请数量" prop="FAppQty" width="100" />
                            <el-table-column label="实发数量" prop="FActualQty" width="100" />
                            <el-table-column label="可超发数量" prop="FAllowOverQty" width="100" />

                            <!-- 仓储信息 -->
                            <el-table-column label="仓库" min-width="120">
                                <template slot-scope="scope">
                                    {{ scope.row.FStockId && scope.row.FStockId.Name || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column label="批号" prop="FLot" width="120" />
                            <el-table-column label="库存状态" prop="FStockStatusId" width="100" />

                            <!-- 生产信息 -->
                            <el-table-column label="生产订单编号" prop="FMoBillNo" min-width="150" />
                            <el-table-column label="生产车间" min-width="120">
                                <template slot-scope="scope">
                                    {{ scope.row.FWorkShopId && scope.row.FWorkShopId.Name || '-' }}
                                </template>
                            </el-table-column>

                            <!-- 其他信息 -->
                            <el-table-column label="备注" prop="FEntrtyMemo" min-width="150" />
                        </el-table>
                    </template>
                </el-table-column>

                <!-- 主表列 -->
                <el-table-column label="领料单号" prop="FBillNo" min-width="120" />
                <el-table-column label="生产组织" min-width="180">
                    <template slot-scope="scope">
                        <el-tooltip :content="getOrgInfo(scope.row.FPrdOrgId)" placement="top">
                            <span>{{ scope.row.FPrdOrgId && scope.row.FPrdOrgId.Name || '-' }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>

                <el-table-column label="发料组织" min-width="180">
                    <template slot-scope="scope">
                        <el-tooltip :content="getOrgInfo(scope.row.FStockOrgId)" placement="top">
                            <span>{{ scope.row.FStockOrgId && scope.row.FStockOrgId.Name || '-' }}</span>
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

                <el-table-column label="领料人" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FPickerId && scope.row.FPickerId.Name || '-' }}
                    </template>
                </el-table-column>

                <el-table-column label="创建人" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FCreatorId && scope.row.FCreatorId.Name || '-' }}
                    </template>
                </el-table-column>

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

                <el-table-column label="修改人" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FModifierId && scope.row.FModifierId.Name || '-' }}
                    </template>
                </el-table-column>

                <el-table-column label="审核人" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.FApproverId && scope.row.FApproverId.Name || '-' }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" fixed="right" width="250">
                    <template slot-scope="scope">
                        <el-button
                          type="text"
                          size="small"
                          v-if="$checkPermission('生产领料单同步')"
                          @click="handleOneSync(scope.row)">同步</el-button>
                        <el-button
                          type="text"
                          size="small"
                          v-if="$checkPermission('生产领料单拓展数据')"
                          @click="handleExt(scope.row)">拓展数据</el-button>
                        <el-button
                          type="text"
                          size="small"
                          v-if="$checkPermission('生产领料单物料明细')"
                          @click="showMaterialDetail(scope.row)">物料明细</el-button>
                        <el-button
                          type="text"
                          size="small"
                          v-if="$checkPermission('生产领料单打印')"
                          @click="handlePrint(scope.row)">打印</el-button>
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
        <el-dialog title="同步生产领料单" :visible.sync="syncDialogVisible" width="500px">
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
                <el-form-item label="领料单号" required v-if="syncForm.syncType === 'billNo'">
                    <el-input v-model="syncForm.billNo" placeholder="请输入领料单号"></el-input>
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

        <!-- 拓展数据对话框 -->
        <el-dialog title="拓展数据" :visible.sync="extDialogVisible">
            <pick-mtrl-ext v-if="extDialogVisible" :order-data="currentOrderData" @close="extDialogVisible = false"
                @refresh="fetchData" />
        </el-dialog>
    </div>
</template>

<script>
import { getData } from "@/api/data";
import { syncPRD_PickMtrl, getSyncStatus } from "@/api/K3Data";
import HirInput from '@/components/hirInput/index.vue'
import MaterialDetail from './components/MaterialDetail.vue'
import PickMtrlExt from './components/PickMtrlExt.vue'

export default {
    name: 'PickMtrl',
    components: {
        HirInput,
        MaterialDetail,
        PickMtrlExt
    },
    computed: {
        localPrintTemplate: {
            get() {
                try {
                    const savedTemplate = localStorage.getItem('printTemplate_pickMtrl');
                    return savedTemplate ? JSON.parse(savedTemplate) : null;
                } catch (error) {
                    console.error('解析缓存模板失败:', error);
                    return null;
                }
            },
            set(value) {
                try {
                    localStorage.setItem('printTemplate_pickMtrl', JSON.stringify(value));
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
                FPrdOrgId: {
                    Number: ''
                },
                FStockOrgId: {
                    Number: ''
                },
                FDocumentStatus: '',
                FWorkShopId: '',
                dateRange: [],
            },
            tableList: [],
            total: 0,
            currentPage: 1,
            pageSize: 10,
            listLoading: true,
            showAdvanced: false,
            selection: [],
            materialDetailVisible: false,
            currentOrderData: {},
            printData: {},
            syncDialogVisible: false,
            syncProgressTimer: null,
            syncForm: {
                syncType: 'date',
                dateRange: [],
                documentStatus: 'C',
                billNo: ''
            },
            extDialogVisible: false,
        }
    },
    methods: {

        // 获取数据
        async fetchData() {
            this.listLoading = true;
            try {
                let req = this.searchData();
                req.page = this.currentPage;
                req.skip = (this.currentPage - 1) * this.pageSize;
                req.limit = this.pageSize;
                req.sort = { FBillNo: 1 };
                req.count = true;

                const result = await getData("K3_PRD_PickMtrl", req);

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

            if (this.searchForm.FPrdOrgId.Number) {
                req.query.$and.push({ 'FPrdOrgId.Number': { $regex: this.searchForm.FPrdOrgId.Number.trim(), $options: 'i' } });
            }

            if (this.searchForm.FStockOrgId.Number) {
                req.query.$and.push({ 'FStockOrgId.Number': { $regex: this.searchForm.FStockOrgId.Number.trim(), $options: 'i' } });
            }

            if (this.searchForm.FDocumentStatus) {
                req.query.$and.push({ FDocumentStatus: this.searchForm.FDocumentStatus });
            }

            if (this.searchForm.FWorkShopId) {
                req.query.$and.push({ FWorkShopId: { $regex: this.searchForm.FWorkShopId.trim(), $options: 'i' } });
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

        // 处理打印
        async handlePrint(row) {
            console.log(printData);
            console.log(this.localPrintTemplate);
            if (!this.localPrintTemplate) {
                this.$message.warning('请先选择打印模板');
                return;
            }

            //获取拓展数据
            const result = await getData('k3_PRD_PickMtrlExt', {
                query: { FSaleOrderId: row._id },
                populate: JSON.stringify([{ path: 'productionOrderId' }])
            })
            let printData = { ...row };
            if (result.code === 200 && result.data.length > 0) {
                console.log(result.data[0], 'result.data[0]')
                printData = { ...printData, ...result.data[0] }
            }

            // 生产领料单打印数据处理
            if (this.localPrintTemplate.templateType === 'MR') {
                printData.FApproveDate = this.formatDate(printData.FApproveDate);
                printData.FCreateDate = this.formatDate(printData.FCreateDate);
                printData.FPrdOrgId_Name = printData.FPrdOrgId && printData.FPrdOrgId.Name || '-';
                printData.FStockOrgId_Name = printData.FStockOrgId && printData.FStockOrgId.Name || '-';
                printData.totalFNum = printData.FEntity.reduce((sum, item) => sum + item.FAppQty, 0);
                // 处理明细数据
                printData.FEntity = printData.FEntity.map((item, index) => ({
                    ...item,
                    FNum: index + 1,
                    FMaterialId_Name: item.FMaterialId && item.FMaterialId.Name,
                    FMaterialId_Number: item.FMaterialId && item.FMaterialId.Number,
                    FMaterialId_Specification: item.FMaterialId && item.FMaterialId.Specification
                }));
            }
            console.log(printData, 'productionOrderNo')

            this.printData = printData;
            this.$nextTick(() => {
                this.$refs.hirInput.handlePrints();
            });
        },

        // 辅助方法
        getMaterialNumber(material) {
            return material && material.Number || '-'
        },
        getMaterialName(material) {
            return material && material.Name || '-'
        },
        getMaterialSpec(material) {
            return material && material.Specification || '-'
        },
        getOrgInfo(org) {
            if (!org) return '-'
            return `${org.Number} - ${org.Name || '-'}`
        },

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

        getStatusType(status) {
            const statusMap = {
                'A': 'info',
                'B': 'warning',
                'C': 'success',
                'D': 'danger'
            }
            return statusMap[status] || 'info'
        },

        getStatusText(status) {
            const statusMap = {
                'A': '草稿',
                'B': '审核中',
                'C': '已审核',
                'D': '重新审核'
            }
            return statusMap[status] || status
        },

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

        baseTableHandleCurrentChange(currentPage) {
            this.currentPage = currentPage;
            this.fetchData();
        },

        baseTableHandleSizeChange(pageSize) {
            this.pageSize = pageSize;
            this.fetchData();
        },

        handleMaterialDetailClose() {
            this.materialDetailVisible = false
            this.currentOrderData = {}
        },

        showMaterialDetail(row) {
            this.currentOrderData = row
            this.materialDetailVisible = true
        },

        handleSync() {
            this.syncDialogVisible = true;
            this.syncForm = {
                syncType: 'date',
                dateRange: [],
                documentStatus: 'C',
                billNo: ''
            };
        },

        async confirmSync() {
            if (this.syncForm.syncType === 'date' && (!this.syncForm.dateRange || this.syncForm.dateRange.length !== 2)) {
                this.$message.warning('请选择审核日期范围');
                return;
            }
            if (this.syncForm.syncType === 'billNo' && !this.syncForm.billNo) {
                this.$message.warning('请输入领料单号');
                return;
            }

            try {
                let confirmMessage = '';
                switch (this.syncForm.syncType) {
                    case 'all':
                        confirmMessage = '确认要同步所有生产领料单数据吗？此操作可能需要较长时间';
                        break;
                    case 'date':
                        confirmMessage = '确认要同步规则筛选的生产领料单数据吗？';
                        break;
                    case 'billNo':
                        confirmMessage = `确认要同步单号为 ${this.syncForm.billNo} 的生产领料单数据吗？`;
                        break;
                }

                await this.$confirm(confirmMessage, '提示', {
                    type: 'warning'
                });

                // TODO: 替换为实际的生产领料单同步API
                const response = await syncPRD_PickMtrl(this.buildSyncRequest());

                if (response.code === 200) {
                    this.syncDialogVisible = false;
                    this.startSyncProgressCheck();
                    this.$message.success('同步任务已启动');
                }
            } catch (error) {
                console.error('同步失败:', error);
                this.$message.error('同步失败');
            }
        },

        // 开始定时查询同步进度
        startSyncProgressCheck() {
            if (this.syncProgressTimer) {
                clearInterval(this.syncProgressTimer);
            }

            this.syncProgressTimer = setInterval(async () => {
                try {
                    const response = await getSyncStatus('k3_PRD_PickMtrl');
                    if (response.code === 200) {
                        const saleOrderTask = response.taskStatus;
                        if (saleOrderTask) {
                            switch (saleOrderTask.status) {
                                case 'running':
                                    this.$notify({
                                        type: 'info',
                                        message: `生产领料单同步中：当前${saleOrderTask.processedRecords}条数据同步完成，耗时${saleOrderTask.elapsedTime}秒`,
                                        duration: 5000
                                    });
                                    break;

                                case 'no_task':
                                    this.$message.success(`生产领料单同步完成！`);
                                    this.stopSyncProgressCheck();
                                    this.fetchData();
                                    break;
                                case 'completed':
                                    this.$message.success(`生产领料单同步完成！`);
                                    this.stopSyncProgressCheck();
                                    this.fetchData();
                                    break;
                                default:
                                    this.$message.warning('未知的同步状态');
                                    this.stopSyncProgressCheck();
                            }
                        } else {
                            this.$message.warning('未找到生产领料单同步任务');
                            this.stopSyncProgressCheck();
                        }
                    }
                } catch (error) {
                    console.error('查询生产领料单同步进度失败:', error);
                    this.$message.error('查询生产领料单同步进度失败');
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

        buildSyncRequest() {
            let req = {
                FilterString: []
            };

            switch (this.syncForm.syncType) {
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
                    req.FilterString = [{
                        "FieldName": "FBillNo",
                        "Compare": "=",
                        "Value": this.syncForm.billNo,
                        "Left": "",
                        "Right": "",
                        "Logic": 0
                    }];
                    break;
                case 'all':
                    req.FilterString = [{
                        "FieldName": "FDocumentStatus",
                        "Compare": "StatusEqualto",
                        "Value": "C",
                        "Left": "",
                        "Right": "",
                        "Logic": 0
                    }];
                    break;
            }
            return req;
        },

        handleExt(row) {
            this.currentOrderData = row
            this.extDialogVisible = true
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

.operation-buttons {
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
}
</style>
