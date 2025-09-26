import axios from "axios";
import { Message } from "element-ui";
import store from "@/store";
import router from '@/router';
import Cookies from 'js-cookie';
import { getToken, setToken } from '@/utils/auth'; // 导入getToken和setToken函数
import userActivityMonitor from '@/utils/userActivity';
import { isActivityMonitorEnabled, getActivityConfig } from '@/config/activityConfig';
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
    // 检查会话是否已过期（仅在功能启用且配置拦截API请求时）
    if (isActivityMonitorEnabled() && getActivityConfig().interceptApiRequests && 
        userActivityMonitor.isExpired) {
      console.log('会话已过期，拦截API请求:', config.url)
      userActivityMonitor.showForceReloginDialog()
      return Promise.reject(new Error('会话已过期，请重新登录'))
    }
    
    // do something before request is sent
    // 首先尝试从store获取token，如果失败则直接从Cookie获取
    let token = store.getters.token;
    
    // 如果store中没有token，直接从Cookie获取（防止初始化时机问题）
    if (!token) {
      token = getToken();
      // console.log('Store中无token，从Cookie获取:', token ? `${token.substring(0, 20)}...` : 'null');
    }
    
    // 添加调试信息
    // console.log('请求URL:', config.url);
    // console.log('Store中的token:', store.getters.token ? `${store.getters.token.substring(0, 20)}...` : 'null');
    // console.log('最终使用的token:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (token) {
      // 确保token存在且有效再添加到请求头中
      if (typeof token === 'string' && token.trim() !== '') {
        // 统一使用Authorization头，格式严格按照JWT标准
        config.headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        // console.log('添加到请求头的Authorization:', config.headers['Authorization'].substring(0, 30) + '...');
      } else {
        // console.warn('Token格式无效:', token);
      }
      
      // 为user/info接口特殊处理
      if (config.url && config.url.includes('/api/v1/user/info')) {
        // 确保请求体中包含用户ID
        if (!config.data || !config.data.id) {
          const userId = store.getters.id;
          // console.log('为user/info添加用户ID:', userId);
          config.data = config.data || {};
          config.data.id = userId;
        }
      }
      
      // 添加用户名到请求头（保留原有逻辑）
      config.headers["username"] = store.getters.id || "onLogin";
    } else {
      // console.warn('未找到token，请求可能被拒绝 - Store token:', store.getters.token, 'Cookie token:', getToken());
    }
    
    return config;
  },
  error => {
    // do something with request error
    console.log('请求错误:', error);
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

    // 检查响应头中是否有新的token
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      console.log('收到服务器更新的token，正在更新本地token');
      store.commit('user/SET_TOKEN', newToken);
      setToken(newToken);
    }

    // 检查活动警告
    const activityWarning = response.headers['x-activity-warning'];
    const remainingTime = response.headers['x-remaining-time'];
    if (activityWarning === 'true' && remainingTime) {
      const minutes = Math.ceil(parseInt(remainingTime) / 1000 / 60);
      console.warn(`活动警告：还有 ${minutes} 分钟会话将过期`);
    }

    if (res.code === 400) {
      // to re-login
      store.dispatch("user/resetToken").then(() => {
        location.reload();
      });
    }
    if (res.code === 4022) {
      // 登录失败，但不需要重新登录
      return Promise.reject({
        code: res.code,
        message: res.message || "登录失败",
        remainingAttempts: res.remainingAttempts
      });
    }
    
    if (res.code === 4023) {
      // 账号被锁定
      return Promise.reject({
        code: res.code,
        message: res.message || "账号已被锁定",
        lockedUntil: res.lockedUntil,
        remainingMinutes: res.remainingMinutes
      });
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
        // 后端不再进行时间校验，所有401都视为真正的token无效
        console.log('检测到401错误，token无效，清除所有数据');
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
