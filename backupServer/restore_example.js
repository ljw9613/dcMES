#!/usr/bin/env node

/**
 * MongoDB备份还原示例脚本
 * 
 * 此脚本演示如何使用RestoreManager进行各种还原操作
 * 
 * 使用方法：
 * node restore_example.js
 * 
 * @Author: 系统管理员
 * @Date: 2024
 */

const RestoreManager = require('./restore_manager');

async function runExamples() {
  console.log('🔧 MongoDB备份还原示例\n');
  
  try {
    // 创建还原管理器实例
    const restoreManager = new RestoreManager();
    
    console.log('1. 列出所有可用的备份文件:');
    console.log('=' .repeat(50));
    const backupFiles = restoreManager.listBackupFiles();
    
    if (!backupFiles || backupFiles.length === 0) {
      console.log('未找到备份文件，请先运行备份管理器创建一些备份。');
      return;
    }
    
    console.log('\n2. 验证第一个备份文件:');
    console.log('=' .repeat(50));
    const firstFile = backupFiles[0];
    const verification = await restoreManager.verifyBackupFile(firstFile.filePath);
    
    if (verification.valid) {
      console.log('✅ 备份文件验证成功');
      console.log(`   文件大小: ${restoreManager.formatFileSize(verification.size)}`);
    } else {
      console.log('❌ 备份文件验证失败:', verification.error);
    }
    
    console.log('\n3. 演示试运行还原:');
    console.log('=' .repeat(50));
    console.log('执行试运行还原（不会实际修改数据库）...');
    
    const dryRunResult = await restoreManager.restoreBackupFile(firstFile.filePath, { 
      dryRun: true,
      skipSafetyBackup: true 
    });
    
    if (dryRunResult.success) {
      console.log('✅ 试运行还原验证成功');
      console.log('   这意味着备份文件可以成功还原');
    } else {
      console.log('❌ 试运行还原验证失败:', dryRunResult.error);
    }
    
    console.log('\n4. 搜索特定集合的备份:');
    console.log('=' .repeat(50));
    
    // 尝试搜索热点集合
    const hotCollections = ['warehouse_entries', 'material_palletizings', 'material_process_flows', 'inspection_last_data'];
    
    for (const collection of hotCollections) {
      const collectionFiles = backupFiles.filter(file => file.collection === collection);
      if (collectionFiles.length > 0) {
        console.log(`📦 集合 "${collection}" 找到 ${collectionFiles.length} 个备份文件`);
        const latestFile = collectionFiles[0];
        console.log(`   最新备份: ${latestFile.fileName}`);
        console.log(`   备份时间: ${latestFile.backupTime.toLocaleString('zh-CN')}`);
        console.log(`   存储位置: ${latestFile.dateDir}/${latestFile.category}/`);
        console.log(`   备份类型: ${latestFile.backupType}`);
        break;
      }
    }
    
    console.log('\n5. 按日期搜索备份:');
    console.log('=' .repeat(50));
    
    // 获取今天的日期
    const today = new Date().toISOString().split('T')[0];
    console.log(`搜索今天 (${today}) 的备份文件...`);
    
    const todayFiles = backupFiles.filter(file => {
      const fileDate = file.backupTime.toISOString().split('T')[0];
      return fileDate === today;
    });
    
    if (todayFiles.length > 0) {
      console.log(`📅 今天共有 ${todayFiles.length} 个备份文件`);
      
      // 按日期目录和类型分组显示
      const groupedFiles = {};
      todayFiles.forEach(file => {
        const key = `${file.dateDir}/${file.category}`;
        if (!groupedFiles[key]) {
          groupedFiles[key] = [];
        }
        groupedFiles[key].push(file);
      });
      
      Object.keys(groupedFiles).forEach(location => {
        const files = groupedFiles[location];
        console.log(`   📁 ${location} (${files.length}个文件)`);
        files.slice(0, 3).forEach((file, index) => {
          console.log(`      ${index + 1}. ${file.fileName} - ${file.collection} (${file.backupType})`);
        });
        if (files.length > 3) {
          console.log(`      ... 还有${files.length - 3}个文件`);
        }
      });
    } else {
      console.log('📅 今天暂无备份文件');
    }
    
    console.log('\n📋 示例完成！');
    console.log('\n如需执行实际还原操作，请使用以下命令:');
    console.log('  node restore_manager.js --interactive    # 交互式还原');
    console.log('  node restore_manager.js --list           # 列出备份文件');
    console.log('  node restore_manager.js --restore --file=<文件路径>');
    
  } catch (error) {
    console.error('❌ 示例运行出错:', error.message);
    console.error('\n请确保:');
    console.error('1. MongoDB服务正在运行');
    console.error('2. 配置文件config.js中的数据库连接信息正确');
    console.error('3. 已安装MongoDB数据库工具 (mongodump/mongorestore)');
  }
}

// 主函数
async function main() {
  try {
    await runExamples();
  } catch (error) {
    console.error('示例脚本执行失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { runExamples }; 