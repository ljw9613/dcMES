<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="visible"
    width="60%"
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
      <el-row :gutter="20" v-if="dialogStatus=='create'">
        <el-form-item prop="barcode">
          <el-input
            v-model="barcode"
            :placeholder="placeholder"
            @keyup.enter.native="handleScanInput"
            ref="scanInput"
            clearable
          >
            <template slot="append">
              <el-button @click="handleScanInput">确认</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="产品条码" prop="barcodes">
            <el-select
              v-model="form.barcodes"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="请输入产品条码(可输入多个)"
              :disabled="true"
              style="width: 100%"
            >
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="产品型号" prop="materialSpec">
            <el-input
              v-model="form.materialSpec"
              placeholder="请输入产品型号" :readonly="dialogStatus=='view'||dialogStatus=='edit'"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="产品名称" prop="materialName" >
            <el-input
              v-model="form.materialName"
              placeholder="请输入产品名称" :readonly="dialogStatus=='view'||dialogStatus=='edit'"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="生产批号" prop="batchNumber" >
            <el-input
              v-model="form.batchNumber"
              placeholder="请输入生产批号" :readonly="dialogStatus=='view'||dialogStatus=='edit'"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
                    <el-form-item label="业务类型" prop="businessType">
                        <el-select v-model="form.businessType" clearable placeholder="请选择业务类型" style="width: 100%" :disabled="dialogStatus=='view'">
          <el-option v-for="dict in dict.type.repair_label" :key="dict.value" :label="dict.label"
            :value="dict.value" />
        </el-select>
                    </el-form-item>
                </el-col>
      </el-row>

      <!-- 维修信息 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="不良现象" prop="defectDescription" >
            <el-input
              type="textarea"
              v-model="form.defectDescription"
              placeholder="请描述不良现象" :readonly="dialogStatus=='view'"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="分析原因" prop="causeAnalysis">
            <el-input
              type="textarea"
              v-model="form.causeAnalysis"
              placeholder="请输入分析原因"  :readonly="dialogStatus=='view'"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="维修描述" prop="repairDescription">
            <el-input
              type="textarea"
              v-model="form.repairDescription"
              placeholder="请输入维修描述"  :readonly="dialogStatus=='view'"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="处理方案" prop="solution">
            <el-select v-model="form.solution" clearable placeholder="请选择处理方案" style="width: 100%"  :disabled="dialogStatus=='view'">
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
            <el-input
              type="textarea"
              v-model="form.adverseEffect" :readonly="dialogStatus=='view'||dialogStatus=='edit'"
              placeholder="请输入不利影响评价"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="状态" prop="status">
            <el-tag :type="getStatusType(form.status)" v-if="form.status">
              {{ getStatusText(form.status) }}
            </el-tag>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="备注" prop="remark">
        <el-input
          type="textarea"
          v-model="form.remark"
          placeholder="请输入备注信息" :readonly="dialogStatus=='view'"
        ></el-input>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取 消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitLoading" v-if="dialogStatus!='view'"
        >确 定</el-button
      >
    </div>
  </el-dialog>
</template>

<script>
import {
  scanProductRepair,
  submitProductRepair
} from "@/api/product/productRepair";

export default {
  name: "EditDialog",
  dicts: ['repair_label','repair_solution'],
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    dialogStatus: {
      type: String,
      default: "create"
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
        adverseEffect:"",
      },
      rules: {
        barcodes: [
          {
            required: true,
            message: "请输入至少一个产品条码",
            trigger: "change"
          }
        ],
        materialSpec: [
          {  message: "请输入产品型号", trigger: "blur" }
        ],
        batchNumber: [
          { message: "请输入生产批号", trigger: "blur" }
        ],
        defectDescription: [
          { required: true, message: "请描述不良现象", trigger: "blur" }
        ],
        status: [{ required: true, message: "请选择状态", trigger: "change" }]
      },
      submitLoading: false
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
    async handleScanInput() {
      try {
        const barcode = this.barcode.trim();
        console.log(barcode, "barcode");

        // 判断条码是否已存在
        if (this.form.barcodes.includes(barcode)) {
          this.$message.warning("该条码已存在");
          this.barcode = "";
          return;
        }
        // if (!palletCode || !saleOrderNo || !materialCode || !quantity) {
        //   throw new Error('无效的托盘条码格式');
        // }

        // 调用托盘出库API
        const response = await scanProductRepair({
          barcode,
          form: this.form
        });
        if (response.code !== 200) {
          this.$message.error(response.message);
          return;
        }
        // 更新出库单信息
        if (response.data) {
          this.form["materialId"] = response.data.materialId; // 物料编码
          this.form["materialNumber"] = response.data.materialCode; // 物料编码
          this.form["materialName"] = response.data.materialName; // 物料名称
          this.form["materialSpec"] = response.data.materialSpec; // 产品型号
          this.form["batchNumber"] = response.data.productionPlanWorkOrderId
            ? response.data.productionPlanWorkOrderId.productionOrderNo
            : null; // 生产批号
            this.form["productionPlanWorkOrderId"] = response.data.productionPlanWorkOrderId?response.data.productionPlanWorkOrderId._id:null; // 工单ID
            this.form["saleOrderId"] = response.data.productionPlanWorkOrderId?response.data.productionPlanWorkOrderId.saleOrderId:null; // 销售订单ID
            this.form["saleOrderNo"] = response.data.productionPlanWorkOrderId?response.data.productionPlanWorkOrderId.saleOrderNo:null; // 销售单号
        }

        // 添加新条码
        this.form.barcodes.push(barcode);
        this.barcode = "";

        this.$message.success(response.message);
      } catch (error) {
        console.error("扫描失败:", error);
      }
    },
    initFormData() {
      if (this.dialogStatus === "edit" || this.dialogStatus === "view") {
        const formData = { ...this.rowData };
        formData.barcodes = Array.isArray(formData.barcode)
          ? formData.barcode
          : [formData.barcode];
        this.form = formData;
      } else {
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
        adverseEffect:"",
    };
      }
    },
    handleClose() {
      this.$emit("update:visible", false);
      this.$refs.form && this.$refs.form.resetFields();
    },
    handleSubmit() {
      this.$refs.form.validate(async valid => {
        if (valid) {
          this.submitLoading = true;
          try {
            //上传数据到后端处理
            let response = await submitProductRepair({
              form: this.form,
              userId: this.$store.state.user.id
            });
            console.log("response", response);
            if (response.code !== 200) {
              this.$message.error(response.message);
              return;
            }
            // const formData = { ...this.form }
            this.$emit('submit')
            this.$message.success(response.message);
            this.handleClose();
          } catch (error) {
            console.error("提交失败:", error);
            this.$message.error("提交失败");
          } finally {
            this.submitLoading = false;
          }
        }
      });
    }
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
</style>

