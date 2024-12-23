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
                  <div class="detail-section">
                    <div class="section-title">基础信息</div>
                    <div v-if="result.startDate">日期：{{ result.startDate }}</div>
                    <div v-if="result.workstation">工位号：{{ result.workstation }}</div>
                    <div v-if="result.productModel">产品型号：{{ result.productModel }}</div>
                  </div>

                  <!-- 面罩灯板测试 -->
                  <div class="detail-section" v-if="hasLampBoardTestData(result)">
                    <div class="section-title">面罩灯板测试</div>
                    <div v-if="result.red">红色：{{ result.red }}</div>
                    <div v-if="result.blue">蓝色：{{ result.blue }}</div>
                    <div v-if="result.infrared">红外：{{ result.infrared }}</div>
                    <div v-if="result.red2">红色2：{{ result.red2 }}</div>
                    <div v-if="result.blue2">蓝色2：{{ result.blue2 }}</div>
                    <div v-if="result.infrared2">红外2：{{ result.infrared2 }}</div>
                  </div>

                  <!-- 面罩半成品测试 -->
                  <div class="detail-section" v-if="hasSemiFinishedTestData(result)">
                    <div class="section-title">面罩半成品测试</div>
                    <div v-if="result.udiCode">UDI码：{{ result.udiCode }}</div>
                    <div v-if="result.lampBoardQrCode">灯板二维码：{{ result.lampBoardQrCode }}</div>
                    <div v-if="result.batteryCellCode">电芯码：{{ result.batteryCellCode }}</div>
                    <div v-if="result.chargingBoardPcbaCode">充电板PCBA码：{{
                      result.chargingBoardPcbaCode }}</div>
                    <div v-if="result.maskPcbaCode">面罩PCBA码：{{ result.maskPcbaCode }}</div>
                    <div v-if="result.controllerPcbaCode">手控器PCBA码：{{ result.controllerPcbaCode
                      }}</div>
                    <div v-if="result.controllerSoftwareVersion">手控器软件版本：{{
                      result.controllerSoftwareVersion }}</div>
                    <div v-if="result.maskSoftwareVersion">面罩软件版本：{{ result.maskSoftwareVersion
                      }}</div>
                    <div v-if="result.controllerFactoryQrCode">手控器出厂二维码：{{
                      result.controllerFactoryQrCode }}</div>
                    <div v-if="result.faceDetectionProgramVersion">面部探测程序版本：{{
                      result.faceDetectionProgramVersion }}</div>
                    <div v-if="result.circuitFaultCode">电路故障码：{{ result.circuitFaultCode }}
                    </div>

                    <!-- 光波参数 -->
                    <div class="sub-section">
                      <div class="sub-title">光波参数</div>
                      <div v-if="result.redLightWavelength">红灯波长：{{ result.redLightWavelength }}
                      </div>
                      <div v-if="result.blueLightWavelength">蓝灯波长：{{ result.blueLightWavelength
                        }}</div>
                      <div v-if="result.infraredLightWavelength">红外灯波长：{{
                        result.infraredLightWavelength }}</div>
                      <div v-if="result.redLightCurrent">红灯电流：{{ result.redLightCurrent }}</div>
                      <div v-if="result.blueLightCurrent">蓝灯电流：{{ result.blueLightCurrent }}
                      </div>
                      <div v-if="result.infraredLightCurrent">红外灯电流：{{
                        result.infraredLightCurrent }}</div>
                      <div v-if="result.msiLightCurrent">MSI灯电流：{{ result.msiLightCurrent }}
                      </div>
                    </div>

                    <!-- 电池参数 -->
                    <div class="sub-section">
                      <div class="sub-title">电池参数</div>
                      <div v-if="result.batteryVoltage">电池电压：{{ result.batteryVoltage }}</div>
                      <div v-if="result.dischargeCurrent">放电电流：{{ result.dischargeCurrent }}
                      </div>
                      <div v-if="result.batteryPower">电池电量：{{ result.batteryPower }}</div>
                      <div v-if="result.batteryCell1Voltage">电芯1电压：{{ result.batteryCell1Voltage
                        }}</div>
                      <div v-if="result.batteryCell2Voltage">电芯2电压：{{ result.batteryCell2Voltage
                        }}</div>
                    </div>

                    <!-- 传感器参数 -->
                    <div class="sub-section">
                      <div class="sub-title">传感器参数</div>
                      <div v-if="result.faceSensorStatus">面部传感器状态：{{ result.faceSensorStatus }}
                      </div>
                      <div v-if="result.faceSensorValue">面部传感器值：{{ result.faceSensorValue }}
                      </div>
                      <div v-if="result.fanCurrent">风扇电流：{{ result.fanCurrent }}</div>
                    </div>
                  </div>

                  <!-- 面罩温度测试 -->
                  <div class="detail-section" v-if="hasTemperatureTestData(result)">
                    <div class="section-title">面罩温度测试</div>
                    <div v-if="result.instrumentNtcDifferenceBeforeCooling">制冷前NTC差值：{{
                      result.instrumentNtcDifferenceBeforeCooling }}</div>
                    <div v-if="result.productAndInstrumentNtc1Difference">产品NTC1和仪器NTC1差值：{{
                      result.productAndInstrumentNtc1Difference }}</div>
                    <div v-if="result.productAndInstrumentNtc2Difference">产品NTC2和仪器NTC2差值：{{
                      result.productAndInstrumentNtc2Difference }}</div>
                    <div v-if="result.coolingStatus">制冷状态：{{ result.coolingStatus }}</div>
                    <div v-if="result.coolingSetTemperature">制冷设置温度：{{
                      result.coolingSetTemperature }}</div>
                  </div>

                  <!-- 耐压测试 -->
                  <div class="detail-section" v-if="hasVoltageWithstandTestData(result)">
                    <div class="section-title">耐压测试</div>
                    <div v-if="result.chargingTest">充电测试：{{ result.chargingTest }}</div>
                    <div v-if="result.withstandVoltageTest">耐压测试：{{ result.withstandVoltageTest
                      }}</div>
                  </div>

                  <!-- 模板整机灯光 -->
                  <div class="detail-section" v-if="hasFullMachineTestData(result)">
                    <div class="section-title">整机灯光测试</div>
                    <div v-if="result.cellCode">电芯码：{{ result.cellCode }}</div>
                    <div v-if="result.handheldControllerPcbaCode">手控器PCBA码：{{
                      result.handheldControllerPcbaCode }}</div>
                    <div v-if="result.handheldSoftwareVersion">手控器软件版本：{{
                      result.handheldSoftwareVersion }}</div>
                    <div v-if="result.handheldFactoryQrCode">手控器出厂二维码：{{
                      result.handheldFactoryQrCode }}</div>
                    <div v-if="result.batteryCapacity">电池电量：{{ result.batteryCapacity }}</div>
                    <div v-if="result.cell1Voltage">电芯1电压：{{ result.cell1Voltage }}</div>
                    <div v-if="result.cell2Voltage">电芯2电压：{{ result.cell2Voltage }}</div>
                    <div v-if="result.meterChargingCurrent">仪表充电电流：{{
                      result.meterChargingCurrent }}</div>
                  </div>

                  <!-- 电子秤重量 -->
                  <div class="detail-section" v-if="hasWeightData(result)">
                    <div class="section-title">电子秤重量</div>
                    <div v-if="result.weight">称重重量：{{ result.weight }}</div>
                  </div>

                  <!-- 遥控测试 -->
                  <div class="detail-section" v-if="hasRemoteControlTestData(result)">
                    <div class="section-title">遥控测试</div>
                    <div v-if="result.showSerialNo">显示序列号：{{ result.showSerialNo }}</div>
                    <div v-if="result.chkPowerOn">上电开机：{{ result.chkPowerOn }}</div>
                    <div v-if="result.enterDebugMode">进入调试模式：{{ result.enterDebugMode }}</div>
                    <div v-if="result.readAllKeyOff">按键关闭状态：{{ result.readAllKeyOff }}</div>
                    <div v-if="result.readK4K5">左右键状态：{{ result.readK4K5 }}</div>
                    <div v-if="result.readPotentiometer">编码开关：{{ result.readPotentiometer }}
                    </div>
                    <div v-if="result.chkUiVersion">软件版本：{{ result.chkUiVersion }}</div>
                    <div v-if="result.chkUiTx">通讯口校验：{{ result.chkUiTx }}</div>
                  </div>

                  <!-- 测试结果 -->
                  <div class="detail-section" v-if="result.passFail">
                    <div class="section-title">测试结果</div>
                    <div v-if="result.passFail">测试结果：{{ result.passFail }}</div>
                    <div v-if="result.testTime">测试耗时：{{ result.testTime }}秒</div>
                    <div v-if="result.startTime">开始时间：{{ result.startTime }}</div>
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
        <el-table-column label="检测时间" prop="testTime" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.testTime || scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="检测结果" prop="allTestEnd" width="100">
          <template slot-scope="scope">
            <span :class="{
              'success': scope.row.allTestEnd === 'PASS',
              'error': scope.row.allTestEnd === 'FAIL'
            }">
              {{ scope.row.allTestEnd }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="电池包电压" prop="readPackVol" width="120">
          <template slot-scope="scope">
            <div class="result-info">
              <el-popover placement="right" width="500" trigger="hover">
                <div class="test-details">
                  <!-- 通用信息 -->
                  <div class="detail-section">
                    <div class="section-title">基础信息</div>
                    <div v-if="scope.row.startDate">日期：{{ scope.row.startDate }}</div>
                    <div v-if="scope.row.workstation">工位号：{{ scope.row.workstation }}</div>
                    <div v-if="scope.row.productModel">产品型号：{{ scope.row.productModel }}</div>
                  </div>

                  <!-- 面罩灯板测试 -->
                  <div class="detail-section" v-if="scope.row.red">
                    <div class="section-title">面罩灯板测试</div>
                    <div v-if="scope.row.red">红色：{{ scope.row.red }}</div>
                    <div v-if="scope.row.blue">蓝色：{{ scope.row.blue }}</div>
                    <div v-if="scope.row.infrared">红外：{{ scope.row.infrared }}</div>
                    <div v-if="scope.row.red2">红色2：{{ scope.row.red2 }}</div>
                    <div v-if="scope.row.blue2">蓝色2：{{ scope.row.blue2 }}</div>
                    <div v-if="scope.row.infrared2">红外2：{{ scope.row.infrared2 }}</div>
                  </div>

                  <!-- 面罩半成品测试 -->
                  <div class="detail-section" v-if="scope.row.udiCode">
                    <div class="section-title">面罩半成品测试</div>
                    <div v-if="scope.row.udiCode">UDI码：{{ scope.row.udiCode }}</div>
                    <div v-if="scope.row.lampBoardQrCode">灯板二维码：{{ scope.row.lampBoardQrCode }}</div>
                    <div v-if="scope.row.batteryCellCode">电芯码：{{ scope.row.batteryCellCode }}</div>
                    <div v-if="scope.row.chargingBoardPcbaCode">充电板PCBA码：{{ scope.row.chargingBoardPcbaCode }}</div>
                    <div v-if="scope.row.maskPcbaCode">面罩PCBA码：{{ scope.row.maskPcbaCode }}</div>
                    <div v-if="scope.row.controllerPcbaCode">手控器PCBA码：{{ scope.row.controllerPcbaCode }}</div>
                    <div v-if="scope.row.controllerSoftwareVersion">手控器软件版本：{{ scope.row.controllerSoftwareVersion }}
                    </div>
                    <div v-if="scope.row.maskSoftwareVersion">面罩软件版本：{{ scope.row.maskSoftwareVersion }}</div>
                    <div v-if="scope.row.controllerFactoryQrCode">手控器出厂二维码：{{ scope.row.controllerFactoryQrCode }}</div>
                    <div v-if="scope.row.faceDetectionProgramVersion">面部探测程序版本：{{ scope.row.faceDetectionProgramVersion
                      }}</div>
                    <div v-if="scope.row.circuitFaultCode">电路故障码：{{ scope.row.circuitFaultCode }}</div>

                    <!-- 光波参数 -->
                    <div class="sub-section">
                      <div class="sub-title">光波参数</div>
                      <div v-if="scope.row.redLightWavelength">红灯波长：{{ scope.row.redLightWavelength }}</div>
                      <div v-if="scope.row.blueLightWavelength">蓝灯波长：{{ scope.row.blueLightWavelength }}</div>
                      <div v-if="scope.row.infraredLightWavelength">红外灯波长：{{ scope.row.infraredLightWavelength }}</div>
                      <div v-if="scope.row.redLightCurrent">红灯电流：{{ scope.row.redLightCurrent }}</div>
                      <div v-if="scope.row.blueLightCurrent">蓝灯电流：{{ scope.row.blueLightCurrent }}</div>
                      <div v-if="scope.row.infraredLightCurrent">红外灯电流：{{ scope.row.infraredLightCurrent }}</div>
                      <div v-if="scope.row.msiLightCurrent">MSI灯电流：{{ scope.row.msiLightCurrent }}</div>
                    </div>

                    <!-- 电池参数 -->
                    <div class="sub-section">
                      <div class="sub-title">电池参数</div>
                      <div v-if="scope.row.batteryVoltage">电池电压：{{ scope.row.batteryVoltage }}</div>
                      <div v-if="scope.row.dischargeCurrent">放电电流：{{ scope.row.dischargeCurrent }}</div>
                      <div v-if="scope.row.batteryPower">电池电量：{{ scope.row.batteryPower }}</div>
                      <div v-if="scope.row.batteryCell1Voltage">电芯1电压：{{ scope.row.batteryCell1Voltage }}</div>
                      <div v-if="scope.row.batteryCell2Voltage">电芯2电压：{{ scope.row.batteryCell2Voltage }}</div>
                    </div>

                    <!-- 传感器参数 -->
                    <div class="sub-section">
                      <div class="sub-title">传感器参数</div>
                      <div v-if="scope.row.faceSensorStatus">面部传感器状态：{{ scope.row.faceSensorStatus }}</div>
                      <div v-if="scope.row.faceSensorValue">面部传感器值：{{ scope.row.faceSensorValue }}</div>
                      <div v-if="scope.row.fanCurrent">风扇电流：{{ scope.row.fanCurrent }}</div>
                    </div>
                  </div>

                  <!-- 面罩温度测试 -->
                  <div class="detail-section" v-if="scope.row.instrumentNtcDifferenceBeforeCooling">
                    <div class="section-title">面罩温度测试</div>
                    <div v-if="scope.row.instrumentNtcDifferenceBeforeCooling">制冷前NTC差值：{{
                      scope.row.instrumentNtcDifferenceBeforeCooling }}</div>
                    <div v-if="scope.row.productAndInstrumentNtc1Difference">产品NTC1和仪器NTC1差值：{{
                      scope.row.productAndInstrumentNtc1Difference }}</div>
                    <div v-if="scope.row.productAndInstrumentNtc2Difference">产品NTC2和仪器NTC2差值：{{
                      scope.row.productAndInstrumentNtc2Difference }}</div>
                    <div v-if="scope.row.coolingStatus">制冷状态：{{ scope.row.coolingStatus }}</div>
                    <div v-if="scope.row.coolingSetTemperature">制冷设置温度：{{ scope.row.coolingSetTemperature }}</div>
                  </div>

                  <!-- 耐压测试 -->
                  <div class="detail-section" v-if="scope.row.chargingTest">
                    <div class="section-title">耐压测试</div>
                    <div v-if="scope.row.chargingTest">充电测试：{{ scope.row.chargingTest }}</div>
                    <div v-if="scope.row.withstandVoltageTest">耐压测试：{{ scope.row.withstandVoltageTest }}</div>
                  </div>

                  <!-- 模板整机灯光 -->
                  <div class="detail-section" v-if="scope.row.cellCode">
                    <div class="section-title">整机灯光测试</div>
                    <div v-if="scope.row.cellCode">电芯码：{{ scope.row.cellCode }}</div>
                    <div v-if="scope.row.handheldControllerPcbaCode">手控器PCBA码：{{ scope.row.handheldControllerPcbaCode }}
                    </div>
                    <div v-if="scope.row.handheldSoftwareVersion">手控器软件版本：{{ scope.row.handheldSoftwareVersion }}</div>
                    <div v-if="scope.row.handheldFactoryQrCode">手控器出厂二维码：{{ scope.row.handheldFactoryQrCode }}</div>
                    <div v-if="scope.row.batteryCapacity">电池电量：{{ scope.row.batteryCapacity }}</div>
                    <div v-if="scope.row.cell1Voltage">电芯1电压：{{ scope.row.cell1Voltage }}</div>
                    <div v-if="scope.row.cell2Voltage">电芯2电压：{{ scope.row.cell2Voltage }}</div>
                    <div v-if="scope.row.meterChargingCurrent">仪表充电电流：{{ scope.row.meterChargingCurrent }}</div>
                  </div>

                  <!-- 电子秤重量 -->
                  <div class="detail-section" v-if="scope.row.weight">
                    <div class="section-title">电子秤重量</div>
                    <div v-if="scope.row.weight">称重重量：{{ scope.row.weight }}</div>
                  </div>

                  <!-- 遥控测试 -->
                  <div class="detail-section" v-if="scope.row.showSerialNo">
                    <div class="section-title">遥控测试</div>
                    <div v-if="scope.row.showSerialNo">显示序列号：{{ scope.row.showSerialNo }}</div>
                    <div v-if="scope.row.chkPowerOn">上电开机：{{ scope.row.chkPowerOn }}</div>
                    <div v-if="scope.row.enterDebugMode">进入调试模式：{{ scope.row.enterDebugMode }}</div>
                    <div v-if="scope.row.readAllKeyOff">按键关闭状态：{{ scope.row.readAllKeyOff }}</div>
                    <div v-if="scope.row.readK4K5">左右键状态：{{ scope.row.readK4K5 }}</div>
                    <div v-if="scope.row.readPotentiometer">编码开关：{{ scope.row.readPotentiometer }}</div>
                    <div v-if="scope.row.chkUiVersion">软件版本：{{ scope.row.chkUiVersion }}</div>
                    <div v-if="scope.row.chkUiTx">通讯口校验：{{ scope.row.chkUiTx }}</div>
                  </div>

                  <!-- 测试结果 -->
                  <div class="detail-section">
                    <div class="section-title">测试结果</div>
                    <div v-if="scope.row.passFail">测试结果：{{ scope.row.passFail }}</div>
                    <div v-if="scope.row.testTime">测试耗时：{{ scope.row.testTime }}秒</div>
                    <div v-if="scope.row.startTime">开始时间：{{ scope.row.startTime }}</div>
                  </div>
                </div>
                <div class="result-main">
                  <span :class="{
                    'success': !scope.row.error,
                    'error': scope.row.error
                  }">{{ scope.row.error ? '不合格' : '合格' }}</span>
                  <span class="time">{{ formatDate(scope.row.testTime || scope.row.createTime) }}</span>
                </div>
              </el-popover>
            </div>
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

        // 如果有工序信息,添加工序查询条件
        if (this.currentProcessStep) {
          query.processId = this.currentProcessStep._id
        }

        const res = await getData('InspectionData', {
          query,
          page: this.currentPage,
          limit: this.pageSize,
          sort: { createTime: -1 },
          populate: JSON.stringify([
            {
              path: 'processId',
              select: 'processCode processName processDesc processStage processType'
            }
          ])
        })

        this.historyData = res.data
        this.total = res.total
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
</style>