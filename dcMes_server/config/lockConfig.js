/*
 * @name: 用户锁定配置
 * @content: 管理用户账号锁定相关的配置项
 * @Author: AI Assistant
 * @Date: 2025-09-25
 */

module.exports = {
  // 登录失败配置
  loginFail: {
    maxFailCount: 5,        // 最大失败次数
    lockDuration: 15        // 锁定时长（分钟）
  },
  
  // 自动解锁配置
  autoUnlock: {
    enabled: false,          // 是否启用自动解锁（true: 启用自动解锁, false: 仅管理员解锁）
    showCountdown: true     // 是否显示倒计时（仅在自动解锁启用时有效）
  },
  
  // 提示消息配置
  messages: {
    // 自动解锁启用时的消息
    autoUnlockEnabled: {
      lockMessage: "密码错误次数过多，账号已被锁定{duration}分钟！",
      unlockHint: "请等待{remainingTime}分钟后重试，或联系管理员解锁",
      countdownHint: "账号已被锁定，剩余时间：{remainingTime}"
    },
    // 自动解锁禁用时的消息
    autoUnlockDisabled: {
      lockMessage: "密码错误次数过多，账号已被锁定！",
      unlockHint: "请联系管理员解锁账号",
      adminOnlyHint: "账号已被锁定，请联系管理员解锁"
    }
  }
};
