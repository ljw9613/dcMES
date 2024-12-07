import request from '@/utils/request'

// /api/v1/create-flow
export function createFlow(data) {
    return request({
        url: '/create-flow',
        method: 'post',
        data
    })
}
