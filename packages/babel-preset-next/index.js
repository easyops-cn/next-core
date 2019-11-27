// Ref https://babeljs.io/docs/en/presets#creating-a-preset
const presetEnv = require("@babel/preset-env");
const presetReact = require("@babel/preset-react");
const presetTypescript = require("@babel/preset-typescript");
const antdImport = require("babel-plugin-import");
const proposalDecorators = require("@babel/plugin-proposal-decorators");
const proposalClassProperties = require("@babel/plugin-proposal-class-properties");
const proposalUnicodePropertyRegex = require("@babel/plugin-proposal-unicode-property-regex");

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
      proposalClassProperties,
      proposalUnicodePropertyRegex
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
      proposalClassProperties,
      proposalUnicodePropertyRegex
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
