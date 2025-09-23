/*
 * @name: 越南语语言包
 * @content: 越南语国际化资源文件
 * @Author: ljw
 * @Email: 1798245303@qq.com
 * @Date: 2025-01-23
 */

export default {
  // 通用
  common: {
    confirm: "Xác nhận",
    cancel: "Hủy bỏ",
    save: "Lưu",
    delete: "Xóa",
    edit: "Chỉnh sửa",
    add: "Thêm",
    search: "Tìm kiếm",
    reset: "Đặt lại",
    submit: "Gửi",
    back: "Quay lại",
    close: "Đóng",
    loading: "Đang tải...",
    success: "Thành công",
    error: "Lỗi",
    warning: "Cảnh báo",
    info: "Thông tin",
    yes: "Có",
    no: "Không",
    operation: "Thao tác",
    status: "Trạng thái",
    remark: "Ghi chú",
    createTime: "Thời gian tạo",
    updateTime: "Thời gian cập nhật"
  },

  // 菜单国际化
  menu: {
    // 系统管理
    systemManagement: {
      title: "Quản lý hệ thống",
      userList: "Danh sách người dùng",
      menuManagement: "Quản lý menu",
      roleManagement: "Quản lý vai trò",
      dictionaryManagement: "Quản lý từ điển",
      dictionaryData: "Dữ liệu từ điển",
      logManagement: "Quản lý nhật ký"
    },

    // 生产管理
    productionManagement: {
      title: "Quản lý sản xuất",
      productionOrder: "Đơn hàng sản xuất",
      productionPlan: "Kế hoạch sản xuất",
      productionLine: "Dây chuyền sản xuất",
      productionCraft: "Quy trình sản xuất",
      productionBarcode: "Mã vạch sản xuất"
    },

    // 产线管理
    lineManagement: {
      title: "Quản lý dây chuyền",
      scanBarCode: "Quét mã dây chuyền",
      scanBarCodeBatch: "Đóng gói pallet",
      productRepair: "Sửa chữa sản phẩm",
      scanBarCodeConver: "Chuyển đổi quét mã",
      scanBarCodeRepair: "Sửa chữa quét mã",
      scanBarCodeCheck: "Kiểm tra dây chuyền",
      customScanCheck: "Quét mã tùy chỉnh",
      scBigView: "Màn hình lớn dây chuyền",
      palletBarcodeVerification: "Xác minh pallet",
      boxBarcodeVerification: "Xác minh mã vạch hộp",
      scanBarCodeSimple: "Quét mã đơn giản",
      palletAssembly: "Lắp ráp pallet",
      scanBarCodePack: "Đóng gói quét mã",
      scanBarCodeBatchNew: "Đóng gói pallet (có vật liệu phụ)"
    },

    // 金蝶云数据
    kingdeeData: {
      title: "Dữ liệu Kingdee Cloud",
      materialInfo: "Thông tin vật liệu",
      saleOrder: "Đơn hàng bán",
      stockInfo: "Thông tin kho",
      purchaseOrder: "Đơn hàng mua",
      pickMaterial: "Lấy vật liệu sản xuất",
      deliveryNotice: "Thông báo giao hàng",
      productionInStock: "Nhập kho sản xuất",
      requisitionBill: "Đơn yêu cầu mua",
      outStock: "Xuất kho bán hàng"
    },

    // 设备管理
    equipmentManagement: {
      title: "Quản lý thiết bị",
      equipmentInfo: "Thông tin thiết bị",
      detectionData: "Dữ liệu phát hiện"
    },

    // 仓库管理
    warehouseManagement: {
      title: "Quản lý kho",
      materialPalletizing: "Chứng từ pallet",
      warehouseEntry: "Phiếu nhập kho sản xuất",
      warehouseOntry: "Phiếu xuất kho sản xuất"
    },

    // 产品追溯
    productTraceability: {
      title: "Truy xuất sản phẩm",
      materialProcessFlow: "Bản ghi mã vạch",
      productTrace: "Truy xuất thành phẩm",
      packBarcode: "Mã vạch đóng thùng"
    },

    // 基础设置
    basicSettings: {
      title: "Cài đặt cơ bản",
      printTemplate: "Mẫu in",
      barcodeRule: "Quy tắc khớp mã vạch",
      barcodeSegmentRule: "Quy tắc tạo mã vạch"
    },

    // 品质成品抽检
    qualityInspection: {
      title: "Kiểm tra chất lượng thành phẩm",
      samplingInspectionFlow: "Kiểm tra mã vạch",
      udiSamplingInspectionFlow: "Kiểm tra UDI"
    },

    // 客户条码
    customerBarcode: {
      title: "Mã vạch khách hàng",
      udiDataManagement: "Danh sách mã vạch SN-SFTP"
    },

    // 通用菜单
    common: {
      noticeList: "Danh sách thông báo",
      recruitmentManagement: "Quản lý tuyển dụng",
      messageManagement: "Quản lý tin nhắn",
      honorManagement: "Quản lý danh hiệu",
      materialLibraryManagement: "Quản lý thư viện tài liệu",
      productCategoryManagement: "Quản lý danh mục sản phẩm"
    }
  },

  // 导航栏
  navbar: {
    welcome: "Chào mừng bạn",
    logout: "Đăng xuất",
    changePassword: "Đổi mật khẩu",
    language: "Ngôn ngữ",
    chinese: "Tiếng Trung",
    vietnamese: "Tiếng Việt",
    version: "Phiên bản",
    versionInfo: "Thông tin phiên bản",
    systemVersion: "Phiên bản hệ thống",
    buildDate: "Ngày xây dựng",
    environment: "Môi trường"
  },

  // 扫码页面
  scanBarCode: {
    // 工序设置
    processSettings: {
      title: "Cài đặt quy trình",
      auto: "Tự động",
      manual: "Thủ công",
      productModel: "Mẫu sản phẩm",
      productModelPlaceholder: "Nhập mã/tên vật liệu để tìm kiếm",
      processStep: "Bước quy trình sản phẩm",
      processStepPlaceholder: "Chọn bước quy trình sản phẩm",
      productionLine: "Mã dây chuyền sản xuất",
      productionLinePlaceholder: "Nhập thông tin dây chuyền để tìm kiếm",
      saveSettings: "Lưu cài đặt",
      cancelSettings: "Hủy cài đặt",
      connected: "Đã kết nối",
      disconnected: "Chưa kết nối",
      basicInfo: "Thông tin cơ bản"
    },

    // 条码扫描
    barcodeScanning: {
      title: "Quét mã vạch",
      expand: "Mở rộng",
      collapse: "Thu gọn",
      clearCache: "Xóa bộ nhớ đệm vật liệu lô",
      unifiedScanArea: "Khu vực quét thống nhất",
      scanPlaceholder: "Vui lòng quét mã vạch",
      mainMaterial: "Vật liệu chính",
      subMaterial: "Vật liệu phụ",
      print: "In",
      noScanRequired: "Không cần quét",
      batchMaterial: "Vật liệu lô",
      keyMaterial: "Vật liệu quan trọng",
      materialCode: "Mã số",
      materialName: "Tên",
      scanMainBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu chính",
      scanSubBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu phụ"
    },

    // 工单信息
    workOrder: {
      workOrderNo: "Số lệnh sản xuất",
      noWorkOrder: "Chưa có lệnh sản xuất",
      inputQuantity: "Số lượng đầu vào",
      planQuantity: "Số lượng kế hoạch",
      scrapQuantity: "Số lượng phế liệu"
    },

    // 消息提示
    messages: {
      scanSuccess: "Quét thành công",
      mainMaterialScanSuccess: "Quét vật liệu chính thành công",
      barcodeValidationFailed: "Xác thực mã vạch thất bại",
      barcodeFormatError:
        "Định dạng mã vạch không đúng, chưa được đăng ký trong hệ thống",
      duplicateBarcode:
        "Mã vạch này đã được sử dụng, vui lòng xác nhận có phải quét trùng lặp",
      flowRecordCreated: "Tạo bản ghi truy xuất mã vạch thành phẩm thành công",
      flowRecordCreateFailed:
        "Tạo bản ghi truy xuất mã vạch thành phẩm thất bại",
      pleaseInitializeProcess:
        "Vui lòng khởi tạo cài đặt quy trình trước, chọn quy trình ràng buộc hoặc quy trình kiểm tra"
    },

    // 扫描模式
    scanning: {
      normalMode: "Chế độ thường",
      rfidMode: "Chế độ RFID",
      modeTooltip:
        "Chế độ thường dùng để quét mã vạch, chế độ RFID dùng để đọc thẻ RFID",
      unifiedScanArea: "Khu vực quét thống nhất",
      materialMatching: "Quét khớp vật liệu",
      batchCacheEnabled: "Cache vật liệu lô đã được bật",
      clearCacheOnSubmit: "Xóa cache vật liệu lô khi gửi",
      keepCacheOnSubmit: "Giữ cache vật liệu lô khi gửi",
      scanPlaceholder: "Vui lòng quét mã vạch",
      mainBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu chính",
      subBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu phụ",
      noScanRequired: "Không cần quét",
      batchMaterial: "Vật liệu lô",
      processingBox: "Đang xử lý mã vạch thùng đóng gói, vui lòng đợi...",
      processProgress: "Tiến độ xử lý",
      scannedBarcodes: "Mã vạch đã quét",
      currentProgress: "Tiến độ hiện tại",
      barcodeLabel: "Mã vạch：",
      scanTime: "Thời gian quét："
    },

    // 按钮
    buttons: {
      reset: "Đặt lại",
      confirm: "Xác nhận",
      print: "In",
      manualInput: "Nhập thủ công để truy vấn"
    }
  },

  // 系统消息
  system: {
    loginSuccess: "Đăng nhập thành công",
    loginFailed: "Đăng nhập thất bại",
    logoutSuccess: "Đăng xuất thành công",
    saveSuccess: "Lưu thành công",
    saveFailed: "Lưu thất bại",
    deleteSuccess: "Xóa thành công",
    deleteFailed: "Xóa thất bại",
    updateSuccess: "Cập nhật thành công",
    updateFailed: "Cập nhật thất bại",
    operationSuccess: "Thao tác thành công",
    operationFailed: "Thao tác thất bại",
    networkError: "Lỗi mạng",
    serverError: "Lỗi máy chủ",
    permissionDenied: "Không đủ quyền",
    dataNotFound: "Dữ liệu không tồn tại"
  },

  // 批量扫码页面
  scanBarCodeBatch: {
    title: "Quét mã hàng loạt",
    processSettings: {
      title: "Cài đặt quy trình",
      auto: "Tự động",
      manual: "Thủ công",
      productModel: "Mẫu sản phẩm",
      productModelPlaceholder: "Nhập mã/tên vật liệu để tìm kiếm",
      processStep: "Bước quy trình sản phẩm",
      processStepPlaceholder: "Chọn bước quy trình sản phẩm",
      productionLine: "Mã dây chuyền sản xuất",
      productionLinePlaceholder: "Nhập thông tin dây chuyền để tìm kiếm",
      saveSettings: "Lưu cài đặt",
      cancelSettings: "Hủy cài đặt",
      connected: "Đã kết nối",
      disconnected: "Chưa kết nối",
      basicInfo: "Thông tin cơ bản"
    },
    batchScanning: {
      title: "Quét mã vạch hàng loạt",
      expand: "Mở rộng",
      collapse: "Thu gọn",
      clearCache: "Xóa bộ nhớ đệm vật liệu lô",
      scanPlaceholder: "Vui lòng quét mã vạch",
      batchSize: "Kích thước lô",
      currentBatch: "Lô hiện tại",
      totalScanned: "Tổng số đã quét",
      batchProgress: "Tiến độ lô"
    },
    scanning: {
      normalMode: "Chế độ thường",
      rfidMode: "Chế độ RFID",
      modeTooltip:
        "Chế độ thường dùng để quét mã vạch, chế độ RFID dùng để đọc thẻ RFID",
      rfidPlaceholder: "Vui lòng đọc thẻ RFID",
      processingBox: "Đang xử lý mã vạch hộp đóng gói, vui lòng đợi...",
      processProgress: "Tiến độ xử lý",
      unifiedScanArea: "Khu vực quét thống nhất",
      materialMatching: "Quét khớp vật liệu",
      batchCacheEnabled: "Cache vật liệu lô đã được bật",
      scanPlaceholder: "Vui lòng quét mã vạch",
      mainBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu chính",
      subBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu phụ",
      noScanRequired: "Không cần quét",
      batchMaterial: "Vật liệu lô",
      processingBox: "Đang xử lý mã vạch thùng đóng gói, vui lòng đợi...",
      processProgress: "Tiến độ xử lý",
      scannedBarcodes: "Mã vạch đã quét",
      currentProgress: "Tiến độ hiện tại",
      barcodeLabel: "Mã vạch：",
      scanTime: "Thời gian quét："
    },
    buttons: {
      reset: "Đặt lại",
      confirm: "Xác nhận",
      batchProcess: "Xử lý hàng loạt",
      exportData: "Xuất dữ liệu",
      clearAll: "Xóa tất cả"
    },
    documentInfo: {
      title: "Thông tin chứng từ",
      saleOrderNo: "Số đơn bán hàng：",
      palletDocumentNo: "Số chứng từ pallet：",
      workOrderNo: "Lệnh sản xuất：",
      palletDocumentQuantity: "Số lượng chứng từ pallet：",
      materialNumber: "Mã vật liệu：",
      materialName: "Tên vật liệu：",
      materialSpec: "Quy cách vật liệu：",
      notGenerated: "Chưa tạo"
    },
    subMaterialScanning: {
      title: "Quét vật liệu phụ",
      noScanRequired: "Không cần quét",
      scanSubMaterialPlaceholder: "Vui lòng quét mã vạch vật liệu phụ",
      batchMaterial: "Vật liệu lô"
    },
    scannedList: {
      title: "Danh sách đã quét",
      currentProgress: "Tiến độ hiện tại",
      barcodeLabel: "Mã vạch：",
      scanTimeLabel: "Thời gian quét："
    },
    initTip: {
      message:
        "Vui lòng khởi tạo cài đặt quy trình trước, kiểm tra xem quy trình hiện tại có phải là quy trình pallet không"
    },
    messages: {
      batchScanSuccess: "Quét hàng loạt thành công",
      batchProcessSuccess: "Xử lý hàng loạt thành công",
      batchProcessFailed: "Xử lý hàng loạt thất bại",
      pleaseSelectItems: "Vui lòng chọn các mục cần xử lý",
      confirmBatchProcess: "Xác nhận xử lý hàng loạt các mục đã chọn?",
      // 模式切换消息
      switchToNormalMode: "Đã chuyển sang chế độ thường",
      switchToRfidMode: "Đã chuyển sang chế độ RFID",
      autoInitEnabled: "Đã bật chế độ khởi tạo tự động",
      autoInitDisabled: "Đã tắt chế độ khởi tạo tự động",
      // 产品和工序消息
      noProductModelSet: "Hiện tại chưa thiết lập mẫu sản phẩm",
      currentProductModel: "Mẫu sản phẩm hiện tại",
      noProcessStepSet: "Hiện tại chưa thiết lập quy trình sản phẩm",
      currentProcessStep: "Quy trình sản phẩm hiện tại",
      noProductionLineSet: "Hiện tại chưa thiết lập dây chuyền sản xuất",
      currentProductionLine: "Dây chuyền sản xuất hiện tại",
      productAndProcessAlreadySet: "Đã thiết lập sản phẩm và quy trình",
      // 初始化消息
      autoInitSuccess: "Khởi tạo quy trình tự động thành công",
      noMachineProgressConfig: "Không lấy được cấu hình tiến độ máy",
      getMachineProgressFailed: "Lấy tiến độ máy thất bại",
      autoInitFailed: "Khởi tạo tự động thất bại",
      // 保存和取消消息
      pleaseSelectProductProcessLine:
        "Vui lòng chọn mẫu sản phẩm, quy trình và dây chuyền sản xuất",
      saveSuccess: "Lưu thành công",
      saveFailed: "Lưu thất bại",
      cancelSettingsConfirm:
        "Xác nhận hủy cài đặt quy trình hiện tại? Điều này sẽ xóa tất cả dữ liệu cache vật liệu lô và mẫu in.",
      cancellingSettings: "Đang hủy cài đặt...",
      settingsCancelled: "Đã hủy cài đặt quy trình",
      cancelSettingsFailed: "Hủy cài đặt thất bại",
      // 扫描相关消息
      scanSuccess: "Quét thành công",
      subMaterialScanSuccess: "Quét vật liệu phụ thành công",
      barcodeScanSuccess: "Quét mã vạch thành công",
      barcodeAlreadyScanned: "Mã vạch này đã được quét",
      barcodeFormatIncorrect:
        "Định dạng mã vạch không chính xác, chưa đăng ký trong hệ thống",
      materialMismatch:
        "Vật liệu tương ứng với mã vạch không khớp với vật liệu cần thiết cho quy trình hiện tại",
      hasUnfinishedRepairRecord:
        "Mã vạch này có bản ghi sửa chữa chưa hoàn thành",
      hasCompletedScrapProcessing: "Mã vạch này đã hoàn thành xử lý phế liệu",
      repairResultUnqualified:
        "Mã vạch này đã hoàn thành sửa chữa, nhưng kết quả sửa chữa không đạt yêu cầu"
    }
  },

  // 新批量扫码页面
  scanBarCodeBatchNew: {
    title: "Quét mã hàng loạt mới",
    processSettings: {
      title: "Cài đặt quy trình",
      auto: "Tự động",
      manual: "Thủ công",
      connected: "Đã kết nối",
      disconnected: "Chưa kết nối",
      basicInfo: "Thông tin cơ bản",
      productModel: "Mẫu sản phẩm",
      productModelPlaceholder: "Nhập mã/tên vật liệu để tìm kiếm",
      processStep: "Bước quy trình sản phẩm",
      processStepPlaceholder: "Chọn bước quy trình sản phẩm",
      productionLine: "Mã dây chuyền sản xuất",
      productionLinePlaceholder: "Nhập thông tin dây chuyền để tìm kiếm",
      saveSettings: "Lưu cài đặt",
      cancelSettings: "Hủy cài đặt"
    },
    documentInfo: {
      title: "Thông tin chứng từ",
      saleOrderNo: "Số đơn bán hàng",
      palletCode: "Mã pallet",
      workOrderNo: "Lệnh sản xuất",
      totalQuantity: "Số lượng pallet",
      materialNumber: "Mã vật liệu",
      materialName: "Tên vật liệu",
      materialSpec: "Quy cách vật liệu",
      notGenerated: "Chưa tạo"
    },
    palletManagement: {
      title: "Quản lý pallet",
      expand: "Mở rộng",
      collapse: "Thu gọn",
      clearCache: "Xóa cache vật liệu lô",
      productQuantity: "Số lượng sản phẩm",
      save: "Lưu",
      cancel: "Hủy"
    },
    scanning: {
      unifiedScanArea: "Khu vực quét thống nhất",
      materialMatching: "Quét khớp vật liệu",
      batchCacheEnabled: "Cache vật liệu lô đã được bật",
      clearCacheOnSubmit: "Xóa",
      keepCacheOnSubmit: "Giữ",
      scanPlaceholder: "Vui lòng quét mã vạch",
      mainBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu chính",
      subBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu phụ",
      noScanRequired: "Không cần quét",
      batchMaterial: "Vật liệu lô",
      processingBox: "Đang xử lý mã vạch thùng đóng gói, vui lòng đợi...",
      processProgress: "Tiến độ xử lý",
      scannedBarcodes: "Mã vạch đã quét",
      currentProgress: "Tiến độ hiện tại",
      barcodeLabel: "Mã vạch：",
      scanTime: "Thời gian quét："
    },
    initTip: {
      message:
        "Vui lòng khởi tạo cài đặt quy trình trước, kiểm tra xem quy trình hiện tại có phải là quy trình pallet không"
    },
    buttons: {
      reset: "Đặt lại",
      confirm: "Xác nhận",
      addToBatch: "Thêm vào lô",
      removeBatch: "Xóa lô",
      processBatch: "Xử lý lô"
    },
    messages: {
      // 模式切换消息
      switchToNormalMode: "Đã chuyển sang chế độ thông thường",
      switchToRfidMode: "Đã chuyển sang chế độ RFID",
      autoInitEnabled: "Đã bật chế độ khởi tạo tự động",
      autoInitDisabled: "Đã tắt chế độ khởi tạo tự động",
      autoInitSuccess: "Khởi tạo quy trình tự động thành công",
      autoInitFailed: "Khởi tạo tự động thất bại",
      noMachineProgressConfig: "Không lấy được cấu hình tiến độ máy",
      // 保存相关消息
      pleaseSelectProductProcessLine:
        "Vui lòng chọn mẫu sản phẩm, quy trình và dây chuyền sản xuất",
      saveSuccess: "Lưu thành công",
      saveFailed: "Lưu thất bại",
      cancelSettingsSuccess: "Đã hủy cài đặt quy trình",
      cancelSettingsFailed: "Hủy cài đặt thất bại",
      // 扫描相关消息
      scanSuccess: "Quét thành công",
      scanSuccessful: "Quét mã thành công",
      mainMaterialScanSuccess: "Quét vật liệu chính thành công",
      subMaterialScanSuccess: "Quét vật liệu phụ thành công",
      barcodeValidationFailed: "Xác thực mã vạch thất bại",
      barcodeFormatIncorrect:
        "Định dạng mã vạch không chính xác, chưa đăng ký trong hệ thống",
      barcodeNotMatchAnyMaterial:
        "Mã vạch không khớp với bất kỳ vật liệu nào cần thiết",
      flowRecordCreateSuccess:
        "Tạo bản ghi truy xuất mã vạch thành phẩm thành công",
      // 系统错误消息
      getProductModelFailed: "Lấy mẫu sản phẩm thất bại",
      getProcessStepsFailed: "Lấy danh sách quy trình thất bại",
      getMainMaterialInfoFailed: "Lấy thông tin vật liệu chính thất bại",
      getProcessMaterialsFailed: "Lấy vật liệu quy trình thất bại",
      getBarcodeRulesFailed: "Lấy quy tắc mã vạch thất bại",
      diCodeNotExist: "Mã DI này không tồn tại trong hệ thống",
      diCodeNoMaterial: "Mã DI này không liên kết với vật liệu hợp lệ",
      diCodeMaterialMismatch:
        "Vật liệu tương ứng với mã DI này không khớp với quy trình hiện tại",
      diCodeValidationFailed: "Xác thực mã DI thất bại",
      barcodeRuleNotFound:
        "Không tìm thấy quy tắc mã vạch khả dụng (bao gồm quy tắc sản phẩm cụ thể và quy tắc toàn cục)",
      barcodeRuleNotMatch:
        "Mã vạch này không phù hợp với bất kỳ quy tắc nào đã cấu hình hoặc vật liệu không khớp",
      barcodeValidationError: "Quá trình xác thực mã vạch xảy ra lỗi",
      // 维修相关消息
      repairRecordExists: "Mã vạch này có bản ghi sửa chữa chưa hoàn thành",
      barcodeScrapProcessed: "Mã vạch này đã hoàn thành xử lý phế liệu",
      repairResultUnqualified:
        "Mã vạch này đã hoàn thành sửa chữa, nhưng kết quả sửa chữa không đạt",
      // 托盘解绑消息
      palletUnbindRecord:
        "Mã vạch này có bản ghi hủy ràng buộc pallet, vui lòng xử lý tại bàn sửa chữa",
      // 包装箱相关消息
      processingBoxBarcode:
        "Đang xử lý mã vạch thùng đóng gói, vui lòng đợi xử lý hoàn tất...",
      printTemplateRequired: "Vui lòng chọn mẫu in trước",
      boxProcessRequired:
        "Quy trình hiện tại bao gồm công đoạn đóng thùng, phải quét mã vạch thùng đóng gói.",
      boxQuantityExceedsLimit:
        "Số lượng mã vạch trong thùng đóng gói vượt quá số lượng khả dụng còn lại của pallet",
      boxScanSuccess: "Quét thùng đóng gói thành công, thêm mã vạch",
      scanProcessingFailed: "Xử lý quét thất bại",
      // 批次相关消息
      batchUsageLimitReached:
        "Mã vạch vật liệu lô đã đạt giới hạn số lần sử dụng",
      batchQuantityCannotBeLess:
        "Số lượng lô không thể nhỏ hơn số lượng đã vào pallet",
      batchSizeSettingSaved: "Cài đặt số lượng lô đã được lưu",
      batchSizeSettingCancelled: "Đã hủy cài đặt số lượng lô",
      batchSizeSaveFailed: "Lưu thất bại",
      batchSizeCancelFailed: "Hủy thất bại",
      noEditPermission: "Không có quyền chỉnh sửa cấu hình dây chuyền sản xuất",
      listCleared: "Danh sách đã được xóa",
      currentLineNotSet: "Dây chuyền hiện tại chưa được thiết lập",
      noActiveWorkOrder:
        "Dây chuyền hiện tại không có lệnh sản xuất đang hoạt động",
      workOrderChanged:
        "Phát hiện lệnh sản xuất đã thay đổi, cache vật liệu lô đã được xóa",
      // 打印相关消息
      printTemplateSaved: "Mẫu in đã được lưu vào local",
      printTemplateSaveFailed: "Lưu mẫu in thất bại",
      batchBarcodePrintSuccess: "In mã vạch lô thành công",
      printFailed: "In thất bại",
      autoPrintEnabled: "Đã bật chế độ in tự động",
      autoPrintDisabled: "Đã tắt chế độ in tự động",
      // 设备连接消息
      deviceServerConnected: "Kết nối máy chủ thiết bị thành công",
      deviceConnectionLost: "Kết nối thiết bị đã bị ngắt",
      maxReconnectAttemptsReached:
        "Đã đạt giới hạn số lần kết nối lại, vui lòng kiểm tra kết nối mạng hoặc làm mới trang",
      deviceConnectionInitFailed: "Khởi tạo kết nối thiết bị thất bại",
      deviceNotConnected: "Thiết bị chưa kết nối",
      // 缓存相关消息
      cacheClearedSuccess: "Xóa cache thành công, đã xóa mục cache",
      clearCacheFailed: "Xóa cache thất bại",
      // 销售单号相关
      getSaleOrderNumberFailed: "Lấy số đơn bán hàng thất bại",
      // 确认失败消息
      confirmFailed: "Xác nhận thất bại",
      // 其他消息
      addToBatchSuccess: "Thêm vào lô thành công",
      removeBatchSuccess: "Xóa lô thành công",
      batchProcessSuccess: "Xử lý lô thành công",
      batchProcessFailed: "Xử lý lô thất bại",
      pleaseInitializeProcess:
        "Vui lòng khởi tạo cài đặt quy trình quét lô trước",
      // 测试消息
      palletAutoModeSwitch:
        "Chuyển đổi chế độ thủ công/tự động đóng gói pallet",
      palletProductSelect: "Chọn mẫu sản phẩm đóng gói pallet",
      palletProcessSelect: "Chọn quy trình sản phẩm đóng gói pallet",
      palletLineSelect: "Chọn mã dây chuyền đóng gói pallet",
      palletSaveSettings: "Lưu cài đặt đóng gói pallet"
    }
  },

  // 扫码转换页面
  scanBarCodeConver: {
    title: "Quét mã chuyển đổi",
    processSettings: {
      title: "Cài đặt quy trình",
      auto: "Tự động",
      manual: "Thủ công",
      connected: "Đã kết nối",
      disconnected: "Chưa kết nối",
      basicInfo: "Thông tin cơ bản",
      productModel: "Mẫu sản phẩm",
      productModelPlaceholder: "Nhập mã/tên vật liệu để tìm kiếm",
      processStep: "Bước quy trình sản phẩm",
      processStepPlaceholder: "Chọn bước quy trình sản phẩm",
      productionLine: "Mã dây chuyền sản xuất",
      productionLinePlaceholder: "Nhập thông tin dây chuyền để tìm kiếm",
      saveSettings: "Lưu cài đặt",
      cancelSettings: "Hủy cài đặt"
    },
    scanning: {
      title: "Khu vực quét thống nhất",
      scanPlaceholder: "Vui lòng quét mã vạch",
      mainMaterial: "Vật liệu chính",
      conversion: "Chuyển đổi",
      normal: "Thường",
      subMaterial: "Vật liệu phụ",
      reset: "Đặt lại",
      confirm: "Xác nhận",
      expand: "Mở rộng",
      collapse: "Thu gọn",
      clearCache: "Xóa cache",
      mainBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu chính",
      subBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu phụ",
      noScanRequired: "Không cần quét",
      batchMaterial: "Vật liệu lô",
      originalBarcode: "Mã vạch gốc",
      newBarcode: "Mã vạch mới",
      scanOriginalPlaceholder: "Vui lòng quét mã vạch gốc",
      scanNewPlaceholder: "Vui lòng quét mã vạch mới",
      conversionType: "Loại chuyển đổi",
      conversionReason: "Lý do chuyển đổi"
    },
    materialInfo: {
      materialNumber: "Mã vật liệu：",
      materialName: "Tên vật liệu："
    },
    initTip: {
      message: "Vui lòng khởi tạo cài đặt quy trình trước, chọn quy trình in"
    },
    buttons: {
      reset: "Đặt lại",
      confirm: "Xác nhận chuyển đổi",
      convert: "Chuyển đổi"
    },
    messages: {
      // 模式切换消息
      switchToNormalMode: "Đã chuyển sang chế độ thường",
      switchToRfidMode: "Đã chuyển sang chế độ RFID",
      autoInitEnabled: "Đã bật chế độ khởi tạo tự động",
      autoInitDisabled: "Đã tắt chế độ khởi tạo tự động",
      autoInitSuccess: "Khởi tạo quy trình tự động thành công",
      autoInitFailed: "Khởi tạo tự động thất bại",
      noMachineProgressConfig: "Không lấy được cấu hình tiến độ máy",
      getMachineProgressFailed: "Lấy tiến độ máy thất bại",
      // 保存相关消息
      pleaseSelectProductProcessLine:
        "Vui lòng chọn mẫu sản phẩm, quy trình và dây chuyền sản xuất",
      saveSuccess: "Lưu thành công",
      saveFailed: "Lưu thất bại",
      cancelSettingsConfirm:
        "Xác nhận hủy cài đặt quy trình hiện tại? Điều này sẽ xóa tất cả dữ liệu cache vật liệu lô.",
      settingsCancelled: "Đã hủy cài đặt quy trình",
      cancelSettingsFailed: "Hủy cài đặt thất bại",
      // 扫描相关消息
      scanSuccess: "Quét thành công",
      scanSuccessful: "Quét mã thành công",
      barcodeValidationFailed: "Xác thực mã vạch thất bại",
      barcodeFormatIncorrect:
        "Định dạng mã vạch không chính xác, chưa đăng ký trong hệ thống",
      materialMismatch: "Mã vạch không khớp với vật liệu chính",
      printTemplateRequired: "Vui lòng chọn mẫu in trước",
      printTemplateSaved: "Mẫu in đã được lưu vào local",
      printTemplateSaveFailed: "Lưu mẫu in thất bại",
      batchBarcodePrintSuccess: "In mã vạch lô thành công",
      printFailed: "In thất bại",
      autoPrintEnabled: "Đã bật chế độ in tự động",
      autoPrintDisabled: "Đã tắt chế độ in tự động",
      conversionEnabled: "Đã bật chế độ chuyển đổi",
      conversionDisabled: "Đã tắt chế độ chuyển đổi",
      // 设备连接消息
      deviceServerConnected: "Kết nối máy chủ thiết bị thành công",
      deviceConnectionLost: "Kết nối thiết bị đã bị ngắt",
      maxReconnectAttemptsReached:
        "Đã đạt giới hạn số lần kết nối lại, vui lòng kiểm tra kết nối mạng hoặc làm mới trang",
      deviceConnectionInitFailed: "Khởi tạo kết nối thiết bị thất bại",
      deviceNotConnected: "Thiết bị chưa kết nối",
      // 其他消息
      confirmClearCache:
        "Xác nhận xóa tất cả dữ liệu cache trang? Thao tác này không thể khôi phục.",
      cacheClearedSuccess: "Xóa cache thành công",
      clearCacheFailed: "Xóa cache thất bại",
      confirmCompleteAllScanning:
        "Vui lòng hoàn thành tất cả việc quét mã vạch cần thiết",
      conversionSuccess: "Chuyển đổi thành công",
      conversionFailed: "Chuyển đổi thất bại",
      pleaseInitializeProcess:
        "Vui lòng khởi tạo cài đặt quy trình chuyển đổi trước",
      // 系统错误消息
      getBarcodeRulesFailed: "Lấy quy tắc mã vạch thất bại",
      getProductModelFailed: "Lấy mẫu sản phẩm thất bại",
      getProcessStepsFailed: "Lấy danh sách quy trình thất bại",
      autoApplyPrintTemplate: "Đã tự động áp dụng mẫu in liên kết quy trình",
      getPrintTemplateFailed: "Lấy mẫu in liên kết quy trình thất bại",
      getMainMaterialInfoFailed: "Lấy thông tin vật liệu chính thất bại",
      getProcessMaterialsFailed: "Lấy vật liệu quy trình thất bại",
      diCodeNotExist: "Mã DI này không tồn tại trong hệ thống",
      diCodeNoMaterial: "Mã DI này không liên kết với vật liệu hợp lệ",
      diCodeMaterialMismatch:
        "Vật liệu tương ứng với mã DI này không khớp với quy trình hiện tại",
      diCodeValidationFailed: "Xác thực mã DI thất bại",
      barcodeRuleNotMatch:
        "Mã vạch này không phù hợp với bất kỳ quy tắc nào đã cấu hình hoặc vật liệu không khớp",
      barcodeValidationError: "Quá trình xác thực mã vạch xảy ra lỗi",
      flowRecordCreateSuccess:
        "Tạo bản ghi truy xuất mã vạch thành phẩm thành công",
      repairRecordExists: "Mã vạch này có bản ghi sửa chữa chưa hoàn thành",
      barcodeScrapProcessed: "Mã vạch này đã hoàn thành xử lý phế liệu",
      repairResultUnqualified:
        "Mã vạch này đã hoàn thành sửa chữa, nhưng kết quả sửa chữa không đạt",
      barcodeVoided: "Mã vạch này đã bị hủy",
      confirmFailedPrefix: "Xác nhận thất bại:",
      batchUsageLimitReached: "Số lần sử dụng mã vạch lô đã đạt giới hạn"
    }
  },

  // 扫码包装页面
  scanBarCodePack: {
    title: "Quét mã đóng gói",
    processSettings: {
      title: "Cài đặt quy trình",
      auto: "Tự động",
      manual: "Thủ công",
      connected: "Đã kết nối",
      disconnected: "Chưa kết nối",
      basicInfo: "Thông tin cơ bản",
      productModel: "Mẫu sản phẩm",
      productModelPlaceholder: "Nhập mã/tên vật liệu để tìm kiếm",
      processStep: "Bước quy trình sản phẩm",
      processStepPlaceholder: "Chọn bước quy trình sản phẩm",
      productionLine: "Mã dây chuyền sản xuất",
      productionLinePlaceholder: "Nhập thông tin dây chuyền để tìm kiếm",
      saveSettings: "Lưu cài đặt",
      cancelSettings: "Hủy cài đặt"
    },
    scanning: {
      title: "Quét mã vạch",
      expand: "Mở rộng",
      collapse: "Thu gọn",
      clearCache: "Xóa cache vật liệu lô",
      unifiedScanArea: "Khu vực quét thống nhất",
      scanPlaceholder: "Vui lòng quét mã vạch",
      mainMaterial: "Vật liệu chính",
      subMaterial: "Vật liệu phụ",
      mainBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu chính",
      subBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu phụ",
      noScanRequired: "Không cần quét",
      batchMaterial: "Vật liệu lô"
    },
    packaging: {
      notGenerated: "Chưa tạo mã vạch thùng đóng gói",
      packageBarcode: "Mã vạch thùng đóng gói",
      pending: "Chờ đầy",
      packageType: "Loại đóng gói",
      packageSize: "Quy cách đóng gói",
      productBarcode: "Mã vạch sản phẩm",
      packageQuantity: "Số lượng đóng gói"
    },
    materialInfo: {
      materialNumber: "Mã vật liệu：",
      materialName: "Tên vật liệu："
    },
    initTip: {
      message:
        "Vui lòng khởi tạo cài đặt quy trình trước, chọn quy trình không phải pallet"
    },
    buttons: {
      reset: "Đặt lại",
      confirm: "Xác nhận",
      package: "Đóng gói",
      print: "In nhãn"
    },
    messages: {
      // 模式切换消息
      autoInitEnabled: "Đã bật chế độ khởi tạo tự động",
      autoInitDisabled: "Đã tắt chế độ khởi tạo tự động",
      autoInitSuccess: "Khởi tạo quy trình tự động thành công",
      autoInitFailed: "Khởi tạo tự động thất bại",
      noMachineProgressConfig: "Không lấy được cấu hình tiến độ máy",
      // 保存相关消息
      pleaseSelectProductProcessLine:
        "Vui lòng chọn mẫu sản phẩm, quy trình và dây chuyền sản xuất",
      saveSuccess: "Lưu thành công",
      saveFailed: "Lưu thất bại",
      cancelSettingsSuccess: "Đã hủy cài đặt quy trình",
      cancelSettingsFailed: "Hủy cài đặt thất bại",
      // 扫描相关消息
      scanSuccess: "Quét thành công",
      scanSuccessful: "Quét mã thành công",
      mainMaterialScanSuccess: "Quét vật liệu chính thành công",
      subMaterialScanSuccess: "Quét vật liệu phụ thành công",
      barcodeValidationFailed: "Xác thực mã vạch thất bại",
      barcodeFormatIncorrect:
        "Định dạng mã vạch không chính xác, chưa đăng ký trong hệ thống",
      barcodeNotMatch: "Mã vạch không khớp",
      flowRecordCreateSuccess:
        "Tạo bản ghi truy xuất mã vạch thành phẩm thành công",
      // 打印相关消息
      printTemplateRequired: "Vui lòng chọn mẫu in trước",
      printTemplateSaved: "Mẫu in đã được lưu vào local",
      printTemplateSaveFailed: "Lưu mẫu in thất bại",
      batchBarcodePrintSuccess: "In mã vạch lô thành công",
      printFailed: "In thất bại",
      autoPrintEnabled: "Đã bật chế độ in tự động",
      autoPrintDisabled: "Đã tắt chế độ in tự động",
      batchBarcodeGenerateFailed: "Tạo mã vạch lô thất bại",
      // 系统错误消息
      getBarcodeRulesFailed: "Lấy quy tắc mã vạch thất bại",
      getProductModelFailed: "Lấy mẫu sản phẩm thất bại",
      getProcessStepsFailed: "Lấy danh sách quy trình thất bại",
      getMainMaterialInfoFailed: "Lấy thông tin vật liệu chính thất bại",
      getProcessMaterialsFailed: "Lấy vật liệu quy trình thất bại",
      diCodeNotExist: "Mã DI này không tồn tại trong hệ thống",
      diCodeNoMaterial: "Mã DI này không liên kết với vật liệu hợp lệ",
      diCodeMaterialMismatch:
        "Vật liệu tương ứng với mã DI này không khớp với quy trình hiện tại",
      diCodeValidationFailed: "Xác thực mã DI thất bại",
      barcodeRuleNotFound:
        "Không tìm thấy quy tắc mã vạch khả dụng (bao gồm quy tắc sản phẩm cụ thể và quy tắc toàn cục)",
      barcodeRuleNotMatch:
        "Mã vạch này không phù hợp với bất kỳ quy tắc nào đã cấu hình hoặc vật liệu không khớp",
      barcodeValidationError: "Quá trình xác thực mã vạch xảy ra lỗi",
      // 维修相关消息
      repairRecordExists: "Mã vạch này có bản ghi sửa chữa chưa hoàn thành",
      barcodeScrapProcessed: "Mã vạch này đã hoàn thành xử lý phế liệu",
      repairResultUnqualified:
        "Mã vạch này đã hoàn thành sửa chữa, nhưng kết quả sửa chữa không đạt",
      // 包装相关消息
      useMainBarcodeInOrder:
        "Vui lòng sử dụng mã vạch vật liệu chính theo thứ tự, nên sử dụng mã vạch",
      batchUsageLimitReached: "Số lần sử dụng mã vạch lô đã đạt giới hạn",
      batchUsageLimitReachedWithCode:
        "Mã vạch vật liệu lô đã đạt giới hạn số lần sử dụng",
      confirmCompleteAllScanning:
        "Vui lòng hoàn thành tất cả việc quét mã vạch cần thiết",
      confirmFailedPrefix: "Xác nhận thất bại",
      // 设备连接消息
      deviceServerConnected: "Kết nối máy chủ thiết bị thành công",
      deviceConnectionLost: "Kết nối thiết bị đã bị ngắt",
      maxReconnectAttemptsReached:
        "Đã đạt giới hạn số lần kết nối lại, vui lòng kiểm tra kết nối mạng hoặc làm mới trang",
      deviceConnectionInitFailed: "Khởi tạo kết nối thiết bị thất bại",
      deviceNotConnected: "Thiết bị chưa kết nối",
      // 缓存相关消息
      cacheClearedSuccess: "Xóa cache thành công",
      clearCacheFailed: "Xóa cache thất bại",
      // 包装箱相关消息
      materialNotBoundBarcodeRule:
        "Vật liệu này chưa ràng buộc quy tắc tạo mã vạch",
      getBarcodeRuleDetailsFailed: "Lấy chi tiết quy tắc mã vạch thất bại",
      noActiveWorkOrderOnLine:
        "Dây chuyền hiện tại không có lệnh sản xuất đang hoạt động",
      generatedBarcodeEmpty: "Mã vạch được tạo trống",
      packingBarcodeInitialized: "Mã vạch đóng thùng đã được khởi tạo",
      // 其他消息
      packageSuccess: "Đóng gói thành công",
      packageFailed: "Đóng gói thất bại",
      pleaseInitializeProcess:
        "Vui lòng khởi tạo cài đặt quy trình trước, chọn quy trình không phải pallet"
    }
  },

  // 扫码维修页面
  scanBarCodeRepair: {
    title: "Quét mã sửa chữa",
    processSettings: {
      title: "Cài đặt quy trình sửa chữa",
      productModel: "Mẫu sản phẩm",
      productModelPlaceholder: "Nhập mã/tên vật liệu để tìm kiếm",
      processStep: "Bước quy trình sản phẩm",
      processStepPlaceholder: "Chọn bước quy trình sản phẩm",
      productionLine: "Mã dây chuyền sản xuất",
      productionLinePlaceholder: "Nhập thông tin dây chuyền để tìm kiếm",
      workOrder: "Lệnh sửa chữa",
      workOrderPlaceholder: "Nhập số lệnh/mẫu để tìm kiếm (bắt buộc)",
      saveSettings: "Lưu cài đặt",
      cancelSettings: "Hủy cài đặt",
      repairBasicInfo: "Thông tin cơ bản sửa chữa",
      repairTypePlaceholder: "Vui lòng chọn loại sửa chữa"
    },
    repairTypes: {
      rework: "Làm lại",
      repair: "Sửa chữa",
      replace: "Thay thế"
    },
    workOrder: {
      number: "Số lệnh sửa chữa",
      repairQuantity: "Số lượng sửa chữa",
      noWorkOrder: "Chưa có lệnh sản xuất",
      planned: "Kế hoạch",
      input: "Đầu vào"
    },
    material: {
      code: "Mã số",
      name: "Tên",
      barcode: "Mã vạch",
      relatedBill: "Số đơn liên quan"
    },
    productionLine: {
      line1: "Dây chuyền 1",
      line2: "Dây chuyền 2"
    },
    scanning: {
      title: "Quét trạm sửa chữa",
      scanArea: "Khu vực quét mã vạch sửa chữa",
      mainMaterial: "Vật liệu chính cần sửa chữa",
      repairComponents: "Bộ phận cần thiết cho sửa chữa",
      scanPlaceholder: "Vui lòng quét mã vạch",
      scanMainBarcodePlaceholder:
        "Vui lòng quét mã vạch vật liệu chính cần sửa chữa",
      scanSubBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu phụ",
      conversion: "Chuyển đổi",
      normal: "Bình thường"
    },
    buttons: {
      reset: "Đặt lại",
      confirmRepair: "Xác nhận sửa chữa",
      clearWorkOrder: "Xóa lựa chọn lệnh sản xuất",
      expand: "Mở rộng",
      collapse: "Thu gọn",
      clearCache: "Xóa cache vật liệu lô"
    },
    status: {
      connected: "Đã kết nối",
      disconnected: "Chưa kết nối",
      noScanRequired: "Không cần quét",
      batchMaterial: "Vật liệu lô",
      keyMaterial: "Vật liệu quan trọng"
    },
    initTip: {
      message:
        "Vui lòng thiết lập quy trình sửa chữa trước, chọn quy trình ràng buộc hoặc quy trình kiểm tra"
    },
    messages: {
      // 模式切换消息
      autoInitEnabled: "Đã bật chế độ khởi tạo tự động",
      autoInitDisabled: "Đã tắt chế độ khởi tạo tự động",
      autoInitSuccess: "Khởi tạo quy trình tự động thành công",
      autoInitFailed: "Khởi tạo tự động thất bại",
      noMachineProgressConfig: "Không lấy được cấu hình tiến độ máy",
      conversionEnabled: "Đã bật chế độ chuyển đổi",
      conversionDisabled: "Đã tắt chế độ chuyển đổi",
      autoPrintEnabled: "Đã bật chế độ in tự động",
      autoPrintDisabled: "Đã tắt chế độ in tự động",
      // 保存相关消息
      workOrderRequired: "Phải chọn lệnh sửa chữa mới có thể lưu cài đặt",
      saveSuccess: "Lưu thành công",
      saveFailed: "Lưu thất bại",
      cancelSettingsSuccess: "Đã hủy cài đặt quy trình",
      cancelSettingsFailed: "Hủy cài đặt thất bại",
      workOrderSelected: "Đã chọn lệnh sản xuất",
      clearWorkOrderSuccess: "Đã xóa lựa chọn lệnh sản xuất",
      // 获取数据相关消息
      getBarcodeRulesFailed: "Lấy quy tắc mã vạch thất bại",
      getProductModelFailed: "Lấy mẫu sản phẩm thất bại",
      getProcessStepsFailed: "Lấy danh sách quy trình thất bại",
      getMainMaterialInfoFailed: "Lấy thông tin vật liệu chính thất bại",
      getProcessMaterialsFailed: "Lấy vật liệu quy trình thất bại",
      getProcessTemplateFailed: "Lấy mẫu in liên kết quy trình thất bại",
      templateAppliedSuccess: "Đã tự động áp dụng mẫu in liên kết quy trình",
      // 扫描相关消息
      scanSuccess: "Quét thành công",
      scanSuccessful: "Quét mã thành công",
      mainMaterialScanSuccess: "Quét vật liệu chính thành công",
      subMaterialScanSuccess: "Quét vật liệu phụ thành công",
      flowRecordCreateSuccess:
        "Tạo bản ghi truy xuất mã vạch thành phẩm thành công",
      batchBarcodeGenerateFailed: "Tạo mã vạch lô thất bại",
      pleaseSelectTemplate: "Vui lòng chọn mẫu in trước",
      // 条码验证消息
      diCodeMaterialMismatch:
        "Vật liệu tương ứng với mã DI này không khớp với quy trình hiện tại",
      diCodeNoMaterial: "Mã DI này không liên kết với vật liệu hợp lệ",
      diCodeValidationFailed: "Xác thực mã DI thất bại",
      barcodeRuleNotFound:
        "Không tìm thấy quy tắc mã vạch khả dụng (bao gồm quy tắc sản phẩm cụ thể và quy tắc toàn cục)",
      barcodeRuleNotMatch:
        "Mã vạch này không phù hợp với bất kỳ quy tắc nào đã cấu hình hoặc vật liệu không khớp",
      barcodeValidationError: "Quá trình xác thực mã vạch xảy ra lỗi",
      barcodeNotMatch: "Mã vạch không khớp",
      // 维修相关消息
      repairRecordExists: "Mã vạch này có bản ghi sửa chữa chưa hoàn thành",
      barcodeScrapProcessed: "Mã vạch này đã hoàn thành xử lý phế liệu",
      repairResultUnqualified:
        "Mã vạch này đã hoàn thành sửa chữa, nhưng kết quả sửa chữa không đạt",
      barcodeVoided: "Mã vạch này đã bị hủy",
      barcodeSuspended: "Mã vạch này đã bị tạm dừng sử dụng",
      materialExpired: "Vật liệu này đã hết hạn, không thể sử dụng",
      keyMaterialRequireMainBarcode:
        "Vật liệu quan trọng phải quét mã vạch chính trước",
      // 批次相关消息
      batchUsageLimitReached:
        "Mã vạch vật liệu lô đã đạt giới hạn số lần sử dụng",
      batchUsageLimitReachedWithCount:
        "Mã vạch vật liệu lô {barcode} đã đạt giới hạn số lần sử dụng {count} lần",
      batchCodeUsageLimitReached: "Mã vạch lô đã đạt giới hạn số lần sử dụng",
      // 确认相关消息
      pleaseCompleteAllScans:
        "Vui lòng hoàn thành tất cả việc quét mã vạch cần thiết",
      confirmFailed: "Xác nhận thất bại",
      workOrderNotFound: "Không tìm thấy lệnh sản xuất",
      processNodeCompleted:
        "Nút quy trình tương ứng với mã vạch vật liệu chính này đã hoàn thành hoặc ở trạng thái bất thường",
      // 打印相关消息
      printSuccess: "In mã vạch lô thành công",
      printFailed: "In thất bại",
      printTemplateSaved: "Mẫu in đã được lưu vào local",
      printTemplateSaveFailed: "Lưu mẫu in thất bại",
      // 缓存相关消息
      cacheClearSuccess: "Xóa cache thành công",
      cacheClearFailed: "Xóa cache thất bại",
      // 设备连接消息
      deviceServerConnected: "Kết nối máy chủ thiết bị thành công",
      deviceConnectionLost:
        "Kết nối thiết bị đã bị ngắt, {delay} giây sau thử kết nối lại lần thứ {attempts}",
      maxReconnectAttemptsReached:
        "Đã đạt giới hạn số lần kết nối lại, vui lòng kiểm tra kết nối mạng hoặc làm mới trang",
      deviceConnectionInitFailed: "Khởi tạo kết nối thiết bị thất bại",
      deviceNotConnected: "Thiết bị chưa kết nối",
      repairSuccess: "Sửa chữa thành công",
      repairFailed: "Sửa chữa thất bại",
      pleaseInitializeProcess:
        "Vui lòng thiết lập quy trình sửa chữa trước, chọn quy trình ràng buộc hoặc quy trình kiểm tra",
      // 新增消息
      generatingBatchBarcode: "Đang tạo mã vạch lô...",
      materialCodeNotFound: "Không lấy được thông tin mã vật liệu",
      printDataNotReady: "Dữ liệu in chưa sẵn sàng",
      missingRequiredFields: "Thiếu trường bắt buộc",
      pleaseSelectRequired: "Vui lòng chọn trường bắt buộc",
      saving: "Đang lưu...",
      processStepNotFound: "Không tìm thấy thông tin quy trình",
      craftInfoNotFound: "Không tìm thấy thông tin công nghệ",
      materialInfoNotFound: "Không tìm thấy thông tin vật liệu",
      createFlowRecordFailed: "Tạo bản ghi truy xuất mã vạch thành phẩm thất bại",
      materialNotFound: "Không tìm thấy thông tin vật liệu tương ứng",
      materialCodeMismatch: "Mã vật liệu không khớp",
      barcodeValidationFailed: "Xác thực mã vạch thất bại",
      barcodeFormatIncorrect: "Định dạng mã vạch không đúng, chưa đăng ký trong hệ thống",
      scanComplete: "Quét hoàn thành",
      allMaterialsScanned: "Tất cả vật liệu đã được quét xong",
      sendingConfirmation: "Đang gửi xác nhận...",
      continueScan: "Tiếp tục quét",
      pleaseContinueScanning: "Vui lòng tiếp tục quét các vật liệu sau:",
      scanProcessFailed: "Xử lý quét thất bại",
      cancellingSettings: "Đang hủy cài đặt...",
      clearingCache: "Đang xóa cache...",
      createMainFlowRecordFailed: "Tạo bản ghi quy trình chính thất bại",
      invalidFlowRecord: "Không thể lấy hoặc tạo bản ghi quy trình công nghệ hợp lệ",
      productionPlanNotFound: "Không tìm thấy kế hoạch sản xuất",
      getMachineProgressFailed: "Lấy tiến độ máy thất bại",
      scanMainBarcodeFirst: "Vui lòng quét mã vạch chính trước",
      // 确认对话框消息
      confirmCancelSettings:
        "Xác nhận hủy cài đặt quy trình hiện tại? Điều này sẽ xóa tất cả dữ liệu cache vật liệu lô.",
      confirmClearCache:
        "Xác nhận xóa tất cả dữ liệu cache trang? Thao tác này không thể khôi phục."
    },
    dialogs: {
      hint: "Gợi ý",
      confirm: "Xác nhận",
      cancel: "Hủy"
    }
  },

  // 扫码维修页面
  scanBarCodeRepair2: {
    messages: {
      repairSuccess: "Sửa chữa thành công",
      repairFailed: "Sửa chữa thất bại",
      pleaseInitializeProcess: "Vui lòng thiết lập quy trình sửa chữa trước, chọn quy trình ràng buộc hoặc quy trình kiểm tra"
    }
  },

  // 扫码检查页面
  scanBarCodeCheck: {
    title: "Kiểm tra nút quy trình mã vạch",
    scanning: {
      scanPlaceholder: "Vui lòng quét mã vạch hoặc nhập thủ công",
      scanTip:
        "Vui lòng hướng mã vạch vào súng quét, hoặc nhập mã vạch trong ô nhập liệu rồi nhấn Enter",
      query: "Truy vấn",
      manualInput: "Nhập thủ công để truy vấn",
      unifiedScanArea: "Khu vực quét thống nhất",
      materialMatching: "Quét khớp vật liệu",
      batchCacheEnabled: "Cache vật liệu lô đã được bật",
      scanPlaceholder: "Vui lòng quét mã vạch",
      mainBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu chính",
      subBarcodePlaceholder: "Vui lòng quét mã vạch vật liệu phụ",
      noScanRequired: "Không cần quét",
      batchMaterial: "Vật liệu lô",
      processingBox: "Đang xử lý mã vạch thùng đóng gói, vui lòng đợi...",
      processProgress: "Tiến độ xử lý",
      scannedBarcodes: "Mã vạch đã quét",
      currentProgress: "Tiến độ hiện tại",
      barcodeLabel: "Mã vạch：",
      scanTime: "Thời gian quét："
    },
    results: {
      barcodeInfo: "Thông tin cơ bản mã vạch",
      barcode: "Mã vạch",
      materialCode: "Mã vật liệu",
      materialName: "Tên vật liệu",
      status: "Trạng thái",
      progress: "Tiến độ hoàn thành",
      completed: "Đã hoàn thành",
      incomplete: "Chưa hoàn thành",
      flowCompleted: "Quy trình đã hoàn thành",
      flowIncomplete: "Quy trình chưa hoàn thành"
    },
    statistics: {
      totalNodes: "Tổng số nút",
      completedNodes: "Đã hoàn thành",
      pendingNodes: "Chưa hoàn thành",
      pendingNodesList: "Danh sách nút chưa hoàn thành",
      nodeName: "Tên nút",
      nodeType: "Loại nút",
      processStep: "Bước quy trình",
      material: "Vật liệu"
    },
    status: {
      pending: "Chờ xử lý",
      inProgress: "Đang tiến hành",
      completed: "Đã hoàn thành",
      skipped: "Đã bỏ qua",
      error: "Bất thường"
    },
    messages: {
      pleaseInputBarcode: "Vui lòng nhập mã vạch",
      checkComplete: "Kiểm tra mã vạch hoàn thành",
      flowNotComplete: "Quy trình chưa hoàn thành",
      queryFailed: "Truy vấn thất bại",
      systemError: "Lỗi hệ thống, vui lòng thử lại",
      startVerification:
        "Bắt đầu quy trình xác minh dây chuyền, vui lòng quét mã QR",
      queryingBarcode: "Đang truy vấn thông tin mã vạch..."
    }
  },

  // 产品维修页面
  productRepair: {
    title: "Quản lý sửa chữa sản phẩm",
    search: {
      title: "Lọc tìm kiếm",
      productBarcode: "Mã vạch sản phẩm",
      productBarcodePlaceholder: "Nhập mã vạch sản phẩm",
      productModel: "Mẫu sản phẩm",
      productModelPlaceholder: "Nhập mẫu sản phẩm",
      solution: "Phương án xử lý",
      solutionPlaceholder: "Chọn phương án xử lý",
      workOrderNo: "Lệnh sản xuất",
      workOrderNoPlaceholder: "Nhập lệnh sản xuất",
      saleOrderNo: "Đơn hàng bán",
      saleOrderNoPlaceholder: "Nhập đơn hàng bán",
      productionOrderNo: "Đơn hàng sản xuất",
      productionOrderNoPlaceholder: "Nhập đơn hàng sản xuất",
      materialNumber: "Số vật liệu",
      materialNumberPlaceholder: "Nhập số vật liệu",
      status: "Trạng thái",
      statusPlaceholder: "Chọn trạng thái",
      originalBarcode: "Mã vạch sản phẩm gốc",
      originalBarcodePlaceholder: "Nhập mã vạch sản phẩm gốc",
      newBarcode: "Mã vạch sản phẩm mới",
      newBarcodePlaceholder: "Nhập mã vạch sản phẩm mới"
    },
    buttons: {
      search: "Tìm kiếm",
      reset: "Đặt lại",
      addMainRepair: "Thêm sửa chữa thành phẩm",
      addAuxiliaryRepair: "Thêm sửa chữa linh kiện",
      batchVoid: "Hủy hàng loạt",
      batchReview: "Duyệt hàng loạt",
      exportData: "Xuất dữ liệu",
      exporting: "Đang xuất",
      view: "Xem",
      viewProductDetails: "Xem chi tiết sản phẩm",
      review: "Duyệt",
      edit: "Sửa",
      void: "Hủy",
      cancel: "Hủy",
      confirm: "Xác nhận"
    },
    table: {
      title: "Danh sách bản ghi sửa chữa",
      productBarcode: "Mã vạch sản phẩm",
      productModel: "Mẫu sản phẩm",
      saleOrderNo: "Đơn hàng bán",
      productionOrderNo: "Đơn hàng sản xuất",
      workOrderNo: "Lệnh sản xuất",
      repairPerson: "Người báo cáo sửa chữa",
      repairTime: "Thời gian sửa chữa",
      businessType: "Loại hình kinh doanh",
      solution: "Phương án xử lý",
      defectDescription: "Hiện tượng bất thường",
      causeAnalysis: "Phân tích nguyên nhân",
      repairDescription: "Mô tả sửa chữa",
      reviewer: "Người duyệt",
      reviewTime: "Thời gian duyệt",
      productStatus: "Trạng thái sản phẩm",
      repairResult: "Kết quả sửa chữa",
      status: "Trạng thái",
      operation: "Thao tác",
      noData: "Không có dữ liệu"
    },
    operations: {
      view: "Xem",
      viewProductDetails: "Xem chi tiết sản phẩm",
      review: "Duyệt",
      edit: "Sửa",
      void: "Hủy"
    },
    status: {
      pendingReview: "Chờ duyệt",
      reviewed: "Đã duyệt",
      voided: "Đã hủy",
      repairing: "Đang sửa chữa",
      scrap: "Phế liệu"
    },
    repairResult: {
      qualified: "Đạt yêu cầu",
      unqualified: "Không đạt yêu cầu"
    },
    solutionOptions: {
      scrap: "Phế liệu",
      repair: "Sửa chữa",
      rework: "Làm lại"
    },
    lineTypes: {
      assembly: "Dây chuyền lắp ráp",
      smt: "Dây chuyền SMT",
      testing: "Dây chuyền kiểm tra",
      packaging: "Dây chuyền đóng gói",
      other: "Khác"
    },
    productStatus: {
      normal: "Bình thường",
      repairing: "Đang sửa chữa",
      scrap: "Phế liệu"
    },
    dialogs: {
      review: "Duyệt",
      batchReview: "Duyệt hàng loạt",
      repairResult: "Kết quả sửa chữa",
      adverseEffect: "Đánh giá tác động bất lợi",
      adverseEffectPlaceholder: "Nhập đánh giá tác động bất lợi",
      cancel: "Hủy",
      confirm: "Xác nhận",
      exportProgress: "Tiến độ xuất",
      exportComplete: "Xuất hoàn thành",
      exporting: "Đang xuất dữ liệu, vui lòng đợi..."
    },
    processFlow: {
      title: "Chi tiết quy trình công nghệ",
      processFlowTitle: "Quy trình công nghệ",
      mainProductInfo: "Thông tin sản phẩm chính",
      productBarcode: "Mã vạch sản phẩm：",
      materialName: "Tên vật liệu：",
      materialCode: "Mã vật liệu：",
      workOrderNo: "Số lệnh：",
      processSteps: "Các bước công nghệ",
      stepName: "Tên bước",
      stepStatus: "Trạng thái bước",
      completionTime: "Thời gian hoàn thành",
      operator: "Người vận hành",
      materials: "Thông tin vật liệu",
      materialType: "Loại vật liệu",
      scanStatus: "Trạng thái quét",
      scanTime: "Thời gian quét"
    },
    messages: {
      // 基础操作消息
      getDataFailed: "Lấy dữ liệu thất bại",
      deleteSuccess: "Xóa thành công",
      deleteFailed: "Xóa thất bại",
      deleteConfirm:
        "Thao tác này sẽ xóa vĩnh viễn bản ghi, có tiếp tục không?",
      deleteCancel: "Đã hủy xóa",
      exportSuccess: "Xuất thành công",
      exportFailed: "Xuất thất bại",
      noRecordsFound: "Không tìm thấy bản ghi sửa chữa phù hợp với điều kiện",
      // 状态验证消息
      recordReviewedCannotEdit: "Bản ghi này đã được duyệt, không thể sửa!",
      recordReviewedCannotVoid: "Bản ghi này đã được duyệt, không thể hủy!",
      recordAlreadyReviewed: "Bản ghi này đã được duyệt",
      // 批量操作消息
      pleaseSelectRecordsToDelete: "Vui lòng chọn bản ghi cần xóa",
      selectedRecordsContainReviewed:
        "Các bản ghi đã chọn có chứa bản ghi đã duyệt, không thể xóa",
      pleaseSelectRecordsToReview: "Vui lòng chọn bản ghi cần duyệt",
      selectedRecordsContainInvalid:
        "Các bản ghi đã chọn có chứa bản ghi đã duyệt hoặc đã hủy, không thể duyệt hàng loạt",
      // 操作成功消息
      voidSuccess: "Hủy thành công",
      batchVoidSuccess: "Hủy hàng loạt thành công",
      reviewSuccess: "Duyệt thành công",
      scrapReviewSuccess: "Duyệt phế liệu thành công",
      batchReviewSuccessTemplate:
        "Duyệt hàng loạt thành công, đã xử lý {updatedCount} bản ghi, trong đó phế liệu {scrapCount} bản ghi",
      // 操作失败消息
      operationFailed: "Thao tác thất bại",
      reviewFailed: "Duyệt thất bại",
      batchVoidFailed: "Hủy hàng loạt thất bại, có thể chứa bản ghi đã duyệt",
      batchReviewFailed: "Duyệt hàng loạt thất bại",
      // 取消操作消息
      voidCancelled: "Đã hủy thao tác hủy",
      // 验证消息
      pleaseSelectRepairResult: "Vui lòng chọn kết quả sửa chữa",
      nonScrapRecordsNeedResult:
        "Bản ghi sửa chữa không phải phế liệu cần chọn kết quả sửa chữa",
      // 产品详情消息
      getProductDetailsFailed: "Lấy chi tiết sản phẩm thất bại"
    },
    dialogs: {
      review: "Duyệt",
      batchReview: "Duyệt hàng loạt",
      exportProgress: "Tiến độ xuất",
      processFlowDetails: "Chi tiết quy trình công nghệ",
      mainProductInfo: "Thông tin sản phẩm chính",
      productBarcode: "Mã vạch sản phẩm：",
      materialName: "Tên vật liệu：",
      materialSpec: "Quy cách vật liệu：",
      exportComplete: "Xuất hoàn thành",
      exportingData: "Đang xuất dữ liệu, vui lòng đợi...",
      repairResult: "Kết quả sửa chữa",
      adverseEffect: "Đánh giá tác động bất lợi",
      adverseEffectPlaceholder: "Vui lòng nhập đánh giá tác động bất lợi",
      voidConfirm: "Xác nhận hủy bản ghi sửa chữa sản phẩm này?",
      deleteConfirm: "Xác nhận xóa bản ghi sửa chữa sản phẩm này?",
      batchVoidConfirm: "Xác nhận hủy {count} bản ghi đã chọn?",
      hint: "Gợi ý",
      confirm: "Xác nhận",
      cancel: "Hủy"
    },
    processFlow: {
      processFlowTitle: "Quy trình công nghệ",
      specModel: "Quy cách mẫu：",
      overallProgress: "Tiến độ tổng thể：",
      currentStatus: "Trạng thái hiện tại：",
      detailTabs: "Tab chi tiết",
      processInfo: "Thông tin công đoạn",
      materialInfo: "Thông tin vật liệu",
      materialBarcodeInfo: "Thông tin mã vạch vật liệu",
      inspectionInfo: "Thông tin kiểm tra",
      unbindInfo: "Thông tin hủy ràng buộc"
    }
  },

  // 产品维修编辑对话框
  editDialog: {
    titles: {
      create: "Thêm bản ghi sửa chữa",
      edit: "Sửa bản ghi sửa chữa",
      view: "Xem bản ghi sửa chữa"
    },
    form: {
      barcode: "Mã vạch sản phẩm",
      barcodePlaceholder: "Vui lòng quét mã vạch sản phẩm",
      confirm: "Xác nhận",
      solution: "Phương án xử lý",
      solutionPlaceholder: "Chọn phương án xử lý",
      defectDescription: "Hiện tượng bất thường",
      defectDescriptionPlaceholder: "Mô tả hiện tượng bất thường",
      materialNumber: "Mã sản phẩm",
      materialNumberPlaceholder: "Nhập mã sản phẩm",
      materialName: "Tên sản phẩm",
      materialNamePlaceholder: "Nhập tên sản phẩm",
      materialSpec: "Mẫu sản phẩm",
      materialSpecPlaceholder: "Nhập mẫu sản phẩm",
      workOrderNo: "Lệnh sản xuất",
      workOrderNoPlaceholder: "Nhập lệnh sản xuất",
      businessType: "Loại hình kinh doanh",
      businessTypePlaceholder: "Chọn loại hình kinh doanh",
      causeAnalysis: "Phân tích nguyên nhân",
      causeAnalysisPlaceholder: "Nhập phân tích nguyên nhân",
      repairDescription: "Mô tả sửa chữa",
      repairDescriptionPlaceholder: "Nhập mô tả sửa chữa",
      repairResult: "Kết quả duyệt",
      adverseEffect: "Đánh giá tác động bất lợi",
      adverseEffectPlaceholder: "Nhập đánh giá tác động bất lợi",
      status: "Trạng thái",
      statusPlaceholder: "Chọn trạng thái",
      remark: "Ghi chú",
      remarkPlaceholder: "Nhập thông tin ghi chú",
      barcodeList: "Danh sách mã vạch",
      scannedCount: "Số lượng mã vạch đã quét",
      serialNumber: "Số thứ tự",
      productBarcode: "Mã vạch sản phẩm",
      operation: "Thao tác",
      delete: "Xóa"
    },
    buttons: {
      saveAndSubmit: "Lưu và gửi",
      cancel: "Hủy"
    },
    form: {
      confirm: "Xác nhận",
      defectDescription: "Hiện tượng bất thường",
      defectDescriptionPlaceholder: "Vui lòng mô tả hiện tượng bất thường",
      materialNumber: "Mã sản phẩm",
      materialNumberPlaceholder: "Vui lòng nhập mã sản phẩm",
      materialName: "Tên sản phẩm",
      materialNamePlaceholder: "Vui lòng nhập tên sản phẩm",
      materialSpec: "Mẫu sản phẩm",
      materialSpecPlaceholder: "Vui lòng nhập mẫu sản phẩm",
      workOrderNo: "Lệnh sản xuất",
      workOrderNoPlaceholder: "Vui lòng nhập lệnh sản xuất",
      businessType: "Loại hình kinh doanh",
      businessTypePlaceholder: "Vui lòng chọn loại hình kinh doanh",
      causeAnalysis: "Phân tích nguyên nhân",
      causeAnalysisPlaceholder: "Vui lòng nhập phân tích nguyên nhân",
      repairDescription: "Mô tả sửa chữa",
      repairDescriptionPlaceholder: "Vui lòng nhập mô tả sửa chữa",
      repairResult: "Kết quả duyệt",
      solution: "Phương án xử lý",
      solutionPlaceholder: "Vui lòng chọn phương án xử lý",
      adverseEffect: "Đánh giá tác động bất lợi",
      adverseEffectPlaceholder: "Vui lòng nhập đánh giá tác động bất lợi",
      status: "Trạng thái",
      statusPlaceholder: "Vui lòng chọn trạng thái",
      remark: "Ghi chú",
      remarkPlaceholder: "Vui lòng nhập thông tin ghi chú",
      barcodeList: "Danh sách mã vạch",
      scannedCount: "Số lượng mã vạch đã quét",
      serialNumber: "Số thứ tự",
      productBarcode: "Mã vạch sản phẩm",
      operation: "Thao tác",
      delete: "Xóa"
    },
    tips: {
      componentReplacementTitle: "Lời nhắc thay thế linh kiện",
      componentReplacementContent:
        "Khi chọn phương án thay thế linh kiện, vui lòng đảm bảo đã chuẩn bị sẵn linh kiện thay thế tương ứng và ghi lại thông tin linh kiện được thay thế."
    },
    messages: {
      scanBarcodeWarning: "Vui lòng quét mã vạch sản phẩm trước",
      noDataFound: "Không tìm thấy dữ liệu liên quan",
      searchFailed: "Tìm kiếm thất bại",
      maxBarcodeLimit: "Tối đa chỉ có thể quét 100 mã vạch",
      barcodeExists: "Mã vạch này đã tồn tại",
      scanSuccess: "Quét thành công",
      atLeastOneBarcodeRequired: "Vui lòng quét ít nhất một mã vạch sản phẩm",
      submitFailed: "Gửi thất bại"
    },
    validation: {
      barcodeRequired: "Vui lòng quét ít nhất một mã vạch sản phẩm",
      materialSpecRequired: "Vui lòng nhập mẫu sản phẩm",
      batchNumberRequired: "Vui lòng nhập số lô sản xuất",
      defectDescriptionRequired: "Vui lòng mô tả hiện tượng bất thường",
      solutionRequired: "Vui lòng chọn phương án xử lý",
      statusRequired: "Vui lòng chọn trạng thái"
    }
  },

  // 托盘组装页面
  palletAssembly: {
    // 页面标题和标签
    title: "Thao tác lắp ráp pallet",
    palletCode: "Mã pallet",
    palletCodePlaceholder: "Vui lòng nhập hoặc quét mã pallet",
    confirmPallet: "Xác nhận pallet",
    unifiedScan: "Quét thống nhất",
    unifiedScanPlaceholder:
      "Vui lòng quét mã vạch (thành phẩm/hộp đóng gói/vật liệu phụ)",
    processScan: "Xử lý quét",
    resetPage: "Đặt lại trang",
    forceComplete: "Hoàn thành bắt buộc",

    // 托盘信息标签
    palletInfo: {
      palletNumber: "Số pallet",
      palletStatus: "Trạng thái pallet",
      currentCount: "Số lượng hiện tại",
      totalQuantity: "Tổng số lượng",
      remaining: "Còn lại",
      productLine: "Dây chuyền",
      materialInfo: "Thông tin vật liệu",
      orderInfo: "Thông tin đơn hàng",
      workOrderInfo: "Thông tin lệnh sản xuất",
      notSet: "Chưa thiết lập"
    },

    // 托盘状态
    status: {
      stacked: "Hoàn thành xếp pallet",
      stacking: "Đang xếp pallet"
    },

    // 分隔线标题
    sections: {
      scanAndStatus: "Quét mã vạch và trạng thái"
    },

    // 按钮文本
    buttons: {
      confirmPallet: "Xác nhận pallet",
      processScan: "Xử lý quét",
      resetPage: "Đặt lại trang",
      forceComplete: "Hoàn thành bắt buộc"
    },

    // 验证规则
    validation: {
      palletCodeRequired: "Vui lòng nhập mã pallet"
    },

    // 消息提示
    messages: {
      // 输入验证消息
      enterPalletCode: "Vui lòng nhập mã pallet",
      enterOrScanBarcode: "Vui lòng nhập hoặc quét mã vạch",
      selectPrintTemplate: "Vui lòng chọn mẫu in trước",
      validatePalletFirst: "Vui lòng xác thực mã pallet trước",

      // 工单相关消息
      workOrderNotFound: "Không tìm thấy lệnh sản xuất {workOrderNo}",
      workOrderNoMaterial:
        "Lệnh sản xuất chưa liên kết thông tin vật liệu chính",
      materialNoCraft: "Vật liệu {materialName} chưa cấu hình công nghệ",
      materialNoProcess:
        "Vật liệu {materialName} chưa cấu hình quy trình liên quan đến pallet (như loại F)",
      workOrderInfoSuccess:
        "Lấy thông tin lệnh sản xuất và vật liệu phụ thành công, vui lòng bắt đầu quét",
      noSubMaterialRequired:
        "Quy trình hiện tại không cần quét thêm vật liệu phụ, vui lòng quét trực tiếp vật liệu chính",
      workOrderInfoFailed:
        "Lấy thông tin lệnh sản xuất/quy trình/vật liệu phụ thất bại",
      palletNoWorkOrder:
        "Pallet chưa liên kết lệnh sản xuất, có thể không lấy được yêu cầu vật liệu phụ",

      // 托盘验证消息
      palletInfoSuccess:
        "Lấy thông tin pallet thành công, vui lòng bắt đầu quét",
      palletNotFound: "Không tìm thấy pallet được chỉ định",
      palletValidationFailed: "Xác thực mã pallet thất bại",
      palletCompleted:
        "Pallet này đã hoàn thành xếp, không thể tiếp tục thêm mã vạch",
      palletCompletedCannotAdd:
        "Pallet này đã hoàn thành xếp, không thể tiếp tục thêm",

      // 条码规则相关消息
      noBarcodeRules:
        "Không tìm thấy quy tắc mã vạch áp dụng cho vật liệu hiện tại, sẽ sử dụng logic khớp cơ bản.",
      barcodeRulesLoadFailed: "Lấy quy tắc mã vạch thất bại",
      noBarcodeRulesLoaded:
        "Chưa tải quy tắc mã vạch, sẽ thử khớp trực tiếp mã vật liệu.",
      barcodeNotMatchRules:
        "Mã vạch này không phù hợp với bất kỳ quy tắc nào đã cấu hình, hoặc vật liệu được phân tích không khớp với quy trình hiện tại",
      barcodeValidationError: "Xảy ra lỗi trong quá trình xác thực mã vạch",
      barcodeNotMatchDirectly:
        "Mã vạch không khớp trực tiếp với bất kỳ mã vật liệu dự kiến nào (không có quy tắc).",

      // DI码验证消息
      diCodeNotExists: "Mã DI này không tồn tại trong hệ thống",
      diCodeNoMaterial: "Mã DI này chưa liên kết vật liệu hợp lệ",
      diCodeMaterialMismatch:
        "Vật liệu tương ứng với mã DI này không khớp với quy trình hiện tại",
      diCodeValidationFailed: "Xác thực mã DI thất bại",

      // 扫描相关消息
      mainMaterialScanned:
        "Vật liệu chính {materialName} ({barcode}) quét thành công (quy tắc: {ruleName})",
      subMaterialScanned:
        "Vật liệu phụ {materialName} ({barcode}) quét thành công (quy tắc: {ruleName})",
      barcodeAlreadyInPallet:
        "Mã vạch vật liệu chính {barcode} đã có trong danh sách pallet.",
      barcodeAlreadyScanned:
        "Mã vạch {barcode} đã được quét cho mục vật liệu khác",
      barcodeNotMatchExpected:
        "Mã vạch {barcode} (vật liệu: {materialCode}) không khớp với mục đang chờ quét hiện tại.",
      barcodeValidationFailed:
        "Xác thực mã vạch thất bại hoặc không khớp với vật liệu",

      // 包装箱相关消息
      packingProcessRequired:
        "Công nghệ hiện tại bao gồm quy trình đóng hộp, phải quét mã vạch hộp đóng gói.",
      palletUnbindError:
        "Mã vạch hiện tại {barcode} nên được đưa vào pallet {palletCode}",

      // 提交相关消息
      allMaterialsScanned: "Tất cả vật liệu đã được quét, chuẩn bị gửi...",
      barcodeAlreadyExists:
        "Mã vạch chính {barcode} đã tồn tại trong pallet này, nhóm quét này không gửi lại.",
      submittingData: "Đang gửi dữ liệu...",
      submitSuccess: "Mã vạch {barcode} và liên kết vật liệu phụ thành công",
      submitSuccessWithCount:
        "Mã vạch {barcode} và liên kết vật liệu phụ thành công (đã thêm {count} mã vạch)",
      submitFailed: "Gửi thất bại",
      palletCompleteSuccess: "Pallet đã hoàn thành xếp!",
      palletCompleteHandleFailed: "Xử lý hoàn thành xếp pallet thất bại",

      // 打印相关消息
      printTemplateSuccess: "Mẫu in đã được lưu vào local",
      printTemplateFailed: "Lưu mẫu in thất bại",
      printDataPrepareFailed: "Chuẩn bị dữ liệu in thất bại",

      // 其他消息
      clearBarcodeListConfirm: "Xác định xóa danh sách mã vạch đã quét?",
      barcodeListCleared: "Đã xóa danh sách mã vạch",
      unknownDate: "Không rõ",
      invalidDate: "Ngày không hợp lệ",
      unrecordedWorkshop: "Chưa ghi nhận xưởng sản xuất",
      unrecordedProductLine: "Chưa ghi nhận dây chuyền sản xuất",
      lastPallet: "Pallet cuối",

      // 扫描状态消息
      mainMaterialPending: "Chờ quét mã vạch vật liệu chính",
      subMaterialPending: "Chờ quét",
      noScanRequired: "Không cần quét"
    },

    // 条码列表
    barcodeList: {
      title: "Danh sách mã vạch đã quét ({count} mã)",
      clearList: "Xóa danh sách",
      serialNumber: "Số thứ tự",
      barcode: "Mã vạch",
      type: "Loại",
      singleProduct: "Sản phẩm đơn",
      packagingBox: "Hộp đóng gói",
      boxBarcode: "Mã vạch hộp",
      scanTime: "Thời gian quét"
    },

    // 操作提示
    operationTips: {
      title: "Gợi ý thao tác",
      description:
        "1. Quét mã pallet để xác nhận thông tin pallet 2. Quét mã vạch sản phẩm hoặc mã vạch hộp đóng gói 3. Hệ thống tự động gửi, không cần lưu thủ công"
    }
  },

  // 托盘条码校验页面
  palletBarcodeVerification: {
    // 页面标题和标签
    title: "Xác thực mã vạch pallet",

    // 托盘输入区域
    palletInput: {
      inputPrompt: "Vui lòng nhập số chứng từ pallet",
      placeholder: "Vui lòng quét số chứng từ pallet",
      loadPallet: "Tải pallet",
      scanTip:
        "Vui lòng hướng mã vạch chứng từ pallet vào súng quét, hoặc nhập số pallet trong ô nhập liệu rồi nhấn Enter"
    },

    // 已完成托盘
    completedPallets: {
      title: "Pallet đã hoàn thành"
    },

    // 托盘信息
    palletInfo: {
      title: "Thông tin pallet",
      changePallet: "Thay đổi pallet",
      palletCode: "Mã pallet",
      materialInfo: "Thông tin vật liệu",
      totalBarcodes: "Tổng số mã vạch",
      verifiedBarcodes: "Mã vạch đã xác thực",
      remainingBarcodes: "Mã vạch chưa xác thực",
      palletStatus: "Trạng thái xếp pallet",
      statusStacked: "Hoàn thành xếp pallet",
      statusStacking: "Đang xếp pallet"
    },

    // 条码扫描区域
    barcodeInput: {
      placeholder: "Vui lòng quét mã vạch hoặc nhập thủ công",
      verify: "Xác thực",
      scanTip:
        "Vui lòng hướng mã vạch vào súng quét, hoặc nhập mã vạch trong ô nhập liệu rồi nhấn Enter"
    },

    // 条码校验结果
    verificationResult: {
      processCompleted: "Quy trình đã hoàn thành",
      processIncomplete: "Quy trình chưa hoàn thành",
      barcodeInfo: "Thông tin cơ bản mã vạch",
      barcode: "Mã vạch",
      materialCode: "Mã vật liệu",
      materialName: "Tên vật liệu",
      status: "Trạng thái",
      completed: "Đã hoàn thành",
      incomplete: "Chưa hoàn thành",
      progress: "Tiến độ hoàn thành",

      // 节点统计
      nodeStatistics: {
        totalNodes: "Tổng số nút",
        completedNodes: "Đã hoàn thành",
        pendingNodes: "Chưa hoàn thành"
      },

      // 未完成节点列表
      pendingNodesList: {
        title: "Danh sách nút chưa hoàn thành",
        nodeName: "Tên nút",
        nodeType: "Loại nút",
        status: "Trạng thái"
      }
    },

    // 托盘条码列表
    barcodeList: {
      title: "Danh sách mã vạch pallet",
      allBarcodes: "Tất cả mã vạch",
      unverifiedBarcodes: "Mã vạch chờ xác thực",
      totalCount: "Tổng cộng {count} mã vạch",
      barcode: "Mã vạch",
      verificationStatus: "Trạng thái xác thực",
      verified: "Đã xác thực",
      unverified: "Chưa xác thực",
      processStatus: "Trạng thái quy trình",
      scanTime: "Thời gian quét"
    },

    // 状态映射
    status: {
      pending: "Chờ xử lý",
      inProgress: "Đang tiến hành",
      completed: "Đã hoàn thành",
      skipped: "Đã bỏ qua",
      error: "Lỗi",
      processCompleted: "Quy trình đã hoàn thành",
      processIncomplete: "Quy trình chưa hoàn thành"
    },

    // 节点类型
    nodeType: {
      processStep: "Quy trình",
      material: "Vật liệu"
    },

    // 消息提示
    messages: {
      // 输入验证消息
      enterPalletCode: "Vui lòng nhập số chứng từ pallet",
      enterBarcode: "Vui lòng nhập mã vạch",
      inputPalletPrompt: "Vui lòng nhập số chứng từ pallet ở bên dưới",

      // 托盘相关消息
      palletDataLoadSuccess: "Tải dữ liệu pallet thành công",
      palletDataNotFound: "Không tìm thấy dữ liệu pallet",
      unknownMaterial: "Vật liệu không xác định",

      // 条码校验消息
      barcodeNotInPallet: "Mã vạch này không tồn tại trong pallet hiện tại",
      barcodeCheckComplete: "Kiểm tra mã vạch hoàn thành",
      processNotComplete: "Quy trình chưa hoàn thành",
      allBarcodesVerified:
        "Tất cả mã vạch đã hoàn thành xác thực, xác thực pallet hoàn thành",

      // 系统消息
      systemError: "Lỗi hệ thống, vui lòng thử lại",
      queryFailed: "Truy vấn thất bại",

      // 加载状态
      loadingPalletData: "Đang tải dữ liệu pallet...",
      verifyingBarcode: "Đang xác thực mã vạch...",

      // 日期格式化
      noData: "Chưa có dữ liệu",
      invalidDate: "Ngày không hợp lệ"
    }
  },

  // StatusPopup组件
  statusPopup: {
    // 错误消息映射
    errorMessages: {
      diCodeNotExists: "Mã DI này không tồn tại trong hệ thống",
      diCodeNoMaterial: "Mã DI này không liên kết với vật liệu hợp lệ",
      diCodeMaterialMismatch:
        "Vật liệu tương ứng với mã DI này không khớp với quy trình hiện tại",
      barcodeRuleMismatch:
        "Mã vạch này không phù hợp với bất kỳ quy tắc nào đã cấu hình hoặc vật liệu không khớp",
      mainBarcodeNotFound:
        "Không tìm thấy bản ghi quy trình mã vạch chính tương ứng",
      processNodeNotFound: "Không tìm thấy nút quy trình tương ứng",
      processNodeCompleted:
        "Nút quy trình đã hoàn thành hoặc ở trạng thái bất thường",
      repairRecordExists: "Mã vạch này có bản ghi sửa chữa chưa hoàn thành",
      repairResultFailed:
        "Mã vạch này đã hoàn thành sửa chữa, nhưng kết quả sửa chữa không đạt",
      barcodeVoided: "Mã vạch này đã bị hủy",
      barcodeMaterialMismatch: "Mã vạch không khớp với vật liệu chính",
      duplicateBarcode: "Quét mã trùng lặp",
      prerequisiteIncomplete: "Tồn tại quy trình tiên quyết chưa hoàn thành",
      quantityMismatch: "Số lượng quét không phù hợp với yêu cầu",
      duplicateScan: "Tồn tại mã vạch quét trùng lặp",
      materialNotRequired:
        "Vật liệu không thuộc về vật liệu yêu cầu quét của quy trình hiện tại",
      batchLimitReached: "Mã vạch vật liệu lô đã đạt giới hạn số lần sử dụng",
      subMaterialNotFound:
        "Không tìm thấy bản ghi quy trình vật liệu phụ có mã vạch",
      subMaterialIncomplete:
        "Quy trình vật liệu phụ của mã vạch vật liệu này chưa hoàn thành",
      keyMaterialDuplicate: "Lỗi sử dụng trùng lặp vật liệu quan trọng",
      usedByOtherProcess: "Đã được sử dụng bởi quy trình khác",
      keyMaterialMainRequired:
        "Vật liệu quan trọng phải quét mã vạch chính trước",
      workOrderNotFound: "Không tìm thấy lệnh sản xuất",
      workOrderQuantityReached: "Lệnh sản xuất đã đạt số lượng kế hoạch",
      missingParameters: "Thiếu tham số cần thiết",
      materialCodeNotFound: "Không tìm thấy mã vật liệu",
      craftInfoNotFound:
        "Không tìm thấy thông tin công nghệ tương ứng với vật liệu",
      barcodeParameterEmpty: "Tham số mã vạch không được để trống",
      productionPlanNotFound:
        "Công nghệ thành phẩm không tìm thấy kế hoạch dây chuyền",
      validWorkOrderNotFound: "Không tìm thấy lệnh sản xuất dây chuyền hợp lệ",
      productBarcodeNotBound: "Mã vạch sản phẩm chưa ràng buộc lệnh sản xuất",
      workOrderMismatch:
        "Lệnh sản xuất dây chuyền hiện tại không nhất quán với lệnh sản xuất mã vạch sản phẩm",
      updateWorkOrderFailed: "Cập nhật số lượng đầu vào lệnh sản xuất thất bại",
      barcodeMaterialNotMatch: "Mã vạch và vật liệu không khớp",
      equipmentInfoNotFound: "Không tìm thấy thông tin thiết bị tương ứng",
      processInfoNotFound: "Không tìm thấy thông tin quy trình tương ứng",
      craftInfoNotFound2: "Không tìm thấy thông tin công nghệ tương ứng",
      materialInfoNotFound: "Không tìm thấy thông tin vật liệu tương ứng",
      materialNodeNotFound:
        "Không tìm thấy nút vật liệu được chỉ định hoặc nút vật liệu không thuộc quy trình được chỉ định",
      originalBarcodeMismatch: "Mã vạch vật liệu gốc không khớp",
      repairRecordNotFound:
        "Không tìm thấy bản ghi sửa chữa thay thế bộ phận tương ứng",
      newBarcodeType: "Loại vật liệu mã vạch mới",
      newBarcodeIncomplete: "Quy trình mã vạch mới chưa hoàn thành",
      newBarcodeValidationFailed: "Xác thực mã vạch mới thất bại",
      processDataValidationFailed: "Xác thực dữ liệu quy trình thất bại",
      createProcessRecordFailed: "Tạo bản ghi quy trình công nghệ thất bại",
      scanRequestFailed: "Xử lý yêu cầu quét thất bại",
      fixBarcodeDataFailed:
        "Sửa chữa dữ liệu bất thường mã vạch vật liệu thất bại",
      rfidBarcodeNotFound: "Không tìm thấy mã vạch tương ứng với thẻ RFID này"
    }
  },

  // 包装箱条码校验页面
  boxBarcodeVerification: {
    title: "Xác minh mã vạch thùng đóng gói",
    form: {
      boxBarcodeLabel: "Mã vạch thùng đóng gói:",
      boxBarcodePlaceholder: "Vui lòng quét hoặc nhập mã vạch thùng đóng gói"
    },
    buttons: {
      query: "Truy vấn",
      requery: "Truy vấn lại",
      export: "Xuất kết quả",
      retry: "Thử lại",
      skip: "Bỏ qua"
    },
    boxInfo: {
      title: "Thông tin thùng đóng gói",
      boxBarcode: "Mã vạch thùng đóng gói",
      materialCode: "Mã vật liệu",
      materialName: "Tên vật liệu",
      packingTime: "Thời gian đóng gói",
      productCount: "Số lượng sản phẩm"
    },
    progress: {
      title: "Tiến độ xác minh"
    },
    stats: {
      verified: "Xác minh thành công",
      failed: "Xác minh thất bại",
      pending: "Chờ xác minh"
    },
    scan: {
      title: "Quét mã vạch sản phẩm",
      placeholder: "Vui lòng quét mã vạch sản phẩm để xác minh",
      tips: "Vui lòng quét từng mã vạch sản phẩm để xác minh",
      allComplete: "Tất cả mã vạch sản phẩm đã được xác minh!"
    },
    productList: {
      title: "Danh sách mã vạch sản phẩm",
      index: "Số thứ tự",
      barcode: "Mã vạch sản phẩm",
      verifyTime: "Thời gian xác minh",
      actions: "Thao tác"
    },
    status: {
      verifySuccess: "Xác minh thành công",
      verifyFailed: "Xác minh thất bại",
      pending: "Chờ xác minh",
      userSkipped: "Người dùng bỏ qua xác minh"
    },
    messages: {
      pleaseInputBoxBarcode: "Vui lòng nhập mã vạch thùng đóng gói",
      boxBarcodeNotFound: "Không tìm thấy dữ liệu tương ứng với mã vạch thùng đóng gói này",
      boxDataLoadSuccess: "Tải dữ liệu thùng đóng gói thành công, có {count} mã vạch sản phẩm",
      boxQueryFailed: "Truy vấn thùng đóng gói thất bại",
      alreadyVerified: "Mã vạch sản phẩm này đã được xác minh",
      verifySuccess: "Xác minh thành công! Mã vạch sản phẩm có trong thùng đóng gói",
      verifyFailed: "Xác minh thất bại! Mã vạch sản phẩm không có trong thùng đóng gói này",
      verifyError: "Xảy ra lỗi trong quá trình xác minh",
      resetStatus: "Đã đặt lại trạng thái xác minh mã vạch",
      skipVerify: "Đã bỏ qua xác minh mã vạch",
      exportSuccess: "Kết quả xác minh đã được xuất"
    },
    export: {
      index: "Số thứ tự",
      barcode: "Mã vạch sản phẩm",
      status: "Trạng thái xác minh",
      verifyTime: "Thời gian xác minh",
      remark: "Ghi chú",
      filename: "Kết quả xác minh thùng đóng gói"
    },
    common: {
      unknown: "Không rõ"
    }
  }
};
