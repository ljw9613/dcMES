const express = require("express");
const router = express.Router();
const machine = require("../model/project/machine");

router.get("/api/v1/machine/progress", async (req, res) => {
  try {
    // 获取客户端IP地址并转换格式
    const ip = req.socket.remoteAddress.replace(/^.*:/, "");
    const machineData = await machine
      .findOne({ machineIp: ip })
      .populate("lineId materialId processStepId");
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
