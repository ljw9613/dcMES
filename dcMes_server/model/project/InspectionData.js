const mongoose = require("mongoose");

// 检测数据 Schema
const inspectionDataSchema = new mongoose.Schema(
  {
    scanCode: {
      type: String,
      maxlength: 100,
      default: null,
      description: "扫码数据",
    },
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "machine",
      description: "设备ID",
    },
    machineIp: { type: String, default: null, description: "IP地址" },
    processId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "processStep",
      description: "工序",
    },
    createTime: { type: Date, default: Date.now, description: "创建时间" },
    updateTime: { type: Date, default: null, description: "更新时间" },
    scanCodeBindRecordId: {
      type: mongoose.Schema.ObjectId,
      ref: "ScanCodeBindRecord",
      description: "扫码数据绑定记录",
    },
    error: { type: Boolean, default: false, description: "错误标志" },
    dataUpload: { type: Boolean, description: "是否上传数据" },
    dataUploadTime: { type: Date, description: "上传数据时间" },

    // 添可设备字段
    downBound: { type: String, description: "下限" },
    upBound: { type: String, description: "上限" },
    testItemResult: { type: String, description: "结果" },
    testItemUnit: { type: String, description: "单位" },

    // 面罩检验设备通用字段
    startDate: { type: String, description: "日期" },
    workstation: { type: String, description: "工位号" },
    productModel: { type: String, description: "产品型号" },

    // 面罩灯板测试
    red: { type: String, description: "红色" },
    blue: { type: String, description: "蓝色" },
    infrared: { type: String, description: "红外" },
    red2: { type: String, description: "红色2" },
    blue2: { type: String, description: "蓝色2" },
    infrared2: { type: String, description: "红外2" },

    // 面罩半成品测试
    udiCode: { type: String, description: "UDI码" },
    lampBoardQrCode: { type: String, description: "灯板二维码" },
    batteryCellCode: { type: String, description: "电芯码" },
    chargingBoardPcbaCode: { type: String, description: "充电板PCBA码" },
    maskPcbaCode: { type: String, description: "面罩PCBA码" },
    controllerPcbaCode: { type: String, description: "手控器PCBA码" },
    controllerSoftwareVersion: { type: String, description: "手控器软件版本" },
    maskSoftwareVersion: { type: String, description: "面罩软件版本" },
    controllerFactoryQrCode: { type: String, description: "手控器出厂二维码" },
    faceDetectionProgramVersion: {
      type: String,
      description: "面部探测程序版本",
    },
    circuitFaultCode: { type: String, description: "电路故障码" },
    redLightWavelength: { type: String, description: "红灯波长" },
    blueLightWavelength: { type: String, description: "蓝灯波长" },
    infraredLightWavelength: { type: String, description: "红外灯波长" },
    redLightCurrent: { type: String, description: "红灯电流" },
    blueLightCurrent: { type: String, description: "蓝灯电流" },
    infraredLightCurrent: { type: String, description: "红外灯电流" },
    msiLightCurrent: { type: String, description: "MSI灯电流" },
    fanCurrent: { type: String, description: "风扇电流" },
    batteryVoltage: { type: String, description: "电池电压" },
    dischargeCurrent: { type: String, description: "放电电流" },
    batteryPower: { type: String, description: "电池电量" },
    faceSensorStatus: { type: String, description: "面部传感器状态" },
    faceSensorValue: { type: String, description: "面部传感器值" },
    batteryCell1Voltage: { type: String, description: "电芯1电压" },
    batteryCell2Voltage: { type: String, description: "电芯2电压" },
    productNtc1TemperatureStart: { type: String, description: "产品NTC1温度S" },
    productNtc1TemperatureEnd: { type: String, description: "产品NTC1温度E" },
    productNtc2TemperatureStart: { type: String, description: "产品NTC2温度S" },
    productNtc2TemperatureEnd: { type: String, description: "产品NTC2温度E" },
    instrumentNtc1TemperatureStart: {
      type: String,
      description: "仪表NTC1温度S",
    },
    instrumentNtc1TemperatureEnd: {
      type: String,
      description: "仪表NTC1温度E",
    },
    instrumentNtc2TemperatureStart: {
      type: String,
      description: "仪表NTC2温度S",
    },
    instrumentNtc2TemperatureEnd: {
      type: String,
      description: "仪表NTC2温度E",
    },
    productNtc1Difference: { type: String, description: "产品NTC1差值" },
    productNtc2Difference: { type: String, description: "产品NTC2差值" },
    instrumentNtc1Difference: { type: String, description: "仪表NTC1差值" },
    instrumentNtc2Difference: { type: String, description: "仪表NTC2差值" },
    productNtcDifferenceStart: { type: String, description: "产品NTC差值S" },
    productNtcDifferenceEnd: { type: String, description: "产品NTC差值E" },
    instrumentNtcDifferenceStart: { type: String, description: "仪表NTC差值S" },
    instrumentNtcDifferenceEnd: { type: String, description: "仪表NTC差值E" },
    chargingStatus: { type: String, description: "充电状态" },
    chargingVoltage: { type: String, description: "充电电压" },
    chargingCurrent: { type: String, description: "充电电流" },
    instrumentChargingCurrent: { type: String, description: "仪表充电电流" },
    chargingCurrentDifference: { type: String, description: "充电电流差值" },

    // 面罩温度测试
    instrumentNtcDifferenceBeforeCooling: {
      type: String,
      description: "仪器NTC1和NTC2的差值(制冷前)",
    },
    productAndInstrumentNtc1Difference: {
      type: String,
      description: "产品NTC1和仪器NTC1差值",
    },
    productAndInstrumentNtc2Difference: {
      type: String,
      description: "产品NTC2和仪器NTC2差值",
    },
    coolingStatus: { type: String, description: "制冷状态" },
    coolingSetTemperature: { type: String, description: "制冷设置温度" },

    // 耐压测试
    chargingTest: { type: String, description: "充电测试" },
    withstandVoltageTest: { type: String, description: "耐压测试" },

    // 模板整机灯光
    cellCode: { type: String, description: "电芯码" },
    handheldControllerPcbaCode: { type: String, description: "手控器PCBA码" },
    handheldSoftwareVersion: { type: String, description: "手控器软件版本" },
    handheldFactoryQrCode: { type: String, description: "手控器出厂二维码" },
    batteryCapacity: { type: String, description: "电池电量" },
    cell1Voltage: { type: String, description: "电芯1电压" },
    cell2Voltage: { type: String, description: "电芯2电压" },
    productNtc1TempS: { type: String, description: "产品NTC1温度S" },
    productNtc1TempE: { type: String, description: "产品NTC1温度E" },
    productNtc2TempS: { type: String, description: "产品NTC2温度S" },
    productNtc2TempE: { type: String, description: "产品NTC2温度E" },
    meterNtc1TempS: { type: String, description: "仪表NTC1温度S" },
    meterNtc1TempE: { type: String, description: "仪表NTC1温度E" },
    meterNtc2TempS: { type: String, description: "仪表NTC2温度S" },
    meterNtc2TempE: { type: String, description: "仪表NTC2温度E" },
    meterNtc1Difference: { type: String, description: "仪表NTC1差值" },
    meterNtc2Difference: { type: String, description: "仪表NTC2差值" },
    productNtcDifferenceS: { type: String, description: "产品NTC差值S" },
    productNtcDifferenceE: { type: String, description: "产品NTC差值E" },
    meterNtcDifferenceS: { type: String, description: "仪表NTC差值S" },
    meterNtcDifferenceE: { type: String, description: "仪表NTC差值E" },
    meterChargingCurrent: { type: String, description: "仪表充电电流" },

    // 电子秤重量
    weight: { type: String, description: "称重重量" },
    lineNumber: { type: String, description: "线体" },

    // 遥控
    showSerialNo: { type: String, description: "0.4 SHOW SERIALNO 显示序列号" },
    chkPowerOn: { type: String, description: "A1.0 CHK POWER ON ATE 上电开机" },
    enterDebugMode: {
      type: String,
      description: "A1.1 ENTER DEBUG MODE 进入调试模式",
    },
    showReadCellMsg: {
      type: String,
      description: "A7.7 SHOW READ CELL MSG 显示读取电池消息",
    },
    showReadMainPcbaMsg: {
      type: String,
      description: "A7.9 SHOW READ MAIN PCBA MSG 显示读取主PCBA消息",
    },
    showReadPcba2Msg: {
      type: String,
      description: "A7.11 SHOW READ PCBA2 MSG 显示读取PCBA2消息",
    },
    showReadPackMsg: {
      type: String,
      description: "A7.13 SHOW READ PACK MSG 读取 MCU 遥控器机身码",
    },
    readAllKeyOff: {
      type: String,
      description: "A1.2 READ ALL KEY OFF 读取所有按键关闭状态",
    },
    readK4K5: {
      type: String,
      description: "A1.3 READ K4 K5 读取 K4 K5 左右键状态",
    },
    readPotentiometer: {
      type: String,
      description: "A1.4 READ POTENTIOMETER 检查编码开关",
    },
    readAllKeyOff2: {
      type: String,
      description: "A1.5 READ ALL KEY OFF 读取所有按键关闭状态",
    },
    readPackVol: {
      type: String,
      description: "A1.10 READ PACK VOL 读取 PACK 总电压",
    },
    readPackCell1Vol: {
      type: String,
      description: "A1.12 READ PACK CELL1 VOL 读取 CL1 电压",
    },
    readPackCell2Vol: {
      type: String,
      description: "A1.13 READ PACK CELL2 VOL 读取 CL2 电压",
    },
    chkCellVolDiffMax: {
      type: String,
      description: "A1.14 CHK CELL VOL DIFF MAX CL1 CL2 压差校验",
    },
    readNtc: { type: String, description: "A1.15 READ NTC 读取 NTC" },
    chkUiVersion: {
      type: String,
      description: "A1.17 CHK UI VERSION 读取软件版本",
    },
    discharge1ATestPrepare: {
      type: String,
      description:
        "A3.2 DISCHARGE1A TEST PREPARE 放电准备-电子负载恒流 1A，改为 3A",
    },
    chkBatOutVol: {
      type: String,
      description: "A3.9 CHK BATOUT VOL 放电 BAT 输出电压",
    },
    chkDischargeCur: {
      type: String,
      description: "A3.10 CHK DISCHARGE CUR 负载放电和电子负载电流校验",
    },
    readDischargeCur: {
      type: String,
      description: "A3.11 READ DISCHARGE CUR 读取放电电流",
    },
    readDischargeSta: {
      type: String,
      description: "A3.11B READ DISCHARGE STA 读取放电状态",
    },
    dischargeOcpTestPrepare: {
      type: String,
      description: "A3.12 DISCHARGE OCP TEST PREPARE 过流检查",
    },
    readDischargeCur2: {
      type: String,
      description: "A3.13 READ DISCHARGE CUR 读取放电电流",
    },
    readDischargeSta2: {
      type: String,
      description: "A3.13B READ DISCHARGE STA 读取放电结束",
    },
    dischargeTestEnd: {
      type: String,
      description: "A3.17 DISCHARGE TEST END 放电测试结束",
    },
    chkUiTx: { type: String, description: "A3.22A CHK UI TX 遥控器通讯口校验" },
    chargeTestPrepare: {
      type: String,
      description: "A6.01 CHARGE TEST PREPARE 2A 适配器充电准备",
    },
    readChargerVolt: {
      type: String,
      description: "A6.03 READ CHARGER VOLT 读取充电器电压",
    },
    readChargeCur: {
      type: String,
      description: "A6.04 READ CHARGE CUR 读取充电电流",
    },
    ateChangeCur: {
      type: String,
      description: "A6.05 ATECHARGE CUR 自检 ATE 充电电流",
    },
    chkStillChargeCur: {
      type: String,
      description: "A6.06 CHK STILL CHARGE CUR 充电保持电流",
    },
    chargeTestEnd: {
      type: String,
      description: "A6.07 CHARGE TEST END 充电结束",
    },
    readSoc: { type: String, description: "A7.14 READ SOC 读取 SOC" },
    packOff: { type: String, description: "A8.0 PACK OFF 遥控器关机" },
    allTestEnd: { type: String, description: "A9.0 ALL TEST END 所有测试结束" },
    passFail: { type: String, description: "PASS/Fail 测试结果" },
    testTime: { type: String, description: "测试耗时（秒）" },
    startTime: { type: String, description: "测试起始时间" },

    // 添可检验设备
    testDate: { type: String, description: "日期" },
    positiveNegativeResult: { type: String, description: "正反结果" },
    revolutionSpeedTestValue: { type: String, description: "转速测试值" },
    vacuumTestValue: { type: String, description: "真空测试值" },

    // 添可跑机
    setBauds: { type: String, description: "SetBauds" },
    robotToPhotoPoint: { type: String, description: "机器人到拍照点" },
    pressCylinder: { type: String, description: "压紧气缸" },
    fakePackageCylinder: { type: String, description: "假包气缸" },
    communicationBoardPowered: { type: String, description: "通讯板通电" },
    testMode: { type: String, description: "测试模式" },
    readMainboardVersion: { type: String, description: "读主板版本号" },
    waitForRobotInPlace: { type: String, description: "等待机器人到位" },
    screenAllRed: { type: String, description: "屏幕全红" },
    allRedCheck: { type: String, description: "全红检测" },
    screenAllBlue: { type: String, description: "屏幕全蓝" },
    allBlueCheck: { type: String, description: "全蓝检测" },
    buttonSilkscreenCheck: { type: String, description: "按键丝印检测" },
    powerButtonRelease: { type: String, description: "开机按钮松开" },
    gearSwitchButtonRelease: { type: String, description: "档位切换按钮松开" },
    dustEmissionIntensity: { type: String, description: "灰尘发射强度" },
    dustReceptionIntensity: { type: String, description: "灰尘接收强度" },
    robotToGearPoint: { type: String, description: "机器人到档位点" },
    dustCylinderOut: { type: String, description: "灰尘气缸出" },
    dustCylinderBack: { type: String, description: "灰尘气缸回" },
    dustCylinderOut2: { type: String, description: "灰尘气缸出" },
    dustCount: { type: String, description: "灰尘个数" },
    waitForRobotInPlace2: { type: String, description: "等待机器人到位" },
    gearSwitchCylinderOut: { type: String, description: "档位切换气缸出" },
    dustReceptionIntensity2: { type: String, description: "灰尘接收强度" },
    dustCylinderBack2: { type: String, description: "灰尘气缸回" },
    gearSwitchButtonPress: { type: String, description: "档位切换按钮按下" },
    gearSwitchCylinderBack: { type: String, description: "档位切换气缸回" },
    robotToStandbyPoint: { type: String, description: "机器人到待机点" },
    clearLogs: { type: String, description: "清除日志" },
    snWrite: { type: String, description: "SN写入" },
    snRead: { type: String, description: "SN读取" },
    normalMode: { type: String, description: "正常模式" },
    communicationBoardPowerOff: { type: String, description: "通讯板断电" },
    resetCylinder: { type: String, description: "复位气缸" },

    // plc数据
    pcScan: { type: String, description: "扫码" },
    scanReceiveToPc: { type: String, description: "扫码接收至PC" },
    floorBrushDirectionResult: { type: String, description: "地刷方向结果" },
    floorBrushVacuumLowValue: { type: String, description: "地刷吸尘低值" },
    floorBrushVacuumHighValue: { type: String, description: "地刷吸尘高值" },
    floorBrushVacuumMediumValue: { type: String, description: "地刷吸尘中值" },
    currentLowValue: { type: String, description: "当前低值" },
    currentHighValue: { type: String, description: "当前高值" },
    currentMediumValue: { type: String, description: "当前中值" },
    testCompleteToPcComplete1EmergencyStop2DevicePopupNoUpload3PcReadTo0: {
      type: String,
      description: "测试完成至PC，1紧急停止2设备弹出未上传3 PC读至0",
    },
    floorBrushVacuumLowValueUpperLimit: {
      type: String,
      description: "地刷吸尘低值上限",
    },
    floorBrushVacuumLowValueLowerLimit: {
      type: String,
      description: "地刷吸尘低值下限",
    },
    floorBrushVacuumHighValueUpperLimit: {
      type: String,
      description: "地刷吸尘高值上限",
    },
    floorBrushVacuumHighValueLowerLimit: {
      type: String,
      description: "地刷吸尘高值下限",
    },
    floorBrushVacuumMediumValueUpperLimit: {
      type: String,
      description: "地刷吸尘中值上限",
    },
    floorBrushVacuumMediumValueLowerLimit: {
      type: String,
      description: "地刷吸尘中值下限",
    },
    currentLowValueUpperLimit: { type: String, description: "当前低值上限" },
    currentLowValueLowerLimit: { type: String, description: "当前低值下限" },
    currentHighValueUpperLimit: { type: String, description: "当前高值上限" },
    currentHighValueLowerLimit: { type: String, description: "当前高值下限" },
    currentMediumValueUpperLimit: { type: String, description: "当前中值上限" },
    currentMediumValueLowerLimit: { type: String, description: "当前中值下限" },
    floorBrushVacuumLowTestUse1NotUse0Use: {
      type: String,
      description: "地刷吸尘低测试使用1不使用0",
    },
    floorBrushVacuumHighTestUse1NotUse0Use: {
      type: String,
      description: "地刷吸尘高测试使用1不使用0",
    },
    floorBrushVacuumMediumTestUse1NotUse0Use: {
      type: String,
      description: "地刷吸尘中测试使用1不使用0",
    },
    currentLowTestUse1NotUse0Use: {
      type: String,
      description: "当前低测试使用1不使用0",
    },
    currentHighTestUse1NotUse0Use: {
      type: String,
      description: "当前高测试使用1不使用0",
    },
    currentMediumTestUse1NotUse0Use: {
      type: String,
      description: "当前中测试使用1不使用0",
    },
    floorBrushDirectionUse1NotUse0Use: {
      type: String,
      description: "地刷方向使用1不使用0",
    },

    scanReceive1ToPc: { type: String, description: "扫码接收至PC" },
    chargingLightStartStatusResult1Ok2Ng: {
      type: String,
      description: "充电灯启动状态结果1合格2不合格",
    },
    screenRunningStatusResult1Ok2Ng: {
      type: String,
      description: "屏幕运行状态结果1合格2不合格",
    },
    rotationDirectionResult1Ok2Ng: {
      type: String,
      description: "旋转方向结果1合格2不合格",
    },
    rotationSpeedRpmIntegerPart: {
      type: String,
      description: "旋转速度RPM整数部分",
    },
    stallResult1Ok2Ng: { type: String, description: "卡住结果1合格2不合格" },
    chargingLightChargingStatusResult1Ok2Ng: {
      type: String,
      description: "充电灯充电状态结果1合格2不合格",
    },
    currentValueAInteger: { type: String, description: "电流值A整数" },
    voltageValueVInteger: { type: String, description: "电压值V整数" },
    batteryPackVoltageDifferenceVInteger: {
      type: String,
      description: "电池包电压差V整数",
    },
    currentUpperLimitInteger: { type: String, description: "电流上限整数" },
    currentLowerLimitInteger: { type: String, description: "电流下限整数" },
    voltageUpperLimitInteger: { type: String, description: "电压上限整数" },
    voltageLowerLimitInteger: { type: String, description: "电压下限整数" },
    rotationSpeedUpperLimitInteger: {
      type: String,
      description: "旋转速度上限整数",
    },
    rotationSpeedLowerLimitInteger: {
      type: String,
      description: "旋转速度下限整数",
    },
    batteryPackVoltageDifferenceUpperLimitInteger: {
      type: String,
      description: "电池包电压差上限整数",
    },
    batteryPackVoltageDifferenceLowerLimitInteger: {
      type: String,
      description: "电池包电压差下限整数",
    },
    rotationSpeedTestUse1NotUse0Use: {
      type: String,
      description: "旋转速度测试使用1不使用0",
    },
    chargingLightStartStatus1NotUse0Use: {
      type: String,
      description: "充电灯启动状态1不使用0",
    },
    screenRunningLight1NotUse0Use: {
      type: String,
      description: "屏幕运行灯1不使用0",
    },
    stallResult1NotUse0Use: { type: String, description: "卡住结果1不使用0" },
    chargingLight1NotUse0Use: { type: String, description: "充电灯1不使用0" },
    rotationDirectionResultDirection1NotUse0Use: {
      type: String,
      description: "旋转方向结果方向1不使用0",
    },
    chargingCurrentResult1NotUse0Use: {
      type: String,
      description: "充电电流结果1不使用0",
    },
    voltage1NotUse0Use: { type: String, description: "电压1不使用0" },
    batteryPackVoltageDifference1NotUse0Use: {
      type: String,
      description: "电池包电压差1不使用0",
    },
    stall1NotUse0Use: { type: String, description: "卡住1不使用0" },
    // 遥控器2
    按钮开机: { type: String },
    "SN比对 系统录入": { type: String },
    "通讯barcode比对 CellSerialization[String] = **********************************":
      { type: String },
    "通讯barcode比对 UIPCBACode[String] = **********************************": {
      type: String,
    },
    "通讯barcode比对 ChargePCBACode[String] = **********************************":
      { type: String },
    DebugMode: { type: String },
    "开路电压(OCV) 7V ~ 7·4V": { type: String },
    "开路电压(OCV) 电压信号": { type: String },
    "开路电压(OCV) 通讯电压误差±200mV": { type: String },
    "开路电压(OCV) 电芯电压": { type: String },
    "开路电压(OCV) 电芯压差": { type: String },
    "UI Version SoftwareVersion[String] = ****FW300*******WILLOW-2S1P": {
      type: String,
    },
    "Cell&NTC NTCVoltage[mV,U2] ∈ 800mV ~ 3130mV": { type: String },
    "Cell&NTC VCell-1[mV,U2] ∈ 3500mV ~ 3700mV": { type: String },
    "Cell&NTC VCell-2[mV,U2] ∈ 3500mV ~ 3700mV": { type: String },
    "Cell&NTC Voltage[mV,U2] ∈ 7000mV ~ 7400mV": { type: String },
    "放电测试(Discharge)1A X1,P4, Discharge/1A": { type: String },
    "放电测试(Discharge)1A 电流 0·8A ~ 1·2A": { type: String },
    "放电测试(Discharge)1A 电流信号": { type: String },
    "放电测试(Discharge)1A 通讯电流误差±190mA": { type: String },
    "过流保护(OCP)8A 单点过流P4, Discharge/8A": { type: String },
    "过流保护(OCP)8A 保护规格 0·5mS ~ 500mS": { type: String },
    "测量电压(V) X1,0V ~ 0·5V": { type: String },
    "通讯电流 DischargingCurrent[mA,U2] ∈ 0mA ~ 300mA": { type: String },
    "请先开机,按住K4K5后按下按钮": { type: String },
    "通讯K4K5 K4[U2] = 1": { type: String },
    "通讯K4K5 K5[U2] = 1": { type: String },
    "延时(Delay) 等待1500mS": { type: String },
    旋钮顺时针逆时针并按下按钮: { type: String },
    "旋钮判断 ClockwiseCount[U2] > 0": { type: String },
    "旋钮判断 CounterclockwiseCount[U2] > 0": { type: String },
    电源输出: { type: String },
    "延时(Delay) 等待6000mS": { type: String },
    "充电通讯电流电压 ChargerCurrent[mA,U2] ∈ 730mA ~ 950mA": { type: String },
    "充电通讯电流电压 ChargerVoltage[mV,U2] ∈ 4500mV ~ 5700mV": {
      type: String,
    },
    "SOC SOC[%,U2] ∈ 35% ~ 43%": { type: String },
    "交流内阻(ACIR) 40mΩ ~ 600mΩ": { type: String },
    电源关闭: { type: String },
    "延时(Delay) 等待2000mS": { type: String },
    "充电测试自检电流 X1,P1, Charge/5·7V/2A": { type: String },
    "充电测试自检电流 电流 1·4A ~ 1·9A": { type: String },
    闭关DebugMode: { type: String },
  },
  {
    timestamps: { createdAt: "createTime", updatedAt: "updateTime" },
    collection: "inspection_data",
  }
);

// 添加索引
inspectionDataSchema.index({ scanCode: 1 });
inspectionDataSchema.index({ machineId: 1 });
inspectionDataSchema.index({ createTime: -1 });
inspectionDataSchema.index({ processId: 1 });

module.exports = mongoose.model("InspectionData", inspectionDataSchema);
