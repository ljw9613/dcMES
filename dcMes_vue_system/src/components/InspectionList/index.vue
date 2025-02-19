<template>
  <div>
    <el-table :data="displayData" border :header-cell-style="{
      background: '#f5f7fa',
      color: '#606266',
      fontWeight: 'bold',
      textAlign: 'center'
    }" :cell-style="{ textAlign: 'center' }">
      <el-table-column label="条码" prop="barcode">
        <template slot-scope="scope">
          <el-tooltip :content="scope.row.barcode" placement="top" effect="light">
            <span>{{ scope.row.barcode }}</span>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column label="物料信息">
        <template slot-scope="scope">
          <div class="material-info">
            <div>物料编码：{{ scope.row.materialCode }}</div>
            <div>物料名称：{{ scope.row.materialName }}</div>
            <div v-if="scope.row.materialSpec">规格：{{ scope.row.materialSpec }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="检测结果" width="300">
        <template slot-scope="scope">
          <div v-for="(result, index) in scope.row.inspectionData" :key="index" class="inspection-result">

            <div class="result-info">
              <el-popover v-if="result" placement="right" width="500" trigger="hover">
                <div class="test-details">
                  <!-- 通用信息 -->
                  <div v-if="inspectionDataHandle(result).length">
                    <el-tag style="margin: 3px" v-for="tag in inspectionDataHandle(result)" :key="tag">
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
                <div class="result-main" slot="reference">
                  <div class="process-info">
                    <el-tag :type="result.error ? 'danger' : 'success'" size="small" v-if="result.processId">{{
                      result.processId.processName }}</el-tag>
                    <span v-if="result.processId">({{ result.processId.processStage }})</span>
                  </div>
                  <span :class="{
                    'success': result.error === false,
                    'error': result.error === true
                  }">{{ result.error ? '不合格' : '合格' }}</span>
                </div>
              </el-popover>
              <el-button type="text" size="mini"
                @click="showHistory(scope.row.barcode, result.processId)">历史记录</el-button>
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 历史记录弹窗 -->
    <el-dialog title="检测历史记录" append-to-body :visible.sync="historyDialogVisible" width="80%"
      :before-close="handleClose">
      <el-table :data="historyData" border stripe height="500" v-loading="historyLoading">
        :header-cell-style="{
        background: '#f5f7fa',
        color: '#606266',
        fontWeight: 'bold',
        textAlign: 'center'
        }"
        :cell-style="{ textAlign: 'center' }"
        >
        <el-table-column type="expand">
          <template slot-scope="scope">
            <el-form label-position="left" inline class="table-expand">
              <div v-if="inspectionDataHandle(scope.row).length">
                <el-tag style="margin: 3px" v-for="tag in inspectionDataHandle(scope.row)" :key="tag">
                  {{ tag }}
                </el-tag>
              </div>
            </el-form>
          </template>
        </el-table-column>

        <el-table-column label="检测时间" prop="testTime" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.testTime || scope.row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="检测结果" prop="error" width="100">
          <template slot-scope="scope">
            <el-tag :type="!scope.row.error ? 'success' : 'danger'">
              {{ !scope.row.error ? '合格' : '不合格' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="工序名称" align="center">
          <template slot-scope="scope">
            {{ scope.row.processId ? scope.row.processId.processName : '--' }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper"
          :total="total">
        </el-pagination>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { getData } from '@/api/data';
import inspectionFieldEnum from './map.json';
export default {
  name: 'InspectionList',
  props: {
    inspections: {
      type: Object,
      default: () => { }
    }
  },
  data() {
    return {
      displayData: [], // 用于展示的数据
      barcodeList: [],
      historyDialogVisible: false,
      detailDialogVisible: false,
      historyData: [],
      historyLoading: false,
      selectedRecord: null,
      currentPage: 1,
      pageSize: 20,
      total: 0,
      currentBarcode: '',
      currentProcessStep: null, // 当前选中的工序
    }
  },
  watch: {
    inspections: {
      async handler(newVal) {
        if (!newVal) return;

        let dataForm = Array.isArray(newVal) ? newVal[0] : newVal;

        if (dataForm) {
          // 构建基础检测列表
          let mainMaterial = {
            barcode: dataForm.barcode,
            inspectionItem: '主物料',
            inspectionTime: null,
            inspector: null,
            materialCode: dataForm.materialCode,
            materialId: dataForm.materialId,
            materialName: dataForm.materialName,
            materialSpec: dataForm.materialSpec,
            standard: '',
            result: '',
          }

          let inspectionList = dataForm.barcode ? [mainMaterial] : []
          const processNodes = dataForm.processNodes || []

          // 获取所有有效条码
          const allBarcodes = [dataForm.barcode, ...processNodes.map(item => item.barcode)]
            .filter(barcode => barcode && barcode.trim())

          const allBarcodesData = [mainMaterial, ...processNodes]

          if (allBarcodes.length === 0) {
            this.displayData = [];
            return;
          }

          // 获取检测数据
          const res = await getData('InspectionLastData', {
            query: {
              scanCode: { $in: allBarcodes }
            },
            populate: JSON.stringify([
              {
                path: 'processId',
                select: 'processCode processName processDesc processStage processType'
              }
            ])
          })

          let inspectionData = res.data

          for await (const element of allBarcodesData) {
            const barcode = element.barcode
            const processNode = inspectionData.filter(inspection => inspection.scanCode == barcode)
            if (processNode.length > 0) {
              console.log("🚀 ~ handler ~ processNode:", processNode)
              element.inspectionData = processNode
            }
          }

          console.log("🚀 ~ handler ~ allBarcodesData:", allBarcodesData)

          //过滤allBarcodesData，只保留有inspectionData的元素
          this.displayData = allBarcodesData.filter(element => element.inspectionData)
        }
      },
      immediate: true
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return '暂无数据';
      return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    formatValue(value, unit = '') {
      if (!value) return '未测试';
      // 如果是数字，保留两位小数
      const formattedValue = typeof value === 'number' ?
        Number(value).toFixed(2) : value;
      return `${formattedValue}${unit}`;
    },
    async showHistory(barcode, processStep) {
      this.currentBarcode = barcode
      this.currentProcessStep = processStep
      this.historyDialogVisible = true
      this.currentPage = 1
      await this.fetchHistoryData()
    },

    async fetchHistoryData() {
      this.historyLoading = true
      try {
        const query = {
          scanCode: this.currentBarcode
        }

        if (this.currentProcessStep) {
          query.processId = this.currentProcessStep._id
        }

        const res = await getData('InspectionData', {
          query,
          page: this.currentPage,
          limit: this.pageSize,
          skip: (this.currentPage - 1) * this.pageSize,
          sort: { createTime: -1 },
          count: true,
          populate: JSON.stringify([
            {
              path: 'processId',
              select: 'processCode processName processDesc processStage processType'
            }
          ])
        })

        this.historyData = res.data
        this.total = res.countnum
      } catch (error) {
        console.error('获取历史数据失败:', error)
        this.$message.error('获取历史数据失败')
      } finally {
        this.historyLoading = false
      }
    },

    handleClose() {
      this.historyDialogVisible = false
      this.historyData = []
      this.currentBarcode = ''
      this.currentProcessStep = null
    },

    showHistoryDetail(record) {
      this.selectedRecord = record
      this.detailDialogVisible = true
    },

    handleSizeChange(val) {
      this.pageSize = val
      this.fetchHistoryData()
    },

    handleCurrentChange(val) {
      this.currentPage = val
      this.fetchHistoryData()
    },
    // 判断各个模块是否有数据需要显示
    hasLampBoardTestData(testDetails) {
      return testDetails.red || testDetails.blue || testDetails.infrared ||
        testDetails.red2 || testDetails.blue2 || testDetails.infrared2;
    },
    hasSemiFinishedTestData(testDetails) {
      return testDetails.udiCode || testDetails.lampBoardQrCode || testDetails.batteryCellCode;
    },
    hasTemperatureTestData(testDetails) {
      return testDetails.instrumentNtcDifferenceBeforeCooling || testDetails.coolingStatus;
    },
    hasVoltageWithstandTestData(testDetails) {
      return testDetails.chargingTest || testDetails.withstandVoltageTest;
    },
    hasFullMachineTestData(testDetails) {
      return testDetails.cellCode || testDetails.handheldControllerPcbaCode;
    },
    hasWeightData(testDetails) {
      return testDetails.weight;
    },
    hasRemoteControlTestData(testDetails) {
      return testDetails.showSerialNo || testDetails.chkPowerOn || testDetails.enterDebugMode;
    },

    // 新增方法
    inspectionDataHandle(row) {
      let data = []
      console.log("🚀 ~ inspectionDataHandle ~ row:", row)
      for (let inspectionFieldEnumKey in inspectionFieldEnum) {
        console.log("🚀 ~ inspectionDataHandle ~ inspectionFieldEnumKey:", inspectionFieldEnumKey)
        inspectionFieldEnumKey !== "error" && !this.isBlank(row[inspectionFieldEnumKey]) && (data.push(`${inspectionFieldEnum[inspectionFieldEnumKey]}：${row[inspectionFieldEnumKey]}`))
      }
      return data
    },
    isBlank(value) {
      return (
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && Object.keys(value).length === 0)
      )
    },
    hasPositiveNegativeTest(testDetails) {
      return testDetails.positiveNegativeResult;
    },
    hasRotationSpeedTest(testDetails) {
      return testDetails.revolutionSpeedTestValue ||
        testDetails.rotationSpeedRpmIntegerPart ||
        testDetails.rotationDirectionResult;
    },
    hasVacuumTest(testDetails) {
      return testDetails.vacuumTestValue ||
        testDetails.floorBrushVacuumLowValue ||
        testDetails.floorBrushVacuumMediumValue ||
        testDetails.floorBrushVacuumHighValue;
    },
    hasCurrentVoltageTest(testDetails) {
      return testDetails.currentLowValue ||
        testDetails.currentMediumValue ||
        testDetails.currentHighValue ||
        testDetails.currentValueAInteger ||
        testDetails.voltageValueVInteger ||
        testDetails.batteryPackVoltageDifferenceVInteger;
    },
    hasStatusLightTest(testDetails) {
      return testDetails.chargingLightStartStatusResult ||
        testDetails.screenRunningStatusResult ||
        testDetails.chargingLightChargingStatusResult;
    },
    formatTestResult(result) {
      if (result === '1' || result === 1) return '合格';
      if (result === '2' || result === 2) return '不合格';
      return result;
    }
  },
  computed: {

  }
}
</script>

<style lang="scss" scoped>
.el-table {
  margin-top: 10px;

  :deep(th) {
    background: #f5f7fa;
  }

  :deep(.el-table__row) {
    transition: all 0.3s;

    &:hover {
      background-color: #f5f7fa;
    }
  }
}

.material-info {
  text-align: left;
  line-height: 1.5;

  div {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.test-details {
  .detail-section {
    margin-bottom: 15px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 4px;

    .section-title {
      font-weight: bold;
      margin-bottom: 8px;
      color: #409EFF;
      border-bottom: 1px solid #dcdfe6;
      padding-bottom: 5px;
    }

    .sub-section {
      margin-top: 10px;
      padding-left: 10px;

      .sub-title {
        font-weight: bold;
        color: #606266;
        margin-bottom: 5px;
      }
    }

    div {
      margin: 5px 0;
      font-size: 13px;
      line-height: 1.5;
    }
  }
}

.success {
  color: #67C23A;
  font-weight: bold;
}

.error {
  color: #F56C6C;
  font-weight: bold;
}

.pagination-container {
  margin-top: 15px;
  text-align: right;
}

.el-dialog {
  .el-table {
    margin: 10px 0;
  }
}

.inspection-result {
  padding: 5px 0;
  border-bottom: 1px solid #EBEEF5;

  &:last-child {
    border-bottom: none;
  }

  .process-info {
    font-size: 12px;
    color: #606266;
    margin-bottom: 3px;

    span+span {
      margin-left: 5px;
      color: #909399;
    }
  }

  .result-info {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .result-main {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .time {
      font-size: 12px;
      color: #909399;
    }
  }
}

// 新增样式
.table-expand {
  padding: 20px;
}
</style>