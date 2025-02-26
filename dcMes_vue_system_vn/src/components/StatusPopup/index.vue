<template>
    <transition name="fade">
      <div v-if="visible" class="status-popup-overlay" @click="handleClose">
        <div class="status-popup" :class="type">
          <!-- 背景动画效果 -->
          <div class="bg-animation"></div>
          <div class="bg-grid"></div>
          
          <!-- 状态图标 -->
          <div class="status-icon">
            <i :class="iconClass"></i>
          </div>
  
          <!-- 状态文本 -->
          <div class="status-text">
            {{ text }}
          </div>
  
          <!-- 补充信息 -->
          <div v-if="subText" class="sub-text">
            {{ subText }}
          </div>
        </div>
      </div>
    </transition>
  </template>
  
  <script>
  export default {
    name: 'StatusPopup',
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        default: 'ok', // 'ok' 或 'ng'
        validator: value => ['ok', 'ng'].includes(value)
      },
      text: {
        type: String,
        default: ''
      },
      subText: {
        type: String,
        default: ''
      },
      duration: {
        type: Number,
        default: 2000
      }
    },
    computed: {
      iconClass() {
        return this.type === 'ok' 
          ? 'el-icon-check' 
          : 'el-icon-close'
      }
    },
    watch: {
      visible(val) {
        if (val && this.duration > 0) {
          this.startTimer()
        }
      }
    },
    methods: {
      startTimer() {
        if (this.timer) {
          clearTimeout(this.timer)
        }
        this.timer = setTimeout(() => {
          this.handleClose()
        }, this.duration)
      },
      handleClose() {
        this.$emit('update:visible', false)
      }
    },
    beforeDestroy() {
      if (this.timer) {
        clearTimeout(this.timer)
      }
    }
  }
  </script>
  
  <style  scoped>
  .status-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  /* background: rgba(0, 0, 0, 0.7); */
  /* backdrop-filter: blur(5px); */
  
  .status-popup {
    position: relative;
    width: 400px;
    height: 400px;
    background: #1a1a1a;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
  }
  
  /* OK状态样式 */
  .status-popup.ok {
    border: 4px solid #67C23A;
  }
  
  .status-popup.ok .status-icon {
    color: #67C23A;
    text-shadow: 0 0 20px rgba(103, 194, 58, 0.5);
  }
  
  /* NG状态样式 */
  .status-popup.ng {
    border: 4px solid #F56C6C;
  }
  
  .status-popup.ng .status-icon {
    color: #F56C6C;
    text-shadow: 0 0 20px rgba(245, 108, 108, 0.5);
  }
  
  .status-icon {
    font-size: 120px;
    margin-bottom: 20px;
    animation: pulse 2s infinite;
  }
  
  .status-text {
    font-size: 80px;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    margin-bottom: 10px;
  }
  
  .sub-text {
    font-size: 24px;
    color: rgba(255, 255, 255, 0.8);
  }
  
  /* 背景网格效果 */
  .bg-grid {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
    animation: gridMove 20s linear infinite;
  }
  
  /* 背景动画效果 */
  .bg-animation {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 150%;
    height: 150%;
    transform: translate(-50%, -50%) rotate(0deg);
    background: radial-gradient(circle, transparent 30%, #000 70%);
    animation: rotate 10s linear infinite;
  }
  
  /* 动画定义 */
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  @keyframes rotate {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
  
  @keyframes gridMove {
    from { transform: translateY(0); }
    to { transform: translateY(20px); }
  }
  
  /* 过渡动画 */
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }
  </style> 