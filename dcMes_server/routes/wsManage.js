const express = require(`express`);
const router = express.Router();
const wsManager = require("../services/wsManager"); // 引入 WebSocket 管理器
const Machine = require("../model/project/machine");

// 发送刷新命令到指定设备
router.post("/api/v1/machine/refresh", async (req, res) => {
  try {
    const { machineIds } = req.body;

    if (machineIds.length === 0) {
      return res.json({
        code: 40001,
        message: "设备ID不能为空",
      });
    }

    const machines = await Machine.find({ _id: { $in: machineIds } });
    if (machines.length === 0) {
      return res.json({
        code: 40002,
        message: "设备ID不存在",
      });
    }

    for (const machine of machines) {
      console.log(machine);
      if (machine.machineIp) {
        const userId = `machien_${machine.machineIp.replace(/[.:]/g, "_")}`;
        wsManager.sendToUser(userId, {
          type: "command",
          action: "refresh",
          timestamp: new Date().getTime(),
        });
      }
    }

    res.json({
      code: 20000,
      message: "刷新命令已发送",
    });
  } catch (error) {
    console.error("发送刷新命令失败:", error);
    res.json({
      code: 50000,
      message: "发送刷新命令失败",
    });
  }
});

module.exports = router;
