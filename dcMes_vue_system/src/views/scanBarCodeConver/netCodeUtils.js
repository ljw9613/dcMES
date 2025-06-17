/**
 * 配网码生成工具类
 * 根据客户PO和SN条码生成配网码
 */

/**
 * 生成配网码
 * @param {string} custPO - 客户PO号
 * @param {string} snBarcode - SN条码
 * @returns {string} 生成的配网码
 */
export function generateNetCode(custPO, snBarcode) {
  if (!custPO || !snBarcode) {
    throw new Error('客户PO和SN条码不能为空');
  }

  // daymoncode生成逻辑
  const daymoncode = generateDaymonCode();
  
  // identityCode生成逻辑  
  const identityCode = generateIdentityCode(custPO);
  
  // lst4code生成逻辑 - 从SN条码中提取
  const lst4code = snBarcode.slice(-4).padStart(4, '0');
  
  // 最终配网码 = daymoncode + identityCode + lst4code
  const netCode = daymoncode + identityCode + lst4code;
  
  return netCode;
}

/**
 * 生成daymoncode
 * 月份编码集合："1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C"
 * 以当前月为12月为例，取值为12-1=11对应index，取值编码集合里面的值就是"C"
 * 日期编码集合："1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "U", "V", "W", "X"
 * 以当前日为13号为例，取值为13-1=12对应index，取值日期编码集合里面的值就是"D"
 * daymoncode="CD"
 */
function generateDaymonCode() {
  const monthCodes = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C"];
  const dayCodes = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "U", "V", "W", "X"];
  
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth()返回0-11，需要+1
  const day = now.getDate();
  
  // 月份编码：当前月份-1作为index
  const monthCode = monthCodes[month - 1];
  
  // 日期编码：当前日期-1作为index  
  const dayCode = dayCodes[day - 1];
  
  return monthCode + dayCode;
}


/**
 * 生成identityCode
 * 根据客户PO号生成身份码
 * @param {string} custPO - 客户PO号
 * @returns {string} 6位身份码
 */
function generateIdentityCode(custPO) {
  // 32进制编码的集合
  const base32Codes = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
  
  if (!custPO) {
    return "000000"; // 如果没有PO号，返回默认值
  }
  
  // 从客户PO中提取数字部分进行计算
  // 假设从PO中提取一个数字，比如这里用 10025843 作为示例
  let number = 0;
  
  // 提取PO中的数字字符组成数字
  const digits = custPO.match(/\d+/g);
  if (digits && digits.length > 0) {
    // 取第一个连续的数字字符串
    number = parseInt(digits[0]) || 10025843; // 如果解析失败，使用默认值
  } else {
    // 如果没有数字，使用字符串哈希
    for (let i = 0; i < custPO.length; i++) {
      number += custPO.charCodeAt(i);
    }
  }
  
  console.log('用于计算的数字:', number);
  
  // 按照图片中的算法：递归除以32，取余数
  const remainders = [];
  let tempNumber = number;
  
  // 执行递归除法运算，收集余数
  while (tempNumber > 0) {
    const remainder = tempNumber % 32;
    remainders.push(remainder);
    tempNumber = Math.floor(tempNumber / 32);
    
    console.log(`${tempNumber * 32 + remainder}/32=${tempNumber}......${remainder}`);
  }
  
  console.log('余数的集合为:', remainders);
  
  // 余数数组倒序（从最高位开始）
  remainders.reverse();
  
  // 用余数作为index，从32进制编码集合中获取对应的字符
  let identityCode = '';
  for (let i = 0; i < remainders.length && i < 6; i++) {
    const index = remainders[i];
    identityCode += base32Codes[index];
  }
  
  // 如果生成的码位数不足6位，左边用'0'补齐
  identityCode = identityCode.padStart(6, '0');
  
  console.log('最终identityCode:', identityCode);
  
  return identityCode;
}

/**
 * 完整的配网码生成方法（包含SN处理）
 * @param {string} custPO - 客户PO号
 * @param {string} snBarcode - SN条码
 * @returns {string} 生成的配网码
 */
export function generateCompleteNetCode(custPO, snBarcode) {
  if (!custPO || !snBarcode) {
    throw new Error('客户PO和SN条码不能为空');
  }

  try {
    // daymoncode生成
    const daymoncode = generateDaymonCode();
    
    // identityCode基于客户PO生成
    const identityCode = generateIdentityCode(custPO);
    
    // lst4code从SN条码后4位获取
    const lst4code = snBarcode.slice(-4).padStart(4, '0');
    
    // 最终配网码组合
    const netCode = daymoncode + identityCode + lst4code;
    
    console.log('配网码生成详情:', {
      custPO,
      snBarcode,
      daymoncode,
      identityCode, 
      lst4code,
      netCode
    });
    
    return netCode;
    
  } catch (error) {
    console.error('配网码生成失败:', error);
    throw new Error('配网码生成失败: ' + error.message);
  }
}

/**
 * 验证配网码格式是否正确
 * @param {string} netCode - 要验证的配网码
 * @returns {boolean} 是否为有效的配网码格式
 */
export function validateNetCode(netCode) {
  if (!netCode || typeof netCode !== 'string') {
    return false;
  }
  
  // 根据生成规则验证配网码格式
  // daymoncode(2位) + identityCode(6位) + lst4code(4位) = 12位
  return netCode.length === 12;
}

/**
 * 解析配网码各部分
 * @param {string} netCode - 配网码
 * @returns {object} 解析后的各部分
 */
export function parseNetCode(netCode) {
  if (!validateNetCode(netCode)) {
    throw new Error('无效的配网码格式');
  }
  
  return {
    daymoncode: netCode.substring(0, 2),
    identityCode: netCode.substring(2, 8), 
    lst4code: netCode.substring(8, 12),
    fullCode: netCode
  };
}

/**
 * 测试配网码生成功能
 * @param {string} custPO - 测试用的客户PO号
 * @param {string} snBarcode - 测试用的SN条码
 */
export function testNetCodeGeneration(custPO = "10025843", snBarcode = "0001") {
  console.log('=== 配网码生成测试 ===');
  console.log('输入参数:', { custPO, snBarcode });
  
  try {
    // 先单独测试 identityCode 生成
    console.log('\n=== identityCode 生成测试 ===');
    const identityCode = generateIdentityCode(custPO);
    console.log('期望结果: 09HYVK');
    console.log('实际结果:', identityCode);
    console.log('是否匹配:', identityCode === '09HYVK');
    
    // 然后测试完整配网码生成
    const netCode = generateCompleteNetCode(custPO, snBarcode);
    const parsed = parseNetCode(netCode);
    
    console.log('\n=== 完整配网码生成结果 ===');
    console.log('完整配网码:', netCode);
    console.log('解析结果:', parsed);
    
    return {
      success: true,
      netCode,
      parsed,
      identityCodeMatch: identityCode === '09HYVK'
    };
  } catch (error) {
    console.error('测试失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 