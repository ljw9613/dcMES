const express = require("express");
const router = express.Router();
const MessageLog = require("../model/project/messageLog");
// 标记单个消息为已读
router.post("/api/v1/messageId/read", async (req, res) => {
  try {
    const messageId = req.body.messageId;
    const userId = req.body.user.id; // 假设通过认证中间件获取当前用户ID
    const message = await MessageLog.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "消息不存在" });
    }
    // 使用模型的markAsRead方法
    await message.markAsRead(userId);
    res.json({ code: 200, message: "消息已标记为已读" });
  } catch (error) {
    console.error("标记消息已读失败:", error);
    res.status(500).json({ code: 500, message: "标记消息已读失败" });
  }
});
// 标记所有消息为已读
router.post("/api/v1/read-all", async (req, res) => {
  try {
    console.log(req.body.user);
    const userId = req.body.user.id; // 假设通过认证中间件获取当前用户ID

    // 找到所有接收者包含当前用户且未读的消息
    const messages = await MessageLog.find({
      receivers: {
        $elemMatch: {
          userId: userId,
          isRead: false,
        },
      },
    });
    // 使用Promise.all并行处理所有消息的已读标记
    await Promise.all(messages.map((message) => message.markAsRead(userId)));
    res.json({ code: 200, message: "所有消息已标记为已读" });
  } catch (error) {
    console.error("标记所有消息已读失败:", error);
    res.status(500).json({ code: 500, message: "标记所有消息已读失败" });
  }
});
// 获取消息列表
router.post("/api/v1/messageLogList", async (req, res) => {
  try {
    const userId = req.body.user.id;
    const userRole = req.body.user.roles.label;
    let query = {};
    // 如果是超级管理员，可以看到所有消息
    if (userRole === "superAdmin") {
      query = {};
    }
    //如果是经济人，可以看到超级管理员发布的消息，或者自己的消息
    if (userRole === "Agent") {
      query = {
        $or: [
          { isSystem: true },
          {
            receivers: {
              $elemMatch: { userId: userId },
            },
          },
        ],
      };
    }
    const messages = await MessageLog.find(query)
      .sort({ createTime: -1 }) // 按创建时间倒序
      .populate("sender.userId", "nickName") // 填充发送者信息
      .populate("taskId", "title") // 填充任务信息
      .populate("taskClaimId"); // 填充任务认领信息
    res.json({ code: 200, data: messages });
  } catch (error) {
    console.error("获取消息列表失败:", error);
    res.status(500).json({ code: 500, message: "获取消息列表失败" });
  }
});

module.exports = router;
