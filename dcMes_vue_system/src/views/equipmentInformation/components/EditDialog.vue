<template>
  <el-dialog
    :title="dialogTitle"
    :visible="dialogVisible"
    width="60%"
    @close="handleClose"
    @update:visible="$emit('update:visible', $event)"
  >
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="120px"
      size="small"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="设备名称" prop="machineName">
            <el-input
              v-model="form.machineName"
              placeholder="请输入设备名称"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备编号" prop="machineCode">
            <el-input
              v-model="form.machineCode"
              placeholder="请输入设备编号"
              :disabled="autoGenerateCode"
            >
              <template #append>
                <el-button @click="toggleAutoGenerate">
                  {{ autoGenerateCode ? "手动输入" : "自动生成" }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="设备IP" prop="machineIp">
            <el-input
              v-model="form.machineIp"
              placeholder="请输入设备IP"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人" prop="principal">
            <el-input
              v-model="form.principal"
              placeholder="请输入负责人"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="产线名称" prop="lineName">
            <zr-select
              v-model="form.lineId"
              collection="production_line"
              :search-fields="['lineName', 'lineCode']"
              label-key="lineName"
              sub-key="lineCode"
              :multiple="false"
              placeholder="请输入产线名称搜索"
              @select="handleSearchLineChange"
              @click.native="handleSearchLineChange"
              clearable
              style="width: 100%"
            >
              <template #option="{ item }">
                <div class="select-option">
                  <div class="option-main">
                    <span class="option-label"
                      >{{ item.lineName }} - {{ item.lineCode }}</span
                    >
                    <el-tag size="mini" type="info" class="option-tag">
                      线路编号: {{ item.lineNum }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </zr-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="业务类型" prop="businessType">
            <el-select
              v-model="form.businessType"
              placeholder="请选择业务类型"
              clearable
              style="width: 100%"
              @change="handleBusinessTypeChange"
            >
              <!-- 添加disabled属性 -->
              <el-option
                v-for="dict in dict.type.businessType"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备类型" prop="machineType">
            <el-select
              v-model="form.machineType"
              placeholder="请选择设备类型"
              clearable
              style="width: 100%"
              :popper-append-to-body="true"
              @change="handleMachineTypeChange"
            >
              <el-option
                v-for="dict in dict.type.machine_type"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="厂区名称" prop="factoryName">
            <el-select
              v-model="form.factoryName"
              placeholder="请选择厂区名称"
              clearable
              style="width: 100%"
              :popper-append-to-body="true"
            >
              <el-option
                v-for="dict in dict.type.factoryName_type"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="form.processStepId">
        <el-col :span="24">
          <el-form-item label="关联工序信息">
            <el-card shadow="never" class="process-info-card">
              <div slot="header" class="clearfix">
                <span
                  >{{ form.processStepId.processName }} ({{
                    form.processStepId.processCode
                  }})</span
                >
                <el-tag
                  size="mini"
                  :type="getRelationshipType(form)"
                  style="margin-left: 10px"
                >
                  {{ getRelationshipLabel(form) }}
                </el-tag>
                <el-button
                  style="float: right; padding: 3px 0"
                  type="text"
                  @click="handleUnbindProcess"
                >
                  解除关联
                </el-button>
              </div>
              <div class="process-info">
                <p>
                  <strong>工序描述:</strong>
                  {{ form.processStepId.processDesc || "无" }}
                </p>
                <p>
                  <strong>生产阶级:</strong>
                  {{ form.processStepId.processStage || "无" }}
                </p>
                <p>
                  <strong>工序类型:</strong>
                  {{ form.processStepId.processType || "无" }}
                </p>
                <p>
                  <strong>工序状态:</strong>
                  {{ form.processStepId.status || "无" }}
                </p>
              </div>
            </el-card>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="form.machineType === 'tianke电子秤'">
        <el-col :span="12">
          <el-form-item label="检验值上限" prop="upperLimit">
            <el-input-number
              v-model="form.upperLimit"
              :precision="2"
              :step="0.1"
              :max="999999"
              placeholder="请输入检验值上限"
              style="width: 100%"
            >
            </el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="检验值下限" prop="lowerLimit">
            <el-input-number
              v-model="form.lowerLimit"
              :precision="2"
              :step="0.1"
              :max="999999"
              placeholder="请输入检验值下限"
              style="width: 100%"
            >
            </el-input-number>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="需要维修检验" prop="isNeedMaintain">
            <el-switch
              v-model="form.isNeedMaintain"
              active-text="是"
              inactive-text="否"
            >
            </el-switch>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="备注" prop="comment">
        <el-input
          type="textarea"
          v-model="form.comment"
          placeholder="请输入备注信息"
        ></el-input>
      </el-form-item>

      <!-- 分割线 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <hr
            style="border-top: 1px solid #dcdfe6; width: 100%; margin: 20px 0"
          />
        </el-col>
      </el-row>

      <!-- 当前生产工序 -->
      <el-row :gutter="20" v-if="dialogStatus === 'edit'">
        <el-col :span="24">
          <div class="tip-box">
            <p>请勿随意修改当前设备的当前生产工序</p>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="dialogStatus === 'edit'">
        <el-col :span="12">
          <el-form-item label="产品型号">
            <zr-select
              disabled
              v-model="form.materialId"
              collection="k3_BD_MATERIAL"
              :search-fields="['FNumber', 'FName']"
              label-key="FName"
              sub-key="FMATERIALID"
              :multiple="false"
              placeholder="请输入物料编码/名称搜索"
              @select="handleProductChange"
            >
              <template #option="{ item }">
                <div class="item-option">
                  <div class="item-info">
                    <span>{{ item.FNumber }} - {{ item.FName }}</span>
                    <el-tag size="mini" type="info"
                      >{{ item.FMATERIALID }} -{{
                        item.FUseOrgId_FName
                      }}</el-tag
                    >
                  </div>
                </div>
              </template>
            </zr-select>
          </el-form-item>

          <el-form-item label="当前生产工序">
            <el-select
              disabled
              v-model="form.processStepId"
              placeholder="当前生产工序"
              @change="handleProcessChange"
              class="custom-select"
            >
              <el-option
                v-for="item in processStepOptions"
                :key="item._id"
                :label="item.processName"
                :value="item._id"
              >
                <div class="option-content">
                  <span class="option-main">{{
                    `${item.levelPrefix || ""}${item.sort}.${item.processName}`
                  }}</span>
                  <span class="option-sub">{{ item.processCode }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取 消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitLoading"
        >确 定</el-button
      >
    </div>
  </el-dialog>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import { getAllProcessSteps } from "@/api/materialProcessFlowService";
export default {
  name: "EditDialog",
  dicts: ["machine_type", "factoryName_type", "businessType"],
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    dialogStatus: {
      type: String,
      default: "create",
    },
    rowData: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      dialogVisible: this.visible,
      form: {
        machineName: "",
        machineCode: "",
        machineIp: "",
        principal: "",
        comment: "",
        upperLimit: null,
        lowerLimit: null,
        machineType: undefined,
        isNeedMaintain: false,
        factoryName: undefined,
      },
      rules: {
        machineName: [
          { required: true, message: "请输入设备名称", trigger: "blur" },
        ],
        machineCode: [
          { required: true, message: "请输入设备编号", trigger: "blur" },
        ],
        machineIp: [
          { required: true, message: "请输入设备IP", trigger: "blur" },
        ],
        principal: [
          { required: true, message: "请输入负责人", trigger: "blur" },
        ],
        upperLimit: [
          { required: true, message: "请输入检验值上限", trigger: "blur" },
        ],
        lowerLimit: [
          { required: true, message: "请输入检验值下限", trigger: "blur" },
        ],
        machineType: [
          { required: true, message: "请选择设备类型", trigger: "change" },
        ],
        factoryName: [
          { required: true, message: "请选择厂区名称", trigger: "change" },
        ],
      },
      processStepOptions: [],
      submitLoading: false,
      processLoading: false,
      autoGenerateCode: false,
    };
  },
  computed: {
    dialogTitle() {
      return this.dialogStatus === "create" ? "新增设备信息" : "编辑设备信息";
    },
  },
  watch: {
    visible(val) {
      this.dialogVisible = val;
      if (val) {
        this.initForm();
      }
    },
    rowData: {
      handler(val) {
        if (val && Object.keys(val).length > 0 && this.dialogVisible) {
          this.initForm();
        }
      },
      deep: true,
    },
  },
  methods: {
    initForm() {
      if (
        this.dialogStatus === "edit" &&
        this.rowData &&
        Object.keys(this.rowData).length > 0
      ) {
        // 编辑模式，使用传入的行数据
        this.form = JSON.parse(JSON.stringify(this.rowData));
        this.autoGenerateCode = false; // 编辑模式下默认不自动生成

        // 如果有工序关联，获取完整的工序信息
        if (this.form.processStepId) {
          this.fetchProcessStepDetail(this.form.processStepId);
        }
      } else {
        // 新增模式，初始化表单
        this.form = {
          machineName: "",
          machineCode: "",
          machineIp: "",
          principal: "",
          lineId: "",
          lineName: "",
          lineCode: "",
          businessType: "",
          machineType: "",
          factoryName: "",
          comment: "",
          upperLimit: null,
          lowerLimit: null,
          status: false,
          isNeedMaintain: false,
        };
        this.autoGenerateCode = true;
        this.generateCode(); // 使用正确的方法名
      }
    },

    // 获取工序详细信息
    async fetchProcessStepDetail(processStepId) {
      try {
        const result = await getData("processStep", {
          query: { _id: processStepId },
          populate: JSON.stringify([
            { path: "machineId" },
            { path: "machineIds" },
          ]),
        });

        if (result.data && result.data.length > 0) {
          this.form.processStepId = result.data[0];
        }
      } catch (error) {
        console.error("获取工序详情失败:", error);
      }
    },
    // 切换自动生成编号模式
    toggleAutoGenerate() {
      this.autoGenerateCode = !this.autoGenerateCode;
      if (this.autoGenerateCode) {
        this.generateMachineCode();
      }
    },

    // 设备类型变更时自动生成编号
    handleMachineTypeChange(val) {
      if (this.autoGenerateCode) {
        this.generateMachineCode();
      }
    },

    // 生成设备编号
    generateMachineCode() {
      if (!this.form.machineType || !this.form.machineName) {
        this.$message.warning("请先填写设备类型和设备名称");
        return;
      }

      // 获取当前日期作为编号的一部分
      const date = new Date();
      const year = date.getFullYear().toString().substr(2); // 年份后两位
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");

      // 设备类型缩写（可以根据实际需求修改）
      const typeMap = {
        一体机设备: "YDC",
        检测设备: "JC",
        打印设备: "DY",
        tianke电子秤: "TK",
        // 可以添加更多设备类型的缩写
      };

      const typePrefix =
        typeMap[this.form.machineType] ||
        this.form.machineType.substr(0, 2).toUpperCase();

      // 从设备名称中提取前两个字符
      const namePrefix = this.form.machineName.substr(0, 2);

      const businessPrefix = this.form.businessType || "";

      // 生成随机数（4位）作为流水号
      const randomNum = Math.floor(1000 + Math.random() * 9000);

      // 组合编号: 类型缩写-名称前缀-业务类型-年月日-流水号
      this.form.machineCode = `${typePrefix}-${namePrefix}-${businessPrefix}-${year}${month}${day}-${randomNum}`;
    },

    // 工序选择变化处理
    handleProcessChange(processId) {
      if (!processId) {
        this.form.processStepId = "";
        return;
      }
      this.form.processStepId = processId;
    },
    //切换业务类型
    handleBusinessTypeChange(val) {
      console.log(val, "val===");
      this.form.businessType = val;
      if (this.autoGenerateCode) {
        this.generateMachineCode();
      }
    },
    // 产品型号变化处理
    async handleProductChange(material) {
      const materialId = material._id;
      this.processStepOptions = [];
      this.form.processStepId = "";
      this.form.materialId = "";

      if (!materialId) return;
      const loading = this.$loading({
        lock: true,
        text: "正在获取数据，请稍候...",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.7)",
      });
      try {
        const { data: processSteps } = await getAllProcessSteps(materialId);
        console.log("获取到的工序:", processSteps);
        this.processStepOptions = processSteps;
        this.form.materialId = materialId;
      } catch (error) {
        console.error("获取工序列表失败:", error);
        this.$message.error("获取工序列表失败");
      } finally {
        loading.close();
      }
    },

    handleSearchLineChange(val) {
      console.log(val);
      this.form.lineCode = val.lineCode;
      this.form.lineName = val.lineName;

      // 如果启用了自动生成编号，则在产线变更时也更新编号
      if (this.autoGenerateCode) {
        this.generateMachineCode();
      }
    },
    handleClose() {
      this.$emit("update:visible", false);
      this.$refs.form && this.$refs.form.resetFields();
    },
    handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          this.submitLoading = true;
          try {
            // 确保设备编号已生成
            if (this.autoGenerateCode && !this.form.machineCode) {
              this.generateMachineCode();
            }

            const formData = { ...this.form };
            this.$emit("submit", formData);
            this.handleClose();
          } catch (error) {
            console.error("提交失败:", error);
            this.$message.error("提交失败");
          } finally {
            this.submitLoading = false;
          }
        }
      });
    },
    // 获取设备与工序的关联类型
    getRelationshipType(row) {
      if (!row.processStepId) return "info";

      // 检查是否为主设备
      if (
        row.processStepId.machineId &&
        row.processStepId.machineId._id === row._id
      ) {
        return "success";
      }

      // 检查是否为关联设备
      if (
        row.processStepId.machineIds &&
        row.processStepId.machineIds.some((m) => m._id === row._id)
      ) {
        return "primary";
      }

      return "info";
    },

    // 获取设备与工序的关联标签
    getRelationshipLabel(row) {
      if (!row.processStepId) return "未关联";

      // 检查是否为主设备
      if (
        row.processStepId.machineId &&
        row.processStepId.machineId._id === row._id
      ) {
        return "主检验设备";
      }

      // 检查是否为关联设备
      if (
        row.processStepId.machineIds &&
        row.processStepId.machineIds.some((m) => m._id === row._id)
      ) {
        return "关联设备";
      }

      return "未关联";
    },

    // 解除设备与工序的关联
    async handleUnbindProcess() {
      try {
        this.$confirm("确定要解除该设备与工序的关联吗?", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        })
          .then(async () => {
            const processStepId = this.form.processStepId._id;
            const machineId = this.form._id;

            // 获取工序详情
            const processStep = await getData("processStep", {
              query: { _id: processStepId },
              populate: JSON.stringify([
                { path: "machineId" },
                { path: "machineIds" },
              ]),
            });

            if (processStep.data && processStep.data.length > 0) {
              const process = processStep.data[0];
              const updateData = {};

              // 如果是主设备，清除主设备关联
              if (process.machineId && process.machineId._id === machineId) {
                updateData.machineId = null;
              }

              // 如果是关联设备，从关联设备列表中移除
              if (process.machineIds && process.machineIds.length > 0) {
                updateData.machineIds = process.machineIds
                  .filter((m) => m._id !== machineId)
                  .map((m) => m._id);
              }

              // 更新工序
              await updateData("processStep", {
                query: { _id: processStepId },
                update: updateData,
              });

              // 更新设备
              await updateData("machine", {
                query: { _id: machineId },
                update: {
                  processStepId: null,
                  materialId: null,
                },
              });

              this.$message.success("解除关联成功");

              // 更新表单数据
              this.form.processStepId = null;
              this.form.materialId = null;
            }
          })
          .catch(() => {
            this.$message.info("已取消操作");
          });
      } catch (error) {
        console.error("解除关联失败:", error);
        this.$message.error("解除关联失败: " + error.message);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.tip-box {
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 4px;
  padding: 8px 16px;
  margin: 0 0 20px 0;

  p {
    color: #e6a23c;
    font-size: 13px;
    margin: 0;
    line-height: 1.5;
    display: flex;
    align-items: center;

    &::before {
      content: "⚠️";
      margin-right: 8px;
    }
  }
}

.process-info-card {
  margin-bottom: 10px;

  .process-info {
    p {
      margin: 5px 0;
    }
  }
}
</style>
