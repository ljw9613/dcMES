<template>
  <div class="scan-print-container">
    <el-card class="scan-card">
      <el-form ref="scanForm" label-width="100%">
        <!-- 扫码区域 -->
        <div class="section-header">
          <i class="el-icon-camera"></i>
          <span>扫描区域</span>
        </div>
        <div class="scan-input-section">
          <el-input
            v-model="scanInput"
            placeholder="请扫描条码"
            @keyup.enter.native="handleScan"
            ref="scanInput"
            clearable
            @clear="focusInput"
          ></el-input>
        </div>

        <!-- 操作按钮 -->
        <div class="operation-buttons">
          <el-button

            type="text"
            size="small"
            @click="handleClearScan">
            <i class="el-icon-delete"></i>请扫描条码
          </el-button>

          <el-button

            type="text"
            size="small"
            @click="handleTemplateSelect">
            <i class="el-icon-document"></i> 选择打印模板-模板预览-取消
          </el-button>

          <el-button

            type="text"
            size="small"
            @click="handleSilentPrint">
            <i class="el-icon-printer"></i> 静默打印
          </el-button>
        </div>

        <!-- 打印区域 -->
        <div class="section-header">
          <div class="section-title">
            <i class="el-icon-printer"></i>
            <span>打印控制</span>
          </div>
          <div class="print-btn">
            <hir-input
              ref="hirInput"
              :default-template="printTemplate"
              @template-change="handleTemplateChange"
              :show-preview="true"
              :show-browser-print="false"
              :show-silent-print="true"
              :printData="printData"
            />
          </div>
        </div>

        <!-- 扫描结果显示 -->
        <div class="scan-result-section">
          <el-table :data="scanRecords" style="width: 100%" border>
            <el-table-column prop="code" label="扫描编码"></el-table-column>
            <el-table-column prop="time" label="扫描时间"></el-table-column>
          </el-table>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import hirInput from "@/components/hirInput";
export default {
  name: "scanBarCodeSimple",
  components: {
    hirInput,
  },
  data() {
    return {
      scanInput: "",
      printTemplate: "", // 打印模板
      scanRecords: [], // 扫描记录
      printData: {}, // 打印数据
    };
  },
  mounted() {
    this.focusInput();
    // 初始化打印模板，根据实际情况可能需要从配置或API获取
    this.loadPrintTemplate();
  },
  methods: {
    // 处理扫描
    handleScan() {
      if (!this.scanInput) return;

      // 检查打印模板
      if (!this.$refs.hirInput.selectedTemplate) {
        this.scanInput = "";
        this.focusInput();
        this.$message.warning("请先选择打印模板");
        return;
      }

      // 记录扫描结果
      const record = {
        code: this.scanInput,
        time: new Date().toLocaleString(),
      };
      this.scanRecords.unshift(record);

      // 限制最多保留5条记录
      if (this.scanRecords.length > 5) {
        this.scanRecords = this.scanRecords.slice(0, 5);
      }

      // 准备打印数据
      this.preparePrintData(record);

      // 清空输入框并重新聚焦
      this.scanInput = "";
      this.focusInput();
    },

    // 聚焦到扫描输入框
    focusInput() {
      this.$nextTick(() => {
        this.$refs.scanInput.$el.querySelector("input").focus();
      });
    },

    // 处理模板变更
    handleTemplateChange(template) {
      this.printTemplate = template;
      // 可以在这里保存用户的模板选择，例如存入localStorage
      localStorage.setItem("printTemplate", template);
    },

    // 加载打印模板
    loadPrintTemplate() {
      // 可以从localStorage或API获取模板
      const savedTemplate = localStorage.getItem("printTemplate");
      if (savedTemplate) {
        this.printTemplate = savedTemplate;
      } else {
        // 默认模板
        this.printTemplate = "默认打印模板";
      }
    },

    // 准备打印数据
    preparePrintData(record) {
      console.log(record,'record');
      this.printData = {
        printBarcode: record.code,
      };
      console.log(this.printData, "this.printData");
      this.$nextTick(() => {
        this.$refs.hirInput.handlePrints2();
      });
    },

    // 清除扫描记录
    handleClearScan() {
      this.scanRecords = [];
      this.scanInput = "";
      this.focusInput();
      this.$message.success("扫描记录已清除");
    },

    // 处理模板选择
    handleTemplateSelect() {
      // 打开模板选择面板
      if (this.$refs.hirInput) {
        this.$refs.hirInput.showTemplateDialog();
        this.$message.info("请选择打印模板");
      } else {
        this.$message.warning("打印组件未初始化");
      }
    },

    // 处理静默打印
    handleSilentPrint() {
      if (!this.$refs.hirInput.selectedTemplate) {
        this.$message.warning("请先选择打印模板");
        return;
      }

      if (this.scanRecords.length === 0) {
        this.$message.warning("没有可打印的扫描记录");
        return;
      }

      this.$nextTick(() => {
        this.$refs.hirInput.handlePrints2();
        this.$message.success("已发送打印指令");
      });
    }
  },
};
</script>

<style scoped>
.scan-print-container {
  padding: 20px;
}

.scan-card {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.section-title {
  display: flex;
  align-items: center;
}

.section-header i {
  margin-right: 5px;
  color: #409eff;
}

.scan-input-section {
  margin-bottom: 20px;
}

.print-btn {
  margin-left: auto;
}

.scan-result-section {
  margin-top: 20px;
}

.operation-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.operation-buttons .el-button {
  color: #409EFF;
  font-size: 13px;
}

.operation-buttons .el-button i {
  margin-right: 5px;
  font-size: 14px;
}
</style>
