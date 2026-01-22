<template>
  <div class="pallet-assembly-container">
    <!-- 添加打印组件 -->
    <hir-input
      ref="hirInput"
      :default-template="localPrintTemplate"
      @template-change="handleTemplateChange"
      :show-preview="true"
      :show-browser-print="true"
      :show-silent-print="true"
      :printData="printData"
    />
    <el-card class="main-card">
      <div slot="header" class="card-header">
        <span>{{ $t("palletAssembly.title") }}</span>
      </div>

      <el-form
        :model="palletForm"
        ref="palletForm"
        label-width="100px"
        size="large"
      >
        <!-- 托盘编号输入区域 -->
        <el-form-item
          :label="$t('palletAssembly.palletCode')"
          prop="palletCode"
          :rules="[
            {
              required: true,
              message: $t('palletAssembly.validation.palletCodeRequired'),
              trigger: 'blur',
            },
          ]"
        >
          <el-input
            v-model="palletForm.palletCode"
            :placeholder="$t('palletAssembly.palletCodePlaceholder')"
            @keyup.enter.native="validatePalletCode"
            size="large"
          >
            <el-button slot="append" type="primary" @click="validatePalletCode">
              {{ $t("palletAssembly.confirmPallet") }}
            </el-button>
          </el-input>
        </el-form-item>

        <div v-if="palletInfo" class="pallet-info-section">
          <!-- 托盘信息展示区域 -->
          <el-alert
            type="success"
            :title="
              $t('palletAssembly.palletInfo.palletNumber') +
              ': ' +
              palletInfo.palletCode
            "
            :description="
              $t('palletAssembly.palletInfo.palletStatus') +
              ': ' +
              (palletInfo.status === 'STACKED'
                ? $t('palletAssembly.status.stacked')
                : $t('palletAssembly.status.stacking')) +
              ' | ' +
              $t('palletAssembly.palletInfo.currentCount') +
              ': ' +
              currentCount +
              ' | ' +
              $t('palletAssembly.palletInfo.totalQuantity') +
              ': ' +
              (palletInfo.totalQuantity ||
                $t('palletAssembly.palletInfo.notSet')) +
              ' | ' +
              $t('palletAssembly.palletInfo.remaining') +
              ': ' +
              remainingCapacity
            "
            show-icon
            :closable="false"
            style="margin-bottom: 15px"
          ></el-alert>

          <!-- 原生HTML替代 el-descriptions -->
          <div class="native-info-descriptions">
            <div class="info-entry">
              <span class="info-label"
                >{{ $t("palletAssembly.palletInfo.productLine") }}:</span
              >
              <span class="info-value">{{
                palletInfo.productLineName ||
                $t("palletAssembly.palletInfo.notSet")
              }}</span>
            </div>
            <div class="info-entry">
              <span class="info-label"
                >{{ $t("palletAssembly.palletInfo.materialInfo") }}:</span
              >
              <span class="info-value">{{
                materialInfo || $t("palletAssembly.palletInfo.notSet")
              }}</span>
            </div>
            <div class="info-entry">
              <span class="info-label"
                >{{ $t("palletAssembly.palletInfo.orderInfo") }}:</span
              >
              <span class="info-value">{{
                palletInfo.saleOrderNo || $t("palletAssembly.palletInfo.notSet")
              }}</span>
            </div>
            <div class="info-entry">
              <span class="info-label"
                >{{ $t("palletAssembly.palletInfo.workOrderInfo") }}:</span
              >
              <span class="info-value">{{
                palletInfo.workOrderNo || $t("palletAssembly.palletInfo.notSet")
              }}</span>
            </div>
          </div>

          <!-- 统一扫描区域 & 物料状态展示 -->
          <div class="unified-scan-and-material-status-section">
            <el-divider content-position="center">{{
              $t("palletAssembly.sections.scanAndStatus")
            }}</el-divider>

            <!-- 统一扫描输入框 -->
            <el-form-item
              :label="$t('palletAssembly.unifiedScan')"
              :label-width="formLabelWidth"
            >
              <el-input
                ref="unifiedScanInputRef"
                v-model="unifiedScanInput"
                :placeholder="$t('palletAssembly.unifiedScanPlaceholder')"
                @keyup.enter.native="handleUnifiedScan"
                size="large"
                clearable
                @clear="focusUnifiedInput"
              >
                <el-button
                  slot="append"
                  type="primary"
                  @click="handleUnifiedScan"
                  :disabled="!unifiedScanInput.trim()"
                >
                  <i class="el-icon-camera"></i>
                  {{ $t("palletAssembly.processScan") }}
                </el-button>
              </el-input>
            </el-form-item>

            <!-- 主物料 (成品/箱) 扫描状态 -->
            <div v-if="palletInfo" class="material-scan-status-item">
              <el-form label-position="top">
                <el-form-item>
                  <template slot="label">
                    <el-tag type="info" size="mini" effect="plain">
                      主物料:
                      {{
                        mainMaterialScanState.expectedMaterialName ||
                        materialInfo
                      }}
                    </el-tag>
                  </template>
                  <div class="input-with-status">
                    <el-input
                      v-model="mainMaterialScanState.scannedBarcode"
                      :placeholder="
                        $t('palletAssembly.messages.mainMaterialPending')
                      "
                      readonly
                      :class="{
                        'valid-input': mainMaterialScanState.validated,
                      }"
                    />
                    <div
                      class="status-indicator"
                      :class="{ valid: mainMaterialScanState.validated }"
                    >
                      <i
                        :class="
                          mainMaterialScanState.validated
                            ? 'el-icon-check'
                            : 'el-icon-close'
                        "
                      ></i>
                    </div>
                  </div>
                </el-form-item>
              </el-form>
            </div>

            <!-- 子物料扫描状态 -->
            <div
              v-if="subMaterials.length > 0"
              class="sub-materials-status-list"
            >
              <el-form
                label-position="top"
                class="sub-material-form-flex-container"
              >
                <el-form-item
                  v-for="(subMaterial, index) in subMaterials"
                  :key="subMaterial._id"
                  class="material-scan-status-item"
                >
                  <template slot="label">
                    <el-tag
                      :type="subMaterial.scanOperation ? 'success' : 'info'"
                      size="mini"
                      effect="plain"
                    >
                      子物料: {{ subMaterial.materialName }} ({{
                        subMaterial.materialCode
                      }})
                    </el-tag>
                  </template>
                  <div class="input-with-status">
                    <el-input
                      v-model="subMaterial.scannedBarcode"
                      :placeholder="
                        subMaterial.scanOperation
                          ? $t('palletAssembly.messages.subMaterialPending')
                          : $t('palletAssembly.messages.noScanRequired')
                      "
                      readonly
                      :class="{ 'valid-input': subMaterial.validated }"
                    />
                    <div
                      class="status-indicator"
                      :class="{
                        valid: subMaterial.validated,
                        'not-required': !subMaterial.scanOperation,
                      }"
                    >
                      <i
                        v-if="subMaterial.scanOperation"
                        :class="
                          subMaterial.validated
                            ? 'el-icon-check'
                            : 'el-icon-close'
                        "
                      ></i>
                      <span v-else>-</span>
                    </div>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="barcode-scan-section">
            <el-progress
              :percentage="progressPercentage"
              :status="progressStatus"
              :stroke-width="15"
              style="margin: 20px 0"
            >
              <span class="progress-text"
                >{{ currentCount }}/{{ palletInfo.totalQuantity || "?" }}</span
              >
            </el-progress>
          </div>

          <!-- 条码列表展示区域 -->
          <div class="barcode-list-section">
            <div class="section-header">
              <h3>
                {{
                  $t("palletAssembly.barcodeList.title", {
                    count: scannedBarcodes.length,
                  })
                }}
              </h3>
              <div class="section-actions">
                <el-button
                  type="danger"
                  size="mini"
                  @click="clearScannedBarcodes"
                  :disabled="scannedBarcodes.length === 0"
                >
                  {{ $t("palletAssembly.barcodeList.clearList") }}
                </el-button>
              </div>
            </div>

            <el-table
              :data="scannedBarcodes"
              height="300"
              border
              stripe
              style="width: 100%"
            >
              <el-table-column
                :label="$t('palletAssembly.barcodeList.serialNumber')"
                type="index"
                width="50"
                align="center"
              ></el-table-column>
              <el-table-column
                :label="$t('palletAssembly.barcodeList.barcode')"
                prop="barcode"
                align="center"
              ></el-table-column>
              <el-table-column
                :label="$t('palletAssembly.barcodeList.type')"
                align="center"
                width="120"
              >
                <template slot-scope="scope">
                  <el-tag
                    size="medium"
                    :type="scope.row.type === 'single' ? 'primary' : 'success'"
                  >
                    {{
                      scope.row.type === "single"
                        ? $t("palletAssembly.barcodeList.singleProduct")
                        : $t("palletAssembly.barcodeList.packagingBox")
                    }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('palletAssembly.barcodeList.boxBarcode')"
                align="center"
                width="150"
              >
                <template slot-scope="scope">
                  <span v-if="scope.row.boxBarcode">{{
                    scope.row.boxBarcode
                  }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('palletAssembly.barcodeList.scanTime')"
                align="center"
                width="180"
              >
                <template slot-scope="scope">
                  {{ formatDate(scope.row.scanTime) }}
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 操作提示区域 -->
          <el-alert
            type="info"
            :title="$t('palletAssembly.operationTips.title')"
            :description="$t('palletAssembly.operationTips.description')"
            show-icon
            :closable="false"
            style="margin-top: 20px"
          ></el-alert>

          <!-- 操作按钮区域 -->
          <div class="action-buttons">
            <el-button type="primary" size="large" @click="resetForm">
              <i class="el-icon-refresh-right"></i>
              {{ $t("palletAssembly.resetPage") }}
            </el-button>
            <!-- <el-button
              type="success"
              size="large"
              @click="handleForceComplete"
              :disabled="
                !palletInfo ||
                palletInfo.status === 'STACKED' ||
                currentCount === 0
              "
            >
              <i class="el-icon-check"></i> 强制完成
            </el-button> -->
          </div>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { getData } from "@/api/data";
import {
  addBarcodeToPallet,
  handleForceCompletePallet,
} from "@/api/materialPalletizing";
import hirInput from "@/components/hirInput";

// 音频文件导入
// import tmyw from "@/assets/tone/tmyw.mp3";

export default {
  name: "PalletAssembly",
  components: {
    hirInput,
  },
  data() {
    return {
      palletForm: {
        palletCode: "",
      },
      palletInfo: null,
      materialInfo: "",
      scannedBarcodes: [],
      lastScanTime: null,
      workOrderInfo: null,
      currentProcessStep: null,
      subMaterials: [],
      formLabelWidth: "120px",
      craftHasPackingProcess: false,
      boxBarcode: "",
      isBoxBarcode: false,
      // 新增统一扫描相关
      unifiedScanInput: "",
      mainMaterialScanState: {
        // 用于跟踪主成品/箱的扫描状态
        expectedMaterialCode: null, // 将从 palletInfo 或 workOrderInfo 获取
        expectedMaterialName: null,
        scannedBarcode: "",
        validated: false,
        // 如果主条码也需要像 scanBarCodeBatchNew 那样有特定的显示标签，可以在这里加
      },
      materialBarcodeRules: [], // 新增：用于存储条码规则
      printData: {}, // 打印数据
    };
  },
  computed: {
    currentCount() {
      return this.palletInfo && this.palletInfo.palletBarcodes
        ? this.palletInfo.palletBarcodes.length
        : 0;
    },
    remainingCapacity() {
      if (!this.palletInfo) return 0;

      const totalCapacity = this.palletInfo.totalQuantity || 0;
      return Math.max(0, totalCapacity - this.currentCount);
    },
    progressPercentage() {
      if (!this.palletInfo || !this.palletInfo.totalQuantity) return 0;

      const percentage =
        (this.currentCount / this.palletInfo.totalQuantity) * 100;
      return Math.min(100, Math.round(percentage));
    },
    progressStatus() {
      if (this.progressPercentage >= 100) return "success";
      if (this.progressPercentage >= 80) return "warning";
      return "";
    },
    // 添加打印模版本地缓存的计算属性
    localPrintTemplate: {
      get() {
        try {
          const savedTemplate = localStorage.getItem(
            "printTemplate_palletAssembly"
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
            "printTemplate_palletAssembly",
            JSON.stringify(value)
          );
        } catch (error) {
          console.error("保存模板到缓存失败:", error);
        }
      },
    },
  },
  methods: {
    /**
     * 播放音频 - 支持多语言
     * @param {string} audioType - 音频类型
     */
    playAudio(audioType) {
      try {
        const currentLanguage = this.$store.getters.language;
        let audioFile;

        // 根据当前语言选择音频文件
        if (currentLanguage === "vi-VN") {
          // 越南语音频文件路径
          audioFile = require(`@/assets/toneVN/${audioType}.wav`);
        } else {
          // 中文音频文件路径（默认）
          audioFile = require(`@/assets/tone/${audioType}.wav`);
        }

        const audio = new Audio(audioFile);
        audio.play().catch((error) => {
          console.warn("音频播放失败:", error);
        });
      } catch (error) {
        console.warn("音频文件加载失败:", error);
      }
    },
    /**
     * 重置表单
     */
    resetForm() {
      this.palletForm = {
        palletCode: "",
      };
      this.palletInfo = null;
      this.materialInfo = "";
      this.scannedBarcodes = [];
      this.lastScanTime = null;
      this.workOrderInfo = null;
      this.currentProcessStep = null;
      this.subMaterials = [];

      // 重置统一扫描相关状态
      this.unifiedScanInput = "";
      this.mainMaterialScanState = {
        expectedMaterialCode: null,
        expectedMaterialName: null,
        scannedBarcode: "",
        validated: false,
      };

      this.$nextTick(() => {
        if (this.$refs.palletForm && this.$refs.palletForm.$el) {
          const palletCodeInput =
            this.$refs.palletForm.$el.querySelector('input[type="text"]');
          if (palletCodeInput) {
            palletCodeInput.focus();
          }
        }
      });
    },

    /**
     * 聚焦到统一扫描输入框
     */
    focusUnifiedInput() {
      this.$nextTick(() => {
        this.$refs.unifiedScanInputRef &&
          this.$refs.unifiedScanInputRef.focus();
      });
    },

    /**
     * 根据工单号和物料ID获取工单、工艺、工序及子物料信息, 并初始化扫描状态
     */
    async fetchWorkOrderAndProcessInfo(workOrderNo, materialIdFromPallet) {
      // 先重置扫描状态
      this.mainMaterialScanState = {
        expectedMaterialCode: null,
        expectedMaterialName: null,
        scannedBarcode: "",
        validated: false,
      };
      this.subMaterials = [];

      try {
        const woRes = await getData("production_plan_work_order", {
          query: { workOrderNo: workOrderNo },
          populate: JSON.stringify([{ path: "materialId" }]),
        });

        if (!woRes.data || woRes.data.length === 0) {
          this.$message.error(
            this.$t("palletAssembly.messages.workOrderNotFound", {
              workOrderNo,
            })
          );
          this.workOrderInfo = null;
          return;
        }
        this.workOrderInfo = woRes.data[0];
        const orderMainMaterial = this.workOrderInfo.materialId;

        if (!orderMainMaterial || !orderMainMaterial._id) {
          this.$message.error(
            this.$t("palletAssembly.messages.workOrderNoMaterial")
          );
          return;
        }

        // 设置主物料期望信息 (优先用托盘上的，其次用工单上的)
        // palletInfo 通常有 materialCode, materialName, materialSpec
        if (this.palletInfo && this.palletInfo.materialCode) {
          this.mainMaterialScanState.expectedMaterialCode =
            this.palletInfo.materialCode;
          this.mainMaterialScanState.expectedMaterialName =
            this.palletInfo.materialName || this.palletInfo.materialCode;
          this.materialInfo = `${this.palletInfo.materialName || ""} (${
            this.palletInfo.materialCode || ""
          })${
            this.palletInfo.materialSpec
              ? " | " + this.palletInfo.materialSpec
              : ""
          }`;
        } else {
          this.mainMaterialScanState.expectedMaterialCode =
            orderMainMaterial.FNumber;
          this.mainMaterialScanState.expectedMaterialName =
            orderMainMaterial.FName || orderMainMaterial.FNumber;
          this.materialInfo = `${orderMainMaterial.FName || ""} (${
            orderMainMaterial.FNumber || ""
          })${
            orderMainMaterial.FSpecification
              ? " | " + orderMainMaterial.FSpecification
              : ""
          }`;
        }

        const currentMaterialIdForCraft =
          materialIdFromPallet || orderMainMaterial._id;

        const craftRes = await getData("craft", {
          query: { materialId: currentMaterialIdForCraft },
        });

        if (!craftRes.data || craftRes.data.length === 0) {
          this.$message.info(
            this.$t("palletAssembly.messages.materialNoCraft", {
              materialName: this.mainMaterialScanState.expectedMaterialName,
            })
          );
          this.currentProcessStep = null;
          return;
        }
        const craft = craftRes.data[0];

        const processStepRes = await getData("processStep", {
          query: { craftId: craft._id, processType: "F" },
          populate: JSON.stringify([
            {
              path: "materials",
              model: "processMaterials",
              populate: { path: "materialId", model: "k3_BD_MATERIAL" },
            },
          ]),
        });

        if (!processStepRes.data || processStepRes.data.length === 0) {
          this.$message.info(
            this.$t("palletAssembly.messages.materialNoProcess", {
              materialName: this.mainMaterialScanState.expectedMaterialName,
            })
          );
          this.currentProcessStep = null;
          return;
        }
        this.currentProcessStep = processStepRes.data[0];

        if (
          this.currentProcessStep.materials &&
          this.currentProcessStep.materials.length > 0
        ) {
          this.subMaterials = this.currentProcessStep.materials
            .filter((pm) => pm.materialId && pm.materialId._id)
            .map((pm) => ({
              _id: pm._id,
              materialId: pm.materialId._id,
              materialCode: pm.materialId.FNumber,
              materialName: pm.materialId.FName,
              materialSpec: pm.materialId.FSpecification,
              scanOperation: pm.scanOperation !== false,
              isBatch: !!pm.isBatch,
              batchQuantity: pm.batchQuantity,
              scannedBarcode: "",
              validated: !(pm.scanOperation !== false),
            }));
        }

        // 检查当前工艺是否包含装箱工序
        this.craftHasPackingProcess = false; // 默认重置
        try {
          const processStepDetailsResponse = await getData("processStep", {
            query: { craftId: craft._id },
          });
          if (
            processStepDetailsResponse.data &&
            processStepDetailsResponse.data.length > 0
          ) {
            this.craftHasPackingProcess = processStepDetailsResponse.data.some(
              (step) => step.processType === "E"
            );
            console.log(
              "当前工艺是否包含装箱工序 (craftHasPackingProcess):",
              this.craftHasPackingProcess
            );
          }
        } catch (error) {
          console.error("检查工艺是否包含装箱工序失败:", error);
          // 此处保持 craftHasPackingProcess 为 false，校验将不会因此失败
        }

        if (this.subMaterials.length > 0) {
          this.$message.success(
            this.$t("palletAssembly.messages.workOrderInfoSuccess")
          );
        } else {
          this.$message.info(
            this.$t("palletAssembly.messages.noSubMaterialRequired")
          );
        }

        // 获取条码规则
        const allMaterialIds = [];
        if (
          this.mainMaterialScanState.expectedMaterialCode &&
          this.workOrderInfo &&
          this.workOrderInfo.materialId
        ) {
          // 假设主物料的ID能通过 this.workOrderInfo.materialId._id 获取
          allMaterialIds.push(this.workOrderInfo.materialId._id);
        }
        this.subMaterials.forEach((sm) => {
          if (sm.materialId) {
            allMaterialIds.push(sm.materialId);
          }
        });

        if (allMaterialIds.length > 0) {
          await this.getProductBarcodeRules(allMaterialIds);
        }
      } catch (error) {
        console.error("获取工单/工序/子物料信息失败:", error);
        this.$message.error(
          this.$t("palletAssembly.messages.workOrderInfoFailed") +
            ": " +
            error.message
        );
        this.workOrderInfo = null;
        this.currentProcessStep = null;
      }
    },

    /**
     * 获取产品关联的条码规则（产品特定规则和全局规则）
     * @param {string[]} materialIds - 物料ID列表
     */
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

        console.log("条码规则列表加载完成:", this.materialBarcodeRules);
        if (this.materialBarcodeRules.length === 0) {
          this.$message.info(this.$t("palletAssembly.messages.noBarcodeRules"));
        }
      } catch (error) {
        console.error("获取条码规则失败:", error);
        this.$message.error(
          this.$t("palletAssembly.messages.barcodeRulesLoadFailed") +
            ": " +
            error.message
        );
        this.materialBarcodeRules = [];
      }
    },

    /**
     * 验证DI码
     * @param {string} diCode - DI码
     * @returns {Promise<object>} - { isValid: boolean, materialCode?: string }
     */
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
          this.$message.error(
            this.$t("palletAssembly.messages.diCodeNotExists")
          );
          return { isValid: false };
        }

        // 添加空值检查,过滤掉productId为空的记录
        const possibleMaterialCodes = response.data
          .filter((item) => item.productId && item.productId.FNumber)
          .map((item) => item.productId.FNumber);

        if (possibleMaterialCodes.length === 0) {
          this.$message.error(
            this.$t("palletAssembly.messages.diCodeNoMaterial")
          );
          return { isValid: false };
        }

        // 获取当前页面的主物料和子物料编码
        const allPageMaterialCodes = [
          this.mainMaterialScanState.expectedMaterialCode,
        ];
        this.subMaterials.forEach((sm) =>
          allPageMaterialCodes.push(sm.materialCode)
        );

        // 查找匹配的物料编码
        const matchedMaterialCode = possibleMaterialCodes.find((code) =>
          allPageMaterialCodes.includes(code)
        );

        if (!matchedMaterialCode) {
          this.$message.error(
            this.$t("palletAssembly.messages.diCodeMaterialMismatch")
          );
          return { isValid: false };
        }

        // 返回验证结果和匹配到的物料编码
        return {
          isValid: true,
          materialCode: matchedMaterialCode,
        };
      } catch (error) {
        console.error("DI码验证失败:", error);
        this.$message.error(
          this.$t("palletAssembly.messages.diCodeValidationFailed") +
            ": " +
            error.message
        );
        return { isValid: false };
      }
    },

    /**
     * 验证托盘编号
     */
    async validatePalletCode() {
      if (!this.palletForm.palletCode.trim()) {
        this.$message.warning(
          this.$t("palletAssembly.messages.enterPalletCode")
        );
        return;
      }

      let tempPalletCodeForValidation = this.palletForm.palletCode.trim(); // 先保存，再重置

      // 解析条码信息
      let [palletCode, saleOrderNo, materialCode, quantity, lineCode] =
        tempPalletCodeForValidation.split("#");

      // 重置所有扫描状态和信息
      this.resetForm(); // resetForm 会重置 unifiedScanInput, mainMaterialScanState, subMaterials
      // resetForm 也会清空 palletForm.palletCode, 所以后面需要用 tempPalletCodeForValidation 重新赋值回来

      try {
        const res = await getData("material_palletizing", {
          query: { palletCode: palletCode }, // 使用保存的托盘号
          populate: JSON.stringify([
            { path: "productLineId" },
            { path: "materialId" },
          ]), // 增加了 materialId 的 populate
        });

        if (res.data && res.data.length > 0) {
          this.palletInfo = res.data[0];
          this.palletForm.palletCode = palletCode; // 成功后，将有效的托盘号重新填入输入框

          if (this.palletInfo.status === "STACKED") {
            this.$message.warning(
              this.$t("palletAssembly.messages.palletCompleted")
            );
            // 即使组托完成，也加载下信息用于展示
            await this.fetchWorkOrderAndProcessInfo(
              this.palletInfo.workOrderNo,
              this.palletInfo.materialId ? this.palletInfo.materialId._id : null
            );
            this.updateScannedBarcodesList(this.palletInfo); // 更新已在托盘上的条码列表
            return;
          }

          // 设置主物料的期望扫描信息
          if (this.palletInfo.materialId) {
            this.mainMaterialScanState.expectedMaterialCode =
              this.palletInfo.materialId.FNumber;
            this.mainMaterialScanState.expectedMaterialName =
              this.palletInfo.materialId.FName ||
              this.palletInfo.materialId.FNumber;
            this.materialInfo = `${this.palletInfo.materialId.FName || ""} (${
              this.palletInfo.materialId.FNumber || ""
            })${
              this.palletInfo.materialId.FSpecification
                ? " | " + this.palletInfo.materialId.FSpecification
                : ""
            }`;
          } else if (this.palletInfo.materialCode) {
            // 兼容旧数据或无 populate 的情况
            this.mainMaterialScanState.expectedMaterialCode =
              this.palletInfo.materialCode;
            this.mainMaterialScanState.expectedMaterialName =
              this.palletInfo.materialName || this.palletInfo.materialCode;
            this.materialInfo = `${this.palletInfo.materialName || ""} (${
              this.palletInfo.materialCode || ""
            })${
              this.palletInfo.materialSpec
                ? " | " + this.palletInfo.materialSpec
                : ""
            }`;
          }

          this.updateScannedBarcodesList(this.palletInfo);

          if (this.palletInfo.workOrderNo) {
            await this.fetchWorkOrderAndProcessInfo(
              this.palletInfo.workOrderNo,
              this.palletInfo.materialId ? this.palletInfo.materialId._id : null
            );
          } else {
            this.$message.warning(
              this.$t("palletAssembly.messages.palletNoWorkOrder")
            );
          }

          this.focusUnifiedInput();
          this.$message.success(
            this.$t("palletAssembly.messages.palletInfoSuccess")
          );
        } else {
          this.$message.error(
            this.$t("palletAssembly.messages.palletNotFound")
          );
          this.palletInfo = null; // 确保清空
        }
      } catch (error) {
        console.error("验证托盘编号失败:", error);
        this.$message.error(
          this.$t("palletAssembly.messages.palletValidationFailed") +
            ": " +
            error.message
        );
        this.palletInfo = null;
      }
    },

    /**
     * 验证条码的格式和内容，并提取物料编码等信息
     * @param {string} barcode - 待验证的条码
     * @returns {Promise<object>} - { isValid: boolean, materialCode?: string, ruleName?: string, ruleType?: string, relatedBill?: string }
     */
    async validateBarcode(barcode) {
      console.log("开始验证条码:", barcode);
      if (!barcode) return { materialCode: null, isValid: false };

      try {
        let rules = this.materialBarcodeRules;
        if (!rules || rules.length === 0) {
          this.$message.info(
            this.$t("palletAssembly.messages.noBarcodeRulesLoaded")
          );
          // 降级逻辑：如果规则为空，尝试直接看条码是否等于某个期望的物料编码
          // 这部分不是 validateBarcode 的标准做法，但在 palletAssembly 中可能需要这种兼容
          if (barcode === this.mainMaterialScanState.expectedMaterialCode) {
            return {
              materialCode: this.mainMaterialScanState.expectedMaterialCode,
              isValid: true,
              ruleName: "Direct Match",
              ruleType: "fallback",
            };
          }
          for (const subMat of this.subMaterials) {
            if (barcode === subMat.materialCode) {
              // 非常不严谨的直接比较，仅为演示降级
              return {
                materialCode: subMat.materialCode,
                isValid: true,
                ruleName: "Direct Match Sub",
                ruleType: "fallback",
              };
            }
          }
          this.$message.error(
            this.$t("palletAssembly.messages.barcodeNotMatchDirectly")
          );
          return { materialCode: null, isValid: false };
        }

        // 遍历规则进行匹配
        for (const rule of rules) {
          console.log(
            `尝试匹配规则: ${rule.name} (${
              rule.isProductSpecific ? "产品特定" : "全局规则"
            })`
          );

          let isValidRule = true;
          let extractedMaterialCode = null;
          let relatedBill = null;
          let currentValueForValidation = barcode;

          // 1. 执行校验规则 (validationRules)
          if (rule.validationRules && rule.validationRules.length > 0) {
            for (const validationRule of rule.validationRules) {
              if (!validationRule.enabled) continue;

              switch (validationRule.type) {
                case "length":
                  if (
                    currentValueForValidation.length !==
                    validationRule.params.length
                  ) {
                    isValidRule = false;
                  }
                  break;
                case "substring":
                  const subValue = currentValueForValidation.substring(
                    validationRule.params.start,
                    validationRule.params.end
                  );
                  if (subValue !== validationRule.params.expectedValue) {
                    isValidRule = false;
                  }
                  break;
                case "regex":
                  try {
                    const regex = new RegExp(validationRule.params.pattern);
                    if (!regex.test(currentValueForValidation)) {
                      isValidRule = false;
                    }
                  } catch (e) {
                    console.error("正则表达式错误:", e);
                    isValidRule = false;
                  }
                  break;
              }
              if (!isValidRule) break; // 当前校验规则失败，无需继续此规则的其他校验
            }
          }

          // 如果校验规则通过，执行提取规则 (extractionConfigs)
          if (isValidRule) {
            if (rule.extractionConfigs && rule.extractionConfigs.length > 0) {
              for (const config of rule.extractionConfigs) {
                let valueToExtractFrom = barcode; // 提取总是从原始条码开始
                let extractedValue = "";

                // 按顺序执行提取步骤 (steps)
                if (config.steps && config.steps.length > 0) {
                  extractedValue = valueToExtractFrom;
                  for (const step of config.steps) {
                    if (!step.enabled) continue;
                    switch (step.type) {
                      case "split":
                        const parts = extractedValue.split(
                          step.params.separator
                        );
                        extractedValue = parts[step.params.index] || "";
                        break;
                      case "substring":
                        extractedValue = extractedValue.substring(
                          step.params.start,
                          step.params.end
                        );
                        break;
                      case "regex":
                        try {
                          const regex = new RegExp(step.params.pattern);
                          const matches = extractedValue.match(regex);
                          if (matches && matches[step.params.group || 0]) {
                            // 默认取group 0
                            extractedValue = matches[step.params.group || 0];
                          } else {
                            extractedValue = ""; // 未匹配到则为空
                          }
                        } catch (e) {
                          console.error("正则提取错误:", e);
                          extractedValue = "";
                        }
                        break;
                    }
                  }
                }

                // 根据目标字段存储提取结果
                switch (config.target) {
                  case "materialCode":
                    extractedMaterialCode = extractedValue;
                    break;
                  case "DI":
                    // 如果提取到DI，需要验证并获取对应的物料编码
                    const diResult = await this.validateDICode(extractedValue);
                    if (diResult.isValid) {
                      extractedMaterialCode = diResult.materialCode;
                    } else {
                      isValidRule = false; // DI验证失败，则此规则匹配失败
                    }
                    break;
                  case "relatedBill":
                    relatedBill = extractedValue;
                    break;
                }
                if (!isValidRule) break; // DI验证失败，跳出提取配置循环
              }
            } else {
              // 如果没有提取规则，但有校验规则且通过了，这可能是一个仅校验的规则
              // 或者，如果规则设计为直接使用条码本身作为某种标识（不常见，但可能）
              // 此时，extractedMaterialCode 可能还是 null
              // 在 scanBarCodeBatchNew 中，似乎没有提取配置，规则本身就代表了物料
              // 这里我们假设，如果规则匹配（校验通过），但没有提取出materialCode，
              // 且规则有关联的productId (通常在productBarcodeRule的顶层)，那么这个productId对应的物料就是目标物料
              // 为了简化，如果 rule.materialId (假设规则对象上直接挂载了它代表的物料ID或编码)
              if (rule.materialCode) {
                // 假设规则对象上可能直接有关联的物料编码
                extractedMaterialCode = rule.materialCode;
              } else {
                // 如果规则本身不携带物料信息，并且没有提取配置，那这条路可能走不通
                // 除非规则的 `name` 或其他属性可以直接映射到物料
                // 为保持与 scanBarCodeBatchNew 类似行为，如果规则通过，但没有提取到 materialCode
                // 且规则是产品特定规则，我们可能需要从 productBarcodeRule 关联的 productId 找到物料编码
                // 这是一个复杂点，暂时简化处理：如果校验通过但没提取出物料编码，认为此规则不适用或配置不完整
              }
            }

            // 如果成功提取到物料编码，并且所有校验都通过
            if (isValidRule && extractedMaterialCode) {
              console.log(
                `条码通过规则: ${rule.name}, 提取物料编码: ${extractedMaterialCode}`
              );
              return {
                materialCode: extractedMaterialCode,
                isValid: true,
                relatedBill,
                ruleName: rule.name,
                ruleType: rule.isProductSpecific ? "product" : "global",
              };
            }
          } // end if (isValidRule)
        } // end for (const rule of rules)

        // 所有规则都未匹配成功
        this.$message.error(
          this.$t("palletAssembly.messages.barcodeNotMatchRules")
        );
        return { materialCode: null, isValid: false };
      } catch (error) {
        console.error("条码验证过程发生错误:", error);
        this.$message.error(
          this.$t("palletAssembly.messages.barcodeValidationError") +
            ": " +
            error.message
        );
        return { materialCode: null, isValid: false };
      }
    },

    /**
     * 处理统一扫描
     */
    async handleUnifiedScan() {
      let barcode = this.unifiedScanInput.trim();
      if (!barcode) {
        this.$message.warning(
          this.$t("palletAssembly.messages.enterOrScanBarcode")
        );
        return;
      }

      if (!this.palletInfo) {
        this.$message.warning(
          this.$t("palletAssembly.messages.validatePalletFirst")
        );
        this.unifiedScanInput = "";
        this.focusUnifiedInput();
        return;
      }

      //当打印模板未选择时提醒
      if (!this.$refs.hirInput.selectedTemplate) {
        this.unifiedScanInput = "";
        this.focusUnifiedInput();
        this.$message.warning(
          this.$t("palletAssembly.messages.selectPrintTemplate")
        );
        return;
      }

      // 如果条码以","开头，则认为是托盘条码
      if (barcode.includes(",")) {
        barcode = barcode.split(",")[0];
      }

      if (barcode.includes("DCZZ-")) {
        // 先检查是否为自制条码
        const diyCodeResponse = await getData("material_process_flow", {
          query: {
            diyCode: barcode,
          },
        });

        if (diyCodeResponse.data && diyCodeResponse.data.length > 0) {
          barcode = diyCodeResponse.data[0].barcode;
        }
      }

      //是否为升级条码
      const preProductionResponse = await getData("preProductionBarcode", {
        query: {
          transformedPrintBarcode: barcode,
        },
        select: {
          transformedPrintBarcode: 1,
          printBarcode: 1,
        },
        limit: 1,
      });

      if (preProductionResponse.data && preProductionResponse.data.length > 0) {
        console.log("升级条码:", preProductionResponse.data[0]);
        barcode = preProductionResponse.data[0].printBarcode;
      }

      //查询是否有过托盘解绑记录
      const palletUnbindResponse = await getData(
        "material_palletizing_unbind_log",
        {
          query: {
            unbindBarcode: barcode,
          },
          select: {
            palletCode: 1,
          },
          sort: {
            _id: -1,
          },
          limit: 1,
        }
      );
      //如果解绑记录存在，并且解绑记录的托盘编码不等于当前托盘编码，则提示错误
      if (
        palletUnbindResponse.data &&
        palletUnbindResponse.data.length > 0 &&
        palletUnbindResponse.data[0].palletCode != this.palletInfo.palletCode
      ) {
        //如果解绑记录存在，并且解绑记录的托盘编码不等于当前托盘编码，则提示错误
        let palletUnbindData = palletUnbindResponse.data[0];
        this.$message.error(
          this.$t("palletAssembly.messages.palletUnbindError", {
            barcode,
            palletCode: palletUnbindData.palletCode,
          })
        );
        return;
      }

      if (this.palletInfo.status === "STACKED") {
        this.$message.warning(
          this.$t("palletAssembly.messages.palletCompletedCannotAdd")
        );
        this.unifiedScanInput = "";
        this.focusUnifiedInput();
        return;
      }

      //检查该条码是否为包装箱条码
      const boxResponse = await getData("material_process_flow", {
        query: {
          processNodes: {
            $elemMatch: {
              barcode: barcode,
              isPackingBox: true,
            },
          },
        },
      });
      const isBoxBarcode = boxResponse.data && boxResponse.data.length > 0;

      if (this.craftHasPackingProcess && isBoxBarcode) {
        this.isBoxBarcode = true;
        this.boxBarcode = JSON.parse(JSON.stringify(barcode));
        barcode = boxResponse.data[0].barcode;
      } else {
        this.isBoxBarcode = false;
        this.boxBarcode = "";
      }

      // 新增前置校验：如果当前工艺包含装箱工序，则必须扫描包装箱条码
      if (this.craftHasPackingProcess && !isBoxBarcode) {
        this.$message.error(
          this.$t("palletAssembly.messages.packingProcessRequired")
        );
        this.popupType = "ng";
        this.showPopup = true;
        this.playAudio("tmyw");
        this.unifiedScanInput = ""; // 清空输入框
        this.$refs.scanInput.focus(); // 重新聚焦
        return; // 终止处理
      }

      // 调用新的 validateBarcode 方法
      const validationResult = await this.validateBarcode(barcode);

      if (!validationResult.isValid || !validationResult.materialCode) {
        this.$message.error(
          validationResult.message ||
            this.$t("palletAssembly.messages.barcodeValidationFailed")
        );
        this.unifiedScanInput = "";
        this.focusUnifiedInput();
        return;
      }

      const matchedMaterialCode = validationResult.materialCode;
      let successfullyMatched = false;

      // 1. 尝试匹配主物料
      if (
        !this.mainMaterialScanState.validated &&
        matchedMaterialCode === this.mainMaterialScanState.expectedMaterialCode
      ) {
        // 检查是否已在成品列表中 (避免重复添加同一个成品/箱)
        if (this.scannedBarcodes.some((item) => item.barcode === barcode)) {
          this.$message.warning(
            this.$t("palletAssembly.messages.barcodeAlreadyInPallet", {
              barcode,
            })
          );
          this.unifiedScanInput = "";
          this.focusUnifiedInput();
          return;
        }

        this.mainMaterialScanState.scannedBarcode = barcode;
        this.mainMaterialScanState.validated = true;
        this.$message.success(
          this.$t("palletAssembly.messages.mainMaterialScanned", {
            materialName: this.mainMaterialScanState.expectedMaterialName,
            barcode,
            ruleName: validationResult.ruleName || "N/A",
          })
        );
        successfullyMatched = true;
      }

      // 2. 如果不是主物料（或主物料已扫过），尝试匹配子物料
      if (!successfullyMatched) {
        for (let i = 0; i < this.subMaterials.length; i++) {
          const subMaterial = this.subMaterials[i];
          if (
            subMaterial.scanOperation &&
            !subMaterial.validated &&
            matchedMaterialCode === subMaterial.materialCode
          ) {
            // 检查条码是否已被用于主物料或其他子物料项
            if (
              this.mainMaterialScanState.scannedBarcode === barcode ||
              this.subMaterials.some(
                (sm) =>
                  sm.scannedBarcode === barcode && sm._id !== subMaterial._id
              )
            ) {
              this.$message.warning(
                this.$t("palletAssembly.messages.barcodeAlreadyScanned", {
                  barcode,
                })
              );
              this.unifiedScanInput = "";
              this.focusUnifiedInput();
              return;
            }
            subMaterial.scannedBarcode = barcode;
            subMaterial.validated = true;
            this.$message.success(
              this.$t("palletAssembly.messages.subMaterialScanned", {
                materialName: subMaterial.materialName,
                barcode,
                ruleName: validationResult.ruleName || "N/A",
              })
            );
            successfullyMatched = true;
            break;
          }
        }
      }

      if (!successfullyMatched) {
        // 如果条码通过了 validateBarcode 但没有匹配到任何当前期望的物料
        // (例如，条码有效，但其 materialCode 不等于主物料的，也不等于任何待扫描子物料的)
        this.$message.error(
          this.$t("palletAssembly.messages.barcodeNotMatchExpected", {
            barcode,
            materialCode: matchedMaterialCode,
          })
        );
      }

      this.unifiedScanInput = "";
      this.focusUnifiedInput();

      // 每次扫描后检查是否可以提交
      if (successfullyMatched) {
        this.checkAndSubmitIfAllScanned();
      }
    },

    /**
     * 检查所有必需的物料是否都已扫描，如果都已扫描则提交
     */
    async checkAndSubmitIfAllScanned() {
      if (!this.palletInfo || this.palletInfo.status === "STACKED") {
        return; // 如果没有托盘信息或托盘已完成，则不提交
      }

      const allRequiredScanned =
        this.mainMaterialScanState.validated &&
        this.subMaterials.every((sm) => !sm.scanOperation || sm.validated);

      if (allRequiredScanned) {
        this.$message.info(
          this.$t("palletAssembly.messages.allMaterialsScanned")
        );

        const componentScans = this.subMaterials
          .filter((sm) => sm.scanOperation && sm.validated && sm.scannedBarcode)
          .map((sm) => ({
            processMaterialId: sm._id,
            materialId: sm.materialId,
            barcode: sm.scannedBarcode.trim(),
            materialCode: sm.materialCode,
            materialName: sm.materialName,
          }));

        const mainBarcodeToSubmit = this.mainMaterialScanState.scannedBarcode;

        // 检查主条码是否已存在于当前托盘的后端数据中（避免因前端刷新不及时导致的重复）
        // 这一步可以省略，如果后端 addBarcodeToPallet 能很好地处理重复提交同一个条码的情况
        if (
          this.palletInfo.palletBarcodes &&
          this.palletInfo.palletBarcodes.some(
            (pb) => pb.barcode === mainBarcodeToSubmit
          )
        ) {
          this.$message.warning(
            this.$t("palletAssembly.messages.barcodeAlreadyExists", {
              barcode: mainBarcodeToSubmit,
            })
          );
          // 重置扫描状态以便下一轮
          this.resetAllScanStates();
          this.focusUnifiedInput();
          return;
        }

        // 模拟包装箱检测逻辑 (需要更完善的规则)
        // 假设如果主条码以 "BOX" 开头，则认为是包装箱
        // const isBox = mainBarcodeToSubmit.startsWith("BOX"); // 非常简化的示例

        try {
          const loading = this.$loading({
            lock: true,
            text: this.$t("palletAssembly.messages.submittingData"),
            spinner: "el-icon-loading",
            background: "rgba(0, 0, 0, 0.7)",
          });
          let res = null;
          if (this.isBoxBarcode && this.boxBarcode) {
            // 获取所有的物料条码
            const boxResponse = await getData("material_process_flow", {
              query: {
                processNodes: {
                  $elemMatch: {
                    barcode: this.boxBarcode,
                    isPackingBox: true,
                  },
                },
              },
            });
            //循环请求入库
            for (const box of boxResponse.data) {
              res = await addBarcodeToPallet({
                palletCode: this.palletInfo.palletCode,
                mainBarcode: box.barcode,
                boxBarcode: this.boxBarcode,
                isBox: this.isBoxBarcode,
                userId: this.$store.state.user.id,
                componentScans: componentScans,
              });
            }
          } else {
            res = await addBarcodeToPallet({
              palletCode: this.palletInfo.palletCode,
              mainBarcode: mainBarcodeToSubmit,
              boxBarcode: this.boxBarcode, // 如果是箱子，boxBarcode 和 mainBarcode 一样
              isBox: this.isBoxBarcode,
              userId: this.$store.state.user.id,
              componentScans: componentScans,
            });
          }

          loading.close();

          if (res.code === 200) {
            if (res.data.addedCount) {
              this.$message.success(
                this.$t("palletAssembly.messages.submitSuccessWithCount", {
                  barcode: mainBarcodeToSubmit,
                  count: res.data.addedCount,
                })
              );
            } else {
              this.$message.success(
                this.$t("palletAssembly.messages.submitSuccess", {
                  barcode: mainBarcodeToSubmit,
                })
              );
            }

            // 刷新整个托盘信息，包括已扫描列表和子物料需求（如果工单更新）
            // validatePalletCode 会重置扫描状态
            await this.validatePalletCode();
            // this.resetAllScanStates(); // validatePalletCode 内部会调用 resetForm，已经包含重置
            this.focusUnifiedInput(); // validatePalletCode 内部也会聚焦

            if (this.palletInfo && this.palletInfo.status === "STACKED") {
              this.$message({
                message: this.$t(
                  "palletAssembly.messages.palletCompleteSuccess"
                ),
                type: "success",
                duration: 3000,
              });
              this.handlePalletComplete(res.data._id);
            }
          } else {
            this.$message.error(
              res.message || this.$t("palletAssembly.messages.submitFailed")
            );
            // 提交失败，是否需要重置部分扫描状态让用户重试？
            // 或者保留当前状态让用户修正？当前选择保留。
            this.resetAllScanStates(); // 清空所有扫描状态以便重新扫描
            this.focusUnifiedInput(); // 聚焦到输入框
          }
        } catch (error) {
          loading && loading.close();
          console.error("提交失败:", error);
          this.$message.error(
            this.$t("palletAssembly.messages.submitFailed") +
              ": " +
              error.message
          );
          this.resetAllScanStates(); // 清空所有扫描状态以便重新扫描
          this.focusUnifiedInput(); // 聚焦到输入框
        }
      }
    },

    /**
     * 重置所有物料的扫描状态和输入值，用于新一轮扫描
     */
    resetAllScanStates() {
      this.mainMaterialScanState.scannedBarcode = "";
      this.mainMaterialScanState.validated = false;
      if (this.subMaterials && this.subMaterials.length > 0) {
        this.subMaterials.forEach((sm) => {
          // 只重置需要扫描的，且已经扫过的
          if (sm.scanOperation) {
            sm.scannedBarcode = "";
            sm.validated = false;
          } else {
            // 无需扫描的，保持 validated 为 true
            sm.validated = true;
          }
        });
      }
      this.unifiedScanInput = ""; // 清空统一扫描框
    },

    /**
     * 清空已扫描条码列表
     */
    clearScannedBarcodes() {
      this.$confirm(
        this.$t("palletAssembly.messages.clearBarcodeListConfirm"),
        this.$t("common.hint"),
        {
          confirmButtonText: this.$t("common.confirm"),
          cancelButtonText: this.$t("common.cancel"),
          type: "warning",
        }
      )
        .then(() => {
          this.scannedBarcodes = [];
          this.$message.success(
            this.$t("palletAssembly.messages.barcodeListCleared")
          );
        })
        .catch(() => {});
    },

    /**
     * 格式化日期
     */
    formatDate(date) {
      if (!date) return this.$t("palletAssembly.messages.unknownDate");
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime()))
        return this.$t("palletAssembly.messages.invalidDate");

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      const seconds = String(dateObj.getSeconds()).padStart(2, "0");

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    /**
     * 更新已扫描条码列表
     */
    updateScannedBarcodesList(pallet) {
      // 清空已扫描条码列表
      this.scannedBarcodes = [];

      // 如果托盘已有条码，将其添加到已扫描列表中
      if (pallet.palletBarcodes && pallet.palletBarcodes.length > 0) {
        // 获取托盘中的条码信息
        for (const barcodeItem of pallet.palletBarcodes) {
          // 检查是否是箱条码
          const isInBox =
            pallet.boxItems &&
            pallet.boxItems.some(
              (box) =>
                box.boxBarcodes &&
                box.boxBarcodes.some((bb) => bb.barcode === barcodeItem.barcode)
            );

          // 如果是箱内条码，找出对应的箱条码
          let boxBarcode = null;
          if (isInBox && pallet.boxItems) {
            for (const box of pallet.boxItems) {
              if (
                box.boxBarcodes &&
                box.boxBarcodes.some((bb) => bb.barcode === barcodeItem.barcode)
              ) {
                boxBarcode = box.boxBarcode;
                break;
              }
            }
          }

          // 添加到已扫描列表
          this.scannedBarcodes.push({
            barcode: barcodeItem.barcode,
            type: boxBarcode ? "box" : "single",
            boxBarcode: boxBarcode,
            scanTime: barcodeItem.scanTime || new Date(),
          });
        }
      }
    },

    // 处理模板变更
    handleTemplateChange(template) {
      if (!template) return;
      try {
        // 保存完整的模板对象到本地存储
        this.localPrintTemplate = template;
        this.$message.success(
          this.$t("palletAssembly.messages.printTemplateSuccess")
        );
      } catch (error) {
        console.error("保存打印模板失败:", error);
        this.$message.error(
          this.$t("palletAssembly.messages.printTemplateFailed")
        );
      }
    },

    // 准备打印数据
    async preparePrintData(palletData) {
      try {
        let printData = { ...palletData };

        // 格式化日期
        printData.createAt = this.formatDate(printData.createAt);

        // 设置车间信息
        printData.workshop =
          (printData.productionOrderId &&
            printData.productionOrderId.FWorkShopID_FName) ||
          this.$t("palletAssembly.messages.unrecordedWorkshop");

        // 设置二维码数据
        printData.qrcode = `${printData.palletCode}#${printData.saleOrderNo}#${
          printData.materialCode
        }#${printData.totalQuantity}#${
          (printData.productLineId && printData.productLineId.lineCode) ||
          this.$t("palletAssembly.messages.unrecordedProductLine")
        }`;

        // 格式化托盘条码列表
        if (Array.isArray(printData.palletBarcodes)) {
          printData.palletBarcodes = printData.palletBarcodes.map((item) => {
            item.scanTime = this.formatDate(item.scanTime);
            return item;
          });
        } else {
          printData.palletBarcodes = [];
        }

        // 处理多工单托盘的情况
        if (
          Array.isArray(printData.workOrders) &&
          printData.workOrders.length > 1
        ) {
          printData.workOrderNo = printData.workOrders
            .map((item) => item.workOrderNo)
            .join(",");
        }

        // 处理尾数托盘标记
        printData.isLastPallet = printData.isLastPallet
          ? this.$t("palletAssembly.messages.lastPallet")
          : "";

        return printData;
      } catch (error) {
        console.error("准备打印数据失败:", error);
        throw error;
      }
    },

    // 修改组托完成后的处理逻辑
    async handlePalletComplete(palletizingId) {
      try {
        // 获取最新的托盘数据
        const palletResponse = await getData("material_palletizing", {
          query: { _id: palletizingId },
          populate: JSON.stringify([
            { path: "productLineId", select: "lineCode" },
            { path: "productionOrderId", select: "FWorkShopID_FName" },
          ]),
        });

        if (palletResponse.data && palletResponse.data[0]) {
          // 准备打印数据
          this.printData = await this.preparePrintData(palletResponse.data[0]);

          // 调用打印组件进行打印
          this.$nextTick(() => {
            if (this.$refs.hirInput) {
              this.$refs.hirInput.handlePrints2();
            }
          });
        }

        // ... existing code ...
      } catch (error) {
        console.error("组托完成处理失败:", error);
        this.$message.error(
          this.$t("palletAssembly.messages.palletCompleteHandleFailed")
        );
      }
    },
  },
  mounted() {
    // 页面加载后自动聚焦到托盘编号输入框
    this.$nextTick(() => {
      const palletCodeInput = this.$refs.palletForm.$el.querySelector("input");
      palletCodeInput && palletCodeInput.focus();

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
    });
  },
};
</script>

