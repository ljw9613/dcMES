# 德昌MES增量备份服务器

## 项目概述

德昌MES增量备份服务器是一个专门为MongoDB数据库设计的智能备份解决方案。它支持多种备份策略，包括增量备份、全表备份和自定义时间范围备份。

## 主要功能

### 🕐 灵活的时间范围配置
- **当天备份**: 备份当天00:00:00到23:59:59的数据
- **全表备份**: 备份整个表的所有数据，不限制时间
- **小时范围**: 备份最近N小时的数据
- **天数范围**: 备份最近N天的数据
- **自定义范围**: 备份指定起始和结束时间的数据

### 📅 多样的调度策略
- 高频备份（每小时）
- 日常备份（每日）
- 周期备份（每周/每月）
- 自定义cron表达式

### 🗂️ 智能文件管理
- 自动分类存储
- 压缩支持
- 自动清理过期备份
- 文件名包含备份类型和时间戳

### 🔍 监控和告警
- 备份状态监控
- 健康检查
- 失败重试机制
- 磁盘空间监控

## 安装和配置

### 1. 环境要求
- Node.js 14.0+
- MongoDB 4.0+
- MongoDB Tools (mongodump)

### 2. 安装依赖
```bash
npm install node-schedule
```

### 3. 配置文件设置

编辑 `config.js` 文件，配置您的备份策略：

```javascript
// 在 strategies 对象中添加您的备份策略
strategies: {
  // 全表备份示例
  fullBackup: {
    name: '全量备份策略',
    schedule: '0 2 * * 0',   // 每周日凌晨2点
    collections: ['users', 'orders', 'products'],
    retentionDays: 90,
    compress: true,
    timeField: 'createdAt',
    priority: 3,
    timeRange: {
      type: 'full'  // 备份整个表
    }
  }
}
```

## 时间范围配置详解

### 1. 当天数据备份 (today)
```javascript
timeRange: {
  type: 'today'
}
```
- 备份当天从00:00:00到23:59:59的数据
- 适用于日常增量备份

### 2. 全表备份 (full)
```javascript
timeRange: {
  type: 'full'
}
```
- 备份整个表的所有数据
- 不添加任何时间限制
- 适用于完整数据备份

### 3. 小时范围备份 (hours)
```javascript
timeRange: {
  type: 'hours',
  hours: 24  // 最近24小时
}
```
- 从当前时间向前N小时的数据
- 适用于热数据快速备份

### 4. 天数范围备份 (days)
```javascript
timeRange: {
  type: 'days',
  days: 7  // 最近7天
}
```
- 从当前时间向前N天的数据
- 适用于周期性数据备份

### 5. 自定义时间范围 (custom)
```javascript
timeRange: {
  type: 'custom',
  startDate: '2024-01-01',
  endDate: '2024-03-31'
}
```
- 指定具体的开始和结束时间
- 日期格式：YYYY-MM-DD
- 适用于历史数据迁移或特定时期备份

## 使用方法

### 启动备份服务
```bash
# 启动定时备份服务
node incremental_backup_manager.js --start

# 立即执行一次备份
node incremental_backup_manager.js --once

# 查看当前状态
node incremental_backup_manager.js --status

# 显示配置信息
node incremental_backup_manager.js --config

# 显示帮助信息
node incremental_backup_manager.js --help
```

### PM2 生产环境部署
```bash
# 使用PM2启动
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs dcmes-incremental-backup
```

## 配置示例

### 示例1: 混合备份策略
```javascript
strategies: {
  // 热点数据 - 每小时备份最近6小时
  hotData: {
    name: '热点数据备份',
    schedule: '0 */1 * * *',
    collections: ['real_time_data', 'user_activities'],
    retentionHours: 48,
    compress: true,
    timeField: 'timestamp',
    priority: 1,
    timeRange: {
      type: 'hours',
      hours: 6
    }
  },
  
  // 业务数据 - 每日备份当天数据
  businessData: {
    name: '业务数据备份',
    schedule: '0 1 * * *',
    collections: ['orders', 'transactions', 'inventory'],
    retentionDays: 30,
    compress: true,
    timeField: 'createdAt',
    priority: 2,
    timeRange: {
      type: 'today'
    }
  },
  
  // 配置数据 - 每周全表备份
  configData: {
    name: '配置数据备份',
    schedule: '0 2 * * 0',
    collections: ['settings', 'users', 'roles'],
    retentionDays: 90,
    compress: true,
    timeField: 'updatedAt',
    priority: 3,
    timeRange: {
      type: 'full'
    }
  }
}
```

### 示例2: 历史数据归档
```javascript
// 按季度归档历史数据
historyArchive: {
  name: '历史数据归档',
  schedule: '0 3 1 */3 *',  // 每季度第一天执行
  collections: ['archived_orders', 'old_logs'],
  retentionDays: 365,
  compress: true,
  timeField: 'createdAt',
  priority: 4,
  timeRange: {
    type: 'custom',
    startDate: '2024-01-01',
    endDate: '2024-03-31'
  }
}
```

## 备份文件命名规则

根据时间范围类型，生成不同的文件名前缀：

- `full_` - 全表备份
- `daily_` - 当天数据备份
- `24h_` - 24小时范围备份
- `7d_` - 7天范围备份
- `custom_` - 自定义范围备份

完整示例：`full_2024-09-20_14-30-00_users.archive.gz`

## 目录结构

```
backupPath/
├── 2024-09-20/               # 按日期分组
│   ├── hot/                  # 高频数据备份
│   ├── daily/                # 日常数据备份
│   ├── full/                 # 全量备份
│   ├── history/              # 历史数据备份
│   ├── custom/               # 自定义范围备份
│   └── other/                # 其他类型备份
├── 2024-09-21/               # 下一天的备份
│   ├── hot/
│   ├── daily/
│   └── ...
└── logs/                     # 系统日志
```

## 监控和维护

### 状态检查
```bash
# 查看详细状态
node incremental_backup_manager.js --status
```

### 日志文件
- `logs/incremental_backup.log` - 主日志
- `logs/alerts.log` - 告警日志
- `manager_state.json` - 状态持久化

### 健康指标
- 备份成功率
- 平均备份大小
- 失败重试次数
- 磁盘空间使用

## 故障排除

### 常见问题

1. **MongoDB工具不可用**
   - 确保mongodump已安装并在PATH中
   - 检查Tools目录配置

2. **时间范围配置错误**
   - 验证日期格式：YYYY-MM-DD
   - 确保开始时间小于结束时间

3. **备份文件过大**
   - 启用压缩选项
   - 调整时间范围减少数据量

4. **权限问题**
   - 确保备份目录有写入权限
   - 检查MongoDB连接权限

### 性能优化建议

1. **避免高峰期备份**
   - 将备份调度设置在业务低峰期
   - 使用不同优先级控制执行顺序

2. **合理设置保留期**
   - 根据存储容量设置合适的保留天数
   - 定期清理不需要的备份文件

3. **监控资源使用**
   - 定期检查磁盘空间
   - 监控备份执行时间

## 更新日志

### v1.1.0 (2024-09-20)
- ✨ 新增多种时间范围配置选项
- ✨ 支持全表备份功能
- ✨ 增加自定义时间范围备份
- 🐛 修复文件名生成逻辑
- 📝 完善配置文档和示例

### v1.0.0
- 🎉 初始版本发布
- 📦 基础增量备份功能
- ⏰ 定时任务调度
- 📊 状态监控和统计

## 技术支持

如有问题或建议，请联系系统管理员。

---

**注意**: 请在生产环境使用前充分测试备份和恢复流程，确保数据安全。 