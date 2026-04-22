const express = require("express");
const router = express.Router();

const ApiParamTemplate = require("../model/project/apiParamTemplate");
const ApiTemplateOpLog = require("../model/project/apiTemplateOpLog");
const ThirdPartyApiConfig = require("../model/project/thirdPartyApiConfig");

// ─── 查询模板列表（按接口） ────────────────────────────────────────────────────
router.get("/api/v1/tp-param-template/list", async (req, res) => {
  try {
    const { apiConfigId } = req.query;
    if (!apiConfigId) return res.json({ code: 400, success: false, message: "缺少接口配置ID" });

    const list = await ApiParamTemplate.find({ apiConfigId, deleted: { $ne: true } })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    res.json({ code: 20000, success: true, data: list });
  } catch (err) {
    console.error("[tp-param-template] list error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 模板详情 ──────────────────────────────────────────────────────────────────
router.get("/api/v1/tp-param-template/:id", async (req, res) => {
  try {
    const doc = await ApiParamTemplate.findOne({ _id: req.params.id, deleted: { $ne: true } }).lean();
    if (!doc) return res.json({ code: 404, success: false, message: "模板不存在" });
    res.json({ code: 20000, success: true, data: doc });
  } catch (err) {
    console.error("[tp-param-template] detail error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── Helper：检查接口状态 ──────────────────────────────────────────────────────
async function checkApiStatus(apiConfigId) {
  const api = await ThirdPartyApiConfig.findOne({ _id: apiConfigId, deleted: { $ne: true } });
  if (!api) return { ok: false, message: "接口配置不存在" };
  if (api.status === 3) return { ok: false, message: "作废状态的接口不可操作模板" };
  return { ok: true, api };
}

// ─── 新增模板 ──────────────────────────────────────────────────────────────────
router.post("/api/v1/tp-param-template/add", async (req, res) => {
  try {
    const { apiConfigId, name, paramType, params } = req.body;

    if (!apiConfigId || !name || paramType === undefined) {
      return res.json({ code: 400, success: false, message: "接口配置ID、模板名称、参数类型为必填项" });
    }
    if (name.length > 50) return res.json({ code: 400, success: false, message: "模板名称不能超过50字符" });

    const check = await checkApiStatus(apiConfigId);
    if (!check.ok) return res.json({ code: 400, success: false, message: check.message });

    // 同一接口下名称唯一
    const exists = await ApiParamTemplate.findOne({ apiConfigId, name, deleted: { $ne: true } });
    if (exists) return res.json({ code: 400, success: false, message: "同一接口下模板名称不可重复" });

    // 获取当前最大排序号
    const maxOrder = await ApiParamTemplate.findOne({ apiConfigId, deleted: { $ne: true } })
      .sort({ sortOrder: -1 })
      .lean();
    const sortOrder = maxOrder ? (maxOrder.sortOrder || 0) + 1 : 0;

    const doc = await ApiParamTemplate.create({
      apiConfigId,
      name,
      paramType: parseInt(paramType),
      params: params || [],
      sortOrder,
      createdBy: req.userId || "",
      createdName: req.realName || req.userName || "",
      updatedBy: req.userId || "",
      updatedName: req.realName || req.userName || "",
    });

    await ApiTemplateOpLog.create({
      templateId: doc._id,
      apiConfigId,
      opType: "create",
      opBy: req.userId || "",
      opName: req.realName || req.userName || "",
      opTime: new Date(),
      beforeData: null,
      afterData: { name, paramType, params: params || [] },
    });

    res.json({ code: 20000, success: true, data: doc, message: "新增成功" });
  } catch (err) {
    console.error("[tp-param-template] add error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 编辑模板 ──────────────────────────────────────────────────────────────────
router.put("/api/v1/tp-param-template/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, paramType, params } = req.body;

    const doc = await ApiParamTemplate.findOne({ _id: id, deleted: { $ne: true } }).lean();
    if (!doc) return res.json({ code: 404, success: false, message: "模板不存在" });

    const check = await checkApiStatus(doc.apiConfigId);
    if (!check.ok) return res.json({ code: 400, success: false, message: check.message });

    if (name && name.length > 50) return res.json({ code: 400, success: false, message: "模板名称不能超过50字符" });

    if (name && name !== doc.name) {
      const exists = await ApiParamTemplate.findOne({
        apiConfigId: doc.apiConfigId,
        name,
        _id: { $ne: id },
        deleted: { $ne: true },
      });
      if (exists) return res.json({ code: 400, success: false, message: "同一接口下模板名称不可重复" });
    }

    const beforeData = { name: doc.name, paramType: doc.paramType, params: doc.params };

    await ApiParamTemplate.updateOne(
      { _id: id },
      {
        $set: {
          ...(name !== undefined && { name }),
          ...(paramType !== undefined && { paramType: parseInt(paramType) }),
          ...(params !== undefined && { params }),
          updatedBy: req.userId || "",
          updatedName: req.realName || req.userName || "",
        },
      }
    );

    await ApiTemplateOpLog.create({
      templateId: id,
      apiConfigId: doc.apiConfigId,
      opType: "edit",
      opBy: req.userId || "",
      opName: req.realName || req.userName || "",
      opTime: new Date(),
      beforeData,
      afterData: {
        name: name !== undefined ? name : doc.name,
        paramType: paramType !== undefined ? parseInt(paramType) : doc.paramType,
        params: params !== undefined ? params : doc.params,
      },
    });

    res.json({ code: 20000, success: true, message: "编辑成功" });
  } catch (err) {
    console.error("[tp-param-template] update error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 删除模板（单条） ──────────────────────────────────────────────────────────
router.delete("/api/v1/tp-param-template/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await ApiParamTemplate.findOne({ _id: id, deleted: { $ne: true } }).lean();
    if (!doc) return res.json({ code: 404, success: false, message: "模板不存在" });

    await ApiParamTemplate.delete({ _id: id });

    await ApiTemplateOpLog.create({
      templateId: id,
      apiConfigId: doc.apiConfigId,
      opType: "delete",
      opBy: req.userId || "",
      opName: req.realName || req.userName || "",
      opTime: new Date(),
      beforeData: { name: doc.name, paramType: doc.paramType, params: doc.params },
      afterData: null,
    });

    res.json({ code: 20000, success: true, message: "删除成功" });
  } catch (err) {
    console.error("[tp-param-template] delete error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 批量删除模板 ──────────────────────────────────────────────────────────────
router.post("/api/v1/tp-param-template/batch-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json({ code: 400, success: false, message: "请选择要删除的模板" });
    }

    const docs = await ApiParamTemplate.find({ _id: { $in: ids }, deleted: { $ne: true } }).lean();
    await ApiParamTemplate.delete({ _id: { $in: ids } });

    const opLogs = docs.map((doc) => ({
      templateId: doc._id,
      apiConfigId: doc.apiConfigId,
      opType: "delete",
      opBy: req.userId || "",
      opName: req.realName || req.userName || "",
      opTime: new Date(),
      beforeData: { name: doc.name, paramType: doc.paramType, params: doc.params },
      afterData: null,
    }));
    if (opLogs.length > 0) await ApiTemplateOpLog.insertMany(opLogs);

    res.json({ code: 20000, success: true, message: `已删除 ${docs.length} 条模板` });
  } catch (err) {
    console.error("[tp-param-template] batch-delete error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 批量更新排序 ──────────────────────────────────────────────────────────────
router.post("/api/v1/tp-param-template/sort", async (req, res) => {
  try {
    const { items } = req.body; // [{id, sortOrder}]
    if (!items || !Array.isArray(items)) {
      return res.json({ code: 400, success: false, message: "参数格式错误" });
    }

    const ops = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { sortOrder: item.sortOrder } },
      },
    }));
    await ApiParamTemplate.bulkWrite(ops);

    res.json({ code: 20000, success: true, message: "排序更新成功" });
  } catch (err) {
    console.error("[tp-param-template] sort error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 查询模板操作记录 ──────────────────────────────────────────────────────────
router.get("/api/v1/tp-param-template/:id/op-logs", async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await ApiTemplateOpLog.find({ templateId: id }).sort({ opTime: -1 }).lean();
    res.json({ code: 20000, success: true, data: logs });
  } catch (err) {
    console.error("[tp-param-template] op-logs error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

module.exports = router;
