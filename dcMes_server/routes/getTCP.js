const net = require('net');
const iconv = require('iconv-lite');
const {
  createPool
} = require('generic-pool');
const fs = require("fs");
const path = require('path');

let express = require('express');
let router = express.Router();
const tcpServerInstance = require('./getTCP1');
const Product = require('../model/audit/product');
const Merchant = require('../model/audit/merchant');
const SmartScale = require('../model/audit/smartScale');

tcpServerInstance.start(33582);


// Express Route
router.post('/api/v1/getTCPTest', async (req, res, next) => {
  console.log('req: ', req.body);
  // 获取请求参数等逻辑
  const requestData = req.body.tcpData;
  try {
    const filePath = path.join(__dirname, '../utils/SCP.txt'); 
    fs.readFile(filePath, 'utf-8', (err, fileContent) => {
      if (err) {
          console.error('读取文件时发生错误:', err.message);
          return;
      }
          // 将文件内容从UTF-8转换为GBK
          const gbkContent = iconv.encode(fileContent, 'gbk');
          // console.log('fileContent: ', fileContent);
          //  let gbkContent = runConsoleTask(fileContent)
  // sendLine('ZSK\tZTT\t');
  // console.log('gbkContent: ', gbkContent);
          tcpServerInstance.sendToAllClients(gbkContent);

          // tcpServerInstance.sendToAllClients(gbkContent);

    res.status(200).json({
      message: '数据已发送到 TCP 服务器',
      data:fileContent,
      gbkContent:gbkContent,
    });
    });
  } catch (error) {
    console.error('无法获取有效的 TCP 连接:', error);
    res.status(500).json({
      code:200,
      error: '无法连接到 TCP 服务器'
    });
  }
});




// Express Route
router.post('/api/v1/getTCP', async (req, res, next) => {
  console.log('req: ', req.body);
  // 获取请求参数等逻辑
  const {tcpData,IP} = req.body;
  try {
    tcpServerInstance.sendToAllClients(tcpData,IP)

    res.status(200).json({
      code:200,
      message: '数据已发送到 TCP 服务器'
    });
  } catch (error) {
    console.error('无法获取有效的 TCP 连接:', error);
    res.status(500).json({
      code:200,
      error: '无法连接到 TCP 服务器'
    });
  }
});

//上发商品至电子称
router.post('/api/v1/postProductToDevice', async (req, res, next) => {
  console.log('req: ', req.body);
  // 获取请求参数等逻辑
  //对tcpData数据进行转化为指定格式进行发送
  try {
   let getData = await Product.findOne({_id:req.body._id}).exec();
   console.log('getData: ', getData);

   if(!getData){
      throw new Error('没有找到对应的商品信息');
    }
    let merchantData = await Merchant.findOne({_id:getData.merchantId}).exec();
    if(!merchantData.scaleId){
      res.status(200).json({
        code:200,
        message: '商户无绑定设备MAC',
      });
      return;
    }
    let deviceData = await SmartScale.findOne({scaleMac:merchantData.scaleId}).exec();
    if(!deviceData){
      res.status(200).json({
        code:200,
        message: '无设备MAC：'+merchantData.scaleId,
      });
      return;
    }
    var tcpData = [{    
      IP:deviceData.scaleIP,
      number:getData.number,
      sku:getData.sku?getData.sku:'',
      code:getData.code?getData.code:'',
      billingMethod:getData.billingMethod,
      price:getData.price,
      name:getData.name?getData.name:''}]
    console.log('tcpData: ', tcpData);
    let toProduct = await convertAllProducts(tcpData)
    console.log(toProduct,'toProduct: ', );
    const formattedData = `DWL	PLU	\n${toProduct}END	PLU	\n`;
    console.log('formattedData: ', formattedData);
        const gbkContent = iconv.encode(formattedData, 'gbk');
        console.log('gbkContent: ', gbkContent);

   await tcpServerInstance.sendToAllClients(gbkContent,deviceData.scaleIP)
    res.status(200).json({
      code:200,
      message: '商品已发送到 电子称上',
      // data:formattedData,
      gbkContent:gbkContent,
    });
  } catch (error) {
    console.error('无法获取有效的 TCP 连接:', error);
    res.status(500).json({
      code:200,
      error: '无法连接到 TCP 服务器'
    });
  }
});

