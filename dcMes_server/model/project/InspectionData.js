const mongoose = require("mongoose");

// 检测数据 Schema
const inspectionDataSchema = new mongoose.Schema(
  {
    scanCode: {type: String, maxlength: 100, default: null, description: '扫码数据'},
    machineId: {type:  mongoose.Schema.Types.ObjectId, ref: 'machine', default: null, description: '设备ID'},
    machineIp: {type: String, default: null, description: 'IP地址'},
    processId: {type: mongoose.Schema.Types.ObjectId, ref: 'processStep', description: '工序'},
    createTime: {type: Date, default: Date.now, description: '创建时间'},
    updateTime: {type: Date, default: null, description: '更新时间'},
    scanCodeBindRecordId: {
        type: mongoose.Schema.ObjectId,
        ref: "ScanCodeBindRecord",
        description: '扫码数据绑定记录'
    },
    error: {type: Boolean, default: false, description: '错误标志'},

    // 面罩检验设备通用字段
    startDate: {type: String, description: '日期'},
    workstation: {type: String, description: '工位号'},
    productModel: {type: String, description: '产品型号'},

    // 面罩灯板测试
    red: {type: String, description: '红色'},
    blue: {type: String, description: '蓝色'},
    infrared: {type: String, description: '红外'},
    red2: {type: String, description: '红色2'},
    blue2: {type: String, description: '蓝色2'},
    infrared2: {type: String, description: '红外2'},

    // 面罩半成品测试
    udiCode: {type: String, description: 'UDI码'},
    lampBoardQrCode: {type: String, description: '灯板二维码'},
    batteryCellCode: {type: String, description: '电芯码'},
    chargingBoardPcbaCode: {type: String, description: '充电板PCBA码'},
    maskPcbaCode: {type: String, description: '面罩PCBA码'},
    controllerPcbaCode: {type: String, description: '手控器PCBA码'},
    controllerSoftwareVersion: {type: String, description: '手控器软件版本'},
    maskSoftwareVersion: {type: String, description: '面罩软件版本'},
    controllerFactoryQrCode: {type: String, description: '手控器出厂二维码'},
    faceDetectionProgramVersion: {type: String, description: '面部探测程序版本'},
    circuitFaultCode: {type: String, description: '电路故障码'},
    redLightWavelength: {type: String, description: '红灯波长'},
    blueLightWavelength: {type: String, description: '蓝灯波长'},
    infraredLightWavelength: {type: String, description: '红外灯波长'},
    redLightCurrent: {type: String, description: '红灯电流'},
    blueLightCurrent: {type: String, description: '蓝灯电流'},
    infraredLightCurrent: {type: String, description: '红外灯电流'},
    msiLightCurrent: {type: String, description: 'MSI灯电流'},
    fanCurrent: {type: String, description: '风扇电流'},
    batteryVoltage: {type: String, description: '电池电压'},
    dischargeCurrent: {type: String, description: '放电电流'},
    batteryPower: {type: String, description: '电池电量'},
    faceSensorStatus: {type: String, description: '面部传感器状态'},
    faceSensorValue: {type: String, description: '面部传感器值'},
    batteryCell1Voltage: {type: String, description: '电芯1电压'},
    batteryCell2Voltage: {type: String, description: '电芯2电压'},
    productNtc1TemperatureStart: {type: String, description: '产品NTC1温度S'},
    productNtc1TemperatureEnd: {type: String, description: '产品NTC1温度E'},
    productNtc2TemperatureStart: {type: String, description: '产品NTC2温度S'},
    productNtc2TemperatureEnd: {type: String, description: '产品NTC2温度E'},
    instrumentNtc1TemperatureStart: {type: String, description: '仪表NTC1温度S'},
    instrumentNtc1TemperatureEnd: {type: String, description: '仪表NTC1温度E'},
    instrumentNtc2TemperatureStart: {type: String, description: '仪表NTC2温度S'},
    instrumentNtc2TemperatureEnd: {type: String, description: '仪表NTC2温度E'},
    productNtc1Difference: {type: String, description: '产品NTC1差值'},
    productNtc2Difference: {type: String, description: '产品NTC2差值'},
    instrumentNtc1Difference: {type: String, description: '仪表NTC1差值'},
    instrumentNtc2Difference: {type: String, description: '仪表NTC2差值'},
    productNtcDifferenceStart: {type: String, description: '产品NTC差值S'},
    productNtcDifferenceEnd: {type: String, description: '产品NTC差值E'},
    instrumentNtcDifferenceStart: {type: String, description: '仪表NTC差值S'},
    instrumentNtcDifferenceEnd: {type: String, description: '仪表NTC差值E'},
    chargingStatus: {type: String, description: '充电状态'},
    chargingVoltage: {type: String, description: '充电电压'},
    chargingCurrent: {type: String, description: '充电电流'},
    instrumentChargingCurrent: {type: String, description: '仪表充电电流'},
    chargingCurrentDifference: {type: String, description: '充电电流差值'},

    // 面罩温度测试
    instrumentNtcDifferenceBeforeCooling: {type: String, description: '仪器NTC1和NTC2的差值(制冷前)'},
    productAndInstrumentNtc1Difference: {type: String, description: '产品NTC1和仪器NTC1差值'},
    productAndInstrumentNtc2Difference: {type: String, description: '产品NTC2和仪器NTC2差值'},
    coolingStatus: {type: String, description: '制冷状态'},
    coolingSetTemperature: {type: String, description: '制冷设置温度'},

    // 耐压测试
    chargingTest: {type: String, description: '充电测试'},
    withstandVoltageTest: {type: String, description: '耐压测试'},

    // 模板整机灯光
    cellCode: {type: String, description: '电芯码'},
    handheldControllerPcbaCode: {type: String, description: '手控器PCBA码'},
    handheldSoftwareVersion: {type: String, description: '手控器软件版本'},
    handheldFactoryQrCode: {type: String, description: '手控器出厂二维码'},
    batteryCapacity: {type: String, description: '电池电量'},
    cell1Voltage: {type: String, description: '电芯1电压'},
    cell2Voltage: {type: String, description: '电芯2电压'},
    productNtc1TempS: {type: String, description: '产品NTC1温度S'},
    productNtc1TempE: {type: String, description: '产品NTC1温度E'},
    productNtc2TempS: {type: String, description: '产品NTC2温度S'},
    productNtc2TempE: {type: String, description: '产品NTC2温度E'},
    meterNtc1TempS: {type: String, description: '仪表NTC1温度S'},
    meterNtc1TempE: {type: String, description: '仪表NTC1温度E'},
    meterNtc2TempS: {type: String, description: '仪表NTC2温度S'},
    meterNtc2TempE: {type: String, description: '仪表NTC2温度E'},
    meterNtc1Difference: {type: String, description: '仪表NTC1差值'},
    meterNtc2Difference: {type: String, description: '仪表NTC2差值'},
    productNtcDifferenceS: {type: String, description: '产品NTC差值S'},
    productNtcDifferenceE: {type: String, description: '产品NTC差值E'},
    meterNtcDifferenceS: {type: String, description: '仪表NTC差值S'},
    meterNtcDifferenceE: {type: String, description: '仪表NTC差值E'},
    meterChargingCurrent: {type: String, description: '仪表充电电流'},

    // 电子秤重量
    weight: {type: String, description: '称重重量'},
    lineNumber:{type:String, description:'线体号'},

    // 遥控
    showSerialNo: {type: String, description: '0.4 SHOW SERIALNO 显示序列号'},
    chkPowerOn: {type: String, description: 'A1.0 CHK POWER ON ATE 上电开机'},
    enterDebugMode: {type: String, description: 'A1.1 ENTER DEBUG MODE 进入调试模式'},
    showReadCellMsg: {type: String, description: 'A7.7 SHOW READ CELL MSG 显示读取电池消息'},
    showReadMainPcbaMsg: {type: String, description: 'A7.9 SHOW READ MAIN PCBA MSG 显示读取主PCBA消息'},
    showReadPcba2Msg: {type: String, description: 'A7.11 SHOW READ PCBA2 MSG 显示读取PCBA2消息'},
    showReadPackMsg: {type: String, description: 'A7.13 SHOW READ PACK MSG 读取 MCU 遥控器机身码'},
    readAllKeyOff: {type: String, description: 'A1.2 READ ALL KEY OFF 读取所有按键关闭状态'},
    readK4K5: {type: String, description: 'A1.3 READ K4 K5 读取 K4 K5 左右键状态'},
    readPotentiometer: {type: String, description: 'A1.4 READ POTENTIOMETER 检查编码开关'},
    readAllKeyOff2: {type: String, description: 'A1.5 READ ALL KEY OFF 读取所有按键关闭状态'},
    readPackVol: {type: String, description: 'A1.10 READ PACK VOL 读取 PACK 总电压'},
    readPackCell1Vol: {type: String, description: 'A1.12 READ PACK CELL1 VOL 读取 CL1 电压'},
    readPackCell2Vol: {type: String, description: 'A1.13 READ PACK CELL2 VOL 读取 CL2 电压'},
    chkCellVolDiffMax: {type: String, description: 'A1.14 CHK CELL VOL DIFF MAX CL1 CL2 压差校验'},
    readNtc: {type: String, description: 'A1.15 READ NTC 读取 NTC'},
    chkUiVersion: {type: String, description: 'A1.17 CHK UI VERSION 读取软件版本'},
    discharge1ATestPrepare: {
        type: String,
        description: 'A3.2 DISCHARGE1A TEST PREPARE 放电准备-电子负载恒流 1A，改为 3A'
    },
    chkBatOutVol: {type: String, description: 'A3.9 CHK BATOUT VOL 放电 BAT 输出电压'},
    chkDischargeCur: {type: String, description: 'A3.10 CHK DISCHARGE CUR 负载放电和电子负载电流校验'},
    readDischargeCur: {type: String, description: 'A3.11 READ DISCHARGE CUR 读取放电电流'},
    readDischargeSta: {type: String, description: 'A3.11B READ DISCHARGE STA 读取放电状态'},
    dischargeOcpTestPrepare: {type: String, description: 'A3.12 DISCHARGE OCP TEST PREPARE 过流检查'},
    readDischargeCur2: {type: String, description: 'A3.13 READ DISCHARGE CUR 读取放电电流'},
    readDischargeSta2: {type: String, description: 'A3.13B READ DISCHARGE STA 读取放电结束'},
    dischargeTestEnd: {type: String, description: 'A3.17 DISCHARGE TEST END 放电测试结束'},
    chkUiTx: {type: String, description: 'A3.22A CHK UI TX 遥控器通讯口校验'},
    chargeTestPrepare: {type: String, description: 'A6.01 CHARGE TEST PREPARE 2A 适配器充电准备'},
    readChargerVolt: {type: String, description: 'A6.03 READ CHARGER VOLT 读取充电器电压'},
    readChargeCur: {type: String, description: 'A6.04 READ CHARGE CUR 读取充电电流'},
    ateChangeCur: {type: String, description: 'A6.05 ATECHARGE CUR 自检 ATE 充电电流'},
    chkStillChargeCur: {type: String, description: 'A6.06 CHK STILL CHARGE CUR 充电保持电流'},
    chargeTestEnd: {type: String, description: 'A6.07 CHARGE TEST END 充电结束'},
    readSoc: {type: String, description: 'A7.14 READ SOC 读取 SOC'},
    packOff: {type: String, description: 'A8.0 PACK OFF 遥控器关机'},
    allTestEnd: {type: String, description: 'A9.0 ALL TEST END 所有测试结束'},
    passFail: {type: String, description: 'PASS/Fail 测试结果'},
    testTime: {type: String, description: '测试耗时（秒）'},
    startTime: {type: String, description: '测试起始时间'}
   
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
