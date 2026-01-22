/*
 * @name: 用户活动监听调试工具
 * @content: 帮助调试活动监听相关问题
 * @Author: AI Assistant
 * @Date: 2024-09-22
 */

import userActivityMonitor from './userActivity'
import { getToken, getid } from './auth'
import store from '@/store'

class ActivityDebugger {
  constructor() {
    this.logs = []
    this.isDebugMode = false
  }

  /**
   * 启用调试模式
   */
  enableDebug() {
    this.isDebugMode = true
    console.log('活动监听调试模式已启用')
    
    // 定时输出状态
    this.statusInterval = setInterval(() => {
      this.logCurrentStatus()
    }, 30000) // 每30秒输出一次状态
  }

  /**
   * 禁用调试模式
   */
  disableDebug() {
    this.isDebugMode = false
    if (this.statusInterval) {
      clearInterval(this.statusInterval)
    }
    console.log('活动监听调试模式已禁用')
  }

  /**
   * 记录当前状态
   */
  logCurrentStatus() {
    if (!this.isDebugMode) return

    const status = {
      timestamp: new Date().toLocaleString(),
      isActive: userActivityMonitor.isActive,
      isExpired: userActivityMonitor.isExpired,
      forceReloginShown: userActivityMonitor.forceReloginShown,
      remainingTime: userActivityMonitor.getRemainingTime(),
      lastActivityTime: localStorage.getItem('lastActivityTime'),
      storeToken: store.getters.token ? 'exists' : 'null',
      cookieToken: getToken() ? 'exists' : 'null',
      cookieId: getid() ? 'exists' : 'null'
    }

    console.log('=== 活动监听状态 ===', status)
    this.logs.push(status)

    // 只保留最近50条记录
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50)
    }
  }

  /**
   * 检查状态一致性
   */
  checkConsistency() {
    const issues = []

    // 检查token一致性
    const storeToken = store.getters.token
    const cookieToken = getToken()
    if (!!storeToken !== !!cookieToken) {
      issues.push(`Token状态不一致: Store(${!!storeToken}) vs Cookie(${!!cookieToken})`)
    }

    // 检查用户ID一致性
    const storeId = store.getters.id
    const cookieId = getid()
    if (!!storeId !== !!cookieId) {
      issues.push(`用户ID状态不一致: Store(${!!storeId}) vs Cookie(${!!cookieId})`)
    }

    // 检查活动时间
    const lastActivityTime = localStorage.getItem('lastActivityTime')
    if (!lastActivityTime && userActivityMonitor.isActive) {
      issues.push('监听器激活但缺少最后活动时间')
    }

    // 检查过期状态
    if (userActivityMonitor.isExpired && userActivityMonitor.isActive) {
      issues.push('会话已过期但监听器仍然激活')
    }

    if (issues.length > 0) {
      console.warn('检测到状态不一致问题:', issues)
    } else {
      console.log('状态检查通过，无问题发现')
    }

    return issues
  }

  /**
   * 生成调试报告
   */
  generateReport() {
    const report = {
      currentStatus: {
        timestamp: new Date().toLocaleString(),
        isActive: userActivityMonitor.isActive,
        isExpired: userActivityMonitor.isExpired,
        remainingTime: userActivityMonitor.getRemainingTime(),
        lastActivityTime: localStorage.getItem('lastActivityTime'),
        frontendControlled: true // 标记为完全前端控制
      },
      tokenStatus: {
        storeToken: !!store.getters.token,
        cookieToken: !!getToken(),
        storeId: !!store.getters.id,
        cookieId: !!getid()
      },
      backendConfig: {
        timeValidationDisabled: true, // 后端时间校验已禁用
        tokenUpdateEnabled: true // 仍保留token更新功能
      },
      recentLogs: this.logs.slice(-10), // 最近10条记录
      consistencyCheck: this.checkConsistency()
    }

    console.log('=== 活动监听调试报告 ===')
    console.log('注意：后端时间校验已禁用，完全由前端控制会话过期')
    console.log(JSON.stringify(report, null, 2))
    return report
  }

  /**
   * 模拟问题场景
   */
  simulateIssues() {
    console.log('开始模拟问题场景...')

    // 模拟1: token被意外清除
    setTimeout(() => {
      console.log('模拟: Cookie token被意外清除')
      document.cookie = 'Admin-Token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      this.logCurrentStatus()
    }, 5000)

    // 模拟2: localStorage被清除
    setTimeout(() => {
      console.log('模拟: lastActivityTime被意外清除')
      localStorage.removeItem('lastActivityTime')
      this.logCurrentStatus()
    }, 10000)
  }

  /**
   * 手动触发检查
   */
  triggerChecks() {
    console.log('手动触发各种检查...')
    
    // 触发活动时间检查
    userActivityMonitor.getRemainingTime()
    
    // 检查状态一致性
    this.checkConsistency()
    
    // 记录当前状态
    this.logCurrentStatus()
  }
}

// 创建调试器实例
const activityDebugger = new ActivityDebugger()

// 在控制台中暴露调试工具
if (typeof window !== 'undefined') {
  window.activityDebugger = activityDebugger
  console.log('活动监听调试工具已加载，使用 window.activityDebugger 访问')
  console.log('可用方法:')
  console.log('- enableDebug(): 启用调试模式')
  console.log('- disableDebug(): 禁用调试模式')
  console.log('- generateReport(): 生成调试报告')
  console.log('- checkConsistency(): 检查状态一致性')
  console.log('- simulateIssues(): 模拟问题场景')
  console.log('- triggerChecks(): 手动触发检查')
}

export default activityDebugger
