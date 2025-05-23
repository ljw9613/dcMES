<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div slot="header" class="clearfix">
        <span>筛选搜索</span>
      </div>

      <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="入库单号">
              <!-- <el-input v-model="searchForm.entryNo" placeholder="请输入入库单号" clearable></el-input> -->
              <zr-select
                v-model="searchForm.entryNo"
                collection="warehouse_entry"
                :search-fields="['entryNo']"
                label-key="entryNo"
                value-key="entryNo"
                :multiple="false"
                placeholder="请输入入库单号"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.entryNo }}</span>
                      <!-- <el-tag size="mini" type="info" class="option-tag">
                                                {{ item.entryNo }}
                                            </el-tag> -->
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="生产订单号">
              <!-- <el-input v-model="searchForm.productionOrderNo" placeholder="请输入生产订单号"
                                clearable></el-input> -->
              <zr-select
                v-model="searchForm.productionOrderNo"
                collection="warehouse_entry"
                :search-fields="['productionOrderNo']"
                label-key="productionOrderNo"
                value-key="productionOrderNo"
                :multiple="false"
                placeholder="请输入生产订单号"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{
                        item.productionOrderNo
                      }}</span>
                      <!-- <el-tag size="mini" type="info" class="option-tag">
                                                {{ item.entryNo }}
                                            </el-tag> -->
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="销售订单号">
              <!-- <el-input v-model="searchForm.saleOrderNo" placeholder="请输入销售订单号" clearable></el-input> -->
              <zr-select
                v-model="searchForm.saleOrderNo"
                collection="warehouse_entry"
                :search-fields="['saleOrderNo']"
                label-key="saleOrderNo"
                value-key="saleOrderNo"
                :multiple="false"
                placeholder="请输入销售订单号"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.saleOrderNo }}</span>
                      <!-- <el-tag size="mini" type="info" class="option-tag">
                                                {{ item.entryNo }}
                                            </el-tag> -->
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="托盘编号">
              <el-input
                v-model="searchForm.palletCode"
                placeholder="请输入托盘编号"
                clearable
                style="width: 100%"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="入库仓库">
              <el-input
                v-model="searchForm.workShop"
                placeholder="请输入入库仓库"
                clearable
                style="width: 100%"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="入库状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择状态"
                clearable
                style="width: 100%"
              >
                <el-option label="待入库" value="PENDING"></el-option>
                <el-option label="入库中" value="IN_PROGRESS"></el-option>
                <el-option label="已完成" value="COMPLETED"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="创建时间">
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
          <el-button
              type="primary"
              @click="search"
              >查询搜索</el-button>
          <el-button
              @click="resetForm"
              >重置</el-button>
          <!-- 扫码入库 -->
          <el-button
              type="primary"
              @click="handlePalletBarcodeOpen"
              :loading="scanDialogLoading"
              v-if="$checkPermission('生产入库单扫描单据入库')">扫描单据入库</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>

    <base-table
      ref="baseTable"
      :currentPage="currentPage"
      :highlight-current-row="true"
      :pageSize="pageSize"
      :tableData="tableList"
      :tableDataloading="listLoading"
      :total="total"
      @handleCurrentChange="baseTableHandleCurrentChange"
      @handleSizeChange="baseTableHandleSizeChange"
    >
      <template slot="law">
        <el-table-column type="expand">
          <template slot-scope="scope">
            <el-form label-position="left" inline class="table-expand">
              <!-- 托盘明细 -->
              <el-card class="box-card" style="width: 100%">
                <div slot="header" class="clearfix">
                  <span>托盘入库明细</span>
                </div>
                <el-table
                  :data="scope.row.entryItems"
                  border
                  style="width: 100%"
                >
                  <el-table-column
                    label="托盘编号"
                    prop="palletCode"
                    align="center"
                  ></el-table-column>
                  <el-table-column
                    label="入库数量"
                    prop="quantity"
                    align="center"
                  ></el-table-column>
                  <el-table-column label="扫描时间" align="center">
                    <template slot-scope="itemScope">
                      {{ formatDate(itemScope.row.scanTime) }}
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-form>
          </template>
        </el-table-column>

        <el-table-column label="入库单号" prop="entryNo" align="center">
          <template slot-scope="scope">
            <el-link type="primary" @click="handleView(scope.row)">{{
              scope.row.entryNo
            }}</el-link>
          </template>
        </el-table-column>

        <el-table-column label="订单信息" align="center">
          <template slot-scope="scope">
            <div>生产单号: {{ scope.row.productionOrderNo }}</div>
            <div>销售单号: {{ scope.row.saleOrderNo }}</div>
          </template>
        </el-table-column>

        <el-table-column label="物料信息" align="center">
          <template slot-scope="scope">
            {{ scope.row.materialName }}
            <el-tag size="mini" v-if="scope.row.materialSpec">{{
              scope.row.materialSpec
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="数量信息" align="center">
          <template slot-scope="scope">
            <div>应入库: {{ scope.row.plannedQuantity }}</div>
            <div>已入库: {{ scope.row.actualQuantity }}</div>
            <div>托盘数: {{ scope.row.palletCount }}</div>
          </template>
        </el-table-column>
        <el-table-column label="入库仓库" align="center">
          <template slot-scope="scope">
            <div>{{ scope.row.workShop }}</div>
          </template>
        </el-table-column>
        <el-table-column label="入库状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="时间信息" align="center">
          <template slot-scope="scope">
            <div>创建: {{ formatDate(scope.row.createAt) }}</div>
            <div v-if="scope.row.startTime">
              开始: {{ formatDate(scope.row.startTime) }}
            </div>
            <div v-if="scope.row.endTime">
              完成: {{ formatDate(scope.row.endTime) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="200">
          <template slot-scope="scope">
            <el-button
              type="text"
              style="color: red"
              @click="handleDelete(scope.row)"
              v-if="$checkPermission('生产入库单删除')"
              >删除</el-button
            >
            <el-button type="text"  @click="handleSync(scope.row)"
                       v-if="$checkPermission('生产入库单同步金蝶云')"
            >同步金蝶云</el-button>
          </template>
        </el-table-column>
      </template>
    </base-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新增入库单' : '查看入库单'"
      :visible.sync="dialogFormVisible"
    >
      <el-form
        ref="dataForm"
        :model="dataForm"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="生产订单号" prop="productionOrderNo">
          <el-input
            v-model="dataForm.productionOrderNo"
            placeholder="请输入生产订单号"
            :disabled="dialogStatus === 'view'"
            @blur="handleOrderNoBlur"
          ></el-input>
        </el-form-item>
        <el-form-item label="销售订单号">
          <el-input v-model="dataForm.saleOrderNo" disabled></el-input>
        </el-form-item>
        <el-form-item label="物料信息">
          <el-input v-model="dataForm.materialName" disabled>
            <template slot="append">{{ dataForm.materialSpec }}</template>
          </el-input>
        </el-form-item>
        <el-form-item label="计划入库数量">
          <el-input v-model="dataForm.plannedQuantity" disabled></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          v-if="dialogStatus === 'create'"
          >确 定</el-button
        >
      </div>
    </el-dialog>

    <!-- 使用通用扫描弹窗 -->
    <scan-dialog
      :visible.sync="scanDialogVisible"
      title="托盘扫码入库"
      placeholder="请扫描托盘条码"
      @scan="handleScan"
      @complete="handleScanComplete"
      @delete="handleScanDelete"
    />
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import { syncWarehouseEntry } from "@/api/warehouse/entry";
import ScanDialog from "./components/ScanDialog.vue";

export default {
  name: "warehouseEntry",
  components: {
    ScanDialog,
  },
  data() {
    return {
      searchForm: {
        entryNo: "",
        productionOrderNo: "",
        saleOrderNo: "",
        palletCode: "",
        status: "",
        dateRange: [],
      },
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: false,
      dialogFormVisible: false,
      dialogStatus: "",
      dataForm: {},
      rules: {
        productionOrderNo: [
          { required: true, message: "请输入生产订单号", trigger: "blur" },
        ],
      },
      scanDialogVisible: false,
      scanDialogLoading: false,
      scanForm: {
        palletCode: "",
      },
      scanRules: {
        palletCode: [
          { required: true, message: "请扫描托盘编号", trigger: "blur" },
        ],
      },
      exportLoading: false,
      exportProgress: 0,
      hasDeletePermission: false,
      hasAsyncStockPermission: false,
    };
  },
  methods: {
    handlePalletBarcodeOpen() {
      this.scanDialogVisible = true;
      this.scanDialogLoading = false;
    },
    // 构建查询条件
    searchData() {
      let req = {
        query: {
          $and: [],
        },
      };
      const escapeRegex = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      };
      if (this.searchForm.entryNo) {
        req.query.$and.push({
          entryNo: {
            $regex: escapeRegex(this.searchForm.entryNo),
            $options: "i",
          },
        });
      }

      if (this.searchForm.productionOrderNo) {
        req.query.$and.push({
          productionOrderNo: {
            $regex: escapeRegex(this.searchForm.productionOrderNo),
            $options: "i",
          },
        });
      }

      if (this.searchForm.saleOrderNo) {
        req.query.$and.push({
          saleOrderNo: {
            $regex: escapeRegex(this.searchForm.saleOrderNo),
            $options: "i",
          },
        });
      }

      if (this.searchForm.palletCode) {
        req.query.$and.push({
          "entryItems.palletCode": {
            $regex: escapeRegex(this.searchForm.palletCode),
            $options: "i",
          },
        });
      }

      if (this.searchForm.status) {
        req.query.$and.push({
          status: this.searchForm.status,
        });
      }

      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        const [startDate, endDate] = this.searchForm.dateRange;
        req.query.$and.push({
          createAt: {
            $gte: new Date(startDate).toISOString(),
            $lte: new Date(endDate + " 23:59:59.999").toISOString(),
          },
        });
      }

      if (this.searchForm.workShop) {
        req.query.$and.push({
          workShop: {
            $regex: escapeRegex(this.searchForm.workShop),
            $options: "i",
          },
        });
      }

      if (!req.query.$and.length) {
        delete req.query.$and;
      }

      return req;
    },

    // 获取数据
    async fetchData() {
      this.listLoading = true;
      try {
        let req = this.searchData();
        req.page = this.currentPage;
        req.skip = (this.currentPage - 1) * this.pageSize;
        req.limit = this.pageSize;
        req.sort = { createAt: -1 };
        req.count = true;
        const result = await getData("warehouse_entry", req);
        this.tableList = result.data;
        this.total = result.countnum;
      } catch (error) {
        console.error("获取数据失败:", error);
        this.$message.error("获取数据失败");
      } finally {
        this.listLoading = false;
      }
    },

    // 获取生产订单信息
    async handleOrderNoBlur() {
      if (this.dataForm.productionOrderNo) {
        try {
          const result = await getData("k3_PRD_MO", {
            query: { FBillNo: this.dataForm.productionOrderNo },
          });
          if (result.data && result.data.length > 0) {
            const orderData = result.data[0];
            this.dataForm = {
              ...this.dataForm,
              saleOrderNo: orderData.FSaleOrderNo,
              materialName: orderData.FMaterialName,
              materialSpec: orderData.FSpecification,
              plannedQuantity: orderData.FQty,
            };
          } else {
            this.$message.warning("未找到生产订单信息");
          }
        } catch (error) {
          this.$message.error("获取订单信息失败");
        }
      }
    },

    // 处理单个托盘扫描
    async handleScan(palletCode) {
      this.scanDialogLoading = true;
      try {
        await this.fetchData();
        return true;
      } catch (error) {
        this.$message.error(error.message || "扫描失败");
        return false;
      } finally {
        this.scanDialogLoading = false;
      }
    },

    // 处理扫描完成
    async handleScanComplete(palletCodes) {
      this.scanDialogLoading = true;
      try {
        await this.fetchData(); // 刷新列表
        this.$message.success(`成功入库 ${palletCodes.length} 个托盘`);
      } catch (error) {
        this.$message.error("完成入库失败");
      } finally {
        this.scanDialogLoading = false;
      }
    },

    // 处理扫描记录删除
    async handleScanDelete(palletCode) {
      try {
        await deletePallet(palletCode);
        this.$message.success("删除成功");
      } catch (error) {
        this.$message.error("删除失败");
      }
    },

    // 完成入库
    async handleComplete(row) {
      this.$confirm("确认完成入库？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(async () => {
        try {
          await updateData("warehouse_entry", {
            query: { entryNo: row.entryNo },
            update: { status: "COMPLETED", endTime: new Date() },
          });
          this.$message.success("入库完成");
          this.fetchData();
        } catch (error) {
          this.$message.error("操作失败");
        }
      });
    },

    handleSync(row) {
      let req = {
        entryId: row._id,
      };
      syncWarehouseEntry(req)
        .then((res) => {
          if (res.code == 200) {
            this.$message.success("同步成功");
          } else {
            this.$message.error(res.message);
          }
        })
        .catch((error) => {
          this.$message.error("同步失败");
        });
    },

    // 删除入库单
    async handleDelete(row) {
      this.$confirm(
        "确认删除该入库单？删除后将恢复相关托盘为待入库状态",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      ).then(async () => {
        try {
          // 1. 获取入库单详情，确保有托盘信息
          const entryDetail = await getData("warehouse_entry", {
            query: { _id: row._id },
          });

          if (entryDetail.data && entryDetail.data.length > 0) {
            const entryData = entryDetail.data[0];

            // 2. 检查并处理托盘项
            if (entryData.entryItems && entryData.entryItems.length > 0) {
              // 批量处理所有托盘状态
              const palletCodes = entryData.entryItems.map(
                (item) => item.palletCode
              );

              // 3. 更新托盘状态为"待入库"
              await updateData("material_palletizing", {
                query: { palletCode: { $in: palletCodes } },
                update: { inWarehouseStatus: "PENDING" },
                multi: true,
              });

              this.$message.success(
                `已将 ${palletCodes.length} 个托盘恢复为待入库状态`
              );
            }
          }

          // 4. 删除入库单
          await removeData("warehouse_entry", {
            query: { _id: row._id },
          });

          this.$message.success("删除成功");
          this.fetchData();
        } catch (error) {
          console.error("删除失败:", error);
          this.$message.error("删除失败");
        }
      });
    },

    // 删除托盘
    async handleDeletePallet(entryNo, palletCode) {
      this.$confirm("确认删除该托盘记录？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(async () => {
        try {
          await removeData("warehouse_entry/pallet", {
            query: {
              entryNo: entryNo,
              palletCode: palletCode,
            },
          });
          this.$message.success("删除成功");
          this.fetchData();
        } catch (error) {
          this.$message.error("删除失败");
        }
      });
    },

    // 其他通用方法保持不变
    getStatusType(status) {
      const types = {
        PENDING: "info",
        IN_PROGRESS: "warning",
        COMPLETED: "success",
      };
      return types[status] || "info";
    },
    getStatusText(status) {
      const texts = {
        PENDING: "待入库",
        IN_PROGRESS: "入库中",
        COMPLETED: "已完成",
      };
      return texts[status] || status;
    },
    formatDate(date) {
      if (!date) return "暂无数据";
      return new Date(date).toLocaleString();
    },
    search() {
      this.currentPage = 1;
      this.fetchData();
    },
    resetForm() {
      this.$refs.searchForm.resetFields();
      // 手动重置所有搜索表单字段
      this.searchForm = {
        entryNo: "",
        productionOrderNo: "",
        saleOrderNo: "",
        palletCode: "",
        status: "",
        dateRange: [],
      };
      this.search();
    },
    handleAdd() {
      this.dialogStatus = "create";
      this.dataForm = {};
      this.dialogFormVisible = true;
    },
    baseTableHandleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.fetchData();
    },
    baseTableHandleSizeChange(pageSize) {
      this.pageSize = pageSize;
      this.fetchData();
    },
  },
  created() {
    this.fetchData();
    const roles = this.$store.getters.roles;
    if (!roles || !roles.buttonList) {
      return false;
    }

    if (roles.buttonList.includes("Delete_inbound_and_outbound_documents")) {
      this.hasDeletePermission = true;
    }

    if (roles.buttonList.includes("Async_stock_permission")) {
      this.hasAsyncStockPermission = true;
    }

  },
};
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;

  .filter-container {
    margin-bottom: 20px;
  }

  .table-expand {
    padding: 20px;

    .box-card {
      margin-bottom: 15px;
    }
  }

  .select-option {
    display: flex;
    flex-direction: column;

    .option-main {
      display: flex;
      align-items: center;

      .option-label {
        margin-right: 10px;
      }
    }

    .option-info {
      margin-top: 5px;
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
