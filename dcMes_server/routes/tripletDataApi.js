const express = require("express");
const router = express.Router();
const TripletData = require("../model/project/tripletData");
const normalizeMac = TripletData.normalizeMac;
const barcodeRule = require("../model/project/barcodeRule");
const TripletBindRuleConfig = require("../model/project/tripletBindRuleConfig");
const {
  validateBarcodeValidationRulesOnly,
} = require("../utils/validateBarcodeRuleFormat");

async function getSingletonBindConfig() {
  let doc = await TripletBindRuleConfig.findOne({
    singletonKey: "triplet_bind",
  }).lean();
  if (!doc) {
    await TripletBindRuleConfig.create({ singletonKey: "triplet_bind" });
    doc = await TripletBindRuleConfig.findOne({
      singletonKey: "triplet_bind",
    }).lean();
  }
  return doc;
}

function sendBizError(res, code, message) {
  res.status(200).json({ code, message, data: null });
}

function sendSuccess(res, data, message) {
  res.status(200).json({ code: "SUCCESS", message, data });
}

/**
 * 追觅对外：POST /api/v1/tripletData（免 JWT，依赖网络隔离）
 */
router.post("/api/v1/tripletData", async (req, res) => {
  try {
    const { sn, type } = req.body || {};
    if (sn === undefined || sn === null || String(sn).trim() === "") {
      return sendBizError(res, "PARAM_ERROR", "参数不能为空：sn");
    }
    if (type === undefined || type === null || String(type).trim() === "") {
      return sendBizError(res, "PARAM_ERROR", "参数不能为空：type");
    }
    const typeStr = String(type).trim();
    if (typeStr !== "1" && typeStr !== "2") {
      return sendBizError(res, "PARAM_ERROR", "参数不能为空：type");
    }

    const snTrim = String(sn).trim();

    if (typeStr === "2") {
      const doc = await TripletData.findOne({
        sn: snTrim,
        status: "bound",
      }).lean();
      if (!doc) {
        return sendBizError(res, "NOT_FOUND", "SN 未绑定或不存在");
      }
      return sendSuccess(
        res,
        {
          sn: doc.sn,
          did: doc.did,
          key: doc.key,
          mac: doc.mac,
          timeArea: doc.timeArea,
          language: doc.language,
          status: doc.status,
        },
        "查询成功"
      );
    }

    // type === "1" 绑定：可选按「三元组绑定规则配置」校验 SN（仅 validationRules，不做提取与物料比对）
    const bindCfg = await getSingletonBindConfig();
    if (
      bindCfg &&
      bindCfg.snValidationEnabled &&
      bindCfg.barcodeRuleId
    ) {
      const rule = await barcodeRule.findById(bindCfg.barcodeRuleId).lean();
      if (!rule || !rule.enabled) {
        return sendBizError(
          res,
          "PARAM_ERROR",
          "绑定的校验规则不存在或已禁用"
        );
      }
      const vr = validateBarcodeValidationRulesOnly(snTrim, rule);
      if (!vr.isValid) {
        return sendBizError(
          res,
          "PARAM_ERROR",
          vr.message || "SN不符合绑定校验规则"
        );
      }
    }

    // type === "1" 绑定
    const existingSn = await TripletData.findOne({ sn: snTrim }).lean();
    if (existingSn) {
      return sendBizError(res, "DUPLICATE_SN", "SN 已存在");
    }

    const updated = await TripletData.findOneAndUpdate(
      { status: "unbound" },
      { $set: { sn: snTrim, status: "bound" } },
      { sort: { createdAt: 1 }, new: true }
    ).lean();

    if (!updated) {
      return sendBizError(
        res,
        "NO_AVAILABLE_TRIPLET",
        "暂无可用三元组，请先导入"
      );
    }

    return sendSuccess(
      res,
      {
        sn: updated.sn,
        did: updated.did,
        key: updated.key,
        mac: updated.mac,
        timeArea: updated.timeArea,
        language: updated.language,
        status: updated.status,
      },
      "绑定成功"
    );
  } catch (e) {
    console.error("[tripletData] POST /api/v1/tripletData", e);
    return sendBizError(res, "SYSTEM_ERROR", "系统内部错误");
  }
});

