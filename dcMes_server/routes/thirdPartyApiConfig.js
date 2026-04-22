const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const ThirdPartyApiConfig = require("../model/project/thirdPartyApiConfig");
const ApiParamTemplate = require("../model/project/apiParamTemplate");
const ApiCallLog = require("../model/project/apiCallLog");
const ApiFileRecord = require("../model/project/apiFileRecord");

// ─── multer 配置 ───────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../public/uploads/tp-api");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.random().toString(36).substr(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// ─── Helper ────────────────────────────────────────────────────────────────────
function buildPaginationQuery(query) {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const pageSize = Math.min(parseInt(query.pageSize) || 20, 100);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

// ─── 列表查询 ──────────────────────────────────────────────────────────────────
router.get("/api/v1/tp-api-config/list", async (req, res) => {
  try {
    const { name, url, status, startTime, endTime } = req.query;
    const { page, pageSize, skip } = buildPaginationQuery(req.query);

    const filter = { deleted: { $ne: true } };
    if (name) filter.name = { $regex: name, $options: "i" };
    if (url) filter.url = { $regex: url, $options: "i" };
    if (status) filter.status = parseInt(status);
    if (startTime || endTime) {
      filter.createdAt = {};
      if (startTime) filter.createdAt.$gte = new Date(startTime);
      if (endTime) filter.createdAt.$lte = new Date(endTime);
    }

    const [total, list] = await Promise.all([
      ThirdPartyApiConfig.countDocuments(filter),
      ThirdPartyApiConfig.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    // 批量获取每个接口的参数模板数量
    const ids = list.map((item) => item._id);
    const templateCounts = await ApiParamTemplate.aggregate([
      { $match: { apiConfigId: { $in: ids }, deleted: { $ne: true } } },
      { $group: { _id: "$apiConfigId", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    templateCounts.forEach((t) => {
      countMap[t._id.toString()] = t.count;
    });

    const data = list.map((item) => ({
      ...item,
      templateCount: countMap[item._id.toString()] || 0,
    }));

    res.json({ code: 20000, success: true, data: { total, list: data, page, pageSize } });
  } catch (err) {
    console.error("[tp-api-config] list error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 解析并校验 successCondition ───────────────────────────────────────────────
function parseSuccessCondition(body) {
  const raw = body.successCondition;
  if (!raw) return { enabled: false, field: "", operator: "eq", value: "" };
  const sc = typeof raw === "string" ? JSON.parse(raw) : raw;
  return {
    enabled: !!sc.enabled,
    field: (sc.field || "").trim(),
    operator: sc.operator || "eq",
    value: sc.value !== undefined ? String(sc.value) : "",
  };
}

// ─── 新增接口配置 ──────────────────────────────────────────────────────────────
router.post("/api/v1/tp-api-config/add", async (req, res) => {
  try {
    const { name, url, method, description, status } = req.body;

    if (!name || !url || !method) {
      return res.json({ code: 400, success: false, message: "接口名称、地址、请求方式为必填项" });
    }
    if (name.length > 100) {
      return res.json({ code: 400, success: false, message: "接口名称不能超过100字符" });
    }
    // 简单 URL 格式校验
    try {
      new URL(url);
    } catch {
      return res.json({ code: 400, success: false, message: "接口地址不是合法的URL" });
    }

    const exists = await ThirdPartyApiConfig.findOne({ name, deleted: { $ne: true } });
    if (exists) {
      return res.json({ code: 400, success: false, message: "接口名称已存在，请更换" });
    }

    const successCondition = parseSuccessCondition(req.body);

    const timeoutVal = Math.min(Math.max(parseInt(req.body.timeout) || 30, 5), 1200);

    const doc = await ThirdPartyApiConfig.create({
      name,
      url,
      method,
      description: description || "",
      status: status !== undefined ? status : 1,
      timeout: timeoutVal,
      successCondition,
      createdBy: req.userId || "",
      createdName: req.realName || req.userName || "",
      updatedBy: req.userId || "",
      updatedName: req.realName || req.userName || "",
    });

    res.json({ code: 20000, success: true, data: doc, message: "新增成功" });
  } catch (err) {
    console.error("[tp-api-config] add error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 编辑接口配置 ──────────────────────────────────────────────────────────────
router.put("/api/v1/tp-api-config/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, method, description, status } = req.body;

    const doc = await ThirdPartyApiConfig.findOne({ _id: id, deleted: { $ne: true } });
    if (!doc) return res.json({ code: 404, success: false, message: "接口配置不存在" });
    if (doc.status === 3) return res.json({ code: 400, success: false, message: "作废状态的接口不可编辑" });

    if (name && name.length > 100) {
      return res.json({ code: 400, success: false, message: "接口名称不能超过100字符" });
    }
    if (url) {
      try { new URL(url); } catch {
        return res.json({ code: 400, success: false, message: "接口地址不是合法的URL" });
      }
    }
    if (name && name !== doc.name) {
      const exists = await ThirdPartyApiConfig.findOne({ name, _id: { $ne: id }, deleted: { $ne: true } });
      if (exists) return res.json({ code: 400, success: false, message: "接口名称已存在，请更换" });
    }

    const coreChanged = (url && url !== doc.url) || (method && method !== doc.method);

    const successCondition = parseSuccessCondition(req.body);
    const timeoutVal = req.body.timeout !== undefined
      ? Math.min(Math.max(parseInt(req.body.timeout) || 30, 5), 1200)
      : undefined;

    await ThirdPartyApiConfig.updateOne(
      { _id: id },
      {
        $set: {
          ...(name !== undefined && { name }),
          ...(url !== undefined && { url }),
          ...(method !== undefined && { method }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
          ...(timeoutVal !== undefined && { timeout: timeoutVal }),
          successCondition,
          updatedBy: req.userId || "",
          updatedName: req.realName || req.userName || "",
        },
      }
    );

    res.json({
      code: 20000,
      success: true,
      message: "编辑成功",
      coreChanged,
      warning: coreChanged
        ? "接口核心信息修改后，已维护的参数模板可能无法正常使用，请检查并调整"
        : null,
    });
  } catch (err) {
    console.error("[tp-api-config] update error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 状态切换 ──────────────────────────────────────────────────────────────────
router.put("/api/v1/tp-api-config/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (![1, 2, 3].includes(parseInt(status))) {
      return res.json({ code: 400, success: false, message: "无效的状态值" });
    }

    const doc = await ThirdPartyApiConfig.findOne({ _id: id, deleted: { $ne: true } });
    if (!doc) return res.json({ code: 404, success: false, message: "接口配置不存在" });

    await ThirdPartyApiConfig.updateOne(
      { _id: id },
      { $set: { status: parseInt(status), updatedBy: req.userId || "", updatedName: req.realName || req.userName || "" } }
    );

    res.json({ code: 20000, success: true, message: "状态更新成功" });
  } catch (err) {
    console.error("[tp-api-config] status error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 删除接口配置（级联处理） ───────────────────────────────────────────────────
router.delete("/api/v1/tp-api-config/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await ThirdPartyApiConfig.findOne({ _id: id, deleted: { $ne: true } });
    if (!doc) return res.json({ code: 404, success: false, message: "接口配置不存在" });

    // 软删除接口配置
    await ThirdPartyApiConfig.delete({ _id: id });

    // 软删除关联参数模板
    await ApiParamTemplate.delete({ apiConfigId: id });

    // 删除关联文件记录并删除物理文件
    const fileRecords = await ApiFileRecord.find({ apiConfigId: id });
    for (const fr of fileRecords) {
      try {
        if (fr.filePath && fs.existsSync(fr.filePath)) {
          fs.unlinkSync(fr.filePath);
        }
      } catch (e) {
        console.warn("[tp-api-config] delete file warn:", e.message);
      }
    }
    await ApiFileRecord.deleteMany({ apiConfigId: id });

    // 请求日志保留，仅解除关联
    await ApiCallLog.updateMany({ apiConfigId: id }, { $set: { apiConfigId: null } });

    res.json({ code: 20000, success: true, message: "删除成功" });
  } catch (err) {
    console.error("[tp-api-config] delete error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 接口详情（含参数模板列表） ─────────────────────────────────────────────────
router.get("/api/v1/tp-api-config/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await ThirdPartyApiConfig.findOne({ _id: id, deleted: { $ne: true } }).lean();
    if (!doc) return res.json({ code: 404, success: false, message: "接口配置不存在" });

    const templates = await ApiParamTemplate.find({ apiConfigId: id, deleted: { $ne: true } })
      .sort({ sortOrder: 1 })
      .lean();

    res.json({ code: 20000, success: true, data: { ...doc, templates } });
  } catch (err) {
    console.error("[tp-api-config] detail error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 获取接口上传文件记录（最近N条，默认10） ──────────────────────────────────
router.get("/api/v1/tp-api-config/:id/file-records", async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const records = await ApiFileRecord.find({ apiConfigId: id })
      .sort({ uploadedAt: -1 })
      .limit(limit)
      .lean();
    res.json({ code: 20000, success: true, data: records });
  } catch (err) {
    console.error("[tp-api-config] file-records error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 接口调用（核心代理） ──────────────────────────────────────────────────────
router.post("/api/v1/tp-api-config/:id/call", upload.single("file"), async (req, res) => {
  const startTime = Date.now();
  let fileRecord = null;

  try {
    const { id } = req.params;
    const apiConfig = await ThirdPartyApiConfig.findOne({ _id: id, deleted: { $ne: true } });
    if (!apiConfig) return res.json({ code: 404, success: false, message: "接口配置不存在" });
    if (apiConfig.status !== 1) return res.json({ code: 400, success: false, message: "仅启用状态的接口可以调用" });

    // 判断调用模式：上传了新文件 / 复用历史文件 / 纯参数模式
    const isNewFile = req.file !== undefined;
    const isHistoryFile = !isNewFile && req.body && req.body.useHistoryFileId;
    const isFileMode = isNewFile || isHistoryFile;
    const callMode = isFileMode ? 2 : 1;

    // ── 模式二：文件调用 ──────────────────────────────────────────────
    let outgoingRequestConfig = {};
    let requestParamsSnapshot = { paramType: null, items: [], fileQueryParams: [], fileBodyParams: [] };
    let fileRecordIdToSave = null;

    if (isFileMode) {
      let filePath, fileName;

      if (isNewFile) {
        // 新文件上传 — 保存记录，永久留档，不自动清理
        fileRecord = await ApiFileRecord.create({
          apiConfigId: id,
          fileName: req.file.originalname,
          filePath: req.file.path,
          fileSize: req.file.size,
          uploadedBy: req.userId || "",
          uploadedName: req.realName || req.userName || "",
          uploadedAt: new Date(),
          callCount: 0,
        });
        fileRecordIdToSave = fileRecord._id;
        filePath = req.file.path;
        fileName = req.file.originalname;
      } else {
        // 复用历史文件 — 根据 ID 找到磁盘路径
        const histFile = await ApiFileRecord.findById(req.body.useHistoryFileId).lean();
        if (!histFile) {
          return res.json({ code: 404, success: false, message: "历史文件记录不存在" });
        }
        if (!fs.existsSync(histFile.filePath)) {
          return res.json({ code: 400, success: false, message: "历史文件已从服务器删除，请重新上传" });
        }
        fileRecordIdToSave = histFile._id;
        filePath = histFile.filePath;
        fileName = histFile.fileName;
      }

      // 解析附加参数（Query 参数 / Form 附加字段）
      const { fileQueryParams, fileBodyParams } = req.body;
      const parseField = (v) => !v ? [] : (Array.isArray(v) ? v : JSON.parse(v));
      const qExtra = parseField(fileQueryParams);
      const bExtra = parseField(fileBodyParams);

      requestParamsSnapshot = {
        paramType: null,
        items: [],
        fileQueryParams: qExtra,
        fileBodyParams: bExtra,
      };

      // 拼接 Query 参数到 URL
      let targetUrl = apiConfig.url;
      const qs = qExtra
        .filter((p) => p.key)
        .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || "")}`)
        .join("&");
      if (qs) targetUrl += (targetUrl.includes("?") ? "&" : "?") + qs;

      // 构造 FormData：文件 + 附加 form 字段
      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath), fileName);
      bExtra.filter((p) => p.key).forEach((p) => formData.append(p.key, p.value || ""));

      outgoingRequestConfig = {
        method: apiConfig.method.toLowerCase(),
        url: targetUrl,
        data: formData,
        headers: { ...formData.getHeaders() },
        timeout: (apiConfig.timeout || 30) * 1000,
      };
    } else {
      // ── 模式一：自定义参数调用 ──────────────────────────────────────
      const { paramType, params, queryParams, bizNo, saleNo, paramTemplateId } = req.body;
      const pType = parseInt(paramType) || 1;
      const paramsArray = Array.isArray(params) ? params : (params ? JSON.parse(params) : []);
      const queryArray = Array.isArray(queryParams) ? queryParams : (queryParams ? JSON.parse(queryParams) : []);

      requestParamsSnapshot = {
        paramType: pType,
        items: paramsArray,
      };

      let targetUrl = apiConfig.url;
      // 拼接 Query 参数到 URL
      const allQueryParams = pType === 1 ? paramsArray : queryArray;
      if (allQueryParams && allQueryParams.length > 0) {
        const qs = allQueryParams
          .filter((p) => p.key)
          .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || "")}`)
          .join("&");
        if (qs) targetUrl += (targetUrl.includes("?") ? "&" : "?") + qs;
      }

      let reqData = null;
      let reqHeaders = { "Content-Type": "application/json" };

      if (pType === 1) {
        // Query only，body 为空
        reqData = undefined;
      } else if (pType === 2) {
        // Body-form-data
        const fd = new FormData();
        paramsArray.filter((p) => p.key).forEach((p) => fd.append(p.key, p.value || ""));
        reqData = fd;
        reqHeaders = fd.getHeaders();
      } else if (pType === 3) {
        // Body-x-www-form-urlencoded
        const encoded = paramsArray
          .filter((p) => p.key)
          .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || "")}`)
          .join("&");
        reqData = encoded;
        reqHeaders = { "Content-Type": "application/x-www-form-urlencoded" };
      } else if (pType === 4) {
        // Body-JSON (application/json)
        const jsonObj = {};
        paramsArray.filter((p) => p.key).forEach((p) => { jsonObj[p.key] = p.value || ""; });
        reqData = jsonObj;
        reqHeaders = { "Content-Type": "application/json" };
      }

      outgoingRequestConfig = {
        method: apiConfig.method.toLowerCase(),
        url: targetUrl,
        data: reqData,
        headers: reqHeaders,
        timeout: (apiConfig.timeout || 30) * 1000,
      };
    }

    // ── 发起代理请求 ─────────────────────────────────────────────────
    let responseStatus = "fail";
    let responseBody = "";
    let responseHeaders = "";
    let errorMessage = "";
    // 用于记录成功判定的方式（http=仅HTTP状态码，body=响应体字段条件）
    let successCheckMode = "http";

    try {
      const response = await axios(outgoingRequestConfig);
      responseStatus = "success";
      responseBody = typeof response.data === "object"
        ? JSON.stringify(response.data)
        : String(response.data);
      responseHeaders = JSON.stringify(response.headers || {});
    } catch (axiosErr) {
      responseStatus = "fail";
      errorMessage = axiosErr.message || "请求失败";
      if (axiosErr.response) {
        responseBody = typeof axiosErr.response.data === "object"
          ? JSON.stringify(axiosErr.response.data)
          : String(axiosErr.response.data || "");
        responseHeaders = JSON.stringify(axiosErr.response.headers || {});
      }
    }

    // ── 业务层成功条件校验（仅 HTTP 请求本身成功时才检查） ────────────
    const sc = apiConfig.successCondition;
    if (responseStatus === "success" && sc && sc.enabled && sc.field) {
      successCheckMode = "body";
      try {
        const bodyObj = JSON.parse(responseBody);
        // 支持点分字段路径，如 data.code / result.status
        const actualValue = sc.field.split(".").reduce(
          (obj, key) => (obj != null && obj[key] !== undefined ? obj[key] : undefined),
          bodyObj
        );
        if (actualValue === undefined) {
          responseStatus = "fail";
          errorMessage = `响应体中未找到字段 "${sc.field}"，成功条件校验未通过`;
        } else {
          const actual = String(actualValue);
          const expected = String(sc.value || "");
          let conditionMet = false;
          switch (sc.operator) {
            case "eq":         conditionMet = actual === expected; break;
            case "neq":        conditionMet = actual !== expected; break;
            case "contains":   conditionMet = actual.includes(expected); break;
            case "startsWith": conditionMet = actual.startsWith(expected); break;
            case "notEmpty":   conditionMet = actual.trim() !== ""; break;
            default:           conditionMet = actual === expected;
          }
          if (!conditionMet) {
            responseStatus = "fail";
            errorMessage = `业务层成功条件不满足：字段 "${sc.field}" 期望 "${expected}"，实际值为 "${actual}"`;
          }
        }
      } catch (parseErr) {
        responseStatus = "fail";
        errorMessage = `响应体 JSON 解析失败，无法校验成功条件：${parseErr.message}`;
      }
    }

    const duration = Date.now() - startTime;

    // ── 写入请求日志 ─────────────────────────────────────────────────
    const { bizNo, saleNo, paramTemplateId } = req.body;
    let templateSnapshot = "";
    if (paramTemplateId) {
      const tpl = await ApiParamTemplate.findById(paramTemplateId).lean();
      if (tpl) templateSnapshot = tpl.name;
    }

    const logDoc = await ApiCallLog.create({
      apiConfigId: id,
      apiConfigSnapshot: {
        name: apiConfig.name,
        url: apiConfig.url,
        method: apiConfig.method,
      },
      bizNo: bizNo || "",
      saleNo: saleNo || "",
      requestUrl: outgoingRequestConfig.url,
      callMode,
      paramTemplateId: paramTemplateId || null,
      paramTemplateSnapshot: templateSnapshot,
      requestParams: requestParamsSnapshot,
      fileRecordId: fileRecordIdToSave,
      responseStatus,
      responseBody,
      responseHeaders,
      errorMessage,
      duration,
      requestTime: new Date(startTime),
      retryCount: 0,
      successCheckMode,
      successConditionSnapshot: sc && sc.enabled && sc.field
        ? { field: sc.field, operator: sc.operator, value: sc.value }
        : { field: "", operator: "eq", value: "" },
      calledBy: req.userId || "",
      calledName: req.realName || req.userName || "",
    });

    // 更新文件记录 callCount
    if (fileRecordIdToSave) {
      await ApiFileRecord.updateOne({ _id: fileRecordIdToSave }, { $inc: { callCount: 1 } });
    }

    res.json({
      code: 20000,
      success: true,
      data: {
        logId: logDoc._id,
        responseStatus,
        responseBody,
        responseHeaders: responseHeaders ? JSON.parse(responseHeaders) : {},
        errorMessage,
        duration,
        successCheckMode,
        successCondition: sc && sc.enabled ? { field: sc.field, operator: sc.operator, value: sc.value } : null,
      },
      message: responseStatus === "success" ? "调用成功" : "调用失败",
    });
  } catch (err) {
    console.error("[tp-api-config] call error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 直接下载文件记录（通过文件记录 ID） ──────────────────────────────────────
router.get("/api/v1/tp-api-file-record/:id/download", async (req, res) => {
  try {
    const fileRecord = await ApiFileRecord.findById(req.params.id).lean();
    if (!fileRecord) return res.json({ code: 404, success: false, message: "文件记录不存在" });
    if (!fs.existsSync(fileRecord.filePath)) {
      return res.json({ code: 404, success: false, message: "文件已被删除，无法下载" });
    }
    res.download(fileRecord.filePath, fileRecord.fileName);
  } catch (err) {
    console.error("[tp-api-file-record] download error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

module.exports = router;
