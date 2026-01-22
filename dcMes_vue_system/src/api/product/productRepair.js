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

// 添加审核API
export function reviewRepair(data) {
    return request({
        url: '/product_repair/reviewRepair',
        method: 'post',
        data
    })
}

// 添加批量审核API
export function batchReviewRepair(data) {
    return request({
        url: '/product_repair/batchReviewRepair',
        method: 'post',
        data
    })
}
