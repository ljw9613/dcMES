const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

const ApiCallLog = require("../model/project/apiCallLog");
const ApiFileRecord = require("../model/project/apiFileRecord");
const ApiParamTemplate = require("../model/project/apiParamTemplate");
const ThirdPartyApiConfig = require("../model/project/thirdPartyApiConfig");

// ─── 日志列表（分页 + 多条件查询） ────────────────────────────────────────────
router.get("/api/v1/tp-call-log/list", async (req, res) => {
  try {
    const {
      apiConfigId, bizNo, saleNo, responseStatus, callMode,
      paramTemplateName, startTime, endTime,
      page: rawPage, pageSize: rawPageSize,
    } = req.query;

    const page = Math.max(parseInt(rawPage) || 1, 1);
    const pageSize = Math.min(parseInt(rawPageSize) || 20, 100);
    const skip = (page - 1) * pageSize;

    const filter = {};
    if (apiConfigId) filter.apiConfigId = apiConfigId;
    if (bizNo) filter.bizNo = { $regex: bizNo, $options: "i" };
    if (saleNo) filter.saleNo = { $regex: saleNo, $options: "i" };
    if (responseStatus) filter.responseStatus = responseStatus;
    if (callMode) filter.callMode = parseInt(callMode);
    if (paramTemplateName) filter.paramTemplateSnapshot = { $regex: paramTemplateName, $options: "i" };
    if (startTime || endTime) {
      filter.requestTime = {};
      if (startTime) filter.requestTime.$gte = new Date(startTime);
      if (endTime) filter.requestTime.$lte = new Date(endTime);
    }

    const [total, list] = await Promise.all([
      ApiCallLog.countDocuments(filter),
      ApiCallLog.find(filter)
        .sort({ requestTime: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({ code: 20000, success: true, data: { total, list, page, pageSize } });
  } catch (err) {
    console.error("[tp-call-log] list error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 日志详情 ──────────────────────────────────────────────────────────────────
router.get("/api/v1/tp-call-log/:id", async (req, res) => {
  try {
    const log = await ApiCallLog.findById(req.params.id).lean();
    if (!log) return res.json({ code: 404, success: false, message: "日志不存在" });

    // 附加文件信息
    let fileInfo = null;
    if (log.fileRecordId) {
      fileInfo = await ApiFileRecord.findById(log.fileRecordId).lean();
    }

    // 附加模板信息（仅做展示用）
    let templateInfo = null;
    if (log.paramTemplateId) {
      templateInfo = await ApiParamTemplate.findOne({
        _id: log.paramTemplateId,
        deleted: { $ne: true },
      }).lean();
    }

    res.json({ code: 20000, success: true, data: { ...log, fileInfo, templateInfo } });
  } catch (err) {
    console.error("[tp-call-log] detail error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 失败日志重试 ──────────────────────────────────────────────────────────────
router.post("/api/v1/tp-call-log/:id/retry", async (req, res) => {
  const startTime = Date.now();
  try {
    const log = await ApiCallLog.findById(req.params.id).lean();
    if (!log) return res.json({ code: 404, success: false, message: "日志不存在" });
    // 参数模式仅允许失败日志重试；文件模式因文件已保存在服务器，任意状态均可重新发送
    if (log.callMode !== 2 && log.responseStatus !== "fail") {
      return res.json({ code: 400, success: false, message: "仅失败日志可以重试" });
    }

    // 获取接口配置（原接口已删除时使用快照中的信息）
    let apiUrl = log.apiConfigSnapshot.url;
    let apiMethod = log.apiConfigSnapshot.method;

    if (log.apiConfigId) {
      const api = await ThirdPartyApiConfig.findOne({ _id: log.apiConfigId, deleted: { $ne: true } });
      if (api) {
        if (api.status !== 1) {
          return res.json({ code: 400, success: false, message: "关联接口已非启用状态，无法重试" });
        }
        apiUrl = api.url;
        apiMethod = api.method;
      }
    }

    // 允许重试时替换参数（前端可传入新参数）
    const { params: newParams, paramType: newParamType } = req.body;
    const useParams = newParams
      ? { paramType: parseInt(newParamType) || log.requestParams.paramType, items: newParams }
      : log.requestParams;

    let outgoingRequestConfig = {};
    let responseStatus = "fail";
    let responseBody = "";
    let responseHeaders = "";
    let errorMessage = "";

    if (log.callMode === 2) {
      // 文件重试：使用原文件，并重放日志中存储的附加参数
      const fileRecord = log.fileRecordId
        ? await ApiFileRecord.findById(log.fileRecordId).lean()
        : null;

      if (!fileRecord || !fs.existsSync(fileRecord.filePath)) {
        return res.json({ code: 400, success: false, message: "原文件不存在，请重新上传后调用" });
      }

      // 读取存储的附加参数
      const storedParams = log.requestParams || {};
      const qExtra = storedParams.fileQueryParams || [];
      const bExtra = storedParams.fileBodyParams || [];

      // 拼接 Query 参数
      let targetUrl = apiUrl;
      const qs = qExtra
        .filter((p) => p.key)
        .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || "")}`)
        .join("&");
      if (qs) targetUrl += (targetUrl.includes("?") ? "&" : "?") + qs;

      // 构造 FormData：文件 + 附加 form 字段
      const fd = new FormData();
      fd.append("file", fs.createReadStream(fileRecord.filePath), fileRecord.fileName);
      bExtra.filter((p) => p.key).forEach((p) => fd.append(p.key, p.value || ""));

      outgoingRequestConfig = {
        method: apiMethod.toLowerCase(),
        url: targetUrl,
        data: fd,
        headers: { ...fd.getHeaders() },
        timeout: 30000,
      };
    } else {
      const pType = useParams.paramType || 1;
      const paramsArray = useParams.items || [];
      let targetUrl = apiUrl;

      if (pType === 1) {
        const qs = paramsArray
          .filter((p) => p.key)
          .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || "")}`)
          .join("&");
        if (qs) targetUrl += (targetUrl.includes("?") ? "&" : "?") + qs;
        outgoingRequestConfig = { method: apiMethod.toLowerCase(), url: targetUrl, timeout: 30000 };
      } else if (pType === 2) {
        const fd = new FormData();
        paramsArray.filter((p) => p.key).forEach((p) => fd.append(p.key, p.value || ""));
        outgoingRequestConfig = {
          method: apiMethod.toLowerCase(),
          url: targetUrl,
          data: fd,
          headers: fd.getHeaders(),
          timeout: 30000,
        };
      } else if (pType === 3) {
        const encoded = paramsArray
          .filter((p) => p.key)
          .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || "")}`)
          .join("&");
        outgoingRequestConfig = {
          method: apiMethod.toLowerCase(),
          url: targetUrl,
          data: encoded,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 30000,
        };
      } else if (pType === 4) {
        const jsonObj = {};
        paramsArray.filter((p) => p.key).forEach((p) => { jsonObj[p.key] = p.value || ""; });
        outgoingRequestConfig = {
          method: apiMethod.toLowerCase(),
          url: targetUrl,
          data: jsonObj,
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        };
      }
    }

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

    // ── 业务层成功条件校验（与 /call 接口保持一致） ───────────────────
    let successConditionInfo = null;
    if (log.apiConfigId) {
      const apiForCheck = await ThirdPartyApiConfig.findOne({ _id: log.apiConfigId, deleted: { $ne: true } }).lean();
      if (apiForCheck) {
        const sc = apiForCheck.successCondition;
        if (responseStatus === "success" && sc && sc.enabled && sc.field) {
          successCheckMode = "body";
          successConditionInfo = { field: sc.field, operator: sc.operator, value: sc.value };
          try {
            const bodyObj = JSON.parse(responseBody);
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
      }
    }

    const duration = Date.now() - startTime;

    // 创建新的重试日志记录（不修改原记录，保留原始请求现场）
    const newLogDoc = await ApiCallLog.create({
      apiConfigId: log.apiConfigId,
      apiConfigSnapshot: log.apiConfigSnapshot,
      bizNo: log.bizNo || "",
      saleNo: log.saleNo || "",
      requestUrl: outgoingRequestConfig.url,
      callMode: log.callMode,
      paramTemplateId: log.paramTemplateId || null,
      paramTemplateSnapshot: log.paramTemplateSnapshot || "",
      requestParams: useParams,
      fileRecordId: log.fileRecordId || null,
      responseStatus,
      responseBody,
      responseHeaders,
      errorMessage,
      duration,
      requestTime: new Date(startTime),
      retryCount: 0,
      retryFromLogId: log._id,
      successCheckMode,
      successConditionSnapshot: successConditionInfo
        ? { field: successConditionInfo.field, operator: successConditionInfo.operator, value: successConditionInfo.value }
        : { field: "", operator: "eq", value: "" },
      calledBy: req.userId || "",
      calledName: req.realName || req.userName || "",
    });

    // 原日志仅增加重试次数计数
    await ApiCallLog.updateOne({ _id: req.params.id }, { $inc: { retryCount: 1 } });

    res.json({
      code: 20000,
      success: true,
      data: {
        logId: newLogDoc._id,
        responseStatus,
        responseBody,
        responseHeaders: responseHeaders ? JSON.parse(responseHeaders) : {},
        errorMessage,
        duration,
        successCheckMode,
        successCondition: successConditionInfo,
      },
      message: responseStatus === "success" ? "重试成功" : "重试失败",
    });
  } catch (err) {
    console.error("[tp-call-log] retry error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

// ─── 下载日志关联文件 ──────────────────────────────────────────────────────────
router.get("/api/v1/tp-call-log/:id/file/download", async (req, res) => {
  try {
    const log = await ApiCallLog.findById(req.params.id).lean();
    if (!log) return res.json({ code: 404, success: false, message: "日志不存在" });
    if (!log.fileRecordId) return res.json({ code: 400, success: false, message: "该日志无关联文件" });

    const fileRecord = await ApiFileRecord.findById(log.fileRecordId).lean();
    if (!fileRecord) return res.json({ code: 404, success: false, message: "文件记录不存在" });
    if (!fs.existsSync(fileRecord.filePath)) {
      return res.json({ code: 404, success: false, message: "文件已被删除，无法下载" });
    }

    res.download(fileRecord.filePath, fileRecord.fileName);
  } catch (err) {
    console.error("[tp-call-log] file download error:", err);
    res.status(500).json({ code: 500, success: false, message: err.message });
  }
});

module.exports = router;