<style lang="scss" scoped>
.pallet-assembly-container {
  padding: 20px;
  height: 100%;
  background-color: #f0f2f5;

  .main-card {
    margin-bottom: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .card-header {
      display: flex;
      align-items: center;
      font-weight: bold;
      font-size: 18px;

      i {
        margin-right: 8px;
        font-size: 20px;
      }
    }
  }

  .pallet-info-section {
    margin-top: 20px;

    .info-descriptions {
      margin: 15px 0;
    }
  }

  .native-info-descriptions {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* 两列等宽 */
    border: 1px solid #ebeef5; /* 外层边框，参考Element UI边框颜色 */
    border-radius: 4px;
    margin: 15px 0; /* 与原info-descriptions的margin一致 */
  }

  .info-entry {
    padding: 12px 10px; /* 内边距，参考el-descriptions-item的中等大小 */
    line-height: 1.5;
    border-bottom: 1px solid #ebeef5; /* 默认每个条目都有下边框 */
  }

  /* 第一列的条目添加右边框 */
  .info-entry:nth-child(odd) {
    border-right: 1px solid #ebeef5;
  }

  /* 移除最后一行的下边框 (假设总是4个条目，即两行) */
  .native-info-descriptions .info-entry:nth-last-child(-n + 2) {
    border-bottom: none;
  }
  /* 如果最后一行的列数少于总列数，且希望该行最后一个单元格没有右边框，则需要更复杂的nth-child逻辑或JS辅助 */
  /* 对于固定的2x2表格，下面这条可以移除最后一列(偶数项)中、位于最后一行的右边框，但对于当前需求不需要 */
  /* .native-info-descriptions .info-entry:nth-child(even):nth-last-child(-n+2) {
    border-right: none;
  } */

  .info-label {
    color: #909399; /* Element UI Descriptions Label 颜色 */
    font-weight: normal; /* Element UI Descriptions Label 字体粗细 */
    margin-right: 8px;
  }

  .info-value {
    color: #606266; /* Element UI Descriptions Content 颜色 */
  }

  .barcode-scan-section {
    margin: 20px 0;

    .progress-text {
      font-size: 14px;
      font-weight: bold;
    }
  }

  .barcode-list-section {
    margin: 20px 0;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      h3 {
        margin: 0;
        font-size: 16px;
        color: #409eff;
      }
    }
  }

  .action-buttons {
    display: flex;
    justify-content: space-around;
    margin-top: 30px;
  }

  .sub-material-scan-section {
    margin: 20px 0;
    padding: 10px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background-color: #fcfcfc;

    .el-form-item {
      margin-bottom: 15px; // 调整子物料项之间的间距
    }

    .el-input-group__append {
      .el-icon-success {
        font-size: 22px; // 增大成功图标
        vertical-align: middle;
      }
      .el-button,
      .el-tag {
        margin: 0 5px; // 给按钮和标签一些边距
      }
    }
  }
}

