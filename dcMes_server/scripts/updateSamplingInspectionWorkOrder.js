/**
 * 批量更新抽检记录工单计划ID脚本
 * 
 * 功能：为缺少productionPlanWorkOrderId的抽检记录从materialProcessFlow中获取并更新
 * 数据库配置：使用与项目db.js相同的连接配置，确保连接一致性
 * 
 * 使用方法：
 * - 批量更新: node scripts/updateSamplingInspectionWorkOrder.js
 * - 验证结果: node scripts/updateSamplingInspectionWorkOrder.js --validate
 */

const mongoose = require('mongoose');

// 引入模型
const UdiSamplingInspectionFlow = require('../model/project/udiSamplingInspectionFlow');
const MaterialProcessFlow = require('../model/project/materialProcessFlow');

/**
 * 数据库连接配置
 * 使用与项目db.js相同的配置
 */
function getDbConfig() {
    const mongodbUrl = "mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes";
    
    const connectOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // 服务器选择超时：30秒
        socketTimeoutMS: 120000, // socket超时增加到120秒，适应长时间运行的查询
        connectTimeoutMS: 30000, // 连接超时：30秒
        maxPoolSize: 50, // 增加连接池最大连接数，支持高并发
        minPoolSize: 10, // 增加最小连接数，减少连接建立开销
        maxConnecting: 20, // 增加同时连接数，提高并发连接能力
        retryWrites: true,
        family: 4, // 强制使用IPv4
        maxIdleTimeMS: 60000, // 空闲连接60秒后关闭，避免资源浪费
        heartbeatFrequencyMS: 10000, // 心跳检测频率增加，更快检测连接问题
        waitQueueTimeoutMS: 10000, // 等待队列超时设置
        writeConcern: { w: 1 }, // 写入确认级别，确保数据写入到至少一个节点
        readPreference: 'primaryPreferred' // 优先从主节点读取，保证数据一致性
    };
    
    return { mongodbUrl, connectOptions };
}

/**
 * 批量更新抽检记录的工单计划ID
 * 为缺少productionPlanWorkOrderId的记录从materialProcessFlow中获取并更新
 * @param {number} batchSize - 批次大小，默认100
 */
