const net = require('net');
const iconv = require('iconv-lite');

// createDeviceSocket('192.168.1.13',33581,'查询设备信息')//查询设备信息
// createDeviceSocket('192.168.1.13',33581,'查询设备信息')//设备IP  设备端口 查询类型 （ 查询设备信息 / 查询设备的打印商品信息 ）
// createDeviceSocket('192.168.1.14',33581,'查询设备信息')//设备IP  设备端口 查询类型 （ 查询设备信息 / 查询设备的打印商品信息 ）

const devices = [
  // {
  //   ip: '192.168.1.13',
  //   port: 33581,
  //   queryCommand: '查询设备的打印商品信息'
  // },
  { ip: '192.168.1.14', port:60000,queryCommand:'查询设备信息' }
  // 可以继续添加更多设备的 IP 地址和端口号
];
const deviceSockets = devices.map(device => createDeviceSocket(device.ip, device.port, device.queryCommand));

function createDeviceSocket(deviceIp, devicePort, queryCommand) {
  const socket = new net.Socket();
  let queryCommandData = null;
  if (queryCommand == '查询设备的打印商品信息') {
    queryCommandData = 'UPL\tREP\t-1\t\r\n';
  } else {
    queryCommandData = 'UPL\tINF\t\r\n';
  }

  function handleData(data) {
    const response = iconv.decode(data.toString('utf8'), 'GB2312'); // 使用正确的编码解码中文字符
    let jsonData;

    if (response.indexOf('ASK') == -1) {
      if (queryCommand == '查询设备的打印商品信息') {
        jsonData = convertToJSON(response);
      } else {
        jsonData = response;
      }
    // 处理接收到的数据
    console.log(`Received data from device ${deviceIp}:${devicePort}:`, jsonData);
    } else {
      const match = response.match(/ASK\sREP\s(\d+)/);
      // 提取匹配到的编号
      const number = match ? match[1] : null;
          // 发送查询命令
          queryCommandData=`UPL\tREP\t-${number}\t\r\n`;
    const queryCommand = queryCommandData;
    console.log('queryCommand: ', queryCommand);
    socket.write(queryCommand);
    }
  }

  socket.connect(devicePort,deviceIp, () => {
    console.log(`Connected to device ${deviceIp}:${devicePort}`);

    // 发送查询命令
    const queryCommand = queryCommandData;
    socket.write(queryCommand);
  });

  socket.on('data', handleData);

  socket.on('close', () => {
    console.log(`Connection to device ${deviceIp}:${devicePort} closed`);
  });

  socket.on('error', (err) => {
    console.error(`Error connecting to device ${deviceIp}:${devicePort}:`, err.message);
  });

  // 监听 'end' 事件，该事件在连接关闭时触发
  socket.on('end', () => {
    console.log(`Connection to device ${deviceIp}:${devicePort} ended`);
  });

  return socket;
}









function convertToJSON(data) {
  const lines = data.trim().split('\n');
  const result = [];
  let currentItem = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().split(/\s+/);

    if (line[0] === 'REP') {
      currentItem = {
        type: '交易信息',
        time: new Date(`20${line[1]}-${line[2]}-${line[3]} ${line[4]}:${line[5]}:${line[6]}`),
        年: line[1],
        月: line[2],
        日: line[3],
        时: line[4],
        分: line[5],
        秒: line[6],
        FID: line[7],
        SID: line[8],
        营业员: line[9],
        商品: [],
      };
    } else if (line[0] === 'RES') {
      currentItem.商品.push({
        序号: line[1],
        金额: line[2].split(',')[1],
        PLU编号: line[3],
        组号: line[4],
        部门号: line[5],
        成本: line[6].split(',')[1],
        数量重量: line[7].split(',')[1],
        单位: line[8],
        类型: line[9],
        税额: line[10].split(',')[1],
        追溯码: line[11],
        文本2: line[12],
        文本3: line[13],
        文本4: line[14],
        单价: line[15] ? line[15].split(',')[1] : '0',
        CoFID: line[16] ? line[16] : null,
        商品名: line[17] ? line[17] : null,
      });
    } else if (line[0] === 'REE') {
      result.push(currentItem);
    }
  }
  return result;
}