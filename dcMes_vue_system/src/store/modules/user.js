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

const getDefaultState = () => {
  return {
    token: getToken(),
    name: "",
    userName: "",
    avatar: "",
    roles: "",
    auth: "",
    id: getid(),
    department: ""
  };
};

const state = getDefaultState();

const mutations = {
  RESET_STATE: state => {
    Object.assign(state, getDefaultState());
  },
  SET_TOKEN: (state, token) => {
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
    let { userName, password } = userInfo;
    password = jsencrypt(password);
    console.log(password);
    return new Promise((resolve, reject) => {
      login({ userName: userName.trim(), password: password })
        .then(response => {
          const { token, user } = response;
          commit("SET_TOKEN", token);
          commit("SET_ID", user._id);
          commit("SET_USERNAME", user.userName);
          commit("SET_AVATAR", user.avatar || require("@/assets/ren1.png"));
          commit("SET_SERVE", "user.serve");
          setToken(token);
          setid(user._id);
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  },

  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      console.log(state.id);
      getInfo({ id: state.id })
        .then(response => {
          const { data } = response;

          if (!data) {
            return reject("Verification failed, please Login again.");
          }
          const { nickName, role, department, serveId, avatar } = data;
          console.log("InfoData");
          console.log("data: ", data);
          if (role && role.menuList) {
            let authLists = formatRole2Auth(role.menuList);
            console.log("authLists: ", authLists);
            commit("SET_AUTH", authLists);
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
          removeToken(); // must remove  token  first
          removeid(); // must remove  token  first
          resetRouter();
          store.commit("SET_ROUTES", []);
          store.commit("SET_SIDEBAR_ROUTERS", []);
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
      removeToken(); // must remove  token  first
      removeid();
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