async function updateSamplingInspectionWorkOrder(batchSize = 100) {
    try {
        console.log('开始连接数据库...');
        
        // 使用项目中的数据库连接配置
        const { mongodbUrl, connectOptions } = getDbConfig();
        
        // 连接数据库
        await mongoose.connect(mongodbUrl, connectOptions);
        
        console.log('数据库连接成功');
        
        // 验证批次大小参数
        if (!batchSize || batchSize <= 0 || batchSize > 1000) {
            console.warn(`批次大小 ${batchSize} 不合理，使用默认值 100`);
            batchSize = 100;
        }
        
        console.log(`使用批次大小: ${batchSize}`);
        
        // 查询条件
        const queryCondition = {
            $or: [
                { productionPlanWorkOrderId: null },
                { productionPlanWorkOrderId: { $exists: false } }
            ],
            materialProcessFlowId: { $exists: true, $ne: null }
        };
        
        // 首先统计需要更新的总记录数
        const totalRecords = await UdiSamplingInspectionFlow.countDocuments(queryCondition);
        
        console.log(`找到 ${totalRecords} 条需要更新的抽检记录`);
        
        if (totalRecords === 0) {
            console.log('没有需要更新的记录');
            return;
        }
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        // 分批查询和处理，避免内存溢出
        const queryBatchSize = batchSize; // 使用参数化的批次大小
        const totalBatches = Math.ceil(totalRecords / queryBatchSize);
        
        console.log(`将分 ${totalBatches} 批次进行查询和更新处理，每批次 ${queryBatchSize} 条记录`);
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const skip = batchIndex * queryBatchSize;
            const limit = queryBatchSize;
            
            console.log(`\n======== 第 ${batchIndex + 1}/${totalBatches} 批次 ========`);
            console.log(`跳过 ${skip} 条，查询 ${limit} 条记录...`);
            
            try {
                // 分批查询记录，使用populate获取关联数据
                const samplingRecords = await UdiSamplingInspectionFlow.find(queryCondition)
                    .populate('materialProcessFlowId')
                    .skip(skip)
                    .limit(limit)
                    .lean(); // 使用lean()提高查询性能，返回普通JS对象
                
                console.log(`本批次实际查询到 ${samplingRecords.length} 条记录`);
                
                if (samplingRecords.length === 0) {
                    console.log('本批次没有记录，跳过');
                    continue;
                }
                
                // 批量更新操作
                const bulkOps = [];
                
                for (const record of samplingRecords) {
                    try {
                        if (record.materialProcessFlowId && record.materialProcessFlowId.productionPlanWorkOrderId) {
                            bulkOps.push({
                                updateOne: {
                                    filter: { _id: record._id },
                                    update: { 
                                        productionPlanWorkOrderId: record.materialProcessFlowId.productionPlanWorkOrderId,
                                        updateAt: new Date()
                                    }
                                }
                            });
                        } else {
                            console.warn(`记录 ${record._id} 的materialProcessFlow中没有productionPlanWorkOrderId，跳过更新`);
                            errorCount++;
                            errors.push({
                                recordId: record._id,
                                barcode: record.barcode,
                                reason: 'materialProcessFlow中没有productionPlanWorkOrderId'
                            });
                        }
                    } catch (error) {
                        console.error(`处理记录 ${record._id} 时发生错误:`, error.message);
                        errorCount++;
                        errors.push({
                            recordId: record._id,
                            barcode: record.barcode || '未知',
                            reason: error.message
                        });
                    }
                }
                
                // 执行批量更新
                if (bulkOps.length > 0) {
                    try {
                        const result = await UdiSamplingInspectionFlow.bulkWrite(bulkOps, { ordered: false });
                        successCount += result.modifiedCount;
                        console.log(`第 ${batchIndex + 1} 批次更新完成，成功更新 ${result.modifiedCount} 条记录`);
                        console.log(`当前进度: ${successCount + errorCount}/${totalRecords} (${((successCount + errorCount) / totalRecords * 100).toFixed(1)}%)`);
                    } catch (error) {
                        console.error(`第 ${batchIndex + 1} 批次更新失败:`, error.message);
                        errorCount += bulkOps.length;
                    }
                } else {
                    console.log(`第 ${batchIndex + 1} 批次没有需要更新的记录`);
                }
                
                // 强制垃圾回收（如果可用）
                if (global.gc) {
                    global.gc();
                }
                
            } catch (error) {
                console.error(`第 ${batchIndex + 1} 批次查询失败:`, error.message);
                errorCount += queryBatchSize; // 估算错误数量
                errors.push({
                    batchIndex: batchIndex + 1,
                    reason: `批次查询失败: ${error.message}`
                });
            }
        }
        
        // 输出统计信息
        console.log('\n=============== 更新结果统计 ===============');
        console.log(`总记录数: ${totalRecords}`);
        console.log(`成功更新: ${successCount}`);
        console.log(`失败数量: ${errorCount}`);
        console.log(`处理总数: ${successCount + errorCount}`);
        console.log(`成功率: ${totalRecords > 0 ? ((successCount / totalRecords) * 100).toFixed(2) : 0}%`);
        console.log(`完成率: ${totalRecords > 0 ? (((successCount + errorCount) / totalRecords) * 100).toFixed(2) : 0}%`);
        
        // 输出错误详情
        if (errors.length > 0) {
            console.log('\n=============== 错误详情 ===============');
            errors.slice(0, 10).forEach((error, index) => {
                if (error.recordId) {
                    console.log(`${index + 1}. 记录ID: ${error.recordId}, 条码: ${error.barcode || '未知'}, 原因: ${error.reason}`);
                } else if (error.batchIndex) {
                    console.log(`${index + 1}. 批次: ${error.batchIndex}, 原因: ${error.reason}`);
                }
            });
            
            if (errors.length > 10) {
                console.log(`... 还有 ${errors.length - 10} 个错误未显示`);
            }
        }
        
        // 验证更新结果
        console.log('\n=============== 验证更新结果 ===============');
        const updatedCount = await UdiSamplingInspectionFlow.countDocuments({
            productionPlanWorkOrderId: { $exists: true, $ne: null }
        });
        const totalCount = await UdiSamplingInspectionFlow.countDocuments();
        console.log(`数据库中有工单计划ID的记录数: ${updatedCount}`);
        console.log(`数据库中总记录数: ${totalCount}`);
        console.log(`覆盖率: ${((updatedCount / totalCount) * 100).toFixed(2)}%`);
        
        console.log('\n批量更新完成！');
        
    } catch (error) {
        console.error('批量更新过程中发生错误:', error);
    } finally {
        // 关闭数据库连接
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('数据库连接已关闭');
        }
    }
}

/**
 * 验证更新结果的函数
 */
async function validateUpdate() {
    try {
        console.log('开始验证更新结果...');
        
        // 使用项目中的数据库连接配置
        const { mongodbUrl, connectOptions } = getDbConfig();
        
        // 连接数据库
        await mongoose.connect(mongodbUrl, connectOptions);
        
        // 查找一些示例记录进行验证
        const sampleRecords = await UdiSamplingInspectionFlow.find({
            productionPlanWorkOrderId: { $exists: true, $ne: null }
        })
        .populate('productionPlanWorkOrderId')
        .limit(5);
        
        console.log('\n=============== 示例验证记录 ===============');
        sampleRecords.forEach((record, index) => {
            console.log(`${index + 1}. 条码: ${record.barcode}`);
            console.log(`   工单计划ID: ${record.productionPlanWorkOrderId._id}`);
            console.log(`   工单号: ${record.productionPlanWorkOrderId.workOrderNo || '无'}`);
            console.log(`   销售订单号: ${record.productionPlanWorkOrderId.saleOrderNo || '无'}`);
            console.log(`   客户PO: ${record.productionPlanWorkOrderId.custPO || '无'}`);
            console.log('   ---');
        });
        
    } catch (error) {
        console.error('验证过程中发生错误:', error);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    
    // 解析命令行参数
    const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
    const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 100;
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
使用方法：
  node updateSamplingInspectionWorkOrder.js [选项]

选项：
  --validate                    验证更新结果，显示示例记录
  --batch-size=<数量>          设置批次大小（默认：100）
  --help, -h                   显示此帮助信息

示例：
  node updateSamplingInspectionWorkOrder.js                    # 使用默认批次大小更新
  node updateSamplingInspectionWorkOrder.js --batch-size=50   # 使用批次大小50更新  
  node updateSamplingInspectionWorkOrder.js --validate        # 验证更新结果
        `);
        return;
    }
    
    if (args.includes('--validate')) {
        await validateUpdate();
    } else {
        await updateSamplingInspectionWorkOrder(batchSize);
    }
}

// 运行脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    updateSamplingInspectionWorkOrder,
    validateUpdate
}; 