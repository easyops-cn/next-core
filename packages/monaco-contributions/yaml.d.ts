import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

export const conf: monaco.languages.LanguageConfiguration;
export const language: monaco.languages.IMonarchLanguage;

/**
 * Register the extended yaml language, with Brick Next expression syntax
 * highlighting supported.
 *
 * @param {string} languageId defaults to "yaml"
 */
export function register(languageId?: string): void;
