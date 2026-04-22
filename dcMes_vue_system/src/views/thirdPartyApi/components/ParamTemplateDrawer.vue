<template>
  <el-drawer
    :title="drawerTitle"
    :visible.sync="localVisible"
    direction="rtl"
    size="860px"
    append-to-body
    :destroy-on-close="false"
    @open="handleOpen"
  >
    <div class="tpl-drawer-body">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" icon="el-icon-plus" size="small" :disabled="apiConfig && apiConfig.status === 3" @click="handleAdd">
            新增模板
          </el-button>
          <el-button
            type="danger"
            icon="el-icon-delete"
            size="small"
            :disabled="selectedIds.length === 0"
            @click="handleBatchDelete"
          >
            批量删除{{ selectedIds.length > 0 ? ` (${selectedIds.length})` : "" }}
          </el-button>
          <el-button
            v-if="apiConfig && apiConfig.status === 1"
            type="success"
            icon="el-icon-video-play"
            size="small"
            :disabled="!callTemplateId"
            @click="handleCallWithTemplate"
          >
            用选中模板调用
          </el-button>
        </div>
        <el-tooltip content="拖拽行可调整排序">
          <el-tag type="info" size="mini" style="cursor:default">
            <i class="el-icon-sort" /> 拖拽排序
          </el-tag>
        </el-tooltip>
      </div>

      <!-- 模板列表 -->
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="templateList"
        border
        stripe
        size="small"
        row-key="_id"
        style="width:100%;margin-top:12px"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column label="" width="36" align="center">
          <template>
            <i class="el-icon-rank drag-handle" style="cursor:move;color:#c0c4cc" />
          </template>
        </el-table-column>
        <el-table-column label="模板名称" prop="name" min-width="160" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <el-radio v-model="callTemplateId" :label="row._id" @click.native.stop>
              {{ row.name }}
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="参数类型" width="140" align="center">
          <template slot-scope="{ row }">
            <el-tag type="info" size="mini">{{ paramTypeLabel(row.paramType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参数数量" width="90" align="center">
          <template slot-scope="{ row }">{{ row.params ? row.params.length : 0 }}</template>
        </el-table-column>
        <el-table-column label="创建人" prop="createdName" width="90" align="center" />
        <el-table-column label="更新时间" width="155" align="center">
          <template slot-scope="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" icon="el-icon-view" @click.stop="handleViewDetail(row)">详情</el-button>
            <el-button
              type="text"
              size="mini"
              icon="el-icon-edit"
              :disabled="apiConfig && apiConfig.status === 3"
              @click.stop="handleEdit(row)"
            >编辑</el-button>
            <el-button type="text" size="mini" icon="el-icon-time" @click.stop="handleViewOpLog(row)">操作记录</el-button>
            <el-button type="text" size="mini" icon="el-icon-delete" class="danger-btn" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="editingTemplate ? '编辑参数模板' : '新增参数模板'"
      :visible.sync="formDialogVisible"
      width="680px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form ref="templateForm" :model="templateForm" :rules="templateRules" label-width="90px" size="small">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" maxlength="50" show-word-limit placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="参数类型" prop="paramType">
          <el-radio-group v-model="templateForm.paramType">
            <el-radio :label="1">Query</el-radio>
            <el-radio :label="2">Body form-data</el-radio>
            <el-radio :label="3">Body urlencoded</el-radio>
            <el-radio :label="4">Body JSON</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="参数列表">
          <div class="params-editor-header">
            <el-button type="text" size="mini" icon="el-icon-plus" @click="addParam">添加参数</el-button>
            <el-button type="text" size="mini" @click="clearParams">清空</el-button>
          </div>
          <el-table :data="templateForm.params" border size="mini" style="width:100%">
            <el-table-column label="Key" min-width="160">
              <template slot-scope="{ row }">
                <el-input v-model="row.key" placeholder="参数名" size="mini" />
              </template>
            </el-table-column>
            <el-table-column label="Value" min-width="200">
              <template slot-scope="{ row }">
                <el-input v-model="row.value" placeholder="参数值（可留空）" size="mini" />
              </template>
            </el-table-column>
            <el-table-column label="删除" width="60" align="center">
              <template slot-scope="{ $index }">
                <el-button type="text" size="mini" icon="el-icon-delete" @click="removeParam($index)" />
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="handleFormSubmit">保存</el-button>
      </span>
    </el-dialog>

    <!-- 模板详情抽屉 -->
    <el-drawer title="模板详情" :visible.sync="detailDrawerVisible" direction="rtl" size="480px" append-to-body>
      <div class="detail-drawer-content" v-if="detailTemplate">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="模板名称">{{ detailTemplate.name }}</el-descriptions-item>
          <el-descriptions-item label="参数类型">{{ paramTypeLabel(detailTemplate.paramType) }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ detailTemplate.createdName }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(detailTemplate.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(detailTemplate.updatedAt) }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-params-title">参数列表</div>
        <el-table :data="detailTemplate.params || []" border size="mini" style="width:100%">
          <el-table-column label="Key" prop="key" />
          <el-table-column label="Value" prop="value" />
        </el-table>
      </div>
    </el-drawer>

    <!-- 操作记录抽屉 -->
    <el-drawer title="操作记录" :visible.sync="opLogDrawerVisible" direction="rtl" size="520px" append-to-body>
      <div style="padding:16px">
        <el-timeline v-if="opLogs.length > 0">
          <el-timeline-item
            v-for="log in opLogs"
            :key="log._id"
            :timestamp="formatDate(log.opTime)"
            placement="top"
            :color="opLogColor(log.opType)"
          >
            <el-card shadow="never" body-style="padding:10px">
              <div class="op-log-header">
                <el-tag :type="opLogTagType(log.opType)" size="mini">{{ opTypeLabel(log.opType) }}</el-tag>
                <span class="op-name">{{ log.opName }}</span>
              </div>
              <div v-if="log.afterData" class="op-log-data">
                <div class="op-log-label">修改后：</div>
                <pre class="op-log-pre">{{ JSON.stringify(log.afterData, null, 2) }}</pre>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无操作记录" />
      </div>
    </el-drawer>

    <!-- 调用弹窗（用选中模板直接调用） -->
    <call-dialog
      :visible.sync="callDialogVisible"
      :api-config="apiConfig"
      :init-params="callInitParams"
    />
  </el-drawer>
</template>

<script>
import Sortable from "sortablejs";
import {
  getParamTemplateList,
  getParamTemplateDetail,
  addParamTemplate,
  updateParamTemplate,
  deleteParamTemplate,
  batchDeleteTemplates,
  updateTemplateSort,
  getTemplateOpLogs,
} from "@/api/thirdPartyApi";
import CallDialog from "./CallDialog.vue";

export default {
  name: "ParamTemplateDrawer",
  components: { CallDialog },
  props: {
    visible: { type: Boolean, default: false },
    apiConfig: { type: Object, default: null },
  },
  data() {
    return {
      localVisible: false,
      loading: false,
      templateList: [],
      selectedIds: [],
      callTemplateId: "",
      formDialogVisible: false,
      editingTemplate: null,
      saving: false,
      templateForm: { name: "", paramType: 1, params: [{ key: "", value: "" }] },
      templateRules: {
        name: [
          { required: true, message: "请输入模板名称", trigger: "blur" },
          { max: 50, message: "不超过50字符", trigger: "blur" },
        ],
        paramType: [{ required: true, message: "请选择参数类型", trigger: "change" }],
      },
      detailDrawerVisible: false,
      detailTemplate: null,
      opLogDrawerVisible: false,
      opLogs: [],
      callDialogVisible: false,
      callInitParams: null,
      sortable: null,
    };
  },
  computed: {
    drawerTitle() {
      return this.apiConfig ? `参数模板管理 — ${this.apiConfig.name}` : "参数模板管理";
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
      this.selectedIds = [];
      this.callTemplateId = "";
      this.loadList();
    },

    async loadList() {
      if (!this.apiConfig) return;
      this.loading = true;
      try {
        const res = await getParamTemplateList(this.apiConfig._id);
        if (res && res.code === 20000) {
          this.templateList = res.data;
          this.$nextTick(() => this.initSortable());
        }
      } finally {
        this.loading = false;
      }
    },

    initSortable() {
      const el = this.$refs.tableRef && this.$refs.tableRef.$el.querySelector("tbody");
      if (!el) return;
      if (this.sortable) this.sortable.destroy();
      this.sortable = Sortable.create(el, {
        handle: ".drag-handle",
        animation: 150,
        onEnd: async ({ newIndex, oldIndex }) => {
          if (newIndex === oldIndex) return;
          const moved = this.templateList.splice(oldIndex, 1)[0];
          this.templateList.splice(newIndex, 0, moved);
          const items = this.templateList.map((item, idx) => ({ id: item._id, sortOrder: idx }));
          await updateTemplateSort(items);
        },
      });
    },

    handleSelectionChange(selection) {
      this.selectedIds = selection.map((s) => s._id);
    },

    handleAdd() {
      this.editingTemplate = null;
      this.templateForm = { name: "", paramType: 1, params: [{ key: "", value: "" }] };
      this.formDialogVisible = true;
      this.$nextTick(() => this.$refs.templateForm && this.$refs.templateForm.clearValidate());
    },

    handleEdit(row) {
      this.editingTemplate = row;
      this.templateForm = {
        name: row.name,
        paramType: row.paramType,
        params: row.params && row.params.length > 0
          ? row.params.map((p) => ({ key: p.key || "", value: p.value || "" }))
          : [{ key: "", value: "" }],
      };
      this.formDialogVisible = true;
      this.$nextTick(() => this.$refs.templateForm && this.$refs.templateForm.clearValidate());
    },

    addParam() { this.templateForm.params.push({ key: "", value: "" }); },
    removeParam(idx) {
      this.templateForm.params.splice(idx, 1);
      if (!this.templateForm.params.length) this.templateForm.params.push({ key: "", value: "" });
    },
    clearParams() { this.templateForm.params = [{ key: "", value: "" }]; },

    handleFormSubmit() {
      this.$refs.templateForm.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          const data = {
            apiConfigId: this.apiConfig._id,
            name: this.templateForm.name,
            paramType: this.templateForm.paramType,
            params: this.templateForm.params.filter((p) => p.key && p.key.trim()),
          };
          const res = this.editingTemplate
            ? await updateParamTemplate(this.editingTemplate._id, data)
            : await addParamTemplate(data);
          if (res && res.code === 20000) {
            this.$message.success(this.editingTemplate ? "编辑成功" : "新增成功");
            this.formDialogVisible = false;
            this.loadList();
          } else {
            this.$message.error((res && res.message) || "操作失败");
          }
        } finally {
          this.saving = false;
        }
      });
    },

    async handleDelete(row) {
      await this.$confirm("删除后不影响历史调用记录，确定删除该模板吗？", "删除确认", { type: "warning" });
      const res = await deleteParamTemplate(row._id);
      if (res && res.code === 20000) {
        this.$message.success("删除成功");
        this.loadList();
      } else {
        this.$message.error((res && res.message) || "删除失败");
      }
    },

    async handleBatchDelete() {
      await this.$confirm(
        `确定删除选中的 ${this.selectedIds.length} 个模板吗？`,
        "批量删除",
        { type: "warning" }
      );
      const res = await batchDeleteTemplates(this.selectedIds);
      if (res && res.code === 20000) {
        this.$message.success(res.message || "删除成功");
        this.selectedIds = [];
        this.loadList();
      } else {
        this.$message.error((res && res.message) || "删除失败");
      }
    },

    async handleViewDetail(row) {
      const res = await getParamTemplateDetail(row._id);
      if (res && res.code === 20000) {
        this.detailTemplate = res.data;
        this.detailDrawerVisible = true;
      }
    },

    async handleViewOpLog(row) {
      const res = await getTemplateOpLogs(row._id);
      if (res && res.code === 20000) {
        this.opLogs = res.data;
        this.opLogDrawerVisible = true;
      }
    },

    handleCallWithTemplate() {
      const tpl = this.templateList.find((t) => t._id === this.callTemplateId);
      if (tpl) {
        this.callInitParams = {
          callMode: 1,
          paramType: tpl.paramType,
          params: tpl.params || [],
          paramTemplateId: tpl._id,
        };
      }
      this.callDialogVisible = true;
    },

    paramTypeLabel(type) {
      const map = { 1: "Query", 2: "Body form-data", 3: "Body urlencoded", 4: "Body JSON" };
      return map[type] || "-";
    },
    opTypeLabel(type) {
      return { create: "新增", edit: "编辑", delete: "删除" }[type] || type;
    },
    opLogColor(type) {
      return { create: "#67c23a", edit: "#e6a23c", delete: "#f56c6c" }[type] || "#409eff";
    },
    opLogTagType(type) {
      return { create: "success", edit: "warning", delete: "danger" }[type] || "info";
    },
    formatDate(date) {
      if (!date) return "-";
      return new Date(date).toLocaleString("zh-CN", { hour12: false });
    },
  },
  beforeDestroy() {
    if (this.sortable) this.sortable.destroy();
  },
};
</script>

<style scoped>
.tpl-drawer-body { padding: 16px; }
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.toolbar-left { display: flex; gap: 8px; }
.danger-btn { color: #f56c6c; }
.params-editor-header { display: flex; gap: 8px; margin-bottom: 6px; }
.detail-drawer-content { padding: 16px; }
.detail-params-title { margin: 16px 0 8px; font-weight: 600; color: #303133; font-size: 13px; }
.op-log-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.op-name { color: #606266; font-size: 12px; }
.op-log-data { margin-top: 4px; }
.op-log-label { font-size: 12px; color: #909399; margin-bottom: 2px; }
.op-log-pre {
  background: #f5f7fa;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 11px;
  max-height: 120px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}
</style>
