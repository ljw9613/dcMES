import axios from "axios";
import { Message } from "element-ui";
import store from "@/store";
// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 3000000 // request timeout
});
// 是否显示重新登录
export let isRelogin = { show: false };
// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    if (store.getters.token) {
      const token = store.getters.token;
      // 确保token存在且有效再添加到请求头中
      if (token && typeof token === 'string' && token.trim() !== '') {
        config.headers.common["Authorization"] = "Bearer " + token;
      }
      // 添加用户名到请求头
      config.headers["username"] = store.getters.id || "onLogin";
    }
    return config;
  },
  error => {
    // do something with request error
    console.log(error); // for debug
    return Promise.reject(error);
  }
);

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
   */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    const res = response.data;
    console.log("http请求数据");
    console.log(res);

    if (res.code === 400) {
      // to re-login

      store.dispatch("user/resetToken").then(() => {
        location.reload();
      });
    }
    if (res.code === 4022) {
      // to re-login
      Message({
        message: res.message || "Error",
        type: "error",
        duration: 5 * 1000
      });
      return Promise.reject(error);
    }


    // if the custom code is not 20000, it is judged as an error.
    return res;
  },
  error => {
    console.log("err", error); // for debug
    Message({
      message: error.message || "请求超时，请检查网络问题",
      type: "error",
      duration: 5 * 1000
    });
    return Promise.reject(error);
  }
);

export default service;
