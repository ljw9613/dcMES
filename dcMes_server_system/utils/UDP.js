const dgram = require('dgram');

// 创建UDP套接字
const udpSocket = dgram.createSocket('udp4');

// 监听指定端口
const PORT = 33584;

udpSocket.on('listening', () => {
  const address = udpSocket.address();
  console.log(`UDP server listening on ${address.address}:${address.port}`);
});

// 监听数据
udpSocket.on('message', (msg, rinfo) => {
  console.log(`Received data from ${rinfo.address}:${rinfo.port}: ${msg.toString()}`);
});

// 绑定端口
udpSocket.bind(PORT);
