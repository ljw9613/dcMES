const express = require(`express`);
const router = express.Router();
const axios = require("axios");

// WebSocket 服务的 API 地址
const WS_API_URL = "http://localhost:2224";

// 发送刷新命令到指定设备
router.post("/api/v1/machine/refresh", async (req, res) => {
  try {
    const { machineIds } = req.body;

    if (machineIds.length === 0) {
      return res.json({
        code: 40001,
        message: "设备ID不能为空",
      });
    }

    // 调用 WebSocket 服务的 API
    const response = await axios.post(`${WS_API_URL}/api/v1/machine/refresh`, {
      machineIds,
    });

    res.json(response.data);
  } catch (error) {
    console.error("发送刷新命令失败:", error);
    res.json({
      code: 50000,
      message: "发送刷新命令失败",
    });
  }
});

// 获取所有连接的设备
router.get("/api/v1/machine/connections", async (req, res) => {
  try {
    const response = await axios.get(
      `${WS_API_URL}/api/v1/machine/connections`
    );
    res.json(response.data);
  } catch (error) {
    console.error("获取连接信息失败:", error);
    res.json({
      code: 50000,
      message: "获取连接信息失败",
    });
  }
});

// 广播消息
router.post("/api/v1/machine/broadcast", async (req, res) => {
  try {
    const response = await axios.post(
      `${WS_API_URL}/api/v1/machine/broadcast`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error("广播消息失败:", error);
    res.json({
      code: 50000,
      message: "广播消息失败",
    });
  }
});

// 发送消息到指定设备
router.post("/api/v1/machine/send", async (req, res) => {
  try {
    const response = await axios.post(
      `${WS_API_URL}/api/v1/machine/send`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error("发送消息失败:", error);
    res.json({
      code: 50000,
      message: "发送消息失败",
    });
  }
});

module.exports = router;
