
/*
 * @name: 用户信息表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-11 09:35:38
 */
import request from '@/utils/request'

export function getfarm(data) {
    return request({
        url: '/farm',
        method: 'get',
        params: data
    })
}

export function postfarm(data) {
    return request({
        url: '/farm',
        method: 'post',
        data
    })
}

export function putfarm(data) {
    return request({
        url: '/farm',
        method: 'put',
        data
    })
}

export function deletefarm(data) {
    return request({
        url: '/farm',
        method: 'delete',
        data
    })
}