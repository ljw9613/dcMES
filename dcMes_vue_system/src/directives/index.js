/**
 * 全局自定义指令
 */
import permission from './permission'

const directives = {
  permission
}

export default {
  install(Vue) {
    Object.keys(directives).forEach(key => {
      Vue.directive(key, directives[key])
    })
  }
} 