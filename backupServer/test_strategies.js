#!/usr/bin/env node

/**
 * 策略配置测试脚本
 */

console.log('测试策略配置...');

try {
  const config = require('./config');
  
  console.log('配置对象类型:', typeof config);
  console.log('strategies类型:', typeof config.strategies);
  console.log('strategies是否存在:', config.strategies !== undefined);
  
  if (config.strategies) {
    console.log('strategies内容:');
    console.log(JSON.stringify(config.strategies, null, 2));
    
    console.log('\n遍历strategies:');
    for (const [name, strategy] of Object.entries(config.strategies)) {
      console.log(`策略名称: ${name}`);
      console.log(`策略对象:`, strategy);
      console.log(`策略配置:`);
      console.log(`  调度: ${strategy.schedule}`);
      console.log(`  集合数量: ${strategy.collections ? strategy.collections.length : 'undefined'}`);
      console.log(`  时间字段: ${strategy.timeField}`);
      const retention = strategy.retentionHours 
        ? `${strategy.retentionHours}小时` 
        : `${strategy.retentionDays}天`;
      console.log(`  保留期: ${retention}`);
      console.log('---');
    }
  } else {
    console.log('strategies 配置缺失');
  }
  
} catch (error) {
  console.error('错误:', error.message);
  console.error('堆栈:', error.stack);
} 