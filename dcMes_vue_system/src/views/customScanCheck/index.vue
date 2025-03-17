<template>
  <div class="custom-scan-container">
    <!-- 设置区域 -->
    <div class="settings-panel" :class="{ 'settings-collapsed': !showSettings }">
      <div class="settings-header">
        <h2>接口配置</h2>
        <div class="settings-actions">
          <el-button type="text" @click="clearConfig" class="clear-btn">
            <i class="el-icon-delete"></i>
          </el-button>
          <el-button type="text" @click="toggleSettings">
            <i :class="showSettings ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
          </el-button>
        </div>
      </div>
      
      <div v-show="showSettings" class="settings-content">
        <el-form :model="apiConfig" label-position="top">
          <el-form-item label="请求地址">
            <el-input
              v-model="apiConfig.url"
              placeholder="请输入完整的API地址"
              :title="apiConfig.url"
            >
              <template slot="prepend">
                <i class="el-icon-link"></i>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="请求方法">
            <el-select v-model="apiConfig.method" style="width: 100%">
              <el-option label="GET" value="GET"></el-option>
              <el-option label="POST" value="POST"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 扫码区域 -->
    <div class="scan-area">
      <div class="scan-box">
        <div class="scan-line"></div>
        <el-input
          ref="scanInput"
          v-model="scanCode"
          placeholder="请扫描或输入条码"
          @keyup.enter.native="handleScan"
        >
          <template slot="prefix">
            <i class="el-icon-scan"></i>
          </template>
          <el-button slot="append" type="primary" @click="handleScan">验证</el-button>
        </el-input>
      </div>
    </div>

    <!-- 结果展示 -->
    <div v-if="scanResult" class="result-area" :class="scanResult.success ? 'success' : 'error'">
      <div class="result-icon">
        <i :class="scanResult.success ? 'el-icon-success' : 'el-icon-error'"></i>
      </div>
      <div class="result-message">{{ scanResult.message }}</div>
      <div class="result-details">
        <pre>{{ JSON.stringify(scanResult.data, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'CustomScanCheck',
  data() {
    return {
      showSettings: true,
      apiConfig: {
        url: localStorage.getItem('scanApiUrl') || '',
        method: localStorage.getItem('scanApiMethod') || 'POST'
      },
      scanCode: '',
      scanResult: null,
      isLoading: false
    }
  },
  
  watch: {
    // 监听 apiConfig 变化并保存到本地存储
    'apiConfig.url': {
      handler(newVal) {
        localStorage.setItem('scanApiUrl', newVal)
      }
    },
    'apiConfig.method': {
      handler(newVal) {
        localStorage.setItem('scanApiMethod', newVal)
      }
    }
  },

  methods: {
    toggleSettings() {
      this.showSettings = !this.showSettings
      // 保存设置面板状态
      localStorage.setItem('scanSettingsVisible', this.showSettings)
    },

    // 清除配置
    clearConfig() {
      this.$confirm('确定要清除已保存的配置吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.apiConfig.url = ''
        this.apiConfig.method = 'POST'
        localStorage.removeItem('scanApiUrl')
        localStorage.removeItem('scanApiMethod')
        this.$message.success('配置已清除')
      }).catch(() => {})
    },

    async handleScan() {
      if (!this.apiConfig.url) {
        this.$message.error('请先配置请求地址')
        return
      }
      if (!this.scanCode) {
        this.$message.warning('请输入扫描码')
        return
      }

      this.isLoading = true
      try {
        const response = await axios({
          method: this.apiConfig.method,
          url: this.apiConfig.url,
          data: { code: this.scanCode },
          timeout: 5000
        })

        this.scanResult = {
          success: response.data.success || response.status === 200,
          message: response.data.message || '验证成功',
          data: response.data
        }

        if (this.scanResult.success) {
          this.$message.success(this.scanResult.message)
        } else {
          this.$message.error(this.scanResult.message)
        }
      } catch (error) {
        this.scanResult = {
          success: false,
          message: error.message || '请求失败',
          data: error.response && error.response.data
        }
        this.$message.error(this.scanResult.message)
      } finally {
        this.isLoading = false
        this.scanCode = ''
        this.$refs.scanInput.focus()
      }
    }
  },

  mounted() {
    // 恢复设置面板状态
    const savedSettingsVisible = localStorage.getItem('scanSettingsVisible')
    if (savedSettingsVisible !== null) {
      this.showSettings = savedSettingsVisible === 'true'
    }
    this.$refs.scanInput.focus()
  }
}
</script>

<style lang="scss" scoped>
.custom-scan-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
  color: #333;
}

.settings-panel {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    font-size: 16px;
    margin: 0;
    color: #333;
  }
}

.settings-content {
  margin-top: 20px;
}

.scan-area {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 40px 0;
}

.scan-box {
  width: 100%;
  max-width: 800px;
  position: relative;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.scan-line {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 3px;
  height: 100%;
  background: linear-gradient(to bottom, 
    transparent 0%,
    #409EFF 50%,
    transparent 100%);
  animation: scanAnimation 2s ease-in-out infinite;
}

@keyframes scanAnimation {
  0% {
    transform: translateX(-50%) scaleY(0);
    opacity: 0;
  }
  50% {
    transform: translateX(-50%) scaleY(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) scaleY(0);
    opacity: 0;
  }
}

.result-area {
  max-width: 800px;
  margin: 30px auto;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.result-area.success {
  border: 1px solid #67c23a;
}

.result-area.error {
  border: 1px solid #f56c6c;
}

.result-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.result-message {
  font-size: 18px;
  margin-bottom: 15px;
}

.result-details {
  text-align: left;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}

.result-details pre {
  margin: 0;
  color: #333;
}

/* Element UI 组件样式覆盖 */
::v-deep .el-input__inner,
::v-deep .el-select .el-input__inner {
  background: #fff;
  border: 1px solid #dcdfe6;
  color: #333;
}

::v-deep .el-input__inner::placeholder {
  color: #909399;
}

.settings-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.clear-btn {
  color: #f56c6c;
}

.clear-btn:hover {
  color: #ff7875;
}

/* 添加工具提示样式 */
.el-input {
  cursor: pointer;
}

.el-input:hover::after {
  content: attr(title);
  position: absolute;
  bottom: -25px;
  left: 0;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
}
</style> 