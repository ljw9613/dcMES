/**
 * 后端条码生成工具
 * 完整版本，支持所有映射和变换功能
 */

/**
 * 根据规则生成条码
 * @param {Object} rule - 条码规则对象
 * @param {Object} data - 生成条码所需的数据
 * @returns {Object} 生成的条码信息
 */
async function generateBarcodeFromRule(rule, data) {
  try {
    const segments = [];
    const displayValues = [];
    const basicPrintValues = [];
    const transformedValues = [];
    const transformedPrintValues = [];
    let hasTransform = false;

    // 遍历规则的每个段落
    for (const segment of rule.segments) {
      // 生成段落值
      const segmentResult = generateSegmentValue(segment, {
        date: new Date(),
        sequence: data.serialNumber,
        fieldValues: data,
      });

      // 保存段落明细
      segments.push({
        name: segment.name,
        value: segmentResult.basic,
        transformedValue: segmentResult.transformed,
        config: segment.config,
      });

      // 基础值处理
      let baseValue = segmentResult.basic;
      let displayValue = baseValue;
      let basicPrintValue = baseValue;

      // 展示条码（只在showPrefix/showSuffix为true或未定义时显示前缀后缀）
      if (segment.config.prefix) {
        displayValue = segment.config.prefix + displayValue;
      }
      if (segment.config.suffix) {
        displayValue = displayValue + segment.config.suffix;
      }
      displayValues.push(displayValue);

      // 基础打印条码（只在showPrefix/showSuffix为true时显示）
      if (segment.config.prefix && segment.config.showPrefix === true) {
        basicPrintValue = segment.config.prefix + basicPrintValue;
      }
      if (segment.config.suffix && segment.config.showSuffix === true) {
        basicPrintValue = basicPrintValue + segment.config.suffix;
      }
      basicPrintValues.push(basicPrintValue);

      // 转换值处理
      if (segmentResult.transformed) {
        hasTransform = true;
        let transformedBase = segmentResult.transformed;
        let transformedValue = transformedBase;
        let transformedPrintValue = transformedBase;

        // 转换后的展示条码（遵循相同的显示规则）
        if (segment.config.prefix) {
          transformedValue = segment.config.prefix + transformedValue;
        }
        if (segment.config.suffix) {
          transformedValue = transformedValue + segment.config.suffix;
        }
        transformedValues.push(transformedValue);

        // 转换后的打印条码（只在showPrefix/showSuffix为true时显示）
        if (segment.config.prefix && segment.config.showPrefix === true) {
          transformedPrintValue = segment.config.prefix + transformedPrintValue;
        }
        if (segment.config.suffix && segment.config.showSuffix === true) {
          transformedPrintValue = transformedPrintValue + segment.config.suffix;
        }
        transformedPrintValues.push(transformedPrintValue);
      } else {
        transformedValues.push(displayValue);
        transformedPrintValues.push(basicPrintValue);
      }
    }

    return {
      barcode: displayValues.join(""),
      printBarcode: basicPrintValues.join(""),
      transformedBarcode: hasTransform ? transformedValues.join("") : null,
      transformedPrintBarcode: hasTransform ? transformedPrintValues.join("") : null,
      segmentBreakdown: segments,
    };
  } catch (error) {
    console.error("生成条码失败:", error);
    throw new Error(`生成条码失败: ${error.message}`);
  }
}

/**
 * 生成段落值
 * @param {Object} segment - 段落配置
 * @param {Object} params - 参数
 * @returns {Object} 段落值
 */
function generateSegmentValue(segment, params) {
  let basic = "";
  let transformed = null;

  switch (segment.type) {
    case "constant":
      basic = segment.config.constantValue || "";
      if (segment.config.enableTransform && segment.config.transformValue) {
        transformed = segment.config.transformValue;
      }
      break;

    case "fieldMapping":
      basic = params.fieldValues[segment.config.mappingField] || "";
      // 应用字段映射规则
      if (segment.config.fieldMappings && segment.config.fieldMappings.length) {
        const mapping = segment.config.fieldMappings.find(
          (m) => m.value === basic
        );
        if (mapping) {
          basic = mapping.code;
        }
      }
      break;

    case "date":
      basic = formatDateWithMappings(params.date, segment.config);
      break;

    case "sequence":
      basic = formatSequenceWithPositionMapping(params.sequence, segment.config);
      break;

    default:
      basic = "";
  }

  return {
    basic,
    transformed,
  };
}

