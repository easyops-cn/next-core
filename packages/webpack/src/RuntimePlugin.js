const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

const pluginName = "RuntimePlugin";

const sharedSingletonPackages = [
  "history",
  "i18next",
  "lodash",
  "moment",
  "moment/locale/zh-cn.js",
  "js-yaml",
  "i18next-browser-languagedetector",
  "react-i18next",
  "@next-core/runtime",
  "@next-core/http",
  "@next-core/theme",
  "@next-core/cook",
  "@next-core/i18n",
  "@next-core/i18n/react",
  "@next-core/inject",
  "@next-core/loader",
  "@next-core/supply",
  "@next-core/utils/general",
  "@next-core/utils/storyboard",
];

const sharedPackages = [
  "react",
  "react-dom",
  "@next-core/element",
  "@next-core/react-element",
  "@next-core/react-runtime",
  ...sharedSingletonPackages,
];

class RuntimePlugin {
  constructor(options) {
    this._options = options;
  }

  /**
   * @param {import("webpack").Compiler} compiler
   */
  apply(compiler) {
    const {
      brickPackages,
      baseUrl = "/",
      moduleFederationShared,
      libName,
    } = this._options;
    if (moduleFederationShared !== false) {
      const shared = Object.fromEntries(
        sharedPackages.map((pkg) => {
          const customized = moduleFederationShared?.[pkg];
          if (typeof customized === "string") {
            return;
          }
          return [
            pkg,
            {
              singleton: sharedSingletonPackages.includes(pkg),
              ...customized,
            },
          ];
        })
      );
      new webpack.container.ModuleFederationPlugin({
        name: libName,
        shared: {
          ...moduleFederationShared,
          ...shared,
        },
      }).apply(compiler);
    }

    compiler.hooks.afterPlugins.tap(pluginName, () => {
      new CopyPlugin({
        patterns: brickPackages.map((pkg) => ({
          from: path.join(require.resolve(`${pkg}/package.json`), "../dist"),
          to: path.join("bricks", pkg.split("/").pop(), "dist"),
          // Terser skip this file for minimization
          info: { minimized: true },
        })),
      }).apply(compiler);

      const loadedBrickPackages = brickPackages.map((pkg) =>
        require(`${pkg}/dist/bricks.json`)
      );

      new webpack.DefinePlugin({
        BRICK_PACKAGES: JSON.stringify(
          baseUrl
            ? loadedBrickPackages.map((pkg) => ({
                ...pkg,
                filePath: `${baseUrl}${pkg.filePath}`,
              }))
            : loadedBrickPackages
        ),
      }).apply(compiler);

      new webpack.IgnorePlugin({
        // - `esprima` and `buffer` are optional imported by `js-yaml`
        // we don't need them.
        resourceRegExp: /^(?:esprima|buffer)$/,
      }).apply(compiler);

      new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh|en/).apply(
        compiler
      );
    });
  }
}

module.exports = RuntimePlugin;
