import request from '@/utils/request'
export function scanProductRepair(data) {
    return request({
        url: '/product_repair/scanProductRepair',
        method: 'post',
        data
    })
}
export function submitProductRepair(data) {
    return request({
        url: '/product_repair/submitProductRepair',
        method: 'post',
        data
    })
}
