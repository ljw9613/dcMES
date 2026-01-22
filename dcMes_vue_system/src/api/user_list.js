/*
 * @name: 用户信息表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-11 09:35:38
 */
import request from '@/utils/request'

export function getuserlist(data) {
    return request({
        url: '/user_login',
        method: 'get',
        params: data
    })
}

export function postuserlist(data) {
    return request({
        url: '/user_login',
        method: 'post',
        data
    })
}

export function putuserlist(data) {
    return request({
        url: '/user_login',
        method: 'put',
        data
    })
}

export function deleteuserlist(data) {
    return request({
        url: '/user_login',
        method: 'delete',
        data
    })
}