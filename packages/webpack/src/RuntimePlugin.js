const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

const pluginName = "RuntimePlugin";

class RuntimePlugin {
  constructor(options) {
    this._options = options;
  }

  /**
   * @param {import("webpack").Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.afterPlugins.tap(pluginName, () => {
      new CopyPlugin({
        patterns: this._options.brickPackages.map((pkg) => ({
          from: path.join(require.resolve(`${pkg}/package.json`), "../dist"),
          to: path.join("bricks", pkg.split("/").pop(), "dist"),
          // Terser skip this file for minimization
          info: { minimized: true },
        })),
      }).apply(compiler);

      new webpack.DefinePlugin({
        BOOTSTRAP_DATA: JSON.stringify({
          brickPackages: this._options.brickPackages.map((pkg) =>
            require(`${pkg}/dist/bricks.json`)
          ),
        }),
      }).apply(compiler);

      new webpack.container.ModuleFederationPlugin({
        name: "demo-render-only",
        shared: {
          "@next-core/runtime": {
            singleton: true,
          },
        },
      }).apply(compiler);

      new webpack.IgnorePlugin({
        // - `esprima` and `buffer` are optional imported by `js-yaml`
        // we don't need them.
        resourceRegExp: /^(?:esprima|buffer)$/,
      }).apply(compiler);
    });
  }
}

module.exports = RuntimePlugin;
