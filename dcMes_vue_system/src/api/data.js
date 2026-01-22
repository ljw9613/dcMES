// import { web_encry_request } from "../utils/web_encrypt";
import request from "@/utils/request";

export async function getData(schema, params) {
  return request({
    url: `/${schema}`,
    method: "get",
    Headers: { "Content-Type": "application/json" },
    params: { ...params }
  }).catch();
}

export async function addData(schema, data) {
  return request({
    url: `/${schema}`,
    method: "post",
    Headers: { "Content-Type": "application/json" },
    data: data
  }).catch();
}

export async function removeData(schema, query) {
  return request({
    url: `/${schema}`,
    method: "delete",
    Headers: { "Content-Type": "application/json" },
    data: { ...query }
  }).catch();
}

export async function updateData(schema, update) {
  return request({
    url: `/${schema}`,
    method: "put",
    Headers: { "Content-Type": "application/json" },
    data: { ...update }
  }).catch();
}
