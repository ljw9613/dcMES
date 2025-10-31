/**
 * 检验失败数据导出脚本测试版本
 * 
 * 这是一个简化的测试版本，用于验证脚本的基本功能
 * 使用方法: node test_export_script.js <工单ID>
 */

const mongoose = require('mongoose');

// 简化的数据库配置
const DB_CONFIG = {
  host: 'localhost',
  port: 27017,
  database: 'dcmesvn',
  // 如果需要认证，请取消注释并填写用户名密码
  username: 'dcMesVn',
  password: '8AS82jsx7LbjsaTB'
};

// 引入数据模型
const MaterialProcessFlow = require('./dcMes_server/model/project/materialProcessFlow');
const InspectionData = require('./dcMes_server/model/project/InspectionData');
// 引入关联模型以支持populate功能
require('./dcMes_server/model/project/machine');
require('./dcMes_server/model/project/processStep');

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
 * 测试查询工单条码
 */
async function testGetBarcodes(workOrderId) {
  try {
    console.log(`\n🔍 测试查询工单 ${workOrderId} 的条码...`);
    
    if (!mongoose.Types.ObjectId.isValid(workOrderId)) {
      throw new Error('无效的工单ID格式');
    }
    
    const materialFlows = await MaterialProcessFlow.find({
      productionPlanWorkOrderId: new mongoose.Types.ObjectId(workOrderId)
    }).select('barcode materialCode materialName').limit(10);
    
    console.log(`✅ 找到 ${materialFlows.length} 个条码（显示前10个）:`);
    materialFlows.forEach((flow, index) => {
      console.log(`  ${index + 1}. ${flow.barcode} - ${flow.materialCode} - ${flow.materialName}`);
    });
    
    return materialFlows.map(flow => flow.barcode);
    
  } catch (error) {
    console.error('❌ 查询条码失败:', error.message);
    throw error;
  }
}

/**
 * 测试查询检验失败记录
 */
async function testGetFailedInspection(barcodes) {
  try {
    console.log(`\n🔍 测试查询检验失败记录...`);
    
    const sampleBarcodes = barcodes.slice(0, 5); // 只测试前5个条码
    console.log(`测试条码: ${sampleBarcodes.join(', ')}`);
    
    const failedRecords = await InspectionData.find({
      scanCode: { $in: sampleBarcodes },
      error: true
    })
    .populate('machineId', 'name ip')
    .populate('processId', 'name code')
    .limit(10)
    .sort({ createTime: -1 });
    
    console.log(`✅ 找到 ${failedRecords.length} 条失败记录（显示前10条）:`);
    failedRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.scanCode} - ${record.machineId?.name || '未知设备'} - ${new Date(record.createTime).toLocaleString('zh-CN')}`);
    });
    
    return failedRecords;
    
  } catch (error) {
    console.error('❌ 查询检验失败记录失败:', error.message);
    throw error;
  }
}

/**
 * 测试统计信息
 */
async function testStatistics(workOrderId) {
  try {
    console.log(`\n📊 测试统计信息...`);
    
    // 统计工单总条码数
    const totalBarcodes = await MaterialProcessFlow.countDocuments({
      productionPlanWorkOrderId: new mongoose.Types.ObjectId(workOrderId)
    });
    
    // 获取所有条码
    const allBarcodes = await MaterialProcessFlow.find({
      productionPlanWorkOrderId: new mongoose.Types.ObjectId(workOrderId)
    }).select('barcode');
    
    const scanCodes = allBarcodes.map(flow => flow.barcode);
    
    // 统计失败记录数
    const totalFailedRecords = await InspectionData.countDocuments({
      scanCode: { $in: scanCodes },
      error: true
    });
    
    // 统计有失败记录的条码数
    const failedBarcodes = await InspectionData.distinct('scanCode', {
      scanCode: { $in: scanCodes },
      error: true
    });
    
    console.log('📊 统计结果:');
    console.log(`  工单ID: ${workOrderId}`);
    console.log(`  总条码数量: ${totalBarcodes}`);
    console.log(`  检验失败记录数: ${totalFailedRecords}`);
    console.log(`  有失败记录的条码数: ${failedBarcodes.length}`);
    
    if (totalFailedRecords > 0) {
      console.log(`  失败率: ${((failedBarcodes.length / totalBarcodes) * 100).toFixed(2)}%`);
    } else {
      console.log('  🎉 所有条码检验都通过了！');
    }
    
  } catch (error) {
    console.error('❌ 统计失败:', error.message);
    throw error;
  }
}

/**
 * 主测试函数
 */
async function main() {
  try {
    const workOrderId = process.argv[2];
    
    if (!workOrderId) {
      console.error('❌ 请提供工单ID');
      console.log('使用方法: node test_export_script.js <工单ID>');
      process.exit(1);
    }
    
    console.log('🧪 开始测试检验失败数据导出脚本...');
    console.log(`工单ID: ${workOrderId}`);
    
    // 连接数据库
    await connectDatabase();
    
    // 测试查询条码
    const barcodes = await testGetBarcodes(workOrderId);
    
    if (barcodes.length === 0) {
      console.log('⚠️  该工单没有对应的条码');
      return;
    }
    
    // 测试查询失败记录
    await testGetFailedInspection(barcodes);
    
    // 测试统计信息
    await testStatistics(workOrderId);
    
    console.log('\n✅ 测试完成！脚本功能正常。');
    console.log('💡 如需导出完整数据，请使用: node export_failed_inspection_data.js <工单ID>');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行测试
if (require.main === module) {
  main();
}
