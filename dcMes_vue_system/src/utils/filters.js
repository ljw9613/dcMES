// 通用去掉populate方法
export function adjustDataFormat(originalData) {
  // 创建一个新的对象，用于存储调整后的数据
  const adjustedData = {};

  // 遍历原始数据的键值对
  for (const key in originalData) {
    // 如果键是"merchantId"，则将其值替换为"_id"
    if (originalData[key] && originalData[key]._id) {
      adjustedData[key] = originalData[key]._id;
    } else {
      // 其他情况直接复制键值对到调整后的对象中
      adjustedData[key] = originalData[key];
    }
  }

  return adjustedData;
}
