<template>
  <el-dialog
    title="拆分托盘"
    :visible.sync="dialogVisible"
    width="80%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="form" ref="form" label-width="100px">
      <!-- 原托盘信息 -->
      <el-card class="box-card" style="margin-bottom: 20px">
        <div slot="header" class="clearfix">
          <span>原托盘信息</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="info-item">
              <span class="label">托盘编号:</span>
              <span class="value">{{ originalPallet.palletCode }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">销售订单号:</span>
              <span class="value">{{
                originalPallet.saleOrderNo || "--"
              }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">生产订单号:</span>
              <span class="value">{{
                originalPallet.productionOrderNo || "--"
              }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 15px">
          <el-col :span="8">
            <div class="info-item">
              <span class="label">工单号:</span>
              <div class="value">
                <template
                  v-if="
                    !originalPallet.workOrders ||
                    !originalPallet.workOrders.length
                  "
                >
                  {{ originalPallet.workOrderNo || "--" }}
                </template>
                <div v-else>
                  <div
                    v-for="(wo, index) in originalPallet.workOrders"
                    :key="index"
                    style="margin-bottom: 5px"
                  >
                    <el-tag size="mini" type="primary">{{
                      wo.workOrderNo || "--"
                    }}</el-tag>
                    <span v-if="wo.quantity" class="work-order-quantity"
                      >({{ wo.quantity }})</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">产线名称:</span>
              <span class="value">{{ originalPallet.productLineName }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">物料信息:</span>
              <span class="value">
                {{ originalPallet.materialName }}
                <el-tag size="mini" v-if="originalPallet.materialSpec">{{
                  originalPallet.materialSpec
                }}</el-tag>
              </span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 15px">
          <el-col :span="8">
            <div class="info-item">
              <span class="label">托盘条码数量:</span>
              <span class="value">{{ originalPallet.barcodeCount || 0 }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">箱数量:</span>
              <span class="value">{{ originalPallet.boxCount || 0 }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">总数量:</span>
              <span class="value">{{ originalPallet.totalQuantity || 0 }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 条码搜索区域 -->
      <el-card class="box-card" style="margin-bottom: 20px">
        <div slot="header" class="clearfix">
          <span>条码扫描</span>
          <!-- 添加包装箱校验提示 -->
          <div v-if="hasBoxItems" class="box-scan-hint">
            <i class="el-icon-warning" style="color: #e6a23c;"></i>
            <span style="color: #e6a23c; font-size: 12px; margin-left: 5px;">
              当前托盘包含包装箱，请扫描包装箱条码进行拆分
            </span>
          </div>
        </div>
        <div class="scan-area">
          <el-input
            v-model="scanCode"
            placeholder="请扫描条码"
            @keyup.enter.native="handleScan"
            :disabled="loading"
            clearable
          >
            <el-button
              slot="append"
              icon="el-icon-search"
              @click="handleScan"
              :loading="loading"
              >扫描</el-button
            >
          </el-input>
        </div>
      </el-card>

      <!-- 已选条码列表 -->
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span>已选条码 ({{ selectedBarcodes.length }}个)</span>
          <el-button
            type="text"
            style="float: right; padding: 3px 0"
            @click="clearSelectedBarcodes"
            >清空</el-button
          >
        </div>
        <el-table
          :data="selectedBarcodes"
          border
          style="width: 100%"
          height="300px"
        >
          <el-table-column
            label="条码"
            prop="barcode"
            align="center"
          ></el-table-column>
          <el-table-column label="条码类型" align="center">
            <template>
              <el-tag type="primary">主条码</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="所属工单" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" v-if="getBarcodeWorkOrderNo(scope.row)">
                {{ getBarcodeWorkOrderNo(scope.row) }}
              </el-tag>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="所属箱码" align="center">
            <template slot-scope="scope">
              {{ scope.row.boxBarcode || "--" }}
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="120">
            <template slot-scope="scope">
              <el-button
                type="text"
                style="color: red"
                @click="removeBarcode(scope.$index)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
        :loading="submitting"
        :disabled="!canSubmit"
        >确认拆分</el-button
      >
    </div>
  </el-dialog>
</template>

<script>
import { getData } from "@/api/data";
import { splitPallet } from "@/api/materialPalletizing";

export default {
  name: "SplitPalletDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    pallet: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      dialogVisible: false,
      originalPallet: {},
      scanCode: "",
      selectedBarcodes: [],
      form: {},
      loading: false,
      submitting: false,
    };
  },
  computed: {
    canSubmit() {
      return this.selectedBarcodes.length > 0;
    },
    hasBoxItems() {
      return this.originalPallet.boxItems && this.originalPallet.boxItems.length > 0;
    },
  },
  watch: {
    visible(val) {
      this.dialogVisible = val;
      if (val) {
        this.initData();
      }
    },
    pallet: {
      handler(val) {
        if (val && Object.keys(val).length > 0) {
          this.originalPallet = JSON.parse(JSON.stringify(val));
        }
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    initData() {
      this.scanCode = "";
      this.selectedBarcodes = [];
    },
    handleClose() {
      this.initData();
      this.$emit("update:visible", false);
    },
    async handleScan() {
      if (!this.scanCode.trim()) {
        this.$message.warning("请输入条码");
        return;
      }
      // 如果条码包含","，则取第一个逗号前的部分作为条码
      if (this.scanCode.includes(",")) {
        this.scanCode = this.scanCode.split(",")[0];
      }

      //是否为升级条码
      const preProductionResponse = await getData("preProductionBarcode", {
        query: {
          transformedPrintBarcode: this.scanCode.trim(),
        },
        select: {
          transformedPrintBarcode: 1,
          printBarcode: 1,
        },
        limit: 1,
      });

      if (preProductionResponse.data && preProductionResponse.data.length > 0) {
        console.log("升级条码:", preProductionResponse.data[0]);
        this.scanCode = preProductionResponse.data[0].printBarcode;
      }

      this.loading = true;

      // 检查是否在原托盘的条码中
      const foundInPalletBarcodes = this.originalPallet.palletBarcodes.find(
        (item) => item.barcode === this.scanCode.trim()
      );
      const foundInBoxItems = this.originalPallet.boxItems.find(
        (item) => item.boxBarcode === this.scanCode.trim()
      );

      // 包装箱校验：如果托盘包含包装箱，则必须扫描包装箱条码
      if (this.hasBoxItems && foundInPalletBarcodes && !foundInBoxItems) {
        // 检查该条码是否属于某个包装箱
        let belongsToBox = false;
        for (const box of this.originalPallet.boxItems) {
          if (
            box.boxBarcodes &&
            box.boxBarcodes.some((bb) => bb.barcode === this.scanCode.trim())
          ) {
            belongsToBox = true;
            break;
          }
        }
        
        if (belongsToBox) {
          this.$message.error("当前托盘包含包装箱，请扫描对应的包装箱条码，不能直接扫描单个条码");
          this.scanCode = "";
          this.loading = false;
          return;
        }
      }

      if (foundInPalletBarcodes) {
        // 检查是否已经在已选条码中
        const alreadySelected = this.selectedBarcodes.some(
          (item) => item.barcode === this.scanCode.trim()
        );
        if (alreadySelected) {
          this.$message.warning("该条码已经添加");
        } else {
          // 检查是否属于某个箱
          let boxBarcode = null;
          for (const box of this.originalPallet.boxItems) {
            if (
              box.boxBarcodes &&
              box.boxBarcodes.some((bb) => bb.barcode === this.scanCode.trim())
            ) {
              boxBarcode = box.boxBarcode;
              break;
            }
          }

          const originalBarcode = this.originalPallet.palletBarcodes.find(
            (item) => item.barcode === this.scanCode.trim()
          );

          this.selectedBarcodes.push({
            barcode: this.scanCode.trim(),
            barcodeType: "MAIN",
            boxBarcode: boxBarcode,
            productionPlanWorkOrderId:
              originalBarcode.productionPlanWorkOrderId || null,
          });
          this.$message.success("条码添加成功");
        }
      } else if (foundInBoxItems) {
        // 如果是箱条码，检查是否已经选择了该箱内的条码
        const boxBarcodesAlreadySelected = foundInBoxItems.boxBarcodes.filter(
          (boxBarcode) =>
            this.selectedBarcodes.some(
              (sb) => sb.barcode === boxBarcode.barcode
            )
        );

        if (boxBarcodesAlreadySelected.length > 0) {
          this.$message.warning("该箱内的部分条码已经添加，请先清除相关条码");
        } else {
          // 只添加箱内所有条码，不添加箱条码本身
          if (
            foundInBoxItems.boxBarcodes &&
            foundInBoxItems.boxBarcodes.length > 0
          ) {
            foundInBoxItems.boxBarcodes.forEach((boxBarcode) => {
              if (
                !this.selectedBarcodes.some(
                  (sb) => sb.barcode === boxBarcode.barcode
                )
              ) {
                this.selectedBarcodes.push({
                  barcode: boxBarcode.barcode,
                  barcodeType: "MAIN",
                  boxBarcode: this.scanCode.trim(),
                  productionPlanWorkOrderId:
                    boxBarcode.productionPlanWorkOrderId || null,
                });
              }
            });
          }

          this.$message.success(
            `箱内 ${
              foundInBoxItems.boxBarcodes
                ? foundInBoxItems.boxBarcodes.length
                : 0
            } 个条码添加成功`
          );
        }
      } else {
        this.$message.error("未找到该条码，请确认条码是否属于当前托盘");
      }

      this.scanCode = "";
      this.loading = false;
    },
    removeBarcode(index) {
      const barcode = this.selectedBarcodes[index];

      // 如果删除的是箱内条码，检查是否需要删除该箱的所有条码
      if (barcode.boxBarcode) {
        // 获取同一箱子的所有条码
        const sameBoxBarcodes = this.selectedBarcodes.filter(
          (item) => item.boxBarcode === barcode.boxBarcode
        );

        if (sameBoxBarcodes.length > 1) {
          // 如果同一箱子有多个条码，询问是否删除整箱
          this.$confirm(
            `该条码属于箱 ${barcode.boxBarcode}，是否删除整箱所有条码？`,
            "提示",
            {
              confirmButtonText: "删除整箱",
              cancelButtonText: "仅删除此条码",
              type: "warning",
            }
          )
            .then(() => {
              // 删除整箱条码
              this.selectedBarcodes = this.selectedBarcodes.filter(
                (item) => item.boxBarcode !== barcode.boxBarcode
              );
              this.$message.success("已删除整箱条码");
            })
            .catch(() => {
              // 仅删除单个条码
              this.selectedBarcodes.splice(index, 1);
              this.$message.success("已删除单个条码");
            });
        } else {
          // 如果该箱只有一个条码，直接删除
          this.selectedBarcodes.splice(index, 1);
          this.$message.success("已删除条码");
        }
      } else {
        // 非箱内条码，直接删除
        this.selectedBarcodes.splice(index, 1);
        this.$message.success("已删除条码");
      }
    },
    clearSelectedBarcodes() {
      this.$confirm("确认清空所有已选条码?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.selectedBarcodes = [];
          this.$message.success("已清空所有已选条码");
        })
        .catch(() => {});
    },
    async handleSubmit() {
      if (this.selectedBarcodes.length === 0) {
        this.$message.warning("请至少选择一个条码");
        return;
      }

      // 包装箱校验：如果托盘包含包装箱，确保所有选中的条码都是通过扫描包装箱条码添加的
      if (this.hasBoxItems) {
        const hasIndividualBarcodes = this.selectedBarcodes.some(
          (item) => !item.boxBarcode
        );
        
        if (hasIndividualBarcodes) {
          this.$message.error("当前托盘包含包装箱，必须通过扫描包装箱条码进行拆分，请清空当前选择并重新扫描包装箱条码");
          return;
        }
      }

      this.submitting = true;
      try {
        const payload = {
          originalPalletCode: this.originalPallet.palletCode,
          barcodes: this.selectedBarcodes.map((item) => item.barcode),
          userId: this.$store.state.user.id,
        };

        const response = await splitPallet(payload);

        if (response.success) {
          this.$message.success("托盘拆分成功");
          this.dialogVisible = false;
          this.$emit("success");
        } else {
          this.$message.error(response.message || "托盘拆分失败");
        }
      } catch (error) {
        console.error("拆分托盘失败:", error);
        this.$message.error("拆分托盘失败");
      } finally {
        this.submitting = false;
      }
    },
    getBarcodeWorkOrderNo(barcodeItem) {
      if (!barcodeItem || !barcodeItem.barcode) return null;

      // 从原托盘中查找此条码所属的工单
      if (this.originalPallet.palletBarcodes) {
        const originalBarcode = this.originalPallet.palletBarcodes.find(
          (pb) => pb.barcode === barcodeItem.barcode
        );

        if (
          originalBarcode &&
          originalBarcode.productionPlanWorkOrderId &&
          this.originalPallet.workOrders
        ) {
          const workOrder = this.originalPallet.workOrders.find(
            (wo) =>
              wo.productionPlanWorkOrderId &&
              wo.productionPlanWorkOrderId ===
                originalBarcode.productionPlanWorkOrderId
          );

          if (workOrder) {
            return workOrder.workOrderNo;
          }
        }
      }

      // 向后兼容：使用旧字段
      return this.originalPallet.workOrderNo;
    },
  },
};
</script>

<style scoped>
.scan-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.label {
  color: #606266;
  font-weight: bold;
  margin-right: 8px;
  min-width: 100px;
}

.value {
  color: #333;
  flex: 1;
}

.hint {
  color: #909399;
  font-size: 12px;
  margin-left: 10px;
}

.work-order-quantity {
  margin-left: 5px;
  color: #666;
  font-size: 12px;
}

.box-scan-hint {
  display: flex;
  align-items: center;
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #fdf6ec;
  border: 1px solid #f5dab1;
  border-radius: 4px;
}
</style> 