<template>
  <div class="pallet-barcode-container">
    <div class="scan-header">
      <h2>托盘条码校验</h2>
    </div>

    <!-- 托盘单据输入区域 -->
    <div class="scan-input-area" v-if="!palletLoaded">
      <!-- 已完成托盘记录 -->
      <div v-if="completedPallets.length > 0" class="completed-pallets-container">
        <div class="completed-pallets-header">已完成托盘</div>
        <div class="completed-pallets-list">
          <el-tag 
            v-for="(pallet, index) in completedPallets" 
            :key="index" 
            type="success" 
            effect="plain"
            class="completed-pallet-tag">
            {{ pallet.palletCode }} ({{ pallet.verifiedBarcodes }}/{{ pallet.totalBarcodes }})
          </el-tag>
        </div>
      </div>
      
      <div class="input-wrapper">
        <el-input ref="palletInput" v-model="palletCode" placeholder="请扫描托盘单据编号" class="barcode-input"
          @keyup.enter.native="handlePalletCodeInput" @focus="handleFocus">
          <i slot="prefix" class="el-icon-document"></i>
          <el-button slot="suffix" type="primary" @click="handlePalletCodeInput">加载托盘</el-button>
        </el-input>
      </div>
      <div class="scan-tip">请将托盘单据条码对准扫描枪，或在输入框中输入托盘编号后按Enter键</div>
    </div>

    <!-- 托盘信息和条码输入区域 -->
    <div v-if="palletLoaded && !isLoading" class="layout-container">
      <div class="left-column">
        <el-card class="pallet-info-card">
          <div slot="header" class="clearfix">
            <span>托盘信息</span>
            <el-button style="float: right" type="text" @click="resetPallet">更换托盘</el-button>
          </div>
          <div class="pallet-info-grid">
            <div class="info-item">
              <div class="info-label">托盘编号</div>
              <div class="info-value">{{ palletInfo.palletCode }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">物料信息</div>
              <div class="info-value">{{ palletInfo.materialName }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">总条码数</div>
              <div class="info-value">{{ palletInfo.totalBarcodes }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">已校验条码</div>
              <div class="info-value">{{ palletInfo.verifiedBarcodes }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">未校验条码</div>
              <div class="info-value">{{ palletInfo.remainingBarcodes }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">组托状态</div>
              <div class="info-value">
                <el-tag :type="palletInfo.status === 'STACKED' ? 'success' : 'warning'">
                  {{ palletInfo.status === 'STACKED' ? '组托完成' : '组托中' }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <el-progress 
            :percentage="computeProgress" 
            :status="palletInfo.verifiedBarcodes === palletInfo.totalBarcodes ? 'success' : ''"
            style="margin-top: 20px;">
          </el-progress>
        </el-card>

        <!-- 条码扫描区域 -->
        <div class="scan-input-area" style="margin-top: 20px;">
          <div class="input-wrapper">
            <el-input ref="barcodeInput" v-model="barcode" placeholder="请扫描条码或手动输入" class="barcode-input"
              @keyup.enter.native="verifyBarcode" @focus="handleFocus">
              <i slot="prefix" class="el-icon-search"></i>
              <el-button slot="suffix" type="primary" @click="verifyBarcode">校验</el-button>
            </el-input>
          </div>
          <div class="scan-tip">请将条码对准扫描枪，或在输入框中输入条码后按下Enter键</div>
        </div>

        <!-- 条码校验结果 -->
        <div v-if="scanResult" class="result-container">
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
      </div>

      <div class="right-column">
        <!-- 托盘中的条码列表 -->
        <div v-if="palletInfo.barcodes.length > 0" class="barcode-list-section">
          <el-card class="barcode-list-card">
            <div slot="header">
              <span>托盘条码列表</span>
              <div style="float: right; display: flex; align-items: center;">
                <el-radio-group v-model="barcodeFilter" size="small" style="margin-right: 15px;">
                  <el-radio-button label="all">全部条码</el-radio-button>
                  <el-radio-button label="unverified">待校验条码</el-radio-button>
                </el-radio-group>
                <span style="color: #909399; font-size: 13px;">
                  共 {{ filteredBarcodes.length }} 个条码
                </span>
              </div>
            </div>
            <el-table 
              :data="paginatedBarcodes" 
              style="width: 100%" 
              size="small" 
              :row-key="row => row.barcode"
              height="calc(100vh - 200px)">
              <el-table-column prop="barcode" label="条码" width="180"></el-table-column>
              <el-table-column label="校验状态" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.verified ? 'success' : 'info'" size="mini">
                    {{ scope.row.verified ? '已校验' : '未校验' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="流程状态" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.verified" :type="getStatusType(scope.row.status)" size="mini">
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="扫描时间" min-width="150">
                <template slot-scope="scope">
                  {{ formatDate(scope.row.scanTime) }}
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 添加分页控件 -->
            <div style="text-align: right; margin-top: 12px;">
              <el-pagination
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :current-page="currentPage"
                :page-sizes="[10, 20, 50, 100]"
                :page-size="pageSize"
                layout="total, sizes, prev, pager, next, jumper"
                :total="filteredBarcodes.length">
              </el-pagination>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div v-loading="true" :element-loading-text="loadingText"></div>
    </div>

    <div v-if="errorMessage" class="error-container">
      <el-alert :title="errorMessage" type="error" show-icon :closable="false"></el-alert>
    </div>
    <status-popup :visible.sync="showPopup" :type="popupType" :duration="1500" />

  </div>
</template>

<script>
import { getData } from '@/api/data'
import { checkBarcodeCompletion } from '@/api/materialProcessFlowService'
import StatusPopup from '@/components/StatusPopup/index.vue'
import {
  tone
} from "@/utils/tone.js";
import lcywc from "@/assets/tone/lcywc.mp3";
import lcyw from "@/assets/tone/lcyw.mp3";
import tmyw from "@/assets/tone/tmyw.mp3";

export default {
  name: 'PalletBarcodeVerification',
  components: {
    StatusPopup
  },
  data() {
    return {
      // 托盘相关
      palletCode: '',
      palletLoaded: false,
      palletInfo: {
        palletCode: '',
        materialName: '',
        materialCode: '',
        status: '',
        totalBarcodes: 0,
        verifiedBarcodes: 0,
        remainingBarcodes: 0,
        barcodes: []
      },
      
      // 条码相关
      barcode: '',
      scanResult: null,
      isLoading: false,
      loadingText: '',
      errorMessage: '',
      showPopup: false,
      popupType: '',
      
      // 分页相关
      currentPage: 1,
      pageSize: 10,
      
      // 条码筛选
      barcodeFilter: 'all',
      
      // 已完成托盘记录
      completedPallets: [],
    }
  },

  computed: {
    getBadgeClass() {
      if (!this.scanResult) return ''
      return this.scanResult.isCompleted ? 'status-completed' : 'status-pending'
    },
    computeProgress() {
      if (!this.palletInfo.totalBarcodes) return 0
      return Math.round((this.palletInfo.verifiedBarcodes / this.palletInfo.totalBarcodes) * 100)
    },
    filteredBarcodes() {
      if (this.barcodeFilter === 'all') {
        return this.palletInfo.barcodes;
      } else {
        return this.palletInfo.barcodes.filter(item => !item.verified);
      }
    },
    paginatedBarcodes() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredBarcodes.slice(start, end);
    }
  },

  methods: {
    // 自动聚焦输入框
    focusInput() {
      this.$nextTick(() => {
        if (this.palletLoaded) {
          if (this.$refs.barcodeInput) {
            this.$refs.barcodeInput.$el.querySelector('input').focus()
          }
        } else {
          if (this.$refs.palletInput) {
            this.$refs.palletInput.$el.querySelector('input').focus()
          }
        }
      })
    },

    // 监听页面点击事件，自动聚焦
    handleGlobalClick() {
      if (this.palletLoaded) {
        const input = this.$refs.barcodeInput && this.$refs.barcodeInput.$el.querySelector('input')
        if (input && document.activeElement !== input) {
          this.focusInput()
        }
      } else {
        const input = this.$refs.palletInput && this.$refs.palletInput.$el.querySelector('input')
        if (input && document.activeElement !== input) {
          this.focusInput()
        }
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
    
    // 格式化日期
    formatDate(date) {
      if (!date) return '暂无数据';
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return '无效日期';
      }
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    // 重置托盘，重新开始扫描
    resetPallet() {
      this.palletCode = ''
      this.palletLoaded = false
      this.palletInfo = {
        palletCode: '',
        materialName: '',
        materialCode: '',
        status: '',
        totalBarcodes: 0,
        verifiedBarcodes: 0,
        remainingBarcodes: 0,
        barcodes: []
      }
      this.barcode = ''
      this.scanResult = null
      this.errorMessage = ''
      this.focusInput()
      this.currentPage = 1;
    },

    // 添加处理托盘条码的方法
    handlePalletCodeInput() {
      if (!this.palletCode) {
        this.$message.warning('请输入托盘单据编号')
        return
      }
      
      // 如果输入包含#，则截取第一段数据
      if (this.palletCode.includes('#')) {
        this.palletCode = this.palletCode.split('#')[0]
      }
      
      this.loadPalletData()
    },

    // 加载托盘数据
    async loadPalletData() {
      if (!this.palletCode) {
        this.$message.warning('请输入托盘单据编号')
        return
      }

      this.errorMessage = ''
      this.isLoading = true
      this.loadingText = '正在加载托盘数据...'

      try {
        // 使用getData方法获取托盘数据
        const req = {
          query: {
            palletCode: this.palletCode
          },
          limit: 1
        }
        
        const response = await getData("material_palletizing", req)
        
        if (response && response.data && response.data.length > 0) {
          const palletData = response.data[0]
          
          // 提取托盘条码数据
          const palletBarcodes = palletData.palletBarcodes || []
          const boxItems = palletData.boxItems || []
          
          // 合并所有条码
          let allBarcodes = []
          
          // 处理直接添加到托盘的条码
          if (palletBarcodes && palletBarcodes.length > 0) {
            allBarcodes = palletBarcodes.map(item => ({
              barcode: item.barcode,
              scanTime: item.scanTime,
              verified: false,
              status: null
            }))
          }
          
          // 处理箱中的条码 (如果需要)
          // 这部分取决于您的数据结构，如果箱条码也需要校验，则添加此逻辑
          
          // 更新托盘信息
          this.palletInfo = {
            palletCode: palletData.palletCode,
            materialName: palletData.materialName || '未知物料',
            materialCode: palletData.materialCode || '',
            status: palletData.status || 'STACKING',
            totalBarcodes: allBarcodes.length,
            verifiedBarcodes: 0,
            remainingBarcodes: allBarcodes.length,
            barcodes: allBarcodes
          }
          
          this.palletLoaded = true
          this.$message.success('托盘数据加载成功')
          this.showPopup = true
          this.popupType = 'ok'
        //   tone(lcywc)
        } else {
          this.errorMessage = '未找到托盘数据'
          this.$message.error(this.errorMessage)
          this.showPopup = true
          this.popupType = 'ng'
          tone(tmyw)
        }
      } catch (error) {
        this.errorMessage = '系统错误，请重试'
        this.$message.error(this.errorMessage)
        this.showPopup = true
        this.popupType = 'ng'
        tone(tmyw)
        console.error('加载托盘出错:', error)
      } finally {
        this.isLoading = false
        this.barcode = '' // 清空条码输入框
        this.focusInput() // 重新聚焦
      }
    },

    // 条码校验
    async verifyBarcode() {
      if (!this.barcode) {
        this.$message.warning('请输入条码')
        return
      }

      // 在前端校验条码是否在托盘中
      const barcodeInPallet = this.palletInfo.barcodes.find(item => item.barcode === this.barcode)
      
      if (!barcodeInPallet) {
        this.errorMessage = '该条码不存在于当前托盘中'
        this.$message.error(this.errorMessage)
        this.showPopup = true
        this.popupType = 'ng'
        tone(tmyw)
        this.barcode = '' // 清空输入框
        this.focusInput() // 重新聚焦
        return
      }

      this.errorMessage = ''
      this.isLoading = true
      this.loadingText = '正在校验条码...'
      this.scanResult = null

      try {
        const response = await checkBarcodeCompletion(this.barcode)

        if (response.success && response.code === 200) {
          this.scanResult = response.data
          
          // 更新托盘中的条码状态
          const index = this.palletInfo.barcodes.findIndex(item => item.barcode === this.barcode)
          if (index !== -1) {
            // 如果条码之前未校验，则更新统计信息
            if (!this.palletInfo.barcodes[index].verified) {
              this.palletInfo.verifiedBarcodes++
              this.palletInfo.remainingBarcodes--
            }
            
            // 更新条码状态
            this.$set(this.palletInfo.barcodes, index, {
              ...this.palletInfo.barcodes[index],
              verified: true,
              status: this.scanResult.status,
              progress: this.scanResult.progress
            })
          }

          // 检查是否所有条码都已校验完成
          if (this.palletInfo.verifiedBarcodes === this.palletInfo.totalBarcodes) {
            this.$message.success('所有条码已完成校验，托盘校验完成')
            this.showPopup = true
            this.popupType = 'ok'
            tone(lcywc)
            
            // 记录已完成的托盘
            this.completedPallets.push({
              palletCode: this.palletInfo.palletCode,
              materialName: this.palletInfo.materialName,
              totalBarcodes: this.palletInfo.totalBarcodes,
              verifiedBarcodes: this.palletInfo.verifiedBarcodes,
              completedTime: new Date()
            })
            
            // 限制显示的托盘数量，只保留最近的10个
            if (this.completedPallets.length > 10) {
              this.completedPallets = this.completedPallets.slice(-10)
            }
            
            // 延迟一点时间后自动重置到托盘扫描页面
            setTimeout(() => {
              this.resetPallet()
            }, 1500)
          } else if (this.scanResult.isCompleted) {
            this.$message.success('条码检查完成')
            this.showPopup = true
            this.popupType = 'ok'
            tone(lcywc)
          } else {
            this.$message.warning('流程尚未完成')
            this.showPopup = true
            this.popupType = 'ng'
            tone(lcyw)
          }
        } else {
          this.errorMessage = response.message || '查询失败'
          this.$message.error(this.errorMessage)
          this.showPopup = true
          this.popupType = 'ng'
          tone(tmyw)
        }
      } catch (error) {
        this.errorMessage = '系统错误，请重试'
        this.$message.error(this.errorMessage)
        this.showPopup = true
        this.popupType = 'ng'
        tone(tmyw)
        console.error('校验条码出错:', error)
      } finally {
        this.isLoading = false
        this.barcode = '' // 清空输入框
        this.focusInput() // 重新聚焦
      }
    },

    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
    },

    handleCurrentChange(val) {
      this.currentPage = val;
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
.pallet-barcode-container {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100%;
}

/* 添加左右布局容器样式 */
.layout-container {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.left-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.right-column {
  flex: 1;
  min-width: 0;
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
  margin: 0 auto;
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

.pallet-info-card {
  max-width: 800px;
  margin: 0 auto 16px;
}

.pallet-info-card /deep/ .el-descriptions-item {
  padding: 8px 12px;
}

.pallet-info-card /deep/ .el-progress {
  margin-top: 12px;
  margin-bottom: 8px;
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

.barcode-list-section {
  max-width: 1000px;
  margin: 16px auto;
}

.barcode-list-card {
  border-radius: 8px;
}

.barcode-list-card /deep/ .el-table {
  font-size: 13px;
}

.barcode-list-card /deep/ .el-table td, 
.barcode-list-card /deep/ .el-table th {
  padding: 6px 0;
}

.barcode-list-card /deep/ .el-card__header {
  padding: 12px 16px;
}

.barcode-list-card /deep/ .el-tag {
  height: 22px;
  line-height: 20px;
  padding: 0 6px;
}

.barcode-list-card /deep/ .el-table {
  max-height: 400px;
  overflow-y: auto;
}

.error-container {
  max-width: 800px;
  margin: 24px auto;
}

/* 调整响应式布局 */
@media (max-width: 1200px) {
  .layout-container {
    flex-direction: column;
  }
  
  .left-column, .right-column {
    width: 100%;
  }
  
  .barcode-list-card /deep/ .el-table {
    height: 500px !important;
  }
}

.pallet-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.info-item {
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  overflow: hidden;
}

.info-label {
  background-color: #F5F7FA;
  padding: 6px 10px;
  font-weight: 500;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
  font-size: 13px;
}

.info-value {
  padding: 6px 10px;
  color: #303133;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .pallet-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.completed-pallets-container {
  margin-bottom: 20px;
  text-align: left;
  background-color: #f0f9eb;
  border-radius: 4px;
  padding: 10px;
  border: 1px solid #e1f3d8;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.completed-pallets-header {
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
  margin-bottom: 8px;
}

.completed-pallets-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.completed-pallet-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}
</style> 