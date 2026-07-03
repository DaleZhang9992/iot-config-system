import { z } from "zod";

// AT指令参数验证
export function validateParamValue(
  param: {
    dataType: string;
    isRequired: boolean;
    minValue?: number | null;
    maxValue?: number | null;
    enumValues?: string | null;
    regexPattern?: string | null;
    regexHint?: string | null;
    step?: number | null;
  },
  value: string
): { valid: boolean; error?: string } {
  // 必填检查
  if (param.isRequired && (!value || value.trim() === "")) {
    return { valid: false, error: "此字段为必填项" };
  }

  // 空值且非必填，跳过后续验证
  if (!value || value.trim() === "") {
    return { valid: true };
  }

  const trimmed = value.trim();

  switch (param.dataType) {
    case "NUMBER": {
      const num = Number(trimmed);
      if (isNaN(num)) {
        return { valid: false, error: "请输入有效的数字" };
      }
      if (param.minValue !== null && param.minValue !== undefined && num < param.minValue) {
        return { valid: false, error: `最小值不能小于 ${param.minValue}` };
      }
      if (param.maxValue !== null && param.maxValue !== undefined && num > param.maxValue) {
        return { valid: false, error: `最大值不能大于 ${param.maxValue}` };
      }
      if (param.step !== null && param.step !== undefined && param.step > 0) {
        const remainder = (num - (param.minValue || 0)) % param.step;
        if (Math.abs(remainder) > 0.001) {
          return { valid: false, error: `步长必须为 ${param.step} 的倍数` };
        }
      }
      break;
    }

    case "ENUM": {
      if (param.enumValues) {
        const options = JSON.parse(param.enumValues) as string[];
        if (!options.includes(trimmed)) {
          return { valid: false, error: `值必须为以下之一：${options.join(", ")}` };
        }
      }
      break;
    }

    case "IP_ADDRESS": {
      const ipRegex =
        /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      const match = trimmed.match(ipRegex);
      if (!match) {
        return { valid: false, error: "请输入有效的IP地址" };
      }
      const parts = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseInt(match[4])];
      if (parts.some((p) => p < 0 || p > 255)) {
        return { valid: false, error: "IP地址每段范围：0-255" };
      }
      break;
    }

    case "HEX_STRING": {
      const hexRegex = /^[0-9A-Fa-f]+$/;
      if (!hexRegex.test(trimmed)) {
        return { valid: false, error: "请输入有效的十六进制字符串" };
      }
      break;
    }

    case "STRING": {
      if (param.regexPattern) {
        try {
          const regex = new RegExp(param.regexPattern);
          if (!regex.test(trimmed)) {
            return { valid: false, error: param.regexHint || "格式不正确" };
          }
        } catch {
          // regex invalid, skip
        }
      }
      break;
    }
  }

  return { valid: true };
}

// 批量验证所有参数
export function validateAllParams(
  params: Array<{
    id: string;
    paramKey: string;
    displayName: string;
    dataType: string;
    isRequired: boolean;
    minValue?: number | null;
    maxValue?: number | null;
    enumValues?: string | null;
    regexPattern?: string | null;
    regexHint?: string | null;
    step?: number | null;
  }>,
  values: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const param of params) {
    const value = values[param.paramKey] || "";
    const result = validateParamValue(param, value);
    if (!result.valid) {
      errors[param.paramKey] = result.error || "无效的值";
    }
  }

  return errors;
}