//上发商品至电子称(快捷键)SCP
router.post('/api/v1/postProductToDeviceSCP', async (req, res, next) => {
  console.log('req: ', req.body);
  // 获取请求参数等逻辑
  //对tcpData数据进行转化为指定格式进行发送
  try {
   let getData = await Product.findOne({_id:req.body._id}).exec();
   if(!getData){
      throw new Error('没有找到对应的商品信息');
    }
    if(!getData.pageNumber&&!getData.serialNumber){
      res.status(200).json({
      code:200,
      message: '无设置快捷键',
    });
    return;
    }
    let merchantData = await Merchant.findOne({_id:getData.merchantId}).exec();
    if(!merchantData.scaleId){
      res.status(200).json({
        code:200,
        message: '商户无绑定设备MAC',
      });
      return;
    }
    let deviceData = await SmartScale.findOne({scaleMac:merchantData.scaleId}).exec();
    if(!deviceData){
      res.status(200).json({
        code:200,
        message: '无设备MAC：'+merchantData.scaleId,
      });
      return;
    }
   var scpData = [{
    IP:deviceData.scaleIP,
    pageNumber:(getData.pageNumber-1)>-1?(getData.pageNumber-1):0,
    serialNumber:getData.serialNumber,
    number:getData.number,
    }]
    let toSCP = await convertAllProductsSCP(scpData)
    console.log('toSCP: ', toSCP);
    
    const formattedData = `DWL	SCP	\n${toSCP}END	SCP	\n`;
    console.log('formattedData: ', formattedData);
        const gbkContent = iconv.encode(formattedData, 'gbk');
        console.log('gbkContent: ', gbkContent);
        console.log('deviceData.scaleIP: ', deviceData.scaleIP);
    tcpServerInstance.sendToAllClients(gbkContent,deviceData.scaleIP)
    res.status(200).json({
      code:200,
      message: '设置快捷键成功',
      // data:formattedData,
      gbkContent:gbkContent,
    });
    // const filePath = path.join(__dirname, '../utils/SCP.txt');  
    // const filePath = path.join(__dirname, '../utils/SCP.txt'); 
    // fs.readFile(filePath, 'utf-8', (err, fileContent) => {
    //   if (err) {
    //       console.error('读取文件时发生错误:', err.message);
    //       return;
    //   }
    //       // 将文件内容从UTF-8转换为GBK
    //       const gbkContent = iconv.encode(fileContent, 'gbk');
    //       console.log('gbkContent: ', gbkContent);
    //       tcpServerInstance.sendToAllClients(gbkContent);

    // res.status(200).json({
    //   message: '数据已发送到 TCP 服务器',
    //   data:fileContent,
    //   gbkContent:gbkContent,
    // });
    // });
  } catch (error) {
    console.error('无法获取有效的 TCP 连接:', error);
    res.status(500).json({
      code:200,
      error: '无法连接到 TCP 服务器'
    });
  }
});



//删除商品至电子称
router.post('/api/v1/deleteProductToDevice', async (req, res, next) => {
  console.log('req: ', req.body);
  // 获取请求参数等逻辑
  //对tcpData数据进行转化为指定格式进行发送
  try {
   let getData = await Product.findOne({_id:req.body._id}).exec();
   console.log('getData: ', getData);
   if(!getData){
      throw new Error('没有找到对应的商品信息');
    }
    let merchantData = await Merchant.findOne({_id:getData.merchantId}).exec();
    if(!merchantData.scaleId){
      res.status(200).json({
        code:200,
        message: '商户无绑定设备MAC',
      });
      return;
    }
    let deviceData = await SmartScale.findOne({scaleMac:merchantData.scaleId}).exec();
    if(!deviceData){
      res.status(200).json({
        code:200,
        message: '无设备MAC：'+merchantData.scaleId,
      });
      return;
    }
    var tcpData = [{    
      IP:deviceData.scaleIP,
      number:getData.number,
      sku:getData.sku?getData.sku:'',
      code:getData.code?getData.code:'',
      billingMethod:getData.billingMethod,
      price:getData.price,
      name:getData.name?getData.name:''}]
    console.log('tcpData: ', tcpData);
    let toProduct = await convertAllProductsDelete(tcpData)
    console.log(toProduct,'toProduct: ', );
    const formattedData = `DWL	PLU	\n${toProduct}END	PLU	\n`;
    console.log('formattedData: ', formattedData);
        const gbkContent = iconv.encode(formattedData, 'gbk');
        console.log('gbkContent: ', gbkContent);


   await tcpServerInstance.sendToAllClients(gbkContent,deviceData.scaleIP)
    res.status(200).json({
      code:200,
      message: '电子称上的商品已删除',
      // data:formattedData,
      gbkContent:gbkContent,
    });
  } catch (error) {
    console.error('无法获取有效的 TCP 连接:', error);
    res.status(500).json({
      code:200,
      error: '无法连接到 TCP 服务器'
    });
  }
});
module.exports = router;

