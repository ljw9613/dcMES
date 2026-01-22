# 用户锁定管理功能说明

## 功能概述

在用户管理页面增加了用户锁定状态显示和解锁管理功能，管理员可以实时查看用户的锁定状态，并可以手动解锁被锁定的用户账号。

## 新增功能特性

### 1. 锁定状态显示
- **实时状态**：表格中新增"锁定状态"列，显示每个用户的当前锁定状态
- **状态标识**：
  - 🔓 绿色标签 "正常" - 用户未被锁定
  - 🔒 红色标签 "已锁定" - 用户当前被锁定
- **详细信息**：
  - 显示锁定剩余时间（分钟）
  - 显示登录失败次数

### 2. 解锁管理功能
- **解锁按钮**：被锁定的用户行中显示"解锁"按钮
- **权限控制**：只有拥有"用户列表解锁"权限的管理员才能看到解锁按钮
- **确认对话框**：点击解锁按钮弹出确认对话框，显示用户详细信息
- **即时生效**：解锁成功后立即更新状态显示

### 3. 自动刷新机制
- **定时刷新**：每30秒自动刷新一次锁定状态
- **即时更新**：解锁操作后立即刷新该用户状态
- **资源清理**：页面销毁时自动清理定时器

## 技术实现

### 后端API接口

#### 1. 获取用户锁定状态
```javascript
// API: POST /user/lockStatus
// 请求参数: { userName: "用户名" }
// 返回数据: {
//   code: 200,
//   data: {
//     userName: "用户名",
//     isLocked: false,
//     lockedUntil: null,
//     remainingMinutes: 0,
//     loginFailCount: 0
//   }
// }
```

#### 2. 解锁用户账号
```javascript
// API: POST /user/unlock
// 请求参数: { userName: "用户名" }
// 返回数据: {
//   code: 200,
//   message: "用户已成功解锁"
// }
```

### 前端实现

#### 1. API封装
```javascript
// src/api/user.js
export function getUserLockStatus(data) {
  return request({
    url: '/user/lockStatus',
    method: 'post',
    data
  })
}

export function unlockUser(data) {
  return request({
    url: '/user/unlock',
    method: 'post',
    data
  })
}
```

#### 2. 数据结构
```javascript
// 用户数据增加lockInfo字段
user: {
  // ... 原有字段
  lockInfo: {
    isLocked: false,        // 是否被锁定
    remainingMinutes: 0,    // 剩余锁定时间（分钟）
    loginFailCount: 0,      // 登录失败次数
    userName: "用户名",     // 用户名
    lockedUntil: null       // 锁定截止时间
  }
}
```

#### 3. 核心方法
```javascript
// 获取所有用户锁定状态
async loadLockStatus() {
  const promises = this.categorylist.map(async (user) => {
    const response = await getUserLockStatus({ userName: user.userName });
    this.$set(user, 'lockInfo', response.data);
  });
  await Promise.all(promises);
}

// 解锁用户
async confirmUnlockUser() {
  const response = await unlockUser({ userName: this.selectedUser.userName });
  if (response.code === 200) {
    this.$message.success('解锁成功');
    await this.refreshSingleUserLockStatus(this.selectedUser.userName);
  }
}
```

## 界面显示

### 1. 锁定状态列
- **正常状态**：显示绿色"正常"标签
- **锁定状态**：显示红色"已锁定"标签 + 剩余时间
- **失败计数**：显示橙色失败次数信息
- **加载状态**：显示灰色"检查中..."状态

### 2. 操作按钮
- **解锁按钮**：橙色按钮，带解锁图标
- **条件显示**：只在用户被锁定且有权限时显示
- **按钮样式**：`type="warning"` + `el-icon-unlock`

### 3. 解锁确认对话框
- **标题**：解锁用户确认
- **内容**：
  - 警告图标
  - 用户基本信息（用户名、账号）
  - 当前锁定状态
  - 失败次数统计
  - 解锁后果提示
- **操作**：取消 / 确认解锁

## 权限控制

### 权限标识
- `用户列表解锁`：解锁用户账号的权限

### 权限检查
```javascript
v-if="$checkPermission('用户列表解锁')"
```

### 权限配置
需要在角色管理中为相应角色添加"用户列表解锁"权限。

## 使用流程

### 1. 查看锁定状态
1. 进入用户管理页面
2. 查看"锁定状态"列
3. 状态自动每30秒刷新一次

### 2. 解锁用户操作
1. 找到被锁定的用户（红色"已锁定"标签）
2. 点击该用户行的"解锁"按钮
3. 在弹出的确认对话框中查看用户信息
4. 点击"确认解锁"按钮
5. 系统提示解锁成功，状态立即更新

### 3. 状态说明
- **正常**：用户可以正常登录
- **已锁定X分钟**：用户被锁定，X分钟后自动解锁
- **失败X次**：用户有X次登录失败记录

## 样式特性

### 1. 状态标签样式
```scss
// 锁定倒计时
.lock-countdown {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 4px;
  text-align: center;
}

// 失败计数
.fail-count {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 4px;
  text-align: center;
}
```

### 2. 对话框样式
- 响应式布局
- 清晰的视觉层次
- 统一的颜色主题
- 友好的警告提示

## 性能优化

### 1. 批量请求
- 使用 `Promise.all()` 并发获取所有用户状态
- 避免串行请求造成的性能问题

### 2. 定时器管理
- 页面加载时启动定时器
- 页面销毁时清理定时器
- 避免内存泄漏

### 3. 状态缓存
- 使用 `$set` 方法确保响应式更新
- 避免重复请求相同数据

## 错误处理

### 1. 网络异常
- 捕获API请求异常
- 显示友好的错误提示
- 设置默认状态值

### 2. 权限异常
- 检查用户权限
- 隐藏无权限操作按钮
- 提示权限不足

### 3. 数据异常
- 验证用户数据完整性
- 处理空数据情况
- 设置合理的默认值

## 后续扩展建议

1. **批量解锁功能**：支持选择多个用户同时解锁
2. **解锁日志记录**：记录管理员解锁操作的日志
3. **锁定原因显示**：显示用户被锁定的具体原因
4. **自定义刷新频率**：允许管理员设置状态刷新时间间隔
5. **邮件通知**：解锁用户时发送邮件通知
6. **统计分析**：提供用户锁定情况的统计报表

## 注意事项

1. 确保后端API接口已正确部署
2. 检查角色权限配置是否正确
3. 定时器在页面切换时会自动清理
4. 解锁操作会立即生效，用户可马上尝试登录
5. 锁定状态刷新可能有30秒以内的延迟
