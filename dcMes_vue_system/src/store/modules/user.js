import { getInfo, login, logout } from "@/api/user";
import {
  getid,
  getToken,
  removeid,
  removeToken,
  setid,
  setToken
} from "@/utils/auth";
import { resetRouter } from "@/router";
import { jsencrypt } from "@/utils/jsencrypt";
import { formatRole2Auth } from "@/utils/format2Tree";
import store from "../index";
import userActivityMonitor from "@/utils/userActivity";

const getDefaultState = () => {
  const token = getToken();
  const id = getid();
  
  console.log('初始化用户状态 - Token:', token ? `${token.substring(0, 20)}...` : 'null');
  console.log('初始化用户状态 - ID:', id);
  
  return {
    token: token,
    name: "",
    userName: "",
    avatar: "",
    roles: "",
    auth: "",
    id: id,
    department: ""
  };
};

const state = getDefaultState();

const mutations = {
  RESET_STATE: state => {
    const newState = getDefaultState();
    console.log('重置用户状态 - 新Token:', newState.token ? `${newState.token.substring(0, 20)}...` : 'null');
    Object.assign(state, newState);
  },
  SET_TOKEN: (state, token) => {
    console.log('设置Token到State:', token ? `${token.substring(0, 20)}...` : 'null');
    state.token = token;
  },
  SET_ID: (state, id) => {
    state.id = id;
  },
  SET_USERNAME: (state, userName) => {
    state.userName = userName;
  },
  SET_NAME: (state, name) => {
    console.log("name: ", name);
    state.name = name;
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles;
  },
  SET_AUTH: (state, auth) => {
    state.auth = auth;
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar;
  },
  SET_DEPARTMENT: (state, department) => {
    state.department = department;
  },
  SET_SERVE: (state, serve) => {
    state.serve = serve;
  }
};

const actions = {
  // user login
  login({ commit }, userInfo) {
    removeToken(); // must remove  token  first
    removeid();
    resetRouter();
    commit("RESET_STATE");

    return new Promise((resolve, reject) => {
      if (userInfo.encryptedId) {
        // 扫码登录
        login({ encryptedId: userInfo.encryptedId })
          .then(response => {
            const { token, user } = response;
            if (token && user) {
              commit("SET_TOKEN", token);
              commit("SET_ID", user._id);
              commit("SET_USERNAME", user.userName);
              commit("SET_AVATAR", user.avatar || require("@/assets/ren1.png"));
              commit("SET_SERVE", "user.serve");
              setToken(token);
              setid(user._id);
              
              // 登录成功后启动用户活动监听
              userActivityMonitor.start();
              
              resolve();
            } else {
              reject(new Error('登录响应数据不完整'));
            }
          })
          .catch(error => {
            reject(error);
          });
      } else {
        // 账号密码登录
        const encryptedPassword = jsencrypt(userInfo.password);
        login({
          userName: userInfo.userName.trim(),
          password: encryptedPassword
        })
          .then(response => {
            const { token, user } = response;
            if (token && user) {
              commit("SET_TOKEN", token);
              commit("SET_ID", user._id);
              commit("SET_USERNAME", user.userName);
              commit("SET_AVATAR", user.avatar || require("@/assets/ren1.png"));
              commit("SET_SERVE", "user.serve");
              setToken(token);
              setid(user._id);
              
              // 登录成功后启动用户活动监听
              userActivityMonitor.start();
              
              resolve();
            } else {
              reject(new Error('登录响应数据不完整'));
            }
          })
          .catch(error => {
            reject(error);
          });
      }
    });
  },

  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      console.log('获取用户信息，用户ID:', state.id);
      console.log('当前token状态:', state.token ? `${state.token.substring(0, 20)}...` : 'null');
      
      getInfo({ id: state.id })
        .then(response => {
          const { data } = response;

          if (!data) {
            return reject("Verification failed, please Login again.");
          }

          const { nickName, role, department, serveId, avatar } = data;
          console.log("InfoData");
          console.log("data: ", data);

          // 确保role存在
          if (role) {
            // 处理菜单权限
            if (role.menuList) {
              let authLists = formatRole2Auth(role.menuList);
              console.log("authLists: ", authLists);
              commit("SET_AUTH", authLists);
            }

            // 确保buttonList字段存在，如果不存在则初始化为空数组
            if (!role.buttonList) {
              role.buttonList = [];
              console.warn('角色中未找到buttonList，已初始化为空数组');
            }

            // 如果是超级管理员，自动授予所有权限
            if (role.name === 'admin' || role.name === '超级管理员' || role.label === 'admin') {
              console.log('当前用户是超级管理员，自动拥有所有权限');

              // 这里可以添加所有已知的权限，或者保持空数组让checkPermission逻辑处理
              // role.buttonList = [...所有权限列表...];
            }

            console.log('用户角色信息:', role);
            console.log('按钮权限列表:', role.buttonList);
          } else {
            console.error('未找到角色信息');
          }

          commit("SET_ROLES", role);
          commit("SET_NAME", nickName);
          commit("SET_AVATAR", avatar || require("@/assets/ren1.png"));
          commit("SET_DEPARTMENT", department);
          commit("SET_SERVE", serveId);
          resolve(data);
        })
        .catch(error => {
          reject(error);
        });
    });
  },

  // user logout
  logout({ commit, state }) {
    return new Promise((resolve, reject) => {
      logout(state.token)
        .then(() => {
          // 停止用户活动监听
          userActivityMonitor.stop();
          
          removeToken(); // must remove  token  first
          removeid(); // must remove  token  first
          resetRouter();
          store.commit("SET_ROUTES", []);
          store.commit("SET_SIDEBAR_ROUTERS", []);
          
          // 清除所有标签页视图数据
          store.dispatch("tagsView/delAllViews");
          console.log("清除所有标签页视图数据");
          
          console.log("resetRouter", store.getters.router);

          commit("RESET_STATE");
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      console.log('resetToken被调用')
      console.trace('resetToken调用堆栈:')
      
      // 停止用户活动监听
      userActivityMonitor.stop();
      
      removeToken(); // must remove  token  first
      removeid();
      
      // 清除所有标签页视图数据
      store.dispatch("tagsView/delAllViews");
      console.log("resetToken: 清除所有标签页视图数据");
      
      commit("RESET_STATE");
      resolve();
    });
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions
};
