<template>
  <el-popover
    v-model="expanded"
    placement="bottom-end"
    :width="290"
    trigger="click"
    popper-class="scan-config-popover"
  >
    <!-- 触发按钮 -->
    <div slot="reference" class="scan-config-trigger" title="扫码配置">
      <i class="el-icon-setting"></i>
      <span class="scan-config-text">扫码配置</span>
    </div>

    <!-- 配置内容 -->
    <div class="scan-config-body">
      <div class="scan-config-title">扫码配置</div>

      <!-- 提示音开关 -->
      <div class="scan-config-item">
        <span class="scan-config-label">扫码成功提示音</span>
        <el-switch :value="soundEnabled" @change="onSoundChange" />
      </div>

      <!-- 错误提示展示模式 -->
      <div class="scan-config-item scan-config-item-mode">
        <span class="scan-config-label">错误提示</span>
        <el-radio-group :value="errorDisplayMode" @input="onModeChange" size="small">
          <el-radio label="auto">自动关闭</el-radio>
          <el-radio label="manual">手动确认</el-radio>
        </el-radio-group>
        <p class="scan-config-desc">
          {{ errorDisplayMode === 'auto' ? '提示框短暂显示后自动消失，可继续扫码' : '需点击关闭后才能继续扫码' }}
        </p>
      </div>
    </div>
  </el-popover>
</template>

<script>
export default {
  name: 'FloatingScanConfig',
  data() {
    return {
      expanded: false,
    }
  },
  computed: {
    soundEnabled() {
      return this.$store.state.scanConfig.soundEnabled
    },
    errorDisplayMode() {
      return this.$store.state.scanConfig.errorDisplayMode
    },
  },
  methods: {
    onSoundChange(val) {
      this.$store.dispatch('scanConfig/setScanConfig', {
        soundEnabled: val,
        errorDisplayMode: this.errorDisplayMode,
      })
    },
    onModeChange(val) {
      this.$store.dispatch('scanConfig/setScanConfig', {
        soundEnabled: this.soundEnabled,
        errorDisplayMode: val,
      })
    },
  },
}
</script>

<style scoped>
.scan-config-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
  height: 50px;
  transition: background 0.3s;
  color: #5a5e66;
}

.scan-config-trigger:hover {
  background: rgba(0, 0, 0, 0.025);
}

.scan-config-trigger .el-icon-setting {
  font-size: 16px;
}

.scan-config-text {
  margin-left: 5px;
  font-size: 14px;
}
</style>

<!-- 全局样式：popover 内容区 -->
<style>
.scan-config-popover {
  padding: 0 !important;
  border-radius: 8px !important;
  overflow: hidden;
}

.scan-config-popover .scan-config-body {
  padding: 14px;
}

.scan-config-popover .scan-config-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.scan-config-popover .scan-config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.scan-config-popover .scan-config-item:last-child {
  margin-bottom: 0;
}

.scan-config-popover .scan-config-item-mode {
  flex-wrap: wrap;
}

.scan-config-popover .scan-config-item-mode .scan-config-label {
  width: 100%;
  margin-bottom: 8px;
}

.scan-config-popover .scan-config-item-mode .el-radio-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scan-config-popover .scan-config-label {
  font-size: 14px;
  color: #303133;
}

.scan-config-popover .scan-config-desc {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  width: 100%;
}
</style>
