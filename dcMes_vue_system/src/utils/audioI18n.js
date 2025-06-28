/*
 * @name: 音频国际化管理工具
 * @content: 根据当前语言动态选择音频文件的工具函数
 * @Author: ljw
 * @Email: 1798245303@qq.com
 * @Date: 2025-01-23
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
 * 播放音频（国际化版本）
 * @param {string} audioKey 音频文件键名
 * @param {string} customLanguage 自定义语言（可选）
 */
export async function playAudio(audioKey, customLanguage = null) {
  try {
    const language = customLanguage || getCurrentLanguage()
    const audioUrl = await loadAudioFile(audioKey, language)
    
    if (!audioUrl) {
      console.error(`无法加载音频文件: ${audioKey}`)
      return
    }

    const audioElement = new Audio(audioUrl)
    audioElement.play().catch(error => {
      console.warn('音频播放失败:', error)
    })
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
 * 获取支持的音频文件列表
 * @returns {Array<string>} 音频文件键名数组
 */
export function getSupportedAudioKeys() {
  return Object.keys(zhAudioFiles)
}

// 兼容原有的tone函数，保持向后兼容
export function tone(audioKeyOrUrl) {
  // 如果传入的是URL（包含.mp3），则直接播放
  if (typeof audioKeyOrUrl === 'string' && audioKeyOrUrl.includes('.mp3')) {
    const audioElement = new Audio(audioKeyOrUrl)
    audioElement.play().catch(error => {
      console.warn('音频播放失败:', error)
    })
    return
  }
  
  // 否则作为音频键名处理
  playAudio(audioKeyOrUrl)
}
