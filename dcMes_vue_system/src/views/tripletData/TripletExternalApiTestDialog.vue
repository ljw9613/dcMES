<template>
  <el-dialog
    title="对外接口测试"
    :visible="visible"
    width="640px"
    :close-on-click-modal="false"
    append-to-body
    @close="handleClose"
  >
    <p class="api-test-hint">
      POST <code>/api/v1/tripletData</code>，使用原生 <code>fetch</code>，不携带登录 Token。
    </p>
    <el-form label-width="72px">
      <el-form-item label="sn">
        <el-input v-model="testForm.sn" placeholder="设备序列号" clearable />
      </el-form-item>
      <el-form-item label="type">
        <el-select v-model="testForm.type" style="width: 100%">
          <el-option label="1 绑定" value="1" />
          <el-option label="2 查询" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="testLoading" @click="runApiTest">
          发送请求
        </el-button>
      </el-form-item>
    </el-form>
    <div class="test-response-label">响应 JSON</div>
    <pre class="test-response-body">{{ testResponseText }}</pre>
    <div slot="footer">
      <el-button @click="handleClose">关 闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "TripletExternalApiTestDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      testForm: {
        sn: "",
        type: "1",
      },
      testLoading: false,
      testResponseText: "（尚未请求）",
    };
  },
  methods: {
    handleClose() {
      this.$emit("update:visible", false);
    },
    async runApiTest() {
      const base = process.env.VUE_APP_BASE_API || "";
      const url = `${base.replace(/\/$/, "")}/tripletData`;
      this.testLoading = true;
      this.testResponseText = "请求中…";
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sn: this.testForm.sn,
            type: this.testForm.type,
          }),
        });
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          this.testResponseText = JSON.stringify(json, null, 2);
        } catch {
          this.testResponseText = text;
        }
      } catch (e) {
        this.testResponseText = String(e.message || e);
        this.$message.error("请求失败（检查跨域或后端地址）");
      } finally {
        this.testLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.api-test-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}
.api-test-hint code {
  font-size: 12px;
  padding: 1px 6px;
  background: #f5f7fa;
  border-radius: 3px;
}
.test-response-label {
  margin: 8px 0 4px;
  color: #606266;
  font-size: 13px;
}
.test-response-body {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  max-height: 320px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}
</style>
