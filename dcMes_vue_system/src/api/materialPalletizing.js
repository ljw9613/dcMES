import request from '@/utils/request'

// 添加托盘条码接口
export function handlePalletBarcode(data) {
    return request({
        url: '/handlePalletBarcode',
        method: 'post',
        data
    })
}

// 解绑条码接口
export function unbindPalletBarcode(data) {
    return request({
        url: '/unbindPalletBarcode',
        method: 'post',
        data
    })
}

// 解绑托盘所有条码接口
export function unbindPalletAllBarcode(data) {
    return request({
        url: '/unbindPalletAllBarcode',
        method: 'post',
        data
    })
}

// 拆分托盘接口
export function splitPallet(data) {
    return request({
        url: '/splitPallet',
        method: 'post',
        data
    })
}

// 更新托盘检测状态接口
export function updatePalletInspectionStatus(data) {
    return request({
        url: '/updatePalletInspectionStatus',
        method: 'post',
        data
    })
}