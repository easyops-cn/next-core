#!/usr/bin/env node
/**
 * 错误码词典生成脚本（015 方案 §3.2/§3.6）
 *
 * 用法:
 *   node tools/gen-error-code-dictionary.cjs <errcodes.json> [<namespaces.json>]
 *
 * 输入:
 *   - errcodes.json:   后端组件错误码提取数据（唯一权威数据源）
 *   - namespaces.json: 组件 → 网关命名空间映射（可选，仅用于 manifest 审计）
 *
 * 输出（相对本脚本所在包的根目录）:
 *   - src/errorCodeDictionary.ts          运行时单级词典（生成物，勿手改）
 *   - tools/errorCodeDictionary.manifest.json  生成期审计清单（词条数/冲突报告/命名空间映射/Rust∩Go 交集/源 md5）
 *
 * 规则（015 方案 v4/v5，产品决策「重复码取首条定义」）:
 *   1. 固定排序: cmdb_service 优先，其余组件按名字典序——与错误码总表「基准+追加」编纂顺序一致，
 *      不依赖输入 JSON 键序/文件系统遍历序，任何环境产物逐字节一致
 *   2. 首条不覆盖: 后续同码重复项全部进入冲突报告，不参与展示
 *   3. 平台通用码（100000-100014）使用标准英文标识（对齐 Google API 错误模型命名），
 *      不从组件数据转写（避免 ErrUnAuthenticated 常量名转写出 ERR_UN_AUTHENTICATED 的偏差）
 *   4. Rust 组件内联码不入词典（撞码风险，如 400）；Rust∩Go 交集记入 manifest 供 CI 撞码检测
 */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PKG_ROOT = path.resolve(__dirname, "..");
const DICT_OUT = path.join(PKG_ROOT, "src", "errorCodeDictionary.ts");
const MANIFEST_OUT = path.join(PKG_ROOT, "tools", "errorCodeDictionary.manifest.json");

/** 平台通用码标准英文标识（各组件 gerr.NewCode 定义的英文风格版本） */
const PLATFORM_CODES = {
  100000: "ERR_INVALID_ARGUMENT",
  100001: "ERR_FAILED_PRECONDITION",
  100002: "ERR_OUT_OF_RANGE",
  100003: "ERR_UNAUTHENTICATED",
  100004: "ERR_PERMISSION_DENIED",
  100005: "ERR_NOT_FOUND",
  100006: "ERR_ABORTED",
  100007: "ERR_ALREADY_EXISTS",
  100008: "ERR_RESOURCE_EXHAUSTED",
  100009: "ERR_DATA_LOSS",
  100010: "ERR_UNKNOWN",
  100011: "ERR_INTERNAL",
  100012: "ERR_NOT_IMPLEMENTED",
  100013: "ERR_UNAVAILABLE",
  100014: "ERR_DEADLINE_EXCEEDED",
};

/** Rust∩Go 撞码白名单（已确认可接受，新增交集 CI 会失败） */
const RUST_GO_CLASH_WHITELIST = [400];

/**
 * 剔除码表：HTTP 状态码被复用为业务码的值（400/401/404/500 等），
 * 跨组件语义必然冲突（如 500 在 scheduler=工具异常、在 collectorProxy=未知错误），
 * 不入词典，运行时统一落 UNKNOWN_ERROR（更诚实）。
 * 已剔除: 500（实证冲突）。400/401/404 语义当前尚可接受，观察后再定。
 */
const EXCLUDED_CODES = [500];

