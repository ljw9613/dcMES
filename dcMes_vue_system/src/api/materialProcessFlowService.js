import request from '@/utils/request'

// /api/v1/create-flow
export function createFlow(data) {
    return request({
        url: '/create-flow',
        method: 'post',
        data
    })
}

// /api/v1/scan-components
export function scanComponents(data) {
    return request({
        url: '/scan-components',
        method: 'post',
        data
    })
}

// /api/v1/unbind-components
export function unbindComponents(data) {
    return request({
        url: '/unbind-components',
        method: 'post',
        data
    })
}

// /api/v1/update-flow-nodes
export function updateFlowNodes(data) {
    return request({
        url: '/update-flow-nodes',
        method: 'post',
        data
    })
}

// /api/v1/all-process-steps/:materialId
export function getAllProcessSteps(materialId) {
    return request({
        url: `/all-process-steps/${materialId}`,
        method: 'get'
    })
}

// /api/v1/exportBOM
export function exportBOM(materialId) {
    return request({
        url: `/exportBOM?materialId=${materialId}`,
        method: 'get'
    })
}

// /api/v1/auto-fix-inconsistent-process-nodes
export function autoFixInconsistentProcessNodes(data) {
    return request({
        url: '/auto-fix-inconsistent-process-nodes',
        method: 'post',
        data
    })
}

//fix-flow-progress
export function fixFlowProgress(data) {
    return request({
        url: '/fix-flow-progress',
        method: 'post',
        data
    })
}

///api/v1/check-barcode-completion
export function checkBarcodeCompletion(barcode) {
    return request({
        url: `/check-barcode-completion/${barcode}`,
        method: 'get'
    })
}

// 替换物料组件
export function replaceComponent(data) {
    return request({
        url: '/replace-component',
        method: 'post',
        data
    })
}

