const axios = require('axios');
const logger = require('../libs/logger'); // 更新为正确的logger路径
const fs = require('fs');
const path = require('path');

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');
fs.existsSync(logDir) || fs.mkdirSync(logDir);

/**
 * 当出库单变为完成状态时，调用第三方接口通知
 * @param {string} entryNo - 出库单号
 * @returns {Promise<object>} - 接口调用结果
 */
async function notifyOutWarehouseCompleted(entryNo) {
  try {
    // 记录开始调用
    console.log(`开始调用出库完成通知接口，出库单号: ${entryNo}`);
    
    // 调用第三方接口
    const response = await axios.post('http://10.0.50.250:3468/api/v1/inspection/outWarehouseDataUploada', {
      warehouseNo: entryNo
    });
    
    // 记录调用结果
    console.log(`出库完成通知接口调用成功，出库单号: ${entryNo}，响应: ${JSON.stringify(response.data)}`);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    // 记录错误信息
    console.error(`出库完成通知接口调用失败，出库单号: ${entryNo}，错误: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

/**
 * 当托盘入库时，调用第三方接口通知
 * @param {string} workOrderNo - 工单号
 * @param {string} palletCode - 托盘编码
 * @returns {Promise<object>} - 接口调用结果
 */
async function notifyInWarehousePallet(workOrderNo, palletCode) {
  try {
    // 记录开始调用
    console.log(`开始调用入库托盘上传接口，工单号: ${workOrderNo}, 托盘编码: ${palletCode}`);
    
    // 调用第三方接口
    const response = await axios.post('http://10.0.50.250:3468/api/v1/inspection/outWarehouseDataUploada', {
      workOrderNo: workOrderNo,
      palletCode: palletCode
    });
    
    // 记录调用结果
    console.log(`入库托盘上传接口调用成功，工单号: ${workOrderNo}, 托盘编码: ${palletCode}，响应: ${JSON.stringify(response.data)}`);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    // 记录错误信息
    console.error(`入库托盘上传接口调用失败，工单号: ${workOrderNo}, 托盘编码: ${palletCode}，错误: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

module.exports = {
  notifyOutWarehouseCompleted,
  notifyInWarehousePallet
}; 