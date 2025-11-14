/**
 * 数据库索引创建脚本
 * 用于优化 materialProcessFlowService 的查询性能
 * 
 * 使用方法:
 * 1. 确保 MongoDB 正在运行
 * 2. 修改下方的数据库连接信息
 * 3. 运行: node create_indexes.js
 */

const mongoose = require('mongoose');

// ================== 配置区域 ==================
// 请根据实际情况修改数据库连接信息
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dcmes';
// ==============================================

async function createIndexes() {
  try {
    console.log('🔌 正在连接数据库...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ 数据库连接成功\n');

    const db = mongoose.connection.db;

    // ==================== MaterialProcessFlow 集合 ====================
    console.log('📊 创建 MaterialProcessFlow 集合索引...');
    const flowCollection = db.collection('material_process_flows');
    
    // 1. 条码索引（最常用）
    await flowCollection.createIndex(
      { barcode: 1 },
      { name: 'idx_barcode', background: true }
    );
    console.log('  ✅ barcode 索引创建成功');

    // 2. 物料ID索引
    await flowCollection.createIndex(
      { materialId: 1 },
      { name: 'idx_materialId', background: true }
    );
    console.log('  ✅ materialId 索引创建成功');

    // 3. 状态索引
    await flowCollection.createIndex(
      { status: 1 },
      { name: 'idx_status', background: true }
    );
    console.log('  ✅ status 索引创建成功');

    // 4. 工单ID索引
    await flowCollection.createIndex(
      { productionPlanWorkOrderId: 1 },
      { name: 'idx_workOrderId', background: true }
    );
    console.log('  ✅ productionPlanWorkOrderId 索引创建成功');

    // 5. 条码节点索引（用于批量查询）
    await flowCollection.createIndex(
      { 'processNodes.barcode': 1 },
      { name: 'idx_processNodes_barcode', background: true }
    );
    console.log('  ✅ processNodes.barcode 索引创建成功');

    // 6. 创建时间索引（用于时间范围查询）
    await flowCollection.createIndex(
      { createdAt: -1 },
      { name: 'idx_createdAt', background: true }
    );
    console.log('  ✅ createdAt 索引创建成功');

    // 7. 组合索引：物料+状态（用于查找特定物料的流程）
    await flowCollection.createIndex(
      { materialId: 1, status: 1 },
      { name: 'idx_materialId_status', background: true }
    );
    console.log('  ✅ materialId_status 组合索引创建成功');

    // 8. 组合索引：工单+条码状态（用于工单统计）
    await flowCollection.createIndex(
      { productionPlanWorkOrderId: 1, status: 1 },
      { name: 'idx_workOrderId_status', background: true }
    );
    console.log('  ✅ workOrderId_status 组合索引创建成功');

    // ==================== ProcessStep 集合 ====================
    console.log('\n📊 创建 ProcessStep 集合索引...');
    const processStepCollection = db.collection('process_steps');
    
    // 工艺ID + MES标志 + 排序（buildProcessNodes 优化）
    await processStepCollection.createIndex(
      { craftId: 1, isMES: 1, sort: 1 },
      { name: 'idx_craftId_isMES_sort', background: true }
    );
    console.log('  ✅ craftId_isMES_sort 组合索引创建成功');

    // ==================== ProcessMaterials 集合 ====================
    console.log('\n📊 创建 ProcessMaterials 集合索引...');
    const processMaterialsCollection = db.collection('process_materials');
    
    // 工序ID索引
    await processMaterialsCollection.createIndex(
      { processStepId: 1 },
      { name: 'idx_processStepId', background: true }
    );
    console.log('  ✅ processStepId 索引创建成功');

    // 物料ID索引
    await processMaterialsCollection.createIndex(
      { materialId: 1 },
      { name: 'idx_materialId', background: true }
    );
    console.log('  ✅ materialId 索引创建成功');

    // ==================== Craft 集合 ====================
    console.log('\n📊 创建 Craft 集合索引...');
    const craftCollection = db.collection('crafts');
    
    // 物料ID索引
    await craftCollection.createIndex(
      { materialId: 1 },
      { name: 'idx_materialId', background: true }
    );
    console.log('  ✅ materialId 索引创建成功');

    // ==================== 产品条码规则集合 ====================
    console.log('\n📊 创建 ProductBarcodeRule 集合索引...');
    const productBarcodeRuleCollection = db.collection('product_barcode_rules');
    
    // 产品ID索引
    await productBarcodeRuleCollection.createIndex(
      { productId: 1 },
      { name: 'idx_productId', background: true }
    );
    console.log('  ✅ productId 索引创建成功');

    // ==================== 条码规则集合 ====================
    console.log('\n📊 创建 BarcodeRule 集合索引...');
    const barcodeRuleCollection = db.collection('barcode_rules');
    
    // 全局规则 + 启用状态索引
    await barcodeRuleCollection.createIndex(
      { isGlobal: 1, enabled: 1 },
      { name: 'idx_isGlobal_enabled', background: true }
    );
    console.log('  ✅ isGlobal_enabled 组合索引创建成功');

    // ==================== K3物料集合 ====================
    console.log('\n📊 创建 K3_BD_MATERIAL 集合索引...');
    const k3MaterialCollection = db.collection('k3_bd_materials');
    
    // 物料编号索引
    await k3MaterialCollection.createIndex(
      { FNumber: 1 },
      { name: 'idx_FNumber', background: true }
    );
    console.log('  ✅ FNumber 索引创建成功');

    // ==================== WorkOrderQuantityLog 集合 ====================
    console.log('\n📊 创建 WorkOrderQuantityLog 集合索引...');
    const workOrderLogCollection = db.collection('work_order_quantity_logs');
    
    // 工单ID + 条码 + 类型（用于查询历史记录）
    await workOrderLogCollection.createIndex(
      { workOrderId: 1, relatedBarcode: 1, changeType: 1 },
      { name: 'idx_workOrderId_barcode_type', background: true }
    );
    console.log('  ✅ workOrderId_barcode_type 组合索引创建成功');

    // 操作时间索引（用于排序）
    await workOrderLogCollection.createIndex(
      { operateTime: -1 },
      { name: 'idx_operateTime', background: true }
    );
    console.log('  ✅ operateTime 索引创建成功');

    // ==================== 验证索引创建 ====================
    console.log('\n🔍 验证索引创建结果...\n');
    
    const collections = [
      { name: 'material_process_flows', collection: flowCollection },
      { name: 'process_steps', collection: processStepCollection },
      { name: 'process_materials', collection: processMaterialsCollection },
      { name: 'crafts', collection: craftCollection },
      { name: 'product_barcode_rules', collection: productBarcodeRuleCollection },
      { name: 'barcode_rules', collection: barcodeRuleCollection },
      { name: 'k3_bd_materials', collection: k3MaterialCollection },
      { name: 'work_order_quantity_logs', collection: workOrderLogCollection }
    ];

    for (const { name, collection } of collections) {
      const indexes = await collection.indexes();
      console.log(`📋 ${name} 集合索引 (${indexes.length}个):`);
      indexes.forEach(index => {
        const keys = Object.keys(index.key).join(', ');
        console.log(`   - ${index.name}: { ${keys} }`);
      });
      console.log('');
    }

    console.log('✅ 所有索引创建完成！\n');
    console.log('💡 提示:');
    console.log('   - 索引创建在后台进行，不会阻塞数据库操作');
    console.log('   - 大量数据时索引创建可能需要几分钟');
    console.log('   - 可以通过 db.currentOp() 查看索引创建进度');
    console.log('   - 建议在非高峰期执行索引创建\n');

    // 性能测试建议
    console.log('📊 性能测试建议:');
    console.log('   1. 测试常用查询的执行计划:');
    console.log('      db.material_process_flows.find({ barcode: "xxx" }).explain("executionStats")');
    console.log('   2. 检查索引使用情况:');
    console.log('      db.material_process_flows.aggregate([{ $indexStats: {} }])');
    console.log('   3. 监控慢查询:');
    console.log('      db.setProfilingLevel(1, { slowms: 100 })');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 执行脚本
console.log('====================================');
console.log('  数据库索引创建脚本');
console.log('  版本: v1.0');
console.log('  日期: 2025-10-31');
console.log('====================================\n');

createIndexes();

/**
 * 索引优化说明:
 * 
 * 1. 单字段索引:
 *    - 用于简单的等值查询和排序
 *    - 例如: { barcode: 1 }
 * 
 * 2. 组合索引:
 *    - 用于多条件查询
 *    - 顺序很重要：常用条件放前面
 *    - 例如: { materialId: 1, status: 1 }
 * 
 * 3. 嵌套字段索引:
 *    - 用于查询数组内的字段
 *    - 例如: { 'processNodes.barcode': 1 }
 * 
 * 4. background: true:
 *    - 后台创建索引，不阻塞数据库
 *    - 生产环境必须使用
 * 
 * 索引维护:
 * 
 * 1. 查看索引使用情况:
 *    db.material_process_flows.aggregate([
 *      { $indexStats: {} }
 *    ])
 * 
 * 2. 删除未使用的索引:
 *    db.material_process_flows.dropIndex("index_name")
 * 
 * 3. 重建索引（如果索引损坏）:
 *    db.material_process_flows.reIndex()
 * 
 * 4. 监控索引大小:
 *    db.material_process_flows.stats().indexSizes
 */

