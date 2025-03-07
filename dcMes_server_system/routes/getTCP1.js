// tcpServer.js

const net = require('net');
const iconv = require('iconv-lite');
const MerchantOrder = require('../model/audit/merchantOrder');
const Merchant = require('../model/audit/merchant');
const SmartScale = require('../model/audit/smartScale');
const dataEarlyWarning = require('../model/audit/dataEarlyWarning');
const merchant = require('../model/audit/merchant');

const {
  v4: uuidv4
} = require('uuid');
class TCPServer {
  constructor() {
    this.connections = []; // 新增数组来存储连接对象
    this.server = net.createServer((socket) => {
      console.log('Client connected');
      // 向客户端发送数据
      socket.write('UPL\tINF\t\r\n');
      // 将新连接添加到数组
      this.connections.push(socket);
      // 监听客户端发送的数据
      socket.on('data', async (data) => {
        const response = iconv.decode(data, 'GB2312'); // 使用正确的编码解码中文字符
        // const response = iconv.decode(responsedata, 'GB2312'); // 使用正确的编码解码中文字符
        // const response = iconv.decode(Buffer.from(responsedata, 'binary'), 'utf-8'); // 使用正确的编码解码中文字符

        console.log('获取设备返回的数据esponse: ', response);
        console.log(`Received data from client: ${response}`);
        let jsonData;
        if (response.indexOf('DWL\tREP') > -1) {
          console.log('主动获取商品订单信息');
          jsonData = convertToJSON(response, socket.remoteAddress);
          //获取到返回的值后进行查询并排重，将新的数据进行保存到数据库商品表
          findAndSave(jsonData);
          return;
        } else if (response.indexOf('ASK\tREP') > -1) {
          console.log('自动返回订单信息');
          console.log(response,'response')
          console.log(response.indexOf('PLU')== -1)
          if(response.indexOf('PLU')== -1){
            const match = response.match(/ASK\sREP\s(\d+)/);
            // 提取匹配到的编号
            const number = match ? match[1] : null;
            // 发送查询命令
            let queryCommandData1 = `UPL\tREP\t-${number}\t\r\n`;
            const queryCommand = queryCommandData1;
            socket.write(queryCommand);
          }else{
            console.log('商户操作电子称')
          }
          return;
        } else if (response.indexOf('INF') > -1) {
          console.log('获取设备信息结果');
          let jsonDatas = await convertToJSONDevice(response, socket.remoteAddress);
          console.log('jsonData: ', jsonDatas);
          findAndSaveDevice(jsonDatas);
          return;
        }

        return jsonData;
      });
      socket.on('close', () => {
        console.log(`Connection to device ${socket.remoteAddress} closed`);
      });
      // socket.on('timeout', () => {
      //   console.log('Timeout: No data received from client within the specified time');
      //   // 在超时时，可以选择断开连接或执行其他逻辑
      //   // socket.end();
      // });
      socket.on('error', async (err) => {
        console.log('err: ', err);
    
        
        let deviceData = await SmartScale.findOne({scaleIP:socket.remoteAddress}).exec();
        let scaleMacData = await merchant.findOne({scaleId:deviceData.scaleMac}).exec();
        if(scaleMacData){
         await SmartScale.updateOne({
          scaleIP: socket.remoteAddress
         }, {
           status: '断开连接',
           lastOnlineDate: new Date(),
         });

       let createData = {
         marketId:scaleMacData.marketId,
         merchantId:scaleMacData._id,
         type:'设备检测',
         status:'未处理',
         scaleID:deviceData.scaleMac,
         deviceStatus:'断开连接',
         description:scaleMacData.responsiblePerson+scaleMacData.name+'电子秤【deviceData.scaleMac】已离线',
       }
       var logindata = new dataEarlyWarning(createData)
       logindata.save(function (err, ccc) {
         if (err) {
           console.log('err: ', err);
         }
         console.log('ccc: ', ccc);
       })
        }else{
         await SmartScale.update({
           _id: deviceData._id
         }, {
           status: '断开连接',
           lastOnlineDate: new Date(),
         });
        }
        console.error(`Error connecting to device ${socket.remoteAddress}:`, err.message);
        this.connections = this.connections.filter(conn => conn !== socket);
      });
      // 监听客户端断开连接事件
      socket.on('end', async () => {
        console.log('Client disconnected');
        await SmartScale.updateOne({
          scaleIP: socket.remoteAddress
        }, {
          status: '断开连接',
          lastOnlineDate: new Date(),
        }).exec();
        // 从数组中移除断开连接的客户端
        this.connections = this.connections.filter(conn => conn !== socket);
      });
    });
  }

