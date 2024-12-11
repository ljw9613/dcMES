<template>
  <div class="login-container">
    <div class="login-logo-bysj"></div>
    <el-row>
      <el-col :lg="8" :md="24" :sm="24" :xl="8" :xs="24">
        <el-form ref="loginForm" :model="loginForm" :rules="loginRules" auto-complete="off" class="login-form"
          label-position="left">
          <div class="title">
            hello !
          </div>
          <div class="title-tips">欢迎来到{{ title }}！</div>
          <el-tabs v-model="loginType">
            <el-tab-pane label="账号密码登录" name="account">
              <el-form-item class="login-form-admin" prop="userName" style="margin-top: 49px;">
                <span class="svg-container svg-container-admin">
                  <byui-icon :icon="['fas', 'user']" />
                </span>
                <el-input v-focus v-model="loginForm.userName" auto-complete="off" placeholder="请输入用户名" tabindex="1"
                  type="text" @input="val => loginForm.userName = val ? val.trim() : ''" />
              </el-form-item>
              <el-form-item class="login-form-pass" prop="password">
                <span class="svg-container svg-container-pass">
                  <byui-icon :icon="['fas', 'lock']" />
                </span>
                <el-input :key="passwordType" ref="password" v-model="loginForm.password" :type="passwordType"
                  auto-complete="on" placeholder="请输入密码" tabindex="2"
                  @input="val => loginForm.password = val ? val.trim() : ''" @keyup.enter.native="handleLogin" />
                <span v-if="passwordType === 'password'" class="show-pwd" @click="showPwd"><byui-icon
                    :icon="['fas', 'eye-slash']" /></span>
                <span v-else class="show-pwd" @click="showPwd"><byui-icon :icon="['fas', 'eye']" /></span>
              </el-form-item>
              <el-button :loading="accountLoading" class="login-btn" type="primary"
                @click.native.prevent="handleAccountLogin">
                账号登录
              </el-button>
            </el-tab-pane>
            <el-tab-pane label="扫码登录" name="qrcode">
              <el-form-item prop="encryptedId">
                <span class="svg-container">
                  <byui-icon :icon="['fas', 'qrcode']" />
                </span>
                <el-input v-model="loginForm.encryptedId" placeholder="请使用扫描枪扫描二维码" ref="scanInput"
                  :disabled="inputLoading" @input="handleScanInput" @change="handleScanChange">
                  <template slot="append">
                    <i v-if="inputLoading" class="el-icon-loading"></i>
                  </template>
                </el-input>
              </el-form-item>
            </el-tab-pane>
          </el-tabs>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { isPassword } from "@/utils/validate";
import CryptoJS from 'crypto-js';

