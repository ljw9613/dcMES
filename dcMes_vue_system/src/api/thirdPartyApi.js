import request from "@/utils/request";

// ─── 接口配置管理 ──────────────────────────────────────────────────────────────

export function getApiConfigList(params) {
  return request({ url: "/tp-api-config/list", method: "get", params });
}

export function getApiConfigDetail(id) {
  return request({ url: `/tp-api-config/${id}`, method: "get" });
}

export function addApiConfig(data) {
  return request({ url: "/tp-api-config/add", method: "post", data });
}

export function updateApiConfig(id, data) {
  return request({ url: `/tp-api-config/${id}`, method: "put", data });
}

export function updateApiConfigStatus(id, status) {
  return request({ url: `/tp-api-config/${id}/status`, method: "put", data: { status } });
}

export function deleteApiConfig(id) {
  return request({ url: `/tp-api-config/${id}`, method: "delete" });
}

export function getApiFileRecords(id) {
  return request({ url: `/tp-api-config/${id}/file-records`, method: "get", params: { limit: 10 } });
}

export function downloadApiFileRecord(fileRecordId) {
  return request({
    url: `/tp-api-file-record/${fileRecordId}/download`,
    method: "get",
    responseType: "blob",
    timeout: 60000,
  });
}

/**
 * 调用接口
 * @param {string} id - 接口配置ID
 * @param {FormData|Object} payload - FormData（文件模式）或包含参数的对象（自定义参数模式）
 * @param {boolean} isFile - 是否为文件模式
 * @param {number} configTimeoutSeconds - 接口配置的超时时间（秒），前端会在此基础上额外加 15s 作为缓冲
 */
export function callApiConfig(id, payload, isFile = false, configTimeoutSeconds = 30) {
  // 前端超时 = 接口配置超时 + 15s 缓冲（避免后端超时前前端先断开）
  const timeoutMs = (configTimeoutSeconds + 15) * 1000;
  if (isFile) {
    return request({
      url: `/tp-api-config/${id}/call`,
      method: "post",
      data: payload,
      headers: { "Content-Type": "multipart/form-data" },
      timeout: timeoutMs,
    });
  }
  return request({
    url: `/tp-api-config/${id}/call`,
    method: "post",
    data: payload,
    timeout: timeoutMs,
  });
}

// ─── 参数模板管理 ──────────────────────────────────────────────────────────────

export function getParamTemplateList(apiConfigId) {
  return request({ url: "/tp-param-template/list", method: "get", params: { apiConfigId } });
}

export function getParamTemplateDetail(id) {
  return request({ url: `/tp-param-template/${id}`, method: "get" });
}

export function addParamTemplate(data) {
  return request({ url: "/tp-param-template/add", method: "post", data });
}

export function updateParamTemplate(id, data) {
  return request({ url: `/tp-param-template/${id}`, method: "put", data });
}

export function deleteParamTemplate(id) {
  return request({ url: `/tp-param-template/${id}`, method: "delete" });
}

export function batchDeleteTemplates(ids) {
  return request({ url: "/tp-param-template/batch-delete", method: "post", data: { ids } });
}

export function updateTemplateSort(items) {
  return request({ url: "/tp-param-template/sort", method: "post", data: { items } });
}

export function getTemplateOpLogs(id) {
  return request({ url: `/tp-param-template/${id}/op-logs`, method: "get" });
}

// ─── 请求日志管理 ──────────────────────────────────────────────────────────────

export function getCallLogList(params) {
  return request({ url: "/tp-call-log/list", method: "get", params });
}

export function getCallLogDetail(id) {
  return request({ url: `/tp-call-log/${id}`, method: "get" });
}

export function retryCallLog(id, data) {
  return request({ url: `/tp-call-log/${id}/retry`, method: "post", data: data || {}, timeout: 60000 });
}

export function downloadCallLogFile(id) {
  return request({
    url: `/tp-call-log/${id}/file/download`,
    method: "get",
    responseType: "blob",
    timeout: 60000,
  });
}
