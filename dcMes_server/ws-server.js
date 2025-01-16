const WebSocket = require('ws');
const Redis = require('ioredis');
const Machine = require("./model/project/machine");

// Redis客户端实例
const pub = new Redis();
const sub = new Redis();

const WS_PORT = process.env.WS_PORT || 8080;

// 创建WebSocket服务器
const wss = new WebSocket.Server({ port: WS_PORT });

// 存储所有的websocket连接
const connections = new Map();

// Redis订阅处理
sub.subscribe('ws-broadcast', (err) => {
  if (err) console.error('Redis订阅错误:', err);
});

sub.on('message', (channel, message) => {
  if (channel === 'ws-broadcast') {
    broadcast(JSON.parse(message));
  }
});

// WebSocket连接处理
wss.on('connection', async (ws, req) => {
  // ... 原有的connection处理逻辑 ...
});

// 广播消息函数
function broadcast(message) {
  connections.forEach((connection) => {
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
    }
  });
}

console.log(`WebSocket服务器运行在端口 ${WS_PORT}`); 