<template>
    <div class="app-container">
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

        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">条码规则列表</i>
                </div>
            </div>
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
            <el-table-column label="创建时间" align="center" width="160">
                <template slot-scope="scope">
                    {{ formatDate(scope.row.createAt) }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center">
                <template slot-scope="{row}">
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

        <!-- 规则编辑对话框 -->
        <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="60%">
            <el-form ref="form" :model="currentRule" :rules="rules" label-width="120px">
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

                <el-form-item label="匹配类型" prop="conditions.type">
                    <el-select v-model="currentRule.conditions.type">
                        <el-option label="分隔符匹配" value="separator" />
                        <el-option label="长度匹配" value="length" />
                        <el-option label="正则匹配" value="regex" />
                    </el-select>
                </el-form-item>

                <!-- 根据匹配类型显示不同的配置项 -->
                <el-form-item v-if="currentRule.conditions.type === 'separator'" label="分隔符"
                    prop="conditions.separator">
                    <el-input v-model="currentRule.conditions.separator" />
                </el-form-item>

                <el-form-item v-if="currentRule.conditions.type === 'length'" label="条码长度" prop="conditions.length">
                    <el-input-number v-model="currentRule.conditions.length" :min="1" />
                </el-form-item>

                <el-form-item v-if="currentRule.conditions.type === 'length'" label="附加正则校验">
                    <el-switch v-model="currentRule.conditions.enableRegex" />
                </el-form-item>

                <el-form-item v-if="currentRule.conditions.type === 'length' && currentRule.conditions.enableRegex" 
                    label="正则表达式" prop="conditions.additionalRegex">
                    <el-input v-model="currentRule.conditions.additionalRegex" />
                    <div class="el-form-item__description">在长度匹配的基础上进行额外的正则校验</div>
                </el-form-item>

                <el-form-item v-if="currentRule.conditions.type === 'regex'" label="正则表达式" prop="conditions.regex">
                    <el-input v-model="currentRule.conditions.regex" />
                </el-form-item>

                <!-- 物料编码提取规则 -->
                <el-divider content-position="left">物料编码提取规则</el-divider>

                <el-form-item label="提取方式" prop="extraction.materialCode.type">
                    <el-select v-model="currentRule.extraction.materialCode.type">
                        <el-option label="分割提取" value="split" />
                        <el-option label="截取提取" value="substring" />
                        <el-option label="DI码提取" value="di" />
                    </el-select>
                </el-form-item>

                <!-- 根据提取方式显示不同的配置项 -->
                <el-form-item v-if="currentRule.extraction.materialCode.type === 'split'" label="分割索引"
                    prop="extraction.materialCode.index">
                    <el-input-number v-model="currentRule.extraction.materialCode.index" :min="0" />
                </el-form-item>

                <template v-if="currentRule.extraction.materialCode.type === 'substring'">
                    <el-form-item label="起始位置" prop="extraction.materialCode.start">
                        <el-input-number v-model="currentRule.extraction.materialCode.start" :min="0" />
                    </el-form-item>
                    <el-form-item label="结束位置" prop="extraction.materialCode.end">
                        <el-input-number v-model="currentRule.extraction.materialCode.end" :min="0" />
                    </el-form-item>
                </template>

                <template v-if="currentRule.extraction.materialCode.type === 'di'">
                    <el-form-item label="DI码起始位置" prop="extraction.materialCode.diPosition.start">
                        <el-input-number v-model="currentRule.extraction.materialCode.diPosition.start" :min="0" />
                    </el-form-item>
                    <el-form-item label="DI码结束位置" prop="extraction.materialCode.diPosition.end">
                        <el-input-number v-model="currentRule.extraction.materialCode.diPosition.end" :min="0" />
                    </el-form-item>
                </template>

                <!-- 关联单据提取规则 -->
                <el-divider content-position="left">关联单据提取规则</el-divider>

                <el-form-item label="提取方式" prop="extraction.relatedBill.type">
                    <el-select v-model="currentRule.extraction.relatedBill.type">
                        <el-option label="不提取" value="" />
                        <el-option label="分割提取" value="split" />
                        <el-option label="截取提取" value="substring" />
                    </el-select>
                </el-form-item>

                <!-- 根据提取方式显示不同的配置项 -->
                <template v-if="currentRule.extraction.relatedBill.type">
                    <el-form-item v-if="currentRule.extraction.relatedBill.type === 'split'" label="分割索引"
                        prop="extraction.relatedBill.index">
                        <el-input-number v-model="currentRule.extraction.relatedBill.index" :min="0" />
                    </el-form-item>

                    <template v-if="currentRule.extraction.relatedBill.type === 'substring'">
                        <el-form-item label="起始位置" prop="extraction.relatedBill.start">
                            <el-input-number v-model="currentRule.extraction.relatedBill.start" :min="0" />
                        </el-form-item>
                        <el-form-item label="结束位置" prop="extraction.relatedBill.end">
                            <el-input-number v-model="currentRule.extraction.relatedBill.end" :min="0" />
                        </el-form-item>
                    </template>
                </template>

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
                        <div class="test-result-item">
                            <span class="label">条件匹配：</span>
                            <span :class="['value', testResult.matched ? 'success' : 'error']">
                                {{ testResult.matched ? '匹配成功' : '匹配失败' }}
                            </span>
                        </div>

                        <!-- 当使用DI码提取时显示DI码信息 -->
                        <template v-if="currentRule.extraction.materialCode.type === 'di'">
                            <div class="test-result-item">
                                <span class="label">提取的DI码：</span>
                                <span class="value">{{ testResult.diCode }}</span>
                            </div>
                            <div class="test-result-item">
                                <span class="label">DI码验证：</span>
                                <span :class="['value', testResult.diValid ? 'success' : 'error']">
                                    {{ testResult.diValid ? 'DI码有效' : 'DI码无效' }}
                                </span>
                            </div>
                        </template>

                        <div v-if="testResult.matched" class="test-result-item">
                            <span class="label">物料编码：</span>
                            <span class="value">{{ testResult.materialCode || '未提取' }}</span>
                        </div>

                        <div v-if="testResult.matched && testResult.relatedBill" class="test-result-item">
                            <span class="label">关联单据：</span>
                            <span class="value">{{ testResult.relatedBill }}</span>
                        </div>

                        <div v-if="!testResult.matched" class="test-result-item">
                            <span class="label">失败原因：</span>
                            <span class="value error">{{ testResult.message }}</span>
                        </div>
                    </el-card>
                </el-form-item>

                <div class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleSubmit">确定</el-button>
                </div>
            </el-form>
        </el-dialog>

        <!-- 添加分页组件 -->
        <pagination v-show="listQuery.total > 0" :total="listQuery.total" :page.sync="listQuery.page"
            :limit.sync="listQuery.limit" @pagination="fetchRules" />

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
                conditions: {
                    type: 'separator',
                    separator: '',
                    length: 0,
                    regex: ''
                },
                extraction: {
                    materialCode: {
                        type: 'split',
                        index: 0,
                        start: 0,
                        end: 0,
                        diPosition: {
                            start: 0,
                            end: 0
                        }
                    },
                    relatedBill: {
                        type: '',
                        index: 0,
                        start: 0,
                        end: 0
                    }
                }
            },
            rules: {
                name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
                priority: [{ required: true, message: '请输入优先级', trigger: 'blur' }],
                'conditions.type': [{ required: true, message: '请选择匹配类型', trigger: 'change' }],
                'extraction.materialCode.type': [{ required: true, message: '请选择提取方式', trigger: 'change' }]
            },
            listQuery: {
                page: 1,
                limit: 20,
                total: 0
            }
        }
    },

    created() {
        this.fetchRules()
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
            return `${year}-${month}-${day}`;
        },

        handleView(row) {
            this.currentRule = JSON.parse(JSON.stringify(row));
            this.dialogTitle = '查看规则';
            this.dialogVisible = true;
        },

        async validateDICode(diCode) {
            try {
                // 取DI码对应的所有物料信息
                const response = await getData('productDiNum', {
                    query: { diNum: diCode },
                    populate: JSON.stringify([{ path: 'productId', model: 'k3_BD_MATERIAL' }])
                });

                if (response.data.length === 0) {
                    this.$message.error('该DI编码不存在本系统');
                    return { isValid: false };
                }

                // 添加空值检查,过滤掉productId为空的记录
                const possibleMaterialCodes = response.data
                    .filter(item => item.productId && item.productId.FNumber)
                    .map(item => item.productId.FNumber);

                if (possibleMaterialCodes.length === 0) {
                    this.$message.error('该DI编码未关联有效物料');
                    return { isValid: false };
                }

                // 获取当前页面的主物料和子物料编码
                const allMaterialCodes = [this.mainMaterialCode,
                ...this.processMaterials.map(m => m.materialCode)];

                // 查找匹配的物料编码
                const matchedMaterialCode = possibleMaterialCodes.find(code =>
                    allMaterialCodes.includes(code)
                );

                if (!matchedMaterialCode) {
                    this.$message.error('该DI编码对应的物料与当前工序不匹配');
                    return { isValid: false };
                }

                // 返回验证结果和匹配到的物料编码
                return {
                    isValid: true,
                    materialCode: matchedMaterialCode
                };
            } catch (error) {
                console.error('DI码验证失败:', error);
                this.$message.error('DI码验证失败');
                return { isValid: false };
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

                await removeData('barcodeRule', row._id)
                this.$message.success('删除成功')
                this.fetchRules()
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('删除失败:', error)
                    this.$message.error('删除失败')
                }
            }
        },

        // 更新规则状态
        async handleStatusChange(row) {
            try {
                await updateData('barcodeRule', row._id, {
                    enabled: row.enabled
                })
                this.$message.success('状态更新成功')
            } catch (error) {
                console.error('状态更新失败:', error)
                this.$message.error('状态更新失败')
                // 恢复原状态
                row.enabled = !row.enabled
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
                conditions: {
                    type: 'separator',
                    separator: '',
                    length: 0,
                    regex: '',
                    enableRegex: false,
                    additionalRegex: ''
                },
                extraction: {
                    materialCode: {
                        type: 'split',
                        index: 0,
                        start: 0,
                        end: 0,
                        diPosition: {
                            start: 0,
                            end: 0
                        }
                    },
                    relatedBill: {
                        type: '',
                        index: 0,
                        start: 0,
                        end: 0
                    }
                }
            };
        },

        async handleTestCurrentRule() {
            if (!this.testBarcode) {
                this.$message.warning('请输入测试条码');
                return;
            }

            try {
                const result = { matched: false };
                const barcode = this.testBarcode;

                // 条件匹配测试
                switch (this.currentRule.conditions.type) {
                    case 'separator':
                        if (!barcode.includes(this.currentRule.conditions.separator)) {
                            result.message = '条码中未包含指定的分隔符';
                            break;
                        }
                        result.matched = true;
                        break;

                    case 'length':
                        if (barcode.length !== this.currentRule.conditions.length) {
                            result.message = `条码长度不符合要求，应为${this.currentRule.conditions.length}位`;
                            break;
                        }
                        
                        if (this.currentRule.conditions.enableRegex && this.currentRule.conditions.additionalRegex) {
                            try {
                                const regex = new RegExp(this.currentRule.conditions.additionalRegex);
                                if (!regex.test(barcode)) {
                                    result.message = '条码不符合附加的正则表达式规则';
                                    break;
                                }
                            } catch (e) {
                                result.message = '附加正则表达式格式错误';
                                break;
                            }
                        }
                        
                        result.matched = true;
                        break;

                    case 'regex':
                        try {
                            const regex = new RegExp(this.currentRule.conditions.regex);
                            if (!regex.test(barcode)) {
                                result.message = '条码不符合正则表达式规则';
                                break;
                            }
                            result.matched = true;
                        } catch (e) {
                            result.message = '正则表达式格式错误';
                            break;
                        }
                        break;
                }

                // 如果条件匹配成功，尝试提取信息
                if (result.matched) {
                    // 提取物料编码
                    const extraction = this.currentRule.extraction.materialCode;
                    switch (extraction.type) {
                        case 'split':
                            const parts = barcode.split(this.currentRule.conditions.separator);
                            result.materialCode = parts[extraction.index];
                            break;

                        case 'substring':
                            result.materialCode = barcode.substring(extraction.start, extraction.end);
                            break;

                        case 'di':
                            const diCode = barcode.substring(
                                extraction.diPosition.start,
                                extraction.diPosition.end
                            );
                            // 保存提取的DI码
                            result.diCode = diCode;

                            // 注意：这里需要实际的DI码验证逻辑
                            const diResult = await this.validateDICode(diCode);
                            if (diResult.isValid) {
                                result.materialCode = diResult.materialCode;
                            } else {
                                result.matched = false;
                                result.message = 'DI码验证失败';
                            }
                            break;
                    }

                    // 提取关联单据
                    const billExtraction = this.currentRule.extraction.relatedBill;
                    if (billExtraction.type) {
                        switch (billExtraction.type) {
                            case 'split':
                                const parts = barcode.split(this.currentRule.conditions.separator);
                                result.relatedBill = parts[billExtraction.index];
                                break;

                            case 'substring':
                                result.relatedBill = barcode.substring(
                                    billExtraction.start,
                                    billExtraction.end
                                );
                                break;
                        }
                    }
                }

                console.log(result)


                this.testResult = result;

            } catch (error) {
                console.error('测试失败:', error);
                this.$message.error('测试执行失败');
            }
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

.test-result-card {
    margin-top: 10px;
}

.test-result-item {
    margin-bottom: 8px;
    line-height: 20px;

    &:last-child {
        margin-bottom: 0;
    }

    .label {
        color: #606266;
        margin-right: 8px;
        font-weight: bold;
    }

    .value {
        color: #333;

        &.success {
            color: #67C23A;
        }

        &.error {
            color: #F56C6C;
        }
    }
}
</style>
