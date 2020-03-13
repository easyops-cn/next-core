const path = require("path");
const webpack = require("webpack");
const packageJson = require("./package.json");

const isProd = process.env.NODE_ENV === "production";
const appRoot = path.join(__dirname, "..", "..");
const distPath = path.join(__dirname, "dist");

module.exports = {
  context: appRoot,
  devtool: "source-map",
  mode: isProd ? "production" : "development",
  entry: {
    dll: Object.keys(packageJson.dependencies)
  },
  output: {
    filename: "[name].js",
    path: distPath,
    library: "[name]"
  },
  module: {
    rules: [
      {
        // - `rc-editor-mention` (which required `draft-js`) is deprecated in `antd Mentions`
        test: /node_modules\/rc-editor-mention\//,
        use: "null-loader"
      }
    ]
  },
  plugins: [
    new webpack.DllPlugin({
      name: "[name]",
      path: path.join(distPath, "manifest.json")
    }),
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh|en/),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.IgnorePlugin({
      // - `esprima` and `buffer` are optional imported by `js-yaml`
      // we don't need them.
      resourceRegExp: /^(?:esprima|buffer)$/
    })
  ],
  resolve: {
    // only resolve .js extension files
    // Note that we does not resolve .json for significantly lower IO requests
    extensions: [".ts", ".js"],
    // modules: [path.join(appRoot, "node_modules")],
    symlinks: false
    // alias: resolverAlias
  },
  performance: {
    hints: false
  }
};
