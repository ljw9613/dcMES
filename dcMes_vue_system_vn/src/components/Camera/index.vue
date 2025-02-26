<template>
  <div>
    <!-- 弹窗start -->
    <el-dialog
      title="视频查看"
      :before-close="beforeClose"
      :visible.sync="dialogFormVisible"
    >
      <video-player
        class="video-player vjs-custom-skin"
        ref="videoPlayer"
        :playsinline="true"
        :options="playerOptions"
      ></video-player>

      <div slot="footer" class="dialog-footer">
        <el-button @click="beforeClose()">关闭</el-button>
      </div>
    </el-dialog>
    <!-- 弹窗end -->
  </div>
</template>
  
  <script>
export default {
  props: {
    CameraUrl: {
      type: String,
      default: "",
    },
  },
  watch: {
    CameraUrl(val) {
      this.playerOptions = {
        playbackRates: [0.5, 1.0, 1.5, 2.0], //可选择的播放速度
        autoplay: false, //如果true,浏览器准备好时开始回放。
        muted: false, // 默认情况下将会消除任何音频。
        loop: false, // 视频一结束就重新开始。
        preload: "auto", // 建议浏览器在<video>加载元素后是否应该开始下载视频数据。auto浏览器选择最佳行为,立即开始加载视频（如果浏览器支持）
        language: "zh-CN",
        aspectRatio: "16:9", // 将播放器置于流畅模式，并在计算播放器的动态大小时使用该值。值应该代表一个比例 - 用冒号分隔的两个数字（例如"16:9"或"4:3"）
        fluid: true, // 当true时，Video.js player将拥有流体大小。换句话说，它将按比例缩放以适应其容器。
        sources: [
          {
            type: "",
            src: val, //url地址
          },
        ],
        poster: "", //你的封面地址
        // width: document.documentElement.clientWidth,
        notSupportedMessage: "此视频暂无法播放，请稍后再试", //允许覆盖Video.js无法播放媒体源时显示的默认信息。
        controlBar: {
          timeDivider: true, //当前时间和持续时间的分隔符
          durationDisplay: true, //显示持续时间
          remainingTimeDisplay: false, //是否显示剩余时间功能
          fullscreenToggle: true, //全屏按钮
        },
      };
    },
  },
  data() {
    return {
      dialogFormVisible: false, //显示弹窗
      // 视频播放
      playerOptions: {},
    };
  },
  methods: {
    handleEdit(index, row) {
      console.log(index, row);
    },
    handleDelete(index, row) {
      console.log(index, row);
    },
    openDiaolog() {
      console.log("打开");
      this.dialogFormVisible = true;
    },
    beforeClose() {
      this.$confirm("确认关闭？")
        .then((_) => {
          this.dialogFormVisible = false;
          let myPlayer = this.$refs.videoPlayer.player;
          //停止播放
          myPlayer.pause();
          done();
        })
        .catch((_) => {});
    },
  },
};
</script>
  
  <style>
</style>