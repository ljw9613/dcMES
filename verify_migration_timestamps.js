#!/usr/bin/env node

/**
 * MongoDB迁移时间戳验证脚本
 * 
 * 用于验证迁移后的数据时间戳是否与源数据库一致
 * 
 * 使用方法：
 * node verify_migration_timestamps.js --source "mongodb://user:pass@source:27017/db" --target "mongodb://user:pass@target:27017/db" --collection "collectionName"
 * 
 * @Author: 系统管理员
 * @Date: 2026-01-27
 */

const mongoose = require('mongoose');
const readline = require('readline');

class TimestampVerifier {
  constructor() {
    this.args = this.parseArgs();
    this.sourceUri = this.args.source || process.env.SOURCE_MONGODB_URI;
    this.targetUri = this.args.target || process.env.TARGET_MONGODB_URI;
    this.collection = this.args.collection || process.env.COLLECTION_NAME;
    this.sampleSize = this.args.sampleSize || 10;
    
    if (!this.sourceUri || !this.targetUri) {
      console.error('❌ 错误: 必须提供源和目标数据库连接字符串');
      console.error('   使用 --source 和 --target 参数，或设置环境变量');
      process.exit(1);
    }
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  parseArgs() {
    const args = {};
    const argv = process.argv.slice(2);
    
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === '--source' && argv[i + 1]) {
        args.source = argv[++i];
      } else if (arg === '--target' && argv[i + 1]) {
        args.target = argv[++i];
      } else if (arg === '--collection' && argv[i + 1]) {
        args.collection = argv[++i];
      } else if (arg === '--sample-size' && argv[i + 1]) {
        args.sampleSize = parseInt(argv[++i]);
      } else if (arg === '--help' || arg === '-h') {
        this.printHelp();
        process.exit(0);
      }
    }
    
