/**
 * 仅执行 barcodeRule.validationRules，不执行 extractionConfigs，也不比对物料。
 * 与 materialProcessFlowService.validateBarcodeWithRule 的校验段对齐，并兼容 schema 中的 type: regex。
 *
 * @param {string} barcode
 * @param {Object} rule - barcodeRule 文档（plain object 或 mongoose doc）
 * @returns {{ isValid: boolean, message?: string }}
 */
function validateBarcodeValidationRulesOnly(barcode, rule) {
  if (!barcode || typeof barcode !== "string") {
    return { isValid: false, message: "条码为空" };
  }
  if (!rule || typeof rule !== "object") {
    return { isValid: false, message: "规则无效" };
  }

  const list = rule.validationRules;
  if (!Array.isArray(list) || list.length === 0) {
    return { isValid: true };
  }

  for (const validationRule of list) {
    if (validationRule && validationRule.enabled === false) {
      continue;
    }
    const type = (validationRule && validationRule.type) || "";
    const p = (validationRule && validationRule.params) || {};

    switch (type) {
      case "length":
        if (p.length != null && barcode.length !== p.length) {
          return {
            isValid: false,
            message: `SN长度须为${p.length}`,
          };
        }
        break;

      case "prefix":
        if (p.expectedValue && !barcode.startsWith(p.expectedValue)) {
          return { isValid: false, message: "SN前缀不符合规则" };
        }
        break;

      case "pattern":
      case "regex":
        if (p.pattern) {
          try {
            const regex = new RegExp(p.pattern);
            if (!regex.test(barcode)) {
              return { isValid: false, message: "SN格式不符合规则（正则）" };
            }
          } catch (e) {
            return { isValid: false, message: "规则正则表达式无效" };
          }
        }
        break;

      case "substring":
        if (
          p.start !== undefined &&
          p.end !== undefined &&
          p.expectedValue !== undefined &&
          p.expectedValue !== null
        ) {
          const substring = barcode.substring(
            p.start,
            p.end !== undefined && p.end !== null ? p.end : undefined
          );
          if (substring !== String(p.expectedValue)) {
            return { isValid: false, message: "SN截取校验不通过" };
          }
        }
        break;

      default:
        break;
    }
  }

  return { isValid: true };
}

module.exports = { validateBarcodeValidationRulesOnly };
