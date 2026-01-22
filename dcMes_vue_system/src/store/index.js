/*
 * @name: **列表
 * @content:
 * @Author: joyce
 * @Date: 2020-09-02 12:42:00
 */
import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import dict from './modules/dict'
import app from './modules/app'
import settings from './modules/settings'
import user from './modules/user'
import tagsView from './modules/tagsView'
import permission from './modules/permission'
import language from './modules/language'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    app,
    settings,
    dict,
    user,
    tagsView,
    permission,
    language
  },
  getters
})

export default store