/** 当前绑定 SN 校验规则配置（需登录） */
router.get("/api/v1/triplet_bind_rule_config/current", async (req, res) => {
  try {
    await getSingletonBindConfig();
    const doc = await TripletBindRuleConfig.findOne({
      singletonKey: "triplet_bind",
    })
      .populate("barcodeRuleId", "name description enabled priority")
      .lean();
    const br = doc.barcodeRuleId;
    const ruleObj =
      br && typeof br === "object" && br._id
        ? {
            _id: String(br._id),
            name: br.name,
            description: br.description,
            enabled: br.enabled,
            priority: br.priority,
          }
        : null;
    res.json({
      code: 200,
      data: {
        snValidationEnabled: !!doc.snValidationEnabled,
        barcodeRuleId:
          doc.barcodeRuleId && doc.barcodeRuleId._id
            ? String(doc.barcodeRuleId._id)
            : doc.barcodeRuleId
            ? String(doc.barcodeRuleId)
            : null,
        barcodeRule: ruleObj,
      },
    });
  } catch (e) {
    console.error("[triplet_bind_rule_config] GET", e);
    res.status(500).json({ code: 500, message: e.message || "系统错误" });
  }
});

router.put("/api/v1/triplet_bind_rule_config/current", async (req, res) => {
  try {
    const { barcodeRuleId, snValidationEnabled } = req.body || {};
    const $set = {};
    if (snValidationEnabled !== undefined) {
      $set.snValidationEnabled = !!snValidationEnabled;
    }
    if (barcodeRuleId !== undefined) {
      if (barcodeRuleId === null || barcodeRuleId === "") {
        $set.barcodeRuleId = null;
      } else {
        const exists = await barcodeRule.findById(barcodeRuleId).lean();
        if (!exists) {
          return res.json({
            code: 200,
            success: false,
            message: "条码规则不存在",
          });
        }
        $set.barcodeRuleId = exists._id;
      }
    }
    if (Object.keys($set).length === 0) {
      return res.json({ code: 200, success: true, message: "无变更" });
    }
    await TripletBindRuleConfig.findOneAndUpdate(
      { singletonKey: "triplet_bind" },
      { $set: $set, $setOnInsert: { singletonKey: "triplet_bind" } },
      { upsert: true, new: true }
    );
    res.json({ code: 200, success: true, message: "保存成功" });
  } catch (e) {
    console.error("[triplet_bind_rule_config] PUT", e);
    res.status(500).json({ code: 500, message: e.message || "系统错误" });
  }
});

/**
 * 管理端批量导入（需登录）
 * body: { rows: [{ did, key, mac, timeArea, language }] }
 */
