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
            <div style="width: 140px">用户名称:</div>
            <el-input
              v-model="userName"
              clearable
              placeholder="请输入用户名称"
              @clear="clearclick()"
            ></el-input>
            <el-button
              style="margin-left: 10px"
              type="primary"
              @click="Search()"
            >查询搜索
            </el-button
            >
          </div>
          <div
            v-if="$store.state.user.roles == '超级管理员'"
            class="screen_content_second_one"
          >
            <div style="width: 80px">用户角色:</div>
            <el-select
              v-model="roledata"
              filterable
              placeholder="请选择用户角色"
              style="width: "
              @change="searchrole"
              @clear="clearclick()"
            >
              <el-option
                v-for="item in userlist"
                :key="item"
                :label="item"
                :value="item"
              ></el-option>
            </el-select>
          </div>
        </div>
      </div>
    </div>
    <div class="screen1">
      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-tickets">管理员列表</i>

          <el-button
            class="filter-item"
            icon="el-icon-plus"
            type="primary"
            @click="AddFilter"
          >添加管理人员
          </el-button
          >
        </div>
      </div>
    </div>

    <div class="filter-container"></div>
    <el-table
      v-loading="listLoading"
      :data="categorylist"
      border
      element-loading-text="Loading"
      fit
      highlight-current-row
      style="width: 100%"
    >
      <el-table-column align="center" label="用户名称">
        <template slot-scope="scope">
          <span class="link-type">{{ scope.row.nickName }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="账号" width="160">
        <template slot-scope="scope">{{ scope.row.userName }}</template>
      </el-table-column>
      <el-table-column align="center" label="密码" width="120">
        <template slot-scope="scope">{{ scope.row.password }}</template>
      </el-table-column>
      <el-table-column align="center" label="用户角色" width="120">
        <template slot-scope="scope"
        >{{ scope.row.role ? scope.row.role.name : "无" }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="审核状态" width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status" type="success">在线</el-tag>
          <el-tag v-else type="warning">不在线</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        label="创建时间"
        prop="created_at"
        width="200"
      >
        <template slot-scope="scope">
          <i class="el-icon-time"/>
          <span>{{
              scope.row.createAt | parseTime("{y}-{m}-{d} {h}:{i}")
            }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作">
        <template slot-scope="{ row }">
          <el-button size="mini" type="primary" @click="handleEdit(row)"
          >编辑
          </el-button
          >

          <el-button
            v-if="!row.status"
            size="mini"
            type="success"
            @click="handisshow(row)"
          >上线
          </el-button
          >
          <el-button v-else size="mini" type="danger" @click="handisshow(row)"
          >下线
          </el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 弹窗start -->
    <el-dialog :visible.sync="dialogFormVisible" title="管理人员信息">
      <el-form
        ref="dataForm"
        label-position="left"
        label-width="70px"
        style="width: 500px; margin-left: 50px"
      >
        <!-- <el-form-item label="管理员" label-width="120">
          <el-select v-model="userId" filterable placeholder="请选择用户成为管理员">
            <el-option
              v-for="item in userlist"
              :key="item.userId"
              :label="item.userId"
              :value="item._id"
            ></el-option>
          </el-select>
        </el-form-item> -->
        <el-form-item label="用户账号" label-width="120">
          <el-input v-model="number" placeholder="管理人员的账号"/>
        </el-form-item>
        <el-form-item label="用户密码" label-width="120">
          <el-input v-model="password" placeholder="请输入管理人员的密码"/>
        </el-form-item>
        <el-form-item label="联系姓名" label-width="120">
          <el-input v-model="name" placeholder="请输入管理人员的姓名"/>
        </el-form-item>
        <el-form-item label="联系方式" label-width="120">
          <el-input v-model="phone" placeholder="请输入联系方式"/>
        </el-form-item>
        <!-- v-if="$store.state.user.roles == '超级管理员'" -->
        <el-form-item label="用户角色" label-width="120">
          <el-select v-model="role" filterable placeholder="请选择用户角色">
            <el-option
              v-for="(item, index) in userlist"
              :key="index"
              :label="item.name"
              :value="item._id"
            ></el-option>
          </el-select>
        </el-form-item>
        <!-- <el-form-item label="选择部门" label-width="120">
          <el-radio-group v-model="checkList">
            <el-radio
              v-for="(item, index) in labellist"
              :key="index"
              :label="item.title"
              >{{ item.title }}</el-radio
            >
          </el-radio-group>
        </el-form-item> -->
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="dialogStatus == 'create' ? createData() : editData()"
        >确定
        </el-button
        >
      </div>
    </el-dialog>
    <!-- 弹窗end -->
  </div>
</template>

<script>
import {getData} from "@/api/data";
import {postuserlist, putuserlist} from "@/api/user_list";

let that;
export default {
  filters: {},
  data() {
    return {
      userName: "",
      roles: "",
      role: "",
      roledata: "",
      password: "Enterprise123",
      userlist: [],
      categorylist: [],
      categorylist1: [],
      labellist: [],
      listLoading: true,
      downloadLoading: false,
      _id: "",
      categorytitle: "",
      labeltitle: "",
      address: "",
      addresstime: "",
      userId: "",
      number: "",
      name: "",
      phone: "",
      checkList: "",
      labelindex: "",
      labelcategoryindex: "",
      dialogStatus: "",
      dialogFormVisible: false, //显示弹窗
      dialogFormVisible1: false, //显示弹窗
      textMap: {
        update: "Edit",
        create: "Create",
      },
      searchReq: {},
    };
  },
  created() {
    this.getUserRole();
    this.fetchData();
  },
  beforeCreate() {
    that = this;
  },
  methods: {
    async getUserRole() {
      let {data: UserRole} = await getData("role", {query: {}});
      this.userlist = UserRole;
    },
    //获取数据
    async fetchData() {
      this.listLoading = true;
      var data1 = {
        query: {...this.searchReq},
        populate: JSON.stringify([{path: "role"}]),
      };
      let {data: response} = await getData("user_login", data1);
      console.log(response);
      this.categorylist = response;
      this.categorylist1 = this.categorylist;
      console.log(this.categorylist);
      this.listLoading = false;
      // var data2 = {
      //   query: {},
      // };
      // getdepartment(data2).then((response) => {
      //   console.log("response");
      //   console.log(response);
      //   this.labellist = response.data;
      // });
    },
    handleEdit(row) {
      this.dialogFormVisible = true;
      this._id = row._id;
      this.password = row.password;
      this.role = row.role._id ? row.role._id : row.role;
      this.number = row.userName;
      // this.checkList = row.department;
      this.name = row.nickName;
      this.phone = row.phone;
      this.dialogStatus = "edit";
    },
    handisshow(row) {
      var data = {
        query: {_id: row._id},
        update: {
          status: !row.status,
        },
      };
      console.log(data);
      putuserlist(data).then((response) => {
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
            title: "修改失败",
            message: "edit failly",
            type: "warning",
            duration: 2000,
          });
        }
      });
    },
    AddFilter() {
      this._id = "";
      this.userId = "";
      this.number = "";
      // this.checkList = "";
      this.role = "部门管理员";
      this.password = "Enterprise123";
      this.name = "";
      this.phone = "";
      this.dialogFormVisible = true;
      this.dialogStatus = "create";
    },
    createData() {
      if (
        this.number != "" &&
        this.name != "" &&
        this.password != "" &&
        this.phone != "" &&
        this.role != ""
        // this.checkList.length != ""
      ) {
        const index = this.categorylist.findIndex(
          (v) => v.usernumber === this.number
        );
        console.log(index);
        if (index == -1) {
          var data = {
            nickName: this.name,
            userName: this.number,
            password: this.password,
            phone: this.phone,
            role: this.role,
            // department: this.checkList,
          };
          console.log(data);
          postuserlist(data).then((response) => {
            console.log(response);
            if (response.code == 200) {
              this.dialogFormVisible = false;
              this.fetchData();
              this.$notify({
                title: "添加成功",
                message: "edit Successfully",
                type: "success",
                duration: 2000,
              });
            } else {
              this.$notify({
                title: "添加失败",
                message: "edit failly",
                type: "warning",
                duration: 2000,
              });
            }
          });
        } else {
          this.$notify({
            title: "此用户已是管理人员",
            message: "Again input",
            type: "warning",
            duration: 2000,
          });
        }
      } else {
        this.$notify({
          title: "请完善信息",
          message: "Again input",
          type: "warning",
          duration: 2000,
        });
      }
    },

    editData() {
      if (
        this.number != "" &&
        this.name != "" &&
        this.phone != "" &&
        this.password != "" &&
        this.role != ""
        // this.checkList != ""
      ) {
        var data = {
          query: {_id: this._id},
          update: {
            nickName: this.name,
            userName: this.number,
            password: this.password,
            phone: this.phone,
            role: this.role,
            // department: this.checkList,
          },
        };
        console.log("data");
        console.log(data);
        putuserlist(data).then((response) => {
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
              title: "修改失败",
              message: "edit failly",
              type: "warning",
              duration: 2000,
            });
          }
        });
      } else {
        this.$notify({
          title: "请完善信息",
          message: "Again input",
          type: "warning",
          duration: 2000,
        });
      }
    },
    //搜索按钮事件
    clearclick() {
      this.categorylist = this.categorylist1;
    },

    // Search() {
    //   if (this.userName) {
    //     var datas = this.searchByIndexOf(this.userName, this.categorylist1);
    //     this.categorylist = datas;
    //   } else {
    //     this.categorylist = this.categorylist1;
    //   }
    // },
    Search() {
      this.searchReq = {};

      if (this.userName) {
        this.searchReq.userName = {$regex: this.userName};
      } else {
        delete this.searchReq.userName;
      }

      console.log(this.searchReq);
      this.fetchData();
    },
    searchrole() {
      if (this.roledata) {
        var datas = this.searchByIndexOf1(this.roledata, this.categorylist1);
        this.categorylist = datas;
      } else {
        this.categorylist = this.categorylist1;
      }
    },
    //模糊查询1:利用字符串的indexOf方法
    searchByIndexOf(keyWord, list) {
      if (!(list instanceof Array)) {
        return;
      }
      var len = list.length;
      var arr = [];

      for (var i = 0; i < len; i++) {
        //如果字符串中不包含目标字符会返回-1
        if (list[i].username.indexOf(keyWord) >= 0) {
          arr.push(list[i]);
        }
      }
      return arr;
    },
    searchByIndexOf1(keyWord, list) {
      if (!(list instanceof Array)) {
        return;
      }
      var len = list.length;
      var arr = [];

      for (var i = 0; i < len; i++) {
        //如果字符串中不包含目标字符会返回-1
        if (list[i].role == keyWord) {
          arr.push(list[i]);
        }
      }
      return arr;
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
