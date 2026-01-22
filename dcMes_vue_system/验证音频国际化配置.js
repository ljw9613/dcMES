/*
 * @name: 音频国际化配置验证脚本
 * @content: 验证音频国际化配置是否正确
 * @Author: ljw
 * @Email: 1798245303@qq.com
 * @Date: 2025-01-23
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证音频国际化配置...\n');

// 检查音频国际化工具文件
console.log('📁 检查音频国际化工具文件:');
const audioI18nFile = 'src/utils/audioI18n.js';
const audioI18nPath = path.join(__dirname, audioI18nFile);
if (fs.existsSync(audioI18nPath)) {
  console.log(`✅ ${audioI18nFile} - 存在`);
} else {
  console.log(`❌ ${audioI18nFile} - 不存在`);
}

// 检查音频文件目录
console.log('\n📁 检查音频文件目录:');
const tonePath = path.join(__dirname, 'src/assets/tone');
const toneVNPath = path.join(__dirname, 'src/assets/toneVN');

if (fs.existsSync(tonePath)) {
  console.log(`✅ src/assets/tone - 存在`);
  const toneFiles = fs.readdirSync(tonePath).filter(file => file.endsWith('.mp3'));
  console.log(`   📄 中文音频文件数量: ${toneFiles.length}`);
  toneFiles.forEach(file => console.log(`   - ${file}`));
} else {
  console.log(`❌ src/assets/tone - 不存在`);
}

if (fs.existsSync(toneVNPath)) {
  console.log(`✅ src/assets/toneVN - 存在`);
  const toneVNFiles = fs.readdirSync(toneVNPath).filter(file => file.endsWith('.mp3'));
  console.log(`   📄 越南语音频文件数量: ${toneVNFiles.length}`);
  toneVNFiles.forEach(file => console.log(`   - ${file}`));
} else {
  console.log(`❌ src/assets/toneVN - 不存在`);
}

// 检查StatusPopup组件
console.log('\n📁 检查StatusPopup组件:');
const statusPopupFile = 'src/components/StatusPopup/index.vue';
const statusPopupPath = path.join(__dirname, statusPopupFile);
if (fs.existsSync(statusPopupPath)) {
  console.log(`✅ ${statusPopupFile} - 存在`);
} else {
  console.log(`❌ ${statusPopupFile} - 不存在`);
}

// 检查语言资源文件更新
console.log('\n📁 检查语言资源文件:');
const zhCNFile = 'src/lang/zh-CN.js';
const viVNFile = 'src/lang/vi-VN.js';

try {
  const zhCNContent = fs.readFileSync(path.join(__dirname, zhCNFile), 'utf8');
  if (zhCNContent.includes('statusPopup')) {
    console.log(`✅ ${zhCNFile} - 已包含StatusPopup翻译`);
  } else {
    console.log(`❌ ${zhCNFile} - 未包含StatusPopup翻译`);
  }
} catch (error) {
  console.log(`❌ ${zhCNFile} - 读取失败`);
}

try {
  const viVNContent = fs.readFileSync(path.join(__dirname, viVNFile), 'utf8');
  if (viVNContent.includes('statusPopup')) {
    console.log(`✅ ${viVNFile} - 已包含StatusPopup翻译`);
  } else {
    console.log(`❌ ${viVNFile} - 未包含StatusPopup翻译`);
  }
} catch (error) {
  console.log(`❌ ${viVNFile} - 读取失败`);
}

// 检查扫码页面更新
console.log('\n📁 检查扫码页面更新:');
const scanBarCodeFile = 'src/views/scanBarCode/index.vue';
try {
  const scanBarCodeContent = fs.readFileSync(path.join(__dirname, scanBarCodeFile), 'utf8');
  
  if (scanBarCodeContent.includes('playAudio')) {
    console.log(`✅ ${scanBarCodeFile} - 已使用playAudio函数`);
  } else {
    console.log(`❌ ${scanBarCodeFile} - 未使用playAudio函数`);
  }
  
  if (scanBarCodeContent.includes('preloadAudioFiles')) {
    console.log(`✅ ${scanBarCodeFile} - 已包含音频预加载`);
  } else {
    console.log(`❌ ${scanBarCodeFile} - 未包含音频预加载`);
  }
  
  // 检查是否还有旧的tone函数调用
  const toneMatches = scanBarCodeContent.match(/tone\(/g);
  if (toneMatches && toneMatches.length > 0) {
    console.log(`⚠️  ${scanBarCodeFile} - 仍有${toneMatches.length}个tone函数调用未替换`);
  } else {
    console.log(`✅ ${scanBarCodeFile} - 所有tone函数调用已替换`);
  }
  
} catch (error) {
  console.log(`❌ ${scanBarCodeFile} - 读取失败`);
}

console.log('\n🎯 验证完成！');
console.log('\n📋 测试步骤:');
console.log('1. 启动项目: npm run dev');
console.log('2. 切换到中文语言，测试扫码操作，验证中文音频播放');
console.log('3. 切换到越南语语言，测试扫码操作，验证越南语音频播放');
console.log('4. 触发错误操作，验证StatusPopup组件的国际化显示');
console.log('5. 检查浏览器控制台，确认音频预加载日志');

console.log('\n🚀 如果所有检查都通过，音频国际化功能应该可以正常使用！');

// 音频文件映射检查
console.log('\n📋 音频文件映射检查:');
const expectedAudioFiles = [
  'smcg.mp3', 'tmyw.mp3', 'bdcg.mp3', 'cfbd.mp3', 
  'pcwlxz.mp3', 'cxwgd.mp3', 'dwx.mp3', 'wxsb.mp3', 'smztm.mp3'
];

expectedAudioFiles.forEach(file => {
  const zhPath = path.join(__dirname, 'src/assets/tone', file);
  const vnFile = file.replace('.mp3', '_VN.mp3');
  const vnPath = path.join(__dirname, 'src/assets/toneVN', vnFile);
  
  const zhExists = fs.existsSync(zhPath);
  const vnExists = fs.existsSync(vnPath);
  
  console.log(`${file}:`);
  console.log(`  中文: ${zhExists ? '✅' : '❌'} ${zhExists ? '存在' : '不存在'}`);
  console.log(`  越南语: ${vnExists ? '✅' : '⚠️'} ${vnExists ? '存在' : '不存在(将使用中文版本)'}`);
});
