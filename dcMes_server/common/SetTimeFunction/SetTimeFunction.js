const express = require(`express`)
const router = express.Router()

//表
var mongoose = require('mongoose');
//用户表
const Enrollee = mongoose.model('Enrollee');
//猎头表
const Headhunter = mongoose.model('Headhunter');

//定时查看完成默认收货方法
function clearUserVip() {
  try {
	
   var nowdate = new Date();
   //当前时间
   Enrollee.updateMany({
     "vip_level": 1, "vip_levelTime": {
       $lte: nowdate
     }
   }, {
     $set: {
       "customer_level": 0
     }
   }, function (err, docs) {
   
   })
  } catch (e) {
    res.send(e)
  }


}


//定时清除猎头vip
function clearHRVip() {
  try {
	
   var nowdate = new Date();
   //当前时间
   Headhunter.updateMany({
     "vip_level": 1, "vip_levelTime": {
       $lte: nowdate
     }
   }, {
     $set: {
       "customer_level": 0
     }
   }, function (err, docs) {
		
   })
  } catch (e) {
    res.send(e)
  }
}



module.exports = {
  clearUserVip,
  clearHRVip
}