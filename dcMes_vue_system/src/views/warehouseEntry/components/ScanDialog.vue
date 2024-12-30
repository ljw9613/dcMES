<template>
  <el-dialog :title="title" :visible.sync="dialogVisible" width="800px" @close="handleClose">
    <div class="scan-container">
      <!-- 扫码输入区域 -->
      <el-form :model="scanForm" ref="scanForm" :rules="rules">
        <el-form-item prop="barcode">
          <el-input v-model="scanForm.barcode" :placeholder="placeholder" @keyup.enter.native="handleScanInput"
            ref="scanInput" clearable>
            <!-- <template slot="append">
              <el-button @click="handleScanInput">确认</el-button>
            </template> -->
          </el-input>
        </el-form-item>
      </el-form>

      <!-- 在扫描记录列表上方添加入库单信息卡片 -->
      <div class="entry-info" v-if="entryInfo">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>入库单信息</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>入库单号：</label>
                <span>{{ entryInfo.entryNo }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>生产订单：</label>
                <span>{{ entryInfo.productionOrderNo }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>销售订单：</label>
                <span>{{ entryInfo.saleOrderNo }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>物料名称：</label>
                <span>{{ entryInfo.materialName }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>规格型号：</label>
                <span>{{ entryInfo.materialSpec }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>完成进度：</label>
                <el-progress :percentage="entryInfo.progress" :status="entryInfo.progress >= 100 ? 'success' : ''" />
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>计划数量：</label>
                <span>{{ entryInfo.plannedQuantity }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>实际数量：</label>
                <span>{{ entryInfo.actualQuantity }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>托盘数量：</label>
                <span>{{ entryInfo.palletCount }}</span>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 扫描记录列表 -->
      <div class="scan-list">
        <el-table :data="scanRecords" border style="width: 100%">
          <el-table-column label="托盘编号" prop="palletCode" align="center" />
          <el-table-column label="销售订单" prop="saleOrderNo" align="center" />
          <el-table-column label="物料编码" prop="materialCode" align="center" />
          <el-table-column label="数量" prop="quantity" align="center" />
          <el-table-column label="产线" prop="lineCode" align="center" />
          <el-table-column label="扫描时间" align="center">
            <template slot-scope="scope">
              {{ formatDateTime(scope.row.scanTime) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleComplete" :disabled="!scanRecords.length">
        完成入库
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { scanPallet, deletePallet } from "@/api/warehouse/entry";
export default {
  name: 'ScanDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '托盘扫码入库'
    },
    placeholder: {
      type: String,
      default: '请扫描托盘条码'
    }
  },
  data() {
    return {
      dialogVisible: false,
      scanForm: {
        barcode: ''
      },
      rules: {
        barcode: [
          { required: true, message: '请输入或扫描条码', trigger: 'blur' }
        ]
      },
      scanRecords: [],
      entryInfo: null
    }
  },
  watch: {
    visible(val) {
      this.dialogVisible = val
      if (val) {
        this.$nextTick(() => {
          this.$refs.scanInput.focus()
        })
      }
    },
    dialogVisible(val) {
      this.$emit('update:visible', val)
      if (!val) {
        this.resetForm()
      }
    }
  },
  methods: {
    async handleScanInput() {
      try {
        await this.$refs.scanForm.validate()
        const barcode = this.scanForm.barcode.trim()

        // 发送扫描事件到父组件
        const success = await this.$emit('scan', barcode)

        if (success) {
          // 解析条码信息
          const [palletCode, saleOrderNo, materialCode, quantity, lineCode] = barcode.split('#')

          if (!palletCode || !saleOrderNo || !materialCode || !quantity) {
            throw new Error('无效的托盘条码格式');
          }

          // 调用托盘入库API
          const response = await scanPallet({
            palletCode,
            userId: this.$store.state.user.id
          });

          // 更新入库单信息
          if (response.data) {
            this.entryInfo = response.data;
          }

          if (response.code !== 200) {
            this.$message.error(response.message);
            return;
          }

          this.$message.success("扫码入库成功");

          // 添加到扫描记录
          this.scanRecords.unshift({
            palletCode,
            saleOrderNo,
            materialCode,
            quantity: Number(quantity),
            lineCode,
            scanTime: new Date()
          })

          // 清空输入框
          this.scanForm.barcode = ''
        }
      } catch (error) {
        console.error('扫描失败:', error)
      }
    },

    async handleComplete() {
      try {
        await this.$emit('complete', this.scanRecords.map(record => record.palletCode))
        this.dialogVisible = false
      } catch (error) {
        console.error('完成入库失败:', error)
      }
    },

    handleClose() {
      this.resetForm()
    },

    resetForm() {
      this.scanForm.barcode = ''
      this.scanRecords = []
      this.entryInfo = null
      if (this.$refs.scanForm) {
        this.$refs.scanForm.resetFields()
      }
    },

    formatDateTime(date) {
      return new Date(date).toLocaleString()
    }
  }
}
</script>

<style lang="scss" scoped>
.scan-container {
  .entry-info {
    margin-bottom: 20px;

    .info-item {
      margin-bottom: 10px;

      label {
        color: #606266;
        margin-right: 8px;
      }

      span {
        color: #303133;
        font-weight: 500;
      }
    }
  }

  .scan-list {
    margin-top: 20px;
    max-height: 400px;
    overflow-y: auto;
  }
}
</style>
