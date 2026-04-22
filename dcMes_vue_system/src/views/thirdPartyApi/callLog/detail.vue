<template>
  <div class="call-log-detail-container">
    <!-- 页头 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item @click.native="$router.push('/thirdPartyApi')" class="breadcrumb-link">
          接口配置管理
        </el-breadcrumb-item>
        <el-breadcrumb-item @click.native="goBack" class="breadcrumb-link">
          请求日志
        </el-breadcrumb-item>
        <el-breadcrumb-item>日志详情</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div v-loading="loading">
      <template v-if="logDetail">
        <!-- 基础信息 -->
        <el-card shadow="never" class="info-card">
          <div slot="header" class="card-header">
            <span>基础信息</span>
            <div class="header-actions">
              <el-button size="small" icon="el-icon-back" @click="goBack">返回列表</el-button>
              <el-button
                v-if="logDetail.responseStatus === 'fail' || logDetail.callMode === 2"
                size="small"
                :type="logDetail.responseStatus === 'fail' ? 'warning' : 'default'"
                icon="el-icon-refresh-right"
                :loading="retrying"
                @click="handleRetry"
              >{{ retrying ? "发送中" : (logDetail.responseStatus === 'fail' ? '重试' : '重新发送') }}</el-button>
              <el-button
                v-if="logDetail.apiConfigId"
                size="small"
                type="primary"
                icon="el-icon-video-play"
                @click="handleRecall"
              >重新调用</el-button>
              <el-button
                v-if="logDetail.callMode === 2 && logDetail.fileRecordId"
                size="small"
                icon="el-icon-download"
                :loading="downloading"
                @click="handleDownloadFile"
              >下载文件</el-button>
              <el-button
                v-if="logDetail.paramTemplateId && logDetail.templateInfo"
                size="small"
                icon="el-icon-setting"
                @click="goTemplateDetail"
              >查看参数模板</el-button>
            </div>
          </div>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="接口名称">
              {{ logDetail.apiConfigSnapshot && logDetail.apiConfigSnapshot.name || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="请求方式">
              <el-tag :type="methodTagType(logDetail.apiConfigSnapshot && logDetail.apiConfigSnapshot.method)" size="mini">
                {{ logDetail.apiConfigSnapshot && logDetail.apiConfigSnapshot.method || "-" }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="响应状态">
              <el-tag :type="logDetail.responseStatus === 'success' ? 'success' : 'danger'" size="mini">
                {{ logDetail.responseStatus === "success" ? "成功" : "失败" }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="业务单号">{{ logDetail.bizNo || "-" }}</el-descriptions-item>
            <el-descriptions-item label="销售单号">{{ logDetail.saleNo || "-" }}</el-descriptions-item>
            <el-descriptions-item label="响应耗时">{{ logDetail.duration }}ms</el-descriptions-item>
            <el-descriptions-item label="请求时间">{{ formatDate(logDetail.requestTime) }}</el-descriptions-item>
            <el-descriptions-item label="调用方式">
              {{ logDetail.callMode === 1 ? "自定义参数" : "文件调用" }}
            </el-descriptions-item>
            <el-descriptions-item label="重试次数">{{ logDetail.retryCount }}</el-descriptions-item>
            <el-descriptions-item label="请求地址" :span="3">
              <span style="word-break:break-all">{{ logDetail.requestUrl || "-" }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="参数模板">
              <template v-if="logDetail.paramTemplateSnapshot">
                <span>{{ logDetail.paramTemplateSnapshot }}</span>
                <el-button
                  v-if="logDetail.templateInfo"
                  type="text"
                  size="mini"
                  style="margin-left:8px"
                  @click="goTemplateDetail"
                >跳转模板</el-button>
              </template>
              <template v-else>无</template>
            </el-descriptions-item>
            <el-descriptions-item label="调用人">{{ logDetail.calledName || "-" }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 错误信息 -->
        <el-card v-if="logDetail.responseStatus === 'fail' && logDetail.errorMessage" shadow="never" class="info-card error-card">
          <div slot="header"><span>错误信息</span></div>
          <div class="error-msg">{{ logDetail.errorMessage }}</div>
        </el-card>

        <!-- 请求参数 / 文件信息 -->
        <el-card shadow="never" class="info-card">
          <div slot="header">
            <span>{{ logDetail.callMode === 1 ? "请求参数" : "请求文件" }}</span>
            <el-button
              v-if="logDetail.callMode === 1"
              type="text"
              size="mini"
              icon="el-icon-document-copy"
              style="margin-left:12px"
              @click="copyParams"
            >复制参数</el-button>
          </div>

          <!-- 自定义参数展示 -->
          <template v-if="logDetail.callMode === 1">
            <div class="param-type-badge">
              <el-tag type="info" size="mini">{{ paramTypeLabel(logDetail.requestParams && logDetail.requestParams.paramType) }}</el-tag>
            </div>
            <el-table
              :data="logDetail.requestParams && logDetail.requestParams.items || []"
              border
              size="small"
              style="width:100%;max-width:600px;margin-top:8px"
            >
              <el-table-column label="Key" prop="key" min-width="160" />
              <el-table-column label="Value" prop="value" min-width="200" />
            </el-table>
          </template>

          <!-- 文件展示 -->
          <template v-if="logDetail.callMode === 2 && logDetail.fileInfo">
            <el-descriptions :column="2" border size="small" style="max-width:500px">
              <el-descriptions-item label="文件名">{{ logDetail.fileInfo.fileName }}</el-descriptions-item>
              <el-descriptions-item label="文件大小">{{ formatFileSize(logDetail.fileInfo.fileSize) }}</el-descriptions-item>
              <el-descriptions-item label="上传人">{{ logDetail.fileInfo.uploadedName || "-" }}</el-descriptions-item>
              <el-descriptions-item label="上传时间">{{ formatDate(logDetail.fileInfo.uploadedAt) }}</el-descriptions-item>
            </el-descriptions>
            <el-button
              size="small"
              type="primary"
              icon="el-icon-download"
              style="margin-top:12px"
              :loading="downloading"
              @click="handleDownloadFile"
            >下载文件</el-button>
          </template>
          <template v-if="logDetail.callMode === 2 && !logDetail.fileInfo">
            <el-empty description="文件信息不存在" />
          </template>
        </el-card>

        <!-- 响应结果 -->
        <el-card shadow="never" class="info-card">
          <div slot="header">
            <span>响应结果</span>
            <el-button
              type="text"
              size="mini"
              icon="el-icon-document-copy"
              style="margin-left:12px"
              @click="copyResponse"
            >复制</el-button>
          </div>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="响应体" name="body">
              <pre class="json-highlight">{{ formattedResponseBody }}</pre>
            </el-tab-pane>
            <el-tab-pane label="响应头" name="headers">
              <pre class="json-highlight">{{ formattedResponseHeaders }}</pre>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </template>

      <el-empty v-if="!loading && !logDetail" description="日志不存在" />
    </div>

    <!-- 重新调用弹窗 -->
    <call-dialog
      :visible.sync="callDialogVisible"
      :api-config="recallApiConfig"
      :init-params="recallInitParams"
    />
  </div>
</template>

<script>
import { getCallLogDetail, retryCallLog, downloadCallLogFile, getApiConfigDetail } from "@/api/thirdPartyApi";
import CallDialog from "../components/CallDialog.vue";

export default {
  name: "CallLogDetail",
  components: { CallDialog },
  data() {
    return {
      loading: false,
      logDetail: null,
      retrying: false,
      downloading: false,
      activeTab: "body",
      callDialogVisible: false,
      recallApiConfig: null,
      recallInitParams: null,
    };
  },
  computed: {
    formattedResponseBody() {
      if (!this.logDetail || !this.logDetail.responseBody) return "";
      try {
        return JSON.stringify(JSON.parse(this.logDetail.responseBody), null, 2);
      } catch {
        return this.logDetail.responseBody;
      }
    },
    formattedResponseHeaders() {
      if (!this.logDetail || !this.logDetail.responseHeaders) return "";
      try {
        return JSON.stringify(JSON.parse(this.logDetail.responseHeaders), null, 2);
      } catch {
        return this.logDetail.responseHeaders;
      }
    },
  },
  created() {
    if (this.$route.query.id) this.loadDetail(this.$route.query.id);
  },
  methods: {
    async loadDetail(id) {
      this.loading = true;
      try {
        const res = await getCallLogDetail(id);
        if (res.code === 20000) this.logDetail = res.data;
      } finally {
        this.loading = false;
      }
    },

    goBack() {
      this.$router.push({ path: "/thirdPartyApi/callLog" });
    },

    async handleRetry() {
      this.retrying = true;
      try {
        const res = await retryCallLog(this.logDetail._id, {});
        if (res.code === 20000) {
          if (res.data.responseStatus === "success") {
            this.$message.success("重试成功");
            this.logDetail.responseStatus = "success";
            this.logDetail.responseBody = res.data.responseBody;
            this.logDetail.errorMessage = "";
            this.logDetail.duration = res.data.duration;
            this.logDetail.retryCount += 1;
          } else {
            this.$message.error("重试失败：" + (res.data.errorMessage || ""));
            this.logDetail.errorMessage = res.data.errorMessage;
          }
        } else {
          this.$message.error(res.message || "重试失败");
        }
      } finally {
        this.retrying = false;
      }
    },

    async handleRecall() {
      if (!this.logDetail.apiConfigId) {
        this.$message.warning("关联接口已删除，无法重新调用");
        return;
      }
      const res = await getApiConfigDetail(this.logDetail.apiConfigId);
      if (res.code === 20000) {
        this.recallApiConfig = res.data;
        this.recallInitParams = {
          callMode: this.logDetail.callMode,
          bizNo: this.logDetail.bizNo || "",
          saleNo: this.logDetail.saleNo || "",
          paramType: this.logDetail.requestParams && this.logDetail.requestParams.paramType,
          params: this.logDetail.requestParams && this.logDetail.requestParams.items,
          paramTemplateId: this.logDetail.paramTemplateId || "",
        };
        this.callDialogVisible = true;
      }
    },

    async handleDownloadFile() {
      this.downloading = true;
      try {
        const blob = await downloadCallLogFile(this.logDetail._id);
        const filename = (this.logDetail.fileInfo && this.logDetail.fileInfo.fileName) || "download";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.$message.success("文件下载成功");
      } catch (e) {
        this.$message.error("下载失败：" + (e.message || ""));
      } finally {
        this.downloading = false;
      }
    },

    goTemplateDetail() {
      if (!this.logDetail.templateInfo) return;
      this.$router.push({
        path: "/thirdPartyApi/paramTemplate",
        query: {
          apiConfigId: this.logDetail.templateInfo.apiConfigId,
          apiName: this.logDetail.apiConfigSnapshot && this.logDetail.apiConfigSnapshot.name,
        },
      });
    },

    copyParams() {
      const items = this.logDetail.requestParams && this.logDetail.requestParams.items;
      if (!items) return;
      const text = JSON.stringify(items, null, 2);
      navigator.clipboard
        ? navigator.clipboard.writeText(text).then(() => this.$message.success("已复制"))
        : this.$message.warning("当前环境不支持复制");
    },

    copyResponse() {
      const text = this.formattedResponseBody;
      if (!text) return;
      navigator.clipboard
        ? navigator.clipboard.writeText(text).then(() => this.$message.success("已复制"))
        : this.$message.warning("当前环境不支持复制");
    },

    methodTagType(method) {
      const map = { GET: "success", POST: "primary", PUT: "warning", DELETE: "danger" };
      return method ? map[method] || "info" : "info";
    },

    paramTypeLabel(type) {
      const map = { 1: "Query", 2: "Body form-data", 3: "Body urlencoded" };
      return map[type] || "-";
    },

    formatDate(date) {
      if (!date) return "-";
      return new Date(date).toLocaleString("zh-CN", { hour12: false });
    },

    formatFileSize(bytes) {
      if (!bytes) return "0B";
      if (bytes < 1024) return bytes + "B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
      return (bytes / (1024 * 1024)).toFixed(1) + "MB";
    },
  },
};
</script>

<style scoped>
.call-log-detail-container { padding: 16px; }
.page-header { margin-bottom: 16px; }
.breadcrumb-link { cursor: pointer; color: #409eff; }
.info-card { margin-bottom: 16px; }
.error-card .error-msg {
  color: #f56c6c;
  background: #fef0f0;
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 13px;
  word-break: break-all;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-actions { display: flex; gap: 8px; }
.param-type-badge { margin-bottom: 4px; }
.json-highlight {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 14px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  overflow: auto;
  max-height: 400px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}
</style>
