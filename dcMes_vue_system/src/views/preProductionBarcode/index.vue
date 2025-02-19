<template>
    <div class="app-container">


        <!-- 搜索表单 -->
        <el-card class="filter-container">
            <div slot="header" class="clearfix">
                <span>筛选搜索</span>
            </div>
            <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="工单号">
                            <el-input v-model="searchForm.workOrderNo" placeholder="请输入工单号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="物料编码">
                            <el-input v-model="searchForm.materialNumber" placeholder="请输入物料编码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="展示条码">
                            <el-input v-model="searchForm.barcode" placeholder="请输入条码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="批次号">
                            <el-input v-model="searchForm.batchNo" placeholder="请输入批次号" clearable></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="状态">
                            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 100%">
                                <el-option label="待使用" value="PENDING" />
                                <el-option label="已使用" value="USED" />
                                <el-option label="已作废" value="VOIDED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <el-button type="primary" icon="el-icon-plus" @click="handleGenerate">批量生成</el-button>
                    <el-button type="danger" icon="el-icon-delete" :disabled="!selection.length"
                        @click="handleBatchVoid">批量作废</el-button>
                    <el-button type="success" @click="handleExport">导出数据</el-button>
                    <el-button type="primary" icon="el-icon-printer" @click="handleBatchPrint">批量打印</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 在工具栏按钮区域添加打印组件 -->
        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">预生产条码列表</i>
                    <hir-input ref="hirInput" :printData="printData" :default-template="localPrintTemplate"
                        @template-change="handleTemplateChange" />
                </div>
            </div>
        </div>

        <!-- 条码列表 -->
        <el-card class="list-container">
            <el-table v-loading="listLoading" :data="barcodeList" border style="width: 100%"
                @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column label="序号" prop="serialNumber" width="80" />
                <el-table-column label="展示条码" prop="barcode" />
                <el-table-column label="打印条码" prop="printBarcode" />
                <el-table-column label="工单号" prop="workOrderNo" />
                <el-table-column label="物料编码" prop="materialNumber" />
                <el-table-column label="物料名称" prop="materialName" />
                <el-table-column label="规则名称" prop="ruleName" />
                <el-table-column label="批次号" prop="batchNo" width="160" />
                <el-table-column label="状态" width="100">
                    <template slot-scope="{row}">
                        <el-tag :type="getStatusType(row.status)">
                            {{ getStatusText(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.createAt) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="150" align="center">
                    <template slot-scope="{row}">
                        <el-button v-if="row.status === 'PENDING'" type="text" size="small" @click="handleVoid(row)">
                            作废
                        </el-button>
                        <el-button type="text" size="small" @click="handlePrint(row)">
                            打印
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" :page.sync="currentPage" :limit.sync="pageSize"
                @pagination="fetchData" />
        </el-card>

        <!-- 批量生成对话框 -->
        <el-dialog title="批量生成条码" :visible.sync="generateDialogVisible" width="50%">
            <el-form :model="generateForm" ref="generateForm" :rules="generateRules" label-width="100px">
                <el-form-item label="工单" prop="workOrderId">
                    <el-select v-model="generateForm.workOrderId" placeholder="请选择工单" filterable style="width: 100%"
                        @change="handleWorkOrderChange">
                        <el-option v-for="item in workOrderOptions" :key="item._id" :label="item.workOrderNo"
                            :value="item._id">
                            <span>{{ item.workOrderNo }}</span>
                            <span style="float: right; color: #8492a6; font-size: 13px">
                                {{ item.materialName }}
                            </span>
                        </el-option>
                    </el-select>
                </el-form-item>

                <el-form-item label="生成数量" prop="quantity">
                    <el-input-number v-model="generateForm.quantity" :min="1" :max="maxQuantity" />
                    <span style="margin-left: 10px; color: #909399">
                        剩余可生成：{{ maxQuantity }}
                    </span>
                </el-form-item>
                <el-form-item label="起始序号" prop="startNumber">
                    <el-input-number disabled v-model="generateForm.startNumber" :min="1" />
                </el-form-item>
                <el-form-item label="批次号" prop="batchNo">
                    <el-input v-model="generateForm.batchNo" placeholder="请输入批次号" :disabled="true" />
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="generateDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitGenerate">确定生成</el-button>
            </div>
        </el-dialog>

        <!-- 作废对话框 -->
        <el-dialog title="条码作废" :visible.sync="voidDialogVisible" width="40%">
            <el-form :model="voidForm" ref="voidForm" :rules="voidRules" label-width="100px">
                <el-form-item label="作废原因" prop="reason">
                    <el-input type="textarea" v-model="voidForm.reason" :rows="3" placeholder="请输入作废原因" />
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="voidDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitVoid">确定作废</el-button>
            </div>
        </el-dialog>

        <!-- 修改批量打印对话框 -->
        <el-dialog title="批量打印" :visible.sync="batchPrintDialogVisible" width="70%">
            <div class="batch-print-container">
                <div class="print-settings">
                    <el-form :model="printSettings" label-width="100px">
                        <el-form-item label="打印数量">
                            <span>当前搜索结果共 {{ printDataList.length }} 条记录</span>
                        </el-form-item>
                        <el-form-item label="打印模板">
                            <hir-input ref="batchPrintHirInput" :print-data="currentPrintData"
                                :print-data-list="printDataList" :default-template="localPrintTemplate"
                                @template-change="handleTemplateChange" />
                        </el-form-item>
                    </el-form>
                </div>
                <div class="print-list">
                    <el-table :data="printDataList" height="400" border style="width: 100%">
                        <el-table-column type="index" label="序号" width="50" />
                        <el-table-column prop="barcode" label="条码" />
                        <el-table-column prop="workOrderNo" label="工单号" />
                        <el-table-column prop="materialNumber" label="物料编码" />
                        <el-table-column prop="materialName" label="物料名称" />
                        <el-table-column prop="batchNo" label="批次号" />
                        <el-table-column label="状态" width="100">
                            <template slot-scope="{row}">
                                <el-tag :type="getStatusType(row.status)">
                                    {{ getStatusText(row.status) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
            <div slot="footer" class="dialog-footer">
                <el-button @click="batchPrintDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="executeBatchPrint" :loading="printing">
                    开始打印
                </el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { getData, addData, updateData } from "@/api/data";
import HirInput from '@/components/hirInput'

export default {
    name: 'PreProductionBarcode',
    components: {
        HirInput
    },
    data() {
        return {
            // 搜索表单
            searchForm: {
                workOrderNo: '',
                materialNumber: '',
                barcode: '',
                status: '',
                batchNo: ''
            },

            // 列表数据
            barcodeList: [],
            listLoading: false,
            selection: [],
            total: 0,
            currentPage: 1,
            pageSize: 10,

            // 批量生成相关
            generateDialogVisible: false,
            generateForm: {
                workOrderId: '',
                startNumber: 1,
                quantity: 1,
                fieldValues: {},
                batchNo: ''
            },
            generateRules: {
                workOrderId: [{ required: true, message: '请选择工单', trigger: 'change' }],
                quantity: [{ required: true, message: '请输入生成数量', trigger: 'blur' }],
                startNumber: [{ required: true, message: '请输入起始序号', trigger: 'blur' }],
                // fieldValues 的验证规则会在 handleWorkOrderChange 中动态添加
            },
            workOrderOptions: [],
            maxQuantity: 0,
            currentWorkOrder: null,

            // 作废相关
            voidDialogVisible: false,
            voidForm: {
                ids: [],
                reason: ''
            },
            voidRules: {
                reason: [{ required: true, message: '请输入作废原因', trigger: 'blur' }]
            },
            printData: {},
            printTemplate: null,

            // 批量打印相关
            batchPrintDialogVisible: false,
            printDataList: [],
            printing: false,
            currentPrintData: {},
        }
    },

    computed: {
        localPrintTemplate: {
            get() {
                try {
                    const savedTemplate = localStorage.getItem('printTemplate_preProductionBarcode');
                    return savedTemplate ? JSON.parse(savedTemplate) : null;
                } catch (error) {
                    console.error('解析缓存模板失败:', error);
                    return null;
                }
            },
            set(value) {
                try {
                    localStorage.setItem('printTemplate_preProductionBarcode', JSON.stringify(value));
                } catch (error) {
                    console.error('保存模板到缓存失败:', error);
                }
            }
        }
    },

    created() {
        this.fetchData()

        // 加载本地缓存的打印模板
        const savedTemplate = this.localPrintTemplate;
        if (savedTemplate) {
            this.$nextTick(() => {
                if (this.$refs.hirInput) {
                    this.$refs.hirInput.handleTemplateChange(savedTemplate);
                }
            });
        }
    },

    methods: {
        // 获取状态标签类型
        getStatusType(status) {
            const statusMap = {
                'PENDING': 'info',
                'USED': 'success',
                'VOIDED': 'danger'
            }
            return statusMap[status] || 'info'
        },

        // 获取状态显示文本
        getStatusText(status) {
            const statusMap = {
                'PENDING': '待使用',
                'USED': '已使用',
                'VOIDED': '已作废'
            }
            return statusMap[status] || status
        },

        // 查询列表
        async fetchData() {
            this.listLoading = true
            try {
                const query = this.buildQuery()
                const result = await getData('preProductionBarcode', {
                    query,
                    page: this.currentPage,
                    limit: this.pageSize,
                    skip: (this.currentPage - 1) * this.pageSize,
                    sort: { createAt: -1 }, // 按创建时间倒序排序
                    count: true
                })

                this.barcodeList = result.data
                this.total = result.countnum
            } catch (error) {
                console.error('获取数据失败:', error)
                this.$message.error('获取数据失败')
            } finally {
                this.listLoading = false
            }
        },

        // 构建查询条件
        buildQuery() {
            const query = {}
            if (this.searchForm.workOrderNo) {
                query.workOrderNo = { $regex: this.searchForm.workOrderNo, $options: 'i' }
            }
            if (this.searchForm.materialNumber) {
                query.materialNumber = { $regex: this.searchForm.materialNumber, $options: 'i' }
            }
            if (this.searchForm.barcode) {
                query.barcode = { $regex: this.searchForm.barcode, $options: 'i' }
            }
            if (this.searchForm.status) {
                query.status = this.searchForm.status
            }
            if (this.searchForm.batchNo) {
                query.batchNo = { $regex: this.searchForm.batchNo, $options: 'i' }
            }
            return query
        },

        // 打开批量生成对话框
        async handleGenerate() {
            try {
                // 获取未完成的工单列表
                const result = await getData('production_plan_work_order', {
                    query: { status: { $in: ['PENDING', 'IN_PROGRESS'] } }
                })
                this.workOrderOptions = result.data

                // 生成批次号：当前时间戳
                const timestamp = new Date().getTime()
                this.generateForm.batchNo = `B${timestamp}`

                this.generateDialogVisible = true
            } catch (error) {
                console.error('获取工单列表失败:', error)
                this.$message.error('获取工单列表失败')
            }
        },

        // 工单选择变更
        async handleWorkOrderChange(workOrderId) {
            try {
                // 获取工单详情
                const workOrder = this.workOrderOptions.find(item => item._id === workOrderId);
                //获取产线编号
                const lineNum = await getData('production_line', {
                    query: { _id: workOrder.productionLineId }
                })
                workOrder.lineNum = lineNum.data[0].lineNum

                this.currentWorkOrder = workOrder;
                console.log(this.currentWorkOrder, 'this.currentWorkOrder')

                // 验证物料是否绑定了条码规则
                const ruleResult = await getData('barcodeSegmentRuleMaterial', {
                    query: {
                        materialId: workOrder.materialId,
                        enabled: true
                    }
                });

                if (!ruleResult.data || !ruleResult.data.length) {
                    this.$message.warning('该工单对应的物料未绑定条码规则，请先绑定规则');
                    this.generateForm.workOrderId = '';
                    return;
                }

                // 获取规则详情
                const ruleDetail = await getData('BarcodeSegmentRule', {
                    query: {
                        _id: ruleResult.data[0].ruleId,
                        enabled: true
                    }
                });

                if (!ruleDetail.data || !ruleDetail.data.length) {
                    this.$message.error('获取条码规则详情失败');
                    return;
                }

                const rule = ruleDetail.data[0];

                // 重置 fieldValues 对象
                this.$set(this.generateForm, 'fieldValues', {});

                // 检查并收集缺失的字段
                const missingFields = [];

                // 从工单中获取字段映射值并检查
                rule.segments.forEach(segment => {
                    if (segment.type === 'fieldMapping' && segment.config.mappingField) {
                        const fieldValue = this.currentWorkOrder[segment.config.mappingField];
                        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
                            missingFields.push({
                                field: segment.config.mappingField,
                                label: segment.config.label || segment.config.mappingField
                            });
                        } else {
                            this.$set(this.generateForm.fieldValues, segment.config.mappingField, fieldValue);
                        }
                    }
                });

                // 如果有缺失字段，显示提示并重置工单选择
                if (missingFields.length > 0) {
                    const missingFieldsStr = missingFields.map(f => f.label).join('、');
                    this.$message.warning(`工单缺少必要字段：${missingFieldsStr}，请完善工单信息后再生成条码`);
                    this.generateForm.workOrderId = '';
                    return;
                }

                // 获取已生成的条码数量和最大序号（排除已作废的）
                const [countResult, maxSerialResult] = await Promise.all([
                    getData('preProductionBarcode', {
                        query: {
                            workOrderId,
                            status: { $ne: 'VOIDED' }
                        },
                        count: true
                    }),
                    getData('preProductionBarcode', {
                        query: {
                            workOrderId,
                            status: { $ne: 'VOIDED' }
                        },
                        sort: { serialNumber: -1 },
                        limit: 1
                    })
                ]);

                // 计算剩余可生成数量
                this.maxQuantity = workOrder.planQuantity - (countResult.countnum || 0);

                // 设置起始序号为最大序号+1或1
                this.generateForm.startNumber = maxSerialResult.data && maxSerialResult.data.length > 0
                    ? maxSerialResult.data[0].serialNumber + 1
                    : 1;

                // 重置生成数量
                this.generateForm.quantity = Math.min(this.generateForm.quantity, this.maxQuantity);
            } catch (error) {
                console.error('获取工单信息失败:', error);
                this.$message.error('获取工单信息失败');
            }
        },

        // 修改 generateBarcode 方法
        async generateBarcode(rule, workOrder, serialNumber) {
            try {
                const displaySegments = [];
                const printSegments = [];

                // 确保 rule 和 segments 存在
                if (!rule || !rule.segments || !Array.isArray(rule.segments)) {
                    console.error('Invalid rule structure:', rule);
                    throw new Error('无效的条码规则结构');
                }

                // 遍历规则的每个段落
                for (const segment of rule.segments) {
                    let segmentValue = '';
                    const config = segment.config || {};

                    // 根据段落类型生成对应的值
                    switch (segment.type) {
                        case 'constant':
                            segmentValue = config.constantValue || '';
                            break;

                        case 'fieldMapping':
                            if (config.mappingField && workOrder) {
                                // 从 fieldValues 中获取值
                                const fieldValue = workOrder[config.mappingField] || '';
                                // 查找映射关系
                                if (config.fieldMappings && Array.isArray(config.fieldMappings)) {
                                    const mapping = config.fieldMappings.find(m => m && m.value === fieldValue);
                                    segmentValue = mapping ? mapping.code : fieldValue;
                                } else {
                                    segmentValue = fieldValue;
                                }
                            }
                            break;

                        case 'date':
                            const planDate = new Date();
                            let dateStr = '';

                            if (config.dateFormat) {
                                if (config.dateFormat.includes('YYYY')) {
                                    const year = planDate.getFullYear().toString();
                                    if (config.yearMappings && Array.isArray(config.yearMappings)) {
                                        const yearMapping = config.yearMappings.find(m => m && m.value === year);
                                        dateStr += yearMapping ? yearMapping.code : year;
                                    } else {
                                        dateStr += year;
                                    }
                                }

                                if (config.dateFormat.includes('MM')) {
                                    const month = (planDate.getMonth() + 1).toString().padStart(2, '0');
                                    if (config.monthMappings && Array.isArray(config.monthMappings)) {
                                        const monthMapping = config.monthMappings.find(m => m && m.value === month);
                                        dateStr += monthMapping ? monthMapping.code : month;
                                    } else {
                                        dateStr += month;
                                    }
                                }

                                if (config.dateFormat.includes('DD')) {
                                    const day = planDate.getDate().toString().padStart(2, '0');
                                    if (config.dayMappings && Array.isArray(config.dayMappings)) {
                                        const dayMapping = config.dayMappings.find(m => m && m.value === day);
                                        dateStr += dayMapping ? dayMapping.code : day;
                                    } else {
                                        dateStr += day;
                                    }
                                }
                            }

                            segmentValue = dateStr;
                            break;

                        case 'sequence':
                            // 确保序号是数字类型
                            const seqNum = parseInt(serialNumber, 10);
                            if (isNaN(seqNum)) {
                                throw new Error('无效的序号值');
                            }

                            // 将序号转换为指定长度的字符串
                            let seqStr = seqNum.toString().padStart(config.length || 1, config.padChar || '0');

                            // 如果有数字映射，应用映射规则
                            if (config.numberMappings && Array.isArray(config.numberMappings)) {
                                const digits = seqStr.split('');

                                // 对每个位置应用映射
                                for (let i = 0; i < digits.length; i++) {
                                    const position = i + 1; // 位置从1开始
                                    const digit = digits[i];

                                    // 查找当前位置的映射规则
                                    const mapping = config.numberMappings.find(m =>
                                        m && m.position === position && m.value === digit
                                    );

                                    if (mapping && mapping.code) {
                                        digits[i] = mapping.code;
                                    }
                                }

                                seqStr = digits.join('');
                            }

                            segmentValue = seqStr;
                            break;

                        default:
                            console.warn(`未知的段落类型: ${segment.type}`);
                            break;
                    }

                    // 分别处理展示条码和打印条码
                    let displayValue = segmentValue;
                    let printValue = segmentValue;

                    // 展示条码：始终显示前缀和后缀
                    if (config.prefix) {
                        displayValue = config.prefix + displayValue;
                    }
                    if (config.suffix) {
                        displayValue = displayValue + config.suffix;
                    }

                    // 打印条码：根据配置决定是否显示前缀和后缀
                    if (config.showPrefix && config.prefix) {
                        printValue = config.prefix + printValue;
                    }
                    if (config.showSuffix && config.suffix) {
                        printValue = printValue + config.suffix;
                    }

                    displaySegments.push(displayValue);
                    printSegments.push(printValue);
                }

                // 返回不同的展示条码和打印条码
                return {
                    displayBarcode: displaySegments.join(''),
                    printBarcode: printSegments.join('')
                };

            } catch (error) {
                console.error('生成条码失败:', error);
                throw new Error(`生成条码失败: ${error.message}`);
            }
        },

        // 修改 submitGenerate 方法中调用 generateBarcode 的部分
        async submitGenerate() {
            try {
                await this.$refs.generateForm.validate();

                if (this.generateForm.quantity > this.maxQuantity) {
                    this.$message.warning('生成数量超过剩余可生成数量');
                    return;
                }

                // 获取物料对应的条码规则
                const ruleResult = await getData('barcodeSegmentRuleMaterial', {
                    query: {
                        materialId: this.currentWorkOrder.materialId,
                        enabled: true
                    }
                });

                if (!ruleResult.data || !ruleResult.data.length) {
                    this.$message.error('该物料未绑定条码规则');
                    return;
                }

                // 获取完整的规则信息
                const ruleDetail = await getData('BarcodeSegmentRule', {
                    query: {
                        _id: ruleResult.data[0].ruleId,
                        enabled: true
                    }
                });

                if (!ruleDetail.data || !ruleDetail.data.length) {
                    this.$message.error('获取条码规则详情失败');
                    return;
                }

                const rule = ruleDetail.data[0];

                // 构建条码记录
                const barcodes = [];
                for (let i = 0; i < this.generateForm.quantity; i++) {
                    try {
                        const serialNumber = this.generateForm.startNumber + i;
                        const barcodeResult = await this.generateBarcode(
                            rule,
                            {
                                ...this.currentWorkOrder,
                                ...this.generateForm.fieldValues
                            },
                            serialNumber
                        );

                        if (!barcodeResult.displayBarcode) {
                            throw new Error('生成的条码为空');
                        }

                        barcodes.push({
                            workOrderId: this.generateForm.workOrderId,
                            workOrderNo: this.currentWorkOrder.workOrderNo,
                            materialId: this.currentWorkOrder.materialId,
                            materialNumber: this.currentWorkOrder.materialNumber,
                            materialName: this.currentWorkOrder.materialName,
                            ruleId: rule._id,
                            ruleName: rule.name,
                            ruleCode: rule.code,
                            barcode: barcodeResult.displayBarcode, // 展示用条码
                            printBarcode: barcodeResult.printBarcode, // 打印用条码
                            serialNumber,
                            batchNo: this.generateForm.batchNo,
                            status: 'PENDING',
                            creator: this.$store.state.user.name,
                            createAt: new Date()
                        });
                    } catch (error) {
                        console.error(`生成第 ${i + 1} 个条码时出错:`, error);
                        throw error;
                    }
                }

                // 检查条码是否已存在（排除已作废的）
                const existingBarcodes = await getData('preProductionBarcode', {
                    query: {
                        barcode: { $in: barcodes.map(item => item.barcode) },
                        status: { $ne: 'VOIDED' }
                    }
                });

                if (existingBarcodes.data && existingBarcodes.data.length > 0) {
                    // 获取重复的条码详情
                    const duplicates = existingBarcodes.data.map(item => ({
                        barcode: item.barcode,
                        workOrderNo: item.workOrderNo,
                        serialNumber: item.serialNumber,
                        status: item.status
                    }));

                    console.error('重复的条码:', duplicates);
                    this.$message.error(`存在重复的条码，请调整起始序号。重复条码: ${duplicates.map(d => d.barcode).join(', ')}`);
                    return;
                }

                await addData('preProductionBarcode', barcodes);
                this.$message.success(`成功生成 ${barcodes.length} 个条码`);

                // 重置生成表单和相关数据
                this.resetGenerateForm();
                // 关闭弹窗
                this.generateDialogVisible = false;
                // 刷新列表
                this.fetchData();

            } catch (error) {
                console.error('生成条码失败:', error);
                this.$message.error('生成条码失败: ' + error.message);
            }
        },

        // 添加重置方法
        resetGenerateForm() {
            // 重置表单数据
            this.generateForm = {
                workOrderId: '',
                quantity: 1,
                startNumber: 1,
                batchNo: '',
                fieldValues: {}
            };

            // 清除工单相关信息
            this.currentWorkOrder = null;

            // 重置表单验证
            if (this.$refs.generateForm) {
                this.$refs.generateForm.resetFields();
            }
        },

        // 作废条码
        handleVoid(row) {
            this.voidForm.ids = [row._id]
            this.voidDialogVisible = true
        },

        // 批量作废
        handleBatchVoid() {
            const pendingBarcodes = this.selection.filter(item => item.status === 'PENDING')
            if (!pendingBarcodes.length) {
                this.$message.warning('请选择待使用的条码进行作废')
                return
            }
            this.voidForm.ids = pendingBarcodes.map(item => item._id)
            this.voidDialogVisible = true
        },

        // 提交作废
        async submitVoid() {
            try {
                await this.$refs.voidForm.validate()

                await updateData('preProductionBarcode', {
                    query: { _id: { $in: this.voidForm.ids } },
                    update: {
                        status: 'VOIDED',
                        voidReason: this.voidForm.reason,
                        voidBy: this.$store.state.user.name,
                        voidAt: new Date()
                    }
                })

                this.$message.success('作废成功')
                this.voidDialogVisible = false
                this.fetchData()
            } catch (error) {
                console.error('作废失败:', error)
                this.$message.error('作废失败')
            }
        },

        // 导出数据
        async handleExport() {
            try {
                const query = this.buildQuery()
                const result = await getData('preProductionBarcode', {
                    query,
                    sort: { serialNumber: 1 },
                    limit: 100000
                })

                const data = result.data.map(item => ({
                    '序号': item.serialNumber,
                    '条码': item.barcode,
                    '工单号': item.workOrderNo,
                    '物料编码': item.materialNumber,
                    '物料名称': item.materialName,
                    '规则名称': item.ruleName,
                    '批次号': item.batchNo,
                    '状态': this.getStatusText(item.status),
                    '创建时间': this.formatDate(item.createAt),
                    '作废原因': item.voidReason || '',
                    '作废人': item.voidBy || '',
                    '作废时间': item.voidAt ? this.formatDate(item.voidAt) : ''
                }))

                // 使用 xlsx 导出
                const ws = XLSX.utils.json_to_sheet(data)
                const wb = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(wb, ws, '预生产条码')
                XLSX.writeFile(wb, '预生产条码数据.xlsx')
            } catch (error) {
                console.error('导出失败:', error)
                this.$message.error('导出失败')
            }
        },

        // 其他辅助方法
        formatDate(date) {
            if (!date) return ''
            return new Date(date).toLocaleString()
        },

        handleSelectionChange(selection) {
            this.selection = selection
        },

        search() {
            this.currentPage = 1
            this.fetchData()
        },

        resetForm() {
            this.$refs.searchForm.resetFields()
            this.searchForm = {
                workOrderNo: '',
                materialNumber: '',
                barcode: '',
                status: '',
                batchNo: ''
            }
            this.currentPage = 1
            this.fetchData()
        },

        handlePrint(row) {
            let printData = { ...row };
            printData.createAt = this.formatDate(row.createAt);
            // 使用打印条码进行打印
            printData.printBarcodeText = row.printBarcode.substring(row.printBarcode.length - 13) // 截取后13位
            this.printData = printData;
            console.log(this.printData)
            this.$nextTick(() => {
                this.$refs.hirInput.handlePrints();
            });
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

        // 处理每页显示数量变化
        handleSizeChange(val) {
            this.pageSize = val
            this.fetchData()
        },

        // 处理页码变化
        handleCurrentChange(val) {
            this.currentPage = val
            this.fetchData()
        },

        // 处理批量打印按钮点击
        async handleBatchPrint() {
            this.printing = false;
            this.printDataLoading = true;
            try {
                // 获取当前搜索条件下的所有数据
                const query = this.buildQuery();
                const result = await getData('preProductionBarcode', {
                    query,
                    sort: { createAt: -1 },
                    limit: 1000
                });

                if (!result.data || result.data.length === 0) {
                    this.$message.warning('没有可打印的数据');
                    return;
                }

                // 处理打印数据
                this.printDataList = result.data.map(item => ({
                    ...item,
                    createAt: this.formatDate(item.createAt),
                    printBarcodeText: item.printBarcode.substring(item.printBarcode.length - 13) // 截取后13位
                }));

                // 重置分页
                this.printCurrentPage = 1;

                // 设置第一条数据作为模板预览数据
                this.currentPrintData = this.printDataList[0];

                // 如果有本地存储的模板，使用存储的模板
                if (this.localPrintTemplate) {
                    this.printTemplate = this.localPrintTemplate;
                }

                // 显示打印对话框
                this.batchPrintDialogVisible = true;
            } catch (error) {
                console.error('获取打印数据失败:', error);
                this.$message.error('获取打印数据失败');
            } finally {
                this.printDataLoading = false;
            }
        },

        // 修改 executeBatchPrint 方法
        async executeBatchPrint() {
            if (!this.printDataList.length) {
                this.$message.warning('没有可打印的数据');
                return;
            }

            if (!this.printTemplate) {
                this.$message.warning('请先设置打印模板');
                return;
            }

            this.printing = true;
            try {
                // 准备打印数据列表
                const printList = this.printDataList.map(data => ({
                    ...data,
                    createAt: this.formatDate(data.createAt),
                    printBarcodeText: data.printBarcode.substring(data.printBarcode.length - 13)
                }));

                // 使用 hirInput 组件的批量打印方法
                await this.$nextTick();
                if (this.$refs.batchPrintHirInput) {
                    // 使用浏览器打印
                    await this.$refs.batchPrintHirInput.handleBatchPrint();
                    this.$message.success('浏览器打印完成');
                    this.batchPrintDialogVisible = false;
                } else {
                    throw new Error('打印组件未初始化');
                }
            } catch (error) {
                console.error('批量打印失败:', error);
                this.$message.error('批量打印失败: ' + error.message);
            } finally {
                this.printing = false;
            }
        },
    }
}
</script>

<style lang="scss" scoped>
.app-container {
    padding: 20px;

    .filter-container {
        margin-bottom: 20px;
    }

    .list-container {
        margin-bottom: 20px;
    }

    .pagination-container {
        margin-top: 20px;
        text-align: right;
    }
}

.el-tag {
    min-width: 70px;
    text-align: center;
}

.dialog-footer {
    text-align: right;
}

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

.el-icon-tickets {
    line-height: 30px;
}

.batch-print-container {
    .print-settings {
        margin-bottom: 20px;
        padding: 15px;
        background-color: #f5f7fa;
        border-radius: 4px;
    }

    .print-list {
        margin-top: 20px;
    }
}

.dialog-footer {
    text-align: right;
    margin-top: 20px;
}
</style>