  start(PORT) {
    // 监听指定端口
    this.server.listen(PORT, async() => {
      console.log('PORT: ', PORT);

      await SmartScale.update({
      }, {
        status: '断开连接',
        lastOnlineDate: new Date(),
      });
      console.log(`Server listening on port ${PORT}`);
    });
  }

  // 添加一个方法用于向所有连接的客户端发送数据
  async sendToAllClients(message,IP) {
    // console.log('this.connections: ', this.connections);
    if(!!IP){
      console.log('IP: ', IP);
      let num = this.connections.findIndex(x=>x.remoteAddress === IP)
      console.log('num: ', num);
      if(num>-1){
         this.connections[num].write(message);
         return;
      }else{
        console.log('无IP地址相关的设备');
        return '无IP地址相关的设备';
      }
    }else{
      if (this.connections.length > 0) {
        for await (let client of this.connections){
          console.log('开始发送数据');
          client.write(message);
        }
        
      } else {
        console.log('没有客户端');
        let deviceDataList = await SmartScale.find().exec()
        for await (let deviceData of deviceDataList) {
           let scaleMacData = await merchant.findOne({scaleId:deviceData.scaleMac}).exec();
            await SmartScale.update({
              scaleMac: deviceData.scaleId
            }, {
              status: '断开连接',
              lastOnlineDate: new Date(),
            });
        }
        let createData = {
          type:'设备检测',
          status:'未处理',
          // scaleID:deviceData.scaleMac,
          deviceStatus:'断开连接',
          description:'全部电子秤已离线',
        }
        var logindata = new dataEarlyWarning(createData)
        logindata.save(function (err, ccc) {
          if (err) {
            console.log('err: ', err);
          }
          console.log('ccc: ', ccc);
        })
  
      }
  
    }
   
  }
}

const tcpServerInstance = new TCPServer();

module.exports = tcpServerInstance;

//查询并保存商品订单信息和接收自动发送的信息
async function findAndSave(data) {
  console.log('获取getdata: ', data);
  if (data.length > 0) {
    for await (e of data) {
      let resFindData = await MerchantOrder.find({
        FID: e.FID,
        FIP: e.IP
      }).exec()
      console.log('resFindData: ', resFindData);
      if (resFindData.length == 0) {
        let resDeviceData = await SmartScale.findOne({
          scaleIP: e.IP
        }).exec()
        let resIpData = await Merchant.findOne({
          scaleId: resDeviceData.scaleMac
        }).exec()
        // console.log('resIpData: ', resIpData);
        let createData = {
          merchantId: resIpData._id,
          orderNumber: uuidv4(),
          FID: e.FID,
          FIP: e.IP,
          time: e.time,
          SID: e.SID,
          totalAmount: e.totalAmount,
          scaleId: resDeviceData ? resDeviceData.scaleMac : e.IP,
          orderStatus: 1,
          orderTime: e.time,
          orderItems: [],
        };
        if (e['商品'].length > 0) {
          for await (let item of e['商品']) {
            createData.orderItems.push({
              productId: item['PLU编号'],
              productName: item['商品名'] ? item['商品名'] : '无',
              productUnit: item['单位'],
              productQuantity: item['数量重量'],
              quantity: item['数量重量'],
              unitPrice: item['单价'],
              price: item['金额'],
              category: item['类别']||'无'
            });
          }
        }
        console.log('createData: ', createData);


        var logindata = new MerchantOrder(createData)
        logindata.save(function (err, ccc) {
          if (err) {
            console.log('err: ', err);
          }
          console.log('ccc: ', ccc);

        })
      } else {
        console.log('该流水已存在');
      }
    }
  }
}
//查询并保存设备信息
async function findAndSaveDevice(jsonDataList) {
  console.log('jsonDataList: ', jsonDataList);

  let deviceDataList = await SmartScale.find().exec()
  console.log('deviceDataList: ', deviceDataList);
  //进行查询是否有已创建的数据
  if(deviceDataList.findIndex(x => x.scaleMac == jsonDataList[0].MAC)==-1){
    //不存在
    //创建电子称数据
    let createData = {
      scaleName: '默认电子称',
      scaleMac: jsonDataList[0].MAC,
      scaleIP: jsonDataList[0].IP,
      bindDate: new Date(),
      lastOnlineDate: new Date(),
    }
    var logindata = new SmartScale(createData)
    logindata.save(function (err, ccc) {
      if (err) {
        console.log('err: ', err);
      }
      console.log('ccc: ', ccc);

    })

  }else{
    //存在
    //更新电子称数据
    let resIpData = await SmartScale.find({
      scaleMac: jsonDataList[0].MAC
    }).exec()
    await SmartScale.update({
      _id: resIpData[0]._id
    }, {
      scaleIP: jsonDataList[0].IP,
      status: '正常运行',
      lastOnlineDate: new Date(),
    });
  }



  // for await (let deviceData of deviceDataList) {
  //   console.log('deviceData: ', deviceData);
  //   //循环获取到的所有设备
  //   console.log('设备jsonDataList: ', jsonDataList);
  //   //判断是否都在返回的设备信息里
  //   let num = jsonDataList.findIndex(x => x.MAC == deviceData.scaleMac)
  //   console.log('num: ', num);
  //   if (num == -1) {
      // await SmartScale.update({
      //   _id: deviceData._id
      // }, {
      //   status: '断开连接',
      //   lastOnlineDate: new Date(),
      // });
  //   }
  // }
  // for await (let jsonData of jsonDataList) {
  //   let resIpData = await SmartScale.find({
  //     scaleMac: jsonData.MAC
  //   }).exec()
  //   console.log('resIpData: ', resIpData);
  //   if (resIpData.length == 0) {
  //     let createData = {
  //       scaleName: '默认电子称',
  //       scaleMac: jsonData.MAC,
  //       scaleIP: jsonData.IP,
  //       bindDate: new Date(),
  //       lastOnlineDate: new Date(),
  //     }
  //     var logindata = new SmartScale(createData)
  //     logindata.save(function (err, ccc) {
  //       if (err) {
  //         console.log('err: ', err);
  //       }
  //       console.log('ccc: ', ccc);

  //     })
  //   } else {
  //     await SmartScale.update({
  //       _id: resIpData[0]._id
  //     }, {
  //       scaleIP: jsonData.IP,
  //       status: '正常运行',
  //       lastOnlineDate: new Date(),
  //     });
  //   }
  // }

}