.unified-scan-and-material-status-section {
  margin: 20px 0;
  padding: 15px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .el-form-item {
    margin-bottom: 18px;
  }
  .el-divider__text {
    font-weight: bold;
    color: #409eff;
  }
}

.sub-materials-status-list {
  // display: flex; // 移动到下面的 .sub-material-form-flex-container
  // flex-wrap: wrap;
  // justify-content: space-between;
}

.sub-material-form-flex-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between; // 子项之间留有空隙
  align-items: flex-start; // 确保顶部对齐
}

.material-scan-status-item {
  background-color: #f8f9fa;
  padding: 8px 12px; // 减小内边距
  border-radius: 4px;
  margin-bottom: 8px; // 减小底部外边距
  border-left: 3px solid #409eff;
  width: calc(
    50% - 8px
  ); // 一行两个，减去一点间隙 (假设父容器有足够的padding或间隙由justify-content处理)
  box-sizing: border-box; // 确保 padding 和 border 不会增加宽度

  .el-form-item {
    margin-bottom: 5px !important;
  }

  .el-form-item__label .el-tag {
    line-height: 1.3;
    font-size: 12px;
    margin-bottom: 2px;
  }

  .el-input.is-readonly .el-input__inner {
    background-color: #fff;
    border-color: #dcdfe6;
    color: #333;
    font-weight: 500;
    padding-left: 8px;
    height: 28px;
    line-height: 28px;
  }
  .el-input.valid-input .el-input__inner {
    border-color: #67c23a;
    box-shadow: 0 0 0 1px rgba(103, 194, 58, 0.2);
  }
}

.input-with-status {
  display: flex;
  align-items: center;
  .el-input {
    flex-grow: 1;
    .el-input__inner {
      height: 28px;
      line-height: 28px;
    }
  }
}

.status-indicator {
  width: 24px;
  height: 24px;
  margin-left: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.3s ease;

  &.valid {
    background-color: #67c23a;
    color: white;
    box-shadow: 0 0 8px rgba(103, 194, 58, 0.5);
  }
  &:not(.valid):not(.not-required) {
    background-color: #f56c6c;
    color: white;
    box-shadow: 0 0 8px rgba(245, 108, 108, 0.5);
  }
  &.not-required {
    background-color: #e9ecef;
    color: #adb5bd;
    font-style: italic;
  }
}

@media screen and (max-width: 768px) {
  .pallet-assembly-container {
    padding: 10px;

    .action-buttons {
      flex-direction: column;

      .el-button {
        margin: 5px 0;
      }
    }
  }
}
</style> 