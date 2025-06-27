<!--
 * @Autor: Wei
 * @Date: 2020-03-07 13:25:20
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2020-10-12 00:36:32
 -->
<template>
  <div :class="{'has-logo':showLogo}">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="variables.menuBg"
        :text-color="variables.menuText"
        :unique-opened="false"
        :active-text-color="variables.menuActiveText"
        :collapse-transition="false"
        mode="vertical"
        :key="$i18n.locale"
      >
        <sidebar-item v-for="route in routes" :key="route.path + $i18n.locale" :item="route" :base-path="route.path" />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Logo from './Logo'
import SidebarItem from './SidebarItem'
import variables from '@/styles/variables.scss'
import store from '@/store'

export default {
  components: { SidebarItem, Logo },
  computed: {
    ...mapGetters([
      'sidebar'
    ]),
    routes() {
      
      console.log('获取routes: ', store.getters.router)
      console.log('获取sidar: ', this.$router.options.routes);
      return store.getters.router
    },
    activeMenu() {
      const route = this.$route
      const { meta, path } = route
      // if set path, the sidebar will highlight the path you set 如果设置路径，侧栏将突出显示您设置的路径
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    },
    showLogo() {
      return this.$store.state.settings.sidebarLogo
    },
    variables() {
      return variables
    },
    isCollapse() {
      return !this.sidebar.opened
    }
  },
  watch: {
    // 监听语言变化，强制重新渲染菜单
    '$i18n.locale': {
      handler() {
        this.$nextTick(() => {
          // 触发菜单重新渲染
          this.$forceUpdate()
        })
      },
      immediate: false
    }
  }
}
</script>
