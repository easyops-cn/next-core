import webpack from "webpack";

const pluginName = "EmitBricksJsonPlugin";

export default class EmitBricksJsonPlugin {
  /**
   * @param {{ packageName: string; bricks: string[] }} options
   */
  constructor(options) {
    this.packageName = options.packageName;
    this.bricks = options.bricks;
  }

  /**
   * @param {import("webpack").Compiler} compiler
   */
  apply(compiler) {
    // Ref https://github.com/jantimon/html-webpack-plugin/blob/d5ce5a8f2d12a2450a65ec51c285dd54e36cd921/index.js#L209
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tapAsync(
        {
          name: pluginName,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
        },
        (compilationAssets, callback) => {
          const assetFilePath = Object.keys(compilationAssets).find(
            (filePath) =>
              filePath.startsWith("index.") && filePath.endsWith(".js")
          );
          const jsFilePath =
            assetFilePath && `bricks/${this.packageName}/dist/${assetFilePath}`;

          const bricksJson = JSON.stringify(
            {
              bricks: this.bricks,
              filePath: jsFilePath,
            },
            null,
            2
          );

          compilation.emitAsset(
            "bricks.json",
            new webpack.sources.RawSource(bricksJson, false)
          );

          console.log("Defined bricks:", this.bricks);
          callback();
        }
      );
    });
  }
}
