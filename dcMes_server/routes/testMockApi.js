/**
 * 测试用 Mock 接口集合
 * 用于测试「第三方接口管理」模块的接口调用功能
 *
 * 挂载路径：app.use('/', require('./routes/testMockApi'))
 * 所有接口前缀：/api/v1/mock
 *
 * 接口清单：
 *  GET    /api/v1/mock/ping                   - 心跳检测（无参数）
 *  GET    /api/v1/mock/echo                   - Query 参数回显
 *  POST   /api/v1/mock/echo-body              - Body JSON / form-data 参数回显
 *  POST   /api/v1/mock/echo-urlencoded        - Body x-www-form-urlencoded 参数回显
 *  POST   /api/v1/mock/echo-file              - 文件上传回显（接收 multipart file 字段）
 *  GET    /api/v1/mock/delay/:ms              - 延迟响应（测试超时 / 耗时）
 *  GET    /api/v1/mock/error/:code            - 返回指定 HTTP 状态码（测试失败重试）
 *  POST   /api/v1/mock/validate               - 简单参数校验（必填字段检查）
 *  PUT    /api/v1/mock/echo-put               - PUT Body form-data 参数回显
 *  PUT    /api/v1/mock/update/:id             - 模拟带资源ID的更新（Path + Body）
 *  PUT    /api/v1/mock/update-validate        - 带校验的更新接口（id/name/value 必填）
 *  DELETE /api/v1/mock/delete/:id             - 模拟按 ID 删除资源（Path Param）
 *  DELETE /api/v1/mock/delete-query           - 模拟按 Query 参数批量删除
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// multer 仅用于 /echo-file，文件暂存内存（不落盘，方便测试）
const memStorage = multer.memoryStorage();
const upload = multer({ storage: memStorage, limits: { fileSize: 20 * 1024 * 1024 } });

// ─── 辅助：统一响应格式 ────────────────────────────────────────────────────────
function ok(res, data, message = "success") {
  res.json({ code: 0, message, data, timestamp: new Date().toISOString() });
}
function fail(res, message, status = 400) {
  res.status(status).json({ code: status, message, timestamp: new Date().toISOString() });
}

// ─── GET /api/v1/mock/ping ────────────────────────────────────────────────────
// 用途：测试接口是否可达，无需任何参数
router.get("/api/v1/mock/ping", (req, res) => {
  ok(res, { pong: true, server: "dcMes-mock", uptime: process.uptime().toFixed(2) + "s" }, "pong");
});

// ─── GET /api/v1/mock/echo ────────────────────────────────────────────────────
// 用途：测试 Query 参数传递，将所有 Query 参数原样返回
router.get("/api/v1/mock/echo", (req, res) => {
  ok(res, {
    method: "GET",
    query: req.query,
    headers: {
      "content-type": req.headers["content-type"],
      authorization: req.headers["authorization"] ? "Bearer ***" : undefined,
    },
  }, "Query 参数回显成功");
});

// ─── POST /api/v1/mock/echo-body ─────────────────────────────────────────────
// 用途：测试 Body（JSON 或 form-data）参数传递
router.post("/api/v1/mock/echo-body", upload.none(), (req, res) => {
  const contentType = req.headers["content-type"] || "";
  ok(res, {
    method: "POST",
    contentType,
    body: req.body,
    bodyType: contentType.includes("multipart") ? "form-data" : "json",
  }, "Body 参数回显成功");
});

// ─── POST /api/v1/mock/echo-urlencoded ───────────────────────────────────────
// 用途：测试 x-www-form-urlencoded 格式的 Body 参数
router.post("/api/v1/mock/echo-urlencoded", (req, res) => {
  ok(res, {
    method: "POST",
    contentType: req.headers["content-type"],
    body: req.body,
    bodyType: "x-www-form-urlencoded",
  }, "Urlencoded 参数回显成功");
});

// ─── POST /api/v1/mock/echo-file ─────────────────────────────────────────────
// 用途：测试文件上传，返回文件基本信息（不保存文件）
router.post("/api/v1/mock/echo-file", upload.single("file"), (req, res) => {
  if (!req.file) {
    return fail(res, "未收到文件，请确认 form-data 中包含 file 字段", 400);
  }
  ok(res, {
    method: "POST",
    file: {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      sizeReadable: formatSize(req.file.size),
      encoding: req.file.encoding,
    },
    otherFields: req.body,
  }, "文件接收成功（未保存，仅回显信息）");
});

// ─── GET /api/v1/mock/delay/:ms ──────────────────────────────────────────────
// 用途：模拟慢接口，测试调用耗时展示（最大 10 秒）
router.get("/api/v1/mock/delay/:ms", (req, res) => {
  const ms = Math.min(parseInt(req.params.ms) || 1000, 10000);
  setTimeout(() => {
    ok(res, { delayed: ms, unit: "ms" }, `延迟 ${ms}ms 响应成功`);
  }, ms);
});

// ─── GET /api/v1/mock/error/:code ────────────────────────────────────────────
// 用途：模拟接口失败，测试失败重试功能（常用：400 / 401 / 500 / 503）
router.get("/api/v1/mock/error/:code", (req, res) => {
  const code = parseInt(req.params.code) || 500;
  const messages = {
    400: "Bad Request - 请求参数有误",
    401: "Unauthorized - 未授权，请检查 Token",
    403: "Forbidden - 无访问权限",
    404: "Not Found - 资源不存在",
    429: "Too Many Requests - 请求过于频繁",
    500: "Internal Server Error - 服务器内部错误",
    502: "Bad Gateway - 网关错误",
    503: "Service Unavailable - 服务暂不可用",
  };
  res.status(code).json({
    code,
    message: messages[code] || `HTTP ${code} Error`,
    timestamp: new Date().toISOString(),
  });
});

// ─── POST /api/v1/mock/validate ──────────────────────────────────────────────
// 用途：模拟带参数校验的接口（name 和 value 为必填），测试参数正确/缺失两种场景
router.post("/api/v1/mock/validate", upload.none(), (req, res) => {
  const { name, value, type } = req.body;
  const errors = [];
  if (!name) errors.push("name 为必填项");
  if (!value) errors.push("value 为必填项");

  if (errors.length > 0) {
    return res.status(422).json({
      code: 422,
      message: "参数校验失败",
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  ok(res, {
    received: { name, value, type: type || "default" },
    processed: true,
    processedAt: new Date().toISOString(),
  }, "参数校验通过，处理成功");
});

// ─── PUT /api/v1/mock/echo-put ────────────────────────────────────────────────
// 用途：测试 PUT 请求的 Body（form-data / urlencoded）参数传递，将参数原样返回
router.put("/api/v1/mock/echo-put", upload.none(), (req, res) => {
  const contentType = req.headers["content-type"] || "";
  ok(res, {
    method: "PUT",
    contentType,
    body: req.body,
    query: req.query,
  }, "PUT 参数回显成功");
});

// ─── PUT /api/v1/mock/update/:id ─────────────────────────────────────────────
// 用途：模拟按资源 ID 更新数据，Path Param 中的 id + Body 参数一并回显
router.put("/api/v1/mock/update/:id", upload.none(), (req, res) => {
  const { id } = req.params;
  ok(res, {
    method: "PUT",
    resourceId: id,
    updates: req.body,
    query: req.query,
    updatedAt: new Date().toISOString(),
  }, `资源 [${id}] 更新成功`);
});

// ─── PUT /api/v1/mock/update-validate ────────────────────────────────────────
// 用途：带参数校验的更新接口，id / name / value 均为必填，缺少任意一项返回 422
router.put("/api/v1/mock/update-validate", upload.none(), (req, res) => {
  const { id, name, value } = req.body;
  const errors = [];
  if (!id)    errors.push("id 为必填项");
  if (!name)  errors.push("name 为必填项");
  if (!value) errors.push("value 为必填项");

  if (errors.length > 0) {
    return res.status(422).json({
      code: 422,
      message: "参数校验失败",
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  ok(res, {
    updated: { id, name, value },
    updatedAt: new Date().toISOString(),
  }, "校验通过，资源更新成功");
});

// ─── DELETE /api/v1/mock/delete/:id ──────────────────────────────────────────
// 用途：模拟按资源 ID 删除，Path Param 传入 id，返回被删除的资源信息
router.delete("/api/v1/mock/delete/:id", (req, res) => {
  const { id } = req.params;
  ok(res, {
    method: "DELETE",
    deletedId: id,
    deletedAt: new Date().toISOString(),
  }, `资源 [${id}] 删除成功`);
});

// ─── DELETE /api/v1/mock/delete-query ────────────────────────────────────────
// 用途：模拟按 Query 参数批量删除，ids（逗号分隔）为必填，缺少则返回 400
router.delete("/api/v1/mock/delete-query", (req, res) => {
  const { ids } = req.query;
  if (!ids) {
    return fail(res, "缺少必填参数 ids（多个 id 以英文逗号分隔）", 400);
  }
  const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
  ok(res, {
    method: "DELETE",
    deletedIds: idList,
    count: idList.length,
    deletedAt: new Date().toISOString(),
  }, `已批量删除 ${idList.length} 条资源`);
});

// ─── 辅助函数 ──────────────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

module.exports = router;
