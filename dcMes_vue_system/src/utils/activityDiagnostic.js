/*
 * @name: 活动监听诊断工具
 * @content: 诊断活动监听功能为什么没有实际过期
 * @Author: AI Assistant
 * @Date: 2024-09-22
 */

import userActivityMonitor from '@/utils/userActivity'
import { getActivityConfig, isActivityMonitorEnabled } from '@/config/activityConfig'

/**
 * 活动监听诊断工具
 */
class ActivityDiagnostic {
  constructor() {
    this.diagnosticInterval = null
  }

  /**
   * 开始诊断
   */
  startDiagnostic() {
    console.log('🔍 [诊断] 开始活动监听诊断...')
    
    this.performInitialCheck()
    
    // 每10秒进行一次诊断
    this.diagnosticInterval = setInterval(() => {
      this.performPeriodicCheck()
    }, 10000)
    
    console.log('🔍 [诊断] 诊断工具已启动，每10秒检查一次状态')
  }

  /**
   * 停止诊断
   */
  stopDiagnostic() {
    if (this.diagnosticInterval) {
      clearInterval(this.diagnosticInterval)
      this.diagnosticInterval = null
      console.log('🔍 [诊断] 诊断工具已停止')
    }
  }

  /**
   * 执行初始检查
   */
  performInitialCheck() {
    console.log('=' .repeat(60))
    console.log('🔍 [诊断] 活动监听功能诊断报告')
    console.log('=' .repeat(60))
    
    // 1. 检查配置状态
    const config = getActivityConfig()
    const isEnabled = isActivityMonitorEnabled()
    
    console.log('📋 [诊断] 配置检查:')
    console.log(`  ✓ 功能启用状态: ${isEnabled ? '✅ 已启用' : '❌ 已禁用'}`)
    console.log(`  ✓ 会话超时时间: ${config.sessionTimeout / 1000} 秒 (${config.sessionTimeout / 1000 / 60} 分钟)`)
    console.log(`  ✓ 警告时间: ${config.warningTime / 1000} 秒 (${config.warningTime / 1000 / 60} 分钟)`)
    console.log(`  ✓ 监听事件数量: ${config.monitorEvents.length} 个`)
    console.log(`  ✓ 路由拦截: ${config.interceptRouting ? '开启' : '关闭'}`)
    console.log(`  ✓ API拦截: ${config.interceptApiRequests ? '开启' : '关闭'}`)
    console.log(`  ✓ 页面加载检查: ${config.checkOnPageLoad ? '开启' : '关闭'}`)
    
    // 2. 检查监听器状态
    console.log('\n📊 [诊断] 监听器状态:')
    console.log(`  ✓ 监听器激活状态: ${userActivityMonitor.isActive ? '✅ 激活' : '❌ 未激活'}`)
    console.log(`  ✓ 会话过期状态: ${userActivityMonitor.isExpired ? '❌ 已过期' : '✅ 未过期'}`)
    console.log(`  ✓ 警告显示状态: ${userActivityMonitor.warningShown ? '⚠️ 已显示' : '✅ 未显示'}`)
    
    // 3. 检查localStorage
    const lastActivityTime = localStorage.getItem('lastActivityTime')
    if (lastActivityTime) {
      const lastTime = parseInt(lastActivityTime)
      const now = Date.now()
      const timeSinceLastActivity = now - lastTime
      
      console.log('\n💾 [诊断] 本地存储检查:')
      console.log(`  ✓ 最后活动时间: ${new Date(lastTime).toLocaleString()}`)
      console.log(`  ✓ 当前时间: ${new Date(now).toLocaleString()}`)
      console.log(`  ✓ 距离最后活动: ${Math.round(timeSinceLastActivity / 1000)} 秒`)
      console.log(`  ✓ 是否应该过期: ${timeSinceLastActivity > config.sessionTimeout ? '❌ 是' : '✅ 否'}`)
    } else {
      console.log('\n💾 [诊断] 本地存储检查: ❌ 未找到最后活动时间记录')
    }
    
    // 4. 检查事件监听器
    this.checkEventListeners()
    
    // 5. 检查计时器状态
    this.checkTimerStatus()
    
    console.log('=' .repeat(60))
  }

  /**
   * 执行周期性检查
   */
  performPeriodicCheck() {
    const now = Date.now()
    const lastActivityTime = localStorage.getItem('lastActivityTime')
    const config = getActivityConfig()
    
    if (lastActivityTime) {
      const timeSinceLastActivity = now - parseInt(lastActivityTime)
      const shouldBeExpired = timeSinceLastActivity > config.sessionTimeout
      const actuallyExpired = userActivityMonitor.isExpired
      
      console.log(`🔍 [诊断] 周期检查 - ${new Date().toLocaleString()}:`)
      console.log(`  📊 距离最后活动: ${Math.round(timeSinceLastActivity / 1000)} 秒`)
      console.log(`  📊 超时阈值: ${config.sessionTimeout / 1000} 秒`)
      console.log(`  📊 应该过期: ${shouldBeExpired ? '是' : '否'}`)
      console.log(`  📊 实际过期: ${actuallyExpired ? '是' : '否'}`)
      
      // 如果应该过期但实际没有过期，输出警告
      if (shouldBeExpired && !actuallyExpired) {
        console.warn(`⚠️ [诊断] 检测到异常: 会话应该过期但实际未过期！`)
        console.warn(`  🔍 可能原因:`)
        console.warn(`    1. 计时器被意外清除或重置`)
        console.warn(`    2. 用户活动事件仍在触发 resetTimer`)
        console.warn(`    3. markExpired 方法未被正确调用`)
        console.warn(`    4. 监听器状态异常`)
        
        // 执行详细检查
        this.performDetailedCheck()
      }
    }
  }

