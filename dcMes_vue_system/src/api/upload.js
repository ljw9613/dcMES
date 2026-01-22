import request from "@/utils/request";

/**
 * 上传检验记录图片
 * @param {Object} params - 上传参数
 * @param {File} params.image - 图片文件
 * @param {String} params.inspectionId - 检验记录ID
 * @param {String} params.barcode - 条码
 * @param {String} params.inspectionType - 检验类型
 * @param {String} params.userId - 用户ID
 * @param {String} params.remark - 备注
 * @param {String} params.filename - 自定义文件名 (可选)
 * @returns {Promise} - 请求结果
 */
export function uploadInspectionImage(params) {
  const formData = new FormData();
  
  // 添加图片文件 (如果提供了自定义文件名，则使用自定义文件名)
  if (params.filename && params.image instanceof Blob) {
    // 获取扩展名
    const originalFilename = params.image.name || '';
    const extension = originalFilename.split('.').pop() || 'jpg';
    
    // 创建新的文件对象，使用自定义文件名
    const customNamedFile = new File(
      [params.image], 
      `${params.filename}.${extension}`, 
      { type: params.image.type }
    );
    
    formData.append('image', customNamedFile);
  } else {
    formData.append('image', params.image);
  }
  
  // 添加其他参数
  if (params.inspectionId) {
    formData.append('inspectionId', params.inspectionId);
  }
  
  if (params.barcode) {
    formData.append('barcode', params.barcode);
  }
  
  if (params.inspectionType) {
    formData.append('inspectionType', params.inspectionType || 'sampling');
  }
  
  if (params.userId) {
    formData.append('userId', params.userId);
  }
  
  if (params.remark) {
    formData.append('remark', params.remark);
  }
  
  return request({
    url: '/uploadInspectionImage',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: formData
  });
}

/**
 * 上传MES文件
 * @param {Object} params - 上传参数
 * @param {File} params.file - 文件
 * @param {String} params.businessType - 业务类型
 * @param {String} params.category - 文件类别
 * @param {String} params.businessId - 业务ID
 * @param {String} params.userId - 用户ID
 * @param {String} params.remark - 备注
 * @returns {Promise} - 请求结果
 */
export function uploadMesFile(params) {
  const formData = new FormData();
  
  // 添加文件
  formData.append('file', params.file);
  
  // 添加其他参数
  if (params.businessType) {
    formData.append('businessType', params.businessType);
  }
  
  if (params.category) {
    formData.append('category', params.category);
  }
  
  if (params.businessId) {
    formData.append('businessId', params.businessId);
  }
  
  if (params.userId) {
    formData.append('userId', params.userId);
  }
  
  if (params.remark) {
    formData.append('remark', params.remark);
  }
  
  return request({
    url: '/uploadMesFile',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: formData
  });
} 