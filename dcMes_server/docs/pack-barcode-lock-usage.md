# 装箱条码锁定机制使用说明

## 概述

装箱条码锁定机制确保在多设备环境下，同一时间只有一个设备可以操作特定的装箱条码，避免重复生成和并发冲突。

## 工作原理

1. **获取条码时自动锁定**：调用 `getOrCreatePackBarcode` 时，返回的条码会被锁定给当前设备
2. **持续锁定直到主动解锁**：条码保持锁定状态，直到前端主动调用解锁接口
3. **异常保护机制**：设置过期时间（2小时），防止页面异常关闭造成死锁

## API 接口

### 1. 获取或创建装箱条码（自动锁定）

**接口**：`POST /api/v1/getOrCreatePackBarcode`

**请求参数**：
```javascript
{
  "productionLineId": "产线ID",
  "materialNumber": "物料编码", 
  "materialId": "物料ID",
  "materialName": "物料名称",
  "sessionId": "会话ID（可选）",
  "deviceIp": "设备IP（推荐，用于设备识别）"
}
```

**响应**：
```javascript
{
  "success": true,
  "data": {
    "_id": "条码ID",
    "barcode": "生成的条码",
    "printBarcode": "打印条码", 
    "serialNumber": 1,
    "status": "LOCKED",          // 已锁定
    "lockedBy": "192.168.1.100", // 锁定设备
    "lockedAt": "锁定时间",
    "lockExpireAt": "过期时间",
    // ... 其他字段
  },
  "message": "创建新的装箱条码成功，已锁定"
}
```

### 2. 解锁装箱条码

**接口**：`POST /api/v1/unlockPackBarcode`

**请求参数**：
```javascript
{
  "barcodeId": "条码ID（优先使用）",
  "barcode": "条码值（备用）",
  "sessionId": "会话ID",
  "deviceIp": "设备IP"
}
```

**响应**：
```javascript
{
  "success": true,
  "data": {
    "status": "PENDING",  // 已解锁
    "lockedBy": null,
    // ... 其他字段
  },
  "message": "条码解锁成功"
}
```

### 3. 批量解锁装箱条码

**接口**：`POST /api/v1/unlockAllPackBarcodes`

**请求参数**：
```javascript
{
  "sessionId": "会话ID",
  "deviceIp": "设备IP"
}
```

**响应**：
```javascript
{
  "success": true,
  "message": "成功解锁 3 个条码",
  "count": 3
}
```

## 前端集成示例

### Vue.js 组件集成

