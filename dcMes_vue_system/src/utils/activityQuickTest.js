/*
 * @name: 活动监听快速测试
 * @content: 快速检查活动监听功能的问题
 * @Author: AI Assistant
 * @Date: 2024-09-22
 */

import userActivityMonitor from '@/utils/userActivity'
import { getActivityConfig, isActivityMonitorEnabled } from '@/config/activityConfig'

/**
 * 快速检查活动监听状态
 */
export function quickCheck() {
  console.log('🔍 [快速检查] 开始活动监听状态检查...')
  
  const config = getActivityConfig()
  const isEnabled = isActivityMonitorEnabled()
  
  console.log('=' .repeat(50))
  console.log('📋 基本状态:')
  console.log(`  功能启用: ${isEnabled ? '✅' : '❌'}`)
  console.log(`  监听器激活: ${userActivityMonitor.isActive ? '✅' : '❌'}`)
  console.log(`  会话过期: ${userActivityMonitor.isExpired ? '❌' : '✅'}`)
  console.log(`  超时时间: ${config.sessionTimeout / 1000} 秒`)
  
  const lastActivityTime = localStorage.getItem('lastActivityTime')
  if (lastActivityTime) {
    const now = Date.now()
    const lastTime = parseInt(lastActivityTime)
    const elapsed = now - lastTime
    const remaining = Math.max(0, config.sessionTimeout - elapsed)
    
    console.log('\n⏰ 时间状态:')
    console.log(`  最后活动: ${new Date(lastTime).toLocaleString()}`)
    console.log(`  已过时间: ${Math.round(elapsed / 1000)} 秒`)
    console.log(`  剩余时间: ${Math.round(remaining / 1000)} 秒`)
    console.log(`  应该过期: ${elapsed > config.sessionTimeout ? '是' : '否'}`)
    
    if (elapsed > config.sessionTimeout && !userActivityMonitor.isExpired) {
      console.error('🚨 发现问题: 会话应该过期但实际未过期!')
      return false
    }
  }
  
  console.log('=' .repeat(50))
  return true
}

/**
 * 强制触发过期测试
 */
export function forceExpireTest() {
  console.log('🧪 [强制测试] 开始强制过期测试...')
  
  const config = getActivityConfig()
  
  // 设置一个很久以前的时间
  const pastTime = Date.now() - (config.sessionTimeout + 60000)
  localStorage.setItem('lastActivityTime', pastTime.toString())
  
  console.log(`📅 设置最后活动时间为: ${new Date(pastTime).toLocaleString()}`)
  
  // 等待一小段时间让系统检测
  setTimeout(() => {
    const remaining = userActivityMonitor.getRemainingTime()
    console.log(`⏳ 剩余时间计算: ${remaining} 毫秒`)
    console.log(`🔒 是否已过期: ${userActivityMonitor.isExpired ? '是' : '否'}`)
    
    if (remaining <= 0 && !userActivityMonitor.isExpired) {
      console.error('🚨 测试失败: 时间已过但未标记为过期!')
    } else {
      console.log('✅ 测试通过: 过期检测正常工作')
    }
  }, 1000)
}

/**
 * 监控事件触发
 */
export function monitorEvents(duration = 30000) {
  console.log(`👁️ [事件监控] 开始监控用户事件，持续 ${duration / 1000} 秒...`)
  
  let eventCount = 0
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  const handlers = []
  
  events.forEach(eventType => {
    const handler = (e) => {
      eventCount++
      console.log(`🎯 [事件监控] 检测到 ${eventType} 事件 (总计: ${eventCount})`)
    }
    document.addEventListener(eventType, handler, true)
    handlers.push({ eventType, handler })
  })
  
  setTimeout(() => {
    // 移除事件监听器
    handlers.forEach(({ eventType, handler }) => {
      document.removeEventListener(eventType, handler, true)
    })
    
    console.log(`👁️ [事件监控] 监控结束，共检测到 ${eventCount} 个事件`)
    
    if (eventCount > 100) {
      console.warn('⚠️ 检测到大量事件，可能导致计时器频繁重置!')
    }
  }, duration)
}

// 在开发环境下暴露到全局
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.activityQuickTest = {
    check: quickCheck,
    forceExpire: forceExpireTest,
    monitorEvents: monitorEvents
  }
  
  console.log('🧪 [快速测试] 测试工具已暴露到 window.activityQuickTest')
  console.log('🧪 [快速测试] 可用方法: check(), forceExpire(), monitorEvents()')
}

export default {
  quickCheck,
  forceExpireTest,
  monitorEvents
}
