// requestK3Data
import request from "@/utils/request";

export function requestK3Data(data) {
  return request({
    url: "/requestK3Data",
    method: "post",
    data
  });
}
