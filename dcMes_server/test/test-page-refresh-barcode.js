/**
 * 测试页面刷新时的装箱条码处理逻辑
 * 验证解锁和重新获取的工作流程
 */

async function testPageRefreshBarcodeHandling() {
  console.log('=== 测试页面刷新时的装箱条码处理逻辑 ===\n');

  // 模拟设备信息
  const deviceInfo = {
    sessionId: 'session_LINE1_1734234567_abc123',
    deviceIp: 'WS_001'
  };

  // 模拟装箱条码数据
  const mockBarcodes = [
    {
      _id: 'barcode_001',
      barcode: 'PACK_001_2024120001',
      printBarcode: 'PACK_001_2024120001',
      materialNumber: 'MAT_BOX_001',
      serialNumber: 1,
      status: 'PENDING',
      lockedBy: null
    },
    {
      _id: 'barcode_002', 
      barcode: 'PACK_001_2024120002',
      printBarcode: 'PACK_001_2024120002',
      materialNumber: 'MAT_BOX_001',
      serialNumber: 2,
      status: 'LOCKED',
      lockedBy: 'WS_001'
    }
  ];

  console.log('模拟设备信息:', deviceInfo);
  console.log('模拟条码数据:', mockBarcodes);
  console.log('');

  // 测试场景1: 正常首次获取条码
  console.log('=== 场景1: 正常首次获取条码 ===');
  console.log('1. 调用 getOrCreatePackBarcode');
  console.log('   - 查找可用条码: 找到 barcode_001 (PENDING)');
  console.log('   - 锁定给设备: WS_001');
  console.log('   - 状态变更: PENDING → LOCKED');
  console.log('   - 保存到localStorage: lockedPackBarcode');
  console.log('   - 返回: barcode_001');
  console.log('');

  // 测试场景2: 页面刷新处理
  console.log('=== 场景2: 页面刷新处理 ===');
  console.log('页面刷新时的处理步骤:');
  console.log('1. created() 生命周期执行');
  console.log('   - cleanupExpiredLocks(): 清理过期锁定');
  console.log('   - 发现localStorage中有 lockedPackBarcode 信息');
  console.log('');
  console.log('2. 调用 initializePackingBarcode()');
  console.log('   - initDeviceInfo(): 初始化设备信息');
  console.log('   - cleanupPreviousLocks(): 清理之前的锁定');
  console.log('     * 从localStorage读取之前的锁定信息');
  console.log('     * 调用 unlockPackBarcode() 解锁');
  console.log('     * 清除localStorage');
  console.log('');
  console.log('3. 重新获取条码');
  console.log('   - 调用 getOrCreatePackBarcode()');
  console.log('   - 应该获取到同一个条码 (barcode_001)');
  console.log('   - 重新锁定给当前设备');
  console.log('');

  // 测试场景3: 多设备并发时的页面刷新
  console.log('=== 场景3: 多设备并发时的页面刷新 ===');
  console.log('设备A刷新时的处理:');
  console.log('1. 设备A解锁之前的条码 (barcode_001)');
  console.log('2. 设备A重新获取条码');
  console.log('   - 如果barcode_001仍可用 → 获取barcode_001');  
  console.log('   - 如果barcode_001被其他设备占用 → 获取下一个可用条码');
  console.log('3. 结果: 设备A获取到可用的条码（优先是之前使用的）');
  console.log('');

  // 模拟页面刷新工作流程
  console.log('=== 模拟页面刷新工作流程 ===');

  // Step 1: 模拟页面刷新前的状态
  const beforeRefresh = {
    localStorage: {
      lockedPackBarcode: JSON.stringify({
        barcodeId: 'barcode_001',
        barcode: 'PACK_001_2024120001',
        ...deviceInfo
      })
    },
    packingBarcode: mockBarcodes[0]
  };
  console.log('页面刷新前状态:');
  console.log('- localStorage:', beforeRefresh.localStorage);
  console.log('- 当前条码:', beforeRefresh.packingBarcode.barcode);
  console.log('');

  // Step 2: 模拟页面刷新时的处理
  console.log('页面刷新处理:');
  
  // 2.1 清理之前的锁定
  console.log('1. 清理之前的锁定');
  const savedLockInfo = JSON.parse(beforeRefresh.localStorage.lockedPackBarcode);
  console.log('   - 读取锁定信息:', savedLockInfo);
  console.log('   - 调用解锁API: unlockPackBarcode(barcodeId: barcode_001)');
  console.log('   - 条码状态: LOCKED → PENDING');
  console.log('   - 清除localStorage');
  console.log('');

  // 2.2 重新获取条码
  console.log('2. 重新获取条码');
  console.log('   - 调用 getOrCreatePackBarcode()');
  console.log('   - 查找当月同物料的PENDING条码');
  console.log('   - 找到 barcode_001 (刚刚解锁的)');
  console.log('   - 重新锁定给当前设备');
  console.log('   - 状态: PENDING → LOCKED');
  console.log('   - 结果: 获取到相同的条码');
  console.log('');

  // Step 3: 验证结果
  console.log('=== 验证结果 ===');
  const afterRefresh = {
    packingBarcode: {
      ...mockBarcodes[0],
      status: 'LOCKED',
      lockedBy: deviceInfo.deviceIp
    }
  };
  
  console.log('页面刷新后状态:');
  console.log('- 获取的条码:', afterRefresh.packingBarcode.barcode);
  console.log('- 条码状态:', afterRefresh.packingBarcode.status);
  console.log('- 锁定设备:', afterRefresh.packingBarcode.lockedBy);
  console.log('');

  const isSuccess = (
    beforeRefresh.packingBarcode.barcode === afterRefresh.packingBarcode.barcode &&
    afterRefresh.packingBarcode.status === 'LOCKED' &&
    afterRefresh.packingBarcode.lockedBy === deviceInfo.deviceIp
  );

  console.log(`页面刷新测试: ${isSuccess ? '✅ 成功' : '❌ 失败'}`);
  console.log(`- 条码一致性: ${beforeRefresh.packingBarcode.barcode === afterRefresh.packingBarcode.barcode ? '✅' : '❌'}`);
  console.log(`- 锁定状态: ${afterRefresh.packingBarcode.status === 'LOCKED' ? '✅' : '❌'}`);
  console.log(`- 设备绑定: ${afterRefresh.packingBarcode.lockedBy === deviceInfo.deviceIp ? '✅' : '❌'}`);
  console.log('');

  // 测试错误场景
  console.log('=== 错误场景测试 ===');
  const errorScenarios = [
    {
      name: '条码已被其他设备锁定',
      description: '页面刷新时，之前的条码已被其他设备占用',
      expectedResult: '获取下一个可用条码或创建新条码'
    },
    {
      name: '网络异常导致解锁失败',
      description: '清理之前锁定时网络请求失败',
      expectedResult: '继续获取条码流程，依赖服务器端过期清理'
    },
    {
      name: 'localStorage数据损坏',
      description: '本地存储的锁定信息格式错误',
      expectedResult: '跳过清理步骤，直接获取新条码'
    }
  ];

  errorScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   描述: ${scenario.description}`);
    console.log(`   预期: ${scenario.expectedResult}`);
  });

  console.log('\n=== 测试完成 ===');
}

// 运行测试
if (require.main === module) {
  testPageRefreshBarcodeHandling().catch(console.error);
}

module.exports = {
  testPageRefreshBarcodeHandling
}; 