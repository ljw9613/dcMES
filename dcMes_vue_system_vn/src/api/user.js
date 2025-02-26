/*
 * @name: **列表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-08 16:24:24
 */
import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}

export function getInfo(data) {
  return request({
    url: '/user/info',
    method: 'post',
    data
  })
}

export function logout() {
  return request({
    url: '/user/logout',
    method: 'post'
  })
}

export function getManager(data) {
  return request({
      url: '/Manager',
      method: 'get',
      params: data
  })
}

export function postManager(data) {
  return request({
      url: '/Manager',
      method: 'post',
      data
  })
}

export function putManager(data) {
  return request({
      url: '/Manager',
      method: 'put',
      data
  })
}

export function deleteManager(data) {
  return request({
      url: '/Manager',
      method: 'delete',
      data
  })
}

