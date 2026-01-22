
/*
 * @name: 用户信息表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-11 09:35:38
 */
import request from '@/utils/request'

export function getsmartScale(data) {
    return request({
        url: '/smartScale',
        method: 'get',
        params: data
    })
    
}

export function postsmartScale(data) {
    return request({
        url: '/smartScale',
        method: 'post',
        data
    })
}

export function putsmartScale(data) {
    return request({
        url: '/smartScale',
        method: 'put',
        data
    })
}

export function deletesmartScale(data) {
    return request({
        url: '/smartScale',
        method: 'delete',
        data
    })
}