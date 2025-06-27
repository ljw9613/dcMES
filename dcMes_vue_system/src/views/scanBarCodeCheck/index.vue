<template>
  <div class="scan-barcode-container">
    <div class="scan-header">
      <h2>条码流程节点检查</h2>
    </div>

    <div class="scan-input-area">
      <div class="input-wrapper">
        <el-input ref="barcodeInput" v-model="barcode" placeholder="请扫描条码或手动输入" class="barcode-input"
          @keyup.enter.native="checkBarcode" @focus="handleFocus">
          <i slot="prefix" class="el-icon-search"></i>
          <el-button slot="suffix" type="primary" @click="checkBarcode">查询</el-button>
        </el-input>
      </div>
      <div class="scan-tip">请将条码对准扫描枪，或在输入框中输入条码后按下Enter键</div>
    </div>

    <div class="operation-buttons">
      <el-button
        type="primary"
        @click="handleScan"

        icon="el-icon-camera">
        手动输入查询
      </el-button>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div v-loading="true" element-loading-text="正在查询条码信息..."></div>
    </div>

    <div v-if="scanResult && !isLoading" class="result-container">
      <div class="result-header">
        <div class="status-badge" :class="getBadgeClass">
          <i :class="scanResult.isCompleted ? 'el-icon-success' : 'el-icon-warning'" class="status-icon"></i>
          <span>{{ scanResult.status === 'COMPLETED' ? '流程已完成' : '流程未完成' }}</span>
        </div>
      </div>

      <el-card class="result-card" shadow="hover">
        <div class="info-section">
          <el-descriptions title="条码基本信息" :column="1" border>
            <el-descriptions-item label="条码">
              {{ scanResult.barcode }}
            </el-descriptions-item>
            <el-descriptions-item label="物料编码">
              {{ scanResult.materialCode }}
            </el-descriptions-item>
            <el-descriptions-item label="物料名称">
              {{ scanResult.materialName }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="scanResult.status === 'COMPLETED' ? 'success' : 'warning'">
                {{ scanResult.status === 'COMPLETED' ? '已完成' : '未完成' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="完成进度">
              <el-progress :percentage="scanResult.progress"
                :status="scanResult.status === 'COMPLETED' ? 'success' : ''"></el-progress>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="node-statistics">
          <div class="statistic-item">
            <div class="statistic-title">总节点数</div>
            <div class="statistic-value">{{ scanResult.totalNodes }}</div>
          </div>
          <div class="statistic-item">
            <div class="statistic-title">已完成</div>
            <div class="statistic-value success">{{ scanResult.completedNodes }}</div>
          </div>
          <div class="statistic-item">
            <div class="statistic-title">未完成</div>
            <div class="statistic-value" :class="{ warning: scanResult.pendingNodes > 0 }">
              {{ scanResult.pendingNodes }}
            </div>
          </div>
        </div>

        <div v-if="scanResult.pendingNodes > 0 && scanResult.pendingNodesList.length > 0" class="pending-nodes-section">
          <h3>未完成节点列表</h3>
          <el-table :data="scanResult.pendingNodesList" style="width: 100%" size="medium" :row-key="getRowKey">
            <el-table-column prop="nodeName" label="节点名称"></el-table-column>
            <el-table-column prop="nodeType" label="节点类型">
              <template slot-scope="scope">
                {{ getNodeTypeText(scope.row.nodeType) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template slot-scope="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>

    <div v-if="errorMessage" class="error-container">
      <el-alert :title="errorMessage" type="error" show-icon :closable="false"></el-alert>
    </div>
    <status-popup :visible.sync="showPopup" :type="popupType" :duration="1500" />

  </div>
</template>

<script>
import { checkBarcodeCompletion } from '@/api/materialProcessFlowService'
import StatusPopup from '@/components/StatusPopup/index.vue'
import { playAudio, preloadAudioFiles } from "@/utils/audioI18n.js";

export default {
  name: 'ScanBarCodeCheck',
  components: {
    StatusPopup
  },
  data() {
    return {
      barcode: '',
      scanResult: null,
      isLoading: false,
      errorMessage: '',
      tableData: [],
      showPopup: false,
      popupType: '',
    }
  },

  computed: {
    getBadgeClass() {
      if (!this.scanResult) return ''
      return this.scanResult.isCompleted ? 'status-completed' : 'status-pending'
    }
  },

  methods: {
    // 自动聚焦输入框
    focusInput() {
      this.$nextTick(() => {
        if (this.$refs.barcodeInput) {
          this.$refs.barcodeInput.$el.querySelector('input').focus()
        }
      })
    },

    // 监听页面点击事件，自动聚焦
    handleGlobalClick() {
      const input = this.$refs.barcodeInput.$el.querySelector('input')
      if (document.activeElement !== input) {
        this.focusInput()
      }
    },

    // 主动处理聚焦事件
    handleFocus() {
      // 这里可以添加额外的聚焦逻辑
    },

    // 获取状态文本
    getStatusText(status) {
      if (status) {
        const statusMap = {
          'PENDING': '待处理',
          'IN_PROGRESS': '进行中',
          'COMPLETED': '已完成',
          'SKIPPED': '已跳过',
          'ERROR': '异常'
        }
        return statusMap[status] || status
      }
      if (!this.scanResult) return ''
      return this.scanResult.isCompleted ? '流程已完成' : '流程未完成'
    },

    // 获取节点类型文本
    getNodeTypeText(type) {
      const typeMap = {
        'PROCESS_STEP': '工序',
        'MATERIAL': '物料'
      }
      return typeMap[type] || type
    },

    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        'PENDING': 'warning',
        'IN_PROGRESS': 'primary',
        'COMPLETED': 'success',
        'SKIPPED': 'info',
        'ERROR': 'danger'
      }
      return typeMap[status] || 'info'
    },

    // 获取表格行的key
    getRowKey(row) {
      return row.nodeId
    },

    // 条码检查
    async checkBarcode() {
      if (!this.barcode) {
        this.$message.warning('请输入条码')
        return
      }

      this.errorMessage = ''
      this.isLoading = true
      this.scanResult = null

      try {
        const response = await checkBarcodeCompletion(this.barcode)

        if (response.success && response.code === 200) {
          this.scanResult = response.data
          this.tableData = this.scanResult.pendingNodesList || []

          if (this.scanResult.isCompleted) {
            this.$message.success('条码检查完成')
            this.showPopup = true
            this.popupType = 'ok'
            playAudio("lcywc")
          } else {
            this.$message.warning('流程尚未完成')
            this.showPopup = true
            this.popupType = 'ng'
            playAudio("lcyw")
          }
        } else {
          this.errorMessage = response.message || '查询失败'
          this.$message.error(this.errorMessage)
          this.showPopup = true
          this.popupType = 'ng'
          playAudio("tmyw")
        }
      } catch (error) {
        this.errorMessage = '系统错误，请重试'
        this.$message.error(this.errorMessage)
        this.showPopup = true
        this.popupType = 'ng'
        playAudio("tmyw")
        console.error('查询条码出错:', error)
      } finally {
        this.isLoading = false
        this.barcode = '' // 清空输入框
        this.focusInput() // 重新聚焦
      }
    },

    // 条码扫描处理
    handleScan() {
      // 这里可以调用产线验证的API，目前只是作为示例
      this.$message({
        message: '开始产线验证流程，请扫描二维码',
        type: 'info',
        duration: 2000
      });
      this.barcode = ''; // 清空当前输入
      this.focusInput(); // 聚焦输入框，准备扫描

      // 可以在这里添加额外的验证逻辑
      // 例如切换到产线验证模式，或者调用特定的API

      // 示例：可以在组件上设置一个标志，表示当前是在产线验证模式
      // this.verificationMode = 'productionLine';
      // 然后在checkBarcode方法中判断当前模式，调用不同的处理逻辑
    }
  },

  mounted() {
    // 添加全局点击事件
    document.addEventListener('click', this.handleGlobalClick)
    // 初始聚焦
    this.focusInput()
  },

  beforeDestroy() {
    // 移除全局点击事件
    document.removeEventListener('click', this.handleGlobalClick)
  }
}
</script>

<style scoped>
.scan-barcode-container {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100%;
}

.scan-header {
  margin-bottom: 24px;
  text-align: center;
}

.scan-header h2 {
  font-size: 24px;
  color: #409EFF;
  font-weight: 600;
}

.scan-input-area {
  max-width: 800px;
  margin: 0 auto 24px;
  text-align: center;
}

.input-wrapper {
  margin-bottom: 12px;
}

.barcode-input {
  height: 50px;
  font-size: 18px;
}

.barcode-input /deep/ .el-input__inner {
  height: 50px;
  line-height: 50px;
}

.scan-tip {
  color: #909399;
  font-size: 14px;
}

.loading-container {
  text-align: center;
  margin: 50px 0;
  position: relative;
  min-height: 200px;
}

.result-container {
  max-width: 1000px;
  margin: 24px auto;
}

.result-header {
  margin-bottom: 16px;
  text-align: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 20px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
}

.status-icon {
  margin-right: 8px;
  font-size: 20px;
}

.status-completed {
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
  color: #67c23a;
}

.status-pending {
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
  color: #e6a23c;
}

.result-card {
  border-radius: 8px;
}

.info-section {
  margin-bottom: 24px;
}

.node-statistics {
  display: flex;
  justify-content: space-around;
  margin: 24px 0;
  flex-wrap: wrap;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  padding: 24px 0;
}

.statistic-item {
  text-align: center;
  padding: 0 16px;
}

.statistic-title {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.statistic-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.statistic-value.success {
  color: #67c23a;
}

.statistic-value.warning {
  color: #e6a23c;
}

.pending-nodes-section {
  margin-top: 24px;
}

.pending-nodes-section h3 {
  margin-bottom: 16px;
  font-weight: 500;
  color: #303133;
}

.error-container {
  max-width: 800px;
  margin: 24px auto;
}

.operation-buttons {
  max-width: 800px;
  margin: 20px auto;
  text-align: center;
}

.operation-buttons .el-button {
  padding: 12px 20px;
  font-size: 16px;
}

/* 适配移动设备 */
@media (max-width: 768px) {
  .scan-barcode-container {
    padding: 16px;
  }

  .node-statistics {
    flex-direction: column;
  }

  .statistic-item {
    margin-bottom: 16px;
  }

  .statistic-value {
    font-size: 20px;
  }
}
</style>
