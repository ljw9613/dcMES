<template>
  <div class="scan-container" v-loading="loading">
    <div class="left-form" :class="{ collapsed: isCollapsed }">
      <el-card class="init-card">
        <!-- 标题部分 -->
        <div class="card-header">
          <span>
            <i class="el-icon-setting"></i>
            工序设置</span
          >
          <el-switch
            v-model="autoInit"
            active-text="自动"
            inactive-text="手动"
            class="print-switch"
            @change="handleAutoInitChange"
          >
          </el-switch>
        </div>
        <el-form :model="formData" label-width="100px">
          <!-- 产品型号 -->
          <div class="form-section">
            <div class="section-header">
              <el-tag :type="websocketConnected ? 'success' : 'danger'">
                <i class="el-icon-goods"></i>
                {{ websocketConnected ? "已连接" : "未连接" }}</el-tag
              >
              <span> 基础信息 </span>
            </div>

            <el-form-item label="产品型号">
              <zr-select
                v-if="!mainMaterialId"
                v-model="formData.productModel"
                collection="k3_BD_MATERIAL"
                :disabled="!!mainMaterialId && !!processStepId"
                :search-fields="['FNumber', 'FName']"
                label-key="FName"
                sub-key="FMATERIALID"
                :multiple="false"
                placeholder="请输入物料编码/名称搜索"
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
                placeholder="请输入物料编码/名称搜索"
                :disabled="!!mainMaterialId && !!processStepId"
              />
            </el-form-item>

            <el-form-item label="产品工序">
              <el-select
                v-model="formData.processStep"
                placeholder="请选择产品工序"
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

            <el-form-item label="产线编码">
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
                placeholder="请输入产线信息搜索"
                @select="handleProductionLineSelect"
              />
              <el-input
                v-else
                v-model="formData.lineName"
                placeholder="请输入产线信息搜索"
                :disabled="!!mainMaterialId && !!processStepId"
              />
            </el-form-item>
          </div>

          <!-- 按钮部分 -->
          <div class="button-group" v-if="hasEditPermission">
            <el-button
              type="danger"
              @click="handleCancelSave"
              icon="el-icon-close"
              v-if="mainMaterialId && processStepId"
            >
              取消设置
            </el-button>
            <el-button
              type="primary"
              v-else
              @click="handleSave"
              icon="el-icon-check"
            >
              保存设置
            </el-button>
          </div>
        </el-form>
      </el-card>
    </div>
    <div class="right-content">
      <template
        v-if="
          mainMaterialId && processStepId && processStepData.processType == 'F'
        "
      >
        <el-card class="scan-card">
          <!-- 标题部分 -->
          <div class="card-header">
            <div class="header-left">
              <i class="el-icon-box"></i>
              <span>托盘管理</span>
              <el-button type="text" @click="toggleCollapse">
                <i
                  :class="
                    isCollapsed
                      ? 'el-icon-d-arrow-right'
                      : 'el-icon-d-arrow-left'
                  "
                ></i>
                {{ isCollapsed ? "展开" : "收起" }}
              </el-button>
            </div>
            <el-form
              :model="batchForm"
              label-width="100px"
              v-if="hasEditPermission"
            >
              <el-form-item label="产品数量">
                <div class="batch-size-control">
                  <el-input-number
                    size="mini"
                    v-model="batchForm.batchSize"
                    :min="1"
                    :max="999"
                    @change="handleBatchSizeChange"
                    :disabled="batchSizeLocked"
                  >
                  </el-input-number>
                  <template v-if="!batchSizeLocked">
                    <el-button
                      type="text"
                      size="mini"
                      @click="handleSaveBatchSize"
                      icon="el-icon-check"
                    >
                      保存
                    </el-button>
                  </template>
                  <template v-else>
                    <el-button
                      type="text"
                      style="color: red"
                      @click="handleCancelBatchSize"
                      icon="el-icon-close"
                    >
                      取消
                    </el-button>
                  </template>
                </div>
              </el-form-item>
            </el-form>
          </div>

          <el-form :model="scanForm" ref="scanForm" label-width="100%">
            <div class="section-header">
              <div class="header-left">
                <i class="el-icon-full-screen"></i>
                <span>统一扫描输入框</span>
              </div>
              <div class="mode-switch">
                <span class="mode-label">入托模式：</span>
                <el-switch
                  v-model="palletizingMode"
                  active-text="包装箱入托"
                  inactive-text="单产品入托"
                  active-value="box"
                  inactive-value="single"
                  @change="handlePalletizingModeChange"
                ></el-switch>
              </div>
              <hir-input
                ref="hirInput"
                :default-template="localPrintTemplate"
                @template-change="handleTemplateChange"
                :show-preview="true"
                :show-browser-print="true"
                :show-silent-print="true"
                :printData="printData"
              />
            </div>
            <div class="scan-input-section">
              <!-- 添加扫描模式切换 -->
              <div class="scan-mode-switch">
                <el-radio-group v-model="scanMode" size="small">
                  <el-radio-button label="normal">普通模式</el-radio-button>
                  <el-radio-button label="rfid">RFID模式</el-radio-button>
                </el-radio-group>
                <el-tooltip
                  content="普通模式用于扫描条码，RFID模式用于读取RFID标签"
                  placement="top"
                >
                  <i class="el-icon-question"></i>
                </el-tooltip>
              </div>

              <!-- 扫描输入框 -->
              <el-input
                v-model="unifiedScanInput"
                :placeholder="
                  scanMode === 'normal' ? '请扫描条码' : '请读取RFID标签'
                "
                @keyup.enter.native="handleUnifiedScan(unifiedScanInput)"
                ref="scanInput"
                clearable
                @clear="focusInput"
              >
                <template slot="prepend">
                  <i
                    :class="
                      scanMode === 'normal'
                        ? 'el-icon-camera'
                        : 'el-icon-connection'
                    "
                  ></i>
                </template>
              </el-input>
            </div>

            <!-- 批次设置区域 -->
            <el-row :gutter="30">
              <!-- 修改基本信息展示区域 -->
              <div class="basic-info-section">
                <div class="section-header">
                  <div class="header-left">
                    <i class="el-icon-document"></i>
                    <span>单据信息</span>
                  </div>
                </div>
                <el-form :model="palletForm" class="pallet-form">
                  <el-row :gutter="10">
                    <el-col :span="8">
                      <el-card class="info-card" shadow="hover">
                        <div class="info-item">
                          <span class="label">销售单号：</span>
                          <span class="value">{{
                            palletForm.saleOrderNo
                          }}</span>
                        </div>
                        <div class="info-item">
                          <span class="label">托盘单据编号：</span>
                          <span class="value">{{
                            palletForm.palletCode || "未生成"
                          }}</span>
                        </div>
                      </el-card>
                    </el-col>
                    <el-col :span="8">
                      <el-card class="info-card" shadow="hover">
                        <div class="info-item">
                          <span class="label">生产工单：</span>
                          <span class="value">{{
                            palletForm.workOrderNo
                          }}</span>
                        </div>
                        <div class="info-item">
                          <span class="label">托盘单据数量：</span>
                          <span class="value">{{
                            palletForm.totalQuantity
                          }}</span>
                        </div>
                      </el-card>
                    </el-col>
                    <el-col :span="8">
                      <el-card class="info-card" shadow="hover">
                        <div class="info-item">
                          <span class="label">物料编号：</span>
                          <span class="value">{{ mainMaterialCode }}</span>
                        </div>
                        <div class="info-item">
                          <span class="label">物料名称：</span>
                          <span class="value">{{ mainMaterialName }}</span>
                        </div>
                        <div class="info-item">
                          <span class="label">物料规格：</span>
                          <span class="value">{{ mainMaterialSpec }}</span>
                        </div>
                      </el-card>
                    </el-col>
                  </el-row>
                </el-form>
              </div>
            </el-row>

            <!-- 添加子物料扫描区域 -->
            <div class="section-header" v-if="processMaterials.length > 0">
              <div class="header-left">
                <i class="el-icon-box"></i>
                <span>子物料扫描</span>
              </div>
            </div>

            <el-row
              :gutter="20"
              class="material-section"
              v-if="processMaterials.length > 0"
            >
              <el-col
                :span="12"
                v-for="material in processMaterials"
                :key="material._id"
              >
                <el-card class="material-card" shadow="hover">
                  <div class="material-info">
                    <div class="material-header">
                      <span class="material-name">{{
                        material.materialName
                      }}</span>
                      <el-tag
                        size="mini"
                        :type="
                          validateStatus[material._id] ? 'success' : 'info'
                        "
                      >
                        {{ material.materialCode }}
                      </el-tag>
                    </div>
                    <div class="input-with-status">
                      <el-input
                        v-model="scanForm.barcodes[material._id]"
                        :placeholder="
                          !material.scanOperation
                            ? '无需扫码'
                            : '请扫描子物料条码'
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
                            <el-tag type="info">无需扫码</el-tag>
                          </template>
                          <template v-else-if="material.isBatch">
                            <el-tag type="warning">批次物料</el-tag>
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
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <!-- 已扫描条码列表 -->
            <div class="scanned-list">
              <div class="section-header">
                <div class="header-left">
                  <i class="el-icon-document"></i>
                  <span>已扫描条码</span>
                </div>
                <div class="progress-container">
                  <div class="progress-text">
                    当前进度: {{ scannedList.length }}/{{ batchForm.batchSize }}
                  </div>
                  <el-progress :percentage="progressPercentage"> </el-progress>
                </div>
              </div>

              <el-row :gutter="20" class="barcode-list">
                <el-col
                  :span="8"
                  v-for="(item, index) in scannedList"
                  :key="index"
                >
                  <el-card class="barcode-card" shadow="hover">
                    <div class="barcode-content">
                      <div class="barcode-info">
                        <div class="scan-time">条码：</div>
                        <div class="scan-time">
                          <el-tag> {{ item.barcode }}</el-tag>
                        </div>
                        <div class="scan-time">
                          扫描时间：{{ formatDate(item.scanTime) }}
                        </div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-form>
        </el-card>
      </template>
      <template v-else>
        <div class="init-tip">
          <div class="overlay">
            <i class="el-icon-warning-outline pulse"></i>
            <p>请先初始化工序设置,检测当前工序是否为托盘工序</p>
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
  </div>
