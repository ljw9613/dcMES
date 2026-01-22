<template>
  <div id="top-header">
    <dv-decoration-8 class="header-left-decoration" />
    <dv-decoration-5 class="header-center-decoration" />
    <dv-decoration-8 class="header-right-decoration" :reverse="true" />
    <div class="center-title">澳门直聘综合数据</div>
    <div class="backBut" @click="backFull()">退出全屏</div>
  </div>
</template>

<script>
export default {
  name: 'TopHeader',
  methods: {
    backFull() {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.mozCancelFullScreen) {
        // FireFox
        document.mozCancelFullScreen()
      } else if (document.webkitCancelFullScreen) {
        // Chrome等
        document.webkitCancelFullScreen()
      } else if (document.msExitFullscreen) {
        // IE11
        document.msExitFullscreen()
      }
    }
  }
}
</script>

<style lang="less">
#top-header {
  position: relative;
  width: 100%;
  height: 100px;
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;

  .header-center-decoration {
    width: 40%;
    height: 60px;
    margin-top: 30px;
  }

  .header-left-decoration, .header-right-decoration {
    width: 25%;
    height: 60px;
  }

  .center-title {
    position: absolute;
    font-size: 30px;
    font-weight: bold;
    left: 50%;
    top: 15px;
    transform: translateX(-50%);
  }
}
.backBut {
	position: absolute;
	right: 1%;
	top: 65%;
	z-index: 555;
	font-weight: bold;
	font-size: 15px;
	border: 2px solid #0068c3;
	padding: 10px;
	border-radius: 5px;
}
.backBut:hover {
	background-color: #409EFF;
	cursor:pointer;
}
</style>
