// 批次物料缓存的 IndexedDB 管理类
class BatchStorageDB {
  constructor() {
    this.dbName = 'batchMaterialsDB';
    this.storeName = 'batchMaterials';
    this.db = null;
    this.dbVersion = 1;
    this.isReady = this.init();
  }

  // 初始化数据库
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = (event) => {
        console.error('数据库打开失败:', event.target.error);
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('数据库连接成功');
        resolve(true);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建批次物料存储对象，使用复合键
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // 创建索引便于查询
          store.createIndex('materialId', 'materialId', { unique: false });
          store.createIndex('processStepId', 'processStepId', { unique: false });
          store.createIndex('lastUsed', 'lastUsed', { unique: false });
          store.createIndex('expiry', 'expiry', { unique: false });
          
          console.log('数据库表结构初始化完成');
        }
      };
    });
  }

  // 生成复合键
  generateKey(mainMaterialId, processStepId, materialId) {
    return `batch_${mainMaterialId}_${processStepId}_${materialId}`;
  }

  // 保存批次物料数据
  async saveBatchData(mainMaterialId, processStepId, materialId, barcode, usageCount, maxUsage) {
    await this.isReady;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // 计算过期时间 (7天后自动过期)
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);
      
      const record = {
        id: this.generateKey(mainMaterialId, processStepId, materialId),
        mainMaterialId,
        processStepId,
        materialId,
        barcode,
        usageCount,
        maxUsage,
        createTime: new Date(),
        lastUsed: new Date(),
        expiry
      };
      
      const request = store.put(record);
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  // 获取批次物料数据
  async getBatchData(mainMaterialId, processStepId, materialId) {
    await this.isReady;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const id = this.generateKey(mainMaterialId, processStepId, materialId);
      
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  // 更新批次物料使用次数
  async updateBatchUsage(mainMaterialId, processStepId, materialId) {
    await this.isReady;
    
    return new Promise(async (resolve, reject) => {
      try {
        const record = await this.getBatchData(mainMaterialId, processStepId, materialId);
        
        if (!record) {
          resolve(null);
          return;
        }
        
        // 增加使用次数并更新最后使用时间
        record.usageCount += 1;
        record.lastUsed = new Date();
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(record);
        
        request.onsuccess = () => resolve(record);
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 删除批次物料记录
  async deleteBatchData(mainMaterialId, processStepId, materialId) {
    await this.isReady;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const id = this.generateKey(mainMaterialId, processStepId, materialId);
      
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  // 清理过期或不再使用的批次物料记录
  async cleanupExpiredRecords() {
    await this.isReady;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('expiry');
      
      // 查找已过期的记录
      const now = new Date();
      const range = IDBKeyRange.upperBound(now);
      
      const request = index.openCursor(range);
      let deleteCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          // 删除过期记录
          store.delete(cursor.primaryKey);
          deleteCount++;
          cursor.continue();
        } else {
          console.log(`清理了 ${deleteCount} 条过期的批次物料记录`);
          resolve(deleteCount);
        }
      };
      
      request.onerror = (event) => reject(event.target.error);
    });
  }

  // 根据最大使用次数清理批次物料记录
  async cleanupByUsageLimit() {
    await this.isReady;
    
    return new Promise(async (resolve, reject) => {
      try {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.openCursor();
        let deleteCount = 0;
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const record = cursor.value;
            
            // 如果使用次数达到或超过最大次数，删除记录
            if (record.maxUsage > 0 && record.usageCount >= record.maxUsage) {
              store.delete(cursor.primaryKey);
              deleteCount++;
            }
            
            cursor.continue();
          } else {
            console.log(`清理了 ${deleteCount} 条达到使用上限的批次物料记录`);
            resolve(deleteCount);
          }
        };
        
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const batchStorageDB = new BatchStorageDB();

// 定期清理任务 - 每24小时执行一次
let cleanupInterval = null;

export function startAutomaticCleanup() {
  // 停止之前可能存在的清理任务
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  // 立即执行一次清理
  performCleanup();
  
  // 设置定期清理 (24小时)
  cleanupInterval = setInterval(performCleanup, 24 * 60 * 60 * 1000);
}

async function performCleanup() {
  try {
    // 清理过期记录
    await batchStorageDB.cleanupExpiredRecords();
    // 清理达到使用上限的记录
    await batchStorageDB.cleanupByUsageLimit();
  } catch (error) {
    console.error('批次物料数据清理失败:', error);
  }
} 