/**
 * 一次性批处理脚本：
 * - 对历史流程记录执行：可达性判定 + 孤立完成节点清理 + 进度修复
 * - 支持 dry-run、时间范围、批大小和并行度配置
 *
 * 用法示例：
 * node scripts/cleanupProcessFlows.js --days=30 --batchSize=200 --concurrency=5 --dryRun=false
 */

const mongoose = require('mongoose');
const path = require('path');

// 模型与服务
const MaterialProcessFlow = require('../model/project/materialProcessFlow');
const MaterialProcessFlowService = require('../services/materialProcessFlowService');

// 数据库连接配置（与 scripts/duplicate-detection.js 保持一致）
const mongodbUrl = "mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes";

// node dcMes_server/scripts/cleanupProcessFlows.js --days=30 --batchSize=200 --concurrency=5 --dryRun=false

const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 120000,
  connectTimeoutMS: 30000,
  maxPoolSize: 50,
  minPoolSize: 10,
  maxConnecting: 20,
  retryWrites: true,
  family: 4,
  maxIdleTimeMS: 60000,
  heartbeatFrequencyMS: 10000,
  waitQueueTimeoutMS: 10000,
  writeConcern: { w: 1 },
  readPreference: 'primary'
};

// 简单的参数解析
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    days: null,         // 仅处理最近 N 天数据
    batchSize: 200,     // 每批读取数量
    concurrency: 5,     // 并发保存/修复数量
    limit: null,        // 总处理上限
    dryRun: false       // 仅预览，不写库
  };

  for (const arg of args) {
    const [k, v] = arg.replace(/^--/, '').split('=');
    switch (k) {
      case 'days':
        config.days = v ? Number(v) : null;
        break;
      case 'batchSize':
        config.batchSize = v ? Number(v) : config.batchSize;
        break;
      case 'concurrency':
        config.concurrency = v ? Number(v) : config.concurrency;
        break;
      case 'limit':
        config.limit = v ? Number(v) : null;
        break;
      case 'dryRun':
        config.dryRun = v === 'true' || v === '1';
        break;
      default:
        break;
    }
  }
  return config;
}

async function connectDatabase() {
  try {
    console.log('🔌 正在连接数据库...');
    await mongoose.connect(mongodbUrl, connectOptions);
    console.log('✅ 数据库连接成功\n');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

async function closeDatabase() {
  try {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接失败:', error.message);
  }
}

function buildQuery(config) {
  const query = {};
  if (config.days && Number.isFinite(config.days)) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - config.days);
    query.createdAt = { $gte: startDate };
  }
  return query;
}

async function processBatch(records, config, stats) {
  // 控制并发
  const pool = [];
  for (const flow of records) {
    const task = (async () => {
      try {
        const beforeCount = flow.processNodes.length;

        // 1) 可达性 + 孤立完成节点清理
        const cleanResult = MaterialProcessFlowService.cleanOrphanCompletedNodes(flow.processNodes);
        const cleaned = cleanResult.cleanedCount || 0;
        const afterNodes = cleanResult.processNodes || flow.processNodes;

        // 2) 是否写入清理结果
        let saved = false;
        if (!config.dryRun && cleaned > 0) {
          flow.processNodes = afterNodes;
          await flow.save();
          saved = true;
        }

        // 3) 进度修复
        let fixed = false;
        if (!config.dryRun) {
          await MaterialProcessFlowService.fixFlowProgress(flow.barcode);
          fixed = true;
        }

        // 统计
        stats.total += 1;
        stats.cleanedNodes += cleaned;
        if (cleaned > 0) stats.flowsWithCleanup += 1;
        if (saved) stats.saved += 1;
        if (fixed) stats.fixed += 1;

        // 日志
        console.log(`✔ 处理条码: ${flow.barcode} | 清理: ${cleaned} 个节点 | ${config.dryRun ? 'DRY-RUN' : '已修复进度'}`);
      } catch (err) {
        stats.errors += 1;
        stats.errorDetails.push({ id: flow._id?.toString?.(), barcode: flow.barcode, error: err.message });
        console.error(`✖ 处理失败: ${flow.barcode} - ${err.message}`);
      }
    })();

    pool.push(task);
    if (pool.length >= config.concurrency) {
      await Promise.all(pool.splice(0, pool.length));
    }
  }

  if (pool.length) {
    await Promise.all(pool);
  }
}

async function runCleanup(config) {
  const stats = {
    total: 0,
    saved: 0,
    fixed: 0,
    cleanedNodes: 0,
    flowsWithCleanup: 0,
    errors: 0,
    errorDetails: []
  };

  console.log('🚀 开始批量清理流程记录');
  console.log(`参数: days=${config.days ?? 'ALL'}, batchSize=${config.batchSize}, concurrency=${config.concurrency}, limit=${config.limit ?? '∞'}, dryRun=${config.dryRun}`);

  const query = buildQuery(config);
  const totalCount = await MaterialProcessFlow.countDocuments(query);
  console.log(`匹配记录数: ${totalCount}`);

  let processed = 0;
  for (let skip = 0; skip < totalCount; skip += config.batchSize) {
    if (config.limit && processed >= config.limit) break;

    const limit = config.limit ? Math.min(config.batchSize, config.limit - processed) : config.batchSize;
    const records = await MaterialProcessFlow.find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    if (records.length === 0) break;

    console.log(`\n📦 处理批次: ${Math.floor(skip / config.batchSize) + 1} | 本批 ${records.length} 条`);
    await processBatch(records, config, stats);
    processed += records.length;
  }

  console.log('\n=== 处理完成 ===');
  console.log(`总处理条目: ${stats.total}`);
  console.log(`执行保存: ${stats.saved} 条`);
  console.log(`执行进度修复: ${stats.fixed} 条`);
  console.log(`共清理孤立完成节点: ${stats.cleanedNodes} 个（涉及 ${stats.flowsWithCleanup} 条流程）`);
  console.log(`失败: ${stats.errors}`);
  if (stats.errorDetails.length > 0) {
    console.log('失败详情(前10条):');
    stats.errorDetails.slice(0, 10).forEach((e, i) => {
      console.log(`  ${i + 1}) ${e.barcode || e.id}: ${e.error}`);
    });
  }

  return stats;
}

async function main() {
  const config = parseArgs();
  const start = Date.now();
  try {
    await connectDatabase();
    const stats = await runCleanup(config);
    console.log(`\n⏱ 总耗时: ${Date.now() - start} ms`);
    if (stats.errors > 0) process.exitCode = 1;
  } catch (error) {
    console.error('脚本执行失败:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

if (require.main === module) {
  main();
}

module.exports = { runCleanup };


