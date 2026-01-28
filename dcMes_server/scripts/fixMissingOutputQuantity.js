/**
 * 扫描并修复“流程已完成但未写入工单产出量(output)日志”的异常条码
 *
 * 用途：
 * - 找出 material_process_flow 已完成(COMPLETED, progress=100) 的成品条码
 * - 对照 work_order_quantity_logs 中是否存在该条码的 output(+1) 记录
 * - 可选：通过 plan-server（dcMes_server_plan）接口补记产出量并生成日志
 *
 * 运行示例（从 dcMes_server 目录执行）：
 * - 仅扫描（默认）：node scripts/fixMissingOutputQuantity.js --since=2026-01-01
 * - 扫描并修复：      node scripts/fixMissingOutputQuantity.js --since=2026-01-01 --fix
 * - 指定Mongo：       node scripts/fixMissingOutputQuantity.js --mongoUri="mongodb://user:pass@host:27017/dcmes"
 * - 指定plan-server： node scripts/fixMissingOutputQuantity.js --fix --planHost=127.0.0.1 --planPort=2228
 *
 * 注意：
 * - 默认只修复“从未有过 output(+1) 日志”的条码（最安全）
 * - 若要包含“解绑(-1)后又已完工但未重新统计”的情况，传 --includeRework
 */
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// 兼容 mongoose 6/7 的默认行为变更提示，避免脚本输出过多告警
mongoose.set("strictQuery", false);

function parseArgs(argv) {
  const args = {
    fix: false,
    includeRework: false,
    since: null,
    until: null,
    limit: 0,
    batch: 200,
    report: "",
    mongoUri: "",
    planHost: "",
    planPort: "",
  };

  for (const raw of argv) {
    if (raw === "--fix") args.fix = true;
    else if (raw === "--includeRework") args.includeRework = true;
    else if (raw.startsWith("--since=")) args.since = raw.slice("--since=".length);
    else if (raw.startsWith("--until=")) args.until = raw.slice("--until=".length);
    else if (raw.startsWith("--limit=")) args.limit = Number(raw.slice("--limit=".length)) || 0;
    else if (raw.startsWith("--batch=")) args.batch = Number(raw.slice("--batch=".length)) || 200;
    else if (raw.startsWith("--report=")) args.report = raw.slice("--report=".length);
    else if (raw.startsWith("--mongoUri=")) args.mongoUri = raw.slice("--mongoUri=".length);
    else if (raw.startsWith("--planHost=")) args.planHost = raw.slice("--planHost=".length);
    else if (raw.startsWith("--planPort=")) args.planPort = raw.slice("--planPort=".length);
  }

  return args;
}

function buildMongoUri(args) {
  if (args.mongoUri) return args.mongoUri;
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || 27017;
  const database = process.env.DB_NAME || "dcmes";
  const username = process.env.DB_USER || "";
  const password = process.env.DB_PASS || "";

  if (username && password) {
    return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(
      password
    )}@${host}:${port}/${database}`;
  }
  return `mongodb://${host}:${port}/${database}`;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function safeDate(input) {
  if (!input) return null;
  const d = new Date(input);
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(d.getTime())) return null;
  return d;
}

