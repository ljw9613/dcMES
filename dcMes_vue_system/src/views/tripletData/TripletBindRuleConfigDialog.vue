<template>
  <el-dialog
    title="条码规则启用配置"
    :visible="visible"
    width="640px"
    :close-on-click-modal="false"
    append-to-body
    @close="handleClose"
  >
    <p class="dialog-hint">
      引用条码匹配规则，绑定接口
      <code>type=1</code> 时仅执行规则中的校验项，不做提取与物料比对。
    </p>
    <el-form ref="form" label-width="140px">
      <el-form-item label="启用校验">
        <el-switch v-model="form.snValidationEnabled" />
        <span class="form-hint">开启且已选规则时，对外绑定将按规则校验 SN</span>
      </el-form-item>
      <el-form-item label="条码匹配规则">
        <el-select
          v-model="form.barcodeRuleId"
          filterable
          clearable
          placeholder="请选择 barcodeRule"
          style="width: 100%"
          :loading="rulesLoading"
        >
          <el-option
            v-for="r in ruleOptions"
            :key="String(r._id)"
            :label="ruleOptionLabel(r)"
            :value="r._id"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="loaded && remoteRuleSummary">
        <span class="form-hint">服务端当前：{{ remoteRuleSummary }}</span>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">关 闭</el-button>
      <el-button @click="reload">重新加载</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getData } from "@/api/data";
import request from "@/utils/request";

export default {
  name: "TripletBindRuleConfigDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      form: {
        snValidationEnabled: false,
        barcodeRuleId: null,
      },
      loaded: false,
      saving: false,
      rulesLoading: false,
      ruleOptions: [],
      remoteRuleSummary: "",
    };
  },
  watch: {
    visible(val) {
      if (val) {
        this.openDialog();
      }
    },
  },
  methods: {
    handleClose() {
      this.$emit("update:visible", false);
    },
    ruleOptionLabel(r) {
      const name = r.name || "(未命名)";
      // const p = r.priority != null ? `优先级 ${r.priority}` : "";
      // return p ? `${name} — ${p}` : name;
      return name;
    },
    async fetchRuleOptions() {
      this.rulesLoading = true;
      try {
        const res = await getData("barcodeRule", {
          query: JSON.stringify({ enabled: true }),
          skip: JSON.stringify(0),
          limit: JSON.stringify(500),
          sort: JSON.stringify({ priority: -1 }),
        });
        this.ruleOptions = (res && res.data) || [];
      } catch (e) {
        console.error(e);
        this.$message.error("加载条码规则列表失败");
      } finally {
        this.rulesLoading = false;
      }
    },
    async loadConfig() {
      try {
        const res = await request({
          url: "/triplet_bind_rule_config/current",
          method: "get",
        });
        const d = res && res.data;
        if (d) {
          this.form.snValidationEnabled = !!d.snValidationEnabled;
          this.form.barcodeRuleId = d.barcodeRuleId || null;
          const br = d.barcodeRule;
          this.remoteRuleSummary = br
            ? `${br.name || br._id}${br.enabled === false ? "（已禁用）" : ""}`
            : d.barcodeRuleId
            ? `规则 ID ${d.barcodeRuleId}`
            : "未选择规则";
        } else {
          this.remoteRuleSummary = "";
        }
        this.loaded = true;
      } catch (e) {
        console.error(e);
        this.$message.error("加载绑定规则配置失败");
      }
    },
    async openDialog() {
      await Promise.all([this.fetchRuleOptions(), this.loadConfig()]);
    },
    async reload() {
      await this.openDialog();
      this.$message.success("已重新加载");
    },
    async save() {
      this.saving = true;
      try {
        const body = await request({
          url: "/triplet_bind_rule_config/current",
          method: "put",
          data: {
            snValidationEnabled: this.form.snValidationEnabled,
            barcodeRuleId: this.form.barcodeRuleId || null,
          },
        });
        if (body && body.success === false) {
          this.$message.warning(body.message || "保存失败");
          return;
        }
        this.$message.success((body && body.message) || "保存成功");
        this.handleClose();
      } catch (e) {
        console.error(e);
        this.$message.error((e && e.message) || "保存失败");
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.dialog-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}
.dialog-hint code {
  font-size: 12px;
  padding: 0 4px;
  background: #f4f4f5;
  border-radius: 3px;
}
.form-hint {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}
.dialog-footer {
  text-align: right;
}
</style>
