import request from '@/utils/request'

// 获取产线列表
export function getProductionLines() {
  return request({
    url: '/production-lines',
    method: 'get'
  })
}

// 获取产线大屏数据
export function getDashboardData(lineId) {
  return request({
    url: `/dashboard`,
    method: 'get',
    params:{
        lineId:lineId
    }
  })
}