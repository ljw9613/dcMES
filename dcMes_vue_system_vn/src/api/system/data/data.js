import request from '@/utils/request'

export async function getDataCount(schema, params) {
  return request({
    url: "/getDataCount",
    method: "post",
    Headers: {"Content-Type": "application/json"},
    data: {schema: schema, ...params},
  }).catch();
}

export async function getData(schema, params) {
  return request({
    url: "/getData",
    method: "post",
    Headers: {"Content-Type": "application/json"},
    data: {schema: schema, ...params},
  }).catch();
}

export async function getRow(schema, params) {
  return request({
    url: "/getRow",
    method: "post",
    Headers: {"Content-Type": "application/json"},
    data: {schema: schema, ...params},
  }).catch();
}

export async function addData(schema, data) {
  return request({
    url: "/data",
    method: "post",
    Headers: {"Content-Type": "application/json"},
    data: {schema: schema, data: data},
  }).catch();
}

export async function removeData(schema, query) {
  return request({
    url: "/data",
    method: "delete",
    Headers: {"Content-Type": "application/json"},
    data: {schema: schema, ...query},
  }).catch();
}

export async function updateData(schema, update) {
  return request({
    url: "/data",
    method: "put",
    Headers: {"Content-Type": "application/json"},
    data: {schema: schema, ...update},
  }).catch();
}
