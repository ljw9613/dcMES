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
              <!-- 锁定状态提示 -->
              <div v-if="isAccountLocked" class="lock-warning">
                <i class="el-icon-lock"></i>
                <div class="lock-content">
                  <div v-if="autoUnlockEnabled && lockRemainingTime > 0" class="lock-countdown">
                    账号已被锁定，剩余时间：{{ formatRemainingTime(lockRemainingTime) }}
                  </div>
                  <div v-else-if="!autoUnlockEnabled" class="lock-permanent">
                    账号已被锁定，请联系管理员解锁
                  </div>
                  <div v-if="unlockHint" class="unlock-hint">
                    {{ unlockHint }}
                  </div>
                </div>
              </div>
              
              <el-button :loading="accountLoading" :disabled="isAccountLocked" class="login-btn" type="primary"
                @click.native.prevent="handleAccountLogin">
                {{ isAccountLocked ? '账号已锁定' : '账号登录' }}
              </el-button>
            </el-tab-pane>
            <el-tab-pane label="扫码登录" name="qrcode">
              <el-form-item prop="encryptedId">
                <span class="svg-container">
                  <byui-icon :icon="['fas', 'qrcode']" />
                </span>
                <el-input v-model="loginForm.encryptedId" placeholder="请使用扫描枪扫描二维码" ref="scanInput"
                  :disabled="inputLoading" @keyup.enter.native="handleQrcodeLogin" @input="handleScanInput">
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
      isAccountLocked: false, // 账号是否被锁定
      lockRemainingTime: 0, // 锁定剩余时间（秒）
      lockCountdownTimer: null, // 倒计时定时器
      autoUnlockEnabled: true, // 是否启用自动解锁
      unlockHint: '', // 解锁提示信息
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
    // 处理账号锁定状态
    handleAccountLock(errorData) {
      this.isAccountLocked = true;
      this.autoUnlockEnabled = errorData.autoUnlockEnabled;
      this.unlockHint = errorData.unlockHint || '';
      
      if (this.autoUnlockEnabled && errorData.remainingMinutes) {
        this.lockRemainingTime = errorData.remainingMinutes * 60; // 转换为秒
        // 启动倒计时
        this.startLockCountdown();
      } else {
        // 自动解锁禁用时，不启动倒计时
        this.lockRemainingTime = 0;
      }
    },
    // 启动锁定倒计时
    startLockCountdown() {
      if (this.lockCountdownTimer) {
        clearInterval(this.lockCountdownTimer);
      }
      
      this.lockCountdownTimer = setInterval(() => {
        this.lockRemainingTime--;
        
        if (this.lockRemainingTime <= 0) {
          this.clearAccountLock();
        }
      }, 1000);
    },
    // 清除账号锁定状态
    clearAccountLock() {
      this.isAccountLocked = false;
      this.lockRemainingTime = 0;
      
      if (this.lockCountdownTimer) {
        clearInterval(this.lockCountdownTimer);
        this.lockCountdownTimer = null;
      }
    },
    // 格式化剩余时间显示
    formatRemainingTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}分${secs}秒`;
    },
    async handleAccountLogin() {
      // 如果账号被锁定，禁止登录
      if (this.isAccountLocked) {
        if (this.autoUnlockEnabled && this.lockRemainingTime > 0) {
          this.$message.warning(`账号已被锁定，请等待${this.formatRemainingTime(this.lockRemainingTime)}后再试`);
        } else {
          this.$message.warning('账号已被锁定，请联系管理员解锁');
        }
        return;
      }

      this.$refs.loginForm.validate(async (valid) => {
        if (valid) {
          try {
            this.accountLoading = true;
            const loginData = {
              userName: (this.loginForm.userName || '').trim(),
              password: (this.loginForm.password || '').trim()
            };

            const response = await this.$store.dispatch('user/login', loginData);
            // 登录成功，清除锁定状态
            this.clearAccountLock();
            this.$router.push('/');
          } catch (error) {
            console.error('登录失败:', error);
            
            // 处理不同的错误码
            if (error.code === 4023) {
              // 账号被锁定
              this.handleAccountLock(error);
              this.$message.error(error.message);
            } else if (error.code === 4022) {
              // 密码错误但未锁定
              this.$message.error(error.message);
            } else {
              this.$message.error(error.message || '登录失败，请重试');
            }
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
        // 去除可能的回车符和换行符
        const cleanValue = encryptedId.trim().replace(/[\r\n]/g, '');
        if (!cleanValue) return;

        const decryptedData = this.decryptLoginData(cleanValue);
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
      if (this.loginType !== 'qrcode') return;
      this.scanBuffer = val;
      
      // 移除自动提交的定时器逻辑
      if (this.scanTimer) {
        clearTimeout(this.scanTimer);
        this.scanTimer = null;
      }
    },
  },
  mounted() {
    if (this.loginType === 'qrcode') {
      this.focusScanInput();
    }
  },
  beforeDestroy() {
    // 清理定时器
    if (this.lockCountdownTimer) {
      clearInterval(this.lockCountdownTimer);
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

  .lock-warning {
    display: flex;
    align-items: flex-start;
    margin: 15px 0;
    padding: 12px;
    background-color: #fef0f0;
    border: 1px solid #fde2e2;
    border-radius: 6px;
    color: #f56c6c;
    font-size: 14px;

    .el-icon-lock {
      margin-right: 10px;
      margin-top: 2px;
      font-size: 16px;
      flex-shrink: 0;
    }

    .lock-content {
      flex: 1;
      line-height: 1.5;

      .lock-countdown {
        font-weight: 600;
        margin-bottom: 4px;
      }

      .lock-permanent {
        font-weight: 600;
        margin-bottom: 4px;
      }

      .unlock-hint {
        font-size: 12px;
        color: #909399;
        margin-top: 6px;
        padding: 6px 8px;
        background-color: #f8f9fa;
        border-radius: 4px;
        border-left: 3px solid #e6a23c;
      }
    }
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

    &:disabled {
      background-color: #c0c4cc !important;
      cursor: not-allowed;
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
