const express = require(`express`);
const router = express.Router();
const product = require("../model/audit/product");
const productLog = require("../model/audit/productLog");

const schedule = require("node-schedule");

//每日自动保存商品信息

async function autoSaveProductLog() {
  //获取所有当日商品信息
  let productData = await product.find({}).exec();
  for (const iterator of productData) {
    let productLogData = {
      productId: iterator._id, // 所属商品
      name: iterator.name,
      // 商品描述
      description: iterator.description,
      // 商品价格
      price: iterator.price,
      // 商品价格
      unit: iterator.unit,
      // 商品产地
      address: iterator.address,
    };
    console.log(productLogData);

    var logindata = new productLog(productLogData);
    logindata.save(function (err, ccc) {
      if (err) {
        console.log("error");
      }
      console.log(iterator.name + "存储成功" + new Date());
    });
  }
}

const scheduleCronstyle = () => {
  console.log("定时任务开启");
  //每天的凌晨1点1分30秒触发
  schedule.scheduleJob("30 1 1 * * *", () => {
    autoSaveProductLog();
    console.log("scheduleCronstyle:" + new Date());
  });
};

scheduleCronstyle();

// router.post("/api/v1/user/logout", async (req, res, next) => {
//   let { name } = req.body;

//   let productData = await product.find({ name: name }).exec();

//   res.json({
//     code: 20000,
//     data: "success",
//   });

//   //
// });

// module.exports = router;