/**
 * 格式化日期并应用映射
 * @param {Date} date - 日期对象
 * @param {Object} config - 段落配置
 * @returns {string} 格式化后的日期字符串
 */
function formatDateWithMappings(date, config) {
  let value = formatDate(date, config.dateFormat);
  const dateFormat = config.dateFormat || '';

  // 解析日期格式，找出年月日的位置
  const yearPos = dateFormat.indexOf('YYYY');
  const monthPos = dateFormat.indexOf('MM');
  const dayPos = dateFormat.indexOf('DD');

  // 只有在格式中存在且有映射时才应用映射
  if (yearPos !== -1 && config.yearMappings && config.yearMappings.length) {
    const yearStr = value.substring(yearPos, yearPos + 4);
    const mapping = config.yearMappings.find(m => m.value === yearStr);
    if (mapping) {
      value = value.substring(0, yearPos) + mapping.code + value.substring(yearPos + 4);
    }
  }

  if (monthPos !== -1 && config.monthMappings && config.monthMappings.length) {
    const monthStr = value.substring(monthPos, monthPos + 2);
    const mapping = config.monthMappings.find(m => m.value === monthStr);
    if (mapping) {
      value = value.substring(0, monthPos) + mapping.code + value.substring(monthPos + 2);
    }
  }

  if (dayPos !== -1 && config.dayMappings && config.dayMappings.length) {
    const dayStr = value.substring(dayPos, dayPos + 2);
    const mapping = config.dayMappings.find(m => m.value === dayStr);
    if (mapping) {
      value = value.substring(0, dayPos) + mapping.code + value.substring(dayPos + 2);
    }
  }

  return value;
}

/**
 * 格式化序列号并应用位置映射
 * @param {number} sequence - 序列号
 * @param {Object} config - 配置
 * @returns {string} 格式化后的序列号
 */
function formatSequenceWithPositionMapping(sequence, config) {
  let value = String(sequence).padStart(config.length || 1, config.padChar || '0');

  // 应用数字映射
  if (config.numberMappings && config.numberMappings.length) {
    const chars = value.split('');
    config.numberMappings.forEach(mapping => {
      if (mapping.position && mapping.position <= chars.length) {
        const pos = mapping.position - 1; // 转换为0基索引
        if (chars[pos] === mapping.value) {
          chars[pos] = mapping.code;
        }
      }
    });
    value = chars.join('');
  }

  return value;
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {string} format - 日期格式
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format) {
  if (!format) return "";
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace(/YYYY/g, year)
    .replace(/YY/g, String(year).slice(-2))
    .replace(/MM/g, month)
    .replace(/DD/g, day)
    .replace(/HH/g, hour)
    .replace(/mm/g, minute)
    .replace(/ss/g, second);
}

/**
 * 格式化序列号（基础版本）
 * @param {number} sequence - 序列号
 * @param {Object} config - 配置
 * @param {string} lineNum - 产线编号（可选）
 * @returns {string} 格式化后的序列号
 */
function formatSequence(sequence, config, lineNum) {
  let value = sequence;
  
  // 如果有产线号且配置了按产线重置
  if (lineNum && config.resetByLine) {
    // 简化处理：产线号 + 序列号
    value = `${lineNum}${String(sequence).padStart(config.length || 6, '0')}`;
  } else {
    // 普通序列号
    value = String(sequence).padStart(config.length || 6, '0');
  }
  
  return value;
}

module.exports = {
  generateBarcodeFromRule,
  generateSegmentValue,
  formatDate,
  formatSequence,
  formatDateWithMappings,
  formatSequenceWithPositionMapping
}; 