function getLastLevel1ProcessStep(processNodes) {
  if (!Array.isArray(processNodes)) return null;
  const steps = processNodes
    .filter((n) => n && n.nodeType === "PROCESS_STEP" && Number(n.level) === 1)
    .sort((a, b) => Number(a.processSort || 0) - Number(b.processSort || 0));
  return steps.length ? steps[steps.length - 1] : null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.planHost) process.env.PLAN_SERVER_HOST = args.planHost;
  if (args.planPort) process.env.PLAN_SERVER_PORT = String(args.planPort);

  const mongoUri = buildMongoUri(args);
  const sinceDate = safeDate(args.since);
  const untilDate = safeDate(args.until);

  const reportDir = path.resolve(__dirname, "reports");
  ensureDir(reportDir);
  const reportPath =
    args.report ||
    path.join(
      reportDir,
      `missing_output_quantity_${Date.now()}${args.fix ? "_fixed" : ""}.json`
    );

  console.log("========================================");
  console.log("扫描/修复：流程已完成但缺失工单产出量日志");
  console.log("========================================");
  console.log(`Mongo: ${mongoUri.replace(/\/\/.*@/, "//***:***@")}`);
  console.log(
    `范围: ${sinceDate ? sinceDate.toISOString() : "不限"} ~ ${
      untilDate ? untilDate.toISOString() : "不限"
    }`
  );
  console.log(`batch: ${args.batch}, limit: ${args.limit || "不限"}`);
  console.log(
    `模式: ${args.fix ? "修复(--fix)" : "仅扫描"}${
      args.includeRework ? " + 包含解绑后重算(--includeRework)" : ""
    }`
  );
  console.log(`报告: ${reportPath}\n`);

  console.log("正在连接数据库...");
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000,
    });
  } catch (e) {
    console.error("❌ 数据库连接失败。");
    console.error(
      `   - 你可以通过环境变量指定：DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS 或 MONGODB_URI`
    );
    console.error(`   - 或直接传参：--mongoUri="mongodb://user:pass@host:27017/db"`);
    throw e;
  }
  console.log("数据库连接成功\n");

  const MaterialProcessFlow = require("../model/project/materialProcessFlow");
  const WorkOrderQuantityLog = require("../model/project/workOrderQuantityLog");
  const PlanServerClient = require("../services/planServerClient");

  const query = {
    isProduct: true,
    status: "COMPLETED",
    progress: 100,
    productionPlanWorkOrderId: { $ne: null },
  };
  if (sinceDate || untilDate) {
    query.endTime = {};
    if (sinceDate) query.endTime.$gte = sinceDate;
    if (untilDate) query.endTime.$lte = untilDate;
  }

  const projection = {
    barcode: 1,
    productionPlanWorkOrderId: 1,
    productLineId: 1,
    productLineName: 1,
    materialId: 1,
    materialCode: 1,
    materialName: 1,
    endTime: 1,
    processNodes: 1,
  };

  let scanned = 0;
  let foundMissingPositive = 0;
  let foundNeedsRework = 0;
  let fixed = 0;
  let fixFailed = 0;

  const anomalies = [];
  const fixResults = [];

  // 注意：不要按 endTime 排序（无索引时会触发Mongo内存排序32MB限制）
  // 使用 _id 倒序（天然索引）即可满足“最近数据优先”且不会触发内存排序错误
  const cursor = MaterialProcessFlow.find(query, projection)
    .sort({ _id: -1 })
    .lean()
    .cursor({ batchSize: Math.max(50, Math.min(args.batch, 1000)) });

  let batch = [];

  async function processBatch(flows) {
    if (!flows.length) return;

    const workOrderIds = [];
    const barcodes = [];
    for (const f of flows) {
      if (!f || !f.barcode || !f.productionPlanWorkOrderId) continue;
      barcodes.push(f.barcode);
      workOrderIds.push(f.productionPlanWorkOrderId);
    }

    // 拉取本批次相关的 output 日志
    const logs = await WorkOrderQuantityLog.find({
      workOrderId: { $in: workOrderIds },
      relatedBarcode: { $in: barcodes },
      changeType: "output",
    })
      .select("workOrderId relatedBarcode changeQuantity barcodeOperation operateTime")
      .sort({ operateTime: 1 })
      .lean();

    // key: workOrderId|barcode -> { lastPositiveTime, lastNegativeTime }
    const logMap = new Map();
    for (const l of logs) {
      const key = `${String(l.workOrderId)}|${String(l.relatedBarcode)}`;
      const cur = logMap.get(key) || { lastPositiveTime: null, lastNegativeTime: null };
      const t = l.operateTime ? new Date(l.operateTime) : null;
      if (!t) continue;
      if (Number(l.changeQuantity) > 0) cur.lastPositiveTime = t;
      if (
        Number(l.changeQuantity) < 0 &&
        String(l.barcodeOperation || "") === "UNBIND_PROCESS"
      ) {
        cur.lastNegativeTime = t;
      }
      logMap.set(key, cur);
    }

    for (const flow of flows) {
      if (!flow || !flow.barcode || !flow.productionPlanWorkOrderId) continue;

      const key = `${String(flow.productionPlanWorkOrderId)}|${String(flow.barcode)}`;
      const info = logMap.get(key) || { lastPositiveTime: null, lastNegativeTime: null };

      const lastStep = getLastLevel1ProcessStep(flow.processNodes);
      const anomalyBase = {
        barcode: flow.barcode,
        workOrderId: String(flow.productionPlanWorkOrderId),
        materialCode: flow.materialCode,
        materialName: flow.materialName,
        productLineName: flow.productLineName,
        flowEndTime: flow.endTime ? new Date(flow.endTime).toISOString() : "",
        lastOutputPositiveTime: info.lastPositiveTime
          ? info.lastPositiveTime.toISOString()
          : "",
        lastOutputNegativeTime: info.lastNegativeTime
          ? info.lastNegativeTime.toISOString()
          : "",
        lastProcessStep: lastStep
          ? {
              processStepId: lastStep.processStepId ? String(lastStep.processStepId) : "",
              processName: lastStep.processName || "",
              processCode: lastStep.processCode || "",
              processSort: Number(lastStep.processSort || 0),
              endTime: lastStep.endTime ? new Date(lastStep.endTime).toISOString() : "",
            }
          : null,
      };

      // 1) 最安全：从未出现过 output(+1)
      if (!info.lastPositiveTime) {
        foundMissingPositive += 1;
        anomalies.push({ ...anomalyBase, reason: "NO_OUTPUT_POSITIVE_LOG" });

        if (args.fix) {
          const logContext = {
            relatedBarcode: flow.barcode,
            barcodeOperation: "SCAN_PROCESS",
            processStepId: lastStep?.processStepId ? String(lastStep.processStepId) : undefined,
            processName: lastStep?.processName || undefined,
            processCode: lastStep?.processCode || undefined,
            operatorId: "SYSTEM",
            reason: "脚本补记：流程已完成但缺少末道工序产出日志",
            source: "SYSTEM",
            isAutomatic: true,
          };

          try {
            const r = await PlanServerClient.updateWorkOrderQuantity(
              String(flow.productionPlanWorkOrderId),
              "output",
              1,
              logContext
            );

            if (r && r.success === true) {
              fixed += 1;
              fixResults.push({
                barcode: flow.barcode,
                workOrderId: String(flow.productionPlanWorkOrderId),
                success: true,
                jobId: r.jobId,
                queueLength: r.queueLength,
                estimatedDelay: r.estimatedDelay,
              });
            } else {
              fixFailed += 1;
              fixResults.push({
                barcode: flow.barcode,
                workOrderId: String(flow.productionPlanWorkOrderId),
                success: false,
                error: r?.error || r?.message || "UNKNOWN_ERROR",
                code: r?.code,
              });
            }
          } catch (e) {
            fixFailed += 1;
            fixResults.push({
              barcode: flow.barcode,
              workOrderId: String(flow.productionPlanWorkOrderId),
              success: false,
              error: e && e.message ? e.message : String(e),
              code: "EXCEPTION",
            });
          }
        }

        continue;
      }

      // 2) 可选：存在 UNBIND(-1) 且发生在最后一次 output(+1) 之后，但当前流程又是完成态
      if (
        args.includeRework &&
        info.lastNegativeTime &&
        info.lastNegativeTime > info.lastPositiveTime
      ) {
        foundNeedsRework += 1;
        anomalies.push({ ...anomalyBase, reason: "UNBIND_AFTER_OUTPUT_NEEDS_RECOUNT" });

        if (args.fix) {
          const logContext = {
            relatedBarcode: flow.barcode,
            barcodeOperation: "SCAN_PROCESS",
            processStepId: lastStep?.processStepId ? String(lastStep.processStepId) : undefined,
            processName: lastStep?.processName || undefined,
            processCode: lastStep?.processCode || undefined,
            operatorId: "SYSTEM",
            reason: "脚本补记：解绑后已重新完工但缺少末道产出重算",
            source: "SYSTEM",
            isAutomatic: true,
          };

          try {
            const r = await PlanServerClient.updateWorkOrderQuantity(
              String(flow.productionPlanWorkOrderId),
              "output",
              1,
              logContext
            );

            if (r && r.success === true) {
              fixed += 1;
              fixResults.push({
                barcode: flow.barcode,
                workOrderId: String(flow.productionPlanWorkOrderId),
                success: true,
                jobId: r.jobId,
                queueLength: r.queueLength,
                estimatedDelay: r.estimatedDelay,
              });
            } else {
              fixFailed += 1;
              fixResults.push({
                barcode: flow.barcode,
                workOrderId: String(flow.productionPlanWorkOrderId),
                success: false,
                error: r?.error || r?.message || "UNKNOWN_ERROR",
                code: r?.code,
              });
            }
          } catch (e) {
            fixFailed += 1;
            fixResults.push({
              barcode: flow.barcode,
              workOrderId: String(flow.productionPlanWorkOrderId),
              success: false,
              error: e && e.message ? e.message : String(e),
              code: "EXCEPTION",
            });
          }
        }
      }
    }
  }

  try {
    for await (const flow of cursor) {
      scanned += 1;
      batch.push(flow);

      if (args.limit && scanned >= args.limit) break;
      if (batch.length >= args.batch) {
        await processBatch(batch);
        batch = [];

        if (scanned % (args.batch * 5) === 0) {
          console.log(
            `进度：已扫描 ${scanned}，异常 ${anomalies.length}，已修复 ${fixed}，修复失败 ${fixFailed}`
          );
        }
      }
    }

    if (batch.length) {
      await processBatch(batch);
    }

    const report = {
      runAt: new Date().toISOString(),
      args,
      stats: {
        scanned,
        anomalies: anomalies.length,
        missingOutputPositive: foundMissingPositive,
        needsRecountAfterUnbind: foundNeedsRework,
        fixed,
        fixFailed,
      },
      anomalies,
      fixResults,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log("\n========================================");
    console.log("完成");
    console.log("========================================");
    console.log(`扫描条码数: ${scanned}`);
    console.log(`异常条码数: ${anomalies.length}`);
    console.log(`- 无 output(+1) 日志: ${foundMissingPositive}`);
    console.log(`- 解绑后需重算: ${foundNeedsRework}`);
    if (args.fix) {
      console.log(`已修复: ${fixed}`);
      console.log(`修复失败: ${fixFailed}`);
    }
    console.log(`报告已保存: ${reportPath}`);
  } finally {
    await mongoose.connection.close();
  }
}

main().catch((e) => {
  console.error("脚本运行失败:", e);
  process.exitCode = 1;
});

