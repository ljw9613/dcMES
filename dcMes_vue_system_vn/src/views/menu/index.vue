<!--
 * @name: 职位字典列表
 * @content: 对所有的职位字典进行管理
 * @Author: joyce
 * @Date: 2020-03-10 16:22:05
-->
<template>
  <div class="app-container">
    <div class="filter-container">
      <el-button
        class="filter-item"
        icon="el-icon-plus"
        type="primary"
        @click="handleFilter"
      >添加菜单
      </el-button
      >
    </div>
    <el-table
      v-loading="listLoading"
      :data="list"
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
      <el-table-column align="left" fixed="left" label="菜单标题" width="200px">
        <template slot-scope="scope">
          <span>{{ scope.row.menuName }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="图标">
        <template slot-scope="scope">
          <i v-if="scope.row.icon" :class="scope.row.icon"></i>
          <span v-else :class="scope.row.icon">无</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="类型">
        <template slot-scope="scope">
          <span>{{ scope.row.type }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="菜单顺序">
        <template slot-scope="scope">
          <span>{{ scope.row.sortNum }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="节点路由">
        <template slot-scope="scope">
          <span>{{ scope.row.path }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="文件路径">
        <template slot-scope="scope">
          <span>{{ scope.row.component }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="传递参数">
        <template slot-scope="scope">
          <span>{{ scope.row.query }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="权限标签">
        <template slot-scope="scope">
          <span>{{ scope.row.perms }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="是否可见">
        <template slot-scope="scope">
          <span>{{ scope.row.visible ? "可见" : "隐藏" }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="状态">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status == true ? 'success' : 'danger'">{{
              scope.row.status ? "启用" : "禁用"
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        label="更新时间"
        prop="created_at"
        width="200"
      >
        <template slot-scope="scope">
          <i class="el-icon-time"/>
          <span>{{
              scope.row.updateAt | parseTime("{y}-{m}-{d} {h}:{i}")
            }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="100">
        <template slot-scope="{ row }">
          <el-button
            size="mini"
            style="color: blue"
            type="text"
            @click="handleEdit(row)"
          >编辑
          </el-button
          >
          <el-button
            size="mini"
            style="color: red"
            type="text"
            @click="handleDelete(row)"
          >删除
          </el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <!-- 弹窗start -->
    <menuDialog
      ref="menuDialogRef"
      :dialogFormVisible="dialogFormVisible"
      @custom-event="fetchData"
    ></menuDialog>
    <!-- 弹窗end -->
  </div>
</template>

<script>
import {getData, removeData} from "@/api/data";
import menuDialog from "./components/menuDialog"; // secondary package based on el-pagination
import variables from "@/styles/variables.scss";
import {formatMenu2Tree} from "@/utils/format2Tree";

export default {
  components: {menuDialog},
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
    };
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
      this.list = [];
      let {data: response} = await getData("menu", {
        query: {},
        sort: {
          sortNum: 1,
        },
      });
      this.list = formatMenu2Tree(response, null, []);
      console.log(this.list);
      this.listLoading = false;
    },

    //添加数据
    handleFilter() {
      this.$refs.menuDialogRef.AddClick();
    },
    createData() {
      const todata = {
        ...this.postlist,
      };
      console.log(todata);
      postmenu(todata).then((response) => {
        if (response) {
          console.log(response);
          this.fetchData();
          console.log(this.list);
          this.dialogFormVisible = false;
          this.postlist = {
            label: "",
            value: "",
            sort: 0,
            type: "菜单",
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
      this.$refs.menuDialogRef.EditClick(row);
    },
    editData() {
      let _id = this.postlist._id;
      delete this.postlist._id;
      var data = {
        query: {_id: _id},
        update: {
          ...this.postlist,
        },
      };
      console.log(data);
      putmenu(data).then((response) => {
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
      this.$confirm("确定删除" + row.menuName + "吗？")
        .then(async (_) => {
          var datas = {
            query: {_id: row._id},
          };
          let response = await removeData("menu", datas);

          console.log(response);
          this.fetchData();
          this.$notify({
            title: "删除成功",
            message: "已将" + row.menuName + "删除",
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
      postmenuimg(formData).then((response) => {
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
    //end
    //分页--初始页currentPage、初始每页数据数pagesize和数据data
    handleSizeChange: function (size) {
      this.pagesize = size; //每页下拉显示数据
    },
    handleCurrentChange: function (currentPage) {
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
