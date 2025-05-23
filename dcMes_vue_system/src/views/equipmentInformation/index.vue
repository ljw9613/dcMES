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
            <el-form-item label="设备名称">
              <el-input
                v-model="searchForm.machineName"
                placeholder="请输入设备名称"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="设备编号">
              <el-input
                v-model="searchForm.machineCode"
                placeholder="请输入设备编号"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="设备IP">
              <el-input
                v-model="searchForm.machineIp"
                placeholder="请输入设备IP"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="负责人">
              <el-input
                v-model="searchForm.principal"
                placeholder="请输入负责人"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="设备类型">
              <el-select
                v-model="searchForm.machineType"
                placeholder="请选择设备类型"
                clearable
                style="width: 100%"
                :popper-append-to-body="true"
              >
                <el-option
                  v-for="dict in dict.type.machine_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="厂区名称">
              <el-select
                v-model="searchForm.factoryName"
                placeholder="请选择厂区名称"
                clearable
                style="width: 100%"
                :popper-append-to-body="true"
              >
                <el-option
                  v-for="dict in dict.type.factoryName_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="产线名称">
              <zr-select
                v-model="searchForm.lineId"
                collection="production_line"
                :search-fields="['lineName', 'lineCode']"
                label-key="lineName"
                sub-key="lineCode"
                :multiple="false"
                placeholder="请输入产线名称搜索"
                clearable
                style="width: 100%"
              >
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="设备状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择设备状态"
                clearable
                style="width: 100%"
                :popper-append-to-body="true"
              >
                <el-option :label="'在线'" :value="true" />
                <el-option :label="'离线'" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- <el-row :gutter="20" v-show="showAdvanced">
                    <el-col :span="6">
                        <el-form-item label="设备类型">
                            <el-select v-model="searchForm.machineType" placeholder="请选择设备类型" clearable
                                style="width: 100%" :popper-append-to-body="true">
                                <el-option v-for="dict in dict.type.machine_type" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>

                </el-row> -->

        <el-form-item>
          <el-button
            type="primary"
            @click="search"
            >查询搜索</el-button>
          <el-button
            @click="resetForm"
           >重置</el-button>
          <el-button
            type="success"
            @click="exportData"
            >导出数据</el-button>
          <el-button
            type="primary"
            icon="el-icon-plus"
            @click="handleAdd"
            v-if="$checkPermission('设备信息新增设备')"
            >新增设备</el-button
          >
          <el-button
            type="danger"
            icon="el-icon-delete"
            :disabled="!selection.length"
            @click="handleBatchDelete"
            v-if="$checkPermission('设备信息批量删除')"
          >
            批量删除
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="screen1">
      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-tickets">设备信息列表</i>
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
        <el-table-column label="产线名称">
          <template slot-scope="scope">
            {{ scope.row.lineId && scope.row.lineId.lineName }}
          </template>
        </el-table-column>
        <el-table-column label="设备名称" prop="machineName" />
        <el-table-column label="设备类型">
          <template slot-scope="scope">
            <el-tag>{{ scope.row.machineType }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="当前工序" prop="processStepId">
          <template slot-scope="scope">
            <el-tooltip
              :content="
                scope.row.processStepId
                  ? scope.row.processStepId.processName +
                    '-' +
                    scope.row.processStepId.processCode
                  : '-'
              "
            >
              <el-tag type="warning">{{
                scope.row.processStepId
                  ? (
                      scope.row.processStepId.processName +
                      "-" +
                      scope.row.processStepId.processCode
                    ).substring(0, 10) + "..."
                  : "-"
              }}</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="关联类型">
          <template slot-scope="scope">
            <el-tooltip :content="getRelationshipTooltip(scope.row)">
              <el-tag :type="getRelationshipType(scope.row)">
                {{ getRelationshipLabel(scope.row) }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="当前工单" prop="productionPlanWorkOrderId">
          <template slot-scope="scope">
            <el-tooltip
              :content="
                scope.row.productionPlanWorkOrderId
                  ? scope.row.productionPlanWorkOrderId.workOrderNo +
                    '-' +
                    scope.row.productionPlanWorkOrderId.planQuantity
                  : '-'
              "
            >
              <el-tag type="warning">{{
                scope.row.productionPlanWorkOrderId
                  ? (
                      scope.row.productionPlanWorkOrderId.workOrderNo +
                      "-" +
                      scope.row.productionPlanWorkOrderId.planQuantity
                    ).substring(0, 10) + "..."
                  : "-"
              }}</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="设备名称" prop="machineName" />

        <el-table-column label="设备编号" prop="machineCode" />

        <el-table-column label="设备IP" prop="machineIp" width="150" />
        <el-table-column label="厂区名称" prop="factoryName" width="150" />

        <el-table-column label="设备在线状态">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status ? 'success' : 'danger'">{{
              scope.row.status ? "在线" : "离线"
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="负责人" prop="principal" width="150" />

        <el-table-column label="创建时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"

              @click="handleRefresh(scope.row)"
            >
              <i class="el-icon-refresh"></i> 刷新
            </el-button>
            <el-button
              type="text"
              size="small"
              v-if="$checkPermission('设备信息编辑')"
              @click="handleEdit(scope.row)"
            >
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
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import EditDialog from "./components/EditDialog";
import { refreshMachine } from "@/api/machine";

export default {
  name: "machine",
  dicts: ["machine_type", "factoryName_type"],
  components: {
    EditDialog,
  },
  data() {
    return {
      searchForm: {
        machineName: "",
        machineCode: "",
        machineIp: "",
        factoryName: "",
        principal: "",
        machineType: "",
        lineId: "",
        status: "",
        // 其他字段根据需要添加
      },
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: true,
      showAdvanced: false,
      dialogFormVisible: false,
      dialogStatus: "",
      selection: [],
      dataForm: {},
    };
  },
  methods: {
    searchData() {
      let req = {
        query: {
          $and: [],
        },
      };

      Object.keys(this.searchForm).forEach((key) => {
        if (key === "status") {
          if (this.searchForm[key]) {
            req.query.$and.push({
              status: this.searchForm[key],
            });
          }
        } else if (key === "lineId") {
          if (this.searchForm[key]) {
            req.query.$and.push({
              lineId: this.searchForm[key],
            });
          }
        } else {
          if (this.searchForm[key]) {
            req.query.$and.push({
              [key]: { $regex: this.searchForm[key], $options: "i" },
            });
          }
        }
      });

      if (!req.query.$and.length) {
        delete req.query.$and;
      }

      return req;
    },

    async fetchData() {
      this.listLoading = true;
      try {
        let query = {};
        if (this.searchForm.machineName) {
          query.machineName = {
            $regex: this.searchForm.machineName,
            $options: "i",
          };
        }
        if (this.searchForm.machineCode) {
          query.machineCode = {
            $regex: this.searchForm.machineCode,
            $options: "i",
          };
        }
        if (this.searchForm.machineIp) {
          query.machineIp = {
            $regex: this.searchForm.machineIp,
            $options: "i",
          };
        }
        if (this.searchForm.principal) {
          query.principal = {
            $regex: this.searchForm.principal,
            $options: "i",
          };
        }
        if (this.searchForm.machineType) {
          query.machineType = this.searchForm.machineType;
        }
        if (this.searchForm.factoryName) {
          query.factoryName = this.searchForm.factoryName;
        }
        if (this.searchForm.lineId) {
          query.lineId = this.searchForm.lineId;
        }
        if (
          this.searchForm.status !== undefined &&
          this.searchForm.status !== null &&
          this.searchForm.status !== ""
        ) {
          query.status = this.searchForm.status;
        }

        const params = {
          query: query,
          page: this.currentPage,
          skip: (this.currentPage - 1) * this.pageSize,
          limit: this.pageSize,
          sort: { createTime: -1 },
          populate: JSON.stringify([
            {
              path: "processStepId",
            },
            { path: "productionPlanWorkOrderId" },
            {
              path: "lineId",
            },
          ]),
          count: true,
        };

        const result = await getData("machine", params);
        this.tableList = result.data;
        this.total = result.countnum;
      } catch (error) {
        console.error("获取数据失败:", error);
        this.$message.error("获取数据失败");
      } finally {
        this.listLoading = false;
      }
    },

    formatDate(date) {
      if (!date) return "暂无数据";
      return new Date(date).toLocaleString();
    },

    resetForm() {
      this.searchForm = {
        machineName: "",
        machineCode: "",
        machineIp: "",
        factoryName: "",
        principal: "",
        machineType: "",
        lineId: "",
        status: "",
        // 其他字段根据需要添加
      };

      this.$nextTick(() => {
        this.$refs.searchForm.resetFields();
      });

      this.currentPage = 1;
      this.pageSize = 10;

      this.fetchData();
    },

    search() {
      this.currentPage = 1;
      this.fetchData();
    },

    handleAdd() {
      this.dialogStatus = "create";
      this.dataForm = {}; // 清空表单数据
      this.dialogFormVisible = true; // 显示对话框
    },
    handleRefresh(row) {
      console.log(row);
      refreshMachine({ machineIds: [row._id] }).then((res) => {
        console.log(res);
        this.$message.success("设备在线状态刷新成功");
      });
    },

    async handleEdit(row) {
      this.dialogStatus = "edit";
      let machine = await getData("machine", { query: { _id: row._id } });
      this.dataForm = JSON.parse(JSON.stringify(machine.data[0])); // 深拷贝避免直接修改数据
      this.dialogFormVisible = true;
    },

    handleDelete(row) {
      this.$confirm("确认删除该设备信息吗?", "提示", {
        type: "warning",
      })
        .then(async () => {
          try {
            await removeData("machine", { query: { _id: row._id } });
            this.$message.success("删除成功");
            this.fetchData();
          } catch (error) {
            console.error("删除失败:", error);
            this.$message.error("删除失败");
          }
        })
        .catch(() => {});
    },

    handleBatchDelete() {
      if (!this.selection.length) {
        this.$message.warning("请选择要删除的记录");
        return;
      }

      this.$confirm(
        `确认删除选中的 ${this.selection.length} 条记录吗？`,
        "提示",
        {
          type: "warning",
        }
      )
        .then(async () => {
          try {
            const ids = this.selection.map((item) => item._id);
            await removeData("machine", { query: { _id: { $in: ids } } });
            this.$message.success("批量删除成功");
            this.fetchData();
          } catch (error) {
            console.error("批量删除失败:", error);
            this.$message.error("批量删除失败");
          }
        })
        .catch(() => {});
    },

    async handleSubmit(formData) {
      try {
        if (this.dialogStatus === "create") {
          await addData("machine", formData);
          this.$message.success("添加成功");
        } else {
          await updateData("machine", {
            query: { _id: formData._id },
            update: formData,
          });
          this.$message.success("更新成功");
        }
        this.fetchData();
      } catch (error) {
        console.error("操作失败:", error);
        this.$message.error("操作失败");
      }
    },

    handleSelectionChange(selection) {
      this.selection = selection;
    },

    baseTableHandleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.fetchData();
    },

    baseTableHandleSizeChange(pageSize) {
      this.pageSize = pageSize;
      this.fetchData();
    },

    toggleAdvanced() {
      this.showAdvanced = !this.showAdvanced;
    },

    exportData() {
      // 获取当前表格数据
      const data = this.tableList;

      // 定义表头
      const headers = {
        machineName: "设备名称",
        principal: "负责人",
        machineCode: "设备编号",
        machineIp: "设备IP",
        factoryName: "厂区名称",
        productionLineName: "产线名称",
        equipmentType: "设备类型",
        collectionMethod: "采集方式",
        createTime: "创建时间",
      };

      // 处理导出数据
      const exportData = data.map((item) => {
        const row = {};
        for (const key in headers) {
          if (key === "createTime") {
            row[headers[key]] = this.formatDate(item[key]);
          } else {
            row[headers[key]] = item[key];
          }
        }
        return row;
      });

      // 导出Excel
      import("@/vendor/Export2Excel").then((excel) => {
        excel.export_json_to_excel({
          header: Object.values(headers),
          data: exportData.map((item) => Object.values(item)),
          filename: "设备信息列表",
          autoWidth: true,
          bookType: "xlsx",
        });
      });
    },

    // 获取设备与工序的关联类型
    getRelationshipType(row) {
      if (!row.processStepId) return "info";

      // 检查是否为主设备
      if (
        row.processStepId.machineId &&
        row.processStepId.machineId._id === row._id
      ) {
        return "success";
      }

      // 检查是否为关联设备
      if (
        row.processStepId.machineIds &&
        row.processStepId.machineIds.some((m) => m._id === row._id)
      ) {
        return "primary";
      }

      return "info";
    },

    // 获取设备与工序的关联标签
    getRelationshipLabel(row) {
      if (!row.processStepId) return "未关联";

      // 检查是否为主设备
      if (
        row.processStepId.machineId &&
        row.processStepId.machineId._id === row._id
      ) {
        return "主检验设备";
      }

      // 检查是否为关联设备
      if (
        row.processStepId.machineIds &&
        row.processStepId.machineIds.some((m) => m._id === row._id)
      ) {
        return "关联设备";
      }

      return "未关联";
    },

    // 获取设备与工序的关联提示
    getRelationshipTooltip(row) {
      if (!row.processStepId) return "该设备未关联任何工序";

      // 检查是否为主设备
      if (
        row.processStepId.machineId &&
        row.processStepId.machineId._id === row._id
      ) {
        return `主检验设备 - ${row.processStepId.processName}(${row.processStepId.processCode})`;
      }

      // 检查是否为关联设备
      if (
        row.processStepId.machineIds &&
        row.processStepId.machineIds.some((m) => m._id === row._id)
      ) {
        return `关联设备 - ${row.processStepId.processName}(${row.processStepId.processCode})`;
      }

      return "该设备未关联任何工序";
    },
  },
  created() {
    this.fetchData();
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

.table-expand {
  padding: 20px;
}
</style>
