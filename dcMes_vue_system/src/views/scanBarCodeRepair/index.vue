<template>
  <div class="scan-container repair-theme" v-loading="loading">
    <div class="left-form" :class="{ collapsed: isCollapsed }">
      <el-card class="init-card">
        <!-- 标题部分 -->
        <div class="card-header">
          <span>
            <i class="el-icon-tools"></i>
            {{ $t('scanBarCodeRepair.processSettings.title') }}</span
          >
          <!-- 移除自动获取工序的开关 -->
        </div>
        <el-form :model="formData" label-width="100px">
          <!-- 产品型号 -->
          <div class="form-section">
            <div class="section-header">
              <el-tag :type="websocketConnected ? 'success' : 'danger'">
                <i class="el-icon-connection"></i>
                {{ websocketConnected ? $t('scanBarCodeRepair.status.connected') : $t('scanBarCodeRepair.status.disconnected') }}</el-tag
              >
              <span> {{ $t('scanBarCodeRepair.processSettings.repairBasicInfo') }} </span>
            </div>

            <el-form-item :label="$t('scanBarCodeRepair.processSettings.productModel')">
              <zr-select
                v-if="!mainMaterialId"
                v-model="formData.productModel"
                collection="k3_BD_MATERIAL"
                :disabled="!!mainMaterialId && !!processStepId"
                :search-fields="['FNumber', 'FName']"
                label-key="FName"
                sub-key="FMATERIALID"
                :multiple="false"
                :placeholder="$t('scanBarCodeRepair.processSettings.productModelPlaceholder')"
                @select="handleProductChange"
              >
                <template #option="{ item }">
                  <div class="item-option">
                    <div class="item-info">
                      <span>{{ item.FNumber }} - {{ item.FName }}</span>
                      <el-tag size="mini" type="info"
                        >{{ item.FMATERIALID }} -{{
                          item.FUseOrgId_FName
                        }}</el-tag
                      >
                    </div>
                  </div>
                </template>
              </zr-select>
              <el-input
                v-else
                v-model="formData.productName"
                :placeholder="$t('scanBarCodeRepair.processSettings.productModelPlaceholder')"
                :disabled="!!mainMaterialId && !!processStepId"
              />
            </el-form-item>

            <el-form-item :label="$t('scanBarCodeRepair.processSettings.processStep')">
              <el-select
                v-model="formData.processStep"
                :placeholder="$t('scanBarCodeRepair.processSettings.processStepPlaceholder')"
                @change="handleProcessChange"
                class="custom-select"
                :disabled="!!mainMaterialId && !!processStepId"
              >
                <el-option
                  v-for="item in processStepOptions"
                  :key="item._id"
                  :label="item.processName"
                  :value="item._id"
                >
                  <div class="option-content">
                    <span class="option-main">{{
                      `${item.levelPrefix || ""}${item.sort}.${
                        item.processName
                      }`
                    }}</span>
                    <span class="option-sub">{{ item.processCode }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- <el-form-item label="维修类型">
              <el-select
                v-model="formData.repairType"
                placeholder="请选择维修类型"
                class="custom-select"
                :disabled="!!mainMaterialId && !!processStepId"
              >
                <el-option label="返修" value="rework"></el-option>
                <el-option label="维修" value="repair"></el-option>
                <el-option label="更换" value="replace"></el-option>
              </el-select>
            </el-form-item> -->

            <el-form-item :label="$t('scanBarCodeRepair.processSettings.productionLine')">
              <zr-select
                v-if="!mainMaterialId"
                :disabled="!!mainMaterialId && !!processStepId"
                v-model="formData.productLine"
                collection="production_line"
                :search-fields="['lineCode', 'lineName']"
                label-key="lineName"
                tag-key="lineCode"
                sub-key="workshop"
                :multiple="false"
                :placeholder="$t('scanBarCodeRepair.processSettings.productionLinePlaceholder')"
                @select="handleProductionLineSelect"
              />
              <el-input
                v-else
                v-model="formData.lineName"
                :placeholder="$t('scanBarCodeRepair.processSettings.productionLinePlaceholder')"
                :disabled="!!mainMaterialId && !!processStepId"
              />
            </el-form-item>

            <el-form-item :label="$t('scanBarCodeRepair.processSettings.workOrder')" required>
              <div class="input-with-buttons">
                <zr-select
                  v-if="!mainMaterialId"
                  :disabled="!!mainMaterialId && !!processStepId"
                  v-model="formData.workProductionPlanWorkOrderId"
                  collection="production_plan_work_order"
                  :search-fields="['workOrderNo', 'materialName']"
                  label-key="workOrderNo"
                  tag-key="materialName"
                  sub-key="inputQuantity"
                  :multiple="false"
                  :placeholder="$t('scanBarCodeRepair.processSettings.workOrderPlaceholder')"
                  :query-params="workOrderQueryParams"
                  @select="handleWorkOrderSelect"
                >
                  <template #option="{ item }">
                    <div class="item-option">
                      <div class="item-info">
                        <span>{{ item.workOrderNo }} - {{ item.materialName }}</span>
                        <el-tag size="mini" type="info">{{ item.lineName }}</el-tag>
                      </div>
                      <div>
                        <small>计划: {{item.planProductionQuantity}}</small>
                        <small>投入: {{item.inputQuantity}}</small>
                      </div>
                    </div>
                  </template>
                </zr-select>
                <el-input
                  v-else
                  v-model="workProductionPlanWorkOrderNo"
                  :placeholder="$t('scanBarCodeRepair.processSettings.workOrderPlaceholder')"
                  :disabled="!!mainMaterialId && !!processStepId"
                />
                <el-button
                  v-if="formData.workProductionPlanWorkOrderId && !mainMaterialId"
                  type="text"
                  icon="el-icon-delete"
                  @click="clearWorkOrder"
                  :title="$t('scanBarCodeRepair.buttons.clearWorkOrder')"
                ></el-button>
              </div>
            </el-form-item>
          </div>

          <!-- 按钮部分 -->
          <div class="button-group" v-if="$checkPermission('产线编辑配置')">
            <el-button
              type="danger"
              @click="handleCancelSave"
              icon="el-icon-close"
              v-if="mainMaterialId && processStepId"
            >
              {{ $t('scanBarCodeRepair.processSettings.cancelSettings') }}
            </el-button>
            <el-button
              type="primary"
              v-else
              @click="handleSave"
              icon="el-icon-check"
            >
              {{ $t('scanBarCodeRepair.processSettings.saveSettings') }}
            </el-button>
          </div>
        </el-form>
      </el-card>
    </div>
    <div class="right-content">
      <template
        v-if="
          mainMaterialId &&
          processStepId &&
          (processStepData.processType == 'D' ||
            processStepData.processType == 'C')
        "
      >
        <el-card class="scan-card repair-card">
          <!-- 标题部分 -->
          <div class="card-header">
            <div class="header-left">
              <i class="el-icon-cpu"></i>
              <span>{{ $t('scanBarCodeRepair.scanning.title') }}</span>
              <el-button type="text" @click="toggleCollapse">
                <i
                  :class="
                    isCollapsed
                      ? 'el-icon-d-arrow-right'
                      : 'el-icon-d-arrow-left'
                  "
                ></i>
                {{ isCollapsed ? $t('scanBarCodeRepair.buttons.expand') : $t('scanBarCodeRepair.buttons.collapse') }}
              </el-button>
            </div>
            <el-button
              type="text"
              @click="handleClearCache"
              icon="el-icon-delete"
            >
              {{ $t('scanBarCodeRepair.buttons.clearCache') }}
            </el-button>
          </div>

          <el-form :model="scanForm" ref="scanForm" label-width="100%">
            <!-- 工单信息模块 -->
            <!-- <div
              class="work-order-info repair-info"
              v-if="firstStep && workOrderInfo.workOrderNo !== ''"
            >
              <div class="info-item">
                <span class="label">维修工单号：</span>
                <span class="value">{{
                  workOrderInfo.workOrderNo || "暂无工单"
                }}</span>
              </div>
              <div class="info-item">
                <span class="label">维修数量：</span>
                <span class="value2">{{
                  workOrderInfo.inputQuantity || 0
                }}</span>
                <span class="separator">/</span>
                <span class="value">{{
                  workOrderInfo.planProductionQuantity || 0
                }}</span>
              </div>
            </div> -->

            <div class="section-header repair-section-header">
              <i class="el-icon-camera"></i>
              <span>{{ $t('scanBarCodeRepair.scanning.scanArea') }}</span>
            </div>

            <div class="scan-input-section repair-scan-section">
              <div class="custom-input-container">
                <input
                  type="text"
                  v-model="unifiedScanInput"
                  :placeholder="$t('scanBarCodeRepair.scanning.scanPlaceholder')"
                  @keyup.enter="handleUnifiedScan(unifiedScanInput)"
                  ref="scanInput"
                  class="custom-input"
                />
                <i
                  v-if="unifiedScanInput"
                  class="el-icon-close custom-clear-icon"
                  @click="clearInput"
                ></i>
              </div>
            </div>

            <div class="section-header repair-section-header">
              <div class="section-title">
                <i class="el-icon-cpu"></i>
                <span>{{ $t('scanBarCodeRepair.scanning.mainMaterial') }}</span>
              </div>
              <el-switch
                v-model="enableConversion"
                :active-text="$t('scanBarCodeRepair.scanning.conversion')"
                :inactive-text="$t('scanBarCodeRepair.scanning.normal')"
                class="print-switch"
                @change="handleConversionChange"
              >
              </el-switch>
              <div class="print-batch-btn">
                <hir-input
                  ref="hirInput"
                  :default-template="localPrintTemplate"
                  @template-change="handleTemplateChange"
                  :show-preview="true"
                  :show-browser-print="false"
                  :show-silent-print="true"
                  :printData="printData"
                />
              </div>
            </div>
            <div class="material-section repair-material-section">
              <el-form-item
                :label="`编号：${mainMaterialCode}  名称：${mainMaterialName}`"
                label-width="100%"
                class="vertical-form-item"
              >
                <div class="input-with-status">
                  <el-input
                    v-model="scanForm.mainBarcode"
                    :placeholder="$t('scanBarCodeRepair.scanning.scanMainBarcodePlaceholder')"
                    :class="{ 'valid-input': validateStatus['mainBarcode'] }"
                    readonly
                  >
                    <template slot="prefix">
                      <i class="el-icon-monitor"></i>
                    </template>
                  </el-input>
                  <div
                    class="status-indicator"
                    :class="{ valid: validateStatus['mainBarcode'] }"
                  >
                    <i :class="getValidateIcon('mainBarcode')"></i>
                  </div>
                </div>
              </el-form-item>
            </div>

            <!-- 子物料部分 -->
            <div class="section-header repair-section-header">
              <i class="el-icon-bangzhu"></i>
              <span>{{ $t('scanBarCodeRepair.scanning.repairComponents') }}</span>
            </div>
            <div class="material-section">
              <el-row :gutter="20">
                <el-col
                  :span="12"
                  v-for="material in processMaterials"
                  :key="material._id"
                >
                  <el-form-item
                    :label="`编号：${material.materialCode}  名称：${material.materialName}  `"
                    class="vertical-form-item"
                  >
                    <div class="input-with-status">
                      <el-input
                        v-model="scanForm.barcodes[material._id]"
                        :placeholder="
                          !material.scanOperation
                            ? $t('scanBarCodeRepair.status.noScanRequired')
                            : $t('scanBarCodeRepair.scanning.scanSubBarcodePlaceholder')
                        "
                        :class="{ 'valid-input': validateStatus[material._id] }"
                        :readonly="material.scanOperation"
                        :disabled="!material.scanOperation"
                      >
                        <template slot="prefix">
                          <i class="el-icon-full-screen"></i>
                        </template>
                        <template slot="suffix">
                          <template v-if="!material.scanOperation">
                            <el-tag type="info">{{ $t('scanBarCodeRepair.status.noScanRequired') }}</el-tag>
                          </template>
                          <template v-else-if="material.isBatch">
                            <el-tag
                              type="warning"
                              v-if="material.batchQuantity"
                            >
                              {{ getBatchUsageText(material._id) }}
                            </el-tag>
                            <el-tag type="warning" v-else>{{ $t('scanBarCodeRepair.status.batchMaterial') }}</el-tag>
                          </template>
                          <template v-else-if="material.isKey">
                            <el-tag type="success">{{ $t('scanBarCodeRepair.status.keyMaterial') }}</el-tag>
                          </template>
                        </template>
                      </el-input>
                      <div
                        class="status-indicator"
                        :class="{ valid: validateStatus[material._id] }"
                        v-if="material.scanOperation"
                      >
                        <i :class="getValidateIcon(material._id)"></i>
                      </div>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- 按钮组 -->
            <div class="button-group">
              <el-button plain @click="resetScanForm" icon="el-icon-refresh"
                >{{ $t('scanBarCodeRepair.buttons.reset') }}</el-button
              >
              <el-button
                type="success"
                @click="handleConfirm"
                icon="el-icon-check"
                >{{ $t('scanBarCodeRepair.buttons.confirmRepair') }}</el-button
              >
            </div>
          </el-form>
        </el-card>
      </template>
      <template v-else>
        <div class="init-tip">
          <div class="overlay">
            <i class="el-icon-warning-outline pulse"></i>
            <p>{{ $t('scanBarCodeRepair.initTip.message') }}</p>
          </div>
        </div>
      </template>
    </div>
    <status-popup
      :visible.sync="showPopup"
      :type="popupType"
      :text="errorMessage"
      :error-code="errorCode"
      :duration="5000"
    />
    <tsc-printer
      ref="tscPrinter"
      :materialCode="mainMaterialCode"
      :barcode="currentBatchBarcode"
    />
  </div>
</template>

<script>
//01012345678912391020240600122Q03UB001Z0K7
// (01)01234567891231(10)202407001(21)R12UB001Z0K2
// 1101103001-24120701
// 1101103004-24120702
// 1101103005-24120703
// 1101103007-23920
//FW300XXXK22UL309Z0Z100046MLQ6MLQ
//FW300XXX1497909X150L30824120300064
//1303203003-24120701
//1305103003-24120702
import { getData, addData, updateData, removeData } from "@/api/data";
import { getMachineProgress } from "@/api/machine";
import { createFlow, scanComponents } from "@/api/materialProcessFlowService";
import { createBatch } from "@/api/materialBarcodeBatch";
import ZrSelect from "@/components/ZrSelect";
import { playAudio, preloadAudioFiles } from "@/utils/audioI18n.js";

import TscPrinter from "@/components/tscInput";
import StatusPopup from "@/components/StatusPopup/index.vue";
import { getAllProcessSteps } from "@/api/materialProcessFlowService";
import hirInput from "@/components/hirInput";

export default {
  name: "ScanBarCodeRepair",
  components: {
    ZrSelect,
    TscPrinter,
    StatusPopup,
    hirInput,
  },
  data() {
    return {
      formData: {
        productModel: "",
        productLine: "",
        processStep: "",
        repairType: "repair", // 默认选择维修类型
        componentName: "",
        productionPlanWorkOrderId: "",
        workProductionPlanWorkOrderNo: "",
        workProductionPlanWorkOrderId: "",
      },
      productOptions: [],
      processStepOptions: [],
      materialOptions: [],
      materialLoading: false,
      mainMaterialName: "",
      mainMaterialCode: "",
      workmainMaterialId: "",
      workmainMaterialCode: "",
      processMaterials: [],
      scanForm: {
        mainBarcode: "",
        barcodes: {},
      },
      productLineOptions: [
        {
          _id: "1",
          FNumber: "1",
          FName: "产线1",
        },
        {
          _id: "2",
          FNumber: "2",
          FName: "产线2",
        },
      ],
      validateStatus: {
        mainBarcode: false,
      },
      loading: false, // 加载状态
      unifiedScanInput: "", // 新增统一扫描输入框的值
      hasEditPermission: false, // 添加权限控制状态
      batchMaterialCache: {}, // 新增：用于存储批次物料缓存
      printDialogVisible: false,
      currentBatchBarcode: "", // 当前要打印的批次条码
      autoPrint: false, // 添加自动打印开关状态
      isCollapsed: false, // 添加控制折叠状态的变量
      websocketConnected: false, // 添加WebSocket连接状态
      ws: null, // WebSocket实例
      heartbeatTimer: null, // 心跳定时器
      reconnectAttempts: 0, // 添加重连尝试次数计数
      maxReconnectAttempts: 5, // 最大重连尝试次数
      batchUsageCount: {}, // 新增：用于记录批次物料的使用次数

      barcodeRules: [], // 存储条码规则
      materialBarcodeRules: [], // 存储所有相关物料的条码规则

      showPopup: false,
      popupType: "ok",

      craftInfo: {}, // 保存工艺信息

      processStepData: {}, // 保存工序信息

      firstStep: false,

      errorMessage: "",
      errorCode: "",
      workOrderInfo: {
        planProductionQuantity: 0,
        inputQuantity: 0,
      },
      enableConversion: false, // 添加转化开关状态
      printData: {}, // 添加打印数据对象
      workOrderQueryParams: { query: {} }, // 添加工单查询参数
    };
  },
  computed: {
    mainMaterialId: {
      get() {
        return localStorage.getItem("mainMaterialId") || "";
      },
      set(value) {
        localStorage.setItem("mainMaterialId", value);
      },
    },
    processStepId: {
      get() {
        return localStorage.getItem("processStepId") || "";
      },
      set(value) {
        localStorage.setItem("processStepId", value);
      },
    },
    materialName: {
      get() {
        return localStorage.getItem("materialName") || "";
      },
      set(value) {
        localStorage.setItem("materialName", value);
      },
    },
    processName: {
      get() {
        return localStorage.getItem("processName") || "";
      },
      set(value) {
        localStorage.setItem("processName", value);
      },
    },
    workProductionPlanWorkOrderId: {
      get() {
        return localStorage.getItem("workProductionPlanWorkOrderId") || "";
      },
      set(value) {
        localStorage.setItem("workProductionPlanWorkOrderId", value);
      },
    },
    productLineId: {
      get() {
        return localStorage.getItem("productLineId") || "";
      },
      set(value) {
        localStorage.setItem("productLineId", value);
      },
    },
    productLineName: {
      get() {
        return localStorage.getItem("productLineName") || "";
      },
      set(value) {
        localStorage.setItem("productLineName", value);
      },
    },
    lineNum: {
      get() {
        return localStorage.getItem("lineNum") || "";
      },
      set(value) {
        localStorage.setItem("lineNum", value);
      },
    },
    workProductionPlanWorkOrderNo: {
      get() {
        return localStorage.getItem("workProductionPlanWorkOrderNo") || "";
      },
      set(value) {
        localStorage.setItem("workProductionPlanWorkOrderNo", value);
      },
    },
    // 添加模板相关计算属性
    localPrintTemplate: {
      get() {
        try {
          const savedTemplate = localStorage.getItem(
            "printTemplate_scanBarCodeRepair"
          );
          return savedTemplate ? JSON.parse(savedTemplate) : null;
        } catch (error) {
          console.error("解析缓存模板失败:", error);
          return null;
        }
      },
      set(value) {
        try {
          localStorage.setItem(
            "printTemplate_scanBarCodeRepair",
            JSON.stringify(value)
          );
        } catch (error) {
          console.error("保存模板到缓存失败:", error);
        }
      },
    },
    conversionMode: {
      get() {
        return localStorage.getItem("enableConversionRepair") === "true";
      },
      set(value) {
        localStorage.setItem("enableConversionRepair", value);
      },
    },
  },
  watch: {
    // 监听缓存ID变化，获取相关数据
    async mainMaterialId(newVal) {
      if (newVal) {
        await this.getMainMaterialInfo();
      } else {
        this.mainMaterialName = "";
      }
    },
    async processStepId(newVal) {
      if (newVal) {
        console.log(newVal, "newVal=============");
        await this.getProcessMaterials();
      } else {
        this.processMaterials = [];
        this.scanForm.barcodes = {};
        this.validateStatus = { mainBarcode: false };
      }
    },
    // 添加对validateStatus的深度监听
    validateStatus: {
      handler(newStatus) {
        // 检查是否所有条码都已扫描成功
      },
      deep: true, // 深度监听对象的变化
    },
    // 监听产品型号变化，更新工单查询参数
    'formData.productModel': {
      handler(newVal) {
        this.updateWorkOrderQueryParams();
      },
      immediate: true
    },
    // 监听产线变化，更新工单查询参数
    'formData.productLine': {
      handler(newVal) {
        this.updateWorkOrderQueryParams();
      }
    }
  },

  methods: {
    handleAutoInitChange(value) {
      this.autoInit = value;
      this.autoInitMode = value; // 保存到本地存储
      this.$message.success(value ? this.$t('scanBarCodeRepair.messages.autoInitEnabled') : this.$t('scanBarCodeRepair.messages.autoInitDisabled'));

      if (value) {
        // 如果开启自动模式，立即获取机器进度
        // this.getAutoInitConfig();
        //刷新页面
        window.location.reload();
      }
    },
    async getAutoInitConfig() {
      try {
        this.processStepId = "";
        const response = await getMachineProgress();
        console.log("获取到的机器进度:", response.data);
        if (response.code === 200 && response.data) {
          const {
            materialId,
            processStepId,
            lineId,
            productionPlanWorkOrderId,
          } = response.data;
          console.log("materialId:", materialId);
          console.log("lineId:", lineId);
          console.log(
            "workProductionPlanWorkOrderId:",
            productionPlanWorkOrderId
          );
          if (materialId && processStepId && processStepId.processName) {
            console.log("materialId:", materialId);
            console.log("processStepId:", processStepId.processName);
            console.log("lineId:", lineId);
            // 更新本地存储
            this.mainMaterialId = materialId._id;
            const processStepIdValue = processStepId._id;
            this.processStepId = processStepIdValue;

            // 更新表单数据
            this.formData.productModel = materialId._id;
            this.formData.processStep = processStepId._id;
            this.formData.productLine = lineId && lineId._id;
            this.formData.workProductionPlanWorkOrderId =
              productionPlanWorkOrderId && productionPlanWorkOrderId._id;
            this.formData.workProductionPlanWorkOrderNo =
              productionPlanWorkOrderId &&
              productionPlanWorkOrderId.workOrderNo;
            this.workProductionPlanWorkOrderId =
              productionPlanWorkOrderId && productionPlanWorkOrderId._id;
            this.workProductionPlanWorkOrderNo =
              productionPlanWorkOrderId &&
              productionPlanWorkOrderId.workOrderNo;

            // 更新生产计划ID缓存
            localStorage.setItem(
              "lastWorkProductionPlanWorkOrderId",
              (productionPlanWorkOrderId && productionPlanWorkOrderId._id) || ""
            );

            // 更新名称信息
            this.materialName = `${materialId.FNumber} - ${materialId.FName}`;
            this.processName = processStepId.processName;
            if (lineId) {
              this.productLineId = lineId._id;
              this.productLineName = lineId.lineName;
              this.lineNum = lineId.lineNum;
              this.formData.lineName = lineId.lineName;
            }
            this.$message.success(this.$t('scanBarCodeRepair.messages.autoInitSuccess'));

            // 对比当前设置的工序和缓存工序是否一致，不一致时调用handleSave()
            if (processStepIdValue !== this.processStepId) {
              this.handleSave();
            }
          } else {
            this.$message.warning(this.$t('scanBarCodeRepair.messages.noMachineProgressConfig'));
          }
        } else {
          throw new Error(response.message || "获取机器进度失败");
        }
      } catch (error) {
        //先清空缓存
        localStorage.removeItem("mainMaterialId");
        localStorage.removeItem("processStepId");
        this.mainMaterialId = "";
        this.processStepId = "";
        this.formData.productModel = "";
        this.formData.processStep = "";
        console.error("自动初始化失败:", error);
        this.$message.error(this.$t('scanBarCodeRepair.messages.autoInitFailed') + ": " + error.message);
      }
    },
    // 获取产品关联的条码规则
    async getProductBarcodeRules(materialIds) {
      try {
        // 1. 获取产品关联的条码规则
        const productRulesResponse = await getData("productBarcodeRule", {
          query: {
            productId: { $in: materialIds },
          },
          populate: JSON.stringify([
            { path: "barcodeRule", match: { enabled: true } },
          ]),
        });

        // 2. 获取全局条码规则
        const globalRulesResponse = await getData("barcodeRule", {
          query: {
            enabled: true,
            isGlobal: true,
          },
        });

        let rules = [];

        // 处理产品关联的规则
        if (productRulesResponse.data) {
          rules = productRulesResponse.data
            .filter((item) => item.barcodeRule) // 过滤掉无效的规则
            .map((item) => ({
              ...item.barcodeRule,
              priority: item.barcodeRule.priority || 0,
              isProductSpecific: true, // 标记为产品特定规则
            }));
        }

        // 添加全局规则（确保优先级最低）
        if (globalRulesResponse.data) {
          const globalRules = globalRulesResponse.data.map((rule) => ({
            ...rule,
            priority: -1, // 设置最低优先级
            isProductSpecific: false, // 标记为全局规则
          }));
          rules = rules.concat(globalRules);
        }

        // 按优先级排序（从高到低）
        rules.sort((a, b) => b.priority - a.priority);

        this.materialBarcodeRules = rules;

        console.log("条码规则列表:", {
          productRules: rules.filter((r) => r.isProductSpecific),
          globalRules: rules.filter((r) => !r.isProductSpecific),
        });
      } catch (error) {
        console.error("获取条码规则失败:", error);
        this.$message.error(this.$t('scanBarCodeRepair.messages.getBarcodeRulesFailed'));
      }
    },

    async handlePrintBatch() {
      let loading = this.$loading({
        lock: true,
        text: "正在生成批次条码...",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.7)",
      });

      try {
        if (!this.mainMaterialCode) {
          throw new Error("未获取到物料编码信息");
        }

        const res = await createBatch({
          materialCode: this.mainMaterialCode,
        });

        if (res.code === 200 && res.data.batchId) {
          this.currentBatchBarcode = res.data.batchId;

          await this.$nextTick();

          if (this.autoPrint) {
            if (this.currentBatchBarcode && this.mainMaterialCode) {
              await this.$refs.tscPrinter.print();

              // 打印完成后，自动填入条码并触发扫描
              this.unifiedScanInput = this.currentBatchBarcode;
              await this.handleUnifiedScan(this.currentBatchBarcode);
            } else {
              throw new Error("打印数据未准备就绪");
            }
          } else {
            this.$refs.tscPrinter.dialogVisible = true;
          }

          this.$nextTick(() => {
            this.$refs.scanInput.focus();
          });
        } else {
          throw new Error("批次条码生成失败");
        }
      } catch (error) {
        this.$message.error(error.message || this.$t('scanBarCodeRepair.messages.batchBarcodeGenerateFailed'));
      } finally {
        loading.close();
        this.$nextTick(() => {
          this.$refs.scanInput.focus();
        });
      }
    },
    handleWorkOrderSelect(item) {
      if (item) {
        this.formData.workProductionPlanWorkOrderNo = item.workOrderNo;
        this.formData.workProductionPlanWorkOrderId = item._id;

        // 使用计算属性设置缓存
        this.workProductionPlanWorkOrderNo = item.workOrderNo;
        this.workProductionPlanWorkOrderId = item._id;

        // 如果已经选择了产品，则可以继续
        if (!this.formData.productModel && item.materialId) {
          // 自动填充产品型号
          this.formData.productModel = item.materialId;
          // 触发产品变更处理
          this.getMaterialById(item.materialId).then(material => {
            if (material) {
              this.handleProductChange(material);
            }
          });
        }

        // 如果已经选择了产线，则可以继续
        if (!this.formData.productLine && item.productionLineId) {
          this.formData.productLine = item.productionLineId;
          // 自动填充产线信息缓存
          localStorage.setItem("productLineName", item.lineName || "");
          localStorage.setItem("productLineId", item.productionLineId || "");
        }

        this.$message.success(this.$t('scanBarCodeRepair.messages.workOrderSelected') + `: ${item.workOrderNo}`);
        this.getWorkOrderInfo();
      }
    },
    handleProductionLineSelect(item) {
      console.log(item, "item=============");
      if (item) {
        this.formData.lineName = item.lineName;
        this.formData.productLine = item._id;
        // 添加产线信息缓存
        localStorage.setItem("lineNum", item.lineNum);
        localStorage.setItem("productLineName", item.lineName);
        localStorage.setItem("productLineId", item._id);

        // 更新工单查询参数
        this.updateWorkOrderQueryParams();
      }
    },
    // API 调用方法
    async getMaterialById(id) {
      const response = await getData("k3_BD_MATERIAL", { query: { _id: id } });
      return response.data[0];
    },

    async getCraftByMaterialId(materialId) {
      const response = await getData("craft", {
        query: { materialId },
        sort: { _id: 1 },
      });
      return response.data[0];
    },

    async getProcessStepById(id) {
      const response = await getData("processStep", {
        query: { _id: id },
        sort: { sort: 1 },
      });
      return response.data[0];
    },

    async getWorkProductionPlanWorkOrderById(id) {
      const response = await getData("production_plan_work_order", {
        query: { _id: id },
        sort: { _id: 1 },
      });
      return response.data[0];
    },

    async getProcessMaterialById(id) {
      const response = await getData("processMaterials", {
        query: { _id: id },
        sort: { _id: 1 },
      });
      return response.data[0];
    },

    // 获取产品型号列表（使用远程搜索）
    async getMaterialList(query) {
      if (query !== "") {
        this.materialLoading = true;
        try {
          const result = await getData("k3_BD_MATERIAL", {
            query: {
              $or: [
                { FNumber: { $regex: query, $options: "i" } },
                { FName: { $regex: query, $options: "i" } },
              ],
            },
            page: 1,
            limit: 20,
          });
          this.productOptions = result.data;
        } catch (error) {
          console.error("获取产品型号失败:", error);
          this.$message.error(this.$t('scanBarCodeRepair.messages.getProductModelFailed'));
        } finally {
          this.materialLoading = false;
        }
      } else {
        this.productOptions = [];
      }
    },

    // 产品型号变化处理
    async handleProductChange(material) {
      const materialId = material._id;
      this.processStepOptions = [];
      this.formData.processStep = "";
      this.mainMaterialId = "";

      if (!materialId) return;

      try {
        // 只需要传入初始的 Set 集合
        const { data: processSteps } = await getAllProcessSteps(materialId);
        console.log("获取到的工序:", processSteps);
        this.processStepOptions = processSteps;
        this.formData.productModel = materialId;

        // 更新工单查询参数
        this.updateWorkOrderQueryParams();
      } catch (error) {
        console.error("获取工序列表失败:", error);
        this.$message.error(this.$t('scanBarCodeRepair.messages.getProcessStepsFailed'));
      }
    },

    // 工序选择变化处理
    handleProcessChange(processId) {
      if (!processId) {
        this.processStepId = "";
        return;
      }
      this.formData.processStep = processId;
      this.processStepData = processId;
      // this.processStepId = processId; // 缓存选中的工序ID
    },

    // 保存按钮处理
    async handleSave() {
      const missingFields = [];

      if (!this.formData.productModel) missingFields.push('产品型号');
      if (!this.formData.processStep) missingFields.push('工序');
      if (!this.formData.productLine) missingFields.push('产线');
      if (!this.formData.workProductionPlanWorkOrderId) missingFields.push('维修工单');

      if (missingFields.length > 0) {
        this.$notify({
          title: '缺少必填项',
          message: `请选择必填项: ${missingFields.join('、')}`,
          type: 'error',
          duration: 3000
        });

        // 特别强调工单必填
        if (missingFields.includes('维修工单')) {
          this.$message.error(this.$t('scanBarCodeRepair.messages.workOrderRequired'));

          // 突出显示工单选择区域
          const workOrderFormItem = document.querySelector('.el-form-item[required]');
          if (workOrderFormItem) {
            workOrderFormItem.classList.add('error-highlight');
            setTimeout(() => {
              workOrderFormItem.classList.remove('error-highlight');
            }, 2000);
          }
        }
        return;
      }

      try {
        // 创建全屏加载
        const loading = this.$loading({
          lock: true,
          text: "保存中...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        // 重置之前的数据
        this.resetScanForm();

        // 设置缓存ID
        this.mainMaterialId = this.formData.productModel;
        this.processStepId = this.formData.processStep;
        this.productLineId = this.formData.productLine;

        // 保存工单信息到缓存
        this.workProductionPlanWorkOrderId = this.formData.workProductionPlanWorkOrderId;
        this.workProductionPlanWorkOrderNo = this.formData.workProductionPlanWorkOrderNo;

        // 更新生产计划ID缓存
        localStorage.setItem(
          "lastWorkProductionPlanWorkOrderId",
          this.formData.workProductionPlanWorkOrderId || ""
        );

        // 获取并保存物料名称
        const material = await this.getMaterialById(this.formData.productModel);
        if (material) {
          this.materialName = `${material.FNumber} - ${material.FName}`;
        }

        // 获取并保存工序名称
        const processStep = await this.getProcessStepById(
          this.formData.processStep
        );
        if (processStep) {
          this.processName = processStep.processName;
        }

        this.$message.success(this.$t('scanBarCodeRepair.messages.saveSuccess'));

        // 模拟延迟以显示加载图标
        setTimeout(() => {
          // 关闭加载动画（虽然页面会刷新，但这是一个好习惯）
          loading.close();
          // 强制刷新页面
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error("保存失败:", error);
        this.$message.error(this.$t('scanBarCodeRepair.messages.saveFailed'));
        loading.close(); // 确保在错误情况下关闭加载动画
      }
    },

    // 获取主物料信息
    async getMainMaterialInfo() {
      try {
        console.log("正在获取主物料信息，ID:", this.mainMaterialId); // 调试日志
        const response = await getData("k3_BD_MATERIAL", {
          query: { _id: this.mainMaterialId },
          page: 1,
          limit: 1,
        });

        if (response.data && response.data[0]) {
          console.log("获取到的主物料信息:", response.data[0]); // 调试日志
          this.mainMaterialName = response.data[0].FName;
          this.mainMaterialCode = response.data[0].FNumber;
        } else {
          console.log("未找到主物料信息"); // 调试日志
          this.mainMaterialName = "";
          this.mainMaterialCode = "";
        }
      } catch (error) {
        console.error("获取主物料信息失败:", error);
        this.$message.error(this.$t('scanBarCodeRepair.messages.getMainMaterialInfoFailed'));
        this.mainMaterialName = "";
        this.mainMaterialCode = "";
      }
    },

    // 获取工序相关物料 - 修改这个方法，加入刷新打印模板的部分
    async getProcessMaterials() {
      try {
        console.log("正在获取工序信息，ID:", this.processStepId);

        // 获取工序信息
        const stepResponse = await getData("processStep", {
          query: { _id: this.processStepId },
          page: 1,
          limit: 1,
        });

        if (!stepResponse.data || !stepResponse.data.length === 0) {
          throw new Error("未找到工序信息");
        }

        const processStep = stepResponse.data[0];

        this.processStepData = processStep;

        console.log(this.processStepData, "this.processStepData");

        // 获取工序关联的打印模板 - 增加先清除本地缓存
        console.log("获取工序关联的打印模板:", processStep.printTemplateId);
        localStorage.removeItem("printTemplate_scanBarCodeRepair");
        if (processStep.printTemplateId) {
          try {
            // 获取该工序关联的打印模板
            const printTemplateResponse = await getData("printTemplate", {
              query: { _id: processStep.printTemplateId },
              page: 1,
              limit: 1,
            });

            if (
              printTemplateResponse.data &&
              printTemplateResponse.data.length > 0
            ) {
              const printTemplate = printTemplateResponse.data[0];
              console.log("获取到工序关联的打印模板:", printTemplate);

              // 设置打印模板到本地存储
              this.localPrintTemplate = printTemplate;
              this.$message.success(this.$t('scanBarCodeRepair.messages.templateAppliedSuccess'));

              // 确保UI组件更新
              this.$nextTick(() => {
                if (this.$refs.hirInput) {
                  this.$refs.hirInput.handleTemplateChange(printTemplate);
                }
              });
            }
          } catch (error) {
            console.error("获取工序关联打印模板失败:", error);
            this.$message.warning(this.$t('scanBarCodeRepair.messages.getProcessTemplateFailed'));
          }
        }

        if (processStep.sort == 1) {
          this.firstStep = true;
        }

        // 获取该工序所属的工艺信息
        const craftResponse = await getData("craft", {
          query: { _id: processStep.craftId },
          page: 1,
          limit: 1,
        });

        if (!craftResponse.data || !craftResponse.data.length === 0) {
          throw new Error("未找到工艺信息");
        }

        const craft = craftResponse.data[0];

        this.craftInfo = craft; // 保存工艺信息

        // 获取工艺对应的物料信息
        const material = await this.getMaterialById(craft.materialId);

        if (!material) {
          throw new Error("未找到物料信息");
        }

        // 更新工序对应的主物料信息
        this.workmainMaterialId = material._id;
        this.workmainMaterialCode = material.FNumber;
        this.mainMaterialName = material.FName;
        this.mainMaterialCode = material.FNumber;

        // 获取工序关联的物料
        try {
          const processMaterialsResponse = await getData("processMaterials", {
            query: { processStepId: this.processStepId },
          });

          if (processMaterialsResponse.data) {
            // 检查生产计划是否有变化，如果有变化则清空批次物料缓存
            const currentPlanId = this.workProductionPlanWorkOrderId;
            const storedPlanId = localStorage.getItem(
              "lastWorkProductionPlanWorkOrderId"
            );

            if (currentPlanId && currentPlanId !== storedPlanId) {
              console.log("生产计划已变更，清空批次物料缓存");
              // 清除所有批次物料缓存
              const keys = Object.keys(localStorage);
              keys.forEach((key) => {
                if (key.startsWith("batch_")) {
                  localStorage.removeItem(key);
                  localStorage.removeItem(`${key}_usage`);
                }
              });
              // 更新存储的生产计划ID
              localStorage.setItem(
                "lastWorkProductionPlanWorkOrderId",
                currentPlanId || ""
              );
            }

            this.processMaterials = processMaterialsResponse.data;

            // 收集所有物料ID（包括主物料和子物料）
            const allMaterialIds = [
              material._id, // 主物料ID
              ...this.processMaterials.map((m) => m.materialId), // 子物料IDs
            ];

            // 获取所有相关物料的条码规则
            await this.getProductBarcodeRules(allMaterialIds);

            // 重置并初始化验证状态
            this.validateStatus = { mainBarcode: false };
            this.scanForm.barcodes = {};

            this.processMaterials.forEach((material) => {
              this.validateStatus[material._id] = false;
              this.$set(this.scanForm.barcodes, material._id, "");
            });
          } else {
            this.processMaterials = [];
            this.validateStatus = { mainBarcode: false };
            this.scanForm.barcodes = {};
          }
        } catch (error) {
          console.error("获取工序物料失败:", error);
          this.$message.error(this.$t('scanBarCodeRepair.messages.getProcessMaterialsFailed'));
          this.processMaterials = [];
          this.validateStatus = { mainBarcode: false };
          this.scanForm.barcodes = {};
        }
      } catch (error) {
        console.error("获取工序物料失败:", error);
        this.$message.error(error.message || this.$t('scanBarCodeRepair.messages.getProcessMaterialsFailed'));
        this.processMaterials = [];
        this.validateStatus = { mainBarcode: false };
        this.scanForm.barcodes = {};
      }
    },
    async validateDICode(diCode, productIds) {
      try {
        // 取DI码和物料ID对应的物料信息
        const response = await getData("productDiNum", {
          query: {
            diNum: diCode,
            productId: { $in: productIds },
          },
          populate: JSON.stringify([
            { path: "productId", model: "k3_BD_MATERIAL" },
          ]),
        });

        if (response.data.length === 0) {
          this.$message.error(this.$t('scanBarCodeRepair.messages.diCodeMaterialMismatch'));
          this.errorMessage = this.$t('scanBarCodeRepair.messages.diCodeMaterialMismatch');
          return { isValid: false };
        }

        // 添加空值检查,过滤掉productId为空的记录
        const possibleMaterialCodes = response.data
          .filter((item) => item.productId && item.productId.FNumber)
          .map((item) => item.productId.FNumber);

        if (possibleMaterialCodes.length === 0) {
          this.$message.error(this.$t('scanBarCodeRepair.messages.diCodeNoMaterial'));
          return { isValid: false };
        }

        // 获取当前页面的主物料和子物料编码
        const allMaterialCodes = [
          this.mainMaterialCode,
          ...this.processMaterials.map((m) => m.materialCode),
        ];

        // 查找匹配的物料编码
        const matchedMaterialCode = possibleMaterialCodes.find((code) =>
          allMaterialCodes.includes(code)
        );

        if (!matchedMaterialCode) {
          this.$message.error(this.$t('scanBarCodeRepair.messages.diCodeMaterialMismatch'));
          return { isValid: false };
        }

        // 返回验证结果和匹配到的物料编码
        return {
          isValid: true,
          materialCode: matchedMaterialCode,
        };
      } catch (error) {
        console.error("DI码验证失败:", error);
        this.$message.error(this.$t('scanBarCodeRepair.messages.diCodeValidationFailed'));
        return { isValid: false };
      }
    },

    async validateBarcode(barcode) {
      console.log("开始验证条码:", barcode);
      if (!barcode) return false;

      try {
        let rules = this.materialBarcodeRules;
        if (rules.length == 0) {
          this.$message.error(
            this.$t('scanBarCodeRepair.messages.barcodeRuleNotFound')
          );
          this.errorMessage = this.$t('scanBarCodeRepair.messages.barcodeRuleNotFound');
          return { materialCode: null, isValid: false };
        }

        // 遍历规则进行匹配
        for (const rule of rules) {
          console.log(
            `尝试匹配规则: ${rule.name} (${
              rule.isProductSpecific ? "产品特定" : "全局规则"
            })`
          );

          let isValid = true;
          let materialCode = null;
          let relatedBill = null;
          let currentValue = barcode;

          // 1. 执行校验规则
          for (const validationRule of rule.validationRules) {
            if (!validationRule.enabled) continue;

            switch (validationRule.type) {
              case "length":
                if (currentValue.length !== validationRule.params.length) {
                  isValid = false;
                }
                break;

              case "substring":
                const subValue = currentValue.substring(
                  validationRule.params.start,
                  validationRule.params.end
                );
                if (subValue !== validationRule.params.expectedValue) {
                  isValid = false;
                }
                break;

              case "regex":
                try {
                  const regex = new RegExp(validationRule.params.pattern);
                  if (!regex.test(currentValue)) {
                    isValid = false;
                  }
                } catch (e) {
                  console.error("正则表达式错误:", e);
                  isValid = false;
                }
                break;
            }

            if (!isValid) break;
          }

          // 如果校验规则通过，执行提取规则
          if (isValid) {
            console.log(rule, "rule");
            // 2. 执行提取规则
            for (const config of rule.extractionConfigs) {
              let extractValue = barcode;

              // 按顺序执行提取步骤
              for (const step of config.steps) {
                if (!step.enabled) continue;

                switch (step.type) {
                  case "split":
                    const parts = extractValue.split(step.params.separator);
                    extractValue = parts[step.params.index] || "";
                    break;

                  case "substring":
                    extractValue = extractValue.substring(
                      step.params.start,
                      step.params.end
                    );
                    break;

                  case "regex":
                    try {
                      const regex = new RegExp(step.params.pattern);
                      const matches = extractValue.match(regex);
                      if (matches && matches[step.params.group]) {
                        extractValue = matches[step.params.group];
                      } else {
                        extractValue = "";
                      }
                    } catch (e) {
                      console.error("正则提取错误:", e);
                      extractValue = "";
                    }
                    break;
                }
              }
              console.log(extractValue, "extractValue");

              // 根据目标字段存储提取结果
              switch (config.target) {
                case "materialCode":
                  materialCode = extractValue;
                  break;
                case "DI":
                  //查询当前rule对应的物料有哪些
                  // 1. 获取产品关联的条码规则
                  const productRulesRespoFnse = await getData(
                    "productBarcodeRule",
                    {
                      query: {
                        barcodeRule: rule._id,
                      },
                      select: "productId",
                    }
                  );
                  let productIds = productRulesRespoFnse.data.map(
                    (item) => item.productId
                  );
                  // 如果提取到DI，需要验证并获取对应的物料编码
                  console.log(rule.productId, "rule.productId");
                  const diResult = await this.validateDICode(
                    extractValue,
                    productIds
                  );
                  if (diResult.isValid) {
                    materialCode = diResult.materialCode;
                  } else {
                    return { materialCode: null, isValid: false };
                  }
                  break;
                case "relatedBill":
                  relatedBill = extractValue;
                  break;
              }
            }

            // 如果成功提取到物料编码，验证是否匹配当前工序
            if (isValid && materialCode) {
              console.log(
                `条码匹配成功: ${rule.name} (${
                  rule.isProductSpecific ? "产品特定" : "全局规则"
                })`
              );
              return {
                materialCode,
                isValid: true,
                relatedBill,
                ruleName: rule.name,
                ruleType: rule.isProductSpecific ? "product" : "global",
              };
            }
          }
        }

        // 所有规则都未匹配成功
        this.$message.error(this.$t('scanBarCodeRepair.messages.barcodeRuleNotMatch'));
        this.errorMessage = this.$t('scanBarCodeRepair.messages.barcodeRuleNotMatch');
        return { materialCode: null, isValid: false };
      } catch (error) {
        console.error("条码验证失败:", error);
        this.$message.error(this.$t('scanBarCodeRepair.messages.barcodeValidationError'));
        this.errorMessage = this.$t('scanBarCodeRepair.messages.barcodeValidationError');
        return { materialCode: null, isValid: false };
      }
    },

    // 处理主条码
    async handleMainBarcode(barcode) {
      try {
        const response = await getData("material_process_flow", {
          query: { barcode: barcode },
        });

        if (response.data && response.data.length > 0) {
          // 条码已存在，获取流程信息
          const flowData = response.data[0];
          this.$message.success(this.$t('scanBarCodeRepair.messages.scanSuccess'));
        } else {
          // 使用工序对应的主物料信息创建新的流程记录
          const createResponse = await createFlow({
            mainMaterialId: this.workmainMaterialId, // 使用工序对应的主物料ID
            materialCode: this.workmainMaterialCode, // 使用工序对应的主物料编码
            barcode,
            productLineId: this.productLineId,
            productLineName: this.productLineName,
            isFromDevice: true,
            productionPlanWorkOrderId: this.workProductionPlanWorkOrderId,
          });

          if (createResponse.code === 200) {
            this.$message.success(this.$t('scanBarCodeRepair.messages.flowRecordCreateSuccess'));
          } else {
            this.errorMessage =
              createResponse.message || "创建成品条码追溯记录失败";
            throw new Error(
              createResponse.message || "创建成品条码追溯记录失败"
            );
          }
        }
      } catch (error) {
        console.error("处理主条码失败:", error);
        this.errorMessage = error;
        this.popupType = "ng";
        this.showPopup = true;
        playAudio('tmyw');
        throw error;
      }
    },

    // 处理子物料条码
    async handleSubBarcode(materialId, materialCode) {
      try {
        // 验证主条码是否已扫描
        // if (!this.scanForm.mainBarcode || !this.validateStatus.mainBarcode) {
        //     throw new Error('请先扫描主条码');
        // }

        // 获取对应的物料信息
        const material = this.processMaterials.find(
          (m) => m._id === materialId
        );
        if (!material) {
          throw new Error("未找到对应的物料信息");
        }

        //对比物料编码是否一致
        if (material.materialCode !== materialCode) {
          throw new Error("物料编码不一致");
        }

        this.validateStatus[materialId] = true;
        this.$message.success(this.$t('scanBarCodeRepair.messages.scanSuccessful'));
      } catch (error) {
        console.error("处理子物料条码失败:", error);
        this.errorMessage = error;
        this.popupType = "ng";
        this.showPopup = true;
        playAudio('tmyw');
        throw error;
      }
    },

    // 新增方法：根据ID获取产品型号和工序名称
    async fillFormData() {
      if (this.mainMaterialId && this.materialName) {
        this.formData.productName = this.materialName;
      }

      if (this.processStepId && this.processName) {
        this.formData.processStep = this.processName;
      }

      // 添加产线信息的填充
      if (this.productLineId && this.productLineName) {
        this.formData.productLine = this.productLineId;
        this.formData.lineName = this.productLineName;
      }

      // 添加工单信息的填充
      if (this.workProductionPlanWorkOrderId && this.workProductionPlanWorkOrderNo) {
        this.formData.workProductionPlanWorkOrderId = this.workProductionPlanWorkOrderId;
        this.formData.workProductionPlanWorkOrderNo = this.workProductionPlanWorkOrderNo;

        // 如果已经有工单但没有物料ID，尝试从工单获取物料ID
        if (!this.formData.productModel && this.workProductionPlanWorkOrderId) {
          try {
            const workOrder = await this.getWorkProductionPlanWorkOrderById(this.workProductionPlanWorkOrderId);
            if (workOrder && workOrder.materialId) {
              this.formData.productModel = workOrder.materialId;
            }
          } catch (error) {
            console.error("从工单获取物料信息失败:", error);
          }
        }
      }

      // 更新工单查询参数
      this.updateWorkOrderQueryParams();
    },

    // 修改重置扫码表单方法
    resetScanForm() {
      this.scanForm.mainBarcode = "";
      const newBarcodes = {};

      this.processMaterials.forEach((material) => {
        if (!material.scanOperation) {
          // 无需扫码的物料直接设置为验证通过
          this.$set(this.validateStatus, material._id, true);
          newBarcodes[material._id] = "无需扫码";
        } else if (material.isBatch) {
          const cacheKey = `batch_${this.mainMaterialId}_${this.processStepId}_${material._id}`;
          const usageKey = `${cacheKey}_usage`;
          const cachedBarcode = localStorage.getItem(cacheKey);
          const currentUsage = parseInt(localStorage.getItem(usageKey) || "0");

          // 只有当设置了 batchQuantity 且超过限制时才清除缓存
          if (
            !material.batchQuantity ||
            (cachedBarcode && currentUsage < material.batchQuantity)
          ) {
            newBarcodes[material._id] = cachedBarcode;
            this.$set(this.validateStatus, material._id, true);
          } else {
            // 如果使用次数已达到限制，清除缓存
            localStorage.removeItem(cacheKey);
            localStorage.removeItem(usageKey);
            newBarcodes[material._id] = "";
            this.$set(this.validateStatus, material._id, false);
          }
        } else {
          newBarcodes[material._id] = "";
          this.$set(this.validateStatus, material._id, false);
        }
      });

      this.scanForm.barcodes = newBarcodes;
      this.$set(this.validateStatus, "mainBarcode", false);
      this.currentFlowId = null;
    },

    // 修改统一扫描处理方法中的相关部分
    async handleUnifiedScan(value) {
      if (!value) return;

      // 检查打印模板
      if (this.enableConversion && !this.$refs.hirInput.selectedTemplate) {
        this.unifiedScanInput = "";
        this.$refs.scanInput.focus();
        this.$message.warning(this.$t('scanBarCodeRepair.messages.pleaseSelectTemplate'));
        return;
      }

      try {
        // 更严格地清理输入值中的所有空格和换行符
        const cleanValue = value.replace(/[\s\r\n]/g, "");
        if (!cleanValue) return;

        //特殊处理
        if (cleanValue.includes("102251-114010190087")) {
          // 检查条码格式是否符合预期，并提取日期部分
          const parts = cleanValue.split("-");
          if (parts.length >= 4) {
            const dateStr = parts[2]; // 获取第三段日期字符串

            // 判断日期是否小于20250201
            if (dateStr && dateStr.length === 8 && dateStr < "20250201") {
              this.unifiedScanInput = "";
              this.$refs.scanInput.focus();
              this.$message.error(this.$t('scanBarCodeRepair.messages.materialExpired'));
              this.errorMessage = this.$t('scanBarCodeRepair.messages.materialExpired');
              this.popupType = "ng";
              this.showPopup = true;
              playAudio('dwx');
              return;
            }
          }
        }

        const isValidResult = await this.validateBarcode(cleanValue);
        if (!isValidResult.isValid) {
          this.popupType = "ng";
          this.showPopup = true;
          setTimeout(() => {
            playAudio('tmyw'); // 延迟播放错误提示音
          }, 300);
          this.$notify({
            title: "条码验证失败",
            message: "条码格式不正确,未在系统中注册",
            type: "error",
            duration: 3000,
            position: "top-right",
          });
          this.unifiedScanInput = "";
          this.$refs.scanInput.focus();
          return;
        }

        const materialCode = isValidResult.materialCode;
        let matched = false;

        // TODO 国内检查非成品条码检测是否有未完成的维修记录
        console.log("非成品条码检测是否有未完成的维修记录");
        const repairRecord = await getData("product_repair", {
          query: { barcode: cleanValue },
          sort: { _id: -1 },
          limit: 1,
        });
        if (repairRecord.data.length > 0) {
          if (repairRecord.data[0].status == "PENDING_REVIEW") {
            this.unifiedScanInput = "";
            this.$refs.scanInput.focus();
            this.$message.error(this.$t('scanBarCodeRepair.messages.repairRecordExists'));
            this.errorMessage = this.$t('scanBarCodeRepair.messages.repairRecordExists');
            this.popupType = "ng";
            this.showPopup = true;
            playAudio('dwx');
            return;
          }
          if (
            repairRecord.data[0].status == "REVIEWED" &&
            repairRecord.data[0].repairResult !== "QUALIFIED"
          ) {
            if (repairRecord.data[0].solution == "报废") {
              this.unifiedScanInput = "";
              this.$refs.scanInput.focus();
              this.$message.error(this.$t('scanBarCodeRepair.messages.barcodeScrapProcessed'));
              this.errorMessage = this.$t('scanBarCodeRepair.messages.barcodeScrapProcessed');
              this.popupType = "ng";
              this.showPopup = true;
              playAudio('tmyw');
              return;
            }
            this.unifiedScanInput = "";
            this.$refs.scanInput.focus();
            this.$message.error(this.$t('scanBarCodeRepair.messages.repairResultUnqualified'));
            this.errorMessage = this.$t('scanBarCodeRepair.messages.repairResultUnqualified');
            this.popupType = "ng";
            this.showPopup = true;
            playAudio('wxsb');
            return;
          }
        }

        // 检查主物料
        if (materialCode === this.mainMaterialCode) {
          // 添加主物料条码顺序检查
          try {
            //如果没有this.processStepData数据刷新
            if (!this.processStepData) {
              await this.getProcessMaterials();
            }
            // 判断是否为第一道工序
            if (this.processStepData && this.processStepData.sort === 1) {
              //判断改生产条码是否作废
              const checkPreProduction = await getData("preProductionBarcode", {
                query: {
                  printBarcode: cleanValue,
                },
                // 移除limit限制，查询所有匹配的条码
                select: "status workOrderNo barcode",
              });
              console.log(checkPreProduction, "checkPreProduction");

              // 有匹配的条码记录
              if (
                checkPreProduction.data &&
                checkPreProduction.data.length > 0
              ) {
                // 按状态优先级排序：PENDING > USED > SUSPENDED > VOIDED
                const statusPriority = {
                  PENDING: 0, // 待使用优先级最高
                  USED: 1, // 已使用次之
                  SUSPENDED: 2, // 已暂停再次之
                  VOIDED: 3, // 已作废优先级最低
                };

                // 排序所有条码
                const sortedBarcodes = [...checkPreProduction.data].sort(
                  (a, b) => statusPriority[a.status] - statusPriority[b.status]
                );

                // 获取优先级最高的条码
                const bestBarcode = sortedBarcodes[0];

                // 如果最好的条码状态是已作废，不允许使用
                if (bestBarcode.status === "VOIDED") {
                  this.unifiedScanInput = "";
                  this.$refs.scanInput.focus();
                  this.$message.error(this.$t('scanBarCodeRepair.messages.barcodeVoided'));
                  this.errorMessage = this.$t('scanBarCodeRepair.messages.barcodeVoided');
                  this.popupType = "ng";
                  this.showPopup = true;
                  playAudio('tmyw');
                  return;
                }

                // 如果最好的条码状态是已暂停，不允许使用
                if (bestBarcode.status === "SUSPENDED") {
                  this.unifiedScanInput = "";
                  this.$refs.scanInput.focus();
                  this.$message.error(this.$t('scanBarCodeRepair.messages.barcodeSuspended'));
                  this.errorMessage = this.$t('scanBarCodeRepair.messages.barcodeSuspended');
                  this.popupType = "ng";
                  this.showPopup = true;
                  playAudio('tmyw');
                  return;
                }
              }
            }
            // 如果不是第一道工序或没有找到对应的预生产条码记录，继续正常流程
          } catch (error) {
            console.warn("检查主物料条码顺序失败:", error);
            // 如果查询失败，不阻止正常流程
          }

          // 验证通过，继续原有逻辑
          this.scanForm.mainBarcode = cleanValue;
          this.validateStatus.mainBarcode = true;

          await this.handleMainBarcode(cleanValue);

          // 获取转化后的条码（如果启用了转化模式）
          let transformedBarcode = cleanValue;
          if (this.enableConversion) {
            const prePrintData = await getData("preProductionBarcode", {
              query: { printBarcode: cleanValue },
            });
            if (prePrintData.data && prePrintData.data.length > 0) {
              transformedBarcode =
                prePrintData.data[0].transformedPrintBarcode || cleanValue;
              // 自动填充所有子物料条码为转换后的条码
              this.processMaterials.forEach((material) => {
                if (material.scanOperation) {
                  this.$set(
                    this.scanForm.barcodes,
                    material._id,
                    transformedBarcode
                  );
                  this.$set(this.validateStatus, material._id, true);
                }
              });
            }
          }

          playAudio('smcg');
          this.$notify({
            title: "主物料扫描成功",
            dangerouslyUseHTMLString: true,
            message: `
              <div style="line-height: 1.5">
                <div>物料名称: ${this.mainMaterialName}</div>
                <div>物料编码: ${materialCode}</div>
                <div>条码: ${cleanValue}</div>
                ${
                  this.enableConversion
                    ? `<div>转化条码: ${transformedBarcode}</div>`
                    : ""
                }
              </div>
            `,
            type: "success",
            duration: 3000,
            position: "top-right",
          });
          matched = true;

          // 如果是转化模式，自动提交并打印
          if (this.enableConversion) {
            // 所有条码都已扫描完成,进行scanComponents提交
            await this.handleConfirm();
          }
        }

        //判断子物料是否包含关键物料
        const keyMaterial = this.processMaterials.find((m) => m.isKey);
        console.log(keyMaterial, "keyMaterial");
        if (keyMaterial) {
          // 如果包含关键物料，则必须先扫描主条码
          if (!this.scanForm.mainBarcode || !this.validateStatus.mainBarcode) {
            this.$message.error(this.$t('scanBarCodeRepair.messages.keyMaterialRequireMainBarcode'));
            this.errorMessage = this.$t('scanBarCodeRepair.messages.keyMaterialRequireMainBarcode');
            this.popupType = "ng";
            this.showPopup = true;
            playAudio('smztm');
            return;
          }
        }

        // 检查子物料
        if (!matched) {
          for (const material of this.processMaterials) {
            if (material.materialCode === materialCode) {
              // TODO 国内新增：检查materialBarcodeBatch表中是否存在该物料编码的未使用条码
              // try {
              //     const batchResponse = await getData('materialBarcodeBatch', {
              //         query: {
              //             materialCode: materialCode,
              //             isUsed: false
              //         },
              //         sort: { createAt: 1 }, // 按创建时间正序排序，获取最早的未使用条码
              //         limit: 1
              //     });

              //     if (batchResponse.data && batchResponse.data.length > 0) {
              //         const expectedBatchId = batchResponse.data[0].batchId;
              //         if (cleanValue !== expectedBatchId) {
              //             this.$message.error(`请按顺序使用批次条码，应使用条码: ${expectedBatchId}`);
              //             tone(tmyw)
              //             return;
              //         }
              //     }
              //     // 如果没有找到对应的批次记录，继续正常流程
              // } catch (error) {
              //     console.warn('检查批次条码顺序失败:', error);
              //     // 如果查询失败，不阻止正常流程
              // }

              // 如果是批次物料
              if (material.isBatch) {
                const cacheKey = `batch_${this.mainMaterialId}_${this.processStepId}_${material._id}`;
                const usageKey = `${cacheKey}_usage`;
                const cachedBarcode = localStorage.getItem(cacheKey);

                // 如果扫描的是新的批次条码
                if (cachedBarcode !== cleanValue) {
                  // 查询新批次条码的使用次数
                  const count = await this.queryBatchUsageCount(
                    cleanValue,
                    material._id
                  );

                  // 如果设置了使用次数限制且已达到限制
                  if (
                    material.batchQuantity &&
                    count >= material.batchQuantity &&
                    material.batchQuantity > 0
                  ) {
                    this.$message.warning(
                      this.$t('scanBarCodeRepair.messages.batchUsageLimitReachedWithCount', {
                        barcode: cleanValue,
                        count: material.batchQuantity
                      })
                    );
                    playAudio('pcwlxz');
                    this.errorMessage = this.$t('scanBarCodeRepair.messages.batchUsageLimitReached');
                    this.popupType = "ng";
                    this.showPopup = true;
                    return;
                  }

                  // 更新缓存和使用次数
                  localStorage.setItem(cacheKey, cleanValue);
                  localStorage.setItem(usageKey, count.toString());
                  this.$set(this.batchUsageCount, material._id, count);
                } else {
                  // 使用现有批次条码
                  const currentUsage = parseInt(
                    localStorage.getItem(usageKey) || "0"
                  );

                  // 只有当达到使用限制时才清除
                  if (
                    material.batchQuantity &&
                    currentUsage >= material.batchQuantity &&
                    material.batchQuantity > 0
                  ) {
                    localStorage.removeItem(cacheKey);
                    localStorage.removeItem(usageKey);
                    this.$set(this.scanForm.barcodes, material._id, "");
                    this.$set(this.validateStatus, material._id, false);
                    this.$message.warning(
                      this.$t('scanBarCodeRepair.messages.batchUsageLimitReachedWithCount', {
                        barcode: cleanValue,
                        count: material.batchQuantity
                      })
                    );
                    playAudio('pcwlxz');

                    return;
                  }
                }
              }

              this.$set(this.scanForm.barcodes, material._id, cleanValue);
              this.$set(this.validateStatus, material._id, true);

              // 处理子物料条码
              await this.handleSubBarcode(material._id, materialCode);

              playAudio('smcg');
              this.$notify({
                title: "子物料扫描成功",
                dangerouslyUseHTMLString: true,
                message: `
                                        <div style="line-height: 1.5">
                                            <div>物料名称: ${
                                              material.materialName
                                            }</div>
                                            <div>物料编码: ${
                                              material.materialCode
                                            }</div>
                                            <div>条码: ${cleanValue}</div>
                                            ${
                                              isValidResult.relatedBill
                                                ? `<div>关联单号: ${isValidResult.relatedBill}</div>`
                                                : ""
                                            }
                                        </div>
                                    `,
                type: "success",
                duration: 3000,
                position: "top-right",
              });
              matched = true;
              break;
            }
          }
        }

        if (!matched) {
          this.$message.error(this.$t('scanBarCodeRepair.messages.barcodeNotMatch'));
          this.errorMessage = this.$t('scanBarCodeRepair.messages.barcodeRuleNotMatch');
          this.popupType = "ng";
          this.showPopup = true;
          setTimeout(() => {
            playAudio('tmyw'); // 延迟播放错误提示音
          }, 300);
          this.unifiedScanInput = "";
          this.$refs.scanInput.focus();
          return;
        }

        // 检查是否所有需要扫描的条码都已扫描
        const allScanned = Object.values(this.validateStatus).every(
          (status) => {
            const material = this.processMaterials.find(
              (m) => this.validateStatus[m._id] === status && !m.scanOperation
            );
            return material ? true : status === true;
          }
        );

        if (allScanned) {
          this.$notify({
            title: "扫描完成",
            dangerouslyUseHTMLString: true,
            message: `
                                <div style="line-height: 1.5">
                                    <div>所有物料已扫描完成</div>
                                    <div style="color: #67C23A">正在发送确认提交...</div>
                                </div>
                            `,
            type: "success",
            duration: 3000,
            position: "top-right",
          });

          // 所有条码都已扫描完成,进行scanComponents提交
          await this.handleConfirm();
        } else {
          // 显示剩余需要扫描的物料
          const remainingMaterials = this.processMaterials
            .filter(
              (material) =>
                !this.validateStatus[material._id] && material.scanOperation
            )
            .map(
              (material) => `${material.materialName}(${material.materialCode})`
            )
            .join("\n");

          if (remainingMaterials) {
            this.$notify({
              title: "继续扫描",
              dangerouslyUseHTMLString: true,
              message: `
                                    <div style="line-height: 1.5">
                                        <div>请继续扫描以下物料：</div>
                                        <div style="color: #E6A23C; white-space: pre-line">${remainingMaterials}</div>
                                    </div>
                                `,
              type: "info",
              duration: 3000,
              position: "top-right",
            });
          }
        }
      } catch (error) {
        console.error("扫描处理失败:", error);
        setTimeout(() => {
          playAudio('tmyw'); // 延迟播放错误提示音
        }, 1000);
        this.$notify({
          title: "扫描失败",
          message: error.message || "扫描处理失败",
          type: "error",
          duration: 3000,
          position: "top-right",
        });
      } finally {
        this.unifiedScanInput = "";
        this.$refs.scanInput.focus();
      }
    },

    // 新增获取焦点方法
    focusInput() {
      this.$refs.scanInput.focus();
    },

    // 修改取消保存设置的方法
    async handleCancelSave() {
      try {
        await this.$confirm(
          this.$t('scanBarCodeRepair.messages.confirmCancelSettings'),
          this.$t('scanBarCodeRepair.dialogs.hint'),
          {
            confirmButtonText: this.$t('scanBarCodeRepair.dialogs.confirm'),
            cancelButtonText: this.$t('scanBarCodeRepair.dialogs.cancel'),
            type: "warning",
          }
        );

        const loading = this.$loading({
          lock: true,
          text: "取消设置中...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        // 清除批次物料缓存
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith("batch_")) {
            localStorage.removeItem(key);
          }
        });

        // 只清除工序相关localStorage,保留产线相关的缓存和工单缓存
        localStorage.removeItem("mainMaterialId");
        localStorage.removeItem("processStepId");
        localStorage.removeItem("materialName");
        localStorage.removeItem("processName");

        // 注意:不清除以下缓存
        // localStorage.removeItem('productLineId');
        // localStorage.removeItem('productLineName');
        // localStorage.removeItem('workProductionPlanWorkOrderId');
        // localStorage.removeItem('workProductionPlanWorkOrderNo');

        // 重置表单数据,但保留产线信息和工单信息
        const productLine = this.formData.productLine;
        const lineName = this.formData.lineName;
        const workProductionPlanWorkOrderId = this.formData.workProductionPlanWorkOrderId;
        const workProductionPlanWorkOrderNo = this.formData.workProductionPlanWorkOrderNo;

        this.formData = {
          productModel: "",
          productLine: productLine, // 保留产线信息
          lineName: lineName, // 保留产线名称
          processStep: "",
          componentName: "",
          workProductionPlanWorkOrderId: workProductionPlanWorkOrderId, // 保留工单ID
          workProductionPlanWorkOrderNo: workProductionPlanWorkOrderNo, // 保留工单号
        };

        this.$message.success(this.$t('scanBarCodeRepair.messages.cancelSettingsSuccess'));

        // 模拟延迟以显示加载图标
        setTimeout(() => {
          loading.close();
          // 强制刷新页面
          window.location.reload();
        }, 500);
      } catch (error) {
        if (error !== "cancel") {
          console.error("取消设置失败:", error);
          this.$message.error(this.$t('scanBarCodeRepair.messages.cancelSettingsFailed'));
        }
      }
    },

    // 获取验证状态图标
    getValidateIcon(key) {
      return this.validateStatus[key]
        ? "el-icon-check success-icon"
        : "el-icon-close error-icon";
    },

    // 确认按钮处理方法
    async handleConfirm() {
      try {
        // 1. 验证所有需要扫码的条码是否已扫描
        const allBarcodesFilled = Object.values(this.validateStatus).every(
          (status) => {
            // 如果是无需扫码的物料,跳过验证
            const material = this.processMaterials.find(
              (m) => this.validateStatus[m._id] === status && !m.scanOperation
            );
            return material ? true : status === true;
          }
        );

        if (!allBarcodesFilled) {
          this.$message.warning(this.$t('scanBarCodeRepair.messages.pleaseCompleteAllScans'));
          return;
        }

        // 2. 获取或创建主流程记录
        let flowRecord;
        const response = await getData("material_process_flow", {
          query: { barcode: this.scanForm.mainBarcode },
        });

        if (!response.data || response.data.length === 0) {
          try {
            const createResponse = await createFlow({
              mainMaterialId: this.workmainMaterialId,
              materialCode: this.workmainMaterialCode,
              barcode: this.scanForm.mainBarcode,
              productLineId: this.productLineId,
              productLineName: this.productLineName,
            });

            if (createResponse.code !== 200) {
              throw new Error("创建主流程记录失败");
            }

            flowRecord = createResponse.data;
          } catch (error) {
            throw new Error(`创建流程记录失败: ${error.message}`);
          }
        } else {
          flowRecord = response.data[0];
        }

        if (!flowRecord) {
          throw new Error("未能获取或创建有效的工艺流程记录");
        }

        let componentScans = [];
        this.processMaterials.forEach((material) => {
          // 只收集需要扫码的物料数据
          if (material.scanOperation) {
            componentScans.push({
              materialId: material.materialId,
              barcode: this.scanForm.barcodes[material._id],
            });
          }
        });
        let scanReq = {
          mainBarcode: this.scanForm.mainBarcode,
          processStepId: this.processStepId,
          componentScans: componentScans,
          userId: this.$store.getters.id,
          lineId: this.formData.productLine,
          isFromDevice: true,
          productionPlanWorkOrderId: this.workProductionPlanWorkOrderId || null, // 添加工单ID
        };
        let mainBarcode = JSON.parse(JSON.stringify(this.scanForm.mainBarcode));
        const scanResponse = await scanComponents(scanReq);

        if (scanResponse.code !== 200) {
          // this.resetScanForm();

          this.errorCode = scanResponse.errorCode;
          this.errorMessage = scanResponse.message || "扫码失败";

          throw new Error(scanResponse.message || "扫码失败");
        }

        if (scanResponse.code == 200) {
          // 提交成功后，更新批次物料的使用次数
          for (const material of this.processMaterials) {
            if (material.isBatch && this.scanForm.barcodes[material._id]) {
              const cacheKey = `batch_${this.mainMaterialId}_${this.processStepId}_${material._id}`;
              const usageKey = `${cacheKey}_usage`;
              const currentUsage = parseInt(
                localStorage.getItem(usageKey) || "0"
              );

              // 更新使用次数
              const newUsage = currentUsage + 1;
              localStorage.setItem(usageKey, newUsage.toString());
              this.$set(this.batchUsageCount, material._id, newUsage);

              // 如果达到使用限制，清除缓存
              if (
                material.batchQuantity &&
                newUsage >= material.batchQuantity
              ) {
                localStorage.removeItem(cacheKey);
                localStorage.removeItem(usageKey);
                this.$set(this.scanForm.barcodes, material._id, "");
                this.$set(this.validateStatus, material._id, false);
              }
            }
          }
          this.popupType = "ok";
          this.showPopup = true;

          if (this.firstStep && this.workOrderInfo.workOrderNo !== "") {
            this.getWorkOrderInfo();
          }

          // 在转化模式下自动打印
          if (this.enableConversion) {
            let mainBarcode = JSON.parse(JSON.stringify(this.scanForm.mainBarcode));
            let printData = {
              printBarcode: mainBarcode,
            };

            if (this.craftInfo && this.craftInfo.isProduct) {
              //查询是否有相关的打印数据
              const prePrintData = await getData("preProductionBarcode", {
                query: { printBarcode: mainBarcode },
              });

              if (prePrintData.data && prePrintData.data.length > 0) {
                printData.printBarcode = prePrintData.data[0].printBarcode;
                printData.printBarcodeText = prePrintData.data[0].barcode;

                if (this.enableConversion) {
                  printData.printBarcode =
                    prePrintData.data[0].transformedPrintBarcode;
                  printData.printBarcodeText =
                    prePrintData.data[0].transformedBarcode;
                }
              }

              //获取eanNum
              const workOrderResult = await getData(
                "production_plan_work_order",
                {
                  query: {
                    productionLineId: this.formData.productLine,
                    status: "IN_PROGRESS",
                  },
                }
              );
              if (workOrderResult.data.length === 0) {
                throw new Error("未查询到生产计划");
              }
              let eanNum = workOrderResult.data[0].custPOLineNo;
              printData.eanNum = eanNum;
              console.log(workOrderResult, "workOrderResult");

              // 获取销售订单拓展数据
              if (workOrderResult.data[0].saleOrderId) {
                const saleOrderExtResult = await getData("k3_SAL_SaleOrderExt", {
                  query: {
                    FSaleOrderId: workOrderResult.data[0].saleOrderId,
                  },
                });
                console.log(saleOrderExtResult, "saleOrderExtResult");
                if (saleOrderExtResult.data.length > 0) {
                  // 将销售订单拓展数据合并到printData中
                  printData = {
                    ...printData,
                    ...saleOrderExtResult.data[0],
                  };
                }
                //获取客户拓展信息表
                const saleOrderCustInfoResult = await getData(
                  "k3_SAL_SaleOrder_CustInfo",
                  {
                    query: {
                      FSaleOrderId: workOrderResult.data[0].saleOrderId,
                    },
                  }
                );
                console.log(saleOrderCustInfoResult, "saleOrderCustInfoResult");
                if (saleOrderCustInfoResult.data.length > 0) {
                  // 将销售订单拓展数据合并到printData中
                  printData = {
                    ...printData,
                    ...saleOrderCustInfoResult.data[0],
                  };
                }
              }

              //生产日期
              const now = new Date();
              const month = String(now.getMonth() + 1).padStart(2, "0");
              const year = now.getFullYear();
              printData.ProductionDate = `${month}/${year}`;

              //追觅综合字段
              printData.printBarcodeZH =
                printData.barcode +
                "," +
                printData.FCustPO +
                "," +
                printData.productionDate +
                "," +
                printData.quantity;

              //无线吸尘器生产日期
              printData.wxxcqProductionDate = `${year}.${month}`;
            }

            this.printData = printData;
            console.log(this.printData, "this.printData");
            this.$nextTick(() => {
              this.$refs.hirInput.handlePrints2();
            });
          }

          // 在播放bdcg的地方添加成功弹窗
          setTimeout(() => {
            playAudio('bdcg');
          }, 1000);
        }

        // 6. 重置表单
        this.resetScanForm();
      } catch (error) {
        // 6. 重置表单
        this.resetScanForm();
        console.error("确认失败:", error);
        this.errorMessage = error.message;

        if (error.message.includes("批次物料条码")) {
          this.$message.warning(error.message);
          setTimeout(() => {
            playAudio('pcwlxz');
            this.popupType = "ng";
            this.showPopup = true;
            // 播放批次物料条码已达到使用次数限制提示音
            //清空批次物料缓存
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
              if (key.startsWith("batch_")) {
                localStorage.removeItem(key);
              }
            });
            //页面批次物料条码清空
            this.processMaterials.forEach((material) => {
              if (material.isBatch) {
                this.$set(this.scanForm.barcodes, material._id, "");
                this.$set(this.validateStatus, material._id, false);
              }
            });
          }, 1000);
        } else if (
          error.message.includes("该主物料条码对应工序节点已完成或处于异常状态")
        ) {
          this.$message.warning(error.message);
          this.popupType = "ng";
          this.showPopup = true;
          setTimeout(() => {
            playAudio('cfbd'); // 延迟播放
          }, 1000);
        } else if (error.message == "未查询到生产工单") {
          this.$message.error(error.message);
          this.errorMessage = this.$t('scanBarCodeRepair.messages.workOrderNotFound');
          this.popupType = "ng";
          this.showPopup = true;
          setTimeout(() => {
            playAudio('cxwgd'); // 延迟播放
          }, 1000);
        } else {
          this.$message.error(this.$t('scanBarCodeRepair.messages.confirmFailed') + ":" + error.message);
          this.popupType = "ng";
          this.showPopup = true;
          setTimeout(() => {
            playAudio('tmyw'); // 延迟播放
          }, 1000);
        }
      }
    },

    // 打印成功处理
    handlePrintSuccess() {
      this.$message.success(this.$t('scanBarCodeRepair.messages.printSuccess'));
      this.currentBatchBarcode = ""; // 清空当前批次条码
    },

    // 打印失败处理
    handlePrintError(error) {
      this.$message.error(this.$t('scanBarCodeRepair.messages.printFailed') + `: ${error}`);
      this.currentBatchBarcode = ""; // 清空当前批次条码
    },

    // 打印弹窗关闭处理
    handleDialogClose() {
      this.printDialogVisible = false;
      this.currentBatchBarcode = ""; // 清空当前批次条码
    },

    // 加处理自动打印开关变化的方法
    handleAutoPrintChange(value) {
      // 将开关状态保存到本地存储
      localStorage.setItem("autoPrint", value);
      this.$message.success(value ? this.$t('scanBarCodeRepair.messages.autoPrintEnabled') : this.$t('scanBarCodeRepair.messages.autoPrintDisabled'));
    },

    // 新增清除缓存方法
    async handleClearCache() {
      try {
        await this.$confirm(
          this.$t('scanBarCodeRepair.messages.confirmClearCache'),
          this.$t('scanBarCodeRepair.dialogs.hint'),
          {
            confirmButtonText: this.$t('scanBarCodeRepair.dialogs.confirm'),
            cancelButtonText: this.$t('scanBarCodeRepair.dialogs.cancel'),
            type: "warning",
          }
        );

        const loading = this.$loading({
          lock: true,
          text: "清除缓存中...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        // 清除所有相关的localStorage
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          // 清除批次物料缓存和使用次数
          if (key.startsWith("batch_")) {
            localStorage.removeItem(key);
            localStorage.removeItem(`${key}_usage`); // 同时清除使用次数记录
          }
        });

        this.$message.success(this.$t('scanBarCodeRepair.messages.cacheClearSuccess'));

        // 模拟延迟以显示加载图标
        setTimeout(() => {
          loading.close();
          // 强制刷新页面
          window.location.reload();
        }, 500);
      } catch (error) {
        if (error !== "cancel") {
          console.error("清除缓存失败:", error);
          this.$message.error(this.$t('scanBarCodeRepair.messages.cacheClearFailed'));
        }
      }
    },

    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },

    // 修改初始化WebSocket连接方法
    initWebSocket() {
      try {
        // 关闭之前的连接
        if (this.ws) {
          this.ws.close();
        }

        // 创建WebSocket连接
        const token = "DcMes_Server_Token"; // 使用配置的token
        const VUE_APP_WS_ADDRESS = process.env.VUE_APP_WS_ADDRESS;
        console.log(VUE_APP_WS_ADDRESS, "VUE_APP_WS_ADDRESS");
        this.ws = new WebSocket(`${VUE_APP_WS_ADDRESS}?token=${token}`);

        console.log(this.ws, "this.ws");

        // 连接成功
        this.ws.onopen = () => {
          this.websocketConnected = true;
          this.$message.success(this.$t('scanBarCodeRepair.messages.deviceServerConnected'));
          this.startHeartbeat();
          this.reconnectAttempts = 0; // 重置重连计数
        };

        // 连接关闭
        this.ws.onclose = (event) => {
          this.websocketConnected = false;
          this.stopHeartbeat();

          console.log("WebSocket连接关闭:", event);

          // 检查是否达到最大重连次数
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(
              1000 * Math.pow(2, this.reconnectAttempts),
              10000
            ); // 指数退避，最大10秒
            this.$message.warning(
              this.$t('scanBarCodeRepair.messages.deviceConnectionLost', {
                delay: delay / 1000,
                attempts: this.reconnectAttempts
              })
            );
            setTimeout(() => {
              this.initWebSocket();
            }, delay);
          } else {
            this.$message.error(this.$t('scanBarCodeRepair.messages.maxReconnectAttemptsReached'));
          }
        };

        // 连接错误
        this.ws.onerror = (error) => {
          this.websocketConnected = false;
          console.error("WebSocket连接错误:", error);

          // 记录详细的错误信息
          console.log("错误详情:", {
            readyState: this.ws.readyState,
            url: this.ws.url,
            protocol: this.ws.protocol,
            error: error,
          });
        };

        // 接收消息
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("收到消息:", data);
            // 处理接收到的消息
            this.handleWebSocketMessage(data);
          } catch (error) {
            console.error("消息解析错误:", error);
          }
        };
      } catch (error) {
        console.error("WebSocket初始化失败:", error);
        this.$message.error(this.$t('scanBarCodeRepair.messages.deviceConnectionInitFailed') + `: ${error.message}`);
      }
    },

    // 处理接收到的WebSocket消息
    handleWebSocketMessage(data) {
      switch (data.type) {
        case "connected":
          console.log("连接成功，用户ID:", data.userId);
          break;
        case "command":
          if (data.action === "refresh") {
            window.location.reload();
          }
          break;
        // 添加其他消息类型的处理...
        default:
          console.log("未知消息类型:", data);
      }
    },

    // 开始心跳检测
    startHeartbeat() {
      this.heartbeatTimer = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "heartbeat" }));
        }
      }, 10000); // 每10秒发送一次心跳
    },

    // 停止心跳检测
    stopHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    },

    // 发送消息方法
    sendWebSocketMessage(message) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        this.$message.warning(this.$t('scanBarCodeRepair.messages.deviceNotConnected'));
      }
    },

    // 新增：获取批次使用次数显示文本
    getBatchUsageText(materialId) {
      const material = this.processMaterials.find((m) => m._id === materialId);
      if (!material || !material.isBatch) return "";

      const currentCount = this.batchUsageCount[materialId] || 0;
      return `${currentCount}/${material.batchQuantity}`;
    },

    // 新增：查询批次条码使用记录
    async queryBatchUsageCount(barcode, materialId) {
      try {
        const response = await getData("material_process_flow", {
          query: {
            processNodes: {
              $elemMatch: {
                barcode: barcode,
              },
            },
          },
        });

        return response.data ? response.data.length : 0;
      } catch (error) {
        console.error("查询批次使用记录失败:", error);
        return 0;
      }
    },
    clearInput() {
      this.unifiedScanInput = "";
      this.focusInput();
    },
    async getWorkOrderInfo() {
      try {
        // 如果有工单ID，优先使用工单ID查询
        if (this.workProductionPlanWorkOrderId) {
          const response = await getData("production_plan_work_order", {
            query: { _id: this.workProductionPlanWorkOrderId },
            select: "workOrderNo planProductionQuantity inputQuantity",
          });

          if (response.data && response.data[0]) {
            this.workOrderInfo = {
              workOrderNo: response.data[0].workOrderNo || "",
              planProductionQuantity: response.data[0].planProductionQuantity || 0,
              inputQuantity: response.data[0].inputQuantity || 0,
            };
            return;
          }
        }

        // 否则使用产线ID查询当前生产中的工单
        const productLineId = this.productLineId;
        console.log(productLineId, "productLineId");
        if (this.productLineId) {
          const response = await getData("production_plan_work_order", {
            query: {
              productionLineId: this.productLineId,
              status: "IN_PROGRESS",
            },
            select: "workOrderNo planProductionQuantity inputQuantity",
          });

          if (response.data && response.data[0]) {
            this.workOrderInfo = {
              workOrderNo: response.data[0].workOrderNo || "",
              planProductionQuantity: response.data[0].planProductionQuantity || 0,
              inputQuantity: response.data[0].inputQuantity || 0,
            };
          } else {
            this.workOrderInfo = {
              workOrderNo: "",
              planProductionQuantity: 0,
              inputQuantity: 0,
            };
          }
        }
      } catch (error) {
        console.error("获取工单信息失败:", error);
        this.workOrderInfo = {
          workOrderNo: "",
          planProductionQuantity: 0,
          inputQuantity: 0,
        };
      }
    },
    // 添加转化开关处理方法
    handleConversionChange(value) {
      this.enableConversion = value;
      this.conversionMode = value; // 保存到本地存储
      this.$message.success(value ? this.$t('scanBarCodeRepair.messages.conversionEnabled') : this.$t('scanBarCodeRepair.messages.conversionDisabled'));

      if (value) {
        // 如果开启转化模式，可以在这里添加相关逻辑
        console.log("转化模式已开启");
      }
    },

    // 模板变更处理方法
    handleTemplateChange(template) {
      if (!template) return;

      try {
        // 保存完整的模板对象到本地存储
        this.localPrintTemplate = template;
        console.log("已保存最新模板到本地:", template);
        this.$message.success(this.$t('scanBarCodeRepair.messages.printTemplateSaved'));
      } catch (error) {
        console.error("保存打印模板失败:", error);
        this.$message.error(this.$t('scanBarCodeRepair.messages.printTemplateSaveFailed'));
      }
    },

    // 添加获取最新打印模板并强制更新的方法
    async refreshPrintTemplate() {
      if (!this.processStepId) return;

      try {
        // 先清除本地缓存的打印模板
        localStorage.removeItem("printTemplate_scanBarCodeRepair");

        // 获取工序信息
        const stepResponse = await getData("processStep", {
          query: { _id: this.processStepId },
          page: 1,
          limit: 1,
        });

        if (!stepResponse.data || stepResponse.data.length === 0) {
          return;
        }

        const processStep = stepResponse.data[0];

        // 检查工序是否关联了打印模板
        if (processStep.printTemplateId) {
          // 获取该工序关联的打印模板
          const printTemplateResponse = await getData("printTemplate", {
            query: { _id: processStep.printTemplateId },
            page: 1,
            limit: 1,
          });

          if (
            printTemplateResponse.data &&
            printTemplateResponse.data.length > 0
          ) {
            const printTemplate = printTemplateResponse.data[0];
            console.log("获取到最新工序关联的打印模板:", printTemplate);

            // 设置打印模板到本地存储
            this.localPrintTemplate = printTemplate;

            // 确保UI组件更新
            this.$nextTick(() => {
              if (this.$refs.hirInput) {
                this.$refs.hirInput.handleTemplateChange(printTemplate);
              }
            });

            console.log("已强制刷新打印模板");
          }
        }
      } catch (error) {
        console.error("刷新打印模板失败:", error);
      }
    },
    // 添加clearWorkOrder方法
    clearWorkOrder() {
      this.formData.workProductionPlanWorkOrderId = "";
      this.formData.workProductionPlanWorkOrderNo = "";
      this.workProductionPlanWorkOrderId = "";
      this.workProductionPlanWorkOrderNo = "";

      // 更新工单查询参数
      this.updateWorkOrderQueryParams();

      this.$message.success(this.$t('scanBarCodeRepair.messages.clearWorkOrderSuccess'));
    },
    updateWorkOrderQueryParams() {
      // 构建查询参数对象
      const queryParams = {
        query: {
          // 只显示进行中的工单
          status: { $in: ["PENDING", "IN_PROGRESS"] }
        }
      };

      // 如果有产品型号，添加过滤条件
      if (this.formData.productModel) {
        queryParams.query.materialId = this.formData.productModel;
      }

      // 如果有产线ID，添加过滤条件
      if (this.formData.productLine) {
        queryParams.query.productionLineId = this.formData.productLine;
      }

      // 更新查询参数
      this.workOrderQueryParams = queryParams;
      console.log("已更新工单查询参数:", this.workOrderQueryParams);
    },
  },
  async created() {
    // 从本地存储中恢复自动打印开关状态
    const savedAutoPrint = localStorage.getItem("autoPrint");
    if (savedAutoPrint !== null) {
      this.autoPrint = savedAutoPrint === "true";
    }

    this.initWebSocket(); // 初始化WebSocket连接

    // 使用原有的缓存逻辑
    if (this.mainMaterialId) {
      await this.getMainMaterialInfo();
    }

    if (this.processStepId) {
      await this.getProcessMaterials();
      // 初始化批次物料缓存
      this.processMaterials.forEach((material) => {
        if (material.isBatch) {
          const cacheKey = `batch_${this.mainMaterialId}_${this.processStepId}_${material._id}`;
          const cachedBarcode = localStorage.getItem(cacheKey);
          if (cachedBarcode) {
            this.$set(this.scanForm.barcodes, material._id, cachedBarcode);
            this.$set(this.validateStatus, material._id, true);
          }
        }
      });
    }

    // 自动填充表单数据
    await this.fillFormData();

    // 初始化批次物料使用次数
    if (this.processMaterials) {
      for (const material of this.processMaterials) {
        if (material.isBatch) {
          const cacheKey = `batch_${this.mainMaterialId}_${this.processStepId}_${material._id}`;
          const cachedBarcode = localStorage.getItem(cacheKey);

          if (cachedBarcode) {
            const count = await this.queryBatchUsageCount(
              cachedBarcode,
              material.materialId
            );
            console.log(count, "count");
            // 如果count等于批次用量，则清除缓存
            if (
              count === material.batchQuantity &&
              material.batchQuantity > 0
            ) {
              this.$message.warning("批次条码使用次数已达到上限");
              this.errorMessage = this.$t('scanBarCodeRepair.messages.batchCodeUsageLimitReached');
              this.popupType = "ng";
              this.showPopup = true;
              playAudio('pcwlxz'); // 播放批次物料条码已达到使用次数限制提示音
              localStorage.removeItem(cacheKey);
              this.$set(this.scanForm.barcodes, material._id, "");
              this.$set(this.validateStatus, material._id, false);
            } else {
              this.$set(this.batchUsageCount, material._id, count);
            }
          }
        }
      }
    }

    // 加载本地缓存的打印模板
    const savedTemplate = this.localPrintTemplate;
    if (savedTemplate) {
      this.$nextTick(() => {
        if (this.$refs.hirInput) {
          // 传递完整的模板对象给子组件
          this.$refs.hirInput.handleTemplateChange(savedTemplate);
        }
      });
    }

    // 从本地存储获取转化模式设置
    const savedConversion = localStorage.getItem("enableConversionRepair");
    this.enableConversion = savedConversion === "true";

    // 清除之前的打印模板缓存，确保获取最新数据
    localStorage.removeItem("printTemplate_scanBarCodeRepair");

    await this.getWorkOrderInfo();
  },
  mounted() {
    console.log("Complete roles data:", this.$store.getters.roles);
    const roles = this.$store.getters.roles;
    if (!roles || !roles.buttonList) {
      return false;
    }
    if (roles.buttonList.includes("scan_edit_configuration")) {
      this.hasEditPermission = true;
    }

    if (this.processStepId) {
      // 获取选中工序的打印模板
      this.refreshPrintTemplate();
    }

    // 页面加载时自动获取焦点
    if (this.mainMaterialId && this.processStepId) {
      this.$refs.scanInput.focus();
    }
  },
  // 组件销毁时清除定时器
  beforeDestroy() {
    // 关闭WebSocket连接
    if (this.ws) {
      this.ws.close();
    }
    // 清除心跳定时器
    this.stopHeartbeat();
  },
};
</script>