const convertToDWLFormat = (productInfo) => {
  const {
    IP,
    number,
    SCP,
    sku,
    code,
    billingMethod,
    price,
    name
  } = productInfo;
  console.log('convertNumber(price): ', moveDecimalRight(price));
  return `PLU	${number}	${sku}	${code}	${billingMethod === '按重量销售' ? 1 : 1}	${moveDecimalRight(price)}	0,0	0,0	0	0	0	0	0	0	9	${name}								0	0	0	0	1	0	0	0	0	10	0	0	0,0	0,0	0	127	0,0	0,0	0,0	0	127	0,0	0,0	0,0	0	127	0,0	0,0	0,0	0	127	0,0	0,0	0,0	0	0	0	0	0	0	0	\n`
};
const convertToDWLFormatDelete = (productInfo) => {
  const {
    IP,
    number,
    SCP,
    sku,
    code,
    billingMethod,
    price,
    name
  } = productInfo;
  console.log('convertNumber(price): ', moveDecimalRight(price));
  return `CLR_PLU	${number}	${sku}	${code}	${billingMethod === '按重量销售' ? 1 : 1}	${moveDecimalRight(price)}	0,0	0,0	0	0	0	0	0	0	9	${name}								0	0	0	0	1	0	0	0	0	10	0	0	0,0	0,0	0	127	0,0	0,0	0,0	0	127	0,0	0,0	0,0	0	127	0,0	0,0	0,0	0	127	0,0	0,0	0,0	0	0	0	0	0	0	0	\n`
  // `PLU\t${number}\t${sku}\t${code}\t${billingMethod === '按重量销售' ? 1 : 2}\t${convertNumber(price)}\t0,0\t1,0\t0\t0\t0\t0\t0\t0\t9\t${description}\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t0\t0\t0\t0\t1\t0\t0\t0\t0\t10\t0\t0\t0.0\t0.0\t0\t0\t0.0\t0.0\t0.0\t0\t0\t0.0\t0.0\t0.0\t0\t0\t0.0\t0.0\t0.0\t0\t0\t0.0\t0.0\t0.0\t0\t0\t0\t0\t0\t0\t0\t`;
};
const convertToDWLFormatSCP = (productInfo) => {
  const {
    IP,
    number,
    pageNumber,
    serialNumber
  } = productInfo;
  return `SCP	${pageNumber}	${serialNumber}	${number}	\n`
};

const convertAllProducts = async(products) => {
  return await products.map(convertToDWLFormat).join('\n');
};
const convertAllProductsDelete = async(products) => {
  return await products.map(convertToDWLFormatDelete).join('\n');
};
const convertAllProductsSCP = async(products) => {
  return await products.map(convertToDWLFormatSCP).join('\n');
};
function moveDecimalRight(str, places) {
  const inputString = str.toString();
const array0 = inputString.replace('.', '');
const array1 = inputString.indexOf('.');
  if(array1>-1){
    const result1= array0.length-array1;
    
  return array0.toString()+','+result1.toString();
  }else{
  return str.toString();
}
}
// // TCP Server Logic
// function startTcpServer(port) {
//   const server = net.createServer((socket) => {
//     // 新的连接建立时触发

