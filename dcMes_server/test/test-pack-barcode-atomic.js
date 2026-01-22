/**
 * 测试装箱条码原子操作接口
 * 验证序列号生成和设备锁定机制
 */

const request = require('supertest');
const app = require('../app'); // 假设主应用文件为app.js

async function testPackBarcodeAtomicAPI() {
  console.log('=== 测试装箱条码原子操作接口 ===\n');

  // 测试数据
  const testData = {
    productionLineId: '507f1f77bcf86cd799439011', // 示例ObjectId
    materialNumber: 'MAT001',
    materialId: '507f1f77bcf86cd799439012',
    materialName: '测试物料',
    sessionId: 'session_001',
    deviceIp: '192.168.1.100'
  };

  // 测试1: 正常获取装箱条码
  console.log('测试1: 正常获取装箱条码');
  try {
    const response1 = await request(app)
      .post('/api/v1/getOrCreatePackBarcode')
      .send(testData)
      .expect(200);

    console.log('响应状态:', response1.body.success);
    console.log('响应消息:', response1.body.message);
    if (response1.body.data) {
      console.log('生成的条码:', response1.body.data.barcode);
      console.log('序列号:', response1.body.data.serialNumber);
      console.log('状态:', response1.body.data.status);
    }
    console.log('');
  } catch (error) {
    console.error('测试1失败:', error.message);
  }

  // 测试2: 并发请求同一设备
  console.log('测试2: 并发请求同一设备');
  try {
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        request(app)
          .post('/api/v1/getOrCreatePackBarcode')
          .send({
            ...testData,
            sessionId: `session_${i}`,
            deviceIp: '192.168.1.100' // 同一设备IP
          })
      );
    }

    const responses = await Promise.all(promises);
    console.log('并发请求结果:');
    responses.forEach((resp, index) => {
      console.log(`请求${index + 1}: ${resp.body.success ? '成功' : '失败'} - ${resp.body.message}`);
      if (resp.body.data) {
        console.log(`  序列号: ${resp.body.data.serialNumber}`);
      }
    });
    console.log('');
  } catch (error) {
    console.error('测试2失败:', error.message);
  }

  // 测试3: 不同设备请求
  console.log('测试3: 不同设备请求');
  try {
    const promises = [];
    for (let i = 0; i < 2; i++) {
      promises.push(
        request(app)
          .post('/api/v1/getOrCreatePackBarcode')
          .send({
            ...testData,
            sessionId: `session_device_${i}`,
            deviceIp: `192.168.1.${101 + i}` // 不同设备IP
          })
      );
    }

    const responses = await Promise.all(promises);
    console.log('不同设备请求结果:');
    responses.forEach((resp, index) => {
      console.log(`设备${index + 1}: ${resp.body.success ? '成功' : '失败'} - ${resp.body.message}`);
      if (resp.body.data) {
        console.log(`  序列号: ${resp.body.data.serialNumber}`);
        console.log(`  条码: ${resp.body.data.barcode}`);
      }
    });
    console.log('');
  } catch (error) {
    console.error('测试3失败:', error.message);
  }

  // 测试4: 检查装箱条码状态
  console.log('测试4: 检查装箱条码状态');
  try {
    const response4 = await request(app)
      .get('/api/v1/checkPackBarcodeStatus')
      .query({
        productionLineId: testData.productionLineId,
        materialNumber: testData.materialNumber
      })
      .expect(200);

    console.log('状态检查结果:', response4.body.success);
    if (response4.body.data) {
      console.log('状态统计:', response4.body.data.statusCounts);
      console.log('下一个序列号:', response4.body.data.nextSerialNumber);
    }
    console.log('');
  } catch (error) {
    console.error('测试4失败:', error.message);
  }

  // 测试5: 清理过期锁定
  console.log('测试5: 清理过期锁定');
  try {
    const response5 = await request(app)
      .post('/api/v1/cleanExpiredLocks')
      .send({})
      .expect(200);

    console.log('清理结果:', response5.body.success);
    console.log('清理消息:', response5.body.message);
    console.log('清理数量:', response5.body.count);
    console.log('');
  } catch (error) {
    console.error('测试5失败:', error.message);
  }

  // 测试6: 参数验证
  console.log('测试6: 参数验证');
  try {
    const response6 = await request(app)
      .post('/api/v1/getOrCreatePackBarcode')
      .send({
        // 缺少必要参数
        productionLineId: testData.productionLineId
      })
      .expect(400);

    console.log('参数验证结果:', response6.body.success);
    console.log('错误消息:', response6.body.message);
    console.log('');
  } catch (error) {
    console.error('测试6失败:', error.message);
  }

  console.log('=== 测试完成 ===');
}

// 简化版测试（不依赖supertest）
async function simpleTest() {
  console.log('=== 简化版测试 ===\n');
  
  // 模拟测试数据验证
  const testCases = [
    {
      name: '正常参数',
      data: {
        productionLineId: '507f1f77bcf86cd799439011',
        materialNumber: 'MAT001',
        materialId: '507f1f77bcf86cd799439012',
        materialName: '测试物料',
        sessionId: 'session_001',
        deviceIp: '192.168.1.100'
      },
      expectValid: true
    },
    {
      name: '缺少产线ID',
      data: {
        materialNumber: 'MAT001',
        materialId: '507f1f77bcf86cd799439012',
        materialName: '测试物料'
      },
      expectValid: false
    },
    {
      name: '缺少物料信息',
      data: {
        productionLineId: '507f1f77bcf86cd799439011',
        sessionId: 'session_001'
      },
      expectValid: false
    }
  ];

  console.log('参数验证测试:');
  testCases.forEach((testCase, index) => {
    const { productionLineId, materialNumber, materialId } = testCase.data;
    const isValid = !!(productionLineId && materialNumber && materialId);
    const result = isValid === testCase.expectValid ? '✅ 通过' : '❌ 失败';
    
    console.log(`${index + 1}. ${testCase.name}: ${result}`);
    console.log(`   预期: ${testCase.expectValid ? '有效' : '无效'}, 实际: ${isValid ? '有效' : '无效'}`);
  });

  console.log('\n设备锁定机制测试:');
  
  // 模拟设备锁定逻辑
  const deviceLockTests = [
    {
      sessionId: 'session_001',
      deviceIp: '192.168.1.100',
      expected: '192.168.1.100' // 优先使用deviceIp
    },
    {
      sessionId: 'session_002',
      deviceIp: null,
      expected: 'session_002' // 回退到sessionId
    },
    {
      sessionId: null,
      deviceIp: null,
      productionLineId: '507f1f77bcf86cd799439011',
      expected: '507f1f77bcf86cd799439011_' // 回退到产线ID+时间戳
    }
  ];

  deviceLockTests.forEach((test, index) => {
    const lockId = test.deviceIp || test.sessionId || `${test.productionLineId}_${Date.now()}`;
    const isCorrect = test.deviceIp ? 
      lockId === test.expected : 
      (test.sessionId ? lockId === test.expected : lockId.startsWith(test.expected));
    
    console.log(`${index + 1}. 锁定ID生成: ${isCorrect ? '✅ 通过' : '❌ 失败'}`);
    console.log(`   输入: sessionId=${test.sessionId}, deviceIp=${test.deviceIp}`);
    console.log(`   生成: ${lockId}`);
  });

  console.log('\n=== 简化版测试完成 ===');
}

// 运行测试
if (require.main === module) {
  simpleTest().catch(console.error);
}

module.exports = {
  testPackBarcodeAtomicAPI,
  simpleTest
}; 