<!--
 * @name: API日志管理
 * @content: 查看和管理系统API调用日志
 * @Author: admin
 * @Date: 2023-07-10 10:00:00
-->
<template>
  <div class="app-container">
    <!-- 筛选区域 -->
    <div class="screen">
      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-search">筛选搜索</i>
          <div class="screen_content_first_btutton">
            <el-button
              class="filter-item"
              type="success"
              icon="el-icon-download"
              @click="handleExport"
            >
              导出日志
            </el-button>
          </div>
        </div>
        <div class="screen_content_second">
          <!-- 接口路径筛选 -->
          <div class="screen_content_second_one">
            <div style="width: 120px">接口路径:</div>
            <el-input
              v-model="endpoint"
              clearable
              placeholder="请输入接口路径"
              @clear="clearFilter"
            ></el-input>
          </div>
          <!-- 服务名称筛选 -->
          <div class="screen_content_second_one">
            <div style="width: 120px">服务名称:</div>
            <el-input
              v-model="serviceName"
              clearable
              placeholder="请输入服务名称"
              @clear="clearFilter"
            ></el-input>
          </div>
          <!-- 状态筛选 -->
          <div class="screen_content_second_one">
            <div style="width: 80px">状态:</div>
            <el-select
              v-model="status"
              clearable
              placeholder="请选择状态"
              @change="handleFilter"
              @clear="clearFilter"
            >
              <el-option label="成功" :value="true"></el-option>
              <el-option label="失败" :value="false"></el-option>
            </el-select>
          </div>
          <!-- 日期范围筛选 -->
          <div class="screen_content_second_one date-range">
            <div style="width: 120px">日期范围:</div>
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始日期时间"
              end-placeholder="结束日期时间"
              value-format="yyyy-MM-dd HH:mm:ss"
              :default-time="['00:00:00', '23:59:59']"
              @change="handleFilter"
            >
            </el-date-picker>
          </div>
          <!-- 查询按钮 -->
          <div class="screen_content_second_one">
            <el-button type="primary" @click="handleFilter">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 日志列表标题 -->
    <div class="screen1">
      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-tickets">API日志列表</i>
        </div>
      </div>
    </div>

    <!-- 日志表格 -->
    <el-table
      v-loading="listLoading"
      :data="logList"
      border
      element-loading-text="加载中"
      fit
      highlight-current-row
      style="width: 100%"
    >
      <!-- 接口路径 -->
      <el-table-column align="center" label="接口路径" min-width="180">
        <template slot-scope="scope">
          <el-tooltip
            :content="scope.row.endpoint"
            placement="top"
            effect="light"
          >
            <span class="endpoint-text">{{ scope.row.endpoint }}</span>
          </el-tooltip>
        </template>
      </el-table-column>

      <!-- 请求方法 -->
      <el-table-column align="center" label="请求方法" width="100">
        <template slot-scope="scope">
          <el-tag :type="getMethodTagType(scope.row.method)" size="medium">
            {{ scope.row.method }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 服务名称 -->
      <el-table-column align="center" label="服务名称" min-width="150">
        <template slot-scope="scope">
          {{ scope.row.serviceName || "未指定" }}
        </template>
      </el-table-column>

      <!-- 状态 -->
      <el-table-column align="center" label="状态" width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.success" type="success">成功</el-tag>
          <el-tag v-else type="danger">失败</el-tag>
        </template>
      </el-table-column>

      <!-- 响应状态码 -->
      <el-table-column align="center" label="状态码" width="100">
        <template slot-scope="scope">
          <span :class="getStatusCodeClass(scope.row.responseStatus)">
            {{ scope.row.responseStatus || "-" }}
          </span>
        </template>
      </el-table-column>

      <!-- 执行时间 -->
      <el-table-column align="center" label="执行时间(ms)" width="120">
        <template slot-scope="scope">
          <span :class="getExecutionTimeClass(scope.row.executionTime)">
            {{ scope.row.executionTime || "-" }}
          </span>
        </template>
      </el-table-column>

      <!-- 用户信息 -->
      <el-table-column align="center" label="用户" min-width="120">
        <template slot-scope="scope">
          <div v-if="scope.row.userId">
            {{ scope.row.userId && scope.row.userId.userName }}
          </div>
          <div v-else>
            <el-tag size="small" type="info">匿名访问</el-tag>
          </div>
          <div class="user-ip text-muted">
            IP: {{ scope.row.userIp || "未知" }}
          </div>
        </template>
      </el-table-column>

      <!-- 请求时间 -->
      <el-table-column align="center" label="请求时间" min-width="160">
        <template slot-scope="scope">
          <i class="el-icon-time" />
          <span>{{
            scope.row.timestamp | parseTime("{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column>

      <!-- 操作 -->
      <el-table-column align="center" label="操作" width="120">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            @click="viewLogDetail(scope.row)"
          >
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="pagination-container">
      <el-pagination
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="listQuery.page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="listQuery.limit"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      >
      </el-pagination>
    </div>

    <!-- 日志详情弹窗 -->
    <el-dialog
      :visible.sync="logDetailVisible"
      title="API日志详情"
      width="70%"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="接口路径">
              {{ currentLog.endpoint }}
            </el-descriptions-item>
            <el-descriptions-item label="请求方法">
              <el-tag :type="getMethodTagType(currentLog.method)">
                {{ currentLog.method }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="服务名称">
              {{ currentLog.serviceName || "未指定" }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag v-if="currentLog.success" type="success">成功</el-tag>
              <el-tag v-else type="danger">失败</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态码">
              {{ currentLog.responseStatus || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="执行时间">
              {{ currentLog.executionTime || "-" }} ms
            </el-descriptions-item>
            <el-descriptions-item label="用户ID">
              {{
                (currentLog.userId && currentLog.userId.userName) || "匿名访问"
              }}
            </el-descriptions-item>
            <el-descriptions-item label="用户IP">
              {{ currentLog.userIp || "未知" }}
            </el-descriptions-item>
            <el-descriptions-item label="请求时间" :span="2">
              {{ currentLog.timestamp | parseTime("{y}-{m}-{d} {h}:{i}:{s}") }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 请求信息 -->
        <el-tab-pane label="请求数据" name="request">
          <el-card class="json-card" v-if="hasRequestParams">
            <div slot="header">
              <span>请求参数 (Params)</span>
            </div>
            <pre>{{ formatJSON(currentLog.requestParams) }}</pre>
          </el-card>

          <el-card class="json-card" v-if="hasRequestQuery">
            <div slot="header">
              <span>查询参数 (Query)</span>
            </div>
            <pre>{{ formatJSON(currentLog.requestQuery) }}</pre>
          </el-card>

          <el-card class="json-card" v-if="hasRequestBody">
            <div slot="header">
              <span>请求体 (Body)</span>
            </div>
            <pre>{{ formatJSON(currentLog.requestBody) }}</pre>
          </el-card>

          <el-empty
            v-if="!hasRequestData"
            description="没有请求数据"
          ></el-empty>
        </el-tab-pane>

        <!-- 响应数据 -->
        <el-tab-pane label="响应数据" name="response">
          <pre v-if="currentLog.responseBody" class="json-content">{{
            formatJSON(currentLog.responseBody)
          }}</pre>
          <el-empty v-else description="没有响应数据"></el-empty>
        </el-tab-pane>

        <!-- 错误信息 -->
        <el-tab-pane label="错误信息" name="error" v-if="!currentLog.success">
          <el-alert
            title="API调用失败"
            type="error"
            :description="currentLog.errorMessage || '未提供错误信息'"
            show-icon
            :closable="false"
          >
          </el-alert>
          <div v-if="currentLog.errorStack" class="error-stack">
            <h4>错误堆栈:</h4>
            <pre>{{ currentLog.errorStack }}</pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script>
import { getData } from "@/api/data";
import { parseTime } from "@/utils/index";
import FileSaver from "file-saver";
import XLSX from "xlsx";

export default {
  name: "apiLog",
  data() {
    return {
      // 列表数据
      logList: [],
      listLoading: true,
      total: 0,
      downloadLoading: false,

      // 查询参数
      endpoint: "",
      serviceName: "",
      status: "",
      dateRange: [],
      listQuery: {
        page: 1,
        limit: 10,
      },

      // 详情弹窗
      logDetailVisible: false,
      currentLog: {},
      activeTab: "basic",

      // 用户映射缓存
      userNameMap: {},
    };
  },
  computed: {
    hasRequestParams() {
      return (
        this.currentLog.requestParams &&
        Object.keys(this.currentLog.requestParams).length > 0
      );
    },
    hasRequestQuery() {
      return (
        this.currentLog.requestQuery &&
        Object.keys(this.currentLog.requestQuery).length > 0
      );
    },
    hasRequestBody() {
      return (
        this.currentLog.requestBody &&
        Object.keys(this.currentLog.requestBody).length > 0
      );
    },
    hasRequestData() {
      return (
        this.hasRequestParams || this.hasRequestQuery || this.hasRequestBody
      );
    },
  },
  created() {
    this.fetchData();
  },
  methods: {
    // 格式化JSON数据
    formatJSON(json) {
      try {
        return JSON.stringify(json, null, 2);
      } catch (e) {
        return JSON.stringify(json);
      }
    },

    // 获取数据
    fetchData() {
      this.listLoading = true;

      // 构建查询条件
      const query = this.buildQuery();

      const data = {
        query,
        limit: this.listQuery.limit,
        sort: { timestamp: -1 },
        populate: JSON.stringify([
          { path: "userId", select: "userName nickName" },
        ]),
        skip: (this.listQuery.page - 1) * this.listQuery.limit,
        count: true,
      };

      getData("apiLog", data)
        .then((response) => {
          this.logList = response.data || [];
          this.total = response.countnum || 0;

          // 加载用户信息
          // this.loadUserInfo();
        })
        .catch((error) => {
          console.error("获取API日志数据失败:", error);
          this.$notify({
            title: "错误",
            message: "获取API日志失败",
            type: "error",
          });
        })
        .finally(() => {
          this.listLoading = false;
        });
    },

    // 构建查询条件
    buildQuery() {
      const query = {};

      if (this.endpoint) {
        query.endpoint = { $regex: this.endpoint };
      }

      if (this.serviceName) {
        query.serviceName = { $regex: this.serviceName };
      }

      if (this.status !== "" && this.status !== null) {
        query.success = this.status;
      }

      // 处理日期范围
      if (this.dateRange && this.dateRange.length === 2) {
        const [startDate, endDate] = this.dateRange;
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate + " 23:59:59"),
        };
      }

      return query;
    },

    // // 加载用户信息
    // loadUserInfo() {
    //   // 收集所有用户ID
    //   const userIds = this.logList
    //     .filter(log => log.userId)
    //     .map(log => log.userId)
    //     .filter((value, index, self) => self.indexOf(value) === index);

    //   if (userIds.length === 0) return;

    //   getData("user_login", {
    //     query: { _id: { $in: userIds } },
    //     projection: { _id: 1, userName: 1, nickName: 1 }
    //   }).then(response => {
    //     const users = response.data || [];

    //     // 构建用户映射
    //     users.forEach(user => {
    //       this.userNameMap[user._id] = user.nickName || user.userName;
    //     });
    //   }).catch(error => {
    //     console.error("加载用户信息失败:", error);
    //   });
    // },

    // 根据用户ID获取用户名
    getUserName(userId) {
      return this.userNameMap[userId] || userId;
    },

    // 查看日志详情
    viewLogDetail(log) {
      this.currentLog = log;
      this.activeTab = "basic";
      this.logDetailVisible = true;
    },

    // 处理筛选
    handleFilter() {
      this.listQuery.page = 1;
      this.fetchData();
    },

    // 清除过滤器
    clearFilter() {
      this.fetchData();
    },

    // 重置过滤器
    resetFilter() {
      this.endpoint = "";
      this.serviceName = "";
      this.status = "";
      this.dateRange = [];
      this.listQuery.page = 1;
      this.fetchData();
    },

    // 分页大小变化
    handleSizeChange(val) {
      this.listQuery.limit = val;
      this.fetchData();
    },

    // 页码变化
    handleCurrentChange(val) {
      this.listQuery.page = val;
      this.fetchData();
    },

    // 获取HTTP方法标签类型
    getMethodTagType(method) {
      const methodMap = {
        GET: "success",
        POST: "primary",
        PUT: "warning",
        DELETE: "danger",
        PATCH: "warning",
      };
      return methodMap[method] || "info";
    },

    // 获取状态码类名
    getStatusCodeClass(code) {
      if (!code) return "";
      if (code >= 200 && code < 300) return "success-text";
      if (code >= 400 && code < 500) return "warning-text";
      if (code >= 500) return "danger-text";
      return "";
    },

    // 获取执行时间类名
    getExecutionTimeClass(time) {
      if (!time) return "";
      if (time < 100) return "success-text";
      if (time < 500) return "warning-text";
      return "danger-text";
    },

    // 导出日志
    handleExport() {
      this.$confirm("确认导出所选API日志吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.downloadLoading = true;

          // 构建查询条件
          const query = this.buildQuery();

          // 获取要导出的数据
          getData("apiLog", {
            query,
            sort: { timestamp: -1 },
            limit: 5000, // 限制导出数量
          })
            .then((response) => {
              const logs = response.data || [];

              // 准备导出数据
              const exportData = logs.map((log) => ({
                接口路径: log.endpoint,
                请求方法: log.method,
                服务名称: log.serviceName || "未指定",
                状态: log.success ? "成功" : "失败",
                状态码: log.responseStatus || "-",
                执行时间: log.executionTime ? `${log.executionTime}ms` : "-",
                用户ID: log.userId || "匿名",
                用户IP: log.userIp || "未知",
                请求时间: parseTime(log.timestamp, "{y}-{m}-{d} {h}:{i}:{s}"),
                错误信息: log.errorMessage || "-",
              }));

              // 生成Excel文件
              const wb = XLSX.utils.book_new();
              const ws = XLSX.utils.json_to_sheet(exportData);

              // 设置列宽
              const colWidths = [
                { wch: 50 }, // 接口路径
                { wch: 10 }, // 请求方法
                { wch: 20 }, // 服务名称
                { wch: 10 }, // 状态
                { wch: 10 }, // 状态码
                { wch: 15 }, // 执行时间
                { wch: 24 }, // 用户ID
                { wch: 15 }, // 用户IP
                { wch: 20 }, // 请求时间
                { wch: 50 }, // 错误信息
              ];
              ws["!cols"] = colWidths;

              XLSX.utils.book_append_sheet(wb, ws, "API日志");

              // 导出文件
              const now = parseTime(new Date(), "{y}{m}{d}{h}{i}");
              XLSX.writeFile(wb, `API日志_${now}.xlsx`);

              this.$notify({
                title: "成功",
                message: "导出成功",
                type: "success",
                duration: 2000,
              });
            })
            .catch((error) => {
              console.error("导出API日志失败:", error);
              this.$notify({
                title: "错误",
                message: "导出日志失败",
                type: "error",
              });
            })
            .finally(() => {
              this.downloadLoading = false;
            });
        })
        .catch(() => {
          // 用户取消导出
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

.filter-item {
  margin: 10px 5px;
}

.screen {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 20px;
}

.screen1 {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 20px;
}

.screen_content {
  padding: 15px;
}

.screen_content_first {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;

  i {
    font-size: 16px;
    font-weight: 500;
  }

  .screen_content_first_btutton {
    display: flex;
    gap: 10px;
  }
}

.screen_content_second {
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  .screen_content_second_one {
    display: flex;
    align-items: center;
    margin-right: 20px;
    margin-bottom: 10px;

    div {
      margin-right: 10px;
    }

    .el-input,
    .el-select {
      width: 220px;
    }
  }

  .date-range {
    width: 100%;
    margin-bottom: 15px;

    .el-date-editor {
      width: 350px;
    }
  }
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

// 表格内样式
.endpoint-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 300px;
}

.user-ip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.text-muted {
  color: #909399;
}

.success-text {
  color: #67c23a;
  font-weight: bold;
}

.warning-text {
  color: #e6a23c;
  font-weight: bold;
}

.danger-text {
  color: #f56c6c;
  font-weight: bold;
}

// 详情弹窗样式
.json-card {
  margin-bottom: 15px;
}

.error-stack {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;

  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    color: #f56c6c;
    font-family: monospace;
    font-size: 12px;
    line-height: 1.5;
  }
}

::v-deep {
  .el-table td {
    vertical-align: middle;
  }

  .el-tag {
    text-transform: uppercase;
  }

  .el-descriptions-item__label {
    width: 120px;
  }

  .vjs-tree {
    font-size: 12px;
  }
}

// JSON显示样式
.json-content {
  background-color: #f8f8f8;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 16px;
  font-family: "Courier New", Courier, monospace;
  font-size: 13px;
  line-height: 1.5;
  max-height: 500px;
  overflow: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.json-card {
  margin-bottom: 15px;

  pre {
    background-color: #f8f8f8;
    border-radius: 4px;
    padding: 12px;
    font-family: "Courier New", Courier, monospace;
    font-size: 13px;
    line-height: 1.5;
    max-height: 300px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style> 