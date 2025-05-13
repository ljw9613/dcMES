import axios from "axios";
import { Message } from "element-ui";
import store from "@/store";
import router from '@/router';
import Cookies from 'js-cookie';
// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 3000000 // request timeout
});
// 是否显示重新登录
export let isRelogin = { show: false };

// JWT验证失败时的处理函数
const handleJWTError = (message) => {
  Message({
    message: message || 'Token验证失败，请重新登录',
    type: 'error',
    duration: 5 * 1000
  });
  
  // 清除所有cookie缓存
  Object.keys(Cookies.get()).forEach(cookieName => {
    Cookies.remove(cookieName);
  });
  
  // 清除localStorage中可能存储的token信息
  localStorage.clear();
  
  // 重置Vuex中的token
  store.dispatch("user/resetToken").then(() => {
    // 重定向到登录页面
    router.push('/login');
  });
};

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    if (store.getters.token) {
      const token = store.getters.token;
      // 添加调试信息
      console.log('当前token:', token);
      console.log('token类型:', typeof token);
      console.log('token长度:', token.length);
      
      // 确保token存在且有效再添加到请求头中
      if (token && typeof token === 'string' && token.trim() !== '') {
        config.headers.common["Authorization"] = "Bearer " + token;
        // 打印完整的请求头
        console.log('请求头:', config.headers);
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
    
    // JWT验证失败的处理
    if (res.code === 401 || (res.message && res.message.includes('Token'))) {
      handleJWTError(res.message);
      return Promise.reject(new Error(res.message || 'JWT验证失败'));
    }

    // if the custom code is not 20000, it is judged as an error.
    return res;
  },
  error => {
    console.log("err", error); // for debug
    
    // 检查是否是JWT相关错误
    if (error.response) {
      const { status, data } = error.response;
      
      // 处理401未授权错误（token无效或过期）
      if (status === 401) {
        handleJWTError(data.message || 'Token已过期或无效，请重新登录');
        return Promise.reject(error);
      }
      
      // 处理其他可能包含JWT错误信息的响应
      if (data && (
          (data.message && (
            data.message.includes('jwt') || 
            data.message.includes('token') || 
            data.message.includes('Token')
          )) || 
          (typeof data === 'string' && (
            data.includes('jwt') || 
            data.includes('token') || 
            data.includes('Token')
          ))
        )) {
        handleJWTError(typeof data === 'string' ? data : data.message);
        return Promise.reject(error);
      }
    }
    
    Message({
      message: error.message || "请求超时，请检查网络问题",
      type: "error",
      duration: 5 * 1000
    });
    return Promise.reject(error);
  }
);

export default service;
