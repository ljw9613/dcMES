var mongoose = require('mongoose');
const message = require('../model/message')
const express = require(`express`)
const router = express.Router()
/* 
  入参是目标时间的小时数，取值0-23，当然可以根据需要拓展成分钟数，这里主要是提供思路所以从简
 */

setRegular(1); //比如目标是每天凌晨1点


function setRegular(targetHour) {
  var timeInterval, nowTime, nowSeconds, targetSeconds

  nowTime = new Date()
      // 计算当前时间的秒数
  nowSeconds = nowTime.getHours() * 3600 + nowTime.getMinutes() * 60 + nowTime.getSeconds()

  // 计算目标时间对应的秒数
  targetSeconds = targetHour * 3600

  //  判断是否已超过今日目标小时，若超过，时间间隔设置为距离明天目标小时的距离
  timeInterval = targetSeconds > nowSeconds ? targetSeconds - nowSeconds : targetSeconds + 24 * 3600 - nowSeconds

  setTimeout(getProductFileList, timeInterval * 1000)
}

function getProductFileList() {
  outTime()
  //数据处理函数
  setTimeout(getProductFileList, 24 * 3600 * 1000) //之后每天调用一次
}


async function outTime(params) {
  var now = new Date()
  var result =await message.updateMany({"end_time" : { $lte : now },'content.status':'代办中'},{
    $set:{
      'content.$.status':'已超时'
    }
  }).exec()
  console.log(result,'result')
}

module.exports = router

