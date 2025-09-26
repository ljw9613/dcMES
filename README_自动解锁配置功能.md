# 自动解锁配置功能说明

## 功能概述

新增了用户账号锁定的自动解锁配置功能，管理员可以通过配置文件控制账号锁定策略，支持两种模式：
1. **自动解锁模式**：账号锁定15分钟后自动解锁
2. **管理员解锁模式**：账号锁定后只能由管理员手动解锁

## 配置文件

### 配置文件位置
```
dcMes_server/config/lockConfig.js
```

### 配置选项说明

```javascript
module.exports = {
  // 登录失败配置
  loginFail: {
    maxFailCount: 5,        // 最大失败次数
    lockDuration: 15        // 锁定时长（分钟，仅在自动解锁启用时有效）
  },
  
  // 自动解锁配置
  autoUnlock: {
    enabled: true,          // 是否启用自动解锁
    showCountdown: true     // 是否显示倒计时（仅在自动解锁启用时有效）
  },
  
  // 提示消息配置
  messages: {
    // 自动解锁启用时的消息
    autoUnlockEnabled: {
      lockMessage: "密码错误次数过多，账号已被锁定{duration}分钟！",
      unlockHint: "请等待{remainingTime}分钟后重试，或联系管理员解锁"
    },
    // 自动解锁禁用时的消息
    autoUnlockDisabled: {
      lockMessage: "密码错误次数过多，账号已被锁定！",
      unlockHint: "请联系管理员解锁账号"
    }
  }
};
```

## 两种模式对比

### 1. 自动解锁模式 (`autoUnlock.enabled: true`)

#### 特点：
- ✅ 账号锁定15分钟后自动解锁
- ✅ 显示实时倒计时
- ✅ 用户可以等待自动解锁或联系管理员
- ✅ 适合大部分正常使用场景

#### 用户体验：
- **登录页面**：显示锁定倒计时 "账号已被锁定，剩余时间：14分25秒"
- **提示信息**：提供自动解锁时间和管理员解锁两个选项
- **管理页面**：显示剩余时间，解锁按钮标记为"立即解锁"

### 2. 管理员解锁模式 (`autoUnlock.enabled: false`)

#### 特点：
- 🔒 账号锁定后永久锁定
- 🔒 不显示倒计时
- 🔒 只能由管理员手动解锁
- 🔒 适合高安全要求的环境

#### 用户体验：
- **登录页面**：显示 "账号已被锁定，请联系管理员解锁"
- **提示信息**：明确告知只能联系管理员
- **管理页面**：显示"需管理员解锁"，解锁按钮标记为"解锁"

## 功能实现

### 后端实现 (managerlogin.js)

#### 1. 配置引入
```javascript
const lockConfig = require('../config/lockConfig');
```

#### 2. 锁定检查逻辑
```javascript
// 根据自动解锁配置生成不同的提示信息
if (lockConfig.autoUnlock.enabled) {
    // 自动解锁模式：显示倒计时和提示
} else {
    // 管理员解锁模式：只显示联系管理员提示
}
```

#### 3. 锁定策略
```javascript
if (lockConfig.autoUnlock.enabled) {
    // 设置15分钟后过期的锁定时间
    updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
} else {
    // 设置永久锁定（直到管理员解锁）
    updateData.lockedUntil = new Date('2099-12-31');
}
```

### 前端实现

#### 1. 登录页面 (login/index.vue)

**自动解锁启用时：**
```html
<div class="lock-countdown">
  账号已被锁定，剩余时间：{{ formatRemainingTime(lockRemainingTime) }}
</div>
<div class="unlock-hint">
  请等待15分钟后重试，或联系管理员解锁
</div>
```

**自动解锁禁用时：**
```html
<div class="lock-permanent">
  账号已被锁定，请联系管理员解锁
</div>
<div class="unlock-hint">
  请联系管理员解锁账号
</div>
```

#### 2. 用户管理页面 (user/index.vue)

**锁定状态显示：**
- 自动解锁：显示剩余时间倒计时
- 管理员解锁：显示"需管理员解锁"

**解锁按钮：**
- 自动解锁：按钮文字为"立即解锁"
- 管理员解锁：按钮文字为"解锁"

## 配置修改指南

### 启用自动解锁
```javascript
// dcMes_server/config/lockConfig.js
autoUnlock: {
  enabled: true,          // 启用自动解锁
  showCountdown: true     // 显示倒计时
}
```

### 禁用自动解锁（仅管理员解锁）
```javascript
// dcMes_server/config/lockConfig.js
autoUnlock: {
  enabled: false,         // 禁用自动解锁
  showCountdown: false    // 不显示倒计时
}
```

### 调整失败次数和锁定时长
```javascript
// dcMes_server/config/lockConfig.js
loginFail: {
  maxFailCount: 3,        // 改为3次失败锁定
  lockDuration: 30        // 改为锁定30分钟
}
```

### 自定义提示消息
```javascript
// dcMes_server/config/lockConfig.js
messages: {
  autoUnlockEnabled: {
    lockMessage: "您的账号因多次错误登录被暂时锁定{duration}分钟",
    unlockHint: "请耐心等待{remainingTime}分钟，或联系技术支持"
  },
  autoUnlockDisabled: {
    lockMessage: "账号安全锁定，需要人工验证",
    unlockHint: "请联系系统管理员进行账号解锁"
  }
}
```

## 部署和配置

### 1. 部署步骤
1. 将新的配置文件放置到 `dcMes_server/config/` 目录
2. 重启后端服务以加载新配置
3. 前端会自动读取后端返回的配置信息

### 2. 配置验证
可以通过以下方式验证配置是否生效：
1. 连续输入5次错误密码
2. 观察锁定提示是否符合配置
3. 检查用户管理页面的状态显示

### 3. 实时配置修改
修改配置文件后需要重启后端服务：
```bash
# 重启方式（根据您的部署方式选择）
npm restart
# 或
pm2 restart dcMes_server
```

## 安全性考虑

### 1. 配置文件安全
- 配置文件应该只有管理员可以修改
- 建议定期审查配置设置
- 重要环境建议禁用自动解锁

### 2. 模式选择建议
- **开发/测试环境**：建议启用自动解锁，便于测试
- **生产环境（一般）**：根据安全需求选择
- **高安全环境**：建议禁用自动解锁，只允许管理员解锁

### 3. 监控和日志
- 系统会记录所有锁定和解锁操作
- 建议定期检查异常的锁定模式
- 注意监控频繁被锁定的账号

## 常见问题

### Q1: 修改配置后不生效？
**A:** 需要重启后端服务以加载新配置。

### Q2: 可以针对不同用户设置不同的锁定策略吗？
**A:** 当前版本是全局配置，所有用户使用相同策略。如需个性化配置，需要进一步开发。

### Q3: 自动解锁禁用后，用户永远无法登录？
**A:** 不会，管理员可以通过用户管理页面的解锁功能手动解锁。

### Q4: 能否设置不同时间段的不同策略？
**A:** 当前版本不支持，但可以通过修改配置文件实现定时策略调整。

## 扩展建议

1. **角色级别配置**：为不同角色设置不同的锁定策略
2. **时间段配置**：工作时间和非工作时间使用不同策略
3. **IP白名单**：特定IP地址不受锁定限制
4. **邮件通知**：账号被锁定时发送邮件通知
5. **审计日志**：详细记录所有锁定和解锁操作