```javascript
export default {
  data() {
    return {
      packingBarcode: null,
      deviceInfo: {
        sessionId: null,
        deviceIp: null
      }
    }
  },

  async mounted() {
    // 初始化设备信息
    this.initDeviceInfo();
    
    // 页面关闭时解锁
    window.addEventListener('beforeunload', this.handlePageUnload);
    
    // 获取装箱条码
    await this.getPackingBarcode();
  },

  beforeDestroy() {
    // 组件销毁时解锁
    this.unlockBarcode();
    window.removeEventListener('beforeunload', this.handlePageUnload);
  },

  methods: {
    // 初始化设备信息
    initDeviceInfo() {
      // 生成会话ID
      this.deviceInfo.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 获取设备IP（如果可能）
      this.getDeviceIP().then(ip => {
        this.deviceInfo.deviceIp = ip;
      });
    },

    // 获取装箱条码（自动锁定）
    async getPackingBarcode() {
      try {
        const response = await this.$api.post('/api/v1/getOrCreatePackBarcode', {
          productionLineId: this.formData.productLine,
          materialNumber: this.boxMaterial.materialCode,
          materialId: this.boxMaterial.materialId,
          materialName: this.boxMaterial.materialName,
          ...this.deviceInfo
        });

        if (response.success) {
          this.packingBarcode = response.data;
          console.log('获取装箱条码成功，已锁定:', this.packingBarcode);
          
          // 保存到本地存储，用于页面刷新后恢复
          localStorage.setItem('lockedBarcode', JSON.stringify({
            barcodeId: this.packingBarcode._id,
            ...this.deviceInfo
          }));
          
        } else {
          this.$message.error(response.message);
        }
      } catch (error) {
        console.error('获取装箱条码失败:', error);
        this.$message.error('获取装箱条码失败');
      }
    },

    // 解锁条码
    async unlockBarcode() {
      if (!this.packingBarcode) return;

      try {
        const response = await this.$api.post('/api/v1/unlockPackBarcode', {
          barcodeId: this.packingBarcode._id,
          ...this.deviceInfo
        });

        if (response.success) {
          console.log('条码解锁成功');
          // 清除本地存储
          localStorage.removeItem('lockedBarcode');
        }
      } catch (error) {
        console.error('解锁条码失败:', error);
      }
    },

    // 页面卸载时解锁
    handlePageUnload(event) {
      // 同步调用解锁接口
      if (this.packingBarcode) {
        navigator.sendBeacon('/api/v1/unlockPackBarcode', JSON.stringify({
          barcodeId: this.packingBarcode._id,
          ...this.deviceInfo
        }));
      }
    },

    // 获取设备IP（示例）
    async getDeviceIP() {
      try {
        // 这里可以通过各种方式获取设备IP
        // 方式1：通过WebRTC获取本地IP
        // 方式2：通过服务器接口获取客户端IP
        // 方式3：使用固定的工位编号
        
        const response = await fetch('/api/v1/getClientIP');
        const data = await response.json();
        return data.ip;
      } catch (error) {
        console.warn('获取设备IP失败，使用会话ID', error);
        return null;
      }
    }
  }
}
```

### 页面刷新恢复机制

```javascript
// 在页面加载时检查是否有未解锁的条码
async created() {
  const lockedInfo = localStorage.getItem('lockedBarcode');
  if (lockedInfo) {
    try {
      const info = JSON.parse(lockedInfo);
      
      // 尝试解锁之前的条码（可能是页面异常关闭留下的）
      await this.$api.post('/api/v1/unlockPackBarcode', info);
      localStorage.removeItem('lockedBarcode');
      
    } catch (error) {
      console.warn('清理之前的锁定失败:', error);
    }
  }
}
```

## 最佳实践

### 1. 设备标识优先级
```javascript
// 推荐的设备标识优先级
const deviceId = deviceIp || workstationId || sessionId;
```

### 2. 异常处理
```javascript
// 定期检查锁定状态
setInterval(async () => {
  if (this.packingBarcode && this.packingBarcode.status === 'LOCKED') {
    // 检查条码是否仍被当前设备锁定
    const status = await this.checkBarcodeStatus();
    if (!status.lockedByMe) {
      // 条码已被其他设备接管，需要重新获取
      await this.getPackingBarcode();
    }
  }
}, 30000); // 每30秒检查一次
```

### 3. 网络断线重连
```javascript
// 网络重连后重新锁定条码
window.addEventListener('online', async () => {
  if (this.packingBarcode) {
    // 重新获取条码确保锁定状态
    await this.getPackingBarcode();
  }
});
```

## 状态流转

```
PENDING → LOCKED → PENDING
   ↑         ↓         ↑
 解锁    获取/创建    解锁
```

## 注意事项

1. **设备识别**：建议使用设备IP或工位编号作为唯一标识
2. **异常保护**：设置了2小时的锁定过期时间，防止死锁
3. **页面刷新**：使用localStorage保存锁定信息，页面刷新后可恢复
4. **网络异常**：页面关闭时使用sendBeacon确保解锁请求发送
5. **并发控制**：同一设备多次请求会复用锁定的条码

## 故障排除

### 常见问题

1. **条码被其他设备锁定**
   - 检查是否有其他设备正在使用该条码
   - 使用管理员权限强制解锁

2. **页面异常关闭后条码仍被锁定**
   - 等待2小时自动过期
   - 调用清理过期锁定接口：`POST /api/v1/cleanExpiredLocks`

3. **设备识别冲突**
   - 确保每个设备的IP或会话ID唯一
   - 检查网络配置，避免IP冲突 