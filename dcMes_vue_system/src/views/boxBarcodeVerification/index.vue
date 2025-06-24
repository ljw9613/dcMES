<template>
  <div class="box-verification-container" v-loading="loading">
    <!-- 包装箱信息输入区域 -->
    <el-card class="box-input-card" v-if="!boxData">
      <div class="card-header">
        <span>
          <i class="el-icon-box"></i>
          包装箱条码校验
        </span>
      </div>

      <el-form :model="boxForm" label-width="120px" class="box-form">
        <div class="scan-input-section">
          <el-form-item label="包装箱条码:">
            <el-input
              v-model="boxForm.boxBarcode"
              placeholder="请扫描或输入包装箱条码"
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
                  查询
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
                包装箱信息
              </span>
              <el-button
                type="text"
                @click="resetVerification"
                style="color: #409eff"
              >
                <i class="el-icon-refresh"></i>
                重新查询
              </el-button>
            </div>

            <div class="box-details">
              <div class="detail-item">
                <span class="label">包装箱条码：</span>
                <span class="value">{{ boxData.boxBarcode }}</span>
              </div>
              <div class="detail-item">
                <span class="label">物料编码：</span>
                <span class="value">{{ boxData.materialCode }}</span>
              </div>
              <div class="detail-item">
                <span class="label">物料名称：</span>
                <span class="value">{{ boxData.materialName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">包装时间：</span>
                <span class="value">{{ formatDate(boxData.packingTime) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">产品数量：</span>
                <span class="value">{{ boxData.productBarcodes.length }}</span>
              </div>
            </div>

            <!-- 校验进度 -->
            <div class="verification-progress">
              <div class="progress-header">
                <span>校验进度</span>
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
                    <div class="stat-label">校验通过</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-item error">
                    <div class="stat-number">{{ verifiedErrorCount }}</div>
                    <div class="stat-label">校验失败</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-item pending">
                    <div class="stat-number">{{ pendingCount }}</div>
                    <div class="stat-label">待校验</div>
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
                产品条码扫描
              </span>
            </div>

            <div class="scan-input-section">
              <el-input
                v-model="scanInput"
                placeholder="请扫描产品条码进行校验"
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
                请扫描产品条码进行逐一校验
              </div>
              <div class="scan-tips success" v-else>
                <i class="el-icon-success"></i>
                所有产品条码校验完成！
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
                产品条码列表
              </span>
              <div class="header-actions">
                <el-button
                  type="text"
                  @click="exportResults"
                  v-if="verifiedCount > 0"
                >
                  <i class="el-icon-download"></i>
                  导出结果
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
                  label="序号"
                  width="60"
                  align="center"
                />

                <el-table-column
                  prop="barcode"
                  label="产品条码"
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

                <el-table-column prop="verifyTime" label="校验时间" width="180">
                  <template slot-scope="scope">
                    {{
                      scope.row.verifyTime
                        ? formatDate(scope.row.verifyTime)
                        : "-"
                    }}
                  </template>
                </el-table-column>

                <el-table-column label="操作" width="120" align="center">
                  <template slot-scope="scope">
                    <el-button
                      v-if="scope.row.status === 'error'"
                      type="text"
                      size="mini"
                      @click="retryVerification(scope.row)"
                    >
                      <i class="el-icon-refresh"></i>
                      重试
                    </el-button>
                    <el-button
                      v-if="scope.row.status === 'pending'"
                      type="text"
                      size="mini"
                      @click="skipVerification(scope.row)"
                    >
                      <i class="el-icon-close"></i>
                      跳过
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
import { tone } from "@/utils/tone.js";
import smcg from "@/assets/tone/smcg.mp3";
import tmyw from "@/assets/tone/tmyw.mp3";

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
        this.$message.warning("请输入包装箱条码");
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
          this.$message.error("未找到该包装箱条码对应的数据");
          this.popupType = "ng";
          this.showPopup = true;
          tone(tmyw);
          return;
        }

        // 提取包装箱信息和产品条码列表
        const boxProducts = response.data;
        const productBarcodes = boxProducts.map((item) => item.barcode);

        // 获取第一个产品的基本信息作为包装箱信息
        const firstProduct = boxProducts[0];

        this.boxData = {
          boxBarcode: boxBarcode,
          materialCode: firstProduct.materialCode || "未知",
          materialName: firstProduct.materialName || "未知",
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
          `成功加载包装箱数据，共${productBarcodes.length}个产品条码`
        );
        this.popupType = "ok";
        this.showPopup = true;
        tone(smcg);

        // 自动聚焦到扫描输入框
        this.$nextTick(() => {
          this.$refs.scanInput && this.$refs.scanInput.focus();
        });
      } catch (error) {
        console.error("查询包装箱失败:", error);
        this.$message.error("查询包装箱失败: " + error.message);
        this.popupType = "ng";
        this.showPopup = true;
        tone(tmyw);
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
            this.$message.warning("该产品条码已校验过");
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
              message: "校验通过",
            });
          }

          this.$message.success("校验通过！产品条码在包装箱中");
          this.popupType = "ok";
          this.showPopup = true;
          tone(smcg);
        } else {
          this.$message.error("校验失败！产品条码不在此包装箱中");
          this.popupType = "ng";
          this.showPopup = true;
          tone(tmyw);
        }
      } catch (error) {
        console.error("产品条码校验失败:", error);
        this.$message.error("校验过程发生错误");
        this.popupType = "ng";
        this.showPopup = true;
        tone(tmyw);
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
      this.$message.info("已重置该条码校验状态");
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
          message: "用户跳过校验",
        });
      }
      this.$message.warning("已跳过该条码校验");
    },

    // 导出校验结果
    exportResults() {
      // 准备导出数据
      const exportData = this.displayProductList.map((item, index) => ({
        序号: index + 1,
        产品条码: item.barcode,
        校验状态: this.getStatusText(item.status),
        校验时间: item.verifyTime ? this.formatDate(item.verifyTime) : "-",
        备注: item.message || "-",
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
      link.download = `包装箱校验结果_${this.boxData.boxBarcode}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      link.click();

      this.$message.success("校验结果已导出");
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
          return "校验通过";
        case "error":
          return "校验失败";
        case "pending":
          return "待校验";
        default:
          return "未知";
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