/**
 * 德昌MES增量备份服务器配置文件
 * 
 * 此文件包含了所有备份相关的配置项，包括：
 * - 数据库连接配置
 * - 备份策略配置（支持多种时间范围：today/yesterday/full/custom/days/hours）
 * - 存储路径配置
 * - 监控告警配置
 * 
 * 重要说明：
 * - yesterday配置适用于凌晨执行的备份任务，用于备份前一天的完整数据
 * - today配置适用于当天实时备份任务
 * - full配置用于全量备份，不限制时间范围
 * 
 * @Author: 系统管理员
 * @Date: 2024
 */

const os = require('os');
const path = require('path');

module.exports = {
  // 数据库连接配置
  database: {
    host: process.env.MONGO_HOST || '192.168.6.250',
    port: process.env.MONGO_PORT || '27017',
    database: process.env.MONGO_DB || 'dcMesCsManage',
    username: process.env.MONGO_USERNAME || 'dcMesCsManage',
    password: process.env.MONGO_PASSWORD || 'dcMesCsManage123.',
    authDatabase: process.env.MONGO_AUTH_DB || 'dcMesCsManage',
    
    // 连接选项
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 120000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true
    }
  },

  // 备份路径配置
  paths: {
    // 主备份目录
    backupPath: process.env.BACKUP_PATH || 'D:/mongobackups',
    
    // MongoDB工具路径 - 相对于主服务器的Tools目录
    toolsPath: process.env.TOOLS_PATH || '../dcMes_server/Tools',
    
    // 日志目录（相对于备份路径）
    logsDir: 'logs',
    
    // 分类备份目录
    categories: {
      hot: 'hot',
      core: 'core', 
      config: 'config',
      analytics: 'analytics'
    }
  },

  // 备份策略配置
  strategies: {
    // 高频数据集合 - 每小时备份（仅限指定的4个重要表）
    hotCollections: {
      name: '高频数据集合',
      schedule: '0 */1 * * *',  // 每小时执行
      collections: [
        'warehouse_entries',           // 仓库条目
        'material_palletizings',       // 物料托盘化
        'material_process_flows',      // 物料工艺流程
        'inspection_last_data'         // 检测最新数据
      ],
      retentionHours: 168,  // 保留168小时（7天）
      compress: true,
      timeField: 'createdAt',
      priority: 1,  // 最高优先级
      
      // 时间范围配置
      timeRange: {
        type: 'today',  // 'today' | 'yesterday' | 'full' | 'custom' | 'days' | 'hours'
        // type为custom时使用：
        // startDate: '2024-01-01',
        // endDate: '2024-12-31',
        // type为days时使用：
        // days: 7,  // 最近7天
        // type为hours时使用：
        // hours: 24  // 最近24小时
        // type为yesterday时：备份前一天的完整数据（适合凌晨执行的备份任务）
      }
    },
    
    // 所有其他集合 - 每日备份（凌晨1点）
    dailyCollections: {
      name: '日常数据集合',
      schedule: '0 1 * * *',   // 每天凌晨1点执行
      collections: [
        // 系统日志类
        'api_logs',
        'system_log',
        'chat',
        
        // 设备和记录类
        'equipmentinformations',
        'scanrecords',
        'scan_code_bind_record',
        
        // 业务流程类
        'sampling_inspection_flows',
        'product_initialize_logs',
        'production_plan_work_orders',
        'product_barcode_rule',
        'materialpalletizingunbindlogs',
        'udi_sampling_inspection_flows',
        'product_repairs',
        'unbindrecords',
        'preproductionbarcodes',
        'work_order_quantity_logs',
        
        // 条码和规则类
        'barcodesegmentrules',
        'barcodesegmentrulematerials', 
        'barcoderules',
        'packbarcodes',
        
        // 字典和配置类
        'dicttypes_copyl',
        'production_lines',
        'roles',
        'dicttypes',
        'user_logins',
        'print_templates',
        'machine',
        'crafts',
        'dictdatas',
        'menus',
        'product_di_number',
        
        // K3系统集成类
        'k3_sal_saleorderexts',
        'k3_sal_saleorder_custinfos',
        
        // 物料和工艺类
        'materialbarcodebatches',
        'processmaterials',
        'processsteps',
        'materialbarcodebatches',
        
        // 错误和异常类
        'material_palletizing_error_logs',
        
        // 映射和关联类
        'sale_order_barcode_mappings',
        
        // 资源和文件类
        'file_resources',
        
        // 连接和系统信息类
        'connection_info',
        
        // 检测和收集数据类
        'inspection_data',
        'collect_data'
      ],
      retentionDays: 30,       // 保留30天
      compress: true,
      timeField: 'createdAt',
      priority: 2,
      
      // 时间范围配置
      timeRange: {
        type: 'yesterday',  // 'today' | 'yesterday' | 'full' | 'custom' | 'days' | 'hours'
        // type为custom时使用：
        // startDate: '2024-01-01',
        // endDate: '2024-12-31',
        // type为days时使用：
        // days: 7,  // 最近7天
        // type为hours时使用：
        // hours: 24  // 最近24小时
        // type为yesterday时：备份前一天的完整数据（适合凌晨执行的备份任务）
      }
    },
    
    // 全量备份策略 - 每周执行一次
    fullBackup: {
      name: '全量备份策略',
      schedule: '0 2 * * 0',   // 每周日凌晨2点执行
      collections: [
        'warehouse_entries',
        'material_palletizings', 
        'material_process_flows',
        'inspection_last_data',
        'api_logs',
        'system_log',
        'equipmentinformations',
        'dicttypes_copyl',
        'production_lines',
        'roles',
        'dicttypes'
      ],
      retentionDays: 90,       // 保留90天
      compress: true,
      timeField: 'createdAt',
      priority: 3,
      
      // 时间范围配置 - 全表备份
      timeRange: {
        type: 'full'  // 备份整个表，不限制时间
      }
    },
    
    // 历史数据备份策略 - 每月备份最近30天的数据
    historyBackup: {
      name: '历史数据备份',
      schedule: '0 3 1 * *',   // 每月1号凌晨3点执行
      collections: [
        'warehouse_entries',
        'material_palletizings',
        'inspection_last_data',
        'api_logs',
        'system_log'
      ],
      retentionDays: 365,      // 保留1年
      compress: true,
      timeField: 'createdAt',
      priority: 4,
      
      // 时间范围配置 - 最近30天
      timeRange: {
        type: 'days',
        days: 30  // 最近30天的数据
      }
    }
  },

  // 全局备份配置
  backup: {
    // 重试配置
    maxRetries: 3,
    retryDelay: 5000,
    
    // 性能配置
    useArchiveMode: false,  // 使用标准输出模式以确保文件名控制
    globalCompress: true,   // 全局压缩
    parallelLimit: 3,      // 并行任务限制（已改为顺序执行，此配置暂不生效）
    
    // 时间配置
    timezone: 'Asia/Shanghai',
    
    // 备份验证
    verifyBackups: true
  },

  // 监控和告警配置
  monitoring: {
    // 健康检查
    healthCheck: {
      enabled: true,
      interval: 300000,  // 5分钟检查一次
      maxFailureCount: 3,
      alertOnFailure: true
    },
    
    // 磁盘空间监控
    diskSpaceCheck: {
      enabled: true,
      warningThreshold: 0.8,   // 80%时警告
      criticalThreshold: 0.9,  // 90%时严重告警
      checkInterval: 600000    // 10分钟检查一次
    },
    
    // 日志配置
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      maxFileSize: '10MB',
      maxFiles: 5,
      datePattern: 'YYYY-MM-DD'
    }
  },

  // 环境配置
  environment: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version
  },

  // PM2配置选项
  pm2: {
    name: 'dcmes-incremental-backup',
    instances: 1,
    autorestart: true,
    watch: false,
    maxMemoryRestart: '500M',
    env: {
      NODE_ENV: 'production',
      TZ: 'Asia/Shanghai'
    }
  }
}; 