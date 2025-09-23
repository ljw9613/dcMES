<!--
 * @name: 职位字典列表
 * @content: 对所有的职位字典进行管理
 * @Author: joyce
 * @Date: 2020-03-10 16:22:05
-->
<template>
  <div class="app-container">
    <div class="filter-container">
      <!-- 搜索筛选 -->
      <el-input
        v-model="searchName"
        placeholder="角色标题"
        style="width: 200px"
        class="filter-item"
        clearable
        @clear="handleSearch"
      />
      <el-input
        v-model="searchLabel"
        placeholder="角色标识"
        style="width: 200px"
        class="filter-item"
        clearable
        @clear="handleSearch"
      />
      <el-button
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        @click="handleSearch"
        >搜索</el-button
      >
      <el-button
        class="filter-item"
        icon="el-icon-plus"
        type="primary"
        @click="handleFilter"
        v-if="$checkPermission('角色管理添加角色')"
        >添加角色
      </el-button>
    </div>
    <el-table
      v-loading="listLoading"
      :data="paginatedData"
      :header-cell-style="variables()"
      :tree-props="{ children: 'children' }"
      border
      element-loading-text="Loading"
      fit
      highlight-current-row
      row-key="_id"
      style="width: 100%"
    >
      <!-- <el-table-column align="center" label="ID">
        <template slot-scope="scope">{{ scope.$index }}</template>
      </el-table-column> -->
      <el-table-column align="left" fixed="left" label="角色标题" width="200px">
        <template slot-scope="scope">
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="角色标识">
        <template slot-scope="scope">
          <span>{{ scope.row.label }}</span>
        </template>
      </el-table-column>

      <el-table-column align="center" label="菜单权限">
        <template slot-scope="scope">
          <span class="link-type" @click="handleEdit(scope.row)">查看</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="创建时间" width="200">
        <template slot-scope="scope">
          <i class="el-icon-time" />
          <span>{{
            scope.row.createAt | parseTime("{y}-{m}-{d} {h}:{i}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        label="更新时间"
        prop="created_at"
        width="200"
      >
        <template slot-scope="scope">
          <i class="el-icon-time" />
          <span>{{
            scope.row.updateAt | parseTime("{y}-{m}-{d} {h}:{i}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="备注">
        <template slot-scope="scope">
          <span>{{ scope.row.remark }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="100">
        <template slot-scope="{ row }">
          <el-button
            size="mini"
            style="color: blue"
            type="text"
            @click="handleEdit(row)"
            v-if="$checkPermission('角色管理编辑')"
            >编辑
          </el-button>
          <el-button
            size="mini"
            style="color: red"
            type="text"
            @click="handleDelete(row)"
            v-if="$checkPermission('角色管理删除')"
            >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="block">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[5, 10, 20, 50]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      >
      </el-pagination>
    </div>

    <!-- 弹窗start -->
    <roleDialog
      ref="roleDialogRef"
      :dialogFormVisible="dialogFormVisible"
      @custom-event="fetchData"
    ></roleDialog>
    <!-- 弹窗end -->
  </div>
</template>

<script>
import { getData, removeData } from "@/api/data";
import roleDialog from "./components/roleDialog"; // secondary package based on el-pagination
import variables from "@/styles/variables.scss";
// import { formatrole2Tree } from '@/utils/format2Tree'
export default {
  name: "role",
  components: { roleDialog },
  data() {
    return {
      list: [],
      backupslist: null,
      listLoading: true,
      downloadLoading: false,
      inputVisible: false, //标签显示
      rows: "",
      dialogFormVisible: false, //显示弹窗
      dialogFormVisible1: false, //显示弹窗
      seachdataname: "",
      add: true,
      temp: [],
      postlist: {},
      // 分页相关
      currentPage: 1,
      pageSize: 10,
      total: 0,
      // 搜索相关
      searchName: "",
      searchLabel: "",
      filteredList: [],
    };
  },
  computed: {
    // 倒序排列并分页处理的数据
    paginatedData() {
      // 按更新时间字段降序排序
      const sortedList = [...this.filteredList].sort((a, b) => {
        // 如果updateAt存在则按它排序
        if (a.updateAt && b.updateAt) {
          return new Date(b.updateAt) - new Date(a.updateAt);
        }
        return 0; // 如果没有updateAt字段则保持原顺序
      });

      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      return sortedList.slice(startIndex, endIndex);
    },
  },
  created() {
    this.fetchData();
  },
  methods: {
    variables() {
      return {
        background: variables.tableBg,
        color: variables.tableText,
        "font-weight": variables.tableTextWeight,
      };
    },
    //获取数据
    async fetchData() {
      this.listLoading = true;
      let { data: response } = await getData("role", {
        query: {},
      });
      this.list = response;
      this.filteredList = [...this.list];
      this.total = this.filteredList.length;
      console.log(this.list);
      this.listLoading = false;
    },

    // 搜索处理
    handleSearch() {
      this.filteredList = this.list.filter((item) => {
        const nameMatch =
          !this.searchName ||
          (item.name &&
            item.name.toLowerCase().includes(this.searchName.toLowerCase()));
        const labelMatch =
          !this.searchLabel ||
          (item.label &&
            item.label.toLowerCase().includes(this.searchLabel.toLowerCase()));
        return nameMatch && labelMatch;
      });
      this.total = this.filteredList.length;
      this.currentPage = 1; // 重置到第一页
    },

    //添加数据
    handleFilter() {
      this.$refs.roleDialogRef.AddClick();
    },
    createData() {
      const todata = {
        ...this.postlist,
      };
      console.log(todata);
      postrole(todata).then((response) => {
        if (response) {
          console.log(response);
          this.fetchData();
          console.log(this.list);
          this.dialogFormVisible = false;
          this.postlist = {
            label: "",
            value: "",
            sort: 0,
            type: "角色",
          };
          this.$notify({
            title: "添加Success",
            message: "Add Successfully",
            type: "success",
            duration: 2000,
          });
        } else {
          this.$notify({
            title: "Add失败，请重试或刷新",
            message: "Add unsuccessful",
            type: "warning",
            duration: 2000,
          });
        }
      });
    },
    //编辑时标签修改
    handleClose(tag) {
      console.log(tag);
      this.temp.splice(tag, 1);
    },
    //编辑
    handleEdit(row) {
      this.$refs.roleDialogRef.EditClick(row);
    },
    editData() {
      let _id = this.postlist._id;
      delete this.postlist._id;
      var data = {
        query: { _id: _id },
        update: {
          ...this.postlist,
        },
      };
      console.log(data);
      putrole(data).then((response) => {
        console.log(response);
        if (response.code == 200) {
          this.dialogFormVisible = false;
          this.fetchData();
          this.$notify({
            title: "修改成功",
            message: "edit Successfully",
            type: "success",
            duration: 2000,
          });
        } else {
          this.$notify({
            title: "修改失败，请重新刷新",
            message: "edit failly",
            type: "warning",
            duration: 2000,
          });
        }
      });
    },
    showInput() {
      this.inputVisible = true;
      this.$nextTick((_) => {
        this.$refs.saveTagInput.$refs.input.focus();
      });
    },
    //封停
    handleDelete(row, status) {
      console.log(row);
      this.$confirm("确定删除" + row.name + "吗？")
        .then(async (_) => {
          var datas = {
            query: { _id: row._id },
          };
          let response = await removeData("role", { query: { _id: row._id } });

          console.log(response);
          this.fetchData();
          this.$notify({
            title: "删除成功",
            message: "已将" + row.name + "删除",
            type: "danger",
            duration: 2000,
          });
        })
        .catch((_) => {
          this.dialogVisible = false;
        });
    },
    //excel导出
    handleDownload() {
      this.downloadLoading = true;
      import("@/vendor/Export2Excel").then((excel) => {
        var keys = Object.getOwnPropertyNames(this.list[0]);
        const tHeader = keys;
        const filterVal = keys;
        const data = this.formatJson(filterVal);
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: "职位信息表",
        });
        this.downloadLoading = false;
      });
    },
    formatJson(filterVal) {
      return this.list.map((v) =>
        filterVal.map((j) => {
          if (j === "Add_time") {
            return parseTime(v[j]);
          } else {
            return v[j];
          }
        })
      );
    },
    // 选取图片后自动回调，里面可以获取到文件
    imgSaveToUrl(file, filelist, index) {
      // 也可以用file
      console.log(index);
      console.log(file.raw);
      this.localFile = file.raw; // 或者 this.localFile=file.raw

      let formData = new FormData();
      // 把文件信息添加进如对象
      formData.append("file", this.localFile);
      // 发送文件信息给后端
      console.log(formData);
      postroleimg(formData).then((response) => {
        if (response.code == 20000) {
          // 获取地址
          let fileName = response.filename;
          console.log(fileName);
          this.temp1[index].subImg = fileName;
        } else {
          that.$message.error(response.message);
        }
      });

      // 转换后的地址为 blob:http://xxx/7bf54338-74bb-47b9-9a7f-7a7093c716b5
    },
    //分页--初始页currentPage、初始每页数据数pagesize和数据data
    handleSizeChange(size) {
      this.pageSize = size; //每页下拉显示数据
    },
    handleCurrentChange(currentPage) {
      this.currentPage = currentPage; //点击第几页
    },
  },
};
</script>
<style scoped>
.filter-item {
  margin: 10px 5px;
}

.filter-container {
  margin: 10px 0;
}

.block {
  margin: 2vw;
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
}

.el-table--group::after,
.el-table--border::after,
.el-table--border::after,
.el-table--group::after {
  width: 0px !important;
}

.el-table.el-table::before {
  height: 0px !important;
}

.el-form-item {
  display: flex;
  flex-wrap: wrap;
}

.filter-item {
  margin: 0 0 !important;
}

.label1 {
  color: #409eff;
}

.label2 {
  color: #67c23a;
}

.label3 {
  color: #e6a23c;
}
</style>
