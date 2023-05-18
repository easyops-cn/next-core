// https://github.com/microsoft/monaco-editor/blob/8270c45a385a180a53fd8ef8e3a189b1471100ed/src/basic-languages/javascript/javascript.ts
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { conf as tsConf, language as tsLanguage } from "./typescript.js";

export const conf = tsConf;

/** @type {monaco.languages.IMonarchLanguage} */
export const language = {
  // Set defaultToken to invalid to see what you do not tokenize yet
  defaultToken: "invalid",
  tokenPostfix: ".js",

  keywords: [
    "break",
    "case",
    "catch",
    "class",
    "continue",
    "const",
    "constructor",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "from",
    "function",
    "get",
    "if",
    "import",
    "in",
    "instanceof",
    "let",
    "new",
    "null",
    "return",
    "set",
    "static",
    "super",
    "switch",
    "symbol",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "undefined",
    "var",
    "void",
    "while",
    "with",
    "yield",
    "async",
    "await",
    "of",
  ],
  typeKeywords: [],
  controlKeywords: tsLanguage.controlKeywords.filter((k) => k !== "as"),

  operators: tsLanguage.operators,
  symbols: tsLanguage.symbols,
  escapes: tsLanguage.escapes,
  digits: tsLanguage.digits,
  octaldigits: tsLanguage.octaldigits,
  binarydigits: tsLanguage.binarydigits,
  hexdigits: tsLanguage.hexdigits,
  regexpctl: tsLanguage.regexpctl,
  regexpesc: tsLanguage.regexpesc,
  tokenizer: tsLanguage.tokenizer,
};

/**
 * Register the extended javascript language, with control keywords
 * highlighting supported.
 *
 * @param {string} languageId defaults to "javascript"
 */
export function register(languageId = "javascript") {
  monaco.languages.register({
    id: languageId,
    extensions: [".js", ".es6", ".jsx", ".mjs", ".cjs"],
    firstLine: "^#!.*\\bnode",
    filenames: ["jakefile"],
    aliases:
      languageId === "javascript"
        ? ["JavaScript", "javascript", "js"]
        : undefined,
    mimetypes: ["text/javascript"],
  });
  monaco.languages.setLanguageConfiguration(languageId, conf);
  monaco.languages.setMonarchTokensProvider(languageId, language);
}
