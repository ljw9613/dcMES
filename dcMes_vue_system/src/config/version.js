/**
 * 系统版本配置文件
 * 用于管理前端版本信息，支持版本升级和维护
 * 
 * @description 德昌MES系统版本管理配置
 * @author 系统管理员
 * @since 2024年9月
 */

/**
 * 获取当前日期（格式：YYYY-MM-DD）
 * @returns {string} 当前日期字符串
 */
function getCurrentDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取当前构建日期（格式：YYYYMMDD）
 * @returns {string} 构建日期字符串
 */
function getBuildDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// 主版本号：当你做了不兼容的 API 修改
// 次版本号：当你做了向下兼容的功能性新增  
// 修订号：当你做了向下兼容的问题修正
const VERSION_CONFIG = {
  // 主要版本信息
  major: 1,           // 主版本号
  minor: 1,           // 次版本号  
  patch: 2,           // 修订版本号
  
  // 构建信息（自动获取当前日期）
  build: getBuildDate(),  // 构建日期 YYYYMMDD（自动更新）
  
  // 版本状态标识
  status: '产线生产版',   
  
  // 发布信息（自动获取当前日期）
  releaseDate: getCurrentDate(),  // 发布日期（自动更新）
  codeName: 'Raptor',        // 版本代号
  
  // 环境标识
  environment: '正式环境',  // 当前环境 测试环境
  
  // 版本描述
  description: '德昌MES制造执行系统 - 生产管理一体化解决方案'
}

/**
 * 获取完整版本号字符串
 * @returns {string} 格式：v4.2.1
 */
export function getVersion() {
  return `v${VERSION_CONFIG.major}.${VERSION_CONFIG.minor}.${VERSION_CONFIG.patch}`
}

/**
 * 获取完整版本信息字符串
 * @returns {string} 格式：v4.2.1-stable (20240919)
 */
export function getFullVersion() {
  const version = getVersion()
  const status = VERSION_CONFIG.status !== 'stable' ? `-${VERSION_CONFIG.status}` : ''
  return `${version}${status} (${VERSION_CONFIG.build})`
}

/**
 * 获取详细版本信息
 * @returns {Object} 版本详细信息对象
 */
export function getVersionInfo() {
  return {
    ...VERSION_CONFIG,
    version: getVersion(),
    fullVersion: getFullVersion()
  }
}

/**
 * 检查是否为开发环境
 * @returns {boolean}
 */
export function isDevelopment() {
  return VERSION_CONFIG.environment === 'development'
}

/**
 * 检查是否为生产环境
 * @returns {boolean}
 */
export function isProduction() {
  return VERSION_CONFIG.environment === 'production'
}

/**
 * 获取版本显示颜色（用于UI样式）
 * @returns {string} 颜色值
 */
export function getVersionColor() {
  const colorMap = {
    'dev': '#E6A23C',       // 橙色 - 开发版
    'beta': '#F56C6C',      // 红色 - 测试版
    'rc': '#909399',        // 灰色 - 候选版
    'stable': '#67C23A'     // 绿色 - 稳定版
  }
  return colorMap[VERSION_CONFIG.status] || '#909399'
}

// 默认导出版本配置
export default VERSION_CONFIG
