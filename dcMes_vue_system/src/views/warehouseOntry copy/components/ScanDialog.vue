<template>
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    width="800px"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <div class="scan-container">
      <el-form v-if="entryInfo">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售单号">
              <el-input
                v-model="entryInfo.saleOrderNo"
                @blur="saleOrderNoInput"
                @keyup.enter.native="saleOrderNoInput"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销售数量">
              <el-input
                v-model="entryInfo.saleNumber"
                type="number"
                readonly
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称">
              <el-input v-model="entryInfo.materialName" readonly></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品型号">
              <el-input v-model="entryInfo.materialSpec" readonly></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="货柜号" required>
              <el-input
                v-model="entryInfo.HuoGuiCode"
                :readonly="entryInfo._id && entryInfo.HuoGuiCode"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发票号" required>
              <el-input
                v-model="entryInfo.FaQIaoNo"
                :readonly="entryInfo._id && entryInfo.FaQIaoNo"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工单白名单">
              <zr-select
                v-model="entryInfo.workOrderWhitelist"
                collection="production_plan_work_order"
                :search-fields="[
                  'workOrderNo',
                  'productionOrderNo',
                  'saleOrderNo',
                ]"
                label-key="workOrderNo"
                value-key="workOrderNo"
                :multiple="true"
                placeholder="请选择工单白名单"
                clearable
                style="width: 100%"
                @select="handleWorkOrderSelect"
                @clear="handleWorkOrderSelect([])"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.workOrderNo }}</span>
                      <el-tag size="mini" type="info">{{
                        item.productionOrderNo
                      }}</el-tag>
                    </div>
                    <div class="option-detail">
                      <small>销售单号: {{ item.saleOrderNo }}</small>
                      <small>物料: {{ item.materialName }}</small>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出库模式">
              <el-radio-group v-model="entryInfo.outboundMode">
                <el-radio label="SINGLE">单一产品出库</el-radio>
                <el-radio label="PALLET">整托盘出库</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="应出库数量" required>
              <el-input
                v-model="entryInfo.outboundQuantity"
                type="number"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="已出库数量">
              <el-input
                v-model="entryInfo.outNumber"
                readonly
                type="number"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <!-- 扫码输入区域 -->
      <el-form
        :model="scanForm"
        ref="scanForm"
        :rules="rules"
        v-if="!showProductScan && entryInfo.outboundMode !== 'SINGLE'"
      >
        <el-form-item prop="barcode">
          <el-input
            v-model="scanForm.barcode"
            placeholder="请扫描托盘条码"
            @keyup.enter.native="handleScanInput"
            ref="scanInput"
            clearable
          >
            <template slot="append">
              <el-button @click="handleScanInput">确认</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <!-- 单一产品出库模式下的产品条码输入框 -->
      <el-form
        :model="productScanForm"
        ref="productScanForm"
        :rules="productScanRules"
        v-if="!showProductScan && entryInfo.outboundMode === 'SINGLE'"
      >
        <el-form-item prop="barcode">
          <el-input
            v-model="productScanForm.barcode"
            placeholder="请扫描产品条码"
            @keyup.enter.native="handleProductScan"
            ref="productScanInput"
            clearable
          >
            <template slot="append">
              <el-button @click="handleProductScan">确认</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <!-- 在扫描记录列表上方添加出库单信息卡片 -->
      <div class="entry-info" v-if="entryInfo.entryNo">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>出库单信息</span>
          </div>

          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>出库单号：</label>
                <span>{{ entryInfo.entryNo }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>生产订单：</label>
                <span>{{ entryInfo.productionOrderNo }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>销售订单：</label>
                <span>{{ entryInfo.saleOrderNo }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>物料名称：</label>
                <span>{{ entryInfo.materialName }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>规格型号：</label>
                <span>{{ entryInfo.materialSpec }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>完成进度：</label>
                <el-progress
                  :percentage="entryInfo.progress"
                  :status="entryInfo.progress >= 100 ? 'success' : ''"
                />
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>应出库数量</label>
                <span>{{ entryInfo.outboundQuantity }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>已出库数量：</label>
                <span>{{ entryInfo.outNumber }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>托盘数量：</label>
                <span>{{ entryInfo.palletCount }}</span>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 扫描记录列表 -->
      <div class="scan-list" v-if="entryInfo.entryItems.length > 0">
        <el-table :data="entryInfo.entryItems" border style="width: 100%">
          <el-table-column label="托盘编号" prop="palletCode" align="center" />
          <el-table-column label="销售订单" prop="saleOrderNo" align="center" />
          <el-table-column
            label="物料编码"
            prop="materialCode"
            align="center"
          />
          <el-table-column label="数量" prop="quantity" align="center" />
          <el-table-column label="产线" prop="lineCode" align="center" />
          <el-table-column label="扫描时间" align="center">
            <template slot-scope="scope">
              {{ formatDateTime(scope.row.scanTime) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 产品条码扫码校验组件 -->
      <div class="product-scan" v-if="showProductScan && currentPallet">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>产品条码扫码校验</span>
            <el-button
              style="float: right; padding: 3px 0"
              type="text"
              @click="handleCompleteProductScan"
              >完成校验</el-button
            >
          </div>
          <div class="product-info">
            <div class="info-item">
              <label>托盘编号：</label>
              <span>{{ currentPallet.palletCode }}</span>
            </div>
            <div class="info-item">
              <label>物料名称：</label>
              <span>{{ currentPallet.materialName }}</span>
            </div>
            <div class="info-item">
              <label>总数量：</label>
              <span>{{ currentPallet.totalQuantity }}</span>
            </div>
            <div class="info-item">
              <label>已扫描：</label>
              <span
                >{{ scannedProducts.length }}/{{
                  currentPallet.totalQuantity
                }}</span
              >
            </div>
          </div>

          <el-form
            :model="productScanForm"
            ref="productScanForm"
            :rules="productScanRules"
          >
            <el-form-item prop="barcode">
              <el-input
                v-model="productScanForm.barcode"
                placeholder="请扫描产品条码"
                @keyup.enter.native="handleProductScan"
                ref="productScanInput"
                clearable
              >
                <template slot="append">
                  <el-button @click="handleProductScan">确认</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>

          <!-- 产品条码列表tab -->
          <el-tabs v-model="activeTab" class="barcode-tabs">
            <el-tab-pane label="待核验" name="pending">
              <el-table
                :data="pendingBarcodes"
                border
                style="width: 100%; margin-top: 20px"
              >
                <el-table-column
                  label="产品条码"
                  prop="barcode"
                  align="center"
                />
                <el-table-column label="核验状态" align="center">
                  <template slot-scope="scope">
                    <el-tag
                      :type="
                        getInspectionStatusType(scope.row.inspectionStatus)
                      "
                    >
                      {{ getInspectionStatusText(scope.row.inspectionStatus) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <!-- <el-table-column label="扫描时间" align="center">
                  <template slot-scope="scope">
                    {{ formatDateTime(scope.row.scanTime) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" align="center">
                  <template slot-scope="scope">
                    <el-button type="text" @click="handleDeleteProductScan(scope.row)">删除</el-button>
                  </template>
                </el-table-column> -->
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="已核验" name="verified">
              <el-table
                :data="verifiedBarcodes"
                border
                style="width: 100%; margin-top: 20px"
              >
                <el-table-column
                  label="产品条码"
                  prop="barcode"
                  align="center"
                />
                <el-table-column label="核验状态" align="center">
                  <template slot-scope="scope">
                    <el-tag
                      :type="
                        getInspectionStatusType(scope.row.inspectionStatus)
                      "
                    >
                      {{ getInspectionStatusText(scope.row.inspectionStatus) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <!-- <el-table-column label="扫描时间" align="center">
                  <template slot-scope="scope">
                    {{ formatDateTime(scope.row.scanTime) }}
                  </template>
                </el-table-column> -->
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button
        type="primary"
        @click="handleComplete"
        :disabled="!entryInfo.entryItems.length"
      >
        完成出库
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { scanPalletOn, deletePallet, submitProductBarcode } from "@/api/warehouse/entry";
import { getData, addData, updateData, removeData } from "@/api/data";
import { number } from "echarts/lib/export";
export default {
  name: "ScanDialog",
  props: {
    scanData: {
      type: Object,
      default: () => ({}),
    },
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "托盘扫码出库",
    },
    placeholder: {
      type: String,
      default: "请扫描托盘条码",
    },
  },
  data() {
    return {
      dialogVisible: false,
      scanForm: {
        barcode: "",
      },
      rules: {
        barcode: [
          { required: true, message: "请输入或扫描条码", trigger: "blur" },
        ],
      },
      scanRecords: [],
      entryInfo: null,
      workOrderOptions: [],
      workOrderLoading: false,
      // 新增产品扫码相关数据
      showProductScan: false,
      currentPallet: null,
      scannedProducts: [],
      productScanForm: {
        barcode: "",
      },
      productScanRules: {
        barcode: [
          { required: true, message: "请输入或扫描产品条码", trigger: "blur" },
        ],
      },
      activeTab: "pending", // 新增tab激活状态
    };
  },
  watch: {
    visible(val) {
      this.dialogVisible = val;
      if (val) {
        this.initEntryInfo();
        this.$nextTick(() => {
          this.$refs.scanInput.focus();
        });
      }
    },
    dialogVisible(val) {
      this.$emit("update:visible", val);
      if (!val) {
        this.resetForm();
      }
    },
    scanData: {
      handler(newVal) {
        this.initEntryInfo();
      },
      immediate: true,
    },
    // 监听出库模式变化
    "entryInfo.outboundMode": {
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          // 如果从单一产品出库切换到整托盘出库
          if (oldVal === "SINGLE" && newVal === "PALLET") {
            this.showProductScan = false;
            this.currentPallet = null;
            this.scannedProducts = [];
            this.$nextTick(() => {
              this.$refs.scanInput.focus();
            });
          }
          // 如果从整托盘出库切换到单一产品出库，且当前有托盘数据
          else if (
            oldVal === "PALLET" &&
            newVal === "SINGLE" &&
            this.entryInfo.entryItems.length > 0
          ) {
            const currentPallet =
              this.entryInfo.entryItems[this.entryInfo.entryItems.length - 1];
            this.showProductScan = true;
            this.currentPallet = {
              palletCode: currentPallet.palletCode,
              materialName: currentPallet.materialName,
              totalQuantity: currentPallet.quantity,
              palletBarcodes: [],
            };
            this.$nextTick(() => {
              this.$refs.productScanInput.focus();
            });
          }
        }
      },
    },
  },
  methods: {
    async initEntryInfo() {
      console.log(this.scanData, "this.scanData");
      if (this.scanData) {
        this.entryInfo = {
          ...this.scanData,
          workOrderWhitelist: [],
          outboundMode: this.scanData.outboundMode || "PALLET",
        };
      }
    },
    async handleScanInput() {
      try {
        await this.$refs.scanForm.validate();
        const barcode = this.scanForm.barcode.trim();
        console.log(barcode, "barcode");

        // 发送扫描事件到父组件
        const success = await this.$emit("scan", barcode);
        console.log("success", success);
        if (success) {
          // 解析条码信息
          const [palletCode, saleOrderNo, materialCode, quantity, lineCode] =
            barcode.split("#");
          console.log(palletCode, "palletCode");

          // 调用托盘出库API
          const response = await scanPalletOn({
            palletCode,
            userId: this.$store.state.user.id,
            entryInfo: {
              ...this.entryInfo,
              workOrderWhitelist: this.entryInfo.workOrderWhitelist.map(
                (item) => ({
                  workOrderNo: item.workOrderNo,
                  workOrderId: item._id,
                  productionOrderNo: item.productionOrderNo,
                })
              ),
            },
          });

          // 更新出库单信息
          if (response.data) {
            this.entryInfo = response.data;

            console.log(this.entryInfo, "this.entryInfo");

            // 根据出库模式处理不同的逻辑
            if (
              this.entryInfo.outboundMode === "SINGLE" &&
              response.code === 200
            ) {
              // 获取完整的托盘数据
              const palletResponse = await getData("material_palletizing", {
                query: { palletCode },
                populate: JSON.stringify([
                  { path: "productLineId", select: "lineCode" },
                  { path: "productionOrderId", select: "FWorkShopID_FName" },
                ]),
              });

              if (palletResponse.data && palletResponse.data.length > 0) {
                const palletData = palletResponse.data[0];
                this.showProductScan = true;
                this.currentPallet = {
                  palletCode: palletData.palletCode,
                  materialName: palletData.materialName,
                  totalQuantity: palletData.totalQuantity,
                  palletBarcodes: palletData.palletBarcodes.map((item) => ({
                    barcode: item.barcode,
                    scanTime: item.scanTime,
                    inspectionStatus: item.inspectionStatus,
                  })),
                };
                this.$nextTick(() => {
                  this.$refs.productScanInput.focus();
                });
              } else {
                this.$message.error("获取托盘数据失败");
              }
            } else if (this.entryInfo.outboundMode === "PALLET") {
              // 整托盘出库模式，直接清空输入框
              this.scanForm.barcode = "";
              this.$nextTick(() => {
                this.$refs.scanInput.focus();
              });
            }
          }

          if (response.code !== 200) {
            this.$message.error(response.message);
            return;
          }

          if (response.mode === "init") {
            this.$message.success("出库单初始化成功,请扫描产品条码");
          } else {
            this.$message.success("扫码出库成功");
          }
        }
      } catch (error) {
        console.error("扫描失败:", error);
      }
    },
    async saleOrderNoInput() {
      // 调用托盘出库API
      const response = await scanPalletOn({
        palletCode: null,
        userId: this.$store.state.user.id,
        entryInfo: this.entryInfo,
      });

      // 更新出库单信息
      if (response.data) {
        this.entryInfo = response.data;
      }

      if (response.code !== 200) {
        this.$message.error(response.message);
        return;
      }

      this.$message.success("扫码出库成功");

      // 添加到扫描记录
      this.scanRecords.unshift({
        palletCode,
        saleOrderNo,
        materialCode,
        quantity,
        lineCode,
        scanTime: new Date(),
      });

      // 清空输入框
      this.scanForm.barcode = "";
    },
    async handleComplete() {
      try {
        await this.$emit(
          "complete",
          this.scanRecords.map((record) => record.palletCode)
        );
        this.dialogVisible = false;
      } catch (error) {
        console.error("完成出库失败:", error);
      }
    },

    handleClose() {
      this.$emit("update:visible", false);
      this.resetForm();
    },

    resetForm() {
      this.scanForm.barcode = "";
      this.scanRecords = [];
      if (this.$refs.scanForm) {
        this.$refs.scanForm.resetFields();
      }
    },

    formatDateTime(date) {
      return new Date(date).toLocaleString();
    },

    async searchWorkOrders(query) {
      if (query !== "") {
        this.workOrderLoading = true;
        try {
          // 调用后端接口搜索工单
          const response = await searchWorkOrders({ keyword: query });
          this.workOrderOptions = response.data;
        } catch (error) {
          console.error("搜索工单失败:", error);
        } finally {
          this.workOrderLoading = false;
        }
      } else {
        this.workOrderOptions = [];
      }
    },

    handleWorkOrderSelect(selected) {
      if (selected.length > 1) {
        this.$message.warning("白名单只能设置一个工单");
        return;
      }
      console.log(selected, "selected");
      this.entryInfo.workOrderWhitelist = selected.map((item) => ({
        workOrderNo: item.workOrderNo,
        workOrderId: item._id,
      }));
    },

    // 处理产品条码扫描
    async handleProductScan() {
      try {
        await this.$refs.productScanForm.validate();
        const barcode = this.productScanForm.barcode.trim();

        // 调用新的产品条码提交接口
        const response = await submitProductBarcode({
          productBarcode: barcode,
          userId: this.$store.state.user.id,
          entryInfo: {
            ...this.entryInfo,
            workOrderWhitelist: this.entryInfo.workOrderWhitelist.map(
              (item) => ({
                workOrderNo: item.workOrderNo,
                workOrderId: item._id,
                productionOrderNo: item.productionOrderNo,
              })
            ),
            outboundMode: this.entryInfo.outboundMode,
          },
        });

        if (response.code !== 200) {
          this.$message.error(response.message);
          return;
        }

        // 更新出库单信息
        if (response.data) {
          this.entryInfo = {
            ...response.data.entry,
            outboundMode: this.entryInfo.outboundMode,
          };

          // 更新当前托盘信息
          if (response.data.pallet) {
            this.currentPallet = {
              ...this.currentPallet,
              palletBarcodes: response.data.pallet.palletBarcodes.map((item) => ({
                barcode: item.barcode,
                scanTime: item.scanTime,
                inspectionStatus: item.inspectionStatus,
                outWarehouseStatus: item.outWarehouseStatus,
              })),
            };
          }
        }

        // 清空输入框
        this.productScanForm.barcode = "";
        this.$nextTick(() => {
          this.$refs.productScanInput.focus();
        });

        this.$message.success("产品条码提交成功");
      } catch (error) {
        console.error("产品条码扫描失败:", error);
      }
    },

    // 删除已扫描的产品条码
    handleDeleteProductScan(row) {
      const index = this.scannedProducts.findIndex(
        (item) => item.barcode === row.barcode
      );
      if (index !== -1) {
        this.scannedProducts.splice(index, 1);
        // 将条码状态重置为待核验
        const palletBarcode = this.currentPallet.palletBarcodes.find(
          (item) => item.barcode === row.barcode
        );
        if (palletBarcode) {
          palletBarcode.inspectionStatus = "PENDING";
        }
      }
    },

    // 完成产品条码校验
    async handleCompleteProductScan() {
      try {
        // 调用新的产品条码提交接口，设置palletFinished为true
        const response = await submitProductBarcode({
          productBarcode: null, // 不提交具体条码，表示完成当前托盘
          userId: this.$store.state.user.id,
          entryInfo: {
            ...this.entryInfo,
            workOrderWhitelist: this.entryInfo.workOrderWhitelist.map(
              (item) => ({
                workOrderNo: item.workOrderNo,
                workOrderId: item._id,
                productionOrderNo: item.productionOrderNo,
              })
            ),
            outboundMode: this.entryInfo.outboundMode,
          },
        });

        if (response.code !== 200) {
          this.$message.error(response.message);
          return;
        }

        // 更新出库单信息
        if (response.data) {
          this.entryInfo = {
            ...response.data.entry,
            outboundMode: this.entryInfo.outboundMode,
          };
        }

        this.$message.success("产品条码校验完成");
        this.showProductScan = false;
        this.currentPallet = null;
        this.scannedProducts = [];
        this.$nextTick(() => {
          this.scanForm.barcode = "";
          this.$refs.scanInput.focus();
        });
      } catch (error) {
        console.error("完成产品条码校验失败:", error);
      }
    },

    getInspectionStatusType(status) {
      switch (status) {
        case "PASS":
          return "success";
        case "FAIL":
          return "danger";
        case "PENDING":
          return "warning";
        default:
          return "info";
      }
    },

    getInspectionStatusText(status) {
      switch (status) {
        case "PASS":
          return "已核验";
        case "FAIL":
          return "不通过";
        case "PENDING":
          return "待核验";
        default:
          return "未知";
      }
    },
  },
  computed: {
    // 计算待核验的条码列表
    pendingBarcodes() {
      if (!this.currentPallet || !this.currentPallet.palletBarcodes) {
        return [];
      }
      return this.currentPallet.palletBarcodes.filter((item) => {
        return item.inspectionStatus === "PENDING";
      });
    },
    // 计算已核验的条码列表
    verifiedBarcodes() {
      if (!this.currentPallet || !this.currentPallet.palletBarcodes) {
        return [];
      }
      return this.currentPallet.palletBarcodes.filter((item) => {
        return item.inspectionStatus === "PASS";
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.scan-container {
  .entry-info {
    margin-bottom: 20px;

    .info-item {
      margin-bottom: 10px;

      label {
        color: #606266;
        margin-right: 8px;
      }

      span {
        color: #303133;
        font-weight: 500;
      }
    }
  }

  .scan-list {
    margin-top: 20px;
    max-height: 400px;
    overflow-y: auto;
  }
}

.select-option {
  padding: 8px 0;

  .option-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;

    .option-label {
      font-weight: bold;
      color: #303133;
    }
  }

  .option-detail {
    display: flex;
    flex-direction: column;
    color: #606266;
    font-size: 12px;

    small {
      margin-top: 2px;
      color: #909399;
    }
  }
}

.product-scan {
  margin-top: 20px;

  .product-info {
    margin-bottom: 20px;

    .info-item {
      margin-bottom: 10px;

      label {
        color: #606266;
        margin-right: 8px;
      }

      span {
        color: #303133;
        font-weight: 500;
      }
    }
  }
}

.barcode-tabs {
  margin-top: 20px;
}
</style>
