<template>
  <div class="pallet-barcode-container">
    <div class="scan-header">
      <h2>{{ $t('palletBarcodeVerification.title') }}</h2>
    </div>

    <!-- 托盘单据输入区域 -->
    <div class="scan-input-area" v-if="!palletLoaded">
      <!-- 已完成托盘记录 -->
      <div v-if="completedPallets.length > 0" class="completed-pallets-container">
        <div class="completed-pallets-header">{{ $t('palletBarcodeVerification.completedPallets.title') }}</div>
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

      <div class="operation-buttons" >
        <el-button
          type="text"
          size="small"
          @click="handlePalletInput">
          <i class="el-icon-document"></i>{{ $t('palletBarcodeVerification.palletInput.inputPrompt') }}
        </el-button>
      </div>

      <div class="input-wrapper">
        <el-input ref="palletInput" v-model="palletCode" :placeholder="$t('palletBarcodeVerification.palletInput.placeholder')" class="barcode-input"
          @keyup.enter.native="handlePalletCodeInput" @focus="handleFocus">
          <i slot="prefix" class="el-icon-document"></i>
          <el-button slot="suffix" type="primary" @click="handlePalletCodeInput">{{ $t('palletBarcodeVerification.palletInput.loadPallet') }}</el-button>
        </el-input>
      </div>
      <div class="scan-tip">{{ $t('palletBarcodeVerification.palletInput.scanTip') }}</div>
    </div>

    <!-- 托盘信息和条码输入区域 -->
    <div v-if="palletLoaded && !isLoading" class="layout-container">
      <div class="left-column">
        <el-card class="pallet-info-card">
          <div slot="header" class="clearfix">
            <span>{{ $t('palletBarcodeVerification.palletInfo.title') }}</span>
            <el-button style="float: right" type="text" @click="resetPallet">{{ $t('palletBarcodeVerification.palletInfo.changePallet') }}</el-button>
          </div>
          <div class="pallet-info-grid">
            <div class="info-item">
              <div class="info-label">{{ $t('palletBarcodeVerification.palletInfo.palletCode') }}</div>
              <div class="info-value">{{ palletInfo.palletCode }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('palletBarcodeVerification.palletInfo.materialInfo') }}</div>
              <div class="info-value">{{ palletInfo.materialName }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('palletBarcodeVerification.palletInfo.totalBarcodes') }}</div>
              <div class="info-value">{{ palletInfo.totalBarcodes }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('palletBarcodeVerification.palletInfo.verifiedBarcodes') }}</div>
              <div class="info-value">{{ palletInfo.verifiedBarcodes }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('palletBarcodeVerification.palletInfo.remainingBarcodes') }}</div>
              <div class="info-value">{{ palletInfo.remainingBarcodes }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('palletBarcodeVerification.palletInfo.palletStatus') }}</div>
              <div class="info-value">
                <el-tag :type="palletInfo.status === 'STACKED' ? 'success' : 'warning'">
                  {{ palletInfo.status === 'STACKED' ? $t('palletBarcodeVerification.palletInfo.statusStacked') : $t('palletBarcodeVerification.palletInfo.statusStacking') }}
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
            <el-input ref="barcodeInput" v-model="barcode" :placeholder="$t('palletBarcodeVerification.barcodeInput.placeholder')" class="barcode-input"
              @keyup.enter.native="verifyBarcode" @focus="handleFocus">
              <i slot="prefix" class="el-icon-search"></i>
              <el-button slot="suffix" type="primary" @click="verifyBarcode">{{ $t('palletBarcodeVerification.barcodeInput.verify') }}</el-button>
            </el-input>
          </div>
          <div class="scan-tip">{{ $t('palletBarcodeVerification.barcodeInput.scanTip') }}</div>
        </div>

        <!-- 条码校验结果 -->
        <div v-if="scanResult" class="result-container">
          <div class="result-header">
            <div class="status-badge" :class="getBadgeClass">
              <i :class="scanResult.isCompleted ? 'el-icon-success' : 'el-icon-warning'" class="status-icon"></i>
              <span>{{ scanResult.status === 'COMPLETED' ? $t('palletBarcodeVerification.verificationResult.processCompleted') : $t('palletBarcodeVerification.verificationResult.processIncomplete') }}</span>
            </div>
          </div>

          <el-card class="result-card" shadow="hover">
            <div class="info-section">
              <el-descriptions :title="$t('palletBarcodeVerification.verificationResult.barcodeInfo')" :column="1" border>
                <el-descriptions-item :label="$t('palletBarcodeVerification.verificationResult.barcode')">
                  {{ scanResult.barcode }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('palletBarcodeVerification.verificationResult.materialCode')">
                  {{ scanResult.materialCode }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('palletBarcodeVerification.verificationResult.materialName')">
                  {{ scanResult.materialName }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('palletBarcodeVerification.verificationResult.status')">
                  <el-tag :type="scanResult.status === 'COMPLETED' ? 'success' : 'warning'">
                    {{ scanResult.status === 'COMPLETED' ? $t('palletBarcodeVerification.verificationResult.completed') : $t('palletBarcodeVerification.verificationResult.incomplete') }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('palletBarcodeVerification.verificationResult.progress')">
                  <el-progress :percentage="scanResult.progress"
                    :status="scanResult.status === 'COMPLETED' ? 'success' : ''"></el-progress>
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="node-statistics">
              <div class="statistic-item">
                <div class="statistic-title">{{ $t('palletBarcodeVerification.verificationResult.nodeStatistics.totalNodes') }}</div>
                <div class="statistic-value">{{ scanResult.totalNodes }}</div>
              </div>
              <div class="statistic-item">
                <div class="statistic-title">{{ $t('palletBarcodeVerification.verificationResult.nodeStatistics.completedNodes') }}</div>
                <div class="statistic-value success">{{ scanResult.completedNodes }}</div>
              </div>
              <div class="statistic-item">
                <div class="statistic-title">{{ $t('palletBarcodeVerification.verificationResult.nodeStatistics.pendingNodes') }}</div>
                <div class="statistic-value" :class="{ warning: scanResult.pendingNodes > 0 }">
                  {{ scanResult.pendingNodes }}
                </div>
              </div>
            </div>

            <div v-if="scanResult.pendingNodes > 0 && scanResult.pendingNodesList.length > 0" class="pending-nodes-section">
              <h3>{{ $t('palletBarcodeVerification.verificationResult.pendingNodesList.title') }}</h3>
              <el-table :data="scanResult.pendingNodesList" style="width: 100%" size="medium" :row-key="getRowKey">
                <el-table-column prop="nodeName" :label="$t('palletBarcodeVerification.verificationResult.pendingNodesList.nodeName')"></el-table-column>
                <el-table-column prop="nodeType" :label="$t('palletBarcodeVerification.verificationResult.pendingNodesList.nodeType')">
                  <template slot-scope="scope">
                    {{ getNodeTypeText(scope.row.nodeType) }}
                  </template>
                </el-table-column>
                <el-table-column prop="status" :label="$t('palletBarcodeVerification.verificationResult.pendingNodesList.status')">
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
              <span>{{ $t('palletBarcodeVerification.barcodeList.title') }}</span>
              <div style="float: right; display: flex; align-items: center;">
                <el-radio-group v-model="barcodeFilter" size="small" style="margin-right: 15px;">
                  <el-radio-button label="all">{{ $t('palletBarcodeVerification.barcodeList.allBarcodes') }}</el-radio-button>
                  <el-radio-button label="unverified">{{ $t('palletBarcodeVerification.barcodeList.unverifiedBarcodes') }}</el-radio-button>
                </el-radio-group>
                <span style="color: #909399; font-size: 13px;">
                  {{ $t('palletBarcodeVerification.barcodeList.totalCount', { count: filteredBarcodes.length }) }}
                </span>
              </div>
            </div>
            <el-table
              :data="paginatedBarcodes"
              style="width: 100%"
              size="small"
              :row-key="row => row.barcode"
              height="calc(100vh - 200px)">
              <el-table-column prop="barcode" :label="$t('palletBarcodeVerification.barcodeList.barcode')" width="180"></el-table-column>
              <el-table-column :label="$t('palletBarcodeVerification.barcodeList.verificationStatus')" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.verified ? 'success' : 'info'" size="mini">
                    {{ scope.row.verified ? $t('palletBarcodeVerification.barcodeList.verified') : $t('palletBarcodeVerification.barcodeList.unverified') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('palletBarcodeVerification.barcodeList.processStatus')" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.verified" :type="getStatusType(scope.row.status)" size="mini">
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('palletBarcodeVerification.barcodeList.scanTime')" min-width="150">
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
import { playAudio, preloadAudioFiles } from "@/utils/audioI18n.js";

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
          'PENDING': this.$t('palletBarcodeVerification.status.pending'),
          'IN_PROGRESS': this.$t('palletBarcodeVerification.status.inProgress'),
          'COMPLETED': this.$t('palletBarcodeVerification.status.completed'),
          'SKIPPED': this.$t('palletBarcodeVerification.status.skipped'),
          'ERROR': this.$t('palletBarcodeVerification.status.error')
        }
        return statusMap[status] || status
      }
      if (!this.scanResult) return ''
      return this.scanResult.isCompleted ? this.$t('palletBarcodeVerification.status.processCompleted') : this.$t('palletBarcodeVerification.status.processIncomplete')
    },

    // 获取节点类型文本
    getNodeTypeText(type) {
      const typeMap = {
        'PROCESS_STEP': this.$t('palletBarcodeVerification.nodeType.processStep'),
        'MATERIAL': this.$t('palletBarcodeVerification.nodeType.material')
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
      if (!date) return this.$t('palletBarcodeVerification.messages.noData');
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return this.$t('palletBarcodeVerification.messages.invalidDate');
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
        this.$message.warning(this.$t('palletBarcodeVerification.messages.enterPalletCode'))
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
        this.$message.warning(this.$t('palletBarcodeVerification.messages.enterPalletCode'))
        return
      }

      this.errorMessage = ''
      this.isLoading = true
      this.loadingText = this.$t('palletBarcodeVerification.messages.loadingPalletData')

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
            materialName: palletData.materialName || this.$t('palletBarcodeVerification.messages.unknownMaterial'),
            materialCode: palletData.materialCode || '',
            status: palletData.status || 'STACKING',
            totalBarcodes: allBarcodes.length,
            verifiedBarcodes: 0,
            remainingBarcodes: allBarcodes.length,
            barcodes: allBarcodes
          }

          this.palletLoaded = true
          this.$message.success(this.$t('palletBarcodeVerification.messages.palletDataLoadSuccess'))
          this.showPopup = true
          this.popupType = 'ok'
          playAudio('lcywc')
        } else {
          this.errorMessage = this.$t('palletBarcodeVerification.messages.palletDataNotFound')
          this.$message.error(this.errorMessage)
          this.showPopup = true
          this.popupType = 'ng'
          playAudio('tmyw')
        }
      } catch (error) {
        this.errorMessage = this.$t('palletBarcodeVerification.messages.systemError')
        this.$message.error(this.errorMessage)
        this.showPopup = true
        this.popupType = 'ng'
        playAudio('tmyw')
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
        this.$message.warning(this.$t('palletBarcodeVerification.messages.enterBarcode'))
        return
      }

      if (this.barcode.includes("DCZZ-")) {
        const diyCodeResponse = await getData("material_process_flow", {
          query: {
            diyCode: this.barcode,
          },
        });
        if (diyCodeResponse.data && diyCodeResponse.data.length > 0) {
          this.barcode = diyCodeResponse.data[0].barcode;
        }
      }

      //是否为升级条码

      const preProductionResponse = await getData("preProductionBarcode", {
        query: {
          transformedPrintBarcode: this.barcode,
        },
      });
      if (preProductionResponse.data && preProductionResponse.data.length > 0) {
        console.log("升级条码:", preProductionResponse.data[0]);
        this.barcode = preProductionResponse.data[0].printBarcode;
      }

      // 在前端校验条码是否在托盘中
      const barcodeInPallet = this.palletInfo.barcodes.find(item => item.barcode === this.barcode)

      if (!barcodeInPallet) {
        this.errorMessage = this.$t('palletBarcodeVerification.messages.barcodeNotInPallet')
        this.$message.error(this.errorMessage)
        this.showPopup = true
        this.popupType = 'ng'
        playAudio('tmyw')
        this.barcode = '' // 清空输入框
        this.focusInput() // 重新聚焦
        return
      }

      this.errorMessage = ''
      this.isLoading = true
      this.loadingText = this.$t('palletBarcodeVerification.messages.verifyingBarcode')
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
            this.$message.success(this.$t('palletBarcodeVerification.messages.allBarcodesVerified'))
            this.showPopup = true
            this.popupType = 'ok'
            playAudio('lcywc')

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
            this.$message.success(this.$t('palletBarcodeVerification.messages.barcodeCheckComplete'))
            this.showPopup = true
            this.popupType = 'ok'
            playAudio('lcywc')
          } else {
            this.$message.warning(this.$t('palletBarcodeVerification.messages.processNotComplete'))
            this.showPopup = true
            this.popupType = 'ng'
            playAudio('lcyw')
          }
        } else {
          this.errorMessage = response.message || this.$t('palletBarcodeVerification.messages.queryFailed')
          this.$message.error(this.errorMessage)
          this.showPopup = true
          this.popupType = 'ng'
          playAudio('tmyw')
        }
      } catch (error) {
        this.errorMessage = this.$t('palletBarcodeVerification.messages.systemError')
        this.$message.error(this.errorMessage)
        this.showPopup = true
        this.popupType = 'ng'
        playAudio('tmyw')
        console.error('校验条码出错:', error)
      } finally {
        this.isLoading = false
        this.barcode = '' // 清空输入框
        this.focusInput() // 重新聚焦
      }
    },

    // 托盘校验按钮点击处理
    handlePalletInput() {
      this.$message({
        type: 'info',
        message: this.$t('palletBarcodeVerification.messages.inputPalletPrompt'),
        duration: 3000
      })

      // 聚焦到托盘输入框
      this.focusInput()
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

.operation-buttons {
  margin-bottom: 15px;
  text-align: center;
}

.operation-buttons .el-button {
  color: #409EFF;
  font-size: 14px;
  padding: 8px 15px;
}

.operation-buttons .el-button i {
  margin-right: 5px;
  font-size: 16px;
}
</style>