  /**
   * 执行详细检查
   */
  performDetailedCheck() {
    console.log('🔬 [诊断] 执行详细异常检查:')
    
    // 检查计时器状态
    console.log(`  🔍 超时计时器状态: ${userActivityMonitor.timer ? '存在' : '不存在'}`)
    console.log(`  🔍 警告计时器状态: ${userActivityMonitor.warningTimer ? '存在' : '不存在'}`)
    
    // 检查监听器状态
    console.log(`  🔍 监听器激活: ${userActivityMonitor.isActive}`)
    console.log(`  🔍 功能启用: ${isActivityMonitorEnabled()}`)
    
    // 尝试手动触发检查
    const remainingTime = userActivityMonitor.getRemainingTime()
    console.log(`  🔍 剩余时间计算: ${remainingTime} 毫秒`)
    
    if (remainingTime <= 0) {
      console.warn(`  ⚠️ 剩余时间为 ${remainingTime}，应该触发过期但未触发`)
      console.warn(`  🔧 尝试手动触发过期检查...`)
      
      // 检查 getRemainingTime 方法是否正确标记过期
      if (!userActivityMonitor.isExpired) {
        console.error(`  ❌ getRemainingTime 方法未正确标记过期状态`)
      }
    }
  }

  /**
   * 检查事件监听器
   */
  checkEventListeners() {
    console.log('\n🎯 [诊断] 事件监听器检查:')
    
    const config = getActivityConfig()
    let listenerCount = 0
    
    // 简单的检查方法：尝试模拟事件
    config.monitorEvents.forEach(eventType => {
      // 这里无法直接检查事件监听器，但可以检查配置
      console.log(`  ✓ ${eventType}: 已配置`)
      listenerCount++
    })
    
    console.log(`  📊 总计配置事件: ${listenerCount} 个`)
    
    if (userActivityMonitor.isActive) {
      console.log(`  ✅ 监听器状态: 激活中`)
    } else {
      console.log(`  ❌ 监听器状态: 未激活`)
    }
  }

  /**
   * 检查计时器状态
   */
  checkTimerStatus() {
    console.log('\n⏰ [诊断] 计时器状态检查:')
    
    console.log(`  ✓ 超时计时器: ${userActivityMonitor.timer ? '✅ 已设置' : '❌ 未设置'}`)
    console.log(`  ✓ 警告计时器: ${userActivityMonitor.warningTimer ? '✅ 已设置' : '❌ 未设置'}`)
    
    // 计算剩余时间
    const remainingTime = userActivityMonitor.getRemainingTime()
    console.log(`  ✓ 计算剩余时间: ${remainingTime} 毫秒`)
    
    if (remainingTime <= 0) {
      console.warn(`  ⚠️ 剩余时间已用尽，应该触发过期`)
    }
  }

  /**
   * 模拟用户活动
   */
  simulateUserActivity() {
    console.log('🎭 [诊断] 模拟用户活动')
    
    // 触发一个点击事件
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window
    })
    
    document.dispatchEvent(event)
    console.log('🎭 [诊断] 已派发 mousedown 事件')
  }

  /**
   * 强制触发过期检查
   */
  forceExpireCheck() {
    console.log('🔧 [诊断] 强制触发过期检查')
    
    // 将最后活动时间设置为很久以前
    const config = getActivityConfig()
    const longTimeAgo = Date.now() - (config.sessionTimeout + 60000) // 比超时时间多1分钟
    
    localStorage.setItem('lastActivityTime', longTimeAgo.toString())
    console.log(`🔧 [诊断] 已将最后活动时间设置为: ${new Date(longTimeAgo).toLocaleString()}`)
    
    // 调用检查方法
    const shouldContinue = userActivityMonitor.checkActivityOnLoad()
    console.log(`🔧 [诊断] checkActivityOnLoad 返回: ${shouldContinue}`)
    console.log(`🔧 [诊断] 过期状态: ${userActivityMonitor.isExpired}`)
  }
}

// 创建诊断实例
const activityDiagnostic = new ActivityDiagnostic()

// 在开发环境下暴露到全局
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.activityDiagnostic = {
    start: () => activityDiagnostic.startDiagnostic(),
    stop: () => activityDiagnostic.stopDiagnostic(),
    check: () => activityDiagnostic.performInitialCheck(),
    simulate: () => activityDiagnostic.simulateUserActivity(),
    forceExpire: () => activityDiagnostic.forceExpireCheck()
  }
  
  console.log('🔍 [诊断] 诊断工具已暴露到 window.activityDiagnostic')
  console.log('🔍 [诊断] 可用方法: start(), stop(), check(), simulate(), forceExpire()')
}

export default activityDiagnostic
