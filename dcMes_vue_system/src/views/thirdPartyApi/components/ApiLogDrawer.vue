<template>
  <el-drawer
    :title="drawerTitle"
    :visible.sync="localVisible"
    direction="rtl"
    size="780px"
    append-to-body
    :destroy-on-close="false"
    @open="handleOpen"
  >
    <!-- 过滤栏 -->
    <div class="log-drawer-body">
      <el-form :model="queryForm" inline size="small" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="queryForm.responseStatus" placeholder="全部" clearable style="width:100px" @change="handleSearch">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="fail" />
          </el-select>
        </el-form-item>
        <el-form-item label="调用方式">
          <el-select v-model="queryForm.callMode" placeholder="全部" clearable style="width:120px" @change="handleSearch">
            <el-option label="自定义参数" :value="1" />
            <el-option label="文件调用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="queryForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="yyyy-MM-dd"
            style="width:220px"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 日志表格 -->
      <el-table
        v-loading="loading"
        :data="logList"
        border
        stripe
        size="small"
        style="width:100%"
      >
        <el-table-column label="请求时间" width="155" align="center">
          <template slot-scope="{ row }">{{ formatDate(row.requestTime) }}</template>
        </el-table-column>
        <el-table-column label="调用方式" width="110" align="center">
          <template slot-scope="{ row }">
            <el-tag type="info" size="mini">{{ row.callMode === 1 ? "自定义参数" : "文件调用" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参数模板" min-width="120" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ row.paramTemplateSnapshot || "-" }}</template>
        </el-table-column>
        <el-table-column label="响应状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.responseStatus === 'success' ? 'success' : 'danger'" size="mini">
              {{ row.responseStatus === "success" ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="80" align="center">
          <template slot-scope="{ row }">{{ row.duration }}ms</template>
        </el-table-column>
        <el-table-column label="调用人" prop="calledName" width="90" align="center" />
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" icon="el-icon-view" @click="handleViewDetail(row)">详情</el-button>
            <el-tooltip
              v-if="row.responseStatus === 'fail' || row.callMode === 2"
              :content="apiConfig && apiConfig.status !== 1 ? '接口已' + (apiConfig.status === 2 ? '禁用' : '作废') + '，不可重试' : ''"
              :disabled="!apiConfig || apiConfig.status === 1"
              placement="top"
            >
              <span>
                <el-button
                  type="text"
                  size="mini"
                  icon="el-icon-refresh-right"
                  :class="row.responseStatus === 'fail' ? 'danger-text' : ''"
                  :loading="retryingId === row._id"
                  :disabled="!apiConfig || apiConfig.status !== 1"
                  @click="handleQuickRetry(row)"
                >{{ row.responseStatus === 'fail' ? '重试' : '重新发送' }}</el-button>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 日志详情内嵌对话框 -->
    <el-dialog
      title="日志详情"
      :visible.sync="detailDialogVisible"
      width="760px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div v-if="detailLog" v-loading="detailLoading">
        <!-- 基础信息 -->
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="响应状态">
            <el-tag :type="detailLog.responseStatus === 'success' ? 'success' : 'danger'" size="mini">
              {{ detailLog.responseStatus === "success" ? "成功" : "失败" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="耗时">{{ detailLog.duration }}ms</el-descriptions-item>
          <el-descriptions-item label="调用方式">
            {{ detailLog.callMode === 1 ? "自定义参数" : "文件调用" }}
          </el-descriptions-item>
          <el-descriptions-item label="请求时间">{{ formatDate(detailLog.requestTime) }}</el-descriptions-item>
          <el-descriptions-item label="重试次数">{{ detailLog.retryCount }}</el-descriptions-item>
          <el-descriptions-item label="调用人">{{ detailLog.calledName || "-" }}</el-descriptions-item>
          <el-descriptions-item label="请求地址" :span="3">
            <span style="word-break:break-all;font-size:12px">{{ detailLog.requestUrl || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="参数模板" :span="3">{{ detailLog.paramTemplateSnapshot || "无" }}</el-descriptions-item>
        </el-descriptions>

        <!-- 错误信息 -->
        <div v-if="detailLog.responseStatus === 'fail' && detailLog.errorMessage" class="error-section">
          <div class="section-label">错误信息</div>
          <div class="error-msg">{{ detailLog.errorMessage }}</div>
        </div>

        <!-- 请求参数 / 文件 -->
        <div class="section-label" style="margin-top:12px">
          {{ detailLog.callMode === 1 ? "请求参数" : "文件信息" }}
        </div>
        <template v-if="detailLog.callMode === 1">
          <el-tag type="info" size="mini" style="margin-bottom:6px">
            {{ paramTypeLabel(detailLog.requestParams && detailLog.requestParams.paramType) }}
          </el-tag>
          <el-table :data="detailLog.requestParams && detailLog.requestParams.items || []" border size="mini" style="max-width:560px">
            <el-table-column label="Key" prop="key" min-width="140" />
            <el-table-column label="Value" prop="value" min-width="180" />
          </el-table>
        </template>
        <template v-else-if="detailLog.fileInfo">
          <el-descriptions :column="2" border size="small" style="max-width:480px;margin-bottom:8px">
            <el-descriptions-item label="文件名">{{ detailLog.fileInfo.fileName }}</el-descriptions-item>
            <el-descriptions-item label="大小">{{ formatFileSize(detailLog.fileInfo.fileSize) }}</el-descriptions-item>
            <el-descriptions-item label="上传人">{{ detailLog.fileInfo.uploadedName || "-" }}</el-descriptions-item>
            <el-descriptions-item label="上传时间">{{ formatDate(detailLog.fileInfo.uploadedAt) }}</el-descriptions-item>
          </el-descriptions>
          <el-button size="small" icon="el-icon-download" :loading="downloading" @click="handleDownloadFile(detailLog)">下载文件</el-button>
        </template>

        <!-- 响应结果 -->
        <div class="section-label" style="margin-top:12px">
          <span>响应结果</span>
          <el-tag
            v-if="detailLog.successCheckMode === 'body' && detailLog.successConditionSnapshot"
            type="info"
            size="mini"
            style="margin-left:8px;cursor:default"
          >
            <el-tooltip
              :content="successConditionDesc(detailLog.successConditionSnapshot)"
              placement="top"
            >
              <span><i class="el-icon-info" style="margin-right:2px" />响应体字段判定</span>
            </el-tooltip>
          </el-tag>
        </div>
        <el-tabs v-model="activeTab" size="mini">
          <el-tab-pane label="响应体" name="body">
            <pre class="json-highlight">{{ formattedResponseBody }}</pre>
          </el-tab-pane>
          <el-tab-pane label="响应头" name="headers">
            <pre class="json-highlight">{{ formattedResponseHeaders }}</pre>
          </el-tab-pane>
        </el-tabs>
      </div>

      <span slot="footer">
        <el-tooltip
          v-if="detailLog && (detailLog.responseStatus === 'fail' || detailLog.callMode === 2)"
          :content="apiConfig && apiConfig.status !== 1 ? '接口已' + (apiConfig.status === 2 ? '禁用' : '作废') + '，不可重试' : ''"
          :disabled="!apiConfig || apiConfig.status === 1"
          placement="top"
        >
          <span>
            <el-button
              :type="detailLog && detailLog.responseStatus === 'fail' ? 'warning' : 'default'"
              size="small"
              icon="el-icon-refresh-right"
              :loading="retryingDetail"
              :disabled="!apiConfig || apiConfig.status !== 1"
              @click="handleRetryFromDetail"
            >{{ detailLog && detailLog.responseStatus === 'fail' ? '重试' : '重新发送' }}</el-button>
          </span>
        </el-tooltip>
        <el-button size="small" @click="detailDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </el-drawer>
</template>

<script>
import { getCallLogList, getCallLogDetail, retryCallLog, downloadCallLogFile } from "@/api/thirdPartyApi";

export default {
  name: "ApiLogDrawer",
  props: {
    visible: { type: Boolean, default: false },
    apiConfig: { type: Object, default: null },
  },
  data() {
    return {
      localVisible: false,
      loading: false,
      logList: [],
      pagination: { page: 1, pageSize: 10, total: 0 },
      queryForm: { responseStatus: "", callMode: "", timeRange: [] },
      retryingId: null,
      detailDialogVisible: false,
      detailLoading: false,
      detailLog: null,
      activeTab: "body",
      retryingDetail: false,
      downloading: false,
    };
  },
  computed: {
    drawerTitle() {
      return this.apiConfig ? `请求日志 — ${this.apiConfig.name}` : "请求日志";
    },
    formattedResponseBody() {
      if (!this.detailLog || !this.detailLog.responseBody) return "";
      try { return JSON.stringify(JSON.parse(this.detailLog.responseBody), null, 2); }
      catch { return this.detailLog.responseBody; }
    },
    formattedResponseHeaders() {
      if (!this.detailLog || !this.detailLog.responseHeaders) return "";
      try {
        const v = this.detailLog.responseHeaders;
        return typeof v === "object" ? JSON.stringify(v, null, 2) : JSON.stringify(JSON.parse(v), null, 2);
      } catch { return this.detailLog.responseHeaders; }
    },
  },
  watch: {
    visible(val) {
      this.localVisible = val;
    },
    localVisible(val) {
      if (!val) this.$emit("update:visible", false);
    },
  },
  methods: {
    handleOpen() {
      this.handleReset();
    },

    handleSearch() {
      this.pagination.page = 1;
      this.loadList();
    },

    handleReset() {
      this.queryForm = { responseStatus: "", callMode: "", timeRange: [] };
      this.pagination.page = 1;
      this.loadList();
    },

    async loadList() {
      if (!this.apiConfig) return;
      this.loading = true;
      try {
        const params = {
          apiConfigId: this.apiConfig._id,
          responseStatus: this.queryForm.responseStatus || undefined,
          callMode: this.queryForm.callMode || undefined,
          startTime: this.queryForm.timeRange && this.queryForm.timeRange[0]
            ? this.queryForm.timeRange[0] + " 00:00:00" : undefined,
          endTime: this.queryForm.timeRange && this.queryForm.timeRange[1]
            ? this.queryForm.timeRange[1] + " 23:59:59" : undefined,
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
        };
        const res = await getCallLogList(params);
        if (res && res.code === 20000) {
          this.logList = res.data.list;
          this.pagination.total = res.data.total;
        }
      } finally {
        this.loading = false;
      }
    },

    async handleViewDetail(row) {
      this.detailDialogVisible = true;
      this.detailLog = null;
      this.detailLoading = true;
      this.activeTab = "body";
      try {
        const res = await getCallLogDetail(row._id);
        if (res && res.code === 20000) this.detailLog = res.data;
      } finally {
        this.detailLoading = false;
      }
    },

    async handleQuickRetry(row) {
      this.retryingId = row._id;
      try {
        const res = await retryCallLog(row._id, {});
        if (res && res.code === 20000) {
          const d = res.data;
          const bodyCheckHint = d.successCheckMode === "body" && d.successCondition
            ? `（${this.successConditionDesc(d.successCondition)}）` : "";
          if (d.responseStatus === "success") {
            this.$message.success("重试成功，已生成新请求记录" + bodyCheckHint);
          } else {
            this.$message.error("重试失败：" + (d.errorMessage || "未知错误") + bodyCheckHint + "（已生成新失败记录）");
          }
          this.loadList();
        } else {
          this.$message.error((res && res.message) || "重试失败");
        }
      } finally {
        this.retryingId = null;
      }
    },

    async handleRetryFromDetail() {
      if (!this.detailLog) return;
      this.retryingDetail = true;
      try {
        const res = await retryCallLog(this.detailLog._id, {});
        if (res && res.code === 20000) {
          const d = res.data;
          const bodyCheckHint = d.successCheckMode === "body" && d.successCondition
            ? `（${this.successConditionDesc(d.successCondition)}）` : "";
          if (d.responseStatus === "success") {
            this.$message.success("重试成功，已生成新请求记录" + bodyCheckHint);
          } else {
            this.$message.error("重试失败：" + (d.errorMessage || "") + bodyCheckHint + "（已生成新失败记录）");
          }
          this.detailDialogVisible = false;
          this.loadList();
        }
      } finally {
        this.retryingDetail = false;
      }
    },

    async handleDownloadFile(log) {
      this.downloading = true;
      try {
        const blob = await downloadCallLogFile(log._id);
        const filename = (log.fileInfo && log.fileInfo.fileName) || "download";
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

    handleSizeChange(size) {
      this.pagination.pageSize = size;
      this.pagination.page = 1;
      this.loadList();
    },

    handlePageChange(page) {
      this.pagination.page = page;
      this.loadList();
    },

    successConditionDesc(sc) {
      if (!sc) return "";
      const opMap = { eq: "等于", neq: "不等于", contains: "包含", startsWith: "以此开头", notEmpty: "非空" };
      const op = opMap[sc.operator] || "等于";
      if (sc.operator === "notEmpty") return `判定依据：响应体字段 "${sc.field}" 非空`;
      return `判定依据：响应体字段 "${sc.field}" ${op} "${sc.value}"`;
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
/* 限制内容高度并允许纵向滚动，避免表格+分页超出视口无法操作 */
.log-drawer-body {
  padding: 16px;
  box-sizing: border-box;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}
.filter-form { margin-bottom: 12px; }
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
  flex-shrink: 0;
}
.danger-text { color: #e6a23c; }
.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}
.error-section { margin-top: 12px; }
.error-msg {
  background: #fef0f0;
  color: #f56c6c;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  word-break: break-all;
}
.json-highlight {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  overflow: auto;
  max-height: 260px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 6px 0 4px;
}
</style>
