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
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}
export function getid() {
  return Cookies.get(TokenKey1)
}

export function setid(token) {
  return Cookies.set(TokenKey1, token)
}

export function removeid() {
  return Cookies.remove(TokenKey1)
}