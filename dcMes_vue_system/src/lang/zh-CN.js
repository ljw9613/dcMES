/*
 * @name: 中文语言包
 * @content: 中文(简体)国际化资源文件
 * @Author: ljw
 * @Email: 1798245303@qq.com
 * @Date: 2025-01-23
 */

export default {
  // 通用
  common: {
    confirm: "确认",
    cancel: "取消",
    save: "保存",
    delete: "删除",
    edit: "编辑",
    add: "添加",
    search: "搜索",
    reset: "重置",
    submit: "提交",
    back: "返回",
    close: "关闭",
    loading: "加载中...",
    success: "成功",
    error: "错误",
    warning: "警告",
    info: "信息",
    yes: "是",
    no: "否",
    operation: "操作",
    status: "状态",
    remark: "备注",
    createTime: "创建时间",
    updateTime: "更新时间"
  },

  // 菜单国际化
  menu: {
    // 系统管理
    systemManagement: {
      title: "系统管理",
      userList: "用户列表",
      menuManagement: "菜单管理",
      roleManagement: "角色管理",
      dictionaryManagement: "字典管理",
      dictionaryData: "字典数据",
      logManagement: "日志管理"
    },

    // 生产管理
    productionManagement: {
      title: "生产管理",
      productionOrder: "生产订单",
      productionPlan: "生产计划",
      productionLine: "生产产线",
      productionCraft: "生产工艺",
      productionBarcode: "生产条码"
    },

    // 产线管理
    lineManagement: {
      title: "产线管理",
      scanBarCode: "产线扫码",
      scanBarCodeBatch: "打包托盘",
      productRepair: "产品维修",
      scanBarCodeConver: "扫码转换",
      scanBarCodeRepair: "扫码维修",
      scanBarCodeCheck: "产线校验",
      customScanCheck: "自定义扫码",
      scBigView: "产线大屏",
      palletBarcodeVerification: "托盘校验",
      boxBarcodeVerification: "箱码校验",
      scanBarCodeSimple: "简单扫码",
      palletAssembly: "托盘组装",
      scanBarCodePack: "打包装箱",
      scanBarCodeBatchNew: "打包托盘（包含子物料）"
    },

    // 金蝶云数据
    kingdeeData: {
      title: "金蝶云数据",
      materialInfo: "物料信息",
      saleOrder: "销售订单",
      stockInfo: "仓库信息",
      purchaseOrder: "采购订单",
      pickMaterial: "生产领料",
      deliveryNotice: "发货通知单",
      productionInStock: "生产入库单",
      requisitionBill: "采购申请单",
      outStock: "销售出库单"
    },

    // 设备管理
    equipmentManagement: {
      title: "设备管理",
      equipmentInfo: "设备信息",
      detectionData: "检测数据"
    },

    // 仓库管理
    warehouseManagement: {
      title: "仓库管理",
      materialPalletizing: "托盘单据",
      warehouseEntry: "生产入库单",
      warehouseOntry: "生产出库单"
    },

    // 产品追溯
    productTraceability: {
      title: "产品追溯",
      materialProcessFlow: "条码记录",
      productTrace: "成品追溯",
      packBarcode: "装箱条码"
    },

    // 基础设置
    basicSettings: {
      title: "基础设置",
      printTemplate: "打印模板",
      barcodeRule: "条码匹配规则",
      barcodeSegmentRule: "条码生成规则"
    },

    // 品质成品抽检
    qualityInspection: {
      title: "品质成品抽检",
      samplingInspectionFlow: "条码抽检",
      udiSamplingInspectionFlow: "UDI抽检"
    },

    // 客户条码
    customerBarcode: {
      title: "客户条码",
      udiDataManagement: "SN-SFTP条码列表"
    },

    // 通用菜单
    common: {
      noticeList: "通知列表",
      recruitmentManagement: "招聘管理",
      messageManagement: "留言管理",
      honorManagement: "荣誉管理",
      materialLibraryManagement: "素材库管理",
      productCategoryManagement: "产品分类管理"
    }
  },

  // 导航栏
  navbar: {
    welcome: "欢迎您",
    logout: "退出登录",
    changePassword: "修改密码",
    language: "语言",
    chinese: "中文",
    vietnamese: "越南语"
  },

  // 扫码页面
  scanBarCode: {
    // 工序设置
    processSettings: {
      title: "工序设置",
      auto: "自动",
      manual: "手动",
      productModel: "产品型号",
      productModelPlaceholder: "请输入物料编码/名称搜索",
      processStep: "产品工序",
      processStepPlaceholder: "请选择产品工序",
      productionLine: "产线编码",
      productionLinePlaceholder: "请输入产线信息搜索",
      saveSettings: "保存设置",
      cancelSettings: "取消设置",
      connected: "已连接",
      disconnected: "未连接",
      basicInfo: "基础信息"
    },

    // 条码扫描
    barcodeScanning: {
      title: "条码扫描",
      expand: "展开",
      collapse: "收起",
      clearCache: "清除批次物料缓存",
      unifiedScanArea: "统一扫描区域",
      scanPlaceholder: "请扫描条码",
      mainMaterial: "主物料",
      subMaterial: "子物料",
      print: "打印",
      noScanRequired: "无需扫码",
      batchMaterial: "批次物料",
      keyMaterial: "关键物料",
      materialCode: "编号",
      materialName: "名称",
      scanMainBarcodePlaceholder: "请扫描主物料条码",
      scanSubBarcodePlaceholder: "请扫描子物料条码"
    },

    // 工单信息
    workOrder: {
      workOrderNo: "工单号",
      noWorkOrder: "暂无工单",
      inputQuantity: "投入数量",
      planQuantity: "计划数量",
      scrapQuantity: "报废数量"
    },

    // 消息提示
    messages: {
      scanSuccess: "扫描成功",
      mainMaterialScanSuccess: "主物料扫描成功",
      barcodeValidationFailed: "条码验证失败",
      barcodeFormatError: "条码格式不正确,未在系统中注册",
      duplicateBarcode: "该条码已被使用过，请确认是否重复扫描",
      flowRecordCreated: "成品条码追溯记录创建成功",
      flowRecordCreateFailed: "创建成品条码追溯记录失败",
      pleaseInitializeProcess: "请先初始化工序设置,请选择绑定工序或检测工序"
    },

    // 扫描模式
    scanning: {
      normalMode: "普通模式",
      rfidMode: "RFID模式",
      modeTooltip: "普通模式用于扫描条码，RFID模式用于读取RFID标签",
      unifiedScanArea: "统一扫描区域",
      materialMatching: "物料匹配扫描",
      batchCacheEnabled: "批次物料缓存已启用",
      scanPlaceholder: "请扫描条码",
      mainBarcodePlaceholder: "请扫描主物料条码",
      subBarcodePlaceholder: "请扫描子物料条码",
      noScanRequired: "无需扫码",
      batchMaterial: "批次物料",
      processingBox: "正在处理包装箱条码，请稍候...",
      processProgress: "处理进度",
      scannedBarcodes: "已扫描条码",
      currentProgress: "当前进度",
      barcodeLabel: "条码：",
      scanTime: "扫描时间："
    },

    // 按钮
    buttons: {
      reset: "重置",
      confirm: "确认",
      print: "打印",
      manualInput: "手动输入查询"
    }
  },

  // 系统消息
  system: {
    loginSuccess: "登录成功",
    loginFailed: "登录失败",
    logoutSuccess: "退出成功",
    saveSuccess: "保存成功",
    saveFailed: "保存失败",
    deleteSuccess: "删除成功",
    deleteFailed: "删除失败",
    updateSuccess: "更新成功",
    updateFailed: "更新失败",
    operationSuccess: "操作成功",
    operationFailed: "操作失败",
    networkError: "网络错误",
    serverError: "服务器错误",
    permissionDenied: "权限不足",
    dataNotFound: "数据不存在"
  },

  // 批量扫码页面
  scanBarCodeBatch: {
    title: "批量扫码",
    processSettings: {
      title: "工序设置",
      auto: "自动",
      manual: "手动",
      productModel: "产品型号",
      productModelPlaceholder: "请输入物料编码/名称搜索",
      processStep: "产品工序",
      processStepPlaceholder: "请选择产品工序",
      productionLine: "产线编码",
      productionLinePlaceholder: "请输入产线信息搜索",
      saveSettings: "保存设置",
      cancelSettings: "取消设置",
      connected: "已连接",
      disconnected: "未连接",
      basicInfo: "基础信息"
    },
    batchScanning: {
      title: "批量条码扫描",
      expand: "展开",
      collapse: "收起",
      clearCache: "清除批次物料缓存",
      scanPlaceholder: "请扫描条码",
      batchSize: "批量大小",
      currentBatch: "当前批次",
      totalScanned: "已扫描总数",
      batchProgress: "批次进度"
    },
    scanning: {
      normalMode: "普通模式",
      rfidMode: "RFID模式",
      modeTooltip: "普通模式用于扫描条码，RFID模式用于读取RFID标签",
      rfidPlaceholder: "请读取RFID标签",
      processingBox: "正在处理包装箱条码，请稍候...",
      processProgress: "处理进度",
      unifiedScanArea: '统一扫描区域',
      materialMatching: '物料匹配扫描',
      batchCacheEnabled: '批次物料缓存已启用',
      scanPlaceholder: '请扫描条码',
      mainBarcodePlaceholder: '请扫描主物料条码',
      subBarcodePlaceholder: '请扫描子物料条码',
      noScanRequired: '无需扫码',
      batchMaterial: '批次物料',
      processingBox: '正在处理包装箱条码，请稍候...',
      scannedBarcodes: '已扫描条码',
      currentProgress: '当前进度',
      barcodeLabel: '条码：',
      scanTime: '扫描时间：'
    },
    documentInfo: {
      title: "单据信息",
      saleOrderNo: "销售单号：",
      palletDocumentNo: "托盘单据编号：",
      workOrderNo: "生产工单：",
      palletDocumentQuantity: "托盘单据数量：",
      materialNumber: "物料编号：",
      materialName: "物料名称：",
      materialSpec: "物料规格：",
      notGenerated: "未生成"
    },
    subMaterialScanning: {
      title: "子物料扫描",
      noScanRequired: "无需扫码",
      scanSubMaterialPlaceholder: "请扫描子物料条码",
      batchMaterial: "批次物料"
    },
    scannedList: {
      title: "已扫描条码",
      currentProgress: "当前进度",
      barcodeLabel: "条码：",
      scanTimeLabel: "扫描时间："
    },
    initTip: {
      message: "请先初始化工序设置,检测当前工序是否为托盘工序"
    },
    buttons: {
      reset: "重置",
      confirm: "确认",
      batchProcess: "批量处理",
      exportData: "导出数据",
      clearAll: "清空所有"
    },
    messages: {
      batchScanSuccess: "批量扫描成功",
      batchProcessSuccess: "批量处理成功",
      batchProcessFailed: "批量处理失败",
      pleaseSelectItems: "请选择要处理的项目",
      confirmBatchProcess: "确认要批量处理选中的项目吗？",
      // 模式切换消息
      switchToNormalMode: "已切换至普通模式",
      switchToRfidMode: "已切换至RFID模式",
      autoInitEnabled: "已开启自动初始化模式",
      autoInitDisabled: "已关闭自动初始化模式",
      // 产品和工序消息
      noProductModelSet: "当前没有设置产品型号",
      currentProductModel: "当前产品型号",
      noProcessStepSet: "当前没有设置产品工序",
      currentProcessStep: "当前产品工序",
      noProductionLineSet: "当前没有设置产线",
      currentProductionLine: "当前产线",
      productAndProcessAlreadySet: "已经设置好了产品和工序",
      // 初始化消息
      autoInitSuccess: "自动初始化工序成功",
      noMachineProgressConfig: "未获取到机器进度配置",
      getMachineProgressFailed: "获取机器进度失败",
      autoInitFailed: "自动初始化失败",
      // 保存和取消消息
      pleaseSelectProductProcessLine: "请选择产品型号、工序和产线",
      saveSuccess: "保存成功",
      saveFailed: "保存失败",
      cancelSettingsConfirm:
        "确认取消当前工序设置？这将清除所有批次物料和打印模板的缓存数据。",
      cancellingSettings: "取消设置中...",
      settingsCancelled: "已取消工序设置",
      cancelSettingsFailed: "取消设置失败",
      // 扫描相关消息
      scanSuccess: "扫描成功",
      subMaterialScanSuccess: "子物料扫描成功",
      barcodeScanSuccess: "条码扫描成功",
      barcodeAlreadyScanned: "该条码已扫描",
      barcodeFormatIncorrect: "条码格式不正确，未在系统中注册",
      materialMismatch: "条码对应物料与当前工序所需物料不匹配",
      hasUnfinishedRepairRecord: "该条码存在未完成的维修记录",
      hasCompletedScrapProcessing: "该条码已完成报废处理",
      repairResultUnqualified: "该条码已完成维修,但维修结果为不合格",
      // 批次相关消息
      batchQuantityCannotBeLessThan: "批次数量不能小于已入托数量",
      confirmSaveBatchQuantity: "确认保存当前批次数量设置？保存后将无法修改。",
      batchQuantitySettingSaved: "批次数量设置已保存",
      confirmCancelBatchQuantity: "确认取消当前批次数量设置？",
      batchQuantitySettingCancelled: "已取消批次数量设置",
      noEditPermission: "无修改产线编辑配置权限",
      // 清除缓存消息
      confirmClearCache: "确认清除所有页面缓存数据？此操作不可恢复。",
      clearingCache: "清除缓存中...",
      cacheClearedSuccess: "缓存清除成功",
      clearCacheFailed: "清除缓存失败",
      // 设备连接消息
      deviceServerConnected: "设备服务器连接成功",
      deviceConnectionLost: "设备连接已断开",
      deviceNotConnected: "设备未连接",
      maxReconnectAttemptsReached: "重连次数已达上限，请检查网络连接或刷新页面",
      deviceConnectionInitFailed: "设备连接初始化失败",
      // 打印相关消息
      printTemplateRequired: "请先选择打印模板",
      printTemplateSaved: "打印模板已保存到本地",
      printTemplateSaveFailed: "保存打印模板失败",
      batchBarcodePrintSuccess: "批次条码打印成功",
      printFailed: "打印失败",
      autoPrintEnabled: "已开启自动打印模式",
      autoPrintDisabled: "已关闭自动打印模式",
      // 列表操作消息
      confirmClearScannedList: "确认清空已扫描列表?",
      scannedListCleared: "列表已清空",
      // 销售单号相关消息
      currentProductionLineNotSet: "当前产线未设置",
      noActiveWorkOrderOnLine: "当前产线没有在生产中的工单",
      getSaleOrderNumberFailed: "获取销售单号失败"
    }
  },

  // 新批量扫码页面
  scanBarCodeBatchNew: {
    title: "新批量扫码",
    processSettings: {
      title: "工序设置",
      auto: "自动",
      manual: "手动",
      connected: "已连接",
      disconnected: "未连接",
      basicInfo: "基础信息",
      productModel: "产品型号",
      productModelPlaceholder: "请输入物料编码/名称搜索",
      processStep: "产品工序",
      processStepPlaceholder: "请选择产品工序",
      productionLine: "产线编码",
      productionLinePlaceholder: "请输入产线信息搜索",
      saveSettings: "保存设置",
      cancelSettings: "取消设置"
    },
    documentInfo: {
      title: "单据信息",
      saleOrderNo: "销售单号",
      palletCode: "托盘编号",
      workOrderNo: "生产工单",
      totalQuantity: "托盘数量",
      materialNumber: "物料编号",
      materialName: "物料名称",
      materialSpec: "物料规格",
      notGenerated: "未生成"
    },
    palletManagement: {
      title: "托盘管理",
      expand: "展开",
      collapse: "收起",
      clearCache: "清除批次物料缓存",
      productQuantity: "产品数量",
      save: "保存",
      cancel: "取消"
    },
    scanning: {
      unifiedScanArea: "统一扫描区域",
      materialMatching: "物料匹配扫描",
      batchCacheEnabled: "批次物料缓存已启用",
      scanPlaceholder: "请扫描条码",
      mainBarcodePlaceholder: "请扫描主物料条码",
      subBarcodePlaceholder: "请扫描子物料条码",
      noScanRequired: "无需扫码",
      batchMaterial: "批次物料",
      processingBox: "正在处理包装箱条码，请稍候...",
      processProgress: "处理进度",
      scannedBarcodes: "已扫描条码",
      currentProgress: "当前进度",
      barcodeLabel: "条码：",
      scanTime: "扫描时间："
    },
    initTip: {
      message: "请先初始化工序设置,检测当前工序是否为托盘工序"
    },
    buttons: {
      reset: "重置",
      confirm: "确认",
      addToBatch: "添加到批次",
      removeBatch: "移除批次",
      processBatch: "处理批次"
    },
    messages: {
      // 模式切换消息
      switchToNormalMode: "已切换至普通模式",
      switchToRfidMode: "已切换至RFID模式",
      autoInitEnabled: "已开启自动初始化模式",
      autoInitDisabled: "已关闭自动初始化模式",
      autoInitSuccess: "自动初始化工序成功",
      autoInitFailed: "自动初始化失败",
      noMachineProgressConfig: "未获取到机器进度配置",
      // 保存相关消息
      pleaseSelectProductProcessLine: "请选择产品型号、工序和产线",
      saveSuccess: "保存成功",
      saveFailed: "保存失败",
      cancelSettingsSuccess: "已取消工序设置",
      cancelSettingsFailed: "取消设置失败",
      // 扫描相关消息
      scanSuccess: "扫描成功",
      scanSuccessful: "扫码成功",
      mainMaterialScanSuccess: "主物料扫描成功",
      subMaterialScanSuccess: "子物料扫描成功",
      barcodeValidationFailed: "条码验证失败",
      barcodeFormatIncorrect: "条码格式不正确，未在系统中注册",
      barcodeNotMatchAnyMaterial: "条码不匹配任何所需物料",
      flowRecordCreateSuccess: "成品条码追溯记录创建成功",
      // 系统错误消息
      getProductModelFailed: "获取产品型号失败",
      getProcessStepsFailed: "获取工序列表失败",
      getMainMaterialInfoFailed: "获取主物料信息失败",
      getProcessMaterialsFailed: "获取工序物料失败",
      getBarcodeRulesFailed: "获取条码规则失败",
      diCodeNotExist: "该DI编码不存在本系统",
      diCodeNoMaterial: "该DI编码未关联有效物料",
      diCodeMaterialMismatch: "该DI编码对应的物料与当前工序不匹配",
      diCodeValidationFailed: "DI码验证失败",
      barcodeRuleNotFound: "未找到可用的条码规则（包括产品特定规则和全局规则）",
      barcodeRuleNotMatch: "该条码不符合任何已配置的规则或物料不匹配",
      barcodeValidationError: "条码验证过程发生错误",
      // 维修相关消息
      repairRecordExists: "该条码存在未完成的维修记录",
      barcodeScrapProcessed: "该条码已完成报废处理",
      repairResultUnqualified: "该条码已完成维修,但维修结果为不合格",
      // 托盘解绑消息
      palletUnbindRecord: "该条码存在托盘解绑记录，请在维修台进行处理",
      // 包装箱相关消息
      processingBoxBarcode: "正在处理包装箱条码，请等待处理完成...",
      printTemplateRequired: "请先选择打印模板",
      boxProcessRequired: "当前工艺包含装箱工序，必须扫描包装箱条码。",
      boxQuantityExceedsLimit: "包装箱内条码数量超过托盘剩余可用数量",
      boxScanSuccess: "包装箱扫描成功，新增个条码",
      scanProcessingFailed: "扫描处理失败",
      // 批次相关消息
      batchUsageLimitReached: "批次物料条码已达到使用次数限制",
      batchQuantityCannotBeLess: "批次数量不能小于已入托数量",
      batchSizeSettingSaved: "批次数量设置已保存",
      batchSizeSettingCancelled: "已取消批次数量设置",
      batchSizeSaveFailed: "保存失败",
      batchSizeCancelFailed: "取消失败",
      noEditPermission: "无修改产线编辑配置权限",
      listCleared: "列表已清空",
      currentLineNotSet: "当前产线未设置",
      noActiveWorkOrder: "当前产线没有在生产中的工单",
      workOrderChanged: "检测到工单已更换，批次物料缓存已清理",
      // 打印相关消息
      printTemplateSaved: "打印模板已保存到本地",
      printTemplateSaveFailed: "保存打印模板失败",
      batchBarcodePrintSuccess: "批次条码打印成功",
      printFailed: "打印失败",
      autoPrintEnabled: "已开启自动打印模式",
      autoPrintDisabled: "已关闭自动打印模式",
      // 设备连接消息
      deviceServerConnected: "设备服务器连接成功",
      deviceConnectionLost: "设备连接已断开",
      maxReconnectAttemptsReached: "重连次数已达上限，请检查网络连接或刷新页面",
      deviceConnectionInitFailed: "设备连接初始化失败",
      deviceNotConnected: "设备未连接",
      // 缓存相关消息
      cacheClearedSuccess: "缓存清除成功，共清除个缓存项",
      clearCacheFailed: "清除缓存失败",
      // 销售单号相关
      getSaleOrderNumberFailed: "获取销售单号失败",
      // 确认失败消息
      confirmFailed: "确认失败",
      // 其他消息
      addToBatchSuccess: "添加到批次成功",
      removeBatchSuccess: "移除批次成功",
      batchProcessSuccess: "批次处理成功",
      batchProcessFailed: "批次处理失败",
      pleaseInitializeProcess: "请先初始化批量扫码工序设置",
      // 测试消息
      palletAutoModeSwitch: "打包托盘手动/自动模式切换",
      palletProductSelect: "打包托盘产品型号选择",
      palletProcessSelect: "打包托盘产品工序选择",
      palletLineSelect: "打包托盘产线编码选择",
      palletSaveSettings: "打包托盘保存设置"
    }
  },

  // 扫码转换页面
  scanBarCodeConver: {
    title: "扫码转换",
    processSettings: {
      title: "工序设置",
      auto: "自动",
      manual: "手动",
      connected: "已连接",
      disconnected: "未连接",
      basicInfo: "基础信息",
      productModel: "产品型号",
      productModelPlaceholder: "请输入物料编码/名称搜索",
      processStep: "产品工序",
      processStepPlaceholder: "请选择产品工序",
      productionLine: "产线编码",
      productionLinePlaceholder: "请输入产线信息搜索",
      saveSettings: "保存设置",
      cancelSettings: "取消设置"
    },
    scanning: {
      title: "统一扫描区域",
      scanPlaceholder: "请扫描条码",
      mainMaterial: "主物料",
      conversion: "转化",
      normal: "普通",
      subMaterial: "子物料",
      reset: "重置",
      confirm: "确认",
      expand: "展开",
      collapse: "收起",
      clearCache: "清除缓存",
      mainBarcodePlaceholder: "请扫描主物料条码",
      subBarcodePlaceholder: "请扫描子物料条码",
      noScanRequired: "无需扫码",
      batchMaterial: "批次物料",
      originalBarcode: "原条码",
      newBarcode: "新条码",
      scanOriginalPlaceholder: "请扫描原条码",
      scanNewPlaceholder: "请扫描新条码",
      conversionType: "转换类型",
      conversionReason: "转换原因"
    },
    materialInfo: {
      materialNumber: "物料编号：",
      materialName: "物料名称："
    },
    initTip: {
      message: "请先初始化工序设置,请选择打印工序"
    },
    buttons: {
      reset: "重置",
      confirm: "确认转换",
      convert: "转换"
    },
    messages: {
      // 模式切换消息
      switchToNormalMode: "已切换至普通模式",
      switchToRfidMode: "已切换至RFID模式",
      autoInitEnabled: "已开启自动初始化模式",
      autoInitDisabled: "已关闭自动初始化模式",
      autoInitSuccess: "自动初始化工序成功",
      autoInitFailed: "自动初始化失败",
      noMachineProgressConfig: "未获取到机器进度配置",
      getMachineProgressFailed: "获取机器进度失败",
      // 保存相关消息
      pleaseSelectProductProcessLine: "请选择产品型号、工序和产线",
      saveSuccess: "保存成功",
      saveFailed: "保存失败",
      cancelSettingsConfirm:
        "确认取消当前工序设置？这将清除所有批次物料的缓存数据。",
      settingsCancelled: "已取消工序设置",
      cancelSettingsFailed: "取消设置失败",
      // 扫描相关消息
      scanSuccess: "扫描成功",
      scanSuccessful: "扫码成功",
      barcodeValidationFailed: "条码验证失败",
      barcodeFormatIncorrect: "条码格式不正确，未在系统中注册",
      materialMismatch: "条码不匹配主物料",
      printTemplateRequired: "请先选择打印模板",
      printTemplateSaved: "打印模板已保存到本地",
      printTemplateSaveFailed: "保存打印模板失败",
      batchBarcodePrintSuccess: "批次条码打印成功",
      printFailed: "打印失败",
      autoPrintEnabled: "已开启自动打印模式",
      autoPrintDisabled: "已关闭自动打印模式",
      conversionEnabled: "已开启转化模式",
      conversionDisabled: "已关闭转化模式",
      // 设备连接消息
      deviceServerConnected: "设备服务器连接成功",
      deviceConnectionLost: "设备连接已断开",
      maxReconnectAttemptsReached: "重连次数已达上限，请检查网络连接或刷新页面",
      deviceConnectionInitFailed: "设备连接初始化失败",
      deviceNotConnected: "设备未连接",
      // 其他消息
      confirmClearCache: "确认清除所有页面缓存数据？此操作不可恢复。",
      cacheClearedSuccess: "缓存清除成功",
      clearCacheFailed: "清除缓存失败",
      confirmCompleteAllScanning: "请完成所有必要的条码扫描",
      conversionSuccess: "转换成功",
      conversionFailed: "转换失败",
      pleaseInitializeProcess: "请先初始化转换工序设置",
      // 系统错误消息
      getBarcodeRulesFailed: "获取条码规则失败",
      getProductModelFailed: "获取产品型号失败",
      getProcessStepsFailed: "获取工序列表失败",
      autoApplyPrintTemplate: "已自动应用工序关联的打印模板",
      getPrintTemplateFailed: "获取工序关联打印模板失败",
      getMainMaterialInfoFailed: "获取主物料信息失败",
      getProcessMaterialsFailed: "获取工序物料失败",
      diCodeNotExist: "该DI编码不存在本系统",
      diCodeNoMaterial: "该DI编码未关联有效物料",
      diCodeMaterialMismatch: "该DI编码对应的物料与当前工序不匹配",
      diCodeValidationFailed: "DI码验证失败",
      barcodeRuleNotMatch: "该条码不符合任何已配置的规则或物料不匹配",
      barcodeValidationError: "条码验证过程发生错误",
      flowRecordCreateSuccess: "成品条码追溯记录创建成功",
      repairRecordExists: "该条码存在未完成的维修记录",
      barcodeScrapProcessed: "该条码已完成报废处理",
      repairResultUnqualified: "该条码已完成维修,但维修结果为不合格",
      barcodeVoided: "该条码已作废",
      confirmFailedPrefix: "确认失败:",
      batchUsageLimitReached: "批次条码使用次数已达到上限"
    }
  },

  // 扫码包装页面
  scanBarCodePack: {
    title: "扫码包装",
    processSettings: {
      title: "工序设置",
      auto: "自动",
      manual: "手动",
      connected: "已连接",
      disconnected: "未连接",
      basicInfo: "基础信息",
      productModel: "产品型号",
      productModelPlaceholder: "请输入物料编码/名称搜索",
      processStep: "产品工序",
      processStepPlaceholder: "请选择产品工序",
      productionLine: "产线编码",
      productionLinePlaceholder: "请输入产线信息搜索",
      saveSettings: "保存设置",
      cancelSettings: "取消设置"
    },
    scanning: {
      title: "条码扫描",
      expand: "展开",
      collapse: "收起",
      clearCache: "清除批次物料缓存",
      unifiedScanArea: "统一扫描区域",
      scanPlaceholder: "请扫描条码",
      mainMaterial: "主物料",
      subMaterial: "子物料",
      mainBarcodePlaceholder: "请扫描主物料条码",
      subBarcodePlaceholder: "请扫描子物料条码",
      noScanRequired: "无需扫码",
      batchMaterial: "批次物料"
    },
    packaging: {
      notGenerated: "未生成包装箱条码",
      packageBarcode: "包装箱条码",
      pending: "待装满",
      packageType: "包装类型",
      packageSize: "包装规格",
      productBarcode: "产品条码",
      packageQuantity: "包装数量"
    },
    materialInfo: {
      materialNumber: "物料编号：",
      materialName: "物料名称："
    },
    initTip: {
      message: "请先初始化工序设置,请选择非托盘工序"
    },
    buttons: {
      reset: "重置",
      confirm: "确认",
      package: "打包",
      print: "打印标签"
    },
    messages: {
      // 模式切换消息
      autoInitEnabled: "已开启自动初始化模式",
      autoInitDisabled: "已关闭自动初始化模式",
      autoInitSuccess: "自动初始化工序成功",
      autoInitFailed: "自动初始化失败",
      noMachineProgressConfig: "未获取到机器进度配置",
      // 保存相关消息
      pleaseSelectProductProcessLine: "请选择产品型号、工序和产线",
      saveSuccess: "保存成功",
      saveFailed: "保存失败",
      cancelSettingsSuccess: "已取消工序设置",
      cancelSettingsFailed: "取消设置失败",
      // 扫描相关消息
      scanSuccess: "扫描成功",
      scanSuccessful: "扫码成功",
      mainMaterialScanSuccess: "主物料扫描成功",
      subMaterialScanSuccess: "子物料扫描成功",
      barcodeValidationFailed: "条码验证失败",
      barcodeFormatIncorrect: "条码格式不正确,未在系统中注册",
      barcodeNotMatch: "条码不匹配",
      flowRecordCreateSuccess: "成品条码追溯记录创建成功",
      // 打印相关消息
      printTemplateRequired: "请先选择打印模板",
      printTemplateSaved: "打印模板已保存到本地",
      printTemplateSaveFailed: "保存打印模板失败",
      batchBarcodePrintSuccess: "批次条码打印成功",
      printFailed: "打印失败",
      autoPrintEnabled: "已开启自动打印模式",
      autoPrintDisabled: "已关闭自动打印模式",
      batchBarcodeGenerateFailed: "批次条码生成失败",
      // 系统错误消息
      getBarcodeRulesFailed: "获取条码规则失败",
      getProductModelFailed: "获取产品型号失败",
      getProcessStepsFailed: "获取工序列表失败",
      getMainMaterialInfoFailed: "获取主物料信息失败",
      getProcessMaterialsFailed: "获取工序物料失败",
      diCodeNotExist: "该DI编码不存在本系统",
      diCodeNoMaterial: "该DI编码未关联有效物料",
      diCodeMaterialMismatch: "该DI编码对应的物料与当前工序不匹配",
      diCodeValidationFailed: "DI码验证失败",
      barcodeRuleNotFound: "未找到可用的条码规则（包括产品特定规则和全局规则）",
      barcodeRuleNotMatch: "该条码不符合任何已配置的规则或物料不匹配",
      barcodeValidationError: "条码验证过程发生错误",
      // 维修相关消息
      repairRecordExists: "该条码存在未完成的维修记录",
      barcodeScrapProcessed: "该条码已完成报废处理",
      repairResultUnqualified: "该条码已完成维修,但维修结果为不合格",
      // 包装相关消息
      useMainBarcodeInOrder: "请按顺序使用主物料条码，应使用条码",
      batchUsageLimitReached: "批次条码使用次数已达到上限",
      batchUsageLimitReachedWithCode: "批次物料条码已达到使用次数限制",
      confirmCompleteAllScanning: "请完成所有必要的条码扫描",
      confirmFailedPrefix: "确认失败",
      // 设备连接消息
      deviceServerConnected: "设备服务器连接成功",
      deviceConnectionLost: "设备连接已断开",
      maxReconnectAttemptsReached: "重连次数已达上限，请检查网络连接或刷新页面",
      deviceConnectionInitFailed: "设备连接初始化失败",
      deviceNotConnected: "设备未连接",
      // 缓存相关消息
      cacheClearedSuccess: "缓存清除成功",
      clearCacheFailed: "清除缓存失败",
      // 包装箱相关消息
      materialNotBoundBarcodeRule: "该物料未绑定条码生成规则",
      getBarcodeRuleDetailsFailed: "获取条码规则详情失败",
      noActiveWorkOrderOnLine: "当前产线没有正在生产的工单",
      generatedBarcodeEmpty: "生成的条码为空",
      packingBarcodeInitialized: "装箱条码已初始化",
      // 其他消息
      packageSuccess: "包装成功",
      packageFailed: "包装失败",
      pleaseInitializeProcess: "请先初始化工序设置,请选择非托盘工序"
    }
  },

  // 扫码维修页面
  scanBarCodeRepair: {
    title: "扫码维修",
    processSettings: {
      title: "维修工序设置",
      productModel: "产品型号",
      productModelPlaceholder: "请输入物料编码/名称搜索",
      processStep: "产品工序",
      processStepPlaceholder: "请选择产品工序",
      productionLine: "产线编码",
      productionLinePlaceholder: "请输入产线信息搜索",
      workOrder: "维修工单",
      workOrderPlaceholder: "请输入工单号/型号搜索（必填）",
      saveSettings: "保存设置",
      cancelSettings: "取消设置",
      repairBasicInfo: "维修基础信息",
      repairTypePlaceholder: "请选择维修类型"
    },
    repairTypes: {
      rework: "返修",
      repair: "维修",
      replace: "更换"
    },
    workOrder: {
      number: "维修工单号",
      repairQuantity: "维修数量",
      noWorkOrder: "暂无工单",
      planned: "计划",
      input: "投入"
    },
    material: {
      code: "编号",
      name: "名称",
      barcode: "条码",
      relatedBill: "关联单号"
    },
    productionLine: {
      line1: "产线1",
      line2: "产线2"
    },
    scanning: {
      title: "维修站点扫描",
      scanArea: "维修条码扫描区域",
      mainMaterial: "待维修主物料",
      repairComponents: "维修所需部件",
      scanPlaceholder: "请扫描条码",
      scanMainBarcodePlaceholder: "请扫描待维修主物料条码",
      scanSubBarcodePlaceholder: "请扫描子物料条码",
      conversion: "转化",
      normal: "普通"
    },
    buttons: {
      reset: "重置",
      confirmRepair: "确认维修",
      clearWorkOrder: "清空工单选择",
      expand: "展开",
      collapse: "收起",
      clearCache: "清除批次物料缓存"
    },
    status: {
      connected: "已连接",
      disconnected: "未连接",
      noScanRequired: "无需扫码",
      batchMaterial: "批次物料",
      keyMaterial: "关键物料"
    },
    initTip: {
      message: "请先设置维修工序，请选择绑定工序或检测工序"
    },
    messages: {
      // 模式切换消息
      autoInitEnabled: "已开启自动初始化模式",
      autoInitDisabled: "已关闭自动初始化模式",
      autoInitSuccess: "自动初始化工序成功",
      autoInitFailed: "自动初始化失败",
      noMachineProgressConfig: "未获取到机器进度配置",
      conversionEnabled: "已开启转化模式",
      conversionDisabled: "已关闭转化模式",
      autoPrintEnabled: "已开启自动打印模式",
      autoPrintDisabled: "已关闭自动打印模式",
      // 保存相关消息
      workOrderRequired: "必须选择维修工单才能保存设置",
      saveSuccess: "保存成功",
      saveFailed: "保存失败",
      cancelSettingsSuccess: "已取消工序设置",
      cancelSettingsFailed: "取消设置失败",
      workOrderSelected: "已选择工单",
      clearWorkOrderSuccess: "已清空工单选择",
      // 获取数据相关消息
      getBarcodeRulesFailed: "获取条码规则失败",
      getProductModelFailed: "获取产品型号失败",
      getProcessStepsFailed: "获取工序列表失败",
      getMainMaterialInfoFailed: "获取主物料信息失败",
      getProcessMaterialsFailed: "获取工序物料失败",
      getProcessTemplateFailed: "获取工序关联打印模板失败",
      templateAppliedSuccess: "已自动应用工序关联的打印模板",
      // 扫描相关消息
      scanSuccess: "扫描成功",
      scanSuccessful: "扫码成功",
      mainMaterialScanSuccess: "主物料扫描成功",
      subMaterialScanSuccess: "子物料扫描成功",
      flowRecordCreateSuccess: "成品条码追溯记录创建成功",
      batchBarcodeGenerateFailed: "批次条码生成失败",
      pleaseSelectTemplate: "请先选择打印模板",
      // 条码验证消息
      diCodeMaterialMismatch: "该DI编码对应的物料与当前工序不匹配",
      diCodeNoMaterial: "该DI编码未关联有效物料",
      diCodeValidationFailed: "DI码验证失败",
      barcodeRuleNotFound: "未找到可用的条码规则（包括产品特定规则和全局规则）",
      barcodeRuleNotMatch: "该条码不符合任何已配置的规则或物料不匹配",
      barcodeValidationError: "条码验证过程发生错误",
      barcodeNotMatch: "条码不匹配",
      // 维修相关消息
      repairRecordExists: "该条码存在未完成的维修记录",
      barcodeScrapProcessed: "该条码已完成报废处理",
      repairResultUnqualified: "该条码已完成维修,但维修结果为不合格",
      barcodeVoided: "该条码已作废",
      barcodeSuspended: "该条码已暂停使用",
      materialExpired: "该物料已过期，不可使用",
      keyMaterialRequireMainBarcode: "关键物料必须先扫描主条码",
      // 批次相关消息
      batchUsageLimitReached: "批次物料条码已达到使用次数限制",
      batchUsageLimitReachedWithCount:
        "批次物料条码 {barcode} 已达到使用次数限制 {count}次",
      batchCodeUsageLimitReached: "批次条码使用次数已达到上限",
      // 确认相关消息
      pleaseCompleteAllScans: "请完成所有必要的条码扫描",
      confirmFailed: "确认失败",
      workOrderNotFound: "未查询到生产工单",
      processNodeCompleted: "该主物料条码对应工序节点已完成或处于异常状态",
      // 打印相关消息
      printSuccess: "批次条码打印成功",
      printFailed: "打印失败",
      printTemplateSaved: "打印模板已保存到本地",
      printTemplateSaveFailed: "保存打印模板失败",
      // 缓存相关消息
      cacheClearSuccess: "缓存清除成功",
      cacheClearFailed: "清除缓存失败",
      // 设备连接消息
      deviceServerConnected: "设备服务器连接成功",
      deviceConnectionLost: "设备连接已断开，{delay}秒后尝试第{attempts}次重连",
      maxReconnectAttemptsReached: "重连次数已达上限，请检查网络连接或刷新页面",
      deviceConnectionInitFailed: "设备连接初始化失败",
      deviceNotConnected: "设备未连接",
      // 新增消息
      generatingBatchBarcode: "正在生成批次条码...",
      materialCodeNotFound: "未获取到物料编码信息",
      printDataNotReady: "打印数据未准备就绪",
      missingRequiredFields: "缺少必填项",
      pleaseSelectRequired: "请选择必填项",
      saving: "保存中...",
      processStepNotFound: "未找到工序信息",
      craftInfoNotFound: "未找到工艺信息",
      materialInfoNotFound: "未找到物料信息",
      createFlowRecordFailed: "创建成品条码追溯记录失败",
      materialNotFound: "未找到对应的物料信息",
      materialCodeMismatch: "物料编码不一致",
      barcodeValidationFailed: "条码验证失败",
      barcodeFormatIncorrect: "条码格式不正确,未在系统中注册",
      scanComplete: "扫描完成",
      allMaterialsScanned: "所有物料已扫描完成",
      sendingConfirmation: "正在发送确认提交...",
      continueScan: "继续扫描",
      pleaseContinueScanning: "请继续扫描以下物料：",
      scanProcessFailed: "扫描处理失败",
      cancellingSettings: "取消设置中...",
      clearingCache: "清除缓存中...",
      createMainFlowRecordFailed: "创建主流程记录失败",
      invalidFlowRecord: "未能获取或创建有效的工艺流程记录",
      productionPlanNotFound: "未查询到生产计划",
      getMachineProgressFailed: "获取机器进度失败",
      scanMainBarcodeFirst: "请先扫描主条码",
      // 确认对话框消息
      confirmCancelSettings:
        "确认取消当前工序设置？这将清除所有批次物料的缓存数据。",
      confirmClearCache: "确认清除所有页面缓存数据？此操作不可恢复。"
    },
    dialogs: {
      hint: "提示",
      confirm: "确定",
      cancel: "取消"
    }
  },

  // 扫码维修页面
  scanBarCodeRepair2: {
    messages: {
      repairSuccess: "维修成功",
      repairFailed: "维修失败",
      pleaseInitializeProcess: "请先设置维修工序，请选择绑定工序或检测工序"
    }
  },

  // 扫码检查页面
  scanBarCodeCheck: {
    title: "条码流程节点检查",
    scanning: {
      scanPlaceholder: "请扫描条码或手动输入",
      scanTip: "请将条码对准扫描枪，或在输入框中输入条码后按下Enter键",
      query: "查询",
      manualInput: "手动输入查询"
    },
    results: {
      barcodeInfo: "条码基本信息",
      barcode: "条码",
      materialCode: "物料编码",
      materialName: "物料名称",
      status: "状态",
      progress: "完成进度",
      completed: "已完成",
      incomplete: "未完成",
      flowCompleted: "流程已完成",
      flowIncomplete: "流程未完成"
    },
    statistics: {
      totalNodes: "总节点数",
      completedNodes: "已完成",
      pendingNodes: "未完成",
      pendingNodesList: "未完成节点列表",
      nodeName: "节点名称",
      nodeType: "节点类型",
      processStep: "工序",
      material: "物料"
    },
    status: {
      pending: "待处理",
      inProgress: "进行中",
      completed: "已完成",
      skipped: "已跳过",
      error: "异常"
    },
    messages: {
      pleaseInputBarcode: "请输入条码",
      checkComplete: "条码检查完成",
      flowNotComplete: "流程尚未完成",
      queryFailed: "查询失败",
      systemError: "系统错误，请重试",
      startVerification: "开始产线验证流程，请扫描二维码",
      queryingBarcode: "正在查询条码信息..."
    }
  },

  // 产品维修页面
  productRepair: {
    title: "产品维修管理",
    search: {
      title: "筛选搜索",
      productBarcode: "产品条码",
      productBarcodePlaceholder: "请输入产品条码",
      productModel: "产品型号",
      productModelPlaceholder: "请输入产品型号",
      solution: "处理方案",
      solutionPlaceholder: "请选择处理方案",
      workOrderNo: "生产工单",
      workOrderNoPlaceholder: "请输入生产工单",
      saleOrderNo: "销售订单",
      saleOrderNoPlaceholder: "请输入销售订单",
      productionOrderNo: "生产订单",
      productionOrderNoPlaceholder: "请输入生产订单",
      materialNumber: "物料编号",
      materialNumberPlaceholder: "请输入物料编号",
      status: "状态",
      statusPlaceholder: "请选择状态",
      originalBarcode: "原产品条码",
      originalBarcodePlaceholder: "请输入原产品条码",
      newBarcode: "新产品条码",
      newBarcodePlaceholder: "请输入新产品条码"
    },
    buttons: {
      search: "查询搜索",
      reset: "重置",
      addMainRepair: "新增成品维修",
      addAuxiliaryRepair: "新增组件维修",
      batchVoid: "批量作废",
      batchReview: "批量审核",
      exportData: "导出数据",
      exporting: "正在导出",
      view: "查看",
      viewProductDetails: "查看产品详情",
      review: "审核",
      edit: "修改",
      void: "作废",
      cancel: "取 消",
      confirm: "确 定"
    },
    table: {
      title: "维修记录列表",
      productBarcode: "产品条码",
      productModel: "产品型号",
      saleOrderNo: "销售订单",
      productionOrderNo: "生产订单",
      workOrderNo: "生产工单",
      repairPerson: "维修上报人",
      repairTime: "维修时间",
      businessType: "业务类型",
      solution: "处理方案",
      defectDescription: "不良现象",
      causeAnalysis: "分析原因",
      repairDescription: "维修描述",
      reviewer: "审核人",
      reviewTime: "审核时间",
      productStatus: "产品状态",
      repairResult: "维修结果",
      status: "状态",
      operation: "操作",
      noData: "暂无数据",
      repairRecordList: "维修记录列表"
    },
    operations: {
      view: "查看",
      viewProductDetails: "查看产品详情",
      review: "审核",
      edit: "修改",
      void: "作废"
    },
    status: {
      pendingReview: "待审核",
      reviewed: "已审核",
      voided: "已作废",
      repairing: "维修中",
      scrap: "报废"
    },
    repairResult: {
      qualified: "合格",
      unqualified: "不合格"
    },
    solutionOptions: {
      scrap: "报废",
      repair: "维修",
      rework: "返工"
    },
    lineTypes: {
      assembly: "组装线",
      smt: "SMT线",
      testing: "测试线",
      packaging: "包装线",
      other: "其他"
    },
    dialogs: {
      review: "审核",
      batchReview: "批量审核",
      processFlowDetails: "工艺流程详情",
      mainProductInfo: "主产品信息",
      productBarcode: "产品条码：",
      materialName: "物料名称：",
      materialSpec: "物料规格：",
      repairResult: "维修结果",
      adverseEffect: "不利影响评价",
      adverseEffectPlaceholder: "请输入不利影响评价",
      voidConfirm: "确认要作废该产品维修记录吗?",
      deleteConfirm: "确认要删除该产品维修记录吗?",
      batchVoidConfirm: "确认作废选中的 {count} 条记录吗？",
      hint: "提示",
      cancel: "取 消",
      confirm: "确 定",
      exportProgress: "导出进度",
      exportComplete: "导出完成",
      exporting: "正在导出数据，请稍候..."
    },
    productStatus: {
      normal: "正常",
      repairing: "维修中",
      scrap: "报废"
    },
    processFlow: {
      title: "工艺流程详情",
      processFlowTitle: "工艺流程",
      mainProductInfo: "主产品信息",
      productBarcode: "产品条码：",
      materialName: "物料名称：",
      materialCode: "物料编码：",
      workOrderNo: "工单号：",
      processSteps: "工艺步骤",
      stepName: "步骤名称",
      stepStatus: "步骤状态",
      completionTime: "完成时间",
      operator: "操作员",
      materials: "物料信息",
      materialType: "物料类型",
      scanStatus: "扫描状态",
      scanTime: "扫描时间"
    },
    messages: {
      // 基础操作消息
      getDataFailed: "获取数据失败",
      deleteSuccess: "删除成功",
      deleteFailed: "删除失败",
      deleteConfirm: "此操作将永久删除该记录, 是否继续?",
      deleteCancel: "已取消删除",
      exportSuccess: "导出成功",
      exportFailed: "导出失败",
      noRecordsFound: "未找到符合条件的维修记录",
      // 状态验证消息
      recordReviewedCannotEdit: "该记录已审核，不可修改！",
      recordReviewedCannotVoid: "该记录已审核，不可作废！",
      recordAlreadyReviewed: "该记录已审核",
      // 批量操作消息
      pleaseSelectRecordsToDelete: "请选择要删除的记录",
      selectedRecordsContainReviewed: "选中记录中包含已审核的记录，不能删除",
      pleaseSelectRecordsToReview: "请选择要审核的记录",
      selectedRecordsContainInvalid:
        "选中记录中包含已审核或已作废的记录，不能进行批量审核",
      // 操作成功消息
      voidSuccess: "作废成功",
      batchVoidSuccess: "批量作废成功",
      reviewSuccess: "审核成功",
      scrapReviewSuccess: "报废审核成功",
      batchReviewSuccessTemplate:
        "批量审核成功，共处理 {updatedCount} 条记录，其中报废 {scrapCount} 条",
      // 操作失败消息
      operationFailed: "操作失败",
      reviewFailed: "审核失败",
      batchVoidFailed: "批量作废失败，可能包含已审核的记录",
      batchReviewFailed: "批量审核失败",
      // 取消操作消息
      voidCancelled: "已取消作废",
      // 验证消息
      pleaseSelectRepairResult: "请选择维修结果",
      nonScrapRecordsNeedResult: "非报废维修记录需要选择维修结果",
      // 产品详情消息
      getProductDetailsFailed: "获取产品详情失败"
    },
    processFlow: {
      processFlowTitle: "工艺流程",
      specModel: "规格型号：",
      overallProgress: "整体进度：",
      currentStatus: "当前状态：",
      detailTabs: "详情标签页",
      processInfo: "工序信息",
      materialInfo: "物料信息",
      materialBarcodeInfo: "物料条码信息",
      inspectionInfo: "检测信息",
      unbindInfo: "解绑信息"
    }
  },

  // 产品维修编辑对话框
  editDialog: {
    titles: {
      create: "新增维修记录",
      edit: "编辑维修记录",
      view: "查看维修记录"
    },
    form: {
      barcode: "产品条码",
      barcodePlaceholder: "请扫描产品条码",
      confirm: "确认",
      solution: "处理方案",
      solutionPlaceholder: "请选择处理方案",
      defectDescription: "不良现象",
      defectDescriptionPlaceholder: "请描述不良现象",
      materialNumber: "产品编码",
      materialNumberPlaceholder: "请输入产品编码",
      materialName: "产品名称",
      materialNamePlaceholder: "请输入产品名称",
      materialSpec: "产品型号",
      materialSpecPlaceholder: "请输入产品型号",
      workOrderNo: "生产工单",
      workOrderNoPlaceholder: "请输入生产工单",
      businessType: "业务类型",
      businessTypePlaceholder: "请选择业务类型",
      causeAnalysis: "分析原因",
      causeAnalysisPlaceholder: "请输入分析原因",
      repairDescription: "维修描述",
      repairDescriptionPlaceholder: "请输入维修描述",
      repairResult: "审核结果",
      adverseEffect: "不利影响评价",
      adverseEffectPlaceholder: "请输入不利影响评价",
      status: "状态",
      statusPlaceholder: "请选择状态",
      remark: "备注",
      remarkPlaceholder: "请输入备注信息",
      barcodeList: "条码列表",
      scannedCount: "已扫描条码数量",
      serialNumber: "序号",
      productBarcode: "产品条码",
      operation: "操作",
      delete: "删除"
    },
    buttons: {
      saveAndSubmit: "保存并提交",
      cancel: "取 消"
    },
    form: {
      confirm: "确认",
      defectDescription: "不良现象",
      defectDescriptionPlaceholder: "请描述不良现象",
      materialNumber: "产品编码",
      materialNumberPlaceholder: "请输入产品编码",
      materialName: "产品名称",
      materialNamePlaceholder: "请输入产品名称",
      materialSpec: "产品型号",
      materialSpecPlaceholder: "请输入产品型号",
      workOrderNo: "生产工单",
      workOrderNoPlaceholder: "请输入生产工单",
      businessType: "业务类型",
      businessTypePlaceholder: "请选择业务类型",
      causeAnalysis: "分析原因",
      causeAnalysisPlaceholder: "请输入分析原因",
      repairDescription: "维修描述",
      repairDescriptionPlaceholder: "请输入维修描述",
      repairResult: "审核结果",
      solution: "处理方案",
      solutionPlaceholder: "请选择处理方案",
      adverseEffect: "不利影响评价",
      adverseEffectPlaceholder: "请输入不利影响评价",
      status: "状态",
      statusPlaceholder: "请选择状态",
      remark: "备注",
      remarkPlaceholder: "请输入备注信息",
      barcodeList: "条码列表",
      scannedCount: "已扫描条码数量",
      serialNumber: "序号",
      productBarcode: "产品条码",
      operation: "操作",
      delete: "删除"
    },
    tips: {
      componentReplacementTitle: "部件更换提示",
      componentReplacementContent:
        "选择部件更换方案时，请确保已准备好相应的替换部件，并记录更换的部件信息。"
    },
    messages: {
      scanBarcodeWarning: "请先扫描产品条码",
      noDataFound: "未找到相关数据",
      searchFailed: "搜索失败",
      maxBarcodeLimit: "最多只能扫描100个条码",
      barcodeExists: "该条码已存在",
      scanSuccess: "扫描成功",
      atLeastOneBarcodeRequired: "请至少扫描一个产品条码",
      submitFailed: "提交失败"
    },
    validation: {
      barcodeRequired: "请至少扫描一个产品条码",
      materialSpecRequired: "请输入产品型号",
      batchNumberRequired: "请输入生产批号",
      defectDescriptionRequired: "请描述不良现象",
      solutionRequired: "请选择处理方案",
      statusRequired: "请选择状态"
    }
  },

  // 托盘组装页面
  palletAssembly: {
    // 页面标题和标签
    title: "托盘组装操作",
    palletCode: "托盘编号",
    palletCodePlaceholder: "请输入或扫描托盘编号",
    confirmPallet: "确认托盘",
    unifiedScan: "统一扫描",
    unifiedScanPlaceholder: "请扫描条码 (成品/包装箱/子物料)",
    processScan: "处理扫描",
    resetPage: "重置页面",
    forceComplete: "强制完成",

    // 托盘信息标签
    palletInfo: {
      palletNumber: "托盘编号",
      palletStatus: "托盘状态",
      currentCount: "当前数量",
      totalQuantity: "总数量",
      remaining: "剩余",
      productLine: "产线",
      materialInfo: "物料信息",
      orderInfo: "订单信息",
      workOrderInfo: "工单信息",
      notSet: "未设置"
    },

    // 托盘状态
    status: {
      stacked: "组托完成",
      stacking: "组托中"
    },

    // 分隔线标题
    sections: {
      scanAndStatus: "条码扫描与状态"
    },

    // 按钮文本
    buttons: {
      confirmPallet: "确认托盘",
      processScan: "处理扫描",
      resetPage: "重置页面",
      forceComplete: "强制完成"
    },

    // 验证规则
    validation: {
      palletCodeRequired: "请输入托盘编号"
    },

    // 消息提示
    messages: {
      // 输入验证消息
      enterPalletCode: "请输入托盘编号",
      enterOrScanBarcode: "请输入或扫描条码",
      selectPrintTemplate: "请先选择打印模板",
      validatePalletFirst: "请先验证托盘编号",

      // 工单相关消息
      workOrderNotFound: "工单 {workOrderNo} 未找到",
      workOrderNoMaterial: "工单未关联主物料信息",
      materialNoCraft: "物料 {materialName} 未配置工艺",
      materialNoProcess: "物料 {materialName} 未配置托盘相关工序 (如 F 类型)",
      workOrderInfoSuccess: "工单及子物料信息获取成功，请开始扫描",
      noSubMaterialRequired: "当前工序无需额外扫描子物料，请直接扫描主物料",
      workOrderInfoFailed: "获取工单/工序/子物料信息失败",
      palletNoWorkOrder: "托盘未关联工单，可能无法获取子物料需求",

      // 托盘验证消息
      palletInfoSuccess: "托盘信息获取成功，请开始扫描",
      palletNotFound: "未找到指定托盘",
      palletValidationFailed: "验证托盘编号失败",
      palletCompleted: "该托盘已组托完成，不能继续添加条码",
      palletCompletedCannotAdd: "该托盘已组托完成，不能继续添加",

      // 条码规则相关消息
      noBarcodeRules: "未找到适用于当前物料的条码规则，将使用基本匹配逻辑。",
      barcodeRulesLoadFailed: "获取条码规则失败",
      noBarcodeRulesLoaded: "未加载条码规则，将尝试直接匹配物料编码。",
      barcodeNotMatchRules:
        "该条码不符合任何已配置的规则，或解析出的物料与当前工序不匹配",
      barcodeValidationError: "条码验证过程发生错误",
      barcodeNotMatchDirectly: "条码与任何预期物料编码不直接匹配（无规则）。",

      // DI码验证消息
      diCodeNotExists: "该DI编码不存在本系统",
      diCodeNoMaterial: "该DI编码未关联有效物料",
      diCodeMaterialMismatch: "该DI编码对应的物料与当前工序不匹配",
      diCodeValidationFailed: "DI码验证失败",

      // 扫描相关消息
      mainMaterialScanned:
        "主物料 {materialName} ({barcode}) 扫描成功 (规则: {ruleName})",
      subMaterialScanned:
        "子物料 {materialName} ({barcode}) 扫描成功 (规则: {ruleName})",
      barcodeAlreadyInPallet: "主物料条码 {barcode} 已在托盘列表中。",
      barcodeAlreadyScanned: "条码 {barcode} 已被扫描用于其他物料项",
      barcodeNotMatchExpected:
        "条码 {barcode} (物料: {materialCode}) 与当前待扫项不匹配。",
      barcodeValidationFailed: "条码验证失败或未匹配到物料",

      // 包装箱相关消息
      packingProcessRequired: "当前工艺包含装箱工序，必须扫描包装箱条码。",
      palletUnbindError: "当前条码{barcode}应该入托盘到{palletCode}",

      // 提交相关消息
      allMaterialsScanned: "所有物料已扫描，准备提交...",
      barcodeAlreadyExists:
        "主条码 {barcode} 已存在于此托盘中，本次扫描组不重复提交。",
      submittingData: "提交数据中...",
      submitSuccess: "条码 {barcode} 及子物料关联成功",
      submitSuccessWithCount:
        "条码 {barcode} 及子物料关联成功 (共添加{count}个条码)",
      submitFailed: "提交失败",
      palletCompleteSuccess: "托盘已组托完成!",
      palletCompleteHandleFailed: "组托完成处理失败",

      // 打印相关消息
      printTemplateSuccess: "打印模板已保存到本地",
      printTemplateFailed: "保存打印模板失败",
      printDataPrepareFailed: "准备打印数据失败",

      // 其他消息
      clearBarcodeListConfirm: "确定要清空已扫描条码列表吗?",
      barcodeListCleared: "已清空条码列表",
      unknownDate: "未知",
      invalidDate: "无效日期",
      unrecordedWorkshop: "未记录生产车间",
      unrecordedProductLine: "未记录生产线",
      lastPallet: "尾数托盘",

      // 扫描状态消息
      mainMaterialPending: "待扫描主物料条码",
      subMaterialPending: "待扫描",
      noScanRequired: "无需扫描"
    },

    // 条码列表
    barcodeList: {
      title: "已扫描条码列表 ({count}条)",
      clearList: "清空列表",
      serialNumber: "序号",
      barcode: "条码",
      type: "类型",
      singleProduct: "单产品",
      packagingBox: "包装箱",
      boxBarcode: "箱条码",
      scanTime: "扫描时间"
    },

    // 操作提示
    operationTips: {
      title: "操作提示",
      description:
        "1. 扫描托盘编号确认托盘信息 2. 扫描产品条码或包装箱条码 3. 系统自动提交，无需手动保存"
    }
  },

  // 托盘条码校验页面
  palletBarcodeVerification: {
    // 页面标题和标签
    title: "托盘条码校验",

    // 托盘输入区域
    palletInput: {
      inputPrompt: "请输入入托盘单据编号",
      placeholder: "请扫描托盘单据编号",
      loadPallet: "加载托盘",
      scanTip: "请将托盘单据条码对准扫描枪，或在输入框中输入托盘编号后按Enter键"
    },

    // 已完成托盘
    completedPallets: {
      title: "已完成托盘"
    },

    // 托盘信息
    palletInfo: {
      title: "托盘信息",
      changePallet: "更换托盘",
      palletCode: "托盘编号",
      materialInfo: "物料信息",
      totalBarcodes: "总条码数",
      verifiedBarcodes: "已校验条码",
      remainingBarcodes: "未校验条码",
      palletStatus: "组托状态",
      statusStacked: "组托完成",
      statusStacking: "组托中"
    },

    // 条码扫描区域
    barcodeInput: {
      placeholder: "请扫描条码或手动输入",
      verify: "校验",
      scanTip: "请将条码对准扫描枪，或在输入框中输入条码后按下Enter键"
    },

    // 条码校验结果
    verificationResult: {
      processCompleted: "流程已完成",
      processIncomplete: "流程未完成",
      barcodeInfo: "条码基本信息",
      barcode: "条码",
      materialCode: "物料编码",
      materialName: "物料名称",
      status: "状态",
      completed: "已完成",
      incomplete: "未完成",
      progress: "完成进度",

      // 节点统计
      nodeStatistics: {
        totalNodes: "总节点数",
        completedNodes: "已完成",
        pendingNodes: "未完成"
      },

      // 未完成节点列表
      pendingNodesList: {
        title: "未完成节点列表",
        nodeName: "节点名称",
        nodeType: "节点类型",
        status: "状态"
      }
    },

    // 托盘条码列表
    barcodeList: {
      title: "托盘条码列表",
      allBarcodes: "全部条码",
      unverifiedBarcodes: "待校验条码",
      totalCount: "共 {count} 个条码",
      barcode: "条码",
      verificationStatus: "校验状态",
      verified: "已校验",
      unverified: "未校验",
      processStatus: "流程状态",
      scanTime: "扫描时间"
    },

    // 状态映射
    status: {
      pending: "待处理",
      inProgress: "进行中",
      completed: "已完成",
      skipped: "已跳过",
      error: "异常",
      processCompleted: "流程已完成",
      processIncomplete: "流程未完成"
    },

    // 节点类型
    nodeType: {
      processStep: "工序",
      material: "物料"
    },

    // 消息提示
    messages: {
      // 输入验证消息
      enterPalletCode: "请输入托盘单据编号",
      enterBarcode: "请输入条码",
      inputPalletPrompt: "请在下方输入托盘单据编号",

      // 托盘相关消息
      palletDataLoadSuccess: "托盘数据加载成功",
      palletDataNotFound: "未找到托盘数据",
      unknownMaterial: "未知物料",

      // 条码校验消息
      barcodeNotInPallet: "该条码不存在于当前托盘中",
      barcodeCheckComplete: "条码检查完成",
      processNotComplete: "流程尚未完成",
      allBarcodesVerified: "所有条码已完成校验，托盘校验完成",

      // 系统消息
      systemError: "系统错误，请重试",
      queryFailed: "查询失败",

      // 加载状态
      loadingPalletData: "正在加载托盘数据...",
      verifyingBarcode: "正在校验条码...",

      // 日期格式化
      noData: "暂无数据",
      invalidDate: "无效日期"
    }
  },

  // StatusPopup组件
  statusPopup: {
    // 错误消息映射
    errorMessages: {
      diCodeNotExists: "该DI编码不存在本系统",
      diCodeNoMaterial: "该DI编码未关联有效物料",
      diCodeMaterialMismatch: "该DI编码对应的物料与当前工序不匹配",
      barcodeRuleMismatch: "该条码不符合任何已配置的规则或物料不匹配",
      mainBarcodeNotFound: "未找到对应的主条码流程记录",
      processNodeNotFound: "未找到对应的工序节点",
      processNodeCompleted: "工序节点已完成或处于异常状态",
      repairRecordExists: "该条码存在未完成的维修记录",
      repairResultFailed: "该条码已完成维修,但维修结果为不合格",
      barcodeVoided: "该条码已作废",
      barcodeMaterialMismatch: "条码不匹配主物料",
      duplicateBarcode: "重复扫码",
      prerequisiteIncomplete: "存在未完成的前置工序",
      quantityMismatch: "扫码数量与要求不符",
      duplicateScan: "存在重复扫描的条码",
      materialNotRequired: "物料不属于当前工序要求扫描的物料",
      batchLimitReached: "批次物料条码已达到使用次数限制",
      subMaterialNotFound: "未找到条码为的子物料流程记录",
      subMaterialIncomplete: "该物料条码的子物料工序未完成",
      keyMaterialDuplicate: "关键物料重复使用错误",
      usedByOtherProcess: "已被其他流程使用",
      keyMaterialMainRequired: "关键物料必须先扫描主条码",
      workOrderNotFound: "未查询到生产工单",
      workOrderQuantityReached: "工单已达到计划数量",
      missingParameters: "缺少必要参数",
      materialCodeNotFound: "未找到物料编码为",
      craftInfoNotFound: "未找到物料对应的工艺信息",
      barcodeParameterEmpty: "条码参数不能为空",
      productionPlanNotFound: "成品工艺未查询到产线计划",
      validWorkOrderNotFound: "未找到有效的产线工单",
      productBarcodeNotBound: "产品条码未绑定工单",
      workOrderMismatch: "当前产线工单与产品条码工单不一致",
      updateWorkOrderFailed: "更新工单投入量失败",
      barcodeMaterialNotMatch: "条码与物料不匹配",
      equipmentInfoNotFound: "未找到对应的设备信息",
      processInfoNotFound: "未找到对应的工序信息",
      craftInfoNotFound2: "未找到对应的工艺信息",
      materialInfoNotFound: "未找到对应的物料信息",
      materialNodeNotFound: "未找到指定的物料节点或物料节点不属于指定工序",
      originalBarcodeMismatch: "原物料条码不匹配",
      repairRecordNotFound: "未找到对应的部件替换维修记录",
      newBarcodeType: "新条码物料类型",
      newBarcodeIncomplete: "新条码的流程未完成",
      newBarcodeValidationFailed: "新条码验证失败",
      processDataValidationFailed: "验证流程数据失败",
      createProcessRecordFailed: "创建工艺流程记录失败",
      scanRequestFailed: "处理扫码请求失败",
      fixBarcodeDataFailed: "修复条码物料异常数据失败",
      rfidBarcodeNotFound: "未找到该RFID标签对应的条码"
    }
  },

  // 包装箱条码校验页面
  boxBarcodeVerification: {
    title: "包装箱条码校验",
    form: {
      boxBarcodeLabel: "包装箱条码:",
      boxBarcodePlaceholder: "请扫描或输入包装箱条码"
    },
    buttons: {
      query: "查询",
      requery: "重新查询",
      export: "导出结果",
      retry: "重试",
      skip: "跳过"
    },
    boxInfo: {
      title: "包装箱信息",
      boxBarcode: "包装箱条码",
      materialCode: "物料编码",
      materialName: "物料名称",
      packingTime: "包装时间",
      productCount: "产品数量"
    },
    progress: {
      title: "校验进度"
    },
    stats: {
      verified: "校验通过",
      failed: "校验失败",
      pending: "待校验"
    },
    scan: {
      title: "产品条码扫描",
      placeholder: "请扫描产品条码进行校验",
      tips: "请扫描产品条码进行逐一校验",
      allComplete: "所有产品条码校验完成！"
    },
    productList: {
      title: "产品条码列表",
      index: "序号",
      barcode: "产品条码",
      verifyTime: "校验时间",
      actions: "操作"
    },
    status: {
      verifySuccess: "校验通过",
      verifyFailed: "校验失败",
      pending: "待校验",
      userSkipped: "用户跳过校验"
    },
    messages: {
      pleaseInputBoxBarcode: "请输入包装箱条码",
      boxBarcodeNotFound: "未找到该包装箱条码对应的数据",
      boxDataLoadSuccess: "成功加载包装箱数据，共{count}个产品条码",
      boxQueryFailed: "查询包装箱失败",
      alreadyVerified: "该产品条码已校验过",
      verifySuccess: "校验通过！产品条码在包装箱中",
      verifyFailed: "校验失败！产品条码不在此包装箱中",
      verifyError: "校验过程发生错误",
      resetStatus: "已重置该条码校验状态",
      skipVerify: "已跳过该条码校验",
      exportSuccess: "校验结果已导出"
    },
    export: {
      index: "序号",
      barcode: "产品条码",
      status: "校验状态",
      verifyTime: "校验时间",
      remark: "备注",
      filename: "包装箱校验结果"
    },
    common: {
      unknown: "未知"
    }
  }
};
