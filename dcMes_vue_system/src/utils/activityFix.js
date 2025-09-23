/*
 * @name: 活动监听修复工具
 * @content: 修复活动监听功能的问题
 * @Author: AI Assistant
 * @Date: 2024-09-22
 */

import userActivityMonitor from '@/utils/userActivity'
import { getActivityConfig, isActivityMonitorEnabled } from '@/config/activityConfig'

/**
 * 修复活动监听问题
 */
export function fixActivityMonitor() {
  console.log('🔧 [修复工具] 开始修复活动监听问题...')
  
  const config = getActivityConfig()
  const isEnabled = isActivityMonitorEnabled()
  
  console.log('🔍 [修复工具] 当前状态:')
  console.log(`  功能启用: ${isEnabled}`)
  console.log(`  监听器激活: ${userActivityMonitor.isActive}`)
  console.log(`  会话过期: ${userActivityMonitor.isExpired}`)
  
  // 问题1：监听器未激活
  if (isEnabled && !userActivityMonitor.isActive) {
    console.log('🔧 [修复工具] 检测到监听器未激活，尝试重新启动...')
    
    // 如果会话已过期，先清理状态
    if (userActivityMonitor.isExpired) {
      console.log('🔧 [修复工具] 检测到会话已过期，清理过期状态...')
      
      // 重置过期状态
      userActivityMonitor.isExpired = false
      userActivityMonitor.forceReloginShown = false
      userActivityMonitor.warningShown = false
      
      // 更新最后活动时间为当前时间
      localStorage.setItem('lastActivityTime', Date.now().toString())
      console.log('🔧 [修复工具] 已重置会话状态，设置新的活动时间')
    }
    
    // 重新启动监听器
    const started = userActivityMonitor.start()
    if (started) {
      console.log('✅ [修复工具] 监听器重新启动成功')
    } else {
      console.error('❌ [修复工具] 监听器启动失败')
    }
  }
  
  // 问题2：监听器激活但会话已过期很久
  else if (userActivityMonitor.isActive && userActivityMonitor.isExpired) {
    console.log('🔧 [修复工具] 检测到监听器激活但会话已过期，触发强制重新登录...')
    userActivityMonitor.showForceReloginDialog()
  }
  
  // 问题3：时间计算异常
  else {
    const lastActivityTime = localStorage.getItem('lastActivityTime')
    if (lastActivityTime) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivityTime)
      const shouldBeExpired = timeSinceLastActivity > config.sessionTimeout
      
      if (shouldBeExpired && !userActivityMonitor.isExpired) {
        console.log('🔧 [修复工具] 检测到时间计算异常，手动触发过期检查...')
        
        // 手动标记过期
        userActivityMonitor.isExpired = true
        userActivityMonitor.markExpired()
        userActivityMonitor.showForceReloginDialog()
      }
    }
  }
  
  console.log('🔧 [修复工具] 修复完成')
}

/**
 * 强制重新初始化活动监听
 */
export function forceReinitialize() {
  console.log('🔄 [修复工具] 强制重新初始化活动监听...')
  
  // 停止当前监听
  userActivityMonitor.stop()
  
  // 清理所有状态
  userActivityMonitor.isExpired = false
  userActivityMonitor.forceReloginShown = false
  userActivityMonitor.warningShown = false
  
  // 设置当前时间为最后活动时间
  localStorage.setItem('lastActivityTime', Date.now().toString())
  
  // 重新启动
  const started = userActivityMonitor.start()
  
  console.log(`🔄 [修复工具] 重新初始化${started ? '成功' : '失败'}`)
  
  return started
}

/**
 * 清理过期状态但保持监听
 */
export function clearExpiredState() {
  console.log('🧹 [修复工具] 清理过期状态...')
  
  userActivityMonitor.isExpired = false
  userActivityMonitor.forceReloginShown = false
  userActivityMonitor.warningShown = false
  
  // 更新活动时间
  localStorage.setItem('lastActivityTime', Date.now().toString())
  
  // 如果监听器未激活，重新启动
  if (!userActivityMonitor.isActive) {
    userActivityMonitor.start()
  } else {
    // 如果已激活，重置计时器
    userActivityMonitor.resetTimer()
  }
  
  console.log('🧹 [修复工具] 过期状态已清理，活动监听已重置')
}

/**
 * 立即测试过期功能
 */
export function testExpireImmediately() {
  console.log('🧪 [立即测试] 开始立即过期测试...')
  
  // 直接调用markExpired方法
  userActivityMonitor.markExpired()
  
  console.log('🧪 [立即测试] markExpired方法已调用')
  console.log(`🧪 [立即测试] 过期状态: ${userActivityMonitor.isExpired}`)
  
  // 等待一段时间检查结果
  setTimeout(() => {
    console.log('🧪 [立即测试] 2秒后检查:')
    console.log(`  过期状态: ${userActivityMonitor.isExpired}`)
    console.log(`  重新登录弹窗状态: ${userActivityMonitor.forceReloginShown}`)
  }, 2000)
}

// 在开发环境下暴露到全局
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.activityFix = {
    fix: fixActivityMonitor,
    reinit: forceReinitialize,
    clear: clearExpiredState,
    testExpire: testExpireImmediately
  }
  
  console.log('🔧 [修复工具] 修复工具已暴露到 window.activityFix')
  console.log('🔧 [修复工具] 可用方法: fix(), reinit(), clear(), testExpire()')
}

export default {
  fixActivityMonitor,
  forceReinitialize,
  clearExpiredState
}
