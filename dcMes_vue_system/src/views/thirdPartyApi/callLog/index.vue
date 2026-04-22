<template>
  <div class="call-log-container">
    <!-- 页头 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item @click.native="$router.push('/thirdPartyApi')" class="breadcrumb-link">
          接口配置管理
        </el-breadcrumb-item>
        <el-breadcrumb-item>请求日志{{ apiName ? ` - ${apiName}` : "" }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" inline size="small">
        <el-form-item label="业务单号">
          <el-input v-model="queryForm.bizNo" placeholder="模糊搜索" clearable style="width:150px" />
        </el-form-item>
        <el-form-item label="销售单号">
          <el-input v-model="queryForm.saleNo" placeholder="模糊搜索" clearable style="width:150px" />
        </el-form-item>
        <el-form-item label="响应状态">
          <el-select v-model="queryForm.responseStatus" placeholder="全部" clearable style="width:110px">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="fail" />
          </el-select>
        </el-form-item>
        <el-form-item label="调用方式">
          <el-select v-model="queryForm.callMode" placeholder="全部" clearable style="width:130px">
            <el-option label="自定义参数" :value="1" />
            <el-option label="文件调用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数模板">
          <el-input v-model="queryForm.paramTemplateName" placeholder="模糊搜索模板名" clearable style="width:150px" />
        </el-form-item>
        <el-form-item label="请求时间">
          <el-date-picker
            v-model="queryForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="yyyy-MM-dd"
            style="width:240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        size="small"
        style="width:100%"
      >
        <el-table-column label="业务单号" prop="bizNo" width="140" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ row.bizNo || "-" }}</template>
        </el-table-column>
        <el-table-column label="接口名称" min-width="140" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ row.apiConfigSnapshot && row.apiConfigSnapshot.name || "-" }}</template>
        </el-table-column>
        <el-table-column label="请求时间" width="155" align="center">
          <template slot-scope="{ row }">{{ formatDate(row.requestTime) }}</template>
        </el-table-column>
        <el-table-column label="响应状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.responseStatus === 'success' ? 'success' : 'danger'" size="mini">
              {{ row.responseStatus === "success" ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时(ms)" prop="duration" width="90" align="center" />
        <el-table-column label="调用方式" width="110" align="center">
          <template slot-scope="{ row }">
            <el-tag type="info" size="mini">
              {{ row.callMode === 1 ? "自定义参数" : "文件调用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参数模板" prop="paramTemplateSnapshot" width="120" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ row.paramTemplateSnapshot || "无" }}</template>
        </el-table-column>
        <el-table-column label="重试次数" prop="retryCount" width="80" align="center" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button
              type="text"
              size="mini"
              icon="el-icon-view"
              @click="goDetail(row)"
            >详情</el-button>
            <el-button
              v-if="row.responseStatus === 'fail' || row.callMode === 2"
              type="text"
              size="mini"
              icon="el-icon-refresh-right"
              :loading="row._retrying"
              @click="handleRetry(row)"
            >{{ row._retrying ? "发送中" : (row.responseStatus === 'fail' ? '重试' : '重新发送') }}</el-button>
            <el-button
              type="text"
              size="mini"
              icon="el-icon-video-play"
              @click="handleRecall(row)"
            >重新调用</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 12, 15]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 调用弹窗（重新调用时打开） -->
    <call-dialog
      :visible.sync="callDialogVisible"
      :api-config="recallApiConfig"
      :init-params="recallInitParams"
    />
  </div>
</template>

<script>
import { getCallLogList, retryCallLog, getApiConfigDetail } from "@/api/thirdPartyApi";
import CallDialog from "../components/CallDialog.vue";

export default {
  name: "CallLogList",
  components: { CallDialog },
  data() {
    return {
      apiConfigId: "",
      apiName: "",
      queryForm: {
        bizNo: "",
        saleNo: "",
        responseStatus: "",
        callMode: "",
        paramTemplateName: "",
        timeRange: [],
      },
      loading: false,
      tableData: [],
      pagination: { page: 1, pageSize: 10, total: 0 },
      callDialogVisible: false,
      recallApiConfig: null,
      recallInitParams: null,
    };
  },
  created() {
    this.apiConfigId = this.$route.query.apiConfigId || "";
    this.apiName = this.$route.query.apiName || "";
    this.loadList();
  },
  methods: {
    async loadList() {
      this.loading = true;
      try {
        const params = {
          bizNo: this.queryForm.bizNo || undefined,
          saleNo: this.queryForm.saleNo || undefined,
          responseStatus: this.queryForm.responseStatus || undefined,
          callMode: this.queryForm.callMode || undefined,
          paramTemplateName: this.queryForm.paramTemplateName || undefined,
          startTime: this.queryForm.timeRange && this.queryForm.timeRange[0]
            ? this.queryForm.timeRange[0] + " 00:00:00"
            : undefined,
          endTime: this.queryForm.timeRange && this.queryForm.timeRange[1]
            ? this.queryForm.timeRange[1] + " 23:59:59"
            : undefined,
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
        };
        // 如果从接口列表跳转过来，追加接口ID筛选（通过查询apiConfigSnapshot.name代替）
        const res = await getCallLogList(params);
        if (res.code === 20000) {
          this.tableData = res.data.list.map((row) => ({ ...row, _retrying: false }));
          this.pagination.total = res.data.total;
        }
      } finally {
        this.loading = false;
      }
    },

    handleSearch() {
      this.pagination.page = 1;
      this.loadList();
    },

    handleReset() {
      this.queryForm = {
        bizNo: "", saleNo: "", responseStatus: "", callMode: "",
        paramTemplateName: "", timeRange: [],
      };
      this.pagination.page = 1;
      this.loadList();
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

    goDetail(row) {
      this.$router.push({
        path: "/thirdPartyApi/callLog/detail",
        query: { id: row._id },
      });
    },

    async handleRetry(row) {
      row._retrying = true;
      try {
        const res = await retryCallLog(row._id, {});
        if (res.code === 20000) {
          if (res.data.responseStatus === "success") {
            this.$message.success("重试成功");
            row.responseStatus = "success";
            row._retrying = false;
          } else {
            this.$message.error("重试失败：" + (res.data.errorMessage || "未知错误"));
            row._retrying = false;
          }
        } else {
          this.$message.error(res.message || "重试失败");
          row._retrying = false;
        }
      } catch {
        row._retrying = false;
      }
    },

    async handleRecall(row) {
      // 获取接口配置
      if (!row.apiConfigId) {
        this.$message.warning("关联接口已删除，无法重新调用");
        return;
      }
      try {
        const res = await getApiConfigDetail(row.apiConfigId);
        if (res.code === 20000) {
          this.recallApiConfig = res.data;
          this.recallInitParams = {
            callMode: row.callMode,
            bizNo: row.bizNo || "",
            saleNo: row.saleNo || "",
            paramType: row.requestParams && row.requestParams.paramType,
            params: row.requestParams && row.requestParams.items,
            paramTemplateId: row.paramTemplateId || "",
          };
          this.callDialogVisible = true;
        } else {
          this.$message.error("接口配置已不存在");
        }
      } catch (e) {
        console.error("handleRecall error", e);
      }
    },

    formatDate(date) {
      if (!date) return "-";
      return new Date(date).toLocaleString("zh-CN", { hour12: false });
    },
  },
};
</script>

<style scoped>
.call-log-container { padding: 16px; }
.page-header { margin-bottom: 16px; }
.breadcrumb-link { cursor: pointer; color: #409eff; }
.search-card { margin-bottom: 12px; }
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
