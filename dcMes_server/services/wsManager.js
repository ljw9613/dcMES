const WebSocket = require("ws");
const Machine = require("../model/project/machine");

class WebSocketManager {
  constructor() {
    // 存储所有的websocket连接
    this.connections = new Map();
  }

  // 初始化WebSocket服务器
  initialize(port) {
    this.wss = new WebSocket.Server({ port });

    console.log(`
========================================
    WebSocket 服务器初始化成功!
    端口: ${port}
    时间: ${new Date().toLocaleString()}
    连接地址: ws://localhost:${port}
========================================
        `);

    this.wss.on("connection", async (ws, req) => {
      // 解析URL查询参数
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      // 验证参数
      if (!this._validateConnection(token)) {
        console.log(`
>> WebSocket连接被拒绝
   IP地址: ${req.socket.remoteAddress}
   原因: 无效的认证参数
   时间: ${new Date().toLocaleString()}
            `);
        ws.close(4001, "无效的认证参数");
        return;
      }

      // 获取客户端IP地址并转换格式
      const ip = req.socket.remoteAddress.replace(/^.*:/, "");
      
      // 更新数据库中对应IP的设备状态
      try {
        const updatedMachine = await Machine.findOneAndUpdate(
          { machineIp: ip },
          { status: true },
          { new: true }
        );
        
        if (updatedMachine) {
          console.log(`
>> 设备状态已更新
   设备IP: ${ip}
   设备名称: ${updatedMachine.machineName}
   状态: 在线`);
        }
      } catch (error) {
        console.error('更新设备状态失败:', error);
      }

      // 使用IP地址和clientId创建唯一的用户ID
      const userId = this._generateUserId(ip);

      // 存储连接信息
      this.connections.set(userId, {
        ws,
        ip,
        connectTime: new Date(),
        isAlive: true,
      });

      console.log(`
>> 新的WebSocket连接
   用户ID: ${userId}
   IP地址: ${ip}
   连接时间: ${new Date().toLocaleString()}
   当前连接数: ${this.getConnectionsCount()}
            `);

      // 设置心跳检测
      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      // 处理消息
      ws.on("message", (message) => {
        this._handleMessage(userId, message);
      });

      // 处理连接关闭
      ws.on("close", () => {
        this._handleClose(userId);
      });

      // 发送欢迎消息
      ws.send(
        JSON.stringify({
          type: "connected",
          userId: userId,
          message: "连接成功",
        })
      );
    });

    // 设置定时心跳检测
    this._setupHeartbeat();
  }

  // 添加新的验证方法
  _validateConnection(token) {
    // 这里添加你的验证逻辑
    if (!token) {
      return false;
    }

    // 示例：验证token格式（这里应该根据你的实际需求修改）
    const isValidToken = token === "DcMes_Server_Token";

    return isValidToken;
  }

  // 修改用户ID生成方法
  _generateUserId(ip) {
    return `machien_${ip.replace(/[.:]/g, "_")}`;
  }

  // 处理接收到的消息
  _handleMessage(userId, message) {
    try {
      const data = JSON.parse(message);
      // console.log(`收到来自 ${userId} 的消息:`, data);

      // 这里可以添加消息处理逻辑
    } catch (error) {
      console.error("消息处理错误:", error);
    }
  }

  // 修改 _handleClose 方法来更新设备离线状态
  async _handleClose(userId) {
    const connection = this.connections.get(userId);
    if (connection) {
      try {
        await Machine.findOneAndUpdate(
          { machineIp: connection.ip },
          { status: false }
        );
      } catch (error) {
        console.error('更新设备离线状态失败:', error);
      }
    }
    
    console.log(`
>> WebSocket连接断开
   用户ID: ${userId}
   IP地址: ${connection?.ip}
   断开时间: ${new Date().toLocaleString()}
   剩余连接数: ${this.getConnectionsCount() - 1}
    `);
    this.connections.delete(userId);
  }

  // 设置心跳检测
  _setupHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 每30秒检测一次
  }

  // 向特定用户发送消息
  sendToUser(userId, message) {
    const connection = this.connections.get(userId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // 广播消息给所有连接的用户
  broadcast(message) {
    this.connections.forEach((connection) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    });
  }

  // 获取当前连接数
  getConnectionsCount() {
    return this.connections.size;
  }
}

module.exports = new WebSocketManager();
