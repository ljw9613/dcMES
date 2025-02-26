
/*
 * @name: 用户信息表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-11 09:35:38
 */
import request from '@/utils/request'

export function getcamera(data) {
    return request({
        url: '/camera',
        method: 'get',
        params: data
    })
}

export function postcamera(data) {
    return request({
        url: '/camera',
        method: 'post',
        data
    })
}

export function putcamera(data) {
    return request({
        url: '/camera',
        method: 'put',
        data
    })
}

export function deletecamera(data) {
    return request({
        url: '/camera',
        method: 'delete',
        data
    })
}