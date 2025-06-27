# 仓库出库单系统优化技术文档

**作者：** ljw  
**邮箱：** 1798245303@qq.com  
**创建时间：** 2025-06-25  
**版本：** v1.0

## 概述

本文档详细描述了针对添可销售订单类型的仓库出库单系统限制规则优化方案，包括技术实现、架构设计和使用说明。

## 业务需求

### 核心限制规则
1. **托盘工单限制：** 每个出库单中只能包含来自同一个工单的托盘
2. **白名单工单数量：** 出库单白名单中的工单数量限制为1个
3. **白名单保存机制：** 白名单设置完成后必须立即保存到出库单记录中
4. **白名单不可修改：** 一旦白名单保存到出库单后，不允许再次修改

### 适用范围
- **仅针对添可销售订单类型** (FSettleId_FNumber === "CUST0199")
- 其他类型的销售订单不受此限制影响

## 技术架构

### 系统架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端组件      │    │   后端路由      │    │   数据模型      │
│                 │    │                 │    │                 │
│ ScanDialog.vue  │◄──►│ wareHouseOntry  │◄──►│ warehouseOntry  │
│ index.vue       │    │ .js             │    │ .js             │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户交互      │    │   业务逻辑      │    │   数据存储      │
│                 │    │                 │    │                 │
│ - 白名单设置    │    │ - 订单类型识别  │    │ - 白名单锁定    │
│ - 托盘扫描      │    │ - 工单一致性    │    │ - 工单记录      │
│ - 错误提示      │    │ - 数量限制      │    │ - 状态管理      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 核心实现

### 1. 数据模型优化

#### 新增字段
```javascript
// dcMes_server/model/warehouse/warehouseOntry.js

// 白名单锁定状态
whitelistLocked: {
  type: Boolean,
  default: false,
  description: "白名单是否已锁定，一旦锁定不可修改"
},

// 白名单锁定时间
whitelistLockedAt: {
  type: Date,
  description: "白名单锁定时间"
},

// 当前出库单关联的工单号
currentWorkOrderNo: {
  type: String,
  description: "当前出库单中托盘所属的工单号，确保同一出库单中托盘来自同一工单"
}
```

#### 实例方法
```javascript
// 检查是否为添可销售订单类型
isTiankeOrder: function(saleOrder) {
  return saleOrder && saleOrder.FSettleId_FNumber === "CUST0199";
},

// 验证白名单工单数量限制
validateWhitelistCount: function(saleOrder) {
  if (this.isTiankeOrder(saleOrder)) {
    return this.workOrderWhitelist.length <= 1;
  }
  return true;
},

// 验证托盘工单一致性
validatePalletWorkOrderConsistency: function(workOrderNo) {
  if (!this.currentWorkOrderNo) {
    return true;
  }
  return this.currentWorkOrderNo === workOrderNo;
}
```

### 2. 业务逻辑验证器

#### TiankeOrderValidator 工具类
```javascript
// dcMes_server/routes/wareHouseOntry.js

const TiankeOrderValidator = {
  // 检查是否为添可销售订单
  isTiankeOrder(saleOrder) {
    return saleOrder && saleOrder.FSettleId_FNumber === "CUST0199";
  },

  // 验证白名单要求
  validateWhitelist(saleOrder, workOrderWhitelist) {
    if (!this.isTiankeOrder(saleOrder)) {
      return { isValid: true, message: "" };
    }

    if (!workOrderWhitelist || workOrderWhitelist.length === 0) {
      return { 
        isValid: false, 
        message: "添可的销售订单必须添加工单白名单" 
      };
    }

    if (workOrderWhitelist.length > 1) {
      return { 
        isValid: false, 
        message: "添可销售订单的白名单只能设置1个工单" 
      };
    }

    return { isValid: true, message: "" };
  },

  // 验证托盘工单一致性
  validatePalletWorkOrderConsistency(saleOrder, currentWorkOrderNo, palletWorkOrderNo) {
    if (!this.isTiankeOrder(saleOrder)) {
      return { isValid: true, message: "" };
    }

    if (!currentWorkOrderNo) {
      return { isValid: true, message: "" };
    }

    if (currentWorkOrderNo !== palletWorkOrderNo) {
      return { 
        isValid: false, 
        message: `添可销售订单中的托盘必须来自同一工单。当前工单：${currentWorkOrderNo}，托盘工单：${palletWorkOrderNo}` 
      };
    }

    return { isValid: true, message: "" };
  }
};
```

### 3. 前端组件优化

#### 白名单选择组件
```vue
<!-- dcMes_vue_system/src/views/warehouseOntry/components/ScanDialog.vue -->

<el-form-item>
  <template slot="label">
    工单白名单
    <el-tag 
      v-if="entryInfo.whitelistLocked" 
      type="warning" 
      size="mini" 
      style="margin-left: 5px;"
    >
      已锁定
    </el-tag>
  </template>
  <zr-select
    v-model="entryInfo.workOrderWhitelist"
    :disabled="entryInfo.whitelistLocked"
    :multiple="true"
    @select="handleWorkOrderSelect"
  >
  </zr-select>
</el-form-item>
```

