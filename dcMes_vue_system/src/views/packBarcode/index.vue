<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-card class="filter-container">
      <div slot="header" class="clearfix">
        <span>筛选搜索</span>
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
            <el-form-item label="物料编码">
              <el-input
                v-model="searchForm.materialNumber"
                placeholder="请输入物料编码"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="装箱条码">
              <el-input
                v-model="searchForm.printBarcode"
                placeholder="请输入条码"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择状态"
                clearable
                style="width: 100%"
              >
                <el-option label="待使用" value="PENDING" />
                <el-option label="已使用" value="USED" />
                <el-option label="已作废" value="VOIDED" />
              </el-select>
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
          <el-button
            type="danger"
            icon="el-icon-delete"
            :disabled="!selection.length"
            @click="handleBatchVoid"
            v-if="$checkPermission('装箱条码批量作废')"
            >批量作废</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 条码列表 -->
    <el-card class="list-container">
      <el-table
        v-loading="listLoading"
        :data="barcodeList"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="序号" prop="serialNumber" width="80" />
        <el-table-column label="装箱条码" prop="printBarcode" />
        <el-table-column label="工单号" prop="workOrderNo" />
        <el-table-column label="物料编码" prop="materialNumber" />
        <el-table-column label="物料名称" prop="materialName" />
        <el-table-column label="产线编码" prop="lineNum">
          <template slot-scope="{ row }">
            {{ row.productionLineId && row.productionLineId.lineNum }}
          </template>
        </el-table-column>
        <el-table-column label="批次号" prop="serialNumber" width="160" />
        <el-table-column label="状态" width="100">
          <template slot-scope="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="作废信息" width="300">
          <template slot-scope="{ row }">
            <template v-if="row.status === 'VOIDED'">
              <div>作废人: {{ row.voidBy || "-" }}</div>
              <div>作废时间: {{ formatDate(row.voidAt) || "-" }}</div>
              <el-tooltip
                v-if="row.voidReason"
                :content="row.voidReason"
                placement="top"
              >
                <div class="ellipsis">作废原因: {{ row.voidReason }}</div>
              </el-tooltip>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createAt) }}
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="currentPage"
        :limit.sync="pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <!-- 作废对话框 -->
    <el-dialog title="条码作废" :visible.sync="voidDialogVisible" width="40%">
      <el-form
        :model="voidForm"
        ref="voidForm"
        :rules="voidRules"
        label-width="100px"
      >
        <el-form-item label="作废原因" prop="reason">
          <el-input
            type="textarea"
            v-model="voidForm.reason"
            :rows="3"
            placeholder="请输入作废原因"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="voidDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVoid">确定作废</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData, updateData } from "@/api/data";
import { formatDate } from "@/utils/date";
import Pagination from "@/components/Pagination";

export default {
  name: "PackBarcode",
  components: {
    Pagination,
  },
  data() {
    return {
      // 搜索表单
      searchForm: {
        printBarcode: "",
        workOrderNo: "",
        materialNumber: "",
        barcode: "",
        batchNo: "",
        status: "",
        lineNum: "",
      },

      // 列表数据
      barcodeList: [],
      listLoading: false,
      total: 0,
      currentPage: 1,
      pageSize: 20,
      selection: [],

      // 作废相关
      voidDialogVisible: false,
      voidForm: {
        reason: "",
        ids: [],
      },
      voidRules: {
        reason: [
          { required: true, message: "请输入作废原因", trigger: "blur" },
        ],
      },
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    // 获取数据列表
    async fetchData() {
      this.listLoading = true;
      try {
        const req = {
          query: this.buildQuery(),
          page: this.currentPage,
          skip: (this.currentPage - 1) * this.pageSize,
          populate: JSON.stringify([
            {
              path: "productionLineId",
              select: "lineNum",
            },
          ]),
          sort: { _id: -1 },
          limit: this.pageSize,
          count: true,
        };
        const result = await getData("packbarcode", req);
        this.barcodeList = result.data;
        this.total = result.countnum;
      } catch (error) {
        console.error("获取装箱条码列表失败:", error);
        this.$message.error("获取列表数据失败");
      }
      this.listLoading = false;
    },

    buildQuery() {
      const query = { $and: [] };

      if (this.searchForm.workOrderNo) {
        query.$and.push({
          workOrderNo: { $regex: this.searchForm.workOrderNo, $options: "i" },
        });
      }
      if (this.searchForm.materialNumber) {
        query.$and.push({
          materialNumber: {
            $regex: this.searchForm.materialNumber,
            $options: "i",
          },
        });
      }
      if (this.searchForm.barcode) {
        query.$and.push({
          barcode: { $regex: this.searchForm.barcode, $options: "i" },
        });
      }
      if (this.searchForm.batchNo) {
        query.$and.push({
          batchNo: { $regex: this.searchForm.batchNo, $options: "i" },
        });
      }
      if (this.searchForm.status) {
        query.$and.push({ status: this.searchForm.status });
      }
      if (this.searchForm.lineNum) {
        query.$and.push({
          lineNum: { $regex: this.searchForm.lineNum, $options: "i" },
        });
      }

      if (this.searchForm.printBarcode) {
        query.$and.push({
          printBarcode: { $regex: this.searchForm.printBarcode, $options: "i" },
        });
      }
      return query.$and.length ? query : {};
    },

    // 作废处理
    handleVoid(row) {
      this.voidForm.ids = [row._id];
      this.voidDialogVisible = true;
    },

    // 批量作废
    handleBatchVoid() {
      if (!this.selection.length) {
        return this.$message.warning("请选择要作废的条码");
      }
      this.voidForm.ids = this.selection.map((item) => item._id);
      this.voidDialogVisible = true;
    },

    // 提交作废
    async submitVoid() {
      try {
        await this.$refs.voidForm.validate();
        const { ids, reason } = this.voidForm;

        await updateData("packbarcode", {
          query: { _id: { $in: ids } },
          update: {
            status: "VOIDED",
            voidReason: reason,
            voidBy: this.$store.state.user.name,
            voidAt: new Date(),
          },
        });

        this.$message.success("作废成功");
        this.voidDialogVisible = false;
        this.fetchData();
      } catch (error) {
        console.error("作废失败:", error);
        this.$message.error("作废失败");
      }
    },

    // 工具方法
    handleSelectionChange(val) {
      this.selection = val;
    },

    getStatusType(status) {
      const types = {
        PENDING: "primary",
        USED: "success",
        VOIDED: "danger",
      };
      return types[status] || "info";
    },

    getStatusText(status) {
      const texts = {
        PENDING: "待使用",
        USED: "已使用",
        VOIDED: "已作废",
      };
      return texts[status] || status;
    },

    formatDate,

    search() {
      this.currentPage = 1;
      this.fetchData();
    },

    resetForm() {
      this.$refs.searchForm.resetFields();
      this.searchForm = {
        workOrderNo: "",
        materialNumber: "",
        barcode: "",
        batchNo: "",
        status: "",
        lineNum: "",
        printBarcode: "",
      };
      this.search();
    },
  },
};
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

.filter-container {
  margin-bottom: 20px;
}

.list-container {
  margin-top: 20px;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
