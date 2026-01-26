# 增量备份系统修复指南

## 问题概述

您遇到的错误：
```
[FAIL] - 备份管理器配置: Command failed: node incremental_backup_manager.js --config
```

## 已实施的修复

### 1. 修复了 showConfig() 方法
- 添加了策略配置的存在性检查
- 增强了错误处理机制
- 提供了更详细的调试信息

### 2. 创建了新的测试脚本
- `fixed_manager_test.js`: 简化的系统测试
- `debug_config.js`: 配置诊断工具
- 改进了原始测试脚本的错误报告

## 验证修复效果

### 方法一：运行简化测试
```bash
node fixed_manager_test.js
```

### 方法二：直接测试配置命令
```bash
node incremental_backup_manager.js --config
```

### 方法三：重新运行原始测试
```bash
node test_incremental_backup.js
```

## 预期正常输出

修复后应该显示完整的配置信息，包括：
- 数据库连接配置
- 备份路径配置  
- 两个备份策略（hotCollections 和 dailyCollections）
- 全局备份设置

## 如何启动服务

确认测试通过后：
```bash
# 启动备份服务
node incremental_backup_manager.js --start

# 或查看帮助
node incremental_backup_manager.js --help
```

修复已完成，请测试验证！ 