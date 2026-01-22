/**
 * 测试文件：演示改进的流程节点更新系统
 * 使用方法：node test_flow_update.js
 */

const MaterialProcessFlowService = require('./dcMes_server/services/materialProcessFlowService');

async function testFlowUpdate() {
  try {
    console.log('=== 测试改进的流程节点更新系统 ===\n');

    // 1. 测试预览更新
    console.log('1. 测试预览更新功能');
    console.log('-------------------');
    
    const testBarcode = 'YOUR_TEST_BARCODE'; // 替换为实际的测试条码
    
    try {
      const preview = await MaterialProcessFlowService.previewFlowNodesUpdate(testBarcode);
      
      console.log(`条码: ${preview.barcode}`);
      console.log(`当前工艺版本: ${preview.currentStatus.craftVersion}`);
      console.log(`新工艺版本: ${preview.newStatus.craftVersion}`);
      console.log(`风险等级: ${preview.analysis.riskLevel}`);
      console.log(`结构变化: ${preview.analysis.structureChanged ? '是' : '否'}`);
      
      console.log('\n差异摘要:');
      console.log(`- 新增节点: ${preview.comparison.summary.added}`);
      console.log(`- 删除节点: ${preview.comparison.summary.removed}`);
      console.log(`- 修改节点: ${preview.comparison.summary.modified}`);
      console.log(`- 未变化节点: ${preview.comparison.summary.unchanged}`);
      
      if (preview.recommendations.length > 0) {
        console.log('\n建议:');
        preview.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. [${rec.type}] ${rec.message}`);
        });
      }
      
    } catch (error) {
      console.log(`预览失败: ${error.message}`);
    }

    console.log('\n');

    // 2. 测试单个条码更新
    console.log('2. 测试单个条码更新');
    console.log('-------------------');
    
    try {
      // 注意：这里只是演示，实际使用时请确保条码存在
      // const result = await MaterialProcessFlowService.updateFlowNodesAdvanced(testBarcode, 'TEST_USER');
      
      console.log('单个条码更新示例代码：');
      console.log(`
        const result = await MaterialProcessFlowService.updateFlowNodesAdvanced('${testBarcode}', 'USER_ID');
        
        console.log('更新结果:', result.statistics);
        console.log('原始节点数:', result.statistics.originalNodeCount);
        console.log('新节点数:', result.statistics.newNodeCount);
        console.log('最终节点数:', result.statistics.finalNodeCount);
        console.log('删除节点数:', result.statistics.deletedNodeCount);
        console.log('新增节点数:', result.statistics.newAddedNodeCount);
      `);
      
    } catch (error) {
      console.log(`单个更新测试失败: ${error.message}`);
    }

    console.log('\n');

    // 3. 测试查找受影响的条码
    console.log('3. 测试查找受工艺变更影响的条码');
    console.log('-----------------------------');
    
    const testMaterialId = 'YOUR_MATERIAL_ID'; // 替换为实际的物料ID
    
    try {
      const affectedBarcodes = await MaterialProcessFlowService.findAffectedBarcodesByCraftChange(
        testMaterialId,
        {
          status: 'IN_PROCESS',
          includeDays: 7,
          maxCount: 10
        }
      );
      
      console.log(`找到 ${affectedBarcodes.length} 个受影响的条码`);
      
      if (affectedBarcodes.length > 0) {
        console.log('\n受影响的条码列表:');
        affectedBarcodes.slice(0, 5).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.barcode} - ${item.materialName} (${item.status}, ${item.progress}%)`);
        });
        
        if (affectedBarcodes.length > 5) {
          console.log(`  ... 还有 ${affectedBarcodes.length - 5} 个条码`);
        }
      }
      
    } catch (error) {
      console.log(`查找受影响条码失败: ${error.message}`);
    }

    console.log('\n');

    // 4. 演示批量更新
    console.log('4. 批量更新示例');
    console.log('---------------');
    
    console.log('批量更新示例代码：');
    console.log(`
      // 假设有一批需要更新的条码
      const barcodes = ['BARCODE1', 'BARCODE2', 'BARCODE3'];
      
      const batchResult = await MaterialProcessFlowService.batchUpdateFlowNodesAdvanced(
        barcodes,
        'USER_ID',
        {
          batchSize: 2,
          continueOnError: true,
          logProgress: true
        }
      );
      
      console.log('批量更新结果:');
      console.log('总数:', batchResult.total);
      console.log('成功:', batchResult.success.length);
      console.log('失败:', batchResult.failed.length);
      console.log('耗时:', batchResult.duration + 'ms');
      
      // 查看失败的条码
      if (batchResult.failed.length > 0) {
        console.log('失败的条码:');
        batchResult.failed.forEach(failure => {
          console.log(\`- \${failure.barcode}: \${failure.error}\`);
        });
      }
    `);

    console.log('\n');

    // 5. 比较功能演示
    console.log('5. 节点比较功能演示');
    console.log('-------------------');
    
    console.log('节点比较示例代码：');
    console.log(`
      // 模拟两个不同的节点数组
      const oldNodes = [
        { nodeType: 'PROCESS_STEP', processStepId: 'STEP1', level: 1, processSort: 1 },
        { nodeType: 'MATERIAL', materialId: 'MAT1', level: 2, requireScan: true }
      ];
      
      const newNodes = [
        { nodeType: 'PROCESS_STEP', processStepId: 'STEP1', level: 1, processSort: 1 },
        { nodeType: 'MATERIAL', materialId: 'MAT1', level: 2, requireScan: false }, // 属性变化
        { nodeType: 'PROCESS_STEP', processStepId: 'STEP2', level: 1, processSort: 2 } // 新增
      ];
      
      const comparison = MaterialProcessFlowService.compareProcessNodes(oldNodes, newNodes);
      
      console.log('比较结果:');
      console.log('新增:', comparison.summary.added);
      console.log('删除:', comparison.summary.removed);
      console.log('修改:', comparison.summary.modified);
      console.log('未变化:', comparison.summary.unchanged);
    `);

    console.log('\n=== 测试完成 ===');
    
    // 6. 显示使用建议
    console.log('\n使用建议:');
    console.log('--------');
    console.log('1. 在工艺变更后，先使用 previewFlowNodesUpdate 预览影响');
    console.log('2. 对于低风险的更新，可以直接使用 updateFlowNodesAdvanced');
    console.log('3. 对于批量更新，使用 batchUpdateFlowNodesAdvanced 并设置合适的批次大小');
    console.log('4. 高风险的更新建议人工确认后再执行');
    console.log('5. 定期使用 findAffectedBarcodesByCraftChange 检查需要更新的条码');

  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testFlowUpdate().catch(console.error);
}

module.exports = { testFlowUpdate }; 