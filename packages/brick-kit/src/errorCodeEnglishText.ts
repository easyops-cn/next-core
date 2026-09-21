import i18next from "i18next";
import { HttpResponseError } from "@next-core/brick-http";
import { errorCodeDictionary } from "./errorCodeDictionary";

/**
 * 英文态错误码文案兜底值。
 *
 * 词典未命中（后端新增码未同步）、响应无 `code` 字段、或无响应体时，
 * 英文态一律展示此文案，保证英文界面不泄漏后端中文 `error` 文案。
 */
const UNKNOWN_ERROR_TEXT = "Unknown error.";

/**
 * locale 规范化：去除空白 / 转小写 / 下划线转连字符 / 取主语言子标签。
 *
 * 平台容器 i18n 初始化已配置 `supportedLngs` + `nonExplicitSupportedLngs`，
 * 运行时 `i18next.language` 收敛为 `zh` / `en` 二值；此处规范化为防御性处理
 * （兼容历史版本或异常注入的 `en_US` / `EN-us` / 含空白值），零成本。
 */
export function normalizeLocale(lang: string | undefined): string {
  return (lang ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .split("-")[0];
}

function isEnglish(): boolean {
  return normalizeLocale(i18next.language) === "en";
}

/**
 * 英文态下按错误码查词典返回英文标识。
 *
 * @remarks
 *
 * 重复错误码取词典首条定义（生成期固定排序：cmdb_service 优先 → 组件名字典序），
 * 运行时不区分来源服务。非英文态返回 `undefined`（调用方回落原有 `error`/`msg` 逻辑，
 * 中文态行为完全不变）；英文态一切未命中返回 `Unknown error.`。
 *
 * @param error - HTTP 响应错误对象。
 *
 * @returns 英文标识 / 兜底文案 / undefined（非英文态）。
 */
export function errorCodeEnglishText(
  error: HttpResponseError
): string | undefined {
  if (!isEnglish()) {
    return undefined;
  }
  const json = error.responseJson;
  if (!json) {
    return UNKNOWN_ERROR_TEXT;
  }
  const code = typeof json.code === "number" ? json.code : Number(json.code);
  if (!Number.isFinite(code)) {
    return UNKNOWN_ERROR_TEXT;
  }
  const entry = errorCodeDictionary.get(code);
  return entry ? entry.text : UNKNOWN_ERROR_TEXT;
}

/**
 * 供 storyboard 表达式使用的错误码文案函数（全局变量 `ERROR_CODE_TEXT`）。
 *
 * @remarks
 *
 * 面向残留面页面（绕过框架错误出口、自行渲染响应字段的场景），使
 * `<% ERROR_CODE_TEXT(EVENT.detail?.responseJson) || EVENT.detail?.responseJson?.codeExplain %>`
 * 成为统一改法：非英文态返回 `undefined`（`||` 落回原有字段，中文态行为完全不变）；
 * 英文态返回词典英文标识，未命中/无码返回 `UNKNOWN_ERROR`。
 *
 * @param responseJson - 接口错误响应体（如 `EVENT.detail?.responseJson`）。
 *
 * @returns 英文标识 / 兜底文案 / undefined（非英文态）。
 */
export function errorCodeText(responseJson: any): string | undefined {
  if (!isEnglish()) {
    return undefined;
  }
  const code =
    typeof responseJson?.code === "number"
      ? responseJson.code
      : Number(responseJson?.code);
  if (!Number.isFinite(code)) {
    return UNKNOWN_ERROR_TEXT;
  }
  const entry = errorCodeDictionary.get(code);
  return entry ? entry.text : UNKNOWN_ERROR_TEXT;
}
