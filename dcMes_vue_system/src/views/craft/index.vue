<template>
    <div class="app-container">
        <!-- 搜索表单 -->
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
                        <el-form-item label="工艺名称">
                            <el-input v-model="searchForm.craftName" placeholder="请输入工艺名称" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="工艺编码">
                            <el-input v-model="searchForm.craftCode" placeholder="请输入工艺编码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="创建日期">
                            <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd"
                                style="width: 100%">
                            </el-date-picker>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="工艺类型">
                            <el-select v-model="searchForm.craftType" placeholder="请选择工艺类型" clearable
                                style="width: 100%">
                                <el-option label="标准工艺" value="STANDARD_PROCESS" />
                                <el-option label="制具工艺" value="TOOL_MAKING_TECHNOLOGY" />
                                <el-option label="辅材工艺" value="AUXILIARY_MATERIAL_TECHNOLOGY" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="工艺状态">
                            <el-select v-model="searchForm.status" placeholder="请选择工艺状态" clearable style="width: 100%">
                                <el-option label="创建" value="CREATE" />
                                <el-option label="启用" value="ENABLE" />
                                <el-option label="作废" value="VOID" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="生产阶级">
                            <el-select v-model="searchForm.productStage" placeholder="请选择生产阶级" clearable
                                style="width: 100%">
                                <el-option label="SMT" value="SMT" />
                                <el-option label="DIP" value="DIP" />
                                <el-option label="ASSEMPLY" value="ASSEMPLY" />
                                <el-option label="PACK" value="PACK" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="是否标准">
                            <el-select v-model="searchForm.isStandard" placeholder="请选择是否标准" clearable
                                style="width: 100%">
                                <el-option label="是" :value="true" />
                                <el-option label="否" :value="false" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 工艺列表 -->
        <div class="screen1">
            <div class="screen_content_first">
                <i class="el-icon-tickets">工艺管理列表</i>
                <el-button type="primary" @click="handleAdd">新增工艺</el-button>
            </div>
        </div>

        <base-table ref="craftTable" :currentPage="craftTableData.currentPage" :pageSize="craftTableData.pageSize"
            :tableData="craftTableData.tableList" :tableDataloading="craftTableData.listLoading"
            :total="craftTableData.total" @handleCurrentChange="handleCraftTableCurrentChange"
            :cell-style="{ textAlign: 'center' }" @handleSizeChange="handleCraftTableSizeChange">
            <template slot="law">
                <el-table-column label="工艺名称" prop="craftName" />
                <el-table-column label="工艺编码" prop="craftCode" />
                <el-table-column label="工艺描述" prop="craftDesc" />
                <el-table-column label="工艺类型" prop="craftType" />
                <el-table-column label="产品型号" prop="productName" />
                <el-table-column label="创建人" prop="createBy" />
                <el-table-column label="创建时间" prop="createAt" />
                <el-table-column label="状态">
                    <template slot-scope="scope">
                        <el-tag :type="getStatusType(scope.row.status)">
                            {{ getStatusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" width="150">
                    <template slot-scope="scope">
                        <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button type="text" size="small" @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <!-- 新增/编辑工艺弹窗 -->
        <el-dialog :close-on-click-modal="false" :title="dialogStatus === 'create' ? '新增工艺' : '编辑工艺'"
            :visible.sync="dialogFormVisible" width="70%">
            <el-form ref="craftForm" :model="craftForm" :rules="rules" label-width="100px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="生产阶级" prop="productStage">
                            <el-select v-model="craftForm.productStage" placeholder="请选择生产阶级" style="width: 100%">
                                <el-option label="SMT" value="SMT" />
                                <el-option label="DIP" value="DIP" />
                                <el-option label="ASSEMPLY" value="ASSEMPLY" />
                                <el-option label="PACK" value="PACK" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="工艺类型" prop="craftType">
                            <el-select v-model="craftForm.craftType" placeholder="请选择工艺类型" clearable
                                style="width: 100%">
                                <el-option label="标准工艺" value="STANDARD_PROCESS" />
                                <el-option label="制具工艺" value="TOOL_MAKING_TECHNOLOGY" />
                                <el-option label="辅材工艺" value="AUXILIARY_MATERIAL_TECHNOLOGY" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="工艺名称" prop="craftName">
                            <el-input v-model="craftForm.craftName" placeholder="请输入工艺名称"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="工艺编码" prop="craftCode">
                            <el-input v-model="craftForm.craftCode" placeholder="请输入工艺编码"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="选择物料" prop="selectedMaterial">
                            <el-select v-model="craftForm.selectedMaterial" placeholder="请选择物料" filterable remote
                                :remote-method="handleRemoteSearch" :loading="materialLoading"
                                @change="handleCraftMaterialChange" style="width: 100%">
                                <el-option v-for="item in materialOptions" :key="item._id"
                                    :label="`${item.FNumber} - ${item.FName}`" :value="item._id">
                                    <span>{{ item.FNumber }} - {{ item.FName }}</span>
                                    <span style="float: right; color: #8492a6; font-size: 13px">{{ item.FSpecification
                                        || '无规格'
                                        }}</span>
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="组件名称" prop="componentName">
                            <el-input v-model="craftForm.componentName" placeholder="组件名称" disabled></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="工艺描述" prop="craftDesc">
                            <el-input v-model="craftForm.craftDesc" placeholder="请输入工艺描述"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="产品型号" prop="productName">
                            <el-input v-model="craftForm.productName" placeholder="产品型号" disabled></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="业务类型" prop="businessType">
                            <el-input v-model="craftForm.businessType" placeholder="请输入业务类型"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <!-- 工序列表 -->
            <div class="screen1">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">工序管理列表</i>
                    <el-button type="primary" @click="handleAddProcess">新增工序</el-button>
                </div>
            </div>

            <base-table ref="processTable" :currentPage="processTableData.currentPage"
                :pageSize="processTableData.pageSize" :tableData="processTableData.tableList"
                :tableDataloading="processTableData.listLoading" :total="processTableData.total"
                :cell-style="{ textAlign: 'center' }" @handleCurrentChange="handleProcessTableCurrentChange"
                @handleSizeChange="handleProcessTableSizeChange">
                <template slot="law">
                    <el-table-column label="工序编码" prop="processCode" width="150" align="center" />
                    <el-table-column label="工序描述" prop="processDesc" align="center" />
                    <el-table-column label="工序次序" prop="sort" width="150" align="center" />
                    <el-table-column label="工序类型" prop="processType" width="150" align="center" />
                    <el-table-column label="状态" align="center">
                        <template slot-scope="scope">
                            <el-tag :type="getStatusType(scope.row.status)">
                                {{ getStatusText(scope.row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" fixed="right" width="150">
                        <template slot-scope="scope">
                            <el-button type="text" size="small" @click="handleEditProcess(scope.row)">编辑</el-button>
                            <el-button type="text" size="small" @click="handleDeleteProcess(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </template>
            </base-table>

            <div slot="footer" class="dialog-footer">
                <el-button @click="dialogFormVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitForm">确 定</el-button>
            </div>
        </el-dialog>

        <!-- 新增工序弹窗 -->
        <el-dialog :close-on-click-modal="false" title="新增工序" :visible.sync="processDialogVisible" width="60%"
            append-to-body>
            <el-form ref="processForm" :model="processForm" :rules="processRules" label-width="100px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="生产阶级" prop="processStage">
                            <el-select v-model="processForm.processStage" placeholder="请选择生产阶级" style="width: 100%">
                                <el-option label="SMT" value="SMT" />
                                <el-option label="DIP" value="DIP" />
                                <el-option label="ASSEMPLY" value="ASSEMPLY" />
                                <el-option label="PACK" value="PACK" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="工序类型" prop="processType">
                            <el-select v-model="processForm.processType" placeholder="请选择工序类型" style="width: 100%">
                                <el-option label="标准工艺" value="STANDARD_PROCESS" />
                                <el-option label="制具工艺" value="TOOL_MAKING_TECHNOLOGY" />
                                <el-option label="辅材工艺" value="AUXILIARY_MATERIAL_TECHNOLOGY" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="工序名称" prop="processName">
                            <el-input v-model="processForm.processName" placeholder="请输入工序名称"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="工序编码" prop="processCode">
                            <el-input v-model="processForm.processCode" placeholder="请输入工序编码"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="工序描述" prop="processDesc">
                            <el-input v-model="processForm.processDesc" placeholder="请输入工序描述"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="业务类型" prop="businessType">
                            <el-input v-model="processForm.businessType" placeholder="请输入业务类型"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="工序状态" prop="status">
                            <el-select v-model="processForm.status" placeholder="请选择工序状态" style="width: 100%">
                                <el-option label="创建" value="CREATE" />
                                <el-option label="启用" value="ENABLE" />
                                <el-option label="作废" value="VOID" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="工序次序" prop="sort">
                            <el-input-number v-model="processForm.sort" :min="1" placeholder="请输入工序次序"
                                style="width: 100%"></el-input-number>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <!-- 工序列表 -->
            <div class="screen1">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">物料管理列表</i>
                    <el-button type="primary" @click="handleAddMaterial">新增物料</el-button>
                </div>
            </div>

            <base-table ref="materialTable" :currentPage="materialTableData.currentPage"
                :pageSize="materialTableData.pageSize" :tableData="materialTableData.tableList"
                :tableDataloading="materialTableData.listLoading" :total="materialTableData.total"
                @handleCurrentChange="handleMaterialTableCurrentChange"
                @handleSizeChange="handleMaterialTableSizeChange" :cell-style="{ textAlign: 'center' }">
                <template slot="law">
                    <el-table-column label="物料编码" prop="materialCode">
                        <template slot-scope="scope">
                            <span style="color: #ff4949">*</span>
                            {{ scope.row.materialCode }}
                        </template>
                    </el-table-column>
                    <el-table-column label="物料名称" prop="materialName">
                        <template slot-scope="scope">
                            <span style="color: #ff4949">*</span>
                            {{ scope.row.materialName }}
                        </template>
                    </el-table-column>
                    <el-table-column label="规格型号" prop="specification">
                        <template slot-scope="scope">
                            <span style="color: #ff4949">*</span>
                            {{ scope.row.specification }}
                        </template>
                    </el-table-column>
                    <el-table-column label="物料用量" prop="quantity" />
                    <el-table-column label="单位" prop="unit" />
                    <el-table-column label="扫码操作" prop="scanOperation">
                        <template slot-scope="scope">
                            <el-switch v-model="scope.row.scanOperation" :active-value="true" :inactive-value="false"
                                disabled>
                            </el-switch>
                        </template>
                    </el-table-column>
                    <el-table-column label="是否组件" prop="isComponent">
                        <template slot-scope="scope">
                            <el-switch v-model="scope.row.isComponent" :active-value="true" :inactive-value="false"
                                disabled>
                            </el-switch>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" fixed="right" width="150">
                        <template slot-scope="scope">
                            <el-button type="text" size="small" @click="handleEditMaterial(scope.row)">编辑</el-button>
                            <el-button type="text" size="small" @click="handleDeleteMaterial(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </template>
            </base-table>

            <div slot="footer" class="dialog-footer">
                <el-button @click="processDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitProcessForm">确 定</el-button>
            </div>
        </el-dialog>
        <!-- 物料对话框 -->
        <el-dialog :close-on-click-modal="false" :title="materialDialog.title" :visible.sync="materialDialog.visible"
            :before-close="materialDialog.beforeClose" width="50%" append-to-body>
            <el-form ref="materialForm" :model="materialForm" :rules="materialRules" label-width="100px">
                <el-row :gutter="20">
                    <el-col :span="24">
                        <el-form-item label="选择物料" prop="materialId">
                            <el-select v-model="materialForm.materialId" placeholder="请选择物料" filterable remote
                                :remote-method="getMaterialList" :loading="materialDialog.loading"
                                @change="handleMaterialChange" style="width: 100%">
                                <el-option v-for="item in materialOptions" :key="item._id"
                                    :label="`${item.FNumber} - ${item.FName}`" :value="item._id">
                                    <span>{{ item.FNumber }} - {{ item.FName }}</span>
                                    <span style="float: right; color: #8492a6; font-size: 13px">
                                        {{ item.FSpecification || '无规格' }}
                                    </span>
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="物料编码" prop="materialCode">
                            <el-input disabled v-model="materialForm.materialCode" placeholder="请输入物料编码" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="物料名称" prop="materialName">
                            <el-input disabled v-model="materialForm.materialName" placeholder="请输入物料名称" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="规格型号" prop="specification">
                            <el-input disabled v-model="materialForm.specification" placeholder="请输入规格型号" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="物料用量" prop="quantity">
                            <el-input-number v-model="materialForm.quantity" :min="0" :precision="2" :step="1"
                                style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="单位">
                            <el-select v-model="materialForm.unit" placeholder="请选择单位" style="width: 100%">
                                <el-option label="个" value="个" />
                                <el-option label="件" value="件" />
                                <el-option label="套" value="套" />
                                <el-option label="米" value="米" />
                                <el-option label="千克" value="千克" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="扫码操作">
                            <el-switch v-model="materialForm.scanOperation" :active-value="true"
                                :inactive-value="false">
                            </el-switch>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="是否组件">
                            <el-switch v-model="materialForm.isComponent" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="materialDialog.visible = false">取 消</el-button>
                <el-button type="primary" :loading="materialDialog.loading" @click="submitMaterialForm">确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";

export default {
    name: 'CraftManagement',
    dicts: ['product_type'],
    data() {
        return {
            // 临时ID
            tempCraftId: '',    // 临时工艺ID
            tempProcessId: '',  // 临时工序ID

            // 工艺表单数据
            craftForm: {
                _id: '',           // 临时工艺ID
                businessType: '',  // 业务类型
                craftCode: '',     // 工艺编号
                craftName: '',     // 工艺名称
                craftVersion: '',  // 工艺版本号
                productId: '',     // 关联产品ID
                craftType: '',     // 工艺类型
                craftDesc: '',     // 工艺描述
                materialId: '',    // 物料ID
                craftParams: [],   // 工艺参数
                processSteps: [],  // 工序步骤ID数组
                productStage: '',  // 生产阶级
                attachments: [],   // 附件文档路径
                remark: '',        // 备注
                status: 'CREATE',  // 状态
                isStandard: '0',   // 是否标准工艺
                selectedMaterial: '', // 新增物料选择字段
                componentName: '', // 组件名称
                productName: '',   // 产品型号
            },
            // 工艺表单验证规则
            rules: {
                craftCode: [
                    { required: true, message: '请输入工艺编号', trigger: 'blur' }
                ],
                craftName: [
                    { required: true, message: '请输入工艺名称', trigger: 'blur' }
                ],
                craftType: [
                    { required: true, message: '请选择工艺类型', trigger: 'change' }
                ]
            },
            // 工序表单数据
            processForm: {
                _id: '',           // 临时工序ID
                craftId: '',       // 关联工艺ID
                processCode: '',   // 工序编码  
                processName: '',   // 工序名称
                processDesc: '',   // 工序描述
                processStage: '',  // 生产阶级
                processType: '',   // 工序类型
                businessType: '',  // 业务类型
                status: 'CREATE',  // 状态
                materials: [],     // 工序物料清单
                remark: '',        // 备注
                sort: 1            // 工序次序
            },

            // 工序表单验证规则
            processRules: {
                processName: [
                    { required: true, message: '请输入工序名称', trigger: 'blur' }
                ],
                processCode: [
                    { required: true, message: '请输入工序编码', trigger: 'blur' }
                ],
                processStage: [
                    { required: true, message: '请选择生产阶级', trigger: 'change' }
                ],
                processType: [
                    { required: true, message: '请选择工序类型', trigger: 'change' }
                ],
                sort: [
                    { required: true, message: '请输入工序次序', trigger: 'blur' },
                    { type: 'number', min: 1, message: '工序次序必须大于0', trigger: 'blur' }
                ]
            },

            // 物料表单数据
            materialForm: {
                craftId: '',       // 关联工艺ID
                processStepId: '', // 工序步骤ID
                materialId: '',    // 物料ID
                materialCode: '',   // 物料编码
                materialName: '',   // 物料名称
                specification: '',  // 规格型号
                quantity: null,    // 用量
                unit: '',          // 单位
                isKey: '0',      // 是否关键物料
                remark: '',        // 备注
                scanOperation: false, // 扫码操作
                isComponent: '0' // 是否组件
            },
            //物料表单验证规则
            materialRules: {
                materialCode: [
                    { required: true, message: '请输入物料编码', trigger: 'blur' }
                ],
                materialName: [
                    { required: true, message: '请输入物料名称', trigger: 'blur' }
                ],
                specification: [
                    { required: true, message: '请输入规格型号', trigger: 'blur' }
                ]
            },
            // 表格数据
            craftTableData: {
                tableList: [],
                total: 0,
                currentPage: 1,
                pageSize: 10,
                listLoading: false
            },

            processTableData: {
                tableList: [],
                total: 0,
                currentPage: 1,
                pageSize: 10,
                listLoading: false
            },

            materialTableData: {
                tableList: [],
                total: 0,
                currentPage: 1,
                pageSize: 10,
                listLoading: false
            },

            // 弹窗控制
            dialogFormVisible: false,
            processDialogVisible: false,
            materialDialogVisible: false,
            dialogStatus: 'create',
            materialDialogStatus: 'create', // 新增状态标记
            editingMaterialId: null,       // 正在编辑的物料ID





            // 搜索表单数据
            searchForm: {
                craftName: '',        // 工艺名称 (原 FName)
                craftCode: '',        // 工艺编码 (原 FNumber) 
                dateRange: [],        // 日期范围
                craftType: '',        // 工艺类型
                status: '',          // 工艺状态 (原 FDocumentStatus)
                productName: '',      // 产品型号 (原 FProductType)
                productStage: '',     // 生产阶级
                isStandard: '',       // 是否标准工艺
            },

            // 是否显示高级搜索
            showAdvanced: false,
            materialOptions: [], // 物料选项列表
            materialLoading: false, // 物料加载状态

            // 编辑物料对话框数据
            materialDialog: {
                visible: false,
                title: '新增物料',
                loading: false,
                beforeClose: (done) => {
                    // 清空表单数据
                    this.materialForm = {
                        materialId: '',
                        materialCode: '',
                        materialName: '',
                        specification: '',
                        quantity: 1,
                        unit: '个',
                        scanOperation: false,
                        isComponent: false
                    };
                    // 清空物料选项
                    this.materialOptions = [];
                    // 重置表单验证
                    if (this.$refs.materialForm) {
                        this.$refs.materialForm.resetFields();
                    }
                    done();
                }
            },
            materialForm: {
                materialId: '',
                materialCode: '',
                materialName: '',
                specification: '',
                quantity: 1,
                unit: '个',
                scanOperation: false,
                isComponent: false
            },
            materialOptions: [],
            materialRules: {
                materialId: [
                    { required: true, message: '请选择物料', trigger: 'change' }
                ],
                quantity: [
                    { required: true, message: '请输入用量', trigger: 'blur' },
                    { type: 'number', min: 0, message: '用量必须大于0', trigger: 'blur' }
                ]
            },
            searchDebounce: null,
            processOperationType: 'create', // 新增: 'create', 编辑: 'edit'
        }
    },
    methods: {
        // ================ 工艺相关方法 ================
        async fetchCraftData() {
            this.craftTableData.listLoading = true;
            try {
                let req = this.searchData();
                req.page = this.craftTableData.currentPage;
                req.limit = this.craftTableData.pageSize;
                const result = await getData("craft", req);
                this.craftTableData.tableList = result.data;
                this.craftTableData.total = result.countnum;
            } catch (error) {
                console.error('获取工艺数据失败:', error);
                this.$message.error('获取工艺数据失败');
            } finally {
                this.craftTableData.listLoading = false;
            }
        },

        handleAdd() {
            this.tempCraftId = this.ObjectId();  // 生成临时工艺ID
            this.dialogStatus = 'create';
            this.dialogFormVisible = true;
            this.craftForm = {
                _id: this.tempCraftId,
                businessType: '',
                craftCode: '',
                craftName: '',
                craftVersion: '',
                productId: '',
                craftType: '',
                craftDesc: '',
                materialId: '',
                craftParams: [],
                processSteps: [],
                productStage: '',
                attachments: [],
                remark: '',
                status: 'CREATE',
                isStandard: '0',
                selectedMaterial: '',
            };
            // 重置工序列表
            this.processTableData.tableList = [];
            this.processTableData.total = 0;
        },

        async handleEdit(row) {
            // 先设置基本状态，确保弹窗能够显示
            this.dialogStatus = 'edit';
            this.dialogFormVisible = true;
            this.tempCraftId = row._id;

            try {
                // 基础数据复制
                this.craftForm = JSON.parse(JSON.stringify(row));

                // 如果存在materialId，初始化物料选项
                if (this.craftForm.materialId) {
                    try {
                        const result = await getData('k3_BD_MATERIAL', {
                            query: { _id: this.craftForm.materialId }
                        });
                        if (result.data && result.data.length > 0) {
                            this.materialOptions = result.data;
                            this.craftForm.selectedMaterial = this.craftForm.materialId;
                        }
                    } catch (error) {
                        console.error('获取物料数据失败:', error);
                        this.$message.warning('获取物料数据失败，但可以继续编辑其他信息');
                    }
                }

                // 加载关联的工序数据
                await this.fetchProcessData();

            } catch (error) {
                console.error('初始化编辑数据失败:', error);
                this.$message.error('初始化编辑数据失败');
            }
        },

        handleDelete(row) {
            this.$confirm('确认要删除该工艺吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData('craft', { query: { _id: row._id } });
                    this.$message.success('删除成功');
                    this.fetchCraftData();
                } catch (error) {
                    console.error('删除失败:', error);
                    this.$message.error('删除失败');
                }
            }).catch(() => {
                this.$message.info('已取消删除');
            });
        },

        handleCraftTableCurrentChange(currentPage) {
            this.craftTableData.currentPage = currentPage;
            this.fetchCraftData();
        },

        handleCraftTableSizeChange(pageSize) {
            this.craftTableData.pageSize = pageSize;
            this.craftTableData.currentPage = 1;
            this.fetchCraftData();
        },

        submitForm() {
            this.$refs.craftForm.validate(async (valid) => {
                if (valid) {
                    try {
                        // 检查是否选择了物料
                        if (!this.craftForm.selectedMaterial) {
                            this.$message.warning('请选择物料');
                            return;
                        }

                        // 获取所有工序的ID数组
                        const processSteps = this.processTableData.tableList.map(process => process._id);

                        const craftData = {
                            ...this.craftForm,
                            materialId: this.craftForm.selectedMaterial,
                            processSteps: processSteps
                        };

                        // 删除不需要的字段
                        delete craftData.selectedMaterial;

                        if (this.dialogStatus === 'create') {
                            // 新增操作
                            craftData.createBy = this.$store.getters.name;
                            await addData('craft', craftData);
                            this.$message.success('添加成功');
                        } else {
                            // 更新操作
                            craftData.updateBy = this.$store.getters.name;
                            const updateReq = {
                                query: { _id: this.tempCraftId },
                                update: craftData
                            };
                            await updateData('craft', updateReq);
                            this.$message.success('更新成功');
                        }

                        this.dialogFormVisible = false;
                        this.fetchCraftData();
                    } catch (error) {
                        console.error('操作失败:', error);
                        this.$message.error('操作失败');
                    }
                }
            });
        },
        // ================ 工序相关方法 ================
        async fetchProcessData() {
            this.processTableData.listLoading = true;
            try {
                const craftId = this.craftForm._id;
                if (!craftId) return;

                let req = {
                    query: {
                        craftId: craftId
                    },
                    page: this.processTableData.currentPage,
                    limit: this.processTableData.pageSize
                };
                const result = await getData("processStep", req);
                this.processTableData.tableList = result.data;
                this.processTableData.total = result.countnum;
            } catch (error) {
                console.error('获取工序数据失败:', error);
                this.$message.error('获取工序数据失败');
            } finally {
                this.processTableData.listLoading = false;
            }
        },

        handleAddProcess() {
            if (!this.tempCraftId) {
                this.$message.warning('工艺ID不存在');
                return;
            }
            this.processOperationType = 'create'; // 设置为新增操作
            this.tempProcessId = this.ObjectId();  // 生成临时工序ID
            this.processDialogVisible = true;
            this.processForm = {
                _id: this.tempProcessId,
                craftId: this.tempCraftId,
                stepNo: null,
                stepName: '',
                stepDesc: '',
                standardTime: null,
                equipment: '',
                materials: [],
                status: 'CREATE',
                remark: '',
                sort: 1
            };
            // 重置物料列表
            this.materialTableData.tableList = [];
            this.materialTableData.total = 0;
        },

        handleEditProcess(row) {
            if (!row || !row._id) {
                this.$message.error('无效的工序数据');
                return;
            }

            this.processOperationType = 'edit'; // 设置为编辑操作
            this.processDialogVisible = true;
            this.tempProcessId = row._id;
            this.processForm = JSON.parse(JSON.stringify(row));
            this.fetchMaterialData(); // 加载关联的物料数据
        },

        handleDeleteProcess(row) {
            this.$confirm('确认要删除该工序吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData('processStep', { query: { _id: row._id } });
                    this.$message.success('删除成功');
                    this.fetchProcessData();
                } catch (error) {
                    console.error('删除失败:', error);
                    this.$message.error('删除失败');
                }
            });
        },

        handleProcessTableCurrentChange(currentPage) {
            this.processTableData.currentPage = currentPage;
            this.fetchProcessData();
        },

        handleProcessTableSizeChange(pageSize) {
            this.processTableData.pageSize = pageSize;
            this.processTableData.currentPage = 1;
            this.fetchProcessData();
        },

        submitProcessForm() {
            this.$refs.processForm.validate(async (valid) => {
                if (valid) {
                    try {
                        // 获取当前物料列表的ID数组
                        const materialIds = this.materialTableData.tableList.map(material => material._id.toString());
                        if (materialIds.length === 0) {
                            this.$message.warning('请先添加物料');
                            return;
                        }

                        // 构建工序数据
                        const processData = {
                            ...this.processForm,
                            craftId: this.tempCraftId,
                            materials: materialIds,
                        };

                        if (this.processOperationType === 'create') {
                            // 新增操作
                            processData._id = this.tempProcessId;
                            processData.createBy = this.$store.getters.name;
                            await addData('processStep', processData);
                            this.$message.success('添加成功');
                        } else {
                            // 编辑操作
                            processData.updateBy = this.$store.getters.name;
                            const updateReq = {
                                query: { _id: this.tempProcessId },
                                update: processData
                            };
                            await updateData('processStep', updateReq);
                            this.$message.success('更新成功');
                        }

                        // 关闭弹窗并刷新数据
                        this.processDialogVisible = false;
                        await this.fetchProcessData();

                    } catch (error) {
                        console.error('操作失败:', error);
                        this.$message.error('操作失败: ' + error.message);
                    }
                } else {
                    this.$message.warning('请填写必填项');
                    return false;
                }
            });
        },
        // ================ 物料相关方法 ================
        async fetchMaterialData() {
            this.materialTableData.listLoading = true;
            try {
                const processId = this.processForm._id;
                if (!processId) return;

                let req = {
                    query: {
                        processStepId: processId
                    },
                    page: this.materialTableData.currentPage,
                    limit: this.materialTableData.pageSize
                };
                const result = await getData("processMaterials", req);
                this.materialTableData.tableList = result.data;
                this.materialTableData.total = result.countnum;
            } catch (error) {
                console.error('获取物料数据失败:', error);
                this.$message.error('获取物料数据失败');
            } finally {
                this.materialTableData.listLoading = false;
            }
        },

        handleAddMaterial() {
            this.materialDialog.title = '新增物料'
            this.materialDialog.visible = true
            this.$nextTick(() => {
                this.$refs.materialForm.resetFields()
            })
        },

        async handleEditMaterial(row) {
            if (!row || !row._id) {
                this.$message.error('无效的物料数据');
                return;
            }

            this.materialDialog.title = '编辑物料';
            this.materialDialog.visible = true;
            this.editingMaterialId = row._id; // 保存正在编辑的物料ID

            // 填充表单数据
            this.materialForm = {
                materialId: row.materialId,
                materialCode: row.materialCode,
                materialName: row.materialName,
                specification: row.specification,
                quantity: row.quantity,
                unit: row.unit || '个',
                scanOperation: row.scanOperation ? true : false,
                isComponent: row.isComponent
            };

            // 初始化物料选项
            this.materialOptions = [{
                _id: row.materialId,
                FNumber: row.materialCode,
                FName: row.materialName,
                FSpecification: row.specification
            }];
        },

        handleDeleteMaterial(row) {
            console.log("row", row);

            if (!row || !row._id) {
                this.$message.error('无效的物料数据');
                return;
            }

            this.$confirm('确认要删除该物料吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData('processMaterials', { query: { _id: row._id } });
                    this.$message.success('删除成功');
                    this.fetchMaterialData();
                } catch (error) {
                    console.error('删除失败:', error);
                    this.$message.error('删除失败: ' + error.message);
                }
            });
        },

        handleMaterialTableCurrentChange(currentPage) {
            this.materialTableData.currentPage = currentPage;
            this.fetchMaterialData();
        },

        handleMaterialTableSizeChange(pageSize) {
            this.materialTableData.pageSize = pageSize;
            this.materialTableData.currentPage = 1;
            this.fetchMaterialData();
        },

        submitMaterialForm() {
            this.$refs.materialForm.validate(async (valid) => {
                if (valid) {
                    try {
                        // 再次验证物料是否重复（防止并发操作）
                        const isDuplicate = this.materialTableData.tableList.some(
                            item => item.materialId === this.materialForm.materialId
                        );

                        if (isDuplicate) {
                            this.$message.warning('该物料已经被选择，请选择其他物料');
                            return;
                        }

                        if (this.materialForm.materialId === this.craftForm.materialId) {
                            this.$message.warning('不能选择与工艺相同的物料');
                            return;
                        }

                        // 继续原有的提交逻辑
                        await this.$refs.materialForm.validate();
                        this.materialDialog.loading = true;

                        const materialData = {
                            craftId: this.tempCraftId,
                            processStepId: this.tempProcessId,
                            materialId: this.materialForm.materialId,
                            materialCode: this.materialForm.materialCode,
                            materialName: this.materialForm.materialName,
                            specification: this.materialForm.specification,
                            quantity: this.materialForm.quantity,
                            unit: this.materialForm.unit,
                            scanOperation: this.materialForm.scanOperation,
                            isComponent: this.materialForm.isComponent,
                            createBy: this.$store.getters.name
                        };

                        if (this.materialDialog.title === '新增物料') {
                            materialData._id = this.ObjectId();
                            await addData('processMaterials', materialData);
                        } else {
                            let updateReq = {
                                query: { _id: this.editingMaterialId },
                                update: materialData
                            }
                            await updateData('processMaterials', updateReq);
                        }

                        this.$message.success('操作成功');
                        this.materialDialog.visible = false;
                        this.fetchMaterialData();
                    } catch (error) {
                        console.error('提交失败:', error);
                        this.$message.error('提交失败');
                    } finally {
                        this.materialDialog.loading = false;
                    }
                }
            });
        },

        // ================ 其他通用方法 ================
        toggleAdvanced() {
            this.showAdvanced = !this.showAdvanced;
        },

        resetForm() {
            // 重置表单数据
            this.searchForm = {
                craftName: '',        // 工艺名称
                craftCode: '',        // 工艺编码
                dateRange: [],        // 日期范围
                craftType: '',        // 工艺类型
                status: '',          // 工艺状态
                productName: '',      // 产品型号
                productStage: '',     // 生产阶级
                isStandard: '',       // 是否标准工艺
            };

            // 重置表单验证
            this.$refs.searchForm.resetFields();

            // 重置分页到第一页
            this.craftTableData.currentPage = 1;

            // 重新获取数据
            this.fetchCraftData();
        },

        search() {
            this.craftTableData.currentPage = 1;
            this.fetchCraftData();
        },

        searchData() {
            const searchData = {};

            // 添加非空字段到查询条件
            if (this.searchForm.craftName) {
                searchData.craftName = { $regex: this.searchForm.craftName, $options: 'i' };
            }
            if (this.searchForm.craftCode) {
                searchData.craftCode = { $regex: this.searchForm.craftCode, $options: 'i' };
            }
            if (this.searchForm.craftType) {
                searchData.craftType = this.searchForm.craftType;
            }
            if (this.searchForm.status) {
                searchData.status = this.searchForm.status;
            }
            if (this.searchForm.productName) {
                searchData.productName = { $regex: this.searchForm.productName, $options: 'i' };
            }
            if (this.searchForm.productStage) {
                searchData.productStage = this.searchForm.productStage;
            }
            if (this.searchForm.isStandard !== '') {
                searchData.isStandard = this.searchForm.isStandard;
            }

            // 处理日期范围
            if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
                searchData.createAt = {
                    $gte: new Date(this.searchForm.dateRange[0]),
                    $lte: new Date(this.searchForm.dateRange[1] + ' 23:59:59')
                };
            }

            return { query: searchData };
        },

        getStatusType(status) {
            const statusMap = {
                'CREATE': 'info',
                'ENABLE': 'success',
                'VOID': 'danger'
            };
            return statusMap[status] || 'info';
        },

        getStatusText(status) {
            const statusMap = {
                'CREATE': '创建',
                'ENABLE': '启用',
                'VOID': '作废'
            };
            return statusMap[status] || '未知';
        },
        // ObjectId生成函数
        ObjectId() {
            const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
            const machineId = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
            const processId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0');
            const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
            const id = timestamp + machineId + processId + counter;
            // 确保生成的ID是24位的十六进制字符串
            return id.substring(0, 24);
        },
        // 获取物料列表
        async getMaterialList(query) {
            this.materialLoading = true;
            try {
                let queryCondition = {};

                // 构建基础查询条件
                if (query === '' && this.craftForm.selectedMaterial) {
                    queryCondition = { _id: this.craftForm.selectedMaterial };
                } else if (query !== '') {
                    queryCondition = {
                        $or: [
                            { FNumber: { $regex: query, $options: 'i' } },
                            { FName: { $regex: query, $options: 'i' } }
                        ]
                    };
                } else {
                    this.materialOptions = [];
                    return;
                }

                // 添加排除条件
                const excludeMaterialIds = [];

                // 1. 排除工艺级别已选择的物料
                if (this.craftForm.materialId) {
                    excludeMaterialIds.push(this.craftForm.materialId);
                }

                // 2. 排除当前工序中已选择的物料
                if (this.materialTableData.tableList && this.materialTableData.tableList.length > 0) {
                    excludeMaterialIds.push(...this.materialTableData.tableList.map(item => item.materialId));
                }

                // 如果有需要排除的物料ID，添加到查询条件中
                if (excludeMaterialIds.length > 0) {
                    queryCondition._id = {
                        $nin: excludeMaterialIds
                    };
                }

                const result = await getData('k3_BD_MATERIAL', {
                    query: queryCondition,
                    page: 1,
                    limit: 20
                });

                this.materialOptions = result.data;
            } catch (error) {
                console.error('获取物料列表失败:', error);
                this.$message.error('获取物料列表失败');
            } finally {
                this.materialLoading = false;
            }
        },
        // 处理工艺表单的物料选择变更
        handleCraftMaterialChange(materialId) {
            const selectedMaterial = this.materialOptions.find(item => item._id === materialId);
            if (selectedMaterial) {
                // 更新工艺表单中的相关字段
                this.craftForm.materialId = selectedMaterial._id;
                this.craftForm.componentName = selectedMaterial.FName || '';
                this.craftForm.productName = selectedMaterial.FSpecification || '';
                // 保持selectedMaterial的值，用于表单验证
                this.craftForm.selectedMaterial = materialId;
            }
        },
        // 处理物料表单的物料选择变更
        handleMaterialChange(materialId) {
            // 验证是否已经选择过该物料
            const isDuplicate = this.materialTableData.tableList.some(
                item => item.materialId === materialId
            );

            if (isDuplicate) {
                this.$message.warning('该物料已经被选择，请选择其他物料');
                this.materialForm.materialId = '';
                return;
            }

            // 验证是否与工艺级物料重复
            if (materialId === this.craftForm.materialId) {
                this.$message.warning('不能选择与工艺相同的物料');
                this.materialForm.materialId = '';
                return;
            }

            // 如果验证通过，继续原有的处理逻辑
            const selectedMaterial = this.materialOptions.find(item => item._id === materialId);
            if (selectedMaterial) {
                this.materialForm.materialCode = selectedMaterial.FNumber;
                this.materialForm.materialName = selectedMaterial.FName;
                this.materialForm.specification = selectedMaterial.FSpecification || '';
            }
        },


        // 添加防抖方法
        handleRemoteSearch(query) {
            if (this.searchDebounce) {
                clearTimeout(this.searchDebounce);
            }
            this.searchDebounce = setTimeout(() => {
                this.getMaterialList(query);
            }, 300);
        }
    },
    created() {
        this.fetchCraftData();
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
    align-items: center;
    justify-content: space-between;
}

.el-icon-tickets {
    line-height: 30px;
}
</style>