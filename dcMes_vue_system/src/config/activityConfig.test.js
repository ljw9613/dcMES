/*
 * @name: 用户活动监听测试配置
 * @content: 用于快速测试页面刷新后活动监听恢复功能的配置
 * @Author: AI Assistant
 * @Date: 2024-09-26
 */

/**
 * 测试配置 - 短时间超时，便于快速验证功能
 * 使用方法：
 * 1. 在浏览器控制台执行：window.activityConfig.update(testConfig)
 * 2. 刷新页面
 * 3. 观察控制台日志，验证活动监听是否正常恢复
 */
const testConfig = {
  // 启用活动时间过期校验
  enabled: true,
  
  // 会话超时时间（毫秒）- 2分钟（测试用）
  sessionTimeout: 2 * 60 * 1000,
  
  // 警告时间（毫秒）- 1分钟（测试用）
  warningTime: 1 * 60 * 1000,
  
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
  debug: true,
  
  // 自定义提示信息
  messages: {
    warningMessage: '【测试模式】您已经1分钟没有操作了，系统将在1分钟后自动退出，请点击任意位置继续使用',
    expiredMessage: '【测试模式】会话已过期，请进行任意操作以重新登录',
    logoutMessage: '【测试模式】会话已过期，系统自动退出',
    forceReloginTitle: '会话过期（测试模式）',
    forceReloginContent: '【测试模式】您的会话已过期，为了您的账户安全，需要重新登录。',
    forceReloginConfirm: '重新登录'
  }
}

/**
 * 生产环境配置 - 正常的15分钟超时
 */
const productionConfig = {
  enabled: true,
  sessionTimeout: 15 * 60 * 1000,
  warningTime: 14 * 60 * 1000,
  checkOnPageLoad: true,
  interceptRouting: true,
  interceptApiRequests: true,
  monitorVisibilityChange: true,
  debug: false,
  messages: {
    warningMessage: '您已经14分钟没有操作了，系统将在1分钟后自动退出，请点击任意位置继续使用',
    expiredMessage: '会话已过期，请进行任意操作以重新登录',
    logoutMessage: '会话已过期，系统自动退出',
    forceReloginTitle: '会话过期',
    forceReloginContent: '您的会话已过期，为了您的账户安全，需要重新登录。',
    forceReloginConfirm: '重新登录'
  }
}

// 在开发环境下暴露测试配置到全局
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.testActivityConfig = {
    test: testConfig,
    production: productionConfig,
    applyTest: () => {
      if (window.activityConfig && window.activityConfig.update) {
        window.activityConfig.update(testConfig)
        console.log('🧪 [测试配置] 已应用测试配置（2分钟超时）')
        console.log('🔄 [测试配置] 请刷新页面验证活动监听恢复功能')
      } else {
        console.error('❌ [测试配置] 活动配置工具未找到')
      }
    },
    applyProduction: () => {
      if (window.activityConfig && window.activityConfig.update) {
        window.activityConfig.update(productionConfig)
        console.log('🏭 [测试配置] 已恢复生产配置（15分钟超时）')
      } else {
        console.error('❌ [测试配置] 活动配置工具未找到')
      }
    }
  }
  
  console.log('🧪 [测试配置] 测试工具已暴露到 window.testActivityConfig')
  console.log('📚 [测试配置] 可用方法:')
  console.log('  - window.testActivityConfig.applyTest() - 应用测试配置')
  console.log('  - window.testActivityConfig.applyProduction() - 恢复生产配置')
  console.log('  - window.testActivityConfig.test - 查看测试配置')
  console.log('  - window.testActivityConfig.production - 查看生产配置')
}

export { testConfig, productionConfig }
export default testConfig
