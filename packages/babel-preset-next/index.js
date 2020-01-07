// Ref https://babeljs.io/docs/en/presets#creating-a-preset
const presetEnv = require("@babel/preset-env");
const presetReact = require("@babel/preset-react");
const presetTypescript = require("@babel/preset-typescript");
const antdImport = require("babel-plugin-import");
const proposalDecorators = require("@babel/plugin-proposal-decorators");
const proposalNullishCoalescingOperator = require("@babel/plugin-proposal-nullish-coalescing-operator");
const proposalOptionalChaining = require("@babel/plugin-proposal-optional-chaining");
const proposalClassProperties = require("@babel/plugin-proposal-class-properties");
const proposalUnicodePropertyRegex = require("@babel/plugin-proposal-unicode-property-regex");
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

module.exports = () => {
  const envTest = {
    presets: [
      [
        presetEnv,
        {
          targets: {
            node: "current"
          }
        }
      ],
      presetReact,
      presetTypescript
    ],
    plugins: [
      [
        antdImport,
        {
          libraryName: "antd"
        }
      ],
      [
        proposalDecorators,
        {
          decoratorsBeforeExport: true
        }
      ],
      proposalNullishCoalescingOperator,
      proposalOptionalChaining,
      proposalClassProperties,
      proposalUnicodePropertyRegex,
      prismjsPluginConfig
    ]
  };

  const envOthers = {
    presets: [
      [
        presetEnv,
        {
          modules: false,
          useBuiltIns: "entry",
          corejs: {
            version: 3
          }
        }
      ],
      presetReact,
      presetTypescript
    ],
    plugins: [
      [
        proposalDecorators,
        {
          decoratorsBeforeExport: true
        }
      ],
      proposalNullishCoalescingOperator,
      proposalOptionalChaining,
      proposalClassProperties,
      proposalUnicodePropertyRegex,
      prismjsPluginConfig
    ]
  };

  return {
    env: {
      test: envTest,
      development: envOthers,
      production: envOthers
    }
  };
};
