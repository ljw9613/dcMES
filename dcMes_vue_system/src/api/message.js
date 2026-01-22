/*
 * @name: **列表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-08 16:24:24
 */
import request from '@/utils/request'

export function getMessages(data) {
  return request({
    url: '/messageLogList',
    method: 'post',
    data
  })
}

export function markMessageRead(data) {
  return request({
    url: '/messageId/read',
    method: 'post',
    data
  })
}

export function markAllMessagesRead(data) {
  return request({
    url: '/read-all',
    method: 'post',
    data
  })
}

