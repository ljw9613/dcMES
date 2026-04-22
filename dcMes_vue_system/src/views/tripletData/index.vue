<!--
  追觅三元组管理
  菜单配置：在系统「菜单管理」中新增菜单项，component 填 /tripletData/index，标题如「追觅三元组管理」。
  按需为角色勾选该菜单；按钮级权限可在角色权限中配置后在此页用 $checkPermission 控制（当前未强制）。
-->
<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div slot="header" class="clearfix">
        <span>筛选搜索</span>
      </div>
      <el-form :model="searchForm" inline>
        <el-form-item label="DID">
          <el-input
            v-model="searchForm.did"
            placeholder="模糊匹配"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="MAC">
          <el-input
            v-model="searchForm.mac"
            placeholder="模糊匹配"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="SN">
          <el-input
            v-model="searchForm.sn"
            placeholder="模糊匹配"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option label="未绑定" value="unbound" />
            <el-option label="已绑定" value="bound" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch"
            >查询</el-button
          >
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" icon="el-icon-download" @click="downloadTemplate"
            >下载导入模板</el-button
          >
          <el-button type="primary" icon="el-icon-upload2" @click="importDialogVisible = true"
            >导入三元组</el-button
          >
          <el-button type="warning" plain icon="el-icon-connection" @click="apiTestDialogVisible = true"
            >对外接口测试</el-button
          >
          <el-button type="info" plain icon="el-icon-setting" @click="bindRuleDialogVisible = true"
            >条码规则启用配置</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-container">
      <div slot="header" class="clearfix">
        <span>三元组列表</span>
      </div>
      <el-table v-loading="listLoading" :data="tableList" border stripe>
        <el-table-column prop="did" label="DID" min-width="120" show-overflow-tooltip />
        <el-table-column prop="key" label="KEY" min-width="140" show-overflow-tooltip />
        <el-table-column prop="mac" label="MAC" width="160" />
        <el-table-column prop="timeArea" label="TimeArea" width="140" />
        <el-table-column prop="language" label="Language" width="100" />
        <el-table-column prop="sn" label="SN" min-width="140" show-overflow-tooltip />
        <el-table-column prop="workOrderNo" label="绑定工单号" min-width="150" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span v-if="row.workOrderNo">{{ row.workOrderNo }}</span>
            <span v-else style="color: #c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="{ row }">
            <el-tag :type="row.status === 'bound' ? 'success' : 'info'">{{
              row.status === "bound" ? "已绑定" : "未绑定"
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="绑定时间" width="168">
          <template slot-scope="{ row }">
            <span v-if="row.status === 'bound'">{{ formatTime(row.updatedAt) }}</span>
            <span v-else style="color: #c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="168">
          <template slot-scope="{ row }">
            {{ formatTime(row.createdAt) }}
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

    <triplet-external-api-test-dialog :visible.sync="apiTestDialogVisible" />
    <triplet-bind-rule-config-dialog :visible.sync="bindRuleDialogVisible" />

    <el-dialog
      title="导入三元组（DID、KEY、MAC、TimeArea、Language）"
      :visible.sync="importDialogVisible"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-upload
        ref="upload"
        drag
        action=""
        :auto-upload="false"
        :show-file-list="true"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="onImportFileChange"
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将 Excel 拖到此处，或<em>点击选择</em></div>
      </el-upload>
      <div slot="footer">
        <el-button @click="importDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="导入结果"
      :visible.sync="resultDialogVisible"
      width="640px"
    >
      <p>成功：{{ importResult.inserted }} 条</p>
      <el-table
        v-if="importResult.errors && importResult.errors.length"
        :data="importResult.errors"
        max-height="320"
        border
      >
        <el-table-column prop="line" label="行号" width="70" />
        <el-table-column prop="code" label="错误码" width="140" />
        <el-table-column prop="message" label="说明" />
      </el-table>
      <div slot="footer">
        <el-button type="primary" @click="resultDialogVisible = false">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Pagination from "@/components/Pagination";
import { getData } from "@/api/data";
import request from "@/utils/request";
import XLSX from "xlsx";
import { saveAs } from "file-saver";
import TripletExternalApiTestDialog from "./TripletExternalApiTestDialog.vue";
import TripletBindRuleConfigDialog from "./TripletBindRuleConfigDialog.vue";

export default {
  name: "TripletDataManage",
  components: {
    Pagination,
    TripletExternalApiTestDialog,
    TripletBindRuleConfigDialog,
  },
  data() {
    return {
      searchForm: {
        did: "",
        mac: "",
        sn: "",
        status: "",
      },
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: false,
      importDialogVisible: false,
      resultDialogVisible: false,
      importResult: { inserted: 0, errors: [] },
      apiTestDialogVisible: false,
      bindRuleDialogVisible: false,
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    formatTime(val) {
      if (!val) return "";
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return String(val);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    },
    buildQuery() {
      const $and = [];
      if (this.searchForm.did) {
        $and.push({
          did: { $regex: this.searchForm.did, $options: "i" },
        });
      }
      if (this.searchForm.mac) {
        $and.push({
          mac: { $regex: this.searchForm.mac, $options: "i" },
        });
      }
      if (this.searchForm.sn) {
        $and.push({
          sn: { $regex: this.searchForm.sn, $options: "i" },
        });
      }
      if (this.searchForm.status) {
        $and.push({ status: this.searchForm.status });
      }
      const q = {};
      if ($and.length) q.$and = $and;
      return q;
    },
    handleSearch() {
      this.currentPage = 1;
      this.fetchData();
    },
    resetSearch() {
      this.searchForm = { did: "", mac: "", sn: "", status: "" };
      this.currentPage = 1;
      this.fetchData();
    },
    async fetchData() {
      this.listLoading = true;
      try {
        const skip = (this.currentPage - 1) * this.pageSize;
        const params = {
          query: JSON.stringify(this.buildQuery()),
          skip: JSON.stringify(skip),
          limit: JSON.stringify(this.pageSize),
          sort: JSON.stringify({ updatedAt: -1 }),
          count: true,
        };
        const res = await getData("triplet_data", params);
        this.tableList = (res && res.data) || [];
        this.total = (res && res.countnum) || 0;
      } catch (e) {
        console.error(e);
        this.$message.error("加载列表失败");
      } finally {
        this.listLoading = false;
      }
    },
    downloadTemplate() {
      const sheet = XLSX.utils.json_to_sheet([
        {
          DID: "-119433340",
          KEY: "WDr49eqD8ojP7mBz",
          MAC: "10:06:48:A9:3E:EF",
          TimeArea: "Asia/Shanghai",
          Language: "ZH",
        },
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, "三元组");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([buf], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "triplet_import_template.xlsx"
      );
    },
    onImportFileChange(file) {
      if (!file || !file.raw) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet);
          const payload = rows.map((row) => ({
            did: row.DID != null ? row.DID : row.did,
            key: row.KEY != null ? row.KEY : row.key,
            mac: row.MAC != null ? row.MAC : row.mac,
            timeArea: row.TimeArea != null ? row.TimeArea : row.timeArea,
            language: row.Language != null ? row.Language : row.language,
          }));
          const body = await request({
            url: "/triplet_data/import",
            method: "post",
            data: { rows: payload },
          });
          this.importDialogVisible = false;
          this.importResult = {
            inserted: (body && body.inserted) || 0,
            errors: (body && body.errors) || [],
          };
          this.resultDialogVisible = true;
          if (body && body.inserted > 0) {
            this.$message.success(`成功导入 ${body.inserted} 条`);
            this.fetchData();
          } else if (body && body.errors && body.errors.length) {
            this.$message.warning("导入未写入，请查看错误明细");
          }
        } catch (err) {
          console.error(err);
          this.$message.error((err && err.message) || "导入失败");
        }
      };
      reader.readAsArrayBuffer(file.raw);
      if (this.$refs.upload) {
        this.$refs.upload.clearFiles();
      }
    },
  },
};
</script>

<style scoped>
.filter-container,
.list-container {
  margin-bottom: 16px;
}
</style>
