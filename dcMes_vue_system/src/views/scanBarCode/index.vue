<template>
  <div class="scan-container" v-loading="loading">
    <div class="left-form" :class="{ collapsed: isCollapsed }">
      <el-card class="init-card">
        <!-- 标题部分 -->
        <div class="card-header">
          <span>
            <i class="el-icon-setting"></i>
            {{ $t("scanBarCode.processSettings.title") }}</span
          >
          <el-switch
            v-model="autoInit"
            :active-text="$t('scanBarCode.processSettings.auto')"
            :inactive-text="$t('scanBarCode.processSettings.manual')"
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
                {{
                  websocketConnected
                    ? $t("scanBarCode.processSettings.connected")
                    : $t("scanBarCode.processSettings.disconnected")
                }}</el-tag
              >
              <span> {{ $t("scanBarCode.processSettings.basicInfo") }} </span>
            </div>

            <el-form-item
              :label="$t('scanBarCode.processSettings.productModel')"
            >
              <zr-select
                v-if="!mainMaterialId"
                v-model="formData.productModel"
                collection="k3_BD_MATERIAL"
                :disabled="!!mainMaterialId && !!processStepId"
                :search-fields="['FNumber', 'FName']"
                label-key="FName"
                sub-key="FMATERIALID"
                :multiple="false"
                :placeholder="
                  $t('scanBarCode.processSettings.productModelPlaceholder')
                "
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
                :placeholder="
                  $t('scanBarCode.processSettings.productModelPlaceholder')
                "
                :disabled="!!mainMaterialId && !!processStepId"
              />
            </el-form-item>

            <el-form-item
              :label="$t('scanBarCode.processSettings.processStep')"
            >
              <el-select
                v-model="formData.processStep"
                :placeholder="
                  $t('scanBarCode.processSettings.processStepPlaceholder')
                "
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

            <el-form-item
              :label="$t('scanBarCode.processSettings.productionLine')"
            >
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
                :placeholder="
                  $t('scanBarCode.processSettings.productionLinePlaceholder')
                "
                @select="handleProductionLineSelect"
              />
              <el-input
                v-else
                v-model="formData.lineName"
                :placeholder="
                  $t('scanBarCode.processSettings.productionLinePlaceholder')
                "
                :disabled="!!mainMaterialId && !!processStepId"
              />
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
              {{ $t("scanBarCode.processSettings.cancelSettings") }}
            </el-button>
            <el-button
              type="primary"
              v-else
              @click="handleSave"
              icon="el-icon-check"
            >
              {{ $t("scanBarCode.processSettings.saveSettings") }}
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
        <el-card class="scan-card">
          <!-- 标题部分 -->
          <div class="card-header">
            <div class="header-left">
              <i class="el-icon-scan"></i>
              <span>{{ $t("scanBarCode.barcodeScanning.title") }}</span>
              <el-button type="text" @click="toggleCollapse">
                <i
                  :class="
                    isCollapsed
                      ? 'el-icon-d-arrow-right'
                      : 'el-icon-d-arrow-left'
                  "
                ></i>
                {{
                  isCollapsed
                    ? $t("scanBarCode.barcodeScanning.expand")
                    : $t("scanBarCode.barcodeScanning.collapse")
                }}
              </el-button>
            </div>
            <el-button
              type="text"
              @click="handleClearCache"
              icon="el-icon-delete"
            >
              {{ $t("scanBarCode.barcodeScanning.clearCache") }}
            </el-button>
          </div>

          <el-form :model="scanForm" ref="scanForm" label-width="100%">
            <!-- 工单信息模块 -->
            <div
              class="work-order-info"
              v-if="firstStep && workOrderInfo.workOrderNo !== ''"
            >
              <div class="info-item">
                <span class="label"
                  >{{ $t("scanBarCode.workOrder.workOrderNo") }}：</span
                >
                <span class="value">{{
                  workOrderInfo.workOrderNo ||
                  $t("scanBarCode.workOrder.noWorkOrder")
                }}</span>
              </div>
              <div class="info-item">
                <span class="label"
                  >{{ $t("scanBarCode.workOrder.inputQuantity") }}：</span
                >
                <span class="value2">{{
                  workOrderInfo.inputQuantity || 0
                }}</span>
                <span class="separator">/</span>
                <span class="value">{{
                  workOrderInfo.planProductionQuantity || 0
                }}</span>
              </div>
              <div class="info-item">
                <span class="label"
                  >{{ $t("scanBarCode.workOrder.scrapQuantity") }}：</span
                >
                <span class="value3">{{
                  workOrderInfo.scrapQuantity || 0
                }}</span>
              </div>
            </div>

            <div class="section-header">
              <i class="el-icon-camera"></i>
              <span>{{
                $t("scanBarCode.barcodeScanning.unifiedScanArea")
              }}</span>
            </div>

            <div class="scan-input-section">
              <div class="custom-input-container">
                <input
                  type="text"
                  v-model="unifiedScanInput"
                  :disabled="isSubmitting"
                  :placeholder="
                    $t('scanBarCode.barcodeScanning.scanPlaceholder')
                  "
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
            <!-- 主物料部分 -->
            <div class="section-header">
              <div class="section-title">
                <i class="el-icon-goods"></i>
                <span>{{
                  $t("scanBarCode.barcodeScanning.mainMaterial")
                }}</span>
              </div>
              <div class="print-batch-btn">
                <el-switch
                  v-model="autoPrint"
                  :active-text="$t('scanBarCode.processSettings.auto')"
                  :inactive-text="$t('scanBarCode.processSettings.manual')"
                  class="print-switch"
                  @change="handleAutoPrintChange"
                >
                </el-switch>
                <el-button
                  type="primary"
                  @click="handlePrintBatch"
                  class="print-batch-btn"
                  size="mini"
                >
                  {{ $t("scanBarCode.barcodeScanning.print") }}
                </el-button>
              </div>
            </div>
            <div class="material-section">
              <el-form-item
                :label="`${$t(
                  'scanBarCode.barcodeScanning.materialCode'
                )}：${mainMaterialCode}  ${$t(
                  'scanBarCode.barcodeScanning.materialName'
                )}：${mainMaterialName}`"
                label-width="100%"
                class="vertical-form-item"
              >
                <div class="input-with-status">
                  <el-input
                    v-model="scanForm.mainBarcode"
                    :placeholder="
                      $t(
                        'scanBarCode.barcodeScanning.scanMainBarcodePlaceholder'
                      )
                    "
                    :class="{ 'valid-input': validateStatus['mainBarcode'] }"
                    readonly
                  >
                    <template slot="prefix">
                      <i class="el-icon-full-screen"></i>
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
            <div class="section-header">
              <i class="el-icon-box"></i>
              <span>{{ $t("scanBarCode.barcodeScanning.subMaterial") }}</span>
            </div>
            <div class="material-section">
              <el-row :gutter="20">
                <el-col
                  :span="12"
                  v-for="material in processMaterials"
                  :key="material._id"
                >
                  <el-form-item
                    :label="`${$t(
                      'scanBarCode.barcodeScanning.materialCode'
                    )}：${material.materialCode}  ${$t(
                      'scanBarCode.barcodeScanning.materialName'
                    )}：${material.materialName}  `"
                    class="vertical-form-item"
                  >
                    <div class="input-with-status">
                      <el-input
                        v-model="scanForm.barcodes[material._id]"
                        :placeholder="
                          !material.scanOperation
                            ? $t('scanBarCode.barcodeScanning.noScanRequired')
                            : $t(
                                'scanBarCode.barcodeScanning.scanSubBarcodePlaceholder'
                              )
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
                            <el-tag type="info">{{
                              $t("scanBarCode.barcodeScanning.noScanRequired")
                            }}</el-tag>
                          </template>
                          <template v-else-if="material.isBatch">
                            <el-tag
                              type="warning"
                              v-if="material.batchQuantity"
                            >
                              {{ getBatchUsageText(material._id) }}
                            </el-tag>
                            <el-tag type="warning" v-else>{{
                              $t("scanBarCode.barcodeScanning.batchMaterial")
                            }}</el-tag>
                          </template>
                          <template v-else-if="material.isKey">
                            <el-tag type="success">{{
                              $t("scanBarCode.barcodeScanning.keyMaterial")
                            }}</el-tag>
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
              <el-button plain @click="resetScanForm" icon="el-icon-refresh">{{
                $t("scanBarCode.buttons.reset")
              }}</el-button>
              <el-button
                type="primary"
                @click="handleConfirm"
                icon="el-icon-check"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                >{{
                  isSubmitting ? "提交中..." : $t("scanBarCode.buttons.confirm")
                }}</el-button
              >
            </div>
          </el-form>
        </el-card>
      </template>
      <template v-else>
        <div class="init-tip">
          <div class="overlay">
            <i class="el-icon-warning-outline pulse"></i>
            <p>{{ $t("scanBarCode.messages.pleaseInitializeProcess") }}</p>
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
// 使用音频国际化工具替换原有的音频导入
import { playAudio, preloadAudioFiles } from "@/utils/audioI18n.js";

import TscPrinter from "@/components/tscInput";
import StatusPopup from "@/components/StatusPopup/index.vue";
import { getAllProcessSteps } from "@/api/materialProcessFlowService";

export default {
  name: "ScanBarCode",
  components: {
    ZrSelect,
    TscPrinter,
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
      isCollapsed: false, // 添加控���折叠状态的变量
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
        scrapQuantity: 0,
      },

      // 添加防重复提交标志位
      isSubmitting: false,
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
  },

  methods: {
    handleAutoInitChange(value) {
      this.autoInit = value;
      this.autoInitMode = value; // 保存到本地存储
      this.$message.success(`已${value ? "开启" : "关闭"}自动初始化模式`);

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
        //先清空缓存
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
        this.$message.error("获取条码规则失败");
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
        this.$message.error(error.message || "批次条码生成失败");
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
      // this.processStepId = processId; // 缓存选中的工序ID
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
        } else {
          console.log("未找到主物料信息"); // 调试日志
          this.mainMaterialName = "";
          this.mainMaterialCode = "";
        }
      } catch (error) {
        console.error("获取主物料信息失败:", error);
        this.$message.error("获取主物料信息失败");
        this.mainMaterialName = "";
        this.mainMaterialCode = "";
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

        console.log(this.processStepData, "this.processStepData");

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
          this.$message.error("该DI编码对应的物料与当前工序不匹配");
          this.errorMessage = "该DI编码对应的物料与当前工序不匹配";
          return { isValid: false };
        }

        // 添加空值检查,过滤掉productId为空的记录
        const possibleMaterialCodes = response.data
          .filter((item) => item.productId && item.productId.FNumber)
          .map((item) => item.productId.FNumber);

        if (possibleMaterialCodes.length === 0) {
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

    async validateBarcode(barcode) {
      console.log("开始验证条码:", barcode);
      if (!barcode) return false;

      try {
        let rules = this.materialBarcodeRules;
        if (rules.length == 0) {
          this.$message.error(
            "未找到可用的条码规则（包括产品特定规则和全局规则）"
          );
          this.errorMessage = "未找到可用的条码规则";
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
                    // DI验证失败，标记为无效，继续尝试下一个规则
                    isValid = false;
                  }
                  break;
                case "relatedBill":
                  relatedBill = extractValue;
                  break;
              }
            }

            // 【关键修复】验证提取的物料编码是否匹配当前需要扫描的物料
            // 需要检查提取的物料编码是否在当前工序的物料列表中
            if (isValid && materialCode) {
              // 获取当前工序的所有物料编码（主物料 + 子物料）
              const allMaterialCodes = [
                this.mainMaterialCode,
                ...this.processMaterials.map((m) => m.materialCode),
              ];

              // 只有当提取的物料编码在当前工序的物料列表中，才算匹配成功
              if (allMaterialCodes.includes(materialCode)) {
                console.log(
                  `✅ 条码验证通过: 规则=${rule.name} (${
                    rule.isProductSpecific ? "产品特定" : "全局规则"
                  }), 提取物料编码=${materialCode}`
                );
                return {
                  materialCode,
                  isValid: true,
                  relatedBill,
                  ruleName: rule.name,
                  ruleType: rule.isProductSpecific ? "product" : "global",
                };
              } else {
                // 提取的物料编码不匹配当前工序，继续尝试下一个规则
                console.log(
                  `❌ 规则 ${rule.name} 提取的物料编码 ${materialCode} 不在当前工序物料列表中，继续尝试下一个规则`
                );
                isValid = false;
              }
            }
          }
        }

        // 所有规则都未匹配成功
        this.$message.error("该条码不符合任何已配置的规则或物料不匹配");
        this.errorMessage = "该条码不符合任何已配置的规则或物料不匹配";
        return { materialCode: null, isValid: false };
      } catch (error) {
        console.error("条码验证失败:", error);
        this.$message.error("条码验证过程发生错误");
        this.errorMessage = "条码验证过程发生错误";
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
          this.$message.success(this.$t("scanBarCode.messages.scanSuccess"));
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
            this.$message.success(
              this.$t("scanBarCode.messages.flowRecordCreated")
            );
          } else {
            this.errorMessage =
              createResponse.message ||
              this.$t("scanBarCode.messages.flowRecordCreateFailed");
            throw new Error(
              createResponse.message ||
                this.$t("scanBarCode.messages.flowRecordCreateFailed")
            );
          }
        }
      } catch (error) {
        console.error("处理主条码失败:", error);
        this.errorMessage = error;
        this.popupType = "ng";
        this.showPopup = true;
        playAudio("tmyw");
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
        this.errorMessage = error;
        this.popupType = "ng";
        this.showPopup = true;
        playAudio("tmyw");
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

      console.log("工艺信息:", this.craftInfo);

      // 创建全屏加载状态
      const loading = this.$loading({
        lock: true,
        text:
          this.$t("scanBarCode.messages.processing") ||
          "正在处理条码，请稍候...",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.7)",
      });

      try {
        // 更严格地清理输入值中的所有空格和换行符
        let cleanValue = value.replace(/[\s\r\n]/g, "");
        if (!cleanValue) return;

        //特殊处理
        // if (cleanValue.includes("102251-114010190087")) {
        //   // 检查条码格式是否符合预期，并提取日期部分
        //   const parts = cleanValue.split("-");
        //   if (parts.length >= 4) {
        //     const dateStr = parts[2]; // 获取第三段日期字符串

        //     // 判断日期是否小于20250201
        //     if (dateStr && dateStr.length === 8 && dateStr < "20250201") {
        //       this.unifiedScanInput = "";
        //       this.$refs.scanInput.focus();
        //       this.$message.error(this.$t('scanBarCode.messages.materialExpired'));
        //       this.errorMessage = this.$t('scanBarCode.messages.materialExpired');
        //       this.popupType = "ng";
        //       this.showPopup = true;
        //       playAudio("dwx");
        //       return;
        //     }
        //   }
        // }

        // // 特殊处理 102251-114010190082,右边物料102251-114010190087
        // if (
        //   cleanValue.includes("102251-114010190082") ||
        //   cleanValue.includes("102251-114010190087")
        // ) {
        //   // 检查条码格式是否符合预期，并提取日期部分
        //   const parts = cleanValue.split("-");
        //   if (parts.length >= 4) {
        //     const dateStr = parts[2]; // 获取第三段日期字符串

        //     // 判断日期是否小于20250226
        //     if (dateStr && dateStr.length === 8 && dateStr < "20250226") {
        //       this.unifiedScanInput = "";
        //       this.$refs.scanInput.focus();
        //       this.$message.error(this.$t('scanBarCode.messages.materialExpired'));
        //       this.errorMessage = this.$t('scanBarCode.messages.materialExpired');
        //       this.popupType = "ng";
        //       this.showPopup = true;
        //       playAudio("dwx");
        //       return;
        //     }
        //   }
        // }

        if (value.includes("DCZZ-")) {
          // 先检查是否为自制条码
          const diyCodeResponse = await getData("material_process_flow", {
            query: {
              diyCode: cleanValue,
            },
          });

          if (diyCodeResponse.data && diyCodeResponse.data.length > 0) {
            cleanValue = diyCodeResponse.data[0].barcode;
          }
        }

        const isValidResult = await this.validateBarcode(cleanValue);
        if (!isValidResult.isValid) {
          this.popupType = "ng";
          this.showPopup = true;
          setTimeout(() => {
            playAudio("tmyw"); // 延迟播放错误提示音
          }, 300);
          this.$notify({
            title: this.$t("scanBarCode.messages.barcodeValidationFailed"),
            message: this.$t("scanBarCode.messages.barcodeFormatError"),
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
        // if (
        //   this.craftInfo &&
        //   (!this.craftInfo.isProduct ||
        //     this.craftInfo.materialCode !== materialCode)
        // ) {
        // "PENDING_REVIEW", "REVIEWED", "VOIDED"
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
            this.$message.error("该条码存在未完成的维修记录");
            this.errorMessage = "该条码存在未完成的维修记录";
            this.popupType = "ng";
            this.showPopup = true;
            playAudio("dwx");
            return;
          }
          if (
            repairRecord.data[0].status == "REVIEWED" &&
            repairRecord.data[0].repairResult !== "QUALIFIED"
          ) {
            if (repairRecord.data[0].solution == "报废") {
              this.unifiedScanInput = "";
              this.$refs.scanInput.focus();
              this.$message.error("该条码已完成报废处理");
              this.errorMessage = "该条码已完成报废处理";
              this.popupType = "ng";
              this.showPopup = true;
              playAudio("tmyw");
              return;
            }
            this.unifiedScanInput = "";
            this.$refs.scanInput.focus();
            this.$message.error("该条码已完成维修,但维修结果为不合格");
            this.errorMessage = "该条码已完成维修,但维修结果为不合格";
            this.popupType = "ng";
            this.showPopup = true;
            playAudio("wxsb");
            return;
          }
        }
        // }

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
                  this.$message.error("该条码已作废");
                  this.errorMessage = "该条码已作废";
                  this.popupType = "ng";
                  this.showPopup = true;
                  playAudio("tmyw");
                  return;
                }

                // 如果最好的条码状态是已暂停，不允许使用
                if (bestBarcode.status === "SUSPENDED") {
                  this.unifiedScanInput = "";
                  this.$refs.scanInput.focus();
                  this.$message.error("该条码已暂停使用");
                  this.errorMessage = "该条码已暂停使用";
                  this.popupType = "ng";
                  this.showPopup = true;
                  playAudio("tmyw");
                  return;
                }

                // 如果存在多个条码且不全是作废/暂停状态，给出提示信息
                if (checkPreProduction.data.length > 1) {
                  const validBarcodes = sortedBarcodes.filter(
                    (b) => b.status !== "VOIDED" && b.status !== "SUSPENDED"
                  );

                  if (validBarcodes.length > 1) {
                    console.info(
                      "存在多个有效条码记录，自动选择优先级最高的条码",
                      bestBarcode
                    );
                    this.$notify({
                      title: "注意",
                      message: `存在${validBarcodes.length}个有效条码记录，已自动选择最优条码`,
                      type: "warning",
                      duration: 3000,
                    });
                  }
                }

                // 如果最好的条码是已使用状态，给出警告但允许继续
                if (bestBarcode.status === "USED") {
                  console.warn("使用了已扫描过的条码", bestBarcode);
                  this.$notify({
                    title: this.$t("common.warning"),
                    message: this.$t("scanBarCode.messages.duplicateBarcode"),
                    type: "warning",
                    duration: 5000,
                  });
                  // 继续允许使用
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

          playAudio("smcg");
          this.$notify({
            title: this.$t("scanBarCode.messages.mainMaterialScanSuccess"),
            dangerouslyUseHTMLString: true,
            message: `
                                <div style="line-height: 1.5">
                                    <div>物料名称: ${this.mainMaterialName}</div>
                                    <div>物料编码: ${materialCode}</div>
                                    <div>条码: ${cleanValue}</div>
                                </div>
                            `,
            type: "success",
            duration: 3000,
            position: "top-right",
          });
          matched = true;
        }

        //判断子物料是否包含关键物料
        const keyMaterial = this.processMaterials.find((m) => m.isKey);
        console.log(keyMaterial, "keyMaterial");
        if (keyMaterial) {
          // 如果包含关键物料，则必须先扫描主条码
          if (!this.scanForm.mainBarcode || !this.validateStatus.mainBarcode) {
            this.$message.error("关键物料必须先扫描主条码");
            this.errorMessage = "关键物料必须先扫描主条码";
            this.popupType = "ng";
            this.showPopup = true;
            playAudio("smztm");
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
              //             playAudio('tmyw')
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
                      `批次物料条码 ${cleanValue} 已达到使用次数限制 ${material.batchQuantity}次`
                    );
                    playAudio("pcwlxz");
                    this.errorMessage = "批次物料条码已达到使用次数限制";
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
                    playAudio("pcwlxz");

                    return;
                  }
                }
              }

              this.$set(this.scanForm.barcodes, material._id, cleanValue);
              this.$set(this.validateStatus, material._id, true);

              // 处理子物料条码
              await this.handleSubBarcode(material._id, materialCode);

              playAudio("smcg");
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
          this.$message.error("条码不匹配");
          this.errorMessage = "该条码不符合任何已配置的规则或物料不匹配";
          this.popupType = "ng";
          this.showPopup = true;
          setTimeout(() => {
            playAudio("tmyw"); // 延迟播放错误提示音
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
          // 检查是否已经在提交中，避免重复提交
          if (this.isSubmitting) {
            console.warn("已经在提交中，跳过自动提交");
            return;
          }

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
          playAudio("tmyw"); // 延迟播放错误提示音
        }, 1000);
        this.$notify({
          title: "扫描失败",
          message: error.message || "扫描处理失败",
          type: "error",
          duration: 3000,
          position: "top-right",
        });
      } finally {
        // 关闭加载状态
        loading.close();

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
          "确认取消当前工序设置？这将清除所有批次物料的缓存数据。",
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

        // 只清除工序相关localStorage,保留产线相关的缓存
        localStorage.removeItem("mainMaterialId");
        localStorage.removeItem("processStepId");
        localStorage.removeItem("materialName");
        localStorage.removeItem("processName");

        // 注意:不清除以下产线相关的缓存
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

    // 确认按钮处理方法
    async handleConfirm() {
      // 防重复提交检查
      if (this.isSubmitting) {
        console.warn("正在提交中，请勿重复操作");
        return;
      }

      // 设置提交状态
      this.isSubmitting = true;

      // 创建全屏加载状态
      const loading = this.$loading({
        lock: true,
        text:
          this.$t("scanBarCode.messages.submitting") ||
          "正在提交数据，请稍候...",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.7)",
      });

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
          this.$message.warning("请完成所有必要的条码扫描");
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
        };
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
          // 在播放bdcg的地方添加成功弹窗
          setTimeout(() => {
            playAudio("bdcg");
          }, 1000);
        }

        // 6. 重置表单
        this.resetScanForm();
      } catch (error) {
        // 6. 重置表单
        this.resetScanForm();
        console.error("确认失败:", error);
        this.errorMessage = error.message;

        // 【关键修复】检测条码规则不匹配错误，自动刷新规则缓存
        if (
          error.message &&
          (error.message.includes("条码不符合任何已配置的规则") ||
            error.message.includes("物料不匹配") ||
            error.message.includes("不符合物料") ||
            error.message.includes("条码规则"))
        ) {
          console.warn(
            "⚠️ 检测到条码规则不匹配，可能是规则已更新，正在刷新规则缓存..."
          );

          try {
            // 重新获取所有相关物料的条码规则
            const allMaterialIds = [
              this.workmainMaterialId, // 主物料ID
              ...this.processMaterials.map((m) => m.materialId), // 子物料IDs
            ];

            // 刷新条码规则
            await this.getProductBarcodeRules(allMaterialIds);

            this.$notify({
              title: "规则已更新",
              dangerouslyUseHTMLString: true,
              message: `
                <div style="line-height: 1.5">
                  <div style="color: #E6A23C">⚠️ 条码规则已更新</div>
                  <div>系统已自动刷新最新规则</div>
                  <div>请重新扫描条码</div>
                </div>
              `,
              type: "warning",
              duration: 5000,
              position: "top-right",
            });

            console.log(
              "✅ 条码规则缓存已刷新，新规则数量:",
              this.materialBarcodeRules.length
            );
          } catch (refreshError) {
            console.error("刷新条码规则失败:", refreshError);
            this.$message.error("刷新条码规则失败，请刷新页面");
          }

          // 显示错误提示
          this.$message.error("条码验证失败: " + error.message);
          this.popupType = "ng";
          this.showPopup = true;
          setTimeout(() => {
            playAudio("tmyw");
          }, 1000);
          // 初始化批次物料缓存并进行条码校验
          if (this.processMaterials && this.processMaterials.length > 0) {
            for (const material of this.processMaterials) {
              if (material.isBatch) {
                const cacheKey = `batch_${this.mainMaterialId}_${this.processStepId}_${material._id}`;
                const usageKey = `${cacheKey}_usage`;
                const cachedBarcode = localStorage.getItem(cacheKey);

                if (cachedBarcode) {
                  console.log(`检查缓存的批次物料条码: ${cachedBarcode}`);

                  try {
                    // 1. 先进行条码规则校验
                    const validateResult = await this.validateBarcode(
                      cachedBarcode
                    );

                    if (!validateResult.isValid) {
                      // 条码不符合当前规则，清除缓存
                      console.warn(
                        `批次物料条码 ${cachedBarcode} 不符合当前规则，清除缓存`
                      );
                      localStorage.removeItem(cacheKey);
                      localStorage.removeItem(usageKey);
                      this.$set(this.scanForm.barcodes, material._id, "");
                      this.$set(this.validateStatus, material._id, false);
                      this.$message.warning(
                        `批次物料 ${material.materialName} 的缓存条码不符合当前规则，已清除`
                      );
                      continue;
                    }

                    // 2. 校验物料编码是否匹配
                    if (validateResult.materialCode !== material.materialCode) {
                      console.warn(
                        `批次物料条码 ${cachedBarcode} 的物料编码不匹配，清除缓存`
                      );
                      localStorage.removeItem(cacheKey);
                      localStorage.removeItem(usageKey);
                      this.$set(this.scanForm.barcodes, material._id, "");
                      this.$set(this.validateStatus, material._id, false);
                      this.$message.warning(
                        `批次物料 ${material.materialName} 的缓存条码物料编码不匹配，已清除`
                      );
                      continue;
                    }

                    // 3. 检查使用次数
                    const count = await this.queryBatchUsageCount(
                      cachedBarcode,
                      material.materialId
                    );
                    console.log(
                      `批次条码 ${cachedBarcode} 已使用次数: ${count}`
                    );

                    // 如果设置了批次用量限制且已达到上限
                    if (
                      material.batchQuantity &&
                      count >= material.batchQuantity &&
                      material.batchQuantity > 0
                    ) {
                      console.warn(
                        `批次条码 ${cachedBarcode} 使用次数已达到上限`
                      );
                      localStorage.removeItem(cacheKey);
                      localStorage.removeItem(usageKey);
                      this.$set(this.scanForm.barcodes, material._id, "");
                      this.$set(this.validateStatus, material._id, false);
                      this.$message.warning(
                        `批次物料 ${material.materialName} 的条码使用次数已达到上限，已清除`
                      );
                      continue;
                    }

                    // 4. 所有校验通过，恢复缓存
                    console.log(
                      `批次物料条码 ${cachedBarcode} 校验通过，恢复缓存`
                    );
                    this.$set(
                      this.scanForm.barcodes,
                      material._id,
                      cachedBarcode
                    );
                    this.$set(this.validateStatus, material._id, true);
                    this.$set(this.batchUsageCount, material._id, count);
                  } catch (error) {
                    // 校验过程出错，清除缓存
                    console.error(
                      `批次物料条码 ${cachedBarcode} 校验失败:`,
                      error
                    );
                    localStorage.removeItem(cacheKey);
                    localStorage.removeItem(usageKey);
                    this.$set(this.scanForm.barcodes, material._id, "");
                    this.$set(this.validateStatus, material._id, false);
                  }
                }
              }
            }
          }
        } else if (error.message.includes("批次物料条码")) {
          this.$message.warning(error.message);
          setTimeout(() => {
            playAudio("pcwlxz");
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
            playAudio("cfbd"); // 延迟播放
          }, 1000);
        } else if (error.message == "未查询到生产工单") {
          this.$message.error(error.message);
          this.errorMessage = "未查询到生产工单";
          this.popupType = "ng";
          this.showPopup = true;
          setTimeout(() => {
            playAudio("cxwgd"); // 延迟播放
          }, 1000);
        } else {
          this.$message.error("确认失败:" + error.message);
          this.popupType = "ng";
          this.showPopup = true;
          setTimeout(() => {
            playAudio("tmyw"); // 延迟播放
          }, 1000);
        }
      } finally {
        // 关闭加载状态
        loading.close();
        // 重置提交状态
        this.isSubmitting = false;
      }
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

    // 打印弹窗关闭处理
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
          // 清除批次物料缓存和使用次数
          if (key.startsWith("batch_")) {
            localStorage.removeItem(key);
            localStorage.removeItem(`${key}_usage`); // 同时清除使用次数记录
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
            ); // 指数退避，最大10秒
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

    // 产品型号选择处理
    handleProductSelect() {
      // 打开产品型号选择弹窗或跳转到选择页面
      this.$message.info("产品型号选择功能");
    },

    // 产品工序选择处理
    handleProcessSelect() {
      // 打开产品工序选择弹窗或跳转到选择页面
      this.$message.info("产品工序选择功能");
    },

    // 产线编码选择处理
    handleLineSelect() {
      // 打开产线编码选择弹窗或跳转到选择页面
      this.$message.info("产线编码选择功能");
    },

    clearInput() {
      this.unifiedScanInput = "";
      this.focusInput();
    },
    async getWorkOrderInfo() {
      try {
        const productLineId = this.productLineId;
        console.log(productLineId, "productLineId");
        if (this.productLineId) {
          const response = await getData("production_plan_work_order", {
            query: {
              productionLineId: this.productLineId,
              status: "IN_PROGRESS",
            },
            select:
              "workOrderNo planProductionQuantity inputQuantity scrapQuantity",
          });

          if (response.data && response.data[0]) {
            this.workOrderInfo = {
              workOrderNo: response.data[0].workOrderNo || "",
              planProductionQuantity:
                response.data[0].planProductionQuantity || 0,
              inputQuantity: response.data[0].inputQuantity || 0,
              scrapQuantity: response.data[0].scrapQuantity || 0,
            };
          }
        }
      } catch (error) {
        console.error("获取工单信息失败:", error);
        this.workOrderInfo = {
          workOrderNo: "",
          planProductionQuantity: 0,
          inputQuantity: 0,
          scrapQuantity: 0,
        };
      }
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
    }

    // 自动填充表单数据
    await this.fillFormData();

    // 初始化批次物料缓存并进行条码校验
    if (this.processMaterials && this.processMaterials.length > 0) {
      for (const material of this.processMaterials) {
        if (material.isBatch) {
          const cacheKey = `batch_${this.mainMaterialId}_${this.processStepId}_${material._id}`;
          const usageKey = `${cacheKey}_usage`;
          const cachedBarcode = localStorage.getItem(cacheKey);

          if (cachedBarcode) {
            console.log(`检查缓存的批次物料条码: ${cachedBarcode}`);

            try {
              // 1. 先进行条码规则校验
              const validateResult = await this.validateBarcode(cachedBarcode);

              if (!validateResult.isValid) {
                // 条码不符合当前规则，清除缓存
                console.warn(
                  `批次物料条码 ${cachedBarcode} 不符合当前规则，清除缓存`
                );
                localStorage.removeItem(cacheKey);
                localStorage.removeItem(usageKey);
                this.$set(this.scanForm.barcodes, material._id, "");
                this.$set(this.validateStatus, material._id, false);
                this.$message.warning(
                  `批次物料 ${material.materialName} 的缓存条码不符合当前规则，已清除`
                );
                continue;
              }

              // 2. 校验物料编码是否匹配
              if (validateResult.materialCode !== material.materialCode) {
                console.warn(
                  `批次物料条码 ${cachedBarcode} 的物料编码不匹配，清除缓存`
                );
                localStorage.removeItem(cacheKey);
                localStorage.removeItem(usageKey);
                this.$set(this.scanForm.barcodes, material._id, "");
                this.$set(this.validateStatus, material._id, false);
                this.$message.warning(
                  `批次物料 ${material.materialName} 的缓存条码物料编码不匹配，已清除`
                );
                continue;
              }

              // 3. 检查使用次数
              const count = await this.queryBatchUsageCount(
                cachedBarcode,
                material.materialId
              );
              console.log(`批次条码 ${cachedBarcode} 已使用次数: ${count}`);

              // 如果设置了批次用量限制且已达到上限
              if (
                material.batchQuantity &&
                count >= material.batchQuantity &&
                material.batchQuantity > 0
              ) {
                console.warn(`批次条码 ${cachedBarcode} 使用次数已达到上限`);
                localStorage.removeItem(cacheKey);
                localStorage.removeItem(usageKey);
                this.$set(this.scanForm.barcodes, material._id, "");
                this.$set(this.validateStatus, material._id, false);
                this.$message.warning(
                  `批次物料 ${material.materialName} 的条码使用次数已达到上限，已清除`
                );
                continue;
              }

              // 4. 所有校验通过，恢复缓存
              console.log(`批次物料条码 ${cachedBarcode} 校验通过，恢复缓存`);
              this.$set(this.scanForm.barcodes, material._id, cachedBarcode);
              this.$set(this.validateStatus, material._id, true);
              this.$set(this.batchUsageCount, material._id, count);
            } catch (error) {
              // 校验过程出错，清除缓存
              console.error(`批次物料条码 ${cachedBarcode} 校验失败:`, error);
              localStorage.removeItem(cacheKey);
              localStorage.removeItem(usageKey);
              this.$set(this.scanForm.barcodes, material._id, "");
              this.$set(this.validateStatus, material._id, false);
            }
          }
        }
      }
    }

    await this.getWorkOrderInfo();
  },
  async mounted() {
    console.log("Complete roles data:", this.$store.getters.roles);
    const roles = this.$store.getters.roles;
    if (!roles || !roles.buttonList) {
      return false;
    }
    if (roles.buttonList.includes("scan_edit_configuration")) {
      this.hasEditPermission = true;
    }

    // 预加载音频文件
    try {
      const audioKeys = [
        "smcg",
        "tmyw",
        "bdcg",
        "cfbd",
        "pcwlxz",
        "cxwgd",
        "dwx",
        "wxsb",
        "smztm",
      ];
      await preloadAudioFiles(audioKeys);
      console.log("音频文件预加载完成");
    } catch (error) {
      console.warn("音频文件预加载失败:", error);
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
  align-items: center;
  justify-content: space-between;
  margin: 20px 0;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 6px;
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

.value3 {
  color: #f56c6c;
  font-weight: 500;
  font-size: 16px;
}

.separator {
  margin: 0 8px;
  color: #909399;
}
</style>
