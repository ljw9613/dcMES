
/*
 * @name: 用户信息表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-11 09:35:38
 */
import request from '@/utils/request'

export function getfarmArea(data) {
    return request({
        url: '/farmArea',
        method: 'get',
        params: data
    })
}

export function postfarmArea(data) {
    return request({
        url: '/farmArea',
        method: 'post',
        data
    })
}

export function putfarmArea(data) {
    return request({
        url: '/farmArea',
        method: 'put',
        data
    })
}

export function deletefarmArea(data) {
    return request({
        url: '/farmArea',
        method: 'delete',
        data
    })
}