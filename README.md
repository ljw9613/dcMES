# 德昌MES系统架构文档

## 系统概述

德昌MES（制造执行系统）是一个基于现代Web技术构建的生产制造执行系统，采用前后端分离架构，专注于制造业的生产过程管控、质量追溯、仓储管理和设备监控。系统支持多厂区、多产线的复杂制造环境，并与金蝶K3 ERP系统深度集成。

## 技术架构

### 整体架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                          客户端层                                │
├─────────────────────────────────────────────────────────────────┤
│  Vue.js Web应用    │  移动端应用    │  设备端应用    │  大屏展示   │
│  (Element UI)      │               │              │             │
└─────────────────────────────────────────────────────────────────┘
                                    │
                               HTTPS/WebSocket
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                          网关层                                  │
├─────────────────────────────────────────────────────────────────┤
│              Nginx 反向代理 + 负载均衡                          │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                         应用服务层                               │
├─────────────────────────────────────────────────────────────────┤
│  dcMes_server     │ dcMes_server_system │ dcMes_server_ws       │
│  (主业务服务)     │   (系统管理服务)    │  (WebSocket服务)      │
│  Express + PM2    │   Express + PM2     │   Express + WebSocket │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                         数据层                                   │
├─────────────────────────────────────────────────────────────────┤
│     MongoDB          │      SQL Server      │     文件存储      │
│   (业务数据)         │    (K3 ERP数据)      │   (本地/云存储)   │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                       外部系统集成                               │
├─────────────────────────────────────────────────────────────────┤
│  K3 ERP系统  │  检测设备  │  打印设备  │  其他MES系统  │  IoT设备 │
└─────────────────────────────────────────────────────────────────┘
```

### 核心技术栈

#### 前端技术栈
- **框架**: Vue.js 2.6.10
- **UI组件库**: Element UI 2.13.0
- **构建工具**: Vue CLI 3.6.0
- **状态管理**: Vuex 3.1.0
- **路由管理**: Vue Router 3.0.6
- **HTTP客户端**: Axios 0.18.1
- **图表组件**: ECharts 4.6.0
- **富文本编辑**: @wangeditor/editor 5.1.23
- **打印组件**: @sv-print/hiprint 0.2.8
- **国际化**: Vue-i18n 8.28.2
- **工具库**: Lodash 4.17.21, Moment.js 2.27.0

#### 后端技术栈
- **运行环境**: Node.js >= 8.9
- **Web框架**: Express.js 4.16.1
- **数据库ORM**: Mongoose 6.6.3
- **进程管理**: PM2 (支持集群模式)
- **身份认证**: JSON Web Token (JWT)
- **文件上传**: Multer 1.4.2
- **安全防护**: Helmet 3.23.3
- **数据压缩**: Compression 1.7.4
- **CORS支持**: CORS 2.8.5
- **任务调度**: Node-schedule 2.1.1

#### 数据库技术
- **主数据库**: MongoDB (版本 >= 4.0)
  - 支持副本集和分片
  - 连接池优化配置
  - 事务支持
- **ERP数据库**: SQL Server
  - 通过专用连接访问K3数据
  - 只读访问模式

## 系统部署架构

### 多环境支持

系统支持多个地区和环境的部署：

#### 部署环境配置
```javascript
// 国内版本
publicPath: "/dcMes/",
outputDir: "../dcMes_server/admin",

// 管理版本
publicPath: "/dcMesManage/",
outputDir: "../dcMes_server/adminManage",

// 越南版本
publicPath: "/dcMesVN/",
outputDir: "../dcMes_server/adminVN",

// CS版本
publicPath: "/dcMesCs/",
outputDir: "../dcMes_server/adminCs",
```

### 服务部署

#### 前端部署
```bash
# 开发环境
npm run dev  # 启动开发服务器 (端口: 9528)

# 生产环境构建
npm run build:prod  # 构建生产版本
npm run build:stage # 构建预发布版本
```

#### 后端部署
```bash
# 开发环境
npm start  # 使用nodemon启动开发服务器

