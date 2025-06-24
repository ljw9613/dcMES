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
          {{ localizedText }}
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
      // 错误消息键名到错误码的映射
      errorCodeMap: {
        "diCodeNotExists": "LINE-A-001",
        "diCodeNoMaterial": "LINE-A-002",
        "diCodeMaterialMismatch": "LINE-A-003",
        "barcodeRuleMismatch": "LINE-A-004",
        "mainBarcodeNotFound": "LINE-B-001",
        "processNodeNotFound": "LINE-B-002",
        "processNodeCompleted": "LINE-B-003",
        "repairRecordExists": "LINE-B-004",
        "repairResultFailed": "LINE-B-005",
        "barcodeVoided": "LINE-B-006",
        "barcodeMaterialMismatch": "LINE-B-007",
        "duplicateBarcode": "LINE-B-008",
        "prerequisiteIncomplete": "LINE-C-001",
        "quantityMismatch": "LINE-C-002",
        "duplicateScan": "LINE-C-003",
        "materialNotRequired": "LINE-C-004",
        "batchLimitReached": "LINE-D-001",
        "subMaterialNotFound": "LINE-D-002",
        "subMaterialIncomplete": "LINE-D-003",
        "keyMaterialDuplicate": "LINE-E-001",
        "usedByOtherProcess": "LINE-E-002",
        "keyMaterialMainRequired": "LINE-E-003",
        "workOrderNotFound": "LINE-F-001",
        "workOrderQuantityReached": "LINE-F-002",
        "missingParameters": "LINE-G-001",
        "materialCodeNotFound": "LINE-G-002",
        "craftInfoNotFound": "LINE-G-003",
        "barcodeParameterEmpty": "LINE-G-004",
        "productionPlanNotFound": "LINE-F-003",
        "validWorkOrderNotFound": "LINE-F-004",
        "productBarcodeNotBound": "LINE-F-005",
        "workOrderMismatch": "LINE-F-006",
        "updateWorkOrderFailed": "LINE-F-007",
        "barcodeMaterialNotMatch": "LINE-H-001",
        "equipmentInfoNotFound": "LINE-H-002",
        "processInfoNotFound": "LINE-H-003",
        "craftInfoNotFound2": "LINE-H-004",
        "materialInfoNotFound": "LINE-H-005",
        "materialNodeNotFound": "LINE-I-001",
        "originalBarcodeMismatch": "LINE-I-002",
        "repairRecordNotFound": "LINE-I-003",
        "newBarcodeType": "LINE-I-004",
        "newBarcodeIncomplete": "LINE-I-005",
        "newBarcodeValidationFailed": "LINE-I-006",
        "processDataValidationFailed": "LINE-J-001",
        "createProcessRecordFailed": "LINE-J-002",
        "scanRequestFailed": "LINE-J-003",
        "fixBarcodeDataFailed": "LINE-J-004",
        "rfidBarcodeNotFound": "LINE-K-001",
      },
      // 中文错误消息到键名的映射（用于向后兼容）
      chineseErrorMap: {
        "该DI编码不存在本系统": "diCodeNotExists",
        "该DI编码未关联有效物料": "diCodeNoMaterial",
        "该DI编码对应的物料与当前工序不匹配": "diCodeMaterialMismatch",
        "该条码不符合任何已配置的规则或物料不匹配": "barcodeRuleMismatch",
        "未找到对应的主条码流程记录": "mainBarcodeNotFound",
        "未找到对应的工序节点": "processNodeNotFound",
        "工序节点已完成或处于异常状态": "processNodeCompleted",
        "该条码存在未完成的维修记录": "repairRecordExists",
        "该条码已完成维修,但维修结果为不合格": "repairResultFailed",
        "该条码已作废": "barcodeVoided",
        "条码不匹配主物料": "barcodeMaterialMismatch",
        "重复扫码": "duplicateBarcode",
        "存在未完成的前置工序": "prerequisiteIncomplete",
        "扫码数量与要求不符": "quantityMismatch",
        "存在重复扫描的条码": "duplicateScan",
        "物料不属于当前工序要求扫描的物料": "materialNotRequired",
        "批次物料条码已达到使用次数限制": "batchLimitReached",
        "未找到条码为的子物料流程记录": "subMaterialNotFound",
        "该物料条码的子物料工序未完成": "subMaterialIncomplete",
        "关键物料重复使用错误": "keyMaterialDuplicate",
        "已被其他流程使用": "usedByOtherProcess",
        "关键物料必须先扫描主条码": "keyMaterialMainRequired",
        "未查询到生产工单": "workOrderNotFound",
        "工单已达到计划数量": "workOrderQuantityReached",
        "缺少必要参数": "missingParameters",
        "未找到物料编码为": "materialCodeNotFound",
        "未找到物料对应的工艺信息": "craftInfoNotFound",
        "条码参数不能为空": "barcodeParameterEmpty",
        "成品工艺未查询到产线计划": "productionPlanNotFound",
        "未找到有效的产线工单": "validWorkOrderNotFound",
        "产品条码未绑定工单": "productBarcodeNotBound",
        "当前产线工单与产品条码工单不一致": "workOrderMismatch",
        "更新工单投入量失败": "updateWorkOrderFailed",
        "条码与物料不匹配": "barcodeMaterialNotMatch",
        "未找到对应的设备信息": "equipmentInfoNotFound",
        "未找到对应的工序信息": "processInfoNotFound",
        "未找到对应的工艺信息": "craftInfoNotFound2",
        "未找到对应的物料信息": "materialInfoNotFound",
        "未找到指定的物料节点或物料节点不属于指定工序": "materialNodeNotFound",
        "原物料条码不匹配": "originalBarcodeMismatch",
        "未找到对应的部件替换维修记录": "repairRecordNotFound",
        "新条码物料类型": "newBarcodeType",
        "新条码的流程未完成": "newBarcodeIncomplete",
        "新条码验证失败": "newBarcodeValidationFailed",
        "验证流程数据失败": "processDataValidationFailed",
        "创建工艺流程记录失败": "createProcessRecordFailed",
        "处理扫码请求失败": "scanRequestFailed",
        "修复条码物料异常数据失败": "fixBarcodeDataFailed",
        "未找到该RFID标签对应的条码": "rfidBarcodeNotFound",
      },
    };
  },
  computed: {
    iconClass() {
      return this.type === "ok" ? "el-icon-check" : "el-icon-close";
    },
    // 获取国际化的错误消息
    localizedText() {
      if (this.type === "ok") {
        return this.text;
      }

      // 尝试从错误消息映射中获取键名
      const errorKey = this.getErrorKey(this.text);
      if (errorKey) {
        return this.$t(`statusPopup.errorMessages.${errorKey}`);
      }

      // 如果没有找到对应的键名，返回原始文本
      return this.text;
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
    text() {
      if (this.type === "ng") {
        this.matchErrorCode();
      }
    },
  },
  methods: {
    // 根据错误消息获取错误键名
    getErrorKey(errorMessage) {
      if (!errorMessage) return null;

      // 首先检查是否是中文错误消息
      const chineseKey = this.chineseErrorMap[errorMessage];
      if (chineseKey) {
        return chineseKey;
      }

      // 检查是否包含中文错误消息的部分匹配
      for (const [chineseMsg, key] of Object.entries(this.chineseErrorMap)) {
        if (errorMessage.includes(chineseMsg)) {
          return key;
        }
      }

      return null;
    },

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

      // 首先尝试通过错误键名获取错误码
      const errorKey = this.getErrorKey(this.text);
      if (errorKey && this.errorCodeMap[errorKey]) {
        this.matchedErrorCode = this.errorCodeMap[errorKey];
        return;
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