import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

export const conf: monaco.languages.LanguageConfiguration;
export const language: monaco.languages.IMonarchLanguage;

/**
 * Register the extended javascript language, with control keywords
 * highlighting supported.
 *
 * @param {string} languageId defaults to "javascript"
 */
export function register(languageId?: string): void;
