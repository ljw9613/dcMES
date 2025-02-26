import request from '@/utils/request'

// /api/v1/handlePalletBarcode
export function handlePalletBarcode(data) {
    return request({
        url: '/handlePalletBarcode',
        method: 'post',
        data
    })
}


//unbindPalletBarcode
export function unbindPalletBarcode(data) {
    return request({
        url: '/unbindPalletBarcode',
        method: 'post',
        data
    })
}

//unbindPalletBarcode
export function unbindPalletAllBarcode(data) {
    return request({
        url: '/unbindPalletAllBarcode',
        method: 'post',
        data
    })
}

