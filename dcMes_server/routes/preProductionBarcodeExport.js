const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const PreProductionBarcode = require('../model/project/preProductionBarcode');

const BATCH_SIZE = 2000; // 每批查询条数

const STATUS_TEXT_MAP = {
  PENDING: '待使用',
  USED: '已使用',
  VOIDED: '已作废',
  SUSPENDED: '已暂停',
};

function formatDate(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch (e) {
    return '';
  }
}

/**
 * 基于 _id 游标的分批查询，规避 MongoDB 4.0 的内存排序限制
 * - 每批按 _id 升序取 BATCH_SIZE 条（_id 有默认索引，查询极快）
 * - 全部拉取完后在 Node.js 内存中按 serialNumber 排序
 */
async function fetchAllInBatches(baseQuery) {
  const allItems = [];
  let lastId = null;
  let batchIndex = 0;
  const startTime = Date.now();

  // 先查总数，方便打印进度百分比
  const total = await PreProductionBarcode.countDocuments(baseQuery);
  console.log(`[导出] 符合条件的记录总数: ${total} 条，每批 ${BATCH_SIZE} 条，预计 ${Math.ceil(total / BATCH_SIZE)} 批`);

  while (true) {
    const batchQuery = lastId
      ? { ...baseQuery, _id: { $gt: lastId } }
      : { ...baseQuery };

    const batchStart = Date.now();
    const batch = await PreProductionBarcode.find(batchQuery)
      .select('serialNumber barcode workOrderNo materialNumber materialName ruleName batchNo status createAt voidReason voidBy voidAt')
      .sort({ _id: 1 })
      .limit(BATCH_SIZE)
      .lean();

    if (!batch.length) break;

    allItems.push(...batch);
    lastId = batch[batch.length - 1]._id;
    batchIndex++;

    const fetched = allItems.length;
    const percent = total > 0 ? ((fetched / total) * 100).toFixed(1) : '?';
    const batchMs = Date.now() - batchStart;
    console.log(`[导出] 第 ${batchIndex} 批完成 | 本批 ${batch.length} 条 | 累计 ${fetched}/${total} (${percent}%) | 本批耗时 ${batchMs}ms`);

    if (batch.length < BATCH_SIZE) break;
  }

  console.log(`[导出] 全部数据拉取完毕，共 ${allItems.length} 条，耗时 ${Date.now() - startTime}ms，开始排序...`);
  allItems.sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));
  console.log(`[导出] 排序完成`);

  return allItems;
}

/**
 * POST /api/v1/preProductionBarcode/export
 * 后端分批查询 → Node.js 排序 → 生成 Excel → 文件流下载
 * Body: { query: Object }
 */
router.post('/api/v1/preProductionBarcode/export', async (req, res) => {
  try {
    const query = req.body.query || {};

    const exportStart = Date.now();
    console.log(`[导出] ===== 开始导出预生产条码 =====`);
    console.log(`[导出] 查询条件: ${JSON.stringify(query)}`);

    const items = await fetchAllInBatches(query);

    console.log(`[导出] 开始生成 Excel，共 ${items.length} 条数据...`);

    // 表头
    const rows = [[
      '序号', '条码', '工单号', '物料编码', '物料名称',
      '规则名称', '批次号', '状态', '创建时间',
      '作废原因', '作废人', '作废时间',
    ]];

    for (const item of items) {
      rows.push([
        item.serialNumber ?? '',
        item.barcode ?? '',
        item.workOrderNo ?? '',
        item.materialNumber ?? '',
        item.materialName ?? '',
        item.ruleName ?? '',
        item.batchNo ?? '',
        STATUS_TEXT_MAP[item.status] || item.status || '',
        formatDate(item.createAt),
        item.voidReason ?? '',
        item.voidBy ?? '',
        item.voidAt ? formatDate(item.voidAt) : '',
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 8 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 24 },
      { wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 20 },
      { wch: 24 }, { wch: 12 }, { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '预生产条码');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = encodeURIComponent(`预生产条码数据_${Date.now()}.xlsx`);

    console.log(`[导出] Excel 生成完成 | 文件大小: ${(buf.length / 1024).toFixed(1)} KB | 总耗时: ${Date.now() - exportStart}ms`);
    console.log(`[导出] ===== 导出完成 =====`);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (err) {
    console.error('[preProductionBarcode/export] 导出失败:', err);
    res.status(500).json({ code: 'Error', msg: err.message || '导出失败' });
  }
});

module.exports = router;
