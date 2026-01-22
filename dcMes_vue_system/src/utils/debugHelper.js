// 创建一个新文件用于调试帮助函数

// 检查组件的名称是否与路由名称匹配
export function checkComponentName(vm) {
  const routeName = vm.$route.name
  const componentName = vm.$options.name
  
  console.log('路由检查:', {
    路由名称: routeName,
    组件名称: componentName,
    是否匹配: routeName === componentName,
    路由完整信息: vm.$route,
    缓存列表: vm.$store.state.tagsView.cachedViews
  })
  
  return routeName === componentName
} 