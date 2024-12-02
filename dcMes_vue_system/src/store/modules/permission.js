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

function tree2Routes(menuList) {
  console.log('menuListmenuListmenuList: ', menuList);
  return menuList.filter(item => item.type !== '权限').map(item => {
    if (item.type == '目录') {
      if (item.children && item.children.length) {
        return {
          type: item.type,
          path: item.path,
          meta: {
            title: item.menuName,
            icon: item.icon
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
          meta: {
            title: item.menuName,
            icon: item.icon
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
          name: item.path,
          meta: {
            title: item.menuName,
            icon: item.icon
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
          name: item.path,
          meta: {
            title: item.menuName,
            icon: item.icon
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

export default permission
