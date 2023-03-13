const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { lessReplacePlugin } = require("@next-core/less-plugin-css-variables");

module.exports = {
  entry: {
    main: path.join(__dirname, "src/index.less"),
    global: path.join(__dirname, "src/global.less"),
  },
  output: {
    path: path.join(__dirname, "dist"),
    publicPath: "",
  },
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
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
  ],
};
