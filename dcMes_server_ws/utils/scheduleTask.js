// cronTasks.js

const PreProductionBarcode = require("../model/project/preProductionBarcode"); // 根据实际路径调整
const schedule = require("node-schedule");

// 定时任务: 每天凌晨1点执行
// 配置定时任务
const asyncK3Schedule = async () => {
  console.log("生产条码过期定时任务开始执行"); // 添加日志记录
  schedule.scheduleJob("0 3 * * *", async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0); // 设置为昨天的开始时间

      const today = new Date();
      today.setHours(0, 0, 0, 0); // 设置为今天的开始时间

      // 查找前一天未使用的条码
      const result = await PreProductionBarcode.updateMany(
        {
          status: { $ne: "USED" }, // 状态不是已使用
          createAt: { $gte: yesterday, $lt: today }, // 创建时间在昨天
        },
        {
          status: "VOIDED", // 更新状态为已作废
          voidReason: "超时作废", // 作废原因
          voidBy: "系统", // 操作人
          voidAt: new Date(), // 作废时间
          updater: "系统", // 更新人
          updateAt: new Date(), // 更新时间
        }
      );

      console.log(`作废条码数量: ${result.nModified}`);
    } catch (error) {
      console.error("定时任务失败:", error);
    } finally {
      console.log("定时任务执行结束"); // 添加日志记录
    }
  });
};

// 执行定时任务
asyncK3Schedule();
