<template>
  <div class="pallet-assembly-container">
    <el-card class="main-card">
      <div slot="header" class="card-header">
        <span>托盘组装操作</span>
      </div>

      <el-form
        :model="palletForm"
        ref="palletForm"
        label-width="100px"
        size="large"
      >
        <!-- 托盘编号输入区域 -->
        <el-form-item
          label="托盘编号"
          prop="palletCode"
          :rules="[
            { required: true, message: '请输入托盘编号', trigger: 'blur' },
          ]"
        >
          <el-input
            v-model="palletForm.palletCode"
            placeholder="请输入或扫描托盘编号"
            @keyup.enter.native="validatePalletCode"
            size="large"
          >
            <el-button slot="append" type="primary" @click="validatePalletCode">
              确认托盘
            </el-button>
          </el-input>
        </el-form-item>

        <div v-if="palletInfo" class="pallet-info-section">
          <!-- 托盘信息展示区域 -->
          <el-alert
            type="success"
            :title="'托盘编号: ' + palletInfo.palletCode"
            :description="
              '托盘状态: ' +
              (palletInfo.status === 'STACKED' ? '组托完成' : '组托中') +
              ' | 当前数量: ' +
              currentCount +
              ' | 总数量: ' +
              (palletInfo.totalQuantity || '未设置') +
              ' | 剩余: ' +
              remainingCapacity
            "
            show-icon
            :closable="false"
            style="margin-bottom: 15px"
          ></el-alert>

          <el-descriptions
            :column="2"
            border
            size="medium"
            class="info-descriptions"
          >
            <el-descriptions-item label="产线">
              {{ palletInfo.productLineName || "未设置" }}
            </el-descriptions-item>
            <el-descriptions-item label="物料信息">
              {{ materialInfo || "未设置" }}
            </el-descriptions-item>
            <el-descriptions-item label="订单信息">
              {{ palletInfo.saleOrderNo || "未设置" }}
            </el-descriptions-item>
            <el-descriptions-item label="工单信息">
              {{ palletInfo.workOrderNo || "未设置" }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 条码扫描区域 -->
          <div class="barcode-scan-section">
            <el-divider content-position="center">条码扫描</el-divider>

            <el-form-item
              label="条码"
              prop="barcode"
              :rules="[
                {
                  required: true,
                  message: '请输入或扫描条码',
                  trigger: 'blur',
                },
              ]"
            >
              <el-input
                ref="barcodeInput"
                v-model="palletForm.barcode"
                placeholder="请输入或扫描条码"
                @keyup.enter.native="handleAddBarcode"
                size="large"
              >
                <el-button
                  slot="append"
                  type="primary"
                  @click="handleAddBarcode"
                >
                  添加条码
                </el-button>
              </el-input>
            </el-form-item>

            <!-- 进度条 -->
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
              <h3>已扫描条码列表 ({{ scannedBarcodes.length }}条)</h3>
              <div class="section-actions">
                <el-button
                  type="danger"
                  size="mini"
                  @click="clearScannedBarcodes"
                  :disabled="scannedBarcodes.length === 0"
                >
                  清空列表
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
                label="序号"
                type="index"
                width="50"
                align="center"
              ></el-table-column>
              <el-table-column
                label="条码"
                prop="barcode"
                align="center"
              ></el-table-column>
              <el-table-column label="类型" align="center" width="120">
                <template slot-scope="scope">
                  <el-tag
                    size="medium"
                    :type="scope.row.type === 'single' ? 'primary' : 'success'"
                  >
                    {{ scope.row.type === "single" ? "单产品" : "包装箱" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="箱条码" align="center" width="150">
                <template slot-scope="scope">
                  <span v-if="scope.row.boxBarcode">{{
                    scope.row.boxBarcode
                  }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="扫描时间" align="center" width="180">
                <template slot-scope="scope">
                  {{ formatDate(scope.row.scanTime) }}
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 操作提示区域 -->
          <el-alert
            type="info"
            title="操作提示"
            description="1. 扫描托盘编号确认托盘信息 2. 扫描产品条码或包装箱条码 3. 系统自动提交，无需手动保存"
            show-icon
            :closable="false"
            style="margin-top: 20px"
          ></el-alert>

          <!-- 操作按钮区域 -->
          <div class="action-buttons">
            <el-button type="primary" size="large" @click="resetForm">
              <i class="el-icon-refresh-right"></i> 重置页面
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

export default {
  name: "PalletAssembly",
  data() {
    return {
      palletForm: {
        palletCode: "",
        barcode: "",
      },
      palletInfo: null,
      materialInfo: "",
      scannedBarcodes: [],
      lastScanTime: null,
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
  },
  methods: {
    /**
     * 重置表单
     */
    resetForm() {
      this.palletForm = {
        palletCode: "",
        barcode: "",
      };
      this.palletInfo = null;
      this.materialInfo = "";
      this.scannedBarcodes = [];
      this.lastScanTime = null;
    },

    /**
     * 清空已扫描条码列表
     */
    clearScannedBarcodes() {
      this.$confirm("确定要清空已扫描条码列表吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.scannedBarcodes = [];
          this.$message.success("已清空条码列表");
        })
        .catch(() => {});
    },

    /**
     * 验证托盘编号
     */
    async validatePalletCode() {
      if (!this.palletForm.palletCode.trim()) {
        this.$message.warning("请输入托盘编号");
        return;
      }

      const [palletCode, saleOrderNo, materialCode, quantity, lineCode] =
        this.palletForm.palletCode.split("#");

      try {
        const res = await getData("material_palletizing", {
          query: { palletCode: palletCode },
          populate: JSON.stringify([{ path: "productLineId" }]),
        });

        if (res.data && res.data.length > 0) {
          const pallet = res.data[0];

          // 检查托盘状态
          if (pallet.status === "STACKED") {
            this.$message.warning("该托盘已组托完成，不能继续添加条码");
            this.palletInfo = pallet;
            this.materialInfo = `${pallet.materialName || ""}${
              pallet.materialSpec ? " | " + pallet.materialSpec : ""
            }`;
            return;
          }

          this.palletInfo = pallet;
          this.materialInfo = `${pallet.materialName || ""}${
            pallet.materialSpec ? " | " + pallet.materialSpec : ""
          }`;

          // 更新已扫描条码列表
          this.updateScannedBarcodesList(pallet);

          // 自动聚焦到条码输入框
          this.$nextTick(() => {
            this.$refs.barcodeInput && this.$refs.barcodeInput.focus();
          });

          this.$message.success("托盘信息获取成功");
        } else {
          this.$message.error("未找到指定托盘");
          this.palletInfo = null;
        }
      } catch (error) {
        console.error("验证托盘编号失败:", error);
        this.$message.error("验证托盘编号失败");
      }
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

    /**
     * 处理添加条码
     */
    async handleAddBarcode() {
      if (!this.palletForm.barcode || !this.palletForm.barcode.trim()) {
        this.$message.warning("请输入条码");
        return;
      }

      if (!this.palletInfo) {
        this.$message.warning("请先验证托盘编号");
        return;
      }

      // 检查托盘状态
      if (this.palletInfo.status === "STACKED") {
        this.$message.warning("该托盘已组托完成，不能继续添加条码");
        return;
      }

      const cleanValue = this.palletForm.barcode.trim();

      // 检查是否已扫描过
      if (this.scannedBarcodes.some((item) => item.barcode === cleanValue)) {
        this.$message.warning("该条码已扫描");
        this.palletForm.barcode = "";
        this.$nextTick(() => {
          this.$refs.barcodeInput && this.$refs.barcodeInput.focus();
        });
        return;
      }

      try {
        // 检查是否为包装箱条码
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

        if (boxResponse.data && boxResponse.data.length > 0) {
          // 是包装箱条码
          // 整个箱子的条码列表
          const boxBarcodes = boxResponse.data.map((item) => item.barcode);

          // 检查托盘剩余容量
          const remainingCapacity = this.remainingCapacity;

          // 如果包装箱条码数量超出托盘剩余容量，则不允许入托
          if (boxBarcodes.length > remainingCapacity) {
            this.$message.error(
              `包装箱内条码数量(${boxBarcodes.length})超出托盘剩余容量(${remainingCapacity})，无法入托`
            );
            // 清空条码输入框并聚焦
            this.palletForm.barcode = "";
            this.$nextTick(() => {
              this.$refs.barcodeInput && this.$refs.barcodeInput.focus();
            });
            return;
          }

          // 设置加载提示
          const loading = this.$loading({
            lock: true,
            text: "处理包装箱条码中...",
            spinner: "el-icon-loading",
            background: "rgba(0, 0, 0, 0.7)",
          });

          try {
            // 成功添加的条码数量
            let successCount = 0;

            // 分别处理箱内每个条码
            for (const barcode of boxBarcodes) {
              let res = await addBarcodeToPallet({
                palletCode: this.palletInfo.palletCode,
                mainBarcode: barcode,
                boxBarcode: cleanValue,
                userId: this.$store.state.user.id,
              });
              if (res.code !== 200) {
                this.$message.error(res.message || "添加条码失败");
                return;
              } else {
                // 条码添加成功，记录到已扫描列表
                successCount++;
                this.scannedBarcodes.push({
                  barcode: barcode,
                  type: "box",
                  boxBarcode: cleanValue,
                  scanTime: new Date(),
                });
              }
            }

            // 添加成功，刷新托盘信息
            await this.validatePalletCode();
            this.$message.success(
              `包装箱条码处理成功，添加了${successCount}个条码`
            );

            // 如果托盘已满，显示完成提示
            if (this.palletInfo.status === "STACKED") {
              this.$message({
                message: "托盘已组托完成",
                type: "success",
                duration: 3000,
              });
            }
          } catch (error) {
            this.$message.error(error.message || "处理包装箱条码失败");
          } finally {
            loading.close();
          }
        } else {
          // 不是包装箱条码
          // 验证主条码在系统中是否存在
          const mainBarcodeRes = await getData("material_process_flow", {
            query: { barcode: cleanValue },
          });

          if (!mainBarcodeRes.data || mainBarcodeRes.data.length === 0) {
            this.$message.error("此条码在系统中不存在");
            return;
          }

          // 直接提交单个条码
          try {
            const res = await addBarcodeToPallet({
              palletCode: this.palletInfo.palletCode,
              mainBarcode: cleanValue,
              userId: this.$store.state.user.id,
            });

            if (res.code === 200) {
              // 条码添加成功，记录到已扫描列表
              this.scannedBarcodes.push({
                barcode: cleanValue,
                type: "single",
                scanTime: new Date(),
              });

              // 添加成功，刷新托盘信息
              await this.validatePalletCode();
              this.$message.success("条码添加成功");

              // 如果托盘已满，显示完成提示
              if (this.palletInfo.status === "STACKED") {
                this.$message({
                  message: "托盘已组托完成",
                  type: "success",
                  duration: 3000,
                });
              }
            } else {
              this.$message.error(res.message || "添加条码失败");
            }
          } catch (error) {
            this.$message.error(error.message || "添加条码失败");
          }
        }

        // 清空条码输入框并聚焦
        this.palletForm.barcode = "";
        this.$nextTick(() => {
          this.$refs.barcodeInput && this.$refs.barcodeInput.focus();
        });
      } catch (error) {
        console.error("处理条码失败:", error);
        this.$message.error(error.message || "处理条码失败");
      }
    },

    /**
     * 格式化日期
     */
    formatDate(date) {
      if (!date) return "未知";
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "无效日期";

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      const seconds = String(dateObj.getSeconds()).padStart(2, "0");

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    /**
     * 处理强制完成
     */
    async handleForceComplete() {
      if (!this.palletInfo) {
        this.$message.warning("请先验证托盘编号");
        return;
      }

      if (this.palletInfo.status === "STACKED") {
        this.$message.warning("托盘已组托完成");
        return;
      }

      if (this.currentCount === 0) {
        this.$message.warning("托盘内无条码，无法完成");
        return;
      }

      this.$confirm(
        "确认要强制完成该托盘的组托吗？此操作将修改当前数量为总数量。",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(async () => {
          try {
            const res = await handleForceCompletePallet({
              palletCode: this.palletInfo.palletCode,
              userId: this.$store.state.user.id,
            });

            if (res.code === 200) {
              this.$message.success("强制完成组托成功");
              // 刷新托盘信息
              await this.validatePalletCode();
            } else {
              this.$message.error(res.message || "强制完成组托失败");
            }
          } catch (error) {
            console.error("强制完成组托失败:", error);
            this.$message.error("强制完成组托失败");
          }
        })
        .catch(() => {
          this.$message.info("已取消操作");
        });
    },
  },
  mounted() {
    // 页面加载后自动聚焦到托盘编号输入框
    this.$nextTick(() => {
      const palletCodeInput = this.$refs.palletForm.$el.querySelector("input");
      palletCodeInput && palletCodeInput.focus();
    });
  },
};
</script>

<style lang="scss" scoped>
.pallet-assembly-container {
  padding: 20px;
  height: 100%;
  background-color: #f5f7fa;

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