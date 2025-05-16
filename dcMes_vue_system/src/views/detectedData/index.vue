<template>
    <div class="app-container">
        <el-card class="filter-container">
            <div slot="header" class="clearfix">
                <span>筛选搜索</span>
            </div>

            <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="扫描码">
                            <el-input v-model="searchForm.scanCode" placeholder="请输入扫描码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="设备">
                            <zr-select v-model="searchForm.machineId" collection="machine"
                                :search-fields="['machineName', 'machineCode']" label-key="machineName"
                                sub-key="machineCode" :multiple="false" placeholder="请输入设备名称搜索" clearable
                                style="width: 100%">
                                <template #option="{ item }">
                                    <div class="select-option">
                                        <div class="option-main">
                                            <span class="option-label">{{ item.machineName }}</span>
                                            <el-tag size="mini" type="info" class="option-tag">
                                                {{ item.machineCode }}
                                            </el-tag>
                                        </div>
                                    </div>
                                </template>
                            </zr-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="工序">
                            <zr-select v-model="searchForm.processId" collection="processStep"
                                :search-fields="['processCode', 'processName']" label-key="processName" sub-key="_id"
                                :multiple="false" placeholder="请输入工序名称/编码搜索" clearable style="width: 100%">
                                <template #option="{ item }">
                                    <div class="select-option">
                                        <div class="option-main">
                                            <span class="option-label">{{ item.processName }}</span>
                                            <el-tag size="mini" type="info" class="option-tag">
                                                {{ item.processCode }}
                                            </el-tag>
                                        </div>
                                    </div>
                                </template>
                            </zr-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="检测时间">
                            <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd"
                                style="width: 100%">
                            </el-date-picker>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="物料编码">
                            <el-input v-model="searchForm.materialCode" placeholder="请输入物料编码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="销售订单">
                            <zr-select
                                v-model="searchForm.saleOrderNo"
                                collection="k3_SAL_SaleOrder" 
                                :search-fields="['FBillNo']"
                                label-key="FBillNo"
                                value-key="FBillNo"
                                :multiple="false"
                                placeholder="请输入销售订单号搜索"
                                clearable
                                style="width: 100%"
                            >
                                <template #option="{ item }">
                                    <div class="select-option">
                                        <div class="option-main">
                                            <span class="option-label">{{ item.FBillNo }}</span>
                                            <el-tag size="mini" type="info" class="option-tag" v-if="item.FSaleOrgId_FName">
                                                {{ item.FSaleOrgId_FName }}
                                            </el-tag>
                                        </div>
                                    </div>
                                </template>
                            </zr-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="流程状态">
                            <el-select v-model="searchForm.materialFlowStatus" placeholder="请选择流程状态" clearable style="width: 100%">
                                <el-option label="待处理" value="PENDING" />
                                <el-option label="进行中" value="IN_PROCESS" />
                                <el-option label="已完成" value="COMPLETED" />
                                <el-option label="异常" value="ABNORMAL" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <el-button type="primary" @click="handleExportByMaterial" :loading="exportLoading">
                        <i class="el-icon-download"></i>
                        {{ exportLoading ? `正在导出(${exportProgress}%)` : '按物料导出' }}
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">检测数据列表</i>
                    <el-button type="primary" @click="handleExport" :loading="exportLoading">
                        <i class="el-icon-download"></i>
                        {{ exportLoading ? `正在导出(${exportProgress}%)` : '导出数据' }}
                    </el-button>
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
                            <div v-if="inspectionDataHandle(scope.row).length" class="tags-container">
                                <el-tag style="margin: 5px" v-for="tag in inspectionDataHandle(scope.row)" :key="tag" size="medium">
                                    {{ tag }}
                                </el-tag>
                            </div>
                        </el-form>
                    </template>
                </el-table-column>
                <el-table-column label="扫描码" align="center" prop="scanCode">
                    <template slot-scope="scope">
                        <el-link type="primary">{{ scope.row.scanCode }}</el-link>
                        <el-link type="primary" style="margin-left: 10px" @click="showHistory(scope.row)">历史记录</el-link>
                    </template>
                </el-table-column>
                <el-table-column label="设备名称" align="center" width="220">
                    <template slot-scope="scope">
                        {{ scope.row.machineId ? scope.row.machineId.machineName : '--' }}
                    </template>
                </el-table-column>
                <el-table-column label="工序名称" align="center" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.processId ? scope.row.processId.processName : '--' }}
                    </template>
                </el-table-column>
                <el-table-column label="检测结果" align="center" width="400">
                    <template slot-scope="scope">
                        <el-tag :type="!scope.row.error ? 'success' : 'danger'">
                            {{ !scope.row.error ? '合格' : '不合格' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="检测时间" align="center" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.createTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="检测操作" fixed="right" width="280">
                    <template slot-scope="scope">
                        <el-button
                          type="text"
                          size="small"
                          v-if="$checkPermission('检测数据查询')"
                          @click="search">查询</el-button>
                        <el-button
                          type="text"
                          size="small"
                          v-if="$checkPermission('检测数据重置')"
                          @click="resetForm">重置</el-button>
                        <el-button
                          type="text"
                          size="small"
                          v-if="$checkPermission('检测数据按物料导出')"
                          @click="handleExportByMaterial">按物料导出</el-button>
                        <el-button
                          type="text"
                          size="small"
                          v-if="$checkPermission('检测数据导出数据')"
                          @click="handleExport">导出数据</el-button>
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <edit-dialog :visible.sync="dialogFormVisible" :dialog-status="dialogStatus" :row-data="dataForm"
            @submit="handleSubmit" />

        <!-- 添加历史数据弹窗 -->
        <el-dialog title="历史检测数据" :visible.sync="historyDialogVisible" width="80%">
            <base-table ref="historyTable" :currentPage="historyCurrentPage" :highlight-current-row="true"
                :pageSize="historyPageSize" :tableData="historyTableList" :tableDataloading="historyListLoading"
                :total="historyTotal" @handleCurrentChange="historyTableHandleCurrentChange"
                @handleSizeChange="historyTableHandleSizeChange">
                <template slot="law">
                    <el-table-column type="expand">
                        <template slot-scope="scope">
                            <el-form label-position="left" inline class="table-expand">
                                <div v-if="inspectionDataHandle(scope.row).length" class="tags-container">
                                    <el-tag style="margin: 5px" v-for="tag in inspectionDataHandle(scope.row)"
                                        :key="tag" size="medium">
                                        {{ tag }}
                                    </el-tag>
                                </div>
                            </el-form>
                        </template>
                    </el-table-column>

                    <el-table-column label="设备名称" align="center">
                        <template slot-scope="scope">
                            {{ scope.row.machineId ? scope.row.machineId.machineName : '--' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="工序名称" align="center">
                        <template slot-scope="scope">
                            {{ scope.row.processId ? scope.row.processId.processName : '--' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="检测结果" align="center">
                        <template slot-scope="scope">
                            <el-tag :type="!scope.row.error ? 'success' : 'danger'">
                                {{ !scope.row.error ? '合格' : '不合格' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="检测时间" align="center">
                        <template slot-scope="scope">
                            {{ formatDate(scope.row.createTime) }}
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
import EditDialog from './components/EditDialog'
import inspectionFieldEnum from './map.json'
import { query } from "quill";
import Export2Excel from '@/vendor/Export2Excel'

export default {
    name: 'InspectionLastData',
    components: {
        EditDialog
    },
    data() {
        return {
            searchForm: {
                materialCode: '',
                scanCode: '',
                machineId: '',
                processId: '',
                dateRange: [],
                saleOrderNo: '',
                materialFlowStatus: ''
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
        }
    },
    methods: {
        // 辅助函数：分批次获取数据 (通用)
        async fetchDataInBatches(collectionName, baseQuery, batchSize = 100) {
            let allData = [];
            let currentPage = 1;
            let hasMoreData = true;
            // Minimal user feedback for this generic helper to avoid flooding messages
            // console.log(`正在从 ${collectionName} 分批获取数据...`);

            while (hasMoreData) {
                const queryParams = {
                    ...baseQuery,
                    skip: (currentPage - 1) * batchSize,
                    limit: batchSize,
                    count: true
                };

                try {
                    const result = await getData(collectionName, queryParams);
                    if (result.data && result.data.length > 0) {
                        allData = allData.concat(result.data);
                        if (result.data.length < batchSize) {
                            hasMoreData = false; // 最后一页
                        } else {
                            currentPage++;
                        }
                    } else {
                        hasMoreData = false; // 没有数据了
                    }
                } catch (error) {
                    console.error(`Error fetching batch from ${collectionName}:`, error);
                    this.$message.error(`从 ${collectionName} 分批获取数据时发生错误`);
                    hasMoreData = false; 
                }
            }
            // console.log(`${collectionName} 数据获取完成，共 ${allData.length} 条`);
            return allData;
        },

        // 新的辅助函数：分批处理 scanCodes 来查询 InspectionLastData
        async fetchInspectionDataAdvanced(baseParams, allScanCodes, options) {
            const {
                isPaginated = false,
                page, // 1-indexed
                limit,
                sort = { _id: -1 },
                scanCodeBatchSize = 200, // 每批 $in 查询中包含的 scanCode 数量
                progressCallback, // 用于导出时的进度回调
                populate = JSON.stringify([{ path: 'machineId' }, { path: 'processId' }])
            } = options;

            let collectedData = [];
            let totalCountFromBatches = 0;

            // 如果提供了 allScanCodes 且为空数组 (通常意味着物料编码搜索无结果)，则直接返回空
            if (allScanCodes && allScanCodes.length === 0) {
                return { data: [], countnum: 0 };
            }
            
            // 如果 allScanCodes 未提供 (例如，非物料编码搜索)，则执行一次查询
            const scanCodeBatches = allScanCodes && allScanCodes.length > 0 
                ? Array.from({ length: Math.ceil(allScanCodes.length / scanCodeBatchSize) }, (_, i) =>
                    allScanCodes.slice(i * scanCodeBatchSize, (i + 1) * scanCodeBatchSize)
                  )
                : [null]; // 单次执行，不基于 scanCode 批次

            const numEffectiveBatches = scanCodeBatches.length;

            for (let i = 0; i < numEffectiveBatches; i++) {
                const scanCodeBatch = scanCodeBatches[i];
                const currentReq = JSON.parse(JSON.stringify(baseParams)); // 深拷贝基础查询参数

                if (scanCodeBatch) { // 如果当前是基于 scanCode 批次进行查询
                    if (!currentReq.query.$and) {
                        currentReq.query.$and = [];
                    }
                    // 添加当前批次的 scanCode $in 条件
                    currentReq.query.$and.push({ scanCode: { $in: scanCodeBatch } });
                }
                
                currentReq.populate = populate;
                currentReq.sort = sort;

                if (isPaginated) {
                    currentReq.count = true; // 需要计数来累加总数
                    // 为了正确分页，这里我们获取当前 scanCodeBatch 的所有数据
                    // 然后在循环结束后统一排序和分页。这可能导致加载较多数据。
                    const result = await getData("InspectionLastData", { ...currentReq }); // 获取此批次所有数据
                    if (result.data) {
                        collectedData = collectedData.concat(result.data);
                    }
                    // 获取当前批次实际数量用于总数累加（如果API直接返回countnum则使用，否则依赖data.length）
                    // 假设getData在没有分页参数时返回所有匹配项，且包含countnum
                    const batchCountResult = await getData("InspectionLastData", {...currentReq, limit:1, count:true})
                    totalCountFromBatches += (batchCountResult.countnum || 0);

                } else { // 非分页模式 (通常用于导出)
                    currentReq.count = false; // 导出时不需要单独计数，最后汇总长度即可
                    const result = await getData("InspectionLastData", currentReq); // 获取此批次所有数据
                    if (result.data) {
                        collectedData = collectedData.concat(result.data);
                    }
                    if (progressCallback) {
                        // 进度是基于 scanCode 批次的处理进度
                        progressCallback(Math.round(((i + 1) / numEffectiveBatches) * 100));
                    }
                }
            }

            if (isPaginated) {
                // 对所有收集到的数据进行排序
                collectedData.sort((a, b) => {
                    if (sort && sort._id === -1) { // 示例: 按 _id 降序
                        return (a._id < b._id) ? 1 : ((a._id > b._id) ? -1 : 0);
                    }
                    // TODO: 可以根据需要扩展更通用的排序逻辑
                    return 0;
                });

                const skipAmount = (page - 1) * limit;
                const paginatedSlice = collectedData.slice(skipAmount, skipAmount + limit);
                return { data: paginatedSlice, countnum: totalCountFromBatches };
            }

            return collectedData; // 对于导出，返回所有数据
        },
        inspectionDataHandle(row) {
            let data = []
            // 处理常规字段
            for (let inspectionFieldEnumKey in inspectionFieldEnum) {
                inspectionFieldEnumKey !== "error" && !this.isBlank(row[inspectionFieldEnumKey]) && (data.push(`${inspectionFieldEnum[inspectionFieldEnumKey]}：${row[inspectionFieldEnumKey]}`))
            }
            
            // 处理 inspectionData 数组
            if (row.inspectionData && Array.isArray(row.inspectionData) && row.inspectionData.length > 0) {
                row.inspectionData.forEach(item => {
                    if (item.field && item.value) {
                        data.push(`${item.field}：${item.value}`)
                    }
                })
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
        // 重构后的 searchData，变为 async 并负责解析 scanCodes
        async resolvedSearchParameters() {
            let directQueryConditions = { query: { $and: [] } }; // 保持与API一致的结构
            const escapeRegexFunc = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // 1. 构建直接查询条件
            if (this.searchForm.scanCode && this.searchForm.scanCode.trim()) {
                directQueryConditions.query.$and.push({
                    scanCode: { $regex: escapeRegexFunc(this.searchForm.scanCode.trim()), $options: 'i' }
                });
            }
            if (this.searchForm.machineId) {
                directQueryConditions.query.$and.push({ machineId: this.searchForm.machineId });
            }
            if (this.searchForm.processId) {
                directQueryConditions.query.$and.push({ processId: this.searchForm.processId });
            }
            if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
                const [startDate, endDate] = this.searchForm.dateRange;
                directQueryConditions.query.$and.push({
                    createTime: {
                        $gte: new Date(startDate).toISOString(),
                        $lte: new Date(endDate + ' 23:59:59.999').toISOString()
                    }
                });
            }
            if (!directQueryConditions.query.$and.length) {
                delete directQueryConditions.query.$and;
            }

            // 2. 解析物料编码和销售订单以获取 scanCodes
            let resolvedScanCodes = null; // null: 无需解析, []: 解析后无结果, [...]: 解析结果
            const hasMaterialCode = !!this.searchForm.materialCode;
            const hasSaleOrderNo = !!this.searchForm.saleOrderNo;
            const hasMaterialFlowStatus = !!this.searchForm.materialFlowStatus;

            if (hasMaterialCode || hasSaleOrderNo || hasMaterialFlowStatus) {
                let materialFlowQueryParts = [];
                if (hasMaterialCode) {
                    materialFlowQueryParts.push({ materialCode: { $regex: this.searchForm.materialCode.trim(), $options: 'i' } });
                }
                if (hasMaterialFlowStatus) {
                    materialFlowQueryParts.push({ status: this.searchForm.materialFlowStatus });
                }

                if (hasSaleOrderNo) {
                    this.$message.info('正在查询销售订单关联的工单...');
                    const workOrderResult = await this.fetchDataInBatches("production_plan_work_order", {
                        query: { saleOrderNo: this.searchForm.saleOrderNo },
                        select: '_id'
                    }, 200);

                    if (workOrderResult && workOrderResult.length > 0) {
                        const workOrderIds = workOrderResult.map(wo => wo._id);
                        materialFlowQueryParts.push({ productionPlanWorkOrderId: { $in: workOrderIds } });
                        this.$message.success(`销售订单关联到 ${workOrderIds.length} 个工单。`);
                    } else {
                        this.$message.warning('未找到与该销售订单关联的工单。');
                        if (hasSaleOrderNo && !hasMaterialCode && !hasMaterialFlowStatus) {
                            resolvedScanCodes = [];
                        } else {
                            materialFlowQueryParts.push({ productionPlanWorkOrderId: { $in: [] } });
                        }
                    }
                }
                
                // 只有当 resolvedScanCodes 仍然是 null (即销售订单不是唯一条件且未提前返回空) 并且 materialFlowQueryParts 有内容时才查询
                if (resolvedScanCodes === null && materialFlowQueryParts.length > 0) {
                    const finalMaterialFlowQuery = materialFlowQueryParts.length === 1 ? materialFlowQueryParts[0] : { $and: materialFlowQueryParts };
                    this.$message.info('正在查询物料/工单对应的流程条码...');
                    const materialFlowItems = await this.fetchDataInBatches("material_process_flow", {
                        query: finalMaterialFlowQuery,
                        select: 'barcode'
                    });

                    if (materialFlowItems && materialFlowItems.length > 0) {
                        resolvedScanCodes = materialFlowItems.map(item => item.barcode);
                        this.$message.success(`找到 ${resolvedScanCodes.length} 个相关流程条码。`);
                    } else {
                        resolvedScanCodes = []; // 未找到条码，设置为空数组
                        this.$message.warning('未找到物料编码/销售订单/流程状态对应的流程条码记录。');
                    }
                } else if (resolvedScanCodes === null && !hasMaterialCode && !hasSaleOrderNo && !hasMaterialFlowStatus) {
                     // No material, sales order, or status filter, resolvedScanCodes remains null
                } else if (resolvedScanCodes === null) {
                    if (hasMaterialCode || hasSaleOrderNo || hasMaterialFlowStatus) resolvedScanCodes = []; 
                }
            }
            return { directQuery: directQueryConditions, scanCodes: resolvedScanCodes };
        },
        resetForm() {
            this.$refs.searchForm.resetFields();
            this.searchForm = {
                materialCode: '',
                scanCode: '',
                machineId: '',
                processId: '',
                dateRange: [],
                saleOrderNo: '',
                materialFlowStatus: ''
            };
            this.currentPage = 1;
            this.fetchData();
        },
        async fetchData() {
            this.listLoading = true;
            try {
                const { directQuery, scanCodes } = await this.resolvedSearchParameters();

                if (scanCodes !== null) { // 物料编码或销售订单筛选已激活
                    if (scanCodes.length === 0) {
                        this.$message.warning('根据物料/销售订单筛选，未找到对应的检测数据。');
                        this.tableList = [];
                        this.total = 0;
                    } else {
                        this.$message.info(`正在基于 ${scanCodes.length} 个条码分批查询检测数据...`);
                        const inspectionResults = await this.fetchInspectionDataAdvanced(directQuery, scanCodes, {
                            isPaginated: true,
                            page: this.currentPage,
                            limit: this.pageSize,
                            sort: directQuery.sort || { _id: -1 } // directQuery is {query: {...}}, sort is not top-level
                        });
                        this.tableList = inspectionResults.data;
                        this.total = inspectionResults.countnum;
                    }
                } else { // 标准查询，不涉及 material_process_flow 查找
                    let finalQuery = directQuery.query ? { ...directQuery } : { query: {} }; // Ensure 'query' property exists
                    finalQuery.page = this.currentPage;
                    finalQuery.skip = (this.currentPage - 1) * this.pageSize;
                    finalQuery.limit = this.pageSize;
                    finalQuery.sort = { _id: -1 }; 
                    finalQuery.count = true;
                    finalQuery.populate = JSON.stringify([{ path: 'machineId' }, { path: 'processId' }]);
                    
                    const result = await getData("InspectionLastData", finalQuery);
                    this.tableList = result.data;
                    this.total = result.countnum;
                }
            } catch (error) {
                console.error('获取数据失败:', error);
                this.$message.error('获取数据失败');
                this.tableList = []; // 出错时清空数据
                this.total = 0;
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
        handleDelete(row) {
            this.$confirm('确认要删除该检测数据吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData('InspectionLastData', row._id);
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
        showHistory(row) {
            this.historyCurrentPage = 1;
            this.dataForm = row;
            this.fetchHistoryData(row.scanCode);
            this.historyDialogVisible = true;
        },
        async fetchHistoryData(scanCode) {
            this.historyListLoading = true;
            try {
                const result = await getData("InspectionData", {
                    query: {
                        scanCode: scanCode
                    },
                    populate: JSON.stringify([{ path: 'machineId' }, { path: 'processId' }]),
                    skip: (this.historyCurrentPage - 1) * this.historyPageSize,
                    limit: this.historyPageSize,
                    count: true
                });
                this.historyTableList = result.data;
                this.historyTotal = result.countnum;
            } catch (error) {
                console.error('获取历史数据失败:', error);
                this.$message.error('获取历史数据失败');
            } finally {
                this.historyListLoading = false;
            }
        },
        historyTableHandleCurrentChange(currentPage) {
            this.historyCurrentPage = currentPage;
            this.fetchHistoryData(this.dataForm.scanCode);
        },
        historyTableHandleSizeChange(pageSize) {
            this.historyPageSize = pageSize;
            this.fetchHistoryData(this.dataForm.scanCode);
        },
        async handleExport() {
            this.exportLoading = true;
            this.exportProgress = 0;
            this.exportDialogVisible = true;
            let overallProgress = 0;

            try {
                const { directQuery, scanCodes: resolvedScanCodes } = await this.resolvedSearchParameters();

                let materialFlowStagePercentage = 0;
                if (resolvedScanCodes !== null) { // 物料、销售订单或流程状态筛选已激活
                    materialFlowStagePercentage = 0.3; 
                    overallProgress = materialFlowStagePercentage * 100;
                    this.exportProgress = Math.round(overallProgress);
                    if (resolvedScanCodes.length === 0) {
                        this.$message.warning('导出操作：根据物料/销售订单筛选，未找到对应的流程条码记录，无法导出。');
                        this.exportDialogVisible = false;
                        this.exportLoading = false;
                        return;
                    }
                }
                
                let inspectionFetchPercentage = 1.0 - materialFlowStagePercentage;

                let baseReqForExport = directQuery.query ? JSON.parse(JSON.stringify(directQuery)) : { query: {} };
                delete baseReqForExport.page;
                delete baseReqForExport.skip;
                delete baseReqForExport.limit;
                delete baseReqForExport.count;

                let allInspectionData = [];
                const progressCallbackForInspection = (batchProgress) => {
                    this.exportProgress = Math.round(overallProgress + (batchProgress / 100 * inspectionFetchPercentage * 100));
                };

                if (resolvedScanCodes !== null && resolvedScanCodes.length > 0) {
                    this.$message.info(`导出操作：正在基于 ${resolvedScanCodes.length} 个条码分批导出检测数据...`);
                    allInspectionData = await this.fetchInspectionDataAdvanced(baseReqForExport, resolvedScanCodes, {
                        isPaginated: false,
                        sort: baseReqForExport.sort || { _id: -1 },
                        progressCallback: progressCallbackForInspection
                    });
                } else if (resolvedScanCodes === null) { // 没有通过物料流筛选条码，直接用 directQuery (如果有内容)
                     this.$message.info(`导出操作：正在导出所有符合直接筛选条件的检测数据...`);
                     const finalExportQuery = { 
                        ...baseReqForExport, 
                        populate: JSON.stringify([{ path: 'machineId' }, { path: 'processId' }]) 
                    };
                    const result = await getData("InspectionLastData", finalExportQuery);
                    allInspectionData = result.data || [];
                    this.exportProgress = Math.round(overallProgress + inspectionFetchPercentage * 100);
                } else { // resolvedScanCodes is [], means filters were applied but no barcodes found
                    this.$message.warning('导出操作：未找到符合条件的条码，无法导出。');
                    this.exportDialogVisible = false;
                    this.exportLoading = false;
                    return;
                }

                overallProgress = Math.round(overallProgress + inspectionFetchPercentage * 100);
                this.exportProgress = Math.min(overallProgress, 90);

                if (!allInspectionData || allInspectionData.length === 0) {
                    this.$message.warning('未找到对应的检测数据');
                    this.exportDialogVisible = false;
                    this.exportLoading = false;
                    return;
                }
                
                this.$message.info(`共找到 ${allInspectionData.length} 条检测数据，准备格式化并导出...`);

                const exportData = allInspectionData.map(item => [
                    item.scanCode,
                    item.machineId ? item.machineId.machineName : '--',
                    item.processId ? item.processId.processName : '--',
                    !item.error ? '合格' : '不合格',
                    this.formatDate(item.createTime),
                    this.inspectionDataHandle(item).join('; ')
                ]);

                this.exportProgress = 95; // 格式化完成

                // 生成动态文件名，如果用户有输入物料编码或销售订单，则包含它们
                let fileNameParts = ['检测数据'];
                if (this.searchForm.materialCode) fileNameParts.unshift(this.searchForm.materialCode);
                if (this.searchForm.saleOrderNo) fileNameParts.unshift(this.searchForm.saleOrderNo);
                if (this.searchForm.materialFlowStatus) fileNameParts.push(this.searchForm.materialFlowStatus);
                
                const filename = `${fileNameParts.join('_')}_${new Date().getTime()}`;

                import('@/vendor/Export2Excel').then(excel => {
                    excel.export_json_to_excel({
                        header: ['扫描码', '设备名称', '工序名称', '检测结果', '检测时间', '检测详情'],
                        data: exportData,
                        filename: filename,
                        autoWidth: true,
                        bookType: 'xlsx'
                    });
                    this.exportProgress = 100;
                    this.$message.success('导出成功');
                     setTimeout(() => {
                        this.exportDialogVisible = false;
                    }, 1000);
                }).catch(err => {
                    console.error("导出Excel失败:", err);
                    this.$message.error('导出Excel失败');
                    this.exportDialogVisible = false;
                });

            } catch (error) {
                console.error('导出失败:', error);
                this.$message.error('导出失败: ' + (error.message || '未知错误'));
                this.exportDialogVisible = false;
            } finally {
                this.exportLoading = false;
                 if (!this.exportDialogVisible) {
                     this.exportProgress = 0;
                }
            }
        },
        async handleExportByMaterial() {
            // 移除了物料编码必填的检查，使其行为更像 handleExport
            // if (!this.searchForm.materialCode) {
            //     this.$message.warning('请输入物料编码');
            //     return;
            // }

            this.exportLoading = true;
            this.exportProgress = 0;
            this.exportDialogVisible = true;
            let overallProgress = 0;

            try {
                // 调用 resolvedSearchParameters 来获取所有筛选条件对应的条码
                const { directQuery, scanCodes: resolvedScanCodes } = await this.resolvedSearchParameters();

                let materialFlowStagePercentage = 0;
                if (resolvedScanCodes !== null) { // 物料、销售订单或流程状态筛选已激活
                    materialFlowStagePercentage = 0.3; 
                    overallProgress = materialFlowStagePercentage * 100;
                    this.exportProgress = Math.round(overallProgress);
                    if (resolvedScanCodes.length === 0) {
                        this.$message.warning('按条件筛选：未找到对应的流程条码记录，无法导出。');
                        this.exportDialogVisible = false;
                        this.exportLoading = false;
                        return;
                    }
                } else {
                    // 如果 resolvedScanCodes 是 null，意味着用户没有通过物料编码、销售订单或流程状态筛选
                    // 对于"按物料导出"的原始意图，这可能不应该发生，或者应该提示用户至少选择一个主要筛选条件
                    // 但如果我们要使其行为像通用导出，那么这种情况是允许的，它会导出所有符合 directQuery 的数据
                    // 为保持与 resolvedSearchParameters 的一致性，如果 resolvedScanCodes 为 null，则表示不基于物料流筛选。
                    // 但对于名为 handleExportByMaterial 的函数，这可能令人困惑。 
                    // 暂时按"允许导出所有"处理，如果 resolvedScanCodes 为 null。
                    this.$message.info('未指定物料、销售订单或流程状态，将尝试导出符合其他条件的检测数据。');
                }

                let inspectionFetchPercentage = 1.0 - materialFlowStagePercentage;
                let baseReqForExport = directQuery.query ? JSON.parse(JSON.stringify(directQuery)) : { query: {} };
                delete baseReqForExport.page;
                delete baseReqForExport.skip;
                delete baseReqForExport.limit;
                delete baseReqForExport.count;

                let allInspectionData = [];
                const progressCallbackForInspection = (batchProgress) => {
                    this.exportProgress = Math.round(overallProgress + (batchProgress / 100 * inspectionFetchPercentage * 100));
                };

                if (resolvedScanCodes !== null && resolvedScanCodes.length > 0) {
                    this.$message.info(`按条件筛选导出：正在基于 ${resolvedScanCodes.length} 个条码分批导出检测数据...`);
                    allInspectionData = await this.fetchInspectionDataAdvanced(baseReqForExport, resolvedScanCodes, {
                        isPaginated: false,
                        sort: baseReqForExport.sort || { _id: -1 },
                        progressCallback: progressCallbackForInspection
                    });
                } else if (resolvedScanCodes === null) { // 没有通过物料流筛选条码，直接用 directQuery (如果有内容)
                     this.$message.info(`按条件筛选导出：正在导出所有符合直接筛选条件的检测数据...`);
                     const finalExportQuery = { 
                        ...baseReqForExport, 
                        populate: JSON.stringify([{ path: 'machineId' }, { path: 'processId' }]) 
                    };
                    const result = await getData("InspectionLastData", finalExportQuery);
                    allInspectionData = result.data || [];
                    this.exportProgress = Math.round(overallProgress + inspectionFetchPercentage * 100);
                } else { // resolvedScanCodes is [], means filters were applied but no barcodes found
                    this.$message.warning('按条件筛选导出：未找到符合条件的条码，无法导出。');
                    this.exportDialogVisible = false;
                    this.exportLoading = false;
                    return;
                }

                overallProgress = Math.round(overallProgress + inspectionFetchPercentage * 100);
                this.exportProgress = Math.min(overallProgress, 90);

                if (!allInspectionData || allInspectionData.length === 0) {
                    this.$message.warning('未找到对应的检测数据');
                    this.exportDialogVisible = false;
                    this.exportLoading = false;
                    return;
                }
                
                this.$message.info(`按条件筛选导出：共找到 ${allInspectionData.length} 条检测数据，准备格式化并导出...`);

                const exportData = allInspectionData.map(item => [
                    item.scanCode,
                    item.machineId ? item.machineId.machineName : '--',
                    item.processId ? item.processId.processName : '--',
                    !item.error ? '合格' : '不合格',
                    this.formatDate(item.createTime),
                    this.inspectionDataHandle(item).join('; ')
                ]);

                this.exportProgress = 95; // 格式化完成

                // 生成动态文件名，如果用户有输入物料编码或销售订单，则包含它们
                let fileNameParts = ['检测数据'];
                if (this.searchForm.materialCode) fileNameParts.unshift(this.searchForm.materialCode);
                if (this.searchForm.saleOrderNo) fileNameParts.unshift(this.searchForm.saleOrderNo);
                if (this.searchForm.materialFlowStatus) fileNameParts.push(this.searchForm.materialFlowStatus);
                
                const filename = `${fileNameParts.join('_')}_${new Date().getTime()}`;

                import('@/vendor/Export2Excel').then(excel => {
                    excel.export_json_to_excel({
                        header: ['扫描码', '设备名称', '工序名称', '检测结果', '检测时间', '检测详情'],
                        data: exportData,
                        filename: filename,
                        autoWidth: true,
                        bookType: 'xlsx'
                    });
                    this.exportProgress = 100;
                    this.$message.success('按条件筛选导出成功');
                     setTimeout(() => {
                        this.exportDialogVisible = false;
                    }, 1000);
                }).catch(err => {
                    console.error("按条件筛选导出Excel失败:", err);
                    this.$message.error('按条件筛选导出Excel失败');
                    this.exportDialogVisible = false;
                });

            } catch (error) {
                console.error('按条件筛选导出失败:', error);
                this.$message.error('按条件筛选导出失败: ' + (error.message || '未知错误'));
                this.exportDialogVisible = false;
            } finally {
                this.exportLoading = false;
                 if (!this.exportDialogVisible) {
                     this.exportProgress = 0;
                }
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
    
    .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        max-height: 400px;
        overflow-y: auto;
    }
}
</style>