<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="search-container">
      <div class="search-area">
        <el-input
          v-model="searchBarcode"
          placeholder="请输入条码"
          clearable
          @keyup.enter.native="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch">
            搜索
          </el-button>
        </el-input>
      </div>

      <!-- 搜索结果表格 -->
      <div class="search-result" v-loading="searchLoading">
        <el-table
          v-if="searchResults.length"
          :data="searchResults"
          border
          style="width: 100%"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: 'bold',
            textAlign: 'center',
          }"
          :cell-style="{ textAlign: 'center' }"
        >
          <el-table-column
            label="条码"
            prop="barcode"
            min-width="150"
          ></el-table-column>
          <el-table-column label="物料信息" min-width="200">
            <template slot-scope="scope">
              <div>编码：{{ scope.row.materialCode }}</div>
              <div>名称：{{ scope.row.materialName }}</div>
              <div>规格：{{ scope.row.materialSpec }}</div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="getProcessStatusType(scope.row.status)">
                {{ getProcessStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="产品状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="getProductStatusType(scope.row.productStatus)">
                {{ getProductStatusText(scope.row.productStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="完成进度" width="200">
            <template slot-scope="scope">
              <el-progress :percentage="scope.row.progress || 0"></el-progress>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="120" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" @click="handleView(scope.row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-else-if="!searchLoading" class="no-result">
          <i class="el-icon-warning-outline"></i>
          <span>暂无搜索结果</span>
        </div>
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog
      :title="'工艺流程详情 - ' + dataForm.barcode"
      :visible.sync="dialogFormVisible"
      width="80%"
      class="process-flow-dialog"
      :close-on-click-modal="false"
    >
      <div class="process-flow-container">
        <div class="process-section">
          <el-card class="process-card">
            <div slot="header">
              <span><i class="el-icon-time"></i> 工艺流程</span>
            </div>

            <div class="process-flow">
              <!-- 主产品物料信息 -->
              <div class="main-material">
                <div class="main-material-header">
                  <i class="el-icon-box"></i>
                  <span class="title">主产品信息</span>
                  <el-tag type="primary" size="mini">{{
                    dataForm.materialCode
                  }}</el-tag>
                </div>
                <div class="main-material-content">
                  <div class="info-row">
                    <div class="info-item">
                      <label>产品条码：</label>
                      <span>{{ dataForm.barcode }}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-item">
                      <label>物料名称：</label>
                      <span>{{ dataForm.materialName }}</span>
                    </div>
                    <div class="info-item">
                      <label>规格型号：</label>
                      <span>{{ dataForm.materialSpec }}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-item">
                      <label>整体进度：</label>
                      <el-progress
                        :percentage="dataForm.progress || 0"
                      ></el-progress>
                    </div>
                    <div class="info-item">
                      <label>当前状态：</label>
                      <el-tag :type="getProcessStatusType(dataForm.status)">
                        {{ getProcessStatusText(dataForm.status) }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-item">
                      <label>产品状态：</label>
                      <el-tag :type="getProductStatusType(dataForm.productStatus)">
                        {{ getProductStatusText(dataForm.productStatus) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 详情标签页 -->
              <el-tabs v-model="activeTab" type="border-card">
                <!-- 工序信息 -->
                <el-tab-pane label="工序信息" name="process">
                  <process-step-list
                    ref="processStepList"
                    :loading="listLoading"
                    :flow-data="processedFlowChartData"
                  >
                  </process-step-list>
                </el-tab-pane>

                <!-- 物料信息 -->
                <el-tab-pane label="物料信息" name="material">
                  <material-info
                    :main-barcode="dataForm.barcode"
                    :flow-chart-data="processedFlowChartData"
                    :product-status="dataForm.productStatus"
                    @unbind-success="handleUnbindSuccess"
                    @replace-success="handleUnbindSuccess"
                  >
                  </material-info>
                </el-tab-pane>

                <!-- 物料条码信息 -->
                <el-tab-pane label="物料条码信息" name="materialBarcode">
                  <material-barcode-info
                    :main-barcode="dataForm.barcode"
                    :material-barcode-data="processedMaterialBarcodeData"
                  >
                  </material-barcode-info>
                </el-tab-pane>

                <!-- 检测信息 -->
                <el-tab-pane label="检测信息" name="inspection">
                  <inspection-list :inspections="dataForm"></inspection-list>
                </el-tab-pane>

                <!-- 解绑信息 -->
                <el-tab-pane label="解绑信息" name="unbind">
                  <unbind-record-list :unbind-records="unbindRecord">
                  </unbind-record-list>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-card>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData } from "@/api/data";
import ProcessStepList from "@/components/ProcessStepList/index.vue";
import MaterialInfo from "./components/MaterialInfo.vue";
import MaterialBarcodeInfo from "./components/MaterialBarcodeInfo.vue";
import InspectionList from "@/components/InspectionList/index.vue";
import UnbindRecordList from "./components/UnbindRecordList.vue";

export default {
  name: "ProductTraceability",
  components: {
    ProcessStepList,
    MaterialInfo,
    MaterialBarcodeInfo,
    InspectionList,
    UnbindRecordList,
  },
  data() {
    return {
      searchBarcode: "",
      searchResults: [],
      searchLoading: false,
      dialogFormVisible: false,
      activeTab: "process",
      listLoading: false,
      dataForm: {},
      processedFlowChartData: [],
      unbindRecord: [],
    };
  },
  computed: {
    processedMaterialBarcodeData() {
      if (!this.dataForm.processNodes) return [];

      // 创建工序映射
      const processMap = new Map();
      this.dataForm.processNodes.forEach((node) => {
        if (node.nodeType === "PROCESS_STEP") {
          processMap.set(node.nodeId, {
            processName: node.processName,
            processCode: node.processCode,
          });
        }
      });

      // 过滤并处理物料数据
      return this.dataForm.processNodes
        .filter((node) => node.nodeType === "MATERIAL" && node.barcode)
        .map((node) => {
          const processInfo = node.parentNodeId
            ? processMap.get(node.parentNodeId)
            : null;
          return {
            ...node,
            processName: processInfo ? processInfo.processName : "-",
            processCode: processInfo ? processInfo.processCode : "",
          };
        })
        .sort((a, b) => new Date(b.scanTime || 0) - new Date(a.scanTime || 0));
    },
  },
  methods: {
    // 处理搜索
    async handleSearch() {
      if (!this.searchBarcode.trim()) {
        this.$message.warning("请输入要搜索的条码");
        return;
      }

      this.searchLoading = true;

      //是否为升级条码
      const preProductionResponse = await getData("preProductionBarcode", {
        query: {
          transformedPrintBarcode: this.searchBarcode.trim(),
        },
        select: {
          transformedPrintBarcode: 1,
          printBarcode: 1,
        },
        limit: 1,
      });

      if (preProductionResponse.data && preProductionResponse.data.length > 0) {
        console.log("升级条码:", preProductionResponse.data[0]);
        this.searchBarcode = preProductionResponse.data[0].printBarcode;
      }
      
      try {
        const searchQuery = {
          query: {
            "processNodes.barcode": this.searchBarcode,
          },
        };

        const result = await getData("material_process_flow", searchQuery);
        if (result.code === 200 && result.data && result.data.length > 0) {
          this.searchResults = result.data.map((record) => ({
            barcode: record.barcode,
            materialCode: record.materialCode,
            materialName: record.materialName,
            materialSpec: record.materialSpec,
            status: record.status,
            progress: record.progress,
            productStatus: record.productStatus,
            ...record,
          }));
        } else {
          const currentQuery = {
            query: {
              $or: [
                { barcode: this.searchBarcode },
                { diyCode: this.searchBarcode },
              ],
            },
          };
          const currentResult = await getData(
            "material_process_flow",
            currentQuery
          );
          if (
            currentResult.code === 200 &&
            currentResult.data &&
            currentResult.data.length > 0
          ) {
            this.searchResults = currentResult.data.map((record) => ({
              barcode: record.barcode,
              materialCode: record.materialCode,
              materialName: record.materialName,
              materialSpec: record.materialSpec,
              status: record.status,
              progress: record.progress,
              productStatus: record.productStatus,
              ...record,
            }));
          } else {
            this.searchResults = [];
            this.$message.warning("未找到相关数据");
          }
        }
      } catch (error) {
        console.error("搜索失败:", error);
        this.$message.error("搜索失败: " + error.message);
      } finally {
        this.searchBarcode = "";
        this.searchLoading = false;
      }
    },

    // 查看详情
    async handleView(row) {
      try {
        this.listLoading = true;
        const result = await getData("material_process_flow", {
          query: { _id: row._id },
        });

        if (result.code === 200 && result.data.length > 0) {
          this.dataForm = result.data[0];
          this.processedFlowChartData = this.processNodes(
            this.dataForm.processNodes
          );
          this.dialogFormVisible = true;

          // 获取解绑记录
          const unbindRecord = await getData("unbindRecord", {
            query: { flowRecordId: row._id },
            populate: JSON.stringify([{ path: "operatorId" }]),
          });
          this.unbindRecord = unbindRecord.data;
        } else {
          this.$message.error("获取详情失败");
        }
      } catch (error) {
        console.error("获取详情失败:", error);
        this.$message.error("获取详情失败: " + error.message);
      } finally {
        this.listLoading = false;
      }
    },

    // 处理流程节点数据
    processNodes(nodes) {
      if (!nodes || !nodes.length) return [];

      const nodeMap = new Map();
      nodes.forEach((node) => {
        nodeMap.set(node.nodeId, {
          ...node,
          children: [],
        });
      });

      const result = [];
      nodes.forEach((node) => {
        const processedNode = nodeMap.get(node.nodeId);

        if (node.parentNodeId && nodeMap.has(node.parentNodeId)) {
          const parentNode = nodeMap.get(node.parentNodeId);
          parentNode.children.push(processedNode);
        } else {
          result.push(processedNode);
        }
      });

      const sortChildren = (node) => {
        if (node.children && node.children.length) {
          if (node.nodeType === "PROCESS_STEP") {
            node.children.sort((a, b) =>
              (a.materialCode || "").localeCompare(b.materialCode || "")
            );
          } else if (node.nodeType === "MATERIAL") {
            node.children.sort(
              (a, b) => (a.processSort || 0) - (b.processSort || 0)
            );
          }
          node.children.forEach((child) => sortChildren(child));
        }
      };

      result.forEach((node) => sortChildren(node));
      return result;
    },

    // 获取流程状态样式
    getProcessStatusType(status) {
      const statusMap = {
        PENDING: "info",
        IN_PROCESS: "warning",
        COMPLETED: "success",
        ABNORMAL: "danger",
      };
      return statusMap[status] || "info";
    },

    // 获取流程状态文本
    getProcessStatusText(status) {
      const statusMap = {
        PENDING: "待处理",
        IN_PROCESS: "进行中",
        COMPLETED: "已完成",
        ABNORMAL: "异常",
      };
      return statusMap[status] || status;
    },

    // 获取产品状态样式
    getProductStatusType(status) {
      const statusMap = {
        NORMAL: "success",
        REPAIRING: "warning",
        SCRAP: "danger",
      };
      return statusMap[status] || "info";
    },

    // 获取产品状态文本
    getProductStatusText(status) {
      const statusMap = {
        NORMAL: "正常",
        REPAIRING: "维修中",
        SCRAP: "报废",
      };
      return statusMap[status] || status || "正常";
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return "暂无数据";
      return new Date(date).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },

    // 处理解绑成功
    async handleUnbindSuccess() {
      // 重新加载数据
      if (this.dataForm._id) {
        await this.handleView({ _id: this.dataForm._id });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;

  .search-container {
    margin-bottom: 20px;

    .search-area {
      max-width: 500px;
      margin: 0 auto;
    }

    .no-result {
      text-align: center;
      padding: 20px;
      color: #909399;

      i {
        font-size: 24px;
        margin-right: 8px;
      }
    }
  }

  .process-flow-dialog {
    .main-material {
      border: 1px solid #ebeef5;
      border-radius: 4px;
      margin-bottom: 20px;

      .main-material-header {
        background-color: #f5f7fa;
        padding: 12px;
        border-bottom: 1px solid #ebeef5;
        display: flex;
        align-items: center;

        i {
          margin-right: 8px;
          color: #409eff;
        }

        .title {
          font-weight: bold;
          margin-right: 12px;
        }
      }

      .main-material-content {
        padding: 16px;

        .info-row {
          display: flex;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .info-item {
            flex: 1;
            display: flex;
            align-items: center;

            label {
              color: #606266;
              margin-right: 8px;
              min-width: 80px;
            }
          }
        }
      }
    }
  }
}
</style>