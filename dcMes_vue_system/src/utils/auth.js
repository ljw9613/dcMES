/*
 * @name: **列表
 * @content: 
 * @Author: joyce
 * @Date: 2020-09-02 12:42:00
 */

import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'
const TokenKey1 = 'Admin-UserId'

/**
 * 仅解码 JWT payload（不验签），用于前端判断是否过期，避免把过期 token 发给后端
 * @param {string} token - JWT 字符串
 * @returns {{ exp?: number, iat?: number } | null} payload 或 null
 */
export function decodeTokenPayload(token) {
  if (!token || typeof token !== 'string') return null
  try {
    const parts = token.replace(/^Bearer\s+/i, '').trim().split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

/**
 * 判断 token 是否已过期（仅看 exp 与当前时间）
 * @param {string} token - JWT 字符串
 * @returns {boolean} true 表示已过期或无效
 */
export function isTokenExpired(token) {
  const payload = decodeTokenPayload(token)
  if (!payload || typeof payload.exp !== 'number') return true
  const nowSec = Math.floor(Date.now() / 1000)
  return payload.exp < nowSec
}

/**
 * 从 Cookie 读取 token，不做过期删除。
 * 过期判断与清理仅在「发起请求时」由 request 拦截器处理，避免误删导致后续请求出现「未提供 Token」。
 */
export function getToken() {
  return Cookies.get(TokenKey) || undefined
}

export function setToken(token) {
  console.log('设置token到Cookie:', token ? `${token.substring(0, 20)}...` : 'null')
  // 设置较长的过期时间，确保刷新页面时token仍然存在
  return Cookies.set(TokenKey, token, { 
    expires: 30, // 30天过期
    secure: false, // 开发环境设为false，生产环境应设为true
    sameSite: 'lax' // 防止CSRF攻击
  })
}

export function removeToken() {
  console.log('从Cookie移除token')
  console.trace('removeToken调用堆栈:')
  return Cookies.remove(TokenKey)
}

export function getid() {
  const id = Cookies.get(TokenKey1)
  console.log('从Cookie获取用户ID:', id)
  return id
}

export function setid(id) {
  console.log('设置用户ID到Cookie:', id)
  return Cookies.set(TokenKey1, id, {
    expires: 30,
    secure: false,
    sameSite: 'lax'
  })
}

export function removeid() {
  console.log('从Cookie移除用户ID')
  console.trace('removeid调用堆栈:')
  return Cookies.remove(TokenKey1)
}

/** 多标签页同步：其它标签页监听到此 key 变化后执行本地清空并跳转登录 */
export const AUTH_CLEARED_KEY = 'auth_cleared'

/** 已知的与登录/会话相关的缓存 key，显式清理避免多标签或持久化残留旧 token */
const AUTH_RELATED_KEYS = [
  'store',                    // 可能的 Vuex 持久化或旧会话缓存
  'activity_session_expired', // 活动监听会话过期标记
  'lastActivityTime',         // 活动监听最后活动时间
]

/**
 * 退出登录后应该保留的 localStorage key（用户偏好设置与设备状态，与账号无关）
 * 这些 key 不随退出登录/Token 失效而重置
 */
const PERSIST_ACROSS_AUTH_KEYS = [
  'scan_float_config',                          // 扫码悬浮配置：提示音开关、错误提示模式
  // 扫码页面工序设置（设备级配置，换班操作员无需重新配置）
  'mainMaterialId',                             // 当前产品型号 ID
  'processStepId',                              // 当前工序 ID
  'materialName',                               // 产品物料名称
  'processName',                                // 工序名称
  'workProductionPlanWorkOrderId',              // 当前工单 ID
  'workProductionPlanWorkOrderNo',              // 当前工单号
  'productLineId',                              // 产线 ID
  'productLineName',                            // 产线名称
  'lineNum',                                    // 产线号（scanBarCode 专用）
  'autoInit',                                   // 自动初始化开关
  'autoPrint',                                  // 自动打印开关
  'scanMode',                                   // 扫码模式（scanBarCodeBatchNew 专用）
  'clearBatchCacheOnSubmit',                    // 提交后清除批次缓存开关
  'printTemplate_scanBarCodeBatch',             // 批次扫码打印模版
  'lastWorkProductionPlanWorkOrderId',          // 上次工单 ID（scanBarCode）
  'lastWorkProductionPlanWorkOrderId_batch',    // 上次工单 ID（scanBarCodeBatch）
  'lastWorkProductionPlanWorkOrderId_batchNew', // 上次工单 ID（scanBarCodeBatchNew）
]

/**
 * 退出登录后应保留的 localStorage key 前缀（动态 key，按前缀批量保留）
 * 批次物料缓存与产品数量配置属于设备生产状态，换班操作员应继续沿用
 */
const PERSIST_ACROSS_AUTH_KEY_PREFIXES = [
  'batch_',     // 批次物料条码缓存：batch_${mainMaterialId}_${processStepId}_${materialId}
  'batchSize_', // 每批产品数量配置：batchSize_${mainMaterialId}_${processStepId}
]

/**
 * 退出登录 / 超时重新登录时统一清空浏览器相关缓存，避免多标签或持久化导致旧 token 被使用
 * 调用场景：用户主动退出、Token 失效(401)、会话超时强制重新登录
 * @param {Object} [options]
 * @param {boolean} [options.notifyOtherTabs=true] 是否通知其它标签页（写入 auth_cleared，供 storage 事件监听）
 */
export function clearAllAuthAndCache(options = {}) {
  const { notifyOtherTabs = true } = options

  removeToken()
  removeid()
  try {
    Object.keys(Cookies.get()).forEach(name => Cookies.remove(name))
  } catch (e) { /* ignore */ }

  // 显式清除已知的登录/会话相关 key，避免多标签或持久化恢复旧 token
  try {
    AUTH_RELATED_KEYS.forEach(key => {
      sessionStorage.removeItem(key)
      localStorage.removeItem(key)
    })
  } catch (e) { /* ignore */ }

  try {
    sessionStorage.clear()
  } catch (e) { /* ignore */ }

  // 清空 localStorage 前先保存需要跨登录持久化的配置（固定 key + 前缀匹配的动态 key）
  const preserved = {}
  try {
    // 保留固定 key
    PERSIST_ACROSS_AUTH_KEYS.forEach(key => {
      const val = localStorage.getItem(key)
      if (val !== null) preserved[key] = val
    })
    // 保留前缀匹配的动态 key（批次物料缓存、产品数量等）
    Object.keys(localStorage).forEach(key => {
      if (PERSIST_ACROSS_AUTH_KEY_PREFIXES.some(prefix => key.startsWith(prefix))) {
        const val = localStorage.getItem(key)
        if (val !== null) preserved[key] = val
      }
    })
  } catch (e) { /* ignore */ }

  try {
    localStorage.clear()
  } catch (e) { /* ignore */ }

  // 恢复保留的配置
  try {
    Object.keys(preserved).forEach(key => {
      localStorage.setItem(key, preserved[key])
    })
  } catch (e) { /* ignore */ }

  // 通知其它标签页：本标签已退出/过期，请同步清空并跳转登录（仅当前标签主动退出时写入）
  if (notifyOtherTabs) {
    try {
      localStorage.setItem(AUTH_CLEARED_KEY, String(Date.now()))
    } catch (e) { /* ignore */ }
  }

  console.log('已清空登录与会话相关缓存（Cookie / localStorage / sessionStorage），设备生产配置与批次缓存已保留')
}