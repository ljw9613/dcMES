/**
 * 自定义权限指令
 * 使用方式：v-permission="'permission:code'"
 */
import { checkPermission } from '@/utils/permission'

export default {
  inserted(el, binding) {
    const permission = binding.value
    
    if (permission) {
      const hasPermission = checkPermission(permission)
      
      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    }
  }
} 