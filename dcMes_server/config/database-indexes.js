/**
 * 数据库索引配置
 * 用于提高查询性能，特别是防止重复操作的查询
 */

const mongoose = require('mongoose');

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
 * 创建工单数量日志表索引
 */
async function createWorkOrderQuantityLogIndexes() {
  try {
    const collection = mongoose.connection.db.collection('work_order_quantity_logs');
    
    console.log('📋 开始创建工单数量日志表索引...');
    
    // 复合索引：工单ID + 条码 + 变更类型 + 操作时间
    // 用于快速检查重复产出操作
    await collection.createIndex(
      {
        workOrderId: 1,
        relatedBarcode: 1,
        changeType: 1,
        operateTime: -1  // 按时间倒序，最新的在前面
      },
      {
        name: 'workorder_barcode_type_time_idx',
        background: true,
        comment: '用于防止重复产出统计的查询优化'
      }
    );
    console.log('✅ 创建工单+条码+类型+时间复合索引');

    // 索引：操作唯一标识（防止完全重复的操作）
    await collection.createIndex(
      {
        operationKey: 1
      },
      {
        name: 'operation_key_unique_idx',
        unique: true,
        background: true,
        sparse: true, // 稀疏索引，允许缺少该字段的文档
        comment: '防止完全重复操作的唯一性索引'
      }
    );
    console.log('✅ 创建操作唯一标识索引');

    // 索引：工单ID + 变更类型（用于统计查询）
    await collection.createIndex(
      {
        workOrderId: 1,
        changeType: 1,
        operateTime: -1
      },
      {
        name: 'workorder_type_time_idx',
        background: true,
        comment: '用于工单统计查询优化'
      }
    );
    console.log('✅ 创建工单+类型+时间索引');

    console.log('✅ 工单数量日志表索引创建完成');
  } catch (error) {
    console.error('❌ 创建工单数量日志表索引失败:', error);
  }
}

/**
 * 创建生产流程记录表索引
 */
async function createMaterialProcessFlowIndexes() {
  try {
    const collection = mongoose.connection.db.collection('materialprocessflows');
    
    console.log('📋 开始创建生产流程记录表索引...');
    
    // 索引：主条码 + 更新时间（用于查找最新的流程记录）
    await collection.createIndex(
      {
        mainBarcode: 1,
        updateTime: -1
      },
      {
        name: 'main_barcode_update_time_idx',
        background: true,
        comment: '用于快速查找条码的最新流程记录'
      }
    );
    console.log('✅ 创建主条码+更新时间索引');

    console.log('✅ 生产流程记录表索引创建完成');
  } catch (error) {
    console.error('❌ 创建生产流程记录表索引失败:', error);
  }
}

/**
 * 初始化所有索引
 */
async function initializeIndexes() {
  try {
    console.log('🚀 开始创建数据库索引...\n');
    
    // 连接数据库
    await connectDatabase();
    
    await createWorkOrderQuantityLogIndexes();
    await createMaterialProcessFlowIndexes();
    
    console.log('\n✅ 所有数据库索引创建完成');
  } catch (error) {
    console.error('❌ 初始化数据库索引失败:', error);
  } finally {
    // 关闭数据库连接
    await closeDatabase();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeIndexes()
    .then(() => {
      console.log('\n🎉 索引初始化完成，可以开始使用优化后的查询性能');
      process.exit(0);
    })
    .catch(error => {
      console.error('索引初始化失败:', error);
      process.exit(1);
    });
}

module.exports = {
  connectDatabase,
  closeDatabase,
  initializeIndexes,
  createWorkOrderQuantityLogIndexes,
  createMaterialProcessFlowIndexes
}; 