/** 首条定义的组件排序: cmdb_service 最优先，其余按字典序 */
function componentOrder(a, b) {
  if (a === "cmdb_service") return -1;
  if (b === "cmdb_service") return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** CamelCase 常量名 → UPPER_SNAKE 英文标识 */
function camelToSnake(name) {
  return name
    .replace(/(.)([A-Z][a-z]+)/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toUpperCase();
}

function md5(text) {
  return crypto.createHash("md5").update(text, "utf8").digest("hex");
}

function main() {
  const errcodesPath = process.argv[2];
  const enTextsPath = process.argv[3];
  const namespacesPath = process.argv[4];
  if (!errcodesPath || !fs.existsSync(errcodesPath)) {
    console.error("用法: node tools/gen-error-code-dictionary.cjs <errcodes.json> [<en-texts.json>] [<namespaces.json>]");
    process.exit(1);
  }
  const raw = fs.readFileSync(errcodesPath, "utf8");
  const data = JSON.parse(raw);
  const nsMap = namespacesPath && fs.existsSync(namespacesPath)
    ? JSON.parse(fs.readFileSync(namespacesPath, "utf8"))
    : {};
  // 英文文案数据源（code -> { en }），缺失的码回落显示 KEY
  const enTexts = enTextsPath && fs.existsSync(enTextsPath)
    ? JSON.parse(fs.readFileSync(enTextsPath, "utf8"))
    : {};

  // 按固定排序收集 Go 组件与 Rust 组件
  const goComps = Object.keys(data)
    .filter((c) => data[c].status === "ok" && data[c].lang === "go")
    .sort(componentOrder);
  const rustComps = Object.keys(data)
    .filter((c) => data[c].status === "ok" && data[c].lang === "rust")
    .sort();

  // ---- 生成词典（首条不覆盖）----
  const dictionary = new Map();
  const conflicts = [];
  const adoptedFrom = new Map(); // code -> 组件

  const textOf = (code, key) => {
    const t = enTexts[String(code)];
    return t && t.en ? t.en : key; // 无英文文案时回落 KEY（不空白）
  };

  // 平台通用码先行（标准标识，优先级高于任何组件定义）
  for (const [code, ident] of Object.entries(PLATFORM_CODES)) {
    dictionary.set(Number(code), [ident, textOf(Number(code), ident)]);
    adoptedFrom.set(Number(code), "platform");
  }

  for (const comp of goComps) {
    const codes = data[comp].codes || {};
    for (const codeKey of Object.keys(codes)) {
      const code = Number(codeKey);
      const english = camelToSnake(codes[codeKey].var);
      if (EXCLUDED_CODES.includes(code)) {
        continue; // HTTP 状态码复用值，语义跨组件冲突，不入词典
      }
      if (dictionary.has(code)) {
        conflicts.push({
          code,
          component: comp,
          englishName: english,
          adoptedComponent: adoptedFrom.get(code),
          adoptedEnglishName: dictionary.get(code)[0],
        });
      } else {
        dictionary.set(code, [english, textOf(code, english)]);
        adoptedFrom.set(code, comp);
      }
    }
  }

  // ---- Rust∩Go 撞码检测（审计数据，Rust 码不入词典）----
  const goCodeSet = new Set(goComps.flatMap((c) => Object.keys(data[c].codes || {}).map(Number)));
  const rustCodes = new Map();
  for (const comp of rustComps) {
    for (const codeKey of Object.keys(data[comp].codes || {})) {
      rustCodes.set(Number(codeKey), comp);
    }
  }
  const rustGoClash = [...rustCodes.keys()]
    .filter((code) => goCodeSet.has(code))
    .sort((a, b) => a - b)
    .map((code) => ({
      code,
      rustComponent: rustCodes.get(code),
      goIdentifiers: goComps
        .filter((c) => data[c].codes && data[c].codes[String(code)])
        .map((c) => `${c}:${camelToSnake(data[c].codes[String(code)].var)}`),
    }));
  const newClash = rustGoClash.filter(
    (c) => !RUST_GO_CLASH_WHITELIST.includes(c.code)
  );
  if (newClash.length > 0) {
    console.error("❌ 发现白名单之外的 Rust∩Go 撞码（需人工确认后更新白名单或推动后端消歧）:");
    for (const c of newClash) {
      console.error(`   ${c.code}: rust=${c.rustComponent}, go=[${c.goIdentifiers.join(", ")}]`);
    }
    process.exit(1);
  }

  // ---- 生成词典 TS ----
  const entries = [...dictionary.entries()].sort((a, b) => a[0] - b[0]);
  const tsLines = entries.map(
    ([code, [key, text]]) =>
      `  [${code}, { key: "${key}", text: ${JSON.stringify(text)} }],`
  );
  const ts = `/**
 * 错误码 → 英文标识词典（单级）。
 *
 * ⚠️ 本文件由 tools/gen-error-code-dictionary.cjs 自动生成，请勿手改。
 *
 * 数据源: errcodes.json (md5: ${md5(raw)})
 * 生成规则（015 方案 v4/v5，产品决策「重复码取首条定义」）:
 *   - 排序: cmdb_service 优先，其余组件按名字典序（硬编码，产物确定性）
 *   - 重复码取首条，后续定义进入冲突报告（见 tools/errorCodeDictionary.manifest.json）
 *   - 平台通用码（100000-100014）使用标准英文标识
 *   - Rust 组件内联码不入词典
 * 词条数: ${entries.length}
 * 冲突数: ${conflicts.length}
 */
export interface ErrorCodeEntry {
  /** 错误码常量名标识（UPPER_SNAKE） */
  key: string;
  /** 面向用户的英文文案（无翻译数据时回落为 key） */
  text: string;
}

export const errorCodeDictionary: ReadonlyMap<number, ErrorCodeEntry> = new Map([
${tsLines.join("\n")}
]);
`;
  fs.mkdirSync(path.dirname(DICT_OUT), { recursive: true });
  fs.writeFileSync(DICT_OUT, ts);

  // ---- 生成 manifest ----
  const manifest = {
    // 注意: 不含生成时间等非确定字段——verify 脚本靠逐字节比对，产物必须确定性
    source: {
      errcodes: {
        path: path.basename(errcodesPath),
        md5: md5(raw),
      },
      enTexts: enTextsPath
        ? { path: path.basename(enTextsPath), md5: md5(fs.readFileSync(enTextsPath, "utf8")) }
        : null,
      namespaces: namespacesPath
        ? { path: path.basename(namespacesPath), md5: md5(fs.readFileSync(namespacesPath, "utf8")) }
        : null,
    },
    entryCount: entries.length,
    platformCodeCount: Object.keys(PLATFORM_CODES).length,
    businessCodeCount: entries.length - Object.keys(PLATFORM_CODES).length,
    conflictCount: conflicts.length,
    conflicts,
    rustGoClash: {
      whitelist: RUST_GO_CLASH_WHITELIST,
      clashes: rustGoClash,
    },
    namespaceMap: Object.fromEntries(
      Object.keys(nsMap)
        .sort(componentOrder)
        .map((c) => [c, nsMap[c]])
    ),
    componentCounts: Object.fromEntries(
      goComps.map((c) => [c, Object.keys(data[c].codes || {}).length])
    ),
  };
  fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`✅ 生成 ${path.relative(PKG_ROOT, DICT_OUT)}: ${entries.length} 条（业务 ${manifest.businessCodeCount} + 平台 ${manifest.platformCodeCount}），冲突 ${conflicts.length} 条`);
  console.log(`✅ 生成 ${path.relative(PKG_ROOT, MANIFEST_OUT)}`);
}

main();
