
/*
 * @name: 用户信息表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-11 09:35:38
 */
import request from '@/utils/request'

export function getmarket(data) {
    return request({
        url: '/market',
        method: 'get',
        params: data
    })
}

export function postmarket(data) {
    return request({
        url: '/market',
        method: 'post',
        data
    })
}

export function putmarket(data) {
    return request({
        url: '/market',
        method: 'put',
        data
    })
}

export function deletemarket(data) {
    return request({
        url: '/market',
        method: 'delete',
        data
    })
}