# 生产环境
pm2 start ecosystem.config.js  # 使用PM2集群模式部署
```

#### PM2集群配置
```javascript
module.exports = {
  apps: [{
    name: 'dcmes-server',
    script: './bin/www',
    instances: 'max',
    exec_mode: 'cluster',
    max_restarts: 3,
    min_uptime: '10s',
    env: {
      NODE_ENV: 'development',
      PORT: 2222
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 2222
    }
  }]
};
```

## 数据库设计架构

### MongoDB数据库结构

#### 核心业务数据模型

1. **生产管理模块**
   - `production_plan_work_order` - 生产工单
   - `material_process_flow` - 物料工艺流程
   - `process_step` - 工序定义
   - `craft` - 工艺模板
   - `production_line` - 产线配置

2. **质量管理模块**
   - `product_repair` - 产品维修记录
   - `inspection_data` - 检验数据
   - `sampling_inspection_flow` - 抽样检验流程
   - `unbind_record` - 解绑记录

3. **仓储管理模块**
   - `warehouse_entry` - 入库单
   - `warehouse_ontry` - 出库单
   - `material_palletizing` - 托盘化管理

4. **设备管理模块**
   - `machine` - 设备信息
   - `equipment_information` - 设备档案

5. **系统管理模块**
   - `user_login` - 用户账户
   - `role` - 角色权限
   - `menu` - 菜单配置
   - `api_log` - API访问日志

#### K3 ERP集成数据模型

1. **基础数据**
   - `k3_BD_MATERIAL` - 物料主数据
   - `k3_BD_STOCK` - 仓库主数据

2. **销售模块**
   - `k3_SAL_SaleOrder` - 销售订单
   - `k3_SAL_DeliveryNotice` - 发货通知单
   - `k3_SAL_OutStock` - 销售出库单

3. **生产模块**
   - `k3_PRD_MO` - 生产订单
   - `k3_PRD_InStock` - 生产入库单
   - `k3_PRD_PickMtrl` - 生产领料单

4. **采购模块**
   - `k3_PUR_RequisitionBill` - 请购单

### 数据库连接配置

#### MongoDB连接优化
```javascript
const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 120000,
  connectTimeoutMS: 30000,
  maxPoolSize: 50,        // 最大连接数
  minPoolSize: 10,        // 最小连接数
  maxConnecting: 20,      // 最大并发连接数
  retryWrites: true,
  family: 4,
  maxIdleTimeMS: 60000,   // 空闲连接超时
  heartbeatFrequencyMS: 10000,
  waitQueueTimeoutMS: 10000,
  writeConcern: { w: 1 },
  readPreference: 'primaryPreferred'
};
```

## 外部系统集成架构

### 1. K3 ERP系统集成

#### 集成方式
- **Web API集成**: 通过HTTP REST API与K3系统交互
- **Python SDK**: 使用金蝶官方Python SDK进行数据同步
- **直连数据库**: 通过SQL Server连接直接读取K3数据

#### 数据同步机制
```javascript
// 支持的同步模型
const syncModels = [
  'PRD_MO',           // 生产订单
  'SAL_SaleOrder',    // 销售订单
  'BD_MATERIAL',      // 物料主数据
  'BD_STOCK',         // 仓库数据
  'PRD_InStock',      // 生产入库
  'SAL_OutStock',     // 销售出库
  'PUR_RequisitionBill' // 请购单
];
```

#### K3 API配置
```ini
[config]
acct_id = 账套ID
user_name = 用户名
app_id = 应用ID
app_secret = 应用密钥
server_url = http://k3服务器地址:端口/K3Cloud
```

### 2. 检测设备集成

#### 通信协议
- **TCP Socket**: 用于实时数据采集
- **HTTP API**: 用于设备状态查询和控制
- **WebSocket**: 用于实时数据推送

#### 设备数据处理流程
```
设备数据采集 → TCP服务器 → 数据解析 → 业务处理 → 数据库存储 → 实时推送
```

### 3. 文件存储集成

#### 支持的存储方式
- **本地存储**: 用于开发和小规模部署
- **阿里云OSS**: 云端对象存储
- **腾讯云COS**: 云端对象存储

## API接口架构

### REST API设计规范

#### 接口分层
```
/api/v1/
├── auth/          # 认证相关
├── user/          # 用户管理
├── system/        # 系统管理
├── production/    # 生产管理
├── quality/       # 质量管理
├── warehouse/     # 仓储管理
├── equipment/     # 设备管理
└── k3/           # K3集成接口
```

#### 标准响应格式
```javascript
{
  "code": 200,
  "success": true,
  "message": "操作成功",
  "data": {
    // 业务数据
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### WebSocket实时通信

#### 连接管理
- 支持设备状态实时更新
- 支持生产进度实时推送
- 支持系统通知实时发送

#### 消息格式
```javascript
{
  "type": "DEVICE_STATUS",  // 消息类型
  "deviceId": "设备ID",
  "data": {
    // 消息数据
  },
  "timestamp": "时间戳"
}
```

## 安全架构

### 身份认证与授权

#### JWT令牌认证
- 使用JWT进行无状态身份认证
- 支持令牌刷新机制
- 令牌过期自动重定向登录

#### 基于角色的访问控制(RBAC)
```
用户(User) → 角色(Role) → 权限(Permission) → 菜单(Menu)
```

### 数据安全
- **传输加密**: 使用HTTPS加密传输
- **数据加密**: 敏感数据字段加密存储
- **访问控制**: IP白名单和访问频率限制
- **操作审计**: 完整的操作日志记录

### 系统安全防护
```javascript
// Helmet安全防护
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS跨域配置
app.use(cors({
  origin: ["http://localhost:3001"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
```

## 性能优化架构

### 前端性能优化

#### 构建优化
```javascript
// webpack代码分割
optimization: {
  splitChunks: {
    chunks: "all",
    cacheGroups: {
      libs: {
        name: "chunk-libs",
        test: /[\\/]node_modules[\\/]/,
        priority: 10,
        chunks: "initial"
      },
      elementUI: {
        name: "chunk-elementUI",
        priority: 20,
        test: /[\\/]node_modules[\\/]_?element-ui(.*)/
      }
    }
  }
}
```

#### 运行时优化
- 组件懒加载
- 图片懒加载
- 虚拟滚动
- 防抖和节流

### 后端性能优化

#### 数据库优化
- 索引优化
- 查询优化
- 连接池管理
- 读写分离

#### 缓存策略
- 内存缓存
- Redis缓存(可选)
- CDN缓存

#### 并发处理
- PM2集群模式
- 数据库连接池
- 请求限流

## 监控与运维架构

### 系统监控

#### 应用层监控
- API响应时间监控
- 错误率统计
- 并发连接数监控
- 内存使用率监控

#### 数据库监控
- 连接池状态监控
- 查询性能监控
- 存储空间监控

### 日志管理

#### 日志分类
```javascript
// API访问日志
const apiLogSchema = {
  endpoint: String,      // 接口地址
  method: String,        // 请求方法
  requestBody: Object,   // 请求体
  responseBody: Object,  // 响应体
  statusCode: Number,    // 状态码
  responseTime: Number,  // 响应时间
  userAgent: String,     // 用户代理
  ip: String,           // 客户端IP
  userId: String,       // 用户ID
  timestamp: Date       // 时间戳
};
```

#### 日志轮转
- 按日期自动轮转
- 日志压缩存储
- 定期清理过期日志

### 备份与恢复

#### 数据备份策略
- MongoDB定期备份
- 文件存储备份
- 配置文件备份

#### 灾难恢复
- 数据恢复程序
- 服务快速重启
- 故障转移机制

## 扩展性架构

### 水平扩展

#### 应用服务扩展
- PM2集群模式
- 负载均衡配置
- 服务无状态设计

#### 数据库扩展
- MongoDB分片集群
- 读写分离
- 数据分区策略

### 功能扩展

#### 模块化设计
- 独立的功能模块
- 插件化架构
- 微服务化改造

#### API版本管理
- 版本号控制
- 向下兼容
- 平滑升级

## 开发与部署流程

### 开发流程

#### 环境搭建
```bash
# 前端开发环境
cd dcMes_vue_system
npm install
npm run dev

# 后端开发环境
cd dcMes_server
npm install
npm start
```

#### 代码管理
- Git版本控制
- 分支管理策略
- 代码审查流程

### 部署流程

#### 构建脚本
```bash
#!/bin/bash
# 前端构建
cd dcMes_vue_system
npm run build:prod

# 后端部署
cd ../dcMes_server
pm2 restart dcmes-server
```

#### 环境配置
- 开发环境配置
- 测试环境配置
- 生产环境配置

## 技术规格总结

### 系统要求

#### 硬件要求
- **CPU**: 4核心以上
- **内存**: 8GB以上
- **存储**: 100GB以上SSD
- **网络**: 1Gbps以上

#### 软件要求
- **操作系统**: Linux/Windows Server
- **Node.js**: >= 8.9
- **MongoDB**: >= 4.0
- **Nginx**: >= 1.16
- **PM2**: 最新版本

### 性能指标

#### 并发能力
- **用户并发**: 支持1000+并发用户
- **API并发**: 支持10000+并发请求
- **数据处理**: 支持实时处理1000+设备数据

#### 响应时间
- **页面加载**: < 3秒
- **API响应**: < 500ms
- **数据查询**: < 1秒

### 可用性要求
- **系统可用性**: 99.9%以上
- **数据完整性**: 99.99%
- **故障恢复**: < 5分钟

---

*该文档详细描述了德昌MES系统的完整技术架构，包括系统设计理念、技术选型、部署方案、集成接口和性能优化等方面的内容。*

---

# 产品维修系统 - 部件更换审核验证功能

## 功能概述

本项目是一个生产制造执行系统(MES)中的产品维修模块，主要功能包括产品维修记录的创建、审核和管理。最新增加了部件更换维修单的审核验证功能。

## 项目结构

### 前端文件结构
- `dcMes_vue_system/src/views/productRepair/index.vue` - 产品维修主页面
- `dcMes_vue_system/src/views/productRepair/components/EditDialog.vue` - 维修记录编辑对话框
- `dcMes_vue_system/src/api/product/productRepair.js` - 产品维修API接口

### 后端文件结构
- `dcMes_server/routes/productRepair.js` - 产品维修路由和API实现
- `dcMes_server/model/project/productRepair.js` - 产品维修数据模型
- `dcMes_server/model/project/unbindRecord.js` - 解绑记录数据模型

## 核心功能

### 1. 维修记录管理
- **创建维修记录**：支持成品维修和组件维修两种类型
- **条码扫描**：通过扫描产品条码快速创建维修记录
- **处理方案**：支持多种处理方案，包括部件更换、报废等
- **审核流程**：待审核 → 已审核 → 已作废的状态流转

### 2. 部件更换审核验证功能（新增）

#### 功能描述
当维修单的处理方案选择为"部件更换"时，系统在审核阶段会自动检查是否存在相应的部件解绑记录。只有在确认完成部件更换操作后，维修单才能通过审核。

#### 实现逻辑

**后端验证逻辑**：
1. 在审核API中检查维修单的处理方案
2. 如果是部件更换方案，查询对应的解绑记录
3. 验证解绑记录的有效性（解绑时间必须在维修记录创建时间之后）
4. 如果没有有效的解绑记录，则拒绝审核并返回详细错误信息

**前端用户交互**：
1. 在维修记录编辑页面，选择部件更换方案时显示提示信息
2. 审核时如果验证失败，显示详细的错误对话框
3. 提供"查看产品详情"按钮，方便用户进行解绑操作
4. 支持单个审核和批量审核的验证

#### 技术实现

**数据模型关联**：
```javascript
// 维修记录与解绑记录的关联关系
UnbindRecord.find({
  flowRecordId: materialFlowRecord._id,  // 物料流程记录ID
  mainBarcode: repairRecord.barcode,     // 产品条码
})
```

**验证条件**：
- 解绑记录必须存在
- 解绑时间必须在维修记录创建时间之后
- 解绑记录必须关联到正确的物料流程

### 3. 用户界面优化

#### 筛选搜索功能
- 支持按产品条码、产品型号、处理方案等多种条件筛选
- 当选择部件更换方案时，显示原产品条码和新产品条码输入框

#### 列表展示
- 清晰展示维修记录的所有关键信息
- 状态标签使用不同颜色区分（待审核、已审核、已作废）
- 操作按钮根据用户权限和记录状态动态显示

#### 审核对话框
- 根据处理方案类型动态调整审核表单
- 报废方案不需要选择维修结果
- 部件更换方案显示特殊提示信息

### 4. 权限控制
- 新增成品维修：`产品维修新增成品维修`
- 新增组件维修：`产品维修新增组件维修`
- 修改维修记录：`产品维修修改`
- 审核维修记录：`产品维修审核`
- 批量审核：`产品维修批量审核`
- 批量作废：`产品维修批量作废`

### 5. 导出功能
- 支持根据筛选条件导出维修记录
- Excel格式导出，包含所有关键字段
- 带进度条的异步导出处理

## 使用说明

### 创建部件更换维修记录
1. 点击"新增成品维修"或"新增组件维修"按钮
2. 扫描产品条码，系统自动填充产品信息
3. 选择处理方案为"部件更换"
4. 填写不良现象、分析原因、维修描述等信息
5. 保存并提交维修记录

### 审核部件更换维修记录
1. 在维修记录列表中找到待审核的部件更换记录
2. 点击"查看产品详情"按钮，进入产品工艺流程页面
3. 在物料信息标签页中进行必要的部件解绑操作
4. 返回维修记录页面，点击"审核"按钮
5. 填写不利影响评价，提交审核

### 错误处理
如果审核时提示缺少解绑记录：
1. 检查产品是否已完成部件更换操作
2. 确认解绑时间在维修记录创建时间之后
3. 如需要，重新进行解绑操作
4. 重新提交审核

## 技术特性

- **响应式设计**：支持PC端操作，界面友好
- **实时验证**：前后端双重验证，确保数据准确性
- **权限控制**：基于角色的访问控制
- **操作日志**：记录所有关键操作，便于追溯
- **性能优化**：支持大批量数据的高效处理

## 开发环境

- **前端**：Vue.js 2.x + Element UI
- **后端**：Node.js + Express + MongoDB
- **数据库**：MongoDB with Mongoose ODM

## 部署说明

1. 确保MongoDB数据库中包含所需的数据模型
2. 后端API服务正常运行
3. 前端项目正确配置API接口地址
4. 用户具有相应的操作权限

---

*该文档描述了产品维修系统中部件更换审核验证功能的完整实现，包括前后端逻辑、用户界面和使用流程。*

# 出库单重复托盘问题修复说明

## 问题描述
在整托出库过程中，经常出现同一个托盘在同一个出库单中生成两条数据的问题，导致数据异常和出库数量计算错误。

## 问题原因分析
1. **并发操作**：多个用户或快速重复操作导致同时对同一托盘进行出库处理
2. **缺乏原子性**：出库操作没有使用数据库的原子操作，存在竞态条件
3. **重复检查不充分**：仅检查托盘是否存在，但没有防止并发情况下的重复添加
4. **前端防护不足**：用户可以快速重复扫码，没有加载状态保护

## 修复措施

### 1. 后端API修复 (`dcMes_server/routes/wareHouseOntry.js`)

#### 强化重复检查机制
- 添加重复托盘项检测，发现重复时立即报错并记录日志
- 在添加托盘前重新获取最新的出库单数据，防止基于过期数据的操作
- 实现多层检查：初检查 → 数据刷新 → 最终检查

#### 使用MongoDB原子操作
```javascript
// 使用原子操作确保不会重复添加
const updateResult = await wareHouseOntry.updateOne(
  { 
    _id: entry._id,
    "entryItems.palletCode": { $ne: palletCode } // 确保托盘不存在
  },
  { 
    $push: { entryItems: palletItem },
    $set: { updateAt: new Date() }
  }
);
```

#### 错误回滚机制
- 当添加托盘后发现超出应出库数量时，自动回滚操作
- 确保数据一致性

#### 详细日志记录
- 记录重复托盘发现的详细信息
- 便于问题追踪和调试

### 2. 前端防护 (`dcMes_vue_system/src/views/warehouseOntry/components/ScanDialog.vue`)

#### 重复扫码检查
- 在提交前检查托盘是否已在当前出库单中
- 检查产品条码是否已在出库单中存在

#### 加载状态管理
```javascript
// 防止快速重复操作
if (this.isScanning) {
  this.$message.warning("正在处理中，请稍候...");
  return;
}
```

#### 状态管理改进
- 添加 `isScanning`、`isProductScanning`、`isBoxProcessing` 状态
- 所有异步操作完成后正确重置状态
- 在对话框关闭时重置所有状态

### 3. 数据修复工具

#### 单个出库单重复项清理
```
POST /api/v1/warehouse_entry/clean_duplicate_pallets
```
- 检测并清理指定出库单的重复托盘项
- 合并重复项的条码信息
- 重新计算出库数量和进度

#### 批量清理工具
```
POST /api/v1/warehouse_entry/batch_clean_duplicates
```
- 批量处理所有出库单的重复问题
- 支持按状态筛选处理范围
- 提供详细的处理报告

## 防护机制总结

### 1. 多层检查防护
- **第一层**：前端重复检查 + 用户提示
- **第二层**：后端初始检查 + 重复项检测
- **第三层**：数据刷新 + 最终检查
- **第四层**：原子操作 + 约束检查

### 2. 状态管理
- **前端状态**：防止用户快速重复操作
- **后端状态**：确保数据一致性
- **错误恢复**：异常情况下的状态重置

### 3. 数据完整性
- **原子操作**：使用MongoDB的原子更新操作
- **事务性**：关键操作的原子性保证
- **回滚机制**：错误情况下的数据回滚

### 4. 监控和修复
- **重复检测**：实时检测重复数据
- **日志记录**：详细的操作日志
- **修复工具**：自动和手动修复工具

## 使用建议

### 1. 预防措施
- 培训操作人员避免快速重复扫码
- 等待系统响应后再进行下一步操作
- 注意观察界面提示信息

### 2. 问题处理
- 发现重复数据时，先使用清理工具修复
- 检查修复结果，确保数据正确性
- 必要时联系技术支持

### 3. 监控建议
- 定期检查出库单数据的完整性
- 监控系统日志中的重复项警告
- 及时处理发现的异常情况

## 技术细节

### 原子操作保证
使用MongoDB的 `$ne` 操作符确保托盘不存在时才添加：
```javascript
"entryItems.palletCode": { $ne: palletCode }
```

### 并发控制
通过前端状态锁和后端原子操作双重保护，防止并发问题。

### 数据一致性
在每次操作后重新计算出库数量、进度等关键指标，确保数据一致性。

---

此修复方案已经过充分测试，能够有效防止重复出库问题的发生，并提供了完善的数据修复机制。

# 德昌MES系统 - 材料托盘化服务优化

## 项目概述

德昌MES系统是一个制造执行系统，主要处理生产线上的物料托盘化管理。本文档主要针对在PM2负载均衡环境下出现的"产品工序完成但没有正常入托"问题进行分析和优化。

## 问题分析

### 原始问题
在PM2负载均衡环境下，偶尔出现产品工序完成但没有正常入托的情况，主要表现为：
- 产品的工序状态已更新为完成
- 但产品没有成功添加到托盘中
- 导致数据不一致，影响后续流程

### 根本原因分析

#### 1. 时序问题（主要原因）
**原始代码流程**：
```javascript
// 1. 先触发工序完成
await materialProcessFlowService.scanBatchDocument(...);

// 2. 再进行并发检查
const finalDuplicateCheck = await MaterialPalletizing.findOne(...);

// 3. 最后保存托盘
await pallet.save();
```

**问题**：如果在工序完成和托盘保存之间出现异常、网络问题或并发冲突，会导致工序已完成但托盘未保存的情况。

#### 2. 并发竞争问题
在PM2负载均衡下，多个进程可能同时处理相同条码：
- 进程A：条码检查通过，开始处理
- 进程B：同时检查相同条码，也通过检查
- 结果：两个进程都认为可以处理该条码，导致竞争

#### 3. 事务一致性缺失
原始代码没有使用数据库事务，无法保证操作的原子性：
- 托盘数据可能保存成功
- 但工序状态更新失败
- 导致数据不一致

## 解决方案

### 1. 强一致性策略 ⭐️ 核心改进
**重要策略调整**：确保工序绑定和产品入托的强一致性
- 如果工序绑定失败，产品不允许入托
- 两个操作必须同时成功，或者同时失败
- 避免出现工序未绑定但产品已入托的数据不一致情况

**新的处理流程**：
```javascript
// 在同一个数据库事务中进行
session.startTransaction();

try {
  // 1. 先触发工序完成（确保工序绑定成功）
  await materialProcessFlowService.scanBatchDocument(...);
  
  // 2. 工序成功后再保存托盘
  await pallet.save({ session });
  
  // 3. 提交事务（工序绑定和托盘入托同时生效）
  await session.commitTransaction();
} catch (error) {
  // 任一步骤失败，整个事务回滚
  await session.abortTransaction();
  throw new Error(`工序绑定失败，产品不能入托: ${error.message}`);
}
```

**优势**：
- 确保数据的强一致性
- 工序绑定失败时，产品不会错误入托
- 避免需要后续手动处理的异常数据
- 符合业务逻辑：只有工序正常完成的产品才能入托

### 2. 数据库事务保证原子性
```javascript
// 使用MongoDB事务确保操作原子性
session = await MaterialPalletizing.startSession();
session.startTransaction();

try {
  // 工序绑定和托盘保存都在同一事务中
  await materialProcessFlowService.scanBatchDocument(...);
  await pallet.save({ session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

### 3. 增强重试机制
```javascript
const maxRetries = 3;
while (retries < maxRetries) {
  try {
    return await this._handlePalletBarcodeInternal(...);
  } catch (error) {
    if (isRetryableError(error) && retries < maxRetries) {
      // 添加随机延迟避免多进程同时重试
      const delay = Math.random() * 500 + 200;
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    throw error;
  }
}
```

### 4. 改进并发检查
```javascript
// 在事务内进行并发检查
const duplicateCheck = await MaterialPalletizing.findOne({
  "palletBarcodes.barcode": mainBarcode,
  status: { $in: ["STACKING", "STACKED"] }
}).session(session);
```

## 代码结构优化

### 新增方法结构
```
_handlePalletBarcodeWithRetry()        // 重试控制层
├── _handlePalletBarcodeInternal()     // 事务控制层  
    ├── _getOrCreatePallet()           // 托盘获取/创建
    ├── _validateBoxBarcode()          // 盒条码验证  
    ├── _handleWorkOrderInfo()         // 工单信息处理
    └── _addBarcodeToPllet()           // 条码添加到托盘
```

### 关键改进点

#### 1. 强一致性事务控制
- 工序绑定和托盘保存都在MongoDB事务内执行
- 确保两个操作的原子性：要么都成功，要么都失败
- 异常时自动回滚，不留残留数据

#### 2. 严格错误处理策略
```javascript
// 工序绑定失败处理策略
try {
  await materialProcessFlowService.scanBatchDocument(...);
} catch (processError) {
  // 工序失败，直接抛出错误，阻止入托
  throw new Error(`工序绑定失败，产品不能入托: ${processError.message}`);
}
```

**策略说明**：
- 工序绑定失败时，立即终止整个操作
- 不允许工序未绑定的产品入托
- 确保数据一致性，避免后续手动处理

#### 3. 详细日志和监控
- 记录工序绑定和托盘入托的完整流程
- 事务提交和回滚状态的详细日志
- 便于问题排查和业务监控

## 部署建议

### 1. 监控告警
建议添加以下监控指标：
- 工序绑定失败导致入托失败的次数
- 事务回滚次数和原因分析
- 并发冲突重试次数
- 工序绑定成功率统计

### 2. 数据库配置
确保MongoDB支持事务：
- MongoDB版本 >= 4.0
- 使用副本集或分片集群
- 配置适当的事务超时时间

### 3. PM2配置优化
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'dcmes-server',
    script: './server.js',
    instances: 'max', // 或具体数量
    exec_mode: 'cluster',
    // 添加适当的重启策略
    max_restarts: 3,
    min_uptime: '10s'
  }]
};
```

## 验证方案

### 1. 单元测试
- 测试并发场景下的条码处理
- 验证事务回滚机制
- 测试工序触发失败的处理

### 2. 压力测试
- 模拟多进程同时处理相同条码
- 验证系统在高并发下的稳定性
- 测试数据一致性

### 3. 生产验证
- 逐步发布到生产环境
- 监控关键指标变化
- 确保问题得到解决

## 风险控制

### 1. 回滚方案
如果新方案出现问题，可以：
- 快速回滚到原始代码
- 使用数据库备份恢复数据
- 手动处理异常数据

### 2. 数据修复
对于历史异常数据：
- 编写数据修复脚本
- 重新处理未入托的条码
- 确保数据完整性

## 总结

通过实施强一致性策略、添加事务支持、增强重试机制等改进，可以有效解决PM2负载均衡环境下"产品工序完成但没有正常入托"的问题。

**核心思路调整**：确保工序绑定和产品入托的强一致性
- **原始问题**：工序完成了但产品没入托
- **解决策略**：工序绑定失败则产品不允许入托
- **实现方式**：在同一数据库事务中完成工序绑定和托盘保存
- **保证效果**：要么都成功，要么都失败，杜绝数据不一致

**业务价值**：
- 消除了工序未绑定但产品已入托的异常情况
- 减少了需要人工干预的数据不一致问题
- 提高了生产数据的准确性和可靠性
- 符合制造执行系统的严格数据要求

---

*最后更新时间：2024年*

## MongoDB事务读取偏好问题解决方案

### 问题描述
在使用MongoDB事务时遇到错误：
```
"Read preference in a transaction must be primary, not: primaryPreferred"
```

### 问题原因
- MongoDB事务要求所有读操作必须使用`primary`读取偏好
- 但系统连接配置可能使用`primaryPreferred`
- 事务中不允许使用非`primary`的读取偏好

### 解决方案

#### 方案一：修复事务读取偏好（推荐用于支持事务的环境）
```javascript
// 启动事务时明确指定读取偏好
session.startTransaction({
  readPreference: 'primary',
  readConcern: { level: 'local' },
  writeConcern: { w: 'majority' }
});

// 查询时明确指定读取偏好
const result = await Model.findOne(query)
  .session(session)
  .read('primary');
```

#### 方案二：使用原子操作替代事务（当前采用）
```javascript
// 先执行工序绑定
await materialProcessFlowService.scanBatchDocument(...);

// 再使用原子操作添加条码
const updateResult = await MaterialPalletizing.updateOne(
  { 
    _id: pallet._id,
    "palletBarcodes.barcode": { $ne: mainBarcode },
    status: "STACKING"
  },
  {
    $push: { palletBarcodes: barcodeData },
    $inc: { barcodeCount: 1 },
    $set: { updateAt: new Date() }
  }
);
```

### 当前实现策略

为了确保兼容性和稳定性，系统采用**方案二**：
- 保持强一致性：工序绑定失败则产品不入托
- 使用MongoDB原子操作避免事务读取偏好问题
- 通过条件更新确保并发安全性
- 提供详细的错误处理和重试机制

### 环境要求

#### 使用事务版本的要求：
- MongoDB版本 >= 4.0
- 副本集或分片集群配置
- 连接配置使用`primary`读取偏好

#### 使用原子操作版本的要求：
- MongoDB版本 >= 3.6
- 单实例或副本集均可
- 无特殊读取偏好要求

---

# 德昌MES系统 - 工单完成状态优化

## 功能概述

本次更新优化了工单完成状态的判断逻辑，解决了报废产品影响工单完成判断的问题。

## 问题背景

### 原有问题
- **工单完成判断逻辑不准确**：原来使用 `产出数量 >= 计划生产数量 + 报废数量` 的判断方式
- **报废数量计算混乱**：未区分生产过程中报废的产品和已完成后报废的产品
- **进度计算错误**：进度计算中包含了报废数量，导致即使达到计划产量，进度也不是100%

### 示例场景
- 工单计划数量：3000
- 投入数量：3002  
- 报废数量：2
- 产出数量：3000
- **问题**：产出达到3000时，工单未标记为完成

## 解决方案

### 1. 数据模型优化

在产品维修记录(`productRepair`)中新增字段：

```javascript
// 报废时产品状态信息
isCompletedWhenScrapped: { 
  type: Boolean, 
  default: null,
  description: "产品报废时是否已完成生产（用于准确计算工单完成状态）"
},
scrapReasonType: {
  type: String,
  enum: ["PROCESS_DEFECT", "QUALITY_ISSUE", "DAMAGE", "OTHER"],
  description: "报废原因类型"
}
```

### 2. 报废审核逻辑优化

在报废审核时，系统会：
1. **检查产品完成状态**：判断产品在报废时是否已完成所有必要的生产流程
2. **记录完成状态**：将完成状态保存到 `isCompletedWhenScrapped` 字段
3. **区分报废类型**：记录报废原因类型便于后续分析

### 3. 工单完成判断逻辑优化

新的工单完成判断方式：

```javascript
// 查询已完成产品的报废数量
const completedScrapQuantity = await this.getCompletedScrapQuantity(workOrderId);

// 有效产出 = 当前产出 - 已完成产品的报废数量  
const effectiveOutput = Math.max(0, workOrder.outputQuantity - completedScrapQuantity);

// 当有效产出达到计划生产数量时，工单完成
if (effectiveOutput >= workOrder.planProductionQuantity) {
  workOrder.status = "COMPLETED";
}
```

### 4. 进度计算优化

新的进度计算方式：

```javascript
// 有效产出进度 = 有效产出 / 计划生产数量 * 100%
workOrder.progress = Math.floor(
  (effectiveOutput / workOrder.planProductionQuantity) * 100
);
```

## 主要改进

### ✅ 准确的完成判断
- 只有当**有效产出**（扣除已完成产品报废）达到计划数量时，工单才标记为完成
- 生产过程中的报废不影响工单完成判断

### ✅ 精确的进度计算  
- 进度基于有效产出计算，不受报废数量干扰
- 达到计划产量时进度正确显示为100%

### ✅ 详细的报废追溯
- 记录产品报废时的完成状态
- 区分报废原因类型
- 便于后续数据分析和质量改进

## 使用场景示例

### 场景1：生产过程中报废
```
工单计划：1000个
当前产出：950个
生产中报废：50个（isCompletedWhenScrapped: false）
结果：工单未完成，需要继续生产到1000个
```

### 场景2：已完成产品报废
```
工单计划：1000个  
当前产出：1000个
完成后报废：10个（isCompletedWhenScrapped: true）
有效产出：1000 - 10 = 990个
结果：工单状态变为暂停，需要补充生产10个
```

### 场景3：混合报废情况
```
工单计划：1000个
当前产出：1000个
生产中报废：30个（isCompletedWhenScrapped: false）
完成后报废：5个（isCompletedWhenScrapped: true）
有效产出：1000 - 5 = 995个
结果：工单状态变为暂停，需要补充生产5个
```

## 数据库迁移

如果系统中已有历史报废记录，建议运行以下迁移脚本：

```javascript
// 为历史报废记录设置默认值
db.product_repairs.updateMany(
  { 
    solution: "报废",
    isCompletedWhenScrapped: null 
  },
  { 
    $set: { 
      isCompletedWhenScrapped: true,  // 历史记录默认为已完成
      scrapReasonType: "OTHER" 
    } 
  }
);
```

## 监控和日志

系统会输出详细的工单完成判断日志：

```javascript
console.log(`工单(ID: ${workOrderId}) 完成判断:`, {
  outputQuantity: workOrder.outputQuantity,
  completedScrapQuantity: completedScrapQuantity,
  effectiveOutput: effectiveOutput,
  planProductionQuantity: workOrder.planProductionQuantity,
  shouldComplete: effectiveOutput >= workOrder.planProductionQuantity
});
```

## 注意事项

1. **历史数据处理**：升级后需要检查历史报废记录的 `isCompletedWhenScrapped` 字段
2. **权限控制**：确保只有授权人员可以审核报废记录
3. **数据一致性**：定期检查工单状态与实际生产情况的一致性
4. **性能优化**：大批量数据时注意查询性能，可考虑添加适当索引

## 测试建议

### 单元测试场景
1. 测试生产过程中报废的产品不影响工单完成
2. 测试已完成产品报废后工单状态正确变更
3. 测试混合报废情况下的工单完成判断
4. 测试进度计算的准确性

### 集成测试场景  
1. 完整的生产流程测试
2. 报废审核流程测试
3. 工单状态变更通知测试
4. 数据一致性验证

---

**更新日期**: 2024年12月
**版本**: v2.0
**负责人**: 系统开发团队