#### 工单限制提示
```vue
<el-row v-if="entryInfo.currentWorkOrderNo || entryInfo.whitelistLocked">
  <el-col :span="24">
    <el-alert
      :title="getWorkOrderLimitMessage()"
      type="info"
      :closable="false"
      show-icon
      style="margin-top: 10px;"
    >
    </el-alert>
  </el-col>
</el-row>
```

## API 接口

### 1. 扫描出库接口
```
POST /api/v1/warehouse_entry/scan_on
```

**请求参数：**
```json
{
  "palletCode": "托盘编号",
  "userId": "用户ID",
  "entryInfo": {
    "outboundQuantity": 100,
    "workOrderWhitelist": [
      {
        "workOrderNo": "工单号",
        "workOrderId": "工单ID",
        "productionOrderNo": "生产订单号"
      }
    ]
  }
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "扫码出库成功",
  "data": {
    "entryNo": "出库单号",
    "currentWorkOrderNo": "当前工单号",
    "whitelistLocked": true,
    "progress": 50
  }
}
```

### 2. 白名单更新接口
```
POST /api/v1/warehouse_entry/update_whitelist
```

**请求参数：**
```json
{
  "entryId": "出库单ID",
  "workOrderWhitelist": [
    {
      "workOrderNo": "工单号",
      "workOrderId": "工单ID"
    }
  ],
  "userId": "用户ID"
}
```

## 错误处理

### 错误代码定义
- **201：** 白名单验证失败
- **400：** 参数错误
- **403：** 白名单已锁定
- **404：** 资源不存在

### 错误信息分类
1. **添可订单限制：** 以"【添可订单限制】"开头
2. **工单一致性限制：** 以"【工单一致性限制】"开头
3. **白名单已锁定：** 以"【白名单已锁定】"开头

## 部署说明

### 1. 数据库迁移
```sql
-- 添加新字段到现有表
ALTER TABLE warehouse_ontries ADD COLUMN whitelistLocked BOOLEAN DEFAULT FALSE;
ALTER TABLE warehouse_ontries ADD COLUMN whitelistLockedAt DATETIME;
ALTER TABLE warehouse_ontries ADD COLUMN currentWorkOrderNo VARCHAR(50);

-- 添加索引
CREATE INDEX idx_whitelistLocked ON warehouse_ontries(whitelistLocked);
CREATE INDEX idx_currentWorkOrderNo ON warehouse_ontries(currentWorkOrderNo);
```

### 2. 配置更新
```javascript
// 确保添可订单标识配置正确
const TIANKE_CUSTOMER_CODE = "CUST0199";
```

### 3. 权限配置
- 确保用户具有出库操作权限
- 配置白名单管理权限

## 监控和日志

### 关键指标监控
1. **扫描成功率：** 托盘扫描操作的成功率
2. **错误分布：** 各类错误的发生频率
3. **响应时间：** 扫描操作的平均响应时间

### 日志记录
```javascript
// 关键操作日志
console.log(`添可订单白名单验证: ${saleOrderNo}, 结果: ${isValid}`);
console.log(`工单一致性检查: 当前工单=${currentWorkOrder}, 托盘工单=${palletWorkOrder}`);
console.log(`白名单锁定操作: 出库单=${entryNo}, 时间=${new Date()}`);
```

## 性能优化

### 1. 数据库优化
- 添加必要的索引
- 优化查询语句
- 使用连接池

### 2. 缓存策略
- 缓存销售订单类型信息
- 缓存工单白名单数据

### 3. 前端优化
- 组件懒加载
- 防抖处理用户输入
- 优化渲染性能

## 安全考虑

### 1. 数据验证
- 服务端验证所有输入参数
- 防止SQL注入攻击
- 验证用户权限

### 2. 操作审计
- 记录所有关键操作
- 保留操作日志
- 监控异常行为

## 维护指南

### 1. 常见问题排查
- 白名单锁定后无法修改：检查whitelistLocked字段
- 托盘扫描失败：检查工单一致性
- 性能问题：检查数据库索引

### 2. 数据修复
```sql
-- 重置白名单锁定状态（谨慎操作）
UPDATE warehouse_ontries 
SET whitelistLocked = FALSE, whitelistLockedAt = NULL 
WHERE entryNo = '出库单号';
```

### 3. 版本升级
- 备份数据库
- 执行迁移脚本
- 验证功能正常性

## 总结

本次优化实现了针对添可销售订单类型的严格限制规则，确保了出库操作的规范性和数据的一致性。通过完善的错误处理和用户提示，提升了系统的用户体验和可维护性。