export default {
  name: "Login",
  directives: {
    focus: {
      inserted(el) {
        el.querySelector("input").focus();
      },
    },
  },
  watch: {
    $route: {
      handler: function (route) {
        const query = route.query
        if (query) {
          this.redirect = query.redirect
          this.otherQuery = this.getOtherQuery(query)
        }
      },
      immediate: true
    },
    loginType(newVal) {
      if (newVal === 'qrcode') {
        this.$nextTick(() => {
          this.focusScanInput();
        });
      }
    },
    // // 添加对 encryptedId 的监听
    // 'loginForm.encryptedId': {
    //   handler(newVal) {
    //     if (newVal && this.loginType === 'qrcode') {
    //       this.handleQrcodeLogin();
    //     }
    //   }
    // }
  },
  data() {
    const validateUserName = (rule, value, callback) => {
      if ("" == value) {
        callback(new Error("用户名不能为空"));
      } else {
        callback();
      }
    };
    const validatePassword = (rule, value, callback) => {
      if (!isPassword(value)) {
        callback(new Error("密码不能少于6位"));
      } else {
        callback();
      }
    };
    return {
      title: "德昌MES系统",
      loginForm: {
        userName: "",
        password: "",
        encryptedId: ""
      },
      loginRules: {
        userName: [
          {
            required: true,
            trigger: "blur",
            validator: validateUserName,
          },
        ],
        password: [
          {
            required: true,
            trigger: "blur",
            validator: validatePassword,
          },
        ],
      },
      accountLoading: false,
      qrcodeLoading: false,
      passwordType: "password",
      redirect: undefined,
      loginType: 'account',
      encryptionKey: 'your-secure-encryption-key',
      inputLoading: false,
      scanTimer: null,
      scanBuffer: '',
    };
  },
  created() {
  },
  methods: {
    showPwd() {
      if (this.passwordType === "password") {
        this.passwordType = "";
      } else {
        this.passwordType = "password";
      }
      this.$nextTick(() => {
        this.$refs.password.focus();
      });
    },
    decryptId(encryptedId) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedId, 'your-secret-key');
        const decryptedId = bytes.toString(CryptoJS.enc.Utf8);
        return decryptedId;
      } catch (err) {
        console.error('解密失败:', err);
        return null;
      }
    },
    decryptLoginData(encryptedStr) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedStr, this.encryptionKey);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return decryptedData;
      } catch (error) {
        console.error('解密失败:', error);
        return null;
      }
    },
    async handleAccountLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (valid) {
          try {
            this.accountLoading = true;
            const loginData = {
              userName: (this.loginForm.userName || '').trim(),
              password: (this.loginForm.password || '').trim()
            };

            const response = await this.$store.dispatch('user/login', loginData);
            this.$router.push('/');
          } catch (error) {
            console.error('登录失败:', error && error.message || '未知错误');
            this.$message.error(error && error.message || '登录失败，请重试');
          } finally {
            this.accountLoading = false;
          }
        }
      });
    },
    async handleQrcodeLogin() {
      if (this.qrcodeLoading) return;

      try {
        this.qrcodeLoading = true;
        const encryptedId = this.loginForm.encryptedId;
        if (!encryptedId) {
          this.$message.error('请扫描二维码');
          return;
        }

        const decryptedData = this.decryptLoginData(encryptedId);
        if (!decryptedData) {
          this.$message.error('二维码无效或已过期');
          return;
        }

        const loginData = {
          userName: decryptedData.userName,
          password: decryptedData.password,
          id: decryptedData.id
        };

        const response = await this.$store.dispatch('user/login', loginData);
        this.$router.push('/');
      } finally {
        this.qrcodeLoading = false;
        this.loginForm.encryptedId = '';
        this.focusScanInput();
      }
    },
    getOtherQuery(query) {
      return Object.keys(query).reduce((acc, cur) => {
        if (cur !== 'redirect') {
          acc[cur] = query[cur]
        }
        return acc
      }, {})
    },
    focusScanInput() {
      if (this.loginType === 'qrcode' && this.$refs.scanInput) {
        this.$refs.scanInput.focus();
      }
    },
    handleScanInput(val) {
      console.log('handleScanInput', val);
      if (this.loginType !== 'qrcode') return;

      this.scanBuffer = val;
      this.inputLoading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      if (this.scanTimer) {
        clearTimeout(this.scanTimer);
      }

      this.scanTimer = setTimeout(() => {
        if (this.scanBuffer) {
          this.loginForm.encryptedId = this.scanBuffer.trim();
          this.handleQrcodeLogin();
        }
        this.inputLoading.close();
        this.scanBuffer = '';
      }, 1500);
    },
    handleScanChange(val) {
      // 移除 change 事件的直接处理，统一由 input 事件处理
    }
  },
  mounted() {
    if (this.loginType === 'qrcode') {
      this.focusScanInput();
    }
  }
};
</script>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  min-height: 600px;
  background: url("~@/assets/login_images/background.jpg") center center fixed no-repeat;
  background-size: cover;

  .title {
    height: 50px;
    font-size: 54px;
    font-weight: 500;
    color: rgba(14, 18, 26, 1);
  }

  .title-tips {
    height: 24px;
    margin-top: 29px;
    font-size: 26px;
    font-weight: 400;
    color: rgba(14, 18, 26, 1);
  }

  .login-btn {
    display: inherit;
    width: 220px;
    height: 60px;
    margin-top: 5px;
    border: 0;

    &:hover {
      opacity: 0.9;
    }
  }

  .login-logo-bysj {
    position: absolute;
    top: 45px;
    left: 45px;

    img {
      width: 180px;
    }
  }

  .login-form {
    position: relative;
    max-width: 100%;
    margin: 22vh 10% 10%;
    overflow: hidden;

    .forget-password {
      width: 100%;
      margin-top: 40px;
      text-align: left;

      .forget-pass {
        width: 129px;
        height: 19px;
        font-size: 20px;
        font-weight: 400;
        color: rgba(92, 102, 240, 1);
      }
    }

    .qrcode-tab {
      .el-form-item {
        margin-top: 49px;

        .el-input {
          input {
            padding-left: 45px;
            font-size: 14px;
            background: #f6f4fc;

            &:focus {
              background: #fff;
            }
          }
        }
      }

      .scan-tip {
        text-align: center;
        color: #909399;
        font-size: 14px;
        margin-top: 15px;
      }
    }
  }

  .tips {
    margin-bottom: 10px;
    font-size: 14px;
    color: #fff;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .title-container {
    position: relative;

    .title {
      margin: 0 auto 40px auto;
      font-size: 34px;
      font-weight: bold;
      color: #1890ff;
      text-align: center;
    }
  }

  .svg-container {
    position: absolute;
    top: 14px;
    left: 15px;
    z-index: 999;
    font-size: 16px;
    color: #d7dee3;
    cursor: pointer;
    user-select: none;
  }

  .show-pwd {
    position: absolute;
    top: 14px;
    right: 25px;
    font-size: 16px;
    color: #606266;
    cursor: pointer;
    user-select: none;
  }

  ::v-deep {
    .el-form-item {
      padding-right: 0;
      margin: 20px 0;
      color: #454545;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 2px;

      &__content {
        min-height: 32px;
        line-height: 32px;
      }

      &__error {
        position: absolute;
        top: 100%;
        left: 18px;
        font-size: 12px;
        line-height: 18px;
        color: #ff4d4f;
      }
    }

    .el-input {
      box-sizing: border-box;

      input {
        height: 58px;
        padding-left: 45px;
        font-size: 14px;
        line-height: 58px;
        color: #606266;
        background: #f6f4fc;
        border: 0;
        caret-color: #606266;
      }
    }
  }
}
</style>
