// requestK3Data
import request from "@/utils/request";

export function requestK3Data(data) {
  return request({
    url: "/requestK3Data",
    method: "post",
    data
  });
}

// 同步生产订单数据
export function syncPRD_MO(data) {
  return request({
    url: "/K3/sync/PRD_MO",
    method: "post",
    data
  });
}

// 同步销售订单数据
export function syncSAL_SaleOrder(data) {
  return request({
    url: "/K3/sync/SAL_SaleOrder",
    method: "post",
    data
  });
}

// 同步物料数据
export function syncBD_MATERIAL(data) {
  return request({
    url: "/K3/sync/BD_MATERIAL",
    method: "post",
    data
  });
}

// 获取物料同步任务的状态
export function getSyncStatus(modelName) {
  return request({
    url: `/K3/sync/status/${modelName}`,
    method: "get",
  });
}

// 获取所有同步任务的状态
export function getSyncStatusAll() {
  return request({
    url: "/K3/sync/status/all",
    method: "get"
  });
}


// 同步仓库数据
export function syncBD_STOCK(data) {
  return request({
    url: "/K3/sync/BD_STOCK",
    method: "post",
    data
  });
}
