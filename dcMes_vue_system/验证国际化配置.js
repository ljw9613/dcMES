/*
 * @name: 国际化配置验证脚本
 * @content: 验证国际化配置是否正确
 * @Author: ljw
 * @Email: 1798245303@qq.com
 * @Date: 2025-01-23
 */

// 验证语言文件是否存在
const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证国际化配置...\n');

// 检查语言文件
const langFiles = [
  'src/lang/index.js',
  'src/lang/zh-CN.js', 
  'src/lang/vi-VN.js'
];

console.log('📁 检查语言文件:');
langFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - 存在`);
  } else {
    console.log(`❌ ${file} - 不存在`);
  }
});

// 检查Vuex模块
console.log('\n📁 检查Vuex语言模块:');
const vuexFile = 'src/store/modules/language.js';
const vuexPath = path.join(__dirname, vuexFile);
if (fs.existsSync(vuexPath)) {
  console.log(`✅ ${vuexFile} - 存在`);
} else {
  console.log(`❌ ${vuexFile} - 不存在`);
}

// 检查依赖
console.log('\n📦 检查依赖:');
try {
  const packageJson = require('./package.json');
  if (packageJson.dependencies['vue-i18n']) {
    console.log(`✅ vue-i18n - 版本 ${packageJson.dependencies['vue-i18n']}`);
  } else {
    console.log('❌ vue-i18n - 未安装');
  }
  
  if (packageJson.dependencies['js-cookie']) {
    console.log(`✅ js-cookie - 版本 ${packageJson.dependencies['js-cookie']}`);
  } else {
    console.log('❌ js-cookie - 未安装');
  }
} catch (error) {
  console.log('❌ 无法读取package.json');
}

// 验证语言文件内容
console.log('\n🔤 验证语言文件内容:');
try {
  // 检查中文语言包
  const zhCN = require('./src/lang/zh-CN.js');
  if (zhCN.default && zhCN.default.common && zhCN.default.navbar && zhCN.default.scanBarCode) {
    console.log('✅ 中文语言包 - 结构正确');
  } else {
    console.log('❌ 中文语言包 - 结构不完整');
  }
  
  // 检查越南语语言包
  const viVN = require('./src/lang/vi-VN.js');
  if (viVN.default && viVN.default.common && viVN.default.navbar && viVN.default.scanBarCode) {
    console.log('✅ 越南语语言包 - 结构正确');
  } else {
    console.log('❌ 越南语语言包 - 结构不完整');
  }
} catch (error) {
  console.log('❌ 语言文件导入失败:', error.message);
}

console.log('\n🎯 验证完成！');
console.log('\n📋 使用说明:');
console.log('1. 启动项目: npm run dev');
console.log('2. 访问页面，查看导航栏是否有语言切换按钮');
console.log('3. 点击语言切换按钮测试功能');
console.log('4. 刷新页面验证语言设置是否保持');
console.log('\n🚀 如果所有检查都通过，国际化功能应该可以正常使用！');
