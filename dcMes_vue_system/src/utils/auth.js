/*
 * @name: **列表
 * @content: 
 * @Author: joyce
 * @Date: 2020-09-02 12:42:00
 */

import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'
const TokenKey1 = 'Admin-UserId'

export function getToken() {
  const token = Cookies.get(TokenKey)
  // console.log('从Cookie获取token:', token ? `${token.substring(0, 20)}...` : 'null')
  return token
}

export function setToken(token) {
  console.log('设置token到Cookie:', token ? `${token.substring(0, 20)}...` : 'null')
  // 设置较长的过期时间，确保刷新页面时token仍然存在
  return Cookies.set(TokenKey, token, { 
    expires: 30, // 30天过期
    secure: false, // 开发环境设为false，生产环境应设为true
    sameSite: 'lax' // 防止CSRF攻击
  })
}

export function removeToken() {
  console.log('从Cookie移除token')
  return Cookies.remove(TokenKey)
}

export function getid() {
  const id = Cookies.get(TokenKey1)
  console.log('从Cookie获取用户ID:', id)
  return id
}

export function setid(id) {
  console.log('设置用户ID到Cookie:', id)
  return Cookies.set(TokenKey1, id, {
    expires: 30,
    secure: false,
    sameSite: 'lax'
  })
}

export function removeid() {
  console.log('从Cookie移除用户ID')
  return Cookies.remove(TokenKey1)
}