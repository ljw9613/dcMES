<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div slot="header" class="clearfix">
        <span>{{ $t('productRepair.search.title') }}</span>
      </div>

      <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
        <el-row :gutter="20">
          <el-col :span="4">
            <el-form-item :label="$t('productRepair.search.productBarcode')">
              <el-input
                v-model="searchForm.barcode"
                :placeholder="$t('productRepair.search.productBarcodePlaceholder')"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item :label="$t('productRepair.search.productModel')">
              <el-input
                v-model="searchForm.materialSpec"
                :placeholder="$t('productRepair.search.productModelPlaceholder')"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item :label="$t('productRepair.search.solution')">
              <el-select
                v-model="searchForm.solution"
                clearable
                :placeholder="$t('productRepair.search.solutionPlaceholder')"
                style="width: 100%"
                @change="handleSolutionChange"
              >
                <el-option
                  v-for="dict in dict.type.repair_solution"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item :label="$t('productRepair.search.workOrderNo')">
              <el-input
                v-model="searchForm.workOrderNo"
                :placeholder="$t('productRepair.search.workOrderNoPlaceholder')"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item :label="$t('productRepair.search.saleOrderNo')">
              <el-input
                v-model="searchForm.saleOrderNo"
                :placeholder="$t('productRepair.search.saleOrderNoPlaceholder')"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <!-- 生产订单 -->
          <el-col :span="4">
            <el-form-item :label="$t('productRepair.search.productionOrderNo')">
              <el-input
                v-model="searchForm.productionOrderNo"
                :placeholder="$t('productRepair.search.productionOrderNoPlaceholder')"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item :label="$t('productRepair.search.materialNumber')">
              <el-input
                v-model="searchForm.materialNumber"
                :placeholder="$t('productRepair.search.materialNumberPlaceholder')"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item :label="$t('productRepair.search.status')">
              <el-select
                v-model="searchForm.status"
                :placeholder="$t('productRepair.search.statusPlaceholder')"
                clearable
                style="width: 100%"
              >
                <el-option :label="$t('productRepair.status.pendingReview')" value="PENDING_REVIEW" />
                <el-option :label="$t('productRepair.status.reviewed')" value="REVIEWED" />
                <el-option :label="$t('productRepair.status.voided')" value="VOIDED" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 当处理方案为部件更换时显示以下字段 -->
          <template v-if="searchForm.solution === 'COMPONENT_REPLACEMENT'">
            <el-col :span="4">
              <el-form-item :label="$t('productRepair.search.originalBarcode')">
                <el-input
                  v-model="searchForm.originalBarcode"
                  :placeholder="$t('productRepair.search.originalBarcodePlaceholder')"
                  clearable
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :label="$t('productRepair.search.newBarcode')">
                <el-input
                  v-model="searchForm.newBarcode"
                  :placeholder="$t('productRepair.search.newBarcodePlaceholder')"
                  clearable
                ></el-input>
              </el-form-item>
            </el-col>
          </template>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="search" >{{ $t('productRepair.buttons.search') }}</el-button>
          <el-button @click="resetForm" >{{ $t('productRepair.buttons.reset') }}</el-button>
          <el-button
            type="primary"
            icon="el-icon-plus"
            @click="handleAdd('main')"
            v-if="$checkPermission('产品维修新增成品维修')"
            >{{ $t('productRepair.buttons.addMainRepair') }}</el-button
          >
          <el-button
            type="primary"
            icon="el-icon-plus"
            @click="handleAdd('auxiliary')"
            v-if="$checkPermission('产品维修新增组件维修')"
            >{{ $t('productRepair.buttons.addAuxiliaryRepair') }}</el-button
          >
          <el-button
            type="danger"
            icon="el-icon-delete"
            :disabled="!selection.length"
            v-if="$checkPermission('产品维修批量作废')"
            @click="handleBatchVoid"
            >{{ $t('productRepair.buttons.batchVoid') }}</el-button
          >
          <el-button
            type="success"

            icon="el-icon-check"
            :disabled="!selection.length"
            @click="handleBatchReview"
            v-if="$checkPermission('产品维修批量审核')"
            >{{ $t('productRepair.buttons.batchReview') }}</el-button
          >
          <el-button
            type="success"
            icon="el-icon-download"
            @click="handleExport"
            :loading="exportLoading"
          >
            {{ exportLoading ? `${$t('productRepair.buttons.exporting')}(${exportProgress}%)` : $t('productRepair.buttons.exportData') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="screen1">
      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-tickets">{{ $t('productRepair.table.repairRecordList') }}</i>
        </div>
      </div>
    </div>

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
      @handleSizeChange="baseTableHandleSizeChange"
    >
      <template slot="law">
        <el-table-column
          type="selection"
          width="55"
          align="center"
          fixed="left"
        />
        <el-table-column :label="$t('productRepair.table.productBarcode')" align="center" prop="barcode">
          <template slot-scope="scope">
            <el-link type="primary" @click="handleView(scope.row)">{{
              scope.row.barcode
            }}</el-link>
          </template>
        </el-table-column>

        <el-table-column :label="$t('productRepair.table.productModel')" align="center" prop="materialSpec">
          <template slot-scope="scope">
            {{ scope.row.materialSpec ? scope.row.materialSpec : $t('productRepair.table.noData') }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('productRepair.table.saleOrderNo')" align="center" prop="saleOrderNo" />
        <el-table-column
          :label="$t('productRepair.table.productionOrderNo')"
          align="center"
          prop="productionOrderNo"
        />
        <el-table-column :label="$t('productRepair.table.workOrderNo')" align="center" prop="workOrderNo" />

        <el-table-column
          :label="$t('productRepair.table.repairPerson')"
          align="center"
          prop="repairPerson.nickName"
        />

        <el-table-column :label="$t('productRepair.table.repairTime')" align="center" width="160">
          <template slot-scope="scope">
            {{ formatDate(scope.row.repairTime) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('productRepair.table.businessType')" align="center" prop="businessType">
          <template slot-scope="scope">
            <dict-tag
              :options="dict.type.businessType"
              :value="scope.row.businessType"
            />
          </template>
        </el-table-column>
        <el-table-column :label="$t('productRepair.table.solution')" align="center" prop="solution" />

        <el-table-column
          :label="$t('productRepair.table.defectDescription')"
          align="center"
          prop="defectDescription"
        >
          <template slot-scope="scope">
            {{
              scope.row.defectDescription
                ? scope.row.defectDescription
                : $t('productRepair.table.noData')
            }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('productRepair.table.causeAnalysis')" align="center" prop="causeAnalysis">
          <template slot-scope="scope">
            {{ scope.row.causeAnalysis ? scope.row.causeAnalysis : $t('productRepair.table.noData') }}
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('productRepair.table.repairDescription')"
          align="center"
          prop="repairDescription"
        >
          <template slot-scope="scope">
            {{
              scope.row.repairDescription
                ? scope.row.repairDescription
                : $t('productRepair.table.noData')
            }}
          </template>
        </el-table-column>

        <el-table-column :label="$t('productRepair.table.reviewer')" align="center" prop="reviewer.nickName">
          <template slot-scope="scope">
            {{ scope.row.reviewer ? scope.row.reviewer.nickName : $t('productRepair.table.noData') }}
          </template>
        </el-table-column>

        <el-table-column :label="$t('productRepair.table.reviewTime')" align="center" width="160">
          <template slot-scope="scope">
            {{ formatDate(scope.row.reviewTime) }}
          </template>
        </el-table-column>

        <el-table-column :label="$t('productRepair.table.productStatus')" align="center" width="100">
          <template slot-scope="scope">
            <el-tag :type="getProductStatusType(scope.row.productStatus)">
              {{ getProductStatusText(scope.row.productStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('productRepair.table.repairResult')"
          align="center"
          width="100"
          fixed="right"
        >
          <template slot-scope="scope">
            <el-tag
              :type="getRepairResultType(scope.row.repairResult)"
              v-if="scope.row.repairResult"
            >
              {{
                scope.row.repairResult
                  ? getRepairResultText(scope.row.repairResult)
                  : $t('productRepair.table.noData')
              }}
            </el-tag>
            <el-tag v-else>{{ $t('productRepair.table.noData') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('productRepair.table.status')" align="center" width="100" fixed="right">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('productRepair.table.operation')" width="250" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              @click="handleView(scope.row)"
              style="color: #409eff"

            >
              <i class="el-icon-view"></i> {{ $t('productRepair.buttons.view') }}
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="handleViewProductDetails(scope.row)"
              style="color: blue"

            >
              <i class="el-icon-view"></i> {{ $t('productRepair.buttons.viewProductDetails') }}
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="handleReview(scope.row)"
              style="color: green"
              v-if="
                scope.row.status == 'PENDING_REVIEW' &&
                $checkPermission('产品维修审核')
              "
            >
              <i class="el-icon-edit"></i> {{ $t('productRepair.buttons.review') }}
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="handleEdit(scope.row)"
              v-if="
                scope.row.status == 'PENDING_REVIEW' &&
                $checkPermission('产品维修修改')
              "
            >
              <i class="el-icon-edit"></i> {{ $t('productRepair.buttons.edit') }}
            </el-button>
            <el-button
              type="text"
              size="small"
              class="delete-btn"
              @click="handleVoid(scope.row)"
              v-if="
                scope.row.status == 'PENDING_REVIEW' &&
                $checkPermission('产品维修作废')
              "
            >
              <i class="el-icon-delete"></i> {{ $t('productRepair.buttons.void') }}
            </el-button>
          </template>
        </el-table-column>
      </template>
    </base-table>

    <edit-dialog
      :visible.sync="dialogFormVisible"
      :dialog-status="dialogStatus"
      :row-data="dataForm"
      :dialog-type="dialogType"
      @submit="handleSubmit"
    />

    <el-dialog :title="$t('productRepair.dialogs.review')" :visible.sync="reviewDialogVisible" width="30%">
      <el-form :model="reviewForm" ref="reviewForm" label-width="100px">
        <el-form-item
          :label="$t('productRepair.dialogs.repairResult')"
          prop="repairResult"
          v-if="!isScrapRepair"
        >
          <el-radio-group v-model="reviewForm.repairResult">
            <el-radio label="QUALIFIED">{{ $t('productRepair.repairResult.qualified') }}</el-radio>
            <el-radio label="UNQUALIFIED">{{ $t('productRepair.repairResult.unqualified') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('productRepair.dialogs.adverseEffect')" prop="adverseEffect">
          <el-input
            type="textarea"
            v-model="reviewForm.adverseEffect"
            :rows="3"
            :placeholder="$t('productRepair.dialogs.adverseEffectPlaceholder')"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="reviewDialogVisible = false">{{ $t('productRepair.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="submitReview">{{ $t('productRepair.buttons.confirm') }}</el-button>
      </div>
    </el-dialog>

    <el-dialog
      :title="$t('productRepair.dialogs.batchReview')"
      :visible.sync="batchReviewDialogVisible"
      width="30%"
    >
      <el-form
        :model="batchReviewForm"
        ref="batchReviewForm"
        label-width="100px"
      >
        <el-form-item
          :label="$t('productRepair.dialogs.repairResult')"
          prop="repairResult"
          v-if="!hasOnlyScrapRepairs"
        >
          <el-radio-group v-model="batchReviewForm.repairResult">
            <el-radio label="QUALIFIED">{{ $t('productRepair.repairResult.qualified') }}</el-radio>
            <el-radio label="UNQUALIFIED">{{ $t('productRepair.repairResult.unqualified') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('productRepair.dialogs.adverseEffect')" prop="adverseEffect">
          <el-input
            type="textarea"
            v-model="batchReviewForm.adverseEffect"
            :rows="3"
            :placeholder="$t('productRepair.dialogs.adverseEffectPlaceholder')"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="batchReviewDialogVisible = false">{{ $t('productRepair.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="submitBatchReview">{{ $t('productRepair.buttons.confirm') }}</el-button>
      </div>
    </el-dialog>

    <!-- 添加导出进度条对话框 -->
    <el-dialog
      :title="$t('productRepair.dialogs.exportProgress')"
      :visible.sync="exportDialogVisible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      width="30%"
    >
      <el-progress
        :percentage="exportProgress"
        :status="exportProgress === 100 ? 'success' : ''"
        :stroke-width="18"
      >
      </el-progress>
      <div style="text-align: center; margin-top: 10px">
        {{ exportProgress === 100 ? $t('productRepair.dialogs.exportComplete') : $t('productRepair.dialogs.exportingData') }}
      </div>
    </el-dialog>

    <!-- 产品详情弹窗 -->
    <el-dialog
      :title="$t('productRepair.dialogs.processFlowDetails') + ' - ' + productDetailsData.barcode"
      :visible.sync="productDetailsDialogVisible"
      width="80%"
      class="process-flow-dialog"
      :close-on-click-modal="false"
    >
      <div class="process-flow-container">
        <div class="process-section">
          <el-card class="process-card">
            <div slot="header">
              <span><i class="el-icon-time"></i> {{ $t('productRepair.processFlow.processFlowTitle') }}</span>
            </div>

            <div class="process-flow">
              <!-- 主产品物料信息 -->
              <div class="main-material">
                <div class="main-material-header">
                  <i class="el-icon-box"></i>
                  <span class="title">{{ $t('productRepair.dialogs.mainProductInfo') }}</span>
                  <el-tag type="primary" size="mini">{{
                    productDetailsData.materialCode
                  }}</el-tag>
                </div>
                <div class="main-material-content">
                  <div class="info-row">
                    <div class="info-item">
                      <label>{{ $t('productRepair.dialogs.productBarcode') }}</label>
                      <span>{{ productDetailsData.barcode }}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-item">
                      <label>{{ $t('productRepair.dialogs.materialName') }}</label>
                      <span>{{ productDetailsData.materialName }}</span>
                    </div>
                    <div class="info-item">
                      <label>{{ $t('productRepair.processFlow.specModel') }}</label>
                      <span>{{ productDetailsData.materialSpec }}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-item">
                      <label>{{ $t('productRepair.processFlow.overallProgress') }}</label>
                      <el-progress
                        :percentage="productDetailsData.progress || 0"
                      ></el-progress>
                    </div>
                    <div class="info-item">
                      <label>{{ $t('productRepair.processFlow.currentStatus') }}</label>
                      <el-tag
                        :type="getProcessStatusType(productDetailsData.status)"
                      >
                        {{ getProcessStatusText(productDetailsData.status) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 详情标签页 -->
              <el-tabs v-model="activeTab" type="border-card">
                <!-- 工序信息 -->
                <el-tab-pane :label="$t('productRepair.processFlow.processInfo')" name="process">
                  <process-step-list
                    ref="processStepList"
                    :loading="listLoading"
                    :flow-data="processedFlowChartData"
                  >
                  </process-step-list>
                </el-tab-pane>

                <!-- 物料信息 -->
                <el-tab-pane :label="$t('productRepair.processFlow.materialInfo')" name="material">
                  <material-info
                    :main-barcode="productDetailsData.barcode"
                    :flow-chart-data="processedFlowChartData"
                    @unbind-success="handleUnbindSuccess"
                    @replace-success="handleReplaceSuccess"
                  >
                  </material-info>
                </el-tab-pane>

                <!-- 物料条码信息 -->
                <el-tab-pane :label="$t('productRepair.processFlow.materialBarcodeInfo')" name="materialBarcode">
                  <material-barcode-info
                    :main-barcode="productDetailsData.barcode"
                    :material-barcode-data="processedMaterialBarcodeData"
                  >
                  </material-barcode-info>
                </el-tab-pane>

                <!-- 检测信息 -->
                <el-tab-pane :label="$t('productRepair.processFlow.inspectionInfo')" name="inspection">
                  <inspection-list
                    :inspections="productDetailsData"
                  ></inspection-list>
                </el-tab-pane>

                <!-- 解绑信息 -->
                <el-tab-pane :label="$t('productRepair.processFlow.unbindInfo')" name="unbind">
                  <unbind-record-list :unbind-records="unbindRecord">
                  </unbind-record-list>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-card>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import EditDialog from "./components/EditDialog";
import ProcessStepList from "@/components/ProcessStepList/index.vue";
import MaterialInfo from "@/views/productTraceability/components/MaterialInfo.vue";
import MaterialBarcodeInfo from "@/views/productTraceability/components/MaterialBarcodeInfo.vue";
import InspectionList from "@/components/InspectionList/index.vue";
import UnbindRecordList from "@/views/productTraceability/components/UnbindRecordList.vue";
import { reviewRepair, batchReviewRepair } from "@/api/product/productRepair";

export default {
  name: "productRepair",
  dicts: ["repair_solution", "businessType"],
  components: {
    EditDialog,
    ProcessStepList,
    MaterialInfo,
    MaterialBarcodeInfo,
    InspectionList,
    UnbindRecordList,
  },
  data() {
    return {
      searchForm: {
        barcode: "",
        materialSpec: "",
        solution: "",
        originalBarcode: "",
        newBarcode: "",
        batchNumber: "",
        status: "",
        materialNumber: "",
      },
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: true,
      dialogFormVisible: false,
      dialogStatus: "",
      dialogType: "",
      selection: [],
      dataForm: {},
      reviewDialogVisible: false,
      reviewForm: {
        repairResult: "",
        adverseEffect: "",
        _id: "",
      },
      batchReviewDialogVisible: false,
      batchReviewForm: {
        repairResult: "",
        adverseEffect: "",
      },
      hasMaintenanceAudit: false,
      hasFinishedProductMaintenance: false,
      hasComponentMaintenance: false,
      exportLoading: false,
      exportProgress: 0,
      exportDialogVisible: false,
      productDetailsDialogVisible: false,
      activeTab: "process",
      productDetailsData: {},
      processedFlowChartData: [],
      unbindRecord: [],
    };
  },
  computed: {
    processedMaterialBarcodeData() {
      if (!this.productDetailsData.processNodes) return [];

      // 创建工序映射
      const processMap = new Map();
      this.productDetailsData.processNodes.forEach((node) => {
        if (node.nodeType === "PROCESS_STEP") {
          processMap.set(node.nodeId, {
            processName: node.processName,
            processCode: node.processCode,
          });
        }
      });

      // 过滤并处理物料数据
      return this.productDetailsData.processNodes
        .filter((node) => node.nodeType === "MATERIAL" && node.barcode)
        .map((node) => {
          const processInfo = node.parentNodeId
            ? processMap.get(node.parentNodeId)
            : null;
          return {
            ...node,
            processName: processInfo ? processInfo.processName : "-",
            processCode: processInfo ? processInfo.processCode : "",
          };
        })
        .sort((a, b) => new Date(b.scanTime || 0) - new Date(a.scanTime || 0));
    },
    isScrapRepair() {
      // 检查是否是报废维修工单
      if (!this.reviewForm._id) return false;
      const row = this.tableList.find(
        (item) => item._id === this.reviewForm._id
      );
      return row && row.solution === this.$t('productRepair.solutionOptions.scrap');
    },
    hasOnlyScrapRepairs() {
      // 检查是否所有选中的都是报废工单
      if (!this.selection || this.selection.length === 0) return false;
      return this.selection.every((item) => item.solution === this.$t('productRepair.solutionOptions.scrap'));
    },
  },
  methods: {
    getLineTypeText(type) {
      const typeMap = {
        ASSEMBLY: this.$t('productRepair.lineTypes.assembly'),
        SMT: this.$t('productRepair.lineTypes.smt'),
        TESTING: this.$t('productRepair.lineTypes.testing'),
        PACKAGING: this.$t('productRepair.lineTypes.packaging'),
        OTHER: this.$t('productRepair.lineTypes.other'),
      };
      return typeMap[type] || type;
    },

    getStatusText(status) {
      const statusMap = {
        PENDING_REVIEW: this.$t('productRepair.status.pendingReview'),
        REVIEWED: this.$t('productRepair.status.reviewed'),
        VOIDED: this.$t('productRepair.status.voided'),
      };
      return statusMap[status] || status;
    },

    getStatusType(status) {
      const typeMap = {
        PENDING_REVIEW: "info",
        REVIEWED: "success",
        VOIDED: "danger",
      };
      return typeMap[status] || "info";
    },

    searchData() {
      let req = {
        query: {
          $and: [],
        },
      };

      if (this.searchForm.barcode) {
        req.query.$and.push({
          barcode: { $regex: this.searchForm.barcode, $options: "i" },
        });
      }
      if (this.searchForm.materialSpec) {
        req.query.$and.push({
          materialSpec: { $regex: this.searchForm.materialSpec, $options: "i" },
        });
      }
      if (this.searchForm.solution) {
        req.query.$and.push({
          solution: { $regex: this.searchForm.solution, $options: "i" },
        });
      }
      if (this.searchForm.workOrderNo) {
        req.query.$and.push({
          workOrderNo: { $regex: this.searchForm.workOrderNo, $options: "i" },
        });
      }
      if (this.searchForm.saleOrderNo) {
        req.query.$and.push({
          saleOrderNo: { $regex: this.searchForm.saleOrderNo, $options: "i" },
        });
      }
      if (this.searchForm.productionOrderNo) {
        req.query.$and.push({
          productionOrderNo: {
            $regex: this.searchForm.productionOrderNo,
            $options: "i",
          },
        });
      }
      if (this.searchForm.status) {
        req.query.$and.push({ status: this.searchForm.status });
      }
      if (this.searchForm.materialNumber) {
        req.query.$and.push({
          materialNumber: {
            $regex: this.searchForm.materialNumber,
            $options: "i",
          },
        });
      }

      if (this.searchForm.solution === "COMPONENT_REPLACEMENT") {
        if (this.searchForm.originalBarcode) {
          req.query.$and.push({
            originalBarcode: {
              $regex: this.searchForm.originalBarcode,
              $options: "i",
            },
          });
        }
        if (this.searchForm.newBarcode) {
          req.query.$and.push({
            newBarcode: { $regex: this.searchForm.newBarcode, $options: "i" },
          });
        }
      }

      if (!req.query.$and.length) {
        delete req.query.$and;
      }

      return req;
    },

    resetForm() {
      this.$refs.searchForm.resetFields();
      this.searchForm = {
        barcode: "",
        materialSpec: "",
        solution: "",
        originalBarcode: "",
        newBarcode: "",
        batchNumber: "",
        status: "",
        materialNumber: "",
      };
      this.currentPage = 1;
      this.fetchData();
    },

    async fetchData() {
      this.listLoading = true;
      try {
        let req = this.searchData();
        req.page = this.currentPage;
        req.skip = (this.currentPage - 1) * this.pageSize;
        req.limit = this.pageSize;
        req.count = true;
        req.sort = {
          _id: -1,
        };
        req.populate = JSON.stringify([
          { path: "repairPerson", select: "nickName" },
          { path: "reviewer", select: "nickName" },
        ]);
        const result = await getData("product_repair", req);
        this.tableList = result.data;
        this.total = result.countnum;
      } catch (error) {
        console.error("获取数据失败:", error);
        this.$message.error(this.$t('productRepair.messages.getDataFailed'));
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
      if (!date) return this.$t('productRepair.table.noData');
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "无效日期";
      }
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const hour = String(dateObj.getHours()).padStart(2, "0");
      const minute = String(dateObj.getMinutes()).padStart(2, "0");
      const second = String(dateObj.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
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
      this.dialogStatus = "view";
      this.dialogFormVisible = true;
    },

    handleEdit(row) {
      // 审核不可删除
      if (row.status === "REVIEWED") {
        this.$message.warning(this.$t('productRepair.messages.recordReviewedCannotEdit'));
        return;
      }
      this.dialogStatus = "edit";
      this.dataForm = JSON.parse(JSON.stringify(row));
      this.dialogFormVisible = true;
    },
    handleVoid(row) {
      // 审核不可删除
      if (row.status === "REVIEWED") {
        this.$message.warning(this.$t('productRepair.messages.recordReviewedCannotVoid'));
        return;
      }
      this.$confirm("确认要作废该产品维修记录吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(async () => {
        let req = {
          query: { _id: row._id },
          update: { $set: { status: "VOIDED" } },
        };
        await updateData("product_repair", req);
        this.$message.success(this.$t('productRepair.messages.voidSuccess'));
        this.fetchData();
      });
    },
    handleDelete(row) {
      this.$confirm("确认要删除该产品维修记录吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          try {
            await removeData("product_repair", { query: { _id: row._id } });
            this.$message.success(this.$t('productRepair.messages.deleteSuccess'));
            this.fetchData();
          } catch (error) {
            console.error("删除失败:", error);
            this.$message.error(this.$t('productRepair.messages.deleteFailed'));
          }
        })
        .catch(() => {
          this.$message.info(this.$t('productRepair.messages.deleteCancel'));
        });
    },

    handleAdd(type) {
      this.dialogStatus = "create";
      this.dialogType = type;
      this.dataForm = {};
      this.dialogFormVisible = true;
    },

    handleBatchVoid() {
      if (!this.selection.length) {
        this.$message.warning(this.$t('productRepair.messages.pleaseSelectRecordsToDelete'));
        return;
      }
      // 检查是否包含已审核的记录
      const hasReviewedRecords = this.selection.some(
        (item) => item.status === "REVIEWED"
      );
      if (hasReviewedRecords) {
        this.$message.warning(this.$t('productRepair.messages.selectedRecordsContainReviewed'));
        return;
      }

      this.$confirm(
        `确认作废选中的 ${this.selection.length} 条记录吗？`,
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(async () => {
          try {
            this.listLoading = true;
            const ids = this.selection.map((item) => item._id);
            let req = {
              query: { _id: { $in: ids } },
              update: { $set: { status: "VOIDED" } },
            };
            await updateData("product_repair", req);
            this.$message.success(this.$t('productRepair.messages.batchVoidSuccess'));
            this.selection = []; // 清空选择
            await this.fetchData();
          } catch (error) {
            console.error("批量作废失败:", error);
            this.$message.error(this.$t('productRepair.messages.batchVoidFailed'));
          } finally {
            this.listLoading = false;
          }
        })
        .catch(() => {
          this.$message.info(this.$t('productRepair.messages.voidCancelled'));
        });
    },

    async handleSubmit() {
      try {
        this.dialogFormVisible = false;
        this.fetchData();
      } catch (error) {
        console.error("操作失败:", error);
        this.$message.error(this.$t('productRepair.messages.operationFailed'));
      }
    },

    getRepairResultText(result) {
      const resultMap = {
        QUALIFIED: this.$t('productRepair.repairResult.qualified'),
        UNQUALIFIED: this.$t('productRepair.repairResult.unqualified'),
      };
      return resultMap[result] || result;
    },

    getRepairResultType(result) {
      const typeMap = {
        QUALIFIED: "success",
        UNQUALIFIED: "danger",
      };
      return typeMap[result] || "";
    },

    handleReview(row) {
      if (row.status === "REVIEWED") {
        this.$message.warning(this.$t('productRepair.messages.recordAlreadyReviewed'));
        return;
      }
      this.reviewForm = {
        repairResult: "",
        adverseEffect: "",
        _id: row._id,
      };
      this.reviewDialogVisible = true;
    },

    async submitReview() {
      try {
        const row = this.tableList.find(
          (item) => item._id === this.reviewForm._id
        );

        // 如果是报废处理方案，不需要选择维修结果
        if (row && row.solution === this.$t('productRepair.solutionOptions.scrap')) {
          // 直接审核通过，不需要维修结果
          const response = await reviewRepair({
            repairId: this.reviewForm._id,
            adverseEffect: this.reviewForm.adverseEffect,
            userId: this.$store.state.user.id,
          });

          if (response.code === 200) {
            this.$message.success(this.$t('productRepair.messages.scrapReviewSuccess'));
            this.reviewDialogVisible = false;
            this.fetchData();
          } else {
            // 处理关键物料的情况
            if (
              response.code != 200 &&
              response.data &&
              response.data.keyMaterials
            ) {
              // 显示关键物料列表
              const keyMaterialsInfo = response.data.keyMaterials
                .map(
                  (item) =>
                    `${item.materialName}(${
                      item.materialCode || "无编码"
                    }) - 条码: ${item.barcode}`
                )
                .join("<br/>");

              this.$alert(
                `<div style="max-height: 300px; overflow-y: auto;">
                                    <p>${response.message}</p>
                                    <p>关键物料列表:</p>
                                    <p>${keyMaterialsInfo}</p>
                                </div>`,
                "审核失败",
                {
                  dangerouslyUseHTMLString: true,
                  confirmButtonText: "确定",
                  type: "warning",
                }
              );
            } else if (
              response.code === 401 &&
              response.data &&
              response.data.requireUnbind
            ) {
              // 处理部件更换验证失败的情况
              this.$alert(
                `<div style="max-height: 300px; overflow-y: auto;">
                                  <p>${response.message}</p>
                                  <p><strong>产品条码:</strong> ${response.data.barcode}</p>
                                  ${response.data.unbindRecordsCount ? 
                                    `<p><strong>现有解绑记录数:</strong> ${response.data.unbindRecordsCount}</p>` : 
                                    ''
                                  }
                                  <p style="color: #f56c6c; margin-top: 10px;">
                                    <i class="el-icon-warning"></i> 
                                    请先在产品详情中进行部件解绑操作
                                  </p>
                              </div>`,
                "部件更换审核失败",
                {
                  dangerouslyUseHTMLString: true,
                  confirmButtonText: "确定",
                  type: "warning",
                }
              );
            } else {
              this.$message.error(response.message || this.$t('productRepair.messages.reviewFailed'));
            }
          }
          return;
        }

        // 非报废处理方案，需要选择维修结果
        if (!this.reviewForm.repairResult) {
          this.$message.warning(this.$t('productRepair.messages.pleaseSelectRepairResult'));
          return;
        }

        const response = await reviewRepair({
          repairId: this.reviewForm._id,
          repairResult: this.reviewForm.repairResult,
          adverseEffect: this.reviewForm.adverseEffect,
          userId: this.$store.state.user.id,
        });

        if (response.code === 200) {
          this.$message.success(this.$t('productRepair.messages.reviewSuccess'));
          this.reviewDialogVisible = false;
          this.fetchData();
        } else {
          // 处理关键物料的情况
          if (
            response.code === 400 &&
            response.data &&
            response.data.keyMaterials
          ) {
            // 显示关键物料列表
            const keyMaterialsInfo = response.data.keyMaterials
              .map(
                (item) =>
                  `${item.materialName}(${
                    item.materialCode || "无编码"
                  }) - 条码: ${item.barcode}`
              )
              .join("<br/>");

            this.$alert(
              `<div style="max-height: 300px; overflow-y: auto;">
                                <p>${response.message}</p>
                                <p>关键物料列表:</p>
                                <p>${keyMaterialsInfo}</p>
                            </div>`,
              "审核失败",
              {
                dangerouslyUseHTMLString: true,
                confirmButtonText: "确定",
                type: "warning",
              }
            );
          } else if (
            response.code === 401 &&
            response.data &&
            response.data.requireUnbind
          ) {
            // 处理部件更换验证失败的情况
            this.$alert(
              `<div style="max-height: 300px; overflow-y: auto;">
                                <p>${response.message}</p>
                                <p><strong>产品条码:</strong> ${response.data.barcode}</p>
                                ${response.data.unbindRecordsCount ? 
                                  `<p><strong>现有解绑记录数:</strong> ${response.data.unbindRecordsCount}</p>` : 
                                  ''
                                }
                                <p style="color: #f56c6c; margin-top: 10px;">
                                  <i class="el-icon-warning"></i> 
                                  请先在产品详情中进行部件解绑操作
                                </p>
                            </div>`,
              "部件更换审核失败",
              {
                dangerouslyUseHTMLString: true,
                confirmButtonText: "确定",
                type: "warning",
              }
            );
          } else {
            this.$message.error(response.message || this.$t('productRepair.messages.reviewFailed'));
          }
        }
      } catch (error) {
        console.error("审核失败:", error);
        this.$message.error(this.$t('productRepair.messages.reviewFailed') + ": " + (error.message || "未知错误"));
      }
    },

    handleBatchReview() {
      if (!this.selection.length) {
        this.$message.warning(this.$t('productRepair.messages.pleaseSelectRecordsToReview'));
        return;
      }

      // 检查是否包含已审核或已作废的记录
      const invalidRecords = this.selection.some(
        (item) => item.status === "REVIEWED" || item.status === "VOIDED"
      );

      if (invalidRecords) {
        this.$message.warning(
          this.$t('productRepair.messages.selectedRecordsContainInvalid')
        );
        return;
      }

      this.batchReviewForm = {
        repairResult: "",
        adverseEffect: "",
      };
      this.batchReviewDialogVisible = true;
    },

    async submitBatchReview() {
      try {
        // 检查是否包含报废处理方案的记录
        const hasScrapItems = this.selection.some(
          (item) => item.solution === this.$t('productRepair.solutionOptions.scrap')
        );

        // 如果包含报废记录，可以不要求选择维修结果
        if (hasScrapItems && !this.batchReviewForm.repairResult) {
          const scrapIds = this.selection
            .filter((item) => item.solution === this.$t('productRepair.solutionOptions.scrap'))
            .map((item) => item._id);

          const nonScrapIds = this.selection
            .filter((item) => item.solution !== this.$t('productRepair.solutionOptions.scrap'))
            .map((item) => item._id);

          // 先处理非报废记录
          if (nonScrapIds.length > 0) {
            this.$message.warning(this.$t('productRepair.messages.nonScrapRecordsNeedResult'));
            return;
          }

          // 处理报废记录
          const response = await batchReviewRepair({
            repairIds: scrapIds,
            adverseEffect: this.batchReviewForm.adverseEffect,
            userId: this.$store.state.user.id,
          });

          if (response.code === 200) {
            this.$message.success(
              this.$t('productRepair.messages.batchReviewSuccessTemplate')
                .replace('{updatedCount}', response.data.updatedCount)
                .replace('{scrapCount}', response.data.scrapCount)
            );
            this.batchReviewDialogVisible = false;
            this.selection = [];
            this.fetchData();
          } else {
            // 处理关键物料的情况
            if (
              response.code === 400 &&
              response.data &&
              response.data.barcodeWithKeyMaterials
            ) {
              // 构建批量关键物料信息展示
              let barcodeInfo = "";
              response.data.barcodeWithKeyMaterials.forEach((item) => {
                barcodeInfo += `<div style="margin-bottom: 10px;">
                                    <strong>条码: ${item.barcode}</strong>
                                    <ul style="margin: 5px 0 0 20px;">`;

                item.keyMaterials.forEach((material) => {
                  barcodeInfo += `<li>${material.materialName}(${
                    material.materialCode || "无编码"
                  }) - 条码: ${material.barcode}</li>`;
                });

                barcodeInfo += `</ul></div>`;
              });

              this.$alert(
                `<div style="max-height: 400px; overflow-y: auto;">
                                    <p>${response.message}</p>
                                    <p>具体信息:</p>
                                    ${barcodeInfo}
                                </div>`,
                "批量审核失败",
                {
                  dangerouslyUseHTMLString: true,
                  confirmButtonText: "确定",
                  type: "warning",
                }
              );
            } else if (
              response.code === 401 &&
              response.data &&
              response.data.barcodeWithoutUnbindRecords
            ) {
              // 处理部件更换验证失败的情况
              let unbindInfo = "";
              response.data.barcodeWithoutUnbindRecords.forEach((item) => {
                unbindInfo += `<div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid #f56c6c; background-color: #fef0f0;">
                                <p><strong>条码:</strong> ${item.barcode}</p>
                                <p><strong>问题:</strong> ${item.message}</p>
                                ${item.unbindRecordsCount ? 
                                  `<p><strong>现有解绑记录数:</strong> ${item.unbindRecordsCount}</p>` : 
                                  ''
                                }
                              </div>`;
              });

              this.$alert(
                `<div style="max-height: 400px; overflow-y: auto;">
                                    <p>${response.message}</p>
                                    <div style="margin: 15px 0;">
                                      <h4 style="color: #f56c6c; margin-bottom: 10px;">
                                        <i class="el-icon-warning"></i> 详细信息:
                                      </h4>
                                      ${unbindInfo}
                                    </div>
                                    <p style="color: #f56c6c; margin-top: 15px; padding: 10px; background-color: #fef0f0; border-radius: 4px;">
                                      <i class="el-icon-info"></i> 
                                      请先在产品详情中为这些产品进行部件解绑操作，然后再进行审核
                                    </p>
                                </div>`,
                "部件更换批量审核失败",
                {
                  dangerouslyUseHTMLString: true,
                  confirmButtonText: "确定",
                  type: "warning",
                }
              );
            } else {
              this.$message.error(response.message || this.$t('productRepair.messages.batchReviewFailed'));
            }
          }
          return;
        }

        // 常规处理逻辑，要求选择维修结果
        if (!this.batchReviewForm.repairResult) {
          this.$message.warning(this.$t('productRepair.messages.pleaseSelectRepairResult'));
          return;
        }

        const ids = this.selection.map((item) => item._id);

        const response = await batchReviewRepair({
          repairIds: ids,
          repairResult: this.batchReviewForm.repairResult,
          adverseEffect: this.batchReviewForm.adverseEffect,
          userId: this.$store.state.user.id,
        });

        if (response.code === 200) {
          this.$message.success(
            this.$t('productRepair.messages.batchReviewSuccessTemplate')
              .replace('{updatedCount}', response.data.updatedCount)
              .replace('{scrapCount}', response.data.scrapCount)
          );
          this.batchReviewDialogVisible = false;
          this.selection = [];
          this.fetchData();
        } else {
          // 处理关键物料的情况
          if (
            response.code === 400 &&
            response.data &&
            response.data.barcodeWithKeyMaterials
          ) {
            // 构建批量关键物料信息展示
            let barcodeInfo = "";
            response.data.barcodeWithKeyMaterials.forEach((item) => {
              barcodeInfo += `<div style="margin-bottom: 10px;">
                                <strong>条码: ${item.barcode}</strong>
                                <ul style="margin: 5px 0 0 20px;">`;

              item.keyMaterials.forEach((material) => {
                barcodeInfo += `<li>${material.materialName}(${
                  material.materialCode || "无编码"
                }) - 条码: ${material.barcode}</li>`;
              });

              barcodeInfo += `</ul></div>`;
            });

            this.$alert(
              `<div style="max-height: 400px; overflow-y: auto;">
                                <p>${response.message}</p>
                                <p>具体信息:</p>
                                ${barcodeInfo}
                            </div>`,
              "批量审核失败",
              {
                dangerouslyUseHTMLString: true,
                confirmButtonText: "确定",
                type: "warning",
              }
            );
          } else {
            this.$message.error(response.message || this.$t('productRepair.messages.batchReviewFailed'));
          }
        }
      } catch (error) {
        console.error("批量审核失败:", error);
        this.$message.error(this.$t('productRepair.messages.batchReviewFailed') + ": " + (error.message || "未知错误"));
      }
    },

    async handleExport() {
      this.exportLoading = true;
      this.exportProgress = 0;
      this.exportDialogVisible = true;

      try {
        // 构建查询条件
        let req = this.searchData();
        req.populate = JSON.stringify([
          { path: "repairPerson", select: "nickName" },
          { path: "reviewer", select: "nickName" },
        ]);

        // 获取所有数据（不分页）
        const result = await getData("product_repair", req);
        const totalItems = result.data.length;

        if (totalItems === 0) {
          this.$message.warning(this.$t('productRepair.messages.noRecordsFound'));
          this.exportDialogVisible = false;
          this.exportLoading = false;
          return;
        }

        // 准备 Excel 数据
        const exportData = [];
        const batchSize = 100;
        const header = [
          "产品条码",
          "物料编号",
          "产品型号",
          "销售订单",
          "生产订单",
          "生产工单",
          "维修上报人",
          "维修时间",
          "业务类型",
          "处理方案",
          "不良现象",
          "分析原因",
          "维修描述",
          "审核人",
          "审核时间",
          "维修结果",
          "状态",
        ];

        for (let i = 0; i < totalItems; i += batchSize) {
          const batch = result.data.slice(i, i + batchSize).map((item) => {
            // 处理业务类型
            let businessTypeLabel = "";
            const businessTypeDict = this.dict.type.businessType.find(
              (dict) => dict.value === item.businessType
            );
            if (businessTypeDict) {
              businessTypeLabel = businessTypeDict.label;
            } else {
              businessTypeLabel = item.businessType;
            }

            return [
              item.barcode,
              item.materialCode,
              item.materialSpec || this.$t('productRepair.table.noData'),
              item.saleOrderNo,
              item.productionOrderNo,
              item.workOrderNo,
              item.repairPerson ? item.repairPerson.nickName : this.$t('productRepair.table.noData'),
              this.formatDate(item.repairTime),
              businessTypeLabel,
              item.solution,
              item.defectDescription || this.$t('productRepair.table.noData'),
              item.causeAnalysis || this.$t('productRepair.table.noData'),
              item.repairDescription || this.$t('productRepair.table.noData'),
              item.reviewer ? item.reviewer.nickName : this.$t('productRepair.table.noData'),
              this.formatDate(item.reviewTime),
              this.getRepairResultText(item.repairResult),
              this.getStatusText(item.status),
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

        // 导出Excel
        import("@/vendor/Export2Excel").then((excel) => {
          excel.export_json_to_excel({
            header: header,
            data: exportData,
            filename: "维修记录_" + new Date().getTime(),
            autoWidth: true,
            bookType: "xlsx",
          });
          this.exportProgress = 100;
          this.$message.success(this.$t('productRepair.messages.exportSuccess'));
        });

        // 延迟关闭对话框
        setTimeout(() => {
          this.exportDialogVisible = false;
          this.exportProgress = 0;
        }, 1000);
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error(this.$t('productRepair.messages.exportFailed'));
        this.exportDialogVisible = false;
      } finally {
        this.exportLoading = false;
      }
    },
    handleSolutionChange(value) {
      if (value !== "COMPONENT_REPLACEMENT") {
        this.searchForm.originalBarcode = "";
        this.searchForm.newBarcode = "";
      }
    },
    // 查看产品详情
    async handleViewProductDetails(row) {
      try {
        this.listLoading = true;
        const result = await getData("material_process_flow", {
          query: { barcode: row.barcode },
        });

        if (result.code === 200 && result.data.length > 0) {
          this.productDetailsData = result.data[0];
          this.processedFlowChartData = this.processNodes(
            this.productDetailsData.processNodes
          );
          this.productDetailsDialogVisible = true;

          // 获取解绑记录
          const unbindRecord = await getData("unbindRecord", {
            query: { flowRecordId: this.productDetailsData._id },
            populate: JSON.stringify([{ path: "operatorId" }]),
          });
          this.unbindRecord = unbindRecord.data;
        } else {
          this.$message.error(this.$t('productRepair.messages.getProductDetailsFailed'));
        }
      } catch (error) {
        console.error("获取产品详情失败:", error);
        this.$message.error(this.$t('productRepair.messages.getProductDetailsFailed') + ": " + error.message);
      } finally {
        this.listLoading = false;
      }
    },

    // 处理流程节点数据
    processNodes(nodes) {
      if (!nodes || !nodes.length) return [];

      const nodeMap = new Map();
      nodes.forEach((node) => {
        nodeMap.set(node.nodeId, {
          ...node,
          children: [],
        });
      });

      const result = [];
      nodes.forEach((node) => {
        const processedNode = nodeMap.get(node.nodeId);

        if (node.parentNodeId && nodeMap.has(node.parentNodeId)) {
          const parentNode = nodeMap.get(node.parentNodeId);
          parentNode.children.push(processedNode);
        } else {
          result.push(processedNode);
        }
      });

      const sortChildren = (node) => {
        if (node.children && node.children.length) {
          if (node.nodeType === "PROCESS_STEP") {
            node.children.sort((a, b) =>
              (a.materialCode || "").localeCompare(b.materialCode || "")
            );
          } else if (node.nodeType === "MATERIAL") {
            node.children.sort(
              (a, b) => (a.processSort || 0) - (b.processSort || 0)
            );
          }
          node.children.forEach((child) => sortChildren(child));
        }
      };

      result.forEach((node) => sortChildren(node));
      return result;
    },

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

    // 处理解绑成功
    async handleUnbindSuccess() {
      // 重新加载数据
      if (this.productDetailsData._id) {
        await this.handleViewProductDetails({
          barcode: this.productDetailsData.barcode,
        });
      }
    },

    // 处理替换成功
    async handleReplaceSuccess() {
      // 重新加载数据
      if (this.productDetailsData._id) {
        await this.handleViewProductDetails({
          barcode: this.productDetailsData.barcode,
        });
      }
    },

    getProductStatusText(status) {
      const statusMap = {
        NORMAL: this.$t('productRepair.productStatus.normal'),
        REPAIRING: this.$t('productRepair.productStatus.repairing'),
        SCRAP: this.$t('productRepair.productStatus.scrap'),
      };
      return statusMap[status] || status;
    },

    getProductStatusType(status) {
      const typeMap = {
        NORMAL: "success",
        REPAIRING: "warning",
        SCRAP: "danger",
      };
      return typeMap[status] || "info";
    },
  },
  created() {
    this.fetchData();
    const roles = this.$store.getters.roles;
    if (!roles || !roles.buttonList) {
      return false;
    }
    console.log(roles.buttonList, "roles.buttonList");
    //审核权限
    if (roles.buttonList.includes("maintenance_audit")) {
      this.hasMaintenanceAudit = true;
    }

    //成品维修权限 finished_product_maintenance
    if (roles.buttonList.includes("finished_product_maintenance")) {
      this.hasFinishedProductMaintenance = true;
    }
    // 组件维修 component_maintenance
    if (roles.buttonList.includes("component_maintenance")) {
      this.hasComponentMaintenance = true;
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

.table-operations {
  margin: 15px 0;
  display: flex;
  gap: 10px;
}

.delete-btn {
  color: #f56c6c;

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

.process-flow-dialog {
  .main-material {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    margin-bottom: 20px;

    .main-material-header {
      background-color: #f5f7fa;
      padding: 12px;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      align-items: center;

      i {
        margin-right: 8px;
        color: #409eff;
      }

      .title {
        font-weight: bold;
        margin-right: 12px;
      }
    }

    .main-material-content {
      padding: 16px;

      .info-row {
        display: flex;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .info-item {
          flex: 1;
          display: flex;
          align-items: center;

          label {
            color: #606266;
            margin-right: 8px;
            min-width: 80px;
          }
        }
      }
    }
  }
}
</style>
