import request from '@/utils/request'

// 条码规则清除redis缓存
export function clearBarcodeRuleCache(data) {
    return request({
        url: '/clearBarcodeRuleCache',
        method: 'get',
        params: data
    })
}
