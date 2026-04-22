<template>
  <el-dialog
    :visible.sync="localVisible"
    :title="dialogTitle"
    :width="isMaximized ? '100%' : '900px'"
    :fullscreen="isMaximized"
    append-to-body
    :close-on-click-modal="false"
    custom-class="call-dialog"
    @close="handleClose"
  >
    <!-- 自定义标题栏（含最大化按钮） -->
    <span slot="title" class="call-dialog-title-slot">
      <span class="dialog-title-text">调用接口</span>
      <!-- <i
        :class="isMaximized ? 'el-icon-copy-document' : 'el-icon-full-screen'"
        class="dialog-max-icon"
        @click.stop="toggleMaximize"
      /> -->
    </span>

    <!-- 接口基础信息 -->
    <div v-if="apiConfig" class="api-info-bar">
      <span class="api-name">{{ apiConfig.name }}</span>
      <el-tag :type="methodTagType(apiConfig.method)" size="mini" style="margin:0 8px">
        {{ apiConfig.method }}
      </el-tag>
      <span class="api-url">{{ apiConfig.url }}</span>
      <el-tooltip :content="`接口请求超时时间：${apiConfig.timeout || 30} 秒`" placement="top">
        <el-tag type="info" size="mini" style="margin-left:auto;flex-shrink:0;cursor:default">
          <i class="el-icon-time" style="margin-right:2px" />{{ apiConfig.timeout || 30 }}s
        </el-tag>
      </el-tooltip>
    </div>

    <!-- 模式切换 + 模板选择 -->
    <div class="mode-switch-bar">
      <el-radio-group v-model="callMode" size="small" @change="handleModeChange">
        <el-radio-button :label="1">自定义参数</el-radio-button>
        <el-radio-button :label="2">文件调用</el-radio-button>
      </el-radio-group>

      <div v-if="callMode === 1" class="template-selector">
        <span class="tpl-label">选择参数模板：</span>
        <el-select
          v-model="selectedTemplateId"
          placeholder="选择后自动填充参数"
          size="small"
          clearable
          filterable
          style="width:200px"
          @change="handleTemplateSelect"
        >
          <el-option
            v-for="tpl in templateList"
            :key="tpl._id"
            :label="tpl.name"
            :value="tpl._id"
          >
            <span>{{ tpl.name }}</span>
            <span style="float:right;color:#999;font-size:11px">{{ paramTypeLabel(tpl.paramType) }}</span>
          </el-option>
        </el-select>
        <el-button type="text" size="mini" icon="el-icon-setting" style="margin-left:8px" @click="goTemplateManage">
          模板管理
        </el-button>
      </div>
    </div>

    <!-- ─ 内容区域 ─ -->
    <div
      class="call-dialog-body"
      v-loading="calling"
      element-loading-text="接口调用中，请稍候..."
      element-loading-spinner="el-icon-loading"
      element-loading-background="rgba(255,255,255,0.88)"
    >

      <!-- 模式一：自定义参数 -->
      <template v-if="callMode === 1">
        <div class="section-title">
          <span>参数类型</span>
          <el-radio-group v-model="paramType" size="mini" style="margin-left:12px">
            <el-radio-button :label="1">Query</el-radio-button>
            <el-radio-button :label="2">Body form-data</el-radio-button>
            <el-radio-button :label="3">Body urlencoded</el-radio-button>
            <el-radio-button :label="4">Body JSON</el-radio-button>
          </el-radio-group>
        </div>

        <div class="params-table-wrap">
          <div class="params-header">
            <span class="params-label">参数列表</span>
            <div>
              <el-button type="text" size="mini" icon="el-icon-plus" @click="addParam">添加参数</el-button>
              <el-button type="text" size="mini" icon="el-icon-delete" @click="clearParams">清空</el-button>
            </div>
          </div>
          <el-table :data="paramRows" border size="mini" style="width:100%">
            <el-table-column label="Key" min-width="160">
              <template slot-scope="{ row }">
                <el-input v-model="row.key" placeholder="参数名" size="mini" />
              </template>
            </el-table-column>
            <el-table-column label="Value" min-width="200">
              <template slot-scope="{ row }">
                <el-input v-model="row.value" placeholder="参数值" size="mini" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60" align="center">
              <template slot-scope="{ $index }">
                <el-button type="text" size="mini" icon="el-icon-delete" @click="removeParam($index)" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <!-- 模式二：文件调用 -->
      <template v-if="callMode === 2">
        <div class="file-upload-area">

          <!-- 已选中文件时：显示文件卡片，隐藏上传区域 -->
          <template v-if="selectedFile || selectedHistoryFile">
            <div class="selected-file-card">
              <i class="el-icon-document selected-file-icon" />
              <div class="selected-file-info">
                <div class="selected-file-name">
                  {{ selectedFile ? selectedFile.name : selectedHistoryFile.fileName }}
                  <el-tag v-if="selectedHistoryFile" type="info" size="mini" style="margin-left:6px">历史文件</el-tag>
                </div>
                <div class="selected-file-meta">
                  {{ formatFileSize(selectedFile ? selectedFile.size : selectedHistoryFile.fileSize) }}
                  <span v-if="selectedHistoryFile" style="margin-left:8px">
                    {{ formatDate(selectedHistoryFile.uploadedAt) }}
                  </span>
                </div>
              </div>
              <el-button
                v-if="selectedHistoryFile"
                type="text"
                size="mini"
                icon="el-icon-download"
                :loading="downloadingFileId === selectedHistoryFile._id"
                style="margin-left:8px"
                @click="handleDownloadHistoryFile(selectedHistoryFile)"
              >下载</el-button>
              <el-button
                type="text"
                size="mini"
                icon="el-icon-delete"
                class="selected-file-remove"
                @click="clearSelectedFile"
              >移除</el-button>
            </div>
          </template>

          <!-- 未选文件时：显示上传组件 + 历史记录 -->
          <template v-else>
            <el-upload
              ref="uploadRef"
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :limit="1"
              :file-list="fileList"
              drag
            >
              <i class="el-icon-upload" />
              <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
              <div slot="tip" class="el-upload__tip">单个文件，大小 ≤ 20MB，格式不限</div>
            </el-upload>

            <div v-if="historyFiles.length > 0" class="history-files">
              <div class="history-title">最近10次文件请求记录（点击重用）：</div>
              <div class="history-list">
                <div
                  v-for="hf in historyFiles"
                  :key="hf._id"
                  class="history-file-item"
                  @click="selectHistoryFile(hf)"
                >
                  <i class="el-icon-document" />
                  <span class="hf-name">{{ hf.fileName }}</span>
                  <span class="file-size">{{ formatFileSize(hf.fileSize) }}</span>
                  <span class="file-date">{{ formatDate(hf.uploadedAt) }}</span>
                  <el-button
                    type="text"
                    size="mini"
                    icon="el-icon-download"
                    :loading="downloadingFileId === hf._id"
                    class="hf-download-btn"
                    @click.stop="handleDownloadHistoryFile(hf)"
                  >下载</el-button>
                </div>
              </div>
            </div>
          </template>

        </div>

        <!-- 附加参数（可选） -->
        <div class="file-extra-params-wrap">
          <div class="extra-params-toggle" @click="showFileExtraParams = !showFileExtraParams">
            <i :class="showFileExtraParams ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" style="margin-right:4px" />
            <span>附加参数（可选）</span>
            <el-tag
              v-if="fileExtraParams.some(p => p.key && p.key.trim())"
              type="primary"
              size="mini"
              style="margin-left:8px"
            >
              {{ fileExtraParams.filter(p => p.key && p.key.trim()).length }} 项
            </el-tag>
          </div>

          <div v-if="showFileExtraParams" class="extra-params-body">
            <div class="extra-params-type-row">
              <span style="font-size:12px;color:#606266;margin-right:8px">参数位置：</span>
              <el-radio-group v-model="fileExtraParamType" size="mini">
                <el-radio-button label="query">Query（追加到 URL）</el-radio-button>
                <el-radio-button label="form">Form 字段（随文件一起发送）</el-radio-button>
              </el-radio-group>
            </div>
            <div class="params-table-wrap" style="margin-top:8px">
              <div class="params-header">
                <span class="params-label">参数列表</span>
                <div>
                  <el-button type="text" size="mini" icon="el-icon-plus" @click="addFileExtraParam">添加</el-button>
                  <el-button type="text" size="mini" icon="el-icon-delete" @click="clearFileExtraParams">清空</el-button>
                </div>
              </div>
              <el-table :data="fileExtraParams" border size="mini" style="width:100%">
                <el-table-column label="Key" min-width="150">
                  <template slot-scope="{ row }">
                    <el-input v-model="row.key" placeholder="参数名" size="mini" />
                  </template>
                </el-table-column>
                <el-table-column label="Value" min-width="180">
                  <template slot-scope="{ row }">
                    <el-input v-model="row.value" placeholder="参数值" size="mini" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="60" align="center">
                  <template slot-scope="{ $index }">
                    <el-button type="text" size="mini" icon="el-icon-delete" @click="removeFileExtraParam($index)" />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </template>

      <!-- 调用进度卡片（调用中时显示） -->
      <transition name="call-fade">
        <div v-if="calling" class="calling-progress-card">
          <div class="calling-progress-header">
            <i class="el-icon-loading calling-spin-icon" />
            <span class="calling-progress-title">接口调用中</span>
            <span class="calling-elapsed-text">已耗时 <b>{{ elapsedSeconds }}</b> 秒</span>
            <span class="calling-timeout-text">/ 超时 {{ timeoutSeconds }} 秒</span>
          </div>
          <el-progress
            :percentage="timeoutProgress"
            :color="progressBarColor"
            :show-text="false"
            :stroke-width="4"
            style="margin-top:8px"
          />
          <div class="calling-progress-tip">请求已转发至目标服务器，请等待响应结果...</div>
        </div>
      </transition>

      <!-- 响应结果区域 -->
      <div v-if="responseResult" class="response-area">
        <div class="response-header">
          <span class="response-title">响应结果</span>
          <el-tag
            :type="responseResult.responseStatus === 'success' ? 'success' : 'danger'"
            size="mini"
          >
            {{ responseResult.responseStatus === "success" ? "成功" : "失败" }}
          </el-tag>
          <!-- 成功判定方式说明 -->
          <el-tooltip
            v-if="responseResult.successCheckMode === 'body' && responseResult.successCondition"
            placement="top"
            :content="successConditionDesc(responseResult.successCondition)"
          >
            <el-tag type="info" size="mini" style="cursor:default">
              <i class="el-icon-info" style="margin-right:2px" />响应体字段判定
            </el-tag>
          </el-tooltip>
          <span class="duration">耗时：{{ responseResult.duration }}ms</span>
          <el-button type="text" size="mini" icon="el-icon-document-copy" @click="copyResponse">复制</el-button>
        </div>

        <div v-if="responseResult.errorMessage" class="error-msg">{{ responseResult.errorMessage }}</div>

        <el-tabs v-model="activeResponseTab" size="mini" style="padding:0 12px">
          <el-tab-pane label="响应体" name="body">
            <pre class="json-highlight">{{ formattedResponseBody }}</pre>
          </el-tab-pane>
          <el-tab-pane label="响应头" name="headers">
            <pre class="json-highlight">{{ formattedResponseHeaders }}</pre>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 底部操作 -->
    <div slot="footer" class="call-footer">
      <div class="call-footer-left">
        <el-button
          v-if="callMode === 1 && !calling"
          size="small"
          icon="el-icon-circle-plus-outline"
          @click="handleSaveTemplate"
        >保存为模板</el-button>
        <!-- 调用中状态提示 -->
        <transition name="call-fade">
          <span v-if="calling" class="footer-calling-status">
            <i class="el-icon-loading" style="margin-right:5px;color:#409eff" />
            <span style="color:#409eff;font-size:12px">调用中... {{ elapsedSeconds }}s</span>
            <el-divider direction="vertical" />
            <span style="color:#909399;font-size:12px">超时上限 {{ timeoutSeconds }}s</span>
          </span>
        </transition>
      </div>
      <div>
        <el-button size="small" :disabled="calling" @click="handleClose">关闭</el-button>
        <el-button
          type="primary"
          size="small"
          icon="el-icon-video-play"
          :loading="calling"
          @click="handleCall"
        >{{ calling ? "调用中..." : "调用" }}</el-button>
      </div>
    </div>

    <!-- 保存模板子弹窗 -->
    <el-dialog
      title="保存为参数模板"
      :visible.sync="saveTemplateDialogVisible"
      width="420px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form :model="saveTemplateForm" :rules="saveTemplateRules" ref="saveTemplateForm" size="small" label-width="90px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="saveTemplateForm.name" maxlength="50" show-word-limit placeholder="请输入模板名称" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="saveTemplateDialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="savingTemplate" @click="confirmSaveTemplate">确定</el-button>
      </span>
    </el-dialog>
  </el-dialog>