    return args;
  }

  printHelp() {
    console.log(`
MongoDB迁移时间戳验证脚本

使用方法:
  node verify_migration_timestamps.js [选项]

选项:
  --source <uri>          源数据库连接字符串
  --target <uri>          目标数据库连接字符串
  --collection <name>     要验证的集合名称（可选，默认验证所有集合）
  --sample-size <number>  每个集合的采样数量（默认: 10）
  --help, -h              显示此帮助信息

环境变量:
  SOURCE_MONGODB_URI      源数据库连接字符串
  TARGET_MONGODB_URI      目标数据库连接字符串
  COLLECTION_NAME         要验证的集合名称

示例:
  node verify_migration_timestamps.js \\
    --source "mongodb://user:pass@source:27017/db" \\
    --target "mongodb://user:pass@target:27017/db" \\
    --collection "materialProcessFlow" \\
    --sample-size 20
    `);
  }

  async connect(uri, label) {
    try {
      console.log(`🔌 正在连接${label}...`);
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000
      });
      console.log(`✅ ${label}连接成功`);
      return mongoose.connection.db;
    } catch (error) {
      console.error(`❌ ${label}连接失败:`, error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('✅ 数据库连接已关闭');
    } catch (error) {
      console.error('❌ 关闭连接失败:', error.message);
    }
  }

  async getCollections(db) {
    const collections = await db.listCollections().toArray();
    return collections.map(c => c.name).filter(name => !name.startsWith('system.'));
  }

  async getSampleDocuments(db, collectionName, sampleSize) {
    const collection = db.collection(collectionName);
    const documents = await collection.find({})
      .limit(sampleSize)
      .toArray();
    return documents;
  }

  extractTimestamps(doc) {
    const timestamps = {
      _id: doc._id,
      objectIdTimestamp: doc._id.getTimestamp ? doc._id.getTimestamp().toISOString() : null
    };

    // 查找常见的时间字段
    const timeFields = ['createTime', 'updateTime', 'createdAt', 'updatedAt', 'createAt', 'updateAt', 'timestamp'];
    timeFields.forEach(field => {
      if (doc[field]) {
        timestamps[field] = doc[field] instanceof Date 
          ? doc[field].toISOString() 
          : doc[field];
      }
    });

    return timestamps;
  }

  compareTimestamps(source, target) {
    const differences = [];
    const allKeys = new Set([...Object.keys(source), ...Object.keys(target)]);

    for (const key of allKeys) {
      if (key === '_id') continue; // _id 对象比较特殊，单独处理

      const sourceValue = source[key];
      const targetValue = target[key];

      if (sourceValue !== targetValue) {
        differences.push({
          field: key,
          source: sourceValue,
          target: targetValue
        });
      }
    }

    // 比较 ObjectId 时间戳
    if (source.objectIdTimestamp && target.objectIdTimestamp) {
      if (source.objectIdTimestamp !== target.objectIdTimestamp) {
        differences.push({
          field: '_id (ObjectId timestamp)',
          source: source.objectIdTimestamp,
          target: target.objectIdTimestamp
        });
      }
    }

    return differences;
  }

  async verifyCollection(sourceDb, targetDb, collectionName) {
    console.log(`\n📋 验证集合: ${collectionName}`);
    console.log('─'.repeat(60));

    try {
      // 获取采样文档
      const sourceDocs = await this.getSampleDocuments(sourceDb, collectionName, this.sampleSize);
      const targetDocs = await this.getSampleDocuments(targetDb, collectionName, this.sampleSize);

      if (sourceDocs.length === 0) {
        console.log(`⚠️  源数据库集合 ${collectionName} 为空`);
        return { collection: collectionName, verified: false, reason: 'empty' };
      }

      if (targetDocs.length === 0) {
        console.log(`❌ 目标数据库集合 ${collectionName} 为空，但源数据库有数据`);
        return { collection: collectionName, verified: false, reason: 'target_empty' };
      }

      if (sourceDocs.length !== targetDocs.length) {
        console.log(`⚠️  文档数量不一致: 源=${sourceDocs.length}, 目标=${targetDocs.length}`);
      }

      // 创建目标文档的 _id 映射
      const targetMap = new Map();
      targetDocs.forEach(doc => {
        targetMap.set(doc._id.toString(), doc);
      });

      let verifiedCount = 0;
      let failedCount = 0;
      const failures = [];

      // 比较每个文档
      for (const sourceDoc of sourceDocs) {
        const sourceId = sourceDoc._id.toString();
        const targetDoc = targetMap.get(sourceId);

        if (!targetDoc) {
          console.log(`  ❌ 文档 ${sourceId} 在目标数据库中不存在`);
          failedCount++;
          failures.push({ id: sourceId, reason: 'not_found' });
          continue;
        }

        const sourceTimestamps = this.extractTimestamps(sourceDoc);
        const targetTimestamps = this.extractTimestamps(targetDoc);
        const differences = this.compareTimestamps(sourceTimestamps, targetTimestamps);

        if (differences.length === 0) {
          verifiedCount++;
        } else {
          failedCount++;
          console.log(`  ❌ 文档 ${sourceId} 时间戳不匹配:`);
          differences.forEach(diff => {
            console.log(`     - ${diff.field}:`);
            console.log(`       源: ${diff.source}`);
            console.log(`       目标: ${diff.target}`);
          });
          failures.push({ id: sourceId, differences });
        }
      }

      const result = {
        collection: collectionName,
        verified: failedCount === 0,
        total: sourceDocs.length,
        verifiedCount,
        failedCount,
        failures
      };

      if (result.verified) {
        console.log(`  ✅ 所有 ${verifiedCount} 个采样文档的时间戳验证通过`);
      } else {
        console.log(`  ⚠️  ${failedCount} 个文档验证失败，${verifiedCount} 个通过`);
      }

      return result;

    } catch (error) {
      console.error(`  ❌ 验证集合 ${collectionName} 时出错:`, error.message);
      return { collection: collectionName, verified: false, error: error.message };
    }
  }

  async verify() {
    let sourceDb, targetDb;
    const results = [];

    try {
      // 连接数据库
      sourceDb = await this.connect(this.sourceUri, '源数据库');
      targetDb = await this.connect(this.targetUri, '目标数据库');

      // 获取集合列表
      let collections;
      if (this.collection) {
        collections = [this.collection];
      } else {
        console.log('\n📚 获取集合列表...');
        const sourceCollections = await this.getCollections(sourceDb);
        const targetCollections = await this.getCollections(targetDb);
        
        // 取交集
        collections = sourceCollections.filter(c => targetCollections.includes(c));
        console.log(`✅ 找到 ${collections.length} 个共同集合`);
      }

      if (collections.length === 0) {
        console.log('⚠️  没有找到要验证的集合');
        return;
      }

      // 验证每个集合
      console.log(`\n🔍 开始验证 ${collections.length} 个集合（每个集合采样 ${this.sampleSize} 个文档）...`);
      console.log('='.repeat(60));

      for (const collection of collections) {
        const result = await this.verifyCollection(sourceDb, targetDb, collection);
        results.push(result);
      }

      // 显示摘要
      console.log('\n' + '='.repeat(60));
      console.log('📊 验证摘要');
      console.log('='.repeat(60));

      const verified = results.filter(r => r.verified).length;
      const failed = results.filter(r => !r.verified).length;
      const totalDocs = results.reduce((sum, r) => sum + (r.total || 0), 0);
      const verifiedDocs = results.reduce((sum, r) => sum + (r.verifiedCount || 0), 0);

      console.log(`✅ 验证通过的集合: ${verified}/${results.length}`);
      console.log(`❌ 验证失败的集合: ${failed}/${results.length}`);
      console.log(`📄 验证的文档总数: ${totalDocs}`);
      console.log(`✅ 时间戳匹配的文档: ${verifiedDocs}/${totalDocs}`);

      if (failed > 0) {
        console.log('\n⚠️  以下集合验证失败:');
        results.filter(r => !r.verified).forEach(r => {
          console.log(`  - ${r.collection}: ${r.reason || r.error || '时间戳不匹配'}`);
        });
      } else {
        console.log('\n🎉 所有集合的时间戳验证通过！');
      }

      console.log('='.repeat(60) + '\n');

    } catch (error) {
      console.error('❌ 验证过程出错:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// 主程序
if (require.main === module) {
  const verifier = new TimestampVerifier();
  verifier.verify().catch(error => {
    console.error('❌ 致命错误:', error);
    process.exit(1);
  });
}

module.exports = TimestampVerifier;
