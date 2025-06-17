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
          <div class="screen_content_first_btutton">
            <el-button
              class="filter-item"
              type="primary"
              icon="el-icon-upload2"
              @click="handleImport"
              v-if="$checkPermission('用户列表导入用户')"
            >
              导入用户
            </el-button>
            <el-button
              class="filter-item"
              type="success"
              icon="el-icon-download"
              @click="handleExport"
              v-if="$checkPermission('用户列表导出用户')"
            >
              导出用户
            </el-button>
            <el-button
              class="filter-item"
              type="info"
              icon="el-icon-document"
              @click="downloadTemplate"
            >
              下载模板
            </el-button>
          </div>
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
            </el-button>
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

          <div class="screen_content_first_btutton">
            <el-button
              class="filter-item"
              icon="el-icon-plus"
              type="primary"
              @click="AddFilter"
              v-if="$checkPermission('用户列表添加管理员')"
              >添加管理人员
            </el-button>
            <el-button
              class="filter-item"
              icon="el-icon-printer"
              type="success"
              @click="showBatchQRCode"
              v-if="$checkPermission('用户列表批量打印二维码')"
            >
              批量打印二维码
            </el-button>
          </div>
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
      <el-table-column align="center" label="用户名称" min-width="120">
        <template slot-scope="scope">
          <span class="link-type">{{ scope.row.nickName }}</span>
        </template>
      </el-table-column>

      <el-table-column align="center" label="账号" min-width="120">
        <template slot-scope="scope">{{ scope.row.userName }}</template>
      </el-table-column>

      <el-table-column align="center" label="密码" min-width="120">
        <template>
          <span>******</span>
        </template>
      </el-table-column>

      <el-table-column align="center" label="用户角色" min-width="120">
        <template slot-scope="scope">
          {{ scope.row.role ? scope.row.role.name : "无" }}
        </template>
      </el-table-column>

      <el-table-column align="center" label="审核状态" min-width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status" type="success">在线</el-tag>
          <el-tag v-else type="warning">不在线</el-tag>
        </template>
      </el-table-column>

      <el-table-column
        align="center"
        label="创建时间"
        prop="created_at"
        min-width="160"
      >
        <template slot-scope="scope">
          <i class="el-icon-time" />
          <span>{{
            scope.row.createAt | parseTime("{y}-{m}-{d} {h}:{i}")
          }}</span>
        </template>
      </el-table-column>

      <el-table-column align="center" label="登录二维码" min-width="100">
        <template slot-scope="scope">
          <el-button
            type="primary"
            size="mini"
            @click="showQRCode(scope.row)"
            v-if="$checkPermission('用户列表查看二维码')"
          >
            查看二维码
          </el-button>
        </template>
      </el-table-column>

      <el-table-column align="center" label="操作" min-width="200">
        <template slot-scope="{ row }">
          <el-button
            size="mini"
            type="primary"
            @click="handleEdit(row)"
            style="margin-right: 8px"
            v-if="$checkPermission('用户列表编辑')"
          >
            编辑
          </el-button>
          <el-button
            size="mini"
            type="danger"
            @click="handleDelete(row)"
            style="margin-right: 8px"
            v-if="$checkPermission('用户列表删除')"
          >
            删除
          </el-button>
          <el-button
            v-if="!row.status && $checkPermission('用户列表上线')"
            size="mini"
            type="success"
            @click="handisshow(row)"
            style="margin-right: 8px"
          >
            上线
          </el-button>
          <el-button
            v-else-if="row.status && $checkPermission('用户列表下线')"
            size="mini"
            type="danger"
            @click="handisshow(row)"
          >
            下线
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 弹窗start -->
    <el-dialog
      :close-on-click-modal="false"
      :visible.sync="dialogFormVisible"
      title="管理人员信息"
    >
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
          <el-input v-model="number" placeholder="管理人员的账号" />
        </el-form-item>
        <el-form-item label="用户密码" label-width="120">
          <div class="password-input-container">
            <el-input 
              v-model="password" 
              type="password" 
              placeholder="请输入管理人员的密码"
              show-password
              :disabled="!$checkPermission('用户列表修改密码')"
            >
            </el-input>
            <div v-if="!$checkPermission('用户列表修改密码')" class="permission-tip">
              <el-tooltip content="您没有修改密码的权限" placement="top">
                <i class="el-icon-warning-outline"></i>
              </el-tooltip>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="联系姓名" label-width="120">
          <el-input v-model="name" placeholder="请输入管理人员的姓名" />
        </el-form-item>
        <el-form-item label="联系方式" label-width="120">
          <el-input v-model="phone" placeholder="请输入联系方式" />
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
        <el-form-item
          v-if="dialogStatus === 'create' && qrCodeUrl"
          label="登录码"
          label-width="120"
        >
          <div class="qrcode-container">
            <img :src="qrCodeUrl" alt="登录二维码" />
            <div class="qrcode-info">
              <p class="qrcode-tip">请保存此登录二维码，可用于快速登录</p>
            </div>
            <div class="qrcode-buttons">
              <el-button type="primary" size="small" @click="printQRCode">
                <i class="el-icon-printer"></i> 打印二维码
              </el-button>
              <el-button type="success" size="small" @click="downloadQRCode">
                <i class="el-icon-download"></i> 下载二维码
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="dialogStatus == 'create' ? createData() : editData()"
          >确定
        </el-button>
      </div>
    </el-dialog>
    <!-- 弹窗end -->

    <!-- 修改二维码展示弹窗 -->
    <el-dialog
      :visible.sync="qrCodeDialogVisible"
      title="登录二维码"
      width="400px"
    >
      <div class="qrcode-container">
        <img :src="currentQRCode" alt="登录二维码" />
        <div class="qrcode-info">
          <p>
            <span class="info-label">用户名：</span>{{ currentUser.nickName }}
          </p>
          <p>
            <span class="info-label">账号：</span>{{ currentUser.userName }}
          </p>
          <p class="qrcode-tip">扫描二维码可快速登录系统</p>
        </div>
        <div class="qrcode-buttons">
          <el-button type="primary" size="small" @click="printQRCode">
            <i class="el-icon-printer"></i> 打印二维码
          </el-button>
          <el-button type="success" size="small" @click="downloadQRCode">
            <i class="el-icon-download"></i> 下载二维码
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 批量二维码展示弹窗 -->
    <el-dialog
      :visible.sync="batchQRCodeVisible"
      title="批量二维码管理"
      width="800px"
    >
      <div class="batch-qrcode-container">
        <!-- 顶部操作栏 -->
        <div class="batch-actions">
          <el-checkbox v-model="selectAll" @change="handleSelectAll"
            >全选</el-checkbox
          >
          <div class="action-buttons">
            <el-button
              type="primary"
              size="small"
              @click="printSelectedQRCodes"
            >
              <i class="el-icon-printer"></i> 打印选中
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="downloadSelectedQRCodes"
            >
              <i class="el-icon-download"></i> 下载选中
            </el-button>
          </div>
        </div>

        <!-- 二维码列表 -->
        <div class="qrcode-list">
          <el-card
            v-for="item in qrCodeList"
            :key="item.id"
            class="qrcode-item"
          >
            <div class="qrcode-checkbox">
              <el-checkbox v-model="item.selected"></el-checkbox>
            </div>
            <img :src="item.qrCode" alt="登录二维码" />
            <div class="qrcode-info">
              <p><span class="info-label">用户名：</span>{{ item.nickName }}</p>
              <p><span class="info-label">账号：</span>{{ item.userName }}</p>
            </div>
          </el-card>
        </div>
      </div>
    </el-dialog>

    <!-- 添加导入对话框 -->
    <el-dialog
      title="导入用户"
      :visible.sync="importDialogVisible"
      width="400px"
    >
      <el-upload
        class="upload-demo"
        drag
        :action="'#'"
        :auto-upload="false"
        :on-change="handleUploadSuccess"
        :before-upload="beforeUpload"
        :show-file-list="false"
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip" slot="tip">
          只能上传 xlsx/xls 文件，且不超过 2MB
        </div>
      </el-upload>
    </el-dialog>

    <!-- 在表格底部添加分页 -->
    <div class="pagination-container">
      <el-pagination
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="listQuery.page"
        :page-sizes="[10, 20, 30, 50]"
        :page-size="listQuery.limit"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      >
      </el-pagination>
    </div>
  </div>
