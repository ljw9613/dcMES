import auth from '@/plugins/auth'
import router,{
  constantRoutes,
  dynamicRoutes
} from '@/router'
import Layout from '@/layout/index'
import ParentView from '@/components/ParentView'
import InnerLink from '@/layout/components/InnerLink'
import store from '@/store'
import {
  formatMenu2Tree,formatRole2Auth
} from '@/utils/format2Tree'
import i18n from '@/lang'

const permission = {
  state: {
    routes: [],
    addRoutes: [],
    defaultRoutes: [],
    topbarRouters: [],
    sidebarRouters: []
  },
  mutations: {
    SET_ROUTES: (state, routes) => {
      console.log('routes: ', routes);
      console.log('state: ', state);
      state.addRoutes = routes
      state.routes = constantRoutes.concat(routes)
    },
    SET_DEFAULT_ROUTES: (state, routes) => {
      state.defaultRoutes = constantRoutes.concat(routes)
    },
    SET_TOPBAR_ROUTES: (state, routes) => {
      state.topbarRouters = routes
    },
    SET_SIDEBAR_ROUTERS: (state, routes) => {
      state.sidebarRouters = routes
    },
  },
  actions: {
    // 生成路由
    GenerateRoutes({
      commit
    }) {
      return new Promise(resolve => {
        // 向后端请求路由数据
        console.log('获取角色路由')
        let menuList =[]
        if(store.getters.roles){
          console.log(store.getters.roles.menuList)
          menuList = store.getters.roles.menuList
        }
        let menuLists = formatMenu2Tree(menuList, null, [])
        console.log('menuLists: ', menuLists);
        const tree2RouteList = tree2Routes(menuLists)
        console.log('tree2RouteList: ', tree2RouteList);
        
        const rewriteRoutes = tree2RouteList
        if(rewriteRoutes.length==0){
          console.log('rewriteRoutes: ', rewriteRoutes);
          commit('SET_ROUTES', [])
          commit('SET_SIDEBAR_ROUTERS', constantRoutes.concat([]))
        }else{
          console.log('rewriteRoutes: ', rewriteRoutes);
          commit('SET_ROUTES', rewriteRoutes)
          commit('SET_SIDEBAR_ROUTERS', constantRoutes.concat(rewriteRoutes))
        }
        resolve(rewriteRoutes)
        // })
      })
    }
  }
}

/**
 * 获取菜单的国际化标题
 * @param {Object} menuItem 菜单项
 * @returns {String} 国际化后的标题
 */
function getMenuI18nTitle(menuItem) {
  // 如果有i18nKey，使用国际化翻译
  if (menuItem.i18nKey && i18n.te && i18n.te(menuItem.i18nKey)) {
    return i18n.t(menuItem.i18nKey)
  }
  
  // 如果没有i18nKey或翻译不存在，使用原始menuName作为后备
  return menuItem.menuName || ''
}

