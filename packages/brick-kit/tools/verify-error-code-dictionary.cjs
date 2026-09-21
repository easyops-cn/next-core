#!/usr/bin/env node
/**
 * 错误码词典 CI 门禁校验脚本（015 方案 §3.6 / §4.2）
 *
 * 用法:
 *   node tools/verify-error-code-dictionary.cjs <errcodes.json> [<namespaces.json>]
 *
 * 校验项:
 *   1. 重新生成产物与仓库内文件逐字节一致——防止「数据源更新了但词典没重新生成」
 *      或「有人手改了生成物」的漂移（生成脚本产物确定性，同输入必同输出）
 *   2. Rust∩Go 撞码白名单检测（由生成脚本内置执行，出现白名单外交集时本脚本同样失败）
 *
 * CI 集成: 在 packages/brick-kit 的 test:ci 之外独立执行，例如:
 *   node tools/verify-error-code-dictionary.cjs path/to/errcodes.json path/to/namespaces.json
 */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const PKG_ROOT = path.resolve(__dirname, "..");
const GEN_SCRIPT = path.join(__dirname, "gen-error-code-dictionary.cjs");
const ARTIFACTS = [
  path.join(PKG_ROOT, "src", "errorCodeDictionary.ts"),
  path.join(PKG_ROOT, "tools", "errorCodeDictionary.manifest.json"),
];

function md5(file) {
  return crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex");
}

function main() {
  const errcodesPath = process.argv[2];
  if (!errcodesPath || !fs.existsSync(errcodesPath)) {
    console.error(
      "用法: node tools/verify-error-code-dictionary.cjs <errcodes.json> [<namespaces.json>]"
    );
    process.exit(1);
  }
  const namespacesPath = process.argv[3];

  const missing = ARTIFACTS.filter((f) => !fs.existsSync(f));
  if (missing.length > 0) {
    console.error("❌ 词典产物缺失，请先运行生成脚本:");
    for (const f of missing) {
      console.error(`   ${path.relative(PKG_ROOT, f)}`);
    }
    process.exit(1);
  }

  // 记录仓库内产物的 md5 → 重跑生成 → 比对（生成产物确定性，无漂移则 md5 不变）
  const before = ARTIFACTS.map(md5);

  try {
    execFileSync(process.execPath, [
      GEN_SCRIPT,
      errcodesPath,
      ...(namespacesPath ? [namespacesPath] : []),
    ], { stdio: "inherit" });
  } catch (e) {
    // 生成脚本自身失败（如撞码白名单外交集）即校验失败
    console.error("❌ 生成脚本执行失败（见上方输出）");
    process.exit(1);
  }

  const after = ARTIFACTS.map(md5);
  let drifted = false;
  for (let i = 0; i < ARTIFACTS.length; i++) {
    if (before[i] !== after[i]) {
      drifted = true;
      console.error(
        `❌ ${path.relative(PKG_ROOT, ARTIFACTS[i])} 与数据源不一致（已重新生成，产物有变化）`
      );
      console.error(
        "   请提交重新生成后的词典产物: node tools/gen-error-code-dictionary.cjs <errcodes.json> [<namespaces.json>]"
      );
    }
  }
  if (drifted) {
    process.exit(1);
  }
  console.log("✅ 词典产物与数据源逐字节一致，撞码白名单校验通过");
}

main();
