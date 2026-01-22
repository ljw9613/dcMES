
/*
 * @name: 用户信息表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-11 09:35:38
 */
import request from '@/utils/request'

export function getmerchant(data) {
    return request({
        url: '/merchant',
        method: 'get',
        params: data
    })
    
}

export function postmerchant(data) {
    return request({
        url: '/merchant',
        method: 'post',
        data
    })
}

export function putmerchant(data) {
    return request({
        url: '/merchant',
        method: 'put',
        data
    })
}

export function deletemerchant(data) {
    return request({
        url: '/merchant',
        method: 'delete',
        data
    })
}