function tree2Routes(menuList) {
  console.log('menuListmenuListmenuList: ', menuList);
  return menuList.filter(item => item.type !== '权限').map(item => {
    // 获取国际化标题
    const i18nTitle = getMenuI18nTitle(item)
    
    if (item.type == '目录') {
      if (item.children && item.children.length) {
        return {
          type: item.type,
          path: item.path,
          meta: {
            title: i18nTitle, // 使用国际化标题
            icon: item.icon,
            noCache: !item.isCache,
            i18nKey: item.i18nKey // 保存i18nKey用于后续更新
          },
          component: Layout,
          sortNum: item.sortNum,
          children: tree2Routes(item.children),
          hidden:!item.visible
        }
      } else {
        return {
          type: item.type,
          path: item.path,
          component: Layout,
          name: item.componentName || (item.component ? item.component.split('/').pop().replace(/\.vue$/, '') : ''),
          meta: {
            title: i18nTitle, // 使用国际化标题
            icon: item.icon,
            noCache: !item.isCache,
            i18nKey: item.i18nKey // 保存i18nKey用于后续更新
          },
          sortNum: item.sortNum,
          hidden:!item.visible
        }
      }
    }
    if (item.type == '菜单') {
      if (item.children && item.children.length) {
          console.log('tree2Routes(item.children).length: ',tree2Routes(item.children));
        return {
          type: item.type,
          path: item.path,
          component:(resolve) => require([`@/views${item.component}`], resolve),
          name: item.componentName || item.path,
          meta: {
            title: i18nTitle, // 使用国际化标题
            icon: item.icon,
            noCache: !item.isCache,
            i18nKey: item.i18nKey // 保存i18nKey用于后续更新
          },
          sortNum: item.sortNum,
          children: tree2Routes(item.children).length > 0 ? tree2Routes(item.children) : [],
          hidden:!item.visible
        }
      } else {
          return {
          type: item.type,
          path: item.path,
          component: (resolve) => require([`@/views${item.component}`], resolve),
          name: item.componentName || item.path,
          meta: {
            title: i18nTitle, // 使用国际化标题
            icon: item.icon,
            noCache: !item.isCache,
            i18nKey: item.i18nKey // 保存i18nKey用于后续更新
          },
          sortNum: item.sortNum,
          hidden:!item.visible
        }
      }
    }
  })
}

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
  return asyncRouterMap.filter(route => {
    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = ParentView
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink
      } else {
        route.component = loadView(route.component)
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type)
    } else {
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}

function filterChildren(childrenMap, lastRouter = false) {
  var children = []
  childrenMap.forEach((el, index) => {
    if (el.children && el.children.length) {
      if (el.component === 'ParentView' && !lastRouter) {
        el.children.forEach(c => {
          c.path = el.path + '/' + c.path
          if (c.children && c.children.length) {
            children = children.concat(filterChildren(c.children, c))
            return
          }
          children.push(c)
        })
        return
      }
    }
    if (lastRouter) {
      el.path = lastRouter.path + '/' + el.path
    }
    children = children.concat(el)
  })
  console.log(children)
  return children
}

// 动态路由遍历，验证是否具备权限
export function filterDynamicRoutes(routes) {
  const res = []
  routes.forEach(route => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route)
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route)
      }
    }
  })
  return res
}

export const loadView = (view) => {
  if (process.env.NODE_ENV === 'development') {
    return () => import(`@/views/${view}`)
  } else {
    // 使用 import 实现生产环境的路由懒加载
    return () => import(`@/views/${view}`)
  }
}

// 将后端菜单数据转换为路由对象
function generateRoutes(menus) {
  return menus.map(menu => {
    // 使用componentName作为路由名称，这是关键点
    const name = menu.componentName || '';
    
    console.log('生成路由:', {
      path: menu.path,
      componentName: menu.componentName,
      cache: menu.isCache
    });
    
    const route = {
      path: menu.path,
      name: name, // 确保这里的名称与组件中定义的name一致
      component: loadComponent(menu.component),
      meta: {
        title: getMenuI18nTitle(menu), // 使用国际化标题
        icon: menu.icon,
        noCache: !menu.isCache,
        i18nKey: menu.i18nKey // 保存i18nKey
      }
    };
    
    // ... 其他逻辑
    
    return route;
  });
}

/**
 * 更新路由标题的国际化
 * 当语言切换时调用此方法
 */
export function updateRouteI18nTitles() {
  const updateRouteTitle = (routes) => {
    routes.forEach(route => {
      if (route.meta && route.meta.i18nKey) {
        // 根据i18nKey更新标题
        route.meta.title = getMenuI18nTitle({ 
          i18nKey: route.meta.i18nKey, 
          menuName: route.meta.title 
        })
      }
      
      // 递归更新子路由
      if (route.children && route.children.length > 0) {
        updateRouteTitle(route.children)
      }
    })
  }
  
  // 更新动态路由
  const sidebarRouters = store.getters.sidebarRouters
  if (sidebarRouters && sidebarRouters.length > 0) {
    updateRouteTitle(sidebarRouters)
  }
}

export default permission
