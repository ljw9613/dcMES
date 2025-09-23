/*
 * @name: 国际化配置入口
 * @content: Vue i18n 国际化配置和工具函数
 * @Author: ljw
 * @Email: 1798245303@qq.com
 * @Date: 2025-01-23
 */

import Vue from 'vue'
import VueI18n from 'vue-i18n'
import Cookies from 'js-cookie'
import elementEnLocale from 'element-ui/lib/locale/lang/en' // element-ui英文语言包
import elementZhLocale from 'element-ui/lib/locale/lang/zh-CN' // element-ui中文语言包

// 导入自定义语言包
import zhCN from './zh-CN'
import enUS from './en-US'
import viVN from './vi-VN'

Vue.use(VueI18n)

// 支持的语言列表
export const languages = [
  {
    label: '中文',
    value: 'zh-CN',
    flag: '🇨🇳'
  },
  {
    label: 'English',
    value: 'en-US',
    flag: '🇺🇸'
  },
  {
    label: 'Tiếng Việt',
    value: 'vi-VN', 
    flag: '🇻🇳'
  }
]

// 语言资源
const messages = {
  'zh-CN': {
    ...zhCN,
    el: elementZhLocale.el
  },
  'en-US': {
    ...enUS,
    el: elementEnLocale.el
  },
  'vi-VN': {
    ...viVN,
    el: elementEnLocale.el // 越南语暂时使用英文的element-ui语言包
  }
}

// 获取默认语言
export function getDefaultLanguage() {
  const chooseLanguage = Cookies.get('language')
  if (chooseLanguage) return chooseLanguage

  // 如果没有选择过语言，则根据浏览器语言自动选择
  const language = (navigator.language || navigator.browserLanguage).toLowerCase()
  const locales = Object.keys(messages)
  for (const locale of locales) {
    if (language.indexOf(locale) > -1) {
      return locale
    }
  }
  return 'zh-CN' // 默认中文
}

// 创建i18n实例
const i18n = new VueI18n({
  locale: getDefaultLanguage(),
  fallbackLocale: 'zh-CN', // 设置备用语言
  messages,
  silentTranslationWarn: true // 关闭翻译警告
})

// 设置语言
export function setLanguage(lang) {
  i18n.locale = lang
  Cookies.set('language', lang, { expires: 365 }) // 保存一年
  document.querySelector('html').setAttribute('lang', lang)
  return lang
}

// 获取当前语言
export function getCurrentLanguage() {
  return i18n.locale
}

// 获取语言显示名称
export function getLanguageLabel(lang) {
  const language = languages.find(item => item.value === lang)
  return language ? language.label : lang
}

// 检查是否支持该语言
export function isSupportedLanguage(lang) {
  return Object.keys(messages).includes(lang)
}

export default i18n
