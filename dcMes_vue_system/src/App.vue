<!--
 * @Autor: Wei
 * @Date: 2020-03-07 13:25:20
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2020-10-12 00:38:46
 -->
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import userActivityMonitor from '@/utils/userActivity'
import '@/utils/productionActivityTest'

export default {
  name: 'App',
  
  created () {
    // 在页面加载时读取sessionStorage
    console.log(this.$store.state.user.token)
    if (sessionStorage.getItem('store')&&this.$store.state.user.token) {
      console.log("页面重新刷新")
      console.log(this.$store.state)
      console.log(this.$store.getters)
      this.$store.replaceState(Object.assign({}, this.$store.state, JSON.parse(sessionStorage.getItem('store'))))
      
      // 如果用户已登录，检查活动超时并启动监听
      if (this.$store.getters.token) {
        console.log('检测到用户已登录，检查活动状态')
        
        // 检查页面加载时是否已超时
        const canContinue = userActivityMonitor.checkActivityOnLoad()
        
        if (canContinue && !userActivityMonitor.isExpired) {
          // 会话有效，启动用户活动监听
          console.log('会话有效，启动活动监听')
          userActivityMonitor.start()
        } else if (userActivityMonitor.isExpired) {
          // 会话已过期，直接显示重新登录弹窗
          console.log('会话已过期，显示重新登录弹窗')
          userActivityMonitor.showForceReloginDialog()
        }
      }
    }
    
    // 在页面刷新时将store保存到sessionStorage里
    window.addEventListener('beforeunload', () => {
      console.log('刷新前')
      sessionStorage.setItem('store', JSON.stringify(this.$store.state))
    })
  },
  
  mounted() {
    // 监听路由变化，在登录后启动活动监听
    this.$router.afterEach((to, from) => {
      // 如果跳转到登录页，停止活动监听
      if (to.path === '/login') {
        console.log('跳转到登录页，停止活动监听')
        userActivityMonitor.stop()
      }
      // 如果从登录页跳转到其他页面且用户已登录，启动活动监听
      else if (from.path === '/login' && this.$store.getters.token) {
        console.log('登录成功，启动活动监听')
        userActivityMonitor.start()
      }
    })
  },
  
  beforeDestroy() {
    // 组件销毁时停止活动监听
    userActivityMonitor.stop()
  }
}
</script>