</template>

<script>
import { getData, addData, removeData } from "@/api/data";
import { postuserlist, putuserlist } from "@/api/user_list";
import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import JSZip from "jszip";
import { getToken } from "@/utils/auth";
import FileSaver from "file-saver";
import XLSX from "xlsx";

let that;
export default {
  name: "user",
  filters: {},
  data() {
    return {
      userName: "",
      roles: "",
      role: "",
      roledata: "",
      password: "dc123456",
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
      qrCodeUrl: "", // 用于存储二维码图片URL
      qrCodeDialogVisible: false,
      currentQRCode: "",
      currentUser: {},
      encryptionKey: "your-secure-encryption-key", // 加密密钥，建议存储在环境变量中
      qrCodeList: [],
      batchQRCodeVisible: false,
      selectAll: false,
      total: 0,
      listQuery: {
        page: 1,
        limit: 10,
      },
      importDialogVisible: false,
      uploadHeaders: {
        Authorization: getToken(),
      },
      originalPassword: "", // 存储编辑时的原始密码
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
      let { data: UserRole } = await getData("role", { query: {} });
      this.userlist = UserRole;
    },
    //获取数据
    async fetchData() {
      this.listLoading = true;
      var data1 = {
        query: { ...this.searchReq },
        populate: JSON.stringify([{ path: "role" }]),
        limit: this.listQuery.limit,
        sort: { createAt: -1 },
        skip: (this.listQuery.page - 1) * this.listQuery.limit,
        count: true,
      };

      try {
        let { data: response, countnum } = await getData("user_login", data1);
        this.categorylist = response;
        this.categorylist1 = this.categorylist;
        this.total = countnum;
      } catch (error) {
        console.error("获取数据失败:", error);
      } finally {
        this.listLoading = false;
      }
    },
    handleEdit(row) {
      this.dialogFormVisible = true;
      this._id = row._id;
      this.password = row.password;
      this.originalPassword = row.password; // 存储编辑时的原始密码
      this.role = row.role._id ? row.role._id : row.role;
      this.number = row.userName;
      this.name = row.nickName;
      this.phone = row.phone;
      this.dialogStatus = "edit";
      this.qrCodeUrl = ""; // 清空二维码
    },
    handleDelete(row) {
      console.log(row);
      this.$confirm("确定要删除吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        removeData("user_login", { query: { _id: row._id } }).then(
          (response) => {
            console.log(response);
            this.fetchData();
          }
        );
      });
    },
    handisshow(row) {
      var data = {
        query: { _id: row._id },
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
      this.role = "";
      this.password = "Enterprise123";
      this.name = "";
      this.phone = "";
      this.dialogFormVisible = true;
      this.dialogStatus = "create";
      this.qrCodeUrl = ""; // 清空二维码
    },
    // 生成加密ID
    generateEncryptedId() {
      const uuid = uuidv4();
      // 使用AES加密
      const encrypted = CryptoJS.AES.encrypt(
        uuid,
        "your-secret-key"
      ).toString();
      return encrypted;
    },
    // 新增加密方法
    encryptLoginData(userData) {
      const dataString = JSON.stringify({
        id: userData._id,
        userName: userData.userName,
        password: userData.password,
      });

      // 使用AES加密
      const encrypted = CryptoJS.AES.encrypt(
        dataString,
        this.encryptionKey
      ).toString();
      return encrypted;
    },
    // 修改createData方法
    async createData() {
      if (
        this.number != "" &&
        this.name != "" &&
        this.password != "" &&
        this.phone != "" &&
        this.role != ""
      ) {
        // 先检查数据库中是否已存在此用户名
        try {
          const checkExist = await getData("user_login", {
            query: { userName: this.number },
          });

          if (checkExist.data && checkExist.data.length > 0) {
            this.$notify({
              title: "添加失败",
              message: "此账号已存在，请使用其他账号",
              type: "warning",
              duration: 2000,
            });
            return;
          }

          // 创建用户数据对象
          const userData = {
            _id: Date.now().toString(), // 临时ID，实际应该由后端生成
            userName: this.number,
            password: this.password,
          };

          // 加密用户数据
          const encryptedData = this.encryptLoginData(userData);

          // 生成二维码
          try {
            this.qrCodeUrl = await QRCode.toDataURL(encryptedData);
          } catch (err) {
            console.error("QR Code generation failed:", err);
            return;
          }

          var data = {
            nickName: this.name,
            userName: this.number,
            password: this.password,
            phone: this.phone,
            role: this.role,
            qrCode: this.qrCodeUrl,
          };

          postuserlist(data).then((response) => {
            if (response.code == 200) {
              this.dialogFormVisible = false;
              this.fetchData();
              // 创建成功后立即显示二维码弹窗
              this.currentQRCode = this.qrCodeUrl;
              this.currentUser = {
                nickName: this.name,
                userName: this.number,
              };
              this.qrCodeDialogVisible = true;

              this.$notify({
                title: "添加成功",
                message: "请及时保存登录二维码",
                type: "success",
                duration: 3000,
              });
            } else {
              this.$notify({
                title: "添加失败",
                message: "添加失败",
                type: "warning",
                duration: 2000,
              });
            }
          });
        } catch (error) {
          console.error("检查用户名失败:", error);
          this.$notify({
            title: "添加失败",
            message: "检查用户名时出错",
            type: "error",
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

    // 修改editData方法
    async editData() {
      if (
        this.number != "" &&
        this.name != "" &&
        this.phone != "" &&
        this.password != "" &&
        this.role != ""
      ) {
        // 检查是否存在同名账号（除了当前编辑的用户）
        try {
          const checkExist = await getData("user_login", {
            query: {
              userName: this.number,
              _id: { $ne: this._id }, // 排除当前正在编辑的用户
            },
          });

          if (checkExist.data && checkExist.data.length > 0) {
            this.$notify({
              title: "修改失败",
              message: "此账号已被其他用户使用，请使用其他账号",
              type: "warning",
              duration: 2000,
            });
            return;
          }

          // 根据权限决定是否更新密码
          const updateData = {
            nickName: this.name,
            userName: this.number,
            phone: this.phone,
            role: this.role,
          };

          // 只有拥有修改密码权限的用户才能更新密码
          if (this.$checkPermission('用户列表修改密码')) {
            updateData.password = this.password;
          } else {
            // 没有权限时，使用原始密码
            updateData.password = this.originalPassword;
          }

          var data = {
            query: { _id: this._id },
            update: updateData,
          };

          putuserlist(data).then((response) => {
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
        } catch (error) {
          console.error("检查用户名失败:", error);
          this.$notify({
            title: "修改失败",
            message: "检查用户名时出错",
            type: "error",
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
        this.searchReq.userName = { $regex: this.userName };
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
    // 添加打印二维码方法
    printQRCode() {
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>打印二维码</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .print-container { text-align: center; }
              img { max-width: 200px; }
              p { margin: 10px 0; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="print-container">
              <img src="${this.qrCodeUrl}" alt="登录二维码">
              <p>用户名：${this.name}</p>
              <p>账号：${this.number}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    },

    // 添加下载二维码方法
    downloadQRCode() {
      const link = document.createElement("a");
      link.download = `登录码_${this.name}_${this.number}.png`;
      link.href = this.qrCodeUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    // 显示二维码
    async showQRCode(row) {
      // 重新生成加密数据
      const encryptedData = this.encryptLoginData({
        _id: row._id,
        userName: row.userName,
        password: row.password,
      });

      // 重新生成二维码
      try {
        this.currentQRCode = await QRCode.toDataURL(encryptedData);
        this.currentUser = {
          nickName: row.nickName,
          userName: row.userName,
        };
        this.qrCodeDialogVisible = true;
      } catch (err) {
        console.error("QR Code generation failed:", err);
        this.$notify({
          title: "错误",
          message: "二维码生成失败",
          type: "error",
        });
      }
    },

    // 打印二维码
    printQRCode() {
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>打印二维码</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .print-container { text-align: center; }
              img { max-width: 200px; }
              p { margin: 10px 0; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="print-container">
              <img src="${this.currentQRCode}" alt="登录二维码">
              <p>用户名：${this.currentUser.nickName}</p>
              <p>账号：${this.currentUser.userName}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    },

    // 下载二维码
    downloadQRCode() {
      const link = document.createElement("a");
      link.download = `登录码_${this.currentUser.nickName}_${this.currentUser.userName}.png`;
      link.href = this.currentQRCode;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    async showBatchQRCode() {
      try {
        // 为每个用户生成加密的二维码
        this.qrCodeList = await Promise.all(
          this.categorylist.map(async (item) => {
            // 生成加密数据
            const encryptedData = this.encryptLoginData({
              _id: item._id,
              userName: item.userName,
              password: item.password,
            });

            // 生成二维码
            const qrCode = await QRCode.toDataURL(encryptedData);

            return {
              id: item._id,
              nickName: item.nickName,
              userName: item.userName,
              qrCode: qrCode,
              selected: false,
            };
          })
        );

        this.batchQRCodeVisible = true;
      } catch (err) {
        console.error("批量生成二维码失败:", err);
        this.$notify({
          title: "错误",
          message: "批量生成二维码失败",
          type: "error",
        });
      }
    },

    // 修改打印选中二维码的方法
    async printSelectedQRCodes() {
      const selectedCodes = this.qrCodeList.filter((item) => item.selected);
      if (selectedCodes.length === 0) {
        this.$message.warning("请至少选择一个二维码");
        return;
      }

      // 为每个选中的二维码生成带信息的图片
      const imagePromises = selectedCodes.map((item) =>
        this.createQRCodeWithInfo(item.qrCode, item.nickName, item.userName)
      );

      const images = await Promise.all(imagePromises);

      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>批量打印二维码</title>
            <style>
              body {
                padding: 20px;
                font-family: Arial, sans-serif;
              }
              .qrcode-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
              }
              .qrcode-item {
                text-align: center;
                padding: 15px;
                border: 1px solid #eee;
                page-break-inside: avoid;
              }
              .qrcode-item img {
                width: 300px;
                height: 380px;
              }
              @media print {
                .qrcode-item {
                  border: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="qrcode-grid">
              ${images
                .map(
                  (imageUrl, index) => `
                <div class="qrcode-item">
                  <img src="${imageUrl}" alt="登录二维码">
                </div>
              `
                )
                .join("")}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    },

    // 修改下载选中二维码的方法
    async downloadSelectedQRCodes() {
      const selectedCodes = this.qrCodeList.filter((item) => item.selected);
      if (selectedCodes.length === 0) {
        this.$message.warning("请至少选择一个二维码");
        return;
      }

      // 如果只选择了一个二维码，直接下载
      if (selectedCodes.length === 1) {
        const item = selectedCodes[0];
        const imageUrl = await this.createQRCodeWithInfo(
          item.qrCode,
          item.nickName,
          item.userName
        );

        const link = document.createElement("a");
        link.download = `登录码_${item.nickName}_${item.userName}.png`;
        link.href = imageUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // 如果选择了多个二维码，创建ZIP文件
      const zip = new JSZip();
      const promises = selectedCodes.map(async (item) => {
        const imageUrl = await this.createQRCodeWithInfo(
          item.qrCode,
          item.nickName,
          item.userName
        );

        // 将 base64 图片转换为 blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        zip.file(`登录码_${item.nickName}_${item.userName}.png`, blob);
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });

      const link = document.createElement("a");
      link.download = "登录二维码.zip";
      link.href = URL.createObjectURL(content);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    handleSelectAll(val) {
      this.qrCodeList.forEach((item) => {
        item.selected = val;
      });
    },

    // 创建带有用户信息的二维码图片
    async createQRCodeWithInfo(qrCodeUrl, nickName, userName) {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        // 设置画布大小，预留底部空间显示文字
        canvas.width = 300;
        canvas.height = 380;

        // 设置背景色
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        img.onload = () => {
          // 在画布中央绘制二维码
          ctx.drawImage(img, 50, 30, 200, 200);

          // 设置文字样式
          ctx.fillStyle = "#333333";
          ctx.font = "14px Arial";
          ctx.textAlign = "center";

          // 绘制分割线
          ctx.beginPath();
          ctx.strokeStyle = "#EBEEF5";
          ctx.moveTo(30, 250);
          ctx.lineTo(270, 250);
          ctx.stroke();

          // 绘制用户信息
          ctx.fillText(`用户名：${nickName}`, canvas.width / 2, 280);
          ctx.fillText(`账号：${userName}`, canvas.width / 2, 310);

          // 转换为图片URL
          resolve(canvas.toDataURL("image/png"));
        };

        img.src = qrCodeUrl;
      });
    },

    // 修改单个二维码下载方法
    async downloadQRCode() {
      const imageUrl = await this.createQRCodeWithInfo(
        this.currentQRCode,
        this.currentUser.nickName,
        this.currentUser.userName
      );

      const link = document.createElement("a");
      link.download = `登录码_${this.currentUser.nickName}_${this.currentUser.userName}.png`;
      link.href = imageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    // 修改批量下载方法
    async downloadSelectedQRCodes() {
      const selectedCodes = this.qrCodeList.filter((item) => item.selected);
      if (selectedCodes.length === 0) {
        this.$message.warning("请至少选择一个二维码");
        return;
      }

      // 如果只选择了一个二维码，直接下载
      if (selectedCodes.length === 1) {
        const item = selectedCodes[0];
        const imageUrl = await this.createQRCodeWithInfo(
          item.qrCode,
          item.nickName,
          item.userName
        );

        const link = document.createElement("a");
        link.download = `登录码_${item.nickName}_${item.userName}.png`;
        link.href = imageUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // 如果选择了多个二维码，创建ZIP文件
      const zip = new JSZip();
      const promises = selectedCodes.map(async (item) => {
        const imageUrl = await this.createQRCodeWithInfo(
          item.qrCode,
          item.nickName,
          item.userName
        );

        // 将 base64 图片转换为 blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        zip.file(`登录码_${item.nickName}_${item.userName}.png`, blob);
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });

      const link = document.createElement("a");
      link.download = "登录二维码.zip";
      link.href = URL.createObjectURL(content);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    // 修改打印方法，使用新的带信息的二维码图片
    async printSelectedQRCodes() {
      const selectedCodes = this.qrCodeList.filter((item) => item.selected);
      if (selectedCodes.length === 0) {
        this.$message.warning("请至少选择一个二维码");
        return;
      }

      // 为每个选中的二维码生成带信息的图片
      const imagePromises = selectedCodes.map((item) =>
        this.createQRCodeWithInfo(item.qrCode, item.nickName, item.userName)
      );

      const images = await Promise.all(imagePromises);

      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>批量打印二维码</title>
            <style>
              body {
                padding: 20px;
                font-family: Arial, sans-serif;
              }
              .qrcode-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
              }
              .qrcode-item {
                text-align: center;
                padding: 15px;
                border: 1px solid #eee;
                page-break-inside: avoid;
              }
              .qrcode-item img {
                width: 300px;
                height: 380px;
              }
              @media print {
                .qrcode-item {
                  border: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="qrcode-grid">
              ${images
                .map(
                  (imageUrl, index) => `
                <div class="qrcode-item">
                  <img src="${imageUrl}" alt="登录二维码">
                </div>
              `
                )
                .join("")}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    },

    // 分页方法
    handleSizeChange(val) {
      this.listQuery.limit = val;
      this.fetchData();
    },

    handleCurrentChange(val) {
      this.listQuery.page = val;
      this.fetchData();
    },

    // 导入相关方法
    handleImport() {
      this.importDialogVisible = true;
    },

    beforeUpload(file) {
      const isExcel =
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel";
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isExcel) {
        this.$message.error("只能上传 Excel 文件!");
        return false;
      }
      if (!isLt2M) {
        this.$message.error("文件大小不能超过 2MB!");
        return false;
      }
      return true;
    },

    async handleUploadSuccess(file) {
      // 确保是文件对象
      if (!file || !file.raw) {
        this.$message.error("无效的文件");
        return;
      }

      try {
        // 使用 file.raw 获取原始文件对象
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet);

            let userDataList = [];
            // 处理每一行数据
            rows.map((row) => {
              const userData = {
                userName: row.userName,
                password: row.password || "dc123456", // 默认密码
                nickName: row.nickName,
                phone: row.phone,
                department: row.department,
                position: row.position,
                status: row.status === "true" || row.status === true,
              };
              userDataList.push(userData);
            });

            console.log(userDataList);
            // 使用 addData 批量添加用户
            await addData("user_login", userDataList);

            this.$message.success("导入成功");
            this.importDialogVisible = false;
            this.fetchData();
          } catch (error) {
            console.error("处理数据失败:", error);
            this.$message.error("导入失败：数据格式错误");
          }
        };

        reader.onerror = () => {
          this.$message.error("文件读取失败");
        };

        // 读取文件
        reader.readAsArrayBuffer(file.raw);
      } catch (error) {
        console.error("导入失败:", error);
        this.$message.error("导入失败");
      }
    },

    handleUploadError(err) {
      console.error("上传失败:", err);
      this.$message.error("文件上传失败");
    },

    // 修改模板下载方法
    downloadTemplate() {
      const template = [
        {
          userName: "示例账号",
          password: "默认密码",
          nickName: "张三",
          phone: "13800138000",
          department: "技术部",
          position: "工程师",
          status: "true",
        },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(template);

      // 添加列说明
      ws["!cols"] = [
        { wch: 15 }, // 账号
        { wch: 15 }, // 密码
        { wch: 15 }, // 用户名
        { wch: 15 }, // 手机号
        { wch: 15 }, // 部门
        { wch: 15 }, // 职位
        { wch: 20 }, // 状态(true/false)
      ];

      XLSX.utils.book_append_sheet(wb, ws, "用户导入模板");
      const wbout = XLSX.write(wb, {
        bookType: "xlsx",
        bookSST: true,
        type: "array",
      });

      FileSaver.saveAs(
        new Blob([wbout], { type: "application/octet-stream" }),
        "用户导入模板.xlsx"
      );
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

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;

  img {
    width: 200px;
    height: 200px;
    padding: 10px;
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  .qrcode-info {
    margin: 15px 0;
    width: 100%;
    text-align: center;

    p {
      margin: 8px 0;
      color: #606266;
      font-size: 14px;

      .info-label {
        color: #909399;
        margin-right: 5px;
      }
    }

    .qrcode-tip {
      margin-top: 12px;
      color: #909399;
      font-size: 12px;
    }
  }

  .qrcode-buttons {
    display: flex;
    gap: 10px;
    margin-top: 10px;

    .el-button {
      padding: 8px 15px;

      i {
        margin-right: 4px;
      }
    }
  }
}

// 打印样式
@media print {
  .qrcode-container {
    background: none;
    box-shadow: none;
    padding: 0;

    .qrcode-buttons {
      display: none;
    }

    img {
      box-shadow: none;
    }
  }
}

.el-table {
  margin: 15px 0;

  ::v-deep {
    .el-table__header-wrapper {
      th {
        background-color: #f5f7fa;
        padding: 12px 0;
      }
    }

    .el-table__body-wrapper {
      td {
        padding: 12px 0;
      }
    }

    .el-button + .el-button {
      margin-left: 8px;
    }
  }
}

// 调整按钮间距
.el-button + .el-button {
  margin-left: 8px;
}

// 调整表格内容垂直对齐
.el-table td {
  vertical-align: middle;
}

// 优化状态标签样式
.el-tag {
  min-width: 60px;
  text-align: center;
}

// 优化时间列样式
.el-icon-time {
  margin-right: 5px;
}

.batch-qrcode-container {
  .batch-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 10px;

    .action-buttons {
      display: flex;
      gap: 10px;
    }
  }

  .qrcode-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    max-height: 60vh;
    overflow-y: auto;
    padding: 10px;

    .qrcode-item {
      position: relative;
      text-align: center;

      .qrcode-checkbox {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 1;
      }

      img {
        width: 150px;
        height: 150px;
        margin: 10px auto;
      }

      .qrcode-info {
        margin-top: 10px;

        p {
          margin: 5px 0;
          font-size: 14px;
          color: #606266;

          .info-label {
            color: #909399;
          }
        }
      }
    }
  }
}

// 优化滚动条样式
.qrcode-list::-webkit-scrollbar {
  width: 6px;
}

.qrcode-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.qrcode-list::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.screen_content_first_btutton {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 0 8px;

  .filter-item {
    position: relative;
    padding: 8px 16px;
    font-weight: 500;
    transition: all 0.3s ease;

    i {
      margin-right: 6px;
      font-size: 14px;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
    }

    &[type="primary"] {
      background: linear-gradient(to right, #409eff, #3a8ee6);
      border: none;

      &:hover {
        background: linear-gradient(to right, #66b1ff, #409eff);
      }
    }

    &[type="success"] {
      background: linear-gradient(to right, #67c23a, #5daf34);
      border: none;

      &:hover {
        background: linear-gradient(to right, #85ce61, #67c23a);
      }
    }
  }

  @media screen and (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
    width: 100%;

    .filter-item {
      width: 100%;
    }
  }
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
  padding: 10px 20px;
}

.upload-demo {
  text-align: center;

  .el-upload {
    width: 100%;
  }

  .el-upload-dragger {
    width: 100%;
  }

  .el-upload__tip {
    margin-top: 10px;
    color: #909399;
  }
}

// 密码权限提示样式
.password-input-container {
  position: relative;
  width: 100%;

  .permission-tip {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;

    i {
      color: #f56c6c;
      font-size: 16px;
      cursor: pointer;

      &:hover {
        color: #f78989;
      }
    }
  }
}
</style>
