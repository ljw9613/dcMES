<template>
  <el-dialog
    title="托盘抽检复位"
    :visible.sync="dialogVisible"
    width="50%"
    @closed="handleClose"
  >
    <div v-if="palletData">
      <el-descriptions title="托盘信息" :column="2" border>
        <el-descriptions-item label="托盘编号">{{
          palletData.palletCode
        }}</el-descriptions-item>
        <el-descriptions-item label="抽检状态">
          <el-tag :type="getInspectionStatusType(palletData.inspectionStatus)">
            {{ getInspectionStatusText(palletData.inspectionStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="物料信息">
          {{ palletData.materialName }}
          <el-tag size="mini" v-if="palletData.materialSpec">{{
            palletData.materialSpec
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="待复位数量">
          <el-progress
            :percentage="progressPercentage"
            :format="formatProgress"
          ></el-progress>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="center">条码扫描区</el-divider>

      <el-form :model="scanForm" ref="scanForm" label-width="100px">
        <el-form-item
          label="扫描条码"
          prop="barcode"
          :rules="[{ required: true, message: '请输入条码', trigger: 'blur' }]"
        >
          <el-input
            v-model="scanForm.barcode"
            placeholder="请扫描或输入条码"
            @keyup.enter.native="handleScan"
            ref="barcodeInput"
            :disabled="scanning"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleScan" :loading="scanning"
            >校验条码</el-button
          >
          <!-- <el-button type="success" @click="completeAllInspection" :disabled="!canCompleteAll">一键完成所有抽检中条码</el-button> -->
        </el-form-item>
      </el-form>

      <el-divider content-position="center">抽检中条码</el-divider>

      <el-table
        :data="barcodesTableData"
        border
        style="width: 100%"
        height="300px"
        :max-height="300"
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
        <el-table-column label="所属工单" align="center" width="120">
          <template slot-scope="scope">
            <el-tag size="mini" v-if="getBarcodeWorkOrderNo(scope.row)">
              {{ getBarcodeWorkOrderNo(scope.row) }}
            </el-tag>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="抽检状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="getInspectionStatusType(scope.row.inspectionStatus)">
              {{ getInspectionStatusText(scope.row.inspectionStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" align="center">
          <template slot-scope="scope">
            {{ formatDate(scope.row.updateTime || scope.row.scanTime) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-else class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">关闭</el-button>
      <el-button type="primary" @click="handleSubmit" :disabled="!isCompleted"
        >确认完成</el-button
      >
    </span>
  </el-dialog>
</template>

<script>
import { getData, updateData } from "@/api/data";

export default {
  name: "InspectionResetDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    pallet: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      dialogVisible: false,
      palletData: null,
      scanForm: {
        barcode: "",
      },
      scanning: false,
      barcodesTableData: [],
    };
  },
  computed: {
    progressPercentage() {
      if (
        !this.palletData ||
        !this.palletData.palletBarcodes ||
        !this.palletData.palletBarcodes.length
      ) {
        return 0;
      }

      // 计算抽检中和已抽检的总数
      const totalCount = this.palletData.palletBarcodes.filter(
        (item) =>
          item.inspectionStatus === "INSPECTING" ||
          item.inspectionStatus === "INSPECTED"
      ).length;

      // 计算已抽检完成的数量
      const inspectedCount = this.palletData.palletBarcodes.filter(
        (item) => item.inspectionStatus === "INSPECTED"
      ).length;

      return totalCount === 0
        ? 100
        : Math.floor((inspectedCount / totalCount) * 100);
    },
    isCompleted() {
      return this.progressPercentage === 100;
    },
    canCompleteAll() {
      return (
        this.barcodesTableData &&
        this.barcodesTableData.length > 0 &&
        this.barcodesTableData.some(
          (item) => item.inspectionStatus === "INSPECTING"
        )
      );
    },
  },
  watch: {
    visible(val) {
      this.dialogVisible = val;
      if (val && this.pallet) {
        this.fetchPalletData(this.pallet.palletCode);
      }
    },
    dialogVisible(val) {
      this.$emit("update:visible", val);
      if (val) {
        this.$nextTick(() => {
          if (this.$refs.barcodeInput) {
            this.$refs.barcodeInput.focus();
          }
        });
      }
    },
  },
  methods: {
    async fetchPalletData(palletCode) {
      try {
        const req = {
          query: { palletCode: palletCode },
          populate: JSON.stringify([{ path: "productLineId" }]),
        };

        const result = await getData("material_palletizing", req);
        if (result.data && result.data.length > 0) {
          this.palletData = result.data[0];
          this.barcodesTableData = this.palletData.palletBarcodes.filter(
            (item) =>
              item.inspectionStatus === "INSPECTING" ||
              item.inspectionStatus === "INSPECTED"
          );
        } else {
          this.$message.error("未找到托盘数据");
          this.dialogVisible = false;
        }
      } catch (error) {
        console.error("获取托盘数据失败:", error);
        this.$message.error("获取托盘数据失败");
        this.dialogVisible = false;
      }
    },
    formatDate(date) {
      if (!date) return "--";
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "--";
      }
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      const seconds = String(dateObj.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    formatProgress(percentage) {
      if (!this.palletData) return "0/0";

      // 计算抽检中和已抽检的总数
      const totalCount = this.palletData.palletBarcodes.filter(
        (item) =>
          item.inspectionStatus === "INSPECTING" ||
          item.inspectionStatus === "INSPECTED"
      ).length;

      // 计算已抽检完成的数量
      const inspectedCount = this.palletData.palletBarcodes.filter(
        (item) => item.inspectionStatus === "INSPECTED"
      ).length;

      return `${inspectedCount}/${totalCount}`;
    },
    getInspectionStatusText(status) {
      const statusMap = {
        INSPECTING: "抽检中",
        INSPECTED: "抽检完成",
        PENDING: "待抽检",
        undefined: "待抽检",
        null: "待抽检",
      };
      return statusMap[status] || "未知状态";
    },
    getInspectionStatusType(status) {
      const typeMap = {
        INSPECTING: "warning",
        INSPECTED: "success",
        PENDING: "info",
        undefined: "info",
        null: "info",
      };
      return typeMap[status] || "info";
    },
    async handleScan() {
      if (!this.scanForm.barcode) {
        this.$message.warning("请输入条码");
        return;
      }

      //是否为升级条码
      const preProductionResponse = await getData("preProductionBarcode", {
        query: {
          transformedPrintBarcode: this.scanForm.barcode.trim(),
        },
        select: {
          transformedPrintBarcode: 1,
          printBarcode: 1,
        },
        limit: 1,
      });

      if (preProductionResponse.data && preProductionResponse.data.length > 0) {
        console.log("升级条码:", preProductionResponse.data[0]);
        this.scanForm.barcode = preProductionResponse.data[0].printBarcode;
      }

      this.scanning = true;

      try {
        // 查找条码是否存在于托盘中并且状态为抽检中
        const barcodeIndex = this.barcodesTableData.findIndex(
          (item) => item.barcode === this.scanForm.barcode
        );

        if (barcodeIndex === -1) {
          this.$message.error("条码不属于当前托盘或不是抽检中状态");
          this.scanning = false;
          this.scanForm.barcode = "";
          this.$refs.barcodeInput.focus();
          return;
        }

        // 检查条码当前状态
        const barcodeItem = this.barcodesTableData[barcodeIndex];
        if (barcodeItem.inspectionStatus === "INSPECTED") {
          this.$message.info("该条码已完成抽检");
          this.scanning = false;
          this.scanForm.barcode = "";
          this.$refs.barcodeInput.focus();
          return;
        }

        // 更新条码抽检状态
        const now = new Date().toISOString();
        const updatePalletizingData = {
          query: {
            palletCode: this.palletData.palletCode,
            "palletBarcodes.barcode": this.scanForm.barcode,
          },
          update: {
            $set: {
              "palletBarcodes.$.inspectionStatus": "INSPECTED",
              "palletBarcodes.$.updateTime": now,
            },
          },
        };

        await updateData("material_palletizing", updatePalletizingData);

        // 更新托盘中对应条码的状态
        const palletBarcodeIndex = this.palletData.palletBarcodes.findIndex(
          (item) => item.barcode === this.scanForm.barcode
        );
        if (palletBarcodeIndex !== -1) {
          this.palletData.palletBarcodes[palletBarcodeIndex].inspectionStatus =
            "INSPECTED";
          this.palletData.palletBarcodes[palletBarcodeIndex].updateTime = now;
        }

        // 更新表格中对应条码的状态
        this.barcodesTableData[barcodeIndex].inspectionStatus = "INSPECTED";
        this.barcodesTableData[barcodeIndex].updateTime = now;

        this.$message.success("条码抽检完成");

        // 检查是否所有抽检中条码都已抽检完成
        const allInspectingCompleted = this.barcodesTableData.every(
          (item) => item.inspectionStatus === "INSPECTED"
        );

        if (allInspectingCompleted) {
          this.$message.success("所有抽检中条码已完成抽检");
          updateData("material_palletizing", {
            query: { palletCode: this.palletData.palletCode },
            update: { inspectionStatus: "INSPECTED" },
          });
        }
      } catch (error) {
        console.error("更新条码抽检状态失败:", error);
        this.$message.error("更新条码抽检状态失败");
      } finally {
        this.scanning = false;
        this.scanForm.barcode = "";
        this.$nextTick(() => {
          if (this.$refs.barcodeInput) {
            this.$refs.barcodeInput.focus();
          }
        });
      }
    },
    async updatePalletInspectionStatus() {
      try {
        const updatePalletData = {
          query: { palletCode: this.palletData.palletCode },
          update: { inspectionStatus: "INSPECTED" },
        };

        await updateData("material_palletizing", updatePalletData);
        this.palletData.inspectionStatus = "INSPECTED";
      } catch (error) {
        console.error("更新托盘抽检状态失败:", error);
        this.$message.error("更新托盘抽检状态失败");
      }
    },
    async completeAllInspection() {
      this.$confirm("确认要将所有抽检中的条码标记为已抽检吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          try {
            const now = new Date().toISOString();
            // 收集所有抽检中条码
            const inspectingBarcodes = this.barcodesTableData
              .filter((item) => item.inspectionStatus === "INSPECTING")
              .map((item) => item.barcode);

            if (inspectingBarcodes.length === 0) {
              this.$message.info("没有抽检中的条码需要处理");
              return;
            }

            // 更新所有抽检中的条码
            const updateAllBarcodesData = {
              query: {
                palletCode: this.palletData.palletCode,
                "palletBarcodes.barcode": { $in: inspectingBarcodes },
              },
              update: {
                $set: {
                  "palletBarcodes.$[elem].inspectionStatus": "INSPECTED",
                  "palletBarcodes.$[elem].updateTime": now,
                },
              },
              arrayFilters: [{ "elem.inspectionStatus": "INSPECTING" }],
            };

            await updateData("material_palletizing", updateAllBarcodesData);

            // 更新本地数据
            this.palletData.palletBarcodes.forEach((item) => {
              if (inspectingBarcodes.includes(item.barcode)) {
                item.inspectionStatus = "INSPECTED";
                item.updateTime = now;
              }
            });

            // 更新表格数据
            this.barcodesTableData.forEach((item) => {
              if (item.inspectionStatus === "INSPECTING") {
                item.inspectionStatus = "INSPECTED";
                item.updateTime = now;
              }
            });

            this.$message.success("所有抽检中条码已标记为抽检完成");
          } catch (error) {
            console.error("批量更新抽检状态失败:", error);
            this.$message.error("批量更新抽检状态失败");
          }
        })
        .catch(() => {
          this.$message.info("已取消操作");
        });
    },
    handleSubmit() {
      if (!this.isCompleted) {
        this.$message.warning("还有条码未完成抽检，请先完成所有抽检");
        return;
      }

      this.$emit("success");
      this.dialogVisible = false;
    },
    handleClose() {
      this.palletData = null;
      this.scanForm.barcode = "";
      this.barcodesTableData = [];
    },
    getBarcodeWorkOrderNo(barcodeItem) {
      if (!barcodeItem || !barcodeItem.productionPlanWorkOrderId) return null;

      // 如果有工单数组，从中查找匹配的工单
      if (this.palletData.workOrders && this.palletData.workOrders.length) {
        const workOrder = this.palletData.workOrders.find(
          (wo) =>
            wo.productionPlanWorkOrderId &&
            wo.productionPlanWorkOrderId ===
              barcodeItem.productionPlanWorkOrderId
        );

        if (workOrder) {
          return workOrder.workOrderNo;
        }
      }

      // 向后兼容：使用旧字段
      return this.palletData.workOrderNo;
    },
  },
};
</script>

<style scoped>
.loading-container {
  padding: 20px;
}
</style> 