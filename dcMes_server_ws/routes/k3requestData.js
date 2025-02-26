/*
 * @name: 管理后台登陆接口
 * @content:
 * @Author: joyce
 * @Date: 2020-03-11 11:22:37
 */
const express = require(`express`);
const router = express.Router();

const { k3cMethod } = require("./k3cMethod");
/* GET users listing. */

router.post("/api/v1/requestK3Data", async (req, res, next) => {
  //
  try {
    console.log(req.body, 'requestK3Data');

    let { method, modelName, methodData } = req.body;
    console.log(req.body);
    if (!method || !modelName || !methodData) {
      return res.json({
        code: 400,
        msg: "参数错误",
        data: [],
      });
    }
    // let userData = await k3cMethod("View", "BD_Empinfo", MethodData);
    let k3resData = await k3cMethod(method, modelName, methodData);
    console.log("k3resData: ", k3resData);

    res.jsonp({
      code: 200,
      msg: "获取成功",
      data: k3resData.Result || k3resData,
    });
  } catch (e) {
    res.status(500).send(e.toString());
  }
  //
});

module.exports = router;
