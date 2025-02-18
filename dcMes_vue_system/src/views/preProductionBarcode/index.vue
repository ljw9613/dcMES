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
                        <el-form-item label="条码">
                            <el-input v-model="searchForm.barcode" placeholder="请输入条码" clearable></el-input>
                        </el-form-item>
                    </el-col>
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
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 条码列表 -->
        <el-card class="list-container">
            <div slot="header" class="clearfix">
                <span>预生产条码列表</span>
            </div>
            <el-table v-loading="listLoading" :data="barcodeList" border style="width: 100%"
                @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column label="序号" prop="serialNumber" width="80" />
                <el-table-column label="条码" prop="barcode" />
                <el-table-column label="工单号" prop="workOrderNo" />
                <el-table-column label="物料编码" prop="materialNumber" />
                <el-table-column label="物料名称" prop="materialName" />
                <el-table-column label="规则名称" prop="ruleName" />
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
                        <el-button type="text" size="small" @click="handleDetail(row)">
                            详情
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
    </div>
</template>

<script>
import { getData, addData, updateData } from "@/api/data";

export default {
    name: 'PreProductionBarcode',
    data() {
        return {
            // 搜索表单
            searchForm: {
                workOrderNo: '',
                materialNumber: '',
                barcode: '',
                status: ''
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
                quantity: 1
            },
            generateRules: {
                workOrderId: [{ required: true, message: '请选择工单', trigger: 'change' }],
                startNumber: [{ required: true, message: '请输入起始序号', trigger: 'blur' }],
                quantity: [{ required: true, message: '请输入生成数量', trigger: 'blur' }]
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
            }
        }
    },

    created() {
        this.fetchData()
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
                    sort: { serialNumber: 1 }
                })
                this.barcodeList = result.data
                this.total = result.total
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
                this.currentWorkOrder = workOrder;

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

        // 生成条码
        generateBarcode(rule, workOrder, serialNumber) {
            let barcode = '';
            
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
                            // 根据字段名获取对应的值
                            const fieldValue = workOrder[config.mappingField];
                            // 查找映射关系
                            if (config.fieldMappings && Array.isArray(config.fieldMappings)) {
                                const mapping = config.fieldMappings.find(m => m && m.value === fieldValue);
                                segmentValue = mapping ? mapping.code : (fieldValue || '');
                            } else {
                                segmentValue = fieldValue || '';
                            }
                        }
                        break;
                        
                    case 'date':
                        // 使用工单的计划开始时间
                        const planDate = new Date(workOrder.planStartTime);
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
                                dateStr += day;
                            }
                        }
                        
                        segmentValue = dateStr;
                        break;
                        
                    case 'sequence':
                        // 将序号转换为指定长度的字符串
                        let seqStr = serialNumber.toString().padStart(config.length || 1, '0');
                        
                        // 如果有数字映射，应用映射规则
                        if (config.numberMappings && Array.isArray(config.numberMappings)) {
                            const digits = seqStr.split('');
                            
                            // 对每个位置应用映射
                            for (let i = 0; i < digits.length; i++) {
                                const position = i + 1; // 位置从1开始
                                const digit = digits[i];
                                
                                // 查找当前位置的映射规则
                                const mapping = config.numberMappings.find(m => 
                                    m.position === position && m.value === digit
                                );
                                
                                if (mapping) {
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
                
                // 添加前缀和后缀
                if (config.showPrefix && config.prefix) {
                    segmentValue = config.prefix + segmentValue;
                }
                if (config.showSuffix && config.suffix) {
                    segmentValue = segmentValue + config.suffix;
                }
                
                barcode += segmentValue;
            }
            
            return barcode;
        },

        // 提交生成
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

                // 修改这里：使用数组中的第一个规则
                const rule = ruleDetail.data[0];

                // 验证规则结构
                if (!rule.segments || !Array.isArray(rule.segments) || rule.segments.length === 0) {
                    this.$message.error('条码规则段落配置无效');
                    console.error('Invalid rule segments:', rule);
                    return;
                }

                // 打印规则信息以便调试
                console.log('Rule detail:', {
                    ruleId: rule._id,
                    name: rule.name,
                    code: rule.code,
                    segmentsCount: rule.segments.length,
                    segments: rule.segments.map(s => ({
                        type: s.type,
                        name: s.name,
                        config: s.config
                    }))
                });

                // 构建条码记录
                const barcodes = [];
                for (let i = 0; i < this.generateForm.quantity; i++) {
                    try {
                        const serialNumber = this.generateForm.startNumber + i;
                        const barcode = this.generateBarcode(rule, this.currentWorkOrder, serialNumber);

                        if (!barcode) {
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
                            barcode,
                            serialNumber,
                            status: 'PENDING',
                            creator: this.$store.state.user.name,
                            createAt: new Date()
                        });
                    } catch (error) {
                        console.error(`生成第 ${i + 1} 个条码时出错:`, error);
                        console.error('当前规则:', rule);
                        console.error('当前工单:', this.currentWorkOrder);
                        console.error('当前序号:', this.generateForm.startNumber + i);
                        throw error;
                    }
                }

                // 检查条码是否已存在（排除已作废的）
                const existingBarcodes = await getData('preProductionBarcode', {
                    query: { 
                        barcode: { $in: barcodes.map(item => item.barcode) },
                        status: { $ne: 'VOIDED' }  // 排除已作废的条码
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
                this.$message.success('条码生成成功');
                this.generateDialogVisible = false;
                this.fetchData();
            } catch (error) {
                console.error('生成条码失败:', error);
                this.$message.error('生成条码失败: ' + error.message);
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
            this.search()
        }
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
}

.el-tag {
    min-width: 70px;
    text-align: center;
}

.dialog-footer {
    text-align: right;
}
</style>