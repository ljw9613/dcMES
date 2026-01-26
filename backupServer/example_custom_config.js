/**
 * 自定义备份配置示例文件
 * 
 * 此文件展示了如何配置不同的时间范围备份策略
 * 使用方法：复制此文件内容到 config.js 的 strategies 部分
 * 
 * @Author: 系统管理员
 * @Date: 2024
 */

module.exports = {
  // 示例备份策略配置
  exampleStrategies: {
    
    // 1. 当天数据备份（默认）
    todayBackup: {
      name: '当天数据备份',
      schedule: '0 */2 * * *',  // 每2小时执行
      collections: ['warehouse_entries', 'material_palletizings'],
      retentionHours: 48,
      compress: true,
      timeField: 'createdAt',
      priority: 1,
      timeRange: {
        type: 'today'  // 备份当天的数据
      }
    },

    // 2. 全表备份（无时间限制）
    fullTableBackup: {
      name: '全表数据备份',
      schedule: '0 2 * * 0',   // 每周日凌晨2点执行
      collections: ['dicttypes', 'roles', 'production_lines'],
      retentionDays: 90,
      compress: true,
      timeField: 'createdAt',
      priority: 2,
      timeRange: {
        type: 'full'  // 备份整个表，不限制时间
      }
    },

    // 3. 最近N小时数据备份
    recentHoursBackup: {
      name: '最近24小时数据备份',
      schedule: '0 4 * * *',   // 每天凌晨4点执行
      collections: ['api_logs', 'system_log', 'chat'],
      retentionDays: 7,
      compress: true,
      timeField: 'createdAt',
      priority: 3,
      timeRange: {
        type: 'hours',
        hours: 24  // 最近24小时的数据
      }
    },

    // 4. 最近N天数据备份
    recentDaysBackup: {
      name: '最近7天数据备份',
      schedule: '0 1 * * 1',   // 每周一凌晨1点执行
      collections: ['inspection_last_data', 'material_process_flows'],
      retentionDays: 30,
      compress: true,
      timeField: 'createdAt',
      priority: 4,
      timeRange: {
        type: 'days',
        days: 7  // 最近7天的数据
      }
    },

    // 5. 自定义时间范围备份
    customRangeBackup: {
      name: '自定义时间范围备份',
      schedule: '0 3 1 * *',   // 每月1号凌晨3点执行
      collections: ['production_plan_work_orders', 'product_initialize_logs'],
      retentionDays: 365,
      compress: true,
      timeField: 'createdAt',
      priority: 5,
      timeRange: {
        type: 'custom',
        startDate: '2024-01-01',  // 开始日期
        endDate: '2024-12-31'     // 结束日期
      }
    },

    // 6. 混合策略示例 - 重要数据多重备份
    criticalDataBackup: {
      name: '重要数据多重备份',
      schedule: '0 */6 * * *',  // 每6小时执行
      collections: ['warehouse_entries', 'inspection_last_data'],
      retentionHours: 72,
      compress: true,
      timeField: 'createdAt',
      priority: 1,
      timeRange: {
        type: 'hours',
        hours: 6  // 最近6小时的数据，确保数据及时备份
      }
    }
  },

  // 使用说明
  usage: {
    description: "时间范围配置说明",
    timeRangeTypes: {
      today: "备份当天从00:00:00到23:59:59的数据",
      full: "备份整个表的所有数据，不添加时间限制",
      hours: "备份最近N小时的数据，需设置hours参数",
      days: "备份最近N天的数据，需设置days参数",
      custom: "备份指定时间范围的数据，需设置startDate和endDate"
    },
    examples: {
      "最近12小时": {
        type: "hours",
        hours: 12
      },
      "最近30天": {
        type: "days", 
        days: 30
      },
      "2024年第一季度": {
        type: "custom",
        startDate: "2024-01-01",
        endDate: "2024-03-31"
      },
      "全表数据": {
        type: "full"
      },
      "今天数据": {
        type: "today"
      }
    },
    notes: [
      "时间范围基于配置的timeField字段（通常是createdAt）",
      "自定义时间范围的日期格式：YYYY-MM-DD",
      "如果只指定日期不指定时间，endDate会自动设置为当天的23:59:59",
      "全表备份会忽略时间字段，备份整个集合",
      "建议为不同类型的数据设置不同的备份策略"
    ]
  }
}; 