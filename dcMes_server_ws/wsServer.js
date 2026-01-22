#!/usr/bin/env node

const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const wsManager = require('./services/wsManager');
const Machine = require('./model/project/machine');

// 创建 Express 应用
const app = express();

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 数据库连接
require('./db')();

// WebSocket 端口
const wsPort = process.env.WS_PORT || 2223;
// HTTP API 端口
const apiPort = process.env.WS_API_PORT || 2224;

// 初始化 WebSocket 管理器
wsManager.initialize(wsPort);

// API 路由
// 发送刷新命令到指定设备
app.post("/api/v1/machine/refresh", async (req, res) => {
  try {
    const { machineIds } = req.body;

    if (!machineIds || machineIds.length === 0) {
      return res.json({
        code: 40001,
        message: "设备ID不能为空",
      });
    }

    const machines = await Machine.find({ _id: { $in: machineIds } });
    if (machines.length === 0) {
      return res.json({
        code: 40002,
        message: "设备ID不存在",
      });
    }

    for (const machine of machines) {
      if (machine.machineIp) {
        const userId = `machien_${machine.machineIp.replace(/[.:]/g, "_")}`;
        wsManager.sendToUser(userId, {
          type: "command",
          action: "refresh",
          timestamp: new Date().getTime(),
        });
      }
    }

    res.json({
      code: 20000,
      message: "刷新命令已发送",
    });
  } catch (error) {
    console.error("发送刷新命令失败:", error);
    res.json({
      code: 50000,
      message: "发送刷新命令失败",
    });
  }
});

// 获取所有连接的设备
app.get("/api/v1/machine/connections", (req, res) => {
  try {
    const connections = [];
    wsManager.connections.forEach((connection, userId) => {
      connections.push({
        userId,
        ip: connection.ip,
        connectTime: connection.connectTime,
        isAlive: connection.isAlive
      });
    });

    res.json({
      code: 20000,
      data: connections,
      count: connections.length
    });
  } catch (error) {
    console.error("获取连接信息失败:", error);
    res.json({
      code: 50000,
      message: "获取连接信息失败"
    });
  }
});

// 广播消息
app.post("/api/v1/machine/broadcast", (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.json({
        code: 40001,
        message: "消息内容不能为空"
      });
    }
    
    wsManager.broadcast(message);
    
    res.json({
      code: 20000,
      message: "广播消息已发送"
    });
  } catch (error) {
    console.error("广播消息失败:", error);
    res.json({
      code: 50000,
      message: "广播消息失败"
    });
  }
});

// 发送消息到指定设备
app.post("/api/v1/machine/send", async (req, res) => {
  try {
    const { machineIp, message } = req.body;
    
    if (!machineIp) {
      return res.json({
        code: 40001,
        message: "设备IP不能为空"
      });
    }
    
    if (!message) {
      return res.json({
        code: 40002,
        message: "消息内容不能为空"
      });
    }
    
    const userId = `machien_${machineIp.replace(/[.:]/g, "_")}`;
    const result = wsManager.sendToUser(userId, message);
    
    if (result) {
      res.json({
        code: 20000,
        message: "消息已发送"
      });
    } else {
      res.json({
        code: 40003,
        message: "设备不在线或连接已断开"
      });
    }
  } catch (error) {
    console.error("发送消息失败:", error);
    res.json({
      code: 50000,
      message: "发送消息失败"
    });
  }
});

// 创建 HTTP 服务器
const server = http.createServer(app);

// 启动服务器
server.listen(apiPort, () => {
  console.log(`
========================================
    WebSocket API 服务器已启动!
    端口: ${apiPort}
    时间: ${new Date().toLocaleString()}
    API地址: http://localhost:${apiPort}
========================================
  `);
}); 