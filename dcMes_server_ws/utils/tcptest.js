const net = require("net");
const fs = require("fs");
const iconv = require('iconv-lite');
const path = require('path');
// 创建一个TCP服务器实例
const server = net.createServer((socket) => {
  // 新的连接建立时触发

  console.log("客户端已连接");
  console.log('客户端已连接，IP地址:', socket.remoteAddress);
  // let queryCommandData = "UPL\tREP\t-43\t\r\n";
  // let queryCommandData = 'UPL\tINF\t\r\n';

const filePath = path.join(__dirname, 'plu_data.txt'); 
  fs.readFile(filePath, 'utf-8', (err, fileContent) => {
    if (err) {
        console.error('读取文件时发生错误:', err.message);
        return;
    }
        // 将文件内容从UTF-8转换为GBK
        const gbkContent = iconv.encode(fileContent, 'gbk');
        console.log('gbkContent: ', gbkContent);
    socket.write(gbkContent, (err) => {
      if (err) {
        console.error('发送文件时发生错误:', err.message);
        return;
      }
      console.log('文件发送成功');
      // socket.end();  // 关闭连接
    });
  });
  // 商品信息
  //  let queryCommandData = "192.168.1.13 PLU 13 ABC123  1234567890123 产品A 10.99 2 1 30  0,3\r\n"
  //  let queryCommandData = "0023F09A932 PLU	4	10001		1	1500,2	0,0	0,0	0	0	0	0	0	0	9	苹果								0	0	0	0	1	0	0	0	0	10	0	0	0,0	0,0	0	127	0,0	0,0	0,0	0	127	0,0	0,0	0,0	0	127	0,0	0,0	0,0	0	127	0,0	0,0	0,0	0	0	0	0	0	0	0	"
   
  //  console.log('queryCommandData: ', queryCommandData);
//   socket.write(queryCommandData, 'utf-8', (err) => {
//     console.log('err: ', err);
//     console.log('商品信息发送成功');
//     // socket.end();  // 关闭连接
// });


  // 监听来自客户端的数据
  socket.on("data", (data) => {
    console.log('data: ', data.toString('utf8'));
    const response = iconv.decode(data.toString('utf8'), 'GB2312'); // 使用正确的编码解码中文字符
    console.log('response: ', response);
    let jsonData;
if(response.indexOf('DWL\tREP')>-1){
  jsonData = convertToJSON(response);
  console.log('jsonData: ', jsonData);
}else if(response.indexOf('ASK')>-1){
  const match = response.match(/ASK\sREP\s(\d+)/);
  // 提取匹配到的编号
  const number = match ? match[1] : null;
      // 发送查询命令
     let queryCommandData1=`UPL\tREP\t-${number}\t\r\n`;
const queryCommand = queryCommandData1;
socket.write(queryCommand);
return;
}else{
  jsonData = response;
}
    console.log("从客户端接收到的数据:", jsonData);
    console.log("从客户端接收到的数据:", socket.remoteAddress);
    

    // 向客户端发送回应数据
    // socket.write('你好，客户端！');
  });

  // 监听连接断开事件
  socket.on("end", () => {
    console.log("客户端已断开连接");
  });

  // 监听连接错误事件
  socket.on("error", (err) => {
    console.error("连接错误:", err);
  });
});

// 监听指定端口
const serverPort = 33582;
server.listen(serverPort, () => {
  console.log(`服务器正在监听端口 ${serverPort}`);
});





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