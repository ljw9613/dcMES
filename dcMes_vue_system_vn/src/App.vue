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
    }
    // 在页面刷新时将store保存到sessionStorage里
    window.addEventListener('beforeunload', () => {
      console.log('刷新前')
      sessionStorage.setItem('store', JSON.stringify(this.$store.state))
    })
  }
}
</script>
