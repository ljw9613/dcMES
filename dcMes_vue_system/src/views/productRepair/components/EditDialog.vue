<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="visible"
    width="60%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="120px"
      size="small"
    >
      <!-- 基础信息 -->
      <el-row :gutter="20" v-if="dialogStatus == 'create'">
        <el-form-item prop="barcode">
          <el-input
            v-model="barcode"
            :placeholder="placeholder"
            @keyup.enter.native="handleBarcodeSearch"
            ref="scanInput"
            clearable
          >
            <template slot="append">
              <el-button @click="handleBarcodeSearch">{{ $t('editDialog.form.confirm') }}</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-row>
      <!-- <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="产品条码" prop="barcodes">
            <el-select v-model="form.barcodes" multiple filterable allow-create default-first-option
              placeholder="请输入产品条码(可输入多个)" :disabled="true" style="width: 100%">
            </el-select>
          </el-form-item>
        </el-col>
      </el-row> -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('editDialog.form.solution')" prop="solution">
            <el-select
              v-model="form.solution"
              clearable
              :placeholder="$t('editDialog.form.solutionPlaceholder')"
              style="width: 100%"
              :disabled="dialogStatus == 'view'"
            >
              <el-option
                v-for="dict in dict.type.repair_solution"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
            <!-- 部件更换提示信息 -->
            <div
              v-if="form.solution === 'COMPONENT_REPLACEMENT' || form.solution === '部件更换'"
              style="margin-top: 8px; padding: 10px; background-color: #fff7e6; border: 1px solid #ffd591; border-radius: 4px;"
            >
              <p style="margin: 0; color: #fa8c16; font-size: 13px;">
                <i class="el-icon-warning-outline"></i>
                <strong>{{ $t('editDialog.tips.componentReplacementTitle') }}</strong>
              </p>
              <p style="margin: 5px 0 0 0; color: #8c8c8c; font-size: 12px;">
                {{ $t('editDialog.tips.componentReplacementContent') }}
              </p>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 维修信息 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('editDialog.form.defectDescription')" prop="defectDescription">
            <el-input
              type="textarea"
              v-model="form.defectDescription"
              :placeholder="$t('editDialog.form.defectDescriptionPlaceholder')"
              :readonly="dialogStatus == 'view'"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :label="$t('editDialog.form.materialNumber')" prop="materialNumber">
            <el-input
              v-model="form.materialNumber"
              :placeholder="$t('editDialog.form.materialNumberPlaceholder')"
              disabled
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('editDialog.form.materialName')" prop="materialName">
            <el-input
              v-model="form.materialName"
              :placeholder="$t('editDialog.form.materialNamePlaceholder')"
              disabled
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('editDialog.form.materialSpec')" prop="materialSpec">
            <el-input
              v-model="form.materialSpec"
              :placeholder="$t('editDialog.form.materialSpecPlaceholder')"
              disabled
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('editDialog.form.workOrderNo')" prop="workOrderNo">
            <el-input
              v-model="form.workOrderNo"
              :placeholder="$t('editDialog.form.workOrderNoPlaceholder')"
              disabled
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('editDialog.form.businessType')" prop="businessType">
            <el-select
              v-model="form.businessType"
              clearable
              :placeholder="$t('editDialog.form.businessTypePlaceholder')"
              style="width: 100%"
              disabled
            >
              <el-option
                v-for="dict in dict.type.businessType"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('editDialog.form.causeAnalysis')" prop="causeAnalysis">
            <el-input
              type="textarea"
              v-model="form.causeAnalysis"
              :placeholder="$t('editDialog.form.causeAnalysisPlaceholder')"
              :readonly="dialogStatus == 'view'"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('editDialog.form.repairDescription')" prop="repairDescription">
            <el-input
              type="textarea"
              v-model="form.repairDescription"
              :placeholder="$t('editDialog.form.repairDescriptionPlaceholder')"
              :readonly="dialogStatus == 'view'"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 产品状态选择 -->
      <!-- <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="产品状态" prop="productStatus">
            <el-select
              v-model="form.productStatus"
              placeholder="请选择产品状态"
              style="width: 100%"
              :disabled="dialogStatus == 'view'"
            >
              <el-option label="维修中" value="REPAIRING" />
              <el-option label="报废" value="SCRAP" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row> -->

      <el-row :gutter="20" v-if="form.repairResult">
        <el-col :span="24">
          <el-form-item :label="$t('editDialog.form.repairResult')" prop="repairResult">
            <el-tag
              :type="form.repairResult === 'QUALIFIED' ? 'success' : 'danger'"
              v-if="form.repairResult"
            >
              {{ form.repairResult === "QUALIFIED" ? $t('productRepair.status.qualified') : $t('productRepair.status.unqualified') }}
            </el-tag>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20" v-if="form.adverseEffect">
        <el-col :span="24">
          <el-form-item :label="$t('editDialog.form.adverseEffect')" prop="adverseEffect">
            <el-input
              type="textarea"
              v-model="form.adverseEffect"
              :readonly="dialogStatus == 'view' || dialogStatus == 'edit'"
              :placeholder="$t('editDialog.form.adverseEffectPlaceholder')"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('editDialog.form.status')" prop="status">
            <el-select
              v-model="form.status"
              :placeholder="$t('editDialog.form.statusPlaceholder')"
              clearable
              style="width: 100%"
              v-if="dialogStatus == 'edit'"
            >
              <el-option :label="$t('productRepair.status.pendingReview')" value="PENDING_REVIEW" />
              <el-option :label="$t('productRepair.status.reviewed')" value="REVIEWED" />
              <el-option :label="$t('productRepair.status.voided')" value="VOIDED" />
            </el-select>

            <el-tag :type="getStatusType(form.status)" v-else>
              {{ getStatusText(form.status) }}
            </el-tag>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="$t('editDialog.form.remark')" prop="remark">
        <el-input
          type="textarea"
          v-model="form.remark"
          :placeholder="$t('editDialog.form.remarkPlaceholder')"
          :readonly="dialogStatus == 'view'"
        ></el-input>
      </el-form-item>

      <div class="button-container">
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitLoading"
          v-if="dialogStatus != 'view'"
          >{{ $t('editDialog.buttons.saveAndSubmit') }}</el-button
        >
      </div>

      <!-- 新增条码列表展示 -->
      <el-form-item :label="$t('editDialog.form.barcodeList')">
        <div class="barcode-list-container">
          <div class="barcode-count" v-if="form.barcodes.length > 0">
            {{ $t('editDialog.form.scannedCount') }}：{{ form.barcodes.length }}/100
          </div>
          <el-table
            :data="form.barcodes"
            border
            size="small"
            height="250"
            style="width: 100%"
            :header-cell-style="{ background: '#f5f7fa' }"
          >
            <el-table-column
              type="index"
              :label="$t('editDialog.form.serialNumber')"
              width="60"
              align="center"
              fixed="left"
            />
            <el-table-column
              prop="barcode"
              :label="$t('editDialog.form.productBarcode')"
              align="center"
              min-width="180"
            >
              <template slot-scope="scope">
                {{ scope.row.barcode }}
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('editDialog.form.operation')"
              width="180"
              align="center"
              fixed="right"
              v-if="dialogStatus == 'create'"
            >
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="mini"
                  @click="handleRemoveBarcode(scope.$index)"
                  class="delete-btn"
                >
                  {{ $t('editDialog.form.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">{{ $t('editDialog.buttons.cancel') }}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  scanProductRepair,
  submitProductRepair,
} from "@/api/product/productRepair";
import { getData, addData, updateData, removeData } from "@/api/data";

export default {
  name: "EditDialog",
  dicts: ["businessType", "repair_solution"],
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    dialogStatus: {
      type: String,
      default: "create",
    },
    dialogType: {
      type: String,
      default: "main",
    },
    rowData: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      barcode: "",
      placeholder: "请扫描产品条码",
      form: {
        barcodes: [],
        materialId: "",
        materialSpec: "",
        batchNumber: "",
        materialName: "",
        defectDescription: "",
        causeAnalysis: "",
        repairDescription: "",
        businessType: "",
        solution: "",
        productStatus: "REPAIRING",
        originalProductStatus: "",
        status: "PENDING_REVIEW",
        remark: "",
        productionPlanWorkOrderId: "",
        saleOrderId: "",
        saleOrderNo: "",
        adverseEffect: "",
      },
      rules: {
        barcodes: [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (!value || value.length === 0) {
                callback(new Error(this.$t('editDialog.validation.barcodeRequired')));
              } else {
                callback();
              }
            },
            trigger: "change",
          },
        ],
        materialSpec: [{ message: this.$t('editDialog.validation.materialSpecRequired'), trigger: "blur" }],
        batchNumber: [{ message: this.$t('editDialog.validation.batchNumberRequired'), trigger: "blur" }],
        defectDescription: [
          { required: true, message: this.$t('editDialog.validation.defectDescriptionRequired'), trigger: "blur" },
        ],
        solution: [
          { required: true, message: this.$t('editDialog.validation.solutionRequired'), trigger: "change" },
        ],
        status: [{ required: true, message: this.$t('editDialog.validation.statusRequired'), trigger: "change" }],
      },
      submitLoading: false,
    };
  },
  computed: {
    dialogTitle() {
      const titleMap = {
        create: "新增维修记录",
        edit: "编辑维修记录",
        view: "查看维修记录",
      };
      return titleMap[this.dialogStatus] || "维修记录";
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.initFormData();
      }
    },
  },
  methods: {
    getStatusText(status) {
      const statusMap = {
        PENDING_REVIEW: "待审核",
        REVIEWED: "已审核",
        VOIDED: "已作废",
      };
      return statusMap[status] || status;
    },

    getStatusType(status) {
      const typeMap = {
        PENDING_REVIEW: "info",
        REVIEWED: "success",
        VOIDED: "danger",
      };
      return typeMap[status] || "info";
    },
    // 处理条码搜索
    async handleBarcodeSearch() {
      if (!this.barcode.trim()) {
        this.$message.warning(this.$t('editDialog.messages.scanBarcodeWarning'));
        return;
      }

      this.searchLoading = true;
      try {
        if (this.dialogType === "main") {
          // 查询主条码
          const searchQuery = {
            query: {
              "processNodes.barcode": this.barcode,
            },
          };

          const mainBarcodeResult = await getData(
            "material_process_flow",
            searchQuery
          );
          if (
            mainBarcodeResult.code === 200 &&
            mainBarcodeResult.data &&
            mainBarcodeResult.data.length > 0
          ) {
            // 检查产品状态是否为完成状态
            if (mainBarcodeResult.data[0].status === 'COMPLETED') {
              try {
                await this.$confirm('该产品已处于完成状态，继续操作将把产品状态变更为"维修中"，是否继续？', '状态变更提示', {
                  confirmButtonText: '确认变更',
                  cancelButtonText: '取消',
                  type: 'warning'
                });
                // 用户确认，继续执行
              } catch (error) {
                // 用户取消，终止操作
                this.barcode = '';
                this.searchLoading = false;
                return;
              }
            }
            this.handleScanInput(mainBarcodeResult.data[0].barcode);
            return;
          }
        }
        // 查询当前条码
        let currentSearchQuery = {
          query: {
            barcode: this.barcode,
          },
        };
        const currentBarcodeResult = await getData(
          "material_process_flow",
          currentSearchQuery
        );

        if (
          currentBarcodeResult.code === 200 &&
          currentBarcodeResult.data &&
          currentBarcodeResult.data.length > 0
        ) {
          // 检查产品状态是否为完成状态
          if (currentBarcodeResult.data[0].status === 'COMPLETED') {
            try {
              await this.$confirm('该产品已处于完成状态，继续操作将把产品状态变更为"维修中"，是否继续？', '状态变更提示', {
                confirmButtonText: '确认变更',
                cancelButtonText: '取消',
                type: 'warning'
              });
              // 用户确认，继续执行
            } catch (error) {
              // 用户取消，终止操作
              this.barcode = '';
              this.searchLoading = false;
              return;
            }
          }
          this.handleScanInput(currentBarcodeResult.data[0].barcode);
          return;
        }

        this.$message.warning(this.$t('editDialog.messages.noDataFound'));
      } catch (error) {
        console.error("搜索失败:", error);
        this.$message.error(this.$t('editDialog.messages.searchFailed') + ": " + error.message);
      } finally {
        this.barcode = "";
        this.searchLoading = false;
      }
    },
    async handleScanInput(barcode) {
      try {
        // const barcode = this.barcode.trim();
        console.log(barcode, "barcode");

        if (this.dialogType === "main") {
        }

        if (this.dialogType === "auxiliary") {
          this.form.businessType = "AUXILIARY_LINE";
        }

        // 添加条码数量限制检查
        if (this.form.barcodes.length >= 100) {
          this.$message.warning(this.$t('editDialog.messages.maxBarcodeLimit'));
          this.barcode = "";
          return;
        }

        // 判断条码是否已存在
        if (this.form.barcodes.some(item => item.barcode === barcode)) {
          this.$message.warning(this.$t('editDialog.messages.barcodeExists'));
          this.barcode = "";
          return;
        }

        // 首先查询当前产品的状态信息
        const flowQuery = {
          query: {
            barcode: barcode,
          },
        };
        const flowResult = await getData("material_process_flow", flowQuery);
        let isCompletedProduct = false;
        
        // 检查是否为已完成状态的产品
        if (flowResult.code === 200 && 
            flowResult.data && 
            flowResult.data.length > 0 && 
            flowResult.data[0].status === 'COMPLETED') {
          isCompletedProduct = true;
          // 记录原始产品状态
          this.form.originalProductStatus = flowResult.data[0].productStatus || 'NORMAL';
        }
        
        // 调用托盘出库API
        const response = await scanProductRepair({
          barcode,
          form: this.form,
          isCompletedProduct: isCompletedProduct, // 传递产品完成状态标记
        });
        if (response.code !== 200) {
          this.$message.error(response.message);
          this.barcode = "";
          return;
        }
        // 更新出库单信息
        if (response.data) {
          this.form["materialId"] = response.data.materialId; // 物料编码
          this.form["materialNumber"] = response.data.materialCode; // 物料编码
          this.form["materialName"] = response.data.materialName; // 物料名称
          this.form["materialSpec"] = response.data.materialSpec; // 产品型号
          this.form["businessType"] = response.data.businessType; // 业务类型
          this.form["workOrderNo"] = response.data.productionPlanWorkOrderId
            ? response.data.productionPlanWorkOrderId.workOrderNo
            : null; // 生产批号
          this.form["productionPlanWorkOrderId"] = response.data
            .productionPlanWorkOrderId
            ? response.data.productionPlanWorkOrderId._id
            : null; // 工单ID
          this.form["saleOrderId"] = response.data.productionPlanWorkOrderId
            ? response.data.productionPlanWorkOrderId.saleOrderId
            : null; // 销售订单ID
          this.form["saleOrderNo"] = response.data.productionPlanWorkOrderId
            ? response.data.productionPlanWorkOrderId.saleOrderNo
            : null; // 销售单号
        }

        // 添加新条码
        this.form.barcodes.push({ barcode: barcode });
        this.barcode = "";

        this.$message.success(this.$t('editDialog.messages.scanSuccess'));
      } catch (error) {
        console.error("扫描失败:", error);
      }
    },
    initFormData() {
      if (this.dialogStatus === "edit" || this.dialogStatus === "view") {
        const formData = { ...this.rowData };
        console.log("formData", formData);
        let arrayData = { barcode: formData.barcode };
        formData.barcodes = Array.isArray(arrayData) ? arrayData : [arrayData];
        this.form = formData;
        console.log("formData", formData);
      } else {
        this.barcode = "";
        this.form = {
          barcodes: [],
          materialId: "",
          materialSpec: "",
          batchNumber: "",
          materialName: "",
          defectDescription: "",
          causeAnalysis: "",
          repairDescription: "",
          businessType: "",
          solution: "",
          productStatus: "REPAIRING",
          originalProductStatus: "",
          status: "PENDING_REVIEW",
          remark: "",
          productionPlanWorkOrderId: "",
          saleOrderId: "",
          saleOrderNo: "",
          adverseEffect: "",
        };
      }
    },
    handleClose() {
      this.$emit("update:visible", false);
      this.$refs.form && this.$refs.form.resetFields();
    },
    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) {
          return;
        }

        if (!this.form.barcodes || this.form.barcodes.length === 0) {
          this.$message.error(this.$t('editDialog.messages.atLeastOneBarcodeRequired'));
          return;
        }

        // 如果存在原始产品状态，且是从"COMPLETED"状态变更来的，再次确认
        if (this.form.originalProductStatus && this.dialogStatus === 'create') {
          try {
            await this.$confirm(
              '确认将完成状态的产品变更为维修状态？此操作将影响产品后续处理流程。', 
              '最终确认', 
              {
                confirmButtonText: '确认提交',
                cancelButtonText: '取消',
                type: 'warning'
              }
            );
          } catch (error) {
            return; // 用户取消操作
          }
        }

        this.submitLoading = true;
        try {
          let response = await submitProductRepair({
            form: this.form,
            userId: this.$store.state.user.id,
          });

          if (response.code !== 200) {
            this.$message.error(response.message);
            return;
          }

          const { successCount, totalCount, errors } = response.data;

          if (errors && errors.length > 0) {
            const errorMessage = errors.join("\n");
            await this.$msgbox({
              title: "处理结果",
              message: `成功处理 ${successCount}/${totalCount} 条记录\n\n错误详情：\n${errorMessage}`,
              type: "warning",
              showCancelButton: true,
              cancelButtonText: "导出错误信息",
              confirmButtonText: "确定",
              callback: (action) => {
                if (action === "cancel") {
                  this.exportErrorsToExcel(errors);
                }
              },
            });
          } else {
            this.$message.success(response.message);
          }

          this.$emit("submit");
          this.handleClose();
        } catch (error) {
          console.error("提交失败:", error);
          this.$message.error(this.$t('editDialog.messages.submitFailed'));
        } finally {
          this.submitLoading = false;
        }
      });
    },
    handleRemoveBarcode(index) {
      this.form.barcodes.splice(index, 1);
      // 当条码列表为空时，重置表单数据
      if (this.form.barcodes.length === 0) {
        this.initFormData();
      }
    },
    exportErrorsToExcel(errors) {
      import("@/vendor/Export2Excel").then((excel) => {
        const tHeader = ["序号", "错误信息"];
        const data = errors.map((error, index) => [index + 1, error]);
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: "错误信息",
          autoWidth: true,
          bookType: "xlsx",
        });
      });
    },
  },
};
</script>
<style lang="scss" scoped>
.el-select {
  width: 100%;
}

.dialog-footer {
  text-align: right;
}

.button-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

// 新增样式
.barcode-list-container {
  .el-table {
    margin-bottom: 10px;
  }

  .barcode-count {
    text-align: right;
    color: #606266;
    font-size: 13px;
    margin-top: 5px;
  }

  .delete-btn {
    color: #f56c6c;

    &:hover {
      color: #f78989;
    }
  }
}

// 设置表格最大高度，超出显示滚动条
::v-deep .el-table {
  max-height: 250px;
  overflow-y: auto;
}

// 优化表格样式
::v-deep .el-table th {
  background-color: #f5f7fa !important;
  color: #606266;
  font-weight: 500;
}

::v-deep .el-table--striped .el-table__body tr.el-table__row--striped td {
  background: #fafafa;
}
</style>
