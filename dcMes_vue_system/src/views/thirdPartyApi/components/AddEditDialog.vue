<template>
  <el-dialog
    :title="isEdit ? '编辑接口配置' : '新增接口配置'"
    :visible.sync="localVisible"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="90px"
      size="small"
    >
      <el-form-item label="接口名称" prop="name">
        <el-input v-model="form.name" maxlength="100" show-word-limit placeholder="请输入接口名称" />
      </el-form-item>
      <el-form-item label="接口地址" prop="url">
        <el-input v-model="form.url" placeholder="请输入接口地址，如 https://example.com/api" />
      </el-form-item>
      <el-form-item label="请求方式" prop="method">
        <el-select v-model="form.method" style="width:100%">
          <el-option v-for="m in methods" :key="m" :label="m" :value="m" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :label="1">启用</el-radio>
          <el-radio :label="2">禁用</el-radio>
          <el-radio :label="3">作废</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="超时时间" prop="timeout">
        <el-input-number
          v-model="form.timeout"
          :min="5"
          :max="1200"
          :step="5"
          controls-position="right"
          style="width:160px"
        />
        <span style="margin-left:8px;color:#909399;font-size:12px">秒（5 ~ 1200s，最长 20 分钟，默认 30s）</span>
      </el-form-item>
      <el-form-item label="参数说明">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="入参描述，可说明参数格式和含义（非必填）"
        />
      </el-form-item>

      <!-- 响应成功判定条件配置 -->
      <el-form-item label="成功判定">
        <div class="success-condition-wrap">
          <el-switch
            v-model="form.successCondition.enabled"
            active-text="启用响应体字段判定"
            inactive-text="仅凭 HTTP 状态码判定"
          />
          <div v-if="form.successCondition.enabled" class="success-condition-body">
            <el-alert
              title="启用后，HTTP 请求成功时会进一步检查响应体中指定字段的值，字段值不符合条件时也将记录为失败"
              type="info"
              show-icon
              :closable="false"
              style="margin-bottom:10px"
            />
            <div class="sc-row">
              <span class="sc-label">字段路径</span>
              <el-input
                v-model="form.successCondition.field"
                placeholder="如：code 或 data.status（支持点分路径）"
                size="small"
                style="flex:1"
              />
            </div>
            <div class="sc-row">
              <span class="sc-label">判断方式</span>
              <el-select v-model="form.successCondition.operator" size="small" style="width:160px">
                <el-option label="等于（==）" value="eq" />
                <el-option label="不等于（!=）" value="neq" />
                <el-option label="包含（contains）" value="contains" />
                <el-option label="以此开头（startsWith）" value="startsWith" />
                <el-option label="非空（notEmpty）" value="notEmpty" />
              </el-select>
            </div>
            <div v-if="form.successCondition.operator !== 'notEmpty'" class="sc-row">
              <span class="sc-label">期望值</span>
              <el-input
                v-model="form.successCondition.value"
                placeholder="如：200、0、success"
                size="small"
                style="flex:1"
              />
            </div>
            <div class="sc-preview">
              <span>预览：当 </span>
              <code>{{ form.successCondition.field || '(字段)' }}</code>
              <span> {{ operatorLabel(form.successCondition.operator) }} </span>
              <code v-if="form.successCondition.operator !== 'notEmpty'">{{ form.successCondition.value || '(期望值)' }}</code>
              <span> 时视为成功</span>
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <!-- 核心信息修改警告 -->
    <el-alert
      v-if="coreChangeWarning"
      :title="coreChangeWarning"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom:12px"
    />

    <template slot="footer">
      <el-button size="small" @click="handleClose">取消</el-button>
      <el-button
        v-if="!isEdit"
        size="small"
        type="default"
        :loading="saving"
        @click="handleSubmit(false)"
      >保存</el-button>
      <el-button
        v-if="!isEdit"
        size="small"
        type="primary"
        :loading="saving"
        @click="handleSubmit(true)"
      >保存并维护参数模板</el-button>
      <el-button
        v-if="isEdit"
        size="small"
        type="primary"
        :loading="saving"
        @click="handleSubmit(false)"
      >保存</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { addApiConfig, updateApiConfig } from "@/api/thirdPartyApi";

