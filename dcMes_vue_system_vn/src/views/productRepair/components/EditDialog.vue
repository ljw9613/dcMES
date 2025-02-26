<template>
  <el-dialog :title="dialogTitle" :visible.sync="visible" width="60%" :close-on-click-modal="false"
    @close="handleClose">
    <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small">
      <!-- 基础信息 -->
      <el-row :gutter="20" v-if="dialogStatus == 'create'">
        <el-form-item prop="barcode">
          <el-input v-model="barcode" :placeholder="placeholder" @keyup.enter.native="handleBarcodeSearch" ref="scanInput"
            clearable>
            <template slot="append">
              <el-button @click="handleBarcodeSearch">确认</el-button>
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
        <el-col :span="12">
          <el-form-item label="产品编码" prop="materialNumber">
            <el-input v-model="form.materialNumber" placeholder="请输入产品编码" disabled></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="产品名称" prop="materialName">
            <el-input v-model="form.materialName" placeholder="请输入产品名称" disabled></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="产品型号" prop="materialSpec">
            <el-input v-model="form.materialSpec" placeholder="请输入产品型号" disabled></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="生产工单" prop="workOrderNo">
            <el-input v-model="form.workOrderNo" placeholder="请输入生产工单" disabled></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="业务类型" prop="businessType">
            <el-select v-model="form.businessType" clearable placeholder="请选择业务类型" style="width: 100%" disabled>
              <el-option v-for="dict in dict.type.businessType" :key="dict.value" :label="dict.label"
                :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 维修信息 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="不良现象" prop="defectDescription">
            <el-input type="textarea" v-model="form.defectDescription" placeholder="请描述不良现象"
              :readonly="dialogStatus == 'view'"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="分析原因" prop="causeAnalysis">
            <el-input type="textarea" v-model="form.causeAnalysis" placeholder="请输入分析原因"
              :readonly="dialogStatus == 'view'"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="维修描述" prop="repairDescription">
            <el-input type="textarea" v-model="form.repairDescription" placeholder="请输入维修描述"
              :readonly="dialogStatus == 'view'"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="处理方案" prop="solution">
            <el-select v-model="form.solution" clearable placeholder="请选择处理方案" style="width: 100%"
              :disabled="dialogStatus == 'view'">
              <el-option v-for="dict in dict.type.repair_solution" :key="dict.value" :label="dict.label"
                :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20" v-if="form.repairResult">
        <el-col :span="24">
          <el-form-item label="审核结果" prop="repairResult">
            <el-tag :type="form.repairResult === 'QUALIFIED' ? 'success' : 'danger'" v-if="form.repairResult">
              {{ form.repairResult === 'QUALIFIED' ? '合格' : '不合格' }}
            </el-tag>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20" v-if="form.adverseEffect">
        <el-col :span="24">
          <el-form-item label="不利影响评价" prop="adverseEffect">
            <el-input type="textarea" v-model="form.adverseEffect"
              :readonly="dialogStatus == 'view' || dialogStatus == 'edit'" placeholder="请输入不利影响评价"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="状态" prop="status">


            <el-select v-model="form.status" placeholder="请选择状态" clearable style="width: 100%"  v-if="dialogStatus=='edit'">
                                <el-option label="待审核" value="PENDING_REVIEW" />
                                <el-option label="已审核" value="REVIEWED" />
                                <el-option label="已作废" value="VOIDED" />
                            </el-select>

            <el-tag :type="getStatusType(form.status)" v-else>
              {{ getStatusText(form.status) }}
            </el-tag>

          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="form.remark" placeholder="请输入备注信息"
          :readonly="dialogStatus == 'view'"></el-input>
      </el-form-item>

      <div class="button-container">
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading"
          v-if="dialogStatus != 'view'">保存并提交</el-button>
      </div>

      <!-- 新增条码列表展示 -->
      <el-form-item label="条码列表">
        <div class="barcode-list-container">
          <div class="barcode-count" v-if="form.barcodes.length > 0">
            已扫描条码数量：{{ form.barcodes.length }}/100
          </div>
          <el-table :data="form.barcodes" border size="small" height="250" style="width: 100%"
            :header-cell-style="{ background: '#f5f7fa' }">
            <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />
            <el-table-column prop="barcode" label="产品条码" align="center" min-width="180">
              <template slot-scope="scope">
                {{ scope.row.barcode }}
              </template>
            </el-table-column>
            <el-table-column prop="oldBarcode" label="旧的部件条码" align="center" min-width="180" v-if="form.solution=='部件更换'">
              <template slot-scope="scope">
                {{ scope.row.oldBarcode }}
              </template>
            </el-table-column>
            <el-table-column prop="newBarcode" label="新的部件条码" align="center" min-width="180" v-if="form.solution=='部件更换'">
              <template slot-scope="scope">
                {{ scope.row.newBarcode }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right" v-if="form.solution=='部件更换'||dialogStatus == 'create'">
              <template slot-scope="scope">
                <el-button type="text" size="mini" @click="handleReplaceComponent(scope.$index)" class="replace-btn" v-if="form.solution=='部件更换'">
                  更换新部件
                </el-button>
                <el-button type="text" size="mini" @click="handleRemoveBarcode(scope.$index)" class="delete-btn" v-if="dialogStatus == 'create'">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

        </div>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取 消</el-button>

    </div>

    <!-- 在原有的el-dialog下添加新的更换部件弹窗 -->
  <el-dialog title="更换部件" :visible.sync="replaceDialogVisible" width="30%" append-to-body>
    <el-form :model="replaceForm" label-width="100px">
      <el-form-item label="原部件条码">
        <el-input 
          v-model="oldBarcode"
          placeholder="请输入原部件条码">
        </el-input>
      </el-form-item>
      <el-form-item label="新部件条码">
        <el-input 
          v-model="newBarcode"
          placeholder="请输入新部件条码">
        </el-input>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="replaceDialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="confirmReplace">确 定</el-button>
    </div>
  </el-dialog>
  </el-dialog>

  
  
</template>

<script>
import {
  scanProductRepair,
  submitProductRepair
} from "@/api/product/productRepair";
import { getData, addData, updateData, removeData } from "@/api/data";

export default {
  name: "EditDialog",
  dicts: ['businessType', 'repair_solution'],
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    dialogStatus: {
      type: String,
      default: "create"
    },
    dialogType: {
      type: String,
      default: "main"
    },
    rowData: {
      type: Object,
      default: () => ({})
    }
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
                callback(new Error('请至少扫描一个产品条码'));
              } else {
                callback();
              }
            },
            trigger: 'change'
          }
        ],
        materialSpec: [
          { message: "请输入产品型号", trigger: "blur" }
        ],
        batchNumber: [
          { message: "请输入生产批号", trigger: "blur" }
        ],
        defectDescription: [
          { required: true, message: "请描述不良现象", trigger: "blur" }
        ],
        solution: [
          { required: true, message: "请选择处理方案", trigger: "change" }
        ],
        status: [{ required: true, message: "请选择状态", trigger: "change" }]
      },
      submitLoading: false,
      replacementBarcode: "",
      currentReplacingIndex: -1,
      oldBarcode: '',
      newBarcode: '',
      replaceDialogVisible: false,
      replaceForm: {
        oldBarcode: '',
        newBarcode: ''
      }
    };
  },
  computed: {
    dialogTitle() {
      const titleMap = {
        create: "新增维修记录",
        edit: "编辑维修记录",
        view: "查看维修记录"
      };
      return titleMap[this.dialogStatus] || "维修记录";
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initFormData();
      }
    }
  },
  methods: {
    getStatusText(status) {
      const statusMap = {
        'PENDING_REVIEW': '待审核',
        'REVIEWED': '已审核',
        'VOIDED': '已作废'
      }
      return statusMap[status] || status
    },

    getStatusType(status) {
      const typeMap = {
        'PENDING_REVIEW': 'info',
        'REVIEWED': 'success',
        'VOIDED': 'danger'
      }
      return typeMap[status] || 'info'
    },
    // 处理条码搜索
    async handleBarcodeSearch() {
      if (!this.barcode.trim()) {
        this.$message.warning('请输入要搜索的条码');
        return;
      }

      this.searchLoading = true;
      try {
        if (this.dialogType === 'main') {
          // 查询主条码
          const searchQuery = {
            query: {
              'processNodes.barcode': this.barcode
            }
          };

          const mainBarcodeResult = await getData('material_process_flow', searchQuery);
          if (mainBarcodeResult.code === 200 && mainBarcodeResult.data && mainBarcodeResult.data.length > 0) {
            this.handleScanInput(mainBarcodeResult.data[0].barcode)
            return;
          }
        }
        // 查询当前条码
        let currentSearchQuery = {
          query: {
            barcode: this.barcode
          }
        }
        const currentBarcodeResult = await getData('material_process_flow', currentSearchQuery);

        if (currentBarcodeResult.code === 200 && currentBarcodeResult.data && currentBarcodeResult.data.length > 0) {
          this.handleScanInput(currentBarcodeResult.data[0].barcode)
          return;
        }

        this.$message.warning('未找到相关数据');

      } catch (error) {
        console.error('搜索失败:', error);
        this.$message.error('搜索失败: ' + error.message);
      } finally {
        this.barcode = ""
        this.searchLoading = false;
      }
    },
    async handleScanInput(barcode) {
      try {
        // const barcode = this.barcode.trim();
        console.log(barcode, "barcode");

        if (this.dialogType === 'main') {
        }

        if (this.dialogType === 'auxiliary') {
          this.form.businessType = 'AUXILIARY_LINE';
        }

        // 添加条码数量限制检查
        if (this.form.barcodes.length >= 100) {
          this.$message.warning("单次最多只能扫描100个条码");
          this.barcode = "";
          return;
        }

        // 判断条码是否已存在
        if (this.form.barcodes.includes(barcode)) {
          this.$message.warning("该条码已存在");
          this.barcode = "";
          return;
        }

        // 调用托盘出库API
        const response = await scanProductRepair({
          barcode,
          form: this.form
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
          this.form["productionPlanWorkOrderId"] = response.data.productionPlanWorkOrderId ? response.data.productionPlanWorkOrderId._id : null; // 工单ID
          this.form["saleOrderId"] = response.data.productionPlanWorkOrderId ? response.data.productionPlanWorkOrderId.saleOrderId : null; // 销售订单ID
          this.form["saleOrderNo"] = response.data.productionPlanWorkOrderId ? response.data.productionPlanWorkOrderId.saleOrderNo : null; // 销售单号
        }

        // 添加新条码
        this.form.barcodes.push({barcode:barcode});
        this.barcode = "";

        this.$message.success(response.message);
      } catch (error) {
        console.error("扫描失败:", error);
      }
    },
    initFormData() {
      if (this.dialogStatus === "edit" || this.dialogStatus === "view") {
        const formData = { ...this.rowData };
      console.log('formData',formData)
        let arrayData;
        if(formData.newBarcode){
          arrayData = {barcode:formData.barcode,
            newBarcode:formData.newBarcode,
            oldBarcode:formData.oldBarcode
          }
        }else{
          arrayData = {barcode:formData.barcode}
        }
        formData.barcodes = Array.isArray(arrayData)
          ? arrayData
          : [arrayData];
        this.form = formData;
        console.log('formData',formData)
      } else {
        this.barcode = ''
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
      this.$refs.form.validate(async valid => {
        if (!valid) {
          return;
        }

        if (!this.form.barcodes || this.form.barcodes.length === 0) {
          this.$message.error('请至少扫描一个产品条码');
          return;
        }

        this.submitLoading = true;
        try {
          let response = await submitProductRepair({
            form: this.form,
            userId: this.$store.state.user.id
          });

          if (response.code !== 200) {
            this.$message.error(response.message);
            return;
          }

          const { successCount, totalCount, errors } = response.data;

          if (errors && errors.length > 0) {
            const errorMessage = errors.join('\n');
            await this.$msgbox({
              title: '处理结果',
              message: `成功处理 ${successCount}/${totalCount} 条记录\n\n错误详情：\n${errorMessage}`,
              type: 'warning',
              showCancelButton: true,
              cancelButtonText: '导出错误信息',
              confirmButtonText: '确定',
              callback: action => {
                if (action === 'cancel') {
                  this.exportErrorsToExcel(errors);
                }
              }
            });
          } else {
            this.$message.success(response.message);
          }

          this.$emit('submit');
          this.handleClose();
        } catch (error) {
          console.error("提交失败:", error);
          this.$message.error("提交失败");
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
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = ['序号', '错误信息']
        const data = errors.map((error, index) => [index + 1, error])
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: '错误信息',
          autoWidth: true,
          bookType: 'xlsx'
        })
      })
    },
    handleReplaceComponent(index) {
      this.currentReplacingIndex = index;
      this.oldBarcode = '';
      this.newBarcode = '';
      this.replaceDialogVisible = true;
    },
    confirmReplace() {
      if (!this.oldBarcode || !this.newBarcode) {
        this.$message.warning('请输入完整的条码信息');
        return;
      }

      this.$set(this.form.barcodes, this.currentReplacingIndex, {
        barcode: this.form.barcodes[this.currentReplacingIndex].barcode,
        newBarcode: this.newBarcode,
        oldBarcode: this.oldBarcode
      });

      this.replaceDialogVisible = false;
      this.oldBarcode = '';
      this.newBarcode = '';
      this.currentReplacingIndex = -1;
    },
  }
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
    color: #F56C6C;

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

.replace-btn {
  color: #409EFF;
  margin-right: 10px;
  
  &:hover {
    color: #66b1ff;
  }
}
</style>
