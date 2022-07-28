// Ref https://babeljs.io/docs/en/presets#creating-a-preset
const presetEnv = require("@babel/preset-env");
const presetReact = require("@babel/preset-react");
const presetTypescript = require("@babel/preset-typescript");
const antdImport = require("babel-plugin-import");
const proposalDecorators = require("@babel/plugin-proposal-decorators");
const proposalClassProperties = require("@babel/plugin-proposal-class-properties");
const proposalPrivateMethods = require("@babel/plugin-proposal-private-methods");
const proposalNullishCoalescingOperator = require("@babel/plugin-proposal-nullish-coalescing-operator");
const proposalOptionalChaining = require("@babel/plugin-proposal-optional-chaining");
const proposalUnicodePropertyRegex = require("@babel/plugin-proposal-unicode-property-regex");
const transformRuntime = require("@babel/plugin-transform-runtime");

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
    [
      transformRuntime,
      {
        // https://github.com/babel/babel/issues/9454#issuecomment-460425922
        version: "7.14.8",
      },
    ],
  ],
};

module.exports = () => {
  const envFactory = (env) => ({
    presets: [
      [
        presetEnv,
        env === "test"
          ? {
              targets: {
                node: "current",
              },
            }
          : env === "commonjs"
          ? {
              targets: {
                node: "12",
              },
            }
          : {
              modules: false,
              useBuiltIns: "entry",
              corejs: {
                version: "3.24",
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
      env === "test" && [
        antdImport,
        {
          libraryName: "antd",
        },
      ],
      // Even though the three plugins below are included in @babel/preset-env,
      // but webpack@4 doesn't support these syntax.
      // See https://github.com/webpack/webpack/issues/10227
      // So we still put them here.
      // By the way, there is a possible workaround to specify resolutions of acorn@8,
      // See https://github.com/webpack/webpack/issues/10227#issuecomment-706752571
      proposalNullishCoalescingOperator,
      proposalOptionalChaining,
      proposalUnicodePropertyRegex,
    ].filter(Boolean),
  });

  return {
    env: Object.fromEntries(
      ["test", "development", "production", "commonjs"].map((env) => [
        env,
        envFactory(env),
      ])
    ),
  };
};
