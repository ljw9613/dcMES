# UDI抽检记录工单计划ID批量更新脚本

## 功能说明

本脚本用于批量更新UDI抽检记录中缺失的`productionPlanWorkOrderId`字段。通过从关联的`materialProcessFlow`记录中获取工单计划ID，并批量更新到抽检记录中，实现数据完整性修复。

## 脚本文件

- `updateSamplingInspectionWorkOrder.js` - 主脚本文件
- `../update-sampling-workorder.bat` - Windows批处理文件
- `../update-sampling-workorder.sh` - Linux/Mac shell脚本

## 使用方法

### 方法一：直接运行Node.js脚本

```bash
# 基本用法（默认批次大小100）
node scripts/updateSamplingInspectionWorkOrder.js

# 自定义批次大小
node scripts/updateSamplingInspectionWorkOrder.js --batch-size=50

# 验证更新结果
node scripts/updateSamplingInspectionWorkOrder.js --validate

# 显示帮助信息
node scripts/updateSamplingInspectionWorkOrder.js --help
```

### 方法二：使用批处理脚本（推荐）

#### Windows系统
```cmd
# 在dcMes_server目录下运行
update-sampling-workorder.bat
```

#### Linux/Mac系统
```bash
# 在dcMes_server目录下运行
./update-sampling-workorder.sh
```

## 命令行参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `--batch-size=<数量>` | 设置批次大小（1-1000） | `--batch-size=50` |
| `--validate` | 验证更新结果，显示示例记录 | `--validate` |
| `--help`, `-h` | 显示帮助信息 | `--help` |

## 工作原理

1. **连接数据库**：使用项目配置连接MongoDB数据库
2. **统计记录**：统计缺少`productionPlanWorkOrderId`的抽检记录总数
3. **分批查询**：按指定批次大小分批查询记录，避免内存溢出
4. **数据处理**：从`materialProcessFlow`中获取工单计划ID
5. **批量更新**：使用MongoDB的`bulkWrite`进行高效批量更新
6. **结果统计**：输出详细的处理结果和统计信息

## 性能优化

- **分批处理**：避免一次性加载大量数据导致内存溢出
- **Lean查询**：使用`.lean()`返回普通JS对象，提高查询性能
- **批量写入**：使用`bulkWrite`提高写入效率
- **垃圾回收**：主动触发垃圾回收释放内存
- **连接池**：优化数据库连接配置，支持高并发

## 批次大小建议

| 数据量 | 建议批次大小 | 内存使用 | 执行时间 |
|--------|-------------|----------|----------|
| < 1万条 | 100-200 | 低 | 快 |
| 1-10万条 | 50-100 | 中等 | 中等 |
| > 10万条 | 25-50 | 高 | 较慢 |

## 输出信息说明

### 进度信息
```
======== 第 1/10 批次 ========
跳过 0 条，查询 100 条记录...
本批次实际查询到 100 条记录
第 1 批次更新完成，成功更新 95 条记录
当前进度: 100/1000 (10.0%)
```

### 统计结果
```
=============== 更新结果统计 ===============
总记录数: 1000
成功更新: 950
失败数量: 50
处理总数: 1000
成功率: 95.00%
完成率: 100.00%
```

### 错误详情
```
=============== 错误详情 ===============
1. 记录ID: 507f1f77bcf86cd799439011, 条码: ABC123, 原因: materialProcessFlow中没有productionPlanWorkOrderId
2. 批次: 5, 原因: 批次查询失败: Connection timeout
```

## 注意事项

1. **数据备份**：运行前建议备份数据库
2. **网络稳定**：确保网络连接稳定，避免连接超时
3. **资源监控**：监控服务器资源使用情况
4. **中断恢复**：脚本支持中断后重新运行，会跳过已更新的记录
5. **并发控制**：避免同时运行多个实例

## 故障排除

### 常见错误

1. **连接超时**
   - 检查网络连接
   - 减小批次大小
   - 增加连接超时时间

2. **内存不足**
   - 减小批次大小
   - 关闭其他应用程序
   - 增加服务器内存

3. **权限错误**
   - 检查数据库用户权限
   - 确认Node.js执行权限

### 性能调优

1. **批次大小**：根据服务器性能调整
2. **连接池**：优化数据库连接配置
3. **索引优化**：确保相关字段有索引
4. **并发控制**：合理控制并发数量

## 验证更新结果

运行验证命令查看示例更新记录：

```bash
node scripts/updateSamplingInspectionWorkOrder.js --validate
```

输出示例：
```
=============== 示例验证记录 ===============
1. 条码: ABC123456
   工单计划ID: 507f1f77bcf86cd799439011
   工单号: WO2024001
   销售订单号: SO2024001
   客户PO: PO2024001
   ---
```

## 日志记录

脚本会输出详细的执行日志，包括：
- 连接状态
- 处理进度
- 错误信息
- 统计结果

建议将输出重定向到日志文件：

```bash
# 保存完整日志
node scripts/updateSamplingInspectionWorkOrder.js > update_log.txt 2>&1

# 只保存错误日志
node scripts/updateSamplingInspectionWorkOrder.js 2> error_log.txt
```

## 技术支持

如遇到问题，请检查：
1. Node.js版本是否兼容
2. 数据库连接是否正常
3. 脚本文件是否完整
4. 网络连接是否稳定

## 更新历史

- v1.0.0: 初始版本，支持基本批量更新功能
- v1.1.0: 添加分批查询功能，优化内存使用
- v1.2.0: 添加命令行参数支持和批处理脚本 