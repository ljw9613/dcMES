
/*
 * @name: 用户信息表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-11 09:35:38
 */
import request from '@/utils/request'

export function getmerchantOrder(data) {
    return request({
        url: '/merchantOrder',
        method: 'get',
        params: data
    })
    
}

export function postmerchantOrder(data) {
    return request({
        url: '/merchantOrder',
        method: 'post',
        data
    })
}

export function putmerchantOrder(data) {
    return request({
        url: '/merchantOrder',
        method: 'put',
        data
    })
}

export function deletemerchantOrder(data) {
    return request({
        url: '/merchantOrder',
        method: 'delete',
        data
    })
}