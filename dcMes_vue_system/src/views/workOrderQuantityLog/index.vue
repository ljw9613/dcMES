<!--
 * @name: 工单数量变更日志管理
 * @content: 查看和管理工单投入产出数量变更日志
 * @Author: admin
 * @Date: 2024-12-19 10:00:00
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
              :loading="downloadLoading"
            >
              导出日志
            </el-button>
            <el-button
              class="filter-item"
              type="warning"
              icon="el-icon-pie-chart"
              @click="showStatistics"
            >
              统计分析
            </el-button>
          </div>
        </div>
        <div class="screen_content_second">
          <!-- 工单编号筛选 -->
          <div class="screen_content_second_one">
            <div style="width: 120px">工单编号:</div>
            <el-input
              v-model="workOrderNo"
              :placeholder="workOrderNoSearchMode === 'exact' ? '请输入完整工单编号（精确查询）' : '请输入工单编号（模糊查询）'"
              clearable
              @clear="clearFilter"
            >
              <el-button
                slot="prepend"
                :type="workOrderNoSearchMode === 'exact' ? 'primary' : ''"
                @click="toggleWorkOrderNoSearchMode"
                :title="workOrderNoSearchMode === 'exact' ? '当前：精确查询（快速，推荐）' : '当前：模糊查询（较慢，但更灵活）'"
                style="min-width: 60px"
              >
                {{ workOrderNoSearchMode === "exact" ? "精确" : "模糊" }}
              </el-button>
            </el-input>
          </div>
          <!-- 物料编码筛选 -->
          <div class="screen_content_second_one">
            <div style="width: 120px">物料编码:</div>
            <el-input
              v-model="materialCode"
              :placeholder="materialCodeSearchMode === 'exact' ? '请输入完整物料编码（精确查询）' : '请输入物料编码（模糊查询）'"
              clearable
              @clear="clearFilter"
            >
              <el-button
                slot="prepend"
                :type="materialCodeSearchMode === 'exact' ? 'primary' : ''"
                @click="toggleMaterialCodeSearchMode"
                :title="materialCodeSearchMode === 'exact' ? '当前：精确查询（快速，推荐）' : '当前：模糊查询（较慢，但更灵活）'"
                style="min-width: 60px"
              >
                {{ materialCodeSearchMode === "exact" ? "精确" : "模糊" }}
              </el-button>
            </el-input>
          </div>
          <!-- 相关条码筛选 -->
          <div class="screen_content_second_one">
            <div style="width: 120px">相关条码:</div>
            <el-input
              v-model="relatedBarcode"
              :placeholder="relatedBarcodeSearchMode === 'exact' ? '请输入完整相关条码（精确查询）' : '请输入相关条码（模糊查询）'"
              clearable
              @clear="clearFilter"
            >
              <el-button
                slot="prepend"
                :type="relatedBarcodeSearchMode === 'exact' ? 'primary' : ''"
                @click="toggleRelatedBarcodeSearchMode"
                :title="relatedBarcodeSearchMode === 'exact' ? '当前：精确查询（快速，推荐）' : '当前：模糊查询（较慢，但更灵活）'"
                style="min-width: 60px"
              >
                {{ relatedBarcodeSearchMode === "exact" ? "精确" : "模糊" }}
              </el-button>
            </el-input>
          </div>
          <!-- 变更类型筛选 -->
          <div class="screen_content_second_one">
            <div style="width: 100px">变更类型:</div>
            <el-select
              v-model="changeType"
              clearable
              placeholder="请选择变更类型"
              @change="handleFilter"
              @clear="clearFilter"
            >
              <el-option label="投入量" value="input"></el-option>
              <el-option label="产出量" value="output"></el-option>
            </el-select>
          </div>
          <!-- 操作类型筛选 -->
          <div class="screen_content_second_one">
            <div style="width: 100px">操作类型:</div>
            <el-select
              v-model="barcodeOperation"
              clearable
              placeholder="请选择操作类型"
              @change="handleFilter"
              @clear="clearFilter"
            >
              <el-option label="扫描工序" value="SCAN_PROCESS"></el-option>
              <el-option label="扫描批次" value="SCAN_BATCH_DOC"></el-option>
              <el-option label="解绑工序" value="UNBIND_PROCESS"></el-option>
              <el-option label="初始化产品" value="INITIALIZE_PRODUCT"></el-option>
              <el-option label="手动调整" value="MANUAL_ADJUST"></el-option>
              <el-option label="其他" value="OTHER"></el-option>
            </el-select>
          </div>
          <!-- 操作人员筛选 -->
          <div class="screen_content_second_one">
            <div style="width: 100px">操作人员:</div>
            <el-input
              v-model="operatorId"
              :placeholder="operatorIdSearchMode === 'exact' ? '请输入完整操作人员（精确查询）' : '请输入操作人员（模糊查询）'"
              clearable
              @clear="clearFilter"
            >
              <el-button
                slot="prepend"
                :type="operatorIdSearchMode === 'exact' ? 'primary' : ''"
                @click="toggleOperatorIdSearchMode"
                :title="operatorIdSearchMode === 'exact' ? '当前：精确查询（快速，推荐）' : '当前：模糊查询（较慢，但更灵活）'"
                style="min-width: 60px"
              >
                {{ operatorIdSearchMode === "exact" ? "精确" : "模糊" }}
              </el-button>
            </el-input>
          </div>
          <!-- 日期范围筛选 -->
          <div class="screen_content_second_one date-range">
            <div style="width: 120px">操作时间:</div>
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
          <i class="el-icon-tickets">工单数量变更日志列表</i>
          <div class="statistics-summary" v-if="summaryData">
            <span class="summary-item">
              <i class="el-icon-circle-plus-outline"></i>
              总投入: {{ summaryData.totalInput }}
            </span>
            <span class="summary-item">
              <i class="el-icon-circle-check"></i>
              总产出: {{ summaryData.totalOutput }}
            </span>
            <span class="summary-item">
              <i class="el-icon-document"></i>
              记录数: {{ total }}
            </span>
          </div>
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
      <!-- 工单编号 -->
      <el-table-column align="center" label="工单编号" min-width="140">
        <template slot-scope="scope">
          <el-tooltip
            :content="`点击查看工单详情: ${scope.row.workOrderNo}`"
            placement="top"
            effect="light"
          >
            <span class="link-text" @click="viewWorkOrder(scope.row.workOrderId)">
              {{ scope.row.workOrderNo }}
            </span>
          </el-tooltip>
        </template>
      </el-table-column>

      <!-- 物料信息 -->
      <el-table-column align="center" label="物料信息" min-width="200">
        <template slot-scope="scope">
          <div class="material-info">
            <div class="material-code">{{ scope.row.materialCode }}</div>
            <div class="material-name">{{ scope.row.materialName }}</div>
          </div>
        </template>
      </el-table-column>

      <!-- 变更类型 -->
      <el-table-column align="center" label="变更类型" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.changeType === 'input' ? 'primary' : 'success'" size="medium">
            {{ scope.row.changeType === 'input' ? '投入量' : '产出量' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 变更数量 -->
      <el-table-column align="center" label="变更数量" width="100">
        <template slot-scope="scope">
          <span :class="getQuantityChangeClass(scope.row.changeQuantity)">
            {{ scope.row.changeQuantity > 0 ? '+' : '' }}{{ scope.row.changeQuantity }}
          </span>
        </template>
      </el-table-column>

      <!-- 变更前后 -->
      <el-table-column align="center" label="变更前后" min-width="120">
        <template slot-scope="scope">
          <div class="quantity-change">
            <span class="before-quantity">{{ scope.row.beforeQuantity }}</span>
            <i class="el-icon-right"></i>
            <span class="after-quantity">{{ scope.row.afterQuantity }}</span>
          </div>
        </template>
      </el-table-column>

      <!-- 相关条码 -->
      <el-table-column align="center" label="相关条码" min-width="150">
        <template slot-scope="scope">
          <el-tooltip
            v-if="scope.row.relatedBarcode"
            :content="`点击查看条码详情: ${scope.row.relatedBarcode}`"
            placement="top"
            effect="light"
          >
            <span class="link-text" @click="viewBarcode(scope.row.relatedBarcode)">
              {{ scope.row.relatedBarcode }}
            </span>
          </el-tooltip>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>

      <!-- 操作类型 -->
      <el-table-column align="center" label="操作类型" width="120">
        <template slot-scope="scope">
          <el-tag :type="getOperationTagType(scope.row.barcodeOperation)" size="small">
            {{ getOperationLabel(scope.row.barcodeOperation) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 操作人员 -->
      <el-table-column align="center" label="操作人员" min-width="120">
        <template slot-scope="scope">
          <div>
            {{ scope.row.operatorName || scope.row.operatorId }}
          </div>
          <div class="auto-indicator" v-if="scope.row.isAutomatic">
            <el-tag size="mini" type="info">自动</el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 操作时间 -->
      <el-table-column align="center" label="操作时间" min-width="160">
        <template slot-scope="scope">
          <i class="el-icon-time" />
          <span>{{
            scope.row.operateTime | parseTime("{y}-{m}-{d} {h}:{i}:{s}")
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
      title="工单数量变更日志详情"
      width="70%"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="工单编号">
              {{ currentLog.workOrderNo }}
            </el-descriptions-item>
            <el-descriptions-item label="变更类型">
              <el-tag :type="currentLog.changeType === 'input' ? 'primary' : 'success'">
                {{ currentLog.changeType === 'input' ? '投入量' : '产出量' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="变更数量">
              <span :class="getQuantityChangeClass(currentLog.changeQuantity)">
                {{ currentLog.changeQuantity > 0 ? '+' : '' }}{{ currentLog.changeQuantity }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="变更前数量">
              {{ currentLog.beforeQuantity }}
            </el-descriptions-item>
            <el-descriptions-item label="变更后数量">
              {{ currentLog.afterQuantity }}
            </el-descriptions-item>
            <el-descriptions-item label="相关条码">
              {{ currentLog.relatedBarcode || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="操作类型">
              <el-tag :type="getOperationTagType(currentLog.barcodeOperation)">
                {{ getOperationLabel(currentLog.barcodeOperation) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="操作人员">
              {{ currentLog.operatorName || currentLog.operatorId }}
            </el-descriptions-item>
            <el-descriptions-item label="操作时间" :span="2">
              {{ currentLog.operateTime | parseTime("{y}-{m}-{d} {h}:{i}:{s}") }}
            </el-descriptions-item>
            <el-descriptions-item label="变更原因" :span="2">
              {{ currentLog.reason || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="备注信息" :span="2">
              {{ currentLog.remark || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 物料信息 -->
        <el-tab-pane label="物料信息" name="material">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="物料编码">
              {{ currentLog.materialCode }}
            </el-descriptions-item>
            <el-descriptions-item label="物料名称">
              {{ currentLog.materialName }}
            </el-descriptions-item>
            <el-descriptions-item label="产线ID">
              {{ currentLog.productionLineId || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="产线名称">
              {{ currentLog.productionLineName || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 工序信息 -->
        <el-tab-pane label="工序信息" name="process" v-if="hasProcessInfo">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="工序名称">
              {{ currentLog.processName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="工序编码">
              {{ currentLog.processCode || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 状态变更 -->
        <el-tab-pane label="状态变更" name="status" v-if="hasStatusChange">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="变更前状态">
              {{ currentLog.beforeStatus || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="变更后状态">
              {{ currentLog.afterStatus || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="变更前进度">
              {{ currentLog.beforeProgress ? `${currentLog.beforeProgress}%` : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="变更后进度">
              {{ currentLog.afterProgress ? `${currentLog.afterProgress}%` : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 系统信息 -->
        <el-tab-pane label="系统信息" name="system">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="数据来源">
              {{ currentLog.source || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="是否自动操作">
              <el-tag :type="currentLog.isAutomatic ? 'success' : 'warning'">
                {{ currentLog.isAutomatic ? '自动' : '手动' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="IP地址">
              {{ currentLog.ipAddress || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="用户代理">
              {{ currentLog.userAgent || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="2">
              {{ currentLog.createdAt | parseTime("{y}-{m}-{d} {h}:{i}:{s}") }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 统计分析弹窗 -->
    <el-dialog
      :visible.sync="statisticsVisible"
      title="工单数量变更统计分析"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="statistics-container">
        <!-- 统计概览 -->
        <el-row :gutter="20" class="statistics-overview">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon input-icon">
                <i class="el-icon-circle-plus-outline"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.totalInputChanges }}</div>
                <div class="stat-label">投入量变更次数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon output-icon">
                <i class="el-icon-circle-check"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.totalOutputChanges }}</div>
                <div class="stat-label">产出量变更次数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon total-icon">
                <i class="el-icon-document"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.totalRecords }}</div>
                <div class="stat-label">总记录数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon auto-icon">
                <i class="el-icon-magic-stick"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.autoOperationPercent }}%</div>
                <div class="stat-label">自动操作占比</div>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 操作类型分布 -->
        <el-card class="statistics-section">
          <div slot="header">
            <span>操作类型分布</span>
          </div>
          <el-table :data="statistics.operationTypeStats" border size="small">
            <el-table-column label="操作类型" align="center">
              <template slot-scope="scope">
                <el-tag :type="getOperationTagType(scope.row.type)">
                  {{ getOperationLabel(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="记录数" prop="count" align="center"></el-table-column>
            <el-table-column label="占比" align="center">
              <template slot-scope="scope">
                {{ ((scope.row.count / statistics.totalRecords) * 100).toFixed(1) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData } from "@/api/data";
import { parseTime } from "@/utils/index";
import XLSX from "xlsx";

export default {
  name: "workOrderQuantityLog",
  data() {
    return {
      // 列表数据
      logList: [],
      listLoading: true,
      total: 0,
      downloadLoading: false,

      // 查询参数
      workOrderNo: "",
      materialCode: "",
      relatedBarcode: "",
      changeType: "",
      barcodeOperation: "",
      operatorId: "",
      dateRange: [],
      listQuery: {
        page: 1,
        limit: 10,
      },
      // 查询模式状态变量（精确/模糊查询切换）
      workOrderNoSearchMode: "exact", // 'exact' 精确查询, 'fuzzy' 模糊查询
      materialCodeSearchMode: "exact",
      relatedBarcodeSearchMode: "exact",
      operatorIdSearchMode: "exact",

      // 详情弹窗
      logDetailVisible: false,
      currentLog: {},
      activeTab: "basic",

      // 统计分析
      statisticsVisible: false,
      statistics: {
        totalInputChanges: 0,
        totalOutputChanges: 0,
        totalRecords: 0,
        autoOperationPercent: 0,
        operationTypeStats: [],
      },

      // 汇总数据
      summaryData: null,
    };
  },
  computed: {
    hasProcessInfo() {
      return this.currentLog.processName || this.currentLog.processCode;
    },
    hasStatusChange() {
      return this.currentLog.beforeStatus || this.currentLog.afterStatus ||
             this.currentLog.beforeProgress !== undefined || this.currentLog.afterProgress !== undefined;
    },
  },
  created() {
    this.fetchData();
    this.loadSummaryData();
  },
  methods: {
    // 获取数据
    fetchData() {
      this.listLoading = true;

      // 构建查询条件
      const query = this.buildQuery();

      const data = {
        query,
        limit: this.listQuery.limit,
        sort: { operateTime: -1 },
        populate: JSON.stringify([
          { path: "workOrderId", select: "workOrderNo" },
          { path: "materialId", select: "FNumber FName" },
        ]),
        skip: (this.listQuery.page - 1) * this.listQuery.limit,
        count: true,
      };

      getData("workOrderQuantityLog", data)
        .then((response) => {
          this.logList = response.data || [];
          this.total = response.countnum || 0;
        })
        .catch((error) => {
          console.error("获取工单数量变更日志失败:", error);
          this.$notify({
            title: "错误",
            message: "获取日志数据失败",
            type: "error",
          });
        })
        .finally(() => {
          this.listLoading = false;
        });
    },

    // 加载汇总数据
    loadSummaryData() {
      const query = this.buildQuery();
      
      // 获取统计数据
      getData("workOrderQuantityLog", {
        query,
        aggregate: JSON.stringify([
          {
            $group: {
              _id: "$changeType",
              totalQuantity: { $sum: "$changeQuantity" },
              count: { $sum: 1 }
            }
          }
        ])
      }).then(response => {
        const aggregateData = response.data || [];
        const summary = {
          totalInput: 0,
          totalOutput: 0
        };
        
        aggregateData.forEach(item => {
          if (item._id === 'input') {
            summary.totalInput = item.totalQuantity;
          } else if (item._id === 'output') {
            summary.totalOutput = item.totalQuantity;
          }
        });
        
        this.summaryData = summary;
      }).catch(error => {
        console.error("获取汇总数据失败:", error);
      });
    },

    // 切换查询模式的方法
    toggleWorkOrderNoSearchMode() {
      this.workOrderNoSearchMode = this.workOrderNoSearchMode === "exact" ? "fuzzy" : "exact";
      const tipText = this.workOrderNoSearchMode === "exact" 
        ? "工单编号已切换到精确查询模式（快速，推荐）" 
        : "工单编号已切换到模糊查询模式（较慢，但更灵活）";
      this.$message.info({ message: tipText, duration: 2000 });
    },
    toggleMaterialCodeSearchMode() {
      this.materialCodeSearchMode = this.materialCodeSearchMode === "exact" ? "fuzzy" : "exact";
      const tipText = this.materialCodeSearchMode === "exact" 
        ? "物料编码已切换到精确查询模式（快速，推荐）" 
        : "物料编码已切换到模糊查询模式（较慢，但更灵活）";
      this.$message.info({ message: tipText, duration: 2000 });
    },
    toggleRelatedBarcodeSearchMode() {
      this.relatedBarcodeSearchMode = this.relatedBarcodeSearchMode === "exact" ? "fuzzy" : "exact";
      const tipText = this.relatedBarcodeSearchMode === "exact" 
        ? "相关条码已切换到精确查询模式（快速，推荐）" 
        : "相关条码已切换到模糊查询模式（较慢，但更灵活）";
      this.$message.info({ message: tipText, duration: 2000 });
    },
    toggleOperatorIdSearchMode() {
      this.operatorIdSearchMode = this.operatorIdSearchMode === "exact" ? "fuzzy" : "exact";
      const tipText = this.operatorIdSearchMode === "exact" 
        ? "操作人员已切换到精确查询模式（快速，推荐）" 
        : "操作人员已切换到模糊查询模式（较慢，但更灵活）";
      this.$message.info({ message: tipText, duration: 2000 });
    },
    // 构建查询条件（支持精确/模糊查询切换）
    buildQuery() {
      const query = {};
      const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      if (this.workOrderNo && this.workOrderNo.trim()) {
        const workOrderNoInput = this.workOrderNo.trim();
        if (this.workOrderNoSearchMode === "exact") {
          query.workOrderNo = workOrderNoInput;
        } else {
          if (workOrderNoInput.length < 3) {
            this.$message.warning({
              message: "工单编号模糊查询建议输入至少3个字符，否则查询范围过大可能影响性能",
              duration: 4000,
            });
          }
          query.workOrderNo = {
            $regex: escapeRegex(workOrderNoInput),
            $options: "i",
          };
        }
      }

      if (this.materialCode && this.materialCode.trim()) {
        const materialCodeInput = this.materialCode.trim();
        if (this.materialCodeSearchMode === "exact") {
          query.materialCode = materialCodeInput;
        } else {
          if (materialCodeInput.length < 3) {
            this.$message.warning({
              message: "物料编码模糊查询建议输入至少3个字符，否则查询范围过大可能影响性能",
              duration: 4000,
            });
          }
          query.materialCode = {
            $regex: escapeRegex(materialCodeInput),
            $options: "i",
          };
        }
      }

      if (this.relatedBarcode && this.relatedBarcode.trim()) {
        const relatedBarcodeInput = this.relatedBarcode.trim();
        if (this.relatedBarcodeSearchMode === "exact") {
          query.relatedBarcode = relatedBarcodeInput;
        } else {
          if (relatedBarcodeInput.length < 3) {
            this.$message.warning({
              message: "相关条码模糊查询建议输入至少3个字符，否则查询范围过大可能影响性能",
              duration: 4000,
            });
          }
          query.relatedBarcode = {
            $regex: escapeRegex(relatedBarcodeInput),
            $options: "i",
          };
        }
      }

      if (this.changeType) {
        query.changeType = this.changeType;
      }

      if (this.barcodeOperation) {
        query.barcodeOperation = this.barcodeOperation;
      }

      if (this.operatorId && this.operatorId.trim()) {
        const operatorIdInput = this.operatorId.trim();
        if (this.operatorIdSearchMode === "exact") {
          query.operatorId = operatorIdInput;
        } else {
          if (operatorIdInput.length < 3) {
            this.$message.warning({
              message: "操作人员模糊查询建议输入至少3个字符，否则查询范围过大可能影响性能",
              duration: 4000,
            });
          }
          query.operatorId = {
            $regex: escapeRegex(operatorIdInput),
            $options: "i",
          };
        }
      }

      // 处理日期范围
      if (this.dateRange && this.dateRange.length === 2) {
        const [startDate, endDate] = this.dateRange;
        if (startDate && endDate) {
          query.operateTime = {
            $gte: new Date(startDate).toISOString(),
            $lte: new Date(endDate).toISOString()
          };
        }
      }

      return query;
    },

    // 查看日志详情
    viewLogDetail(log) {
      this.currentLog = log;
      this.activeTab = "basic";
      this.logDetailVisible = true;
    },

    // 查看工单详情
    viewWorkOrder(workOrderId) {
      // 这里可以跳转到工单详情页面或打开工单详情弹窗
      this.$notify({
        title: "提示",
        message: `查看工单详情: ${workOrderId}`,
        type: "info",
      });
    },

    // 查看条码详情
    viewBarcode(barcode) {
      // 这里可以跳转到条码详情页面或打开条码详情弹窗
      this.$notify({
        title: "提示",
        message: `查看条码详情: ${barcode}`,
        type: "info",
      });
    },

    // 显示统计分析
    showStatistics() {
      this.statisticsVisible = true;
      this.loadStatistics();
    },

    // 加载统计数据
    loadStatistics() {
      const query = this.buildQuery();

      // 获取详细统计数据
      Promise.all([
        // 获取基本统计
        getData("workOrderQuantityLog", {
          query,
          aggregate: JSON.stringify([
            {
              $group: {
                _id: null,
                totalInputChanges: {
                  $sum: { $cond: [{ $eq: ["$changeType", "input"] }, 1, 0] }
                },
                totalOutputChanges: {
                  $sum: { $cond: [{ $eq: ["$changeType", "output"] }, 1, 0] }
                },
                totalRecords: { $sum: 1 },
                autoOperations: {
                  $sum: { $cond: ["$isAutomatic", 1, 0] }
                }
              }
            }
          ])
        }),
        // 获取操作类型统计
        getData("workOrderQuantityLog", {
          query,
          aggregate: JSON.stringify([
            {
              $group: {
                _id: "$barcodeOperation",
                count: { $sum: 1 }
              }
            },
            {
              $sort: { count: -1 }
            }
          ])
        })
      ]).then(([basicStats, operationStats]) => {
        const basic = basicStats.data[0] || {};
        this.statistics = {
          totalInputChanges: basic.totalInputChanges || 0,
          totalOutputChanges: basic.totalOutputChanges || 0,
          totalRecords: basic.totalRecords || 0,
          autoOperationPercent: basic.totalRecords ? 
            Math.round((basic.autoOperations / basic.totalRecords) * 100) : 0,
          operationTypeStats: (operationStats.data || []).map(item => ({
            type: item._id || 'OTHER',
            count: item.count
          }))
        };
      }).catch(error => {
        console.error("获取统计数据失败:", error);
        this.$notify({
          title: "错误",
          message: "获取统计数据失败",
          type: "error",
        });
      });
    },

    // 处理筛选
    handleFilter() {
      this.listQuery.page = 1;
      this.fetchData();
      this.loadSummaryData();
    },

    // 清除过滤器
    clearFilter() {
      this.fetchData();
      this.loadSummaryData();
    },

    // 重置过滤器
    resetFilter() {
      this.workOrderNo = "";
      this.materialCode = "";
      this.relatedBarcode = "";
      this.changeType = "";
      this.barcodeOperation = "";
      this.operatorId = "";
      this.dateRange = [];
      // 重置所有查询模式为精确查询
      this.workOrderNoSearchMode = "exact";
      this.materialCodeSearchMode = "exact";
      this.relatedBarcodeSearchMode = "exact";
      this.operatorIdSearchMode = "exact";
      this.listQuery.page = 1;
      this.fetchData();
      this.loadSummaryData();
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

    // 获取数量变更样式类名
    getQuantityChangeClass(quantity) {
      if (quantity > 0) return "quantity-increase";
      if (quantity < 0) return "quantity-decrease";
      return "";
    },

    // 获取操作类型标签类型
    getOperationTagType(operation) {
      const typeMap = {
        SCAN_PROCESS: "primary",
        SCAN_BATCH_DOC: "success",
        UNBIND_PROCESS: "warning",
        INITIALIZE_PRODUCT: "danger",
        MANUAL_ADJUST: "info",
        OTHER: "info",
      };
      return typeMap[operation] || "info";
    },

    // 获取操作类型标签文本
    getOperationLabel(operation) {
      const labelMap = {
        SCAN_PROCESS: "扫描工序",
        SCAN_BATCH_DOC: "扫描批次",
        UNBIND_PROCESS: "解绑工序",
        INITIALIZE_PRODUCT: "初始化产品",
        MANUAL_ADJUST: "手动调整",
        OTHER: "其他",
      };
      return labelMap[operation] || "未知";
    },

    // 导出日志
    handleExport() {
      this.$confirm("确认导出工单数量变更日志吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.downloadLoading = true;

          // 构建查询条件
          const query = this.buildQuery();

          // 获取要导出的数据
          getData("workOrderQuantityLog", {
            query,
            sort: { operateTime: -1 },
            limit: 5000, // 限制导出数量
          })
            .then((response) => {
              const logs = response.data || [];

              // 准备导出数据
              const exportData = logs.map((log) => ({
                工单编号: log.workOrderNo,
                物料编码: log.materialCode,
                物料名称: log.materialName,
                变更类型: log.changeType === 'input' ? '投入量' : '产出量',
                变更数量: log.changeQuantity,
                变更前数量: log.beforeQuantity,
                变更后数量: log.afterQuantity,
                相关条码: log.relatedBarcode || '-',
                操作类型: this.getOperationLabel(log.barcodeOperation),
                操作人员: log.operatorName || log.operatorId,
                操作时间: parseTime(log.operateTime, "{y}-{m}-{d} {h}:{i}:{s}"),
                变更原因: log.reason || '-',
                备注信息: log.remark || '-',
                是否自动: log.isAutomatic ? '是' : '否',
                数据来源: log.source || '-',
              }));

              // 生成Excel文件
              const wb = XLSX.utils.book_new();
              const ws = XLSX.utils.json_to_sheet(exportData);

              // 设置列宽
              const colWidths = [
                { wch: 20 }, // 工单编号
                { wch: 20 }, // 物料编码
                { wch: 30 }, // 物料名称
                { wch: 12 }, // 变更类型
                { wch: 12 }, // 变更数量
                { wch: 12 }, // 变更前数量
                { wch: 12 }, // 变更后数量
                { wch: 25 }, // 相关条码
                { wch: 15 }, // 操作类型
                { wch: 20 }, // 操作人员
                { wch: 20 }, // 操作时间
                { wch: 30 }, // 变更原因
                { wch: 30 }, // 备注信息
                { wch: 10 }, // 是否自动
                { wch: 12 }, // 数据来源
              ];
              ws["!cols"] = colWidths;

              XLSX.utils.book_append_sheet(wb, ws, "工单数量变更日志");

              // 导出文件
              const now = parseTime(new Date(), "{y}{m}{d}{h}{i}");
              XLSX.writeFile(wb, `工单数量变更日志_${now}.xlsx`);

              this.$notify({
                title: "成功",
                message: "导出成功",
                type: "success",
                duration: 2000,
              });
            })
            .catch((error) => {
              console.error("导出工单数量变更日志失败:", error);
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

  .statistics-summary {
    display: flex;
    gap: 20px;
    
    .summary-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 14px;
      color: #606266;
      
      i {
        font-size: 16px;
      }
    }
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
      width: 200px;
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
.material-info {
  .material-code {
    font-weight: bold;
    font-size: 13px;
  }
  
  .material-name {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }
}

.quantity-change {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .before-quantity {
    color: #909399;
  }
  
  .after-quantity {
    font-weight: bold;
    color: #409eff;
  }
}

.link-text {
  color: #409eff;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
}

.auto-indicator {
  margin-top: 5px;
}

.text-muted {
  color: #909399;
}

.quantity-increase {
  color: #67c23a;
  font-weight: bold;
}

.quantity-decrease {
  color: #f56c6c;
  font-weight: bold;
}

// 统计分析样式
.statistics-container {
  .statistics-overview {
    margin-bottom: 30px;
  }
  
  .stat-card {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #fff;
      
      &.input-icon {
        background: #409eff;
      }
      
      &.output-icon {
        background: #67c23a;
      }
      
      &.total-icon {
        background: #e6a23c;
      }
      
      &.auto-icon {
        background: #909399;
      }
    }
    
    .stat-content {
      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
        line-height: 1;
      }
      
      .stat-label {
        font-size: 14px;
        color: #606266;
        margin-top: 8px;
      }
    }
  }
  
  .statistics-section {
    margin-bottom: 20px;
  }
}

::v-deep {
  .el-table td {
    vertical-align: middle;
  }

  .el-tag {
    text-transform: none;
  }

  .el-descriptions-item__label {
    width: 120px;
  }
}
</style> 