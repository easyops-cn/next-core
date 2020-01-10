// Ref https://babeljs.io/docs/en/presets#creating-a-preset
const prismjsPlugin = require("babel-plugin-prismjs");

const prismjsPluginConfig = [
  prismjsPlugin,
  {
    languages: [
      "javascript",
      "css",
      "markup",
      "bash",
      "shell",
      "c",
      "git",
      "go",
      "ini",
      "java",
      "json",
      "php",
      "powershell",
      "python",
      "sql",
      "typescript",
      "vim",
      "yaml"
    ],
    plugins: ["line-numbers"],
    css: true
  }
];

module.exports = () => ({
  plugins: [prismjsPluginConfig]
});
