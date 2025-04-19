<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-card class="filter-container">
      <div slot="header" class="clearfix">
        <span>筛选搜索</span>
        <el-button
          style="float: right; padding: 3px 0"
          type="text"
          @click="toggleAdvanced"
        >
          {{ showAdvanced ? "收起" : "展开" }}高级搜索
        </el-button>
      </div>

      <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="工艺名称">
              <el-input
                v-model="searchForm.craftName"
                placeholder="请输入工艺名称"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="工艺编码">
              <el-input
                v-model="searchForm.craftCode"
                placeholder="请输入工艺编码"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="创建日期">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="4">
            <el-form-item label="工艺类型">
              <el-select
                v-model="searchForm.craftType"
                placeholder="请选择工艺类型"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="dict in dict.type.craftType"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="工艺状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择工艺状态"
                clearable
                style="width: 100%"
              >
                <el-option label="创建" value="CREATE" />
                <el-option label="启用" value="ENABLE" />
                <el-option label="作废" value="VOID" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="生产阶级">
              <el-select
                v-model="searchForm.productStage"
                placeholder="请选择生产阶级"
                clearable
                style="width: 100%"
              >
                <el-option label="SMT" value="SMT" />
                <el-option label="DIP" value="DIP" />
                <el-option label="ASSEMPLY" value="ASSEMPLY" />
                <el-option label="PACK" value="PACK" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="是否标准">
              <el-select
                v-model="searchForm.isStandard"
                placeholder="请选择是否标准"
                clearable
                style="width: 100%"
              >
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="物料信息">
              <zr-select
                v-model="searchForm.selectedMaterial"
                collection="k3_BD_MATERIAL"
                :search-fields="['FNumber', 'FName']"
                label-key="FName"
                sub-key="FMATERIALID"
                :multiple="false"
                placeholder="请输入物料编码/名称搜索"
                @select="handleSearchMaterialChange"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label"
                        >{{ item.FNumber }} - {{ item.FName }}</span
                      >
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.FMATERIALID }} - {{ item.FUseOrgId_FName }}
                      </el-tag>
                    </div>
                    <div class="option-sub" v-if="item.FSpecification">
                      <small>规格: {{ item.FSpecification }}</small>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="search">查询搜索</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button type="success" @click="handleExport">导出数据</el-button>
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

    <base-table
      ref="craftTable"
      :currentPage="craftTableData.currentPage"
      :pageSize="craftTableData.pageSize"
      :tableData="craftTableData.tableList"
      :tableDataloading="craftTableData.listLoading"
      :total="craftTableData.total"
      @handleCurrentChange="handleCraftTableCurrentChange"
      :cell-style="{ textAlign: 'center' }"
      @handleSizeChange="handleCraftTableSizeChange"
    >
      <template slot="law">
        <el-table-column label="工艺名称" prop="craftName" />
        <el-table-column label="工艺编码" prop="craftCode" />
        <el-table-column label="工艺描述" prop="craftDesc" />
        <el-table-column label="工艺类型" prop="craftType">
          <template slot-scope="scope">
            <template v-for="dict in dict.type.craftType">
              <template v-if="dict.value === scope.row.craftType">
                {{ dict.label }}
              </template>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="产品型号" prop="productName" />
        <el-table-column label="物料编号" prop="materialCode">
          <template slot-scope="scope">
            {{
              scope.row.materialCode ||
              (scope.row.materialId && scope.row.materialId.FNumber)
            }}
          </template>
        </el-table-column>
        <!-- <el-table-column label="产品编号" prop="materialCode" /> -->
        <el-table-column label="创建人" prop="createBy" />
        <el-table-column label="创建时间" prop="createAt">
          <template slot-scope="scope">
            {{ scope.row.createAt | formatDate }}
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleEdit(scope.row)"
              >编辑</el-button
            >
            <el-button type="text" size="small" @click="handleDelete(scope.row)"
              >删除</el-button
            >
            <el-button
              type="text"
              size="small"
              @click="handleExportSingle(scope.row)"
              >导出</el-button
            >
            <el-button
              type="text"
              size="small"
              @click="handleExportBOM(scope.row)"
              >导出BOM</el-button
            >
            <el-button type="text" size="small" @click="handleCopy(scope.row)"
              >复制</el-button
            >
          </template>
        </el-table-column>
      </template>
    </base-table>

    <!-- 新增/编辑工艺弹窗 -->
    <el-dialog
      :close-on-click-modal="false"
      v-if="dialogFormVisible"
      :title="dialogStatus === 'create' ? '新增工艺' : '编辑工艺'"
      :visible.sync="dialogFormVisible"
      width="70%"
    >
      <el-form
        ref="craftForm"
        :model="craftForm"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产阶级" prop="productStage">
              <el-select
                v-model="craftForm.productStage"
                placeholder="请选择生产阶级"
                style="width: 100%"
              >
                <el-option label="SMT" value="SMT" />
                <el-option label="DIP" value="DIP" />
                <el-option label="ASSEMPLY" value="ASSEMPLY" />
                <el-option label="PACK" value="PACK" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工艺类型" prop="craftType">
              <el-select
                v-model="craftForm.craftType"
                placeholder="请选择工艺类型"
                clearable
                style="width: 100%"
                @change="handleCraftTypeChange"
              >
                <el-option
                  v-for="dict in dict.type.craftType"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工艺名称" prop="craftName">
              <el-input
                v-model="craftForm.craftName"
                placeholder="请输入工艺名称"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工艺编码" prop="craftCode">
              <el-input
                v-model="craftForm.craftCode"
                placeholder="系统自动生成"
                disabled
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="业务类型" prop="businessType">
              <el-select
                v-model="craftForm.businessType"
                placeholder="请选择业务类型"
                clearable
                style="width: 100%"
                @change="handleBusinessTypeChange"
              >
                <el-option
                  v-for="dict in dict.type.businessType"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工艺描述" prop="craftDesc">
              <el-input
                v-model="craftForm.craftDesc"
                placeholder="请输入工艺描述"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="选择物料" prop="selectedMaterial">
              <zr-select
                v-model="craftForm.materialId"
                collection="k3_BD_MATERIAL"
                :search-fields="['FNumber', 'FName']"
                label-key="FName"
                sub-key="FMATERIALID"
                :multiple="false"
                placeholder="请输入物料编码/名称搜索"
                @select="handleCraftMaterialChange"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label"
                        >{{ item.FNumber }} - {{ item.FName }}</span
                      >
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.FMATERIALID }} - {{ item.FUseOrgId_FName }}
                      </el-tag>
                    </div>
                    <div class="option-sub" v-if="item.FSpecification">
                      <small>规格: {{ item.FSpecification }}</small>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料名称" prop="componentName">
              <el-input
                v-model="craftForm.componentName"
                placeholder="物料名称"
                disabled
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物料代码" prop="materialCode">
              <el-input
                v-model="craftForm.materialCode"
                placeholder="物料代码"
                disabled
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料型号" prop="productName">
              <el-input
                v-model="craftForm.productName"
                placeholder="物料型号"
                disabled
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="成品工艺" prop="isProduct">
              <el-select
                v-model="craftForm.isProduct"
                placeholder="请选择是否成品工艺"
                style="width: 100%"
              >
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 工序列表 -->
      <div class="screen1">
        <div class="screen_content_first">
          <i class="el-icon-tickets">工序管理列表</i>
          <div>
            <!-- <el-button type="warning" v-if="hasOneKeyProductionPermission"
                            @click="handleWork">一键生产</el-button> -->
            <el-button type="primary" @click="handleAddProcess"
              >新增工序</el-button
            >
          </div>
        </div>
      </div>

      <base-table
        ref="processTable"
        :tableData="processTableData.tableList"
        :tableDataloading="processTableData.listLoading"
        :height="processTableData.height"
        :cell-style="{ textAlign: 'center' }"
      >
        <template slot="law">
          <el-table-column
            label="工序编码"
            prop="processCode"
            width="150"
            align="center"
          />
          <el-table-column label="工序名称" prop="processName" align="center" />
          <el-table-column label="工序描述" prop="processDesc" align="center" />
          <el-table-column
            label="工序次序"
            prop="sort"
            width="150"
            align="center"
          />
          <el-table-column
            label="工序类型"
            prop="processType"
            width="150"
            align="center"
          >
            <template slot-scope="scope">
              <!-- 带样式的用法 -->
              <dict-tag
                :options="dict.type.processType"
                :value="scope.row.processType"
              />
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center">
            <template slot-scope="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="280">
            <template slot-scope="scope">
              <el-button
                type="text"
                size="small"
                @click="handleMoveUp(scope.row, scope.$index)"
                :disabled="scope.$index === 0"
              >
                上移
              </el-button>
              <el-button
                type="text"
                size="small"
                @click="handleMoveDown(scope.row, scope.$index)"
                :disabled="
                  scope.$index === processTableData.tableList.length - 1
                "
              >
                下移
              </el-button>
              <el-button
                type="text"
                size="small"
                @click="handleEditProcess(scope.row)"
                >编辑</el-button
              >
              <el-button
                type="text"
                size="small"
                @click="handleDeleteProcess(scope.row)"
                >删除</el-button
              >
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
    <el-dialog
      :close-on-click-modal="false"
      :title="processOperationType === 'add' ? '新增工序' : '编辑工序'"
      :visible.sync="processDialogVisible"
      width="60%"
      append-to-body
    >
      <el-form
        ref="processForm"
        :model="processForm"
        :rules="processRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产阶级" prop="processStage">
              <el-select
                v-model="processForm.processStage"
                placeholder="请选择生产阶级"
                style="width: 100%"
              >
                <el-option
                  v-for="dict in dict.type.processStage"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序类型" prop="processType">
              <el-select
                v-model="processForm.processType"
                placeholder="请选择工序类型"
                style="width: 100%"
                @change="handleProcessTypeChange"
              >
                <el-option
                  v-for="dict in dict.type.processType"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工序编码" prop="processCode">
              <el-input
                v-model="processForm.processCode"
                placeholder="请输入工序编码"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序名称" prop="processName">
              <el-input
                v-model="processForm.processName"
                placeholder="请输入工序名称"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工序描述" prop="processDesc">
              <el-input
                v-model="processForm.processDesc"
                placeholder="请输入工序描述"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务类型" prop="businessType">
              <el-select
                v-model="processForm.businessType"
                placeholder="请选择业务类型"
                clearable
                style="width: 100%"
                @change="handleBusinessTypeChange"
                disabled
              >
                <!-- 添加disabled属性 -->
                <el-option
                  v-for="dict in dict.type.businessType"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工序状态" prop="status">
              <el-select
                v-model="processForm.status"
                placeholder="请选择工序状态"
                style="width: 100%"
              >
                <el-option
                  v-for="dict in dict.type.processStatus"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序次序" prop="sort">
              <el-input-number
                v-model="processForm.sort"
                :min="1"
                placeholder="请输入工序次序"
                style="width: 100%"
              ></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否录入MES" prop="isMES">
              <el-switch
                v-model="processForm.isMES"
                :active-value="true"
                :inactive-value="false"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="processForm.processType === 'G'">
            <el-form-item label="打印模版"  required>
              <zr-select
                v-model="processForm.printTemplateId"
                collection="printTemplate"
                :search-fields="['templateName', 'templateCode']"
                label-key="templateName"
                sub-key="templateCode"
                :multiple="false"
                placeholder="请选择打印模版"
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="绑定设备" prop="machineId">
              <zr-select
                v-model="processForm.machineId"
                collection="machine"
                :search-fields="['machineName', 'machineCode']"
                label-key="machineName"
                sub-key="machineCode"
                :multiple="false"
                placeholder="请选择绑定设备"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label"
                        >{{ item.machineName }} - {{ item.machineCode }}</span
                      >
                      <el-tag
                        size="mini"
                        :type="item.status ? 'success' : 'danger'"
                        class="option-tag"
                      >
                        {{ item.status ? "在线" : "离线" }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联设备" prop="machineIds">
              <zr-select
                v-model="processForm.machineIds"
                collection="machine"
                @select="handleMachineSelect"
                :search-fields="['machineName', 'machineCode']"
                label-key="machineName"
                sub-key="machineCode"
                :multiple="true"
                placeholder="请选择关联设备(可多选)"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label"
                        >{{ item.machineName }} - {{ item.machineCode }}</span
                      >
                      <el-tag
                        size="mini"
                        :type="item.status ? 'success' : 'danger'"
                        class="option-tag"
                      >
                        {{ item.status ? "在线" : "离线" }}
                      </el-tag>
                      <el-tag
                        size="mini"
                        type="info"
                        class="option-tag"
                        v-if="item.lineName"
                      >
                        产线: {{ item.lineName }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 设备信息展示区域 -->
        <el-row :gutter="20" v-if="devicesList.length > 0">
          <el-col :span="24">
            <div class="device-info-container">
              <div class="device-info-header">
                <i class="el-icon-cpu"></i> 设备关联信息
                <el-tag size="small" type="primary">
                  关联设备: {{ devicesList.length }}台
                </el-tag>
              </div>

              <div class="device-list">
                <!-- 关联设备 -->
                <el-tag
                  v-for="(device, index) in devicesList"
                  :key="index"
                  type="success"
                  class="device-tag"
                  size="medium"
                >
                  <i class="el-icon-connection"></i>
                  {{ device.machineName }} ({{ device.machineCode }})
                  <el-tag
                    size="mini"
                    :type="device.status ? 'success' : 'danger'"
                  >
                    {{ device.status ? "在线" : "离线" }}
                  </el-tag>
                  <el-tag
                    size="mini"
                    type="primary"
                    class="option-tag"
                    v-if="device.lineName"
                  >
                    产线: {{ device.lineName }}
                  </el-tag>
                </el-tag>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>

      <!-- 工序列表 -->
      <div class="screen1" v-if="processForm.processType !== 'G'">
        <div class="screen_content_first">
          <i class="el-icon-tickets">物料管理列表</i>
          <el-button type="primary" @click="handleAddMaterial"
            >新增物料</el-button
          >
        </div>
      </div>

      <base-table
        v-if="processForm.processType !== 'G'"
        ref="materialTable"
        :tableData="materialTableData.tableList"
        :currentPage="materialTableData.currentPage"
        :pageSize="materialTableData.pageSize"
        :tableDataloading="materialTableData.listLoading"
        :total="materialTableData.total"
        :height="materialTableData.height"
        :cell-style="{ textAlign: 'center' }"
        @handleCurrentChange="handleMaterialTableCurrentChange"
        @handleSizeChange="handleMaterialTableSizeChange"
      >
        <template slot="law">
          <el-table-column label="使用组织" prop="materialId.FUseOrgId_FName">
            <template slot-scope="scope">
              {{
                scope.row.materialId
                  ? scope.row.materialId.FUseOrgId_FName
                  : "--"
              }}
            </template>
          </el-table-column>
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
              <el-switch
                v-model="scope.row.scanOperation"
                :active-value="true"
                :inactive-value="false"
                disabled
              >
              </el-switch>
            </template>
          </el-table-column>

          <el-table-column
            label="是否组件"
            prop="isComponent"
          ></el-table-column>
          <el-table-column label="是否组件" prop="isComponent">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.isComponent"
                :active-value="true"
                :inactive-value="false"
                disabled
              >
              </el-switch>
            </template>
          </el-table-column>

          <el-table-column label="是否包装箱" prop="isPackingBox">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.isPackingBox"
                :active-value="true"
                :inactive-value="false"
                disabled
              >
              </el-switch>
            </template>
          </el-table-column>

          <el-table-column label="批次物料" prop="isBatch">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.isBatch"
                :active-value="true"
                :inactive-value="false"
                disabled
              >
              </el-switch>
            </template>
          </el-table-column>
          <el-table-column label="关键物料" prop="isKey">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.isKey"
                :active-value="true"
                :inactive-value="false"
                disabled
              >
              </el-switch>
            </template>
          </el-table-column>
          <el-table-column label="RFID" prop="isRfid">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.isRfid"
                :active-value="true"
                :inactive-value="false"
                disabled
              >
              </el-switch>
            </template>
          </el-table-column>

          <el-table-column label="操作" fixed="right" width="150">
            <template slot-scope="scope">
              <el-button
                type="text"
                size="small"
                @click="handleEditMaterial(scope.row)"
                >编辑</el-button
              >
              <el-button
                type="text"
                size="small"
                @click="handleDeleteMaterial(scope.row)"
                >删除</el-button
              >
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
    <el-dialog
      :close-on-click-modal="false"
      :title="materialDialog.title"
      :visible.sync="materialDialog.visible"
      :before-close="materialDialog.beforeClose"
      width="50%"
      append-to-body
    >
      <el-form
        ref="materialForm"
        :model="materialForm"
        :rules="materialRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="选择物料" prop="materialId">
              <zr-select
                v-model="materialForm.materialId"
                collection="k3_BD_MATERIAL"
                :search-fields="['FNumber', 'FName']"
                label-key="FName"
                sub-key="FMATERIALID"
                :multiple="false"
                placeholder="请输入物料编码/名称搜索"
                @select="handleMaterialChange"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label"
                        >{{ item.FNumber }} - {{ item.FName }}</span
                      >
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.FMATERIALID }} - {{ item.FUseOrgId_FName }}
                      </el-tag>
                    </div>
                    <div class="option-sub" v-if="item.FSpecification">
                      <small>规格: {{ item.FSpecification }}</small>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物料编码" prop="materialCode">
              <el-input
                disabled
                v-model="materialForm.materialCode"
                placeholder="请输入物料编码"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料名称" prop="materialName">
              <el-input
                disabled
                v-model="materialForm.materialName"
                placeholder="请输入物料名称"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规格型号" prop="specification">
              <el-input
                disabled
                v-model="materialForm.specification"
                placeholder="请输入规格型号"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料用量" prop="quantity">
              <el-input-number
                v-model="materialForm.quantity"
                :min="0"
                :precision="2"
                :step="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单位">
              <el-select
                v-model="materialForm.unit"
                placeholder="请选择单位"
                style="width: 100%"
              >
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
              <el-switch
                v-model="materialForm.scanOperation"
                :active-value="true"
                :inactive-value="false"
              >
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
          <el-col :span="12">
            <el-form-item label="是否包装箱">
              <el-switch v-model="materialForm.isPackingBox" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="RFID">
              <el-switch v-model="materialForm.isRfid" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="批次物料">
              <el-switch
                v-model="materialForm.isBatch"
                @change="handleBatchChange"
                :disabled="materialForm.isKey"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关键物料">
              <el-switch
                v-model="materialForm.isKey"
                @change="handleKeyChange"
                :disabled="materialForm.isBatch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="materialForm.isBatch">
            <el-form-item label="批次用量" prop="batchQuantity">
              <el-input-number
                v-model="materialForm.batchQuantity"
                :min="0"
                :precision="2"
                :step="1"
                style="width: 100%"
              />
              <template v-if="materialForm.batchQuantity === 0">
                <p style="color: #999">批次用量为0时无限制</p>
              </template>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="materialDialog.visible = false">取 消</el-button>
        <el-button
          type="primary"
          :loading="materialDialog.loading"
          @click="submitMaterialForm"
          >确 定</el-button
        >
      </div>
    </el-dialog>
    <work-dialog
      :visible.sync="workDialogVisible"
      :material-id="craftForm.materialId"
      :work-table-data="workTableData"
    />

    <!-- 添加复制工艺弹窗 -->
    <el-dialog
      :close-on-click-modal="false"
      title="复制工艺"
      :visible.sync="copyDialogVisible"
      width="50%"
      append-to-body
    >
      <el-form
        ref="copyForm"
        :model="copyForm"
        :rules="copyRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="选择物料" prop="materialId">
              <zr-select
                v-model="copyForm.materialId"
                collection="k3_BD_MATERIAL"
                :search-fields="['FNumber', 'FName']"
                label-key="FName"
                sub-key="FMATERIALID"
                :multiple="false"
                placeholder="请输入物料编码/名称搜索"
                @select="handleCopyMaterialChange"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label"
                        >{{ item.FNumber }} - {{ item.FName }}</span
                      >
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.FMATERIALID }} - {{ item.FUseOrgId_FName }}
                      </el-tag>
                    </div>
                    <div class="option-sub" v-if="item.FSpecification">
                      <small>规格: {{ item.FSpecification }}</small>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="copyDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="copyLoading" @click="submitCopyForm"
          >确 定</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import ZrSelect from "@/components/ZrSelect";
