// Ref https://babeljs.io/docs/en/presets#creating-a-preset
const presetEnv = require("@babel/preset-env");
const presetReact = require("@babel/preset-react");
const presetTypescript = require("@babel/preset-typescript");
const antdImport = require("babel-plugin-import");
const proposalDecorators = require("@babel/plugin-proposal-decorators");
const proposalClassProperties = require("@babel/plugin-proposal-class-properties");
const proposalPrivateMethods = require("@babel/plugin-proposal-private-methods");

// https://babeljs.io/docs/en/plugins/#plugin-ordering
// > * Plugins run before Presets.
// > * Plugin ordering is first to last.
// > * Preset ordering is reversed (last to first).
const customPresetOfPluginsAfterTypescript = {
  plugins: [
    // When enabling `allowDeclareFields` in @babel/preset-typescript,
    // we have to place plugins in certain order:
    // > TypeScript 'declare' fields must first be transformed by @babel/plugin-transform-typescript.
    // > If you have already enabled that plugin (or '@babel/preset-typescript'), make sure that it runs before any plugin related to additional class features:
    // >  - @babel/plugin-proposal-class-properties
    // >  - @babel/plugin-proposal-private-methods
    // >  - @babel/plugin-proposal-decorators
    [
      proposalDecorators,
      {
        decoratorsBeforeExport: true,
      },
    ],
    // Even though the two plugins are included in @babel/preset-env,
    // we have to place them here to ensure plugin ordering.
    proposalClassProperties,
    proposalPrivateMethods,
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
  };

  return {
    env: {
      test: envTest,
      development: envOthers,
      production: envOthers,
    },
  };
};