//     console.log("客户端已连接");
//     console.log('客户端已连接，IP地址:', socket.remoteAddress);
//     // let queryCommandData = "UPL\tREP\t-43\t\r\n";
//     // let queryCommandData = 'UPL\tINF\t\r\n';

//   const filePath = path.join(__dirname, '../utils/plu_data.txt'); 
//     fs.readFile(filePath, 'utf-8', (err, fileContent) => {
//       if (err) {
//           console.error('读取文件时发生错误:', err.message);
//           return;
//       }
//           // 将文件内容从UTF-8转换为GBK
//           const gbkContent = iconv.encode(fileContent, 'gbk');
//           console.log('gbkContent: ', gbkContent);
//       socket.write(gbkContent, (err) => {
//         if (err) {
//           console.error('发送文件时发生错误:', err.message);
//           return;
//         }
//         console.log('文件发送成功');
//         // socket.end();  // 关闭连接
//       });
//     });
//     // 商品信息
//     //  let queryCommandData = "192.168.1.13 PLU 13 ABC123  1234567890123 产品A 10.99 2 1 30  0,3\r\n"
//     //  let queryCommandData = "0023F09A932 PLU	4	10001		1	1500,2	0,0	0,0	0	0	0	0	0	0	9	苹果								0	0	0	0	1	0	0	0	0	10	0	0	0,0	0,0	0	127	0,0	0,0	0,0	0	127	0,0	0,0	0,0	0	127	0,0	0,0	0,0	0	127	0,0	0,0	0,0	0	0	0	0	0	0	0	"

//     //  console.log('queryCommandData: ', queryCommandData);
//   //   socket.write(queryCommandData, 'utf-8', (err) => {
//   //     console.log('err: ', err);
//   //     console.log('商品信息发送成功');
//   //     // socket.end();  // 关闭连接
//   // });


//     // 监听来自客户端的数据
//     socket.on("data", (data) => {
//       console.log('data: ', data.toString('utf8'));
//       const response = iconv.decode(data.toString('utf8'), 'GB2312'); // 使用正确的编码解码中文字符
//       console.log('response: ', response);
//       let jsonData;
//   if(response.indexOf('DWL\tREP')>-1){
//     console.log('主动获取商品订单信息');
//     jsonData = convertToJSON(response);
//     console.log('jsonData: ', jsonData);
//   }else if(response.indexOf('ASK')>-1){
//     console.log('自动返回订单信息');
//     const match = response.match(/ASK\sREP\s(\d+)/);
//     // 提取匹配到的编号
//     const number = match ? match[1] : null;
//         // 发送查询命令
//        let queryCommandData1=`UPL\tREP\t-${number}\t\r\n`;
//   const queryCommand = queryCommandData1;
//   socket.write(queryCommand);
//   return;
//   }if(response.indexOf('UPL\tINF')>-1){
//     console.log('获取设备信息');
//     socket.write(response);
//   }
//   else{
//     console.log('获取设备信息结果');
//     jsonData = response;
//   }
//       console.log("从客户端接收到的数据:", jsonData);
//       console.log("从客户端接收到的数据:", socket.remoteAddress);


//       // 向客户端发送回应数据
//       // socket.write('你好，客户端！');
//     });

//     // 监听连接断开事件
//     socket.on("end", () => {
//       console.log("客户端已断开连接");
//     });

//     // 监听连接错误事件
//     socket.on("error", (err) => {
//       console.error("连接错误:", err);
//     });
//   });




//   // 启动服务器
//   server.listen(port, () => {
//     console.log(`服务器正在监听端口 ${port}`);
//   });
//   // 返回 server 对象，以便在需要时关闭服务器
//   // return server;
// }



function sendDataToClient(socket, data) {
  // 将数据从 UTF-8 转换为 GBK
  const gbkData = iconv.encode(data, 'gbk');

  // 向客户端发送数据
  socket.write(gbkData, (err) => {
    if (err) {
      console.error('发送数据时发生错误:', err.message);
    } else {
      console.log('数据成功发送给客户端');
    }
  });
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