async function convertToJSONDevice(data, IP) {

  const lines = data.split("\n");
  let dataList = []
  for await (const line of lines) {
    const match = line.match(/INM\s+(\S+)/);
    console.log('match: ', match);
    if (match && match[1]) {
      const value = match[1];
      console.log(value);
      dataList.push({
        MAC: value,
        IP: IP
      })
    }
  }

  //   const regex = /INM\s+(\S+)/;
  // const match = data.match(regex);

  // // 输出提取到的值
  // if (match && match[1]) {
  //   console.log("提取到的值:", match[1]);

  return dataList;
}


function convertToJSON(data, IP) {
  const lines = data.trim().split('\n');
  const result = [];
  let currentItem = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().split(/\s+/);

    if (line[0] === 'REP') {
      currentItem = {
        type: '交易信息',
        IP: IP,
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
        totalAmount:0 ,

      };
    } else if (line[0] === 'RES') {
      currentItem.商品.push({
        序号: line[1],
        金额: moveDecimal(line[2]),
        PLU编号: line[3],
        组号: line[4],
        部门号: line[5],
        成本: moveDecimal(line[6]),
        数量重量: moveDecimal(line[7]),
        单位: line[8],
        类型: line[9],
        税额: line[10] ? moveDecimal(line[10]) : 0,
        // 追溯码: line[11],
        // 文本2: line[12],
        // 文本3: line[13],
        // 文本4: line[14],
        单价: line[11] ? moveDecimal(line[11]) : 0,
        CoFID: line[12] ? line[12] : null,
        商品名: line[13] ? line[13] : null,
      });
      currentItem.totalAmount += parseFloat(moveDecimal(line[2]));
    } else if (line[0] === 'REE') {
      result.push(currentItem);
    }
  }
  return result;
}
function moveDecimal(str) {
const inputString = str
const array = inputString.split(',');
  if(array[1]){
  // 将字符串转换为数字
  const number = parseFloat(array[0]);

  // 检查是否成功解析为数字
  if (isNaN(number)) {
      return "输入无效";
  }

  // 将小数点向左移动指定位数
  const result = number / Math.pow(10, array[1]);

  console.log('result.toString(): ', result.toString());
  return result.toString();
  }else{

    console.log('str: ', str);
    return str;
  }
  }

