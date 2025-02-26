<!--
 * @name: 搜索数据列表
 * @content: 对所有的搜索数据进行管理
 * @Author: joyce
 * @Date: 2020-03-10 16:22:05
-->
<template>
  <div class="app-container">
    <div class="screen">
      <!-- 筛选 -->

      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-search">筛选搜索</i>
          <div class="screen_content_first_btutton"></div>
        </div>
        <div class="screen_content_second">
          <div class="screen_content_second_one">
            <div style="width: 200px">荣誉名称:</div>
            <el-input clearable v-model="honorName" placeholder="请输入荣誉名称"></el-input>
            <el-button style="margin-left: 10px" type="primary" @click="Search()">查询搜索
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <div class="screen1">
      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-tickets">荣誉列表</i>

          <el-button class="filter-item" icon="el-icon-plus" type="primary" @click="AddFilter">添加荣誉
          </el-button>
        </div>
      </div>
    </div>

    <div class="filter-container"></div>

    <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
      :tableData="tableList" :tableDataloading="listLoading" :total="total"
      @handleCurrentChange="baseTableHandleCurrentChange" @handleSizeChange="baseTableHandleSizeChange">
      <template slot="law">
        <el-table-column label="荣誉名称" align="center">
          <template slot-scope="scope">
            <span class="link-type">{{ scope.row.honorName }}</span>
          </template>
        </el-table-column>

        <el-table-column label="荣誉时间" align="center">
          <template slot-scope="scope">{{ parseTime(scope.row.awardDate, '{y}-{m}-{d} {h}:{i}') }}</template>
        </el-table-column>
        <el-table-column label="荣誉描述" align="center">
          <template slot-scope="scope">{{ scope.row.honorDescription }} </template>
        </el-table-column>
        <el-table-column label="荣誉图片" align="center">
          <template slot-scope="scope">
            <img :src="scope.row.image" alt="专利图片" style="width: 100px; height: 100px" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作">
          <template slot-scope="{ row }">
            <el-button size="mini" type="text" @click="handleEdit(row)">编辑查看
            </el-button>
            <el-button size="mini" type="danger" @click="handleDelete(row)">删除
            </el-button>
          </template>
        </el-table-column>
      </template>
    </base-table>

    <!-- 弹窗start -->
    <el-dialog :before-close="beforeClose" :visible.sync="dialogFormVisible" title="荣誉信息">
      <el-form ref="dataForm" :inline="true" label-position="left" label-width="70px"
        style="width: 500px; margin-left: 50px">
        <el-form-item required label="荣誉名称" label-width="120">
          <el-input v-model="dataForm.honorName" placeholder="荣誉名称" />
        </el-form-item>
        <el-form-item required label="荣誉时间" label-width="120">
          <el-date-picker v-model="dataForm.awardDate" type="datetime" placeholder="选择日期时间"></el-date-picker>
        </el-form-item>
        <el-form-item required label="荣誉描述" label-width="120">
          <el-input type="textarea" v-model="dataForm.honorDescription" placeholder="荣誉描述" />
        </el-form-item>
        <el-form-item required label="荣誉图片链接" label-width="120">
          <ZrFile :max="1" :value.sync="dataForm.image"></ZrFile>
        </el-form-item>
        <el-divider content-position="left">英文</el-divider>
        <el-form-item label="荣誉名称(title)" label-width="120">
          <el-input v-model="dataForm.honorName_en" placeholder="荣誉名称(title)" />
        </el-form-item>

        <el-form-item label="荣誉描述(description)" label-width="120">
          <el-input type="textarea" v-model="dataForm.honorDescription_en" placeholder="荣誉描述(description)" />
        </el-form-item>

      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus == 'create' ? createData() : editData()">确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import UploadList from "@/components/UploadList/index.vue";
import WangEditor from "@/components/WangEditor/index.vue";

