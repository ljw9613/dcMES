/**
 * 简化版检验失败数据导出脚本
 * 避免populate问题，直接查询数据
 * 
 * 使用方法：
 * node export_failed_inspection_simple.js <工单ID>
 */

const mongoose = require('mongoose');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 数据库连接配置
const DB_CONFIG = {
  host: 'localhost',
  port: 27017,
  database: 'dcmesvn',
  username: 'dcMesVn',
  password: '8AS82jsx7LbjsaTB'
};

// 引入数据模型
const MaterialProcessFlow = require('./model/project/materialProcessFlow');
const InspectionData = require('./model/project/InspectionData');

/**
 * 连接数据库
 */
async function connectDatabase() {
  try {
    const { host, port, database, username, password } = DB_CONFIG;
    let connectionString;
    
    if (username && password) {
      connectionString = `mongodb://${username}:${password}@${host}:${port}/${database}`;
    } else {
      connectionString = `mongodb://${host}:${port}/${database}`;
    }
    
    console.log('正在连接数据库...');
    
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  }
}

/**
 * 根据工单ID获取所有相关条码
 */
async function getBarcodesByWorkOrder(workOrderId) {
  try {
    console.log(`🔍 正在查找工单 ${workOrderId} 对应的条码...`);
    
    if (!mongoose.Types.ObjectId.isValid(workOrderId)) {
      throw new Error('无效的工单ID格式');
    }
    
    const materialFlows = await MaterialProcessFlow.find({
      productionPlanWorkOrderId: new mongoose.Types.ObjectId(workOrderId)
    }).select('barcode materialCode materialName');
    
    if (materialFlows.length === 0) {
      console.log('⚠️  未找到该工单对应的条码记录');
      return [];
    }
    
    const barcodes = materialFlows.map(flow => ({
      barcode: flow.barcode,
      materialCode: flow.materialCode,
      materialName: flow.materialName
    }));
    
    console.log(`✅ 找到 ${barcodes.length} 个条码`);
    return barcodes;
    
  } catch (error) {
    console.error('❌ 获取条码失败:', error.message);
    throw error;
  }
}

/**
 * 根据条码获取检验失败的记录（不使用populate）
 */
async function getFailedInspectionData(barcodes) {
  try {
    console.log('🔍 正在查找检验失败的记录...');
    
    const scanCodes = barcodes.map(item => item.barcode);
    
    // 分批查询，避免查询过大
    const batchSize = 100;
    let allFailedData = [];
    
    for (let i = 0; i < scanCodes.length; i += batchSize) {
      const batch = scanCodes.slice(i, i + batchSize);
      console.log(`正在处理第 ${Math.floor(i/batchSize) + 1} 批条码 (${batch.length} 个)...`);
      
      // 查询失败的检验记录（不使用populate）
      const failedRecords = await InspectionData.find({
        scanCode: { $in: batch },
        error: true
      }).sort({ createTime: -1 });
      
      allFailedData = allFailedData.concat(failedRecords);
    }
    
    console.log(`✅ 找到 ${allFailedData.length} 条失败的检验记录`);
    return allFailedData;
    
  } catch (error) {
    console.error('❌ 获取检验失败记录失败:', error.message);
    throw error;
  }
}

/**
 * 格式化检验数据用于导出
 */
function formatInspectionData(failedData, barcodes) {
  console.log('📊 正在格式化检验数据...');
  
  // 创建条码映射表
  const barcodeMap = {};
  barcodes.forEach(item => {
    barcodeMap[item.barcode] = {
      materialCode: item.materialCode,
      materialName: item.materialName
    };
  });
  
  return failedData.map(record => {
    const barcodeInfo = barcodeMap[record.scanCode] || {};
    
    // 提取所有检验项目数据
    const inspectionFields = {};
    
    // 遍历所有可能的检验字段
    const excludeFields = [
      '_id', '__v', 'scanCode', 'machineId', 'processId', 'createTime', 
      'updateTime', 'scanCodeBindRecordId', 'error', 'dataUpload', 
      'dataUploadTime', 'uploadFailInfo', 'dataNotRequiredForUpload',
      'dataUploadCount', 'dataUploadCountExceededLimit', 'inspectionData'
    ];
    
    Object.keys(record.toObject()).forEach(key => {
      if (!excludeFields.includes(key) && record[key] !== null && record[key] !== undefined && record[key] !== '') {
        inspectionFields[key] = record[key];
      }
    });
    
    // 处理inspectionData数组
    if (record.inspectionData && record.inspectionData.length > 0) {
      record.inspectionData.forEach((item, index) => {
        if (item.field && item.value) {
          inspectionFields[`检验项${index + 1}_${item.field}`] = item.value;
        }
      });
    }
    
    return {
      '条码': record.scanCode,
      '物料编码': barcodeInfo.materialCode || '',
      '物料名称': barcodeInfo.materialName || '',
      '设备ID': record.machineId ? record.machineId.toString() : '',
      '设备IP': record.machineIp || '',
      '工序ID': record.processId ? record.processId.toString() : '',
      '检测时间': record.createTime ? new Date(record.createTime).toLocaleString('zh-CN') : '',
      '错误状态': record.error ? '失败' : '成功',
      '数据上传状态': record.dataUpload ? '已上传' : '未上传',
      '上传失败原因': record.uploadFailInfo || '',
      ...inspectionFields
    };
  });
}

