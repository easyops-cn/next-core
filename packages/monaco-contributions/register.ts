// https://microsoft.github.io/monaco-editor/playground.html?source=v0.37.1#example-extending-language-services-custom-languages
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { conf as confYaml, language as languageYaml } from "./nextYaml";
import { conf as confJs, language as languageJs } from "./nextJs";
import { conf as confTs, language as languageTs } from "./nextTs";

monaco.languages.register({
  id: "yaml",
  extensions: [".yaml", ".yml"],
  aliases: ["YAML", "yaml", "YML", "yml"],
  mimetypes: ["application/x-yaml", "text/x-yaml"],
});
monaco.languages.setLanguageConfiguration("yaml", confYaml);
monaco.languages.setMonarchTokensProvider("yaml", languageYaml);

monaco.languages.register({
  id: "javascript",
  extensions: [".js", ".es6", ".jsx", ".mjs", ".cjs"],
  firstLine: "^#!.*\\bnode",
  filenames: ["jakefile"],
  aliases: ["JavaScript", "javascript", "js"],
  mimetypes: ["text/javascript"],
});
monaco.languages.setLanguageConfiguration("javascript", confJs);
monaco.languages.setMonarchTokensProvider("javascript", languageJs);

monaco.languages.register({
  id: "typescript",
  extensions: [".ts", ".tsx", ".cts", ".mts"],
  aliases: ["TypeScript", "ts", "typescript"],
  mimetypes: ["text/typescript"],
});
monaco.languages.setLanguageConfiguration("typescript", confTs);
monaco.languages.setMonarchTokensProvider("typescript", languageTs);