</template>

<script>
import {
  callApiConfig,
  getParamTemplateList,
  addParamTemplate,
  getApiFileRecords,
  downloadApiFileRecord,
} from "@/api/thirdPartyApi";

export default {
  name: "CallDialog",
  props: {
    visible: { type: Boolean, default: false },
    apiConfig: { type: Object, default: null },
    initParams: { type: Object, default: null },
  },
  data() {
    return {
      localVisible: false,
      callMode: 1,
      paramType: 1,
      paramRows: [{ key: "", value: "" }],
      selectedTemplateId: "",
      templateList: [],
      fileList: [],
      selectedFile: null,
      historyFiles: [],
      selectedHistoryFile: null,
      downloadingFileId: null,
      showFileExtraParams: false,
      fileExtraParamType: "query",
      fileExtraParams: [{ key: "", value: "" }],
      calling: false,
      elapsedSeconds: 0,
      elapsedTimer: null,
      responseResult: null,
      activeResponseTab: "body",
      isMaximized: false,
      saveTemplateDialogVisible: false,
      savingTemplate: false,
      saveTemplateForm: { name: "" },
      saveTemplateRules: {
        name: [
          { required: true, message: "请输入模板名称", trigger: "blur" },
          { max: 50, message: "不超过50字符", trigger: "blur" },
        ],
      },
    };
  },
  computed: {
    dialogTitle() {
      return "";
    },
    timeoutSeconds() {
      return (this.apiConfig && this.apiConfig.timeout) || 30;
    },
    timeoutProgress() {
      const pct = Math.round((this.elapsedSeconds / this.timeoutSeconds) * 100);
      return Math.min(pct, 99);
    },
    progressBarColor() {
      if (this.timeoutProgress < 60) return "#409eff";
      if (this.timeoutProgress < 85) return "#e6a23c";
      return "#f56c6c";
    },
    formattedResponseBody() {
      if (!this.responseResult || !this.responseResult.responseBody) return "";
      try {
        return JSON.stringify(JSON.parse(this.responseResult.responseBody), null, 2);
      } catch {
        return this.responseResult.responseBody;
      }
    },
    formattedResponseHeaders() {
      if (!this.responseResult || !this.responseResult.responseHeaders) return "";
      if (typeof this.responseResult.responseHeaders === "object") {
        return JSON.stringify(this.responseResult.responseHeaders, null, 2);
      }
      try {
        return JSON.stringify(JSON.parse(this.responseResult.responseHeaders), null, 2);
      } catch {
        return this.responseResult.responseHeaders;
      }
    },
  },
  watch: {
    visible(val) {
      this.localVisible = val;
      if (val) {
        this.resetState();
        this.loadTemplates();
        this.loadHistoryFiles();
        if (this.initParams) {
          this.applyInitParams();
        }
      }
    },
    localVisible(val) {
      if (!val) this.$emit("update:visible", false);
    },
  },
  methods: {
    resetState() {
      this.callMode = 1;
      this.paramType = 1;
      this.paramRows = [{ key: "", value: "" }];
      this.selectedTemplateId = "";
      this.fileList = [];
      this.selectedFile = null;
      this.selectedHistoryFile = null;
      this.showFileExtraParams = false;
      this.fileExtraParamType = "query";
      this.fileExtraParams = [{ key: "", value: "" }];
      this.calling = false;
      this.elapsedSeconds = 0;
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
      this.responseResult = null;
      this.activeResponseTab = "body";
      this.isMaximized = false;
    },

    applyInitParams() {
      const p = this.initParams;
      if (p.callMode) this.callMode = p.callMode;
      if (p.paramType) this.paramType = p.paramType;
      if (p.params && Array.isArray(p.params)) {
        this.paramRows = p.params.length > 0 ? p.params.map((x) => ({ key: x.key || "", value: x.value || "" })) : [{ key: "", value: "" }];
      }
      if (p.paramTemplateId) this.selectedTemplateId = p.paramTemplateId;
      // 文件模式附加参数回显
      if (p.fileQueryParams && p.fileQueryParams.length > 0) {
        this.fileExtraParamType = "query";
        this.fileExtraParams = p.fileQueryParams.map((x) => ({ key: x.key || "", value: x.value || "" }));
        this.showFileExtraParams = true;
      } else if (p.fileBodyParams && p.fileBodyParams.length > 0) {
        this.fileExtraParamType = "form";
        this.fileExtraParams = p.fileBodyParams.map((x) => ({ key: x.key || "", value: x.value || "" }));
        this.showFileExtraParams = true;
      }
    },

    async loadTemplates() {
      if (!this.apiConfig) return;
      try {
        const res = await getParamTemplateList(this.apiConfig._id);
        if (res && res.code === 20000) {
          this.templateList = res.data || [];
          // 无 initParams 时自动带出最新模版（按 updatedAt 倒序取第一个）
          if (this.templateList.length > 0 && !this.selectedTemplateId && !this.initParams) {
            const sorted = [...this.templateList].sort((a, b) =>
              new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
            );
            const latestTpl = sorted[0];
            this.selectedTemplateId = latestTpl._id;
            this.handleTemplateSelect(latestTpl._id);
          }
        }
      } catch (e) {
        console.error("loadTemplates error", e);
      }
    },

    async loadHistoryFiles() {
      if (!this.apiConfig) return;
      try {
        const res = await getApiFileRecords(this.apiConfig._id);
        if (res && res.code === 20000) this.historyFiles = res.data || [];
      } catch (e) {
        console.error("loadHistoryFiles error", e);
      }
    },

    handleModeChange() {
      this.responseResult = null;
      this.selectedHistoryFile = null;
    },

    handleTemplateSelect(templateId) {
      if (!templateId) return;
      const tpl = this.templateList.find((t) => t._id === templateId);
      if (!tpl) return;
      this.paramType = tpl.paramType;
      this.paramRows = tpl.params && tpl.params.length > 0
        ? tpl.params.map((p) => ({ key: p.key || "", value: p.value || "" }))
        : [{ key: "", value: "" }];
    },

    addParam() {
      this.paramRows.push({ key: "", value: "" });
    },

    removeParam(index) {
      this.paramRows.splice(index, 1);
      if (this.paramRows.length === 0) this.paramRows.push({ key: "", value: "" });
    },

    clearParams() {
      this.paramRows = [{ key: "", value: "" }];
    },

    addFileExtraParam() {
      this.fileExtraParams.push({ key: "", value: "" });
    },
    removeFileExtraParam(idx) {
      this.fileExtraParams.splice(idx, 1);
      if (!this.fileExtraParams.length) this.fileExtraParams.push({ key: "", value: "" });
    },
    clearFileExtraParams() {
      this.fileExtraParams = [{ key: "", value: "" }];
    },

    handleFileChange(file) {
      if (file.raw && file.raw.size > 20 * 1024 * 1024) {
        this.$message.error("文件大小不能超过20MB");
        this.$refs.uploadRef && this.$refs.uploadRef.clearFiles();
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file.raw;
      this.selectedHistoryFile = null;
    },

    handleFileRemove() {
      this.selectedFile = null;
    },

    selectHistoryFile(hf) {
      this.selectedHistoryFile = hf;
      this.selectedFile = null;
      this.fileList = [];
      if (this.$refs.uploadRef) this.$refs.uploadRef.clearFiles();
    },

    clearSelectedFile() {
      this.selectedFile = null;
      this.selectedHistoryFile = null;
      this.fileList = [];
      if (this.$refs.uploadRef) this.$refs.uploadRef.clearFiles();
    },

    async handleDownloadHistoryFile(hf) {
      this.downloadingFileId = hf._id;
      try {
        const blob = await downloadApiFileRecord(hf._id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = hf.fileName || "download";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.$message.success("文件下载成功");
      } catch (e) {
        this.$message.error("下载失败：" + (e.message || ""));
      } finally {
        this.downloadingFileId = null;
      }
    },

    async handleCall() {
      if (!this.apiConfig) {
        this.$message.warning("接口配置信息缺失，请重新打开");
        return;
      }
      this.calling = true;
      this.elapsedSeconds = 0;
      this.responseResult = null;
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = setInterval(() => { this.elapsedSeconds++; }, 1000);
      try {
        let res;
        if (this.callMode === 2) {
          // 文件模式
          if (!this.selectedFile && !this.selectedHistoryFile) {
            this.$message.warning("请选择要上传的文件");
            return;
          }
          const fd = new FormData();
          if (this.selectedFile) {
            fd.append("file", this.selectedFile);
          } else {
            fd.append("useHistoryFileId", this.selectedHistoryFile._id);
          }
          // 附加参数
          const validExtra = this.fileExtraParams.filter((p) => p.key && p.key.trim());
          if (validExtra.length > 0) {
            const fieldName = this.fileExtraParamType === "query" ? "fileQueryParams" : "fileBodyParams";
            fd.append(fieldName, JSON.stringify(validExtra));
          }
          res = await callApiConfig(this.apiConfig._id, fd, true, this.timeoutSeconds);
        } else {
          // 自定义参数模式
          const validParams = this.paramRows.filter((p) => p.key && p.key.trim());
          const payload = {
            paramType: this.paramType,
            params: JSON.stringify(validParams),
            paramTemplateId: this.selectedTemplateId || "",
          };
          res = await callApiConfig(this.apiConfig._id, payload, false, this.timeoutSeconds);
        }

        if (res && res.code === 20000) {
          this.responseResult = res.data;
          if (res.data.responseStatus === "success") {
            this.$message.success("调用成功");
          } else {
            this.$message.error("调用失败：" + (res.data.errorMessage || "未知错误"));
          }
        } else {
          this.$message.error((res && res.message) || "调用请求失败");
        }
      } catch (err) {
        console.error("handleCall error:", err);
        this.$message.error("调用异常：" + (err.message || err));
      } finally {
        clearInterval(this.elapsedTimer);
        this.elapsedTimer = null;
        this.calling = false;
      }
    },

    copyResponse() {
      const text = this.formattedResponseBody;
      if (!text) return;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => this.$message.success("已复制")).catch(() => this.$message.warning("复制失败"));
      } else {
        this.$message.warning("当前环境不支持复制");
      }
    },

    handleSaveTemplate() {
      this.saveTemplateForm.name = "";
      this.saveTemplateDialogVisible = true;
      this.$nextTick(() => this.$refs.saveTemplateForm && this.$refs.saveTemplateForm.clearValidate());
    },

    confirmSaveTemplate() {
      this.$refs.saveTemplateForm.validate(async (valid) => {
        if (!valid) return;
        this.savingTemplate = true;
        try {
          const validParams = this.paramRows.filter((p) => p.key && p.key.trim());
          const res = await addParamTemplate({
            apiConfigId: this.apiConfig._id,
            name: this.saveTemplateForm.name,
            paramType: this.paramType,
            params: validParams,
          });
          if (res && res.code === 20000) {
            this.$message.success("模板保存成功");
            this.saveTemplateDialogVisible = false;
            this.loadTemplates();
          } else {
            this.$message.error((res && res.message) || "保存失败");
          }
        } finally {
          this.savingTemplate = false;
        }
      });
    },

    goTemplateManage() {
      this.handleClose();
      this.$router.push({
        path: "/thirdPartyApi/paramTemplate",
        query: { apiConfigId: this.apiConfig._id, apiName: this.apiConfig.name },
      });
    },

    handleClose() {
      this.localVisible = false;
    },

    toggleMaximize() {
      this.isMaximized = !this.isMaximized;
    },

    successConditionDesc(sc) {
      if (!sc) return "";
      const opMap = { eq: "等于", neq: "不等于", contains: "包含", startsWith: "以此开头", notEmpty: "非空" };
      const op = opMap[sc.operator] || "等于";
      if (sc.operator === "notEmpty") return `判定依据：响应体字段 "${sc.field}" 非空`;
      return `判定依据：响应体字段 "${sc.field}" ${op} "${sc.value}"`;
    },

    methodTagType(method) {
      const map = { GET: "success", POST: "primary", PUT: "warning", DELETE: "danger" };
      return map[method] || "info";
    },

    paramTypeLabel(type) {
      const map = { 1: "Query", 2: "form-data", 3: "urlencoded", 4: "JSON" };
      return map[type] || "-";
    },

    formatFileSize(bytes) {
      if (!bytes) return "0B";
      if (bytes < 1024) return bytes + "B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
      return (bytes / (1024 * 1024)).toFixed(1) + "MB";
    },

    formatDate(date) {
      if (!date) return "";
      return new Date(date).toLocaleString("zh-CN", { hour12: false });
    },
  },
};
</script>

