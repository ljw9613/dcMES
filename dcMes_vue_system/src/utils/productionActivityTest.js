/*
 * @name: 生产环境活动监听测试工具
 * @content: 在生产环境中安全测试用户活动监听和定时过期功能
 * @Author: AI Assistant
 * @Date: 2024-09-29
 */

import userActivityMonitor from '@/utils/userActivity'
import { getActivityConfig, updateActivityConfig, isActivityMonitorEnabled } from '@/config/activityConfig'

/**
 * 生产环境安全测试类
 */
class ProductionActivityTest {
  constructor() {
    this.originalConfig = null
    this.testActive = false
    this.testTimer = null
    this.backupTimer = null
  }

  /**
   * 方案1：临时缩短超时时间测试（推荐）
   * 将15分钟缩短为2-5分钟进行快速测试
   */
  quickTimeoutTest(timeoutMinutes = 2) {
    console.log(`🧪 [生产测试] 开始快速超时测试 - ${timeoutMinutes}分钟`)
    
    // 备份原始配置
    this.originalConfig = getActivityConfig()
    
    const testConfig = {
      sessionTimeout: timeoutMinutes * 60 * 1000,
      warningTime: Math.max(1, timeoutMinutes - 1) * 60 * 1000,
      debug: true,
      messages: {
        warningMessage: `【测试模式】您已经${Math.max(1, timeoutMinutes - 1)}分钟没有操作了，系统将在1分钟后自动退出，请点击任意位置继续使用`,
        expiredMessage: '【测试模式】会话已过期，请进行任意操作以重新登录',
        logoutMessage: '【测试模式】会话已过期，系统自动退出',
        forceReloginTitle: '会话过期（测试模式）',
        forceReloginContent: '【测试模式】您的会话已过期，为了您的账户安全，需要重新登录。',
        forceReloginConfirm: '重新登录'
      }
    }
    
    // 应用测试配置
    updateActivityConfig(testConfig)
    
    // 重启活动监听
    userActivityMonitor.stop()
    userActivityMonitor.start()
    
    this.testActive = true
    
    console.log(`⏰ [生产测试] 测试配置已应用，${timeoutMinutes}分钟后会话将过期`)
    console.log('🔔 [生产测试] 请在测试期间不要进行任何操作，观察过期提醒')
    console.log('⚠️ [生产测试] 测试完成后请调用 restoreOriginalConfig() 恢复原始配置')
    
    // 设置自动恢复（安全措施）
    this.backupTimer = setTimeout(() => {
      this.restoreOriginalConfig()
      console.log('🔄 [生产测试] 自动恢复原始配置（安全措施）')
    }, (timeoutMinutes + 2) * 60 * 1000)
    
    return {
      testDuration: timeoutMinutes,
      warningAt: Math.max(1, timeoutMinutes - 1),
      expireAt: timeoutMinutes,
      restore: () => this.restoreOriginalConfig()
    }
  }

  /**
   * 方案2：模拟长时间无活动（通过修改localStorage）
   */
  simulateLongInactivity(minutesAgo = 16) {
    console.log(`🧪 [生产测试] 模拟${minutesAgo}分钟前的活动时间`)
    
    const config = getActivityConfig()
    const pastTime = Date.now() - (minutesAgo * 60 * 1000)
    
    // 设置过去的活动时间
    localStorage.setItem('lastActivityTime', pastTime.toString())
    
    console.log(`📅 [生产测试] 设置最后活动时间: ${new Date(pastTime).toLocaleString()}`)
    console.log(`⏰ [生产测试] 当前时间: ${new Date().toLocaleString()}`)
    console.log(`⏳ [生产测试] 模拟已过时间: ${minutesAgo} 分钟`)
    
    // 触发活动检查
    setTimeout(() => {
      const remaining = userActivityMonitor.getRemainingTime()
      console.log(`🔍 [生产测试] 剩余时间: ${remaining} 毫秒`)
      console.log(`🔒 [生产测试] 是否过期: ${userActivityMonitor.isExpired ? '是' : '否'}`)
      
      if (remaining <= 0) {
        console.log('✅ [生产测试] 会话应该已过期，观察是否显示过期提示')
      }
    }, 1000)
    
    return {
      simulatedTime: new Date(pastTime).toLocaleString(),
      minutesAgo: minutesAgo,
      reset: () => {
        localStorage.setItem('lastActivityTime', Date.now().toString())
        console.log('🔄 [生产测试] 已重置活动时间为当前时间')
      }
    }
  }

