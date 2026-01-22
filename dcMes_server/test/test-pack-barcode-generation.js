/**
 * 测试装箱条码生成功能
 * 验证映射替换是否正确工作
 */

const { generateBarcodeFromRule } = require('../utils/generateBarcode');

async function testPackBarcodeGeneration() {
  console.log('=== 测试装箱条码生成功能 ===\n');

  // 测试1: 基础条码生成
  console.log('测试1: 基础条码生成');
  const basicRule = {
    name: '基础测试规则',
    segments: [
      {
        name: '产品前缀',
        type: 'constant',
        config: {
          constantValue: '01',
          prefix: '(',
          suffix: ')',
          showPrefix: true,
          showSuffix: true
        }
      },
      {
        name: '日期',
        type: 'date',
        config: {
          dateFormat: 'YYYYMMDD',
          prefix: '',
          suffix: '',
          showPrefix: true,
          showSuffix: true
        }
      },
      {
        name: '序列号',
        type: 'sequence',
        config: {
          length: 4,
          padChar: '0',
          prefix: '',
          suffix: '',
          showPrefix: true,
          showSuffix: true
        }
      }
    ]
  };

  const basicData = {
    serialNumber: 123,
    lineNum: 'L01'
  };

  try {
    const result1 = await generateBarcodeFromRule(basicRule, basicData);
    console.log('生成结果:', result1.barcode);
    console.log('打印条码:', result1.printBarcode);
    console.log('');
  } catch (error) {
    console.error('测试1失败:', error.message);
  }

  // 测试2: 带映射的复杂规则
  console.log('测试2: 带映射的复杂规则');
  const mappingRule = {
    name: '映射测试规则',
    segments: [
      {
        name: '年份映射',
        type: 'date',
        config: {
          dateFormat: 'YYYY',
          yearMappings: [
            { value: '2024', code: 'X' },
            { value: '2025', code: 'Y' }
          ],
          prefix: '',
          suffix: '',
          showPrefix: true,
          showSuffix: true
        }
      },
      {
        name: '产线映射',
        type: 'fieldMapping',
        config: {
          mappingField: 'lineNum',
          fieldMappings: [
            { value: 'L01', code: 'A' },
            { value: 'L02', code: 'B' },
            { value: 'L03', code: 'C' }
          ],
          prefix: '',
          suffix: '',
          showPrefix: true,
          showSuffix: true
        }
      },
      {
        name: '序列号位置映射',
        type: 'sequence',
        config: {
          length: 6,
          padChar: '0',
          numberMappings: [
            { position: 1, value: '0', code: 'Z' },
            { position: 2, value: '0', code: 'Y' },
            { position: 6, value: '1', code: 'X' }
          ],
          prefix: '',
          suffix: '',
          showPrefix: true,
          showSuffix: true
        }
      }
    ]
  };

  const mappingData = {
    serialNumber: 1,
    lineNum: 'L02'
  };

  try {
    const result2 = await generateBarcodeFromRule(mappingRule, mappingData);
    console.log('生成结果:', result2.barcode);
    console.log('段落明细:');
    result2.segmentBreakdown.forEach(segment => {
      console.log(`  ${segment.name}: ${segment.value}`);
    });
    console.log('');
  } catch (error) {
    console.error('测试2失败:', error.message);
  }

  // 测试3: 带转换的规则
  console.log('测试3: 带转换的规则');
  const transformRule = {
    name: '转换测试规则',
    segments: [
      {
        name: '常量转换',
        type: 'constant',
        config: {
          constantValue: '01',
          enableTransform: true,
          transformValue: 'PREFIX',
          prefix: '(',
          suffix: ')',
          showPrefix: true,
          showSuffix: true
        }
      },
      {
        name: '月份映射',
        type: 'date',
        config: {
          dateFormat: 'MM',
          monthMappings: [
            { value: '01', code: 'A' },
            { value: '02', code: 'B' },
            { value: '12', code: 'L' }
          ],
          prefix: '[',
          suffix: ']',
          showPrefix: true,
          showSuffix: false  // 后缀不显示在打印条码中
        }
      },
      {
        name: '序列号',
        type: 'sequence',
        config: {
          length: 3,
          padChar: '0',
          prefix: '',
          suffix: '',
          showPrefix: true,
          showSuffix: true
        }
      }
    ]
  };

  const transformData = {
    serialNumber: 42,
    lineNum: 'L01'
  };

  try {
    const result3 = await generateBarcodeFromRule(transformRule, transformData);
    console.log('基础条码:', result3.barcode);
    console.log('基础打印条码:', result3.printBarcode);
    console.log('转换条码:', result3.transformedBarcode);
    console.log('转换打印条码:', result3.transformedPrintBarcode);
    console.log('');
  } catch (error) {
    console.error('测试3失败:', error.message);
  }

  console.log('=== 测试完成 ===');
}

// 运行测试
testPackBarcodeGeneration().catch(console.error); 