export default {
  name: "AddEditDialog",
  props: {
    visible: { type: Boolean, default: false },
    editData: { type: Object, default: null },
  },
  data() {
    return {
      localVisible: false,
      saving: false,
      coreChangeWarning: "",
      form: {
        name: "",
        url: "",
        method: "POST",
        status: 1,
        timeout: 30,
        description: "",
        successCondition: {
          enabled: false,
          field: "",
          operator: "eq",
          value: "",
        },
      },
      methods: ["GET", "POST", "PUT", "DELETE"],
      rules: {
        name: [
          { required: true, message: "请输入接口名称", trigger: "blur" },
          { max: 100, message: "不超过100字符", trigger: "blur" },
        ],
        url: [
          { required: true, message: "请输入接口地址", trigger: "blur" },
          {
            validator: (rule, value, callback) => {
              try {
                new URL(value);
                callback();
              } catch {
                callback(new Error("请输入合法的URL，如 https://example.com/api"));
              }
            },
            trigger: "blur",
          },
        ],
        method: [{ required: true, message: "请选择请求方式", trigger: "change" }],
        status: [{ required: true, message: "请选择状态", trigger: "change" }],
      },
    };
  },
  computed: {
    isEdit() {
      return !!this.editData;
    },
  },
  watch: {
    visible(val) {
      this.localVisible = val;
      if (val) {
        this.coreChangeWarning = "";
        if (this.editData) {
          const sc = this.editData.successCondition || {};
          this.form = {
            name: this.editData.name || "",
            url: this.editData.url || "",
            method: this.editData.method || "POST",
            status: this.editData.status || 1,
            timeout: this.editData.timeout || 30,
            description: this.editData.description || "",
            successCondition: {
              enabled: !!sc.enabled,
              field: sc.field || "",
              operator: sc.operator || "eq",
              value: sc.value || "",
            },
          };
          this.originalUrl = this.editData.url;
          this.originalMethod = this.editData.method;
        } else {
          this.form = {
            name: "", url: "", method: "POST", status: 1, timeout: 30, description: "",
            successCondition: { enabled: false, field: "", operator: "eq", value: "" },
          };
        }
        this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate());
      }
    },
    localVisible(val) {
      if (!val) this.$emit("update:visible", false);
    },
  },
  methods: {
    handleSubmit(redirectTemplate) {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          if (this.isEdit) {
            const coreChanged =
              this.form.url !== this.originalUrl || this.form.method !== this.originalMethod;
            if (coreChanged) {
              this.coreChangeWarning =
                "接口核心信息修改后，已维护的参数模板可能无法正常使用，请检查并调整";
            }
            const res = await updateApiConfig(this.editData._id, this.form);
            if (res.code === 20000) {
              this.$message.success("编辑成功");
              this.$emit("saved", { redirectTemplate: false });
            } else {
              this.$message.error(res.message || "编辑失败");
            }
          } else {
            const res = await addApiConfig(this.form);
            if (res.code === 20000) {
              this.$message.success("新增成功");
              this.$emit("saved", {
                redirectTemplate,
                id: res.data._id,
                name: res.data.name,
              });
            } else {
              this.$message.error(res.message || "新增失败");
            }
          }
        } finally {
          this.saving = false;
        }
      });
    },

    handleClose() {
      this.localVisible = false;
      this.$emit("update:visible", false);
    },

    operatorLabel(op) {
      const map = {
        eq: "等于",
        neq: "不等于",
        contains: "包含",
        startsWith: "以此开头",
        notEmpty: "非空",
      };
      return map[op] || "等于";
    },
  },
};
</script>

<style scoped>
.success-condition-wrap {
  width: 100%;
}
.success-condition-body {
  margin-top: 10px;
  padding: 10px 12px;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.sc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.sc-label {
  width: 60px;
  flex-shrink: 0;
  font-size: 12px;
  color: #606266;
  text-align: right;
}
.sc-preview {
  margin-top: 6px;
  padding: 6px 10px;
  background: #ecf5ff;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}
.sc-preview code {
  background: #d9ecff;
  color: #409eff;
  padding: 1px 5px;
  border-radius: 3px;
  font-family: monospace;
}
</style>
