import router from './router'
import store from './store'
import {
  Message
} from 'element-ui'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import {
  getToken
} from '@/utils/auth'
import {
  isRelogin
} from '@/utils/request'

NProgress.configure({
  showSpinner: false
})

const whiteList = ['/login', '/register', '/marketPublicity', '/marketOverview']

router.beforeEach((to, from, next) => {
  NProgress.start()
  if (getToken()) {
    to.meta.title && store.dispatch('settings/setTitle', to.meta.title)
    /* has token*/
    if (to.path === '/login') {
      next({
        path: '/'
      })
      NProgress.done()
    } else {
      const hasGetRouters = store.getters.addRoutes
      console.log('hasGetRouters: ', hasGetRouters);
      //是否已经获取用户信息
      const hasGetUserInfo = store.getters.name
      console.log('hasGetUserInfo: ', hasGetUserInfo);
      if (hasGetRouters.length == 0) {
        console.log('无数据，进行获取');
        // if (!hasGetRouters.length) {
        isRelogin.show = true
        // 判断当前用户是否已拉取完user_info信息
        store.dispatch('user/getInfo').then(() => {
          isRelogin.show = false
          store.dispatch('GenerateRoutes').then(async accessRoutes => {
            // 根据roles权限生成可访问的路由表
            console.log('accessRoutes: ',accessRoutes);
            if (accessRoutes.length > 0) {
              router.addRoutes(accessRoutes) // 动态添加可访问路由表
              console.log('router: ', router);
              next({
                ...to,
                replace: true
              }) // hack方法 确保addRoutes已完成
            } else {
              next()
            }
          })
        }).catch(err => {
          store.dispatch('user/logout').then(() => {
            Message.error(err)
            next({
              path: '/'
            })
          })
        })
      } else {
        next()
      }
    }
  } else {
    // 没有token
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next()
    } else {
      next(`/login?redirect=${to.fullPath}`) // 否则全部重定向到登录页
      NProgress.done()
    }
  }

  // 输出路由信息，检查meta.noCache是否正确设置
  console.log('路由跳转:', to.path, 'meta:', to.meta, 'name:', to.name)

  next()
})

router.afterEach((to) => {
  // 完成进度条
  NProgress.done()

  // 添加页面到tagsView (如果该行代码不存在，需要添加)
  if (to.name && to.meta && to.meta.title) {
    store.dispatch('tagsView/addView', to)
    console.log('添加页面到TagsView:', to.name, to.path, to.meta)
  }

  // 此处添加日志，在路由切换完成后检查角色信息
  setTimeout(() => {
    const store = router.app.$store;
    if (store && store.getters && store.getters.roles) {
      console.log('%c⚡角色权限诊断⚡', 'background:#1E1E1E; color:#00FF00; font-size:14px; font-weight:bold;');
      console.log('角色信息:', store.getters.roles);
      console.log('按钮权限列表 (buttonList):', store.getters.roles.buttonList);
      console.log('是否为数组:', Array.isArray(store.getters.roles.buttonList));
      console.log('权限项数量:', store.getters.roles.buttonList ? store.getters.roles.buttonList.length : 0);

      // 检查用户类型
      if (store.getters.roles.name === 'admin' ||
          store.getters.roles.name === '超级管理员' ||
          store.getters.roles.label === 'admin') {
        console.log('当前用户是超级管理员，自动拥有所有权限');
      } else {
        console.log('当前用户是普通用户，需要检查权限列表');
      }
    }
  }, 1000); // 延迟1秒执行，确保路由切换完成后获取最新状态
})
