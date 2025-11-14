<template>
  <div class="navbar">
    <hamburger :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />

    <breadcrumb class="breadcrumb-container" />

    <div class="right-menu">
      <div class="nametitle">{{ $t('navbar.welcome') }}，{{ name }}</div>

      <!-- 版本号显示 -->
      <div class="version-container" @click="showVersionInfo">
        <i class="el-icon-info"></i>
        <span class="version-text">{{ currentVersion }}</span>
      </div>

      <!-- 语言切换下拉菜单 -->
      <el-dropdown class="language-container" trigger="click" @command="handleLanguageChange">
        <div class="language-wrapper">
          <i class="el-icon-s-grid"></i>
          <span class="language-text">{{ currentLanguageLabel }}</span>
          <i class="el-icon-caret-bottom" />
        </div>
        <el-dropdown-menu slot="dropdown" class="language-dropdown">
          <el-dropdown-item
            v-for="lang in supportedLanguages"
            :key="lang.value"
            :command="lang.value"
            :class="{ 'is-active': currentLanguage === lang.value }"
          >
            <span class="language-flag">{{ lang.flag }}</span>
            <span class="language-label">{{ lang.label }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>

      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <img :src="require('@/assets/dc.png')" class="user-avatar">
          <i class="el-icon-caret-bottom" />
        </div>
        <el-dropdown-menu slot="dropdown" class="user-dropdown">
          <!-- <el-dropdown-item divided>
            <span style="display:block;" @click="mima">{{ $t('navbar.changePassword') }}</span>
          </el-dropdown-item> -->
          <el-dropdown-item divided @click.native="logout">
            <span style="display:block;">{{ $t('navbar.logout') }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb'
import Hamburger from '@/components/Hamburger'
import { getVersion, getVersionInfo, getVersionColor } from '@/config/version'

export default {
  components: {
    Breadcrumb,
    Hamburger
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'name',
      'language/language',
      'language/supportedLanguages',
      'language/currentLanguageLabel'
    ]),
    currentLanguage() {
      return this['language/language']
    },
    supportedLanguages() {
      return this['language/supportedLanguages']
    },
    currentLanguageLabel() {
      return this['language/currentLanguageLabel']
    },
    // 获取当前版本号
    currentVersion() {
      return getVersion()
    },
    // 获取版本颜色
    versionColor() {
      return getVersionColor()
    }
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    async logout() {
      await this.$store.dispatch('user/logout')
      this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    },
    async mima() {
      await this.$store.dispatch('view/mima')
      this.$router.push(`/mima?redirect=${this.$route.fullPath}`)
    },
    fullScreen() {
      this.$router.push('/fullScreen')
    },
    // 处理语言切换
    handleLanguageChange(language) {
      if (language !== this.currentLanguage) {
        this.$store.dispatch('language/setLanguage', language)
      }
    },
    // 显示版本详细信息
    showVersionInfo() {
      const versionInfo = getVersionInfo()
      const detailMessage = `
        <div style="text-align: left; line-height: 1.6;">
          <h3 style="margin: 0 0 10px 0; color: #409eff;">${this.$t('navbar.systemVersion')}</h3>
          <p><strong>${this.$t('navbar.version')}:</strong> ${versionInfo.version}</p>
          <p><strong>${this.$t('navbar.buildDate')}:</strong> ${versionInfo.build}</p>
          <p><strong>${this.$t('navbar.environment')}:</strong> ${versionInfo.environment}</p>
          <p><strong>状态:</strong> ${versionInfo.status}</p>
          <p><strong>代号:</strong> ${versionInfo.codeName}</p>
          <p style="margin-top: 15px; padding: 10px; background-color: #f5f7fa; border-radius: 4px; font-size: 12px; color: #666;">
            ${versionInfo.description}
          </p>
        </div>
      `
      
      this.$alert(detailMessage, this.$t('navbar.versionInfo'), {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('common.confirm'),
        type: 'info'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.screenfull-svg {
  display: inline-block;
  cursor: pointer;
  fill: #5a5e66;
  ;
  width: 20px;
  height: 20px;
  vertical-align: 10px;
}

.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, .08);

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background .3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(0, 0, 0, .025)
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;
    display: flex;

    .nametitle {
      color: rgb(179, 179, 179);
      margin: 10px;
      text-align: center;
    }

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background .3s;

        &:hover {
          background: rgba(0, 0, 0, .025)
        }
      }
    }

    .version-container {
      margin-right: 15px;
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 0 8px;
      height: 100%;
      transition: background .3s;
      border-radius: 4px;

      &:hover {
        background: rgba(0, 0, 0, .025);
      }

      .el-icon-info {
        font-size: 14px;
        color: #409eff;
        margin-right: 5px;
      }

      .version-text {
        font-size: 12px;
        color: #5a5e66;
        font-weight: 500;
        letter-spacing: 0.5px;
      }
    }

    .language-container {
      margin-right: 20px;

      .language-wrapper {
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 0 8px;
        height: 100%;
        transition: background .3s;

        &:hover {
          background: rgba(0, 0, 0, .025);
        }

        .language-text {
          margin: 0 5px;
          font-size: 14px;
          color: #5a5e66;
        }

        .el-icon-s-grid {
          font-size: 16px;
          color: #5a5e66;
        }

        .el-icon-caret-bottom {
          font-size: 12px;
          color: #5a5e66;
        }
      }
    }

    .avatar-container {
      margin-right: 30px;

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;

        .user-avatar {
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }

        .el-icon-caret-bottom {
          cursor: pointer;
          position: absolute;
          right: -20px;
          top: 25px;
          font-size: 12px;
        }
      }
    }
  }
}

// 语言下拉菜单样式
.language-dropdown {
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    padding: 8px 16px;

    &.is-active {
      background-color: #f5f7fa;
      color: #409eff;
    }

    .language-flag {
      margin-right: 8px;
      font-size: 16px;
    }

    .language-label {
      font-size: 14px;
    }
  }
}
</style>
