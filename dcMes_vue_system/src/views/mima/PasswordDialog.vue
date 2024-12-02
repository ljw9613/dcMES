<template>
    <el-dialog title="修改密码" :visible.sync="dialogVisible" append-to-body width="40%">
      <el-form ref="passwordForm" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="原密码" prop="password">
          <el-input v-model="form.password" placeholder="请输入原密码" type="password"></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="form.newPassword" placeholder="请设置新密码" type="password"></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="newPassword2">
          <el-input v-model="form.newPassword2" placeholder="请确认新密码" type="password"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit('passwordForm')">确定修改</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </template>
  
  <script>
  import { getuserlist, putuserlist } from "@/api/user_list";
  
  export default {
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
        form: {
          password: '',
          newPassword: '',
          newPassword2: ''
        },
        rules: {
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
        }
      };
    },
    methods: {
      show() {
        this.dialogVisible = true;
      },
      handleCancel() {
        this.dialogVisible = false;
        this.$refs['passwordForm'].resetFields();
      },
      async onSubmit(formName) {
        this.$refs[formName].validate(async valid => {
          if (valid) {
            if (this.form.newPassword.length < 6) {
              this.$message.error("密码需6位数，请重新输入");
              return;
            }
  
            const storages = this.$store.state.user.id;
            const data1 = {
              query: { _id: storages },
            };
  
            const datas1 = await getuserlist(data1);
            if (datas1.data[0].password === this.form.password) {
              const data = {
                query: { _id: storages },
                update: {
                  $set: {
                    password: this.form.newPassword
                  }
                }
              };
  
              const datas = await putuserlist(data);
              if (datas.code === 200) {
                this.$message.success("密码修改成功！");
                this.dialogVisible = false;
                this.logout();
              } else {
                this.$message.error("修改失败，请重试!");
              }
            } else {
              this.$message.error('原密码错误，请重新输入！');
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
      }
    }
  };
  </script>