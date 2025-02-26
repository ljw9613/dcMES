<!--
 * @name: **列表
 * @content: 
 * @Author: joyce
 * @Date: 2020-05-20 10:48:35
-->
<!-- <template>  先让控制台不显示这个报错
  <div class="sidebar-logo-container" :class="{ 'collapse': collapse }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <img v-if="logo" :src="logo" class="sidebar-logo1">
        <h1 v-else class="sidebar-title">{{ title1 }} </h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <span style="display: flex; align-items: center; justify-content: center;height: 50px;">
          <img v-if="logo" :src="logo" class="sidebar-logo">
          <h1 class="sidebar-title">{{ title }} </h1>
        </span>
      </router-link>
    </transition>
  </div>
</template> -->
<template>
  <div class="sidebar-logo-container" :class="{ 'collapse': collapse }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <h1 class="sidebar-title">{{ title1 }} </h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <span style="display: flex; align-items: center; justify-content: center;height: 50px;">
          <h1 class="sidebar-title">{{ title }} </h1>
        </span>
      </router-link>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      title: '德昌MES系统',
      title1: '德昌',
      // 方法1: 使用 require 动态导入
      // logo: require('@/assets/logo/logo.png')

      // 方法2: 使用 import 静态导入
      // logo: import('@/assets/logo.png')

      // 方法3: 使用 URL 导入
      // logo: new URL('@/assets/logo.png', import.meta.url).href
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: $menuBg;
  text-align: center;
  overflow: hidden;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    & .sidebar-logo {
      width: 80px;
      height: 80px;
      vertical-align: middle;
      margin-right: 12px;
    }

    & .sidebar-logo1 {
      width: 50px;
      height: 50px;
      vertical-align: middle;
      margin-right: 12px;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #fff;
      font-weight: 600;
      line-height: 50px;
      font-size: 14px;
      font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
      vertical-align: middle;
    }

    & .title {
      width: 100%;
      text-align: center;
      color: #fff;
      font-weight: 600;
      line-height: 50px;
      font-size: 14px;
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }
}
</style>