import workDialog from "@/components/workDialog";
import Sortable from "sortablejs";
import { exportBOM } from "@/api/materialProcessFlowService";
export default {
  components: { ZrSelect, workDialog },
  name: "craft",
  dicts: [
    "product_type",
    "craftType",
    "processType",
    "processStage",
    "businessType",
    "processStatus",
  ],
  data() {
    return {
      // 临时ID
      tempCraftId: "", // 临时工艺ID
      tempProcessId: "", // 临时工序ID

      // 工艺表单数据
      craftForm: {
        _id: "", // 临时工艺ID
        businessType: "", // 业务类型
        craftCode: "", // 工艺编号
        craftName: "", // 工艺名称
        craftVersion: "", // 工艺版本号
        productId: "", // 关联产品ID
        craftType: "", // 工艺类型
        craftDesc: "", // 工艺描述
        materialId: "", // 物料ID
        craftParams: [], // 工艺参数
        processSteps: [], // 工序步骤ID数组
        productStage: "", // 生产阶级
        attachments: [], // 附件文档路径
        remark: "", // 备注
        status: "CREATE", // 状态
        isStandard: "0", // 是否标准工艺
        selectedMaterial: "", // 新增物料选择字段
        componentName: "", // 组件名称
        productName: "", // 产品型号
        materialCode: "", // 物料代码
        isProduct: "", // 是否成品工艺
      },
      // 工艺表单验证规则
      rules: {
        craftCode: [
          { required: true, message: "请输入工艺编号", trigger: "blur" },
        ],
        craftName: [
          { required: true, message: "请输入工艺名称", trigger: "blur" },
        ],
        craftType: [
          { required: true, message: "请选择工艺类型", trigger: "change" },
        ],
        isProduct: [
          { required: true, message: "请选择是否成品工艺", trigger: "change" },
        ],
      },
      // 工序表单数据
      processForm: {
        _id: "", // 临时工序ID
        craftId: "", // 关联工艺ID
        processCode: "", // 工序编码
        processName: "", // 工序名称
        processDesc: "", // 工序描述
        processStage: "", // 生产阶级
        processType: "", // 工序类型
        businessType: "", // 业务类型
        machineId: "", // 主检验设备
        machineIds: [], // 关联设备列表
        status: "CREATE", // 状态
        materials: [], // 工序物料清单
        remark: "", // 备注
        printTemplateId: "", // 关联打印模版ID
        sort: 1, // 工序次序
        isMES: true, // 是否录入MES
      },

      // 工序表单验证规则
      processRules: {
        processName: [
          { required: true, message: "请输入工序名称", trigger: "blur" },
        ],
        processCode: [
          { required: true, message: "请输入工序编码", trigger: "blur" },
        ],
        processStage: [
          { required: true, message: "请选择生产阶级", trigger: "change" },
        ],
        processType: [
          { required: true, message: "请选择工序类型", trigger: "change" },
        ],
        sort: [
          { required: true, message: "请输入工序次序", trigger: "blur" },
          {
            type: "number",
            min: 1,
            message: "工序次序必须大于0",
            trigger: "blur",
          },
        ],
        // printTemplateId: [
        //   {
        //     required: true,
        //     message: "打印工序必须选择打印模版",
        //     trigger: "change",
        //     validator: (rule, value, callback) => {
        //       if (this.processForm.processType === "G" && !value) {
        //         callback(new Error("打印工序必须选择打印模版"));
        //       } else {
        //         callback();
        //       }
        //     },
        //   },
        // ],
      },

      // 物料表单数据
      materialForm: {
        craftId: "", // 关联工艺ID
        processStepId: "", // 工序步骤ID
        materialId: "", // 物料ID
        materialCode: "", // 物料编码
        materialName: "", // 物料名称
        specification: "", // 规格型号
        quantity: null, // 用量
        unit: "", // 单位
        isKey: "0", // 是否关键物料
        remark: "", // 备注
        scanOperation: true, // 扫码操作
        isComponent: "0", // 是否组件
      },
      //物料表单验证规则
      materialRules: {
        materialCode: [
          { required: true, message: "请输入物料编码", trigger: "blur" },
        ],
        materialName: [
          { required: true, message: "请输入物料名称", trigger: "blur" },
        ],
        specification: [
          { required: true, message: "请输入规格型号", trigger: "blur" },
        ],
      },
      // 表格数据
      craftTableData: {
        tableList: [],
        total: 0,
        currentPage: 1,
        pageSize: 10,
        listLoading: false,
      },

      processTableData: {
        tableList: [], // 工序列表数据
        listLoading: false,
        height: "400px", // 添加固定高度
      },

      materialTableData: {
        tableList: [],
        total: 0,
        currentPage: 1,
        pageSize: 10,
        listLoading: false,
        height: "400px", // 添加固定高度
      },

      // 弹窗控制
      dialogFormVisible: false,
      processDialogVisible: false,
      materialDialogVisible: false,
      dialogStatus: "create",
      materialDialogStatus: "create", // 新增状态标记
      editingMaterialId: null, // 正在编辑的物料ID

      // 搜索表单数据
      searchForm: {
        craftName: "", // 工艺名称 (原 FName)
        craftCode: "", // 工艺编码 (原 FNumber)
        dateRange: [], // 日期范围
        craftType: "", // 工艺类型
        status: "", // 工艺状态 (原 FDocumentStatus)
        productName: "", // 产品型号 (原 FProductType)
        productStage: "", // 生产阶级
        isStandard: "", // 是否标准工艺
        selectedMaterial: "", // 选中的物料ID
        materialCode: "", // 物料编码
        materialName: "", // 物料名称
      },

      // 是否显示高级搜索
      showAdvanced: false,
      materialOptions: [], // 物料选项列表
      materialLoading: false, // 物料加载状态

      // 编辑物料对话框数据
      materialDialog: {
        visible: false,
        title: "新增物料",
        loading: false,
        beforeClose: (done) => {
          // 清空表单数据
          this.materialForm = {
            materialId: "",
            materialCode: "",
            materialName: "",
            specification: "",
            quantity: 1,
            unit: "个",
            scanOperation: true,
            isComponent: false,
            isRfid: false,
            isKey: false,
            isBatch: false,
            batchQuantity: 0,
          };
          // 清空物料选项
          this.materialOptions = [];
          // 重置表单验证
          if (this.$refs.materialForm) {
            this.$refs.materialForm.resetFields();
          }
          done();
        },
      },
      materialForm: {
        materialId: "",
        materialCode: "",
        materialName: "",
        specification: "",
        quantity: 1,
        unit: "个",
        scanOperation: true,
        isComponent: false,
        isRfid: false,
        isKey: false,
        isBatch: false,
        batchQuantity: 0,
      },
      materialOptions: [],
      materialRules: {
        materialId: [
          { required: true, message: "请选择物料", trigger: "change" },
        ],
        quantity: [
          { required: true, message: "请输入用量", trigger: "blur" },
          { type: "number", min: 0, message: "用量必须大于0", trigger: "blur" },
        ],
      },
      searchDebounce: null,
      processOperationType: "create", // 新增: 'create', 编辑: 'edit'

      workTableData: [],
      workDialogVisible: false,
      hasOneKeyProductionPermission: false,

      // 复制工艺相关数据
      copyDialogVisible: false,
      copyLoading: false,
      copyForm: {
        materialId: "",
        sourceCraftId: "", // 源工艺ID
      },
      copyRules: {
        materialId: [
          { required: true, message: "请选择物料", trigger: "change" },
        ],
      },
      // 设备列表缓存
      devicesList: [],
    };
  },

  methods: {
    // ================ 工艺相关方法 ================
    async fetchCraftData() {
      this.craftTableData.listLoading = true;
      try {
        let req = this.searchData();
        req.page = this.craftTableData.currentPage;
        req.skip =
          (this.craftTableData.currentPage - 1) * this.craftTableData.pageSize;
        req.limit = this.craftTableData.pageSize;
        req.sort = { _id: -1 };
        req.populate = JSON.stringify([
          { path: "materialId", select: "FNumber" },
        ]);
        req.count = true;
        const result = await getData("craft", req);
        this.craftTableData.tableList = result.data;
        this.craftTableData.total = result.countnum;
      } catch (error) {
        console.error("获取工艺数据失败:", error);
        this.$message.error("获取工艺数据失败");
      } finally {
        this.craftTableData.listLoading = false;
      }
    },

    handleAdd() {
      this.tempCraftId = this.ObjectId(); // 生成临时工艺ID
      this.dialogStatus = "create";
      this.dialogFormVisible = true;
      this.craftForm = {
        _id: this.tempCraftId,
        businessType: "",
        craftCode: "", // 将在类型选择后自动生成
        craftName: "",
        craftVersion: "",
        productId: "",
        craftType: "",
        craftDesc: "",
        materialId: "",
        craftParams: [],
        processSteps: [],
        productStage: "",
        attachments: [],
        isProduct: "",
        remark: "",
        status: "CREATE",
        isStandard: "0",
        selectedMaterial: "",
      };
      // 重置工序列表
      this.processTableData.tableList = [];
      this.processTableData.total = 0;
    },
    async handleEdit(row) {
      // 先设置基本状态，确保弹窗能够显示
      this.dialogStatus = "edit";
      this.dialogFormVisible = true;
      this.tempCraftId = row._id;

      try {
        let craftGet = await getData("craft", {
          query: { _id: this.tempCraftId },
        });
        // 基础数据复制
        this.craftForm = JSON.parse(JSON.stringify(craftGet.data[0]));

        // 如果存在materialId，初始化物料选项和相关字段
        if (this.craftForm.materialId) {
          try {
            const result = await getData("k3_BD_MATERIAL", {
              query: { _id: this.craftForm.materialId },
            });

            if (result.data && result.data.length > 0) {
              const materialData = result.data[0];
              this.materialOptions = result.data;
              this.craftForm.selectedMaterial = this.craftForm.materialId;
              // 确保设置所有相关的物料字段
              this.craftForm.materialCode = materialData.FNumber || "";
              this.craftForm.componentName = materialData.FName || "";
              this.craftForm.productName = materialData.FSpecification || "";
            }
          } catch (error) {
            console.error("获取物料数据失败:", error);
            this.$message.warning("获取物料数据失败，但可以继续编辑其他信息");
          }
        }

        // 加载关联的工序数据
        await this.fetchProcessData();
      } catch (error) {
        console.error("初始化编辑数据失败:", error);
        this.$message.error("初始化编辑数据失败");
      }
    },

    handleDelete(row) {
      this.$confirm(
        "删除工艺将同时删除所有相关工序和物料数据，是否确认删除?",
        "警告",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(async () => {
          try {
            // 1. 获取所有相关工序
            const processResult = await getData("processStep", {
              query: { craftId: row._id },
            });

            const processIds = processResult.data.map((process) => process._id);

            // 2. 删除所有相关的工序物料
            if (processIds.length > 0) {
              await removeData("processMaterials", {
                query: { processStepId: { $in: processIds } },
              });
            }

            // 3. 删除所有相关工序
            await removeData("processStep", {
              query: { craftId: row._id },
            });

            // 4. 最后删除工艺
            await removeData("craft", {
              query: { _id: row._id },
            });

            this.$message.success("删除成功");
            this.fetchCraftData();
          } catch (error) {
            console.error("删除失败:", error);
            this.$message.error("删除失败: " + error.message);
          }
        })
        .catch(() => {
          this.$message.info("已取消删除");
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
              this.$message.warning("请选择物料");
              return;
            }

            // 检查其他��艺是否使用了相同物料
            const duplicateCheck = await getData("craft", {
              query: {
                materialId: this.craftForm.selectedMaterial,
                _id: { $ne: this.tempCraftId }, // 排除当前工艺
                status: { $ne: "VOID" }, // 排除作废状态的工艺
              },
            });

            if (duplicateCheck.data && duplicateCheck.data.length > 0) {
              this.$message.warning(
                `该物料已被其他工艺使用，工艺名称:${duplicateCheck.data[0].craftName}`
              );
              return;
            }

            const processTableData = await getData("processStep", {
              query: {
                craftId: this.tempCraftId,
              },
              sort: { _id: -1 },
              select: { _id: 1 },
            });

            // 获取所有工序的ID数组
            const processSteps = processTableData.data.map(
              (process) => process._id
            );

            const craftData = {
              ...this.craftForm,
              materialId: this.craftForm.selectedMaterial,
              processSteps: processSteps,
            };

            //如果是成品工艺 检查工序里是否有装箱工序 工序类型为E  是否有托盘工序 工序类型为F
            if (this.craftForm.isProduct) {
              const hasPackingProcess = processTableData.data.some(
                (process) => process.processType === "E"
              );
              const hasTrayProcess = processTableData.data.some(
                (process) => process.processType === "F"
              );
              if (!hasTrayProcess) {
                this.$notify({
                  title: "警告",
                  message: "当前成品工艺未包含托盘工序",
                  type: "error",
                });
              }
              if (!hasPackingProcess) {
                this.$nextTick(() => {
                  this.$notify({
                    title: "警告",
                    message: "当前成品工艺未包含装箱工序",
                    type: "warning",
                  });
                });
              }
            }

            // 删除不需要的字段
            delete craftData.selectedMaterial;

            if (this.dialogStatus === "create") {
              // 新增操作
              craftData.createBy = this.$store.getters.name;
              await addData("craft", craftData);
              this.$message.success("添加成功");
            } else {
              // 更新操作
              craftData.updateBy = this.$store.getters.name;
              const updateReq = {
                query: { _id: this.tempCraftId },
                update: craftData,
              };
              await updateData("craft", updateReq);
              this.$message.success("更新成功");
            }

            this.dialogFormVisible = false;
            this.fetchCraftData();
          } catch (error) {
            console.error("操作失败:", error);
            this.$message.error("操作失败");
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

        // 移除分页相关参数,获取所有数据
        let req = {
          query: {
            craftId: craftId,
          },
          sort: { sort: 1 }, // 按工序顺序排序
          populate: JSON.stringify([{ path: "machineId" }]),
        };
        const result = await getData("processStep", req);
        this.processTableData.tableList = result.data;
      } catch (error) {
        console.error("获取工序数据失败:", error);
        this.$message.error("获取工序数据失败");
      } finally {
        this.processTableData.listLoading = false;
      }
    },

    async generateProcessCode() {
      try {
        // 获取当前工艺下的所有工序
        const result = await getData("processStep", {
          query: {
            craftId: this.tempCraftId,
            processCode: { $exists: true, $ne: "" }, // 确保processCode存在且不为空
          },
        });

        // 获取序列号
        let maxSequence = 0;
        if (result.data && result.data.length > 0) {
          // 遍历所有工序编码，找出最大序列号
          result.data.forEach((process) => {
            const parts = process.processCode.split("_");
            parts.forEach((part) => {
              if (/^\d{4}$/.test(part)) {
                const currentSequence = parseInt(part);
                maxSequence = Math.max(maxSequence, currentSequence);
              }
            });
          });
        }

        // 序列号加1
        const sequence = (maxSequence + 1).toString().padStart(4, "0");

        // 使用统一的编码生成逻辑
        return this.generateUnifiedCode(
          this.craftForm.craftType,
          "", // 初始时工序类型为空
          sequence,
          "" // 初始时业务类型为空
        );
      } catch (error) {
        console.error("生成工序编码失败:", error);
        return "ERROR_GENERATING_CODE";
      }
    },

    // 添加统一的编码生成逻辑
    generateUnifiedCode(craftType, processType, sequence, businessType) {
      let code = craftType || "";

      // 添加工序类型（如果存在）
      if (processType) {
        code += `_${processType}`;
      }

      // 添加序列号
      code += `_${sequence}`;

      // 添加业务类型（如果存在）
      if (businessType) {
        code += `_${businessType}`;
      }

      return code;
    },

    async handleProcessTypeChange(value) {
      if (!this.processForm.processCode) return;

      // 解析当前编码
      const parts = this.processForm.processCode.split("_");
      const craftType = parts[0];
      const sequence = parts[parts.length - 1];
      const businessType = parts.length > 3 ? parts[3] : "";

      // 使用统一的编码生成逻辑
      this.processForm.processCode = this.generateUnifiedCode(
        craftType,
        value,
        sequence,
        businessType
      );
      
      // 当工序类型为打印工序(G)时，清空物料数据
      if (value === 'G') {
        // 清空界面上的物料表格数据
        this.materialTableData.tableList = [];
        this.materialTableData.total = 0;
        
        // 如果是编辑状态且工序ID存在，则删除数据库中关联的物料数据
        if (this.processOperationType === 'edit' && this.tempProcessId) {
          try {
            await removeData("processMaterials", {
              query: { processStepId: this.tempProcessId },
            });
            this.$message.success("已自动清空打印工序的物料数据");
          } catch (error) {
            console.error("清空物料数据失败:", error);
          }
        }
      }
    },

    async handleBusinessTypeChange(value) {
      if (!this.processForm.processCode) return;

      // 解析当前编码
      const parts = this.processForm.processCode.split("_");
      const craftType = parts[0];
      const processType = parts.length > 1 ? parts[1] : "";
      const sequence = parts[2];

      // 使用统一的编码生成逻辑
      this.processForm.processCode = this.generateUnifiedCode(
        craftType,
        processType,
        sequence,
        value
      );
    },

    async handleWork() {
      try {
        // 获取当前工艺所有工序的API
        const result = await getData("processStep", {
          query: { craftId: this.tempCraftId },
          sort: { sort: 1 },
          populate: JSON.stringify([
            { path: "machineId" },
            { path: "machineIds" },
          ]),
        });
        this.workTableData = result.data;
        console.log(this.workTableData, "this.workTableData");
        this.workDialogVisible = true;
      } catch (error) {
        this.$message.error("获取工序数据失败");
      }
    },

    async handleAddProcess() {
      if (!this.tempCraftId) {
        this.$message.warning("工艺ID不存在");
        return;
      }

      try {
        // 获取当前工艺下所有工序
        const result = await getData("processStep", {
          query: { craftId: this.tempCraftId },
          sort: { sort: -1 },
          limit: 1,
        });

        // 计算新工序的次序
        let nextSort = 1;
        if (result.data && result.data.length > 0) {
          nextSort = result.data[0].sort + 1;
        }

        // 生成工序编码
        const processCode = await this.generateProcessCode();
        console.log(processCode, "processCode");

        this.processOperationType = "create";
        this.tempProcessId = this.ObjectId();
        this.processDialogVisible = true;
        this.processForm = {
          _id: this.tempProcessId,
          craftId: this.tempCraftId,
          processCode: processCode,
          processName: "",
          processDesc: "",
          processStage: "",
          processType: "",
          printTemplateId: "",
          businessType: this.craftForm.businessType,
          status: "CREATE",
          materials: [],
          remark: "",
          sort: nextSort,
          isMES: true,
        };

        // 重置物料列表
        this.materialTableData.tableList = [];
        this.materialTableData.total = 0;
      } catch (error) {
        console.error("初始化工序失败:", error);
        this.$message.error("初始化工序失败");
      }
    },

    handleEditProcess(row) {
      if (!row || !row._id) {
        this.$message.error("无效的工序数据");
        return;
      }

  
      this.tempProcessId = row._id;
      this.processForm = JSON.parse(JSON.stringify(row));
      // 确保工序的业务类型与工艺保持一致
      this.processForm.businessType = this.craftForm.businessType;
    

      // 打印日志，查看printTemplateId的值
      console.log("编辑工序数据:", this.processForm);
      console.log("打印模版ID:", this.processForm.printTemplateId);

      this.$nextTick(() => {
        this.processOperationType = "edit"; // 设置为编辑操作
        this.processDialogVisible = true;
      });


      // 获取设备详情
      this.fetchDeviceDetails()
        .then(() => {
          // 加载关联的物料数据
          this.fetchMaterialData();
        })
        .catch((error) => {
          console.error("获取设备详情失败:", error);
          // 即使设备详情获取失败，也尝试加载物料数据
          this.fetchMaterialData();
        });
    },

    handleDeleteProcess(row) {
      this.$confirm(
        "删除工序将同时删除所有相关物料数据，是否确认删除?",
        "警告",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(async () => {
          try {
            // 1. 先删除工序相关的所有物料
            await removeData("processMaterials", {
              query: { processStepId: row._id },
            });

            // 2. 删除工序
            await removeData("processStep", {
              query: { _id: row._id },
            });

            this.$message.success("删除成功");

            // 3. 更新工序排序
            await this.reorderProcessSteps(); // 添加此行以重新排序工序

            this.fetchProcessData();
          } catch (error) {
            console.error("删除失败:", error);
            this.$message.error("删除失败: " + error.message);
          }
        })
        .catch(() => {
          this.$message.info("已取消删除");
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
            // 检查同一工艺下是否存在相同工序编码
            const existingProcess = await getData("processStep", {
              query: {
                craftId: this.tempCraftId,
                processCode: this.processForm.processCode,
                _id: { $ne: this.tempProcessId }, // 排除当前编辑的工序
              },
            });

            if (existingProcess.data && existingProcess.data.length > 0) {
              this.$message.error("当前工艺下已存在相同工序编码，请修改后重试");
              return;
            }

            // 检查工序次序是否重复
            const existingProcessSort = await getData("processStep", {
              query: {
                craftId: this.tempCraftId,
                sort: this.processForm.sort,
                _id: { $ne: this.tempProcessId },
              },
            });

            if (
              existingProcessSort.data &&
              existingProcessSort.data.length > 0
            ) {
              this.$message.warning("工序次序重复，系统将自动调整序号");

              // 获取最大序号
              const maxSortResult = await getData("processStep", {
                query: { craftId: this.tempCraftId },
                sort: { sort: -1 },
                limit: 1,
              });

              this.processForm.sort =
                maxSortResult.data.length > 0
                  ? maxSortResult.data[0].sort + 1
                  : 1;
            }

            // 获取当前物料列表的ID数组
            const materialIds = this.materialTableData.tableList.map(
              (material) => material._id.toString()
            );

            // 检查打印工序是否选择了打印模版
            if (
              this.processForm.processType === "G" &&
              !this.processForm.printTemplateId
            ) {
              this.$message.warning("打印工序必须选择打印模版");
              return;
            }

            // 修改验证逻辑，检测工序（C）,托盘工序(F)，打印工序(G)不需要验证物料
            if (
              this.processForm.processType !== "C" &&
              this.processForm.processType !== "F" &&
              this.processForm.processType !== "G" &&
              materialIds.length === 0
            ) {
              this.$message.warning("请先添加物料");
              return;
            }

            // 如果是托盘工序且有物料，给出警告
            // if (this.processForm.processType === 'F' && materialIds.length > 0) {
            //     this.$message.warning('托盘工序不应包含物料，请手动清除物料数据');
            //     return;
            // }

            // 确保machineIds是数组
            if (!Array.isArray(this.processForm.machineIds)) {
              this.processForm.machineIds = [];
            }

            // 打印日志，查看提交前的打印模版ID
            console.log("提交前表单数据:", this.processForm);
            console.log("提交前打印模版ID:", this.processForm.printTemplateId);

            // 构建工序数据
            const processData = {
              ...this.processForm,
              craftId: this.tempCraftId,
              materials: materialIds,
            };

            if (this.processOperationType === "create") {
              // 新增操作
              processData._id = this.tempProcessId;
              processData.createBy = this.$store.getters.name;
              processData.createAt = new Date();
              await addData("processStep", processData);
              this.$message.success("添加成功");
            } else {
              // 编辑操作
              processData.updateBy = this.$store.getters.name;
              processData.updateAt = new Date();
              const updateReq = {
                query: { _id: this.tempProcessId },
                update: processData,
              };
              await updateData("processStep", updateReq);
              this.$message.success("更新成功");
            }

            // 关闭弹窗并刷新数据
            this.processDialogVisible = false;
            await this.fetchProcessData();

            // 重新排序所有工序
            await this.reorderProcessSteps();
          } catch (error) {
            console.error("操作失败:", error);
            this.$message.error("操作失败: " + error.message);
          }
        } else {
          this.$message.warning("请填写必填项");
          return false;
        }
      });
    },
    // ================ 物料相关方法 ================
    async fetchMaterialData() {
      // 如果是打印工序，不加载物料数据
      if (this.processForm.processType === 'G') {
        this.materialTableData.tableList = [];
        this.materialTableData.total = 0;
        return;
      }
      
      this.materialTableData.listLoading = true;
      try {
        const processId = this.processForm._id;
        if (!processId) return;

        let req = {
          query: {
            processStepId: processId,
          },
          populate: JSON.stringify([
            {
              path: "materialId",
              select: "FUseOrgId_FName", // 选择需要的字段
            },
          ]),
          page: this.materialTableData.currentPage,
          skip:
            (this.materialTableData.currentPage - 1) *
            this.materialTableData.pageSize,
          limit: this.materialTableData.pageSize,
          count: true,
        };
        const result = await getData("processMaterials", req);
        this.materialTableData.tableList = result.data;
        this.materialTableData.total = result.countnum;
      } catch (error) {
        console.error("获取物料数据失败:", error);
        this.$message.error("获取物料数据失败");
      } finally {
        this.materialTableData.listLoading = false;
      }
    },

    handleAddMaterial() {
      // 检查工序类型是否为 G (打印工序)
      if (this.processForm.processType === 'G') {
        this.$message.warning('打印工序不需要添加物料');
        return;
      }
      
      // 检查工序类型是否为 F
      // if (this.processForm.processType === 'F') {
      //     this.$message.warning('托盘工序不能添加物料');
      //     return;
      // }

      this.materialDialog.title = "新增物料";
      this.materialDialog.visible = true;

      // 重置物料表单所有字段到初始状态
      this.materialForm = {
        materialId: "",
        materialCode: "",
        materialName: "",
        specification: "",
        quantity: 1,
        unit: "个",
        scanOperation: true,
        isComponent: false,
        isPackingBox: false, // 添加包装箱字段重置
        isBatch: false, // 添加批次物料字段重置
        batchQuantity: 0, // 添加批次用量字段重置
        isKey: false, // 添加关键物料字段重置
        isRfid: false, // 添加RFID字段重置
      };

      this.$nextTick(() => {
        this.$refs.materialForm.resetFields();
      });
    },

    async handleEditMaterial(row) {
      if (!row || !row._id) {
        this.$message.error("无效的物料数据");
        return;
      }

      try {
        // 获取最新的物料数据
        const materialResult = await getData("processMaterials", {
          query: { _id: row._id },
        });

        if (!materialResult.data || materialResult.data.length === 0) {
          this.$message.error("未找到物料数据");
          return;
        }

        const currentMaterial = materialResult.data[0];

        this.materialDialog.title = "编辑物料";
        this.materialDialog.visible = true;
        this.editingMaterialId = currentMaterial._id;

        // 填充表单数据
        this.materialForm = {
          materialId: currentMaterial.materialId,
          materialCode: currentMaterial.materialCode,
          materialName: currentMaterial.materialName,
          specification: currentMaterial.specification,
          quantity: currentMaterial.quantity || 1,
          unit: currentMaterial.unit || "个",
          scanOperation: Boolean(currentMaterial.scanOperation),
          isComponent: Boolean(currentMaterial.isComponent),
          isBatch: Boolean(currentMaterial.isBatch),
          isPackingBox: Boolean(currentMaterial.isPackingBox),
          batchQuantity: currentMaterial.batchQuantity || 0,
          isKey: Boolean(currentMaterial.isKey),
          isRfid: Boolean(currentMaterial.isRfid),
        };

        // 初始化物料选项
        const materialDetailResult = await getData("k3_BD_MATERIAL", {
          query: { _id: currentMaterial.materialId },
        });

        if (materialDetailResult.data && materialDetailResult.data.length > 0) {
          this.materialOptions = [materialDetailResult.data[0]];
        }
      } catch (error) {
        console.error("加载物料数据失败:", error);
        this.$message.error("加载物料数据失败");
      }
    },

    handleDeleteMaterial(row) {
      console.log("row", row);

      if (!row || !row._id) {
        this.$message.error("无效物料数据");
        return;
      }

      this.$confirm("确认要删除该物料吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(async () => {
        try {
          await removeData("processMaterials", { query: { _id: row._id } });
          this.$message.success("删除成功");
          this.fetchMaterialData();
        } catch (error) {
          console.error("删除失败:", error);
          this.$message.error("删除失败: " + error.message);
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
        console.log("valid", valid);
        if (valid) {
          try {
            // 添加双向验证
            if (this.materialForm.isBatch && this.materialForm.isKey) {
              this.$message.error("批次物料与关键物料不能同时设置");
              return;
            }

            // 修改重复判断逻辑，排除当前正在编辑的物料
            const isDuplicate = this.materialTableData.tableList.some(
              (item) =>
                item.materialId === this.materialForm.materialId &&
                item._id !== this.editingMaterialId // 排除当前正在编辑的物料
            );

            if (isDuplicate) {
              this.$message.warning("该物料已经被选择，请选择其他物料");
              return;
            }

            // 验证是否与工艺级物料重复
            if (this.materialForm.materialId === this.craftForm.materialId) {
              this.$message.warning("不能选择与工艺相同的物料");
              this.materialForm.materialId = "";
              return;
            }

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
              isPackingBox: this.materialForm.isPackingBox,
              isBatch: this.materialForm.isBatch,
              batchQuantity: this.materialForm.batchQuantity,
              isKey: this.materialForm.isKey,
              isRfid: this.materialForm.isRfid,
              createBy: this.$store.getters.name,
            };

            if (this.materialDialog.title === "新增物料") {
              materialData._id = this.ObjectId();
              await addData("processMaterials", materialData);
            } else {
              let updateReq = {
                query: { _id: this.editingMaterialId },
                update: materialData,
              };
              await updateData("processMaterials", updateReq);
            }

            this.$message.success("操作成功");
            this.materialDialog.visible = false;
            this.fetchMaterialData();
          } catch (error) {
            console.error("提交失败:", error);
            this.$message.error("提交失败");
          } finally {
            this.materialDialog.loading = false;
          }
        }
      });
    },

    handleBatchChange(value) {
      if (this.materialForm.isKey) {
        // 如果已经是关键物料，阻止切换批次物料
        this.$message.warning("关键物料不能设置为批次物料");
        // 保持批次物料的状态为false
        this.$nextTick(() => {
          this.materialForm.isBatch = false;
        });
        return;
      }
      // 正常设置批次物料状态
      this.materialForm.isBatch = value;
    },

    handleKeyChange(value) {
      if (this.materialForm.isBatch) {
        // 如果已经是批次物料，阻止切换关键物料
        this.$message.warning("批次物料不能设置为关键物料");
        // 保持关键物料的状态为false
        this.$nextTick(() => {
          this.materialForm.isKey = false;
        });
        return;
      }
      // 正常设置关键物料状态
      this.materialForm.isKey = value;
    },

    // ================ 其他通用方法 ================
    toggleAdvanced() {
      this.showAdvanced = !this.showAdvanced;
    },

    resetForm() {
      // 重置表单数据
      this.searchForm = {
        craftName: "", // 工艺名称
        craftCode: "", // 工艺编码
        dateRange: [], // 日期范围
        craftType: "", // 工艺类型
        status: "", // 工艺状态
        productName: "", // 产品型号
        productStage: "", // 生产阶级
        isStandard: "", // 是否标准工艺
        selectedMaterial: "", // 选中的物料ID
        materialCode: "", // 物料编码
        materialName: "", // 物料名称
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
        searchData.craftName = {
          $regex: this.searchForm.craftName,
          $options: "i",
        };
      }
      if (this.searchForm.craftCode) {
        searchData.craftCode = {
          $regex: this.searchForm.craftCode,
          $options: "i",
        };
      }
      if (this.searchForm.craftType) {
        searchData.craftType = this.searchForm.craftType;
      }
      if (this.searchForm.status) {
        searchData.status = this.searchForm.status;
      }
      if (this.searchForm.productName) {
        searchData.productName = {
          $regex: this.searchForm.productName,
          $options: "i",
        };
      }
      if (this.searchForm.productStage) {
        searchData.productStage = this.searchForm.productStage;
      }
      if (this.searchForm.isStandard !== "") {
        searchData.isStandard = this.searchForm.isStandard;
      }

      // 处理日期范围
      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        searchData.createAt = {
          $gte: new Date(this.searchForm.dateRange[0]),
          $lte: new Date(this.searchForm.dateRange[1] + " 23:59:59"),
        };
      }

      // 添加物料相关的查询条件
      if (this.searchForm.selectedMaterial) {
        searchData.materialId = this.searchForm.selectedMaterial;
      }
      if (this.searchForm.materialCode) {
        searchData.materialCode = {
          $regex: this.searchForm.materialCode,
          $options: "i",
        };
      }
      if (this.searchForm.materialName) {
        searchData.materialName = {
          $regex: this.searchForm.materialName,
          $options: "i",
        };
      }

      return { query: searchData };
    },

    getStatusType(status) {
      const statusMap = {
        CREATE: "info",
        ENABLE: "success",
        VOID: "danger",
      };
      return statusMap[status] || "info";
    },

    getStatusText(status) {
      const statusMap = {
        CREATE: "创建",
        ENABLE: "启用",
        VOID: "作废",
      };
      return statusMap[status] || "未知";
    },
    // ObjectId生成函数
    ObjectId() {
      const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
      const machineId = Math.floor(Math.random() * 16777216)
        .toString(16)
        .padStart(6, "0");
      const processId = Math.floor(Math.random() * 65536)
        .toString(16)
        .padStart(4, "0");
      const counter = Math.floor(Math.random() * 16777216)
        .toString(16)
        .padStart(6, "0");
      const id = timestamp + machineId + processId + counter;
      // 确保生成的ID是24位的十六进制字符串
      return id.substring(0, 24);
    },
    //设备选择绑定
    handleMachineSelect(value) {
      console.log(value, "value");
      this.devicesList = value;
    },
    // 获取物料列表
    async getMaterialList(query) {
      this.materialLoading = true;
      try {
        let queryCondition = {};

        // 构建基础查询条件
        if (query === "" && this.craftForm.selectedMaterial) {
          queryCondition = { _id: this.craftForm.selectedMaterial };
        } else if (query !== "") {
          queryCondition = {
            $or: [
              { FNumber: { $regex: query, $options: "i" } },
              { FName: { $regex: query, $options: "i" } },
            ],
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
        if (
          this.materialTableData.tableList &&
          this.materialTableData.tableList.length > 0
        ) {
          excludeMaterialIds.push(
            ...this.materialTableData.tableList.map((item) => item.materialId)
          );
        }

        // 如果有需要排除的物料ID，添加到查询条件中
        if (excludeMaterialIds.length > 0) {
          queryCondition._id = {
            $nin: excludeMaterialIds,
          };
        }

        const result = await getData("k3_BD_MATERIAL", {
          query: queryCondition,
          page: 1,
          limit: 20,
        });

        this.materialOptions = result.data;
      } catch (error) {
        console.error("获取物料列表失败:", error);
        this.$message.error("获取物料列表失败");
      } finally {
        this.materialLoading = false;
      }
    },
    // 处理工艺表单的物料选择变更
    handleCraftMaterialChange(material) {
      console.log(material, "material");
      if (material) {
        // 更新工艺表单中的相关字段
        // this.craftForm.materialId = material._id;
        this.craftForm.componentName = material.FName || "";
        this.craftForm.productName = material.FSpecification || "";
        this.craftForm.materialCode = material.FNumber || "";
        // 保持selectedMaterial的值，用于表单验证
        this.craftForm.selectedMaterial = material._id;
      }
    },
    // 处理物料表单的物料选择变更
    handleMaterialChange(material) {
      console.log("material", material);
      // 验证是否已经选择过该物料，排除当前正在编辑的物料
      const isDuplicate = this.materialTableData.tableList.some(
        (item) =>
          item.materialId === material._id &&
          item._id !== this.editingMaterialId // 排除当前正在编辑的物料
      );

      if (isDuplicate) {
        this.$message.warning("该物料已经被选择，请选择其他物料");
        this.materialForm.materialId = "";
        return;
      }

      // 验证是否与工艺级物料重复
      if (material._id === this.craftForm.materialId) {
        this.$message.warning("不能选择与工艺相同的物料");
        this.materialForm.materialId = "";
        return;
      }

      // 如果验证通过，继续原有的处理逻辑
      this.materialForm.materialCode = material.FNumber;
      this.materialForm.materialName = material.FName;
      this.materialForm.specification = material.FSpecification || "";
    },

    // 添加防抖方法
    handleRemoteSearch(query) {
      if (this.searchDebounce) {
        clearTimeout(this.searchDebounce);
      }
      this.searchDebounce = setTimeout(() => {
        this.getMaterialList(query);
      }, 300);
    },
    // 处理物料选择变更
    handleSearchMaterialChange(material) {
      if (material) {
        // this.searchForm.materialCode = material.FNumber;
        // this.searchForm.materialName = material.FName;
        this.search(); // 触发搜索
      }
    },
    // 加工重新排序方法
    async reorderProcessSteps() {
      try {
        // 获取当前工艺的所有工序，按照sort字段排序
        const result = await getData("processStep", {
          query: { craftId: this.tempCraftId },
          sort: { sort: 1 },
        });

        if (!result.data || result.data.length === 0) return;

        // 重新排序
        const updatePromises = result.data.map((process, index) => {
          const newSort = index + 1;
          if (process.sort !== newSort) {
            return updateData("processStep", {
              query: { _id: process._id },
              update: {
                sort: newSort,
                updateBy: this.$store.getters.name,
                updateAt: new Date(),
              },
            });
          }
          return Promise.resolve();
        });

        await Promise.all(updatePromises);

        // 更新工艺的工序列表顺序
        const processIds = result.data.map((process) => process._id);
        await updateData("craft", {
          query: { _id: this.tempCraftId },
          update: {
            processSteps: processIds,
            updateBy: this.$store.getters.name,
            updateAt: new Date(),
          },
        });
      } catch (error) {
        console.error("重新排序失败:", error);
        this.$message.warning("工序重新排序失败");
      }
    },
    initSortable() {
      const tbody = document.querySelector(".el-table__body-wrapper tbody");
      if (!tbody) return;

      Sortable.create(tbody, {
        handle: "[v-drag-handler]",
        animation: 150,
        onEnd: async ({ newIndex, oldIndex }) => {
          const tableData = [...this.processTableData.tableList];
          const moveItem = tableData.splice(oldIndex, 1)[0];
          tableData.splice(newIndex, 0, moveItem);

          try {
            // 更新所有受影响的工序排序
            const updatePromises = tableData.map((process, index) => {
              const newSort = index + 1;
              if (process.sort !== newSort) {
                return updateData("processStep", {
                  query: { _id: process._id },
                  update: {
                    sort: newSort,
                    updateBy: this.$store.getters.name,
                    updateAt: new Date(),
                  },
                });
              }
              return Promise.resolve();
            });

            await Promise.all(updatePromises);

            // 更新工艺的工序列表顺序
            const processIds = tableData.map((process) => process._id);
            await updateData("craft", {
              query: { _id: this.tempCraftId },
              update: {
                processSteps: processIds,
                updateBy: this.$store.getters.name,
                updateAt: new Date(),
              },
            });

            this.$message.success("排序更新成功");
            await this.fetchProcessData(); // 重新获取数据以确保显示正确顺序
          } catch (error) {
            console.error("更新排序失败:", error);
            this.$message.error("更新排序失败");
            await this.fetchProcessData(); // 恢复原始顺序
          }
        },
      });
    },
    async handleMoveUp(row, index) {
      if (index === 0) return; // 如果是第一个，不能上移

      try {
        const currentProcess = this.processTableData.tableList[index];
        const prevProcess = this.processTableData.tableList[index - 1];

        // 交换sort值
        const tempSort = currentProcess.sort;

        // 更新当前工序和前一个工序的排序
        await Promise.all([
          updateData("processStep", {
            query: { _id: currentProcess._id },
            update: {
              sort: prevProcess.sort,
              updateBy: this.$store.getters.name,
              updateAt: new Date(),
            },
          }),
          updateData("processStep", {
            query: { _id: prevProcess._id },
            update: {
              sort: tempSort,
              updateBy: this.$store.getters.name,
              updateAt: new Date(),
            },
          }),
        ]);

        this.$message.success("上移成功");
        await this.fetchProcessData(); // 重新获数据
      } catch (error) {
        console.error("上移失败:", error);
        this.$message.error("上移失败");
      }
    },

    async handleMoveDown(row, index) {
      if (index === this.processTableData.tableList.length - 1) return; // 如果是最后一个，不能下移

      try {
        const currentProcess = this.processTableData.tableList[index];
        const nextProcess = this.processTableData.tableList[index + 1];

        // 交换sort值
        const tempSort = currentProcess.sort;

        // 更新当前工序和后一个工序的排序
        await Promise.all([
          updateData("processStep", {
            query: { _id: currentProcess._id },
            update: {
              sort: nextProcess.sort,
              updateBy: this.$store.getters.name,
              updateAt: new Date(),
            },
          }),
          updateData("processStep", {
            query: { _id: nextProcess._id },
            update: {
              sort: tempSort,
              updateBy: this.$store.getters.name,
              updateAt: new Date(),
            },
          }),
        ]);

        this.$message.success("下移成功");
        await this.fetchProcessData(); // 重新获取数据
      } catch (error) {
        console.error("下移失败:", error);
        this.$message.error("下移失败");
      }
    },

    // 生成工艺编码
    async generateCraftCode() {
      try {
        // 生成新的编码
        const craftType = "0" + this.craftForm.craftType || "";
        const businessType =
          parseInt(this.craftForm.businessType) < 10
            ? "0" + this.craftForm.businessType
            : this.craftForm.businessType;
        this.craftForm.craftCode = `${craftType}${
          businessType ? businessType : ""
        }`;
      } catch (error) {
        console.error("生成工艺编码失败:", error);
        this.$message.error("生成工艺编码失败");
      }
    },

    // 监听工艺类型变化
    async handleCraftTypeChange(value) {
      await this.generateCraftCode();
    },

    // 监听业务类型变化
    async handleBusinessTypeChange(value) {
      await this.generateCraftCode();
    },

    // 添加导出方法
    async handleExport() {
      try {
        this.$message.info("正在准备导出数据，请稍候...");

        // 获取筛选条件下的所有工艺数据
        let searchQuery = this.searchData();
        const craftResult = await getData("craft", {
          ...searchQuery,
          populate: JSON.stringify([{ path: "materialId" }]),
        });

        if (!craftResult.data || craftResult.data.length === 0) {
          this.$message.warning("没有数据可供导出");
          return;
        }

        // 准备导出数据
        const exportData = [];

        // 遍历每个工艺
        for (const craft of craftResult.data) {
          // 获取工艺对应的所有工序
          const processResult = await getData("processStep", {
            query: { craftId: craft._id },
            sort: { sort: 1 },
          });

          // 对每个工序获取其物料信息
          for (const process of processResult.data) {
            const materialResult = await getData("processMaterials", {
              query: { processStepId: process._id },
              populate: JSON.stringify([{ path: "materialId" }]),
            });

            // 如果工序没有物料，也要记录工序信息
            if (materialResult.data.length === 0) {
              exportData.push({
                // 工艺信息
                craftCode: craft.craftCode,
                craftName: craft.craftName,
                craftType: this.getDictLabel(
                  this.dict.type.craftType,
                  craft.craftType
                ),
                craftDesc: craft.craftDesc,
                craftMaterialCode: craft.materialId
                  ? craft.materialId.FNumber
                  : "",
                craftMaterialName: craft.materialId
                  ? craft.materialId.FName
                  : "",
                productStage: craft.productStage,
                status: this.getStatusText(craft.status),
                // 工序信息
                processCode: process.processCode,
                processName: process.processName,
                processType: this.getDictLabel(
                  this.dict.type.processType,
                  process.processType
                ),
                processDesc: process.processDesc,
                processSort: process.sort,
                // 物料信息（空）
                materialCode: "",
                materialName: "",
                specification: "",
                quantity: "",
                unit: "",
                isKey: "",
                isBatch: "",
                batchQuantity: "",
              });
            } else {
              // 有物料的情况，为每个物料创建一条记录
              for (const material of materialResult.data) {
                exportData.push({
                  // 工艺信息
                  craftCode: craft.craftCode,
                  craftName: craft.craftName,
                  craftType: this.getDictLabel(
                    this.dict.type.craftType,
                    craft.craftType
                  ),
                  craftDesc: craft.craftDesc,
                  craftMaterialCode: craft.materialId
                    ? craft.materialId.FNumber
                    : "",
                  craftMaterialName: craft.materialId
                    ? craft.materialId.FName
                    : "",
                  productStage: craft.productStage,
                  status: this.getStatusText(craft.status),
                  // 工序信息
                  processCode: process.processCode,
                  processName: process.processName,
                  processType: this.getDictLabel(
                    this.dict.type.processType,
                    process.processType
                  ),
                  processDesc: process.processDesc,
                  processSort: process.sort,
                  // 物料信息
                  materialCode: material.materialCode,
                  materialName: material.materialName,
                  specification: material.specification,
                  quantity: material.quantity,
                  unit: material.unit,
                  isKey: material.isKey ? "是" : "否",
                  isBatch: material.isBatch ? "是" : "否",
                  batchQuantity: material.batchQuantity || "",
                });
              }
            }
          }
        }

        // 定义Excel的列头
        const header = {
          craftCode: "工艺编码",
          craftName: "工艺名称",
          craftType: "工艺类型",
          craftDesc: "工艺描述",
          craftMaterialCode: "工艺物料编码",
          craftMaterialName: "工艺物料名称",
          productStage: "生产阶级",
          status: "状态",
          processCode: "工序编码",
          processName: "工序名称",
          processType: "工序类型",
          processDesc: "工序描述",
          processSort: "工序顺序",
          materialCode: "物料编码",
          materialName: "物料名称",
          specification: "规格型号",
          quantity: "用量",
          unit: "单位",
          isKey: "关键物料",
          isBatch: "批次物料",
          batchQuantity: "批次用量",
        };

        // 导出Excel
        import("@/vendor/Export2Excel").then((excel) => {
          excel.export_json_to_excel({
            header: Object.values(header),
            data: exportData.map((item) =>
              Object.keys(header).map((key) => item[key])
            ),
            filename: "工艺管理数据",
            autoWidth: true,
            bookType: "xlsx",
          });
          this.$message.success("导出成功");
        });
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败: " + error.message);
      }
    },

    // 添加获取字典标签的辅助方法
    getDictLabel(dict = [], value) {
      const item = dict.find((dict) => dict.value === value);
      return item ? item.label : "";
    },
    // 添加单条数据导出方法
    async handleExportSingle(row) {
      try {
        this.$message.info("正在准备导出数据，请稍候...");

        // 获取完整的工艺数据（包含关联的materialId信息）
        const craftResult = await getData("craft", {
          query: { _id: row._id },
          populate: JSON.stringify([{ path: "materialId" }]),
        });

        if (!craftResult.data || craftResult.data.length === 0) {
          this.$message.warning("未找到工艺数据");
          return;
        }

        const craft = craftResult.data[0];
        const exportData = [];

        // 获取工艺对应的所有工序
        const processResult = await getData("processStep", {
          query: { craftId: craft._id },
          sort: { sort: 1 },
        });

        // 对每个工序获取其物料信息
        for (const process of processResult.data) {
          const materialResult = await getData("processMaterials", {
            query: { processStepId: process._id },
            populate: JSON.stringify([{ path: "materialId" }]),
          });

          // 如果工序没有物料，也要记录工序信息
          if (materialResult.data.length === 0) {
            exportData.push({
              // 工艺信息
              craftCode: craft.craftCode,
              craftName: craft.craftName,
              craftType: this.getDictLabel(
                this.dict.type.craftType,
                craft.craftType
              ),
              craftDesc: craft.craftDesc,
              craftMaterialCode: craft.materialId
                ? craft.materialId.FNumber
                : "",
              craftMaterialName: craft.materialId ? craft.materialId.FName : "",
              productStage: craft.productStage,
              status: this.getStatusText(craft.status),
              // 工序信息
              processCode: process.processCode,
              processName: process.processName,
              processType: this.getDictLabel(
                this.dict.type.processType,
                process.processType
              ),
              processDesc: process.processDesc,
              processSort: process.sort,
              // 物料信息（空）
              materialCode: "",
              materialName: "",
              specification: "",
              quantity: "",
              unit: "",
              isKey: "",
              isBatch: "",
              batchQuantity: "",
            });
          } else {
            // 有物料的情况，为每个物料创建一条记录
            for (const material of materialResult.data) {
              exportData.push({
                // 工艺信息
                craftCode: craft.craftCode,
                craftName: craft.craftName,
                craftType: this.getDictLabel(
                  this.dict.type.craftType,
                  craft.craftType
                ),
                craftDesc: craft.craftDesc,
                craftMaterialCode: craft.materialId
                  ? craft.materialId.FNumber
                  : "",
                craftMaterialName: craft.materialId
                  ? craft.materialId.FName
                  : "",
                productStage: craft.productStage,
                status: this.getStatusText(craft.status),
                // 工序信息
                processCode: process.processCode,
                processName: process.processName,
                processType: this.getDictLabel(
                  this.dict.type.processType,
                  process.processType
                ),
                processDesc: process.processDesc,
                processSort: process.sort,
                // 物料信息
                materialCode: material.materialCode,
                materialName: material.materialName,
                specification: material.specification,
                quantity: material.quantity,
                unit: material.unit,
                isKey: material.isKey ? "是" : "否",
                isBatch: material.isBatch ? "是" : "否",
                batchQuantity: material.batchQuantity || "",
              });
            }
          }
        }

        // 定义Excel的列头
        const header = {
          craftCode: "工艺编码",
          craftName: "工艺名称",
          craftType: "工艺类型",
          craftDesc: "工艺描述",
          craftMaterialCode: "工艺物料编码",
          craftMaterialName: "工艺物料名称",
          productStage: "生产阶级",
          status: "状态",
          processCode: "工序编码",
          processName: "工序名称",
          processType: "工序类型",
          processDesc: "工序描述",
          processSort: "工序顺序",
          materialCode: "物料编码",
          materialName: "物料名称",
          specification: "规格型号",
          quantity: "用量",
          unit: "单位",
          isKey: "关键物料",
          isBatch: "批次物料",
          batchQuantity: "批次用量",
        };

        // 导出Excel
        import("@/vendor/Export2Excel").then((excel) => {
          excel.export_json_to_excel({
            header: Object.values(header),
            data: exportData.map((item) =>
              Object.keys(header).map((key) => item[key])
            ),
            filename: `工艺数据_${craft.craftCode}`,
            autoWidth: true,
            bookType: "xlsx",
          });
          this.$message.success("导出成功");
        });
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败: " + error.message);
      }
    },

    /**
     * 处理导出BOM
     * @param {Object} row - 当前行数据
     */
    async handleExportBOM(row) {
      try {
        this.exportLoading = true;
        this.exportProgress = 0;
        this.exportDialogVisible = true;

        // 调用后端接口获取BOM数据
        const response = await exportBOM(row.materialId._id || row.materialId);

        if (!response.data || response.data.length === 0) {
          this.$message.warning("未找到相关BOM数据");
          this.exportDialogVisible = false;
          return;
        }

        const totalItems = response.data.length;
        const batchSize = 100;
        const exportData = [];

        // 定义Excel表头
        const header = [
          "层级",
          "父物料编码",
          "父物料名称",
          "工序编码",
          "工序名称",
          "工序类型",
          "物料编码",
          "物料名称",
          "规格型号",
          "用量",
          "单位",
          "是否组件",
          "是否关键物料",
          "是否批次物料",
          "批次用量",
          "是否包装箱",
          "是否RFID",
        ];

        // 分批处理数据
        for (let i = 0; i < totalItems; i += batchSize) {
          const batch = response.data.slice(i, i + batchSize).map((item) => {
            // 处理层级缩进
            const levelPrefix = "  ".repeat(item.level);

            return [
              item.level,
              item.parentMaterialCode,
              `${levelPrefix}${item.parentMaterialName}`, // 添加缩进
              item.processCode || "",
              item.processName || "",
              item.processType || "",
              item.materialCode || "",
              item.materialName || "",
              item.specification || "",
              item.quantity || "",
              item.unit || "",
              item.isComponent ? "是" : "否",
              item.isKeyMaterial ? "是" : "否",
              item.isBatch ? "是" : "否",
              item.batchQuantity || "",
              item.isPackingBox ? "是" : "否",
              item.isRfid ? "是" : "否",
            ];
          });

          exportData.push(...batch);

          // 更新进度
          this.exportProgress = Math.round(
            ((i + batch.length) / totalItems) * 100
          );

          // 给UI一个更新的机会
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        // 生成文件名
        const fileName = `${row.craftName || "BOM"}_${
          row.materialCode || ""
        }_${this.parseTime(new Date(), "{y}{m}{d}")}`;

        // 导出Excel
        import("@/vendor/Export2Excel").then((excel) => {
          excel.export_json_to_excel({
            header: header,
            data: exportData,
            filename: fileName,
            autoWidth: true,
            bookType: "xlsx",
          });
          this.exportProgress = 100;
          this.$message.success("BOM导出成功");
        });

        // 延迟关闭对话框
        setTimeout(() => {
          this.exportDialogVisible = false;
          this.exportProgress = 0;
        }, 1000);
      } catch (error) {
        console.error("导出BOM失败:", error);
        this.$message.error("导出BOM失败: " + error.message);
      } finally {
        this.exportLoading = false;
      }
    },

    // 打开复制工艺弹窗
    handleCopy(row) {
      this.copyDialogVisible = true;
      this.copyForm = {
        materialId: "",
        sourceCraftId: row._id,
      };
    },

    // 处理复制工艺的物料选择
    async handleCopyMaterialChange(material) {
      if (!material) return;

      try {
        // 检查物料是否已有工艺
        const existingCraft = await getData("craft", {
          query: {
            materialId: material._id,
            status: { $ne: "VOID" },
          },
        });

        if (existingCraft.data && existingCraft.data.length > 0) {
          this.$message.warning(
            `该物料已存在工艺，工艺名称: ${existingCraft.data[0].craftName}`
          );
          this.copyForm.materialId = "";
          return;
        }
      } catch (error) {
        console.error("检查物料工艺失败:", error);
        this.$message.error("检查物料工艺失败");
      }
    },

    // 提交复制工艺表单
    async submitCopyForm() {
      this.$refs.copyForm.validate(async (valid) => {
        if (!valid) return;

        try {
          this.copyLoading = true;

          // 1. 获取源工艺数据
          const sourceCraftResult = await getData("craft", {
            query: { _id: this.copyForm.sourceCraftId },
            populate: JSON.stringify([{ path: "materialId" }]), // 添加materialId的populate
          });

          if (!sourceCraftResult.data || sourceCraftResult.data.length === 0) {
            throw new Error("未找到源工艺数据");
          }

          const sourceCraft = sourceCraftResult.data[0];

          // 2. 获取目标物料信息
          const targetMaterialResult = await getData("k3_BD_MATERIAL", {
            query: { _id: this.copyForm.materialId },
          });

          if (
            !targetMaterialResult.data ||
            targetMaterialResult.data.length === 0
          ) {
            throw new Error("未找到目标物料数据");
          }

          const targetMaterial = targetMaterialResult.data[0];

          // 3. 创建新工艺
          const newCraftId = this.ObjectId();
          const newCraft = {
            _id: newCraftId,
            craftCode: sourceCraft.craftCode, // 保持原工艺编码
            craftName: `${sourceCraft.craftName}_复制`,
            craftType: sourceCraft.craftType,
            craftDesc: sourceCraft.craftDesc,
            materialId: this.copyForm.materialId,
            // 复制物料相关信息
            materialCode: targetMaterial.FNumber,
            componentName: targetMaterial.FName,
            productName: targetMaterial.FSpecification,
            craftParams: sourceCraft.craftParams,
            processSteps: [],
            productStage: sourceCraft.productStage,
            attachments: sourceCraft.attachments,
            remark: sourceCraft.remark,
            status: "CREATE",
            isStandard: sourceCraft.isStandard,
            businessType: sourceCraft.businessType,
            isProduct: sourceCraft.isProduct,
            createBy: this.$store.getters.name,
            createAt: new Date(),
          };

          // 4. 获取源工艺的所有工序
          const sourceProcessResult = await getData("processStep", {
            query: { craftId: this.copyForm.sourceCraftId },
            sort: { sort: 1 },
          });

          if (
            !sourceProcessResult.data ||
            sourceProcessResult.data.length === 0
          ) {
            throw new Error("源工艺没有工序数据");
          }

          // 5. 复制工序及其物料
          const processPromises = sourceProcessResult.data.map(
            async (sourceProcess, index) => {
              // 生成新的工序编码
              const processSequence = (index + 1).toString().padStart(4, "0");
              const newProcessCode = this.generateUnifiedCode(
                sourceCraft.craftType,
                sourceProcess.processType,
                processSequence,
                sourceProcess.businessType
              );

              // 创建新工序
              const newProcessId = this.ObjectId();
              const newProcess = {
                _id: newProcessId,
                craftId: newCraftId,
                processCode: newProcessCode,
                processName: sourceProcess.processName,
                processDesc: sourceProcess.processDesc,
                processStage: sourceProcess.processStage,
                processType: sourceProcess.processType,
                businessType: sourceProcess.businessType,
                machineId: sourceProcess.machineId,
                status: "CREATE",
                materials: [],
                remark: sourceProcess.remark,
                sort: sourceProcess.sort,
                isMES: sourceProcess.isMES,
                createBy: this.$store.getters.name,
                createAt: new Date(),
              };

              try {
                // 获取源工序的物料
                const sourceMaterialsResult = await getData(
                  "processMaterials",
                  {
                    query: { processStepId: sourceProcess._id },
                  }
                );

                if (
                  sourceMaterialsResult.data &&
                  sourceMaterialsResult.data.length > 0
                ) {
                  // 复制物料
                  const materialPromises = sourceMaterialsResult.data.map(
                    async (sourceMaterial) => {
                      const newMaterialId = this.ObjectId();
                      const newMaterial = {
                        _id: newMaterialId,
                        craftId: newCraftId,
                        processStepId: newProcessId,
                        materialId: sourceMaterial.materialId,
                        materialCode: sourceMaterial.materialCode,
                        materialName: sourceMaterial.materialName,
                        specification: sourceMaterial.specification,
                        quantity: sourceMaterial.quantity,
                        unit: sourceMaterial.unit,
                        scanOperation: sourceMaterial.scanOperation,
                        isComponent: sourceMaterial.isComponent,
                        isPackingBox: sourceMaterial.isPackingBox,
                        isBatch: sourceMaterial.isBatch,
                        batchQuantity: sourceMaterial.batchQuantity,
                        isKey: sourceMaterial.isKey,
                        isRfid: sourceMaterial.isRfid,
                        createBy: this.$store.getters.name,
                        createAt: new Date(),
                      };

                      try {
                        await addData("processMaterials", newMaterial);
                        return newMaterialId;
                      } catch (error) {
                        console.error("添加工序物料失败:", error);
                        return null;
                      }
                    }
                  );

                  const newMaterialIds = await Promise.all(materialPromises);
                  newProcess.materials = newMaterialIds.filter(
                    (id) => id !== null
                  );
                }

                // 保存新工序
                await addData("processStep", newProcess);
                return newProcessId;
              } catch (error) {
                console.error("复制工序失败:", error);
                return null;
              }
            }
          );

          const newProcessIds = await Promise.all(processPromises);
          newCraft.processSteps = newProcessIds.filter((id) => id !== null);

          // 6. 保存新工艺
          await addData("craft", newCraft);

          this.$message.success("工艺复制成功");
          this.copyDialogVisible = false;
          this.fetchCraftData();
        } catch (error) {
          console.error("复制工艺失败:", error);
          this.$message.error("复制工艺失败: " + error.message);
        } finally {
          this.copyLoading = false;
        }
      });
    },
    // 获取设备详情
    async fetchDeviceDetails() {
      try {
        // 获取关联设备详情
        if (
          this.processForm.machineIds &&
          this.processForm.machineIds.length > 0
        ) {
          const relatedDevicesResult = await getData("machine", {
            query: { _id: { $in: this.processForm.machineIds } },
          });

          if (
            relatedDevicesResult.data &&
            relatedDevicesResult.data.length > 0
          ) {
            this.devicesList = relatedDevicesResult.data;
          }
        }
      } catch (error) {
        console.error("获取设备详情失败:", error);
      }
    },

    // 修改created钩子，初始化时获取设备列表
    created() {
      this.fetchDeviceDetails();
    },
  },
  created() {
    this.fetchCraftData();
  },
  mounted() {
    this.initSortable();

    const roles = this.$store.getters.roles;
    if (!roles || !roles.buttonList) {
      return false;
    }
    if (roles.buttonList.includes("one_click_production")) {
      this.hasOneKeyProductionPermission = true;
    }
  },
  computed: {
    // ... existing computed properties ...
  },
  watch: {
    dialogFormVisible(val) {
      // 弹窗关闭时重置表单
      if (!val) {
        this.resetCraftForm();
      }
    },
    // "processForm.processType": function (val) {
    //   if (val === "G") {
    //     // 清空打印模版的值
    //     this.processForm.printTemplateId = "";
    //   }
    // },
    // "processForm.printTemplateId": function (val) {
    //   if (this.processForm.processType === "G" && !val) {
    //     this.$message.info("打印工序需要选择打印模版");
    //   }
    // },
  },
};
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

.select-option {
  padding: 8px 12px;

  .option-main {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .option-label {
      font-size: 14px;
      color: #606266;
    }

    .option-tag {
      margin-left: 8px;
      font-size: 12px;
    }
  }

  .option-sub {
    margin-top: 4px;
    color: #909399;
    font-size: 12px;
  }
}

.item-option {
  padding: 8px 12px;

  .item-info {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .name {
      font-size: 14px;
      color: #606266;
    }

    .el-tag {
      margin-left: 8px;
    }
  }

  .sub-info {
    margin-top: 4px;
    color: #909399;
    font-size: 12px;
  }
}

.device-info-container {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.device-info-header {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 15px;
  display: flex;
  align-items: center;

  .el-tag {
    margin-left: 10px;
  }
}

.device-list {
  display: flex;
  flex-wrap: wrap;
}

.device-tag {
  margin: 0 10px 10px 0;
  padding: 5px 10px;
  display: flex;
  align-items: center;

  i {
    margin-right: 5px;
  }

  .el-tag {
    margin-left: 5px;
  }
}

.device-card {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
}

.device-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.device-name {
  font-size: 14px;
  font-weight: bold;
}

.device-card-content {
  font-size: 12px;
  color: #606266;
}

.device-cards-container {
  display: flex;
  flex-wrap: wrap;
}

.device-card {
  width: calc(33.33% - 20px);
  margin: 10px;
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>