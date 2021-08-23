const { merge } = require("webpack-merge");
const { lessReplacePlugin } = require("@next-core/less-plugin-css-variables");
const common = require("./webpack.common.js");
const devServerOptions = require("./dev-server");

const publicPath = process.env.SUBDIR === "true" ? "/next/" : "/";

module.exports = merge(common, {
  mode: "development",
  devtool: "source-map",
  output: {
    filename: "[name].js",
    publicPath,
  },
  devServer: {
    host: "localhost",
    port: 8081,
    devMiddleware: {
      publicPath,
    },
    open: [publicPath],
    hot: true,
    historyApiFallback: {
      // Paths with dots should still use the history fallback.
      // Ref https://github.com/facebook/create-react-app/issues/387.
      disableDotRule: true,
      // Ref https://github.com/webpack/webpack-dev-server/issues/216#issuecomment-309436276
      index: publicPath,
    },
    ...devServerOptions,
  },
  module: {
    rules: [
      {
        test: /\.less$/,
        sideEffects: true,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                sourceMap: true,
                javascriptEnabled: true,
                plugins: [lessReplacePlugin],
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        sideEffects: true,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
});
