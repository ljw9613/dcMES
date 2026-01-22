<template>
  <div class="box-verification-container" v-loading="loading">
    <!-- 包装箱信息输入区域 -->
    <el-card class="box-input-card" v-if="!boxData">
      <div class="card-header">
        <span>
          <i class="el-icon-box"></i>
          {{ $t('boxBarcodeVerification.title') }}
        </span>
      </div>

      <el-form :model="boxForm" label-width="120px" class="box-form">
        <div class="scan-input-section">
          <el-form-item :label="$t('boxBarcodeVerification.form.boxBarcodeLabel')">
            <el-input
              v-model="boxForm.boxBarcode"
              :placeholder="$t('boxBarcodeVerification.form.boxBarcodePlaceholder')"
              @keyup.enter.native="handleBoxBarcodeInput"
              ref="boxInput"
              clearable
              size="large"
            >
              <template slot="prepend">
                <i class="el-icon-box"></i>
              </template>
              <template slot="append">
                <el-button @click="handleBoxBarcodeInput" type="primary">
                  {{ $t('boxBarcodeVerification.buttons.query') }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </div>
      </el-form>
    </el-card>

    <!-- 包装箱详情和校验区域 -->
    <template v-if="boxData">
      <el-row :gutter="20">
        <!-- 左侧：包装箱信息 -->
        <el-col :span="8">
          <el-card class="box-info-card">
            <div class="card-header">
              <span>
                <i class="el-icon-info"></i>
                {{ $t('boxBarcodeVerification.boxInfo.title') }}
              </span>
              <el-button
                type="text"
                @click="resetVerification"
                style="color: #409eff"
              >
                <i class="el-icon-refresh"></i>
                {{ $t('boxBarcodeVerification.buttons.requery') }}
              </el-button>
            </div>

            <div class="box-details">
              <div class="detail-item">
                <span class="label">{{ $t('boxBarcodeVerification.boxInfo.boxBarcode') }}：</span>
                <span class="value">{{ boxData.boxBarcode }}</span>
              </div>
              <div class="detail-item">
                <span class="label">{{ $t('boxBarcodeVerification.boxInfo.materialCode') }}：</span>
                <span class="value">{{ boxData.materialCode }}</span>
              </div>
              <div class="detail-item">
                <span class="label">{{ $t('boxBarcodeVerification.boxInfo.materialName') }}：</span>
                <span class="value">{{ boxData.materialName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">{{ $t('boxBarcodeVerification.boxInfo.packingTime') }}：</span>
                <span class="value">{{ formatDate(boxData.packingTime) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">{{ $t('boxBarcodeVerification.boxInfo.productCount') }}：</span>
                <span class="value">{{ boxData.productBarcodes.length }}</span>
              </div>
            </div>

            <!-- 校验进度 -->
            <div class="verification-progress">
              <div class="progress-header">
                <span>{{ $t('boxBarcodeVerification.progress.title') }}</span>
                <span class="progress-text">
                  {{ verifiedCount }}/{{ boxData.productBarcodes.length }}
                </span>
              </div>
              <el-progress
                :percentage="progressPercentage"
                :status="progressStatus"
              />
            </div>

            <!-- 校验统计 -->
            <div class="verification-stats">
              <el-row :gutter="10">
                <el-col :span="8">
                  <div class="stat-item success">
                    <div class="stat-number">{{ verifiedSuccessCount }}</div>
                    <div class="stat-label">{{ $t('boxBarcodeVerification.stats.verified') }}</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-item error">
                    <div class="stat-number">{{ verifiedErrorCount }}</div>
                    <div class="stat-label">{{ $t('boxBarcodeVerification.stats.failed') }}</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-item pending">
                    <div class="stat-number">{{ pendingCount }}</div>
                    <div class="stat-label">{{ $t('boxBarcodeVerification.stats.pending') }}</div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-card>

          <!-- 产品条码扫描区域 -->
          <el-card class="scan-card">
            <div class="card-header">
              <span>
                <i class="el-icon-camera"></i>
                {{ $t('boxBarcodeVerification.scan.title') }}
              </span>
            </div>

            <div class="scan-input-section">
              <el-input
                v-model="scanInput"
                :placeholder="$t('boxBarcodeVerification.scan.placeholder')"
                @keyup.enter.native="handleProductScan"
                ref="scanInput"
                clearable
                size="large"
                :disabled="allVerified"
              >
                <template slot="prepend">
                  <i class="el-icon-camera"></i>
                </template>
              </el-input>

              <div class="scan-tips" v-if="!allVerified">
                <i class="el-icon-info"></i>
                {{ $t('boxBarcodeVerification.scan.tips') }}
              </div>
              <div class="scan-tips success" v-else>
                <i class="el-icon-success"></i>
                {{ $t('boxBarcodeVerification.scan.allComplete') }}
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：产品条码列表 -->
        <el-col :span="16">
          <el-card class="product-list-card">
            <div class="card-header">
              <span>
                <i class="el-icon-document"></i>
                {{ $t('boxBarcodeVerification.productList.title') }}
              </span>
              <div class="header-actions">
                <el-button
                  type="text"
                  @click="exportResults"
                  v-if="verifiedCount > 0"
                >
                  <i class="el-icon-download"></i>
                  {{ $t('boxBarcodeVerification.buttons.export') }}
                </el-button>
              </div>
            </div>

            <div class="table-container">
              <el-table
                :data="displayProductList"
                height="600"
                stripe
                class="product-table"
              >
                <el-table-column
                  type="index"
                  :label="$t('boxBarcodeVerification.productList.index')"
                  width="60"
                  align="center"
                />

                <el-table-column
                  prop="barcode"
                  :label="$t('boxBarcodeVerification.productList.barcode')"
                  min-width="200"
                >
                  <template slot-scope="scope">
                    <div class="barcode-cell">
                      <span class="barcode-text">{{ scope.row.barcode }}</span>
                      <el-tag
                        :type="getStatusType(scope.row.status)"
                        size="mini"
                      >
                        {{ getStatusText(scope.row.status) }}
                      </el-tag>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column prop="verifyTime" :label="$t('boxBarcodeVerification.productList.verifyTime')" width="180">
                  <template slot-scope="scope">
                    {{
                      scope.row.verifyTime
                        ? formatDate(scope.row.verifyTime)
                        : "-"
                    }}
                  </template>
                </el-table-column>

                <el-table-column :label="$t('boxBarcodeVerification.productList.actions')" width="120" align="center">
                  <template slot-scope="scope">
                    <el-button
                      v-if="scope.row.status === 'error'"
                      type="text"
                      size="mini"
                      @click="retryVerification(scope.row)"
                    >
                      <i class="el-icon-refresh"></i>
                      {{ $t('boxBarcodeVerification.buttons.retry') }}
                    </el-button>
                    <el-button
                      v-if="scope.row.status === 'pending'"
                      type="text"
                      size="mini"
                      @click="skipVerification(scope.row)"
                    >
                      <i class="el-icon-close"></i>
                      {{ $t('boxBarcodeVerification.buttons.skip') }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 状态提示弹窗 -->
    <status-popup
      :visible.sync="showPopup"
      :type="popupType"
      :duration="1500"
    />
  </div>
</template>

<script>
import StatusPopup from "@/components/StatusPopup/index.vue";
import { getData } from "@/api/data";
import { playAudio, preloadAudioFiles } from "@/utils/audioI18n.js";

export default {
  name: "BoxBarcodeVerification",
  components: {
    StatusPopup,
  },
  data() {
    return {
      loading: false,
      boxForm: {
        boxBarcode: "",
      },
      boxData: null,
      scanInput: "",
      productList: [],
      showPopup: false,
      popupType: "",
      verificationResults: [], // 校验结果记录
    };
  },
  computed: {
    // 显示的产品列表（添加状态信息）
    displayProductList() {
      if (!this.boxData) return [];

      return this.boxData.productBarcodes.map((barcode) => {
        const result = this.verificationResults.find(
          (r) => r.barcode === barcode
        );
        return {
          barcode,
          status: result ? result.status : "pending",
          verifyTime: result ? result.verifyTime : null,
          message: result ? result.message : null,
        };
      });
    },

    // 已校验数量
    verifiedCount() {
      return this.verificationResults.filter((r) => r.status !== "pending")
        .length;
    },

    // 校验成功数量
    verifiedSuccessCount() {
      return this.verificationResults.filter((r) => r.status === "success")
        .length;
    },

    // 校验失败数量
    verifiedErrorCount() {
      return this.verificationResults.filter((r) => r.status === "error")
        .length;
    },

    // 待校验数量
    pendingCount() {
      if (!this.boxData) return 0;
      return this.boxData.productBarcodes.length - this.verifiedCount;
    },

    // 进度百分比
    progressPercentage() {
      if (!this.boxData || this.boxData.productBarcodes.length === 0) return 0;
      return Math.round(
        (this.verifiedCount / this.boxData.productBarcodes.length) * 100
      );
    },

    // 进度状态
    progressStatus() {
      if (this.verifiedErrorCount > 0) return "exception";
      if (this.allVerified) return "success";
      return null;
    },

    // 是否全部校验完成
    allVerified() {
      if (!this.boxData) return false;
      return this.verifiedCount === this.boxData.productBarcodes.length;
    },
  },
  methods: {
    // 处理包装箱条码输入
    async handleBoxBarcodeInput() {
      let boxBarcode = this.boxForm.boxBarcode.trim();
      if (!boxBarcode) {
        this.$message.warning(this.$t('boxBarcodeVerification.messages.pleaseInputBoxBarcode'));
        return;
      }

      // 如果条码包含","，则取第一个逗号前的部分作为条码
      if (boxBarcode.includes(",")) {
        boxBarcode = boxBarcode.split(",")[0];
      }

      this.loading = true;
      try {
        // 查询包装箱对应的产品条码
        const response = await getData("material_process_flow", {
          query: {
            processNodes: {
              $elemMatch: {
                barcode: boxBarcode,
                isPackingBox: true,
              },
            },
          },
        });

        if (!response.data || response.data.length === 0) {
          this.$message.error(this.$t('boxBarcodeVerification.messages.boxBarcodeNotFound'));
          this.popupType = "ng";
          this.showPopup = true;
          playAudio("tmyw");
          return;
        }

        // 提取包装箱信息和产品条码列表
        const boxProducts = response.data;
        const productBarcodes = boxProducts.map((item) => item.barcode);

        // 获取第一个产品的基本信息作为包装箱信息
        const firstProduct = boxProducts[0];

        this.boxData = {
          boxBarcode: boxBarcode,
          materialCode: firstProduct.materialCode || this.$t('boxBarcodeVerification.common.unknown'),
          materialName: firstProduct.materialName || this.$t('boxBarcodeVerification.common.unknown'),
          packingTime: firstProduct.updateAt || firstProduct.createAt,
          productBarcodes: productBarcodes,
        };

        // 初始化校验结果
        this.verificationResults = productBarcodes.map((barcode) => ({
          barcode,
          status: "pending",
          verifyTime: null,
          message: null,
        }));

        this.$message.success(
          this.$t('boxBarcodeVerification.messages.boxDataLoadSuccess', { count: productBarcodes.length })
        );
        this.popupType = "ok";
        this.showPopup = true;
        playAudio("smcg");

        // 自动聚焦到扫描输入框
        this.$nextTick(() => {
          this.$refs.scanInput && this.$refs.scanInput.focus();
        });
      } catch (error) {
        console.error("Box query failed:", error);
        this.$message.error(this.$t('boxBarcodeVerification.messages.boxQueryFailed') + ": " + error.message);
        this.popupType = "ng";
        this.showPopup = true;
        playAudio("tmyw");
      } finally {
        this.loading = false;
      }
    },

    // 处理产品条码扫描
    async handleProductScan() {
      const scannedBarcode = this.scanInput.trim();
      if (!scannedBarcode) return;

      try {
        // 检查是否在包装箱的产品列表中
        const isInBox = this.boxData.productBarcodes.includes(scannedBarcode);

        if (isInBox) {
          // 检查是否已经校验过
          const existingResult = this.verificationResults.find(
            (r) => r.barcode === scannedBarcode
          );
          if (existingResult && existingResult.status !== "pending") {
            this.$message.warning(this.$t('boxBarcodeVerification.messages.alreadyVerified'));
            this.scanInput = "";
            return;
          }

          // 更新校验结果
          const resultIndex = this.verificationResults.findIndex(
            (r) => r.barcode === scannedBarcode
          );
          if (resultIndex !== -1) {
            this.$set(this.verificationResults, resultIndex, {
              barcode: scannedBarcode,
              status: "success",
              verifyTime: new Date(),
              message: this.$t('boxBarcodeVerification.status.verifySuccess'),
            });
          }

          this.$message.success(this.$t('boxBarcodeVerification.messages.verifySuccess'));
          this.popupType = "ok";
          this.showPopup = true;
          playAudio("smcg");
        } else {
          this.$message.error(this.$t('boxBarcodeVerification.messages.verifyFailed'));
          this.popupType = "ng";
          this.showPopup = true;
          playAudio("tmyw");
        }
      } catch (error) {
        console.error("Product barcode verification failed:", error);
        this.$message.error(this.$t('boxBarcodeVerification.messages.verifyError'));
        this.popupType = "ng";
        this.showPopup = true;
        playAudio("tmyw");
      } finally {
        this.scanInput = "";
        // 重新聚焦
        this.$nextTick(() => {
          this.$refs.scanInput && this.$refs.scanInput.focus();
        });
      }
    },

    // 重置校验
    resetVerification() {
      this.boxData = null;
      this.verificationResults = [];
      this.boxForm.boxBarcode = "";
      this.scanInput = "";

      this.$nextTick(() => {
        this.$refs.boxInput && this.$refs.boxInput.focus();
      });
    },

    // 重试校验
    retryVerification(row) {
      const resultIndex = this.verificationResults.findIndex(
        (r) => r.barcode === row.barcode
      );
      if (resultIndex !== -1) {
        this.$set(this.verificationResults, resultIndex, {
          barcode: row.barcode,
          status: "pending",
          verifyTime: null,
          message: null,
        });
      }
      this.$message.info(this.$t('boxBarcodeVerification.messages.resetStatus'));
    },

    // 跳过校验
    skipVerification(row) {
      const resultIndex = this.verificationResults.findIndex(
        (r) => r.barcode === row.barcode
      );
      if (resultIndex !== -1) {
        this.$set(this.verificationResults, resultIndex, {
          barcode: row.barcode,
          status: "error",
          verifyTime: new Date(),
          message: this.$t('boxBarcodeVerification.status.userSkipped'),
        });
      }
      this.$message.warning(this.$t('boxBarcodeVerification.messages.skipVerify'));
    },

    // 导出校验结果
    exportResults() {
      // 准备导出数据
      const exportData = this.displayProductList.map((item, index) => ({
        [this.$t('boxBarcodeVerification.export.index')]: index + 1,
        [this.$t('boxBarcodeVerification.export.barcode')]: item.barcode,
        [this.$t('boxBarcodeVerification.export.status')]: this.getStatusText(item.status),
        [this.$t('boxBarcodeVerification.export.verifyTime')]: item.verifyTime ? this.formatDate(item.verifyTime) : "-",
        [this.$t('boxBarcodeVerification.export.remark')]: item.message || "-",
      }));

      // 创建CSV内容
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) => headers.map((h) => `"${row[h]}"`).join(",")),
      ].join("\n");

      // 下载文件
      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${this.$t('boxBarcodeVerification.export.filename')}_${this.boxData.boxBarcode}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      link.click();

      this.$message.success(this.$t('boxBarcodeVerification.messages.exportSuccess'));
    },

    // 获取状态类型
    getStatusType(status) {
      switch (status) {
        case "success":
          return "success";
        case "error":
          return "danger";
        case "pending":
          return "info";
        default:
          return "info";
      }
    },

    // 获取状态文本
    getStatusText(status) {
      switch (status) {
        case "success":
          return this.$t('boxBarcodeVerification.status.verifySuccess');
        case "error":
          return this.$t('boxBarcodeVerification.status.verifyFailed');
        case "pending":
          return this.$t('boxBarcodeVerification.status.pending');
        default:
          return this.$t('boxBarcodeVerification.common.unknown');
      }
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return "-";
      return new Date(date).toLocaleString("zh-CN");
    },
  },
  mounted() {
    // 页面加载时聚焦到包装箱输入框
    this.$refs.boxInput && this.$refs.boxInput.focus();
  },
};
</script>

<style scoped>
.box-verification-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.box-input-card,
.box-info-card,
.scan-card,
.product-list-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #ebeef5;
}

.card-header i {
  color: #409eff;
  margin-right: 8px;
}

.scan-input-section {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #409eff;
}

.scan-input-section .el-input >>> .el-input__inner {
  height: 50px;
  font-size: 18px;
}

.scan-tips {
  margin-top: 10px;
  padding: 8px 12px;
  background: #e1f3d8;
  border-radius: 4px;
  color: #67c23a;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.scan-tips i {
  margin-right: 5px;
}

.scan-tips.success {
  background: #f0f9ff;
  color: #67c23a;
}

/* 包装箱详情样式 */
.box-details {
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  color: #606266;
  font-weight: 500;
  margin-right: 10px;
  min-width: 80px;
  white-space: nowrap;
}

.value {
  color: #303133;
  flex: 1;
  word-break: break-all;
}

/* 校验进度样式 */
.verification-progress {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-text {
  font-weight: 600;
  color: #409eff;
}

/* 校验统计样式 */
.verification-stats {
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 10px;
  border-radius: 6px;
  background: #f8f9fa;
}

.stat-item.success {
  background: #f0f9ff;
  color: #67c23a;
}

.stat-item.error {
  background: #fef0f0;
  color: #f56c6c;
}

.stat-item.pending {
  background: #f4f4f5;
  color: #909399;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  margin-top: 5px;
}

/* 表格样式 */
.table-container {
  background: white;
  border-radius: 6px;
}

.product-table {
  width: 100%;
}

.barcode-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.barcode-text {
  font-family: monospace;
  font-size: 13px;
  flex: 1;
  margin-right: 10px;
  word-break: break-all;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .box-verification-container .el-col-8 {
    span: 24;
    margin-bottom: 20px;
  }

  .box-verification-container .el-col-16 {
    span: 24;
  }
}

/* 动画效果 */
.el-card {
  transition: all 0.3s ease;
}

.el-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.el-input >>> .el-input__inner:focus {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.el-button {
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-1px);
}
</style> 