<style>
/* 非 scoped：覆盖 el-dialog 内部样式 */
.call-dialog .el-dialog__header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}
.call-dialog .el-dialog__body {
  padding: 0;
  overflow-y: auto;
  max-height: calc(80vh - 130px);
}
.call-dialog .el-dialog__footer {
  padding: 10px 16px;
  border-top: 1px solid #ebeef5;
  background: #f5f7fa;
}
</style>

<style scoped>
.call-dialog-title-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.dialog-title-text { font-size: 15px; font-weight: 600; color: #303133; }
.dialog-max-icon {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
  margin-right: 8px;
}
.dialog-max-icon:hover { color: #409eff; }
.api-info-bar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: #ecf5ff;
  border-bottom: 1px solid #d9ecff;
  flex-wrap: wrap;
  gap: 4px;
}
.api-name { font-weight: 600; color: #303133; }
.api-url { color: #606266; font-size: 12px; word-break: break-all; }
.mode-switch-bar {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #ebeef5;
  gap: 16px;
  flex-wrap: wrap;
}
.template-selector { display: flex; align-items: center; gap: 4px; }
.tpl-label { color: #606266; font-size: 13px; white-space: nowrap; }
.call-dialog-body { padding: 16px; }
.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}
.params-table-wrap { border: 1px solid #ebeef5; border-radius: 4px; overflow: hidden; }
.params-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}
.params-label { font-size: 12px; color: #606266; }
.file-upload-area { max-width: 560px; }
.selected-file-card {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid #d9ecff;
  border-radius: 6px;
  background: #ecf5ff;
  gap: 10px;
}
.selected-file-icon { font-size: 24px; color: #409eff; flex-shrink: 0; }
.selected-file-info { flex: 1; min-width: 0; }
.selected-file-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
}
.selected-file-meta { font-size: 12px; color: #909399; margin-top: 3px; }
.selected-file-remove { color: #f56c6c; flex-shrink: 0; }
.selected-file-remove:hover { color: #f56c6c; opacity: 0.8; }
.history-files { margin-top: 14px; }
.history-title { font-size: 12px; color: #606266; margin-bottom: 6px; }
.history-list { max-height: 160px; overflow-y: auto; }
.history-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 4px;
  cursor: pointer;
  font-size: 12px;
}
.history-file-item:hover,
.history-file-item.selected { border-color: #409eff; background: #ecf5ff; }
.hf-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.file-size { color: #909399; white-space: nowrap; }
.file-date { color: #c0c4cc; white-space: nowrap; }
.hf-download-btn { padding: 0 4px; margin-left: 4px; color: #409eff; flex-shrink: 0; }
.file-extra-params-wrap {
  margin-top: 14px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  max-width: 560px;
}
.extra-params-toggle {
  display: flex;
  align-items: center;
  padding: 7px 12px;
  background: #f5f7fa;
  cursor: pointer;
  font-size: 13px;
  color: #303133;
  user-select: none;
}
.extra-params-toggle:hover { background: #ecf5ff; }
.extra-params-body { padding: 10px 12px; }
.extra-params-type-row { display: flex; align-items: center; margin-bottom: 6px; }
.response-area {
  margin-top: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}
.response-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  gap: 10px;
}
.response-title { font-weight: 600; font-size: 13px; }
.duration { font-size: 12px; color: #909399; }
.error-msg {
  padding: 8px 12px;
  background: #fef0f0;
  color: #f56c6c;
  font-size: 12px;
}
.json-highlight {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  overflow: auto;
  max-height: 280px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 8px 0 4px;
}
.call-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.call-footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.footer-calling-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 调用进度卡片 */
.calling-progress-card {
  margin-top: 16px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
  border: 1px solid #b3d8ff;
  border-radius: 6px;
}
.calling-progress-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.calling-spin-icon {
  font-size: 16px;
  color: #409eff;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.calling-progress-title {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
}
.calling-elapsed-text {
  font-size: 13px;
  color: #409eff;
  margin-left: auto;
}
.calling-elapsed-text b {
  font-size: 15px;
}
.calling-timeout-text {
  font-size: 12px;
  color: #909399;
}
.calling-progress-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

/* 过渡动画 */
.call-fade-enter-active,
.call-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.call-fade-enter,
.call-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