router.post("/api/v1/triplet_data/import", async (req, res) => {
  try {
    let rows = req.body && req.body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.json({
        code: 200,
        success: false,
        inserted: 0,
        errors: [{ line: 0, code: "PARAM_ERROR", message: "rows 必须为非空数组" }],
        message: "参数错误",
      });
    }

    const errors = [];
    const normalizedRows = [];
    const seenDid = new Set();
    const seenKey = new Set();
    const seenMac = new Set();

    rows.forEach((row, idx) => {
      const line = idx + 1;
      const did = row && row.did != null ? String(row.did).trim() : "";
      const key = row && row.key != null ? String(row.key).trim() : "";
      const macRaw = row && row.mac != null ? String(row.mac) : "";
      const timeArea =
        row && row.timeArea != null ? String(row.timeArea).trim() : "";
      const language =
        row && row.language != null ? String(row.language).trim() : "";

      if (!did) {
        errors.push({ line, code: "PARAM_ERROR", message: "参数不能为空：DID" });
        return;
      }
      if (!key) {
        errors.push({ line, code: "PARAM_ERROR", message: "参数不能为空：KEY" });
        return;
      }
      if (!macRaw || !String(macRaw).trim()) {
        errors.push({ line, code: "PARAM_ERROR", message: "参数不能为空：MAC" });
        return;
      }
      if (!timeArea) {
        errors.push({
          line,
          code: "PARAM_ERROR",
          message: "参数不能为空：TimeArea",
        });
        return;
      }
      if (!language) {
        errors.push({
          line,
          code: "PARAM_ERROR",
          message: "参数不能为空：Language",
        });
        return;
      }

      const macRes = normalizeMac(macRaw);
      if (!macRes.ok) {
        errors.push({ line, code: "PARAM_ERROR", message: macRes.message });
        return;
      }

      if (seenDid.has(did)) {
        errors.push({ line, code: "DUPLICATE_DID", message: "DID 已存在" });
        return;
      }
      if (seenKey.has(key)) {
        errors.push({ line, code: "DUPLICATE_KEY", message: "KEY 已存在" });
        return;
      }
      if (seenMac.has(macRes.mac)) {
        errors.push({ line, code: "DUPLICATE_MAC", message: "MAC 已存在" });
        return;
      }

      seenDid.add(did);
      seenKey.add(key);
      seenMac.add(macRes.mac);
      normalizedRows.push({
        line,
        did,
        key,
        mac: macRes.mac,
        timeArea,
        language,
        status: "unbound",
      });
    });

    if (errors.length > 0) {
      return res.json({
        code: 200,
        success: true,
        inserted: 0,
        errors,
        message: "校验未通过",
      });
    }

    const dids = normalizedRows.map((r) => r.did);
    const keys = normalizedRows.map((r) => r.key);
    const macs = normalizedRows.map((r) => r.mac);

    const existing = await TripletData.find({
      $or: [{ did: { $in: dids } }, { key: { $in: keys } }, { mac: { $in: macs } }],
    })
      .select("did key mac")
      .lean();

    if (existing.length > 0) {
      const didSet = new Set(existing.map((e) => e.did));
      const keySet = new Set(existing.map((e) => e.key));
      const macSet = new Set(existing.map((e) => e.mac));

      normalizedRows.forEach((r) => {
        if (didSet.has(r.did)) {
          errors.push({
            line: r.line,
            code: "DUPLICATE_DID",
            message: "DID 已存在",
          });
        } else if (keySet.has(r.key)) {
          errors.push({
            line: r.line,
            code: "DUPLICATE_KEY",
            message: "KEY 已存在",
          });
        } else if (macSet.has(r.mac)) {
          errors.push({
            line: r.line,
            code: "DUPLICATE_MAC",
            message: "MAC 已存在",
          });
        }
      });

      return res.json({
        code: 200,
        success: true,
        inserted: 0,
        errors,
        message: "与库内数据冲突",
      });
    }

    const docs = normalizedRows.map(({ line, ...rest }) => rest);
    try {
      await TripletData.insertMany(docs, { ordered: true });
    } catch (e) {
      if (e && e.code === 11000) {
        return res.json({
          code: 200,
          success: false,
          inserted: 0,
          errors: [
            {
              line: 0,
              code: "SYSTEM_ERROR",
              message: "唯一索引冲突，请重试或检查数据",
            },
          ],
          message: e.message,
        });
      }
      throw e;
    }

    return res.json({
      code: 200,
      success: true,
      inserted: docs.length,
      errors: [],
      message: "导入成功",
    });
  } catch (e) {
    console.error("[tripletData] import", e);
    return res.status(500).json({
      code: 500,
      message: e.message || "系统内部错误",
      success: false,
    });
  }
});

module.exports = router;
