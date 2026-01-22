<template>
  <div class="all">
    <img class="allimg" @click="toFullOrExit" src="./imgbg.jpg" />
    <!-- <el-row :gutter="20" style="width: 100%; margin: 0">
      <el-tooltip
        class="item"
        effect="dark"
        :content="isFullscreen ? '退出全屏' : '全屏'"
        placement="left"
      >
        <a
          href="javascript:void(0)"
          title="全屏"
          class="toolbar_item back2top"
          @click="toFullOrExit"
        >
          <el-button type="text">全屏</el-button>
        </a>
      </el-tooltip>
    </el-row> -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      isFullscreen: false, //全屏状态
    };
  },
  mounted() {
    setTimeout(() => {
      this.toFullOrExit();
    }, 1000);
  },
  methods: {
    /*全屏*/
    toFullOrExit() {
      this.isFullscreen = !this.isFullscreen;
      if (this.isFullscreen) {
        this.requestFullScreen();
      } else {
        this.exitFullscreen();
      }
    },

    requestFullScreen() {
      let de = document.documentElement;
      if (de.requestFullscreen) {
        de.requestFullscreen();
      } else if (de.mozRequestFullScreen) {
        de.mozRequestFullScreen();
      } else if (de.webkitRequestFullScreen) {
        de.webkitRequestFullScreen();
      }
    },
    exitFullscreen() {
      let de = document;
      if (de.exitFullscreen) {
        de.exitFullscreen();
      } else if (de.mozCancelFullScreen) {
        de.mozCancelFullScreen();
      } else if (de.webkitCancelFullScreen) {
        de.webkitCancelFullScreen();
      }
    },
    /*END*/
  },
};
</script>

<style lang="scss" scoped>
.all {
  width: 100vw;
  height: 100vh;
}
.allimg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 100;
}
</style>