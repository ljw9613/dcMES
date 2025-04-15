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
        <div v-if="type != 'ok'" class="status-text">
          {{ text }}
        </div>

        <!-- 补充信息 -->
        <!-- <div v-if="subText" class="sub-text">
            {{ subText }}
          </div> -->
        <!-- 错误编码 -->
        <div v-if="type != 'ok' && matchedErrorCode" class="error-code">
          {{ matchedErrorCode }}
        </div>
      </div>
    </div>
  </transition>
</template>
  
<script>
export default {
  name: "StatusPopup",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: "ok", // 'ok' 或 'ng'
      validator: (value) => ["ok", "ng"].includes(value),
    },
    text: {
      type: String,
      default: "",
    },
    subText: {
      type: String,
      default: "",
    },
    errorCode: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 5000,
    },
  },
  data() {
    return {
      matchedErrorCode: "",
      errorCodeMap: {
        "该DI编码不存在本系统": "LINE-A-001",
        "该DI编码未关联有效物料": "LINE-A-002",
        "该DI编码对应的物料与当前工序不匹配": "LINE-A-003",
        "该条码不符合任何已配置的规则或物料不匹配": "LINE-A-004",
        "未找到对应的主条码流程记录": "LINE-B-001",
        "未找到对应的工序节点": "LINE-B-002",
        "工序节点已完成或处于异常状态": "LINE-B-003",
        "该条码存在未完成的维修记录": "LINE-B-004",
        "该条码已完成维修,但维修结果为不合格": "LINE-B-005",
        "该条码已作废": "LINE-B-006",
        "条码不匹配主物料": "LINE-B-007",
        "重复扫码": "LINE-B-008",
        "存在未完成的前置工序": "LINE-C-001",
        "扫码数量与要求不符": "LINE-C-002",
        "存在重复扫描的条码": "LINE-C-003",
        "物料不属于当前工序要求扫描的物料": "LINE-C-004",
        "批次物料条码已达到使用次数限制": "LINE-D-001",
        "未找到条码为的子物料流程记录": "LINE-D-002",
        "该物料条码的子物料工序未完成": "LINE-D-003",
        "关键物料重复使用错误": "LINE-E-001",
        "已被其他流程使用": "LINE-E-002",
        "关键物料必须先扫描主条码": "LINE-E-003",
        "未查询到生产工单": "LINE-F-001",
        "工单已达到计划数量": "LINE-F-002",
        "缺少必要参数": "LINE-G-001",
        "未找到物料编码为": "LINE-G-002",
        "未找到物料对应的工艺信息": "LINE-G-003",
        "条码参数不能为空": "LINE-G-004",
        "成品工艺未查询到产线计划": "LINE-F-003",
        "未找到有效的产线工单": "LINE-F-004",
        "产品条码未绑定工单": "LINE-F-005",
        "当前产线工单与产品条码工单不一致": "LINE-F-006",
        "更新工单投入量失败": "LINE-F-007",
        "条码与物料不匹配": "LINE-H-001",
        "未找到对应的设备信息": "LINE-H-002",
        "未找到对应的工序信息": "LINE-H-003",
        "未找到对应的工艺信息": "LINE-H-004",
        "未找到对应的物料信息": "LINE-H-005",
        "未找到指定的物料节点或物料节点不属于指定工序": "LINE-I-001",
        "原物料条码不匹配": "LINE-I-002",
        "未找到对应的部件替换维修记录": "LINE-I-003",
        "新条码物料类型": "LINE-I-004",
        "新条码的流程未完成": "LINE-I-005",
        "新条码验证失败": "LINE-I-006",
        "验证流程数据失败": "LINE-J-001",
        "创建工艺流程记录失败": "LINE-J-002",
        "处理扫码请求失败": "LINE-J-003",
        "修复条码物料异常数据失败": "LINE-J-004",
        "未找到该RFID标签对应的条码": "LINE-K-001",
      },
    };
  },
  computed: {
    iconClass() {
      return this.type === "ok" ? "el-icon-check" : "el-icon-close";
    },
  },
  watch: {
    visible(val) {
      if (val) {
        const displayDuration = this.type === 'ok' ? 1500 : this.duration;
        this.startTimer(displayDuration);
      }
      if (val && this.type === "ng") {
        this.matchErrorCode();
      }
    },
    text(val) {
      if (this.type === "ng") {
        this.matchErrorCode();
      }
    },
  },
  methods: {
    matchErrorCode() {
      // 如果已经有errorCode属性，直接使用
      if (this.errorCode) {
        this.matchedErrorCode = this.errorCode;
        return;
      }

      // 否则根据错误消息匹配错误编码
      if (!this.text) {
        this.matchedErrorCode = "";
        return;
      }

      // 遍历错误映射对象，查找匹配项
      for (const [message, code] of Object.entries(this.errorCodeMap)) {
        if (this.text.includes(message)) {
          this.matchedErrorCode = code;
          return;
        }
      }

      // 如果没有找到匹配的错误编码，设置为空
      this.matchedErrorCode = "";
    },
    startTimer(duration) {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.handleClose();
      }, duration);
    },
    handleClose() {
      this.$emit("update:visible", false);
      this.matchedErrorCode = ""; // 关闭时清空错误编码
    },
  },
  beforeDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  },
};
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
  border: 4px solid #67c23a;
}

.status-popup.ok .status-icon {
  color: #67c23a;
  text-shadow: 0 0 20px rgba(103, 194, 58, 0.5);
}

/* NG状态样式 */
.status-popup.ng {
  border: 4px solid #f56c6c;
}

.status-popup.ng .status-icon {
  color: #f56c6c;
  text-shadow: 0 0 20px rgba(245, 108, 108, 0.5);
}

.status-icon {
  font-size: 120px;
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

.status-text {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
}

.sub-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.error-code {
  font-size: 20px;
  color: #f56c6c;
  margin-top: 10px;
  font-weight: bold;
}

/* 背景网格效果 */
.bg-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: linear-gradient(
      rgba(255, 255, 255, 0.05) 1px,
      transparent 1px
    ),
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
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes rotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes gridMove {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(20px);
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style> 