  /**
   * 方案3：监控模式 - 不修改配置，只监控当前状态
   */
  startMonitorMode(intervalSeconds = 30) {
    console.log(`👁️ [生产测试] 开始监控模式，每${intervalSeconds}秒检查一次状态`)
    
    const startTime = Date.now()
    let checkCount = 0
    
    this.testTimer = setInterval(() => {
      checkCount++
      const config = getActivityConfig()
      const lastActivityTime = localStorage.getItem('lastActivityTime')
      
      if (lastActivityTime) {
        const now = Date.now()
        const lastTime = parseInt(lastActivityTime)
        const elapsed = now - lastTime
        const remaining = Math.max(0, config.sessionTimeout - elapsed)
        
        console.log(`📊 [监控 #${checkCount}] 状态检查:`)
        console.log(`  已过时间: ${Math.round(elapsed / 1000 / 60)} 分钟`)
        console.log(`  剩余时间: ${Math.round(remaining / 1000 / 60)} 分钟`)
        console.log(`  监听状态: ${userActivityMonitor.isActive ? '✅' : '❌'}`)
        console.log(`  会话状态: ${userActivityMonitor.isExpired ? '❌过期' : '✅正常'}`)
        
        // 接近过期时提醒
        if (remaining <= 2 * 60 * 1000 && remaining > 0) {
          console.warn(`⚠️ [监控警告] 会话将在 ${Math.round(remaining / 1000 / 60)} 分钟后过期`)
        }
      }
    }, intervalSeconds * 1000)
    
    console.log('🛑 [生产测试] 调用 stopMonitorMode() 停止监控')
    
    return {
      startTime: new Date(startTime).toLocaleString(),
      interval: intervalSeconds,
      stop: () => this.stopMonitorMode()
    }
  }

  /**
   * 停止监控模式
   */
  stopMonitorMode() {
    if (this.testTimer) {
      clearInterval(this.testTimer)
      this.testTimer = null
      console.log('🛑 [生产测试] 监控模式已停止')
    }
  }

  /**
   * 恢复原始配置
   */
  restoreOriginalConfig() {
    if (this.originalConfig) {
      console.log('🔄 [生产测试] 恢复原始配置...')
      
      // 恢复配置
      updateActivityConfig(this.originalConfig)
      
      // 重启活动监听
      userActivityMonitor.stop()
      userActivityMonitor.start()
      
      // 清理定时器
      if (this.backupTimer) {
        clearTimeout(this.backupTimer)
        this.backupTimer = null
      }
      
      this.testActive = false
      this.originalConfig = null
      
      console.log('✅ [生产测试] 原始配置已恢复')
    } else {
      console.warn('⚠️ [生产测试] 没有找到原始配置，可能未进行过测试')
    }
  }

  /**
   * 获取当前状态报告
   */
  getStatusReport() {
    const config = getActivityConfig()
    const lastActivityTime = localStorage.getItem('lastActivityTime')
    
    const report = {
      timestamp: new Date().toLocaleString(),
      config: {
        enabled: isActivityMonitorEnabled(),
        sessionTimeout: `${config.sessionTimeout / 1000 / 60} 分钟`,
        warningTime: `${config.warningTime / 1000 / 60} 分钟`,
        debug: config.debug
      },
      monitor: {
        isActive: userActivityMonitor.isActive,
        isExpired: userActivityMonitor.isExpired,
        warningShown: userActivityMonitor.warningShown,
        forceReloginShown: userActivityMonitor.forceReloginShown
      },
      session: null,
      testMode: this.testActive
    }
    
    if (lastActivityTime) {
      const now = Date.now()
      const lastTime = parseInt(lastActivityTime)
      const elapsed = now - lastTime
      const remaining = Math.max(0, config.sessionTimeout - elapsed)
      
      report.session = {
        lastActivity: new Date(lastTime).toLocaleString(),
        elapsedMinutes: Math.round(elapsed / 1000 / 60),
        remainingMinutes: Math.round(remaining / 1000 / 60),
        shouldExpire: elapsed > config.sessionTimeout
      }
    }
    
    return report
  }

