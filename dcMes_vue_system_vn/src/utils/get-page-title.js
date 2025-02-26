/*
 * @name: **列表
 * @content: 
 * @Author: joyce
 * @Date: 2020-09-02 12:42:00
 */
import defaultSettings from '@/settings'

const title = defaultSettings.title || '德昌MES系统'

export default function getPageTitle(pageTitle) {
  if (pageTitle) {
    return `${pageTitle} - ${title}`
  }
  return `${title}`
}
