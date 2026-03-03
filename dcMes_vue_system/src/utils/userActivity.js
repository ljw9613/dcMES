/*
 * @name: 用户活动监听工具
 * @content: 监听用户活动，15分钟无活动自动退出
 * @Author: AI Assistant
 * @Date: 2024-09-22
 */

import store from '@/store'
import { clearAllAuthAndCache } from '@/utils/auth'
import { resetRouter } from '@/router'
import router from '@/router'
import { Message } from 'element-ui'
import activityConfig, { getActivityConfig, isActivityMonitorEnabled } from '@/config/activityConfig'

const SESSION_EXPIRED_KEY = 'activity_session_expired'

class UserActivityMonitor {
  constructor() {
    // 从配置文件获取设置
    this.loadConfig()
    
    this.timer = null
    this.warningTimer = null
    this.isActive = false
    this.warningShown = false
    this.isExpired = false // 新增：是否已过期标志
    this.forceReloginShown = false // 新增：是否已显示强制重新登录弹窗
    this.isFromUserActivity = false // 新增：标记是否来自用户活动的重置
    this.shouldShowWarningImmediately = false // 新增：是否需要立即显示警告
    
    // 调试用：事件计数器
    this.eventCounters = {}
    this.lastEventTime = 0
    this.eventCountTotal = 0
    
    // 绑定this上下文
    this.resetTimer = this.resetTimer.bind(this)
    this.logout = this.logout.bind(this)
    this.showWarning = this.showWarning.bind(this)
    this.navigateToLogin = this.navigateToLogin.bind(this)
  }

  /** 仅 debug 模式下输出到控制台 */
  _log(...args) {
    if (this.config && this.config.debug) console.log(...args)
  }
  _warn(...args) {
    if (this.config && this.config.debug) console.warn(...args)
  }
  _error(...args) {
    if (this.config && this.config.debug) console.error(...args)
  }
  _trace(...args) {
    if (this.config && this.config.debug) console.trace(...args)
  }

  /**
   * 安全导航到登录页面 - 兼容publicPath配置
   */
  navigateToLogin() {
    try {
      // 优先使用Vue Router进行导航，自动处理publicPath
      router.go(0).catch(err => {
        this._warn('🔄 [活动监听] Vue Router导航失败，使用window.location.reload刷新:', err)
        // 如果路由导航失败，回退到直接刷新
        window.location.reload()
      })
    } catch (error) {
      this._error('🔄 [活动监听] 导航过程中发生错误，使用window.location.reload刷新:', error)
      // 如果出现任何错误，确保仍能刷新当前页面
      window.location.reload()
    }
  }

  /**
   * 从配置文件加载设置
   */
  loadConfig() {
    const config = getActivityConfig()
    this.timeout = config.sessionTimeout
    this.warningTime = config.warningTime
    this.events = [...config.monitorEvents]
    this.config = config
    
    if (config.debug) {
      console.log('用户活动监听配置已加载:', config)
    }
  }

  /**
   * 开始监听用户活动
   */
  start() {
    // 检查是否启用活动监听
    if (!isActivityMonitorEnabled()) {
      this._log('🚫 [活动监听] 功能已禁用，跳过启动')
      return false
    }

    // 刷新后防绕过：若本地已标记会话过期，不再启动计时器并直接弹出强制登录
    if (localStorage.getItem(SESSION_EXPIRED_KEY)) {
      this._log('🔒 [活动监听] 检测到已过期标记，跳过启动并强制重新登录')
      this.isExpired = true
      this.showForceReloginDialog()
      return false
    }

    // 重新加载配置（支持运行时配置变更）
    this.loadConfig()
    
    this._log(`✅ [活动监听] 长期未活动校验已开启`)
    this._log(`⏰ [活动监听] 会话超时时间: ${this.timeout / 1000 / 60} 分钟`)
    this._log(`⚠️ [活动监听] 警告时间: ${this.warningTime / 1000 / 60} 分钟`)
    this._log(`📋 [活动监听] 监听事件: ${this.events.join(', ')}`)
    this._log(`🎯 [活动监听] 拦截配置 - 路由: ${this.config.interceptRouting ? '开启' : '关闭'}, API: ${this.config.interceptApiRequests ? '开启' : '关闭'}`)
    
    this.isActive = true
    this.warningShown = false
    this.isExpired = false
    this.forceReloginShown = false
    
    // 绑定事件监听器（使用包装函数跟踪事件）
    this.events.forEach(event => {
      const wrappedHandler = (e) => this.handleEvent(e, event)
      document.addEventListener(event, wrappedHandler, true)
      
      // 保存包装的处理器以便后续移除
      if (!this.eventHandlers) this.eventHandlers = new Map()
      this.eventHandlers.set(event, wrappedHandler)
    })
    
    // 监听页面可见性变化（如果启用）
    if (this.config.monitorVisibilityChange) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    }
    
