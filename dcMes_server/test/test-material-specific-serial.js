/**
 * 测试按物料分组的序列号生成逻辑
 * 验证不同物料的序列号独立计算
 */

async function testMaterialSpecificSerial() {
  console.log('=== 测试按物料分组的序列号生成逻辑 ===\n');

  // 模拟数据库查询结果
  const mockPackBarcodes = [
    // 物料A的条码
    { materialNumber: 'MAT_A_001', serialNumber: 1, status: 'USED' },
    { materialNumber: 'MAT_A_001', serialNumber: 2, status: 'PENDING' },
    { materialNumber: 'MAT_A_001', serialNumber: 3, status: 'LOCKED' },
    
    // 物料B的条码
    { materialNumber: 'MAT_B_002', serialNumber: 1, status: 'USED' },
    { materialNumber: 'MAT_B_002', serialNumber: 2, status: 'USED' },
    
    // 物料C的条码
    { materialNumber: 'MAT_C_003', serialNumber: 1, status: 'PENDING' },
  ];

  // 模拟序列号生成函数
  function getNextSerialNumber(materialNumber, existingBarcodes) {
    const materialBarcodes = existingBarcodes
      .filter(b => b.materialNumber === materialNumber && b.status !== 'VOIDED')
      .sort((a, b) => b.serialNumber - a.serialNumber);
    
    return materialBarcodes.length > 0 ? materialBarcodes[0].serialNumber + 1 : 1;
  }

  // 测试案例
  const testCases = [
    {
      materialNumber: 'MAT_A_001',
      expectedNext: 4,
      description: '物料A下一个序列号（已有1,2,3）'
    },
    {
      materialNumber: 'MAT_B_002', 
      expectedNext: 3,
      description: '物料B下一个序列号（已有1,2）'
    },
    {
      materialNumber: 'MAT_C_003',
      expectedNext: 2,
      description: '物料C下一个序列号（已有1）'
    },
    {
      materialNumber: 'MAT_D_004',
      expectedNext: 1,
      description: '物料D第一个序列号（全新物料）'
    }
  ];

  console.log('序列号生成测试结果:');
  testCases.forEach((testCase, index) => {
    const actualNext = getNextSerialNumber(testCase.materialNumber, mockPackBarcodes);
    const isCorrect = actualNext === testCase.expectedNext;
    const result = isCorrect ? '✅ 通过' : '❌ 失败';
    
    console.log(`${index + 1}. ${testCase.description}: ${result}`);
    console.log(`   物料编号: ${testCase.materialNumber}`);
    console.log(`   预期序列号: ${testCase.expectedNext}, 实际: ${actualNext}`);
    console.log('');
  });

  // 测试唯一性约束逻辑
  console.log('唯一性约束验证:');
  
  function checkSerialConflict(materialNumber, serialNumber, existingBarcodes) {
    return existingBarcodes.some(b => 
      b.materialNumber === materialNumber && 
      b.serialNumber === serialNumber && 
      b.status !== 'VOIDED'
    );
  }

  const conflictTests = [
    {
      materialNumber: 'MAT_A_001',
      serialNumber: 2,
      shouldConflict: true,
      description: '物料A序列号2（已存在）'
    },
    {
      materialNumber: 'MAT_A_001',
      serialNumber: 4,
      shouldConflict: false,
      description: '物料A序列号4（可用）'
    },
    {
      materialNumber: 'MAT_B_002',
      serialNumber: 2,
      shouldConflict: true,
      description: '物料B序列号2（已存在）'
    },
    {
      materialNumber: 'MAT_B_002',
      serialNumber: 3,
      shouldConflict: false,
      description: '物料B序列号3（可用）'
    },
    {
      materialNumber: 'MAT_D_004',
      serialNumber: 1,
      shouldConflict: false,
      description: '物料D序列号1（全新物料）'
    }
  ];

  conflictTests.forEach((test, index) => {
    const hasConflict = checkSerialConflict(test.materialNumber, test.serialNumber, mockPackBarcodes);
    const isCorrect = hasConflict === test.shouldConflict;
    const result = isCorrect ? '✅ 通过' : '❌ 失败';
    
    console.log(`${index + 1}. ${test.description}: ${result}`);
    console.log(`   预期冲突: ${test.shouldConflict}, 实际冲突: ${hasConflict}`);
  });

  console.log('\n=== 并发场景测试 ===');
  
  // 模拟并发请求同一物料
  const concurrentRequests = [
    { deviceIp: '192.168.1.100', materialNumber: 'MAT_A_001' },
    { deviceIp: '192.168.1.101', materialNumber: 'MAT_A_001' },
    { deviceIp: '192.168.1.102', materialNumber: 'MAT_A_001' }
  ];

  console.log('并发请求模拟（同一物料）:');
  concurrentRequests.forEach((request, index) => {
    const nextSerial = getNextSerialNumber(request.materialNumber, mockPackBarcodes);
    console.log(`设备${index + 1} (${request.deviceIp}): 物料${request.materialNumber} -> 序列号${nextSerial}`);
    
    // 在实际场景中，会有原子操作和锁定机制来避免冲突
    console.log(`  -> 需要通过数据库原子操作和锁定机制来确保唯一性`);
  });

  console.log('\n不同物料并发请求:');
  const mixedRequests = [
    { deviceIp: '192.168.1.100', materialNumber: 'MAT_A_001' },
    { deviceIp: '192.168.1.101', materialNumber: 'MAT_B_002' },
    { deviceIp: '192.168.1.102', materialNumber: 'MAT_C_003' }
  ];

  mixedRequests.forEach((request, index) => {
    const nextSerial = getNextSerialNumber(request.materialNumber, mockPackBarcodes);
    console.log(`设备${index + 1} (${request.deviceIp}): 物料${request.materialNumber} -> 序列号${nextSerial}`);
  });

  console.log('\n=== 测试完成 ===');
}

// 运行测试
if (require.main === module) {
  testMaterialSpecificSerial().catch(console.error);
}

module.exports = {
  testMaterialSpecificSerial
}; 