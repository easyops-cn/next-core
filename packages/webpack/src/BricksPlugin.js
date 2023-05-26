const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

const pluginName = "BricksPlugin";

class BricksPlugin {
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
    });
  }
}

module.exports = BricksPlugin;