    // 启动计时器
    this.resetTimer()
    return true
  }

  /**
   * 停止监听用户活动
   */
  stop() {
    this._log('🛑 [活动监听] 停止监听用户活动')
    this.isActive = false
    this.warningShown = false
    this.isExpired = false
    this.forceReloginShown = false
    
    // 移除事件监听器
    if (this.eventHandlers) {
      this.eventHandlers.forEach((handler, event) => {
        document.removeEventListener(event, handler, true)
      })
      this.eventHandlers.clear()
    } else {
      // 兼容旧版本的移除方式
      this.events.forEach(event => {
        document.removeEventListener(event, this.resetTimer, true)
      })
    }
    
    // 移除页面可见性监听
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    
    // 清除计时器
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer)
      this.warningTimer = null
    }
  }

  /**
   * 处理用户活动事件（带统计）
   */
  handleEvent(event, eventType) {
    const now = Date.now()
    
    // 统计事件
    if (!this.eventCounters[eventType]) {
      this.eventCounters[eventType] = 0
    }
    this.eventCounters[eventType]++
    this.eventCountTotal++
    
    // 检查事件频率
    const timeSinceLastEvent = now - this.lastEventTime
    if (timeSinceLastEvent < 100) { // 100ms内的连续事件
      this._warn(`⚡ [活动监听] 高频事件检测: ${eventType} (${timeSinceLastEvent}ms间隔)`)
    }
    
    // 每100个事件输出一次统计
    if (this.eventCountTotal % 100 === 0) {
      this._log(`📊 [活动监听] 事件统计 (总计${this.eventCountTotal}个):`, this.eventCounters)
    }
    
    this.lastEventTime = now
    
    // 标记这是来自用户活动的重置
    this.isFromUserActivity = true
    
    // 调用实际的重置计时器逻辑
    this.resetTimer()
  }

  /**
   * 重置计时器
   */
  resetTimer() {
    if (!this.isActive) return
    
    // 检查功能是否启用
    if (!isActivityMonitorEnabled()) {
      this._log('🚫 [活动监听] 功能已禁用，跳过计时器重置')
      return
    }
    
    // 如果已经过期，显示强制重新登录弹窗而不是重置计时器
    if (this.isExpired) {
      this._log('🔒 [活动监听] 会话已过期，用户活动触发重新登录弹窗')
      this.showForceReloginDialog()
      return
    }
    
    const now = Date.now()
    const currentTime = new Date(now).toLocaleString()
    const lastActivityTime = localStorage.getItem('lastActivityTime')
    const timeSinceLastReset = lastActivityTime ? now - parseInt(lastActivityTime) : 0
    
    this._log(`🔄 [活动监听] 用户活动检测到，重置计时器 - 时间: ${currentTime}`)
    this._log(`📊 [活动监听] 距离上次重置: ${Math.round(timeSinceLastReset / 1000)} 秒`)
    this._log(`🔧 [活动监听] 当前配置 - 超时: ${this.timeout / 1000}秒, 警告: ${this.warningTime / 1000}秒`)
    this._log(`🔍 [活动监听] 过期状态: ${this.isExpired ? '已过期' : '未过期'}`)
    this._log(`🔍 [活动监听] 监听状态: ${this.isActive ? '激活' : '未激活'}`)
    
    // 如果重置过于频繁（小于5秒），输出警告
    if (timeSinceLastReset < 5000 && timeSinceLastReset > 0) {
      this._warn(`⚠️ [活动监听] 重置过于频繁！距离上次重置仅 ${Math.round(timeSinceLastReset / 1000)} 秒`)
    }
    
    // 清除现有计时器
    if (this.timer) {
      clearTimeout(this.timer)
      this._log('⏹️ [活动监听] 已清除旧的超时计时器')
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer)
      this._log('⏹️ [活动监听] 已清除旧的警告计时器')
    }
    
    // 重置警告状态
    this.warningShown = false
    
    // 检查是否需要基于现有的lastActivityTime来计算剩余时间
    const existingLastActivityTime = localStorage.getItem('lastActivityTime')
    let actualWarningTime = this.warningTime
    let actualTimeout = this.timeout
    
    if (existingLastActivityTime && !this.isFromUserActivity) {
      // 页面刷新情况：基于现有的最后活动时间计算剩余时间
      const timeSinceLastActivity = now - parseInt(existingLastActivityTime)
      const remainingTimeout = Math.max(0, this.timeout - timeSinceLastActivity)
      const remainingWarningTime = Math.max(0, this.warningTime - timeSinceLastActivity)
      
      if (remainingTimeout > 0) {
        actualTimeout = remainingTimeout
        actualWarningTime = remainingWarningTime
        
        this._log(`🔄 [活动监听] 页面刷新模式 - 基于现有活动时间计算剩余时间`)
        this._log(`📊 [活动监听] 剩余超时时间: ${Math.round(actualTimeout / 1000)} 秒`)
        this._log(`📊 [活动监听] 剩余警告时间: ${Math.round(actualWarningTime / 1000)} 秒`)
        
        // 如果需要立即显示警告
        if (this.shouldShowWarningImmediately || actualWarningTime <= 0) {
          this._log(`⚠️ [活动监听] 立即显示警告（已过警告时间）`)
          this.showWarning()
          this.shouldShowWarningImmediately = false
        }
      }
    } else {
      // 正常用户活动或首次启动：使用完整时间并更新lastActivityTime
      this.isFromUserActivity = false // 重置标志
    }
    
    // 设置警告计时器（如果还有剩余警告时间）
    if (actualWarningTime > 0) {
      this.warningTimer = setTimeout(this.showWarning.bind(this), actualWarningTime)
      this._log(`⚠️ [活动监听] 警告计时器已设置: ${Math.round(actualWarningTime / 1000)} 秒后显示警告`)
    }
    
    // 设置自动退出计时器
    this.timer = setTimeout(this.markExpired.bind(this), actualTimeout)
    this._log(`⏰ [活动监听] 超时计时器已设置: ${Math.round(actualTimeout / 1000)} 秒后会话过期`)
    
    // 更新最后活动时间到localStorage
    localStorage.setItem('lastActivityTime', now.toString())
    this._log(`💾 [活动监听] 最后活动时间已更新: ${currentTime}`)
    
    // 更新预期过期时间日志
    const expectedExpireTime = new Date(now + this.timeout).toLocaleString()
    this._log(`💾 [活动监听] 预期过期时间: ${expectedExpireTime}`)
  }

  /**
   * 显示即将退出警告
   */
  showWarning() {
    if (!this.isActive || this.warningShown) return
    
    this.warningShown = true
    
    const warningTime = new Date().toLocaleString()
    this._warn(`⚠️ [活动监听] 显示警告消息 - 时间: ${warningTime}`)
    this._warn(`⏱️ [活动监听] 还有 ${(this.timeout - this.warningTime) / 1000 / 60} 分钟后会话将过期`)
    
    // 显示警告消息
    Message({
      message: this.config.messages.warningMessage,
      type: 'warning',
      duration: 0, // 不自动关闭
      showClose: true,
      customClass: 'activity-warning-message'
    })
  }

  /**
   * 标记会话已过期
   */
  markExpired() {
    const expiredTime = new Date().toLocaleString()
    const lastActivityTime = localStorage.getItem('lastActivityTime')
    const timeSinceLastActivity = lastActivityTime ? Date.now() - parseInt(lastActivityTime) : 0
    
    this._error(`❌ [活动监听] 会话已过期 - 时间: ${expiredTime}`)
    this._error(`⏰ [活动监听] 超时时长: ${this.timeout / 1000} 秒`)
    this._error(`📊 [活动监听] 最后活动时间: ${lastActivityTime ? new Date(parseInt(lastActivityTime)).toLocaleString() : '无记录'}`)
    this._error(`📊 [活动监听] 距离最后活动: ${Math.round(timeSinceLastActivity / 1000)} 秒`)
    this._error(`🔍 [活动监听] 监听器激活状态: ${this.isActive ? '激活' : '未激活'}`)
    this._error(`🔍 [活动监听] 当前过期状态: ${this.isExpired ? '已过期' : '未过期'}`)
    this._trace('🔍 [活动监听] markExpired调用堆栈:') // 添加调用堆栈跟踪
    
    // 标记为过期（无论监听器是否激活）
    this.isExpired = true
    // 持久化过期标记，防止用户通过刷新页面绕过强制登录
    try { localStorage.setItem(SESSION_EXPIRED_KEY, '1') } catch (e) {}

    // 显示过期提示
    Message({
      message: this.config.messages.expiredMessage,
      type: 'warning',
      duration: 0, // 不自动关闭
      showClose: true,
      customClass: 'session-expired-message'
    })
    
    // 显示强制重新登录弹窗
    setTimeout(() => {
      this._log('🔒 [活动监听] 触发强制重新登录弹窗')
      this.showForceReloginDialog()
    }, 1000) // 延迟1秒确保过期消息先显示
  }

  /**
   * 显示强制重新登录弹窗
   */
  showForceReloginDialog() {
    if (this.forceReloginShown) return
    
    this.forceReloginShown = true
    
    // 导入MessageBox（需要异步导入避免循环依赖）
    import('element-ui').then(({ MessageBox }) => {
      MessageBox.confirm(
        this.config.messages.forceReloginContent,
        this.config.messages.forceReloginTitle,
        {
          confirmButtonText: this.config.messages.forceReloginConfirm,
          cancelButtonText: '取消',
          type: 'warning',
          showClose: false,
          closeOnClickModal: false,
          closeOnPressEscape: false
        }
      ).then(() => {
        this.performLogout()
      }).catch(() => {
        this.performLogout()
      })
    })
  }

  /**
   * 执行退出登录
   */
  async performLogout() {
    this._log('执行退出登录操作')
    this._trace('performLogout调用堆栈:') // 添加调用堆栈跟踪
    
    try {
      // 停止监听
      this.stop()
      
      // 显示退出消息
      Message({
        message: this.config.messages.logoutMessage,
        type: 'info',
        duration: 3000
      })
      clearAllAuthAndCache()
      store.commit('user/RESET_STATE')
      
      // 清除所有标签页视图数据
      store.dispatch("tagsView/delAllViews")
      this._log("自动退出: 清除所有标签页视图数据")
      
      // 跳转到登录页 - 使用专用方法确保兼容publicPath配置
      this.navigateToLogin()
      
    } catch (error) {
      console.error('退出过程中发生错误:', error)
      
      // 即使出错也要强制清除本地状态
      try {
        clearAllAuthAndCache()
        store.commit('user/RESET_STATE')
        
        // 清除所有标签页视图数据
        store.dispatch("tagsView/delAllViews")
        this._log("异常退出: 清除所有标签页视图数据")
      } catch (cleanupError) {
        console.error('清理本地状态时发生错误:', cleanupError)
      }
      
      // 强制跳转到登录页 - 使用专用方法确保兼容publicPath配置
      this.navigateToLogin()
    }
  }

  /**
   * 兼容旧版本的logout方法
   */
  async logout() {
    await this.performLogout()
  }

  /**
   * 检查是否需要立即退出（页面刷新时检查）
   */
  checkActivityOnLoad() {
    this._log('🔍 [活动监听] 检查页面加载时的活动状态')
    
    // 如果功能未启用或配置不检查页面加载，直接返回
    if (!isActivityMonitorEnabled()) {
      this._log('🚫 [活动监听] 功能已禁用，跳过页面加载检查')
      return true
    }
    
    if (!this.config.checkOnPageLoad) {
      this._log('⚠️ [活动监听] 页面加载检查已禁用，跳过检查')
      return true
    }

    const lastActivityTime = localStorage.getItem('lastActivityTime')
    
    if (lastActivityTime) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivityTime)
      const lastTime = new Date(parseInt(lastActivityTime)).toLocaleString()
      const currentTime = new Date().toLocaleString()
      
      this._log(`📊 [活动监听] 最后活动时间: ${lastTime}`)
      this._log(`📊 [活动监听] 当前时间: ${currentTime}`)
      this._log(`📊 [活动监听] 距离最后活动: ${Math.round(timeSinceLastActivity / 1000 / 60)} 分钟`)
      
      // 如果超过配置的超时时间，标记为过期并持久化，防止刷新绕过
      if (timeSinceLastActivity > this.timeout) {
        this._error(`❌ [活动监听] 页面加载时检测到超时，标记会话为过期状态`)
        this._error(`⏰ [活动监听] 超时阈值: ${this.timeout / 1000 / 60} 分钟`)
        this.isExpired = true
        try { localStorage.setItem(SESSION_EXPIRED_KEY, '1') } catch (e) {}
        this.markExpired()
        return true // 仍然返回true，允许页面加载，但会话已过期
      } else {
        this._log(`✅ [活动监听] 会话仍有效，剩余时间: ${Math.round((this.timeout - timeSinceLastActivity) / 1000 / 60)} 分钟`)
        
        // 页面刷新后，记录需要特殊处理的状态
        const remainingTime = this.timeout - timeSinceLastActivity
        const remainingWarningTime = this.warningTime - timeSinceLastActivity
        
        this._log(`📊 [活动监听] 剩余超时时间: ${Math.round(remainingTime / 1000)} 秒`)
        this._log(`📊 [活动监听] 剩余警告时间: ${Math.round(remainingWarningTime / 1000)} 秒`)
        
        // 如果已经过了警告时间但还没过期，标记需要立即显示警告
        if (remainingWarningTime <= 0 && remainingTime > 0) {
          this._log(`⚠️ [活动监听] 页面刷新时发现已过警告时间，将在start方法中立即显示警告`)
          this.shouldShowWarningImmediately = true
        }
        
        // 不在这里设置计时器，让start方法中的resetTimer来处理
        // 这样可以避免重复设置计时器的问题
      }
    } else {
      // 没有最后活动时间记录，初始化为当前时间
      this._log('💾 [活动监听] 未找到最后活动时间记录，将在resetTimer中初始化')
      // 不在这里设置计时器，让start方法中的resetTimer来处理
    }
    
    return true
  }

  /**
   * 处理页面可见性变化
   */
  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // 页面变为可见时，检查是否已过期
      if (this.isExpired) {
        this._log('页面变为可见，检测到会话已过期')
        this.showForceReloginDialog()
      }
    }
  }

  /**
   * 获取剩余时间（毫秒）
   */
  getRemainingTime() {
    // 检查功能是否启用
    if (!isActivityMonitorEnabled()) {
      this._log('🚫 [活动监听] 功能已禁用，剩余时间检查跳过')
      return this.timeout // 返回完整超时时间
    }

    // 如果已过期，返回0
    if (this.isExpired) {
      this._log('🔒 [活动监听] 会话已标记为过期，剩余时间: 0')
      return 0
    }
    
    const lastActivityTime = localStorage.getItem('lastActivityTime')
    if (!lastActivityTime) {
      this._log('💾 [活动监听] 未找到最后活动时间，返回完整超时时间')
      return this.timeout
    }
    
    const now = Date.now()
    const lastTime = parseInt(lastActivityTime)
    const timeSinceLastActivity = now - lastTime
    const remaining = Math.max(0, this.timeout - timeSinceLastActivity)
    
    // 添加详细的时间计算日志（仅 debug 时输出）
    this._log(`📊 [活动监听] 剩余时间计算:`)
    this._log(`  📅 当前时间: ${new Date(now).toLocaleString()}`)
    this._log(`  📅 最后活动: ${new Date(lastTime).toLocaleString()}`)
    this._log(`  ⏱️ 距离最后活动: ${Math.round(timeSinceLastActivity / 1000)} 秒`)
    this._log(`  ⏰ 超时阈值: ${this.timeout / 1000} 秒`)
    this._log(`  ⏳ 剩余时间: ${Math.round(remaining / 1000)} 秒`)
    
    // 如果计算出的时间已经到了，标记为过期
    if (remaining === 0 && !this.isExpired) {
      this._warn(`❌ [活动监听] 计算发现时间已用尽，标记为过期`)
      this.isExpired = true
      this.markExpired()
    }
    
    return remaining
  }

  /**
   * 手动延长会话
   */
  extendSession() {
    // 如果已过期，显示强制重新登录弹窗
    if (this.isExpired) {
      this.showForceReloginDialog()
      return false
    }
    
    this._log('手动延长会话')
    this.resetTimer()
    
    // 关闭警告消息
    const warningMessages = document.querySelectorAll('.activity-warning-message')
    warningMessages.forEach(msg => {
      const closeBtn = msg.querySelector('.el-message__closeBtn')
      if (closeBtn) closeBtn.click()
    })
    
    // 关闭过期消息
    const expiredMessages = document.querySelectorAll('.session-expired-message')
    expiredMessages.forEach(msg => {
      const closeBtn = msg.querySelector('.el-message__closeBtn')
      if (closeBtn) closeBtn.click()
    })
    
    return true
  }
}

// 创建单例实例
const userActivityMonitor = new UserActivityMonitor()

export default userActivityMonitor
