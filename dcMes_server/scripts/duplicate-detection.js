/**
 * 重复数据检测脚本
 * 用于分析和检测产出数量重复统计的问题
 */

const mongoose = require('mongoose');
const WorkOrderQuantityLog = require('../model/project/workOrderQuantityLog');

// 数据库连接配置 - 从dcMes_server/db.js复制
const mongodbUrl = "mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes";

const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 120000,
  connectTimeoutMS: 30000,
  maxPoolSize: 50,
  minPoolSize: 10,
  maxConnecting: 20,
  retryWrites: true,
  family: 4,
  maxIdleTimeMS: 60000,
  heartbeatFrequencyMS: 10000,
  waitQueueTimeoutMS: 10000,
  writeConcern: { w: 1 },
  readPreference: 'primary'
};

/**
 * 连接数据库
 */
async function connectDatabase() {
  try {
    console.log('🔌 正在连接数据库...');
    await mongoose.connect(mongodbUrl, connectOptions);
    console.log('✅ 数据库连接成功\n');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

/**
 * 关闭数据库连接
 */
async function closeDatabase() {
  try {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接失败:', error.message);
  }
}

/**
 * 检测重复的产出记录
 */
async function detectDuplicateOutputRecords(options = {}) {
  try {
    const {
      timeRange = 7, // 检查最近7天的数据
      minDuplicates = 2 // 最少重复次数
    } = options;

    console.log(`🔍 开始检测重复产出记录...`);
    console.log(`检查时间范围: 最近${timeRange}天`);
    console.log(`重复阈值: ${minDuplicates}次及以上\n`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // 聚合查询，按工单ID和条码分组
    const duplicateRecords = await WorkOrderQuantityLog.aggregate([
      {
        $match: {
          changeType: 'output',
          operateTime: { $gte: startDate },
          reason: { $regex: /末道工序产出|扫描工序组件末道工序产出|产出统计/ }
        }
      },
      {
        $group: {
          _id: {
            workOrderId: '$workOrderId',
            relatedBarcode: '$relatedBarcode'
          },
          count: { $sum: 1 },
          records: {
            $push: {
              _id: '$_id',
              operateTime: '$operateTime',
              operatorId: '$operatorId',
              changeQuantity: '$changeQuantity',
              reason: '$reason'
            }
          },
          totalQuantity: { $sum: '$changeQuantity' }
        }
      },
      {
        $match: {
          count: { $gte: minDuplicates }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log(`=== 检测结果 ===`);
    console.log(`发现 ${duplicateRecords.length} 个重复记录组\n`);

    if (duplicateRecords.length === 0) {
      console.log('✅ 未发现重复的产出记录');
      return { duplicates: [], summary: { totalDuplicates: 0, totalExcess: 0, affectedBarcodes: 0 } };
    }

    let totalDuplicateCount = 0;
    let totalExcessQuantity = 0;

    duplicateRecords.forEach((group, index) => {
      const { workOrderId, relatedBarcode } = group._id;
      const duplicateCount = group.count - 1; // 减去1个正常记录
      totalDuplicateCount += duplicateCount;
      totalExcessQuantity += duplicateCount; // 假设每次都是+1

      console.log(`${index + 1}. 工单ID: ${workOrderId}`);
      console.log(`   条码: ${relatedBarcode}`);
      console.log(`   重复次数: ${group.count} (多计 ${duplicateCount} 次)`);
      console.log(`   总计数量: ${group.totalQuantity}`);
      console.log(`   记录详情:`);
      
      group.records.forEach((record, i) => {
        console.log(`     ${i + 1}) ${record.operateTime} - ${record.operatorId} - 数量:${record.changeQuantity} - ${record.reason}`);
      });
      console.log('');
    });

    console.log(`=== 统计汇总 ===`);
    console.log(`总重复记录数: ${totalDuplicateCount}`);
    console.log(`总多计数量: ${totalExcessQuantity}`);
    console.log(`影响的条码数: ${duplicateRecords.length}\n`);

    // 生成修复建议
    await generateFixSuggestions(duplicateRecords);

    return { 
      duplicates: duplicateRecords, 
      summary: { 
        totalDuplicates: totalDuplicateCount, 
        totalExcess: totalExcessQuantity, 
        affectedBarcodes: duplicateRecords.length 
      } 
    };

  } catch (error) {
    console.error('检测重复记录失败:', error);
    return { duplicates: [], summary: { totalDuplicates: 0, totalExcess: 0, affectedBarcodes: 0 } };
  }
}

/**
 * 生成修复建议
 */
async function generateFixSuggestions(duplicateRecords) {
  console.log(`=== 修复建议 ===`);
  
  if (duplicateRecords.length === 0) {
    return;
  }

  // 统计影响的工单
  const affectedWorkOrders = [...new Set(duplicateRecords.map(r => r._id.workOrderId.toString()))];
  
  console.log(`1. 影响的工单数量: ${affectedWorkOrders.length}`);
  console.log(`2. 建议的修复步骤:`);
  console.log(`   a) 备份当前数据`);
  console.log(`   b) 删除重复的日志记录（保留最早的一条）`);
  console.log(`   c) 重新计算工单的产出数量`);
  console.log(`   d) 更新工单状态和进度\n`);

  // 生成修复SQL
  console.log(`=== 修复脚本示例 ===`);
  console.log(`// 删除重复记录的脚本（保留最早的记录）:`);
  
  duplicateRecords.slice(0, 3).forEach((group, index) => {
    const { workOrderId, relatedBarcode } = group._id;
    
    console.log(`// 第${index + 1}组重复记录`);
    console.log(`// 工单ID: ${workOrderId}, 条码: ${relatedBarcode}`);
    console.log(`const recordsToDelete = await db.workorderquantitylogs.find({`);
    console.log(`  workOrderId: ObjectId('${workOrderId}'),`);
    console.log(`  relatedBarcode: '${relatedBarcode}',`);
    console.log(`  changeType: 'output'`);
    console.log(`}).sort({ operateTime: 1 }).skip(1); // 跳过最早的记录`);
    console.log(`await db.workorderquantitylogs.deleteMany({`);
    console.log(`  _id: { $in: recordsToDelete.map(r => r._id) }`);
    console.log(`});\n`);
  });

  if (duplicateRecords.length > 3) {
    console.log(`... 以及其他 ${duplicateRecords.length - 3} 组重复记录\n`);
  }
}

/**
 * 检测异常的产出量增长
 */
async function detectAbnormalOutputGrowth(options = {}) {
  try {
    const {
      timeRange = 1, // 检查最近1天
      threshold = 2   // 异常阈值：同一条码在短时间内增长超过2
    } = options;

    console.log(`🔍 检测异常产出量增长...`);
    console.log(`时间范围: 最近${timeRange}天`);
    console.log(`异常阈值: 同一条码产出增长超过${threshold}\n`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // 查找在短时间内有多次产出记录的条码
    const abnormalGrowth = await WorkOrderQuantityLog.aggregate([
      {
        $match: {
          changeType: 'output',
          operateTime: { $gte: startDate },
          changeQuantity: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$relatedBarcode',
          workOrderIds: { $addToSet: '$workOrderId' },
          totalOutputIncrease: { $sum: '$changeQuantity' },
          operationCount: { $sum: 1 },
          firstOperation: { $min: '$operateTime' },
          lastOperation: { $max: '$operateTime' },
          operations: {
            $push: {
              time: '$operateTime',
              workOrderId: '$workOrderId',
              quantity: '$changeQuantity',
              operator: '$operatorId'
            }
          }
        }
      },
      {
        $match: {
          totalOutputIncrease: { $gt: threshold }
        }
      },
      {
        $addFields: {
          timeSpan: {
            $divide: [
              { $subtract: ['$lastOperation', '$firstOperation'] },
              1000 * 60 // 转换为分钟
            ]
          }
        }
      },
      {
        $sort: { totalOutputIncrease: -1 }
      }
    ]);

    console.log(`=== 异常增长检测结果 ===`);
    console.log(`发现 ${abnormalGrowth.length} 个异常增长的条码\n`);

    if (abnormalGrowth.length === 0) {
      console.log('✅ 未发现异常的产出量增长');
      return [];
    }

    abnormalGrowth.forEach((item, index) => {
      console.log(`${index + 1}. 条码: ${item._id}`);
      console.log(`   总产出增长: ${item.totalOutputIncrease}`);
      console.log(`   操作次数: ${item.operationCount}`);
      console.log(`   时间跨度: ${item.timeSpan.toFixed(2)} 分钟`);
      console.log(`   涉及工单: ${item.workOrderIds.length} 个`);
      console.log(`   操作详情:`);
      
      item.operations.forEach((op, i) => {
        console.log(`     ${i + 1}) ${op.time} - ${op.operator} - 工单:${op.workOrderId} - 数量:${op.quantity}`);
      });
      console.log('');
    });

    return abnormalGrowth;

  } catch (error) {
    console.error('检测异常增长失败:', error);
    return [];
  }
}

/**
 * 分析产出量统计的时间分布
 */
async function analyzeOutputTimeDistribution(options = {}) {
  try {
    const { timeRange = 7 } = options;
    
    console.log(`📊 分析产出量统计的时间分布...`);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const distribution = await WorkOrderQuantityLog.aggregate([
      {
        $match: {
          changeType: 'output',
          operateTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$operateTime' },
            month: { $month: '$operateTime' },
            day: { $dayOfMonth: '$operateTime' },
            hour: { $hour: '$operateTime' }
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: '$changeQuantity' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
      }
    ]);

    console.log(`=== 时间分布分析 ===`);
    if (distribution.length === 0) {
      console.log('在指定时间范围内未找到产出记录');
      return [];
    }
    
    distribution.forEach(item => {
      const { year, month, day, hour } = item._id;
      console.log(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:00 - 记录数: ${item.count}, 总数量: ${item.totalQuantity}`);
    });

    return distribution;

  } catch (error) {
    console.error('分析时间分布失败:', error);
    return [];
  }
}

/**
 * 生成检测报告
 */
function generateReport(duplicateResult, abnormalResult, distributionResult) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      duplicateIssues: duplicateResult.summary.totalDuplicates > 0,
      abnormalGrowthIssues: abnormalResult.length > 0,
      totalDuplicateRecords: duplicateResult.summary.totalDuplicates,
      totalExcessQuantity: duplicateResult.summary.totalExcess,
      affectedBarcodes: duplicateResult.summary.affectedBarcodes,
      abnormalBarcodes: abnormalResult.length
    },
    recommendations: []
  };

  console.log(`\n=== 检测报告汇总 ===`);
  console.log(`检测时间: ${report.timestamp}`);
  console.log(`发现重复问题: ${report.summary.duplicateIssues ? '是' : '否'}`);
  console.log(`发现异常增长: ${report.summary.abnormalGrowthIssues ? '是' : '否'}`);
  
  if (report.summary.duplicateIssues) {
    console.log(`总重复记录: ${report.summary.totalDuplicateRecords} 条`);
    console.log(`总多计数量: ${report.summary.totalExcessQuantity}`);
    console.log(`受影响条码: ${report.summary.affectedBarcodes} 个`);
    report.recommendations.push('立即部署并发控制修复方案');
    report.recommendations.push('清理现有重复数据');
  }
  
  if (report.summary.abnormalGrowthIssues) {
    console.log(`异常增长条码: ${report.summary.abnormalBarcodes} 个`);
    report.recommendations.push('检查异常增长的条码是否为合法操作');
  }

  if (!report.summary.duplicateIssues && !report.summary.abnormalGrowthIssues) {
    console.log('✅ 未发现数据异常问题');
    report.recommendations.push('数据状态良好，建议继续监控');
  }

  return report;
}

/**
 * 主执行函数
 */
async function runDuplicateDetection(options = {}) {
  try {
    console.log('🚀 开始重复数据检测分析\n');

    // 连接数据库
    await connectDatabase();

    const duplicateResult = await detectDuplicateOutputRecords(options);
    const abnormalResult = await detectAbnormalOutputGrowth(options);
    const distributionResult = await analyzeOutputTimeDistribution(options);

    // 生成报告
    const report = generateReport(duplicateResult, abnormalResult, distributionResult);

    console.log('\n✅ 重复数据检测完成');
    
    return report;

  } catch (error) {
    console.error('重复数据检测失败:', error);
  } finally {
    // 关闭数据库连接
    await closeDatabase();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  // 可以在这里配置检测选项
  const options = {
    timeRange: 7,     // 检查最近7天
    minDuplicates: 2, // 最少重复2次
    threshold: 2      // 异常增长阈值
  };
  
  runDuplicateDetection(options)
    .then(report => {
      if (report && (report.summary.duplicateIssues || report.summary.abnormalGrowthIssues)) {
        process.exit(1); // 发现问题时退出码为1
      }
      process.exit(0); // 正常退出
    })
    .catch(error => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = {
  connectDatabase,
  closeDatabase,
  detectDuplicateOutputRecords,
  detectAbnormalOutputGrowth,
  analyzeOutputTimeDistribution,
  runDuplicateDetection
}; 