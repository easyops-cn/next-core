import webpack from "webpack";

const pluginName = "EmitBricksJsonPlugin";

export default class EmitBricksJsonPlugin {
  /**
   * @param {{ packageName: string; bricks: string[]; processors: string[]; dependencies: Record<string, string[]>; }} options
   */
  constructor(options) {
    this.packageName = options.packageName;
    this.bricks = options.bricks;
    this.elements = options.elements;
    this.processors = options.processors;
    this.dependencies = options.dependencies;
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
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        (compilationAssets, callback) => {
          const jsEntries = Object.keys(compilationAssets).filter(
            (filePath) =>
              filePath.startsWith("index.") && filePath.endsWith(".js")
          );
          if (!jsEntries) {
            throw new Error(
              `No js files in dist of bricks/${this.packageName}`
            );
          }
          if (jsEntries.length > 1) {
            throw new Error(
              `Only a single js entry is allowed in dist of bricks/${this.packageName}, but ${jsEntries.length} entries were found`
            );
          }
          const jsFilePath = `bricks/${this.packageName}/dist/${jsEntries[0]}`;

          const bricksJson = JSON.stringify(
            {
              id: `bricks/${this.packageName}`,
              bricks: this.bricks,
              elements: this.elements,
              processors: this.processors,
              dependencies: this.dependencies,
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
          console.log("Defined elements:", this.elements);
          console.log("Defined processors:", this.processors);
          console.log("Found dependencies:", this.dependencies);
          callback();
        }
      );
    });
  }
}
