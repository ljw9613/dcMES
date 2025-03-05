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
                        <el-form-item label="规则名称">
                            <el-input v-model="searchForm.name" placeholder="请输入规则名称" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="状态">
                            <el-select v-model="searchForm.enabled" placeholder="请选择状态" clearable style="width: 100%">
                                <el-option label="启用" :value="true" />
                                <el-option label="禁用" :value="false" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <el-button type="primary" icon="el-icon-plus" @click="handleCreate">新增规则</el-button>
                    <el-button type="danger" icon="el-icon-delete" :disabled="!selection.length"
                        @click="handleBatchDelete">批量删除</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 规则列表 -->
        <el-card class="list-container">
            <div slot="header" class="clearfix">
                <span>条码规则列表</span>
            </div>
            <el-table v-loading="listLoading" :data="rulesList" border style="width: 100%"
                @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column label="规则名称" prop="name">
                    <template slot-scope="scope">
                        <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.name }}</el-link>
                    </template>
                </el-table-column>
                <el-table-column label="描述" prop="description" />
                <el-table-column label="优先级" prop="priority" width="100" />
                <el-table-column label="状态" width="100">
                    <template slot-scope="{row}">
                        <el-tag :type="row.enabled ? 'success' : 'info'">
                            {{ row.enabled ? '启用' : '禁用' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="使用范围" width="100" v-if="hasEditPermission">
                    <template slot-scope="{row}">
                        <el-tag :type="row.isGlobal ? 'warning' : ''">
                            {{ row.isGlobal ? '全局' : '普通' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" align="center" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.createAt) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" align="center">
                    <template slot-scope="{row}">
                        <el-button type="text" size="small" @click="handleView(row)">
                            <i class="el-icon-view"></i> 查看物料列表
                        </el-button>
                        <el-button type="text" size="small" @click="handleEdit(row)">
                            <i class="el-icon-edit"></i> 编辑
                        </el-button>
                        <el-button type="text" size="small" class="delete-btn" @click="handleDelete(row)">
                            <i class="el-icon-delete"></i> 删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" :page.sync="currentPage" :limit.sync="pageSize"
                @pagination="fetchRules" />
        </el-card>

        <!-- 规则编辑对话框 -->
        <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="70%" :close-on-click-modal="false">
            <el-form ref="form" :model="currentRule" :rules="rules" label-width="120px">
                <!-- 基本信息 -->
                <el-divider content-position="left">基本信息</el-divider>
                <el-form-item label="规则名称" prop="name">
                    <el-input v-model="currentRule.name" />
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input v-model="currentRule.description" type="textarea" />
                </el-form-item>
                <el-form-item label="优先级" prop="priority">
                    <el-input-number v-model="currentRule.priority" :min="1" />
                </el-form-item>
                <el-form-item label="启用状态">
                    <el-switch v-model="currentRule.enabled" />
                </el-form-item>
                <el-form-item label="全局使用">
                    <el-switch 
                        v-model="currentRule.isGlobal"
                        active-text="全局"
                        inactive-text="普通"
                    />
                </el-form-item>

                <!-- 校验规则配置 -->
                <el-divider content-position="left">校验规则配置</el-divider>
                <div v-for="(rule, index) in currentRule.validationRules" :key="'validation-' + index" class="rule-item">
                    <el-card class="rule-card">
                        <div slot="header" class="clearfix">
                            <span>校验规则 #{{ index + 1 }}</span>
                            <el-button style="float: right; padding: 3px 0" type="text"
                                @click="removeValidationRule(index)">删除</el-button>
                        </div>

                        <el-row :gutter="20">
                            <el-col :span="8">
                                <el-form-item :label="'规则名称'" :prop="'validationRules.' + index + '.name'">
                                    <el-input v-model="rule.name" placeholder="请输入规则名称" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item :label="'执行顺序'" :prop="'validationRules.' + index + '.order'">
                                    <el-input-number v-model="rule.order" :min="1" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item label="启用状态">
                                    <el-switch v-model="rule.enabled" />
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <el-form-item :label="'校验类型'" :prop="'validationRules.' + index + '.type'">
                            <el-select v-model="rule.type" placeholder="请选择校验类型" style="width: 100%">
                                <el-option label="长度校验" value="length" />
                                <el-option label="截取校验" value="substring" />
                                <el-option label="正则校验" value="regex" />
                            </el-select>
                        </el-form-item>

                        <!-- 根据校验类型显示不同的参数配置 -->
                        <template v-if="rule.type === 'length'">
                            <el-form-item :label="'长度'" :prop="'validationRules.' + index + '.params.length'">
                                <el-input-number v-model="rule.params.length" :min="1" />
                            </el-form-item>
                        </template>

                        <template v-if="rule.type === 'substring'">
                            <el-row :gutter="20">
                                <el-col :span="8">
                                    <el-form-item :label="'起始位置'" :prop="'validationRules.' + index + '.params.start'">
                                        <el-input-number v-model="rule.params.start" :min="0" />
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item :label="'结束位置'" :prop="'validationRules.' + index + '.params.end'">
                                        <el-input-number v-model="rule.params.end" :min="0" />
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item :label="'期望值'"
                                        :prop="'validationRules.' + index + '.params.expectedValue'">
                                        <el-input v-model="rule.params.expectedValue" />
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </template>

                        <template v-if="rule.type === 'regex'">
                            <el-form-item :label="'正则表达式'" :prop="'validationRules.' + index + '.params.pattern'">
                                <el-input v-model="rule.params.pattern" />
                            </el-form-item>
                        </template>
                    </el-card>
                </div>

                <div style="margin-top: 10px;">
                    <el-button type="primary" @click="addValidationRule">添加校验规则</el-button>
                </div>

                <!-- 提取配置 -->
                <el-divider content-position="left">提取配置</el-divider>
                <div v-for="(config, configIndex) in currentRule.extractionConfigs" :key="'config-' + configIndex"
                    class="extraction-config">
                    <el-card class="config-card">
                        <div slot="header" class="clearfix">
                            <span>提取配置 #{{ configIndex + 1 }}</span>
                            <el-button style="float: right; padding: 3px 0" type="text"
                                @click="removeExtractionConfig(configIndex)">删除</el-button>
                        </div>

                        <el-form-item :label="'提取目标'" :prop="'extractionConfigs.' + configIndex + '.target'">
                            <el-select v-model="config.target" placeholder="请选择提取目标" style="width: 100%">
                                <el-option label="物料编码" value="materialCode" />
                                <el-option label="DI码" value="DI" />
                                <el-option label="关联单据" value="relatedBill" />
                            </el-select>
                        </el-form-item>

                        <!-- 提取步骤配置 -->
                        <div v-for="(step, stepIndex) in config.steps" :key="'step-' + configIndex + '-' + stepIndex"
                            class="step-item">
                            <el-card class="step-card" shadow="hover">
                                <div slot="header" class="clearfix">
                                    <span>步骤 #{{ stepIndex + 1 }}</span>
                                    <el-button style="float: right; padding: 3px 0" type="text"
                                        @click="removeExtractionStep(configIndex, stepIndex)">删除</el-button>
                                </div>

                                <el-row :gutter="20">
                                    <el-col :span="8">
                                        <el-form-item :label="'步骤名称'"
                                            :prop="'extractionConfigs.' + configIndex + '.steps.' + stepIndex + '.name'">
                                            <el-input v-model="step.name" placeholder="请输入步骤名称" />
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="8">
                                        <el-form-item :label="'执行顺序'"
                                            :prop="'extractionConfigs.' + configIndex + '.steps.' + stepIndex + '.order'">
                                            <el-input-number v-model="step.order" :min="1" />
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="8">
                                        <el-form-item label="启用状态">
                                            <el-switch v-model="step.enabled" />
                                        </el-form-item>
                                    </el-col>
                                </el-row>

                                <el-form-item :label="'提取类型'"
                                    :prop="'extractionConfigs.' + configIndex + '.steps.' + stepIndex + '.type'">
                                    <el-select v-model="step.type" placeholder="请选择提取类型" style="width: 100%">
                                        <el-option label="分割提取" value="split" />
                                        <el-option label="截取提取" value="substring" />
                                        <el-option label="正则提取" value="regex" />
                                    </el-select>
                                </el-form-item>

                                <!-- 根据提取类型显示不同的参数配置 -->
                                <template v-if="step.type === 'split'">
                                    <el-row :gutter="20">
                                        <el-col :span="12">
                                            <el-form-item :label="'分隔符'"
                                                :prop="'extractionConfigs.' + configIndex + '.steps.' + stepIndex + '.params.separator'">
                                                <el-input v-model="step.params.separator" />
                                            </el-form-item>
                                        </el-col>
                                        <el-col :span="12">
                                            <el-form-item :label="'索引'"
                                                :prop="'extractionConfigs.' + configIndex + '.steps.' + stepIndex + '.params.index'">
                                                <el-input-number v-model="step.params.index" :min="0" />
                                            </el-form-item>
                                        </el-col>
                                    </el-row>
                                </template>

                                <template v-if="step.type === 'substring'">
                                    <el-row :gutter="20">
                                        <el-col :span="12">
                                            <el-form-item :label="'起始位置'"
                                                :prop="'extractionConfigs.' + configIndex + '.steps.' + stepIndex + '.params.start'">
                                                <el-input-number v-model="step.params.start" :min="0" />
                                            </el-form-item>
                                        </el-col>
                                        <el-col :span="12">
                                            <el-form-item :label="'结束位置'"
                                                :prop="'extractionConfigs.' + configIndex + '.steps.' + stepIndex + '.params.end'">
                                                <el-input-number v-model="step.params.end" :min="0" />
                                            </el-form-item>
                                        </el-col>
                                    </el-row>
                                </template>

                                <template v-if="step.type === 'regex'">
                                    <el-row :gutter="20">
                                        <el-col :span="12">
                                            <el-form-item :label="'正则表达式'"
                                                :prop="'extractionConfigs.' + configIndex + '.steps.' + stepIndex + '.params.pattern'">
                                                <el-input v-model="step.params.pattern" />
                                            </el-form-item>
                                        </el-col>
                                        <el-col :span="12">
                                            <el-form-item :label="'捕获组索引'"
                                                :prop="'extractionConfigs.' + configIndex + '.steps.' + stepIndex + '.params.group'">
                                                <el-input-number v-model="step.params.group" :min="0" />
                                            </el-form-item>
                                        </el-col>
                                    </el-row>
                                </template>
                            </el-card>
                        </div>

                        <div style="margin-top: 10px;">
                            <el-button type="primary" @click="addExtractionStep(configIndex)">添加提取步骤</el-button>
                        </div>
                    </el-card>
                </div>

                <div style="margin-top: 10px;">
                    <el-button type="primary" @click="addExtractionConfig">添加提取配置</el-button>
                </div>

                <!-- 规则测试部分 -->
                <el-divider content-position="left">规则测试</el-divider>
                <el-form-item label="测试条码">
                    <div class="test-input-group">
                        <el-input v-model="testBarcode" placeholder="请输入要测试的条码" style="width: calc(100% - 90px)" />
                        <el-button type="primary" @click="handleTestCurrentRule" size="small" style="margin-left: 10px">
                            测试
                        </el-button>
                    </div>
                </el-form-item>

                <!-- 测试结果展示 -->
                <el-form-item v-if="testResult" label="测试结果">
                    <el-card class="test-result-card">
                        <!-- 校验结果 -->
                        <div class="test-section">
                            <h4>校验结果</h4>
                            <div v-for="(step, index) in testResult.validationSteps" :key="'validation-' + index"
                                :class="['step-result', step.matched ? 'success' : 'error']">
                                <div class="step-header">
                                    步骤 {{ index + 1 }}: {{ step.ruleName }}
                                </div>
                                <div class="step-content">
                                    <template v-if="step.matched">
                                        <i class="el-icon-success"></i> 校验通过
                                    </template>
                                    <template v-else>
                                        <i class="el-icon-error"></i> {{ step.message }}
                                    </template>
                                </div>
                            </div>
                        </div>

                        <!-- 提取结果 -->
                        <div v-if="testResult.validationPassed" class="test-section">
                            <h4>提取结果</h4>
                            <div v-for="(config, index) in testResult.extractionResults" :key="'extraction-' + index"
                                class="extraction-result">
                                <div class="result-header">
                                    {{ config.target }}
                                </div>
                                <div v-for="(step, stepIndex) in config.steps" :key="'step-' + stepIndex"
                                    class="step-result">
                                    <div class="step-header">
                                        步骤 {{ stepIndex + 1 }}: {{ step.name }}
                                    </div>
                                    <div class="step-content">
                                        中间结果: {{ step.intermediateValue }}
                                    </div>
                                </div>
                                <div class="final-result">
                                    最终结果: {{ config.finalValue }}
                                </div>
                            </div>
                        </div>
                    </el-card>
                </el-form-item>

                <div class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleSubmit">确定</el-button>
                </div>
            </el-form>
        </el-dialog>

        <!-- 物料列表弹窗 -->
        <el-dialog title="物料列表" :visible.sync="materialDialogVisible" width="60%">
            <div class="material-list-container">
                <div class="material-list-header">
                    <el-button type="primary" size="small" @click="handleAddMaterial">新增物料绑定</el-button>
                </div>

                <el-table :data="materialList" border style="width: 100%">
                    <el-table-column prop="productId.FNumber" label="物料编码" />
                    <el-table-column prop="productId.FName" label="物料名称" />
                    <el-table-column prop="productId.FUseOrgId_FName" label="使用组织" />
                    <el-table-column prop="createTime" label="创建时间" width="180">
                        <template slot-scope="scope">
                            {{ formatDate(scope.row.createTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150" align="center">
                        <template slot-scope="scope">
                            <el-button type="danger" size="mini" @click="deleteMaterial(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 新增物料绑定弹窗 -->
            <el-dialog title="新增物料绑定" :visible.sync="addMaterialDialogVisible" width="40%" append-to-body>
                <el-form :model="materialForm" ref="materialForm" label-width="100px">
                    <el-form-item label="物料选择" prop="productId">
                        <zr-select v-model="materialForm.productId" collection="k3_BD_MATERIAL"
                            :search-fields="['FNumber', 'FName']" label-key="FNumber" sub-key="_id" :multiple="false"
                            placeholder="请输入物料编码/名称搜索">
                            <template #option="{ item }">
                                <div class="item-option">
                                        <div class="item-info">
                                            <span>{{ item.FNumber }} - {{ item.FName }}</span>
                                            <el-tag size="mini" type="info">{{ item.FMATERIALID }} -{{ item.FUseOrgId_FName
                                                }}</el-tag>
                                        </div>
                                    </div>
                            </template>
                        </zr-select>
                    </el-form-item>
                </el-form>
                <div slot="footer" class="dialog-footer">
                    <el-button @click="addMaterialDialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="saveMaterial">确 定</el-button>
                </div>
            </el-dialog>
        </el-dialog>
    </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import Pagination from '@/components/Pagination'

export default {
    components: {
        Pagination
    },
    data() {
        return {
            searchForm: {
                name: '',
                enabled: ''
            },
            rulesList: [],
            total: 0,
            currentPage: 1,
            pageSize: 10,
            listLoading: true,
            dialogVisible: false,
            dialogStatus: 'create',
            dialogTitle: '',
            selection: [],
            testBarcode: '',
            testResult: null,
            currentRule: {
                name: '',
                description: '',
                priority: 1,
                enabled: true,
                isGlobal: false,
                validationRules: [],
                extractionConfigs: []
            },
            rules: {
                name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
                priority: [{ required: true, message: '请输入优先级', trigger: 'blur' }],
                'validationRules': [{ required: true, type: 'array', message: '至少添加一条校验规则', trigger: 'change' }],
                'extractionConfigs': [{ required: true, type: 'array', message: '至少添加一个提取配置', trigger: 'change' }]
            },
            listQuery: {
                page: 1,
                limit: 20,
                total: 0
            },
            materialDialogVisible: false,
            addMaterialDialogVisible: false,
            materialList: [],
            materialForm: {
                productId: ''
            },
            currentRuleId: null,

            hasEditPermission: false,
        }
    },

    created() {
        this.fetchRules()

        const roles = this.$store.getters.roles;
        if (!roles || !roles.buttonList) {
            return false;
        }
        console.log(roles.buttonList, 'roles.buttonList')
        if (roles.buttonList.includes("global_barcode_rule")) {
            this.hasEditPermission = true;
        }
    },

    methods: {
        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };

            if (this.searchForm.name) {
                req.query.$and.push({ name: { $regex: this.searchForm.name, $options: 'i' } });
            }
            if (this.searchForm.enabled !== '') {
                req.query.$and.push({ enabled: this.searchForm.enabled });
            }


            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
        },

        resetForm() {
            this.$refs.searchForm.resetFields();
            this.searchForm = {
                name: '',
                enabled: ''
            };
            this.currentPage = 1;
            this.fetchRules();
        },

        async fetchRules() {
            this.listLoading = true;
            try {
                let req = this.searchData();
                req.page = this.currentPage;
                req.skip = (this.currentPage - 1) * this.pageSize;
                req.limit = this.pageSize;
                req.count = true;
                const result = await getData("barcodeRule", req);
                this.rulesList = result.data;
                this.total = result.countnum;
            } catch (error) {
                console.error('获取规则列表失败:', error);
                this.$message.error('获取规则列表失败');
            } finally {
                this.listLoading = false;
            }
        },

        handleSelectionChange(selection) {
            this.selection = selection;
        },

        search() {
            this.currentPage = 1;
            this.fetchRules();
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

        async handleView(row) {
            this.currentRuleId = row._id;
            await this.fetchMaterialList(row._id);
            this.materialDialogVisible = true;
        },

        async fetchMaterialList(ruleId) {
            try {
                const result = await getData('productBarcodeRule', {
                    query: { barcodeRule: ruleId },
                    populate: JSON.stringify([{ path: 'productId', select: 'FNumber FName FMATERIALID FUseOrgId_FName' }])
                });
                if (result.data) {
                    this.materialList = result.data;
                }
            } catch (error) {
                console.error('获取物料列表失败:', error);
                this.$message.error('获取物料列表失败');
            }
        },

        handleAddMaterial() {
            this.materialForm = {
                productId: ''
            };
            this.addMaterialDialogVisible = true;
        },

        async saveMaterial() {
            try {
                if (!this.materialForm.productId) {
                    this.$message.warning('请选择物料');
                    return;
                }

                // 检查是否已存在相同物料绑定
                const existingMaterial = this.materialList.find(
                    item => item.productId._id === this.materialForm.productId
                );
                if (existingMaterial) {
                    this.$message.warning('该物料已绑定，请勿重复添加');
                    return;
                }

                await addData('productBarcodeRule', {
                    productId: this.materialForm.productId,
                    barcodeRule: this.currentRuleId,
                    createBy: this.$store.state.user.id
                });

                this.$message.success('物料绑定成功');
                this.addMaterialDialogVisible = false;
                await this.fetchMaterialList(this.currentRuleId);
            } catch (error) {
                console.error('保存物料绑定失败:', error);
                this.$message.error('保存物料绑定失败');
            }
        },

        async deleteMaterial(row) {
            try {
                await this.$confirm('确认解除该物料绑定吗?', '提示', {
                    type: 'warning'
                });

                await removeData('productBarcodeRule', { query: { _id: row._id } });
                this.$message.success('解除绑定成功');
                await this.fetchMaterialList(this.currentRuleId);
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('删除物料绑定失败:', error);
                    this.$message.error('删除物料绑定失败');
                }
            }
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
                    await removeData('barcodeRule', { query: { _id: { $in: ids } } });
                    this.$message.success('批量删除成功');
                    this.fetchRules();
                } catch (error) {
                    console.error('批量删除失败:', error);
                    this.$message.error('批量删除失败');
                }
            }).catch(() => { });
        },

        async handleSubmit() {
            try {
                if (this.dialogStatus === 'create') {
                    await addData('barcodeRule', this.currentRule);
                    this.$message.success('新增成功');
                } else {
                    await updateData('barcodeRule', { query: { _id: this.currentRule._id }, update: this.currentRule });
                    this.$message.success('更新成功');
                }
                this.dialogVisible = false;
                this.fetchRules();
            } catch (error) {
                console.error('操作失败:', error);
                this.$message.error('操作失败');
            }
        },

        // 创建规则
        async handleCreate() {
            this.dialogTitle = '添加规则'
            this.currentRule = this.getInitialRule()
            this.dialogVisible = true
            this.dialogStatus = 'create'
            this.testResult = null
        },

        // 编辑规则
        async handleEdit(row) {
            this.dialogTitle = '编辑规则'
            this.currentRule = JSON.parse(JSON.stringify(row))
            this.dialogStatus = 'edit'
            this.dialogVisible = true
            this.testResult = null
        },

        // 删除规则
        async handleDelete(row) {
            try {
                await this.$confirm('确认删除该规则吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })

                await removeData('barcodeRule', { query: { _id: row._id } })
                this.$message.success('删除成功')
                this.fetchRules()
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('删除失败:', error)
                    this.$message.error('删除失败')
                }
            }
        },

        // 分页处理
        handleSizeChange(val) {
            this.listQuery.limit = val
            this.fetchRules()
        },

        handleCurrentChange(val) {
            this.listQuery.page = val
            this.fetchRules()
        },

        async handleTest() {
            if (!this.testBarcode) {
                this.$message.warning('请输入测试条码');
                return;
            }

            try {
                const result = await this.validateBarcode(this.testBarcode);
                if (result) {
                    this.testResult = {
                        ruleName: result.ruleName,
                        materialCode: result.materialCode,
                        relatedBill: result.relatedBill
                    };
                } else {
                    this.testResult = null;
                    this.$message.error('未匹配到任何规则');
                }
            } catch (error) {
                console.error('测试失败:', error);
                this.$message.error('测试失败');
            }
        },

        getInitialRule() {
            return {
                name: '',
                description: '',
                priority: 1,
                enabled: true,
                isGlobal: false,
                validationRules: [],
                extractionConfigs: []
            };
        },

        // 添加新规则
        addRule() {
            this.currentRule.rules.push({
                order: this.currentRule.rules.length + 1,
                name: '',
                description: '',
                enabled: true,
                match: {
                    type: 'length',
                    value: '',
                    length: 0
                },
                extraction: {
                    target: 'materialCode',
                    method: 'split',
                    params: {
                        separator: '',
                        index: 0,
                        start: 0,
                        end: 0,
                        pattern: '',
                        group: 0
                    }
                }
            });
        },

        // 删除规则
        removeRule(index) {
            this.currentRule.rules.splice(index, 1);
            // 重新排序
            this.currentRule.rules.forEach((rule, idx) => {
                rule.order = idx + 1;
            });
        },

        // 测试规则
        async handleTestCurrentRule() {
            if (!this.testBarcode) {
                this.$message.warning('请输入测试条码');
                return;
            }

            try {
                let barcode = this.testBarcode;
                const result = {
                    validationPassed: true,
                    validationSteps: [],
                    extractionResults: []
                };

                // 执行校验规则
                for (const rule of this.currentRule.validationRules) {
                    if (!rule.enabled) continue;

                    const stepResult = {
                        ruleName: rule.name,
                        matched: false
                    };

                    switch (rule.type) {
                        case 'length':
                            if (barcode.length !== rule.params.length) {
                                stepResult.message = `长度不符合要求，应为${rule.params.length}位，当前长度为${barcode.length}位`;
                                result.validationPassed = false;
                            } else {
                                stepResult.matched = true;
                            }
                            break;

                        case 'substring':
                            const value = barcode.substring(rule.params.start, rule.params.end);
                            if (value !== rule.params.expectedValue) {
                                stepResult.message = `截取值 "${value}" 与期望值 "${rule.params.expectedValue}" 不符`;
                                result.validationPassed = false;
                            } else {
                                stepResult.matched = true;
                            }
                            break;

                        case 'regex':
                            try {
                                const regex = new RegExp(rule.params.pattern);
                                if (!regex.test(barcode)) {
                                    stepResult.message = '不符合正则表达式规则';
                                    result.validationPassed = false;
                                } else {
                                    stepResult.matched = true;
                                }
                            } catch (e) {
                                stepResult.message = '正则表达式格式错误';
                                result.validationPassed = false;
                            }
                            break;
                    }

                    result.validationSteps.push(stepResult);
                    if (!result.validationPassed) break;
                }

                // 如果校验通过，执行提取规则
                if (result.validationPassed) {
                    for (const config of this.currentRule.extractionConfigs) {
                        let currentValue = barcode;
                        const extractionResult = {
                            target: config.target,
                            steps: [],
                            finalValue: null
                        };

                        for (const step of config.steps) {
                            if (!step.enabled) continue;

                            const stepResult = {
                                name: step.name,
                                intermediateValue: null
                            };

                            switch (step.type) {
                                case 'split':
                                    const parts = currentValue.split(step.params.separator);
                                    currentValue = parts[step.params.index] || '';
                                    break;

                                case 'substring':
                                    currentValue = currentValue.substring(
                                        step.params.start,
                                        step.params.end
                                    );
                                    break;

                                case 'regex':
                                    try {
                                        const regex = new RegExp(step.params.pattern);
                                        const matches = currentValue.match(regex);
                                        if (matches && matches[step.params.group]) {
                                            currentValue = matches[step.params.group];
                                        } else {
                                            currentValue = '';
                                        }
                                    } catch (e) {
                                        currentValue = '';
                                    }
                                    break;
                            }

                            stepResult.intermediateValue = currentValue;
                            extractionResult.steps.push(stepResult);
                        }

                        extractionResult.finalValue = currentValue;
                        result.extractionResults.push(extractionResult);
                    }
                }

                this.testResult = result;

            } catch (error) {
                console.error('测试失败:', error);
                this.$message.error('测试执行失败');
            }
        },

        // 添加校验规则
        addValidationRule() {
            this.currentRule.validationRules.push({
                order: this.currentRule.validationRules.length + 1,
                name: '',
                description: '',
                enabled: true,
                type: 'length',
                params: {
                    length: 0,
                    start: 0,
                    end: 0,
                    expectedValue: '',
                    pattern: ''
                }
            });
        },

        // 删除校验规则
        removeValidationRule(index) {
            this.currentRule.validationRules.splice(index, 1);
            // 重新排序
            this.currentRule.validationRules.forEach((rule, idx) => {
                rule.order = idx + 1;
            });
        },

        // 添加提取配置
        addExtractionConfig() {
            this.currentRule.extractionConfigs.push({
                target: '',
                steps: []
            });
        },

        // 删除提取配置
        removeExtractionConfig(index) {
            this.currentRule.extractionConfigs.splice(index, 1);
        },

        // 添加提取步骤
        addExtractionStep(configIndex) {
            const config = this.currentRule.extractionConfigs[configIndex];
            config.steps.push({
                order: config.steps.length + 1,
                name: '',
                description: '',
                enabled: true,
                type: 'split',
                params: {
                    separator: '',
                    index: 0,
                    start: 0,
                    end: 0,
                    pattern: '',
                    group: 0
                }
            });
        },

        // 删除提取步骤
        removeExtractionStep(configIndex, stepIndex) {
            const config = this.currentRule.extractionConfigs[configIndex];
            config.steps.splice(stepIndex, 1);
            // 重新排序
            config.steps.forEach((step, idx) => {
                step.order = idx + 1;
            });
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

.rule-item,
.extraction-config {
    margin-bottom: 20px;
}

.step-item {
    margin-bottom: 15px;
}

.test-result-card {
    .test-section {
        margin-bottom: 20px;

        h4 {
            margin-bottom: 10px;
            color: #606266;
        }

        .step-result {
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 4px;

            &.success {
                background-color: #f0f9eb;
                border: 1px solid #e1f3d8;
            }

            &.error {
                background-color: #fef0f0;
                border: 1px solid #fde2e2;
            }

            .step-header {
                font-weight: bold;
                margin-bottom: 5px;
            }

            .step-content {
                color: #606266;
            }
        }
    }

    .extraction-result {
        margin-bottom: 15px;
        padding: 10px;
        border: 1px solid #EBEEF5;
        border-radius: 4px;

        .result-header {
            font-weight: bold;
            margin-bottom: 10px;
            color: #409EFF;
        }

        .final-result {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #EBEEF5;
            font-weight: bold;
        }
    }
}

.delete-btn {
    color: #F56C6C;

    &:hover {
        color: #f78989;
    }
}

.material-list-container {
    .material-list-header {
        margin-bottom: 15px;
    }
}

.select-option {
    .option-main {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .option-label {
            margin-right: 10px;
        }
    }
}
</style>
