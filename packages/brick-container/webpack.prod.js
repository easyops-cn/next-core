const { merge } = require("webpack-merge");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { lessReplacePlugin } = require("@next-core/less-plugin-css-variables");
const common = require("./webpack.common.js");

const publicPath = "";

module.exports = merge(common, {
  mode: "production",
  output: {
    filename: "[name].[contenthash].js",
    publicPath,
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.less$/,
        sideEffects: true,
        use: [
          MiniCssExtractPlugin.loader,
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
        // Ref https://github.com/webpack-contrib/mini-css-extract-plugin/issues/118
        sideEffects: true,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].[contenthash].css",
      chunkFilename: "[id].css",
    }),
  ],
});