  /**
   * 打印状态报告
   */
  printStatusReport() {
    const report = this.getStatusReport()
    
    console.log('=' .repeat(60))
    console.log('📋 [生产测试] 活动监听状态报告')
    console.log('=' .repeat(60))
    console.log(`🕐 检查时间: ${report.timestamp}`)
    console.log(`🧪 测试模式: ${report.testMode ? '✅ 激活' : '❌ 未激活'}`)
    console.log('')
    console.log('⚙️ 配置状态:')
    console.log(`  功能启用: ${report.config.enabled ? '✅' : '❌'}`)
    console.log(`  会话超时: ${report.config.sessionTimeout}`)
    console.log(`  警告时间: ${report.config.warningTime}`)
    console.log(`  调试模式: ${report.config.debug ? '✅' : '❌'}`)
    console.log('')
    console.log('🔍 监听状态:')
    console.log(`  监听激活: ${report.monitor.isActive ? '✅' : '❌'}`)
    console.log(`  会话过期: ${report.monitor.isExpired ? '❌' : '✅'}`)
    console.log(`  警告显示: ${report.monitor.warningShown ? '✅' : '❌'}`)
    console.log(`  强制登录: ${report.monitor.forceReloginShown ? '✅' : '❌'}`)
    
    if (report.session) {
      console.log('')
      console.log('⏰ 会话状态:')
      console.log(`  最后活动: ${report.session.lastActivity}`)
      console.log(`  已过时间: ${report.session.elapsedMinutes} 分钟`)
      console.log(`  剩余时间: ${report.session.remainingMinutes} 分钟`)
      console.log(`  应该过期: ${report.session.shouldExpire ? '是' : '否'}`)
    }
    
    console.log('=' .repeat(60))
    
    return report
  }

  /**
   * 清理所有测试状态
   */
  cleanup() {
    this.stopMonitorMode()
    this.restoreOriginalConfig()
    console.log('🧹 [生产测试] 所有测试状态已清理')
  }
}

// 创建单例实例
const productionTest = new ProductionActivityTest()

// 在生产环境下也暴露到全局（但使用不同的命名空间）
if (typeof window !== 'undefined') {
  window.productionActivityTest = {
    // 快速测试方法
    quickTest: (minutes = 2) => productionTest.quickTimeoutTest(minutes),
    
    // 模拟长时间无活动
    simulate: (minutesAgo = 16) => productionTest.simulateLongInactivity(minutesAgo),
    
    // 监控模式
    monitor: (intervalSeconds = 30) => productionTest.startMonitorMode(intervalSeconds),
    stopMonitor: () => productionTest.stopMonitorMode(),
    
    // 状态检查
    status: () => productionTest.printStatusReport(),
    report: () => productionTest.getStatusReport(),
    
    // 恢复和清理
    restore: () => productionTest.restoreOriginalConfig(),
    cleanup: () => productionTest.cleanup(),
    
    // 实例访问
    instance: productionTest
  }
  
  console.log('🏭 [生产测试] 生产环境测试工具已加载')
  console.log('🧪 [生产测试] 使用 window.productionActivityTest 访问测试功能')
  console.log('')
  console.log('📚 [生产测试] 可用方法:')
  console.log('  🚀 quickTest(分钟) - 快速超时测试（推荐）')
  console.log('  🎭 simulate(分钟前) - 模拟长时间无活动')
  console.log('  👁️ monitor(间隔秒) - 开始监控模式')
  console.log('  🛑 stopMonitor() - 停止监控')
  console.log('  📊 status() - 打印状态报告')
  console.log('  🔄 restore() - 恢复原始配置')
  console.log('  🧹 cleanup() - 清理所有测试状态')
  console.log('')
  console.log('💡 [生产测试] 推荐测试流程:')
  console.log('  1. window.productionActivityTest.status() - 检查当前状态')
  console.log('  2. window.productionActivityTest.quickTest(2) - 开始2分钟快速测试')
  console.log('  3. 等待2分钟观察过期提醒和自动退出')
  console.log('  4. window.productionActivityTest.restore() - 恢复原始配置')
}

export default productionTest
