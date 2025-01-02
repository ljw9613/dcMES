/*
 * @name: **列表
 * @content: 
 * @Author: joyce
 * @Date: 2020-09-09 10:44:39
a'da'w'd */
let mongoose = require("mongoose");

module.exports = app => {
  let mongodbUrl =
    "mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes";
  // "mongodb://seafoodStreet:seafoodStreet888@47.115.19.76:27017/seafoodStreet";//本地测试
  // 'mongodb://dcMesCs:ZxbM3zijfmDCjHZY@127.0.0.1:27017/dcMesCs';//线上测试
  mongoose.connect(
    mongodbUrl,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    },
    err => {
      if (err) {
        console.log("数据库链接失败:", err);
      }
    }
  );

  mongoose.connection.once("open", () => {
    console.log("数据库链接成功");
  });
};
