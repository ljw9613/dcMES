<template>
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    width="800px"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <div class="scan-container">
      <el-form v-if="entryInfo" :model="entryInfo" ref="entryForm" :rules="entryRules">
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
            <el-form-item label="货柜号" required prop="HuoGuiCode">
              <el-input
                v-model="entryInfo.HuoGuiCode"
                :readonly="entryInfo._id && entryInfo.HuoGuiCode"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发票号" required prop="FaQIaoNo">
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
            <el-form-item label="应出库数量" required prop="outboundQuantity">
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
      
      <!-- 扫码输入区域 - 整托盘模式 -->
      <el-form
        :model="scanForm"
        ref="scanForm"
        :rules="rules"
        v-if="entryInfo && entryInfo.outboundMode === 'PALLET'"
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
        v-if="entryInfo && entryInfo.outboundMode === 'SINGLE'"
      >
        <el-form-item prop="barcode">
          <el-input
            v-model="productScanForm.barcode"
            placeholder="请扫描产品条码"
            @keyup.enter.native="handleDirectProductScan"
            ref="productScanInput"
            clearable
          >
            <template slot="append">
              <el-button @click="handleDirectProductScan">确认</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <!-- 在扫描记录列表上方添加出库单信息卡片 -->
      <div class="entry-info" v-if="entryInfo && entryInfo.entryNo">
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
      <div class="scan-list" v-if="entryInfo && entryInfo.entryItems && entryInfo.entryItems.length > 0">
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
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button
        type="primary"
        @click="handleComplete"
        :disabled="!entryInfo || !entryInfo.entryItems || !entryInfo.entryItems.length"
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
      default: "扫码出库",
    },
    placeholder: {
      type: String,
      default: "请扫描条码",
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
      productScanForm: {
        barcode: "",
      },
      productScanRules: {
        barcode: [
          { required: true, message: "请输入或扫描产品条码", trigger: "blur" },
        ],
      },
      entryRules: {
        HuoGuiCode: [{ required: true, message: '请填写货柜号', trigger: 'blur' }],
        FaQIaoNo: [{ required: true, message: '请填写发票号', trigger: 'blur' }],
        outboundQuantity: [
          { required: true, message: '请填写应出库数量', trigger: 'blur' },
          { type: 'number', min: 1, message: '应出库数量必须大于0', trigger: 'blur', transform: (value) => Number(value) }
        ],
      },
    };
  },
  watch: {
    visible(val) {
      this.dialogVisible = val;
      if (val) {
        this.initEntryInfo();
        this.$nextTick(() => {
          if (this.entryInfo && this.entryInfo.outboundMode === 'SINGLE') {
            this.$refs.productScanInput && this.$refs.productScanInput.focus();
          } else {
            this.$refs.scanInput && this.$refs.scanInput.focus();
          }
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
    // 监听出库模式变化，切换不同的输入框
    "entryInfo.outboundMode": {
      handler(newVal) {
        this.$nextTick(() => {
          if (newVal === 'SINGLE') {
            this.$refs.productScanInput && this.$refs.productScanInput.focus();
          } else {
            this.$refs.scanInput && this.$refs.scanInput.focus();
          }
        });
      }
    }
  },
  methods: {
    async initEntryInfo() {
      if (this.scanData) {
        this.entryInfo = {
          ...this.scanData,
          workOrderWhitelist: [],
          outboundMode: this.scanData.outboundMode || "PALLET",
        };
        
        // 确保托盘数量正确初始化
        if (this.entryInfo.entryItems && this.entryInfo.entryItems.length > 0) {
          this.entryInfo.palletCount = this.entryInfo.entryItems.length;
        } else if (!this.entryInfo.palletCount) {
          this.entryInfo.palletCount = 0;
        }
      }
    },
    async handleScanInput() {
      try {
        // 验证扫码输入框
        await this.$refs.scanForm.validate();
        
        // 验证入库信息表单
        await this.$refs.entryForm.validate();
        
        const barcode = this.scanForm.barcode.trim();

        // 发送扫描事件到父组件
        const success = await this.$emit("scan", barcode);
        if (success) {
          // 解析条码信息
          const [palletCode, saleOrderNo, materialCode, quantity, lineCode] =
            barcode.split("#");

          // 调用托盘出库API
          const response = await scanPalletOn({
            palletCode,
            userId: this.$store.state.user.id,
            entryInfo: {
              ...this.entryInfo,
              HuoGuiCode: this.entryInfo.HuoGuiCode,
              FaQIaoNo: this.entryInfo.FaQIaoNo,
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
            // 保留原有的货柜号和发票号
            const huoGuiCode = this.entryInfo.HuoGuiCode;
            const faQIaoNo = this.entryInfo.FaQIaoNo;
            
            this.entryInfo = {
              ...response.data,
              HuoGuiCode: response.data.HuoGuiCode || huoGuiCode,
              FaQIaoNo: response.data.FaQIaoNo || faQIaoNo
            };
            
            // 确保托盘数量正确显示
            if (this.entryInfo.entryItems && this.entryInfo.entryItems.length > 0) {
              this.entryInfo.palletCount = this.entryInfo.entryItems.length;
            }
            
            // 如果返回的数据没有包含货柜号和发票号，需要再次更新这两个字段
            if (!response.data.HuoGuiCode || !response.data.FaQIaoNo) {
              await updateData("warehouse_ontry", {
                query: { _id: this.entryInfo._id },
                update: { 
                  HuoGuiCode: huoGuiCode,
                  FaQIaoNo: faQIaoNo 
                }
              });
            }
          }

          if (response.code !== 200) {
            this.$message.error(response.message);
            return;
          }

          if (response.mode === "init") {
            this.$message.success("出库单初始化成功");
          } else {
            this.$message.success("托盘扫码出库成功");
          }
          
          // 清空输入框并聚焦
          this.scanForm.barcode = "";
          this.$nextTick(() => {
            this.$refs.scanInput.focus();
          });
        }
      } catch (error) {
        console.error("扫描失败:", error);
      }
    },
    
    // 单一产品出库模式 - 直接扫描产品条码
    async handleDirectProductScan() {
      try {
        // 验证产品扫码输入框
        await this.$refs.productScanForm.validate();
        
        // 验证入库信息表单
        await this.$refs.entryForm.validate();
        
        const barcode = this.productScanForm.barcode.trim();
        
        // 调用产品条码提交接口
        const response = await submitProductBarcode({
          productBarcode: barcode,
          userId: this.$store.state.user.id,
          entryInfo: {
            ...this.entryInfo,
            HuoGuiCode: this.entryInfo.HuoGuiCode,
            FaQIaoNo: this.entryInfo.FaQIaoNo,
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
        if (response.data && response.data.entry) {
          // 保留原有的货柜号和发票号
          const huoGuiCode = this.entryInfo.HuoGuiCode;
          const faQIaoNo = this.entryInfo.FaQIaoNo;
            
          this.entryInfo = {
            ...response.data.entry,
            outboundMode: this.entryInfo.outboundMode,
            HuoGuiCode: response.data.entry.HuoGuiCode || huoGuiCode,
            FaQIaoNo: response.data.entry.FaQIaoNo || faQIaoNo
          };
          
          // 确保托盘数量正确显示
          if (this.entryInfo.entryItems && this.entryInfo.entryItems.length > 0) {
            this.entryInfo.palletCount = this.entryInfo.entryItems.length;
          }
          
          // 如果返回的数据没有包含货柜号和发票号，需要再次更新这两个字段
          if (!response.data.entry.HuoGuiCode || !response.data.entry.FaQIaoNo) {
            await updateData("warehouse_ontry", {
              query: { _id: this.entryInfo._id },
              update: { 
                HuoGuiCode: huoGuiCode,
                FaQIaoNo: faQIaoNo 
              }
            });
          }
        }

        // 清空输入框
        this.productScanForm.barcode = "";
        this.$nextTick(() => {
          this.$refs.productScanInput.focus();
        });

        this.$message.success("产品条码出库成功");
      } catch (error) {
        console.error("产品条码扫描失败:", error);
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

      this.$message.success("获取销售单信息成功");
    },
    
    async handleComplete() {
      try {
        // 确保在完成出库前更新出库单的货柜号和发票号
        if (this.entryInfo && this.entryInfo._id) {
          await updateData("warehouse_ontry", {
            query: { _id: this.entryInfo._id },
            update: { 
              HuoGuiCode: this.entryInfo.HuoGuiCode,
              FaQIaoNo: this.entryInfo.FaQIaoNo 
            }
          });
        }
        
        // 调用父组件的complete方法
        const palletCodes = this.entryInfo.entryItems ? 
          this.entryInfo.entryItems.map(item => item.palletCode) : [];
        
        await this.$emit("complete", palletCodes);
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
      this.productScanForm.barcode = "";
      this.scanRecords = [];
      if (this.$refs.scanForm) {
        this.$refs.scanForm.resetFields();
      }
      if (this.$refs.productScanForm) {
        this.$refs.productScanForm.resetFields();
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
      this.entryInfo.workOrderWhitelist = selected.map((item) => ({
        workOrderNo: item.workOrderNo,
        workOrderId: item._id,
      }));
    },
  }
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
</style>
