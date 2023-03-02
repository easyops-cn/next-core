const path = require("path");
const webpack = require("webpack");
const {
  dll: { NextDllPlugin, NextHashedModuleIdsPlugin },
  CleanWebpackPlugin,
} = require("@next-core/webpack-config-factory");
const packageJson = require("./package.json");

const isProd = process.env.NODE_ENV === "production";
const appRoot = path.join(__dirname, "..", "..");
const distPath = path.join(__dirname, "dist");

module.exports = {
  context: appRoot,
  devtool: "source-map",
  mode: isProd ? "production" : "development",
  entry: {
    dll: Object.keys(packageJson.peerDependencies).flatMap((dep) => {
      if (dep === "@babel/runtime") {
        const babelRuntime = require(`${dep}/package.json`);
        return (
          Object.keys(babelRuntime.exports)
            // Ignore `./helpers/esm/*`.
            .filter((exp) => /^\.\/helpers\/[^/]+$/.test(exp))
            .map((exp) => `${dep}/${exp.substr(1)}`)
        );
      }
      return dep;
    }), //.map(k => k.replace("@next-core/", "@easyops/")),
  },
  output: {
    filename: isProd ? "[name].[contenthash].js" : "[name].bundle.js",
    path: distPath,
    library: "[name]",
    hashDigestLength: 8,
    // This will be replaced during @next-core/brick-container building.
    // See `packages/brick-container/webpack/common.js`.
    publicPath: "__DLL_PUBLIC_PATH__",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
      {
        // - `rc-editor-mention` (which required `draft-js`) is deprecated in `antd Mentions`
        test: /node_modules\/rc-editor-mention\//,
        use: "null-loader",
      },
    ],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: false,
      },
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new NextDllPlugin({
      name: "[name]",
      path: path.join(distPath, "manifest.json"),
      format: !isProd,
      migrateToBrickNextV3: true,
    }),
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh|en/),
    new NextHashedModuleIdsPlugin({ migrateToBrickNextV3: true }),
    new webpack.IgnorePlugin({
      // - `esprima` and `buffer` are optional imported by `js-yaml`
      // we don't need them.
      resourceRegExp: /^(?:esprima)$/,
    }),
  ],
  resolve: {
    // only resolve .js extension files
    // Note that we does not resolve .json for significantly lower IO requests
    extensions: [".ts", ".js"],
    // modules: [path.join(appRoot, "node_modules")],
    symlinks: false,
    alias: {
      "brick-kit$": "@next-core/brick-kit-v3",
      "brick-http$": "@next-core/brick-http-v3",
      history$: "@next-core/history-v3",
      i18next$: "@next-core/i18next-v3",
      "react-i18next$": "@next-core/react-i18next-v3",
      lodash$: "@next-core/lodash-v3",
      moment$: "@next-core/moment-v3",
      "js-yaml$": "@next-core/js-yaml-v3",
    },
  },
  performance: {
    hints: false,
  },
};
