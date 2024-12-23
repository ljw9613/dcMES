const schedule = require("node-schedule");
const BackupService = require("../services/backupService");
// 配置定时任务
const initSchedule = () => {
  // 每天凌晨2点执行备份
  schedule.scheduleJob("0 2 * * *", async () => {
    try {
      await BackupService.backupMaterialProcessFlow();
    } catch (error) {
      console.error("执行 MaterialProcessFlow 备份任务失败:", error);
    }
  });
};

module.exports = initSchedule;
