<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div slot="header" class="clearfix">
        <span>筛选搜索</span>
        <el-button
          style="float: right; padding: 3px 0"
          type="text"
          @click="toggleAdvanced"
        >
          {{ showAdvanced ? "收起" : "展开" }}高级搜索
        </el-button>
      </div>

      <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="工单号">
              <el-input
                v-model="searchForm.workOrderNo"
                placeholder="请输入工单号"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="工单状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择工单状态"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="dict in dict.type.work_order_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="销售单号">
              <zr-select
                v-model="searchForm.saleOrderNo"
                collection="k3_SAL_SaleOrder"
                :search-fields="['FBillNo']"
                label-key="FBillNo"
                value-key="FBillNo"
                sub-key="FBillNo"
                :multiple="false"
                placeholder="请输入销售单号"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.FBillNo }}</span>
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.FBillNo }} - {{ item.FSaleOrgId }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="生产单号">
              <zr-select
                v-model="searchForm.productionOrderNo"
                collection="k3_PRD_MO"
                :search-fields="['FBillNo']"
                label-key="FBillNo"
                value-key="FBillNo"
                sub-key="FBillNo"
                :multiple="false"
                placeholder="请输入生产单号"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.FBillNo }}</span>
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.FBillNo }} - {{ item.FUseOrgId_FName }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="产品名称">
              <zr-select
                v-model="searchForm.materialName"
                collection="k3_BD_MATERIAL"
                :search-fields="['FNumber', 'FName']"
                label-key="FName"
                value-key="FName"
                sub-key="FMATERIALID"
                :multiple="false"
                placeholder="请输入物料编码/名称搜索"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label"
                        >{{ item.FNumber }} - {{ item.FName }}</span
                      >
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.FMATERIALID }} - {{ item.FUseOrgId_FName }}
                      </el-tag>
                    </div>
                    <div class="option-sub" v-if="item.FSpecification">
                      <small>规格: {{ item.FSpecification }}</small>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="产线名称">
              <zr-select
                v-model="searchForm.lineName"
                collection="production_line"
                :search-fields="['lineCode', 'lineName']"
                label-key="lineName"
                sub-key="lineCode"
                :multiple="false"
                placeholder="请输入产线编码/名称搜索"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label"
                        >{{ item.lineCode }} - {{ item.lineName }}</span
                      >
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.lineCode }} - {{ item.lineNum }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="报废数量">
              <el-input-number
                v-model="searchForm.scrapQuantity"
                placeholder="最低报废数量"
                :min="0"
                controls-position="right"
                clearable
                style="width: 100%"
              ></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="18">
            <el-form-item label="计划时间">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="search" v-if="$checkPermission('生产计划查询')">查询搜索</el-button>
          <el-button @click="resetForm" v-if="$checkPermission('生产计划重置')">重置</el-button>
          <el-button type="success" @click="exportData" v-if="$checkPermission('生产计划导出数据')">导出数据</el-button>
          <el-button type="primary" icon="el-icon-plus" @click="handleAdd" v-if="$checkPermission('生产计划新增工单')">新增工单</el-button>
          <el-button
            type="danger"
            icon="el-icon-delete"
            :disabled="!selection.length"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="screen1">
      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-tickets">生产计划工单列表</i>
        </div>
      </div>
    </div>

    <base-table
      ref="baseTable"
      :currentPage="currentPage"
      :highlight-current-row="true"
      :pageSize="pageSize"
      :tableData="tableList"
      :tableDataloading="listLoading"
      :total="total"
      @selection-change="handleSelectionChange"
      @handleCurrentChange="baseTableHandleCurrentChange"
      @handleSizeChange="baseTableHandleSizeChange"
    >
      <template slot="law">
        <el-table-column type="selection" width="55" />

        <el-table-column label="工单号" width="150">
          <template slot-scope="scope">
            <el-link type="primary">{{ scope.row.workOrderNo }}</el-link>
          </template>
        </el-table-column>

        <el-table-column label="工单状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="销售单号" width="150">
          <template slot-scope="scope">
            {{ scope.row.saleOrderNo }}
          </template>
        </el-table-column>

        <el-table-column label="生产单号" width="150">
          <template slot-scope="scope">
            {{ scope.row.productionOrderNo }}
          </template>
        </el-table-column>

        <el-table-column label="产品名称" width="200">
          <template slot-scope="scope">
            {{ scope.row.materialName }}
          </template>
        </el-table-column>

        <el-table-column label="产品规格" width="120">
          <template slot-scope="scope">
            {{ scope.row.fSpecification }}
          </template>
        </el-table-column>

        <el-table-column label="产品编码" width="200" align="center">
          <template slot-scope="scope">
            {{ scope.row.materialNumber }}
          </template>
        </el-table-column>

        <el-table-column label="产线名称" width="120">
          <template slot-scope="scope">
            {{ scope.row.lineName }}
          </template>
        </el-table-column>

        <el-table-column label="业务类型" width="100">
          <template slot-scope="scope">
            {{ scope.row.businessType }}
          </template>
        </el-table-column>

        <el-table-column label="需生产数量" width="100">
          <template slot-scope="scope">
            {{ scope.row.planQuantity }}
          </template>
        </el-table-column>

        <!-- <el-table-column label="已排产数量" width="100">
                    <template slot-scope="scope">
                        {{ totalPlanQuantity(scope.row) }}
                    </template>
                </el-table-column>

                <el-table-column label="已生产数量" width="100">
                    <template slot-scope="scope">
                        {{totalOutputQuantity(scope.row) }}
                    </template>
                </el-table-column>

                <el-table-column label="未排产数量" width="100">
                    <template slot-scope="scope">
                        {{ totalRemainingQuantity(scope.row) }}
                    </template>
                </el-table-column> -->

        <el-table-column label="工单数量" width="100">
          <template slot-scope="scope">
            {{ scope.row.planProductionQuantity }}
          </template>
        </el-table-column>

        <el-table-column label="投入数量" width="100">
          <template slot-scope="scope">
            {{ scope.row.inputQuantity }}
          </template>
        </el-table-column>
        <el-table-column label="产出数量" width="100">
          <template slot-scope="scope">
            {{ scope.row.outputQuantity }}
          </template>
        </el-table-column>

        <el-table-column label="报废数量" width="100">
          <template slot-scope="scope">
            {{ scope.row.scrapQuantity || 0 }}
          </template>
        </el-table-column>

        <el-table-column label="报废条码" width="100">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              @click="viewScrapBarcode(scope.row)"
              v-if="
                scope.row.scrapProductBarcodeList &&
                scope.row.scrapProductBarcodeList.length > 0
              "
            >
              查看 ({{ scope.row.scrapProductBarcodeList.length }})
            </el-button>
            <span v-else>暂无数据</span>
          </template>
        </el-table-column>

        <!-- 计划状态 -->
        <el-table-column label="计划状态" width="100">
          <template slot-scope="scope">
            {{ scope.row.status }}
          </template>
        </el-table-column>

        <el-table-column label="计划开始时间" width="150">
          <template slot-scope="scope">
            {{ formatDate(scope.row.planStartTime) }}
          </template>
        </el-table-column>

        <el-table-column label="计划结束时间" width="150">
          <template slot-scope="scope">
            {{ formatDate(scope.row.planEndTime) }}
          </template>
        </el-table-column>

        <el-table-column label="原单数量" width="100">
          <template slot-scope="scope">
            {{
              scope.row.originalWorkOrderId ? scope.row.supplementQuantity : 0
            }}
          </template>
        </el-table-column>

        <el-table-column label="补单标识" width="100">
          <template slot-scope="scope">
            <span v-if="scope.row.originalWorkOrderNo">补单</span>
            <span v-else>正常单</span>
          </template>
        </el-table-column>

        <!-- 添加创建人和更新人信息 -->
        <el-table-column label="创建人" width="100">
          <template slot-scope="scope">
            {{ scope.row.createBy || "暂无" }}
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="150">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createAt, true) }}
          </template>
        </el-table-column>

        <el-table-column label="更新人" width="100">
          <template slot-scope="scope">
            {{ scope.row.updateBy || "暂无" }}
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="150">
          <template slot-scope="scope">
            {{ formatDate(scope.row.updateAt, true) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="300" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleEdit(scope.row)">
              <i class="el-icon-edit"></i> 编辑
            </el-button>
            <el-button
              type="text"
              size="small"
              class="delete-btn"
              @click="handleDelete(scope.row)"
            >
              <i class="el-icon-delete"></i> 删除
            </el-button>
          </template>
        </el-table-column>
      </template>
    </base-table>

    <edit-dialog
      :visible.sync="dialogFormVisible"
      :dialog-status="dialogStatus"
      :row-data="dataForm"
      @submit="handleSubmit"
    />

    <!-- 报废条码详情弹窗 -->
    <el-dialog
      title="报废条码详情"
      :visible.sync="scrapBarcodeDialogVisible"
      width="60%"
    >
      <div class="scrap-barcode-container">
        <el-card class="scrap-barcode-info">
          <div slot="header" class="clearfix">
            <span>工单信息</span>
          </div>
          <div class="info-item">
            <span class="label">工单号:</span>
            <span class="value">{{ scrapDetailData.workOrderNo }}</span>
          </div>
          <div class="info-item">
            <span class="label">产品名称:</span>
            <span class="value">{{ scrapDetailData.materialName }}</span>
          </div>
          <div class="info-item">
            <span class="label">产品规格:</span>
            <span class="value">{{ scrapDetailData.fSpecification }}</span>
          </div>
          <div class="info-item">
            <span class="label">报废总数:</span>
            <span class="value">{{ scrapDetailData.scrapQuantity || 0 }}</span>
          </div>
        </el-card>

        <el-table
          :data="scrapDetailData.scrapProductBarcodeList || []"
          style="width: 100%; margin-top: 20px"
          border
          v-loading="scrapBarcodeLoading"
        >
          <el-table-column
            type="index"
            label="序号"
            width="80"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="barcode"
            label="报废条码"
            min-width="240"
          ></el-table-column>
          <el-table-column label="报废时间" min-width="180">
            <template slot-scope="scope">
              {{ formatDate(scope.row.scrapTime, true) }}
            </template>
          </el-table-column>
          <template slot="empty">
            <div class="empty-text">
              <el-empty description="暂无报废条码数据"></el-empty>
            </div>
          </template>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import EditDialog from "./components/EditDialog";
import { checkComponentName } from "@/utils/debugHelper";

export default {
  name: "ProductionOrder",
  dicts: ["product_type", "businessType", "work_order_status"],
  components: {
    EditDialog,
  },
  data() {
    return {
      searchForm: {
        workOrderNo: "",
        status: "",
        saleOrderNo: "",
        productionOrderNo: "",
        materialName: "",
        lineName: "",
        businessType: "",
        dateRange: [],
      },
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: true,
      showAdvanced: false,
      dialogFormVisible: false,
      dialogStatus: "",
      detailDialogVisible: false,
      selection: [], // 存储选中的记录
      dataForm: {},
      quantityMap: new Map(), // 用于存储两种数量的计算结果
      scrapBarcodeDialogVisible: false,
      scrapDetailData: {},
      scrapBarcodeLoading: false,
    };
  },
  computed: {
    // 返回计算planProductionQuantity总和的函数
    totalPlanQuantity() {
      return (row) => {
        const cache = this.quantityMap.get(row._id);
        if (cache) {
          return cache.planQuantity;
        }
        this.calculateAndCacheQuantities(row);
        return 0;
      };
    },

    // 返回计算outputQuantity总和的函数
    totalOutputQuantity() {
      return (row) => {
        const cache = this.quantityMap.get(row._id);
        if (cache) {
          return cache.outputQuantity;
        }
        this.calculateAndCacheQuantities(row);
        return 0;
      };
    },

    // 返回计算剩余可排产数量的函数
    totalRemainingQuantity() {
      return (row) => {
        try {
          // 确保 FQty 是数字
          const totalQty = parseFloat(row.FQty) || 0;

          const cache = this.quantityMap.get(row._id);
          if (cache) {
            // 确保 planQuantity 是数字
            const planQty = parseFloat(cache.planQuantity) || 0;
            return Math.max(0, totalQty - planQty);
          }

          this.calculateAndCacheQuantities(row);
          return totalQty; // 首次返回转换后的总需求量
        } catch (error) {
          console.error("计算剩余数量出错:", error);
          return 0;
        }
      };
    },
  },
  methods: {
    // 计算并缓存两种数量
    async calculateAndCacheQuantities(row) {
      try {
        const result = await getData("production_plan_work_order", {
          query: {
            productionOrderId: row._id,
            status: { $ne: "CANCELLED" }, // 排除已取消的工单
          },
          select: "planProductionQuantity outputQuantity",
        });

        const totals = result.data.reduce(
          (acc, item) => {
            return {
              planQuantity:
                acc.planQuantity + (item.planProductionQuantity || 0),
              outputQuantity: acc.outputQuantity + (item.outputQuantity || 0),
            };
          },
          { planQuantity: 0, outputQuantity: 0 }
        );

        this.quantityMap.set(row._id, totals);
        this.$forceUpdate();
      } catch (error) {
        console.error("计算汇总数失败:", error);
        this.quantityMap.set(row._id, { planQuantity: 0, outputQuantity: 0 });
      }
    },

    // 清除缓存的方法（在需要更新数据时调用）
    clearQuantityCache(rowId) {
      if (rowId) {
        this.quantityMap.delete(rowId);
      } else {
        this.quantityMap.clear();
      }
    },

    // 获取状态标签类型
    getStatusType(status) {
      const statusMap = {
        PENDING: "info",
        PAUSED: "warning",
        IN_PROGRESS: "primary",
        COMPLETED: "success",
        CANCELLED: "danger",
      };
      return statusMap[status] || "info";
    },

    // 获取状态显示文本
    getStatusText(status) {
      const statusMap = {
        PENDING: "待生产",
        PAUSED: "已暂停",
        IN_PROGRESS: "生产中",
        COMPLETED: "已完成",
        CANCELLED: "已取消",
      };
      return statusMap[status] || status;
    },

    // 构建查询条件
    searchData() {
      let req = {
        query: {
          $and: [],
        },
      };

      // 基础字段查询
      if (this.searchForm.workOrderNo) {
        req.query.$and.push({
          workOrderNo: { $regex: this.searchForm.workOrderNo, $options: "i" },
        });
      }
      if (this.searchForm.status) {
        req.query.$and.push({ status: this.searchForm.status });
      }
      if (this.searchForm.saleOrderNo) {
        req.query.$and.push({
          saleOrderNo: { $regex: this.searchForm.saleOrderNo, $options: "i" },
        });
      }
      if (this.searchForm.productionOrderNo) {
        req.query.$and.push({
          productionOrderNo: {
            $regex: this.searchForm.productionOrderNo,
            $options: "i",
          },
        });
      }
      if (this.searchForm.materialName) {
        req.query.$and.push({
          materialName: { $regex: this.searchForm.materialName, $options: "i" },
        });
      }
      if (this.searchForm.lineName) {
        req.query.$and.push({ productionLineId: this.searchForm.lineName });
      }
      if (this.searchForm.businessType) {
        req.query.$and.push({ businessType: this.searchForm.businessType });
      }

      // 处理日期范围查询
      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        req.query.$and.push({
          planStartTime: {
            $gte: new Date(this.searchForm.dateRange[0]),
            $lte: new Date(this.searchForm.dateRange[1]),
          },
        });
      }

      if (!req.query.$and.length) {
        delete req.query.$and;
      }

      return req;
    },

    // 重置表单
    resetForm() {
      this.$refs.searchForm.resetFields();
      this.searchForm = {
        workOrderNo: "",
        status: "",
        saleOrderNo: "",
        productionOrderNo: "",
        materialName: "",
        lineName: "",
        businessType: "",
        dateRange: [],
      };
      this.currentPage = 1;
      this.fetchData();
    },

    // 获取数据
    async fetchData() {
      this.listLoading = true;
      try {
        let req = this.searchData();
        req.page = this.currentPage;
        req.skip = (this.currentPage - 1) * this.pageSize;
        req.limit = this.pageSize;
        req.sort = { planStartTime: -1 };
        req.count = true;

        // 清空数据缓存，确保获取最新数据
        this.clearQuantityCache();
        
        const result = await getData("production_plan_work_order", req);
        this.tableList = result.data;
        this.total = result.countnum;
      } catch (error) {
        console.error("获取数据失败:", error);
        this.$message.error("获取数据失败");
      } finally {
        this.listLoading = false;
      }
    },

    // 导出数据
    async exportData() {
      try {
        this.$message({
          message: "正在导出数据,请稍候...",
          type: "info",
        });

        const loading = this.$loading({
          lock: true,
          text: "导出中...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        let req = this.searchData();
        req.limit = 1000000;
        const response = await getData("k3_PRD_MO", req);

        if (!response.data || response.data.length === 0) {
          this.$message.warning("没有数据可供导出");
          loading.close();
          return;
        }

        // 导出配置
        const exportConfig = {
          FBillNo: "单据编号",
          FDocumentStatus: "单据状态",
          FDate: "单据日期",
          FWorkShopID_FName: "生产车间",
          FMaterialId: "物料编码",
          FMaterialName: "物料名称",
          FSpecification: "规格型号",
          FProductType: "产品类型",
          FUnitId: "单位",
          FQty: "数量",
          FPlanStartDate: "计划开工时间",
          FPlanFinishDate: "计划完工时间",
        };

        // 处理数据
        const processedData = response.data.map((item) => {
          const row = {};
          Object.keys(exportConfig).forEach((key) => {
            if (key.includes("Date")) {
              row[exportConfig[key]] = this.formatDate(item[key]);
            } else {
              row[exportConfig[key]] = item[key];
            }
          });
          return row;
        });

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(processedData);

        // 设置列宽
        const colWidths = Object.values(exportConfig).map((header) => ({
          wch: Math.max(header.length * 2, 15),
        }));
        ws["!cols"] = colWidths;

        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws, "生产订单数据");

        // 下载文件
        XLSX.writeFile(wb, "生产订单数据.xlsx");
        loading.close();
        this.$message.success("导出成功");
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败");
      }
    },

    // 分页方法
    baseTableHandleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.fetchData();
    },

    baseTableHandleSizeChange(pageSize) {
      this.pageSize = pageSize;
      this.fetchData();
    },

    // 切换高级搜索
    toggleAdvanced() {
      this.showAdvanced = !this.showAdvanced;
    },

    // 格式化日期
    formatDate(date, isDateTime = false) {
      if (!date) return "暂无数据";
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "无效日期";
      }
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");

      if (isDateTime) {
        const hour = String(dateObj.getHours()).padStart(2, "0");
        const minute = String(dateObj.getMinutes()).padStart(2, "0");
        const second = String(dateObj.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
      }

      return `${year}-${month}-${day}`;
    },

    // 格式化数字
    formatNumber(num) {
      if (!num && num !== 0) return "0";
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    // 搜索方法
    search() {
      this.currentPage = 1; // 重置页码到第一页
      this.fetchData(); // 获取数据
    },

    // 表格多选事件
    handleSelectionChange(selection) {
      this.selection = selection;
    },

    // 查看详情
    handleView(row) {
      this.dataForm = JSON.parse(JSON.stringify(row));
      this.dialogStatus = "view";
      this.dialogFormVisible = true;
    },

    // 删除
    handleDelete(row) {
      this.$confirm("确认要删除该生产订单吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          try {
            await removeData("production_plan_work_order", {
              query: { _id: row._id },
            });
            // 清除该行的缓存数据
            this.clearQuantityCache(row._id);
            this.$message.success("删除成功");
            this.fetchData();
          } catch (error) {
            console.error("删除失败:", error);
            this.$message.error("删除失败");
          }
        })
        .catch(() => {
          this.$message.info("已取消删除");
        });
    },

    // 编辑按钮点击事件
    async handleEdit(row) {
      this.listLoading = true;
      try {
        // 从服务器获取最新数据，避免使用缓存数据
        const result = await getData("production_plan_work_order", {
          query: { _id: row._id }
        });
        
        if (result.data && result.data.length > 0) {
          this.dialogStatus = "edit";
          this.dataForm = JSON.parse(JSON.stringify(result.data[0]));
          this.dialogFormVisible = true;
        } else {
          this.$message.error("获取最新工单数据失败");
        }
      } catch (error) {
        console.error("获取工单详情失败:", error);
        this.$message.error("获取工单详情失败");
      } finally {
        this.listLoading = false;
      }
    },

    // 提交表单
    async handleSubmit(formData) {
      try {
        console.log(formData, "formData");
        if (this.dialogStatus === "create" || !formData._id) {
          // 确保创建时有创建人信息
          if (!formData.createBy) {
            formData.createBy = this.$store.getters.name;
          }
          if (!formData.updateBy) {
            formData.updateBy = this.$store.getters.name;
          }
          await addData("production_plan_work_order", formData);
          this.$message.success("添加成功");
        } else {
          // 更新时添加修改人信息
          formData.updateBy = this.$store.getters.name;
          formData.updateAt = new Date();
          //删除投入量和产出量的修改
          delete formData.inputQuantity;
          delete formData.outputQuantity;

          await updateData("production_plan_work_order", {
            query: { _id: formData._id },
            update: formData,
          });
          
          // 清除该行的数据缓存，确保下次获取最新数据
          this.clearQuantityCache(formData._id);
          this.$message.success("更新成功");
        }
        this.fetchData();
      } catch (error) {
        console.error("操作失败:", error);
        this.$message.error("操作失败");
      }
    },

    // 新增按钮点击事件
    handleAdd() {
      this.dialogStatus = "create";
      this.dataForm = {};
      this.dialogFormVisible = true;
    },

    // 批量删除按钮点击事件
    handleBatchDelete() {
      if (!this.selection.length) {
        this.$message.warning("请选择要删除的记录");
        return;
      }

      this.$confirm(
        `确认删除选中的 ${this.selection.length} 条记录吗？`,
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(async () => {
          try {
            const ids = this.selection.map((item) => item._id);
            await removeData("production_plan_work_order", {
              query: { _id: { $in: ids } },
            });
            // 清除所有被删除行的缓存数据
            ids.forEach(id => this.clearQuantityCache(id));
            this.$message.success("批量删除成功");
            this.fetchData();
          } catch (error) {
            console.error("批量删除失败:", error);
            this.$message.error("批量删除失败");
          }
        })
        .catch(() => {});
    },

    // 查看报废条码详情
    async viewScrapBarcode(row) {
      this.scrapBarcodeDialogVisible = true;
      this.scrapDetailData = JSON.parse(JSON.stringify(row));
      this.scrapBarcodeLoading = true;
      try {
        // 确保有ID才发起请求
        if (!row._id) {
          console.error("工单ID不存在");
          this.$message.error("工单ID不存在，无法获取报废条码");
          this.scrapBarcodeLoading = false;
          return;
        }

        const result = await getData("production_plan_work_order", {
          query: { _id: row._id },
        });

        // 检查返回结果是否有效
        if (result && result.data && result.data.length > 0) {
          this.scrapDetailData = result.data[0];

          // 检查报废条码列表是否存在
          if (!this.scrapDetailData.scrapProductBarcodeList) {
            this.scrapDetailData.scrapProductBarcodeList = [];
            console.warn("报废条码列表为空");
          }
        } else {
          console.error("未获取到工单数据");
          this.$message.warning("未获取到报废条码数据");
        }
      } catch (error) {
        console.error("获取报废条码详情失败:", error);
        this.$message.error("获取报废条码详情失败");
      } finally {
        this.scrapBarcodeLoading = false;
      }
    },
  },
  created() {
    this.fetchData();
  },
  mounted() {
    checkComponentName(this);
  },
};
</script>

<style lang="scss" scoped>
.screen1 {
  height: auto;
  margin: 2vw 0;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 5px;
}

.screen_content_first {
  width: 100%;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

.el-icon-search {
  padding: 8px;
}

.el-icon-tickets {
  line-height: 30px;
}

.screen_content_second {
  width: 100%;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
}

.screen_content_second_one {
  padding: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.expert-detail-dialog {
  .expert-detail-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 10px;
  }

  .detail-card {
    margin: 10px;
    padding: 10px;
    border: 1px solid #ebeef5;
    border-radius: 5px;

    .card-header {
      font-weight: bold;
      font-size: 16px;
      color: #409eff;
      margin-bottom: 10px;
    }
  }
}

.modern-expert-dialog {
  .expert-detail-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    padding: 20px;
    background: #f5f7fa;
  }

  .detail-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }

    .card-header {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #ebeef5;
      background: linear-gradient(to right, #f0f2f5, #ffffff);

      i {
        margin-right: 8px;
        font-size: 18px;
        color: #409eff;
      }

      span {
        font-size: 16px;
        font-weight: 600;
        background: linear-gradient(120deg, #409eff, #36cfc9);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .stat-card {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: #409eff;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
    }
  }
}

.table-operations {
  margin: 15px 0;
  display: flex;
  gap: 10px;
}

.delete-btn {
  color: #f56c6c;

  &:hover {
    color: #f78989;
  }
}

.app-container {
  padding: 20px;

  .filter-container {
    margin-bottom: 20px;
  }
}

.scrap-barcode-container {
  padding: 10px;

  .scrap-barcode-info {
    margin-bottom: 20px;

    .info-item {
      display: flex;
      margin-bottom: 10px;

      .label {
        font-weight: bold;
        min-width: 80px;
        color: #606266;
      }

      .value {
        color: #333;
      }
    }
  }
}
</style>
