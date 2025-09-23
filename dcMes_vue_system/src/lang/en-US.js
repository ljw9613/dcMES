/*
 * @name: English Language Package
 * @content: English (US) internationalization resource file
 * @Author: ljw
 * @Email: 1798245303@qq.com
 * @Date: 2025-01-23
 */

export default {
  // Common
  common: {
    confirm: "Confirm",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    reset: "Reset",
    submit: "Submit",
    back: "Back",
    close: "Close",
    loading: "Loading...",
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Info",
    yes: "Yes",
    no: "No",
    operation: "Operation",
    status: "Status",
    remark: "Remark",
    createTime: "Create Time",
    updateTime: "Update Time"
  },

  // Menu internationalization
  menu: {
    // System Management
    systemManagement: {
      title: "System Management",
      userList: "User List",
      menuManagement: "Menu Management",
      roleManagement: "Role Management",
      dictionaryManagement: "Dictionary Management",
      dictionaryData: "Dictionary Data",
      logManagement: "Log Management"
    },

    // Production Management
    productionManagement: {
      title: "Production Management",
      productionOrder: "Production Order",
      productionPlan: "Production Plan",
      productionLine: "Production Line",
      productionCraft: "Production Craft",
      productionBarcode: "Production Barcode"
    },

    // Line Management
    lineManagement: {
      title: "Line Management",
      scanBarCode: "Line Scanning",
      scanBarCodeBatch: "Pallet Packing",
      productRepair: "Product Repair",
      scanBarCodeConver: "Scan Conversion",
      scanBarCodeRepair: "Scan Repair",
      scanBarCodeCheck: "Line Verification",
      customScanCheck: "Custom Scan",
      scBigView: "Line Dashboard",
      palletBarcodeVerification: "Pallet Verification",
      boxBarcodeVerification: "Box Verification",
      scanBarCodeSimple: "Simple Scan",
      palletAssembly: "Pallet Assembly",
      scanBarCodePack: "Pack Boxing",
      scanBarCodeBatchNew: "Pallet Packing (with Sub Materials)"
    },

    // Kingdee Cloud Data
    kingdeeData: {
      title: "Kingdee Cloud Data",
      materialInfo: "Material Info",
      saleOrder: "Sales Order",
      stockInfo: "Warehouse Info",
      purchaseOrder: "Purchase Order",
      pickMaterial: "Production Pick",
      deliveryNotice: "Delivery Notice",
      productionInStock: "Production In-Stock",
      requisitionBill: "Purchase Request",
      outStock: "Sales Out-Stock"
    },

    // Equipment Management
    equipmentManagement: {
      title: "Equipment Management",
      equipmentInfo: "Equipment Info",
      detectionData: "Detection Data"
    },

    // Warehouse Management
    warehouseManagement: {
      title: "Warehouse Management",
      materialPalletizing: "Pallet Documents",
      warehouseEntry: "Production Inbound",
      warehouseOntry: "Production Outbound"
    },

    // Product Traceability
    productTraceability: {
      title: "Product Traceability",
      materialProcessFlow: "Barcode Records",
      productTrace: "Product Trace",
      packBarcode: "Pack Barcode"
    },

    // Basic Settings
    basicSettings: {
      title: "Basic Settings",
      printTemplate: "Print Template",
      barcodeRule: "Barcode Match Rules",
      barcodeSegmentRule: "Barcode Generation Rules"
    },

    // Quality Inspection
    qualityInspection: {
      title: "Quality Inspection",
      samplingInspectionFlow: "Barcode Sampling",
      udiSamplingInspectionFlow: "UDI Sampling"
    },

    // Customer Barcode
    customerBarcode: {
      title: "Customer Barcode",
      udiDataManagement: "SN-SFTP Barcode List"
    },

    // Common menu
    common: {
      noticeList: "Notice List",
      recruitmentManagement: "Recruitment Management",
      messageManagement: "Message Management",
      honorManagement: "Honor Management",
      materialLibraryManagement: "Material Library Management",
      productCategoryManagement: "Product Category Management"
    }
  },

  // Navigation bar
  navbar: {
    welcome: "Welcome",
    logout: "Logout",
    changePassword: "Change Password",
    language: "Language",
    chinese: "Chinese",
    vietnamese: "Vietnamese",
    english: "English",
    version: "Version",
    versionInfo: "Version Info",
    systemVersion: "System Version",
    buildDate: "Build Date",
    environment: "Environment"
  },

  // Scan Barcode Page
  scanBarCode: {
    // Process Settings
    processSettings: {
      title: "Process Settings",
      auto: "Auto",
      manual: "Manual",
      productModel: "Product Model",
      productModelPlaceholder: "Search by material code/name",
      processStep: "Process Step",
      processStepPlaceholder: "Select process step",
      productionLine: "Production Line",
      productionLinePlaceholder: "Search production line info",
      saveSettings: "Save Settings",
      cancelSettings: "Cancel Settings",
      connected: "Connected",
      disconnected: "Disconnected",
      basicInfo: "Basic Info"
    },

    // Barcode Scanning
    barcodeScanning: {
      title: "Barcode Scanning",
      expand: "Expand",
      collapse: "Collapse",
      clearCache: "Clear Batch Material Cache",
      unifiedScanArea: "Unified Scan Area",
      scanPlaceholder: "Please scan barcode",
      mainMaterial: "Main Material",
      subMaterial: "Sub Material",
      print: "Print",
      noScanRequired: "No Scan Required",
      batchMaterial: "Batch Material",
      keyMaterial: "Key Material",
      materialCode: "Code",
      materialName: "Name",
      scanMainBarcodePlaceholder: "Please scan main material barcode",
      scanSubBarcodePlaceholder: "Please scan sub material barcode"
    },

    // Work Order
    workOrder: {
      workOrderNo: "Work Order No.",
      noWorkOrder: "No Work Order",
      inputQuantity: "Input Quantity",
      planQuantity: "Plan Quantity",
      scrapQuantity: "Scrap Quantity"
    },

    // Messages
    messages: {
      scanSuccess: "Scan Success",
      mainMaterialScanSuccess: "Main Material Scan Success",
      barcodeValidationFailed: "Barcode Validation Failed",
      barcodeFormatError: "Barcode format error, not registered in system",
      duplicateBarcode: "This barcode has been used, please confirm if duplicate scanning",
      flowRecordCreated: "Product barcode trace record created successfully",
      flowRecordCreateFailed: "Failed to create product barcode trace record",
      pleaseInitializeProcess: "Please initialize process settings first, select binding process or detection process"
    },

    // Scanning
    scanning: {
      normalMode: "Normal Mode",
      rfidMode: "RFID Mode",
      modeTooltip: "Normal mode for barcode scanning, RFID mode for RFID tag reading",
      unifiedScanArea: "Unified Scan Area",
      materialMatching: "Material Matching Scan",
      batchCacheEnabled: "Batch Material Cache Enabled",
      clearCacheOnSubmit: "Clear Batch Material Cache on Submit",
      keepCacheOnSubmit: "Keep Batch Material Cache on Submit",
      scanPlaceholder: "Please scan barcode",
      mainBarcodePlaceholder: "Please scan main material barcode",
      subBarcodePlaceholder: "Please scan sub material barcode",
      noScanRequired: "No Scan Required",
      batchMaterial: "Batch Material",
      processingBox: "Processing package box barcode, please wait...",
      processProgress: "Process Progress",
      scannedBarcodes: "Scanned Barcodes",
      currentProgress: "Current Progress",
      barcodeLabel: "Barcode: ",
      scanTime: "Scan Time: "
    },

    // Buttons
    buttons: {
      reset: "Reset",
      confirm: "Confirm",
      print: "Print",
      manualInput: "Manual Input Query"
    }
  },

  // System Messages
  system: {
    loginSuccess: "Login Success",
    loginFailed: "Login Failed",
    logoutSuccess: "Logout Success",
    saveSuccess: "Save Success",
    saveFailed: "Save Failed",
    deleteSuccess: "Delete Success",
    deleteFailed: "Delete Failed",
    updateSuccess: "Update Success",
    updateFailed: "Update Failed",
    operationSuccess: "Operation Success",
    operationFailed: "Operation Failed",
    networkError: "Network Error",
    serverError: "Server Error",
    permissionDenied: "Permission Denied",
    dataNotFound: "Data Not Found"
  },

  // Batch Scan Page
  scanBarCodeBatch: {
    title: "Batch Scan",
    processSettings: {
      title: "Process Settings",
      auto: "Auto",
      manual: "Manual",
      productModel: "Product Model",
      productModelPlaceholder: "Search by material code/name",
      processStep: "Process Step",
      processStepPlaceholder: "Select process step",
      productionLine: "Production Line",
      productionLinePlaceholder: "Search production line info",
      saveSettings: "Save Settings",
      cancelSettings: "Cancel Settings",
      connected: "Connected",
      disconnected: "Disconnected",
      basicInfo: "Basic Info"
    },
    batchScanning: {
      title: "Batch Barcode Scanning",
      expand: "Expand",
      collapse: "Collapse",
      clearCache: "Clear Batch Material Cache",
      scanPlaceholder: "Please scan barcode",
      batchSize: "Batch Size",
      currentBatch: "Current Batch",
      totalScanned: "Total Scanned",
      batchProgress: "Batch Progress"
    },
    scanning: {
      normalMode: "Normal Mode",
      rfidMode: "RFID Mode",
      modeTooltip: "Normal mode for barcode scanning, RFID mode for RFID tag reading",
      rfidPlaceholder: "Please read RFID tag",
      processingBox: "Processing package box barcode, please wait...",
      processProgress: "Process Progress",
      unifiedScanArea: "Unified Scan Area",
      materialMatching: "Material Matching Scan",
      batchCacheEnabled: "Batch Material Cache Enabled",
      scanPlaceholder: "Please scan barcode",
      mainBarcodePlaceholder: "Please scan main material barcode",
      subBarcodePlaceholder: "Please scan sub material barcode",
      noScanRequired: "No Scan Required",
      batchMaterial: "Batch Material",
      scannedBarcodes: "Scanned Barcodes",
      currentProgress: "Current Progress",
      barcodeLabel: "Barcode: ",
      scanTime: "Scan Time: "
    },
    documentInfo: {
      title: "Document Info",
      saleOrderNo: "Sales Order No.: ",
      palletDocumentNo: "Pallet Document No.: ",
      workOrderNo: "Work Order: ",
      palletDocumentQuantity: "Pallet Document Quantity: ",
      materialNumber: "Material Number: ",
      materialName: "Material Name: ",
      materialSpec: "Material Spec: ",
      notGenerated: "Not Generated"
    },
    subMaterialScanning: {
      title: "Sub Material Scanning",
      noScanRequired: "No Scan Required",
      scanSubMaterialPlaceholder: "Please scan sub material barcode",
      batchMaterial: "Batch Material"
    },
    scannedList: {
      title: "Scanned Barcodes",
      currentProgress: "Current Progress",
      barcodeLabel: "Barcode: ",
      scanTimeLabel: "Scan Time: "
    },
    initTip: {
      message: "Please initialize process settings first, check if current process is pallet process"
    },
    buttons: {
      reset: "Reset",
      confirm: "Confirm",
      batchProcess: "Batch Process",
      exportData: "Export Data",
      clearAll: "Clear All"
    },
    messages: {
      batchScanSuccess: "Batch Scan Success",
      batchProcessSuccess: "Batch Process Success",
      batchProcessFailed: "Batch Process Failed",
      pleaseSelectItems: "Please select items to process",
      confirmBatchProcess: "Confirm to process selected items?",
      // Mode switch messages
      switchToNormalMode: "Switched to Normal Mode",
      switchToRfidMode: "Switched to RFID Mode",
      autoInitEnabled: "Auto Initialization Mode Enabled",
      autoInitDisabled: "Auto Initialization Mode Disabled",
      // Product and process messages
      noProductModelSet: "No product model set currently",
      currentProductModel: "Current Product Model",
      noProcessStepSet: "No process step set currently",
      currentProcessStep: "Current Process Step",
      noProductionLineSet: "No production line set currently",
      currentProductionLine: "Current Production Line",
      productAndProcessAlreadySet: "Product and process already set",
      // Initialization messages
      autoInitSuccess: "Auto initialization process success",
      noMachineProgressConfig: "No machine progress configuration found",
      getMachineProgressFailed: "Failed to get machine progress",
      autoInitFailed: "Auto initialization failed",
      // Save and cancel messages
      pleaseSelectProductProcessLine: "Please select product model, process and line",
      saveSuccess: "Save Success",
      saveFailed: "Save Failed",
      cancelSettingsConfirm: "Confirm to cancel current process settings? This will clear all batch material and print template cache data.",
      cancellingSettings: "Cancelling settings...",
      settingsCancelled: "Process settings cancelled",
      cancelSettingsFailed: "Cancel settings failed",
      // Scanning related messages
      scanSuccess: "Scan Success",
      subMaterialScanSuccess: "Sub Material Scan Success",
      barcodeScanSuccess: "Barcode Scan Success",
      barcodeAlreadyScanned: "This barcode has been scanned",
      barcodeFormatIncorrect: "Barcode format incorrect, not registered in system",
      materialMismatch: "Barcode material doesn't match current process required material",
      hasUnfinishedRepairRecord: "This barcode has unfinished repair record",
      hasCompletedScrapProcessing: "This barcode has completed scrap processing",
      repairResultUnqualified: "This barcode has completed repair, but repair result is unqualified",
      // Batch related messages
      batchQuantityCannotBeLessThan: "Batch quantity cannot be less than already entered quantity",
      confirmSaveBatchQuantity: "Confirm to save current batch quantity setting? Cannot be modified after saving.",
      batchQuantitySettingSaved: "Batch quantity setting saved",
      confirmCancelBatchQuantity: "Confirm to cancel current batch quantity setting?",
      batchQuantitySettingCancelled: "Batch quantity setting cancelled",
      noEditPermission: "No permission to edit production line configuration",
      // Clear cache messages
      confirmClearCache: "Confirm to clear all page cache data? This operation cannot be undone.",
      clearingCache: "Clearing cache...",
      cacheClearedSuccess: "Cache cleared successfully",
      clearCacheFailed: "Clear cache failed",
      // Device connection messages
      deviceServerConnected: "Device server connected successfully",
      deviceConnectionLost: "Device connection lost",
      deviceNotConnected: "Device not connected",
      maxReconnectAttemptsReached: "Maximum reconnection attempts reached, please check network connection or refresh page",
      deviceConnectionInitFailed: "Device connection initialization failed",
      // Print related messages
      printTemplateRequired: "Please select print template first",
      printTemplateSaved: "Print template saved to local",
      printTemplateSaveFailed: "Save print template failed",
      batchBarcodePrintSuccess: "Batch barcode print success",
      printFailed: "Print failed",
      autoPrintEnabled: "Auto print mode enabled",
      autoPrintDisabled: "Auto print mode disabled",
      // List operation messages
      confirmClearScannedList: "Confirm to clear scanned list?",
      scannedListCleared: "List cleared",
      // Sales order number related messages
      currentProductionLineNotSet: "Current production line not set",
      noActiveWorkOrderOnLine: "No active work order on current line",
      getSaleOrderNumberFailed: "Failed to get sales order number"
    }
  },

  // New Batch Scan Page
  scanBarCodeBatchNew: {
    title: "New Batch Scan",
    processSettings: {
      title: "Process Settings",
      auto: "Auto",
      manual: "Manual",
      connected: "Connected",
      disconnected: "Disconnected",
      basicInfo: "Basic Info",
      productModel: "Product Model",
      productModelPlaceholder: "Search by material code/name",
      processStep: "Process Step",
      processStepPlaceholder: "Select process step",
      productionLine: "Production Line",
      productionLinePlaceholder: "Search production line info",
      saveSettings: "Save Settings",
      cancelSettings: "Cancel Settings"
    },
    documentInfo: {
      title: "Document Info",
      saleOrderNo: "Sales Order No.",
      palletCode: "Pallet Code",
      workOrderNo: "Work Order",
      totalQuantity: "Pallet Quantity",
      materialNumber: "Material Number",
      materialName: "Material Name",
      materialSpec: "Material Spec",
      notGenerated: "Not Generated"
    },
    palletManagement: {
      title: "Pallet Management",
      expand: "Expand",
      collapse: "Collapse",
      clearCache: "Clear Batch Material Cache",
      productQuantity: "Product Quantity",
      save: "Save",
      cancel: "Cancel"
    },
    scanning: {
      unifiedScanArea: "Unified Scan Area",
      materialMatching: "Material Matching Scan",
      batchCacheEnabled: "Batch Material Cache Enabled",
      clearCacheOnSubmit: "Clear",
      keepCacheOnSubmit: "Keep",
      scanPlaceholder: "Please scan barcode",
      mainBarcodePlaceholder: "Please scan main material barcode",
      subBarcodePlaceholder: "Please scan sub material barcode",
      noScanRequired: "No Scan Required",
      batchMaterial: "Batch Material",
      processingBox: "Processing package box barcode, please wait...",
      processProgress: "Process Progress",
      scannedBarcodes: "Scanned Barcodes",
      currentProgress: "Current Progress",
      barcodeLabel: "Barcode: ",
      scanTime: "Scan Time: "
    },
    initTip: {
      message: "Please initialize process settings first, check if current process is pallet process"
    },
    buttons: {
      reset: "Reset",
      confirm: "Confirm",
      addToBatch: "Add to Batch",
      removeBatch: "Remove Batch",
      processBatch: "Process Batch"
    },
    messages: {
      // Mode switch messages
      switchToNormalMode: "Switched to Normal Mode",
      switchToRfidMode: "Switched to RFID Mode",
      autoInitEnabled: "Auto Initialization Mode Enabled",
      autoInitDisabled: "Auto Initialization Mode Disabled",
      autoInitSuccess: "Auto initialization process success",
      autoInitFailed: "Auto initialization failed",
      noMachineProgressConfig: "No machine progress configuration found",
      // Save related messages
      pleaseSelectProductProcessLine: "Please select product model, process and line",
      saveSuccess: "Save Success",
      saveFailed: "Save Failed",
      cancelSettingsSuccess: "Process settings cancelled",
      cancelSettingsFailed: "Cancel settings failed",
      // Scanning related messages
      scanSuccess: "Scan Success",
      scanSuccessful: "Scan Successful",
      mainMaterialScanSuccess: "Main Material Scan Success",
      subMaterialScanSuccess: "Sub Material Scan Success",
      barcodeValidationFailed: "Barcode Validation Failed",
      barcodeFormatIncorrect: "Barcode format incorrect, not registered in system",
      barcodeNotMatchAnyMaterial: "Barcode doesn't match any required material",
      flowRecordCreateSuccess: "Product barcode trace record created successfully",
      // System error messages
      getProductModelFailed: "Failed to get product model",
      getProcessStepsFailed: "Failed to get process steps",
      getMainMaterialInfoFailed: "Failed to get main material info",
      getProcessMaterialsFailed: "Failed to get process materials",
      getBarcodeRulesFailed: "Failed to get barcode rules",
      diCodeNotExist: "This DI code doesn't exist in system",
      diCodeNoMaterial: "This DI code has no valid material associated",
      diCodeMaterialMismatch: "DI code material doesn't match current process",
      diCodeValidationFailed: "DI code validation failed",
      barcodeRuleNotFound: "No available barcode rules found (including product-specific and global rules)",
      barcodeRuleNotMatch: "This barcode doesn't match any configured rules or material mismatch",
      barcodeValidationError: "Barcode validation process error",
      // Repair related messages
      repairRecordExists: "This barcode has unfinished repair record",
      barcodeScrapProcessed: "This barcode has completed scrap processing",
      repairResultUnqualified: "This barcode has completed repair, but repair result is unqualified",
      // Pallet unbind messages
      palletUnbindRecord: "This barcode has pallet unbind record, please handle at repair station",
      // Package box related messages
      processingBoxBarcode: "Processing package box barcode, please wait for completion...",
      printTemplateRequired: "Please select print template first",
      boxProcessRequired: "Current process includes boxing step, must scan package box barcode.",
      boxQuantityExceedsLimit: "Package box barcode quantity exceeds pallet remaining available quantity",
      boxScanSuccess: "Package box scan success, added barcodes",
      scanProcessingFailed: "Scan processing failed",
      // Batch related messages
      batchUsageLimitReached: "Batch material barcode has reached usage limit",
      batchQuantityCannotBeLess: "Batch quantity cannot be less than already entered quantity",
      batchSizeSettingSaved: "Batch size setting saved",
      batchSizeSettingCancelled: "Batch size setting cancelled",
      batchSizeSaveFailed: "Save failed",
      batchSizeCancelFailed: "Cancel failed",
      noEditPermission: "No permission to edit production line configuration",
      listCleared: "List cleared",
      currentLineNotSet: "Current line not set",
      noActiveWorkOrder: "No active work order on current line",
      workOrderChanged: "Work order changed detected, batch material cache cleared",
      // Print related messages
      printTemplateSaved: "Print template saved to local",
      printTemplateSaveFailed: "Save print template failed",
      batchBarcodePrintSuccess: "Batch barcode print success",
      printFailed: "Print failed",
      autoPrintEnabled: "Auto print mode enabled",
      autoPrintDisabled: "Auto print mode disabled",
      // Device connection messages
      deviceServerConnected: "Device server connected successfully",
      deviceConnectionLost: "Device connection lost",
      maxReconnectAttemptsReached: "Maximum reconnection attempts reached, please check network connection or refresh page",
      deviceConnectionInitFailed: "Device connection initialization failed",
      deviceNotConnected: "Device not connected",
      // Cache related messages
      cacheClearedSuccess: "Cache cleared successfully, cleared cache items",
      clearCacheFailed: "Clear cache failed",
      // Sales order number related
      getSaleOrderNumberFailed: "Failed to get sales order number",
      // Confirm failed messages
      confirmFailed: "Confirm failed",
      // Other messages
      addToBatchSuccess: "Add to batch success",
      removeBatchSuccess: "Remove batch success",
      batchProcessSuccess: "Batch process success",
      batchProcessFailed: "Batch process failed",
      pleaseInitializeProcess: "Please initialize batch scan process settings first",
      // Test messages
      palletAutoModeSwitch: "Pallet packing manual/auto mode switch",
      palletProductSelect: "Pallet packing product model selection",
      palletProcessSelect: "Pallet packing process step selection",
      palletLineSelect: "Pallet packing production line selection",
      palletSaveSettings: "Pallet packing save settings"
    }
  },

  // Scan Conversion Page
  scanBarCodeConver: {
    title: "Scan Conversion",
    processSettings: {
      title: "Process Settings",
      auto: "Auto",
      manual: "Manual",
      connected: "Connected",
      disconnected: "Disconnected",
      basicInfo: "Basic Info",
      productModel: "Product Model",
      productModelPlaceholder: "Search by material code/name",
      processStep: "Process Step",
      processStepPlaceholder: "Select process step",
      productionLine: "Production Line",
      productionLinePlaceholder: "Search production line info",
      saveSettings: "Save Settings",
      cancelSettings: "Cancel Settings"
    },
    scanning: {
      title: "Unified Scan Area",
      scanPlaceholder: "Please scan barcode",
      mainMaterial: "Main Material",
      conversion: "Conversion",
      normal: "Normal",
      subMaterial: "Sub Material",
      reset: "Reset",
      confirm: "Confirm",
      expand: "Expand",
      collapse: "Collapse",
      clearCache: "Clear Cache",
      mainBarcodePlaceholder: "Please scan main material barcode",
      subBarcodePlaceholder: "Please scan sub material barcode",
      noScanRequired: "No Scan Required",
      batchMaterial: "Batch Material",
      originalBarcode: "Original Barcode",
      newBarcode: "New Barcode",
      scanOriginalPlaceholder: "Please scan original barcode",
      scanNewPlaceholder: "Please scan new barcode",
      conversionType: "Conversion Type",
      conversionReason: "Conversion Reason"
    },
    materialInfo: {
      materialNumber: "Material Number: ",
      materialName: "Material Name: "
    },
    initTip: {
      message: "Please initialize process settings first, select print process"
    },
    buttons: {
      reset: "Reset",
      confirm: "Confirm Conversion",
      convert: "Convert"
    },
    messages: {
      // Mode switch messages
      switchToNormalMode: "Switched to Normal Mode",
      switchToRfidMode: "Switched to RFID Mode",
      autoInitEnabled: "Auto Initialization Mode Enabled",
      autoInitDisabled: "Auto Initialization Mode Disabled",
      autoInitSuccess: "Auto initialization process success",
      autoInitFailed: "Auto initialization failed",
      noMachineProgressConfig: "No machine progress configuration found",
      getMachineProgressFailed: "Failed to get machine progress",
      // Save related messages
      pleaseSelectProductProcessLine: "Please select product model, process and line",
      saveSuccess: "Save Success",
      saveFailed: "Save Failed",
      cancelSettingsConfirm: "Confirm to cancel current process settings? This will clear all batch material cache data.",
      settingsCancelled: "Process settings cancelled",
      cancelSettingsFailed: "Cancel settings failed",
      // Scanning related messages
      scanSuccess: "Scan Success",
      scanSuccessful: "Scan Successful",
      barcodeValidationFailed: "Barcode Validation Failed",
      barcodeFormatIncorrect: "Barcode format incorrect, not registered in system",
      materialMismatch: "Barcode doesn't match main material",
      printTemplateRequired: "Please select print template first",
      printTemplateSaved: "Print template saved to local",
      printTemplateSaveFailed: "Save print template failed",
      batchBarcodePrintSuccess: "Batch barcode print success",
      printFailed: "Print failed",
      autoPrintEnabled: "Auto print mode enabled",
      autoPrintDisabled: "Auto print mode disabled",
      conversionEnabled: "Conversion mode enabled",
      conversionDisabled: "Conversion mode disabled",
      // Device connection messages
      deviceServerConnected: "Device server connected successfully",
      deviceConnectionLost: "Device connection lost",
      maxReconnectAttemptsReached: "Maximum reconnection attempts reached, please check network connection or refresh page",
      deviceConnectionInitFailed: "Device connection initialization failed",
      deviceNotConnected: "Device not connected",
      // Other messages
      confirmClearCache: "Confirm to clear all page cache data? This operation cannot be undone.",
      cacheClearedSuccess: "Cache cleared successfully",
      clearCacheFailed: "Clear cache failed",
      confirmCompleteAllScanning: "Please complete all necessary barcode scanning",
      conversionSuccess: "Conversion Success",
      conversionFailed: "Conversion Failed",
      pleaseInitializeProcess: "Please initialize conversion process settings first",
      // System error messages
      getBarcodeRulesFailed: "Failed to get barcode rules",
      getProductModelFailed: "Failed to get product model",
      getProcessStepsFailed: "Failed to get process steps",
      autoApplyPrintTemplate: "Auto applied process-associated print template",
      getPrintTemplateFailed: "Failed to get process-associated print template",
      getMainMaterialInfoFailed: "Failed to get main material info",
      getProcessMaterialsFailed: "Failed to get process materials",
      diCodeNotExist: "This DI code doesn't exist in system",
      diCodeNoMaterial: "This DI code has no valid material associated",
      diCodeMaterialMismatch: "DI code material doesn't match current process",
      diCodeValidationFailed: "DI code validation failed",
      barcodeRuleNotMatch: "This barcode doesn't match any configured rules or material mismatch",
      barcodeValidationError: "Barcode validation process error",
      flowRecordCreateSuccess: "Product barcode trace record created successfully",
      repairRecordExists: "This barcode has unfinished repair record",
      barcodeScrapProcessed: "This barcode has completed scrap processing",
      repairResultUnqualified: "This barcode has completed repair, but repair result is unqualified",
      barcodeVoided: "This barcode has been voided",
      confirmFailedPrefix: "Confirm failed:",
      batchUsageLimitReached: "Batch barcode usage limit reached"
    }
  },

  // Scan Packing Page
  scanBarCodePack: {
    title: "Scan Packing",
    processSettings: {
      title: "Process Settings",
      auto: "Auto",
      manual: "Manual",
      connected: "Connected",
      disconnected: "Disconnected",
      basicInfo: "Basic Info",
      productModel: "Product Model",
      productModelPlaceholder: "Search by material code/name",
      processStep: "Process Step",
      processStepPlaceholder: "Select process step",
      productionLine: "Production Line",
      productionLinePlaceholder: "Search production line info",
      saveSettings: "Save Settings",
      cancelSettings: "Cancel Settings"
    },
    scanning: {
      title: "Barcode Scanning",
      expand: "Expand",
      collapse: "Collapse",
      clearCache: "Clear Batch Material Cache",
      unifiedScanArea: "Unified Scan Area",
      scanPlaceholder: "Please scan barcode",
      mainMaterial: "Main Material",
      subMaterial: "Sub Material",
      mainBarcodePlaceholder: "Please scan main material barcode",
      subBarcodePlaceholder: "Please scan sub material barcode",
      noScanRequired: "No Scan Required",
      batchMaterial: "Batch Material"
    },
    packaging: {
      notGenerated: "Package box barcode not generated",
      packageBarcode: "Package Barcode",
      pending: "Pending Full",
      packageType: "Package Type",
      packageSize: "Package Size",
      productBarcode: "Product Barcode",
      packageQuantity: "Package Quantity"
    },
    materialInfo: {
      materialNumber: "Material Number: ",
      materialName: "Material Name: "
    },
    initTip: {
      message: "Please initialize process settings first, select non-pallet process"
    },
    buttons: {
      reset: "Reset",
      confirm: "Confirm",
      package: "Package",
      print: "Print Label"
    },
    messages: {
      // Mode switch messages
      autoInitEnabled: "Auto Initialization Mode Enabled",
      autoInitDisabled: "Auto Initialization Mode Disabled",
      autoInitSuccess: "Auto initialization process success",
      autoInitFailed: "Auto initialization failed",
      noMachineProgressConfig: "No machine progress configuration found",
      // Save related messages
      pleaseSelectProductProcessLine: "Please select product model, process and line",
      saveSuccess: "Save Success",
      saveFailed: "Save Failed",
      cancelSettingsSuccess: "Process settings cancelled",
      cancelSettingsFailed: "Cancel settings failed",
      // Scanning related messages
      scanSuccess: "Scan Success",
      scanSuccessful: "Scan Successful",
      mainMaterialScanSuccess: "Main Material Scan Success",
      subMaterialScanSuccess: "Sub Material Scan Success",
      barcodeValidationFailed: "Barcode Validation Failed",
      barcodeFormatIncorrect: "Barcode format incorrect, not registered in system",
      barcodeNotMatch: "Barcode doesn't match",
      flowRecordCreateSuccess: "Product barcode trace record created successfully",
      // Print related messages
      printTemplateRequired: "Please select print template first",
      printTemplateSaved: "Print template saved to local",
      printTemplateSaveFailed: "Save print template failed",
      batchBarcodePrintSuccess: "Batch barcode print success",
      printFailed: "Print failed",
      autoPrintEnabled: "Auto print mode enabled",
      autoPrintDisabled: "Auto print mode disabled",
      batchBarcodeGenerateFailed: "Batch barcode generation failed",
      // System error messages
      getBarcodeRulesFailed: "Failed to get barcode rules",
      getProductModelFailed: "Failed to get product model",
      getProcessStepsFailed: "Failed to get process steps",
      getMainMaterialInfoFailed: "Failed to get main material info",
      getProcessMaterialsFailed: "Failed to get process materials",
      diCodeNotExist: "This DI code doesn't exist in system",
      diCodeNoMaterial: "This DI code has no valid material associated",
      diCodeMaterialMismatch: "DI code material doesn't match current process",
      diCodeValidationFailed: "DI code validation failed",
      barcodeRuleNotFound: "No available barcode rules found (including product-specific and global rules)",
      barcodeRuleNotMatch: "This barcode doesn't match any configured rules or material mismatch",
      barcodeValidationError: "Barcode validation process error",
      // Repair related messages
      repairRecordExists: "This barcode has unfinished repair record",
      barcodeScrapProcessed: "This barcode has completed scrap processing",
      repairResultUnqualified: "This barcode has completed repair, but repair result is unqualified",
      // Package related messages
      useMainBarcodeInOrder: "Please use main material barcode in order, should use barcode",
      batchUsageLimitReached: "Batch barcode usage limit reached",
      batchUsageLimitReachedWithCode: "Batch material barcode has reached usage limit",
      confirmCompleteAllScanning: "Please complete all necessary barcode scanning",
      confirmFailedPrefix: "Confirm failed",
      // Device connection messages
      deviceServerConnected: "Device server connected successfully",
      deviceConnectionLost: "Device connection lost",
      maxReconnectAttemptsReached: "Maximum reconnection attempts reached, please check network connection or refresh page",
      deviceConnectionInitFailed: "Device connection initialization failed",
      deviceNotConnected: "Device not connected",
      // Cache related messages
      cacheClearedSuccess: "Cache cleared successfully",
      clearCacheFailed: "Clear cache failed",
      // Package box related messages
      materialNotBoundBarcodeRule: "This material is not bound to barcode generation rule",
      getBarcodeRuleDetailsFailed: "Failed to get barcode rule details",
      noActiveWorkOrderOnLine: "No active work order on current line",
      generatedBarcodeEmpty: "Generated barcode is empty",
      packingBarcodeInitialized: "Packing barcode initialized",
      // Other messages
      packageSuccess: "Package Success",
      packageFailed: "Package Failed",
      pleaseInitializeProcess: "Please initialize process settings first, select non-pallet process"
    }
  },

  // Scan Repair Page
  scanBarCodeRepair: {
    title: "Scan Repair",
    processSettings: {
      title: "Repair Process Settings",
      productModel: "Product Model",
      productModelPlaceholder: "Search by material code/name",
      processStep: "Process Step",
      processStepPlaceholder: "Select process step",
      productionLine: "Production Line",
      productionLinePlaceholder: "Search production line info",
      workOrder: "Repair Work Order",
      workOrderPlaceholder: "Enter work order no./model search (required)",
      saveSettings: "Save Settings",
      cancelSettings: "Cancel Settings",
      repairBasicInfo: "Repair Basic Info",
      repairTypePlaceholder: "Please select repair type"
    },
    repairTypes: {
      rework: "Rework",
      repair: "Repair",
      replace: "Replace"
    },
    workOrder: {
      number: "Repair Work Order No.",
      repairQuantity: "Repair Quantity",
      noWorkOrder: "No Work Order",
      planned: "Planned",
      input: "Input"
    },
    material: {
      code: "Code",
      name: "Name",
      barcode: "Barcode",
      relatedBill: "Related Bill"
    },
    productionLine: {
      line1: "Line 1",
      line2: "Line 2"
    },
    scanning: {
      title: "Repair Station Scanning",
      scanArea: "Repair Barcode Scan Area",
      mainMaterial: "Main Material to Repair",
      repairComponents: "Repair Components",
      scanPlaceholder: "Please scan barcode",
      scanMainBarcodePlaceholder: "Please scan main material barcode to repair",
      scanSubBarcodePlaceholder: "Please scan sub material barcode",
      conversion: "Conversion",
      normal: "Normal"
    },
    buttons: {
      reset: "Reset",
      confirmRepair: "Confirm Repair",
      clearWorkOrder: "Clear Work Order",
      expand: "Expand",
      collapse: "Collapse",
      clearCache: "Clear Batch Material Cache"
    },
    status: {
      connected: "Connected",
      disconnected: "Disconnected",
      noScanRequired: "No Scan Required",
      batchMaterial: "Batch Material",
      keyMaterial: "Key Material"
    },
    initTip: {
      message: "Please set repair process first, select binding process or detection process"
    },
    messages: {
      // Mode switch messages
      autoInitEnabled: "Auto Initialization Mode Enabled",
      autoInitDisabled: "Auto Initialization Mode Disabled",
      autoInitSuccess: "Auto initialization process success",
      autoInitFailed: "Auto initialization failed",
      noMachineProgressConfig: "No machine progress configuration found",
      conversionEnabled: "Conversion mode enabled",
      conversionDisabled: "Conversion mode disabled",
      autoPrintEnabled: "Auto print mode enabled",
      autoPrintDisabled: "Auto print mode disabled",
      // Save related messages
      workOrderRequired: "Must select repair work order to save settings",
      saveSuccess: "Save Success",
      saveFailed: "Save Failed",
      cancelSettingsSuccess: "Process settings cancelled",
      cancelSettingsFailed: "Cancel settings failed",
      workOrderSelected: "Work order selected",
      clearWorkOrderSuccess: "Work order selection cleared",
      // Get data related messages
      getBarcodeRulesFailed: "Failed to get barcode rules",
      getProductModelFailed: "Failed to get product model",
      getProcessStepsFailed: "Failed to get process steps",
      getMainMaterialInfoFailed: "Failed to get main material info",
      getProcessMaterialsFailed: "Failed to get process materials",
      getProcessTemplateFailed: "Failed to get process-associated print template",
      templateAppliedSuccess: "Auto applied process-associated print template",
      // Scanning related messages
      scanSuccess: "Scan Success",
      scanSuccessful: "Scan Successful",
      mainMaterialScanSuccess: "Main Material Scan Success",
      subMaterialScanSuccess: "Sub Material Scan Success",
      flowRecordCreateSuccess: "Product barcode trace record created successfully",
      batchBarcodeGenerateFailed: "Batch barcode generation failed",
      pleaseSelectTemplate: "Please select print template first",
      // Barcode validation messages
      diCodeMaterialMismatch: "DI code material doesn't match current process",
      diCodeNoMaterial: "This DI code has no valid material associated",
      diCodeValidationFailed: "DI code validation failed",
      barcodeRuleNotFound: "No available barcode rules found (including product-specific and global rules)",
      barcodeRuleNotMatch: "This barcode doesn't match any configured rules or material mismatch",
      barcodeValidationError: "Barcode validation process error",
      barcodeNotMatch: "Barcode doesn't match",
      // Repair related messages
      repairRecordExists: "This barcode has unfinished repair record",
      barcodeScrapProcessed: "This barcode has completed scrap processing",
      repairResultUnqualified: "This barcode has completed repair, but repair result is unqualified",
      barcodeVoided: "This barcode has been voided",
      barcodeSuspended: "This barcode has been suspended",
      materialExpired: "This material has expired and cannot be used",
      keyMaterialRequireMainBarcode: "Key material must scan main barcode first",
      // Batch related messages
      batchUsageLimitReached: "Batch material barcode has reached usage limit",
      batchUsageLimitReachedWithCount: "Batch material barcode {barcode} has reached usage limit {count} times",
      batchCodeUsageLimitReached: "Batch barcode usage limit reached",
      // Confirmation related messages
      pleaseCompleteAllScans: "Please complete all necessary barcode scanning",
      confirmFailed: "Confirm failed",
      workOrderNotFound: "Work order not found",
      processNodeCompleted: "This main material barcode corresponding process node is completed or in abnormal state",
      // Print related messages
      printSuccess: "Batch barcode print success",
      printFailed: "Print failed",
      printTemplateSaved: "Print template saved to local",
      printTemplateSaveFailed: "Save print template failed",
      // Cache related messages
      cacheClearSuccess: "Cache cleared successfully",
      cacheClearFailed: "Clear cache failed",
      // Device connection messages
      deviceServerConnected: "Device server connected successfully",
      deviceConnectionLost: "Device connection lost, retry {attempts} time in {delay} seconds",
      maxReconnectAttemptsReached: "Maximum reconnection attempts reached, please check network connection or refresh page",
      deviceConnectionInitFailed: "Device connection initialization failed",
      deviceNotConnected: "Device not connected",
      // Additional messages
      generatingBatchBarcode: "Generating batch barcode...",
      materialCodeNotFound: "Material code info not found",
      printDataNotReady: "Print data not ready",
      missingRequiredFields: "Missing required fields",
      pleaseSelectRequired: "Please select required fields",
      saving: "Saving...",
      processStepNotFound: "Process step info not found",
      craftInfoNotFound: "Craft info not found",
      materialInfoNotFound: "Material info not found",
      createFlowRecordFailed: "Failed to create product barcode trace record",
      materialNotFound: "Corresponding material info not found",
      materialCodeMismatch: "Material code mismatch",
      barcodeValidationFailed: "Barcode validation failed",
      barcodeFormatIncorrect: "Barcode format incorrect, not registered in system",
      scanComplete: "Scan complete",
      allMaterialsScanned: "All materials scanned",
      sendingConfirmation: "Sending confirmation...",
      continueScan: "Continue scan",
      pleaseContinueScanning: "Please continue scanning the following materials:",
      scanProcessFailed: "Scan process failed",
      cancellingSettings: "Cancelling settings...",
      clearingCache: "Clearing cache...",
      createMainFlowRecordFailed: "Failed to create main flow record",
      invalidFlowRecord: "Failed to get or create valid process flow record",
      productionPlanNotFound: "Production plan not found",
      getMachineProgressFailed: "Failed to get machine progress",
      scanMainBarcodeFirst: "Please scan main barcode first",
      // Confirmation dialog messages
      confirmCancelSettings: "Confirm to cancel current process settings? This will clear all batch material cache data.",
      confirmClearCache: "Confirm to clear all page cache data? This operation cannot be undone."
    },
    dialogs: {
      hint: "Hint",
      confirm: "Confirm",
      cancel: "Cancel"
    }
  },

  // Scan Repair Page 2
  scanBarCodeRepair2: {
    messages: {
      repairSuccess: "Repair Success",
      repairFailed: "Repair Failed",
      pleaseInitializeProcess: "Please set repair process first, select binding process or detection process"
    }
  },

  // Scan Check Page
  scanBarCodeCheck: {
    title: "Barcode Process Node Check",
    scanning: {
      scanPlaceholder: "Please scan barcode or manual input",
      scanTip: "Please aim barcode at scanner, or input barcode in input box and press Enter",
      query: "Query",
      manualInput: "Manual Input Query"
    },
    results: {
      barcodeInfo: "Barcode Basic Info",
      barcode: "Barcode",
      materialCode: "Material Code",
      materialName: "Material Name",
      status: "Status",
      progress: "Completion Progress",
      completed: "Completed",
      incomplete: "Incomplete",
      flowCompleted: "Process Completed",
      flowIncomplete: "Process Incomplete"
    },
    statistics: {
      totalNodes: "Total Nodes",
      completedNodes: "Completed",
      pendingNodes: "Incomplete",
      pendingNodesList: "Incomplete Node List",
      nodeName: "Node Name",
      nodeType: "Node Type",
      processStep: "Process Step",
      material: "Material"
    },
    status: {
      pending: "Pending",
      inProgress: "In Progress",
      completed: "Completed",
      skipped: "Skipped",
      error: "Error"
    },
    messages: {
      pleaseInputBarcode: "Please input barcode",
      checkComplete: "Barcode check complete",
      flowNotComplete: "Process not complete yet",
      queryFailed: "Query failed",
      systemError: "System error, please retry",
      startVerification: "Start production line verification process, please scan QR code",
      queryingBarcode: "Querying barcode info..."
    }
  },

  // Product Repair Page
  productRepair: {
    title: "Product Repair Management",
    search: {
      title: "Filter Search",
      productBarcode: "Product Barcode",
      productBarcodePlaceholder: "Enter product barcode",
      productModel: "Product Model",
      productModelPlaceholder: "Enter product model",
      solution: "Solution",
      solutionPlaceholder: "Select solution",
      workOrderNo: "Work Order No.",
      workOrderNoPlaceholder: "Enter work order no.",
      saleOrderNo: "Sales Order",
      saleOrderNoPlaceholder: "Enter sales order",
      productionOrderNo: "Production Order",
      productionOrderNoPlaceholder: "Enter production order",
      materialNumber: "Material Number",
      materialNumberPlaceholder: "Enter material number",
      status: "Status",
      statusPlaceholder: "Select status",
      originalBarcode: "Original Product Barcode",
      originalBarcodePlaceholder: "Enter original product barcode",
      newBarcode: "New Product Barcode",
      newBarcodePlaceholder: "Enter new product barcode"
    },
    buttons: {
      search: "Query Search",
      reset: "Reset",
      addMainRepair: "Add Main Product Repair",
      addAuxiliaryRepair: "Add Component Repair",
      batchVoid: "Batch Void",
      batchReview: "Batch Review",
      exportData: "Export Data",
      exporting: "Exporting",
      view: "View",
      viewProductDetails: "View Product Details",
      review: "Review",
      edit: "Edit",
      void: "Void",
      cancel: "Cancel",
      confirm: "Confirm"
    },
    table: {
      title: "Repair Record List",
      productBarcode: "Product Barcode",
      productModel: "Product Model",
      saleOrderNo: "Sales Order",
      productionOrderNo: "Production Order",
      workOrderNo: "Work Order No.",
      repairPerson: "Repair Reporter",
      repairTime: "Repair Time",
      businessType: "Business Type",
      solution: "Solution",
      defectDescription: "Defect Description",
      causeAnalysis: "Cause Analysis",
      repairDescription: "Repair Description",
      reviewer: "Reviewer",
      reviewTime: "Review Time",
      productStatus: "Product Status",
      repairResult: "Repair Result",
      status: "Status",
      operation: "Operation",
      noData: "No Data",
      repairRecordList: "Repair Record List"
    },
    operations: {
      view: "View",
      viewProductDetails: "View Product Details",
      review: "Review",
      edit: "Edit",
      void: "Void"
    },
    status: {
      pendingReview: "Pending Review",
      reviewed: "Reviewed",
      voided: "Voided",
      repairing: "Repairing",
      scrap: "Scrap"
    },
    repairResult: {
      qualified: "Qualified",
      unqualified: "Unqualified"
    },
    solutionOptions: {
      scrap: "Scrap",
      repair: "Repair",
      rework: "Rework"
    },
    lineTypes: {
      assembly: "Assembly Line",
      smt: "SMT Line",
      testing: "Testing Line",
      packaging: "Packaging Line",
      other: "Other"
    },
    dialogs: {
      review: "Review",
      batchReview: "Batch Review",
      processFlowDetails: "Process Flow Details",
      mainProductInfo: "Main Product Info",
      productBarcode: "Product Barcode: ",
      materialName: "Material Name: ",
      materialSpec: "Material Spec: ",
      repairResult: "Repair Result",
      adverseEffect: "Adverse Effect Assessment",
      adverseEffectPlaceholder: "Enter adverse effect assessment",
      voidConfirm: "Confirm to void this product repair record?",
      deleteConfirm: "Confirm to delete this product repair record?",
      batchVoidConfirm: "Confirm to void selected {count} records?",
      hint: "Hint",
      cancel: "Cancel",
      confirm: "Confirm",
      exportProgress: "Export Progress",
      exportComplete: "Export Complete",
      exporting: "Exporting data, please wait..."
    },
    productStatus: {
      normal: "Normal",
      repairing: "Repairing",
      scrap: "Scrap"
    },
    processFlow: {
      title: "Process Flow Details",
      processFlowTitle: "Process Flow",
      mainProductInfo: "Main Product Info",
      productBarcode: "Product Barcode: ",
      materialName: "Material Name: ",
      materialCode: "Material Code: ",
      workOrderNo: "Work Order No.: ",
      processSteps: "Process Steps",
      stepName: "Step Name",
      stepStatus: "Step Status",
      completionTime: "Completion Time",
      operator: "Operator",
      materials: "Material Info",
      materialType: "Material Type",
      scanStatus: "Scan Status",
      scanTime: "Scan Time",
      specModel: "Spec Model: ",
      overallProgress: "Overall Progress: ",
      currentStatus: "Current Status: ",
      detailTabs: "Detail Tabs",
      processInfo: "Process Info",
      materialInfo: "Material Info",
      materialBarcodeInfo: "Material Barcode Info",
      inspectionInfo: "Inspection Info",
      unbindInfo: "Unbind Info"
    },
    messages: {
      // Basic operation messages
      getDataFailed: "Failed to get data",
      deleteSuccess: "Delete Success",
      deleteFailed: "Delete Failed",
      deleteConfirm: "This operation will permanently delete this record, continue?",
      deleteCancel: "Delete cancelled",
      exportSuccess: "Export Success",
      exportFailed: "Export Failed",
      noRecordsFound: "No repair records found matching criteria",
      // Status validation messages
      recordReviewedCannotEdit: "This record has been reviewed and cannot be edited!",
      recordReviewedCannotVoid: "This record has been reviewed and cannot be voided!",
      recordAlreadyReviewed: "This record has been reviewed",
      // Batch operation messages
      pleaseSelectRecordsToDelete: "Please select records to delete",
      selectedRecordsContainReviewed: "Selected records contain reviewed records, cannot delete",
      pleaseSelectRecordsToReview: "Please select records to review",
      selectedRecordsContainInvalid: "Selected records contain reviewed or voided records, cannot batch review",
      // Operation success messages
      voidSuccess: "Void Success",
      batchVoidSuccess: "Batch Void Success",
      reviewSuccess: "Review Success",
      scrapReviewSuccess: "Scrap Review Success",
      batchReviewSuccessTemplate: "Batch review success, processed {updatedCount} records, scrapped {scrapCount}",
      // Operation failed messages
      operationFailed: "Operation Failed",
      reviewFailed: "Review Failed",
      batchVoidFailed: "Batch void failed, may contain reviewed records",
      batchReviewFailed: "Batch review failed",
      // Cancel operation messages
      voidCancelled: "Void cancelled",
      // Validation messages
      pleaseSelectRepairResult: "Please select repair result",
      nonScrapRecordsNeedResult: "Non-scrap repair records need repair result selection",
      // Product details messages
      getProductDetailsFailed: "Failed to get product details"
    }
  },

  // Edit Dialog
  editDialog: {
    titles: {
      create: "Add Repair Record",
      edit: "Edit Repair Record",
      view: "View Repair Record"
    },
    form: {
      barcode: "Product Barcode",
      barcodePlaceholder: "Please scan product barcode",
      confirm: "Confirm",
      solution: "Solution",
      solutionPlaceholder: "Select solution",
      defectDescription: "Defect Description",
      defectDescriptionPlaceholder: "Describe defect phenomenon",
      materialNumber: "Product Code",
      materialNumberPlaceholder: "Enter product code",
      materialName: "Product Name",
      materialNamePlaceholder: "Enter product name",
      materialSpec: "Product Model",
      materialSpecPlaceholder: "Enter product model",
      workOrderNo: "Work Order No.",
      workOrderNoPlaceholder: "Enter work order no.",
      businessType: "Business Type",
      businessTypePlaceholder: "Select business type",
      causeAnalysis: "Cause Analysis",
      causeAnalysisPlaceholder: "Enter cause analysis",
      repairDescription: "Repair Description",
      repairDescriptionPlaceholder: "Enter repair description",
      repairResult: "Review Result",
      adverseEffect: "Adverse Effect Assessment",
      adverseEffectPlaceholder: "Enter adverse effect assessment",
      status: "Status",
      statusPlaceholder: "Select status",
      remark: "Remark",
      remarkPlaceholder: "Enter remark info",
      barcodeList: "Barcode List",
      scannedCount: "Scanned Barcode Count",
      serialNumber: "Serial No.",
      productBarcode: "Product Barcode",
      operation: "Operation",
      delete: "Delete"
    },
    buttons: {
      saveAndSubmit: "Save and Submit",
      cancel: "Cancel"
    },
    tips: {
      componentReplacementTitle: "Component Replacement Tip",
      componentReplacementContent: "When selecting component replacement solution, please ensure replacement components are ready and record replaced component info."
    },
    messages: {
      scanBarcodeWarning: "Please scan product barcode first",
      noDataFound: "No related data found",
      searchFailed: "Search failed",
      maxBarcodeLimit: "Maximum 100 barcodes can be scanned",
      barcodeExists: "This barcode already exists",
      scanSuccess: "Scan Success",
      atLeastOneBarcodeRequired: "Please scan at least one product barcode",
      submitFailed: "Submit failed"
    },
    validation: {
      barcodeRequired: "Please scan at least one product barcode",
      materialSpecRequired: "Please enter product model",
      batchNumberRequired: "Please enter production batch number",
      defectDescriptionRequired: "Please describe defect phenomenon",
      solutionRequired: "Please select solution",
      statusRequired: "Please select status"
    }
  },

  // Pallet Assembly Page
  palletAssembly: {
    // Page titles and labels
    title: "Pallet Assembly Operation",
    palletCode: "Pallet Code",
    palletCodePlaceholder: "Enter or scan pallet code",
    confirmPallet: "Confirm Pallet",
    unifiedScan: "Unified Scan",
    unifiedScanPlaceholder: "Please scan barcode (finished product/package box/sub material)",
    processScan: "Process Scan",
    resetPage: "Reset Page",
    forceComplete: "Force Complete",

    // Pallet info labels
    palletInfo: {
      palletNumber: "Pallet Number",
      palletStatus: "Pallet Status",
      currentCount: "Current Count",
      totalQuantity: "Total Quantity",
      remaining: "Remaining",
      productLine: "Product Line",
      materialInfo: "Material Info",
      orderInfo: "Order Info",
      workOrderInfo: "Work Order Info",
      notSet: "Not Set"
    },

    // Pallet status
    status: {
      stacked: "Pallet Complete",
      stacking: "Palletizing"
    },

    // Section titles
    sections: {
      scanAndStatus: "Barcode Scanning & Status"
    },

    // Button text
    buttons: {
      confirmPallet: "Confirm Pallet",
      processScan: "Process Scan",
      resetPage: "Reset Page",
      forceComplete: "Force Complete"
    },

    // Validation rules
    validation: {
      palletCodeRequired: "Please enter pallet code"
    },

    // Messages
    messages: {
      // Input validation messages
      enterPalletCode: "Please enter pallet code",
      enterOrScanBarcode: "Please enter or scan barcode",
      selectPrintTemplate: "Please select print template first",
      validatePalletFirst: "Please validate pallet code first",

      // Work order related messages
      workOrderNotFound: "Work order {workOrderNo} not found",
      workOrderNoMaterial: "Work order has no main material info associated",
      materialNoCraft: "Material {materialName} has no craft configured",
      materialNoProcess: "Material {materialName} has no pallet-related process configured (e.g., F type)",
      workOrderInfoSuccess: "Work order and sub material info retrieved successfully, please start scanning",
      noSubMaterialRequired: "Current process requires no additional sub material scanning, please scan main material directly",
      workOrderInfoFailed: "Failed to get work order/process/sub material info",
      palletNoWorkOrder: "Pallet not associated with work order, may not be able to get sub material requirements",

      // Pallet validation messages
      palletInfoSuccess: "Pallet info retrieved successfully, please start scanning",
      palletNotFound: "Specified pallet not found",
      palletValidationFailed: "Pallet code validation failed",
      palletCompleted: "This pallet is already complete, cannot add more barcodes",
      palletCompletedCannotAdd: "This pallet is already complete, cannot continue adding",

      // Barcode rule related messages
      noBarcodeRules: "No barcode rules found applicable to current material, will use basic matching logic.",
      barcodeRulesLoadFailed: "Failed to load barcode rules",
      noBarcodeRulesLoaded: "No barcode rules loaded, will try direct material code matching.",
      barcodeNotMatchRules: "This barcode doesn't match any configured rules, or parsed material doesn't match current process",
      barcodeValidationError: "Barcode validation process error",
      barcodeNotMatchDirectly: "Barcode doesn't directly match any expected material code (no rules).",

      // DI code validation messages
      diCodeNotExists: "This DI code doesn't exist in system",
      diCodeNoMaterial: "This DI code has no valid material associated",
      diCodeMaterialMismatch: "DI code material doesn't match current process",
      diCodeValidationFailed: "DI code validation failed",

      // Scanning related messages
      mainMaterialScanned: "Main material {materialName} ({barcode}) scan success (rule: {ruleName})",
      subMaterialScanned: "Sub material {materialName} ({barcode}) scan success (rule: {ruleName})",
      barcodeAlreadyInPallet: "Main material barcode {barcode} is already in pallet list.",
      barcodeAlreadyScanned: "Barcode {barcode} has been scanned for other material items",
      barcodeNotMatchExpected: "Barcode {barcode} (material: {materialCode}) doesn't match current pending scan item.",
      barcodeValidationFailed: "Barcode validation failed or no material matched",

      // Package box related messages
      packingProcessRequired: "Current process includes boxing step, must scan package box barcode.",
      palletUnbindError: "Current barcode{barcode} should be palletized to {palletCode}",

      // Submit related messages
      allMaterialsScanned: "All materials scanned, preparing to submit...",
      barcodeAlreadyExists: "Main barcode {barcode} already exists in this pallet, this scan group won't be submitted repeatedly.",
      submittingData: "Submitting data...",
      submitSuccess: "Barcode {barcode} and sub materials associated successfully",
      submitSuccessWithCount: "Barcode {barcode} and sub materials associated successfully (added {count} barcodes)",
      submitFailed: "Submit failed",
      palletCompleteSuccess: "Pallet palletizing complete!",
      palletCompleteHandleFailed: "Pallet completion handling failed",

      // Print related messages
      printTemplateSuccess: "Print template saved to local",
      printTemplateFailed: "Save print template failed",
      printDataPrepareFailed: "Prepare print data failed",

      // Other messages
      clearBarcodeListConfirm: "Confirm to clear scanned barcode list?",
      barcodeListCleared: "Barcode list cleared",
      unknownDate: "Unknown",
      invalidDate: "Invalid Date",
      unrecordedWorkshop: "Unrecorded Workshop",
      unrecordedProductLine: "Unrecorded Production Line",
      lastPallet: "Last Pallet",

      // Scan status messages
      mainMaterialPending: "Pending main material barcode scan",
      subMaterialPending: "Pending scan",
      noScanRequired: "No scan required"
    },

    // Barcode list
    barcodeList: {
      title: "Scanned Barcode List ({count} items)",
      clearList: "Clear List",
      serialNumber: "No.",
      barcode: "Barcode",
      type: "Type",
      singleProduct: "Single Product",
      packagingBox: "Package Box",
      boxBarcode: "Box Barcode",
      scanTime: "Scan Time"
    },

    // Operation tips
    operationTips: {
      title: "Operation Tips",
      description: "1. Scan pallet code to confirm pallet info 2. Scan product barcode or package box barcode 3. System auto-submits, no manual save needed"
    }
  },

  // Pallet Barcode Verification Page
  palletBarcodeVerification: {
    // Page titles and labels
    title: "Pallet Barcode Verification",

    // Pallet input area
    palletInput: {
      inputPrompt: "Please enter pallet document number",
      placeholder: "Please scan pallet document number",
      loadPallet: "Load Pallet",
      scanTip: "Please aim pallet document barcode at scanner, or input pallet number in input box and press Enter"
    },

    // Completed pallets
    completedPallets: {
      title: "Completed Pallets"
    },

    // Pallet info
    palletInfo: {
      title: "Pallet Info",
      changePallet: "Change Pallet",
      palletCode: "Pallet Code",
      materialInfo: "Material Info",
      totalBarcodes: "Total Barcodes",
      verifiedBarcodes: "Verified Barcodes",
      remainingBarcodes: "Remaining Barcodes",
      palletStatus: "Pallet Status",
      statusStacked: "Pallet Complete",
      statusStacking: "Palletizing"
    },

    // Barcode input area
    barcodeInput: {
      placeholder: "Please scan barcode or manual input",
      verify: "Verify",
      scanTip: "Please aim barcode at scanner, or input barcode in input box and press Enter"
    },

    // Verification result
    verificationResult: {
      processCompleted: "Process Completed",
      processIncomplete: "Process Incomplete",
      barcodeInfo: "Barcode Basic Info",
      barcode: "Barcode",
      materialCode: "Material Code",
      materialName: "Material Name",
      status: "Status",
      completed: "Completed",
      incomplete: "Incomplete",
      progress: "Completion Progress",

      // Node statistics
      nodeStatistics: {
        totalNodes: "Total Nodes",
        completedNodes: "Completed",
        pendingNodes: "Incomplete"
      },

      // Incomplete node list
      pendingNodesList: {
        title: "Incomplete Node List",
        nodeName: "Node Name",
        nodeType: "Node Type",
        status: "Status"
      }
    },

    // Pallet barcode list
    barcodeList: {
      title: "Pallet Barcode List",
      allBarcodes: "All Barcodes",
      unverifiedBarcodes: "Pending Verification",
      totalCount: "Total {count} barcodes",
      barcode: "Barcode",
      verificationStatus: "Verification Status",
      verified: "Verified",
      unverified: "Unverified",
      processStatus: "Process Status",
      scanTime: "Scan Time"
    },

    // Status mapping
    status: {
      pending: "Pending",
      inProgress: "In Progress",
      completed: "Completed",
      skipped: "Skipped",
      error: "Error",
      processCompleted: "Process Completed",
      processIncomplete: "Process Incomplete"
    },

    // Node type
    nodeType: {
      processStep: "Process Step",
      material: "Material"
    },

    // Messages
    messages: {
      // Input validation messages
      enterPalletCode: "Please enter pallet document number",
      enterBarcode: "Please enter barcode",
      inputPalletPrompt: "Please input pallet document number below",

      // Pallet related messages
      palletDataLoadSuccess: "Pallet data loaded successfully",
      palletDataNotFound: "Pallet data not found",
      unknownMaterial: "Unknown Material",

      // Barcode verification messages
      barcodeNotInPallet: "This barcode doesn't exist in current pallet",
      barcodeCheckComplete: "Barcode check complete",
      processNotComplete: "Process not complete yet",
      allBarcodesVerified: "All barcodes completed verification, pallet verification complete",

      // System messages
      systemError: "System error, please retry",
      queryFailed: "Query failed",

      // Loading status
      loadingPalletData: "Loading pallet data...",
      verifyingBarcode: "Verifying barcode...",

      // Date formatting
      noData: "No Data",
      invalidDate: "Invalid Date"
    }
  },

  // StatusPopup Component
  statusPopup: {
    // Error message mapping
    errorMessages: {
      diCodeNotExists: "This DI code doesn't exist in system",
      diCodeNoMaterial: "This DI code has no valid material associated",
      diCodeMaterialMismatch: "DI code material doesn't match current process",
      barcodeRuleMismatch: "This barcode doesn't match any configured rules or material mismatch",
      mainBarcodeNotFound: "Corresponding main barcode process record not found",
      processNodeNotFound: "Corresponding process node not found",
      processNodeCompleted: "Process node is completed or in abnormal state",
      repairRecordExists: "This barcode has unfinished repair record",
      repairResultFailed: "This barcode has completed repair, but repair result is unqualified",
      barcodeVoided: "This barcode has been voided",
      barcodeMaterialMismatch: "Barcode doesn't match main material",
      duplicateBarcode: "Duplicate scan",
      prerequisiteIncomplete: "Incomplete prerequisite process exists",
      quantityMismatch: "Scan quantity doesn't match requirement",
      duplicateScan: "Duplicate scanned barcode exists",
      materialNotRequired: "Material is not required to be scanned for current process",
      batchLimitReached: "Batch material barcode has reached usage limit",
      subMaterialNotFound: "Sub material process record with barcode not found",
      subMaterialIncomplete: "Sub material process for this material barcode is incomplete",
      keyMaterialDuplicate: "Key material duplicate use error",
      usedByOtherProcess: "Already used by other process",
      keyMaterialMainRequired: "Key material must scan main barcode first",
      workOrderNotFound: "Work order not found",
      workOrderQuantityReached: "Work order has reached planned quantity",
      missingParameters: "Missing required parameters",
      materialCodeNotFound: "Material code not found",
      craftInfoNotFound: "Corresponding craft info not found for material",
      barcodeParameterEmpty: "Barcode parameter cannot be empty",
      productionPlanNotFound: "Finished product craft production line plan not found",
      validWorkOrderNotFound: "Valid production line work order not found",
      productBarcodeNotBound: "Product barcode not bound to work order",
      workOrderMismatch: "Current production line work order doesn't match product barcode work order",
      updateWorkOrderFailed: "Failed to update work order input quantity",
      barcodeMaterialNotMatch: "Barcode doesn't match material",
      equipmentInfoNotFound: "Corresponding equipment info not found",
      processInfoNotFound: "Corresponding process info not found",
      craftInfoNotFound2: "Corresponding craft info not found",
      materialInfoNotFound: "Corresponding material info not found",
      materialNodeNotFound: "Specified material node not found or material node doesn't belong to specified process",
      originalBarcodeMismatch: "Original material barcode doesn't match",
      repairRecordNotFound: "Corresponding component replacement repair record not found",
      newBarcodeType: "New barcode material type",
      newBarcodeIncomplete: "New barcode process incomplete",
      newBarcodeValidationFailed: "New barcode validation failed",
      processDataValidationFailed: "Process data validation failed",
      createProcessRecordFailed: "Failed to create process flow record",
      scanRequestFailed: "Failed to process scan request",
      fixBarcodeDataFailed: "Failed to fix barcode material abnormal data",
      rfidBarcodeNotFound: "Corresponding barcode for this RFID tag not found"
    }
  },

  // Box Barcode Verification Page
  boxBarcodeVerification: {
    title: "Box Barcode Verification",
    form: {
      boxBarcodeLabel: "Box Barcode:",
      boxBarcodePlaceholder: "Please scan or enter box barcode"
    },
    buttons: {
      query: "Query",
      requery: "Re-query",
      export: "Export Result",
      retry: "Retry",
      skip: "Skip"
    },
    boxInfo: {
      title: "Box Info",
      boxBarcode: "Box Barcode",
      materialCode: "Material Code",
      materialName: "Material Name",
      packingTime: "Packing Time",
      productCount: "Product Count"
    },
    progress: {
      title: "Verification Progress"
    },
    stats: {
      verified: "Verified",
      failed: "Failed",
      pending: "Pending"
    },
    scan: {
      title: "Product Barcode Scan",
      placeholder: "Please scan product barcode for verification",
      tips: "Please scan product barcode one by one for verification",
      allComplete: "All product barcode verification complete!"
    },
    productList: {
      title: "Product Barcode List",
      index: "No.",
      barcode: "Product Barcode",
      verifyTime: "Verify Time",
      actions: "Actions"
    },
    status: {
      verifySuccess: "Verify Success",
      verifyFailed: "Verify Failed",
      pending: "Pending",
      userSkipped: "User Skipped"
    },
    messages: {
      pleaseInputBoxBarcode: "Please input box barcode",
      boxBarcodeNotFound: "Data corresponding to this box barcode not found",
      boxDataLoadSuccess: "Successfully loaded box data, total {count} product barcodes",
      boxQueryFailed: "Box query failed",
      alreadyVerified: "This product barcode has been verified",
      verifySuccess: "Verify success! Product barcode is in the box",
      verifyFailed: "Verify failed! Product barcode is not in this box",
      verifyError: "Verification process error",
      resetStatus: "Barcode verification status reset",
      skipVerify: "Barcode verification skipped",
      exportSuccess: "Verification result exported"
    },
    export: {
      index: "No.",
      barcode: "Product Barcode",
      status: "Verification Status",
      verifyTime: "Verify Time",
      remark: "Remark",
      filename: "Box Verification Result"
    },
    common: {
      unknown: "Unknown"
    }
  }
};