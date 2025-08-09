/*
 * @name: 音频国际化管理工具
 * @content: 根据当前语言动态选择音频文件的工具函数，支持队列播放
 * @Author: ljw
 * @Email: 1798245303@qq.com
 * @Date: 2025-01-23
 * @LastUpdate: 2025-01-23
 * 
 * 功能特性：
 * - 多语言音频支持（中文/越南语）
 * - 队列播放机制，避免音频重叠
 * - 音频文件缓存，提升性能
 * - 可配置播放间隔时间
 * - 队列管理（停止、清空、状态查询）
 * - 向后兼容原有API
 * 
 * 使用示例：
 * playAudio('smcg') // 加入队列播放
 * playAudioImmediately('tmyw') // 立即播放
 * setAudioConfig({ interval: 500 }) // 设置播放间隔为500ms
 * stopAllAudio() // 停止所有音频
 */

import store from '@/store'

// 中文音频文件映射
const zhAudioFiles = {
  smcg: () => import('@/assets/tone/smcg.mp3'),
  tmyw: () => import('@/assets/tone/tmyw.mp3'),
  bdcg: () => import('@/assets/tone/bdcg.mp3'),
  cfbd: () => import('@/assets/tone/cfbd.mp3'),
  pcwlxz: () => import('@/assets/tone/pcwlxz.mp3'),
  cxwgd: () => import('@/assets/tone/cxwgd.mp3'),
  dwx: () => import('@/assets/tone/dwx.mp3'),
  wxsb: () => import('@/assets/tone/wxsb.mp3'),
  smztm: () => import('@/assets/tone/smztm.mp3'),
  lcyw: () => import('@/assets/tone/lcyw.mp3'),
  lcywc: () => import('@/assets/tone/lcywc.mp3'),
  slbpp: () => import('@/assets/tone/slbpp.mp3')
}

// 越南语音频文件映射
const vnAudioFiles = {
  smcg: () => import('@/assets/toneVN/smcg_VN.mp3'),
  tmyw: () => import('@/assets/toneVN/tmyw_VN.mp3'),
  bdcg: () => import('@/assets/toneVN/bdcg_VN.mp3'),
  cfbd: () => import('@/assets/toneVN/cfbd_VN.mp3'),
  pcwlxz: () => import('@/assets/toneVN/pcwlxz_VN.mp3'),
  cxwgd: () => import('@/assets/toneVN/cxwgd_VN.mp3'),
  dwx: () => import('@/assets/toneVN/dwx_VN.mp3'), // 越南语版本不存在，使用中文版本
  wxsb: () => import('@/assets/toneVN/wxsb_VN.mp3'),
  smztm: () => import('@/assets/toneVN/smztm_VN.mp3'),
  lcyw: () => import('@/assets/toneVN/lcyw_VN.mp3'), // 越南语版本不存在，使用中文版本
  lcywc: () => import('@/assets/toneVN/lcywc_VN.mp3'), // 越南语版本不存在，使用中文版本
  slbpp: () => import('@/assets/toneVN/slbpp_VN.mp3') // 越南语版本不存在，使用中文版本
}

// 音频文件缓存
const audioCache = new Map()

// 音频播放队列
const audioQueue = []
let isPlaying = false
let currentAudio = null

// 播放配置
const playConfig = {
  interval: 100, // 音频之间的间隔时间（毫秒）
  maxQueueSize: 10, // 最大队列长度
  autoCleanQueue: true // 是否自动清理过期的队列项
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
function getCurrentLanguage() {
  return store.getters['language/language'] || 'zh-CN'
}

/**
 * 根据语言获取音频文件映射
 * @param {string} language 语言代码
 * @returns {object} 音频文件映射对象
 */
function getAudioFileMap(language) {
  return language === 'vi-VN' ? vnAudioFiles : zhAudioFiles
}

/**
 * 动态加载音频文件
 * @param {string} audioKey 音频文件键名
 * @param {string} language 语言代码
 * @returns {Promise<string>} 音频文件URL
 */
async function loadAudioFile(audioKey, language) {
  const cacheKey = `${audioKey}_${language}`
  
  // 检查缓存
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)
  }

  try {
    const audioFileMap = getAudioFileMap(language)
    
    if (!audioFileMap[audioKey]) {
      console.warn(`音频文件 ${audioKey} 在语言 ${language} 中不存在，使用中文版本`)
      const zhAudioFile = await zhAudioFiles[audioKey]()
      const audioUrl = zhAudioFile.default
      audioCache.set(cacheKey, audioUrl)
      return audioUrl
    }

    const audioFile = await audioFileMap[audioKey]()
    const audioUrl = audioFile.default
    
    // 缓存音频文件URL
    audioCache.set(cacheKey, audioUrl)
    return audioUrl
  } catch (error) {
    console.warn(`加载音频文件 ${audioKey} 失败，使用中文版本:`, error)
    
    // 如果加载失败，尝试使用中文版本
    try {
      const zhAudioFile = await zhAudioFiles[audioKey]()
      const audioUrl = zhAudioFile.default
      audioCache.set(cacheKey, audioUrl)
      return audioUrl
    } catch (zhError) {
      console.error(`加载中文音频文件 ${audioKey} 也失败:`, zhError)
      return null
    }
  }
}

/**
 * 处理音频播放队列
 */
async function processAudioQueue() {
  if (isPlaying || audioQueue.length === 0) {
    return
  }

  isPlaying = true

  try {
    while (audioQueue.length > 0) {
      const audioItem = audioQueue.shift()
      
      try {
        await playAudioDirectly(audioItem.audioKey, audioItem.language)
        
        // 播放间隔
        if (audioQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, playConfig.interval))
        }
      } catch (error) {
        console.warn(`播放音频 ${audioItem.audioKey} 失败:`, error)
      }
    }
  } finally {
    isPlaying = false
    currentAudio = null
  }
}

