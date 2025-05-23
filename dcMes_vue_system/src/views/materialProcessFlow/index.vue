<template>
  <div class="app-container">
    <!-- 搜索卡片 -->
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
            <el-form-item label="产品条码">
              <el-input
                v-model="searchForm.barcode"
                placeholder="请输入产品条码"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="物料编码">
              <el-input
                v-model="searchForm.materialCode"
                placeholder="请输入物料编码"
                clearable
              ></el-input>
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
                sub-key="FBillNo"
                :multiple="false"
                placeholder="请输入销售单号"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.FBillNo }}</span>
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.FBillNo }} - {{ item.FSaleOrgId_FName }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="生产订单">
              <zr-select
                v-model="searchForm.productionOrderNo"
                collection="k3_PRD_MO"
                :search-fields="['FBillNo']"
                label-key="FBillNo"
                value-key="FBillNo"
                sub-key="FBillNo"
                :multiple="false"
                placeholder="请输入生产单号"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.FBillNo }}</span>
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.FBillNo }} - {{ item.FUseOrgId_FName }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="生产计划工单">
              <zr-select
                v-model="searchForm.productionPlanWorkOrderId"
                collection="production_plan_work_order"
                :search-fields="['workOrderNo']"
                label-key="workOrderNo"
                value-key="_id"
                sub-key="materialNumber"
                :multiple="false"
                placeholder="请选择生产计划工单"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.workOrderNo }}</span>
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.materialNumber }} - {{ item.fSpecification }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="产品型号">
              <el-input
                v-model="searchForm.productModel"
                placeholder="请输入产品型号"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="业务类型">
              <el-select
                v-model="searchForm.businessType"
                placeholder="请选择业务类型"
                clearable
                style="width: 100%"
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
          <el-col :span="6">
            <el-form-item label="流程状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择流程状态"
                clearable
                style="width: 100%"
              >
                <el-option label="待处理" value="PENDING" />
                <el-option label="进行中" value="IN_PROCESS" />
                <el-option label="已完成" value="COMPLETED" />
                <el-option label="异常" value="ABNORMAL" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="产品状态">
              <el-select
                v-model="searchForm.productStatus"
                placeholder="请选择产品状态"
                clearable
                style="width: 100%"
              >
                <el-option label="正常" value="NORMAL" />
                <el-option label="维修中" value="REPAIRING" />
                <el-option label="报废" value="SCRAP" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="托盘编号">
              <el-input
                v-model="searchForm.palletCode"
                placeholder="请输入托盘编号"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开始时间">
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

        <div v-show="showAdvanced">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="完成进度">
                <el-input
                  v-model="searchForm.minProgress"
                  placeholder="最小进度"
                  style="width: 130px;"
                  @input="validateNumber('minProgress')"
                ></el-input>
                <span style="margin: 0 10px;">至</span>
                <el-input
                  v-model="searchForm.maxProgress"
                  placeholder="最大进度"
                  style="width: 130px;"
                  @input="validateNumber('maxProgress')"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-form-item>
          <el-button type="primary" @click="search" >查询搜索</el-button>
          <el-button @click="resetForm" >重置</el-button>
          <el-button type="primary" @click="openBarcodeSearch"
                     v-if="$checkPermission('条码记录成品追溯')"
            >成品追溯</el-button
          >
          <el-button
            type="primary"
            @click="openSaleOrderExportDialog"
            v-if="$checkPermission('销售订单导出')"
          >
            销售订单导出
          </el-button>
          <!-- <el-button type="success" @click="exportData">导出数据</el-button> -->
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表标题区 -->
    <div class="screen1">
      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-tickets">产品条码生产流程列表</i>
          <div>
            <el-button type="primary" @click="handleAllExcel"
              >导出数据表</el-button
            >
            <el-button type="primary" @click="handleAllExport" v-if="$checkPermission('条码记录批量导出数据')"
              >批量导出数据</el-button
            >
            <el-button
              type="primary"
              v-if="$checkPermission('条码记录批量修复异常节点')"
              @click="handleBatchAutoFixInconsistentProcessNodes"
              >批量修复异常节点</el-button
            >
            <el-button
              type="primary"
              v-if="$checkPermission('条码记录批量修复流程进度')"
              @click="handleBatchFixFlowProgress"
              >批量修复流程进度</el-button
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 表格区域 -->
    <base-table
      ref="baseTable"
      :currentPage="currentPage"
      :highlight-current-row="true"
      :pageSize="pageSize"
      :tableData="tableList"
      :tableDataloading="listLoading"
      :total="total"
      @selection-change="handleSelectionChange"
      @handleCurrentChange="baseTableHandleCurrentChange"
      :cell-style="{ textAlign: 'center' }"
      @handleSizeChange="baseTableHandleSizeChange"
    >
      <template slot="law">
        <el-table-column
          type="selection"
          width="55"
          align="center"
        ></el-table-column>
        <el-table-column label="产品条码" prop="barcode">
          <template slot-scope="scope">
            {{ scope.row.barcode }}
          </template>
        </el-table-column>

        <el-table-column label="物料信息">
          <template slot-scope="scope">
            <div>编码：{{ scope.row.materialCode }}</div>
            <div>名称：{{ scope.row.materialName }}</div>
            <div>规格：{{ scope.row.materialSpec }}</div>
          </template>
        </el-table-column>

        <el-table-column label="流程状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getProcessStatusType(scope.row.status)">
              {{ getProcessStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="产品状态" width="100">
          <template slot-scope="scope">
            <el-tag
              :type="getProductStatusType(scope.row.productStatus || 'NORMAL')"
            >
              {{ getProductStatusText(scope.row.productStatus || "NORMAL") }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="完成进度" width="200">
          <template slot-scope="scope">
            <el-progress :percentage="scope.row.progress || 0"></el-progress>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="200">
          <template slot-scope="scope">
            {{ formatDate(scope.row.startTime) || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="200">
          <template slot-scope="scope">
            {{ formatDate(scope.row.endTime) || "-" }}
          </template>
        </el-table-column>

        <el-table-column label="工单信息" width="150">
          <template slot-scope="scope">
            <div v-if="scope.row.productionPlanWorkOrderId">
              <el-link type="primary" @click="handleView(scope.row)">
                {{ scope.row.productionPlanWorkOrderId.workOrderNo }}
              </el-link>
              <el-tag
                size="mini"
                :type="
                  getWorkOrderStatusType(
                    scope.row.productionPlanWorkOrderId.status
                  )
                "
              >
                {{
                  getWorkOrderStatusText(
                    scope.row.productionPlanWorkOrderId.status
                  )
                }}
              </el-tag>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="订单信息" width="200">
          <template slot-scope="scope">
            <div v-if="scope.row.productionPlanWorkOrderId">
              <div>
                <span>销售单号：</span>
                <el-tag size="mini" type="info">
                  {{ scope.row.productionPlanWorkOrderId.saleOrderNo || "-" }}
                </el-tag>
              </div>
              <div>
                <span>生产单号：</span>
                <el-tag size="mini" type="info">
                  {{
                    scope.row.productionPlanWorkOrderId.productionOrderNo || "-"
                  }}
                </el-tag>
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- <el-table-column label="生产数量" width="200">
                    <template slot-scope="scope">
                        <div v-if="scope.row.productionPlanWorkOrderId">
                            <div>计划数量：{{ scope.row.productionPlanWorkOrderId.planQuantity || 0 }}</div>
                            <div>工单数量：{{ scope.row.productionPlanWorkOrderId.planProductionQuantity || 0 }}</div>
                            <div>
                                <el-tooltip content="投入数量/产出数量" placement="top">
                                    <div>
                                        <span>{{ scope.row.productionPlanWorkOrderId.inputQuantity || 0 }}</span>
                                        <span> / </span>
                                        <span>{{ scope.row.productionPlanWorkOrderId.outputQuantity || 0 }}</span>
                                    </div>
                                </el-tooltip>
                            </div>
                        </div>
                        <span v-else>-</span>
                    </template>
                </el-table-column> -->

        <el-table-column label="操作" fixed="right" width="200">
          <template slot-scope="scope">
            <el-button type="text" size="small"  @click="handleView(scope.row)"
              >查看</el-button
            >
            <el-button
              type="text"
              size="small"
              v-if="$checkPermission('条码记录更新流程节点')"
              @click="handleUpdateFlowNodes(scope.row)"
              >更新流程节点</el-button
            >
            <el-button
              type="text"
              size="small"
              v-if="$checkPermission('条码记录修复异常节点')"
              @click="handleAutoFixInconsistentProcessNodes(scope.row)"
            >
              修复异常节点
            </el-button>
            <el-button
              type="text"
              size="small"
              v-if="$checkPermission('条码记录修复异常节点')"
              @click="handleFixFlowProgress(scope.row)"
            >
              修复流程进度
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="handleSingleMainExport(scope.row)"
            >
              导出条码数据
            </el-button>
          </template>
        </el-table-column>
      </template>
    </base-table>

    <!-- 在template最后添加弹窗组件 -->
    <el-dialog
      :title="'工艺流程详情 - ' + dataForm.barcode"
      :visible.sync="dialogFormVisible"
      width="80%"
      class="process-flow-dialog"
      :close-on-click-modal="false"
      :before-close="handleDialogClose"
      @closed="handleDialogClosed"
    >
      <div class="process-flow-container">
        <!-- 右侧工序流程 -->
        <div class="process-section">
          <el-card class="process-card">
            <div slot="header">
              <span><i class="el-icon-time"></i> 工艺流程</span>
            </div>

            <div class="process-flow">
              <!-- 主产品物料信息 -->
              <div class="main-material">
                <div class="main-material-header">
                  <i class="el-icon-box"></i>
                  <span class="title">主产品信息</span>
                  <el-tag type="primary" size="mini">{{
                    dataForm.materialCode
                  }}</el-tag>
                </div>
                <div class="main-material-content">
                  <div class="info-row">
                    <div class="info-item">
                      <label>产品条码：</label>
                      <span>{{ dataForm.barcode }}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-item">
                      <label>物料名称：</label>
                      <span>{{ dataForm.materialName }}</span>
                    </div>
                    <div class="info-item">
                      <label>规格型号：</label>
                      <span>{{ dataForm.materialSpec }}</span>
                    </div>
                    <!-- <div class="info-item">
                                            <label>工艺版本：</label>
                                            <span>{{ dataForm.craftVersion }}</span>
                                        </div> -->
                  </div>
                  <div class="info-row">
                    <div class="info-item">
                      <label>整体进度：</label>
                      <el-progress
                        :percentage="dataForm.progress || 0"
                      ></el-progress>
                    </div>
                    <div class="info-item">
                      <label>当前状态：</label>
                      <el-tag :type="getProcessStatusType(dataForm.status)">
                        {{ getProcessStatusText(dataForm.status) }}
                      </el-tag>
                    </div>
                    <div class="info-item">
                      <label>产品状态：</label>
                      <el-tag
                        :type="
                          getProductStatusType(
                            dataForm.productStatus || 'NORMAL'
                          )
                        "
                      >
                        {{
                          getProductStatusText(
                            dataForm.productStatus || "NORMAL"
                          )
                        }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>

              <el-tabs v-model="activeTab" type="border-card">
                <!-- 工序信息 -->
                <el-tab-pane label="工序信息" name="process">
                  <process-step-list
                    ref="processStepList"
                    :loading="listLoading"
                    :flow-data="processedFlowChartData"
                  >
                  </process-step-list>
                </el-tab-pane>

                <!-- 物料信息 -->
                <el-tab-pane label="物料信息" name="material">
                  <div class="material-info-container">
                    <!-- 表格标题区 -->
                    <div class="table-header">
                      <i class="el-icon-box"></i>
                      <span>工艺物料清单</span>
                    </div>

                    <!-- 表格区域 -->
                    <el-table
                      :data="
                        processedFlowChartData[0] &&
                        processedFlowChartData[0].children
                          ? processedFlowChartData[0].children.filter(
                              (item) => item.nodeType === 'PROCESS_STEP'
                            )
                          : []
                      "
                      border
                      class="material-table"
                      :header-cell-style="{
                        background: '#f5f7fa',
                        color: '#606266',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        textAlign: 'center',
                        height: '50px',
                      }"
                      :cell-style="{
                        textAlign: 'center',
                      }"
                    >
                      <el-table-column label="工序" width="300">
                        <template slot-scope="scope">
                          <div class="process-info">
                            <el-tag
                              size="medium"
                              :type="getProcessStatusType(scope.row.status)"
                            >
                              {{ scope.row.processName }}
                              <el-tag size="mini" type="info">{{
                                scope.row.processCode
                              }}</el-tag>
                            </el-tag>
                          </div>
                        </template>
                      </el-table-column>

                      <el-table-column label="关联物料">
                        <template slot-scope="scope">
                          <el-table
                            v-if="
                              scope.row.children && scope.row.children.length
                            "
                            :data="
                              scope.row.children.filter(
                                (item) => item.nodeType === 'MATERIAL'
                              )
                            "
                            border
                            class="inner-table"
                          >
                            <el-table-column
                              label="物料编码"
                              prop="materialCode"
                              min-width="120"
                            >
                            </el-table-column>
                            <el-table-column
                              label="物料名称"
                              prop="materialName"
                              min-width="150"
                            >
                            </el-table-column>
                            <el-table-column
                              label="规格型号"
                              prop="materialSpec"
                              min-width="120"
                            >
                            </el-table-column>
                            <el-table-column label="数量" width="80">
                              <template slot-scope="innerScope">
                                {{ innerScope.row.materialQuantity }}
                                {{ innerScope.row.materialUnit }}
                              </template>
                            </el-table-column>
                            <el-table-column label="状态" width="100">
                              <template slot-scope="innerScope">
                                <el-tag
                                  :type="
                                    getProcessStatusType(innerScope.row.status)
                                  "
                                  size="small"
                                >
                                  {{
                                    getProcessStatusText(innerScope.row.status)
                                  }}
                                </el-tag>
                              </template>
                            </el-table-column>
                            <el-table-column label="条码" min-width="150">
                              <template slot-scope="innerScope">
                                <span v-if="innerScope.row.barcode">{{
                                  innerScope.row.barcode
                                }}</span>
                                <span v-else class="no-barcode">-</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="关联单据" min-width="200">
                              <template slot-scope="innerScope">
                                <template v-if="innerScope.row.relatedBill">
                                  <div>
                                    <span
                                      >单号：{{
                                        innerScope.row.relatedBill
                                      }}</span
                                    >
                                    <el-tag
                                      v-if="
                                        innerScope.row.purchaseInfo &&
                                        innerScope.row.purchaseInfo.supplierName
                                      "
                                      size="mini"
                                      type="success"
                                    >
                                      {{
                                        innerScope.row.purchaseInfo.supplierName
                                      }}
                                    </el-tag>
                                  </div>
                                  <div
                                    v-if="innerScope.row.purchaseInfo"
                                    class="supplier-info"
                                  >
                                    <span>供应商编码：</span>
                                    <span class="supplier-code">{{
                                      innerScope.row.purchaseInfo.supplierCode
                                    }}</span>
                                  </div>
                                </template>
                                <span v-else class="no-barcode">-</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="类型" width="100">
                              <template slot-scope="innerScope">
                                <el-tag
                                  v-if="innerScope.row.isComponent"
                                  type="warning"
                                  size="mini"
                                  >组件</el-tag
                                >
                                <el-tag
                                  v-if="innerScope.row.isKeyMaterial"
                                  type="danger"
                                  size="mini"
                                  >关键</el-tag
                                >
                                <span
                                  v-if="
                                    !innerScope.row.isComponent &&
                                    !innerScope.row.isKeyMaterial
                                  "
                                  >-</span
                                >
                              </template>
                            </el-table-column>
                          </el-table>
                          <div v-else class="no-material">暂无关联物料</div>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="120" fixed="right">
                        <template slot-scope="scope">
                          <el-button
                            type="text"
                            size="small"
                            @click="handleUnbind(scope.row)"
                            >解绑</el-button
                          >
                          <el-button
                            v-if="
                              scope.row.children &&
                              scope.row.children.some(
                                (item) => item.nodeType === 'MATERIAL'
                              )
                            "
                            type="text"
                            size="small"
                            @click="handleReplaceComponent(scope.row)"
                            >替换</el-button
                          >
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-tab-pane>

                <!-- 物料条码信息 -->
                <el-tab-pane label="物料条码信息" name="materialBarcode">
                  <el-table
                    :data="processedMaterialBarcodeData"
                    border
                    :header-cell-style="{
                      background: '#f5f7fa',
                      color: '#606266',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }"
                    :cell-style="{ textAlign: 'center' }"
                  >
                    <el-table-column
                      label="条码"
                      prop="barcode"
                      min-width="150"
                    ></el-table-column>
                    <el-table-column
                      label="物料编码"
                      prop="materialCode"
                      min-width="120"
                    ></el-table-column>
                    <el-table-column
                      label="物料名称"
                      prop="materialName"
                      min-width="150"
                    ></el-table-column>
                    <el-table-column
                      label="规格型号"
                      prop="materialSpec"
                      min-width="120"
                    ></el-table-column>
                    <el-table-column
                      label="相关单号"
                      prop="relatedBill"
                      min-width="120"
                    ></el-table-column>
                    <el-table-column
                      label="供应商"
                      prop="purchaseInfo"
                      min-width="120"
                    >
                      <template slot-scope="scope">
                        <el-tag
                          v-if="
                            scope.row.purchaseInfo &&
                            scope.row.purchaseInfo.supplierName
                          "
                          size="mini"
                          type="success"
                        >
                          {{ scope.row.purchaseInfo.supplierName }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="状态" width="100">
                      <template slot-scope="scope">
                        <el-tag :type="getProcessStatusType(scope.row.status)">
                          {{ getProcessStatusText(scope.row.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="所属工序" min-width="120">
                      <template slot-scope="scope">
                        <el-tag size="medium" type="info">
                          {{ scope.row.processName }}
                          <el-tag
                            size="mini"
                            type="info"
                            v-if="scope.row.processCode"
                          >
                            {{ scope.row.processCode }}
                          </el-tag>
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="扫码时间" width="160">
                      <template slot-scope="scope">
                        {{ formatDate(scope.row.scanTime) }}
                      </template>
                    </el-table-column>
                    <!-- <el-table-column label="绑定人员" prop="bindOperator" width="100"></el-table-column>
                                        <el-table-column label="备注" min-width="150">
                                            <template slot-scope="scope">
                                                <el-tooltip v-if="scope.row.remark" :content="scope.row.remark"
                                                    placement="top">
                                                    <span>{{ scope.row.remark }}</span>
                                                </el-tooltip>
                                                <span v-else>-</span>
                                            </template>
                                        </el-table-column> -->
                  </el-table>
                </el-tab-pane>

                <!-- 检测信息 -->
                <el-tab-pane label="检测信息" name="inspection">
                  <inspection-list :inspections="dataForm"></inspection-list>
                </el-tab-pane>

                <!-- 解绑信息 -->
                <el-tab-pane label="解绑信息" name="unbind">
                  <el-table
                    :data="unbindRecord || []"
                    border
                    :header-cell-style="{
                      background: '#f5f7fa',
                      color: '#606266',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }"
                    :cell-style="{ textAlign: 'center' }"
                  >
                    <el-table-column label="解绑时间" width="160">
                      <template slot-scope="scope">
                        {{ formatDate(scope.row.operateTime) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="工序信息" min-width="150">
                      <template slot-scope="scope">
                        <el-tag size="medium" type="info">
                          {{ scope.row.processName }}
                          <el-tag
                            size="mini"
                            type="info"
                            v-if="scope.row.processCode"
                          >
                            {{ scope.row.processCode }}
                          </el-tag>
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="解绑物料" min-width="200">
                      <template slot-scope="scope">
                        <el-table
                          v-if="
                            scope.row.unbindMaterials &&
                            scope.row.unbindMaterials.length
                          "
                          :data="scope.row.unbindMaterials"
                          border
                          size="mini"
                          class="inner-table"
                        >
                          <el-table-column
                            label="物料编码"
                            prop="materialCode"
                            min-width="120"
                          >
                          </el-table-column>
                          <el-table-column
                            label="物料名称"
                            prop="materialName"
                            min-width="150"
                          >
                          </el-table-column>
                          <el-table-column
                            label="原条码"
                            prop="originalBarcode"
                            min-width="150"
                          >
                          </el-table-column>
                        </el-table>
                        <span v-else>-</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="解绑原因" min-width="150">
                      <template slot-scope="scope">
                        <el-tooltip
                          v-if="scope.row.reason"
                          :content="scope.row.reason"
                          placement="top"
                        >
                          <span>{{ scope.row.reason }}</span>
                        </el-tooltip>
                        <span v-else>-</span>
                      </template>
                    </el-table-column>
                    <!-- <el-table-column label="操作人" prop="operatorId" width="100"></el-table-column> -->
                  </el-table>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-card>
        </div>
      </div>
    </el-dialog>

    <!-- 添加条码搜索弹窗 -->
    <el-dialog
      title="条码查询"
      :visible.sync="barcodeSearchVisible"
      width="70%"
      :close-on-click-modal="false"
    >
      <div class="barcode-search-container">
        <!-- 搜索区域 -->
        <div class="search-area">
          <el-input
            v-model="searchBarcode"
            placeholder="请输入条码"
            clearable
            @keyup.enter.native="handleBarcodeSearch"
          >
            <el-button
              slot="append"
              icon="el-icon-search"
              @click="handleBarcodeSearch"
            >
              搜索
            </el-button>
          </el-input>
        </div>

        <!-- 搜索结果表格 -->
        <div class="search-result" v-loading="searchLoading">
          <el-table
            v-if="searchResults.length"
            :data="searchResults"
            border
            style="width: 100%"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: 'bold',
              textAlign: 'center',
            }"
            :cell-style="{ textAlign: 'center' }"
          >
            <!-- <el-table-column label="条码类型" width="120">
                            <template slot-scope="scope">
                                <el-tag :type="scope.row.isMainBarcode ? 'primary' : 'success'">
                                    {{ scope.row.isMainBarcode ? '产品条码' : '子条码' }}
                                </el-tag>
                            </template>
                        </el-table-column> -->
            <el-table-column
              label="条码"
              prop="barcode"
              min-width="150"
            ></el-table-column>
            <el-table-column label="物料信息" min-width="200">
              <template slot-scope="scope">
                <div>编码：{{ scope.row.materialCode }}</div>
                <div>名称：{{ scope.row.materialName }}</div>
                <div>规格：{{ scope.row.materialSpec }}</div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template slot-scope="scope">
                <el-tag :type="getProcessStatusType(scope.row.status)">
                  {{ getProcessStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="完成进度" width="200">
              <template slot-scope="scope">
                <el-progress
                  :percentage="scope.row.progress || 0"
                ></el-progress>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" @click="handleView(scope.row)">
                  查看详情
                </el-button>

                <el-button
                  type="text"
                  style="color: red"

                  @click="handleInit(scope.row)"
                  >成品初始化</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <div v-else-if="!searchLoading" class="no-result">
            <i class="el-icon-warning-outline"></i>
            <span>暂无搜索结果</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 导出选项弹窗 -->
    <el-dialog
      title="导出选项"
      :visible.sync="exportDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="exportForm" label-width="0px" class="export-form">
        <el-form-item>
          <el-radio-group
            v-model="exportForm.exportOption"
            class="export-radio-group"
          >
            <el-radio-button label="search" class="export-radio-button">
              <i class="el-icon-search"></i>
              <span>导出搜索结果</span>
            </el-radio-button>
            <el-radio-button label="all" class="export-radio-button">
              <i class="el-icon-document"></i>
              <span>导出全部数据</span>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="exportDialogVisible = false">取 消</el-button>
        <el-button
          type="primary"
          @click="confirmExport"
          :loading="exportLoading"
        >
          确 定
        </el-button>
      </div>
    </el-dialog>

    <!-- 添加物料替换弹窗 -->
    <el-dialog
      title="物料替换"
      :visible.sync="replaceDialogVisible"
      append-to-body
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="replaceSelectedNode">
        <div class="replace-info">
          <el-alert
            title="请注意：替换物料前必须创建部件替换的维修记录"
            type="warning"
            :closable="false"
            show-icon
          >
          </el-alert>

          <div class="material-info-box">
            <h4>当前工序：{{ replaceSelectedNode.processName }}</h4>
            <div class="material-list">
              <el-radio-group v-model="replaceSelectedMaterial">
                <div
                  v-for="(material, index) in replaceMaterials"
                  :key="index"
                  class="material-item"
                >
                  <el-radio :label="material.nodeId">
                    <div class="material-detail">
                      <span
                        >{{ material.materialCode }} -
                        {{ material.materialName }}</span
                      >
                      <span>规格：{{ material.materialSpec }}</span>
                      <span>条码：{{ material.barcode || "未绑定" }}</span>
                    </div>
                  </el-radio>
                </div>
              </el-radio-group>
            </div>
          </div>

          <el-form
            :model="replaceForm"
            label-width="100px"
            class="replace-form"
          >
            <el-form-item label="新物料条码">
              <el-input
                v-model="replaceForm.newBarcode"
                placeholder="请扫描或输入新的物料条码"
                @keyup.enter.native="validateReplaceBarcode"
              ></el-input>
            </el-form-item>
            <el-form-item v-if="replaceForm.validationMessage">
              <el-tag
                :type="replaceForm.validationStatus ? 'success' : 'danger'"
              >
                {{ replaceForm.validationMessage }}
              </el-tag>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="replaceDialogVisible = false">取 消</el-button>
        <el-button
          type="primary"
          @click="confirmReplaceComponent"
          :disabled="!replaceForm.validationStatus || replaceLoading"
          :loading="replaceLoading"
        >
          确认替换
        </el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="销售订单导出"
      :visible.sync="saleOrderExportDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form>
        <el-form-item label="销售订单">
          <zr-select
            v-model="selectedSaleOrderNo"
            collection="k3_SAL_SaleOrder"
            :search-fields="['FBillNo']"
            label-key="FBillNo"
            value-key="FBillNo"
            sub-key="FBillNo"
            :multiple="false"
            placeholder="请输入销售单号"
            clearable
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="saleOrderExportDialogVisible = false">取 消</el-button>
        <el-button
          type="primary"
          :loading="saleOrderExportLoading"
          @click="confirmSaleOrderExport"
          :disabled="!selectedSaleOrderNo"
        >确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import ProcessStepList from "@/components/ProcessStepList/index.vue";
import InspectionList from "@/components/InspectionList/index.vue";
import {
  unbindComponents,
  updateFlowNodes,
  autoFixInconsistentProcessNodes,
  fixFlowProgress,
  replaceComponent, // 添加新的API引入
  initializeProduct, // 添加新的API引入
  exportBySaleOrder
} from "@/api/materialProcessFlowService";
import XLSX from "xlsx";
import JSZip from "jszip";
import FileSaver from "file-saver";
import { query } from "quill";

export default {
  name: "materialProcessFlow",
  components: {
    ProcessStepList,
    InspectionList,
  },
  dicts: ["businessType"],
  data() {
    return {
      searchForm: {
        barcode: "",
        materialCode: "",
        saleOrderNo: "",
        productionOrderNo: "",
        productModel: "",
        businessType: "",
        status: "",
        productStatus: "",
        dateRange: [],
        minProgress: "",
        maxProgress: "",
        workOrderNo: "",
        productionPlanWorkOrderId: "",
        palletCode: "",
      },
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: true,
      showAdvanced: false,
      dialogFormVisible: false,
      dialogStatus: "",
      selection: [],
      // 添加权限控制变量
      hasFinishedBarcodeInitialization: false, // 成品条码初始化权限
      hasRepairProcessNodes: false, // 修复流程节点权限
      hasFixAbnormalNodes: false, // 修复异常节点权限
      hasUpdateProcessNodes: false, // 更新流程节点权限
      dataForm: {
        barcode: "",
        materialCode: "",
        materialName: "",
        materialSpec: "",
        craftVersion: "",
        startTime: null,
        planCompletionTime: null,
        endTime: null,
        status: "PENDING",
        progress: 0,
        processNodes: [],
        remark: "",
      },
      rules: {
        FCustomerName: [
          { required: true, message: "请输入客户名称", trigger: "blur" },
        ],
        FDate: [
          { required: true, message: "请选择订单日期", trigger: "change" },
        ],
        FSaleDeptName: [
          { required: true, message: "请输入销售部门", trigger: "blur" },
        ],
      },
      processedFlowChartData: [], // 处理后的流程图数据
      activeTab: "process",
      barcodeSearchVisible: false,
      searchBarcode: "",
      searchResults: [],
      searchLoading: false,
      unbindRecord: [], // 解绑记录
      exportDialogVisible: false, // 导出选项弹窗显示状态
      exportForm: {
        exportOption: "current", // 默认选择当前页
      },
      exportLoading: false, // 导出按钮loading状态
      processedMaterialBarcodeData: [], // 添加这个数据属性
      replaceDialogVisible: false,
      replaceSelectedNode: null,
      replaceSelectedMaterial: null,
      replaceMaterials: [],
      replaceForm: {
        newBarcode: "",
        validationStatus: false,
        validationMessage: "",
      },
      replaceLoading: false,
      saleOrderExportDialogVisible: false,
      saleOrderExportLoading: false,
      selectedSaleOrderNo: "",
    };
  },
  computed: {
    // 格式化后的解绑记录
    formattedUnbindRecord() {
      return this.unbindRecord.map((record) => ({
        ...record,
        formattedTime: this.formatDate(record.operateTime),
        materialList: record.unbindMaterials
          ? record.unbindMaterials.map((m) => ({
              ...m,
              displayText: `${m.materialCode} - ${m.materialName}`,
            }))
          : [],
      }));
    },
  },
  methods: {
    // 解绑
    // 修改 handleUnbind 方法
    async handleUnbind(row) {
      try {
        // 检查产品状态是否为已完成状态
        if (this.dataForm.status === "COMPLETED") {
          try {
            await this.$confirm(
              "该产品已处于完成状态，继续操作可能会影响产品状态，是否继续？",
              "状态提示",
              {
                confirmButtonText: "确认继续",
                cancelButtonText: "取消",
                type: "warning",
              }
            );
            // 用户确认，继续执行
          } catch (error) {
            // 用户取消，终止操作
            return;
          }
        }

        // TODO 国内查询维修记录
        let barcodeRepair = await getData("product_repair", {
          query: {
            barcode: this.dataForm.barcode,
            status: "PENDING_REVIEW",
          },
        });

        if (barcodeRepair.data.length === 0) {
          this.$message.warning("请先创建维修记录，再进行解绑操作");
          return;
        }

        //检测

        const { value: reason } = await this.$confirm(
          "此操作将解绑当前工序及其后续所有工序的物料，是否继续？",
          "解绑确认",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
            showInput: true,
            inputPlaceholder: "请输入解绑原因(非必填)",
            inputValidator: (value) => true,
          }
        );

        const loading = this.$loading({
          lock: true,
          text: "正在解绑...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        try {
          if (row.nodeType === "PROCESS_STEP") {
            const response = await unbindComponents({
              mainBarcode: this.dataForm.barcode,
              processStepId: row.processStepId,
              userId: this.$store.state.user.id,
              reason: reason || "未填写解绑原因",
              unbindSubsequent: true,
            });

            if (response.code === 200 && response.success) {
              this.$message.success("解绑成功");

              // 1. 更新主数据
              if (response.data) {
                this.dataForm = JSON.parse(JSON.stringify(response.data));

                // 2. 重新处理流程图数据
                if (this.dataForm.processNodes) {
                  this.processedFlowChartData = this.processNodes(
                    this.dataForm.processNodes
                  );
                }
              }

              // 3. 刷新解绑记录
              await this.getUnbindRecords();

              // 4. 自动切换到解绑信息标签页
              this.activeTab = "unbind";

              // 5. 更新表格数据
              const index = this.tableList.findIndex(
                (item) => item._id === this.dataForm._id
              );
              if (index !== -1) {
                this.$set(
                  this.tableList,
                  index,
                  JSON.parse(JSON.stringify(response.data))
                );
              }

              // 6. 触发视图更新
              this.$nextTick(() => {
                this.$forceUpdate();
              });
            } else {
              throw new Error(response.message || "解绑失败");
            }
          } else {
            throw new Error("只能对工序节点进行解绑操作");
          }
        } catch (error) {
          this.$message.error(error.message || "解绑失败");
        } finally {
          loading.close();
        }
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error(error.message || "解绑失败");
        }
      }
    },
    // 添加获取解绑记录的方法
    async getUnbindRecords() {
      try {
        const unbindRecordResponse = await getData("unbindRecord", {
          query: { flowRecordId: this.dataForm._id },
          populate: JSON.stringify([{ path: "operatorId" }]),
          sort: { createTime: -1 }, // 按创建时间倒序排序
        });

        if (unbindRecordResponse.code === 200) {
          this.unbindRecord = unbindRecordResponse.data;
        }
      } catch (error) {
        console.error("获取解绑记录失败:", error);
      }
    },
    // ... 其他方法保持与 material 页面类似,修改相应的字段名和业务逻辑
    // 这里只列出一些需要特别修改的方法
    // 获取流程状态样式
    getProcessStatusType(status) {
      const statusMap = {
        PENDING: "info",
        IN_PROCESS: "warning",
        COMPLETED: "success",
        ABNORMAL: "danger",
      };
      return statusMap[status] || "info";
    },

    // 获取流程状态文本
    getProcessStatusText(status) {
      const statusMap = {
        PENDING: "待处理",
        IN_PROCESS: "进行中",
        COMPLETED: "已完成",
        ABNORMAL: "异常",
      };
      return statusMap[status] || status;
    },

    // 获取产品状态样式
    getProductStatusType(status) {
      const statusMap = {
        NORMAL: "success",
        REPAIRING: "warning",
        SCRAP: "danger",
      };
      return statusMap[status] || "info";
    },

    // 获取产品状态文本
    getProductStatusText(status) {
      const statusMap = {
        NORMAL: "正常",
        REPAIRING: "维修中",
        SCRAP: "报废",
      };
      return statusMap[status] || status;
    },

    // 获取数据
    async fetchData() {
      this.listLoading = true;
      try {
        let req = await this.searchData();
        req.page = this.currentPage;
        req.skip = (this.currentPage - 1) * this.pageSize;
        req.limit = this.pageSize;
        req.sort = { createAt: -1 };
        req.count = true;

        const result = await getData("material_process_flow", req);

        if (result.code === 200) {
          this.tableList = result.data;
          this.total = result.countnum || result.data.length;
        } else {
          this.$message.error(result.msg || "获取数据失败");
        }
      } catch (error) {
        console.error("获取数据失败:", error);
        this.$message.error("获取数据失败: " + error.message);
      } finally {
        this.listLoading = false;
      }
    }, // ���页方法
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
      if (!date) return "暂无数据";
      return new Date(date).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },

    // 格式化金额
    formatNumber(num) {
      if (!num && num !== 0) return "¥0.00";
      return (
        "¥" +
        Number(num)
          .toFixed(2)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      );
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
        // 查询维修记录
        let barcodeRepair = await getData("product_repair", {
          query: {
            barcode: row.barcode,
            status: "PENDING_REVIEW",
          },
        });

        // if (barcodeRepair.data.length === 0) {
        //     this.$message.warning('请先创建维修记录，再进行初始化');
        //     return;
        // }
        console.log(row, "row");
        // 显示确认对话框
        await this.$confirm(
          "确认要成品初始化吗?该操作无法撤回！请谨慎操作！",
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        if (!row.barcode) {
          this.$message.error("未找到产品条码");
          return;
        }

        // 调用成品初始化API
        const result = await initializeProduct({
          barcode: row.barcode,
          userId: this.$store.state.user.id || "system"
        });

        if (result.code === 200 && result.success) {
          this.$message.success("初始化成功");
          // 重新加载数据
          this.fetchData();
        } else {
          throw new Error(result.message || "初始化失败");
        }
      } catch (error) {
        if (error !== "cancel") {
          console.error("初始化失败:", error);
          this.$message.error(error.message || "初始化失败");
        }
      }
    },
    // 修复流程进度
    async handleFixFlowProgress(row) {
      const result = await fixFlowProgress({ barcode: row.barcode });
      console.log(result, "result");
      if (result.code === 200 && result.success) {
        this.$message.success("自动修复成功");
        this.fetchData();
      } else {
        this.$message.error("自动修复失败");
      }
    },
    // 自动修复异常节点
    async handleAutoFixInconsistentProcessNodes(row) {
      const result = await autoFixInconsistentProcessNodes({
        barcode: row.barcode,
      });
      console.log(result, "result");
      if (result.code === 200 && result.success) {
        this.$message.success("自动修复成功");
        this.fetchData();
      } else {
        this.$message.error("自动修复失败");
      }
    },
    // 批量修复流程进度
    async handleBatchFixFlowProgress() {
      if (!this.selection || this.selection.length === 0) {
        this.$message.warning("请选择需要修复的记录");
        return;
      }
      try {
        // 显示确认对话框
        await this.$confirm(
          `确认要批量修复选中的${this.selection.length}条记录的流程进度吗?`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        // 显示加载中
        const loading = this.$loading({
          lock: true,
          text: "批量修复中...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        let successCount = 0;
        let failCount = 0;

        // 依次处理每条记录
        for (const row of this.selection) {
          try {
            const result = await fixFlowProgress({ barcode: row.barcode });
            if (result.code === 200 && result.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            console.error("修复记录时出错:", error);
            failCount++;
          }
        }

        // 关闭加载中
        loading.close();

        // 显示结果
        if (successCount > 0 && failCount === 0) {
          this.$message.success(`成功修复全部${successCount}条记录`);
        } else if (successCount > 0 && failCount > 0) {
          this.$message.warning(
            `成功修复${successCount}条记录，${failCount}条记录修复失败`
          );
        } else {
          this.$message.error("所有记录修复失败");
        }

        // 刷新数据
        this.fetchData();
      } catch (error) {
        // 用户取消操作或发生其他错误
        if (error !== "cancel") {
          console.error("批量修复流程进度时出错:", error);
          this.$message.error("批量修复流程进度时出错");
        }
      }
    },
    // 批量自动修复异常节点
    async handleBatchAutoFixInconsistentProcessNodes() {
      if (!this.selection || this.selection.length === 0) {
        this.$message.warning("请选择需要修复的记录");
        return;
      }

      try {
        // 显示确认对话框
        await this.$confirm(
          `确认要批量修复选中的${this.selection.length}条记录的异常节点吗?`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        // 显示加载中
        const loading = this.$loading({
          lock: true,
          text: "批量修复中...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        let successCount = 0;
        let failCount = 0;

        // 依次处理每条记录
        for (const row of this.selection) {
          try {
            const result = await autoFixInconsistentProcessNodes({
              barcode: row.barcode,
            });
            if (result.code === 200 && result.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            console.error("修复记录时出错:", error);
            failCount++;
          }
        }

        // 关闭加载中
        loading.close();

        // 显示结果
        if (successCount > 0 && failCount === 0) {
          this.$message.success(`成功修复全部${successCount}条记录`);
        } else if (successCount > 0 && failCount > 0) {
          this.$message.warning(
            `成功修复${successCount}条记录，${failCount}条记录修复失败`
          );
        } else {
          this.$message.error("所有记录修复失败");
        }

        // 刷新数据
        this.fetchData();
      } catch (error) {
        // 用户取消操作或发生其他错误
        if (error !== "cancel") {
          console.error("批量修复异常节点时出错:", error);
          this.$message.error("批量修复异常节点时出错");
        }
      }
    },
    //handleUpdateFlowNodes
    async handleUpdateFlowNodes(row) {
      try {
        // 显示确认对话框
        await this.$confirm("确认要更新流程节点吗?", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });
        const result = await updateFlowNodes({ barcode: row.barcode });
        console.log(result, "result");
        if (result.code === 200 && result.success) {
          this.$message.success("更新成功");
          this.fetchData();
        } else {
          this.$message.error("更新失败");
        }
      } catch (error) {
        console.error("更新失败:", error);
        this.$message.error("更新失败: " + error.message);
      }
    },
    // 查看详情
    async handleView(row) {
      try {
        this.listLoading = true;
        const result = await getData("material_process_flow", {
          query: { _id: row._id },
        });

        if (result.code === 200 && result.data.length > 0) {
          this.dataForm = JSON.parse(JSON.stringify(result.data[0]));
          this.processedFlowChartData = this.processNodes(
            this.dataForm.processNodes
          );

          // 等待物料条码数据处理完成
          this.processedMaterialBarcodeData =
            await this.handleProcessedMaterialBarcodeData(this.dataForm);

          // 获取解绑记录
          await this.getUnbindRecords();

          // 最后再显示对话框
          this.dialogFormVisible = true;
        } else {
          this.$message.error("获取详情失败");
        }
      } catch (error) {
        console.error("获取详情失败:", error);
        this.$message.error("获取详情失败: " + error.message);
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
        await this.$confirm("确认要删除该订单吗？删除后不可恢复！", "警告", {
          type: "warning",
          confirmButtonText: "确定删除",
          confirmButtonClass: "el-button--danger",
        });

        await removeData("k3_SAL_SaleOrder", { query: { _id: row._id } });
        this.$message.success("删除成功");
        this.fetchData();
      } catch (error) {
        if (error === "cancel") {
          this.$message.info("已取消删除");
        } else {
          console.error("删除失败:", error);
          this.$message.error("删除失败");
        }
      }
    },

    // 提交表单
    async handleSubmit(formData) {
      try {
        if (this.dialogStatus === "edit") {
          await updateData("k3_SAL_SaleOrder", formData._id, formData);
          this.$message.success("更新成功");
        } else {
          await addData("k3_SAL_SaleOrder", formData);
          this.$message.success("添加成功");
        }
        this.dialogFormVisible = false;
        this.fetchData();
      } catch (error) {
        console.error("操作失败:", error);
        this.$message.error("操作失败");
      }
    },
    // 构建查询条件
    async searchData() {
      let req = {
        query: {
          $and: [],
        },
        // 添加关联查询
        populate: JSON.stringify([
          {
            path: "productionPlanWorkOrderId",
            select:
              "workOrderNo saleOrderNo productionOrderNo planQuantity planProductionQuantity inputQuantity outputQuantity status",
          },
        ]),
      };

      // 处理基础查询条件
      if (this.searchForm.barcode && this.searchForm.barcode.trim()) {
        //是否为升级条码
        const preProductionResponse = await getData("preProductionBarcode", {
          query: {
            transformedPrintBarcode: this.searchForm.barcode.trim(),
          },
          select: {
            transformedPrintBarcode: 1,
            printBarcode: 1,
          },
          limit: 1,
        });
        let barcode = this.searchForm.barcode.trim();
        if (preProductionResponse.code === 200 && preProductionResponse.data.length > 0) {
          barcode = preProductionResponse.data[0].printBarcode;
        }
        req.query.$and.push({
          barcode: { $regex: barcode, $options: "i" },
        });
      }
      if (this.searchForm.materialCode && this.searchForm.materialCode.trim()) {
        req.query.$and.push({
          materialCode: {
            $regex: this.searchForm.materialCode.trim(),
            $options: "i",
          },
        });
      }
      if (this.searchForm.productionPlanWorkOrderId) {
        req.query.$and.push({
          productionPlanWorkOrderId: this.searchForm.productionPlanWorkOrderId,
        });
      }
      if (this.searchForm.productModel && this.searchForm.productModel.trim()) {
        req.query.$and.push({
          materialSpec: {
            $regex: this.searchForm.productModel.trim(),
            $options: "i",
          },
        });
      }
      if (this.searchForm.businessType) {
        req.query.$and.push({ businessType: this.searchForm.businessType });
      }
      if (this.searchForm.status) {
        req.query.$and.push({ status: this.searchForm.status });
      }

      // 添加产品状态查询
      if (this.searchForm.productStatus) {
        req.query.$and.push({ productStatus: this.searchForm.productStatus });
      }

      // 处理日期范围查询
      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        req.query.$and.push({
          startTime: {
            $gte: new Date(this.searchForm.dateRange[0]),
            $lte: new Date(this.searchForm.dateRange[1]),
          },
        });
      }

      // 处理销售订单和生产订单查询
      if (this.searchForm.saleOrderNo || this.searchForm.productionOrderNo) {
        try {
          // 先查询工单
          const workOrderQuery = { $or: [] };
          if (this.searchForm.saleOrderNo) {
            workOrderQuery.$or.push({
              saleOrderNo: this.searchForm.saleOrderNo,
            });
          }
          if (this.searchForm.productionOrderNo) {
            workOrderQuery.$or.push({
              productionOrderNo: this.searchForm.productionOrderNo,
            });
          }

          const workOrderResult = await getData("production_plan_work_order", {
            query: workOrderQuery,
            select: "_id",
          });

          if (workOrderResult.code === 200 && workOrderResult.data) {
            const workOrderIds = workOrderResult.data.map((wo) => wo._id);
            req.query.$and.push({
              productionPlanWorkOrderId: { $in: workOrderIds },
            });
          } else {
            // 如果没有找到匹配的工单，添加一个不可能匹配的条件
            req.query.$and.push({
              productionPlanWorkOrderId: null,
            });
          }
        } catch (error) {
          console.error("查询工单失败:", error);
          // 发生错误时添加一个不可能匹配的条件
          req.query.$and.push({
            productionPlanWorkOrderId: null,
          });
        }
      }

      // 处理托盘编号查询
      if (this.searchForm.palletCode && this.searchForm.palletCode.trim()) {
        try {
          // 先查询托盘数据
          const palletResult = await getData("material_palletizing", {
            query: {
              palletCode: { $regex: this.searchForm.palletCode.trim(), $options: "i" }
            },
            select: "palletBarcodes.materialProcessFlowId",
          });

          if (palletResult.code === 200 && palletResult.data && palletResult.data.length > 0) {
            // 提取所有关联的materialProcessFlowId
            const materialProcessFlowIds = [];
            palletResult.data.forEach(pallet => {
              if (pallet.palletBarcodes && pallet.palletBarcodes.length > 0) {
                pallet.palletBarcodes.forEach(item => {
                  if (item.materialProcessFlowId) {
                    materialProcessFlowIds.push(item.materialProcessFlowId);
                  }
                });
              }
            });

            if (materialProcessFlowIds.length > 0) {
              req.query.$and.push({
                _id: { $in: materialProcessFlowIds }
              });
            } else {
              // 如果没有找到匹配的记录，添加一个不可能匹配的条件
              req.query.$and.push({
                _id: null
              });
            }
          } else {
            // 如果没有找到匹配的托盘，添加一个不可能匹配的条件
            req.query.$and.push({
              _id: null
            });
          }
        } catch (error) {
          console.error("查询托盘数据失败:", error);
          // 发生错误时添加一个不可能匹配的条件
          req.query.$and.push({
            _id: null
          });
        }
      }

      // 处理进度范围查询
      if (this.searchForm.minProgress !== "" || this.searchForm.maxProgress !== "") {
        const progressQuery = {};
        if (this.searchForm.minProgress !== "") {
          progressQuery.$gte = Number(this.searchForm.minProgress);
        }
        if (this.searchForm.maxProgress !== "") {
          progressQuery.$lte = Number(this.searchForm.maxProgress);
        }
        if (Object.keys(progressQuery).length > 0) {
          req.query.$and.push({ progress: progressQuery });
        }
      }

      if (!req.query.$and.length) {
        delete req.query.$and;
      }

      console.log(req, "req");

      return req;
    },

    // 重置表单
    resetForm() {
      this.$refs.searchForm.resetFields();
      this.searchForm = {
        barcode: "",
        materialCode: "",
        saleOrderNo: "",
        productionOrderNo: "",
        productModel: "",
        businessType: "",
        status: "",
        productStatus: "",
        dateRange: [],
        minProgress: "",
        maxProgress: "",
        workOrderNo: "",
        productionPlanWorkOrderId: "",
        palletCode: "",
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

    // 添加缺失的事件处���方法
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
      this.dialogStatus = "edit";
      this.dialogFormVisible = true;
      this.$nextTick(() => {
        this.$refs["dataForm"].resetFields();
        this.dataForm = Object.assign({}, row);
      });
    },

    async handleDelete(row) {
      try {
        await this.$confirm("确认要删除该订单吗？", "警告", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        await removeData("k3_SAL_SaleOrder", { query: { _id: row._id } });
        this.$message.success("删除成功");
        this.fetchData();
      } catch (error) {
        if (error !== "cancel") {
          console.error("删除失败:", error);
          this.$message.error("删除失败: " + error.message);
        }
      }
    },

    async handleSubmitAudit(row) {
      try {
        await this.$confirm("确认提交此订单进行审核？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        const updatedData = {
          ...row,
          FDocumentStatus: "B", // 更改为审核中状态
          FModifyDate: new Date(),
          FModifierId: this.$store.state.user.name,
        };

        await updateData("k3_SAL_SaleOrder", row._id, updatedData);
        this.$message.success("提交审核成功");
        this.fetchData();
      } catch (error) {
        if (error !== "cancel") {
          console.error("提交审核失败:", error);
          this.$message.error("提交审核失败: " + error.message);
        }
      }
    },

    // 表单提交
    submitForm() {
      this.$refs["dataForm"].validate(async (valid) => {
        if (valid) {
          try {
            if (this.dialogStatus === "create") {
              await addData("k3_SAL_SaleOrder", this.dataForm);
              this.$message.success("创建成功");
            } else {
              await updateData(
                "k3_SAL_SaleOrder",
                this.dataForm._id,
                this.dataForm
              );
              this.$message.success("更新成功");
            }
            this.dialogFormVisible = false;
            this.fetchData();
          } catch (error) {
            console.error("操作失败:", error);
            this.$message.error("操作失败: " + error.message);
          }
        }
      });
    },

    // 获取节点类型图标和颜色
    getNodeIcon(node) {
      const iconMap = {
        PROCESS_STEP: {
          icon: "el-icon-s-operation",
          color: "#409EFF",
        },
        MATERIAL: {
          icon: "el-icon-box",
          color: "#67c23a",
        },
      };
      return (
        iconMap[node.nodeType] || { icon: "el-icon-more", color: "#909399" }
      );
    },

    // 获取时间轴节点类型
    getTimelineItemType(status) {
      const typeMap = {
        COMPLETED: "success",
        IN_PROCESS: "primary",
        ABNORMAL: "danger",
        PENDING: "info",
      };
      return typeMap[status] || "info";
    },

    // 获取扫码图标
    getScanIcon(node) {
      if (!node.requireScan) return "el-icon-minus info";
      const statusMap = {
        COMPLETED: "el-icon-check success",
        IN_PROCESS: "el-icon-loading warning",
        ABNORMAL: "el-icon-close danger",
        PENDING: "el-icon-time info",
      };
      return statusMap[node.status] || "el-icon-time info";
    },

    // 获取扫码状态文本
    getScanStatus(node) {
      if (!node.requireScan) return "无需扫码";
      const statusMap = {
        COMPLETED: "已完成扫码",
        IN_PROCESS: "等待扫码",
        ABNORMAL: "扫码异常",
        PENDING: "未开始",
      };
      return statusMap[node.status] || "未开始";
    },

    // 获取当前激活的步骤
    getActiveStep(nodes) {
      const inProcessIndex = nodes.findIndex(
        (node) => node.status === "IN_PROCESS"
      );
      if (inProcessIndex === -1) {
        return nodes.filter((node) => node.status === "COMPLETED").length;
      }
      return inProcessIndex + 1;
    },

    // 获取步骤状态
    getStepStatus(status) {
      const statusMap = {
        COMPLETED: "success",
        IN_PROCESS: "process",
        ABNORMAL: "error",
        PENDING: "wait",
      };
      return statusMap[status] || "wait";
    },

    // 获取步骤图标
    getStepIcon(node) {
      if (node.nodeType === "PROCESS_STEP") {
        return "el-icon-s-operation";
      }
      return "el-icon-box";
    },

    // 获取整体流程状态
    getProcessOverallStatus(nodes) {
      if (nodes.some((node) => node.status === "ABNORMAL")) {
        return "error";
      }
      if (nodes.some((node) => node.status === "IN_PROCESS")) {
        return "process";
      }
      if (nodes.every((node) => node.status === "COMPLETED")) {
        return "success";
      }
      return "wait";
    },

    // 获取顶层工序节点
    getProcessSteps() {
      return this.dataForm.processNodes
        .filter((node) => node.nodeType === "PROCESS_STEP" && node.level === 1)
        .sort((a, b) => a.processSort - b.processSort);
    },

    // 获取关联的物料节点
    getRelatedMaterials(processNodeId) {
      return this.dataForm.processNodes.filter(
        (node) =>
          node.nodeType === "MATERIAL" &&
          node.parentNodeId === processNodeId &&
          node.level === 2 // 只获取直接关联的物料
      );
    },

    // 检查工序下是否有需要扫码的物料
    hasRequireScanMaterials(processNodeId) {
      return this.getRelatedMaterials(processNodeId).some(
        (material) => material.requireScan
      );
    },

    // 添加的处理方法
    processNodes(nodes) {
      if (!nodes || !nodes.length) return [];

      // 构建节点映射
      const nodeMap = new Map();
      nodes.forEach((node) => {
        nodeMap.set(node.nodeId, {
          ...node,
          children: [],
        });
      });

      // 构建树形结构
      const result = [];
      nodes.forEach((node) => {
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
          if (node.nodeType === "PROCESS_STEP") {
            node.children.sort((a, b) =>
              (a.materialCode || "").localeCompare(b.materialCode || "")
            );
          }
          // 物料节点下的工序按照 processSort 排序
          else if (node.nodeType === "MATERIAL") {
            node.children.sort(
              (a, b) => (a.processSort || 0) - (b.processSort || 0)
            );
          }

          // 递归排序子节点
          node.children.forEach((child) => sortChildren(child));
        }
      };

      result.forEach((node) => sortChildren(node));
      return result;
    },

    // 打开条码搜索弹窗
    openBarcodeSearch() {
      this.barcodeSearchVisible = true;
      this.searchBarcode = "";
      this.searchResults = [];
    },

    // 处理条码搜索
    async handleBarcodeSearch() {
      if (!this.searchBarcode.trim()) {
        this.$message.warning("请输入要搜索的条码");
        return;
      }

      this.searchLoading = true;
      try {
        //是否为升级条码
        const preProductionResponse = await getData("preProductionBarcode", {
          query: {
            transformedPrintBarcode: this.searchBarcode.trim(),
          },
          select: {
            transformedPrintBarcode: 1,
            printBarcode: 1,
          },
          limit: 1,
        });

        if (
          preProductionResponse.data &&
          preProductionResponse.data.length > 0
        ) {
          console.log("升级条码:", preProductionResponse.data[0]);
          this.searchBarcode = preProductionResponse.data[0].printBarcode;
        }
        // 查询产品条码
        const searchQuery = {
          query: {
            "processNodes.barcode": this.searchBarcode,
          },
        };

        const mainBarcodeResult = await getData(
          "material_process_flow",
          searchQuery
        );
        if (
          mainBarcodeResult.code === 200 &&
          mainBarcodeResult.data &&
          mainBarcodeResult.data.length > 0
        ) {
          this.searchResults = [];
          mainBarcodeResult.data.forEach((record) => {
            this.searchResults.push({
              isMainBarcode: true,
              barcode: record.barcode,
              materialCode: record.materialCode,
              materialName: record.materialName,
              materialSpec: record.materialSpec,
              status: record.status,
              ...record,
            });
          });
          return;
        }
        // 查询当前条码
        let currentSearchQuery = {
          query: {
            barcode: this.searchBarcode,
          },
        };
        const currentBarcodeResult = await getData(
          "material_process_flow",
          currentSearchQuery
        );

        if (
          currentBarcodeResult.code === 200 &&
          currentBarcodeResult.data &&
          currentBarcodeResult.data.length > 0
        ) {
          this.searchResults = [];
          currentBarcodeResult.data.forEach((record) => {
            this.searchResults.push({
              isMainBarcode: false,
              barcode: record.barcode,
              materialCode: record.materialCode,
              materialName: record.materialName,
              materialSpec: record.materialSpec,
              status: record.status,
              ...record,
            });
          });
          return;
        }

        this.$message.warning("未找到相关数据");
      } catch (error) {
        console.error("搜索失败:", error);
        this.$message.error("搜索失败: " + error.message);
      } finally {
        this.searchBarcode = "";
        this.searchLoading = false;
      }
    },

    // 打开导出选项弹窗
    handleAllExport() {
      this.exportDialogVisible = true;
      this.exportForm.exportOption = "current"; // 重置选项
    },
    async handleAllExcel() {
      try {
        // 显示加载提示
        const loading = this.$loading({
          lock: true,
          text: "正在导出数据，请稍候...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        // 获取表格数据
        let req = this.searchData();
        req.page = this.currentPage;
        req.skip = (this.currentPage - 1) * this.pageSize;
        req.limit = this.pageSize;
        req.sort = { createAt: -1 };
        // req.populate = JSON.stringify([{ path: 'productionPlanWorkOrderId' },{ path: 'materialId' }]);

        const result = await getData("sale_order_barcode_mapping", req);

        if (result.code !== 200) {
          throw new Error(result.msg || "获取数据失败");
        }

        // 转换数据为Excel格式
        const excelData = result.data.map((item) => ({
          型号: item.materialCode || "-",
          客户订单: item.saleOrderNo ? item.saleOrderNo : "-",
          UDI序列号: item.barcode || "-", //
          生产批号: item.productionPlanWorkOrderId
            ? item.productionPlanWorkOrderId.productionOrderNo
            : "-",
          外箱UDI: item.barcode || "-", //
          彩盒UDI: item.barcode || "-", //
          产品UDI: item.barcode || "-", //
          生产日期: item.createAt ? this.formatDate(item.createAt) : "-",
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
          { wch: 20 }, // 生产日期
        ];
        ws["!cols"] = colWidths;

        // 设置表头样式
        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: 0, c: C });
          if (!ws[address]) continue;
          ws[address].s = {
            font: { bold: true },
            alignment: { horizontal: "center" },
            fill: { fgColor: { rgb: "f5f7fa" } },
          };
        }

        // 将工作表添加到工作簿
        XLSX.utils.book_append_sheet(wb, ws, "数据列表");

        // 生成Excel文件并下载
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        // 生成文件名（使用当前时间戳）
        const fileName = `数据导出_${new Date().toLocaleDateString()}.xlsx`;

        // 下载文件
        FileSaver.saveAs(blob, fileName);

        this.$message.success("导出成功");
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败: " + error.message);
      } finally {
        // 关闭加载提示
        this.$loading().close();
      }
    },
    // 确认导出
    async confirmExport() {
      const exportOption = this.exportForm.exportOption;

      // 如果选择导出全部数据，进行二次确认
      if (exportOption === "all") {
        try {
          await this.$confirm(
            "确认导出全部数据吗?数据量较大可能需要较长时间",
            "二次确认",
            {
              type: "warning",
            }
          );
        } catch (error) {
          if (error === "cancel") {
            this.$message.info("已取消导出");
            return;
          }
        }
      }

      this.exportLoading = true;

      try {
        // 显示进度提示
        const progressLoading = this.$loading({
          lock: true,
          text: `正在获取数据...`,
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        // 设置每批次请求的数据量
        const batchSize = 50;

        // 存储所有导出数据
        let exportData = [];

        // 批次处理变量
        let hasMoreData = true;
        let currentBatch = 0;
        let totalCount = 0;

        // 根据选择获取要导出的数据
        switch (exportOption) {
          case "all":
            // 分批次获取全部数据
            while (hasMoreData) {
              progressLoading.text = `正在获取第 ${currentBatch + 1} 批数据...`;

              const batchReq = {
                query: {},
                skip: currentBatch * batchSize,
                limit: batchSize,
                sort: { createAt: -1 },
                count: true,
              };

              const batchResult = await getData("material_process_flow", batchReq);

              if (batchResult.code !== 200) {
                throw new Error(
                  batchResult.msg || `获取第${currentBatch + 1}批数据失败`
                );
              }

              // 第一次请求时获取总数
              if (currentBatch === 0) {
                totalCount = batchResult.countnum || 0;

                if (totalCount === 0) {
                  this.$message.warning("没有可导出的数据");
                  progressLoading.close();
                  return;
                }
              }

              // 处理当前批次数据
              const batchData = batchResult.data || [];

              // 如果返回数据少于批次大小，说明没有更多数据了
              if (batchData.length < batchSize) {
                hasMoreData = false;
              }

              // 添加到导出数据
              exportData = [...exportData, ...batchData];

              // 显示加载进度
              const loadedPercent = Math.min(
                100,
                Math.floor((exportData.length / totalCount) * 100)
              );
              progressLoading.text = `正在获取数据，进度：${loadedPercent}%...`;

              currentBatch++;

              // 如果已加载数据达到总数，结束加载
              if (exportData.length >= totalCount) {
                hasMoreData = false;
              }
            }
            break;

          case "search":
            // 分批次获取搜索结果数据
            let searchReq = await this.searchData();
            searchReq.sort = { createAt: -1 };
            searchReq.count = true;

            // 先获取总数
            const countResult = await getData("material_process_flow", {
              ...searchReq,
              limit: 1,
            });
            totalCount = countResult.countnum || 0;

            if (totalCount === 0) {
              this.$message.warning("没有可导出的数据");
              progressLoading.close();
              return;
            }

            // 分批次请求数据
            while (hasMoreData) {
              progressLoading.text = `正在获取第 ${currentBatch + 1} 批数据...`;

              const batchReq = {
                ...searchReq,
                skip: currentBatch * batchSize,
                limit: batchSize,
              };

              const batchResult = await getData("material_process_flow", batchReq);

              if (batchResult.code !== 200) {
                throw new Error(
                  batchResult.msg || `获取第${currentBatch + 1}批数据失败`
                );
              }

              // 处理当前批次数据
              const batchData = batchResult.data || [];

              // 如果返回数据少于批次大小，说明没有更多数据了
              if (batchData.length < batchSize) {
                hasMoreData = false;
              }

              // 添加到导出数据
              exportData = [...exportData, ...batchData];

              // 显示加载进度
              const loadedPercent = Math.min(
                100,
                Math.floor((exportData.length / totalCount) * 100)
              );
              progressLoading.text = `正在获取数据，进度：${loadedPercent}%...`;

              currentBatch++;

              // 如果已加载数据达到总数，结束加载
              if (exportData.length >= totalCount) {
                hasMoreData = false;
              }
            }
            break;
        }

        if (exportData.length === 0) {
          this.$message.warning("没有可导出的数据");
          progressLoading.close();
          return;
        }

        // 更新进度提示
        progressLoading.text = `正在处理第 0/${exportData.length} 条数据...`;

        // 创建zip实例
        const zip = new JSZip();

        // 处理每条数据
        for (let i = 0; i < exportData.length; i++) {
          progressLoading.text = `正在处理第 ${i + 1}/${
            exportData.length
          } 条数据...`;
          const item = exportData[i];

          try {
            // 已经有详细数据，直接使用
            const detailData = item;
            const materialBarcodeData =
              await this.handleProcessedMaterialBarcodeData(detailData);

            if (materialBarcodeData.length === 0) {
              continue;
            }

            // 创建Excel数据
            const excelData = materialBarcodeData.map((item) => ({
              条码: item.barcode || "-",
              物料编码: item.materialCode || "-",
              物料名称: item.materialName || "-",
              规格型号: item.materialSpec || "-",
              状态: this.getProcessStatusText(item.status) || "-",
              所属工序: `${item.processName || ""} ${
                item.processCode ? `(${item.processCode})` : ""
              }`,
              扫码时间: item.scanTime ? this.formatDate(item.scanTime) : "-",
            }));

            // 创建工作簿和设置样式
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            // 设置列宽
            ws["!cols"] = [
              { wch: 20 }, // 条码
              { wch: 15 }, // 物料编码
              { wch: 20 }, // 物料名称
              { wch: 15 }, // 规格型号
              { wch: 10 }, // 状态
              { wch: 20 }, // 所属工序
              { wch: 20 }, // 扫码时间
            ];

            // 设置表头样式
            const range = XLSX.utils.decode_range(ws["!ref"]);
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const address = XLSX.utils.encode_cell({ r: 0, c: C });
              if (!ws[address]) continue;
              ws[address].s = {
                font: { bold: true },
                alignment: { horizontal: "center" },
                fill: { fgColor: { rgb: "f5f7fa" } },
              };
            }

            XLSX.utils.book_append_sheet(wb, ws, "物料条码信息");
            const excelBuffer = XLSX.write(wb, {
              bookType: "xlsx",
              type: "array",
            });

            // 添加到zip
            const fileName = `${item.materialCode}_${item.materialName}_${item.barcode}.xlsx`;
            zip.file(fileName, excelBuffer);
          } catch (error) {
            console.error("处理数据失败:", error);
            continue;
          }
        }

        // 生成并下载zip
        const zipContent = await zip.generateAsync({ type: "blob" });
        FileSaver.saveAs(
          zipContent,
          `物料条码信息_${new Date().toLocaleDateString()}.zip`
        );

        this.$message.success("导出成功");
        this.exportDialogVisible = false;
        progressLoading.close();
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败: " + error.message);
      } finally {
        this.exportLoading = false;
      }
    },

    // 处理物料条码数据的辅助方法
    processMaterialBarcodeData(processNodes) {
      if (!processNodes) return [];

      return processNodes
        .filter((node) => node.nodeType === "MATERIAL" && node.barcode)
        .map((node) => ({
          barcode: node.barcode,
          materialCode: node.materialCode,
          materialName: node.materialName,
          materialSpec: node.materialSpec,
          status: node.status,
          processName: node.processName,
          processCode: node.processCode,
          scanTime: node.scanTime,
        }))
        .sort((a, b) => new Date(b.scanTime || 0) - new Date(a.scanTime || 0));
    },

    async handleSingleMainExport(row) {
      try {
        // 显示加载提示
        const loading = this.$loading({
          lock: true,
          text: "正在获取数据，请稍候...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        try {
          // 获取详细数据
          const result = await getData("material_process_flow", {
            query: { _id: row._id },
          });

          if (result.code === 200 && result.data.length > 0) {
            const detailData = result.data[0];

            // 使用相同的处理方法获取物料条码信息数据
            const materialBarcodeData =
              await this.handleProcessedMaterialBarcodeData(detailData);

            if (materialBarcodeData.length === 0) {
              this.$message.warning("该记录没有可导出的条码数据");
              loading.close();
              return;
            }

            // 转换数据为Excel格式
            const excelData = materialBarcodeData.map((item) => ({
              条码: item.barcode || "-",
              物料编码: item.materialCode || "-",
              物料名称: item.materialName || "-",
              规格型号: item.materialSpec || "-",
              相关单号: item.relatedBill || "-",
              供应商: item.purchaseInfo ? item.purchaseInfo.supplierName : "-",
              供应商编码: item.purchaseInfo
                ? item.purchaseInfo.supplierCode
                : "-",
              状态: this.getProcessStatusText(item.status) || "-",
              所属工序: `${item.processName || ""} ${
                item.processCode ? `(${item.processCode})` : ""
              }`,
              扫码时间: item.scanTime ? this.formatDate(item.scanTime) : "-",
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
              { wch: 20 }, // 扫码时间
            ];
            ws["!cols"] = colWidths;

            // 设置表头样式
            const headerStyle = {
              font: { bold: true },
              alignment: { horizontal: "center" },
              fill: {
                fgColor: { rgb: "f5f7fa" },
              },
            };

            // 应用表头样式
            const range = XLSX.utils.decode_range(ws["!ref"]);
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const address = XLSX.utils.encode_cell({ r: 0, c: C });
              if (!ws[address]) continue;
              ws[address].s = headerStyle;
            }

            // 将工作表添加到工作簿
            XLSX.utils.book_append_sheet(wb, ws, "物料条码信息");

            // 生成Excel文件的二进制数据
            const excelBuffer = XLSX.write(wb, {
              bookType: "xlsx",
              type: "array",
            });
            const blob = new Blob([excelBuffer], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            // 文件名格式：物料编码_物料名称_产品条码.xlsx
            const fileName = `${row.materialCode}_${row.materialName}_${row.barcode}.xlsx`;

            // 下载文件
            FileSaver.saveAs(blob, fileName);

            this.$message.success("导出成功");
          } else {
            throw new Error("获取数据失败");
          }
        } catch (error) {
          console.error("导出失败:", error);
          this.$message.error("导出失败: " + error.message);
        } finally {
          loading.close();
        }
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败: " + error.message);
      }
    },
    // 处理弹窗关闭前的操作
    handleDialogClose(done) {
      this.dataForm = {
        barcode: "",
        materialCode: "",
        materialName: "",
        materialSpec: "",
        craftVersion: "",
        startTime: null,
        planCompletionTime: null,
        endTime: null,
        status: "PENDING",
        progress: 0,
        processNodes: [],
        remark: "",
      };
      this.processedFlowChartData = [];
      this.activeTab = "process";
      done();
    },

    // 处理弹窗关闭后的操作
    handleDialogClosed() {
      this.dialogFormVisible = false;
      this.unbindRecord = [];
    },

    // 获取业务类型文本
    getBusinessTypeText(type) {
      const found = this.dict.type.businessType.find(
        (item) => item.value === type
      );
      return found ? found.label : type;
    },
    // 添加工单状态样式方法
    getWorkOrderStatusType(status) {
      const statusMap = {
        PENDING: "info",
        IN_PROGRESS: "warning",
        COMPLETED: "success",
        CANCELLED: "danger",
      };
      return statusMap[status] || "info";
    },

    // 添加工单状态文本方法
    getWorkOrderStatusText(status) {
      const statusMap = {
        PENDING: "待生产",
        IN_PROGRESS: "生产中",
        COMPLETED: "已完成",
        CANCELLED: "已取消",
      };
      return statusMap[status] || status;
    },

    // 获取采购订单信息
    async getPurchaseOrderInfo(relatedBill) {
      try {
        const result = await getData("k3_PUR_PurchaseOrder", {
          query: { FBillNo: relatedBill },
          // populate: JSON.stringify([{ path: 'FSupplierId' }])
        });
        console.log(result, "result");

        if (result.code === 200 && result.data.length > 0) {
          const purchaseOrder = result.data[0];
          return {
            supplierName:
              (purchaseOrder.FSupplierId && purchaseOrder.FSupplierId.Name) ||
              "-",
            supplierCode:
              (purchaseOrder.FSupplierId && purchaseOrder.FSupplierId.Number) ||
              "-",
          };
        }
        return null;
      } catch (error) {
        console.error("获取采购订单信息失败:", error);
        return null;
      }
    },

    // 修改处理物料数据的方法
    async handleProcessedMaterialBarcodeData(dataForm) {
      if (!dataForm.processNodes) return [];

      const processMap = new Map();
      dataForm.processNodes.forEach((node) => {
        if (node.nodeType === "PROCESS_STEP") {
          processMap.set(node.nodeId, {
            processName: node.processName,
            processCode: node.processCode,
          });
        }
      });

      // 添加日志输出
      console.log("开始处理物料节点");

      const materialNodes = dataForm.processNodes.filter(
        (node) => node.nodeType === "MATERIAL" && node.barcode
      );

      const processedNodes = await Promise.all(
        materialNodes.map(async (node) => {
          const processInfo = node.parentNodeId
            ? processMap.get(node.parentNodeId)
            : null;
          let purchaseInfo = null;

          if (node.relatedBill) {
            console.log("获取采购订单信息:", node.relatedBill);
            purchaseInfo = await this.getPurchaseOrderInfo(node.relatedBill);
            console.log("采购订单信息结果:", purchaseInfo);
          }

          //第二种获取相关采购订单信息
          if (purchaseInfo === null) {
            try {
              //  通过销售订单号和物料编码查询采购订单

              const purchaseOrderResult = await getData(
                "k3_PUR_PurchaseOrder",
                {
                  query: {
                    $and: [
                      // 匹配物料编码
                      { "FPOOrderEntry.FMaterialId.Number": node.materialCode },
                      // 匹配销售订单号
                      {
                        "FPOOrderEntry.DEMANDBILLNO":
                          dataForm.productionPlanWorkOrderId &&
                          dataForm.productionPlanWorkOrderId.saleOrderNo,
                      },
                    ],
                  },
                }
              );

              if (
                purchaseOrderResult.code === 200 &&
                purchaseOrderResult.data.length > 0
              ) {
                const purchaseOrder = purchaseOrderResult.data[0];
                purchaseInfo = {
                  supplierName:
                    (purchaseOrder.FSupplierId &&
                      purchaseOrder.FSupplierId.Name) ||
                    "-",
                  supplierCode:
                    (purchaseOrder.FSupplierId &&
                      purchaseOrder.FSupplierId.Number) ||
                    "-",
                };
                console.log(
                  "通过销售订单关联查询到采购订单供应商信息:",
                  purchaseInfo
                );
              }
            } catch (error) {
              console.error("获取关联采购订单信息失败:", error);
            }
          }

          return {
            ...node,
            processName: processInfo ? processInfo.processName : "-",
            processCode: processInfo ? processInfo.processCode : "",
            purchaseInfo: purchaseInfo,
          };
        })
      );

      return processedNodes.sort(
        (a, b) => new Date(b.scanTime || 0) - new Date(a.scanTime || 0)
      );
    },
    handleReplaceComponent(row) {
      // 检查产品状态是否为已完成状态
      if (this.dataForm.status === "COMPLETED") {
        this.$confirm(
          "该产品已处于完成状态，继续操作可能会影响产品状态，是否继续？",
          "状态提示",
          {
            confirmButtonText: "确认继续",
            cancelButtonText: "取消",
            type: "warning",
          }
        )
          .then(() => {
            // 用户确认，继续执行替换操作
            this.showReplaceDialog(row);
          })
          .catch(() => {
            // 用户取消，终止操作
            return;
          });
      } else {
        // 直接显示替换对话框
        this.showReplaceDialog(row);
      }
    },

    // 提取显示替换对话框的逻辑为单独的方法
    showReplaceDialog(row) {
      this.replaceSelectedNode = row;
      this.replaceMaterials = row.children.filter(
        (item) => item.nodeType === "MATERIAL"
      );

      if (this.replaceMaterials.length > 0) {
        this.replaceSelectedMaterial = this.replaceMaterials[0].nodeId;
      } else {
        this.replaceSelectedMaterial = null;
      }

      this.replaceForm = {
        newBarcode: "",
        validationStatus: false,
        validationMessage: "",
      };

      this.replaceDialogVisible = true;
    },
    async validateReplaceBarcode() {
      if (!this.replaceForm.newBarcode) {
        this.replaceForm.validationStatus = false;
        this.replaceForm.validationMessage = "请输入新物料条码";
        return;
      }

      try {
        // 找到当前选中的物料节点
        const materialNode = this.replaceMaterials.find(
          (item) => item.nodeId === this.replaceSelectedMaterial
        );

        if (!materialNode) {
          this.replaceForm.validationStatus = false;
          this.replaceForm.validationMessage = "未选择要替换的物料";
          return;
        }

        // 检查旧条码与新条码是否相同
        if (materialNode.barcode === this.replaceForm.newBarcode) {
          this.replaceForm.validationStatus = false;
          this.replaceForm.validationMessage = "新条码与原条码相同";
          return;
        }

        // TODO: 调用API验证条码是否符合该工序物料节点的要求
        // 示例: 验证条码格式和物料类型
        // 这里需要根据后端API实现具体的验证逻辑

        // 查询是否存在对应的维修记录
        const repairRecords = await getData("product_repair", {
          query: {
            barcode: this.dataForm.barcode,
            status: "PENDING_REVIEW",
            "replaceParts.originalBarcode": materialNode.barcode,
          },
        });

        if (repairRecords.data.length === 0) {
          this.replaceForm.validationStatus = false;
          this.replaceForm.validationMessage = "请先创建部件替换的维修记录";
          return;
        }

        // 验证通过
        this.replaceForm.validationStatus = true;
        this.replaceForm.validationMessage = "条码验证通过";
      } catch (error) {
        console.error("条码验证失败:", error);
        this.replaceForm.validationStatus = false;
        this.replaceForm.validationMessage = "条码验证失败: " + error.message;
      }
    },
    async confirmReplaceComponent() {
      if (!this.replaceForm.validationStatus) {
        return;
      }

      try {
        this.replaceLoading = true;

        // 找到当前选中的物料节点
        const materialNode = this.replaceMaterials.find(
          (item) => item.nodeId === this.replaceSelectedMaterial
        );

        if (!materialNode) {
          this.$message.error("未选择要替换的物料");
          return;
        }

        // 调用API执行替换操作
        const result = await replaceComponent({
          mainBarcode: this.dataForm.barcode,
          processNodeId: this.replaceSelectedNode.nodeId,
          materialNodeId: materialNode.nodeId,
          originalBarcode: materialNode.barcode,
          newBarcode: this.replaceForm.newBarcode,
          userId: this.$store.state.user.id || "system",
        });

        if (result.success) {
          this.$message.success("物料替换成功");
          this.replaceDialogVisible = false;

          // 重新加载数据
          this.handleView(this.dataForm);
        } else {
          this.$message.error(result.message || "替换失败");
        }
      } catch (error) {
        console.error("物料替换失败:", error);
        this.$message.error("物料替换失败: " + error.message);
      } finally {
        this.replaceLoading = false;
      }
    },
    openSaleOrderExportDialog() {
      this.saleOrderExportDialogVisible = true;
      this.selectedSaleOrderNo = '';
    },
    async confirmSaleOrderExport() {
      if (!this.selectedSaleOrderNo) {
        this.$message.warning('请选择销售订单');
        return;
      }
      this.saleOrderExportLoading = true;
      try {
        // 显示加载提示
        const loading = this.$loading({
          lock: true,
          text: '开始导出数据，请稍候...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });

        let allData = [];
        let currentPage = 1;
        const pageSize = 100;
        let hasMore = true;
        let total = 0;

        // 循环获取所有数据
        while (hasMore) {
          loading.text = `正在获取第 ${currentPage} 批数据...`;

          const res = await exportBySaleOrder({
            saleOrderNo: this.selectedSaleOrderNo,
            page: currentPage,
            pageSize
          });

          if (res.code !== 200) throw new Error(res.message || '接口异常');

          const { data, hasMore: more, total: totalCount } = res;
          allData = allData.concat(data || []);
          total = totalCount;

          // 更新进度提示
          loading.text = `已获取 ${allData.length}/${total} 条数据`;

          hasMore = more;
          currentPage++;
        }

        // 导出Excel
        if (allData.length > 0) {
          loading.text = '正在生成Excel文件...';

          // 字段顺序与表头
          const headers = [
            'WORK_ORDER(PO号)', 'UDI', 'MASTER_CARTON_UDI（外箱UDI）', 'PART_NO(部件编码)',
            'QR_COED（条码）', 'SN_NO（客户物料编码）', 'STATION（工序描述）',
            'RESULT（绑定结果）', 'TEST_TIME（操作时间）', 'EMPNAME（操作人）'
          ];

          // 字段映射
          const data = allData.map(item => ({
            'WORK_ORDER(PO号)': item.WORK_ORDER,
            'UDI': item.UDI,
            'MASTER_CARTON_UDI（外箱UDI）': item.MASTER_CARTON_UDI,
            'PART_NO(部件编码)': item.PART_NO,
            'QR_COED（条码）': item.QR_COED,
            'SN_NO（客户物料编码）': item.SN_NO,
            'STATION（工序描述）': item.STATION,
            'RESULT（绑定结果）': item.RESULT,
            'TEST_TIME（操作时间）': item.TEST_TIME,
            'EMPNAME（操作人）': item.EMPNAME
          }));

          // 创建工作簿
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(data);

          // 设置列宽
          const colWidths = [
            { wch: 15 }, // WORK_ORDER
            { wch: 20 }, // UDI
            { wch: 20 }, // MASTER_CARTON_UDI
            { wch: 15 }, // PART_NO
            { wch: 20 }, // QR_COED
            { wch: 20 }, // SN_NO
            { wch: 20 }, // STATION
            { wch: 15 }, // RESULT
            { wch: 20 }, // TEST_TIME
            { wch: 15 }  // EMPNAME
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
              fill: { fgColor: { rgb: 'f5f7fa' } }
            };
          }

          // 将工作表添加到工作簿
          XLSX.utils.book_append_sheet(wb, ws, '成品流程记录');

          // 生成Excel文件并下载
          loading.text = '正在下载文件...';
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });

          // 生成文件名
          const fileName = `销售订单${this.selectedSaleOrderNo}成品流程记录_${new Date().toLocaleDateString()}.xlsx`;

          // 下载文件
          FileSaver.saveAs(blob, fileName);

          this.$message.success('导出成功');
          this.saleOrderExportDialogVisible = false;
        } else {
          this.$message.warning('没有可导出的数据');
        }
      } catch (error) {
        console.error('导出失败:', error);
        this.$message.error(error.message || '导出失败');
      } finally {
        this.saleOrderExportLoading = false;
        this.$loading().close();
      }
    },
    // 添加数字校验方法
    validateNumber(field) {
      // 移除非数字字符
      this.searchForm[field] = this.searchForm[field].replace(/[^\d]/g, '');
      
      // 如果输入的数字大于100，则限制为100
      if (this.searchForm[field] && Number(this.searchForm[field]) > 100) {
        this.searchForm[field] = '100';
      }
    },
  },
  created() {
    this.fetchData();

    // 添加角色权限判断
    const roles = this.$store.getters.roles;
    if (!roles || !roles.buttonList) {
      return;
    }

    // 成品条码初始化权限
    if (roles.buttonList.includes("finished_barcode_initialization")) {
      this.hasFinishedBarcodeInitialization = true;
    }

    // 修复流程节点权限
    if (roles.buttonList.includes("repair_process_nodes")) {
      this.hasRepairProcessNodes = true;
    }

    // 修复异常节点权限
    if (roles.buttonList.includes("fix_abnormal_nodes")) {
      this.hasFixAbnormalNodes = true;
    }

    // 更新流程节点权限
    if (roles.buttonList.includes("update_process_nodes")) {
      this.hasUpdateProcessNodes = true;
    }
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
      color: #409eff;
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
        color: #409eff;
      }

      span {
        font-size: 16px;
        font-weight: 600;
        background: linear-gradient(120deg, #409eff, #36cfc9);
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
      color: #409eff;
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
            color: #67c23a;
          }

          &.warning {
            color: #e6a23c;
          }

          &.danger {
            color: #f56c6c;
          }

          &.info {
            color: #909399;
          }
        }
      }
    }

    .step-remark {
      margin-top: 8px;
      color: #e6a23c;
    }
  }
}

.materials-list {
  margin-top: 10px;
  border-top: 1px solid #ebeef5;
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

    > div {
      margin-bottom: 3px;
    }
  }
}

.process-flow {
  padding: 20px;

  .process-step {
    margin-bottom: 20px;
    border: 1px solid #ebeef5;
    border-radius: 4px;

    &:last-child {
      margin-bottom: 0;
    }

    .step-header {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      background: #f5f7fa;
      border-bottom: 1px solid #ebeef5;

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
        background: #409eff;
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
          border-left: 3px solid #409eff;
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
      color: #67c23a;
    }

    &.warning {
      color: #e6a23c;
    }

    &.danger {
      color: #f56c6c;
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
      color: #409eff;
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
      color: #409eff;
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
            border-bottom: 1px solid #ebeef5;

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
    .el-tag + .el-tag {
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

      .el-tag + .el-tag {
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
        border-bottom: 1px solid #ebeef5;

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

// 添加一些样式
.el-tag + .el-tag {
  margin-left: 4px;
}

.el-link {
  font-weight: 500;
  margin-right: 8px;
}

.el-table {
  .cell {
    .el-tag {
      margin: 2px 0;
    }
  }
}

.export-form {
  padding: 20px;

  .export-radio-group {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 20px;

    .export-radio-button {
      height: 80px;
      width: 160px;

      ::v-deep .el-radio-button__inner {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: 1px solid #dcdfe6;
        transition: all 0.3s;

        &:hover {
          background-color: #f5f7fa;
          border-color: #409eff;
        }

        i {
          font-size: 24px;
          margin-bottom: 8px;
          color: #606266;
        }

        span {
          font-size: 14px;
          color: #606266;
        }
      }

      &.is-active {
        ::v-deep .el-radio-button__inner {
          background-color: #ecf5ff;
          border-color: #409eff;
          box-shadow: 0 0 8px rgba(64, 158, 255, 0.2);

          i,
          span {
            color: #409eff;
          }
        }
      }
    }
  }
}

.supplier-info {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;

  .supplier-code {
    margin-left: 4px;
  }
}

.replace-info {
  margin-bottom: 20px;
}

.material-info-box {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.material-list {
  margin-top: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.material-item {
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}

.material-item:last-child {
  border-bottom: none;
}

.material-detail {
  display: flex;
  flex-direction: column;
  margin-left: 5px;
}

.material-detail span {
  line-height: 1.5;
}

.replace-form {
  margin-top: 20px;
}

.progress-range-item {
  .progress-range-container {
    display: flex;
    align-items: center;
    background: #f5f7fa;
    border-radius: 4px;
    padding: 0 10px;
    height: 40px;
    transition: all 0.3s;

    &:hover {
      background: #eef1f6;
    }

    .progress-input {
      flex: 1;
      
      :deep(.el-input__inner) {
        background: transparent;
        border: none;
        text-align: center;
        height: 40px;
        line-height: 40px;
        font-size: 14px;
        color: #606266;

        &::placeholder {
          color: #c0c4cc;
        }

        &:hover, &:focus {
          background: transparent;
        }
      }
    }

    .progress-separator {
      padding: 0 10px;
      color: #909399;
      font-size: 14px;
    }

    .progress-unit {
      color: #909399;
      font-size: 14px;
      margin-left: 5px;
    }
  }
}
</style>
