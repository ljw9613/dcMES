<template>
  <div id="data-view">
		<dv-loading v-if="!isOk">Loading...</dv-loading>
    <dv-full-screen-container v-if="isOk">
      <top-header />

      <div class="main-content">
        <digital-flop />

        <div class="block-left-right-content">
          <ranking-board />

          <div class="block-top-bottom-content">
            <div class="block-top-content">
              <rose-chart />

              <water-level-chart />

              <scroll-board />
            </div>

            <cards />
          </div>
        </div>
      </div>
    </dv-full-screen-container>
  </div>
</template>

<script>
import topHeader from './topHeader'
import digitalFlop from './digitalFlop'
import rankingBoard from './rankingBoard'
import roseChart from './roseChart'
import waterLevelChart from './waterLevelChart'
import scrollBoard from './scrollBoard'
import cards from './cards'

export default {
  name: 'DataView',
  components: {
    topHeader,
    digitalFlop,
    rankingBoard,
    roseChart,
    waterLevelChart,
    scrollBoard,
    cards
  },
  data() {
    return {
			isOk:false
    }
  },
  created() {
    const that = this
    window.addEventListener(
      'resize', that.resizeLogic, false
    )
		setTimeout(() => {
			this.isOk = true
		},1500)
  },
  mounted() {
    this.handleFullScreen()
  },
  beforeDestroy() {
		const that = this
		console.log('销毁')
    window.removeEventListener("resize",that.resizeLogic);
  },
  methods: {
    handleFullScreen() {
      // 全屏
      var docElm = document.documentElement
      // W3C
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen()
      } else if (docElm.mozRequestFullScreen) {
        // FireFox
        docElm.mozRequestFullScreen()
      } else if (docElm.webkitRequestFullScreen) {
        // Chrome等
        docElm.webkitRequestFullScreen()
      } else if (docElm.msRequestFullscreen) {
        // IE11
        docElm.msRequestFullscreen()
      }
    },
    checkFull() {
      var isFull =
				document.fullscreenElement ||
				document.mozFullScreenElement ||
				document.webkitFullscreenElement
      // to fix : false || undefined == undefined
      if (isFull === undefined) isFull = false
      return isFull
    },
    resizeLogic() {
      if (!this.checkFull()) {
				console.log('退出')
				this.isOk = false
				setTimeout(() => {
					this.$router.back()
				}, 1500)
			}
    }
  }
}
</script>

<style lang="less">
#data-view {
  width: 100%;
  height: 100%;
  background-color: #030409;
  color: #fff;

  #dv-full-screen-container {
    background-image: url('./img/bg.png');
    background-size: 100% 100%;
    box-shadow: 0 0 3px blue;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .block-left-right-content {
    flex: 1;
    display: flex;
    margin-top: 20px;
  }

  .block-top-bottom-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding-left: 20px;
  }

  .block-top-content {
    height: 55%;
    display: flex;
    flex-grow: 0;
    box-sizing: border-box;
    padding-bottom: 20px;
  }
}
</style>