/**
 * 直接播放音频（内部方法）
 * @param {string} audioKey 音频文件键名
 * @param {string} language 语言代码
 * @returns {Promise} 播放完成的Promise
 */
async function playAudioDirectly(audioKey, language) {
  return new Promise(async (resolve, reject) => {
    try {
      const audioUrl = await loadAudioFile(audioKey, language)
      
      if (!audioUrl) {
        reject(new Error(`无法加载音频文件: ${audioKey}`))
        return
      }

      const audioElement = new Audio(audioUrl)
      currentAudio = audioElement

      audioElement.onended = () => {
        resolve()
      }

      audioElement.onerror = (error) => {
        reject(error)
      }

      audioElement.onabort = () => {
        resolve() // 被中断也算完成
      }

      audioElement.play().catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 播放音频（国际化版本，支持队列）
 * @param {string} audioKey 音频文件键名
 * @param {string} customLanguage 自定义语言（可选）
 * @param {boolean} immediate 是否立即播放（跳过队列）
 */
export async function playAudio(audioKey, customLanguage = null, immediate = false) {
  try {
    const language = customLanguage || getCurrentLanguage()
    
    // 立即播放模式（兼容紧急情况）
    if (immediate) {
      await playAudioDirectly(audioKey, language)
      return
    }

    // 检查队列长度，防止队列过长
    if (audioQueue.length >= playConfig.maxQueueSize) {
      if (playConfig.autoCleanQueue) {
        // 移除最旧的音频项
        audioQueue.shift()
        console.warn(`音频队列已满，移除最旧的音频项`)
      } else {
        console.warn(`音频队列已满，跳过播放: ${audioKey}`)
        return
      }
    }

    // 添加到队列
    audioQueue.push({
      audioKey,
      language,
      timestamp: Date.now()
    })

    // 处理队列
    processAudioQueue()
  } catch (error) {
    console.error('播放音频时发生错误:', error)
  }
}

/**
 * 预加载音频文件
 * @param {Array<string>} audioKeys 要预加载的音频文件键名数组
 * @param {string} language 语言代码
 */
export async function preloadAudioFiles(audioKeys, language = null) {
  const targetLanguage = language || getCurrentLanguage()
  
  const loadPromises = audioKeys.map(audioKey => 
    loadAudioFile(audioKey, targetLanguage).catch(error => {
      console.warn(`预加载音频文件 ${audioKey} 失败:`, error)
    })
  )
  
  await Promise.all(loadPromises)
  console.log(`已预加载 ${audioKeys.length} 个音频文件 (${targetLanguage})`)
}

/**
 * 清除音频缓存
 */
export function clearAudioCache() {
  audioCache.clear()
  console.log('音频缓存已清除')
}

/**
 * 停止当前播放并清空队列
 */
export function stopAllAudio() {
  // 停止当前播放的音频
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  
  // 清空队列
  audioQueue.length = 0
  isPlaying = false
  
  console.log('已停止所有音频播放并清空队列')
}

/**
 * 清空音频队列（但不停止当前播放）
 */
export function clearAudioQueue() {
  audioQueue.length = 0
  console.log('音频播放队列已清空')
}

/**
 * 获取队列状态
 * @returns {Object} 队列状态信息
 */
export function getAudioQueueStatus() {
  return {
    queueLength: audioQueue.length,
    isPlaying: isPlaying,
    currentAudio: currentAudio ? 'playing' : 'none',
    config: { ...playConfig }
  }
}

/**
 * 设置播放配置
 * @param {Object} newConfig 新的配置选项
 */
export function setAudioConfig(newConfig) {
  Object.assign(playConfig, newConfig)
  console.log('音频播放配置已更新:', playConfig)
}

/**
 * 立即播放音频（跳过队列）
 * @param {string} audioKey 音频文件键名
 * @param {string} customLanguage 自定义语言（可选）
 */
export async function playAudioImmediately(audioKey, customLanguage = null) {
  return playAudio(audioKey, customLanguage, true)
}

/**
 * 获取支持的音频文件列表
 * @returns {Array<string>} 音频文件键名数组
 */
export function getSupportedAudioKeys() {
  return Object.keys(zhAudioFiles)
}

// 兼容原有的tone函数，保持向后兼容
export function tone(audioKeyOrUrl, immediate = false) {
  // 如果传入的是URL（包含.mp3），则直接播放
  if (typeof audioKeyOrUrl === 'string' && audioKeyOrUrl.includes('.mp3')) {
    const audioElement = new Audio(audioKeyOrUrl)
    audioElement.play().catch(error => {
      console.warn('音频播放失败:', error)
    })
    return
  }
  
  // 否则作为音频键名处理，加入队列播放
  playAudio(audioKeyOrUrl, null, immediate)
}

/**
 * 音频队列使用示例
 * 
 * // 基本用法（推荐）
 * playAudio('smcg') // 扫描成功音
 * playAudio('tmyw') // 条码异常音 - 会在上一个音频播放完成后播放
 * 
 * // 立即播放（紧急情况）
 * playAudioImmediately('tmyw') // 立即播放，不排队
 * 
 * // 配置播放间隔
 * setAudioConfig({ interval: 500 }) // 音频间隔500ms
 * 
 * // 队列管理
 * clearAudioQueue() // 清空队列但不停止当前播放
 * stopAllAudio() // 停止所有音频并清空队列
 * 
 * // 查看队列状态
 * const status = getAudioQueueStatus()
 * console.log(`队列长度: ${status.queueLength}, 正在播放: ${status.isPlaying}`)
 */