<style scoped>
.scan-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

/* 新增：带按钮的输入框容器 */
.input-with-buttons {
  display: flex;
  align-items: center;
}

.input-with-buttons .el-button {
  margin-left: 5px;
}

/* 新增：错误高亮样式 */
.error-highlight {
  animation: highlight 1.5s ease-in-out;
}

@keyframes highlight {
  0%, 100% {
    box-shadow: none;
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 10px #f56c6c;
    transform: scale(1.02);
  }
}

/* 维修主题样式 */
.repair-theme {
  background-color: #f0f4f8;
  background-image: linear-gradient(to bottom, #edf1f5, #e4edf6);
}

.scan-card {
  margin: 0 auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 维修风格卡片 */
.repair-card {
  border-left: 4px solid #409eff;
  background-color: #fff;
  box-shadow: 0 4px 16px rgba(0, 120, 255, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #ebeef5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collapse-btn {
  margin-left: 20px;
  font-size: 14px;
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 5px;
}

.collapse-btn i {
  font-size: 16px;
}

.left-form {
  margin-right: 20px;
  width: 300px;
  transition: all 0.3s ease;
}

.left-form.collapsed {
  width: 0;
  margin-right: 0;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 6px;
}

/* 维修风格的区域头部 */
.repair-section-header {
  background: linear-gradient(to right, #e6f1fc, #f5f7fa);
  border-left: 3px solid #409eff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-header i {
  color: #409eff;
  margin-right: 8px;
}

.section-header span {
  font-weight: 500;
  color: #606266;
}

.input-with-status {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.valid-input >>> .el-input__inner {
  border-color: #67c23a;
  transition: all 0.3s ease;
}

.status-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f56c6c;
  color: white;
  transition: all 0.3s ease;
}

.status-indicator.valid {
  background: #67c23a;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.button-group .el-button {
  min-width: 120px;
  padding: 12px 30px;
}

.el-button {
  padding: 12px 30px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.init-tip {
  position: relative;
  height: 100%;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
  border-radius: 8px;
  z-index: 1;
}

.overlay i {
  font-size: 60px;
  color: #e6a23c;
  margin-bottom: 20px;
}

.overlay p {
  font-size: 18px;
  color: #606266;
  margin: 0;
}

.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }

  50% {
    transform: scale(1.1);
    opacity: 1;
  }

  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

/* 输入框动画效果 */
.el-input >>> .el-input__inner:focus {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 左侧表单样式 */
.left-form {
  margin-right: 20px;
  width: 300px;
  position: relative;
  transition: all 0.3s ease;
}

.left-form.collapsed {
  width: 0;
  margin-right: 0;
  overflow: hidden;
}

.collapse-btn {
  position: absolute;
  right: -15px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 60px;
  background-color: #409eff;
  border-radius: 0 30px 30px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.collapse-btn:hover {
  background-color: #66b1ff;
}

.collapse-btn i {
  color: white;
  font-size: 20px;
}

.init-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.form-section {
  margin-bottom: 20px;
}

/* 下拉选择框样式 */
.custom-select {
  width: 100%;
}

.custom-select >>> .el-input__inner {
  border-radius: 6px;
  transition: all 0.3s ease;
}

.custom-select >>> .el-input__inner:hover {
  border-color: #409eff;
}

.custom-select >>> .el-input__inner:focus {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 选项内容样式 */
.option-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}

.option-main {
  font-size: 14px;
  color: #303133;
  font-family: monospace;
  /* 使用等宽字体以确保对齐 */
}

.option-sub {
  font-size: 13px;
  color: #8492a6;
}

/* 加载状态样式 */
.el-select >>> .el-input.is-loading .el-input__inner {
  padding-right: 30px;
}

/* 按钮组样式 */
.button-group {
  margin-top: 30px;
  text-align: center;
}

.button-group .el-button {
  padding: 12px 30px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.button-group .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 布局调整 */
.scan-container {
  display: flex;
  gap: 0px;
  padding: 20px;
}

.right-content {
  flex: 1;
}

.vertical-form-item {
  display: flex;
  flex-direction: column;
}

.vertical-form-item >>> .el-form-item__label {
  text-align: left;
  padding: 0 0 10px 0;
  line-height: 1.4;
  white-space: normal;
  /* 允许标签文字换行 */
}

.vertical-form-item >>> .el-form-item__content {
  margin-left: 0 !important;
}

.scan-input-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #409eff;
}

/* 维修风格扫描区域 */
.repair-scan-section {
  background: #eef5fe;
  border: 2px solid #4c8dff;
  box-shadow: 0 4px 12px rgba(76, 141, 255, 0.15);
}

.custom-input-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.custom-input {
  width: 100%;
  height: 40px;
  line-height: 40px;
  padding: 0 15px;
  padding-right: 30px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  font-size: 14px;
  color: #606266;
  outline: none;
  transition: border-color 0.2s;
}

.custom-input:focus {
  border-color: #409eff;
}

.custom-input:hover {
  border-color: #c0c4cc;
}

.custom-clear-icon {
  position: absolute;
  right: 10px;
  color: #c0c4cc;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.custom-clear-icon:hover {
  color: #909399;
}

.scan-input-section .el-input {
  margin-top: 10px;
}

.scan-input-section .el-input__inner {
  height: 50px;
  font-size: 18px;
}

.section-title {
  display: flex;
  align-items: center;
}

.section-title i {
  color: #409eff;
  margin-right: 8px;
  font-size: 16px;
}

.section-title span {
  font-weight: 500;
  color: #606266;
}

.print-batch-btn {
  display: flex;
  align-items: center;
  gap: 10px;
}

.print-switch {
  margin-right: 10px;
}

/* 开关文字样式 */
.print-switch >>> .el-switch__label {
  color: #606266;
  font-size: 12px;
}

.print-switch >>> .el-switch__label.is-active {
  color: #409eff;
}

.el-tag {
  margin-right: 5px;
  font-size: 12px;
}

.input-with-status .el-input {
  flex: 1;
}

.batch-usage-tag {
  min-width: 60px;
  text-align: center;
}

.work-order-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #606266;
  font-size: 14px;
  margin-right: 10px;
  min-width: 70px;
}

.value {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
}

.value2 {
  color: #dbc075;
  font-weight: 500;
  font-size: 24px;
}

.separator {
  margin: 0 8px;
  color: #909399;
}

/* 添加开关组样式 */
.switch-group {
  display: flex;
  gap: 20px;
  align-items: center;
}

.print-switch {
  margin-left: 10px;
}

.print-switch + .print-switch {
  margin-left: 20px;
}

/* 错误高亮样式 */
.error-highlight {
  animation: error-shake 0.5s ease-in-out;
  background-color: rgba(245, 108, 108, 0.1);
  border-radius: 4px;
}

@keyframes error-shake {
  0%, 100% {
    transform: translateX(0);
  }
  20%, 60% {
    transform: translateX(-5px);
  }
  40%, 80% {
    transform: translateX(5px);
  }
}
</style>
