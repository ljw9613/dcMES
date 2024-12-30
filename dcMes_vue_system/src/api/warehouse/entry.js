import request from '@/utils/request'

//scanPallet
export function scanPallet(data) {
    return request({
        url: '/warehouse_entry/scan',
        method: 'post',
        data
    })
}
export function scanPalletOn(data) {
    return request({
        url: '/warehouse_entry/scan_on',
        method: 'post',
        data
    })
}
// MES入库单同步至金蝶云
export function syncWarehouseEntry(data) {
    return request({
        url: '/k3/sync_warehouse_entry',
        method: 'post',
        data
    })
}