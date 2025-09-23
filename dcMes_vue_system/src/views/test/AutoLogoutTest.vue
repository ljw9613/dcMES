<!--
 * @name: 自动退出功能测试页面
 * @content: 用于测试15分钟无活动自动退出功能
 * @Author: AI Assistant
 * @Date: 2024-09-22
 -->
<template>
  <div class="auto-logout-test">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>自动退出功能测试</span>
      </div>
      
      <div class="test-info">
        <h3>功能说明</h3>
        <ul>
          <li>用户登录后，如果15分钟内没有任何操作，系统将自动退出</li>
          <li>在第14分钟时会显示警告提示</li>
          <li>任何鼠标移动、点击、键盘输入等操作都会重置计时器</li>
          <li>页面刷新时会检查上次活动时间，如果超时会立即退出</li>
          <li><strong>完全由前端控制会话过期，后端不再进行时间校验</strong></li>
          <li><strong>会话过期后前端将阻止所有API请求和页面跳转</strong></li>
        </ul>
      </div>
      
      <div class="test-controls">
        <h3>测试控制</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card>
              <h4>剩余时间</h4>
              <div class="time-display">
                {{ formatTime(remainingTime) }}
              </div>
              <el-progress 
                :percentage="progressPercentage" 
                :color="progressColor"
                :stroke-width="10"
              ></el-progress>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card>
              <h4>活动状态</h4>
              <div class="status-display">
                <el-tag :type="getActivityStatusType()">
                  {{ getActivityStatusText() }}
                </el-tag>
              </div>
              <div class="last-activity">
                最后活动: {{ lastActivityDisplay }}
              </div>
              <div v-if="isExpired" class="expired-notice">
                <el-alert
                  title="会话已过期"
                  type="warning"
                  description="任何操作都将触发重新登录弹窗"
                  show-icon
                  :closable="false"
                  class="expired-alert">
                </el-alert>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card>
              <h4>测试操作</h4>
              <div class="button-group">
                <el-button @click="extendSession" type="primary" size="small">
                  延长会话
                </el-button>
                <el-button @click="simulateInactivity" type="warning" size="small">
                  模拟超时
                </el-button>
                <el-button @click="simulateWarning" type="info" size="small">
                  模拟警告
                </el-button>
                <el-button @click="testPageRefresh" type="success" size="small">
                  测试刷新
                </el-button>
                <el-button @click="testTokenUpdate" type="primary" size="small">
                  测试Token更新
                </el-button>
                <el-button @click="testExpiredSession" type="warning" size="small">
                  测试过期状态
                </el-button>
                <el-button @click="testForceRelogin" type="danger" size="small">
                  测试强制重登
                </el-button>
                <el-button @click="manualLogout" type="danger" size="small">
                  手动退出
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 功能配置控制 -->
      <div class="config-control">
        <h3>功能配置控制</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card>
              <h4>监听控制</h4>
              <div class="button-group">
                <el-button 
                  :type="activityConfig.enabled ? 'danger' : 'success'" 
                  @click="toggleActivityMonitor"
                  size="small">
                  {{ activityConfig.enabled ? '禁用监听' : '启用监听' }}
                </el-button>
                <el-button @click="reloadConfig" type="info" size="small">
                  重新加载配置
                </el-button>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <h4>配置信息</h4>
              <div class="config-info">
                <p><strong>超时时间:</strong> {{ activityConfig.sessionTimeout / 1000 / 60 }} 分钟</p>
                <p><strong>警告时间:</strong> {{ activityConfig.warningTime / 1000 / 60 }} 分钟</p>
                <p><strong>监听事件:</strong> {{ activityConfig.monitorEvents.length }} 个</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <h4>拦截配置</h4>
              <div class="intercept-config">
                <p><strong>路由拦截:</strong> 
                  <el-tag :type="activityConfig.interceptRouting ? 'success' : 'danger'" size="mini">
                    {{ activityConfig.interceptRouting ? '开启' : '关闭' }}
                  </el-tag>
                </p>
                <p><strong>API拦截:</strong> 
                  <el-tag :type="activityConfig.interceptApiRequests ? 'success' : 'danger'" size="mini">
                    {{ activityConfig.interceptApiRequests ? '开启' : '关闭' }}
                  </el-tag>
                </p>
                <p><strong>页面加载检查:</strong> 
                  <el-tag :type="activityConfig.checkOnPageLoad ? 'success' : 'danger'" size="mini">
                    {{ activityConfig.checkOnPageLoad ? '开启' : '关闭' }}
                  </el-tag>
                </p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <h4>调试配置</h4>
              <div class="debug-config">
                <p><strong>调试模式:</strong> 
                  <el-tag :type="activityConfig.debug ? 'warning' : 'info'" size="mini">
                    {{ activityConfig.debug ? '开启' : '关闭' }}
                  </el-tag>
                </p>
                <p><strong>可见性监听:</strong> 
                  <el-tag :type="activityConfig.monitorVisibilityChange ? 'success' : 'danger'" size="mini">
                    {{ activityConfig.monitorVisibilityChange ? '开启' : '关闭' }}
                  </el-tag>
                </p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 系统状态监控 -->
      <div class="system-status">
        <h3>系统状态监控</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card>
              <div class="status-item">
                <span class="label">功能状态:</span>
                <el-tag :type="activityConfig.enabled ? 'success' : 'danger'">
                  {{ activityConfig.enabled ? '已启用' : '已禁用' }}
                </el-tag>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <div class="status-item">
                <span class="label">Token状态:</span>
                <el-tag :type="tokenStatus.type">{{ tokenStatus.text }}</el-tag>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <div class="status-item">
                <span class="label">监听事件:</span>
                <span class="value">{{ eventCount }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <div class="status-item">
                <span class="label">警告次数:</span>
                <span class="value">{{ warningCount }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <div class="status-item">
                <span class="label">会话延长:</span>
                <span class="value">{{ extensionCount }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 测试场景 -->
      <div class="test-scenarios">
        <h3>自动化测试场景</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <h4>快速测试 (缩短时间)</h4>
              <p>将15分钟缩短为30秒进行快速测试</p>
              <el-button @click="startQuickTest" :disabled="quickTestRunning" type="primary">
                {{ quickTestRunning ? '测试进行中...' : '开始快速测试' }}
              </el-button>
              <el-button @click="stopQuickTest" :disabled="!quickTestRunning" type="danger">
                停止测试
              </el-button>
              <div v-if="quickTestRunning" class="quick-test-progress">
                <el-progress :percentage="quickTestProgress" :stroke-width="8"></el-progress>
                <p>{{ quickTestStatus }}</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <h4>全局拦截测试</h4>
              <p>测试会话过期后的全局拦截功能</p>
              <el-button @click="testApiRequest" type="success">
                发送测试请求
              </el-button>
              <el-button @click="testRouteNavigation" type="warning">
                测试路由跳转
              </el-button>
              <el-button @click="testPageAccess" type="info">
                测试页面访问
              </el-button>
              <div class="api-test-result" v-if="apiTestResult">
                <p><strong>测试结果:</strong> {{ apiTestResult }}</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="activity-log">
        <h3>活动日志</h3>
        <div class="log-controls">
          <el-button @click="clearLog" size="small" type="warning">清空日志</el-button>
          <el-button @click="exportLog" size="small" type="success">导出日志</el-button>
          <el-switch v-model="autoScroll" active-text="自动滚动"></el-switch>
        </div>
        <el-table :data="activityLog" height="300" style="width: 100%" ref="logTable">
          <el-table-column prop="time" label="时间" width="180">
            <template slot-scope="scope">
              {{ formatDateTime(scope.row.time) }}
            </template>
          </el-table-column>
          <el-table-column prop="event" label="事件" width="150">
            <template slot-scope="scope">
              <el-tag :type="getEventType(scope.row.event)" size="small">
                {{ scope.row.event }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述"></el-table-column>
          <el-table-column prop="details" label="详细信息" width="200">
            <template slot-scope="scope">
              <span v-if="scope.row.details">{{ scope.row.details }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
import userActivityMonitor from '@/utils/userActivity'
import { getInfo } from '@/api/user'
import { getActivityConfig, updateActivityConfig, enableActivityMonitor, disableActivityMonitor } from '@/config/activityConfig'

export default {
  name: 'AutoLogoutTest',
  data() {
    return {
      remainingTime: 0,
      isActive: false,
      isExpired: false,
      lastActivity: Date.now(),
      activityLog: [],
      timer: null,
      // 新增状态监控
      eventCount: 0,
      warningCount: 0,
      extensionCount: 0,
      autoScroll: true,
      // 快速测试相关
      quickTestRunning: false,
      quickTestProgress: 0,
      quickTestStatus: '',
      quickTestTimer: null,
      // API测试相关
      apiTestResult: '',
      // 配置相关
      activityConfig: getActivityConfig()
    }
  },
  
  computed: {
    progressPercentage() {
      const totalTime = 15 * 60 * 1000 // 15分钟
      return Math.max(0, (this.remainingTime / totalTime) * 100)
    },
    
    progressColor() {
      if (this.progressPercentage > 50) return '#67C23A'
      if (this.progressPercentage > 20) return '#E6A23C'
      return '#F56C6C'
    },
    
    lastActivityDisplay() {
      const diff = Date.now() - this.lastActivity
      if (diff < 1000) return '刚刚'
      if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`
      return `${Math.floor(diff / 60000)}分钟前`
    },
    
    tokenStatus() {
      const token = this.$store.getters.token
      if (!token) {
        return { type: 'danger', text: '无Token' }
      }
      
      try {
        // 简单检查token格式
        const parts = token.split('.')
        if (parts.length !== 3) {
          return { type: 'warning', text: '格式错误' }
        }
        return { type: 'success', text: '正常' }
      } catch (error) {
        return { type: 'danger', text: '解析失败' }
      }
    }
  },
  
  mounted() {
    this.addLog('页面加载', '自动退出测试页面已加载')
    this.startMonitoring()
  },
  
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  
  methods: {
    startMonitoring() {
      this.isActive = userActivityMonitor.isActive
      this.updateRemainingTime()
      
      // 每秒更新一次显示
      this.timer = setInterval(() => {
        this.updateRemainingTime()
        this.isActive = userActivityMonitor.isActive
      }, 1000)
      
      this.addLog('开始监听', '用户活动监听已启动')
    },
    
    updateRemainingTime() {
      this.remainingTime = userActivityMonitor.getRemainingTime()
      this.isExpired = userActivityMonitor.isExpired
      
      // 更新最后活动时间
      const lastActivityTime = localStorage.getItem('lastActivityTime')
      if (lastActivityTime) {
        this.lastActivity = parseInt(lastActivityTime)
      }
    },
    
    extendSession() {
      userActivityMonitor.extendSession()
      this.extensionCount++
      this.addLog('延长会话', '用户手动延长了会话时间', `延长次数: ${this.extensionCount}`)
      this.$message.success('会话已延长')
    },
    
    simulateInactivity() {
      // 将最后活动时间设置为16分钟前
      const sixteenMinutesAgo = Date.now() - (16 * 60 * 1000)
      localStorage.setItem('lastActivityTime', sixteenMinutesAgo.toString())
      
      this.addLog('模拟超时', '模拟用户16分钟无活动')
      this.$message.warning('已模拟超时状态，刷新页面或发起请求将触发自动退出')
    },
    
    manualLogout() {
      this.$confirm('确定要手动退出吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.addLog('手动退出', '用户手动触发退出')
        this.$store.dispatch('user/logout').then(() => {
          this.$router.push('/login')
        })
      })
    },
    
    // 新增测试方法
    simulateWarning() {
      // 将最后活动时间设置为14分钟前，触发警告
      const fourteenMinutesAgo = Date.now() - (14 * 60 * 1000)
      localStorage.setItem('lastActivityTime', fourteenMinutesAgo.toString())
      this.warningCount++
      this.addLog('模拟警告', '模拟用户14分钟无活动，应显示警告', `警告次数: ${this.warningCount}`)
      this.$message.warning('已模拟警告状态，1分钟后将自动退出')
    },
    
    testPageRefresh() {
      this.addLog('测试刷新', '即将刷新页面测试超时检查')
      this.$message.info('页面将在3秒后刷新，测试超时检查功能')
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    },
    
    testTokenUpdate() {
      this.addLog('Token更新测试', '发送请求测试token自动更新')
      this.testApiRequest()
    },
    
    testExpiredSession() {
      // 直接标记会话为过期状态
      userActivityMonitor.isExpired = true
      userActivityMonitor.markExpired()
      this.addLog('过期测试', '手动标记会话为过期状态')
      this.$message.warning('会话已标记为过期，任何操作都将触发重新登录弹窗')
    },
    
    testForceRelogin() {
      // 模拟强制重新登录弹窗
      userActivityMonitor.showForceReloginDialog()
      this.addLog('强制重登测试', '手动触发强制重新登录弹窗')
    },
    
    testRouteNavigation() {
      if (!userActivityMonitor.isExpired) {
        this.$message.warning('请先使用"测试过期状态"按钮标记会话为过期')
        return
      }
      
      this.addLog('路由拦截测试', '尝试跳转到其他页面')
      
      // 尝试跳转到首页
      this.$router.push('/').catch(err => {
        this.apiTestResult = '路由跳转被拦截: ' + err.message
        this.addLog('路由拦截测试', '路由跳转被成功拦截', err.message)
      })
    },
    
    testPageAccess() {
      if (!userActivityMonitor.isExpired) {
        this.$message.warning('请先使用"测试过期状态"按钮标记会话为过期')
        return
      }
      
      this.addLog('页面访问测试', '尝试在新标签页中打开其他页面')
      
      // 尝试在新标签页中打开首页
      const newTab = window.open('/', '_blank')
      if (newTab) {
        this.apiTestResult = '新标签页已打开，应该被路由守卫拦截'
        this.addLog('页面访问测试', '新标签页已打开', '会话过期状态下新页面应被拦截')
        
        // 3秒后检查标签页状态
        setTimeout(() => {
          try {
            if (newTab.closed) {
              this.addLog('页面访问测试', '新标签页已自动关闭')
            } else {
              this.addLog('页面访问测试', '新标签页仍在运行，请手动检查是否被拦截')
            }
          } catch (error) {
            this.addLog('页面访问测试', '无法检查新标签页状态（跨域限制）')
          }
        }, 3000)
      } else {
        this.apiTestResult = '无法打开新标签页（可能被浏览器阻止）'
        this.addLog('页面访问测试', '无法打开新标签页')
      }
    },
    
    async testApiRequest() {
      try {
        this.apiTestResult = '请求中...'
        this.addLog('API测试', '发送用户信息请求')
        
        const response = await getInfo({ id: this.$store.getters.id })
        
        this.apiTestResult = `成功 - ${response.code}`
        this.addLog('API测试', 'API请求成功', `响应码: ${response.code}`)
        this.$message.success('API请求成功，检查是否有新token')
        
      } catch (error) {
        this.apiTestResult = `失败 - ${error.message}`
        this.addLog('API测试', 'API请求失败', error.message)
        this.$message.error('API请求失败: ' + error.message)
      }
    },
    
    async testMultipleRequests() {
      this.addLog('批量测试', '开始连续API请求测试')
      
      for (let i = 1; i <= 5; i++) {
        try {
          this.apiTestResult = `请求 ${i}/5...`
          await getInfo({ id: this.$store.getters.id })
          this.addLog('批量测试', `第${i}个请求成功`)
          
          // 每次请求间隔1秒
          if (i < 5) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (error) {
          this.addLog('批量测试', `第${i}个请求失败`, error.message)
          break
        }
      }
      
      this.apiTestResult = '批量测试完成'
      this.$message.success('批量API测试完成')
    },
    
    startQuickTest() {
      this.quickTestRunning = true
      this.quickTestProgress = 0
      this.quickTestStatus = '开始快速测试...'
      
      // 临时修改超时时间为30秒
      const originalTimeout = userActivityMonitor.timeout
      const originalWarningTime = userActivityMonitor.warningTime
      
      userActivityMonitor.timeout = 30 * 1000 // 30秒
      userActivityMonitor.warningTime = 25 * 1000 // 25秒警告
      
      this.addLog('快速测试', '开始30秒快速测试', '超时时间已调整为30秒')
      
      let elapsed = 0
      this.quickTestTimer = setInterval(() => {
        elapsed += 1000
        this.quickTestProgress = (elapsed / 30000) * 100
        
        if (elapsed <= 25000) {
          this.quickTestStatus = `等待中... ${Math.ceil((25000 - elapsed) / 1000)}秒后显示警告`
        } else if (elapsed <= 30000) {
          this.quickTestStatus = `警告阶段... ${Math.ceil((30000 - elapsed) / 1000)}秒后自动退出`
        } else {
          this.quickTestStatus = '测试完成或已自动退出'
          this.stopQuickTest()
          
          // 恢复原始超时时间
          userActivityMonitor.timeout = originalTimeout
          userActivityMonitor.warningTime = originalWarningTime
        }
      }, 1000)
      
      // 30秒后自动停止测试
      setTimeout(() => {
        this.stopQuickTest()
        userActivityMonitor.timeout = originalTimeout
        userActivityMonitor.warningTime = originalWarningTime
        this.addLog('快速测试', '快速测试完成', '超时时间已恢复为15分钟')
      }, 31000)
    },
    
    stopQuickTest() {
      this.quickTestRunning = false
      if (this.quickTestTimer) {
        clearInterval(this.quickTestTimer)
        this.quickTestTimer = null
      }
      this.addLog('快速测试', '快速测试已停止')
    },
    
    clearLog() {
      this.activityLog = []
      this.eventCount = 0
      this.warningCount = 0
      this.extensionCount = 0
      this.$message.success('日志已清空')
    },
    
    exportLog() {
      const logData = this.activityLog.map(log => ({
        时间: this.formatDateTime(log.time),
        事件: log.event,
        描述: log.description,
        详细信息: log.details || ''
      }))
      
      const csvContent = this.convertToCSV(logData)
      this.downloadCSV(csvContent, `自动退出测试日志_${new Date().toISOString().slice(0, 10)}.csv`)
      this.$message.success('日志已导出')
    },
    
    convertToCSV(data) {
      if (!data.length) return ''
      
      const headers = Object.keys(data[0])
      const csvRows = [headers.join(',')]
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || ''
          return `"${value.toString().replace(/"/g, '""')}"`
        })
        csvRows.push(values.join(','))
      })
      
      return csvRows.join('\n')
    },
    
    downloadCSV(content, filename) {
      const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    },
    
    getEventType(event) {
      const eventTypes = {
        '页面加载': 'info',
        '开始监听': 'success',
        '延长会话': 'primary',
        '模拟超时': 'warning',
        '模拟警告': 'warning',
        '手动退出': 'danger',
        'API测试': 'success',
        '批量测试': 'info',
        '快速测试': 'primary'
      }
      return eventTypes[event] || 'info'
    },
    
    getActivityStatusType() {
      if (this.isExpired) return 'danger'
      if (this.isActive) return 'success'
      return 'warning'
    },
    
    getActivityStatusText() {
      if (this.isExpired) return '会话已过期'
      if (this.isActive) return '监听中'
      return '已停止'
    },
    
    addLog(event, description, details = '') {
      this.eventCount++
      this.activityLog.unshift({
        time: Date.now(),
        event,
        description,
        details
      })
      
      // 只保留最近100条记录
      if (this.activityLog.length > 100) {
        this.activityLog = this.activityLog.slice(0, 100)
      }
      
      // 自动滚动到顶部
      if (this.autoScroll) {
        this.$nextTick(() => {
          if (this.$refs.logTable) {
            this.$refs.logTable.setScrollTop(0)
          }
        })
      }
    },
    
    formatTime(ms) {
      if (ms <= 0) return '00:00'
      
      const minutes = Math.floor(ms / 60000)
      const seconds = Math.floor((ms % 60000) / 1000)
      
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },
    
    formatDateTime(timestamp) {
      return new Date(timestamp).toLocaleString()
    },
    
    // 配置相关方法
    toggleActivityMonitor() {
      if (this.activityConfig.enabled) {
        disableActivityMonitor()
        userActivityMonitor.stop()
        this.addLog('禁用监听', '用户手动禁用了活动监听功能')
        this.$message.warning('活动监听功能已禁用')
      } else {
        enableActivityMonitor()
        const started = userActivityMonitor.start()
        if (started) {
          this.addLog('启用监听', '用户手动启用了活动监听功能')
          this.$message.success('活动监听功能已启用')
        } else {
          this.$message.error('启用活动监听功能失败')
        }
      }
      this.reloadConfig()
    },
    
    reloadConfig() {
      this.activityConfig = getActivityConfig()
      userActivityMonitor.loadConfig()
      this.addLog('重新加载配置', '配置已从文件重新加载')
      this.$message.info('配置已重新加载')
    }
  }
}
</script>

