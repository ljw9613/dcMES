
/*
 * @name: 用户信息表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-11 09:35:38
 */
import request from '@/utils/request'


export function getTCP(data) {
    return request({
        url: '/getTCP',
        method: 'post',
        data
    })
}
export function postProductToDevice(data) {
    return request({
        url: '/postProductToDevice',
        method: 'post',
        data
    })
}

export function postProductToDeviceSCP(data) {
    return request({
        url: '/postProductToDeviceSCP',
        method: 'post',
        data
    })
}

export function deleteProductToDevice(data) {
    return request({
        url: '/deleteProductToDevice',
        method: 'post',
        data
    })
}