</template>

<script>
import StatusPopup from "@/components/StatusPopup/index.vue";
import { getData, addData, updateData, removeData } from "@/api/data";
import { getMachineProgress } from "@/api/machine";
import { createFlow, scanComponents } from "@/api/materialProcessFlowService";
import { createBatch } from "@/api/materialBarcodeBatch";
import { handlePalletBarcode } from "@/api/materialPalletizing";
import ZrSelect from "@/components/ZrSelect";
import { tone } from "@/utils/tone.js";
import smcg from "@/assets/tone/smcg.mp3";
import tmyw from "@/assets/tone/tmyw.mp3";
import cxwgd from "@/assets/tone/cxwgd.mp3";
import cfbd from "@/assets/tone/cfbd.mp3";
import dwx from "@/assets/tone/dwx.mp3";
import wxsb from "@/assets/tone/wxsb.mp3";
import slbpp from "@/assets/tone/slbpp.mp3";

import hirInput from "@/components/hirInput";
import { getAllProcessSteps } from "@/api/materialProcessFlowService";

export default {
  name: "scanBarCodeBatch",
  components: {
    ZrSelect,
    hirInput,
    StatusPopup,
  },
  data() {
    return {
      autoInit: true,
      formData: {
        productModel: "",
        productLine: "",
        processStep: "",
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
      mainMaterialSpec: "",
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
      batchMaterialCache: {}, // 新增用于存储批次物料缓存
      printDialogVisible: false,
      currentBatchBarcode: "", // 当前要打印的批次条码
      autoPrint: false, // 添加自动打印开关状态
      isCollapsed: false, // 添加控制折叠状态的变量
      websocketConnected: false, // 添加WebSocket连接状态
      ws: null, // WebSocket实例
      heartbeatTimer: null, // 心跳定时器
      reconnectAttempts: 0, // 添加重连尝试次数计数
      maxReconnectAttempts: 5, // 最大重连尝试次数
      batchForm: {
        batchSize: 50, // 默认批次数量
      },
      batchSizeLocked: false, // 新增：控制批次数量是否锁定
      scannedList: [], // 已扫描条码列表
      boxList: [], // 包装箱列表
      palletForm: {
        productionPlanWorkOrderId: "",
        palletCode: "",
        saleOrderId: "",
        saleOrderNo: "",
        productionOrderId: "",
        workOrderNo: "",
        totalQuantity: 0,
      },
      salesOrderOptions: [],
      currentPalletId: "", // 当前托盘ID
      currentPalletCode: "", // 当前托盘编号

      processStepData: {},
      printData: {},

      showPopup: false,
      popupType: "",
      printDataTemplate: "", // 添加 printDataTemplate 属性

      hasPrintPermission: false,
      scanMode: localStorage.getItem("scanMode") || "normal", // 默认为普通模式

      craftInfo: {},
      palletizingMode: localStorage.getItem("palletizingMode") || "single", // 默认单产品入托模式
      errorMessage: "", // 错误信息
      errorCode: "", // 错误代码
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
    autoInitMode: {
      get() {
        return localStorage.getItem("autoInit") === "true";
      },
      set(value) {
        localStorage.setItem("autoInit", value);
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
    progressPercentage() {
      return parseInt(
        Math.min(
          100,
          (this.scannedList.length / this.batchForm.batchSize) * 100
        )
      );
    },
    savedBatchSize: {
      get() {
        return (
          localStorage.getItem(
            `batchSize_${this.mainMaterialId}_${this.processStepId}`
          ) || 10
        );
      },
      set(value) {
        localStorage.setItem(
          `batchSize_${this.mainMaterialId}_${this.processStepId}`,
          value
        );
      },
    },
    // 修改 printDataTemplate 的计算属性
    localPrintTemplate: {
      get() {
        try {
          const savedTemplate = localStorage.getItem(
            "printTemplate_scanBarCodeBatch"
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
            "printTemplate_scanBarCodeBatch",
            JSON.stringify(value)
          );
        } catch (error) {
          console.error("保存模板到缓存失败:", error);
        }
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
    productLineId: {
      handler(newVal) {
        if (newVal) {
          this.getSalesOrders();
        }
      },
      immediate: true,
    },
    scanMode: {
      handler(newMode) {
        // 保存到本地存储
        localStorage.setItem("scanMode", newMode);
        // 清空输入框
        this.unifiedScanInput = "";
        // 重新获取焦点
        this.$nextTick(() => {
          this.$refs.scanInput.focus();
        });
        // 提示模式切换
        this.$message.success(
          `已切换至${newMode === "normal" ? "普通" : "RFID"}模式`
        );
      },
    },
  },

  methods: {
    handleAutoInitChange(value) {
      this.autoInit = value;
      this.autoInitMode = value; // 保存到本地存储
      this.$message.success(`已${value ? "开启" : "关闭"}自动初始化模式`);

      if (value) {
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
          if (materialId && processStepId && processStepId.processName) {
            console.log("materialId:", materialId);
            console.log("lineId:", lineId);
            // 更新本地存储
            this.mainMaterialId = materialId._id;
            const processStepIdValue = processStepId._id;
            this.processStepId = processStepIdValue;
            this.processStepData = processStepId;

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
              "lastWorkProductionPlanWorkOrderId_batch",
              (productionPlanWorkOrderId && productionPlanWorkOrderId._id) || ""
            );

            // 更新名称信息
            this.materialName = `${materialId.FNumber} - ${materialId.FName}`;
            this.processName = processStepId.processName;
            if (lineId) {
              this.productLineId = lineId._id;
              this.productLineName = lineId.lineName;
              this.formData.lineName = lineId.lineName;
            }
            this.$message.success("自动初始化工序成功");

            // 对比当前设置的工序和缓存工序是否一致，不一致时调用handleSave()
            if (processStepIdValue !== this.processStepId) {
              this.handleSave();
            }
          } else {
            this.$message.warning("未获取到机器进度配置");
          }
        } else {
          throw new Error(response.message || "获取机器进度失败");
        }
      } catch (error) {
        localStorage.removeItem("mainMaterialId");
        localStorage.removeItem("processStepId");
        this.mainMaterialId = "";
        this.processStepId = "";
        this.formData.productModel = "";
        this.formData.processStep = "";
        console.error("自动初始化失败:", error);
        this.$message.error("自动初始化失败: " + error.message);
      }
    },

    handleWorkOrderSelect(item) {
      if (item) {
        this.formData.workProductionPlanWorkOrderNo = item.workOrderNo;
        this.formData.workProductionPlanWorkOrderId = item._id;

        // 使用计算属性设置缓存
        this.workProductionPlanWorkOrderNo = item.workOrderNo;
        this.workProductionPlanWorkOrderId = item._id;
      }
    },
    handleProductionLineSelect(item) {
      if (item) {
        this.formData.lineName = item.lineName;
        this.formData.productLine = item._id;
        // 添加产线信息缓存
        localStorage.setItem("productLineName", item.lineName);
        localStorage.setItem("productLineId", item._id);
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
          this.$message.error("获取产品型号失败");
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
      } catch (error) {
        console.error("获取工序列表失败:", error);
        this.$message.error("获取工序列表失败");
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
    },

    // 保存按钮处理
    async handleSave() {
      if (
        !this.formData.productModel ||
        !this.formData.processStep ||
        !this.formData.productLine
      ) {
        this.$message.warning("请选择产品型号、工序和产线");
        return;
      }

      // 工单可以为空，不强制验证
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

        // 更新生产计划ID缓存
        localStorage.setItem(
          "lastWorkProductionPlanWorkOrderId_batch",
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
          this.processStepData = processStep;
          this.processName = processStep.processName;
        }

        this.$message.success("保存成功");

        // 模拟延迟以显示加载图标
        setTimeout(() => {
          // 关闭加载动画（虽然页面会刷新，但这是一个好习惯）
          loading.close();
          // 强制刷新页面
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error("保存失败:", error);
        this.$message.error("保存失败");
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
          this.mainMaterialSpec = response.data[0].FSpecification;
        } else {
          console.log("未找到主物料信息"); // 调试日志
          this.mainMaterialName = "";
          this.mainMaterialCode = "";
          this.mainMaterialSpec = "";
        }
      } catch (error) {
        console.error("获取主物料信息失败:", error);
        this.$message.error("获取主物料信息失败");
        this.mainMaterialName = "";
        this.mainMaterialCode = "";
        this.mainMaterialSpec = "";
      }
    },

    // 获取工序相关物料
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
        this.mainMaterialSpec = material.FSpecification;

        console.log("processStep", processStep);
        // 获取工序关联的物料
        try {
          const processMaterialsResponse = await getData("processMaterials", {
            query: { processStepId: this.processStepId },
          });

          if (processMaterialsResponse.data) {
            // 检查生产计划是否有变化，如果有变化则清空批次物料缓存
            const currentPlanId = this.workProductionPlanWorkOrderId;
            const storedPlanId = localStorage.getItem(
              "lastWorkProductionPlanWorkOrderId_batch"
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
                "lastWorkProductionPlanWorkOrderId_batch",
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
          this.$message.error("获取工序物料失败");
          this.processMaterials = [];
          this.validateStatus = { mainBarcode: false };
          this.scanForm.barcodes = {};
        }
      } catch (error) {
        console.error("获取工序物料失败:", error);
        this.$message.error(error.message || "获取工序物料失败");
        this.processMaterials = [];
        this.validateStatus = { mainBarcode: false };
        this.scanForm.barcodes = {};
      }
    },
    async validateDICode(diCode) {
      try {
        // 取DI码对应的所有物料信息
        const response = await getData("productDiNum", {
          query: { diNum: diCode },
          populate: JSON.stringify([
            { path: "productId", model: "k3_BD_MATERIAL" },
          ]),
        });

        if (response.data.length === 0) {
          this.errorMessage = "该DI编码不存在本系统";
          this.$message.error("该DI编码不存在本系统");
          return { isValid: false };
        }

        // 添加空值检查,过滤掉productId为空的记录
        const possibleMaterialCodes = response.data
          .filter((item) => item.productId && item.productId.FNumber)
          .map((item) => item.productId.FNumber);

        if (possibleMaterialCodes.length === 0) {
          this.errorMessage = "该DI编码未关联有效物料";
          this.$message.error("该DI编码未关联有效物料");
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
          this.errorMessage = "该DI编码对应的物料与当前工序不匹配";
          this.$message.error("该DI编码对应的物料与当前工序不匹配");
          return { isValid: false };
        }

        // 返回验证结果和匹配到的物料编码
        return {
          isValid: true,
          materialCode: matchedMaterialCode,
        };
      } catch (error) {
        console.error("DI码验证失败:", error);

        this.$message.error("DI码验证失败");
        return { isValid: false };
      }
    },
    // 修改获取产品关联的条码规则方法
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
          totalRules: rules.length,
        });
      } catch (error) {
        console.error("获取条码规则失败:", error);
        this.$message.error("获取条码规则失败");
        this.materialBarcodeRules = [];
      }
    },
    // 修改验证条码的方法中的日志输出
    async validateBarcode(barcode) {
      console.log("开始验证条码:", barcode);
      if (!barcode) return false;

      try {
        let rules = this.materialBarcodeRules;
        if (rules.length == 0) {
          this.$message.error(
            "未找到可用的条码规则（包括产品特定规则和全局规则）"
          );
          this.errorMessage =
            "未找到可用的条码规则（包括产品特定规则和全局规则）";
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

              // 根据目标字段存储提取结果
              switch (config.target) {
                case "materialCode":
                  materialCode = extractValue;
                  break;
                case "DI":
                  // 如果提取到DI，需要验证并获取对应的物料编码
                  const diResult = await this.validateDICode(extractValue);
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
        this.errorMessage = "该条码不符合任何已配置的规则或物料不匹配";
        this.$message.error("该条码不符合任何已配置的规则或物料不匹配");
        return { materialCode: null, isValid: false };
      } catch (error) {
        console.error("条码验证失败:", error);
        this.$message.error("条码验证过程发生错误");
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
          this.$message.success("扫描成功");
        } else {
          // 使用工序对应的主物料信息创建新的流程记录
          const createResponse = await createFlow({
            mainMaterialId: this.workmainMaterialId, // 使用工序对应的主物料ID
            materialCode: this.workmainMaterialCode, // 使用工序对应的主物料编码
            barcode,
            productLineId: this.productLineId,
            productLineName: this.productLineName,
          });

          if (createResponse.code === 200) {
            this.$message.success("成品条码追溯记录创建成功");
          } else {
            throw new Error(
              createResponse.message || "创建成品条码追溯记录失败"
            );
          }
        }
      } catch (error) {
        console.error("处理主条码失败:", error);
        this.popupType = "ng";
        this.showPopup = true;
        tone(tmyw);
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
        this.$message.success("扫码成功");
      } catch (error) {
        console.error("处理子物料条码失败:", error);
        this.popupType = "ng";
        this.showPopup = true;
        tone(tmyw);
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
    },

    // 修改重置扫码表单方法
    resetScanForm() {
      this.scanForm.mainBarcode = "";
      const newBarcodes = {};

      this.processMaterials.forEach((material) => {
        if (material.isBatch) {
          // 从缓存中获取批次物料的条码
          const cacheKey = `batch_${this.mainMaterialId}_${this.processStepId}_${material._id}`;
          const cachedBarcode = localStorage.getItem(cacheKey);
          if (cachedBarcode) {
            newBarcodes[material._id] = cachedBarcode;
            this.$set(this.validateStatus, material._id, true);
          } else {
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

    // 修改统一扫描处理方法
    async handleUnifiedScan(value) {
      if (!value) return;

      //当打印模板未选择时提醒
      if (!this.$refs.hirInput.selectedTemplate) {
        this.unifiedScanInput = "";
        this.$refs.scanInput.focus();
        this.$message.warning("请先选择打印模板");
        return;
      }

      try {
        let cleanValue = value.trim().replace(/[\r\n]/g, "");
        if (!cleanValue) return;

        // 特殊处理包含,的条码
        if (cleanValue.includes(",")) {
          //按,分割截取
          const parts = cleanValue.split(",");

          //取第一个
          cleanValue = parts[0];
        }

        // 根据不同模式处理扫描值
        if (this.scanMode === "rfid") {
          // 查询RFID标签对应的主条码
          let rfidResponse = await getData("material_process_flow", {
            query: {
              processNodes: {
                $elemMatch: {
                  $and: [
                    { isRfid: { $eq: true } }, // 必须是RFID节点
                    { barcode: { $eq: cleanValue } }, // 必须匹配扫描的条码
                  ],
                },
              },
            },
          });
          if (rfidResponse.data && rfidResponse.data.length > 0) {
            cleanValue = rfidResponse.data[0].barcode;
          } else {
            this.unifiedScanInput = "";
            this.$refs.scanInput.focus();
            this.$message.error("未找到该RFID标签对应的条码");
            this.errorMessage = "未找到该RFID标签对应的条码";
            this.popupType = "ng";
            this.showPopup = true;
            tone(tmyw);
            return;
          }
          // RFID模式下的特殊处理
          // if (!cleanValue.startsWith('RF')) {
          //     this.$message.error('无效的RFID标签格式');
          //     this.popupType = 'ng';
          //     this.showPopup = true;
          //     tone(tmyw);
          //     return;
          // }
          // 可以在这里添加RFID特有的验证逻辑
          const isValidResult = await this.validateBarcode(
            JSON.parse(JSON.stringify(cleanValue))
          );
          console.log("isValidResult", isValidResult);
          if (!isValidResult.isValid) {
            this.$message.error("条码格式不正确，未在系统中注册");
            this.popupType = "ng";
            this.showPopup = true;
            tone(tmyw);
            return;
          }
          let materialCode = isValidResult.materialCode;

          for (const material of this.processMaterials) {
            if (material.materialCode === materialCode) {
              // 新增：检查materialBarcodeBatch表中是否存在该物料编码的未使用条码
              try {
                const batchResponse = await getData("materialBarcodeBatch", {
                  query: {
                    materialCode: materialCode,
                    isUsed: false,
                  },
                  sort: { createAt: 1 }, // 按创建时间正序排序，获取最早的未使用条码
                  limit: 1,
                });

                if (batchResponse.data && batchResponse.data.length > 0) {
                  const expectedBatchId = batchResponse.data[0].batchId;
                  if (cleanValue !== expectedBatchId) {
                    this.$message.error(
                      `请按顺序使用批次条码，应使用条码: ${expectedBatchId}`
                    );
                    tone(tmyw);
                    return;
                  }
                }
                // 如果没有找到对应的批次记录，继续正常流程
              } catch (error) {
                console.warn("检查批次条码顺序失败:", error);
                // 如果查询失败，不阻止正常流程
              }

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
                      `批次物料条码 ${cleanValue} 已达到使用次数限制 ${material.batchQuantity}次`
                    );
                    tone(pcwlxz);
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
                      `批次物料条码 ${cleanValue} 已达到使用次数限制 ${material.batchQuantity}次`
                    );
                    tone(pcwlxz);

                    return;
                  }
                }
              }

              this.$set(this.scanForm.barcodes, material._id, cleanValue);
              this.$set(this.validateStatus, material._id, true);

              // 处理子物料条码
              await this.handleSubBarcode(material._id, materialCode);

              tone(smcg);
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
              break;
            }
          }
        }

        // 检查是否已扫描
        if (this.scannedList.some((item) => item.barcode === cleanValue)) {
          this.$message.warning("该条码已扫描");
          this.popupType = "ng";
          this.showPopup = true;
          tone(cfbd);
          return;
        }

        // 先检查是否为包装箱条码
        const boxResponse = await getData("material_process_flow", {
          query: {
            processNodes: {
              $elemMatch: {
                barcode: cleanValue,
                isPackingBox: true,
              },
            },
          },
        });

        const isBoxBarcode = boxResponse.data && boxResponse.data.length > 0;

        // 根据当前入托模式进行检验
        if (this.palletizingMode === "box" && !isBoxBarcode) {
          this.$message.error("当前为包装箱入托模式，请扫描包装箱条码");
          this.popupType = "ng";
          this.showPopup = true;
          tone(tmyw);
          this.unifiedScanInput = "";
          this.$refs.scanInput.focus();
          return;
        } else if (this.palletizingMode === "single" && isBoxBarcode) {
          this.$message.error("当前为单产品入托模式，请扫描单个产品条码");
          this.popupType = "ng";
          this.showPopup = true;
          tone(tmyw);
          this.unifiedScanInput = "";
          this.$refs.scanInput.focus();
          return;
        }

        if (isBoxBarcode) {
          //找到包装箱条码对应的节点数据
          let nodeData = boxResponse.data[0];
          console.log(nodeData, "nodeData==");
          let packingBoxNode = nodeData.processNodes.filter(
            (item) => item.barcode == cleanValue
          )[0];

          console.log(packingBoxNode, "nodeData==");

          // 检查批次用量与箱内条码数量是否匹配
          if (
            packingBoxNode.batchQuantity &&
            packingBoxNode.batchQuantity !== boxResponse.data.length
          ) {
            this.$message.error(
              `包装箱条码数量(${boxResponse.data.length})与设定的批次用量(${packingBoxNode.batchQuantity})不匹配`
            );
            this.popupType = "ng";
            this.showPopup = true;
            tone(slbpp);
            return;
          }

          // 首先取一条主条码数据进行校验是否为当前产品
          let mainBarcode = nodeData.barcode;
          console.log(mainBarcode, "mainBarcode==");
          let isValid = await this.validateBarcode(mainBarcode);
          console.log("isValid", isValid);
          if (!isValid.isValid) {
            this.$message.error("条码格式不正确，未在系统中注册");
            this.popupType = "ng";
            this.showPopup = true;
            tone(tmyw);
            return;
          }
          // 检查主物料是否匹配
          if (isValid.materialCode !== this.mainMaterialCode) {
            this.$message.error("条码对应物料与当前工序所需物料不匹配");
            this.popupType = "ng";
            this.showPopup = true;
            tone(tmyw);
            return;
          }

          // TODO 国内检查非成品条码检测是否有未完成的维修记录
          if (
            this.craftInfo &&
            (!this.craftInfo.isProduct ||
              this.craftInfo.materialCode !== isValid.materialCode)
          ) {
            // "PENDING_REVIEW", "REVIEWED", "VOIDED"
            console.log("非成品条码检测是否有未完成的维修记录");
            const repairRecord = await getData("product_repair", {
              query: { barcode: cleanValue },
              sort: { _id: -1 },
            });
            if (repairRecord.data.length > 0) {
              if (repairRecord.data[0].status == "PENDING_REVIEW") {
                this.unifiedScanInput = "";
                this.$refs.scanInput.focus();
                this.$message.error("该条码存在未完成的维修记录");
                this.popupType = "ng";
                this.showPopup = true;
                tone(dwx);
                return;
              }
              if (
                repairRecord.data[0].status == "REVIEWED" &&
                repairRecord.data[0].repairResult !== "QUALIFIED"
              ) {
                this.unifiedScanInput = "";
                this.$refs.scanInput.focus();
                this.$message.error("该条码已完成维修,但维修结果为不合格");
                this.popupType = "ng";
                this.showPopup = true;
                tone(wxsb);
                return;
              }
            }
          }
          // 是包装箱条码，获取包装箱内的所有条码
          await this.handleBoxBarcode(cleanValue, boxResponse.data);
        } else {
          // 不是包装箱条码，验证并处理单个条码
          const isValidResult = await this.validateBarcode(cleanValue);
          if (!isValidResult.isValid) {
            this.$message.error("条码对应物料与当前工序所需物料不匹配");
            this.popupType = "ng";
            this.showPopup = true;
            tone(tmyw);
            return;
          }
          // 检查主物料是否匹配
          if (isValidResult.materialCode !== this.mainMaterialCode) {
            this.$message.error("条码对应物料与当前工序所需物料不匹配");
            this.popupType = "ng";
            this.showPopup = true;
            tone(tmyw);
            return;
          }

          // TODO 国内检查非成品条码检测是否有未完成的维修记录
          if (
            this.craftInfo &&
            (!this.craftInfo.isProduct ||
              this.craftInfo.materialCode !== isValidResult.materialCode)
          ) {
            // "PENDING_REVIEW", "REVIEWED", "VOIDED"
            console.log("非成品条码检测是否有未完成的维修记录");
            const repairRecord = await getData("product_repair", {
              query: { barcode: cleanValue },
              sort: { _id: -1 },
            });
            if (repairRecord.data.length > 0) {
              if (repairRecord.data[0].status == "PENDING_REVIEW") {
                this.unifiedScanInput = "";
                this.$refs.scanInput.focus();
                this.$message.error("该条码存在未完成的维修记录");
                this.popupType = "ng";
                this.showPopup = true;
                tone(dwx);
                return;
              }
              if (
                repairRecord.data[0].status == "REVIEWED" &&
                repairRecord.data[0].repairResult !== "QUALIFIED"
              ) {
                this.unifiedScanInput = "";
                this.$refs.scanInput.focus();
                this.$message.error("该条码已完成维修,但维修结果为不合格");
                this.popupType = "ng";
                this.showPopup = true;
                tone(wxsb);
                return;
              }
            }
          }

          await this.handleMainBarcode(cleanValue);
          // 是单个条码，处理单个条码
          await this.handleSingleBarcode(cleanValue);
        }
      } catch (error) {
        console.error("扫描处理失败:", error);
        this.$message.error(error.message || "扫描处理失败");
        this.popupType = "ng";
        this.showPopup = true;
        tone(tmyw);
      } finally {
        this.unifiedScanInput = "";
        this.$refs.scanInput.focus();
      }
    },

    // 处理包装箱条码
    async handleBoxBarcode(boxBarcode, boxData) {
      try {
        // 收集所有已扫描的子物料信息
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
        // 添加到已扫描列表
        for await (const item of boxData) {
          let res = await handlePalletBarcode({
            lineId: this.productLineId,
            lineName: this.productLineName,
            processStepId: this.processStepId,
            materialId: this.mainMaterialId,
            materialCode: this.mainMaterialCode,
            materialName: this.mainMaterialName,
            materialSpec: this.mainMaterialSpec,
            mainBarcode: item.barcode,
            boxBarcode: boxBarcode,
            totalQuantity: this.batchForm.batchSize,
            userId: this.$store.state.user.id,
            componentScans, // 添加子物料信息
          });
          if (res.code === 200) {
            //更新当前托盘编码
            this.palletForm.palletCode = res.data.palletCode;
            this.palletForm.productionOrderId = res.data.productionOrderId;
            this.palletForm.workOrderNo = res.data.workOrderNo;
            this.palletForm.saleOrderId = res.data.saleOrderId;
            this.palletForm.saleOrderNo = res.data.saleOrderNo;
            this.palletForm.totalQuantity = res.data.totalQuantity;
            this.batchForm.batchSize = res.data.totalQuantity;

            this.scannedList.push({
              barcode: item.barcode,
              type: "box",
              boxBarcode: boxBarcode,
              scanTime: new Date(),
            });
            // 打印托盘条码
            let materialPalletizingPrintData = await getData(
              "material_palletizing",
              {
                query: { _id: res.data._id },
                populate: JSON.stringify([
                  { path: "productLineId", select: "lineCode" },
                  { path: "productionOrderId", select: "FWorkShopID_FName" },
                ]),
              }
            );
            let printData = materialPalletizingPrintData.data[0];
            printData.createAt = this.formatDate(printData.createAt);
            printData.workshop =
              (printData.productionOrderId &&
                printData.productionOrderId.FWorkShopID_FName) ||
              "未记录生产车间";
            printData.qrcode = `${printData.palletCode}#${
              printData.saleOrderNo
            }#${printData.materialCode}#${printData.totalQuantity}#${
              (printData.productLineId && printData.productLineId.lineCode) ||
              "未记录生产线"
            }`;
            printData.palletBarcodes = printData.palletBarcodes.map((item) => {
              item.scanTime = this.formatDate(item.scanTime);
              return item;
            });

            this.printData = printData;

            // 如果托盘状态为组托完成，则清空托盘条码 清空条码列表
            if (res.data.status == "STACKED") {
              this.$nextTick(() => {
                this.$refs.hirInput.handlePrints2();
              });

              // 打印完成后再清空数据
              setTimeout(() => {
                this.palletForm.palletCode = "";
                this.palletForm.totalQuantity = 0;
                this.scannedList = [];
              }, 100); // 短暂延迟确保打印先执行
            }
          } else {
            this.$message.error(res.message);
            this.popupType = "ng";
            this.showPopup = true;
            this.errorMessage = res.message;
            if (res.message == "该工序节点已完成或处于异常状态") {
              tone(cfbd);
            } else if (res.message == "未查询到生产工单") {
              tone(cxwgd);
            } else if (res.message == "重复扫码") {
              tone(cfbd);
            } else {
              tone(tmyw);
            }
            return;
          }
        }
        tone(smcg);
        this.popupType = "ok";
        this.showPopup = true;
        this.$message.success(`包装箱扫描成功，新增${boxData.length}个条码`);
      } catch (error) {
        console.error("处理包装箱条码失败:", error);
        throw error;
      }
    },
    // 处理单个条码
    async handleSingleBarcode(barcode) {
      try {
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
        // 调用保存接口
        let res = await handlePalletBarcode({
          lineId: this.productLineId,
          lineName: this.productLineName,
          processStepId: this.processStepId,
          materialId: this.mainMaterialId,
          materialCode: this.mainMaterialCode,
          materialName: this.mainMaterialName,
          materialSpec: this.mainMaterialSpec,
          mainBarcode: barcode,
          boxBarcode: null,
          totalQuantity: this.batchForm.batchSize,
          userId: this.$store.state.user.id,
          componentScans, // 添加子物料信息
        });

        if (res.code === 200) {
          //更新当前托盘编码
          this.palletForm.palletCode = res.data.palletCode;
          this.palletForm.productionOrderId = res.data.productionOrderId;
          this.palletForm.workOrderNo = res.data.workOrderNo;
          this.palletForm.saleOrderId = res.data.saleOrderId;
          this.palletForm.saleOrderNo = res.data.saleOrderNo;
          this.palletForm.totalQuantity = res.data.totalQuantity;
          this.batchForm.batchSize = res.data.totalQuantity;

          // 添加到已扫描列表
          this.scannedList.push({
            barcode,
            type: "single",
            boxBarcode: "",
            scanTime: new Date(),
          });

          let materialPalletizingPrintData = await getData(
            "material_palletizing",
            {
              query: { _id: res.data._id },
              populate: JSON.stringify([
                { path: "productLineId", select: "lineCode" },
                { path: "productionOrderId", select: "FWorkShopID_FName" },
              ]),
            }
          );
          let printData = materialPalletizingPrintData.data[0];
          printData.createAt = this.formatDate(printData.createAt);
          printData.workshop =
            (printData.productionOrderId &&
              printData.productionOrderId.FWorkShopID_FName) ||
            "未记录生产车间";
          printData.qrcode = `${printData.palletCode}#${
            printData.saleOrderNo
          }#${printData.materialCode}#${printData.totalQuantity}#${
            (printData.productLineId && printData.productLineId.lineCode) ||
            "未记录生产线"
          }`;
          printData.palletBarcodes = printData.palletBarcodes.map((item) => {
            item.scanTime = this.formatDate(item.scanTime);
            return item;
          });
          this.printData = printData;

          // 如果托盘状态为组托完成，则清空托盘条码 清空条码列表
          if (res.data.status == "STACKED") {
            this.$nextTick(() => {
              this.$refs.hirInput.handlePrints2();
            });
            this.palletForm.palletCode = "";
            this.scannedList = [];
          }

          tone(smcg);
          this.popupType = "ok";
          this.showPopup = true;
          this.$message.success("条码扫描成功");
        } else {
          this.$message.error(res.message);
          this.popupType = "ng";
          this.showPopup = true;
          this.errorMessage = res.message;
          if (res.message == "该工序节点已完成或处于异常状态") {
            tone(cfbd);
          } else if (res.message == "未查询到生产工单") {
            tone(cxwgd);
          } else {
            tone(tmyw);
          }
          return;
        }
      } catch (error) {
        console.error("处理单个条码失败:", error);
        throw error;
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
          "确认取消当前工序设置？这将清除所有批次物料和打印模板的缓存数据。",
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
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

        // 只清除工序相关的localStorage,保留产线相关的缓存
        localStorage.removeItem("mainMaterialId");
        localStorage.removeItem("processStepId");
        localStorage.removeItem("materialName");
        localStorage.removeItem("processName");

        // 注意:不清��以下产线相关的缓存
        // localStorage.removeItem('productLineId');
        // localStorage.removeItem('productLineName');

        // 重置表单数据,但保留产线信息
        const productLine = this.formData.productLine;
        const lineName = this.formData.lineName;
        this.formData = {
          productModel: "",
          productLine: productLine, // 保留产线信息
          lineName: lineName, // 保留产线名称
          processStep: "",
          componentName: "",
        };

        // 清除打印模板缓存
        // const templateKey = `printTemplate_${this.mainMaterialId}_${this.processStepId}`;
        // localStorage.removeItem(templateKey);

        this.$message.success("已取消工序设置");

        // 模拟延迟以显示加载图标
        setTimeout(() => {
          loading.close();
          // 强制刷新页面
          window.location.reload();
        }, 500);
      } catch (error) {
        if (error !== "cancel") {
          console.error("取消设置失败:", error);
          this.$message.error("取消设置失败");
        }
      }
    },

    // 获取验证状态图标
    getValidateIcon(key) {
      return this.validateStatus[key]
        ? "el-icon-check success-icon"
        : "el-icon-close error-icon";
    },

    // 打印成功处理
    handlePrintSuccess() {
      this.$message.success("批次条码打印成功");
      this.currentBatchBarcode = ""; // 清空当前批次条码
    },

    // 打印失败处理
    handlePrintError(error) {
      this.$message.error(`打印失败: ${error}`);
      this.currentBatchBarcode = ""; // 清空当前批次条码
    },

    // 打印弹��关闭处理
    handleDialogClose() {
      this.printDialogVisible = false;
      this.currentBatchBarcode = ""; // 清空当前批次条码
    },

    // 加处理自动打印开关变化的方法
    handleAutoPrintChange(value) {
      // 将开关状态保存到本地存储
      localStorage.setItem("autoPrint", value);
      this.$message.success(`已${value ? "开启" : "关闭"}自动打印模式`);
    },

    // 新增清除缓存方法
    async handleClearCache() {
      try {
        await this.$confirm(
          "确认清除所有页面缓存数据？此操作不可恢复。",
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
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
          // 清除批次物料缓存
          if (key.startsWith("batch_")) {
            localStorage.removeItem(key);
          }
        });

        this.$message.success("缓存清除成功");

        // 模拟延迟以显示加载图标
        setTimeout(() => {
          loading.close();
          // 强制刷新页面
          window.location.reload();
        }, 500);
      } catch (error) {
        if (error !== "cancel") {
          console.error("清除缓存失败:", error);
          this.$message.error("清除缓存失败");
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
          this.$message.success("设备服务器连接成功");
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
            ); // 指数退避，���大10秒
            this.$message.warning(
              `设备连接已断开，${delay / 1000}秒后尝试第${
                this.reconnectAttempts
              }次重连...`
            );
            setTimeout(() => {
              this.initWebSocket();
            }, delay);
          } else {
            this.$message.error("重连次数已达上限，请检查网络连接或刷新页面");
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
        this.$message.error(`设备连接初始化失败: ${error.message}`);
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
        this.$message.warning("设备未连接");
      }
    },

    // 处理批次数量变化
    handleBatchSizeChange(value) {
      // 获取已入托数量
      const usedQuantity = this.scannedList.length;

      if (value < usedQuantity) {
        this.$message.warning(`批次数量不能小于已入托数量(${usedQuantity})`);
        // 恢复为原来的值或已入托数量
        this.batchForm.batchSize = Math.max(this.savedBatchSize, usedQuantity);
        return;
      }
      this.batchForm.batchSize = value;
    },

    // 新增保存批次数量方法
    async handleSaveBatchSize() {
      try {
        await this.$confirm(
          "确认保存当前批次数量设置？保存后将无法修改。",
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        // 获取已入托数量
        const usedQuantity = this.scannedList.length;

        if (this.batchForm.batchSize < usedQuantity) {
          this.$message.warning(`批次数量不能小于已入托数量(${usedQuantity})`);
          // 恢复为原来的值或已入托数量
          this.batchForm.batchSize = Math.max(
            this.savedBatchSize,
            usedQuantity
          );
          return;
        }

        // 检查是否有托盘单据
        if (this.palletForm.palletCode) {
          // 如果有托盘单据，调用更新方法
          updateData("material_palletizing", {
            query: { palletCode: this.palletForm.palletCode },
            update: { totalQuantity: this.batchForm.batchSize },
          });
        }

        // 保存到本地存储
        this.savedBatchSize = this.batchForm.batchSize;
        this.batchSizeLocked = true;

        this.$message.success("批次数量设置已保存");
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error("保存失败");
        }
      }
    },

    // 新增取消批次数量设置方法
    async handleCancelBatchSize() {
      try {
        await this.$confirm("确认取消当前批次数量设置？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        // 清除本地存储的批次数量
        localStorage.removeItem(
          `batchSize_${this.mainMaterialId}_${this.processStepId}`
        );

        // 重置状态
        this.batchSizeLocked = false;
        this.batchForm.batchSize = 50; // 重置为默认值

        this.$message.success("已取消批次数量设置");
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error("取消失败");
        }
      }
    },

    // 修改初始化方法，在 created 钩子中调用
    initBatchSize() {
      // 从本地存储获取保存的批次数量
      const savedSize = this.savedBatchSize;
      if (savedSize && !this.batchForm.batchSize) {
        this.batchForm.batchSize = parseInt(savedSize);
        this.batchSizeLocked = true;
      }
    },

    // 格式化日期
    formatDate(date) {
      return new Date(date).toLocaleString();
    },

    // 清空已扫描列表
    clearScannedList() {
      this.$confirm("确认清空已扫描列表?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.scannedList = [];
          this.$message.success("列表已清空");
        })
        .catch(() => {});
    },

    // 移除单个扫描项
    removeScannedItem(index) {
      this.scannedList.splice(index, 1);
    },

    // 获取销售单号列表
    async getSalesOrders() {
      try {
        if (!this.productLineId) {
          this.$message.warning("当前产线未设置");
          return;
        }

        const response = await getData("production_plan_work_order", {
          query: {
            productionLineId: this.productLineId,
            status: "IN_PROGRESS",
          },
          populate: JSON.stringify([
            { path: "saleOrderId" },
            { path: "productionOrderId" },
          ]),
        });
        console.log(response, "response");
        if (response.code === 200 && response.data.length > 0) {
          this.palletForm.productionPlanWorkOrderId = response.data[0]._id;
          this.palletForm.saleOrderId = response.data[0].saleOrderId._id;
          this.palletForm.saleOrderNo = response.data[0].saleOrderNo;
          this.palletForm.productionOrderId =
            response.data[0].productionOrderId._id;
          this.palletForm.workOrderNo = response.data[0].workOrderNo;
          this.palletForm.totalQuantity = response.data[0].totalQuantity;
          this.batchForm.batchSize = response.data[0].totalQuantity;
        } else {
          this.$message.warning("当前产线没有在生产中的工单");
        }

        // 更新当前托盘编码
        // 获取当前托盘的已扫描条码
        if (this.mainMaterialId && this.palletForm.productionOrderId) {
          const palletResponse = await getData("material_palletizing", {
            query: {
              productionPlanWorkOrderId:
                this.palletForm.productionPlanWorkOrderId, // 添加工单ID筛选
              productLineId: this.productLineId,
              status: "STACKING",
              materialId: this.mainMaterialId,
              productionOrderId: this.palletForm.productionOrderId,
            },
            populate: JSON.stringify([
              { path: "productLineId", select: "lineCode" },
              { path: "productionOrderId", select: "FWorkShopID_FName" },
            ]),
          });

          if (palletResponse.data && palletResponse.data[0]) {
            const palletData = palletResponse.data[0];
            this.palletForm.palletCode = palletData.palletCode;
            this.palletForm.totalQuantity = palletData.totalQuantity;
            this.batchForm.batchSize = palletData.totalQuantity;
            this.scannedList = palletData.palletBarcodes.map((item) => ({
              barcode: item.barcode,
              type: item.barcodeType,
              scanTime: item.scanTime,
            }));

            // 打印数据
            let printData = palletData;
            printData.createAt = this.formatDate(printData.createAt);
            printData.workshop =
              (printData.productionOrderId &&
                printData.productionOrderId.FWorkShopID_FName) ||
              "未记录生产车间";
            printData.palletBarcodes = printData.palletBarcodes.map((item) => {
              item.scanTime = this.formatDate(item.scanTime);
              return item;
            });
            printData.qrcode = `${printData.palletCode}#${
              printData.saleOrderNo
            }#${printData.materialCode}#${printData.totalQuantity}#${
              (printData.productLineId && printData.productLineId.lineCode) ||
              "未记录生产线"
            }`;
            this.printData = printData;
          }
        }
      } catch (error) {
        console.error("获取销售单号失败:", error);
        this.$message.error("获取销售单号失败");
      }
    },

    // 处理销售单号变化
    handleSalesOrderChange(value) {
      if (value) {
        const selectedOrder = this.salesOrderOptions.find(
          (item) => item._id === value
        );
        if (selectedOrder) {
          this.palletForm.saleOrderNo = selectedOrder.saleOrderNo;
        }
      } else {
        this.palletForm.saleOrderNo = "";
      }
    },

    // 修改模板变更处理方法
    handleTemplateChange(template) {
      if (!template) return;

      try {
        // 保存完整的模板对象到本地存储
        this.localPrintTemplate = template;
        this.$message.success("打印模板已保存到本地");
      } catch (error) {
        console.error("保存打印模板失败:", error);
        this.$message.error("保存打印模板失败");
      }
    },

    // 处理入托模式切换
    handlePalletizingModeChange(value) {
      localStorage.setItem("palletizingMode", value);
      this.$message.success(
        `已切换至${value === "box" ? "包装箱入托" : "单产品入托"}模式`
      );
      // 清空输入框
      this.unifiedScanInput = "";
      // 重新获取焦点
      this.$nextTick(() => {
        this.$refs.scanInput.focus();
      });
    },
  },
  async created() {
    // 从本地存储中恢复自动打印开关状态
    const savedAutoPrint = localStorage.getItem("autoPrint");
    if (savedAutoPrint !== null) {
      this.autoPrint = savedAutoPrint === "true";
    }

    this.initWebSocket(); // 初始化WebSocket连接
    // 从本地存储获取自动初始化设置
    const savedAutoInit = localStorage.getItem("autoInit");
    this.autoInit = savedAutoInit === "true";

    // 如果开启了自动初始化，先尝试获取机器进度
    if (this.autoInit) {
      await this.getAutoInitConfig();
    }

    // 如果自动初始化失败或未开启自动初始化，使用原有的缓存逻辑
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

    // 自动填充表单数据
    await this.fillFormData();

    // 初始化批次数量
    this.initBatchSize();
  },
  mounted() {
    console.log("Complete roles data:", this.$store.getters.roles);
    const roles = this.$store.getters.roles;
    if (!roles || !roles.buttonList) {
      return false;
    }
    console.log(roles.buttonList, "roles.buttonList");
    if (roles.buttonList.includes("scan_edit_configuration")) {
      this.hasEditPermission = true;
    }

    // 页面加载时自动获取焦点
    if (
      this.mainMaterialId &&
      this.processStepId &&
      this.processStepData.processType == "F"
    ) {
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

.scan-card {
  margin: 0 auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 15px; /* 添加元素之间的间距 */
}

.progress-container {
  width: 50%;
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
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #409eff;
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

/* 基本信息展示区域样式 */
.basic-info-section {
  padding: 15px;
  background: #fff;
  border-radius: 8px;
}

.pallet-form {
  margin-top: 10px;
  /* 减小表单顶部间距 */
}

.pallet-form .el-input-group__prepend {
  padding: 0;
  background: none;
  border: none;
}

.pallet-form .el-input-group__prepend .el-button {
  padding: 0 10px;
  color: #409eff;
}

.pallet-form .el-select {
  width: 100%;
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

/* 新增样式 */
.batch-card {
  height: 100%;
}

.batch-settings {
  padding: 20px 0;
}

.batch-progress {
  margin: 20px 0;
}

.progress-text {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.scanned-list {
  margin-top: 20px;
}

.el-table {
  margin-top: 15px;
}

.batch-size-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.batch-size-control .el-input-number {
  width: 120px;
}

.batch-size-control .el-button {
  margin-left: 10px;
}

/* 条码列表样式 */
.barcode-list {
  height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.barcode-card {
  margin-bottom: 15px;
  border-radius: 8px;
  transition: all 0.3s;
}

.barcode-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.barcode-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.barcode-info {
  flex: 1;
  overflow: hidden;
}

.barcode-number {
  font-size: 14px;
  color: #303133;
  font-family: monospace;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scan-time {
  font-size: 12px;
  color: #909399;
}

.barcode-actions {
  margin-left: 10px;
}

.delete-btn {
  padding: 0;
  color: #f56c6c;
}

.delete-btn:hover {
  color: #f78989;
}

/* 滚动条样式优化 */
.barcode-list::-webkit-scrollbar {
  width: 6px;
}

.barcode-list::-webkit-scrollbar-thumb {
  background: #e4e7ed;
  border-radius: 3px;
}

.barcode-list::-webkit-scrollbar-track {
  background: #f5f7fa;
}

/* 新增卡片样式 */
.info-card {
  padding: 8px !important;
  /* 减小内边距 */
  margin-bottom: 10px;
}

.info-card >>> .el-card__body {
  padding: 8px !important;
  /* 减小卡片body的内边距 */
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  /* 减小项目间距 */
  line-height: 1.2;
  /* 减小行高 */
  font-size: 13px;
  /* 减小字体大小 */
}

.info-item:last-child {
  margin-bottom: 0;
  /* 移除最后一项的底部间距 */
}

.label {
  color: #606266;
  margin-right: 4px;
  white-space: nowrap;
}

.value {
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.input-with-status {
  display: flex;
  align-items: center;
  gap: 10px;
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
  transition: all 0.3s;
}

.status-indicator.valid {
  background: #67c23a;
}

/* 输入框样式优化 */
.el-input.valid-input >>> .el-input__inner {
  border-color: #67c23a;
}

.el-input >>> .el-input__inner {
  transition: all 0.3s;
}

.el-input >>> .el-input__inner:focus {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.scan-mode-switch {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

.scan-mode-switch .el-icon-question {
  color: #909399;
  cursor: pointer;
  font-size: 16px;
}

.scan-mode-switch .el-icon-question:hover {
  color: #409eff;
}

.el-input-group__prepend i {
  font-size: 18px;
}

/* 为不同模式设置不同的输入框样式 */
.scan-input-section .el-input.rfid-mode >>> .el-input__inner {
  border-color: #67c23a;
}

.scan-input-section .el-input.normal-mode >>> .el-input__inner {
  border-color: #409eff;
}

/* 添加子物料相关样式 */
.material-section {
  margin: 20px 0;
}

.material-card {
  margin-bottom: 20px;
}

.material-info {
  padding: 10px;
}

.material-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.material-name {
  font-weight: 500;
  color: #303133;
}

.input-with-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.valid-input >>> .el-input__inner {
  border-color: #67c23a;
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

.mode-switch {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-label {
  color: #606266;
  font-size: 14px;
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 140px; /* 设置最小宽度 */
}

.mode-switch {
  display: flex;
  align-items: center;
  white-space: nowrap;
  margin: 0 10px;
}

.mode-label {
  margin-right: 8px;
}

/* 为打印组件添加样式 */
.section-header /deep/ .hir-input-container {
  flex: 1; /* 占用剩余空间 */
  min-width: 280px; /* 确保最小宽度 */
}

/* 在小屏幕上调整为垂直布局 */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .mode-switch,
  .header-left,
  .section-header /deep/ .hir-input-container {
    width: 100%;
    margin: 5px 0;
  }
}
</style>
