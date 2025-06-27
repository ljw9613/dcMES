/*
 * @name: 语言状态管理模块
 * @content: 管理当前语言状态和语言切换逻辑
 * @Author: ljw
 * @Email: 1798245303@qq.com
 * @Date: 2025-01-23
 */

import { getDefaultLanguage, setLanguage, languages } from '@/lang'
import { updateRouteI18nTitles } from '@/store/modules/permission'
import ElementUI from 'element-ui'
import zhLocale from 'element-ui/lib/locale/lang/zh-CN'
import enLocale from 'element-ui/lib/locale/lang/en'

const state = {
  language: getDefaultLanguage(),
  supportedLanguages: languages
}

const mutations = {
  SET_LANGUAGE: (state, language) => {
    state.language = language
  }
}

const actions = {
  // 设置语言
  setLanguage({ commit }, language) {
    commit('SET_LANGUAGE', language)
    setLanguage(language)

    // 设置Element UI语言
    const elementLocale = language === 'zh-CN' ? zhLocale : enLocale
    ElementUI.locale(elementLocale)

    // 更新菜单路由标题
    try {
      updateRouteI18nTitles()
      console.log('菜单路由标题已更新为:', language)
    } catch (error) {
      console.error('更新菜单路由标题失败:', error)
    }

    // 刷新页面以确保所有组件都使用新语言
    // 注意：在生产环境中可能需要更优雅的处理方式
    setTimeout(() => {
      window.location.reload()
    }, 100)
  },

  // 切换语言
  toggleLanguage({ commit, state }) {
    const currentIndex = languages.findIndex(lang => lang.value === state.language)
    const nextIndex = (currentIndex + 1) % languages.length
    const nextLanguage = languages[nextIndex].value

    commit('SET_LANGUAGE', nextLanguage)
    setLanguage(nextLanguage)

    // 设置Element UI语言
    const elementLocale = nextLanguage === 'zh-CN' ? zhLocale : enLocale
    ElementUI.locale(elementLocale)

    // 更新菜单路由标题
    try {
      updateRouteI18nTitles()
      console.log('菜单路由标题已更新为:', nextLanguage)
    } catch (error) {
      console.error('更新菜单路由标题失败:', error)
    }

    setTimeout(() => {
      window.location.reload()
    }, 100)
  }
}

const getters = {
  language: state => state.language,
  supportedLanguages: state => state.supportedLanguages,
  currentLanguageLabel: state => {
    const lang = languages.find(item => item.value === state.language)
    return lang ? lang.label : state.language
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