/**
 * 导出数据到Excel文件
 */
function exportToExcel(data, workOrderId) {
  try {
    console.log('📝 正在生成Excel文件...');
    
    if (data.length === 0) {
      console.log('⚠️  没有数据需要导出');
      return null;
    }
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(data);
    
    // 设置列宽
    const colWidths = [];
    if (data.length > 0) {
      Object.keys(data[0]).forEach(key => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        );
        colWidths.push({ wch: Math.min(maxLength + 2, 50) });
      });
    }
    ws['!cols'] = colWidths;
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '检验失败数据');
    
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `工单${workOrderId}_检验失败数据_${timestamp}.xlsx`;
    const filePath = path.join(__dirname, 'output', fileName);
    
    // 确保输出目录存在
    const outputDir = path.dirname(filePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 写入文件
    XLSX.writeFile(wb, filePath);
    
    console.log(`✅ Excel文件已生成: ${fileName}`);
    return filePath;
    
  } catch (error) {
    console.error('❌ 导出Excel文件失败:', error.message);
    throw error;
  }
}

/**
 * 压缩文件
 */
function compressFile(filePath) {
  return new Promise((resolve, reject) => {
    try {
      console.log('🗜️  正在压缩文件...');
      
      const zipPath = filePath.replace('.xlsx', '.zip');
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => {
        console.log(`✅ 文件已压缩: ${path.basename(zipPath)} (${archive.pointer()} bytes)`);
        
        // 删除原始Excel文件
        fs.unlinkSync(filePath);
        
        resolve(zipPath);
      });
      
      archive.on('error', (err) => {
        reject(err);
      });
      
      archive.pipe(output);
      archive.file(filePath, { name: path.basename(filePath) });
      archive.finalize();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 生成统计报告
 */
function generateReport(barcodes, failedData, workOrderId) {
  console.log('\n📊 ===== 统计报告 =====');
  console.log(`工单ID: ${workOrderId}`);
  console.log(`总条码数量: ${barcodes.length}`);
  console.log(`检验失败记录数: ${failedData.length}`);
  
  // 统计有失败记录的条码数量
  const failedBarcodes = new Set(failedData.map(record => record.scanCode));
  console.log(`有失败记录的条码数: ${failedBarcodes.size}`);
  
  if (barcodes.length > 0) {
    console.log(`失败率: ${((failedBarcodes.size / barcodes.length) * 100).toFixed(2)}%`);
  }
  
  // 按设备ID统计失败次数
  const machineStats = {};
  failedData.forEach(record => {
    const machineId = record.machineId ? record.machineId.toString() : '未知设备';
    machineStats[machineId] = (machineStats[machineId] || 0) + 1;
  });
  
  console.log('\n按设备ID统计失败次数:');
  Object.entries(machineStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10) // 只显示前10个
    .forEach(([machineId, count]) => {
      console.log(`  ${machineId}: ${count} 次`);
    });
  
  console.log('========================\n');
}

/**
 * 主函数
 */
async function main() {
  try {
    const workOrderId = process.argv[2];
    
    if (!workOrderId) {
      console.error('❌ 请提供工单ID');
      console.log('使用方法: node export_failed_inspection_simple.js <工单ID>');
      process.exit(1);
    }
    
    console.log('🚀 开始导出工单检验失败数据...');
    console.log(`工单ID: ${workOrderId}\n`);
    
    // 连接数据库
    await connectDatabase();
    
    // 获取工单对应的条码
    const barcodes = await getBarcodesByWorkOrder(workOrderId);
    
    if (barcodes.length === 0) {
      console.log('⚠️  该工单没有对应的条码，无需导出');
      return;
    }
    
    // 获取检验失败的记录
    const failedData = await getFailedInspectionData(barcodes);
    
    if (failedData.length === 0) {
      console.log('🎉 该工单的所有条码检验都通过了，没有失败记录！');
      return;
    }
    
    // 格式化数据
    const formattedData = formatInspectionData(failedData, barcodes);
    
    // 导出到Excel
    const excelPath = exportToExcel(formattedData, workOrderId);
    
    if (excelPath) {
      // 压缩文件
      const zipPath = await compressFile(excelPath);
      
      // 生成统计报告
      generateReport(barcodes, failedData, workOrderId);
      
      console.log(`🎉 导出完成！压缩文件保存在: ${zipPath}`);
    }
    
  } catch (error) {
    console.error('❌ 导出过程中发生错误:', error.message);
    console.error(error.stack);
  } finally {
    // 关闭数据库连接
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

// 运行主函数
if (require.main === module) {
  main();
}
