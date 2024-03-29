import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

export const conf: monaco.languages.LanguageConfiguration;
export const language: monaco.languages.IMonarchLanguage;

/**
 * Register the extended html language, allow dots in tag name.
 *
 * @param {monaco} monaco Monaco
 * @param {string} languageId defaults to "html"
 */
export function register(monaco: monaco, languageId?: string): void;
