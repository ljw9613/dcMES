/*
 * @name: **列表
 * @content: 
 * @Author: joyce
 * @Date: 2020-06-03 15:45:30
 */ 

import request from '@/utils/request'

export function getdictionary(data) {
    return request({
        url: '/dictionary',
        method: 'get',
        params: data
    })
}

export function postdictionary(data) {
    return request({
        url: '/dictionary',
        method: 'post',
        data
    })
}


export function putdictionary(data) {
    return request({
        url: '/dictionary',
        method: 'put',
        data
    })
}

export function deletedictionary(data) {
    return request({
        url: '/dictionary',
        method: 'delete',
        data
    })
}