let that;
export default {
  filters: {},
  components: {
    UploadList,
    WangEditor,
  },
  data() {
    return {
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      //
      options: {},
      searchReq: {},
      honorName: "",
      listLoading: true,

      dialogStatus: "",
      dialogFormVisible: false, //显示弹窗

      dataForm: {
        honorName: { type: String, required: true },//荣誉名称
        awardDate: Date,//荣誉时间
        honorName_en: String,//荣誉名称（英文）
        honorDescription_en: String,//荣誉描述（英文）
        honorDescription: String,//荣誉描述
        image: String//图片
      },

      textMap: {
        update: "Edit",
        create: "Create",
      },
    };
  },
  created() {
    this.fetchData();
  },
  beforeCreate() {
    that = this;
  },
  methods: {
    //当前页码改变
    baseTableHandleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.fetchData();
    },
    //每页显示条目个数改变
    baseTableHandleSizeChange(pageSize) {
      this.pageSize = pageSize;
      this.fetchData();
    }, //如果表格是在弹窗中，记得重置表格数据
    closeProcessRecordDialog() {
      this.tableList = [];
      this.total = 0;
      this.currentPage = 1;
      this.pageSize = 10;
      this.processRecordShow = false;
    },
    getslect(value) {
      console.log("value", value);
    },
    //获取数据
    async fetchData() {
      this.listLoading = true;
      let req = {
        query: {
          ...this.searchReq
        },
        limit: this.pageSize,
        skip: (this.currentPage - 1) * this.pageSize,
        count: true,
      };
      let result = await getData("companyHonors", req);
      console.log("🚀 ~ fetchData ~ result:", result);
      this.tableList = result.data;
      this.total = result.countnum;
      this.listLoading = false;
    },
    beforeClose() {
      this.$confirm("确认关闭？")
        .then((_) => {
          this.dialogFormVisible = false;
          this.QRDialog = false;
          this.approveDialog = false;
          done();
        })
        .catch((_) => { });
    },
    handleEdit(row) {
      this.dialogFormVisible = true;
      this.dataForm = JSON.parse(JSON.stringify(row));
      this.dialogStatus = "edit";
    },

    handleDelete(row) {
      this.$confirm(
        "删除荣誉",
        {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(async () => {
          var data = {
            query: { _id: row._id },
          };
          removeData("companyHonors", data).then(async (response) => {
            console.log(response);
            if (response.code == 200) {
              this.fetchData();
              this.$notify({
                title: "删除成功",
                message: "delete Successfully",
                type: "success",
                duration: 2000,
              });
            } else {
              this.$notify({
                title: "删除失败",
                message: "delete failly",
                type: "warning",
                duration: 2000,
              });
            }
          });
        })
    },


    AddFilter() {
      this.dataForm = {
        honorName: "", // 荣誉名称
        awardDate: "", // 荣誉时间
        honorDescription: "", // 荣誉描述
        honorName_en: "", // 荣誉名称（英文）
        honorDescription_en: "", // 荣誉描述（英文）
        image: ""//图片
      };
      this.dialogFormVisible = true;
      this.dialogStatus = "create";
    },
    async createData() {
      console.log(this.dataForm, "this.dataForm");
      if (
        this.dataForm.honorName != "" &&
        this.dataForm.awardDate != "" &&
        this.dataForm.honorDescription != "" &&
        this.dataForm.image != ""
      ) {
        let saveData = {
          ...this.dataForm,
        };
        let result = await addData("companyHonors", saveData);
        if (result.code == 200) {
          this.dialogFormVisible = false;
          this.fetchData();
          this.$notify({
            honorName: "添加成功",
            message: "edit Successfully",
            type: "success",
            duration: 2000,
          });
        } else {
          this.$notify({
            honorName: "添加失败",
            message: "edit failly",
            type: "warning",
            duration: 2000,
          });
        }
      } else {
        this.$notify({
          honorName: "请完善信息",
          message: "Again input",
          type: "warning",
          duration: 2000,
        });
      }
    },

    async editData() {
      if (
        this.dataForm.honorName != "" &&
        this.dataForm.awardDate != "" &&
        this.dataForm.honorDescription != "" &&
        this.dataForm.image != ""
      ) {
        var reqdata = {
          query: { _id: this.dataForm._id },
          update: {
            ...this.dataForm,
          },
        };
        console.log("data");
        console.log(reqdata);
        let result = await updateData("companyHonors", reqdata);
        if (result.code == 200) {
          this.dialogFormVisible = false;
          this.approveDialog = false;
          this.fetchData();
          this.$notify({
            honorName: "修改成功",
            message: "edit Successfully",
            type: "success",
            duration: 2000,
          });
        } else {
          this.$notify({
            honorName: "修改失败",
            message: "edit failly",
            type: "warning",
            duration: 2000,
          });
        }

      } else {
        this.$notify({
          honorName: "请完善信息",
          message: "Again input",
          type: "warning",
          duration: 2000,
        });
      }
    },
    //搜索按钮事件
    clearclick() {
      this.tableList = this.tableList1;
    },

    Search() {
      this.searchReq = {};
      if (this.honorName) {
        this.searchReq.honorName = { $regex: this.honorName };
      } else {
        delete this.searchReq.honorName;
      }
      this.fetchData();
    },
  },
};
</script>
<style lang="scss" scoped>
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

.titlehead1 {
  width: 100%;
  text-align: center;
  margin: 0px 20px 20px 20px;
}

.titlehead {
  width: 100%;
  text-align: center;
  margin: 20px;
}

.screen {
  height: auto;
  margin: 2vw 0 2vw 0;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 5px;
}

.screen1 {
  height: auto;
  margin: 2vw 0;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 5px;
}

.screen_content {
  height: auto;
  display: flex;
  flex-direction: column;
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

.forwork {
  justify-content: center;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  color: rgb(171, 177, 180);
}

.forworktitle {
  margin: 0 5px;
}
</style>
