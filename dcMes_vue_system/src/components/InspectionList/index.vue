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

      <el-table-column label="检测项目" prop="inspectionItem">
        <template slot-scope="scope">
          <div class="inspection-details">
            <div>{{ scope.row.inspectionItem }}</div>

          </div>
        </template>
      </el-table-column>
      <el-table-column label="检测结果" width="300">
        <template slot-scope="scope">
          <div v-for="(result, index) in scope.row.inspectionResults" :key="index" class="inspection-result">
            <div class="process-info" v-if="result.processStep">
              <span>{{ result.processStep.processName }}</span>
              <span>({{ result.processStep.processStage }})</span>
            </div>
            <div class="result-info">
              <el-popover v-if="result.testDetails" placement="right" width="500" trigger="hover">
                <div class="test-details">
                  <!-- 通用信息 -->
                  <div class="detail-section">
                    <div class="section-title">基础信息</div>
                    <div v-if="result.testDetails.startDate">日期：{{ result.testDetails.startDate }}</div>
                    <div v-if="result.testDetails.workstation">工位号：{{ result.testDetails.workstation }}</div>
                    <div v-if="result.testDetails.productModel">产品型号：{{ result.testDetails.productModel }}</div>
                  </div>

                  <!-- 面罩灯板测试 -->
                  <div class="detail-section" v-if="hasLampBoardTestData">
                    <div class="section-title">面罩灯板测试</div>
                    <div v-if="result.testDetails.red">红色：{{ result.testDetails.red }}</div>
                    <div v-if="result.testDetails.blue">蓝色：{{ result.testDetails.blue }}</div>
                    <div v-if="result.testDetails.infrared">红外：{{ result.testDetails.infrared }}</div>
                    <div v-if="result.testDetails.red2">红色2：{{ result.testDetails.red2 }}</div>
                    <div v-if="result.testDetails.blue2">蓝色2：{{ result.testDetails.blue2 }}</div>
                    <div v-if="result.testDetails.infrared2">红外2：{{ result.testDetails.infrared2 }}</div>
                  </div>

                  <!-- 面罩半成品测试 -->
                  <div class="detail-section" v-if="hasSemiFinishedTestData">
                    <div class="section-title">面罩半成品测试</div>
                    <div v-if="result.testDetails.udiCode">UDI码：{{ result.testDetails.udiCode }}</div>
                    <div v-if="result.testDetails.lampBoardQrCode">灯板二维码：{{ result.testDetails.lampBoardQrCode }}</div>
                    <div v-if="result.testDetails.batteryCellCode">电芯码：{{ result.testDetails.batteryCellCode }}</div>
                    <div v-if="result.testDetails.chargingBoardPcbaCode">充电板PCBA码：{{
                      result.testDetails.chargingBoardPcbaCode }}</div>
                    <div v-if="result.testDetails.maskPcbaCode">面罩PCBA码：{{ result.testDetails.maskPcbaCode }}</div>
                    <div v-if="result.testDetails.controllerPcbaCode">手控器PCBA码：{{ result.testDetails.controllerPcbaCode
                      }}</div>
                    <div v-if="result.testDetails.controllerSoftwareVersion">手控器软件版本：{{
                      result.testDetails.controllerSoftwareVersion }}</div>
                    <div v-if="result.testDetails.maskSoftwareVersion">面罩软件版本：{{ result.testDetails.maskSoftwareVersion
                      }}</div>
                    <div v-if="result.testDetails.controllerFactoryQrCode">手控器出厂二维码：{{
                      result.testDetails.controllerFactoryQrCode }}</div>
                    <div v-if="result.testDetails.faceDetectionProgramVersion">面部探测程序版本：{{
                      result.testDetails.faceDetectionProgramVersion }}</div>
                    <div v-if="result.testDetails.circuitFaultCode">电路故障码：{{ result.testDetails.circuitFaultCode }}
                    </div>

                    <!-- 光波参数 -->
                    <div class="sub-section">
                      <div class="sub-title">光波参数</div>
                      <div v-if="result.testDetails.redLightWavelength">红灯波长：{{ result.testDetails.redLightWavelength }}
                      </div>
                      <div v-if="result.testDetails.blueLightWavelength">蓝灯波长：{{ result.testDetails.blueLightWavelength
                        }}</div>
                      <div v-if="result.testDetails.infraredLightWavelength">红外灯波长：{{
                        result.testDetails.infraredLightWavelength }}</div>
                      <div v-if="result.testDetails.redLightCurrent">红灯电流：{{ result.testDetails.redLightCurrent }}</div>
                      <div v-if="result.testDetails.blueLightCurrent">蓝灯电流：{{ result.testDetails.blueLightCurrent }}
                      </div>
                      <div v-if="result.testDetails.infraredLightCurrent">红外灯电流：{{
                        result.testDetails.infraredLightCurrent }}</div>
                      <div v-if="result.testDetails.msiLightCurrent">MSI灯电流：{{ result.testDetails.msiLightCurrent }}
                      </div>
                    </div>

                    <!-- 电池参数 -->
                    <div class="sub-section">
                      <div class="sub-title">电池参数</div>
                      <div v-if="result.testDetails.batteryVoltage">电池电压：{{ result.testDetails.batteryVoltage }}</div>
                      <div v-if="result.testDetails.dischargeCurrent">放电电流：{{ result.testDetails.dischargeCurrent }}
                      </div>
                      <div v-if="result.testDetails.batteryPower">电池电量：{{ result.testDetails.batteryPower }}</div>
                      <div v-if="result.testDetails.batteryCell1Voltage">电芯1电压：{{ result.testDetails.batteryCell1Voltage
                        }}</div>
                      <div v-if="result.testDetails.batteryCell2Voltage">电芯2电压：{{ result.testDetails.batteryCell2Voltage
                        }}</div>
                    </div>

                    <!-- 传感器参数 -->
                    <div class="sub-section">
                      <div class="sub-title">传感器参数</div>
                      <div v-if="result.testDetails.faceSensorStatus">面部传感器状态：{{ result.testDetails.faceSensorStatus }}
                      </div>
                      <div v-if="result.testDetails.faceSensorValue">面部传感器值：{{ result.testDetails.faceSensorValue }}
                      </div>
                      <div v-if="result.testDetails.fanCurrent">风扇电流：{{ result.testDetails.fanCurrent }}</div>
                    </div>
                  </div>

                  <!-- 面罩温度测试 -->
                  <div class="detail-section" v-if="hasTemperatureTestData">
                    <div class="section-title">面罩温度测试</div>
                    <div v-if="result.testDetails.instrumentNtcDifferenceBeforeCooling">制冷前NTC差值：{{
                      result.testDetails.instrumentNtcDifferenceBeforeCooling }}</div>
                    <div v-if="result.testDetails.productAndInstrumentNtc1Difference">产品NTC1和仪器NTC1差值：{{
                      result.testDetails.productAndInstrumentNtc1Difference }}</div>
                    <div v-if="result.testDetails.productAndInstrumentNtc2Difference">产品NTC2和仪器NTC2差值：{{
                      result.testDetails.productAndInstrumentNtc2Difference }}</div>
                    <div v-if="result.testDetails.coolingStatus">制冷状态：{{ result.testDetails.coolingStatus }}</div>
                    <div v-if="result.testDetails.coolingSetTemperature">制冷设置温度：{{
                      result.testDetails.coolingSetTemperature }}</div>
                  </div>

                  <!-- 耐压测试 -->
                  <div class="detail-section" v-if="hasVoltageWithstandTestData">
                    <div class="section-title">耐压测试</div>
                    <div v-if="result.testDetails.chargingTest">充电测试：{{ result.testDetails.chargingTest }}</div>
                    <div v-if="result.testDetails.withstandVoltageTest">耐压测试：{{ result.testDetails.withstandVoltageTest
                      }}</div>
                  </div>

                  <!-- 模板整机灯光 -->
                  <div class="detail-section" v-if="hasFullMachineTestData">
                    <div class="section-title">整机灯光测试</div>
                    <div v-if="result.testDetails.cellCode">电芯码：{{ result.testDetails.cellCode }}</div>
                    <div v-if="result.testDetails.handheldControllerPcbaCode">手控器PCBA码：{{
                      result.testDetails.handheldControllerPcbaCode }}</div>
                    <div v-if="result.testDetails.handheldSoftwareVersion">手控器软件版本：{{
                      result.testDetails.handheldSoftwareVersion }}</div>
                    <div v-if="result.testDetails.handheldFactoryQrCode">手控器出厂二维码：{{
                      result.testDetails.handheldFactoryQrCode }}</div>
                    <div v-if="result.testDetails.batteryCapacity">电池电量：{{ result.testDetails.batteryCapacity }}</div>
                    <div v-if="result.testDetails.cell1Voltage">电芯1电压：{{ result.testDetails.cell1Voltage }}</div>
                    <div v-if="result.testDetails.cell2Voltage">电芯2电压：{{ result.testDetails.cell2Voltage }}</div>
                    <div v-if="result.testDetails.meterChargingCurrent">仪表充电电流：{{
                      result.testDetails.meterChargingCurrent }}</div>
                  </div>

                  <!-- 电子秤重量 -->
                  <div class="detail-section" v-if="hasWeightData">
                    <div class="section-title">电子秤重量</div>
                    <div v-if="result.testDetails.weight">称重重量：{{ result.testDetails.weight }}</div>
                  </div>

                  <!-- 遥控测试 -->
                  <div class="detail-section" v-if="hasRemoteControlTestData">
                    <div class="section-title">遥控测试</div>
                    <div v-if="result.testDetails.showSerialNo">显示序列号：{{ result.testDetails.showSerialNo }}</div>
                    <div v-if="result.testDetails.chkPowerOn">上电开机：{{ result.testDetails.chkPowerOn }}</div>
                    <div v-if="result.testDetails.enterDebugMode">进入调试模式：{{ result.testDetails.enterDebugMode }}</div>
                    <div v-if="result.testDetails.readAllKeyOff">按键关闭状态：{{ result.testDetails.readAllKeyOff }}</div>
                    <div v-if="result.testDetails.readK4K5">左右键状态：{{ result.testDetails.readK4K5 }}</div>
                    <div v-if="result.testDetails.readPotentiometer">编码开关：{{ result.testDetails.readPotentiometer }}
                    </div>
                    <div v-if="result.testDetails.chkUiVersion">软件版本：{{ result.testDetails.chkUiVersion }}</div>
                    <div v-if="result.testDetails.chkUiTx">通讯口校验：{{ result.testDetails.chkUiTx }}</div>
                  </div>

                  <!-- 测试结果 -->
                  <div class="detail-section">
                    <div class="section-title">测试结果</div>
                    <div v-if="result.testDetails.passFail">测试结果：{{ result.testDetails.passFail }}</div>
                    <div v-if="result.testDetails.testTime">测试耗时：{{ result.testDetails.testTime }}秒</div>
                    <div v-if="result.testDetails.startTime">开始时间：{{ result.testDetails.startTime }}</div>
                  </div>
                </div>
                <div class="result-main">
                  <span :class="{
                    'success': result.result === '合格',
                    'error': result.result === '不合格'
                  }">{{ result.result }}</span>
                  <span class="time">{{ formatDate(result.testTime) }}</span>
                </div>
              </el-popover>

              <el-button type="text" size="mini"
                @click="showHistory(scope.row.barcode, result.processId)">历史记录</el-button>
            </div>
          </div>
        </template>
      </el-table-column>
      <!-- <el-table-column label="检测时间" prop="inspectionTime">
        <template slot-scope="scope">
          {{ formatDate(scope.row.inspectionTime) }}
        </template>
      </el-table-column>
      <el-table-column label="检测人员" prop="inspector"></el-table-column> -->
      <el-table-column label="操作" width="120">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="showHistory(scope.row.barcode)">历史记录</el-button>
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
            testDetails: null
          }

          let inspectionList = dataForm.barcode ? [mainMaterial] : []
          const processNodes = dataForm.processNodes || []

          // 获取所有有效条码
          const allBarcodes = [dataForm.barcode, ...processNodes.map(item => item.barcode)]
            .filter(barcode => barcode && barcode.trim())

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

          // 重新组织检测数据,按条码分组
          const inspectionDataMap = res.data.reduce((acc, curr) => {
            if (!acc[curr.scanCode]) {
              acc[curr.scanCode] = [];
            }
            acc[curr.scanCode].push(curr);
            return acc;
          }, {});

          // 处理展示数据
          this.displayData = [];

          // 处理主物料数据
          if (dataForm.barcode) {
            const mainData = inspectionDataMap[dataForm.barcode] || [];
            this.displayData.push({
              ...mainMaterial,
              inspectionResults: mainData.map(data => this.formatInspectionData(data))
            });
          }

          // 处理工序节点数据
          processNodes.forEach(node => {
            if (node.barcode && node.barcode.trim()) {
              const nodeData = inspectionDataMap[node.barcode] || [];
              this.displayData.push({
                ...node,
                inspectionResults: nodeData.map(data => this.formatInspectionData(data))
              });
            }
          });

          console.log(this.displayData)
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

    formatInspectionData(data) {
      return {
        processStep: data.processId ? {
          processCode: data.processId.processCode,
          processName: data.processId.processName,
          processDesc: data.processId.processDesc,
          processStage: data.processId.processStage,
          processType: data.processId.processType
        } : null,
        result: data.error ? '不合格' : '合格',
        testTime: data.testTime || data.createTime,
        inspector: data.inspector,
        testDetails: {
          ...data
        }
      };
    }
  },
  computed: {
    // 判断各个模块是否有数据需要显示
    hasLampBoardTestData() {
      const { testDetails } = this.result;
      return testDetails.red || testDetails.blue || testDetails.infrared ||
        testDetails.red2 || testDetails.blue2 || testDetails.infrared2;
    },
    hasSemiFinishedTestData() {
      const { testDetails } = this.result;
      return testDetails.udiCode || testDetails.lampBoardQrCode || testDetails.batteryCellCode;
    },
    hasTemperatureTestData() {
      const { testDetails } = this.result;
      return testDetails.instrumentNtcDifferenceBeforeCooling || testDetails.coolingStatus;
    },
    hasVoltageWithstandTestData() {
      const { testDetails } = this.result;
      return testDetails.chargingTest || testDetails.withstandVoltageTest;
    },
    hasFullMachineTestData() {
      const { testDetails } = this.result;
      return testDetails.cellCode || testDetails.handheldControllerPcbaCode;
    },
    hasWeightData() {
      return this.result.testDetails.weight;
    },
    hasRemoteControlTestData() {
      const { testDetails } = this.result;
      return testDetails.showSerialNo || testDetails.chkPowerOn || testDetails.enterDebugMode;
    }
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