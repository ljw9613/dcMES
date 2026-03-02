/*
 * @name: 用户活动监听配置
 * @content: 控制用户活动监听和自动退出功能的配置
 * @Author: AI Assistant
 * @Date: 2024-09-22
 */

/**
 * 用户活动监听配置
 */
const activityConfig = {
  // 是否启用活动时间过期校验
  enabled: true,
  
  // 会话超时时间（毫秒）- 15分钟
  sessionTimeout: 1 * 60 * 1000,
  
  // 警告时间（毫秒）- 14分钟
  warningTime: 0.5 * 60 * 1000,

  // 监听的事件类型
  monitorEvents: [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ],
  
  // 是否在页面刷新时检查活动超时
  checkOnPageLoad: true,
  
  // 是否拦截路由跳转（当会话过期时）
  interceptRouting: true,
  
  // 是否拦截API请求（当会话过期时）
  interceptApiRequests: true,
  
  // 是否监听页面可见性变化
  monitorVisibilityChange: true,
  
  // 调试模式
  // debug: process.env.NODE_ENV === 'development',
  debug: false,
  
  // 自定义提示信息
  messages: {
    warningMessage: '您已经14分钟没有操作了，系统将在1分钟后自动退出，请点击任意位置继续使用',
    expiredMessage: '会话已过期，请进行任意操作以重新登录',
    logoutMessage: '会话已过期，系统自动退出',
    forceReloginTitle: '会话过期',
    forceReloginContent: '您的会话已过期，为了您的账户安全，需要重新登录。',
    forceReloginConfirm: '重新登录'
  }
}

/**
 * 获取配置
 */
export function getActivityConfig() {
  return { ...activityConfig }
}

/**
 * 更新配置（运行时动态修改）
 */
export function updateActivityConfig(newConfig) {
  const oldConfig = { ...activityConfig }
  Object.assign(activityConfig, newConfig)
  
  console.log('🔄 [活动监听配置] 配置已更新')
  
  // 比较变更的配置项
  Object.keys(newConfig).forEach(key => {
    if (oldConfig[key] !== activityConfig[key]) {
      if (key === 'enabled') {
        console.log(`🎯 [活动监听配置] ${key}: ${oldConfig[key] ? '启用' : '禁用'} → ${activityConfig[key] ? '启用' : '禁用'}`)
      } else if (key === 'sessionTimeout' || key === 'warningTime') {
        console.log(`⏰ [活动监听配置] ${key}: ${oldConfig[key] / 1000 / 60} 分钟 → ${activityConfig[key] / 1000 / 60} 分钟`)
      } else {
        console.log(`📝 [活动监听配置] ${key}: ${JSON.stringify(oldConfig[key])} → ${JSON.stringify(activityConfig[key])}`)
      }
    }
  })
}

/**
 * 重置配置为默认值
 */
export function resetActivityConfig() {
  activityConfig.enabled = true
  activityConfig.sessionTimeout = 15 * 60 * 1000
  activityConfig.warningTime = 14 * 60 * 1000
  activityConfig.checkOnPageLoad = true
  activityConfig.interceptRouting = true
  activityConfig.interceptApiRequests = true
  activityConfig.monitorVisibilityChange = true
  console.log('活动监听配置已重置为默认值')
}

/**
 * 检查功能是否启用
 */
export function isActivityMonitorEnabled() {
  return activityConfig.enabled
}

/**
 * 启用活动监听
 */
export function enableActivityMonitor() {
  activityConfig.enabled = true
  console.log('✅ [活动监听配置] 长期未活动校验功能已启用')
  console.log(`⏰ [活动监听配置] 会话超时: ${activityConfig.sessionTimeout / 1000 / 60} 分钟`)
  console.log(`⚠️ [活动监听配置] 警告时间: ${activityConfig.warningTime / 1000 / 60} 分钟`)
}

/**
 * 禁用活动监听
 */
export function disableActivityMonitor() {
  activityConfig.enabled = false
  console.log('❌ [活动监听配置] 长期未活动校验功能已禁用')
  console.log('🔓 [活动监听配置] 用户会话将不会自动过期')
}

// 在开发环境下暴露配置到全局
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.activityConfig = {
    get: getActivityConfig,
    update: updateActivityConfig,
    reset: resetActivityConfig,
    enable: enableActivityMonitor,
    disable: disableActivityMonitor,
    isEnabled: isActivityMonitorEnabled
  }
  console.log('🛠️ [活动监听配置] 开发工具已暴露到 window.activityConfig')
  console.log('📚 [活动监听配置] 可用方法: get(), update(config), reset(), enable(), disable(), isEnabled()')
  console.log(`🎯 [活动监听配置] 当前状态: ${activityConfig.enabled ? '✅ 已启用' : '❌ 已禁用'}`)
  console.log(`⏰ [活动监听配置] 超时设置: ${activityConfig.sessionTimeout / 1000 / 60} 分钟`)
  
  // 导入并暴露测试配置工具
  import('./activityConfig.test.js').then(() => {
    console.log('🧪 [活动监听配置] 测试配置工具已加载')
    console.log('💡 [活动监听配置] 使用 window.testActivityConfig.applyTest() 快速测试页面刷新恢复功能')
  }).catch(err => {
    console.warn('⚠️ [活动监听配置] 测试配置工具加载失败:', err.message)
  })
}

export default activityConfig
