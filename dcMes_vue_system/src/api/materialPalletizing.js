import request from '@/utils/request'

// 添加托盘条码接口
export function handlePalletBarcode(data) {
    return request({
        url: '/handlePalletBarcode',
        method: 'post',
        data
    })
}

// 查询托盘处理状态接口（用于队列模式）
// 使用查询参数而不是路径参数，避免URL条码中的特殊字符导致路由解析错误
export function getPalletProcessingStatus(jobId) {
    return request({
        url: '/getPalletProcessingStatus',
        method: 'get',
        params: {
            jobId: jobId
        }
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

// 指定托盘添加条码接口
export function addBarcodeToPallet(data) {
    return request({
        url: '/addBarcodeToPallet',
        method: 'post',
        data
    })
}

// 托盘强制完成接口
export function handleForceCompletePallet(data) {
    return request({
        url: '/forcePalletComplete',
        method: 'post',
        data
    })
}

// 更新托盘数量接口
export function updatePalletQuantity(data) {
    return request({
        url: '/updatePalletQuantity',
        method: 'post',
        data
    })
}

// 装箱条码原子操作 - 获取或创建装箱条码
export function getOrCreatePackBarcode(data) {
    return request({
        url: '/getOrCreatePackBarcode',
        method: 'post',
        data
    })
}

// 装箱条码原子操作 - 清理过期锁定
export function cleanExpiredPackBarcodeLocks() {
    return request({
        url: '/cleanExpiredLocks',
        method: 'post'
    })
}

// 装箱条码原子操作 - 解锁装箱条码
export function unlockPackBarcode(data) {
    return request({
        url: '/unlockPackBarcode',
        method: 'post',
        data
    })
}

// 装箱条码原子操作 - 批量解锁装箱条码
export function unlockAllPackBarcodes(data) {
    return request({
        url: '/unlockAllPackBarcodes',
        method: 'post',
        data
    })
}

// 检查装箱条码状态
export function checkPackBarcodeStatus(params) {
    return request({
        url: '/checkPackBarcodeStatus',
        method: 'get',
        params
    })
}