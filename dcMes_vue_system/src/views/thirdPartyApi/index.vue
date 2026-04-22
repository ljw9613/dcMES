<template>
  <div class="tp-api-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" inline size="small">
        <el-form-item label="接口名称">
          <el-input v-model="queryForm.name" placeholder="模糊搜索" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="接口地址">
          <el-input v-model="queryForm.url" placeholder="模糊搜索" clearable style="width:200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable style="width:120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="2" />
            <el-option label="作废" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="queryForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            style="width:260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card class="table-card" shadow="never">
      <div class="table-toolbar">
        <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAdd">新增接口</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-loading="tableLoading"
        :data="tableData"
        border
        stripe
        size="small"
        style="width:100%;margin-top:12px"
      >
        <el-table-column label="接口名称" prop="name" min-width="150" show-overflow-tooltip />
        <el-table-column label="接口地址" prop="url" min-width="200" show-overflow-tooltip />
        <el-table-column label="请求方式" prop="method" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="methodTagType(row.method)" size="mini">{{ row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="80" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="statusTagType(row.status)" size="mini">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参数模板数" prop="templateCount" width="100" align="center" />
        <el-table-column label="创建人" prop="createdName" width="100" align="center" />
        <el-table-column label="创建时间" width="155" align="center">
          <template slot-scope="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="310" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button
              type="text"
              size="mini"
              icon="el-icon-edit"
              :disabled="row.status === 3"
              @click="handleEdit(row)"
            >编辑</el-button>
            <el-button
              type="text"
              size="mini"
              icon="el-icon-document"
              @click="handleViewLog(row)"
            >请求日志</el-button>
            <el-button
              type="text"
              size="mini"
              icon="el-icon-setting"
              :disabled="row.status === 3"
              @click="handleTemplate(row)"
            >参数模板</el-button>
            <el-button
              type="text"
              size="mini"
              icon="el-icon-video-play"
              :disabled="row.status !== 1"
              @click="handleCall(row)"
            >调用接口</el-button>
            <el-button
              type="text"
              size="mini"
              icon="el-icon-delete"
              class="danger-btn"
              @click="handleDelete(row)"
            >删除</el-button>
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
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <add-edit-dialog
      :visible.sync="dialogVisible"
      :edit-data="currentRow"
      @saved="handleSaved"
    />

    <!-- 调用弹窗 -->
    <call-dialog
      :visible.sync="callDialogVisible"
      :api-config="callApiConfig"
      :init-params="callInitParams"
    />

    <!-- 请求日志抽屉 -->
    <api-log-drawer
      :visible.sync="logDrawerVisible"
      :api-config="logDrawerConfig"
    />

    <!-- 参数模板抽屉 -->
    <param-template-drawer
      :visible.sync="templateDrawerVisible"
      :api-config="templateDrawerConfig"
    />
  </div>
</template>

<script>
import {
  getApiConfigList,
  deleteApiConfig,
} from "@/api/thirdPartyApi";
import AddEditDialog from "./components/AddEditDialog.vue";
import CallDialog from "./components/CallDialog.vue";
import ApiLogDrawer from "./components/ApiLogDrawer.vue";
import ParamTemplateDrawer from "./components/ParamTemplateDrawer.vue";

export default {
  name: "ThirdPartyApiConfig",
  components: { AddEditDialog, CallDialog, ApiLogDrawer, ParamTemplateDrawer },
  data() {
    return {
      queryForm: {
        name: "",
        url: "",
        status: "",
        timeRange: [],
      },
      tableData: [],
      tableLoading: false,
      pagination: { page: 1, pageSize: 20, total: 0 },
      dialogVisible: false,
      currentRow: null,
      callDialogVisible: false,
      callApiConfig: null,
      callInitParams: null,
      logDrawerVisible: false,
      logDrawerConfig: null,
      templateDrawerVisible: false,
      templateDrawerConfig: null,
    };
  },
  created() {
    // 检查是否从日志详情"重新调用"跳转而来
    if (this.$route.query.callConfigId) {
      this.loadDataAndOpenCall();
    } else {
      this.loadList();
    }
  },
  methods: {
    async loadList() {
      this.tableLoading = true;
      try {
        const params = {
          name: this.queryForm.name || undefined,
          url: this.queryForm.url || undefined,
          status: this.queryForm.status || undefined,
          startTime: this.queryForm.timeRange && this.queryForm.timeRange[0]
            ? this.queryForm.timeRange[0] + " 00:00:00"
            : undefined,
          endTime: this.queryForm.timeRange && this.queryForm.timeRange[1]
            ? this.queryForm.timeRange[1] + " 23:59:59"
            : undefined,
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
        };
        const res = await getApiConfigList(params);
        if (res.code === 20000) {
          this.tableData = res.data.list;
          this.pagination.total = res.data.total;
        }
      } finally {
        this.tableLoading = false;
      }
    },

    async loadDataAndOpenCall() {
      await this.loadList();
      const configId = this.$route.query.callConfigId;
      const initParams = this.$route.query.initParams
        ? JSON.parse(decodeURIComponent(this.$route.query.initParams))
        : null;
      const row = this.tableData.find((r) => r._id === configId);
      if (row) {
        this.callApiConfig = row;
        this.callInitParams = initParams;
        this.callDialogVisible = true;
      }
    },

    handleSearch() {
      this.pagination.page = 1;
      this.loadList();
    },

    handleReset() {
      this.queryForm = { name: "", url: "", status: "", timeRange: [] };
      this.pagination.page = 1;
      this.loadList();
    },

    handleAdd() {
      this.currentRow = null;
      this.dialogVisible = true;
    },

    handleEdit(row) {
      this.currentRow = { ...row };
      this.dialogVisible = true;
    },

    handleViewLog(row) {
      this.logDrawerConfig = row;
      this.logDrawerVisible = true;
    },

    handleTemplate(row) {
      this.templateDrawerConfig = row;
      this.templateDrawerVisible = true;
    },

    handleCall(row) {
      this.callApiConfig = row;
      this.callInitParams = null;
      this.callDialogVisible = true;
    },

    handleDelete(row) {
      this.$confirm(
        "删除接口配置后，该接口关联的所有参数模板、文件历史记录及相关请求日志（日志本身保留，仅解除关联）也将一并删除，此操作不可恢复，确定要继续吗？",
        "删除确认",
        { type: "warning", confirmButtonText: "确定删除", cancelButtonText: "取消" }
      ).then(async () => {
        const res = await deleteApiConfig(row._id);
        if (res.code === 20000) {
          this.$message.success("删除成功");
          this.loadList();
        } else {
          this.$message.error(res.message || "删除失败");
        }
      }).catch(() => {});
    },

    handleSaved(data) {
      this.dialogVisible = false;
      this.loadList();
      if (data && data.redirectTemplate) {
        const row = { _id: data.id, name: data.name, status: 1 };
        this.templateDrawerConfig = row;
        this.templateDrawerVisible = true;
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

    methodTagType(method) {
      const map = { GET: "success", POST: "primary", PUT: "warning", DELETE: "danger" };
      return map[method] || "info";
    },

    statusTagType(status) {
      const map = { 1: "success", 2: "warning", 3: "info" };
      return map[status] || "info";
    },

    statusLabel(status) {
      const map = { 1: "启用", 2: "禁用", 3: "作废" };
      return map[status] || "-";
    },

    formatDate(date) {
      if (!date) return "-";
      return new Date(date).toLocaleString("zh-CN", { hour12: false });
    },
  },
};
</script>

<style scoped>
.tp-api-container {
  padding: 16px;
}
.search-card {
  margin-bottom: 12px;
}
.table-card .table-toolbar {
  display: flex;
  align-items: center;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.danger-btn {
  color: #f56c6c;
}
.danger-btn:hover {
  color: #f56c6c;
  opacity: 0.8;
}
</style>
