const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const ApiLog = require("../model/system/apiLog");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const moment = require("moment");
class BackupService {
 /**
  * 备份 MaterialProcessFlow 表数据到备份集合中
  * @returns {Promise<void>}
  */
 static async backupMaterialProcessFlow() {
   try {
    console.log("开始备份 MaterialProcessFlow 数据");
     // 获取当前日期
     const dateStr = moment().format("YYYY-MM-DD");
     
     // 创建备份集合名称
     const backupCollectionName = `materialProcessFlow_backup_${dateStr}`;
     
     // 查询所有数据
     const data = await MaterialProcessFlow.find({});
     
     // 创建新的备份集合并插入数据
     await mongoose.connection.db.createCollection(backupCollectionName);
     const backupCollection = mongoose.connection.db.collection(backupCollectionName);
     await backupCollection.insertMany(data);

     // 获取所有备份集合
     const collections = await mongoose.connection.db
       .listCollections({ name: /^materialProcessFlow_backup_/ })
       .toArray();
     
     // 按日期排序
     const backupCollections = collections
       .map(col => col.name)
       .sort()
       .reverse();

     // 删除超过30天的备份集合
     if (backupCollections.length > 30) {
       for (const collectionName of backupCollections.slice(30)) {
         await mongoose.connection.db.dropCollection(collectionName);
       }
     }

     console.log(`成功备份 MaterialProcessFlow 数据到集合: ${backupCollectionName}`);
   } catch (error) {
     console.error("备份 MaterialProcessFlow 数据失败:", error);
     throw error;
   }
 }

 /**
  * 清理API日志数据，只保留最近15天的数据
  * @returns {Promise<void>}
  */
 static async cleanupApiLogs() {
   try {
     console.log("开始清理API日志数据");
     
     // 计算15天前的日期
     const fifteenDaysAgo = moment().subtract(15, 'days').toDate();
     
     // 删除15天前的日志
     const result = await ApiLog.deleteMany({
       timestamp: { $lt: fifteenDaysAgo }
     });
     
     console.log(`成功清理API日志数据，共删除 ${result.deletedCount} 条记录`);
     return result;
   } catch (error) {
     console.error("清理API日志数据失败:", error);
     throw error;
   }
 }
}
    
module.exports = BackupService;