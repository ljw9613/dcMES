
/*
 * @name: 用户信息表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-11 09:35:38
 */
import request from '@/utils/request'

export function getland(data) {
    return request({
        url: '/land',
        method: 'get',
        params: data
    })
}

export function postland(data) {
    return request({
        url: '/land',
        method: 'post',
        data
    })
}

export function putland(data) {
    return request({
        url: '/land',
        method: 'put',
        data
    })
}

export function deleteland(data) {
    return request({
        url: '/land',
        method: 'delete',
        data
    })
}