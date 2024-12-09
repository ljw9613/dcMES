import {ScanCodeBindRecord} from "./ScanCodeBindRecord";
import {Process} from "./Process";

const mongoose = require('mongoose');

export const filed = {
    scanCode: {type: String, maxlength: 100, default: null, description: '扫码数据'},
    machineId: {type: String, default: null, description: '设备ID'},
    machineIp: {type: String, default: null, description: 'IP地址'},
    processId: {type: mongoose.Schema.Types.ObjectId, ref: Process, description: '工序'},
    createTime: {type: Date, default: Date.now, description: '创建时间'},
    updateTime: {type: Date, default: null, description: '更新时间'},
    scanCodeBindRecordId: {
        type: mongoose.Schema.ObjectId,
        ref: "ScanCodeBindRecord",
        description: '扫码数据绑定记录'
    },
    error: {type: Boolean, default: false, description: '错误标志'},
    facialSensorValue: {type: Number, description: '面部传感器值'},
    cell1Voltage: {type: Number, description: '电芯1电压'},
    cell2Voltage: {type: Number, description: '电芯2电压'},
    weight: {type: Number, description: '称重重量'},
    showSerialNo: {type: Boolean, description: '0.4 SHOW SERIALNO 显示序列号'},
    chkPowerOn: {type: Boolean, description: 'A1.0 CHK POWER ON ATE 上电开机'},
    enterDebugMode: {type: Boolean, description: 'A1.1 ENTER DEBUG MODE 进入调试模式'},
    showReadCellMsg: {type: String, description: 'A7.7 SHOW READ CELL MSG 显示读取电池消息'},
    showReadMainPcbaMsg: {type: String, description: 'A7.9 SHOW READ MAIN PCBA MSG 显示读取主PCBA消息'},
    showReadPcba2Msg: {type: String, description: 'A7.11 SHOW READ PCBA2 MSG 显示读取PCBA2消息'},
    showReadPackMsg: {type: String, description: 'A7.13 SHOW READ PACK MSG 读取 MCU 遥控器机身码'},
    readAllKeyOff: {type: Boolean, description: 'A1.2 READ ALL KEY OFF 读取所有按键关闭状态'},
    readK4K5: {type: Boolean, description: 'A1.3 READ K4 K5 读取 K4 K5 左右键状态'},
    readPotentiometer: {type: Boolean, description: 'A1.4 READ POTENTIOMETER 检查编码开关'},
    readAllKeyOff2: {type: Boolean, description: 'A1.5 READ ALL KEY OFF 读取所有按键关闭状态'},
    readPackVol: {type: Number, description: 'A1.10 READ PACK VOL 读取 PACK 总电压'},
    readPackCell1Vol: {type: Number, description: 'A1.12 READ PACK CELL1 VOL 读取 CL1 电压'},
    readPackCell2Vol: {type: Number, description: 'A1.13 READ PACK CELL2 VOL 读取 CL2 电压'},
    chkCellVolDiffMax: {type: Number, description: 'A1.14 CHK CELL VOL DIFF MAX CL1 CL2 压差校验'},
    readNtc: {type: Number, description: 'A1.15 READ NTC 读取 NTC'},
    chkUiVersion: {type: String, description: 'A1.17 CHK UI VERSION 读取软件版本'},
    discharge1ATestPrepare: {type: Boolean, description: 'A3.2 DISCHARGE1A TEST PREPARE 放电准备-电子负载恒流 1A，改为 3A'},
    chkBatOutVol: {type: Number, description: 'A3.9 CHK BATOUT VOL 放电 BAT 输出电压'},
    chkDischargeCur: {type: Number, description: 'A3.10 CHK DISCHARGE CUR 负载放电和电子负载电流校验'},
    readDischargeCur: {type: Number, description: 'A3.11 READ DISCHARGE CUR 读取放电电流'},
    readDischargeSta: {type: String, description: 'A3.11B READ DISCHARGE STA 读取放电状态'},
    dischargeOcpTestPrepare: {type: Boolean, description: 'A3.12 DISCHARGE OCP TEST PREPARE 过流检查'},
    readDischargeCur2: {type: Number, description: 'A3.13 READ DISCHARGE CUR 读取放电电流'},
    readDischargeSta2: {type: String, description: 'A3.13B READ DISCHARGE STA 读取放电结束'},
    dischargeTestEnd: {type: Boolean, description: 'A3.17 DISCHARGE TEST END 放电测试结束'},
    chkUiTx: {type: Boolean, description: 'A3.22A CHK UI TX 遥控器通讯口校验'},
    chargeTestPrepare: {type: Boolean, description: 'A6.01 CHARGE TEST PREPARE 2A 适配器充电准备'},
    readChargerVolt: {type: Number, description: 'A6.03 READ CHARGER VOLT 读取充电器电压'},
    readChargeCur: {type: Number, description: 'A6.04 READ CHARGE CUR 读取充电电流'},
    ateChangeCur: {type: Number, description: 'A6.05 ATECHARGE CUR 自检 ATE 充电电流'},
    chkStillChargeCur: {type: Number, description: 'A6.06 CHK STILL CHARGE CUR 充电保持电流'},
    chargeTestEnd: {type: Boolean, description: 'A6.07 CHARGE TEST END 充电结束'},
    readSoc: {type: Number, description: 'A7.14 READ SOC 读取 SOC'},
    packOff: {type: Boolean, description: 'A8.0 PACK OFF 遥控器关机'},
    allTestEnd: {type: Boolean, description: 'A9.0 ALL TEST END 所有测试结束'},
    passFail: {type: String, description: 'PASS/Fail 测试结果'},
    testTime: {type: Number, description: '测试耗时（秒）'},
    startTime: {type: Date, description: '测试起始时间'}
}

export const inspectionData = new mongoose.Schema(filed, {
    timestamps: {createdAt: 'createTime', updatedAt: 'updateTime'},
    collection: 'inspection_data', // 指定集合名称
});

export const InspectionData = mongoose.model('InspectionData', inspectionData);
