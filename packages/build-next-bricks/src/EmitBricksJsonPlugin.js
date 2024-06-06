import webpack from "webpack";

/**
 * @typedef {import("@next-core/brick-manifest").PackageManifest} PackageManifest
 */

const pluginName = "EmitBricksJsonPlugin";

export default class EmitBricksJsonPlugin {
  /**
   * @param {{ packageName: string; bricks: string[]; processors: string[]; dependencies: Record<string, string[]>; manifest: PackageManifest; examples: Record<string, {doc: string}> }} options
   */
  constructor(options) {
    this.packageName = options.packageName;
    this.bricks = options.bricks;
    this.elements = options.elements;
    this.processors = options.processors;
    this.editors = options.editors;
    this.dependencies = options.dependencies;
    this.manifest = options.manifest;
    this.types = options.types;
    this.examples = options.examples;
    this.deprecatedElements = options.deprecatedElements;
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
              editors: this.editors,
              dependencies: this.dependencies,
              filePath: jsFilePath,
              deprecatedElements: this.deprecatedElements,
            },
            null,
            2
          );

          compilation.emitAsset(
            "bricks.json",
            new webpack.sources.RawSource(bricksJson, false)
          );

          const manifestJson = JSON.stringify(this.manifest, null, 2);
          compilation.emitAsset(
            "manifest.json",
            new webpack.sources.RawSource(manifestJson, false)
          );

          const typesJson = JSON.stringify(this.types, null, 2);
          compilation.emitAsset(
            "types.json",
            new webpack.sources.RawSource(typesJson, false)
          );

          const examplesJson = JSON.stringify(this.examples, null, 2);
          compilation.emitAsset(
            "examples.json",
            new webpack.sources.RawSource(examplesJson, false)
          );

          console.log("Defined bricks:", this.bricks);
          console.log("Defined elements:", this.elements);
          console.log("Defined processors:", this.processors);
          console.log("Found dependencies:", this.dependencies);
          console.log("Found deprecated elements:", this.deprecatedElements);
          callback();
        }
      );
    });
  }
}
