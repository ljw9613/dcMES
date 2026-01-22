import request from '@/utils/request'

// /api/v1/material-barcode/create
export function createBatch(data) {
    return request({
        url: '/material-barcode/create',
        method: 'post',
        data
    })
}
