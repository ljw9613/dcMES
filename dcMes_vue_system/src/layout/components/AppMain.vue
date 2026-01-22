<template>
  <section class="app-main">
    <transition name="fade-transform" mode="out-in">
      <keep-alive :include="cachedViews">
        <router-view :key="key" />
      </keep-alive>
    </transition>
    
    <!-- 添加调试面板 -->
    <div v-if="$store.state.settings.showDebugInfo" 
         style="position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 10px; font-size: 12px; max-width: 300px; z-index: 9999;">
      <p>当前路由: {{ $route.path }}</p>
      <p>路由名称: {{ $route.name }}</p>
      <p>缓存视图: {{ cachedViews.join(', ') || '无' }}</p>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AppMain',
  computed: {
    cachedViews() {
      console.log('当前缓存视图列表:', this.$store.state.tagsView.cachedViews)
      return this.$store.state.tagsView.cachedViews
    },
    key() {
      return this.$route.path
    }
  },
  mounted() {
    console.log('AppMain mounted, cachedViews:', this.cachedViews)
  },
  updated() {
    console.log('AppMain updated, cachedViews:', this.cachedViews)
  }
}
</script>

<style scoped>
.app-main {
  /*50 = navbar  */
  min-height: calc(100vh - 50px);
  width: 100%;
  position: relative;
  overflow: hidden;
}
.fixed-header+.app-main {
  padding-top: 50px;
}
</style>

<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 15px;
  }
}
</style>
