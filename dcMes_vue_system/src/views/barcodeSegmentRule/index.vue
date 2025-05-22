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
            <el-form-item label="规则编码">
              <el-input v-model="searchForm.code" placeholder="请输入规则编码" clearable></el-input>
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
          <el-button type="primary" @click="search" >查询搜索</el-button>
          <el-button @click="resetForm" >重置</el-button>
          <el-button type="primary" icon="el-icon-plus" @click="handleCreate" v-if="$checkPermission('条码生成规则新增规则')">新增规则</el-button>
          <el-button type="danger" icon="el-icon-delete" :disabled="!selection.length"
            @click="handleBatchDelete" v-if="$checkPermission('条码生成规则批量删除')">批量删除</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 规则列表 -->
    <el-card class="list-container">
      <div slot="header" class="clearfix">
        <span>条码段落规则列表</span>
      </div>
      <el-table v-loading="listLoading" :data="rulesList" border style="width: 100%"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="规则名称" prop="name" />
        <el-table-column label="规则编码" prop="code" />
        <el-table-column label="描述" prop="description" />
        <el-table-column label="段落数量" width="100">
          <template slot-scope="{row}">
            {{ row.segments ? row.segments.length : 0 }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="{row}">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="160">
          <template slot-scope="scope">
            {{ scope.row.createAt ? formatDate(scope.row.createAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center">
          <template slot-scope="{row}">
            <el-button type="text" size="small" @click="handleEdit(row)">
              <i class="el-icon-edit"></i> 编辑
            </el-button>
            <el-button type="text" size="small" @click="handleBindMaterial(row)">
              <i class="el-icon-link"></i> 绑定物料
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
        <el-form-item label="规则编码" prop="code">
          <el-input v-model="currentRule.code" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="currentRule.description" type="textarea" />
        </el-form-item>
        <el-form-item label="总长度" prop="totalLength">
          <el-input-number v-model="currentRule.totalLength" :min="1" :precision="0" :controls="true"
            placeholder="请输入条码总长度">
          </el-input-number>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="currentRule.enabled" />
        </el-form-item>

        <!-- 段落定义 -->
        <el-divider content-position="left">段落定义</el-divider>
        <div v-for="(segment, index) in currentRule.segments" :key="index" class="segment-item">
          <el-card class="segment-card">
            <div slot="header" class="clearfix">
              <span>段落 #{{ index + 1 }}</span>
              <div style="float: right;">
                <el-button type="text" icon="el-icon-top" :disabled="index === 0"
                  @click="moveSegment(index, 'up')">上移</el-button>
                <el-button type="text" icon="el-icon-bottom" :disabled="index === currentRule.segments.length - 1"
                  @click="moveSegment(index, 'down')">下移</el-button>
                <el-button type="text" icon="el-icon-delete" @click="removeSegment(index)">删除</el-button>
              </div>
            </div>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item :label="'段落名称'" :prop="'segments.' + index + '.name'">
                  <el-input v-model="segment.name" placeholder="请输入段落名称" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="'段落类型'" :prop="'segments.' + index + '.type'">
                  <el-select v-model="segment.type" placeholder="请选择段落类型" style="width: 100%">
                    <el-option label="固定值" value="constant" />
                    <el-option label="字段映射" value="fieldMapping" />
                    <el-option label="日期" value="date" />
                    <el-option label="流水号" value="sequence" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 前缀后缀配置 -->
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="'前缀'" :prop="'segments.' + index + '.config.prefix'">
                  <el-input v-model="segment.config.prefix" placeholder="如: (01)">
                    <template slot="append">
                      <el-checkbox v-model="segment.config.showPrefix">是否打印</el-checkbox>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="'后缀'" :prop="'segments.' + index + '.config.suffix'">
                  <el-input v-model="segment.config.suffix" placeholder="如: (H1)">
                    <template slot="append">
                      <el-checkbox v-model="segment.config.showSuffix">是否打印</el-checkbox>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 根据段落类型显示不同的配置选项 -->
            <template v-if="segment.type === 'date'">
              <el-form-item :label="'日期格式'" :prop="'segments.' + index + '.config.dateFormat'">
                <el-input v-model="segment.config.dateFormat" placeholder="如: YYYYMMDD" />
              </el-form-item>

              <!-- 年份映射 -->
              <el-form-item label="年份映射">
                <el-button size="small" type="primary" @click="addMapping(segment.config.yearMappings)">添加映射</el-button>
                <el-table :data="segment.config.yearMappings" border style="margin-top: 10px">
                  <el-table-column label="实际年份" prop="value">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.value" placeholder="如: 2024" />
                    </template>
                  </el-table-column>
                  <el-table-column label="映射代码" prop="code">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.code" placeholder="如: X" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="100">
                    <template slot-scope="scope">
                      <el-button type="text"
                        @click="removeMapping(segment.config.yearMappings, scope.$index)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-form-item>

              <!-- 月份映射 -->
              <el-form-item label="月份映射">
                <el-button size="small" type="primary"
                  @click="addMapping(segment.config.monthMappings)">添加映射</el-button>
                <el-table :data="segment.config.monthMappings" border style="margin-top: 10px">
                  <el-table-column label="实际月份" prop="value">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.value" placeholder="如: 1" />
                    </template>
                  </el-table-column>
                  <el-table-column label="映射代码" prop="code">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.code" placeholder="如: A" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="100">
                    <template slot-scope="scope">
                      <el-button type="text"
                        @click="removeMapping(segment.config.monthMappings, scope.$index)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-form-item>

              <!-- 添加日期映射 -->
              <el-form-item label="日期映射">
                <el-button size="small" type="primary" @click="addMapping(segment.config.dayMappings)">添加映射</el-button>
                <el-table :data="segment.config.dayMappings" border style="margin-top: 10px">
                  <el-table-column label="实际日期" prop="value">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.value" placeholder="如: 1" />
                    </template>
                  </el-table-column>
                  <el-table-column label="映射代码" prop="code">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.code" placeholder="如: A" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="100">
                    <template slot-scope="scope">
                      <el-button type="text"
                        @click="removeMapping(segment.config.dayMappings, scope.$index)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-form-item>
            </template>

            <template v-if="segment.type === 'sequence'">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item :label="'起始值'" :prop="'segments.' + index + '.config.startValue'">
                    <el-input-number v-model="segment.config.startValue" :min="1" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item :label="'长度'" :prop="'segments.' + index + '.config.length'">
                    <el-input-number v-model="segment.config.length" :min="1" />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 填充字符配置 -->
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item :label="'填充字符'" :prop="'segments.' + index + '.config.padChar'">
                    <el-input v-model="segment.config.padChar" maxlength="1" placeholder="如：0"
                      @change="handlePadCharChange(segment)">
                      <template slot="prepend">左侧填充</template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 数字映射表格添加提示 -->
              <el-form-item label="数字映射">
                <div class="mapping-tip">注意：映射规则将应用于填充后的序列号，包括填充字符</div>
                <el-button size="small" type="primary" @click="addNumberMapping(segment.config)">添加映射</el-button>
                <el-table :data="segment.config.numberMappings" border style="margin-top: 10px">
                  <el-table-column label="位置" prop="position" width="120">
                    <template slot-scope="scope">
                      <el-input-number v-model="scope.row.position" :min="1" :max="segment.config.length"
                        placeholder="第几位" />
                    </template>
                  </el-table-column>
                  <el-table-column label="实际数字" prop="value">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.value" placeholder="如: 0" maxlength="1" />
                    </template>
                  </el-table-column>
                  <el-table-column label="映射代码" prop="code">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.code" placeholder="如: A" maxlength="1" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="100">
                    <template slot-scope="scope">
                      <el-button type="text"
                        @click="removeMapping(segment.config.numberMappings, scope.$index)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-form-item>
            </template>

            <template v-if="segment.type === 'constant'">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item :label="'固定值'" :prop="'segments.' + index + '.config.constantValue'">
                    <el-input v-model="segment.config.constantValue" placeholder="如: 01" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="值转换">
                    <el-switch v-model="segment.config.enableTransform" />
                    <template v-if="segment.config.enableTransform">
                      <el-input v-model="segment.config.transformValue" placeholder="请输入转换后的值"
                        style="width: 200px; margin-left: 10px;">
                      </el-input>
                    </template>
                  </el-form-item>
                </el-col>
              </el-row>
            </template>

            <template v-if="segment.type === 'fieldMapping'">
              <el-form-item :label="'映射字段'" :prop="'segments.' + index + '.config.mappingField'">
                <el-select v-model="segment.config.mappingField" style="width: 100%">
                  <el-option-group label="订单信息">
                    <!-- <el-option label="DI号" value="diNumber" />
                    <el-option label="工单号" value="workOrderNo" />
                    <el-option label="产品编码" value="productCode" />
                    <el-option label="批次号" value="batchNo" /> -->
                    <el-option label="客户PO号" value="custPO" />
                    <el-option label="客户行号" value="custPOLineNo" />
                  </el-option-group>
                  <el-option-group label="生产信息">
                    <!-- <el-option label="工厂" value="factory" /> -->
                    <el-option label="产线" value="lineNum" />
                  </el-option-group>
                </el-select>
              </el-form-item>

              <!-- 添加字段映射规则 -->
              <el-form-item label="映射规则">
                <el-button size="small" type="primary"
                  @click="addMapping(segment.config.fieldMappings)">添加映射</el-button>
                <el-table :data="segment.config.fieldMappings || []" border style="margin-top: 10px">
                  <el-table-column label="原始值" prop="value">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.value" placeholder="如: FACTORY01" />
                    </template>
                  </el-table-column>
                  <el-table-column label="映射代码" prop="code">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.code" placeholder="如: A" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="100">
                    <template slot-scope="scope">
                      <el-button type="text"
                        @click="removeMapping(segment.config.fieldMappings, scope.$index)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-form-item>
            </template>

          </el-card>
        </div>

        <div style="margin-top: 10px;">
          <el-button type="primary" @click="addSegment">添加段落</el-button>
        </div>

        <!-- 在规则编辑对话框中添加测试区域 -->
        <el-divider content-position="left">规则测试</el-divider>
        <div class="test-section">
          <!-- 测试参数区域 -->
          <el-card class="test-params-card">
            <div slot="header" class="clearfix">
              <span>测试参数</span>
              <el-button-group style="float: right">
                <el-button type="primary" size="small" @click="testGenerate">测试生成</el-button>
                <el-button size="small" @click="resetTest">重置</el-button>
              </el-button-group>
            </div>

            <el-form label-width="100px" class="test-params-form">
              <!-- 字段映射参数 -->
              <template v-if="hasFieldMapping">
                <div class="param-section">
                  <div class="section-title">字段映射参数</div>
                  <el-row :gutter="20">
                    <template v-for="(segment, index) in currentRule.segments">
                      <el-col :span="12" v-if="segment.type === 'fieldMapping'" :key="'field-' + index">
                        <el-form-item :label="segment.name">
                          <el-input v-model="testParams.fieldValues[segment.config.mappingField]"
                            :placeholder="`请输入${segment.name}的值`" />
                        </el-form-item>
                      </el-col>
                    </template>
                  </el-row>
                </div>
              </template>

              <!-- 日期和序列号参数 -->
              <div class="param-section">
                <div class="section-title">其他参数</div>
                <el-row :gutter="20">
                  <el-col :span="12" v-if="hasDateSegment">
                    <el-form-item label="测试日期">
                      <el-date-picker v-model="testParams.date" type="date" placeholder="选择日期" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12" v-if="hasSequence">
                    <el-form-item label="序列号">
                      <el-input-number v-model="testParams.sequence" :min="1" controls-position="right"
                        style="width: 100%" placeholder="请输入序列号" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </el-form>
          </el-card>

          <!-- 测试结果区域 -->
          <el-card class="test-result-card" v-if="testResult">
            <div slot="header" class="clearfix">
              <span>生成结果</span>
            </div>
            <div class="test-result-content">
              <div class="barcode-group">
                <div class="barcode-item">
                  <div class="barcode-label">基础条码:</div>
                  <div class="barcode-preview">{{ testResult.displayBarcode }}</div>
                </div>
                <div class="barcode-item">
                  <div class="barcode-label">基础打印条码:</div>
                  <div class="barcode-preview">{{ testResult.printBarcode }}</div>
                </div>
                <div class="barcode-item" v-if="testResult.transformed">
                  <div class="barcode-label">转换条码:</div>
                  <div class="barcode-preview">{{ testResult.transformed }}</div>
                </div>
                <div class="barcode-item" v-if="testResult.transformedPrintBarcode">
                  <div class="barcode-label">转换打印条码:</div>
                  <div class="barcode-preview">{{ testResult.transformedPrintBarcode }}</div>
                </div>
              </div>
              <el-divider content-position="left">段落明细</el-divider>
              <div class="segment-breakdown">
                <el-row v-for="(segment, index) in segmentBreakdown" :key="index" class="segment-detail">
                  <el-col :span="6" class="segment-label">{{ segment.name }}:</el-col>
                  <el-col :span="18">
                    <div class="segment-value">
                      {{ segment.value }}
                      <template v-if="segment.transformedValue">
                        → {{ segment.transformedValue }}
                      </template>
                    </div>
                    <div class="segment-info" v-if="segment.config.prefix || segment.config.suffix">
                      <small>
                        <template v-if="segment.config.prefix">
                          前缀: {{ segment.config.prefix }}
                        </template>
                        <template v-if="segment.config.prefix && segment.config.suffix"> | </template>
                        <template v-if="segment.config.suffix">
                          后缀: {{ segment.config.suffix }}
                        </template>
                      </small>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-card>
        </div>

        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </el-form>
    </el-dialog>

    <!-- 添加物料绑定对话框 -->
    <el-dialog title="绑定物料" :visible.sync="bindDialogVisible" width="70%">
      <div class="bind-material-dialog">
        <!-- 已绑定物料列表 -->
        <el-card class="bound-list">
          <div slot="header">
            <span>已绑定物料</span>
          </div>
          <el-table :data="boundMaterials" border style="width: 100%">
            <el-table-column type="index" width="50" />
            <el-table-column label="物料编码" prop="materialNumber" />
            <el-table-column label="物料名称" prop="materialName" />
            <el-table-column label="使用组织" prop="orgName" />
            <el-table-column label="创建时间" width="160">
              <template slot-scope="scope">
                {{ formatDate(scope.row.createAt) }}
              </template>
            </el-table-column>
            <el-table-column label="创建人" prop="creator" width="120" />
            <el-table-column label="操作" width="120" align="center">
              <template slot-scope="{row}">
                <el-button type="text" @click="unbindMaterial(row)" class="delete-btn">
                  解除绑定
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 新增物料绑定 -->
        <el-card class="add-material-card">
          <div slot="header">
            <span>新增物料绑定</span>
          </div>
          <el-form :model="materialForm" ref="materialForm" label-width="100px">
            <el-form-item label="物料选择" prop="materialId">
              <zr-select v-model="materialForm.materialId" collection="k3_BD_MATERIAL"
                :search-fields="['FNumber', 'FName']" label-key="FNumber" sub-key="FMATERIALID" :multiple="true"
                placeholder="请输入物料编码/名称搜索">
                <template #option="{ item }">
                  <div class="item-option">
                    <div class="item-info">
                      <span>{{ item.FNumber }} - {{ item.FName }}</span>
                      <el-tag size="mini" type="info">{{ item.FMATERIALID }} - {{ item.FUseOrgId_FName }}</el-tag>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-form>
          <div class="dialog-footer">
            <el-button @click="bindDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleBatchBind">确定绑定</el-button>
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import Pagination from '@/components/Pagination'
import { query } from "quill";

export default {
  components: {
    Pagination
  },
  data() {
    return {
      searchForm: {
        name: '',
        code: '',
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
      currentRule: {
        name: '',
        code: '',
        description: '',
        totalLength: 0,
        enabled: true,
        segments: []
      },
      rules: {
        name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
        code: [{ required: true, message: '请输入规则编码', trigger: 'blur' }],
        totalLength: [{ required: true, message: '请输入总长度', trigger: 'blur' }]
      },
      testParams: {
        date: new Date(),
        sequence: 1,
        fieldValues: {}
      },
      testResult: '',
      segmentBreakdown: [],
      materialOptions: [],
      bindDialogVisible: false,
      materialSearchForm: {
        materialNumber: '',
        materialName: ''
      },
      materialList: [],
      boundMaterials: [],
      materialSelection: [],
      materialListLoading: false,
      materialTotal: 0,
      materialPage: 1,
      materialLimit: 10,
      materialForm: {
        materialId: []
      },
      currentSegmentRule: null
    }
  },

  computed: {
    hasDateSegment() {
      return this.currentRule.segments.some(segment => segment.type === 'date')
    },
    hasFieldMapping() {
      return this.currentRule.segments.some(segment =>
        segment.type === 'fieldMapping' ||
        (segment.type === 'string' && segment.config.fieldMapping.enabled)
      )
    },
    hasSequence() {
      return this.currentRule.segments.some(segment => segment.type === 'sequence')
    }
  },

  created() {
    this.fetchRules()
  },

  methods: {
    // 获取规则列表
    async fetchRules() {
      this.listLoading = true
      try {
        const result = await getData('barcodeSegmentRule', {
          query: {},
          limit: this.pageSize,
          skip: (this.currentPage - 1) * this.pageSize,
          sort: { createAt: -1 },
          count: true
        })

        console.log('获取到的规则列表数据:', result)

        if (result.code === 200) {
          this.rulesList = result.data.map(rule => ({
            ...rule,
            totalLength: rule.totalLength || 0  // 确保列表数据中有totalLength
          }))
          this.total = result.countnum || 0
        } else {
          this.rulesList = []
          this.total = 0
        }
      } catch (error) {
        console.error('获取规则列表失败:', error)
        this.$message.error('获取规则列表失败')
        this.rulesList = []
        this.total = 0
      } finally {
        this.listLoading = false
      }
    },

    // 搜索
    search() {
      this.currentPage = 1
      this.fetchRules()
    },

    // 重置表单
    resetForm() {
      this.$refs.searchForm.resetFields()
      this.currentPage = 1
      this.fetchRules()
    },

    // 新增规则
    handleCreate() {
      this.dialogStatus = 'create'
      this.dialogTitle = '新增规则'
      this.currentRule = {
        name: '',
        code: '',
        description: '',
        totalLength: 0,  // 初始化totalLength
        enabled: true,
        segments: []
      }
      this.dialogVisible = true
    },

    // 编辑规则
    handleEdit(row) {
      this.dialogStatus = 'edit'
      this.dialogTitle = '编辑规则'
      // 深拷贝数据，确保包含totalLength字段
      this.currentRule = {
        ...JSON.parse(JSON.stringify(row)),
        totalLength: row.totalLength || 0  // 确保totalLength有值
      }
      this.dialogVisible = true
    },

    // 删除规则
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该规则吗？', '提示', {
          type: 'warning'
        })
        await removeData('barcodeSegmentRule', { _id: row._id })
        this.$message.success('删除成功')
        this.fetchRules()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          this.$message.error('删除失败')
        }
      }
    },

    // 批量删除
    async handleBatchDelete() {
      if (!this.selection.length) {
        this.$message.warning('请选择要删除的记录')
        return
      }

      try {
        await this.$confirm(`确认删除选中的 ${this.selection.length} 条记录吗？`, '提示', {
          type: 'warning'
        })
        const ids = this.selection.map(item => item._id)
        await removeData('barcodeSegmentRule', { _id: { $in: ids } })
        this.$message.success('批量删除成功')
        this.fetchRules()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量删除失败:', error)
          this.$message.error('批量删除失败')
        }
      }
    },

    // 选择变更
    handleSelectionChange(selection) {
      this.selection = selection
    },

    // 添加段落
    addSegment() {
      const newSegment = {
        name: '',
        type: 'constant',
        config: {
          prefix: '',
          suffix: '',
          showPrefix: true,
          showSuffix: true,
          constantValue: '',
          enableTransform: false,
          transformValue: '',
          mappingField: '',
          dateFormat: 'YYYY',
          yearMappings: [],
          monthMappings: [],
          dayMappings: [],
          startValue: 1,
          length: 1,
          padChar: '0',
          numberMappings: [],
          fieldMappings: []
        }
      }

      if (!this.currentRule.segments) {
        this.currentRule.segments = []
      }
      this.currentRule.segments.push(newSegment)
    },

    // 删除段落
    removeSegment(index) {
      this.currentRule.segments.splice(index, 1)
    },

    // 添加映射
    addMapping(mappings) {
      mappings.push({
        value: '',
        code: ''
      })
    },

    // 删除映射
    removeMapping(mappings, index) {
      mappings.splice(index, 1)
    },

    // 添加数字映射（带位置）
    addNumberMapping(config) {
      if (!config.numberMappings) {
        config.numberMappings = []
      }
      config.numberMappings.push({
        position: 1,
        value: config.padChar || '0',
        code: ''
      })
    },

    // 提交表单
    async handleSubmit() {
      try {
        await this.$refs.form.validate()

        // 格式化段落数据
        const formattedSegments = this.currentRule.segments.map(segment => ({
          name: segment.name,
          type: segment.type,
          config: {
            prefix: segment.config.prefix || '',
            suffix: segment.config.suffix || '',
            showPrefix: segment.config.showPrefix !== undefined ? segment.config.showPrefix : true,
            showSuffix: segment.config.showSuffix !== undefined ? segment.config.showSuffix : true,
            constantValue: segment.type === 'constant' ? (segment.config.constantValue || '') : '',
            mappingField: segment.type === 'fieldMapping' ? (segment.config.mappingField || '') : '',
            fieldMappings: segment.type === 'fieldMapping' ? (segment.config.fieldMappings || []) : [],
            dateFormat: segment.type === 'date' ? (segment.config.dateFormat || 'YYYY') : '',
            yearMappings: segment.type === 'date' ? (segment.config.yearMappings || []) : [],
            monthMappings: segment.type === 'date' ? (segment.config.monthMappings || []) : [],
            dayMappings: segment.type === 'date' ? (segment.config.dayMappings || []) : [],
            startValue: segment.type === 'sequence' ? (segment.config.startValue || 1) : 1,
            length: segment.type === 'sequence' ? (segment.config.length || 1) : 1,
            padChar: segment.type === 'sequence' ? (segment.config.padChar || '0') : '0',
            numberMappings: segment.type === 'sequence' ? (segment.config.numberMappings || []) : [],
            enableTransform: segment.type === 'constant' ? (segment.config.enableTransform || false) : false,
            transformValue: segment.type === 'constant' ? (segment.config.transformValue || '') : '',
          }
        }))

        // 确保每个segment都有完整的config结构
        const formattedRule = {
          ...this.currentRule,
          totalLength: Number(this.currentRule.totalLength) || 0,
          segments: formattedSegments
        }

        // 在发送请求前打印数据，用于调试
        console.log('Submitting rule:', formattedRule)

        if (this.dialogStatus === 'create') {
          await addData('barcodeSegmentRule', formattedRule)
          this.$message.success('新增成功')
        } else {
          await updateData('barcodeSegmentRule', {
            query: { _id: formattedRule._id },
            update: formattedRule
          })
          this.$message.success('更新成功')
        }

        this.dialogVisible = false
        this.fetchRules()
      } catch (error) {
        console.error('保存失败:', error)
        this.$message.error('保存失败：' + (error.message || '未知错误'))
      }
    },

    // 格式化日期
    formatDate(date, format = 'YYYY-MM-DD') {
      if (!date) return ''
      if (!format) return ''

      try {
        const d = new Date(date)
        if (isNaN(d.getTime())) return ''

        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')

        let result = format
          .replace('YYYY', year)
          .replace('MM', month)
          .replace('DD', day)

        return result
      } catch (error) {
        console.error('日期格式化错误:', error)
        return ''
      }
    },

    async testGenerate() {
      try {
        const barcode = await this.generateBarcode(this.currentRule, this.testParams)
        this.testResult = barcode.result
        this.segmentBreakdown = barcode.breakdown
      } catch (error) {
        this.$message.error(error.message || '生成失败')
      }
    },

    resetTest() {
      this.testParams = {
        date: new Date(),
        sequence: 1,
        fieldValues: {}
      }
      this.testResult = ''
      this.segmentBreakdown = []
    },

    async generateBarcode(rule, params) {
      try {
        const segments = [];
        const displayValues = [];
        const basicPrintValues = [];
        const transformedValues = [];
        const transformedPrintValues = [];
        let hasTransform = false;

        for (const segment of rule.segments) {
          const segmentResult = await this.generateSegmentValue(segment, params);

          // 保存原始值用于显示明细
          segments.push({
            name: segment.name,
            value: segmentResult.basic,
            transformedValue: segmentResult.transformed,
            config: segment.config
          });

          // 基础值处理
          let baseValue = segmentResult.basic;
          let displayValue = baseValue;
          let basicPrintValue = baseValue;

          // 展示条码（只在showPrefix/showSuffix为true或未定义时显示前缀后缀）
          if (segment.config.prefix) {
            displayValue = segment.config.prefix + displayValue;
          }
          if (segment.config.suffix) {
            displayValue = displayValue + segment.config.suffix;
          }
          displayValues.push(displayValue);

          // 基础打印条码（只在showPrefix/showSuffix为true时显示）
          console.log(segment.config.prefix, segment.config.showPrefix,'===')
          if (segment.config.prefix && segment.config.showPrefix === true) {
            basicPrintValue = segment.config.prefix + basicPrintValue;
          }
          if (segment.config.suffix && segment.config.showSuffix === true) {
            basicPrintValue = basicPrintValue + segment.config.suffix;
          }
          basicPrintValues.push(basicPrintValue);

          // 转换值处理
          if (segmentResult.transformed) {
            hasTransform = true;
            let transformedBase = segmentResult.transformed;
            let transformedValue = transformedBase;
            let transformedPrintValue = transformedBase;

            // 转换后的展示条码（遵循相同的显示规则）
            if (segment.config.prefix) {
              transformedValue = segment.config.prefix + transformedValue;
            }
            if (segment.config.suffix) {
              transformedValue = transformedValue + segment.config.suffix;
            }
            transformedValues.push(transformedValue);

            // 转换后的打印条码（只在showPrefix/showSuffix为true时显示）
            if (segment.config.prefix && segment.config.showPrefix === true) {
              transformedPrintValue = segment.config.prefix + transformedPrintValue;
            }
            if (segment.config.suffix && segment.config.showSuffix === true) {
              transformedPrintValue = transformedPrintValue + segment.config.suffix;
            }
            transformedPrintValues.push(transformedPrintValue);
          } else {
            transformedValues.push(displayValue);
            transformedPrintValues.push(basicPrintValue);
          }
        }

        return {
          result: {
            displayBarcode: displayValues.join(''),
            printBarcode: basicPrintValues.join(''),
            transformed: hasTransform ? transformedValues.join('') : null,
            transformedPrintBarcode: hasTransform ? transformedPrintValues.join('') : null
          },
          breakdown: segments
        };
      } catch (error) {
        throw new Error(`生成条码失败: ${error.message}`);
      }
    },

    // 修改生成段落值的方法
    async generateSegmentValue(segment, params) {
      let basic = ''
      let transformed = null

      switch (segment.type) {
        case 'constant':
          basic = segment.config.constantValue
          if (segment.config.enableTransform && segment.config.transformValue) {
            transformed = segment.config.transformValue
          }
          break

        case 'fieldMapping':
          basic = params.fieldValues[segment.config.mappingField] || ''
          if (segment.config.fieldMappings && segment.config.fieldMappings.length) {
            const mapping = segment.config.fieldMappings.find(m => m.value === basic)
            if (mapping) {
              basic = mapping.code
            }
          }
          break

        case 'date':
          basic = this.formatDateWithMappings(params.date, segment.config)
          break

        case 'sequence':
          basic = this.formatSequenceWithPositionMapping(params.sequence, segment.config)
          break
      }

      return {
        basic,
        transformed
      }
    },

    formatDateWithMappings(date, format) {
      let value = this.formatDate(date, format.dateFormat)
      const dateFormat = format.dateFormat || '';

      // 解析日期格式，找出年月日的位置
      const yearPos = dateFormat.indexOf('YYYY');
      const monthPos = dateFormat.indexOf('MM');
      const dayPos = dateFormat.indexOf('DD');

      // 只有在格式中存在且有映射时才应用映射
      if (yearPos !== -1 && format.yearMappings && format.yearMappings.length) {
        const yearStr = value.substring(yearPos, yearPos + 4);
        const mapping = format.yearMappings.find(m => m.value === yearStr);
        if (mapping) {
          value = value.substring(0, yearPos) + mapping.code + value.substring(yearPos + 4);
        }
      }

      if (monthPos !== -1 && format.monthMappings && format.monthMappings.length) {
        const monthStr = value.substring(monthPos, monthPos + 2);
        const mapping = format.monthMappings.find(m => m.value === monthStr);
        if (mapping) {
          value = value.substring(0, monthPos) + mapping.code + value.substring(monthPos + 2);
        }
      }

      if (dayPos !== -1 && format.dayMappings && format.dayMappings.length) {
        const dayStr = value.substring(dayPos, dayPos + 2);
        const mapping = format.dayMappings.find(m => m.value === dayStr);
        if (mapping) {
          value = value.substring(0, dayPos) + mapping.code + value.substring(dayPos + 2);
        }
      }

      return value
    },

    applyNumberMappings(value, mappings) {
      return mappings.reduce((result, mapping) => {
        return result.replace(mapping.value, mapping.code)
      }, value)
    },

    formatSequenceWithPositionMapping(sequence, config) {
      let value = String(sequence).padStart(config.length, config.padChar)

      if (config.numberMappings && config.numberMappings.length) {
        const chars = value.split('')
        config.numberMappings.forEach(mapping => {
          if (mapping.position && mapping.position <= chars.length) {
            const pos = mapping.position - 1
            if (chars[pos] === mapping.value) {
              chars[pos] = mapping.code
            }
          }
        })
        value = chars.join('')
      }

      return value
    },

    // 移动段落
    moveSegment(index, direction) {
      const segments = this.currentRule.segments;
      if (direction === 'up' && index > 0) {
        [segments[index], segments[index - 1]] = [segments[index - 1], segments[index]];
      } else if (direction === 'down' && index < segments.length - 1) {
        [segments[index], segments[index + 1]] = [segments[index + 1], segments[index]];
      }
    },

    // 在流水号配置发生变化时更新映射规则的默认值
    handlePadCharChange(segment) {
      if (segment.config.numberMappings && segment.config.numberMappings.length) {
        segment.config.numberMappings.forEach(mapping => {
          if (mapping.value === segment.config.oldPadChar) {
            mapping.value = segment.config.padChar
          }
        })
      }
      segment.config.oldPadChar = segment.config.padChar
    },

    // 打开绑定物料对话框
    async handleBindMaterial(row) {
      this.currentSegmentRule = row;
      this.bindDialogVisible = true;
      await this.fetchBoundMaterials();
    },

    // 获取已绑定物料
    async fetchBoundMaterials() {
      try {
        const result = await getData('barcodeSegmentRuleMaterial', {
          query: { ruleId: this.currentSegmentRule._id },
          sort: { createAt: -1 }
        });
        this.boundMaterials = result.data || [];
      } catch (error) {
        console.error('获取已绑定物料失败:', error);
        this.$message.error('获取已绑定物料失败');
      }
    },

    // 获取物料列表
    async fetchMaterials() {
      this.materialListLoading = true;
      try {
        const query = {
          ...this.materialSearchForm
        };
        const res = await getData('k3_BD_MATERIAL', {
          query,
          limit: this.materialLimit,
          skip: (this.materialPage - 1) * this.materialLimit,
          count: true
        });

        if (res.code === 200) {
          this.materialList = res.data;
          this.materialTotal = res.countnum;
        }
      } catch (error) {
        console.error('获取物料列表失败:', error);
        this.$message.error('获取物料列表失败');
      } finally {
        this.materialListLoading = false;
      }
    },

    // 搜索物料
    searchMaterials() {
      this.materialPage = 1;
      this.fetchMaterials();
    },

    // 重置物料搜索
    resetMaterialSearch() {
      this.materialSearchForm = {
        materialNumber: '',
        materialName: ''
      };
      this.searchMaterials();
    },

    // 物料选择变更
    handleMaterialSelectionChange(selection) {
      this.materialSelection = selection;
    },

    // 批量绑定物料
    async handleBatchBind() {
      if (!this.materialForm.materialId || this.materialForm.materialId.length === 0) {
        this.$message.warning('请选择要绑定的物料');
        return;
      }

      try {
        const selectedMaterials = this.materialForm.materialId;
        const existingMaterials = this.boundMaterials.map(item => item.materialId);
        const duplicates = selectedMaterials.filter(id => existingMaterials.includes(id));

        if (duplicates.length > 0) {
          this.$message.warning('存在已绑定的物料，请勿重复添加');
          return;
        }

        const existingBindings = await getData('barcodeSegmentRuleMaterial', {
          query: {
            materialId: { $in: selectedMaterials },
            ruleId: { $ne: this.currentSegmentRule._id }
          }
        });

        if (existingBindings.data && existingBindings.data.length > 0) {
          const boundMaterialInfo = existingBindings.data.map(binding =>
            `${binding.materialNumber}(${binding.materialName}) - 已绑定规则: ${binding.ruleName}`
          );

          this.$message.error(
            '以下物料已绑定其他规则，不能重复绑定：\n' +
            boundMaterialInfo.join('\n')
          );
          return;
        }

        const materialsInfo = await getData('k3_BD_MATERIAL', {
          query: { _id: { $in: selectedMaterials } }
        });

        const bindData = materialsInfo.data.map(material => ({
          materialId: material._id,
          materialNumber: material.FNumber,
          materialName: material.FName,
          orgId: material.FUseOrgId,
          orgName: material.FUseOrgId_FName,
          ruleId: this.currentSegmentRule._id,
          ruleName: this.currentSegmentRule.name,
          ruleCode: this.currentSegmentRule.code,
          creator: this.$store.state.user.name,
          createAt: new Date()
        }));

        await addData('barcodeSegmentRuleMaterial', bindData);
        this.$message.success('物料绑定成功');
        this.materialForm.materialId = [];
        await this.fetchBoundMaterials();

      } catch (error) {
        console.error('绑定物料失败:', error);
        this.$message.error('绑定物料失败');
      }
    },

    // 解除绑定
    async unbindMaterial(row) {
      try {
        await this.$confirm(
          `确认解除物料 ${row.materialNumber}(${row.materialName}) 的绑定吗？`,
          '提示',
          {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
          }
        );

        await removeData('barcodeSegmentRuleMaterial', { query: { _id: row._id } });
        this.$message.success('解除绑定成功');
        await this.fetchBoundMaterials();
      } catch (error) {
        if (error !== 'cancel') {
          console.error('解除绑定失败:', error);
          this.$message.error('解除绑定失败');
        }
      }
    },

    handleRuleQuery(row) {
      this.$message.info('条码生成规则查询功能待实现');
    },
    handleRuleReset(row) {
      this.$message.info('条码生成规则重置功能待实现');
    },
    handleRuleAdd(row) {
      this.$message.info('条码生成规则新增功能待实现');
    },
    handleRuleBatchDelete(row) {
      this.$message.info('条码生成规则批量删除功能待实现');
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
}

.segment-item {
  margin-bottom: 20px;
}

.segment-card {
  margin-bottom: 15px;

  .el-button+.el-button {
    margin-left: 10px;
  }
}

.dialog-footer {
  margin-top: 20px;
  text-align: right;
}

.delete-btn {
  color: #F56C6C;
  margin-left: 10px;
}

.el-tag {
  text-align: center;
  min-width: 60px;
}

.test-section {
  margin-top: 20px;

  .test-params-card,
  .test-result-card {
    margin-bottom: 20px;
  }

  .param-section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 14px;
      color: #606266;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #EBEEF5;
    }
  }

  .test-result-content {
    .barcode-group {
      .barcode-item {
        margin-bottom: 15px;

        &:last-child {
          margin-bottom: 0;
        }

        .barcode-label {
          font-size: 14px;
          color: #606266;
          margin-bottom: 5px;
        }

        .barcode-preview {
          font-size: 24px;
          font-family: monospace;
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 4px;
        }
      }
    }

    .segment-breakdown {
      .segment-detail {
        margin-bottom: 15px;
        line-height: 1.5;

        &:last-child {
          margin-bottom: 0;
        }

        .segment-label {
          color: #606266;
          text-align: right;
          padding-right: 20px;
        }

        .segment-value {
          font-weight: 500;

          template {
            color: #409EFF;
            margin-left: 10px;
          }
        }

        .segment-info {
          color: #909399;
          font-size: 12px;
          margin-top: 5px;
        }
      }
    }
  }
}

.test-params-form {
  .el-form-item:last-child {
    margin-bottom: 0;
  }
}

.bind-material-dialog {
  .bound-list {
    margin-bottom: 20px;
  }

  .add-material-card {
    .item-option {
      .item-info {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .el-tag {
          margin-left: 10px;
        }
      }
    }
  }

  .delete-btn {
    color: #F56C6C;
  }
}
</style>
