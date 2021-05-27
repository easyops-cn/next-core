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

// https://babeljs.io/docs/en/plugins/#plugin-ordering
// > * Plugins run before Presets.
// > * Plugin ordering is first to last.
// > * Preset ordering is reversed (last to first).
const customPresetOfPluginsAfterTypescript = {
  plugins: [
    [
      proposalDecorators,
      {
        decoratorsBeforeExport: true,
      },
    ],
    proposalClassProperties,
  ],
};

module.exports = () => {
  const envTest = {
    presets: [
      [
        presetEnv,
        {
          targets: {
            node: "current",
          },
        },
      ],
      presetReact,
      customPresetOfPluginsAfterTypescript,
      [
        presetTypescript,
        {
          allowDeclareFields: true,
        },
      ],
    ],
    plugins: [
      [
        antdImport,
        {
          libraryName: "antd",
        },
      ],
      proposalNullishCoalescingOperator,
      proposalOptionalChaining,
      proposalUnicodePropertyRegex,
    ],
  };

  const envOthers = {
    presets: [
      [
        presetEnv,
        {
          modules: false,
          useBuiltIns: "entry",
          corejs: {
            version: 3,
          },
        },
      ],
      presetReact,
      customPresetOfPluginsAfterTypescript,
      [
        presetTypescript,
        {
          allowDeclareFields: true,
        },
      ],
    ],
    plugins: [
      proposalNullishCoalescingOperator,
      proposalOptionalChaining,
      proposalUnicodePropertyRegex,
    ],
  };

  return {
    env: {
      test: envTest,
      development: envOthers,
      production: envOthers,
    },
  };
};
