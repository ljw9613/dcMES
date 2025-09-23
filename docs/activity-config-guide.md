# 用户活动监听配置指南

## 概述

本文档详细说明如何使用配置文件来控制用户活动监听和自动退出功能。通过配置文件，您可以灵活地启用或禁用该功能，以及调整各种参数。

## 配置文件位置

```
dcMes_vue_system/src/config/activityConfig.js
```

## 主要配置项

### 1. 基础开关

```javascript
{
  // 是否启用活动时间过期校验
  enabled: true,
}
```

- `enabled: true` - 启用活动监听功能
- `enabled: false` - 完全禁用活动监听功能

### 2. 时间配置

```javascript
{
  // 会话超时时间（毫秒）- 15分钟
  sessionTimeout: 15 * 60 * 1000,
  
  // 警告时间（毫秒）- 14分钟
  warningTime: 14 * 60 * 1000,
}
```

### 3. 监听事件

```javascript
{
  // 监听的事件类型
  monitorEvents: [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ],
}
```

### 4. 功能开关

```javascript
{
  // 是否在页面刷新时检查活动超时
  checkOnPageLoad: true,
  
  // 是否拦截路由跳转（当会话过期时）
  interceptRouting: true,
  
  // 是否拦截API请求（当会话过期时）
  interceptApiRequests: true,
  
  // 是否监听页面可见性变化
  monitorVisibilityChange: true,
}
```

### 5. 调试配置

```javascript
{
  // 调试模式
  debug: process.env.NODE_ENV === 'development',
}
```

### 6. 自定义消息

```javascript
{
  messages: {
    warningMessage: '您已经1分钟没有操作了，系统将在1分钟后自动退出，请点击任意位置继续使用',
    expiredMessage: '会话已过期，请进行任意操作以重新登录',
    logoutMessage: '会话已过期，系统自动退出',
    forceReloginTitle: '会话过期',
    forceReloginContent: '您的会话已过期，为了您的账户安全，需要重新登录。',
    forceReloginConfirm: '重新登录'
  }
}
```

## 使用方法

### 1. 导入配置

```javascript
import { 
  getActivityConfig, 
  updateActivityConfig, 
  enableActivityMonitor, 
  disableActivityMonitor,
  isActivityMonitorEnabled 
} from '@/config/activityConfig'
```

### 2. 获取当前配置

```javascript
const config = getActivityConfig()
console.log('当前配置:', config)
```

### 3. 运行时修改配置

```javascript
// 更新部分配置
updateActivityConfig({
  sessionTimeout: 30 * 60 * 1000, // 改为30分钟
  warningTime: 28 * 60 * 1000,    // 改为28分钟
})

// 启用/禁用功能
enableActivityMonitor()   // 启用
disableActivityMonitor()  // 禁用

// 检查是否启用
if (isActivityMonitorEnabled()) {
  console.log('功能已启用')
}
```

### 4. 开发环境调试

在开发环境下，配置会自动暴露到全局：

```javascript
// 在浏览器控制台中使用
window.activityConfig.get()          // 获取配置
window.activityConfig.enable()       // 启用功能
window.activityConfig.disable()      // 禁用功能
window.activityConfig.isEnabled()    // 检查状态
window.activityConfig.update({       // 更新配置
  sessionTimeout: 5 * 60 * 1000      // 改为5分钟（测试用）
})
window.activityConfig.reset()        // 重置为默认值
```

## 常见应用场景

### 1. 完全禁用功能

```javascript
// 在配置文件中设置
enabled: false

// 或运行时禁用
disableActivityMonitor()
```

### 2. 缩短超时时间（用于测试）

```javascript
updateActivityConfig({
  sessionTimeout: 2 * 60 * 1000,   // 2分钟
  warningTime: 1 * 60 * 1000,      // 1分钟
})
```

### 3. 只监听不拦截

```javascript
updateActivityConfig({
  interceptRouting: false,      // 不拦截路由
  interceptApiRequests: false,  // 不拦截API
  checkOnPageLoad: false,       // 不检查页面加载
})
```

### 4. 自定义消息内容

```javascript
updateActivityConfig({
  messages: {
    warningMessage: '自定义警告消息',
    expiredMessage: '自定义过期消息',
    // ... 其他消息
  }
})
```

## 测试功能

访问测试页面：`/test/auto-logout-test`

在测试页面中，您可以：

1. **实时查看配置状态** - 显示所有配置项的当前值
2. **切换功能开关** - 点击"启用监听"/"禁用监听"按钮
3. **重新加载配置** - 点击"重新加载配置"按钮
4. **查看配置详情** - 包括超时时间、拦截设置等

## 注意事项

### 1. 配置生效时机

- **页面级配置**：页面刷新后生效
- **运行时配置**：立即生效（通过 `updateActivityConfig`）
- **功能开关**：立即生效（通过 `enableActivityMonitor`/`disableActivityMonitor`）

### 2. 配置优先级

1. 运行时配置（最高优先级）
2. 配置文件设置
3. 默认值（最低优先级）

### 3. 兼容性说明

- 功能禁用时，所有相关的拦截器都会跳过检查
- 已经过期的会话在重新启用功能后仍然是过期状态
- 配置变更不会影响已经设置的定时器，需要重新启动监听

### 4. 最佳实践

1. **生产环境**：建议启用所有拦截功能，确保安全性
2. **开发环境**：可以禁用功能或缩短时间以便测试
3. **测试环境**：使用较短的超时时间进行快速验证
4. **配置修改**：重要配置变更建议通过配置文件而非运行时修改

## 故障排除

### 1. 功能未生效

- 检查 `enabled` 是否为 `true`
- 确认相关拦截开关是否开启
- 查看浏览器控制台是否有错误信息

### 2. 时间不准确

- 确认 `sessionTimeout` 和 `warningTime` 设置正确
- 检查是否有运行时配置覆盖了文件配置

### 3. 调试信息

在开发环境下：

```javascript
// 开启调试模式
updateActivityConfig({ debug: true })

// 查看详细报告
window.debugActivityMonitor.generateReport()
```

这个配置系统为用户活动监听功能提供了完整的灵活性，既可以满足生产环境的安全要求，也可以适应不同的测试和开发需求。