<style scoped>
.auto-logout-test {
  padding: 20px;
}

.test-info {
  margin-bottom: 30px;
}

.test-info ul {
  list-style-type: disc;
  padding-left: 20px;
}

.test-info li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.test-controls {
  margin-bottom: 30px;
}

.time-display {
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  margin: 20px 0;
  color: #409EFF;
}

.status-display {
  text-align: center;
  margin: 20px 0;
}

.last-activity {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-top: 10px;
}

.activity-log {
  margin-top: 30px;
}

.el-card {
  margin-bottom: 20px;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}

.clearfix:after {
  clear: both;
}

/* 新增样式 */
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.button-group .el-button {
  margin: 0;
}

.config-control {
  margin-bottom: 30px;
}

.config-info p, .intercept-config p, .debug-config p {
  margin: 8px 0;
  font-size: 14px;
}

.config-info strong, .intercept-config strong, .debug-config strong {
  color: #333;
}

.system-status {
  margin-bottom: 30px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.status-item .label {
  font-weight: bold;
  color: #606266;
}

.status-item .value {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}

.test-scenarios {
  margin-bottom: 30px;
}

.quick-test-progress {
  margin-top: 15px;
}

.quick-test-progress p {
  margin: 10px 0 0 0;
  text-align: center;
  color: #606266;
}

.api-test-result {
  margin-top: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409EFF;
}

.log-controls {
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-controls .el-button {
  margin-right: 10px;
}

.expired-notice {
  margin-top: 15px;
}

.expired-alert {
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
  }
  
  .button-group .el-button {
    width: 100%;
  }
  
  .log-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
