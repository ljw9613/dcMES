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
