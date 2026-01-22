
/*
 * @name: 用户信息表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-11 09:35:38
 */
import request from '@/utils/request'

export function getMachineProgress(data) {
    return request({
        url: '/machine/progress',
        method: 'get',
        params: data
    })
}

//machine/refresh
export function refreshMachine(data) {
    return request({
        url: '/machine/refresh',
        method: 'post',
        data: data
    })
}
