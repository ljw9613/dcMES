// 托盘数据本地存储工具类
export const PalletStorage = {
    // 存储键名前缀
    PREFIX: 'PALLET_',
    
    // 保存当前托盘信息
    setCurrentPallet(palletData) {
      try {
        localStorage.setItem(`${this.PREFIX}CURRENT_ID`, palletData._id);
        localStorage.setItem(`${this.PREFIX}CURRENT_CODE`, palletData.palletCode);
        localStorage.setItem(`${this.PREFIX}DATA`, JSON.stringify(palletData));
        localStorage.setItem(`${this.PREFIX}SCANNED_ITEMS`, JSON.stringify([]));
      } catch (error) {
        console.error('保存托盘数据失败:', error);
      }
    },
     // 获取当前托盘ID
    getCurrentPalletId() {
      return localStorage.getItem(`${this.PREFIX}CURRENT_ID`) || '';
    },
     // 获取当前托盘编号
    getCurrentPalletCode() {
      return localStorage.getItem(`${this.PREFIX}CURRENT_CODE`) || '';
    },
     // 获取当前托盘完整数据
    getCurrentPalletData() {
      try {
        const data = localStorage.getItem(`${this.PREFIX}DATA`);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('获取托盘数据失败:', error);
        return null;
      }
    },
     // 添加扫描条目
    addScannedItem(item) {
      try {
        const items = this.getScannedItems();
        items.push({
          ...item,
          scanTime: new Date()
        });
        localStorage.setItem(`${this.PREFIX}SCANNED_ITEMS`, JSON.stringify(items));
      } catch (error) {
        console.error('添加扫描条目失败:', error);
      }
    },
     // 获取已扫描条目列表
    getScannedItems() {
      try {
        const items = localStorage.getItem(`${this.PREFIX}SCANNED_ITEMS`);
        return items ? JSON.parse(items) : [];
      } catch (error) {
        console.error('获取扫描条目失败:', error);
        return [];
      }
    },
     // 清除当前托盘所有数据
    clearCurrentPallet() {
      localStorage.removeItem(`${this.PREFIX}CURRENT_ID`);
      localStorage.removeItem(`${this.PREFIX}CURRENT_CODE`);
      localStorage.removeItem(`${this.PREFIX}DATA`);
      localStorage.removeItem(`${this.PREFIX}SCANNED_ITEMS`);
    },
     // 检查是否存在进行中的托盘
    hasOngoingPallet() {
      return !!this.getCurrentPalletId();
    }
   };