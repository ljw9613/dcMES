<template>
  <el-dialog title="个人信息修改" :visible.sync="dialogVisible" width="50%">
    <el-form ref="form" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="头像">
        <el-upload class="avatar-uploader" :action="uploadAvatarUrl" :headers="uploadHeaders" name="avatar"
          :data="uploadData" :show-file-list="false" :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload">
          <img v-if="form.avatar" :src="form.avatar" class="avatar">
          <i v-else class="el-icon-plus avatar-uploader-icon"></i>
        </el-upload>
      </el-form-item>

      <el-form-item label="用户名" prop="nickName">
        <el-input v-model="form.nickName" placeholder="请输入用户名"></el-input>
      </el-form-item>
      <!-- 
      <el-form-item label="原密码" prop="password">
        <el-input v-model="form.password" placeholder="请输入原密码" type="password"></el-input>
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" placeholder="请设置新密码" type="password"></el-input>
      </el-form-item>
      <el-form-item label="确认密码" prop="newPassword2">
        <el-input v-model="form.newPassword2" placeholder="请确认新密码" type="password"></el-input>
      </el-form-item> -->

      <el-form-item>
        <el-button type="warning" @click="showPasswordDialog">修改密码</el-button>
        <el-button type="primary" @click="onSubmit('form')">保存信息</el-button>
        <el-button @click="handleCancel">取消</el-button>
      </el-form-item>
    </el-form>
    <password-dialog ref="passwordDialog" />
  </el-dialog>
</template>

<script>
import { getuserlist, putuserlist } from "@/api/user_list";
import PasswordDialog from './PasswordDialog.vue'

export default {
  components: {
    PasswordDialog
  },
  data() {
    let validateNewPassword = (rule, value, callback) => {
      if (value === this.form.password) {
        callback(new Error("新密码不能与原密码相同!"));
      } else {
        callback();
      }
    };
    let validateNewPassword2 = (rule, value, callback) => {
      if (value !== this.form.newPassword) {
        callback(new Error("与新密码不一致!"));
      } else {
        callback();
      }
    };
    return {
      dialogVisible: false,
      // uploadAvatarUrl: 'http://127.0.0.1:2222/api/v1/upload/avatar',
      uploadAvatarUrl: process.env.VUE_APP_BASE_API + '/upload/avatar',
      form: {
        avatar: '',
        nickName: '',
        password: '',
        newPassword: '',
        newPassword2: ''
      },
      rules: {
        nickName: [
          { required: true, message: "请输入用户名", trigger: "blur" }
        ],
        password: [
          { required: true, message: "请输入原密码", trigger: "blur" }
        ],
        newPassword: [
          { required: true, message: "请设置新密码", trigger: "blur" },
          { validator: validateNewPassword, trigger: "blur" }
        ],
        newPassword2: [
          { required: true, message: "请确认新密码", trigger: "blur" },
          { validator: validateNewPassword2, trigger: "blur" }
        ]
      },
      uploadHeaders: {
        'Authorization': 'Bearer ' + this.$store.state.user.token
      },
      uploadData: {
        type: 'avatar'
      }
    };
  },
  methods: {
    // 显示弹窗
    show() {
      this.dialogVisible = true;
      this.getUserInfo();
    },
    // 获取用户信息
    async getUserInfo() {
      console.log('获取用户信息', this.$store.state.user);
      const storages = this.$store.state.user.id;
      const data = {
        query: { _id: storages }
      };
      const res = await getuserlist(data);
      console.log("🚀 ~ getUserInfo ~ res:", res)
      if (res.data && res.data[0]) {
        this.form.nickName = res.data[0].nickName;
        this.form.avatar = res.data[0].avatar;
      }
    },
    // 头像上传成功
    handleAvatarSuccess(res, file) {
      console.log('上传响应:', res);
      if (res.code === 200) {
        this.form.avatar = process.env.VUE_APP_UPLOADS + res.data.url;
        this.$message.success('头像上传成功');
      } else {
        this.$message.error(res.msg || '头像上传失败');
      }
    },
    // 头像上传前的验证
    beforeAvatarUpload(file) {
      console.log('准备上传文件:', file);
      const isValidFormat = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isValidFormat) {
        this.$message.error('上传头像图片只能是 JPG 或 PNG 格式!');
        return false;
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
        return false;
      }
      return true;
    },
    // 取消
    handleCancel() {
      this.dialogVisible = false;
      this.$refs['form'].resetFields();
    },
    showPasswordDialog() {
      this.$refs.passwordDialog.show();
    },

    // 修改个人信息提交方法
    async onSubmit(formName) {
      this.$refs[formName].validate(async valid => {
        if (valid) {
          const storages = this.$store.state.user.id;
          const data = {
            query: { _id: storages },
            update: {
              $set: {
                nickName: this.form.nickName,
                avatar: this.form.avatar
              }
            }
          };

          const datas = await putuserlist(data);
          if (datas.code === 200) {
            this.$message.success("修改成功！");
            this.dialogVisible = false;
            // 刷新页面
            this.$router.go(0);
          } else {
            this.$message.error("修改失败，请重试!");
          }
        } else {
          this.$message.error("请正确填写格式");
          return false;
        }
      });
    },
    async logout() {
      await this.$store.dispatch("user/logout");
      this.$router.push(`/login`);
    },
    // 添加显示密码修改弹窗的方法
    showPasswordDialog() {
      this.$refs.passwordDialog.show();
    }
  }
};
</script>

<style lang="scss" scoped>
.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;

  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }

  .avatar {
    width: 178px;
    height: 178px;
    display: block;
  }
}

.el-dialog {
  .el-form {
    margin: 0;
    width: 100%;
  }
}
</style>
