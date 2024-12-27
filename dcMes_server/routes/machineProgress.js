const express = require("express");
const router = express.Router();
const machine = require("../model/project/machine");

router.get("/api/v1/machine/progress", async (req, res) => {
  try {
    let ip =
      req.headers["x-forwarded-for"]?.split(",").shift() ||
      req.headers["x-real-ip"] ||
      req.headers["x-client-ip"] ||
      req.headers["cf-connecting-ip"] ||
      req.headers["true-client-ip"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      "";
    // 处理 IPv4 映射的 IPv6 地址
    ip = ip.replace(/^::ffff:/, "");
    // 处理其他可能的 IPv6 前缀
    ip = ip.replace(/^.*:/, "");

    console.log("原始IP:", req.connection?.remoteAddress);
    console.log("处理后IP:", ip);
    const machineData = await machine
      .findOne({ machineIp: ip })
      .populate("lineId materialId processStepId productionPlanWorkOrderId");
    if (!machineData) {
      return res.json({ code: 201, message: "设备不存在" });
    }
    res.json({ code: 200, data: machineData, message: "设备信息获取成功" });
  } catch (error) {
    console.error("获取设备信息失败:", error);
    res.status(500).json({ code: 500, message: "获取设备信息失败" });
  }
});

module.exports = router;
