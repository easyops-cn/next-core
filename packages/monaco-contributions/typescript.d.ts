import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

export const conf: monaco.languages.LanguageConfiguration;
export const language: monaco.languages.IMonarchLanguage;

/**
 * Register the extended typescript language, with control keywords
 * highlighting supported.
 *
 * @param {monaco} monaco Monaco
 * @param {string} languageId defaults to "typescript"
 */
export function register(monaco: monaco, languageId?: string): void;
